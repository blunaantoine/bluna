import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "@/lib/db";
import { fcfa, remaining, siteUrl } from "@/lib/invoices";
import { sendAlert, sendAlertWithPhoto } from "@/lib/notify";
import { proofDir } from "@/lib/uploads";
import { analyzePayment, verdictLabel } from "@/lib/receipt-ai";

const MAX = 12 * 1024 * 1024;

/**
 * Le client signale un transfert Mobile Money et joint la capture d'écran du paiement.
 * Antoine reçoit la capture (Telegram / e-mail) et valide dans l'admin.
 */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await db.invoice.findUnique({ where: { token }, include: { client: true, payments: true } });
  if (!inv || inv.status === "brouillon" || inv.status === "annulee") return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const due = remaining(inv);
  const amount = Math.round(Number(form.get("amount")) || 0);
  const operator = form.get("operator") === "flooz" ? "Flooz" : "T-Money";
  const payerPhone = String(form.get("phone") || "").trim().slice(0, 40);
  const file = form.get("proof");

  // Seul le montant est obligatoire. La capture est facultative (elle accélère la vérification).
  const hasProof = file instanceof File && file.size > 0;
  const errors: Record<string, string> = {};
  if (amount <= 0 || amount > due) errors.amount = `Montant invalide (au plus ${fcfa(due)}).`;
  if (hasProof && !(file as File).type.startsWith("image/")) errors.proof = "La capture doit être une image (photo ou capture d'écran).";
  else if (hasProof && (file as File).size > MAX) errors.proof = "Image trop lourde (12 Mo maximum).";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });
  if (inv.payments.filter((p) => p.status === "en_attente" && p.method === "mobile").length >= 3)
    return NextResponse.json({ error: "Plusieurs paiements sont déjà en cours de vérification. Antoine vous recontacte." }, { status: 429 });

  // Ré-encodage : vérifie que c'est une vraie image, retire les métadonnées (GPS…) et allège le fichier.
  let jpeg: Buffer | null = null, name = "";
  if (hasProof) {
    try {
      jpeg = await sharp(Buffer.from(await (file as File).arrayBuffer())).rotate().resize({ width: 1600, height: 2400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
    } catch {
      return NextResponse.json({ errors: { proof: "Cette image ne peut pas être lue. Essayez une autre capture, ou envoyez sans capture." } }, { status: 422 });
    }
    name = `${inv.number}-${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.jpg`;
    await mkdir(proofDir(), { recursive: true });
    await writeFile(path.join(proofDir(), name), jpeg);
  }

  const payment = await db.payment.create({ data: { invoiceId: inv.id, amount, method: "mobile", provider: operator, payerName: inv.client.name, payerPhone, proof: name } });

  const title = `À vérifier : ${fcfa(amount)} par ${operator} — facture ${inv.number}`;
  const base = `${inv.client.name} indique avoir envoyé ${fcfa(amount)} par ${operator}${payerPhone ? ` depuis le ${payerPhone}` : ""}.`;
  const admin = `\nVérifiez sur votre relevé ${operator}, puis validez dans l'admin : ${siteUrl()}/admin/factures`;
  if (jpeg) {
    // Lecture automatique de la capture (gratuite, sur le serveur)
    const a = await analyzePayment(payment.id, jpeg);
    const aiText = a
      ? `\n\nLecture automatique : ${verdictLabel[a.verdict].toUpperCase()}\n` +
        a.checks.map((c) => `${c.ok === true ? "✅" : c.ok === false ? "❌" : "❔"} ${c.label} : ${c.detail}`).join("\n")
      : "";
    await sendAlertWithPhoto(a?.verdict === "suspect" ? `⚠️ Suspect — ${title}` : title, `${base} Capture jointe.${aiText}${admin}`, jpeg);
  } else {
    await sendAlert(title, `${base} Aucune capture jointe.${admin}`);
  }
  return NextResponse.json({ ok: true, paymentId: payment.id });
}

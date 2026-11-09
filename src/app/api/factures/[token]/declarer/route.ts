import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "@/lib/db";
import { fcfa, remaining, siteUrl } from "@/lib/invoices";
import { sendAlertWithPhoto } from "@/lib/notify";
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

  const errors: Record<string, string> = {};
  if (amount <= 0 || amount > due) errors.amount = `Montant invalide (au plus ${fcfa(due)}).`;
  if (payerPhone.replace(/\D/g, "").length < 8) errors.phone = "Indiquez le numéro qui a envoyé l'argent.";
  if (!(file instanceof File) || file.size === 0) errors.proof = "Ajoutez la capture d'écran de votre paiement.";
  else if (!file.type.startsWith("image/")) errors.proof = "La capture doit être une image (photo ou capture d'écran).";
  else if (file.size > MAX) errors.proof = "Image trop lourde (12 Mo maximum).";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });
  if (inv.payments.filter((p) => p.status === "en_attente" && p.method === "mobile").length >= 3)
    return NextResponse.json({ error: "Plusieurs paiements sont déjà en cours de vérification. Antoine vous recontacte." }, { status: 429 });

  // Ré-encodage : vérifie que c'est une vraie image, retire les métadonnées (GPS…) et allège le fichier.
  let jpeg: Buffer;
  try {
    jpeg = await sharp(Buffer.from(await (file as File).arrayBuffer())).rotate().resize({ width: 1600, height: 2400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
  } catch {
    return NextResponse.json({ errors: { proof: "Cette image ne peut pas être lue. Essayez une autre capture." } }, { status: 422 });
  }
  const name = `${inv.number}-${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.jpg`;
  await mkdir(proofDir(), { recursive: true });
  await writeFile(path.join(proofDir(), name), jpeg);

  const payment = await db.payment.create({ data: { invoiceId: inv.id, amount, method: "mobile", provider: operator, payerName: inv.client.name, payerPhone, proof: name } });

  // Lecture de la capture par l'IA (si ANTHROPIC_API_KEY est configurée)
  const a = await analyzePayment(payment.id, jpeg);
  const aiText = a
    ? `\n\nLecture automatique : ${verdictLabel[a.verdict].toUpperCase()}\n` +
      a.checks.map((c) => `${c.ok === true ? "✅" : c.ok === false ? "❌" : "❔"} ${c.label} : ${c.detail}`).join("\n")
    : "";
  await sendAlertWithPhoto(
    `${a?.verdict === "suspect" ? "⚠️ Suspect" : "À vérifier"} : ${fcfa(amount)} par ${operator} — facture ${inv.number}`,
    `${inv.client.name} indique avoir envoyé ${fcfa(amount)} par ${operator} depuis le ${payerPhone}. Capture jointe.${aiText}\nValidez dans l'admin : ${siteUrl()}/admin/factures`,
    jpeg,
  );
  return NextResponse.json({ ok: true, paymentId: payment.id });
}

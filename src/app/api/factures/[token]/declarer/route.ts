import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fcfa, remaining, siteUrl } from "@/lib/invoices";
import { sendAlert } from "@/lib/notify";

/** Le client signale un paiement Mobile Money fait à la main. Antoine le valide dans l'admin. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await db.invoice.findUnique({ where: { token }, include: { client: true, payments: true } });
  if (!inv || inv.status === "brouillon" || inv.status === "annulee") return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });

  const due = remaining(inv);
  const b = await req.json().catch(() => ({}));
  const amount = Math.round(Number(b.amount) || 0);
  const operator = b.operator === "flooz" ? "Flooz" : "T-Money";
  const reference = String(b.reference || "").trim().slice(0, 80);
  const payerPhone = String(b.phone || "").trim().slice(0, 40);

  const errors: Record<string, string> = {};
  if (amount <= 0 || amount > due) errors.amount = `Indiquez le montant envoyé (au plus ${fcfa(due)}).`;
  if (reference.length < 4) errors.reference = "Indiquez la référence du SMS de confirmation.";
  if (payerPhone.replace(/\D/g, "").length < 8) errors.phone = "Indiquez le numéro qui a envoyé l'argent.";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });
  if (inv.payments.filter((p) => p.status === "en_attente" && p.method === "mobile").length >= 3)
    return NextResponse.json({ error: "Plusieurs paiements sont déjà en cours de vérification. Antoine vous recontacte." }, { status: 429 });

  await db.payment.create({ data: { invoiceId: inv.id, amount, method: "mobile", provider: operator, reference, payerName: inv.client.name, payerPhone } });
  await sendAlert(
    `À vérifier : ${fcfa(amount)} par ${operator} — facture ${inv.number}`,
    `${inv.client.name} indique avoir envoyé ${fcfa(amount)} par ${operator} depuis le ${payerPhone}.\nRéférence : ${reference}\nVérifiez sur votre téléphone puis validez : ${siteUrl()}/admin/factures`,
  );
  return NextResponse.json({ ok: true });
}

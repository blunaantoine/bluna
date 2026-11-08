import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { refreshInvoice, remaining } from "@/lib/invoices";

/** Enregistre un paiement reçu hors ligne (espèces, virement, Mobile Money vérifié). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await db.invoice.findUnique({ where: { id } });
  if (!inv) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const amount = Math.round(Number(b.amount) || 0);
  const method = ["especes", "virement", "mobile"].includes(b.method) ? b.method : "especes";
  if (amount <= 0 || amount > remaining(inv)) return NextResponse.json({ error: "Montant invalide : il doit être positif et ne pas dépasser le reste à payer." }, { status: 422 });
  await db.payment.create({ data: { invoiceId: id, amount, method, status: "valide", confirmedAt: new Date(), reference: String(b.reference || "").slice(0, 80) } });
  const updated = await refreshInvoice(id);
  return NextResponse.json({ invoice: updated });
}

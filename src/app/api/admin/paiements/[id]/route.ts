import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { refreshInvoice } from "@/lib/invoices";
import { syncFedapayPayment } from "@/lib/payments";

/** Valider ou refuser un paiement Mobile Money déclaré, ou revérifier un paiement FedaPay. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const p = await db.payment.findUnique({ where: { id } });
  if (!p) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });

  if (b.action === "verifier" && p.transactionId) {
    try { await syncFedapayPayment(p.transactionId); } catch { return NextResponse.json({ error: "FedaPay ne répond pas, réessayez plus tard." }, { status: 502 }); }
  } else if (b.action === "valider" || b.action === "refuser") {
    if (p.method === "fedapay") return NextResponse.json({ error: "Un paiement FedaPay se vérifie automatiquement." }, { status: 400 });
    await db.payment.update({ where: { id }, data: { status: b.action === "valider" ? "valide" : "refuse", confirmedAt: b.action === "valider" ? new Date() : null } });
  } else return NextResponse.json({ error: "Action inconnue." }, { status: 400 });

  await refreshInvoice(p.invoiceId);
  return NextResponse.json({ ok: true });
}

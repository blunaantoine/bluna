import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { refreshInvoice } from "@/lib/invoices";
import { invoiceInput } from "../validate";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const inv = await db.invoice.findUnique({ where: { id } });
  if (!inv) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });

  if (b.action === "annuler") { await db.invoice.update({ where: { id }, data: { status: "annulee" } }); return NextResponse.json({ ok: true }); }
  if (b.action === "reactiver" || b.action === "envoyer") {
    await db.invoice.update({ where: { id }, data: { status: "envoyee" } });
    await refreshInvoice(id);
    return NextResponse.json({ ok: true });
  }

  if (inv.amountPaid > 0) return NextResponse.json({ error: "Cette facture a déjà reçu un paiement : son contenu ne peut plus changer. Annulez-la et créez-en une nouvelle si besoin." }, { status: 409 });
  const parsed = invoiceInput(b);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 });
  await db.invoice.update({ where: { id }, data: { ...parsed.data, ...(typeof b.clientId === "string" ? { clientId: b.clientId } : {}) } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paid = await db.payment.count({ where: { invoiceId: id, status: "valide" } });
  if (paid) return NextResponse.json({ error: "Une facture payée ne peut pas être supprimée. Vous pouvez l'annuler." }, { status: 409 });
  await db.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

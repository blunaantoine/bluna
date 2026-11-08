import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newToken } from "@/lib/invoices";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const data: Record<string, string> = {};
  for (const k of ["name", "company", "phone", "email"]) if (typeof b[k] === "string") data[k] = b[k].trim().slice(0, 160);
  if (b.regenerateLink === true) data.token = newToken(); // l'ancien lien cesse de fonctionner
  const client = await db.client.update({ where: { id }, data });
  return NextResponse.json({ client });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paid = await db.payment.count({ where: { invoice: { clientId: id }, status: "valide" } });
  if (paid) return NextResponse.json({ error: "Ce client a des paiements enregistrés : sa fiche est conservée pour votre comptabilité." }, { status: 409 });
  await db.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

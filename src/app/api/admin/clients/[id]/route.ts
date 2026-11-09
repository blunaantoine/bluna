import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { newToken } from "@/lib/invoices";
import { proofDir } from "@/lib/uploads";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const data: Record<string, string> = {};
  for (const k of ["name", "company", "phone", "email"]) if (typeof b[k] === "string") data[k] = b[k].trim().slice(0, 160);
  if (b.regenerateLink === true) data.token = newToken(); // l'ancien lien cesse de fonctionner
  const client = await db.client.update({ where: { id }, data });
  return NextResponse.json({ client });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const force = new URL(req.url).searchParams.get("force") === "1";
  const client = await db.client.findUnique({ where: { id }, include: { invoices: { include: { payments: true } } } });
  if (!client) return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  const payments = client.invoices.flatMap((i) => i.payments);
  const paid = payments.filter((p) => p.status === "valide").length;
  if (paid && !force)
    return NextResponse.json({ error: `${client.name} a ${paid} paiement(s) enregistré(s). Le supprimer effacera aussi ses factures et l'historique de ces paiements.`, needsForce: true }, { status: 409 });
  // Supprime aussi les captures de paiement stockées sur le disque
  await Promise.all(payments.filter((p) => p.proof).map((p) => unlink(path.join(proofDir(), p.proof)).catch(() => {})));
  await db.client.delete({ where: { id } }); // factures et paiements supprimés en cascade
  return NextResponse.json({ ok: true, invoices: client.invoices.length });
}

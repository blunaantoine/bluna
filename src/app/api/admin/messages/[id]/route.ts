import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const STATUSES = ["nouveau", "lu", "repondu", "archive"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json().catch(() => ({}));
  if (!STATUSES.includes(status)) return NextResponse.json({ error: "Statut inconnu." }, { status: 400 });
  await db.message.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.message.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

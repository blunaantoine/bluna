import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenseInput } from "@/lib/expenses";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, data } = expenseInput(await req.json().catch(() => ({})), true);
  if (error || !data) return NextResponse.json({ error }, { status: 422 });
  const expense = await db.expense.update({ where: { id }, data }).catch(() => null);
  return expense ? NextResponse.json({ expense }) : NextResponse.json({ error: "Dépense introuvable." }, { status: 404 });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.expense.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

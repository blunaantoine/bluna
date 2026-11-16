import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenseInput, expensesBetween, periodRange } from "@/lib/expenses";

export const dynamic = "force-dynamic";

/** Liste des dépenses d'un mois (?annee=2026&mois=11) ou d'une année (?annee=2026). */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const year = Number(u.searchParams.get("annee")) || new Date().getFullYear();
  const m = Number(u.searchParams.get("mois"));
  const { start, end } = periodRange(year, m >= 1 && m <= 12 ? m : null);
  const expenses = await expensesBetween(start, end);
  return NextResponse.json({ expenses, total: expenses.reduce((a, e) => a + e.amount, 0) });
}

export async function POST(req: Request) {
  const { error, data } = expenseInput(await req.json().catch(() => ({})));
  if (error || !data) return NextResponse.json({ error }, { status: 422 });
  const expense = await db.expense.create({ data: data as Required<typeof data> });
  return NextResponse.json({ expense });
}

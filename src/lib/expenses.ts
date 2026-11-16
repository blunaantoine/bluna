import { db } from "./db";

import { EXPENSE_CATEGORIES } from "./expense-labels";
export { EXPENSE_CATEGORIES, EXPENSE_METHODS } from "./expense-labels";

/** Période [début, fin[ : un mois (1-12) ou l'année entière. */
export function periodRange(year: number, month: number | null) {
  return { start: new Date(year, month ? month - 1 : 0, 1), end: month ? new Date(year, month, 1) : new Date(year + 1, 0, 1) };
}

export async function expensesBetween(start: Date, end: Date) {
  return db.expense.findMany({ where: { date: { gte: start, lt: end } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }] });
}

/** Vérifie une dépense envoyée par l'admin. */
export function expenseInput(b: Record<string, unknown>, partial = false) {
  const out: { date?: Date; label?: string; category?: string; amount?: number; method?: string; notes?: string } = {};
  const err = (e: string) => ({ error: e, data: null });
  if (!partial || b.label !== undefined) { const l = String(b.label ?? "").trim().slice(0, 140); if (!l) return err("Indiquez l'objet de la dépense."); out.label = l; }
  if (!partial || b.amount !== undefined) { const a = Math.round(Number(b.amount)); if (!(a > 0) || a > 1e10) return err("Montant invalide."); out.amount = a; }
  if (!partial || b.date !== undefined) { const d = new Date(String(b.date ?? "")); if (isNaN(+d)) return err("Date invalide."); out.date = d; }
  if (b.category !== undefined) out.category = String(b.category) in EXPENSE_CATEGORIES ? String(b.category) : "autre";
  if (b.method !== undefined) out.method = String(b.method).slice(0, 40);
  if (b.notes !== undefined) out.notes = String(b.notes).slice(0, 500);
  return { error: null, data: out };
}

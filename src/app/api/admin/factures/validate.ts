import { linesTotal, type Line } from "@/lib/invoices";

export function invoiceInput(b: Record<string, unknown>) {
  const items: Line[] = Array.isArray(b.items)
    ? (b.items as Line[]).map((l) => ({ label: String(l.label || "").trim().slice(0, 200), qty: Math.max(0, Number(l.qty) || 0), unitPrice: Math.max(0, Math.round(Number(l.unitPrice) || 0)) })).filter((l) => l.label && l.qty > 0)
    : [];
  const title = String(b.title || "").trim().slice(0, 160);
  const discount = Math.max(0, Math.round(Number(b.discount) || 0));
  if (!title) return { error: "Donnez un titre à la facture (ex. « Logo et charte graphique »)." };
  if (!items.length) return { error: "Ajoutez au moins une ligne avec une quantité et un prix." };
  const total = linesTotal(items) - discount;
  if (total <= 0) return { error: "Le total doit être supérieur à 0 FCFA." };
  const dueAt = typeof b.dueAt === "string" && b.dueAt ? new Date(b.dueAt) : null;
  return {
    data: {
      title, discount, total,
      items: JSON.stringify(items),
      notes: String(b.notes || "").trim().slice(0, 2000),
      allowDeposit: b.allowDeposit === true,
      projectSlug: typeof b.projectSlug === "string" && b.projectSlug ? b.projectSlug : null,
      dueAt: dueAt && !isNaN(+dueAt) ? dueAt : null,
      status: b.status === "brouillon" ? "brouillon" : "envoyee",
    },
  };
}

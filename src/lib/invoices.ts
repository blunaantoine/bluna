import { randomBytes } from "node:crypto";
import type { Client, Invoice, Payment } from "@prisma/client";
import { db } from "./db";

export type Line = { label: string; qty: number; unitPrice: number };

export const newToken = () => randomBytes(18).toString("base64url");

export const fcfa = (n: number) => `${new Intl.NumberFormat("fr-FR").format(Math.round(n)).replace(/ | /g, " ")} FCFA`;

export const parseLines = (s: string): Line[] => {
  try {
    return (JSON.parse(s) as Line[]).map((l) => ({ label: String(l.label), qty: Number(l.qty) || 0, unitPrice: Math.round(Number(l.unitPrice) || 0) }));
  } catch { return []; }
};

export const linesTotal = (lines: Line[]) => lines.reduce((a, l) => a + Math.round(l.qty * l.unitPrice), 0);

/** Numéro lisible et unique : BLU-2026-001, BLU-2026-002… */
export async function nextNumber() {
  const year = new Date().getFullYear();
  const prefix = `BLU-${year}-`;
  const last = await db.invoice.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: "desc" }, select: { number: true } });
  const n = last ? parseInt(last.number.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
}

export const remaining = (inv: Pick<Invoice, "total" | "amountPaid">) => Math.max(0, inv.total - inv.amountPaid);

export const STATUS_LABEL: Record<string, string> = {
  brouillon: "Brouillon",
  envoyee: "À payer",
  partielle: "Acompte reçu",
  payee: "Payée",
  annulee: "Annulée",
};

export function isOverdue(inv: Pick<Invoice, "dueAt" | "status">) {
  return !!inv.dueAt && inv.dueAt < new Date() && (inv.status === "envoyee" || inv.status === "partielle");
}

/** Recalcule le montant payé et le statut à partir des paiements validés. */
export async function refreshInvoice(invoiceId: string) {
  const inv = await db.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
  if (!inv) return null;
  const paid = inv.payments.filter((p) => p.status === "valide").reduce((a, p) => a + p.amount, 0);
  let status = inv.status;
  if (status !== "annulee" && status !== "brouillon") status = paid >= inv.total ? "payee" : paid > 0 ? "partielle" : "envoyee";
  return db.invoice.update({
    where: { id: inv.id },
    data: { amountPaid: paid, status, paidAt: status === "payee" ? inv.paidAt ?? new Date() : null },
  });
}

export type PublicInvoice = Omit<Invoice, "items" | "clientId"> & { items: Line[]; remaining: number; overdue: boolean; client: Pick<Client, "name" | "company" | "token">; payments: Pick<Payment, "id" | "amount" | "method" | "status" | "createdAt" | "confirmedAt" | "reference">[] };

export function toPublic(inv: Invoice & { client: Client; payments: Payment[] }): PublicInvoice {
  const { clientId: _c, items, ...rest } = inv;
  return {
    ...rest,
    items: parseLines(items),
    remaining: remaining(inv),
    overdue: isOverdue(inv),
    client: { name: inv.client.name, company: inv.client.company, token: inv.client.token },
    payments: inv.payments
      .filter((p) => p.status === "valide" || p.status === "en_attente")
      .map((p) => ({ id: p.id, amount: p.amount, method: p.method, status: p.status, createdAt: p.createdAt, confirmedAt: p.confirmedAt, reference: p.reference })),
  };
}

export const siteUrl = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const invoiceUrl = (token: string) => `${siteUrl()}/facture/${token}`;
export const clientSpaceUrl = (token: string) => `${siteUrl()}/espace/${token}`;

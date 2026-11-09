import { db } from "./db";
import { parseLines } from "./invoices";

export type Period = { year: number; month: number | null }; // month 1-12, null = année entière

const METHOD: Record<string, string> = { fedapay: "Paiement en ligne", mobile: "Mobile Money", especes: "Espèces", virement: "Virement" };
export const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

const range = ({ year, month }: Period) => {
  const start = new Date(year, month ? month - 1 : 0, 1);
  const end = month ? new Date(year, month, 1) : new Date(year + 1, 0, 1);
  return { start, end };
};
/** Date à laquelle l'argent a été reçu : date lue sur la capture, sinon validation, sinon création. */
const payDate = (p: { paidOn: Date | null; confirmedAt: Date | null; createdAt: Date }) => p.paidOn ?? p.confirmedAt ?? p.createdAt;

export async function buildReport(period: Period) {
  const { start, end } = range(period);
  const [invoices, payments, open] = await Promise.all([
    db.invoice.findMany({ where: { issuedAt: { gte: start, lt: end }, status: { notIn: ["brouillon", "annulee"] } }, include: { client: true } }),
    db.payment.findMany({ where: { status: "valide" }, include: { invoice: { include: { client: true } } } }),
    db.invoice.findMany({ where: { status: { in: ["envoyee", "partielle"] } }, include: { client: true }, orderBy: { dueAt: "asc" } }),
  ]);
  const inPeriod = payments.filter((p) => { const d = payDate(p); return d >= start && d < end; });

  const invoiced = invoices.reduce((a, i) => a + i.total, 0);
  const collected = inPeriod.reduce((a, p) => a + p.amount, 0);
  const collectedOnPeriodInvoices = invoices.reduce((a, i) => a + i.amountPaid, 0);

  // Répartition par moyen de paiement (Mobile Money détaillé par opérateur)
  const byMethod = new Map<string, number>();
  for (const p of inPeriod) {
    const k = p.method === "mobile" ? `Mobile Money · ${p.provider || "?"}` : METHOD[p.method] ?? p.method;
    byMethod.set(k, (byMethod.get(k) ?? 0) + p.amount);
  }
  // Meilleurs clients (encaissements de la période)
  const byClient = new Map<string, { name: string; amount: number; count: number }>();
  for (const p of inPeriod) {
    const c = p.invoice.client; const cur = byClient.get(c.id) ?? { name: c.name + (c.company ? ` (${c.company})` : ""), amount: 0, count: 0 };
    cur.amount += p.amount; cur.count += 1; byClient.set(c.id, cur);
  }
  // Prestations les plus facturées (lignes des factures)
  const byService = new Map<string, number>();
  for (const i of invoices) for (const l of parseLines(i.items)) byService.set(l.label, (byService.get(l.label) ?? 0) + Math.round(l.qty * l.unitPrice));

  // Courbe mensuelle (seulement pour une année entière)
  const monthly = period.month ? null : MONTHS.map((label, m) => {
    const s = new Date(period.year, m, 1), e = new Date(period.year, m + 1, 1);
    return {
      label,
      invoiced: invoices.filter((i) => i.issuedAt >= s && i.issuedAt < e).reduce((a, i) => a + i.total, 0),
      collected: payments.filter((p) => { const d = payDate(p); return d >= s && d < e; }).reduce((a, p) => a + p.amount, 0),
    };
  });

  const now = new Date();
  return {
    period, start: start.toISOString(), end: end.toISOString(),
    kpis: {
      invoiced, collected,
      outstanding: Math.max(0, invoiced - collectedOnPeriodInvoices),
      recoveryRate: invoiced ? Math.round((collectedOnPeriodInvoices / invoiced) * 100) : null,
      invoiceCount: invoices.length,
      paymentCount: inPeriod.length,
      clientCount: new Set(invoices.map((i) => i.clientId)).size,
      averageInvoice: invoices.length ? Math.round(invoiced / invoices.length) : 0,
    },
    byMethod: [...byMethod].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount),
    topClients: [...byClient.values()].sort((a, b) => b.amount - a.amount).slice(0, 8),
    topServices: [...byService].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount).slice(0, 8),
    monthly,
    payments: inPeriod.sort((a, b) => +payDate(a) - +payDate(b)).map((p) => ({
      date: payDate(p).toISOString(), client: p.invoice.client.name, invoice: p.invoice.number, title: p.invoice.title,
      method: p.method === "mobile" ? `Mobile Money (${p.provider})` : METHOD[p.method] ?? p.method, reference: p.reference, amount: p.amount,
    })),
    unpaid: open.map((i) => ({ number: i.number, client: i.client.name, title: i.title, due: i.dueAt?.toISOString() ?? null, overdue: !!i.dueAt && i.dueAt < now, remaining: i.total - i.amountPaid, token: i.token })),
  };
}

export type Report = Awaited<ReturnType<typeof buildReport>>;

/** Export tableur (CSV, séparateur « ; » pour Excel en français). */
export function reportCsv(r: Report) {
  const cell = (v: unknown) => { const s = String(v ?? ""); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const line = (...v: unknown[]) => v.map(cell).join(";");
  const label = r.period.month ? `${MONTHS[r.period.month - 1]} ${r.period.year}` : `année ${r.period.year}`;
  const out = [
    line(`Rapport OQUI — ${label}`), "",
    line("Facturé", r.kpis.invoiced), line("Encaissé", r.kpis.collected), line("Reste à encaisser (factures de la période)", r.kpis.outstanding),
    line("Factures émises", r.kpis.invoiceCount), line("Paiements reçus", r.kpis.paymentCount), "",
    line("Paiements"), line("Date", "Client", "Facture", "Prestation", "Moyen", "Référence", "Montant (FCFA)"),
    ...r.payments.map((p) => line(new Date(p.date).toLocaleDateString("fr-FR"), p.client, p.invoice, p.title, p.method, p.reference, p.amount)),
  ];
  if (r.monthly) out.push("", line("Mois", "Facturé", "Encaissé"), ...r.monthly.map((m) => line(m.label, m.invoiced, m.collected)));
  out.push("", line("Factures à encaisser (à ce jour)"), line("Facture", "Client", "Prestation", "Échéance", "En retard", "Reste (FCFA)"),
    ...r.unpaid.map((u) => line(u.number, u.client, u.title, u.due ? new Date(u.due).toLocaleDateString("fr-FR") : "", u.overdue ? "oui" : "non", u.remaining)));
  return "﻿" + out.join("\r\n");
}

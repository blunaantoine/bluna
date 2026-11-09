import { db } from "./db";
import { fcfa, invoiceUrl } from "./invoices";
import { resendEnabled, sendEmail } from "./resend";
import { profile } from "@/content/site";

const METHOD: Record<string, string> = { fedapay: "Paiement en ligne (FedaPay)", mobile: "Mobile Money", especes: "Espèces", virement: "Virement" };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const dateFr = (d: Date) => d.toLocaleString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lome" });

/** Construit le reçu (HTML compatible avec les messageries + version texte). */
export async function buildReceipt(paymentId: string) {
  const p = await db.payment.findUnique({ where: { id: paymentId }, include: { invoice: { include: { client: true, payments: { where: { status: "valide" }, orderBy: { createdAt: "asc" } } } } } });
  if (!p) return null;
  const inv = p.invoice;
  const index = inv.payments.findIndex((x) => x.id === p.id) + 1;
  const number = `${inv.number}-R${index || 1}`;
  const paidAt = p.paidOn ?? p.confirmedAt ?? p.createdAt;
  const left = Math.max(0, inv.total - inv.amountPaid);
  const method = p.method === "mobile" ? `Mobile Money (${p.provider})` : METHOD[p.method] ?? p.method;
  const link = invoiceUrl(inv.token);
  const first = inv.client.name.split(" ")[0];
  const rows: [string, string][] = [
    ["Reçu n°", number], ["Facture", `${inv.number} — ${inv.title}`], ["Date du paiement", dateFr(paidAt)], ["Moyen de paiement", method],
    ...(p.reference ? [["Référence", p.reference] as [string, string]] : []),
    ...(inv.discount > 0 ? [["Remise" + (inv.discountLabel ? ` (${inv.discountLabel})` : ""), `− ${fcfa(inv.discount)}`] as [string, string]] : []),
    ["Total de la facture", fcfa(inv.total)], ["Reste à payer", left ? fcfa(left) : "0 FCFA — facture réglée"],
  ];
  const subject = `Votre reçu ${number} — ${fcfa(p.amount)} — ${profile.studio}`;
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f3f1ec;font-family:Helvetica,Arial,sans-serif;color:#16130e">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f1ec;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0d0d0e;padding:24px 28px;color:#f1f1f4;font-family:Georgia,serif;font-size:22px;letter-spacing:4px">OQUI</td></tr>
<tr><td style="padding:28px">
<p style="margin:0 0 6px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#6b6b73">Reçu de paiement</p>
<h1 style="margin:0 0 4px;font-family:Georgia,serif;font-weight:400;font-size:30px">${esc(fcfa(p.amount))}</h1>
<p style="margin:0 0 22px;color:#3a3a40">Merci ${esc(first)}, votre paiement a bien été reçu.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e4e2dc;font-size:14px">
${rows.map(([a, b]) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e4e2dc;color:#6b6b73">${esc(a)}</td><td align="right" style="padding:10px 0;border-bottom:1px solid #e4e2dc;font-weight:bold">${esc(b)}</td></tr>`).join("")}
</table>
<p style="margin:26px 0 0"><a href="${link}" style="display:inline-block;background:#0d0d0e;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:999px;font-size:14px;font-weight:bold">Voir ma facture</a></p>
<p style="margin:22px 0 0;font-size:13px;color:#6b6b73">Depuis votre facture, vous pouvez la télécharger en PDF. Une question ? Répondez à cet e-mail ou écrivez sur WhatsApp au ${esc(profile.phone)}.</p>
</td></tr>
<tr><td style="padding:16px 28px;background:#faf9f6;font-size:12px;color:#8d8d96">${esc(profile.studio)} · ${esc(profile.name)} · ${esc(profile.city)} · ${esc(profile.email)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [`Reçu de paiement — ${profile.studio}`, "", `Merci ${first}, votre paiement de ${fcfa(p.amount)} a bien été reçu.`, "", ...rows.map(([a, b]) => `${a} : ${b}`), "", `Voir la facture : ${link}`, "", `${profile.studio} · ${profile.phone} · ${profile.email}`].join("\n");
  return { subject, html, text, number, payment: p };
}

/**
 * Envoie le reçu d'un paiement validé à l'adresse demandée par le client (ou à celle de sa fiche).
 * Ne renvoie pas un reçu déjà envoyé, sauf si force. N'échoue jamais : renvoie le résultat.
 */
export async function sendReceipt(paymentId: string, opts: { force?: boolean; email?: string } = {}): Promise<"envoye" | "deja_envoye" | "en_attente" | "sans_email" | "desactive" | "erreur"> {
  if (!resendEnabled()) return "desactive";
  const p = await db.payment.findUnique({ where: { id: paymentId }, include: { invoice: { include: { client: true } } } });
  if (!p) return "erreur";
  const to = opts.email || p.receiptEmail || p.invoice.client.email;
  if (!to) return "sans_email";
  if (p.status !== "valide") return "en_attente";
  if (p.receiptSentAt && !opts.force) return "deja_envoye";
  try {
    const r = await buildReceipt(paymentId);
    if (!r) return "erreur";
    await sendEmail({ to, subject: r.subject, html: r.html, text: r.text, replyTo: process.env.RESEND_REPLY_TO || profile.email });
    await db.payment.update({ where: { id: paymentId }, data: { receiptSentAt: new Date(), receiptEmail: to } });
    return "envoye";
  } catch (e) {
    console.error("[reçu]", e);
    return "erreur";
  }
}

/** À appeler quand un paiement devient « validé » : envoie le reçu si le client l'a demandé. */
export async function sendReceiptIfRequested(paymentId: string) {
  const p = await db.payment.findUnique({ where: { id: paymentId }, select: { receiptEmail: true, receiptSentAt: true, status: true } });
  if (p && p.status === "valide" && p.receiptEmail && !p.receiptSentAt) await sendReceipt(paymentId);
}

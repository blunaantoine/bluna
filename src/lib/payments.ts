import { db } from "./db";
import { getTransaction, mapStatus } from "./fedapay";
import { fcfa, refreshInvoice, siteUrl } from "./invoices";
import { sendAlert } from "./notify";
import { sendReceiptIfRequested } from "./receipt-email";

/**
 * Relit une transaction chez FedaPay et met à jour le paiement et la facture.
 * Appelée au retour du client ET par le webhook : on ne fait jamais confiance
 * aux paramètres de l'URL, seulement à la réponse de l'API FedaPay.
 */
export async function syncFedapayPayment(transactionId: string) {
  const payment = await db.payment.findUnique({ where: { transactionId }, include: { invoice: { include: { client: true } } } });
  if (!payment) return null;
  if (payment.status === "valide") return payment;

  const tx = await getTransaction(transactionId);
  const status = mapStatus(tx.status);
  if (status === payment.status) return payment;
  if (status === "valide" && Math.round(tx.amount) !== payment.amount) {
    console.error(`[paiement] montant inattendu pour ${transactionId} : ${tx.amount} au lieu de ${payment.amount}`);
    return payment;
  }

  // Mise à jour conditionnelle : si le webhook et le retour client arrivent en même temps, un seul gagne.
  const { count } = await db.payment.updateMany({
    where: { id: payment.id, status: payment.status },
    data: { status, confirmedAt: status === "valide" ? new Date() : null, reference: tx.reference ?? payment.reference },
  });
  if (!count) return db.payment.findUnique({ where: { id: payment.id } });

  if (status === "valide") {
    const inv = await refreshInvoice(payment.invoiceId);
    await sendReceiptIfRequested(payment.id);
    const i = payment.invoice;
    await sendAlert(
      `Paiement reçu : ${fcfa(payment.amount)} — facture ${i.number}`,
      [
        `${i.client.name}${i.client.company ? ` (${i.client.company})` : ""} a payé ${fcfa(payment.amount)} par FedaPay.`,
        `Facture : ${i.number} — ${i.title}`,
        inv ? `Reste à payer : ${fcfa(Math.max(0, inv.total - inv.amountPaid))}` : "",
        `Référence FedaPay : ${tx.reference ?? transactionId}`,
        `${siteUrl()}/admin/factures`,
      ].filter(Boolean).join("\n"),
    );
  }
  return db.payment.findUnique({ where: { id: payment.id } });
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fcfa } from "@/lib/invoices";
import { syncFedapayPayment } from "@/lib/payments";
import ResultIcon from "@/components/billing/ResultIcon";
import AutoRefresh from "@/components/billing/AutoRefresh";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Paiement" };

/** Page de retour après FedaPay : on revérifie la transaction avant d'afficher quoi que ce soit. */
export default async function ReturnPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ id?: string }> }) {
  const { token } = await params;
  const { id } = await searchParams;
  const inv = await db.invoice.findUnique({ where: { token }, include: { client: true } });
  if (!inv) notFound();

  let payment = id ? await db.payment.findFirst({ where: { transactionId: String(id), invoiceId: inv.id } }) : null;
  let checkFailed = false;
  if (payment && payment.status === "en_attente") {
    try { payment = (await syncFedapayPayment(payment.transactionId!)) ?? payment; } catch { checkFailed = true; }
  }
  const fresh = await db.invoice.findUnique({ where: { id: inv.id } });
  const status = payment?.status ?? "inconnu";
  const left = fresh ? Math.max(0, fresh.total - fresh.amountPaid) : 0;

  const view =
    status === "valide" ? { kind: "ok" as const, title: `Merci ${inv.client.name.split(" ")[0]}, paiement reçu !`, text: `${fcfa(payment!.amount)} ont bien été payés pour la facture ${inv.number}. ${left ? `Il reste ${fcfa(left)} à régler.` : "Votre facture est entièrement réglée."} Antoine vient d'être prévenu.` }
    : status === "refuse" ? { kind: "ko" as const, title: "Le paiement a été refusé", text: "Aucun montant n'a été débité. Vérifiez votre solde ou essayez un autre moyen de paiement." }
    : status === "annule" ? { kind: "ko" as const, title: "Paiement annulé", text: "Vous avez quitté la page de paiement. Aucun montant n'a été débité." }
    : { kind: "wait" as const, title: "Paiement en cours de confirmation…", text: checkFailed ? "La confirmation prend plus de temps que prévu. Cette page se met à jour automatiquement ; vous pouvez aussi revenir plus tard." : "Validez la demande sur votre téléphone si on vous le demande. Cette page se met à jour toute seule." };

  return (
    <section className="wrap billing-page result">
      {view.kind === "wait" && <AutoRefresh seconds={5} />}
      <ResultIcon kind={view.kind} />
      <h1 className="display">{view.title}</h1>
      <p className="lead">{view.text}</p>
      <div className="hero-actions">
        <Link href={`/facture/${inv.token}`} className="btn">{view.kind === "ko" ? "Réessayer le paiement" : "Voir ma facture"}</Link>
        <Link href={`/espace/${inv.client.token}`} className="btn btn-ghost">Toutes mes factures</Link>
      </div>
    </section>
  );
}

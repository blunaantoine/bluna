import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fcfa, isOverdue, remaining, STATUS_LABEL } from "@/lib/invoices";
import { fedapayEnabled } from "@/lib/fedapay";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mes factures" };

const dateFr = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function ClientSpace({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const client = await db.client.findUnique({ where: { token }, include: { invoices: { where: { status: { not: "brouillon" } }, orderBy: { issuedAt: "desc" } } } });
  if (!client) notFound();

  const open = client.invoices.filter((i) => i.status === "envoyee" || i.status === "partielle");
  const done = client.invoices.filter((i) => i.status === "payee");
  const due = open.reduce((a, i) => a + remaining(i), 0);
  const first = client.name.split(" ")[0];

  const Row = ({ i }: { i: (typeof client.invoices)[number] }) => {
    const late = isOverdue(i);
    const toPay = i.status === "envoyee" || i.status === "partielle";
    return (
      <li>
        <Link href={`/facture/${i.token}${toPay ? "?payer=1" : ""}`} className={`inv-row${toPay ? " to-pay" : ""}`}>
          <span className="inv-main">
            <span className="mono">{i.number} · {dateFr(i.issuedAt)}</span>
            <b>{i.title}</b>
          </span>
          <span className={`pill s-${late ? "retard" : i.status}`}>{late ? "En retard" : STATUS_LABEL[i.status]}</span>
          <span className="inv-amount">
            <strong>{fcfa(toPay ? remaining(i) : i.total)}</strong>
            <span className="mono">{toPay ? (i.amountPaid ? `sur ${fcfa(i.total)}` : "à payer") : i.status === "payee" ? "réglée" : ""}</span>
          </span>
          <span className="inv-cta">{toPay ? "Payer →" : "Voir →"}</span>
        </Link>
      </li>
    );
  };

  return (
    <section className="wrap billing-page">
      <div className="space-head">
        <p className="eyebrow">Espace client{client.company ? ` · ${client.company}` : ""}</p>
        <h1 className="display">Bonjour {first},</h1>
        <p className="lead">{open.length ? <>Vous avez <b>{open.length} facture{open.length > 1 ? "s" : ""} à régler</b>. Touchez une facture pour la consulter et la payer.</> : "Toutes vos factures sont réglées. Merci pour votre confiance !"}</p>
      </div>

      {open.length > 0 && (
        <div className="due-card">
          <span className="mono">Total à payer</span>
          <strong className="display">{fcfa(due)}</strong>
          <span className="mono">{fedapayEnabled() ? "T-Money · Flooz · carte bancaire" : "T-Money · Flooz (Moov)"}</span>
        </div>
      )}

      {open.length > 0 && <><h2 className="list-title">À payer</h2><ul className="inv-list">{open.map((i) => <Row key={i.id} i={i} />)}</ul></>}
      {done.length > 0 && <><h2 className="list-title">Réglées</h2><ul className="inv-list">{done.map((i) => <Row key={i.id} i={i} />)}</ul></>}
      {!client.invoices.length && <p className="empty">Aucune facture pour l'instant.</p>}
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fedapayEnabled } from "@/lib/fedapay";
import { fcfa, linesTotal, STATUS_LABEL, toPublic } from "@/lib/invoices";
import { profile } from "@/content/site";
import PayPanel from "@/components/billing/PayPanel";
import PrintButton from "@/components/billing/PrintButton";
import ReceiptPrompt from "@/components/billing/ReceiptPrompt";
import { resendEnabled } from "@/lib/resend";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ payer?: string }> };

async function load(token: string) {
  const inv = await db.invoice.findUnique({ where: { token }, include: { client: true, payments: { orderBy: { createdAt: "asc" } } } });
  return inv && inv.status !== "brouillon" ? toPublic(inv) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const inv = await load((await params).token);
  return { title: inv ? `Facture ${inv.number}` : "Facture introuvable" };
}

const dateFr = (d: Date) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const METHOD: Record<string, string> = { fedapay: "Paiement en ligne", mobile: "Mobile Money", especes: "Espèces", virement: "Virement" };

export default async function InvoicePage({ params, searchParams }: Props) {
  const { token } = await params;
  const inv = await load(token);
  if (!inv) notFound();
  const { payer } = await searchParams;
  const subtotal = linesTotal(inv.items);
  const payable = inv.remaining > 0 && (inv.status === "envoyee" || inv.status === "partielle");
  const statusKey = inv.overdue ? "retard" : inv.status;
  const clientEmail = (await db.client.findUnique({ where: { token: inv.client.token }, select: { email: true } }))?.email ?? "";

  return (
    <section className="wrap billing-page">
      <div className="inv-top no-print">
        <Link href={`/espace/${inv.client.token}`} className="link-arrow">← Toutes mes factures</Link>
        <PrintButton />
      </div>

      <div className="inv-layout">
        <article className="paper" aria-label={`Facture ${inv.number}`}>
          <header className="paper-head">
            <div>
              <span className="paper-brand">OQUI</span>
              <p>{profile.name}<br />{profile.city}<br />{profile.phone}<br />{profile.email}</p>
            </div>
            <div className="paper-meta">
              <h1>Facture</h1>
              <p className="paper-no">{inv.number}</p>
              <span className={`pill s-${statusKey}`}>{inv.overdue ? "En retard" : STATUS_LABEL[inv.status]}</span>
            </div>
          </header>

          <div className="paper-parties">
            <div><span className="lbl">Facturé à</span><p><b>{inv.client.name}</b>{inv.client.company ? <><br />{inv.client.company}</> : null}</p></div>
            <div><span className="lbl">Date</span><p>{dateFr(inv.issuedAt)}</p></div>
            {inv.dueAt && <div><span className="lbl">Échéance</span><p>{dateFr(inv.dueAt)}</p></div>}
          </div>

          <h2 className="paper-title">{inv.title}</h2>

          <div className="table-scroll">
            <table className="lines">
              <thead><tr><th>Désignation</th><th className="num">Qté</th><th className="num">Prix unitaire</th><th className="num">Montant</th></tr></thead>
              <tbody>
                {inv.items.map((l, k) => (
                  <tr key={k}><td>{l.label}</td><td className="num">{l.qty}</td><td className="num">{fcfa(l.unitPrice)}</td><td className="num">{fcfa(l.qty * l.unitPrice)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="totals">
            {inv.discount > 0 && <><div><dt>Sous-total</dt><dd>{fcfa(subtotal)}</dd></div><div><dt>Remise</dt><dd>− {fcfa(inv.discount)}</dd></div></>}
            <div className="grand"><dt>Total</dt><dd>{fcfa(inv.total)}</dd></div>
            {inv.amountPaid > 0 && <div><dt>Déjà payé</dt><dd>− {fcfa(inv.amountPaid)}</dd></div>}
            {inv.amountPaid > 0 && <div className="grand"><dt>Reste à payer</dt><dd>{fcfa(inv.remaining)}</dd></div>}
          </dl>

          {inv.payments.length > 0 && (
            <div className="paper-payments">
              <span className="lbl">Paiements</span>
              <ul>
                {inv.payments.map((p) => (
                  <li key={p.id}><span>{dateFr(p.paidOn ?? p.confirmedAt ?? p.createdAt)} · {METHOD[p.method] ?? p.method}{p.reference ? ` · réf. ${p.reference}` : ""}</span><span>{p.status === "valide" ? fcfa(p.amount) : `${fcfa(p.amount)} (en vérification)`}</span></li>
                ))}
              </ul>
            </div>
          )}

          {inv.notes && <p className="paper-notes">{inv.notes}</p>}
          {inv.status === "payee" && <div className="stamp" aria-label="Facture payée">Payée{inv.paidAt ? <small>{dateFr(inv.paidAt)}</small> : null}</div>}
          <p className="paper-foot">Merci pour votre confiance. Montants en francs CFA (XOF).</p>
        </article>

        <aside className="no-print">
          {payable ? (
            <PayPanel
              token={token}
              due={inv.remaining}
              allowDeposit={inv.allowDeposit}
              online={fedapayEnabled()}
              autoOpen={payer === "1"}
              tmoney={process.env.PAY_TMONEY_NUMBER || ""}
              flooz={process.env.PAY_FLOOZ_NUMBER || ""}
              number={inv.number}
              hasPending={inv.payments.some((p) => p.status === "en_attente" && p.method === "mobile")}
              receiptEnabled={resendEnabled()}
              clientEmail={clientEmail}
            />
          ) : (
            <div className="pay-card">
              <span className="eyebrow">{inv.status === "payee" ? "Facture réglée" : "Paiement indisponible"}</span>
              <p>{inv.status === "payee" ? "Merci ! Cette facture est entièrement payée. Vous pouvez la télécharger en PDF pour vos archives." : "Cette facture a été annulée. Contactez Antoine pour toute question."}</p>
              {inv.status === "payee" && resendEnabled() && <ReceiptPrompt token={token} defaultEmail={clientEmail} trigger={<button className="btn btn-ghost btn-sm">Recevoir le reçu par e-mail</button>} />}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

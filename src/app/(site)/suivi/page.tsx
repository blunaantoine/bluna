import type { Metadata } from "next";
import Link from "next/link";
import OffersPricing from "@/components/OffersPricing";
import Reveal from "@/components/Reveal";
import { comparison, conditions, offers } from "@/content/offers";
import { profile } from "@/content/site";
import { getPaymentMethods, KINDS } from "@/lib/payment-methods";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Maintenance et suivi",
  description: "Offres de suivi post-livraison : votre application reste sûre, rapide et fiable. Trois formules mensuelles à partir de 10 000 FCFA.",
};

export default async function SuiviPage() {
  const methods = await getPaymentMethods();
  return (
    <>
      <section className="wrap suivi-hero">
        <p className="eyebrow">Maintenance &amp; assistance</p>
        <h1 className="display">Votre application, <em className="silver">entre de bonnes mains</em>.</h1>
        <p className="lead">Votre site ou votre application est en ligne. Pour qu&apos;il reste sûr, rapide et fiable, je vous propose trois formules de suivi mensuel, adaptées à vos besoins et à votre budget.</p>
        <p className="mono">Tarifs hors hébergement et nom de domaine · sans engagement</p>
      </section>

      <section className="wrap suivi-offers">
        <OffersPricing />
      </section>

      <section className="section section-alt">
        <div className="wrap">
          <Reveal className="section-head">
            <p className="eyebrow">Comparatif</p>
            <h2 className="display section-title">En un coup d&apos;œil</h2>
          </Reveal>
          <div className="table-scroll compare-wrap">
            <table className="compare">
              <thead><tr><th scope="col"><span className="sr-only">Critère</span></th>{offers.map((o) => <th key={o.id} scope="col" className={o.recommended ? "is-reco" : ""}>{o.title}</th>)}</tr></thead>
              <tbody>
                {comparison.map((r) => (
                  <tr key={r.label}><th scope="row">{r.label}</th>{r.values.map((v, k) => <td key={k} className={offers[k].recommended ? "is-reco" : ""}>{v === "✓" ? <span className="tick" aria-label="Oui">✓</span> : v === "—" ? <span className="dash" aria-label="Non">—</span> : v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap suivi-cond">
          <Reveal className="cond-card">
            <h2 className="display">Conditions</h2>
            <ul>{conditions.map(([k, v]) => <li key={k}><b>{k}</b> : {v}</li>)}</ul>
          </Reveal>
          <Reveal className="cond-card" delay={0.08}>
            <h2 className="display">Moyens de paiement</h2>
            <div className="pay-ways">
              {methods.map((m) => (
                <div key={m.id}><span className="pw-icon">{m.label.charAt(0).toUpperCase()}</span><span><b>{m.label}</b><span>{KINDS[m.kind] ?? m.kind}{m.value ? ` : ${m.value}` : ""}</span>{m.holder && <span>Au nom de {m.holder}</span>}{m.details && <span>{m.details}</span>}</span></div>
              ))}
              <div><span className="pw-icon">E</span><span><b>Espèces</b><span>Remise en main propre contre reçu signé.</span></span></div>
            </div>
            <p className="mono">Indiquez le nom de la formule et le mois concerné lors de chaque paiement. Chaque mois, vous recevez votre facture par lien WhatsApp, à régler depuis votre espace client.</p>
          </Reveal>
        </div>
      </section>

      <section className="wrap big-cta">
        <Reveal><h2 className="display">Prêt à choisir <em className="silver">votre formule</em> ?</h2></Reveal>
        <p className="lead">Contactez-moi pour démarrer le suivi dès ce mois-ci.</p>
        <div className="hero-actions">
          <Link href="/contact?formule=serenite" className="btn">Démarrer le suivi</Link>
          <a href={`https://wa.me/${profile.whatsapp}?text=${encodeURIComponent("Bonjour Antoine, je souhaite un suivi de mon application.")}`} target="_blank" rel="noopener" className="btn btn-ghost">WhatsApp · {profile.phone}</a>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { profile } from "@/content/site";
import { monthlyDesign, priceRange, tariffConditions, tariffGroups } from "@/content/tariffs";

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Grille tarifaire des prestations graphiques : identité visuelle, réseaux sociaux, supports imprimés et professionnels, accompagnement mensuel.",
};

export default function TarifsPage() {
  return (
    <>
      <section className="wrap suivi-hero">
        <p className="eyebrow">Grille tarifaire</p>
        <h1 className="display">Prestations <em className="silver">graphiques</em>.</h1>
        <p className="lead">Des fourchettes claires pour estimer votre projet. Le prix final dépend de la complexité, des délais et du volume : je vous envoie un devis précis après un premier échange.</p>
        <p className="mono">Montants en francs CFA · 50 % d&apos;acompte au démarrage</p>
      </section>

      <section className="wrap tariff-grid">
        {tariffGroups.map((g, k) => (
          <Reveal key={g.id} className="tariff-card" delay={k * 0.05}>
            <h2 className="display">{g.title}</h2>
            <ul>
              {g.items.map((t) => (
                <li key={t.id}>
                  <span>{t.label}{t.detail && <small>{t.detail}</small>}</span>
                  <b>{priceRange(t)}</b>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </section>

      <section className="section">
        <div className="wrap suivi-cond">
          <Reveal className="cond-card tariff-monthly">
            <p className="eyebrow">Engagement mensuel · abonnement</p>
            <h2 className="display">{monthlyDesign.label}</h2>
            <strong className="tariff-price">{priceRange(monthlyDesign)} <small>/ mois</small></strong>
            <p className="mono">Selon la formule choisie, cet engagement inclut :</p>
            <ul>{monthlyDesign.includes.map((i) => <li key={i}>{i}</li>)}</ul>
            <p className="mono">{monthlyDesign.note}</p>
          </Reveal>
          <Reveal className="cond-card" delay={0.08}>
            <h2 className="display">Conditions</h2>
            <ul>{tariffConditions.map((c) => <li key={c}>{c}</li>)}</ul>
            <p className="mono">Pour un site web ou une application, voir aussi les <Link href="/suivi" className="link-arrow">offres de maintenance</Link>.</p>
          </Reveal>
        </div>
      </section>

      <section className="wrap big-cta">
        <Reveal><h2 className="display">Un projet <em className="silver">en tête</em> ?</h2></Reveal>
        <p className="lead">Décrivez-le en quelques lignes : je vous réponds avec un devis adapté.</p>
        <div className="hero-actions">
          <Link href="/contact" className="btn">Demander un devis</Link>
          <a href={`https://wa.me/${profile.whatsapp}?text=${encodeURIComponent("Bonjour Antoine, j'aimerais un devis pour une prestation graphique.")}`} target="_blank" rel="noopener" className="btn btn-ghost">WhatsApp · {profile.phone}</a>
        </div>
      </section>
    </>
  );
}

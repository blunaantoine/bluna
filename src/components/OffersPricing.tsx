"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { offers, yearlyPrice } from "@/content/offers";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n).replace(/ | /g, " ");

/** Les trois formules, avec bascule mensuel / annuel (12 mois pour le prix de 10). */
export default function OffersPricing() {
  const [yearly, setYearly] = useState(false);
  const reduce = useReducedMotion();
  return (
    <>
      <div className="billing-toggle" role="group" aria-label="Période de facturation">
        <button aria-pressed={!yearly} onClick={() => setYearly(false)}>Mensuel</button>
        <button aria-pressed={yearly} onClick={() => setYearly(true)}>Annuel <small>2 mois offerts</small></button>
      </div>
      <div className="offers">
        {offers.map((o, i) => (
          <motion.article key={o.id} className={`offer${o.recommended ? " is-reco" : ""}`} initial={reduce ? false : { y: 30 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}>
            <header>
              <span className="eyebrow">Formule {i + 1}{o.recommended && <b className="reco">Recommandée</b>}</span>
              <h2 className="display">{o.title}</h2>
              <p className="offer-tag">{o.tagline}</p>
              <div className="offer-price">
                <strong className="display">{fmt(yearly ? yearlyPrice(o.monthly) : o.monthly)}</strong>
                <span>FCFA / {yearly ? "an" : "mois"}</span>
              </div>
              {yearly && <p className="offer-save">au lieu de {fmt(o.monthly * 12)} FCFA, soit {fmt(o.monthly * 2)} FCFA d&apos;économie</p>}
            </header>
            <div className="offer-lists">
              <div>
                <h3>Inclus</h3>
                <ul className="ticks">{o.included.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
              <div>
                <h3>{o.other.label}</h3>
                <ul className={o.other.positive ? "ticks" : "crosses"}>{o.other.items.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            </div>
            <p className="offer-ideal"><b>Idéale pour :</b> {o.idealFor}</p>
            <Link href={`/contact?formule=${o.id}${yearly ? "&periode=annuel" : ""}`} className={`btn${o.recommended ? "" : " btn-ghost"}`}>Choisir {o.title}</Link>
          </motion.article>
        ))}
      </div>
    </>
  );
}

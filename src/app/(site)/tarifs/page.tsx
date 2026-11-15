import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { profile } from "@/content/site";
import { priceText, tariffSections, type Tariff, type TariffGroup } from "@/content/tariffs";

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Grille tarifaire : graphisme (logo, réseaux sociaux, imprimés), vidéo (montage, tournage) et web (sites, applications web et Android).",
};

export default function TarifsPage() {
  return (
    <>
      <section className="wrap suivi-hero">
        <p className="eyebrow">Grille tarifaire</p>
        <h1 className="display">Des prix <em className="silver">clairs</em>, pour chaque projet.</h1>
        <p className="lead">Graphisme, vidéo, sites et applications : voici mes tarifs en francs CFA. Pour un projet qui sort de cette grille, le devis personnalisé est gratuit.</p>
        <nav className="tariff-tabs" aria-label="Rubriques">
          {tariffSections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}
          <Link href="/suivi">Maintenance</Link>
        </nav>
      </section>

      {tariffSections.map((s, si) => (
        <section key={s.id} id={s.id} className={`section tariff-section${si % 2 ? " section-alt" : ""}`}>
          <div className="wrap">
            <Reveal className="section-head">
              <p className="eyebrow">{String(si + 1).padStart(2, "0")} · {s.title}</p>
              <h2 className="display section-title">{s.title}</h2>
              <p className="lead">{s.lead}</p>
            </Reveal>
            <div className="tariff-grid">
              {s.groups.map((g, k) => <Group key={g.id} g={g} delay={(k % 2) * 0.05} />)}
              <Reveal className="tariff-card tariff-cond">
                <h3 className="display">{s.conditionsTitle}</h3>
                <ul className="tariff-bullets">{s.conditions.map((c) => <li key={c}>{c}</li>)}</ul>
                {s.id === "web" && <p className="mono">Les formules de suivi mensuel sont détaillées sur la page <Link href="/suivi" className="link-arrow">Maintenance</Link>.</p>}
              </Reveal>
            </div>
          </div>
        </section>
      ))}

      <section className="wrap big-cta">
        <Reveal><h2 className="display">Un projet <em className="silver">en tête</em> ?</h2></Reveal>
        <p className="lead">Décrivez-le en quelques lignes : je vous réponds avec un devis adapté, gratuitement.</p>
        <div className="hero-actions">
          <Link href="/contact" className="btn">Demander un devis</Link>
          <a href={`https://wa.me/${profile.whatsapp}?text=${encodeURIComponent("Bonjour Antoine, j'aimerais un devis.")}`} target="_blank" rel="noopener" className="btn btn-ghost">WhatsApp · {profile.phone}</a>
        </div>
      </section>
    </>
  );
}

function Group({ g, delay }: { g: TariffGroup; delay: number }) {
  return (
    <Reveal className={`tariff-card${g.items.length > 4 || g.columns ? " wide" : ""}`} delay={delay}>
      <h3 className="display">{g.title}</h3>
      {g.intro && <p className="tariff-intro">{g.intro}</p>}
      {g.columns && <div className="tariff-cols mono" aria-hidden="true"><span /><span>{g.columns[0]}</span><span>{g.columns[1]}</span></div>}
      <ul>{g.items.map((t) => <Row key={t.id} t={t} columns={g.columns} />)}</ul>
      {g.notes?.map((n) => <p key={n} className="tariff-note">{n}</p>)}
      {g.bullets && <div className="tariff-sub"><b>{g.bullets.title} :</b><ul className="tariff-bullets">{g.bullets.items.map((b) => <li key={b}>{b}</li>)}</ul></div>}
    </Reveal>
  );
}

function Row({ t, columns }: { t: Tariff; columns?: [string, string] }) {
  return (
    <li className={t.alt ? "has-alt" : undefined}>
      <span className="t-name">{t.label}{t.detail && <small>{t.detail}</small>}{t.delay && <small className="t-delay">Délai : {t.delay}</small>}</span>
      {t.alt && columns ? (
        <span className="t-prices">
          <b><i>{columns[0]}</i>{priceText(t)}</b>
          <b><i>{columns[1]}</i>{priceText({ ...t, ...t.alt })}</b>
        </span>
      ) : <b>{priceText(t)}</b>}
    </li>
  );
}

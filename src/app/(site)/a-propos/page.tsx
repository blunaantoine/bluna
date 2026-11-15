import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { profile, services } from "@/content/site";
import { getProfile } from "@/lib/profile";
import { getProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "À propos",
  description: "Antoine ANANI, graphiste et développeur à Lomé, fondateur d'OQUI : identité visuelle, sites web et applications.",
};

export default async function AboutPage() {
  const [p, projects] = await Promise.all([getProfile(), getProjects()]);
  const facts = [
    { n: String(projects.length), label: "projets présentés" },
    { n: String(services.length), label: "métiers réunis" },
    { n: "Lomé", label: "basé au Togo" },
  ];

  return (
    <>
      <section className="wrap about-hero">
        <div className="about-hero-copy">
          <p className="eyebrow">À propos</p>
          <h1 className="display">{p.headline}</h1>
          {p.intro.map((t, i) => <p key={i} className={i === 0 ? "lead" : undefined}>{i === 0 ? withSecret(t) : t}</p>)}
          <ul className="about-facts">{facts.map((f) => <li key={f.label}><strong className="display">{f.n}</strong><span>{f.label}</span></li>)}</ul>
        </div>
        <Reveal className="about-hero-photo">
          <Image src={p.photo} alt={`Portrait de ${profile.name}`} fill priority sizes="(max-width: 900px) 100vw, 45vw" />
        </Reveal>
      </section>

      {p.gallery.length > 0 && (
        <section className="wrap about-gallery" aria-label="Photos">
          {p.gallery.map((g, i) => (
            <Reveal key={g.src} className="about-shot" delay={(i % 4) * 0.05}>
              <Image src={g.src} alt={g.alt || profile.name} fill sizes="(max-width: 700px) 50vw, 25vw" />
            </Reveal>
          ))}
        </section>
      )}

      {p.values.length > 0 && (
        <section className="section section-alt">
          <div className="wrap">
            <Reveal className="section-head"><p className="eyebrow">Ma façon de travailler</p><h2 className="display section-title">Ce qui compte pour moi</h2></Reveal>
            <div className="about-values">
              {p.values.map((v, i) => (
                <Reveal as="article" key={v.title} className="about-value" delay={i * 0.06}><span className="mono">{String(i + 1).padStart(2, "0")}</span><h3>{v.title}</h3><p>{v.text}</p></Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {p.journey.length > 0 && (
        <section className="section">
          <div className="wrap about-journey">
            <Reveal className="section-head"><p className="eyebrow">Parcours</p><h2 className="display section-title">Du logo à l&apos;application</h2></Reveal>
            <ol>
              {p.journey.map((j, i) => <Reveal as="li" key={i} delay={i * 0.05}><b>{j.year}</b><p>{j.text}</p></Reveal>)}
            </ol>
          </div>
        </section>
      )}

      <section className="section section-alt">
        <div className="wrap">
          <Reveal className="section-head"><p className="eyebrow">Savoir-faire</p><h2 className="display section-title">Ce que je fais pour vous</h2></Reveal>
          <div className="services">
            {services.map((s, i) => <Reveal as="article" key={s.id} className="service" delay={i * 0.06}><h3>{s.title}</h3><p>{s.text}</p></Reveal>)}
          </div>
          {p.skills.length > 0 && <ul className="chips-static about-skills">{p.skills.map((s) => <li key={s}>{s}</li>)}</ul>}
        </div>
      </section>

      <section className="wrap big-cta">
        <Reveal><h2 className="display">Faisons connaissance. <em className="silver">Parlons de votre projet.</em></h2></Reveal>
        <div className="hero-actions">
          <Link href="/contact" className="btn">Écrire à Antoine</Link>
          <Link href="/projets" className="btn btn-ghost">Voir mes travaux</Link>
          <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noopener" className="btn btn-ghost">WhatsApp · {profile.phone}</a>
        </div>
      </section>
    </>
  );
}

/** Le nom du studio dans le premier paragraphe reste l'accès discret à l'admin. */
function withSecret(t: string) {
  const i = t.indexOf(profile.studio);
  if (i < 0) return t;
  return <>{t.slice(0, i)}<Link href="/admin" className="secret-link" tabIndex={-1} data-secret aria-hidden="true"><strong>{profile.studio}</strong></Link>{t.slice(i + profile.studio.length)}</>;
}

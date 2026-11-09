import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import Reel from "@/components/Reel";
import Reveal from "@/components/Reveal";
import ProjectIndex from "@/components/ProjectIndex";
import { getProjects } from "@/lib/projects";
import { fitFor } from "@/lib/view";
import { profile, services } from "@/content/site";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await getProjects();
  const featured = projects.filter((p) => p.featured);
  // Collage de l'accueil : les projets « À la une », dans l'ordre choisi dans l'admin.
  const tiles = (featured.length ? featured : projects).slice(0, 5).map((p) => {
    const img = p.images[0];
    return { src: img.src, label: p.title, slug: p.slug, bg: p.coverBg, fit: fitFor(p, img.src) as "cover" | "contain" };
  });
  const reel = projects.flatMap((p) => p.images.slice(0, p.category === "photo" ? 4 : 1).map((im) => ({ ...im, slug: p.slug, bg: p.coverBg, contain: fitFor(p, im.src) === "contain" })));
  const stats = [
    { n: projects.length, label: "projets à découvrir" },
    { n: projects.filter((p) => p.category === "web").length, label: "sites & applications" },
    { n: projects.filter((p) => p.category === "identite").length, label: "identités de marque" },
  ];

  return (
    <>
      <Hero tiles={tiles} stats={stats} />
      <Reel items={reel} />

      <section className="section" id="travaux">
        <div className="wrap">
          <div className="section-head-row">
            <Reveal className="section-head" >
              <p className="eyebrow">Travaux choisis</p>
              <h2 className="display section-title">Des marques, des outils, des images.</h2>
            </Reveal>
            <Link href="/projets" className="link-arrow">Tous les projets ({projects.length}) →</Link>
          </div>
          <ProjectIndex projects={featured.length ? featured : projects.slice(0, 8)} />
        </div>
      </section>

      <section className="section section-alt" id="services">
        <div className="wrap">
          <Reveal className="section-head">
            <p className="eyebrow">Services</p>
            <h2 className="display section-title">De l'idée à la mise en ligne</h2>
            <p className="lead">Un seul interlocuteur pour l'image de votre marque et ses outils numériques.</p>
          </Reveal>
          <div className="services">
            {services.map((s, i) => (
              <Reveal as="article" key={s.id} className="service" delay={i * 0.06}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <ul>{s.points.map((p) => <li key={p}>{p}</li>)}</ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="methode">
        <div className="wrap">
          <Reveal className="section-head">
            <p className="eyebrow">Méthode</p>
            <h2 className="display section-title">Comment on travaille ensemble</h2>
          </Reveal>
          <ol className="steps">
            {[
              ["01", "Écoute", "Un appel ou un message WhatsApp pour comprendre votre activité, votre cible et vos délais."],
              ["02", "Pistes", "Je vous présente deux ou trois directions visuelles. Vous choisissez celle qui vous ressemble."],
              ["03", "Création", "Je finalise le design ou je développe l'application avec vos retours, jusqu'à validation."],
              ["04", "Livraison", "Fichiers prêts pour l'impression et le web, ou site mis en ligne et expliqué."],
            ].map(([n, t, d], i) => (
              <Reveal as="li" key={n} delay={i * 0.06}><span className="mono">{n}</span><h3>{t}</h3><p>{d}</p></Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section-alt" id="apropos">
        <div className="wrap about">
          <Reveal className="about-photo">
            <Image src="/img/antoine-studio.webp" alt="Antoine ANANI en costume, assis, souriant" fill sizes="(max-width: 860px) 100vw, 50vw" />
          </Reveal>
          <Reveal className="about-copy" delay={0.1}>
            <p className="eyebrow">À propos</p>
            <h2 className="display section-title">Graphiste de formation, développeur par passion.</h2>
            <p>Je suis {profile.name}, fondateur d'<strong>{profile.studio}</strong> à Lomé. J'ai commencé par les logos et les affiches, puis j'ai voulu que mes clients puissent aussi vendre, réserver et s'organiser en ligne.</p>
            <p>Aujourd'hui, je dessine l'identité d'une marque et je développe le site ou l'application qui va avec : une boutique de luxe, un cabinet de santé, un sommet national, une application de services à domicile.</p>
            <ul className="chips-static">{["Illustrator", "Photoshop", "Canva", "Figma", "Next.js", "React", "Android", "Photographie"].map((s) => <li key={s}>{s}</li>)}</ul>
          </Reveal>
        </div>
      </section>

      <section className="wrap big-cta">
        <Reveal>
          <h2 className="display">Un projet ? <em className="silver">Parlons-en.</em></h2>
        </Reveal>
        <div className="hero-actions">
          <Link href="/contact" className="btn">Écrire à Antoine</Link>
          <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noopener" className="btn btn-ghost">WhatsApp · {profile.phone}</a>
        </div>
      </section>
    </>
  );
}

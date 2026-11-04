import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import Reveal from "@/components/Reveal";
import ViewTracker from "@/components/ViewTracker";
import { getProject, getProjects } from "@/lib/projects";
import { fitFor } from "@/lib/view";
import { categoryLabel } from "@/content/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProject((await params).slug);
  if (!p) return { title: "Projet introuvable" };
  return { title: p.title, description: p.summary, openGraph: { title: `${p.title} · BLUNA Graphisme`, description: p.summary, images: [p.cover] } };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) notFound();
  const all = await getProjects();
  const idx = all.findIndex((x) => x.slug === p.slug);
  const next = all[(idx + 1) % all.length];
  const padded = p.images.filter((im) => fitFor(p, im.src) === "contain").map((im) => im.src);

  return (
    <article className="wrap">
      <ViewTracker slug={p.slug} />
      <header className="p-hero">
        <nav className="crumbs mono" aria-label="Fil d'Ariane">
          <Link href="/projets">Travaux</Link><span>/</span>
          <Link href={`/projets?filtre=${p.category}`}>{categoryLabel(p.category)}</Link><span>/</span>
          <span aria-current="page">{p.title}</span>
        </nav>
        <Reveal><h1 className="display p-title">{p.title}</h1></Reveal>
        <p className="lead">{p.summary}</p>
      </header>

      <div className="p-layout">
        <Gallery images={p.images} bg={p.coverBg} padded={padded} />
        <aside className="p-aside">
          <p>{p.description}</p>
          <dl className="facts">
            {p.client && <div><dt>Client</dt><dd>{p.client}</dd></div>}
            <div><dt>Discipline</dt><dd>{categoryLabel(p.category)}</dd></div>
            <div><dt>Année</dt><dd>{p.year}</dd></div>
            <div><dt>Visuels</dt><dd>{p.images.length}</dd></div>
          </dl>
          <div className="tags">
            {p.tags.map((t) => <span key={t}>{t}</span>)}
            {p.stack.map((t) => <span key={t} className="alt">{t}</span>)}
          </div>
          {p.link && <a href={p.link} target="_blank" rel="noopener" className="btn btn-ghost">Voir le site en ligne ↗</a>}
          <div className="similar-cta">
            <strong>Ce projet vous parle ?</strong>
            <p>Demandez un projet similaire : il sera joint à votre message et Antoine sera notifié tout de suite.</p>
            <Link href={`/contact?projet=${p.slug}`} className="btn">Un projet similaire ?</Link>
          </div>
        </aside>
      </div>

      {next && next.slug !== p.slug && (
        <Link href={`/projets/${next.slug}`} className="next-project" data-cursor="Suivant">
          <span style={{ display: "grid", gap: ".6rem" }}>
            <span className="eyebrow">Projet suivant</span>
            <span className="display">{next.title}</span>
          </span>
          <span className="thumb" style={{ background: next.coverBg }}>
            <Image src={next.cover} alt="" fill sizes="220px" style={{ objectFit: fitFor(next, next.cover), padding: fitFor(next, next.cover) === "contain" ? "12%" : 0, objectPosition: "50% 0%" }} />
          </span>
        </Link>
      )}
    </article>
  );
}

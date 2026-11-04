import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/projects";
import { categoryLabel } from "@/content/site";
import { fitFor } from "@/lib/view";

export default function ProjectCard({ p, priority = false }: { p: Project; priority?: boolean }) {
  const fit = fitFor(p, p.cover);
  return (
    <Link href={`/projets/${p.slug}`} className="card" data-cursor="Voir">
      <div className="card-media" style={{ background: p.coverBg }}>
        <Image src={p.cover} alt={p.images[0]?.alt ?? p.title} fill priority={priority} sizes="(max-width: 560px) 100vw, (max-width: 1000px) 50vw, 33vw" className={fit === "contain" ? "fit-contain" : "fit-cover"} style={{ objectPosition: "50% 0%" }} />
        {p.images.length > 1 && <span className="card-count">{p.images.length} visuels</span>}
      </div>
      <div className="card-meta"><h3 className="card-title">{p.title}</h3><span className="mono">{categoryLabel(p.category)}</span></div>
      <p className="card-text">{p.summary}</p>
    </Link>
  );
}

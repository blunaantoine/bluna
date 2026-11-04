import Image from "next/image";
import Link from "next/link";

type Item = { src: string; w: number; h: number; slug: string; alt: string; bg: string; contain: boolean };

/** Bandeau qui défile en continu avec les vraies réalisations. */
export default function Reel({ items }: { items: Item[] }) {
  const loop = [...items, ...items];
  return (
    <div className="reel" aria-label="Réalisations en défilement">
      <div className="reel-track">
        {loop.map((it, i) => {
          const ratio = it.contain ? 1 : Math.min(Math.max(it.w / it.h, 0.6), 1.9);
          return (
            <Link key={i} href={`/projets/${it.slug}`} className="reel-item" style={{ aspectRatio: ratio, background: it.bg }} aria-hidden={i >= items.length} tabIndex={i >= items.length ? -1 : 0} data-cursor="Voir">
              <Image src={it.src} alt={i < items.length ? it.alt : ""} fill sizes="300px" style={{ objectFit: it.contain ? "contain" : "cover", padding: it.contain ? "12%" : 0, objectPosition: "50% 0%" }} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

"use client";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import Counter from "./Counter";

type Tile = { src: string; label: string; slug: string; bg: string; fit: "cover" | "contain" };
const WORDS = ["marques", "logos", "sites web", "applications", "images"];

// Position, taille et profondeur (parallaxe) de chaque vignette du collage
const SLOTS = [
  { l: "30%", t: "4%", w: "42%", h: "62%", d: 0, portrait: true },
  { l: "0%", t: "14%", w: "34%", h: "30%", d: 26 },
  { l: "68%", t: "0%", w: "32%", h: "34%", d: -30 },
  { l: "2%", t: "50%", w: "36%", h: "44%", d: -22 },
  { l: "66%", t: "40%", w: "34%", h: "28%", d: 34 },
  { l: "40%", t: "70%", w: "34%", h: "28%", d: 18 },
];

export default function Hero({ tiles, stats }: { tiles: Tile[]; stats: { n: number; label: string }[] }) {
  const reduce = useReducedMotion();
  const [w, setW] = useState(0);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 }), sy = useSpring(my, { stiffness: 60, damping: 18 });

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setW((v) => (v + 1) % WORDS.length), 2600);
    return () => clearInterval(id);
  }, [reduce]);

  const onMove = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <section className="hero" onMouseMove={reduce ? undefined : onMove} onMouseLeave={() => { mx.set(0); my.set(0); }}>
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="eyebrow"><span className="dot" /> Disponible pour de nouveaux projets · Lomé, Togo</p>
          <h1 className="display hero-title">
            Je dessine des{" "}
            <span style={{ display: "inline-grid" }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={WORDS[w]} className="word silver" initial={{ y: "60%", opacity: 0, filter: "blur(8px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} exit={{ y: "-60%", opacity: 0, filter: "blur(8px)" }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                  {WORDS[w]}
                </motion.span>
              </AnimatePresence>
            </span>
            <br />qui se remarquent.
          </h1>
          <p className="lead hero-lead">
            Antoine ANANI, web designer et graphiste. Je crée l'identité de votre marque, puis le site ou l'application qui la fait vivre.
          </p>
          <div className="hero-actions">
            <Link href="/projets" className="btn">Voir les travaux</Link>
            <Link href="/contact" className="btn btn-ghost">Parler de mon projet</Link>
          </div>
          <div className="hero-stats">
            {stats.map((s) => <div key={s.label}><Counter to={s.n} /><span>{s.label}</span></div>)}
          </div>
        </div>

        <div className="collage" aria-label="Aperçu de réalisations">
          {SLOTS.map((s, i) => {
            const tile = s.portrait ? null : tiles[i - 1];
            if (!s.portrait && !tile) return null;
            return <Slot key={i} s={s} i={i} sx={sx} sy={sy} tile={tile} reduce={!!reduce} />;
          })}
        </div>
      </div>
    </section>
  );
}

function Slot({ s, i, sx, sy, tile, reduce }: { s: (typeof SLOTS)[number]; i: number; sx: ReturnType<typeof useSpring>; sy: ReturnType<typeof useSpring>; tile: Tile | null; reduce: boolean }) {
  const x = useTransform(sx, (v) => v * s.d), y = useTransform(sy, (v) => v * s.d);
  const style = { left: s.l, top: s.t, width: s.w, height: s.h, x, y, zIndex: s.portrait ? 3 : 2, background: tile?.bg };
  const intro = reduce ? false : { scale: 0.85, rotate: i % 2 ? 4 : -4 };
  if (!tile) {
    return (
      <motion.figure className="collage-item collage-portrait" style={style} initial={intro} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
        <Image src="/img/antoine-portrait.webp" alt="Portrait d'Antoine ANANI" fill priority sizes="(max-width: 900px) 45vw, 24vw" style={{ objectPosition: "50% 18%" }} />
      </motion.figure>
    );
  }
  return (
    <motion.figure className="collage-item" style={style} initial={intro} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 1.1, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }} whileHover={{ scale: 1.04, zIndex: 4 }}>
      <Link href={`/projets/${tile.slug}`} data-cursor="Voir" aria-label={`Voir le projet ${tile.label}`} style={{ position: "absolute", inset: 0 }}>
        <Image src={tile.src} alt="" fill sizes="(max-width: 900px) 40vw, 18vw" style={{ objectFit: tile.fit, padding: tile.fit === "contain" ? "10%" : 0, objectPosition: "50% 0%" }} />
        <figcaption>{tile.label}</figcaption>
      </Link>
    </motion.figure>
  );
}

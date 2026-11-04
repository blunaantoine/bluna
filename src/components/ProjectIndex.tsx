"use client";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { useState } from "react";
import type { Project } from "@/lib/projects";
import { categoryLabel } from "@/content/site";
import { fitFor } from "@/lib/view";

/** Liste éditoriale : au survol, l'image du projet suit la souris. */
export default function ProjectIndex({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<Project | null>(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 26 }), sy = useSpring(y, { stiffness: 220, damping: 26 });

  return (
    <div className="index" onMouseMove={(e) => { x.set(e.clientX + 24); y.set(e.clientY - 120); }} onMouseLeave={() => setActive(null)}>
      {projects.map((p, i) => (
        <Link key={p.slug} href={`/projets/${p.slug}`} className="index-row" onMouseEnter={(e) => { x.jump(e.clientX + 24); y.jump(e.clientY - 120); setActive(p); }} onFocus={() => setActive(p)} data-cursor="Voir">
          <span className="mono n">{String(i + 1).padStart(2, "0")}</span>
          <span className="index-thumb" style={{ background: p.coverBg }}>
            <Image src={p.cover} alt="" fill sizes="76px" style={{ objectFit: fitFor(p, p.cover), padding: fitFor(p, p.cover) === "contain" ? 8 : 0, objectPosition: "50% 0%" }} />
          </span>
          <span style={{ display: "grid", gap: ".3rem", minWidth: 0 }}>
            <span className="t">{p.title}</span>
            <span className="s">{p.summary}</span>
          </span>
          <span className="mono y">{categoryLabel(p.category)}</span>
          <span className="mono y" style={{ textAlign: "right" }}>{p.year}</span>
        </Link>
      ))}
      <AnimatePresence>
        {active && (
          <motion.div key="preview" className="hover-preview" style={{ x: sx, y: sy, background: active.coverBg }} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.25 }} aria-hidden="true">
            <Image key={active.cover} src={active.cover} alt="" fill sizes="340px" style={{ objectFit: fitFor(active, active.cover), padding: fitFor(active, active.cover) === "contain" ? 28 : 0, objectPosition: "50% 0%" }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

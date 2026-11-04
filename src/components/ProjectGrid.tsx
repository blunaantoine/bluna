"use client";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { Project } from "@/lib/projects";
import { categories } from "@/content/site";
import ProjectCard from "./ProjectCard";

export default function ProjectGrid({ projects }: { projects: Project[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const counts = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.id === "tout" ? projects.length : projects.filter((p) => p.category === c.id).length])), [projects]);
  const raw = params.get("filtre") ?? "tout";
  const current = counts[raw] ? raw : "tout";
  const shown = current === "tout" ? projects : projects.filter((p) => p.category === current);
  const setFilter = (id: string) => router.replace(id === "tout" ? "/projets" : `/projets?filtre=${id}`, { scroll: false });

  return (
    <LayoutGroup>
      <div className="filters filters-wrap" role="group" aria-label="Filtrer les projets" style={{ marginBottom: "2.2rem" }}>
        {categories.filter((c) => counts[c.id]).map((c) => (
          <button key={c.id} className="filter" aria-pressed={current === c.id} onClick={() => setFilter(c.id)}>
            {current === c.id && <motion.span layoutId="pill" className="pill" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <span>{c.label}</span><sup>{counts[c.id]}</sup>
          </button>
        ))}
      </div>
      <motion.div layout className="grid">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((p, i) => (
            <motion.div key={p.slug} layout initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5, delay: Math.min(i, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}>
              <ProjectCard p={p} priority={i < 3} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}

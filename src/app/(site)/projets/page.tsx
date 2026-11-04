import type { Metadata } from "next";
import { Suspense } from "react";
import ProjectGrid from "@/components/ProjectGrid";
import { getProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Travaux", description: "Identités de marque, sites et applications, photographie : les réalisations de BLUNA Graphisme." };

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <section className="section" style={{ paddingTop: "clamp(2rem, 5vw, 4rem)" }}>
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Portfolio · {projects.length} projets</p>
          <h1 className="display" style={{ fontSize: "clamp(2.8rem, 8vw, 6rem)", lineHeight: 1 }}>Travaux</h1>
          <p className="lead">Chaque projet s'ouvre sur ses visuels en grand. Si l'un d'eux vous plaît, demandez un projet similaire en un clic.</p>
        </div>
        <Suspense>
          <ProjectGrid projects={projects} />
        </Suspense>
      </div>
    </section>
  );
}

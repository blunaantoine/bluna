import { PrismaClient } from "@prisma/client";
import { seedProjects } from "../src/content/projects";

const db = new PrismaClient();

const MARK = "projects_seeded";

async function main() {
  // Les projets de départ ne sont insérés qu'une seule fois, à la première installation.
  // Ensuite, l'admin décide : un projet supprimé ne revient pas après une mise à jour.
  if (await db.setting.findUnique({ where: { key: MARK } })) { console.log("Projets déjà initialisés : rien à faire."); return; }
  if (await db.project.count()) {
    await db.setting.create({ data: { key: MARK, value: new Date().toISOString() } });
    console.log("Projets existants conservés tels quels.");
    return;
  }
  for (const [order, p] of seedProjects.entries()) {
    const data = {
      title: p.title,
      client: p.client ?? "",
      category: p.category,
      year: p.year,
      summary: p.summary,
      description: p.description,
      tags: JSON.stringify(p.tags),
      stack: JSON.stringify(p.stack ?? []),
      images: JSON.stringify(p.images),
      cover: p.images[0].src,
      coverBg: p.coverBg,
      link: p.link ?? "",
      featured: !!p.featured,
      order,
    };
    await db.project.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: {} });
  }
  await db.setting.create({ data: { key: MARK, value: new Date().toISOString() } });
  console.log(`${seedProjects.length} projets de départ ajoutés.`);
}

main().finally(() => db.$disconnect());

import { PrismaClient } from "@prisma/client";
import { seedProjects } from "../src/content/projects";

const db = new PrismaClient();

async function main() {
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
    // Ne remplace pas les modifications faites dans l'admin : création seulement.
    await db.project.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: {} });
  }
  console.log(`${seedProjects.length} projets prêts.`);
}

main().finally(() => db.$disconnect());

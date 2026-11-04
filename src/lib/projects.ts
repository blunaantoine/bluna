import type { Project as Row } from "@prisma/client";
import { db } from "./db";
import type { Img } from "@/content/projects";

export type Project = Omit<Row, "tags" | "stack" | "images" | "createdAt" | "updatedAt"> & {
  tags: string[];
  stack: string[];
  images: Img[];
};

const parse = <T,>(s: string, fallback: T): T => {
  try { return JSON.parse(s) as T; } catch { return fallback; }
};

export function toProject(r: Row): Project {
  const { createdAt: _c, updatedAt: _u, ...rest } = r;
  return { ...rest, tags: parse(r.tags, []), stack: parse(r.stack, []), images: parse(r.images, []) };
}

export async function getProjects(opts: { all?: boolean } = {}) {
  const rows = await db.project.findMany({
    where: opts.all ? {} : { published: true },
    orderBy: [{ order: "asc" }, { year: "desc" }],
  });
  return rows.map(toProject);
}

export async function getProject(slug: string) {
  const r = await db.project.findUnique({ where: { slug } });
  return r && r.published ? toProject(r) : null;
}

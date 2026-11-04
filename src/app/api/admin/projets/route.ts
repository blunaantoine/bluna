import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getProjects } from "@/lib/projects";
import type { Prisma } from "@prisma/client";
import { projectData } from "./validate";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ projects: await getProjects({ all: true }) });
}

export async function POST(req: Request) {
  const parsed = projectData(await req.json().catch(() => ({})), true);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 });
  const exists = await db.project.findUnique({ where: { slug: parsed.data.slug! } });
  if (exists) return NextResponse.json({ error: "Un projet utilise déjà cette adresse (slug)." }, { status: 409 });
  const max = await db.project.aggregate({ _max: { order: true } });
  const p = await db.project.create({ data: { ...(parsed.data as unknown as Prisma.ProjectCreateInput), order: (max._max.order ?? 0) + 1 } });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, id: p.id });
}

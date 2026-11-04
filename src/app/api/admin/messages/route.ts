import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [messages, projects] = await Promise.all([
    db.message.findMany({ where: { status: { not: "archive" } }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.project.findMany({ select: { slug: true, title: true, cover: true, coverBg: true } }),
  ]);
  const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
  return NextResponse.json({
    unread: messages.filter((m) => m.status === "nouveau").length,
    messages: messages.map((m) => ({ ...m, services: JSON.parse(m.services || "[]"), project: m.projectSlug ? bySlug[m.projectSlug] ?? null : null })),
  });
}

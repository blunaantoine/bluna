import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await db.project.updateMany({ where: { slug, published: true }, data: { views: { increment: 1 } } });
  return NextResponse.json({ ok: true });
}

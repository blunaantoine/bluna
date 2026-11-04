import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { uploadDir } from "@/lib/uploads";

const MAX = 15 * 1024 * 1024;

/** Reçoit une image, la redimensionne (2000 px max) et l'enregistre en WebP dans le dossier d'uploads (servi par /uploads/...). */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Seules les images sont acceptées (JPG, PNG, WebP)." }, { status: 415 });
  if (file.size > MAX) return NextResponse.json({ error: "Image trop lourde (15 Mo maximum)." }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const img = sharp(buf).rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 });
  const out = await img.toBuffer({ resolveWithObject: true });
  const base = path.parse(file.name).name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "image";
  const name = `${Date.now().toString(36)}-${base}.webp`;
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), out.data);
  return NextResponse.json({ src: `/uploads/${name}`, w: out.info.width, h: out.info.height });
}

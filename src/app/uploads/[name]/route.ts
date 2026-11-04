import { readFile } from "node:fs/promises";
import path from "node:path";
import { uploadDir } from "@/lib/uploads";

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[a-z0-9-]+\.webp$/.test(name)) return new Response("Introuvable", { status: 404 });
  try {
    const buf = await readFile(path.join(uploadDir(), name));
    return new Response(new Uint8Array(buf), { headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
}

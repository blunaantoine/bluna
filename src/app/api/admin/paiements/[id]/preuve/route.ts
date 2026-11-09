import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { proofDir } from "@/lib/uploads";

/** Affiche la capture d'un paiement. Protégé par le middleware admin. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await db.payment.findUnique({ where: { id }, select: { proof: true } });
  if (!p?.proof || !/^[\w.-]+\.jpg$/.test(p.proof)) return new Response("Introuvable", { status: 404 });
  try {
    const buf = await readFile(path.join(proofDir(), p.proof));
    return new Response(new Uint8Array(buf), { headers: { "content-type": "image/jpeg", "cache-control": "private, max-age=3600" } });
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
}

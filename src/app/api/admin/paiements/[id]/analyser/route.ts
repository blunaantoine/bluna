import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { analyzePayment, receiptEngine } from "@/lib/receipt-ai";
import { proofDir } from "@/lib/uploads";

/** Relance la lecture IA de la capture d'un paiement. */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await receiptEngine())) return NextResponse.json({ error: "Lecture automatique indisponible : installez Tesseract sur le serveur (apt install tesseract-ocr tesseract-ocr-fra)." }, { status: 503 });
  const { id } = await params;
  const p = await db.payment.findUnique({ where: { id } });
  if (!p?.proof) return NextResponse.json({ error: "Ce paiement n'a pas de capture." }, { status: 404 });
  const jpeg = await readFile(path.join(proofDir(), p.proof)).catch(() => null);
  if (!jpeg) return NextResponse.json({ error: "Capture introuvable sur le serveur." }, { status: 404 });
  const a = await analyzePayment(id, jpeg);
  if (!a) return NextResponse.json({ error: "La lecture a échoué. Réessayez dans un instant." }, { status: 502 });
  return NextResponse.json({ analysis: a });
}

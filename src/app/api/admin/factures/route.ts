import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newToken, nextNumber, parseLines, isOverdue } from "@/lib/invoices";
import { invoiceInput } from "./validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const invoices = await db.invoice.findMany({ orderBy: { createdAt: "desc" }, include: { client: true, payments: { orderBy: { createdAt: "desc" } } } });
  return NextResponse.json({ invoices: invoices.map((i) => ({ ...i, items: parseLines(i.items), overdue: isOverdue(i) })) });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const parsed = invoiceInput(b);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 });
  if (typeof b.clientId !== "string" || !(await db.client.findUnique({ where: { id: b.clientId } })))
    return NextResponse.json({ error: "Choisissez un client." }, { status: 422 });
  // Deux créations simultanées pourraient viser le même numéro : on réessaie.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const invoice = await db.invoice.create({ data: { ...parsed.data, clientId: b.clientId, number: await nextNumber(), token: newToken() } });
      return NextResponse.json({ invoice });
    } catch (e) { if (attempt === 2) throw e; }
  }
}

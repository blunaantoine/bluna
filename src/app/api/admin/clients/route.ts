import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newToken } from "@/lib/invoices";

export const dynamic = "force-dynamic";

export async function GET() {
  const clients = await db.client.findMany({ orderBy: { createdAt: "desc" }, include: { invoices: { select: { total: true, amountPaid: true, status: true } } } });
  return NextResponse.json({
    clients: clients.map(({ invoices, ...c }) => ({
      ...c,
      invoiceCount: invoices.length,
      due: invoices.filter((i) => i.status === "envoyee" || i.status === "partielle").reduce((a, i) => a + i.total - i.amountPaid, 0),
    })),
  });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim().slice(0, 120);
  if (name.length < 2) return NextResponse.json({ error: "Indiquez le nom du client." }, { status: 422 });
  const client = await db.client.create({
    data: { name, company: String(b.company || "").trim().slice(0, 160), phone: String(b.phone || "").trim().slice(0, 40), email: String(b.email || "").trim().slice(0, 160), token: newToken() },
  });
  return NextResponse.json({ client });
}

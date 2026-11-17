import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { fcfa, remaining, siteUrl } from "@/lib/invoices";
import { sendAlert } from "@/lib/notify";

const SAME_VISIT_MS = 30 * 60 * 1000; // rechargements dans la demi-heure = même visite

/**
 * Le navigateur du client signale l'ouverture de sa facture (enveloppe ou page facture).
 * Appelé par JavaScript : les robots d'aperçu de lien (WhatsApp…) ne comptent donc pas.
 */
export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // Vos propres visites (connecté à l'admin) ne comptent pas.
  if (await verifySession((await cookies()).get(SESSION_COOKIE)?.value)) return NextResponse.json({ ok: true, admin: true });
  const inv = await db.invoice.findUnique({ where: { token }, include: { client: true, payments: true } });
  if (!inv || inv.status === "brouillon") return NextResponse.json({ ok: false }, { status: 404 });

  const now = new Date();
  if (inv.lastViewedAt && +now - +inv.lastViewedAt < SAME_VISIT_MS) {
    await db.invoice.update({ where: { id: inv.id }, data: { lastViewedAt: now } });
    return NextResponse.json({ ok: true });
  }
  const first = !inv.firstViewedAt;
  await db.invoice.update({ where: { id: inv.id }, data: { viewCount: { increment: 1 }, lastViewedAt: now, ...(first ? { firstViewedAt: now } : {}) } });
  if (first && inv.status !== "payee" && inv.status !== "annulee") {
    sendAlert(`Facture ouverte : ${inv.number} — ${inv.client.name}`,
      `${inv.client.name} vient d'ouvrir la facture ${inv.number} (${inv.title}). Reste à payer : ${fcfa(remaining(inv))}.\n${siteUrl()}/admin/factures`).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}

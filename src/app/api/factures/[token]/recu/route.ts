import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isEmail, resendEnabled } from "@/lib/resend";
import { sendReceipt } from "@/lib/receipt-email";

const hits = new Map<string, number[]>();

/**
 * Le client demande son reçu par e-mail.
 * - paiement validé : envoi immédiat ;
 * - transfert en vérification : l'adresse est gardée, le reçu part à la validation.
 */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!resendEnabled()) return NextResponse.json({ error: "L'envoi des reçus par e-mail n'est pas encore activé. Téléchargez la facture en PDF." }, { status: 503 });

  // Anti-abus : 5 demandes maximum par facture et par heure
  const now = Date.now(); const list = (hits.get(token) || []).filter((t) => now - t < 3600_000);
  if (list.length >= 5) return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  hits.set(token, [...list, now]);

  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase().slice(0, 160);
  if (!isEmail(email)) return NextResponse.json({ errors: { email: "Cette adresse e-mail semble incomplète." } }, { status: 422 });

  const inv = await db.invoice.findUnique({ where: { token }, include: { client: true, payments: { orderBy: { createdAt: "desc" } } } });
  if (!inv || inv.status === "brouillon") return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });

  // Paiements concernés : celui indiqué, sinon les paiements validés ou en vérification de cette facture
  const targets = b.paymentId
    ? inv.payments.filter((p) => p.id === b.paymentId)
    : inv.payments.filter((p) => p.status === "valide" || (p.status === "en_attente" && p.method === "mobile"));
  if (!targets.length) return NextResponse.json({ error: "Aucun paiement à confirmer pour cette facture." }, { status: 404 });

  if (!inv.client.email) await db.client.update({ where: { id: inv.clientId }, data: { email } });
  let sent = 0, pending = 0;
  for (const p of targets) {
    await db.payment.update({ where: { id: p.id }, data: { receiptEmail: email } });
    // Demande explicite du client : on renvoie même si un reçu est déjà parti (limité à 5 demandes par heure).
    const r = await sendReceipt(p.id, { email, force: true });
    if (r === "envoye") sent++; else if (r === "en_attente") pending++; else if (r === "erreur") return NextResponse.json({ error: "L'envoi a échoué. Réessayez dans un instant." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, sent, pending, email });
}

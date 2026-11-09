import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isEmail } from "@/lib/resend";
import { sendReceipt } from "@/lib/receipt-email";

const MSG: Record<string, [number, string]> = {
  envoye: [200, "Reçu envoyé."],
  en_attente: [409, "Ce paiement n'est pas encore validé."],
  sans_email: [422, "Aucune adresse e-mail pour ce client. Indiquez-en une."],
  desactive: [503, "Resend n'est pas configuré (RESEND_API_KEY dans le .env du serveur)."],
  erreur: [502, "L'envoi a échoué. Vérifiez la configuration Resend."],
};

/** Envoie (ou renvoie) le reçu d'un paiement validé. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (email && !isEmail(email)) return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 422 });
  if (email) {
    const p = await db.payment.findUnique({ where: { id }, include: { invoice: { include: { client: true } } } });
    if (p && !p.invoice.client.email) await db.client.update({ where: { id: p.invoice.clientId }, data: { email } });
  }
  const r = await sendReceipt(id, { force: true, email: email || undefined });
  const [status, message] = MSG[r] ?? [500, "Erreur."];
  return NextResponse.json(status === 200 ? { ok: true, message } : { error: message }, { status });
}

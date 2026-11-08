import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createCheckout, fedapayEnabled } from "@/lib/fedapay";
import { fcfa, remaining, siteUrl } from "@/lib/invoices";

const MIN = 100; // FCFA

/** Crée un paiement FedaPay pour la facture et renvoie l'adresse de la page de paiement. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!fedapayEnabled()) return NextResponse.json({ error: "Le paiement en ligne n'est pas encore activé. Utilisez le paiement Mobile Money ci-dessous." }, { status: 503 });

  const inv = await db.invoice.findUnique({ where: { token }, include: { client: true } });
  if (!inv || inv.status === "brouillon") return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
  if (inv.status === "annulee") return NextResponse.json({ error: "Cette facture a été annulée." }, { status: 410 });

  const due = remaining(inv);
  if (due <= 0) return NextResponse.json({ error: "Cette facture est déjà réglée." }, { status: 409 });

  const b = await req.json().catch(() => ({}));
  let amount = Math.round(Number(b.amount) || due);
  if (!inv.allowDeposit) amount = due;
  if (amount < MIN || amount > due) return NextResponse.json({ error: `Le montant doit être compris entre ${fcfa(MIN)} et ${fcfa(due)}.` }, { status: 422 });

  const name = String(b.name || inv.client.name).trim().slice(0, 120);
  const phone = String(b.phone || inv.client.phone).trim().slice(0, 40);
  const email = String(b.email || inv.client.email).trim().slice(0, 160);

  try {
    const checkout = await createCheckout({
      amount,
      description: `Facture ${inv.number} — ${inv.title}`.slice(0, 250),
      callbackUrl: `${siteUrl()}/facture/${inv.token}/retour`,
      invoiceNumber: inv.number,
      customer: { name, email, phone },
    });
    await db.payment.create({
      data: { invoiceId: inv.id, amount, method: "fedapay", provider: "fedapay", transactionId: checkout.id, payerName: name, payerPhone: phone },
    });
    return NextResponse.json({ url: checkout.url });
  } catch (e) {
    console.error("[fedapay]", e);
    return NextResponse.json({ error: "Le service de paiement ne répond pas. Réessayez dans un instant ou payez par Mobile Money." }, { status: 502 });
  }
}

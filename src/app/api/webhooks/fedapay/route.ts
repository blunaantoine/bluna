import { NextResponse } from "next/server";
import { syncFedapayPayment } from "@/lib/payments";

/**
 * Webhook FedaPay (à déclarer dans le tableau de bord FedaPay > Webhooks).
 * On ne lit que l'identifiant de la transaction, puis on revérifie son statut
 * directement auprès de l'API FedaPay : un faux appel ne peut rien valider.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const id = body?.entity?.id ?? body?.data?.id ?? body?.id;
  if (!id) return NextResponse.json({ ok: true });
  try { await syncFedapayPayment(String(id)); } catch (e) { console.error("[webhook fedapay]", e); return NextResponse.json({ error: "retry" }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}

/**
 * Client minimal de l'API FedaPay (T-Money, Flooz, cartes bancaires).
 * Doc : https://docs.fedapay.com — on n'utilise que 3 appels :
 *   POST /v1/transactions             crée la transaction
 *   POST /v1/transactions/:id/token   renvoie l'URL de la page de paiement
 *   GET  /v1/transactions/:id         lit le statut (source de vérité)
 */
const base = () =>
  process.env.FEDAPAY_API_BASE ||
  (process.env.FEDAPAY_ENV === "live" ? "https://api.fedapay.com" : "https://sandbox-api.fedapay.com");

/**
 * Paiement en ligne désactivé par défaut : seul le transfert Mobile Money est proposé.
 * Pour le réactiver : PAIEMENT_EN_LIGNE="oui" et FEDAPAY_SECRET_KEY dans le .env.
 */
export const fedapayEnabled = () => process.env.PAIEMENT_EN_LIGNE === "oui" && !!process.env.FEDAPAY_SECRET_KEY;

type Tx = { id: number; status: string; amount: number; reference?: string; custom_metadata?: Record<string, unknown> | null };

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${base()}/v1${path}`, {
    method,
    headers: { authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`, "content-type": "application/json", accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`FedaPay ${res.status} : ${JSON.stringify(data).slice(0, 300)}`);
  return data as T;
}

const unwrap = (d: Record<string, unknown>): Tx => (d["v1/transaction"] ?? d.transaction ?? d) as Tx;

export async function createCheckout(opts: {
  amount: number; description: string; callbackUrl: string; invoiceNumber: string;
  customer: { name: string; email?: string; phone?: string };
}) {
  const [firstname, ...rest] = opts.customer.name.trim().split(/\s+/);
  const digits = (opts.customer.phone || "").replace(/\D/g, "");
  const local = digits.startsWith("228") ? digits.slice(3) : digits;
  const tx = unwrap(
    await call<Record<string, unknown>>("POST", "/transactions", {
      description: opts.description,
      amount: opts.amount,
      currency: { iso: "XOF" },
      callback_url: opts.callbackUrl,
      custom_metadata: { invoice: opts.invoiceNumber },
      customer: {
        firstname: firstname || "Client",
        lastname: rest.join(" ") || "OQUI",
        ...(opts.customer.email ? { email: opts.customer.email } : {}),
        ...(local.length === 8 ? { phone_number: { number: local, country: "tg" } } : {}),
      },
    }),
  );
  const tok = await call<{ token: string; url: string }>("POST", `/transactions/${tx.id}/token`);
  return { id: String(tx.id), url: tok.url };
}

export async function getTransaction(id: string) {
  return unwrap(await call<Record<string, unknown>>("GET", `/transactions/${encodeURIComponent(id)}`));
}

/** Traduit le statut FedaPay vers celui de nos paiements. */
export const mapStatus = (s: string) =>
  s === "approved" || s === "transferred" ? "valide" : s === "declined" ? "refuse" : s === "canceled" || s === "refunded" ? "annule" : "en_attente";

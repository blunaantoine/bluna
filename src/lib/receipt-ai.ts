import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db";
import { mobileNumbers } from "./payment-methods";

import { ocrAvailable, readReceiptOcr } from "./receipt-ocr";

/**
 * Lecture des captures de paiement Mobile Money (T-Money, Flooz).
 * Par défaut : lecture GRATUITE sur le serveur (Tesseract, voir receipt-ocr.ts).
 * Option : si ANTHROPIC_API_KEY est renseignée, lecture par Claude (payante, plus robuste
 * sur les captures inhabituelles). Le code compare ensuite avec la facture
 * (montant, numéro destinataire, référence déjà utilisée…). La validation finale reste humaine.
 */

export async function receiptEngine(): Promise<"claude" | "ocr" | null> {
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  return (await ocrAvailable()) ? "ocr" : null;
}

export type Receipt = {
  is_payment_receipt: boolean;
  operator: "T-Money" | "Flooz" | "Autre" | "Inconnu";
  status: "reussi" | "echec" | "en_attente" | "inconnu";
  amount: number | null;
  fees: number | null;
  currency: string | null;
  reference: string | null;
  datetime: string | null;
  sender_number: string | null;
  recipient_number: string | null;
  recipient_name: string | null;
  confidence: "haute" | "moyenne" | "basse";
  notes: string;
};

export type Check = { label: string; ok: boolean | null; detail: string };
export type Analysis = { receipt: Receipt; checks: Check[]; verdict: "conforme" | "a_verifier" | "suspect"; analyzedAt: string; model: string };

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["is_payment_receipt", "operator", "status", "amount", "fees", "currency", "reference", "datetime", "sender_number", "recipient_number", "recipient_name", "confidence", "notes"],
  properties: {
    is_payment_receipt: { type: "boolean", description: "L'image montre-t-elle une confirmation de transfert d'argent ?" },
    operator: { type: "string", enum: ["T-Money", "Flooz", "Autre", "Inconnu"] },
    status: { type: "string", enum: ["reussi", "echec", "en_attente", "inconnu"] },
    amount: { type: ["integer", "null"], description: "Montant transféré en francs CFA, sans les frais" },
    fees: { type: ["integer", "null"], description: "Frais en francs CFA s'ils sont affichés" },
    currency: { type: ["string", "null"] },
    reference: { type: ["string", "null"], description: "Identifiant de transaction tel qu'écrit (Ref, ID, Txn…)" },
    datetime: { type: ["string", "null"], description: "Date et heure du transfert au format ISO 8601 (AAAA-MM-JJTHH:MM), heure locale de Lomé" },
    sender_number: { type: ["string", "null"], description: "Numéro de l'expéditeur, chiffres uniquement" },
    recipient_number: { type: ["string", "null"], description: "Numéro du destinataire, chiffres uniquement" },
    recipient_name: { type: ["string", "null"] },
    confidence: { type: "string", enum: ["haute", "moyenne", "basse"], description: "Lisibilité de la capture" },
    notes: { type: "string", description: "Une phrase en français : éléments manquants, illisibles ou incohérents. Vide si rien à signaler." },
  },
} as const;

const PROMPT = `Tu lis une capture d'écran envoyée par un client togolais comme preuve d'un paiement Mobile Money (T-Money de Togocom, Flooz de Moov Africa, parfois un SMS de confirmation, parfois l'écran d'une application).
Extrais uniquement ce qui est réellement visible. N'invente rien : si une information n'apparaît pas ou est illisible, mets null.
Les montants sont en francs CFA ; écris-les en nombre entier (25 000 F -> 25000). Les numéros : chiffres seulement, sans indicatif ni espaces (+228 90 12 34 56 -> 90123456).
Si l'image n'est pas une preuve de transfert (photo quelconque, capture sans montant), mets is_payment_receipt à false et explique-le dans notes.`;

const digits8 = (s?: string | null) => (s ?? "").replace(/\D/g, "").slice(-8);

/** Option payante : envoie l'image à Claude et renvoie les informations lues. */
export async function readReceiptClaude(jpeg: Buffer): Promise<{ receipt: Receipt; model: string }> {
  const client = new Anthropic({ timeout: 60_000, maxRetries: 2, ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: process.env.ANTHROPIC_BASE_URL } : {}) });
  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA as unknown as Record<string, unknown> } },
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpeg.toString("base64") } },
        { type: "text", text: PROMPT },
      ],
    }],
  });
  if (response.stop_reason === "refusal") throw new Error("Lecture refusée par le modèle");
  if (response.stop_reason === "max_tokens") throw new Error("Réponse incomplète");
  const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text ?? "";
  return { receipt: JSON.parse(text) as Receipt, model: response.model };
}

/** Compare la capture avec le paiement déclaré et la facture. */
export async function checkReceipt(r: Receipt, ctx: { paymentId: string; declaredAmount: number; operator: string; remaining: number }): Promise<{ checks: Check[]; verdict: Analysis["verdict"] }> {
  const ours = (await mobileNumbers()).map(digits8).filter(Boolean);
  const checks: Check[] = [];
  checks.push({ label: "Preuve de paiement", ok: r.is_payment_receipt, detail: r.is_payment_receipt ? "L'image montre un transfert." : "L'image ne ressemble pas à une confirmation de transfert." });
  checks.push({ label: "Transfert réussi", ok: r.status === "reussi" ? true : r.status === "inconnu" ? null : false, detail: { reussi: "Statut « réussi » visible.", echec: "La capture indique un échec.", en_attente: "La capture indique un transfert en attente.", inconnu: "Statut non visible." }[r.status] });
  checks.push({ label: "Montant", ok: r.amount == null ? null : r.amount === ctx.declaredAmount, detail: r.amount == null ? "Montant illisible." : r.amount === ctx.declaredAmount ? `${r.amount} F, comme déclaré.` : `Capture : ${r.amount} F, déclaré : ${ctx.declaredAmount} F.` });
  const to = digits8(r.recipient_number);
  checks.push({ label: "Envoyé à votre numéro", ok: !to ? null : ours.includes(to), detail: !to ? "Numéro du destinataire absent de la capture." : ours.includes(to) ? `Destinataire ${to} : c'est bien vous.` : `Destinataire ${to} : ce n'est pas un de vos numéros.` });
  if (r.operator !== "Inconnu" && r.operator !== "Autre") {
    const family = (s: string) => (/flooz|moov/i.test(s) ? "Flooz" : /t[\s-]?money|togocom/i.test(s) ? "T-Money" : null);
    const declared = family(ctx.operator);
    const same = !declared || declared === r.operator;
    if (declared) checks.push({ label: "Opérateur", ok: same, detail: same ? `${r.operator}.` : `Capture ${r.operator}, déclaré ${ctx.operator}.` });
  }
  if (r.reference) {
    const dup = await db.payment.findFirst({ where: { id: { not: ctx.paymentId }, reference: r.reference, status: { in: ["valide", "en_attente"] } }, include: { invoice: true } });
    checks.push({ label: "Référence unique", ok: !dup, detail: dup ? `Déjà utilisée pour la facture ${dup.invoice.number} : capture probablement réutilisée.` : `Référence ${r.reference} jamais vue.` });
  } else {
    checks.push({ label: "Référence unique", ok: null, detail: "Aucune référence lisible." });
  }
  if (r.datetime) {
    const d = new Date(r.datetime);
    const ageDays = (Date.now() - d.getTime()) / 864e5;
    checks.push({ label: "Date récente", ok: isNaN(+d) ? null : ageDays >= -1 && ageDays <= 15, detail: isNaN(+d) ? "Date illisible." : ageDays > 15 ? `Transfert du ${d.toLocaleDateString("fr-FR")} : ancien.` : `Transfert du ${d.toLocaleString("fr-FR")}.` });
  }
  const failed = checks.filter((c) => c.ok === false);
  const unknown = checks.filter((c) => c.ok === null);
  const severe = failed.some((c) => ["Preuve de paiement", "Référence unique", "Envoyé à votre numéro", "Transfert réussi"].includes(c.label));
  const verdict: Analysis["verdict"] = severe ? "suspect" : failed.length || unknown.length || r.confidence === "basse" ? "a_verifier" : "conforme";
  return { checks, verdict };
}

/** Lit la capture d'un paiement, compare, et enregistre le résultat. N'échoue jamais. */
export async function analyzePayment(paymentId: string, jpeg: Buffer): Promise<Analysis | null> {
  const engine = await receiptEngine();
  if (!engine) return null;
  const p = await db.payment.findUnique({ where: { id: paymentId }, include: { invoice: true } });
  if (!p) return null;
  try {
    const { receipt, model } = engine === "claude" ? await readReceiptClaude(jpeg) : { receipt: (await readReceiptOcr(jpeg)).receipt, model: "lecture-serveur" };
    const { checks, verdict } = await checkReceipt(receipt, { paymentId, declaredAmount: p.amount, operator: p.provider, remaining: p.invoice.total - p.invoice.amountPaid });
    const analysis: Analysis = { receipt, checks, verdict, analyzedAt: new Date().toISOString(), model };
    const paidOn = receipt.datetime && !isNaN(+new Date(receipt.datetime)) ? new Date(receipt.datetime) : null;
    await db.payment.update({
      where: { id: paymentId },
      data: { aiData: JSON.stringify(analysis), aiVerdict: verdict, reference: receipt.reference ?? p.reference, paidOn },
    });
    return analysis;
  } catch (e) {
    console.error("[lecture capture]", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e);
    return null;
  }
}

export const verdictLabel = { conforme: "Conforme", a_verifier: "À vérifier", suspect: "Suspect" } as const;

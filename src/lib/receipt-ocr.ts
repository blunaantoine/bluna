import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import type { Receipt } from "./receipt-ai";

/**
 * Lecture GRATUITE des captures de paiement, entièrement sur le serveur :
 * Tesseract (logiciel libre de reconnaissance de texte) lit l'image, puis des
 * règles adaptées aux messages T-Money et Flooz extraient les informations.
 * Aucune donnée ne quitte le serveur. Installation : apt install tesseract-ocr tesseract-ocr-fra
 */

const run = promisify(execFile);
let available: boolean | null = null;

export async function ocrAvailable() {
  if (available !== null) return available;
  try { await run("tesseract", ["--version"], { timeout: 5000 }); available = true; } catch { available = false; }
  return available;
}

/** Image -> texte. */
export async function imageToText(jpeg: Buffer): Promise<{ text: string; confidence: number }> {
  // Pré-traitement léger : niveaux de gris, agrandissement seulement pour les petites images.
  // (Un contraste ou une netteté trop forts effacent les lignes sur fond gris des bulles SMS.)
  const meta = await sharp(jpeg).metadata();
  const w = meta.width ?? 1000;
  const png = await sharp(jpeg).grayscale().resize(w < 700 ? { width: w * 2 } : undefined).png().toBuffer();
  const base = `/tmp/oqui-ocr-${process.pid}-${Date.now()}`;
  const { writeFile, readFile, unlink } = await import("node:fs/promises");
  await writeFile(`${base}.png`, png);
  try {
    // Un seul passage produit le texte (.txt) et la confiance mot par mot (.tsv).
    // OMP_THREAD_LIMIT=1 évite que plusieurs lectures simultanées se bloquent entre elles.
    await run("tesseract", [`${base}.png`, base, "-l", "fra+eng", "--psm", "3", "txt", "tsv"], { timeout: 60000, env: { ...process.env, OMP_THREAD_LIMIT: "1" } });
    const [text, tsv] = await Promise.all([readFile(`${base}.txt`, "utf8"), readFile(`${base}.tsv`, "utf8")]);
    const confs = tsv.split("\n").slice(1).map((l) => Number(l.split("\t")[10])).filter((c) => c >= 0);
    return { text, confidence: confs.length ? confs.reduce((a, c) => a + c, 0) / confs.length : 0 };
  } finally {
    await Promise.all([".png", ".txt", ".tsv"].map((e) => unlink(base + e).catch(() => {})));
  }
}

// ── Extraction ─────────────────────────────────────────────

const AMOUNT = String.raw`(\d{1,3}(?:[ .  ]\d{3})+|\d{1,9})(?:[.,]\d{1,2})?\s*(?:F\s?CFA|FCFA|XOF|CFA|F)\b`;
const toInt = (s: string) => parseInt(s.replace(/[^\d]/g, ""), 10);

/** Corrige les confusions classiques de l'OCR à l'intérieur des nombres (O→0, l/I→1, S→5…). */
function fixDigits(text: string) {
  return text
    .replace(/(?<=[\d\s:])[Oo](?=[\d\s]|\s?F)/g, "0")
    .replace(/(?<=\d)[lI|](?=\d)/g, "1")
    .replace(/(?<=\d)[S](?=\d)/g, "5")
    .replace(/(?<=\d)[B](?=\d)/g, "8");
}

/** Préfixes des numéros mobiles au Togo : Togocom (T-Money) et Moov Africa (Flooz). */
const TMONEY_PREFIX = /^(70|71|72|73|90|91|92|93)/;
const FLOOZ_PREFIX = /^(79|96|97|98|99)/;
const phoneOperator = (n: string | null) => (!n ? null : TMONEY_PREFIX.test(n) ? "T-Money" : FLOOZ_PREFIX.test(n) ? "Flooz" : null);

export function parseReceiptText(raw: string, ocrConfidence = 100): Receipt {
  const text = fixDigits(raw.replace(/\r/g, ""));
  const flat = text.replace(/\s+/g, " ");
  const lower = flat.toLowerCase();

  // Montant : on privilégie celui qui suit un verbe de transfert, on ignore solde et frais.
  let amount: number | null = null;
  const ctx = new RegExp(String.raw`(?:transfert(?:\s+de)?|envoy[ée]+|montant|pay[ée]+|paiement(?:\s+de)?|re[çc]u|d[ée]p[ôo]t(?:\s+de)?)\s*:?\s*` + AMOUNT, "i").exec(flat);
  if (ctx) amount = toInt(ctx[1]);
  if (amount == null) {
    for (const m of flat.matchAll(new RegExp(AMOUNT, "gi"))) {
      const before = flat.slice(Math.max(0, m.index! - 22), m.index!).toLowerCase();
      if (/solde|frais|commission|balance|fee/.test(before)) continue;
      const v = toInt(m[1]); if (v >= 50) { amount = v; break; }
    }
  }
  const feeM = new RegExp(String.raw`(?:frais|commission|fees?)\s*:?\s*` + AMOUNT, "i").exec(flat);
  const fees = feeM ? toInt(feeM[1]) : null;

  // Référence de transaction
  const refM = /(?:r[ée]f(?:[ée]rence)?|txn\s*id|trans(?:action)?\s*(?:id|n[o°])?|id\s*(?:de\s*)?transaction|code)\s*[:.#n°]*\s*([A-Z0-9][A-Z0-9.\-/]{5,})/i.exec(flat);
  const reference = refM ? refM[1].replace(/[.\-/]+$/, "") : null;

  // Date et heure (09/11/26 14:02, 09/11/2026 à 14h02…)
  let datetime: string | null = null;
  const dM = /(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})(?:\s*(?:à|a|,|-)?\s*(\d{1,2})\s*[:h]\s*(\d{2}))?/i.exec(flat);
  if (dM) {
    const [, dd, mm, yy, hh = "00", mi = "00"] = dM;
    const year = yy.length === 2 ? 2000 + +yy : +yy;
    if (+mm >= 1 && +mm <= 12 && +dd >= 1 && +dd <= 31) datetime = `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${hh.padStart(2, "0")}:${mi}`;
  }

  // Numéros : 8 chiffres (espaces tolérés), indicatif 228 retiré
  const phoneRe = /(?:\+?228[\s.]?)?((?:7|9)\d(?:[\s.]?\d){6})\b/g;
  const phones = [...flat.matchAll(phoneRe)].map((m) => ({ n: m[1].replace(/\D/g, ""), i: m.index! }));
  const near = (re: RegExp) => phones.find((p) => re.test(flat.slice(Math.max(0, p.i - 30), p.i).toLowerCase()))?.n ?? null;
  const recipient_number = near(/(vers|au|à|a|destinataire|b[ée]n[ée]ficiaire|to|num[ée]ro)\s*:?\s*\(?$/) ?? (phones.length === 1 ? phones[0].n : null);
  const sender_number = near(/(de|from|exp[ée]diteur|envoy[ée] par)\s*:?\s*$/);

  // Nom du destinataire : majuscules après le numéro
  const nameM = recipient_number ? new RegExp(recipient_number.split("").join(String.raw`[\s.]?`) + String.raw`\s*\(?([A-ZÀ-Ý][A-ZÀ-Ý' -]{2,40}?)\)?(?=[.,]|\s+(?:Frais|reussi|réussi|$))`).exec(flat) : null;
  const nomM = /\b[Nn]om\s*:?\s*([A-ZÀ-Ý][A-ZÀ-Ý' -]{2,40}?)(?=\s+(?:Frais|Date|R[ée]f|$))/.exec(flat);
  const recipient_name = (nameM?.[1] ?? nomM?.[1] ?? null)?.trim() || null;

  // Opérateur
  let operator: Receipt["operator"] = /flooz|moov/i.test(flat) ? "Flooz" : /t[\s-]?money|togocom|togocel/i.test(flat) ? "T-Money" : "Inconnu";
  if (operator === "Inconnu") operator = (phoneOperator(recipient_number) as Receipt["operator"]) ?? "Inconnu";

  // Statut
  const status: Receipt["status"] = /[ée]chec|echou|failed|annul[ée]|refus[ée]|insuffisant/.test(lower) ? "echec"
    : /en attente|pending|en cours/.test(lower) ? "en_attente"
    : /r[ée]ussi|succ[eè]s|effectu[ée]|confirm[ée]|successful|vous avez envoy|transf[ée]r[ée]/.test(lower) ? "reussi" : "inconnu";

  const is_payment_receipt = amount != null && (/transf|envoy|paiement|pay|d[ée]p[ôo]t|retrait|re[çc]u/.test(lower) || !!reference);
  const found = [amount, reference, datetime, recipient_number].filter((x) => x != null).length;
  const confidence: Receipt["confidence"] = ocrConfidence >= 80 && found >= 3 ? "haute" : ocrConfidence >= 60 && found >= 2 ? "moyenne" : "basse";

  const missing = [!amount && "montant", !reference && "référence", !datetime && "date", !recipient_number && "numéro du destinataire"].filter(Boolean);
  const notes = !is_payment_receipt ? "Aucun montant de transfert reconnu : ce n'est peut-être pas une capture de paiement, ou elle est illisible."
    : missing.length ? `Non trouvé sur la capture : ${missing.join(", ")}.` : "";

  return { is_payment_receipt, operator, status, amount, fees, currency: amount != null ? "XOF" : null, reference, datetime, sender_number, recipient_number, recipient_name, confidence, notes };
}

export async function readReceiptOcr(jpeg: Buffer) {
  const { text, confidence } = await imageToText(jpeg);
  return { receipt: parseReceiptText(text, confidence), text };
}

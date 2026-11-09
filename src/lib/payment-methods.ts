import type { PaymentMethod } from "@prisma/client";
import { db } from "./db";
import { profile } from "@/content/site";

export type PublicMethod = Pick<PaymentMethod, "id" | "kind" | "label" | "value" | "holder" | "details">;

export const KINDS: Record<string, string> = { mobile: "Mobile Money", banque: "Virement bancaire", carte: "Carte bancaire", autre: "Autre moyen" };

/** Au premier appel, enregistre les numéros de départ (modifiables ensuite dans l'admin). */
async function seedIfEmpty() {
  if (await db.paymentMethod.count()) return;
  await db.paymentMethod.createMany({
    data: [
      { kind: "mobile", label: "T-Money", value: process.env.PAY_TMONEY_NUMBER || "+228 71 99 81 55", holder: profile.name, order: 0 },
      { kind: "mobile", label: "Flooz (Moov)", value: process.env.PAY_FLOOZ_NUMBER || "+228 96 22 28 21", holder: profile.name, order: 1 },
    ],
  });
}

export async function getPaymentMethods(opts: { all?: boolean } = {}): Promise<PaymentMethod[]> {
  await seedIfEmpty();
  return db.paymentMethod.findMany({ where: opts.all ? {} : { active: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
}

export const toPublicMethod = (m: PaymentMethod): PublicMethod => ({ id: m.id, kind: m.kind, label: m.label, value: m.value, holder: m.holder, details: m.details });

/** Les 8 derniers chiffres des numéros Mobile Money actifs (pour vérifier le destinataire d'une capture). */
export async function mobileNumbers() {
  return (await getPaymentMethods()).filter((m) => m.kind === "mobile").map((m) => m.value.replace(/\D/g, "").slice(-8)).filter(Boolean);
}

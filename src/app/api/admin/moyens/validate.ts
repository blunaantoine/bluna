const KINDS = ["mobile", "banque", "carte", "autre"];

export function methodInput(b: Record<string, unknown>, creating: boolean) {
  const d: Record<string, string | boolean | number> = {};
  const s = (k: string, max: number) => (typeof b[k] === "string" ? (b[k] as string).trim().slice(0, max) : undefined);
  if (b.kind !== undefined) { if (!KINDS.includes(b.kind as string)) return { error: "Type de moyen inconnu." }; d.kind = b.kind as string; }
  for (const [k, max] of [["label", 60], ["value", 120], ["holder", 120], ["details", 400]] as const) { const v = s(k, max); if (v !== undefined) d[k] = v; }
  if (typeof b.active === "boolean") d.active = b.active;
  if (typeof b.order === "number") d.order = Math.round(b.order);
  if (creating || d.label !== undefined) if (!d.label && creating) return { error: "Donnez un nom (ex. T-Money, Ecobank, Wave)." };
  if (creating && !d.value && d.kind !== "autre") return { error: "Indiquez le numéro, le compte ou l'adresse." };
  // Une carte ne doit jamais exposer sa date d'expiration ou son code de sécurité
  if (typeof d.details === "string" && /\b(cvv|cvc|cryptogramme)\b/i.test(d.details)) return { error: "N'indiquez jamais le code de sécurité (CVV) d'une carte." };
  return { data: d };
}

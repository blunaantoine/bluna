// Session admin : cookie signé (HMAC-SHA256), compatible middleware (Web Crypto).
export const SESSION_COOKIE = "bluna_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

const enc = new TextEncoder();
const secret = () => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";

async function hmac(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  let bin = "";
  for (const b of new Uint8Array(sig)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function createSession() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `admin.${exp}`;
  return { value: `${payload}.${await hmac(payload)}`, maxAge: MAX_AGE };
}

export async function verifySession(token?: string | null) {
  if (!token || !secret()) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [who, exp, sig] = parts;
  if (who !== "admin" || +exp < Date.now() / 1000) return false;
  const expected = await hmac(`${who}.${exp}`);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export function checkPassword(input: string) {
  const pass = process.env.ADMIN_PASSWORD || "";
  if (!pass || input.length !== pass.length) return false;
  let diff = 0;
  for (let i = 0; i < pass.length; i++) diff |= pass.charCodeAt(i) ^ input.charCodeAt(i);
  return diff === 0;
}

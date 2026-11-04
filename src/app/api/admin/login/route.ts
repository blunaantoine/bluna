import { NextResponse } from "next/server";
import { checkPassword, createSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "ADMIN_PASSWORD n'est pas défini dans le fichier .env du serveur." }, { status: 500 });
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || !checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }
  const s = await createSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, s.value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: s.maxAge });
  return res;
}

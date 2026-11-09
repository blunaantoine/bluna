import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyNewMessage } from "@/lib/notify";
import { offers, yearlyPrice } from "@/content/offers";
import { fcfa } from "@/lib/invoices";

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  list.push(now); hits.set(ip, list);
  return list.length > 5;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "Trop de messages envoyés. Réessayez dans quelques minutes ou écrivez sur WhatsApp." }, { status: 429 });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Requête invalide." }, { status: 400 }); }
  if (str(b.website, 100)) return NextResponse.json({ ok: true }); // pot de miel anti-robots

  const name = str(b.name, 120), body = str(b.body, 4000), phone = str(b.phone, 40), email = str(b.email, 160);
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Indiquez votre nom.";
  if (body.length < 10) errors.body = "Décrivez votre projet en une ou deux phrases.";
  if (!phone && !email) errors.phone = "Laissez un numéro WhatsApp ou un e-mail pour que je puisse vous répondre.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Cette adresse e-mail semble incomplète.";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });

  const services = Array.isArray(b.services) ? b.services.filter((x): x is string => typeof x === "string").slice(0, 10) : [];
  const projectSlug = str(b.projectSlug, 80) || null;
  const project = projectSlug ? await db.project.findUnique({ where: { slug: projectSlug }, select: { slug: true, title: true } }) : null;

  // Formule de suivi choisie sur la page /suivi : notée en tête du message
  const [offerId, period] = str(b.offer, 40).split(":");
  const offer = offers.find((o) => o.id === offerId);
  const fullBody = offer ? `[Formule de suivi : ${offer.title} — ${period === "annuel" ? `${fcfa(yearlyPrice(offer.monthly))} / an` : `${fcfa(offer.monthly)} / mois`}]\n${body}` : body;

  const message = await db.message.create({
    data: {
      name, phone, email, body: fullBody,
      company: str(b.company, 160),
      budget: str(b.budget, 80),
      deadline: str(b.deadline, 80),
      services: JSON.stringify(services),
      projectSlug: project?.slug ?? null,
    },
  });
  if (project) await db.project.update({ where: { slug: project.slug }, data: { inquiries: { increment: 1 } } });

  await notifyNewMessage({ message, projectTitle: project?.title ?? (offer ? `Formule ${offer.title}` : null) });
  return NextResponse.json({ ok: true, id: message.id });
}

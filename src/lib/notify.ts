import nodemailer from "nodemailer";
import type { Message } from "@prisma/client";

type Ctx = { message: Message; projectTitle?: string | null };

const site = () => (process.env.SITE_URL || "").replace(/\/$/, "");

function summary({ message: m, projectTitle }: Ctx) {
  const services = (() => { try { return (JSON.parse(m.services) as string[]).join(", "); } catch { return ""; } })();
  return [
    `Nouveau message de ${m.name}${m.company ? ` (${m.company})` : ""}`,
    projectTitle ? `Projet de référence : ${projectTitle}` : null,
    services ? `Besoin : ${services}` : null,
    m.budget ? `Budget : ${m.budget}` : null,
    m.deadline ? `Délai : ${m.deadline}` : null,
    m.phone ? `Téléphone : ${m.phone}` : null,
    m.email ? `E-mail : ${m.email}` : null,
    "",
    m.body,
    "",
    site() ? `Ouvrir la boîte de réception : ${site()}/admin` : null,
  ].filter((l) => l !== null).join("\n");
}

async function telegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
  });
}

async function email(subject: string, text: string, replyTo?: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFY_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !NOTIFY_EMAIL) return;
  const port = Number(SMTP_PORT || 465);
  const t = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  await t.sendMail({ from: `OQUI <${SMTP_USER}>`, to: NOTIFY_EMAIL, subject, text, replyTo: replyTo || undefined });
}

/** Envoie une alerte libre (Telegram + e-mail). N'échoue jamais. */
export async function sendAlert(subject: string, text: string, replyTo?: string) {
  const body = `${subject}\n\n${text}`;
  const results = await Promise.allSettled([telegram(body), email(subject, text, replyTo)]);
  results.forEach((r) => r.status === "rejected" && console.error("[notification]", r.reason));
}

/** Prévient Antoine par tous les canaux configurés. N'échoue jamais : le message reste enregistré dans l'admin. */
export async function notifyNewMessage(ctx: Ctx) {
  const text = summary(ctx);
  const subject = ctx.projectTitle
    ? `Nouveau projet similaire à « ${ctx.projectTitle} » — ${ctx.message.name}`
    : `Nouveau message — ${ctx.message.name}`;
  const results = await Promise.allSettled([telegram(text), email(subject, text, ctx.message.email)]);
  results.forEach((r) => r.status === "rejected" && console.error("[notification]", r.reason));
}

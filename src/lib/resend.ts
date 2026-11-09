/**
 * Envoi d'e-mails avec Resend (https://resend.com), par l'API REST.
 * Réglages : RESEND_API_KEY et RESEND_FROM (ex. « OQUI <recus@oquitogo.com> »),
 * le domaine de l'adresse d'envoi devant être vérifié dans Resend.
 */
export const resendEnabled = () => !!process.env.RESEND_API_KEY;

export async function sendEmail(m: { to: string; subject: string; html: string; text: string; replyTo?: string; attachments?: { filename: string; content: Buffer }[] }) {
  if (!resendEnabled()) throw new Error("RESEND_API_KEY manquante");
  const res = await fetch(`${process.env.RESEND_API_BASE || "https://api.resend.com"}/emails`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "OQUI <recus@oquitogo.com>",
      to: [m.to],
      subject: m.subject,
      html: m.html,
      text: m.text,
      ...(m.replyTo ? { reply_to: m.replyTo } : {}),
      ...(m.attachments?.length ? { attachments: m.attachments.map((a) => ({ filename: a.filename, content: a.content.toString("base64") })) } : {}),
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) throw new Error(`Resend ${res.status} : ${data.message ?? "erreur"}`);
  return data.id ?? "";
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

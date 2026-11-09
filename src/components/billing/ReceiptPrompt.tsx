"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = { token: string; paymentId?: string; defaultEmail?: string; pending?: boolean; autoOpen?: boolean; delay?: number; trigger?: React.ReactNode };

/** Fenêtre « Recevoir votre reçu par e-mail ». */
export default function ReceiptPrompt({ token, paymentId, defaultEmail = "", pending = false, autoOpen = false, delay = 900, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [result, setResult] = useState<{ sent: number; pending: number } | null>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!autoOpen) return;
    try { if (sessionStorage.getItem(`recu:${paymentId ?? token}`)) return; } catch {}
    const t = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(t);
  }, [autoOpen, delay, paymentId, token]);
  useEffect(() => {
    if (!open) return;
    setTimeout(() => input.current?.focus(), 250);
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  });

  function close() {
    setOpen(false);
    try { sessionStorage.setItem(`recu:${paymentId ?? token}`, "1"); } catch {}
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setState("sending");
    const res = await fetch(`/api/factures/${token}/recu`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, paymentId }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setError(d.errors?.email || d.error || "L'envoi a échoué."); setState("idle"); return; }
    setResult({ sent: d.sent, pending: d.pending }); setState("done");
    try { sessionStorage.setItem(`recu:${paymentId ?? token}`, "1"); } catch {}
  }

  return (
    <>
      {trigger && <span onClick={() => { setState("idle"); setOpen(true); }}>{trigger}</span>}
      {mounted && createPortal(<AnimatePresence>
        {open && (
          <motion.div className="rp-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="rp-title">
            <div className="rp-backdrop" onClick={close} />
            <motion.div className="rp-card" initial={{ y: 40, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 30 }}>
              <button className="icon-btn rp-close" onClick={close} aria-label="Fermer">×</button>
              <span className="rp-icon" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
              </span>
              {state !== "done" ? (
                <form onSubmit={submit} className="rp-form" noValidate>
                  <h2 id="rp-title" className="display">Recevoir votre reçu</h2>
                  <p>{pending ? "Indiquez votre e-mail : le reçu vous sera envoyé dès qu'Antoine aura confirmé la réception du paiement." : "Indiquez votre e-mail pour recevoir le reçu de ce paiement, à garder pour vos archives."}</p>
                  <label className={`field${error ? " invalid" : ""}`}>
                    <span>Votre adresse e-mail</span>
                    <input ref={input} id="rp-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="vous@exemple.com" />
                    {error && <span className="err">{error}</span>}
                  </label>
                  <button className="btn" disabled={state === "sending" || !email}>{state === "sending" ? "Envoi…" : pending ? "Recevoir le reçu" : "Envoyer le reçu"}</button>
                  <button type="button" className="link-arrow rp-skip" onClick={close}>Non merci</button>
                </form>
              ) : (
                <div className="rp-form" role="status">
                  <h2 id="rp-title" className="display">{result?.sent ? "Reçu envoyé !" : "C'est noté !"}</h2>
                  <p>{result?.sent ? <>Le reçu vient d&apos;être envoyé à <b>{email}</b>. Pensez à regarder dans les courriers indésirables.</> : <>Vous recevrez le reçu à <b>{email}</b> dès que le paiement sera confirmé.</>}</p>
                  <button className="btn" onClick={close}>Fermer</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </>
  );
}

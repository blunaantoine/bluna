"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import ReceiptPrompt from "./ReceiptPrompt";
import type { PublicMethod } from "@/lib/payment-methods";

type Props = { token: string; number: string; due: number; allowDeposit: boolean; online: boolean; autoOpen: boolean; methods: PublicMethod[]; hasPending: boolean; receiptEnabled?: boolean; clientEmail?: string; discount?: number; discountLabel?: string };

const fmt = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/ | /g, " ")} FCFA`;

export default function PayPanel(p: Props) {
  const [open, setOpen] = useState(p.autoOpen);
  const [mode, setMode] = useState<"online" | "mobile">(p.online ? "online" : "mobile");
  const [part, setPart] = useState<"tout" | "acompte">("tout");
  const [deposit, setDeposit] = useState(Math.round(p.due / 2 / 100) * 100 || p.due);
  const [methodId, setMethodId] = useState(p.methods[0]?.id ?? "");
  const [proof, setProof] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [declared, setDeclared] = useState(p.hasPending);
  const [declaredId, setDeclaredId] = useState<string | null>(null);
  const [copied, setCopied] = useState("");

  const amount = p.allowDeposit && part === "acompte" ? Math.min(Math.max(100, deposit || 0), p.due) : p.due;
  useEffect(() => { if (open) document.getElementById("pay-sheet")?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [open]);


  async function payOnline(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErrors({});
    const res = await fetch(`/api/factures/${p.token}/payer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amount }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.url) { window.location.href = d.url; return; }
    setErrors({ form: d.error || "Le paiement n'a pas pu démarrer. Réessayez." }); setBusy(false);
  }
  async function declare(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErrors({});
    const fd = new FormData();
    fd.append("amount", String(amount)); fd.append("methodId", methodId); if (proof) fd.append("proof", proof);
    const res = await fetch(`/api/factures/${p.token}/declarer`, { method: "POST", body: fd });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) { setDeclared(true); setDeclaredId(d.paymentId ?? null); return; }
    setErrors(d.errors ?? { form: d.error || "L'envoi a échoué. Réessayez." });
  }
  const copy = async (txt: string, key: string) => { try { await navigator.clipboard.writeText(txt.replace(/\s/g, "")); setCopied(key); setTimeout(() => setCopied(""), 2000); } catch {} };
  const numbers = p.methods;
  const allMobile = numbers.every((m) => m.kind === "mobile");

  return (
    <div className="pay-card" id="pay-sheet">
      <span className="eyebrow">Reste à payer</span>
      <strong className="pay-due display">{fmt(p.due)}</strong>
      <p className="mono">Facture {p.number}</p>
      {!!p.discount && <p className="pay-discount">Remise de {fmt(p.discount)} incluse{p.discountLabel ? ` — ${p.discountLabel}` : ""}</p>}

      {!open && (
        <motion.button className="btn pay-open" onClick={() => setOpen(true)} whileTap={{ scale: 0.97 }}>
          Payer maintenant
        </motion.button>
      )}
      {!open && <p className="pay-methods">{p.online ? "T-Money · Flooz · Visa · Mastercard" : numbers.map((m) => m.label).join(" · ")}</p>}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="pay-sheet" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
            <div className="pay-sheet-inner">
              {p.allowDeposit && (
                <fieldset>
                  <legend>Montant</legend>
                  <div className="seg">
                    <button type="button" aria-pressed={part === "tout"} onClick={() => setPart("tout")}>Tout régler<small>{fmt(p.due)}</small></button>
                    <button type="button" aria-pressed={part === "acompte"} onClick={() => setPart("acompte")}>Payer un acompte<small>montant libre</small></button>
                  </div>
                  {part === "acompte" && (
                    <label className="field"><span>Montant de l'acompte (FCFA)</span><input id="deposit" type="number" inputMode="numeric" min={100} max={p.due} step={100} value={deposit} onChange={(e) => setDeposit(+e.target.value)} /></label>
                  )}
                </fieldset>
              )}

              {p.online && numbers.length > 0 && (
                <div className="seg" role="tablist" aria-label="Moyen de paiement">
                  <button type="button" role="tab" aria-selected={mode === "online"} aria-pressed={mode === "online"} onClick={() => setMode("online")}>Paiement en ligne<small>T-Money, Flooz, carte</small></button>
                  <button type="button" role="tab" aria-selected={mode === "mobile"} aria-pressed={mode === "mobile"} onClick={() => setMode("mobile")}>Transfert manuel<small>envoi depuis votre téléphone</small></button>
                </div>
              )}

              {mode === "online" ? (
                <form onSubmit={payOnline} className="form" noValidate>
                  {errors.form && <p className="err" role="alert">{errors.form}</p>}
                  <button className="btn" disabled={busy}>{busy ? "Ouverture du paiement…" : `Payer ${fmt(amount)}`}</button>
                  <p className="pay-note">Vous allez être redirigé vers la page sécurisée FedaPay pour choisir T-Money, Flooz ou votre carte. La facture se met à jour dès la confirmation.</p>
                </form>
              ) : declared ? (
                <div className="pay-ok" role="status">
                  <b>Paiement en cours de vérification</b>
                  <p>Antoine a été prévenu. Dès qu'il confirme la réception, la facture passe en « Payée ». Gardez la confirmation du paiement.</p>
                  {p.receiptEnabled && declaredId && <ReceiptPrompt token={p.token} paymentId={declaredId} defaultEmail={p.clientEmail} pending autoOpen delay={500} />}
                </div>
              ) : numbers.length ? (
                <form onSubmit={declare} className="form" noValidate>
                  <ol className="pay-steps">
                    <li>Envoyez <b>{fmt(amount)}</b> {numbers.length > 1 ? (allMobile ? "à l'un de ces numéros" : "par l'un de ces moyens") : allMobile ? "à ce numéro" : "par ce moyen"} :
                      <ul className="pay-numbers">
                        {numbers.map((x) => (
                          <li key={x.id}>
                            <span>
                              <small>{x.label}</small>
                              {x.value && <b>{x.value}</b>}
                              {x.holder && <span className="pm-extra">Au nom de {x.holder}</span>}
                              {x.details && <span className="pm-extra">{x.details}</span>}
                            </span>
                            {x.value && <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(x.value, x.id)}>{copied === x.id ? "Copié" : "Copier"}</button>}
                          </li>
                        ))}
                      </ul>
                      <span className="mono">Motif à indiquer : {p.number}</span>
                    </li>
                    <li>{numbers.length > 1 ? "Indiquez le moyen utilisé, puis touchez" : "Touchez"} « J'ai payé ». Vous pouvez joindre la capture de la confirmation : c'est facultatif, mais cela accélère la vérification.</li>
                  </ol>
                  {numbers.length > 1 && (
                    <div className="chips">
                      {numbers.map((x) => <label key={x.id} className="chip"><input type="radio" name="op" id={`op-${x.id}`} checked={methodId === x.id} onChange={() => setMethodId(x.id)} /><span>{x.label}</span></label>)}
                    </div>
                  )}
                  <label className={`proof-drop${proof ? " has" : ""}${errors.proof ? " invalid" : ""}`}>
                    <input id="decl-proof" type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0] ?? null; setProof(file); setErrors({}); setPreview(file ? URL.createObjectURL(file) : ""); }} />
                    {preview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="Aperçu de la capture du paiement" />
                        <span className="proof-change">Changer la capture</span>
                      </>
                    ) : (
                      <span className="proof-empty">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" /><circle cx="9" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.6" /><path d="M21 16l-5-5-9 8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                        <b>Ajouter la capture <span className="opt">(facultatif)</span></b>
                        <small>Photo ou capture d'écran du SMS ou du reçu de paiement</small>
                      </span>
                    )}
                  </label>
                  {errors.proof && <p className="err">{errors.proof}</p>}
                  {errors.amount && <p className="err">{errors.amount}</p>}
                  {errors.form && <p className="err" role="alert">{errors.form}</p>}
                  <button className="btn" disabled={busy}>{busy ? "Envoi…" : "J'ai payé"}</button>
                </form>
              ) : (
                <p className="pay-note">Le paiement en ligne sera bientôt disponible. Contactez Antoine sur WhatsApp pour régler cette facture.</p>
              )}
              <button type="button" className="link-arrow pay-close" onClick={() => setOpen(false)}>Fermer</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

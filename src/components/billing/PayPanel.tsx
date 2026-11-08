"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type Props = { token: string; number: string; due: number; allowDeposit: boolean; online: boolean; autoOpen: boolean; tmoney: string; flooz: string; hasPending: boolean };

const fmt = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/ | /g, " ")} FCFA`;

export default function PayPanel(p: Props) {
  const [open, setOpen] = useState(p.autoOpen);
  const [mode, setMode] = useState<"online" | "mobile">(p.online ? "online" : "mobile");
  const [part, setPart] = useState<"tout" | "acompte">("tout");
  const [deposit, setDeposit] = useState(Math.round(p.due / 2 / 100) * 100 || p.due);
  const [f, setF] = useState({ name: "", phone: "", email: "", reference: "", operator: p.tmoney ? "tmoney" : "flooz" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [declared, setDeclared] = useState(p.hasPending);
  const [copied, setCopied] = useState("");

  const amount = p.allowDeposit && part === "acompte" ? Math.min(Math.max(100, deposit || 0), p.due) : p.due;
  useEffect(() => { if (open) document.getElementById("pay-sheet")?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [open]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => { setF({ ...f, [k]: e.target.value }); setErrors({}); };

  async function payOnline(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErrors({});
    const res = await fetch(`/api/factures/${p.token}/payer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amount, name: f.name, phone: f.phone, email: f.email }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.url) { window.location.href = d.url; return; }
    setErrors({ form: d.error || "Le paiement n'a pas pu démarrer. Réessayez." }); setBusy(false);
  }
  async function declare(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErrors({});
    const res = await fetch(`/api/factures/${p.token}/declarer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amount, operator: f.operator, reference: f.reference, phone: f.phone }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) { setDeclared(true); return; }
    setErrors(d.errors ?? { form: d.error || "L'envoi a échoué. Réessayez." });
  }
  const copy = async (txt: string, key: string) => { try { await navigator.clipboard.writeText(txt.replace(/\s/g, "")); setCopied(key); setTimeout(() => setCopied(""), 2000); } catch {} };
  const numbers = [p.tmoney && { key: "tmoney", label: "T-Money", n: p.tmoney }, p.flooz && { key: "flooz", label: "Flooz (Moov)", n: p.flooz }].filter(Boolean) as { key: string; label: string; n: string }[];

  return (
    <div className="pay-card" id="pay-sheet">
      <span className="eyebrow">Reste à payer</span>
      <strong className="pay-due display">{fmt(p.due)}</strong>
      <p className="mono">Facture {p.number}</p>

      {!open && (
        <motion.button className="btn pay-open" onClick={() => setOpen(true)} whileTap={{ scale: 0.97 }}>
          Payer maintenant
        </motion.button>
      )}
      {!open && <p className="pay-methods">T-Money · Flooz · Visa · Mastercard</p>}

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
                  <label className="field"><span>Nom du payeur</span><input id="pay-name" autoComplete="name" value={f.name} onChange={set("name")} placeholder="Ex. Afi Mensah" /></label>
                  <div className="field-row">
                    <label className="field"><span>Numéro Mobile Money</span><input id="pay-phone" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} placeholder="90 00 00 00" /></label>
                    <label className="field"><span>E-mail (reçu)</span><input id="pay-email" type="email" autoComplete="email" value={f.email} onChange={set("email")} placeholder="facultatif" /></label>
                  </div>
                  {errors.form && <p className="err" role="alert">{errors.form}</p>}
                  <button className="btn" disabled={busy}>{busy ? "Ouverture du paiement…" : `Payer ${fmt(amount)}`}</button>
                  <p className="pay-note">Vous allez être redirigé vers la page sécurisée FedaPay pour choisir T-Money, Flooz ou votre carte. La facture se met à jour dès la confirmation.</p>
                </form>
              ) : declared ? (
                <div className="pay-ok" role="status">
                  <b>Paiement en cours de vérification</b>
                  <p>Antoine a été prévenu. Dès qu'il confirme la réception, la facture passe en « Payée ». Gardez le SMS de confirmation.</p>
                </div>
              ) : numbers.length ? (
                <form onSubmit={declare} className="form" noValidate>
                  <ol className="pay-steps">
                    <li>Envoyez <b>{fmt(amount)}</b> à l'un de ces numéros :
                      <ul className="pay-numbers">
                        {numbers.map((x) => (
                          <li key={x.key}><span><small>{x.label}</small><b>{x.n}</b></span><button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(x.n, x.key)}>{copied === x.key ? "Copié" : "Copier"}</button></li>
                        ))}
                      </ul>
                      <span className="mono">Motif à indiquer : {p.number}</span>
                    </li>
                    <li>Indiquez ci-dessous la référence reçue par SMS.</li>
                  </ol>
                  {numbers.length > 1 && (
                    <div className="chips">
                      {numbers.map((x) => <label key={x.key} className="chip"><input type="radio" name="op" id={`op-${x.key}`} checked={f.operator === x.key} onChange={() => setF({ ...f, operator: x.key })} /><span>{x.label}</span></label>)}
                    </div>
                  )}
                  <div className="field-row">
                    <label className={`field${errors.phone ? " invalid" : ""}`}><span>Numéro qui a envoyé</span><input id="decl-phone" type="tel" inputMode="tel" value={f.phone} onChange={set("phone")} placeholder="90 00 00 00" />{errors.phone && <span className="err">{errors.phone}</span>}</label>
                    <label className={`field${errors.reference ? " invalid" : ""}`}><span>Référence du SMS</span><input id="decl-ref" value={f.reference} onChange={set("reference")} placeholder="Ex. TM2611080012" />{errors.reference && <span className="err">{errors.reference}</span>}</label>
                  </div>
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

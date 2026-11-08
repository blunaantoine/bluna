"use client";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { budgets, contactServices, deadlines, profile } from "@/content/site";

type Ref = { slug: string; title: string; cover: string; coverBg: string; category: string; summary: string; contain: boolean } | null;
type Errors = Partial<Record<"name" | "body" | "phone" | "email" | "form", string>>;

const DRAFT = "oqui-brouillon";
const serviceFor = (cat?: string) => (cat === "web" ? ["web"] : cat === "photo" ? ["photo"] : cat === "identite" ? ["identite"] : []);

export default function ContactForm({ reference }: { reference: Ref }) {
  const router = useRouter();
  const [services, setServices] = useState<string[]>(serviceFor(reference?.category).length ? serviceFor(reference?.category) : ["identite"]);
  const [budget, setBudget] = useState(0);
  const [deadline, setDeadline] = useState(1);
  const [f, setF] = useState({ name: "", company: "", phone: "", email: "", body: reference ? `Bonjour Antoine, j'aimerais un projet dans l'esprit de « ${reference.title} ». ` : "", website: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  // Brouillon gardé sur l'appareil du visiteur
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT) || "null");
      if (d) setF((cur) => ({ ...cur, name: d.name || "", company: d.company || "", phone: d.phone || "", email: d.email || "", body: reference && !d.body?.includes(reference.title) ? cur.body : d.body || cur.body }));
    } catch {}
  }, [reference]);
  useEffect(() => { try { localStorage.setItem(DRAFT, JSON.stringify(f)); } catch {} }, [f]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setF({ ...f, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); };
  const toggle = (id: string) => setServices((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending"); setErrors({});
    try {
      const res = await fetch("/api/messages", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...f, services: services.map((s) => contactServices.find((c) => c.id === s)?.label ?? s), budget: budgets[budget], deadline: deadlines[deadline], projectSlug: reference?.slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErrors(data.errors ?? { form: data.error ?? "L'envoi a échoué. Réessayez ou écrivez-moi sur WhatsApp." }); setState("idle"); return; }
      try { localStorage.removeItem(DRAFT); } catch {}
      setState("sent");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrors({ form: "Pas de connexion. Vérifiez votre réseau ou écrivez-moi sur WhatsApp." }); setState("idle");
    }
  }

  const wa = `https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(`Bonjour Antoine, je suis ${f.name || "…"}. ${f.body}`)}`;

  if (state === "sent") {
    return (
      <motion.div className="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} role="status">
        <motion.span className="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </motion.span>
        <h3>Message reçu, merci {f.name.split(" ")[0]} !</h3>
        <p>Antoine vient d'être notifié{reference ? <> avec votre projet de référence, <strong>{reference.title}</strong></> : null}. Il vous répond sous 24 h {f.phone ? "sur WhatsApp" : "par e-mail"}.</p>
        <div className="hero-actions">
          <Link href="/projets" className="btn">Revoir les travaux</Link>
          <a href={wa} target="_blank" rel="noopener" className="btn btn-ghost">Écrire aussi sur WhatsApp</a>
        </div>
      </motion.div>
    );
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <AnimatePresence>
        {reference && (
          <motion.div className="ref-card" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, padding: 0, margin: 0 }}>
            <span className="thumb" style={{ background: reference.coverBg }}>
              <Image src={reference.cover} alt="" fill sizes="88px" style={{ objectFit: reference.contain ? "contain" : "cover", padding: reference.contain ? 8 : 0, objectPosition: "50% 0%" }} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span className="eyebrow">Projet de référence</span>
              <strong>{reference.title}</strong>
              <p>Antoine verra ce projet joint à votre message.</p>
            </span>
            <button type="button" className="icon-btn" aria-label="Retirer le projet de référence" onClick={() => router.replace("/contact", { scroll: false })}>×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <fieldset>
        <legend>Ce dont vous avez besoin</legend>
        <div className="chips">
          {contactServices.map((s) => (
            <label key={s.id} className="chip"><input type="checkbox" id={`svc-${s.id}`} checked={services.includes(s.id)} onChange={() => toggle(s.id)} /><span>{s.label}</span></label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Budget indicatif</legend>
        <div className="range-row">
          <input type="range" id="budget" min={0} max={budgets.length - 1} step={1} value={budget} onChange={(e) => setBudget(+e.target.value)} aria-describedby="budget-out" />
          <output id="budget-out" className="mono">{budgets[budget]}</output>
        </div>
      </fieldset>

      <fieldset>
        <legend>Délai</legend>
        <div className="chips">
          {deadlines.map((d, i) => (
            <label key={d} className="chip"><input type="radio" name="deadline" id={`delai-${i}`} checked={deadline === i} onChange={() => setDeadline(i)} /><span>{d}</span></label>
          ))}
        </div>
      </fieldset>

      <div className="field-row">
        <label className={`field${errors.name ? " invalid" : ""}`}>
          <span>Votre nom *</span>
          <input id="name" autoComplete="name" value={f.name} onChange={set("name")} placeholder="Ex. Afi Mensah" aria-invalid={!!errors.name} />
          {errors.name && <span className="err">{errors.name}</span>}
        </label>
        <label className="field">
          <span>Entreprise ou projet</span>
          <input id="company" autoComplete="organization" value={f.company} onChange={set("company")} placeholder="Ex. Boutique Afi" />
        </label>
      </div>
      <div className="field-row">
        <label className={`field${errors.phone ? " invalid" : ""}`}>
          <span>WhatsApp</span>
          <input id="phone" type="tel" autoComplete="tel" inputMode="tel" value={f.phone} onChange={set("phone")} placeholder="+228 90 00 00 00" aria-invalid={!!errors.phone} />
          {errors.phone && <span className="err">{errors.phone}</span>}
        </label>
        <label className={`field${errors.email ? " invalid" : ""}`}>
          <span>E-mail</span>
          <input id="email" type="email" autoComplete="email" value={f.email} onChange={set("email")} placeholder="vous@exemple.com" aria-invalid={!!errors.email} />
          {errors.email && <span className="err">{errors.email}</span>}
        </label>
      </div>
      <label className={`field${errors.body ? " invalid" : ""}`}>
        <span>Votre projet *</span>
        <textarea id="body" rows={5} value={f.body} onChange={set("body")} placeholder="Ex. Je lance ma marque de jus et j'ai besoin d'un logo et d'étiquettes." aria-invalid={!!errors.body} />
        {errors.body && <span className="err">{errors.body}</span>}
      </label>
      <label className="hp" aria-hidden="true">Site web<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} /></label>

      {errors.form && <p className="err" role="alert">{errors.form}</p>}
      <div className="hero-actions">
        <button type="submit" className="btn" disabled={state === "sending"}>{state === "sending" ? "Envoi…" : "Envoyer le message"}</button>
        <a href={wa} target="_blank" rel="noopener" className="btn btn-ghost">Plutôt WhatsApp</a>
      </div>
    </form>
  );
}

"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import AdminNav from "./AdminNav";
import type { AboutProfile } from "@/lib/profile";

async function uploadFile(file: File): Promise<{ src?: string; error?: string }> {
  const fd = new FormData(); fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (res.status === 401) location.href = "/admin/connexion";
  const r = await res.json().catch(() => ({}));
  return res.ok ? { src: r.src } : { error: r.error || `Échec de l'envoi de ${file.name}.` };
}

export default function ProfileAdmin() {
  const [p, setP] = useState<AboutProfile | null>(null);
  const [defaults, setDefaults] = useState<AboutProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [toast, setToast] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/admin/profil", { cache: "no-store" }).then(async (r) => {
      if (r.status === 401) { location.href = "/admin/connexion"; return; }
      const d = await r.json(); setP(d.profile); setDefaults(d.defaults);
    });
  }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3000); return () => clearTimeout(t); }, [toast]);
  if (!p) return <><AdminNav /><div className="admin-wrap"><p className="mono">Chargement…</p></div></>;
  const set = <K extends keyof AboutProfile>(k: K, v: AboutProfile[K]) => setP((x) => (x ? { ...x, [k]: v } : x));

  async function pick(slot: "portrait" | "photo", files: FileList | null) {
    const f = files?.[0]; if (!f) return;
    setErr(""); setUploading(slot);
    const r = await uploadFile(f); setUploading("");
    if (r.src) set(slot, r.src); else setErr(r.error!);
  }
  async function addGallery(files: FileList | null) {
    if (!files?.length) return; setErr(""); setUploading("gallery");
    const added: AboutProfile["gallery"] = [];
    for (const f of Array.from(files)) { const r = await uploadFile(f); if (r.src) added.push({ src: r.src, alt: "Antoine ANANI" }); else setErr(r.error!); }
    setUploading(""); setP((x) => (x ? { ...x, gallery: [...x.gallery, ...added] } : x));
  }
  const moveG = (i: number, d: number) => setP((x) => { if (!x) return x; const a = [...x.gallery]; const j = i + d; if (j < 0 || j >= a.length) return x; [a[i], a[j]] = [a[j], a[i]]; return { ...x, gallery: a }; });

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const res = await fetch("/api/admin/profil", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(p) });
    setBusy(false);
    if (!res.ok) { setErr((await res.json().catch(() => ({}))).error || "Enregistrement impossible."); return; }
    setP((await res.json()).profile); setToast("Profil enregistré : le site est à jour.");
  }

  const Slot = ({ slot, title, hint }: { slot: "portrait" | "photo"; title: string; hint: string }) => (
    <div className="pf-slot">
      <span className="pf-img"><Image src={p[slot]} alt="" fill sizes="240px" style={{ objectFit: "cover" }} /></span>
      <div>
        <b>{title}</b><span className="mono">{hint}</span>
        <span className="pf-actions">
          <label className="btn btn-ghost btn-sm pf-file"><input id={`pf-${slot}`} type="file" accept="image/*" onChange={(e) => { pick(slot, e.target.files); e.target.value = ""; }} />{uploading === slot ? "Envoi…" : "Changer la photo"}</label>
          {defaults && p[slot] !== defaults[slot] && <button type="button" className="link-arrow" onClick={() => set(slot, defaults[slot])}>Remettre l&apos;originale</button>}
        </span>
      </div>
    </div>
  );

  return (
    <>
      <AdminNav />
      <form className="admin-wrap pf" onSubmit={save}>
        <div className="admin-head">
          <div>
            <h1 className="display">Profil</h1>
            <p className="mono">Vos photos et le texte de la page À propos. Les changements sont en ligne dès l&apos;enregistrement.</p>
          </div>
          <div className="pf-top"><a className="btn btn-ghost btn-sm" href="/a-propos" target="_blank">Voir la page ↗</a><button className="btn" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button></div>
        </div>
        {err && <p className="err" role="alert">{err}</p>}

        <fieldset>
          <legend>Vos photos</legend>
          <Slot slot="portrait" title="Portrait de l'accueil" hint="Au centre du collage, en haut de la page d'accueil. Format vertical conseillé." />
          <Slot slot="photo" title="Photo À propos" hint="Grande photo de la section et de la page À propos. Format horizontal conseillé." />
          <div>
            <b>Autres photos ({p.gallery.length})</b>
            <p className="mono">Affichées sur la page À propos : au travail, en séance photo, en événement…</p>
            <div className="img-grid">
              {p.gallery.map((g, i) => (
                <div key={g.src} className="img-item">
                  <span className="pthumb big"><Image src={g.src} alt="" fill sizes="160px" style={{ objectFit: "cover" }} /></span>
                  <input aria-label="Description de la photo" value={g.alt} onChange={(e) => set("gallery", p.gallery.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))} placeholder="Description" />
                  <span className="img-actions">
                    <button type="button" className="icon-btn" onClick={() => moveG(i, -1)} disabled={i === 0} aria-label="Avancer">←</button>
                    <button type="button" className="icon-btn" onClick={() => moveG(i, 1)} disabled={i === p.gallery.length - 1} aria-label="Reculer">→</button>
                    <button type="button" className="icon-btn" onClick={() => set("gallery", p.gallery.filter((_, k) => k !== i))} aria-label="Retirer la photo">×</button>
                  </span>
                </div>
              ))}
              <label className="img-add">
                <input id="pf-gallery" type="file" accept="image/*" multiple onChange={(e) => { addGallery(e.target.files); e.target.value = ""; }} />
                <span>{uploading === "gallery" ? "Envoi…" : "+ Ajouter des photos"}</span>
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Présentation</legend>
          <label className="field"><span>Titre</span><input id="pf-headline" value={p.headline} onChange={(e) => set("headline", e.target.value)} /></label>
          <label className="field"><span>Texte (un paragraphe par bloc, séparés par une ligne vide)</span>
            <textarea id="pf-intro" rows={9} value={p.intro.join("\n\n")} onChange={(e) => set("intro", e.target.value.split(/\n\s*\n/))} />
          </label>
          <label className="field"><span>Outils et savoir-faire (séparés par des virgules)</span><input id="pf-skills" value={p.skills.join(", ")} onChange={(e) => set("skills", e.target.value.split(","))} /></label>
        </fieldset>

        <fieldset>
          <legend>Ce qui compte pour moi</legend>
          {p.values.map((v, i) => (
            <div key={i} className="pf-pair">
              <input aria-label="Titre" value={v.title} placeholder="Titre" onChange={(e) => set("values", p.values.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} />
              <textarea aria-label="Texte" rows={2} value={v.text} placeholder="Texte" onChange={(e) => set("values", p.values.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} />
              <button type="button" className="icon-btn" aria-label="Retirer" onClick={() => set("values", p.values.filter((_, k) => k !== i))}>×</button>
            </div>
          ))}
          <button type="button" className="link-arrow" onClick={() => set("values", [...p.values, { title: "", text: "" }])}>+ Ajouter</button>
        </fieldset>

        <fieldset>
          <legend>Mon parcours</legend>
          {p.journey.map((v, i) => (
            <div key={i} className="pf-pair">
              <input aria-label="Année ou étape" value={v.year} placeholder="Année ou étape" onChange={(e) => set("journey", p.journey.map((x, k) => (k === i ? { ...x, year: e.target.value } : x)))} />
              <textarea aria-label="Texte" rows={2} value={v.text} placeholder="Ce qui s'est passé" onChange={(e) => set("journey", p.journey.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} />
              <button type="button" className="icon-btn" aria-label="Retirer" onClick={() => set("journey", p.journey.filter((_, k) => k !== i))}>×</button>
            </div>
          ))}
          <button type="button" className="link-arrow" onClick={() => set("journey", [...p.journey, { year: "", text: "" }])}>+ Ajouter une étape</button>
        </fieldset>

        <div className="pf-bottom"><button className="btn" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer le profil"}</button></div>
      </form>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

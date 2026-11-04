"use client";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import AdminNav from "./AdminNav";
import type { Project } from "@/lib/projects";
import type { Img } from "@/content/projects";
import { categories, categoryLabel } from "@/content/site";

type Draft = Omit<Project, "id" | "views" | "inquiries" | "cover"> & { id?: string };

const empty = (): Draft => ({
  slug: "", title: "", client: "", category: "identite", year: new Date().getFullYear(), summary: "", description: "",
  tags: [], stack: [], images: [], coverBg: "#151517", link: "", featured: false, published: true, order: 0,
});

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export default function ProjectsAdmin() {
  const [list, setList] = useState<Project[] | null>(null);
  const [edit, setEdit] = useState<Draft | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/projets", { cache: "no-store" });
    if (res.status === 401) { location.href = "/admin/connexion"; return; }
    setList((await res.json()).projects);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(""), 3500); return () => clearTimeout(t); }, [msg]);

  async function patch(id: string, data: Partial<Draft>) {
    setList((l) => l?.map((p) => (p.id === id ? { ...p, ...data } as Project : p)) ?? null);
    const res = await fetch(`/api/admin/projets/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) { setMsg((await res.json().catch(() => ({}))).error || "Enregistrement impossible."); load(); }
  }
  async function move(i: number, d: number) {
    if (!list) return;
    const j = i + d; if (j < 0 || j >= list.length) return;
    const next = [...list]; [next[i], next[j]] = [next[j], next[i]];
    setList(next);
    await Promise.all(next.map((p, k) => p.order !== k && fetch(`/api/admin/projets/${p.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ order: k }) })));
    load();
  }

  const totalViews = list?.reduce((a, p) => a + p.views, 0) ?? 0;
  const totalInq = list?.reduce((a, p) => a + p.inquiries, 0) ?? 0;
  const top = [...(list ?? [])].sort((a, b) => b.inquiries - a.inquiries || b.views - a.views)[0];

  return (
    <>
      <AdminNav />
      <div className="admin-wrap">
        <div className="admin-head">
          <div>
            <h1 className="display">Projets</h1>
            <p className="mono">L'ordre de cette liste est celui du site. Les changements sont en ligne immédiatement.</p>
          </div>
          <div className="admin-kpis">
            <div><strong>{list?.filter((p) => p.published).length ?? "–"}</strong><span>en ligne</span></div>
            <div><strong>{totalViews}</strong><span>vues de projets</span></div>
            <div><strong>{totalInq}</strong><span>demandes « similaire »</span></div>
          </div>
        </div>
        {top && (top.inquiries > 0 || top.views > 0) && <p className="admin-banner"><span>Projet le plus demandé : <b>{top.title}</b> · {top.inquiries} demande(s), {top.views} vue(s).</span></p>}

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <button className="btn" onClick={() => setEdit(empty())}>+ Nouveau projet</button>
        </div>

        <ul className="plist">
          {list?.map((p, i) => (
            <li key={p.id} className={`prow${p.published ? "" : " off"}`}>
              <span className="pthumb" style={{ background: p.coverBg }}><Image src={p.cover} alt="" fill sizes="72px" style={{ objectFit: p.category === "identite" ? "contain" : "cover", padding: p.category === "identite" ? 6 : 0, objectPosition: "50% 0%" }} /></span>
              <span className="pinfo">
                <b>{p.title}</b>
                <span className="mono">{categoryLabel(p.category)} · {p.year} · {p.images.length} visuel(s) · {p.views} vue(s) · {p.inquiries} demande(s)</span>
              </span>
              <label className="switch"><input type="checkbox" checked={p.published} onChange={(e) => patch(p.id, { published: e.target.checked })} /><span>En ligne</span></label>
              <label className="switch"><input type="checkbox" checked={p.featured} onChange={(e) => patch(p.id, { featured: e.target.checked })} /><span>À la une</span></label>
              <span className="pact">
                <button className="icon-btn" aria-label={`Monter ${p.title}`} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                <button className="icon-btn" aria-label={`Descendre ${p.title}`} onClick={() => move(i, 1)} disabled={i === list.length - 1}>↓</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEdit({ ...p })}>Modifier</button>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {edit && <Editor draft={edit} onClose={() => setEdit(null)} onSaved={(t) => { setEdit(null); setMsg(t); load(); }} />}
      </AnimatePresence>
      <AnimatePresence>{msg && <motion.div className="toast" initial={{ y: 80, opacity: 0, x: "-50%" }} animate={{ y: 0, opacity: 1, x: "-50%" }} exit={{ y: 80, opacity: 0, x: "-50%" }} role="status">{msg}</motion.div>}</AnimatePresence>
    </>
  );
}

function Editor({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: (msg: string) => void }) {
  const [d, setD] = useState<Draft>(draft);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [confirmDel, setConfirmDel] = useState(false);
  const creating = !draft.id;
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setErr("");
    for (const file of Array.from(files)) {
      setUploading((n) => n + 1);
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const r = await res.json().catch(() => ({}));
      setUploading((n) => n - 1);
      if (!res.ok) { setErr(r.error || `Échec de l'envoi de ${file.name}.`); continue; }
      setD((x) => ({ ...x, images: [...x.images, { src: r.src, w: r.w, h: r.h, alt: `${x.title || "Projet"} — ${file.name.replace(/\.[^.]+$/, "")}` }] }));
    }
  }
  const moveImg = (i: number, dir: number) => setD((x) => { const a = [...x.images]; const j = i + dir; if (j < 0 || j >= a.length) return x; [a[i], a[j]] = [a[j], a[i]]; return { ...x, images: a }; });
  const editImg = (i: number, patch: Partial<Img>) => setD((x) => ({ ...x, images: x.images.map((im, k) => (k === i ? { ...im, ...patch } : im)) }));

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const body = { ...d, slug: d.slug || slugify(d.title) };
    const res = await fetch(creating ? "/api/admin/projets" : `/api/admin/projets/${d.id}`, { method: creating ? "POST" : "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!res.ok) { setErr((await res.json().catch(() => ({}))).error || "Enregistrement impossible."); return; }
    onSaved(creating ? `« ${d.title} » est en ligne.` : `« ${d.title} » est enregistré.`);
  }
  async function remove() {
    if (!d.id) return;
    if (!confirmDel) { setConfirmDel(true); setErr("Cliquez encore sur « Supprimer définitivement » pour confirmer."); return; }
    await fetch(`/api/admin/projets/${d.id}`, { method: "DELETE" }); onSaved(`« ${d.title} » a été supprimé.`);
  }

  return (
    <motion.div className="drawer-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="drawer-backdrop" onClick={onClose} />
      <motion.form className="drawer" onSubmit={save} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 34 }}>
        <div className="drawer-head">
          <h2 className="display">{creating ? "Nouveau projet" : d.title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">×</button>
        </div>

        <fieldset>
          <legend>Images ({d.images.length}) · la première sert de couverture</legend>
          <div className="img-grid">
            {d.images.map((im, i) => (
              <div key={im.src} className="img-item">
                <span className="pthumb big" style={{ background: d.coverBg }}><Image src={im.src} alt="" fill sizes="160px" style={{ objectFit: "contain" }} /></span>
                <input aria-label="Description de l'image" value={im.alt} onChange={(e) => editImg(i, { alt: e.target.value })} placeholder="Description de l'image" />
                <span className="img-actions">
                  <button type="button" className="icon-btn" onClick={() => moveImg(i, -1)} disabled={i === 0} aria-label="Avancer">←</button>
                  <button type="button" className="icon-btn" onClick={() => moveImg(i, 1)} disabled={i === d.images.length - 1} aria-label="Reculer">→</button>
                  <button type="button" className="icon-btn" onClick={() => set("images", d.images.filter((_, k) => k !== i))} aria-label="Retirer l'image">×</button>
                </span>
              </div>
            ))}
            <label className="img-add">
              <input type="file" accept="image/*" multiple onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
              <span>{uploading ? `Envoi de ${uploading} image(s)…` : "+ Ajouter des images"}</span>
              <span className="mono">JPG, PNG ou WebP · redimensionnées automatiquement</span>
            </label>
          </div>
        </fieldset>

        <div className="field-row">
          <label className="field"><span>Titre *</span><input id="p-title" value={d.title} onChange={(e) => { set("title", e.target.value); if (creating) set("slug", slugify(e.target.value)); }} required /></label>
          <label className="field"><span>Adresse de la page</span><input id="p-slug" value={d.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder="mon-projet" disabled={!creating} /></label>
        </div>
        <div className="field-row">
          <label className="field"><span>Catégorie</span>
            <select id="p-cat" value={d.category} onChange={(e) => set("category", e.target.value)}>
              {categories.filter((c) => c.id !== "tout").map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
          <label className="field"><span>Année</span><input id="p-year" type="number" value={d.year} onChange={(e) => set("year", +e.target.value)} /></label>
        </div>
        <label className="field"><span>Client</span><input id="p-client" value={d.client} onChange={(e) => set("client", e.target.value)} /></label>
        <label className="field"><span>Résumé (une phrase) *</span><input id="p-summary" value={d.summary} onChange={(e) => set("summary", e.target.value)} required /></label>
        <label className="field"><span>Description</span><textarea id="p-desc" rows={5} value={d.description} onChange={(e) => set("description", e.target.value)} /></label>
        <div className="field-row">
          <label className="field"><span>Mots-clés (séparés par des virgules)</span><input id="p-tags" value={d.tags.join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((s) => s.trim()))} /></label>
          <label className="field"><span>Outils / technologies</span><input id="p-stack" value={d.stack.join(", ")} onChange={(e) => set("stack", e.target.value.split(",").map((s) => s.trim()))} /></label>
        </div>
        <div className="field-row">
          <label className="field"><span>Lien vers le site en ligne</span><input id="p-link" type="url" value={d.link} onChange={(e) => set("link", e.target.value)} placeholder="https://" /></label>
          <label className="field"><span>Couleur de fond des visuels</span><span style={{ display: "flex", gap: ".5rem" }}><input id="p-bg" type="color" value={d.coverBg} onChange={(e) => set("coverBg", e.target.value)} style={{ width: 56, padding: 4 }} /><input aria-label="Code couleur" value={d.coverBg} onChange={(e) => set("coverBg", e.target.value)} /></span></label>
        </div>

        {err && <p className="err" role="alert">{err}</p>}
        <div className="drawer-foot">
          {!creating && <button type="button" className="btn btn-ghost btn-sm danger" onClick={remove}>{confirmDel ? "Supprimer définitivement" : "Supprimer"}</button>}
          {!creating && <Link href={`/projets/${d.slug}`} target="_blank" className="link-arrow">Voir la page ↗</Link>}
          <button className="btn" disabled={busy || uploading > 0}>{creating ? "Publier le projet" : "Enregistrer"}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}

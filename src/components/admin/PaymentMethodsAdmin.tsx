"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import AdminNav from "./AdminNav";

type Method = { id: string; kind: string; label: string; value: string; holder: string; details: string; active: boolean; order: number };
const KINDS: Record<string, { name: string; value: string; placeholder: string; label: string; details: string }> = {
  mobile: { name: "Mobile Money", label: "Ex. T-Money, Flooz (Moov), Wave", value: "Numéro", placeholder: "+228 90 00 00 00", details: "Ex. Motif à indiquer : numéro de facture" },
  banque: { name: "Virement bancaire", label: "Ex. Ecobank, Orabank, UBA", value: "Numéro de compte / IBAN", placeholder: "TG53 TG05 5010 …", details: "Ex. Code SWIFT, agence, code banque" },
  carte: { name: "Carte bancaire", label: "Ex. Carte Visa UBA", value: "Numéro de carte (pour recevoir un dépôt)", placeholder: "4000 0000 0000 0000", details: "Ex. Dépôt en agence ou depuis l'application de la banque" },
  autre: { name: "Autre moyen", label: "Ex. Espèces, PayPal, Western Union", value: "Coordonnée (facultatif)", placeholder: "Ex. adresse PayPal", details: "Ex. Remise en main propre contre reçu signé" },
};

async function api(url: string, method = "GET", body?: unknown) {
  const res = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  if (res.status === 401) location.href = "/admin/connexion";
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

export default function PaymentMethodsAdmin() {
  const [list, setList] = useState<Method[] | null>(null);
  const [edit, setEdit] = useState<Partial<Method> | null>(null);
  const [toast, setToast] = useState("");
  const load = useCallback(async () => setList((await api("/api/admin/moyens")).data.methods ?? []), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3000); return () => clearTimeout(t); }, [toast]);

  async function patch(id: string, data: Partial<Method>, msg?: string) {
    setList((l) => l?.map((m) => (m.id === id ? { ...m, ...data } : m)) ?? null);
    const r = await api(`/api/admin/moyens/${id}`, "PATCH", data);
    if (!r.ok) { setToast(r.data.error || "Enregistrement impossible."); load(); } else if (msg) setToast(msg);
  }
  async function move(i: number, d: number) {
    if (!list) return; const j = i + d; if (j < 0 || j >= list.length) return;
    const next = [...list]; [next[i], next[j]] = [next[j], next[i]]; setList(next);
    await Promise.all(next.map((m, k) => api(`/api/admin/moyens/${m.id}`, "PATCH", { order: k })));
  }

  return (
    <>
      <AdminNav />
      <div className="admin-wrap">
        <div className="admin-head">
          <div>
            <h1 className="display">Moyens de paiement</h1>
            <p className="mono">Affichés au client quand il touche « Payer », sur ses factures (PDF compris), ses reçus et la page Maintenance.</p>
          </div>
          <button className="btn" onClick={() => setEdit({ kind: "mobile", label: "", value: "", holder: "Antoine ANANI", details: "", active: true })}>+ Ajouter un moyen</button>
        </div>
        <ul className="plist">
          {list === null && <li className="inbox-empty">Chargement…</li>}
          {list?.length === 0 && <li className="inbox-empty"><strong>Aucun moyen de paiement.</strong><span>Ajoutez au moins un numéro Mobile Money pour que vos clients puissent payer.</span></li>}
          {list?.map((m, i) => (
            <li key={m.id} className={`prow pm-row${m.active ? "" : " off"}`}>
              <span className={`pm-kind k-${m.kind}`}>{KINDS[m.kind]?.name ?? m.kind}</span>
              <span className="pinfo"><b>{m.label}</b><span className="mono">{m.value || "—"}{m.holder ? ` · ${m.holder}` : ""}</span>{m.details && <span className="pm-details">{m.details}</span>}</span>
              <label className="switch"><input type="checkbox" checked={m.active} onChange={(e) => patch(m.id, { active: e.target.checked }, e.target.checked ? "Affiché aux clients." : "Masqué aux clients.")} /><span>Affiché</span></label>
              <span className="pact">
                <button className="icon-btn" aria-label={`Monter ${m.label}`} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                <button className="icon-btn" aria-label={`Descendre ${m.label}`} onClick={() => move(i, 1)} disabled={i === list.length - 1}>↓</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEdit(m)}>Modifier</button>
              </span>
            </li>
          ))}
        </ul>
        {list && list.filter((m) => m.active).length === 0 && list.length > 0 && <p className="admin-banner" style={{ marginTop: "1rem" }}><span>⚠️ Aucun moyen n&apos;est affiché : vos clients ne verront aucun numéro pour payer.</span></p>}
      </div>
      <AnimatePresence>{edit && <Editor m={edit} onClose={() => setEdit(null)} onDone={(t) => { setEdit(null); setToast(t); load(); }} />}</AnimatePresence>
      <AnimatePresence>{toast && <motion.div className="toast" initial={{ y: 80, opacity: 0, x: "-50%" }} animate={{ y: 0, opacity: 1, x: "-50%" }} exit={{ y: 80, opacity: 0, x: "-50%" }} role="status">{toast}</motion.div>}</AnimatePresence>
    </>
  );
}

function Editor({ m, onClose, onDone }: { m: Partial<Method>; onClose: () => void; onDone: (t: string) => void }) {
  const [f, setF] = useState(m);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState(false);
  const k = KINDS[f.kind ?? "mobile"];
  const set = (key: keyof Method) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [key]: e.target.value });
  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const body = { kind: f.kind, label: f.label, value: f.value, holder: f.holder, details: f.details, active: f.active ?? true };
    const r = m.id ? await api(`/api/admin/moyens/${m.id}`, "PATCH", body) : await api("/api/admin/moyens", "POST", body);
    if (!r.ok) { setErr(r.data.error || "Enregistrement impossible."); return; }
    onDone(m.id ? "Moyen de paiement enregistré." : "Moyen de paiement ajouté.");
  }
  async function remove() {
    if (!confirm) { setConfirm(true); setErr("Cliquez encore pour supprimer définitivement ce moyen de paiement."); return; }
    await api(`/api/admin/moyens/${m.id}`, "DELETE"); onDone("Moyen de paiement supprimé.");
  }
  return (
    <motion.div className="drawer-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="drawer-backdrop" onClick={onClose} />
      <motion.form className="drawer" onSubmit={save} noValidate initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 34 }}>
        <div className="drawer-head"><h2 className="display">{m.id ? f.label || "Moyen de paiement" : "Nouveau moyen de paiement"}</h2><button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">×</button></div>
        <label className="field"><span>Type</span>
          <select id="pm-kind" value={f.kind} onChange={set("kind")}>{Object.entries(KINDS).map(([id, x]) => <option key={id} value={id}>{x.name}</option>)}</select>
        </label>
        <label className="field"><span>Nom affiché *</span><input id="pm-label" value={f.label ?? ""} onChange={set("label")} placeholder={k.label} /></label>
        <label className="field"><span>{k.value}{f.kind !== "autre" ? " *" : ""}</span><input id="pm-value" value={f.value ?? ""} onChange={set("value")} placeholder={k.placeholder} /></label>
        <label className="field"><span>Titulaire</span><input id="pm-holder" value={f.holder ?? ""} onChange={set("holder")} placeholder="Ex. Antoine ANANI" /></label>
        <label className="field"><span>Précisions (facultatif)</span><textarea id="pm-details" rows={3} value={f.details ?? ""} onChange={set("details")} placeholder={k.details} /></label>
        {f.kind === "carte" && <p className="admin-banner"><span>Pour une carte, n&apos;indiquez que le numéro permettant de recevoir un dépôt. <b>Jamais</b> la date d&apos;expiration ni le code de sécurité (CVV).</span></p>}
        {err && <p className="err" role="alert">{err}</p>}
        <div className="drawer-foot">
          {m.id && <button type="button" className="btn btn-ghost btn-sm danger" onClick={remove}>{confirm ? "Supprimer définitivement" : "Supprimer"}</button>}
          <button className="btn">{m.id ? "Enregistrer" : "Ajouter"}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}

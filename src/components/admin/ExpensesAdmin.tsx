"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import AdminNav from "./AdminNav";
import { EXPENSE_CATEGORIES, EXPENSE_METHODS } from "@/lib/expense-labels";

type Expense = { id: string; date: string; label: string; category: string; amount: number; method: string; notes: string };
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const fcfa = (n: number) => `${new Intl.NumberFormat("fr-FR").format(Math.round(n)).replace(/[  ]/g, " ")} FCFA`;
const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const empty = () => ({ date: today(), label: "", category: "materiel", amount: "", method: "", notes: "" });

export default function ExpensesAdmin() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<number | null>(now.getMonth() + 1);
  const [list, setList] = useState<Expense[] | null>(null);
  const [kpis, setKpis] = useState<{ collected: number; spent: number; net: number } | null>(null);
  const [f, setF] = useState(empty());
  const [editing, setEditing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const qs = `annee=${year}${month ? `&mois=${month}` : ""}`;

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([fetch(`/api/admin/depenses?${qs}`, { cache: "no-store" }), fetch(`/api/admin/rapports?${qs}`, { cache: "no-store" })]);
    if (a.status === 401) { location.href = "/admin/connexion"; return; }
    setList((await a.json()).expenses); setKpis((await b.json()).kpis);
  }, [qs]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3000); return () => clearTimeout(t); }, [toast]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const res = await fetch(editing ? `/api/admin/depenses/${editing}` : "/api/admin/depenses", { method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, amount: Number(f.amount) }) });
    setBusy(false);
    if (!res.ok) { setErr((await res.json().catch(() => ({}))).error || "Enregistrement impossible."); return; }
    setToast(editing ? "Dépense modifiée." : `Dépense de ${fcfa(Number(f.amount))} enregistrée.`);
    setF({ ...empty(), date: f.date, category: f.category }); setEditing(null); load();
  }
  function edit(x: Expense) {
    setEditing(x.id); setErr(""); setF({ date: x.date.slice(0, 10), label: x.label, category: x.category, amount: String(x.amount), method: x.method, notes: x.notes });
    document.getElementById("exp-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function remove(id: string) {
    if (confirm !== id) { setConfirm(id); setTimeout(() => setConfirm((c) => (c === id ? null : c)), 4000); return; }
    await fetch(`/api/admin/depenses/${id}`, { method: "DELETE" }); setConfirm(null); setToast("Dépense supprimée."); load();
  }

  const label = month ? `${MONTHS[month - 1]} ${year}` : `Année ${year}`;
  const years = Array.from({ length: 4 }, (_, k) => now.getFullYear() - k);

  return (
    <>
      <AdminNav />
      <div className="admin-wrap">
        <div className="admin-head">
          <div>
            <h1 className="display">Dépenses · {label}</h1>
            <p className="mono">Matériel, abonnements, transport, sous-traitance… Elles sont retirées de l&apos;encaissé dans les rapports.</p>
          </div>
          <div className="report-controls">
            <select className="admin-select" aria-label="Mois" value={month ?? 0} onChange={(e) => setMonth(+e.target.value || null)}>
              <option value={0}>Toute l&apos;année</option>
              {MONTHS.map((m, k) => <option key={m} value={k + 1}>{m}</option>)}
            </select>
            <select className="admin-select" aria-label="Année" value={year} onChange={(e) => setYear(+e.target.value)}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select>
          </div>
        </div>

        {kpis && (
          <div className="kpi-grid exp-kpis">
            <div className="kpi"><span className="kpi-label">Encaissé</span><strong className="kpi-value">{fcfa(kpis.collected)}</strong></div>
            <div className="kpi"><span className="kpi-label">Dépenses</span><strong className="kpi-value">− {fcfa(kpis.spent)}</strong></div>
            <div className={`kpi ${kpis.net < 0 ? "kpi-neg" : ""}`}><span className="kpi-label">Net</span><strong className="kpi-value">{fcfa(kpis.net)}</strong><span className="kpi-sub">ce qui vous reste</span></div>
          </div>
        )}

        <form id="exp-form" className="report-section exp-form" onSubmit={save} noValidate>
          <h2>{editing ? "Modifier la dépense" : "Nouvelle dépense"}</h2>
          <div className="exp-grid">
            <label className="field"><span>Date</span><input id="exp-date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
            <label className="field exp-wide"><span>Objet *</span><input id="exp-label" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="Ex. Abonnement Canva, forfait internet, taxi…" /></label>
            <label className="field"><span>Montant (FCFA) *</span><input id="exp-amount" type="number" inputMode="numeric" min={1} step={100} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></label>
            <label className="field"><span>Catégorie</span><select id="exp-category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="field"><span>Payé par</span><select id="exp-method" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}><option value="">—</option>{EXPENSE_METHODS.map((m) => <option key={m}>{m}</option>)}</select></label>
            <label className="field exp-wide"><span>Note (facultatif)</span><input id="exp-notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Ex. pour le projet de tel client" /></label>
          </div>
          {err && <p className="err" role="alert">{err}</p>}
          <div className="exp-actions">
            {editing && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditing(null); setF(empty()); }}>Annuler</button>}
            <button className="btn" disabled={busy}>{busy ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter la dépense"}</button>
          </div>
        </form>

        <section className="report-section">
          <h2>Dépenses enregistrées ({list?.length ?? 0})</h2>
          {list === null ? <p className="mono">Chargement…</p> : list.length ? (
            <div className="table-scroll">
              <table className="rtable">
                <thead><tr><th>Date</th><th>Objet</th><th>Catégorie</th><th>Payé par</th><th className="num">Montant</th><th /></tr></thead>
                <tbody>{list.map((x) => (
                  <tr key={x.id} className={editing === x.id ? "is-editing" : undefined}>
                    <td>{new Date(x.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</td>
                    <td>{x.label}{x.notes && <small className="muted"> · {x.notes}</small>}</td>
                    <td>{EXPENSE_CATEGORIES[x.category] ?? x.category}</td>
                    <td>{x.method || "—"}</td>
                    <td className="num">{fcfa(x.amount)}</td>
                    <td className="exp-row-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => edit(x)}>Modifier</button>
                      <button type="button" className={`btn btn-ghost btn-sm${confirm === x.id ? " danger" : ""}`} onClick={() => remove(x.id)}>{confirm === x.id ? "Confirmer" : "Supprimer"}</button>
                    </td>
                  </tr>
                ))}</tbody>
                <tfoot><tr><td colSpan={4}>Total</td><td className="num">{fcfa(list.reduce((a, x) => a + x.amount, 0))}</td><td /></tr></tfoot>
              </table>
            </div>
          ) : <p className="empty-note">Aucune dépense sur cette période.</p>}
        </section>
      </div>
      <AnimatePresence>{toast && <motion.div className="toast" initial={{ y: 80, opacity: 0, x: "-50%" }} animate={{ y: 0, opacity: 1, x: "-50%" }} exit={{ y: 80, opacity: 0, x: "-50%" }} role="status">{toast}</motion.div>}</AnimatePresence>
    </>
  );
}

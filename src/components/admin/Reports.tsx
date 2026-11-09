"use client";
import { useCallback, useEffect, useState } from "react";
import AdminNav from "./AdminNav";
import type { Report } from "@/lib/reports";

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const fcfa = (n: number) => `${new Intl.NumberFormat("fr-FR").format(Math.round(n)).replace(/ | /g, " ")} FCFA`;
const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M` : n >= 1e3 ? `${Math.round(n / 1e3)} k` : String(n));
const dateFr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default function Reports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<number | null>(now.getMonth() + 1);
  const [r, setR] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const qs = `annee=${year}${month ? `&mois=${month}` : ""}`;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/rapports?${qs}`, { cache: "no-store" });
    if (res.status === 401) { location.href = "/admin/connexion"; return; }
    setR(await res.json()); setLoading(false);
  }, [qs]);
  useEffect(() => { load(); }, [load]);

  const label = month ? `${MONTHS[month - 1]} ${year}` : `Année ${year}`;
  const years = Array.from({ length: 4 }, (_, k) => now.getFullYear() - k);

  return (
    <>
      <AdminNav />
      <div className="admin-wrap report">
        <div className="admin-head">
          <div>
            <h1 className="display">Rapport · {label}</h1>
            <p className="mono">Facturé = factures émises sur la période. Encaissé = argent reçu sur la période (date lue sur la capture quand elle existe).</p>
          </div>
          <div className="report-controls no-print">
            <select className="admin-select" aria-label="Mois" value={month ?? 0} onChange={(e) => setMonth(+e.target.value || null)}>
              <option value={0}>Toute l&apos;année</option>
              {MONTHS.map((m, k) => <option key={m} value={k + 1}>{m}</option>)}
            </select>
            <select className="admin-select" aria-label="Année" value={year} onChange={(e) => setYear(+e.target.value)}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <a className="btn btn-ghost btn-sm" href={`/api/admin/rapports?${qs}&format=csv`}>Exporter (Excel)</a>
            <button className="btn btn-sm" onClick={() => window.print()}>Imprimer / PDF</button>
          </div>
        </div>

        {!r ? <p className="mono">Chargement…</p> : (
          <div className={`report-body${loading ? " is-loading" : ""}`}>
            <div className="kpi-grid">
              <Kpi label="Facturé" value={fcfa(r.kpis.invoiced)} sub={`${r.kpis.invoiceCount} facture(s) · ${r.kpis.clientCount} client(s)`} />
              <Kpi label="Encaissé" value={fcfa(r.kpis.collected)} sub={`${r.kpis.paymentCount} paiement(s) reçu(s)`} />
              <Kpi label="Reste à encaisser" value={fcfa(r.kpis.outstanding)} sub="sur les factures de la période" />
              <Kpi label="Taux de recouvrement" value={r.kpis.recoveryRate == null ? "—" : `${r.kpis.recoveryRate} %`} sub={r.kpis.invoiceCount ? `panier moyen ${fcfa(r.kpis.averageInvoice)}` : "aucune facture émise"} />
            </div>

            {r.monthly && <MonthlyChart data={r.monthly} year={r.period.year} />}

            <div className="report-cols">
              <Table title="Encaissé par moyen de paiement" empty="Aucun paiement sur la période." rows={r.byMethod.map((m) => [m.label, fcfa(m.amount)])} total={r.byMethod.length > 1 ? fcfa(r.kpis.collected) : undefined} />
              <Table title="Meilleurs clients" empty="Aucun encaissement sur la période." rows={r.topClients.map((c) => [`${c.name} · ${c.count} paiement(s)`, fcfa(c.amount)])} />
              <Table title="Prestations facturées" empty="Aucune facture émise sur la période." rows={r.topServices.map((s) => [s.label, fcfa(s.amount)])} />
            </div>

            <section className="report-section">
              <h2>Paiements reçus ({r.payments.length})</h2>
              {r.payments.length ? (
                <div className="table-scroll">
                  <table className="rtable">
                    <thead><tr><th>Date</th><th>Client</th><th>Facture</th><th>Moyen</th><th>Référence</th><th className="num">Montant</th></tr></thead>
                    <tbody>{r.payments.map((p, k) => <tr key={k}><td>{dateFr(p.date)}</td><td>{p.client}</td><td>{p.invoice} · {p.title}</td><td>{p.method}</td><td className="mono">{p.reference || "—"}</td><td className="num">{fcfa(p.amount)}</td></tr>)}</tbody>
                    <tfoot><tr><td colSpan={5}>Total</td><td className="num">{fcfa(r.kpis.collected)}</td></tr></tfoot>
                  </table>
                </div>
              ) : <p className="empty-note">Aucun paiement reçu sur la période.</p>}
            </section>

            <section className="report-section">
              <h2>Factures à encaisser aujourd&apos;hui ({r.unpaid.length})</h2>
              {r.unpaid.length ? (
                <div className="table-scroll">
                  <table className="rtable">
                    <thead><tr><th>Facture</th><th>Client</th><th>Échéance</th><th className="num">Reste</th></tr></thead>
                    <tbody>{r.unpaid.map((u) => <tr key={u.number}><td>{u.number} · {u.title}</td><td>{u.client}</td><td>{u.due ? dateFr(u.due) : "—"} {u.overdue && <span className="pill s-retard">En retard</span>}</td><td className="num">{fcfa(u.remaining)}</td></tr>)}</tbody>
                    <tfoot><tr><td colSpan={3}>Total</td><td className="num">{fcfa(r.unpaid.reduce((a, u) => a + u.remaining, 0))}</td></tr></tfoot>
                  </table>
                </div>
              ) : <p className="empty-note">Toutes les factures sont réglées.</p>}
            </section>
          </div>
        )}
      </div>
    </>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div className="kpi"><span className="kpi-label">{label}</span><strong className="kpi-value">{value}</strong><span className="kpi-sub">{sub}</span></div>;
}

function Table({ title, rows, empty, total }: { title: string; rows: [string, string][]; empty: string; total?: string }) {
  return (
    <section className="report-section">
      <h2>{title}</h2>
      {rows.length ? (
        <table className="rtable compact">
          <tbody>{rows.map(([a, b], k) => <tr key={k}><td>{a}</td><td className="num">{b}</td></tr>)}</tbody>
          {total && <tfoot><tr><td>Total</td><td className="num">{total}</td></tr></tfoot>}
        </table>
      ) : <p className="empty-note">{empty}</p>}
    </section>
  );
}

/** Barres groupées par mois : facturé (bleu) et encaissé (orange). Couleurs validées sur fond sombre, daltonisme compris. */
function MonthlyChart({ data, year }: { data: { label: string; invoiced: number; collected: number }[]; year: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 960, H = 300, L = 56, R = 12, T = 16, B = 32;
  const max = Math.max(1, ...data.flatMap((d) => [d.invoiced, d.collected]));
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step;
  const y = (v: number) => T + (H - T - B) * (1 - v / top);
  const band = (W - L - R) / 12, bw = Math.min(22, (band - 14) / 2);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, k) => k * step);
  const bar = (x: number, v: number) => {
    const h = Math.max(0, y(0) - y(v)); if (h < 0.5) return "";
    const r = Math.min(4, h, bw / 2), yt = y(v), yb = y(0);
    return `M${x},${yb} V${yt + r} Q${x},${yt} ${x + r},${yt} H${x + bw - r} Q${x + bw},${yt} ${x + bw},${yt + r} V${yb} Z`;
  };
  const total = data.reduce((a, d) => ({ i: a.i + d.invoiced, c: a.c + d.collected }), { i: 0, c: 0 });

  return (
    <section className="report-section chart-card">
      <div className="chart-head">
        <h2>Facturé et encaissé par mois · {year}</h2>
        <div className="legend" aria-hidden="true">
          <span><i style={{ background: "var(--s-invoiced)" }} />Facturé · {fcfa(total.i)}</span>
          <span><i style={{ background: "var(--s-collected)" }} />Encaissé · {fcfa(total.c)}</span>
        </div>
      </div>
      <div className="chart-wrap" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Montants facturés et encaissés par mois en ${year}. Détail dans le tableau des mois.`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={t === 0 ? 1.2 : 1} strokeDasharray={t === 0 ? undefined : "2 4"} />
              <text x={L - 8} y={y(t) + 4} textAnchor="end" className="tick">{short(t)}</text>
            </g>
          ))}
          {data.map((d, m) => {
            const x0 = L + band * m + (band - (bw * 2 + 2)) / 2;
            return (
              <g key={m} onMouseEnter={() => setHover(m)} onFocus={() => setHover(m)} tabIndex={0} aria-label={`${d.label} : facturé ${fcfa(d.invoiced)}, encaissé ${fcfa(d.collected)}`}>
                <rect x={L + band * m} y={T} width={band} height={H - T - B} fill={hover === m ? "rgba(255,255,255,.04)" : "transparent"} />
                <path d={bar(x0, d.invoiced)} fill="var(--s-invoiced)" />
                <path d={bar(x0 + bw + 2, d.collected)} fill="var(--s-collected)" />
                <text x={L + band * m + band / 2} y={H - 10} textAnchor="middle" className="tick">{d.label}</text>
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div className="chart-tip" style={{ left: `${((L + band * hover + band / 2) / W) * 100}%` }} role="status">
            <b>{data[hover].label} {year}</b>
            <span><i style={{ background: "var(--s-invoiced)" }} />Facturé <strong>{fcfa(data[hover].invoiced)}</strong></span>
            <span><i style={{ background: "var(--s-collected)" }} />Encaissé <strong>{fcfa(data[hover].collected)}</strong></span>
          </div>
        )}
      </div>
      <details className="chart-table">
        <summary>Voir le tableau des mois</summary>
        <table className="rtable compact">
          <thead><tr><th>Mois</th><th className="num">Facturé</th><th className="num">Encaissé</th></tr></thead>
          <tbody>{data.map((d) => <tr key={d.label}><td>{d.label}</td><td className="num">{fcfa(d.invoiced)}</td><td className="num">{fcfa(d.collected)}</td></tr>)}</tbody>
        </table>
      </details>
    </section>
  );
}

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

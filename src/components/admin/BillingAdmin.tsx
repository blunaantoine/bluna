"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminNav from "./AdminNav";

type Line = { label: string; qty: number; unitPrice: number };
type Client = { id: string; name: string; company: string; phone: string; email: string; token: string; invoiceCount?: number; due?: number };
type Payment = { id: string; amount: number; method: string; status: string; provider: string; reference: string; payerPhone: string; proof: string; createdAt: string; transactionId: string | null; aiData: string; aiVerdict: string; paidOn: string | null; receiptEmail: string; receiptSentAt: string | null };
type Analysis = {
  verdict: "conforme" | "a_verifier" | "suspect";
  receipt: { operator: string; status: string; amount: number | null; fees: number | null; reference: string | null; datetime: string | null; sender_number: string | null; recipient_number: string | null; recipient_name: string | null; confidence: string; notes: string };
  checks: { label: string; ok: boolean | null; detail: string }[];
};
const VERDICT: Record<string, string> = { conforme: "Conforme", a_verifier: "À vérifier", suspect: "Suspect" };
const parseAi = (s: string): Analysis | null => { try { return s ? (JSON.parse(s) as Analysis) : null; } catch { return null; } };
type Invoice = {
  id: string; number: string; token: string; title: string; items: Line[]; discount: number; total: number; amountPaid: number;
  allowDeposit: boolean; status: string; notes: string; projectSlug: string | null; issuedAt: string; dueAt: string | null; paidAt: string | null;
  overdue: boolean; client: Client; payments: Payment[];
};

const fcfa = (n: number) => `${new Intl.NumberFormat("fr-FR").format(Math.round(n)).replace(/ | /g, " ")} FCFA`;
const dateFr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const LABEL: Record<string, string> = { brouillon: "Brouillon", envoyee: "À payer", partielle: "Acompte reçu", payee: "Payée", annulee: "Annulée" };
const METHOD: Record<string, string> = { fedapay: "FedaPay", mobile: "Mobile Money", especes: "Espèces", virement: "Virement" };
const waNumber = (p: string) => { const d = p.replace(/\D/g, ""); return d.length === 8 ? `228${d}` : d; };
const wa = (phone: string, text: string) => `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`;

async function api<T = Record<string, unknown>>(url: string, method = "GET", body?: unknown): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  const res = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  if (res.status === 401) location.href = "/admin/connexion";
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

export default function BillingAdmin({ projects }: { projects: { slug: string; title: string }[] }) {
  const [tab, setTab] = useState<"factures" | "clients">("factures");
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [editing, setEditing] = useState<Invoice | "new" | null>(null);
  const [cashing, setCashing] = useState<Invoice | null>(null);
  const [clientEdit, setClientEdit] = useState<Client | "new" | null>(null);
  const [filter, setFilter] = useState("ouvertes");
  const [toast, setToast] = useState("");
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([api<{ invoices: Invoice[] }>("/api/admin/factures"), api<{ clients: Client[] }>("/api/admin/clients")]);
    setInvoices(a.data.invoices ?? []); setClients(b.data.clients ?? []);
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3500); return () => clearTimeout(t); }, [toast]);

  const pending = useMemo(() => (invoices ?? []).flatMap((i) => i.payments.filter((p) => p.status === "en_attente" && p.method === "mobile").map((p) => ({ p, i }))), [invoices]);
  const open = (invoices ?? []).filter((i) => i.status === "envoyee" || i.status === "partielle");
  const toCollect = open.reduce((a, i) => a + i.total - i.amountPaid, 0);
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
  const collected = (invoices ?? []).flatMap((i) => i.payments).filter((p) => p.status === "valide" && new Date(p.createdAt) >= month).reduce((a, p) => a + p.amount, 0);
  const shown = (invoices ?? []).filter((i) => filter === "toutes" ? true : filter === "ouvertes" ? i.status === "envoyee" || i.status === "partielle" || i.status === "brouillon" : i.status === filter);

  const copy = async (txt: string, msg: string) => { try { await navigator.clipboard.writeText(txt); setToast(msg); } catch { setToast(txt); } };
  const invText = (i: Invoice) => `Bonjour ${i.client.name.split(" ")[0]}, voici votre facture ${i.number} (${i.title}) d'un montant de ${fcfa(i.total - i.amountPaid)}. Vous pouvez la consulter et la payer en ligne (T-Money, Flooz, carte) ici : ${origin}/f/${i.token}\n\nMerci ! Antoine — OQUI`;
  const spaceText = (c: Client) => `Bonjour ${c.name.split(" ")[0]}, voici votre espace client OQUI. Vous y trouverez toutes vos factures et pourrez les payer en ligne : ${origin}/espace/${c.token}`;

  async function act(url: string, body: unknown, ok: string, method = "PATCH") {
    const r = await api(url, method, body);
    setToast(r.ok ? ok : r.data.error || "Action impossible."); load();
  }

  return (
    <>
      <AdminNav />
      <div className="admin-wrap">
        <div className="admin-head">
          <div>
            <h1 className="display">Factures</h1>
            <p className="mono">Envoyez le lien d'une facture ou l'espace client sur WhatsApp. Les paiements en ligne se valident tout seuls.</p>
          </div>
          <div className="admin-kpis">
            <div><strong>{fcfa(toCollect)}</strong><span>à encaisser</span></div>
            <div><strong>{fcfa(collected)}</strong><span>encaissé ce mois</span></div>
            <div><strong>{open.filter((i) => i.overdue).length}</strong><span>en retard</span></div>
          </div>
        </div>

        {pending.length > 0 && (
          <div className="verify">
            <b>{pending.length} paiement{pending.length > 1 ? "s" : ""} Mobile Money à vérifier</b>
            {pending.map(({ p, i }) => (
              <div key={p.id} className="verify-row">
                {p.proof ? (
                  <a href={`/api/admin/paiements/${p.id}/preuve`} target="_blank" rel="noopener" className="proof-thumb" title="Ouvrir la capture en grand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/admin/paiements/${p.id}/preuve`} alt={`Capture du paiement de ${i.client.name}`} />
                  </a>
                ) : null}
                <span className="verify-info"><b>{fcfa(p.amount)}</b> par {p.provider} · {i.client.name} · {i.number}<br /><span className="mono">{p.payerPhone ? `depuis ${p.payerPhone} · ` : ""}{p.reference ? `réf. ${p.reference} · ` : ""}{dateFr(p.createdAt)}{!p.proof ? " · sans capture : vérifiez sur votre relevé" : ""}</span>{p.proof ? <><br /><a className="link-arrow" href={`/api/admin/paiements/${p.id}/preuve`} target="_blank" rel="noopener">Voir la capture ↗</a></> : null}</span>
                <AiPanel p={p} onRetry={() => act(`/api/admin/paiements/${p.id}/analyser`, {}, "Capture relue.", "POST")} />
                <span className="pact">
                  <button className="btn btn-sm" onClick={() => act(`/api/admin/paiements/${p.id}`, { action: "valider" }, "Paiement validé, la facture est à jour.")}>J'ai bien reçu</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => act(`/api/admin/paiements/${p.id}`, { action: "refuser" }, "Paiement refusé.")}>Pas reçu</button>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="bill-toolbar">
          <div className="seg-admin" role="tablist">
            <button role="tab" aria-selected={tab === "factures"} onClick={() => setTab("factures")}>Factures</button>
            <button role="tab" aria-selected={tab === "clients"} onClick={() => setTab("clients")}>Clients ({clients.length})</button>
          </div>
          {tab === "factures" ? (
            <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
              <select aria-label="Filtrer" value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-select">
                <option value="ouvertes">En cours</option><option value="payee">Payées</option><option value="annulee">Annulées</option><option value="toutes">Toutes</option>
              </select>
              <button className="btn" onClick={() => setEditing("new")}>+ Nouvelle facture</button>
            </div>
          ) : <button className="btn" onClick={() => setClientEdit("new")}>+ Nouveau client</button>}
        </div>

        {tab === "factures" ? (
          <ul className="plist">
            {invoices === null && <li className="inbox-empty">Chargement…</li>}
            {invoices && !shown.length && (
              <li className="inbox-empty"><strong>{invoices.length ? "Aucune facture dans ce filtre." : "Créez votre première facture."}</strong><span>Ajoutez un client, les lignes de la prestation, puis envoyez le lien sur WhatsApp : votre client la consulte et la paie en T-Money, Flooz ou carte.</span></li>
            )}
            {shown.map((i) => {
              const left = i.total - i.amountPaid;
              const live = i.status === "envoyee" || i.status === "partielle";
              return (
                <li key={i.id} className="bill-row">
                  <span className="bill-main">
                    <span className="mono">{i.number} · {dateFr(i.issuedAt)}{i.dueAt ? ` · échéance ${dateFr(i.dueAt)}` : ""}</span>
                    <b>{i.title}</b>
                    <span className="bill-client">{i.client.name}{i.client.company ? ` · ${i.client.company}` : ""}</span>
                  </span>
                  <span className={`pill s-${i.overdue ? "retard" : i.status}`}>{i.overdue ? "En retard" : LABEL[i.status]}</span>
                  <span className="bill-amount"><strong>{fcfa(i.total)}</strong>{i.amountPaid > 0 && i.status !== "payee" && <span className="mono">reste {fcfa(left)}</span>}</span>
                  <span className="pact bill-actions">
                    {i.status !== "brouillon" && i.client.phone && live && <a className="btn btn-sm" href={wa(i.client.phone, invText(i))} target="_blank" rel="noopener">WhatsApp</a>}
                    {i.status !== "brouillon" && <button className="btn btn-ghost btn-sm" onClick={() => copy(`${origin}/f/${i.token}`, "Lien de la facture copié.")}>Copier le lien</button>}
                    {i.status === "brouillon" && <button className="btn btn-sm" onClick={() => act(`/api/admin/factures/${i.id}`, { action: "envoyer" }, "Facture prête : envoyez le lien au client.")}>Valider</button>}
                    {live && <button className="btn btn-ghost btn-sm" onClick={() => setCashing(i)}>Encaisser</button>}
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(i)}>{i.amountPaid > 0 || i.status === "annulee" ? "Détails" : "Modifier"}</button>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="plist">
            {!clients.length && <li className="inbox-empty"><strong>Aucun client.</strong><span>Chaque client reçoit un lien personnel vers toutes ses factures.</span></li>}
            {clients.map((c) => (
              <li key={c.id} className="bill-row">
                <span className="bill-main"><b>{c.name}</b><span className="bill-client">{[c.company, c.phone, c.email].filter(Boolean).join(" · ") || "Aucune coordonnée"}</span></span>
                <span className="mono">{c.invoiceCount ?? 0} facture(s)</span>
                <span className="bill-amount"><strong>{fcfa(c.due ?? 0)}</strong><span className="mono">à payer</span></span>
                <span className="pact bill-actions">
                  {c.phone && <a className="btn btn-sm" href={wa(c.phone, spaceText(c))} target="_blank" rel="noopener">Envoyer son espace</a>}
                  <button className="btn btn-ghost btn-sm" onClick={() => copy(`${origin}/espace/${c.token}`, "Lien de l'espace client copié.")}>Copier le lien</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setClientEdit(c)}>Modifier</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {editing && <InvoiceEditor key="ed" inv={editing === "new" ? null : editing} clients={clients} projects={projects} onClose={() => setEditing(null)} onDone={(m) => { setEditing(null); setToast(m); load(); }} onClientCreated={(c) => setClients((l) => [c, ...l])} />}
        {cashing && <CashDialog key="cash" inv={cashing} onClose={() => setCashing(null)} onDone={(m) => { setCashing(null); setToast(m); load(); }} />}
        {clientEdit && <ClientEditor key="cl" client={clientEdit === "new" ? null : clientEdit} onClose={() => setClientEdit(null)} onDone={(m) => { setClientEdit(null); setToast(m); load(); }} />}
      </AnimatePresence>
      <AnimatePresence>{toast && <motion.div className="toast" initial={{ y: 80, opacity: 0, x: "-50%" }} animate={{ y: 0, opacity: 1, x: "-50%" }} exit={{ y: 80, opacity: 0, x: "-50%" }} role="status">{toast}</motion.div>}</AnimatePresence>
    </>
  );
}

/** Résultat de la lecture automatique de la capture (IA). */
function AiPanel({ p, onRetry }: { p: Payment; onRetry: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const a = parseAi(p.aiData);
  const retry = async () => { setBusy(true); await onRetry(); setBusy(false); };
  if (!p.proof) return null;
  if (!a) return (
    <div className="ai-panel">
      <span className="mono">Lecture automatique indisponible pour cette capture.</span>
      <button className="link-arrow" onClick={retry} disabled={busy}>{busy ? "Lecture…" : "Lire la capture"}</button>
    </div>
  );
  const r = a.receipt;
  return (
    <div className={`ai-panel v-${a.verdict}`}>
      <div className="ai-head">
        <span className={`ai-verdict v-${a.verdict}`}>{VERDICT[a.verdict]}</span>
        <span className="mono">Lecture automatique · lisibilité {r.confidence}</span>
        <button className="link-arrow" onClick={retry} disabled={busy}>{busy ? "Lecture…" : "Relire"}</button>
      </div>
      <dl className="ai-facts">
        <div><dt>Montant lu</dt><dd>{r.amount != null ? fcfa(r.amount) : "—"}{r.fees ? ` (+${fcfa(r.fees)} de frais)` : ""}</dd></div>
        <div><dt>Référence</dt><dd>{r.reference ?? "—"}</dd></div>
        <div><dt>Date</dt><dd>{r.datetime ? new Date(r.datetime).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—"}</dd></div>
        <div><dt>Opérateur</dt><dd>{r.operator}</dd></div>
        <div><dt>De → à</dt><dd>{r.sender_number ?? "?"} → {r.recipient_number ?? "?"}{r.recipient_name ? ` (${r.recipient_name})` : ""}</dd></div>
      </dl>
      <ul className="ai-checks">
        {a.checks.map((c) => <li key={c.label} className={c.ok === true ? "ok" : c.ok === false ? "ko" : "na"}><b>{c.ok === true ? "✓" : c.ok === false ? "✕" : "?"}</b> <span><strong>{c.label}</strong> — {c.detail}</span></li>)}
      </ul>
      {r.notes && <p className="ai-notes">{r.notes}</p>}
    </div>
  );
}

/** Envoyer ou renvoyer le reçu d'un paiement validé (Resend). */
function ReceiptButton({ p }: { p: Payment }) {
  const [state, setState] = useState<"idle" | "busy" | "ask">("idle");
  const [email, setEmail] = useState(p.receiptEmail);
  const [msg, setMsg] = useState(p.receiptSentAt ? `Reçu envoyé le ${new Date(p.receiptSentAt).toLocaleDateString("fr-FR")}${p.receiptEmail ? ` à ${p.receiptEmail}` : ""}` : p.receiptEmail ? `Reçu demandé par ${p.receiptEmail}` : "");
  async function send() {
    setState("busy");
    const r = await api<{ message?: string }>(`/api/admin/paiements/${p.id}/recu`, "POST", email ? { email } : {});
    if (r.ok) { setMsg(`Reçu envoyé${email ? ` à ${email}` : ""} à l'instant.`); setState("idle"); return; }
    if (r.status === 422) { setState("ask"); setMsg(r.data.error || ""); return; }
    setMsg(r.data.error || "Envoi impossible."); setState("idle");
  }
  return (
    <span className="receipt-row">
      {state === "ask" && <input aria-label="E-mail du client" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e-mail du client" />}
      <button type="button" className="link-arrow" onClick={send} disabled={state === "busy" || (state === "ask" && !email)}>{state === "busy" ? "Envoi…" : p.receiptSentAt || msg.startsWith("Reçu envoyé") ? "Renvoyer le reçu" : "Envoyer le reçu"}</button>
      {msg && <span className="mono">{msg}</span>}
    </span>
  );
}

function Drawer({ title, onClose, children, onSubmit, foot }: { title: string; onClose: () => void; children: React.ReactNode; onSubmit: (e: React.FormEvent) => void; foot: React.ReactNode }) {
  return (
    <motion.div className="drawer-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="drawer-backdrop" onClick={onClose} />
      <motion.form className="drawer" onSubmit={onSubmit} noValidate initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 34 }}>
        <div className="drawer-head"><h2 className="display">{title}</h2><button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">×</button></div>
        {children}
        <div className="drawer-foot">{foot}</div>
      </motion.form>
    </motion.div>
  );
}

function InvoiceEditor({ inv, clients, projects, onClose, onDone, onClientCreated }: {
  inv: Invoice | null; clients: Client[]; projects: { slug: string; title: string }[];
  onClose: () => void; onDone: (m: string) => void; onClientCreated: (c: Client) => void;
}) {
  const locked = !!inv && (inv.amountPaid > 0 || inv.status === "annulee");
  const [clientId, setClientId] = useState(inv?.client.id ?? clients[0]?.id ?? "");
  const [newClient, setNewClient] = useState(!clients.length && !inv);
  const [nc, setNc] = useState({ name: "", phone: "", company: "", email: "" });
  const [title, setTitle] = useState(inv?.title ?? "");
  const [items, setItems] = useState<Line[]>(inv?.items ?? [{ label: "", qty: 1, unitPrice: 0 }]);
  const [discount, setDiscount] = useState(inv?.discount ?? 0);
  const [dueAt, setDueAt] = useState(inv?.dueAt ? inv.dueAt.slice(0, 10) : new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10));
  const [allowDeposit, setAllowDeposit] = useState(inv?.allowDeposit ?? false);
  const [notes, setNotes] = useState(inv?.notes ?? "");
  const [projectSlug, setProjectSlug] = useState(inv?.projectSlug ?? "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState("");

  const subtotal = items.reduce((a, l) => a + (l.qty || 0) * (l.unitPrice || 0), 0);
  const total = subtotal - (discount || 0);
  const setItem = (k: number, patch: Partial<Line>) => setItems((l) => l.map((x, i) => (i === k ? { ...x, ...patch } : x)));

  async function save(e: React.FormEvent, status: "envoyee" | "brouillon" = "envoyee") {
    e.preventDefault(); setErr(""); setBusy(true);
    let cid = clientId;
    if (newClient) {
      const r = await api<{ client: Client }>("/api/admin/clients", "POST", nc);
      if (!r.ok) { setErr(r.data.error || "Client invalide."); setBusy(false); return; }
      cid = r.data.client.id; onClientCreated(r.data.client);
    }
    const body = { clientId: cid, title, items, discount, dueAt, allowDeposit, notes, projectSlug, status };
    const r = inv ? await api(`/api/admin/factures/${inv.id}`, "PATCH", body) : await api("/api/admin/factures", "POST", body);
    setBusy(false);
    if (!r.ok) { setErr(r.data.error || "Enregistrement impossible."); return; }
    onDone(inv ? "Facture enregistrée." : status === "brouillon" ? "Brouillon enregistré." : "Facture créée : envoyez-la sur WhatsApp depuis la liste.");
  }
  async function special(action: "annuler" | "reactiver" | "supprimer") {
    if (!inv) return;
    if (confirm !== action) { setConfirm(action); setErr(action === "supprimer" ? "Cliquez encore pour supprimer définitivement cette facture." : action === "annuler" ? "Cliquez encore pour annuler la facture : le client ne pourra plus la payer." : ""); if (action !== "reactiver") return; }
    const r = action === "supprimer" ? await api(`/api/admin/factures/${inv.id}`, "DELETE") : await api(`/api/admin/factures/${inv.id}`, "PATCH", { action });
    if (!r.ok) { setErr(r.data.error || "Action impossible."); return; }
    onDone(action === "supprimer" ? "Facture supprimée." : action === "annuler" ? "Facture annulée." : "Facture réactivée.");
  }

  return (
    <Drawer title={inv ? `Facture ${inv.number}` : "Nouvelle facture"} onClose={onClose} onSubmit={(e) => save(e)}
      foot={<>
        {inv && inv.status !== "annulee" && !inv.amountPaid && <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => special("supprimer")}>{confirm === "supprimer" ? "Supprimer définitivement" : "Supprimer"}</button>}
        {inv && inv.status !== "annulee" && inv.status !== "payee" && <button type="button" className="btn btn-ghost btn-sm" onClick={() => special("annuler")}>{confirm === "annuler" ? "Confirmer l'annulation" : "Annuler la facture"}</button>}
        {inv?.status === "annulee" && <button type="button" className="btn btn-ghost btn-sm" onClick={() => special("reactiver")}>Réactiver</button>}
        {inv && <a className="link-arrow" href={`/facture/${inv.token}`} target="_blank" rel="noopener">Voir comme le client ↗</a>}
        {!locked && !inv && <button type="button" className="btn btn-ghost" disabled={busy} onClick={(e) => save(e, "brouillon")}>Brouillon</button>}
        {!locked && <button className="btn" disabled={busy}>{inv ? "Enregistrer" : `Créer · ${fcfa(Math.max(0, total))}`}</button>}
      </>}>
      {locked && <p className="admin-banner"><span>Cette facture a déjà reçu un paiement ou a été annulée : son contenu est figé.</span></p>}

      {inv && inv.payments.length > 0 && (
        <fieldset><legend>Paiements</legend>
          <ul className="pay-hist">{inv.payments.map((p) => <li key={p.id}><span>{dateFr(p.createdAt)} · {METHOD[p.method] ?? p.method}{p.provider && p.method === "mobile" ? ` (${p.provider})` : ""}{p.reference ? ` · réf. ${p.reference}` : ""}{p.proof ? <> · <a href={`/api/admin/paiements/${p.id}/preuve`} target="_blank" rel="noopener">capture</a></> : null}</span><span className={`status s-${p.status === "valide" ? "repondu" : p.status === "en_attente" ? "nouveau" : ""}`}>{p.status === "valide" ? fcfa(p.amount) : `${fcfa(p.amount)} · ${p.status.replace("_", " ")}`}</span>{p.status === "valide" && <ReceiptButton p={p} />}</li>)}</ul>
        </fieldset>
      )}

      <fieldset disabled={locked}>
        <legend>Client</legend>
        {!newClient ? (
          <div className="field-row">
            <label className="field"><span>Client</span>
              <select id="inv-client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>)}
              </select>
            </label>
            <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: "end" }} onClick={() => setNewClient(true)}>+ Nouveau client</button>
          </div>
        ) : (
          <div className="form" style={{ gap: ".8rem" }}>
            <div className="field-row">
              <label className="field"><span>Nom *</span><input id="nc-name" value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} placeholder="Afi Mensah" /></label>
              <label className="field"><span>WhatsApp</span><input id="nc-phone" type="tel" value={nc.phone} onChange={(e) => setNc({ ...nc, phone: e.target.value })} placeholder="90 00 00 00" /></label>
            </div>
            <div className="field-row">
              <label className="field"><span>Entreprise</span><input id="nc-company" value={nc.company} onChange={(e) => setNc({ ...nc, company: e.target.value })} /></label>
              <label className="field"><span>E-mail</span><input id="nc-email" type="email" value={nc.email} onChange={(e) => setNc({ ...nc, email: e.target.value })} /></label>
            </div>
            {clients.length > 0 && <button type="button" className="link-arrow" onClick={() => setNewClient(false)}>← Choisir un client existant</button>}
          </div>
        )}
      </fieldset>

      <fieldset disabled={locked}>
        <legend>Prestation</legend>
        <label className="field"><span>Titre de la facture *</span><input id="inv-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Logo et charte graphique" /></label>
        <div className="lines-edit">
          <div className="le-head mono"><span>Désignation</span><span>Qté</span><span>Prix unitaire</span><span>Montant</span><span /></div>
          {items.map((l, k) => (
            <div key={k} className="le-row">
              <input aria-label="Désignation" value={l.label} onChange={(e) => setItem(k, { label: e.target.value })} placeholder="Ex. Création du logo" />
              <input aria-label="Quantité" type="number" inputMode="decimal" min={0} value={l.qty} onChange={(e) => setItem(k, { qty: +e.target.value })} />
              <input aria-label="Prix unitaire" type="number" inputMode="numeric" min={0} step={500} value={l.unitPrice} onChange={(e) => setItem(k, { unitPrice: +e.target.value })} />
              <span className="le-total">{fcfa((l.qty || 0) * (l.unitPrice || 0))}</span>
              <button type="button" className="icon-btn" aria-label="Retirer la ligne" onClick={() => setItems((x) => x.length > 1 ? x.filter((_, i) => i !== k) : x)}>×</button>
            </div>
          ))}
          <button type="button" className="link-arrow" onClick={() => setItems((x) => [...x, { label: "", qty: 1, unitPrice: 0 }])}>+ Ajouter une ligne</button>
        </div>
        <div className="field-row">
          <label className="field"><span>Remise (FCFA)</span><input id="inv-discount" type="number" min={0} step={500} value={discount} onChange={(e) => setDiscount(+e.target.value)} /></label>
          <div className="le-sum"><span className="mono">Total</span><strong>{fcfa(Math.max(0, total))}</strong></div>
        </div>
      </fieldset>

      <fieldset disabled={locked}>
        <legend>Paiement</legend>
        <div className="field-row">
          <label className="field"><span>Échéance</span><input id="inv-due" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} /></label>
          <label className="field"><span>Projet lié (portfolio)</span>
            <select id="inv-project" value={projectSlug} onChange={(e) => setProjectSlug(e.target.value)}>
              <option value="">Aucun</option>{projects.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
            </select>
          </label>
        </div>
        <label className="switch"><input type="checkbox" checked={allowDeposit} onChange={(e) => setAllowDeposit(e.target.checked)} /><span>Autoriser le paiement en plusieurs fois (acompte)</span></label>
        <label className="field"><span>Note pour le client</span><textarea id="inv-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex. 50 % à la commande, le solde à la livraison des fichiers." /></label>
      </fieldset>
      {err && <p className="err" role="alert">{err}</p>}
    </Drawer>
  );
}

function CashDialog({ inv, onClose, onDone }: { inv: Invoice; onClose: () => void; onDone: (m: string) => void }) {
  const left = inv.total - inv.amountPaid;
  const [amount, setAmount] = useState(left);
  const [method, setMethod] = useState("especes");
  const [reference, setReference] = useState("");
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await api(`/api/admin/factures/${inv.id}/paiements`, "POST", { amount, method, reference });
    if (!r.ok) { setErr(r.data.error || "Enregistrement impossible."); return; }
    onDone(amount >= left ? `Facture ${inv.number} marquée comme payée.` : `${fcfa(amount)} enregistrés sur ${inv.number}.`);
  }
  return (
    <Drawer title={`Encaisser ${inv.number}`} onClose={onClose} onSubmit={submit} foot={<button className="btn">Enregistrer {fcfa(amount || 0)}</button>}>
      <p className="mono">{inv.client.name} · reste à payer {fcfa(left)}</p>
      <div className="chips">
        {[["especes", "Espèces"], ["mobile", "Mobile Money"], ["virement", "Virement"]].map(([v, l]) => <label key={v} className="chip"><input type="radio" name="m" id={`m-${v}`} checked={method === v} onChange={() => setMethod(v)} /><span>{l}</span></label>)}
      </div>
      <div className="field-row">
        <label className="field"><span>Montant reçu (FCFA)</span><input id="cash-amount" type="number" min={1} max={left} value={amount} onChange={(e) => setAmount(+e.target.value)} /></label>
        <label className="field"><span>Référence (facultatif)</span><input id="cash-ref" value={reference} onChange={(e) => setReference(e.target.value)} /></label>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
    </Drawer>
  );
}

function ClientEditor({ client, onClose, onDone }: { client: Client | null; onClose: () => void; onDone: (m: string) => void }) {
  const [c, setC] = useState({ name: client?.name ?? "", company: client?.company ?? "", phone: client?.phone ?? "", email: client?.email ?? "" });
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = client ? await api(`/api/admin/clients/${client.id}`, "PATCH", c) : await api("/api/admin/clients", "POST", c);
    if (!r.ok) { setErr(r.data.error || "Enregistrement impossible."); return; }
    onDone(client ? "Client enregistré." : "Client ajouté.");
  }
  const [del, setDel] = useState<"" | "confirm" | "force">("");
  async function remove() {
    if (!client) return;
    if (!del) { setDel("confirm"); setErr(`Cliquez encore pour supprimer ${client.name}${client.invoiceCount ? ` et ses ${client.invoiceCount} facture(s)` : ""}. Son lien privé ne fonctionnera plus.`); return; }
    const r = await api<{ needsForce?: boolean }>(`/api/admin/clients/${client.id}${del === "force" ? "?force=1" : ""}`, "DELETE");
    if (r.ok) { onDone(`${client.name} a été supprimé.`); return; }
    if (r.data.needsForce) { setDel("force"); setErr(`${r.data.error} Cliquez sur « Supprimer quand même » pour confirmer.`); return; }
    setErr(r.data.error || "Suppression impossible.");
  }
  async function regen() {
    if (!client) return;
    if (!confirm) { setConfirm(true); setErr("Cliquez encore : l'ancien lien de l'espace client ne fonctionnera plus."); return; }
    const r = await api(`/api/admin/clients/${client.id}`, "PATCH", { regenerateLink: true });
    if (r.ok) onDone("Nouveau lien créé. Renvoyez-le au client."); else setErr(r.data.error || "Action impossible.");
  }
  return (
    <Drawer title={client ? client.name : "Nouveau client"} onClose={onClose} onSubmit={submit}
      foot={<>{client && <button type="button" className="btn btn-ghost btn-sm danger" onClick={remove}>{del === "force" ? "Supprimer quand même" : del ? "Confirmer la suppression" : "Supprimer le client"}</button>}{client && <button type="button" className="btn btn-ghost btn-sm" onClick={regen}>{confirm ? "Confirmer le nouveau lien" : "Changer le lien privé"}</button>}<button className="btn">Enregistrer</button></>}>
      <div className="field-row">
        <label className="field"><span>Nom *</span><input id="cl-name" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></label>
        <label className="field"><span>Entreprise</span><input id="cl-company" value={c.company} onChange={(e) => setC({ ...c, company: e.target.value })} /></label>
      </div>
      <div className="field-row">
        <label className="field"><span>WhatsApp</span><input id="cl-phone" type="tel" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} placeholder="90 00 00 00" /></label>
        <label className="field"><span>E-mail</span><input id="cl-email" type="email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} /></label>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
    </Drawer>
  );
}

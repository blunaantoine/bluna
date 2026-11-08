"use client";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import AdminNav from "./AdminNav";

type Msg = {
  id: string; name: string; phone: string; email: string; company: string; services: string[];
  budget: string; deadline: string; body: string; status: string; createdAt: string;
  project: { slug: string; title: string; cover: string; coverBg: string } | null;
};

const POLL_MS = 15000;
const STATUS: Record<string, string> = { nouveau: "Nouveau", lu: "Lu", repondu: "Répondu" };

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function chime() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; o.type = "sine"; o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.14;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.start(t); o.stop(t + 0.4);
    });
  } catch {}
}

export default function Inbox() {
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [toast, setToast] = useState<Msg | null>(null);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [error, setError] = useState("");
  const known = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/messages", { cache: "no-store" });
      if (res.status === 401) { location.href = "/admin/connexion"; return; }
      const d: { messages: Msg[]; unread: number } = await res.json();
      setError("");
      if (known.current) {
        const fresh = d.messages.filter((m) => !known.current!.has(m.id));
        if (fresh.length) {
          const m = fresh[0];
          setToast(m); chime();
          if ("Notification" in window && Notification.permission === "granted") {
            const n = new Notification(m.project ? `Projet similaire à « ${m.project.title} »` : `Nouveau message de ${m.name}`, { body: `${m.name} : ${m.body.slice(0, 120)}`, icon: "/icon-192.png", tag: m.id });
            n.onclick = () => { window.focus(); setSel(m.id); };
          }
        }
      }
      known.current = new Set(d.messages.map((m) => m.id));
      setMsgs(d.messages);
      document.title = d.unread ? `(${d.unread}) Messages · OQUI` : "Messages · OQUI";
    } catch { setError("Connexion perdue, nouvelle tentative dans 15 s."); }
  }, []);

  useEffect(() => {
    setPerm("Notification" in window ? Notification.permission : "unsupported");
    load();
    const id = setInterval(load, POLL_MS);
    const vis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", vis); };
  }, [load]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 7000); return () => clearTimeout(t); }, [toast]);

  async function setStatus(id: string, status: string) {
    setMsgs((l) => (status === "archive" ? l?.filter((m) => m.id !== id) : l?.map((m) => (m.id === id ? { ...m, status } : m))) ?? null);
    if (status === "archive" && sel === id) setSel(null);
    await fetch(`/api/admin/messages/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
  }
  function open(m: Msg) { setSel(m.id); if (m.status === "nouveau") setStatus(m.id, "lu"); }

  const unread = msgs?.filter((m) => m.status === "nouveau").length ?? 0;
  const current = msgs?.find((m) => m.id === sel) ?? null;
  const withRef = msgs?.filter((m) => m.project).length ?? 0;
  const phoneDigits = (p: string) => { const d = p.replace(/\D/g, ""); return d.length === 8 ? `228${d}` : d; };
  const reply = (m: Msg) => `Bonjour ${m.name.split(" ")[0]}, merci pour votre message${m.project ? ` au sujet d'un projet comme « ${m.project.title} »` : ""}. `;

  return (
    <>
      <AdminNav unread={unread} />
      <div className="admin-wrap">
        <div className="admin-head">
          <div>
            <h1 className="display">Messages</h1>
            <p className="mono">Actualisé automatiquement toutes les 15 s{error ? ` · ${error}` : ""}</p>
          </div>
          <div className="admin-kpis">
            <div><strong>{unread}</strong><span>non lus</span></div>
            <div><strong>{msgs?.length ?? "–"}</strong><span>en cours</span></div>
            <div><strong>{withRef}</strong><span>avec projet de référence</span></div>
          </div>
        </div>

        {perm !== "granted" && perm !== "unsupported" && (
          <div className="admin-banner">
            <span>Recevez une alerte sur cet appareil dès qu'un client écrit, même quand cet onglet est en arrière-plan.</span>
            <button className="btn btn-sm" onClick={async () => setPerm(await Notification.requestPermission())}>Activer les alertes</button>
          </div>
        )}

        <div className={`inbox${current ? " has-sel" : ""}`}>
          <ul className="inbox-list">
            {msgs === null && <li className="inbox-empty">Chargement…</li>}
            {msgs?.length === 0 && (
              <li className="inbox-empty">
                <strong>Aucun message pour l'instant.</strong>
                <span>Quand un client remplit le formulaire de contact, son message apparaît ici avec le projet qu'il a choisi, et vous êtes notifié.</span>
                <Link href="/contact" target="_blank" className="link-arrow">Ouvrir le formulaire ↗</Link>
              </li>
            )}
            {msgs?.map((m) => (
              <li key={m.id}>
                <button className={`inbox-item${m.id === sel ? " active" : ""}${m.status === "nouveau" ? " unread" : ""}`} onClick={() => open(m)}>
                  <span className="who"><b>{m.name}</b><span className="mono">{ago(m.createdAt)}</span></span>
                  {m.project && <span className="ref-pill"><i style={{ background: m.project.coverBg }}><Image src={m.project.cover} alt="" width={20} height={20} /></i>Comme « {m.project.title} »</span>}
                  <span className="preview">{m.body}</span>
                  <span className={`status s-${m.status}`}>{STATUS[m.status] ?? m.status}</span>
                </button>
              </li>
            ))}
          </ul>

          <section className="inbox-detail" aria-live="polite">
            {!current ? (
              <div className="inbox-empty"><strong>Sélectionnez un message</strong><span>Les détails, le projet de référence et les boutons de réponse s'affichent ici.</span></div>
            ) : (
              <motion.div key={current.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="detail">
                <button className="link-arrow back" onClick={() => setSel(null)}>← Tous les messages</button>
                <div className="detail-head">
                  <div>
                    <h2 className="display">{current.name}</h2>
                    <p className="mono">{current.company || "Particulier"} · reçu {ago(current.createdAt)} · {new Date(current.createdAt).toLocaleString("fr-FR")}</p>
                  </div>
                  <span className={`status s-${current.status}`}>{STATUS[current.status]}</span>
                </div>

                {current.project && (
                  <Link href={`/projets/${current.project.slug}`} target="_blank" className="ref-card">
                    <span className="thumb" style={{ background: current.project.coverBg }}><Image src={current.project.cover} alt="" fill sizes="88px" style={{ objectFit: "contain", padding: 6 }} /></span>
                    <span><span className="eyebrow">Veut un projet similaire à</span><strong>{current.project.title}</strong><p>Ouvrir la fiche du projet ↗</p></span>
                  </Link>
                )}

                <p className="detail-body">{current.body}</p>

                <dl className="facts">
                  {current.services.length > 0 && <div><dt>Besoin</dt><dd>{current.services.join(", ")}</dd></div>}
                  {current.budget && <div><dt>Budget</dt><dd>{current.budget}</dd></div>}
                  {current.deadline && <div><dt>Délai</dt><dd>{current.deadline}</dd></div>}
                  {current.phone && <div><dt>WhatsApp</dt><dd>{current.phone}</dd></div>}
                  {current.email && <div><dt>E-mail</dt><dd>{current.email}</dd></div>}
                </dl>

                <div className="hero-actions">
                  {current.phone && <a className="btn" target="_blank" rel="noopener" onClick={() => setStatus(current.id, "repondu")} href={`https://wa.me/${phoneDigits(current.phone)}?text=${encodeURIComponent(reply(current))}`}>Répondre sur WhatsApp</a>}
                  {current.email && <a className="btn btn-ghost" onClick={() => setStatus(current.id, "repondu")} href={`mailto:${current.email}?subject=${encodeURIComponent("Votre projet avec OQUI")}&body=${encodeURIComponent(reply(current))}`}>Répondre par e-mail</a>}
                  {current.status !== "repondu" && <button className="btn btn-ghost" onClick={() => setStatus(current.id, "repondu")}>Marquer comme répondu</button>}
                  <button className="btn btn-ghost" onClick={() => setStatus(current.id, "archive")}>Archiver</button>
                </div>
              </motion.div>
            )}
          </section>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.button className="toast" style={{ border: 0, cursor: "pointer" }} initial={{ y: 80, opacity: 0, x: "-50%" }} animate={{ y: 0, opacity: 1, x: "-50%" }} exit={{ y: 80, opacity: 0, x: "-50%" }} onClick={() => { open(toast); setToast(null); }}>
            <span className="dot" />
            <span><b>{toast.name}</b> vient d'écrire{toast.project ? ` : projet comme « ${toast.project.title} »` : ""}. Ouvrir</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

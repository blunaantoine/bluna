"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { BACK, DEFS, FLAP, FRONT } from "./envelope-svg";

type Props = { brand: string; client: string; reference: string; due: string; amount: string; to: string; paid: boolean; discount?: string };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Bord irrégulier de la cire (même tracé que le modèle d'origine). */
function blobPath() {
  const pts: [number, number][] = [], N = 22;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = 47 + Math.sin(i * 2.7) * 1.8 + Math.cos(i * 1.3) * 1.4 + (i % 3 === 0 ? 1.2 : 0);
    pts.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]);
  }
  let d = "";
  for (let i = 0; i < N; i++) {
    const p0 = pts[i], p1 = pts[(i + 1) % N], p2 = pts[(i + 2) % N];
    if (i === 0) d += `M${((p0[0] + p1[0]) / 2).toFixed(2)} ${((p0[1] + p1[1]) / 2).toFixed(2)}`;
    d += ` Q${p1[0].toFixed(2)} ${p1[1].toFixed(2)} ${((p1[0] + p2[0]) / 2).toFixed(2)} ${((p1[1] + p2[1]) / 2).toFixed(2)}`;
  }
  return d + "Z";
}

function sealSvg(mono: string) {
  const blob = blobPath(), m = esc(mono);
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <defs><path id="arc" d="M50 50 m-29 0 a29 29 0 1 1 58 0 a29 29 0 1 1 -58 0"/></defs>
    <path d="${blob}" fill="url(#gWax)"/>
    <path d="${blob}" fill="none" stroke="#fff3d6" stroke-opacity=".35" stroke-width=".6" transform="translate(-.4 -.5)"/>
    <circle cx="50" cy="50" r="37" fill="url(#gWaxInner)"/>
    <circle cx="50" cy="50" r="37" fill="none" stroke="#5a3a12" stroke-opacity=".55" stroke-width="1.4"/>
    <circle cx="50" cy="50" r="36" fill="none" stroke="#ffeec8" stroke-opacity=".45" stroke-width=".7" transform="translate(-.5 -.6)"/>
    <circle cx="50" cy="50" r="22" fill="none" stroke="#5a3a12" stroke-opacity=".5" stroke-width="1"/>
    <circle cx="50" cy="50" r="22" fill="none" stroke="#fff0cc" stroke-opacity=".4" stroke-width=".6" transform="translate(-.4 -.5)"/>
    <text style="font-family:var(--f-isans),sans-serif" font-size="6.2" font-weight="600" letter-spacing="2.6" fill="#5b3b12" fill-opacity=".85"><textPath href="#arc" startOffset="0">OUVRIR · OUVRIR · OUVRIR ·</textPath></text>
    <text x="50" y="58.5" text-anchor="middle" style="font-family:var(--f-iserif),Georgia,serif" font-size="25" fill="#fff1d2" fill-opacity=".55" transform="translate(-.5 -.6)">${m}</text>
    <text x="50" y="58.5" text-anchor="middle" style="font-family:var(--f-iserif),Georgia,serif" font-size="25" fill="#5a3a12" fill-opacity=".85">${m}</text>
  </svg>`;
}

// Éclats de cire : positions fixes (pas de hasard au rendu serveur → pas d'écart à l'hydratation)
const FLECKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 + (i % 2 ? 0.35 : -0.2), d = 45 + ((i * 37) % 55);
  return { dx: `${Math.round(Math.cos(a) * d)}%`, dy: `${Math.round(Math.sin(a) * d + 30)}%`, delay: `${(i * 23) % 80}ms` };
});

export default function Envelope({ brand, client, reference, due, amount, to, paid, discount }: Props) {
  const mono = (brand.trim()[0] || "O").toUpperCase();
  const seal = useMemo(() => sealSvg(mono), [mono]);
  const [stage, setStage] = useState<string[]>([]);
  const cta = useRef<HTMLAnchorElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function open() {
    if (stage.includes("is-broken")) return;
    try { navigator.vibrate?.(12); } catch {}
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const T = reduce ? { flip: 0, behind: 0, open: 0, ready: 300 } : { flip: 380, behind: 880, open: 1150, ready: 2350 };
    const add = (c: string) => setStage((s) => [...s, c]);
    add("is-broken");
    timers.current.push(setTimeout(() => add("is-flipping"), T.flip));
    timers.current.push(setTimeout(() => add("is-flap-behind"), T.behind));
    timers.current.push(setTimeout(() => add("is-open"), T.open));
    timers.current.push(setTimeout(() => { add("is-ready"); cta.current?.focus({ preventScroll: true }); }, T.ready));
  }

  const rows = [["Référence", reference], ["Échéance", due], ["Remise", discount ?? ""], [paid ? "Réglée" : "Montant", amount, "total"]].filter((r) => r[1]);
  const isOpen = stage.includes("is-open");

  return (
    <div className="envelope-page">
      <div className="room" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div dangerouslySetInnerHTML={{ __html: DEFS }} />
      <main className={`env-main ${stage.join(" ")}`}>
        <div className="stage">
          <div className="env">
            <div className="glow" aria-hidden="true" />
            <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: BACK }} />
            <a className="letter" href={to} tabIndex={isOpen ? 0 : -1} aria-label="Consulter la facture">
              <div className="doc">
                <svg className="mark" viewBox="0 0 40 40" aria-hidden="true">
                  <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeWidth="1" />
                  <text x="20" y="26.5" textAnchor="middle" fontSize="19" fill="currentColor" style={{ fontFamily: "var(--f-iserif), Georgia, serif" }}>{mono}</text>
                </svg>
                <div className="brand">{brand}</div>
                <h1>{paid ? <>Votre facture <em>est réglée.</em></> : <>Votre facture <em>est prête.</em></>}</h1>
                {client && <p className="for">Préparée pour {client}</p>}
                <dl>{rows.map((r) => <div key={r[0]} className={`row ${r[2] ?? ""}`}><dt>{r[0]}</dt><dd>{r[1]}</dd></div>)}</dl>
              </div>
            </a>
            <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: FRONT }} />
            <div className="flap" aria-hidden="true" dangerouslySetInnerHTML={{ __html: FLAP }} />
            <button className="seal" type="button" aria-label="Ouvrir l'enveloppe" onClick={open}>
              <span className="half l" dangerouslySetInnerHTML={{ __html: seal }} />
              <span className="half r" dangerouslySetInnerHTML={{ __html: seal }} />
              <span className="flecks" aria-hidden="true">
                {FLECKS.map((f, i) => <i key={i} style={{ ["--dx" as string]: f.dx, ["--dy" as string]: f.dy, animationDelay: f.delay }} />)}
              </span>
            </button>
          </div>
        </div>

        <div className="caption">
          <div className="intro">
            <p>Vous avez reçu un pli.</p>
            <p>Touchez le sceau pour l&apos;ouvrir.</p>
          </div>
          <div className="outro" aria-live="polite">
            <a className="cta" href={to} ref={cta}>
              {paid ? "Voir la facture" : "Consulter et payer"}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </a>
            <span className="secure">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Lien sécurisé vers votre document
            </span>
          </div>
        </div>
        <noscript><p style={{ textAlign: "center", marginTop: 24 }}><a href={to} style={{ color: "#f3d9a0" }}>Consulter la facture</a></p></noscript>
      </main>
    </div>
  );
}

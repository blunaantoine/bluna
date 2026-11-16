"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function Login() {
  const next = useSearchParams().get("suite") || "/admin";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    // Délai maximum : on ne reste jamais bloqué sur « Connexion… ».
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }), cache: "no-store", signal: ctrl.signal });
      if (res.ok) {
        // Chargement complet de la page (et non navigation interne) : le navigateur pouvait avoir gardé
        // en mémoire « /admin → connexion » d'avant la connexion, et restait bloqué.
        window.location.replace(next.startsWith("/admin") && !next.startsWith("/admin/connexion") ? next : "/admin");
        return;
      }
      const d = await res.json().catch(() => ({})); setError(d.error || "Connexion impossible.");
    } catch {
      setError("Le serveur ne répond pas. Vérifiez votre connexion internet et réessayez.");
    } finally { clearTimeout(timer); }
    setBusy(false);
  }

  return (
    <main className="admin-login">
      <form onSubmit={submit} className="admin-login-card">
        <span className="brand-mark" style={{ width: 48, height: 48, fontSize: "1.3rem" }}>O</span>
        <h1 className="display" style={{ fontSize: "2rem" }}>Espace admin</h1>
        <p className="mono">Messages clients et gestion des projets</p>
        <label className={`field${error ? " invalid" : ""}`} style={{ width: "100%" }}>
          <span>Mot de passe</span>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          {error && <span className="err">{error}</span>}
        </label>
        <button className="btn" style={{ width: "100%" }} disabled={busy || !password}>{busy ? "Connexion…" : "Se connecter"}</button>
      </form>
    </main>
  );
}

export default function Page() { return <Suspense><Login /></Suspense>; }

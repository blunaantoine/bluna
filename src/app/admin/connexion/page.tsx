"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function Login() {
  const router = useRouter();
  const next = useSearchParams().get("suite") || "/admin";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    if (res.ok) { router.replace(next.startsWith("/admin") ? next : "/admin"); router.refresh(); return; }
    const d = await res.json().catch(() => ({})); setError(d.error || "Connexion impossible."); setBusy(false);
  }

  return (
    <main className="admin-login">
      <form onSubmit={submit} className="admin-login-card">
        <span className="brand-mark" style={{ width: 48, height: 48, fontSize: "1.3rem" }}>B</span>
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

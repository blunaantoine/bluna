"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminNav({ unread }: { unread?: number }) {
  const path = usePathname();
  const router = useRouter();
  const logout = async () => { await fetch("/api/admin/logout", { method: "POST" }); router.replace("/admin/connexion"); };
  return (
    <header className="admin-bar">
      <Link href="/admin" className="brand"><span className="brand-mark">O</span><span className="brand-text">OQUI <em>Admin</em></span></Link>
      <nav className="admin-tabs">
        <Link href="/admin" aria-current={path === "/admin" ? "page" : undefined}>Messages{unread ? <b className="badge">{unread}</b> : null}</Link>
        <Link href="/admin/factures" aria-current={path.startsWith("/admin/factures") ? "page" : undefined}>Factures</Link>
        <Link href="/admin/projets" aria-current={path.startsWith("/admin/projets") ? "page" : undefined}>Projets</Link>
        <Link href="/" target="_blank">Voir le site ↗</Link>
      </nav>
      <button className="btn btn-ghost btn-sm" onClick={logout}>Déconnexion</button>
    </header>
  );
}

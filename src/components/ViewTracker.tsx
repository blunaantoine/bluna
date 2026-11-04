"use client";
import { useEffect } from "react";

/** Compte une visite par projet et par session (statistiques de l'admin). */
export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const k = `vu:${slug}`;
    try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch {}
    fetch(`/api/projets/${slug}/vue`, { method: "POST", keepalive: true }).catch(() => {});
  }, [slug]);
  return null;
}

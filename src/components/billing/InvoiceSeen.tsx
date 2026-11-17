"use client";
import { useEffect } from "react";

/** Signale discrètement que le client a ouvert sa facture (une fois par session de navigation). */
export default function InvoiceSeen({ token }: { token: string }) {
  useEffect(() => {
    const key = `oqui-vue-${token}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch {}
    fetch(`/api/factures/${token}/vue`, { method: "POST", keepalive: true }).catch(() => {});
  }, [token]);
  return null;
}

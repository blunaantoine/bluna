"use client";
import { motion } from "framer-motion";

export default function ResultIcon({ kind }: { kind: "ok" | "ko" | "wait" }) {
  const bg = kind === "ok" ? "var(--live)" : kind === "ko" ? "var(--alert)" : "var(--panel-2)";
  return (
    <motion.span className="result-icon" style={{ background: bg }} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 240, damping: 14 }} aria-hidden="true">
      {kind === "ok" && <motion.svg width="40" height="40" viewBox="0 0 24 24" fill="none"><motion.path d="M5 12.5l4.5 4.5L19 7.5" stroke="#0d0d0e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.5 }} /></motion.svg>}
      {kind === "ko" && <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10M17 7L7 17" stroke="#0d0d0e" strokeWidth="2.4" strokeLinecap="round" /></svg>}
      {kind === "wait" && <motion.span className="spinner" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />}
    </motion.span>
  );
}

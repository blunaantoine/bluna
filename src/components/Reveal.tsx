"use client";
import { motion, useReducedMotion } from "framer-motion";

/** Fait glisser un bloc à son apparition. Le contenu reste toujours visible. */
export default function Reveal({ children, delay = 0, className, as = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "section" | "li" | "article" }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M className={className} initial={reduce ? false : { y: 36 }} whileInView={{ y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </M>
  );
}

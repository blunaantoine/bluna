"use client";
import { useEffect, useRef, useState } from "react";

/** Curseur argenté qui grossit sur les liens et affiche « Voir » sur les projets. */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"" | "hover" | "view">("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, raf = 0;
    const move = (e: MouseEvent) => { x = e.clientX; y = e.clientY; };
    const over = (e: MouseEvent) => {
      const t = e.target as Element;
      const v = t.closest<HTMLElement>("[data-cursor]");
      const h = t.closest("a, button, label, input, textarea, select");
      setMode(v ? "view" : h ? "hover" : ""); setLabel(v?.dataset.cursor ?? "");
    };
    const loop = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      if (ref.current) ref.current.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    addEventListener("mousemove", move, { passive: true }); document.addEventListener("mouseover", over); loop();
    return () => { cancelAnimationFrame(raf); removeEventListener("mousemove", move); document.removeEventListener("mouseover", over); };
  }, []);

  return <div ref={ref} className={`cursor ${mode}`} aria-hidden="true"><span>{label}</span></div>;
}

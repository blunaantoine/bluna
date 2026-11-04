"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import type { Img } from "@/content/projects";

/** Galerie du projet + visionneuse plein écran (flèches, Échap, glisser sur mobile). */
export default function Gallery({ images, bg, padded }: { images: Img[]; bg: string; padded: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const go = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + images.length) % images.length)), [images.length]);

  useEffect(() => {
    if (open === null) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    document.body.style.overflow = "hidden"; addEventListener("keydown", key);
    return () => { document.body.style.overflow = ""; removeEventListener("keydown", key); };
  }, [open, go]);

  const two = images.length > 1 && images.filter((im) => im.h > im.w * 1.15).length >= 2;
  return (
    <>
      <div className={`p-gallery${two ? " two" : ""}`}>
        {images.map((im, i) => {
          const tall = im.h > im.w * 1.15;
          const pad = padded.includes(im.src);
          return (
            <motion.button key={im.src} className={`shot${pad ? " pad" : ""}${two && !tall ? " wide" : ""}`} style={{ background: bg }} onClick={() => setOpen(i)} aria-label={`Agrandir : ${im.alt}`} data-cursor="Agrandir"
              initial={{ y: 40 }} whileInView={{ y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
              <Image src={im.src} alt={im.alt} width={im.w} height={im.h} priority={i === 0} sizes="(max-width: 960px) 100vw, 65vw" />
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div className="lightbox" role="dialog" aria-modal="true" aria-label="Visionneuse d'images" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="lightbox-bar">
              <span className="mono">{open + 1} / {images.length}</span>
              <button className="icon-btn" onClick={() => setOpen(null)} aria-label="Fermer" autoFocus>×</button>
            </div>
            <div className="lightbox-stage" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
              {images.length > 1 && <button className="icon-btn nav-l" onClick={() => go(-1)} aria-label="Image précédente">←</button>}
              <AnimatePresence mode="wait">
                <motion.div key={open} style={{ position: "absolute", inset: "0 56px" }} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  drag={images.length > 1 ? "x" : false} dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, info) => { if (info.offset.x < -60) go(1); if (info.offset.x > 60) go(-1); }}>
                  <Image src={images[open].src} alt={images[open].alt} fill sizes="100vw" style={{ objectFit: "contain" }} />
                </motion.div>
              </AnimatePresence>
              {images.length > 1 && <button className="icon-btn nav-r" onClick={() => go(1)} aria-label="Image suivante">→</button>}
            </div>
            <p className="lightbox-cap">{images[open].alt}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

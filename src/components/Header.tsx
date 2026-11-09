"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/projets", label: "Travaux" },
  { href: "/#services", label: "Services" },
  { href: "/suivi", label: "Maintenance" },
  { href: "/#apropos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);

  return (
    <header className={`topbar${scrolled ? " scrolled" : ""}`}>
      <div className="wrap topbar-inner">
        <Link href="/" className="brand" aria-label="OQUI, accueil">
          <span className="brand-mark">O</span>
          <span className="brand-text">OQUI</span>
        </Link>
        <nav className={`nav${open ? " open" : ""}`} id="nav" aria-label="Navigation principale">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path === l.href || (l.href === "/projets" && path.startsWith("/projets")) ? "page" : undefined} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href="/contact" className="btn btn-sm">Démarrer un projet</Link>
        <button className="menu-btn" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open} aria-controls="nav" onClick={() => setOpen(!open)}>
          <span /><span />
        </button>
      </div>
    </header>
  );
}

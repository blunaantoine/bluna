import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/content/site";
import "./billing.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="billing">
      <header className="billing-bar no-print">
        <div className="wrap billing-bar-inner">
          <Link href="/" className="brand"><span className="brand-mark">B</span><span className="brand-text">BLUNA <em>Graphisme</em></span></Link>
          <span className="mono secure"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M8 11V8a4 4 0 118 0v3" stroke="currentColor" strokeWidth="2" /></svg> Lien privé</span>
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer no-print">
        <div className="wrap footer-inner">
          <span>{profile.studio} · {profile.name} · {profile.city}</span>
          <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noopener">Une question ? WhatsApp {profile.phone}</a>
        </div>
      </footer>
    </div>
  );
}

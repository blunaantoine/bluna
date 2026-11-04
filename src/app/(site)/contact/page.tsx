import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { getProject } from "@/lib/projects";
import { fitFor } from "@/lib/view";
import { profile } from "@/content/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact", description: "Décrivez votre projet à Antoine ANANI, BLUNA Graphisme, Lomé." };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ projet?: string }> }) {
  const { projet } = await searchParams;
  const p = projet ? await getProject(projet) : null;
  const reference = p ? { slug: p.slug, title: p.title, cover: p.cover, coverBg: p.coverBg, category: p.category, summary: p.summary, contain: fitFor(p, p.cover) === "contain" } : null;

  return (
    <section className="section" style={{ paddingTop: "clamp(2rem, 5vw, 4rem)" }}>
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow"><span className="dot" /> Réponse sous 24 h</p>
          <h1 className="display" style={{ fontSize: "clamp(2.6rem, 7vw, 5.4rem)", lineHeight: 1 }}>
            {reference ? <>Un projet comme <em className="silver">{reference.title}</em> ?</> : <>Parlons de votre <em className="silver">projet</em>.</>}
          </h1>
          <p className="lead">Quelques choix, quelques mots : votre message arrive directement chez Antoine, qui est notifié sur son téléphone.</p>
        </div>
        <div className="contact">
          <ContactForm key={reference?.slug ?? "libre"} reference={reference} />
          <aside className="contact-side">
            <div className="contact-list">
              <div className="contact-item"><span className="label">WhatsApp</span><a className="value" href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noopener">{profile.phone}</a></div>
              <div className="contact-item"><span className="label">E-mail</span><a className="value" href={`mailto:${profile.email}`}>{profile.email}</a></div>
              <div className="contact-item"><span className="label">Instagram</span><a className="value" href={profile.instagram.url} target="_blank" rel="noopener">{profile.instagram.label}</a></div>
              <div className="contact-item"><span className="label">TikTok</span><a className="value" href={profile.tiktok.url} target="_blank" rel="noopener">{profile.tiktok.label}</a></div>
              <div className="contact-item"><span className="label">Studio</span><span className="value">{profile.city}</span></div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

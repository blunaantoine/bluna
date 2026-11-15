import { db } from "./db";

export type Photo = { src: string; alt: string };
export type AboutProfile = {
  portrait: string;     // photo du haut de l'accueil
  photo: string;        // grande photo de la section / page À propos
  gallery: Photo[];     // autres photos de vous (page À propos)
  headline: string;
  intro: string[];      // paragraphes de présentation
  values: { title: string; text: string }[];
  journey: { year: string; text: string }[];
  skills: string[];
};

export const defaultProfile: AboutProfile = {
  portrait: "/img/antoine-portrait.webp",
  photo: "/img/antoine-studio.webp",
  gallery: [],
  headline: "Graphiste de formation, développeur par passion.",
  intro: [
    "Je suis Antoine ANANI, fondateur d'OQUI à Lomé. J'ai commencé par les logos et les affiches, puis j'ai voulu que mes clients puissent aussi vendre, réserver et s'organiser en ligne.",
    "Aujourd'hui, je dessine l'identité d'une marque et je développe le site ou l'application qui va avec : une boutique de luxe, un cabinet de santé, un sommet national, une application de services à domicile.",
    "Travailler avec moi, c'est avoir un seul interlocuteur du premier croquis à la mise en ligne, puis un suivi après la livraison pour que tout continue de bien fonctionner.",
  ],
  values: [
    { title: "Écouter avant de dessiner", text: "Chaque projet commence par votre activité, vos clients et vos objectifs, pas par un modèle tout fait." },
    { title: "Une image cohérente", text: "Le logo, les visuels, le site et l'application parlent la même langue, pour une marque qu'on reconnaît." },
    { title: "Des outils qui servent", text: "Un beau site doit aussi vendre, informer ou faire gagner du temps. Je conçois pour l'usage réel." },
    { title: "Être là après", text: "Je reste disponible après la livraison : corrections, mises à jour et conseils sur WhatsApp." },
  ],
  journey: [
    { year: "Les débuts", text: "Logos, affiches et visuels pour les réseaux sociaux auprès d'entreprises et de particuliers à Lomé." },
    { year: "2022", text: "Premières collaborations professionnelles suivies avec des marques et des institutions." },
    { year: "Le web", text: "Sites vitrines, boutiques en ligne et applications pour aller plus loin que l'image." },
    { year: "Aujourd'hui", text: "OQUI : identité visuelle, développement et suivi réunis dans un même studio." },
  ],
  skills: ["Illustrator", "Photoshop", "Canva", "Figma", "Next.js", "React", "Android", "Photographie"],
};

const KEY = "profile";

export async function getProfile(): Promise<AboutProfile> {
  const row = await db.setting.findUnique({ where: { key: KEY } }).catch(() => null);
  if (!row) return defaultProfile;
  try { return { ...defaultProfile, ...(JSON.parse(row.value) as Partial<AboutProfile>) }; } catch { return defaultProfile; }
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const img = (v: unknown) => { const s = str(v, 300); return /^\/(uploads|img)\/[\w.\-]+$/.test(s) ? s : ""; };

/** Nettoie ce qui arrive de l'admin (longueurs, chemins d'images autorisés). */
export function cleanProfile(b: Partial<AboutProfile>): AboutProfile {
  const d = defaultProfile;
  return {
    portrait: img(b.portrait) || d.portrait,
    photo: img(b.photo) || d.photo,
    gallery: (Array.isArray(b.gallery) ? b.gallery : []).map((p) => ({ src: img(p?.src), alt: str(p?.alt, 160) })).filter((p) => p.src).slice(0, 12),
    headline: str(b.headline, 160) || d.headline,
    intro: (Array.isArray(b.intro) ? b.intro : []).map((p) => str(p, 1200)).filter(Boolean).slice(0, 8),
    values: (Array.isArray(b.values) ? b.values : []).map((v) => ({ title: str(v?.title, 80), text: str(v?.text, 400) })).filter((v) => v.title).slice(0, 8),
    journey: (Array.isArray(b.journey) ? b.journey : []).map((v) => ({ year: str(v?.year, 40), text: str(v?.text, 400) })).filter((v) => v.year || v.text).slice(0, 12),
    skills: (Array.isArray(b.skills) ? b.skills : []).map((s) => str(s, 40)).filter(Boolean).slice(0, 30),
  };
}

export async function saveProfile(p: AboutProfile) {
  const value = JSON.stringify(p);
  await db.setting.upsert({ where: { key: KEY }, update: { value }, create: { key: KEY, value } });
}

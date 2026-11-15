/**
 * Grilles tarifaires (graphisme, vidéo, web). Modifier ici les prix : la page /tarifs,
 * le menu « + Prestation » des factures et les conditions affichées sur les factures suivent.
 */
export type Tariff = {
  id: string;
  label: string;
  detail?: string;     // contenu de la formule
  min: number;         // prix (ou bas de fourchette) : prix de départ sur la facture
  max?: number;        // haut de fourchette
  from?: boolean;      // « à partir de »
  quote?: boolean;     // « sur devis »
  plus?: boolean;      // supplément (« + 2 000 FCFA »)
  unit?: string;       // « page », « vidéo », « mois »…
  was?: number;        // ancien prix (packs)
  delay?: string;
  price?: string;      // texte libre quand le prix n'est pas un montant (« inclus », « + 50 % »…)
  alt?: { min: number; from?: boolean }; // prix avec le matériel du client (tournage)
};
export type TariffGroup = { id: string; title: string; intro?: string; line: string; columns?: [string, string]; items: Tariff[]; notes?: string[]; bullets?: { title: string; items: string[] } };
export type TariffSection = { id: "graphisme" | "video" | "web"; title: string; lead: string; groups: TariffGroup[]; conditionsTitle: string; conditions: string[]; included?: string[] };

export const tariffSections: TariffSection[] = [
  {
    id: "graphisme",
    title: "Graphisme",
    lead: "Identité visuelle, réseaux sociaux, supports imprimés et professionnels. Tarifs ajustables selon la complexité, les délais et le volume.",
    groups: [
      { id: "identite", title: "Identité visuelle", line: "", items: [
        { id: "logo-simple", label: "Logo simple", min: 50000, max: 120000 },
        { id: "logo-pro", label: "Logo professionnel", detail: "recherche, concept, déclinaisons", min: 150000, max: 250000 },
        { id: "charte", label: "Charte graphique complète", min: 250000, max: 400000 },
      ] },
      { id: "social", title: "Design réseaux sociaux", line: "", items: [
        { id: "post", label: "Visuel simple (post)", min: 4000, max: 10000 },
        { id: "carousel", label: "Carrousel / design élaboré", min: 15000, max: 25000 },
        { id: "pack-social", label: "Pack mensuel (12 visuels)", min: 50000, max: 180000 },
      ] },
      { id: "print", title: "Supports imprimés", line: "", items: [
        { id: "flyer", label: "Flyer / Affiche", min: 15000, max: 30000 },
        { id: "carte-visite", label: "Carte de visite", min: 10000, max: 20000 },
        { id: "rollup", label: "Roll-up / Bannière", min: 30000, max: 60000 },
      ] },
      { id: "pro", title: "Supports professionnels", line: "", items: [
        { id: "ppt", label: "Présentation PowerPoint (10 slides)", min: 50000, max: 100000 },
        { id: "brochure", label: "Brochure / Catalogue", min: 10000, max: 20000, unit: "page" },
      ] },
      { id: "accompagnement", title: "Engagement mensuel (abonnement)", line: "", items: [
        { id: "accompagnement", label: "Accompagnement graphique mensuel", min: 50000, max: 500000, unit: "mois" },
      ], bullets: { title: "Selon la formule choisie, cet engagement inclut", items: ["Production régulière de visuels", "Priorité sur les demandes", "Suivi de l'identité visuelle", "Ajustements et mises à jour graphiques"] }, notes: ["Le volume et les livrables sont définis par contrat."] },
    ],
    conditionsTitle: "Conditions",
    conditions: ["50 % d'acompte requis avant démarrage", "Solde à la livraison finale"],
  },
  {
    id: "video",
    title: "Vidéo",
    lead: "Montage à partir de 2 500 FCFA. Vous m'envoyez vos vidéos, ou je viens filmer puis je monte.",
    groups: [
      { id: "montage", title: "Montage seul", line: "Montage vidéo — ", intro: "Vous envoyez vos vidéos, je m'occupe du montage complet : coupes, musique, textes, transitions.", items: [
        { id: "mont-1", label: "Vidéo de 30 s à 1 min", min: 2500 },
        { id: "mont-3", label: "Vidéo de 1 à 3 min", min: 5000 },
        { id: "mont-5", label: "Vidéo de 3 à 5 min", min: 8000 },
        { id: "pack-5", label: "Pack 5 vidéos courtes (30 s à 1 min)", min: 11000, was: 12500 },
        { id: "pack-10", label: "Pack 10 vidéos courtes (30 s à 1 min)", min: 20000, was: 25000 },
      ], notes: ["Au-delà de 5 minutes : sur devis."] },
      { id: "tournage", title: "Tournage + montage", line: "Tournage + montage — ", columns: ["Avec mon matériel", "Avec votre matériel"], intro: "Je me déplace pour filmer, puis je monte les vidéos. Environ 25 % de moins si le tournage se fait avec votre matériel (téléphone, micro, lumière).", items: [
        { id: "express", label: "Express", detail: "1 vidéo, 1 h sur place", min: 10000, alt: { min: 7500 } },
        { id: "standard", label: "Standard", detail: "jusqu'à 3 vidéos, 2 h sur place", min: 25000, alt: { min: 18000 } },
        { id: "demi-journee", label: "Demi-journée", detail: "jusqu'à 6 vidéos, 4 h sur place", min: 45000, alt: { min: 33000 } },
        { id: "journee", label: "Journée / événement", detail: "sur devis", min: 80000, from: true, alt: { min: 60000, from: true } },
        { id: "heure-sup", label: "Heure de tournage en plus", min: 5000, alt: { min: 4000 } },
      ], notes: ["Chaque vidéo montée dure de 30 s à 1 min."], bullets: { title: "Avec votre matériel", items: [
        "la qualité dépend de l'appareil fourni (caméra, son, stockage)",
        "l'appareil doit être chargé et avoir assez de mémoire libre, sinon le temps perdu compte dans la durée du tournage",
        "je ne suis pas responsable du matériel pendant le tournage (chute, panne)",
        "les fichiers doivent m'être envoyés en qualité originale (Drive, câble ou WhatsApp en mode document)",
      ] } },
      { id: "deplacement", title: "Déplacement", line: "Déplacement — ", items: [
        { id: "dep-lome", label: "Lomé centre", min: 0, price: "inclus" },
        { id: "dep-peri", label: "Périphérie (Agoè, Baguida, Adidogomé…)", min: 2000, plus: true },
        { id: "dep-hors", label: "Hors de Lomé", min: 5000, price: "transport réel + 5 000 FCFA" },
      ] },
      { id: "video-options", title: "Options vidéo", line: "Option vidéo — ", items: [
        { id: "v-24h", label: "Livraison en 24 h", min: 0, price: "+ 50 %" },
        { id: "v-soustitres", label: "Sous-titres", min: 1000, plus: true, unit: "vidéo" },
        { id: "v-retouche", label: "Retouche supplémentaire (2 séries incluses)", min: 1000 },
        { id: "v-rushs", label: "Rushs bruts (toutes les vidéos filmées)", min: 5000, plus: true },
        { id: "v-format", label: "Format supplémentaire (ex. vertical + horizontal)", min: 1000, plus: true, unit: "vidéo" },
      ] },
    ],
    conditionsTitle: "Conditions",
    conditions: [
      "Acompte de 50 % pour réserver un tournage, solde à la livraison",
      "Montage seul : paiement à la commande",
      "Livraison sous 2 à 3 jours après le tournage ou la réception des fichiers",
      "Annulation moins de 24 h avant le tournage : acompte non remboursé",
      "Des extraits peuvent figurer dans mon portfolio, sauf demande contraire du client",
    ],
  },
  {
    id: "web",
    title: "Web & applications",
    lead: "Un site à partir de 50 000 FCFA, une application à partir de 250 000 FCFA. Pour un projet hors grille, le devis est gratuit.",
    groups: [
      { id: "sites", title: "Sites internet", line: "Site web — ", intro: "De la page simple au site complet que vous gérez vous-même.", items: [
        { id: "page-unique", label: "Page unique", detail: "1 page statique (présentation, contacts, bouton WhatsApp), adaptée au téléphone", min: 50000, delay: "3 à 5 jours" },
        { id: "vitrine", label: "Site vitrine", detail: "3 à 5 pages (accueil, services, galerie, contact), formulaire de contact", min: 90000, max: 120000, delay: "1 à 2 semaines" },
        { id: "dynamique", label: "Site dynamique", detail: "jusqu'à 10 pages, espace d'administration pour modifier textes et images, blog ou actualités", min: 150000, max: 200000, delay: "2 à 3 semaines" },
        { id: "boutique", label: "Boutique en ligne", detail: "catalogue, panier, commande, paiement Mobile Money", min: 200000, from: true, quote: true, delay: "3 à 4 semaines" },
      ], notes: ["Inclus dans chaque site : design adapté au téléphone, mise en ligne, 2 séries de retouches et une courte formation."] },
      { id: "apps", title: "Applications web et Android", line: "Application — ", intro: "Le prix exact est fixé après un échange sur le projet, selon le nombre de fonctionnalités.", items: [
        { id: "app-simple", label: "Application web simple", detail: "prise de rendez-vous, formulaire de gestion, petit tableau de bord", min: 250000, max: 500000, delay: "3 à 5 semaines" },
        { id: "app-avancee", label: "Application web avancée", detail: "comptes utilisateurs, paiement Mobile Money, espace administrateur, statistiques", min: 500000, max: 1000000, delay: "1 à 2 mois" },
        { id: "android", label: "Application Android", detail: "installée sur téléphone, publiée sur Google Play", min: 400000, max: 1200000, delay: "1 à 2 mois" },
        { id: "plateforme", label: "Plateforme complète", detail: "application web + Android, plusieurs types d'utilisateurs, paiements, notifications", min: 1200000, max: 2000000, delay: "2 à 4 mois" },
        { id: "sur-mesure", label: "Projet sur mesure", detail: "besoins spécifiques ou grande envergure", min: 2000000, from: true, quote: true, delay: "selon le projet" },
      ], notes: ["Inclus : maquette à valider avant le développement, mise en ligne, 1 mois de corrections de bugs gratuites et une formation."] },
      { id: "web-options", title: "Options et maintenance", line: "", items: [
        { id: "domaine", label: "Nom de domaine et hébergement", min: 0, price: "prix réel du fournisseur, chaque année" },
        { id: "page-sup", label: "Page supplémentaire (site)", min: 10000, unit: "page" },
        { id: "seo", label: "Référencement Google de base", min: 20000, plus: true },
        { id: "redaction", label: "Rédaction des textes", min: 15000, plus: true },
        { id: "maint-site", label: "Maintenance site", detail: "mises à jour, sauvegardes, petites modifications", min: 10000, unit: "mois" },
        { id: "maint-app", label: "Maintenance application", min: 25000, max: 50000, unit: "mois" },
      ] },
    ],
    conditionsTitle: "Conditions de paiement",
    conditions: [
      "40 % à la commande",
      "30 % à la validation de la maquette",
      "30 % à la livraison, avant la mise en ligne définitive",
      "Toute fonctionnalité ajoutée après validation de la maquette fait l'objet d'un devis séparé",
      "Le site ou l'application appartient au client une fois le paiement complet reçu",
    ],
  },
];

const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(n).replace(/[  ]/g, " ");

/** Texte du prix : « 90 000 – 120 000 FCFA », « à partir de 200 000 FCFA, sur devis », « + 1 000 FCFA / vidéo »… */
export function priceText(t: Pick<Tariff, "min" | "max" | "from" | "quote" | "plus" | "unit" | "was" | "price">) {
  if (t.price) return t.price;
  let s = t.max ? `${nf(t.min)} – ${nf(t.max)} FCFA` : `${nf(t.min)} FCFA`;
  if (t.from) s = `à partir de ${s}`;
  if (t.plus) s = `+ ${s}`;
  if (t.unit) s += ` / ${t.unit}`;
  if (t.was) s += ` au lieu de ${nf(t.was)}`;
  if (t.quote) s += ", sur devis";
  return s;
}

/** Libellé d'une ligne de facture pour une prestation de la grille. */
export function lineLabel(g: TariffGroup, t: Tariff, variant?: "client") {
  const base = `${g.line}${t.label}${t.detail && !t.quote && g.id !== "web-options" ? ` : ${t.detail}` : ""}`;
  return `${base}${t.unit && !t.plus ? ` — par ${t.unit}` : ""}${variant === "client" ? " — avec votre matériel" : ""}`;
}

/** Options du menu « + Prestation » de l'éditeur de facture. */
export type TariffChoice = { key: string; section: TariffSection["id"]; group: string; text: string; label: string; unitPrice: number; deposit: boolean };
export const tariffChoices: TariffChoice[] = tariffSections.flatMap((s) => s.groups.flatMap((g) => g.items.filter((t) => t.min > 0 && !t.price).flatMap((t) => {
  const deposit = s.id !== "video" || g.id === "tournage"; // montage seul : payé à la commande
  const main = { key: `${t.id}`, section: s.id, group: `${s.title} · ${g.title}`, text: `${t.label} · ${priceText(t)}`, label: lineLabel(g, t), unitPrice: t.min, deposit };
  return t.alt ? [{ ...main, text: `${t.label} · ${priceText(t)} (mon matériel)` }, { ...main, key: `${t.id}:client`, text: `${t.label} · ${priceText({ ...t, ...t.alt })} (votre matériel)`, label: lineLabel(g, t, "client"), unitPrice: t.alt.min }] : [main];
})));

/** Rubriques de la grille présentes dans une facture (pour y afficher les bonnes conditions). */
export function sectionsInLines(labels: string[]) {
  const lower = labels.map((l) => l.toLowerCase());
  return tariffSections.filter((s) => s.groups.some((g) => g.items.some((t) => {
    const name = `${g.line}${t.label}`.toLowerCase();
    return lower.some((l) => l.startsWith(name));
  })));
}

/** Prix d'appel (accueil). */
export const startingPrices = { video: 2500, site: 50000, app: 250000, logo: 50000 };

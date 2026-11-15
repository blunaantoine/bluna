/** Grille tarifaire des prestations graphiques. Modifier ici les prix (fourchettes en FCFA). */
export type Tariff = { id: string; label: string; detail?: string; min: number; max: number; unit?: string };
export type TariffGroup = { id: string; title: string; service: string; items: Tariff[] };

export const tariffGroups: TariffGroup[] = [
  {
    id: "identite", title: "Identité visuelle", service: "identite",
    items: [
      { id: "logo-simple", label: "Logo simple", min: 50000, max: 120000 },
      { id: "logo-pro", label: "Logo professionnel", detail: "recherche, concept, déclinaisons", min: 150000, max: 250000 },
      { id: "charte", label: "Charte graphique complète", min: 250000, max: 400000 },
    ],
  },
  {
    id: "social", title: "Design réseaux sociaux", service: "social",
    items: [
      { id: "post", label: "Visuel simple (post)", min: 4000, max: 10000 },
      { id: "carousel", label: "Carrousel / design élaboré", min: 15000, max: 25000 },
      { id: "pack-social", label: "Pack mensuel (12 visuels)", min: 50000, max: 180000 },
    ],
  },
  {
    id: "print", title: "Supports imprimés", service: "print",
    items: [
      { id: "flyer", label: "Flyer / Affiche", min: 15000, max: 30000 },
      { id: "carte-visite", label: "Carte de visite", min: 10000, max: 20000 },
      { id: "rollup", label: "Roll-up / Bannière", min: 30000, max: 60000 },
    ],
  },
  {
    id: "pro", title: "Supports professionnels", service: "print",
    items: [
      { id: "ppt", label: "Présentation PowerPoint (10 slides)", min: 50000, max: 100000 },
      { id: "brochure", label: "Brochure / Catalogue", min: 10000, max: 20000, unit: "page" },
    ],
  },
];

/** Engagement mensuel : accompagnement graphique sur abonnement. */
export const monthlyDesign = {
  id: "accompagnement",
  label: "Accompagnement graphique mensuel",
  min: 50000,
  max: 500000,
  includes: ["Production régulière de visuels", "Priorité sur les demandes", "Suivi de l'identité visuelle", "Ajustements et mises à jour graphiques"],
  note: "Le volume et les livrables sont définis par contrat.",
};

export const tariffConditions = [
  "Tarifs ajustables selon la complexité, les délais et le volume",
  "50 % d'acompte requis avant démarrage",
  "Solde à la livraison finale",
];

export const allTariffs = tariffGroups.flatMap((g) => g.items.map((t) => ({ ...t, group: g.title })));

const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(n).replace(/[  ]/g, " ");
export const priceRange = (t: { min: number; max: number; unit?: string }) => `${nf(t.min)} – ${nf(t.max)} FCFA${t.unit ? ` / ${t.unit}` : ""}`;

/** Une facture contient-elle une prestation de la grille ? (pour afficher les conditions) */
export function hasTariffLine(labels: string[]) {
  const names = [...allTariffs.map((t) => t.label), monthlyDesign.label].map((s) => s.toLowerCase());
  return labels.some((l) => names.some((n) => l.toLowerCase().startsWith(n)));
}

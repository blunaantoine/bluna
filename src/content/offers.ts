/** Offres de suivi post-livraison (maintenance & assistance). Modifier ici les prix et le contenu. */
export type Offer = {
  id: "essentielle" | "regulier" | "serenite";
  title: string;
  monthly: number;
  tagline: string;
  included: string[];
  other: { label: string; items: string[]; positive: boolean };
  idealFor: string;
  recommended?: boolean;
};

export const offers: Offer[] = [
  {
    id: "essentielle",
    title: "Essentielle",
    monthly: 10000,
    tagline: "Un contrôle complet une fois par mois",
    included: [
      "1 journée complète de contrôle chaque mois",
      "Recherche et correction des bugs détectés",
      "Vérification de la sécurité (failles, accès, mises à jour critiques)",
      "Contrôle du bon fonctionnement général",
      "Correction gratuite de toute panne venant du code, sous 72 h",
      "Assistance WhatsApp ou e-mail, réponse sous 72 h ouvrées",
    ],
    other: { label: "Non inclus", positive: false, items: ["Amélioration des fonctionnalités existantes", "Ajout de nouvelles fonctionnalités", "Pannes d'origine externe (hébergeur, mauvaise manipulation, service tiers) : facturées à part"] },
    idealFor: "un site stable, peu modifié, qui a surtout besoin d'être surveillé.",
  },
  {
    id: "regulier",
    title: "Suivi Régulier",
    monthly: 20000,
    tagline: "Cinq passages de contrôle répartis dans le mois",
    included: [
      "5 vérifications dans le mois (environ une par semaine)",
      "À chaque passage : sécurité, bugs et bon fonctionnement",
      "Correction gratuite de toute panne venant du code, sous 48 h",
      "Jusqu'à 2 améliorations mineures par mois (ergonomie, affichage, réglages)",
      "Assistance WhatsApp ou e-mail, réponse sous 48 h",
      "Compte rendu mensuel des vérifications",
    ],
    other: { label: "Non inclus", positive: false, items: ["Ajout de nouvelles fonctionnalités", "Pannes d'origine externe : intervention à tarif réduit pour les abonnés"] },
    idealFor: "une application utilisée régulièrement, qui doit rester fiable et s'améliorer petit à petit.",
  },
  {
    id: "serenite",
    title: "Sérénité Totale",
    monthly: 25000,
    tagline: "Une couverture complète, tous les jours du mois",
    recommended: true,
    included: [
      "Disponibilité et assistance 24 h/24, 7 j/7",
      "Vérification quotidienne des bugs et de la sécurité",
      "Intervention directe en cas de panne, quelle qu'en soit l'origine : sous 2 h si bloquante, sous 24 h si mineure",
      "Amélioration des fonctionnalités existantes : jusqu'à 5 h par mois",
    ],
    other: { label: "En plus", positive: true, items: ["Ajout de nouvelles fonctionnalités sur devis, avec 20 % de réduction réservée aux abonnés", "Compte rendu mensuel détaillé"] },
    idealFor: "une application au cœur de votre activité, qui ne peut pas se permettre de s'arrêter.",
  },
];

/** Offre annuelle : 12 mois pour le prix de 10. */
export const yearlyPrice = (monthly: number) => monthly * 10;

export const comparison: { label: string; values: [string, string, string]; strong?: boolean[] }[] = [
  { label: "Prix mensuel", values: ["10 000 FCFA", "20 000 FCFA", "25 000 FCFA"] },
  { label: "Fréquence des vérifications", values: ["1 journée / mois", "5 passages / mois", "Tous les jours"] },
  { label: "Sécurité et bugs", values: ["✓", "✓", "✓"] },
  { label: "Délai de réponse", values: ["72 h ouvrées", "48 h", "24 h/24"] },
  { label: "Panne venant du code", values: ["Gratuite, sous 72 h", "Gratuite, sous 48 h", "Gratuite, sous 2 h"] },
  { label: "Panne d'origine externe", values: ["Facturée à part", "Tarif réduit", "Incluse"] },
  { label: "Amélioration des fonctionnalités", values: ["—", "2 mineures / mois", "Jusqu'à 5 h / mois"] },
  { label: "Nouvelles fonctionnalités", values: ["—", "—", "Sur devis, −20 %"] },
  { label: "Compte rendu", values: ["—", "Mensuel", "Mensuel détaillé"] },
];

export const conditions: [string, string][] = [
  ["Garantie", "toute panne causée par le code de l'application est corrigée gratuitement, quelle que soit la formule."],
  ["Paiement", "en début de mois, avant le début du suivi."],
  ["Sans engagement", "résiliable avec un préavis de 15 jours."],
  ["Offre annuelle", "12 mois pour le prix de 10."],
  ["Heures non utilisées", "non reportées sur le mois suivant."],
  ["Nouvelles fonctionnalités", "devis séparé, validé avant les travaux."],
  ["Changement de formule", "possible à tout moment, effectif le mois suivant."],
  ["Hors forfait", "hébergement, nom de domaine et refonte importante."],
];

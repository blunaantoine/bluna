export const profile = {
  name: "Antoine ANANI",
  studio: "OQUI",
  city: "Lomé, Togo",
  whatsapp: "22871998155",
  phone: "+228 71 99 81 55",
  email: "contact@oquitogo.com",
  instagram: { label: "@bluna_k_13", url: "https://www.instagram.com/bluna_k_13" },
  tiktok: { label: "@blunagraphisme", url: "https://www.tiktok.com/@blunagraphisme" },
  github: { label: "blunaantoine", url: "https://github.com/blunaantoine" },
};

export const categories = [
  { id: "tout", label: "Tout" },
  { id: "identite", label: "Identité & logos" },
  { id: "web", label: "Sites & applications" },
  { id: "photo", label: "Photographie" },
] as const;

export const categoryLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? id;

export const services = [
  {
    id: "identite",
    title: "Identité visuelle",
    text: "Un logo, une charte et ses déclinaisons pour que votre marque soit reconnue au premier regard.",
    points: ["Création de logo", "Charte graphique", "Cartes de visite", "Textile & goodies"],
  },
  {
    id: "web",
    title: "Sites & applications",
    text: "Sites vitrines, boutiques en ligne et outils métier, pensés pour le téléphone et mis en ligne.",
    points: ["Site vitrine", "E-commerce & paiement mobile", "Application de gestion", "Application Android"],
  },
  {
    id: "print",
    title: "Design graphique",
    text: "Affiches, flyers et visuels réseaux qui arrêtent le scroll et remplissent vos événements.",
    points: ["Affiches & flyers", "Visuels réseaux sociaux", "Packaging", "Supports d'événement"],
  },
  {
    id: "photo",
    title: "Photo & vidéo",
    text: "Photos de marque, portraits et vidéos courtes au format des réseaux.",
    points: ["Portraits", "Reportage", "Vidéos 9:16", "Montage"],
  },
];

export const contactServices = [
  { id: "identite", label: "Logo & identité" },
  { id: "web", label: "Site web" },
  { id: "app", label: "Application" },
  { id: "print", label: "Affiche / flyer" },
  { id: "social", label: "Visuels réseaux" },
  { id: "photo", label: "Photo / vidéo" },
  { id: "suivi", label: "Suivi / maintenance" },
];

export const budgets = [
  "À définir ensemble",
  "Moins de 50 000 FCFA",
  "50 000 – 150 000 FCFA",
  "150 000 – 400 000 FCFA",
  "400 000 – 1 000 000 FCFA",
  "Plus de 1 000 000 FCFA",
];

export const deadlines = ["Urgent (moins d'une semaine)", "Dans le mois", "Pas pressé"];

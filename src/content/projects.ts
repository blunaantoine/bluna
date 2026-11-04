/**
 * Projets de départ. Ils sont copiés dans la base de données par `npm run db:seed`.
 * Ensuite, tout se gère depuis l'espace admin (/admin/projets).
 * Toutes les images viennent du dossier Drive « Portfolio - Antoine ANANI »
 * ou de vraies captures d'écran des applications.
 */

export type Img = { src: string; alt: string; w: number; h: number };

export type SeedProject = {
  slug: string;
  title: string;
  client?: string;
  category: "identite" | "web" | "photo";
  year: number;
  summary: string;
  description: string;
  tags: string[];
  stack?: string[];
  images: Img[];
  coverBg: string;
  link?: string;
  featured?: boolean;
};

const i = (src: string, alt: string, w: number, h: number): Img => ({ src: `/projets/${src}`, alt, w, h });

export const seedProjects: SeedProject[] = [
  // ── Identité & logos ─────────────────────────────────────
  {
    slug: "capture",
    title: "Capture",
    client: "Capture — L'Afrique en un clic",
    category: "identite",
    year: 2025,
    summary: "Identité complète d'une marque de photographie : logo, carte de visite et déclinaisons.",
    description:
      "Capture, c'est « l'Afrique en un clic ». J'ai dessiné un logo qui fusionne l'objectif photo, le viseur et la carte de l'Afrique, puis je l'ai décliné sur la carte de visite, les t-shirts, les casquettes, les kakémonos et les roll-ups. Le jaune et le noir donnent une marque qui se voit de loin, en événement comme sur les réseaux.",
    tags: ["Logo", "Charte graphique", "Carte de visite", "Merchandising"],
    images: [
      i("capture/branding.webp", "Planche de branding Capture : t-shirts, casquettes, kakémonos et roll-ups jaunes et noirs", 2200, 1238),
      i("capture/carte-visite.webp", "Carte de visite Capture jaune posée sur un fond sombre", 1800, 1800),
      i("capture/logo.webp", "Logo Capture : objectif photo contenant la carte de l'Afrique", 1400, 1223),
    ],
    coverBg: "#f4d000",
    featured: true,
  },
  {
    slug: "she-by-la-rochelle",
    title: "Shé",
    client: "Shé by La Rochelle Signature",
    category: "identite",
    year: 2025,
    summary: "Logotype de mode, élégant et affirmé, décliné sur textile.",
    description:
      "Pour Shé by La Rochelle Signature, j'ai dessiné un logotype à fort contraste, aux courbes généreuses, qui fonctionne aussi bien en grand sur une étiquette qu'en broderie sur une casquette.",
    tags: ["Logotype", "Mode", "Textile"],
    images: [
      i("she/logo.webp", "Logotype Shé en brun foncé sur fond rose poudré", 1600, 1600),
      i("she/casquette.webp", "Casquette blanche brodée du logo Shé by La Rochelle", 1201, 1600),
    ],
    coverBg: "#eadfd9",
    featured: true,
  },
  {
    slug: "gloria",
    title: "Gloria",
    client: "Gloria! Art",
    category: "identite",
    year: 2025,
    summary: "Logo manuscrit pour une créatrice, en deux couleurs.",
    description:
      "Un logo calligraphique, doux et vivant, pensé pour une marque personnelle. Il existe en rose et en brun, et se brode sur textile.",
    tags: ["Logo", "Typographie", "Textile"],
    images: [
      i("gloria/logo-rose.webp", "Logo Gloria en lettres manuscrites roses", 1375, 1375),
      i("gloria/casquette.webp", "Casquette blanche avec le logo Gloria brodé", 735, 979),
      i("gloria/logo-brun.webp", "Logo Gloria en brun avec un point rose", 1400, 1400),
    ],
    coverBg: "#ffffff",
    featured: true,
  },
  {
    slug: "bm-study-partners",
    title: "B&M Study Partners",
    client: "B&M Study Partners",
    category: "identite",
    year: 2025,
    summary: "Logo d'une agence d'accompagnement pour les études à l'étranger.",
    description:
      "Une valise, un voyageur et un avion : le logo raconte le départ vers les études à l'étranger. Il est livré en trois versions, claire, sombre et rouge, pour tous les supports.",
    tags: ["Logo", "Éducation", "Déclinaisons"],
    images: [i("bm-study/logo.webp", "Logo B&M Study Partners avec un voyageur, une valise et un avion, et ses trois déclinaisons", 1438, 1438)],
    coverBg: "#f3f3f3",
    featured: true,
  },
  {
    slug: "kama",
    title: "KAMA",
    client: "KAMA",
    category: "identite",
    year: 2025,
    summary: "Logo qui mêle nature et technologie.",
    description:
      "Le K de KAMA devient un arbre dont les branches se terminent en circuits : une marque qui relie agriculture et numérique.",
    tags: ["Logo", "Agritech"],
    images: [i("kama/logo.webp", "Logo KAMA vert, le K formé d'un arbre aux branches en circuits", 1375, 1375)],
    coverBg: "#ffffff",
  },
  {
    slug: "kavi",
    title: "KaVi",
    client: "KaVi — Kamelia & Victoria",
    category: "identite",
    year: 2023,
    summary: "Logo fruité et coloré pour une marque de jus.",
    description:
      "Pour Kamelia & Victoria, un fruit stylisé, une signature manuscrite et des couleurs chaudes donnent une marque gourmande et facile à retenir.",
    tags: ["Logo", "Alimentaire"],
    images: [i("kavi/logo.webp", "Logo rond KaVi Kamelia & Victoria avec un fruit orange et une feuille verte", 1600, 1600)],
    coverBg: "#fff4ea",
  },
  {
    slug: "acmd",
    title: "ACMD",
    client: "Association Caritative la Main de Dieu",
    category: "identite",
    year: 2023,
    summary: "Emblème d'une association caritative.",
    description:
      "Un sceau circulaire, une famille et une croix rayonnante : l'emblème de l'Association Caritative la Main de Dieu exprime l'entraide et la foi.",
    tags: ["Logo", "Association", "Emblème"],
    images: [i("acmd/logo.webp", "Emblème circulaire de l'Association Caritative la Main de Dieu avec une famille colorée", 1400, 1400)],
    coverBg: "#ffffff",
  },
  {
    slug: "fashion-week-djagble",
    title: "Fashion Week Djagblé",
    client: "Fashion Week Djagblé",
    category: "identite",
    year: 2024,
    summary: "Identité d'un événement de mode.",
    description:
      "Une silhouette de mannequin au chapeau, tracée comme un croquis de styliste, entre deux titres en typographie déformée : l'affiche d'un défilé en un seul signe.",
    tags: ["Logo", "Événement", "Mode"],
    images: [i("djagble/logo.webp", "Logo Fashion Week Djagblé en blanc : silhouette de mannequin au chapeau", 1400, 1400)],
    coverBg: "#141414",
  },

  // ── Sites & applications ─────────────────────────────────
  {
    slug: "socline",
    title: "Socline",
    client: "Socline",
    category: "web",
    year: 2026,
    summary: "Application de lavage auto à domicile : réservation, suivi en direct, portefeuille.",
    description:
      "Le client réserve un lavage depuis son téléphone et suit le laveur sur la carte jusqu'à son arrivée. L'application gère aussi l'abonnement, le portefeuille rechargeable, le chat et un espace pour les laveurs et les stations partenaires. Elle existe en version web et Android.",
    tags: ["Application mobile", "Suivi en direct", "Paiement", "Back-office"],
    stack: ["Next.js", "Capacitor", "Android"],
    images: [
      i("socline/reservation.webp", "Socline : réservation d'un lavage avec choix de l'adresse sur la carte", 1280, 800),
      i("socline/suivi.webp", "Socline : suivi de la commande en direct sur la carte de Lomé", 390, 844),
      i("socline/accueil-connecte.webp", "Socline : accueil avec promotion et liste des laveurs", 1280, 577),
      i("socline/connexion.webp", "Socline : écran de connexion par numéro et code PIN", 390, 844),
      i("socline/accueil.webp", "Socline : écran d'accueil orange", 1280, 577),
    ],
    coverBg: "#ff8a00",
    featured: true,
  },
  {
    slug: "miabe-kine",
    title: "Miabé Kiné",
    client: "Cabinet Miabé Kiné",
    category: "web",
    year: 2026,
    summary: "Site d'un cabinet de kinésithérapie : soins, tarifs, prise de rendez-vous.",
    description:
      "Un site chaleureux qui présente les soins, l'équipe, les tarifs et les avis, avec une prise de rendez-vous en un clic sur WhatsApp. Il s'affiche parfaitement sur mobile, là où les patients le consultent.",
    tags: ["Site vitrine", "Santé", "Rendez-vous WhatsApp"],
    stack: ["HTML", "CSS", "JavaScript"],
    images: [
      i("miabe-kine/accueil.webp", "Site Miabé Kiné : page d'accueil « Votre mouvement, notre passion »", 2000, 1250),
      i("miabe-kine/mobile.webp", "Site Miabé Kiné sur mobile", 555, 1200),
    ],
    coverBg: "#3a2416",
    featured: true,
  },
  {
    slug: "sonafi",
    title: "Sommet Sonafi",
    client: "Sommet national de la jeune fille",
    category: "web",
    year: 2026,
    summary: "Gestion des pauses par badge QR pour 500 participantes.",
    description:
      "Chaque participante reçoit un badge avec un QR code unique. Les équipes restauration et vérification le scannent avec leur téléphone à chaque pause : le passage est validé et les doublons sont bloqués. Le gestionnaire suit tout en temps réel et exporte les données.",
    tags: ["Scan QR", "Événementiel", "Temps réel"],
    stack: ["Next.js", "Caméra web", "Base de données"],
    images: [
      i("sonafi/accueil.webp", "Sonafi : choix de l'espace gestionnaire, restauration ou vérification", 647, 1400),
      i("sonafi/admin.webp", "Sonafi : tableau de bord des pauses du jour", 647, 1400),
      i("sonafi/scanner.webp", "Sonafi : scanner de badges QR", 647, 1400),
    ],
    coverBg: "#0d3b8c",
    featured: true,
  },
  {
    slug: "maison-khan",
    title: "Maison Khan",
    client: "Maison Khan",
    category: "web",
    year: 2026,
    summary: "Boutique en ligne de chaussures et accessoires de luxe faits main à Lomé.",
    description:
      "E-commerce complet pour une marque Made in Africa : catalogue, panier, paiement mobile FedaPay, tableau de bord des ventes et gestion des commandes.",
    tags: ["E-commerce", "Paiement FedaPay", "Tableau de bord"],
    stack: ["Next.js", "TypeScript", "Tailwind"],
    images: [
      i("maison-khan/atelier.webp", "Site Maison Khan : section « Dans notre atelier » avec les artisans au travail", 2000, 1250),
      i("maison-khan/logo.webp", "Logo Maison Khan, Made in Africa", 1200, 1200),
      i("maison-khan/sac-raphia.webp", "Sac en raphia de la boutique Maison Khan", 864, 1152),
      i("maison-khan/mule-tessa.webp", "Mule Tessa camel de la boutique Maison Khan", 864, 1152),
    ],
    coverBg: "#efe9e1",
  },
  {
    slug: "dora",
    title: "Dora",
    client: "Dora",
    category: "web",
    year: 2026,
    summary: "Plateforme qui valorise les femmes et les filles engagées au Togo.",
    description:
      "Dora pour Dignité, Optimisme, Résilience, Action. Les activistes y présentent leur parcours social, éducatif, humanitaire ou environnemental. J'ai conçu l'identité et la plateforme.",
    tags: ["Plateforme", "Identité", "Impact social"],
    stack: ["Next.js", "React 19"],
    images: [
      i("dora/accueil.webp", "Plateforme Dora : accueil « Celles qui font avancer le monde méritent d'être connues »", 2000, 1250),
      i("dora/mobile.webp", "Plateforme Dora sur mobile", 555, 1200),
      i("dora/demarche.webp", "Plateforme Dora : la démarche en quatre étapes", 2000, 1250),
      i("dora/logo.webp", "Logo Dora : Distinguer, Oser, Reconnaître, Agir", 1400, 463),
      i("dora/symbole.webp", "Symbole Dora : deux silhouettes et une main", 1074, 1086),
    ],
    coverBg: "#163d2c",
    featured: true,
  },
  {
    slug: "track",
    title: "Track",
    client: "Track",
    category: "web",
    year: 2026,
    summary: "Pointage par GPS : arrivée et départ détectés automatiquement.",
    description:
      "Le manager dessine la zone de travail sur la carte. Quand l'employé y entre, son arrivée est enregistrée ; quand il en sort, son départ aussi. Tableau de bord, historique et rapports pour le manager.",
    tags: ["Géolocalisation", "Présence", "RH"],
    stack: ["Next.js", "Prisma", "Cartes"],
    images: [
      i("track/carte.webp", "Track : carte de la zone de pointage GPS", 1280, 577),
      i("track/zones.webp", "Track : configuration des zones", 1280, 577),
      i("track/employe.webp", "Track : espace employé pour pointer son arrivée", 1280, 577),
    ],
    coverBg: "#0f7a4f",
  },
  {
    slug: "gestion-boutique",
    title: "Gestion Boutique",
    client: "Commerçants",
    category: "web",
    year: 2026,
    summary: "Caisse, stock, reçus et rapport journalier, installable sur téléphone.",
    description:
      "Une application pour les boutiques : le gérant suit ses ventes, son stock et ses employés ; l'employé encaisse et imprime le reçu. Un rapport est généré chaque jour.",
    tags: ["Caisse", "Stock", "Application installable"],
    stack: ["Next.js", "PWA"],
    images: [
      i("gestion-boutique/accueil.webp", "Gestion Boutique : choix entre gérant et employé", 630, 1400),
      i("gestion-boutique/ecran-2.webp", "Gestion Boutique : écran de l'application", 630, 1400),
    ],
    coverBg: "#1f2a44",
  },
  {
    slug: "roue-de-la-chance",
    title: "Roue de la Chance",
    client: "Campagnes promotionnelles",
    category: "web",
    year: 2026,
    summary: "Jeu concours avec roue, écran TV en direct et statistiques.",
    description:
      "Le client saisit son code promo et lance la roue depuis son téléphone. Un écran TV affiche la roue et les derniers gagnants en direct pendant l'événement, et l'organisateur suit les statistiques.",
    tags: ["Jeu concours", "Écran TV", "Marketing"],
    stack: ["Next.js", "Temps réel"],
    images: [
      i("roue/roue.webp", "Roue de la Chance : page de jeu Promotion Printemps 2025", 1280, 577),
      i("roue/ecran-tv.webp", "Roue de la Chance : affichage TV avec les derniers gagnants", 1280, 577),
      i("roue/stats.webp", "Roue de la Chance : statistiques de la campagne", 1280, 577),
    ],
    coverBg: "#1d1f3a",
  },
  {
    slug: "ik-sika-services",
    title: "IK Sika Services",
    client: "IK Sika Services",
    category: "web",
    year: 2026,
    summary: "Livraison rapide dans tout Lomé et location de motos.",
    description:
      "Site et outil de commande pour une entreprise de livraison et de location de motos, réalisés à partir du cahier des charges du client.",
    tags: ["Logistique", "Réservation"],
    stack: ["Next.js", "React"],
    images: [
      i("ik-sika/accueil.webp", "IK Sika Services : page d'accueil « Votre partenaire de confiance pour la livraison et la location »", 2000, 1250),
      i("ik-sika/mobile.webp", "IK Sika Services sur mobile", 555, 1200),
      i("ik-sika/services.webp", "IK Sika Services : services de livraison, location de motos et transport de colis", 2000, 1250),
    ],
    coverBg: "#f3faf3",
  },

  // ── Photographie ─────────────────────────────────────────
  {
    slug: "regards-sur-lome",
    title: "Regards sur Lomé",
    client: "Projet personnel",
    category: "photo",
    year: 2025,
    summary: "Série photo : la ville la nuit, sous la pluie, en fête et en prière.",
    description:
      "Une série prise entre 2022 et 2025 : une station-service de nuit, un bâtiment sous la pluie, une messe, une célébration en plein air, une fleur après l'averse, un enfant et son casque. Je cherche la lumière et le détail que l'on ne regarde plus.",
    tags: ["Photographie", "Rue", "Portrait"],
    images: [
      i("photo/casque.webp", "Enfant avec un casque audio, mangeant un beignet", 1500, 2000),
      i("photo/station-nuit.webp", "Station-service éclairée la nuit, sol mouillé", 2000, 1500),
      i("photo/pluie.webp", "Immeuble en construction sous la pluie, route qui brille", 1500, 2000),
      i("photo/messe.webp", "Église pleine pendant une messe", 2000, 1500),
      i("photo/fleur.webp", "Fleur de frangipanier blanche couverte de gouttes", 1500, 2000),
      i("photo/reflet.webp", "Reflet d'un homme accroupi sur un réservoir doré", 2000, 1500),
      i("photo/celebration.webp", "Célébration en plein air sous les arbres", 2000, 1500),
      i("photo/allee.webp", "Allée verte en contre-plongée inclinée", 1500, 2000),
    ],
    coverBg: "#111111",
    featured: true,
  },
];

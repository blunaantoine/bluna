/*
 * ─────────────────────────────────────────────────────────────
 *  CONTENU DU PORTFOLIO — c'est le seul fichier à modifier
 *  pour ajouter, retirer ou mettre à jour un projet.
 * ─────────────────────────────────────────────────────────────
 *
 *  Pour mettre une vraie image sur un projet :
 *    1. dépose le fichier dans  assets/img/projets/
 *    2. renseigne  image: "assets/img/projets/mon-fichier.jpg"
 *  Sans image, le site dessine une couverture typographique
 *  avec les couleurs indiquées dans  palette: [fond, texte].
 *
 *  Catégories possibles : "identite", "print", "web", "photo", "video"
 */

window.BLUNA = {
  profil: {
    nom: "Antoine ANANI",
    studio: "BLUNA Graphisme",
    ville: "Lomé, Togo",
    whatsapp: "22871998155",
    telephone: "+228 71 99 81 55",
    email: "contact@blunagraphisme.com",
    instagram: { label: "@bluna_k_13", url: "https://www.instagram.com/bluna_k_13" },
    tiktok: { label: "@blunagraphisme", url: "https://www.tiktok.com/@blunagraphisme" },
    github: { label: "blunaantoine", url: "https://github.com/blunaantoine" },
  },

  categories: [
    { id: "tout", label: "Tout" },
    { id: "identite", label: "Identité & logos" },
    { id: "print", label: "Affiches & flyers" },
    { id: "web", label: "Sites & web apps" },
    { id: "photo", label: "Photographie" },
    { id: "video", label: "Vidéo" },
  ],

  services: [
    {
      id: "identite",
      titre: "Identité visuelle",
      texte: "Un logo, une charte et des règles claires pour que votre marque soit reconnue au premier regard.",
      points: ["Création de logo", "Charte graphique", "Refonte d'identité", "Cartes de visite"],
    },
    {
      id: "print",
      titre: "Design graphique",
      texte: "Des visuels qui arrêtent le scroll et remplissent vos événements.",
      points: ["Affiches & flyers", "Visuels réseaux sociaux", "Packaging", "Supports institutionnels"],
    },
    {
      id: "web",
      titre: "Web design & applications",
      texte: "Sites vitrines, boutiques en ligne et outils métier, pensés pour le mobile et livrés en ligne.",
      points: ["Site vitrine", "E-commerce & paiement mobile", "Application de gestion", "Application Android"],
    },
    {
      id: "video",
      titre: "Photo & vidéo",
      texte: "Portraits, contenus de marque et vidéos courtes au format des réseaux.",
      points: ["Portraits", "Vidéos 9:16 de lancement", "Montage", "Contenus Reels / TikTok"],
    },
  ],

  projets: [
    // ── Sites & web apps ───────────────────────────────────
    {
      slug: "maison-khan",
      titre: "Maison Khan",
      categorie: "web",
      annee: 2026,
      resume: "Boutique en ligne de chaussures et accessoires de luxe faits main à Lomé.",
      description:
        "E-commerce complet pour une marque de luxe Made in Africa : catalogue, panier, paiement mobile FedaPay, tableau de bord des ventes et gestion des commandes.",
      tags: ["E-commerce", "Paiement FedaPay", "Tableau de bord"],
      stack: ["Next.js", "TypeScript", "Tailwind"],
      palette: ["#1b1612", "#d9b98a"],
      lien: "",
    },
    {
      slug: "socline",
      titre: "Socline",
      categorie: "web",
      annee: 2026,
      resume: "Application de lavage automobile à domicile, avec portefeuille et laveurs partenaires.",
      description:
        "Le client commande un lavage depuis son téléphone, un laveur indépendant ou une station partenaire se déplace. Portefeuille rechargeable, demandes de retrait, back-office de validation et application Android.",
      tags: ["Application mobile", "Portefeuille", "Back-office"],
      stack: ["Next.js", "Capacitor", "Android"],
      palette: ["#0c2233", "#6fd3ff"],
      lien: "",
    },
    {
      slug: "dora",
      titre: "Dora",
      categorie: "web",
      annee: 2026,
      resume: "Plateforme qui valorise les femmes et les filles engagées au Togo.",
      description:
        "Dora pour Dignité, Optimisme, Résilience, Action. Les activistes y présentent leur parcours social, éducatif, humanitaire ou environnemental, dans le respect de la loi togolaise sur les données personnelles.",
      tags: ["Plateforme", "Profils", "Impact social"],
      stack: ["Next.js", "React 19", "shadcn/ui"],
      palette: ["#2a0f1f", "#f2a7c3"],
      lien: "",
    },
    {
      slug: "sonafi",
      titre: "Sommet Sonafi",
      categorie: "web",
      annee: 2026,
      resume: "Gestion des pauses par badge QR pour le Sommet national de la jeune fille.",
      description:
        "Chaque participante reçoit un badge avec un code QR unique. Les agents le scannent à chaque pause avec la caméra du téléphone : le passage est validé et les doublons sont bloqués.",
      tags: ["Scan QR", "Événementiel", "Temps réel"],
      stack: ["Next.js", "Caméra web", "Base de données"],
      palette: ["#10241c", "#9fe3b8"],
      lien: "",
    },
    {
      slug: "miabe-kine",
      titre: "Miabé Kiné",
      categorie: "web",
      annee: 2026,
      resume: "Site du cabinet de kinésithérapie : rééducation, massages, suivi à domicile.",
      description:
        "Site vitrine moderne et humain pour un cabinet de kinésithérapie à Lomé : présentation des soins, prise de contact rapide et référencement local.",
      tags: ["Site vitrine", "Santé", "SEO local"],
      stack: ["HTML", "CSS", "JavaScript"],
      palette: ["#0f2a2e", "#8ee0d6"],
      lien: "",
    },
    {
      slug: "ik-sika-services",
      titre: "IK Sika Services",
      categorie: "web",
      annee: 2026,
      resume: "Livraison rapide dans tout Lomé et location de motos.",
      description:
        "Site et outil de commande pour une entreprise de livraison et de location de motos, rédigé à partir d'un cahier des charges client.",
      tags: ["Logistique", "Réservation", "Cahier des charges"],
      stack: ["Next.js", "React"],
      palette: ["#2b1a05", "#ffb547"],
      lien: "",
    },
    {
      slug: "gestion-boutique",
      titre: "Gestion Boutique",
      categorie: "web",
      annee: 2026,
      resume: "Caisse, stock, reçus et rapport journalier pour les commerçants.",
      description:
        "Application de gestion pour boutique : ventes, stock, impression de reçus et rapport journalier automatique.",
      tags: ["Caisse", "Stock", "Rapports"],
      stack: ["Next.js", "Base de données"],
      palette: ["#191c24", "#c7d0e6"],
      lien: "",
    },
    {
      slug: "track",
      titre: "Track",
      categorie: "web",
      annee: 2026,
      resume: "Pointage géolocalisé : arrivée et sortie détectées automatiquement par zone.",
      description:
        "Outil de suivi de présence : l'application détecte l'entrée et la sortie d'une zone définie et enregistre l'arrivée de chaque agent.",
      tags: ["Géolocalisation", "Présence", "RH"],
      stack: ["Next.js", "Prisma"],
      palette: ["#141a14", "#c8f07a"],
      lien: "",
    },

    // ── Identité & logos ───────────────────────────────────
    {
      slug: "she",
      titre: "She",
      categorie: "identite",
      annee: 2025,
      resume: "Logo et identité d'une marque féminine.",
      description: "Création de logotype et déclinaisons pour une marque féminine.",
      tags: ["Logo", "Identité"],
      palette: ["#f3e6df", "#5b2a3a"],
    },
    {
      slug: "bm-study",
      titre: "B&M Study",
      categorie: "identite",
      annee: 2025,
      resume: "Identité visuelle d'un service d'accompagnement scolaire.",
      description: "Logo et visuels de communication pour B&M Study.",
      tags: ["Logo", "Éducation"],
      palette: ["#0e2240", "#f5c542"],
    },
    {
      slug: "tech-violet",
      titre: "Tech Minimalist",
      categorie: "identite",
      annee: 2025,
      resume: "Logo minimaliste pour une marque tech.",
      description: "Recherche de logotype minimaliste aux tons violets pour une marque technologique.",
      tags: ["Logo", "Tech"],
      palette: ["#1d1233", "#b79cff"],
    },
    {
      slug: "gloria-art",
      titre: "Gloria! Art",
      categorie: "identite",
      annee: 2025,
      resume: "Typographie et identité pour une artiste.",
      description: "Travail typographique et logo pour Gloria! Art.",
      tags: ["Typographie", "Logo"],
      palette: ["#f1ede6", "#1a1a1a"],
    },

    // ── Affiches & flyers ──────────────────────────────────
    {
      slug: "journee-migrants",
      titre: "Journée internationale des migrants",
      categorie: "print",
      annee: 2024,
      resume: "Affiche événementielle institutionnelle.",
      description: "Affiche pour la Journée internationale des migrants.",
      tags: ["Affiche", "Institutionnel"],
      palette: ["#0d3b66", "#faf0ca"],
    },
    {
      slug: "flwo-party",
      titre: "FLWO Party",
      categorie: "print",
      annee: 2024,
      resume: "Flyer de soirée.",
      description: "Flyer pour la soirée FLWO Party, décliné pour Instagram et WhatsApp.",
      tags: ["Flyer", "Événement"],
      palette: ["#12001f", "#ff3ea5"],
    },
    {
      slug: "saint-valentin-fitness",
      titre: "Promo Saint-Valentin",
      categorie: "print",
      annee: 2024,
      resume: "Publicité pour une salle de sport.",
      description: "Visuel promotionnel Saint-Valentin pour une salle de fitness.",
      tags: ["Publicité", "Réseaux sociaux"],
      palette: ["#3a0610", "#ff8a9a"],
    },
    {
      slug: "excellente-rentree",
      titre: "Excellente rentrée",
      categorie: "print",
      annee: 2024,
      resume: "Communication éducative de rentrée scolaire.",
      description: "Campagne visuelle de rentrée scolaire.",
      tags: ["Affiche", "Éducation"],
      palette: ["#fff4d6", "#1f4e3d"],
    },
    {
      slug: "fibroid-tea",
      titre: "Fibroid Tea",
      categorie: "print",
      annee: 2024,
      resume: "Design produit et packaging d'une tisane.",
      description: "Packaging et visuels produit pour Fibroid Tea.",
      tags: ["Packaging", "Produit"],
      palette: ["#24331c", "#e3d6a6"],
    },
    {
      slug: "afrique-en-un-clic",
      titre: "L'Afrique en un clic",
      categorie: "print",
      annee: 2025,
      resume: "Présentation et supports visuels de projet.",
      description: "Mise en page d'une présentation de projet, prête à projeter et à partager.",
      tags: ["Présentation", "Mise en page"],
      palette: ["#2e1a0b", "#f0a050"],
    },

    // ── Photo & vidéo ──────────────────────────────────────
    {
      slug: "portraits",
      titre: "Portraits",
      categorie: "photo",
      annee: 2025,
      resume: "Série de portraits en lumière naturelle, Lomé.",
      description: "Série de portraits réalisés entre 2022 et 2025.",
      tags: ["Portrait", "Lumière naturelle"],
      palette: ["#1c1c1c", "#e8e8e8"],
    },
    {
      slug: "socline-lancement",
      titre: "Lancement Socline",
      categorie: "video",
      annee: 2026,
      resume: "Vidéo verticale 9:16 pour le lancement de l'application Socline.",
      description: "Vidéo de lancement au format Reels / TikTok, montée pour annoncer l'application Socline.",
      tags: ["Vidéo 9:16", "Lancement"],
      palette: ["#06131d", "#6fd3ff"],
    },
  ],
};

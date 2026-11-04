# BLUNA Graphisme — portfolio & messages clients

Application web d'Antoine ANANI (BLUNA Graphisme, Lomé) : portfolio animé, fiches projet avec galerie,
formulaire de contact relié aux projets, et espace admin avec notifications.

## Ce que fait l'application

**Côté client**
- Accueil animé : collage de réalisations qui réagit à la souris, bandeau défilant, liste des projets avec aperçu au survol.
- Page **Travaux** filtrable (Identité & logos, Sites & applications, Photographie).
- Fiche projet : galerie, visionneuse plein écran (flèches, clavier, glisser sur mobile), projet suivant.
- Bouton **« Un projet similaire ? »** : ouvre le contact avec le projet joint. Le message arrive chez Antoine avec ce projet.

**Côté Antoine (`/admin`)**
- **Messages** : boîte de réception actualisée toutes les 15 s, alerte sonore, notification du navigateur, compteur dans l'onglet.
  Chaque message affiche le projet de référence et propose « Répondre sur WhatsApp » avec un message pré-rempli.
- **Projets** : publier ou masquer, mettre à la une, réordonner, modifier les textes, **ajouter des images** (redimensionnées automatiquement), créer ou supprimer un projet.
- Statistiques : vues par projet et nombre de demandes « similaire ».
- Notifications hors du site, au choix : **Telegram** (instantané sur le téléphone) et/ou **e-mail**.

## Installation

```bash
npm install
cp .env.example .env      # puis remplissez ADMIN_PASSWORD et SESSION_SECRET
npm run setup             # crée la base et ajoute les 18 projets
npm run dev               # http://localhost:3000
```

## Mise en production (VPS)

```bash
npm install
npm run setup
npm run build
PORT=3000 npm start
```

Gardez le processus actif avec `pm2` ou un service systemd, derrière Caddy ou Nginx pour le HTTPS.
La base (`dev.db`) et les images ajoutées depuis l'admin (`data/uploads`) sont des fichiers : sauvegardez-les.

> Vercel ou Netlify ne gardent pas les fichiers écrits par l'application. Pour y héberger le site,
> il faut une base externe (Turso, Neon…) et un stockage d'images externe. Un petit VPS est plus simple.

## Notifications

Dans `.env` :
- **Telegram** : `TELEGRAM_BOT_TOKEN` et `TELEGRAM_CHAT_ID` (voir les explications dans `.env.example`).
- **E-mail** : `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL`. Avec Gmail, utilisez un « mot de passe d'application ».

Sans ces réglages, les messages restent enregistrés et visibles dans `/admin`.

## Contenu

- Les 18 projets de départ sont dans `src/content/projects.ts`. `npm run db:seed` ne remplace jamais un projet modifié dans l'admin.
- Les images d'origine viennent du dossier Drive « Portfolio - Antoine ANANI » et de vraies captures des applications.

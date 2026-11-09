# OQUI — portfolio, messages clients et factures

Application web d'Antoine ANANI (OQUI, Lomé — oquitogo.com) : portfolio animé, fiches projet avec galerie,
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

**Factures et paiement (`/admin/factures`)**
- Créez un client et une facture ligne par ligne (quantité, prix, remise, échéance, acompte autorisé ou non).
- Envoyez sur WhatsApp, en un clic, le **lien de la facture** ou le **lien de l'espace client** (toutes ses factures).
- Le client ouvre le lien, choisit sa facture, touche « Payer maintenant » : le panneau de paiement s'ouvre.
  - **Paiement en ligne FedaPay** : T-Money, Flooz, Visa, Mastercard. La facture passe en « Payée » toute seule.
  - **Transfert manuel** : le client envoie l'argent à vos numéros et ajoute la capture d'écran du paiement ; vous la recevez (Telegram / e-mail) et validez d'un clic.
- **Lecture automatique des captures (IA Claude)** : montant, référence, date, opérateur et numéros sont lus sur la capture et comparés à la facture (montant, votre numéro, référence déjà utilisée = capture réutilisée). Verdict « Conforme », « À vérifier » ou « Suspect » dans l'admin et dans l'alerte. La référence et la date lues sont reportées sur la facture. Vous validez toujours vous-même. Clé `ANTHROPIC_API_KEY` dans `.env`.
- **Rapports** (`/admin/rapports`) : par mois ou par année — facturé, encaissé, reste à encaisser, taux de recouvrement, graphique mensuel, répartition par moyen de paiement, meilleurs clients, prestations, liste des paiements et des impayés. Export Excel (CSV) et impression PDF.
- Vous êtes prévenu (Telegram / e-mail) à chaque paiement. Encaissement manuel possible (espèces, virement).
- La facture se télécharge en PDF depuis le téléphone du client.

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

## Activer le paiement en ligne (FedaPay)

1. Créez un compte marchand sur fedapay.com et faites valider votre compte (pièce d'identité, numéro de retrait).
2. Dans `.env` : `FEDAPAY_SECRET_KEY` (commencez par la clé `sk_sandbox_...` et `FEDAPAY_ENV="sandbox"`).
3. Dans FedaPay > Webhooks, ajoutez `https://votre-domaine/api/webhooks/fedapay`.
4. Faites un paiement test, puis passez à la clé live et `FEDAPAY_ENV="live"`.

Sans clé FedaPay, seul le transfert manuel est proposé (numéros `PAY_TMONEY_NUMBER` et `PAY_FLOOZ_NUMBER`).
Le statut d'un paiement est toujours revérifié auprès de FedaPay : ni un faux lien de retour, ni un faux webhook ne peuvent valider une facture.

## Contenu

- Les 18 projets de départ sont dans `src/content/projects.ts`. `npm run db:seed` ne remplace jamais un projet modifié dans l'admin.
- Les images d'origine viennent du dossier Drive « Portfolio - Antoine ANANI » et de vraies captures des applications.

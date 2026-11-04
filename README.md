# BLUNA Graphisme — portfolio

Portfolio d'Antoine ANANI (web design, identité visuelle, design graphique, photo et vidéo). Lomé, Togo.

Site statique, sans étape de build : HTML, CSS et JavaScript.

## Modifier le contenu

Tout le contenu (projets, services, contacts) se trouve dans **`assets/js/data.js`**.

- **Ajouter un projet** : copier un bloc `{ slug: ..., titre: ... }` dans `projets` et l'adapter.
- **Mettre une vraie image** : déposer le fichier dans `assets/img/projets/` puis renseigner
  `image: "assets/img/projets/nom-du-fichier.jpg"`. Sans image, le site dessine une couverture
  avec les couleurs de `palette: [fond, texte]`.
- **Lien vers un site en ligne** : renseigner `lien: "https://..."` ; le bouton de la fiche projet devient « Voir le site en ligne ».
- Chaque projet a un lien direct partageable : `https://.../#projet-<slug>`.

## Tester en local

```bash
python3 -m http.server 8080
```

puis ouvrir http://localhost:8080.

## Mettre en ligne

GitHub → Settings → Pages → *Deploy from a branch* → `main` / `(root)`.

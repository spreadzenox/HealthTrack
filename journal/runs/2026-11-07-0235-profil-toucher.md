# 07/11 02:35 — Nutrition : provenance au toucher (TESTEUR-4d)

Type : 🎨 run de code (retours du premier testeur iPhone du 06/11, point (4)).

## Constat au démarrage
- main `788cca8` (#767). Aucune PR « [Auto] » ouverte (seule #51, cursor/*, non touchée).

## Fait
- `components/BodyProfileCard.jsx` : composant `Sourced` ; chaque valeur qui a une provenance (poids « Withings, 05/11 »
  ou « saisi le… », taille Withings, composition Withings, niveau d'activité « ≈ N pas/jour sur N jours » ou « par
  défaut ») est un bouton souligné en pointillés ; la provenance n'apparaît qu'au toucher (`aria-expanded`).
- « À compléter pour ajuster vos repères : … » est un bouton qui ouvre le formulaire dans la même carte (problème et
  solution au même endroit) ; le lien Withings reste à côté.
- Formulaire : l'explication du niveau d'activité n'apparaît qu'après un choix ; « (modérément actif sans montre) »
  retiré.
- `pages/Nutrition.css` : cibles de 44 px (inline-flex, min-height), sans grossir le texte.
- Tests (`Nutrition.test.jsx`) : provenance au toucher, « À compléter » ouvre le formulaire, explication après un
  choix. Nouveautés : `2026-11-07-0235-profil-toucher.json`.

## Vérifications
- `npm run test` : 3 217 verts. `npm run lint` : 0 erreur. `npm run build` OK.
- `npm run visual -- --play --routes=/nutrition` (démo, clair et sombre) et `--empty --light` : relus. Premier passage
  signalait « CIBLE < 44 px » sur les nouveaux boutons : corrigé. Lignes du profil un peu plus aérées (44 px chacune).

## Suite
- TESTEUR-3c (interrupteur dans un interrupteur), séparateur « · » de l'en-tête d'Analyses avec TESTEUR-3b,
  TESTEUR-1b en run idées (08:35).

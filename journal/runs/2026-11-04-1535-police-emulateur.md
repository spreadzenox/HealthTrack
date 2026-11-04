# 04/11 15:35 — Grande police sur l'émulateur (FONT-SCALE-2)

Type : 🔧 CI (rien ne change dans l'app).

## Constat au démarrage
- main vert (`a355cd8`, #688 : Build & Release, Tests, émulateur, Play — AAB) ; seule PR ouverte : #51 (cursor/*, non
  touchée) ; aucune autre exécution en cours.
- Priorités du prompt en attente du propriétaire (P42 Alpha, P37, P43, P44, P45). Suite directe du run précédent :
  FONT-SCALE-2.

## Fait
- `native-sweep/check.mjs` (job « Méthodes natives sous Android 12L (API 32) ») : après le parcours des méthodes
  natives, une seconde phase règle `settings put system font_scale` à 1,0 puis 1,3, relance l'app et mesure sur
  l'Accueil, les Sources et les Paramètres : taille calculée et hauteur rendue du titre et d'un paragraphe,
  débordement de la page, éléments hors écran (hors listes défilantes), boutons au texte coupé. Captures
  `police-1.0-*` / `police-1.3-*` dans l'artefact `native-sweep-api32`, tableau dans le résumé du job.
- Mesure seulement : « la WebView ne suit pas la police » ou un débordement donnent un `::warning::`, jamais un échec ;
  la police est remise à 1,0 à la fin.
- Expression de mesure validée en local (Chromium, app construite, `html { font-size: 130% }` comme `--font-scale`) :
  titres 19,2 → 25 px, lignes ×1,28, aucun débordement sur les trois écrans.

## Vérifications
- `node --check`, `npm run test` (3 007 verts), `npm run lint` (0 erreur) ; tous les checks de #689 verts.
- **Résultat sur l'émulateur (API 32, WebView 120)** : la WebView suit la police du système, hauteur des lignes ×1,30
  à `font_scale` 1,3 (titres 19,2 → 25 px, texte 14,4 → 18,7 px) ; aucun débordement ni bouton coupé sur l'Accueil,
  les Sources et les Paramètres. FONT-SCALE-1 corrigeait donc un vrai cas des testeurs.

## Suite
- Passer `--font-scale=1.3` dans l'audit de TEST-ALPHA-1 et 2 (le job API 32 le refait à chaque version).
- TEST-ALPHA-1 (07–08/11, clic P42) ; P37, P43, P44, P45 en attente du propriétaire.

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
- `node --check`, `npm run test`, `npm run lint` ; le résultat sur l'émulateur se lit au résumé du job de la PR.

## Suite
- Lire le tableau « Grande taille de police » du job API 32 : si la WebView ne suit pas (×1,0), le réglage du
  téléphone n'agrandit pas l'app et FONT-SCALE-1 n'a servi qu'à la marge ; sinon passer `--font-scale=1.3` dans
  l'audit de TEST-ALPHA-1 et 2.
- TEST-ALPHA-1 (07–08/11, clic P42) ; P37, P43, P44, P45 en attente du propriétaire.

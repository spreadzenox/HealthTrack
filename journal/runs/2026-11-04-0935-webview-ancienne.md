# Run du 04/11/2026 09:35 (Paris, CET) — WebView trop ancienne : un message plutôt qu'un écran blanc (WEBVIEW-MIN)

**Type** : 🔧 code (fiabilité de la version Play pour les testeurs)

## Constat au démarrage
- Main à `f2abb5b`. Deux PR « [Auto] » ouvertes, vertes, dont le merge avait été refusé à leur session :
  **#679** (A11Y-3, à jour sur main) mergée tout de suite (`af87468`) ; **#680** (idées, journal seul) remise à jour
  sur main (conflit du tableau du README résolu en gardant les deux lignes), checks requis verts, mergée (`893f56a`).
- Priorités du prompt : livrées ou en attente du propriétaire (P37, P42 vers le 07–08/11, P43, P44, P45).
- Les testeurs arrivent : l'invitation annonce « Android 8 ou plus récent » (minSdk 26), mais aucun job ne teste en
  dessous d'Android 14.

## Constat technique
- Capacitor 8 n'exige par défaut que la WebView 60 et, **sans `server.errorPath`, charge l'app quand même** (simple
  ligne de log). Mesuré sur le build : syntaxe ES2020 seulement (`es-check es2020` OK), mais `Object.hasOwn`
  (Chrome 93) dans le stockage et le worker d'analyse, `.at(-1)` (Chrome 92). Une WebView 60 à 92 (Android 8–9 aux
  mises à jour coupées) donnait donc un écran blanc, sans rien dire.

## Fait (TDD : `src/webviewMinimum.test.js` rouge puis vert)
- `capacitor.config.json` : `android.minWebViewVersion: 93`, `server.errorPath: "webview-ancienne.html"`.
- `public/webview-ancienne.html` : ES5, CSS ancien, rien de l'extérieur, icône « H nuit » en SVG, clair et sombre.
  WebView ancienne → « Mettez à jour Android System WebView » + « Ouvrir le Play Store » + encart Chrome pour
  Android ≤ 9. WebView récente (la page sert aussi aux erreurs de chargement de la page principale) → « Halcya ne
  s'est pas ouverte » + « Réessayer ».
- Test-garde : chaque fonction récente non transpilée (table `Object.hasOwn` 93, `.at` 92, `structuredClone` 98,
  `findLast` 97, `toSorted` 110, `groupBy` 117…) trouvée dans `src/` doit être ≤ au minimum déclaré ; page ES5,
  sans ressource externe, lien Play Store, textes sans « slop ».
- CI : job **« WebView trop ancienne (API 28) »** dans le workflow émulateur (image `default` d'Android 9, WebView
  d'origine) : l'app ne plante pas et, si la WebView < 93, la page est lue à l'écran (uiautomator) ; capture publiée.
- Nouveautés « Un message plutôt qu'un écran blanc » (play, sideload).

## Vérifications
- `npm run test` 3001 verts ; `npm run lint` 0 erreur ; `npm run build` (page copiée dans `dist/`) ; captures de la
  page (Chromium, `Object.hasOwn` retiré ou non, clair et sombre) relues ; `npm run visual -- --play`.

## Suite
- Lire le résumé du job API 28 sur la PR (version de la WebView de l'image, page affichée).
- TEST-ALPHA-1 (07–08/11, clic P42) ; P37, P43, P44, P45 en attente du propriétaire.

# Run du 04/11/2026 09:35 (Paris, CET) — WebView trop ancienne (WEBVIEW-MIN) et plantage sous Android ≤ 12 (PLUGIN-API)

**Type** : 🚑 code (fiabilité de la version Play pour les testeurs)

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

## 🚑 Trouvé par le nouveau job API 28 : plantage à l'ouverture sous Android 8 à 12
- Premier passage du job (WebView 66 de l'image) : processus mort, `FATAL EXCEPTION` :
  `NoClassDefFoundError: Landroid/companion/AssociationInfo;` dans `Plugin.initializeActivityLaunchers` →
  `Class.getDeclaredMethods`. Capacitor lit toutes les méthodes de chaque plugin au démarrage ; la méthode privée
  `CompanionPlugin.finish(PluginCall, AssociationInfo, String)` charge un type d'Android 13 (API 33).
- **Présent depuis le 15/10 (#162, « synchro dès qu'elle se reconnecte »)**, donc dans toutes les versions depuis, dont
  l'**Alpha 100721** des testeurs. Invisible jusque-là : téléphone du propriétaire sous Android 16, émulateurs 34–36.
- Corrigé (TDD, `src/pluginSignatures.test.js` rouge sur cette seule méthode, puis vert) : `finish(PluginCall, int,
  String)`. Job API 28 relancé : **0 plantage, processus vivant, page « Mettez à jour Android System WebView » lue à
  l'écran** (WebView 66 < 93). Job rendu bloquant (borné à 25 min ; un premier passage avait tourné 40 min sans
  journal, annulé, commandes adb maintenant sous `timeout`).
- Résumé : alerte en tête (P42 avancé, n'inviter que des testeurs Android 13+ d'ici l'Alpha corrigée).
- Nouveautés « L'app s'ouvre de nouveau sous Android 12 et avant ».
- Reste non couvert (PLUGIN-API-2) : le code natif appelé depuis le JS sur Android 9–12 (le JS ne tourne pas avec la
  WebView 66 de l'image).

## Trouvé en route
- Le banc a affiché le bandeau « Nouveautés » (entrée créée pendant qu'il tournait) : **« Voir » 49×28 et « × » 32×32**,
  sous les 44 px, sur chaque page. A11Y-1 ne l'avait pas vu (bandeau masqué par le banc), alors que chaque mise à jour
  le montre aux utilisateurs. Corrigé (TDD, `tapTargets.test.js`) : les deux à `--tap-min` ; capture
  `--play --routes=/ --whats-new --dark` relue, 0 avertissement. Nouveautés « Bandeau des nouveautés plus facile à toucher ».

## Vérifications
- `npm run test` 3001 verts ; `npm run lint` 0 erreur ; `npm run build` (page copiée dans `dist/`) ; captures de la
  page (Chromium, `Object.hasOwn` retiré ou non, clair et sombre) relues ; `npm run visual -- --play`.

## Suite
- **P42 au plus tôt** (Alpha avec la correction), puis lever la restriction Android 13+ dans l'alerte du résumé.
- PLUGIN-API-2 (job API 30/31 avec une WebView récente).
- TEST-ALPHA-1 (07–08/11, clic P42) ; P37, P43, P44, P45 en attente du propriétaire.

## Après le merge
- #681 mergée (`1a81e11`) après un dernier passage vert de tous les checks (API 28 compris ; un passage avait échoué
  parce que l'écran avait été lu trop tôt, d'où plusieurs lectures sur 40 s). Tests, Build & Release et Play — AAB
  verts sur main : release **v485** (APK 34 536 919 octets), **versionCode 100765 envoyé en test interne**. À
  envoyer sur Alpha par le propriétaire (P42 avancé, alerte en tête du résumé).

# Run 23/11 10:30 — #1214 mergée, POLISH-SIM-148 (cadeau du jour sur l'îlot)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main c970b9b (#1214), release
**v884** (APK 35 672 901 octets, 09:35 UTC) · **TestFlight** : 1268.1268 validée pour « Testeurs Halcya » (relevé de
07:33 UTC), 1244.1244 attachée à la version 893 · **Parité** : 70 % (33/47)

## État de départ
- main vert sur b19d4f8 (Tests, émulateur Galaxy A56). Rien de neuf du propriétaire dans le prompt.
- PR de la routine ouverte : **#1214** (run de 09:30, POLISH-SIM-145, 147, 149, prête), tous ses checks verts, build
  iPhone compris (26 min). #51 (`cursor/*`) pas touchée.

## #1214
- Captures iPhone (`captures/pr-1214`) relues : Objectifs › Votre bien-être (abonné : galet Activité lilas clair,
  plus de galet noir ; non abonné : aperçu flouté), Tendances › Jour (veille : « vous avez noté 4,2 »), Ma journée ;
  `js-errors.txt` vide, console sans erreur.
- Branche à jour sur main. **Mergée en squash (c970b9b)**, titre et message écrits à la main, sans ligne
  d'attribution. Build & Release **v884** (35 672 901 octets), Play — AAB vert ; Tests et émulateur de main en cours
  à l'écriture de ce compte rendu.

## POLISH-SIM-148
- Reproduit avec l'outil des personas (`--day=3 --equipment=watch --goals=gut`) : la bulle dorée était fixée à
  50 % / 80 % du cadre, le créneau de devant de l'orbite, donc sur la bulle qui y passe (« Bien-être » au jour 1).
- Correctif : `GIFT_SPOT` dans `bubbles.js` (x 0,07, y 0,78 : coin bas gauche, au-dessus de l'étiquette de l'îlot),
  appliqué en style par `CompanionHome.jsx` ; la règle CSS ne fixe plus `left` / `top`.
- Test (`bubbles.test.js`, échoue avant le correctif) : pour 1 à 9 bulles et toute rotation de l'orbite (pas de 0,05
  rad), aucune bulle ne touche la bulle cadeau ; elle reste dans le cadre, au-dessus de l'étiquette.
- Captures avant / après sur la scène 3D (jour 3) : la bulle cadeau est dans le coin, à 9 px de l'étiquette « Pilou
  est tranquille », Bien-être dégagée. Accueil de démo (jour 76, sans cadeau) inchangé.
- Aucun correctif de `iphone/patches/` ne touche ces fichiers : l'iPhone reçoit le changement par le code commun.

## Vérifications
`npm run test` : 4 396 tests verts ; `npm run lint` : 0 erreur ; `npm run build` vert ; `npm run visual
--routes=/,/ma-journee` : ok, aucune erreur JS (un avertissement WebGL habituel).

## Suite proposée
1. Run suivant : checks de la PR, captures iPhone de l'Accueil (le build iPhone ne montre pas la première semaine :
   regarder au moins l'Accueil et `js-errors.txt`), merge.
2. POLISH-SIM-146 et 150 après le banc ; PERSONAS-OUTIL-2 (analyse factice toujours « carbonara »).
3. FUSION-3 : 02 (mode captures), 27 (décision), 01 en dernier.
4. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

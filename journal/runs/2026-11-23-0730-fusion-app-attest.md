# Run 23/11 07:30 — #1211 mergée ; FUSION-3 : correctifs 38 et 49 fondus

**Type** : 🔧 run de code (code partagé, rien de visible sur Android) · **Contrôle d'intégrité** : empreinte conforme
(dd430fbd…) · **Android** : main 8587962 (#1211), release **v882** (APK 35,7 Mo) · **TestFlight** : 1268.1268 chez
« Testeurs Halcya », 1244.1244 attachée à la version 893 · **Parité** : 70 % (33/47), 3 correctifs iPhone restent

## Contexte
- main vert sur 5cbcfc1 (Tests, Build & Release, émulateur A56, Play — AAB, relevé TestFlight).
- PR de la routine ouverte : **#1211** (runs de 05:30 et 06:30, prête), tous ses checks verts, dont « Build iOS
  (simulateur) et captures » (35 min) et les émulateurs Android. Branche à jour sur main. #51 (`cursor/*`) pas touchée.

## Fait
1. **#1211 mergée** (squash, 8587962) après lecture des captures iPhone (`captures/pr-1211`) : Nouveautés (notes
   récentes, rien d'avant le 30/10), Premium et sa suite (Silver / Gold, 29,99 €/an et 4,99 €/mois lus dans StoreKit,
   « Annulable à tout moment dans l’App Store »). Tests natifs StoreKit 2 de la build verts (`achat-essai.txt`).
   Build & Release : **v882**, 35 671 721 octets.
2. **Correctif 38 fondu** : `appAttest.js`, `appAttest.test.js` et `aiRelay.appattest.test.js` passent de
   `iphone/overlay/` au code commun (`app/src/ios/`, `app/src/services/`) ; `aiRelay.js` ajoute l'assertion App Attest
   (`iosAttestHeaders`) sur le corps exact, pour l'analyse (repas, selles) et « Votre avis ». Hors iPhone,
   `iosAttestHeaders` rend `{}` : nouveau test `aiRelay.attest-android.test.js` (un seul appel au relais, aucun en-tête
   `X-AppAttest-*`, même corps JSON).
3. **Correctif 49 fondu** : `persona-browse.mjs --store=appstore` (variante appstore, écran 390 × 844 de l'iPhone 12).
4. `iphone/patches/38-…` et `49-…` supprimés ; une seule PR, donc un seul build iPhone.

## Vérifications
- `npm run test` (app) : 404 fichiers verts (3 sautés), 4 390 tests ; eslint propre sur les fichiers touchés.
- `iphone/scripts/upstream.sh` : v1273 (HEAD), 3 correctifs appliqués ; Vitest de `upstream/app` sur `aiRelay`,
  `appAttest` et `feedback` : 35 tests verts.
- Pas de `npm run visual` : aucun écran Android ne change.

## Suite
1. Run suivant : checks de la PR (build iPhone), captures iPhone (analyse d'un repas, Réglages › Votre avis : rien ne
   doit changer à l'écran), merge.
2. FUSION-3 : 02 (mode captures), 27 attend une décision (lien « Envoyer un avis » vers l'ancien dépôt iOS, FUSION-4),
   01 (variante appstore) en dernier.
3. Vérifier la fin de l'examen bêta de 1268.1268 et le départ de la build du soir.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

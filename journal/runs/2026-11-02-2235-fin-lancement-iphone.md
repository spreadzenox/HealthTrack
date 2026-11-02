# Run du 02/11/2026 22:35 (Paris, CET) — fin de la période de lancement sur iPhone (06/11)

**Type** : 🔧 code (relais + app partagée avec l'iPhone).

## Constat au démarrage
- Main à `bd7d5ac` (#637) ; « Tests », « Build & Release », « Relais — déploiement », « Play — AAB » (test interne),
  « Play — abonnements », émulateur : verts. Aucune PR « [Auto] » ouverte (#51 Cursor non touchée).
- **Bilan du déploiement du relais vérifié** (appel direct au relais public, les résumés d'étape ne sont pas lisibles
  par l'API) : `/v1/subscription/verify` sans achat → `premium: true, source: launch, tier: gold,
  launchUntil: 2026-11-27T23:00:00.000Z` ; `POST /v1/attest/challenge` (iPhone) → 200. Le compte rendu du 02/11
  (until au 27/11, App Attest en observation) est donc en production.
- **Alpha (P40)** : toujours à faire par le propriétaire ; la session précédente s'est vu refuser l'envoi sur Alpha,
  ce run ne le retente pas.
- Demandes reprises : décision du 02/11 au soir (fin de période iPhone), I6-RELAIS-5e (message à la routine iOS),
  et, de `HealthTrack-iOS/journal/DEMANDES.md`, la ligne du 1/11 « transmettre `renewalInfo` » (correctif iOS 37).

## Fait
1. **Relais** : champ `iosUntil` = `2026-11-06T23:00:00Z` dans `launch-period.json` (+ `LAUNCH_PREMIUM_IOS_UNTIL`) ;
   `launchUntilFor(période, now, plateforme)` : iPhone = la plus tôt des deux dates, Android = période play ;
   `isIosRequest` (`X-Platform: ios`, `no_plugin` sans en-tête, clé App Attest) appliqué à `/v1/subscription/verify`,
   `/v1/credits` et l'analyse ; cache des droits séparé par plateforme (des droits vus côté play ne servent jamais à
   l'iPhone). Un en-tête falsifié donne au plus la période play ; plafonds inchangés. Bilan du déploiement : nouvelle
   ligne « iPhone sans achat » (aussi écrite dans le journal du workflow, pour être lisible par les runs).
2. **App (code partagé)** : `platformHeaders()` dans `aiRelay.js` → `X-Platform: ios` seulement si `VITE_STORE=appstore`
   (rien sur Android) ; `entitlement.js` l'envoie aussi ; `renewalInfo` transmis au relais (repris du correctif iOS 37).
   Aucun changement visible sur Android : pas de note de Nouveautés.
3. **Captures** (nouvelle option `--store=appstore`, `--ios-launch=ended` du relais factice) : app iPhone pendant la
   période → « Gold offert pendant le test » ; après → « Comprendre vos bons et mauvais jours », Silver / Gold,
   Annuel 29,99 € / Mensuel 4,99 € : l'écran d'achat s'affiche.
4. `journal/POUR-IOS.md` créé : fin de période iPhone (date, réponse du relais, test TestFlight, correctif 37 à
   retirer) et I6-RELAIS-5e (App Attest en observation). Correctifs iOS vérifiés par `git apply --check` : seul le 37
   ne s'applique plus (repris), le 38 (même fichier `aiRelay.js`) s'applique toujours.

## Vérifications
- Relais : 194/194 (dont `launch-period`, `launch-ios.test.js` : 6 tests). App : 2 887 tests verts ; build OK ;
  lint 7 erreurs préexistantes ; `npm run visual` (démo, clair) et `--play` sans erreur JS ; captures iPhone lues.

## Suite
- Après le merge : lire le journal de « Relais — déploiement » (ligne « iPhone sans achat … jusqu'au
  2026-11-06T23:00:00.000Z ») ; le 07/11, revérifier `premium=false` pour l'iPhone et `2026-11-27` pour Android.
- P40 (propriétaire) puis « 👉 Version candidate prête » ; `until` à recaler si Alpha n'est pas en ligne le 03/11.
- Textes : LISTING-2, P26 (médiation), P2 (guichet unique), P32.

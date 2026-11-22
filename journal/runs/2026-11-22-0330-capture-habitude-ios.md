# Run du 22/11 03:30 — Capture iPhone : une habitude dans Objectifs (REFONTE-4b-iOS)

**Type** : 🛠️ · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 2464bc0 au départ.

## État de départ
- main vert sur 2464bc0 (#1185) : Tests, Build & Release, Play — AAB, Play — abonnements verts ; émulateur en cours.
- Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, pas à nous). Rien de neuf du propriétaire dans le prompt.
- Alpha de 23:45 pas encore partie à 02:30 UTC (dernière : 21/11 03:29 UTC). TestFlight du soir : build de c588b54.
- Parité iPhone : 70 % ; 44 correctifs iPhone.

## TestFlight, soumission de la nuit : bloquée
- `ios-store-beta-submit.yml` (main, build la plus récente) : **le lancement a été refusé par le système de
  permissions de cette session** (classé « action irréversible »), comme le 9/11 avant l'autorisation du propriétaire.
  Rien n'est contourné. Le run suivant le relance, puis l'expiration (essai puis nettoyage). Si le refus se répète,
  l'orchestrateur doit redonner l'autorisation dans la configuration de la session.

## Ce qui a été fait
- **REFONTE-4b-iOS** (`iphone/overlay/app/src/ios/captureMode.js`) : nouvelle capture
  `demo-clair-recommendations-bien-etre-habitude`, Votre bien-être vu par un abonné (faux abonnement des captures
  `-abonne`) qui suit « Méditation ». Réponses de démonstration comme `npm run visual -- --habits=history` d'Android
  (`habitHistoryEntries` : une par jour noté, à midi, « oui » quand la note du jour atteint la médiane), posées pour
  cette seule capture puis retirées avec le réglage `healthtrack_habits` (comme l'essai de la capture `-essai`).
- Tests écrits d'abord (`captureMode.test.js`, 3 tests : place dans le plan, réponses, pose et retrait).
- **DEM-IOS-18** : sans objet (Analyses et ses sous-onglets n'existent plus depuis la refonte).
- Pas de note de Nouveautés : outillage de captures, rien de visible dans l'app.

## Vérifications
- `captureMode*.test.js` (copiés dans `app/src/ios/` le temps du test, puis retirés) : 71 verts ; eslint propre.
- Le reste des tests iPhone passe par la CI (`scripts/upstream.sh` exige un clone complet, celui de la session est
  superficiel).

## Suite proposée
1. Build iOS de la PR : regarder la capture `-habitude` (ligne miel « Méditation ») ; si elle est bonne, merger, cocher
   REFONTE-4b-iOS et passer la ligne des habitudes de PARITE.md à ✅.
2. Relancer la soumission TestFlight de la nuit et l'expiration.
3. Vérifier l'Alpha de la nuit ; puis « 👉 PI2 prête » (build validée rattachée à la version 893).

## Pour le propriétaire
Rien à faire.

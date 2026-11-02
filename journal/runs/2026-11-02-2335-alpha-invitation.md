# Run du 02/11/2026 23:35 (Paris, CET) — Alpha en examen, invitation des testeurs prête

**Type** : 🔧 run de code sans changement de code (vérifications de production + journal).

## Constat au démarrage
- Main à `b7e583e` (#638) ; tous les workflows de main verts (« Tests », « Build & Release », « Relais — déploiement »,
  « Play — AAB » test interne, émulateur). Aucune PR « [Auto] » ouverte (#51 Cursor non touchée).
- **P40 faite par le propriétaire** : « Play — AAB » lancé à la main sur `main` (`bd7d5ac`) le 02/11 21:36 UTC
  (22:36 Paris), piste `alpha` : journal du workflow « versionCode 100721 déjà envoyé : la même version est placée
  sur la piste alpha » puis « Validée ». Le run de 22:35 ne l'avait pas vu. Google examine la version.
- **Bilan du déploiement du relais de `b7e583e`** (journal du job, lu par l'API) : « Installation sans achat :
  premium=true source=launch jusqu'au 2026-11-27T23:00:00.000Z ; iPhone sans achat : premium=true source=launch
  jusqu'au 2026-11-06T23:00:00.000Z » ; App Attest : aucun enregistrement (normal, l'app iPhone ne signe pas encore) ;
  requêtes iPhone hors CI : 0 sur 83. Les deux dates sont servies.
- Demandes reprises : compte rendu du 02/11, étapes (1) à (3) : (1) et (2) faites, (3) rédigée ; P2 (étapes du
  guichet unique). Rien de nouveau dans `HealthTrack-iOS/journal/DEMANDES.md` à traiter ce soir (déjà repris à 22:35).

## Fait
1. Résumé de la semaine : bloc P40 remplacé par « 👉 Version candidate prête : vous pouvez inviter les testeurs »,
   conditionné à la fin de l'examen d'Alpha, avec les gestes et le texte final (Gold offert jusqu'au 27 novembre
   inclus, lien d'inscription au test `https://play.google.com/apps/testing/fr.jpesquet.sante`, à comparer d'un coup
   d'œil au lien « Rejoindre sur le Web »).
2. `INVITATION-TESTEURS.md` : envoi Alpha noté, lien du point 2 rempli.
3. `PRODUIT.md` §4 : P40 ✅, **P41** (inviter dès qu'Alpha affiche 100721 ; décaler `until` si après le 03/11),
   **P2** : étapes exactes d'une modification d'activité sur formalites.entreprises.gouv.fr, avec le point à
   vérifier (nature libérale ou commerciale, catégorie fiscale et cotisations) ; décision et envoi au propriétaire.
4. `BACKLOG.md` : ALPHA-0211, POL-PLAY-11 (Alpha = 100721).

## Vérifications
- Journal seul : `npm run test` lancé pour respecter les garde-fous (voir la PR).

## Suite
- Quand le propriétaire dit le jour de l'invitation : recaler `until` si J ≠ 03/11.
- 07/11 : revérifier au bilan du relais `premium=false` pour l'iPhone et 27/11 pour Android.
- Prochains runs de code : LISTING-2 (fiche Silver/Gold), P32 (geste des pays prêt), GOLD-a3 (attend P37),
  I6-RELAIS-5e côté iPhone (routine iOS), montre Huawei.

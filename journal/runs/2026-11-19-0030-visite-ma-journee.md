# Run du 19/11 00:30 — #1109 mergée, TestFlight 1170, la visite passe par Ma journée (POLISH-SIM-99)

**Type** : 🛠️ code · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 0fe3f27.

## Ce qui a été fait
- **#1109 mergée** (466e865, squash ; restes de REFONTE-2 : titre « Sauvegarde », cartes de Sources vers Objectifs) :
  15 checks verts dont la build iPhone ; captures relues des deux côtés (iPhone 16e `data`, Android `/data`), branche à
  jour. Après le merge : Build & Release **v794** (APK 35,6 Mo), Play — AAB et Tests verts ; émulateur en cours.
- **Build iPhone du soir** : le cron de 21:20 (20:20 UTC) n'était toujours pas parti à 00:30 (3 h de retard). L'envoi
  TestFlight saute si rien n'a changé depuis le dernier envoi réussi : lancé à la main sur main (run 44421649192, vert,
  job macOS de 5 min) → **build 893 (1170.1170) envoyée à Apple**, la première avec la PR regroupée (îlot, lanternes)
  et les restes de REFONTE-2. Si le cron part plus tard, il sautera l'envoi (rien n'aura changé).
- **POLISH-SIM-99** (prioritaire pour le 22/11) :
  - `app/src/services/tour.js` : nouvelle étape « Ma journée » juste après l'Accueil, sur la checklist réelle
    (`.day-checklist`, sans exemple) : « Ce qui se note à la main chaque jour. Une ligne part quand c'est fait. » ;
    l'étape Agir dit « Ouvert depuis l'Accueil : ici, vous vérifierez une piste par vous-même. »
  - `app/src/pages/Recommendations.jsx` : le lien d'une piste dit « Vérifier par un essai » au lieu de « Essayer dans
    Agir » (Agir n'est plus un onglet). Le retour « ← Agir » de l'essai reste : la page s'appelle toujours Agir.
  - Tests d'abord (rouges, puis verts) : `GuidedTour.test.jsx` (place, ancre, titre de l'étape, texte d'Agir),
    `Recommendations.test.jsx` (nom du lien).
  - Aucun correctif iPhone ne touche ces fichiers : même code des deux côtés, aucun correctif à refaire.
  - Note de Nouveautés `2026-11-19-0030-visite-ma-journee.json` (les deux magasins).

## Vérifications
- `npm run test` : **4 082 tests verts** (367 fichiers) ; ESLint propre sur les fichiers touchés.
- Capture `--empty --routes=/ --onboarding=tour --click="Exemple au jour 14 > Suivant > Suivant"` relue : la bulle
  « Ma journée » sous la checklist encadrée (repas 0 sur 3, bien-être, digestion ce soir), onglet Ma journée actif.
- Build iPhone de la PR : sur la PR (une seule, PR ouverte prête).

## État
- TestFlight : **893 (1170.1170)** envoyée, en traitement chez Apple ; 1148.1148 reste chez « Testeurs Halcya ».
  Soumission bêta et expiration : au premier run après l'Alpha de 23:45 où la 1170 est traitée.
- Alpha de 23:45 (22:45 UTC) : pas encore partie à 00:30 (cron en retard, habituel : 02:30 à 04:50).
- Parité : 70 % (même code des deux côtés). Testeurs Play : 4 inscrits sur 12 (pas de nouveau relevé).
- Heures de Mac de la nuit : 5 min (TestFlight) + la build de cette PR.

## Suite proposée
1. Merger cette PR quand ses checks sont verts (captures iPhone de la visite si présentes, sinon `ma-journee`).
2. Après l'Alpha : 1170 aux « Testeurs Halcya » et soumission bêta (`ios-store-beta-submit.yml`), puis expiration.
3. La 1170 est candidate pour PI2 : `--preparer --build 1170` une fois validée chez les testeurs externes.
4. Reste de REFONTE-2 : `/ma-journee` absente des captures de la fiche Play.

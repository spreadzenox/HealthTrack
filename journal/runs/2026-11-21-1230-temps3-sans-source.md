# Run du 21/11 12:30 — Temps 3 sans source et pastilles de Ma journée (POLISH-SIM-133, 131)

**Type** : 🐛 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 8982fcf au départ.

## État de départ
- main vert sur 8982fcf (Tests, émulateurs, Build & Release v847, Play — AAB).
- PR « [Auto] » #1170 (POLISH-SIM-132, run de 11:30) en brouillon, checks verts hors build iPhone (sauté en
  brouillon), à jour sur main : priorité (b). Passée en « prête » à 11:31 UTC ; son build iPhone est lancé.
- Rien de neuf du propriétaire dans le prompt.

## Ce qui a été fait (pendant le build iPhone de #1170)
- **POLISH-SIM-133** : au temps 3 de l'accueil, quand rien ne se suit seul (ni montre, ni Health Connect ou Santé,
  ni météo ; ex. la persona « Stressé et pressé » J1 sur la version web), le titre devient « Pour l’instant, vous
  notez vous-même » (sans « Pour information : rien à valider. ») et Pilou dit « Pour l’instant, c’est vous qui
  notez. Je garde tout. » au lieu de « Tout ça, je m’en occupe. Vous n’avez rien à faire. ». Les lignes
  « Activables dans Réglages › Sources » et « Avec une montre ou un bracelet » restent.
- `Onboarding.jsx` : `autoTilesFor()` partagé entre `AutoStep` et le parent, qui passe `quiet` à `OnboardingPilou`.
- Tests écrits rouges d'abord (2 cas dans `Onboarding.test.jsx`) ; le parcours « sans rien toucher » (ni montre ni
  météo) attend désormais le nouveau titre, ce qui est le comportement voulu.
- `npm run visual -- --onboarding=auto-quiet` (nouveau préréglage) : capture relue ; `--onboarding=auto-none`
  (météo allumée) inchangée.

- **POLISH-SIM-131** (reproduit à la lecture, sans persona) : `PilouBanner` marque `is-todo` ce qui reste, mais
  `DayChecklist.css` remplissait `.day-dot.is-todo` : pleines = à faire, l'inverse de la convention (comprendre.SPEC,
  repas : « pleines = photographié »). Désormais `.day-dot:not(.is-todo)` est rempli. Test CSS `dayDotsFill.test.js`
  écrit rouge d'abord ; capture `/ma-journee` relue (« Encore 2 choses », deux pastilles vides).

## Vérifications
- Tests : 4 189 ✅ · eslint propre sur les fichiers touchés.
- iPhone : les 58 correctifs de `iphone/patches/` s'appliquent à la suite sur le code modifié (`git apply --index`,
  comme `upstream.sh`) ; aucun ne touche `OnboardingPilou.jsx` ni `AutoStep`. Code partagé : parité sans ligne à ajouter.

## Suite proposée
0. Merger #1170 une fois son build iPhone vert et la capture iPhone du temps 4 regardée ; puis mettre cette branche
   (empilée sur #1170) à jour sur main, la passer en « prête » (un build iPhone), regarder la capture et merger.
1. Les 5 défauts du passage du 21/11 sont soldés : suite du BACKLOG (polish, refonte).
2. De jour : captures App Store de la refonte (ASC-CAPTURES-REFONTE), puis « 👉 PI2 prête ».
3. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45.

## Pour le propriétaire
Rien à faire.

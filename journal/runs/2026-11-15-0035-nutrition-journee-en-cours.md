# Run 15/11 00:35 — Nutrition au premier repas : « journée en cours » (POLISH-SIM-97) ; suivi iPhone v1065

**Type** : code (polish, une phrase)  ·  **Android** : main 5e970b6 (#988) au début, b059c94 (#989) ensuite  ·
**TestFlight** : la build du code v1059 est partie chez Apple à 23:30 (run « iOS — TestFlight » du merge de #983,
étape d'envoi verte) ; état chez Apple non relevé ; 1030.1031 chez les testeurs externes d'après le relevé du 14/11
à 18:35 ; pas de soumission bêta à ce run (l'Alpha de 23:45 n'était pas partie à 00:35) ; 844.344 intacte  ·
**Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme (be4524e7…).
- Main 5e970b6 : Tests, Build & Release, Play — AAB et émulateur A56 verts.
- PR #989 (journal du run de 22:35) : checks verts, mergée par son run à 00:31, pendant que je lisais. Aucune autre
  PR de la routine ouverte. PR #51 (`cursor/*`) : non touchée.
- « Play — Alpha » de 23:45 : aucun run planifié depuis celui du 14/11 à 03:41 ; rien à relever encore.

## Fait
1. **Suivi iPhone** : `scripts/upstream.sh --latest` passe `upstream.json` de v1059 à v1065 (5e970b6, #988). Les 52
   correctifs s'appliquent sans retouche. Arrivent sur iPhone : POLISH-SIM-92 (Agir, #987, avec sa note de
   Nouveautés) et P44-3a (#988, rien de visible sur iPhone).
2. **POLISH-SIM-97** : sur Journal › Nutrition, après un premier repas, la page écrivait « des repas manquent sans
   doute, apports sous-estimés ». Quand tous les repas de la fenêtre de 7 jours sont du jour en cours et que
   l'énergie est loin des besoins, elle écrit « ≈ 168 kcal aujourd'hui, journée en cours. » (ligne simple, sans
   cadre d'avertissement) et la légende dit « incertain : journée en cours ». Les barres restent hachurées. Dès
   qu'un autre jour est saisi, l'avertissement habituel revient (`nutritionIntakeCompare.js` : `dayInProgress` ;
   `Nutrition.jsx`).
3. Tests écrits d'abord (deux rouges, puis verts) : `nutritionIntakeCompare.test.js` (aujourd'hui seul, hier seul,
   les deux, journée complète) et `Nutrition.test.jsx` (phrase, légende, pas de compte de repères).
4. Outil de capture : `npm run visual -- --empty --routes=/nutrition --first-meal`.
5. Note de Nouveautés : `2026-11-15-0035-nutrition-journee-en-cours.json` (les deux apps, sans `variants`).

## Vérifs
- `app/` : `npm run test` 3557 verts (44 ignorés) ; `npm run lint` sans erreur ; `npm run build` ; `npm run visual`
  (18 pages ok).
- Captures regardées : Nutrition après un premier repas, clair et sombre
  ([clair](captures/2026-11-15-0035-nutrition-premier-repas-clair.png) ·
  [sombre](captures/2026-11-15-0035-nutrition-premier-repas-sombre.png)) ; Nutrition sur données de démo (8 repas
  sur 5 jours) : avertissement inchangé.
- Code embarqué v1065 avec les 52 correctifs (`iphone/upstream/app`) : `npx vitest run` 3915 verts (44 ignorés),
  build `VITE_DISTRIBUTION=appstore` passe.
- iPhone : aucun correctif de `iphone/patches/` ne touche `Nutrition.jsx` ni `nutritionIntakeCompare.js`.

## Limites
- **POLISH-SIM-97 n'est pas encore sur iPhone** : le code embarqué épingle v1065, qui est d'avant ce changement ;
  il arrive au prochain suivi.
- Le test de la page utilise minuit du jour en cours comme heure du repas (un « il y a une heure » aurait échoué
  entre 00:00 et 01:00, l'heure de ce run).
- « Journée en cours » s'affiche aussi à qui reprend après plus de 7 jours sans repas, et à 23 h 50 après un seul
  repas : la phrase reste vraie, mais elle ne dit plus que la journée semble incomplète.
- La persona demandait aussi un repère de calories par jour et les sucres ou graisses en tête : pas fait (c'est une
  proposition, pas du polish).
- La capture montre un profil vide (« Compléter mon profil ») : le cas d'un profil rempli au premier jour n'a pas
  été vu en capture.
- Charte, PRODUIT, BACKLOG et journal iPhone lus par sections (plus de 1 Mo) ; `DESIGN.md` et `INFRA.md` non relus.
- TestFlight : état des builds chez Apple non relevé ; ni soumission bêta ni expiration à ce run.
- `journal/PRODUIT.md` non modifié : ni jalon ni action du propriétaire ne change.

## Fin du run
- **PR #990** : les 15 checks verts à 01:29 (Tests, Build APK, cinq émulateurs, tests du code embarqué, modèles du
  visage, build iOS sur simulateur en 48 minutes, build 1065.1068) ; main inchangé entre-temps. Captures
  `captures/pr-990` regardées sur iPhone 16e, démo, clair : Agir (rien de cassé ; la phrase « D'ici là, notez… » y
  figure, la démo n'a pas de note du jour : le cas « note faite » n'est pas vu sur iPhone) et Journal › Jours.
  Mergée à 01:29 (3ec842a).
- Après le merge : Build & Release vert, **release v731 publiée, APK de 34,6 Mo** ; Tests et Play — AAB verts ;
  « iOS — TestFlight » vert en 5 minutes (envoi du code v1065, bilan non lu) ; build iOS sur simulateur et
  émulateur A56 de main encore en cours à 01:38.

## Suite
- Suivi iPhone de POLISH-SIM-97 (upstream v1065 → dernière).
- Après l'Alpha de la nuit : soumettre la dernière build TestFlight traitée (code v1059 ou plus récent), puis
  expirer les anciennes.
- P44-3b ; P44-2b le 02/12 au matin. POLISH-SIM-91 avec la fin de POLISH-SIM-69, puis 94, 95.

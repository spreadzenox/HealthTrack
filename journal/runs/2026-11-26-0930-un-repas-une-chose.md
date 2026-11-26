# Run 26/11 09:30 — un repas, une chose (POLISH-SIM-168 et 169)

**Type** : 🔧 (code produit, polish) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
cf1c2d3 vert (Tests, émulateur A56) au départ · **TestFlight** : 1335.1335 chez « Testeurs Halcya », validée
(inchangé ; build du soir à 21:20) · **Parité** : 70 % (33/47), inchangée (correctifs du code partagé, présents des
deux côtés ; le widget reste propre à Android)

## État de départ
- main cf1c2d3 (journal de 08:30) vert ; aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée).
- Pas de nouvelle réponse du propriétaire. Remise à zéro du clone refusée par la sécurité de la session ; le clone
  était déjà sur origin/main, propre (vérifié).

## Fait
- **POLISH-SIM-168** : « Encore N choses aujourd'hui » compte chaque repas manquant pour une chose
  (`services/dayChecklist.js`, `remaining`) : à 13 h sans repas ni note, avec l'objectif digestion, « Encore 5
  choses » ; un repas noté → 4. La bannière de Pilou montre un point par repas (`PilouBanner.jsx`) ; le widget Android
  reçoit un libellé par repas restant (« Repas du matin », « Repas de midi »… `widgetSync.js`), son titre et ses
  bulles baissent donc aussi, sans toucher au code natif ; l'annonce du lecteur d'écran (« … : noté. Encore … ») suit.
  Les bulles de l'Accueil (« N bulles à faire ») ne changent pas : la bulle Repas reste une bulle remplie au tiers.
  Choix : la digestion du soir reste comptée avant 18 h (elle est à faire aujourd'hui, la ligne dit « À partir de
  18 h »).
- **POLISH-SIM-169** : toucher le champ des grammes d'un ingrédient sélectionne le nombre (`MealEditor.jsx`,
  `onFocus`, refait juste après pour Safari sur iPhone) : taper « 120 » remplace « 100 ».
- Nouveautés : `2026-11-26-0930-un-repas-une-chose.json`.

## Vérifications
- Tests d'abord (rouges puis verts) : `dayChecklist`, `DayChecklist`, `PilouBanner`, `widgetSync`, `MealEditor`,
  `Dashboard`. Suite complète : 4 705 tests, 1 échec trouvé (`Dashboard`, ancien compte) puis corrigé ; lint 0
  erreur (comme avant) ; build vert.
- Captures `/ma-journee --now=13:00` en clair (objectif digestion : « Encore 5 choses », 5 points) et en sombre
  (« Encore 4 choses ») relues : [`captures/2026-11-26-0930-encore-5-choses.png`](captures/2026-11-26-0930-encore-5-choses.png).
- PR ouverte en brouillon, passée « prête » une fois finie : un seul build iPhone sur simulateur (code partagé).

## Suite proposée
1. Si la PR n'est pas mergée dans ce run : le run suivant la finit (checks, captures iPhone de Ma journée).
2. PERSONAS-OUTIL-3 (source « Santé » pour une configuration iPhone dans l'outil des personas).
3. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51. Réponses attendues : PROP-SIM-19, « go
courbes / go phases / non », « rituel 2D / 3D / pas de rituel ».

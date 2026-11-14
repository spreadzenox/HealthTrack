# Run 14/11 06:35 — Repas : le détail « Riche en… » en clair (POLISH-SIM-77) ; #961 mergée

**Type** : code (mode polish)  ·  **Android** : v1039 sur main au début (#961), v1040 après ce run  ·
**TestFlight** : 1030.1031 chez les testeurs externes (depuis le 14/11 à 00:33) ; « iOS — TestFlight » vert sur
8981190 le 14/11 à 06:19 (code de la v1037 ; numéro non relevé) ; aucune soumission bêta avant la nuit prochaine ;
844.344 intacte  ·  **Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main 8981190 (#960) : Tests, iOS — TestFlight et modèles du visage verts ; « iOS — build simulateur » et
  l'émulateur A56 encore en cours. Dernier « Play — AAB » vert : 05b68ef (v1037), déjà le code embarqué de l'iPhone.
- PR #961 du run de 05:35 ouverte (journal seulement : captures iPhone « après », résumé corrigé), « Frontend
  (Vitest) » et « Build APK » verts, à jour sur main. #51 (`cursor/*`) non touchée.

## Fait
1. **PR #961 mergée** en squash (699f543) : priorité (b). Elle ne changeait que `journal/`.
2. **POLISH-SIM-77** (`MealFodmapLine.jsx`, `.css`) : les grammes, le repère et les sources étaient déjà derrière
   le chevron ; c'est le détail déplié que la persona ne comprenait pas. Il devient :
   - par groupe : « Environ 1,1 g, pour un repère de 0,3 g par repas. » (ou « 2,2 à 4,8 g selon les mesures
     publiées, pour un repère de… », et « Teneurs approchées. » quand c'est le cas), en police de texte et non
     plus en chasse fixe ;
   - une phrase : « Certaines personnes digèrent mal les fructanes (blé, oignon, ail) ou les GOS (pois chiches,
     lentilles), d'autres très bien. Le repère est une hypothèse de départ : vos propres données priment. »
     (exemples d'aliments repris de `hint` dans `FODMAP_GROUPS`) ;
   - une dernière ligne, en petit : « Repères : Varney 2017. Teneurs : Ferjančič 2024, … » (attribution gardée).
   La ligne repliée ne change pas.
3. Nouveautés : `2026-11-14-0635-repas-fodmap-detail-en-clair.json` (pour tous).
4. **Suivi iPhone** : rien à avancer (`upstream.json` est déjà sur le dernier « Play — AAB » vert). Aucun correctif
   de `iphone/patches/` ne touche `MealFodmapLine` : l'écran arrivera tel quel au suivi de la v1040.

## Vérifs
- `npm run test` : 3526 verts, 44 ignorés (un test nouveau, deux mis à jour ; les trois vus rouges en remettant l'ancien composant). `npm run lint` : 0 erreur.
  `npm run build` : vert.
- `npm run visual -- --play --routes=/food --food-analysis=fodmap --click="Afficher les détails"`, clair et sombre,
  sans erreur JS ; captures regardées :
  [clair](captures/2026-11-14-0635-repas-fodmap-detail-clair.png) ·
  [sombre](captures/2026-11-14-0635-repas-fodmap-detail-sombre.png).

## Limites
- `npm run visual` complet (18 pages), `--empty` et 360 px non relancés ; la carte d'un repas enregistré
  (Journal › Repas) n'a été vue que repliée.
- Avertissement de contraste du rapport visuel en clair sur « − » et « + » de l'éditeur de repas (4,28:1) : déjà là
  avant ce run, non traité.
- Pas livré sur iPhone à ce run (code embarqué v1037). « iOS — build simulateur » de 8981190 n'était pas fini à
  l'écriture ; captures de `captures/main` non regardées.
- Numéros des builds TestFlight des codes v1034 à v1037 non relevés ; version placée sur Alpha cette nuit non
  relevée.
- Charte, PRODUIT, BACKLOG et journal iPhone lus par sections, pas en entier (plus de 1 Mo).

## Suite
- Prochain run : `scripts/upstream.sh --latest` (v1040) une fois « Play — AAB » vert sur le merge ; vérifier
  « iOS — build simulateur » de main.
- Fin de POLISH-SIM-69 avec le même vocabulaire (toucher « GOS » dans Analyses : aliments de `hint`).
- POLISH-SIM-72-iOS-b ; FUSION-2 ; POLISH-SIM-71b ; CYCLE-3a-2.
- Nuit prochaine, après l'Alpha de 23:45 : soumettre la dernière build TestFlight traitée, puis expirer les
  anciennes.

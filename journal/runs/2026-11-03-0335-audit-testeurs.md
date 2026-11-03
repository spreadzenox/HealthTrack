# Run du 03/11/2026 03:35 (Paris, CET) — Merge du premier lancement, audit avant les testeurs

**Type** : 🔧 run de code (banc visuel seulement ; rien ne change dans l'app).

## Constat au démarrage
- Main à `def46c5`, workflows verts. PR **#643** (run de 02:35, premier lancement C4) verte sur tous les checks, à
  jour sur main, merge refusé à sa session : le compte rendu demandait au run suivant de la merger.
- Aucun autre run en cours (la session de 02:35 avait terminé, PR inchangée depuis 02:08 UTC).

## Fait
1. **#643 mergée** (squash, `601a88e`) ; CI de main lancée (Build & Release, Play — AAB, Tests, émulateur).
2. **Audit de la version play telle que la verront les testeurs** (POL-PLAY-103) : `npm run visual -- --play --empty`
   (toutes les pages) puis `--subscription=launch` (Accueil, Paramètres, Analyses, Premium, Repas, Réintroduction),
   clair et `--dark` sur Paramètres. Relu : Accueil, Journal, Repas, Analyses, Sources, Paramètres, Premium.
   - Période de lancement : Premium « Gold offert pendant le test » (5 bénéfices dont « Gold estime mieux les
     quantités », bouton Continuer, aucun prix) ; Paramètres « Gold offert pendant le test, jusqu'au … » ; plus
     d'étiquette « premium » sur « Tester un groupe FODMAP ». Hors période : paywall Silver / Gold correct.
   - Aucun défaut d'app trouvé, aucune erreur JS.
3. **Banc visuel** : le faux `/v1/credits` donnait Silver (9 / 10 par jour) pendant la période de lancement, d'où
   « 9 analyses restantes » au-dessus de « jusqu'à 20 analyses par jour ». Le vrai relais donne Gold, 20
   (`relay/src/credits.js`, `dailyOf`). Recalé : `tier`, 19 / 20 pour `launch` et `gold` (`gold` devient premium),
   Silver 9 / 10 pour `active`, `trial`, `grace`.

## Vérifications
- `npm run test` : 2 901 tests verts ; `npm run build` OK ; `npm run lint` : 7 erreurs préexistantes, aucune
  nouvelle ; `npm run visual` (démo, 16 pages) sans erreur.
- Main après #643 : Build & Release, Play — AAB et Tests verts ; release **v461** (APK 34 530 528 octets).

## Suite
- Lire « Build & Release » de `601a88e` (taille de l'APK) et le résumé émulateur de main (premier écran release).
- Quand le propriétaire dit le jour de l'invitation : recaler `until` si J ≠ 03/11. 07/11 : bilan du relais
  (`premium=false` pour l'iPhone).
- GOLD-a3 attend P37 ; `shrinkResources` (POL-PLAY-11) après les premiers jours des testeurs.

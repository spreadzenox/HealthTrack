# 06/11 19:35 — Carte « Votre ventre » en très grande police (VENTRE-COLONNE)

Type : 🎨 run de code (revue C1, variante play, petits écrans).

## Constat au démarrage
- main `3fe73a4` (#760) : Tests, Build & Release, émulateur A56, Play — AAB et les passages « Play — Alpha
  (livraison continue) » de 18:03 à 18:17 UTC verts. Aucune PR « [Auto] » ouverte (#51 hors routine, non touchée).
- Alpha : 100841 en examen chez Google (envoyée le 06/11 à 16:12 UTC) ; porte de 24 h jusqu'au 07/11 vers 16:12 UTC.
- Décision iOS du 06/11 18:20 déjà en tête de `POUR-IOS.md` (run de 18:35). `iosUntil` = 06/11 23:00 UTC : la
  période de lancement iPhone se termine ce soir, comme prévu (rien à changer).

## Revue
`npm run visual -- --play --size=320x700 --font-scale=1.3` (démo, 17 pages) : un seul contrôle en défaut,
« TEXTE QUI DÉBORDE (« Douleur ») » sur l'Accueil. Captures relues :
- carte « Votre ventre » : rangée bien empilée (GUT-STACK), mais « Douleur » seul est plus large que sa colonne
  (≈ 75 px de mot pour ≈ 60 px utiles) ;
- carte « Bien-être estimé » : « Noter moi- / même » coupé au trait d'union.

## Fait
- `hooks/useStackedChoices.js` : `choiceLayout(items)` → `row`, `stacked` ou `column` (un mot seul plus large que
  sa colonne) ; la place disponible se calcule sur la largeur de la rangée divisée par le nombre de choix (et non sur
  le bouton, qui s'élargit en colonne : pas d'aller-retour). `shouldStackChoices` garde son contrat.
- `TodayCards` : classe `gut-choices--column` (une colonne pleine largeur, rond à côté du mot) ; CSS.
- `MoodEstimateCard` et `WellbeingHistory` : « Noter moi-même » via `keepWhole`.
- Tests : 4 pour `choiceLayout`, 1 assertion (span insécable) dans `MoodEstimateCard.test.jsx`.
- Note de Nouveautés `2026-11-06-1935-ventre-grande-police.json`.

## Vérifications
- Captures relues : 320 px ×1,3 (trois boutons pleine largeur, plus de débord ; « Noter / moi-même ») ; 360 px
  police normale (rangée inchangée, « Noter moi-même » sur une ligne).
- `npm run test` : 3 205 verts. `npm run lint` : 0 erreur. `npm run build` OK. `npm run visual` (démo) : 17 ok (avertissements déjà connus : 1 msg console Sources, cible clé Gemini sideload).

## Suite
- TEST-ALPHA-1 (07–08/11) ; INSTALLS-21c-2 (08–09/11) ; GOLD-a3-2 dès P37.
- Run idées de 20:35 : veille produit.

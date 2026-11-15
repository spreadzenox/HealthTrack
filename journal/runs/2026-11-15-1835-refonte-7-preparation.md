# Run 15/11 18:35 — Préparation de l'étape 7 (Données, fin du Journal)

**Type** : préparation pendant une build macOS (sans code produit)  ·  **Android** : main 25e29c5 (#1021, orchestration),
code v1094 en test interne  ·  **TestFlight** : aucun relevé à ce run (dernier connu : 1072.1073 chez les testeurs
externes, relevé de 13:43)  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions vérifiée : conforme (69177875…). Lus en entier : les quatre fichiers d'instructions, le
  brief de la refonte, le compte rendu de 16:35. Lus en partie : le début du résumé, le bloc REFONTE du `BACKLOG.md`,
  la PR #1022 et son compte rendu (dans la PR).
- Main 25e29c5 : Tests, Build & Release (v746), Play — AAB et émulateur verts.
- Une PR de la routine ouverte : **#1022** (IOS-HEAD, run de 17:35), 15 checks verts sur 6738925, « Build iOS
  (simulateur) et captures » en cours depuis 17:50, mais **en retard sur main** (#1021, seulement `orchestration/`).
  #51 (cursor) non touchée.

## Fait
1. **#1022 remise à jour sur main à 18:32** (« Update branch », commit de fusion baed939, aucun conflit). La build
   iOS en cours sur l'ancien commit est annulée par la règle de concurrence ; une nouvelle part (près d'une heure).
   Choix : la relancer tout de suite plutôt qu'après la fin de l'ancienne, pour que le run de 19:35 trouve une build
   à jour et puisse merger. Rien d'autre n'est mergé à ce run, pour ne pas la remettre en retard.
2. **Inventaire de l'étape 7** :
   [`ETAPE-7-DONNEES.md`](../maquettes/compagnon-etapes/ETAPE-7-DONNEES.md). Dix choses qui ne se font que dans le
   Journal (modifier ou supprimer une note de bien-être, digestive, des selles, une cigarette passée ; niveau d'une
   note digestive ; règles d'un jour passé ; séances et pesées détaillées ; habitudes passées ; « Hier » ; deux
   étapes de la visite guidée) et la maison proposée pour chacune (surtout « Vos saisies » dans le détail du jour de
   Tendances). Références à `/journal` relevées, dont le plan de captures iPhone (`captureMode.js`). Découpage :
   7a « Vos saisies », 7b Données sur 2 onglets et visite guidée, 7c code mort et « Hier », 7d Nunito.
3. Résumé : bloc « Version propre pour le 22/11 : prêt, probable, pas prêt » en tête (objectif du propriétaire du
   15/11) ; ses réponses du 15/11 vers 17:45 (tirage au sort, réintroduction quand elle sert) retirées des
   questions. `BACKLOG.md` (REFONTE-7 préparée), `PRODUIT.md`.

## Vérifs
- Aucun code produit : rien à tester. L'inventaire vient de la lecture du code (`DailyJournal.jsx`, `TrendsViewer.jsx`,
  `Food.jsx`, `Dashboard.jsx`, `tour.js`, `captureMode.js`), rien n'a été essayé dans l'app.

## Limites
- Habitudes affichées « en données brutes » dans le Journal : supposé d'après le code, pas vu en capture.
- Widget Android non relu pour un lien vers `/journal`.
- Pas de relevé TestFlight, pas de simulation de personas.

## Suite
- **Run de 19:35** : #1022 d'abord (build iOS verte, captures `recommendations-ventre` et `reintroduction` regardées
  sur `captures/pr-1022`, à jour sur main), **puis** cette PR (journal seul : remise à jour sur main ; conflit
  possible dans le tableau des runs du résumé, à résoudre en gardant les deux lignes).
- Run « idées » de 20:35 : le banc de 6d (n = 7 et 14).
- Puis REFONTE-7a.

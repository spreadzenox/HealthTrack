# Run 17/11 02:30 — intégrateur du sprint de la refonte

**Type** : intégrateur (journal seul, sprint jusqu'au 17/11 03:00)  ·  **Android** : main vert ; Build & Release v777
(APK 35 331 266 octets, 35,3 Mo, merge de #1070 à 02:09) ; Tests verts sur 930dcdd, e39d89d et 10022f1 ; émulateur A56
de 10022f1 en cours à 02:35  ·  **TestFlight** : 1107.1107 chez « Testeurs Halcya » (inchangé) ; « iOS — TestFlight » de
930dcdd réussi ; build simulateur de main de 930dcdd en cours  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions conforme (45b95d6a…). Les quatre fichiers lus en entier. 02:31 heure de Paris.
- Commit, squash et PR sans nom de modèle ni lien de session (règle du 16/11).
- Rôle du sprint : aucune étape 8 à 15 codée, aucune PR « [Sprint] » touchée, aucune PR sur app/, iphone/ ou relay/.
- Aucune PR « [Auto] » ouverte de moins de 90 min ; #1045 (UPG-4) reste reportée après 03:00.

## Relevé des lots (d'après `journal/sprint/LOT-*.md` de main et des branches `claude/sprint-*`)
- **#1067 (VIE 5) mergée à 02:07** (929d5ec) : cairn des galets dans « Par famille », graine des captures iPhone.
- **#1070 (SCÈNE 4, assemblage) mergée à 02:09** (930dcdd) sous la règle de la dernière vague (build iOS vert sur le
  commit précédent 6bf72be ; le dernier commit ne résolvait qu'un conflit de `pageStyles.js`) ; #1065 fermée.
- **Lots finis : SCÈNE (02:12), VIE (02:10), BULLES, MONDE, PHOTO.**
- En PR : #1071 (PILOU 3) et #1072 (STUDIO 4) : tous les checks verts (Vitest, APK, émulateurs, Android 12L, API 28,
  relais) sauf « Build iOS (simulateur) et captures », en cours à 02:35. Leurs équipiers mergent s'il finit avant 03:00.
- Défaut relevé par SCÈNE sur les captures iPhone de #1070, sur main : carte de la rencontre illisible en thème sombre
  (fond clair, texte clair) ; capture iPhone « vide-accueil » blanche ; mode captures recouvert par la rencontre.
  Noté POLISH-MEET-DARK au BACKLOG, premier correctif après 03:00.
- Mis à jour : tête du résumé (relevé de 02:30, v777, cinq lots finis, défaut), tableau des runs, BACKLOG (bloc sprint,
  POLISH-MEET-DARK, REFONTE-RESTES-SPRINT), PRODUIT (historique), PARITE (Scène et Vie des deux côtés).

## Livraison continue
- « Play — Alpha » du soir pas encore parti à 02:35 (dernier envoi : 16/11 03:24 Paris ; retard habituel du cron).
  Il emportera la refonte avec Pilou, et donc le défaut de la rencontre en sombre. À vérifier au run suivant.
- Examen bêta TestFlight : à soumettre au premier run où la build du soir est traitée par Apple, puis expiration des
  anciennes ; rien à faire à 02:30.

## Suite
- Premier run après 03:00 : bilan lot par lot en tête du résumé (livré / reste), #1071 et #1072 si encore ouvertes,
  POLISH-MEET-DARK, série de captures de main des deux côtés, #1045, POLISH-FLAKY-DASH, REFONTE-RESTES-SPRINT, puis
  POLISH-SIM-99 à 108 et la fin d'UPG-3.

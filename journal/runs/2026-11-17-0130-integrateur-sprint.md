# Run 17/11 01:30 — intégrateur du sprint de la refonte

**Type** : intégrateur (journal seul, sprint jusqu'au 17/11 03:00)  ·  **Android** : main vert ; Build & Release v774
(APK 35 309 228 octets, 35,3 Mo, merge de #1052 à 01:24) ; Tests, Build & Release, émulateur A56 et Play — AAB de
82c3f2c en cours à 01:35  ·  **TestFlight** : 1107.1107 chez « Testeurs Halcya » (inchangé) ; « iOS — TestFlight » de
ae8e213 réussi (00:40), celui de 5e749d3 en file, celui de 82c3f2c en attente  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions conforme (45b95d6a…). Les quatre fichiers lus en entier. 01:31 heure de Paris.
- Commit, squash et PR sans nom de modèle ni lien de session (règle du 16/11).
- Rôle du sprint : aucune étape 8 à 15 codée, aucune PR « [Sprint] » touchée, aucune PR sur app/, iphone/ ou relay/.
- Aucune PR « [Auto] » ouverte de moins de 90 min ; #1045 (UPG-4) reste reportée après 03:00.

## Main
- Tests rouge une fois sur 99c1de6 (#1058, 00:00) : `Dashboard.test.jsx` ne trouve pas « Méditation · oui, changer la
  réponse ». Verts sur 9fe5afb, bbf817e et 5e749d3 juste après : test instable, pas une régression. Noté
  POLISH-FLAKY-DASH au BACKLOG pour après le sprint (aucune réparation de main nécessaire).

## Relevé des lots (d'après `journal/sprint/LOT-*.md` de main et des branches `claude/sprint-*`)
- **#1052 (STUDIO) mergée à 01:22** (5e749d3) : fiche de traits, export et import, écran Studio, aperçu 2D.
- **#1066 (BULLES 2) mergée à 01:30** (82c3f2c) : lucioles la nuit, jour 14, bandeau au défilement, nom choisi.
- Lots finis : **PHOTO** (00:35), **MONDE** (00:45, rien en PR), **BULLES** (01:35, #1073 = fichier de lot seul).
- En PR : #1065 (SCÈNE 3, nuit) puis #1070 (SCÈNE 4, assemblage, empilée) ; #1071 (PILOU 3, effets des expressions) ;
  #1072 (STUDIO 4, traits sur le vrai Pilou) ; #1067 (VIE 5, cairn des galets).
- Assemblage (SCÈNE, 00:50) : mise à jour depuis une version d'avant la refonte → rencontre une seule fois, pas de
  fête des 7 jours pour un utilisateur ancien. Aucune série de captures de main pendant le sprint (builds iOS annulées
  par les merges suivants) ; palier de qualité non relevé sur Android 9 ni le simulateur.
- Mis à jour : tête du résumé (relevé de 01:30, v774, lots finis), tableau des runs, BACKLOG (bloc sprint,
  POLISH-FLAKY-DASH), PRODUIT (historique), PARITE (Studio et bulles des deux côtés ; haptique à décider).

## Livraison continue
- « Play — Alpha » du soir pas encore parti à 01:35 (dernier envoi : 16/11 03:24 Paris ; le cron de 23:45 part
  souvent avec 3 à 4 h de retard). À vérifier au run suivant.
- Examen bêta TestFlight : à soumettre au premier run où la build du soir est traitée par Apple, puis expiration des
  anciennes ; rien à faire à 01:30.

## Suite
- Run de 02:30 : même rôle. Premier run après 03:00 : bilan lot par lot en tête du résumé (livré / reste), série de
  captures de main des deux côtés, #1045, POLISH-FLAKY-DASH, puis POLISH-SIM-99 à 108 et la fin d'UPG-3.

# Run 17/11 00:30 — intégrateur du sprint de la refonte

**Type** : intégrateur (journal seul, sprint jusqu'au 17/11 03:00)  ·  **Android** : main vert sur dedb890 (Tests,
Build & Release v771, APK 35,1 Mo ; émulateur A56 et Play — AAB en cours à 00:30)  ·  **TestFlight** : 1107.1107 chez
« Testeurs Halcya » (inchangé) ; « iOS — TestFlight » de dedb890 en file d'attente (celles de ed1fa08 et 42072c6
annulées par le merge suivant)  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions conforme (45b95d6a…). Les quatre fichiers lus en entier. 00:31 heure de Paris.
- Commit, squash et PR sans nom de modèle ni lien de session (règle du 16/11).
- Rôle du sprint : aucune étape 8 à 15 codée, aucune PR « [Sprint] » touchée, aucune PR sur app/, iphone/ ou relay/.
- La PR journal du run de 23:30 (#1064) était restée ouverte : reprise et complétée ici plutôt qu'une PR de plus.

## Fait
- **#1050 (PHOTO, app) mergée par son équipier à 00:26** (dedb890) : Tests et Build & Release verts, v771.
  **Lot PHOTO fini** (relais #1047 et app #1050 sur main, éteints ; missions P49 et PI3 prêtes).
- **#1057 (MONDE) mergée par son équipier à 00:40** (ae8e213) pendant le run : widget Android « Ma journée », Pilou dans
  les notifications du soir (Android et iPhone) ; widget absent sur iPhone (PARITE).
- **#1058 (PILOU) mergée par son équipier à 00:58** (99c1de6) : la figurine remplace le Pilou simple ; reste au lot
  SCÈNE les images fixes refaites avec ce Pilou.
- PR du sprint encore ouvertes : #1052 (STUDIO), #1065 (SCÈNE 3 : la nuit sur l'île),
  #1066 (BULLES 2 : lucioles, jour 14), #1067 (VIE 5 : cairn des galets). #1045 (UPG-4) reportée après 03:00.
- Tête du résumé (relevé de 00:30, v771, nouvelles PR), tableau des runs, BACKLOG (bloc sprint), PRODUIT
  (historique), PARITE (photo éteinte des deux côtés).

## Livraison continue
- « Play — Alpha » du soir pas encore parti à 00:30 (dernier envoi : 16/11 03:24 ; le cron de 23:45 part souvent
  avec 3 à 4 h de retard). À vérifier au run suivant.
- Examen bêta TestFlight : à soumettre (`ios-store-beta-submit.yml`) au premier run où la build du soir est traitée
  par Apple, puis expiration des anciennes ; rien à faire à 00:30.

## Suite
- Runs de 01:30 et 02:30 : même rôle. Premier run après 03:00 : bilan lot par lot en tête du résumé, #1045, puis
  POLISH-SIM-99 à 108 et la fin d'UPG-3.

# Run 16/11 23:30 — intégrateur du sprint de la refonte

**Type** : intégrateur (journal seul, sprint jusqu'au 17/11 03:00)  ·  **Android** : main vert sur ef7bbe1 (Tests,
émulateur A56 ; dernière release v767, APK 35,0 Mo)  ·  **TestFlight** : 1107.1107 chez « Testeurs Halcya »
(inchangé) ; « iOS — TestFlight » de 0825540 (merge de la Scène) réussi, « iOS — build simulateur » de 0825540 encore
en cours à 23:30  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions conforme (45b95d6a…). Les quatre fichiers lus en entier. 23:30 heure de Paris.
- Commit, squash et PR sans nom de modèle ni lien de session (règle du 16/11).
- Rôle du sprint : aucune étape 8 à 15 codée, aucune PR « [Sprint] » touchée, aucune PR sur app/, iphone/ ou relay/.

## Fait
- Relevé des `journal/sprint/LOT-*.md` (version la plus récente par lot sur main et `claude/sprint-*`) et des PR.
- Aucun merge sur main depuis #1063. PR ouvertes : #1050 (PHOTO), #1052 (STUDIO), #1056 (BULLES, conflit résolu à
  22:40), #1057 (MONDE, à jour à 23:15), #1058 (PILOU), #1060 (VIE, à jour à 23:10), #1062 (SCÈNE 2) ; #1045 (UPG-4)
  reportée après 03:00.
- Assemblage confié au lot SCÈNE à 22:40 : fusion locale de tout, 3 980 tests verts, 1 rouge d'une ligne
  (`pageStyles.js`), conflits VIE × STUDIO décrits et résolus en gardant les deux.
- Tête du résumé, tableau des runs, BACKLOG (bloc sprint), PRODUIT (historique), PARITE.

## Points relevés pour la suite
- Le correctif `bundleGuard` (import de `CompanionScene.css` dans `pageStyles.js`) doit arriver avec #1056 ou la PR
  d'assemblage, sinon « Tests » de main rougit au merge de #1056 : à vérifier au run de 00:30 (main rouge = priorité).
- Ordre des merges attendu : PILOU (#1058) avant les images fixes refaites de la PR d'assemblage.
- Restes hors sprint inchangés (haptique, notification de repas, widget iPhone, photo → `saveFiche`).

## Suite
- Runs de 00:30 à 02:30 : même rôle. Premier run après 03:00 : bilan lot par lot en tête du résumé, #1045, puis
  POLISH-SIM-99 à 108 et la fin d'UPG-3.

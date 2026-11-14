# Run 14/11 12:35 — « Cœur au repos », « Oxygène du sang » : un seul nom (POLISH-SIM-86)

**Type** : code (mode polish)  ·  **Android** : v1046 sur main au début  ·
**TestFlight** : 1030.1031 chez les testeurs externes (depuis le 14/11 à 00:33) ; builds des codes v1040 et v1044
envoyées par les merges du matin ; aucune soumission bêta avant la nuit prochaine ; 844.344 intacte  ·
**Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main 2b154fa (#969, v1046) : Build & Release, Tests, Play — AAB et émulateur A56 verts. La build iOS sur
  simulateur du merge de #968 tournait encore au début du run.
- Aucune PR de la routine ouverte. #51 (`cursor/*`) non touchée.

## Fait
1. **Suivi iPhone, PR #970** : `iphone/upstream.json` passe de v1044 à v1046 (commit de #969, POLISH-SIM-82b).
   Les 52 correctifs s'appliquent sans retouche ; tests du code partagé avec les correctifs : 3899 verts, 44
   ignorés. PR ouverte en début de run pour que la build macOS tourne pendant le reste.
2. **POLISH-SIM-86** : « FC au repos » et « SpO₂ » (Journal, Aujourd'hui, Tendances, normes, Analyses) à côté de
   « cœur au repos » et « oxygène du sang » (Sources). Le nom de Sources devient celui de toute l'app :
   `journalChips.js`, `today.js`, `trendsData.js`, `baselines.js`, `analysisResults.js`, `analysisEngine.js`
   (« Saturation en oxygène (SpO₂) » et « FC repos »), `method/changes.js`, `dayDeviations.js` (« Cœur au repos plus
   rapide / plus lent », comme la fiche d'un jour), `BaselineCards.jsx`, `HealthConnectConnector.js`,
   `deviceCapabilities.js`, `watchGuides.jsx`, oxymètre Bluetooth, écran Montre. Dans la phrase du Radar forme,
   l'exception qui gardait « FC » en capitales disparaît (« cœur au repos, variabilité cardiaque et sommeil »).
3. Test de garde `app/src/data/measureNames.test.js`, sur le modèle de `hrvName.test.js`.
4. Nouveautés : `2026-11-14-1235-coeur-au-repos-oxygene-du-sang.json` (pour tous).

## Vérifs
- Le test de garde vu rouge (3 cas) avant le code ; neuf tests existants alignés sur les nouveaux noms.
- `npm run test` : 3542 verts, 44 ignorés. `npm run build` : passe. `npm run lint` : aucune erreur.
- `npm run visual` sur `/journal`, `/` et `/tendances`, avant et après, clair et sombre : aucune erreur
  JavaScript, aucun débordement. Journal regardé
  ([avant](captures/2026-11-14-1235-journal-avant-clair.png) ·
  [après](captures/2026-11-14-1235-journal-apres-clair.png) ·
  [sombre](captures/2026-11-14-1235-journal-apres-sombre.png)) : « Cœur au repos » passe sur deux lignes et la
  rangée gagne une ligne de hauteur.

## Limites
- Les données de démo n'ont pas d'oxygène du sang : la tuile « Oxygène du sang » du Journal n'est vérifiée que par
  les tests (`Journal.test.jsx`, `measureNames.test.js`), pas en capture.
- Aujourd'hui (« Vos données du jour ») et Tendances (menu « + ») : libellés vérifiés par les tests, pas regardés
  en capture.
- « FC » (tuile du Journal), « FC nuit » et « FC automatique » gardent leur nom : POLISH-SIM-86b.
- iPhone : les correctifs 17, 32, 56 et 57 ne s'appliquaient plus sur ce code (essai à blanc des 52 correctifs) ;
  refaits dans #970, voir « Fin du run ». Aucune capture iPhone regardée à ce run.
- Charte, PRODUIT, BACKLOG, PARITE et journal iPhone lus par sections, pas en entier (plus de 1 Mo).

## Fin du run
- **#971 mergée** à 13:02 (a568661, v1047) : les 12 checks verts (Vitest, Build APK, relais, protocole montre,
  budget de lectures, cinq émulateurs), branche à jour sur main.
- **POLISH-SIM-86-iOS fait dans #970** : plutôt que de laisser finir une build macOS du code v1046 puis d'en lancer
  une autre, la PR de suivi passe à la v1047. Les correctifs 17, 32, 56 et 57 ne cassaient que par leurs lignes de
  contexte (« FC au repos », « SpO₂ », « Saturation en oxygène ») : refaits avec les nouveaux noms, sans autre
  changement. Les 52 correctifs s'appliquent ; 3902 tests verts sur le code embarqué (test de garde compris), lint
  sans erreur. Les correctifs 20 et 21 et deux tests de l'overlay ne disent les anciens noms qu'en commentaire.
- **#970 reste ouverte** : la build iOS sur simulateur repart de zéro avec ce push (près d'une heure). Au run
  suivant : la lire, regarder les captures iPhone du Journal (« Cœur au repos ») et d'Analyses › Bien-être, puis
  merger.
- Après le merge : Tests, Build & Release et Play — AAB verts sur a568661 ; **release v718** publiée, APK de
  33,0 Mo (v717 du run de 11:35 : 33,0 Mo aussi). L'émulateur A56 de main tournait encore à la fin du run.

## Suite
- Finir #970 (build macOS, captures du Journal et d'Analyses › Bien-être).
- POLISH-SIM-90, 86b, 81b ; POLISH-SIM-72-iOS-c ; fin de POLISH-SIM-69 ; FUSION-2 ; POLISH-SIM-71b ; CYCLE-3a-2.
- Maquettes de PROP-SIM-17 et PROP-SIM-18 à un run « idées ».
- Nuit prochaine, après l'Alpha de 23:45 : soumettre la dernière build TestFlight traitée, puis expirer les
  anciennes.

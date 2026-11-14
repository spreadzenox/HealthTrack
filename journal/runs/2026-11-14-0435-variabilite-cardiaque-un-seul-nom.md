# Run 14/11 04:35 — « Variabilité cardiaque » : un seul nom (POLISH-SIM-72) ; iPhone en v1036

**Type** : code (mode polish) et suivi iPhone  ·  **Android** : v1037 sur main après ce run  ·
**TestFlight** : 1030.1031 chez les testeurs externes (depuis le 14/11 à 00:33) ; « iOS — TestFlight » vert sur
a9ed1f9 le 14/11 à 04:23 (code de la v1035 ; numéro non relevé, attendu 1035.1036) ; aucune soumission bêta avant la
nuit prochaine ; 844.344 intacte  ·  **Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main a9ed1f9 : Build & Release, Tests, Play — AAB, iOS — TestFlight et modèles du visage verts ; émulateur A56 et
  « iOS — build simulateur » encore en cours au début du run. Aucune PR « [Auto] » ouverte (#51 `cursor/*` non
  touchée).
- Envoi Alpha du soir du 13/11 : « Play — Alpha (livraison continue) » est parti le 14/11 à 03:41 (cron de 23:45,
  quatre heures de retard), vert, sur 6d028a7 (code de la v1035). Le compte rendu de 03:35 le disait « pas parti à
  04:05 » : c'était faux, le run existait déjà. Numéro de version placé sur Alpha non relevé (log non lu).

## Fait
1. **POLISH-SIM-72** : la mesure s'appelle « variabilité cardiaque » partout, l'abréviation « VFC » disparaît des
   textes de l'app.
   - Aujourd'hui (`today.js`), Tendances (`trendsData.js` : puce, légende et « ce qui change »), normes et radar
     (`baselines.js`, `radar.js`, `HealthRadar.jsx` : minuscule dans la phrase), Analyses (`analysisResults.js`,
     `method/changes.js`), « Ce qui change aujourd'hui » (`dayDeviations.js`), premier import (`firstImport.js`),
     Sources et montre (`deviceCapabilities.js`, `HealthConnectConnector.js`, `huawei/coverage.js`, `watchSync.js`,
     `ble/drivers.js`, `BleDevices.jsx`, `watchGuides.jsx`), divulgation Health Connect (`permissionDisclosures.js`),
     `BaselineCards.jsx`, onboarding.
   - Journal › Jours : tuiles « Variabilité cardiaque » (nuit) et « Variabilité cardiaque, jour » (mesures de journée
     de la montre Huawei).
   - Tendances : la ligne sous la courbe devient « Variabilité cardiaque : mesurée pendant la nuit, en
     millisecondes » (le nom n'a plus à être développé).
   - Test de garde `src/data/hrvName.test.js` : aucun texte de `src/` (hors commentaires, Nouveautés passées et
     journal technique `huawei/sync.js`) ne contient « VFC » ; Tendances, normes et Analyses portent le même nom.
   - Nouveautés : `2026-11-14-0435-variabilite-cardiaque-un-seul-nom.json`.
2. **Suivi iPhone** : `scripts/upstream.sh --latest` : v1035 → v1036 (a9ed1f9, POLISH-SIM-71). Les 52 correctifs
   s'appliquent sans retouche.

## Vérifs
- `npm run test` : 3525 verts, 44 ignorés (14 tests mis à jour pour le nouveau nom, 2 nouveaux ; le test de garde a
  été vu rouge en remettant « VFC » dans `deviceCapabilities.js`). `npm run lint` : 0 erreur. `npm run build` : vert.
- `npm run visual --play` sur `/`, `/journal`, `/tendances`, `/recommendations`, `/connectors` (clair) et `/`,
  `/journal` (sombre), sans erreur JS ; captures regardées :
  [Aujourd'hui clair](captures/2026-11-14-0435-variabilite-aujourdhui-clair.png) ·
  [sombre](captures/2026-11-14-0435-variabilite-aujourdhui-sombre.png) ·
  [Journal clair](captures/2026-11-14-0435-variabilite-journal-clair.png) ·
  [sombre](captures/2026-11-14-0435-variabilite-journal-sombre.png).
- La PR change `iphone/upstream.json` : « iOS — build simulateur » doit être vert avant le merge. Si ce compte rendu
  est sur main, c'était le cas.

## Limites
- **L'iPhone dit encore « VFC »** : le code embarqué est celui de la v1036, et douze correctifs iPhone portent leur
  propre nom (« VFC SDNN » : 08, 13, 17, 19, 20, 21, 30, 32, 45, 53, 56, 57), ainsi que huit tests de l'overlay. Au
  prochain suivi (v1037), les correctifs 17, 30, 56 et 57 au moins ne s'appliqueront plus (vérifié par
  `git apply --check` sur l'arbre de travail) : à refaire avec le nouveau nom (**POLISH-SIM-72-iOS**). La fonction
  n'est donc livrée que côté Android à ce run.
- Journal : la tuile « Variabilité cardiaque, jour » tient sur trois lignes (montre Huawei seulement) ; la tuile de
  la nuit sur deux.
- Analyses n'a pas été vue avec une ligne « Variabilité cardiaque » à l'écran : les données de démo n'ont aucun lien
  net, la liste est repliée. Tendances n'a été capturée qu'avec le bien-être choisi ; le libellé de la puce est
  couvert par `Trends.test.jsx`.
- `npm run visual` complet (18 pages), `--empty` et 360 px non relancés.
- Les Nouveautés passées et le journal technique de la montre (mode diagnostic caché) gardent « VFC ».
- Charte, PRODUIT, BACKLOG et journal iPhone lus par sections, pas en entier (plus de 1 Mo).

## Suite
- Finir cette PR si la build iOS n'est pas verte à la fin du run.
- **POLISH-SIM-72-iOS** au prochain suivi : v1037, correctifs « VFC SDNN » refaits en « variabilité cardiaque ».
- Nuit prochaine, après l'Alpha de 23:45 : soumettre la dernière build TestFlight traitée, puis expirer les anciennes.
- FUSION-2 ; POLISH-SIM-71b, 69 (fin), 77 ; CYCLE-3a-2.

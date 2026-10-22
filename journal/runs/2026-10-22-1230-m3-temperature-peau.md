# 2026-10-22 12:30 Paris (10:30 UTC) — M3 : température de la peau de la montre (classe 400012, réglage 7/0x2A)

**Type** : ⌚ code · **PR** : « [Auto] M3 … » (voir « Après le merge »)

## Pourquoi
- Main à `e71ce00` (#269). Workflows verts (Build & Release v207, Tests, émulateur A56, Play — AAB) ; « Site — GitHub
  Pages » rouge **attendu** (P19). Aucune PR « [Auto] » ouverte (#51 `cursor/*`, pas à nous).
- Run de code. Rien n'indique que P18 (groupe des testeurs) soit fait → pas de piste de test fermé ; suite du
  signalement montre du 21/10 : **M3** (spec `huawei.md` §10.5 et §10.10).

## Ce qui a été fait
- `p2p.js` : `skinTempValues` (champ 400012430, gardé de 20 à 42 °C, arrondi au centième).
- `sync.js` : lecture du dictionnaire généralisée (`DICT_READS` : 500044 puis 400012, un seul ping, une classe en vol) ;
  la température n'est demandée que si la capacité étendue 29 est levée (ou inconnue) ; issue `skinTemp` dans le journal
  (« température de la peau », `0x34 · 400012`) ; entrées `body_temperature` `subtype: 'skin'`, `site: 'wrist'`,
  `watchClass: 400012`, à la minute du début (seule entrée de ce type venant de la montre). Réglage
  `applySkinTempSetting` (7/0x2A : 1 = 1, 2 = 1 / 0), sauté si la commande ou la capacité 29 est absente ; 7/0x2A
  ajoutée à la question des commandes.
- `watchSync.js` : réglage `getSkinTempContinuous` / `setSkinTempContinuous` (localStorage, aucun choix par défaut),
  `pendingSkinTemp` : envoyé à la synchro qui suit un changement (ou un changement de montre), puis plus rien ; issue
  gardée (`applied` / `refused` / `unsupported` …). « N températures de la peau » dans le libellé de la synchro.
- `dailyJournal.js` : `skinTempC` (moyenne du jour) et `skinTempCount`, jamais mêlés à `temperatureC` ; Journal → Jours :
  « Temp. peau ». Les analyses n'utilisaient pas la température : rien à écarter.
- `WatchSkinTemp.jsx` : interrupteur « Mesure continue de la température de la peau » dans la carte montre (désactivé par
  défaut, explication batterie et « pas une température corporelle », état du réglage).
- Démo visuelle : deux températures de peau par jour (valeurs fixes). Nouveautés `2026-10-22-1230-temperature-peau-montre`.
  Spec `huawei.md` §10.12.

## Vérifications
- `npm run test` : **1 847 Vitest verts** (+7 : M3 bout en bout avec VFC + température, sans capacité 29, réglage
  envoyé une fois puis renvoyé au changement, réglage sur montre sans capacité ; journal des jours ; interrupteur).
- `npm run lint` : 6 erreurs, comme avant. `npm run build` OK.
- `npm run visual` (complet) et `--empty` OK ; regardées : Journal → Jours (« Température 36,6 °C » et « Temp. peau
  33,7 °C » côte à côte), Sources (la carte montre n'existe que sur Android : interrupteur vérifié par les tests). Le
  message console sur `/connectors` existait déjà.

## Suite proposée
- Le propriétaire : après la mise à jour, Sources → montre → activer « Mesure continue de la température de la peau »
  (s'il le souhaite), « Synchroniser la montre », puis Journal → Jours (« Temp. peau »). Si rien, exporter le journal de
  la synchro : lignes « température de la peau » (mesures, ou capacité 29 « non ») et « mesure continue … acceptée ».
- Prochain run de code : **M4** (stress `rrisqi` en 0x2C type 0x10, compteur des bits inconnus des minutes pour les
  étages), sauf si P18 est fait (piste de test fermé d'abord).

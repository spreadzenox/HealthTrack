# 2026-10-25 06:33 CET (05:33 UTC) — M4 bis : bits inconnus des minutes (étages ?)

**Type** : ⌚ chantier montre (signalement du 21/10 : couverture maximale ; « pas / distance / calories / étages »)

## Constat au démarrage
- Main à `9a63d5f` (#352, journal v266), aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- Polissage du 24/10 terminé ; POL-1d attend P28 (propriétaire) → étape suivante du backlog : M4 bis (plus petite que M7b).

## Ce qui a été fait
- `sync.js` : `parseMinuteBytes` garde les valeurs des bits non identifiés dans `unknown` (« 1/0x10 »…), jamais
  écrites dans les entrées ; `describeUnknownBits` (une ligne par jour local : minutes, somme).
- `watchSync.js` : la ligne « bits inconnus des minutes (étages ?) JJ/MM : … » part dans le journal de chaque synchro
  (app ouverte et capture d'arrière-plan).
- Spécification `protocoles/huawei.md` §10.18 et ligne « Étages » de l'inventaire §10.
- Pas d'entrée « Nouveautés » : rien de visible hors du journal de diagnostic.

## Vérifications
- Vitest **2 191** verts (+2 : bits inconnus gardés / comptés par jour ; ligne du journal de synchro, rien écrit) ;
  build OK ; lint inchangé (6 erreurs préexistantes) ; `npm run visual` OK ; capture `/montre` relue (inchangée, aucun
  écran touché).

## Suite
- Le propriétaire compare une journée (étages de la montre ↔ ligne du journal) ; on décode alors `floors`.
- M7b : séances relues app fermée (Java) ; POL-1d dès P28.

## Après le merge (#353, `ec0c966`)
- Checks de la PR tous verts du premier coup (Vitest, Build APK, relais, protocole montre Java, perf, émulateurs API 35 et 36).
- Sur main : « Tests », « Build & Release » (**v267**, APK 33 769 292 octets, 33,8 Mo), « Play — AAB » (test interne) et émulateur verts.

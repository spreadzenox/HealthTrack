# Run 12/11 03:35 — Sources : dernières mesures et outil des personas (POLISH-SIM-35)

**Type** : code (mode polish).

## Contexte
- Main 162efc8 (#925), « Build & Release », « Tests », « Play — AAB » et émulateur A56 verts. Aucune PR « [Auto] » ouverte.

## Constat (POLISH-SIM-35, simulations du 10/11)
1. Une persona Galaxy Watch lisait « Jamais reçu : oxygène du sang » : la démo n'a aucune mesure de SpO₂ (artefact de l'outil ;
   PERSONAS.md config. 4 : la Galaxy Watch l'envoie).
2. « Samsung Health » sur un Pixel ou une Amazfit : l'outil n'avait qu'un nom de source par matériel.
3. « Dernières mesures il y a 2 jours » face aux pas d'hier : **défaut de l'app**. Un total du jour Health Connect est daté
   de minuit (début de la journée) ; `summarizeHealthConnectSources` prenait ce début, donc à 14 h les pas d'hier
   (finis à 23:59) donnaient 38 h, arrondies à « il y a 2 jours ».

## Fait
- `src/devices/healthApps.js` : la date d'une source = fin de la mesure (`endDate`, jamais après maintenant) ; tri des
  sources par date réelle (formats ISO mélangés). Tests rouges puis verts (`healthApps.test.js`).
- `scripts/persona/personaData.mjs` : SpO₂ de la nuit pour `watch`, `full` (Health Connect) et `huawei` (en direct),
  rien pour `phone` ni `watch-hrv` (Fitbit, config. 13 ✗) ; `sourceName` facultatif. `persona-browse.mjs` : `--source=`.
  `simulations/README.md` documenté. Tests rouges puis verts (`personaData.test.mjs`).

## Vérifs
- `npm run test` (3461 verts), `npm run lint` (0 erreur), `npm run build`, `npm run visual` (toutes les pages ok ;
  Sources relue).
- Persona Galaxy Watch J14 (`--equipment=watch --goals=care`) : [Sources](captures/2026-11-12-0335-sources-galaxy-watch.png)
  dit « Dernières mesures il y a moins d'une heure · cœur, oxygène du sang… » et « Jamais reçu : cœur au repos,
  variabilité cardiaque » (vrai pour Samsung, PERSONAS.md).

## Suite
- POLISH-SIM-9 (configurations iPhone sur la build iPhone) ; PROP-SIM-11, 12, 13 (maquettes) ; CYCLE-3 attend P48.

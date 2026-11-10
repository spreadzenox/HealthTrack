# Run 10/11 22:35 — Noter ses règles depuis Aujourd'hui (CYCLE-2)

**Type** : code (exception « Ok cycle » au mode polish).

## Contexte
- Main vert (f8e13d3, Build & Release, Tests, Play — AAB, émulateur A56 tous verts). Aucune PR « [Auto] » ouverte.

## Fait
- **CYCLE-2** : bouton « Règles » (goutte, `is-body` rose framboise) dans `AddStrip`, avant « Autre chose », passé par
  `Dashboard` seulement si `cycleVisible` (« Mon cycle » coché, ou une entrée `cycle` existe). Fenêtre « Mes règles »
  (`PeriodSheet.jsx`) : Léger / Moyen / Abondant enregistrent le jour de règles d'aujourd'hui (`periodEntry`, midi
  local) ; « Sans préciser le flux » ; déjà noté : flux coché, « Aujourd’hui, 2e jour des règles », un autre flux met
  à jour la même entrée (`periodEntryOn`, nouveau dans `services/cycle.js`), « Retirer » la supprime. Entrée d'une autre
  source (Health Connect plus tard) : affichée, non modifiable. `health-entries-updated` après chaque geste (le Journal
  relit sa ligne « Règles »).
- Confidentialité : « règles et symptômes du cycle si vous les notez » dans « Ce qui est enregistré, et où » (rien ne
  quitte le téléphone ; Sécurité des données inchangée).
- Nouveautés : `2026-11-10-2235-regles-aujourdhui.json`.

## Vérifs
- TDD : PeriodSheet (5 tests), AddStrip, Dashboard, `periodEntryOn` — rouges puis verts. `npm run test` complet vert
  après correction (un test des tokens refusait une couleur de secours en dur, retirée) ; lint 0 erreur (une erreur
  `set-state-in-effect` corrigée) ; build ; `npm run visual` complet.
- Captures relues : `npm run visual -- --routes=/ --cycle --click=Règles`, clair et sombre
  (`captures/2026-11-10-2235-regles-*.png`). Six gestes dans le bandeau : « Autre chose » défile hors écran, comme prévu
  par AUJ-1b.

## Suite
- CYCLE-2b : « … » sur la ligne « Règles » du Journal (modifier / supprimer), puis symptômes du cycle et « hier » dans
  « Mes règles ».
- Puis POLISH-SIM-38, 40.

# Lot BULLES — étape 10 du brief (Compagnon 2)

Mis à jour : 16/11 21:15 (heure de Paris). PR 1 : #1056.

## Où j'en suis
- **PR 1 (`claude/sprint-bulles-1`)** : l'Accueil a ses bulles, sa jauge et sa première semaine, avec ou sans 3D.
  - `app/src/companion/bubbles/` : `bubbles.js` (une bulle par chose à noter, tirée de la checklist de Ma journée :
    une seule source ; orbite de ile.SPEC § 3 en unités du monde), `mood.js` (« Humeur du jour », plancher
    Tranquille, ne redescend jamais dans la journée, gardée par date dans `localStorage`), `flowers.js` (une fleur par
    geste, déduite des saisies : rien de stocké en plus ; places du jour et prairie des 7 jours), `firstWeek.js`
    (« Jour N sur 7 », même compte que l'onglet Objectifs, 7 cadeaux, carte du 7e jour ; un utilisateur d'avant la
    refonte déjà au-delà de 7 jours ne voit ni barre ni fête), `CompanionHome.jsx` (bulles-boutons, feuille d'action
    Oui/Non, éclatement, bulle-cadeau dorée, bouton « Ouvrir »), `bubbles.css`.
  - Bus du contrat (copie à l'identique de `CONTRAT.md` et `bus.js` du lot SCÈNE, 20:45) : `bubble:pressed`,
    `bubble:popped` (`answer` yes/no/value), `flower:grow`, `flowers:set`, `mood:changed`, `gift:opened`,
    `gift:placed`, `milestone` `day7`.
  - Branchement minimal : `Dashboard.jsx` (vue Accueil, une balise), `tokens.css` (couleurs `--cmp-*`, clair et
    sombre), une note de Nouveautés.
  - Mouvements réduits : `prefers-reduced-motion` (fondus de 200 ms, orbite arrêtée, film figé, coche).
  - Captures : `journal/runs/captures/2026-11-16-sprint-bulles-accueil-{demo,vide,sombre}.png`.

## ⚠ ORDRE DES MERGES AVEC SCÈNE (à relayer, merci)
La PR SCÈNE monte `<CompanionScene />` dans `Dashboard.jsx` juste après l'en-tête ; ma PR monte `<CompanionHome>` au
même endroit, et **CompanionHome monte lui-même la scène** (avec les bulles dans son `overlay`, le `label`, le `name`
et le `mood`). Les deux insertions sont au même endroit exprès : le second merge aura un conflit. **Résolution : garder
la ligne `<CompanionHome …>` seule et retirer `{home && companionSceneEnabled() && <CompanionScene />}`** (sinon deux
îlots). Si SCÈNE merge avant moi, je fais cette résolution moi-même en remettant main dans ma branche.

## Pour le lot SCÈNE (à relayer, merci)
- `CompanionHome` monte **lui-même** `<CompanionScene>` quand il existe et que `companionSceneEnabled()` est vrai :
  `import.meta.glob('../CompanionScene.jsx')` + `import.meta.glob('../flags.js', { eager: true })`. Il lui passe
  `overlay={(stage) => bulles}`, `label` et `mood`. **Donc ne monte pas une seconde `<CompanionScene>` dans
  `Dashboard.jsx`** (sinon deux îlots) ; si tu préfères la monter toi-même, dis-le dans ton fichier de lot et je
  m'adapte (j'exporterai l'overlay).
- J'utilise de `stage` : `project(x, y, z)`, `onFrame(fn)`, `reducedMotion`. L'orbite est en unités du monde
  (rayon 1,86 × 1,25), donc la scène place les bulles avec sa vraie caméra.
- Le doigt sur l'îlot arrête l'orbite (écoute `pointerdown` sur le conteneur de la scène, qui reçoit les événements
  du canevas par propagation) : ne pas les arrêter (`stopPropagation`) dans le canevas, svp.
- Mon `useReducedMotion` local lit seulement le système : je passerai à `companion/motion.js` dès qu'il est sur main.

## Reste à faire (lot BULLES)
- Nuit : bulles restantes en lucioles, « Pilou dort. Le reste peut attendre demain. » (ile.SPEC § 5).
- Jour 14 : grande fleur pêche, « Confort digestif : premier score prêt », `milestone` `day14`.
- Bandeau au défilement (ile.SPEC § 9).
- Nom de Pilou : `pilouName()` du lot VIE dès qu'il est sur main (aujourd'hui « Pilou »).

## Ce que j'attends d'un autre lot
- SCÈNE : `CompanionScene.jsx`, `flags.js`, `motion.js` sur main.
- VIE : `pilouName()`.

# Lot BULLES — étape 10 du brief (Compagnon 2)

Mis à jour : 16/11 22:40 (heure de Paris). PR 1 : #1056, conflit avec #1053 résolu (CompanionHome seule), build iOS relancée. Branche suivante : `claude/sprint-bulles-2` (PR à l'ouverture après #1056).

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
  - Captures : `journal/runs/captures/2026-11-16-sprint-bulles-accueil-{demo,vide,sombre}.png` (îlot dessiné, sans la
    scène) et `…-sprint-bulles-avec-scene-{demo,vide}.png` (intégration vérifiée en local avec `claude/sprint-scene-1`
    fusionnée et le conflit résolu comme ci-dessous : bulles placées par la vraie caméra autour de Pilou).

## Réponse à l'orchestrateur (message de 21:20, règle de merge du sprint)
- Règle reçue et appliquée : merge dès que c'est vert, captures regardées et pas de conflit ; je ne pousse plus sur
  #1056 avant son merge ; la suite est sur `claude/sprint-bulles-2`.
- Jonction avec SCÈNE déjà faite : `CompanionHome` monte `<CompanionScene>` (par `import.meta.glob`) avec les
  bulles dans `overlay`, plus `label`, `name` et `mood`. Vérifié en local avec `claude/sprint-scene-1` fusionnée
  (captures `…-sprint-bulles-avec-scene-*.png`).
- Conflit dans `Dashboard.jsx` avec #1053, quel que soit l'ordre : garder `<CompanionHome …>` seule (elle monte la
  scène), retirer `{home && companionSceneEnabled() && <CompanionScene />}` et ses deux imports. Si #1053 passe
  avant, je le fais une fois dans #1056.
- (Je n'ai pas pu vous répondre par message de session : refus « appareil non approuvé ».)

## Branche 2 (`claude/sprint-bulles-2`, PR après le merge de #1056)
- La nuit : les bulles restantes deviennent des lucioles (cible de 44 px, toujours touchables), « Pilou dort. Le reste
  peut attendre demain. » ; heure lue dans `time:phase` de la scène (`nuit`), sinon 22 h 30 à 5 h.
- Jour 14 : grande fleur pêche (`flower:grow` scale 2,1), `milestone` `day14`, « Confort digestif : premier score
  prêt », une seule fois et seulement pour qui a vu le délai courir.
- Bandeau au défilement (ile.SPEC § 9, en partie) : quand l'îlot sort de l'écran, un bandeau en haut (humeur, pastilles,
  « N bulles à faire ») ramène à l'îlot. L'îlot ne se réduit pas en remontant (version simple).
- Nom : lu dans `life/companionState.js` du lot VIE dès qu'il est là (`import.meta.glob`), sinon « Pilou ».

## Correctif de la PR 1 (budget de lectures)
- Le check « Budget de lectures (perf) » a échoué : l'Accueil lançait le calcul des états du jour (16 206 lectures,
  budget 1 500). Corrigé : relecture du cache, sinon compte léger sur 45 jours (598 lectures en local, budget
  respecté). **Pour tous les lots : ne lancez pas `getAnalysis(...)` depuis l'Accueil.**

## Captures iPhone de #1056 (branche captures/pr-1056, avant le merge de main)
- Accueil en clair, en sombre et vide sur iPhone 16e et 17 Pro : bulles, jauge et barre de la semaine conformes.
- En « grand texte », un mot débordait (« Digestio ») et « Bien-être » se coupait au trait d'union : corrigé dans le
  dernier commit (taille du mot en unités de la bulle, mots jamais coupés).

## Pour le lot SCÈNE (constat, rien de bloquant)
- `webglAvailable()` (`companion/mood.js`) ouvre un contexte WebGL de sonde à chaque montage de la scène, sans le
  libérer (`WEBGL_lose_context`) : une fois, une capture locale a montré « Too many active WebGL contexts ».

## Non fait, pour l'intégrateur
- Retour haptique de la SPEC (appui, éclatement, cadeau) : l'app n'a pas `@capacitor/haptics` ; l'ajouter touche les
  builds natives Android et iPhone, à décider hors sprint.

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

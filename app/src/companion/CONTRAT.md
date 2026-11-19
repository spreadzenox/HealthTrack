# Contrat du compagnon (sprint du 16/11/2026)

Tenu par le lot **SCÈNE**. Les autres lots le lisent et recopient `CONTRAT.md` et `bus.js` **à l'identique** dans leur
branche s'ils en ont besoin avant le merge ; ils ne les modifient jamais. Ce qui manque s'écrit dans
`journal/sprint/LOT-<NOM>.md` ; SCÈNE l'ajoute ici. Le contrat **grandit par ajouts seulement** (jamais de renommage
ni de changement de sens) ; chaque ajout est daté au § 9.

Références : brief `journal/maquettes/compagnon/BRIEF-REFONTE-COMPAGNON.md` (§ 4, § 5, § 7, § 8, § 9), les 5 SPEC de
`journal/maquettes/compagnon/specs/`.

## 1. Qui possède quoi

| Dossier / fichier | Lot | Contenu |
|---|---|---|
| `app/src/companion/` (racine), `scene/`, `CONTRAT.md`, `bus.js` | SCÈNE | canevas three.js, île, lumière, paliers, pause, repli image fixe, `<CompanionScene>`, mouvements réduits, interrupteur |
| `app/src/companion/pilou/` | PILOU | `createPilou(THREE, options)`, expressions, yeux, montre, toucher, images pré-rendues des petits Pilou |
| `app/src/companion/bubbles/` | BULLES | bulles DOM, éclatement, jauge « Humeur de Pilou » (titre : « Humeur de » + le nom choisi), état des fleurs, barre de la première semaine, cadeaux |
| `app/src/companion/life/` | VIE | nourrir, refléter le bien-être, méditer, fin de journée, rencontre et nom, jour 7, Pilou dans Objectifs et Données |
| `app/src/companion/world/` | MONDE | fonctions pures : heure → lumière, météo → décor, semaines → croissance ; widget et notifications |
| `app/src/companion/studio/` | STUDIO | Studio Pilou, fiche de traits locale (IndexedDB), export/import |
| `app/src/companion/photo/` + route pilou de `relay/` | PHOTO | selfie → fiche, derrière un interrupteur éteint |

Fichiers partagés (routes, `Dashboard.jsx`, tokens, onboarding, Réglages) : chaque lot n'y met que son branchement
minimal.

## 2. La scène : `<CompanionScene>` (lot SCÈNE)

`import CompanionScene from '../companion/CompanionScene'` (fichier `app/src/companion/CompanionScene.jsx`).

**Emplacement** : en tête de l'Accueil (`app/src/pages/Dashboard.jsx`, `view="home"`), pleine largeur, au-dessus
des cartes. Rien d'autre ne monte de second canevas WebGL : un seul canevas dans l'app.

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `height` | nombre (px CSS) | `320` | hauteur du héros ; le canevas fait ≤ 360 px CSS de large, centré |
| `mood` | 0…1 | dernière valeur de `mood:changed`, sinon 0 | humeur du jour, transmise à Pilou (`setMood`) |
| `label` | chaîne | « Pilou est tranquille » | étiquette lisible (en bas à gauche de l'île, lue par le lecteur d'écran) ; la scène l'affiche, le canevas est `aria-hidden` |
| `overlay` | `(stage) => ReactNode` | — | couche 4 (avant) : les bulles DOM du lot BULLES, posées par-dessus le canevas (voir `stage`) |
| `quality` | `'auto' \| 'haut' \| 'moyen' \| 'bas'` | `'auto'` | forcer un palier (tests, captures) |
| `reducedMotion` | booléen ou `undefined` | réglage de l'app (§ 6) | forcer les mouvements réduits |
| `onPilouTap` | `(gesture) => void` | — | facultatif ; le geste part aussi sur le bus (`pilou:touched`) |
| `now` | `() => Date` | `() => new Date()` | horloge (tests, captures à heure fixe) |
| `name` | chaîne | `'Pilou'` | le nom choisi (lot VIE), utilisé dans l'étiquette (« Nuage est content ») — ajout du 16/11 21:00 |

**`stage`** (objet passé à `overlay`, stable pendant la vie de la scène) :
- `project(x, y, z)` → `{ x, y, scale, behind }` : position en px CSS dans le conteneur de la scène d'un point du
  monde (unités de l'île : Pilou mesure 1,24, plateau de rayon 1,3 ; centre = pieds de Pilou, +z vers l'écran).
  `behind` vrai si le point est derrière Pilou (z < −0,05). `scale` ≈ 1 au plan de Pilou.
- `onFrame(fn)` → fonction d'arrêt ; `fn({ t, dt })` à chaque image rendue (`t` en ms depuis le montage). Rien
  n'est appelé pendant la pause (hors écran, arrière-plan, palier bas au repos).
- `width`, `height` (px CSS), `quality` (`'haut' | 'moyen' | 'bas'`), `reducedMotion` (booléen), `paused`
  (booléen) : relus à chaque appel (accesseurs).
- `pilouBox()` → `{ x, y, w, h }` en px : la boîte de Pilou à l'écran (aucune bulle ne passe devant son visage).

**Palier bas** (repli) : pas de WebGL, une image fixe de Pilou sur son île ; `overlay` est rendu pareil (les bulles
marchent), `project` utilise la même caméra figée. Le repli s'affiche aussi si WebGL manque ou si three.js ne charge
pas.

**Interrupteur** : `companionSceneEnabled()` dans `app/src/companion/flags.js`. Éteint, l'Accueil est celui d'avant
(aucun canevas, aucun import de three.js).

## 3. Pilou : `createPilou(THREE, options)` (lot PILOU)

Fichier : `app/src/companion/pilou/index.js`, export nommé `createPilou`. La scène le charge par
`import.meta.glob('./pilou/index.js')` : tant qu'il n'existe pas, elle utilise son Pilou simple
(`scene/placeholderPilou.js`), qui a **la même API**. `THREE` est le module `three` (r187) passé par la scène :
PILOU n'importe pas `three` lui-même dans ce fichier (il peut importer `three/addons/...` si besoin).

`options` : `{ quality: 'haut'|'moyen'|'bas', reducedMotion: bool, seed: number, envMap: THREE.Texture|null,
traits: Fiche|null, now: () => Date }`.

Retour (l'**API de Pilou**) :

| Membre | Rôle |
|---|---|
| `object3d` | `THREE.Group` ; pieds à y = 0, regarde +z, hauteur ≈ 1,24 (antenne comprise : × 1,26) |
| `update(t, dt)` | avance l'animation (ms) ; fonction du temps : `update(t)` deux fois de suite donne la même pose |
| `setExpression(name, { fadeMs = 400 } = {})` | un nom de `EXPRESSIONS` (`bus.js`) ; état qui dure |
| `play(name, { onEnd } = {})` | une séquence de `SEQUENCES` (`surpris`, `reveil`, `fier`, `reconfortant`), puis retour à l'état d'humeur |
| `setMood(m)` | 0…1 ; mélange Tranquille → Content → Rayonnant (SPEC personnage § 9) |
| `lookAt(target)` | `'camera'`, `null` (regard libre) ou `{ x, y, z }` (monde) |
| `react(gesture, detail)` | `gesture` ∈ `tap`, `longpress-start`, `longpress-end`, `doubletap`, `swipe`, `tickle` (SPEC personnage § 7) ; `detail` = `{ x, y }` px, `dir` pour `swipe` |
| `jump({ height, side })` | petit saut d'éclatement de bulle ; `side` ∈ `left`/`right` : **côté de l'écran** où était la bulle (le bras de ce côté se lève) |
| `setReducedMotion(bool)` | SPEC personnage § 10 |
| `setTraits(fiche)` | fiche de traits (§ 5) ou `null` = Pilou d'origine |
| `setAccessory(name, on)` | `echarpe`, `parapluie`, `eventail`, `livre`, `montre` (la montre est portée par défaut) |
| `anchors` | `{ head, belly, handLeft, handRight, antennaTip }` : `THREE.Object3D` attachés au corps |
| `hitTest(ndcX, ndcY, camera)` | vrai si le point touche Pilou (boîte + 12 px) |
| `stats()` | `{ triangles, drawCalls }` |
| `dispose()` | libère géométries, matières, textures |

La scène relaie à Pilou : `mood:changed` → `setMood`, `expression:request` → `setExpression`/`play`,
`look:request` → `lookAt`, `traits:changed` → `setTraits`, `reduced-motion:changed` → `setReducedMotion`,
`bubble:pressed`/`bubble:popped` → regard puis `jump`, toucher sur le canevas → `react`, `meal:logged` →
`play`/`setExpression('rassasie')`, `wellbeing:noted` difficile → `play('reconfortant')`, `activity:start` →
`concentre`/`absorbe`, `gift:opened` → `play('surpris')`, `milestone` → `play('fier')`, nuit → `endormi`.
PILOU peut aussi écouter le bus lui-même pour ses détails propres, sans doubler ce que la scène relaie.

**Images pré-rendues** (lots VIE et MONDE) : PILOU les pose dans `app/src/companion/pilou/sprites/`
(`<expression>.webp`, ≈ 240 px de haut, fond transparent) et exporte `pilouSprite(expression)` → URL depuis
`app/src/companion/pilou/sprites.js`. En attendant : `app/src/companion/scene/fallback.webp` (image fixe de la scène). Image fixe
de l'Accueil (palier bas) : `scene/stills/` (croissance × saison, et la nuit quand Pilou dort : `light.asleep`, pas le ciel seul), choisie par `scene/stills.js`, rendue par
`scripts/companion/render-scene-stills.mjs`.

## 4. Les événements du bus

`import { bus, EVENTS } from '../companion/bus'`. Toutes les charges utiles sont des objets simples (sérialisables),
sans donnée de santé brute au-delà de ce qui est écrit ici, sans contenu de repas. `at` = `Date.now()` à l'émission.

| Événement | Émis par | Charge utile | Effet attendu |
|---|---|---|---|
| `bubble:pressed` | BULLES | `{ id, kind, theme, x, y }` | Pilou tourne les yeux vers la bulle (x, y en px dans la scène) |
| `bubble:popped` | BULLES | `{ id, kind, theme, answer, x, y, at }` | regard, saut, bras du côté de la bulle, goutte attrapée (SPEC île § 3) ; `answer` ∈ `yes`, `no`, `value` : même réaction |
| `flower:grow` | BULLES | `{ id, theme, angleDeg, radius, scale, at }` | la scène fait pousser une fleur à cette place (repère de l'île, rayon du plateau = 1), 1 400 ms |
| `flowers:set` | BULLES | `{ flowers: [{ id, theme, angleDeg, radius, scale }] }` | état complet (ouverture, changement de jour) ; sans animation |
| `mood:changed` | BULLES | `{ value, word, done, planned }` | humeur 0…1 (ne redescend jamais dans la journée), mot (« Tranquille »…) |
| `gift:opened` | BULLES | `{ day, item }` | Pilou Surpris ; la scène joue la cérémonie (SPEC île § 7) : la boîte tombe devant Pilou et s'ouvre (≈ 4,5 s) ; BULLES émet `gift:placed` vers 2 100 ms pour que l'accessoire sorte de la boîte |
| `gift:placed` | BULLES | `{ day, item, items, at }` | l'accessoire est à sa place ; `items` = tous les cadeaux reçus (rejouable à l'ouverture) ; la scène anime `item` si `at` a moins de 5 s, sinon pose tout d'un coup |
| `meal:logged` | VIE / Ma journée | `{ slot, count, total }` | `slot` ∈ `breakfast`, `lunch`, `dinner`, `snack` ; jamais le contenu de l'assiette ; Pilou mâchouille puis Rassasié |
| `wellbeing:noted` | VIE / Ma journée | `{ level, difficult, source }` | `level` 1…5, `difficult` = level ≤ 2 → Réconfortant ; `source` ∈ `note`, `face` |
| `habit:noted` | VIE / Ma journée | `{ habitId, answer }` | `answer` ∈ `yes`, `no` : même récompense |
| `gut:noted` | VIE / Ma journée | `{}` | la saisie du ventre (aucune valeur) |
| `entry:undone` | VIE / Ma journée | `{ kind, id }` | « Pilou rembobine » (tour à l'envers), la fleur se referme |
| `activity:start` / `activity:end` | VIE | `{ kind }` | `kind` ∈ `meditation` (Concentré), `reading` (Absorbé) |
| `day:done` | VIE | `{}` | « Plus rien à faire » : Rayonnant |
| `milestone` | VIE / BULLES | `{ kind }` | `day7`, `day14`, `trial-complete`, `week-complete` : Fier |
| `app:opened` | VIE | `{ firstOfDay, morning, awayDays }` | Réveil le matin, sinon Salut ; « Bon retour » après une absence |
| `pilou:named` | VIE | `{ name }` | le nom choisi (lu ensuite par `pilouName()` du lot VIE) |
| `expression:request` | tous | `{ name, mode, source }` | `mode` ∈ `state` (dure), `sequence` (une fois) ; `name` dans `EXPRESSIONS` ou `reveil` |
| `look:request` | tous | `{ target }` | `'camera'`, `null` ou `{ x, y }` px dans la scène |
| `pilou:touched` | SCÈNE | `{ gesture, x, y }` | relayé à `react` ; VIE peut afficher un texte |
| `time:phase` | SCÈNE | `{ phase, light, season, at }` | émis à l'ouverture puis toutes les 5 min ; `phase` ∈ `aube`, `matin`, `midi`, `soir`, `nuit` ; `light` = sortie de `lightAt` ; `season` = sortie de `seasonOf` (hémisphère de la position météo), l'îlot et l'arbuste en prennent les couleurs |
| `weather:changed` | SCÈNE (lit la météo de l'app) | `{ weather, decor }` | `weather` = `{ tempC, precipMmH, windKmH, code }`, `decor` = sortie de `weatherDecor` ; l'étiquette dit la météo |
| `world:news` | SCÈNE | `{ text, at }` | ce qui est nouveau sur l'îlot depuis la dernière visite (`takeWorldNews` : mare, îlot voisin, petit arbre, saison), dit une fois, jamais la nuit ; l'étiquette le dit 6 s et Pilou fait un petit saut |
| `traits:changed` | STUDIO / PHOTO | `{ fiche }` | fiche au schéma de `PILOU-DOUBLE.md` (§ 5), ou `null` = Pilou d'origine |
| `scene:ready` | SCÈNE | `{ quality, frameMs }` | premier rendu fait |
| `scene:quality` | SCÈNE | `{ quality, frameMs, reason }` | changement de palier (`reason` ∈ `mesure`, `webgl`, `force`, `erreur`) |
| `scene:paused` / `scene:resumed` | SCÈNE | `{ reason }` | `hors-ecran`, `arriere-plan`, `onglet` |
| `reduced-motion:changed` | SCÈNE | `{ value }` | booléen effectif (réglage + système) |

Valeurs communes : `kind` d'une bulle ∈ `meal`, `wellbeing`, `gut`, `habit`, `gift` ; `theme` ∈ `THEMES` (`menthe`,
`peche`, `lilas`, `nuit`, `rose`, `gris`, `miel`) ; `item` d'un cadeau ∈ `arbuste` (J1), `lanterne` (J2), `echarpe`
(J3), `galets` (J4), `papillon` (J5), `nuage` (J6), `arc-en-ciel` (J7).

**Règles du bus** : l'émetteur enregistre la saisie **avant** d'émettre (l'animation n'est jamais bloquante) ; aucun
écouteur ne fait d'appel réseau ; toute information portée par Pilou existe aussi en texte ailleurs (brief § 8).

## 5. Le monde : fonctions pures (lot MONDE)

Fichier : `app/src/companion/world/index.js`. La scène le charge par `import.meta.glob('./world/index.js')` ; absent,
elle garde l'heure dorée fixe du § 7.5. Pas de `three` ici : des nombres et des couleurs `'#rrggbb'`.

- `lightAt(date, { wake, bedtime } = {})` → `{ phase, sky: { top, bottom }, sun: { color, intensity, elevationDeg,
  azimuthDeg }, fill: { color, intensity }, hemi: { sky, ground, intensity }, haze, ambreGlow, stars }`
  (`wake`/`bedtime` en minutes depuis minuit ; intensités 0…≈3 ; `ambreGlow`, `stars` 0…1). Contre-jour toujours.
- `weatherDecor({ tempC, precipMmH, windKmH, code })` → `{ effect, label, particles: { kind, count }, accessory,
  skyVeil }` ; `effect` ∈ `pluie`, `neige`, `vent`, `chaleur`, `froid`, `null` (un seul à la fois, SPEC île § 6) ;
  `label` = « Pluie fine · 11 °C » ; `accessory` ∈ `parapluie`, `echarpe`, `eventail`, `null`.
- `growthAt(daysOfUse, date, { hemisphere = 'nord' } = {})` → `{ g, islandScaleXZ, islandScaleY, tufts,
  shrubScale, neighbourIsland, pond, season }` (SPEC île § 8 ; `season` ∈ `automne`, `hiver`, `fin-hiver`,
  `printemps-ete`).

## 6. Réglages partagés (lot SCÈNE)

- **Mouvements réduits** : `app/src/companion/motion.js` — `getReducedMotionSetting()` → `'auto' | 'on' | 'off'`,
  `setReducedMotionSetting(v)`, `isReducedMotion()` (réglage, sinon `prefers-reduced-motion`), hook
  `useReducedMotion()`. Changement → `reduced-motion:changed`. L'interrupteur visible va dans Réglages › Pilou
  (branchement minimal, par le lot qui fait la page Pilou des Réglages).
- **Interrupteur de la scène** : `companionSceneEnabled()` (`app/src/companion/flags.js`).
- Les autres lots gardent leurs propres réglages dans leur dossier (nom de Pilou : VIE ; fiche : STUDIO).

## 7. Données

Rien de ce contrat ne crée de donnée de santé nouvelle. Ce qui est gardé : état des fleurs et des cadeaux (BULLES),
nom (VIE), fiche de traits (STUDIO, IndexedDB, export/import), réglage des mouvements réduits (SCÈNE, `localStorage`).
Chaque lot qui garde quelque chose le met dans l'export JSON et accepte les anciennes sauvegardes sans ce champ.

## 8. Tests

- Chaque lot teste ses fonctions pures et ses émissions avec `createBus()` (ou `bus.clear()` en `afterEach`).
- jsdom n'a pas WebGL : `<CompanionScene>` y rend le palier bas (image fixe + `overlay`). Les tests de BULLES
  peuvent donc monter la vraie scène.
- Les animations sont des fonctions du temps : on les teste image par image (`update(t)`).

## 9. Historique du contrat

- 16/11 20:45 — première version (SCÈNE).
- 16/11 21:00 — `<CompanionScene name>` ; `side` de `jump` = côté de l'écran ; `app/src/companion/mood.js`
  (`moodWord(m)` : « tranquille » < 0,2 ≤ « content » < 0,9 ≤ « rayonnant », `moodExpression(m)`) utilisable par tous.
- 16/11 22:00 — `gift:placed` porte `at` (animation seulement si récent) ; la scène pose les 7 cadeaux en 3D
  (`scene/gifts.js`) et met l'écharpe à Pilou (`setAccessory('echarpe', true)`).

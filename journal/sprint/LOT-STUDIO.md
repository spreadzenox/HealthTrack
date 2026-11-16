# Lot STUDIO — étape 14 du brief (double numérique a, Studio Pilou à la main)

Équipier du sprint du 16/11 (consignes : `journal/sprint/SPRINT.md` de la branche de l'orchestrateur). Branches
`claude/sprint-studio-<n>`, PR « [Sprint STUDIO] … ». Dossier : `app/src/companion/studio/`.

## Où j'en suis
- 16/11 20:45 — règles, brief, PILOU-DOUBLE.md, specs/double.SPEC.md et double/traits.js lus. Branche
  `claude/sprint-studio-1` ouverte depuis origin/main.

- 16/11 21:20 — PR 1 prête (`claude/sprint-studio-1`) : traits et fiche sans 3D, export/import, écran Studio avec
  aperçu peint en 2D, entrée dans Réglages derrière l'interrupteur du compagnon (`companionSceneEnabled()` du lot
  SCÈNE, lu par `import.meta.glob` : tant que `flags.js` n'existe pas ou qu'il est éteint, l'entrée est cachée ; la
  route `/pilou/studio` existe mais rien n'y mène). `CONTRAT.md` et `bus.js` recopiés à l'identique.

- 16/11 21:35 — consigne de l'orchestrateur (21:20) appliquée : pas de push sur #1052 pendant son build. Branche
  `claude/sprint-studio-3` (= studio-2 + `claude/sprint-pilou-1`) : `studio/pourPilou.js`,
  `equiperPilou(THREE, pilou)` pose les pièces sur `kit.body` dans un vinyle satiné tiré de `kit.vinyl`, garde le
  `setTraits` de PILOU (iris), anime, libère, compte les triangles. Testé sur le vrai `createPilou` (budget, place
  sur la tête) ; capture `journal/runs/captures/2026-11-16-sprint-studio-pilou-figurine.png`.

## Plan
1. **Fiche et traits, sans 3D** (`studio/traits.js`, `studio/fiche.js`) : schéma de PILOU-DOUBLE.md § 4, libellés,
   palettes curatées, `normaliser`, `tirer` (« Surprenez-moi »), `compter` ; fiche gardée sur le téléphone, dans
   l'export et l'import JSON (anciens fichiers sans fiche : rien ne change) ; jamais d'âge, de genre, de couleur de
   peau, d'origine ni de santé (test de schéma).
2. **Écran Studio Pilou** dans Réglages (Cheveux · Visage · Yeux · Lunettes · Accessoires, incompatibles grisés avec
   leur raison, « Surprenez-moi », « Valider », « Revenir au Pilou d'origine », bandeaux « À vérifier »), aperçu
   peint en 2D tant que la scène et Pilou ne sont pas sur main ; derrière l'interrupteur du compagnon.
3. **Pièces 3D** (cheveux en vinyle satiné, montures, barbe longue, boucles, couvre-chefs) rebranchées sur le
   rendu figurine par le contrat (`createPilou` du lot PILOU, événement « fiche de traits changée »).

## Pour le lot PHOTO
- La fiche : `app/src/companion/studio/fiche.js` — `saveFiche(fiche)` (normalise, garde dans IndexedDB, émet
  `traits:changed`), `loadFiche()`, `resetFiche()`. Schéma, valeurs et `normaliser()` : `studio/traits.js` (le même
  que PILOU-DOUBLE.md § 4 ; tout champ hors schéma est retiré). La fiche reçue du relais garde son tableau
  `incertains` : le Studio ouvre l'onglet du premier champ incertain et affiche « À vérifier : … ». Après l'analyse,
  enregistrez la fiche puis ouvrez `/pilou/studio`.

## Pour le lot PILOU (rebranchement des traits, brief § 9) — deux petits gestes dans son dossier
1. `pilou/index.js` : `import { equiperPilou } from '../studio/pourPilou.js'` puis `return equiperPilou(THREE, api)`
   à la fin de `createPilou` (les pièces 3D suivent alors `setTraits`).
2. Traits peints (sourcils, taches, grain de beauté, barbe courte, moustache, piercing) : `drawVisage(ctx, S, F, T)`
   appelle `T?.peindre(ctx, X, Y, k, F, phase)` avec `phase` = `sous` (avant les joues), `peau` (après les joues),
   `sourcils` (à la place des sourcils discrets si `T.aSourcils()`), `dessus` (après la bouche) ; `paintFace` passe
   `api.peintreTraits` et ajoute la fiche à la clé de cache (`faceKey(F) + JSON.stringify(fiche)`).
   Je peux faire ces deux gestes moi-même dans une PR après le merge de #1058, si PILOU préfère.

## Ancien détail pour PILOU
- `setTraits(fiche)` du contrat reçoit la fiche (`traits:changed`, rejouée). Le visage peint : `studio/visage.js`
  (`drawFace(ctx, S, F, T)`, repris du kit) avec le peintre `studio/peintre.js` (`creerPeintre()` →
  `set(fiche)`, `peindre(ctx, X, Y, k, F, phase)`, `iris()`, `formeYeux(F)`) : appelez `T.peindre` aux phases `sous`,
  `peau`, `sourcils`, `dessus` dans votre toile du visage, et prenez `T.iris()` pour la couleur de l'iris 3D
  (`fonce`, `clair`, `anneau`). Le profil du corps (H, bodyR, rAtY) : `studio/profil.js`.
- Pièces 3D (cheveux, montures, barbe longue, boucles, couvre-chefs) : PR 2 du lot STUDIO, `studio/pieces.js`,
  `creerPieces({ THREE, toon, ol, body })` comme dans le kit ; je fournis une matière « vinyle satiné » par défaut.

## PR
- (aucune encore)

# Lot STUDIO — étape 14 du brief (double numérique a, Studio Pilou à la main)

## État au 17/11 01:25
- **Sur main** : #1052 mergée à 01:22 (fiche de traits, export et import, écran Studio Pilou, aperçu 2D, pièces 3D,
  Nouveautés). Build iOS vert sur son dernier commit (33a59b01), captures iPhone regardées.
- **En PR** : #1072 (`claude/sprint-studio-4`) — les traits sur le vrai Pilou : `equiperPilou` (pièces 3D sur
  `kit.body`, vinyle satiné) et visage peint (crochet facultatif dans `drawVisage`), robustesse sans toile 2D.
- **Reste** : merger #1072 (empilée sur #1052, désormais sans conflit). Aperçu 3D dans le Studio (question à
  l'orchestrateur, sans réponse : l'aperçu reste peint en 2D).

Équipier du sprint du 16/11 (consignes : `journal/sprint/SPRINT.md` de la branche de l'orchestrateur). Branches
`claude/sprint-studio-<n>`, PR « [Sprint STUDIO] … ». Dossier : `app/src/companion/studio/`.

## Où j'en suis
- 16/11 20:45 — règles, brief, PILOU-DOUBLE.md, specs/double.SPEC.md et double/traits.js lus. Branche
  `claude/sprint-studio-1` ouverte depuis origin/main.

- 16/11 21:20 — PR 1 prête (`claude/sprint-studio-1`) : traits et fiche sans 3D, export/import, écran Studio avec
  aperçu peint en 2D, entrée dans Réglages derrière l'interrupteur du compagnon (`companionSceneEnabled()` du lot
  SCÈNE, lu par `import.meta.glob` : tant que `flags.js` n'existe pas ou qu'il est éteint, l'entrée est cachée ; la
  route `/pilou/studio` existe mais rien n'y mène). `CONTRAT.md` et `bus.js` recopiés à l'identique.

- 16/11 22:25 — SCÈNE (#1053) sur main : conflit de `CONTRAT.md` résolu une fois dans #1052 (version de main),
  et la branche 2 (pièces 3D, `brancherTraits`, apparitions, note de Nouveautés) jointe à #1052, puisque ce push
  relançait de toute façon le build. Suite locale : 3 815 tests verts, lint propre, build OK, captures regardées.
  Reste : `claude/sprint-studio-3` (`equiperPilou`) après PILOU #1058, et les deux gestes dans le dossier PILOU.

- 17/11 00:40 — #1052 : conflits successifs avec main résolus en gardant les deux apports (Réglages et sauvegarde
  avec VIE ; App.jsx et pageStyles.js avec PHOTO et VIE) ; le Studio lit le nom choisi (`companionName` de VIE).
  Builds iOS verts sur b546c729 et 8821608c ; dernier push 00:40, je ne touche plus à la branche avant le merge.
  Suite : PR `claude/sprint-studio-3` (`equiperPilou`) dès que PILOU #1058 est sur main, avant 02:15.

- 17/11 01:00 — branche `claude/sprint-studio-4` (= studio-1 + `claude/sprint-pilou-1` c30faa30) : `equiperPilou`
  appelé par `pilou/index.js` (figurine seulement ; le repli simple n'est pas touché), crochet facultatif `T` dans
  `drawVisage` et `setPeintre` dans `createPilou.js` (branchement minimal dans le dossier PILOU) : les traits peints
  (sourcils, moustache, barbe courte, taches, grain de beauté, piercing) et les pièces 3D sont sur le vrai Pilou.
  Robuste sans toile 2D (Android 12L) : couleurs unies, et `equiperPilou` ne casse jamais Pilou. 281 tests du
  compagnon verts ; capture `journal/runs/captures/2026-11-16-sprint-studio-pilou-traits-peints.png`.
  PR dès que PILOU #1058 est sur main (avant 02:15).

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

## Pour le lot PILOU (rebranchement des traits, brief § 9)
- `setTraits(fiche)` du contrat reçoit la fiche (`traits:changed`, rejouée). Le visage peint : `studio/visage.js`
  (`drawFace(ctx, S, F, T)`, repris du kit) avec le peintre `studio/peintre.js` (`creerPeintre()` →
  `set(fiche)`, `peindre(ctx, X, Y, k, F, phase)`, `iris()`, `formeYeux(F)`) : appelez `T.peindre` aux phases `sous`,
  `peau`, `sourcils`, `dessus` dans votre toile du visage, et prenez `T.iris()` pour la couleur de l'iris 3D
  (`fonce`, `clair`, `anneau`). Le profil du corps (H, bodyR, rAtY) : `studio/profil.js`.
- Pièces 3D (cheveux, montures, barbe longue, boucles, couvre-chefs) : PR 2 du lot STUDIO, `studio/pieces.js`,
  `creerPieces({ THREE, toon, ol, body })` comme dans le kit ; je fournis une matière « vinyle satiné » par défaut.

## PR
- (aucune encore)

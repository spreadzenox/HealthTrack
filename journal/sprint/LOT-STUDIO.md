# Lot STUDIO — étape 14 du brief (double numérique a, Studio Pilou à la main)

Équipier du sprint du 16/11 (consignes : `journal/sprint/SPRINT.md` de la branche de l'orchestrateur). Branches
`claude/sprint-studio-<n>`, PR « [Sprint STUDIO] … ». Dossier : `app/src/companion/studio/`.

## Où j'en suis
- 16/11 20:45 — règles, brief, PILOU-DOUBLE.md, specs/double.SPEC.md et double/traits.js lus. Branche
  `claude/sprint-studio-1` ouverte depuis origin/main.

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
- La fiche : `app/src/companion/studio/fiche.js` (`saveFiche(fiche)`, `loadFiche()`), toujours passée par
  `normaliser` ; la fiche reçue du relais garde son tableau `incertains`, que le Studio affiche « À vérifier ».

## PR
- (aucune encore)

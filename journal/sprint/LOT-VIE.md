# Lot VIE — étapes 11 et 12 du brief (Compagnon 3 et 4)

Sprint du 16/11 20:20 au 17/11 03:00. Dossier : `app/src/companion/life/`. Branches `claude/sprint-vie-<n>`.

## Où j'en suis
- 16/11 20:45 : lecture des règles, du brief, des SPEC journée et comprendre. Contrat de SCÈNE pas encore poussé :
  je commence par ce qui n'en dépend pas (état du compagnon, phrases de Pilou, Ma journée), en 2D avec un Pilou
  provisoire (SVG neutre) en attendant les images pré-rendues du lot PILOU.

## Découpage prévu
1. `claude/sprint-vie-1` (étape 11) : nom du compagnon (« Pilou » par défaut) et son état local ; la bannière de
   Pilou dans Ma journée (hublot, phrase, « Encore N choses ») ; ses réponses aux saisies (repas → rassasié,
   bien-être → le miroir des 5 crans, méditation « Respirez avec moi… », « Non » → « Pas grave, à demain ! »,
   digestion du soir, annulation) ; « Plus rien à faire » et le calme du soir ; « Bon retour » après une absence.
2. `claude/sprint-vie-2` (étape 12) : la rencontre et le nom à l'onboarding (une fois), la montre au temps 2 ;
   rencontre unique pour un utilisateur existant qui met à jour (sans refaire l'onboarding) ; nom dans Réglages ;
   export et import du nom.
3. `claude/sprint-vie-3` (étape 12) : la cérémonie du jour 7 (une fois), Pilou guide discret dans Objectifs,
   petite tête dans Données.

## Ce que j'attends des autres lots
- PILOU : les images pré-rendues des petits Pilou (≈ 240 px, par expression). En attendant : `PilouFigure` (SVG
  neutre) dans `app/src/companion/life/`.
- SCÈNE : `bus.js` et `CONTRAT.md`, pour émettre « repas noté », « humeur », « expression demandée ».

## PR
(aucune pour l'instant)

# Lot VIE — étapes 11 et 12 du brief (Compagnon 3 et 4)

Sprint du 16/11 20:20 au 17/11 03:00. Dossier : `app/src/companion/life/`. Branches `claude/sprint-vie-<n>`.

## Où j'en suis
- 16/11 20:45 : lecture des règles, du brief, des SPEC journée et comprendre. Contrat de SCÈNE pas encore poussé :
  je commence par ce qui n'en dépend pas (état du compagnon, phrases de Pilou, Ma journée), en 2D avec un Pilou
  provisoire (SVG neutre) en attendant les images pré-rendues du lot PILOU.

- 16/11 21:15 : étape 11 codée et testée (branche `claude/sprint-vie-1`) : bannière de Pilou dans Ma journée, ses
  réponses aux saisies, miroir du bien-être dans la feuille de note, fin de journée et calme du soir, « Bon retour ».
  Émissions sur le bus du contrat (`meal:logged`, `wellbeing:noted`, `habit:noted`, `gut:noted`, `entry:undone`,
  `activity:start/end`, `day:done`). `CONTRAT.md` et `bus.js` recopiés à l'identique depuis `claude/sprint-scene-1`.
  Expressions sous les noms du bus. Les correctifs iPhone s'appliquent tous (vérifié avec `git apply` sur l'archive).
  Captures : `journal/runs/captures/2026-11-16-sprint-vie-ma-journee-*.png`.
- 16/11 21:40 : PR #1051 (étape 11) ouverte, CI en cours. Étape 12a codée sur `claude/sprint-vie-2` (partie de
  vie-1) : la rencontre (éclosion, « Passer », « Comment voulez-vous l'appeler ? », « Pilou » proposé, un saut par
  syllabe), étape `meet` de l'onboarding juste après l'ouverture ; Pilou en tête des 4 temps (digestion, montre
  enfilée ou non, « Tout ça, je m'en occupe ») ; pour un utilisateur d'avant la refonte (accueil fini, aucun
  compagnon) la rencontre arrive une seule fois en surimpression, sans refaire l'accueil (`LifeMoments`, monté dans
  Layout) ; `app:opened` et `pilou:named` sur le bus ; Réglages › Pilou (son nom) ; bloc `companion` dans l'export
  JSON, restauré à l'import (ancienne sauvegarde : rien ne change, la rencontre reste à faire une fois ; nouvelle :
  rien n'est rejoué). Testé sur base d'avant la refonte et import d'ancienne sauvegarde (`localHealthStorage.test.js`,
  `companionState.test.js`, `MeetPilou.test.jsx`).
- Pour PARITE.md (intégrateur) : tout est dans le code partagé (WebView), même parcours sur iPhone ; aucun natif.
- 16/11 22:15 : PR #1054 (étape 12a) ouverte. Graines des captures : Pilou déjà rencontré et jour 7 passé dans
  `visual-check.mjs` (options `--meet` et `--ceremony`), `persona-browse.mjs` et le mode captures iPhone
  (`iphone/overlay/app/src/ios/captureMode.js`) : sinon la rencontre recouvrirait toutes les captures. **Pour les
  autres lots** : une capture faite sur une branche partie de main après #1054 sans ces graines montrerait la rencontre.
- Étape 12b codée sur `claude/sprint-vie-3` : cérémonie du jour 7 (une fois ; « déjà passée » pour qui avait déjà son
  premier score à la rencontre ; jamais pendant l'exemple de la visite ; `milestone { kind: 'day7' }`), Pilou guide
  dans Objectifs (84 px, une phrase, aucun chiffre, jamais triste), petite tête dans Données (64 px, décorative).

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

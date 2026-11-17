# Lot VIE — étapes 11 et 12 du brief (Compagnon 3 et 4)

> **État final (17/11 02:10) : lot VIE livré, plus rien en PR.** **Sur main** : étapes 11 et 12 entières (#1060) et
> leur complément (#1067 : cairn des galets dans « Par famille », graine des captures iPhone). **Reste à faire**
> (hors sprint) : rituel du soir et lanternes du défi des 5 soirs (SPEC journée § 7) ; le nom choisi dans
> l'étiquette de l'île de l'Accueil (`Dashboard.jsx` ne passe pas `name` à `<CompanionHome>` : correctif d'une ligne
> décrit le 17/11 00:50 ci-dessous, fichier partagé laissé à l'assemblage).

Sprint du 16/11 20:20 au 17/11 03:00. Dossier : `app/src/companion/life/`. Branches `claude/sprint-vie-<n>`.

## Où j'en suis
- 16/11 20:30 : lecture des règles, du brief, des SPEC journée et comprendre. Contrat de SCÈNE pas encore poussé :
  je commence par ce qui n'en dépend pas (état du compagnon, phrases de Pilou, Ma journée), en 2D avec un Pilou
  provisoire (SVG neutre) en attendant les images pré-rendues du lot PILOU.

- 16/11 20:40 : étape 11 codée et testée (branche `claude/sprint-vie-1`) : bannière de Pilou dans Ma journée, ses
  réponses aux saisies, miroir du bien-être dans la feuille de note, fin de journée et calme du soir, « Bon retour ».
  Émissions sur le bus du contrat (`meal:logged`, `wellbeing:noted`, `habit:noted`, `gut:noted`, `entry:undone`,
  `activity:start/end`, `day:done`). `CONTRAT.md` et `bus.js` recopiés à l'identique depuis `claude/sprint-scene-1`.
  Expressions sous les noms du bus. Les correctifs iPhone s'appliquent tous (vérifié avec `git apply` sur l'archive).
  Captures : `journal/runs/captures/2026-11-16-sprint-vie-ma-journee-*.png`.
- 16/11 20:50 : PR #1051 (étape 11) ouverte, CI en cours. Étape 12a codée sur `claude/sprint-vie-2` (partie de
  vie-1) : la rencontre (éclosion, « Passer », « Comment voulez-vous l'appeler ? », « Pilou » proposé, un saut par
  syllabe), étape `meet` de l'onboarding juste après l'ouverture ; Pilou en tête des 4 temps (digestion, montre
  enfilée ou non, « Tout ça, je m'en occupe ») ; pour un utilisateur d'avant la refonte (accueil fini, aucun
  compagnon) la rencontre arrive une seule fois en surimpression, sans refaire l'accueil (`LifeMoments`, monté dans
  Layout) ; `app:opened` et `pilou:named` sur le bus ; Réglages › Pilou (son nom) ; bloc `companion` dans l'export
  JSON, restauré à l'import (ancienne sauvegarde : rien ne change, la rencontre reste à faire une fois ; nouvelle :
  rien n'est rejoué). Testé sur base d'avant la refonte et import d'ancienne sauvegarde (`localHealthStorage.test.js`,
  `companionState.test.js`, `MeetPilou.test.jsx`).
- Pour PARITE.md (intégrateur) : tout est dans le code partagé (WebView), même parcours sur iPhone ; aucun natif.
- 16/11 20:58 : PR #1054 (étape 12a) ouverte. Graines des captures : Pilou déjà rencontré et jour 7 passé dans
  `visual-check.mjs` (options `--meet` et `--ceremony`), `persona-browse.mjs` et le mode captures iPhone
  (`iphone/overlay/app/src/ios/captureMode.js`) : sinon la rencontre recouvrirait toutes les captures. **Pour les
  autres lots** : une capture faite sur une branche partie de main après #1054 sans ces graines montrerait la rencontre.
- Étape 12b codée sur `claude/sprint-vie-3` : cérémonie du jour 7 (une fois ; « déjà passée » pour qui avait déjà son
  premier score à la rencontre ; jamais pendant l'exemple de la visite ; `milestone { kind: 'day7' }`), Pilou guide
  dans Objectifs (84 px, une phrase, aucun chiffre, jamais triste), petite tête dans Données (64 px, décorative).
- 16/11 21:05 : `PilouFigure` prend les images pré-rendues du lot PILOU dès que `companion/pilou/sprites.js` est sur
  main (`import.meta.glob`, rien ne casse s'il manque) ; essayé avec ses images (capture
  `2026-11-16-sprint-vie-objectifs-sprite-pilou.png`). Le dessin SVG reste le repli.
- 16/11 21:10 : `claude/sprint-vie-4` (partie de vie-3) : Pilou renifle l'assiette pendant l'analyse d'une photo de
  repas (« Pilou regarde votre assiette… »), et attend à côté de la piste à tester (80 px, SPEC comprendre § 6.5).
- 16/11 21:50 : #1051 tout vert (iOS compris, captures iPhone de Ma journée regardées : 17 Pro, 16e grand texte).
  Main a reçu du code entre-temps (MONDE, PHOTO) : chaque mise à jour relance ≈ 1 h de CI. Pour ne passer qu'un
  cycle, **les étapes 11 et 12 partent ensemble** dans une seule PR depuis `claude/sprint-vie-4` (à jour sur main) ;
  #1051 et #1054 sont fermées en sa faveur. Suite complète locale verte sur la branche à jour (3 784 tests), lint,
  build, correctifs iPhone appliqués, tests de la variante iPhone des fichiers touchés verts.
- 16/11 21:55 : PR #1060 (étapes 11 et 12, à jour sur main) : Vitest, APK, émulateurs en cours, build iOS en file
  d'attente. `claude/sprint-vie-5` (partie de vie-4) : le cairn des galets à côté de Pilou dans « Par famille »
  (SPEC comprendre § 6.3 ; capture `2026-11-16-sprint-vie-cairn-galets.png`) ; PR après le merge de #1060.
- 16/11 23:10 : deux redémarrages du conteneur ont coûté ≈ 1 h. #1060 était toute verte sauf le build iOS, resté en
  file d'attente, puis en conflit avec main (`CONTRAT.md` grandi par SCÈNE) : conflit résolu une fois en prenant la
  version de main du contrat (je ne le modifie jamais). Suite complète locale sur la branche fusionnée : un test
  instable de Dashboard trouvé et corrigé à la source (la bannière garde « Encore N choses » pendant une réponse de
  Pilou). Ajout de `pilouName()` (`companion/life/companionState.js`) que le contrat attribue au lot VIE : **SCÈNE
  peut l'utiliser pour l'étiquette « Pilou est tranquille »** (nom choisi par l'utilisateur).
- Consignes de l'orchestrateur appliquées (21:20 et 22:01) : merge dès que c'est vert sans remettre la branche à jour ;
  plus de lignes d'attribution dans mes commits ; corps de #1051, #1054 et #1060 nettoyés (lien de session retiré).
  **À savoir** : la passerelle GitHub de cet environnement ajoute d'office une ligne « Generated by Claude Code »
  (sans nom de modèle ni session) à chaque corps de PR modifié ; je ne peux pas l'enlever.
- 17/11 00:15 : #1060 toute verte (iOS compris) et **fusionnée** (étapes 11 et 12 sur main). En regardant les captures
  iPhone : celle de Ma journée en démo montrait la rencontre. Cause dans le mode captures seulement (pas dans l'app) :
  les captures d'accueil vierge passent avant et créent la clé `halcya_companion` (montre) sans rencontre, et la graine
  ne regardait que l'existence de la clé. Corrigé (on regarde `metAt`), avec un test, dans la PR de `claude/sprint-vie-5`
  (cairn des galets + ce correctif), ouverte après la fusion.
- 17/11 00:50 : **parcours d'un utilisateur d'avant la refonte, relu sur main 42072c6d** (captures/main date d'avant
  #1060 : rejoué en local avec `npm run visual -- --routes=/,/ma-journee --meet`, données de démo, accueil fini, aucune
  clé `halcya_companion`), pour l'assemblage du lot SCÈNE :
  1. À la première ouverture, quelle que soit la page (Accueil ou Ma journée), la rencontre recouvre l'écran :
     éclosion et « Passer », puis « Comment voulez-vous l'appeler ? » (« Pilou » proposé). Une seule fois ;
     l'onboarding n'est pas refait. Pilou y est en 2D (SVG) tant que `companion/pilou/sprites.js` (#1058) n'est pas
     sur main ; il prend les images de PILOU tout seul dès qu'elles y sont.
  2. Après « Valider » puis « Continuer » : l'Accueil normal (île 3D, bulles Repas et Bien-être, « Pilou est
     tranquille · 2 bulles à faire »). Aucune erreur JS.
  3. **Pour l'assemblage** : `src/pages/Dashboard.jsx` monte `<CompanionHome …>` sans `name` : l'étiquette de l'île
     dit toujours « Pilou », même renommé. Fichier partagé, je n'y touche pas. Correctif d'une ligne :
     `name={companionName}` avec `const companionName = useCompanionName()` (hook de
     `companion/life/useCompanionName.js`, qui suit un renommage fait dans Réglages), ou `pilouName()` de
     `companion/life/companionState.js`.
  4. Une capture iPhone d'une autre PR peut encore montrer la rencontre en démo tant que #1067 n'est pas fusionnée
     (défaut du seul mode captures, corrigé dans #1067) : ce n'est pas un bug de l'app.
  Message direct à l'orchestrateur refusé par la plateforme (appareil non vérifié) : tout est donc écrit ici.

## Ce qui reste (hors de ce sprint si le temps manque)
- Les chorégraphies fines de la SPEC (vol de l'assiette, mastication, ondes lilas de la méditation, bouillotte du
  soir, confettis) sont jouées par Pilou en 3D sur l'Accueil (lots SCÈNE et PILOU, via le bus) ; dans Ma journée,
  Pilou 2D en garde une version CSS simple.
- Mini-Pilou de la fiche « Comment est calculé votre bien-être ? » (fait dans vie-4), cairn des galets (fait dans vie-5), rituel du
  soir et lanternes du défi (§ 7) : non faits.
- Réglage visible des mouvements réduits dans Réglages › Pilou : `motion.js` du lot SCÈNE pas encore sur main ; mes
  styles lisent déjà `prefers-reduced-motion` et `:root[data-reduced-motion='on']`.

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
- #1060 (étapes 11 et 12) : fusionnée le 17/11 vers 00:15.
- #1067 (cairn, graine des captures iPhone) : toute verte (iOS compris, captures iPhone regardées : Ma journée en démo
  montre bien la bannière et plus la rencontre), aucun fichier commun avec l'assemblage #1070 ; fusionnée le 17/11 vers 02:10.
- #1051 (étape 11) et #1054 (étape 12a) : fermées, remplacées par la PR unique de `claude/sprint-vie-4`.

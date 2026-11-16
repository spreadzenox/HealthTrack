# Lot SCÈNE (étape 8 du brief : Compagnon 1a, et le socle commun)

## ASSEMBLAGE (confié par l'orchestrateur à 22:40) — essai local du 16/11 22:45
Fusion locale de main + scene-3 + PILOU #1058 + MONDE #1057 + VIE #1060 + BULLES #1056 + STUDIO #1052 + PHOTO #1050 :
lint propre, **3 980 tests verts, 1 rouge à la rencontre**. Rendu de l'Accueil complet : vrai Pilou de PILOU, bulles,
jauge « Humeur du jour », ciel de MONDE (jour, soir, nuit avec Pilou endormi), cadeaux ; thème sombre lisible.
**À relayer aux lots (je n'ai pas pu écrire à l'orchestrateur depuis cette session) :**
1. **BULLES × SCÈNE (rouge)** : CompanionHome monte la scène par `import.meta.glob`, donc `companion/CompanionScene.css`
   n'est plus chargé d'emblée → `src/workers/bundleGuard.test.js` casse. Correctif d'une ligne dans
   `app/src/pageStyles.js` : `import './companion/CompanionScene.css'`. Il sera dans ma PR d'assemblage ; BULLES peut
   aussi l'ajouter dans #1056 pour que « Tests » de main ne soit pas rouge entre deux merges.
2. **VIE × STUDIO (conflit)** dans `app/src/storage/localHealthStorage.js` (VIE ajoute `companion`, STUDIO `pilou` à
   l'export/import) et `app/src/pages/Settings.jsx` (CompanionNameSetting / StudioSetting). Résolution vérifiée chez
   moi : garder les deux — exporter `companion` et `pilou` ; `parseBackup` rend les deux ; à l'import
   `restoreCompanion(companion)` puis `restorePilou(pilou, opts.merge).then(resolve)`.
3. **Copies de CONTRAT.md** (VIE, STUDIO, BULLES) : au conflit, garder la version de main (le contrat ne fait que grandir).
4. **Images fixes** (`scene/fallback.webp`, `fallback-nuit.webp`) refaites avec le Pilou de PILOU : elles partent dans
   ma PR d'assemblage, après le merge de PILOU (sinon on afficherait son Pilou avant son code).
Reste à vérifier quand tout est sur main : parcours de mise à jour depuis une version d'avant la refonte (rencontre
une fois, pas d'onboarding, pas de fête des 7 jours), mouvements réduits, captures de CI des deux côtés, palier
choisi sur le job Android 9 et le simulateur.

## Où j'en suis
- 16/11 20:30 — **Contrat poussé** sur `claude/sprint-scene-1` : `app/src/companion/CONTRAT.md` et
  `app/src/companion/bus.js` (+ `bus.test.js`). Ajout du 21:00 : prop `name`, `side` de `jump` = côté de l'écran,
  `companion/mood.js` (`moodWord`, `moodExpression`).
- Aucune PR « [Auto] » REFONTE-8 trouvée (branches `claude/*` et `auto/*` relues à 20:30) : je pars de origin/main.
- 16/11 21:05 — **PR 1 ouverte** : three.js r187 (MIT, ajouté à LICENCES-TIERCES), `<CompanionScene>` en tête de
  l'Accueil, île (§ 7.6), lumière dorée en contre-jour (§ 7.5 ; ciel abricot en CSS, environnement PMREM généré),
  paliers haut / moyen / bas mesurés (§ 7.9), pause hors écran / arrière-plan / onglet caché, image fixe de repli,
  Pilou simple (corps, yeux, antenne, montre ; même API que `createPilou` du lot PILOU, remplacé automatiquement dès
  que `companion/pilou/index.js` existe), fleurs (`flower:grow`, `flowers:set`), gestes de toucher, bus → Pilou.
  Interrupteur : `localStorage['halcya.companion.scene'] = 'off'` éteint la scène (frein d'urgence).

## Mesures (Chromium sans GPU, SwiftShader : pas un téléphone)
- Palier haut : ≈ 18 600 triangles (île ≤ 12 000 testé, Pilou simple 6 934), 26 appels de dessin, image fixe incluse.
- Poids : `stage` = 779 Ko, **203 Ko compressés** (three.js entier + scène), chargé à la demande, seulement sur l'Accueil.
- Sous SwiftShader, la mesure passe à l'image fixe en 5 images (règle « très lent ») : les captures de la CI montrent
  donc l'image fixe, identique au rendu 3D (même caméra).
- À faire relever (intégrateur) : le palier choisi et le temps d'image sur le job Android 9 et sur le simulateur
  iPhone (événement `scene:ready` / `scene:quality`, ou `data-quality` de `.companion-scene`).

## PR
- **PR 1 #1053 : MERGÉE** le 16/11 à 22:02 (checks verts, émulateurs Android et build iOS ; captures iPhone regardées en
  clair et en sombre). Après le merge : « Tests » de main vert, « Build & Release » v766 publiée (APK 35,0 Mo).
- **PR 2 #1062** (`claude/sprint-scene-2`, ouverte à 22:05) : cadeaux en 3D, cérémonie de la boîte, météo de l'île,
  Réglages › Mouvements de Pilou, et le **correctif de l'étiquette illisible en thème sombre** vu sur les captures
  iPhone de #1053. CI en cours.
- Branche 3 (`claude/sprint-scene-3`, empilée sur la 2 ; PR après le merge de #1062) : image fixe de nuit (Pilou
  endormi sous le ciel de nuit), point ambre comme lumière principale la nuit et clair de lune bleuté, lanterne et
  sommeil pris dans `lightAt` de MONDE (`lantern`, `asleep`), banc qui charge le Pilou du lot PILOU.
- Ancien texte de la PR 1 : `[Sprint SCÈNE] Pilou sur son île : contrat du compagnon et scène 3D de l'Accueil (étape 8)` — CI en cours.
- Branche 2 (`claude/sprint-scene-2`, partie de la 1, PR après le merge de #1053) : les 7 cadeaux en 3D
  (`scene/gifts.js` : arbuste, lanterne qui s'allume le soir, écharpe sur Pilou, galets, papillon sur la perle,
  nuage, arc-en-ciel grand au jour 7 puis petit au-dessus du nuage), boîte de la cérémonie (`gift:opened`), météo de
  l'île (`weather:changed` émis depuis la météo déjà gardée — bloc `current` du lot MONDE s'il a moins de 3 h, sinon
  estimation depuis la journée ; pluie et neige en particules, accessoire de Pilou), herbe plus claire.

## Accord avec BULLES (lu dans LOT-BULLES, 21:15)
- D'accord : `CompanionHome` monte lui-même `<CompanionScene>` ; au second merge, garder la ligne `<CompanionHome …>`
  seule dans `Dashboard.jsx`. Le canevas n'arrête jamais la propagation des `pointerdown`.
- `stage.reducedMotion` suit aussi le réglage au palier bas (corrigé sur la branche 2).

## Pour l'intégrateur (BACKLOG, PRODUIT, PARITE)
- Étape 8 du § 10 : livrée par la PR 1 (Pilou encore simple, comme le prévoit le brief).
- Parité iPhone : même code (WKWebView, WebGL) ; aucun correctif de `iphone/patches/` ne touche `Dashboard.jsx`.
- Nouveautés : `app/src/data/changelog/2026-11-16-2100-pilou-sur-son-ile.json` (les deux magasins).

## Ce que j'attends des autres lots
- PILOU : `app/src/companion/pilou/index.js` qui exporte `createPilou` (CONTRAT § 3). La scène le prend seule.
- MONDE : `app/src/companion/world/index.js` (CONTRAT § 5). D'ici là, heure dorée fixe.

## Pour l'intégrateur
- Étape 8 du § 10 : **livrée** (#1053). Parité iPhone : même code, captures iPhone 16e regardées (Accueil clair et
  sombre) ; défaut d'étiquette en sombre corrigé dans #1062.
- Mesure du palier sur un vrai téléphone : non faite (CI = rendu logiciel → image fixe). À relever par le propriétaire
  ou un testeur (attribut `data-quality` de `.companion-scene`), non bloquant.

## Avec PILOU
- Son `createPilou` (branche `claude/sprint-pilou-2`) suit le contrat ; la scène le prend seule.
- Sous rendu logiciel (CI, appareils très lents), la scène affiche l'image fixe, qui montre encore le Pilou simple :
  dès que PILOU est sur main, je refais `scene/fallback.webp` et `scene/fallback-nuit.webp` avec son Pilou
  (`banc.html` le charge désormais).

## Reste à faire dans mon lot
- Images fixes refaites avec le Pilou du lot PILOU (après son merge).

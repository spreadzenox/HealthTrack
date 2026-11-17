# Lot SCÈNE (étape 8 du brief : Compagnon 1a, et le socle commun)

## EN TÊTE — 17/11 02:12 : LOT FINI
- **Sur main** : #1053 (étape 8 : contrat, bus, scène three.js, île, lumière dorée, paliers mesurés, pause, image
  fixe), #1062 (cadeaux en 3D et cérémonie, météo de l'île, Mouvements de Pilou, étiquette lisible en sombre), #1070
  (assemblage : la nuit lisible, Pilou dort, images fixes avec le Pilou de PILOU), **mergée à 02:09 sous la règle de
  la dernière vague** (build iOS du commit précédent 6bf72be : vert ; le dernier commit ne résolvait qu'un conflit de
  `pageStyles.js` et le journal ; checks rapides, APK et émulateurs Android du nouveau commit : verts). #1065 fermée
  (contenue dans #1070).
- **Plus rien en PR** (sauf cette mise à jour du journal).
- **Reste à faire** (runs suivants) : voir « Laissé écrit, pas branché » et les défauts du lot VIE relevés sur les
  captures iPhone ci-dessous ; mesure du palier sur un vrai téléphone ; regarder la première série de `captures/main`
  produite après la nuit (aucune n'a abouti pendant le sprint : builds iOS de main annulés de merge en merge).

## État du 17/11 01:45
- **Sur main** : #1053 (étape 8 : contrat, scène, île, lumière, paliers, image fixe), #1062 (cadeaux en 3D, météo de
  l'île, Mouvements de Pilou, étiquette lisible en sombre).
- **Assemblage #1070** (`claude/sprint-scene-4`) : contient #1065 (la nuit : point ambre, clair de lune, Pilou dort,
  image fixe de nuit), les images fixes refaites avec le Pilou de PILOU et la fusion de main (conflit de
  `pageStyles.js` résolu en gardant les deux ; `CompanionHome.jsx` : version de main, BULLES fait déjà l'étiquette de
  nuit, mon test en double retiré). Build iOS de 6bf72be attendu, puis merge sous la règle de la dernière vague.
  **#1065 sera fermée** (contenue dans #1070).
- Vérifié sur ce commit (main avec les huit lots + assemblage) : 3 992 tests verts, lint propre ; Accueil en clair,
  sombre, historique vide et la nuit : un seul îlot, vrai Pilou, bulles, jauge, cadeau du jour, « Pilou dort. Le reste
  peut attendre demain. » la nuit, aucune erreur JS (`journal/runs/captures/2026-11-17-sprint-scene-assemblage-final.png`).
- **Captures iPhone de #1070 (commit 6bf72be, build iOS vert)** : l'Accueil des captures est recouvert par la
  rencontre de VIE (« Passer », « Comment voulez-vous l'appeler ? »), alors que `captureMode.js` sème bien
  `halcya_companion.metAt` : défaut du mode captures iPhone, pas du produit (un utilisateur existant doit rencontrer
  Pilou une fois). **Défaut réel, lot VIE** : en thème sombre, la carte de la rencontre garde un fond clair avec un
  texte clair (« Comment voulez-vous l'appeler ? », bulle « Bonjour ! ») : illisible. La capture « vide-accueil »
  iPhone est blanche. Les trois sont à reprendre par VIE / le run suivant (pas de build complet possible avant 02:45).
- **Laissé écrit, pas branché** (un build complet de plus ne tient plus avant 02:45) — à faire par les runs suivants :
  `growthAt` (croissance de l'île au fil des semaines) et `loadWorldContext()` (lever et coucher réels, jours d'usage)
  du lot MONDE dans la scène ; poses du widget re-rendues avec le vrai Pilou ; nom choisi (`pilouName()`) dans le
  widget (`world/widgetSync.js`). La météo (`weatherDecor`) et la lumière (`lightAt`) sont branchées.

## ASSEMBLAGE — complément du 17/11 00:50 (branche de journal `claude/sprint-scene-5`, sans PR)
- **Mise à jour depuis une version d'avant la refonte** (main + SCÈNE 3 + PILOU, `npm run visual -- --meet`) : la
  rencontre de VIE arrive une fois en surimpression (« Comment voulez-vous l'appeler ? »), sans refaire l'onboarding ;
  avec `--ceremony` sur des données de démo (utilisateur ancien), **pas de fête des 7 jours** : conforme.
  Capture : `journal/runs/captures/2026-11-16-sprint-scene-assemblage-rencontre.png`.
- Écart de style, non bloquant : la rencontre montre Pilou en image (sprite du lot PILOU) sur un îlot 2D plat, pas
  l'île 3D de l'Accueil.
- **Captures de main** : la dernière série (`captures/main`) date de 19:53, avant le sprint ; chaque build iOS de main
  du sprint a été annulé par le merge suivant (concurrence). Les captures de référence sont donc celles des PR
  (`captures/pr-1053`, `pr-1062`, `pr-1065`, `pr-1070`). La série de main viendra du dernier merge de la nuit.
- **Palier de qualité choisi** sur le job Android 9 et le simulateur iPhone : non relevé — aucun de ces jobs n'écrit
  `data-quality` ni l'événement `scene:quality` dans ses journaux. Sur les captures iPhone de #1062, la scène est en
  3D (ciel et Pilou animés au rendu du simulateur) ; sur Chromium sans GPU, image fixe. À mesurer sur un vrai
  téléphone (non bloquant).

## ASSEMBLAGE — état au 17/11 00:45
- **PR d'assemblage ouverte** (`claude/sprint-scene-4`), **empilée sur #1065 (SCÈNE 3) et sur #1058 (PILOU)** : à
  merger après elles deux. Elle porte : les images fixes refaites avec le Pilou de PILOU (jour et nuit) ; l'étiquette
  de l'Accueil (BULLES) qui dit « Pilou dort. Le reste peut attendre demain. » quand MONDE dit qu'il dort.
- Vérifié sur main (BULLES, VIE, PHOTO mergés) + SCÈNE 3 + PILOU : 3 933 tests verts, lint propre ; Accueil complet
  (vrai Pilou, bulles, jauge, cadeau du jour, ciel jour / soir / nuit, thème sombre, historique vide) sans erreur JS —
  `journal/runs/captures/2026-11-16-sprint-scene-assemblage-accueil.png`.
- Rencontres déjà réglées par les lots eux-mêmes : CSS de la scène (BULLES l'importe statiquement), VIE × STUDIO
  (STUDIO pas encore mergé : à lui de garder les deux à l'export/import, cf. ci-dessous).
- Reste à vérifier quand STUDIO et MONDE 3 seront sur main : fiche du Studio appliquée sur Pilou dans la scène ;
  parcours de mise à jour depuis une version d'avant la refonte ; captures de main des deux côtés ; palier choisi sur
  le job Android 9 et le simulateur.

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

# Lot SCÈNE (étape 8 du brief : Compagnon 1a, et le socle commun)

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
- PR 1 : `[Sprint SCÈNE] Pilou sur son île : scène 3D de l'Accueil (étape 8)` (voir la liste des PR).

## Pour l'intégrateur (BACKLOG, PRODUIT, PARITE)
- Étape 8 du § 10 : livrée par la PR 1 (Pilou encore simple, comme le prévoit le brief).
- Parité iPhone : même code (WKWebView, WebGL) ; aucun correctif de `iphone/patches/` ne touche `Dashboard.jsx`.
- Nouveautés : `app/src/data/changelog/2026-11-16-2100-pilou-sur-son-ile.json` (les deux magasins).

## Ce que j'attends des autres lots
- PILOU : `app/src/companion/pilou/index.js` qui exporte `createPilou` (CONTRAT § 3). La scène le prend seule.
- MONDE : `app/src/companion/world/index.js` (CONTRAT § 5). D'ici là, heure dorée fixe.

## Reste à faire dans mon lot
- Cérémonie des cadeaux en 3D (`gift:opened`, `gift:placed`) et accessoires posés sur l'île.
- Météo réelle → `weather:changed` (lecture de la météo de l'app) relayée au décor de MONDE.
- Réglage visible des mouvements réduits dans Réglages › Pilou (si aucun autre lot ne fait la page).

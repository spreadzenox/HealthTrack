# 2026-10-20 00:30 Paris (22:30 UTC le 19/10) — Humeur estimée robuste aux dérives lentes (I121 + I121 étendu)

**Type** : 🔴🙂 bien-être automatique (consigne du 19/10 au soir, charte §0000000)  ·  **PR** : voir le tableau du résumé

## Pourquoi
- Vérifications de début de run : main à `b277e1b` (#224, étape 1 de la consigne du soir) ; aucune PR « [Auto] »
  ouverte ; signalement du 19/10 15:05 corrigé et fusionné (#221) ; rien de nouveau dans `journal/diagnostics/`
  (diagnostic de l'A56 pas encore revenu) ; pas de modèle valence / éveil choisi (comparatif prévu au run idées de
  08:30). Le compte rendu de 22:30 proposait pour le run de code suivant : **I121 étendu à la calibration personnelle**.
- Depuis l'étape 1, la porte (I112) ne bloque plus l'affichage, mais elle reste ce qui dit « votre visage suit vos
  notes » et — c'est l'objet de ce run — ce qui autorise le **modèle personnel**. Une humeur estimée qu'on peut croire
  passe avant un modèle plus fort (D5).

## Ce qui a été fait
- `mood/blockCv.js` (nouveau, fonctions pures) : `blockedRidgePredictions` (Ridge apprise sans les jours à ≤ 7 jours,
  par retrait du Gram complet : O(voisins × k²) par jour ; repli sur la moyenne d'apprentissage sous 20 jours),
  `blockedMeanPredictions`, `lag1Autocorrelation` (paires de jours consécutifs, trous ignorés), `sharedAutocorrelation`
  (a = max(0, r1(x)) × max(0, r1(y))), `effectiveZ` (z × √((1 − a)/(1 + a))).
- `mood/gate.js` : `faceIndexLoo` validé par blocs ; z de l'accord corrigé par a ; **`detrendFace` adaptatif** (écart à
  la moyenne des 14 jours **précédents**, passé seulement) quand la dérive médiane des indices du visage
  (`faceDrift`) dépasse 0,5 ; `evaluateGate` rend `a`, `drift`, `detrended`.
- `mood/calibration.js` : `calibrateRidge(X, y, { dayNums })` → validation croisée par blocs (λ et comparaison à la
  moyenne des mêmes jours d'apprentissage). `mood/faceMood.js` : `personalCalibration` exige **la porte réussie** puis
  la Ridge par blocs.
- Diagnostic exporté : `gate.a`, `gate.drift`, `gate.detrended` (comptes et coefficients, jamais une humeur) ; ligne
  « Dérives lentes : visage X d'un jour à l'autre (comparé à ses 14 jours précédents), z corrigé pour a = Y ».
- Nouveauté `2026-10-20-0030-humeur-derives-lentes.json` (corrige aussi « 14 jours » de l'entrée de 22:30).

## Simulations (200 jeux, 120 jours, ~80 % des jours notés, 6 indices dont un lié à l'humeur)
| Humeur AR / visage AR | Faux départs avant | Blocs + n effectif | + détrendage adaptatif |
|---|---|---|---|
| 0 / 0 (jours indépendants) | 0,5 % | 1 % | 1 % |
| 0,6 / 0,6 | — (12,7 % au run idées) | 1 % | 1,5 % |
| 0,8 / 0,95 | 12,5 % | 7 % | **2,5 %** |
| 0,6 / 0,95 | — | 4,5 % | 3 % |

Puissance (lien 0,7, ouverte à J90) : 83 % sans dérive (inchangée ; le détrendage systématique la faisait tomber à
71 %, d'où le seuil adaptatif) ; avec dérives 0,6 / 0,6 ou 0,8 / 0,95 : ≈ 35–38 % — une humeur qui dure contient moins
d'information indépendante, c'est le prix de l'honnêteté.

**Modèle personnel trompé** (60 jeux, 90 jours notés, humeur AR 0,8, visage AR 0,95, **aucun lien**) : adopté dans
**60 %** des cas en LOO simple, 25 % avec les blocs seuls, **≤ 5 %** avec blocs + porte réussie (test
`faceMood.test.js`). Un modèle avec un vrai lien fort est adopté à 50 jours notés (test mis à jour : 40 → 50 jours).

## Tests (TDD : rouges avant le code)
- `gate.test.js` (+4) : cas AR(1) (0,6 / 0,6) et (0,8 / 0,95) < 3 % ; `a` exposé ; `detrendFace` sans fuite de
  l'avenir ; `faceDrift` (série lisse / bruit). Générateur `simulateDays({ phiMood, phiFace })` ; test des regards
  daté par `today` (la séquence aléatoire a changé).
- `blockCv.test.js` (nouveau, 7) : exclusion du bloc, repli sur la moyenne, égalité avec une Ridge apprise à la main,
  autocorrélations, z effectif.
- `faceMood.test.js` (+1) : dérives sans lien → modèle personnel ≤ 5 %. `faceSense.test.js` : export / ligne I121.

## Vérifications
- `npm run test` : **1 573 tests verts** (120 fichiers). `npm run lint` : 6 erreurs, identiques à main. Build ✅.
- `npm run visual` (toutes les pages) ✅ ; `--routes=/connectors --face --click=Diagnostic` : captures lues (carte et
  diagnostic inchangés à 9 jours comparables ; la ligne « Dérives lentes » n'apparaît qu'à partir de 30 jours).

## Apprentissages / décisions
- **Ne jamais adopter un modèle personnel sur un LOO simple quand les jours se suivent** : l'autocorrélation suffit à
  fabriquer un « gain ». Règle : toute validation croisée sur des séries quotidiennes de l'utilisateur passe par
  `blockCv.js`.
- Un seul juge pour « le visage suit vos notes » : la porte. Le modèle personnel n'a plus de critère à part qui
  pourrait le contredire dans la carte.
- Le détrendage n'est pas gratuit (−12 points de puissance sans dérive) : adaptatif, seuil 0,5, à revoir quand l'A56
  aura 30 jours comparables (`gate.drift` dans le diagnostic).

## Pour le propriétaire (Galaxy A56)
Rien de nouveau à tester pour ce run (changement de calcul, invisible tant qu'il n'y a pas 30 jours notés). Le
**diagnostic de la Lecture du visage reste attendu** (voir « À faire en premier » du résumé).

## Suite proposée
1. 📥 Diagnostic de l'A56 dès qu'il arrive (arbre I122).
2. 💡 Run idées 20/10 08:30 : comparatif des modèles valence / éveil embarquables, **licence des poids**.
3. 🙂 Run de code suivant : I123 « Applis jamais en veille » (Samsung) ou I124 sonde vocale, puis étape 2.

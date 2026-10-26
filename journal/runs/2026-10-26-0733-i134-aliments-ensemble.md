# Run du 26/10/2026 07:33 (Paris, CET) — I134 étape 3 : aliments du même jour estimés ensemble

**Type** : 🏗️ jalon 5 (changement visible dans les détails d'une piste : entrée « Nouveautés »
`2026-10-26-0733-aliments-ensemble.json`)

## Constat au démarrage
- Main à `55fc028` (#389) ; Build & Release, Play — AAB, Tests, émulateur verts. Aucune PR « [Auto] » ouverte
  (#51 `cursor/*` non touchée). Suite prévue : I134 étape 3.

## Ce qui a été fait
- `gutDays.js` : `adjustForCoEaten` — après BH et la porte TTS, les pistes gardées sont reprises de la plus nette
  (p le plus petit) à la moins nette ; chacune est recomparée (Mantel-Haenszel) dans les strates déjà utilisées
  (blocs × covariables) **croisées avec l'exposition aux pistes déjà gardées**. Elle reste une piste si son p ajusté
  ne dépasse pas le seuil BH qui l'avait fait passer et si assez de blocs restent informatifs ; sinon `no_link` +
  `explainedBy` (l'aliment gardé qui l'accompagne le plus). Option `adjustFoods` pour le banc. Ne peut que retirer
  des pistes : le banc des nulles ne peut pas se dégrader.
- `settleTwins` recopie aussi `explainedBy` sur les jumeaux.
- `gutLinks.js` : `oftenWith` (aliments écartés par cette piste) ; `GutLinks.jsx` : dans les détails, « Souvent
  mangé avec : ail. Comparé à part, il ne ressort pas à lui seul. »

## Mesure (journaux synthétiques 13 semaines, 60 jeux, oignon ×6, ail avec l'oignon 80 % des jours, seul 15 %)
| Scénario | Oignon sans / avec | Ail sans / avec |
|---|---|---|
| Seul l'oignon joue | 50 / 49 | **23 / 1** |
| Ail encore plus lié (90 % / 10 %) | 51 / 46 | **38 / 6** |
| Les deux jouent (ail ×4) | 58 / 43 | 58 / 16 |
| Oignon seul, ail indépendant | 50 / 50 | 0 / 0 |
| Rien ne joue | 0 / 0 | 1 / 1 |

Quand les deux jouent et se mangent presque toujours ensemble, les données ne peuvent pas les départager : une seule
des deux reste en piste et l'autre est rappelée dans « Souvent mangé avec » (au moins une des deux montrée dans
58/60 jeux). C'est le prix honnête de la prudence.

## Tests
- `gutDays.test.js` (+4) : piège ail (≥ 15/60 → ≤ 3/60 ; ≤ 8/60 au 90 %), puissance de l'oignon gardée,
  `explainedBy`, résultat identique sans aliment associé, l'ajustement ne fait jamais apparaître de piste (nulles).
- `gutLinks.test.js` (+1) : `oftenWith` ; `GutLinks.test.jsx` (nouveau, 2) : ligne dans les détails seulement.

## Vérifications
- `npm run test` : 187 fichiers, 2 300 verts (+ 33 sautés) ; `npm run build` OK ; lint 6 erreurs (inchangé) ;
  `npm run visual -- --routes=/recommendations --gut-links --click="Afficher les détails"` : 0 erreur JS, piste de
  démo inchangée (pas d'aliment partiellement associé dans la démo).

## Suite
- I134 étape 4 (facultatif) : même ajustement dans `gutWindows` (notes horodatées). Sinon jalon 5 suivant
  (I135 / I171 c) ; POL-1d attend P28.

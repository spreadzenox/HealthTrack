# Run du 29/10/2026 11:33 (Paris, CET) — Fructanes des céréales et pains complets (N3f, 1ʳᵉ partie)

**Type** : 🔬 Code (chiffres fiables, demande du propriétaire du 26/10 14:45)

## Constat au démarrage
- Main à `a68699b` (#499), tous les workflows verts ; aucune PR « [Auto] » ouverte (PR #51 `cursor/*` non touchée).
- Prochaine étape d'après le run de 10:33 : N3f.

## Fait
- Supplément MOESM1 de Liljebo 2020 relu (PDF, hors dépôt) : tableaux 1 et 3 (fructanes) et 6 (polyols).
- `scripts/nutrition/liljeboFructans.mjs` (générateur reproductible, `--write`) : 23 entrées `fructans`, source
  `liljebo2020` : 10 `citée` (ail cru 17,4 d'après Muir 2007, remplace la citation de seconde main Wang & Cheong ;
  topinambour cru et cuit 12,2 ; son de blé 3,7 et germe 2,25 et semoule 2,25 d'après Haskå 2008 ; pain complet T150
  0,79 d'après Whelan et Biesiekierski ; pain complet au seigle 1,14 et seigle complet 3,52 d'après Andersson 2009) et
  13 `analogie` (couscous cuit 1,0, semi-complet 1,04, complet 0,86 et boulgour cuit 0,73 ramenés par le rapport des
  glucides Ciqual cuit / sec ; ail grillé, rôti et en poudre de même ; boulgour cru 2,0, « valeur du couscous » chez
  Liljebo ; pain de mie et bun complets ; pain seigle et froment ; farine de seigle T170 ; tartine croustillante de
  seigle 3,2) ; pain bis = fourchette du pain blanc (0,14 Ferjančič – 1,02 Liljebo).
- Écartés : pain grillé au blé complet et petits pains suédois (plus secs, non mesurés), farines T85 / T130, plats
  cuisinés (couscous royal…).

## Bilan chiffré (3 484 aliments hors alias)
| | Avant | Après |
|---|---|---|
| Fructanes connus | 573 | 595 |

Ce que le propriétaire verra : 60 g de pain complet (0,47 g) ou 150 g de couscous cuit (1,5 g) → « Probablement riche en
fructanes » (confiance basse : valeur citée) ; ces repas comptent dans la piste fructanes → ventre ; le pain bis n'est
plus « inconnu » et jamais « bas ».

## Tests
- `liljeboFructans.test.mjs` (5 : générateur = fichier livré, noms non alias et confiance basse, référence primaire
  et teneur ≤ glucides + fibres, sec → cuit, ail et pain bis) ; 1 neuf dans `fodmapGroups.test.js` (pain complet via
  l'alias, couscous, boulgour, pain bis, topinambour).

## Vérifications
- `npm run test` vert (2 677), `npm run build` OK, `npm run lint` 6 erreurs (comme avant), `npm run visual` sans
  erreur ; capture Journal relue (inchangée : seules les données changent).

## Demandes iOS
- Rien de propre à Android : note de Nouveautés sans `variants`.

## Suite
- N3g (polyols Liljebo : pruneau, abricot sec, mûre, prune, chou-fleur, pois mange-tout, champignon), N2c (fer de
  l'oignon), puis la suite de POL-PLAY-12.

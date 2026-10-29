# Run du 29/10/2026 12:33 (Paris, CET) — Polyols des fruits et légumes (N3g)

**Type** : 🔬 Code (chiffres fiables, demande du propriétaire du 26/10 14:45)

## Constat au démarrage
- Main à `90cd0bf` (#500), aucune PR « [Auto] » ouverte (PR #51 `cursor/*` non touchée).
- Prochaine étape d'après le run de 11:33 : N3g.

## Fait
- Supplément MOESM1 de Liljebo 2020 relu (PDF, hors dépôt), tableau 6 : références primaires confirmées (prune,
  pruneau, abricot sec, abricot : Yao 2014 ; mûre, chou-fleur, champignons, pois mange-tout, nectarine : Muir 2009).
- `scripts/nutrition/liljeboPolyols.mjs` (générateur reproductible, `--write`), règle « Ciqual d'abord » vérifiée par
  le générateur lui-même (part du total si Ciqual mesure les polyols, teneur citée sinon) : 14 entrées
  - `citée` : prune crue 2,4 g sorbitol ; pois mange-tout cru 1,16 g mannitol ; analogie : prune violette 2,4 ;
  - `share: 1` sorbitol (analogie) : mirabelle 2,7, reine-claude 2,3, abricot sec 22,6 et moelleux 17,6, abricots au
    sirop égouttés ×3 (0,39–0,42) ;
  - `share: 1` mannitol (analogie du cru, MEXT) : champignon de Paris sauté 3, bouilli 0,4, surgelé 0,5, appertisé 0,4.
- Note ajoutée à l'abricot cru (MEXT 0,3 gardé ; Liljebo 1,2 au-dessus du « < 0,5 » Ciqual, non retenu).
- Écartés : mûre 4,76, chou-fleur 2,96, avocat 0,65, nectarine 1,01 (Ciqual « < 0,5 » : contradiction) ; poivron
  0,37 et maïs 0,45 (sous-groupe non indiqué, Ciqual mesure) ; pruneau sec (déjà couvert : Ciqual 9,6 ≈ Liljebo 10,8) ;
  pois mange-tout cuits, pruneau cuit, jus de pruneau (non mesurés).
- Écart signalé : abricot sec, Ciqual 22,6 g de polyols contre 6,0 g de sorbitol chez Liljebo ; le total Ciqual est
  gardé (règle), le niveau reste « élevé » dans les deux cas pour une portion de 30 g.

## Bilan chiffré (3 484 aliments hors alias)
| | Avant | Après |
|---|---|---|
| Sorbitol connu | 2 860 | 2 869 |
| Mannitol connu | 2 856 | 2 861 |

Ce que le propriétaire verra : 100 g de prune → « Riche en sorbitol : prune » (confiance basse : valeur citée) ;
pois mange-tout crus → mannitol ; ces repas comptent dans les pistes sorbitol / mannitol → ventre.

## Tests
- `liljeboPolyols.test.mjs` (4 : générateur = fichier livré ; Ciqual d'abord et confiance basse ; prune, pois
  mange-tout, abricot sec, mirabelle, champignon sauté et niveau d'un repas ; contradictions non ajoutées).

## Vérifications
- `npm run test` vert (2 681), `npm run build` OK, `npm run lint` 6 erreurs (comme avant), `npm run visual` sans
  erreur ; capture Journal › Repas relue (inchangée : seules les données changent).

## Demandes iOS
- Rien de propre à Android : note de Nouveautés sans `variants`.

## Suite
- N2c (fer de l'oignon), puis la suite de POL-PLAY-12.

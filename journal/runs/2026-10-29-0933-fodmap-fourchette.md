# Run du 29/10/2026 09:33 (Paris, CET) — FODMAP : une fourchette quand les mesures publiées divergent (N3d)

**Type** : 🔬 Code (chiffres fiables, demande du propriétaire du 26/10 14:45)

## Constat au démarrage
- Main à `b74eb3b` (#497), tous les workflows verts ; aucune PR « [Auto] » ouverte (PR #51 `cursor/*` non touchée).
- Prochaine étape d'après le run « idées » de 08:33 : N3d, à faire avant les testeurs.

## Fait
- Valeurs relues dans le supplément de Liljebo 2020 (PDF MOESM1, hors dépôt) : « White bread fiber 5 % » 1,02 g/100 g
  (réf. 11, Whelan 2011, tableau suppl. 1) ; « Onion » 6,30 et « Leek » 3,80 (réf. 3, Muir 2007, tableau suppl. 3).
  La note de l'oignon disait « d'après Muir 2009 » : corrigé en Muir 2007.
- `fodmapMeasurements.json` : source `liljebo2020` (CC BY 4.0, données CC0) ; `g_high` / `source_high` / `ref_high`
  sur pain blanc, pain de tradition, poireau, oignon (cru, jaune, rouge).
- `fodmapGroups.js` : `fodmapPer100g` garde la borne haute (`high`, `sourceHigh`) ; `estimateMealFodmap` additionne
  les bornes hautes ; nouveau niveau `probable` (borne haute ≥ repère, basse dessous) ; jamais `bas` dans ce cas ;
  `highFodmapGroups` compte `probable` (facteurs des pistes repas → ventre, `fodmap_groups`, `fodmap_score`) et trie
  sur la borne haute ; `mealFodmapHighlights` renvoie `high` et cite les deux sources.
- `MealFodmapLine` : « 0,11 à 0,82 g selon les mesures publiées · repère 0,3 g par repas » sous le chevron ;
  « Teneurs : Ferjančič 2024, Liljebo 2020. »
- Nouveautés : « Pain, poireau, oignon : des fructanes plus honnêtes ».

## Ce qui change pour le propriétaire
| Repas | Avant | Maintenant |
|---|---|---|
| 80 g de baguette | bas (0,11 g) | probablement riche (0,11 à 0,82 g) |
| 100 g de poireau | bas (0,24 g) | probablement riche (0,24 à 3,8 g) |
| 40 g d'oignon | élevé (0,79 g) | élevé (0,79 à 2,5 g) |
| 5 g d'oignon | bas | probablement riche (0,1 à 0,32 g) |
| 20 g de pain | bas | bas (0,03 à 0,2 g) |

## Tests
- 8 neufs (fourchette dans `fodmapPer100g`, niveaux `probable` / `bas` / `élevé` selon la portion, table livrée,
  contrôle des bornes hautes : > 2 × la basse, source et référence, ≤ glucides + fibres), 3 mis à jour (chevron de
  l'oignon, 5 g → 4 g d'oignon dans deux tests de Food).
- Contrôle ajusté : la borne haute de l'oignon (6,3) dépasse ses glucides Ciqual (6,25) ; les fructanes sont des
  fibres pour Ciqual, d'où le plafond « glucides + fibres » (7,95).

## Vérifications
- `npm run test` vert, `npm run build` OK, `npm run lint` 6 erreurs (comme avant), `npm run visual` sans erreur ;
  captures Journal › Repas relues (ligne pêche inchangée ; la démo n'a ni pain ni oignon).

## Vu en passant
- **N2c** : `Oignon, cru` a 0,00019 mg de fer dans la table (attendu ~0,2 mg) : à relire dans Ciqual 2025.

## Demandes iOS
- Rien de propre à Android : la note de Nouveautés vaut pour les deux plateformes (pas de `variants`).

## Suite
- N3e (aliments courants de Ferjančič 2024, « ND » en limite), puis N3f ; poursuivre POL-PLAY-12.

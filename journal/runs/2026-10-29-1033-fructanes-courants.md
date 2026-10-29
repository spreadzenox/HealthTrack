# Run du 29/10/2026 10:33 (Paris, CET) — Fructanes des aliments courants (N3e)

**Type** : 🔬 Code (chiffres fiables, demande du propriétaire du 26/10 14:45)

## Constat au démarrage
- Main à `765d652` (#498), tous les workflows verts ; aucune PR « [Auto] » ouverte (PR #51 `cursor/*` non touchée).
- Prochaine étape d'après le run de 09:33 : N3e.

## Fait
- Tableau 1 de Ferjančič 2024 relu dans l'article (CC BY 4.0) : 20 lignes reprises (carotte 0,11 ; tomate, laitue,
  courgette 0,01 ; poivron, brocoli 0,02 ; chou 0,03 ; chou-fleur 0,09 ; polenta cuite 0,04 ; orge mondé 0,47 ;
  petits pois en conserve 0,33 ; haricots verts 0,03 ; haricots en conserve 0,24 ; « ND » : chou-rave, concombre,
  cornichon, pomme de terre cuite, frites, riz cuit, pétales de maïs).
- **Limite des « ND »** : l'article la donne en absorbance (≤ 0,02), pas en grammes. Borne haute prudente : 0,3 % de
  matière sèche (≈ 4 × la plus petite teneur quantifiée, polenta 0,07 % MS, les prises d'essai variant de 0,1 à 0,4 g),
  ramenée au frais par l'eau de l'article (riz cuit < 0,063 g/100 g ; « / » : 0,3).
- `scripts/nutrition/ferjancicFructans.mjs` (générateur reproductible, `--write`) : 49 entrées `fructans`
  (21 `mesure`, 28 `analogie` : variétés proches et cuisson à l'eau ou vapeur d'un légume mesuré cru, teneur du cru
  reprise, estimation plutôt haute). Écartés : pomme de terre au four (eau non publiée), choucroute et navet aigre
  (pas d'équivalent Ciqual sans garniture), chips (« nature ou aromatisées » : oignon possible), pain bis (à faire avec
  N3f et sa borne haute, sinon faux « bas » comme le pain blanc avant N3d).
- `fodmapGroups.js` : une mesure `{ g: 0, lt }` compte 0 avec la limite en `max` (comme un « < x » Ciqual) ; et
  fructanes et GOS valent 0 quand Ciqual donne glucides et fibres nuls (viandes, poissons, œufs, huiles : 504 aliments).

## Bilan chiffré (aliments de la table hors alias : 3 484)
| | Avant | Après |
|---|---|---|
| Fructanes connus | 20 | 573 |
| GOS connus | 19 | 523 |

Ce que le propriétaire verra : « poulet, riz, carottes » passe de « inconnu » à « pauvre en fructanes » (pistes
repas → ventre, calendrier du rapport PDF) ; 100 g de petits pois en conserve → « Riche en fructanes ». Rien ne change
sur les repas de démo à l'écran (la ligne pêche ne montre que les groupes riches).

## Tests
- 5 neufs dans `fodmapGroups.test.js` (règle glucides + fibres nuls, « ND » bas à 250 g et inconnu à 600 g de riz,
  repas « poulet, riz, carottes » `bas` sans aliment inconnu, petits pois en conserve `élevé`, contrôle des `lt`) ;
  `ferjancicFructans.test.mjs` (5 : limite, générateur = fichier livré, noms Ciqual non alias, rien de rôti ou aromatisé).

## Vérifications
- `npm run test` vert (2 671), `npm run build` OK, `npm run lint` 6 erreurs (comme avant), `npm run visual` sans
  erreur ; captures Journal › Repas relues (inchangées).

## Demandes iOS
- Rien de propre à Android : note de Nouveautés sans `variants`.

## Suite
- N3f (Liljebo 2020 : fructanes des céréales, pain bis et complet avec borne haute, polyols des fruits), N2c (fer de
  l'oignon), puis la suite de POL-PLAY-12.

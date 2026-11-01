# Run du 01/11/2026 04:33 (Paris, CET) — Textes : anciennes Nouveautés (SLOP-1e)

**Type** : ✍️ textes (demande du propriétaire du 31/10 vers 21:35)

## Constat au démarrage
- Main à `fd0a28f` (SLOP-1d) ; workflows de main verts (Build & Release, Play — AAB, fiche, site, émulateur A56).
  Aucune PR « [Auto] » ouverte ; #51 (`cursor/*`) non touchée.

## Inventaire
`SLOP_WORDING` appliqué à chaque titre et phrase des 299 notes de `app/src/data/changelog/` : 65 alertes dans
39 notes (le relevé du BACKLOG ne comptait que 20 notes pour le seul refrain). Répartition : refrain « estimation /
observation / mesure, pas (jamais) un diagnostic » (22 phrases), tirets cadratins dans une phrase (13), « on préfère
attendre… faux suspects » (2), « pas une cause » (3), énumérations par trois entre parenthèses (3). Aucun titre touché.

## Changements (exemples)
| Note | Avant | Après |
|---|---|---|
| 08/10 norme cœur | « …l'app rappelle les causes fréquentes (…) — une observation, jamais un diagnostic. » | « Si la FC au repos monte ou si la VFC baisse, l'app cite les raisons fréquentes : nuit courte, stress, alcool, entraînement ou début d'infection. » |
| 21/10 accueil | « …avant de chercher des pistes : on préfère attendre plutôt que de vous montrer de faux suspects. » | « …avant de chercher des pistes : il faut assez de jours pour comparer. » |
| 22/10 VFC jour, température | « Une mesure de la montre, pas un diagnostic. » (phrase seule) | phrase supprimée |
| 23/10 bienvenue | « (votre ventre, votre énergie et votre sommeil, ou toutes vos données) » | retiré : « ce qui vous amène, ce que vous voulez suivre et si vous avez une montre » |
| 26/10 vérifier une piste | « Une piste reste un lien repéré dans vos données, pas une cause : le test aide à trancher. » | « Le test aide à savoir si la piste tient. » |
| 31/10 textes sans refrain | citait la phrase bannie | « La mise en garde sur le diagnostic ne se répète plus sous chaque carte… » |

Au passage, « humeur » remplacé par « bien-être » dans les phrases réécrites (le nom historique de la carte
« Humeur estimée » reste dans les phrases non touchées). Le fond de chaque note est inchangé (dates, variantes,
faits) ; seul le texte affiché change. JSON réécrits au même format (diff limité aux phrases).

## Tests
- `wording.test.js` : nouveau test « aucune formule bannie dans les notes de Nouveautés » (titre + phrases, une
  alerte par phrase avec le nom du fichier). Il échoue sur les anciennes notes (vérifié avec `git stash`) et passe
  après réécriture.
- Note du run : `2026-11-01-0433-nouveautes-relues.json` (commune aux deux variantes, rien de propre à Android).

## Vérifications
- `npm run test` : 2 809 réussis ; `npm run build` OK ; `npm run lint` : 6 erreurs (inchangé) ; `npm run visual` OK
  (toutes les pages, plus `--routes=/nouveautes`, 12 écrans relus : note du run en tête, rendu inchangé).

## Données
- Aucune donnée touchée ; aucune nouvelle donnée collectée (Sécurité des données inchangée).

## Demandes iOS
- Rien de propre à Android dans la note : pas de `variants`.

## Suite
- SLOP-1b : Journal et Sources relus phrase par phrase (paywall avec GOLD-b), puis GOLD-b.

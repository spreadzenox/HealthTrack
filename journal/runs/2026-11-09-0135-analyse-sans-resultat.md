# Run 09/11 01:35 — Analyse IA sans résultat non décomptée

**Type** : code (mode polish).
**Étape** : POLISH-SIM-19.

## Contexte
- Aucune PR « [Auto] » ouverte ; main = #850, Build & Release, Tests, Play — AAB et émulateur A56 verts.
- Gel Alpha jusqu'au 09/11 22:00 : `review-freeze.json` non touché, aucun envoi lancé.

## Constat
La simulation voyait « 19 analyses IA restantes » après un seul essai sans résultat (« Aucun aliment reconnu »).
Vérifié dans `relay/src/server.js` : une réponse du modèle sans aliment (`ingredients` vide) ou `not_food` prenait
bien un crédit (seules les pannes de Vertex non facturées et la photo de selles illisible le rendaient).

## Fait
- `mealHasItems(parsed)` ; après une analyse repas sans aliment reconnu : `credits.refund` puis état relu
  (`credits.peek`). Le quota du jour reste pris (l'appel a coûté : il protège le budget), comme pour les selles.
- `test/gold.test.js` : la réponse factice contient désormais un aliment (le test compte des analyses réussies).
- Nouveautés : `2026-11-09-0135-analyse-sans-resultat.json` (variante play ; vaut aussi pour l'iPhone, même relais).

## Vérifs
- Test relais d'abord (rouge sans le correctif, vert avec) ; relais 224 tests verts.
- App : `npm run test` 3 314 verts ; `npm run lint` 0 erreur ; `npm run build` ok ; `npm run visual --routes=/journal` ok
  (aucun écran changé).

## Suite
- POLISH-SIM-17 (bouton Repas sans retour quand l'appareil photo ne s'ouvre pas) : à vérifier sur l'émulateur A56.
- Après merge : vérifier le redéploiement du relais.

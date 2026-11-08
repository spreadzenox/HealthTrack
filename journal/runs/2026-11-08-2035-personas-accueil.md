# Run 08/11 20:35 — Personas sur le nouvel accueil

**Type** : idées (20h) — simulation de personas (décision C), outillage seulement, aucun code produit.

## Contexte
- Aucune PR « [Auto] » ouverte ; dernier main = #844 (gel Alpha jusqu'au 09/11 22:00). 100918 en examen chez Google.
- Le nouvel accueil (#838 à #841) n'avait encore été vu par aucune persona.

## Fait
- **Outil** (`app/scripts/persona/persona-browse.mjs`) : au jour 1, les 30 jours importés faisaient conclure à
  l'app « données existantes » (`needsOnboarding` → `existing`) et l'accueil était sauté (cas de la J1 de 08:35).
  L'outil marque désormais l'accueil comme commencé (écran 0) ; vérifié sur capture (« Bienvenue dans Halcya », 01/06).
- **Deux simulations** (persona et configuration tirées au sort ; moment J1 choisi pour couvrir le nouvel accueil,
  le tirage avait donné J45 deux fois) : Sportif · Android seul · J45 ; Ventre, sans technique · Android seul · J1.
  Rapports et captures dans `simulations/`, synthèse `simulations/2026-11-08-2035-synthese.md`.
- Constats vérifiés sur les captures, puis POLISH-SIM-14 à 19 au BACKLOG ; artefacts web écartés (pas de sommeil
  estimé ni Health Connect dans la version web).
- Vérifs : `npm run test` (3 297 verts), `npm run build`.

## Reste
- POLISH-SIM-14 à 16 en tête des runs de code de demain (mode polish) ; 17 et 19 à vérifier sur le téléphone / le relais.
- POLISH-SIM-7 et 9 (objectif d'onboarding fixé par persona, configurations iPhone) toujours ouverts.

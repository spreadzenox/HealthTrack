# Run du 19/11 18:30 — Essai : le lien retour mène à l'objectif suivi (POLISH-SIM-108)

**Type** : 🛠️ code (polish de la refonte, objectif du 22/11) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main ed95ca0.

## État de départ
- main vert sur #1126 (Tests, Build & Release, Play — AAB, émulateur) ; #1127 (run de 17:30) mergée, Build & Release
  vert, ses autres workflows en cours au début du run.
- Aucune PR « [Auto] » ouverte (la seule ouverte, #51, n'est pas de la routine).

## Ce qui a été fait
- **POLISH-SIM-108, lien retour d'un essai** (simulation « Tout mesurer » J45 du 16/11 : « lien retour “← Agir” alors
  que l'onglet allumé est “Objectifs” »). Le brief (§ 4, tableau des onglets) range `Trial` sous Objectifs, comme la
  barre d'onglets (`TabBar.jsx` : `/agir/essai` sous Objectifs). Le lien de `Trial.jsx` revient donc à l'objectif que
  l'essai suit : « ← Votre bien-être » (`/recommendations/bien-etre`) ou « ← Votre confort digestif »
  (`/recommendations/ventre`), sur le modèle de la réintroduction.
- Test d'abord (`Trial.test.jsx`, 2 cas : bien-être et ventre) : rouge sans le changement, vert avec.
- Note de Nouveautés `2026-11-19-1830-essai-retour-objectif` (sans variante).

## iPhone
- Aucun correctif de `iphone/patches/` ne touche `Trial.jsx` ni `Trial.test.jsx` : code partagé repris tel quel.
- Parité : 70 % (inchangée). TestFlight : 893 (1173.1173) soumise à l'examen bêta le 19/11 04:31 ; la build du soir
  partira à 21:20 avec ce qui sera sur main.

## Vérifications
- `npm run test` : 4 113 tests verts (367 fichiers) ; `npm run build` vert ; `npm run lint` sans erreur.
- Capture `npm run visual -- --play --routes=/agir --trial=8 --click="Dormir au moins"` relue : « ← Votre bien-être »
  en haut, onglet Objectifs allumé, reste de la page inchangé.

## Suite proposée
1. Finir la PR de ce run si besoin : checks verts, build iPhone, captures, branche à jour, merge en squash.
2. POLISH-SIM-108 restant : export CSV (proposition au propriétaire, pas codé).
3. UPG-9 (alertes FODMAP d'un repas trop techniques pour « Ventre, sans technique ») : une phrase d'abord, détails
   derrière « Détails ».

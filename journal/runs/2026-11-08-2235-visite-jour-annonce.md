# Run 08/11 22:35 — Visite guidée : le bon jour sur l'étiquette

**Type** : code (polish) — POLISH-SIM-14 et 15, constats de la persona « Ventre, sans technique » J1 (08/11 20:35).

## Contexte
- Aucune PR « [Auto] » ouverte ; main = #846, Build & Release, Tests, Play — AAB et émulateur A56 verts.
- Gel Alpha jusqu'au 09/11 22:00 (100918 en examen) : aucun envoi lancé, `review-freeze.json` non touché.
- Pas de nouvelle correction du propriétaire dans le prompt.

## Fait
- `services/tour.js` : `counterDay(elapsed, days)` : le compteur « jour 1 → jour N » se calcule sur l'horloge. Avant,
  il avançait d'un jour par tick ; le calcul des analyses sur 75 jours fictifs retardait les ticks et l'étiquette
  restait à « jour 5 » sous la bulle « Au jour 28 ».
- `GuidedTour.jsx` : `DayCounter` fixe la valeur finale à 950 ms quoi qu'il arrive ; `Spotlight` remesure l'élément
  toutes les 300 ms pendant l'étape (ombre pleine s'il disparaît). La « bande blanche » sous la bulle était la découpe
  du projecteur restée là où la section, encore vide, se trouvait avant l'arrivée des analyses.
- Étape « Les analyses » : avec digestion ou cycle, « Bien-être après 14 jours notés, digestion après 28. » (sinon
  inchangé), délais lus dans `FIRST_RESULTS_DAY`.
- Nouveautés : `2026-11-08-2235-visite-jour-annonce.json`.

## Vérifs
- `npm run test` : 3 304 verts (3 nouveaux : compteur, projecteur qui suit l'élément, deux délais).
- `npm run build` ok ; `npm run lint` 0 erreur (fonction sortie du composant pour la règle fast refresh).
- `npm run visual -- --routes=/ --onboarding=tour --settle=2500 --click="… > Voir au jour 28"` : « jour 28 », cadre sur
  « Ce qui va avec votre confort digestif » (`runs/captures/2026-11-08-2235-visite-jour28.png`, capture pleine page).

## Reste
- Revoir la visite sur l'émulateur A56 au prochain passage des personas (bande blanche non reproduite dans le navigateur).
- POLISH-SIM-17 (bouton Repas muet sans caméra, à vérifier sur téléphone), 18 (« 01/06 » sur les trois cartes), 19 (crédit IA après un échec).
- Envoi Alpha du 09/11 23:45 : partira avec ce changement.

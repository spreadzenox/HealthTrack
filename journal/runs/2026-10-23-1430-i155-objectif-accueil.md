# 2026-10-23 14:30 Paris (12:30 UTC) — I155 : l'objectif choisi règle l'Accueil

**Type** : 🧭 chantier produit (jalon 4, I155)

## Constat
- Main à `359955c` (#294) ; Build & Release, Tests, Play — AAB, émulateur A56 : verts. Aucune PR « [Auto] » ouverte
  (seule #51 `cursor/*`, non touchée). Run de code (14:30).

## Ce qui a été fait
- `settings/onboarding.js` : `homeFocus(goal)` → `energy` pour l'objectif « Mon énergie et mon sommeil », sinon `gut`.
- `services/today.js` : `pistesProgress(entries, focus)` ; en `energy`, compte les jours qui ont à la fois une nuit
  (jour du réveil) et une mesure du bien-être (`wellbeing` ou `face_burst`) — paires X/Y seulement, pas de
  raisonnement circulaire.
- `TodayCards.jsx` : `PistesTeaser focus` (lecture sommeil + bien-être, textes « nuits suivies d'une mesure du
  bien-être », « pistes sommeil → bien-être »).
- `Dashboard.jsx` : en `energy`, la carte ventre passe sous les pistes ; rien n'est masqué.
- `Settings.jsx` : bloc « Ce qui vous amène » (3 choix, `saveOnboarding({ goal })`).
- `visual-check.mjs` : `--goal=energy`. Changelog `2026-10-23-1430-objectif-accueil.json`.

## Vérifications
- `npm run test` : **2 015 verts** (163 fichiers). `npm run build` OK. `npm run lint` : 6 erreurs, identiques à main.
- `npm run visual` complet OK ; captures relues : Accueil `--goal=energy` (pistes « 21/21 nuits suivies… », ventre
  en bas), Paramètres (bloc « Ce qui vous amène »).

## Suite
- I156 (compteur local d'étapes de l'onboarding dans le diagnostic exporté), puis passe « version candidate ».

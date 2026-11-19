# Run du 19/11 19:30 — Repas : FODMAP en une phrase (UPG-9, carte d'un repas)

**Type** : 🛠️ code (polish de la refonte, objectif du 22/11) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main daf09c7.

## État de départ
- main vert sur #1128 (Tests, Build & Release, Play — AAB, émulateur Galaxy A56).
- Aucune PR « [Auto] » ouverte (la seule ouverte, #51, n'est pas de la routine).

## Ce qui a été fait
- **UPG-9, carte FODMAP d'un repas** (simulation « Ventre, sans technique » J1 du 16/11 : « 4 lignes rouges + grammes
  + références »). Les grammes et les sources étaient déjà derrière « Détails » (POLISH-SIM-77) ; restait une ligne par
  groupe. Désormais, avec **plusieurs groupes**, `MealFodmapLine.jsx` affiche une seule phrase
  « Parfois mal digérés : lentille verte, oignon, ail » (aliments dans l'ordre du repas, chacun une fois) ; « Détails »
  rouvre les lignes par groupe, les grammes, la note et les sources. Avec **un seul groupe**, la ligne
  « Riche en fructanes : oignon » reste visible d'emblée (demande N4 du propriétaire, 26/10).
- Mot choisi : « parfois mal digérés », sans jugement sur l'aliment (règle 6).
- Tests d'abord (`MealFodmapLine.test.jsx`, 2 cas) : rouge sans le changement, vert avec.
- Note de Nouveautés `2026-11-19-1930-fodmap-une-phrase` (sans variante).

## iPhone
- Aucun correctif de `iphone/patches/` ne touche `MealFodmapLine.*` : code partagé repris tel quel.
- Parité : 70 % (inchangée). TestFlight : 893 (1173.1173) soumise à l'examen bêta le 19/11 04:31 ; la build du soir
  partira à 21:20 avec ce qui sera sur main.

## Vérifications
- `npm run test` : 4 115 tests verts (367 fichiers) ; `npm run build` vert ; `npm run lint` sans erreur.
- Capture `npm run visual -- --routes=/food --food-analysis=fodmap --onboarding=gut` relue : une ligne pêche
  « Parfois mal digérés : lentille verte, oignon, ail » et son chevron, sous l'éditeur du repas. Avertissements de
  contraste et de cible du rapport inchangés (boutons − / +, « à vérifier », « détails », hors de ce run).

## Suite proposée
1. Finir la PR de ce run si besoin : checks verts, build iPhone, merge en squash.
2. UPG-9 restant : pistes « −2,7 pt pour 1 repas riche en fructanes (FODMAP) » en une phrase claire, chiffres derrière.
3. POLISH-SIM-108 restant : export CSV (proposition au propriétaire, pas codé).

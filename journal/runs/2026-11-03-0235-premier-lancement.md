# Run du 03/11/2026 02:35 (Paris, CET) — Premier lancement : l'Accueil attend la décision d'onboarding (C4)

**Type** : 🔧 run de code (`app/src/Layout.jsx`).

## Constat au démarrage
- Main à `def46c5` (#642) ; tous les workflows de main verts (émulateur de `def46c5` en cours). Aucune PR « [Auto] »
  ouverte (#51 Cursor non touchée), aucun « Build & Release » en cours.
- Compte rendu du 02/11 : (1) à (3) faits ; Alpha 100721 en examen au dernier constat. GOLD-a3 attend P37 ; montre :
  attend des confirmations sur la GT 6 Pro. Rien de bloquant : étape prise sur C4 (premier lancement rapide).
- Job émulateur de `ab16d9a` (API 35) : activité prête en 1,9 s, mais **premier écran utile à 14,4 s** (debug) et
  8 s (release R8), émulateur logiciel.

## Défaut trouvé
Au premier lancement, `Layout` montait l'Accueil complet (cartes, lectures IndexedDB, calculs) **avant** de savoir
s'il fallait l'onboarding, puis basculait vers « Bienvenue ». Mesuré en Chromium (build de prod, stockage vide,
3 essais) : l'Accueil apparaissait chaque fois un instant avant l'écran de bienvenue.

## Fait
1. `useOnboardingRedirect()` rend `pending` : tant que la réponse de `needsOnboarding()` n'est pas connue, la zone de
   page affiche le rond de chargement au lieu de l'`Outlet` (en-tête et onglets restent). Onboarding déjà fait (cas de
   tous les utilisateurs actuels) : `pending` vaut `false` dès le premier rendu, rien ne change. Retour Withings :
   pas d'attente. Erreur de lecture : l'Accueil s'affiche (comme avant).
2. Pendant l'attente, le fichier de l'onboarding est préchargé (`import('./pages/Onboarding')`).
3. Tests : `Layout.onboardingGate.test.jsx` (3 cas, écrit avant le code et vu échouer) ; `App.test.jsx` : la route
   inconnue attend la redirection (`waitFor`).
4. Nouveauté « Premier lancement plus net ».

## Vérifications
- Avant / après en Chromium (stockage vide, `vite preview`) : Accueil visible avant « Bienvenue » 3/3 → 0/3 ;
  temps jusqu'à « Comprenez ce qui va… » ≈ 0,93 s dans les deux cas sur un PC (le gain de temps se lira sur
  l'émulateur de la CI, où l'Accueil coûtait plus cher).
- `npm run test` : 2 901 tests verts ; `npm run build` OK ; `npm run lint` : 7 erreurs préexistantes, aucune
  nouvelle ; `npm run visual` (démo) et `--play --empty` sans erreur JS, Accueil de démo relu (inchangé).

## Émulateur de la PR (API 35)
- Premier écran utile : **12,5 s** en debug (avant 14,4 s) et **3 s** en release R8 (avant 8 s) ; 0 plantage, 1 erreur
  JS attendue (Play Billing absent de l'émulateur). Tous les checks verts.

## Suite
- Lire « Premier écran utile » dans le résumé du job émulateur de la PR et de main (avant : 14,4 s debug, 8 s release).
- Quand le propriétaire dit le jour de l'invitation : recaler `until` si J ≠ 03/11. 07/11 : bilan du relais
  (`premium=false` pour l'iPhone).

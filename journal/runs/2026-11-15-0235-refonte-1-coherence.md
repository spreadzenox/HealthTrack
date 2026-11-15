# Run 15/11 02:35 — Refonte « Compagnon », étape 1 : cohérence (ventre, objectifs, Sources)

**Type** : code (refonte « Compagnon », étape 1 du § 10 du brief)  ·  **Android** : main 88b298a (#993) au début  ·
**TestFlight** : état chez Apple non relevé à ce run ; 1030.1031 chez les testeurs externes d'après le relevé du
14/11 à 18:35 ; ni soumission bêta ni expiration à ce run ; 844.344 intacte  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme (710f9e8b…). Premier run qui lit le bloc
  REFONTE « Compagnon » (décisions du propriétaire des 13, 14 et 15/11) ; brief lu en entier.
- Main 88b298a vert (Tests, Build & Release, Play — AAB, émulateur). PR #992 (P44-3b, run de 01:35) ouverte, à jour
  sur main, 12 checks verts. Le run de 01:35 tournait encore (il a mergé #994, son journal final, à 02:5x) : ce run
  n'a touché aucun de ses fichiers de code.
- PR #51 (`cursor/*`) : non touchée.

## Fait
1. **#992 mergée** (priorité b) : branche à jour, checks verts, capture claire regardée.
2. **Les 15 étapes de la refonte inscrites** : `BACKLOG.md` (section « Refonte Compagnon », REFONTE-1 à 15),
   `PRODUIT.md` (§ 0 : mots du propriétaire, ce qui est remplacé, les 15 étapes ; méta-leçon 1 mise à jour ;
   historique), ligne d'avancement en tête du résumé de la semaine.
3. **Étape 1, Android** (`app/`) :
   - **Le ventre n'est plus demandé sans l'objectif digestion.** Avant : le bouton « Digestion » était toujours dans
     le bandeau d'Aujourd'hui, et une installation sans objectif (accueil passé sans choisir) avait le bloc digestif
     et « Selles ». Maintenant `gutCardMode` rend `'used'` sans objectif et `gutAsked(mode, entries)` décide : avec
     « Ma digestion », tout s'affiche ; avec un autre objectif, rien ; sans objectif, seulement pour qui a noté son
     ventre ces 7 derniers jours. L'accueil (« Votre téléphone suffit ») ne liste plus « digestion » sans l'objectif ;
     Paramètres ne propose le rappel du soir qu'avec l'objectif et dit la règle en une phrase.
   - **« Mon cycle » et « Mon sport et ma récupération » retirés du choix** (accueil et Paramètres) : 4 objectifs.
     `RETIRED_GOALS` garde les deux identifiants lisibles : les réglages enregistrés et les données ne changent pas.
   - **Sources quitte la barre d'onglets** (4 onglets) et devient la première ligne de Réglages (icône montre) ; la
     roue est « page courante » sur Sources et sur les données de la montre ; « l'onglet Sources » devient
     « Réglages › Sources » dans les textes de l'accueil.
   - Note de Nouveautés : `2026-11-15-0235-refonte-coherence.json` (les deux magasins).
4. Tests : `onboarding.test.js` (gutCardMode, gutAsked, objectifs retirés, handNotes), `Dashboard.test.jsx` (pas de
   « Digestion » avec un autre objectif ; sans objectif, selon les notes des 7 derniers jours), `Settings.test.jsx`
   (4 cases, anciens objectifs gardés, phrase et rappel), `Onboarding.test.jsx` (4 cases), `TabBar`, `SettingsButton`,
   `More`, `App`.

## Vérifs
- `app/` : `npm run test` 3574 verts (44 ignorés) ; `npm run lint` sans erreur ; `npm run build` ; `npm run visual`
  (18 pages ok, données de démo) et `npm run visual -- --empty --routes=/,/settings`.
- Captures regardées : Aujourd'hui avec les données de démo
  ([« Digestion » et bloc digestif présents](captures/2026-11-15-0235-refonte-1-aujourdhui-digestion.png)), Aujourd'hui
  sur une installation vide sans objectif
  ([ni « Digestion » ni bloc digestif](captures/2026-11-15-0235-refonte-1-aujourdhui-sans-objectif.png)),
  Réglages ([clair](captures/2026-11-15-0235-refonte-1-reglages.png) ·
  [sombre](captures/2026-11-15-0235-refonte-1-reglages-sombre.png) : Sources en premier, 4 onglets), Sources (roue
  active, aucun onglet actif), [Paramètres](captures/2026-11-15-0235-refonte-1-parametres.png) (4 objectifs, nouvelle
  phrase), [« Qu'est-ce qui vous amène ? »](captures/2026-11-15-0235-refonte-1-accueil-objectifs.png) (4 cases).
- Non regardé : Paramètres, Sources et l'accueil en thème sombre ; les émulateurs (sur la PR).
- iPhone, à blanc : `scripts/upstream.sh` sur le commit de la branche, les 52 correctifs s'appliquent (après avoir
  déplacé un import de `Settings.jsx` qui cassait le correctif 59) ; tests du code embarqué non lancés, rien poussé
  dans `iphone/`.
- Alpha : le dernier « Play — Alpha » planifié est celui du 14/11 à 03:41 ; celui de 23:45 n'était pas parti à
  02:55. Pas de soumission bêta à faire à ce run.

## Limites
- **TDD partiel** : faute de temps, les tests ont été écrits ou réécrits juste après le code, pas avant.
- **L'ancien « Mon cycle » compte encore comme objectif digestion** pour qui l'avait coché (`wantsGut`) : ces
  personnes voient toujours le ventre. La migration des objectifs est à l'étape 5.
- **Sans objectif, Analyses garde son onglet Digestion** (`AnalysesTabs`, `'used'` ≠ `'hide'`) : il ne demande rien
  d'office, mais son compte à rebours invite à noter. Non changé à ce run.
- **Règles** : une nouvelle installation ne peut plus cocher « Mon cycle », donc n'a plus le bouton « Règles » tant
  qu'aucune donnée de cycle n'existe. À décider à l'étape 5 ou 7 (le cycle reste un contexte de la digestion).
- La page Sources n'a pas de lien de retour vers Réglages (la roue y ramène). Le Journal, qui disparaît, n'a pas
  été revu ; la visite guidée n'a pas été rejouée.
- Le correctif iPhone 59 (« Mon cycle » coché dans Paramètres → cycle demandé à Santé) s'applique encore mais ne
  sert plus : la case n'existe plus. À retirer ou remplacer avec la décision sur le cycle (étape 5 ou 7).
- Pas de maquette du kit pour cette étape (elle ne touche pas au compagnon) : captures jugées seules.
- Charte, PRODUIT, BACKLOG et journal iPhone lus par sections (plus de 1 Mo) ; `DESIGN.md`, `INFRA.md`,
  `iphone/journal/` (README § 3, 4, 8, PARITE, BACKLOG) non relus à ce run.
- TestFlight : état des builds chez Apple non relevé ; ni soumission bêta ni expiration à ce run.

## Fin du run
- **PR #995 mergée à 03:19** (squash, d5d1ef8) : 12 checks verts (Tests, Build APK, quatre émulateurs, relais) sur la
  branche remise à jour une fois (#994, journal du run de 01:35, mergée pendant les checks).
- Après le merge : **release v734, APK 34,6 Mo** ; « Play — AAB » vert sur d5d1ef8 (v1072, lu par
  `upstream.sh --latest`). Tests et émulateur de main non relus après le merge.
- **iPhone : PR de suivi ouverte, pas mergée** : `upstream.json` de v1065 à v1072 (#990 POLISH-SIM-97 déjà embarqué,
  #992, #995) ; correctif 59 et son test retirés (case « Mon cycle » disparue) ; 51 correctifs s'appliquent, 3932
  tests verts sur le code embarqué (lancés ici, sous Linux). Build iOS sur simulateur et captures : pas attendues à ce
  run (près d'une heure). **L'étape 1 n'est donc pas encore livrée sur iPhone.**
- Le run a duré environ une heure (deux attentes de CI), au-delà des 50 minutes visées.

## Suite
- **iPhone** : finir la PR de suivi (v1072) : build macOS verte, captures `captures/pr-<N>` des écrans touchés
  (Aujourd'hui, Réglages avec Sources, accueil « Qu'est-ce qui vous amène ? », Paramètres), puis merge.
- **Étape 2 (Navigation)** : les 4 onglets du brief et les redirections ; préparer la table des routes.
- Après l'Alpha de la nuit : soumettre la dernière build TestFlight traitée, puis expirer les anciennes.
- P44-3 (rejouer le 2 décembre sur l'émulateur) ; P44-2b le 02/12 au matin.

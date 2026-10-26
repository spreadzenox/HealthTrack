# Run du 26/10/2026 09:33 (Paris, CET) — 7a : machine de réintroduction FODMAP guidée

**Type** : 🏗️ code (jalon 7, étape 7a ; rien d'affiché, donc pas d'entrée « Nouveautés »)

## Constat au démarrage
- Main à `c2fe5af` (#391, idées jalon 7), CI de main verte (Tests, émulateur, Build & Release, Play — AAB). Aucune PR
  « [Auto] » ouverte. I134 étape 4 (facultative) laissée de côté au profit du jalon 7, prêt à coder.

## Ce qui a été fait
- `app/src/services/fodmapChallenge.js` (pur, sans React ni stockage), d'après I174 :
  - entrée `fodmap_challenge` (`source: app_fodmap`) : groupe, aliment, portions prévues (modifiables), portions
    mangées horodatées, réponses « c'est supportable ? », historique des redémarrages ; **aucune migration** (type de
    plus dans le magasin existant, passe l'export / import générique) ;
  - état et verdict **calculés** depuis les notes `gut` (bilans du soir et notes horodatées), jamais recopiés ;
  - 6 groupes (fructanes : blé, oignon, ail ; GOS ; fructose ; lactose ; sorbitol ; mannitol) avec un repère de départ
    ×1 / ×2 / ×3 (repère général, à adapter avec une diététicienne) ;
  - garde de départ : 3 jours calmes d'affilée (un jour sans note ne compte pas : on ne sait pas) ; fenêtre de 24 h
    après chaque portion (une gêne après la portion suivante revient à celle-ci) ; gêne → question ; « non » → arrêt
    (J1 « à retester plus tard, en plus petit », J2 « une petite portion passe », J3 « une portion moyenne passe »),
    sinon « bien toléré » ; pause de fin jusqu'à 3 jours calmes ; un seul test à la fois (abandon possible via
    `abandonedAt`) ; une portion par jour calendaire ; 1 jour sauté décale, 2 jours sautés → pause puis départ de J1
    (portions gardées dans `history`) ;
  - `groupResults` : verdict par groupe, sauf fructanes (par aliment, jamais généralisé) ; `combinationsAvailable`
    après 2 groupes bien tolérés ; `verdictSentence` (« Blé : une portion moyenne passe (2 tranches). Au-delà, gêne. »).
- `wordingRules.js` : « intolérance » et « allergie » interdits dans les textes de l'app.

## Tests
- `fodmapChallenge.test.js` (29) : repères, refus d'entrées invalides, garde des 3 jours calmes, table de
  transitions complète, arrêt à J1 / J2 / J3 avec la phrase, note à 25 h ignorée, gêne avant la portion ignorée,
  bilan du soir compté, jour sauté / pause / redémarrage, un test à la fois (pendant, pause de fin, jours sautés,
  abandon), fructanes non généralisés, combinaisons, dernier test qui l'emporte, export / import aller-retour et
  ancien fichier sans test.

## Vérifications
- `npm run test` : 188 fichiers, **2 329** verts (+ 33 sautés) ; `npm run build` OK ; lint 6 erreurs (inchangé) ;
  `npm run visual` : 0 erreur JS, Accueil relu (inchangé, aucun écran touché).

## Suite
- **7b** : écrans ① choix du groupe, ② préparation (portions modifiables, conseils, rappel), ③ jour en cours, ④
  résultat ; brancher `recordDose` / `answerTolerable` sur `createEntry` / `updateEntry` ; premium pour le guidage
  (saisie gratuite). Puis I175 étapes 1 et 2, 7c, I176, 7d.

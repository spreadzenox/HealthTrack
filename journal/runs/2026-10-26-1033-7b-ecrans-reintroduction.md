# Run du 26/10/2026 10:33 (Paris, CET) — 7b-1 : écrans de la réintroduction FODMAP guidée

**Type** : 🏗️ code (jalon 7, étape 7b, première moitié : les 4 écrans ; le rappel est pour 7b-2)

## Constat au démarrage
- Main à `f44b0b2` (#392, 7a), CI de main verte (Tests, émulateur, Build & Release, Play — AAB). Aucune PR « [Auto] »
  ouverte (seule la PR #51 `cursor/*`, hors routine, non touchée).

## Ce qui a été fait
- `app/src/pages/Reintroduction.jsx` (route `/reintroduction`, chargée à la demande) au-dessus de
  `services/fodmapChallenge.js` :
  - ① **choix du groupe** : 6 cartes lilas (fructanes avec Blé / Oignon / Ail, un aliment à la fois ; GOS ; fructose ;
    lactose ; sorbitol ; mannitol) avec l'étiquette d'état (« pas testé », « bien toléré », « petite portion »,
    « à retester »…, par aliment pour les fructanes), « Combinaisons » grisée (« après 2 groupes bien tolérés »),
    « Vos résultats » (une phrase par test terminé), mise en garde (diététicienne ; sang, perte de poids, diarrhée la
    nuit → médecin d'abord) ;
  - ② **préparation** : portions des 3 jours modifiables (virgule acceptée), « repère général, à adapter avec votre
    diététicienne », 3 conseils, « Commencer aujourd'hui » grisé tant qu'il n'y a pas 3 jours de ventre calme
    (« N/3 jours calmes ») ;
  - ③ **jour en cours** : frise J1 / J2 / J3 / Pause, « J'ai mangé ma portion (250 ml) » en un geste, « C'est
    supportable ? » (Oui, je continue / Non, j'arrête) après une gêne dans les 24 h, « Reprendre au jour 1 » après
    deux jours sautés, carte « Votre ventre » habituelle en dessous, « Arrêter ce test » (confirmation ; les données
    restent, `abandonedAt`) ;
  - ④ **résultat** : la phrase (« Blé : bien toléré jusqu'à 3 tranches. »), la frise, « Une estimation de votre
    ventre, pas un diagnostic. L'attente joue aussi… », la pause « N/3 jours calmes » avec la carte ventre.
  - État et verdict toujours recalculés depuis les notes `gut` (120 derniers jours) ; l'entrée `fodmap_challenge`
    ne garde que les gestes (aucune migration).
- Entrée depuis Analyses : carte lilas « Tester un groupe FODMAP » (`ReintroductionEntry.jsx`) sous « Votre ventre
  et vos repas », seulement avec l'objectif « Mon ventre » (même règle que les pistes ventre, POL-4).
- **Premium** : variante play sans premium → carte « Débloquer » (vers `/premium`) ; un test déjà commencé se
  termine toujours (sa saisie est une donnée). Période de lancement (P23) : tout le monde y a accès. Variante sideload :
  tout est ouvert (pas d'abonnement). `premiumBenefits.js` : « La réintroduction FODMAP guidée » passe à
  `delivered: true` (cochée sur le paywall ; reprise par le workflow « Play — abonnements » à son prochain passage).
- CSS dans `pageStyles.js` (règle du chargement d'emblée), lilas pour la réintroduction, pêche pour la question.
- Captures : option `--fodmap` (8 jours de ventre calme ; `=day2`, `=question`, `=result`) et route `/reintroduction`
  ajoutée aux pages par défaut.

## Tests
- `Reintroduction.test.jsx` (10) : choix + étiquettes + mise en garde sans mot interdit ; garde des 3 jours calmes ;
  création avec portions modifiées (`[1, 2, 2,5]`) ; portion du jour ; question et réponse « non » ; reprise après
  pause ; résultat et pause ; test terminé dans « Vos résultats » et en étiquette ; play sans premium (Débloquer,
  mais test commencé utilisable) ; play en période de lancement.
- `Recommendations.test.jsx` : carte d'entrée présente avec « Mon ventre », absente avec un autre objectif.
- `Premium.test.jsx`, `premiumBenefits.test.js` : la réintroduction est cochée, plus « en préparation ».

## Vérifications
- `npm run test` : 189 fichiers, **2 339** verts (+ 33 sautés) ; `npm run build` OK ; lint 6 erreurs (inchangé) ;
  `npm run visual` (`--fodmap`, `=day2`, `=question`, `=result`, `--click="Blé" --dark`, `/recommendations
  --gut-links`) : 0 erreur JS, captures relues (frise lisible, contrastes clair et sombre, carte d'entrée sous la
  piste ventre).

## Suite
- **7b-2** : rappel à l'heure choisie (« Votre portion du jour », même mécanisme que `gutEvening.js`), état du test
  dans la carte d'entrée (« Lait · jour 2 »). Puis **7c** (lien « Vérifier avec une réintroduction guidée » depuis
  chaque piste ventre), I175 (rapport PDF), 7d (à l'aveugle).

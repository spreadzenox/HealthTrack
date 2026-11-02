# Run du 02/11/2026 19:35 (Paris, CET) — mesure de perf de Tendances corrigée (I139)

**Type** : 🔧 code (outillage de mesure, rien de visible dans l’app)

## Constat au démarrage
- Main à `0218f6a` (#634) ; « Tests », « Build & Release », « Play — AAB » et émulateur verts ; aucune PR « [Auto] »
  ouverte (seule la #51, brouillon Cursor, non touchée).
- Demandes reprises : **I6-RELAIS** (01/11) : code livré, App Attest attend **P38** (Team ID). **GOLD-a3** attend
  P37, **GOLD-b6** attend P36. **Montre Huawei** (21/10) : attend des confirmations sur la vraie montre. Donc
  POL-PLAY-12 (Sources, Plus en démo clair), suite du run de 18:40.

## Fait
- **Audit POL-PLAY-12** `--play` sur données de démo, clair puis sombre : Sources (avec le volet « Ajouter une
  source » ouvert : Lecture du visage, Health Connect, Temps d’écran et sommeil, montre Huawei, capteurs Bluetooth,
  guides par marque), Réglages, Licences. Rien à corriger (les « Disponible dans l’app Android » sont propres au
  navigateur).
- **I139 soldé : artefact de mesure.** La trace de chaque `getAll` du Worker montre que Tendances et Analyses lisent
  les mêmes 23 lots. L’échauffement de `perf-check` appelait `workerStats` avant que React lance le Worker (l’événement
  « load » vient avant) : il ne mesurait rien, et la reconstruction unique des agrégats journaliers (pas, calories,
  FC : 6 lectures, 5 040 enregistrements) retombait sur la première page mesurée qui utilise le Worker, Tendances.
  - `perf-check.mjs` : l’échauffement attend l’événement `worker` ; le Worker est « fini » quand chaque tâche reçue a
    répondu, sans requête en cours ni nouvelle lecture (`workerSettled` dans `budget.mjs`, 4 tests écrits avant).
  - Tendances : 825 + 15 809 = 16 634 enregistrements (3 ans de démo) → budget `/tendances` 22 000 → 17 500.

## Vérifications
- `npm run test` 2 883 verts ; lint 7 erreurs préexistantes, aucune nouvelle ; `npm run build` OK ;
  `npm run perf -- --budget --runs=1 --cpu=1` (comme la CI) : budget respecté sur les 10 pages.
- `npm run visual -- --play` (Sources, Plus, Licences ; Sources volet ouvert en clair et en sombre) : aucune erreur JS,
  captures lues.

## Suite
- POL-PLAY-12 : Montre avec `--devices`, et la piste perf de l’Accueil (« Vos derniers jours » relit les tranches
  FC/SpO₂ des 7 jours : 362 enregistrements aujourd’hui, budget 1 500, pas urgent).
- En attente du propriétaire : P36, P37, P38 ; confirmations montre.

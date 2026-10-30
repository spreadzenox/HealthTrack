# Run du 30/10/2026 18:33 (Paris, CET) — Health Connect : historique long complet (POL-PLAY-67)

**Type** : 🐛 Chiffres fiables (polissage de la version Play), tâche indépendante du signalement en cours

## Constat au démarrage
- Main à `2267b1d` (#530) : Tests, Build & Release, Play — AAB verts ; émulateur A56 rouge sur le job « Bord à bord
  API 34 » : téléchargement de l'émulateur raté (`Error on ZipFile unknown archive`), sans lien avec le code →
  job relancé.
- **PR #531 ouverte (run de 17:33, plantage de la lecture du visage)**, dernier commit à 18:27, CI en cours :
  conformément au déroulé (autre run encore actif), je n'ai touché à aucun de ses fichiers (Java du visage,
  `proguard-rules.pro`, workflows émulateur / Play, `faceSense.js`). Le signalement du 30/10 reste traité là-bas
  (cause trouvée : R8 retirait les annotations `@CapacitorPlugin`/`@Permission` → `NullPointerException` dans
  `getPermissionStates` dès « Activer »).

## Fait
- POL-PLAY-67 : toutes les lectures Health Connect restantes passaient le plugin en une fois (`limit: 500` pour
  sommeil, FC au repos, SpO₂, VFC, dépense ; 1 000 pour respiration, température, tension, glycémie, poids, masse
  grasse ; 200 séances). Le plugin trie puis coupe : sur un historique long, tout ce qui dépasse la limite (les plus
  récents) était perdu. → `readInWindows(read, { windowMs })` (généralise `readSamplesInWindows`) : `windowMs: Infinity`
  pour ces types (une seule lecture si elle tient sous la limite, sinon coupée en deux jusqu'à ce que ça tienne) ;
  séances lues de la même façon (`queryWorkouts`). Doublons aux bords retirés (clé `platformId|début|fin|valeur`,
  ou type de séance).

## Tests (écrits avant le code, rouges puis verts)
- 2 ans (731 jours) : FC au repos, VFC, sommeil, poids → 731 chacun, dernier jour compris ; SpO₂ toutes les 10 min
  → 105 264 (rouge : 500).
- Type peu dense sous la limite : une seule lecture (pas d'explosion du nombre d'appels).
- 365 séances sur un an → toutes (rouge : 200).

## Vérifications
- `npm run test` (2741 ✔), `npm run build`, `npm run lint` (6 erreurs, comme avant),
  `npm run visual -- --play --routes=/connectors,/journal` (et `--empty` sur l'Accueil) relu : aucun écran ne change.

## Données
- Lecture seulement ; écriture par upsert comme avant ; export / import intacts. Les jours manquants reviennent par
  une resynchro de l'historique (Sources).

## Suite
- PR #531 (visage) mergée par le run de 17:33 pendant ce run (`638538e`) ; ma branche remise à jour dessus (seul
  conflit : une ligne du journal de `PRODUIT.md`). Le propriétaire doit retester « Activer » sur la version de test
  interne qui en sort.
- POL-PLAY-11 (alpha + `shrinkResources`) après une journée sans plantage dans Android vitals.

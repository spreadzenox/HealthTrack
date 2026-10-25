# Run du 25/10/2026 21:33 (Paris, CET) — LISTING-1 (fiche Play) + I168 (porte TTS)

**Type** : 🧭 chantier produit (fiche Play ; jalon 5, moteur seul, aucun écran touché)

## Constat au démarrage
- Main à `19fe0a8` (#379, idées) ; Tests, émulateur verts sur ce commit ; Build & Release #279 et Play — AAB #90 verts
  sur `f5f82aa`. Aucune PR « [Auto] » ouverte (#51 `cursor/*` non touchée).
- Prochaines étapes du BACKLOG : LISTING-1 (court) puis I168.

## Ce qui a été fait
- **LISTING-1** — `app/store/listing/fr-FR/full-description.txt` : la sauvegarde Google du téléphone est dite (comme
  `privacypolicy.html`), « tout s'efface » seulement si elle est coupée ; « Pistes » → « Analyses » ; « côlon irritable
  (SII) » et « journal alimentaire » dans des phrases ; repères FODMAP = hypothèses de départ. 3 099 caractères
  (≤ 4 000). Test-garde dans `scripts/play/listing.test.mjs` (écrit avant, rouge, puis vert), dont « aucune ligne
  qui ne soit qu'une liste de mots-clés ». Le workflow « Play — fiche du Store » l'enverra au merge (`app/store/**`).
  Pas d'entrée Nouveautés : rien ne change dans l'app.
- **I168** — `services/gutWindows.js` : `truncatedTimeShift(stat, r)` (TTS, u = B / (r + 1), sans enroulement,
  décalage incalculable compté « aussi fort ») ; pour chaque candidate de Fisher + BH (q < 0,1), la même statistique
  (écart de part de notes gêne/douleur avec / sans) est recalculée avec les repas décalés de s jours, s = −9…+9, sur
  les notes des jours 9 à n − 10 ; piste gardée si u ≤ 0,1 ; moins de 28 jours (ou de 10 jours notés) → `too_early`.
  Champ `u` ajouté aux résultats.
- Choix mesuré (simulation hors dépôt, puis gardée en partie dans les tests) : première version sur séries
  journalières (exposition « au moins un moment du jour ») → puissance effondrée (1/10), la fenêtre 4–24 h couvrant
  presque tous les jours ; version retenue au niveau des notes. r = 9 contre [19, 9] : puissance 32/40 contre 27/40
  en 9 semaines, faux positifs 5/100 contre 6/100 (nulle AR(1) φ = 0,9 + oignon par séries) ; Fisher seul : 31/100.
  En 6 semaines : puissance 17/40 (avant : 24/40), faux 1/100 (Fisher seul 20/100).

## Vérifications
- Tests : TTS (u minimal, plafond, null, prudent), nulle réaliste sur 100 jeux (Fisher seul > 10 %, porte < 10 %),
  < 2r + 10 jours → « trop tôt » malgré q < 0,1 ; anciens tests inchangés et verts.
- `npm run test` : 183 fichiers, **2 229** Vitest verts ; build OK ; lint 6 erreurs (inchangé) ; `npm run visual`
  (aucun écran touché) : toutes les pages « ok », sans erreur JS ; capture de l’accueil regardée, inchangée.

## Suite
- I169 (N calibré sur 4 nulles réalistes, dont saisie informative et notes juste après les repas), I170 (bilan du
  ventre du soir), puis affichage des pistes ventre dans Analyses (avec I171 a/b), I134. POL-1d attend P28.
- Lundi 26/10 (premier run) : archiver S43 dans `semaines/2026-S43.md`.

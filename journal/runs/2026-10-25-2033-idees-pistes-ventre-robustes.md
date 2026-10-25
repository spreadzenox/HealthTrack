# Run du 25/10/2026 20:33 (Paris, CET) — idées : pistes ventre robustes (préparer I133 / I134)

**Type** : 💡 idées (run de 20 h : pas de code produit)

## Constat au démarrage
- Main à `f5f82aa` (#378, I132) ; Build & Release #279, Play — AAB #90, émulateur et Tests verts sur ce commit.
  Aucune PR « [Auto] » ouverte (#51 `cursor/*` non touchée).
- Le moteur repas → ventre (I132) traite chaque note comme indépendante ; I133 (seuil par simulation, permutation par
  blocs) est l'étape de code suivante du jalon 5.

## Ce qui a été fait
- Veille méthodologique (sources dans `IDEES.md`) : autocorrélation dans les études N-of-1 (simulation `nof1kit` :
  40 % de faux positifs au seuil de 5 % avec exposition en blocs et dérive φ = 0,7), test TTS de Yuan & Shou (PLoS
  Biol 2024 : décalages −r…+r sans enroulement, u = B/(r+1), valide si une série est stationnaire, r ≥ 19 à α = 0,05),
  échantillonnage signal / événement (EMA), jours manqués d'un journal de symptômes, effet nocebo (essai 2025
  blé / gluten / placebo 11/10/8 sur 28), concurrents Android SII.
- `IDEES.md` I168 (porte TTS en plus de BH — le u minimal 1/(r+1) interdit d'en faire le test principal), I169
  (4 nulles réalistes pour fixer N), I170 (bilan du ventre du soir, `scope: 'day'`), I171 (effet d'attente visible,
  réintroduction à l'aveugle avec un proche), I172 (fiche Play).
- Relecture de `app/store/listing/fr-FR/full-description.txt` : « tout s'efface en désinstallant l'app » contredit la
  décision du 24/10 (sauvegarde Android gardée) ; « Pistes » au lieu d'« Analyses » ; ni « côlon irritable », ni
  « SII », ni « journal alimentaire » → **LISTING-1** en tête des prochaines étapes du BACKLOG.
- BACKLOG (jalon 5 précisé, prochaines étapes), PRODUIT (jalon 5, historique), résumé de la semaine.

## Vérifications
- Journal seul ; `npm run test` : 183 fichiers, **2 222** Vitest verts.

## Suite proposée
- Run de code suivant : LISTING-1 (court), puis I168 (TTS, testé sur nulle AR(1) + aliment en séries), I169, I170,
  affichage des pistes ventre dans Analyses (avec I171 a/b), I134. POL-1d attend P28.
- Lundi 26/10 (premier run) : archiver S43 dans `semaines/2026-S43.md`.

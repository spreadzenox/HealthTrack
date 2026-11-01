# Run du 01/11/2026 10:33 (Paris, CET) — Textes : réintroduction (SLOP-1b-7)

**Type** : ✍️ code (polissage des textes, demande du propriétaire du 31/10 vers 21:35)

## Constat au démarrage
- Main à `866bfda` (#593). Aucune PR « [Auto] » ouverte ; Build & Release, Tests, Play — AAB et émulateur verts sur main.

## Fait (réécritures préparées dans `IDEES.md` I204)
- **« l'app vous dit ce qui passe » une fois au lieu de trois** : entrée d'Analyses (`ReintroductionEntry`) →
  « 3 jours, des portions croissantes. » ; intro du choix → « Un groupe à la fois, sur 3 jours : une portion, puis le
  double, puis le triple. Notez votre ventre comme d'habitude. » ; carte premium → « Trois jours de portions
  croissantes, puis le résultat en une phrase, par exemple « Blé : une portion moyenne passe ». »
- **« diététicienne » une fois** : la mise en garde (`Disclaimer`) ne garde que `WHEN_TO_SEE_DOCTOR` ; la préparation
  garde « Repère général, à adapter avec votre diététicienne. » Les 3 consignes (repas dehors, café, autres repas)
  restent : ce sont de vraies consignes.
- `SLOP_WORDING` : règle « l'app vous dit (en une phrase) ce qui passe ». Tests : « diététicienne » une seule fois sur
  la préparation ; carte premium avec l'exemple et sans le refrain.
- Nouveautés : `2026-11-01-1033-reintroduction-textes.json` (commune Android / iOS).

## Vérifications
- `npm run test` : 2 810 tests verts ; `npm run lint` : 6 erreurs avant et après ; `npm run build` OK ;
  `npm run visual` complet OK.
- Captures relues : choix des groupes (clair) et préparation « Blé » (sombre) → `journal/captures/slop-1b-7/`.

## Demandes iOS
- Aucune concernée (note commune, pas de code natif).

## Suite
- SLOP-1b : détails dépliés des Analyses ; puis GOLD-b (P35 sans réponse : proposition appliquée, paywall à deux
  niveaux, GOLD-b2, banc Nutrition5k).

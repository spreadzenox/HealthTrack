# Run du 27/10/2026 23:33 (Paris, CET) — ventre du soir : une seule question (POL-PLAY-12)

**Type** : 🎨 polissage de la version play

## Constat au démarrage
- Main à `c7e9819` (#444) ; « Test — émulateur » rouge (job bord à bord API 34), réparé par la PR **#445** du run de
  22:33, tous checks verts mais merge refusé par les permissions de cette session-là.
- #445 mergée en squash (`08c5104`), base inchangée depuis ses checks.

## Audit POL-PLAY-12 (`npm run visual -- --play --empty`, puis démo)
- Accueil, Journal (Jours, Repas, Tendances), Analyses, Sources, Paramètres, Premium relus.
- **Défaut principal corrigé** : le soir (≥ 18 h), la carte « Votre ventre » empilait deux rangées Calme / Gêne /
  Douleur presque identiques (note horodatée + bilan du jour) — « rien d'empilé sans hiérarchie ».
- Rangés au BACKLOG : POL-PLAY-13 (texte « Ce qui vous amène » sans choix), POL-PLAY-14 (« Calories brûlées → Bouger
  davantage » sous « Marcher davantage »), POL-PLAY-15 (« Stress montre 37 / 99 »).

## Fait
- `GutCard` : tant que le bilan du soir n'est pas donné, seule la question « Et votre ventre aujourd'hui, dans
  l'ensemble ? » s'affiche (mêmes boutons radio que la note) ; lien « Noter un moment précis » qui révèle la rangée
  « À l'instant ». Après le bilan, la carte redevient celle du matin. Aucune donnée ni fonction retirée.
- Tests : nouveau test du soir ; les tests qui dépendaient de l'heure réelle (rangée horodatée) reçoivent une heure du
  matin (ils auraient échoué après 18 h).

## Vérifications
- `npm run test` : 2 576 verts ; `npm run build` OK ; lint : 6 erreurs, comme avant.
- Captures `--play` (démo) clair, sombre et lien déplié ; `--play --empty` relues.

## Suite
- POL-PLAY-13 à 15 (petits), puis POL-PLAY-10 (R8a).

# Run du 02/11/2026 05:33 (Paris, CET) — Habitudes en attente rangées dans « Bientôt » (POL-PLAY-98)

**Type** : 🔧 code (polissage de la version Play)

## Constat au démarrage
- Main à `a798e1f` (#619), workflows verts (Tests, Build & Release, Play — AAB, émulateur).
- PR #620 (POL-PLAY-97, Nutrition, run de 04:33) ouverte depuis moins de 90 min, checks verts : pas touché à
  Nutrition ; tâche indépendante choisie (audit d’autres écrans).
- Demandes reprises : I6-RELAIS (01/11 17:10) livré sauf I6-RELAIS-5 (App Attest, « plus tard ») ; GOLD-a3 attend
  P37 ; GOLD-b6 attend P36 ; montre (21/10) en attente de confirmation sur la GT 6 Pro. Règle SLOP du 31/10 :
  nouveau texte court (« encore 3 jours notés », « pas encore comparable (semaine et week-end) »).

## Fait
- Audit `npm run visual -- --play` en clair (démo) : Jours, Repas, Tendances, Analyses, Bien-être, Sources.
  Captures relues. Vus sans défaut : échelle 0–5 du bien-être noté (voulue, `WellbeingPrompt`), totaux par jour des
  repas (560 + 479 = 1 039 kcal), « Riche en lactose : yaourt nature ».
- **POL-PLAY-98** : sur Analyses, « Bientôt comparés : Malade (encore 3 jours notés) » était une phrase grise isolée
  juste au-dessus de la section « Bientôt ». Chaque habitude en attente devient une ligne de « Bientôt »
  (`pendingTagLines`, `pendingProgress`), le compteur global « Vos habitudes » n’est plus ajouté en double ; avec peu
  de données, les habitudes du visage en attente y figurent aussi. Classe CSS `reco-tag-pending` retirée.
- Note de Nouveautés `2026-11-02-0533-analyses-bientot.json` (toutes variantes).

## Vérifications
- `npm run test` : 2 853 réussis. Build OK. Lint : 6 erreurs, comme avant.
- Captures `--play --routes=/recommendations` clair et sombre relues : « Bientôt » = « Votre ventre et vos repas
  9/28 jours » puis « Malade · encore 3 jours notés ».

## Suite
- POL-PLAY-12 : Nutrition en clair une fois #620 mergée, puis parcours repas (analyse photo, éditeur).
- P37 toujours en attente pour GOLD-a3 ; P36 pour GOLD-b6.

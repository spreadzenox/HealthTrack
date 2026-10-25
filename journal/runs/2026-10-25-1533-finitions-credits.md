# Run du 25/10/2026 15:33 (Paris, CET) — VC-20, CREDITS-LOG, PLAY-COMPLETED

**Type** : 🧭 chantier produit (finitions de la version candidate et vérifications d'infrastructure)

## Constat au démarrage
- Main à `98c2c3a` (#369) ; aucune PR « [Auto] » ouverte (#51 `cursor/*` non touchée) ; derniers workflows de main verts.
- POL-1d attend P28 (propriétaire) : on prend les petites étapes ouvertes du backlog.

## Ce qui a été fait
- **VC-20** : l'émoji d'une étiquette d'habitude n'est plus affiché (Journal → Jours, radar forme « Probablement lié à
  « Alcool » (hier)… », puces de la note de bien-être manuelle). L'émoji reste dans `behaviorTags.js` et dans les données
  (aucune migration). Test-garde dans `wording.test.js` : aucune page ni aucun composant ne lit `.emoji` (rouge avant,
  vert après).
- **CREDITS-LOG** : nouvelle étape non bloquante de `relay-deploy.yml`, après l'analyse de test (qui lit puis réécrit le
  registre des crédits) : attend 45 s, lit `credits_store_failed` dans Cloud Logging, écrit « ✅ lu et écrit sans échec »
  ou « ⚠️ N échec(s) » + le total des 7 jours par opération et code HTTP. Le relais lui-même ne change pas : l'étape
  tournera dès le merge de cette PR (le workflow lui-même change, donc le relais est redéployé).
- **PLAY-COMPLETED** : run « Play — AAB » n° 85 (`2728e6f`) : versionCode 455 « Déployée auprès des testeurs
  internes », « Validée » → statut `completed` (la branche « brouillon » de `publish-cli.mjs` n'a pas servi). Le résumé
  de la semaine ne contient plus de geste « version en brouillon » à faire.

## Vérifications
- Vitest 2 206 verts (+1 test-garde, radar mis à jour) ; build OK ; lint inchangé (6 erreurs préexistantes) ;
  YAML du workflow relu (`yaml.safe_load`).
- `npm run visual -- --radar=explained` (clair, données de démo) : Tendances (radar « Probablement lié à « Alcool »
  (vendredi 23), « Sport le soir » (jeudi 22) et « Voyage » (hier) ») et Journal (« Voyage », « Alcool » sans émoji)
  relus ; `--routes=/ --click="Noter moi-même" --dark` : puces sans émoji, lisibles.

## Suite
- POL-1d dès P28 ; VC-21 (`console.error` « Line 330 » du premier lancement play) ; puis jalon 5 / M suivants.
- Lire la ligne « Registre des crédits » au prochain déploiement du relais.

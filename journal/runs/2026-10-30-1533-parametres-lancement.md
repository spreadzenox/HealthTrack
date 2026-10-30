# Run du 30/10/2026 15:33 (Paris, CET) — Paramètres pendant la période de lancement (POL-PLAY-65)

**Type** : 🎨 Polissage de la version Play (critère C2, P23 a)

## Constat au démarrage
- Main à `ce41722` (#528). Tests, Build & Release et Play — AAB verts ; **« Test — émulateur Samsung Galaxy A56 »
  rouge** sur le seul job API 35 : échec à l'étape « Installer image système API 35 » (téléchargement, 17 s, avant
  tout test ; API 34 et API 36 verts sur le même commit) → panne passagère, job relancé (`rerun_failed_jobs`).
- Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, non touchée).

## Fait
- Audit `npm run visual -- --play --empty --dark` de Paramètres, Premium, Données et Sources, puis
  `--subscription=launch` (clair) de Paramètres et Premium. Premium (« Premium offert pendant le test ») et le bloc
  Abonnement de Paramètres sont justes. Un défaut : sous le compteur d'analyses IA, Paramètres disait encore « Sans
  abonnement : 10 analyses offertes, puis 15 par mois. Avec le premium : jusqu'à 10 par jour. » à un testeur qui a
  déjà le premium offert (P23 a : ne pas pousser à l'achat pendant la période).
- `Settings.jsx` (`RelayAiBlock`) : la ligne suit les droits (`useEntitlement`) — période de lancement : « Pendant le
  test : jusqu'à 10 analyses par jour, sans rien payer. » ; premium payé : « Avec votre premium : jusqu'à 10 analyses
  par jour. » ; sinon inchangée. Le parcours d'achat revient seul à la fin de la période.

## Tests
- `Settings.play.test.jsx` : 2 tests (lancement, premium payé), écrits avant le code (rouges, puis verts).

## Vérifications
- `npm run test` (2733 ✔), `npm run build`, `npm run lint` (6 erreurs, comme avant), `npm run visual -- --play --empty --subscription=launch
  --routes=/settings` relu.

## Données
- Texte seulement ; aucune donnée touchée ; export / import intacts.

## Demandes iOS
- Note « Nouveautés » marquée `"variants": ["play"]` (Play Billing, IOS-3).

## Suite
- BACKLOG par impact ; POL-PLAY-11 (alpha + `shrinkResources`) quand Android vitals aura une journée sans plantage.

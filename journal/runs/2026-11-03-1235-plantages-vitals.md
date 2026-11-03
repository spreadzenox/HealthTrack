# Run du 03/11/2026 12:35 (Paris, CET) — Plantages et ANR dans le bilan de « Play — AAB » (VITALS-1)

**Type** : 🔧 code (scripts de la CI et workflow ; rien de visible dans l'app)

## Constat au démarrage
- Main à `4cc1b86` (#652), tous les workflows verts ; aucune PR « [Auto] » ouverte (la #51, hors routine, n'est pas touchée).
- Pistes (bilan de « Play — AAB » de `4cc1b86`) : test interne 100736, Alpha 100721 « déployée » (examen non lisible par l'API).
- Manque repéré : POL-PLAY-11 et TEST-ALPHA-1 demandent une version Alpha « sans plantage connu », mais la routine
  ne lit jamais Android vitals ; elle s'en remettait à l'absence de signalement.

## Fait
- `app/scripts/play/vitals.mjs` : `readErrorIssues` (API Play Developer Reporting v1beta1, `errorIssues:search`, 30
  derniers jours par défaut, 5 pages de 50 au plus, réessais des pannes passagères), `formatErrorIssues` (verdict,
  plantages et ANR triés par rapports, erreurs non fatales ignorées, ⚠️ si la version envoyée est touchée, heures de
  Paris, cellules bornées à 120 caractères sans `|`), `explainVitalsError` (API désactivée → commande `gcloud services
  enable` du propriétaire ; 403 → droit « Afficher les informations de l'application » ; autre → message recopié).
- `vitals-cli.mjs` et deux étapes à la fin de « Play — AAB » : jeton à portée `playdeveloperreporting` (gh-deployer,
  connexion sans clé), puis lecture ; `if: always()` + `continue-on-error` : jamais bloquant pour l'envoi.
- Rien de personnel : Google ne donne que des comptes, la classe de l'erreur et l'endroit du code. Sécurité des
  données inchangée (aucune donnée nouvelle collectée chez l'utilisateur).

## Vérifications
- `vitals.test.mjs` : 11 tests (pagination, refus, tri, version touchée, cellules sûres, messages d'erreur).
- Suite complète, lint, build et `npm run visual -- --play` : voir la PR.

## Demandes iOS
- Aucune (Android seulement).

## Suite
- Lire la section « Plantages et ANR » du bilan de « Play — AAB » du merge. Si elle demande l'API (P43), le geste est
  écrit dans `PRODUIT.md` §4. Puis s'en servir pour TEST-ALPHA-1 (07–08/11).
- INSTALLS-21b-2 ; recaler `until` si le propriétaire invite après le 03/11.

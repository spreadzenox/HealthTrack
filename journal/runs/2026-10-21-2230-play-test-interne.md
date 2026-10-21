# 2026-10-21 22:30 Paris (20:30 UTC) — Jalon 3c : envoi automatique de l'AAB en test interne

**Type** : 🧭📦 code (run court, exception au jalon M demandée par le prompt) · **PR** : voir « Après le merge »

## Pourquoi
- Main à `7475476` (#258), tous les workflows verts (Build & Release v199, Play — AAB 343, Tests, émulateur A56).
  Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, pas à nous).
- Signalement du 20/10 19:05 déjà corrigé (v188). P11 fait par le propriétaire (~20:45) : le prompt demande que le
  premier run de code soit un run court qui branche l'envoi automatique de l'AAB en test interne.

## Ce qui a été fait
- `app/scripts/play/publish.mjs` : edit → langue de la fiche → import AAB → piste `internal` (statut `completed`, notes
  de version ≤ 500 car. depuis les titres des Nouveautés) → commit. Pistes autorisées : `internal`, `alpha` seulement.
  Cas gérés : app brouillon (version `draft`), `changesNotSentForReview`, versionCode déjà envoyé, edit abandonné sur
  erreur. `publish-cli.mjs` : code 2 sur 401/403 (avertissement, workflow vert), 1 sinon. Testé localement avec un faux
  jeton → 401 → code 2 et message attendu.
- `play-bundle.yml` : deuxième `google-github-actions/auth` (`token_format: access_token`, portée androidpublisher),
  étape « Envoyer en test interne », `workflow_dispatch` avec choix de piste (internal / alpha).
- `build.gradle` : `ndk { debugSymbolLevel 'SYMBOL_TABLE' }` sur la variante play.
- Journal : `INFRA.md` (section « Envoi sur Google Play »), `PRODUIT.md` (P11 ✅, jalon 3), `BACKLOG.md` (3c [~]),
  résumé de la semaine.

## Vérifications
- `npm run test` : **1 747 Vitest verts** (+9). `npm run lint` : 6 erreurs, comme avant (0 dans `scripts/play`).
  `npm run build` OK. `npm run visual` OK (aucun écran touché ; accueil regardé). Pas de changement visible → pas
  d'entrée « Nouveautés ».

## Suite proposée
- Vérifier le premier envoi réel (résumé du workflow « Play — AAB » sur main) ; si brouillon ou accès refusé, le noter.
- Prochain run de code : **M0** (nom Halcya) puis **M1** (sommeil). Runs courts suivants côté Play : test fermé
  (piste `alpha`, `halcya-testeurs@googlegroups.com`), page de confidentialité GitHub Pages, fiche du Store.

## Après le merge
- (noté par le run du 22/10 00:30) Build & Release v200 vert ; « Play — AAB » vert : **versionCode 346 importé et déployé
  sur la piste `internal`**, « Validée », notes de version en français. L'accès de gh-deployer était donc effectif ~2 h
  après l'invitation. PR #260 (M0) laissée ouverte par ce run, reprise et fusionnée par le run suivant.

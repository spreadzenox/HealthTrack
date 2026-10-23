# 2026-10-23 23:30 Paris (21:30 UTC) — VC-17 : paywall honnête (P25, option ① par défaut)

**Type** : 🧭💳 chantier produit (passe « version candidate », critère C3)

## Constat
- Main à `72561bf` (#304) ; Tests, Build & Release, Play — AAB, émulateur A56 verts. Aucune PR « [Auto] » ouverte
  (seule #51 `cursor/*`, non touchée). Run de code. P25 toujours sans réponse → option ① appliquée (réversible),
  comme annoncé dans `PRODUIT.md`.

## Ce qui a été fait
- `config/premiumBenefits.js` : `PREMIUM_BENEFITS` avec `delivered` et `deliveredBy` ; seule l'analyse IA des repas
  (plafond premium 10 / jour du relais) est livrée. Pistes avec délais (jalon 5), FODMAP et PDF (jalon 7) : non livrés.
- `pages/Premium.jsx` (paywall et dernier écran de l'onboarding) : liste cochée = livrés ; en dessous, « En
  préparation, inclus sans supplément » + bouton « détails » qui déplie les trois autres. CSS : la boîte lilas englobe
  les deux listes.
- Tests : `premiumBenefits.test.js` (environnement node) échoue si un avantage coché n'est relié à aucun fichier
  existant ou si le plafond annoncé diffère de `loadConfig({}).premiumDaily` du relais ; `Premium.test.jsx` : FODMAP
  et PDF absents tant que « détails » n'est pas touché.
- Changelog `2026-10-23-2330-paywall-honnete.json`.

## Vérifications
- `npm run test` : 166 fichiers, 2 045 tests, **1 échec hors sujet** : `UpdateBanner.test.jsx` (progression en Mo)
  sous charge ; repasse 3 fois sur 3 isolé, fichier non touché → instabilité de minutage notée (VC-19).
- `npm run build` OK ; `npm run lint` : 6 erreurs, identiques à main.
- `npm run visual -- --play --routes=/premium` en clair et `--dark` : captures relues (1 avantage coché, ligne « En
  préparation » + « détails », 0 erreur JS).

## Reste pour C3 (nouveau VC-18)
- Rappel de fin d'essai (« jour 12 : on vous prévient ») : rien ne l'envoie aujourd'hui ; ne pas l'afficher avant
  d'avoir une notification locale programmée à l'achat (ou la confirmation que Google Play prévient lui-même).
- Lien « Conditions » : aucune page CGU/CGV publiée ; brouillon de `journal/legal/` à publier par GitHub Pages
  (`scripts/site/build-site.mjs`), marqué « à faire valider par un juriste ».

## Suite
- VC-18, VC-15, VC-5, VC-10, VC-9 ; VC-19 (stabiliser le test UpdateBanner).

## Merge
- PR #305 : les 8 checks sont verts (Vitest, Build APK, relais, protocole montre, perf, émulateur A56 API 35 et 36),
  et main n'a pas bougé (`72561bf`). **Pas mergée** : dans cette session, le classificateur de permissions a refusé
  le merge (« Merge Without Review »). Le run suivant (ou le propriétaire) n'a qu'à faire le merge en squash une fois
  la branche remise à jour.

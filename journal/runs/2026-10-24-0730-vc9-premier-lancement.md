# 2026-10-24 07:30 Paris (05:30 UTC) — VC-9 : premier lancement à froid de la variante play ; VC-19

**Type** : 🧭 chantier produit — passe « version candidate », critère C4

## Constat
- Main à `e118356` (#311) : workflows verts. Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- Restaient VC-9 (temps du premier lancement play et absence d'erreur JS, jamais mesurés : `npm run visual` n'exerce
  pas les plugins natifs) et VC-19 (test `UpdateBanner` instable sous charge).

## Ce qui a été fait
- **VC-9** — workflow « Test — émulateur Samsung Galaxy A56 » : le job de build fabrique aussi l'APK debug **play**
  (`VITE_DISTRIBUTION=play npm run build`, `cap copy`, `assemblePlayDebug -PextraAbis=x86_64`), transmis aux jobs
  API 35 et 36. Nouveau `.github/scripts/play-cold-start.sh`, appelé par `run-emulator-tests.sh` : désinstalle puis
  installe la variante play (données vierges), arrête la sideload, `am start -W` sur l'activité résolue
  (TotalTime), attend le titre « Comprenez ce qui va… » de l'onboarding dans l'arbre d'accessibilité (≤ 90 s),
  relève les erreurs JS (`E Capacitor/Console`, « Uncaught », « Unhandled », filtrées sur le PID de l'app) et les
  plantages natifs (tampon `crash`). Résumé dans la page du job (« Premier lancement à froid — variante play ») ;
  artefacts : capture, arbre UI, logcat. **Le job échoue** si l'écran n'apparaît pas ou s'il y a une erreur JS non
  interceptée ou un plantage ; les `console.error` interceptés sont seulement listés.
- **VC-19** — `UpdateBanner.test.jsx` : le faux plugin reste « en cours » tant que le test n'a pas vu la progression
  (plus de course avec le sondage de 800 ms).

## Vérifications
- `npm run test` : 171 fichiers, 2 102 tests verts. `npm run build` OK. `npm run lint` : 6 erreurs, identiques à main.
- `npm run visual` complet : 0 erreur JS ; relu `/bienvenue` (le titre attendu par le script y est).
- Mesures de l'émulateur : voir « Résultat CI » ci-dessous.

## Résultat CI
- (à compléter)

## Reste / suite
- C4 reste 🟡 : un émulateur logiciel en build debug donne des majorants ; à confirmer par un testeur sur un vrai
  téléphone.
- Prochain run de code : **6d** (workflow qui crée l'abonnement `halcya_premium` et ses formules par l'API ; si Google
  refuse faute de vérification bancaire, noter l'erreur exacte et réessayer aux runs suivants), puis M4.

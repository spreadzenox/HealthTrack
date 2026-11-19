# Run du 19/11 02:30 — captures de la fiche App Store : sélection de la refonte (reste de REFONTE-2)

**Type** : 🛠️ code (outillage des fiches) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main b10ea19.

## État de départ
- main vert (#1111 mergée : Build & Release, Tests, Play — AAB, Play — fiche du Store, émulateur verts).
- Aucune PR « [Auto] » ouverte. Alpha de 23:45 pas encore partie à 01:30 UTC (dernier passage planifié : 18/11 03:53 UTC,
  en échec pendant le blocage de facturation). Soumission bêta de la 1170 : au premier run après l'Alpha.

## Ce qui a été fait
- `.github/scripts/native-sweep/check.mjs` : le balayage natif des émulateurs suit la barre de la refonte
  (`/`, `/ma-journee`, `/recommendations`, `/tendances`, puis Sources, Montre, Réglages, Premium). `/journal` (simple
  redirection vers Tendances › Jour depuis REFONTE-7) est retiré.
- `iphone/store/app-store/captures.md` : nouvelle sélection des captures de la fiche App Store pour la refonte, iPhone
  6,9" (Accueil avec Pilou, Ma journée, Objectifs, Tendances, Agir, Repas, Réintroduction, Accueil sombre) et iPad 13"
  (même ordre, Nutrition à la place de Réintroduction, choix « B » du propriétaire du 2/11 gardé). Les captures en ligne
  (6/11) montrent Analyses et le Journal jour par jour : elles ne peuvent pas accompagner la soumission de la refonte.
- Test d'abord (2 échecs sur l'ancien tableau, puis verts) : `store-push.test.mjs` exige Ma journée en 2ᵉ, Agir, ni
  Journal ni Sources (iPhone), Ma journée sans Journal (iPad).

## Pourquoi la série n'est pas lancée maintenant
Le simulateur suit l'horloge du runner : lancée la nuit, la série montrerait Pilou endormi sur une île nocturne (même
défaut corrigé sur la fiche Play au run de 01:30 par `--now=14:00`). À lancer entre 9:00 et 17:00 (Paris), une série
iPhone puis une iPad (environ 40 min de Mac chacune, dans la cible de 3 h par jour).

## Vérifications
- `node --test iphone/scripts/store-push.test.mjs` : 11 verts. `node --check` sur `check.mjs`.
- `npm run test` (app) : voir la PR (aucun code de l'app touché).

## État
- TestFlight : 893 (1170.1170) envoyée le 18/11 ; 1148.1148 chez « Testeurs Halcya ». Parité : 70 % (inchangée).
- Testeurs Play : 4 inscrits sur 12 (pas de nouveau relevé).

## Suite proposée
1. Après l'Alpha : 1170 aux « Testeurs Halcya », soumission bêta, puis expiration.
2. **REFONTE-2-ASC**, de jour : `ios-build.yml` sur main avec `devices: iPhone 17 Pro Max`, puis `iPad Pro 13-inch (M5)` ;
   regarder chaque capture ; `store-push.yml` « captures » et « captures_ipad ».
3. R18-GOLD-PRIX : « Add for Review » à essayer (partie 1 de PI2).

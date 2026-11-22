# Run du 22/11 16:30 — FUSION-3, correctifs 13 et 45 (app Santé : divulgation et import)

**Type** : 🛠️ code (en coulisses) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main d383472 au départ.

## État de départ
- main sur d383472 (#1197) : Build & Release, Tests, Play — AAB et émulateur Galaxy A56 verts.
- #1198 (run de 15:30, temps d'écran) ouverte et prête : tous les checks verts, dont le build iOS sur simulateur
  (fini à 16:18). Rien de neuf du propriétaire dans le prompt.

## Ce qui a été fait
1. **#1198 mergée** (squash, 1050c57) après lecture des captures : iPhone (Sources « Vos sources », accueil 3 sur 4
   « Ce que Halcya suit pour vous », console sans erreur de l'app) et Android (`npm run visual -- --routes=/connectors`
   : Sources inchangé, aucune erreur). Branche déjà à jour sur main.
2. **FUSION-3** : un seul sujet, l'app Santé au premier lancement sur iPhone.
   - 13 : `permissionDisclosures.js` remplace la divulgation Health Connect par celle de l'app Santé si `FEATURES.iosStore`.
   - 45 : `Onboarding.jsx` (`IMPORT_SPAN` : « 6 derniers mois » sur iPhone, « 30 derniers jours » ailleurs) et
     `firstImport.js` (`IOS_FIRST_IMPORT_DAYS = 180` sur iPhone).
   - partie `firstImport.js` du 15 (import de `FEATURES`, « App Santé » comme source du « aha ») : nécessaire au 45
     sur Android (sans elle, `FEATURES` n'existait pas dans `firstImport.js`). Le 15 ne garde que `Data.jsx` et `today.js`.
   - Tests Android d'abord : divulgation Health Connect (titre, 30 jours, jamais « app Santé ») et import de 30 jours
     sans fenêtre de lecture. Les tests d'overlay `*.appstore.test.js` restent la preuve iPhone.
   - Correctifs 13 et 45 supprimés : **29 restent**. Rien de visible sur Android : pas de note de Nouveautés.

## Vérifications
- Android : Vitest complet 4 306 tests verts (44 sautés), lint sans erreur, build OK ; `npm run visual -- --empty
  --routes=/` et `--routes=/connectors` sans erreur de page.
- iPhone : `scripts/upstream.sh` applique les 29 correctifs (v1259) ; dans `iphone/upstream/app`, `src/config`,
  `firstImport`, `Onboarding` et `PermissionDisclosure` : 23 fichiers, 175 tests verts.
- Build iPhone de la PR (simulateur) au passage en « prête » ; merge au run suivant après lecture des captures
  (accueil vierge : Santé, import ; Sources).

## Suite proposée
1. Merger cette PR une fois le build iOS vert (captures d'accueil vierge iPhone : « 6 derniers mois »).
2. FUSION-3 : 34 (temps d'écran iPhone) ou 06 (textes, gros, à découper).
3. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45 ; demain lundi, archive de S47.

## Pour le propriétaire
« 👉 PI2 prête » (inchangé). Parité iPhone : 70 %. TestFlight : 1244.1244 chez « Testeurs Halcya » (dernier relevé).
Testeurs Play : 4 inscrits sur 12 (dernier relevé connu).

# Run du 22/11 17:30 — #1199 mergée, FUSION-3 correctif 34 (temps d'écran iPhone)

**Type** : 🛠️ code (en coulisses) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 1050c57 au départ.

## État de départ
- main sur 1050c57 (#1198) : Build & Release, Tests, Play — AAB et émulateur Galaxy A56 verts.
- #1199 (run de 16:30, app Santé au premier lancement) ouverte, prête, 15 checks verts (build iOS sur simulateur
  compris), à jour sur main.

## #1199 finie
- Captures iPhone (`captures/pr-1199`) relues : premier lancement, carte Santé « … et vos 6 derniers mois. Elle n'écrit
  rien et n'envoie rien. » ; écran « Ce que Halcya suit pour vous » ; feuille d'autorisation Santé. `js-errors.txt` vide.
- Android : `npm run visual -- --empty --routes=/,/connectors` sur la branche, Accueil vide et Sources sans erreur.
- Ligne d'attribution retirée du corps de la PR (règle du 16/11), puis mergée en squash (ec7a63d), message écrit à la main.

## FUSION-3 : correctif 34
- `PhoneUsageCard.jsx` : texte « Détails », guide « Autoriser » (Face ID ou code, iOS 26.4, UE) et « prises en main »
  sous `FEATURES.iosStore` ; le guide Android reste sous `!FEATURES.iosStore`.
- `permissionDisclosures.js` : divulgation « Avant d’autoriser l’accès au temps d’écran » sur iPhone.
- `phoneUsageSync.js` : sur iOS, plugin `PhoneUsage` et lecture des segments horaires (`readsSegments`, décidé par la
  plateforme) ; sur Android, inchangé.
- `phoneUsageIos.js` et `phoneAppsIos.js` (calculs purs) et leurs tests passent d'`iphone/overlay/app/src/ios/` à
  `app/src/ios/`. `iphone/patches/34-…` supprimé : **28 correctifs restent.**
- Test Android d'abord (`phoneUsageSync.test.js`) : un plugin Android lit les allumages d'écran, jamais
  `queryUsageSegments`, et le message d'accès reste celui d'Android. Les tests d'overlay `PhoneUsageCard.appstore.test.jsx`
  et `phoneUsageSync.ios.test.js` restent la preuve iPhone.
- Rien de visible sur Android : pas de note de Nouveautés.

## Vérifications
- Android : 4 320 tests verts (392 fichiers), lint sans erreur, build OK.
- iPhone : `scripts/upstream.sh` applique les 28 correctifs (v1260) ; dans `iphone/upstream/app`, 354 tests de
  `src/ios/`, `PhoneUsageCard`, `phoneUsage*` et `src/config/` verts (49 fichiers).
- Build iPhone sur simulateur au passage de la PR en « prête » ; merge au run suivant après lecture des captures
  (Sources, carte Temps d'écran).

## Suite proposée
1. Finir cette PR (build iOS, captures Sources), puis FUSION-3 : le lot VFC SDNN (17, 19, 20, 21, 30, 32, 56, 57, 64,
   à regrouper en une PR) ou 06 (textes, à découper).
2. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45 ; demain lundi, archive de S47 et relevé des heures de Mac.

## Pour le propriétaire
« 👉 PI2 prête » (inchangé). Parité iPhone : 70 %. TestFlight : 1244.1244 chez « Testeurs Halcya » (dernier relevé).
Testeurs Play : 4 inscrits sur 12 (dernier relevé connu).

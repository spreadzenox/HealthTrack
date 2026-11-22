# Run du 22/11 15:30 — #1197 mergée, FUSION-3 temps d'écran

**Type** : 🛠️ code (en coulisses) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main bf9ca81 au départ.

## État de départ
- main sur bf9ca81 (#1196) : Build & Release, Tests, Play — AAB et émulateur Galaxy A56 verts.
- #1197 (run de 14:30, copie de secours) ouverte, prête, tous les checks verts (build iOS sur simulateur compris), à jour sur main.

## #1197 finie
- Captures iPhone (`captures/pr-1197`) relues : premier écran avec « Une copie de secours… (1 332 mesures) » et
  « Reprendre mes données », reprise « 1 332 mesures reprises, avec vos réglages. », Sauvegarde (phrase de la copie dans
  Fichiers). Journal du simulateur : restauration (1 332 avant et après) et suppression (copie effacée) ; aucune erreur JS.
- Android : `npm run visual` sur la branche, Sauvegarde et Bienvenue inchangées (aucune carte de restauration).
- Mergée en squash (d383472).

## FUSION-3 : correctifs 44, 52 et la carte du 07
- `PhoneUsageCard.jsx` : import de `FEATURES`, « Pas encore disponible sur iPhone. » (07), carte non proposée avant
  iOS 26.4 si elle n'était pas activée (44), sous `FEATURES.iosStore`.
- `Onboarding.jsx` : phrase du temps d'écran propre à l'iPhone (52).
- `iphone/patches/07-…` ne garde que `WatchDiagnostic.jsx` ; 44 et 52 supprimés. **31 correctifs restent.**
- Test d'abord côté Android (`PhoneUsageCard.test.jsx` : accès non pris en charge, la carte reste affichée) ; les tests
  `*.appstore.test.jsx` de l'overlay restent la preuve iPhone.
- Rien de visible sur Android : pas de note de Nouveautés.

## Vérifications
- Android : voir la PR (Vitest complet, lint, build).
- iPhone : `scripts/upstream.sh` applique les 31 correctifs (v1258) ; dans `iphone/upstream/app`, tests de
  `PhoneUsageCard`, `Onboarding`, `phoneUsage*` et `WatchDiagnostic` verts (13 fichiers, 122 tests).
- Build iPhone de la PR au passage en « prête ».

## Suite proposée
1. Finir cette PR (build iOS, captures Sources et premier lancement), puis FUSION-3 : 34 (temps d'écran iPhone) ou 06.
2. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45 ; demain lundi, archive de S47.

## Pour le propriétaire
« 👉 PI2 prête » (inchangé). Parité iPhone : 70 %. TestFlight : 1244.1244 chez « Testeurs Halcya ». Testeurs Play :
4 inscrits sur 12 (dernier relevé connu).

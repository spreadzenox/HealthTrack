# Run du 19/11 04:30 — Digestion : un seul décompte (POLISH-SIM-102, UPG-7)

**Type** : 🛠️ code (polish de la refonte, objectif du 22/11) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 9a6750d.

## État de départ
- main vert (#1113 : Tests, Build & Release, Play — AAB, émulateur verts).
- Aucune PR « [Auto] » ouverte (seule #51, brouillon de mai, hors routine).
- Alpha de 23:45 pas encore partie à 03:30 UTC (cron de GitHub en retard, comme les nuits précédentes).

## iPhone
- **1173.1173 (893) ajoutée à « Testeurs Halcya » et soumise à l'examen bêta** (« TestFlight — examen bêta
  (soumission) », run 44452027825, lancé par l'API GitHub ; log : « à tester, groupe, examen bêta », version App Store
  non touchée).
- Expiration : essai lancé (`nettoyage`, `essai`) pour voir le plan ; l'expiration réelle attend la validation de la
  1173.1173 par Apple (règle : sauf la dernière validée et celle en examen depuis moins de 24 h).
- Parité : 70 % (inchangée) ; code partagé, aucun correctif de `iphone/patches/` ne touche les fichiers modifiés.

## Ce qui a été fait
- `DigestBlock.jsx` (Ma journée) : sous « N/28 jours notés », une ligne nomme les deux paliers : « Premier score au 14e
  jour noté, pistes au 28e. » ; passé le 14e jour : « Votre score de confort est dans Objectifs. Pistes au 28e jour noté. »
- `Objectives.jsx` : la carte Confort digestif en attente dit « Pistes au 28e jour noté. » au lieu de « La digestion
  demande plus de recul. » (le titre dit déjà « Premier score dans N jours notés »).
- Note de Nouveautés `2026-11-19-0430-paliers-digestion` (Android et iPhone).
- Tests d'abord (3 rouges, puis verts).

## Vérifications
- `npm run test` : **4 087 verts** ; `npm run build` vert ; ESLint propre sur les fichiers touchés.
- `npm run visual -- --routes=/ma-journee,/recommendations --onboarding=gut --history-days=10 --now=14:00` : captures
  relues (Ma journée 9/28 avec la ligne des paliers ; Objectifs « Premier score dans 5 jours notés », « Pistes au 28e
  jour noté. 9 sur 14 »). Première version de la carte Objectifs répétait « Premier score » : corrigée.

## Suite proposée
1. Merger cette PR après ses checks (build iPhone compris) ; expiration réelle des anciennes builds après validation
   de la 1173.1173.
2. Vérifier l'Alpha de la nuit (cron en retard).
3. Polish du 22/11 : UPG-6 (moyenne sur 7 jours dite), POLISH-SIM-103 (bien-être d'un jour : 4,0 ou 4,2 ?).

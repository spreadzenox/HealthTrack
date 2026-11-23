# Run 23/11 17:30 — #1220 mergée (cibles d'essai arrondies, objectifs des personas)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 8c2ab90 (#1220) ·
**TestFlight** : 1268.1268 validée pour « Testeurs Halcya » (relevé de 07:33 UTC), 1244.1244 attachée à la version 893 ·
**Parité** : 70 % (33/47), 2 correctifs iPhone restent (01, 27)

## État de départ
- main vert sur 74cc687 (#1219) : Tests, Build & Release v889, émulateur, Play — AAB.
- PR de la routine ouverte : **#1220** (runs de 15:30 et 16:30), prête, à jour sur main, 18 checks : tous verts
  (dont le build iPhone, 36 min) sauf un doublon « Tests d'Android avec les correctifs iOS » annulé par le passage
  en « prête » et refait vert. #51 (`cursor/*`) pas touchée.

## #1220
- Diff relu : `MEASURED.round` de `trials.js` (pas à 100, sommeil et écran à 5 min) et son test ; `freshOnboarding`
  de l'outil des personas et son test.
- En local : tests ciblés verts (3 fichiers, 53 tests), `npm run build` et `npm run visual` verts (aucune erreur JS).
- Captures relues : Android `agir-1` (« Dormir au moins 7 h 55 », proposé) ; iPhone
  `iphone-16e-demo-clair-agir-essai.png` (`captures/pr-1220`, « Dormir au moins 7 h 30 », en cours). Mise en page
  inchangée.
- **Mergée en squash (8c2ab90)**, titre et message écrits à la main, sans ligne d'attribution.

## Pourquoi pas de nouveau code ce run
- Heures de Mac : environ 12,8 h par jour depuis la CI économe pour une cible de 3 h. Ouvrir une PR de code par run
  relance un build iPhone par heure. Ce run se limite au merge et au journal (aucun build iPhone lancé) ; la
  décision sur la règle du build iPhone de PR reste en tête du résumé.
- Le reste de POLISH-SIM-150 demande d'abord un banc (la cible changerait) ; FUSION-3 27 attend FUSION-4.

## Suite
1. Vérifier les workflows du merge de #1220 (release v890 attendue).
2. POLISH-SIM-150 (reste) : banc avant de faire partir la cible de l'habitude de l'Accueil, idéalement groupé avec
   d'autres petits correctifs dans une seule PR (un seul build iPhone).
3. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45 ; run « idées » de 20:00.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

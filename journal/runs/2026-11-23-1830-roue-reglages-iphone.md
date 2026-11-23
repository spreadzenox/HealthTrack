# Run 23/11 18:30 — DEM-IOS-7 : « ⚙ Réglages » sur iPhone (PR en brouillon)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 910c1d4 (#1221),
release v890 · **TestFlight** : 1268.1268 validée pour « Testeurs Halcya » (relevé de 07:33 UTC), 1244.1244 attachée
à la version 893 · **Parité** : 70 % (33/47), 2 correctifs iPhone restent (01, 27)

## État de départ
- main vert sur 910c1d4 : Tests et émulateur verts ; Build & Release v890 (#1220) vert, Play — AAB vert.
- Aucune PR de la routine ouverte ; #51 (`cursor/*`) pas touchée.

## DEM-IOS-7
- Sur iPhone, « Réglages » est aussi l'app du système : « Vous pourrez le relier plus tard dans Réglages › Sources »
  peut envoyer la personne dans les Réglages d'Apple.
- `config/distribution.js` : `inAppSettingsFor(features)` et `IN_APP_SETTINGS` (« Réglages » sur Android,
  « ⚙ Réglages » sur iPhone, d'après `FEATURES.iosStore` du correctif 01). Les 13 renvois aux réglages de l'app
  (Onboarding : 10 ; Agir : 1 ; rappel du soir : 1 ; divulgation de la lecture au déverrouillage : 1) passent par
  elle. Les chemins des réglages du système (Notifications, Santé, Temps d'écran, Général) restent tels quels.
- Tests d'abord (`distribution.test.js`) : la valeur par plateforme, et un balayage des sources qui refuse tout
  « Réglages › » en dur hors réglages du système. Rien ne change sur Android (mêmes textes, tests d'Onboarding
  inchangés sauf la lecture de la source).
- Note de Nouveautés iPhone : `iphone/overlay/app/src/data/changelog/2026-11-23-1830-roue-reglages-iphone.json`
  (`"variants": ["appstore"]`).
- Correctifs iPhone 01 et 27 : `git apply --check` vert.
- En local : `npm run test` (4 479 verts), `npm run build`, `npm run lint` (0 erreur, comme avant), `npm run visual`.

## Pourquoi en brouillon
Heures de Mac (≈ 12,8 h par jour pour une cible de 3 h) : la PR reste en brouillon pour grouper un autre petit
correctif du code partagé avant un seul build iPhone. Le run suivant l'enrichit ou la passe en « prête », puis
relit sur `captures/pr-<N>` une capture de l'accueil (écran « Vos sources ») où « ⚙ Réglages » doit s'afficher en
texte, pas en emoji couleur ; sinon, revenir à « la roue › » en toutes lettres.

## Suite
1. Grouper dans la PR un autre petit correctif partagé (À étudier du 22/11 : une phrase sur le poids de la note du
   jour dans « Comment c'est calculé »), puis passer en « prête » ; merge après le build iPhone et la capture relue.
2. Ce soir : run « idées » de 20:00, build iPhone et TestFlight à 21:20, Alpha à 23:45.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

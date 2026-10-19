# 2026-10-19 14:30 Paris (12:30 UTC) — Visage : 2e essai et lectures par jour (I118)

**Type** : 🔴🙂 chantier bien-être automatique (consigne §00000)  ·  **PR** : #220

## Pourquoi
- Démarrage : main à `0b946bc` (#219), release **v174** publiée (temps par app). Aucune PR « [Auto] » ouverte. Le
  signalement du 19/10 08:37 est corrigé depuis v173 (#218). Aucun diagnostic de l'A56 dans `journal/diagnostics/`.
- Étape suivante du plan : **I118** — que le visage donne assez de lectures valides par jour (simulé : ≥ 12 → porte
  en 2–3 mois ; 8 → nettement plus lent), sans biais de composition.

## Ce qui a été fait
- **Natif, règle pure** `FaceSchedule.shouldRetry(trigger, faceFound, alreadyRetried, sinceUnlockMs)` : une rafale
  du déverrouillage qui n'a **aucune image exploitable** est reprise **une fois**, `RETRY_DELAY_MS` = 2 s plus tard,
  seulement si le 2e essai tombe dans les `RETRY_WINDOW_MS` = 10 s après le déverrouillage. Jamais pour le test
  (« manual »), jamais après une erreur caméra.
- **Service** : l'heure du déverrouillage (`elapsedRealtime`) suit la rafale ; le 2e essai garde le déclencheur
  `unlock`, ne recompte ni le déverrouillage ni la rafale du jour, n'est pas bloqué par l'intervalle minimal posé par
  le 1er ; il est annulé si l'écran s'éteint (même `removeCallbacksAndMessages`). Compteurs `retries`,
  `retryFaces` (exportés tels quels par `status`).
- L'intervalle minimal était **déjà de 2 min** (le plan parlait de 5 → 2 min) : inchangé.
- **JS** `faceDailyCounts(entries, { today })` (`services/faceBursts.js`) : sur les 7 derniers jours **terminés** où la
  lecture a tourné, médianes des rafales du déverrouillage, de celles avec un visage (`moodFaceBursts`), et des
  déverrouillages lus dans `phone_usage` (null sans temps d'écran). `VALID_BURSTS_TARGET = 12`, `enough`.
- **Diagnostic** : `perDay` et `retries { tried, faces }` dans le JSON exporté ; lignes « Par jour (médiane sur N
  jours) : … déverrouillages, … lectures, … avec un visage — objectif de 12 atteint / en dessous des 12 visés : la
  calibration sera plus lente » et « 2e essais (2 s après une lecture sans visage) : N, visage lu M fois ».
- `npm run visual -- --face` : rafales fictives étalées sur 3 jours + compteurs de 2e essais.
- Nouveauté `2026-10-19-1430-visage-rafales-par-jour.json`.

## Biais (I114, D5)
Le 2e essai garde le même déclencheur (le déverrouillage) et ne dépend que de l'échec du 1er (visage absent, sombre,
tourné), pas de ce que montre l'écran ; il arrive ≈ 4–5 s après le déverrouillage, avant la plupart des contenus.
Le test « composition » reste vert (seul `unlock` compte pour l'humeur). Risque résiduel noté : si le 1er essai
échoue plus souvent dans certains contextes (nuit), le 2e essai *réduit* ce déséquilibre plutôt qu'il ne l'aggrave.

## Tests (TDD : rouges avant le code)
- `FaceScheduleTest` (JVM, compilé et lancé localement avec JUnit 4 : **8 OK**) : 2e essai une seule fois, pas si
  visage lu, fenêtre de 10 s, jamais pour le test ni un déclencheur inconnu.
- `faceBursts.test.js` : médianes sur jours terminés, jours sans lecture ignorés, tests « manual » exclus, null sans
  jour terminé.
- `faceSense.test.js` : `perDay`, `retries`, deux libellés, rien quand il n'y a rien.

## Vérifications
- `npm run test` : **1 517 verts** (114 fichiers). Lint **6 erreurs** (inchangé). Build ✅.
- `npm run visual` ✅ toutes pages ; `--routes=/connectors --face --click=Diagnostic` (lignes « Par jour » et
  « 2e essais » lisibles, en dessous des 12 visés sur les données fictives) ; `--empty --face=off` ; `--light`.
  Seul message console : « AppManager already registered » (préexistant).
- `FaceSenseService.java` non compilé localement (pas de SDK Android) : c'est le check « Build APK » qui le valide.

## Pour le propriétaire (Galaxy A56)
Après une semaine avec la lecture active : Plus → Connecteurs → Lecture du visage → Diagnostic → ligne « Par jour ».
**À renvoyer** avec le diagnostic exporté : cette ligne et « 2e essais ». Si « avec un visage » < 12, les motifs
« Images écartées » diront s'il faut agir (luminosité, angle).

## Suite
I89 guide Shizuku / ADB (détecter le privilège `appops`), puis I119 lexiques → I117 dictée du soir, I115 estimation du
jour quand la porte peut s'ouvrir, I120 plus tard.

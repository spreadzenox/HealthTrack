# 2026-10-25 04:33 CET (03:33 UTC) — M6b : VFC de journée et température relues en arrière-plan

**Type** : ⌚ chantier montre (signalement du 21/10 : couverture maximale ; A.3 resynchronisation en arrière-plan)

## Constat au démarrage
- Main à `789136a` (#348, journal v264), aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée) ; tous les
  workflows de main verts (Tests, Build & Release v264, Play — AAB, émulateur).
- Polissage du 24/10 terminé côté app ; POL-1d attend P28 (propriétaire) → étape suivante du backlog : M6b.

## Ce qui a été fait
- `huawei/WatchP2P.java` (nouveau) : ping, demandes de dictionnaire 500044 / 400012, accusés 0xCF, pagination
  (max + 1 s, 10 pages au plus en arrière-plan), charges utiles gardées brutes ; aucune autre donnée décodée en Java.
- `WatchReader` : surcharge `read(…, files, dictionary)` ; capture `dict: [{ id, cls, since, max, pages }]`.
- `BackgroundSync` : `hrvDayUntil` / `skinTempUntil`, `dictionaryRequests` (seulement les classes déjà reçues app
  ouverte), `recordDictionary` ; `BackgroundWatchSync` (préférences) et `WatchCapturePlugin.shareResume` les gardent.
- JS : `dataFromCapture` décode `dict` (`parseDictionaryPage`, `hrvDayValues`, `skinTempValues`) → `hrvDay`,
  `skinTemp`, `dictionary` ; `shareResumeWithNative` envoie `hrvDayUntil` / `skinTempUntil` depuis `dictUntil`.
- Spécification : `protocoles/huawei.md` §10.16. Entrée « Nouveautés ».

## Vérifications
- JUnit **132** verts (6 nouveaux `WatchP2PTest` : octets identiques à p2p.js pour ping / demande / accusé ; numéro 2
  puis bouclage ; pages + page vide + accusés ; ping refusé ou muet ; aucune demande sans classe ; reprise).
- Vitest **2 185** verts (capture : décodage, reprise par classe, page illisible, `unsupported` ; import : `dictUntil`
  avance ; `shareResume`) ; build OK ; lint inchangé (6 erreurs préexistantes) ; `npm run visual` OK, `/montre` relue
  (inchangée).

## Suite
- À confirmer sur la GT 6 Pro (VFC de journée / température plus récentes que la dernière ouverture).
- POL-1d dès que P28 est faite ; sinon M7 (séances : FC et allure).

## Après le merge (#349, `1ac39a3`)
- Checks de la PR tous verts du premier coup (Vitest, Build APK, relais, protocole montre Java, perf, émulateurs API 35 et 36).
- Sur main : « Tests », « Build & Release » (**v265**, APK 33 767 304 octets, 33,8 Mo) et « Play — AAB » (test interne) verts.

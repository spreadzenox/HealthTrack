# 2026-10-25 02:33 CET (01:33 UTC) — POL-1b : écran d'activation de la lecture au déverrouillage (play)

**Type** : 🧭 chantier produit (polissage du 24/10 15:00, point 1 ; `PLAY-CONFORMITE.md` §1 bis)

> Nuit du passage à l'heure d'hiver : le run précédent (« 02:30 », 00:33 UTC) était en heure d'été ; celui-ci est
> à 02:33 heure d'hiver, d'où le nom de fichier `0233`.

## Constat au démarrage
- Main à `507c593` (#344, journal v262), aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- « Test — émulateur Samsung Galaxy A56 » **rouge sur main** (#344, journal seul) : job API 36,
  `HealthConnectTest.healthConnect_canWriteAndReadSleep` → `IllegalStateException: HealthConnectException: Conflict
  found, but couldn't read the entry` à l'insertion. Même instabilité connue depuis le 11/10 (BACKLOG), API 35 vert,
  « Build & Release » v262 vert : ce n'est pas l'app (elle ne fait que lire Health Connect).

## Ce qui a été fait
- **Test instrumenté robuste** : `insertTolerantOfConflict` réessaie l'insertion deux fois (500 ms, 1 s) sur ce seul
  message, puis laisse la relecture juger. Aucune autre erreur n'est avalée.
- `services/faceSense.js` : `describeFaceUnlock(status)` (null hors play ou sans `unlockAvailable` ; `off` / `on` /
  `paused` = préférence gardée mais service arrêté), `startFaceUnlock` (`start({ unlock: true })` puis
  `requestNotifications` du plugin EveningNote, seulement si le service a démarré ; ne lève jamais),
  `stopFaceUnlock` (`stopUnlock`).
- `config/permissionDisclosures.js` : divulgation `camera_unlock` (3 images à chaque déverrouillage, témoin vert,
  reconnaissance des émotions — AI Act art. 50 —, nombres seulement, notification « Lecture du visage active » avec
  « Arrêter », aucune reprise après redémarrage) ; bouton « J'accepte, lire au déverrouillage » (convention
  « J'accepte… » des divulgations ; libellé reporté dans le script vidéo P28).
- `FaceSenseCard` (play, état actif) : ligne « Aussi à chaque déverrouillage » + interrupteur (`role=switch`,
  ≥ 44 px) ; allumer → divulgation → démarrage app ouverte ; éteindre → `stopUnlock` seul ; « en pause » →
  « Reprendre » (geste, jamais automatique). Pas de Shizuku / ADB ni batterie en play (inchangé). Sideload inchangée.
- `npm run visual` : `--face-unlock=off|on|paused` (avec `--play --face`) et `--disclosure=camera_unlock`.
- Pas d'entrée « Nouveautés » : rien de visible dans les versions publiées (interrupteur de build coupé).

## Vérifications
- Vitest **2 178** verts (nouveaux : 4 tests de la carte, 4 du service, divulgation + garde « askConsent avant
  startFaceUnlock ») ; build OK ; lint inchangé (6 erreurs préexistantes).
- Captures relues : play clair off / on / paused, sombre on, feuille de divulgation ; `npm run visual` complet et
  sideload `--face` (voir « Après le merge » pour le résultat CI).
- Pas de SDK Android dans la session : le test Kotlin est compilé et exécuté par la CI de la PR.

## Suite
- **P28 (propriétaire)** : l'APK d'aperçu est prêt à filmer.
- POL-1c : raccourci « Lecture au déverrouillage » dans Paramètres pour couper ; puis, après P28, allumer
  `-PfaceUnlockPlay=true` dans « Play — AAB ». Ensuite M6b.

## Après le merge (#345, `e9d43cf`)
- Checks de la PR tous verts du premier coup, **y compris l'émulateur API 36** (test Health Connect robuste).
- Sur main : « Tests », « Build & Release » (**v263**, APK 33 749 908 octets, 33,7 Mo), « Play — AAB » (test interne)
  et « Test — émulateur Samsung Galaxy A56 » verts ; l'artefact `halcya-apercu-deverrouillage` de ce run contient
  l'écran d'activation (à installer pour P28).

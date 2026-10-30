# Run du 30/10/2026 16:33 (Paris, CET) — Health Connect : lecture sans perte (POL-PLAY-66)

**Type** : 🐛 Chiffres fiables (polissage de la version Play, même famille que POL-PLAY-59 et 63)

## Constat au démarrage
- Main à `9b84f1b` (#529) : Tests, Build & Release, Play — AAB et émulateur A56 verts.
- Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, non touchée).

## Fait
- Recherche des derniers endroits où un chiffre peut être faux sans que rien ne le montre, en partant du premier
  import (« aha » de l'onboarding).
- **Bug 1 (« aha »)** : `summarizeImport` additionnait les intervalles endormis de toutes les apps de Health Connect
  (`mainSleepPeriods` réunit les enregistrements proches mais garde leurs intervalles qui se chevauchent) : une nuit
  écrite par Samsung Health et Garmin donnait 14 h ; une session et sa phase, idem. → `oneSleepSourcePerNight` avant
  `mainSleepPeriods`, et `sleepRegularity.unionOf` réunit les intervalles endormis (sans effet sur le SRI, qui teste
  l'appartenance).
- **Bug 2 (perte de données)** : le plugin `@capgo/capacitor-health` trie les échantillons puis garde les `limit`
  premiers (`HealthManager.kt` : `ordered.take(limit)`). La FC (`limit: 2000`) et les pas en échantillons
  (`limit: 1000`) étaient lus en une fois sur toute la fenêtre : au premier import de 30 jours, avec une FC toutes
  les 5 min (8 640 échantillons), seuls les ~7 premiers jours arrivaient, puis `lastSyncAt = maintenant` : les jours
  récents n'étaient jamais relus. → `readSamplesInWindows` : une lecture par jour, fenêtre coupée en deux tant
  qu'elle atteint la limite (jusqu'à 15 min, avertissement sinon), doublons aux bords retirés, tri final.
  Historique > 30 jours : FC brute des 30 derniers jours seulement (avant : les 2 000 plus anciennes, inutiles ;
  FC au repos et VFC lues à part, complètes) pour ne pas écrire des centaines de milliers de lignes.

## Tests (écrits avant le code, rouges puis verts)
- `firstImport.test.js` : nuit écrite par deux apps → 7 h ; session + phase qui se chevauchent → 7 h.
- `HealthConnectConnector.test.js` : FC toutes les 5 min sur 30 jours → 8 640 échantillons, le dernier à 23:55 du
  dernier jour ; pas à la minute (1 440/jour > limite) → journée redécoupée, rien ne manque ; historique de 2 ans →
  FC des 30 derniers jours.

## Vérifications
- `npm run test` (2738 ✔), `npm run build`, `npm run lint` (6 erreurs, comme avant),
  `npm run visual -- --play --empty --routes=/,/sources` relu (aucun changement d'écran attendu, aucun constaté).

## Données
- Lecture seulement : aucune entrée existante modifiée ni effacée ; export / import intacts. Les utilisateurs déjà
  importés ne récupèrent pas d'eux-mêmes les jours manqués (la synchro repart de la dernière date) ; une resynchro
  de l'historique depuis Sources les rapatrie (upsert, sans doublon).

## Demandes iOS
- Note « Nouveautés » marquée `"variants": ["play", "sideload"]` (Health Connect, IOS-3).

## Suite
- POL-PLAY-67 (lectures `limit: 500` sur un historique long) à mesurer ; POL-PLAY-11 (alpha + `shrinkResources`)
  quand Android vitals aura une journée sans plantage.

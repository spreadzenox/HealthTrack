# 2026-10-14 18:30 Paris (16:30 UTC) — Montre : pilote « Huawei Link » dans le registre générique

**Type** : ⌚🏗️ D3 (priorité absolue)  ·  **PR** : « [Auto] Montre : pilote Huawei dans le registre générique des appareils »

## Pourquoi
- Démarrage : main à `da4bef7` (#158), **v127 publiée** (Build & Release vert). Aucune PR « [Auto] » rouge ou en
  conflit (seule PR ouverte : `cursor/*` #51, hors routine, non touchée). Aucune issue ni nouveau journal du
  propriétaire depuis v124 (`journal/diagnostics/` inchangé).
- D3 sans la montre : la priorité absolue demande un **pilote dans un registre générique** ; c'était resté une case
  ouverte du backlog. Symptôme visible : dans « Capteurs Bluetooth », la GT 6 Pro du propriétaire était encore
  annoncée « Via son app » (« une montre ne parle qu'à une app à la fois… Health Connect ») alors que HealthTrack
  s'y connecte lui-même depuis v124.

## Ce qui a été fait
- `devices/ble/drivers.js` : 3e sorte de pilote `kind: 'family'` (famille de protocole propriétaire parlée par
  HealthTrack). `huawei_link` : `mode: 'direct'`, `transports: ['rfcomm', 'ble']`, `measures`, `cardId` (carte de
  connexion dans Connecteurs), score 60 (un profil standard à 80 garde la main : une montre qui diffuse sa FC reste
  mesurable en VFC ; « via son app » à 50 passe derrière). `isHuaweiLinkDevice` (nom de montre, service FE86,
  identifiant 0x027D + « watch / band ») déplacé ici ; `diagnostic.js` le réutilise (`isHuaweiWearable`, même règle).
- `identifyDevice` renvoie aussi `direct` : la famille qui sait se connecter en direct même quand un profil standard
  l'emporte. `bleService.describe` le transmet.
- `BleDevices.jsx` : « Connexion directe » + « Se connecter en direct » (ouvre la carte `#watch-diag-title`, déplie
  « Brancher une autre source » au besoin, défile) ; les autres marques gardent « Via son app » + guide.
- **Bug d'outillage corrigé** : `npm run visual -- --ble` échouait depuis #156 (bouton de recherche sous
  `details.connectors-more` replié) → le script déplie ce bloc.

## Vérifications
- Tests : **1195 ✅** (92 fichiers ; +4 : famille Huawei par nom / FE86 / nom seul appairé, FC diffusée = cardio +
  direct, autre marque = via son app, déclaration des familles, bouton qui déplie et défile ; `scanDevices` transmet
  `direct`). Build ✅. Lint : **6 erreurs** (baseline inchangée).
- `npm run visual` (démo, toutes pages) : aucune erreur JS ; `--routes=/connectors --ble` : capture relue (GT 6 Pro
  « Connexion directe », message, « Se connecter en direct ») — c'est elle qui a révélé que `describe` perdait
  `direct` (corrigé + test) ; `--empty --routes=/connectors` OK.

## Apprentissages / décisions
- Une capture relue vaut un test : le composant était testé avec `identifyDevice` direct, pas avec le vrai service.
- Le registre décrit les capacités d'une famille (transports, mesures, carte) ; la logique Huawei reste dans
  `devices/huawei/`. Brancher la connexion sur `driver.transports` attendra une 2e famille (pas d'abstraction à vide).

## Suite proposée
1. ⌚ Lire le prochain journal du propriétaire (v125+) : vraies mesures ? → clore la priorité absolue, puis (d quater).
2. ⚡ D2 : `WellbeingCharts` par agrégats ; budget d'enregistrements lus par page en Vitest.
3. 🧹 D1 : contexte auto-détecté (I65), relire Paramètres et Analyses.

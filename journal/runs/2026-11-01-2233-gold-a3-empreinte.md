# Run du 01/11/2026 22:33 (Paris, CET) — Empreinte de l'installation (GOLD-a3) et tuiles Silver / Gold (POL-PLAY-93)

**Type** : 🛠️ code (app)

## Constat au démarrage
- Main à `da17d92` (#611). PR #612 (I6-RELAIS-7, run de 21:33) ouverte depuis 54 min, tous les checks verts depuis
  21:00 UTC mais pas mergée (session précédente arrivée au bout) : **mergée en squash** (`0a418ef`), garde-fous déjà
  remplis par ses checks (Vitest, Build APK, émulateur, relais).
- Demandes reprises : I6-RELAIS (01/11 17:10 ; étapes 1, 2, 3, 6 et 7 livrées, reste 5 « plus tard ») ; GOLD-a3
  (31/10 22:45) ; règle SLOP (31/10 21:35) pour les deux textes touchés.

## Fait
- **GOLD-a3 (côté app)** : `installFingerprint()` dans `services/aiRelay.js` = 12 premiers caractères hexadécimaux du
  SHA-256 de l'identifiant d'installation, exactement `hashInstallId` du relais (journaux `install`, `GOLD_INSTALLS`).
  Affichée seulement dans le mode diagnostic caché (Paramètres, 7 touches sur la version en play) : « Empreinte de
  l'installation : xxxxxxxxxxxx ». L'identifiant lui-même n'est jamais montré.
- **POL-PLAY-93** : tuiles Silver / Gold du paywall : seul le chiffre (10, 20) est en IBM Plex Mono, la phrase en
  Figtree ; tient sur une ligne à 412 px.

## Fichiers
- `app/src/services/aiRelay.js` (+ test), `app/src/pages/Settings.jsx` (+ `Settings.play.test.jsx`),
  `app/src/pages/Premium.jsx`, `app/src/pages/Premium.css`, changelog `2026-11-01-2233-tuiles-gold.json`.

## Vérifications
- `npm run test` : 2850 réussis (233 fichiers). Lint : 6 erreurs, comme avant. `npm run build` OK.
- `npm run visual -- --play --routes=/premium --light` et `--routes=/settings --dark` : captures relues (tuiles sur
  une ligne ; empreinte en mono sous le mode diagnostic), aucune erreur JS.

## Suite
- **Action du propriétaire (P37)** : ouvrir Paramètres, toucher 7 fois « Version », recopier l'empreinte affichée et
  la donner (dans une session ou un ticket) ; un run l'ajoutera à `GOLD_INSTALLS` dans le workflow du relais avant la
  fin de la période de lancement.
- Prochain run de code : GOLD-a2 (lecture des journaux du relais en production), puis polissage.

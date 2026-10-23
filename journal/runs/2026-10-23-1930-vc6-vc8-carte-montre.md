# 2026-10-23 19:30 Paris (17:30 UTC) — VC-6 + VC-8 : carte montre simple avant appairage

**Type** : 🧭 chantier produit (passe « version candidate », critères C1 et C2) ⌚

## Constat
- Main à `2fff8dc` (#300) ; Build & Release, Tests, Play — AAB, émulateur A56 : verts. Aucune PR « [Auto] » ouverte
  (seule #51 `cursor/*`, non touchée). Run de code (19:30).

## Ce qui a été fait
- `components/WatchConnect.jsx` (VC-8, retour du propriétaire P17) :
  - `details.watch-trouble` (« Diagnostic ») n'est plus jamais ouvert par défaut (avant : ouvert tant que jamais
    connectée ou après un échec).
  - Le titre et les conseils d'un échec de connexion sont affichés **hors** du repli ; les étapes (HiChain, AES-GCM,
    « Fin d'association — N acceptés ») restent dedans.
  - « Se connecter à la montre » → **« Connecter ma montre »** : télécharge les 3 constantes publiques au premier geste
    si absentes (`ensureSecrets`), message clair si hors ligne ; « Télécharger les paramètres » et « Ou les coller »
    déplacés sous « Diagnostic ». Intro sans « Gadgetbridge » : « Connectez une montre compatible Huawei… ».
- `components/WatchDiagnostic.jsx` (VC-6) : lien « Voir ce qui remonte de la montre » seulement si une montre a déjà
  été connectée (`everConnected` ou dernier rapport `connected`), y compris hors app Android ; texte hors Android
  reformulé.
- `pages/WatchData.jsx` (VC-6) : sans montre ni mesure, une phrase + « Connecter une montre » (→ `/connectors`) au lieu
  de 12 lignes « Rien reçu depuis 30 jours ».
- Libellés qui renvoyaient à l'ancien bouton (`WatchSetup.jsx`, `devices/huawei/diagnostic.js`, `pairing.js`) mis à jour.
- Changelog `2026-10-23-1930-carte-montre-simple.json`.

## Vérifications
- `npm run test` : **164 fichiers, 2 034 tests verts** (WatchConnect : premier geste qui télécharge puis connecte,
  hors ligne sans connexion, échec visible hors repli ; WatchDiagnostic : replié et sans lien jamais connectée,
  sans lien hors Android ; WatchData : état vide). `npm run build` OK. `npm run lint` : 6 erreurs, identiques à main.
- `npm run visual` : `--play --empty --routes=/connectors,/montre` (clair puis `--dark`), `--play --ble=watch --connect`
  et `--connect=done` : captures relues (le script de capture force l'ouverture de « Diagnostic » pour le montrer).

## Suite
- VC-7 (Withings Body Scan masqué en play, textes des cartes raccourcis), VC-5, VC-10, VC-9.

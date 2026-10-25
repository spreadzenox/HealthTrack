# 2026-10-25 01:30 Paris (23:32 UTC) — POL-8 : Sources plus simples

**Type** : 🧭 chantier produit (polissage du parcours, retours du propriétaire du 24/10 vers 15:00, point 8)

## Constat au démarrage
- Main à `0745352` (#340), aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- Captures avant (`--play --empty`) : « Mes appareils » (texte), puis tout « à brancher » : Lecture du visage, **Montre
  Huawei** (pour tout le monde), Health Connect, Météo, Temps d'écran, **Capteurs Bluetooth**, **6 guides par marque** ;
  « Détails » des cartes Visage / Météo / Écran sans chevron (texte orphelin, défaut noté en I164).

## Ce qui a été fait (présentation ; aucune donnée ni réglage touché)
- `connectorsLayout.js` : `watchDetected` — la montre n'est listée que si déjà appairée (`everConnected`) ou détectée ;
  nouveau `addable` = montre non détectée + `ble` + `guides`, qui ne sont plus dans « à brancher ».
- `Connectors.jsx` : une seule détection des apps du téléphone (`detectPhoneApps`, promesse partagée avec
  `MyDevices`) ; app compagnon `directWatch` (Huawei Santé, Honor Santé) → carte montre ; le mode diagnostic la montre
  toujours ; bouton secondaire pleine largeur **« Ajouter une source »** (`aria-expanded`) qui révèle `addable` ;
  « Brancher une autre source » n'est plus rendu vide.
- `MyDevices` : rend `null` si la détection marche et ne trouve rien (le texte « choisissez sa marque ci-dessous »
  renvoyait vers des guides désormais derrière le bouton).
- `WatchDiagnostic` / `WatchConnect` : prop `troubleshooting` (défaut `true`, la page Sources passe `debugMode`). Hors
  mode diagnostic : pas de test de connexion ni de journal à enregistrer ; le bloc « Diagnostic » n'apparaît qu'après
  une connexion échouée (là où « Libérer et appairer » / « Refaire l'appairage » servent). Le conseil d'échec reste
  visible comme avant.
- Pas de scan Bluetooth pour détecter une montre « à proximité » (I164 : autorisation de plus sans divulgation au bon
  moment).
- `MethodNote.css` : chevron discret (même geste que POL-3), marqueur natif masqué.
- Nouveauté `2026-10-25-0130-sources-plus-simples.json`.

## Vérifications
- Vitest : suite complète **2 165** verts (nouveaux : layout sans montre / avec app Huawei ; « Ajouter une source »
  révèle montre, Bluetooth et guides ; carte montre affichée si Huawei Health détecté ; `MyDevices` vide → rien ;
  `WatchConnect` sans Diagnostic hors échec ; `WatchDiagnostic` sans test ni journal).
- Build OK ; lint inchangé (6 erreurs préexistantes).
- Captures relues : `--play --empty` (avant / après, et `--click="Ajouter une source"`), `--play --dark --devices=com.huawei.health`
  (démo : Gadgetbridge « Reçu », Huawei Health « Relayé », Météo active, « Brancher une autre source », bouton) ;
  `npm run visual -- --play` complet.

## Suite
- POL-8 fait ; le polissage du 24/10 15:00 est terminé sauf **POL-1** (lecture au déverrouillage en play), qui attend la
  déclaration P28 du propriétaire avant toute version qui la contient (préparation possible derrière l'interrupteur
  de build éteint).

## Après le merge (#341, `146d7b1`)
- Checks de la PR tous verts du premier coup (Vitest, Build APK, Relais, montre Java, budget de lectures, émulateurs API 35
  et 36).
- « Build & Release » vert : **v261** publiée (APK 33 748 872 octets, 33,7 Mo) ; « Play — AAB » vert (envoi en test
  interne) ; « Test — émulateur Samsung Galaxy A56 » vert.

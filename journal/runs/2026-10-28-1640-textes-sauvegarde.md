# Run du 28/10/2026 16:40 (Paris, CET) — Textes « tout reste ici » honnêtes (POL-PLAY-25, 26)

**Type** : 🎨 UI / textes (variantes play et sideload, code commun avec l'app iPhone)

## Constat au démarrage
- Main à `f301614` (#475), v341 verte (Build & Release, Play — AAB, Tests, émulateur). Aucune PR « [Auto] » ouverte
  (PR #51 `cursor/*` hors routine, non touchée).

## Fait
- **POL-PLAY-25** (décision « sauvegarde Android conservée » du 24/10, point a ; demande iOS IOS-4 : « la sauvegarde
  du téléphone », jamais « la sauvegarde Google ») :
  - Sources : « Vos mesures sont rangées sur ce téléphone, jamais chez Halcya. » (avant « Tout reste sur cet appareil »).
  - Profil corporel (2 endroits) : « Rangé sur ce téléphone, jamais chez Halcya. »
  - Premium (hors période de lancement) : « Vos données sont rangées sur votre téléphone, jamais chez Halcya. »
  - Lecture du visage : « Aucune image gardée ni envoyée. » ; temps d'écran : « … et Halcya n'envoie rien. » ;
    sideload, clé Gemini : « aucune autre donnée de santé n'est envoyée ».
  - Divulgations (caméra ×3, Health Connect, accès d'utilisation) : « Envoyé par Halcya : rien … suivent la
    sauvegarde du téléphone, si elle est activée. » (avant « Rien ne quitte le téléphone »).
- **POL-PLAY-26** : encart ambre « Pression en forte baisse : souvent citée comme déclencheur de maux de tête… »
  retiré de la carte météo (norme générale en couleur d'alerte, règle 6) ; constante et style devenus inutiles retirés.
- La politique de confidentialité publiée parlait déjà de la sauvegarde (§ « Sauvegarde Android ») : inchangée.

## Tests
- `src/honestStorageTexts.test.js` (2, échouaient avant) : aucun fichier source visible ne contient plus « Tout reste
  sur cet appareil », « restent sur votre téléphone », « rien ne quitte le téléphone » ; les divulgations des accès qui
  gardent des mesures citent « la sauvegarde du téléphone ».
- Mis à jour : `permissionDisclosures.test.js`, `PhoneUsageCard.test.jsx`, `WeatherCard.test.jsx`.

## Vérifications
- `npm run test` : vert (2 622) ; lint 6 erreurs (inchangé) ; build OK.
- `npm run visual -- --play` : `/connectors`, `/premium`, `/food`, `/settings` (démo, clair), `/connectors` en
  `--dark`, `/connectors` et `/settings` en `--empty` : textes en place, plus d'encart ambre dans la météo.

## Suite
- POL-PLAY-27 (tuile Sommeil « cette nuit », tuile Météo du Journal sans pastel, « Modifier · Supprimer » des notes),
  POL-PLAY-28 (titre Health Connect sur 2 lignes, carte visage au déverrouillage quand `faceUnlockPlay`).

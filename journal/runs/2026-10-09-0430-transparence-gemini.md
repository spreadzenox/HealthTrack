# 2026-10-09 04:30 UTC — Transparence Gemini (photo sans métadonnées, modèle récent, avertissement clé gratuite)

**Type** : 🏗️ (vie privée)  ·  **PR** : #66 (fusionnée → release v67)

## Pourquoi
Item n° 1 des « Prochaines étapes » (R#9). Trois constats :
- la photo partait telle quelle chez Google, **EXIF compris (position GPS, date, modèle du
  téléphone)** et en pleine résolution (plusieurs Mo) — contraire au « strict nécessaire » ;
- avec une clé gratuite, les contenus envoyés peuvent servir à Google et être relus par des
  humains [RESEARCH 20], sans que l'app le dise ;
- l'app appelait `gemini-2.5-flash` en dur. D'après la page des modèles (consultée ce run),
  **2.5 n'est plus ouvert qu'aux comptes qui l'utilisaient déjà** : une nouvelle clé aurait
  échoué. 3.8 Flash / 3.5 Flash-Lite sont recommandés.

## Ce qui a été fait
- `services/imagePrep.js` : ré-encodage via canvas (`createImageBitmap` + `toDataURL` JPEG 0,85,
  orientation EXIF appliquée), plus grand côté ≤ 1 280 px → plus aucune métadonnée. Repli sans
  canvas : retrait des segments APP1–APP15 et COM du JPEG (`stripJpegMetadata`). Si aucun des
  deux n'est possible, **on refuse d'envoyer** plutôt que d'envoyer une image avec ses métadonnées.
- `settings/geminiModel.js` : modèle réglable (3.8 Flash par défaut, 3.5 Flash-Lite, 2.5 Flash),
  valeur inconnue ignorée. `geminiStandalone.js` : en cas d'erreur (modèle introuvable ou non
  ouvert à la clé, quota épuisé, surcharge), essai automatique des autres modèles, puis remontée du
  1er message ; une clé/requête invalide (400/401) est remontée sans réessai. `generationConfig.responseMimeType: application/json` ; les parties
  « pensée » des modèles 3.x sont ignorées à la lecture. Le repas enregistré garde
  `provider: 'gemini'` et ajoute `model`.
- UI : Paramètres → sélecteur « Modèle Gemini » + bloc « Ce qui est envoyé » / « Avec une clé
  gratuite… » (lien vers les conditions Gemini). Alimentation → une ligne 🔒 sous « Analyser ».
- Lint : 14 → **9 erreurs** (catch inutilisés de `geminiStandalone.js` et `geminiApiKey.js`).

## Vérifications
- Tests : 423 ✅ (403 + 20) · Lint : 9 erreurs, 1 warning (avant : 14) · Build ✅
- **Chromium réel** (script ad hoc) : JPEG 4000×3000 avec EXIF GPS + « Galaxy A56 » → sortie
  1280×960, plus de segment Exif ni de nom d'appareil (189 ko → 8 ko).
- Visuel : `npm run visual` sans erreur ; relu Paramètres (sélecteur et avertissement lisibles, pas
  de débordement) et Alimentation avec photo choisie (ligne 🔒 sous les boutons).
- Non vérifiable ici : un vrai appel Gemini (pas de clé dans la session). Risque couvert par le
  repli automatique sur les autres modèles et par le choix manuel du modèle dans Paramètres.

## Apprentissages / décisions
- Pas de détection possible « clé gratuite vs payante » depuis le client : l'avertissement est
  donc conditionnel (« si votre clé est gratuite »).
- Repli de modèle sur toute erreur sauf 400/401 : le code renvoyé par Google pour « 2.5 non ouvert
  à cette clé » ou « pas de quota gratuit sur 3.8 » n'est pas documenté → on ne parie pas dessus.
  Le propriétaire, qui utilisait 2.5, retombe donc sur 2.5 si 3.8 lui est refusé.

## Suite proposée
- 🐛 Run bugs & visuel (le dernier date d'hier 20:30 ; 4 runs de fond depuis).
- 🏗️ Radar (R#12) ; puis Analyse photo fiabilisée (R#4 : sortie JSON à schéma, grammes
  modifiables avant sauvegarde) — `responseMimeType` est déjà en place.
- Si le propriétaire signale un échec d'analyse avec 3.8 Flash : vérifier le message (quota du palier
  gratuit ?) et éventuellement passer 3.5 Flash-Lite par défaut.

# 2026-10-20 02:30 Paris (00:30 UTC) — Modèle valence / éveil embarqué (consigne du 19/10 au soir, étape 2)

**Type** : 🔴🙂 bien-être automatique (charte §0000000)  ·  **PR** : #226

## Pourquoi
- Vérifications de début de run : main à `d03c880` (#225), « Build & Release » vert (v179), aucune PR « [Auto] »
  ouverte ; signalement du 19/10 15:05 corrigé et fusionné (#221) ; pas de diagnostic de l'A56 dans `journal/`.
- Étape 1 de la consigne du soir livrée (#224), dérives lentes corrigées (#225). Le propriétaire a demandé « un modèle
  plus puissant » qui sort directement valence et éveil : c'est l'étape 2. Le comparatif était prévu au run idées de
  08:30 ; la question bloquante (licence des poids) se tranchait en quelques requêtes, je l'ai faite ici pour livrer.

## Ce qui a été fait
- **Choix du modèle** (journal/BIEN-ETRE-AUTO.md §« Modèle valence / éveil », tableau des alternatives) : HSEmotion
  `enet_b0_8_va_mtl` (16 Mo ONNX ; AffectNet CCC valence 0,594 / éveil 0,549, 8 classes 61,9 % ; 60 ms / image sur
  SD888). Poids dans un dépôt Apache-2.0 sans limite d'usage annoncée mais appris sur AffectNet → **jamais
  redistribués par nous** : le téléphone les télécharge une fois depuis le dépôt des auteurs, SHA-256 vérifié.
- **Natif** : `face/FaceAffect.java` (pur Java : recadrage aligné sur les yeux 1,1 × boîte des points, 224², ImageNet,
  C × H × W ; décodage borné) ; `FacePipeline` accepte un 4e modèle facultatif → `values.valence / arousal /
  affectFrames` (médianes des images valides), un échec du modèle ne perd jamais la lecture (`lastAffectError`) ;
  `OnnxModel.java` (ONNX Runtime 1.22.0, CPU 2 fils) ; `FaceAffectModel.java` (téléchargement GET sur un fil, 2 sources,
  taille plafonnée, SHA-256, `getNoBackupFilesDir`) ; `FaceSenseService` reconstruit le pipeline quand le modèle
  arrive, compte `affectBursts`, `affectLoadMs` ; `FaceSensePlugin.prepareAffect` + `affectModel` / `affectDownloading`
  dans `status`.
- **ONNX Runtime 1.22.0 et pas plus récent** : l'AAR ≥ 1.27 déclare un `TelemetryInitializer` (client HTTP 1DS de
  Microsoft, infos de l'appareil, vu par `javap`) ; la 1.22 n'en a pas et ne demande aucune permission. Commentaire
  dans `build.gradle`.
- **JS** : `faceSense.js` `prepareFaceAffect`, `faceAffectState`, diagnostic v3 `affect { state, bursts, loadMs,
  downloadMs, error, lastError }` + lignes ; la carte « Lecture du visage » demande le téléchargement une fois par
  ouverture quand la lecture est active ; `mood/faceMood.js` : valence du modèle prioritaire sur l'a priori (moitié de
  la valence habituelle retirée), erreur type 1,1 → 0,9, `model: 'va'`, éveil du moment et du jour (« plutôt calme /
  modéré / plutôt animé »), phrases de la carte.
- Données de démonstration (`demoData.mjs`) : valence / éveil sur les 3 derniers jours ; `--face=nomodel`.
- `journal/protocoles/visage.md` §9, `visage-va-vecteurs.py`, `affect-vectors.json`, Nouveauté
  `2026-10-20-0230-modele-valence-eveil.json`.

## Tests
- JVM (`npm run test:java`) : **111 verts** (+6) — `FaceAffectTest` (ROI et 64 échantillons du tenseur à 1e-4 des
  vecteurs Python sur les 2 portraits NASA, décodage borné / sortie invalide), `FacePipelineTest` (+3 : valence et éveil
  dans la rafale, modèle en échec sans perte de lecture, rien sans modèle).
- Vitest : **1 584 verts** (+11) — `faceMood` (+5 : préférence pour le modèle et fourchette plus étroite, éveil,
  ajustement à moitié, historique mêlé, phrases), `faceSense` (+3), `FaceSenseCard` (+2), `faceBursts` (+1).
- Vérification locale hors CI : `OnnxModel` compilé contre l'API d'ONNX Runtime Android 1.22 (`javac`). Exécution JVM
  bout en bout non faite (Maven Central m'a répondu 429 pour le jar JVM) ; le modèle lui-même tourne en Python sur les
  mêmes entrées (vecteurs).
- `npm run lint` : 6 erreurs, identiques à main. `npm run build` ✅. `npm run visual` (toutes pages, `--empty`,
  `--light`) ✅ sans erreur JS ; captures lues : accueil (carte « Humeur estimée » : éveil + « Modèle valence / éveil
  embarqué (HSEmotion) »), Connecteurs `--face` (carte + diagnostic « Modèle valence / éveil : prêt … 6 lectures avec
  valence · chargé en 280 ms »), `--face=nomodel` (« pas encore téléchargé »).

## Risques connus
- Pas d'Android SDK ici : `FaceAffectModel` / `FaceSenseService` ne sont compilés que par le check « Build APK ».
- APK ≈ +18 Mo (bibliothèque ONNX Runtime arm64).
- Latence et consommation réelles sur l'Exynos 1580 de l'A56 inconnues : le diagnostic les donnera.

## Pour le propriétaire (Galaxy A56)
Après la mise à jour : ouvrez Plus → Connecteurs → Lecture du visage (lecture active, en Wi-Fi de préférence : 16 Mo,
une fois). Attendez une minute, rouvrez la carte : le Diagnostic doit dire « Modèle valence / éveil : prêt ». Puis
déverrouillez 2–3 fois et « Enregistrer le diagnostic » : les lignes « Modèle valence / éveil », « Temps moyen » et
« Dernières tentatives » m'indiqueront si tout tourne et combien ça coûte.

## Suite proposée
1. 📥 Diagnostic de l'A56 (déverrouillages + modèle).
2. 💡 Run idées 08:30 : revérifier EmoNet (licence, chiffres) et chercher un modèle valence / éveil sous licence de
   poids explicite ; modèles vocaux embarquables (étape 3).
3. 🙂 Run de code suivant : la porte `gate.js` lit aussi la valence du modèle ; I123 « Applis jamais en veille ».

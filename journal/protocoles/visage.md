# Lecture du visage sur l'appareil — spécification HealthTrack (D4, I88 / I90 / I94)

> Rédigée avec nos mots à partir de sources publiques (run « idées » du 17/10/2026 08:30), pour écrire le pipeline
> visage de HealthTrack **sur LiteRT seul**, sans MediaPipe Tasks ni ML Kit (télémétrie sans option, voir
> `IDEES.md` I94). Le code natif (`FaceEstimator.java`, à venir) est écrit **à partir de ce document**.
> Niveaux de confiance : ✅ **vérifié dans la session** (prototype `visage-reference.py` comparé à MediaPipe Tasks
> 1.1.1 sur une image), 📖 lu dans une source, ❓ supposé, à mesurer sur l'A56 du propriétaire.
> Règles D4 : traitement entièrement sur le téléphone ; **aucune image gardée** après l'inférence ; seuls des scores
> sont stockés ; présenté comme une estimation de tendance, jamais comme une émotion « à l'instant » ni un diagnostic.

## Sources

| Réf. | Source | Licence | Usage |
|---|---|---|---|
| [MP] | `github.com/google-ai-edge/mediapipe`, branche `master` lue le 17/10/2026 : `tasks/cc/vision/face_detector/face_detector_graph.cc`, `face_landmarker/face_landmarks_detector_graph.cc`, `face_landmarker/face_blendshapes_graph.cc`, `calculators/tflite/ssd_anchors_calculator.cc`, `calculators/tensor/landmarks_to_tensor_calculator.cc` | Apache-2.0 (compatible, lue pour les paramètres) | ancres, décodage, recadrage, indices |
| [MOD] | `face_landmarker.task` (float16, `storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/`), SHA-256 `64184e22…bc9ff` ; fiche du modèle | Apache-2.0 | les 3 `.tflite` |
| [T26] | Turrisi et al., « Blendshape features meet action units: a clinical mapping… », *Computers in Human Behavior Reports*, 2026, doi 10.1016/j.chbr.2026.101125 (pré-épreuve) | — | correspondance blendshapes → unités d'action (FACS) |

## 1. Les trois modèles (✅ formes lues avec LiteRT)

| Fichier dans le `.task` | Taille | Entrée | Sorties |
|---|---|---|---|
| `face_detector.tflite` (détecteur « courte portée ») | 230 Ko | image 1 × 128 × 128 × 3, float32, valeurs **dans [−1, 1]** | `regressors` 1 × 896 × 16 ; `classificators` 1 × 896 × 1 (logits) |
| `face_landmarks_detector.tflite` (maillage) | 2,55 Mo | image 1 × 256 × 256 × 3, float32, valeurs **dans [0, 1]** | `Identity` 1434 = 478 points × (x, y, z) en pixels du recadrage 256 ; `Identity_1` : logit de présence du visage ; `Identity_2` : non utilisé |
| `face_blendshapes.tflite` | 955 Ko | 1 × 146 × 2 : (x, y) de 146 points choisis | 52 coefficients dans [0, 1] |

SHA-256 des `.tflite` (version du 03/05/2023, inchangée dans le `.task` du 17/10/2026) : détecteur `b4578f35…152f`,
maillage `c7d54204…43d5`, blendshapes `4f36dded…2082`. Les modèles sont **téléchargés au build** (tâche Gradle qui
vérifie le SHA-256), jamais committés.

## 2. Détecteur

1. **Mise au format** (✅) : l'image (déjà tournée à l'endroit selon l'orientation du capteur) est placée dans un carré de
   côté `max(L, H)`, **centrée, bandes noires** (on garde les proportions), réduite en 128 × 128 par interpolation
   bilinéaire, puis `v = pixel / 255 × 2 − 1`.
2. **Ancres** (📖 [MP], ✅ 896) : grille SSD à 4 couches de pas 8, 16, 16, 16, toutes de taille fixe 1 × 1. Les couches de
   même pas sont fusionnées : 16 × 16 cellules × **2** ancres (pas 8), puis 8 × 8 cellules × **6** ancres (pas 16) =
   512 + 384 = 896. Centre d'une ancre : `((x + 0,5) / largeur_grille, (y + 0,5) / hauteur_grille)` ; à l'intérieur
   d'une cellule, les ancres sont identiques. Ordre : ligne par ligne, puis colonne, puis ancre.
3. **Décodage** d'une ancre `a` (📖 [MP], ✅) — 16 valeurs `r` divisées par 128 :
   - centre `cx = r0 + a.x`, `cy = r1 + a.y` ; taille `w = r2`, `h = r3` (fractions du carré) ;
   - 6 points-clés `k_i = (r[4 + 2i] + a.x, r[5 + 2i] + a.y)` ; **k0 et k1 = les deux yeux**, k0 étant l'œil à gauche
     de l'image ; puis nez, bouche, oreilles ;
   - score = sigmoïde(logit borné à ± 100) ; on garde ≥ 0,5.
4. **Fusion** (📖 « weighted NMS », IoU 0,3) : autour de la meilleure boîte, moyenne des boîtes et points-clés qui la
   recouvrent (IoU > 0,3), pondérée par leur score. HealthTrack ne suit **qu'un visage** : le plus grand.
5. Retour aux pixels de l'image : `x_px = x × côté − (côté − L) / 2`, idem en y.

## 3. Recadrage (« ROI ») et maillage

1. **Rectangle du visage** (📖 [MP], ✅) : centre de la boîte ; **rotation** = `−atan2(−(y1 − y0), x1 − x0)` avec
   (x0, y0) = k0 et (x1, y1) = k1 en pixels (angle cible 0), ramenée dans [−π, π] ; côté = **max(w, h) × 1,5** (carré,
   agrandi de 50 %).
2. **Recadrage** (✅) : transformation affine du carré tourné vers 256 × 256, bilinéaire, extérieur noir, `v = pixel /
   255`. Point du recadrage `(u, v)` ↔ image : `centre + R(rotation) · ((u/256 − 0,5) × côté, (v/256 − 0,5) × côté)`.
   **Convention des pixels (✅ tranchée le 18/10/2026 14:30, `visage-vecteurs.py`)** : le pixel de sortie `(i, j)` lit
   l'image au point `centre + R · (((i + 0,5)/size − 0,5) × côté, ((j + 0,5)/size − 0,5) × côté) − (0,5 ; 0,5)`
   (centres des pixels des deux côtés, comme OpenCV), en bilinéaire sur les indices entiers. Mesuré contre MediaPipe
   Tasks sur deux images : points médiane **0,38–0,43 px** (contre 0,64 px sans les demi-pixels, et 0,78 px pour la
   convention de Pillow du prototype du 17/10). L'« écueil » noté le 17/10 venait de la convention de Pillow.
   Même convention pour l'entrée du détecteur (carré `max(L, H)` centré, rotation 0).
3. **Maillage** : 478 points (468 du visage + 10 des iris, indices 468–477), z relatif (même échelle que x) ;
   présence = sigmoïde(`Identity_1`) ; **rejet si < 0,5** (MediaPipe) — HealthTrack exigera ≥ 0,9 (qualité, §6).
4. **Image suivante d'une même rafale** (📖, ✅ même résultat) : le rectangle se recalcule sur les points de l'image
   précédente (boîte englobante, rotation par les coins des yeux **33 → 263**, côté max × 1,5) ; le détecteur ne
   tourne qu'à la première image ou quand la présence chute. Le lissage « One Euro » de MediaPipe (vidéo) est inutile
   pour 3 images espacées.

## 4. Blendshapes

1. **146 points** (📖 [MP] `kLandmarksSubsetIdxs`, recopiés tels quels — liste factuelle sous Apache-2.0) :
   `0 1 4 5 6 7 8 10 13 14 17 21 33 37 39 40 46 52 53 54 55 58 61 63 65 66 67 70 78 80 81 82 84 87 88 91 93 95 103 105
   107 109 127 132 133 136 144 145 146 148 149 150 152 153 154 155 157 158 159 160 161 162 163 168 172 173 176 178 181
   185 191 195 197 234 246 249 251 263 267 269 270 276 282 283 284 285 288 291 293 295 296 297 300 308 310 311 312 314
   317 318 321 323 324 332 334 336 338 356 361 362 365 373 374 375 377 378 379 380 381 382 384 385 386 387 388 389 390
   397 398 400 402 405 409 415 454 466 468 469 470 471 472 473 474 475 476 477` (dont les 10 points d'iris).
2. **Coordonnées en pixels de l'image** (✅, point clé) : (x, y) des points en pixels. Le modèle est **invariant à
   l'échelle et à la translation** (✅ : points × 0,37 et décalés → écart 5·10⁻⁵), mais **pas à une échelle différente
   en x et en y** : lui donner les coordonnées normalisées [0, 1] d'une image non carrée fausse tout (écart jusqu'à
   0,37). Donc : pixels, ou n'importe quelle échelle **identique** sur les deux axes.
3. **52 sorties**, dans l'ordre : `_neutral`, browDownLeft, browDownRight, browInnerUp, browOuterUpLeft,
   browOuterUpRight, cheekPuff, cheekSquintLeft, cheekSquintRight, eyeBlinkLeft, eyeBlinkRight, eyeLookDownLeft,
   eyeLookDownRight, eyeLookInLeft, eyeLookInRight, eyeLookOutLeft, eyeLookOutRight, eyeLookUpLeft, eyeLookUpRight,
   eyeSquintLeft, eyeSquintRight, eyeWideLeft, eyeWideRight, jawForward, jawLeft, jawOpen, jawRight, mouthClose,
   mouthDimpleLeft, mouthDimpleRight, mouthFrownLeft, mouthFrownRight, mouthFunnel, mouthLeft, mouthLowerDownLeft,
   mouthLowerDownRight, mouthPressLeft, mouthPressRight, mouthPucker, mouthRight, mouthRollLower, mouthRollUpper,
   mouthShrugLower, mouthShrugUpper, mouthSmileLeft (44), mouthSmileRight (45), mouthStretchLeft, mouthStretchRight,
   mouthUpperUpLeft, mouthUpperUpRight, noseSneerLeft, noseSneerRight. « Left / Right » = côté **de la personne**.

## 5. Ce que HealthTrack garde d'une image, puis d'une rafale (I90 précisé)

Par image, une dizaine d'**indices** lisibles, groupés par unités d'action (FACS) d'après la correspondance d'experts
[T26] (accord κ = 0,92 après discussion ; **pas encore validée** sur une tâche de reconnaissance d'émotion) :

| Indice | Calcul (moyenne gauche / droite) | Unité d'action | Remarque |
|---|---|---|---|
| `smile` | mouthSmile | AU12 (coin des lèvres tiré) | |
| `duchenne` | min(mouthSmile, cheekSquint) | AU6 + AU12 | sourire « des yeux », [T26] : signature de la joie |
| `browDown` | browDown | AU4 (froncement) | colère / concentration / tristesse : **pas** un signe négatif en soi |
| `browInnerUp` | browInnerUp | AU1 | tristesse / inquiétude avec AU4 |
| `mouthFrown` | mouthFrown | AU15 | |
| `eyeOpen` | 1 − eyeBlink | — | fatigue possible ; dépend de l'éclairage |
| `jawOpen` | jawOpen | AU26 | surtout parole / bâillement : sert à **exclure** des images |
| `asymmetry` | \|smileL − smileR\| | — | qualité / tête tournée |
| `yaw`, `pitch` | ❓ par Procrustes des points sur le maillage canonique (`geometry_pipeline_metadata_landmarks.binarypb`), ou approximation nez / joues | — | qualité + posture |
| `mobility` | écart moyen des 52 coefficients entre images de la rafale | — | expressivité |

Par **rafale** (3 images à ~0,5 s) : médiane de chaque indice sur les images valides + nombre d'images valides. Entrée
stockée `{ at, subtype: 'face_burst', values: { smile, duchenne, browDown, … , n, quality } }` — **aucune image**.
Aucun indice n'est codé « bon » ou « mauvais » (D6) : seul l'**écart à la plage personnelle** (z-score sur 28 jours) et
la calibration sur les notes de l'utilisateur (≥ 14 jours) donnent un sens, propre à chacun.

## 6. Qualité d'une image (à appliquer avant tout calcul)

- présence ≥ 0,9 ; visage ≥ **80 px** de côté dans l'image analysée (mesuré sur la boîte englobante des 468 points du
  visage : ≈ 100 px pour une tête qui occupe un tiers de la largeur d'une capture 320 × 240) ; |lacet| ≤ 30° ; luminance moyenne du recadrage
  dans [0,15 ; 0,9] ; `jawOpen` ≤ 0,5 (sinon parole / bâillement) ; sinon l'image est comptée « rejetée » avec sa raison
  (diagnostic).
- **Résolution de capture** (✅ mesuré sur l'image test réduite) : à 320 px de large (visage ≈ 90 px), écart moyen des
  52 coefficients vs pleine résolution 0,019 (max 0,09), sourire 0,95 au lieu de 0,96 ; à 160 px (visage 45 px),
  max 0,21. Au bras tendu, le visage remplit ≈ 40–60 % de la largeur (❓) → **capture YUV 320 × 240** suffit, 480 × 360
  si le visage est petit. Plus bas que 240 px : à éviter.

## 7. Vérification d'équivalence (✅ fait une fois dans la session, à refaire en CI)

Prototype `visage-reference.py` (LiteRT + numpy + Pillow, ce document seulement) contre MediaPipe Tasks 1.1.1
(`FaceLandmarker`, mode image) sur l'image de test `portrait.jpg` du bucket `mediapipe-assets` (820 × 1024) :

| Étape | Écart |
|---|---|
| Détection | score 0,94, 6 boîtes fusionnées |
| 478 points (1re passe, depuis le détecteur) | médiane **0,78 px**, max 1,7 px (distance entre les yeux : 117 px) |
| 478 points (2e passe, ROI depuis les points) | identique (≈ 1 px) |
| Blendshapes depuis **les points de MediaPipe** | max **5·10⁻⁵** (le modèle de blendshapes est reproduit exactement) |
| Blendshapes depuis **nos** points | moyen **0,009**, max 0,054 (eyeSquintRight) ; sourire 0,94 vs 0,96 |
| Temps (Python, 1 cœur x86, détecteur + maillage + blendshapes) | ≈ 28 ms par image, dont ≈ 10 ms d'inférence |

Ordre de grandeur : MediaPipe lui-même s'écarte en moyenne de **0,2** des vraies déformations (fiche du modèle, citée
par [T26]) ; notre écart de 0,01 est donc négligeable. Résidu probable : rééchantillonnage (Pillow vs OpenCV) et fusion
des boîtes. **Test à écrire** (I101) : valeurs de MediaPipe sur 2–3 images figées en JSON, test instrumenté sur
l'émulateur x86_64 de la CI (workflow « Test — émulateur Samsung Galaxy A56 ») : points médiane < 1,5 px, blendshapes
moyen < 0,02 et max < 0,08. ❓ Licence de `portrait.jpg` à vérifier avant de le committer ; sinon images CC0.

### 7.1 Post-traitement Java (✅ 18/10/2026 14:30, I100 ① a)

Paquet `com.healthtrack.app.face` (sans dépendance Android, testé sur la JVM par `npm run test:java`) :
`FaceGeometry` (ancres, décodage, fusion pondérée, ROI, recadrage, retour dans l'image, 146 points, taille, lacet),
`FaceIndices` (§5–§6) et `FacePipeline` (§8, modèles derrière une interface `Model`). Vecteurs :
`app/android/app/src/test/resources/face/` — deux recadrages du portrait NASA de Neil Armstrong (domaine public,
I106), sorties brutes des 3 modèles écrites par `visage-vecteurs.py`. Le Java reproduit le prototype à 10⁻⁵ près
sur les tenseurs d'entrée et à 2·10⁻³ px sur les points. Ordre des sorties attendu de LiteRT : détecteur
`[regressors, classificators]`, maillage `[Identity (points), Identity_1 (présence)]` — à vérifier par nom au
branchement. **Lacet** (❓ remplace le Procrustes) : angle de la droite joue 234 → joue 454 dans le plan (x, z) après
retrait de la rotation des yeux ; < 20° sur les deux images de face.

## 8. Ordre d'exécution dans le service (rappel I88)

Déverrouillage ou toutes les ~3 min écran allumé → caméra frontale ouverte en **320 × 240 YUV**, 3 images, caméra
fermée → pour chaque image : rotation capteur → détecteur (1re image) → ROI → maillage → qualité → 146 points → 52
coefficients → indices → image effacée de la mémoire. Interprètes LiteRT gardés en mémoire tant que le service vit,
1 thread, XNNPACK. Le diagnostic exporte : temps par étape, images rejetées et raison, taille du visage, mais **jamais
une image ni des points**.

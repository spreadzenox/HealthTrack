# 2026-10-18 14:30 Paris (12:30 UTC) — Visage : post-traitement Java testé (I100 ① a)

**Type** : 🙂 D4 (consigne du propriétaire du 18/10, point B)  ·  **PR** : #208 « [Auto] Visage : post-traitement Java
du Face Landmarker, testé sur vecteurs (I100 ① a) »

## Pourquoi
- Démarrage : main à `b406728` (#207, correctif montre du 18/10 fusionné au run de 12:30). Aucune PR « [Auto] »
  ouverte. Point A de la consigne du 18/10 livré → **point B : estimation automatique du bien-être**, en commençant
  par le premier morceau de code prévu (I100 ①, spec `protocoles/visage.md` écrite le 17/10).
- I100 ① tel que prévu (moteur + modèles au build + `abiFilters` + test d'équivalence) est trop gros pour une PR
  sûre : coupé en **① a** (tout le calcul autour des modèles, testable sur la JVM sans SDK Android, ce run) et
  **① b** (LiteRT + modèles téléchargés au build + test instrumenté, run suivant).

## Ce qui a été fait
- **Paquet `com.healthtrack.app.face`** (aucune dépendance Android, écrit depuis la spec) :
  - `FaceGeometry` : 896 ancres, décodage, fusion pondérée (IoU 0,3) et choix du plus grand visage, ROI (angle des
    yeux, côté × 1,5), recadrage bilinéaire en `int[]` RVB (aucune copie d'image gardée), retour des 478 points dans
    l'image, 146 points des blendshapes, ROI de l'image suivante, taille du visage, **lacet approché** (joues 234 →
    454 dans le plan x, z après retrait du roulis).
  - `FaceIndices` : 9 indices par image (sourire, sourire des yeux, sourcils froncés / relevés, coins de bouche,
    ouverture des yeux, mâchoire, asymétrie, lacet), contrôle qualité (présence, taille, lacet, sombre, trop clair,
    bouche ouverte), rafale = médianes + mobilité. **Aucun indice n'a de sens « bon / mauvais »** (D6, testé).
  - `FacePipeline` : modèles derrière une interface `Model` ; détecteur seulement à la 1re image d'une rafale ou après
    une présence < 0,9 ; rejets comptés par raison.
- **Vecteurs** (`app/android/app/src/test/resources/face/`) : deux recadrages du portrait NASA de Neil Armstrong
  (domaine public, choix I106 ; README de licence), l'un de face (320 × 400), l'autre penché de 18° en 320 × 240
  (visage ≈ 100 px, comme une vraie capture). Sorties brutes des 3 modèles + attendus écrits par
  `journal/protocoles/visage-vecteurs.py` (LiteRT Python ; les `.tflite` ne sont pas committés).
- **Convention des demi-pixels tranchée** en se comparant à MediaPipe Tasks 1.1.1 : centres de pixels des deux côtés
  (comme OpenCV) → points à **0,38–0,43 px** médian de MediaPipe (0,64 px sans les demi-pixels ; 0,78 px pour la
  convention Pillow du prototype du 17/10). Blendshapes : écart moyen 0,007–0,009, max 0,065. Spec §3.2, §6, §7.1.
- `scripts/java-protocol-test.sh` : boucle sur les paquets `huawei` et `face` (même garde « pas d'import android. »).

## Vérifications
- `npm run test:java` : **63 tests JUnit verts** (44 montre + 19 visage). Mutations : demi-pixel retiré → 2 échecs ;
  seuil de fusion 0,3 → 0,6 → 1 échec (test de fusion ajouté pour ça).
- Frontend (aucun fichier JS modifié) : `npm run test` **1 400 verts**, lint **6 erreurs** (inchangé), build ✅,
  `npm run visual` ✅ (8 pages, captures relues : inchangées). Pas d'entrée « Nouveautés » : rien de visible.

- CI, 1er passage : « Protocole montre (Java) » rouge (13 échecs `input == null`) : les deux PNG de test étaient
  exclus par `*.png` du `.gitignore`. Exception ajoutée pour `src/test/resources/face/*.png`, vérifié sur un clone
  propre (63 verts). Leçon : lancer `test:java` sur un clone frais avant de pousser quand on ajoute des ressources.

## D5 / D6
- Rien n'entre encore dans l'estimateur : ces indices seront des **candidats** (I110) tant qu'ils n'ont pas prouvé
  chez l'utilisateur qu'ils suivent ses notes. Ce sont des signaux directs (Y), jamais des facteurs (X).

## Suite
1. 🙂 **I100 ① b** : dépendance LiteRT, tâche Gradle (téléchargement du `.task`, 3 SHA-256, assets), `abiFilters`
   arm64 / x86_64, `FaceModels.java` qui implémente `FacePipeline.Model` (vérifier l'ordre des sorties par nom), test
   instrumenté sur l'émulateur avec ces mêmes vecteurs ; mesurer la taille de l'APK.
2. 🙂 I88 (service + rafales + diagnostic), I90 (entrées `face_burst`), I110 (porte d'entrée).
3. 🔴 Lire le journal montre du propriétaire s'il en envoie un.

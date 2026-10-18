# Vecteurs du pipeline visage (tests JVM, `com.healthtrack.app.face`)

- `face-frontal.png` (320 × 400) et `face-tilted.png` (320 × 240, image penchée de 18° de plus) : recadrages du
  portrait officiel de Neil Armstrong par la NASA (1969), **domaine public** (œuvre du gouvernement fédéral américain,
  PD-USGov-NASA) — Wikimedia Commons, `File:Neil_Armstrong_pose.jpg`. Choix I106 : pas de visage sous licence
  restrictive ni de jeu de données interdit pour la reconnaissance faciale.
- `face-*.json` : écrits par `journal/protocoles/visage-vecteurs.py` (LiteRT Python + numpy) : sorties brutes des
  3 modèles du Face Landmarker (Apache-2.0) sur ces images et résultats attendus du post-traitement. Les `.tflite`
  eux-mêmes ne sont jamais committés.
- Écart du prototype à MediaPipe Tasks 1.1.1 sur ces images : points médiane 0,43 / 0,38 px, blendshapes moyen
  0,009 / 0,007 (max 0,065).

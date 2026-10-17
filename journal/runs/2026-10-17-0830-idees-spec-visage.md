# 2026-10-17 08:30 Paris (06:30 UTC) — Run « idées » : la spec du visage, vérifiée par un prototype

**Type** : 💡 idées (D4)  ·  **PR** : « [Auto] Idées : spec du visage vérifiée (LiteRT seul) »

## Pourquoi
- 08:30 Paris = run « idées » : pas de code produit.
- Démarrage : main à `7cdd412` (v151, #192 fusionnée), « Tests », « Build & Release » et émulateur A56 verts. Aucune PR
  « [Auto] » ouverte (`cursor/*` #51 non touchée). Aucun nouveau journal dans `journal/diagnostics/`.
- Le run du 16/10 20:30 a laissé le dernier verrou avant le code D4 (I94) : ancres du détecteur, 146 points des
  blendshapes, et le test d'équivalence promis. Plutôt que de lire seulement, ce run l'a **reproduit**.

## Ce qui a été fait
- Dans la session (scratchpad, rien de binaire dans le dépôt) : `face_landmarker.task` téléchargé (SHA-256 noté), les
  3 `.tflite` inspectés avec LiteRT ; graphes MediaPipe (Apache-2.0) lus pour les paramètres ; **pipeline réécrit en
  Python (LiteRT + numpy + Pillow)** et comparé à MediaPipe Tasks 1.1.1 sur `portrait.jpg` (il a fallu installer
  `libegl1` pour MediaPipe) ; essais de résolution (480 → 160 px).
- `journal/protocoles/visage.md` (nouveau) : spec avec nos mots — modèles, ancres, décodage, recadrage, maillage,
  146 points, 52 sorties, indices à garder (unités d'action), qualité, résultats de la vérification, ordre dans le
  service. `journal/protocoles/visage-reference.py` : le prototype (outil de recherche hors app).
- Courte veille : Turrisi et al. 2026 (blendshapes ↔ unités d'action), BlendFER-Lite 2026, MoodCapture, agrégateurs
  d'avis (plaintes : mesures fausses, synchro).
- `IDEES.md` : nouvelle section, **4 idées I98–I101**. `BACKLOG.md` : D4 (I94 prêt à coder, I98, I99, I101), prochaines
  étapes n° 3 et n° 14, « Livré ». `README.md` : paragraphe du résumé, « Meilleures idées », tableau (+ #190 → v149,
  #192 → v151).
- Pas d'entrée « Nouveautés » : rien de visible dans l'app.

## Idées retenues (détail dans `IDEES.md`)
| # | Idée | Score |
|---|---|---|
| I98 | Capture 320 × 240 × 3 images, contrôle qualité avant calcul, rafale sautée si la caméra est prise | 20 |
| I99 | Indices nommés par unités d'action (AU12, AU6 + 12, AU4, AU1, AU15…), aucun sens codé | 16 |
| I100 | D4 en 3 PR mergeables : moteur + modèles au build + test ; service ; diagnostic | 16 |
| I101 | Test d'équivalence en CI (JSON MediaPipe figé, émulateur x86_64) | 12 |

## Vérifications
- Prototype vs MediaPipe : points médiane 0,78 px (max 1,7 px, 117 px entre les yeux) ; blendshapes depuis les points
  MediaPipe 5·10⁻⁵ ; depuis nos points moyen 0,009, max 0,054 ; ≈ 28 ms / image en Python (≈ 10 ms d'inférence).
- Journal seul modifié : `npm run test` **1321 ✅** (101 fichiers) ; `npm run build` ✅. Pas de `visual` : aucun code de l'app touché.

## Apprentissages / décisions
- **Blendshapes : coordonnées en pixels** (ou échelle identique sur x et y). En coordonnées normalisées d'une image
  non carrée, écart jusqu'à 0,37 — piège invisible sans comparaison.
- Pas de demi-pixel dans la transformation de recadrage (+0,3 px d'erreur sinon).
- 320 px de large suffit (écart 0,019 vs pleine résolution) ; 160 px dégrade (max 0,21).
- La correspondance blendshapes → unités d'action est un consensus d'experts, **non validé** pour reconnaître une
  émotion : elle sert à nommer les indices, pas à décréter un état.

## Suite proposée
1. 🧹 D1 reste en tête des runs de code (« Voyage » déduit, Connecteurs, Analyses avancées).
2. 🙂 D4 : I100 ① (moteur LiteRT + modèles au build + `abiFilters` I95 + test I101), écrit à partir de `protocoles/visage.md`.
3. 🧭 D6 : I97 ② (sens personnel du radar).
4. 💡 Prochain run idées (17/10 20:30) : apprendre un sens personnel avec peu de jours (a priori faible, n-of-1) ;
   images test CC0 ; One UI et veille profonde.

# 2026-10-16 20:30 Paris (18:30 UTC) — Run « idées » : le visage sans télémétrie, un APK léger, Samsung en veille

**Type** : 💡 idées (D4, D2, D6)  ·  **PR** : « [Auto] Idées : visage sur LiteRT seul, APK léger, Samsung »

## Pourquoi
- 20:30 Paris = run « idées » : pas de code produit.
- Démarrage : main à `2957bec` (v147, #187 fusionnée), « Tests », « Build & Release » et émulateur A56 verts. Aucune PR
  « [Auto] » ouverte (`cursor/*` #51 non touchée). Aucun nouveau journal dans `journal/diagnostics/`.
- Le run de 08:30 a laissé trois questions avant le premier code D4 (I88) : poids et vitesse de MediaPipe en arm64,
  comportement de Samsung avec une caméra de fond, formulations de Bearable / Welltory.

## Ce qui a été fait
- **Mesures dans la session** (scratchpad, rien de binaire dans le dépôt) : AAR et pom téléchargés depuis le Maven de
  Google et inspectés (`tasks-core` / `tasks-vision` 1.1.1, `mlkit face-detection` 16.1.7, `litert` 2.3.0) ; les trois
  `.tflite` du `face_landmarker.task` exécutés avec `ai-edge-litert` (formes d'entrée / sortie, temps sur 1 cœur).
- **Découverte** : télémétrie Google sans option dans MediaPipe (issue #6291, `RemoteLoggingClient` dans l'AAR) et ML
  Kit (conditions d'utilisation) ; LiteRT seul n'a aucune dépendance d'envoi.
- Code HealthTrack relu : APK v147 = 6,8 Mo, **aucun `abiFilters`**, aucune demande d'exclusion de l'optimisation de
  batterie ; `radar.js` code encore `higherIsBetter`.
- `IDEES.md` : nouvelle section, **4 idées I94–I97**. `BACKLOG.md` : D4 (I94 décision, I96), D6 (I97), D2 (I95),
  prochaines étapes n° 14, « Livré ». `README.md` : paragraphe du résumé, « Meilleures idées », ligne du tableau
  (+ #187 → v147).
- Pas d'entrée « Nouveautés » : rien de visible dans l'app.

## Idées retenues (détail dans `IDEES.md`)
| # | Idée | Score |
|---|---|---|
| I96 | Une seule autorisation « travailler en arrière-plan » (montre + visage), consigne One UI seulement si des relectures manquent | 16 |
| I94 | Visage = LiteRT seul + 3 modèles Apache-2.0 assemblés en Java, pas MediaPipe Tasks ni ML Kit | 15 |
| I95 | APK maigre : `abiFilters` arm64 + x86_64, budget de taille en CI | 15 |
| I97 | Radar forme « inhabituel chez vous », sens appris sur vos notes seulement | 12 |

## Vérifications
- Journal seul modifié. `npm run test` : **1299 ✅** (101 fichiers) ; `npm run build` ✅. Pas de `visual` : aucun code de l'app touché.

## Apprentissages / décisions
- **Décision** : pas de MediaPipe Tasks ni de ML Kit dans HealthTrack (envoi réseau à chaque usage, sans option ;
  14,4 Mo de `.so` arm64). Le pipeline visage sera réécrit sur LiteRT à partir d'une spécification (`protocoles/visage.md`),
  vérifié contre MediaPipe hors app.
- Mesure : détecteur 1,7 ms + maillage 7,9 ms + blendshapes 0,8 ms par image (1 cœur x86) → le coût énergétique d'une
  rafale = l'ouverture de la caméra.
- **Avant toute bibliothèque native** : `abiFilters` (sinon chaque `.so` est embarqué 4 fois).

## Suite proposée
1. 🧹 D1 reste en tête des runs de code (« Voyage » déduit, Connecteurs, Analyses avancées).
2. 🧭 D6 : Radar (I97), Nutrition « repères » ; 🔁 D5 : ordre temporel.
3. 🙂 D4 : I95 (`abiFilters`, petit) puis spec `protocoles/visage.md`, puis I88 + I94 (service + moteur + diagnostic) ;
   I96 peut partir avec la montre (petit, utile tout de suite).
4. 💡 Prochain run idées (17/10 08:30) : ancres du détecteur et 146 points des blendshapes ; GT 6 Pro et veille One UI.

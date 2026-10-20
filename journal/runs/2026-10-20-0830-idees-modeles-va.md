# 2026-10-20 08:30 Paris (06:30 UTC) — Run « idées » : modèles valence / éveil, visage et voix

**Type** : 💡 idées (consignes du 18/10 et du 19/10 au soir ; veille prioritaire sur le choix du modèle)  ·  **PR** : voir ci-dessous

## Pourquoi
- 08:30 Paris = run « idées » : pas de code produit, sauf si le signalement du 19/10 15:05 n'était pas corrigé. Il l'est :
  (a) et (b) par #221, (c) par #228. Main à `81f7ce3`, aucune PR « [Auto] » ouverte, aucun diagnostic de l'A56 reçu.
- Le run de 06:30 demandait : licence d'EmoNet, modèles vocaux embarquables (étape 3), et le BACKLOG un modèle
  valence / éveil à licence de poids explicite.

## Ce qui a été fait
- Lecture des sources primaires : article HSEmotion ABAW-6 (arXiv 2403.11590, tableaux 1, 2, 5), arborescence du dépôt
  `sb-ai-lab/EmotiEffLib`, README et LICENSE.txt d'EmoNet, fiches Hugging Face (Wav2Small, audEERING, WavLM Odyssey,
  SenseVoice), MoodCam.
- Téléchargement des 3 modèles VA officiels en ONNX (scratchpad, **rien dans le dépôt**) : SHA-256 calculés (B0 =
  `c43e056a…`, identique à l'app ; MobileFaceNet `0323ace5…` ; MobileViT `93a2bee1…`), formes d'entrée / sortie,
  latence onnxruntime CPU 1 fil (x86) : 20 / 22 / 73 ms.
- Vérification dans le code que le lissage existe déjà (médiane des images par lecture, `FacePipeline.java:140` ;
  médiane des lectures par jour, `faceMoodDays.js`).
- `IDEES.md` (section du 20/10 08:30, **I126–I128**), `RESEARCH.md`, `BIEN-ETRE-AUTO.md` (révision du comparatif),
  `BACKLOG.md` (étape 2 et 3, ordre des prochaines étapes), `README.md` (paragraphe, meilleures idées, priorités,
  tableau). Pas d'entrée « Nouveautés » : rien de visible dans l'app.

## Résultat principal
| Modèle | AffectNet CCC V / A | Aff-Wild2 brut CCC V / A | Taille | Latence (x86, 1 fil) |
|---|---|---|---|---|
| B0 (actuel) | 0,594 / 0,549 | 0,404 / 0,248 | 16 Mo | 20 ms |
| MobileFaceNet | 0,577 / 0,547 | 0,413 / 0,266 | 8 Mo | 22 ms |
| MobileViT | 0,599 / 0,565 | 0,403 / 0,244 | 39 Mo | 73 ms |
| DDAMFN (pas d'ONNX publié) | 0,729 / 0,643 | 0,412 / 0,230 | — | — |

→ Hors AffectNet, tous se valent ; le lissage temporel rapporte +0,05 à +0,09. Décision : duo B0 + MobileFaceNet
(I126), désaccord dans la confiance. EmoNet écarté (CC BY-NC-ND). Voix : aucun modèle léger sous licence permissive
→ texte d'abord (I128).

## Idées retenues
| # | Idée | Score |
|---|---|---|
| I126 | Duo B0 + MobileFaceNet, désaccord → confiance | 16 |
| I128 | Voix : texte d'abord ; prosodie seulement avec un modèle sous licence claire | 10 |
| I127 | Pondérer les lectures du jour par qualité (lissage déjà en place) | 7 |

## Vérifications
- `npm ci` puis `npm run test` dans `app/` : **1 602 tests verts** (120 fichiers). Journal seulement (aucun fichier de l'app touché : pas de build / visual / lint).

## Apprentissages / décisions
- **Un benchmark d'images posées surestime les écarts entre modèles** : comparer aussi sur une base vidéo réelle
  (Aff-Wild2) avant de choisir un modèle plus lourd.
- **La licence élimine les meilleurs modèles vocaux** ; ne pas les télécharger « au premier lancement » pour contourner :
  leur licence (recherche uniquement) vise l'usage, pas la redistribution.

## Pour le propriétaire (Galaxy A56) — inchangé
Installer la dernière version, Lecture du visage → Relancer si demandé, déverrouiller 2–3 fois à l'empreinte en
regardant l'écran, puis Diagnostic → « Enregistrer le diagnostic » et m'envoyer le fichier (ou une capture des lignes
« Aujourd'hui… », « Accès caméra… », « Dernières tentatives… », « Modèle valence / éveil… », « Arrêt… »).

## Suite proposée
1. 📥 Diagnostic de l'A56 (arbre I122).
2. 🙂 I126 duo de modèles du visage (prochain run de code sans diagnostic).
3. 🎙️ I124 sonde vocale, puis habitudes (tags) / effets décalés sur l'humeur estimée.

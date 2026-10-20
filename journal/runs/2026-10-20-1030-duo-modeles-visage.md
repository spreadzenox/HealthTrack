# 2026-10-20 10:30 Paris (08:30 UTC) — Duo de modèles du visage (I126)

**Type** : 🔴🙂 code (consigne du 19/10 au soir, étape 2 consolidée : « accord entre signaux »)  ·  **PR** : voir ci-dessous

## Pourquoi
- Main à `78f6734`, aucune PR « [Auto] » ouverte (seule la #51 `cursor/*`, hors routine), dernier « Build & Release » vert.
- Signalement du 19/10 15:05 déjà corrigé (#221, #228) ; aucun diagnostic de l'A56 reçu dans `journal/diagnostics/`.
- Le run idées de 08:30 désignait **I126** comme prochain run de code : la consigne du 19/10 au soir demande une
  confiance qui reflète « l'accord entre signaux » et le modèle le plus fiable possible.

## Ce qui a été fait
- **Normalisation vérifiée à la source** : `emotiefflib/facial_analysis.py` utilise pour les modèles `mbf_` une entrée
  112 px et `mean = std = 0,5` (pas ImageNet). ONNX : entrée `input [n, 3, 112, 112]`, sortie `output [n, 10]`
  (8 émotions + valence + éveil, même disposition que le B0). SHA-256 et taille revérifiés (8 251 681 octets).
- Natif : `FaceAffect.Spec` (B0 / MBF) ; `FacePipeline` à 2 modèles (moyenne par image, `affectGap` = médiane des
  |ΔV|, `affectModels` = 2, repli sur le modèle qui répond, erreurs du second préfixées `mbf:`) ;
  `FaceAffectModel.Spec` + téléchargement des modèles manquants dans l'ordre B0 → MBF ; service : ouverture du second
  modèle dès qu'il arrive, `affect2LoadMs`, `affectDuoBursts` ; plugin : `affectModel2`, `duo`.
- Vecteurs : `visage-va-vecteurs.py` paramétré par le nom du modèle → `affect-vectors-mbf.json` ; régénération du B0
  vérifiée identique octet pour octet.
- JS : `faceMood` (σ duo, écart en quadrature, `duo: { models, gap, agreement }`, phrases « deux modèles d'accord… ») ;
  `faceSense` (`faceAffectDuoState`, export `affect.duo`, `estimate.agreement` — un mot, jamais l'écart) ; carte :
  `prepareAffect` relancé si le second manque, même quand le premier est prêt (sinon les utilisateurs actuels ne
  l'auraient jamais téléchargé).
- Script visuel : données de démo avec duo, option `--face-diag` (Diagnostic de la carte déplié).

## Tests
- JVM (`npm run test:java`) : **114 verts** (+3) — entrée MobileFaceNet = Python à 1e-4 (2 portraits), duo (moyenne,
  écart, 112 px), repli sur un seul modèle + erreur étiquetée.
- Vitest : **1 609 verts** (+7) — `faceMood` (+4 : fourchette resserrée / élargie, médiane du jour, phrases, la note
  ne bouge jamais), `faceSense` (+2), `FaceSenseCard` (+1) ; 2 attentes d'égalité stricte complétées.
- `npm run lint` : 6 erreurs, identiques à main. `npm run build` ✅. `npm run visual` (toutes pages, `--empty`,
  `--light`, `--face --face-diag`, `--face=nomodel --face-diag`) ✅ sans erreur JS ; captures lues : accueil (« deux
  modèles d'accord », « Deux modèles valence / éveil embarqués (HSEmotion)… mis en commun »), carte visage, diagnostic
  (« Second modèle (MobileFaceNet) : prêt · 4 lectures lues par les deux modèles · chargé en 110 ms » ;
  « pas encore téléchargé (8 Mo…) »).
- Pas de SDK Android dans le conteneur : la compilation du natif est vérifiée par le check « Build APK ».

## Risques connus
- Le recadrage (côté = 1,1 × boîte des 478 points) a été choisi pour le B0 ; MobileFaceNet a été entraîné sur des
  boîtes de détecteur. Si l'A56 montre beaucoup de « désaccord », c'est la première piste.
- Seuils 0,15 / 0,3 posés a priori.

## Pour le propriétaire (Galaxy A56)
Installer la version publiée après ce run ; ouvrir la carte « Lecture du visage » en Wi-Fi, la rouvrir une minute
plus tard (« Second modèle : prêt ») ; déverrouiller 2–3 fois à l'empreinte en regardant l'écran ; Diagnostic →
« Enregistrer le diagnostic » et m'envoyer le fichier (lignes « Humeur estimée … deux modèles : … », « Temps moyen »,
« Second modèle … », et toujours « Aujourd'hui… », « Accès caméra… », « Dernières tentatives… »).

## Suite proposée
1. 📥 Diagnostic de l'A56 (arbre I122) dès qu'il arrive.
2. 🎙️ I124 sonde vocale, puis habitudes (tags) / effets décalés sur l'humeur estimée.
3. I127 pondération des lectures du jour par leur qualité.

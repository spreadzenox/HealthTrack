# 2026-10-24 19:30 Paris (17:33 UTC) — POL-2 : historique du bien-être

**Type** : 🧭 chantier produit (polissage du parcours, retours du propriétaire du 24/10 vers 15:00, point 2)

## Constat au démarrage
- Main à `bdbef6a` (#329), workflows de main verts (Tests ; Build & Release v255 et Play — AAB sur `fd5f407`).
  Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).

## Ce que sortent réellement les modèles
- `enet_b0_8_va_mtl` et `mbf_va_mtl` (HSEmotion) rendent 10 nombres : 8 logits d'expression (ordre AffectNet : colère,
  mépris, dégoût, peur, joie, neutre, tristesse, surprise), puis valence et éveil. `FaceAffect.decode` ne gardait que
  les deux derniers. Détail consigné dans `journal/BIEN-ETRE-AUTO.md`.

## Ce qui a été fait
- **Natif** : `FaceAffect.expressions(out)` (softmax stable des 8 scores, null si sortie invalide) et
  `FaceAffect.EXPRESSIONS` (clés `exAnger`…`exSurprise`) ; `FacePipeline` garde les probabilités par image (moyenne
  du duo) et en écrit la moyenne dans la rafale. Rien d'autre ne change (valence / éveil, écart du duo, lumière).
  Tests JUnit : softmax, sortie invalide, moyenne d'une rafale qui somme à 1, duo.
- **Pas de migration** : `payload.values` est libre (parseFaceBurst garde tout nombre), export / import / sauvegarde
  les portent déjà. Entrées Y uniquement (type `face_burst`), pas utilisées par l'estimateur.
- **`services/mood/wellbeingHistory.js`** : jour (un point par lecture avec fourchette), semaine / mois (médiane
  pondérée par jour, jour < 3 lectures marqué `few`), notes à la main à part, moyennes de valence / éveil, mélange
  d'expressions sur les seules lectures qui en portent. `loadWellbeingHistory` (notes lues même sans rafale).
- **Page `/bien-etre` « Historique du bien-être »** : onglets Jour / Semaine / Mois, carte menthe (moyenne, compteurs,
  courbe SVG, légende, « Noter moi-même »), carte « Ce que lisent les modèles » (barres bipolaires valence / éveil,
  barres lilas des 8 expressions, « estimations de l'expression du visage, pas de ce que vous ressentez, ni un
  diagnostic », « aucune image »). État vide sans zéro trompeur.
- **Carte « Bien-être estimé »** : « Historique › » à droite de « Noter moi-même ».
- Données de démo : expressions sur les rafales avec valence ; route ajoutée aux captures par défaut.
- Nouveauté `2026-10-24-1930-historique-bien-etre.json`.

## Vérifications
- Vitest 2 156 + nouveaux tests verts, build OK, lint inchangé (6 erreurs préexistantes), tests Java 126 OK.
- Captures relues : `/bien-etre` démo clair (semaine), sombre (jour, fourchettes), `--empty --play` (état vide, après
  correction des « 0 lecture · 0 jour »), Accueil démo (lien « Historique › »).

## Suite
- Prochain run de code : **POL-7** (onglet « Analyses »).

## Après le merge (#330, `4f02396`)
- Premier passage CI : « Frontend (Vitest) » rouge — type de nouveauté `nouveauté` inconnu (`nouveau` attendu) ; corrigé,
  et les fourchettes de la vue Jour ne se dessinent plus que si elles sont définies (avertissement NaN d'un test).
- Checks de la PR ensuite tous verts (Vitest, Build APK, Relais, montre Java, budget de lectures, émulateur API 35 et 36).
- « Build & Release » vert : **v256** publiée (APK 33 745 620 octets, 33,7 Mo) ; « Play — AAB » vert (envoi en test interne).

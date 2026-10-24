# 2026-10-24 22:30 Paris (20:32 UTC) — POL-7b : pistes dépliables, barres neutres

**Type** : 🧭 chantier produit (polissage du parcours, retours du propriétaire du 24/10 vers 15:00, point 7)

## Constat au démarrage
- Main à `8eee131` (#334), workflows de main verts (Tests, émulateur ; Build & Release v257, Play — AAB). Aucune PR
  « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- Suite de POL-7a (maquette `IDEES.md` I163, points 3–4). Découpage : **7b** (ce run, présentation des pistes et des
  barres) puis **7c** (un facteur = un verdict, liste « autres liens » fusionnée).

## Ce qui a été fait (présentation seulement : aucun calcul ni seuil ne change)
- **`LeverCard` dépliable** : fermé, l'action, la mention D6 éventuelle, « Lien fort / possible avec votre bien-être »
  et l'étiquette (« Chez vous : lien net » / « À vérifier ») ; le chevron `DetailsToggle` (même geste que l'Accueil,
  `aria-expanded`) ouvre en mono « r = +0,57 · ≈ 59 jours indépendants » (+ r sans le week-end s'il diffère).
- **Barres neutres (D6)** : `CorrelationBar` et `ImportanceBar` passent de `reco-corr-pos/neg` (vert / rouge) à
  `reco-corr-up/down`, tous deux `--lilac-bar` ; la valeur devient « ↑ 0,59 » / « ↓ 0,10 » (r signé en `title`).
  Légende unique `DIRECTION_HINT` (« ↑ va avec un meilleur bien-être · ↓ avec un moins bon… ») au lieu de « Vert = … ·
  Rouge = … » (corrélations et visage) ; modèle de prédiction : « ▲ / ▼ ».
- Écarts des habitudes (« −0,4 point ») : plus de rouge ni de vert, texte encre en gras.
- Nouveauté `2026-10-24-2230-pistes-depliables.json`.

## Vérifications
- Vitest : `Recommendations.test.jsx` 50 verts (test réécrit : barres ↑ / ↓ sans classes vert / rouge ni légende
  « Vert = » ; piste sans r avant le chevron, r et jours après ; r sans week-end après le chevron) ; suite complète
  **2 156** verts.
- Build OK ; lint inchangé (6 erreurs préexistantes).
- Captures relues : `--play` démo clair (piste ouverte par `--click`), `--play --dark`.

## Suite
- **POL-7c** : « Alcool » une seule fois (visage + notes fusionnés, le plus solide gagne), « autres liens » en une
  liste, « Voir N autres liens », émojis retirés des titres d'habitudes.
- Puis POL-6 → POL-8 → POL-1.

## Après le merge (#335, `105af7d`)
- Checks de la PR tous verts (Vitest, Build APK, Relais, montre Java, budget de lectures, émulateur API 35 et 36).
- « Build & Release » vert : **v258** publiée (APK 33 746 672 octets, 33,7 Mo) ; « Play — AAB » vert (envoi en test interne).

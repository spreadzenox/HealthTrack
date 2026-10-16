# 2026-10-16 10:30 Paris (08:30 UTC) — Nettoyage : page Repas plus compacte (D1)

**Type** : 🧹 D1  ·  **PR** : « [Auto] Nettoyage : page Repas plus compacte »

## Pourquoi
- Démarrage : main à `574907f` (#182, v142 + journal) ; « Tests » et émulateur A56 verts. Aucune PR « [Auto] »
  ouverte (`cursor/*` #51 hors routine, non touchée). Aucun nouveau journal dans `journal/diagnostics/`.
- 10:30 Paris = run normal → D1 en tête. Reste D1 noté : « relire Repas ». Capture avant : **3 écrans** pour 5 jours
  de repas ; une intro de 2 lignes qui redit les boutons, une grande zone en pointillés pour 2 boutons, une aide
  « Utilisez l'appareil photo ou la galerie sur mobile » (l'app *est* sur mobile), un bouton « Décrire » à part, et
  chaque aliment sur sa propre ligne.

## Ce qui a été fait
- `pages/Food.jsx` : intro retirée ; aide « sur mobile » retirée ; « 📷 Photo », « 🖼️ Galerie » et « ✍️ Décrire »
  sur une même ligne (grille de 3, hauteur 48 px pour le pouce). Le libellé accessible des champs reste « Prendre une
  photo » / « Choisir depuis la galerie », celui du bouton « Décrire ou saisir sans photo ». « Reprendre » (après une
  photo) remplacé par « Photo » : il passait sur deux lignes.
- `App.css` : zone d'envoi resserrée (padding 28 → 10 px, bordure `--border`), boutons centrés, `.hint` mort supprimé.
- `Food.css` : aliments d'un repas en ligne (`inline-block`, séparateur « · » en fin d'élément, un aliment ne se coupe
  pas sauf s'il dépasse une ligne) ; `.quick-meal-btn` pleine largeur supprimé.
- Test : `Food.test.jsx` — les trois saisies dans `.upload-actions`, plus d'intro ni d'aide redondante (écrit avant le
  code, rouge puis vert).

### Retiré et pourquoi (D1)
| Retiré / fusionné | Pourquoi |
|---|---|
| Intro « Photographiez votre assiette, décrivez-la… » | Redisait les trois boutons placés juste dessous |
| Aide « Utilisez l'appareil photo ou la galerie sur mobile » | Inutile : l'app est une app mobile |
| Bouton « Décrire ou saisir sans photo » pleine largeur | Fusionné dans la ligne des saisies (« Décrire ») |
| Une ligne par aliment dans les derniers repas | Les aliments à la suite : ≈ 2× plus de repas par écran |

## Vérifications
- `npm run test` : **1291 tests verts** (100 fichiers). Lint : **6 erreurs** (inchangé). Build ✅.
- `npm run visual` (toutes les pages) ✅ ; `/food` regardé en démo (3 → **2 écrans**), `--light`, `--empty`,
  `--meal-text=form` (bouton « Décrire » masqué pendant la saisie, Photo / Galerie s'élargissent) et
  `--food-analysis` (photo choisie).

## Suite
- D1 : « Voyage » déduit (I85 ②b) ; avertissement « repas manquants » de Nutrition à resserrer ; relire l'Accueil
  (4 écrans) carte par carte.
- D5 : I92 (nettoyage de `moodEstimate.js` + `ESTIMATOR_INPUTS`) avant le service visage (I88).

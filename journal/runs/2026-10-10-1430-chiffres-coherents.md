# 2026-10-10 14:30 UTC — Chasse aux bugs visuelle : chiffres cohérents, textes à jour

**Type** : 🐛  ·  **PR** : #NN (voir tableau du résumé)

## Pourquoi
Les 4 runs précédents ont tous porté sur le moteur d'analyse ; la charte demande ≥ 1 run sur 4 de vérification
visuelle. `npm run visual` (démo, `--empty`, `--light`), lecture de toutes les captures.

## Constats
1. **Bug (tableau de bord)** : carte FC au repos « **61** bpm — *Plus basse que d'habitude* » avec « Votre norme :
   **61–65** bpm ». Le statut est calculé sur les valeurs exactes (moyenne 60,5 < borne 60,6), l'affichage arrondit
   à l'entier → contradiction visible, qui sape la confiance dans la carte.
2. **Texte inexact (Paramètres)** : « Ce qui est envoyé : uniquement la photo du repas » — faux depuis la saisie de
   repas décrit en texte (run 02:30), où le texte part aussi chez Gemini. « Sans clé, l'analyse photo n'est pas
   disponible » ignorait la description et la saisie manuelle.
3. **Texte périmé (Données)** : « repas, bien-être, et plus tard montre, balance … dans le navigateur ».
4. Faux positif : « 1728 mg/j » sans espace en Nutrition. Le DOM contient bien « 1 728 » (espace fine insécable) ;
   c'est la police Inter SemiBold du conteneur qui n'a pas ce glyphe. Sur le téléphone (Roboto), ce n'est pas le cas.
   → ne pas « corriger ».
5. `--light` : rendu toujours sombre (mode clair pas encore implémenté, déjà au backlog C1). `--empty` : rien d'anormal.

## Ce qui a été fait
- `BaselineCards.jsx` : `formatterFor(b)` — entiers par défaut, **une décimale** quand l'arrondi placerait la
  moyenne du mauvais côté de la norme affichée (dans un sens comme dans l'autre). Test qui reproduit (rouge avant).
- `Settings.jsx` : introduction, aide de la clé et encart « Ce qui est envoyé » mentionnent photo **ou** texte ;
  « photos et textes envoyés » pour l'avertissement clé gratuite. Test.
- `Data.jsx` : introduction à jour.

## Vérifications
- Tests : 624 ✅ (622 avant, +2) · Lint : 7 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : toutes les pages (démo, `--empty`, `--light`) sans erreur JS ; après correctif, carte FC « 60,5 bpm —
  norme 60,6–65,1 » ; Paramètres et Données relus.

## Apprentissages / décisions
- Règle générale : quand un statut est calculé sur des valeurs exactes, l'affichage ne doit pas pouvoir le
  contredire — ajouter de la précision plutôt que changer le seuil.
- Le Radar n'est pas concerné (il n'affiche que des écarts |z| ≥ 1,5, jamais à la limite de l'arrondi).
- Avant de corriger un défaut typographique vu en capture, vérifier le DOM (police du conteneur ≠ téléphone).

## Suite proposée
- 🏗️ Effets décalés (lags 0–3 j) sur sommeil / activité / tags (C3).
- 🐛 Jours sans repas saisi dans le lissage nutritionnel.
- 🎨 Introduction du tableau de bord trop longue quand des données existent (masquer ou raccourcir) ; « Prédiction ML »
  → « Prédiction du jour ».

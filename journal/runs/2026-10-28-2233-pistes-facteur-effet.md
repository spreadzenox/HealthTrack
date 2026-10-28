# Run du 28/10/2026 22:33 (Paris, CET) — Pistes « facteur → effet » (POL-PLAY-32)

**Type** : 🎨 UI / textes (règle 6)

## Constat au démarrage
- Main à `29ccccf` (#485), tous les workflows verts (Build & Release v346, Play — AAB, relais, Pages, émulateur A56).
- PR #486 (journal v346 du run précédent) : branche partie d'avant #485, elle recréait le compte rendu de 21:33
  (conflit add/add à la fusion). Ses 7 lignes « Après le merge » sont reprises ici dans
  `runs/2026-10-28-2133-compteurs-expiration.md` ; #486 fermée sans merge. PR #51 (`cursor/*`) non touchée.

## Fait
- `analysisEngine.js` : `LEVER_FACTORS` (nom du facteur par variable de `LEVER_ACTIONS`) et `leverTitle(variable, r)` :
  « Plus de pas → meilleur bien-être » si r > 0, « Moins de … » si r < 0 (élision « d’ » devant voyelle), les nuits
  ont leurs mots (« Nuits plus longues / plus courtes »). `leverSuggestion` renvoie `title` en plus d'`action`.
- `Recommendations.jsx` (`LeverCard`) : titre « facteur → effet » ; « À tester : <action> » derrière le chevron ;
  repli sur `action` pour un résultat mis en cache avant ce run.
- `pistesSummary.js` : la carte lilas de l'Accueil reprend `title` (repli `action` pour un ancien résumé).
- Les effets décalés gardent leur ligne « Piste : … » (détails d'Analyses).

## Tests
- `analysisEngine.test.js` : titres des deux côtés (nuits, pas, écran le soir, oméga-3, alcool) et un test qui
  parcourt toutes les variables (format « … → meilleur bien-être », jamais d'impératif). `pistesSummary.test.js` :
  préfère le titre. `Recommendations.test.jsx` : titre visible, action seulement au chevron ; le test des effets
  décalés cherche le nouveau titre. Rouges avant, verts après.

## Vérifications
- `npm run test` : vert (2 640) ; lint 6 erreurs (inchangé) ; build OK.
- `npm run visual -- --play --routes=/recommendations,/` : Analyses (« Nuits plus longues → meilleur bien-être »,
  « Plus de pas → meilleur bien-être ») et carte lilas de l'Accueil (« 2 pistes repérées », premier titre) relues.
  Aucune CSS modifiée (thème sombre inchangé). `npm run visual` complet : 15 pages ok, aucune erreur JS.

## Demandes iOS
- Note de Nouveautés commune aux deux plateformes (code d'analyse partagé) : pas de `variants`.

## Suite
- POL-PLAY-31 (bouton « Supprimer toutes mes données »), POL-PLAY-33 (réintroduction : chevrons ; « Voir les liens
  incertains » sans nombre).

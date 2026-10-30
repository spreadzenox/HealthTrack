# Run du 30/10/2026 19:33 (Paris, CET) — Repas : un aliment par ligne (POL-PLAY-68)

**Type** : 🎨 Polissage de la version Play (audit écran par écran)

## Constat au démarrage
- Main à `303cbe4` (#532) : Tests, Build & Release, Play — AAB et émulateur A56 verts. Aucune PR « [Auto] » ouverte.
- Signalement du 30/10 (plantage du visage) corrigé et mergé par le run de 17:33 (#531) : reste le retest du
  propriétaire sur la version de test interne. Rien d'autre de prioritaire (CI verte, liste POL-PLAY soldée sauf
  POL-PLAY-11, qui attend une journée sans plantage dans Android vitals).

## Audit
- `npm run visual -- --play --size=360x780` (démo, 15 pages) : aucun débordement horizontal ni texte coupé signalé ;
  seul message console : « AppManager already registered » (déjà connu, sans effet).
- `--play --empty` : Repas, Nutrition, Tendances, Réglages, Nouveautés relus.
- Défaut retenu : les aliments d'un repas (Repas et Journal) étaient « à la suite » (`inline-list`, choix D1) : à
  360 px comme à 412 px, chaque ligne finissait par un « · » orphelin (« Poulet, cuisse : 150 g · »). Séances du
  Journal écrites avec des tirets cadratins (« Course à pied — 32 min — 330 kcal ») alors que tout le reste utilise « · ».
- Vus, non traités : « Oeuf brouillé » (nom Ciqual) ; tuile « Ajouter une montre » de Tendances en lilas (convention
  des tuiles pastel : lilas = sources).

## Fait
- `components/MealItemList.jsx` (partagé) : un aliment par ligne, nom à gauche (nom complet en infobulle), quantité à
  droite en IBM Plex Mono gris (DESIGN.md : chiffres en mono). `.inline-list` retiré d'`App.css` (plus utilisé).
- `DailyJournal.jsx` : séance « Vélo · 56 min · 329 kcal ».
- Note de Nouveautés « Sommeil : une nuit n'est plus comptée deux fois » marquée `"variants": ["play", "sideload"]`
  (elle parle de Health Connect ; demande iOS 3).

## Tests (rouges avant, verts après)
- `Journal.test.jsx` : liste `meal-item-list` sans `inline-list`, une ligne par aliment, quantité dans
  `.meal-item-qty`, infobulle du nom complet ; séance avec « · ».
- `Food.test.jsx` : même chose sur la page Repas (2 tests ajustés).

## Vérifications
- `npm run test`, `npm run build`, `npm run lint`, `npm run visual` (voir PR) ; captures relues : Repas et Journal
  à 360 px clair, Repas à 412 px sombre.

## Données
- Affichage seulement ; aucune donnée, migration ni export touché.

## Suite
- Retest du visage par le propriétaire ; POL-PLAY-11 (alpha) après une journée sans plantage dans Android vitals.
- Prochain audit : Accueil et Analyses en `--light --theme=system` (schéma clair du téléphone) à 360 px.

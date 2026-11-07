# 07/11 16:35 — Nouvel écran Aujourd'hui, étape 2 : le bien-être du jour (AUJ-2)

Type : 🎨 run de code (nouvel écran Aujourd'hui, priorité des runs de code).

## Constat au démarrage
- main `dcbb54d` (#782). Aucune PR « [Auto] » ouverte (seule #51, cursor/*, non touchée).

## Consigné (premier run qui lit la revue du 07/11 vers 16:30)
- `DESIGN.md` § 9 : leçons 13 à 17.
- `BACKLOG.md` : compléments AUJ-1b (photo des selles dans le bandeau), AUJ-4b (« Vos apports jusqu'ici »), précision
  AUJ-3 (écart dès 7 jours), AUJ-9 (toucher → Journal › Tendances réglé) ; nouvelle section « Nouvelle organisation »
  ORG-1 à ORG-7 (Agir, Journal › Jours, Tendances visualiseur, historique fusionné, Analyses Bien-être / Digestion,
  méthode à trois horizons avec banc de simulation, résultats « Pistes à tester » et « Ce qui pèse », sources classées).
- `PRODUIT.md` : historique.

## Fait (AUJ-2)
- `services/today.js` : `dayWellbeing` remplace `dayStatus` (et ses niveaux « Plutôt bonne / moyenne / Plus
  difficile ») : valeur sur 1 à 5, « D'après N lectures du visage » (et « votre gêne / douleur digestive » quand elle
  compte, VENTRE-BE-2), points et tendance du jour ; sans lecture, les notes du jour.
- `faceMoodData.loadWellbeingToday` renvoie aussi `today` (vue Jour de `wellbeingHistory`, mêmes points que
  l'historique).
- `DayStatusCard` réécrite : « Bien-être aujourd'hui », chiffre en mono, phrase d'origine, courbe SVG (6 h à 23 h au
  moins, ligne du milieu en pointillés, à partir de 3 points, leçon 17) ; tout le bloc ouvre `/bien-etre`.
  Calibration de départ et rappel du déverrouillage gardés.
- `DayBreath` (horizon qui respire) supprimé ; phrase d'intro du premier lancement retirée (leçon 2).
- Aucune donnée touchée.

## Vérifications
- Tests écrits avant le code : `today.test.js` (3), `DayStatusCard.test.jsx` (8), `Dashboard.test.jsx` adapté.
- `npm run test` : 3 272 passés, 44 ignorés (DayBreath et ses tests retirés). `npm run build` vert ; lint des
  fichiers touchés : 0 erreur.
- Captures `--play --routes=/,/bien-etre` démo clair (« 3 /5 », 4 lectures), `--dark --face-dense` (« 3,1 /5 »,
  101 lectures, courbe), `--empty` (phrase vers le bandeau). Relu.

## Suite
- AUJ-2b (calibration de départ dans ce bloc), puis AUJ-3 (avec la précision du 16:30), AUJ-4 / 4b.
- Le chiffre mono « 3,1 » a une virgule large (Plex Mono) : à revoir avec AUJ-8 si le propriétaire le remarque.

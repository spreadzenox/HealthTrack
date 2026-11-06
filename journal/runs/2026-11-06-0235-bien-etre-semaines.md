# 06/11 02:35 — Onglet Bien-être : vos semaines au lieu du lien vers Tendances (BE-SEMAINES)

Type : 🔧 run de code (02:35 Paris). Priorité : retours du 04/11, point (4) (trois horizons, chacun lisible).

## Constat au démarrage
- main `87a5410` : Tests, Build & Release, émulateur A56, Play — AAB et Play — Alpha (porte de 24 h) verts.
  Aucune PR « [Auto] » ouverte. Alpha = 100811 en examen ; la porte la garde jusqu'au 06/11 vers 16:30.
- Revue des captures d'Analyses (play, 360×780) : l'onglet Bien-être renvoyait encore « Sur quelques semaines » vers
  l'onglet voisin Tendances, qui ne montre que 14 jours : même défaut que celui corrigé pour le Ventre à 00:35.

## Fait
- `services/mood/wellbeingWeeks.js` : 8 semaines, la dernière finit aujourd'hui ; par semaine, moyenne du bien-être
  estimé (note du jour de `faceMoodDays`, la même que l'Accueil, l'historique et les Analyses, jours d'au moins 3
  lectures) et, à part, moyenne des notes (plusieurs notes un jour = un jour). Graphique dès 2 semaines lues ou notées,
  à partir de la première. Description seulement : aucun facteur X lu (D5), aucun jugement (règle 6).
- `WellbeingWeeks` (Horizon.jsx/.css, menthe) remplace `WeeksHorizon` dans l'onglet Bien-être (avec et sans assez
  de notes) : barre = estimé, point émeraude = vos notes, valeur au-dessus, repère 2,5 en pointillé, libellé lecteur
  d'écran par semaine ; sinon « Arrive après 2 semaines de bien-être estimé ou noté. ». Le lien « Voir vos
  tendances » disparaît (Tendances est un sous-onglet). `analysisTasks.basicAnalysis` renvoie `wellbeingWeeks`.
- Nouveautés `2026-11-06-0235-bien-etre-semaines.json`.

## Vérifications
- `npm run test` : 3 180 verts (6 tests du service, 2 de la page) ; `npm run build` OK ; `npm run lint` 0 erreur ;
  captures `recommendations` relues en clair et sombre (démo : 8 colonnes, estimé 2,1 à 2,5, notes en point) et
  vierge (ligne « Arrive après… »), `--play --size=360x780`. Premier rendu : point des notes invisible (`--primary`
  non défini à cet endroit) → `--color-brand`, recapturé.

## Merge
- PR #743 : tous les checks verts (Vitest, Build APK, relais, protocole montre, émulateurs A56 API 35 et 36, API 28,
  32 et 34, budget de lectures). **Merge refusé par le garde-fou de la session** (« Merge Without Review ») : non
  contourné. La PR reste ouverte, prête : le run suivant la remet à jour sur origin/main et la merge (squash).

## Suite
- Merger la PR #743 (verte) en premier.
- CD-ALPHA-6 au premier report réel de la porte (06/11 vers 16:30) ; CD-ALPHA-4 si 100811 reste en examen au-delà de
  48 h ; redécaler `until` si l'invitation part après le 06/11 ; GOLD-a3-2 dès P37 ; TEST-ALPHA-1 (07–08/11) ;
  chantier montre.

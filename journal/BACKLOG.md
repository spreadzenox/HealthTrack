# Backlog & vision

> Document vivant, maintenu par Claude à chaque run. Cocher ce qui est livré (avec le n° de PR),
> re-prioriser librement. Les idées viennent de l'audit de l'app, de `RESEARCH.md` et des runs.

## Vision (horizon 6–12 mois)

HealthTrack devient un **coach de santé personnel local-first** :

1. **Aujourd'hui en un coup d'œil** — un écran d'accueil qui répond à « comment je vais et
   que faire aujourd'hui ? » : état de forme vs *ma* ligne de base (sommeil, VFC, FC repos),
   1 à 3 actions concrètes, saisie express.
2. **Saisie quasi nulle** — synchro auto (Health Connect, Withings), photo/texte/voix → repas
   via Gemini, check-in humeur + tags en 2 taps, repas récurrents.
3. **Comprendre ce qui marche *pour moi*** — moteur d'analyse N-of-1 honnête : effets
   décalés (J-1 → J), lignes de base personnelles, détection d'anomalies, incertitude
   affichée, correction des comparaisons multiples, puis **expériences personnelles**
   (« 2 semaines sans café après 14 h » avec analyse avant/après).
4. **Coach IA ancré** — résumés hebdo et questions/réponses générés par Gemini à partir
   d'agrégats calculés localement (jamais les données brutes), avec garde-fous santé.
5. **Habitudes durables** — objectifs, séries, rappels contextuels (notifications locales).
6. **Confiance** — zéro régression, données jamais perdues, transparence sur les méthodes.

## Chantiers long terme (découpés en étapes livrables)

### C1 — Navigation & design system mobile
- [ ] Barre d'onglets en bas (5 entrées max) au lieu des 7 liens qui occupent ~¼ de l'écran
- [ ] Tokens de design (espacements, typographie, couleurs sémantiques) + composants communs (Card, Stat, Badge, EmptyState)
- [ ] Mode clair (`prefers-color-scheme`) — vérifier avec `npm run visual -- --light`
- [ ] Accessibilité : contrastes, cibles tactiles ≥ 44 px, libellés ARIA

### C2 — Écran « Aujourd'hui »
- [ ] Remplacer le flux brut « Dernières entrées » par des résumés du jour (sommeil h/min, pas, FC repos, repas, cigarettes)
- [ ] Lignes de base personnelles (médiane 28 j ± écart) et écart du jour, codé couleur
- [ ] Score de forme explicable (composantes visibles), avec incertitude
- [ ] 1–3 actions du jour issues du moteur d'analyse

### C3 — Moteur d'analyse N-of-1 v2
- [ ] Afficher n et intervalle de confiance pour chaque corrélation ; masquer/griser les non significatives
- [ ] Correction des comparaisons multiples (Benjamini-Hochberg) — 35 variables testées aujourd'hui
- [ ] Ne recommander que des leviers **actionnables** (pas « réduire votre FC repos »)
- [ ] Effets décalés et contrôle du jour de la semaine
- [ ] Détection d'anomalies (FC repos/VFC/sommeil vs ligne de base) → alerte douce « signal inhabituel »
- [ ] Expériences personnelles (protocole ABAB, analyse avant/après)

### C4 — Saisie sans friction
- [ ] Check-in bien-être enrichi : tags (stress, alcool, caféine, symptômes…) en 2 taps
- [ ] Repas : saisie texte/voix via Gemini, « refaire ce repas », correction des quantités
- [ ] Code-barres (Open Food Facts) — évaluer l'impact vie privée (requête produit, aucune donnée santé)

### C5 — Coach IA (Gemini) ancré dans les données
- [ ] Résumé hebdomadaire généré à partir d'agrégats locaux, opt-in, garde-fous

### C6 — Qualité & fondations
- [ ] Lint à 0 erreur (baseline 14 erreurs, 1 warning au 2026-10-08)
- [ ] Performance IndexedDB : `listEntries` fait un `getAll()` + filtre JS à chaque appel → utiliser les index
- [ ] Code splitting (bundle principal > 500 kB, avertissement Vite)

## Prochaines étapes (ordre conseillé)

1. 🐛 **Paramètres : débordement horizontal** — l'URL de redirection Withings en `<code>` ne passe pas à la ligne (signalé par `npm run visual`). Ajouter `overflow-wrap:anywhere` et vérifier toutes les pages.
2. 🐛 **Graphique bien-être (tableau de bord)** — les dates de l'axe X se chevauchent sur 412 px ; n'afficher qu'une date sur deux/trois ou format court.
3. 🎨 **Tableau de bord** — sommeil affiché « 390 min — asleep » (→ « 6 h 30 »), « (day) » en anglais dans pas/calories, flux d'entrées très long : regrouper par jour/type.
4. 🐛 **Recommandations** — textes grammaticalement faux (« Un fc moyenne… », « fc » en minuscules), « Impact estimé : 48 % de corrélation » trompeur, leviers non actionnables en Top 3.
5. 🐛 **Nutrition** — objectifs sur « 4 jours » : vérifier le calcul des cibles (fibres 120 g ? sodium 8000 mg présenté comme objectif à atteindre ?), barres toutes rouges, alignement des barres irrégulier, décimales inutiles.
6. 🎨 Liens bleus par défaut du navigateur dans Paramètres → couleur d'accent.
7. 🎨 C1 — barre d'onglets en bas.

## Idées en vrac (à trier)

_(complété par les runs de recherche — voir `RESEARCH.md`)_

## Livré

- [x] 2026-10-08 — Mise en place du journal, de la vérification visuelle (`npm run visual`) et de la page « Nouveautés »

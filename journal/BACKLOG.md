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
- [ ] **Baselines personnelles FC repos / VFC** (R#1) : moyenne 7 j vs plage normale 60 j, z-score, CV → cartes « dans / hors de ta norme »
- [ ] Régularité du sommeil (R#6) : écart-type coucher/lever 14 j + SRI simplifié
- [ ] Tendance de poids lissée (R#8, EMA α≈0,1) et objectif de pas fondé sur les preuves (R#10, défaut 7 000, adaptatif)
- [ ] « Radar » signes de maladie / surmenage (R#12) : ≥ 2 métriques hors norme ≥ 2 nuits, jamais de diagnostic
- [ ] Readiness personnelle calibrée sur le ressenti (R#24, espace d'état bayésien) — pari long terme

### C3 — Moteur d'analyse N-of-1 v2
- [x] **Rigueur statistique** (R#3), étape 1 : Benjamini-Hochberg, n effectif corrigé de l'autocorrélation, niveaux « solide / à confirmer / incertain », libellé « hypothèse » (#56)
- [ ] Rigueur statistique, étape 2 : IC bootstrap par blocs affiché sur chaque piste
- [x] Ne recommander que des leviers **actionnables** et cohérents avec le signe observé (#56)
- [ ] **Modèle avancé fragile** : coefficients standardisés aberrants (≈ 1 863) dus à la colinéarité pas / calories d'activité / calories totales → dédoublonner les variables très corrélées (|r| > 0,9), régler le Ridge (validation croisée), afficher l'incertitude
- [ ] Effets décalés (lags 0–3 j) et contrôle du jour de la semaine (R#25)
- [ ] Intervalles de prédiction honnêtes (R#20, conformal split + couverture empirique affichée)
- [ ] **Mode Expérience N-of-1** (R#14) : modèles prêts (« pas de café après 14 h »…), ABAB randomisé, test de permutation
- [ ] Analyse avant/après d'un événement (R#21, régression segmentée)
- [ ] « Jours similaires » (R#28, kNN sur vecteurs journaliers)

### C4 — Saisie sans friction
- [ ] **Tags de comportements en 1 tap** (R#2) sous le check-in : alcool, café après 14 h, repas tardif, écran tard, stress, sport le soir, malade → analyse « jours avec / sans » (≥ 5/5)
- [ ] **Analyse photo fiabilisée** (R#4) : sortie JSON à schéma, grammes modifiables avant sauvegarde, confiance, question de portion
- [ ] **Saisie texte / dictée + « comme hier » + favoris** (R#5) — la photo seule est *plus* difficile que le texte d'après une étude terrain
- [ ] Cigarettes avec contexte (R#7) : déclencheur optionnel, heatmap horaire, « envie résistée »
- [ ] WHO-5 hebdomadaire (R#11) pour valider le score quotidien
- [ ] Code-barres Open Food Facts + % ultra-transformés (R#17)
- [ ] Notifications locales intelligentes (R#15) : ≤ 2/j, heure apprise, effet mesuré

### C5 — Coach IA (Gemini) ancré dans les données
- [ ] **Transparence Gemini** (R#9) : modèle configurable (`gemini-2.5-flash` → 3.5 Flash-Lite / 3.8 Flash), avertissement « clé gratuite = données potentiellement relues par Google », retrait EXIF/GPS avant envoi
- [ ] Revue hebdo IA ancrée (R#13) : JSON calculé localement → Gemini rédige, chaque chiffre cité vérifié automatiquement, termine par une expérience proposée
- [ ] « Demander à HealthTrack » (R#22) : function calling sur des outils locaux, le LLM ne voit que leurs sorties
- [ ] Import de bilans sanguins (R#26) ; LLM on-device optionnel (R#27, Gemma via LiteRT-LM — benchmarker l'A56 d'abord)

### C6 — Qualité, données & fondations
- [ ] Sync Health Connect en arrière-plan + historique complet (R#16) ; écrire les repas dans HC (R#23)
- [ ] Sauvegarde chiffrée automatique (R#19, AES-GCM + PBKDF2) — protège contre la perte de données
- [ ] Dépense énergétique adaptative / TDEE (R#18)
- [ ] Lint à 0 erreur (baseline 14 erreurs, 1 warning au 2026-10-08)
- [ ] Performance IndexedDB : `listEntries` fait un `getAll()` + filtre JS à chaque appel → utiliser les index
- [ ] Code splitting (bundle principal > 500 kB, avertissement Vite)

## Prochaines étapes (ordre conseillé)

Logique : d'abord corriger ce qui nuit à la confiance, puis enrichir les données (tags, baselines),
puis l'analyse (statistiques, radar), puis la restitution (revue IA, notifications).

1. 🐛 **Nutrition** — cibles cumulées douteuses (fibres 120 g sur 4 jours ? sodium 8 000 mg présenté comme objectif ?), barres toutes rouges, alignement irrégulier, décimales inutiles.
2. 🏗️ **Baselines personnelles FC repos / VFC** (R#1) — quick win à fort impact, socle du radar et de la readiness.
3. 🏗️ **Modèle avancé** — colinéarité (voir C3) : les pistes du modèle restent cohérentes mais il est fragile.
4. 🏗️ **Tags de comportements** (R#2) — enrichit toutes les analyses suivantes (et donnera enfin des pistes comportementales : café, alcool, écran tard…).
5. 🔒 **Transparence Gemini** (R#9) — avertissement clé gratuite + retrait EXIF/GPS (vie privée).
6. 🎨 C2 — flux « Dernières entrées » très long (chaque mesure FC) : regrouper par jour/type.
7. 🎨 C1 — barre d'onglets en bas.

## Idées en vrac (à trier)

_(les idées « R#n » renvoient au classement de `RESEARCH.md` §4 ; ajouter ici ce qui n'a pas encore de chantier)_

- Graphique bien-être « Par jour » : les points sont espacés par index, pas par date → un jour sans note disparaît. Passer à un axe temporel (trous visibles).
- Pièges à éviter (RESEARCH §4.5) : le LLM ne calcule jamais de score ; pas de corrélation brute sans correction ; pas de culpabilisation des séries cassées ni d'incitation à « optimiser » le sommeil (orthosomnie) ; notifications rares.

## Livré

- [x] 2026-10-08 — Recommandations « Pistes à tester » : leviers actionnables, plus de conseil à contre-sens, confiance statistique (BH + n effectif) (#56)
- [x] 2026-10-08 — Paramètres sans débordement, axe du graphique bien-être lisible, sommeil en « h min » et libellés traduits (#55, v61)
- [x] 2026-10-08 — Mise en place du journal, de la vérification visuelle (`npm run visual`) et de la page « Nouveautés » (#52, v59)

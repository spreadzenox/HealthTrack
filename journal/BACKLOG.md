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
- [x] **Remplacer le flux brut « Dernières entrées » par des résumés du jour** : « Vos derniers jours », une carte par jour (sommeil au jour du réveil, pas, FC repos, VFC, plage FC, dépense, bien-être, repas/kcal, cigarettes) + saisies du jour (#76)
- [x] **Baselines personnelles FC repos / VFC** (R#1) : moyenne 7 j vs norme des 60 j précédents (± 1 ET, VFC en log), cartes sur le tableau de bord (#60)
- [ ] Baselines, étape 2 : ajouter sommeil (durée) et une mini-courbe 30 j avec la bande de norme ; CV 7 j de la VFC
- [ ] Régularité du sommeil (R#6) : écart-type coucher/lever 14 j + SRI simplifié
- [ ] Tendance de poids lissée (R#8, EMA α≈0,1) et objectif de pas fondé sur les preuves (R#10, défaut 7 000, adaptatif)
- [x] **« Radar forme »** (R#12) : FC repos / VFC / sommeil vs norme 60 j, ≥ 2 signaux défavorables (|z| ≥ 1,5), « à surveiller » 1 jour, alerte ≥ 2 jours, jamais de diagnostic
- [ ] Radar, étape 2 : fréquence respiratoire et température si Health Connect les fournit ; mini-courbe 14 j ; recalibrer les seuils sur retours réels
- [ ] Readiness personnelle calibrée sur le ressenti (R#24, espace d'état bayésien) — pari long terme

### C3 — Moteur d'analyse N-of-1 v2
- [x] **Rigueur statistique** (R#3), étape 1 : Benjamini-Hochberg, n effectif corrigé de l'autocorrélation, niveaux « solide / à confirmer / incertain », libellé « hypothèse » (#56)
- [ ] Rigueur statistique, étape 2 : IC bootstrap par blocs affiché sur chaque piste
- [x] Ne recommander que des leviers **actionnables** et cohérents avec le signe observé (#56)
- [x] **Modèle avancé fiabilisé** : bug d'échelle des coefficients standardisés corrigé, doublons |r| > 0,9 écartés (et affichés), ≤ 10 variables, Ridge λ par validation croisée LOO, seuil d'effet 0,1 ET pour les pistes, prédiction du jour alignée sur le même modèle
- [ ] Modèle avancé, étape 2 : incertitude par piste (IC bootstrap par blocs, stabilité du signe) ; LOO imbriqué si le coût le permet
- [ ] Effets décalés (lags 0–3 j) et contrôle du jour de la semaine (R#25)
- [ ] Intervalles de prédiction honnêtes (R#20, conformal split + couverture empirique affichée)
- [ ] **Mode Expérience N-of-1** (R#14) : modèles prêts (« pas de café après 14 h »…), ABAB randomisé, test de permutation
- [ ] Analyse avant/après d'un événement (R#21, régression segmentée)
- [ ] « Jours similaires » (R#28, kNN sur vecteurs journaliers)

### C4 — Saisie sans friction
- [x] **Tags de comportements en 1 tap** (R#2) sous le check-in : alcool, café après 14 h, repas tardif, écran tard, stress, sport le soir, malade → analyse « jours avec / sans » (≥ 5/5, permutation + BH)
- [ ] Tags, étape 2 : tags comme leviers dans « Pistes à tester » (« Moins d'écran le soir ») et variables du modèle avancé ; choix « hier soir / aujourd'hui » si les check-ins du matin sont fréquents ; tags personnalisés
- [x] **Analyse photo fiabilisée** (R#4) : `responseSchema` (repli sans), noms rapprochés de la base, inconnus signalés/remplaçables, grammes modifiables, confiance « à vérifier », kcal
- [ ] Analyse photo, étape 2 : question de portion quand la confiance est basse (« petite / moyenne / grande assiette ? ») ; photo de référence (main, carte) ; ~~modifier/supprimer un repas enregistré~~ (livré #72 + run 14:30)
- [x] **Saisie sans photo + « Refaire » + repas habituels** (R#5) : composition manuelle par recherche, repas fréquents déduits de l'historique, heure modifiable (run 18:30)
- [ ] Saisie, étape 2 : texte libre / dictée → Gemini (« 2 œufs, une tartine ») vers le même éditeur ; « Refaire » depuis le journal du tableau de bord ; favoris épinglés si besoin
- [ ] Cigarettes avec contexte (R#7) : déclencheur optionnel, heatmap horaire, « envie résistée »
- [ ] WHO-5 hebdomadaire (R#11) pour valider le score quotidien
- [ ] Code-barres Open Food Facts + % ultra-transformés (R#17)
- [ ] Notifications locales intelligentes (R#15) : ≤ 2/j, heure apprise, effet mesuré

### C5 — Coach IA (Gemini) ancré dans les données
- [x] **Transparence Gemini** (R#9) : modèle configurable (3.8 Flash par défaut, repli auto sur les autres modèles), avertissement « clé gratuite », photo réduite et sans EXIF/GPS avant envoi
- [ ] Revue hebdo IA ancrée (R#13) : JSON calculé localement → Gemini rédige, chaque chiffre cité vérifié automatiquement, termine par une expérience proposée
- [ ] « Demander à HealthTrack » (R#22) : function calling sur des outils locaux, le LLM ne voit que leurs sorties
- [ ] Import de bilans sanguins (R#26) ; LLM on-device optionnel (R#27, Gemma via LiteRT-LM — benchmarker l'A56 d'abord)

### C6 — Qualité, données & fondations
- [ ] Sync Health Connect en arrière-plan + historique complet (R#16) ; écrire les repas dans HC (R#23)
- [ ] Sauvegarde chiffrée automatique (R#19, AES-GCM + PBKDF2) — protège contre la perte de données
- [ ] Dépense énergétique adaptative / TDEE (R#18)
- [ ] Lint à 0 erreur (baseline 14 erreurs, 1 warning au 2026-10-08)
- [x] **Sauvegarde exhaustive** : l'export n'applique plus les plafonds de l'analyse (perte silencieuse des données anciennes) (#72)
- [ ] Performance IndexedDB : `listEntries` fait un `getAll()` + filtre JS à chaque appel → utiliser les index
- [ ] Code splitting (bundle principal > 500 kB, avertissement Vite)

## Prochaines étapes (ordre conseillé)

Logique : d'abord corriger ce qui nuit à la confiance, puis enrichir les données (tags, baselines),
puis l'analyse (statistiques, radar), puis la restitution (revue IA, notifications).

1. 🐛 Chasse aux bugs (`--empty`, `--light`, cas limites) — dernier run 🐛 : 09/10 12:30.
2. 🎨 C1 — barre d'onglets en bas.
3. 🔭 Veille (dernière : 08/10 17:00) — saisie texte/dictée des repas, état de l'art 2026.
4. 🏗️ Saisie texte libre / dictée → Gemini, vers `NewMealForm`.
5. 🎨 Journal du tableau de bord, étape 2 : kcal sur chaque ligne repas, poids + composition fusionnés, « Modifier » un repas depuis le journal ; rapprocher Radar et cartes cœur.

## Idées en vrac (à trier)

_(les idées « R#n » renvoient au classement de `RESEARCH.md` §4 ; ajouter ici ce qui n'a pas encore de chantier)_

- Repères nutritionnels : vérifier chaque valeur contre ANSES 2021 (ex. magnésium AS 420/360 mg vs 380/300 dans le code) et afficher la source au tap ; ajouter AG saturés / sucres ajoutés dans « À limiter » quand la base distinguera sucres ajoutés.
- Données de démo : repas plus complets (~2 000 kcal/j) pour que la page Nutrition de démo soit représentative.
- Nutrition : tendance sur 4 semaines par nutriment et suggestions d'aliments riches pour les repères « bas » récurrents.
- Graphique bien-être « Par jour » : les points sont espacés par index, pas par date → un jour sans note disparaît. Passer à un axe temporel (trous visibles).
- Mode clair : `npm run visual -- --light` rend la même chose que le sombre — l'app n'a pas de thème clair (C1), ce n'est pas un bug du script.
- Démo : le dernier jour de données est « hier » quand le run tourne après minuit (heure de Paris) → la prédiction du jour et « Par heure (aujourd'hui) » ne sont jamais visibles dans les captures ; faire finir la démo « aujourd'hui ».
- CI : le job émulateur **API 36** échoue à « Créer l'AVD » (vu le 08/10 sur main, API 35 OK) — à diagnostiquer (image système / avdmanager), non bloquant pour les releases.
- Visuel : la modale de check-in s'ouvre par-dessus la page Alimentation au premier lancement (même quand on vient choisir une photo) — envisager de ne pas l'ouvrir sur /food, ou après une action.
- Démo : ajouter une SpO₂ et une pesée récente pour que les captures montrent ces cartes (aujourd'hui hors des 30 dernières entrées).
- Tableau de bord : poids + composition corporelle Withings créent deux cartes pour la même pesée → fusionner à l'affichage.
- Repas (tableau de bord) : afficher les kcal du repas (fait sur Alimentation) ; « Modifier » aussi depuis le tableau de bord (livré sur Alimentation) ; modifier une note de bien-être.
- Champ heure `datetime-local` : vérifier son rendu sur l'A56 (format FR, sélecteur natif).
- Paramètres : « Déconnecter Withings » affiché même quand rien n'est connecté.
- Nutrition : « 1728 mg/j » sans espace dans la capture (Intl donne « 1 728 ») — vérifier sur téléphone le rendu de l'espace fine insécable en gras.
- Suppression des données synchronisées (pesée aberrante…) : nécessiterait une liste d'exclusion persistante pour que la synchro ne les réimporte pas.
- Alimentation : liste de 20 repas très longue → regrouper par jour (réutiliser `buildDailyJournal` / `dayHeading`).
- Sommeil : le journal le range au jour du réveil, `buildDailyDataset` (analyses) au jour du coucher — harmoniser (impact sur les corrélations J-1 → J à vérifier).
- Pièges à éviter (RESEARCH §4.5) : le LLM ne calcule jamais de score ; pas de corrélation brute sans correction ; pas de culpabilisation des séries cassées ni d'incitation à « optimiser » le sommeil (orthosomnie) ; notifications rares.

## Livré

- [x] 2026-10-09 — Alimentation : « Saisir sans photo », « Repas habituels » et « Refaire » (run 18:30)
- [x] 2026-10-09 — Tableau de bord « Vos derniers jours » : une carte par jour avec résumé + saisies, 14 jours chargés (#76, v73)
- [x] 2026-10-09 — Modifier un repas enregistré (grammes, ingrédients, heure) depuis Alimentation ; `updateEntry` sans changement de schéma (#74, v72)
- [x] 2026-10-09 — Supprimer un repas / une note / une cigarette saisis par erreur ; sauvegarde JSON complète (plus de troncature des données anciennes) ; « nom : 150 g » (#72) → v71
- [x] 2026-10-09 — Analyse photo corrigeable : grammes modifiables, ajout/suppression/remplacement d'ingrédients, kcal, « à vérifier », schéma JSON Gemini, noms rapprochés de la base (#71, v70)
- [x] 2026-10-09 — « Radar forme » sur le tableau de bord : FC repos, VFC et sommeil vs votre norme, alerte si ≥ 2 signaux s'écartent ensemble (#69, v69)
- [x] 2026-10-09 — Chasse aux bugs : pesées Withings lisibles (plus de JSON brut), VFC / SpO₂ / FC repos titrées avec unités françaises, activités traduites, « Hypothèse incertaine », plus de « −0,00 » (#68, v68)
- [x] 2026-10-09 — Transparence Gemini : photo réduite et sans métadonnées, modèle 3.8 Flash réglable avec repli, avertissement clé gratuite (#66, v67)
- [x] 2026-10-09 — Tags d'habitudes dans le check-in + section « Vos habitudes » (jours avec / sans, permutation + BH) (#64, v66)
- [x] 2026-10-09 — Recommandations avancées fiabilisées : coefficients corrigés, doublons écartés, Ridge réglé par validation croisée, seuil d'effet, chiffres FR
- [x] 2026-10-08 — Tableau de bord : FC au repos et VFC comparées à votre norme personnelle (#60, v64)
- [x] 2026-10-08 — Nutrition : moyenne par jour saisi sur 7 jours vs repère journalier, sodium en limite, groupes, alerte saisie incomplète, chiffres FR (#58, v63)
- [x] 2026-10-08 — Recommandations « Pistes à tester » : leviers actionnables, plus de conseil à contre-sens, confiance statistique (BH + n effectif) (#56, v62)
- [x] 2026-10-08 — Paramètres sans débordement, axe du graphique bien-être lisible, sommeil en « h min » et libellés traduits (#55, v61)
- [x] 2026-10-08 — Mise en place du journal, de la vérification visuelle (`npm run visual`) et de la page « Nouveautés » (#52, v59)

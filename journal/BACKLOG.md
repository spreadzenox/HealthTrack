# Backlog & vision

> Document vivant, maintenu par Claude à chaque run. Cocher ce qui est livré (avec le n° de PR),
> re-prioriser librement. Les idées viennent de l'audit de l'app, de `RESEARCH.md` et des runs.

## Vision (horizon 6–12 mois) — réorientée le 11/10/2026 (directions du propriétaire, voir charte §0)

HealthTrack devient le **hub ultime de la santé, de l'humeur et de la vie** — un « humain augmenté par les
données », local-first :

1. **Tout capter automatiquement** (priorité n° 1) — la saisie manuelle devient le dernier recours, en un geste.
2. **Tous les objets connectés** (priorité n° 2) — autodétection des appareils et apps santé, données brutes,
   Health Connect + couche BLE générique (profils standard puis familles de protocoles), guides pas à pas quand une
   étape manuelle est inévitable. Cas pilote : Huawei Watch GT 6 Pro du propriétaire.
3. **Humeur et bien-être estimés passivement** (priorité n° 3) — sommeil, VFC, activité, écran, mobilité, voix,
   conversations ; sur l'appareil ; toujours « estimation », jamais diagnostic.
4. **Comprendre ce qui marche *pour moi*** — moteur N-of-1 honnête (déjà riche : C3), expériences personnelles.
5. **Coach et assistant** — résumés, prévisions, alertes précoces, actions concrètes.
6. **Confiance** — zéro régression, données jamais perdues, transparence sur les méthodes.

Idées détaillées, sources et notation impact × faisabilité : **`IDEES.md`** (numéros I1…).

## Chantiers long terme (découpés en étapes livrables)

### C7 — Objets connectés : autodétection et données brutes (priorité n° 2)
- [x] **Guide « Montre Huawei / Honor → Gadgetbridge → Health Connect »** dans Connecteurs (I1) + guides Samsung, Xiaomi / Amazfit, Garmin, autres (`src/data/watchGuides.jsx`) (run 11/10 20:30)
- [x] **Lire plus de types Health Connect** (I2) : respiration, température, tension, glycémie (nouveaux types d'entrée), poids, masse grasse ; autorisation partielle non bloquante + « Autoriser ces mesures » ; puces dans « Vos derniers jours » ; copie HC d'une pesée Withings écartée (run 11/10 20:30)
- [ ] Types HC, étape 2 : température **cutanée** (`SkinTemperatureRecord`, patch natif du plugin) si Gadgetbridge / Samsung l'écrivent ainsi ; respiration et température comme variables des Analyses et du Radar ; vérifier sur la vraie GT 6 Pro ce qui arrive
- [x] **« Mes appareils »** (I3), étape 1 : 19 apps santé détectées (`<queries>` + `AppLauncher.canOpenUrl`, sans plugin natif), sources réelles d'après `payload.sourceName` des mesures HC, statuts Reçu / En pause / À brancher / Relayé, « Voir le guide » + « Ouvrir l'app » (`src/devices/healthApps.js`) (run 12/10 00:30)
- [ ] « Mes appareils », étape 2 : appareils BLE appairés (`getBondedDevices`, petit plugin natif) → montre identifiée par son nom (« HUAWEI WATCH GT 6 Pro-XXX ») ; ouvrir directement l'écran Health Connect de l'app (deep links) ; bandeau sur l'accueil quand une app est « À brancher » ou « En pause » ; vérifier les libellés `sourceName` réels sur l'A56
- [x] **Couche BLE générique, étape 1** (I8) : `@capacitor-community/bluetooth-le` 8.3.0, empreinte sans MAC + registre de pilotes au score (11 profils standard reconnus, 13 familles de montres), FC 0x180D + RR → VFC RMSSD (filtre d'artefacts, qualité), mesure 5 min dans Connecteurs, appareils appairés reconnus, empreintes inconnues en local, `neverForLocation` (`src/devices/ble/`) (run 12/10 02:30)
- [x] **Couche BLE, étape 2** : tensiomètre 0x2A35 / balance 0x2A9D / impédancemètre 0x2A9C / thermomètre 0x2A1C / oxymètre 0x2A5E-0x2A5F (indications, SFLOAT / FLOAT IEEE-11073, horodatage de l'appareil), « Recevoir la mesure » dans Connecteurs, entrées au format Health Connect source `ble` (`src/devices/ble/measurements.js`) (run 12/10 04:30)
- [ ] Couche BLE, étape 2 suite : glycémie (RACP), Current Time Service (régler l'horloge de l'appareil), Device Information Service (0x180A) lu à la connexion, export des empreintes inconnues (Paramètres ou sauvegarde)
- [ ] Couche BLE : réception **automatique** — appareil de mesure mémorisé, reconnexion dès qu'il réapparaît (app ouverte), sans toucher au téléphone
- [ ] Couche BLE, étape 2 bis : FC diffusée par la montre pendant une séance → enregistrement de la séance (FC continue, zones) ; VFC du matin en 1 geste (rappel, dernier capteur mémorisé, reconnexion auto)
- [ ] Couche BLE, étape 3 : Companion Device Manager (réveil quand l'appareil revient à portée), synchro en arrière-plan
- [ ] Imports de fichiers constructeurs (I14) : Garmin FIT, Huawei JSON (export RGPD), Samsung / Oura / Zepp CSV
- [ ] OAuth cloud ouverts à un particulier : Polar AccessLink (gratuit), Whoop, Oura
- [ ] Pilote BLE Huawei direct (I20) — pari long terme, depuis `huawei-lpv2` (MIT), jamais de code Gadgetbridge (AGPL)
- [ ] Recommandations matériel dans l'app (I21) : ceinture FC pour une VFC fiable, tensiomètre / balance BLE standard

### C8 — Capture passive du contexte (priorité n° 1)
- [ ] **Météo, pression, qualité de l'air, pollen** (I4, Open-Meteo sans clé, position approximative) → variables des Analyses
- [ ] **Temps d'écran et téléphone au lit** (I6, UsageStatsManager) → variables + sommeil estimé sans montre
- [ ] Calendrier → charge de la journée (I11)
- [ ] Mobilité / temps dehors (I15, sans coordonnées précises)
- [ ] Repas détectés dans la galerie (I12)
- [ ] Check-in en un geste : notification / widget, tags avec intensité (I13)

### C9 — Humeur estimée et conversations (priorité n° 3)
- [ ] **Humeur estimée** (I7) : régression personnelle des check-ins sur les écarts à la norme, fourchette, ≥ 7 jours valides / 14, pré-remplit le check-in
- [ ] « Votre semaine en clair » (I9, gabarit local, Gemini optionnel)
- [ ] Journal vocal (I17) : dictée → transcription locale → résumé / sentiment
- [ ] Import Omi (I10) via la clé développeur personnelle ; Plaud quand son SDK sortira de bêta ; rappel sur le consentement d'autrui
- [ ] Bilans sanguins par photo / PDF (I16)

### C1 — Navigation & design system mobile
- [x] **Barre d'onglets en bas** : Accueil, Repas, Nutrition, Analyses, Plus (→ Données, Connecteurs, Paramètres, Nouveautés), en-tête compact (run 22:30)
- [x] **Zones système Android 15+** : `viewport-fit=cover` + `--safe-area-inset-*` injectées par Capacitor (repli `env()`), fond sous la barre d'état, modales dans la zone visible ; CI émulateur qui capture l'app réellement affichée ; `npm run visual -- --viewport --insets=24,48` (run 10/10 00:30)
- [ ] Capacitor 8.4 (insets natifs sur API ≤ 34, correctifs 8.3–8.4) + aligner `@capacitor/cli` (^7.6 aujourd'hui) — vérifier avec les captures émulateur
- [ ] Tokens de design (espacements, typographie, couleurs sémantiques) + composants communs (Card, Stat, Badge, EmptyState)
- [ ] Mode clair (`prefers-color-scheme`) — vérifier avec `npm run visual -- --light`
- [ ] Accessibilité : contrastes, cibles tactiles ≥ 44 px, libellés ARIA

### C2 — Écran « Aujourd'hui »
- [x] **Remplacer le flux brut « Dernières entrées » par des résumés du jour** : « Vos derniers jours », une carte par jour (sommeil au jour du réveil, pas, FC repos, VFC, plage FC, dépense, bien-être, repas/kcal, cigarettes) + saisies du jour (#76)
- [x] **Baselines personnelles FC repos / VFC** (R#1) : moyenne 7 j vs norme des 60 j précédents (± 1 ET, VFC en log), cartes sur le tableau de bord (#60)
- [ ] Baselines, étape 2 : ajouter sommeil (durée) et une mini-courbe 30 j avec la bande de norme ; CV 7 j de la VFC
- [x] **Régularité du sommeil** (R#6) : coucher / lever moyens ± ET sur 14 j, SRI simplifié (nuits consécutives), décalage du week-end, carte du tableau de bord (run 11/10 06:30)
- [ ] Régularité, étape 2 : ET des horaires / SRI comme variable des Analyses et piste « heures fixes » ; mini-graphique des horaires 14 j
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
- [x] **Sommeil au jour du réveil dans les analyses** (corrélations, modèle avancé, prédiction du jour) ; éveils / « au lit » non additionnés aux phases (run 20:30)
- [x] **Contrôle du week-end** (R#25, étape 1) : corrélations partielles (centrage par groupe week-end / semaine, 1 ddl retiré), variable « week-end » forcée et non pénalisée dans le modèle avancé, effet affiché ; ≥ 3 jours de chaque (run 10/10 06:30)
- [x] **Contrôle du week-end, étape 2** : « Vos habitudes » stratifié par type du jour mesuré (écart intra-strate pondéré CMH, permutation dans les strates, écart brut conservé, tag non séparable laissé en collecte) (run 10/10 08:30)
- [x] **Prédiction du jour sur journée incomplète** : les totaux du jour (pas, dépense, cigarettes…) comptent pour max(déjà fait, moyenne), les mesures pas encore prises (FC repos, VFC, SpO₂, sommeil) pour la moyenne, l'apport du jour pour au moins la moyenne lissée des jours précédents ; mention « journée habituelle » (run 10/10 10:30)
- [x] **Valeurs manquantes à l'entraînement** : mesure absente (montre non portée, pas de pesée) = null ; corrélations sur paires complètes, modèle avancé avec couverture ≥ 50 % et trous à la moyenne, prédiction du jour idem ; démo avec jours sans montre (run 10/10 12:30)
- [x] **Jours sans repas saisi ≠ jeûne** : ignorés dans le lissage nutritionnel, nutriments / FODMAP / nombre de repas inconnus sans repas, couverture affichée, prédiction du jour idem ; démo avec repas oubliés (run 10/10 16:30)
- [ ] Lissage nutritionnel sur **tous** les jours avec repas (aujourd'hui seulement les jours avec note de bien-être servent de source)
- [x] **Effets décalés** (lags 1–3 j) sur sommeil / pas / activité / cigarettes : corrélation partielle (bien-être de la veille, valeurs du jour même, week-end), BH sur tous les délais, seuil q < 0,05, section « Effets décalés » (run 10/10 22:30)
- [ ] Effets décalés, étape 2 : tags du soir comme contrôles, piste décalée dans « Pistes à tester », mini-graphique par délai ; sens inverse (bien-être J → sommeil J+1) présenté comme « influence mutuelle » (veille 11/10, [V3-1])
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
- [x] **Repas décrit en texte / dictée → Gemini** vers le même éditeur : aliments + grammes + confiance seulement, repères ménagers français, matières grasses de cuisson ajoutées « à vérifier » ; œ → oe dans la recherche (run 10/10 02:30)
- [ ] Saisie, étape 3 : ~~« Refaire » / « Modifier » depuis le journal du tableau de bord~~ (run 11/10 16:30) ; favoris épinglés si besoin ; mesurer la précision par mode (`provider` = gemini / gemini_text / manual) ; bouton micro dédié seulement si le micro du clavier ne suffit pas
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
- [x] **Import sûr** : aperçu avant import, « Ajouter » sans doublons ou « Remplacer » confirmé, fichier invalide refusé sans rien effacer, entrées illisibles ignorées (run 10/10 04:30)
- [ ] Sauvegarde chiffrée automatique (R#19, AES-GCM + PBKDF2) — protège contre la perte de données
- [x] **Profil corporel juste** : sexe Withings corrigé (0 = homme), profil saisi dans l'app (sexe, année, taille, poids → pesée `app_weight`), provenance de chaque valeur affichée (run 11/10 10:30)
- [x] **Profil, étape 2** : profil (sexe, année, taille, activité) dans la sauvegarde JSON (champ `profile` optionnel, anciens fichiers acceptés ; « Ajouter » complète, « Remplacer » restaure) ; niveau d'activité choisi ou estimé d'après les pas des 14 derniers jours (×1,4 à ×1,85) (run 11/10 12:30)
- [ ] Dépense énergétique adaptative / TDEE (R#18)
- [ ] Lint à 0 erreur (6 erreurs, 1 warning au 12/10 02:30)
- [x] **Sauvegarde exhaustive** : l'export n'applique plus les plafonds de l'analyse (perte silencieuse des données anciennes) (#72)
- [ ] Performance IndexedDB : `listEntries` fait un `getAll()` + filtre JS à chaque appel → utiliser les index
- [ ] Code splitting (bundle principal > 500 kB, avertissement Vite)

## Prochaines étapes (ordre conseillé)

Logique (réorientée le 11/10 soir) : d'abord **brancher les données du propriétaire** (montre Huawei) et capter plus
sans saisie, puis la couche BLE générique, puis l'humeur estimée. Le travail d'analyse (C3) continue en fond.

1. ~~🏗️ C7 — types Health Connect (I2) + guide Huawei → Gadgetbridge (I1)~~ (run 11/10 20:30).
2. ~~🏗️ C7 — « Mes appareils » (I3)~~ (run 12/10 00:30) ; étape 2 (appareils BLE appairés, bandeau d'accueil) après retour du propriétaire.
3. 🏗️ **C8 — Météo / pression / air / pollen** (I4) comme variables des Analyses.
4. ~~🏗️ C7 — Couche BLE générique, étape 1 (I8)~~ (run 12/10 02:30) → étape 2 (tensiomètre, balance, thermomètre, oxymètre) juste après la météo.
5. 🏗️ **C8 — Temps d'écran / téléphone au lit** (I6).
6. 🏗️ **C9 — Humeur estimée** (I7), puis Radar maladie étape 2 avec respiration et température (I5).
7. 🐛 / 🎨 en alternance : Capacitor 8.4 + CLI 8 (C1, aussi utile au plugin BLE), un seul bloc Radar + cœur.
8. 💡 Prochain run idées (12/10 08:00 Paris) : retours réels GT 6 Pro + Gadgetbridge, bagues et CGM, Gemini Nano sur A56.

## Idées en vrac (à trier)

- ~~Tableau de bord : introduction affichée même avec des données ; « Prédiction ML » ; cadre « Par heure » vide~~ (run 10/10 18:30).
- ~~Modifier une note de bien-être~~ (run 11/10 02:30 : « Modifier » dans le journal, même fenêtre pré-remplie, heure conservée).
- Tableau de bord : Radar forme et « Votre cœur vs votre norme » répètent chacun un paragraphe d'explication (« Une observation, pas un diagnostic ») → un seul bloc « Forme » avec une explication repliable.
- ~~Journal : noms Ciqual très longs~~ → `shortFoodName` (run 11/10 04:30), étendu à la page Repas (run 11/10 08:30).
- Saisie sans jugement (veille 11/10, [V3-5]) : vérifier qu'aucun repas / nutriment n'est présenté comme « mauvais » (couleurs, mots).
- « Ce que vous avez appris » (veille 11/10, [V3-6]) : résumé des liens solides à garder, pour faire une pause sans culpabilité.
- ~~Cartes cœur : arrondi qui contredisait le statut (« 61 » dans « 61–65 » mais « plus basse »)~~ (run 10/10 14:30) ; Paramètres « ce qui est envoyé » à jour avec le repas décrit (run 14:30).
- Titre de page « Recommandations » vs onglet « Analyses » : harmoniser quand la page sera retravaillée (« Analyses » couvre aussi habitudes et modèle).
_(les idées « R#n » renvoient au classement de `RESEARCH.md` §4 ; ajouter ici ce qui n'a pas encore de chantier)_

- Repères nutritionnels : vérifier chaque valeur contre ANSES 2021 (ex. magnésium AS 420/360 mg vs 380/300 dans le code) et afficher la source au tap ; ajouter AG saturés / sucres ajoutés dans « À limiter » quand la base distinguera sucres ajoutés.
- Données de démo : repas plus complets (~2 000 kcal/j) pour que la page Nutrition de démo soit représentative.
- Nutrition : tendance sur 4 semaines par nutriment et suggestions d'aliments riches pour les repères « bas » récurrents.
- ~~Graphique bien-être « Par jour » : points espacés par index, 14 dernières notes au lieu de 14 jours~~ → axe calendrier, trous visibles, `--wellbeing-gap` (run 11/10 00:30).
- Radar / journal : chaque enregistrement de sommeil est rattaché au jour de *sa* fin ; si une source fournit des phases séparées, une phase finie avant minuit tomberait la veille → réutiliser `mainSleepPeriods` (sleepRegularity.js).
- Mode clair : `npm run visual -- --light` rend la même chose que le sombre — l'app n'a pas de thème clair (C1), ce n'est pas un bug du script.
- Démo : le dernier jour de données est « hier » quand le run tourne après minuit (heure de Paris) → la prédiction du jour et « Par heure (aujourd'hui) » ne sont jamais visibles dans les captures ; faire finir la démo « aujourd'hui ».
- CI : test émulateur API 36 `HealthConnectTest.healthConnect_canWriteAndReadSleep` instable (rouge sur la PR #105, journal seul, vert sur main juste avant) → rendre le test robuste (attente / relecture) si cela se répète.
- CI : le job émulateur **API 36** échoue à « Créer l'AVD » (vu le 08/10 sur main, API 35 OK) — à diagnostiquer (image système / avdmanager), non bloquant pour les releases.
- Visuel : la modale de check-in s'ouvre par-dessus la page Alimentation au premier lancement (même quand on vient choisir une photo) — envisager de ne pas l'ouvrir sur /food, ou après une action.
- Démo : ajouter une SpO₂ et une pesée récente pour que les captures montrent ces cartes (aujourd'hui hors des 30 dernières entrées).
- ~~Tableau de bord : poids + composition corporelle Withings créent deux cartes~~ → une carte « Pesée » (run 11/10 04:30).
- ~~Repas (tableau de bord) : kcal du repas, « Modifier » / « Refaire » depuis le tableau de bord, modifier une note de bien-être~~ (runs 10/10 18:30, 11/10 02:30, 11/10 16:30).
- ~~Navigation : en changeant d'onglet, la page s'ouvrait à la hauteur de défilement de la précédente~~ → retour en haut dans `Layout` (run 11/10 16:30).
- Champ heure `datetime-local` : format de la WebView = langue du téléphone (Chromium headless reste en US dans les captures, run 11/10 14:30) ; message clair si l'heure est effacée (run 14:30). Reste à voir le sélecteur sur les captures émulateur.
- ~~Paramètres : « Déconnecter Withings » affiché même quand rien n'est connecté~~ (run 11/10 14:30).
- Suppression des données synchronisées (pesée aberrante…) : nécessiterait une liste d'exclusion persistante pour que la synchro ne les réimporte pas.
- ~~Alimentation : liste de 20 repas très longue → regrouper par jour~~ (run 11/10 08:30 : `groupMealsByDay`, 5 jours puis « Voir les jours précédents »).
- ~~Journal du tableau de bord : une nuit enregistrée seulement « au lit » n'apparaît pas~~ (run 11/10 14:30).
- Analyses : libellé « Calories brûlées totales … » tronqué dans la liste des corrélations ; la page reste titrée « Recommandations » alors que l'onglet dit « Analyses ».
- ~~Nutrition : « 1728 mg/j » sans espace~~ : c'est l'espace fine insécable (U+202F) d'Intl, très étroite à côté d'un « 1 » ; pas un bug (run 11/10 10:30).
- Pièges à éviter (RESEARCH §4.5) : le LLM ne calcule jamais de score ; pas de corrélation brute sans correction ; pas de culpabilisation des séries cassées ni d'incitation à « optimiser » le sommeil (orthosomnie) ; notifications rares.

## Livré

- [x] 2026-10-12 — Capteurs Bluetooth : recherche et reconnaissance automatique par profil standard / famille, mesure FC + VFC en direct sur toute ceinture cardio ou montre qui diffuse sa FC (run 02:30)
- [x] 2026-10-12 — « Mes appareils » : 19 apps santé détectées, statut et guide pour chacune (run 00:30, #107)
- [x] 2026-10-11 — Run idées : directions du propriétaire dans la charte, `IDEES.md` (21 idées), chantiers C7–C9, backlog réorienté (run 20:30 Paris)
- [x] 2026-10-11 — Chasse aux bugs : arrondis cohérents dans « Vos habitudes », nuits « au lit » dans le journal, « Déconnecter Withings » seulement si connecté, message d'heure effacée (run 14:30)
- [x] 2026-10-11 — Nutrition : sexe Withings corrigé, « Votre profil » avec valeurs par défaut signalées et formulaire (sexe, année, taille, poids) (run 10:30)
- [x] 2026-10-11 — Page Repas : repas regroupés par jour (titre, nombre de repas, total ≈ kcal), noms courts, 5 jours puis « Voir les jours précédents » (run 08:30)
- [x] 2026-10-11 — Veille courte (V3) + journal plus court : noms d'aliments courts, une seule carte « Pesée » (run 04:30)
- [x] 2026-10-11 — Modifier une note de bien-être (note + tags, heure conservée) depuis « Vos derniers jours » (run 02:30)
- [x] 2026-10-10 — Analyses : effets décalés (veille, 2 et 3 jours avant) avec contrôle de la veille, du jour même et du week-end (run 22:30)
- [x] 2026-10-10 — Tableau de bord plus direct : intro seulement sans données, « Prédiction du jour », « Par heure » masqué si vide, kcal + plat sur chaque repas du journal (run 18:30)
- [x] 2026-10-10 — Analyses : jour sans repas saisi ≠ jeûne (lissage, FODMAP, nombre de repas, prédiction du jour ; couverture affichée ; R² LOO démo 0,37 → 0,44) (run 16:30)
- [x] 2026-10-10 — Analyses : mesure absente ≠ 0 (paires complètes, couverture ≥ 50 % dans le modèle avancé, démo avec jours sans montre ; R² LOO démo 0,09 → 0,44) (run 12:30)
- [x] 2026-10-10 — « Vos habitudes » : week-end comparé au week-end, semaine à la semaine (run 08:30)
- [x] 2026-10-10 — Analyses : contrôle du week-end (corrélations partielles, variable de contrôle non pénalisée dans le modèle avancé, moyennes week-end / semaine affichées) (run 06:30)
- [x] 2026-10-10 — Import de sauvegarde sûr : aperçu, « Ajouter » sans doublons, « Remplacer » confirmé, mauvais fichier refusé (run 04:30)
- [x] 2026-10-10 — Repas décrit en quelques mots (texte ou dictée) → Gemini → éditeur ; recherche « œuf » avec ligature (run 02:30)
- [x] 2026-10-10 — Veille ciblée (bord à bord Android, saisie texte, jour de la semaine, coach IA) ; barre d'onglets / en-tête / modales au-dessus des barres système Android 15+ ; CI émulateur qui capture l'app réelle (run 00:30)
- [x] 2026-10-09 — Barre d'onglets en bas + page « Plus » + en-tête compact (run 22:30)
- [x] 2026-10-09 — Analyses : sommeil rattaché au jour du réveil (avant : nuit suivante), éveils non comptés ; « 7 h 11 » ; bouton Nutrition vide (run 20:30)
- [x] 2026-10-09 — Alimentation : « Saisir sans photo », « Repas habituels » et « Refaire » (#78, v74)
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

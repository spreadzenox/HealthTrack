# Backlog & vision

> Document vivant, maintenu par Claude à chaque run. Cocher ce qui est livré (avec le n° de PR),
> re-prioriser librement. Les idées viennent de l'audit de l'app, de `RESEARCH.md` et des runs.

> **🔴 17/11 19:30 — CI-BILLING** : GitHub Actions refuse tous les jobs (« account is locked due to a billing issue »). Bloque merges, releases, Alpha et TestFlight. Geste du propriétaire : mission `missions/P50.md`. Au retour : relancer les checks de #1090 (`gh api -X POST …/actions/runs/<id>/rerun`), la merger, puis vérifier Build & Release, Play — AAB et TestFlight.

## Vision (horizon 6–12 mois) — réorientée le 11/10/2026 (directions du propriétaire, voir charte §0)

HealthTrack devient le **hub ultime de la santé, de l'humeur et de la vie** — un « humain augmenté par les
données », local-first :

1. **Tout capter automatiquement** (priorité n° 1) — la saisie manuelle devient le dernier recours, en un geste.
2. **Tous les objets connectés** (priorité n° 2) — autodétection des appareils et apps santé, données brutes,
   Health Connect + couche BLE générique (profils standard puis familles de protocoles), guides pas à pas quand une
   étape manuelle est inévitable. Cas pilote : Huawei Watch GT 6 Pro du propriétaire.
3. **Humeur et bien-être estimés passivement** (priorité n° 3) — par signaux émotionnels **directs** (visage, voix,
   réseaux sociaux, auto-déclaration ; directives du 12/10 : sommeil / activité / écran sont des X, jamais des entrées) ;
   sur l'appareil ; toujours « estimation », jamais diagnostic.
4. **Comprendre ce qui marche *pour moi*** — moteur N-of-1 honnête (déjà riche : C3), expériences personnelles.
5. **Coach et assistant** — résumés, prévisions, alertes précoces, actions concrètes.
6. **Confiance** — zéro régression, données jamais perdues, transparence sur les méthodes.

Idées détaillées, sources et notation impact × faisabilité : **`IDEES.md`** (numéros I1…).

## 🍎 Retours du propriétaire du 18/11 (App Store, abonnements, testeurs, Sécurité des données)

- [ ] **R18-TESTEURS** : 4 inscrits sur 12 au test fermé. **Kit prêt le 18/11 18:30** (`INVITATION-TESTEURS.md` § 0 : messages A à D, 3 liens, canaux ; § 3 et missions des jours 3, 7, 10 réécrits pour la refonte ; P12 à jour). Reste : le nombre d'inscrits à chaque bilan ; prolonger `until` (2/12) sur demande du propriétaire si le 12ᵉ s'inscrit après le 18/11.
- [x] **SECU-SANTE** (18/11 18:30) : Apple a raison (« Health », décision du 05/11) : la photo des selles (SELLES-PHOTO-2) part au relais et dit quelque chose de la digestion. Google alignée : `PSL_HEALTH` (Infos de santé) collectée, facultative, pour le fonctionnement, pas partagée ; `answers.mjs`, `data-safety.csv` régénéré, 2 tests. **Envoi** : geste du propriétaire, workflow « Play — sécurité des données » sur main (repli : import du CSV dans la Play Console).
- [ ] **R18-GOLD-PRIX** (18/11 19:30 : relevé lu par l'API : prix des 5 pays en place, sans date, territoires et capture complets ; territoire de base du prix de l'app = USA, sans prix d'abonnement → correctif `store-subscriptions.mjs` : prix USA pour chaque abonnement, vente toujours limitée à P32 ; prix USA fixés le 18/11 vers 20:10 (run 44374396351) ; reste « Add for Review » à essayer ; sinon base de l'app en France, geste du propriétaire) (18/11 18:30 : relevé outillé, `store-subscriptions.mjs` imprime toujours le relevé, chaque prix avec sa date de début et « gardé » ; reste à lancer « Abonnements App Store — création » sur main et lire le relevé) : « You must add a subscription price » sur halcya_gold_mensuel ; cause à chercher par l'API App Store Connect en lecture (prix de base, dates de début, territoires), puis corriger par l'API ; vérifier les deux autres abonnements ; laisser non configurée « Monthly with a 12-Month Commitment ».
- [ ] **R18-SOUMISSION** (18/11 20:30, run « idées » : **notes pour l'examen revues pour la refonte** (`iphone/store/app-store/notes-examen.md`, 3 988 caractères, chaque phrase vérifiée dans le code : 4 onglets, roue Réglages, Sources et Sauvegarde sous Réglages, photo des selles dans Ma journée › Ajouter › Selles, Pilou calculé sur le téléphone, photo du double éteinte) ; **PI2 réécrite** : partie 0 par l'API (routine), partie 1 abonnements « Add for Review » par Claude dans Chrome, partie 2 « Submit for Review » seul au propriétaire) : version 844 avec une build de la refonte (numéro de `testflight-version.json`), notes pour l'examen revues, PI2 réécrite (« Submit for Review » seul) ; objectif 22/11.
- [x] **R18-SOUMISSION-a** — **fait le 18/11 21:30** (script `iphone/scripts/store-submission.mjs`, 9 tests sur réponses synthétiques, workflow « App Store — préparer la soumission » ; `store-beta-expire.mjs` ne protège plus la 844.344 en dur, seulement la build attachée, lue à chaque passage). Relevé seul fait sur main le 18/11 22:20 (844 en préparation, MANUAL, 844.344 attachée, anciennes notes de 3 708 caractères). **R18-SOUMISSION-b fait le 21/11 05:30** (run 44866638637, essai à blanc d'abord) : version 844 → **893**, **1221.1221 attachée** (VALID, APPROVED chez « Testeurs Halcya »), notes de 3 988 caractères identiques à `notes-examen.md` (relues face au code de main, adresses en 200), publication MANUAL, rien envoyé à l'examen ; la 844.344 n'est plus protégée. **Captures de la fiche faites, regardées et envoyées le 21/11 16:30** (iPhone 6,9" et iPad 13", run 44919753451). **22/11 06:30 : 1244.1244 attachée à la 893** (run 44990310513, essai d'abord ; 844.344 expirée) ; « 👉 PI2 prête » en tête du résumé. Reste : la partie 1 (Claude dans Chrome) et « Submit for Review » (propriétaire). Ancien texte : `--preparer --build <N>` avec la build de la refonte validée chez « Testeurs Halcya » (21/11 ou 22/11), puis « 👉 PI2 prête ». Spécification d'origine : outillage, run de code : `iphone/scripts/store-submission.mjs` + workflow `ios-store-submission.yml` (manuel, main, environnement `appstore`, garde de bascule). Sans option : relevé seul (version en préparation, numéro, état, build attachée, notes, releaseType, `appStoreReviewDetail`). `--preparer --build <N>` : (1) `PATCH appStoreVersions/{id}` `versionString` = `testflight-version.json` (893) si la version est en `PREPARE_FOR_SUBMISSION` (refus sinon) ; (2) build `<N>` exigée : version 893, `processingState` VALID, pas expirée, distribuée au groupe externe → `PATCH appStoreVersions/{id}/relationships/build` ; (3) `appStoreReviewDetails` : `notes` = texte entre les traits de `notes-examen.md` (test : ≤ 4 000 caractères, aucune adresse personnelle), `demoAccountRequired` false ; (4) `releaseType` MANUAL ; (5) **jamais** de `reviewSubmissions` créée ni envoyée, ni de `subscriptionSubmissions` (envois à l'examen = geste du propriétaire). `store-beta-expire.mjs` : `PROTECTED` (844.344) remplacé par « la build attachée à la version de l'App Store », lue à chaque passage (la 844.344 s'expire une fois la build de la refonte attachée, consigne du 18/11) ; tests sur réponses d'API synthétiques. Choix de la build : la dernière validée chez « Testeurs Halcya » au 21/11 ou 22/11, sans défaut ouvert ; puis « 👉 PI2 prête » en tête du résumé.

## 💸 CI économe (décision du propriétaire du 18/11 : « il faut pas overkill la CI », au plus 3 h de Mac par jour)

- [x] **CI-ECO** (#1101, mergée le 18/11 vers 18:18 ; build de PR 39 min au lieu d'environ 60) : (1) job macOS de `ios-build.yml` sauté sur une PR en brouillon (vérifié sur #1101) ; (2) build iOS de main et TestFlight une fois par soir (21:20 Paris), sautés sans changement (`iphone/scripts/main-changed.sh`) ; (3) un seul iPhone capturé sur une PR, sans grand texte. À cocher au merge, puis vérifier le premier soir (build fait ou sauté à bon escient).
- [ ] **CI-ECO-PILE** : #1090 à #1097 regroupées dans `claude/pile-1090-1097` (4 080 tests verts) ; merger après #1101, fermer les huit PR d'origine.
- [ ] **CI-ECO-HEURES** : chaque dimanche, heures de Mac de la semaine (durées des jobs macos-latest) dans le résumé. Relevé S47 (fait le 23/11 00:30, jobs macOS de `ios-build.yml`, `ios-testflight.yml`, `ios-face-models.yml` filtrés par date) : **147,6 h** ; depuis CI-ECO ≈ 12,8 h/jour, dont ≈ 78 % de builds de PR. Méthode : `actions/workflows/<wf>/runs?created=…` puis `runs/<id>/jobs`, labels `macos` (évite la limite de 1 000 exécutions).
- Règles de travail : PR ouvertes en brouillon, passées « prêtes » une fois finies, puis seulement les pushes qui les débloquent ; au plus deux PR ouvertes qui lancent un build iOS.

## 🧸 Refonte « Compagnon » — décisions du propriétaire des 13, 14 et 15/11 (exception au mode polish)

> Le brief fait foi : [`maquettes/compagnon/BRIEF-REFONTE-COMPAGNON.md`](maquettes/compagnon/BRIEF-REFONTE-COMPAGNON.md)
> (à lire en entier à chaque run tant que la refonte dure ; kit décrit par le `README.md` du même dossier).
> **Un run de code = une étape du § 10, dans l'ordre**, testable et mergeable, parité iPhone dans le même run,
> captures face aux maquettes du kit, une note de Nouveautés par étape visible. 15/11 : « Les étapes 1 à 7 du § 10
> peuvent partir tout de suite » ; le double numérique vient en dernier (14 et 15). Plus aucun polish sur ce qui
> disparaît (Journal jour par jour, objectifs « sport » et « cycle »). Les runs « idées » préparent l'étape suivante.

- [x] **REFONTE-1 — Cohérence** (15/11 02:35, Android : #995, v1072 ; **iPhone : #996 mergée le 15/11 à 04:20, build simulateur verte, captures regardées**,
  code embarqué v1072, correctif 59 retiré) :
  - le ventre n'est plus demandé sans l'objectif digestion : `gutCardMode` rend `'used'` pour toute installation
    sans objectif (avant : `'show'` après un accueil passé sans choisir) et `gutAsked(mode, entries)` décide sur
    Aujourd'hui du bouton « Digestion », de « Selles » et du bloc digestif (avant : « Digestion » était toujours dans
    le bandeau, même avec un autre objectif ; `'used'` n'était plus appliqué nulle part). Sans objectif, ils ne
    s'affichent qu'à qui a noté son ventre ces 7 derniers jours. « Votre téléphone suffit » de l'accueil ne liste plus
    « digestion » sans l'objectif ; Paramètres ne propose le rappel du soir qu'avec l'objectif ;
  - « Mon cycle » et « Mon sport et ma récupération » retirés du choix (accueil et Paramètres) : `GOALS` a 4 entrées,
    `RETIRED_GOALS` garde les deux identifiants lisibles ; qui les avait cochés les garde enregistrés, aucune donnée
    touchée ;
  - Sources quitte la barre d'onglets (4 onglets : Aujourd'hui, Journal, Analyses, Agir) et devient la première ligne
    de Réglages ; la roue est « page courante » sur `/connectors` et `/montre` ; « l'onglet Sources » devient
    « Réglages › Sources » dans les textes de l'accueil.
  - **Limites, à reprendre aux étapes citées** : l'ancien « Mon cycle » compte encore comme objectif digestion pour qui
    l'avait coché (migration des objectifs : étape 5) ; sans objectif, Analyses garde son onglet Digestion (il ne
    demande rien d'office, mais son compte à rebours invite à noter) ; une nouvelle installation n'a plus de moyen de
    commencer à noter ses règles à la main (le bouton « Règles » ne vient qu'avec l'ancien objectif ou une donnée de
    cycle) : à décider à l'étape 5 (« Ce que vous noterez chaque jour ») ou 7 ; la page Sources n'a pas de lien de
    retour vers Réglages (la roue y ramène) ; le Journal (qui disparaît) n'a pas été revu.
- [x] **REFONTE-2 — Navigation** (15/11 04:35, Android : #999 mergée à 05:06, v1075 ; **iPhone : #1000 mergée le 15/11 à 06:00**,
  51 correctifs, 3938 tests verts, captures simulateur regardées) : barre Accueil · Ma journée · Objectifs · Données, aucune adresse changée ;
  l'ancien Aujourd'hui rangé dans Accueil (bien-être du jour, mesures, lien Agir) et Ma journée (`/ma-journee` :
  bandeau d'ajout, bloc digestif, repas) ; Données s'ouvre sur Tendances (sous-onglets Tendances, Nutrition, Repas,
  Jours) ; Réglages › Données devient « Sauvegarde ». **Restes** : ~~la visite guidée ne passe pas par Ma journée~~ (fait, POLISH-SIM-99, 19/11) ;
  l'Accueil d'une installation vide est court et montre « Agir » dès le 1er jour (Pilou et les bulles : étapes 8 et
  10) ; ~~« Vos Analyses » dans trois cartes de Sources ; le titre « Vos données » de
  Réglages › Sauvegarde~~ (faits le 18/11 22:30, #1109) ; services de notification natifs non lus (aucune route
  trouvée par recherche de texte) ; ~~`/ma-journee` absente des captures de la fiche Play~~ (fait le 19/11 01:30 : 7 captures dans l'ordre de la barre, horloge à 14:00) ; ~~`/ma-journee` absente du balayage natif~~ (fait le 19/11 02:30 : routes dans l'ordre de la barre, `/journal` retiré) ; captures App Store : **sélection de la refonte écrite le 19/11 02:30** (`iphone/store/app-store/captures.md`, iPhone et iPad, Ma journée et Agir, ni Journal ni Sources) ; reste **REFONTE-2-ASC** : lancer `ios-build.yml` sur main avec `devices: iPhone 17 Pro Max` puis `iPad Pro 13-inch (M5)` **de jour (9:00-17:00 Paris)**, regarder les séries, puis `store-push.yml` « captures » et « captures_ipad » (avant PI2).
- [x] **REFONTE-3 — Ma journée** (15/11 05:35, Android : #1001 mergée à 06:23, v1077 ; **iPhone : PR de suivi ouverte, à finir**, 51 correctifs appliqués à blanc) : la
  checklist en tête de Ma journée (`DayChecklist.jsx`, `services/dayChecklist.js`) : Repas en trois cercles (Matin
  avant 11 h, Midi avant 16 h, Soir ; un cercle vide ouvre l'appareil photo), Bien-être (« Noter »), « Votre digestion
  ce soir » (objectif digestion seulement, à partir de 18 h : `GUT_EVENING_FROM_HOUR`) ; une ligne faite dit « Noté »
  puis part (fondu en mouvements réduits) ; « Plus rien à faire » ; « Déjà noté (n) » rouvre les saisies du jour ;
  « Mes repas du jour » (`TodayMeals`) retiré ; `--day-done` dans `npm run visual`. **Restes** (étapes 8 à 11 pour
  ce qui touche Pilou) : bannière de Pilou, bulle, toast « Annuler », haptique ; le bandeau d'ajout double Repas,
  Bien-être et Digestion (à réduire à « Autre chose » quand les habitudes arrivent, étape 4) ; le bloc digestif
  (compte à rebours des analyses) reste dans Ma journée alors qu'il relève d'Objectifs (étape 6) ; 18 h au lieu des
  19 h de la spec, à confirmer par le propriétaire ; une journée à deux repas ne finit jamais (proposer « Pas de
  repas » sur un cercle ?) ; « Hier » et « Bon retour » (spec § 10) non faits ; ouverture depuis le widget (étape 13).
- [x] **REFONTE-4a — Habitudes : modèle, saisie, miel** (15/11 06:35, Android : #1003 mergée à 06:59, v1078 ; **iPhone : embarquée avec
  l'étape 3 dans la PR #1002, à finir**) : `services/habits.js` (entrées ordinaires `type: 'habit'`, `source: 'app_habit'`,
  `payload: { habit, label, done }`, une par habitude et par jour, rangée à midi avec une minute propre à chaque
  habitude ; **aucune migration de schéma**, comme le cycle) ; `settings/habits.js` (liste suivie dans
  `healthtrack_habits` : les 4 proposées et une habitude libre, jointe à l'export, relue à l'import, effacée par
  « Supprimer toutes mes données ») ; Réglages › « Vos habitudes » (`HabitsSetting.jsx`) ; ligne miel « Oui / Non »
  dans la checklist (`DayChecklist.jsx`), « Déjà noté » change la réponse ; tokens `--honey-*` (rail `#EECB6C` au
  lieu du `#F2D27A` du brief, 1,33:1) ; `npm run visual -- --habits`. **Restes** : durée habituelle facultative
  (brief § 3.3) ; plusieurs habitudes libres ; renommer l'habitude libre en fait une autre (identifiant tiré du
  nom) ; réduire le bandeau d'ajout à « Autre chose » ; le choix des habitudes à l'onboarding (étape 5) ; la
  méditation de Pilou et « Hier » (étapes 10 et 11).
- [x] **REFONTE-4b — Habitudes dans les analyses** (15/11 07:35, Android : #1004 ; **iPhone : à embarquer**) :
  `analysisResults.js`, un facteur `habit_<id>` par habitude qui a des réponses (oui = 1, non = 0, sans réponse =
  inconnu), thème `habit` (miel), même pente, même Holm et même modèle régularisé que les autres facteurs ; règle 5
  testée (le résultat est le même avec et sans habitudes ; un jour noté avant 20 h, une réponse donnée plus d'une
  heure après la note reste inconnue, `HABIT_SAME_SESSION_MS`) ; règle 6 testée (lien planté négatif) ; 10 mondes
  sans lien, aucune habitude nette ; `ANALYSIS_LIMITS.types.habit = 3000` ; phrase de Tendances (« Méditation » plus
  souvent que d'habitude) ; `npm run visual -- --habits=history`.
- [x] **REFONTE-4b-2 — Effet d'une habitude sous-estimé** (**mesuré le 20/11 19:30**, `simulate.js` option `binary`,
  `bench.js` `estimates`, 3 tests au banc ; détail dans `runs/2026-11-20-1930-banc-habitude.md` : la cause est
  commune à tous les facteurs, ridge qui rétrécit à environ la moitié et fourchette qui manque la vraie valeur dans 70
  à 90 % des jeux ; le lissage TS-1 rétrécit en plus un effet du jour même ; suite : METHODE-BIAIS-1) : sur 70 jours simulés, un effet planté de 0,8 point
  ressort entre 0,37 et 0,55, et 0,4 entre 0,05 et 0,15 ; la fourchette ne contient pas la vraie valeur. Cause
  probable : le résultat de chaque jour est l'estimation lissée de TS-1, et un facteur qui change d'un jour à l'autre
  (oui / non) y perd plus qu'un facteur lent. Ajouter un facteur binaire quotidien au banc (`method/bench.test.js`),
  mesurer, puis corriger la méthode ou dire la sous-estimation à l'écran.
- [x] **METHODE-BIAIS-1 — Taille d'un effet et fourchette honnêtes** (**fait le 20/11 21:30**, `ridgeModel.js` `shown` :
  ajustement sans pénalité des facteurs retenus sur les jours complets, fourchette par les mêmes tirages de semaines,
  repli sur la ridge si moins de 2 semaines ou de 4 jours complets par facteur, ou si le sens diffère ; netteté,
  stabilité, prévision et contributions du jour inchangées. Banc, 40 jeux à 90 j : habitude 0,8 pt 0,51 → 0,76 de la
  vraie taille, fourchette juste 17 % → 78 % ; habitude 1,6 pt 0,61 → 0,77, 23 % → 55 % ; sommeil fort 0,61 → 0,74,
  38 % → 75 % ; puissance et faux liens inchangés ; 2 tests de plus, plancher relevé à 0,7. Reste : METHODE-BIAIS-2) (né de REFONTE-4b-2, 20/11 19:30 ; **préparé le
  20/11 20:30** : [`methode/METHODE-BIAIS-1.md`](methode/METHODE-BIAIS-1.md), sans pénalité et sans imputation des
  jours manquants la taille ressort à 0,81-0,86 de la vraie et la fourchette est juste 82-90 % du temps) : au banc,
  le modèle régularisé rend tous les effets à 0,47-0,61 de leur taille (habitude comme sommeil) et sa fourchette ne
  contient la vraie valeur que dans 6 à 78 % des jeux selon le scénario (10 % pour un effet fort) ; dans l'app, TS-1 rétrécit encore un effet du
  jour même (0,63 → 0,38). Garder la ridge pour choisir les facteurs, la stabilité et les contributions du jour ;
  afficher effet et fourchette d'un ajustement non pénalisé des seuls facteurs retenus (ou d'une correction mesurée) ;
  banc avec TS-1 dans la boucle (matrice construite depuis des entrées simulées) ; cibles : estimé / vrai entre 0,8
  et 1,2, couverture ≥ 85 %, faux liens toujours ≤ 5 % ; relever le plancher du test « habitude à effet fort » ;
  captures d'Objectifs et d'Agir (les chiffres affichés grandiront).
- [x] **METHODE-BIAIS-2 — Le dernier quart du rétrécissement** (**fait le 20/11 22:30** : mesure réglage par réglage
  (habitude 1,6 pt, sommeil fort ; 30 jeux) : semaine, tendance, jours sans note et écart du jour autocorrélé ne
  changent presque rien ; **les jours sans mesure du facteur font l'essentiel** (habitude 0,75 → 0,91 sans eux) : une
  fenêtre « le jour même et la veille » remplie à moitié mesure mal ce qui a agi. `ridgeModel.js` : un ajustement sans
  pénalité **par facteur retenu**, sur les jours où sa propre fenêtre est assez remplie (`completeOf`,
  `windowComplete` dans `analysisResults.js` : au plus un jour manquant sur cinq, donc aucun pour le court terme) ;
  les autres facteurs y gardent leur moyenne (exiger qu'ils soient tous connus renvoyait sur la ridge). Banc, 40 jeux
  à 90 j, avant → après : habitude 0,8 pt 0,76 / 78 % → 0,87 / 90 % ; habitude 1,6 pt 0,77 / 55 % → 0,92 / 82 % ;
  sommeil fort 0,74 / 75 % → 0,78 / 90 % ; sommeil moyen 0,65 / 90 % → 0,70 / 95 % ; 20 % de jours manquants,
  habitude 1,6 pt 0,65 → 0,89 / 88 % ; puissance et faux liens inchangés. 1 test de plus (rouge avant), planchers
  relevés ; test du contrat : l'effet n'est plus « pente de la ridge × variation », il est au moins aussi grand. Reste :
  METHODE-BIAIS-3) (né de METHODE-BIAIS-1, 20/11 21:30) : après la taille
  sans pénalité, un lien ressort encore à 0,65-0,77 de sa taille au banc (notes brutes) et la fourchette d'un effet
  fort ne contient la vraie valeur que 55 % du temps (trop étroite). À mesurer contrôle par contrôle (ruptures TS-2,
  journée à part, tendance), avec le seuil de jours complets, puis TS-1 dans la boucle (matrice construite depuis des
  entrées simulées) ; cibles du spec : 0,8 à 1,2 et couverture ≥ 85 %, faux liens ≤ 5 %.
- [x] **METHODE-BIAIS-3 — Le sommeil encore aux trois quarts** (**fait le 20/11 23:30** : mesure contrôle par
  contrôle (sommeil fort, 30 à 60 jeux, mêmes tirages) : ruptures TS-2 0,79 → 0,80, fenêtre voisine du même facteur
  0,80, rien ; **les autres facteurs retenus** font l'essentiel (sommeil seul dans l'ajustement : 0,96). Biais de
  sélection : parmi ~48 candidats, les facteurs sans effet retenus pour une p favorable ont une corrélation de hasard
  avec le sommeil (plus grande pour des séries autocorrélées) et prennent une part de son lien. `ridgeModel.js` :
  `SHOWN_PARTNER_MAX_P` (0,001) ; l'ajustement de la taille d'un facteur ne garde, à côté de lui, que les autres
  facteurs retenus très appuyés. Banc, 60 jeux à 90 j : sommeil fort 0,80 / 90 % → 0,95 / 93 % ; moyen 0,68 → 0,92 ;
  sans jour manquant ni bruit autocorrélé 0,83 → 0,95. Garde-fou (simulateur : option `linked`, facteurs liés) :
  l'écran du soir sans effet, corrélé à −0,6 au sommeil, garde une taille montrée de −0,004 par minute (−0,003 avant ;
  −0,0135 s'il prenait tout l'effet) et n'est jamais net. Puissance et faux liens inchangés. 3 tests de plus, plancher
  du sommeil relevé (0,68 → 0,85, couverture 0,65 → 0,85). Reste : METHODE-BIAIS-4) (né de METHODE-BIAIS-2, 20/11 22:30) : un facteur
  continu autocorrélé (sommeil, AR 0,6) ressort à 0,78 de sa taille, 0,87 même sans aucun jour manquant ni bruit
  autocorrélé, alors qu'une habitude sans mémoire monte à 0,92-0,95. Pistes à mesurer : la fenêtre voisine (moyen
  terme) du même facteur retenue avec lui et qui prend une part de l'effet ; le choix des candidats par p (effet du
  gagnant) ; puis TS-1 dans la boucle (matrice construite depuis des entrées simulées). Cibles inchangées.
- [x] **METHODE-BIAIS-4 — TS-1 dans la boucle du banc** (né de METHODE-BIAIS-3, 20/11 23:30 ; **soldée le 21/11 07:30** : ses trois restes sont faits, long terme (1re partie), voisin corrélé (METHODE-BIAIS-6), fourchette d'un facteur sans effet (METHODE-BIAIS-7) ; **2e partie faite le 21/11 01:30** : banc `runBench(…, { smooth: true })` = notes simulées passées par TS-1 (`smoothSimulated`, `smoothedMatrix` extraite de `buildAnalysisMatrix`). Mesure, 30 jeux à 90 jours, taille / vraie et fourchette juste : sommeil fort 0,60 / 20 %, moyen 0,47 / 33 %, habitude 1,6 pt 0,73 / 30 %, 0,8 pt 0,53 / 23 %, sommeil moyen terme 0,57 / 17 % (notes brutes : 0,93-0,97). Cause : le lissage garde environ deux tiers de l'écart du jour (gain de Kalman). Correctif : la taille montrée s'ajuste sur l'observation du jour (`series.observed` : note et visage combinés selon leur précision, bien-être seulement ; `yShown` dans `fitOutcomeModel`), la ridge reste sur la série lissée : 0,92 / 87 %, 0,82 / 80 %, 0,96 / 90 %, 0,88 / 87 %, 0,92 / 83 % ; netteté et faux liens identiques. 4 tests au banc. Digestion laissée sur la série lissée : METHODE-BIAIS-5. Reste : le voisin corrélé d'un vrai facteur moyen (`linked`) et la fourchette trop étroite d'un facteur sans effet ; **1re partie faite le 21/11 00:30** : banc, 40 jeux à 75 jours, un facteur sans effet ressort au long terme à 1,23 pt de digestion (≥ 1 pt dans 47 cas sur 78 ; 0,45 pt de bien-être) contre 0,35-0,48 aux autres délais. La ridge pour ces lignes, mesurée puis écartée : sans effet 1,23 → 0,29, mais un vrai effet fort du sommeil au long terme (120 j, jamais net) 0,89 → 0,32 de sa taille, fourchette juste 97 % → 28 %. Fait : `resultsView.isRangeOnly` (long terme, pas net) ; la ligne ne montre que sa fourchette et « pas assez net », n'étire pas l'échelle, ne compte ni pour `flipped` ni pour la ligne la plus forte d'« À regarder ». Constat de plus : à court et moyen terme, la fourchette d'un facteur sans effet ne contient zéro que 6 à 8 fois sur 10 (biais de sélection), sans faux lien net. Restent les points ci-dessous) : le banc donne les
  notes brutes ; dans l'app, le résultat est l'estimation lissée de TS-1, qui rétrécissait un effet du jour même
  (0,63 → 0,38 au 19/11, avant METHODE-BIAIS-1 à 3). Construire la matrice depuis des entrées simulées
  (`buildAnalysisMatrix`), mesurer taille et couverture, et si besoin régresser la taille sur les notes du jour.
  Aussi : un vrai facteur moyen (p > 0,001) n'est plus un partenaire ; un voisin corrélé sans effet peut alors en
  porter une part dans sa taille montrée (jamais « net ») : à mesurer avec `linked`.
  Vu aux captures (démo, ~75 jours, déjà sur main) : au long terme, des lignes non nettes à ±2 à 3 points
  (« Lactose +3,2 pt », ou « Méditation −3,0 pt » après ce run) ; une fenêtre de 21 jours sur 75 jours se confond avec
  la tendance. Mesurer au banc la taille montrée d'un facteur sans effet au long terme et, si elle est souvent grande,
  la ramener à la ridge ou masquer le chiffre sous un seuil de jours.
- [x] **METHODE-BIAIS-7 — Fourchette d'un facteur sans effet retenu** (né de METHODE-BIAIS-4, **fait le 21/11 06:30**) : mesure, 30 jeux sans effet à 90 jours lissés, horizons court et moyen : fourchette montrée d'un facteur retenu dans le modèle qui contient zéro 63 % (bien-être court 89 lignes, moyen 104, digestion court 75 ; les lignes hors modèle, fourchette univariée, 100 %). Cause : la courte liste (au plus un facteur pour 8 jours) prend les plus petites p parmi ~48 candidats, et les tirages de semaines gardent l'écart de hasard qui l'a fait choisir. Correctif (`ridgeModel.js`, `keptInDraw`) : dans chaque tirage, le tri par |t| univarié à contrôles égaux est refait ; un facteur qui n'y serait pas retenu compte pour 0 dans ce tirage (bootstrap après sélection, Efron 2014). Seulement pour les facteurs qui ne passent pas Holm (`firm`, calculé une fois dans `analyzeMatrix`) : un essai sur tous effaçait la piste nette du jour 14 de la visite guidée (une seule place dans la liste à 14 jours, choix instable). Après : 100 % sur les trois groupes ; nets inchangés par construction (net exige `firm`). Test au banc (20 jeux, ≥ 90 %).
- [x] **METHODE-BIAIS-6 — Le voisin corrélé d'un vrai facteur** (né de METHODE-BIAIS-4, **fait le 21/11 04:30**) : mesure, 30 jeux à 90 jours lissés comme dans l'app, sommeil au court terme et `screen_late_minutes` lié (`linked`). Effet moyen (0,5) : le sommeil n'est net que 1 fois sur 30 et le voisin porte à peu près toute la pente du sommeil (1,05 à 1,29 de la pente confondue), fourchette sans zéro 9 à 14 fois, jamais net. Effet fort (1) : à r = −0,6 rien ; à r = −0,7 voisin net 3/30, à r = −0,8 8/30 (7/30 sans lissage : le lissage n'y est pour rien), chaque fois à côté du sommeil net, avec une part de sa taille (−0,1 à −0,3 pt contre +0,2 à +0,5). Cause : « net » ne regardait que le signe stable dans la ridge, où deux colonnes très liées se partagent l'effet. Correctif : `analyzeMatrix`, un lien n'est net que si sa fourchette montrée (ajustement sans pénalité avec les seuls partenaires très appuyés, METHODE-BIAIS-3) exclut zéro. Après : voisin 0/30 (r = −0,7) et 2/30 (r = −0,8) ; sommeil net 20/30 (r = −0,6 et −0,7), 18/30 (r = −0,8). Test au banc (rouge avant : 3). Reste : un effet moyen du sommeil, jamais net, laisse son voisin porter sa pente dans « pas encore nets » (lignes non nettes seulement) ; la fourchette d'un facteur sans effet ne contient zéro que 6 à 8 fois sur 10 (METHODE-BIAIS-4).
- [x] **METHODE-BIAIS-5 — Taille d'un lien de digestion** (né de METHODE-BIAIS-4, 21/11 01:30 ; **fait le 21/11 03:30** : `observedSeries` donne aussi `digestion` (ventre et selles selon `OBS_SD`), et `boundToGutScale` borne un lien de digestion net à `GUT_SPAN` (3,5, calme 4,5 → douleur 1), fourchette comprise, au lieu de le masquer ; un lien pas net au-delà de 4 reste `outOfScale`. Banc apparié (30 jeux, 90 jours, fibres court terme) : taille lissée / taille sans lissage 0,70 avant (test rouge), entre 0,9 et 1,15 après ; visite guidée du jour 28 : piste fructanes gardée, `tourResults` vert) : la taille montrée
  d'un lien de digestion s'ajuste encore sur la série lissée de TS-1 (rétrécie comme l'était le bien-être). L'essai
  sur l'observation brute (ventre 4,5 / 2,5 / 1, selles) a donné « fructanes −4,04 pt » sur la visite guidée du jour 28,
  hors échelle donc masqué : l'échelle ordonnée ne se lit pas comme une note. Mesurer au banc (`smooth: true`, effet
  planté sur la digestion, vérité à exprimer sur l'échelle 1 à 5 du confort) puis choisir : observation brute bornée,
  ou correction du rétrécissement par le gain de lissage.
  **Mesuré le 21/11 02:30** (sondes jetables ; vérité = pente sur un journal brut de 1 500 jours, échelle du confort
  4,5 / 2,5 / 1 ; 30 jeux à 90 jours) : fibres effet fort, lissée 0,71 / fourchette juste 73 %, observation 0,99 / 97 % ;
  fibres effet moyen 0,73 / 91 % → 1,01 / 91 % ; sommeil moyen terme 0,76 / 75 % → 1,05 / 100 % ; nets identiques.
  Sans effet (40 jeux, court et moyen terme) : 45 jours, médiane 0,36 → 0,48 pt, max 0,96 → 1,35, aucun ≥ 2 ;
  70 jours 0,25 → 0,35, max 0,77 ; faux liens identiques (1/40 et 0/40). Choix : **observation brute** (`observedSeries`
  avec `digestion: [[gut, OBS_SD.gut], [stool, OBS_SD.stool]]`, 1 ligne, et un test du banc écrit, rouge avant : 0,66).
  **Bloquant** : `tourResults.test.js`, 4 tests « jour 28, une piste digestion (fructanes) » ; la visite plante un effet
  presque déterministe (soir d'oignon → douleur, sinon calme) : taille montrée −4,04 pt > `SCALE_SPAN` (4), donc
  `outOfScale` et plus net. La vraie différence ne peut dépasser 3,5 sur cette échelle : c'est la pente linéaire
  multipliée par le « changement habituel » qui extrapole. Pistes : borner la taille montrée de la digestion à
  l'étendue de l'échelle du confort (3,5) au lieu de la masquer quand la ridge la dit nette, ou un changement
  habituel d'un facteur rare pris dans les jours observés ; mesurer au banc avant de choisir.
- [x] **REFONTE-4b-3 — Essai d'Agir sur une habitude** (**fait le 20/11 18:30** : `instruction` dit « Méditation » ou « Pas d’étirements » pour un facteur `habit_<id>` ; `heldFromData` lit `summaries.get(jour).habits[id]`, rempli par `habitDays` (`habits.js`) dans `readTrialsData` ; question seulement sans réponse ; habitude gardée lue de même ; `npm run visual -- --play --routes=/agir --trial=8 --trial-factor=habit --click=Méditation`) : la consigne dit « Un peu plus de méditation que
  d'habitude » ; elle devrait dire « Méditation » les jours « avec », et l'essai devrait lire la réponse de Ma
  journée au lieu de reposer la question (`trials.js`, `MEASURED`).
- [ ] **REFONTE-4b-4 — Heure réelle d'une habitude** : la réponse ne dit pas quand l'habitude a eu lieu ; l'ordre
  temporel repose sur l'heure de saisie et une tolérance d'une heure. À revoir si la durée ou l'heure est demandée.
- [x] **REFONTE-4b-iOS — Voir les habitudes d'Objectifs sur iPhone** (**FAIT 22/11 04:30**, #1186 mergée, capture
  regardée : carte miel « Habitudes · Méditation · Lien fort » ; **capture écrite le 22/11 03:30** : `demo-clair-recommendations-bien-etre-habitude`, abonné, « Méditation » répondue
  chaque jour noté comme `--habits=history` d'Android, posée pour cette seule capture puis retirée ; test
  `captureMode.test.js`) : les captures du simulateur montrent Objectifs
  verrouillé (carte floutée « Débloquer ») et sans habitude ; ajouter une capture avec Gold et une habitude suivie
  (`captureMode.js`). Code embarqué v1080 depuis #1005 (15/11).
- [ ] **REFONTE-5 — Onboarding** (Android fait le 15/11 : 5a #1007, 5b #1009 ; reste l'iPhone de 5b) : les 4 temps du brief § 3.4 et la migration des utilisateurs existants (objectifs
  déduits de leurs réglages, dont les anciens « cycle » et « sport », données intactes).
  Préparée le 15/11 à 08:35 : [`ETAPE-5-ONBOARDING.md`](maquettes/compagnon-etapes/ETAPE-5-ONBOARDING.md)
  (inventaire de l'accueil actuel, ce que chaque objectif change dans le code, table de migration, choix A à F à
  trancher, correctifs iPhone touchés). Découpage proposé :
  - [x] **REFONTE-5a — Migration des objectifs** (15/11 09:35, #1007) : `migrateGoals` et `ensureGoalsMigrated`
    (`settings/onboarding.js`), une fois au démarrage quand l'accueil est fini ; `goals` = `wellbeing`, plus `gut`
    (« Ma digestion », ancien « Mon cycle », ou note de digestion de moins de 7 jours sans objectif) ; anciens choix
    dans `goalsBefore` ; l'ancien `cycle` reste dans `goals` comme marqueur d'affichage du cycle (le correctif
    iPhone 58 le lit) ; Réglages › Vos objectifs (Bien-être verrouillé, Confort digestif). Écart avec la préparation :
    `used` reste le repli tant que la migration n'a pas pu lire la base. Les réglages de l'accueil ne sont pas dans
    l'export : aucun test d'import à écrire. iPhone : à embarquer (`upstream.sh --latest`).
  - [x] **REFONTE-5a-2 — « ventre » dans la SPEC** (15/11 10:35, avec 5b) : tranché sans exception au test. Le
    sous-titre devient « Pour une digestion sensible : repérer ce qui la soulage. » et la ligne du temps 4
    « Digestion · le soir » (règle AUJ-7 gardée). Choix de la routine, à corriger si le propriétaire préfère le mot
    de la maquette.
  - [x] **REFONTE-5b — Les 4 temps** (15/11 10:35, #1009, Android) : ouverture en une carte, puis objectifs, montre,
    ce que Halcya suit seule, ce qu'on note ; visage et Gold après, hors du compteur « 1 sur 4 » ; première note
    retirée de l'accueil ; habitudes écrites par `setHabits` ; `FLOW_VERSION` 3 ; outil de captures
    (`--onboarding=goal`, `watch-yes`, `auto`, `notes-gut`…). Écarts avec la SPEC et limites : compte rendu du run.
  - [x] **REFONTE-5c — Carte du tuto fausse depuis l'étape 2** (15/11 10:35, avec 5b) : la carte des onglets est
    retirée ; il reste une carte d'ouverture.
  - [x] **REFONTE-5b-iOS — L'accueil en 4 temps sur iPhone** (15/11 : **#1011 mergée vers 12:40**, code v1085,
    correctifs 23 et 55 refaits, plan de captures au parcours 3 ; build sur simulateur verte, 4 temps et carte de
    restauration regardés sur iPhone 17 Pro) : `upstream.sh --latest` après le merge de #1009 ; les
    correctifs 45 et 52 s'appliquent encore, **23 et 55 sont à refaire** (23 : la ligne `SnapshotWelcome` s'ancrait
    sur `{step === 'tuto' …}`, devenu `{step === 'intro' …}` ; 55 : l'import de `checkPhoneUsageAccess` s'ancrait
    sur une ligne d'import retirée). Captures iPhone des 4 temps à regarder (« Santé » au temps 2).
  - [x] **REFONTE-5b-2 — Temps 3 trop long quand l'accès est donné** — FAIT 27/11 14:30 : sous « Ce que Halcya a
    trouvé », les mesures reçues tiennent en une ligne « Bien reçu : … » ; seules les mesures « en partie » ou « pas
    partagée » gardent leur ligne (raison, couleur du thème), liste « Ce que vos appareils ne donnent pas » ;
    `Onboarding.jsx` (`splitMeasures`), test `Onboarding.sources.test.jsx`. Texte d'origine : les mesures par thème de l'ancien écran
    « Voici ce que Halcya recevra » s'affichent sous les 9 tuiles et les répètent en partie. À fondre : une tuile
    dit « reçu » ou « pas partagée » (proposition de la préparation), la liste par thème disparaît.
  - [x] **REFONTE-5b-3 — Captures manquantes de 5b** — FAIT 27/11 16:30 (15:30 : **320 px et grand texte (1,5)** sur les
    4 temps en play : au temps 4 le champ « Ajouter une habitude… » coupait son texte ; la rangée passe à
    la ligne, `Onboarding.css`, test `Onboarding.habitAdd.css.test.js`). 16:30 : temps 1 en sombre, visage en play
    (`--onboarding=face --face=on`, clair et sombre), Gold offert (`--onboarding=premium --subscription=launch`),
    carte « Montre Huawei trouvée » (`--onboarding=watch-huawei --devices` : sans `--devices`, la carte reste cachée,
    comme voulu) et `npm run visual` complet, tous relus. Seul défaut : l'écran Gold disait « Gold » quatre fois ; la
    pastille « gold » au-dessus du titre est retirée (**POLISH-GOLD-REDIT**, `Onboarding.jsx`, test
    `Onboarding.face.test.jsx`). Captures `runs/captures/2026-11-27-1630-*.png`.
  - [ ] **REFONTE-5b-4 — Sans montre, l'activité à la main** : la SPEC fait passer « Séances de sport » dans ce qu'on
    note ; aucune saisie d'activité n'existe dans la checklist de Ma journée. À faire avec une étape de Ma journée,
    ou à laisser tomber sur décision du propriétaire.
- [ ] **REFONTE-6 — Objectifs** : score et tendance, ce qui l'influence (3 familles), le détail, la piste en défi
  doux ; puis les seuils 7 jours (bien-être) et 14 jours (digestion) dans `app/src/config/firstResults.js` ;
  `specs/comprendre.SPEC.md`. **Préparée le 15/11 11:35** :
  [`ETAPE-6-OBJECTIFS.md`](maquettes/compagnon-etapes/ETAPE-6-OBJECTIFS.md) (inventaire, où vivent les seuils,
  découpage 6a vue d'ensemble, 6b trois familles, 6c défi doux, 6d seuils après le banc à n = 7 et 14, 6e
  réintroduction).
  - [x] **REFONTE-6a — La vue d'ensemble** (15/11 12:35, Android) : `/recommendations` s'ouvre sur une carte par
    objectif (`pages/Objectives.jsx`, `services/objectivesOverview.js`) : score sur 5 des 7 derniers jours (les
    valeurs de Tendances), tendance en mots (3 derniers jours contre les 4 d'avant, stable sous 0,3 point), 7 barres ;
    avant 7 jours notés (bien-être) ou 14 (confort digestif), « Premier score dans N jours notés » et une jauge
    (`FIRST_SCORE_DAY`, lecture A de la préparation : seuls le score et la tendance s'ouvrent à 7 et 14). Le détail
    du bien-être passe à `/recommendations/bien-etre` ; les sous-onglets (`AnalysesTabs`) sont retirés, remplacés par
    « ← Objectifs » ; l'onglet n'ouvre plus Digestion d'office (POLISH-SIM-33 retiré). Écarts avec la SPEC : « Des
    estimations, pas un diagnostic. » non affichée (SLOP-1 : jamais en refrain) ; « ventre » remplacé par
    « digestion » ; ni en-tête « Vos 7 derniers jours » avec Pilou ni phrase « Plutôt une bonne semaine. ».
  - [x] **REFONTE-6a-iOS** (15/11 14:15 : **#1014 mergée**, code v1088, 51 correctifs sans retouche, 15 checks
    verts, build sur simulateur verte) : Objectifs regardé sur iPhone 17 Pro (clair, sombre, sans donnée) et le
    détail du bien-être (pistes floutées et « Débloquer » : la période de lancement est finie sur iPhone).
  - [ ] **REFONTE-6a-2 — Restes de 6a** : ~~la visite guidée ne montre pas la vue d'ensemble (ses 3 étapes d'Objectifs
    pointent sur le détail du bien-être)~~ (**fait le 27/11 19:30** : « Objectifs » s'ouvre sur `/recommendations`,
    l'exemple du jour 14 y montre les cartes, « Au jour 14 : vos scores », puis « Vos premières pistes » sur le détail) ; captures à 320 px et en grand texte ; ~~état « pas assez de notes cette
    semaine » jamais capturé~~ (**fait le 27/11 18:30**, `--wellbeing-gap=week --no-face`, clair, sombre, 320 px ; il
    n'apparaissait jamais pour le bien-être : **POLISH-SEMAINE-NOTEE** ci-dessous) ; fourchette du score non montrée (méta-leçon 4).
  - [x] **POLISH-SEMAINE-NOTEE** (27/11 18:30, PR en brouillon) : `objectiveCard` ne comptait que les barres qui ont une
    valeur, et le modèle (TS-1) en donne une à chaque jour : avec un seul jour noté dans la semaine, Objectifs montrait
    « 3,2 / 5 · Plutôt stable » et Pilou « Une semaine plutôt régulière ». Un score demande désormais aussi 3 jours
    notés dans la semaine (`weekNoted`, leçon 17) ; sinon « Pas assez de notes cette semaine pour un score » et
    Pilou « Notez votre bien-être quand vous voulez. ». Même règle pour la carte digestive de l'Accueil
    (`HomeGutObjective`). La cérémonie du jour 7 (`!== 'waiting'`) n'en dépend pas. 2 tests (`objectivesOverview.test.js`).
  - [x] **REFONTE-6b — Les liens par famille** (15/11 13:35, Android) : bloc « Par famille » en tête des résultats
    du détail d'un objectif (`services/influenceFamilies.js`, `pages/Recommendations.jsx`) : Sommeil (avec « Écran
    tard le soir »), Alimentation, Activité, plus Habitudes et Écrans s'ils ont un lien net ; force du lien net le
    plus fort en trois points et en mots (faible sous 0,25 point sur 5, moyen jusqu'à 0,5, fort au-delà : repères
    d'affichage) ; « Pas de lien net pour l'instant » ou « Pas assez de données » sinon ; masqué tant que les pistes
    sont floutées. « Comment est calculé votre bien-être ? » en lien replié. Écarts avec la SPEC : « Par famille »
    et « Lien fort » au lieu de « Ce qui influence » et « Influence forte » (règle 5) ; pas de moyenne par famille ;
    pas de feuille du bas.
  - [x] **REFONTE-6b-iOS et 6c-1-iOS** (**#1016 mergée le 15/11 à 17:09**, build iOS verte, captures `-abonne` et Agir regardées sur iPhone 17 Pro. Avant, 15/11 16:15 : **#1016 complétée**, à jour sur main, code **v1092** (6c-2 compris), deux
    captures d'abonné : détail du bien-être et famille Sommeil ; build macOS relancée). **À merger avant toute PR
    Android**, une fois la build verte et les deux captures regardées. Note d'avant (14:45) : code v1090, 51
    correctifs sans retouche ; capture `demo-clair-recommendations-bien-etre-abonne` ajoutée (droits de
    démonstration pour cette seule page, `SUBSCRIBED_ROUTES`), car sans abonnement le bloc est masqué. **À finir** :
    build simulateur verte, cette capture regardée (bloc « Par famille » visible), puis merge.
  - [ ] **REFONTE-6b-2 — Restes de 6b** : capture de la version Play sans abonnement (bloc masqué, testé) ;
    captures du niveau « Lien moyen », d'une ligne Écrans, du confort digestif avec résultats, à
    320 px et en grand texte ; ~~moyenne par famille (« 7 h 05 par nuit »)~~ (**fait le 28/11 00:30** : `familyUsuals` dans `influenceFamilies.js`, « Sommeil · 7 h 38 par nuit », « Activité · 6 386 pas par jour » (médiane des 14 jours passés dès 7 jours, la même habitude que l'Accueil), « Alimentation · 18 repas en 14 jours » ; rien sans mesure ; tests service et page ; captures clair, sombre, police 1,3) ; ~~« Comment est calculé votre
    bien-être ? » et « Comment c'est calculé » se suivent avec deux libellés proches~~ (**sans objet** : fait par
    POLISH-SIM-121 le 20/11) ; les seuils 0,25 et 0,5 à confronter au banc de 6d. **27/11 17:30** : Objectifs, détail
    du bien-être et du confort digestif capturés à 320 px en grande police (1,3, play, sans abonnement) : rien de
    coupé ; un seul défaut, **POLISH-COMPTE-SUR** (fait) : la carte d'Objectifs disait « 9 sur 14 jours notés », le
    détail et la carte digestive de l'Accueil « 9/14 » ; partout « 9 sur 14 » (`Recommendations.jsx`,
    `DigestBlock.jsx`, tests `Recommendations.test.jsx`, `DigestBlock.test.jsx`).
  - [x] **REFONTE-6c-1 — Le détail d'une famille** (15/11 14:35, Android) : une famille qui a des facteurs comparés
    est un lien (`/recommendations/bien-etre/famille/:family`, `/recommendations/ventre/famille/:family`) ;
    `familyDetail()` dans `services/influenceFamilies.js` (ses liens nets, un par facteur ; ses facteurs par délai
    prêt ; barres seulement si la méthode prévoit mieux que la persistance) ; écran dans `Recommendations.jsx`
    (« Piste à tester », « Ce qui a été comparé », retour « ← Votre bien-être »). Famille inconnue, sans facteur,
    avant les résultats ou pistes floutées : retour au détail de l'objectif. Écart avec la SPEC § 6.5 : pas
    d'histoire propre au sommeil (14 nuits, deux moyennes).
  - [x] **REFONTE-6c-1-iOS** : fait dans #1016, mergée le 15/11 à 17:09.
  - [x] **REFONTE-6c-2 — La piste en défi doux** (15/11 15:35, Android) : sans réponse du propriétaire, le tirage
    d'ORG-8 est gardé. Un nouvel essai dure 10 jours, 5 « avec » et 5 « sans » (`TRIAL_DAYS`, `services/trials.js`) ;
    un essai commencé garde ses 14 jours ; `trialStatus` rend `total`, `goal`, `kept`, `missed`, `bilan`
    (`yes`, `no`, `none`, `too_few`) et `confirm` (moins de 10 jours « avec » suivis d'un résultat) ; `bilanWords()`
    pour `Trial.jsx`, `Act.jsx` et le rapport. « Vérifié par votre essai » et « Pas d'effet net » sont retirés
    (l'ancien verdict disait « vérifié » dans les deux sens). Écarts avec la SPEC § 7 : pas de soirs libres ni de
    comparaison aux 14 nuits ; grille sur la fourchette, pas en minutes ; ni lanternes ni rituel (étapes 10 à 12).
    Si le propriétaire dit « défi libre » : refaire d'après la SPEC.
  - [x] **REFONTE-6c-2-iOS** : fait dans #1016 (code **v1092**, 51 correctifs sans retouche), mergée le 15/11 à 17:09 ; Agir dit « 5 jours avec, 5 jours sans » sur iPhone.
  - [ ] **REFONTE-6c-3 — Restes de 6c-1 et 6c-2** : (6c-2) ~~rejouer sur le banc un essai de 5 et 5~~ **fait le 15/11
    à 20:35** : « Plutôt oui » à tort 3,9 % (tous les jours notés), 4,4 % (un jour sur cinq manquant), 4,1 % (résultat
    très autocorrélé) ; sous 5 %, la règle ± 2 erreurs types reste (Student : 1,6 à 2,2 %, mais puissance de 41 à
    28 % pour un effet d'un écart type) ; Agir allume
    l'onglet Accueil et l'écran d'un essai l'onglet Objectifs ; une piste finie est reproposée aussitôt ; captures
    en sombre, à 320 px, « Plutôt oui », « Plutôt non », « Trop peu de jours ». (6c-1) ~~un effet non net plus grand que 2 points (« Méditation −3,3 pt » à long
    terme sur les données de démo) ne devrait pas s'afficher en chiffre (voir `outOfScale`, POLISH-SIM-16)~~ (**sans objet**, vu
    le 27/11 18:30 : au long terme, une ligne pas nette dit « pas assez net » sans chiffre depuis METHODE-BIAIS-4) ; le
    détail de l'objectif répète ce que la famille montre (alléger « Ce qui va avec » quand 6c-2 sera là) ; captures
    à 320 px, en grand texte, confort digestif avec résultats ; ~~moyenne de la famille (« 7 h 05 par nuit »)~~ (**fait le 28/11 01:30** : `familyPeriods` dans `influenceFamilies.js`, sous le titre du détail d'une famille « Vos 14 dernières nuits · d’habitude 7 h 38 », « Vos 14 derniers jours · d’habitude 6 386 pas par jour », « … · 18 repas notés » ; « d’habitude » et non « en moyenne », puisque c'est la médiane, comme l'Accueil ; une ligne de texte grise, pas un encadré ; rien sans mesure ; tests service et page ; captures clair, sombre à 1,3). ~~Les 14 barres~~ (**fait le 28/11 02:30**, REFONTE-6c-4 : `familyBars` dans `influenceFamilies.js`, les mêmes jours que l'en-tête, une barre par nuit, par jour de pas ou par jour de repas, trait pointillé à la valeur habituelle ; jour sans mesure = barre vide ; barres décoratives pour le lecteur d'écran, l'en-tête les dit en mots ; tests service et page ; captures clair et sombre des 3 familles). ~~Les deux moyennes~~ (**fait le 28/11 03:30**, REFONTE-6c-5 : `readFamilyDaysFromStorage` lit `phone_usage` ; `lateScreenMinutes` dans le résumé du jour ; point ambre sous les nuits qui suivent un soir d'« écran tard », la mesure qui existe déjà dans l'app, au moins 30 min entre 22 h et 4 h (`AUTO_LATE_SCREEN_MIN`), plutôt que les « 2 h » de la maquette : un même objet, une seule mesure, et c'est ce que la piste « pas d'écran après 22 h » fait changer ; moyennes des nuits mesurées dès 3 nuits de chaque côté, nuits estimées par le téléphone exclues (déduites de l'écran : lien circulaire, règle 5) ; trait plein « Autres soirs », pointillé ambre « Soirs avec écran après 22 h » et l'écart ; « Observé sur N nuits : un lien, pas une preuve. » ; tests service et page ; captures clair et sombre). ~~« Je teste » sur la carte de la piste~~ (**fait le 28/11 04:30**, REFONTE-6c-6 : `PisteCard` du détail d'une famille, bouton « Je teste » qui enregistre l'essai de 5 et 5 et ouvre sa page avec « C'est parti ! » ; « Essai en cours » quand un essai vivant ou gardé porte sur la même piste ; FODMAP inchangé ; tests page ; captures clair et sombre de la famille Habitudes avec `--habits=history`, puis la page de l'essai après le toucher). ~~L'essai sur « Écran tard »~~ (**fait le 28/11 05:30**, REFONTE-6c-7 : `screen_late_minutes` dans `MEASURED` de `trials.js`, consigne « Pas d’écran après 22 h » (« Écran après 22 h permis » dans l'autre sens), seuil fixe `AUTO_LATE_SCREEN_MIN`, tenue lue au résumé du lendemain (`nextDay`) ; `withTodayLateScreen` ajoute l'écran tard de la journée en cours (réglages du temps d'écran) dès 4 h, pour la lanterne du matin ; tests ; captures clair et sombre avec `--trial-factor=late-screen`). ~~La phrase de la carte~~ (**fait le 28/11 06:30**, REFONTE-6c-8 : `eveningsText().sentence`, « Les soirs avec écran après 22 h, vous dormez 40 min de moins. » (ou « de plus »), « à peu près autant que les autres soirs » sous 10 min d'écart (`EVENING_SENTENCE_MIN`), en gras au-dessus de la légende des deux traits ; tests service et page ; captures clair et sombre). ~~La piste « Pas d'écran après 22 h » proposée par l'écart du sommeil~~ (**fait le 28/11 07:30**, REFONTE-6c-9 : un essai peut suivre le sommeil, `factor.outcome = 'sleep'` ; `trialOutcome`, `sleepOutcome` (nuits mesurées seulement, `sleepEstimated` exclues : règle 5) et `sleepScreenPiste` dans `trials.js`, proposée quand les nuits après un soir d'écran tard sont plus courtes d'au moins `SLEEP_PISTE_MIN` = 10 min, le seuil de la phrase ; carte « Une piste pour vos nuits » sous l'écart, bleu nuit, « Je teste » / « Essai en cours » ; `readTrialsData` rend `outcomes.sleep` ; page de l'essai en durées (graduations « 7 h », écart « +1 h », phrase « +25 min, entre −10 min et +1 h »), retour « ← Sommeil » ; rapport médecin « sommeil » ; l'essai se range sous « Votre bien-être » ; banc visuel `--screen-sleep` et `--trial-factor=sleep-screen` ; tests service, page de l'essai et Objectifs ; captures clair et sombre). Reste de la SPEC § 6.5 : animations (barres une à une, moyennes qui se tracent), Pilou à côté de la carte (paupières mi-closes). Vu à la capture : sous la carte, « Aucun lien assez net pour l'instant dans cette famille » (le lien avec le bien-être) peut se lire comme une contradiction : à faire juger par une persona (POLISH-6c-9-a). Sur les données de démo, aucune famille n'a de piste nette sans `--habits=history` : capture du bouton par la famille Habitudes.
  - [x] **REFONTE-6d** (seuils 7 et 14) — **code fait le 15/11 à 21:35, mergé le 16/11 à 00:41 (#1026, Android et iPhone, build iOS verte, captures iPhone regardées)** : `UNLOCK_DAYS.wellbeing.medium` 21 → 35, deux cas au banc (`bench.test.js`, effet fort à 21 et 28 jours, 400 jeux : 7,25 % et 6 % avant, ≤ 5 % après), visite guidée (« Un premier score après 7 jours notés, vos pistes après 14. » ; digestion « 14 et 28 ») et Premium à l'accueil (« Votre premier score arrive au 7e jour noté, vos pistes vers le 14e. ») ; « Voir un exemple » n'a pas de délai écrit, inchangé. Reste **REFONTE-6d-2** : capture de la visite guidée et du paywall d'accueil (le banc visuel ne sait pas les ouvrir), suivi iPhone vérifié par la build de la PR. — **banc fait le 15/11 à 20:35**
    ([`ETAPE-6D-BANC.md`](maquettes/compagnon-etapes/ETAPE-6D-BANC.md)) : **lecture A retenue**. Le run de code :
    (1) `FIRST_RESULTS_DAY` reste à 14 / 28 (pistes), `FIRST_SCORE_DAY` 7 / 14 (score, déjà livré en 6a) ;
    (2) `UNLOCK_DAYS.wellbeing.medium` de 21 à 35 (à 21 j, 6 à 7 % de jeux avec un faux lien quand un vrai effet
    existe, presque tous sur l'horizon moyen ; à 35 j, 3,8 à 4 % ; la puissance du court terme monte de 8 à 14 % à
    21 j) ; ORG-6 et tout texte qui dit « 21 jours » à aligner ; (3) un cas de non-régression au banc
    (`bench.test.js` : effet fort, 21 et 28 jours, ≤ 5 %) ; (4) textes : la visite guidée, Premium et « Voir un
    exemple » distinguent « premier score au 7e jour » et « premières pistes vers le 14e » (digestion : 14 et 28) ;
    le test des délais couvre les deux. Le banc lui-même : `maquettes/compagnon-etapes/banc-6d/`.
  - [x] **REFONTE-6e — La réintroduction sous Confort digestif** (15/11 16:35, Android) : ligne « Réintroduction
    guidée » dans le détail du confort digestif (`reintroLine`, `services/act.js` : test en cours, groupes cités par
    une analyse, ou groupes testés ; rien sinon, leçon 17), retour de `/reintroduction` vers `/recommendations/ventre`.
  - [x] **REFONTE-6e-iOS** (#1022 mergée le 15/11 à 19:39 ; captures regardées sur `captures/pr-1022`) : embarquée par la PR IOS-HEAD du 15/11 17:35 (le code partagé du jour, 6e compris, part
    sur iPhone à son merge) ; à cocher quand la PR est mergée et les captures `recommendations-ventre` et
    `reintroduction` regardées sur simulateur.
  - [ ] **REFONTE-6e-2 — Restes de 6e** : capturer « À tester d'après vos analyses » (données de démo avec un lien
    net sur un groupe FODMAP), le sombre, 320 px, la version Play sans abonnement ; retirer les tests FODMAP d'Agir
    quand Agir rejoint l'Accueil (étape 10).
- [x] **IOS-HEAD — Une seule PR pour `app/` et `iphone/`** — **mergée le 15/11 à 19:39 (#1022) ; build TestFlight 1096.1096 envoyée à 19:40, plus grande que 1092.1093 (vérifié)** (à merger par le run
  suivant, build macOS verte et captures regardées) : `iphone/upstream.json` suit `HEAD` ; `ios-build.yml` suit
  aussi `app/**` et `relay/**` (son job Ubuntu est le contrôle « les correctifs s'appliquent »), `ios-testflight.yml`
  suit `app/**` ; `iphone/scripts/version.sh` donne le numéro (nombre de commits) ; `--latest` ne fait plus rien ;
  charte mise à jour. **Après le merge, à vérifier une fois** : la build TestFlight porte un numéro `N.N` plus grand
  que 1092.1093, et une PR de journal seul ne lance pas la build iOS. Suite : IOS-HEAD-2 (étape 2 de « Sort des
  correctifs » : la variante `appstore` du correctif 01 en condition dans `app/src/`). Ce qui était demandé
  (étape 1 de « Sort des correctifs », `iphone/README.md`) :
  `upstream.json` à `HEAD`, filtres de `ios-build.yml`, job « les correctifs s'appliquent ». Aujourd'hui chaque
  merge Android remet la PR iPhone en retard sur main et relance une heure de build (15/11 : #1016 est restée
  ouverte deux runs). À faire avant REFONTE-7. D'ici là : merger la PR iPhone avant toute PR Android.
- [ ] **REFONTE-7 — Données et suppression du Journal** (**préparée le 15/11 18:35** :
  [`ETAPE-7-DONNEES.md`](maquettes/compagnon-etapes/ETAPE-7-DONNEES.md) ; inventaire de 10 choses propres au Journal,
  découpage 7a « Vos saisies » dans le détail du jour de Tendances, 7b Données sur 2 onglets et visite guidée, 7c code
  mort et « Hier », 7d Nunito) : Données s'ouvre sur Tendances, Nutrition en second onglet ;
  **inventaire d'abord** de ce qui n'est accessible que par le Journal (modifier ou supprimer une saisie passée, la
  ligne « Règles · 2e jour », les ajouts rapides…) et une autre maison pour chaque chose ; puis suppression de
  l'écran, de ses routes (redirigées vers Tendances) et du code mort, tests compris. Nunito et les tokens
  (`tokens.css`, `DESIGN.md`) ici ou à l'étape 8.
  - [x] **REFONTE-7a — « Vos saisies » dans le détail du jour de Tendances** (15/11 19:35, Android et iPhone dans la
    même PR) : `components/DayEntries.jsx` extrait du Journal (saisies, « … », Modifier, Refaire, Supprimer, règles et
    jour du cycle) ; habitudes « Méditation  Oui » en miel, une réponse par jour, Oui / Non sur place ; placé à la fin
    du détail d'un jour passé (Jour, Semaine, Mois). Inventaire couvert : lignes 1, 2, 3, 5, 6, 8. **Mergée le 15/11
    vers 22:40 (#1024, 216c8b9)**, build iOS verte, captures `tendances` regardées des deux côtés.
  - [x] **REFONTE-7b** : Données sur 2 onglets (Tendances · Nutrition), Repas depuis Nutrition, `/journal` redirigé
    vers `/tendances?vue=jour`, visite guidée sur Tendances, `captureMode.js` iPhone et `visual-check` sans `/journal`.
    — **code fait le 16/11 à 01:30, en PR (Android et iPhone)** : `JournalTabs` = Tendances · Nutrition (Repas range
    sous Nutrition), lien « Tous vos repas » à côté de « Vos apports », `/journal` redirigé (test `AppRedirects`),
    « Voir un exemple » en bas de Tendances, visite guidée : « Vos journées » puis « Une journée d'un coup d'œil » sur
    `/tendances?vue=jour`, projecteur sur le détail du jour (`.trends-detail`), texte « Touchez un jour pour revoir vos
    notes et vos repas. » (l'ancien promettait sommeil, pas et cœur, que le détail ne montre pas tous) ; capture
    « 07-jours » retirée de la fiche Play (6 captures) ; plan de captures iPhone sans `/journal`. Données : aucune
    lecture ni écriture changée, rien à migrer. **Mergée le 16/11 à 03:32 (#1029, 40bb25d)** après 14 checks verts, build iOS comprise ; captures iPhone `tendances` (clair, sombre, vide, grand texte), `nutrition` et `food` regardées.
  - [ ] **REFONTE-7b-2 — Restes de 7b** : ~~(1) la visite à « Une journée d'un coup d'œil » montre, vers 1 h 30 du
    matin, deux repas fictifs identiques à l'heure présente~~ **fait le 16/11 à 03:35** (`pullBeforeNow` dans
    `tourData.js` : ce qui tomberait plus tard aujourd'hui, repas d'hier recopiés compris, est ramené avant maintenant
    dans son ordre, à 15 min d'écart, jamais avant minuit ; test à 0 h 20, 1 h 30, 9 h 30 et 14 h 30) ; ~~(2) l'exemple ne s'affiche qu'après le calcul d'Analyses sur le fil
    principal (≈ 3 à 6 s avec `--settle=6000`, « Vos courbes apparaîtront après 3 jours » avant) : montrer le
    chargement plutôt que l'état vide~~ **fait le 16/11 à 05:30, mergé à 06:40 (#1032)** (`Trends.jsx` : à l'entrée ou à la sortie du mode
    exemple, la page repasse par le chargement au lieu de garder les données d'avant ; une saisie ordinaire relit sans
    spinner ; deux tests, capture de la visite juste après « Exemple au jour 14 » puis 7 s après) ; ~~(3) capture iPhone de la visite sur Tendances (le plan ne l'ouvre pas)~~ **plan fait le 16/11 à 10:30 (en PR)** : `vide-tendances-visite` (base vide, accueil fini à l'instant, « Voir un exemple » puis « Exemple au jour N », 8 s d'attente).
  - [x] **REFONTE-7c** : retrait de `Journal.jsx`, `DailyJournal.jsx`, `JournalEmpty.jsx` et de leurs tests —
    **code fait le 16/11 à 04:30, mergé vers 05:35 (#1031, 488dc0c), Android et iPhone** : plus aucun import de ces fichiers (seul le service
    `dailyJournal.js`, partagé par Ma journée, Tendances, le rapport et les essais, reste) ; `/journal` renvoie toujours
    vers Tendances › Jour (`AppRedirects`). iPhone : correctif 57 réduit à `dayDeviations.js` (son morceau du Journal
    retiré), test du cycle de Santé porté sur le détail du jour (`DayEntries.cycle.ios.test.jsx`), test « Selles »
    réduit au composant (`StoolPhotoLine.appstore.test.jsx`), `DailyJournal.ios.test.jsx` retiré. Données : rien de
    lu ni d'écrit autrement, rien à migrer.
  - [ ] **REFONTE-7c-2 — Restes de 7c** : ~~(1) règles CSS du Journal devenues mortes (`App.css` : `.day-card*`,
    `.journal-*`) à repérer et retirer, captures à l'appui~~ **fait le 16/11 à 06:30, mergé vers 07:45 (#1033)** (110 lignes de `App.css` :
    `.day-list`, `.day-card*`, `.day-summary*`, `.day-card .entry-delete-question`, `.journal-empty` ; le test CSS
    GRANDE-POLICE-1 de ces tuiles retiré avec elles ; `.journal-page`, `.journal-tabs` et `.journal-empty-title/-text`
    servent encore à Tendances et Nutrition) ; ~~(2) iPhone : vérifier que « Ce qui a pu peser ce jour-là »
    de Tendances › Jour lit la VFC de l'app Santé, sinon l'y brancher~~ **fait le 16/11 à 07:30 (en PR)** : elle ne la
    lisait pas (facteurs des Analyses sans la SDNN) ; correctif iPhone 64 (`analysisResults.js`, `trendsDay.js`), test
    sur 70 jours synthétiques ; ~~(3) « Hier » dans Ma journée~~ **fait le 16/11 à 09:30 (en PR)** :
    carte « Hier, dimanche » en tête de Ma journée (journee.SPEC § 10) avec les habitudes suivies restées sans
    réponse hier, Oui / Non pour la veille, « Passer » (gardé pour cette date seulement) ; rien après deux jours sans
    aucune réponse, rien sans habitude suivie (`yesterdayCatchUp`, 4 tests, composant 3 tests, test d'intégration
    dans `Dashboard.test.jsx`). Données : entrées `habit` ordinaires datées de la veille, rien à migrer. La note de
    bien-être d'hier n'est pas reposée ici : elle se modifie depuis Tendances › Jour (7a).
  - [x] **REFONTE-7a-2 — Restes de 7a** (**soldée le 26/11 05:30** : `iphone-16e-demo-clair-tendances-jour-veille` et `iphone-16e-vide-tendances-visite` de `captures/main` (build 1335) regardées : propres ; « Vos saisies » se voit dans la visite, le Jour précédent pris à 03:13 montre le 24/11, la journée finissant vers 4 h) : captures sur historique presque vide, grand texte, 320 px, version Play.
    Le plan de captures iPhone ne touche aucun jour de Tendances : « Vos saisies » n'y est jamais vu (ajouter une
    capture « Tendances › Jour › veille » à `captureMode.js`, comme `--click="Jour > Jour précédent"` côté Android). **Plan iPhone fait le 16/11 à 10:30 (en PR)** : `demo-clair-tendances-jour-veille` (`REVEALS` accepte une suite de boutons, trouvés par texte, libellé d'accessibilité ou motif). Captures Android regardées le 16/11 à 10:30 (Tendances › Jour › veille : `--history-days=2`, `--play --font-scale=1.5`, `--play --size=320x640`) : propres, aucune erreur JS ; à 320 px, les « … » des saisies passent à la ligne (lisible). Reste : regarder `demo-clair-tendances-jour-veille` et `vide-tendances-visite` sur la PR iPhone.
  - [x] **REFONTE-7d — Nunito et fond crème** (**mergée le 16/11 vers 12:50, #1038** ; **préparée le 16/11 08:30** :
    [`ETAPE-7D-NUNITO.md`](maquettes/compagnon-etapes/ETAPE-7D-NUNITO.md), captures avant/après de 4 écrans dans
    `compagnon-etapes/7d/`) : Nunito variable (OFL, +19 Ko au premier lancement, chiffres tabulaires, mêmes glyphes
    absents que Figtree) ; fond `#fff8f0`, surface `#f8efe4`, bord `#eadfd1` (marque à 5,04:1) ; sombre inchangé ;
    PDF (TTF Nunito par `woff-to-ttf.mjs`), licences, fiche Play, pages légales iPhone, DESIGN.md § 3-4, Nouveautés.
    Un run de code, Android et iPhone ; aucune donnée touchée.
    **Code fait le 16/11 à 10:30 (branche `auto/7d-nunito`), en PR le 16/11 à 11:30 après le merge de #1037** : paquets Nunito à
    la place de Figtree, `main.jsx`, `tokens.css` (fond, surface, bord, `--bg-rgb`) et `tokens.test.js` (rouge
    d'abord), TTF du rapport PDF régénérés (`nunito-400/700/800.ttf`, `OFL-Nunito.txt`), licences, visuels de la
    fiche, pages légales (Android et iPhone, empreintes des pages Android relues mises à jour), site, commentaires,
    `DESIGN.md` § 3-4, Nouveautés. Suites Android (3 678) et iPhone (4 040) vertes, build OK, captures claires (35)
    et sombres regardées. Reste (7d-2) : chevron « › » de la carte Agir plus petit (si Agir reste à l'Accueil) ;
    regarder les captures iPhone de la PR ; visuels de la fiche Play régénérés par la CI.
  - [x] **REFONTE-7d-2 — Chevron des listes** (16/11 12:30) : le « › » texte de la carte Agir et des lignes de
    Réglages, réduit par Nunito, devient l'icône chevron de la carte Bien-être (`LineIcon`, tournée vers la droite,
    `--text-muted`) ; test rouge puis vert dans `More.test.jsx`. iPhone : le correctif 26 (`More.jsx`) s'applique
    toujours, suites Accueil et Réglages vertes dans `upstream/`. Captures Accueil et Réglages regardées.
  - [x] **REFONTE-7d-3 — Images de la fiche Play** (16/11 13:30) : `node scripts/store/build-store-assets.mjs`
    relancé après 7d ; les 6 captures (Accueil, Tendances, Objectifs, Agir, Nutrition, Réintroduction) et l'image
    de présentation passent en Nunito sur fond crème, barre à 4 onglets. Envoi sur Play par « Play — fiche du Store »
    au passage du soir (23:23). Reste repéré (7d-4) : le lien texte « Ce qui va avec votre bien-être › » de la carte
    Objectifs garde le « › » texte, plus petit en Nunito ; à passer à l'icône chevron comme en 7d-2.
  - [x] **REFONTE-7d-4 — Derniers chevrons texte** (16/11 14:30) : le « › » du lien « Ce qui va avec votre
    bien-être / confort digestif » des cartes Objectifs et celui des familles qui s'ouvrent (« Par famille ») passent
    à l'icône chevron, tournée vers la droite. Tests (Objectives, Recommendations) ; captures Objectifs et « Votre
    bien-être » regardées. Code partagé sans correctif iPhone : repris tel quel par la build iOS de la PR. Plus aucun
    « › » texte affiché comme flèche dans l'app (les « Réglages › Paramètres » des phrases restent : chemins écrits).
- [ ] **REFONTE-UPG — Parcours « mise à jour depuis la version des testeurs »** (objectif du 22/11, point 4) :
  - [x] **UPG-0 — Outil** (16/11 15:30) : `npm run persona -- … --legacy` (jour > 1) rejoue un testeur d'avant la
    refonte : accueil d'alors (objectifs de `--goals`, ex. `sport,cycle`, sans `goalsVersion` : la migration 5a
    tourne), Nouveautés vues jusqu'au 14/11 (`legacyLastSeen`), un essai d'Agir en cours (jour 4 sur 10), aucune
    habitude. 3 tests dans `personaData.test.mjs`. Premier coup d'œil (J45, montre, `sport,cycle`) : l'essai est
    intact dans Agir (« Jour 4 sur 10. Aujourd'hui, jour avec. »), « Règles » reste dans le bandeau d'ajout, Objectifs
    montre Bien-être et Confort digestif, aucune erreur.
  - [x] **UPG-1 — Essai en cours sur l'Accueil** (16/11 17:30, #1044, mergée 16/11 18:00) : la carte « Agir » dit la consigne de l'essai
    (« Dormir au moins 7 h 30 ») et « Essai · jour 4 sur 10 · aujourd’hui, jour avec / jour sans » (mots d'Agir) ;
    deux essais : « 2 essais en cours · … », lien vers Agir. Un jour « avec », elle remonte sous « Bien-être
    aujourd’hui ». `homeTrial()` (trials.js) ne lit que les entrées `trial`. Code partagé sans correctif iPhone.
  - [x] **UPG-2 — Nouveautés d'un testeur qui arrive** (16/11 16:30) : champ `aLaUne` des notes de Nouveautés ;
    `bannerHeadline` (services/whatsNew.js) titre le bandeau avec la note à la une si elle est non lue, sinon la plus
    récente. Seule note à la une : `2026-11-15-0435-refonte-navigation` (test), dont le 3e point est remis à jour
    (Données = Tendances et Nutrition, le détail d'un jour dans Tendances). Tests : whatsNew, WhatsNewBanner (nouveau),
    changelog. Capture `npm run visual -- --whats-new --routes=/` : « Nouveau : Nouveaux onglets : Accueil, Ma
    journée, Objectifs, Données et 523 autres changements ». Code partagé sans correctif iPhone.
  - [x] **UPG-3 — Passage complet des personas** (FAIT 20/11 08:30 : 10 parcours sur 10, dernier passage UPG-3d) sur les deux parcours (installation neuve ; `--legacy`), avant le 22/11.
    Passage 1 (16/11 19:30, [synthèse](simulations/2026-11-16-1930-synthese.md)) : Ventre sans technique J1
    (installation neuve, Android seul) et Ventre et données J45 `--legacy --goals=gut,cycle` (Samsung + Galaxy Watch).
    Rien de perdu, essai et bandeau UPG-2 vus ; constats UPG-4 à UPG-9 ci-dessous. Reste : Tout mesurer, Prendre
    soin de soi, Stressé et pressé, sur les deux parcours.
  - [x] **UPG-4 — Ma digestion : le choix ne se voit pas** (16/11 19:30, PR ; `TodayCards.jsx` : après le bilan du
    soir, sa rangée reste avec le choix coché, `aria-pressed` ; test rouge puis vert ; capture vérifiée) (2 personas sur 2, captures vérifiées) : dans la fenêtre
    « Ma digestion », Calme / Gêne / Douleur ne prennent aucun état après le geste ; seule la ligne « Bilan du jour :
    Gêne » le dit. Marquer le dernier choix du jour (rond plein, fond de la couleur digestion), sans empêcher une
    seconde note dans la journée.
  - [x] **UPG-5 — Testeur qui arrive** (19/11 03:30 : ligne « Mon cycle » → « Règles » de Ma journée ajoutée à la note à la une, et la note passe en tête de la page Nouveautés tant qu'elle n'est pas lue, avec POLISH-SIM-101 ; capture `--whats-new` relue) **« : « où sont passés vos onglets »** (J45 `--legacy`) : rien ne dit où est le
    Journal (Tendances › toucher un jour), ni Analyses (Objectifs › Ce qui va avec…), ni Agir (carte de l'Accueil),
    ni ce que devient « Mon cycle » (Règles dans Ma journée, contexte de la digestion). La note à la une
    (`2026-11-15-0435-refonte-navigation`) le dit en partie : la compléter d'une ligne sur « Mon cycle », et, dans
    la page Nouveautés, la placer en tête tant qu'elle n'est pas lue (comme le bandeau).
  - [x] **UPG-6 — Deux chiffres de bien-être le même jour** (19/11 05:30 : Objectifs « Moyenne de vos 7 derniers jours » ; la fiche d'un jour écrit la note comme « Vos saisies » (`noteText` = `formatNote`, « vous avez noté 2,6 »), jamais arrondie à un autre chiffre ; le chiffre en tête reste l'estimation du jour, que la ligne explique) (J45) : Accueil « 3/5 » (aujourd'hui) et Objectifs
    « 3,1 / 5 » (moyenne des 7 jours, non dite) ; Tendances › Jour du 12/11 : 2,8 en tête, « vous avez noté 3 », 2,6
    dans les saisies. Dire « moyenne sur 7 jours » sous le chiffre d'Objectifs ; vérifier l'origine des trois
    chiffres de Tendances › Jour (avec POLISH-SIM-80 et 88).
  - [x] **UPG-7 — Délais de la digestion** (fait le 19/11 04:30 avec POLISH-SIM-102) (J1) : Objectifs « Premier score dans 13 jours », Ma journée et Confort
    digestif « Encore 27 jours » ; nommer les deux paliers sur la même carte (score au 14e jour, pistes au 28e).
  - [x] **UPG-8 — Repas décrit, aliments oubliés** (FAIT 20/11 05:30 : vérifié dans le code réel. L'app garde tout ce que le modèle renvoie, même un nom inconnu (`toMealResult`) ; la consigne texte du relais (`relay/src/prompts.js`) et de la sideload (`geminiStandalone.js`) ne parlait que d'un plat composé, rien sur plusieurs plats. Règle ajoutée : chaque plat, aliment ou boisson cité apparaît dans `ingredients`, `dish` les nomme ensemble ; 1 test relais, 1 test app. Effet réel à confirmer sur une vraie analyse après le déploiement du relais) (J1, à vérifier hors analyse factice de l'outil) : « pâtes
    carbonara, un yaourt et une pomme » ne rend que la carbonara. Dans l'outil, l'analyse est factice : vérifier
    d'abord sur l'analyse réelle (consigne du relais) avant tout code.
  - [x] **UPG-9 — Textes techniques pour « Ventre, sans technique »** (SOLDÉ le 20/11 04:30 : bandeau « Gold est prolongé » au 1er jour = relais simulé de `persona-browse.mjs` qui recalculait `launchUntil` à chaque appel ; l'outil sert une date fixe et `refreshEntitlement` ne compte une prolongation qu'à partir d'un jour de recul, 1 test. Texte réel de la période : rien avant les 3 derniers jours, puis « Gold offert jusqu'au 2 déc. 2026 ») (carte d'un repas FAITE le 19/11 19:30 : plusieurs groupes → « Parfois mal digérés : … » dans l'ordre du repas, groupes, grammes et sources derrière « Détails » ; un seul groupe inchangé (N4) ; 2 tests. Pistes FAITES le 20/11 03:30 : « Avec 1 repas riche en fructanes de plus (blé, oignon, ail), votre digestion va plutôt moins bien. », points et délai derrière le chevron, aliments du groupe FODMAP, `pistePlain` de `Recommendations.jsx`, 2 tests. Reste : le bandeau Gold) (J1) : alertes FODMAP après un repas (4 lignes
    rouges, grammes, références d'articles) et pistes « −2,7 pt pour 1 repas riche en fructanes » : une phrase
    simple d'abord, chiffres et sources derrière « Détails ». Bandeau Gold au 1er jour : « Gold est prolongé » (le
    relais de l'outil sert la période prolongée ; vérifier le texte réel de la période de lancement).
    - [x] **UPG-3a** (16/11 20:30, run « idées ») : 2 simulations, « Ventre et données » J1 neuve (Galaxy Watch) et
      « Tout mesurer » J45 `--legacy` (`sport,cycle`, Pixel Watch) : [`J1`](simulations/2026-11-16-2030-ventre-et-donnees-J1.md),
      [`J45`](simulations/2026-11-16-2030-tout-mesurer-maj-J45.md). Rien de perdu à la mise à jour ; constats en POLISH-SIM-99 à 108.
      Écarté : « carbonara » à la place du repas décrit (analyse factice de l'outil, pas un défaut de l'app).
    - [x] **POLISH-SIM-99 — Visite guidée et Ma journée** (19/11 00:30 : étape « Ma journée » sur la checklist réelle, juste après l'Accueil ; lien de piste « Vérifier par un essai » ; étape Agir « Ouvert depuis l'Accueil » ; le retour « ← Agir » de l'essai reste, la page s'appelle Agir) (prioritaire pour le 22/11, point 2) : la visite ne montre pas
      l'onglet « Ma journée » (là où l'on note) et dit « Essayer dans Agir » alors qu'Agir n'est plus un onglet ; le lien
      retour de l'essai dit « ← Agir ». Ajouter l'étape Ma journée, dire « depuis l'Accueil ».
    - [x] **POLISH-SIM-100 — Objectifs migrés expliqués** (FAIT 19/11 11:30 : `FormerGoalsNote` dans `Settings.jsx`, une ligne par ancien objectif retiré lu dans `goalsBefore` (par `migrateGoals`, sans rien écrire, migration du démarrage faite ou non) ; Confort digestif reste coché, voulu ; 3 tests ; état `--onboarding=former` de l'outil de captures) (point 1) : après la conversion `sport,cycle`, Paramètres
      montre « Confort digestif » coché sans que la personne l'ait choisi, et rien ne dit où sont passés Sport (famille
      Activité) et Cycle (bouton « Règles »). Une note unique après la mise à jour ; vérifier que cocher Confort digestif
      est voulu par la migration 5a (cycle = contexte de la digestion), sinon ne pas le cocher.
      **Spéc. prête (19/11 08:30, run « idées », code lu)** : cocher Confort digestif est **voulu** (`migrateGoals`,
      `src/settings/onboarding.js` l. 71 : `wantsGut` vrai pour l'ancien « cycle », brief § 3.1) : on le garde. La
      migration garde les anciens choix dans `goalsBefore`. Dans Réglages › Paramètres › « Vos objectifs » (`Settings.jsx`),
      si `goalsBefore` contient `sport` ou `cycle`, une ligne discrète sous la liste, une seule phrase par ancien
      objectif : « Sport : vos séances comptent dans la famille Activité d'Objectifs. » ; « Mon cycle : notez vos règles
      dans Ma journée › Règles ; Confort digestif le remplace. » Rien d'autre à cocher, rien d'effacé. Tests : réglages
      `{ goalsBefore: ['sport','cycle'], goalsVersion: 2 }` → deux lignes ; installation neuve → aucune. Capture :
      `/settings` (ou l'outil des personas en `--legacy --goals=sport,cycle`), relue.
    - [x] **POLISH-SIM-101 — Page Nouveautés** (19/11 03:30 : `WhatsNew.jsx` place en tête la note `aLaUne` non lue, choisie par `bannerHeadline` comme le bandeau ; ordre par date une fois lue ; 3 tests) : le bandeau met la note de la nouvelle navigation à la une (UPG-2), mais
      la page la range par date, perdue dans une très longue liste. La mettre en tête de la page quand elle est non lue.
    - [x] **POLISH-SIM-102 — Deux décomptes de la digestion** (19/11 04:30 : Ma journée « Premier score au 14e jour noté, pistes au 28e. » ; Objectifs, sous « Premier score dans N jours notés » : « Pistes au 28e jour noté. » ; passé 14 jours, Ma journée renvoie au score d’Objectifs) : Ma journée « 9/28, encore 19 jours », Objectifs « 9 sur
      14, premier score dans 5 jours ». Nommer les deux paliers (premier score à 14, pistes à 28) au même endroit.
    - [x] **POLISH-SIM-103 — Bien-être d'un jour** (19/11 05:30, avec UPG-6 : « vous avez noté 4,2 · estimé avec le visage » sous 4,0 ; titre « Ce qui a pu jouer ce jour-là », demandé par trois simulations) : Tendances › Jour affiche 4,0 en tête et 4,2 dans la saisie (moyenne
      ou note ?) ; « Ce qui a pu peser » ne liste que des effets positifs.
    - [x] **POLISH-SIM-104 — Exemple de « Votre bien-être »** (19/11 06:30 : une famille sans lien net dit « Pas assez net pour l’instant », les mots de la légende des barres hachurées ; « Essayer dans Agir » déjà retiré par POLISH-SIM-99) : famille Alimentation « Pas de lien net » au-dessus de
      lignes GOS −1,1 pt et Lactose −0,9 pt.
    - [x] **POLISH-SIM-105 — Accueil « Ce que Halcya suit pour vous »** (FAIT 19/11 10:30 : `autoTiles` dans `onboardingFlow.js` ; Météo et Temps d’écran en tuile seulement allumés, sinon « Activables dans Réglages › Sources : … » ; avec une montre, VFC, respiration et température sur la ligne « Selon votre montre : … » ; aucune liste vide sans montre ni source ; 5 tests. Reste iPhone : avant iOS 26.4, « temps d’écran » est dit activable alors que Sources le cache (correctif 44) → POLISH-SIM-105i) : liste VFC et température de la peau sans montre
      qui les donne, et Météo non activée, juste après « Health Connect n'est pas sur ce téléphone » (vérifier sur
      Android, la version web n'a pas Health Connect).
      **Spéc. prête (19/11 08:30, run « idées », code lu)** : c'est l'écran du temps 3 de l'accueil (`AutoStep`,
      `src/pages/Onboarding.jsx` l. 386), pas l'Accueil. `AUTO_TILES` (`src/services/onboardingFlow.js` l. 51) est listé
      en entier dès que « Oui » est choisi pour la montre, et Météo et Temps d'écran y sont même éteints à l'écran
      d'avant. Correctif : (1) Météo et Temps d'écran seulement s'ils sont allumés (`state.weather`, `state.screen` ou
      leurs réglages), sinon une ligne « Activables dans Réglages › Sources : météo. » ; (2) avec une montre, Sommeil,
      Pas et Cœur restent ; Variabilité cardiaque, Respiration et Température de la peau passent sur une ligne « Selon
      votre montre : … » (beaucoup de montres ne les envoient pas, PERSONAS.md) ; la liste « Ce que Halcya a trouvé »
      juste dessous dit ensuite ce qui arrive vraiment. Tests dans `Onboarding.test.jsx` (« Temps 3 ») : météo éteinte
      → pas de tuile Météo ; montre oui → trois tuiles fermes et la ligne « Selon votre montre ». Capture
      `--routes=/bienvenue --onboarding=notes` (écran du temps 3) relue.
    - [x] **POLISH-SIM-106 — FODMAP de l'oignon cuit** (19/11 06:30 : « Oignon, cuit », oignon blanc ou jaune et rouge sautés/poêlés : fructanes de l’oignon cru ramenés par les glucides Ciqual cuit / cru, fourchette Ferjančič–Liljebo gardée, confiance « analogie » ; oignon nouveau non repris, autre légume ; test) : `fodmapMeasurements.json` n'a que l'oignon cru (fructanes) ;
      l'oignon cuit n'est marqué que « fructose en excès ». Ajouter l'analogie documentée (confiance basse) pour
      l'oignon cuit ou poêlé, comme pour l'ail.
    - [ ] **POLISH-SIM-107 — Tendances** (19/11 07:30 : **1re moitié faite** : la mesure choisie reste en Jour et au retour en Semaine ; courbe heure par heure seulement avec le bien-être ; « + » en Jour propose le bien-être sans quitter Jour. Reste : FC, phases du sommeil, SpO2 dans « + » = nouvelles courbes, proposition au propriétaire en mode polish ; **maquette de la proposition faite le 19/11 08:30** : [`maquettes/tendances-courbes/`](maquettes/tendances-courbes/README.md), réponse attendue « go courbes », « go phases » ou « non ») : en passant de Semaine à Jour, la mesure choisie (Sommeil) redevient
      Bien-être ; le « + » ne propose pas FC, phases du sommeil, SpO2 ni digestion (à vérifier : données reçues ?).
    - [ ] **POLISH-SIM-108 — Petits** (19/11 17:30 : **essai fait** : un jour « comme d’habitude » n’a plus de marque tenu / pas tenu dans le calendrier, `TrialDots.jsx`, test `Trial.test.jsx` ; sa tenue sert toujours au calcul. **« Encore N choses » : conforme à la spec** (`journee.SPEC.md` § 1 : « une pastille par tâche », la ligne Repas compte pour une chose jusqu’à 3 sur 3) ; compter chaque repas manquant changerait la bannière, le widget Android natif (`PilouWidgetRule.java`) et le lecteur d’écran : proposition au propriétaire, pas un correctif. **Lien retour fait (19/11 18:30)** : la page d’un essai, rangée sous Objectifs (onglet allumé, brief § 4), revient à « ← Votre bien-être » (`/recommendations/bien-etre`) ou « ← Votre confort digestif » (`/recommendations/ventre`) au lieu de « ← Agir » ; 2 tests `Trial.test.jsx`. Reste : export CSV, proposition) : « Encore 4 choses aujourd'hui » ne baisse pas après un repas noté ; essai : les
      jours « comme d'habitude » marqués « pas tenu » ; export CSV demandé (persona Tout mesurer : proposition, pas
      une fonction à coder sans accord). « Gêne » qui ne reste pas cochée : traité par UPG-4 (#1045).
    - [x] **UPG-3b** (19/11 08:30, run « idées ») : 2 simulations, « Prendre soin de soi, maigrir » J1 neuve
      (téléphone + balance) et « Stressé et pressé » J14 `--legacy --goals=stress,care --notes=few` (Galaxy Watch) :
      [`J1`](simulations/2026-11-19-0830-prendre-soin-J1.md), [`J14`](simulations/2026-11-19-0830-stresse-presse-maj-J14.md),
      [synthèse](simulations/2026-11-19-0830-synthese.md). Rien de perdu à la mise à jour. Constats vérifiés sur captures →
      POLISH-SIM-109 à 115. Écartés (outil) : carbonara de l'analyse factice, « Gold est prolongé », « Version installée :
      0.0.0 », pas « d'habitude » au jour 1. Reste d'UPG-3 : « Prendre soin de soi » en mise à jour, « Stressé » neuve.
    - [x] **POLISH-SIM-109 — « Humeur du jour » contredit la note** (FAIT 19/11 09:30 : titre « Humeur de » + nom du compagnon, test `CompanionHome.test.jsx`) (J14, prioritaire pour le 22/11) : note 2/5 à 08:34,
      la barre en tête de l'Accueil dit « De bonne humeur ». C'est l'humeur de Pilou (brief), mais rien ne le dit.
      Proposition : libellé « Humeur de Pilou », ou barre qui ne contredit jamais la note du jour (le plus simple qui
      suffit, d'après le brief § 5).
    - [x] **POLISH-SIM-105i — iPhone, temps 3 avant iOS 26.4** (FAIT 19/11 16:30 : `usePhoneUsageSupported` dans `Onboarding.jsx`, code partagé : `checkPhoneUsageAccess().supported` faux (iPhone avant iOS 26.4, Android 8) → pas de ligne au temps 2 sauf si déjà allumé, pas de « temps d’écran » dans « Activables » ni en tuile au temps 3 ; correctif iPhone 55 retiré ; 4 tests) : ne pas citer « temps d’écran » dans « Activables » quand `checkPhoneUsageAccess().supported` est faux (même logique que le correctif 55) : correctif minimal dans `iphone/patches/55-*` ou `available.screen` calculé depuis l'accès.
    - [x] **POLISH-SIM-110 — Nom d'un repas corrigé** (FAIT 19/11 13:30 : plus aucun aliment de l'IA → nom proposé non retouché effacé, description rendue telle quelle pour relancer, repas enregistré en saisie à la main ; nom tapé gardé ; tests `Food.test.jsx`. Le café oublié venait de l'analyse factice de l'outil) (J1) : après l'analyse, retirer les aliments proposés et en ajouter
      d'autres (yaourt, banane) garde le nom de l'analyse (« Pâtes à la carbonara ») et perd la description. Nom
      recalculé depuis les aliments restants s'il n'a pas été tapé, description gardée.
    - [x] **POLISH-SIM-111 — « Repas habituels » dès un repas** (FAIT 19/11 12:30 : seuil vérifié, le repas noté une fois y figure exprès — tests de `frequentMeals`, refaire un repas récent ; c'est le titre qui trompait : « Refaire un repas », test `Food.test.jsx`) (J1) : un repas noté une fois y figure déjà. N'y mettre
      qu'un repas noté au moins 2 fois (vérifier le seuil voulu dans le code avant).
    - [x] **POLISH-SIM-112 — Deux sens de « analyses »** (FAIT 19/11 12:30 : barre, carte du 7e jour et cérémonie disent « premiers résultats », comme Objectifs ; tests `CompanionHome`, `Ceremony7`) (J1) : Accueil « Jour 1 sur 7 avant vos premières analyses »,
      Repas « 20 analyses IA restantes ». Accueil : « avant vos premiers résultats ».
    - [x] **POLISH-SIM-113 — Nouveautés, phrase d'en-tête** (FAIT 19/11 12:30 : « la note importante d’abord, puis de la plus récente à la plus ancienne » seulement quand elle est en tête ; test `WhatsNew.test.jsx`) (J14) : la note à la une passe en tête (POLISH-SIM-101,
      voulu) mais la page dit encore « de la plus récente à la plus ancienne ». Adapter la phrase quand la note à la
      une est en tête.
    - [x] **POLISH-SIM-114 — Rappels introuvables** (FAIT 19/11 14:30 : bloc « Rappels » de Paramètres, `RemindersSetting.jsx` : note du soir, bilan digestif (sorti de « Vos objectifs »), portion du jour ; mêmes interrupteurs et préférences, caché là où rien ne se programme ; 4 tests) (J14, à vérifier sur Android) : les réglages des rappels sont
      répartis (note du soir dans la carte du visage, bilan du soir, essai, FODMAP) ; la persona pressée ne trouve
      rien pour « être peu dérangée ». Une ligne « Rappels » dans Réglages qui les regroupe (interrupteurs existants,
      aucun nouveau rappel).
    - [x] **POLISH-SIM-115 — Balance et poids à l'accueil** (FAIT 19/11 15:30 : titre « Avez-vous une montre, un bracelet ou une balance ? », « On les branche une seule fois », à « Oui » : « Une balance connectée ? Votre poids arrive aussi par Health Connect, à voir dans Tendances. » (Santé sur iPhone) ; 2 tests) (J1, téléphone + balance) : le temps 2 ne parle que de
      « montre ou bracelet » ; rien ne dit où voir son poids. « Montre, bracelet ou balance ? » et une ligne « votre
      poids arrive de la balance » (le poids est déjà dans Tendances). Pas d'objectif « maigrir » (brief § 3.1 : cible
      inchangée).
    - [x] **UPG-3c** (19/11 20:30, run « idées ») : 2 simulations, « Prendre soin de soi, maigrir » J45 en mise à jour
      (`--equipment=phone-scale --goals=care --legacy`) et « Stressé et pressé » J1 neuve (`--equipment=watch`) :
      [`J45`](simulations/2026-11-19-2030-prendre-soin-maj-J45.md), [`J1`](simulations/2026-11-19-2030-stresse-presse-J1.md),
      [synthèse](simulations/2026-11-19-2030-synthese.md). Rien de perdu à la mise à jour (essai, pesées, saisies).
      Constats vérifiés sur captures et dans le code → POLISH-SIM-116 à 121. Reste d'UPG-3 (8 parcours sur 10) :
      « Ventre, sans technique » en mise à jour, « Tout mesurer » neuve.
    - [x] **POLISH-SIM-116 — Trois délais pour le bien-être** (FAIT 19/11 21:30 : `Countdown` de `Recommendations.jsx` dit « Premier score dans N jours notés » et « Pistes au 14e jour noté » avant `FIRST_SCORE_DAY`, puis « Vos pistes dans N jours notés » et « Votre score est déjà dans Objectifs » ; digestion 14/28 de même) (J1, prioritaire pour le 22/11) : Accueil « Jour 1 sur 7 avant
      vos premiers résultats », Objectifs « 6 jours », page « Votre bien-être » (`Recommendations.jsx`, `resultsView.js`)
      « Encore 13 jours notés… 1/14 ». `objectiveCard('wellbeing')` compte 7 (brief : 7 jours bien-être), le compte à
      rebours de la page prend `daysNeeded` de l'analyse (14). Spec : la page dit le même palier que l'Accueil et
      Objectifs (premier résultat au 7e jour noté), puis, s'il reste un palier, le nommer comme pour la digestion
      (run du 19/11 04:30 : « premier score au 14e jour, pistes au 28e »). Vérifier ce qui s'affiche réellement au 7e jour.
    - [x] **POLISH-SIM-117 — Jour sans point pour une note** (FAIT 19/11 22:30 : cause, `loadFaceMoodEntries` ne lisait aucune note sans rafale du visage ; Tendances l'appelle avec `notesAlways`, notes de bien-être et digestives lues même sans caméra ; option `--no-face` de `npm run visual`) (J1) : Données › Tendances › Jour, note 2/5 de 20:33 (bulle
      Bien-être de l'Accueil) listée dans « Vos saisies » mais la courbe dit « Aucune lecture du visage ce jour-là »
      (`TrendsViewer.jsx` `DayChart` : `view.note` nul). Chercher pourquoi la note du jour n'arrive pas dans la vue Jour
      (type ou heure de la saisie par bulle), test d'abord ; message seulement sans lecture ni note.
    - [x] **POLISH-SIM-118 — Poids invisible en Semaine** (FAIT 19/11 23:30 : `SPARSE_MEASURES` de `trendsData.js`, 3 pesées sur le Mois et au moins une dans la semaine ; sans pesée dans la semaine, la puce grisée ramène au Mois) (J45, balance) : pesée tous les 3 jours → moins de
      `TREND_MIN_POINTS` (3) sur 7 jours, « Poids » absent du « + » de Semaine ; POLISH-SIM-115 promet « à voir dans
      Tendances ». Spec : une mesure espacée (poids) est proposée si elle a 3 points sur la plus longue période (Mois),
      et la Semaine trace les points qu'elle a. Test sur `buildTrendSeries` / `available`.
    - [x] **POLISH-SIM-119 — « Suivre une habitude » ouvre Paramètres en haut** (FAIT 20/11 01:30 : lien `/settings#habitudes`, Paramètres fait venir à l'écran la rubrique de l'ancre, sous la barre d'état) (J45) : depuis Ma journée, arrive sur
      Apparence ; mener à « Vos habitudes » (ancre et défilement, comme les autres liens vers une rubrique).
    - [x] **POLISH-SIM-120 — Essai en cours introuvable sous Objectifs** (FAIT 20/11 00:30 : carte « Essai en cours : … » en haut de la page de l'objectif, `homeTrial(rows, now, { outcome })` filtré par objectif ; un ancien essai sans objectif compte pour le bien-être) (J45, mise à jour) : sa page allume Objectifs et
      revient à « ← Votre bien-être » (#1128), mais ni Objectifs ni « Votre bien-être » ne le montrent ; seule la carte
      de l'Accueil y mène. Une ligne « Essai en cours : … jour N sur 10 » sur la page de l'objectif suivi.
    - [x] **POLISH-SIM-121 — Deux liens « comment c'est calculé »** (FAIT 20/11 02:30 : un seul « Comment c’est calculé » en bas ; sur le bien-être, il dit d’abord d’où vient le chiffre, Pilou compris, puis la comparaison et « Le détail » ; `HowWellbeing` fondu dans `HowItWorks({ wellbeing })`) (J1) : « Votre bien-être » montre « Comment est
      calculé votre bien-être ? » et « Comment c'est calculé » l'un sous l'autre ; n'en garder qu'un.
    - [x] **UPG-3d** (20/11 08:30, run « idées ») : 2 simulations, « Ventre, sans technique » J45 en mise à jour
      (`--equipment=watch --source="Samsung Health" --goals=gut --legacy`, config 15 : Galaxy Ring) et « Tout mesurer »
      J1 neuve (`--equipment=phone`, config 1 : Android seul) :
      [`J45`](simulations/2026-11-20-0830-ventre-sans-technique-maj-J45.md), [`J1`](simulations/2026-11-20-0830-tout-mesurer-J1.md),
      [synthèse](simulations/2026-11-20-0830-synthese.md). Rien de perdu à la mise à jour. **UPG-3 complet : 10 parcours
      sur 10.** Constats vérifiés sur captures et dans le code → POLISH-SIM-122 à 128.
    - [x] **POLISH-SIM-122 — Repas de midi rangé au matin** (fait le 20/11 09:30 : le cercle touché suit la photo
      ou la description (`payload.slot`, `mealSlotOfEntry`) ; créneau passé → milieu du créneau, modifiable dans
      « Décrire », éditable après coup ; créneau à venir → heure du geste, jamais dans le futur (`mealTimeError`) :
      écart assumé avec la spec « 12:30 à 08:34 », le cercle Midi se remplit quand même. Heure changée à la main → le
      cercle suit l'heure.) (J45, prioritaire pour le 22/11) : à 08:34, toucher le cercle
      « Midi » de Ma journée ouvre le repas à l'heure actuelle ; `mealSlotOf` (`services/dayChecklist.js`) le range
      par son heure, donc « Matin » se coche. Spec : le cercle touché passe son créneau à la page Repas ; si l'heure
      actuelle n'est pas dans ce créneau, l'heure du repas est proposée au milieu du créneau (08:00, 12:30, 19:30),
      modifiable ; dans le créneau, l'heure actuelle. Test : toucher Midi à 08:34 → repas à 12:30, cercle Midi plein.
    - [x] **POLISH-SIM-123 — Digestion notée le matin invisible** (fait le 20/11 10:30 : « Déjà noté » et « Noté à
      08:35 : Gêne » sous la ligne du soir, qui reste à faire ; Pilou sans « bonne soirée » le matin) (J45) : « Gêne » notée à 08:35 par le bouton Digestion
      n'apparaît ni dans « Déjà noté », ni dans le compteur ; la ligne dit toujours « Votre digestion ce soir · À partir
      de 18 h » et la bulle Digestion de l'Accueil reste à faire. `dayChecklist` ne lit que `gutEveningCheck` (le bilan
      du soir). Spec : toute note digestive du jour va dans « Déjà noté » ; la ligne du soir reste à faire avant 18 h
      mais dit « Noté à 08:35 : Gêne » sous son titre. Vérifier aussi « Reposez-vous bien » de Pilou à 08:35.
    - [x] **POLISH-SIM-124 — Accueil, temps 3 sans montre : rien de suivi** (fait le 20/11 10:00, en partie : sans
      montre, « Pas (votre téléphone) » est une tuile si Health Connect / Santé est relié, sinon « Activables dans
      Réglages › Sources : pas (votre téléphone) », et rien si le téléphone n'a ni l'un ni l'autre ; la ligne « Avec
      une montre » ne cite plus les pas. Pas de tuile sans accès : ce serait promettre ce qui n'arrivera pas. Reste
      **POLISH-SIM-124b** [x] (fait le 20/11 16:30 : à « Non », carte « vos pas, comptés par votre téléphone » et
      « Connecter Health Connect » / « Santé » ; accès donné → tuile « Pas (votre téléphone) » au temps 3 ; correctif
      iPhone 45 refait) : proposer la carte Health Connect / Santé aussi à « Non » au temps 2, pour que les pas du
      téléphone soient suivis dès l'accueil ; Pilou dit « Tout ça, je m'en occupe » au-dessus d'un écran sans tuile.) (J1, config Android seul, la plus fréquente) :
      l'écran « Ce que Halcya suit pour vous, sans rien faire » n'a aucune tuile ; « pas » n'est que dans « Avec une
      montre ou un bracelet » alors que le téléphone les compte et que le temps 2 l'a dit (`autoTiles` de
      `services/onboardingFlow.js` : les pas sont rangés avec la montre). Spec : sans montre, tuile « Pas (votre
      téléphone) » si Health Connect ou Santé est là ; la ligne montre ne cite plus les pas. Test « Temps 3 » sans montre.
    - [x] **POLISH-SIM-125 — Habitude à une heure inventée** (fait le 20/11 11:30 : dans « Vos saisies », une habitude n'a plus d'heure et vient après les saisies horodatées, comme dans « Déjà noté » de Ma journée ; seul endroit qui l'affichait) (J1) : Tendances › Jour › Vos saisies montre « 12:29 Café
      Oui » à 08:40 ; une habitude est rangée à 12 h + quelques minutes (`services/habits.js` l. 50). Spec : pas d'heure
      pour une habitude dans « Vos saisies » (et partout où une saisie est datée à l'heure), « aujourd'hui » à la place.
    - [x] **POLISH-SIM-126 — « Agir s'ouvre depuis le bas de l'Accueil »** (fait le 20/11 12:30 : petite étiquette « Agir » au-dessus du titre de l'essai, `home-act-kicker` ; la note des Nouveautés reste juste) (J45, essai en cours) : la note à la une
      (`2026-11-15-0435-refonte-navigation`) le dit, mais pendant un essai la carte du bas ne porte que son titre
      (« Dormir au moins 7 h 30 »), sans le mot Agir. Spec : petite étiquette « Agir » au-dessus du titre de l'essai
      sur la carte (`Dashboard.jsx` l. 144), ou phrase de la note ajustée ; le plus simple qui suffit.
    - [x] **POLISH-SIM-127 — Pas du matin face à une journée entière** (fait le 20/11 13:30 : avant 21 h, « d'habitude 6 717 par jour » sous les pas et l'écran (`partial` de `measureNorms`) ; aujourd'hui absent des courbes Semaine et Mois des pas et de l'écran (`cumulative` de `TREND_MEASURES`) ; correctif iPhone 56 refait. **POLISH-SIM-127b** fait le 20/11 15:30 : « D'après votre montre » seulement quand l'appareil est une montre connue (Huawei, Garmin, Apple Watch…), « votre bague » pour une bague (Oura…), « votre montre ou bague » quand l'app d'origine sert les deux, comme Samsung Health ou Gadgetbridge) (J1 et J45) : à 08:40, l'Accueil dit « 163,
      d'habitude 6 717 » et la courbe Semaine plonge à 0 pour aujourd'hui. Spec : avant la fin du jour, « d'habitude »
      compare à la même heure (ou dit « 6 717 sur une journée ») ; aujourd'hui en pointillé ou absent des courbes
      Semaine et Mois tant que le jour n'est pas fini. Petit : « D'après votre montre » avec une bague (« votre montre
      ou bague » selon l'appareil, ou « D'après Samsung Health »).
    - [x] **POLISH-SIM-128 — Famille Alimentation, encore technique** (fait le 20/11 14:30 : sans piste, la famille Alimentation dit « Rien à éviter pour l'instant : aucun aliment ne va nettement avec une digestion moins bonne (un bien-être moins bon). Continuez à noter vos repas. » ; dans toutes les familles, « Ce qui a été comparé » montre « N facteurs comparés, délai par délai. » et les lignes chiffrées derrière le chevron, avec « Chaque délai se lit à part… » quand plusieurs délais sont montrés ; une piste nette nommait déjà ses aliments par `pistePlain`) (J45, suite d'UPG-9) : la page de la famille
      (Objectifs › Confort digestif › Alimentation) commence par « Aucun lien assez net » puis liste fructose en excès,
      sorbitol, GOS, « pt » et barres d'erreur, sans nommer un aliment ; la persona ne sait pas quoi éviter. Spec : sous
      le titre, une phrase simple (comme `pistePlain`) qui nomme les aliments du groupe le plus net, ou « Rien à éviter
      pour l'instant : notez encore… » ; les lignes chiffrées derrière « Détails ». Sorbitol +0,2 court terme et −0,8
      moyen terme : dire que les deux délais se lisent séparément (ou n'en montrer qu'un par défaut).
  - **Passage des personas du 21/11 08:30 (PERSONAS-2111, avant l'objectif du 22/11)** : « Tout mesurer » J14 en mise à jour
    (iPhone seul, joué sur l'apparence Android) et « Stressé et pressé » J1 neuve (Android seul). Synthèse :
    `simulations/2026-11-21-0830-synthese.md`. Rien de perdu à la mise à jour (14 jours, essai jour 4 sur 10).
    - [x] **POLISH-SIM-129 — Accueil, le « + » de « Vos données du jour » ne fait rien** (fait le 21/11 09:30 : « + » retiré de `TodayBySource` ; le second « + » mort de l'Accueil, celui de `DayStatusCard`, ouvre la note de bien-être par `onAddManual` (`StripPlus` prend un `onClick`), et n'est pas rendu sans elle ; `DigestBlock`, seul autre `StripPlus`, est dans Ma journée avec le bandeau) (J14, vérifié dans le code) :
      `StripPlus` (`components/TodayBySource.jsx` l. 109) appelle `scrollToStrip()`, qui cherche `#today-add` ; le
      bandeau d'ajout (`AddStrip`) n'est plus rendu que dans Ma journée (`Dashboard.jsx`, `{day && <AddStrip …>}`),
      alors que `TodayBySource` n'est rendu que sur l'Accueil (`{home && …}`). Touché deux fois, rien. Correctif : retirer
      le « + » de ce bloc (des données automatiques, rien à y ajouter ; leçon 7, une action, un endroit), ou le faire
      mener à Ma journée. Vérifier aussi les autres `StripPlus` hors de Ma journée. Test : aucun bouton mort sur l'Accueil.
    - [x] **POLISH-SIM-130 — Tendances oublie les courbes choisies** (fait le 21/11 10:30 : choix gardé pour la session dans `halcya.trends.keys` (`services/trendsKeptKeys.js`, `onKeys` de `TrendsViewer`), hors mode exemple ; `?mesure=` et `?vue=jour` gardent la priorité ; effacé par « Supprimer toutes mes données ») (J14, vérifié) : Bien-être + Pas choisis, on passe
      à un autre onglet, au retour il ne reste que Bien-être (`TrendsViewer.jsx` l. 276, `useState(initialKeys)` refait
      au montage). Correctif : garder le choix pour la session (sessionStorage, clé `halcya.trends.keys`), un lien
      `?mesure=` gardant la priorité. Test au remontage.
    - [x] **POLISH-SIM-131 — Ma journée, pastilles contraires au décompte** (fait le 21/11 12:30 : reproduit à la lecture, `PilouBanner` met `is-todo` sur ce qui reste mais `DayChecklist.css` remplissait `.is-todo` ; pleine = fait désormais, comme les repas de comprendre.SPEC ; test `dayDotsFill.test.js`) (J1, à reproduire avant tout code) :
      « Encore 1 chose aujourd'hui » avec une pastille pleine et deux vides, alors que bien-être et Méditation sont
      notés et seuls les repas restent (« Déjà noté (2) ») ; `dayChecklist` donne repas (à faire), bien-être (fait),
      habitude (faite), donc ○●● attendu. Capture `simulations/captures/2026-11-21-0830-stresse-presse-J1/ma-journee-points.png`.
      Reproduire avec `npm run persona -- --day=1` (note 2/5 puis « Non » à Méditation) ; peut-être l'état d'avant la
      dernière réponse.
    - [x] **POLISH-SIM-132 — Accueil temps 4, « 3 choses par jour »** (fait le 21/11 11:30 : `dailySummary(notes, habitCount)` nomme ce qui se note, « Repas, bien-être et 1 habitude · environ 1 minute ») (J1) : la liste montre Repas « en photo, 3 par
      jour », Bien-être et une habitude, et le bas dit « 3 choses par jour · environ 1 minute » ; la persona compte 5
      gestes (`dailySummary(count)`, `services/onboardingFlow.js`). Proposer « Repas, bien-être et 1 habitude · environ
      1 minute » ou compter les repas à part. Texte seul.
    - [x] **POLISH-SIM-133 — Accueil temps 3 vide sans Health Connect** (fait le 21/11 12:30 : rien de suivi seul → titre « Pour l’instant, vous notez vous-même », Pilou « Pour l’instant, c’est vous qui notez. Je garde tout. », sans « rien à valider » ; capture `--onboarding=auto-quiet`) (J1, mineur) : si Health Connect est indisponible
      (`health === 'unavailable'` : Android trop ancien, ou la version web des personas), le temps 3 dit « Tout ça,
      je m'en occupe » au-dessus d'une liste vide (« Activables : météo » seulement). Dans ce cas, une bulle et un titre
      qui ne promettent rien de plus (« Pour l'instant, vous notez ; la météo s'active dans Réglages »).
    - Proposition (fonction nouvelle, pas de code sans accord) : « Calories d'activité » dans le « + » de Tendances
      (le téléphone les envoie, la persona « Tout mesurer » ne les trouve nulle part ; Nutrition ne montre que les kcal
      mangées).
  - **Passage des personas du 21/11 20:30** (run « idées », [`synthèse`](simulations/2026-11-21-2030-synthese.md) ;
    « Ventre, sans technique » J45 après la mise à jour et « Prendre soin de soi » J14, iPhone seul tous deux) :
    - [x] **POLISH-SIM-134 — Accueil, « Aucune photo prise » coupé à gauche** (FAIT 21/11 21:30 : portail vers
      `document.body` dans `MealPhotoButton.jsx`, test d'abord, capture de l'Accueil relue) (J14, vérifié : capture
      `bulle-repas-coupee.png` et `App.css` 980) : toucher la bulle Repas puis annuler la photo ouvre l'avis
      `.meal-photo-missed` (`position: fixed`, `left: 50%`, `translateX(-50%)`), rendu dans la scène de l'île dont un
      parent a une transformation : il se place par rapport à la scène, pas à l'écran, et on ne lit que « …se. Décrire
      le repas ». Le rendre dans un portail (`document.body`) ; test qui vérifie qu'il n'est pas enfant de la scène.
    - [x] **POLISH-SIM-135 — Bandeau Nouveautés, « et 98 autres changements »** (FAIT 21/11 23:30 : `othersLabel`
      dans `WhatsNewBanner.jsx`, compte exact jusqu'à 3, test d'abord, capture `--whats-new` relue) (J45 mise à jour, vérifié :
      `WhatsNewBanner.jsx` 25) : après une semaine sans ouvrir l'app, le compte fait peur. Au-delà de 3, « et d'autres
      nouveautés » ; la note à la une reste.
    - [x] **POLISH-SIM-136 — Objectifs ne montre pas l'essai en cours** (FAIT 21/11 22:30 : ligne `TrialLink` sous le
      titre d'Objectifs, composant partagé avec POLISH-SIM-120, test d'abord, captures relues) (J45, vérifié : `TabBar.jsx` range
      `/agir/essai` sous Objectifs, `Objectives.jsx` ne parle d'aucun essai) : l'essai ne se retrouve qu'en bas de
      l'Accueil. Une ligne « Essai en cours : Dormir au moins 7 h 30 · jour 4 sur 10 » en haut d'Objectifs, qui ouvre
      l'essai.
    - [x] **POLISH-SIM-137 — Ma journée, pas de chemin vers les repas passés** (FAIT le 22/11 00:30 : lien « Vos repas » sous les cercles, vers `/food`, test d'abord) (J45 mise à jour) : les repas notés
      avant la mise à jour ne se retrouvent que par Données › Nutrition › « Tous vos repas ». Un petit lien « Vos
      repas » sous les cercles des repas de Ma journée.
    - [x] **POLISH-SIM-138 — Écran d'essai, « Aujourd'hui, jour avec. » et « 1 jour avec tenu sur 5 »** (FAIT le 22/11 01:30 : « Aujourd’hui : dormir au moins 7 h 30. » ou « Aujourd’hui : comme d’habitude, rien à changer. », « 2 jours réussis sur 5 », Pilou « Chaque jour réussi allume une lanterne. » et « Bravo pour vos N jours réussis. » ; tirage inchangé, test d'abord) (J45,
      mineur) : la persona ne sait pas si elle a réussi. Dire ce que le jour demande (« Aujourd'hui : dormir au moins
      7 h 30 ») et compter en mots simples ; à faire avec les lanternes (LANT-*), sans toucher au tirage.
    - À étudier (J14, « Prendre soin de soi ») : le poids noté dans le profil Nutrition n'alimente pas la mesure
      « Poids » de Tendances (`trendsData.js`, champ `weightKg`, rempli par Health Connect ou Santé) ; sans balance, la
      persona ne voit jamais son poids évoluer. Vérifier d'abord si une saisie manuelle de poids existe ailleurs ;
      sinon proposition avec maquette (fonction nouvelle).
  - **Passage des personas du 22/11 08:30** (run « idées », [`synthèse`](simulations/2026-11-22-0830-synthese.md) ;
    « Stressé et pressé » J1, iPhone + Apple Watch, et « Ventre et données » J14, Android seul) :
    - [x] **POLISH-SIM-139 — Digestion du matin prise pour le bilan du soir** (FAIT le 22/11 09:30 : « Dans la journée : gêne à 08:34 » dans Ma journée ; feuille de la bulle : « Le bilan de la journée se note le soir, à partir de 18 h. », « Une gêne ou une douleur se note à tout moment. » et « Noter un moment » vers Ma journée ; règle et données inchangées, tests d'abord) (J14, vérifié : capture
      `accueil-bulles.png`, `DayChecklist.jsx` 152, `CompanionHome.jsx` 233) : une gêne notée à 08:34 s'affiche sous
      « Votre digestion ce soir » (« Noté à 08:34 : Gêne »), si bien que la persona croit sa digestion faite ; la bulle
      Digestion reste sur l'Accueil et sa feuille ne dit que « Elle se note le soir, à partir de 18 h ». Écrire le
      moment comme un moment (« Dans la journée : gêne à 08:34 ») et, dans la feuille, rappeler qu'un moment se note à
      tout instant (lien vers la saisie) et que le bilan du soir arrive à 18 h. Ne change ni la règle ni les données.
    - [x] **POLISH-SIM-140 — Accueil, « Décochez les habitudes… » avec une seule cochée** (FAIT le 22/11 09:30 : « Cochez les habitudes qui vous parlent. », test d'abord) (J1, vérifié :
      `Onboarding.jsx` 724, capture `habitudes.png`) : Méditation seule est cochée d'office, les trois autres non.
      Écrire « Cochez ce qui vous parle. » (ou cocher selon l'objectif, comme le texte le suppose).
    - [x] **POLISH-SIM-141 — « Repéré sans vous : Sport le soir » le matin** (FAIT le 22/11 09:30, autrement que proposé : la phrase ne dit pas qu'une séance a eu lieu, elle nomme ce que l'app repère seule (`autoDetectedTagIds` lit une capacité : des séances enregistrées ces derniers jours) ; « hier soir » aurait été faux un jour sans sport. Elle dit maintenant « Suivi sans vous, inutile de cocher : Sport le soir (séance après 18 h). », test d'abord) (J1, mineur ; `behaviorTags.js` 55, effet
      le lendemain) : dans une note de 08:35, dire « Sport hier soir ».
    - [x] **EXPORT-CSV — l'export CSV promis n'existe pas** (FAIT le 22/11 10:30 : Réglages › Sauvegarde, carte « Exporter pour un tableur », bouton « Télécharger en CSV » ; `services/csvExport.js` (une ligne par saisie, ordre chronologique, Date ; Heure ; Quoi ; Type ; Source ; Aliments, puis une colonne par champ ; point-virgule, virgule décimale, BOM UTF-8, formules neutralisées, fuseau et longues chaînes laissés de côté) et `services/saveTextFile.js` (Documents puis partage sur Android et iPhone, téléchargement ailleurs) ; tests d'abord ; démo : 1 850 lignes, 87 colonnes, 360 Ko ; rien ne quitte le téléphone sans geste, Sécurité des données inchangée) (vérifié : aucun `text/csv` dans `app/src`) : la décision
      du 20/10 range « export CSV / JSON » dans le gratuit pour toujours (PRODUIT.md, modèle économique), la persona
      « Ventre et données » le cherche pour son tableur ; c'est une décision existante, pas une fonction nouvelle (rang
      de PROP-SIM-10 à revoir) : notes, digestion, repas et mesures du jour, une ligne par saisie, depuis Données ›
      Sauvegarde, test d'abord.
    - À étudier : Tendances › détail d'un jour, « Confort digestif 2,4/5 · vous avez noté « douleur » (1) · estimé
      avec les jours voisins » ; la persona veut voir sa note telle quelle pour sa gastro-entérologue. Le lissage est
      voulu (incertitude montrée) ; piste : tracer la note en point plein et garder l'estimation en bande.
      → **POLISH-NOTE-LOSANGE, fait le 25/11 11:30** : en Semaine et en Mois, la note telle que donnée en losange
      (même signe que dans la vue Jour) quand l'estimation s'en écarte d'au moins 0,25 point (`NOTE_APART`,
      `trendsData.js`) ; légende « votre note · l'estimation du jour » seulement si un losange est tracé ; `noted` par
      jour dans `estimateStates` (note moyenne du jour, niveau du ventre le plus fort). Affichage seulement. Tests
      `stateSpace`, `trendsData`, `Trends` d'abord ; captures clair, sombre, bien-être relues.
    - [ ] **METHODE-ECHELLE-VENTRE — Échelle du ventre dans TS-1** (né de POLISH-NOTE-LOSANGE, 25/11 11:30 ; run
      « idées », banc avant tout changement) : `GUT_VALUE` (calme 4,5, gêne 2,5, douleur 1 en interne) donne à
      l'écran 4,6 / 3 / 1,8, alors que l'app dit « Calme 5, Gêne 3, Douleur 1 » ; un jour de douleur ne peut pas
      descendre sous 1,8 et un jour calme jamais atteindre 5. Mesurer au banc (vérité connue) ce que donnerait
      5 / 2,5 / 0 en interne : erreur du jour, fourchette juste, tailles d'effet de digestion (`GUT_SPAN`,
      METHODE-BIAIS-5) et visite guidée du jour 28. Ne rien changer au modèle sans ce banc.
  - **Passage des personas du 22/11 20:30** (run « idées », [`synthèse`](simulations/2026-11-22-2030-synthese.md) ;
    « Prendre soin de soi » J1, iPhone seul, et « Tout mesurer » J14, Android seul) :
    - [x] **POLISH-SIM-142 — La visite guidée gonfle la jauge « Humeur de Pilou »** (J1, vérifié : capture
      `accueil-apres-visite.png`, `mood.js` 40, `CompanionHome.jsx` 321) : « Exemple au jour 14 » affiche l'Accueil
      rempli de données fictives, et `dayMood` y enregistre le cran de l'exemple dans `halcya.companion.moodDay`
      (gardé pour la journée, jamais redescendu). Revenue sur son vrai Accueil, la persona voit « Ravi » avec 3 bulles
      à faire et aucune saisie. Proposition : en mode exemple, calculer le cran sans l'écrire (storage nul) ; test
      d'abord (exemple puis vrai Accueil : « Tranquille »). **Fait le 22/11 21:30** : `CompanionHome.jsx` passe
      `storage: null` à `dayMood` en mode exemple ; test `CompanionHome.test.jsx`.
    - [x] **POLISH-SIM-143 — Détail du jour, « Moins de fibres que d'habitude (3 g) » un jour sans repas** (J14, à
      vérifier avant de coder : `TrendsDayDetail.jsx`, contributions du modèle d'Analyses) : la persona n'avait encore
      rien mangé de noté le 22/11 (Repas 0/3). Soit la contribution lit la veille (délai J-1 du modèle) et le texte
      doit le dire (« la veille »), soit un jour sans repas ne doit pas avoir de fibres. Capture
      `detail-jour-fibres.png`. **Fait le 22/11 22:30** : un jour sans repas noté, la nutrition est inconnue et la
      fenêtre « jour même et veille » ne lit que la veille ; `dayContributions` le marque (`eveOnly`) et la ligne dit
      « La veille, moins de fibres que d’habitude (3 g) ». Tests d'abord (`analysisResults`, `trendsDay`).
    - [x] **POLISH-SIM-144 — « la zone grise, votre habitude » sous la carte humeur et éveil** (J14, mineur ;
      `TrendsDayDetail.jsx` 147) : l'habitude est dessinée par un contour gris, pas une zone remplie. Dire « le cercle
      gris, votre habitude ». **Fait le 22/11 21:30** (`Trends.test.jsx`).
    - [x] **PERSONAS-OUTIL-1 — `--goals=` des installations neuves suit encore l'ancien accueil** — FAIT 23/11 16:30 (`freshOnboarding` de `personaData.mjs` : `wellbeing`, plus `gut` pour gut, all ou cycle, `goalsVersion: 2` ; `--legacy` inchangé ; test `personaData` ; essai réel `--goals=all` au 14e jour : bulle Digestion présente) : `--goals=all` (Tout
      mesurer) écrit `goals: ['all']` sans `goalsVersion`, que la migration de l'étape 5a convertit en bien-être seul ;
      la persona n'avait donc pas « Confort digestif » et cherchait en vain où noter sa digestion (constat écarté : sans
      cet objectif, l'app ne demande jamais le ventre, brief § 3.2). Pour un jour > 1 sans `--legacy`, écrire les
      objectifs de la refonte (`wellbeing`, plus `gut` pour Ventre 1 et 2 et Tout mesurer) avec `goalsVersion: 2`, et
      mettre à jour la correspondance de `simulations/README.md`.
    - À étudier (2e persona qui le cherche, après celle du 21/11) : noter son poids à la main sans balance. Rien dans
      Ma journée › Autre chose ni dans Objectifs ; le poids du profil Nutrition n'alimente pas Tendances. Fonction
      nouvelle hors du brief : proposition avec maquette au propriétaire, pas de code.
    - [x] FAIT 23/11 19:30 (#1222 : une phrase tirée de `OBS_SD` de `stateSpace.js`, « Votre note compte environ 5 fois plus que le visage au départ, puis selon l’accord des deux chez vous » ; test `Recommendations.test.jsx`). « Ma note 4/5 et 4 lectures du visage à 2,8 donnent 3,7 ? » La page « Comment c'est calculé » dit que
      les deux sources sont réunies sans dire leur poids ; une phrase sur le poids de la note du jour aiderait la
      persona « Tout mesurer ».
  - **Passage des personas du 23/11 08:30** (run « idées », [`synthèse`](simulations/2026-11-23-0830-synthese.md) ;
    « Ventre, sans technique » J1, iPhone + bracelet d'une autre marque, et « Stressé et pressé » J14 après mise à
    jour, iPhone seul ; joués sur l'apparence Android) :
    - [x] **POLISH-SIM-145 — Galet noir à côté de Pilou dans « Par famille »** — FAIT 23/11 09:30 (PR du run : `--lilac-label` dans les deux thèmes, `[data-tone=lilac]` passe par elle, test « chaque teinte a son `-label` et son `-track` ») (J14, vérifié : capture
      `bien-etre-familles.png`, `companion/life/Cairn.jsx` 19, `theme/tokens.css`) : le galet de la famille Activité
      est peint `var(--lilac-label)`, qui n'existe pas (le lilas n'a que `bg`, `text`, `bar`, `track` ; ailleurs
      `--tone-label` du lilas vaut `--lilac-bar`), d'où un ovale noir en clair comme en sombre dès qu'Activité a un lien.
      Correctif : `--lilac-label: var(--lilac-bar)` dans les deux thèmes (ou le galet passe par `data-tone`), et un test
      qui vérifie que chaque teinte des familles a sa variable `-label` et `-track`. Le plus visible et le plus petit.
    - [x] **POLISH-SIM-146 — « Moins de pas que d'habitude (4 374) » le matin, l'Accueil dit 162 pas** — FAIT 23/11 14:30 (`dayContributions` : le jour du calcul, pas, activité et écrans ne lisent que la veille, « La veille, moins de pas… » ; jours passés inchangés ; test `analysisResults`) (J14, vérifié :
      capture `tendances-jour.png`, `analysisResults.js` 869, `trendsDay.js` 213) : au court terme, la valeur dite est
      la moyenne du jour même et de la veille ((162 + ~8 590) / 2) ; le jour en cours, un cumul (pas, activité, écran)
      n'est que partiel à 08:33. Proposition : pour aujourd'hui, un cumul du jour ne compte pas encore (fenêtre lue sur
      la veille, ligne « La veille, moins de pas… » comme POLISH-SIM-143), ou la ligne dit « hier et aujourd'hui ».
      Vérifier d'abord au banc que l'effet ne change pas les jours passés ; tests d'abord.
    - [x] **POLISH-SIM-147 — « Bien-être 3,4/5 estimé » au jour 1, sans note ni lecture** — FAIT 23/11 09:30 (`observedAny` de `buildTrendSeries` ; détail du jour « Pas encore de note » ; tests `trendsData` et `Trends`) (J1, vérifié : capture
      `tendances-bienetre-estime.png`, `trendsData.js` 213 `detailSource`) : sur la courbe vide (« Aucune lecture du
      visage ce jour-là »), la ligne du jour donne un chiffre tiré de rien, alors que l'Accueil demande encore de noter.
      Ne pas afficher de valeur du jour tant que la série n'a aucune observation (ni note ni lecture) ; « Pas encore
      de note » à la place. Tests d'abord.
    - [x] **POLISH-SIM-148 — Le cadeau du jour cache « Bien-être » sur l'île** — FAIT 23/11 10:30 (`GIFT_SPOT` de `bubbles.js` : coin bas gauche, hors de l'orbite à toutes les rotations ; test `bubbles.test.js`) (J1, vérifié : capture
      `accueil-jour1sur7.png`) : la bulle dorée se pose sur le libellé de la bulle Bien-être (île de 412 px de large).
      Décaler le cadeau (bord de l'île) ou la bulle ; capture `npm run visual` au jour 1 avant et après.
    - [x] **POLISH-SIM-149 — « analyses digestives » au 28e jour, « premier score » au 14e** — FAIT 23/11 09:30 (titre « … avant vos pistes digestives » ; test `DigestBlock`) (J1, `DigestBlock.jsx`
      133, `firstWeek.js` 53) : deux échéances voulues (brief § 3.5, `firstResults.js`), mais nommées sans lien ; la
      persona lit trois délais (7, 14, 28). Dans Ma journée, nommer la seconde comme Objectifs et la visite
      (« vos pistes digestives ») ; texte seulement, test SLOP et test de `firstResults` d'abord.
    - [x] **POLISH-SIM-150 — Agir : « Faire au moins 8 683 pas », l'Accueil dit « d'habitude 6 327 »** — FAIT EN PARTIE 23/11 15:30 (cible arrondie : pas à la centaine, sommeil et écran à 5 min, `MEASURED.round` de `trials.js` ; test `trials`). Reste à étudier : partir de la même habitude que l'Accueil (médiane de 14 jours) au lieu du centre du modèle, ce qui change la cible des essais (banc à écrire d'abord) (J14, mineur ;
      `trials.js` 73 : seuil = centre du modèle + 2 000 ; l'Accueil lit la médiane récente, `dayDeviations.js` 114) :
      deux « habitudes » pour la même mesure (méta-leçon 3). Partir de la même habitude que l'Accueil, ou arrondir la
      cible (8 700) et dire « environ 2 000 de plus que d'habitude ». À vérifier contre le banc des essais.
    - [x] **PERSONAS-OUTIL-2 — L'analyse factice rend toujours « Pâtes à la carbonara »** — FAIT 23/11 13:30 (`scripts/persona/fakeMeal.mjs` : une description écrite revient avec ses aliments, cherchés dans la table par leur premier mot, « tartine » → pain ; photo ou rien de reconnu : le plat d'exemple ; test `fakeMeal.test.mjs` ; `brief.md` dit que l'analyse est simulée) (`persona-browse.mjs` 87) :
      une persona qui décrit « 2 tartines, café au lait » croit à une erreur de l'IA. Faire reprendre au faux relais
      les mots de la description (un aliment par mot connu de la table), et dire dans `brief.md` que l'analyse est
      simulée.
    - Écartés, avec la raison, dans la synthèse : jauge de Pilou après une note de 2/5 (déjà écarté le 22/11 : elle
      suit les bulles faites) ; deux essais en même temps (voulu, ORG-1b) ; « Version installée : 0.0.0 » (build web
      de l'outil) ; écran Gold après « 4 sur 4 », nom en deux temps, visite en 10 bulles (déjà écartés) ; « Voir un
      exemple » au 14e jour (voulu, sans délai écrit).
    - [x] **POLISH-SIM-155 — L'ancien objectif « stress » devenu « Bien-être » sans un mot** (FAIT le 24/11 à 03:30 :
      Réglages › Vos objectifs, liste « Vos anciens objectifs » de POLISH-SIM-100, ligne « Mon stress et mon sommeil :
      Bien-être le remplace, le sommeil en fait partie. », aussi pour l'ancien `goal: 'energy'` ; `Settings.jsx`, tests
      `Settings.test.jsx` ; la carte « Nouveau » reste générale, plutôt qu'une note de plus pour une seule cohorte).
    - [x] **POLISH-SIM-156 — « Cœur » promis à l'étape 3 de l'accueil** (FAIT le 24/11 à 04:30 : « Cœur » passe des
      tuiles sûres à la ligne « Selon votre montre : cœur, variabilité cardiaque, respiration, température de la
      peau. », comme la VFC ; PERSONAS.md : FC partielle ou absente chez plusieurs bracelets qui écrivent dans Santé
      ou Health Connect ; `onboardingFlow.js` (`maybe: true`), tests `Onboarding.test.jsx`).
    - [x] **POLISH-SIM-157 — Mots FODMAP sans aliment hors de la carte des pistes** (FAIT le 24/11 à 05:30, mergée #1231 à 06:30 : dans
      « Ce qui a été comparé » d'Objectifs, chaque groupe FODMAP dit ses aliments, « 1 repas riche en sorbitol
      (FODMAP : pruneaux, prunes) de plus » ; le mot FODMAP reste (POLISH-SIM-55) ; aliments repris des repères de
      `fodmapChallenge.js`, une seule liste ; `analysisResults.js`, `pistePlain` de `Recommendations.jsx` inchangé
      à l'écran ; tests `analysisResults` et `Recommendations`). La carte d'un repas nomme déjà l'aliment
      (« Riche en fructanes pain blanc ») : laissée telle quelle (N4, demande du propriétaire du 26/10).
  - **Passage des personas du 23/11 20:30** (run « idées », [`synthèse`](simulations/2026-11-23-2030-synthese.md) ;
    « Tout mesurer » J1, Samsung + Galaxy Watch, et « Prendre soin de soi » J14, Android seul) :
    - [x] **POLISH-SIM-151 — « Poids » de l'Accueil ouvre Tendances sans courbe Poids** (FAIT le 23/11 à 22:30 : Tendances dit « Poids : la courbe arrive à 3 pesées. » quand la mesure demandée n'a de courbe ni en Semaine ni en Mois ; `TrendsViewer.jsx`, test `Trends.test.jsx`) (J14, vérifié : capture
      `poids-sans-courbe.png` ; `TodayBySource.jsx` 125 fait un lien dès une pesée, `trendsData.js` ne propose le
      poids qu'à 3 pesées dans le mois) : ne faire le lien que si la mesure est dans `available`, ou dire dans
      Tendances « Poids : la courbe arrive à 3 pesées ». Test d'abord.
    - [x] **POLISH-SIM-152 — Ma journée : la liste remonte sous le doigt** (FAIT le 24/11 à 00:30 : une habitude répondue reste sur place, « Noté », tant qu'il en reste à répondre, et la dernière réponse les range toutes ; effet avant l'affichage, plus de saut d'une image ; `DayChecklist.jsx`, test `DayChecklist.test.jsx`) (J1, capture `journee-liste-decalee.png`) :
      une habitude répondue disparaît aussitôt, le toucher suivant valide la ligne d'après (« Café » au lieu
      d'« Étirements »). Garder la ligne répondue sur place un court instant (état « fait ») avant de la ranger.
    - [x] **POLISH-SIM-153 — Portion invraisemblable acceptée sans un mot** (FAIT le 24/11 à 00:30 : au-delà de 2 kg pour un aliment, « 5 kg, c’est bien ça ? » sous la ligne, sans rien bloquer ; un seul plafond, pas un par aliment ; `MealEditor.jsx`, test `MealEditor.test.jsx`) (J14, capture `pates-5000g.png`) : 5 000 g
      et 5 800 kcal s'enregistrent. Alerte douce au-delà d'un plafond par aliment (« 5 kg, c'est bien ça ? »).
    - [x] **POLISH-SIM-154 — Pilou coupé derrière la carte de Tendances** (FAIT le 24/11 à 01:30 : fenêtre de la petite tête passée de 34 à 48 px dans `Guide.css`, la tête entière dépasse, une main posée sur le bord de la carte ; captures clair et sombre, démo et pesée seule) (J1 et J14, captures
      `tendances-pas-auj.png`, `poids-sans-courbe.png`) : seul le haut de la tête dépasse.
    - [x] **PERSONAS-OUTIL-3 — Faux relais des repas** (FAIT le 24/11 à 02:30 : premier mot cherché accents compris
      puis sans accents, « 200 g » ou « 1,5 kg » font la quantité, le nom du plat est le premier morceau sans sa
      quantité ; 3 tests ; `app/scripts/persona/**` ne lance plus le build iPhone de PR) (`scripts/persona/fakeMeal.mjs`) : « pâtes » reconnu comme
      « Pâté breton », grammes écrits ignorés (« 200 g de saumon » → 500 g), description entière gardée comme nom.
    - Écartés, avec la raison, dans la synthèse : pas du jour absents du graphique (voulu, POLISH-SIM-127) ; trois
      délais (déjà POLISH-SIM-149) ; « selon votre montre » (déjà à étudier) ; bien-être 2,9 / 3,0 ; onglet Données
      surligné pendant la saisie d'un repas.
    - À étudier : FC moyenne, oxygène du sang et phases de sommeil reçus mais visibles nulle part (le « + » de
      Tendances n'a que Sommeil et Pas pour une Galaxy Watch) : proposition au propriétaire. Poids, 3e persona qui le
      cherche (21, 22 et 23/11) : pesée seulement dans Données › Nutrition › Compléter mon profil, rien dans Ma
      journée › Autre chose ni dans Objectifs ; maquette faite le 24/11 08:30 (PROP-SIM-19, `maquettes/poids/`).
  - **Passage des personas du 24/11 20:30** (run « idées », [`synthèse`](simulations/2026-11-24-2030-synthese.md) ;
    « Ventre et données » J45, Android seul, et « Tout mesurer » J14 après mise à jour, Android + Amazfit par Zepp) :
    - [x] **POLISH-SIM-158 — Tendances : « Pas » disparaît de « + » sans un mot** (J14, capture
      `tendances-selecteur.png` ; `canAddMeasure` de `trendsData.js` 133 : deux unités au plus) : avec Bien-être (/5)
      et Sommeil (h), Pas n'est plus proposé. Le montrer grisé avec « Deux unités au plus : retirez une courbe ». Test
      `Trends.test.jsx` d'abord.
    - [x] **POLISH-SIM-159 — Essai : « Jour 4 sur 10 » puis « 1 jour réussi sur 5 »** (J14, capture `essai-jour4.png` ;
      `Trial.jsx` 179, `goal` = jours « avec » du tirage) : deux totaux côte à côte. Dire ce que compte le second
      (« 1 jour à 7 h 30 réussi sur 5 prévus », ou « lanternes : 1 sur 5 ») ; texte seulement, test SLOP d'abord.
      Vérifier au passage pourquoi la ligne « Sans » reste vide au jour 4 (jours 2 et 3 « comme d'habitude ») : outil
      `--legacy` sans note les lendemains, ou défaut.
      → 24/11 22:30 : 158 et 159 faits (texte « Consigne tenue 1 jour sur 5 prévus »). Reste à vérifier : la ligne
      « Sans » vide au jour 4 (outil `--legacy` ou défaut), au prochain run « idées ».
      → 25/11 08:30 (run « idées ») : **défaut réel**, pas l'outil. Les jours « sans » dont la nuit dépasse 7 h 30
      sont comptés « non tenus » et écartés, alors que l'écran demandait « comme d'habitude ». Banc à vérité connue :
      [`methode/ESSAI-SANS.md`](methode/ESSAI-SANS.md) → **POLISH-ESSAI-SANS** ci-dessous.
    - [x] **POLISH-ESSAI-SANS — Compter les lendemains par calendrier** (**MERGÉE 25/11 10:30, #1258, v916** ; banc du 25/11 08:30, `methode/ESSAI-SANS.md` ;
      `trials.js` `pick`) : la règle actuelle ne garde que les jours « tenus » ; elle ne conclut qu'un essai de 10
      jours sur deux (47 %), gonfle l'écart (0,70 pour 0,30) et, sans effet réel mais avec un facteur caché, penche
      vers « Plutôt oui » (+0,14). Compter tous les jours passés selon le calendrier tiré au sort : 100 % concluent,
      écart sans biais, fausses alertes symétriques (≈ 4 %). La tenue reste pour les lanternes et « Consigne tenue ».
      Tests `trials.test.js` d'abord (jour sans au-dessus du seuil compté, jour avec manqué compté, cas tout tenu
      inchangé). Aucun changement de schéma ; code commun, iPhone dans la même PR. **Fait le 25/11 09:30** : `pick`
      garde tous les jours passés du calendrier ; deux tests (`trials.test.js`) ; capture de l'essai au jour 8 relue.
    - [x] **POLISH-SIM-160 — Objectifs › Sommeil : « 2 facteurs comparés » sans les nommer** (J14, capture
      `objectifs-sommeil-vide.png` ; `FamilyDetail` de `Recommendations.jsx` 367, cas sans barres) : nommer les
      facteurs (« durée du sommeil, heure du coucher »). Test `Recommendations.test.jsx` d'abord. **Fait le 24/11
      21:30** : « 2 facteurs comparés à votre bien-être dans cette famille : sommeil et écran tard le soir. »
    - [x] **POLISH-SIM-161 — Tendances › Jour : « Ce qui a pu jouer » ignore le ventre quand les deux courbes sont là**
      (J45, capture `jour-23-ce-qui-a-joue.png` ; `Trends.jsx` 97 : le bien-être passe toujours devant) : avec
      Bien-être et Confort digestif affichés, une persona « Ventre » ouvre son jour de douleur et ne lit que son
      bien-être. Donner les deux blocs (un par mesure, chacun son titre), ou le confort digestif d'abord pour qui a
      cet objectif. Tests `Trends.test.jsx` d'abord. **Fait le 24/11 21:30** : un bloc par note affichée, dans
      l'ordre des courbes, chacun sous « Sur votre … » (même sans barre).
    - Écartés, avec la raison, dans la synthèse : signes opposés d'un délai à l'autre (POLISH-SIM-128, tout hachuré) ;
      PDF sans partage (propre à la version web de l'outil) ; version 0.0.0 ; essai libre sans piste (fonction
      nouvelle) ; « Objectifs » sans objectif (nom du propriétaire).
    - À étudier : cœur et oxygène du sang reçus mais visibles nulle part (2ᵉ persona ; **25/11 08:30 : la maquette existe
      déjà**, [`maquettes/tendances-courbes/`](maquettes/tendances-courbes/README.md) du 19/11, réponse attendue « go
      courbes », « go phases » ou « non » ; remise en tête du résumé, 3 personas la demandent désormais) ; ~~une seule note « Douleur » (1) lissée à 2,5~~ (POLISH-NOTE-LOSANGE, 25/11 11:30 : la note en losange ; reste METHODE-ECHELLE-VENTRE) ; ~~onglet
      Données allumé pendant un repas ouvert depuis Ma journée (2ᵉ persona)~~ (POLISH-SIM-162) ; ~~puces « Hier midi /
      Hier soir » pour l'heure d'un repas~~ (POLISH-SIM-164) ; ~~l'export CSV ne dit pas ce qu'il contient~~ (POLISH-SIM-163).
  - **Passage des personas du 25/11 20:30** (run « idées », [`synthèse`](simulations/2026-11-25-2030-synthese.md) ;
    « Ventre, sans technique » J14 après mise à jour, Android seul, et « Stressé et pressé » J45, téléphone + balance) :
    - [x] **PERSONAS-OUTIL-2 — Les pesées de l'outil passaient par la connexion Withings directe** (FAIT le 25/11 à
      20:30, outillage : `personaData.mjs`, test `personaData.test.mjs`) : absente de la variante play, Sources ne
      pouvait pas montrer la balance ; elles arrivent maintenant par Health Connect au nom de « Withings ».
    - [x] **POLISH-SIM-165 — Tendances : 100 g de poids ressemblent à une forte montée** FAIT le 25/11 à 21:30 (165 à 167 : #1270, mergée à 22:30) : `services/trendsAxis.js`, écart minimal par unité (2 kg, 10 bpm, 20 ms, 2 h, 2 000 pas), centré ; axe 76 → 79 kg dans la capture ; (J45, capture
      `poids-semaine.png` ; `TrendsViewer.jsx` 50-55, `domainOf` sans écart minimal) : axe 77,05 → 77,25 kg en
      Semaine. Écart minimal par unité (2 kg pour le poids, à régler pour les autres unités), centré sur les valeurs.
      Test `TrendsViewer` d'abord.
    - [x] **POLISH-SIM-166 — Sources : une balance « En pause » après 3 jours sans pesée** FAIT le 25/11 à 21:30 : une source qui n'envoie que poids, masse grasse, tension ou glycémie reste « à jour » 14 jours ; ensuite « Aucune mesure depuis plus de deux semaines. », sans parler de montre ; (outil rejoué ; `healthApps.js`
      287 et 318, `isRecent`) : « Plus de données depuis quelques jours : ouvrez l'app pour synchroniser la montre »
      pour une balance qui pèse tous les 3 jours. Une source qui n'envoie que des mesures ponctuelles (poids, masse
      grasse, tension, glycémie) n'est pas en pause à 3 jours, et le message ne parle pas de montre. Tests
      `healthApps.test.js` d'abord.
    - [x] **POLISH-SIM-167 — Accueil : « Vérifier une piste par un essai » mène à une page vide** FAIT le 25/11 à 21:30 : `homeActIdle` (trials.js) lit le résumé des pistes d'Analyses : « N pistes à tester », sinon « Aucune piste à tester pour l'instant » ; « Vérifier une piste par un essai » reste quand un essai fini ou une habitude remplit la page ; (J45, capture
      `agir-vide.png` ; `Dashboard.jsx` 158) : sans essai ni piste, le sous-titre dit l'état (« Aucune piste à tester
      pour l'instant ») ou la carte se retire (brief § 4 : « Agir : 3 pistes à tester »). Test `Dashboard` d'abord.
    - Écartés, avec la raison, dans la synthèse : note « Douleur » estimée 2,4 (POLISH-NOTE-LOSANGE) ; essai sommeil
      gardé par la mise à jour (voulu) ; « Où en sont vos analyses » → « Objectifs » (nom du propriétaire) ; version 0.0.0.
    - À étudier : ~~carte Confort digestif sous l'île de l'Accueil pour qui a l'objectif digestion~~ (POLISH-SIM-171) ;
      ~~détail FODMAP d'un repas déplié trop technique~~ (POLISH-SIM-172) ; ~~familles « Pas assez de données » sans action~~
      (POLISH-SIM-170) ; ~~ordre de grandeur des exemples du 28e jour (« Fructanes −3,5 pt »)~~ (POLISH-SIM-173).
    - [x] **POLISH-SIM-173 — Exemple du 28e jour : « Fructanes −3,5 pt », « GOS +1,8 pt »** FAIT le 26/11 à 18:30
      (« Ventre, sans technique », capture `exemple-j28-points.png`) : les données fictives (`tourData.js`) donnaient
      douleur deux soirs d'oignon sur trois ; maintenant gêne le soir d'oignon et le lendemain, jamais douleur.
      Fructanes −2,7 pt (toujours net aux 5 dates × 4 configurations), GOS sous 0,5 pt. Test `tourResults.test.js`
      (fructanes ≤ 3 pt, autres groupes FODMAP < 1 pt). Reste, à proposer avec maquette si un passage le redemande :
      les mots « pt », « GOS », « FODMAP » du tableau « Ce qui va avec » (écran réel, pas seulement l'exemple).
    - [x] **POLISH-SIM-171 — Accueil : pas de carte Confort digestif sous l'île** (« Ventre, sans technique », capture
      `accueil-sans-ventre.png` ; vérifié en code : seul `DigestBlock`, dans Ma journée) FAIT le 26/11 à 16:30 :
      `components/HomeGutObjective.jsx` reprend `ObjectiveCard` d'Objectifs (exportée) pour la digestion, sous
      `DayStatusCard`, avec `gutCardMode() === 'show'` seulement (brief § 4) ; elle lit le dernier `dayStates` gardé,
      sans calcul (budget de lectures de l'Accueil). Tests d'abord (`HomeGutObjective`,
      `Dashboard`) ; captures claire et sombre.
    - [x] **POLISH-SIM-172 — Repas : le détail FODMAP déplié trop technique** (« Ventre, sans technique », capture
      `repas-fodmap-jargon.png` : « 2,3 à 6,6 g … pour un repère de 0,3 g par repas », « je voulais juste savoir si c'est
      grave ou pas ») FAIT le 26/11 à 17:30 : `MealFodmapLine.jsx` dit sous chaque groupe « Bien plus » (au moins 3 fois
      le repère au bas de la fourchette), « Un peu plus » ou « Peut-être plus que ce qui gêne certaines personnes » (les
      mesures varient, ou teneur mal connue) ; la note finit par « vos repas et votre confort digestif diront ce qu'il en
      est pour vous » ; les grammes et les repères passent sur la ligne des sources, en petit. Tests d'abord
      (`MealFodmapLine.test.jsx`) ; capture `runs/captures/2026-11-26-1730-repas-fodmap-mots-simples.png`.
    - [x] **POLISH-SIM-170 — Objectifs : « Pas assez de données » sans dire quoi faire** (J45, capture
      `bien-etre-familles.png`) FAIT le 26/11 à 15:30 : `NODATA_ACTIONS` de `influenceFamilies.js` (nuits, repas, pas,
      « au moins un jour sur deux » = `FACTOR_MIN_COVERAGE`) ; la carte mène à Sources ou à `/food`. Tests d'abord
      (`influenceFamilies`, `Recommendations`) ; captures de l'outil des personas en clair et en sombre.
    - [x] **POLISH-SIM-163 — L'export CSV ne dit pas ce qu'il contient** (FAIT le 25/11 à 03:30, #1252 mergée à 04:30 ; « Tout mesurer » J14 :
      « sans savoir si cœur et oxygène sont dedans ») : après « Télécharger en CSV », la carte dit « 1 851 lignes, du
      10/09/2026 au 24/11/2026 : Cœur 198 · Température 198 · … » (`csvContents` de `services/csvExport.js`, même
      filtre que le fichier ; `CsvExportCard.jsx`, « · » insécable pour ne jamais commencer une ligne) ; le texte de la
      carte dit « et mesures de vos montres ». Défaut trouvé en lisant le code : dans le fichier, toute entrée
      `heart_rate` s'appelait « Fréquence cardiaque », oxygène du sang et variabilité compris ; la colonne « Quoi » suit
      maintenant le sous-type (Cœur, Cœur au repos, Variabilité cardiaque, Variabilité cardiaque, app Santé, Oxygène du
      sang). Tests d'abord (`csvExport`, `CsvExportCard`), captures `/data` après le clic en clair et sombre. Au passage :
      la vérification visuelle signale « Télécharger en CSV 3,98:1 » une fois le bouton touché (fond du bouton
      secondaire au focus, CSS non touché par ce run) : à vérifier sur les autres boutons secondaires (POLISH-CONTRASTE-FOCUS).
    - [x] **POLISH-CONTRASTE-FOCUS — Bouton secondaire touché à 3,98:1** (FAIT le 25/11 à 05:30, PR du run) : après un
      toucher, `.btn-secondary` reste survolé (fond `rgba(brand, 0.12)` sur la carte) et son texte vert de la marque
      tombait à 3,98:1 en clair. Le texte passe à `--accent-dim` au survol (4,86:1 en clair, 7,63:1 en sombre). Test
      d'abord dans `tokens.test.js` (lit la règle d'`App.css`, mélange le fond, ≥ 4,5:1 dans les deux thèmes). Captures
      `/data` après le clic, clair et sombre : plus d'alerte de contraste. Une seule règle commune : tous les boutons
      secondaires de l'app en profitent. Les autres fonds teintés à 12-15 % (onglets, suggestions du repas, Sources)
      ne sont pas signalés par la vérification visuelle.
    - [x] **POLISH-SIM-164 — Heure d'un repas d'hier : trois essais dans le champ date** (FAIT le 25/11 à 06:30, #1255 mergée à 07:30, PR du
      run ; « Ventre et données » J45) : sous « Heure du repas » d'un nouveau repas sans photo (`NewMealForm.jsx`),
      deux boutons « Hier midi » et « Hier soir » mettent hier 12:30 ou 19:30 (milieu du créneau, `yesterdaySlotInput`
      de `services/dayChecklist.js`) ; `aria-pressed` montre celui qui est choisi ; heure changée = repas rangé selon
      son heure, comme une saisie à la main. 44 px de haut. Test d'abord (`Food.test.jsx`), captures `/food` clair et
      sombre relues. La modification d'un repas enregistré (`SavedMealEditor`) garde son seul champ.
    - [x] **POLISH-SIM-162 — Onglet « Données » allumé pendant un repas noté depuis Ma journée** (FAIT le 25/11 à
      01:30 ; vu par deux personas, 23/11 « Tout mesurer » J1 et 24/11 « Ventre et données » J45 : « je ne sais plus
      où je suis ») : la page Repas est rangée sous Données, donc la barre allumait Données et la page montrait les
      sous-onglets « Tendances · Nutrition ». Désormais les liens et le bouton photo de Ma journée et de l'Accueil
      passent l'onglet d'origine (`state.tab`, `components/tabs.js` : `TABS`, `activeTab`, `useCurrentTab`) ; la barre
      allume cet onglet et les sous-onglets de Données disparaissent ; la page Repas garde `tab` quand elle efface
      l'état consommé (`describeMeal`, `redoMeal`). Ouverte depuis Données (Nutrition › Tous vos repas, adresse
      directe), rien ne change. Tests d'abord (`TabBar`, `JournalTabs`, `MealPhotoButton`, `AddStrip`,
      `DayChecklist`, `Food`), captures `/ma-journee` → « Vos repas » en clair et sombre, `/food` direct relues.
  - **Passage des personas du 26/11 08:30** (run « idées », [`synthèse`](simulations/2026-11-26-0830-synthese.md) ;
    « Prendre soin de soi » J45, téléphone + balance, et « Ventre et données » J45, iPhone seul ; installations neuves) :
    - [x] **POLISH-SIM-168 — Ma journée : « Encore 3 choses aujourd'hui » ne bouge pas quand on note un repas**
      (J45, capture `ma-journee-3-choses.png`, « Repas 1 sur 3 ») : `dayChecklist.js` 123 compte des lignes ; la ligne
      Repas n'est faite qu'à 3 repas sur 3, et la digestion du soir compte avant 18 h. Compter les cercles de repas
      restants (un repas noté = une chose de moins), ou une phrase qui le dit. Tests `dayChecklist.test.js` d'abord ;
      bannière de Pilou et widget (`companion/world/widget.js`) dans la même PR.
      FAIT le 26/11 à 09:30 : `remaining` compte un repas manquant pour une chose (`dayChecklist.js`) ; la bannière
      montre un point par repas (`PilouBanner.jsx`) ; le widget reçoit un libellé par repas restant (« Repas de midi »,
      `widgetSync.js`), son titre baisse donc aussi, sans changement natif ; l'annonce du lecteur d'écran suit. La
      digestion du soir reste comptée avant 18 h (à faire aujourd'hui, la ligne dit « À partir de 18 h »). Tests d'abord
      (`dayChecklist`, `DayChecklist`, `PilouBanner`, `widgetSync`, `Dashboard`), captures `/ma-journee` clair et sombre.
    - [x] **POLISH-SIM-169 — Repas : taper dans le champ des grammes ajoute au nombre** (J45 : « 100 » + 20 → 5000 g
      après correction) : `MealEditor.jsx` 94, sélectionner le contenu au toucher. Test d'abord.
      FAIT le 26/11 à 09:30 : `onFocus` sélectionne le nombre (refait juste après pour l'iPhone) ; test d'abord.
    - [x] **PERSONAS-OUTIL-3 — L'outil montre « Samsung Health » pour une configuration iPhone** : source par défaut
      selon la configuration tirée (Santé pour l'iPhone).
      FAIT le 26/11 à 10:30 : `--store=appstore` (déjà la build iPhone) donne aussi les noms de Santé (`personaData.mjs`,
      `IOS_SOURCE_NAME` : « iPhone », « Apple Watch », Withings pour la balance ; `--source` garde la main) ; test
      d'abord ; Sources relu dans l'outil (« iPhone — Reçu »). Les configurations iPhone se jouent avec `--store=appstore`.
    - PROP-SIM-19 renforcée : 4e « Prendre soin de soi » qui cherche son poids ; ajouter à la proposition la masse
      grasse en courbe dans Tendances (reçue de la balance, absente de `trendsData.js`). Pas de code sans réponse.
    - ~~À étudier : fructanes absents des facteurs comparés et « pain » sans alerte~~ → **PERSONAS-OUTIL-4, fait le
      26/11 à 19:30** : défaut de l'outil, pas de l'app. `fakeMeal.mjs` tirait « Pain pita » (premier nom « pain » de la
      table, sans mesure de fructanes) ; « pain », « baguette », « tartine » donnent maintenant « Pain blanc (par ex. :
      baguette, boule…) » (fructanes mesurés, ferjancic2024 et liljebo2020). Les repas de démo n'ont pas de fructanes
      exprès (`demoData.mjs` 40-41 : la visite plante les siens), d'où l'absence du facteur. Test d'abord
      (`fakeMeal.test.mjs` : chaque mot donne un pain mesuré, une baguette est « riche en fructanes ») ; outil rejoué,
      J14, « baguette avec du beurre et un café » → « Probablement riche en fructanes : pain blanc »
      ([capture](runs/captures/2026-11-26-1930-personas-outil-4-baguette.png)). Reste : la portion par défaut de
      100 g par aliment (100 g de beurre) dans l'outil, sans effet sur ce constat.
    - À étudier : éviction ou réintroduction introuvable sans piste nette ; Pilou au toucher et « Humeur
      de Pilou » sans explication après la visite ; rien à faire à J45 pour qui note peu (fonction nouvelle).
    - Écartés, avec la raison, dans la synthèse : « Rien à éviter » au-dessus de barres hachurées (POLISH-SIM-128) ;
      repas de midi à 08:34 (POLISH-SIM-122, voulu) ; note « Douleur » estimée (POLISH-NOTE-LOSANGE) ; « Où en sont
      vos analyses » → Objectifs (nom du propriétaire).
  - **Passage des personas du 26/11 20:30** (run « idées », [`synthèse`](simulations/2026-11-26-2030-synthese.md) ;
    « Tout mesurer » J1, Android seul, et « Ventre, sans technique » J45, iPhone seul, mise à jour) :
    - [x] **POLISH-SIM-174 — Accueil « 6 bulles à faire », Ma journée « Encore 8 choses » pour la même liste** — FAIT 26/11 21:30 : `bubblesLeftText(list.remaining)`, « Encore N choses aujourd’hui » des deux côtés
      (J1, capture `ma-journee-8-choses.png`) : effet de bord de POLISH-SIM-168. Ma journée compte un repas manquant
      pour une chose (`dayChecklist.js`, `remaining`) ; l'Accueil compte les bulles (`CompanionHome.jsx` 460 et 509,
      `bubblesLeftText(list.bubbles.length)`, une seule bulle « Repas 0/3 »). Le même nombre des deux côtés
      (`list.remaining`, déjà renvoyé par `homeBubbles`), avec les mêmes mots (« Encore N choses aujourd'hui »).
      Tests `bubbles.test.js` et `CompanionHome` d'abord.
    - [x] **POLISH-SIM-175 — Accueil en 4 temps, étape 4 : champ « Ajouter une habitude… » rogné par « C'est parti ! »** — FAIT 26/11 21:30 : le champ remonte au toucher (`scrollIntoView` + `scroll-margin-bottom`), vérifié dans Chromium
      (J1, capture `habitudes-champ-cache.png`) : marge basse de la page à la hauteur du bouton fixe. Capture de
      l'étape 4 relue (clair, sombre).
    - À étudier : calories reçues sans courbe (à joindre à la proposition « go courbes ») ; ~~« Rien à éviter » au-dessus
      de « Fructanes −1,2 pt », 3e fois chez « sans technique » (proposition avec maquette, avec le reste de
      POLISH-SIM-173)~~ (PROP-SIM-20, maquette du 27/11 01:30) ; ~~« vous notez vous-même » à vérifier sur l'émulateur~~ (écarté le 27/11 00:30, voir dessous) ;
      ~~jours déjà comptés du long terme~~ (POLISH-SIM-177).
    - [x] **POLISH-REGLAGES-DESC — Réglages : la ligne Paramètres ne nomme ni Pilou, ni objectifs, ni habitudes** —
      FAIT 27/11 11:30 (revue de main par `npm run visual -- --play`, hors personas ; « Prendre soin de soi » du
      19/11 20:30 cherchait ses habitudes dans les Paramètres) : `More.jsx` disait « Apparence, analyse des repas (IA),
      abonnement ». Maintenant « Apparence, Pilou, objectifs et habitudes, abonnement » (sideload : « …, repas (IA),
      cigarettes, diagnostic »). Tests `More.play.test.jsx` (rouge, puis vert) et `More.test.jsx` ; captures
      `runs/captures/2026-11-27-1130-reglages-desc-*` (clair, sombre). Vus sans défaut : Paramètres, Premium,
      Sauvegarde, Votre bien-être, Tendances › Jour, Studio Pilou, Licences, Nouveautés. À juger : la fin du paywall
      dit « Toujours gratuit : journal, … » alors que le Journal n'existe plus (le mot y veut dire « vos notes »).
    - [x] **POLISH-FODMAP-ABSENT — Alimentation tait les groupes FODMAP pas comparés** — FAIT 27/11 09:30 (passage
      des personas de 08:30, « Ventre et données » J45) : un groupe sans repas au-dessus de son repère ne varie pas et
      `fitOne` le laisse de côté (repas de démo sans blé, oignon, ail ni champignons). `familyDetail` rend
      `fodmapNotCompared` ; une ligne « Pas encore comparés, trop peu de vos repas en sont riches : fructanes (blé,
      oignon, ail) et mannitol (…) » dans le détail des chiffres, ou après les facteurs nommés sans barres. `listFr`
      garde les sigles (« GOS », pas « gOS »). Tests d'abord ; captures `runs/captures/2026-11-27-0930-fodmap-pas-compares-*`.
    - [x] **POLISH-PAYWALL-JOURNAL — « Toujours gratuit : journal » sur la page Premium** — FAIT 27/11 12:30 (« à
      juger » du run de 11:30) : le Journal n'existe plus depuis la refonte ; la ligne dit « vos notes et vos repas,
      imports des montres, bien-être estimé, graphiques et export de vos données ». `pages/Premium.jsx`, test d'abord
      (`Premium.test.jsx`). Conditions (`public/conditions.html`) et fiche Play gardent « journal » au sens commun
      (« journal alimentaire ») : pas changées. PR en brouillon, à regrouper avec le correctif suivant (CI économe).
    - [x] **POLISH-LAUNCH-JOURNAL — la carte de fin de Gold offert cite le Journal** — FAIT 27/11 13:30 (suite de
      POLISH-PAYWALL-JOURNAL, même PR #1311) : la carte de l'Accueil (3 jours avant le 2/12) disait « Ensuite, le
      journal, les montres, … restent gratuits » et, après la fin, « votre journal et vos mesures restent dans l'app ».
      Maintenant « vos notes et vos repas, les montres, le bien-être estimé et l'export » et « vos notes, vos repas et
      vos mesures ». `components/LaunchEndCard.jsx`, test d'abord. Carte absente de l'app iPhone (variante appstore).
    - [x] **POLISH-SIM-178 — « Enregistrer » descendait sous le doigt dans la fenêtre du bien-être** — FAIT 27/11 10:30
      (passage des personas de 08:30, « Stressé et pressé » J1) : la fenêtre était centrée ; au choix de la note, le
      miroir de Pilou et les précisions s'ouvraient et les boutons descendaient d'environ 200 px. La fenêtre est posée
      en bas de l'écran (`align-items: flex-end`, comme les feuilles de Ma journée) : elle grandit vers le haut et
      « Annuler » / « Enregistrer » restent à la même place ; les boutons restent collés en bas si elle défile (petit
      écran, police agrandie). Test CSS d'abord (`wellbeingSheetAnchor.test.js`) ; captures
      `runs/captures/2026-11-27-1030-bien-etre-bouton-fixe-*`.
    - [x] **POLISH-GUT-OFF-NOTE — Confort digestif masqué, « Noter maintenant » quand même** — FAIT 27/11 07:30
      (reste « à juger » de POLISH-AGIR-RETOUR) : la page reste joignable sans l'objectif (essai digestif, retour de la
      réintroduction, bilan `DigestBlock`) ; sous « Le suivi digestif est masqué », le compte à rebours proposait
      « Noter maintenant » (ou « Ajouter une note ») et le rappel du soir. `Countdown` reçoit `canNote={!gutOff}` :
      plus de bouton ni de rappel quand le suivi est masqué hors exemple ; progression et jours notés gardés. Test
      `Recommendations.test.jsx` d'abord (rouge, puis vert) ; captures `runs/captures/2026-11-27-0730-ventre-masque-*`
      (clair, sombre, version play, 2 jours d'historique).
    - [x] **POLISH-AGIR-RETOUR — Agir, seule sous-page sans lien de retour** — FAIT 27/11 06:30 (revue de main par
      `npm run visual -- --play --now=13:30`, hors personas) : Réintroduction (« ← Votre confort digestif »), les pages
      d'Objectifs (« ← Objectifs ») et la page d'un essai disent où revenir ; Agir, ouverte depuis l'Accueil (onglet
      allumé), n'avait rien. Ajout de « ← Accueil » (`act-back`, même style) ; test `Act.test.jsx` d'abord ; captures
      `runs/captures/2026-11-27-0630-agir-retour-*` (clair, sombre, vide). Vus sans défaut à corriger : Nutrition,
      Sauvegarde, Sources, Réintroduction, Votre bien-être › Sommeil, Tendances › Jour. ~~À juger plus tard : Votre
      confort digestif, suivi masqué, garde « Noter maintenant »~~ (POLISH-GUT-OFF-NOTE, 27/11 07:30).
    - [x] **POLISH-VISAGE-1 — Tendances › Jour : 2,7 « d'après le visage » quand l'Accueil dit 3,1 d'après les mêmes
      2 lectures** — FAIT 27/11 03:30 (revue de main par `npm run visual -- --now=10:30`, hors personas) : sous
      `FACE_MOOD_MIN_READINGS` (3) lectures, le modèle à espace d'états n'observe pas le jour (`faceMoodDays`) ; son
      chiffre vient des jours voisins, mais `detailSource` écrivait « d'après le visage » dès une lecture (et « estimé
      avec le visage » à côté d'une note). Maintenant : « estimé avec les jours voisins (il faut 3 lectures) », et
      « vous avez noté 3 · estimé avec les jours voisins » sous 3 lectures. L'Accueil garde la médiane pondérée des
      lectures du jour (« D'après 2 lectures du visage »), vraie elle aussi. Tests `trendsData.test.js` d'abord
      (3 attentes qui supposaient le visage compté à 1 ou 2 lectures corrigées). Code partagé : l'iPhone suit.
      Reste possible (pas fait, à juger) : un même chiffre sur l'Accueil et Tendances le jour où il y a 1 ou 2 lectures.
    - [x] **POLISH-NUIT-1 — Ma journée dit « Bonjour ! » à 2 h quand l'Accueil dit « Pilou dort »** — FAIT 27/11 02:30
      (revue de main par `npm run visual` lancé à 02:30, hors personas) : la bannière de Pilou (`idleLine`, `lines.js`)
      ne connaissait la nuit qu'à partir de 21 h ; de minuit à 5 h elle saluait (« Bonjour ! », Pilou qui fait coucou,
      hublot abricot) alors que l'îlot de l'Accueil le montre endormi (`bubbles/night.js`, nuit jusqu'à 5 h). Jusqu'à
      5 h (`NIGHT_UNTIL_HOUR`) : « Bonne nuit. Le reste peut attendre demain. », Pilou endormi, hublot du soir
      (`isLateHour`) ; tout noté : « Bonne nuit. » et `finishedLine` « À demain. » au lieu de la fête. Tests
      `lines.test.js` et `PilouBanner.test.jsx` d'abord. Code partagé : l'iPhone le reçoit dans la même PR.
    - [x] **POLISH-SIM-177 — « encore 11 jours » après 45 jours notés** — FAIT 26/11 23:30 : la ligne du prochain horizon
      d'Objectifs dit aussi les jours déjà comptés : « Long terme (de 7 à 27 jours avant) : 45 jours sur 56 avec votre
      digestion notée, encore 11. » (`resultsView.js`, `nextLock.have` / `need` ; `Recommendations.jsx`). Tests
      `resultsView.test.js` et `Recommendations.test.jsx` d'abord ; capture `--history-days=25` (bien-être, « 25 jours
      sur 35 … encore 10 ») relue.
    - [x] **POLISH-SIM-176 — Essai sans mesure : seule la veille se demandait** — FAIT 26/11 22:30 : quand la mesure
      ou la réponse manque, « c’était tenu ? » se demande pour hier, puis avant-hier, puis le jour d'avant (nommé :
      « Lundi, … »), une question à la fois (`trials.js`, `ASK_BACK_DAYS` = 3, `missingOld` « pour cette nuit-là » /
      « de ce jour-là ») ; au-delà, le jour reste inconnu. Le résultat de l'essai ne dépend pas de ces réponses (il suit
      le calendrier tiré au sort, POLISH-ESSAI-SANS) : elles allument les lanternes et le compte « Consigne tenue ».
      Tests `trials.test.js` et `Trial.test.jsx` d'abord.
    - Écarté le 27/11 00:30 : « Pour l’instant, vous notez vous-même » au temps 3 sur un vrai téléphone. Les pas du
      téléphone ne deviennent une tuile qu'avec l'accès Health Connect ou Santé donné au temps 2 (`autoTiles`,
      `health === 'granted'`, POLISH-SIM-124) ; sans cet accès, rien n'est lu et l'écran dit « Activables dans Réglages ›
      Sources : pas (votre téléphone), météo » : la phrase est juste sur l'émulateur comme dans l'outil. Les deux cas sont
      déjà testés (`Onboarding.test.jsx` « sans montre ni météo », `Onboarding.sources.test.jsx` « accès donné sans
      montre »). Aucun lancement d'émulateur nécessaire.
    - Écarté le 26/11 22:30 : « Jour 1 sur 7 » (Accueil) et « 0 sur 7 jours notés » (Objectifs) comptent déjà la même
      chose (`firstWeek.js` : jour en cours = jours notés + 1 tant qu'aujourd'hui n'est pas noté) ; après la note du
      jour, les deux disent 1 sur 7.
    - Écartés, avec la raison, dans la synthèse : pas de point « auj. » (POLISH-SIM-127) ; 14 et 28 jours (deux
      jalons dits ensemble) ; détail FODMAP déplié (POLISH-SIM-172) ; deux marques de digestion (POLISH-NOTE-LOSANGE) ;
      « Pilou a bien dîné » (SPEC journée § 3.2) ; « Inclus : … » ; formulaire ouvert descendu (non vérifié).
  - **Passage des personas du 27/11 08:30** (run « idées », [`synthèse`](simulations/2026-11-27-0830-synthese.md) ;
    « Stressé et pressé » J1, Android seul, et « Ventre et données » J45, Android seul, mise à jour) :
    - Aucun nouveau défaut sûr. PROP-SIM-20 relevée une 4ᵉ fois (première « Ventre et données ») ; ajouté à la
      proposition : le nombre de repas par ligne d'Alimentation.
    - [x] **À vérifier (petit)** (fait par POLISH-FODMAP-ABSENT, #1308, 27/11 09:30 ; coché le 28/11 00:30) : Objectifs › Confort digestif › Alimentation ne compare ni fructanes ni mannitol
      pour cette persona, sans dire pourquoi. Repas de l'outil d'abord ; si l'app tait un groupe faute de repas, une
      ligne « pas assez de repas pour comparer ».
    - À étudier : moyenne de la digestion par semaine (avec « go courbes ») ; repas imposés à l'accueil pour le
      bien-être seul (brief § 4) ; boutons de la fenêtre du bien-être qui descendent au choix de la note.
    - Écartés, avec la raison, dans la synthèse : humeur de Pilou (POLISH-SIM-109) ; rappels absents en web ;
      « Valider » puis « Continuer » ; repas « Midi » à 08:33 (POLISH-SIM-122) ; essai planté par l'outil ; écran
      Gold et visite (brief § 3.4) ; deux marques (POLISH-NOTE-LOSANGE) ; PDF sans aperçu en web.
  - **Passage des personas du 27/11 20:30** (run « idées », [`synthèse`](simulations/2026-11-27-2030-synthese.md) ;
    « Prendre soin de soi » J1, Android + Xiaomi, et « Ventre, sans technique » J1, iPhone + Apple Watch) :
    - [x] **POLISH-NUTRI-ZERO** (petit, sûr ; FAIT 27/11 21:30 : « non mesuré », hors légende, hors compte des repères et hors note « partiel », tests service et page) : Données › Nutrition écrit « Vitamine D partiel · ≥ 0 µg/j » quand la
      teneur n'est mesurée pour aucun aliment du jour (`Nutrition.jsx`, `NutrientBar`) ; écrire « non mesuré » à la
      place de « ≥ 0 ». Test d'abord, captures Nutrition.
    - [x] **POLISH-BOISSON-ML** (27/11 22:30 ; fait le 27/11 23:30 : `isDrink` par le nom, ml dans l'éditeur et la liste des repas, rien de réécrit ; vérifié dans le code ; petit, sûr) : une boisson analysée s'affiche en
      grammes dans l'éditeur du repas (« Bière 250 g ») : le relais demande `quantity_g` avec les repères « 1 verre
      ≈ 200 ml » (`relay/src/prompts.js`), et `MealEditor.jsx` écrit toujours « g ». Proposition : unité « ml » pour les
      aliments des groupes Ciqual des boissons (valeur stockée inchangée, 1 ml ≈ 1 g), boutons « Ajouter 10 ml ».
      Test d'abord, captures de l'éditeur ; pas de migration.
    - PROP-SIM-19 relevée encore (pesée introuvable au jour 1) ; PROP-SIM-20 relevée par une 5ᵉ persona (exemple du
      jour 28 trop technique).
    - À étudier : rapport médecin rangé dans Sauvegarde ; boissons comptées en grammes (à vérifier hors outil).
    - Écartés, avec la raison, dans la synthèse : jalons 7, 14 et 28 jours (brief § 3.5) ; analyse factice de
      l'outil ; « Aucune lecture du visage » non vérifié ; icône photo de « Selles » (voulue) ; visite guidée ;
      « Valider » puis « Continuer » ; phases du sommeil (nouvelle vue).
- **Sprint du 16/11 20:20 au 17/11 03:00 (étapes 8 à 15 en parallèle, `sprint/SPRINT.md`) — état relevé par
  l'intégrateur le 17/11 à 02:30 d'après `sprint/LOT-*.md` des branches `claude/sprint-*`** : #1047 (PHOTO, relais),
  #1048 (MONDE) et #1053 (SCÈNE) sur main, puis #1062 (SCÈNE 2, f135f54) #1056 (BULLES, ed1fa08, 23:52) et #1060 (VIE, 42072c6, 00:16) et #1050 (PHOTO, dedb890, 00:26), puis #1057 (MONDE, ae8e213, 00:40) et #1058 (PILOU, 99c1de6, 00:58), puis #1052 (STUDIO, 5e749d3, 01:22, v774) et #1066 (BULLES 2, 82c3f2c, 01:30). Tests de main verts (un rouge isolé sur 99c1de6 : `Dashboard.test.jsx` « Méditation · oui, changer la réponse » introuvable, vert aux commits suivants : à surveiller, POLISH-FLAKY ci-dessous). Puis #1067 (VIE 5, 929d5ec, 02:07) et #1070 (SCÈNE 4, assemblage, 930dcdd, 02:09, v777, APK 35 331 266 octets) ; #1065 fermée (contenue dans #1070). Lots finis : PHOTO, MONDE, BULLES, VIE, SCÈNE. Puis #1071 (PILOU 3, 9b785e3, 02:38). En PR à 02:40 : #1072 (STUDIO 4), tous checks verts sauf « Build iOS (simulateur) et captures », en cours.
  - ASSEMBLAGE (confié au lot SCÈNE par l'orchestrateur à 22:40, `claude/sprint-scene-3`) : fusion locale de main et
    des 7 PR → lint propre, 3 980 tests verts, 1 rouge (`bundleGuard.test.js` : `companion/CompanionScene.css` à
    importer dans `app/src/pageStyles.js`, une ligne, dans la PR d'assemblage ou #1056). Conflits connus et leur
    résolution : VIE × STUDIO dans `localHealthStorage.js` (exporter `companion` et `pilou` ; à l'import
    `restoreCompanion` puis `restorePilou`) et `Settings.jsx` (garder les deux réglages) ; copies de `CONTRAT.md` :
    version de main. Images fixes `scene/fallback*.webp` refaites avec le Pilou de PILOU, après son merge.
  - SCÈNE (8) : **#1053 mergée** (0825540, 22:02 ; contrat `companion/CONTRAT.md` et `bus.js`, three.js r187 MIT,
    île, lumière, paliers, pause, image fixe de repli, interrupteur `halcya.companion.scene` ; v766, APK 35,0 Mo).
    #1062 : 7 cadeaux en 3D, cérémonie de la boîte, météo de l'île, Réglages › Mouvements de Pilou, étiquette lisible
    en sombre (mergée, f135f54). #1065 (branche 3, en PR) : Pilou dort la nuit, image fixe de nuit, ambre et lune, lanterne (`lightAt` de MONDE). #1070 (branche 4, assemblage, en PR, après #1065) : images fixes refaites avec le Pilou de PILOU, « Pilou dort. Le reste peut attendre demain. » la nuit. Vérifié par le lot (00:50) : mise à jour depuis une version d'avant la refonte → rencontre une seule fois, pas de fête des 7 jours pour un utilisateur ancien. Écart de style non bloquant : la rencontre montre Pilou en image sur un îlot 2D. Captures de main du sprint : aucune série (chaque build iOS de main annulée par le merge suivant) ; la série viendra du dernier merge. Palier et temps
    d'image sur le job Android 9 et le simulateur iPhone : non relevés (aucun job n'écrit `data-quality` ni `scene:quality`), à mesurer sur un vrai téléphone.
  - PILOU (9) : **#1058 mergée** (00:58 ; corps verni, yeux de la créature, 12 expressions, ΔE menthe 2,8 moyen / 3,8 max dans la scène,
    9 050 triangles) ; petits Pilou pré-rendus (12 × 218×240 webp, `pilouSprite`) pour VIE et MONDE. #1071 (branche 3, en PR) : petits
    effets des expressions, yeux fermés en trait.
  - BULLES (10) : **#1056 mergée** (23:52 ; la scène est importée directement, son CSS reste chargé d'emblée ; bulles-boutons, Humeur du jour à plancher, fleurs, « Jour N sur 7 », 7 cadeaux) ; branche 2 :
    **#1066 mergée** (01:30) : lucioles la nuit, jour 14, bandeau au défilement, nom choisi. **Lot fini** (#1073 : fichier de lot seul). Résolution convenue avec SCÈNE dans `Dashboard.jsx` : garder
    `<CompanionHome …>` seule (elle monte la scène).
  - VIE (11, 12) : **#1060 mergée** (00:16) (réunit #1051 et #1054, fermées : Ma journée, rencontre et nom, cérémonie du jour 7, Pilou
    dans Objectifs et Données, assiette reniflée ; bloc `companion` dans l'export et l'import, testé sur base ancienne) ;
    remise à jour sur main à 23:10 (contrat pris de main ; test instable de Dashboard corrigé à la source ;
    `pilouName()` ajouté pour l'étiquette de la scène). #1067 (branche 5, en PR) : cairn des galets dans « Par famille », graine des captures iPhone.
  - MONDE (13) : **#1048 et #1057 mergées** (#1057 à 00:40, réunit #1055, fermée : widget Android « Ma journée », Pilou dans les
    notifications du soir Android et iPhone, lumière à l'échelle de la scène). **Lot fini.** Restes : la scène n'utilise pas encore `weatherDecor`, `growthAt` ni `loadWorldContext()` ; poses du widget à re-rendre avec le module PILOU ; nom choisi dans le widget (`pilouName()`).
  - STUDIO (14) : **#1052 mergée** (01:22 ; fiche de traits locale, export et import avec le bloc `companion` de VIE, écran derrière l'interrupteur du compagnon, aperçu peint en 2D, pièces 3D
    et `brancherTraits`). #1072 (branche 4, en PR) : `equiperPilou` et visage peint sur le vrai Pilou. Question restée ouverte : aperçu 3D dans le Studio.
  - PHOTO (15) : **#1047 mergée** (relais, route éteinte, `503 disabled`) et **#1050 mergée** (00:26, app, interrupteur de build éteint
    partout) : **lot fini**. Missions P49 (Play) et PI3 (App Store) préparées, arrêtées avant l'envoi.
  - Restes notés par les lots, hors sprint : retour haptique des bulles (`@capacitor/haptics` absent, touche les
    builds natives : à décider) ; notification de repas de Pilou (SPEC journée § 9, texte prêt, fonction nouvelle :
    proposition) ; widget iPhone (WidgetKit, extension Xcode à créer) ; brancher la photo sur `saveFiche` du Studio ;
    course de test `AppRedirects.test.jsx` (appel GitHub de `UpdateBanner` après la fin de jsdom) corrigée dans #1050.
    Règle pour tous : ne pas lancer `getAnalysis(...)` depuis l'Accueil (check « Budget de lectures »).
  - [x] **POLISH-MEET-DARK** (fait le 17/11 03:30 : couleurs sombres de `life.tokens.css`, test `lifeTokens.test.js` ; « vide-accueil » et la surimpression des captures iPhone déjà réglées par #1067, vérifié sur captures/main 136e969) : relevé par le lot SCÈNE sur les captures
    iPhone de #1070 (6bf72be) : en thème sombre, la carte de la rencontre (`companion/life/`) garde un fond clair sous un
    texte clair (« Comment voulez-vous l'appeler ? », bulle « Bonjour ! ») : illisible. Partie avec la version du soir :
    un utilisateur existant la voit une fois à la mise à jour. Aussi : capture iPhone « vide-accueil » blanche (à
    vérifier) ; mode captures iPhone recouvert par la rencontre alors que `captureMode.js` sème `halcya_companion.metAt`
    (défaut de l'outil, pas du produit). Captures avant/après en clair et sombre, Android et iPhone.
  - [x] **POLISH-PILOU-DORT-YEUX** (vu le 17/11 03:30 sur captures/main, iPhone, Accueil vers 01:50) : « Pilou dort. » mais la figurine garde les yeux ouverts sur l'île ; vérifier que la scène 3D reçoit l'expression Endormi (yeux fermés en trait, #1071) la nuit.
    **Fait le 17/11 05:30** (PR « [Auto] Pilou dort vraiment la nuit ») : cause = `app:opened` jouait « réveil » (le « matin » commençait à minuit) puis revenait à l'humeur, et rien ne le rendormait avant le tick de 5 min ; au lever, l'ancien test `P().expression === 'endormi'` ne marchait que sur le repli (la figurine n'a pas ce getter) : Pilou ne se réveillait plus. Désormais `restExpression`/`appOpenedReaction` (`companion/mood.js`) : la nuit, l'ouverture ne le réveille pas et tous les retours à l'humeur le rendorment ; matin = 5 h à 11 h ; test `companion/sleep.test.js`. Reste : un geste de nuit (cadeau, câlin) le réveille jusqu'au tick suivant (5 min), voulu.
  - [ ] **POLISH-PILOU-CILS-NUIT** (vu le 17/11 05:30, capture de nuit) : yeux fermés, le trait des cils se voit à peine sous la lumière de nuit ; à juger sur un vrai téléphone avant de l'épaissir.
  - [x] **MONDE-1** (fait le 17/11 09:30, mergé le 17/11 13:30 (#1083) : `worldContextForDay()` dans `world/context.js` pour le widget ; 10:30 : la scène lit seulement le sommeil via `sleepHabitsForDay()`, même calcul, car le contexte complet faisait lire 4 724 enregistrements à l'Accueil au lieu de ≤ 1 500 (« Budget de lectures » rouge) ; tests coucher 0 h 15, lever 9 h, travail de nuit) (17/11 08:30) : lever et coucher réels dans la scène : `CompanionScene.jsx` passe `{ wake, bedtime }` de `loadWorldContext()` à `lightAt` (aujourd'hui `lightAt(now)` seul : l'île endort Pilou à 22 h 30 fixe alors que le widget suit le sommeil réel), avec un cache du jour commun au widget et à la scène ; tests « coucher à 0 h 15 » et « travail de nuit ». Détail : [`DECOUPAGE-RESTES-SPRINT.md`](maquettes/compagnon/DECOUPAGE-RESTES-SPRINT.md) § 2.
  - [x] **MONDE-2** (fait le 17/11 12:30, #1086 mergée le 17/11 vers 14:40 : `island.setSeason`, `SEASON_COLORS`, arbuste `SHRUB_LEAVES`, saison dans `time:phase` ; palier bas inchangé ; rendu vérifié au banc) : la saison sur l'îlot (automne le 17/11 : herbe dorée).
  - [x] **MONDE-3** (17/11 15:30, **mergée le 17/11 vers 17:50, #1088**) : l'îlot grandit avec les jours d'usage (`growthAt` branché : largeur × 1 → 1,3, hauteur × 1 → 1,12, arbuste × 1 → 1,45 à 90 jours), caméra inchangée (Pilou à la même taille ; `stage.project` et les bulles inchangés ; l'îlot adulte tient dans le cadre, testé). Jours d'usage : décompte gardé dans `localStorage` (`halcya.world.usageDays`), lu à l'ouverture sans toucher aux notes, recompté au plus une fois par jour de Pilou 4 s après l'ouverture ; il ne recule jamais. **Recompte léger (17/11 16:30)** : le premier recompte passait par `worldContextForDay`, qui lit toutes les notes (4 761 enregistrements à 3 ans de démo, budget de l'Accueil 1 500 : check « Budget de lectures » rouge) ; il passe désormais par `listEntryDays` (curseur à rebours sur [source, at] qui saute au jour d'avant : une entrée lue par jour et par source notée, 90 jours au plus) : 1 004 enregistrements pour l'Accueil. Le widget garde son décompte exact (`loadWorldContext`). **Unité des touffes tranchée** : les « touffes 14 → 42 » de la SPEC (maquette) ne sont pas nos 600 brins ; nos brins gardent leur nombre (budget de triangles) et grandissent avec l'îlot. Restent à MONDE-4 : le petit arbre (`tree`, g ≥ 0,5 : forme différente), l'îlot voisin, la mare, la nouvelle dite une fois, et l'image fixe du palier bas (précalculée, sans croissance ni saison). À regarder : à 90 jours, le nuage du J6 passe en partie derrière le bord de l'îlot.
  - [x] **VISUAL-NOW** (relevé au run du 18/11 03:30 sur la branche de #1091 à #1095, **fait au run « idées » du 18/11 08:30**, outillage seul) : `npm run visual -- --now=14:00` (heure du fuseau `--tz`, ou date ISO complète) installe l'horloge de Playwright (`context.clock.install` puis `resume` : le temps part de là et s'écoule) et cale les données de démo sur ce moment ; `--usage-days=N` écrit le décompte de l'îlot (`halcya.world.usageDays`, jour vide : recompté ensuite, jamais en baisse). Vérifié : `--now=23:30` donne la nuit et Pilou endormi, `--now=14:00` le jour, quelle que soit l'heure du run. Sur main, l'image fixe de Chromium ne suit pas encore la croissance (#1093 en attente) : à revérifier avec `--usage-days=76` après son merge. Code : `app/scripts/visual/clock.mjs` (+ 7 tests). Constat au passage : à 23:30 (démo), la scène est de nuit et Pilou dort, mais l'étiquette dit « Pilou est tranquille · 2 bulles à faire » au lieu de « Pilou dort » : à vérifier (heure de coucher de la démo ? étiquette qui ne suit pas la nuit ?) → **NUIT-ETIQUETTE**.
  - [x] **NUIT-ETIQUETTE** (18/11 08:30 ; doublon, fait le 18/11 09:30, voir plus bas) : voir VISUAL-NOW ; reproduire avec `npm run visual -- --routes=/ --now=23:30`, puis `--now=02:00`.
  - [x] **MONDE-4a** (17/11 18:30, PR) : l'îlot voisin (30 jours d'usage) et la mare (90 jours) dans la scène 3D. Îlot voisin : `scene/neighbour.js`, même socle que l'île en petit (× 0,24, sans ombre de contact), à droite, plus bas que le plateau et un peu devant (1,72 ; −0,68 ; 0,7), en miroir du nuage du J6 ; testé dans le cadre 390 × 350, hors de l'orbite des bulles (1 à 8 bulles, tous déphasages) et non caché par l'îlot adulte ; il suit la saison ; il arrive en 900 ms (`back`) s'il apparaît Accueil ouvert, il est déjà là sinon ; d'un coup en mouvements réduits. Mare : dans `island.js` (elle grandit avec l'îlot), à gauche de Pilou (−100°, r 0,68), bord de sable, trois roseaux pour qu'elle se lise sous la caméra rasante, l'herbe rangée sur son emplacement quand elle apparaît ; eau bleue, glace l'hiver ; testée hors de Pilou, de l'arbuste, de la lanterne, des galets et des 10 places des fleurs du jour. Rendus du banc relus à 0, 30 et 90 jours, en hiver et le soir. **Restent (MONDE-4b)** : le petit arbre (`tree`, g ≥ 0,5 : autre forme que l'arbuste agrandi), la nouvelle dite une fois à l'ouverture (`worldNews`, étiquette et petit saut de Pilou), l'image fixe du palier bas (sans croissance ni saison).
  - [x] **MERGE-PILE-P50** (18/11 10:30 ; **fait le 18/11 vers 19:00 : PR regroupée #1102 mergée**, e35c665) : dès la facturation GitHub réglée, merger #1090, #1092, #1093, #1097, #1091, #1094, #1095, #1096 dans cet ordre (vérifiées ensemble en local : aucun conflit de code, 4 080 tests verts ; conflits de journal seulement, garder toutes les lignes), checks GitHub et captures de l'Accueil à chaque PR. Puis Alpha et soumission bêta TestFlight.
  - [x] **NUIT-ETIQUETTE** (relevé au run « idées » du 18/11 08:30, **fait le 18/11 09:30, PR empilée sur #1093**) : à 23:30 (démo), l'image fixe montrait Pilou endormi sous « Pilou est tranquille ». Cause : l'image de nuit était choisie dès que le ciel est étoilé (`light.night`), l'étiquette suit l'heure de coucher (`light.asleep`). L'image suit maintenant `light.asleep` ; test à 22 h (coucher 22 h 30). Vérifié avec `--now=22:00`, `23:30`, `02:00`.
  - [x] **STILL-SOIR** (18/11 09:30 ; **fait le 21/11 07:30** : image `soir.webp` rendue à 21:00 depuis le banc, îlot sombre et Pilou éveillé, choisie par `stillKey({ evening })` quand `light.night && !light.asleep` ; `render-scene-stills.mjs soir` ne rend que les images nommées ; 2 tests ; le test NUIT-ETIQUETTE attendait l'ancienne image de jour à 22 h, mis à jour) : entre la tombée de la nuit (≈ 20 h) et le coucher, l'image fixe montre l'îlot éclairé de jour sous un ciel étoilé. Rendre une image « soir » (lanterne allumée, îlot sombre, Pilou éveillé) avec `render-scene-stills.mjs` et la choisir quand `light.night && !light.asleep`.
  - [ ] **MONDE-4b** (17/11 21:30, PR empilée sur MONDE-4a) : ~~le petit arbre~~ **fait** : `gifts.setTree(growth.tree)` (g ≥ 0,5, soit 45 jours d'usage) remplace la forme de l'arbuste (`buisson`) par un petit arbre (`arbre` : tronc, deux branches, couronne de 5 boules), mêmes matériaux de feuillage (saisons), posé avant ou après ; branché dans `stage.setGrowth`. Testé : seuil 44/45, forme, saison, cadre 390 × 350 à 90 jours, hauteur entre × 1,2 et × 2 celle de l'arbuste. Rendus du banc relus (30, 45, 90 j ; hiver, fin d'hiver, soir d'automne) : à 90 jours la couronne touche le bord gauche de Pilou, derrière lui (lisible). ~~la nouvelle dite une fois~~ **faite (17/11 22:30)** : `takeWorldNews` (état vu gardé dans `halcya.world.seen`, rien à la première visite), événement `world:news`, étiquette 6 s et petit saut de Pilou, rien la nuit (la nouvelle attend le réveil) ; 8 tests. ~~l'image fixe du palier bas~~ **faite (17/11 23:30)** : 13 images (`scene/stills/`, 3 étapes de croissance 0, 30 et 90 jours × 4 saisons, et la nuit avec Pilou endormi ; 18 à 27 Ko chacune, environ 290 Ko en tout), rendues par `scripts/companion/render-scene-stills.mjs` depuis le banc de la scène ; choix par `scene/stills.js` (`stillKey`), branché dans `CompanionScene` (jours d'usage et saison du dernier calcul) ; `fallback-nuit.webp` retiré ; 5 tests. Pas d'étape 45 jours : les cadeaux (arbuste puis petit arbre) ne sont pas dans les images, ils dépendent de chacun. **MONDE-4b complète en local** ; mergeable après #1090 et #1092 quand les Actions tournent (P50).
  - [ ] ~~MONDE-3~~ (texte d'origine) : croissance (échelle, caméra qui garde Pilou à la même taille, arbre ; la projection des bulles `stage.project` et l'image fixe du palier bas suivent la même caméra ; décompte des jours d'usage sans relire toutes les notes à l'ouverture de l'Accueil, budget de lectures : voir le run du 17/11 10:30) ; trancher d'abord l'unité des « touffes » (14 → 42 fleuries ≠ 600 brins). **MONDE-4** : îlot voisin (30 j), mare (90 j), la nouvelle dite une fois à l'ouverture. Ensemble, ils soldent « `growthAt` et `loadWorldContext()` branchés dans la scène » de REFONTE-RESTES-SPRINT.
  - [ ] **IOS-SANTE-FLAKY** (25/11 14:30) : sur le build iOS de #1263 (aucun code de l'app ni de `iphone/` changé),
    `SanteUITests/testAccepterLaFeuilleSante` n'a pas trouvé « Tout activer » sur la feuille de l'app Santé ; l'étape
    « Aucune erreur JavaScript » a alors compté 30 « Authorization not determined ». Vert sur #1261 une heure avant.
    Regarder le build du soir ; si l'échec revient, attendre la feuille plus longtemps ou accepter ses autres libellés.
  - [x] **CI-PERF-HANGUP** (25/11 14:30, PR « [Auto] » du run) : le job « Budget de lectures (perf) » de main a échoué sur 147085a (journal seulement) par `route.fetch: socket hang up` en servant `analysis.worker*.js` : une exception non rattrapée dans le gestionnaire de route faisait planter tout le banc. `scripts/perf/perf-check.mjs` refait un essai ; deux échecs de suite restent une erreur (le budget ne s'assouplit pas). Job relancé sur main ; banc local vert (10 pages).
  - [x] **CI-EMU-TIMEOUT** (PR #1084 le 17/11 09:30, mergée à 10:35, `timeout-minutes: 30` sur API 34, 35, 36) (17/11 08:30) : le job « HealthTrack sur Samsung A56 (API 35) » n'a pas de `timeout-minutes` ; sur #1080 (56541bb) il est resté bloqué plus de 50 min à « Lancer l'émulateur » (≈ 10 min d'habitude), ce qui retient le merge jusqu'au délai de GitHub (6 h). Ajouter `timeout-minutes: 30` à ce job (comme API 32), dans une PR à part.
  - [ ] **LANT-1 à LANT-4, WIDGET-POSES** (découpés le 17/11 20:30, run « idées » ; détail, tests rouges et risques dans
    `journal/maquettes/compagnon/DECOUPAGE-RITUEL-LANTERNES.md`) : soldent « rituel du soir et lanternes » et « poses du
    widget » de REFONTE-RESTES-SPRINT, après MONDE-4b. Les lanternes suivent le tirage au sort gardé par le propriétaire
    (15/11) : **5 lanternes = les 5 jours « avec »**, allumées quand le jour est tenu, pas « 5 soirs réussis » de la SPEC.
    **LANT-4 en attente du propriétaire (25/11 17:30)** : maquette de l'option 2D, `maquettes/rituel-soir/README.md` ;
    réponse « rituel 2D », « rituel 3D » ou « pas de rituel ». Rien à coder avant.
    LANT-1 lanternes sur la page du défi ; LANT-2 Pilou sur la page du défi et au bilan (il salue l'effort) ; LANT-3
    lanterne qui s'allume le matin sur l'îlot (aucune lecture de plus) ; LANT-4 rituel du soir, piste d'écran seulement
    (2D ou 3D à trancher : proposition 2D, le tiroir 3D mesuré à 61 200 triangles pour une cible de 25 000) ;
    WIDGET-POSES poses rendues depuis `companion/pilou/`. Tout en code partagé, aucun correctif iPhone touché (vérifié).
  - [x] **WIDGET-POSES — Les poses du widget depuis le vrai Pilou** (FAIT le 25/11 15:30, **#1264 mergée** le 25/11 16:30) :
    `scripts/companion/render-widget-poses.mjs` rend les 6 poses par le banc de `src/companion/pilou/` (Vite, Chromium,
    `createPilou.js`) au lieu du kit de maquettes ; fond crème, mêmes teintes du soir et de la nuit, 288 px, WebP, et les
    deux JPEG des notifications de l'iPhone (`public/companion/`) tirés des mêmes images. Pilou entier (pieds et antenne),
    sans l'herbe du kit. `--check` rend deux fois et compare : mêmes octets (8 fichiers). Images plus légères (3 à 4 Ko
    au lieu de 5 à 7). Mise en page du widget inchangée (même taille d'image). Sans les traits du Studio (REFONTE-14).
  - [ ] **REFONTE-RESTES-SPRINT** (après POLISH-MEET-DARK, un sujet par run) : ~~nom choisi dans l'étiquette de l'île~~
    (déjà fait : `CompanionHome` lit `useCompanionNameSafe()` sans prop, vérifié le 17/11 04:30) ; ~~nom choisi dans le widget~~
    (17/11 04:30, PR « widget-nom » : `syncPilouWidget` envoie `companionNameNow()`, test rouge puis vert) ; `growthAt` et `loadWorldContext()` branchés dans la scène ; poses du
    widget re-rendues avec le module PILOU ; rituel du soir et lanternes du défi des 5 soirs (SPEC journée § 7) ;
    première série `captures/main` d'après le sprint à regarder ; palier de qualité sur un vrai téléphone ; #1072 si
    elle est encore ouverte après 03:00 (son équipier est arrêté : la routine la finit).
  - [x] **LANT-3 — La lanterne du matin sur l'îlot** (FAIT le 25/11 12:30, **mergée** dans #1261 le 25/11 13:30 après le
    build iPhone vert, release v918) : `morningLantern(rows, { summaries, now })` (`services/trials.js`) dit si hier était un jour « avec » tenu
    (données ou réponse « c'était tenu ? »), y compris le dernier jour d'un essai qui vient de finir ;
    `companion/bubbles/morningLantern.js` en tire les résumés depuis les saisies que l'Accueil a déjà lues (aucune
    lecture de plus) et garde la clé du jour (`halcya.lantern.morningSeen`, une fois par jour) ; `Dashboard.jsx` émet
    `gift:lantern-lit` (`{ date, at }`, CONTRAT.md) ; la scène (`CompanionScene.jsx`) allume la lanterne
    (`gifts.lightLantern`, courbe `lanternMorning` : vacille 120 ms, monte en 400 ms, tient, s'éteint à 2,6 s ; fondu
    de 300 ms en mouvements réduits), Pilou la regarde (`gifts.lanternSpot()`) et fait un petit saut, sauf s'il dort ;
    rien sans lanterne sur l'île. Tests d'abord (`trials.test.js`, `three.test.js`, `morningLantern.test.js`), puis
    `Dashboard.test.jsx`. Constat : la sonde Playwright locale tombe en palier « bas » (image fixe, SwiftShader trop
    lent) : l'allumage n'a pas pu être filmé ici ; à voir sur un vrai téléphone. Suite : LANT-4 (question 2D / 3D au
    propriétaire), WIDGET-POSES.
  - [x] **LANT-1** (mergée dans #1102 le 18/11 vers 19:00 ; 18/11 00:30, PR ouverte, pas mergée : GitHub Actions bloqué, P50) : une lanterne par jour « avec » sur la page du défi (`lanterns(status)` dans `services/trials.js`, `components/TrialLanterns.jsx`, ambre `--accent-amber`, halo qui respire, fixe si mouvements réduits) ; tests rouges puis verts ; captures `/agir` essai jour 8 relues en clair et en sombre. Découpage : `journal/maquettes/compagnon/DECOUPAGE-RITUEL-LANTERNES.md` (branche de #1091). Suite : LANT-2.
  - [x] **LANT-2** (mergée dans #1102 le 18/11 vers 19:00 ; 18/11 01:30, PR ouverte, empilée sur LANT-1, pas mergée : Actions bloqué, P50 ; toujours bloqué au run de 05:30, Alpha du 17/11 non envoyée) : Pilou (80 px) dans la carte du jour du défi ; saut et « C’est parti ! Chaque jour avec tenu allume une lanterne. » juste après « Commencer » (état de navigation `started`, pas refait au retour sur la page) ; sinon il attend sans bulle ; au bilan, deux signes de tête (`pilou-move-nod`, coupé si mouvements réduits) et « Bravo pour vos N jours avec. » quel que soit le résultat (`pilouSays(status)`, `services/trials.js`). Reste de la SPEC § 7 pour plus tard : les 5 lanternes dans le bilan, le haussement d’épaules d’un jour manqué. Écart des chiffres du bilan corrigé le 18/11 02:30 dans la même PR : la réserve dit « N lendemains mesurés, c’est encore peu » (`bilanWords`), la bulle garde « Bravo pour vos N jours avec. ». Suite : LANT-3.
  - [x] **LANT-2b** (25/11 18:30, #1267 mergée le 25/11 19:30 ; reste de LANT-2, SPEC `comprendre` § 6.5 « soir manqué » et § 7 « bilan ») : au bilan, `TrialLanterns` et « Consigne tenue N jours sur M prévus » restent dans la carte du résultat (sous Pilou, avant le titre du bilan) ; le lendemain d'un jour « avec » pas tenu, `pilouSays` rend `{ expr: 'content', move: 'shrug', text: 'Pas grave : la prochaine lanterne vous attend.' }` (le saut de « Commencer » passe avant). Tests d'abord (`trials.test.js`, `Trial.test.jsx`) ; captures `--trial=12` clair et sombre, `--trial=5 --trial-factor=habit` relues. Reste de la SPEC : la « vague de lumière » du 5/5 (animation), à juger avec LANT-4.
  - [x] **VISUAL-NOW** (18/11 03:30 ; constaté fait le 20/11 18:30 : `scripts/visual/clock.mjs`, `--now` et `--usage-days`) : `npm run visual` sans option d'horloge ; l'Accueil de démo dépend de l'heure du run (la nuit : image de nuit, croissance invisible ; à la première ouverture la croissance arrive 4 s après la capture). Ajouter `--now=<ISO>` (Playwright `context.clock.install` puis `resume`) et `--usage-days=N` (clé `halcya.world.usageDays`). Outillage seul.
  - [ ] **MONDE-NUIT-STILL** (18/11 03:30) : l'image fixe de nuit (palier bas) est unique, l'îlot de 90 jours y redevient nu la nuit. Mineur ; à trancher avec les images de saison (#1093).
  - [x] **CI-GATE-TIMEOUT** (17/11 11:30) : « Tests » de main rouge sur 9c9e09e, 4 simulations d'`evaluateGate` (`gate.test.js`) au-delà du délai de 5 s sur un runner chargé (1 à 2 s en local) → délai de 30 s (`SIMULATION_TIMEOUT`) pour les cinq simulations, assertions inchangées.
  - [x] **POLISH-FLAKY-DASH** (après le sprint ; **fait le 17/11 07:30** dans #1080 : « Déjà noté (1) » attendu par `findByRole`, la liste s'affiche avant la réponse de `listEntries`) : `Dashboard.test.jsx`, « Ma journée : une habitude suivie se note par oui ou non » a échoué une fois sur la CI de main (99c1de6, 17/11 00:00) puis est passé ; le lot VIE l'avait déjà dit « corrigé à la source » : chercher l'attente manquante (findBy plutôt que getBy après la réponse).
- [ ] **REFONTE-8 — Compagnon 1a, la scène** : three.js (paquet npm, r187) dans le build Android et iPhone, canevas
  de l'Accueil, île (§ 7.6), lumière (§ 7.5), paliers de qualité et mesure du temps d'image (§ 7.9), pause hors
  écran, repli image fixe ; Pilou encore simple.
- [ ] **REFONTE-9 — Compagnon 1b, Pilou** : corps figurine (§ 7.3), yeux de la créature (§ 7.4), antenne et point
  ambre, montre, boucle de repos, réactions au toucher, 12 expressions, mouvements réduits ; test de couleur du menthe
  (ΔE ≤ 6) ; captures face aux aperçus du kit.
- [ ] **REFONTE-10 — Compagnon 2** : les bulles (2D) et leur éclatement, la jauge d'humeur, les fleurs, la barre de la
  première semaine et les cadeaux.
- [ ] **REFONTE-11 — Compagnon 3** : nourrir Pilou (repas), refléter le bien-être, méditer avec lui, la fin de journée.
- [ ] **REFONTE-12 — Compagnon 4** : la rencontre et le nom à l'onboarding (Pilou enfile sa montre), la cérémonie du
  jour 7, Pilou guide discret dans Objectifs, petite tête dans Données.
- [ ] **REFONTE-13 — Compagnon 5** : le cycle du jour sur la lumière dorée, la météo sur l'île, la croissance au fil
  des semaines, le widget et les notifications (images pré-rendues).
- [ ] **REFONTE-14 — Double numérique a, Studio Pilou à la main** : rebrancher `traits.js` sur le rendu figurine
  (première chose à vérifier), fiche locale, export, « Surprenez-moi », retour au Pilou d'origine. Traits sur le vrai
  Pilou mergés le 17/11 (#1072) ; reste l'aperçu 3D dans le Studio (question ouverte).
- [ ] **REFONTE-15 — Double numérique b, la photo** : route du relais `POST /v1/pilou/style` (schéma imposé, aucun
  stockage, 3 par mois), information et consentement séparés, capture en mémoire, effacement, « À vérifier » ; brief
  § 9 à la lettre. **N'entre dans aucune version envoyée aux testeurs tant que le propriétaire n'a pas envoyé les
  déclarations** (Play : Sécurité des données ; App Store : étiquettes de confidentialité) que la routine lui aura
  préparées.

## 📱 Routine unique — Android et iPhone dans ce dépôt (décision du 13/11 vers 19:05, « go bascule »)

> Depuis la fusion (#945, #950), la version iPhone vit dans `iphone/` et cette routine fait les deux apps. Le backlog
> propre à l'iPhone reste `iphone/journal/BACKLOG.md`, la parité `iphone/journal/PARITE.md`.

- [x] **FUSION-1** (13/11 22:35, premier run de la routine unique) : résumé unique en tête de `README.md` (tableau
  Android et iPhone, une seule prochaine action) ; ancien montage archivé (`journal/archives/ancien-montage/POUR-IOS.md`,
  `iphone/journal/archives/ancien-montage/` : DEMANDES, POUR-ORCHESTRATEUR, PROMPT-ROUTINE) ; en-tête « GÉNÉRÉ » retiré
  des workflows `ios-*.yml` ; suivi d'Android repris : code embarqué v1024 → v1030, correctif 58 refait (CYCLE-3a-1).
- [ ] **FUSION-2** : `upstream.json` à `"commit": "HEAD"`, `app/**` et `relay/**` dans les filtres de `ios-build.yml`
  (pas `app/android/**`), job Ubuntu « les correctifs s'appliquent » sur les PR qui touchent `app/src/**`
  (`iphone/README.md`, « Sort des correctifs », étape 1). Tant que ce n'est pas fait, chaque run avance
  `upstream.json` (`scripts/upstream.sh --latest`).
- [ ] **FUSION-3** : faire fondre `iphone/patches/` dans `app/src/`, un sujet par run, la variante `appstore`
  (correctif 01) d'abord ; puis `overlay/` (étape 2), puis `ios/` → `app/ios/` (étape 3).
  22/11 05:30 : correctif 53 (VFC SDNN, `deviceCapabilities.js`) fondu, sans dépendre de la variante ; 43 restent.
  22/11 06:30 : correctif 04 (`phoneApps.js`, plateforme) fondu ; 42 restent. Le 43 (`HealthConnectConnector.js`)
  dépend de `isIos()`, apporté par un autre correctif (08) : à fondre avec lui.
  22/11 07:30 : correctifs 08 (l'app Santé dans `HealthConnectConnector.js` et la carte de `Connectors.jsx`) et 43
  (tout l'historique lisible sur iPhone) fondus ensemble, sur la plateforme ; tests dans
  `HealthConnectConnector.platform.test.js` et `Connectors.platform.test.jsx` ; la partie cycle du test d'overlay reste
  avec le correctif 58. 40 restent. Suivant : 58 (cycle de Santé, `HealthConnectConnector.js` + `overlay/app/src/ios/cycleSante.js`).
  22/11 11:30 : correctif 58 fondu (`app/src/ios/cycleSante.js` et son test, appel sous `isIos()` dans
  `HealthConnectConnector.js`, test `HealthConnectConnector.cycleSante.test.js`) ; 39 restent. Suivant : 61 (carte du
  cycle dans Sources, `CycleSanteCard.jsx`), puis 09 avec `saveTextFile.js`.
  22/11 12:30 : correctif 61 fondu (`app/src/ios/CycleSanteCard.jsx` et son test, affichée par `Connectors.jsx`, vide
  hors iPhone, test `CycleSanteCard.android.test.jsx`) ; 38 restent. Suivant : 09 avec `saveTextFile.js`.
  22/11 13:30 : correctif 09 fondu (sauvegarde JSON et rapport PDF par Documents puis la feuille de partage sur
  iPhone, message « … est aussi dans l’app Fichiers › Sur mon iPhone › Halcya. ») : `Data.jsx` et `createReportPdf.js`
  passent par la plateforme (`android` ou `ios`), `saveAndShareReport` rend `platform`, `DoctorReportCard.jsx` choisit
  le message sur elle ; tests dans `Data.test.jsx`, `DoctorReportCard.test.jsx`, `createReportPdf.ios.test.js` (venu
  d'`overlay/`). Sans `FEATURES` dans `Data.jsx` : le correctif 06 l'importe encore. 37 restent. Suivant : 11 et 12
  (copie de secours, `Data.jsx` + `overlay/app/src/ios/snapshot.js`) ou 06 (textes de `Data.jsx`).
  22/11 14:30 : correctifs 11, 12, 22 et 23 fondus (copie de secours : `app/src/ios/snapshot.js`,
  `SnapshotRestore.jsx`, `SnapshotWelcome.jsx` et leurs tests ; lancée par `main.jsx` en appstore, restauration montée
  par `Data.jsx` et `Onboarding.jsx` sur iOS seulement, effacée par `deleteAllData.js`, test `snapshot.android.test.jsx`) ;
  phrase de Sauvegarde reprise dans le correctif 06 ; 33 restent. Suivant : 06 (textes) ou 13 (divulgation Santé).
  22/11 15:30 : #1197 mergée. Correctifs 44 et 52 (temps d'écran sur iPhone) et la partie `PhoneUsageCard.jsx` du 07
  fondus sous `FEATURES.iosStore` (déjà utilisé par `RemindersSetting.jsx`, faux sur Android) ; le 07 ne garde que
  `WatchDiagnostic.jsx` ; test Android dans `PhoneUsageCard.test.jsx`. 31 restent. Suivant : 34 (temps d'écran
  iPhone, `PhoneUsageCard.jsx`, `permissionDisclosures.js`, `phoneUsageSync.js`) ou 06 (textes).
  22/11 16:30 : #1198 mergée. Correctifs 13 (divulgation avant l'app Santé) et 45 (6 mois importés à l'accueil sur
  iPhone), avec la partie `firstImport.js` du 15 (« App Santé » comme source du « aha »), fondus sous `FEATURES.iosStore`
  (`permissionDisclosures.js`, `Onboarding.jsx`, `firstImport.js`) ; tests Android (divulgation Health Connect, 30 jours
  importés) ; le 15 ne garde que `Data.jsx` et `today.js`. 29 restent. Suivant : 34 (temps d'écran iPhone) ou 06 (textes).
  22/11 17:30 : #1199 mergée. Correctif 34 (temps d'écran de l'iPhone : segments horaires, divulgation Temps d'écran,
  guide « Autoriser », « prises en main ») fondu sous `FEATURES.iosStore` et la plateforme (`PhoneUsageCard.jsx`,
  `permissionDisclosures.js`, `phoneUsageSync.js`) ; `phoneUsageIos.js` et `phoneAppsIos.js` (et leurs tests) passent
  d'`overlay/` à `app/src/ios/` ; test Android (allumages d'écran, jamais les segments). 28 restent. Suivant : 06 (textes,
  à découper) ou 17/19/20/21/30/32/56/57/64 (VFC SDNN, à regrouper).
  22/11 18:30 : #1200 mergée. Lot VFC SDNN fondu en une seule PR (un seul build iPhone) : correctifs 17, 19, 20, 21,
  30, 32, 56, 57 et 64 appliqués tels quels dans `app/src/` (`dailyJournal.js`, `journalChips.js`, `healthApps.js`,
  `BaselineCards.jsx`, `HealthRadar.jsx`, `radar.js`, `today.js`, `analysisEngine.js`, `firstImport.js`,
  `TodayBySource.jsx`, `trendsData.js`, `dayDeviations.js`, `analysisResults.js`, `trendsDay.js`) : la mesure
  `heartRateVariabilitySdnn` n'est écrite que par l'app Santé, et variables, facteurs, normes et axe du radar SDNN
  restent derrière `DISTRIBUTION === 'appstore'`. `sdnnBaseline.js` et ses tests passent dans `app/src/ios/` ; les
  tests d'overlay sans variante (`TodayBySource`, `dailyJournal`, `dayDeviations`, `trendsData` `.ios.test`) aussi ;
  ceux qui forcent la variante appstore restent la preuve iPhone. Test Android `sdnnBaseline.android.test.js`. 19
  restent. Suivant : 06 (textes, à découper) ou 05/25 (visage).
  22/11 19:30 : #1201 mergée (captures iPhone Accueil, Tendances, Objectifs relues). « Mes appareils » et liens de
  Réglages fondus : correctif 14 (l'app Santé au lieu de Health Connect), 25 (Apple Watch : « dans l'app Watch de
  l'iPhone »), la partie `MyDevices.jsx` du 06 et le 26 (Confidentialité et Conditions propres à l'iPhone dans
  `More.jsx`), tous sous `FEATURES.iosStore`. Les pages `confidentialite-iphone.html` et `conditions-iphone.html`
  restent dans `overlay/app/public/` (FUSION-4). Test Android d'abord (Apple Watch sur Android : Health Connect,
  jamais l'app Watch). 16 restent. Suivant : 06 (partie `Data.jsx`), 18 (portion, `Layout.jsx`) ou 05 (visage).
  22/11 23:30 : #1205 (POLISH-SIM-143) mergée. Correctif 18 fondu : l'écoute du rappel de portion touché, que le
  natif de l'iPhone signale après le retour au premier plan (`app/src/ios/portionOpen.js` et son test, venus
  d'`overlay/`), est montée par `usePortionOpen` (`Layout.jsx`) ; sur Android l'évènement n'arrive jamais, rien ne
  change. 15 restent, tous appliqués sans erreur. Suivant : 06 (partie `Data.jsx`) ou 05 (visage).
  23/11 02:30 : correctifs 47 (« Notifications refusées : autorisez-les dans Réglages › Notifications › Halcya. » sur
  iPhone, `GutEveningReminder.jsx` et `WellbeingPrompt.jsx`) et 39 (`IOS_LICENSES` et détection du visage seule sur
  l'App Store, `thirdPartyLicenses.js`) fondus ensemble, un seul build iPhone ; test Android ajouté
  (`thirdPartyLicenses.test.js`) ; `thirdPartyLicenses.appstore.test.js` reste dans l'overlay (il dépend de la
  variante `appstore` du correctif 01). 10 restent (01, 02, 05, 10, 16, 24, 27, 28, 38, 49). Suivant : 05 (visage) ;
  27 (avis) demande une décision : ses tickets visent l'ancien dépôt iOS, qui ne reçoit plus rien.
  23/11 01:30 : correctifs 06 (texte de Sauvegarde : copie de secours dans l'app Fichiers sur iPhone), 07 (montre
  Huawei : « pas encore possible sur iPhone », sans test ni connexion) et 15 (« app Santé » au lieu de Health Connect
  dans la suppression des données et le nom de source) fondus ensemble, un seul build iPhone, sous `FEATURES.iosStore`
  (`Data.jsx`, `WatchDiagnostic.jsx`, `today.js`) ; tests Android dans `Data.test.jsx`, `WatchDiagnostic.test.jsx`,
  `today.test.js` ; les tests d'overlay `.appstore` restent la preuve iPhone. 12 restent (01, 02, 05, 10, 16, 24, 27,
  28, 38, 39, 47, 49). Suivant : 05 (visage) ou 47 (notifications refusées).
  23/11 03:30 : correctifs 05 (visage) et 10 (plugins absents) fondus, `missingOnIos()` dans `app/src/ios/nativePlugins.js` ;
  8 restent (01, 02, 16, 24, 27, 28, 38, 49). PR en brouillon : le run suivant y ajoute 16 (guides des montres) puis la
  passe en « prête » pour un seul build iPhone. 27 attend une décision (lien « Envoyer un avis »).
  23/11 04:30 : correctif 16 (guides des montres par l'app Santé) fondu dans la même PR (#1210), passée en « prête » ;
  7 restent (01, 02, 24, 27, 28, 38, 49). Suivant : 28 (Nouveautés iPhone) ou 24 (abonnement App Store), 01 en dernier.
  23/11 05:30 : #1210 mergée ; correctif 28 (Nouveautés iPhone) fondu dans `app/src/data/changelog.js`, PR en brouillon ;
  6 restent (01, 02, 24, 27, 38, 49). Le run suivant y ajoute 24 (abonnement App Store) s'il tient en un run, puis passe
  la PR en « prête » pour un seul build iPhone. Les notes `["appstore"]` restent dans `overlay/` jusqu'à 01.
  23/11 06:30 : correctif 24 (plugin StoreKit 2 choisi dans `playBilling.js`) ajouté à la même PR (#1211), passée en
  « prête » ; 5 restent (01, 02, 27, 38, 49). Suivant : 38 (App Attest) ou 49 (personas), 02, 27 (décision), 01 en dernier.
  23/11 07:30 : #1211 mergée (captures iPhone de Nouveautés et Premium relues). Correctifs 38 (App Attest sur l'analyse,
  les selles et « Votre avis » : `app/src/ios/appAttest.js` et ses tests passent d'`overlay/` au code commun, appel dans
  `aiRelay.js`, rien hors iPhone : test `aiRelay.attest-android.test.js`) et 49 (`npm run persona -- --store=appstore`,
  écran 390 × 844) fondus dans une même PR ; 3 restent (01, 02, 27). Suivant : 02 (mode captures), 27 (décision), 01 en dernier.
  23/11 11:30 : #1215 (POLISH-SIM-148) mergée. Correctif 02 fondu : `main.jsx` charge `app/src/ios/captureMode.js`
  (venu d'`overlay/` avec ses deux tests, qui tournent désormais aussi dans les tests d'Android) sous
  `VITE_IOS_CAPTURE === '1'` seulement ; test `captureMode.gate.test.js` ; la build Android n'en contient rien
  (vérifié dans `dist/`). 2 restent (01, 27). Suivant : 27 (décision), 01 en dernier.
  24/11 07:30 : correctifs 01 (variante `appstore`) et 27 (« Votre avis » sur iPhone vers le dépôt unique) fondus :
  **`iphone/patches/` est vide**. Suite : `overlay/` (93 fichiers), puis `ios/` → `app/ios/`.
  24/11 09:30 : `overlay/`, 1er sujet : les 34 tests de l'iPhone qui ne lisent aucun fichier (`*.appstore.test.*`,
  `*.ios.test.*`, tests de `ios/` sans lecture de fichier) et `ios/cameraPermission.js` passent dans `app/src/` ; ils
  tournent maintenant aussi dans les tests d'Android (97 tests, tous verts sans changement). `cameraPermission.js`
  n'est importé par aucun écran (seul son test l'appelle) : à brancher ou retirer, à trancher. Restent dans `overlay/` :
  les 40 notes `["appstore"]` (le prompt leur donne ce chemin), les 12 tests qui relisent des fichiers de `iphone/`
  ou des workflows (avec l'étape `ios/` → `app/ios/`), les 2 pages publiques (FUSION-4) et les 2 images de Pilou.
  24/11 10:30 : `overlay/app/public/` vidé : les 2 images de Pilou des notifications du soir (`companion/`, lues par
  `EveningPlugins.swift`) et les 2 pages publiques de l'iPhone (`conditions-iphone.html`, `confidentialite-iphone.html`)
  passent dans `app/public/`, avec leurs 2 tests (`app/src/ios/conditionsIphone.test.js`, `privacyPolicyIphone.test.js`,
  12 tests verts). `iphone/scripts/site.mjs` et `ios-site.yml` lisent `app/public/`. L'APK embarque ces 4 fichiers
  (≈ 52 Ko, jamais liés hors iPhone : `More.jsx` ne les montre qu'avec `FEATURES.iosStore`). Restent dans `overlay/` :
  les 40 notes `["appstore"]` et 11 tests qui relisent `iphone/` ou les workflows.
  24/11 11:30 : les 10 derniers tests de l'iPhone sortent d'`overlay/` (`app/src/ios/` : abonnements, version d'iOS
  minimale, manifeste de confidentialité, dossier de la copie de secours, nom du magasin, textes, phrases d'usage ;
  `app/src/pages/*.css.appstore.test.js` ; `app/src/settings/onboarding.appstore.test.js`). Ils trouvent le projet
  natif, la fiche App Store et les workflows par `app/src/ios/iphonePaths.js` (app/ios s'il existe, sinon
  iphone/ios ; racine du dépôt = premier parent qui contient iphone/ios) : 248 tests verts depuis `app/` comme depuis
  `iphone/upstream/app`. `upstream.sh` ne copie plus les workflows dans `iphone/.github`. **`overlay/` ne garde que
  les notes `["appstore"]` et leur test** (`changelog.appstore.test.js`, qui a besoin de ces notes) : chemin fixé par
  le prompt. Suite : étape 3, `ios/` → `app/ios/` (à décider : elle demande que les notes iPhone vivent dans
  `app/src/data/changelog/`, contraire au chemin du prompt ; question à l'orchestrateur).
  24/11 15:30 : `cameraPermission.js` tranché : **à retirer** (avec son test, et `requestCamera` de
  `FaceSensePlugin.swift` s'il ne sert à rien d'autre). Il servait l'étape « Ce que Halcya peut utiliser »
  (`ios/PermissionsStep.jsx`, correctif 46), retirée le 08/11 avec le nouvel accueil (PARITE.md, ligne du 8/11 19:00) :
  l'appareil photo se demande à l'activation de la lecture du visage. À faire dans la prochaine PR qui lance de toute
  façon un build iPhone (pas de build de Mac pour du code mort seul : CI économe).
  **Fait le 24/11 16:30** : `ios/cameraPermission.js`, son test et `requestCamera` de `FaceSensePlugin.swift` retirés
  (rien d'autre ne l'appelait), dans la PR de POLISH-SIM-86b.
- [ ] **FUSION-4** : pages publiques de l'iPhone servies par le site de ce dépôt (`/HealthTrack/iphone/`, `pages.yml`),
  adresses de la fiche App Store changées à la version suivante ; « Votre avis » de l'iPhone (correctif 27) vers ce
  dépôt ; ensuite seulement, l'ancien dépôt peut être archivé (geste du propriétaire, à préparer en mission).
  26/11 06:30 : **pages publiées par `pages.yml`** sous `/HealthTrack/iphone/` (`node iphone/scripts/site.mjs
  _site/iphone`, déclencheurs sur leurs sources) ; test `iphone/site/site.test.mjs` (4 pages, liens relatifs qui
  restent sous `/iphone/`, aucune autre plateforme nommée, workflow branché), lancé par `ios-site.yml`. Aucun build
  de Mac (fichiers hors des déclencheurs de `ios-build.yml`). « Votre avis » vers ce dépôt : déjà fait le 24/11
  (`app/src/config/feedback.js`). #1278 mergée, 4 adresses vérifiées en ligne (200). Reste : changer celles de la
  fiche (`store-push.mjs` `SITE`, son test, `notes-examen.md`, `description.txt`, `confidentialite.md`,
  `testflight-externe.md`) ; enfin la mission d'archivage de l'ancien dépôt quand ses builds sont expirées.
  26/11 07:30 : **adresses de la fiche changées** (`store-push.mjs` `SITE` = `…/HealthTrack/iphone`, description,
  notes pour l'examen, `confidentialite.md`, `testflight-externe.md`, `store/app-store/README.md`) ; la page
  d'assistance renvoie aux tickets de ce dépôt ; test rouge d'abord (`store-push.test.mjs` : plus aucune adresse
  `github.io/HealthTrack-iOS` dans ces textes). Aucun build de Mac. #1280 mergée, « Fiche App Store — envoi » vert : la
  version 893 et la confidentialité de l'app ont les nouvelles adresses. Restent : les pages embarquées
  (`app/public/confidentialite-iphone.html`, `conditions-iphone.html`) renvoient encore aux tickets du dépôt iOS, à
  changer dans la prochaine PR qui lance un build iPhone ; puis l'archivage.
  26/11 11:30 : **pages embarquées changées** (`confidentialite-iphone.html`, `conditions-iphone.html` : Contact →
  tickets de ce dépôt), test rouge d'abord (`app/src/ios/pagesIphoneContact.test.js`) ; note de Nouveautés iPhone.
  Reste : l'archivage de l'ancien dépôt (mission, quand ses builds sont expirées).
- [x] **POLISH-OBJ-LIENS** (**sans objet, vérifié le 22/11 04:30** : fait par POLISH-SIM-121 le 20/11, un seul « Comment c’est calculé » en bas de Votre bien-être) (16/11 00:30, vu sur la capture iPhone `demo-clair-recommendations-bien-etre` de #1026, identique sur main) : dans Objectifs › Votre bien-être sans abonnement, deux liens se suivent, « Comment est calculé votre bien-être ? » et « Comment c'est calculé » ; n'en garder qu'un (vérifier où mène chacun), et regarder la même vue sur Android. Petit polish, après 7b.
- [x] **PERF-JOUR** (**FAIT 22/11 04:30** : les tâches du Worker de même clé de cache (`analysisCacheKey` : version, révision des données, jour) partagent une seule lecture de la base, relâchée après 60 s ; sans clé (visite guidée), lecture à chaque tâche ; lecture en échec non gardée ; aucune tâche ne modifie les saisies reçues, testé sur des saisies gelées (`analysisTasksShared.test.js`, rouge d'abord). Mesuré (3 ans de démo, `npm run perf`) : `/tendances?vue=jour` 15 795 enregistrements lus par le Worker au lieu de 31 620 ; budget ramené de 34 500 à 17 500, comme `/tendances`) (16/11 02:30) : Tendances › Jour lance deux analyses complètes dans le Worker (`dayStates` à
  l'ouverture, puis `analysisResults` pour les contributions du jour affiché) : 74 lectures, 31 620 enregistrements
  sur 3 ans de démo, contre 15 810 pour la vue Semaine. Voulu (contributions dès qu'un jour est montré), mais chaque
  tâche relit toutes les saisies : partager la lecture entre les deux tâches du Worker diviserait le coût par deux.
  Budget du garde-fou : `/tendances?vue=jour` à 34 500 (remplace `/journal`, devenu une redirection, en 7b).
- [x] **CI-UBUNTU-26** (**FAIT 26/11 14:30** : Playwright 1.65.1 dans le job perf, Ubuntu 26.04 reconnue dans `playwright-core` depuis la 1.61 ; job remis sur `ubuntu-latest`, vert sur la PR) (15/11 23:30) : `ubuntu-latest` bascule vers Ubuntu 26.04, et Playwright 1.56.1 y refuse
  Chromium (« Playwright does not support chromium on ubuntu26.04-x64 ») : « Budget de lectures (perf) » rouge sur
  #1026 alors qu'il était vert sur main six minutes plus tôt. Fait : ce job épinglé sur `ubuntu-24.04`. Reste :
  passer à une version de Playwright qui prend 26.04 en charge puis retirer l'épinglage ; surveiller les autres jobs
  `ubuntu-latest` (émulateurs, apt, ffmpeg) au fil de la bascule.
- [x] **FUSION-5** (**FAIT 26/11 13:30** : § 2 « Un dépôt, une routine » et § 6 du protocole réécrits, renvoi à la charte de `journal/README.md` ; règle des Nouveautés à jour (`APPSTORE_HIDDEN` dans `app/src/data/changelog.js`) ; paragraphe « Captures de l'iPhone » dans la charte principale) : charte de `iphone/journal/README.md` relue (§ 2 « lecture seule », « DEMANDES ») et fondue dans
  la charte de `journal/README.md` ; captures de l'iPhone liées depuis ce dépôt (branches `captures/main`).

### Demandes de l'ancienne routine iOS encore ouvertes (reprises de `DEMANDES.md` avant archivage, texte complet dans
`iphone/journal/archives/ancien-montage/DEMANDES.md`) — à trier dans le polish, une par run au plus

- [ ] **DEM-IOS-1** (demande du 13/11, état repris : « ouverte ») : (passage des personas iPhone du 13/11, persona 7 « Stressé et pressé », iPhone + Apple Watch, J14, presque rien de noté, version 1019 ; `journal/simulations/2026-11-13-0500-synthese.md`) Code partagé : (1) Accueil sans phrase de synthèse (« j'ai deux chiffres, mais pas de verdict ni de pourquoi ») […]
- [x] **DEM-IOS-2** (**fait le 21/11 13:30** : `theme.js` prend le `SystemBars` exporté par `@capacitor/core` au lieu d'un `registerPlugin` par changement de thème ; le plugin natif de l'app porte ce nom, les appels lui arrivent toujours ; test `themeSystemBars.test.js` rouge d'abord) (demande du 12/11) : (petit) Suite de #930 : `theme.js` (`styleSystemBars`) appelle `registerPlugin('SystemBars')` à chaque changement de thème, alors que Capacitor 8 enregistre déjà `SystemBars` dans `@capacitor/core` : 42 « Capacitor plugin "SystemBars" already registered » dans la console d'une build de captures […]
- [x] **DEM-IOS-3** (**fait le 21/11 15:30** : les trois services exportent leur plugin, correctif iPhone 63 supprimé, 48 correctifs ; test `nativePluginsExported.test.js` rouge d'abord) (demande du 12/11, état repris : « ouverte ») : (petit) Après #930 (un seul `registerPlugin` par plugin) : exporter, comme `NativeAppManager`, les plugins `NativeGutEvening` (`services/gutEvening.js`), `NativeEveningNote` (`services/eveningNote.js`) et `NativePortionReminder` (`services/fodmapReminder.js`)
- [ ] **DEM-IOS-4** (demande du 12/11, état repris : « ouverte ») : (passage des personas iPhone du 12/11, persona 6 « Prendre soin de soi, maigrir », iPhone + Apple Watch, J14, version 1008 ; `journal/simulations/2026-11-12-0600-synthese.md`) Code partagé : (1) le poids n'a ni raccourci ni tuile sur l'Accueil (saisie seulement par Nutrition › « Compléter mon […]
- [x] **DEM-IOS-5** (**fait le 20/11 07:30**, avec le retrait du correctif iPhone 33 ; tests dans `changelog.test.js`) (demande du 11/11, état repris : « ouverte ») : (petit) Note `2026-11-11-1635-noter-objectif.json` (#918, « Accueil : ce que vous noterez suit votre objectif ») : elle commence par « Sans Health Connect » ; la marquer `"variants": ["play", "sideload"]` (règle IOS-3), ou dire « Sans app de santé reliée »
- [ ] **DEM-IOS-6** (demande du 11/11, état repris : « ouverte ») : (passage des personas iPhone du 11/11, persona 4 « Endométriose », iPhone seul, J14, version 988 ; `journal/simulations/2026-11-11-0700-*` de ce dépôt ; reprise de la persona du 10/11 après l'arrivée du cycle) : 1) Analyses › Digestion ne tient pas encore compte du cycle (« Le détail » : jour de la […]
- [x] **DEM-IOS-7** (**fait le 23/11 18:30, mergé le 23/11 22:30 (#1222)** : `IN_APP_SETTINGS` de `config/distribution.js` vaut « Réglages » sur Android et « Réglages de l’app » sur iPhone (23/11 21:30 : le « ⚙ » s’affichait en emoji couleur sur iPhone, remplacé par du texte) ; les 13 renvois aux réglages de l'app (Onboarding, Agir, rappel du soir, divulgation du visage) passent par elle, les chemins des réglages du système (Notifications, Santé, Temps d'écran) gardent « Réglages » ; test `distribution.test.js` qui refuse tout « Réglages › » en dur ; rien ne change sur Android) (demande du 11/11, état repris : « ouverte ») : Après #908 (POLISH-SIM-44) : sur iPhone, « Réglages » est aussi le nom de l'app système d'Apple. Proposition : écrire « la roue en haut à droite › Paramètres » (ou « ⚙ › Paramètres ») plutôt que « Réglages › Paramètres » dans `GutEveningReminder.jsx`, `Recommendations.jsx` et `Onboarding.jsx` […]
- [x] **DEM-IOS-8** (**fait le 21/11 19:30** : `{ key: 'cycle', label: 'cycle', episodic: true }` dans `METRICS` et `!m.episodic` dans `sourceCoverage` passent dans le code partagé, test écrit d'abord dans `healthApps.test.js` ; correctif iPhone 60 fondu, 45 correctifs ; rien de visible sur Android tant que la variante play ne lit pas le cycle dans Health Connect, prêt pour CYCLE-3) (demande du 11/11, état repris : « ouverte ») : Avec CYCLE-3 (Health Connect), compter le cycle dans « Mes appareils » : `{ key: 'cycle', label: 'cycle', episodic: true }` dans `METRICS` de `devices/healthApps.js`, et `stopped: habitual && !m.episodic && …` dans `sourceCoverage` (une mesure par épisodes n'est jamais « arrêtée »).
- [ ] **DEM-IOS-9** (demande du 28/10, état repris : « à transmettre (décision du propriétaire, peut-être avec un avis juridique) ») : **Trancher la licence des poids HSEmotion** (valence / éveil du visage, appris sur AffectNet, réservé à la recherche non commerciale) : idée **I73** d'Android, « visage sans poids AffectNet »
- [x] **DEM-IOS-10** — **fait le 20/11 06:30** (origine `health`, « (Health Connect, 28/10) » sur Android, « (app Santé, 28/10) » sur iPhone ; correctif iPhone 35 fondu dans le code partagé, tests portés dans `app/src`) (demande du 29/10, état repris : « à transmettre ») : (petit) `app/src/services/bodyProfile.js` : un poids venu de Health Connect (`source: 'health_connect'`) a l'origine `manual`, et la carte du profil (Nutrition) l'annonce « (saisi le 26/10) » comme si la personne l'avait tapé ; lui donner sa propre origine (p. ex. `health`) et un libellé « (Health […]
- [x] **DEM-IOS-11** (**fait le 20/11 07:30**, avec le retrait du correctif iPhone 33 ; tests dans `changelog.test.js`) (demande du 29/10, état repris : « à transmettre ») : (petit) Marquer `"variants": ["play", "sideload"]` la note `2026-10-29-0533-paywall-lancement.json` (#494, « Premium offert : dit une seule fois »)
- [x] **DEM-IOS-12** (**fait le 20/11 07:30**, avec le retrait du correctif iPhone 33 ; tests dans `changelog.test.js`) (demande du 7/11, état repris : « ouverte ») : (petit) Les notes de Nouveautés `2026-11-07-2150-norme-apres-changement` et `2026-11-07-2200-bien-etre-du-jour-ts1` sont marquées `["play", "sideload"]`, alors que `POUR-IOS.md` (22:30) les dit valables pour l'iPhone et que le code est partagé : les marquer sans `variants` (toutes variantes) ou […]
- [ ] **DEM-IOS-13** (demande du 8/11, état repris : « Analyses en partie fait en v923 (#846 : une unité par facteur, effets hors échelle masqués) ; le reste ouvert ») : (constats des personas iPhone, 2e passage, version 918 ; `journal/simulations/2026-11-08-2010-synthese.md` de ce dépôt) code partagé, pour votre tri POLISH : Analyses › Bien-être (« −4,7 pt » sur une note sur 5, « −0,0 pt », unité de référence qui change selon la fenêtre, marqueurs pas à l'échelle, […]
- [ ] **DEM-IOS-14** (demande du 8/11, état repris : « ③ en partie fait en v913 (#835 : jours notés, Agir vide expliqué ; #836 : rapport depuis Agir) et v914 (#837 : pas du jo ») : (constats des personas iPhone, `journal/simulations/2026-11-08-1510-synthese.md` de ce dépôt) code partagé : ① le même repas d'hier sans kcal dans Journal › Jours (« Repas 1 ») mais « ≈ 479 kcal » dans Repas ; ② l'outil des personas, en `--store=appstore` comme en play ?, répond « Aucun aliment […]
- [x] **DEM-IOS-15** (**fait le 21/11 17:30** : `.reco-piste-title.is-locked` en conteneur flexible dans `Recommendations.css`, la barre floutée mesurait 0 × 0 et mesure maintenant la largeur de la carte × 12 px, mesuré dans Chromium ; test `lockedPisteBlur.test.js` rouge d'abord ; correctif iPhone 50 fondu, 47 correctifs) (demande du 8/11, état repris : « ouvert ») : (petit, POLISH) Analyses › « Pistes à tester », piste verrouillée (sans abonnement) : la barre floutée `.pistes-first-blur` (`TodayCards.css` : `flex: 1`, `height: 12px`) est un `span` vide posé dans `.reco-piste-title` (`Recommendations.jsx`), qui n'est pas un conteneur flexible : elle n'a ni […]
- [x] **DEM-IOS-16** (**fait le 21/11 18:30** : le motif des identifiants de notes de Nouveautés rejoint `ALLOWED` dans `digestifWording.test.js`, avec un test qui le vérifie (rouge d'abord) ; correctif iPhone 48 fondu, 46 correctifs) (demande du 7/11, état repris : « ouverte ») : (petit, AUJ-7) `src/config/digestifWording.test.js` relève comme « texte visible » les identifiants de notes de Nouveautés qui contiennent « ventre » (ex. `2026-11-06-1935-ventre-grande-police`, cité par la liste `APPSTORE_HIDDEN` de l'iPhone dans `changelog.js`) ; ajouter à `ALLOWED` un motif […]
- [x] **DEM-IOS-17** (fait le 20/11 17:30 : `EveningNote.SCALE_LEGEND`, « 1 = très bas, 5 = très bien », testé en JUnit) (demande du 7/11, état repris : « ouverte ») : (petit, TESTEUR-2c) La notification du soir repliée garde le texte « 0 = très bas, 5 = très bien » (`EveningNoteNotice.java`, `setContentText`), alors que ses boutons vont de 1 à 5 depuis #772 (v855) et que la vue dépliée dit « 1 = très bas, 5 = très bien ».
- [x] **DEM-IOS-18** (**sans objet, vérifié le 22/11 03:30** : Analyses et ses sous-onglets n'existent plus depuis la refonte, aucune route `/analyses` ; Objectifs n'a pas de sous-onglets) (demande du 7/11, état repris : « ouverte ») : (petit, REVUE-320) Sur un écran de 390 points (iPhone 16e, iPhone 12), les sous-onglets d'Analyses passent sur deux lignes : « Bien-être », « Ventre », « FODMAP » puis « Tendances » seul en dessous (captures de #346 à #351), alors que la note de Nouveautés du 6/11 dit qu'ils tiennent sur une ligne.
- [x] **DEM-IOS-19** (**sans objet, vérifié le 21/11 17:30** : `LeverCard` et `reco-advice-text` n'existent plus dans le code ; les pistes d'Objectifs sont des `PisteCard`, titre court suivi d'une phrase) (demande du 6/11, état repris : « ouverte ») : (petit, KEEP-WHOLE) Les titres des pistes (`LeverCard`, `<p className="reco-advice-text">{lever.title ?? lever.action}</p>` de `Recommendations.jsx`) ne passent pas par `keepWhole()` : sur un écran de 390 points (iPhone 16e, iPhone 12 ; sans doute aussi un téléphone Android étroit), « Nuits plus […]
- [x] **DEM-IOS-20** (**fait le 22/11 02:30** : `base: '/'` dans `app/vite.config.js` pour Android aussi (Android sert l'app à la racine de https://localhost/, l'iPhone à celle de capacitor://localhost/) ; test `src/viteBase.test.js` rouge d'abord ; correctif iPhone 41 et son test d'overlay supprimés, 44 correctifs ; `dist/index.html` vérifié : `/assets/…`) (demande du 5/11, état repris : « ⏳ ») : (petit, information, ANALYSES-ONGLETS-1) `/recommendations/ventre` est la première page à deux niveaux accessible dans l'app ; avec `base: './'` (`vite.config.js`), un **rechargement complet** sur cette page cherche les fichiers sous `/recommendations/assets/` : écran blanc. Sur iPhone, c'est […]
- [ ] **DEM-IOS-21** (demande du 10/11, état repris : « ouvert ») : (constats des personas iPhone, passage du 10/11, persona 4 « Endométriose », iPhone seul, J14, version 969 ; `journal/simulations/2026-11-10-1300-endometriose-iphone-J14.md` de ce dépôt) code partagé, pour votre tri POLISH : « Mon cycle » cochable mais sans geste « Règles » ni phase visible (l'aide […]

## 🤖 Automatiser les gestes du propriétaire (décision du 12/11 vers 16:15) — détail : `PRODUIT.md` § 4

- [x] **AUTO-GESTES-1** (12/11 16:35, étape de journal) : classement (a) / (b) / (c) de chaque action ouverte
  (`PRODUIT.md` § 4.0) ; missions `journal/missions/` (P43, P46, P39, P29, P34, P45, ETAT-PLAY, P48, P30, P32, P15,
  P2) ; charte ; relais iOS (POUR-IOS.md 12/11 16:35).
- [ ] **AUTO-GESTES-2** : quand le propriétaire a fait une mission, retirer l'action du § 4 et noter la preuve
  (capture ou constat d'un workflow : par ex. P43 → bilan de « Play — AAB » sans « API pas activée »).
- [ ] **AUTO-GESTES-3** (voie a, récurrente) : à chaque nouvelle action du propriétaire, écrire sa mission ou son
  workflow le même run ; vérifier chaque mois qu'une mission (b) récurrente n'a pas désormais d'API (P45, ETAT-PLAY).
- [ ] **AUTO-GESTES-4** (proposition) : pour P45 jours 8 et 11, la mission range directement le relevé anonyme dans
  une consigne ; la routine le recopie dans `RETOURS-TESTEURS.md` et complète `INVITATION-TESTEURS.md` § 5 (P30).

## 🩸 Cycle (décision du propriétaire du 10/11 vers 18:50 : « Ok cycle ») — exception au mode polish

Réponse aux propositions « lire le cycle depuis l'app Santé » (routine iOS, `journal/maquettes/cycle-sante/PROPOSITION.md`
de HealthTrack-iOS) et PROP-SIM-10 pour sa partie cycle (« Mon cycle » ne débloque rien de visible). Maquettes iOS
comme référence visuelle, sans nouvelle validation. Une étape testable par run. Les données de cycle restent sur le
téléphone ; page de confidentialité mise à jour quand quelque chose s'affiche ou se lit.

- [x] **CYCLE-1a** ✅ 10/11 19:35 Brique partagée, rien d'affiché : `services/cycle.js`. Stockage en entrées ordinaires
  `type: 'cycle'` (`subtype` `period` + `flow` léger / moyen / abondant / inconnu, `spotting`, `symptom` parmi 5) :
  **aucune migration de schéma**, donc export / import JSON et anciennes versions inchangés (test aller-retour,
  « Ajouter » sans doublon). Saisie à midi local, une minute par sous-type pour que le dédoublonnage (source, date,
  type) garde règles et symptômes d'un même jour. `cycleByDay` : jour des règles (un jour oublié ne coupe pas la
  période), jour du cycle (rien avant les premières règles ni au-delà de 60 jours), saignement hors règles qui ne
  commence pas de cycle, saisie la plus récente gagnante. `cycleVisible(goals, hasData)` : rien tant que « Mon
  cycle » n'est pas coché et qu'il n'y a aucune donnée. Données : « N notes de cycle » dans l'aperçu d'import.
- [x] **CYCLE-1b** ✅ 10/11 21:35 Journal › Jours : sous le titre du jour, « Règles · 2e jour · flux moyen » (ordinal
  par `<Ordinal>`, icône goutte rose framboise = corps) suivie des symptômes du jour ; à côté de la date, « 3e jour du
  cycle » les jours sans règles (inutile un jour de règles, la ligne le dit). Entrées `cycle` résumées, jamais listées
  en saisie brute ; lues à part sur 76 jours (le jour du cycle remonte aux dernières règles). Rien sans `cycleVisible`.
  Symptômes « Constipation » et « Diarrhée » ajoutés en fin de `SYMPTOMS` (demande iOS, minutes inchangées, test).
  Option `--cycle` de `npm run visual`. Pas d'entrée Nouveautés : rien ne s'affiche tant qu'on ne peut rien saisir
  (CYCLE-2 l'ajoutera).
- [x] **CYCLE-2** ✅ 10/11 22:35 Bouton « Règles » (goutte, rose framboise = corps) dans le bandeau d'ajout
  d'Aujourd'hui, avant « Autre chose », visible avec « Mon cycle » ou dès qu'une donnée de cycle existe. Fenêtre
  « Mes règles » (`PeriodSheet.jsx`) : un geste (Léger / Moyen / Abondant, ou « Sans préciser le flux ») enregistre le
  jour de règles d'aujourd'hui ; déjà noté : flux coché, « Aujourd'hui, 2e jour des règles », un autre flux corrige la
  même entrée (`periodEntryOn`, aucun doublon), « Retirer » l'efface. Règles lues ailleurs (future source Health
  Connect) : affichées, non modifiables ici. Confidentialité (« règles et symptômes du cycle si vous les notez ») et
  Nouveautés.
- [x] **CYCLE-2b** ✅ 10/11 23:35 Journal › Jours : « … » sur la ligne « Règles » (seulement des règles notées dans
  l'app) → « Modifier » ouvre le choix du flux sur place pour ce jour (`PeriodSheet` avec `dateKey` et `onDone` :
  « 2e jour des règles, flux : », « Annuler » discret) ; « Supprimer » avec confirmation (`DeleteEntryButton`).
- [x] **CYCLE-2c** ✅ 11/11 00:35 Symptômes du cycle en un geste dans « Mes règles » : puces (Crampes… Diarrhée,
  `SYMPTOMS`), touchée = notée (`symptomEntry`, aucun doublon), retouchée = retirée ; `symptomEntriesOn` (cycle.js) ;
  symptômes d'une autre source cochés et grisés ; pas dans le mode « Modifier » du Journal (flux seul).
- [x] **CI-1ER** ✅ 11/11 01:35 Test POL-PLAY-4 de `TodayCards.test.jsx` rouge le 11 du mois (note d'il y a 10 jours = le 1er : l'app dit « 1er », le test « 1 ») : date attendue calculée avec `localeDate`.
- [x] **CYCLE-2d** ✅ 11/11 02:35 « Mes règles » : choix « Aujourd'hui · Hier » en tête (pastille `trends-periods`
  de Tendances : même apparence, même sens) ; « Hier » note flux et symptômes de la veille (« Règles hier, flux : »,
  « Hier, 2e jour des règles », « Retirer ») ; absent du mode « Modifier » du Journal. Au-delà d'hier : Journal › Jours.
- [ ] **CYCLE-3** Lecture de `MenstruationPeriodRecord` / `MenstruationFlowRecord` dans Health Connect (source
  `health_connect`, mêmes entrées). **Bloqué par une action du propriétaire** : ajouter le type à la déclaration
  Health Connect de la Play Console (P48, chemin exact et justification à préparer au début de l'étape dans
  PRODUIT.md §4 et en tête du résumé), puis attendre sa confirmation transmise par le prompt. Si la Play Console ne
  propose le type qu'après l'avoir vu dans une version : cette version en test interne seulement, Alpha retenue.
  Sécurité des données inchangée (rien ne quitte le téléphone).
  **Préparé le 10/11 20:35 (run idées)** : le plugin `@capgo/capacitor-health` 8.4.5 ne connaît aucun type de cycle
  (aucun « menstruation » dans ses sources). Il faut donc un petit pont natif à nous (Java, `connect-client` 1.1.0 déjà
  dans les dépendances du plugin) : `MenstruationPeriodRecord` et `MenstruationFlowRecord`, une seule autorisation
  `android.permission.health.READ_MENSTRUATION` demandée avec les autres, 30 jours puis l'historique comme les autres types.
  Découpage : **CYCLE-3a** pont natif + tests sur enregistrements synthétiques (variante sideload seulement : la
  permission n'est pas ajoutée au manifeste play, `check-play-manifest.sh` le vérifie) ; **CYCLE-3b** après « P48 fait » :
  permission dans la variante play, justification ajoutée à `PLAY-CONFORMITE.md` (tableau des types), confidentialité.
  Geste du propriétaire rédigé : P48 dans `PRODUIT.md` §4.
  - [x] **CYCLE-3a-1** ✅ 13/11 19:45 Côté app, sans natif : `connectors/healthConnectCycle.js` convertit périodes et
    flux en jours de règles (`periodEntry`, source `health_connect` ; fin à minuit, flux 0 à 3, période de plus de
    15 jours écartée) ; la synchro Health Connect les lit par le pont `HealthCycle` s'il existe et si l'autorisation
    est déjà donnée (`getCycleBridge`, rien sinon) ; `cycle.js` : une saisie à la main l'emporte sur un import du
    même jour (`supersedes`). Contrat du pont écrit en tête de `healthConnectCycle.js`. Rien de visible.
  - [ ] **CYCLE-3a-2** Pont natif `HealthCycle` (Java, variante sideload seulement : classe dans `sideload/java`,
    inscrite dans `FlavorPlugins`, `READ_MENSTRUATION` dans le manifeste sideload, `check-play-manifest.sh` vérifie
    qu'elle n'est pas dans play) : `checkPermission`, `requestPermission`, `read` selon le contrat ; conversion des
    enregistrements dans un paquet sans dépendance Android, testé par `npm run test:java` ; test instrumenté
    (`HealthConnectTest.kt` : écrire puis relire une période et un flux synthétiques).
  - [ ] **CYCLE-3a-3** Demande de l'autorisation au bon moment : seulement si « Mon cycle » est coché, sur un geste
    (ligne « Règles » de la source Health Connect dans Sources, ou « Mes règles »), avec ce qui est lu dit avant.
    Limite connue à traiter ici : un jour importé puis supprimé dans le Journal revient à la synchro suivante, et un
    flux ajouté après coup dans l'autre app n'est pas repris (l'import ne réécrit pas un jour déjà rangé).
- [ ] **CYCLE-4** (plus tard) Analyses : le cycle comme contexte de la digestion (variable X, règle 5), jamais une
  cause ni un diagnostic.

## 🚪 Chantier accueil du 08/11 au soir (ACC-1 à ACC-10) — PRIORITÉ ABSOLUE de la session du soir

Mots du propriétaire (08/11 vers 13:30) : « Non, aujourd'hui, ce sur quoi on va travailler, ça va être l'ensemble du tutoriel d'accueil. Je pense qu'on peut le rework complètement aujourd'hui. Quand à la première installation, il y a beaucoup de choses qui se passent, mais je suis pas du tout convaincu. J'aimerais bien faire un petit tutoriel qui explique bien comment fonctionne l'app, etc. La première installation qui permet à la personne de brancher toutes ses sources etc., etc. Et ensuite d'avoir potentiellement une petite preview en fait de ce que donnera l'application une fois qu'elle aura des données. » Il veut que ce soit « prêt avant minuit ce soir ».
Le 08/11 vers 18:00, sur la maquette v3 : « C'est parfait go développer faut que ce soit up ce soir à minuit ».
Maquette validée : artefact « Nouvel accueil Halcya » (https://claude.ai/artifact/D83X3qWWhqU1NofwnihmDZ), copie et
textes exacts dans [`maquettes/accueil/`](maquettes/accueil/) (`TEXTES.md`, `maquette-v3.html`, captures
`android-samsung-watch-*` et `iphone-seul-*`). Décisions D1 à D9 : `PRODUIT.md`.

- [x] **ACC-1** Parcours fixe tuto → goal → sources → found → face (si possible) → first → premium (play), compteur
  calculé une fois, « Continuer » jamais bloqué, « ‹ » partout sauf au premier écran, « Passer » sur les cartes 1 et 2
  du tuto seulement (mène à la carte 3) ; migration de `healthtrack_onboarding` (`flow: 2`, ancien `goal` lu, accueil
  fini jamais relancé) — PR « [Auto] Nouvel accueil (ACC-1 à 4, 6, 7, 9) ».
- [x] **ACC-2** Tuto en 3 cartes (glisser, points, « Suivant » puis « Commencer ») ; carte 3 : les cas où les données
  sortent, vérifiés contre le code (relais IA / Gemini avec la clé en sideload, export et rapport, avis, météo,
  sauvegarde ; abonnement = numéro anonyme). Même PR.
- [x] **ACC-3** Objectifs à choix multiple (gut, cycle, stress, sport, care, all) dans `goals` ; ancien `goal` lu
  (gut → [gut], energy → [stress], all → [all]) ; carte ventre si gut ou cycle ; Paramètres en cases ; « Que
  voulez-vous suivre ? » retiré (`tracks` déduit, lu nulle part). Même PR.
- [x] **ACC-4** « Branchez vos sources » : Health Connect / Santé d'un geste (divulgation au-dessus du bouton), carte
  Huawei si Huawei Santé ou Honor Santé est installée (« Relier ma montre » → Sources à la fin de l'accueil),
  interrupteurs Météo et Temps d'écran. Même PR.
- [x] **ACC-5** « Voici ce que Halcya recevra » : appareils (`sourceName`, apps installées silencieuses avec leur
  réglage), mesures groupées par thème avec reçu / en partie / pas partagée et la raison
  (`src/devices/deviceCapabilities.js`, tiré des 15 configurations), tuiles des 30 jours — #838, #840.
- [x] **ACC-6** Visage : deux tuiles (déverrouillage mis en avant, Android ; ouverture), divulgation en 5 lignes,
  « Activer » / « Plus tard », notification annoncée sous les boutons. Même PR.
- [x] **ACC-7** Première note : 5 visages, « Et votre ventre ? » avec digestion ou cycle, « Enregistrer » crée de
  vraies entrées. Même PR.
- [x] **ACC-8** Visite guidée sur les vrais écrans (13 étapes, digestion avec digestion ou cycle), données fictives en
  mémoire (`src/storage/exampleMode.js`), jamais écrites dans la base, « Voir un exemple » les 14 premiers jours — #841.
  Reste (question au propriétaire) : au jour 14 l'exemple ne montre aucun lien net (moteur honnête).
- [x] **ACC-8b** ✅ 08/11 23:35 (« ok pour les données fictives plus marquées », propriétaire, 08/11 vers 22:55) :
  l'étiquette « jour 14 » montre enfin 14 jours (et non 75 cachés) : `tourData.js` règle un levier (la nuit chez qui
  reçoit son sommeil, sinon deux verres de vin certains soirs) et le bien-être du jour et de la veille sur un motif de
  13 jours, et l'oignon cru au dîner (fructanes) règle la gêne du soir et du lendemain sur un motif de 11 jours. Vrai
  moteur, sur 5 dates et heures × 4 configurations de sources, à l'heure de Paris : jour 14, une piste nette, son détail
  et un essai dans Agir ; jour 28, la piste Fructanes (`tourResults.test.js`). Motifs cherchés sur 14 dates × 4
  configurations × 3 fuseaux. Corrigé au passage : les entrées ajoutées se décalaient d'un jour avant le passage à
  l'heure d'hiver (« maintenant − 24 h » ; le test l'attrape) ; « Un peu moins d'alcool » (élision) dans les essais.
  Captures `runs/captures/2026-11-08-2335-visite-*.png`.
- [x] **ACC-9** Play en période de lancement : écran court « Gold est offert pendant le test » (date du relais) ;
  sinon l'abonnement actuel, sans la croix qui doublait « Continuer gratuitement ». Même PR.
- [x] **ACC-10** Calendrier unique `src/config/firstResults.js` (jour 14, jour 28), lu par le moteur, Aujourd'hui,
  l'abonnement et la visite ; « vers le 21e jour » retiré, test — #840.

## 📈 Corrections du propriétaire du 07/11 vers 23:50 — Journal › Tendances (v896) — PRIORITÉ DES RUNS DE CODE (seule une CI cassée passe avant)

> Ses mots : « L'onglet tendance je suis pas du tout convaincu en v896. Déjà quand tu cliques dessus tu arrives par
> défaut sur la vue par semaine. Sur mon screenshot avec très peu de données tu peux voir que l'interface laisse à
> désirer. Si aucun graph n'est affichable par défaut il faut que le bouton pour en afficher un soit plus gros. » ; vue
> Jour : « il n'y a que le bonheur qui s'affiche sans le "+" […] c'est pas très clair ». Référence : maquette validée
> « Agir et Tendances », captures dans `maquettes/agir-tendances/` (chaque capture de l'app y est comparée).

- [x] **T1** ✅ 08/11 00:35 — À l'ouverture, une courbe dès qu'une mesure le peut : bien-être en Semaine s'il a 3 jours,
  sinon en Jour s'il a des lectures ou des notes ; sans bien-être, la première mesure qui a une courbe ; une demande
  explicite (`?mesure`, `?vue=jour`) prime (`defaultTrendsView`, `trendsData.js`). Vérifié : la page attend le calcul
  TS-1 (`getAnalysis('dayStates')` calcule s'il manque) derrière un indicateur d'attente avant de décider, jamais la
  carte vide ; avec 2 jours de bien-être, TS-1 ne donne que 2 points (< 3), d'où la vue Jour. Aucune mesure choisie :
  les courbes disponibles en grandes puces (48 px), « Choisissez une mesure avec « + » » retiré.
- [x] **T2** ✅ 08/11 01:35 — Vue Jour comme la maquette : lectures du jour (points couleur bien-être) et note (losange), sans moyenne
  en pointillés, sans barres de fourchette par lecture ni légende à cinq entrées ; dessous, le même détail du jour qu'en
  Semaine et Mois (`TrendsDayDetail` : étoile, Humeur et éveil, Ce qui a pu peser). Retirer explicitement l'ancien détail
  (curseurs valence / éveil, barres d'expressions, « Fiabilité mesurée… », « pas un diagnostic », « Deux modèles
  embarqués… ») : `WellbeingHistory` embarqué quitte Tendances. Le « + » reste en Jour ; une mesure sans détail heure
  par heure y est grisée (« une valeur par jour ») et la toucher passe en Semaine. Fait : `DayChart` + `dayReadingsView`,
  ‹ › jour par jour, `WellbeingHistory` (page, CSS, tests) supprimé.
- [x] **T3** ✅ 08/11 02:35 — Captures en tête du résumé : démo et historique presque vide (2 jours), à côté de la maquette
  (`maquettes/agir-tendances/comparaison/`, option `npm run visual -- --history-days=2`). Corrigé au passage : la vue
  Jour s'ouvre sur le dernier jour qui a une lecture ou une note (`latestReadingDay`), plus sur un « aujourd'hui » vide
  la nuit ; la note n'est plus dite deux fois avec deux chiffres (« note 3,4 » en tête et « 3,3 noté ») : une seule
  fois, « votre note 3,4 » sous la valeur du bien-être.
- [x] **T4 / T3-a à T3-c** ✅ 08/11 04:35 (écarts relevés par l'orchestrateur le 08/11 vers 03:30) : la cause de T3-a
  était la démo (valence, éveil et expressions presque constants, valence sur 3 jours seulement) : démo refaite (éveil
  selon l'heure, expressions qui suivent la note, 14 jours de valence et d'expressions), l'étoile a le trait gris et
  « Humeur et éveil » un point par lecture, la moyenne et l'ellipse de l'habitude. Légendes de la maquette (« Le trait
  gris montre votre habitude. », « Chaque point est une lecture ; la zone grise, votre habitude. »). « Ce qui a pu
  peser » dit ce qui s'est passé avec la valeur (`contributionText` : « Nuits plus courtes que d'habitude (6 h 21) »,
  « Plus d'alcool que d'habitude (1 verre) », « ces derniers jours » pour l'horizon moyen) et « −0,29 pt ». « 3,4/5 »
  sans grande espace. Planches refaites dans `maquettes/agir-tendances/comparaison/`.
- [x] **T4-suite** ✅ 10/11 03:35 (`dayValue` au court terme ; « Nuit plus courte/longue que d'habitude (6 h 21) » quand la nuit même va dans le même sens que la fenêtre, sinon le pluriel ; tests) (polish) La valeur de « Ce qui a pu peser » est la moyenne de la fenêtre du facteur (jour même et
  veille pour le court terme) : d'où « Nuits » au pluriel. Si le propriétaire veut « Nuit plus courte (6 h 21) » au
  singulier comme la maquette, exposer la valeur du seul jour dans `dayContributions`. ~~Libellés des axes de la carte
  Humeur et éveil encore tournés à la verticale~~ ✅ 08/11 18:35 : horizontaux de part et d'autre du carré, comme la
  maquette (`MoodMap`, test ; captures `comparaison/jour-humeur-eveil-*.png`).
- [x] **POLISH-SIM-6b** (livré 08/11 19:35 : « Cœur au repos plus rapide/lent », « Variabilité cardiaque plus haute/basse ») « Ce qui a pu peser » (Tendances, détail du jour) dit encore « FC au repos plus basse que
  d'habitude » : écrire « Cœur au repos » ou le nom complet, comme sous la courbe (vu le 08/11 18:35).

## 🧭 Décisions du propriétaire du 07/11 au soir (mode polish, intégrations, personas, méta-leçons) — détail : `PRODUIT.md` § 0

- [ ] **POLISH-0** (A) Dès le 09/11 : plus de nouvelle fonction (propositions avec maquette seulement), sauf (B).
- [ ] **INTEG-1** (B) Garmin et Samsung : inventaire de ce qui arrive par Health Connect, ce qui manque, accès direct
  possible (API, conditions, rétro-ingénierie propre) ; spécification dans `protocoles/`. Puis INTEG-2 Withings, INTEG-3
  Huawei (fin du 21/10 sur Android, Health Kit sur iPhone), INTEG-4 Xiaomi.
- [x] **PERSONAS-1** (C) ✅ 08/11 03:35 : outil `npm run persona` (gestes HTTP → captures, données par matériel et
  par jour, `scripts/persona/personaData.mjs` testé) ; premier passage complet (7 personas) avant l'envoi du soir :
  synthèse `simulations/2026-11-08-0340-synthese.md`. Deux simulations par jour aux runs « idées » ensuite.
- [x] **CI-MIROIR** ✅ 08/11 11:35 : dépendances Android par le miroir Google de Maven Central (avant `mavenCentral()`), Gradle avec reprises et miroir ; panne GitHub 504 du 08/11.
- [x] **POLISH-SIM-1** ✅ 08/11 03:35 : l'erreur de l'IA (« Aucun aliment reconnu ») disparaît dès qu'un aliment est
  ajouté à la main (elle laissait croire que l'enregistrement avait raté).
- [x] **POLISH-SIM-2 (a, b)** ✅ 08/11 10:35 : chaque ligne de « Vos données du jour » ouvre sa courbe dans Tendances
  (`?mesure=sleep|hrv|restingHr|steps|screen|wellbeing|digestion`) ; le « + » entoure 1,6 s les boutons du bandeau
  (anneau sans mouvement, visible même animations réduites).
- [x] **POLISH-SIM-2c** ✅ 08/11 17:35 : « Vos données du jour » ne reprend plus les pas de la veille (un total de la
  journée ; « Pas · hier » faisait chercher ceux du jour, 2 personas sur 2). Sommeil et VFC gardent « nuit d'avant » / « hier ».
- [x] **POLISH-SIM-2** (d'origine) ✅ soldé par 2 (a, b) et 2c. Le petit « + » (AUJ-6) ne fait rien de visible quand le bandeau d'ajout est déjà à l'écran
  (4 personas sur 7) : au moins un retour visible (le bandeau s'anime déjà : le rendre perceptible) ; sinon proposer
  au propriétaire de le retirer sous « Vos données du jour » (rien à y ajouter à la main). Confirmé le 08/11 08:35
  (2 sur 2) ; la ligne Sommeil ne s'ouvre pas non plus (l'ouvrir sur Tendances › Sommeil) ; « Pas · hier » : la
  personne cherche les pas d'aujourd'hui.
- [x] **POLISH-SIM-3** ✅ 08/11 05:35 : unité en tête de chaque axe (/5, h, pas, ms, bpm) ; avec deux axes, chacun
  prend la couleur de sa courbe (test de page, captures `comparaison/semaine-deux-axes-*.png`).
- [x] **POLISH-SIM-3b** ✅ 08/11 06:35 : graduations rondes et régulières (`services/niceAxis.js` : pas de 1, 2, 2,5 ou
  5 × 10ⁿ, 3 à 5 graduations, domaine étendu ; « 4 000 / 6 000 / … / 12 000 » pas, « 6 / 7 / 8 / 9 » h ; demi-heures
  avec une décimale). Tests unitaires et de page ; captures `comparaison/semaine-deux-axes-*.png` refaites.
- [x] **POLISH-SIM-4** ✅ 08/11 07:35 : la ligne du bien-être dit ce qui se mêle à la note (« votre note 3,4 et le
  visage », « … et les jours voisins » sans lecture ; « votre note » seule si les chiffres sont égaux) ; le confort
  digestif rappelle « 5 = calme » (`detailSource`, trendsData.js, 4 tests ; capture `comparaison/jour-note-et-visage.png`).
- [x] **POLISH-SIM-5** ✅ 08/11 15:35 : comptes à rebours en jours notés (« Encore 25 jours notés avant vos premiers
  résultats » dans Analyses, « … avant vos analyses digestives » sur Aujourd'hui) ; « Il faut aussi 5 jours avec une gêne
  ou une douleur notée : vous en avez 1. » ; Agir vide : « l'essayer ici quelques jours pour voir si elle compte pour
  vous » et « Où en sont vos analyses » (→ Analyses). Tests de page ; captures `comparaison/agir-vide-*.png`,
  `analyses-digestion-attente-clair.png`. Reste (idée, pas en polish) : un aperçu utile avant 28 jours.
- [x] **POLISH-SIM-6** ✅ 08/11 14:35 : dans Tendances, une ligne sous la courbe donne le nom complet et l'unité de « VFC
  nuit » et « FC au repos » (`gloss`, TrendsViewer) ; le Journal ouvre cette courbe (une seule maison). Sources : « cœur
  au repos », « variabilité cardiaque », « oxygène du sang ». Corrigé au passage : « attendu » seulement s'il y a un futur tracé.
- [x] **POLISH-SIM-7** ✅ 09/11 08:35 : outil `--goals=` et `--notes=few` ; rejouées (Prendre soin de soi · J45 · `care` ;
  Stressé · J14 · `stress`, presque rien noté). Verdict : oui, Aujourd'hui reste centré sur les repas et la digestion
  même avec ces objectifs (captures `simulations/captures/2026-11-09-0835-*/accueil*.png`) → PROP-OBJECTIF et
  POLISH-SIM-20 à 29.
- [ ] **POLISH-SIM-8** (proposition au propriétaire, avec maquette ; pas de code en mode polish) Poids sur l'Accueil et
  dans Tendances ; phases du sommeil ; cycle et douleur pelvienne (persona Endométriose) ; export CSV.
- [x] **POLISH-SIM-10** ✅ 08/11 09:35 : « Ce qui va avec votre bien-être / confort digestif » (titre neutre) et
  « +0,4 pt » à chaque valeur (Recommendations.jsx, test de page ; capture `comparaison/analyses-va-avec-sombre.png`).
- [x] **POLISH-SIM-11** ✅ 08/11 09:35 : l'écart venait de la carte d'hier dans le Journal (fenêtre des 14 jours avant
  hier). Un jour des 14 derniers reprend désormais l'habitude d'aujourd'hui (`measureNorms(…, { dayKey })`, test) ;
  plus ancien : sa propre fenêtre. Reste possible : un jour très ancien garde son habitude d'alors (voulu).
- [x] **POLISH-SIM-12** ✅ 08/11 16:35 : dans Agir, « rapport médecin » est un lien vers `/data#rapport-medecin` (la carte
  vient à l'écran) ; période proposée = la plus courte qui couvre les jours d'usage depuis la première note du ventre ou
  le premier repas, jamais plus de 4 semaines, choix manuel respecté (`defaultReportWeeks`, `getFirstEntryAt`).
- [x] **POLISH-SIM-13** ✅ 08/11 13:35 : « attendu » en italique gris au-dessus de la partie pointillée (au milieu du
  futur, seulement s'il y a un futur) ; test de page ; captures `comparaison/semaine-attendu-{clair,sombre}.png`.
- [x] **POLISH-SIM-14** ✅ 08/11 22:35 : compteur calculé sur l'horloge (`counterDay`, valeur finale garantie) et projecteur remesuré toutes les 300 ms pendant l'étape (la découpe restait là où la section était vide : c'était la bande blanche) ; tests ; capture `runs/captures/2026-11-08-2235-visite-jour28.png`. À revoir sur l'A56 au prochain passage des personas. (simulations du 08/11 20:35, J1 sur le nouvel accueil) Visite guidée : l'étiquette « EXEMPLE ·
  données fictives · jour 5 » reste affichée sous la bulle « Au jour 28 » (et « jour 11 » sous « jour 14 ») ; elle doit
  dire le jour annoncé par la bulle. Une bande blanche vide couvre le bas de l'écran sous la bulle (barre d'onglets
  masquée) : à reproduire sur l'émulateur A56 avant correction. Capture `simulations/captures/2026-11-08-2035-ventre-sans-technique-J1/visite-jour5-vs-jour28.png`.
- [x] **POLISH-SIM-15** ✅ 08/11 22:35 : avec digestion ou cycle, « Bien-être après 14 jours notés, digestion après 28. » ; test. Visite guidée, étape Analyses : « Elles démarrent après 14 jours notés » alors qu'Aujourd'hui dit
  « Encore 28 jours notés avant vos analyses digestives » ; avec un objectif ventre ou cycle, dire les deux échéances
  (bien-être au jour 14, digestion au jour 28) depuis `config/firstResults.js` (`services/tour.js`).
- [x] **POLISH-SIM-16** ✅ 08/11 21:35 : `sameUnitPerFactor` (variation du court terme pour tous les horizons d'un facteur, effet et fourchette mis à l'échelle, netteté inchangée) et `boundToScale` (|effet| > 4 pt : `outOfScale`, jamais net, exclu de « Ce qui a pu peser », ligne « pas assez de données » sans barre ni chiffre) ; tests moteur et page ; capture `recommendations-2`. Analyses : un effet affiché ne dépasse jamais l'échelle de la mesure (« −4,7 pt » sur une note
  sur 5, Lactose long terme, hachuré) : au-delà, « pas assez de données » plutôt qu'un chiffre ; et une même unité de
  pas pour toutes les lignes d'un même facteur (aujourd'hui 2 000, 1 000 puis 500 pas). Capture
  `simulations/captures/2026-11-08-2035-sportif-J45/analyses-facteurs.png`.
- [x] **POLISH-SIM-17** ✅ 09/11 02:35 : appareil photo fermé sans photo (événement `cancel`, ou `change` sans fichier) → bandeau « Aucune photo prise. Décrire le repas » au-dessus des onglets, 8 s, refermable (`MealPhotoButton`, vaut pour Aujourd'hui, Repas du jour et tuiles) ; tests ; option `--meal-photo-cancel` ; captures `runs/captures/2026-11-09-0235-repas-sans-photo-*.png`. Reste à voir sur l'A56 quand l'appareil photo est refusé. Aujourd'hui : le bouton « Repas » ne donne aucun retour quand l'appareil photo ne s'ouvre pas
  (2 personas sur 2) ; proposer « Décrire » en secours. Vérifier d'abord sur le téléphone (la version web n'a pas de
  caméra). Saisie décrite : heure par défaut = maintenant ; un raccourci « Ce midi / ce soir » serait une proposition.
- [x] **POLISH-SIM-18** ✅ 09/11 00:35 : « 01/06 » sur les trois cartes conforme à la maquette v3 (« 01/07 » sur chaque carte : le tuto est un seul écran, les points disent la carte), rien changé ; écran Gold : « Gold est la formule payante de Halcya, avec toutes les analyses. Comme l’app est encore en test, vous l’avez sans rien payer, jusqu’au … inclus. » ; test ; captures `runs/captures/2026-11-09-0035-gold-{clair,sombre}.png`. Accueil : les trois cartes du tuto affichent toutes « 01/06 » (voulu par ACC-1 ? à confirmer
  contre la maquette v3, sinon 01 à 03) ; « Gold » et « pendant le test » sans un mot d'explication pour une persona
  peu technique (écran ACC-9).
- [x] **POLISH-SIM-19** ✅ 09/11 01:35 : c'était réel côté relais (un repas sans aliment reconnu ou « pas un repas » prenait un crédit). Désormais rendu (`mealHasItems`, `relay/src/server.js`), quota du jour gardé ; test relais rouge puis vert. « 19 analyses IA restantes » après un seul essai sans résultat (« Aucun aliment reconnu ») :
  vérifier dans le relais qu'un échec ne décompte pas (peut venir de l'analyse factice de l'outil).
- [x] **TEND-VIDE** ✅ 09/11 06:35 : Journal › Tendances sur historique vierge : le message seul, sans « Jour / Semaine / Mois » qui ne montraient rien (`TrendsViewer`, test de page ; captures `runs/captures/2026-11-09-0635-tendances-vide-*.png`).
- [x] **INTRO-TITRE** ✅ 09/11 07:35 (revue `--play` de ce run) : la phrase d'introduction des pages `food-page` (Sources, Données, Paramètres, Licences, Montre) partageait la règle de `.section-title` (gras 600, même taille) : « Les apps et appareils… » et « Mes appareils » se lisaient comme deux titres. Règle propre en graisse normale (`Food.css`, test `pageIntroStyle.test.js` rouge puis vert) ; « Version gratuite. Vos notes et vos imports restent, avec ou sans abonnement. » (ancienne phrase bancale). Reste vu : dans Paramètres, « Apparence » (500) et « Abonnement » (600) n'ont pas la même graisse de titre.
- [x] **POLISH-SIM-20** ✅ 09/11 09:35 : c'était le rideau de « Voir dans 14 jours » (1 s, couleur du fond) peint au-dessus du voile ; il passe maintenant sous le voile (avant lui dans le DOM, `GuidedTour.jsx`), l'écran se remplit assombri ; test rouge puis vert ; captures `runs/captures/2026-11-09-0935-visite-{avant,apres}-light-milieu.png`. Outil des personas : capture après la fin du rideau. Reste à voir sur l'A56 au prochain passage. (rouvre POLISH-SIM-14) Visite guidée « Voir un exemple » : la **moitié basse de l'écran est
  encore blanche** sous la bulle « Votre bien-être du jour » (capture `simulations/captures/2026-11-09-0835-stresse-presse-J14/exemple-jour10.png`,
  outil à 412×915). Reproduire avec `npm run persona` puis corriger ; vérifier sur l'émulateur A56.
- [x] **POLISH-SIM-21** ✅ 09/11 09:35 : artefact de l'outil (capture à 600 ms, compteur de 900 ms) ; l'étiquette finit bien à « jour 14 » (capture `runs/captures/2026-11-09-0935-visite-apres-light-fin.png`) ; `persona-browse.mjs` attend désormais la fin de l'animation. « Voir un exemple » propose « Voir dans 14 jours » puis l'étiquette dit « jour 10 » : un seul
  jour, celui annoncé (persona Stressé, J14).
- [x] **POLISH-SIM-22** ✅ 09/11 10:35 : la VFC n'était pas encore arrivée ce matin-là, la ligne reprenait celle d'hier (« · hier ») et la norme ne comparait que la valeur du jour. `TodayBySource.jsx` compare une valeur reprise de la veille (« hier », « nuit d'avant ») à la même habitude (`measureNorms` avec `dayKey`, comme le Journal) ; test rouge puis vert ; captures `runs/captures/2026-11-09-1035-vfc-habitude-*.png`. Aujourd'hui › Vos données du jour : la **VFC nuit (51 ms) n'a pas son « d'habitude »**,
  alors que le sommeil et le Journal l'ont. Même ligne que le sommeil.
- [x] **POLISH-SIM-23** ✅ 09/11 11:35 : ligne « pt : points de votre note de bien-être, sur 5. » (ou « de confort digestif ») sous le premier titre à barres, une fois ; « Comment c'est calculé » = deux phrases simples, méthode sous « Le détail » ; « Moyen terme : dans N jours de notes » comptait bien des jours notés (`daysHave` = jours du résultat connus), devient « encore N jours notés » comme le compte à rebours ; tests `Recommendations.test.jsx` rouges puis verts ; captures `runs/captures/2026-11-09-1135-analyses-*`. Analyses : l'unité « pt » n'est expliquée nulle part (« points de bien-être, sur 5 ») ; une
  ligne sous le titre, une fois. « Comment c'est calculé » : deux phrases simples d'abord (« modèle régularisé »,
  « fenêtres 7 à 27 jours » repliés) ; « Moyen terme : dans 7 jours de notes » à vérifier (dit-il bien des jours notés ?).
- [x] **POLISH-SIM-24** ✅ 09/11 12:35 : règle unique `isLikelyIncompleteEnergy` (sous la moitié de la référence) partagée par Nutrition et le Journal ; la tuile Repas dit « repas incomplets ? » face à la dépense du jour ; test rouge puis vert ; captures `runs/captures/2026-11-09-1235-repas-incomplets-*`. Journal › Jours : « dépense 2 285 kcal » à côté de « 479 kcal » de repas notés suggère un gros
  déficit ; dire « repas incomplets ? » comme Nutrition le fait déjà (une information, une maison : reprendre la même
  règle).
- [x] **POLISH-SIM-25** ✅ 09/11 13:35 : les deux liens « Décrire » passent `describeMeal` à la page Repas, qui ouvre le formulaire avec le champ « Décrivez votre repas » déjà actif ; tests rouges puis verts ; captures `runs/captures/2026-11-09-1335-decrire-repas-*`. « Autre chose › Décrire un repas » ouvre la page Repas générale : ouvrir directement le champ
  « Décrire ».
- [x] **POLISH-SIM-26** ✅ 09/11 14:35 : « Halcya en tire une note et des précisions à vous proposer ; la phrase n’est pas enregistrée. » ; test rouge puis vert ; captures `runs/captures/2026-11-09-1435-phrase-bien-etre-*`. Note de bien-être : « Elle propose des précisions, elle n'est pas gardée » incompris (persona
  Stressé) ; reformuler en une phrase concrète.
- [x] **POLISH-CONTRASTE-NOTE** ✅ 09/11 17:35 : `.wellbeing-circle-selected` sur `--mint-bg` / `--mint-label` (couple vérifié par `tokens.test.js`), rond plein de la même couleur ; test `wellbeingNoteContrast.test.js` rouge puis vert ; plus d'alerte de l'outil visuel ; captures `runs/captures/2026-11-09-1735-contraste-note-*`. Note de bien-être, thème clair : le chiffre de la note choisie (« 4 » vert sur fond vert
  pâle) n'a que 3,72:1 (outil visuel, 09/11 14:35) ; viser ≥ 4,5:1 avec les tokens.
- [x] **POLISH-SIM-27** ✅ 09/11 15:35 : un niveau estimé d'après les pas se lit « Modérément actif d’après vos pas » (détail au toucher) ; test rouge puis vert ; captures `runs/captures/2026-11-09-1535-activite-pas-*`. Profil nutrition : « Automatique » devient « Modérément actif » sans dire pourquoi ; ajouter
  « (d'après vos pas) ».
- [x] **POLISH-SIM-28** ✅ 09/11 16:35 : la « ligne grise » n'était pas une habitude mais l'unique ligne de grille
  (graduation du milieu) ; un libellé « d'habitude » aurait été faux. La grille suit maintenant chaque graduation de
  l'axe de gauche (comme la vue Jour) ; test rouge puis vert ; captures `runs/captures/2026-11-09-1635-grille-tendances-*`.
  Règle : un trait seul se lit comme une référence ; un repère sans sens ne doit pas ressembler à une donnée.
- [x] **POLISH-AGIR-PROPOSE** ✅ 09/11 18:35 (écart à la maquette `maquettes/agir-tendances/agir.png`) : une carte
  « Proposés par vos analyses » disait « Tester : sommeil / Lien repéré avec votre bien-être, court terme. ». Elle dit
  la consigne des jours « avec » de l'essai qui démarrera (« Dormir au moins 7 h 53 », « Un peu moins d’alcool que
  d’habitude ») et « Lien repéré : +0,2 point de bien-être pour 40 min de sommeil de plus. 14 jours, un jour sur deux
  tiré au sort. » (`proposal`, `services/trials.js`) ; tests rouges puis verts ; captures
  `runs/captures/2026-11-09-1835-agir-propose-*`. Restent vus : la réintroduction FODMAP proposée dit « Tester les
  fructanes » (maquette : « Réintroduction : les fructanes », avec le tag du thème) ; un essai en cours garde le nom du
  facteur (« Sommeil ») comme titre, la maquette y met la consigne (« Se coucher avant 23 h »).
- [x] **POLISH-AGIR-TITRES** ✅ 09/11 19:35 (restes de POLISH-AGIR-PROPOSE, maquette `maquettes/agir-tendances/`) :
  un essai en cours, terminé et sa page ont pour titre la consigne des jours « avec » (« Dormir au moins 7 h 30 »),
  plus le nom du facteur ; la carte en cours dit « Jour 8 sur 14. Aujourd’hui, jour avec. » (ou « jour sans : comme
  d’habitude », mots de la page de l'essai) ; la réintroduction FODMAP proposée, en cours ou terminée s'appelle
  « Réintroduction : les fructanes » ; la carte du jour de la page d'essai ne répète plus la consigne (« Aujourd’hui,
  jour avec. »). Tests rouges puis verts ; captures `runs/captures/2026-11-09-1935-*`. Reste vu, non fait : l'étiquette du thème
  (« Sommeil », « Digestion ») en haut à droite des cartes de la maquette ; la couleur de la carte dit déjà le thème
  (une information, une maison) : à juger aux personas avant d'ajouter.
- [x] **POLISH-ESSAI-GRILLE** ✅ 09/11 21:35 (écart à la maquette `essai-en-cours.png`, vu le 09/11 19:35) : page d'un essai, les 14
  pastilles se rangent en 13 + 1 à 412 px ; la maquette montre deux lignes de 7 numérotées (semaine 1, semaine 2).
  Fait : « Les 14 jours », cases numérotées en 2 × 7, ✓ / – au coin (captures `runs/captures/2026-11-09-2135-*`).
- [x] **POLISH-ESSAI-ORDRE** ✅ 09/11 22:35 (écart à la maquette `essai-en-cours.png`, vu le 09/11 21:35) : la maquette met « Résultat en
  cours » avant « Les 14 jours » et sa légende reprend la consigne (« ● avant 23 h ○ comme d'habitude ✓ tenu · – pas
  tenu ») au lieu de « Pleine : jour avec. Contour : jour sans. »
  Fait : résultat avant le calendrier, légende avec la consigne (captures `runs/captures/2026-11-09-2235-*`).
- [x] **POLISH-ESSAI-VIDE** ✅ 09/11 23:35 : sans point, le graphique s'affiche avec ses axes Avec / Sans et une piste
  « Écart » vide (ligne de base), une seule phrase (« Chaque point : … »).
- [x] **POLISH-ESSAI-CLASSE** ✅ 09/11 23:35 : lignes du graphique SVG en `trial-chart-line` (la grille du calendrier
  garde `trial-grid`).
- [x] **POLISH-ESSAI-AXES** ✅ 10/11 00:35 (un seul SVG : Avec et Sans en lignes sur une échelle resserrée, pas d'un
  demi-point ; Écart gradué ±1 ou ±2 avec fourchette ; phrase « Après N lendemains : … point, entre … et … » ; captures
  `runs/captures/2026-11-10-0035-essai-axes-*` ; outil visuel `--trial=N [--trial-factor=alcohol]`). Restent vus : la
  maquette ajoute « La fourchette se resserre chaque jour. » (non repris : texte de plus) ; les valeurs de démo sont
  souvent des notes entières, les points se superposent (normal, pas de dispersion inventée). Vu le 09/11 23:35 : la maquette (`maquettes/agir-tendances/essai-en-cours.png`) range Avec
  et Sans en deux lignes sur un axe horizontal commun (2,5 → 4,0) aligné sur la piste « Écart » (−1 / 0 / +1 gradués),
  avec la phrase « Après N lendemains : +0,3 point, entre … et … ». L'app dessine deux colonnes verticales de 1 à 5 et
  une piste « Écart » sans graduation. Rapprocher le graphique de la maquette (un run).
- [x] **POLISH-REINTRO-AGIR** ✅ 10/11 01:35 (revue `--play` du run) : `/reintroduction`, rangée sous Agir (TabBar),
  affichait encore `AnalysesTabs` (« Bien-être · Digestion », aucun actif) : reste de l'ancienne organisation (04/11).
  Retiré, retour « ← Agir » (`act-back`, comme `Trial.jsx`) ; test rouge puis vert ; captures
  `runs/captures/2026-11-10-0135-reintro-agir-*`. Vus sans changement : Réglages, Sources, Vos données, Premium.
- [x] **POLISH-BARRE-VIDE** ✅ 10/11 02:35 (revue `--play --empty` du run) : à « 0/28 jours avec une note digestive »
  (Aujourd'hui) et « 0/14 jours » (Analyses), le rail seul, aussi foncé que le permet son contraste minimal avec le fond
  (1,4:1), se lisait comme une barre pleine. Le remplissage garde un point de départ rond (`min-width` = hauteur du
  rail) ; test `progressStart.test.js` rouge puis vert ; captures `runs/captures/2026-11-10-0235-barre-vide-*`. Reste
  vu, non fait : sur Aujourd'hui vide, le petit « + » (AUJ-6) seul en bas à droite de la carte Digestion laisse un grand
  blanc sous « Noter ma digestion » ; à juger au prochain passage des personas.
- [x] **POLISH-PROFIL-SERRE** ✅ 10/11 04:35 (revue `--play` du run : Nutrition, Repas, Analyses › Digestion, Plus,
  Nouveautés, Premium en sombre) : dans « Votre profil » (Journal › Nutrition), chaque valeur touchable avait
  `min-height: 44px` pour 20 px de texte (trois lignes à 48 px de pas, la carte sur la moitié de l'écran). Valeurs et
  « À compléter » à 28 px avec un `::after` invisible de 8 px dessus et dessous (cible de 44 px) ; l'outil visuel
  compte ce débord dans « CIBLE < 44 px » ; test `profileCompact.test.js` rouge puis vert ; captures
  `runs/captures/2026-11-10-0435-profil-serre-*`. Vus sans défaut : Repas, Analyses › Digestion, Plus, Nouveautés,
  Premium (formules hors période de lancement).
- [x] **MONO-MOTS** ✅ 10/11 06:35 (suite de MONO-CHIFFRES) : mots encore en mono retirés : étiquettes « premium »
  (Réintroduction, rapport médecin), nom du groupe et « résultat » de la Réintroduction, « Jour 1 » des portions,
  étapes du déroulé, « d'après vos notes digestives », « jour 14 » de la visite, « type 4 » des selles, « 6 h » de la
  frise digestive, « ≈ 480 kcal » des repas, « pt » d'Analyses, valeur de Tendances (« 3,3 »). Test garde-fou : aucun
  `.mono` avec une lettre sur l'écran des portions. Reste (mineur) : règles CSS qui mettent en mono des étiquettes
  entières (`.paywall-tag`, `.watch-data-tag`, `.nutrition-partial-tag`, `.mood-chip`, `.reco-meta-line`, Onboarding).
- [x] **MONO-MOTS-2** ✅ 10/11 07:35 : paywall (`.paywall-tag`, prix, « par mois », badge, frise de l'essai) hors mono sauf
  les chiffres, test garde-fou (DOM et CSS). Colonnes de jours de Tendances : `data-scrub` (bande jointive, plus
  d'avertissement « CIBLE < 44 px »).
- [x] **MONO-MOTS-3** ✅ 10/11 09:35 : écran Montre (`.watch-data-tag/-date/-meta`, valeur via `monoDigits`),
  `.nutrition-partial-tag`, accueil (`.onb-import-line`, `.onb-fact-value` via `monoDigits`, `.onb-fact(s)-source`,
  `.onb-measure-status`) hors mono ; règles mortes retirées (`.reco-meta-line`, `.reco-evidence*`, `.reco-link-meta/-src`,
  `.mood-chip(s)`, `.mood-chip-gut`, `.onb-tile-num`, `.onb-choice-num`, `.onb-gesture-btn.mono`). Test garde-fou
  `src/monoMots3.test.js` (rouge puis vert) et test DOM de l'écran Montre ; captures `runs/captures/2026-11-10-0935-mono-mots-3-*`.
  Reste voulu en mono : le compteur « 04/05 » de l'accueil (chiffres seuls).
- [x] **MONO-VIRGULE** ✅ 10/11 10:35 (revue `--play --dark` du run) : « 3 , 2 /5 » sur la carte bien-être d'Aujourd'hui
  (valeur entière en `span.mono`, virgule à chasse fixe), « +0,4 pt » d'Analyses et « Niveau avant/après » de Tendances
  passent par `monoDigits` ; test rouge puis vert ; captures `runs/captures/2026-11-10-1035-mono-virgule-carte-*`.
  Restent en mono, voulu : graduations SVG (`<text>`).
- [x] **MONO-CHIFFRES** ✅ 10/11 05:35 (revue `--play` du run, leçon 11 « police mono pour les chiffres seulement ») :
  « 6 h 30 », « d'habitude 49 ms » (Aujourd'hui), tuiles du Journal (« 37, normal », « 69 à 83 bpm », « 10 085 »),
  quantités des repas (« 150 g »), Tendances (valeur, fourchette, « +0,4 pt », « 31 % » de l'étoile) et « 1 847 entrées »
  étaient entièrement en mono : unités, espaces et virgule y prenaient une chasse fixe. `utils/monoDigits` ne met en
  mono que les suites de chiffres (signe compris) ; l'espace des milliers reste un nœud de texte (nom accessible
  inchangé), le groupe d'avant prend 0,12 em de marge ; `.mono` aussi dans `tokens.css` (pages chargées à la demande).
  Tests rouges puis verts ; captures `runs/captures/2026-11-10-0535-mono-chiffres-*`. Restent vus, non faits : étiquettes
  en mono qui sont des mots (« premium » de Vos données, `fodmap-tag`, `fodmap-kicker` de la Réintroduction) ; « 3,3 »
  du détail de Tendances (virgule mono) ; à reprendre avec `monoDigits` au prochain run.
- [x] **INTRO-TITRE (reste)** ✅ 09/11 18:35 : vérifié au navigateur, les six titres de Paramètres ont la même graisse
  (600, 16 px, Figtree) ; l'écart vu le 09/11 07:35 n'existe pas. Rien changé.
- [ ] **PROP-OBJECTIF** (proposition au propriétaire avec maquette, run « idées » ; pas de code sans accord)
  Aujourd'hui selon l'objectif coché : sans « Ma digestion » ni « Mon cycle », « Digestion » quitte le bandeau
  d'ajout, « Repas » n'est plus le seul bouton plein et la carte « Mes repas du jour » se replie après 14 jours sans
  repas ; avec « Prendre soin de moi », le poids a une place (rejoint POLISH-SIM-8) ; avec « Mon stress et mon
  sommeil », une ligne qui dit la nuit et la VFC par rapport à l'habitude. Deux personas sur deux l'ont relevé (09/11).
  À étudier dans la même maquette : Agir vide après 14 et 45 jours (« Rien en cours ») ; Analyses qui n'a que le
  bien-être comme mesure suivie (sommeil ou VFC comme résultat : vérifier la règle 5 avant de proposer) ; synthèse
  « ce mois-ci et le mois dernier » dans Tendances. Un essai générique (« se coucher plus tôt ») heurte la règle 6 :
  seulement comme hypothèse de départ dite comme telle.
- [x] **POLISH-SIM-30** ✅ 10/11 14:35 (2 personas sur 2, `simulations/2026-11-10-1435-synthese.md`) : Analyses, le
  hachurage « pas assez net » ne se voyait pas sur les petites barres ; chiffre en gris pour un lien pas assez net,
  légende « hachuré, chiffre en gris : pas assez net » ; test rouge puis vert. Reste (idée) : toucher une ligne pour
  voir la fourchette chiffrée et le nombre de jours.
- [x] **POLISH-SIM-31** ✅ 12/11 00:35 « 3/5 d'après 3 lectures du visage » sur Aujourd'hui, rien dans le Journal du
  jour : pas un écart de calcul (Aujourd'hui et Tendances › Jour comptent les mêmes lectures du jour), mais le bloc
  ouvrait Tendances en Semaine, où ce nombre n'apparaît pas. Il ouvre Tendances › Jour (`vue=jour`, `DayStatusCard`) ;
  le Journal reste sans lectures (une information, une maison). Test rouge puis vert.
- [x] **POLISH-SIM-32** ✅ 11/11 22:35 Compteur « 9/28 jours » : aucune fenêtre (tous les jours notés, comme le moteur) ;
  le compteur dit « jours notés, pas forcément d'affilée » (Aujourd'hui et Analyses) ; Aujourd'hui ne lit plus seulement
  42 jours (`services/gutNotes.js`). Le 9/28 à J45 venait de l'outil (démo : 10 jours de notes) : objectif ventre et
  profil `full` = une note chaque soir. Tests rouges puis verts.
- [x] **POLISH-SIM-33** ✅ 10/11 15:35 : Analyses s'ouvrait sur Bien-être avec l'objectif « Ma digestion » ; l'onglet
  du bas mène à Digestion avec « Ma digestion » ou « Mon cycle » (`TabBar`, test rouge puis vert).
- [x] **POLISH-SIM-34** ✅ 12/11 01:35 Tendances, détail d'un jour : sous « Sommeil » seul (ou Pas…), plus de
  « N lectures du visage » ni de « Ce qui a pu peser » (le modèle n'explique que le bien-être et la digestion) ; une
  barre dont le lien est « pas assez net » dans Analyses est hachurée, chiffre en gris, avec la légende d'Analyses
  (`dayContributions` donne `net`) ; soleil de la démo selon la saison (≤ ~4 h en novembre, il en donnait 8). Tests
  rouges puis verts.
- [x] **POLISH-SIM-35** ✅ 12/11 03:35 (SpO₂ de la nuit pour `watch`, `full`, `huawei` ; `--source=` ; et dans l'app, « Dernières mesures » prend la fin d'un total du jour, plus son début : « il y a 2 jours » pour les pas d'hier) Outil des personas : `--equipment=watch` (Galaxy Watch) sans SpO2 (« Jamais reçu : oxygène
  du sang ») ; source « Samsung Health » sur un Pixel en `phone`. Aligner sur `PERSONAS.md` ; vérifier aussi « dernières
  mesures il y a 2 jours » face aux pas d'hier.
  Complété le 10/11 20:35 : « Samsung Health · Reçu » aussi pour une Amazfit (`watch`) et un iPhone (`phone`), à côté
  de « Health Connect n'est pas sur ce téléphone ». Faux relais corrigé le même run (crédits 20 sur 20, `ingredients`).
- [x] **POLISH-SIM-36** ✅ 10/11 16:35 (1re moitié) Journal : la tuile Sommeil ne s'ouvrait pas. Chaque tuile du jour
  qui a une courbe (Sommeil, Pas, VFC nuit, FC au repos, Écran, Bien-être) ouvre Tendances sur cette mesure, comme
  Aujourd'hui ; tuile entière touchable (≥ 44 px) ; test rouge puis vert.
- [x] **POLISH-SIM-36b** ✅ 10/11 18:35 Journal : le « … » d'une note de digestion n'offrait que « Supprimer ».
  « Modifier » ouvre sur place Calme / Gêne / Douleur (mêmes choix que la carte ventre), heure et portée gardées ;
  test rouge puis vert. Reste (possible) : ouvrir Tendances sur le jour touché (paramètre de date).
- [x] **POLISH-SIM-37** ✅ 11/11 18:35 Vos données : « Un fichier JSON, rangé dans Documents. » ; « Voir un exemple »
  relance la visite à l'écran où on le touche (Analyses › Digestion : l'exemple digestion, même sans l'objectif ventre) ;
  tests rouges puis verts.
- [x] **POLISH-SIM-37b** ✅ 11/11 19:35 Exemple digestion relancé sans l'objectif ventre : le bandeau « Le suivi
  digestif est masqué » se cache pendant le mode exemple et revient à la sortie (`Recommendations`, test rouge puis vert).
- [x] **POLISH-SIM-37c** ✅ 11/11 20:35 Le badge « Exemple · données fictives · jour 28 » recouvrait le nom « Halcya »
  de l'en-tête : il passe en tête de la bulle de la visite (`GuidedTour`, test rouge puis vert).
- [x] **POLISH-SIM-38** ✅ 11/11 03:35 Accueil, 2e carte du tuto : « Trois onglets, trois usages » alors que la barre
  en a cinq. Devient « Trois usages : » (Journal, Analyses, Agir) ; test du texte rouge puis vert ; `TEXTES.md` de la
  maquette annoté.
- [x] **POLISH-SIM-39** ✅ 11/11 23:35 (2 sur 2) Visite guidée : les boutons qui ouvrent l'exemple disent « Exemple au
  jour 14 » (ou 28) au lieu de « Voir dans 14 jours » / « Voir au jour N » ; faute de place, le bouton passe sous
  « Passer la visite » sur une ligne. Compte fictif : une note digestive chaque soir avant le jour 28 aussi (niveaux de
  la démo gardés), l'exemple au jour 14 dit « Encore 14 jours » (il disait 18) ; tests rouges puis verts.
- [x] **POLISH-SIM-40** ✅ 11/11 10:35 (3 simulations, dont Maigrir J1 du 11/11) Aujourd'hui › « Vos données du jour » : pas (et FC de la montre)
  absents au J1 alors que Journal › Jours les montre ; Bien-être y fait doublon avec la carte du dessus. Reproduit :
  artefact des données de démo (aucun pas pour la journée en cours, alors que la synchro Health Connect lit jusqu'à
  maintenant) ; la démo et l'outil personas ont désormais les pas du jour au prorata de l'heure (test). Doublon retiré :
  le bien-être n'a qu'une maison, sa carte (test rouge puis vert). FC de la montre : pas de ligne FC instantanée par
  choix (seule la FC au repos), rien à corriger.
- [x] **POLISH-SIM-41** ✅ 11/11 07:35 (Endométriose J1) Feuille Digestion : deux lignes « dans l'ensemble » et « À l'instant » aux
  mêmes boutons, sans dire laquelle choisir. Le soir, une seule rangée à la fois : le bilan de la journée, ou (après
  « Noter un moment précis ») « À l'instant » seule, avec « Bilan de la journée » pour revenir ; test rouge puis vert.
  Reste dans PROP-SIM-10 (proposition) : lieu et intensité d'une douleur pelvienne, « ballonné ».
- [x] **POLISH-SIM-42** ✅ 11/11 06:35 (Endométriose J1) « Autre chose » propose « + 1 cigarette » sans objectif tabac.
  La fenêtre ne note plus de cigarette d'un toucher : « Je fume : compter mes cigarettes » (même ligne que « Décrire un
  repas ») active le compteur, qui passe dans le bandeau ; le retrait se fait dans Réglages › Paramètres › Cigarettes
  (bloc visible en play dès que le compteur est actif) ; test rouge puis vert. Pas d'objectif tabac ajouté (mode polish).
- [x] **POLISH-SIM-43** ✅ 11/11 04:35 (Stressé J1) Agir dit « quelques jours », l'accueil « un essai de deux semaines » :
  une durée. Réintroduction 3 jours, piste 14 jours : l'accueil dit « vérifier une piste par un essai », Agir vide « de
  quelques jours à deux semaines selon la piste » ; tests rouges puis verts ; `TEXTES.md` annoté.
- [x] **POLISH-SIM-44** ✅ 11/11 05:35 (Stressé J1) L'accueil renvoie à « Paramètres », la roue ouvre « Réglages » : un seul nom.
  Chaque renvoi donne le chemin depuis la roue, « Réglages › Paramètres » (accueil objectif et visage, rappel du soir,
  Agir) ; tests rouges puis verts.
- [x] **POLISH-SIM-45** ✅ 11/11 17:35 (Stressé J1) Journal › Jours : tuiles « Écran » et « Météo » au J1 sans source
  branchée. Vérifié : artefact de l'outil personas, pas de l'app (la météo n'existe qu'après le choix d'une position,
  le temps d'écran qu'après l'accès à l'utilisation). `personaData` retire `weather` et `phone_usage` au jour 1 (test
  rouge puis vert) ; au-delà, `persona-browse` coche la météo (Paris, météo du jour fictive) pour que Sources la dise
  activée ; `brief.md` : le temps d'écran n'a pas de carte dans la version web. Idée liée : PROP-SIM-13.
- [ ] **PROP-SIM-13** (proposition avec maquette, pas de code sans accord ; Stressé J1) au J1 avec un historique de
  montre importé, Analyses ne montre que « Encore 13 jours notés » : un premier aperçu tiré de l'historique (sommeil,
  pas, FC ; sans bien-être, donc sans Y : seulement des tendances descriptives, règle 5) ?
- [x] **POLISH-SIM-46** ✅ 11/11 11:35 (Endométriose J45) « Mes règles » : un symptôme touché (Crampes) ne montre pas clairement qu'il
  est noté (Digestion affiche « Dernière note… »). Fait : coche ✓ dans la puce notée (l'état ne tient plus à la seule
  couleur) et ligne courte « Noté : Crampes » / « Retiré : Crampes » (role=status), effacée au passage Aujourd'hui ⇄ Hier.
- [x] **POLISH-SIM-47** ✅ 11/11 13:35 (mesure « Poids » en kg, thème corps, dernière pesée du jour, poids ou composition ; lue par Tendances ; dès 3 pesées sur la période, donc Mois pour qui se pèse chaque semaine ; graduations à 2 décimales, « 77,25 » au lieu de « 77,3 ») (Maigrir J1) Tendances : une pesée (à la main ou balance) n'a aucune courbe, le « + » ne propose
  pas Poids. Vérifier où le poids s'affiche ; s'il est déjà dans le Journal, l'ajouter aux mesures de Tendances.
- [x] **POLISH-SIM-48** ✅ 11/11 12:35 (total « ≈ 592 kcal, sans … » ou « inconnu, aucun aliment compté » ; « ≥ » dans les listes ; le relais ne contraint pas le nom par un enum, un nom hors table reste possible) (Maigrir J1) Repas : un aliment absent de la table compte pour 0 et le total affiche « ≈ 0 kcal »
  sans le dire. Afficher l'aliment non compté et un total marqué incomplet (vu avec le faux relais de l'outil ; vérifier
  que le vrai relais peut renvoyer un nom hors table).
- [x] **POLISH-SIM-49** ✅ 11/11 14:35 (champ « Nom » sous l'analyse photo, dans « Décrire » et « Modifier » d'un repas qui a un nom ; vide = repas sans nom ; le titre ne répète plus le nom) (Maigrir J1) Repas : le nom du plat proposé par l'IA ne se modifie pas après correction des
  aliments.
- [x] **POLISH-SIM-50** ✅ 11/11 15:35 (« Lactose change de sens selon le délai : rien à en tirer pour l'instant. » sous la légende, si le facteur n'est net à aucun délai ; rien de net du tout : « Rien n'est net pour l'instant (barres hachurées, chiffres en gris) : ces chiffres bougeront avec vos prochains jours notés. » en tête, sans légende) (Endométriose J45) Analyses : un même facteur (Lactose) affiche des écarts de signes opposés
  selon le délai, sans dire quoi en retenir. Vérifier la présentation (si rien n'est net, le dire une fois).
- [x] **POLISH-SIM-51** (fait 11/11 16:35, `handNotes`) (Maigrir J1) Accueil, « Votre téléphone suffit » : la liste (bien-être, digestion, repas en
  photo) ignore l'objectif choisi ; l'adapter (poids : repas, pas).
- [x] **POLISH-SIM-52** ✅ 12/11 09:35 (« prêtes » seulement avec un lien net ; sinon « Analyses digestives : aucun lien net pour l’instant », ou « Voir vos analyses digestives » si Analyses n'a jamais été ouvert) (Ventre et données J45, 12/11 08:35) Aujourd'hui : la carte « Vos analyses digestives sont
  prêtes » ouvre un écran qui dit « Aucun lien assez net pour l'instant ». Titre selon l'état réel (prêtes avec une
  piste nette ; sinon une phrase vraie, ex. « Vos analyses digestives : rien de net pour l'instant »). `DigestBlock.jsx`.
- [x] **POLISH-SIM-53** ✅ 12/11 11:35 (« + : meilleur bien-être. » / « + : plus de confort. » dans la ligne de l'unité) (Ventre et données J45) Analyses : « +0,2 pt » sans dire si « + » veut dire mieux ; la ligne
  « pt : points de votre note de confort digestif, sur 5 » ne donne pas le sens. Dire une fois « + : plus de confort »
  (et l'équivalent pour le bien-être), sans refrain.
- [x] **POLISH-SIM-54** ✅ 12/11 13:35 (Tendances : ligne « Confort digestif : Calme 5, Gêne 3, Douleur 1 » sous la courbe ; « 5 = calme » retiré du détail du jour) (Ventre et données J45) Échelle de la digestion : la saisie dit Calme / Gêne / Douleur, les
  analyses et Tendances parlent d'une note « sur 5 ». Montrer la correspondance là où la note sur 5 apparaît.
  Analyses fait le 12/11 11:35 (« (Calme 5, Gêne 3, Douleur 1) ») ; reste Tendances.
- [x] **POLISH-SIM-55** ✅ 12/11 14:35 (cause : les repas de la démo n'avaient qu'un aliment riche en FODMAP, le yaourt ; deux repas ajoutés, lentilles (GOS) et poire (fructose en excès, sorbitol), sans fructanes que la visite plante elle-même ; ligne sous le libellé « repas riche en lactose (FODMAP) ») (Ventre et données J45) Analyses : « Lactose » est un groupe FODMAP, mais rien ne le dit ; la
  persona SII conclut « aucun mot sur les FODMAP ». Vérifier pourquoi seuls lactose (et pas fructanes, GOS, polyols)
  apparaissent sur 45 jours de démo (données de démo ou seuil), et nommer le groupe (« Lactose (FODMAP) ») si c'est
  l'app. Lié à PROP-SIM-10 (groupes FODMAP plus visibles).
- [x] **POLISH-SIM-56** ✅ 12/11 15:35 (compté : jours avec le résultat — digestion notée, ou bien-être noté ou lu ; la ligne dit le délai et ce compte) (Ventre et données J45) « Long terme : encore 12 jours notés » au 45e jour, puis 11 après la
  note du matin : vérifier ce qui est compté (jours avec bien-être et digestion ?) et le dire en mots simples.
- [x] **POLISH-SIM-57** ✅ 12/11 17:35 (case cachée sans aucune entrée `face_burst`, un comptage en échec la laisse ; indication « Un fichier JSON, à garder en lieu sûr. », phrase de fin « <fichier> téléchargé. » hors Android) (Ventre et données J45) Rapport PDF : la case « bien-être estimé (caméra) » est proposée sans
  aucune lecture du visage ; la cacher dans ce cas. Données › Exporter : « rangé dans Documents » et « Enregistrez le
  fichier… (ex. Dossier Documents) » se contredisent ; une seule phrase.
- [x] **POLISH-SIM-58** ✅ 13/11 17:45 (vérifié dans l'outil : les séances étaient listées, en ligne « Activité », aucune dans les 3 jours affichés d'abord ; tuile lilas « Séance » dans le résumé du jour, `summary.workouts` ; ligne renommée « Séance » ; reste PROP-SIM-15) (Sportif J14, Galaxy Watch) Séances : Sources annonce des « séances » reçues, la persona ne les
  trouve ni dans Journal › Jours ni dans Tendances. Vérifier dans l'outil (environ 1 jour sur 3 avec séance) et dans
  l'app où elles s'affichent ; si elles ne sont que dans une liste de saisies, une tuile « Séance » dans la carte du
  jour.
- [x] **POLISH-SIM-59** ✅ 12/11 12:35 (cause : capture prise avant le chargement de la table Ciqual ; tuile « ≈ … kcal » pendant le chargement, outil des personas qui attend la table) (Sportif J14) Journal › Jours : tuile « Repas 1 » sans kcal alors que Repas affiche ≈ 479 kcal
  pour ce repas, et qu'un autre jour dit ≈ 1 039 kcal. Vérifier la règle de la tuile (kcal dès qu'un repas est compté).
- [x] **POLISH-SIM-60** ✅ 12/11 10:35 (`notShared` au catalogue ; « Samsung Health ne partage pas la variabilité cardiaque avec Health Connect. ») (Sportif J14) Sources, carte Samsung Health : « Si votre montre en est capable, activez ce
  partage » pour la VFC, alors que Samsung Health ne l'écrit pas dans Health Connect. Dire ce qui est vrai pour l'app
  source connue (Samsung : « Samsung Health ne partage pas la VFC »). `MyDevices.jsx`.
- [x] **POLISH-SIM-61** ✅ 13/11 16:45 (ligne « attendu d'après vos habitudes » sous la courbe quand un attendu est tracé ; sans attendu, la période s'arrête à aujourd'hui) (Sportif J14) Tendances : la zone « attendu » (pointillé) n'est pas comprise (« d'où vient
  cette baisse prévue ? ») ; en Semaine, sommeil seul, des jours futurs vides. Une ligne de légende courte ; pas de
  jours futurs sans attendu.
- [x] **POLISH-SIM-62** ✅ 13/11 18:45 (« Noté : 4/5 » en `role=status` dans Analyses, `onSaved` de `WellbeingPrompt` ; `compared` dans `resultsView` : « 16 facteurs comparés à votre bien-être, du jour même à la veille. », seulement sans piste ni barre) (Sportif J14) Analyses au 14e jour noté : « Aucun lien assez net » et « Moyen terme : encore 7
  jours notés », sans retour après « Enregistrer » la note de bien-être. Confirmer la note (« Noté : 4/5 ») ; dire en
  une ligne ce qui a été comparé.
- [x] **POLISH-SIM-63** ✅ 13/11 20:35 (`keepForEquipment` écarte toute cigarette ; test) (Outil, Sportif J14) La persona voit « Cigarettes 3 » sans avoir activé le compteur
  (POLISH-SIM-42 : opt-in) : `personaData` garde les cigarettes de la démo. Les retirer sauf objectif tabac.
- [x] **POLISH-SIM-65** (Outil, 12/11 17:35 ; **fait le 26/11 00:30** : option `face: 'off'` de `personaEntries` et `--face=off` de `persona-browse.mjs`, aucune entrée `face_burst`, le reste identique ; test `personaData.test.mjs` ; tirage dans `PERSONAS.md`) `personaData` donne des lectures du visage à toutes les personas, même
  « téléphone seul » qui dit n'avoir jamais activé la caméra : une option `--face=off` (aucune entrée `face_burst`),
  tirée pour une part des personas, pour voir l'app sans bien-être lu.
- [ ] **JOURNAL-CAPTURES-1** (12/11 17:35) 16 captures citées dans le résumé S46 (12/11 00:35 à 15:35) ne sont pas
  dans le dépôt (`*.png` ignoré, `git add -f` oublié). `.gitignore` corrigé (`!journal/**/*.png`). Reste : refaire
  les plus utiles ou retirer les liens morts, et un test qui échoue quand le résumé cite une capture absente.
- [ ] **PROP-SIM-15** (13/11 17:45 ; proposition avec maquette, pas de code sans accord ; Sportif J14) Séances comme
  mesure de Tendances (durée par jour, superposable au bien-être) : nouvelle mesure, donc à proposer au propriétaire.
- [x] **POLISH-SIM-66** ✅ 13/11 20:35 (`SCALE_TYPES` : ni `weight` ni `body_composition` hors `full` ; test) (Outil, 13/11 17:45) `keepForEquipment('watch')` écarte `weight` mais garde `body_composition` :
  la persona Galaxy Watch sans balance voit une « Pesée Withings Body Scan ». L'écarter aussi (et pour `watch-hrv`, `huawei`).
- [x] **POLISH-SIM-64** (Outil ; **soldée le 26/11 00:30** : déjà fait par POLISH-SIM-81b, `persona-browse.mjs` écrit `healthtrack_theme=dark`) `persona-browse.mjs --dark` ne règle que le `colorScheme` du navigateur : l'app reste en
  clair. Régler aussi le thème de l'app (comme `visual-check --dark`).
- **Simulations du 13/11 20:35** ([synthèse](simulations/2026-11-13-2035-synthese.md) ; Ventre sans technique J45,
  Tout mesurer J45). Ordre proposé : 67, 68, 69, 70, 71, puis le reste après vérification.
- [x] **POLISH-SIM-67** (bug ; Ventre sans technique J45) Rapport PDF : la phrase « Halcya-rapport-….pdf téléchargé »
  s'affiche sous la barre de navigation, coupée. La faire venir à l'écran (défilement) ; test.
  **Fait le 13/11 21:35** : la ligne vient à l'écran et s'arrête au-dessus de la barre d'onglets (`.report-status`).
- [x] **POLISH-SIM-68** (fait le 13/11 23:35 : « Bilan du jour : Gêne » dans le bloc digestion d'Aujourd'hui ; la fenêtre ne dit plus « Dernière note … hier » après le bilan ; reste possible : un titre « À l'instant » sur la rangée des moments) (Ventre sans technique J45) Après « Bilan du jour : Gêne », la fenêtre « Ma digestion » garde
  « Dernière note : Douleur, hier » et aucun bouton marqué ; l'accueil dit toujours « Noter ma digestion » sans la
  note du jour. Montrer la note du jour aux deux endroits.
- [x] **POLISH-SIM-69** (deux personas J45 ; **soldée le 25/11 23:30** : l'explication d'un terme avec des aliments est faite par POLISH-SIM-157, « 1 repas riche en sorbitol (FODMAP : pruneaux, prunes) de plus ») Analyses sans lien net : la liste hachurée est lue comme un résultat
  (« Lactose −0,8 pt : j'arrête le lait ou pas ? »). La replier par défaut quand rien n'est net ; dire en tête ce qui
  manque (le compte « encore N jours » n'est dit qu'en bas, pour le long terme). Une ligne touchée ne fait rien :
  explication courte du terme (GOS, sorbitol) avec des aliments.
  **1re partie faite le 14/11 01:35** : rien de net (ni piste ni lien net) → les barres sont repliées derrière « Voir
  les liens pas encore nets » ; en tête, les facteurs comparés et le compte « encore N jours » s'il existe. **Reste** :
  l'explication d'un terme au toucher d'une ligne.
- [x] **POLISH-SIM-70** (deux personas J45) Agir vide : « Où en sont vos analyses » ouvre Bien-être même quand
  l'objectif est le ventre ; ouvrir Digestion pour ce profil. L'état vide ne dit pas quoi faire d'ici là.
  **Fait le 14/11 00:35** : avec l'objectif digestion ou cycle (`wantsGut`, comme la barre d'onglets), le lien ouvre
  `/recommendations/ventre` ; une phrase « D'ici là, notez votre digestion chaque jour. » (ou « votre bien-être »).
- [x] **POLISH-SIM-71** (deux personas J45) Tendances, fiche d'un jour : un jour à 1,4/5, « Ce qui a pu peser » ne
  liste que des « + » ; ailleurs des −0,01 et −0,02 pt, sans dire s'il s'agit du ventre ou du bien-être ; « Confort
  digestif 2,0/5, noté "douleur" » alors que Douleur = 1. Seuil d'affichage, phrase quand rien ne pèse, moyenne dite.
  **Fait le 14/11 03:35** : « Sur votre bien-être (ou confort digestif), en points sur 5. » sous le titre ; effets de
  moins de 0,05 pt masqués ; « Rien de marquant ce jour-là… » si tous le sont ; « Rien de ce que Halcya compare
  n'explique cette note basse. » pour une note ≤ 2,5 sans effet négatif affiché ; « estimé, avec votre note
  « douleur » » quand le chiffre s'écarte de la note.
- [x] **POLISH-SIM-71b** Fiche d'un jour : lien « Voir toute la journée » vers Journal › Jours à cette date ; pour un
  profil ventre, les repas de la veille (à maquetter si cela ajoute un bloc).
  **Soldée le 26/11 01:30, sans objet** : le Journal jour par jour est supprimé (refonte, étape 7) ; le détail du jour vit dans Tendances › Jour.
- [x] **POLISH-SIM-72** « VFC » (Aujourd'hui, Journal, Analyses) et « variabilité cardiaque » (Sources, fiche d'un
  jour) : un seul nom.
  **Fait le 14/11 04:35 (Android)** : « variabilité cardiaque » dans tous les textes de `src/` ; test de garde
  `src/data/hrvName.test.js` (aucun « VFC » hors commentaires, Nouveautés passées et `huawei/sync.js`).
- [x] **POLISH-SIM-72-iOS** Porter le nom sur iPhone au suivi de la v1037 : douze correctifs disent « VFC SDNN » (08,
  13, 17, 19, 20, 21, 30, 32, 45, 53, 56, 57) et huit tests de l'overlay l'attendent ; 17, 30, 56 et 57 ne
  s'appliquent plus sur le code de la v1037. Nom à retenir : « variabilité cardiaque » (la méthode SDNN dite une fois,
  là où elle sert), puis étendre le test de garde au code embarqué.
  **Fait le 14/11 05:35** : code embarqué v1037 ; les textes visibles des correctifs 13, 17, 30, 32, 45, 56 et 57 et
  de `overlay/app/src/ios/sdnnBaseline.js` disent « Variabilité cardiaque (SDNN) » (« de variabilité cardiaque (SDNN)
  en moyenne », « Variabilité cardiaque plus haute / plus basse », « variabilité cardiaque » dans la divulgation de
  l'app Santé) ; douze fichiers de test de l'overlay mis à jour. Le test de garde `hrvName.test.js` tourne tel quel sur le
  code embarqué (il parcourt aussi `src/ios/`) et y est vert. Écart avec l'intention : « (SDNN) » reste dans le
  libellé, parce que le code reconnaît la mesure de l'app Santé à son libellé (Aujourd'hui, Journal) et qu'un fichier
  importé d'Android peut apporter l'autre mesure (RMSSD) ; le dire une seule fois demande une clé à la place du
  libellé : **POLISH-SIM-72-iOS-b**.
- [x] **POLISH-SIM-72-iOS-b** iPhone : distinguer la variabilité cardiaque de l'app Santé par une clé (`hrvSdnn`) et
  non par son libellé (`TodayBySource.jsx`, `DailyJournal.jsx`, `journalChips.js`, correctifs 30, 56, 57), puis
  l'appeler « Variabilité cardiaque » tout court, la méthode dite une fois (ligne sous la courbe de Tendances).
  **Fait le 14/11 07:35** (PR ouverte, build iOS et captures à regarder avant le merge) : la ligne d'Aujourd'hui
  porte `measure: 'hrvSdnn'` (correctif 30), la tuile du Journal un quatrième élément `'hrvSdnn'` (correctif 17) ;
  `TodayBySource.jsx` et `DailyJournal.jsx` lisent cette clé (correctifs 56, 57). Libellé « Variabilité cardiaque »
  sur Aujourd'hui, dans le Journal, dans Tendances et au premier import (« de variabilité cardiaque en moyenne »,
  correctif 32) ; sous la courbe de Tendances : « en millisecondes (SDNN), telle que la mesure l'app Santé ». Si un
  fichier importé d'Android apporte une RMSSD le même jour, la tuile du Journal de l'app Santé dit
  « Variabilité cardiaque, app Santé ». Code embarqué v1037 → v1040.
- [x] **POLISH-SIM-72-iOS-c** iPhone : « (SDNN) » reste dans la carte des normes (`sdnnBaseline.js`), dans Analyses
  (`hrv_sdnn_ms`, correctif 32) et dans la liste des données de l'app Santé (`healthApps.js`, correctif 19) ; aucun
  de ces écrans ne reconnaît la mesure à son libellé. Dans Tendances, si une RMSSD importée d'Android existe aussi,
  le sélecteur propose deux « Variabilité cardiaque » : les distinguer (« , app Santé »).
  24/11 19:30 : la note de Nouveautés de l'iPhone ne doit jamais nommer Android (test `changelog.appstore` et contrôle
  des textes des captures) ; reformulée dans #1244.
  **Fait le 24/11 18:30** : « Variabilité cardiaque, app Santé » dans Tendances (courbe, puces, détail), la carte
  des normes et les Analyses (`VARIABLE_META`) ; « variabilité cardiaque » dans « qui envoie quoi » ; note de Tendances
  « telle que la mesure l’app Santé, en millisecondes ». Les phrases (« Variabilité cardiaque plus haute… ») gardent le
  nom court. Test de garde dans `trendsData.ios.test.js`. Rien ne change sur Android.
- [x] **POLISH-SIM-73** (Tout mesurer J45) La sauvegarde s'appelle `healthtrack-export-AAAA-MM-JJ.json` : nom de la
  marque (`config/brand.js`) ; l'import d'anciens fichiers ne dépend pas du nom (à vérifier par test).
  **Fait le 14/11 02:35** : `halcya-export-AAAA-MM-JJ.json` (`EXPORT_FILE_PREFIX`, dérivé de `APP_NAME`) ; l'import
  ne lit pas le nom (testé avec trois noms). Les fichiers du mode diagnostic caché (`healthtrack-visage-…`,
  `healthtrack-journal-montre-…`, `healthtrack-debug-…`) gardent leur nom.
- [x] **POLISH-SIM-74** (à vérifier ; Tout mesurer J45 ; **soldée le 25/11 23:30** : au long terme, une ligne pas nette ne montre plus que sa fourchette et « pas assez net », METHODE-BIAIS-4, `isRangeOnly` de `resultsView.js`) Analyses, long terme : « −2,1 pt pour 150 kcal d'activité de
  plus » sur une note sur 5, hachuré. Vérifier le calcul sur les données de la persona ; un chiffre pas net aussi
  grand doit-il s'afficher ?
- [x] **POLISH-SIM-75** (à vérifier ; Tout mesurer J45) Tendances › Jour : Sommeil choisi, l'app repasse sur
  Bien-être sans le dire (T2 prévoit la puce grisée « une valeur par jour »).
  **Soldée le 24/11 15:30** : déjà réglée par POLISH-SIM-107 (19/11) : en Jour, la mesure choisie reste
  (`TrendsViewer.jsx`, `dayKeys`), test « POLISH-SIM-107 » de `Trends.test.jsx`.
- [x] **POLISH-SIM-76** (à vérifier ; Tout mesurer J45) Objectif « tout comprendre » et digestion notée : Analyses
  n'a que l'onglet Bien-être.
  **Fait le 26/11 01:30** : depuis la refonte, Objectifs a une carte par objectif ; sans « Confort digestif », les jours de digestion déjà notés n'avaient plus de chemin. Objectifs dit « Vos notes de digestion (N jours) sont gardées. Pour les retrouver : Réglages › Paramètres › Vos objectifs. » (`notedDays`, 3 tests). La migration de l'étape 5a ne change pas (elle n'ajoute pas l'objectif à qui avait choisi autre chose).
- [x] **POLISH-SIM-77** (Ventre sans technique J45) Repas, encadré « Riche en fructanes » : « ≈ 0,73 g · repère
  0,3 g », « Varney 2017 », « Ferjančič 2024 » à première vue. Les ranger derrière un détail (la source reste citée).
  **Fait le 14/11 06:35** : ces mentions étaient déjà derrière le chevron ; c'est le détail déplié qui n'était pas
  compris. Il dit maintenant « Environ 0,73 g, pour un repère de 0,3 g par repas. », puis « Certaines personnes
  digèrent mal les fructanes (blé, oignon, ail), d'autres très bien. Le repère est une hypothèse de départ : vos
  propres données priment. » ; les sources sur une dernière ligne, en petit (« Repères : Varney 2017. Teneurs : … »).
  **Reste** (avec la fin de POLISH-SIM-69) : le même vocabulaire dans Analyses, où toucher « GOS » ou « sorbitol »
  n'explique rien ; réutiliser `hint` de `FODMAP_GROUPS`. iPhone : arrive au suivi de la v1040, aucun correctif ne
  touche `MealFodmapLine`.
- [x] **POLISH-SIM-78** ✅ 14/11 08:35 (Outil) L'accord de l'IA redemandé au 45e jour venait de l'outil :
  `persona-browse` pose l'accord pour un jour > 1 quand la persona note ses repas.
- [x] **POLISH-SIM-79** ✅ 14/11 08:35 (Outil) Matériel `apple-watch` (VFC et oxygène du sang, source « Apple Watch ») et
  `phone-scale` (config 5 : pas, calories, pesées) dans `personaData.mjs`, testés.
- [x] **POLISH-SIM-80** (à vérifier) Aujourd'hui : note de bien-être 3, puis 2,9, puis 3 sans saisie ; 4 lectures du
  visage annoncées, aucune ligne Bien-être dans le Journal du jour.
  **Fait le 26/11 02:30** : cause trouvée dans le code. Le chiffre de l'Accueil vient du modèle à espace d'états
  (`todayWellbeingState`) : le calcul complet `dayStates` s'il est en cache, sinon un calcul de secours sur les notes
  lues depuis la première lecture du visage seulement. Les paramètres du modèle changeaient avec les notes d'avant la
  caméra : le chiffre bougeait selon qu'Objectifs ou Tendances avait déjà rempli le cache (puis qu'une écriture
  l'invalidait). **Corrigé le 26/11 03:30** : la 1re version (lire toutes les notes sur l'Accueil) dépassait le budget
  de lectures (2 056 enregistrements pour 1 500 sur la démo de 3 ans ; « Budget de lectures (perf) » rouge sur #1275).
  L'Accueil ne prend plus le cache : toujours le même calcul sur ses propres lectures, le chiffre ne bouge qu'avec les
  données ; test « même chiffre avec ou sans cache » (rouge avant). Reste POLISH-SIM-80b. La ligne « Journal » a
  disparu avec la refonte.
- [ ] **POLISH-SIM-80b** (suite de 80) Le bien-être du jour de l'Accueil (notes depuis la première lecture du visage)
  peut différer d'un dixième de celui de Tendances et d'Objectifs (toutes les notes). Piste : garder les paramètres du
  modèle (`params` de `dayStates`) en mémoire locale et les réutiliser sur l'Accueil, sans relire l'historique (budget
  D2). À faire seulement si une persona ou un testeur voit l'écart.
- [x] **POLISH-SIM-81** (bug ; Sportif J1, balance) Tendances : toucher la pastille « Poids » mène à
  « Choisissez une courbe » avec « Pas » seul ; la courbe n'existe qu'en Mois. Garder la mesure choisie et passer à la
  période où elle a des points (`simulations/2026-11-14-0835-synthese.md`). **Fait le 14/11 09:35** : le menu « + »
  de la vue Jour proposait les mesures qui ont une courbe en Mois, puis ouvrait toujours la Semaine. La mesure
  touchée s'ouvre en Semaine si elle y a 3 points, sinon en Mois (`TrendsViewer.jsx`, `dailyPeriod`) ; la phrase du
  menu dit « en Semaine ou en Mois » dans ce cas. iPhone : code partagé, aucun correctif sur ce fichier, arrive au
  prochain suivi du code embarqué.
- [x] **POLISH-SIM-81b** Tendances, Mois → Semaine avec une mesure qui n'a de courbe qu'en Mois (Poids seul) : on
  retombe sur « Choisissez une courbe » sans la mesure. Dire où elle se trouve (« Poids : en Mois ») ou la garder
  grisée. Outil des personas : `--dark` ne change pas le thème des captures (à corriger). **Fait le 14/11 14:35** :
  en Semaine, une mesure choisie qui n'a de courbe qu'en Mois reste dans les puces, grisée (« Poids · en Mois ») ;
  la toucher rouvre le Mois avec sa courbe (`TrendsViewer.jsx`, `monthOnly`). `persona-browse --dark` règle le thème
  de l'app (`healthtrack_theme`), plus seulement le schéma du téléphone. iPhone : code partagé, aucun correctif sur
  ce fichier ; embarqué par la PR de suivi ouverte au même run.
- [x] **POLISH-SIM-82** (Ventre sans technique J14) Analyses › Digestion en attente : « Noter maintenant » reste
  affiché quand la digestion du jour est déjà notée ; dire « Noté aujourd'hui » à la place. **Fait le 14/11 10:35** :
  le compte à rebours lit les notes digestives du jour (au fil de l'eau et bilan du soir) et dit « Noté
  aujourd'hui : Gêne » ; le bouton devient « Ajouter une note », secondaire (`Recommendations.jsx`,
  `gutLevelsToday`). iPhone : code partagé, aucun correctif sur ce fichier, arrive au suivi de la v1044.
- [x] **POLISH-SIM-82b** Analyses › Bien-être en attente : même question pour la note de bien-être du
  jour (« Noté : 4/5 » ne s'affiche que juste après la saisie faite depuis Analyses). **Vérifié et fait le 14/11
  11:35** : le compte à rebours lit les notes de bien-être du jour et dit « Noté aujourd'hui : 4/5 » (chaque note
  telle que donnée, dans l'ordre) ; le bouton devient « Ajouter une note », secondaire ; l'ancienne ligne « Noté :
  4/5 » au-dessus de la carte ne reste que lorsque la note fait arriver les résultats (`Recommendations.jsx`,
  `wellbeingNotesToday`). iPhone : code partagé, aucun correctif sur ce fichier, arrive au prochain suivi.
- [x] **POLISH-SIM-83** (à vérifier) Objectif « Mon sport et ma récupération » : rien ne change de visible ensuite
  (Aujourd'hui, Analyses, Agir). Relever ce que l'objectif règle vraiment ; s'il ne règle rien, le dire dans une
  proposition plutôt que de le laisser promettre.
  **Soldée le 26/11 01:30, sans objet** : l'objectif « Mon sport et ma récupération » est retiré du choix depuis la refonte (étape 1, `RETIRED_GOALS`).
- [x] **POLISH-SIM-84** Aujourd'hui avec une balance et sans montre : aucune pesée dans « Vos données du jour », et le
  seul lien est « Ajouter une montre ». **Fait le 14/11 16:35** : la dernière pesée du jour (`weight` ou
  `body_composition`) a sa ligne « Poids · à 07:30 · 72,4 kg », couleur du corps, lien vers sa courbe de Tendances ;
  source dite « votre balance » (groupe `scale` de `todayBySource`), ou « vos notes » pour un poids saisi dans l'app
  (`app_weight`) ; jamais la pesée d'hier. Option `--weigh-in` de `npm run visual`. Reste **POLISH-SIM-84b** : le
  lien « Ajouter une montre » sous le bloc devient « Ajouter un appareil » (**fait le 14/11 19:35**, Android ; iPhone
  au suivi d'après) ; restent : pas de « d'habitude » pour le poids ; un poids saisi à la main dans une autre app de santé est dit
  « votre balance ». iPhone : code partagé, les 52 correctifs s'appliquent encore sur `app/src` avec ce changement
  (15, 30 et 56 touchent ces fichiers) ; arrive au suivi d'après.
- [x] **POLISH-SIM-85** Visite guidée d'Agir : « Exemple au jour 14 » montré à une personne qui est à son 14e jour ;
  « un jour sur deux tiré au sort » pas compris.
  **Fait le 25/11 à 23:30** : « Voir un exemple » (`stillEmpty`, `services/tour.js`) se montre du 1er au 13e jour
  après l'accueil, plus au 14e ; test `SeeExample.test.jsx`. « Un jour sur deux tiré au sort » n'est plus dans la
  visite (« dix jours d'essai, puis compare les jours avec et les jours sans »).
- [x] **POLISH-SIM-86** Journal : tuiles « SpO₂ » et « FC au repos », alors que Sources dit « oxygène du sang » et
  « cœur au repos » : un seul nom par mesure (comme POLISH-SIM-72), avec un test de garde. **Fait le 14/11 12:35
  (Android)** : « Cœur au repos » et « Oxygène du sang » dans tous les textes de `src/` (tuiles du Journal,
  Aujourd'hui, Tendances, normes, Analyses, « Ce qui change », types Health Connect, oxymètre Bluetooth, écran
  Montre) ; « plus haute / plus basse » devient « plus rapide / plus lent », comme dans la fiche d'un jour ; test de
  garde `src/data/measureNames.test.js` (ni « SpO₂ », ni « saturation en oxygène », ni « FC au repos / FC repos »
  hors commentaires, Nouveautés passées et `huawei/sync.js`). Dans le Journal, « Cœur au repos » tient sur deux
  lignes (une avant). La tuile « FC » (fourchette du jour) et « FC nuit » gardent leur nom : **POLISH-SIM-86b**.
- [x] **POLISH-SIM-86-iOS** Porter ces noms sur iPhone au suivi de cette version. **Fait le 14/11 12:35** (PR #970,
  code embarqué v1047) : correctifs 17, 32, 56 et 57 refaits (seules leurs lignes de contexte disaient « FC au
  repos », « SpO₂ », « Saturation en oxygène ») ; les correctifs 20 et 21 et deux tests de l'overlay ne les disent
  qu'en commentaire ; test de garde vert sur le code embarqué (3902 tests). Reste à regarder les captures iPhone du
  Journal avant le merge de #970.
- [x] **POLISH-SIM-86b** « FC » (tuile du Journal, « FC nuit », « FC automatique ») à côté de « fréquence cardiaque »
  et « cœur » dans Sources : choisir un nom, même méthode.
  **Fait le 24/11 16:30** : plus aucun « FC » dans les textes de `src/` (hors commentaires et `huawei/sync.js`) :
  « Cœur » (fourchette du jour), « Cœur la nuit », « Cœur, moyenne du jour » et « Cœur debout (balance) » (Analyses),
  « Cœur debout » (balance), « cœur 135 bpm en moyenne » (séances de la montre), « cœur à … bpm en moyenne »
  (capteur Bluetooth), « fréquence cardiaque » dans le guide Health Connect, le journal technique et l'association de
  la montre. Test de garde `measureNames.test.js` (`/\bFC\b/`). iPhone : code partagé.
- [x] **POLISH-SIM-87** Accueil, écran 04/06 : bouton « Continuer sans » (sans quoi ?) ; l'écran 01 parle de « votre
  montre » à tout le monde. **Fait le 14/11 15:35** : le bouton dit « Continuer » ; la première phrase dit « vos
  appareils » et la pastille de l'illustration « Appareils » (`Onboarding.jsx`). Reste **POLISH-SIM-87b** : l'écran 04/06 ne dit
  rien d'une balance à qui a refusé Health Connect ; dans la variante play une balance n'arrive que par Health
  Connect (carte Withings absente, POLISH-SIM-89) : à vérifier, puis une ligne courte près de « Connecter Health
  Connect » (« montre, bague, balance »). iPhone : code partagé, les correctifs 23, 45, 52 et 55 ne touchent pas ces lignes ; arrive au prochain
  suivi du code embarqué.
- [x] **POLISH-SIM-88** (à vérifier) Tendances › Jour dit « Aucune lecture du visage ce jour-là » alors qu'une note
  existe ; « + » rond de la carte Pas d'Aujourd'hui sans effet visible ; « repas incomplets ? » du Journal ne réagit
  pas ; « Dépense 2 352 kcal » sans explication.
  **Fait le 24/11 14:30** : le cas sans caméra était réglé par POLISH-SIM-117 ; restait une note d'avant la première
  lecture du visage (caméra activée plus tard), jamais lue par Tendances. `loadFaceMoodEntries({ notesAlways })` lit
  maintenant toutes les notes de bien-être et digestives, test dans `faceMoodData.test.js`. Les trois autres points
  ont disparu avec la refonte (Aujourd'hui, Journal et la ligne « Dépense » n'existent plus). iPhone : code partagé.
- [x] **POLISH-SIM-90** Tendances, fiche d'un jour : « Confort digestif 2,4/5, estimé, avec votre note « douleur » »
  sous la légende « Douleur 1 », et « Bien-être 3,2/5, votre note 3,4 et le visage » alors que la saisie n'accepte
  que des entiers : montrer la note telle qu'elle a été donnée, et l'estimation à part (suite de POLISH-SIM-71). **Fait le 14/11 13:35** :
  « vous avez noté 3 · estimé avec le visage » (ou « les jours voisins ») ; digestion : « vous avez noté « douleur »
  (1) · estimé avec les jours voisins » (`detailSource`, `noteChoice` de `dayFaceDetail`). Reste : plusieurs notes
  le même jour (seule la dernière est dite) ; le cas digestion à regarder en capture au prochain passage des
  personas. iPhone : code partagé, arrive au prochain suivi.
- [x] **POLISH-SIM-89** (**soldée le 26/11 05:30** : déjà fait le 25/11 par PERSONAS-OUTIL-2, `personaData.mjs` range les pesées sous Health Connect au nom de « Withings », test `personaData.test.mjs`) (Outil) Config 5 : faire arriver les pesées par Health Connect (aujourd'hui `source:
  'withings'`, carte absente de la variante play) pour que Sources puisse les attribuer.
- [x] **POLISH-SIM-91** (Sportif J45 ; 3e persona J45 ; **soldée le 25/11 23:30** : long terme pas net = fourchette et « pas assez net » sans chiffre (METHODE-BIAIS-4) ; plus grand que la note = « pas assez de données » (POLISH-SIM-16) ; rien de net = barres repliées (POLISH-SIM-69)) Analyses sans lien net : le bloc « Long terme » affiche
  « +2,3 pt », « −2,1 pt », « +1,9 pt » sur une note sur 5, sous « Rien n'est net pour l'instant ». Ne pas montrer
  un chiffre de cette taille pour un lien pas net (le sens seulement, ou rien) ; à traiter avec la fin de
  POLISH-SIM-69. Capture : `simulations/captures/2026-11-14-2035-sportif-J45/analyses-rien-de-net.png`.
- [x] **POLISH-SIM-92** (Sportif J45) Agir vide : « D'ici là, notez votre bien-être chaque jour. » dit à qui le note
  depuis 45 jours. Ne garder la phrase que si la note du jour manque.
  **Fait le 14/11 22:35** : la phrase (bien-être ou digestion selon l'objectif) ne s'affiche que si rien n'est noté
  aujourd'hui ; une lecture du visage ne compte pas comme une note. iPhone : au prochain suivi du code embarqué.
- [x] **POLISH-SIM-93** (à vérifier ; Sportif J45) Analyses n'a que l'onglet « Bien-être » avec l'objectif sport,
  alors que la digestion est notée chaque jour : l'onglet doit suivre les données, pas seulement l'objectif.
  **Fait le 26/11 01:30**, avec POLISH-SIM-76 (même cause). Le bandeau « suivi digestif masqué » de Confort digestif disait « Ce qui vous amène », un nom de réglage disparu : il dit « Vos objectifs », test.
- [x] **POLISH-SIM-94** (Maigrir J1) Tendances après une première pesée : « Choisissez une courbe » sans « Poids ».
  Puce grisée « Poids · dès 3 pesées », comme « Poids · en Mois » (POLISH-SIM-81b).
  **Fait le 24/11 12:30** : une mesure relevée ce mois-ci sans ses 3 points apparaît grisée, sans effet, dans « + »
  et sous « Choisissez une courbe » (« Poids · dès 3 pesées », sinon « · dès 3 jours ») ; « + » s'affiche aussi
  quand seule une mesure en attente peut s'y ajouter (avec les seuls Pas, il manquait) ; sans aucune courbe, une
  seule pesée dit « Poids : la courbe arrive à 3 pesées. » au lieu du message général. iPhone : code partagé.
  **24/11 13:30** : #1238 mergée ; la puce grisée reprenait `is-daily` (44 px de haut) au milieu des puces de 32 px
  de « + » : elle a désormais son propre style (`is-pending`), à la taille de la liste où elle se trouve.
- [x] **POLISH-SIM-95** (Sportif J45) Tendances › Mois : le point du jour en cours fait plonger la courbe des pas.
  Le dessiner comme partiel (point creux) ou l'écarter du tracé.
  **Déjà fait par POLISH-SIM-127 (20/11)** : pas et écran (`cumulative`) n'ont pas de point aujourd'hui en Semaine
  ni en Mois ; constaté le 24/11 12:30 dans `trendsData.js`.
- [x] **POLISH-SIM-96** (à vérifier) Journal › Jours : tuile « FC » (écrire « Cœur » : **fait le 24/11 16:30, POLISH-SIM-86b**) ; étiquette « Écran tard »
  d'une note de bien-être sans origine.
  **Soldée le 26/11 01:30, sans objet** : Journal › Jours n'existe plus (refonte, étape 7) ; « Cœur » fait le 24/11.
- [x] **POLISH-SIM-97** (Maigrir J1) Nutrition au 1er jour : « des repas manquent sans doute, apports sous-estimés »
  après un seul repas noté. Ne pas l'afficher le premier jour de saisie.
  **Fait le 15/11 00:35** : quand seul le jour en cours est saisi, la page écrit « ≈ … kcal aujourd'hui, journée en
  cours. » et la légende « incertain : journée en cours » ; l'avertissement revient dès qu'un autre jour est saisi.
  Le repère de calories par jour demandé par la persona reste une proposition, pas faite. iPhone : au prochain suivi.
- [x] **POLISH-SIM-98** (à vérifier sur captures ; Maigrir J1) Accueil : compteur « 01/06 » sur les trois premiers
  écrans ; explication de l'envoi à l'IA lue trois fois ; visite guidée : « + 1 cigarette » montré à qui n'a pas
  parlé de tabac.
  **Soldée le 24/11 15:30 (relue dans le code)** : l'accueil de la refonte (étape 5) n'a plus ce compteur
  (« 1 sur 4 », segments de `TEMPS`) ni d'explication de l'envoi à l'IA (`Onboarding.jsx`) ; la visite guidée
  (`tourData.js`, `tour.js`, `GuidedTour.jsx`) ne montre plus de cigarette, et « + 1 cigarette » n'est proposé
  qu'une fois le compteur activé (POLISH-SIM-42, `AddStrip.jsx`).
- POLISH-SIM-80 et POLISH-SIM-88 : revus par une 2e persona le 14/11 20:35 (synthèse du jour) ; tous deux soldés (88 le 24/11, 80 le 26/11).
- [ ] **PROP-SIM-17** (proposition avec maquette, pas de code sans accord) Bilan digestif simple avant le 28e jour :
  jours calmes, de gêne, de douleur, et repas des jours de douleur, sans statistique. **Maquette faite le 14/11
  20:35** : `maquettes/bilan-digestif/README.md` (réponse attendue du propriétaire : oui, variante prudente ou non).
- [ ] **PROP-SIM-18** (proposition, pas de code sans accord ; Sportif sans montre) Noter une séance à la main ;
  protéines et glucides à la saisie d'un repas ; objectif de protéines selon le poids. Complétée le 14/11 20:35
  (Sportif J45, Maigrir J1) : repère de calories par jour, « mangé / dépensé ». Maquette à faire.
- [ ] **PROP-SIM-20** (proposition, pas de code sans accord ; « Ventre, sans technique » J45 trois fois : 20/11, 25/11,
  26/11 20:30 ; « Ventre et données » J45 le 27/11 08:30, qui veut aussi le nombre de repas par ligne) Objectifs › Confort digestif › Alimentation dit « Rien à éviter pour l'instant » au-dessus de
  « Fructanes −1,2 pt » hachuré ; la persona ne sait pas si elle doit éviter l'oignon. **Maquette faite le 27/11
  01:30** : `maquettes/rien-a-eviter/README.md`. Option A (recommandée) : « Rien de sûr pour l'instant. Le plus
  marqué : les fructanes (blé, oignon, ail) … ça peut encore venir du hasard », carte « En avoir le cœur net » vers
  la réintroduction guidée du groupe (ou un essai), tableau en mots (« un peu moins bien, pas sûr ») ; option B :
  verdict « Rien de sûr » seul. Solde aussi le reste de POLISH-SIM-173 (« pt », « GOS », « FODMAP » du tableau).
  Réponse attendue : « PROP-SIM-20 A », « PROP-SIM-20 B » ou « non ».
- [ ] **PROP-SIM-19** (proposition, pas de code sans accord ; Maigrir J1 deux fois, Sportif J1) Se peser en un geste
  depuis Aujourd'hui quand l'objectif « poids » est coché (la pesée à la main n'existe que dans Journal › Nutrition ›
  profil). Maquette à faire, avec PROP-SIM-18. **Maquette faite le 24/11 08:30** (sans PROP-SIM-18, qui reste à
  faire) : `maquettes/poids/README.md` : « Noter mon poids » dans Ma journée › Autre chose, feuille de saisie
  (dernier poids repris, ± 100 g), Tendances › Poids avec ligne lissée et bande de marge ; ni cible, ni IMC jugé,
  ni rappel. Réponse attendue : « PROP-SIM-19 oui », « saisie seulement » ou « non » (dans ce cas, retirer
  « poids » de `handNotes`, l'accueil ne doit plus le promettre).
- [ ] **PROP-SIM-16** (proposition avec maquette, pas de code sans accord ; Tout mesurer J45) Tendances n'offre que 5
  mesures (FC, dépense, oxygène, poids, calories absents) ; Journal › Jours sans saut à une date ; carte d'appareil
  de Sources sans la liste complète de ses mesures (température, phases). Rappels PROP-SIM-10 confirmés : essai lancé
  soi-même, export CSV.
- [ ] **PROP-SIM-14** (proposition avec maquette, pas de code sans accord ; Sportif J14) « Autre chose » n'offre qu'un
  doublon de « Décrire un repas » : séance ou courbatures notées à la main pour qui n'a pas de montre ? Le « + » de
  « Vos données du jour » ne fait que surligner les boutons du haut : l'ouvrir sur un choix, ou le retirer.
  Rappels déjà en proposition (PROP-SIM-10) : essai lancé soi-même dans Agir, export CSV, aperçu du rapport PDF.
- [x] **POLISH-AUDIT-1** ✅ 12/11 04:35 (audit des écrans vides et de démo, sombre, play) Journal › Nutrition vide : la
  carte du profil répétait « Compléter mon profil » / « Complétez votre profil… ». Elle dit à quoi il sert : « Sexe, âge,
  taille, poids : vos repères d'apports en tiennent compte. »
- [x] **POLISH-AUDIT-2** ✅ 12/11 05:35 (suite de l'audit du 12/11 04:35) Réglages, sideload : le champ « Clé API
  Gemini » (et tous les `.settings-input`) faisait 40 px de haut, sous la cible de 44 px (DESIGN.md). `min-height:
  var(--tap-min)`, test dans `buttonShape.test.js`.
- [x] **POLISH-JOURNAL-VIDE** ✅ 12/11 07:35 (audit play, sombre, données vierges : 18 pages) Journal vide : la tuile
  « Noter votre digestion » menait à Aujourd'hui sans rien ouvrir (la tuile bien-être, elle, ouvre la note sur place).
  Elle passe `state: { open: 'digestion' }` (comme Analyses › Digestion) et prend le libellé du bloc digestif,
  « Noter ma digestion » (« Noter mon bien-être » pour l'autre) ; test rouge puis vert ; captures
  `runs/captures/2026-11-12-0735-journal-vide-*`. Vu, non fait : le petit « + » seul sous « Noter ma digestion »
  (Aujourd'hui vide) ; sur le téléphone, le rappel du soir le précède, le blanc ne vient que de l'outil.
- [x] **POLISH-AUDIT-3** ✅ 12/11 06:35 (audit play, clair, démo : 18 pages sans défaut visible à corriger) Sources :
  « Capacitor plugin "AppManager" already registered » dans la console (le plugin était enregistré par
  `phoneApps.js` et par `WatchDiagnostic.jsx`). Enregistré une seule fois (`phoneApps.js` l'exporte) ; garde-fou
  `pluginRegistration.test.js` (un `registerPlugin('X')` par plugin dans `src/`).
- [ ] **PROP-SIM-11** (proposition avec maquette, pas de code sans accord ; rejoint CYCLE-4 et PROP-SIM-10) cycle
  visible hors du Journal : jour du cycle sur Aujourd'hui, règles en bandes dans Tendances, règles et symptômes dans le
  rapport médecin, avec ce qu'il contient avant de le créer.
- [ ] **PROP-SIM-12** (proposition avec maquette, pas de code sans accord) objectif « Prendre soin de moi · poids » :
  poids actuel et visé à l'accueil, dernier poids sur Aujourd'hui, premier pas concret dans Agir au J1.
- [ ] **PROP-SIM-10** (proposition avec maquette, pas de code sans accord ; rejoint POLISH-SIM-8) noter ses règles et
  relier cycle et douleurs (« Mon cycle » ne débloque rien de visible) ; type et zone de la gêne ; essai lancé soi-même
  dans Agir ; aperçu du rapport PDF ; export CSV ; groupes FODMAP plus visibles dans Repas et Analyses.
- [ ] **POLISH-SIM-9** Outil : jouer les configurations iPhone sur la build iPhone (`--store=appstore`). Fait le
  11/11 08:35 : `--goals=cycle` (jour > 1) ajoute des règles et symptômes notés (testé) ; `brief.md` à `__PORT__`. Fait le
  09/11 08:35 : objectif d'onboarding (`--goals`), profil de saisie (`--notes=few`), consigne aux agents sur ce qui
  n'existe pas dans la version web. Fait le 08/11 20:35 : le jour 1 ouvre le nouvel accueil même
  avec 30 jours importés. Fait le 08/11 08:35 : nom de
  source réaliste par matériel, Galaxy Watch sans FC au repos ni température, champs date et heure en français.
- [ ] **INTEG-1a** Note `protocoles/garmin-samsung.md` (08/11 08:35) : Samsung Health Data SDK (température cutanée,
  Energy Score, tension ; enregistrement par Samsung = geste du propriétaire), Garmin clé personnelle (VFC, stress,
  Body Battery lus par le téléphone, sans relais), Starter « push » = stockage serveur (HDS, accord requis) ;
  rétro-ingénierie Garmin écartée (casse la coexistence). Prochaine étape : proposition au propriétaire (ordre § 4)
  et lecture de la documentation du niveau personnel Garmin.
  **14/11 08:35** : documentation lue. La clé personnelle est réservée par Garmin à l'usage individuel (« not
  intended for commercial applications serving multiple end users ») : voie écartée pour l'app vendue. Restent Health
  Connect et Santé (pris), l'import de fichiers FIT (proposition) et Starter ou Enterprise (question HDS).
- [x] **META-1** (D) ✅ 08/11 00:35 : A en tête de `PRODUIT.md`, B et leçon 18 dans `DESIGN.md` § 9, C dans la charte ;
  (A) à (D) relayés en tête de `POUR-IOS.md`.

## 📦 Publication quotidienne aux testeurs (décision du propriétaire du 07/11 vers 17:30)

> « Chaque modification arrive aux testeurs au fur et à mesure, une fois par jour, sur Android comme sur iPhone ; ce
> soir, la version qui contient le chantier du soir part vers les testeurs des deux plateformes, et de même demain soir. »

- [x] ✅ 07/11 17:35 **CD-ALPHA-6** (Android) : « Play — Alpha (livraison continue) » envoie chaque soir à **23:45,
  heure de Paris** (cron `45 22 * * *` en UTC, heure d'hiver ; **à recaler en `45 21 * * *` le 28/03/2027** au
  passage à l'heure d'été) la plus récente version de main dont « Build & Release » (et Tests, émulateurs, Play — AAB)
  a réussi, si elle a changé depuis le dernier envoi ; une version pas prête cède la place à la précédente prête
  (`decideNightly`, 7 tests dans `alphaGate.test.mjs`). Plus d'envoi à chaque merge ni à 07:13 ; plus d'espacement de
  24 h (CD-ALPHA-2 remplacé : le rythme quotidien en tient lieu) ; gel (`review-freeze.json`) et `ALPHA_AUTO` gardés ;
  `workflow_dispatch` gardé. Le test interne reçoit toujours chaque version.
- [x] **CD-ALPHA-7b** ✅ 10/11 12:35 : soldé. Constat : la fiche n'était plus partie depuis le 03/11 (gel puis porte de
  24 h comptant l'alpha du jour) ; titre « Halcya — digestion & bien-être » (#785) et avantages des abonnements
  (#816) en attente. Fiche et abonnements passent au **passage du soir** (crons 22:23 et 22:33 UTC, juste avant
  l'alpha de 22:45) sans espacement, gel gardé ; un merge attend ce soir-là (un seul examen par jour) ; lancement à la
  main immédiat (`decideEvening`, `reviewGate.mjs` ; 5 tests rouges puis verts). À vérifier demain : bilan des deux
  workflows du 10/11 au soir (« envoi de la fiche du Store »).
- [x] **LISTING-CAPTURES** ✅ 10/11 13:35 (7 captures : Aujourd'hui, Tendances, Analyses, Agir `--trial=8`, Repas, Réintroduction, Journal ; options par capture dans `screenshots.mjs` ; test : aucune route de redirection) (polish, vu le 10/11 12:35) : les captures de la fiche datent du 03/11 (#646), avant le nouvel
  écran Aujourd'hui, Agir et Tendances (07/11) et l'accueil (08/11). Les refaire sur la version actuelle (données de
  démo), elles partiront au passage du soir.
- [x] ~~**CD-ALPHA-7** (suite de CD-ALPHA-6) : la porte de 24 h de la fiche (07:23 UTC) et des abonnements (07:33 UTC)
  compte encore l'envoi d'Alpha de la veille (≈ 8 h 40 avant) : avec un envoi Alpha chaque soir, leurs changements ne
  partiraient plus. À régler : les faire partir dans le même créneau du soir que l'alpha (juste avant 23:45), ou ne
  compter pour eux que leurs propres envois. Vérifier le premier soir (07/11 22:45 UTC) le bilan du workflow.
- [ ] **CD-ALPHA-8** : veiller à ce que les merges du soir aient fini « Build & Release », les émulateurs et
  « Play — AAB » avant 22:45 UTC (sinon c'est la version prête précédente qui part ; la suivante part le lendemain).
- [x] ✅ 07/11 17:35 **IOS-QUOTIDIEN** (relais) : décision transmise en tête de `POUR-IOS.md` (soumission quotidienne
  de la dernière build TestFlight au groupe externe « Testeurs Halcya » et à l'examen bêta d'Apple, par la CI ; jamais
  la version de l'App Store ni la build 844.344 ; question du numéro de version constant). Suivi : `POUR-ORCHESTRATEUR.md`
  du dépôt iOS.

## 🏠 Nouvel écran Aujourd'hui (revue design du propriétaire du 07/11 vers 15:00) — PRIORITÉ DES RUNS DE CODE

> Remplace TESTEUR-1 (1a à 1e) et les points (3) à (5) du 24/10 15:00. La PR #781 (carte lilas) était déjà mergée à
> 14:54 quand la consigne est arrivée : sa carte disparaît avec AUJ-4. Leçons de design : `DESIGN.md` § 9 (font foi).
> Un run = une étape, captures avant / après, clair et sombre, vierge et démo.

- [x] AUJ-1 — La date seule (« Samedi 7 novembre », sans « Bonjour ») et le **bandeau d'ajout** juste dessous
  (`components/AddStrip.jsx`) : Repas (appareil photo), Bien-être (note 1 à 5), Digestion (fenêtre « Ma
  digestion »), cigarette si le compteur est actif (sinon dans « Autre chose »), Autre chose (« Décrire un repas »,
  cigarette). Section « Noter » du bas supprimée ; la carte « Mon ventre » n'est plus sur l'écran (dans la fenêtre
  Digestion). (07/11 15:35)
- [x] AUJ-2 — Bloc « Bien-être aujourd'hui » : la valeur du jour sur 5 (police mono), « D'après N lectures du visage »
  (et « votre gêne digestive » quand elle compte, VENTRE-BE-2), la courbe du jour (points et tendance de la vue Jour de
  l'historique, sans légende, à partir de 3 points) ; sans lecture, les notes du jour ; toucher → historique. Plus de
  verdict, d'échelle à segments, d'« estimation prudente » ni d'horizon qui respire (`DayBreath` supprimé) ; phrase
  d'intro du premier lancement retirée (leçon 2). (07/11 16:35)
- [x] AUJ-2b — Calibration de départ dans ce bloc : « Calibration du bien-être : 0 jour sur 3 », phrase du
  propriétaire, « Remplir maintenant » et « Recevoir un rappel » (bouton large) ; lié à (5) du 04/11. (07/11 18:40 :
  `StartCalibration`, « Recevoir un rappel » seulement quand la notification du soir existe ; `WellbeingPrompt`
  `initialMode`)
- [x] AUJ-3 — « Vos données du jour » en un seul bloc : une icône par mesure, l'écart à vos 14 derniers jours sur la
  mesure elle-même, sources en petit en bas (jamais un nom d'appareil ou d'app technique) ; `DayChanges` (« Ce qui
  change aujourd'hui ») disparaît. (07/11 19:05 : `TodayBySource` en un bloc, `measureNorms`, icônes par mesure,
  « D'après votre montre et votre téléphone. »)
- [x] AUJ-3b — Même logique d'écart sur la mesure dans le Journal. (07/11 21:20, avec ORG-2 : « ↓ d'habitude … » sous la
  valeur quand l'écart est net)
- [x] AUJ-4 — Bloc digestif : « Vos analyses digestives arrivent dans N jours », « Halcya cherchera quels facteurs sont
  statistiquement liés à votre confort digestif. », « N/28 jours avec une note digestive », bouton « Noter ma
  digestion », rappel du soir, petit graphique du jour s'il y a des notes ; ni délais, ni Benjamini-Hochberg, ni
  minimum ; la carte lilas des pistes (`PistesTeaser`) quitte l'Accueil. (07/11 19:30 : `DigestBlock`, « Noter ma
  digestion » ouvre la fenêtre du bandeau ; analyses prêtes → une ligne vers Analyses › Digestion)
- [x] AUJ-5 — « Mes repas du jour » : la liste, ou « Aucun repas aujourd'hui » et un bouton. (07/11 19:00 :
  `TodayMeals`, chaque repas ouvre Journal › Repas ; « Photographier un repas » ouvre l'appareil photo)
- [x] AUJ-6 — Sous chaque bloc, un petit « + » qui remonte au bandeau ; bouton plus large pour un bloc qui attend la
  personne (calibration, analyses, repas vides). (07/11 19:15 : `StripPlus`, remonte au bandeau et y met le focus)
- [x] AUJ-7 — « Ventre » devient « digestif » dans tous les textes visibles (« Ma digestion », sous-onglet
  d'Analyses, PDF, fiche) ; données et identifiants inchangés ; test de non-régression des libellés. (07/11 17:45 :
  app, notification du soir, pages légales, fiche « Halcya — digestion & bien-être » ; `digestifWording.test.js`)
- [x] AUJ-8 — Couleurs par thème (leçon 12) : vert = bien-être, orange = digestion, lilas = activité et sport, bleu
  nuit = sommeil ; tokens, contrastes testés, une analyse prend la couleur de son thème. (07/11 18:15 : rose framboise
  et gris compris ; `src/theme/themes.js`, `data-tone`, Journal, Sources, Analyses, réintroduction, abonnement)

**Compléments du propriétaire (07/11 vers 16:30)**, à intégrer aux étapes ci-dessus :
- [x] AUJ-1b — Photo des selles dans le bandeau d'ajout (geste explicite, analyse IA comme les repas, aucune photo
  gardée, résultat modifiable, jamais un diagnostic ; retours (7) du 04/11) et un petit « + » dans le bloc digestif.
  (07/11 19:45 : bouton « Selles » → fenêtre « Photo des selles » (`StoolPhotoLine`, divulgation inchangée) ; la ligne
  quitte le Journal ; bandeau défilant au-delà de 5 gestes)
- [x] AUJ-4b — Bloc digestif : « Vos apports jusqu'ici » après le premier repas du jour, sans rouge ni alerte ; un
  toucher ouvre Journal › Nutrition. (07/11 20:00 : kcal, protéines, glucides, lipides, fibres des repas du jour)
- [x] AUJ-3 (précision) — l'écart à votre norme sur chaque mesure dès 7 jours d'historique, en reprenant l'affichage
  de « Ce qui change aujourd'hui » (identité visuelle intacte).
- [x] AUJ-9 — Toucher la courbe du bien-être ou le graphique digestif ouvre Journal › Tendances réglé sur cette mesure
  (après ORG-3 ; d'ici là la courbe ouvre l'historique du bien-être). (07/11 20:15 : `?mesure=wellbeing`,
  `?mesure=digestion` ; `/bien-etre` → vue Jour)

## 🗂️ Nouvelle organisation (revue design du propriétaire du 07/11 vers 16:30) — après le nouvel écran Aujourd'hui

> Remplace les anciennes consignes sur Journal, Analyses, Tendances et FODMAP (dont ANALYSES-ONGLETS et TESTEUR-3b).
> Onglets : Aujourd'hui, Journal, Analyses, Agir (nouveau), Sources. Leçons 13 à 17 : `DESIGN.md` § 9.
> Un run = une étape, captures avant / après.

- [x] ORG-1 — Barre d'onglets : Aujourd'hui, Journal, Analyses, Agir, Sources ; Agir visible dès le début avec un état
  vide simple ; la réintroduction FODMAP quitte Analyses pour Agir (code gardé), proposée seulement quand une analyse
  digestive repère un groupe FODMAP. (07/11 19:00 : `pages/Act.jsx`, `services/act.js`, 5e onglet ; FODMAP retiré des
  sous-onglets et de l'onglet Digestion d'Analyses)
- [x] ORG-2 — Journal › Jours : retirer « Ce qui a été mesuré et noté, jour par jour », la photo des selles et « Vous
  avez corrigé N estimations » ; cartes jour par jour gardées, une icône par mesure, couleurs par thème, écart à la
  norme ; ni source dans un libellé (« Stress montre ») ni « · ».
- [x] ORG-3 — Journal › Tendances (quitte Analyses) devient un visualiseur : jour, semaine ou mois ; une ou plusieurs
  mesures superposables (un axe par unité) ; une mesure proposée à partir de 3 points ; toute mesure disponible.
  « Votre forme », radar (code gardé) et comptes à rebours en texte retirés. (07/11 20:15 : `TrendsViewer`,
  `services/trendsData.js` sur TS-1 ; sous-onglets soulignés pleine largeur)
- [x] ORG-3b — L'historique du bien-être fusionne dans Tendances (vue Jour, détail de chaque lecture au toucher :
  matrice des émotions, valence, éveil, qualité ; on descend aussi loin qu'on veut).
- [x] ORG-4 — Analyses = Bien-être et Digestion, même structure : retirer l'historique, « Sur quelques semaines »,
  « Autres liens repérés », « Bientôt » et l'analyse « dans les heures » ; « Comment c'est calculé » en lien discret en
  bas ; avant les résultats un seul compte à rebours (« Vos premiers résultats arrivent dans N jours », phrase du
  propriétaire, « Noter maintenant », « Recevoir un rappel »). (07/11 21:00 : `pages/Recommendations.jsx` réécrite sur
  le contrat `analysisResults`, `services/resultsView.js` ; anciens blocs retirés)
- [ ] ORG-5 — Méthode (remplace le modèle actuel) : une ligne par jour ; fenêtres court (le jour même avant la mesure et
  la veille), moyen (2 à 6 jours avant), long (7 à 27 jours avant) ; un modèle linéaire régularisé par résultat, avec
  contrôles (jour de la semaine, maladie ou voyage, tendance) et intervalles ; tests par blocs d'une semaine, correction
  sur facteurs × horizons, lien net seulement s'il tient dans ≥ 85 % des rééchantillonnages ; pas de « Ce qui pèse »
  sans prévision meilleure que « demain = aujourd'hui » hors échantillon ; courte liste de facteurs par personne ; jours
  notés plus pesants. Banc de simulation avec vérité connue (faux liens ≤ 5 %, effets forts retrouvés). Plusieurs
  runs : ORG-5a banc, ORG-5b fenêtres et matrice, ORG-5c modèle et stabilité, ORG-5d branchement.
  - [x] ORG-5-contrat (07/11, chantier du soir, session « méthode ») : contrat des résultats d'Analyses,
    `app/src/services/analysisResults.js` (`computeAnalysisResults`, `dayContributions`, typedefs documentés,
    `CONTRACT_VERSION` 1). Par résultat (bien-être, digestion) et horizon (court, moyen, long) : effet en points sur 5
    pour une variation habituelle, fourchette à 95 %, « net », thème, possibilité d'agir ; seuils de déblocage d'ORG-6 ;
    contributions du jour (coefficient × écart). Méthode provisoire (pente contrôlée semaine / week-end et tendance,
    échantillon effectif, BH) ; ORG-5c la remplace sans changer la forme. La session interface s'y branche.
  - [x] ORG-5a (07/11, chantier du soir) : banc de simulation avec vérité connue (`services/method/simulate.js`,
    `bench.js`, `bench.test.js`) : facteurs autocorrélés, rythme de la semaine, tendance, jours manquants, digestion
    en échelle ordonnée ; mesure la part des jeux avec au moins un faux lien « net » et la puissance par effet vrai.
    Le banc a montré que la méthode provisoire laissait passer jusqu'à 60 % de jeux avec un faux lien (BH + échantillon
    effectif sur la seule veille) : corrigée (Bartlett, Student, Holm, facteur de prudence 1,4 calé au banc). Mesures
    (200 jeux) : faux liens 0 à 3,5 % selon le scénario ; effet fort court terme retrouvé 60 % à 70 jours, ≥ 80 % à 120 ;
    moyen terme 26 % à 70 jours ; long terme 3 % (il faut des mois) ; digestion forte 75 % à 90 jours ; règle 5 vérifiée
    (un facteur du seul bien-être ne sort pas en digestion). Porte d'ORG-5c : faire mieux en puissance sans dépasser 5 %.
  - [x] ORG-5b (07/11, chantier du soir) : matrice d'une ligne par jour. Résultat du jour = estimation TS-1 (bien-être :
    notes et visage ; digestion : `digestionOwn`, sans rien du bien-être), pesée par sa précision (jours notés plus
    pesants, poids bornés à [1/4, 4]) ; FODMAP par sous-groupe comme facteurs (`fodmap_fructans`… : repas du jour
    au-dessus du repère) ; contrôle « journée à part » (malade ou voyage, déclaré ou fuseau changé) avec la semaine et la
    tendance ; moindres carrés pondérés.
  - [x] ORG-5c (07/11, chantier du soir) : modèle linéaire régularisé par résultat (`services/method/ridgeModel.js`) :
    courte liste par personne (les candidats les plus nets, ≤ 1 pour 8 jours et ≤ 12, sans doublons corrélés à > 0,9),
    ridge pondérée avec contrôles non pénalisés, λ par validation croisée par semaines ; stabilité par bootstrap des
    semaines (« net » = Holm et signe tenu dans ≥ 85 % des rééchantillonnages ; fourchette 2,5–97,5 %) ;
    `beatsPersistence` (prévision des semaines mises de côté contre « demain = aujourd'hui »). Banc (100 jeux) : faux
    liens 0 à 3 % ; fort court terme 65 % à 70 j, 90 % à 120 j ; moyen terme 57 % à 120 j ; digestion forte 72 % à 90 j.
  - [x] ORG-5d (07/11, chantier du soir) : la méthode est derrière le contrat (`method: 'org5'`) ; tâches du worker
    d'analyse `analysisResults` (contrat, seuils de déblocage d'ORG-6) et `dayStates` (TS-1 : estimation, fourchette,
    attendu, courbe digestive, note à demander), en cache comme les autres (fidélité JSON vérifiée). Pour l'interface :
    `getAnalysis('analysisResults')`, `getAnalysis('dayStates')` (`services/analysisRunner.js`).
  - [x] Contributions du jour sur le vrai modèle (07/11, chantier du soir) : `dayContributions` ne prend que les termes
    du modèle régularisé (coefficient à autres facteurs égaux × écart à la valeur habituelle), horizons d'un même
    facteur additionnés (une barre par facteur) ; `contributionsByDay` les calcule pour chaque jour, rendues par la
    tâche `analysisResults` (champ `contributions[outcome][jour]`) pour « Ce qui a pu peser ce jour-là » de Tendances.
- [x] ORG-6 — Résultats d'Analyses : « Pistes à tester » (2 ou 3 liens nets sur ce qu'on peut changer, « Essayer dans
  Agir ») puis « Ce qui pèse sur votre bien-être » : Court / Moyen / Long terme, barres de part et d'autre de zéro en
  points de bien-être pour une variation habituelle (« pour 50 min de sommeil de plus »), fourchette, couleur du thème,
  hachurées si pas assez net ; à part « À regarder, pas à changer » (corps, contexte). Déblocage : bien-être 14 / 21 /
  42 jours, digestion 28 / 35 / 56 jours et au moins 5 jours de gêne ou douleur.
- [x] ORG-7 — Sources de données classées dans `PRODUIT.md` (fréquence, rôle, possibilité d'agir) ; à venir : bilans
  sanguins (rares) et son ambiant (niveaux seulement, jamais d'audio). ✅ 07/11 (chantier du soir) : `PRODUIT.md` § 3 bis, tableau source / fréquence / rôle (résultat, facteur, contrôle,
  affichage) / agir / thème.

### Agir, Tendances et séries temporelles (revue design du 07/11 vers 17:00, maquette validée) — fait foi

> Complète ORG-1, ORG-3 et ORG-3b. Chantier du soir (07/11) : session « interface » (ORG-1b, ORG-3c, ORG-8) et session
> « méthode » (TS-1, TS-2) en parallèle.

- [x] ORG-3c — **Tendances** : les sous-onglets du Journal deviennent des onglets soulignés sur toute la largeur ; les
  réglages de la courbe (puces de mesure avec leur point de couleur, « + » pour ajouter une mesure, sélecteur compact
  Jour / Semaine / Mois) sont petits, dans la carte du graphique, jamais au niveau visuel des onglets. Chaque jour : une
  ligne et sa fourchette, un point plein seulement les jours notés, repère « auj. ». Aucun attendu sur le passé :
  l'attendu d'après vos habitudes prolonge seulement le futur, en pointillés (le pointillé ne sert qu'à ça), avec une
  fourchette qui s'élargit (Semaine : 3 jours, Mois : 7). Toucher un jour : date, nombre de lectures (et la note), valeur
  sur 5, confort digestif s'il est affiché (« noté « gêne » » le cas échéant), jamais d'« attendu » ; « Expressions du
  visage » en étoile à 8 branches (rayon en racine carrée, pourcentage sous chaque nom, le jour en couleur pleine,
  l'habitude des 28 jours en trait gris, « Plus de tristesse, moins de joie que d'habitude » dès 5 points d'écart) ;
  « Humeur et éveil » : carte valence × éveil (désagréable / agréable, calme / animé ; coins tendu, enjoué, las, détendu),
  un point par lecture, la moyenne du jour, l'habitude en ellipse grise, « Éveil plutôt calme, moins que d'habitude » ;
  « Ce qui a pu peser ce jour-là » : les 3 plus grandes contributions du modèle d'ORG-5 ce jour-là (coefficient × écart
  du facteur), barres de part et d'autre de zéro, couleur du thème. Toucher un jour futur : l'attendu et sa fourchette.
  L'attendu, la fourchette et la courbe digestive estimée se branchent sur TS-1 ; d'ici là, seul ce qui existe s'affiche.
  (07/11 20:40 : `TrendsDayDetail`, `services/trendsDay.js` ; contributions du contrat `analysisResults`)
- [x] ORG-1b — **Agir** (complète ORG-1) : En cours (plusieurs essais à la fois, progression, consigne du jour), Mes
  habitudes, Proposés par vos analyses (« Commencer »), Terminés ; en bas « Tous vos essais, vérifiés ou non, figurent
  dans votre rapport médecin » (par défaut, sans bouton). (07/11 19:00 : sections sur les tests FODMAP existants ;
  « Mes habitudes » et les essais viennent avec ORG-8)
- [x] ORG-8 — **Un essai dans Agir** : jours tirés au sort avec / sans (14 jours, ou semaines alternées), calendrier de
  pastilles (pleine = avec, contour = sans, ✓ tenu, – pas tenu), « Pourquoi des jours tirés au sort ? », « Ce qui est
  mesuré ». Le respect de la consigne vient des données (montre, téléphone) ; la question (« Le coucher était-il avant
  23 h ? ») n'apparaît que si elles manquent, sous « Nous n'avons pas reçu vos données de sommeil pour hier soir. ».
  « Résultat en cours » se dessine chaque jour : points Avec / Sans du lendemain, moyennes, barre « Écart » avec
  fourchette dès 3 lendemains de chaque sorte. À la fin : « Vérifié par votre essai » ou « pas d'effet net », même
  graphique, « Garder cette habitude ». Mes habitudes : les 14 dernières pastilles de tenue ; si la personne s'en
  éloigne (9 jours sur 14), « Vous vous éloignez de cette habitude » avec « Relancer le test » et « Supprimer cette
  habitude », au plus une fois par mois et par habitude, effacé dès qu'elle reprend. Les essais vont dans le rapport
  médecin. (07/11 21:45 : `services/trials.js`, `pages/Trial.jsx`,
  `TrialDots`, type d'entrée `trial`, section « Essais personnels » du rapport PDF)
- [x] TS-1 — **Un seul modèle à espace d'états** pour le bien-être et le confort digestif (avant ORG-5d : les analyses
  prennent l'estimation du jour et sa fourchette) : deux états cachés par jour, chacun = tendance lente + rythme de la
  semaine + écart du jour ; écarts corrélés entre les deux (lien appris sur les jours où les deux sont connus, rétréci
  vers une valeur prudente commune) ; observations : notes de bien-être et lectures du visage (le même objet, précisions
  différentes, calibration par personne), notes digestives (échelle ordonnée), type de Bristol ; filtre de Kalman et
  lissage sur l'appareil → estimation du jour, fourchette, attendu des jours à venir. Remplace VENTRE-BE-2. Confort
  digestif affiché sur 5 ; sans note digestive il s'estime par le bien-être, et sa courbe n'apparaît que si elle prédit
  les notes mises de côté (validation par blocs) mieux que la moyenne. Ne demander une note que les jours où
  l'estimation est la plus incertaine. Règle 5 : le bien-être n'est jamais un facteur des analyses digestives, qui
  n'apprennent que de l'information digestive ; le banc vérifie qu'un facteur qui ne touche que le bien-être ne devient
  pas un facteur digestif. Aucun texte visible ne dit qu'une estimation est « dégradée » ou moins bonne faute de notes.
  (Session méthode.)
  ✅ 07/11 (chantier du soir) : `services/method/stateSpace.js` (`estimateStates`, `estimateStatesFromEntries`) :
  filtre de Kalman + lissage RTS sur 4 états (tendances et écarts du jour liés), paramètres appris par personne
  (précision du visage, écarts du jour, lien rétréci vers 0,3 sur 20 jours), rythme de la semaine dès 21 jours ;
  fourchette à 80 % ; attendu des 7 jours à venir ; `digestionOwn` (sans rien du bien-être, seule série digestive des
  analyses) ; `showDigestiveCurve` (validation par blocs d'une semaine contre la moyenne) ; `noteRequest` (jours parmi
  les 30 % plus incertains des 4 dernières semaines). Banc : 9 à 10 sur 10 mieux que le visage seul, couverture de la
  fourchette entre 65 et 95 %, règle 5 ≤ 5 %. ✅ 07/11 (reprise du soir) : VENTRE-BE-2 retiré. La valeur du jour de
  l'Accueil vient de TS-1 (`todayWellbeingState` : le calcul `dayStates` s'il est en cache, sinon le même modèle sur
  les entrées que l'Accueil lit déjà, selles comprises ; seulement si le bien-être est observé aujourd'hui) ;
  `gutSelfReport.js` (`gutAdjust`) supprimé ; plus d'ajustement digestif dans `faceMood.js`, `faceMoodDays.js`,
  `wellbeingHistory.js` ; « et votre gêne digestive » (Accueil) et « la note baisse de… » (détail d'une lecture)
  retirés. Budget de lectures local : Accueil 402 enregistrements (max 1 500), aucune tâche longue.
- [x] TS-2 — **Changements durables** : bien-être, confort digestif, sommeil, VFC, FC au repos, pas, écran, une fois le
  rythme de la semaine retiré ; un saut de niveau, au moins 7 jours de chaque côté, au moins une demi-variation
  habituelle, confirmé 7 jours après ; seuil calé sur le banc (moins d'une fausse alerte par courbe et par semestre).
  Repère « changement » dans Tendances (vue Mois) : niveau avant et après, « Au même moment » (autres changements à ±
  5 jours), jamais de cause ; aussi dans le rapport médecin. La norme des écarts du jour repart du nouveau niveau ; un
  lien d'Analyses doit tenir à l'intérieur des périodes ; un essai traversé par un changement le signale. (Session
  méthode.)

## 🧑‍🔬 Retours du premier testeur iPhone du 06/11 au soir — PRIORITÉ DES RUNS DE CODE (seule une CI cassée passe avant)

Résumé anonyme : [`RETOURS-TESTEURS.md`](RETOURS-TESTEURS.md). Code partagé : ce qui est corrigé ici part aussi sur
iPhone. Un run = une étape testable, captures avant et après (clair et sombre, vierge et démo). Règle durable : même
apparence = même type d'information ; moins de texte ; jamais le problème dans une carte et la solution dans une autre.

**(4) Journal et repas** (le plus court, commencé en premier)
  ✅ 07/11 (chantier du soir) : `services/method/changes.js` (`detectChanges`, `changesFromEntries`, `normStart`,
  `periods`, `crossingChanges`, `sameTime`) et tâche `changes` du worker. Rythme de la semaine retiré, variation
  habituelle robuste, t corrigé de l'autocorrélation ≥ 4, saut ≥ 0,5 variation habituelle, ≥ 7 jours de chaque côté,
  confirmé par les médianes des 7 jours avant et après, deux changements à ≥ 14 jours. Banc (200 courbes de 6 mois) :
  0,26 fausse alerte par courbe et par semestre (0,69 sur des courbes plus lissées) ; saut de 2 variations habituelles
  retrouvé 79 %. Bien-être et digestion sur l'estimation TS-1 (digestion sans le bien-être). Reste à l'interface : le
  repère dans Tendances et le rapport. TS-2b ✅ 07/11 : les liens d'Analyses tiennent à l'intérieur des périodes (chaque
  changement durable du résultat devient un contrôle de niveau ; `outcomes[x].changes`) ; un saut commun d'un facteur
  et du résultat n'est plus un lien (test). `normStart` ✅ 07/11 (reprise du soir, 21:40) : la norme de chaque mesure
  de « Vos données du jour » et du Journal › Jours ne prend que les jours depuis le dernier changement durable de sa
  courbe (`normSinceFromChanges`, option `since` de `measureNorms`) ; la date vient du dernier calcul `changes` connu
  (`lastAnalysis`, aucun calcul ni lecture de plus à l'Accueil : budget de lectures intact).
- [x] TESTEUR-4a — Repas vierges : « Aucun repas enregistré pour l'instant » et un bouton « Ajouter mon premier repas »
  qui ouvre l'appareil photo, sans les trois étapes de texte (06/11 22:35).
- [x] TESTEUR-4b — « Photographier un repas » de l'Accueil et de Nutrition ouvre directement l'appareil photo (sans
  passer par la page Repas) ; test du champ `capture` sur les deux points d'entrée (07/11 00:35 : `MealPhotoButton`,
  libellé d'un champ `capture="environment"` ; la photo passe en mémoire à Repas, reprise une fois ; aussi la tuile du
  Journal vide).
- [x] TESTEUR-4c — « Vos derniers jours… » en une phrase simple (07/11 01:35 : « Ce qui a été mesuré et noté, jour par
  jour. »).
- [x] TESTEUR-4d — Nutrition : sous-titres (« estimé d'après vos pas des 14 derniers jours », « modérément actif sans
  montre ») au toucher seulement ; problème et solution dans la même carte (07/11 02:35 : `BodyProfileCard`, chaque
  valeur à provenance est un bouton souligné en pointillés qui l'affiche ; « À compléter… » ouvre le formulaire ;
  dans le formulaire, l'explication du niveau d'activité n'apparaît qu'après un choix, sans « modérément actif sans
  montre » ; cibles de 44 px).

**(1) Aujourd'hui, à refaire** (plusieurs runs ; un run « idées » prépare la maquette)
- [x] TESTEUR-1a — Petites retouches : date et « Bonjour » sur deux lignes ; plus de séparateurs « · » ; retirer
  « Pas et nuits peuvent venir de votre téléphone ; une montre ajoute le cœur » ; « Vos pistes arrivent dans N jours »
  devient « Vos analyses arrivent dans N jours » (06/11 23:35 ; aussi dans Analyses, sans « 6 dernières semaines » ni
  « surtout du hasard » sur la carte du compte à rebours).
- [x] TESTEUR-1b — Maquette (run idées) : statut du jour en tête (« Votre journée : plutôt moyenne » et d'où il vient),
  animation chaleureuse originale, puis l'explication, puis les données du jour par source, puis « Noter ».
  (07/11 08:35 : [`maquettes/aujourdhui/`](maquettes/aujourdhui/README.md), HTML aux tokens de l'app, captures
  avant / après, clair, sombre, premier jour, bonne et difficile ; règle de sens constant écrite ; découpage ci-dessous.)
- [x] TESTEUR-1c — `DayStatusCard` en tête de l'Accueil : « Votre journée » + titre (seuils de `daySummaryTitle`),
  échelle 1 à 5, « D'après… » + étiquettes (lectures, note, ventre si VENTRE-BE-2 l'a compté), « Pas encore d'avis »
  avec un seul bouton ; remplace le titre et la carte « Bien-être estimé » ; toucher → historique.
  (07/11 09:35 : `components/DayStatusCard.jsx` + `dayStatus()` dans `services/today.js`. Le statut vient du visage du
  jour, sinon de la dernière note du jour (jamais d'hier) ; la note manuelle n'entre pas dans l'estimation du visage,
  elle reste une étiquette ; « Plutôt bonne / moyenne / Plus difficile » ; étiquettes « N lectures du visage »,
  « votre note : X/5 », « ventre : gêne comptée » seulement si VENTRE-BE-2 l'a compté, « estimation prudente » si la
  confiance est faible. Le haut de la carte est un lien vers `/bien-etre`. « Noter moi-même » reste dans la carte
  jusqu'à 1d (section « Noter ») ; vide : bouton contour « Noter comment je me sens » pour ne pas doubler le bouton
  plein « Photo du repas ». Courbe 14 j, écart à la moyenne et détails quittent l'Accueil (ils sont dans
  l'historique) ; `MoodEstimateCard` n'est plus monté que dans ses tests : à supprimer avec 1d.)
- [x] TESTEUR-1d-a — Section « Noter » unique (07/11 10:35 : `components/NoteSection.jsx` : titre `h2` « Noter »,
  « Photo du repas » en bouton plein, tuile menthe « Mon bien-être » (note 1 à 5), carte ventre pêche retitrée « Mon
  ventre » à l'intérieur (même règle POL-4, un geste reste un geste), « Autre chose » en surface neutre (cigarette si le
  compteur est actif). `DayStatusCard` n'a plus de bouton (sauf calibration de départ) ; vide : « Notez votre bien-être
  plus bas… ». Ordre de l'Accueil : statut, carte lilas des analyses, tuiles du jour, Noter. Les selles restent dans
  la carte ventre (thème pêche) ; aucune « note libre » n'existe encore sur l'Accueil.)
- [x] TESTEUR-1d-b — « Vos données du jour » par source (Montre, Téléphone, Noté par vous ; source absente masquée,
  « Ajouter une montre › » sinon), dernière note du ventre et du bien-être dans « Noté par vous » ; supprimer
  `MoodEstimateCard` (déplacer `StartCalibration` et `UnlockReminder`). (07/11 11:35 : `todayBySource()` dans
  `services/today.js` + `components/TodayBySource.jsx` ; Montre = sommeil, VFC nuit, FC au repos, et les pas quand
  ils viennent d'une montre connue ou du même appareil que la nuit ; Téléphone = pas, nuit estimée, temps d'écran ;
  Noté par vous = note du jour seulement (menthe / pêche), repas, cigarettes ; appareil d'origine en mono en tête de
  carte ; rien du tout au premier jour. `MeasureTiles` et `MoodEstimateCard` supprimés ; rappel et calibration dans
  `WellbeingNudges.jsx`. La météo n'y est pas : elle n'est enregistrée que pour les journées terminées.)
- [x] TESTEUR-1d-2 — « Ce qui change aujourd'hui » : `dayDeviations` (médiane 14 j, 3 écarts au plus, aucune couleur
  de jugement, règle 6) + carte lilas qui explique les analyses (« Halcya cherchera ce qui revient avant vos bons et
  vos mauvais jours »). (07/11 12:35 : `services/dayDeviations.js` + `components/DayChanges.jsx` ; sommeil, VFC nuit,
  FC au repos, pas, écran ; au moins 7 jours passés ; seuil 1,5 écart absolu médian avec minimum par mesure ; cumuls
  « en moins » seulement après 21 h ; phrase lilas propre à l'objectif ; 548 lectures à l'Accueil sur 3 ans.)
- [x] TESTEUR-1d-3 — Carte lilas, analyses prêtes : la piste la plus solide qui touche une mesure du jour (« Les nuits
  courtes vont souvent avec… », à confirmer), lien vers Analyses. (07/11 14:35 : `leverVars` dans le résumé des pistes,
  `pisteTouchingToday` (nuits, pas, écran ; VFC et FC jamais), écarts transmis par `DayChanges` ; la piste liée passe
  devant avec « Aujourd’hui : nuit plus courte. » ; sinon la carte est inchangée.)
- [x] TESTEUR-1e — Animation « horizon qui respire » (CSS, pente selon le statut, immobile avec « réduire les
  animations », `aria-hidden`). (07/11 13:35 : `components/DayBreath.{jsx,css}`, en bas à droite de la carte, à côté
  de « D'après… » : en haut à droite, elle faisait passer « Plutôt moyenne » sur deux lignes.)

**(2) Note de bien-être**
- [x] TESTEUR-2a — Échelle 1 à 5 avec un milieu : migration des anciennes notes 0–5 sans perte (fonction pure,
  testée sur toutes les valeurs, export/import d'anciens fichiers), estimateur et graphiques recalés. (07/11 04:35 :
  stockage inchangé sur 0–5, aucune donnée réécrite ; `mood/wellbeingScale.js`, affiché = 1 + 0,8 × interne,
  réversible ; saisie à cinq choix stockés 0 / 1,25 / 2,5 / 3,75 / 5 ; tous les affichages convertis.)
- [x] TESTEUR-2b — La note d'abord, puis précisions pré-remplies (stress, alcool, café, repas tardif, écran tard) et
  une phrase libre (précisions = facteurs X, jamais entrées de l'estimateur : règle 5). (07/11 05:35 : la fenêtre
  n'affiche que les cinq notes ; les précisions, rangées stress, alcool, café, repas tardif, écran tard puis les autres,
  la phrase et le rappel du soir apparaissent une fois la note choisie ; « Dictez-la… » devient une ligne. Tags et
  stockage inchangés.)
- [x] TESTEUR-2c — Notification du soir : deux choix « Remplir maintenant » / « Recevoir un rappel » (heure réglable) ;
  moins de texte (« encore quelques jours de lecture… », « un jour sur trois »). (07/11 06:35 : dans la fenêtre de
  note, un sélecteur à deux choix avant la note ; « Recevoir un rappel » montre « Chaque soir à [heure] » (18 h à 23 h),
  « Programmer le rappel » ou « Changer l'heure », et « Arrêter le rappel » en lien ; l'heure choisie remplace l'heure
  apprise (`eveningNote.js`, `healthtrack_evening_note_minute`). L'ancien bouton « Me la demander le soir, d'un geste
  depuis une notification » disparaît. Correctif lié à 2a : la notification native proposait encore 0 à 5 ; elle
  propose 1 à 5 (boîte v2 `choice`, v1 toujours lue, même valeur stockée qu'une note saisie). Reste : « encore quelques
  jours de lecture » et « un jour sur trois » sont dans la carte Bien-être de l'Accueil, à reprendre avec TESTEUR-1c.)

**(3) Analyses**
- [x] TESTEUR-3a — Retirer « sur les 6 dernières semaines », « sinon surtout du hasard » ; garder « encore N nuits ».
  (06/11 23:35 carte du compte à rebours ; 07/11 01:35 : plus aucun « hasard » visible, « Données exploratoires »
  devient « Encore N jours de notes pour des résultats plus sûrs », « Après un repas : encore N jours de lectures du
  visage » ; la méthode reste dans « Comment c'est calculé ». Reste le séparateur « · » de la ligne d'en-tête, avec 3b.)
- [x] TESTEUR-3b — Bien-être et Tendances : fusionner ou différencier (proposition en run idées d'abord). (07/11 :
  résolu par ORG-3 / ORG-3b, l'historique du bien-être est la vue Jour de Journal › Tendances)
- [x] TESTEUR-3c — Plus d'interrupteur dans un interrupteur (calcul du modèle qui prédit le bien-être). (07/11 03:35 :
  le modèle est un second dépliant à côté de « Comment c’est calculé », « Comment fonctionne ce modèle » une section
  titrée ; test : aucun `details details` dans le pied de page.)

**(5) Sources et accueil**
- [ ] TESTEUR-5a — Toutes les autorisations pendant l'accueil (Santé et son historique, position approximative pour
  la météo, caméra), chacune avec sa divulgation, refus respecté.
  - [x] 5a-1 (07/11 07:35) : écran « La météo de votre ville » après la montre (et Health Connect), pour tous :
    « Utiliser ma position approximative » → divulgation `location` → position lue une fois, arrondie (≈ 10 km), météo
    activée, synchronisation en arrière-plan ; refus ou position indisponible : « choisir une ville dans Sources » ;
    déjà activée : rien à redemander. `services/approxPosition.js` partagé avec la carte Météo de Sources ; garde de
    divulgation étendue à l'onboarding. Correctif lié à 2a : le premier geste « Comment vous sentez-vous ? » proposait
    encore 0 à 5 et stockait le chiffre brut : il propose 1 à 5, stockés par `choiceToScore`.
  - [x] 5a-2 : Health Connect proposé aussi sans montre (le téléphone y écrit pas et sommeil), avec l'historique
    (READ_HEALTH_DATA_HISTORY déjà demandé ?) ; vérifier l'ordre des écrans (Santé, météo, caméra) et le compteur.
  - [x] 5a-3 (07/11, reprise du soir) : Sources sans doublon de demande une fois tout accordé à l'accueil. Vérifié
    dans le code : météo (`enableWeather` → la carte n'affiche plus « Utiliser ma position », test ajouté), lecture du
    visage (`isFaceSenseEnabled`, même réglage), Health Connect (`checkPermissions` accordé → plus de « Demander les
    autorisations » ; source allumée par le premier import). Reste à voir sur téléphone (« À tester »).
- [ ] TESTEUR-5b — iPhone : mention propre à Android dans la source Santé ; source « iOS 26.4 ou plus » masquée ou
  expliquée (transmis à la routine iOS le 06/11 22:35 ; vérifier ici les textes du code partagé). (07/11 : aucun texte
  « iOS 26.4 » ni mention Android dans le code partagé de Sources ; reste côté routine iOS)

## 🥇 Silver et Gold — décision du propriétaire du 31/10 vers 22:45 (bascule vers Gemini 3.8 Flash, sans banc préalable)
Ordre : (a) bascule du relais → polissage des textes « slop IA » (demande du 31/10 vers 21:35) → (b) produits et écrans → (c) plus tard.
- [x] **GOLD-a** (31/10 22:33, `relay/src/costs.js`, `server.js`, `vertex.js`, `config.js`, `relay-deploy.yml`) Le relais
  sert Gold avec `gemini-3.8-flash` (zone `eu` seulement, `thinkingConfig.thinkingLevel = MEDIUM`, délai 25 s) puis
  Flash-Lite en secours (délai, modèle absent, réponse illisible, 429) ; Silver (abonnement actuel, `source: play`) et
  gratuit restent sur Flash-Lite (3.5 puis 3.1, zone eu puis europe-west1, délai ramené à 30 s : Gold + secours < 60 s
  de Cloud Run). Gold = toute installation premium par la période de lancement (`source: launch`) + empreintes de
  `GOLD_INSTALLS`. Jetons de chaque appel journalisés (`event: usage` : entrée, cache, réflexion, sortie, coût ; jamais
  le contenu), cumul du mois en micro-euros (mémoire + Firestore `relay-costs/AAAA-MM`, incrément serveur) : Gold
  coupé au-delà de 15 € (`GOLD_MONTHLY_EUR`), toutes les analyses au-delà de 19 € (`STOP_MONTHLY_EUR`, budget 20 €).
  Plafonds recalculés : `GOLD_DAILY_CAP=40` (≤ 1,72 €/jour au pire à 4,3 c), `GLOBAL_DAILY_CAP` 200 → **150**
  (pire jour ≈ 40 × 4,3 c + 110 × 1 c ≈ 2,8 €). Grille de prix prudente dans `costs.js` (`MODEL_PRICES` la remplace).
  Variante play : le nom du modèle n'apparaît plus dans les détails de la carte de résultat (`FEATURES.aiModelName`).
- [x] **GOLD-a2 — vérifié en production le 02/11 vers 00:10** (déploiement 41359490864 de #614) : 7 derniers jours,
  téléphones : **18 analyses Gold servies par `gemini-3.8-flash` en zone eu**, 15 installations, 0,70 € (≈ 3,9 c
  l'analyse) ; 80 analyses plus anciennes sur Flash-Lite (avant la bascule, sans niveau journalisé) ; un seul retour
  sur Flash-Lite, `day_cap` (plafond du jour), aucune erreur Vertex. Analyse de test de la CI : Gold, 200. (01/11 23:33 : étape « Analyses IA des 7 derniers jours » du workflow
  relais, tableau origine CI / téléphones × niveau × servi × modèle × zone, installations, coût, et `gold_fallback` par
  raison ; reste : lire le résumé du déploiement de ce merge et, s'il y a des `gold_fallback` en erreur, prévenir le
  propriétaire) après le déploiement, lire les journaux du relais (`event: usage`,
  `served: gold`, `gold_fallback`) via le workflow de vérification ; si `gemini-3.8-flash` est refusé en zone `eu`,
  les analyses passent sur Flash-Lite (rien de cassé) : le noter et prévenir le propriétaire.
- [x] **LISTING-2 — fiche Play et abonnements aux noms Silver / Gold** (livré le 03/11 00:35 : titre « Halcya Silver », Gold « Tout Silver… », fiche « Sans abonnement, avec Silver ou Gold », description courte « SII, FODMAP » ; `ensureCatalog` réécrit désormais la fiche fr-FR d'un abonnement existant si elle diffère (`updateMask=listings`, autres langues et prix intacts) ; à vérifier au résumé des workflows « Play — fiche » et « Play — abonnements » après le merge) (idée du 02/11 20:35, `IDEES.md` I209–I210 ;
  run de code court, avant la version candidate) : la fiche dit encore « Premium » (10 analyses par jour, Gold absent)
  et le produit Silver s'appelle « Halcya Premium » dans la feuille d'achat de Google alors que l'app dit « Silver ».
  (a) section abonnement de `full-description.txt` (texte prêt dans I209) ; (b) `subscriptions.mjs` : titre
  « Halcya Silver » (`halcya_premium` inchangé), Gold « Tout Silver, et deux fois plus… » ; (c) description courte
  avec « SII, FODMAP » (I210, 80 caractères) ; (d) tests-gardes (titres = APP_NAME + tierName, plafonds 10 / 20 de la
  même constante, plus de « Premium » comme formule) ; puis lire les résumés des workflows « Play — fiche » et
  « Play — abonnements ».
- [ ] **GOLD-a3 — Gold du propriétaire après la période de lancement** : (01/11 22:33, côté app fait : empreinte
  affichée dans le mode diagnostic caché, `installFingerprint()` = `hashInstallId` ; reste : recevoir l'empreinte du
  propriétaire, P37, et l'ajouter à `GOLD_INSTALLS` dans le workflow du relais) moyen retenu, `GOLD_INSTALLS` (empreinte de
  12 caractères de son installation, telle qu'elle figure dans les journaux, aucune donnée personnelle). À brancher dans
  le workflow avant la fin de la période (lire l'empreinte de ses analyses dans les journaux, ou l'afficher dans le
  mode diagnostic caché).
  - [x] **GOLD-a3-1** (03/11 17:35, mergé et lu le 03/11 18:35 : une seule installation, `5e4a69f72ffb`, 29/10 → 02/11,
    6 événements) bilan de « Relais — déploiement » : empreintes des installations Android au jeton
    Play Integrity accepté (hors CI et robots), avec leurs jours. Lu avant l'arrivée des testeurs, c'est l'empreinte du
    téléphone du propriétaire (seul `passed`) ; reste : sa confirmation (P37 simplifiée : les 4 premiers caractères),
    puis `GOLD_INSTALLS=<empreinte>` dans `relay-deploy.yml` (GOLD-a3-2), avant le 27/11.
  - [x] **GOLD-a3-2** (14/11 17:35, « P37 oui confirmé » du 14/11 vers 16:50) : `GOLD_INSTALLS=5e4a69f72ffb` dans
    `relay-deploy.yml`, test de garde dans `relay/test/workflow.test.js` (la liste ne contient que cette empreinte).
  - [x] **GOLD-a3-3** (14/11 18:35 : fait avec P44-1, `offeredFor` dans `relay/src/billing.js` ; une empreinte de
    `GOLD_INSTALLS` a une période offerte sans fin : `premium: true`, `tier: 'gold'`, `source: 'launch'`,
    `launchUntil: null`, 20 analyses par jour ; **l'app lisait cette réponse comme « gratuit » jusqu'au 14/11 23:35, P44-3a** ; l'app dit alors « Gold offert pendant le test : vous n'avez rien à
    payer. », texte à revoir pour lui avec P44-3 ; pas vérifié sur son téléphone, sans effet avant le 02/12)
    (avant le 02/12, fin de la période de lancement) : aujourd'hui `GOLD_INSTALLS` ne change que le
    modèle servi (`tierOf` dans `relay/src/server.js`). Hors période, l'installation listée reste « gratuite » pour
    les crédits (`credits.take` avec `premium: false`) et pour l'app (`verifyResponse` de `relay/src/billing.js` rend
    `premium: false` : paywall, pas de « Gold »). À faire : l'installation listée reçoit les droits Gold complets
    (20 analyses par jour, `premium: true`, `tier: 'gold'`), par le même mécanisme que P44-1 (une période offerte par
    installation), tests sur `/v1/billing/verify`, `/v1/credits` et `/v1/analyze` ; vérifier le texte que l'app
    affiche alors (aujourd'hui « Gold offert pendant le test, jusqu'au … » pour `source: 'launch'`).
- [ ] **P44 — un mois de Gold en plus pour les testeurs actifs** (« P44 oui », propriétaire, 14/11 vers 16:50) :
  Gold jusqu'au 27/12 pour les installations qui ont analysé au moins un repas pendant le test, sans carte ni donnée
  personnelle, sous les plafonds du budget ; jamais lié à un avis (règles Play). À livrer avant le 02/12.
  - [x] **P44-1** (14/11 18:35 : clé `offered` de `relay/src/launch-period.json`, `{ until: "2026-12-27T23:00:00Z",
    installs: [] }` ; la liste est vide, personne n'en bénéficie encore : P44-2 la remplit le 02/12 au matin ;
    `relay/test/offered.test.js`, 6 tests ; jamais pour une requête iPhone ; pendant la période générale, la date
    affichée reste le 02/12) (relais) : une période offerte par installation, par empreinte (`hashInstallId`, 12 caractères) :
    liste et date de fin (« 2026-12-27T23:00:00Z ») dans un fichier du relais ou une variable du déploiement ;
    `verifyResponse` rend `premium: true`, `tier: 'gold'`, `source: 'launch'` et `launchUntil` à cette date pour
    ces installations une fois la période générale finie ; crédits et modèle suivent ; plafonds inchangés
    (`GOLD_DAILY_CAP`, 15 € et 19 € du mois). Tests. L'iPhone n'est pas concerné (période finie le 06/11).
  - [x] **P44-2a** (14/11 21:35) : étape « Testeurs actifs (P44-2, non bloquant) » de `relay-deploy.yml`, tri dans
    `relay/p44-active.jq` (testé dans `relay/test/workflow.test.js` sur des événements synthétiques). Un repas =
    événement `analyze` de type `photo` ou `text`, lisible ; une empreinte est écartée si un de ses contrôles Play
    Integrity est marqué CI, robot, réseau de test ou iPhone ; « à inscrire » = au moins un jeton accepté, les
    autres sont listées à part. Le bilan donne aussi la durée de conservation des journaux.
  - [ ] **P44-2b** — **premier relevé, 14/11 21:55** (déploiement de #985) : 3 installations à inscrire,
    `5e4a69f72ffb` (celle du propriétaire, 37 repas, 08/11 → 14/11), `8419337c4894` (3 repas, 10/11 → 14/11),
    `b029a1141987` (7 repas, 08/11 → 11/11) ; 0 sans jeton accepté ; 123 écartées (robots, réseau de test, iPhone) ;
    246 analyses et 239 contrôles lus ; conservation des journaux : 30 jours (le 02/12, le 08/11 sera encore lisible).
    Suite : lire le premier relevé (bilan du déploiement qui suit le merge) et le noter ici ; si la
    conservation est inférieure à 25 jours, garder les relevés successifs dans le journal. Le 02/12 au matin :
    relancer « Relais — déploiement » (workflow_dispatch), inscrire la liste « à inscrire » dans `offered.installs`
    de `relay/src/launch-period.json` par une PR, décider des « sans jeton accepté » (par défaut : non inscrites).
  - [ ] **P44-2** (CI, découpée en 2a et 2b le 14/11 21:35) : le bilan de « Relais — déploiement » liste les empreintes Android qui ont au moins un
    événement `analyze` (hors CI, robots et Test Lab) entre le 08/11 et le 02/12 ; vérifier combien de jours les
    journaux Cloud Logging sont gardés (30 par défaut) et faire un premier relevé sans attendre. Inscrire la liste
    le 02/12 au matin (un testeur qui analyse son premier repas le dernier jour compte).
  - [x] **P44-3a** (14/11 23:35) : **bug côté app de GOLD-a3-3**. `getEntitlement` (`app/src/services/entitlement.js`)
    calculait `premium = isFuture(launchUntil)` : avec `launchUntil: null` (période offerte sans fin, installation du
    propriétaire après le 02/12), l'app repassait en gratuit alors que le relais servait Gold. Corrigé (source
    `launch` sans date = premium jusqu'à la vérification suivante), testé (`entitlement.test.js`, `Premium.test.jsx`).
    Textes de ce cas : « Gold offert : vous n'avez rien à payer. » (Paramètres), « Gold offert » et « Tout ce qui suit
    est débloqué… » (écran Gold), sans « pendant le test » ni « Merci de tester l'app ». Outil :
    `npm run visual -- --play --routes=/premium,/settings --subscription=launch --launch-ends-in=never`.
    Vu sur relais factice ; pas sur le téléphone du propriétaire. `LaunchStep` de l'accueil dit encore
    « Gold est offert pendant le test » (ne se voit qu'à une réinstallation, qui change l'empreinte de toute façon).
  - [x] **P44-3b** (fait le 15/11 01:35, voir la fin de l'entrée) : un testeur inscrit voit « Gold offert jusqu'au 2 déc. » (carte FIN-LANCEMENT-1, du 30/11 au
    02/12), puis rien ne lui dit que Gold continue : la date passe au 27 déc. dans Paramètres et l'écran Gold
    (« Gold offert pendant le test, jusqu'au 27 déc. 2026 », vu en capture avec une date factice), la carte revient
    le 24/12. À faire : une carte d'Aujourd'hui, une fois, quand la date servie par le relais recule
    (`halcya_launch_last_until` plus ancienne que `launchUntil`) : « Gold offert jusqu'au 27 décembre », sans lien
    avec un avis. Vérifier aussi que la carte « Le test est terminé. Merci ! » ne s'affiche pas à un inscrit entre la
    fin de la période et sa première vérification (hors connexion le 03/12).
    **Fait le 15/11 01:35** : `refreshEntitlement` note une fin reculée (`halcya_launch_extended`) ;
    `launchExtendedNotice` → carte « Gold offert jusqu'au 27 déc. 2026 · Gold est prolongé : vous n'avez rien à
    payer. », une fois, avec le lien vers l'écran Gold ; `launchEndedNotice` se tait tant que le dernier état connu
    est encore `source: 'launch'` (pas revérifié depuis la fin). Outil : `--launch-extended`. Vu sur relais factice.
    Reste connu : du 30/11 au 02/12 l'inscrit lit « Gold offert jusqu'au 2 déc. » (le relais ne sert le 27/12
    qu'après la fin de la période commune) ; entre l'ouverture du 03/12 et la réponse du relais, version gratuite
    sans carte.
  - [ ] **P44-3** (app et textes ; 3a et 3b faites, reste la vérification) : vérifier sur l'émulateur ce que lit un testeur le 02/12 (cartes FIN-LANCEMENT-1
    et 2, « Gold offert … jusqu'au 27 décembre »), et ce que lit celui qui n'a rien analysé ; note de Nouveautés
    (`"variants": ["play"]`) ; `INVITATION-TESTEURS.md` et la fiche du test si elles donnent la date du 2 décembre.
- [x] **GOLD-a4 — prix 2027** (02/11 00:33) : `PRICE_SCHEDULE = [{ from: '2027-01-01', factor: 2 }]` dans
  `relay/src/costs.js` ; `pricesAt(ms)` multiplie la grille (par défaut ou `MODEL_PRICES`, toujours en prix 2026) et
  le cumul du mois l'applique à la date de chaque appel (décembre ×1, janvier ×2) ; facteur noté dans l'événement
  `start`. Revue des plafonds : Gold 2027 ≈ 2,8 à 8,6 c (pire jour 40 × 8,6 c ≈ 3,4 €, plus 110 Flash-Lite ≈ 3 €) ;
  seuils 15 € / 19 € gardés en euros (vérifiés à chaque appel, dépassement au plus d'un appel) : budget de 20 €
  protégé ; ≈ 190 Gold/mois avant la bascule sur Flash-Lite. `GOLD_DAILY_CAP` 40 et `GOLD_PREMIUM_DAILY_CAP` 20
  inchangés. **À revoir** (GOLD-a4b) dès les premiers abonnés Gold payants : budget et seuils proportionnels aux
  abonnements (décision du propriétaire).
- [ ] **GOLD-b** (après le polissage des textes) Silver = abonnement actuel ; Gold = nouveau produit Play 10 €/mois,
  20 analyses/jour ; annuel et essai Gold à proposer au propriétaire ; paywall et page d'abonnement à deux niveaux ;
  aucun nom de modèle dans la variante play ; confidentialité : Google (Vertex AI, UE). Promesse « moins d'erreurs »
  seulement après le banc CI Nutrition5k (~40 assiettes pesées, CC BY 4.0, images jamais commitées).
  - [x] **GOLD-b0 — choix du propriétaire (P35)** (appliqué sans réponse le 01/11 12:33) : proposition du 01/11 08:33 (`IDEES.md` I205) : Gold mensuel seul
    au lancement (9,99 € ou 10,00 €), annuel à 79,99 € après un mois de vrais coûts Gold, pas d'essai Gold (l'essai de
    14 jours reste sur l'annuel Silver). Sans réponse : appliquer cette proposition (réversible, aucun achat réel).
  - [x] **GOLD-b1 — niveau Gold côté relais** (01/11 12:33) : `halcya_gold` (produit Gold) → `tier: 'gold'`,
    `halcya_premium` → Silver, déduit du `productId` relu chez Google (`entitlementFrom`), jamais de l'app ; période de
    lancement → Gold pour tous ; `tier` dans `/v1/subscription/verify`, dans le cache des droits et dans les crédits.
    Plafond du jour par abonné : 10 en Silver, **20 en Gold** (`GOLD_PREMIUM_DAILY_CAP`) ; plafonds globaux
    (`GLOBAL_DAILY_CAP` 150, `GOLD_DAILY_CAP` 40, 15 € / 19 €) inchangés, donc coût maximal inchangé.
    `INSTALL_DAILY_CAP` (20) égale le plafond Gold : à relever à 25 si un Gold se plaint d'un refus avant 20.
  - [x] **GOLD-b3 — produit `halcya_gold` sur Play** (01/11 13:33) : `PRODUCTS` dans `scripts/play/subscriptions.mjs`
    (Silver `halcya_premium` inchangé, Gold `halcya_gold` : `mensuel` 9,99 €, grâce 7 j + suspension 53 j, sans essai) ;
    fiche « Halcya Gold » (`goldPlayBenefits`, 20 par jour, aucun nom de modèle ni promesse de précision) ; identifiants
    figés contre `relay/src/billing.js` ; **créé par la CI au merge, formule `mensuel` ACTIVE à 9,99 €** (vérifié). Le titre Play de Silver reste « Halcya Premium » (le script ne
    réécrit pas une fiche existante) : à renommer « Halcya Silver » en GOLD-b4 si le paywall dit « Silver ».
  - [x] **GOLD-b4 — paywall et page d'abonnement à deux niveaux** (01/11 14:33) : `playBilling.js` lit Silver et Gold
    (`TIER_PRODUCTS`, figés contre le relais), chaque formule porte `productId` et `tier`, l'achat part sous le bon
    produit, un achat Gold est restauré et revérifié ; `entitlement.js` retient `tier` et `tierName()` (« Silver actif »,
    « Gold actif », « Gold offert pendant le test ») ; paywall : choix Silver / Gold (10 / 20 analyses IA par jour),
    formules du niveau choisi, avantages du niveau, aucun nom de modèle ni promesse de précision (test) ; titre
    « Comprendre vos bons et mauvais jours » (fin de la formule « je note / je comprends », SLOP). Un abonné Silver ne
    voit pas encore de bouton « Passer à Gold » (double facturation : GOLD-b2). Le titre Play de Silver reste
    « Halcya Premium » (visible seulement dans Google Play) : à renommer par l'API si le propriétaire le souhaite.
  - [x] **GOLD-b2 — passage Silver → Gold sans double facturation** (01/11 15:33) : `purchasePlan` relit chez Google l'abonnement Halcya en cours ; Silver en cours + achat Gold → `oldPurchaseToken` + `WITH_TIME_PRORATION` (immédiat, sans débit le jour même, marche aussi depuis l'annuel ou l'essai, contrairement à `CHARGE_PRORATED_PRICE` qui exige la même période) ; Gold en cours → aucun achat Silver (message) ; Google muet → pas d'achat à l'aveugle. Plugin natif : `SubscriptionUpdateParams` (seul ce mode accepté). Page premium d'un abonné Silver : « Passer à Gold · prix / mois ». Relais sans état : l'ancien jeton (expiré) ne donne plus rien, test ajouté. Reste **GOLD-b2b** : Gold → Silver dans l'app (`DEFERRED`), seulement si un abonné le demande ; **P27-bis** au testeur de licence après la période de lancement. Note d'origine : le plugin natif et `playBilling.js` n'achètent
    que `halcya_premium` sans mode de remplacement ; avec un produit `halcya_gold` séparé, un Silver qui monte aurait
    deux abonnements. Passer l'ancien jeton + `CHARGE_PRORATED_PRICE` pour monter, `DEFERRED` pour descendre ; le
    relais déduit le niveau du `productId` actif (ignorer le jeton remplacé via `linkedPurchaseToken`). Tests sur faux
    plugin, puis P27-bis au testeur de licence.
  - [x] **GOLD-b5 — banc Nutrition5k en CI** (01/11 16:33) : route relais `/v1/bench/analyze` (jeton OIDC de
    gh-deployer vérifié par tokeninfo, niveau imposé, plafonds global / minute / Gold du jour / budget du mois
    inchangés, `served` dit si Gold a vraiment répondu) ; `app/scripts/bench/nutrition5k.mjs` (assiettes de 2 à 8
    ingrédients et 80 à 900 g dans un ordre fixe, erreurs masse / kcal / macros avec la table Ciqual de l'app,
    bootstrap apparié, verdict sur masse ET kcal, chiffre = borne basse arrondie à 5 % en dessous, rien sous 10 % ou
    sous 30 paires) ; workflow manuel `bench-gold.yml` (artefact = chiffres seulement).
  - [x] **GOLD-b6 / P36 — affiché le 02/11 21:35** : « Gold estime mieux les quantités » (sans chiffre) sur le paywall Gold, dans l'en-tête Silver/Gold, l'encart « Passer à Gold », la fiche `halcya_gold` (avantage ≤ 40 caractères) ; test `premiumBenefits.test.js`.
  - [x] **GOLD-b6 — banc lancé le 01/11 17:01** (run 41324122596, 1,87 €, 39 paires) : masse −18 % (IC [4,4 ; 20,1] g, net), kcal +2 % (IC [−13,8 ; 11,3], pas net), glucides −18 % (net), protéines −9 % et lipides −8 % (pas nets) → **non confirmé**, aucune promesse affichée ; propriétaire prévenu (P36 : « Gold estime mieux les quantités », sans chiffre, s'il le veut). Relancer le banc si le modèle Gold ou le prompt changent. Énoncé d'origine : après le déploiement du relais de GOLD-b5, déclencher
    « Banc Silver / Gold (Nutrition5k) » sur main (de préférence le soir, il prend les 40 Gold du jour), lire
    l'artefact ; confirmé → afficher la promesse (paywall, fiche Gold, avec le chiffre s'il y en a un) ; sinon →
    prévenir le propriétaire en tête du résumé. Si l'ID token est refusé (droit `getOpenIdToken` manquant pour
    gh-deployer) : action du propriétaire avec la commande gcloud exacte.
  - [ ] **GOLD-b7 (facultatif)** — mesure de la reconnaissance seule : correspondance noms Nutrition5k (anglais) →
    groupes d'aliments, rappel pondéré par la masse ; seulement si la promesse doit nommer la reconnaissance à part.
- [ ] **GOLD-c** (plus tard) Cache explicite de la partie fixe (consignes + liste d'ingrédients, aucune donnée
  d'utilisateur), TTL glissant de 30 min, créé seulement si une autre analyse a eu lieu dans les 30 min ; rentable
  vers 10 utilisateurs actifs ; en cas d'erreur, appel normal.
- [ ] **SLOP-1** (demande du 31/10 vers 21:35, priorité des runs de code après GOLD-a) Relire tous les textes
  visibles (app, onboarding, paywall, notifications, Nouveautés, fiche Play, confidentialité) et réécrire ce qui sonne
  généré ; test qui échoue si une formule bannie revient ; captures avant/après et liste des changements dans le journal.
  - [x] **SLOP-1a** (31/10 23:33) Refrain « une estimation / observation, pas (jamais) un diagnostic » retiré du code
    de l'app (11 fichiers) ; règle dite une fois : onboarding (écran visage), historique du bien-être, rapport PDF
    (encart), conditions et confidentialité (site). `SLOP_WORDING` dans `src/data/wordingRules.js` + test dans
    `wording.test.js` (lignes jointes). Captures `journal/captures/slop-1a/`.
  - [x] **SLOP-1b-1** (01/11 00:33) Accueil et Analyses : « on préfère attendre… faux suspects » (4 écrans dont le
    PDF) et « des liens…, pas des causes » réécrits ; règles ajoutées à `SLOP_WORDING`.
  - [x] **SLOP-1b-2** (01/11 01:33) Repas (rappel de l'envoi IA : sans 🔒 🎙️, « une IA de Google » au lieu de
    « Gemini » en play ; « ✨ » du bouton), onboarding (suivi, premier geste), 9 tirets cadratins (aide Health Connect,
    VFC, visage, éditeur de repas, conseils avancés, diagnostic). Règles : tiret cadratin entre deux mots, emojis
    décoratifs, « sans jamais le remplacer » / « c'est idéal ».
  - [x] **SLOP-1b-3** (01/11 05:33) Journal (rien à changer), Sources (intro, Health Connect, temps d'écran,
    Bluetooth, montre Huawei, guide des montres, Withings), bas de Nutrition ; refrain « jamais chez Halcya » retiré
    de 4 écrans (dit une fois en tête de Sources) ; règles « jamais chez Halcya » et « Astuce : ».
  - [x] **SLOP-1b-4** (01/11 06:33) Paramètres (IA sans « Gemini » en play, carte ventre, abonnement gratuit, avis),
    divulgation `ai_meal` sans nom de modèle, Données (intro, export, import, PDF, suppression). Captures `slop-1b-4/`.
  - [x] **SLOP-1b-5** (01/11 07:33) Onboarding complet : sous-titres des objectifs et des suivis sans énumération par
    trois, écran montre, Health Connect, import et « aha », lecture du visage, premier geste ; « Pas de souci : »
    retiré (2 écrans) et banni par `SLOP_WORDING`. Divulgations de permission inchangées (conformité). Captures `slop-1b-5/`.
  - [x] **SLOP-1b-6** (01/11 09:33 ; I204) Analyses : retirer le pied de page « Hypothèses… pas un avis médical »
    (doublon de l'encart du haut) ; « Comment c'est calculé » avec les vrais libellés « Piste solide » / « À confirmer »
    (test : tout libellé cité existe dans `EVIDENCE`), « jugé bon ou mauvais d'avance » une fois, « habitudes » au
    lieu de « Tags » ; carte verrouillée « Quel aliment, et combien de temps après le repas. » ; sous-titre « Ce qui va
    avec vos meilleurs jours. » ; phrase propre à chaque facteur au lieu de « les jours où c'est plus élevé vont avec… ». Fait : pied de page retiré, méthode avec `evidenceLabel()` (impossible de citer une étiquette absente), « Tags » → « habitudes », refrain « jugé bon ou mauvais » et week-end dits une fois ; cartes : « Le jour même : quand ce chiffre monte, le bien-être est meilleur. » (le titre nomme déjà le facteur) ; 2 règles `SLOP_WORDING`. Captures `slop-1b-6/`.
  - [x] **SLOP-1b-7** (01/11 10:33 ; I204) Réintroduction : « l'app vous dit ce qui passe » une fois (carte premium, avec
    l'exemple « Blé : une portion moyenne passe ») ; intro et entrée raccourcies ; « diététicienne » une fois sur la
    préparation. Paywall : titre « Comprendre vos bons et mauvais jours » proposé pour GOLD-b. Fait : entrée « 3 jours,
    des portions croissantes. », intro en deux phrases, carte premium avec l'exemple seul, `Disclaimer` sans
    « diététicienne » ; règle `SLOP_WORDING` « l'app vous dit ce qui passe ». Captures `slop-1b-7/`.
  - [x] **SLOP-1b-8** (01/11 11:33) Analyses dépliées : phrase des liens « Le jour même : plus haut, meilleur
    bien-être. », « À tester » et solidité en texte (plus en mono), « L'attente joue aussi » retiré des pistes ventre,
    méthode du visage en phrases courtes, « tags » → « habitudes » ; `--open-details` pour les captures ; 2 règles.
  - [x] **SLOP-1b** (terminé le 01/11 11:33 ; paywall réécrit en GOLD-b) Formules toutes faites dans l'app (« pas X, mais Y », « on préfère attendre plutôt que… »,
    « c'est … qui parle »), tirets cadratins dans les phrases, énumérations par trois, emphase, phrases longues :
    inventaire par écran (`grep -rn "—" src/pages src/components`), réécriture écran par écran (Accueil, Journal,
    Analyses, Sources, onboarding, paywall), avec les règles ajoutées à `SLOP_WORDING` au fur et à mesure.
  - [x] **SLOP-1c** (01/11 02:33) Notifications et textes natifs Android : visage arrêté (énumération par trois), montre
    refusée, carte montre restaurée ; Sources (Health Connect qui ne répond pas, détails du visage, caméra refusée).
    `wording.test.js` scanne désormais le Java (chaînes recollées) ; règle « énumération par trois entre parenthèses ».
  - [x] **SLOP-1d** (01/11 03:33) Fiche Play (refrain, « faux suspects », tiret cadratin, « plutôt qu'un score
    unique »), confidentialité (refrain, énumération ; **lecture au déverrouillage ajoutée**, elle manquait),
    conditions (refrain ×2, « pas des causes »), accueil du site. « Diagnostic » une seule fois par page ;
    `SLOP_WORDING` testé sur la fiche, les deux pages et l'accueil du site. Fiche d'abonnement déjà sobre.
  - [x] **SLOP-1e** (01/11 04:33) Nouveautés : 41 phrases de 39 anciennes notes réécrites (refrain, « faux
    suspects », « pas une cause », tirets cadratins, énumérations par trois), 2 phrases de refrain supprimées ;
    `wording.test.js` applique `SLOP_WORDING` à chaque titre et phrase des notes.

## 🚑 Signalement du propriétaire du 05/11 vers 11:45 — Tendances : « Votre bien-être » sans les lectures du visage

- [x] **TENDANCES-VISAGE** ✅ 05/11 12:35 : `WellbeingCharts.jsx` lit maintenant la même série que l'historique du
  bien-être et la carte de l'Accueil (`loadWellbeingTrends` dans `faceMoodData.js` → `wellbeingHistory`, nouvelle
  période `fortnight` de 14 jours, et `day` pour aujourd'hui) ; notes à la main en losanges à part ; légende (estimé,
  noté à la main, fourchette, peu de lectures) ; toucher un point ouvre `ReadingDetail` (exporté de
  `WellbeingHistory.jsx`) ; « Attendu d'après vos habitudes » dit qu'il vient des jours notés à la main et se compare à
  « votre note du jour » (au lieu de « réel »). Règle 5 inchangée (courbes = entrées Y seulement). Tests : 11 dans
  `WellbeingCharts.test.jsx` (dont « montre les lectures du visage même sans aucune note », rouge sur l'ancien code).
  Captures avant / après : `journal/captures/tendances-visage/`. Reste éventuel : point « attendu » sur la courbe.

## 🗣️ Retours du propriétaire du 04/11 vers 19:45 — priorité des runs de code juste après le compte rendu du 02/11
Un run = une étape testable ; les runs « idées » préparent maquettes et études (I218–I220 dans `IDEES.md`).
- [x] **CD-ALPHA-1** (04/11 20:35, retour (1), priorité absolue) Version actuelle du test interne (653e48c, versionCode
  100776) envoyée sur l'alpha par la routine (workflow_dispatch de « Play — AAB », piste alpha) ; nouveau workflow
  « Play — Alpha (livraison continue) » : chaque version de main qui change l'app part sur l'alpha quand les Tests,
  les émulateurs (dont Android 9) et « Play — AAB » sont verts (`scripts/play/alphaGate.mjs`, tests). P42 retirée.
- [x] **CD-ALPHA-3** (05/11 03:35, 🔧) Trou de la livraison continue : un commit de journal poussé juste après une
  version de l'app annule l'émulateur de celle-ci (concurrency sur main), et lui-même n'a pas d'AAB → la version
  (100787, #704) ne partait jamais sur l'alpha. `decideAlpha` reçoit `inherited` (version du test interne + fichiers
  modifiés depuis son commit) : un commit sans AAB reprend la version du test interne si rien de l'app n'a changé
  entre les deux, validée par ses propres « Tests » et émulateurs. 5 tests (`alphaGate.test.mjs`).
- [x] **CD-ALPHA-2** (05/11 19:35) Suivre les examens : 15 envois sur l'alpha en 20 h (100778 → 100811, du 04/11 21:04
  au 05/11 16:36 UTC), chacun relançant l'examen de Google, qui n'aboutissait donc pas. L'API ne donne pas l'état
  d'examen : `decideAlpha` espace désormais les envois (`minHours` 24, `ALPHA_MIN_HOURS` dans `play-alpha.yml`, 0 le
  coupe ; date de la version de l'alpha = date de son commit), raison et `nextAt` au bilan ; passage quotidien à
  07:13 UTC (+ `workflow_dispatch`) pour envoyer la dernière version si aucun push ne le fait ; 5 tests. Dit en tête
  du résumé. Erreur d'envoi = erreur exacte en tête du résumé, rien de contourné. → **CD-ALPHA-4** (si le
  propriétaire voit encore « En cours d'examen » après 48 h sur la même version) : passer à 48 h, ou n'envoyer que
  sur demande pendant le test fermé.
- [x] **CI-OLDWV-1** ✅ 05/11 20:35 (même PR que le run idées ; filtre vérifié sur le logcat réel : 0, et sur un plantage synthétique de l'app : 1) (vu le 05/11 20:35 sur #732, puis sur #735) « WebView trop ancienne (API 28) » compte tout « FATAL EXCEPTION » du
  logcat : l'outil `uiautomator` lui-même (« FATAL EXCEPTION: UiAutomation », Bad file descriptor) a fait échouer le job
  alors que l'app était vivante et la page WebView affichée. Ne compter que les plantages du processus de l'app
  (`Process: fr.jpesquet.sante` / `com.healthtrack.app` dans le bloc AndroidRuntime) dans `.github/scripts/old-webview/check.sh`.
- [x] ✅ 05/11 21:35 **CD-ALPHA-5** (run idées du 05/11 20:35, I222 ; aide Google : délai d'examen compté depuis le dernier changement
  envoyé pour **l'app**) : la porte de 24 h tient compte aussi des derniers `play-listing` et `play-subscriptions` réussis,
  et ces deux workflows attendent eux aussi 24 h après un envoi examiné (report au passage de 07:13 UTC ; alpha à 23:45 Paris depuis CD-ALPHA-6 du 07/11, voir « Publication quotidienne ») ; rien envoyé
  pendant l'examen de la demande de production (P30). Tests dans `alphaGate.test.mjs`.
  → Livré : `reviewGate.mjs` (décision pure, 8 tests) + `reviewIo.mjs` + `review-gate-cli.mjs` ; l'alpha compte les
  derniers envois réussis de la fiche et des abonnements (étape d'envoi réussie, API Actions) ; fiche et abonnements
  n'envoient que si **leur contenu** a changé depuis le dernier envoi (`app/store/` hors `data-safety/`, scripts,
  `premiumBenefits.js`) et 24 h après le dernier envoi examiné ; sinon report au passage quotidien (07:23 et 07:33
  UTC). Gel : `app/scripts/play/review-freeze.json` (`until`), à régler par PR le jour de P30. Hors porte :
  « Play — sécurité des données » (manuel). **CD-ALPHA-6** ✅ (06/11 16:12 UTC : porte franchie, 100841 envoyé sur l'alpha) : vérifier au premier report réel le bilan de la porte (abonnements vérifiés le 05/11 : « rien de neuf », pas d'envoi) ; les passages de la fiche annulés par la file `play-edits` sont rattrapés au passage quotidien.
- [x] ✅ 10/11 09:45 **CD-ALPHA-7** (décision du propriétaire du 10/11 vers 10:15 : « En fait il faudrait faire comme sur apple c'est à dire retirer de la file toutes les versions précédentes à chaque nouveau submit ») : déjà le comportement de Google (chaque envoi remplace la version de la piste ; la validation annule l'examen en cours) ; rendu explicite dans `publish.mjs` (`:commit?changesInReviewBehavior=CANCEL_IN_REVIEW_AND_SUBMIT`, constante `CHANGES_IN_REVIEW_BEHAVIOR`), repli `changesNotSentForReview` inchangé, `publish.test.mjs` adapté, phrase en tête de `reviewGate.mjs`. `listing.mjs` et `subscriptions.mjs` non touchés. Plus aucun gel Alpha sauf demande explicite du propriétaire.
- [ ] **AVIS-RELAIS-1..4** (retour (2), étude I219) ~~relais `POST /v1/feedback` (texte, version, variante ; quotas ; TTL
  à demander)~~ ✅ 04/11 22:35 (`relay/src/feedback.js`, 10 tests, P46 pour le TTL) → ~~formulaire « Votre avis » dans l'app + Sécurité des données + confidentialité~~ ✅ 04/11 23:35 (AVIS-RELAIS-2 : Paramètres, `sendFeedback`, lien d'avant en secours ; Sécurité des données inchangée, « Autre contenu généré par l'utilisateur » déjà déclaré ; confidentialité §« Votre avis ») → ~~workflow de résumé
  anonyme quotidien~~ ✅ 05/11 00:35 (AVIS-RELAIS-3 : route `GET /v1/feedback/digest`, jeton OIDC de gh-deployer, comptes par
  jour, variante, version et 12 thèmes à mots-clés, jamais de texte ; workflow « Votre avis — résumé » chaque jour à
  05:47 UTC ; la routine reporte le bilan dans `journal/AVIS.md`) → AVIS-RELAIS-3b : quand il y a des avis, une phrase
  anonyme par thème (Flash-Lite, sans citation ni donnée de santé) pour pouvoir corriger ou répondre → ~~avis du Play
  Store en lecture (`reviews.list`)~~ ✅ 05/11 17:35 (**AVIS-PLAY-1** : job « Avis du Play Store (comptes) » de
  « Votre avis — résumé », `scripts/play/reviews.mjs`, 10 tests : étoiles, moyenne, versions, Android, thèmes de
  « Votre avis », avis répondus et avis ≤ 3 étoiles sans réponse ; jamais le texte, le nom, l'identifiant ni
  l'appareil ; 403 → geste « Répondre aux avis » ; aucun avis tant que l'app n'est pas en production). Plantages :
  VITALS-1 (P43 faite le 14/11 ; vérifié au « Play — AAB » du 14/11 à 18:20, v1056 : la lecture répond,
  « Aucun plantage ni ANR signalé par Google sur 30 jours »).
- [ ] **VENTRE-BE-1** (retour (3), étude I220) ~~d'ici la réponse du propriétaire : chaque piste dit « Ventre » ou
  « Bien-être » (étiquette pêche / menthe)~~ ✅ 04/11 21:35 (`DomainTag`, Analyses) ; **I220 OUI (propriétaire, 05/11)** :
  → ~~**VENTRE-BE-2** : une note « gêne » ou « douleur » entre dans l'estimation du bien-être comme
  auto-déclaration à poids faible, déclarée dans les entrées de l'estimateur, et le ventre sort des facteurs des pistes
  « bien-être » (test de la règle 5 étendu au ventre) ; parcours « Mon ventre » intact~~ ✅ 05/11 13:35
  (`mood/gutSelfReport.js` : pas de 20 % vers 2 / 5 pour une gêne, 1 / 5 pour une douleur, vers le bas seulement, la
  note la plus forte du jour ; même note sur l'Accueil, l'historique, Tendances et la série Y des Analyses ;
  `gutSelfReport` dans `ESTIMATOR_INPUTS` ; test de la règle 5 : aucune colonne, aucun lien, tag ni effet décalé du
  bien-être, notes ou visage, ne parle du ventre ou des selles ; le ventre n'était déjà pas un facteur, c'est désormais
  verrouillé). → VENTRE-BE-3 (idée) : les selles (Bristol) ne comptent pas dans le bien-être (pas dans I220) ; à
  reproposer seulement si le propriétaire le demande.
- [ ] **ANALYSES-ONGLETS** (retour (4)) ~~sous-onglets Bien-être, Ventre, FODMAP, Tendances (Tendances quitte le
  Journal)~~ ✅ 05/11 01:35 (ANALYSES-ONGLETS-1 : `AnalysesTabs`, route `/recommendations/ventre`, `GutView`, carte de
  l'Accueil vers le bon onglet) → ~~**ANALYSES-ONGLETS-2** : compte à rebours propre à chaque onglet ; encart d'intro de
  l'onglet Ventre en pêche~~ ✅ 05/11 02:35 (`AnalysisCountdown` : Bien-être = jours avec une note de bien-être, seuil
  des liens ; Ventre = jours avec une note du ventre, seuil des pistes repas → ventre) → ~~**ANALYSES-ONGLETS-3** : trois horizons
  (heures, jours, semaines)~~ ✅ 05/11 10:35 (`services/horizons.js`, `Horizon.jsx` : Ventre rangé heures / jours, Bien-être
  sous « Sur quelques jours », « Sur quelques semaines » → Tendances ; 8 tests ; mergée par le run de 11:35, v508) →
  ~~**ANALYSES-ONGLETS-4** : « pistes à tester » et « liens repérés » expliqués en une ligne chacun~~ ✅ 05/11 11:35 (une
  ligne sous chaque titre de l'onglet Bien-être, 1 test) → ~~**VENTRE-SEMAINES** : l'onglet Ventre avait pour « Sur quelques
  semaines » un lien vers Tendances (forme et bien-être seulement) : mélange~~ ✅ 06/11 00:35 (`services/gutWeeks.js`,
  `GutWeeks.jsx` : jours calmes / gêne / douleur par semaine, mêmes chiffres que le rapport PDF, dès 2 semaines notées,
  avant la carte du rapport ; 8 tests) → ~~**ANALYSES-ONGLETS-5** : bien-être à l'échelle des
  heures (visage)~~ ✅ 06/11 01:35 (`services/mood/mealHours.js`, `MealHoursHorizon` : lectures dans les 2 h après un repas contre
  celles à plus de 3 h, même jour, corrigées de la tranche de 3 h ; ≥ 10 jours ; permutation des signes ; 12 tests) → ~~**BE-SEMAINES** : l'onglet Bien-être renvoyait « Sur quelques semaines » vers Tendances (14 jours)~~ ✅ 06/11 02:35
  (`services/mood/wellbeingWeeks.js`, `WellbeingWeeks` : estimé moyen par semaine en barre, notes à part en point, dès 2
  semaines ; 8 tests) → **ANALYSES-ONGLETS-6**
  (idée) : même horizon pour d'autres moments datés (café, alcool, activité finie) si le propriétaire le demande, avec
  Benjamini-Hochberg dès qu'il y a plus d'une comparaison.
- [x] **BE-BIAIS** (retour (5)) ✅ BE-BIAIS-1 05/11 06:35 (recalage de départ : `personalOffset`, dès 3 jours notés, écart moyen note − visage rétréci et plafonné ±2, remplacé par le modèle personnel ; 4 tests) ✅ BE-BIAIS-2 05/11 07:35 (calibration de départ : note du jour demandée dans la carte tant que 3 jours ne sont pas notés, `startCalibration`, 6 tests) ✅ BE-BIAIS-3 05/11 09:35 (expressions comparées à l'habitude des 28 jours : trait et phrase « plus de joie, moins de tristesse » ; fiabilité mesurée sur les notes, jour laissé de côté, `notesAgreement` ; 9 tests). ✅ BE-BIAIS-4 05/11 18:35 (vue Jour : ligne lissée `dayTrend`, σ = 60 min, pondérée par la netteté, rappel vers la médiane du jour ; lectures en points ; affichage seulement, note du jour inchangée ; 6 tests). Énoncé : mesurer le biais (visage neutre lu triste ou méprisant : 42 % tristesse, 11 % mépris
  sur 32 lectures alors qu'il allait bien), recalage personnel, calibration de départ (notes de bien-être demandées les
  3 à 5 premiers jours, la plus courte qui suffit, puis calibration continue), lissage des creux et pics, fiabilité
  affichée honnêtement.
- [ ] **BE-HISTO-DETAIL** (retour (6)) ~~toucher un point de la courbe ouvre la lecture (matrice des émotions, valence,
  éveil, qualité)~~ ✅ 05/11 04:35 (BE-HISTO-DETAIL-1 : `pointDetail` dans `wellbeingHistory.js` — lecture, heure ou jour ;
  colonnes touchables pleine hauteur `data-scrub`, carte « Lecture de 8 h 05 » / « jeudi 22 octobre » avec note,
  fourchette, valence, éveil, grille 4 × 2 des expressions, lectures peu nettes ; 6 tests) → ~~**BE-HISTO-DETAIL-2** :
  remonter le temps (semaine ou mois précédents, flèches ou balayage)~~ ✅ 05/11 05:35 (`viewEnd`, `earliest` dans
  `wellbeingHistory.js` ; flèches « Semaine précédente / suivante » autour du titre « du 23 au 29 octobre », balayage
  horizontal de la courbe, arrêt à la première lecture ou note ; 5 tests). Reste éventuel : vue « Année » (52 semaines)
  si le propriétaire la demande.
- [x] **SELLES-PHOTO** (retour (7)) type de Bristol estimé par photo, dans un endroit dédié et discret (pas sur
  l'Accueil), geste explicite, analyse IA comme les repas, aucune photo gardée par défaut, résultat modifiable, jamais
  un diagnostic ; Sécurité des données et confidentialité à jour. **Étude faite le 05/11 08:35 (`IDEES.md` I221)** :
  ligne « Estimer avec une photo » dans la rubrique Selles du Journal (objectif « Mon ventre » seulement), appareil
  photo direct, rien gardé, 3 formes d'abord, modifiable, fiabilité mesurée sur les corrections de la personne.
  → ~~**SELLES-PHOTO-1** relais : `POST /v1/stool/analyze`, Flash-Lite toujours, schéma `{ visible, bristol, confidence }`,
  une analyse décomptée, journaux sans résultat, tests simulés~~ ✅ 05/11 14:35 (`buildStoolRequest`, `normalizeStool`,
  `STOOL_INSTRUCTION` : forme seule, ni couleur ni sang ; réponse vide ou illisible → `unreadable`, crédit rendu ; 6 tests) → ~~**SELLES-PHOTO-2** app : `analyzeStoolPhoto`, ligne du
  Journal, entrée `stool` + `estimated`/`estimate` (sans migration)~~ ✅ 05/11 15:35 (`services/stoolPhoto.js` relais ou clé
  Gemini, `StoolPhotoLine` en tête de Journal → Jours si `gutCardMode() !== 'hide'`, divulgation `ai_stool`, appareil photo
  direct, forme présélectionnée et modifiable, confidentialité complétée ; 17 tests) → ~~**SELLES-PHOTO-3** fiabilité personnelle~~
  ✅ 05/11 16:35 (`stoolPhotoReliability` : corrections comptées au niveau des 3 formes, dès 5 photos, « Vous avez corrigé
  N estimations sur M. » sous la ligne, « Souvent corrigée chez vous : vérifiez la forme. » au résultat si plus d'une sur
  trois ; marque « · photo » dans le Journal ; rapport PDF « Dont N estimées par photo, puis vérifiées par la personne. » ;
  la ligne lit elle-même les 200 dernières notes de selles, le Journal n'en chargeant que 3 jours ; 7 tests). Retour (7)
  traité.
- (8) Journal, Sources, Nouveautés, Données, Paramètres et Confidentialité : le propriétaire en est content, ne pas
  les remanier sans raison.

- [x] **PISTES-UN-COMPTE** (06/11 03:35, revue C1 sur données vierges) Accueil « 21 jours » contre onglet Ventre « 28 jours » : un seul compte, celui des notes du ventre quand la carte ventre est montrée ; jours avec un repas, sans ventre, sinon (`PistesTeaser`, 2 tests).
- [x] **POL-PLAY-VENTRE-BIENTOT** (06/11 03:35 → livré 04:35) onglet Ventre vierge : le bloc « Bientôt / Rapport PDF pour mon médecin · dès votre 1re note du ventre » (phrase en mono) devient une phrase discrète en Figtree, « Le rapport PDF pour votre médecin arrive avec votre première note du ventre. » ; `soonLines` perd ses deux lignes propres au ventre (code mort après ANALYSES-ONGLETS-2) ; 2 tests adaptés.
- [x] **VISUAL-FLAKY-1** (06/11 03:35 → livré 05:35) `npm run visual -- --play --empty --routes=/` échouait environ 1 fois sur 4 (`page.goto` : délai de 20 s en attendant « networkidle ») → `scripts/visual/navigate.mjs` `gotoRoute` : `load`, réseau au repos au mieux (5 s, sans échec), rendu de `#root`, un nouvel essai ; 5 tests ; 6 passages sur 6.
- [x] **COUNTDOWN-LIEN** (06/11 06:35, revue C1 sur données vierges) le compte à rebours des onglets Bien-être et Ventre d'Analyses dit « Notez … depuis la carte de l'Accueil » : « la carte de l'Accueil » est un lien vers `/` (`AnalysisCountdown`, 2 tests étendus). VISUAL-FLAKY-1 mergée (#746) au même run.
- [x] **WEEKS-MIDLINE** (06/11 07:35, revue C1 sur données de démo) « Sur quelques semaines » (onglet Bien-être) : repère 2,5 / 5 en pointillé, lu comme la moyenne de l'historique → trait plein `--chart-bar-2` (`Horizon.css`, `wellbeingWeeksMidline.test.js`).
- [x] **KEEP-WHOLE** (06/11 10:35, revue C1 `--play --empty --dark` à 360 px) « Vos pistes du bien- / être arrivent dans 5 jours » coupé au trait d'union → `utils/keepWhole.jsx` (span insécable autour des mots composés, texte inchangé) dans `AnalysisCountdown` et `PistesTeaser` ; 3 tests + test d'Analyses par rôle `heading`.
- [x] **KEEP-WHOLE-2** (idée, close sans code le 06/11 11:35) Tendances vierge : « Ajouter une montre » en lilas. `PastelTiles` fixe lilas = sources (comme « Ajouter une source » du Journal vierge) : changer cette seule tuile casserait la règle.
- [x] **EDGE-FLAKE** (06/11 12:35 ; `.github/scripts/edge-insets/check.mjs`) Émulateur « Bord à bord (API 34) » rouge sur main `cb3ee5d` (« undefined px », logs natifs justes) ; 9 échecs sur ~35 depuis le 27/10 (WebView inaccessible, undefined, 0 px), ce qui bloque la livraison continue vers Alpha. L'app est relancée jusqu'à 3 fois avant de conclure ; une régression (0 px à chaque lancement) reste rouge ; le résumé liste chaque lancement.
- [x] **KEEP-WHOLE-3** (06/11 11:35, revue C1 `--play` démo à 360 px) cartes « Autres liens repérés » : « Le jour même : plus haut, meilleur bien- / être. » → `keepWhole` sur le nom du lien et la phrase de `CorrelationCard`, `TagEffectCard`, `LaggedEffectCard` ; assertion ajoutée au test des corrélations.
- [x] **KEEP-SEGMENTS** (06/11 13:35, revue C1 `--play --dark --size=360x780 --font-scale=1.3`, 17 pages ok) rond radio de « Tout comprendre de mes données » écrasé quand le libellé tient sur deux lignes → `flex-shrink: 0` (`.theme-choice input`, `.paywall-plan input`, test-garde `choiceRadioShrink.test.js` avec l'onboarding) ; lignes mono « 33 lectures · 7 jours · 6 notes / à la main » (historique) et « analyse sur 75 jours notés · 76 / jours de données » (Analyses) → `keepSegments` (coupure aux seuls points médians) ; au passage « 1 jour notés » → « 1 jour noté ». 2 tests + test de l'historique adapté.
- [x] **GUT-STACK** (06/11 14:35, revue C1 `--play --empty` clair à 360 px, police ×1,3) carte « Votre ventre » : « Calme » et « Douleur » rond au-dessus, « Gêne » à côté (aussi en police normale à 320 px) → `hooks/useStackedChoices.js` (mesure par ResizeObserver, rangée `gut-choices--stacked` en bloc), `GutChoiceRow` ; 4 tests ; 15 combinaisons largeur × police vérifiées.
- [x] **REVUE-320** (06/11 15:35, revue C1 `--play --size=320x700`, démo, clair) Analyses : les sous-onglets « Bien-être · Ventre · FODMAP · Tendances » débordaient de 24 px (page qui glisse de côté, 4 pages) → `TabBar.css` sous 340 px (écart et marge 3 px, 14 px) + filet `flex-wrap` ; `visual-check.mjs` nomme le coupable d'un débordement horizontal.
- [x] **VENTRE-COLONNE** (06/11 19:35, revue C1 `--play --size=320x700 --font-scale=1.3`, démo, 17 pages) carte « Votre ventre » : même empilé (GUT-STACK), « Douleur » dépassait son cadre (contrôle « TEXTE QUI DÉBORDE ») → `choiceLayout` (`row` / `stacked` / `column`) mesuré sur la largeur de la rangée, `gut-choices--column` (un choix par ligne, rond à côté du mot) ; « Noter moi- / même » coupé au trait d'union → `keepWhole` (carte Bien-être et historique). 4 + 1 tests ; 360 px police normale inchangée (rangée).
- [x] **REVUE-320-VIERGE** (06/11 21:35, revue C1 `--play --empty --size=320x700 --font-scale=1.3`, clair, 17 pages ok) onboarding, premier écran : « envoyé / à / Halcya / sans / votre / accord », un mot par ligne dans trois colonnes inégales → `hooks/useNarrowBox.js` (largeur de la boîte en rem, la grande police compte comme un écran plus étroit ; sous 16 rem, `onb-tiles--stacked` : un repère par ligne, chiffre à gauche) ; 2 tests du crochet + 2 de l'onboarding ; taille A56 inchangée (trois colonnes).
- [x] **NAV-LIBELLE-320** ✅ 09/11 03:35 : libellés en `min(1em, …cqi)` (barre du bas et sous-onglets), contrôle visuel qui voit les libellés coupés par « … » ; test `tabLabelsFit` ; captures `runs/captures/2026-11-09-0335-onglets-320-*.png`. (idée, vue au même run) barre du bas à 320 px en police ×1,3 : « Aujourd'… » coupé par une ellipse (les trois autres tiennent). Pistes : libellé « Accueil » seulement sous 16 rem (même crochet), ou taille de police du libellé bornée ; à trancher sans toucher aux autres tailles.
- [x] **GRANDE-POLICE-1** ✅ 09/11 05:35 (bandeau d'ajout : largeur minimale d'une case `max(68px, 4.25rem)`, 68 px inchangés en taille normale ; « + 1 cigarette » passe à la ligne ; contrôle visuel mesuré sur les lignes de texte ; option `--scroll-end` ; captures `runs/captures/2026-11-09-0535-bandeau-grande-police-*.png`) (½ livrée 09/11 04:35 : tuiles du Journal, `chipValueBreaks` + valeur en `min(0.8rem, 15cqi)`, tests, captures `runs/captures/2026-11-09-0435-tuiles-grande-police-*.png`) (vu le 09/11 03:35, police ×1,3) Journal › Jours, format A56 : les valeurs des tuiles se
  coupent en plein mot (« 2 285 kca / l », « 37, / normal », « 68 à / 82 bpm ») : couper entre nombre et unité
  (espaces insécables) ou passer la valeur sous le titre sans césure. À 320 px : « Digestion » collé au bord de sa
  pastille (bandeau d'ajout) et « + 1 cigarette » déborde.
- [x] **REVUE-320-SOMBRE** (06/11 16:35, revue C1 `--play --empty --size=320x700 --dark`) paywall : « · » orphelin en fin de ligne → liens en flex sans séparateur ; onboarding : « 1 geste » sur une ligne (`nowrap`, 0.88rem sous 340 px).
- [x] **REVUE-320-SOMBRE-2** (06/11 17:35 : l'entrée « fuseau du jour » était écrite deux fois par deux écrans en même temps, et comptée comme une saisie ; verrou + compte sans `context` ; Journal vierge : « Rien de noté » d'abord. Reste « 2,50 € par / mois » à 320 px, lisible) Données vierges : « 2 entrées et votre profil » après le passage de l'outil de captures sur Accueil, Journal, Tendances, Repas, Nutrition. Trouver qui écrit ces 2 entrées ; si c'est l'app sans geste de l'utilisateur, le dire ou l'éviter. Aussi : Journal vierge, lien « Selles » avant « Rien de noté » ; paywall « soit 2,50 € par mois » sur deux lignes à 320 px.
- [x] **REVUE-320-PRIX** (06/11 18:35, reste de REVUE-320-SOMBRE-2) paywall à 320 px : « soit 2,50 € par / mois » → « soit 2,50 € » puis « par mois » (espaces insécables) ; en police ×1,3, « 29,99 € / » / « an » → « / an » entier. Test dans `Premium.test.jsx`.
- [x] **IOS-BETA-0611** (06/11 18:35) Décision du propriétaire du 06/11 vers 18:20 (surveiller l'examen bêta d'Apple, lecture seule) reportée en tête de `POUR-IOS.md`.
- [ ] **CI-OLDWEBVIEW-1** (05/11 05:35, à valider par le propriétaire) : le job « WebView trop ancienne (API 28) »
  compte tout `FATAL EXCEPTION` du logcat, y compris un plantage de l'outil `uiautomator dump` (thread UiAutomation,
  vu sur la PR #709), ce qui peut bloquer un envoi Alpha par hasard. Proposition : `grep -A1 "FATAL EXCEPTION" | grep -c
  "Process: $PKG"` dans `.github/scripts/old-webview/check.sh`. Le push de ce changement a été refusé par le garde-fou
  de la session : à faire seulement sur accord explicite (« CI-OLDWEBVIEW-1 oui »).

## 🧪 Test fermé en cours (J = 03/11, glissé au 06/11 au plus tôt)
- [x] **IOS-ASC-0511** (05/11 23:35) Décision du propriétaire du 05/11 vers 23:00 (App Store Connect) reportée en tête de `POUR-IOS.md` ; Mac / Vision Pro : photos par `<input type=file capture>` (sélecteur de fichiers sans caméra), visage et HealthKit côté iOS.
- [x] **UNTIL-J08** (08/11 12:35) `until` = `2026-12-02T23:00:00Z` : J fixé au 08/11 par le propriétaire (invitation le jour même) ; texte d'invitation à jour ; service du relais vérifié au déploiement (voir le compte rendu).
- [x] **UNTIL-J06** (05/11 22:35) `until` recalé au `2026-11-30T23:00:00Z` (J = 06/11 : Alpha encore en examen) ; à redécaler si le propriétaire invite plus tard (vérifier au bilan du déploiement du relais). — idée du 03/11 08:35 (`IDEES.md` I212)
- [x] **TEST-PISTES** (03/11 09:35) Bilan de « Play — AAB » : tableau « État des pistes Google Play » (version et état de
  chaque piste, lecture seule, edit abandonné) pour suivre la version des testeurs à chaque envoi.
- [x] **VITALS-1** (03/11 12:35) Bilan de « Play — AAB » : plantages et ANR d'Android vitals (`scripts/play/vitals.mjs`, `errorIssues:search`, lecture seule, jeton `playdeveloperreporting` à part, étape `continue-on-error`) : la routine voit enfin les plantages avant de choisir une version Alpha. Si l'API n'est pas activée, le bilan donne la commande du propriétaire (P43).
- [x] **NOTES-VARIANTES** (04/11 04:35) Notes de version Play : `buildReleaseNotes` écarte les Nouveautés dont `variants` exclut `play` (même règle que `changelogFor`), test dans `publish.test.mjs`.
- [ ] **TEST-ALPHA-1** (jour 4–5, 07–08/11) : une version alpha avec les premiers retours des testeurs (ou les
  correctifs trouvés d'ici là), notes de version qui citent le retour ; ligne dans `PRODUIT.md` §4 bis ; envoi par la CI (CD-ALPHA-1, plus de clic P42).
- [ ] **TEST-RETOURS** (jours 4, 8, 11 : 07, 11, 14/11 ; idée du 04/11 08:35, `IDEES.md` I215–I217) : à chaque consigne « RETOURS TESTEURS », ranger chaque retour en POL-PLAY (bug / texte confus / idée), corriger par impact, tenir « Changements faits pendant le test fermé » (`PRODUIT.md` §5, question 9) ; TEST-ALPHA-2 doit en contenir au moins un, dit dans sa note de version Play. Jour 12 : rapport de pré-lancement collé par le propriétaire (pas d'API).
- [x] **PLUGIN-API** (04/11 09:35, 🚑) **Plantage à l'ouverture sous Android 8 à 12 depuis le 15/10 (#162)** : `CompanionPlugin.finish(PluginCall, AssociationInfo, String)` ; Capacitor lit toutes les méthodes des plugins au démarrage (`Plugin.initializeActivityLaunchers` → `getDeclaredMethods`), `AssociationInfo` (API 33) → `NoClassDefFoundError`. Corrigé (identifiant `int`), verrou `src/pluginSignatures.test.js` (types récents interdits dans les signatures de premier niveau des plugins), job API 28 bloquant. Alpha 100721 touchée → P42 avancé.
- [x] **PLUGIN-API-2** (statique 04/11 11:35 : Lint `NewApi` ; dynamique 04/11 12:35 : job « Méthodes natives sous Android 12L (API 32) », `native-sweep/check.mjs`, 9 écrans + 17 méthodes natives, aucun plantage ; l'image API 31 n'a que la WebView 91) Les corps de méthodes natives appelés depuis le JS (API 29–33 sans test de version) ne sont pas couverts par le job API 28 (WebView trop ancienne, le JS ne tourne pas) : ajouter un job API 30 ou 31 avec une WebView ≥ 93 (image `google_apis` récente ou WebView installée) qui parcourt l'onboarding et les Sources ; en attendant, relire les `Build.VERSION.SDK_INT` des plugins appelés au premier lancement (Health Connect, montre, notifications, visage).
- [x] **WEBVIEW-MIN** (04/11 09:35) Téléphones Android 8–9 à WebView non mise à jour : Capacitor n'exigeait que la WebView 60 et chargeait l'app sans page d'erreur (écran blanc dès `Object.hasOwn`, Chrome 93). `minWebViewVersion` 93 + page `webview-ancienne.html` + test-garde des fonctions récentes (table version Chrome) + job émulateur API 28. Si une fonction plus récente entre dans le code, le test demande de relever le minimum (ou d'éviter la fonction).
- [x] **FONT-SCALE-1** (04/11 14:35) Grande taille de police d'Android : `npm run visual -- --font-scale=1.3` ; 2 défauts
  corrigés à 360 px (bouton météo des Sources hors de sa carte, « Douleur » collé au bord sur l'Accueil).
- [x] **FONT-SCALE-2** (04/11 15:35 : mesure ajoutée au job émulateur API 32, `native-sweep/check.mjs`, avertissement seulement. **Résultat sur #689 : la WebView suit la police du système, lignes ×1,30 à `font_scale` 1,3 ; titres 19,2 → 25 px ; aucun débordement sur Accueil, Sources, Paramètres**) Confirmer sur l'émulateur (`settings put system font_scale 1.3`) que la WebView suit la police du
  système ; ajouter `--font-scale=1.3` à l'audit de chaque version candidate (TEST-ALPHA-1 et 2).
- [x] **IOS-NOTES-29-10** (04/11 16:35) Demandes iOS du 29/10 : `sources-titre` en `["play", "sideload"]`, stress de la montre sorti de `repas-actions` dans sa propre note Android ; badge « Nouveau » des Nouveautés recalé sur `--mint-label` / `--mint-bg` (4,16 → ≥ 4,5:1).
- [ ] **TEST-ALPHA-2** (jour 9–10, 12–13/11) : seconde version alpha, en ligne avant le jour 12 ; envoi par la CI (CD-ALPHA-1).
- [x] **FIN-LANCEMENT-1** (03/11 21:35 ; `IDEES.md` I213) LIVRÉ : `LaunchEndCard` + `launchEndNotice()` ; lien « Voir ce que comprend Gold » (pendant la période, /premium n'affiche pas de prix) ; `launch.lastUntil` déjà retenu (`halcya_launch_last_until`) pour FIN-LANCEMENT-2 ; capture `--launch-ends-in=2`. Spécification d'origine : carte Accueil fermable à partir de `launchUntil` − 3 j :
  « Gold offert jusqu'au … Ensuite, le journal, les montres, le bien-être estimé et l'export restent gratuits. » +
  « Voir les formules ». Une fois par valeur de `until` ; coupée pour l'App Store (drapeau) ; tests jsdom à horloge
  simulée, `SLOP_WORDING` étendu, captures `--play` clair/sombre.
- [x] **FIN-LANCEMENT-2** (03/11 22:35) LIVRÉ : `launchEndedNotice()` (une fois par date de fin, jusqu'à 30 jours après, jamais avec un premium actif ni sur iPhone), même `LaunchEndCard`, capture `--launch-ended=2`. Spécification : au premier lancement après la fin, une seule fois : « Le test est
  terminé. Merci ! Vos données restent sur votre téléphone, rien n'est effacé. » + « Voir les formules ». Garder
  `launch.lastUntil` pendant la période (le relais ne renvoie plus `launchUntil` après). Note Nouveautés `play`.
- [x] **FIN-LANCEMENT-MSG** (26/11 12:30 : **message E** dans `INVITATION-TESTEURS.md` § 4, à envoyer par le
  propriétaire le 29 ou le 30/11 au groupe : Gold offert jusqu'au 2/12, prolongé au 27/12 pour qui a analysé un repas
  (P44), ce qui reste gratuit, prix et essai vérifiés dans le code, et surtout « restez inscrits » ; à réécrire si
  `until` est prolongé) (vers le 24/11) : message du jour ~21 dans `INVITATION-TESTEURS.md` §4 (fin de Gold
  offert, ce qui reste gratuit, essai de 14 jours) ; selon la réponse à P44 (merci aux testeurs).
- [ ] **TEST-REFUS** : si Google refuse P30, recaler `until` = jour du refus + 14 + 10 jours (sous réserve de l'accord
  du propriétaire, demandé dans le résumé du 03/11) et relancer les messages de mission.

## 🎯 Version candidate avant les testeurs (décision du 22/10 19:15 ; critères dans `PRODUIT.md` §2 bis)
**Retours et décisions du propriétaire du 24/10 13:30–14:30 (session guidée sur la version play) — avant M6b et M7, dans cet ordre :**
- [x] **CRÉDITS — FAIT le 24/10 14:30** : compteur premium revenu à 10 après une analyse (13:38 → 14:11). Cause : le
  registre des crédits ne vivait qu'en mémoire et le plafond premium du jour n'était pas dans l'état `X-Credits`
  renvoyé par l'app ; Cloud Run a arrêté l'instance (zéro instance au repos) → compteur du jour perdu. La
  réinstallation n'y est pour rien (identifiant d'installation restauré par la sauvegarde Android). Corrigé : registre
  durable Firestore (P24), relu une fois par instance, réécrit à chaque crédit pris ou rendu, panne non bloquante.
  **Reste ouvert** : réinstallation *sans* sauvegarde → nouvel identifiant → 10 crédits offerts de nouveau (abus borné
  par `INSTALL_DAILY_CAP` et le plafond global) ; piste : `deviceRecall` de Play Integrity ou empreinte d'appareil
  du verdict, à étudier par un run « idées ».
- [x] **SOURCE-IA — FAIT le 24/10 14:30** : carte de résultat « Analyse IA · une estimation », nom du modèle sous « détails ».
- [x] **6f — Période de lancement (P23 ② seule) — LIVRÉ le 24/10 15:30** : `relay/src/launch-period.json` (`from`,
  `until`, `off`) embarqué dans l'image du relais, variables `LAUNCH_PREMIUM_FROM/UNTIL/OFF` prioritaires ;
  `isLaunchPeriod` respecte le début (pas avant la version candidate), la fin exclue et l'interrupteur (tests) ; le
  résumé du workflow relais affiche l'état et la réponse du relais à une installation sans achat. App : page Premium
  et dernier écran de l'onboarding « Premium offert pendant le test » (« jusqu'au …, vous n'avez rien à payer »),
  sans formule, achat ni restauration ; paywall intact à l'échéance (tests). Texte d'invitation et gestes de
  prolongation / coupure : `journal/INVITATION-TESTEURS.md`. **Reste** : écrire `from` / `until` le jour où la version
  candidate part en alpha (fichier vide aujourd'hui → aucune période), puis C5 ✅ après vérification sur la version play.
  Idée : exclusion d'une seule installation (le propriétaire) au lieu de `off` global, pour retester l'abonnement
  sans retirer le premium aux testeurs.
- [x] **SAUV — LIVRÉ le 24/10 16:30** (règles `data_extraction_rules` / `backup_rules`, repère hors sauvegarde +
  `restoreGuard.js` qui retire les secrets du localStorage après une restauration, textes honnêtes, Sécurité des
  données inchangée — raisonnement dans PLAY-CONFORMITE §5). **À tester par le propriétaire** à la prochaine
  réinstallation : données revenues, montre à réappairer (PIN), clé Gemini (sideload) à ressaisir, premium revenu seul.
  ✅ (28/10 04:33) Reste ouvert traité : l'auto-synchro ne réappairait rien (clé retirée → `not_paired`), mais la carte
  disait encore « Connectée » et la synchro s'arrêtait en silence → état `restored` posé par `restoreGuard`
  (`markWatchRestored`), « À reconnecter » + « Reconnecter ma montre » (PIN au geste), automatique en pause.
  Texte d'origine : (a) textes honnêtes (confidentialité, onboarding (a) textes honnêtes (confidentialité, onboarding
  « 0 Mo envoyé sans votre accord », Paramètres → Données, conditions : données incluses dans la sauvegarde Google du
  téléphone si activée, chiffrée, gérée par Android, jamais lue par Halcya) ; (b) règles Play / Sécurité des données
  (la sauvegarde Android chiffrée de bout en bout n'est en principe pas une « collecte » — à vérifier sur la page
  d'aide), puis P21 à relancer ; (c) `data_extraction_rules` (Android 12+) et `full_backup_content` qui excluent
  clés de session et d'appairage de la montre, clé Gemini (sideload) et jetons, avec test ; (d) restauration sur un
  nouveau téléphone : montre à réappairer proprement, identifiant d'installation (à garder : il porte les crédits).
- [x] **INTEGRITY-BILAN — LU le 24/10 15:00** : 1 jeton réel, `passed` (l'analyse du propriétaire de 13:38) ; 12
  `missing` (CI, vieilles versions). `enforce` plus tard, quand quelques testeurs auront envoyé des jetons.
- [x] **CREDITS-LOG — FAIT le 25/10 15:33** (étape « Registre des crédits (Firestore, non bloquant) » de `relay-deploy.yml`, échecs des 10 dernières minutes et des 7 derniers jours) : le workflow relais compte les `credits_store_failed` après le test d'analyse (preuve que
  relay-runtime écrit bien dans Firestore) et l'écrit dans son résumé.
- [x] **PLAY-COMPLETED — VÉRIFIÉ le 25/10 15:33** (run « Play — AAB » 85 : versionCode 455 « Déployée auprès des testeurs internes », statut completed ; plus aucun geste « brouillon » dans le résumé) : vérifier par l'API que chaque version play arrive en test interne avec le statut
  `completed` (l'app a passé son premier examen le 23/10) et retirer du résumé les gestes « version restée en brouillon ».
- [ ] **IAM** : P29 proposé (ex-P28, renuméroté le 24/10 15:30 ; P28 = déclaration FGS) (retirer `roles/editor` du compte Compute par défaut, inutilisé par le relais et la CI).

**Polissage du parcours — retours du propriétaire du 24/10 vers 15:00 (PRIORITÉ des runs de code, avec SAUV, avant
M6b, M7 et le jalon 5).** Principe : simple à première vue, détails pour qui creuse ; moins de texte, plus visuel, pastels
par thème ; rien d'empilé sans hiérarchie. Un run = une étape, captures clair/sombre, vierge/démo ; masquer n'efface rien.
- [x] **POL-3 — FAIT le 24/10 18:30** (chevron partout, détails visuels, « Noter moi-même », plus de demande à
  l'ouverture). Énoncé d'origine : remplacer le bouton « simple / détails » par un geste propre (toucher la carte →
  historique, ou chevron discret), partout où il existe (ventre, pistes, paywall…) ; détails visuels (mini-graphique,
  badge de confiance) ; ajout manuel du bien-être discret dans la carte ; supprimer la demande automatique de bien-être
  à l'ouverture.
- [x] **POL-2 — FAIT le 24/10 19:30** : les deux modèles sortent 8 scores d'expression + valence + éveil ; les 8
  probabilités sont désormais gardées par rafale (`exAnger`…`exSurprise`, Java testé) ; page **« Historique du
  bien-être »** (`/bien-etre`, lien « Historique › » de la carte) : Jour / Semaine / Mois, courbe (fourchettes par
  lecture en Jour, jours « peu de lectures » creux), notes à la main en losanges, puis « Ce que lisent les modèles »
  (valence, éveil, expressions). Suites possibles : phrases de qualité du jour (cadrage, lumière) dans la vue Jour ;
  utiliser les expressions dans l'estimateur seulement si une validation le justifie.
- [x] **POL-4 — FAIT le 24/10 17:30** Carte ventre seulement si « Mon ventre » choisi (`gutCardMode` ; sans objectif :
  ancienne installation → si le ventre est noté, onboarding passé → affichée), texte du réglage adapté ; rien d'effacé.
- [x] **POL-5 — FAIT le 24/10 17:30** Boutons de l'Accueil : « Photo du repas » pleine largeur avec icône appareil
  photo, « Ajouter une note » (crayon) en secondaire.
- [x] **POL-6 Journal — FAIT le 25/10 00:30** : « Vos derniers jours » en pastels par thème (tuiles et saisies) ;
  Tendances : graphiques pas encore actifs regroupés dans une ligne « Bientôt » (`SoonList`, partagé avec Analyses).
- [x] **POL-7 Onglet « Analyses »** (ex-Pistes) — **FAIT le 24/10 23:30 (7c : un verdict par facteur, « Autres liens repérés » fusionnés, « Voir N autres liens », émojis retirés)** — **7a FAIT le 24/10 21:30** (onglet renommé, une seule vue, « Bientôt »,
  méthode unique en pied de page avec le modèle de prédiction) ; **7b FAIT le 24/10 22:30** (pistes dépliables :
  phrase d'abord, statistiques au chevron ; barres neutres lilas ↑ / ↓ ; écarts des habitudes sans rouge) ; **reste 7c** :
  un facteur = un verdict (visage + notes + habitudes fusionnés, le plus solide gagne), « Voir N autres liens », émojis
  retirés des titres d'habitudes. Spécification d'origine : une seule analyse (fin de simple / avancée), « Comment c'est
  calculé » en tout petit en bas, blocs sans assez de données en une ligne « arrive dans N jours », hiérarchie claire.
  **Maquette prête : `IDEES.md` I163** (un facteur = un verdict, ≤ 3 pistes dépliables, « autres liens » fusionnés,
  ligne « bientôt », méthode unique en pied de page ; aucun calcul ni seuil ne change).
- [x] **POL-8 Sources** — **FAIT le 25/10 01:30** (carte Huawei seulement si appairée ou app Huawei / Honor Santé installée ; « Ajouter une source » ; « Mes appareils » masqué si vide ; outils techniques de la montre seulement après un échec ou en mode diagnostic ; chevron de `MethodNote`) : détection automatique (Health Connect et ses écrivains, montre Huawei appairée / à proximité),
  carte Huawei seulement si détectée, bouton « Ajouter une source », météo / écran / sommeil / visage par défaut ;
  diagnostic technique seulement en mode diagnostic caché ; aucune carte à identifiant de développeur en play.
  **Maquette prête : `IDEES.md` I164** (Huawei = paquet Huawei Health installé ou montre appairée, pas de scan
  Bluetooth ; « Ajouter une source » ; corriger au passage le « Détails » orphelin des cartes Visage / Météo / Écran).
- [ ] **POL-1 Lecture au déverrouillage aussi en play** (décision du propriétaire, risque connu) : divulgation, geste
  explicite, notification permanente avec « Arrêter », réglage, service démarré app ouverte, ni exemption batterie ni
  Shizuku/ADB en play, interrupteur de build propre à play ; P28 (déclaration FGS + script vidéo) AVANT la première
  version qui la contient ; `PLAY-CONFORMITE.md` à mettre à jour ; sideload inchangé.
  **P28 préparé le 24/10 20:30** (`PLAY-CONFORMITE.md` §1 bis : cahier des charges, texte, script vidéo) ; POL-1 doit
  aussi produire un APK d'aperçu play interrupteur allumé (`applicationIdSuffix ".apercu"`) pour la vidéo.
  **POL-1a FAIT le 25/10 02:30** (natif + CI, interrupteur coupé) : `-PfaceUnlockPlay` / `-PplayPreview`,
  `FACE_KEEPALIVE`, manifeste `src/playFaceUnlock` (parité testée), préférence `unlock` distincte de `enabled`,
  `stopUnlock`, notification d'importance basse en play, APK d'aperçu en artefact `halcya-apercu-deverrouillage`.
  [x] **POL-1b FAIT le 25/10 02:33 CET** (app) : interrupteur « Aussi à chaque déverrouillage » si `unlockAvailable`,
  divulgation `camera_unlock`, notifications demandées après le démarrage, « en pause » + « Reprendre » (aucune reprise
  automatique), pas de Shizuku / batterie en play ; `--face-unlock=off|on|paused` dans `npm run visual`.
  [x] **POL-1c FAIT le 25/10 03:33 CET** : bloc « Lecture au déverrouillage » de Paramètres (play + `unlockAvailable`
  seulement) : interrupteur qui coupe (actif ou en pause) ; coupée → lien vers Sources (allumage seulement derrière
  la divulgation) ; [ ] P28 par le propriétaire
  (APK d'aperçu prêt) ; [ ] allumer l'interrupteur dans « Play — AAB ».
  [x] **FLAKY-UPDATEBANNER** (26/10 21:33 ; réparé par #448 le 28/10, coché le 28/10 06:33) : `UpdateBanner.test.jsx` « montre la progression en Mo et en %, puis ouvre
  l'installateur » a échoué une fois en CI (progressbar introuvable, 3 s) sur une PR de journal seul : le rendre
  indépendant du temps (faux minuteurs ou attente explicite).
  [x] **P28-VERSIONCODE (27/10 15:17 : le propriétaire a publié `p28-100487` en test interne)** — 27/10 15:34 :
  « Play — AAB » envoie versionCode 100000 + n (versionName = n), brouillon P28 50000 + n ; interrupteur rallumé
  (test interne) ; [ ] « P28 faite » par le propriétaire.
  [x] **P28-INTERNE (27/10 13:30 : le brouillon ne suffit pas)** — 27/10 13:33 : « Play — AAB » allume l'interrupteur
  pour le test interne (`FACE_UNLOCK_INTERNAL`, versionCode normal, seul le propriétaire vérifié, alpha jamais
  allumée) → **refusé** (403 « You must let us know whether your app uses any Foreground Service permissions. »),
  interrupteur recoupé ; [ ] rallumer (`FACE_UNLOCK_INTERNAL: "true"`) dès que le propriétaire a envoyé la déclaration.
  [x] **P28-BROUILLON (demande du 26/10 20:40 : la ligne « Autorisations des services de premier plan » n'apparaît
  pas dans Contenu de l'app)** — 26/10 21:33 : workflow « Play — brouillon P28 » (`play-p28-draft.yml`, workflow_dispatch
  sur main) : AAB play signé avec `-PfaceUnlockPlay=true`, versionCode 100000 + n, brouillon `p28-<n>` sur la piste
  interne (jamais déployé, versions en place gardées) ; `publish.mjs` : option `draft` + brouillons `p28-*` gardés par
  les envois normaux (repli : version seule si Play refuse). Envoyé : `p28-100487` (brouillon accepté sans erreur, 26/10 ~22:05). [ ] confirmer que la ligne apparaît (propriétaire) ; si
  non : version en test interne (propriétaire seul), puis POL-1d.
  [x] **P28-VIDEO (demande du 26/10 15:00 : la vidéo est faite par la CI)** — 26/10 15:46 : workflow
  « Play — vidéo P28 » (`p28-video.yml` + `.github/scripts/p28-video/`) : APK d'aperçu, émulateur API 35, pilotage
  DevTools de la WebView + vrais appuis adb, preuve système de chaque plan, artefact `p28-video` ; publication sur
  main par release pré-version `p28-video` + `pages.yml` → https://spreadzenox.github.io/HealthTrack/p28/. Caméra
  frontale émulée (mire) : v4l2loopback impossible sur les runners. Reste : film entièrement vert (PR #398), merge,
  lancement manuel sur main, relecture des images extraites, lien dans le résumé.
  26/10 17:33 : AVD pixel_6 créé par l'action + écran 720 × 1560 à 257 ppi (449 dp comme l'A56), notification
  dépliée sur sa propre ligne, ffmpeg statique ; un film de 106 s complet jusqu'au déverrouillage (plans 1–6), puis
  WebView introuvable par DevTools sur 2 essais (prise absente de `/proc/net/unix`) → connexion par pid (essai 5).
  **26/10 19:33 : film vert** (chevron seul, la ligne entière ouvrait l'app ; port DevTools neuf à chaque essai,
  sans keep-alive) → PR #398 mergée, publication lancée sur main (https://spreadzenox.github.io/HealthTrack/p28/).
Ordre proposé : ~~SAUV~~ (fait 24/10 16:30) → ~~POL-5 + POL-4~~ (faits 24/10 17:30) → ~~POL-3~~ (fait 24/10 18:30) → ~~POL-2~~ (fait 24/10 19:30) → ~~POL-7~~ (fait 24/10 23:30) → ~~POL-6~~ (fait 25/10 00:30) → ~~POL-8~~ (fait 25/10 01:30) → POL-1a (fait 25/10 02:30) → ~~POL-1b~~ (fait 25/10 02:33 CET) → ~~POL-1c~~ (fait 25/10 03:33 CET) → P28 (propriétaire) → interrupteur allumé (POL-1d) → ~~M6b~~ (fait 25/10 04:33 CET) → ~~M7~~ (fait 25/10 05:33 CET : FC moyenne, courbe de FC et allures au km des séances, synchro app ouverte) → ~~M4 bis~~ (fait 25/10 06:33 CET : bits inconnus des minutes comptés par jour dans le journal de la synchro ; le propriétaire compare avec les étages de sa montre) → ~~M7b~~ (fait 25/10 07:33 CET : séances avec FC et allures relues app fermée, `WatchReader.workouts`) → ~~A.1 / A.2~~ (livrés le 18/10) → ~~tuiles montre + export (e)~~ (fait 25/10 14:33 CET).
Inchangés (le propriétaire en est content) : Données, Paramètres, Nouveautés, Journal de bord, Confidentialité, Conditions.

Ordre des runs de code : ~~6b~~ (6b-1 livré le 22/10 21:30) **→ 6c (+ 6b-2 Play Integrity) → jalon 4 → passe de finition VC** (6d dès P13, 6e dès les abonnements), puis M4,
M6, M7, jalon 5. Défauts trouvés par l'audit sans code du 22/10 20:30 (`npm run visual -- --play --empty`, clair et
sombre) — à corriger dans la passe de finition, chacun avec son test :
- [x] **VC-1 — FAIT le 23/10 15:30** (test-garde `gluedNames`, + `FaceSenseCard.jsx:326`) espace perdue après le nom : `src/pages/Dashboard.jsx:76` (« Halcyavous ») et
  `src/components/BaselineCards.jsx:118` (« mesures,Halcya »). Correction : `{APP_NAME}{' '}` / `{' '}{APP_NAME}` ;
  test-garde : aucune ligne JSX ne finit ni ne commence par `{APP_NAME}` sans `{' '}` (ou rendu → pas de `/Halcya\S/`
  ni `/\S,Halcya/`).
- [x] **VC-2 — FAIT le 23/10 17:30** (`PistesTeaser onPistesPage` dans `Recommendations.jsx`, onglets masqués sans résultat) page Pistes vide alignée sur la carte lilas de l'Accueil (même compteur X/21 jours avec repas ou note du
  ventre, même phrase « On préfère attendre… ») ; supprimer « recommandations basiques », « ≥ 5j / ≥ 9j » et le 📊 de
  l'état vide ; les onglets simple / avancée seulement quand il y a des résultats.
- [x] **VC-3** (23/10 18:30, `BodyProfileCard` ; IMC/kcal derrière « détails » dans les deux variantes) Nutrition : ne rien chiffrer tant que le profil n'est pas rempli (ni kcal, ni IMC, ni « Homme, 30 ans »
  par défaut) → carte « Complétez votre profil pour voir vos repères » ; en play, objectif calorique et IMC repliés
  derrière « détails » (I152).
- [x] **VC-4** (23/10 16:30) « Mode diagnostic » masqué en play (`featuresFor('play').debugMenu`), révélé une fois
  pour toutes par 7 touches sur « Version N » en bas des Paramètres (`unlockDebugMenu`) ; reste visible si le mode
  était déjà actif.
- [x] **VC-5** (24/10 05:30, `changelogFor`, `PLAY_CHANGELOG_SINCE = 2026-10-24-0000`, historique « lu » à l'onboarding) Nouveautés en play : champ facultatif `variants` dans les JSON du changelog + date de départ play ;
  n'afficher que les entrées play postérieures à la première version publique (aucun « HealthTrack », ni clé, ni
  bouton de mise à jour) ; test sur les fichiers existants.
- [x] **VC-6** (23/10 19:30) Sources : la carte montre propose d'abord « Connecter une montre compatible Huawei » ; le lien vers
  `/montre` n'apparaît qu'après un appairage ; `/montre` sans montre → état vide d'une phrase + bouton.
- [x] **VC-7** (23/10 21:30, `visibleConnectorIds`, `MethodNote summary`) Sources en play : carte Withings Body Scan masquée (identifiant / secret de développeur à saisir ;
  Withings écrit dans Health Connect, déjà lu), données Withings existantes conservées et exportées ; textes des
  cartes raccourcis à 2 lignes + « détails » (Lecture du visage, Temps d'écran, Météo).
- [x] **VC-8** (23/10 19:30) carte montre : bloc « Diagnostic » fermé par défaut, sans HiChain / AES-GCM / compteurs bruts dans le
  résumé (retour du propriétaire, P17) ; termes techniques seulement une fois déplié.
- [x] **VC-9** (24/10 07:30, `.github/scripts/play-cold-start.sh` dans le workflow émulateur, API 35 et 36 : installation neuve play, TotalTime + premier écran + erreurs JS, échec si écran absent en 90 s, erreur JS non interceptée ou plantage ; chiffres dans le compte rendu du run ; **a trouvé dès son premier passage un vrai bug** : chargeurs de plugins async bloqués par le `then` du proxy Capacitor → PlayBilling / PlayIntegrity / AppUpdate jamais résolus, corrigé par `services/nativePlugin.js`) temps du premier lancement play à froid et absence d'erreur JS (critère C4) ;
  `npm run visual` n'exerce pas les plugins natifs.
- [x] **VC-10** (24/10 01:30, `services/deleteAllData.js` ; réglages, connexions, appairage et abonnement gardés) « Supprimer toutes mes données » dans Réglages → Données (avec export proposé avant), aujourd'hui
  seulement « désinstaller / effacer les données Android » d'après la politique de confidentialité.
- [x] **VC-12** (23/10 22:30 : 2ᵉ carte retirée sous la carte lilas, seuil bien-être dans ses « détails ») (audit du 23/10 20:30) Pistes vide : sous la carte lilas (« 0/21 jours avec un repas ou une note du
  ventre »), la carte « Pas encore assez de jours mesurés » dit « au moins 5 jours avec une note de bien-être (bouton
  « Une note ») » (`pages/Recommendations.jsx:305-309`) → deux seuils et deux gestes différents sur le même écran.
  Correctif : ne pas afficher cette 2ᵉ carte tant que la carte lilas est là (ou la fondre en une ligne « détails » :
  « analyse bien-être : 5 jours avec une estimation ou une note ») ; test sur base vide.
- [x] **VC-13** (23/10 21:30, `watchGuidesFor` / `HUAWEI_DIRECT_GUIDE` ; Huawei Santé détecté → connexion directe dans les deux variantes) (audit du 23/10 20:30) Sources → « Votre montre n'apparaît pas ? » → **Huawei / Honor**
  (`data/watchGuides.jsx:14-30`) conseille Gadgetbridge depuis F-Droid et la récupération de l'`userId` dans les
  cookies de cloud.huawei.com avec F12, alors que la variante play connecte la montre en direct. En play : le guide
  renvoie d'abord à « Connecter ma montre » (carte au-dessus), Gadgetbridge seulement en dernier recours, sans la
  manipulation des cookies (instruction risquée pour un utilisateur grand public, mauvaise image en revue Play) ;
  sideload inchangée. Test : variante play, texte sans « F12 » ni « cookie ».
- [x] **VC-14** (23/10 22:30 : `cigaretteSetting`, masqué en play sauf s'il est déjà activé) (audit du 23/10 20:30) Paramètres play : bloc « Cigarettes » (« Toujours afficher + 1 cigarette sur
  l'accueil ») et « cigarettes » dans le sous-titre de Réglages → Paramètres. Hors parcours SII + bien-être : le
  replier sous « Autres suivis » ou le masquer en play (le compteur reste disponible si une cigarette a déjà été
  notée ; aucune donnée touchée).
- [x] **VC-15** (24/10 06:30, `components/LineIcon`, tests-gardes apostrophes + émojis dans `data/wording.test.js`) (audit du 23/10 20:30, mineur) émojis hors identité visuelle : Repas (📷 Photo, 🖼️ Galerie,
  ✍️ Décrire), Réglages (🗂️ ⚙️ ✨ 🔒), Paramètres (🔒 Ce qui est envoyé) → icônes trait de la barre de navigation ;
  apostrophes droites mêlées aux typographiques (« l'instant », « l'ouverture de l'app », « n'apparaît », « l'accueil »)
  → test-garde sur les textes JSX visibles. Repas : titre « Alimentation » alors que l'onglet dit « Repas ».
- [x] **VC-16** (23/10 22:30 : textes alignés) (audit du 23/10 20:30, mineur) Journal → Tendances, carte bien-être vide : « Enregistrez votre
  bien-être à l'ouverture de l'app » → aligner sur le reste (« Activez la lecture du visage ou notez votre
  bien-être avec « Une note » ») ; « Connectez une montre via Health Connect » → « Ajoutez une montre dans Sources »
  (la Huawei ne passe pas par Health Connect).
- [x] **VC-17 → P25** (23/10 23:30 : option ① par défaut, `config/premiumBenefits.js`, test qui relie chaque avantage coché à une fonction ; rappel et Conditions → VC-18) (audit du 23/10 20:30, **bloquant pour C3**) le paywall liste 4 avantages dont **3 non livrés**
  (pistes avec délais de 2 à 48 h = jalon 5 ; réintroduction FODMAP guidée et rapport PDF = jalon 7) ; aucune page
  de l'app ne lit `useEntitlement` hormis Paramètres et Premium : le premium ne change aujourd'hui que le quota IA du
  relais. Correctif proposé (I157, à valider par P25) : `PREMIUM_BENEFITS` avec un drapeau `delivered`, seuls les
  livrés en liste cochée, les autres dans « détails » sous « En préparation, inclus sans supplément » ; test qui
  échoue si un avantage affiché n'est relié à aucune fonction. Ajouter au passage le rappel « 2 jours avant la fin de
  l'essai », l'étape « jour 12 : on vous prévient » de la frise et le lien « Conditions » (C3).
- [x] **VC-18** (24/10 02:30 : **page Conditions faite**, `public/conditions.html`, GitHub Pages `/conditions/`, liens paywall + Réglages ; 24/10 04:30 : **rappel J−2 fait**, `services/trialReminder.js` + `TrialReminderPlugin` play) (C3, reste de VC-17) rappel de fin d'essai : notification locale programmée à l'achat de l'essai
  (J−2), puis seulement afficher « jour 12 : on vous prévient » et « Rappel 2 jours avant la fin de l'essai » ; page
  « Conditions » (CGU/CGV, brouillon de `journal/legal/` « à faire valider par un juriste ») publiée par GitHub Pages
  et liée depuis le paywall.
- [x] **VC-20 — FAIT le 25/10 15:33** (Journal, radar, note manuelle ; test-garde « aucun `.emoji` affiché » dans `wording.test.js`) (mineur, avec la passe Pistes du jalon 5) les étiquettes d'habitudes portent un émoji (✈️ Voyage,
  ☕ Café après 14 h, 📱 Écran tard, 🤒 Malade) affiché dans Pistes et le journal : remplacer par des icônes trait ou
  une pastille de couleur, sans toucher aux données (l'émoji reste dans l'étiquette enregistrée).
- [x] **VC-21 — FAIT le 25/10 16:33** (identifiés : `BtClassic.listBonded` sans autorisation « Appareils à proximité », lancé par la synchro auto montre à chaque ouverture → plus d'appel Bluetooth tant qu'aucune montre n'a de clé dans l'app ; `PlayBilling.queryPurchases` refusé car l'émulateur n'a pas le Play Store → attendu ; le script nomme désormais plugin, méthode et message) (mineur) premier lancement play : un `console.error` « Line 330 - Msg: [object Object] » (fichier vide, donc venu du natif) à identifier et à rendre lisible (résumé « Premier lancement à froid » du workflow émulateur).
- **Audit du 25/10 08:33** (run « idées », `IDEES.md` I165–I167 ; captures play vierge clair + démo sombre) — ordre
  proposé : **VC-22 + VC-25 + VC-27** (un run) → **VC-23 + VC-24** (un run) → **VC-26** (un run) → **AVIS** →
  **VC-PUBLIER**. POL-1d (déverrouillage en play) **après** la version candidate, dans une version séparée.
- [x] **VC-22** (25/10 09:33) « vos Pistes » dans 4 textes alors que l'onglet s'appelle « Analyses » : `WeatherCard.jsx:127`,
  `:177`, `PhoneUsageCard.jsx:134`, `BleDevices.jsx:298` → « vos Analyses » ; étendre `wording.test.js`.
- [x] **VC-23** (25/10 10:33 : « Piste solide » / « À confirmer » / « Trop tôt pour dire », pastels, phrase au chevron) Analyses : trois échelles de solidité (« Chez vous : lien net » / « À vérifier : peut-être le
  hasard », « Hypothèse solide » / « à confirmer », et `DESIGN.md` « piste solide » / « à confirmer » / « trop tôt
  pour dire ») → une seule échelle et les mêmes couleurs partout ; phrase longue au chevron. Aucun calcul ne change.
- [x] **VC-24** (25/10 10:33 : gabarit unique `LinkCard`, une décimale) Analyses, « Autres liens repérés » : deux gabarits mêlés (lignes à barre et cartes de texte en gras),
  libellé tronqué « Calories brûlées totales (H… », « 2,43 / 5 » à deux décimales → un seul gabarit, une décimale.
- [x] **VC-25** (25/10 09:33) Sources : « ▶ Brancher une autre source » fait doublon avec le bouton « Ajouter une source » → garder
  le bouton ; triangles ▶ restants (Sources, « Comment c'est calculé ») → chevron discret (POL-3).
- [x] **VC-26** (25/10 11:33 : intro en une phrase, ligne unique des mesures, liens Journal masqués à vide) Accueil vierge : intro de 5 lignes → une phrase ; 3 tuiles vides « – » → une ligne « Sommeil, cœur
  et pas arrivent de votre montre · Ajouter une source » tant qu'aucune tuile n'a de valeur ; boutons « … dans le
  Journal » masqués sans aucune donnée. Captures vierge + démo, clair + sombre.
- [x] **VC-27** (25/10 09:33) carte Health Connect (play) : sans « Gadgetbridge », marques connues (Samsung Health, Garmin,
  Withings, Oura…), liste des 13 types au chevron.
- [x] **AVIS** (25/10 12:33 : Paramètres → « Votre avis » ; play → page Play Store, où les testeurs ont « Envoyer des commentaires privés » ; sideload → ticket GitHub prérempli ; pas de `mailto:` faute d'adresse de contact dans le dépôt, P31 facultative) (I166 ③) aucun moyen d'envoyer un retour depuis l'app : Paramètres → « Envoyer un avis » (`mailto:`
  vers l'e-mail de contact de la fiche, objet « Halcya <version> », sans aucune donnée de santé ni journal joint).
- [x] **VC-PUBLIER** (25/10 13:33 : versionCode 453 en alpha, validé ; dates posées `2026-10-25T12:00Z` → `2026-11-20T23:00Z` ; « Play — AAB » en `alpha` réutilise l'AAB déjà envoyé en test interne et ajoute le groupe des testeurs s'il manque ; échéance affichée inclusive « jusqu'au 20 nov. » ; envoi alpha lancé après le merge, voir le compte rendu) dès VC-22 → AVIS mergés : poser `from` (jour de la publication) / `until` (+14 j + 7 j de marge)
  dans `relay/src/launch-period.json`, vérifier « Premium offert pendant le test » sur la version play, publier la
  version en **alpha**, C5 ✅, « 👉 Version candidate prête » en tête du résumé avec les gestes et le texte
  d'invitation (`INVITATION-TESTEURS.md`, mis à jour le 25/10 : ouvrir l'app tous les 2-3 jours, rappel du jour 7 ; relu contre la v402 le 31/10, I201).
  Pendant les 14 jours : au moins 2 versions en alpha, et une liste « changements faits pendant le test » dans
  `PRODUIT.md` pour le formulaire d’accès à la production (P30, à préparer au jour 10).
- [x] **ALPHA-0211** (02/11 23:35) compte rendu du 02/11 : Alpha = 100721 (P40, propriétaire, 02/11 22:41), `until` = 27/11 servi par le relais (vérifié), « 👉 Version candidate prête » en tête du résumé avec gestes et texte final ; lien d'inscription au test écrit dans le texte. **Reste** : P41 (le propriétaire invite dès la fin de l'examen) ; décaler `until` si l'invitation part après le 03/11 ; au moins une seconde version en alpha pendant les 14 jours.
- [x] **CREDITS-INSTALLS — FAIT le 25/10 17:33** (événement `first_credit` sans identifiant, seulement pour une installation inconnue du registre Firestore et sans crédit rapporté par l'app ; analyse de test `ci-smoke-*` exclue ; résumé du workflow relais : total et par jour sur 7 j) (I167) résumé du workflow relais : nombre de nouvelles installations par jour qui prennent
  leurs crédits offerts (le « device recall » de Play Integrity est réservé à des partenaires) ; passer à 5 crédits
  offerts seulement si ce nombre s'envole.
- [x] **VC-19** (24/10 07:30 : le faux plugin reste « en cours » tant que le test n'a pas vu la progression) (mineur) `UpdateBanner.test.jsx` « progression en Mo et en % » échoue parfois sous la charge de la
  suite complète (vert isolé) : rendre le test indépendant du minutage.
- [x] **VC-11 (avant le jalon 4, I153) — FAIT le 23/10 09:30** (`connectors/syncWindow.js` ; reste : message exact d'Android à relever sur l'émulateur) première synchro Health Connect : `DEFAULT_HISTORY_DAYS = 180`
  (`connectors/autoSync.js:28`, `pages/Connectors.jsx:28`) alors que, sans `READ_HEALTH_DATA_HISTORY` (déclarée nulle
  part), Android refuse toute lecture antérieure à « première autorisation − 30 j » ; et `lastSyncAt` avance même si
  tous les types ont échoué → les 30 jours ne seraient jamais importés sur une installation neuve. Correctif : noter
  `firstGrantAt`, borner `since` à `firstGrantAt − 29 j` sans la permission d'historique, ne pas avancer `lastSyncAt`
  quand tout a échoué, borner « Importer depuis N jours » ; tests avec un faux plugin qui lève au-delà de J−30 ; puis
  vérification sur l'émulateur (message d'erreur exact).

## 🚑 Signalement du propriétaire du 27/10/2026 11:56 — pas et kcal aberrants (Journal, version play)
- [x] kcal minute de la montre en petites calories → kcal à la synchro (`rawCal`), migration `watchKcalFix.js`,
  correction à la lecture (`activityTotals.js`) — 27/10 12:33
- [x] pas montre + Health Connect additionnés → une source par heure partout (Journal, analyses, agrégats v2, écran
  Montre, premier import) + garde-fou (> 100 000 pas, > 15 000 kcal) — 27/10 12:33
- [ ] confirmation du propriétaire : pas et kcal du jour, montre (écran Activité) vs Halcya au même moment
- [ ] unité des calories des séances (0x17, 4 octets) à confirmer (kcal ou cal ?) ; dépense totale (BMR + activité)
  si le propriétaire attend le chiffre total de la montre

## 🧭 Chantier produit — décisions du propriétaire du 20/10/2026 au soir (charte §000000000, détail : `PRODUIT.md`)
Cadre général depuis le 20/10 au soir : produit vendable sur Google Play ; porte d'entrée SII ; bien-être ; toutes
les montres ; « collecter est gratuit, comprendre est payant ». Jalons (état tenu dans `PRODUIT.md`) :
- [ ] **M Montre Huawei — couverture maximale (signalement du 21/10 ~20:00, PRIORITÉ DES RUNS DE CODE)** — spec et
  inventaire : `protocoles/huawei.md` §10 (run « idées » 21/10 20:30). Cause probable : GT 6 Pro « fichiers 0x2C non »
  → sommeil détaillé jamais demandé. Étapes (un run = une étape, tests sur trames synthétiques) :
  [x] **M0** nom affiché « Halcya » (`config/brand.js`, deux variantes, libellé du lanceur, notifications ; aucun identifiant
  technique ; test-garde `brand.test.js`) — 22/10 00:30 (PR #260) ; [~] **M1** sommeil par la voie « nouvelle synchro » (§10.3) — **livré le 22/10 00:30** (0x2C plus jamais
  interrogé, décision TruSleep + 143, départ coucher si 199, résumé complet, siestes, rattrapage 60 j) ; [ ] à confirmer sur la
  vraie montre (journal de synchro) ; [ ] types bruts du sommeil simple (9…) ; [~] **M2** VFC
  de journée — **livré le 22/10 10:30** (`p2p.js` : ping 0xCA par numéro, pages par classe, accusés 0xCF au numéro de
  la montre, réels 4 / 8 o, 10 s / page, 50 pages max, reprise `dictUntil` par classe ; entrées `during: 'day'` tenues
  à l'écart de la VFC de nuit — tuile, Radar, normes, analyses — et « VFC jour » dans Journal → Jours ; classe 500031
  « émotions » non lue, I145) ; [ ] M2 à confirmer sur la GT 6 Pro ; [ ] VFC de journée comme facteur X des pistes
  (variable à part, après M5, si les données arrivent) ; [ ] P2P dans le lecteur Java en arrière-plan (M6) ; [~] **M3** température de la peau — **livré le 22/10 12:30** (classe 400012 après la VFC, capacité 29, `body_temperature` `subtype: 'skin'`, « Temp. peau » dans Journal → Jours, réglage « mesure continue » 7/0x2A choisi par l'utilisateur, envoyé une fois) ; [ ] M3 à confirmer sur la GT 6 Pro ; [x] **M4** stress — **livré le 24/10 12:30** (fichier `rrisqi_data.bin`, entrée `watch_stress`, X seulement ; SpO₂ et respiration de la nuit déjà livrés par M1) ; [ ] M4 à confirmer sur la GT 6 Pro ; [ ] **M4 bis** étages (compteur des bits inconnus des minutes, §10.6) ; [x] **M5** écran « Données de la montre » — **livré le 22/10 14:30** (`coverage.js` + page `/montre` : dernière valeur, date, n sur 7 j, issue de la dernière lecture gardée dans l'état de synchro `reads`) ; [x] issue des lectures des captures en arrière-plan (03/11 06:35 : `noteCaptureReads` à l'import des captures du client Java, la plus récente remplace une lecture plus ancienne ; « Dernière lecture en arrière-plan » sur l'écran Montre ; `--connect=background` dans `npm run visual`) ; **ordre décidé le 22/10 13:30 : jalon 6 d'abord, puis M4, M6, M7** ; [~] **M6** rattrapage de
  l'historique + resynchro arrière-plan avec les nouvelles lectures (A.3) — **M6a livré le 24/10 13:30** (fichiers 0x2C sommeil détaillé + stress dans le lecteur Java, reprise par fichier recopiée du JS ; §10.15) ; [x] **M6b — FAIT le 25/10 04:33 CET** P2P (VFC jour, température) dans le lecteur Java (`WatchP2P`, capture `dict`, reprise par classe recopiée du JS) ; [ ] M6b à confirmer sur la GT 6 Pro ; [ ] M6a à confirmer sur la GT 6 Pro ; [x] **M7** séances : FC et allure
  (0x17/0x0A, 0x0C) — livré le 25/10 05:33 (M7b app fermée 25/10 07:33 ; coché le 03/11, ligne restée ouverte par oubli) ; [ ] M7 à confirmer sur la GT 6 Pro ; [x] **MONTRE-SCORE (I200)** (03/11 19:35) score de la nuit de la montre et FC moyenne de la nuit en tuiles du Journal → Jours (« Score montre 82 / 100 », « FC nuit ») ; [ ] à comparer avec Huawei Santé ; [x] A.1, A.2 (livrés le 18/10) ; [x] tuiles Accueil sommeil / VFC nuit « Montre Huawei » + export vérifiés (25/10 14:33 : tuile « VFC nuit », source courte, test d'intégration `watchHome.integration.test.js`).
- [~] **3c (dès P11)** envoi automatique de l'AAB en test interne par l'API Android Publisher (seule exception à M) —
  **branché le 21/10 22:30** (`app/scripts/play/publish.mjs`, étape « Envoyer en test interne » de « Play — AAB », symboles
  natifs `debugSymbolLevel`) ; [x] premier envoi réel vérifié (22/10 00:30 : versionCode **346** déployé en test interne dès le 21/10 22:51, accès gh-deployer effectif tout de suite) ;
  [x] page de confidentialité (22/10 02:30 : `app/public/privacypolicy.html` réécrite pour la variante play, source unique embarquée + **GitHub Pages** `.github/workflows/pages.yml` → https://spreadzenox.github.io/HealthTrack/confidentialite/ , lien Réglages → Confidentialité, `privacyPolicy.test.js` ; attend P19) ;
  [x] fiche du Store FR par l'API (22/10 04:30 : `app/store/listing/fr-FR/` textes + 5 captures 1080×1920 de la variante play (données de démo) + image de présentation 1024×500, `scripts/store/build-store-assets.mjs`, envoi `scripts/play/listing.mjs` par le workflow « Play — fiche du Store », images réenvoyées seulement si leur SHA-256 change, site web dans details) ;
  [x] refaire les captures (FAIT le 03/11 05:35 : 6 captures de la version actuelle, Gold factice : Aujourd'hui, Analyses, Repas, Historique du bien-être, Réintroduction, Jours ; liste dans `scripts/store/screenshots.mjs`, test-garde `build-store-assets.test.mjs` ; celles du 22/10 montraient encore l'onglet « Pistes » et « Analyse simple / avancée ») ; [x] Sécurité des données (22/10 06:30 : réponses justifiées `app/store/data-safety/answers.mjs` → CSV complet `data-safety.csv` rempli sur le modèle de la Play Console, règles du formulaire vérifiées, envoi `applications.dataSafety` par le workflow manuel « Play — sécurité des données » (P21) ; repli : import manuel du CSV ; réponses exactes dans PLAY-CONFORMITE.md §Sécurité des données) ; [ ] test fermé (piste `alpha`, testeurs `halcya-testeurs@googlegroups.com`, edits.testers ; attend P18).
- [x] **6a-1 relais Cloud Run** (22/10 16:30) : `relay/` + « Relais — déploiement » + job « Relais (Node) » ; plafonds en mémoire (une instance), à durcir par Play Integrity (6b) ; P22 facultatif (quota Vertex).
- [x] **6a-2** (22/10 18:30, livré) : variante play → relais (`featuresFor('play').aiRelay`, identifiant d'installation aléatoire, analyse photo et texte, message des quotas 429, plus de champ clé Gemini en play), confidentialité et sécurité des données mises à jour (photos/texte de repas envoyés au relais puis à Vertex AI UE, rien conservé), test sur le vrai relais. Vérifier dans le résumé du dernier « Relais — déploiement » le modèle qui a répondu.
- [x] **6b-1** (22/10 21:30) : relais `billing.js` — `subscriptionsv2.get`, droits (actif / grâce / annulé non échu ; pas en pause, on_hold, expiré, en attente), accusé côté serveur, `linkedPurchaseToken`, `/v1/subscription/verify` au format validateur cdv-purchase, `/pubsub/rtdn` (OIDC relay-runtime vérifié), `LAUNCH_PREMIUM_UNTIL` (P23 ②, coupée) ; CI : abonnement push `play-rtdn-relay` + test d'accès Play (faux jeton → 404 attendu).
- [x] **6b-1 bis** (22/10 22:30) : déploiement du relais réparé (`--set-env-vars` en `^;^`, test `relay/test/workflow.test.js`).
- [x] **6b-1 ter** (22/10 23:30) : analyse des repas du relais en 502 après le redéploiement → repli sur le modèle suivant pour toute erreur sauf 429 (y compris réponse vide / illisible), message de Vertex AI recopié dans le résumé du workflow. Vérifier au run suivant que « Relais — déploiement » est vert et quel modèle répond.
- [x] **6b-1 quater** (23/10 00:30) : cause du 502 trouvée — `gemini-2.5-flash-lite` retiré par Google le 20/10/2026 ; les Flash-Lite 3.x ne sont en UE que sur la multi-région `eu` → relais sur `aiplatform.eu.rep.googleapis.com` (`VERTEX_LOCATIONS=eu,europe-west1`, `VERTEX_MODELS=gemini-3.5-flash-lite,gemini-3.1-flash-lite`). Vérifier au run suivant le résumé de « Relais — déploiement » (modèle qui répond). Veille : surveiller les dates de retrait des modèles Vertex (3.1 Flash-Lite : mai 2027 au plus tôt).
- [x] **6c-1** (23/10 01:30) : app — `services/entitlement.js` (droits lus auprès du relais `/v1/subscription/verify` avec l'identifiant d'installation et, s'il existe, le jeton d'achat ; dernier état gardé hors connexion sans jamais dépasser l'échéance ; grâce gardée 3 j au plus hors connexion ; pause / suspension = pas de premium), `featuresFor().billing` (play seulement), bloc « Abonnement » des Paramètres (phrase simple + « Gérer mon abonnement dans Google Play » `play.google.com/store/account/subscriptions?sku=…&package=fr.jpesquet.sante`) ; `npm run visual -- --play --subscription=free|launch|active|trial|paused`.
- [x] **6c-2** (23/10 02:30) Google Play Billing dans la seule variante play : **plugin maison** `PlayBillingPlugin.java` (source `src/play/java`, PBL 8.3.0 en `playImplementation`, enregistré via `FlavorPlugins` ; la sideload n'a ni la bibliothèque ni la permission BILLING) plutôt que le plugin Cordova `cdv-purchase` (impossible à exclure proprement par variante) ; `services/playBilling.js` (formules et essai lus dans Play Billing, `obfuscatedAccountId` = sha256(`halcya:<installation>`) identique au relais, achat → jeton revérifié par le relais, restauration, jeton retenu) ; « Restaurer un achat » dans les Paramètres ; contrôle du manifeste (BILLING play oui / sideload non) ; sécurité des données + politique de confidentialité (historique d'achats).
- [x] **6c-3a** (23/10 03:30) paywall de la maquette `/premium` (variante play) : prix, essai, équivalent mensuel et économie calculés sur Play Billing ; état « aucune formule » ; « Découvrir le premium » dans les Paramètres ; faux plugin Play Billing pour `npm run visual --play`.
- [x] **6c-3b** (23/10 04:30) crédits IA : relais `src/credits.js` (10 offerts une fois + 15 / mois civil UTC non cumulables, premium 10 / jour ; registre en mémoire par empreinte ; l'app renvoie son dernier état `X-Credits` et le relais garde le plus restrictif ; premium relu par `X-Purchase-Token`, cache 1 h), `GET /v1/credits`, 429 `credits` / `premium_day` ; app : `AiCreditsHint` (« X analyses IA restantes · renouvellement le … ») dans Paramètres, photo et description d'un repas ; paywall « jusqu'à 10 par jour » au lieu de « sans compter ».
- [x] **Crédits durables** (FAIT le 24/10 14:30, `createFirestoreStore` ; ligne restée ouverte par oubli, cochée le 28/10) : registre des crédits dans un stockage persistant (Firestore en mode natif, europe-west1) pour que le compteur ne reparte pas à zéro quand le relais redémarre côté abus (aujourd'hui borné par les plafonds quotidiens et l'état renvoyé par l'app) ; avec 6b-2 Play Integrity. Demande une action du propriétaire (API Firestore + rôle `roles/datastore.user` pour relay-runtime ; P24).
- [x] **6c-3c** (23/10 05:30) écouter l'événement natif `purchasesUpdated` (paiement en attente confirmé plus tard) ; rafraîchir le compteur de crédits après un achat.
- [x] **Paywall avant la version candidate** (coché le 02/11 15:56 : tout est livré — rappel `trialReminder.js` et « jour 12 » dans la frise, `conditions.html` publiée et liée, bénéfices réels, phrase « Vos pistes arriveront vers le 21ᵉ jour ») : rappel local 2 jours avant la fin de l'essai (puis remettre « jour 12 : on vous prévient » dans la frise) ; CGU/CGV publiées sur GitHub Pages + lien « Conditions » ; liste des bénéfices alignée sur ce que le premium débloque réellement (pistes, FODMAP, PDF pas encore livrés) ; phrase contextuelle « Vous avez N jours de données » (jalon 4).
- [x] **6b-2a** (23/10 06:30) relais : `src/integrity.js` (décodage `decodeIntegrityToken` sous relay-runtime, verdict : paquet, `requestHash` = sha256(`halcya-integrity:<installation>`), jeton < 10 min, `PLAY_RECOGNIZED`, `MEETS_DEVICE_INTEGRITY` ; licence journalisée, non exigée ; verdict accepté gardé 24 h, refus 10 min ; Google injoignable = on laisse passer), en-tête `X-Integrity-Token` sur `/v1/meal/analyze`, `INTEGRITY_MODE=observe` déployé (ne bloque rien, journalise).
- [x] **6b-2b** (23/10 07:30) app (variante play) : `PlayIntegrityPlugin.java` (`com.google.android.play:integrity:1.6.0`, `StandardIntegrityManager`, fournisseur préparé une fois avec le projet 81378799481, re-préparé une fois si `INTEGRITY_TOKEN_PROVIDER_INVALID`) enregistré par `FlavorPlugins` ; `playIntegrity.js` (requestHash = sha256 `halcya-integrity:<installation>`, même vecteur testé côté app et relais ; délai 8 s puis pause 1 h) ; `aiRelay.js` joint `X-Integrity-Token` à **chaque** analyse (pas « un par jour » : le relais à zéro instance perd son cache, un jeton manquant serait refusé en `enforce` ; le relais ne décode qu'une fois par jour et par installation tant qu'il tourne). Compilation play vérifiée par le check « Build APK » de la PR (`bundlePlayRelease`).
- [x] **6d — code livré le 24/10 09:30** (workflow « Play — abonnements », déclenché aussi par un push sur ses fichiers ; **créé et actif sur Play du premier coup**, run 40075832746) — **spécifié le 24/10 08:30, `IDEES.md` I158 :** workflow `workflow_dispatch` « Play — abonnements » sur `main` + `app/scripts/play/subscriptions.mjs` (`buildCatalog()` pur + `ensureCatalog()` idempotent : GET → création `halcya_premium` avec `regionsVersion.version=2022/02`, fiche fr-FR obligatoire dont les `benefits` viennent de `config/premiumBenefits.js`, formules `annuel` P1Y 29,99 € / `mensuel` P1M 4,99 € en FR, grâce + suspension dont la somme fait 30 à 60 j, offre `essai-14j` gratuite P14D ciblée « jamais eu cet abonnement », puis activation des formules et de l'offre, relecture en résumé de job). Identifiants figés par un test (immuables chez Google). Refus faute de vérification bancaire ou 403 → corps exact de l'erreur dans le compte rendu, réessai aux runs suivants.
- [x] **6e côté routine (24/10 10:30)** : carte Accueil « paiement à régulariser » (grâce / suspension) + scénario P27 ; reste la passe du propriétaire (P27). Spécification d'origine : **6e (spécifié le 24/10 08:30, I159)** scénario testeur de licence ≈ 30 min (essai 3 min, mensuel 5 min, annuel 30 min, grâce 5 min, suspension 10 min, pause 5 min ; 7 cases ① à ⑦ à cocher dans `PRODUIT.md`) ; à décider : carte Accueil « paiement à régulariser » en grâce / suspension.
- [x] **I160** (25/10 18:33, `src/data/noHardcodedPrice.test.js`, étendu aux textes de l'app et aux Nouveautés) test-garde : aucun prix en dur (`\d+,\d\d ?€`) dans `store/listing/**` ni `public/*.html`.
- [x] **6b-2c-1** (24/10 11:30) bilan `event=integrity` des 7 derniers jours dans le résumé de « Relais — déploiement » (statut × mode × raisons × installations).
- [x] **CI** (24/10 11:30) `play-cold-start.sh` : seuls les plantages du processus `fr.jpesquet.sante` comptent ; tampon `crash` vidé avant la mesure et publié.
- [x] **6b-2c-2** (28/10 02:33) bilan lu : 1 installation `passed` (le téléphone du propriétaire, verdict gardé 24 h), 51 `missing` sur 45 installations, indiscernables (CI ou téléphones). L'app envoie `X-Integrity-Status` (`timeout`, `backoff`, `no_plugin`, `bad_token`, `error:<code Google Play>`) quand elle n'a pas de jeton ; le relais le journalise (`client`, borné, `other` sinon) avec `ci` (identifiants `ci-smoke-`) ; colonnes « Origine » et « Raison » dans le résumé du workflow.
- [ ] **INSTALLS-21** (28/10 ; **03/11 10:35 : la détection ne marche pas** — 67 nouvelles installations en 7 jours, ≈ 10/jour, 0 « robot » signalé alors que seul le propriétaire a la version Play ; 54 d'entre elles sans jeton Integrity, `error:-9`) 21 « premiers crédits » hors CI en 7 jours alors que seul le propriétaire a la version play : vérifier si ce sont les robots du rapport de pré-lancement (Play Console) ; sinon, 5 crédits offerts.
  **28/10 05:33 : instrumenté** — la variante play lit le réglage système `firebase.test.lab` (`PlayIntegrity.environment()`) et envoie `X-Test-Device: 1` avec chaque analyse ; le relais ajoute `testlab` aux journaux `first_credit` et `integrity` ; résumé du déploiement : « dont N robot(s) du rapport de pré-lancement » et origine « robots Google ». **Reste** : lire le bilan quelques jours après la prochaine version play (les robots tournent sur chaque version envoyée) ; si les « premiers crédits » non-robots restent nombreux → 5 crédits offerts.
- [ ] **6b-2c** lire les journaux `event=integrity` du relais (workflow de lecture des journaux) après les premières analyses de la version Play ; si `passed` sur le téléphone du propriétaire et aucun `rejected` inexpliqué → `INTEGRITY_MODE=enforce` dans `relay-deploy.yml`. **28/10** : `passed` vu ; **03/11 10:35 : rester en `observe`** — 54 installations « téléphones » sans jeton (`error:-9`, sans doute les robots du rapport de pré-lancement, voir INSTALLS-21b) ; relire après quelques jours de testeurs ; attendre quelques jours de lignes « téléphones » (version ≥ celle de 6b-2c-2) sans `missing` inexpliqué avant `enforce` ; un `timeout` récurrent sur de vrais téléphones → garder `observe` (ou n'exiger le jeton que pour les crédits offerts).
- [ ] **ACQ-1** (run idées 06/11 20:35, `IDEES.md` I224) page « Pour les professionnels » sur GitHub Pages (ce que
  l'app fait et ne fait pas, rapport PDF d'exemple sur données de démonstration, rien n'est envoyé au professionnel) ;
  run de code **après P30** (production ouverte), test du lien et de l'absence de nom de modèle et de « diagnostic ».
- [ ] **ACQ-2** (idem) messages prêts pour le jour J : e-mail aux diététiciennes, message APSSII (brouillon dans I224),
  vérification de la description courte (I210) ; règles : aucun avantage contre un avis ou une recommandation (Play,
  déontologie), « Collaboration commerciale » si Gold est offert à un créateur (loi 2023-451). P44 ne doit jamais
  dépendre d'un avis sur le Store.
- [ ] **INSTALLS-21c** (run idées 06/11 08:35, `IDEES.md` I223) robots du rapport de pré-lancement reconnus au relais par
  les blocs d'adresses publiés de Firebase Test Lab (booléen `testnet` dans les journaux, adresse jamais écrite) :
  **21c-1 ✅ (06/11 09:35)** `relay/src/testLabNet.js` + journaux + bilan du déploiement + phrase de confidentialité ;
  dernier élément de `X-Forwarded-For` (celui que Cloud Run ajoute, que le client ne choisit pas) ; garde-fou des 13 mois livré ;
  **21c-2** relire le bilan 2–3 jours après ; **21c-3** seulement si confirmé : Flash-Lite pour le réseau de test,
  `testnet` hors de la règle `enforce` ; garde-fou d'âge de la liste (13 mois).
- [ ] **INSTALLS-21b** (03/11 10:35) Trouver un signal fiable des robots du rapport de pré-lancement (le réglage
  `firebase.test.lab` ne remonte jamais) : run « idées » (doc Play Console / Test Lab, propriétés de build des
  appareils, compte Google absent), puis run de code ; rien qui identifie une personne. Sans urgence (coût ≈ 1 €/semaine),
  mais utile pour lire les bilans du test fermé.
  - [x] **INSTALLS-21b-1** (03/11 11:35) Diagnostic : le plugin dit comment se termine la lecture du réglage (`true`,
    `unset`, `other`, `denied` = SecurityException, `error`) et lit aussi le mode « test harness » public d'Android
    (`ActivityManager.isRunningInUserTestHarness`, API 29+, compté robot) ; l'app l'envoie borné (`X-Test-Env`), le
    relais le journalise avec `first_credit` (`testenv`, `none` / `invalid` sinon), le bilan de « Relais — déploiement »
    en donne la répartition. Rien qui identifie une personne. Hypothèse : lecture refusée sur Android récent
    (exception avalée → « pas un robot »).
  - [ ] **INSTALLS-21b-2** (après 2 ou 3 versions en test interne et un déploiement du relais) lire la répartition
    `testenv` : `denied`/`error` majoritaires → autre voie de lecture ; `unset` partout → ce ne sont pas des appareils
    Test Lab marqués, chercher un autre signal (run « idées ») ; `true` → corrigé.
    (03/11 16:35) Bilan du relais : la répartition `testenv` n'était que dans le résumé du workflow (illisible par
    l'API) → aussi dans le journal de l'étape « Nouvelles installations », par jour. Seulement 2 installations le 03/11 :
    relire au prochain déploiement, après 2 ou 3 versions du test interne (les robots passent à chaque version).
    Première lecture (déploiement du merge #658) : `absent` 62, **`unset` 1** (le 03/11) ; rien à conclure.
    Deuxième lecture (04/11 13:35, déploiement manuel 41830314851) : 57 installations sur 7 jours, `absent` 53 (toutes
    avant le 03/11, versions sans 21b-1), **`unset` 4** (3 le 03/11, 1 le 04/11), aucun `true` / `denied` / `error`. La
    lecture du réglage marche mais il n'est posé sur aucun appareil ; les nouvelles installations sont tombées de
    ≈ 10/jour (29–31/10) à 1–4/jour malgré ≈ 15 envois en test interne depuis le 03/11 : les robots ne suivraient
    pas le test interne. → run « idées » (04/11 20:35) : autre signal (rapport de pré-lancement lié aux pistes fermées
    ou ouvertes ? `Build` des appareils Test Lab, absence de compte Google). Si l'envoi Alpha (P42) refait un pic,
    c'est confirmé.
- [ ] **6 (préparé le 22/10 08:30, I146–I148)** Play Billing : plugin `capacitor-plugin-cdv-purchase` (MIT, PBL 9) avec
  validateur = relais ; relais : `subscriptionsv2.get` + accusé côté serveur + `linkedPurchaseToken` + RTDN ; prix et
  essai lus dans `pricingPhases`, jamais en dur ; lien d'annulation Play dans Réglages. Maintenance : aligner
  `@capacitor/cli` (7) sur `@capacitor/core` (8).
- [x] **1** `journal/PRODUIT.md` (20/10 22:30)
- [ ] **2 Nettoyage du « sac à features »** — [x] 2a vocabulaire « humeur » → « bien-être » + `wording.test.js`
  (20/10 22:30) ; [~] 2b inventaire chiffré → décisions masquer / fusionner / déplacer (sans perte de données) : [x] accueil
  (21/10 18:30 : Radar forme, cartes cœur / régularité du sommeil et courbes du bien-être → nouveau sous-onglet
  **Journal → Tendances** `/tendances` ; l'accueil = la maquette ; lectures de l'accueil 12 500 → ~340 enregistrements sur 3 ans) ;
  [ ] réglages (Paramètres, Données) et Sources (diagnostics repliés, une liste « Vos sources ») ; [x] 2c navigation 4 onglets Aujourd'hui / Journal (Repas | Nutrition) / Pistes / Sources + roue « Réglages » en haut
  à droite (Données, Paramètres, Nouveautés), `config/brand.js` (21/10 14:30) ; [x] 2c-2 « Vos derniers jours » → onglet Journal (sous-onglet « Jours », `/journal`, page d'arrivée de l'onglet ; accueil allégé, lien « Vos derniers jours, dans le Journal ») (21/10 16:30) ;
  [x] 2d tokens de design → fait par 2 bis (i) (21/10 00:30) ; [x] 2e « Prédiction du jour » du graphique
  bien-être → « Attendu d'après vos habitudes » (21/10 18:30 ; test : plus aucun « prédiction » visible sur la courbe).
- [ ] **2 bis Identité visuelle « Clair et précis »** (validée le 20/10 au soir, `DESIGN.md`) — [x] `journal/DESIGN.md`
  (21/10 00:30) ; [x] (i) tokens `src/theme/tokens.css` (seule source des couleurs, test de contraste ≥ 4,5:1 dans les
  deux thèmes, test anti-couleur brute), polices Figtree + IBM Plex Mono embarquées, **thème clair par défaut**, sombre
  en option (Paramètres → Apparence), icônes de la barre d'état accordées (`SystemBarsPlugin`) (21/10 00:30) ;
  [x] (ii) icône adaptative « H nuit » + monochrome + notification + écran de démarrage + logo de l'en-tête + icône
  512 px de la fiche Play (`app/store/play-icon-512.png`, script `scripts/brand/render-icons.mjs`) (21/10 04:30) ;
  [x] (iii) Accueil « Aujourd'hui » selon la maquette (21/10 12:30) : ligne mono date + « Bonjour », titre-résumé,
  carte menthe « Bien-être estimé » (grand chiffre, écart à la moyenne 14 j, courbe, « détails »), tuiles sommeil /
  VFC / pas avec leur source, carte pêche « Votre ventre » (Calme / Gêne / Douleur en un geste → entrée `gut`),
  « Photo du repas » / « Une note », carte lilas « Vos pistes arrivent dans N jours » (X/21). Restes : prénom
  (onboarding), navigation 4 onglets (2c), « Lecture rapide » play depuis la carte ;
  [ ] (iv+) chaque écran quand le chantier le touche. Petits restes : chiffres en mono dans le bandeau de mise à jour
  et les tuiles du journal ; rayon des cartes (`--radius` 12 px → `--radius-card` 22 px) écran par écran.
- [ ] **3 Variantes play / sideload** — [x] **3a** (21/10 02:30) flavors `sideload` (`com.healthtrack.app`) / `play`
  (`fr.jpesquet.sante`), `REQUEST_INSTALL_PACKAGES` dans `src/sideload/` seulement, `BuildConfig.SELF_UPDATE`,
  `VITE_DISTRIBUTION` + `src/config/distribution.js` (bandeau masqué en play), versionCode croissant, check « Build APK »
  qui construit aussi l'AAB play + `scripts/check-play-manifest.sh`, workflow **« Play — AAB »** (WIF → Secret Manager
  → AAB signé en artefact ; rouge « Clé d'envoi Play absente » tant que P9 n'est pas fait) ;
  [ ] **3b** — [x] **3b-1** (21/10 06:30) étude `PLAY-CONFORMITE.md` (option retenue pour play : **lecture à
  l'ouverture de l'app** puis « Lecture rapide » par tuile / notification → activité, **sans FGS caméra ni exemption
  de batterie**) + revue des permissions + **divulgations avant autorisation** (`config/permissionDisclosures.js`,
  `PermissionDisclosure`, `hooks/useDisclosure.jsx` : caméra, position, temps d'écran ; test-garde) ;
  [x] **3b-2** (21/10 10:30) manifeste `play` sans `FaceSenseService` / `FaceResume*` / `FOREGROUND_SERVICE(_CAMERA)` /
  `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` (`tools:node="remove"`), `READ_EXTERNAL_STORAGE` borné (≤ 32), drapeaux
  `BuildConfig.FACE_UNLOCK` / `FEATURES.faceUnlock|faceAppOpen`, **lecture à l'ouverture de l'app** (`FaceOneShot`,
  déclencheur `app_open`, 1 / 30 min, 12 / jour) avec bandeau visible `FaceReadIndicator`, carte + diagnostic +
  divulgation `camera_app_open` adaptés, `check-play-manifest.sh` étendu ; **I131** fait dans la foulée (play : 15
  lectures Health Connect, aucune écriture ; test-garde) ; [ ] vérifier sur un vrai téléphone la 1re lecture à
  l'ouverture (dès que la variante play est installable, P10) ;
  [ ] **3b-3** « Lecture rapide » (tuile / notification → activité visible) ; [ ] divulgations restantes : photo du
  repas → IA (avant le premier envoi), Health Connect (jalon 8), Bluetooth « Appareils à proximité » ;
  [ ] enregistrer la date de chaque accord (preuve de consentement, RGPD art. 9) ;
  [ ] fiabiliser le test `FaceSenseCard` « affiche l’humeur estimée dès la première lecture… » (échec isolé sous charge le 22/10 00:30, vert en relance ; le 22/10 04:30, un échec isolé non identifié au premier passage complet, vert en relance) ;
  [ ] fiabiliser le test `UpdateBanner` « montre la progression en Mo et en %… » (délai de 3 s dépassé sous charge en CI, PR #246 sur `a6dfd56`) ; [ ] **3c** envoi automatique en test
  interne (Android Publisher, edits) dans « Play — AAB », après P10 + P11 ; [ ] **3d** nom affiché de l'app depuis une
  seule source (`appName` Capacitor, `strings.xml`, titres) pour le changer en un commit
- [ ] **4 Onboarding (8–12 écrans) + « aha » du jour 1** (30 jours importés résumés, 1re estimation) —
  spécification écran par écran : `IDEES.md` **I154** (9 écrans, route `/bienvenue`, `settings/onboarding.js`, jamais
  montré à un utilisateur existant, notifications jamais pendant l'onboarding) ; découpage **[x] 4a** écrans 1-3 +
  mécanique + redirection (FAIT le 23/10 10:30), **[x] 4b** Health Connect + import + « aha » (FAIT le 23/10 11:30 ; import et « aha » dans un même écran), **[x] 4c** [x] premier geste et
  paywall soft (`/premium` contexte `onboarding`, « Continuer gratuitement ») FAITS le 23/10 12:30 ; [x] **4c-2** lecture
  du visage facultative (écran 7, divulgation `camera_app_open`, une lecture, avant le premier geste) FAIT le 23/10 13:30 ; [x] I155 l'objectif règle l'Accueil FAIT le 23/10 14:30 ;
  [ ] I156 compteur local d'étapes dans le diagnostic —
  [x] **I130** (FAIT avec le 4b, 23/10 11:30) « Vos 30 derniers jours » dès l'octroi Health Connect, **sans** permission d'historique (30 j lisibles
  d'office), chaque chiffre avec sa source ; permission de notifications demandée après un geste, pas d'emblée
- [ ] **5 Analyses avec délais (2–48 h) repas → symptômes** + saisie de symptômes digestifs horodatée + honnêteté
  statistique (« pas encore assez de données ») — [x] **I132** (FAIT le 25/10 19:33 CET, `services/gutWindows.js`, pas encore affiché) 3 fenêtres fixées d'avance (0–4 h « réflexe après le
  repas », 4–24 h, 24–48 h), normes par groupe = hypothèses affichées ; [ ] **I133** seuil N jours exposés / non
  exposés choisi par simulation (< 1 jeu sans effet sur 10 avec une piste), permutation par blocs + BH, nombre de
  combinaisons en détails — **précisé le 25/10 20:33** (`IDEES.md` I168–I169) : [x] **I168** (FAIT le 25/10 21:33 : r = 9 seul, plus puissant que 19 ; repas décalés de s jours, statistique sur les notes ; < 28 jours → « trop tôt ») porte « décalage temporel
  tronqué » (TTS, Yuan & Shou 2024) sur les séries journalières, u ≤ 0,1 en plus de BH, sans enroulement, r = 9 (> 18 j)
  ou 19 (> 38 j) ; [ ] **I169** N calibré sur 4 nulles réalistes (dérive AR(1), aliments en séries, saisie informative,
  notes après les repas) — **banc livré le 25/10 22:33** (`gutWindows.sim.js` + `gutWindows.calibration.test.js`, sauté par défaut) : le moteur actuel **échoue** (derive 29/200, tous 54/200 en 9 sem. ; puissance 8/200) ; max-T testé : fausses pistes ≤ 4 % mais puissance nulle → à reprendre avec moins d'hypothèses (groupes FODMAP) + max-T robuste ; **étape 2 FAITE le 25/10 23:33** : Mantel-Haenszel par blocs de 3 jours (unilatéral, continuité, ≥ 8 blocs informatifs) + BH + TTS → banc PASSÉ (≤ 13/200 dans les 5 scénarios ; tous 54 → 5) ; puissance faible sur un effet ×4 noyé (0/200) → I170 et, si besoin, groupes FODMAP / aliments fréquents seulement ; [~] **I170** bilan du ventre du soir en un geste — **étape 1 FAITE le 26/10 00:33** (dans l'app : carte « Votre ventre », à partir de 18 h, `payload.scope: 'day'`, une fois par jour, ignoré par `gutWindows`, compté dans les 7 jours, « Ventre · bilan du jour » dans le Journal) ; [x] **étape 2 FAITE le 26/10 01:33** : notification native du soir (Calme / Gêne / Douleur en actions, 20 h ou l'heure habituelle des bilans, disparaît avant minuit, état effectif = choix × carte ventre, interrupteur dans Paramètres → Ce qui vous amène) ; [x] **étape 3 FAITE le 26/10 02:33** : `gutDays.js` — bilan du jour j ↔ aliments du jour même (avant le bilan) et de la veille, Mantel-Haenszel par blocs de 7 jours (≥ 5 informatifs) + BH + TTS ; banc `gutDays.calibration.test.js` passé (≤ 7/200 jeux nuls avec une piste) ; puissance ×4 en 9 sem. 25–36/200 (limitée par les 20 comparaisons) ; rien d'affiché ; [x] **affichage FAIT le 26/10 03:33** : `gutLinks.js` + `GutLinks.jsx`, section « Votre ventre et vos repas » d'Analyses (objectif ventre), une piste par aliment, aliments mangés ensemble regroupés, « Bientôt · N/28 jours » ; [x] **puissance FAITE le 26/10 04:33 (I173)** : 12 aliments testés au plus (les mieux répartis, `selectTestedFactors`, sans regarder le ventre) + FODMAP, jumeaux (aliments toujours mangés ensemble) comptés une fois (`correctUnique`) ; longue traîne +20/+40 aliments : 42 → 51, 50 → 64/200 ; nulles ≤ 5/100 ; groupes FODMAP à la place des aliments : pas retenu pour l'instant ;
  [~] **I171** (a et b FAITS le 26/10 03:33 dans les détails des pistes ventre ; reste c avec I135) effet d'attente visible (part des notes prises dans les 2 h après le repas, option « à l'aveugle avec un
  proche » de la réintroduction) ; [~] **I134** (étape 1 FAITE le 26/10 05:33 : la nuit d'avant en covariable dans `gutDays`, « à nuit comparable » ; étape 2 FAITE le 26/10 06:33 : stress et écran de la veille, covariables retenues seulement si |z| ≥ 2 avec le ventre, deux au plus ; étape 3 FAITE le 26/10 07:33 : pistes recomparées à exposition égale aux pistes plus nettes, piège « ail avec l'oignon » 23 → 1/60, « Souvent mangé avec » dans les détails ; reste facultatif : même chose dans `gutWindows`) covariables sommeil / stress / écran, repas du même jour estimés ensemble ;
  symptômes digestifs stockés **localement** (aucun type Health Connect)
- [ ] **6 Play Billing, paywalls (soft + au moment de la valeur), crédits IA** ; puis **relais Cloud Run → Vertex AI
  (europe-west1)** sous l'identité `relay-runtime`, **aucune clé API** ; Flash-Lite, EXIF retiré, rien stocké, Play
  Integrity, RTDN (`play-rtdn`), plafonds par utilisateur et global ; déployé par la CI sur `main` (WIF, `INFRA.md`) —
  [ ] choisir un plugin Capacitor **PBL ≥ 8** (licence compatible) ; [ ] **I136** paywall conforme à la politique Play
  (« 29,99 €/an » en grand, « soit 2,50 €/mois » **secondaire** — l'inverse est une violation —, mentions sous le
  bouton avec date calculée, « Continuer gratuitement », essai affiché seulement si Play le propose, « Gérer mon
  abonnement ») ; [ ] **I137** grâce / suspension (bandeau « Mettre à jour le paiement », jamais les fonctions locales)
- [ ] **7 Réintroduction FODMAP guidée + rapport PDF médecin** — [ ] **I135** machine à états format Monash (3 jours
  croissants, pause ≥ 3 j ou jusqu'au calme, arrêt si gêne J1/J2, verdict à 3 niveaux, aucun verdict sans ventre
  calme au départ, retest + mention de l'effet d'attente) — **spécifié le 26/10 08:33** (`IDEES.md` I174 : protocole
  ×1 / ×2 / ×3 sur 24 h, 3 jours calmes avant, fructanes source par source, sorbitol et mannitol séparés, un test à la
  fois ; entrée `fodmap_challenge`, verdict calculé depuis les notes `gut`) : [x] **7a** machine pure + données +
  tests (rien d'affiché) — **FAIT le 26/10 09:33** (`services/fodmapChallenge.js`, 29 tests) ; [x] **7b-1** écrans choix / préparation / jour en cours / résultat — **FAIT le 26/10 10:33** (`pages/Reintroduction.jsx`, carte d'entrée dans Analyses, 10 tests) ; [x] **7b-2** rappel de la portion + état dans la carte d'entrée — **FAIT le 26/10 11:33** (`services/fodmapReminder.js`, natif `PortionReminder*.java` + `gut/PortionSchedule.java`, notification qui ouvre `/reintroduction`) ; [x] **7c** lien
  depuis les pistes ventre + états dans la carte lilas — **FAIT le 26/10 12:33** (`challengeFoodFor` / `challengePath`, aliment présélectionné) ; [ ] **7d** à l'aveugle avec un proche (I171 c) ;
  [ ] **I175** rapport PDF 2 pages ([x] étape 1 `services/report/buildReport.js` pur — **FAIT le 26/10 13:48**, 12 tests ; [ ] étape 2 `renderPdf.js` avec `pdf-lib` + `fontkit` MIT, polices
  embarquées, chargé à la demande, écrit dans Documents comme l'export JSON) ; [x] **I176** forme des selles
  facultative (Bristol regroupée en 3, objectif ventre seulement, aucun sous-type affiché) — **FAIT le 27/10 10:33** (`services/stool.js`, `StoolLine.jsx` dans la carte ventre, Journal, section « Forme des selles » du PDF ; pas un facteur des analyses) ; [x] `premiumBenefits.js` :
  `pistes-delays` encore « en préparation » alors que les pistes ventre sont affichées (à trancher) — **FAIT le 27/10 09:33** : pistes ventre premium sur Play (aperçu flouté + « Débloquer »), PDF et pistes cochés ; `fodmap` coché le 26/10 10:33
- [ ] **8 Imports 100 % Health Connect + permission d'historique** (Google Fit s'arrête fin 2026) — [x] **I131**
  (21/10 10:30, avec 3b-2) manifeste play limité aux 15 lectures HC du connecteur (`READ_TYPES` exporté = seule
  source, test-garde + `check-play-manifest.sh` ; le plugin en déclarait 41 dont 20 écritures) ; historique > 30 j en option derrière `FEATURE_READ_HEALTH_DATA_HISTORY`
- [ ] **9 i18n + anglais** — **spécifié le 27/10 08:33** (`IDEES.md` I180–I183) : ≈ 2 000 chaînes visibles
  (≈ 12 000 mots) hors diagnostic ; `t()` maison sans dépendance, **français = clé**, catalogue `i18n/en.json`, tests
  forcés en `fr`, test de catalogue (extraction `@babel/parser`) ; noms des aliments = `alim_nom_eng` de Ciqual 2025
  (3 484 / 3 484) + 69 alias à la main ; dictée du soir sans lexique anglais au départ (licences) ; États-Unis exclus
  tant qu'un juriste n'a pas relu (HBNR FTC, My Health My Data Act → P32). Étapes : [x] **9a** socle — **FAIT le 27/10 11:33** (`i18n/`,
  `locale.js` à la place des 41 `fr-FR` et 14 virgules, réglage « Langue » caché `VITE_I18N_EN`, `visual --lang=en`
  avec alerte sur le français restant ; rien de visible) ; [ ] **9b** Layout, navigation, Accueil, Paramètres ;
  [ ] **9c** onboarding, paywall, divulgations ; [ ] **9d** Journal, Repas, Nutrition, FODMAP, `name_en` ;
  [ ] **9e** Analyses, Réintroduction, PDF ; [ ] **9f** Sources, Health Connect, visage, montre ; [ ] **9g** natif
  (`strings.xml`, `values-en`, `locales_config.xml`, langue lue auprès du natif — comportement de `navigator.language`
  à vérifier sur l'émulateur) + relais (`lang`) ; [ ] **9h** fiche Play en-GB / en-US, confidentialité et conditions
  en anglais, interrupteur allumé.
- [ ] **10 Fiche Play** (textes FR, captures, Data safety, déclaration apps de santé) + `journal/legal/` (brouillons
  confidentialité, CGU / CGV, mentions légales « à faire valider par un juriste ») — [ ] **I138** phrase « n'est pas un
  dispositif médical… » (exigée par Play) en une seule source ; déclaration Health apps en catégories **Health &
  fitness** seulement (« Diseases and Conditions Management » est du groupe Medical)

- [ ] **P-SIDELOAD-KEY** migrer la signature sideload (clé de debug publique) vers une clé privée en Secret Manager,
  avec parcours export → réinstallation → import JSON, avant la vérification obligatoire des développeurs Android
  (France 2027). Pas urgent (`INFRA.md`).

## 🚑 Signalement du propriétaire du 20/10/2026 19:05 — mise à jour bloquée sur « Téléchargement… »
- [x] Cause : APK 33,6 Mo (v180+, `libonnxruntime.so` 18,2 Mo) téléchargé d'un bloc en base64 via le pont Capacitor,
  sans délai ni progression → ✅ 20/10 20:30 `AppUpdatePlugin` (DownloadManager, notification, reprise réseau,
  vérification taille / SHA-256 `digest` / paquet / rétrogradation) + `appUpdate.js` + `UpdateBanner` (version
  installée, taille, Mo / % / débit / reste, étapes, blocage 45 s, Réessayer, Annuler, navigateur).
- [ ] **Retour du propriétaire** : installation manuelle de la v188+ depuis le navigateur faite ? À la release
  suivante, la barre avance-t-elle et l'installateur s'ouvre-t-il ? (sinon : capture du bandeau, qui donne la cause)
- [x] **I139 perf : valeur attendue du jour (Tendances)** ✅ 02/11 19:35 : artefact de mesure, pas une lecture en
  trop. Les deux pages lisent les mêmes 23 lots ; l'échauffement de `perf-check` (sur /recommendations) appelait
  `workerStats` avant que React lance le Worker, ne mesurait rien, et la reconstruction unique des agrégats
  journaliers (pas, calories, FC : 6 lectures, 5 040 enregistrements) retombait sur la première page mesurée qui
  utilise le Worker (Tendances). Échauffement qui attend l'événement `worker`, fin du Worker = chaque tâche reçue a
  répondu (`workerSettled`, 4 tests) ; Tendances 825 + 15 809 = 16 634 → budget 22 000 → 17 500. (Mesure du
  21/10 : ~20 300 contre ~14 700, voir le compte rendu de ce jour-là.)
- [ ] **I129 alléger l'APK** : convertir MobileFaceNet (valence / éveil) en LiteRT et retirer ONNX Runtime (−18 Mo,
  APK ≈ 15 Mo), ou build ONNX Runtime minimale ; vérifier l'accord des sorties avant / après sur les images de test.
- [x] Retirer la dépendance npm `@m430/capacitor-app-install`, plus importée. **Fait le 28/10 03:33** (npm + gradle Capacitor).
- [x] Doublon `ingredientsNutrition-*.js` (2 × 2 Mo non compressé) dans l'APK : **fait le 28/10 03:33** — c'était l'app et le worker d'analyse (deux graphes de modules) ; en production, la table est un seul fichier `ingredientsNutrition-*.json` lu par `fetch` (`fetchTableFile`), en dev / tests l'import dynamique reste. Vérifié sur `vite preview` : page Repas et tâche du worker (200 sur le même fichier).

## 🔴🔴🔴 Consigne du propriétaire du 19/10/2026 au soir — bien-être 100 % auto, sans attendre la calibration (charte §0000000)

« Je ne veux pas avoir à attendre les 30 jours de calibration, quitte à embarquer un modèle plus puissant. » Prime sur
l'ordre de livraison de la consigne du 18/10 ; vient juste après le signalement du 15:05 (corrigé, retour attendu).
- [x] **Étape 1 (run 19/10 22:30)** : `mood/faceMood.js` — estimation dès la première lecture du déverrouillage avec le
  modèle actuel (valence a priori sur les blendshapes → visage habituel 28 j → calibration Ridge facultative ≥ 14 j),
  fourchette 0–5 et confiance (lectures du jour, qualité, cadrage, dispersion, un seul signal) ; carte « Humeur
  estimée » sur l'accueil (`MoodEstimateCard`), bloc dans « Lecture du visage », humeur du moment au « Tester
  maintenant » ; « Rien n'est affiché avant… » retiré (`describeGate` = vérification facultative) ; diagnostic
  `estimate` (modèle, confiance, comptes ; jamais la valeur) ; 18 tests nouveaux.
- [x] **Étape 2 — modèle valence / éveil embarqué (run 20/10 02:30)** : HSEmotion `enet_b0_8_va_mtl` ONNX (CCC
  valence 0,594 / éveil 0,549 sur AffectNet), téléchargé par le téléphone (jamais dans l'APK), SHA-256 vérifié ;
  ONNX Runtime 1.22.0 (sans télémétrie) ; `FaceAffect.java` + vecteurs ; `values.valence / arousal` ; `faceMood`
  les préfère à l'a priori, éveil affiché ; diagnostic v3 `affect`. Choix et alternatives : BIEN-ETRE-AUTO.md.
  - [ ] **Retour du propriétaire** : « Modèle valence / éveil : prêt » dans le diagnostic, temps d'analyse, erreurs.
  - [ ] La porte `gate.js` et la calibration lisent aussi la valence du modèle (aujourd'hui : indices blendshapes).
  - [x] Run idées 20/10 08:30 : EmoNet **écarté** (CC BY-NC-ND confirmé, PyTorch seulement) ; comparatif des 3
    modèles VA officiels HSEmotion (IDEES.md, 20/10 08:30) : hors AffectNet ils se valent, le lissage compte plus.
  - [x] **I126 (16) duo B0 + MobileFaceNet** (20/10 10:30) : `mbf_va_mtl.onnx` (8,3 Mo, 112 px, SHA-256
    `0323ace52ea6dbe9aa4a909d20933f7b8629c3fb41249e338f4316abf2a4828c`, même dépôt officiel, même téléchargement
    vérifié) ; valence = moyenne des deux ; désaccord |V_B0 − V_MBF| → « accord entre signaux » dans la confiance ;
    test d'équivalence Java ↔ Python ; diagnostic : temps des deux modèles. ✅ Livré : `FaceAffect.Spec` (B0 224 px
    ImageNet, MBF 112 px (x − 0,5) / 0,5, d'après EmotiEffLib), vecteurs `affect-vectors-mbf.json`, `affectGap` /
    `affectModels` dans la rafale, `faceMood` (σ duo 1,0 → 0,85 ; écart × 2,5 en quadrature, jamais dans la note),
    `faceAffectDuoState` + prepareAffect relancé si le second manque.
  - [ ] **Retour A56 du duo** : « Second modèle : prêt », temps d'analyse (attendu +20 à 60 ms / image), part des
    lectures « en désaccord » (si > 30 % : vérifier le recadrage 112 px sur de vraies images du téléphone).
  - [ ] Seuils d'accord (0,15 / 0,3 de valence) à recaler sur les écarts réels de l'A56 (diagnostic : répartition
    accord / partiel / désaccord sur 7 jours, sans valeur).
  - [x] I127 (7) pondérer les lectures du jour par leur qualité — ✅ 20/10 16:30 (médiane pondérée 1 / demi-largeur², n effectif de Kish).
  - [x] I127b mesurer la luminance du visage dans la rafale native pour affiner le poids (lumière). — ✅ 20/10 18:30 :
    `values.light` (médiane de la luminance Rec. 601 du recadrage 256 px des images valides) ; `lightPenalty` ×1,15
    hors [0,25 ; 0,8] (le natif rejette < 0,15 et > 0,9), « peu nette », `day.lighting`, phrase « souvent dans la
    pénombre » / « lumière souvent trop vive », diagnostic `estimate.lighting`. `FACE_QUALITY_KEYS` (yaw, light,
    affectGap, affectFrames, affectModels) exclus des indices de `gateDays` : la lumière est du contexte, pas de
    l'émotion (anti-circularité).
    - [ ] Recaler 0,25 / 0,8 sur la répartition réelle de l'A56 (luminance du recadrage, intérieur le soir) ; si la
      plupart des lectures du soir tombent sous 0,25, abaisser le seuil plutôt que pénaliser toute la soirée.
    - [ ] Vérifier qu'aucune estimation du soir n'est systématiquement décalée par la pénombre (valence moyenne
      selon la lumière, à lire sur 2 semaines de vraies lectures, sans afficher de valeur).
  - [ ] Essai XNNPACK si la latence A56 dépasse 150 ms / image.
- [ ] ~~Étape 2 (plan initial)~~ : run idées → comparatif (HSEmotion `enet_b0_8_va_mtl` /
  `mbf_va_mtl`, EmoNet, DDAMFN, modèles AffectNet-VA récents ; précision CCC valence / éveil sur AffectNet, AFEW-VA ;
  taille ; latence A56 LiteRT / ONNX Runtime + NNAPI / GPU ; **licence des poids** — le run du 13/10 avait noté « poids
  HSEmotion VA sans licence affichée, appris sur AffectNet (recherche non commerciale) » : à trancher, alternatives
  sous licence claire) → conversion, téléchargement au build (empreinte SHA-256), `FaceVa.java` sur le recadrage du
  visage déjà calculé, `values.valence` / `values.arousal` dans `face_burst` (v2, rétrocompatible), `faceMood` les
  préfère à l'a priori ; test d'équivalence hors app.
- [ ] **Étape 3 — fusion visage + voix** (dictée du soir I117 puis prosodie) ; « accord entre signaux » dans la
  confiance. **Run idées 20/10 08:30 (I128)** : aucun modèle vocal valence / éveil à la fois léger et sous licence
  permissive (Wav2Small / audEERING : CC BY-NC-SA recherche ; WavLM Odyssey : MIT mais 316 M param.) → étape 3 =
  visage + **phrase du soir** (I119, déjà là) puis dictée (I124 → I117) ; prosodie seulement avec un modèle sous
  licence claire (veille : licence d'accès MSP-Podcast, petits modèles Apache / MIT).
- [x] **I121 étendu (run 20/10 00:30)** : la calibration personnelle était trompée par les dérives lentes (simulé :
  modèle personnel adopté **sans aucun lien** dans 60 % des jeux à humeur AR 0,8 / visage AR 0,95 ; 25 % avec les blocs
  seuls) → `calibrateRidge(X, y, { dayNums })` validé par blocs ±7 j **et** seulement si la vérification visage ↔
  notes (`gate.js`) est réussie → ≤ 5 %. Prix : modèle personnel vers ~6 semaines de notes (au lieu de 14 jours).
- [x] Perf (04/11 17:35, mesuré puis mémoïsé) : `evaluateGate` était recalculé 3 fois par ouverture de la carte
  (carte, `faceMoodEstimate`, `testReadingEstimate`). Mesure sur PC, pire cas (aucun lien, porte fermée) : 23 ms à
  60 jours notés, 51 ms à 150, 101 ms à 365, 431 ms à 730 (≈ ×5 sur téléphone, ×3 appels). Cache par contenu
  (4 entrées, clé = date du regard + jours, copie rendue) : 2 calculs au lieu de 3 à la première ouverture, 0 ensuite
  tant que les notes ne changent pas. 3 tests dans `gate.test.js`.
- [ ] Retour du propriétaire : l'estimation est-elle plausible ? (« Tester maintenant » en souriant / sans sourire.)
- [x] **Facteurs X ↔ humeur estimée (run 20/10 04:30)** : `mood/faceMoodDays.js` — jour estimé si ≥ 3 lectures du
  déverrouillage avec visage (médiane des estimations, ligne de base calculée une fois par jour), notes remplacées par
  une « note » par jour à l'heure de la dernière lecture (ordre temporel, DAY_OVER_HOUR), puis
  `computeBasicCorrelations` (week-end, n effectif, BH) ; ≥ 14 jours ; aucun levier proposé. Section « Avec votre
  humeur estimée (visage) » dans Analyses, visible sans notes ; `ANALYSIS_LIMITS.face_burst = 10000` ; 9 tests.
  - [x] Habitudes (tags X) et effets décalés (`laggedEffects`) sur l'humeur estimée — ✅ 20/10 14:30 :
    `computeTagEffects(entries, { outcomeByDay })` (tags déclarés des notes, soirs mesurés comptés même sans lecture
    ce jour-là, stress côté Y exclu) ; `computeLaggedEffects` sur les entrées « humeur estimée », pistes retirées (D6) ;
    bloc « Vos habitudes et effets décalés » dans la section visage, incertains repliés ; +5 tests.
  - [ ] Prédiction du jour sur l'humeur estimée (Accueil) — à faire seulement quand ≥ 30 jours estimés.
  - [ ] Si > 10 000 rafales (~6 mois à 50 / jour) : lire les rafales par plage plutôt que les N plus récentes.
  - [ ] Plusieurs lectures par jour : comparer aussi l'humeur estimée **heure par heure** au temps par app de l'heure
    précédente (ordre temporel fin, `phone_apps` horaire déjà là).

## ✅ Signalement du propriétaire du 19/10/2026 15:05 — aucune lecture automatique au déverrouillage — RÉSOLU (capture du 20/10 19:05 : 44 lectures automatiques, estimation affichée)

- [x] **Corrigé (run 19/10 16:30)** : récepteur `USER_PRESENT` enregistré `RECEIVER_NOT_EXPORTED` → diffusion de
  SystemUI filtrée, aucun déverrouillage vu. Récepteur exporté (diffusions protégées) sur le fil du service +
  secours `face/UnlockWatch` (verrou interrogé 60 s après `SCREEN_ON`, écran allumé déjà déverrouillé ; testé JVM) ;
  diagnostic v2 (allumages, déverrouillages par source, dernier, `startOrigin`, `cameraOp`, 12 tentatives + erreur
  exacte) ; état « À relancer » + `start({ restart: true })` ; guide Shizuku / ADB (I89 caméra).
  - [ ] Run idées 19/10 20:30 : correctif vérifié fusionné (v176, puis v177) ; arbre de lecture du diagnostic prêt
    (I122, IDEES.md).
  - [ ] **Retour du propriétaire** : diagnostic exporté après 2–3 déverrouillages à l'empreinte (lignes « Aujourd'hui :
    écran allumé… », « Accès caméra… », « Dernières tentatives… »).
  - [ ] Si `camera_disabled` / `camera_denied` au déverrouillage malgré `startOrigin = app` : relancer le service à
    chaque retour dans l'app (`restart`) tant que `cameraOp ≠ allow`, ou insister sur l'accès permanent.
  - [ ] Si « verrou interrogé » ne voit rien non plus : interrogation périodique écran allumé (toutes les 2 min) en
    dernier secours, et `KEYGUARD_HIDDEN` d'UsageStats (déjà lu par `PhoneUsagePlugin`) pour compter après coup.

## 🚑 Signalement du propriétaire du 19/10/2026 08:37 — carte « Lecture du visage » introuvable

- [x] **Corrigé (run 19/10 10:30)** : la carte n'était en tête que si la lecture était déjà activée, sinon repliée
  sous « Brancher une autre source ». Désormais épinglée juste sous « Mes appareils » dans l'app Android (activée ou
  non), « Réessayer » si le plugin natif ne répond pas ; test Android natif dans `Connectors.test.jsx`.
  - [ ] **Retour du propriétaire** : la carte est-elle visible après la mise à jour (version ≥ celle du 19/10 ~11 h,
    Plus → Nouveautés) ?

## 🔴🔴 Consigne du propriétaire du 18/10/2026 au soir — PRIORITÉ UNIQUE (charte §00000)

« Concentration maximale sur la collecte entièrement automatique du bien-être. » Plan et décisions :
[`BIEN-ETRE-AUTO.md`](BIEN-ETRE-AUTO.md). Tous les runs de code sur ce chantier ; runs idées : veille dessus.
**En pause** : A.1–A.3 (livrés de toute façon), D1 nettoyage, D2 performance, C7 interconnexion (sauf panne,
PR rouge, régression bloquante, ou nettoyage imposé par la collecte automatique).
- [x] **État des lieux + plan** (run 18/10 22:30) : `BIEN-ETRE-AUTO.md`. Décisions : réseaux sociaux / usage du
  téléphone = X ; signaux physiologiques de la montre (stress / VFC, FC, sommeil) = X ; Y = visage, voix,
  auto-déclaration.
- [x] **Cœur Y / X + anti-circularité** : existant (`ESTIMATOR_INPUTS`, `antiCircularity.test.js`, ordre temporel).
- [x] **I88 ① service « Lecture du visage »** (run 18/10 22:30) : `FaceSenseService` (premier plan `camera`,
  `START_NOT_STICKY`, récepteur `USER_PRESENT` / `SCREEN_OFF`, rafale 1,2 s après le déverrouillage), `FaceCamera`
  (Camera2, YUV ≥ 320 × 240, 3 images espacées de 350 ms après 450 ms d'exposition, caméra fermée, rien sur le
  disque), `face/FaceFrames` (YUV → RVB tourné, testé), `face/FaceSchedule` (déverrouillage seulement + test, 2 min
  mini, 150 / jour, appel, écran, chaleur ; testé), `face/FaceRecord` (JSON scores seuls, testé), boîte
  `face-bursts/` (`CaptureInbox` à plafond 3 000), `FaceSensePlugin` (start avec permission, stop, test, status,
  list / remove, sortie d'optimisation batterie), carte `FaceSenseCard` en tête de Connecteurs (comptes seulement,
  « Relancer », « Sans restriction », diagnostic exportable `healthtrack-visage-*.json`).
  - [ ] **Retour du propriétaire** : diagnostic de l'A56 après quelques heures (tient-il en arrière-plan sur One UI ?
    taux de visages, rejets, temps, batterie, point vert).
- [x] **I90** (run 19/10 00:30) : `services/faceBursts.js` — rafales `face-bursts/` → entrées `face_burst` (source
  `face_sense`, `payload { v, trigger, frames, valid, values?, rejected, ms }`) à l'ouverture et au retour dans l'app
  (`useAutoSync`) et à l'affichage de la carte, en un lot sans doublon (`upsertEntries`), retirées après écriture
  réussie (illisibles retirées, échec d'écriture → tout gardé) ; `moodFaceBursts` = Y (déverrouillage + ≥ 1 image
  valide) ; test « composition » et « jamais une colonne / un facteur » dans `antiCircularity.test.js` ; masquées du
  journal de l'Accueil ; export / import JSON testés ; carte « N lectures gardées depuis le … » ; diagnostic
  `history { stored, forMood, firstAt, lastImport }`.
  - [ ] Si l'historique grossit (≈ 50 rafales / jour), le journal de l'Accueil lit 14 jours en `limit: 5000` : exclure
    `face_burst` à la lecture (index `type_at`) si les mesures de la montre s'en trouvent tronquées.
- [x] **I88 ② notification « Reprendre »** (run 19/10 04:30) : règle pure `face/FaceResume` (interrupteur allumé,
  service absent, app fermée, caméra autorisée ; ≤ 1 rappel / 6 h sauf après redémarrage / mise à jour),
  `FaceResumeNotice` (canal bas `face_resume`, « Reprendre » → `MainActivity` relance dans `onResume`, « Arrêter »),
  `FaceResumeJob` (~1 h, persisté, programmé à l'activation), `FaceResumeReceiver` (`BOOT_COMPLETED`,
  `MY_PACKAGE_REPLACED`) ; diagnostic `resume { notices, taps, lastCheck… }`. Pas de `getForegroundService` : un
  service caméra lancé hors de l'app visible n'a pas la caméra (Android 11+ ; type `camera` interdit au boot en 15).
  - [ ] **Retour du propriétaire** : la notification apparaît-elle juste après la mise à jour ? « Reprendre » relance-t-il ?
- [~] I89 guide Shizuku / ADB : **caméra livrée** (run 19/10 16:30 : guide dans le Diagnostic, `cameraOp` lu par
  `unsafeCheckOpNoThrow`, « accordé en permanence ») ; reste `RECORD_AUDIO allow` avec la voix (I117).
- [ ] I91 voix (prosodie, aucun audio gardé) → **précisé au run idées du 19/10 08:30 : I117** (dictée du soir, une
  prise de son `AudioRecord` lue deux fois — prosodie maison en direct + même PCM poussé en temps réel vers la
  reconnaissance : ML Kit GenAI *Basic* fr-FR `AudioSource.fromPfd`, sinon plateforme `EXTRA_AUDIO_SOURCE` API 33 ;
  rien sur disque ; texte → note et tags **proposés**). Voix de fond en continu (service `microphone`) **écartée pour
  l'instant** : npj Digit. Med. 2026 → texte R² 0,34, audio 0,06, intra-personne ≈ hasard ; à reconsidérer si la
  prosodie passe la porte chez le propriétaire.
- [x] **I119** (20) ✅ **livré le 19/10 18:30** — `services/mood/lexicon.js` (`FEELING_WORDS` → note + tag `stress`,
  `CONTEXT_WORDS` → tags X ; mot à mot, négation, intensifs) ; test d'intersection vide ; champ « En une phrase » dans
  la saisie bien-être (dictable au micro du clavier), propositions à toucher, phrase jamais enregistrée.
  - [ ] Retour du propriétaire : propositions justes ? mots ratés → enrichir le lexique. (FEEL : aucune licence
    trouvée ; NRC-FR : recherche seulement / licence commerciale payante, traduction automatique → **pas d'import**,
    run idées 19/10 20:30.)
  - [ ] I117 natif (prosodie) seulement si la prosodie a une chance de passer la porte ; la dictée du clavier couvre
    déjà le texte.
- [x] **I116** (25) ✅ **livré le 19/10 12:30** (PR « [Auto] Temps par app », `services/phoneApps.js`, `queryAppEvents`, facteurs `social_minutes` / `messaging_minutes` / `video_minutes` / `game_minutes` neutres, à valider sur l'A56 : écart avec Bien-être numérique de One UI) — temps au premier plan par app comme **X** : `queryEvents` garde `ACTIVITY_RESUMED / PAUSED /
  STOPPED` + paquet (le plugin lit déjà l'écran et `KEYGUARD_HIDDEN`, accès déjà accordé) ; catégories par
  `ApplicationInfo.category` + `<queries>` `MAIN/LAUNCHER` + petite table de repli ; entrée `phone_apps` (jour + par
  heure, `social` / `messaging` / `video` / `game` / `news`) ; facteurs sans sens présupposé, minutes **avant** la
  note ; test anti-circularité ; une ligne dans la carte Temps d'écran. **Prochain run de code conseillé** (petit,
  sans dépendre du diagnostic de l'A56).
- [x] **I118** (16) ✅ **livré le 19/10 14:30** (PR « [Auto] Visage : 2e essai et lectures par jour ») — natif :
  `FaceSchedule.shouldRetry` (une fois par déverrouillage, 2 s après une rafale sans aucune image exploitable, jamais
  au-delà de 10 s après le déverrouillage, jamais pour le test) ; le 2e essai ne compte ni comme déverrouillage ni comme
  rafale du jour, compteurs `retries` / `retryFaces`. Intervalle minimal : déjà 2 min (inchangé). JS :
  `faceDailyCounts` (médianes sur les 7 derniers jours terminés où la lecture a tourné : déverrouillages lus du temps
  d'écran, lectures, lectures avec un visage, objectif 12) → diagnostic `perDay`, `retries` + 2 lignes. **À valider sur
  l'A56** : la ligne « Par jour » du diagnostic après une semaine ; si < 12 avec un visage, voir les motifs d'écart.
- [ ] I120 (9) intra-journée (rafale ↔ catégories d'apps dans l'heure d'avant), seulement porte ouverte.
- [x] **I112 porte** (run 19/10 02:30) : `services/mood/gate.js`, fonctions pures — `gateDays` (note moyenne du jour ×
  médianes des rafales `moodFaceBursts`), `faceIndexLoo` (un seul indice combiné : Ridge LOO sur indices
  standardisés, **λ = 10 fixé d'avance**, indices lus < 80 % des jours écartés), `jackknifeCorrelation`, `evaluateGate`
  (regards hebdomadaires recalculés, rien de stocké : ouverte à z ≥ 3,29 deux regards de suite avec ≥ 30 jours ;
  refermée si z < 1,5 deux regards de suite sur les **8** dernières semaines ; après refermeture, seuls les jours
  suivants comptent ; `periods`, `looks`). z unilatéral : le sens de chaque indice est appris, seule compte une
  prédiction qui suit les notes. Simulé (`gate.test.js`, graines fixes) : 0,5 % de faux départs en 120 j ; lien net
  (ρ visage ↔ humeur 0,7, ±) ouvert à J90 dans 90 % ; vrai lien refermé ≤ 15 % (7 %) ; lien disparu → refermé en
  ≈ 5 semaines. Carte : « Calibration : N jours sur 30 … » (`describeGate`) ; diagnostic `gate { state, days, needed,
  z, openedAt, closedAt, looks }`.
  - [ ] Écart à la spec I112 : « 6 semaines, z < 2 » refermait 40 % des vrais liens (fenêtre de ≈ 32 jours notés trop
    bruitée) → 8 semaines, z < 1,5. À revoir avec de vraies données.
  - [ ] Puissance modeste pour un lien moyen (ρ 0,5 : 34 % à J90, 60 % à J120) : I113 (notes plus régulières) aide.
- [x] **I121** (20) **porte robuste aux dérives lentes — livrée le 20/10 00:30** (`mood/blockCv.js` : blocs ±7 j,
  z × √((1 − a)/(1 + a)) ; `detrendFace` adaptatif si la dérive médiane du visage > 0,5 ; simulé sur 200 jeux :
  0,6 / 0,6 → 1,5 %, 0,8 / 0,95 → 2,5 % (12,5 % avant), jours indépendants 1 %, puissance à J90 inchangée 83 % ; mais
  0,7 de lien avec dérives → ≈ 35–38 % à J90 : le prix de l'honnêteté). Diagnostic : `gate.a`, `gate.drift`,
  `gate.detrended`. Détail d'origine : (run idées 19/10 20:30) : la simulation avec le
  vrai `gate.js` montre 12,7 % de faux départs en 120 j quand humeur et visage sont autocorrélés 0,6 / 0,6 (22 % à
  0,8 / 0,95), contre ≈ 1 % avec des jours indépendants (seul cas testé dans `gate.test.js`). Correctif simulé :
  validation croisée **par blocs** (apprendre sans les 7 jours avant / après) + z × √((1 − a)/(1 + a)) (n effectif)
  → ≈ 1–2 % ; option écart à la moyenne des 14 j précédents si la dérive reste forte. Ajouter le cas AR(1) aux tests,
  exposer `gate.a` dans le diagnostic. Script : `journal/protocoles/porte-autocorrelation-sim.test.js`.
- [ ] I115 estimation du jour avec fourchette (seulement `gate.state === 'active'`, jamais enregistrée comme une note ;
  **après I121**).
- [ ] **I122** (20) arbre de lecture du diagnostic de l'A56 (IDEES.md, 19/10 20:30) : à appliquer dès que le fichier
  arrive.
- [x] I123 (15) bouton « Applis jamais en veille » (lien direct Samsung `activity_type` 2), Samsung seulement, si le
  service a été retrouvé arrêté sans mise à jour ni redémarrage. → ✅ 20/10 06:30 : `faceStopCause` (`lastUpdateAt`
  = `PackageInfo.lastUpdateTime`, `bootAt` = maintenant − `elapsedRealtime`, comparés à `startedAt`) ; bouton dans la
  carte (arrêt « téléphone ») et dans le Diagnostic (Samsung) ; `<queries>` `com.samsung.android.lool` ; diagnostic v4.
  - [ ] Vérifier sur l'A56 que l'intention ouvre bien la liste « Applis jamais en veille » (One UI 8) et non
    « Applis en veille » ; sinon essayer `activity_type` 0 / 1 et noter le bon numéro ici.
  - [ ] Si la cause « téléphone » revient malgré la liste : lire `ApplicationExitInfo` (API 30,
    `getHistoricalProcessExitReasons`) dans le statut pour la raison exacte (REASON_USER_REQUESTED, LOW_MEMORY,
    FREEZER…).
- [x] I124 (12) sonde vocale dans le diagnostic (moteur local, fr-FR, service par défaut) avant tout I117 natif.
  → ✅ 20/10 12:30 : `VoiceProbePlugin.probe` + `services/voiceProbe.js` (verdict `on_device_fr` / `_pending` /
  `_downloadable` / `on_device_no_fr` / `on_device_unknown_language` / `online_only` / `none`), diagnostic v5 `voice`,
  sonde lancée une fois à l'ouverture du Diagnostic ; aucun micro.
  - [ ] Lire le bloc `voice` du diagnostic de l'A56 → choisir la voie I117 (plateforme sur l'appareil, ou bouton
    `triggerModelDownload` si français téléchargeable, sinon ML Kit / Vosk selon licence).
- [ ] I125 (8) « Rien reconnu — me le signaler ? » sous la phrase du soir (mots tapés par la personne, rien gardé).
- [x] I113 note du soir d'un geste depuis la notification (calibration, optionnelle). → ✅ 19/10 06:30 (6 boutons 0–5, vue personnalisée).
- [ ] Mesurer la consommation réelle (diagnostic : batterie au démarrage / maintenant, temps caméra) et la noter ici.

## 🔴 Consigne du propriétaire du 18/10/2026 — remplacée le soir même par la consigne ci-dessus (charte §0000)

- [x] **A. Régression écran montre (capture 18/10 11:06)** — livré au run du 18/10 12:30 : délai maximal par étape
  du test (`STEP_TIMEOUTS`, `utils/withTimeout.js`), verdicts `timeout` / `busy` / `in_use`, test sous le verrou de
  la synchro (ne coupe plus une synchro en cours), filet de 150 s ; détection des apps bornée (`detectWithLauncher`) ;
  « Libérer et appairer » : appairage lu séparément des apps, `setupPlan({ connectedAt })` → tout coché quand
  HealthTrack synchronise (`lastConnectedAt` gardé dans l'état de la synchro auto) ; libellé « N nouvelles mesures /
  déjà à jour » ; contrôle des pas du jour (`stepsCheck`, ligne « pas du jour » dans le journal).
  - [ ] À confirmer sur la vraie montre : journal après « Relancer le test » (quelle étape calait : apps ? scan ?).
  - [ ] Si « pas du jour » montre total < minutes : revoir `parseTotals` (7/0x03) sur la GT 6 Pro.
- [ ] **B. Estimation automatique du bien-être** : D4 (visage / voix, I100 ① + I106, I110) et D5 passent devant D1
  et D2. Livrer par étapes testables et fusionnables.
  - [x] **I100 ① a** (run 18/10 14:30) : post-traitement Java du visage, sans Android (`com.healthtrack.app.face` :
    `FaceGeometry`, `FaceIndices`, `FacePipeline`) + vecteurs figés sur un portrait NASA du domaine public (I106),
    écrits par `protocoles/visage-vecteurs.py` ; convention des demi-pixels tranchée (0,4 px médian de MediaPipe) ;
    `npm run test:java` couvre `huawei` et `face`.
  - [x] **I100 ① b** (run 18/10 18:30) : LiteRT **1.4.2** (zéro dépendance transitive ; la 2.x tire `ai-delivery`
    des services Play → écartée), tâche Gradle `faceModels` (URL versionnée `float16/1`, cache Gradle, 3 essais,
    4 SHA-256), assets non compressés projetés en mémoire, `abiFilters` arm64 (x86_64 seulement pour l'émulateur de CI) (I95), `LiteRtModel` (sorties
    par nom) + `FaceModels`, test instrumenté `FaceModelsTest` sur l'émulateur de la CI (I101), bloquant.
    - [ ] Budget de taille d'APK en CI (I95, seconde moitié) : v166 6,8 Mo → ≈ 15 Mo attendus (modèles 3,7 + `.so`
      arm64 4,5, non compressés) ; piste `useLegacyPackaging` (≈ −2,5 Mo) si besoin.
  - [ ] **I88** service + rafales, puis diagnostic exportable ; **I90** indices → entrées `face_burst` dans IndexedDB
    (scores seuls), écart à la plage personnelle ; **I110** porte d'entrée avant tout affichage.
    **Précisé au run idées du 18/10 20:30** (`IDEES.md`, simulation `protocoles/humeur-etiquettes-sim.py`) :
    - [ ] **I114** (score 25, dans la PR I88/I90) : rafales **au déverrouillage seulement** pour l'humeur (champ
      `trigger: 'unlock' | 'inUse'`, les rafales en cours d'usage restent en diagnostic) + test anti-circularité
      « composition » (sinon « réseaux sociaux → humeur » fabriqué : r ≈ 0,1–0,2 sans aucun vrai lien).
    - [ ] **I112** (20) : porte I110 au niveau du jour (note du soir × moyenne des rafales du déverrouillage), un seul
      indice combiné en validation croisée, |z| ≥ 3,29 (jackknife) à **deux regards hebdomadaires consécutifs**,
      ≥ 30 jours notés, refermeture ; simulé : 2 % de faux départs à 4 mois, signal réaliste ouvert chez ≈ 1 sur 2 à
      2 mois, 3 sur 4 à 3 mois. `services/mood/gate.js`, fonction pure.
    - [x] **I113** (15) : note du soir **d'un geste depuis la notification** (5 boutons, file native vidée à
      l'ouverture, même schéma qu'une note saisie) — la régularité de la note divise par deux l'attente (simulé).
      Peut se faire **avant I88** (indépendant du visage, utile tout de suite : moins de saisie, plus de notes).
    - [ ] **I115** (12) : une fois la porte ouverte, le visage complète les jours **sans** note (en mots + fourchette,
      jamais enregistré comme une note, jamais réinjecté dans la calibration).
    - Écartés : micro-questions au déverrouillage (moins efficaces que la note du soir), rafales déclenchées par
      l'ouverture des réseaux sociaux (biais de composition), modèle entre personnes, énergie lue dans les yeux sans
      étiquette.

## ⌚ D3 EN MAINTENANCE (15/10/2026) — ex-priorité absolue du 12/10 au soir

**15/10, propriétaire : « Ça marche côté montre, plus besoin de se concentrer là-dessus ».** D3 n'est plus traité
en premier : seulement régression, journal de diagnostic du propriétaire, ou complément utile (stress, VFC de journée,
séances auto, resynchro de fond). **D1 (nettoyage de l'UI) repasse en tête.** Historique ci-dessous.


HealthTrack devient l'app principale de communication avec la ou les montres, sans Gadgetbridge ni app constructeur,
jusqu'à ce que la GT 6 Pro du propriétaire remonte ses données. Texte complet : charte §000. Spécification du
protocole : `protocoles/huawei.md` (réimplémentation totale, jamais de code Gadgetbridge). Étapes (a) → (d) en D3 ci-dessous.

## ⚠️ Directives du 12/10/2026 — chantiers D1 → D6, dans cet ordre, avant toute nouvelle fonctionnalité

Texte complet : charte §00. Les chantiers C1–C9 plus bas passent **après** (sauf ce qui sert directement un D).

### D1 — Passe de nettoyage (ne jamais demander ce que l'app capte déjà)
Inventaire du 12/10 16:30 Paris (captures `npm run visual`, chaque page lue) — ✅ fait ce run, ☐ à faire :
- [x] Check-in : « Écran tard » plus demandé quand la capture « Temps d'écran » est active ; « Vos habitudes » le
      compare d'après le téléphone (≥ 30 min entre 22 h et 4 h), la mesure prime sur un tag déclaré, anciens tags gardés
- [x] Accueil : carte « Humeur estimée » retirée (doublon de « Prédiction du jour » + entrées comportementales = cercle
      interdit par D5) ; service `moodEstimate.js` gardé pour sa calibration (réutilisable en D4)
- [x] Paramètres : lien « Nouveautés » en double retiré (déjà dans Plus) ; mode debug déverrouillé par adresse MAC
      saisie à la main → simple interrupteur « Mode diagnostic » (servira l'écran de diagnostic de D3)
- [x] Analyses : titre « Recommandations » → « Analyses », onglets « Analyse simple / avancée »
- [ ] Check-in, suite : « Sport le soir » auto-détecté depuis les séances Health Connect (début ≥ 18 h) quand une
      montre envoie des séances ; « Repas tardif » depuis l'heure des repas saisis (mais un repas non saisi ≠ pas de
      repas tardif → seulement si l'utilisateur saisit ses repas régulièrement) ; « Voyage » depuis un changement de
      fuseau horaire
- [x] Accueil : explications de méthode des 3 cartes repliées sous « Comment c'est calculé » ; conseil de régularité
      présenté comme hypothèse générale (D6) (run 12/10 18:30 Paris)
- [x] Accueil, suite : « Radar forme » + « Votre cœur vs votre norme » + « Régularité du sommeil » → un seul bloc
      « Votre forme », une seule explication de méthode (run 14/10 14:30)
- [x] Analyses : « Écran tard » apparaît 2 fois (tag mesuré dans « Vos habitudes » + variable continue « Écran tard
      (veille au soir) » dans les corrélations) → n'en garder qu'une présentation
- [x] Analyses : la liste des corrélations affiche ~45 variables dont ~35 « incertaines » pâles → n'afficher que les
      liens au moins « à confirmer » + « voir les N autres »
- [x] Paramètres : la configuration Withings (Client ID / Secret / URL) est dans Paramètres, l'interrupteur dans
      Connecteurs → tout regrouper dans la carte Withings des Connecteurs
- [x] Accueil : « + 1 cigarette » seulement si une cigarette notée ces 14 jours, ou épinglé dans Paramètres → Cigarettes
      (run 12/10 18:30 Paris ; écran tard dédoublonné, corrélations incertaines repliées, Withings regroupé : même run)
- [x] Connecteurs : intro + 6 blocs empilés → ordre par statut (ce qui envoie en tête, le reste replié sous « Brancher
      une autre source ») ; pastilles techniques masquées sur une source désactivée ; `--border` défini (run 14/10 14:30)
- [x] Accueil, journal du jour : une ligne par cigarette → une seule ligne « Cigarettes 09:10 · 11:11 · 13:12 »
      (« Supprimer » = la dernière) ; tag déclaré « Écran tard » masqué un jour où l'écran est mesuré ; sous-titre
      « Moyenne par jour — données locales uniquement » du graphique bien-être retiré (run 15/10 18:30)
- [x] Paramètres : Gemini en un paragraphe (5 → 2 blocs de texte), modèle replié sous « Choisir le modèle »,
      interrupteurs Cigarettes / Diagnostic à libellé fixe et explicite (run 15/10 18:30)
- [x] Accueil : « Prédiction du jour » en une seule ligne sous la courbe (carte au-dessus retirée), explication
      repliée ; hypothèse « horaires réguliers » repliée en une ligne (I87, run 15/10 22:30)
- [x] Relire la page Données et Nutrition (run 16/10 02:30)
- [x] **I85 ①** « Sport le soir » déduit des séances (montre / Health Connect, début ≥ 18 h, ≥ 10 min) : masqué
      dans la saisie s'il y a une séance enregistrée ces 14 jours ; le tag déclaré compte encore (OU), jours hors
      de la plage des séances non lus comme « sans » ; Analyses : « déduit de vos séances » (run 15/10 22:30)
- [x] **I85 ②a** « Repas tardif » déduit des repas notés (≥ 21 h ou avant 4 h la nuit suivante ; soir connu
      seulement avec ≥ 2 repas notés ; tag déclaré compte encore) ; masqué dans la saisie si ≥ 2 repas notés sur
      7 des 14 derniers jours ; le radar lit les tags mesurés (séance du soir, repas tardif) (run 16/10 04:30)
- [x] **I85 ②b** « Voyage » d'un changement de fuseau : entrée légère `context` (`{ date, tz, tzOffset }`, une par
      jour et par fuseau, à l'ouverture et au retour dans l'app, exportée) ; jour = voyage si le nom du fuseau diffère
      de l'entrée précédente (≤ 3 jours avant ; l'heure d'été ne compte pas) ; tag déclaré compte encore ; masqué dans
      la saisie le jour du changement seulement ; Analyses « déduit des changements de fuseau horaire » ; Radar forme
      (run 17/10 10:30). Piste : lieu (géolocalisation grossière) pour les trajets dans le même fuseau.
- [x] **I86** (04/11 00:35, partie « masquer ») : « Masquer ce lien » / « Masquer cette piste » derrière le chevron de
      chaque lien et piste à tester des Analyses ; « N liens masqués · Tout réafficher » en bas ; réglage local
      `healthtrack_hidden_links` (`settings/hiddenLinks.js`), joint à l'export JSON (`hiddenLinks`, remplacer / réunir à
      l'import, anciens fichiers acceptés), effacé avec « Supprimer toutes les données » ; la carte lilas de l'Accueil
      ne cite plus une piste masquée. Aucun calcul changé (comparaisons multiples inchangées). **04/11 01:35** : pistes
      repas → ventre aussi (`GutLinks`, clé `gut:<aliment>` tous délais confondus, « Vous avez masqué toutes les pistes
      du ventre. », compteur et carte lilas suivent). Reste : « force et confiance séparées, en mots » (I87).

### D2 — Performance (mesurer d'abord)
- [x] Mesure : `npm run perf` (build de prod, 3 ans de démo, `--dense`, CPU ×4) — temps stabilisé, temps bloquant,
      lectures IndexedDB par page (run 14/10 00:30 ; chiffres dans son compte rendu). Reste : profil fin des calculs
- [x] `listEntries` / `getLatestEntryAt` / `listEntriesForAnalysis` : requêtes par index et par plage, index
      `type_at` (schéma v3) — Accueil 3 046 → 1 289 ms, 128 552 → 16 884 enregistrements lus (run 14/10 00:30)
- [x] **I82** (livré 16/10 00:30 : Accueil 1 954 → 546 ms, 107 k → 12,5 k enregistrements lus avec 30 j de SpO₂ minute) (run idées 15/10 20:30, score 20) : **SpO₂ de la montre en tranches de 10 min** (min / moyenne / max / n)
      au lieu d'une entrée `heart_rate` par minute (`devices/huawei/sync.js`), migration rétrocompatible de l'existant,
      Accueil (`HealthRadar`, `BaselineCards`) qui ne lit que les sous-types utiles ; démo `--dense` enrichie d'une
      SpO₂ minute pour reproduire le cas réel du propriétaire, chiffres avant / après
- [x] Accueil : `HealthRadar` et `BaselineCards` lisent FC repos / VFC **par sous-type** (schéma v4, index
      `type_subtype_at`, `listEntries({ subtypes })`) au lieu de toute la FC : 706 → 403 ms, 16 210 → 3 988
      enregistrements lus (3 ans `--dense --spo2=slot`, run 17/10 00:30)
- [x] Accueil : « Vos derniers jours » (`loadJournalEntries`) — **mesuré le 03/11 07:35, rien à faire** : la fenêtre
      est déjà réduite à 3 jours + la veille ; `npm run perf -- --dense --spo2=slot` (53 639 entrées, 3 ans, CPU ×4) :
      Accueil 913 enregistrements lus, 360 ms, tâche la plus longue 29 ms ; Journal 718 ms ; Analyses 452 ms ; aucune
      page au-delà de 0,75 s
- [ ] Cache d'agrégats journaliers / hebdo précalculés, invalidés à l'écriture (`health-entries-updated`) — **pas utile
      aujourd'hui** (mesure du 03/11 ci-dessus) ; à rouvrir si une page dépasse 1 s chez un testeur
- [x] **I83-jour** (04/11 18:35) Historique du bien-être, vue Jour : un point par heure au-delà de 24 lectures
      (`DAY_MAX_POINTS`), moyenne du jour sur les lectures ; `npm run visual -- --face-dense`. Les autres courbes lisent
      déjà des agrégats journaliers (rien à réduire aujourd'hui).
- [ ] **I83** (score 16) : courbes à résolution adaptée — MinMaxLTTB (`utils/downsample.js`) au-delà de ~2 points
      par pixel, périodes longues servies par les agrégats ci-dessus
- [x] Web Worker pour l'analyse + cache des résultats invalidé à chaque écriture (révision des données) : Accueil
      1 289 → 271 ms, Analyses 1 503 → 295 ms ; garde-fou « aucun écran n'importe un calcul lourd » (run 14/10 04:30)
- [x] Code splitting : pages en `React.lazy` (sauf l'Accueil), table Ciqual chargée à la demande
      (`data/nutritionTable.js`, `ingredientNames.js` supprimé = clés de la table), JSON en `JSON.parse` : fichier
      principal 2 125 → 514 ko, temps bloquant de chaque page 100–150 → 0–17 ms ; CSS gardé d'emblée dans l'ordre
      d'origine (`pageStyles.js`) ; garde-fou `bundleGuard.test.js` (run 14/10 06:30)
- [x] Nutrition par index (28 → 5 lectures) ; `upsertEntries` par source et plage (run 14/10 16:30, PR #158)
- [ ] Sous-échantillonnage des longues séries, graphiques chargés en différé
- [x] Test anti-régression : Vitest échoue si une lecture filtrée relit tout le magasin (run 14/10 00:30)
- [x] Budget `npm run perf` en CI (lectures par page ≤ N, temps bloquant de l'Accueil) — job `perf-budget` de `tests.yml`
      (`npm run perf -- --budget`, `scripts/perf/budget.json`) ; constaté le 04/11 14:35
- [x] Accueil : `WellbeingCharts` lit encore `listEntriesForAnalysis` (≈ 15 k entrées) → agrégats journaliers — constaté le
      04/11 14:35 : il lit `listEntries({ type: 'wellbeing', since, limit: 2000 })` et vit dans Tendances
- Piste détaillée (run idées 12/10 20:30, I43) : index composé `[type, date]` (migration = ajout d'index seul),
  `listEntries({types, from, to})` par `IDBKeyRange`, magasin `daily_agg` versionné, LTTB ≥ 2 000 points dans un Worker,
  test « Accueil lit ≤ N entrées » — `localHealthStorage.js` fait aujourd'hui 7 `getAll()` sur tout le store

### D3 — Huawei Watch GT 6 Pro en direct (sans Gadgetbridge) — 🎯 PRIORITÉ ABSOLUE
- [x] **(d quinquies) Fenêtre et totaux** (run 14/10 12:30, journal v124) : fenêtre jamais vide (1re synchro depuis 2000,
      reprise − 6 h, état v2), totaux du jour stockés (`period: 'day'`, max avec les heures), messages spontanés nommés
      (aucune mesure, spec §7.9), trames « ? » expliquées, course « message chiffré avant la clé » corrigée
- [x] **UI montre nettoyée** (consigne du 14/10, run 12:30) : une carte = état + « Synchroniser la montre » ; « Diagnostic »
      replié pour tout le reste
- Cause probable de l'échec actuel (run idées 12/10 20:30, I39) : montre liée à Huawei Santé → « Authentication key
  negotiation failed » ; sorties documentées = réinitialisation d'usine puis appairage à HealthTrack seul, ou
  identifiant de compte Huawei (17 chiffres) pour garder Huawei Santé
- **Découverte du run 12/10 22:30** : les GT 3 → GT 7 (dont la GT 6 Pro) parlent en **Bluetooth classique (RFCOMM)**,
  service SDP `82FF3820-…`, pas en BLE GATT ; montre appairée à Android requise. Mode d'authentification attendu :
  HiChain (étiquette 7 des paramètres du lien) — à confirmer par le journal du propriétaire
- [x] **(a) Diagnostic** (run 12/10 22:30) : couche protocole (trame, CRC, TLV, tranches, paramètres du lien décodés
      dont le mode d'authentification), transports RFCOMM (plugin natif `BtClassicPlugin.java`) puis BLE FE86, écran
      « Montre Huawei en direct » dans Connecteurs (7 étapes, verdict, apps concurrentes repérées), export du journal
      (Documents ou presse-papiers, sans MAC complète), spécification `protocoles/huawei.md`
- [ ] **Lire le journal du propriétaire** (`journal/diagnostics/` ou ce qu'il fournit) dès qu'il arrive → ajuster (b)/(c)
- [x] **(b) Détection et libération** (run 13/10 00:30) : encadré « Libérer et appairer la montre » sous le test
      (`setup.js` + `WatchSetup.jsx`) : app qui tient la montre → « Désinstaller » (`ACTION_DELETE`,
      `REQUEST_DELETE_PACKAGES`, `AppManagerPlugin.java`) ou « Réglages » ; réinitialisation guidée (menu Huawei
      officiel) ; plan B identifiant de compte Huawei (17–19 chiffres, gardé en local) ; jamais « dissocier »
- [x] **(b bis) Assistant d'appairage Android** (run 13/10 00:30) : `BtClassic.discover` (recherche classique) +
      `pair` (`createBond`, attente de l'état), ancien appairage d'avant la réinitialisation détecté → réglages Bluetooth
- [ ] À vérifier sur la vraie montre (journal du propriétaire) : la recherche classique trouve-t-elle la GT 6 Pro sur
      son écran d'appairage ? Boîte Android (code à comparer ?) ; verrou antivol après réinitialisation ?
- [ ] Le diagnostic n'est pas assez sûr pour dire « liée à une autre app » quand l'app a déjà été désinstallée : à
      l'étape (c), un échec d'authentification (« key negotiation ») le prouvera → afficher alors l'étape « Réinitialiser »
- [x] **(c) Authentification** (run 13/10 02:30) : HiChain écrit depuis la spec §6 (état 1/0x16, négociation 1/0x33,
      PIN 1/0x2C, liaison + authentification 1/0x28, clé des trames HKDF, chiffrement GCM / CBC à compteur), Web Crypto,
      clés en local (`healthtrack_watch_keys`) ; encadré « Connexion à la montre » (`WatchConnect.jsx`) ; constantes du
      PIN **téléchargées sur le téléphone** (huawei-lpv2, MIT) ou collées, jamais dans le dépôt ; `groupId` calculé
      (SHA-256 de « health_group_name|com.huawei.health ») ; fausse montre de test (`testing/fakeWatch.js`)
- [x] **(a bis) Analyse sûre des réponses 0x28** (run 13/10 11:04) : déclenché par le **1er journal de la vraie GT 6 Pro**
      (`diagnostics/2026-10-13-0904-gt6pro.json`). `inspectHichainReply` (hichain.js) + capture dans `report.hichain`
      (classification, `message`, `errorCode`, `resultCode`, `type`, tailles d'étiquettes, **noms** des champs JSON, 1ers
      octets si non-JSON — jamais de valeur) ; l'écran nomme l'étape et le code exacts. Spec `protocoles/huawei.md` §6.7
- [ ] **(c bis) Valider sur la vraie GT 6 Pro** (journal `healthtrack-connexion-montre-….json`) :
      🩺 **Journal du 13/10 09:04 reçu** → HiChain 3 (type 4, GCM, authVersion 1), appairage bloqué au **décodage de la
      réponse 0x28 (835 octets)** après l'envoi du message de début (695 octets), **sans code 0x7F** (§6.7).
      Établi (run 14:30) : l'étiquette 1 de cette réponse **n'est pas du JSON** → format « New Auth Protocol » (§6.8).
      **Point du PIN tranché** : GCM/CBC dépend de `encryptMethod` (0x0C), pas du type 4 → CBC pour la GT 6 Pro, ce que
      `decryptPin` fait déjà ; **rien à changer** (l'hypothèse GCM en type 4 était fausse). Reste : reprise auto après
      « jeton différent »
- [x] **(a ter) Instrument renforcé : révéler les champs de la réponse HiChain 3** (run 13/10 14:30) : `inspectHichainReply`
      sonde une réponse non-JSON et rapporte, **sans valeur**, un JSON intégré (`offset`, `message`, noms des champs) ou des
      TLV imbriqués ; `head` 12 → 32 octets ; l'écran nomme les champs repérés ; `report.hichain[].structure` dans le
      journal ; fausse montre `newAuthHichain`. Spec `protocoles/huawei.md` §6.8 (recherche New Auth : SPEKE/STS, X25519,
      Ed25519, HKDF/HMAC, AES-GCM, codes de messages, champs — même Gadgetbridge ne décode pas encore la GT 6 Pro)
- [x] **(a quater) Instrument : taille de chaque champ de la réponse HiChain 3** (run 13/10 18:30) : `probeStructure`
      rapporte, à côté de `payloadKeys`, deux listes **de tailles seulement** (`fields`, `payloadFields`) — octets pour un
      hexadécimal, caractères pour une autre chaîne, type sinon ; **jamais la valeur**. L'écran et le journal affichent
      « champs repérés : challenge (16 o), epk (32 o), salt (16 o) ». Objectif : décoder la réponse d'un **seul** journal
      (noms + tailles + code de message), sans second aller-retour. Testé (fausse montre + réponse d'exemple avec
      signature 64 o et champ en clair ; vérif anti-fuite). Spec §6.7.
- [x] **(c bis) Primitives crypto « New Auth Protocol »** (run 13/10 16:30) : X25519 (multiplication scalaire sur point
      **quelconque** pour le SPEKE, ECDH, paire de clés) et Ed25519 (signature / vérification / clé publique) ajoutés à
      `crypto.js` sur **@noble/curves** (MIT), vérifiés sur vecteurs RFC 7748 / 8032 (8 tests). HKDF/HMAC/AES-GCM existaient.
      @noble car Web Crypto ne fait X25519 que sur la base standard (pas de point dérivé) et marche sur toute WebView.
      Elligator2 **volontairement non ajouté** (forme Huawei non documentée → pas à l'aveugle). Spec §6.8 mise à jour.
- [x] **(a quinquies) Lecture tolérante du JSON HiChain** (livré 13/10 22:30, §6.9) : la GT 6 Pro répond en **ISO** avec un
      octet de fin (NUL) après le JSON → `decodeHichainJson` unique, `trailingBytes`, trame d'exemple 805 octets, fausse
      montre « JSON + NUL » sur tout le parcours, libellé sans « New Auth » quand les champs sont ISO
- [x] **(a sexies) Diagnostic du jeton (I57)** (livré 13/10 22:30, §6.10) : 5 variantes de clé de base du PIN essayées
      (la bonne est retenue et nommée dans le journal) ; sinon 4 ordres de calcul testés, `tokenCheck` (nom + tailles,
      jamais de valeur) ; un jeton différent à la liaison ne conclut plus « PIN refusé / montre liée ailleurs »
- [ ] ⏸️ **(c ter) EN ATTENTE — la GT 6 Pro parle ISO, pas SPEKE (journal 17:03, §6.9) ; utile seulement pour les Honor.**
      Assembler le StepOne « New Auth Protocol » :
      à partir des primitives (c bis), StepOne SPEKE + preuves `kcfData` (HMAC) + échange d'identité Ed25519 chiffré GCM,
      d'après §6.8 ; à confirmer sur la montre : PIN → point de base (Elligator2), signature « pré-hachée SHA-256 » ;
      tests sur trames d'exemple, fausse montre New Auth complète
- [x] **(d) Synchronisation, version simple** (run 13/10 04:30) : spec §7 (heure 1/5, sommeil 7/0x0C-0x0D, minutes
      7/0x0A-0x0B avec masques de champs, totaux 7/0x03, séances 0x17, fichiers 0x2C) ; `sync.js` + `services/watchSync.js` :
      pas et calories par heure, FC par 10 min, SpO₂, FC repos par jour, sommeil léger / profond → IndexedDB (source
      `huawei_watch`, sans doublon, fenêtre depuis la dernière synchro, 7 j la 1re fois) ; étape « Lecture des mesures » à
      chaque connexion, bouton « Synchroniser la montre » ; « Mes appareils » compte la montre en direct comme passerelle
      de Huawei Health ; fausse montre étendue (blocs minute / sommeil / totaux)
- [x] **(d bis) Capacités, séances, sommeil détaillé** (run 13/10 10:30) : 1/0x02, 1/0x03, 1/0x31, 1/0x37 lus et
      résumés dans le journal ; séances 0x17/0x07 + 0x08 → entrées `activity` (type, durée, kcal, distance, pas, FC
      mini / maxi) ; fichier 0x2C `sequence_data` (dictionnaire 700013) → phases léger / profond / paradoxal / éveil,
      score, VFC moyenne de la nuit ; une nuit détaillée remplace les périodes simples (même déjà écrites). Spec §7.5–7.8
- [ ] **(d bis, suite)** stress (`rrisqi_data.bin`, score de la montre → nouveau type d'entrée ?), VFC de journée
      (dictionnaire 500044, capacité 235), échantillons de séance (0x17/0x0A : FC moyenne, courbe), ancien service 0x0A
      pour les montres sans 0x2C ; découpe de la période si 0x17/0x07 annonce plus de séances qu'il n'en rend
- [x] **(d ter) Resynchro à l'ouverture** (run 13/10 06:30) : `services/watchAutoSync.js` — à l'ouverture de l'app et
      au retour dans l'app (`visibilitychange`), au plus toutes les 30 min, seulement si une clé HealthTrack existe pour
      la montre appairée ; verrou partagé avec « Synchroniser la montre » (une connexion à la fois), essais espacés après
      échec (30 min → 4 h), pause sur clé refusée / PIN / méthode non prise en charge jusqu'à une connexion manuelle
      réussie ; ligne d'état dans « Connexion à la montre »
- [ ] **(d quater) Resynchro en arrière-plan, app fermée** : WorkManager / service de premier plan ; la session HiChain
      et le protocole tournent aujourd'hui en JS → soit WebView réveillée (plugin Capacitor background-runner ?), soit
      portage Java du strict nécessaire (trames, AES-GCM, commandes 7/x) avec la clé de session ; à évaluer
      → **tranché au run idées 13/10 08:30 (I49)** : `@capacitor/background-runner` écarté (QuickJS sans
      `crypto.subtle` ni Bluetooth). Plan : ① association **Companion Device Manager** de la montre déjà appairée
      (1 confirmation ; le CDM gère le Bluetooth classique : événement à la connexion / déconnexion, exemption
      officielle pour démarrer un service de premier plan depuis l'arrière-plan) ; ② `CompanionDeviceService` →
      service `connectedDevice` court ; ③ **client Java « synchro seule »** écrit depuis la spec (§2, §3, §6.5, §7),
      clé lisible par Java (Keystore), sortie fichier importé par le JS à l'ouverture ; échec d'auth en fond =
      notification, jamais de réappairage ; ④ filet WorkManager 1 h + déverrouillage (`USER_PRESENT`) ; ⑤ socket
      toujours fermé, essais plafonnés (PR GB #6367 : des reconnexions agressives peuvent faire réinitialiser la montre)
- [x] **(d quater ①②) Appareil compagnon + présence** (run 15/10 00:30, I72) : `CompanionPlugin.java` (association
      CDM filtrée sur l'adresse de la montre appairée, `setSingleDevice`, `startObservingDevicePresence`, `status`,
      `disassociate`), `WatchPresenceService` (`onDeviceAppeared` API 33–35, `onDevicePresenceEvent` API 36 : horodatage
      en `SharedPreferences` + événement `watchPresence` vers le JS) ; `services/watchPresence.js` : montre reconnectée →
      `syncWatchIfStale` (mêmes règles) ; ligne + « Activer » dans la carte. Couvre l'app **en arrière-plan** (processus
      vivant, WebView non mise en pause : `KeepRunning` Capacitor) ; **app tuée → reste ③ client Java « synchro seule »**
- [ ] À vérifier sur l'A56 : la boîte CDM trouve-t-elle la montre déjà appairée (appareils liés inclus par le
      service de découverte) ? `onDeviceAppeared` arrive-t-il à la connexion Bluetooth classique ? La synchro JS
      tourne-t-elle app en arrière-plan sous One UI ? → ajouter `presence` au journal exporté si le propriétaire ne voit
      jamais « reconnectée il y a … »
- [x] **(d quater ③ a) Cœur Java** (run 15/10 02:30) : paquet sans Android `com.healthtrack.app.huawei` (`LinkCodec`,
      `LinkCipher`, `IsoAuth` opération 2 seule, `WatchLink`, `WatchHandshake`, `MiniJson`) + `RfcommTransport` ;
      **octet pour octet identique au pilote JS** (vecteurs générés par `javaVectors.test.js`, dont la transcription
      d'une reconnexion GT 6 Pro type 4) ; `npm run test:java`, job CI « Protocole montre (Java) ». Pas encore branché
- [x] **(d quater ③ c) Clé confiée au natif** (run 15/10 06:30) : coffre `WatchVault` (AES-GCM, clé AES-256 du
      Keystore, données associées = adresse), `WatchVaultPlugin` (store / status / clear, rien ne revient au JS),
      `watchVault.js` : dépôt après `connected`, retrait après `key_rejected`, `nativeKey` dans le journal
- [x] **(d quater ③ d) Lectures en Java** (run 15/10 10:30) : `WatchReader` (sommeil, minutes, totaux, mêmes
      demandes et même tolérance que `readWatchData`) → capture JSON de **réponses déchiffrées brutes** dans
      `CaptureInbox` (fichiers privés, 48 au plus) ; plugin « WatchCapture » ; à l'ouverture, `importPendingCaptures`
      décode avec les analyseurs JS (`capture.js`) et écrit par le même chemin que la synchro en direct
      (`writeWatchData`) ; vecteur `read` : trames et capture identiques au pilote JS. Heure 1/5 **non** envoyée en
      arrière-plan (la synchro en direct la règle) ; séances et fichiers 0x2C laissés à la synchro en direct
- [x] **(d quater ③ e) Relecture app tuée à la reconnexion** (run 15/10 12:30) : `WatchPresenceService` →
      `BackgroundWatchSync` (si aucune page ne tourne) ; `BackgroundSync` pur Java (décision, fenêtre = `syncWindow`
      prouvée par vecteurs, 30 min → 4 h, pause + clé retirée après `key_rejected`) ; reprise recopiée par le JS
      (`shareResume`), état lu par le JS (`background` : en cours → pas de 2e connexion, clé refusée → pause, relue →
      compte dans les 30 min) ; ligne « relue app fermée il y a … ». À valider sur l'A56
- [x] **(d quater ③ f) Autres déclencheurs (I75)** (run 15/10 14:30) : déverrouillage (récepteur `USER_PRESENT`
      dynamique dans `WatchPresenceService`) + filet `WatchSyncJob` (JobScheduler 2 h ± 30 min, persistant, batterie
      pas faible ; pas de WorkManager = aucune dépendance) ; `decide(trigger, …)` → « absent » si la montre est partie ;
      notification « clé refusée » (POST_NOTIFICATIONS demandée à « Activer ») ; bloc `background` dans le journal
      exporté. À valider sur l'A56
- [x] **(d quater ③ g) Relecture native app en arrière-plan non tuée** (run 15/10 16:30) : « app » = app **à
      l'écran** (`isAppInForeground`, onStart/onStop) ; liaison unique page / natif `huawei/LinkLock` (BtClassicPlugin
      rejette `busy`) ; issue JS `busy` non consignée ; écoute de présence muette page cachée. À valider sur l'A56
      (reste : connexion de page gelée laissée ouverte → natif bloqué jusqu'à la coupure ; à surveiller dans le journal)
- [ ] (d quater ③ h) Service relancé par Android sans intent (#6869) : vérifier sur le journal de l'A56 si la
      présence se perd après un redémarrage, sinon rien à faire
- [ ] (d quater, avec ①) **Guide One UI** (I50) : batterie « Sans restriction » **et** « Applis jamais en veille »,
      affiché seulement si la synchro de fond n'a rien ramené depuis 24 h
- [ ] Séances (0x17) : couvrir dans les tests les séances **enregistrées automatiquement** (plantage connu sur GT 6 Pro
      chez GB, #5784) ; ignorer proprement la demande de 35 jours de calendrier de la montre (#6356)
- [ ] Valider (d) sur la vraie montre : unités des calories (kcal ?) et de la distance, valeur « pas de mesure » (0 / 0xFF),
      blocs vides, fuseau 1/5
      (PR #6367 : fermer, attendre ≈ 6 s, réessayer une fois) ; envoi de l'identifiant de compte (0x1A/0x05, étiquette 3
      selon la prise en charge) à vérifier ; mode classique / HiChain Lite non pris en charge (bracelets anciens)
- [ ] **(d) Synchronisation** : informations produit (1/7), heure (1/5), minute par minute (7/0x0A-0x0B : pas, FC,
      SpO₂, FC repos), sommeil (7/0x0C-0x0D puis fichiers 0x2C), RR → VFC / stress, séances (0x17) → IndexedDB
      (source `huawei_direct`) ; puis resynchro en arrière-plan (WorkManager / service de premier plan)
- [x] Pilote enregistré dans le registre générique (run 14/10 18:30) : `drivers.js` a une 3e sorte de pilote,
      `kind: 'family'` (`huawei_link` : `mode: 'direct'`, `transports: ['rfcomm','ble']`, `cardId`, score 60 entre
      profil standard 80 et « via son app » 50) ; `identifyDevice` renvoie aussi `direct` (famille qui sait s'y
      connecter même quand un profil standard gagne) ; `isHuaweiWearable` (diagnostic) = `isHuaweiLinkDevice` du registre ;
      Capteurs Bluetooth : « Connexion directe » + « Se connecter en direct » (ouvre la carte, même repliée)
- [ ] Registre, suite : brancher le diagnostic / la connexion sur le pilote choisi (`driver.transports`) plutôt que sur
      des appels Huawei en dur, quand une 2e famille arrivera (Colmi I28, Xiaomi / Zepp)

### D4 — Humeur par signaux émotionnels directs (visage, voix, réseaux sociaux)
- [x] Étude des limites Android réelles (run idées 16/10 08:30, `IDEES.md` I88–I93) : service `camera` / `microphone`
      à créer **app visible** (exemptions générales sans effet) ou par **geste sur une notification** ; il garde la
      caméra en arrière-plan ensuite ; interdit depuis `BOOT_COMPLETED` (A14 micro, A15 caméra) ; `appops CAMERA allow`
      accepté par le contrôle FGS (`MODE_ALLOWED`) **mais** très probablement effacé par `PermissionPolicyService`
      (`BACKGROUND_CAMERA` / `RECORD_BACKGROUND_AUDIO` = `internal|role`) ; micro de fond = silence pendant appels et
      autres captures. Modèle : MediaPipe Face Landmarker (blendshapes, Apache-2.0) en natif
- [ ] **I94 (run idées 16/10 20:30, décision)** moteur du visage = **LiteRT seul** (`litert:2.3.0`, aucune dépendance
      d'envoi) + les 3 `.tflite` Apache-2.0 du Face Landmarker exécutés en Java, **pas MediaPipe Tasks ni ML Kit**
      (télémétrie Google sans option : mediapipe #6291, `RemoteLoggingClient` dans `tasks-core 1.1.1`, conditions ML Kit ;
      14,4 Mo de `.so` arm64 contre 5,6). Spec d'abord (`protocoles/visage.md`), `.task` téléchargé + SHA-256 au build,
      test d'équivalence vs MediaPipe hors app (écart < 0,05). Mesuré : ≈ 10 ms / image (1 cœur x86) → coût = la caméra
      **17/10 08:30 : spec écrite et vérifiée** (`protocoles/visage.md` + prototype `visage-reference.py`) : points à
      0,78 px médian de MediaPipe, blendshapes 0,009 moyen ; pièges : coordonnées en **pixels** pour les blendshapes,
      pas de demi-pixel au recadrage. **Prêt à coder**, en 3 PR (I100) : ① moteur + modèles au build + `abiFilters` +
      test d'équivalence (I101) ; ② service + rafales ; ③ diagnostic
- [ ] **I98 (17/10 08:30, score 20)** capture 320 × 240 × 3 images (mesuré : écart 0,019 vs pleine résolution),
      contrôle qualité avant calcul (présence ≥ 0,9, visage ≥ 80 px, lacet ≤ 30°, lumière, `jawOpen` ≤ 0,5), rafale
      sautée si la caméra est déjà prise (`AvailabilityCallback`) ; rejets comptés par raison dans le diagnostic
- [ ] **I99 (16)** indices nommés par unités d'action (AU12 sourire, AU6 + 12 sourire des yeux, AU4, AU1, AU15, yeux,
      mobilité ; Turrisi 2026), **aucun sens codé** : écart à la plage personnelle (28 j) puis calibration sur les notes
- [ ] **I101 (12)** test d'équivalence en CI (JSON MediaPipe figé, test instrumenté sur l'émulateur x86_64) ; licence
      de l'image test : **I106** (17/10 20:30) → portraits officiels fédéraux US (domaine public, PD-USGov, Wikimedia
      Commons), pas FFHQ (licences mêlées, interdit pour la reconnaissance faciale)
- [ ] **I96** une seule autorisation « travailler en arrière-plan » (montre + visage) : `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`
      en une ligne dans la carte montre, consigne One UI « Applis jamais en veille » seulement sur Samsung et seulement
      si le journal natif montre des trous ; exporté dans le diagnostic (aucune demande d'exclusion aujourd'hui)
      ; chemin One UI 8 (run 17/10 20:30) : Paramètres → Batterie → Limites d'utilisation en arrière-plan →
      « Applis jamais en veille » (retirer des « Applis en veille profonde »)
- [ ] **I88** service « Lecture du visage » (`FaceSenseService`, type `camera`, `START_NOT_STICKY`) : rafales de 3
      images ≈ 320×240 au déverrouillage puis ~3 min écran allumé, veille écran éteint, saut si caméra prise / appel /
      chaleur ; service tué → notification « Reprendre » (posté par le récepteur de déverrouillage ou `WatchSyncJob`) ;
      diagnostic exportable (rafales faites / sautées, inférence, batterie `CHARGE_COUNTER`, jamais d'image ni de score)
- [ ] **I90** par rafale ~10 nombres (sourire, yeux, sourcils, tête, mobilité, qualité) ; agrégats jour × moment ;
      une ligne « expressivité 14 j vs votre plage », calibrée sur vos notes (Ridge + LOO) — leçons Emobot (FADS 14 j,
      ρ 0,65) et FacePsy (personnel 0,81 vs universel 0,67 ; yeux et tête > sourire)
- [ ] **I89** guide Shizuku / ADB dans le Diagnostic, avec lecture du mode app-op brut (0 s, 10 s, après mise à jour,
      après redémarrage) : « accès permanent tenu / effacé par Android »
- [ ] **I93** une fois calibré : question du soir un jour sur deux tiré au hasard + jours incertains
- [ ] Capture opportuniste (au déverrouillage / à l'usage), scores seuls stockés, jamais d'image ni d'audio brut
- [ ] Usage des réseaux sociaux (UsageStats par app) — **décidé au run idées du 15/10 08:30 (I78) : X**, minutes par
      app sociale via `queryEvents` du plugin existant, **exclu de l'estimateur** (lien avec l'affect très faible et dans
      les deux sens, Elmer et al. 2025) ; estimateur = visage + voix + auto-déclaration
- [ ] Visage (I40) : MediaPipe Face Detector + HSEmotion-B0 LiteRT (8 Mo, Apache-2.0) quelques secondes à chaque
      ouverture de l'app → sourire / valence / confiance seuls stockés ; étape 2 service caméra démarré depuis l'app
      (Android 14+ interdit de le créer en arrière-plan ; pas de capture au déverrouillage sans ouvrir l'app)
- [ ] Faits du run idées 13/10 08:30 (I53, I55) : **pas de WebGPU sur le GPU Xclipse de l'A56** (liste de blocage
      Chromium) → MediaPipe Tasks web (WebGL2) ou natif ; HSEmotion-B0 LiteRT = 8 classes **sans valence**, la variante
      valence / éveil (`enet_b0_8_va_mtl`, 16 Mo) a une **licence des poids non précisée** ; précision individuelle
      publiée faible (AUC ≈ 0,6) → tendance 7 j calibrée par l'auto-déclaration ; openSMILE écarté (licence
      commerciale) → prosodie maison + pitchy (0BSD) ; `appops CAMERA allow` : aucun retour fiable sur Android 14–16,
      démarrage depuis l'app ou une notification = voie robuste (le « niveau 2 » reste à **tester** sur l'A56)
- [ ] Faits du run idées 13/10 20:30 : poids HSEmotion VA sans licence affichée, appris sur AffectNet (recherche non
      commerciale [H]) → **blendshapes MediaPipe (sourire) par défaut**, valence en option téléchargée, licence affichée ;
      aucune mesure publiée de MediaPipe en WebView Samsung → mesurer sur l'A56. Transcription locale :
      `createOnDeviceSpeechRecognizer` (API 31+, pack fr-FR à télécharger, garde `isOnDeviceRecognitionAvailable`)
- [ ] Voix (I41) : dictée du soir = note déclarée + tags extraits + indices prosodiques (audio effacé), modèle SER
      seulement s'il tient sur l'A56 (≤ 20 Mo, < 300 ms) — remplace à terme le formulaire de check-in (D1).
      **I91** (16/10) : la dictée d'abord ; échantillons de fond en option, seulement sans appel ni autre capture
      (`getActiveRecordingConfigurations()` vide), rejetés si `isClientSilenced()` ou hors de la plage de votre voix
- [ ] **I110 (run idées 18/10 08:30, score 16)** porte d'entrée de l'estimateur : visage et voix restent `candidate`
      dans `ESTIMATOR_INPUTS` tant qu'ils n'ont pas prouvé **chez l'utilisateur** qu'ils suivent ses notes (LOO ≥ 0,3,
      ≥ 30 j, règle I107) ; seul `active` compte dans l'humeur affichée (Koch et al., Interspeech 2026 : prosodie lue →
      valence ρ = 0,02, éveil 0,12 d'une personne à l'autre ; 32–69 % de la variance entre personnes)
- [ ] **I111 (12)** voix = **dictée d'abord** (texte → note et tags *proposés*), prosodie maison en écart à sa plage
      28 j ; **aucun modèle d'émotion vocale embarqué** : emotion2vec+ (poids FunASR Model License : « reference and
      learning », révocable), Wav2Small / MobileNetV4 audEERING (CC-BY-NC-SA) écartés

### D5 — Anti-circularité (Y ≠ X)
- [x] **I92 (16/10, petit, avant tout code D4)** — **livré 16/10 16:30** (`mood/estimatorInputs.js`,
      `mood/calibration.js`, `moodEstimate.js` supprimé, `mood/antiCircularity.test.js`) : `moodEstimate.js` débarrassé de ses entrées comportementales
      (sommeil, pas, écran tard `higherIsBetter: false` = norme cachée, D6) ; calibration extraite
      (`services/mood/calibration.js`) ; `ESTIMATOR_INPUTS` + test anti-circularité livrés avec
- [x] **I84 livré 16/10 16:30** : « Stress » ressenti `side: 'Y'`, retiré des effets de tags (saisie et Radar inchangés)
- [x] Liste déclarée des entrées de l'estimateur d'humeur + test qui échoue (livré 16/10 16:30) si une variable est aussi un facteur des
      corrélations / du modèle / des tags
      (I78 : `ESTIMATOR_INPUTS = ['face', 'voice', 'selfReport']`, `socialMediaMinutes` en X ; la capacité « émotion »
      de la montre, si elle est lue un jour, est un X)
- [x] Estimateur comportemental retiré de l'affichage (carte « Humeur estimée », run 12/10 16:30 Paris)
- [ ] Revue des pièges : ~~ordre temporel (X avant Y — ex. pas **du jour** vs bien-être du jour)~~ **fait le 16/10 22:30** pour les comportements du jour (`SAME_DAY_KEYS`, `DAY_OVER_HOUR` = 20 h ; reste : repas d'après la note, prédiction du jour), comparaisons multiples
      (déjà BH), taille minimale, formulations « va de pair » partout
- [ ] Garde-fous visibles (I46) : X de la veille, ≥ 30 paires pour afficher / ≥ 90 jours pour « solide », préblanchiment
      AR(1), « k liens nets sur m testés » ; expériences ABAB randomisées pour un lien à confirmer (I45 → **I109**,
      18/10 08:30 : tirage quotidien, mesures de nuit seulement) ; **comparaisons multiples : I107 / I108** (BH q < 0,2
      ne suffit pas pour dire « chez vous », simulé 18–36 % de jeux avec une fausse piste)

### D6 — Science personnelle, pas de normes imposées
- [x] **I97 ① (17/10 06:30)** Radar forme et cartes FC / VFC : `higherIsBetter` → `generalHigherIsBetter`, écart
      signalé « inhabituel chez vous » dans les deux sens (flèches ↑ / ↓), « fatigue » seulement en « Hypothèse
      générale », style neutre sinon ; cartes : une couleur « hors norme » dans les deux sens
- [ ] **I97 ②** sens personnel appris sur les notes (FC repos / VFC / sommeil ↔ note du lendemain) →
      « chez vous : … » à la place de l'hypothèse générale. **Méthode tranchée au run idées du 17/10 20:30 → I102.**
- [ ] **I102 (score 20)** estimateur unique `services/personalDirection.js` : X de la veille, préblanchiment AR(1),
      a priori N(0 ; 0,2²) **centré sur zéro**, sens affiché si P(sens) ≥ 97,5 % et n ≥ 30 (simulé : faux sens
      ≤ 3,6 % sans lien, lien r = 0,3 trouvé 43 % à 60 j / 88 % à 120 j ; corrélation brute à 90 % : 10–23 % de faux
      sens) ; branché sur Radar, cartes FC / VFC puis `leverSuggestion`. Spec dans `IDEES.md`
- [ ] **I107 (run idées 18/10 08:30, score 20) — corrige I102 avant tout code** : I102 seul sur 40 facteurs affiche
      ≥ 1 faux sens dans **40 / 58 / 70 %** des jeux (60 / 120 / 180 j ; simulé, `protocoles/multiplicite-abab-sim.py`).
      A priori **spike-and-slab** (π0 = 0,9 sans effet, 10 % N(0 ; 0,3²)), verdict si P(lien et sens) ≥ 0,9 :
      ≤ 1,2 % de jeux avec un faux sens, vrais liens r = 0,3 trouvés 36 % à 120 j / 70 % à 180 j. Même calcul pour
      Radar, cartes, pistes et effets décalés ; « pas de lien notable » (I103) = P(lien) < 0,2 et n ≥ 60
- [x] **I108 — livré le 18/10 10:30** (`selectLevers`, `stage` personal / toVerify, badge « Chez vous : lien net » / « À vérifier : peut-être le hasard ») — **(18/10 08:30, score 20, petit, faisable tout de suite)** pistes à deux étages : q < 0,05 → « Chez
      vous : … », 0,05 ≤ q < 0,2 → « À vérifier : … » (une seule à la fois, jamais formulée comme un fait) ; les pistes
      actuelles (3 à q < 0,2) en montrent une fausse chez ≈ 1 utilisateur sur 4 après 120 j (simulé, 40 X)
- [ ] **I109 (12)** expérience tirée au sort **chaque soir** sur une mesure **de nuit** (VFC, FC repos, sommeil) pour
      une piste « à vérifier » : 6 semaines, un seul test décidé d'avance (pas de multiplicité) ; simulé : effet fort
      (d = 1,5) tranché 58 % à 28 j / 83 % à 42 j, ≤ 4 % de faux sens ; **pas** sur la note de bien-être (effet moyen
      d = 0,5 : 26–36 % après 84–112 j). Remplace I45
- [ ] **I103 (16)** verdict « pas de lien notable chez vous » (borne haute 95 % de |effet| < 0,2 ; possible dès ~60 j)
      → ligne repliée dans Analyses, signal sans lien ne compte plus dans la phrase du Radar
- [ ] **I104 (16)** fréquences au lieu de r (« 7 de vos 10 journées comparables… »), seulement après un verdict I102
- [ ] **I105 (12)** jours hors norme mis de côté sans saisie (voyage, Radar « alert » ≥ 2 j, changement d'heure)
- [x] `SleepRegularityCard` : « Horaires variables » encore classé `is-unfavourable` (couleur de jugement) — **fait le 04/11 10:35** : `is-outside` neutre, « réguliers » `is-within`
- [ ] `LEVER_ACTIONS` + `VARIABLE_META.direction` (`higher_better` / `lower_better`) dans `analysisEngine.js` codent un
      sens « sain » : `leverAction` **masque** une piste quand les données contredisent la norme → montrer la réalité
      personnelle (« chez vous, plus d'écran le soir va avec une meilleure humeur ») et formuler les pistes de façon
      neutre (« Tester : plus / moins de … »), la norme générale présentée comme hypothèse
- [ ] Couleurs vert / rouge des corrélations et des tags : vert = « va avec un meilleur bien-être » (descriptif, OK) —
      vérifier qu'aucun libellé ne juge le comportement ; Radar / cartes cœur « plus basse que d'habitude » en vert
      (norme implicite) → neutre
- [ ] Nutrition : repères ANSES présentés comme hypothèses générales, jamais comme des fautes
- [ ] « Votre cas vs l'hypothèse générale » (I44) : `direction` → `generalHypothesis` { sens, source } utilisé pour
      l'ordre d'examen et un texte en petit ; a priori faible = rétrécissement vers zéro, jamais vers la norme

## Chantiers long terme (découpés en étapes livrables)

### C7 — Objets connectés : autodétection et données brutes (priorité n° 2)
- [x] **Guide « Montre Huawei / Honor → Gadgetbridge → Health Connect »** dans Connecteurs (I1) + guides Samsung, Xiaomi / Amazfit, Garmin, autres (`src/data/watchGuides.jsx`) (run 11/10 20:30)
- [x] **Lire plus de types Health Connect** (I2) : respiration, température, tension, glycémie (nouveaux types d'entrée), poids, masse grasse ; autorisation partielle non bloquante + « Autoriser ces mesures » ; puces dans « Vos derniers jours » ; copie HC d'une pesée Withings écartée (run 11/10 20:30)
- [ ] Types HC, étape 2 : température **cutanée** (`SkinTemperatureRecord`, patch natif du plugin) si Gadgetbridge / Samsung l'écrivent ainsi ; respiration et température comme variables des Analyses et du Radar ; vérifier sur la vraie GT 6 Pro ce qui arrive
- [x] **« Mes appareils »** (I3), étape 1 : 19 apps santé détectées (`<queries>` + `AppLauncher.canOpenUrl`, sans plugin natif), sources réelles d'après `payload.sourceName` des mesures HC, statuts Reçu / En pause / À brancher / Relayé, « Voir le guide » + « Ouvrir l'app » (`src/devices/healthApps.js`) (run 12/10 00:30)
- [ ] « Mes appareils », étape 2 : appareils BLE appairés (`getBondedDevices`, petit plugin natif) → montre identifiée par son nom (« HUAWEI WATCH GT 6 Pro-XXX ») ; ouvrir directement l'écran Health Connect de l'app (deep links) ; bandeau sur l'accueil quand une app est « À brancher » ou « En pause » ; vérifier les libellés `sourceName` réels sur l'A56
- [x] **Couche BLE générique, étape 1** (I8) : `@capacitor-community/bluetooth-le` 8.3.0, empreinte sans MAC + registre de pilotes au score (11 profils standard reconnus, 13 familles de montres), FC 0x180D + RR → VFC RMSSD (filtre d'artefacts, qualité), mesure 5 min dans Connecteurs, appareils appairés reconnus, empreintes inconnues en local, `neverForLocation` (`src/devices/ble/`) (run 12/10 02:30)
- [x] **Couche BLE, étape 2** : tensiomètre 0x2A35 / balance 0x2A9D / impédancemètre 0x2A9C / thermomètre 0x2A1C / oxymètre 0x2A5E-0x2A5F (indications, SFLOAT / FLOAT IEEE-11073, horodatage de l'appareil), « Recevoir la mesure » dans Connecteurs, entrées au format Health Connect source `ble` (`src/devices/ble/measurements.js`) (run 12/10 04:30)
- [x] **Relecture critique de la couche BLE** (run 12/10 06:30) : VFC bloquée par un premier battement aberrant, horloge d'appareil jamais réglée (mesures « en 2000 »), SFLOAT spéciaux, doublons sans horodatage, connexion laissée ouverte (abonnement refusé, « Annuler » pendant la connexion)
- [ ] BLE, petits restes : double pesée possible (0x2A9C sans horodatage + 0x2A9D avec) ; Android ≤ 11 : expliquer « activez la localisation » quand le scan ne trouve rien
- [ ] Couche BLE, étape 2 suite : glycémie (RACP), Current Time Service (régler l'horloge de l'appareil), Device Information Service (0x180A) lu à la connexion, export des empreintes inconnues (Paramètres ou sauvegarde)
- [ ] Couche BLE : réception **automatique** — appareil de mesure mémorisé, reconnexion dès qu'il réapparaît (app ouverte), sans toucher au téléphone
- [ ] Couche BLE, étape 2 bis : FC diffusée par la montre pendant une séance → enregistrement de la séance (FC continue, zones) ; VFC du matin en 1 geste (rappel, dernier capteur mémorisé, reconnexion auto)
- [ ] Couche BLE, étape 3 : Companion Device Manager (réveil quand l'appareil revient à portée), synchro en arrière-plan
- [x] **« Qui envoie quoi »** (I23) : mesures détaillées par app (FC / FC repos / VFC / SpO₂ séparées), mesure habituelle (≥ 7 j / 14) arrêtée depuis ≥ 3 j signalée, « Jamais reçu en 30 jours » pour une montre (`sourceCoverage`, `missingWatchMetrics`) (run 12/10 10:30 Paris)
- [ ] « Qui envoie quoi », étape 2 : bandeau sur l'accueil quand une mesure habituelle s'arrête ; sources BLE dans la même vue
- [ ] **Bague Colmi / Yawell en direct** (I28) : pilote BLE réimplémenté d'après le protocole MIT (`tahnok/colmi_r02_client`, notes.tahnok.ca), FC en direct + batterie puis historique FC / SpO₂ / pas / sommeil ; jamais de code Gadgetbridge
- [ ] Imports de fichiers constructeurs (I14) : Garmin FIT, Huawei JSON (export RGPD), Samsung / Oura / Zepp CSV
- [ ] OAuth cloud ouverts à un particulier : Polar AccessLink (gratuit), Whoop, Oura
- [ ] Pilote BLE Huawei direct (I20) — pari long terme, depuis `huawei-lpv2` (MIT), jamais de code Gadgetbridge (AGPL)
- [ ] Recommandations matériel dans l'app (I21) : ceinture FC pour une VFC fiable, tensiomètre / balance BLE standard

### C8 — Capture passive du contexte (priorité n° 1)
- [x] **Météo, pression, qualité de l'air, pollen** (I4) : Open-Meteo sans clé, position arrondie ≈ 10 km (géoloc approximative ou ville), 92 jours d'historique, mise à jour ≤ 3 h à l'ouverture, 6 variables « environnement » dans les Analyses (jamais des leviers), puce Météo dans le journal, carte dans Connecteurs (`src/services/weather*.js`) (run 12/10 06:30)
- [ ] Météo, étape 2 : prévision du jour dans la prédiction (remplacer l'entrée du jour → `upsertEntries` à faire évoluer), effet décalé de la pression (J−1), tag « mal de tête » avec intensité pour tester la sensibilité à la pression, rappel du matin « pression en chute »
- [x] **Temps d'écran, écran tard, déverrouillages + sommeil estimé par le téléphone** (I6 + I25) : plugin Java maison `PhoneUsagePlugin` (événements écran seulement, `queryEvents`), entrées `phone_usage` par journée terminée, 3 variables « mode de vie », nuit estimée utilisée seulement sans montre (pas par le Radar), carte + guide d'accès (paramètres restreints) dans Connecteurs, puces du journal (run 12/10 12:30 Paris)
- [ ] Téléphone, étape 2 : pré-cocher « Écran tard » dans le check-in quand > 30 min ; nuits estimées dans la carte Régularité ; charge (`ACTION_POWER_CONNECTED`) pour affiner la nuit ; correction en un geste (« je me suis couché à… ») ; catégories d'apps (option explicite) ; vérifier l'accès sur l'A56
- [ ] **Courbe caféine (et alcool)** (I27) : « ☕ maintenant » en 1 tap, modèle à 1 compartiment (T½ 5 h ajustable), « caféine restante au coucher » comme variable / levier
- [ ] Pas du téléphone sans Health Connect (I36) ; routine / temps à la maison sans GPS (I37, Wi-Fi haché)
- [ ] Calendrier → charge de la journée (I11)
- [ ] Mobilité / temps dehors (I15, sans coordonnées précises)
- [ ] Repas détectés dans la galerie (I12)
- [ ] Check-in en un geste : notification / widget, tags avec intensité (I13)

### C9 — Humeur estimée et conversations (priorité n° 3)
- [x] **Humeur estimée « plage habituelle »** (I7 + I31, étape 1) : sommeil, VFC, FC repos, pas de la veille, écran tard vs norme 28 j, indice ± 0,75, Ridge calibrée sur les check-ins dès 14 j seulement si LOO ≥ 10 % mieux que la moyenne (note /5 + fourchette 80 %), bas ≥ 10 j / 14 → renvoi doux (3114), carte sur l'accueil (`moodEstimate.js`, `MoodEstimateCard`) (run 12/10 14:30 Paris)
- [ ] ~~Humeur estimée, étape 2~~ (abandonné le 12/10 : entrées comportementales interdites par D5 → voir D4) : régularité (écart du coucher) et temps dehors comme signaux ; mini-courbe 14 j ; « l'estimation disait 3,2 » affiché **après** le check-in (mesure de précision) — pas de pré-remplissage (boucle auto-confirmée)
- [ ] **Journal libre (dictée / texte) → tags, intensités, caféine, alcool, symptômes extraits** (I26, Gemini JSON + confirmation en 1 tap, repli mots-clés sans clé)
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
- [ ] Accessibilité : contrastes, cibles tactiles ≥ 44 px, libellés ARIA — **A11Y-1 fait (04/11 05:35)** : contrôle
  « SANS NOM ACCESSIBLE » / « CIBLE < 44 px » dans `npm run visual` (avertissement) ; volets « Comment c'est calculé »,
  « Hypothèse générale », « Attendu d'après vos habitudes », « Désactiver », « Restaurer un achat » (paywall), liens de
  licence et guides montre à 44 px ; `src/tapTargets.test.js`. Audits `--play` démo et `--empty` : 0 avertissement
  sur 16 pages. **A11Y-2 fait (04/11 06:35)** : onboarding pas à pas (0 avertissement) ; contrôle « CONTRASTE FAIBLE »
  (WCAG 1.4.3) dans `npm run visual` ; étiquettes vertes « Reçu », « Automatique », « Dans votre norme » 3,7–4:1 → couple
  menthe des tokens (`src/badgeContrast.test.js`). **A11Y-3 fait (04/11 07:35)** : contrôles « CLIQUABLE MUET » (élément touchable sans rôle, que TalkBack lit comme du texte) et « SANS TITRE H1 » dans `npm run visual` : 0 sur 16 pages (démo et vierge sombre) ; balayage du code : un seul onClick hors bouton (`MealEditor` li, avec rôle et tabIndex), toutes les bascules ont `aria-expanded` ; verrou `src/screenReader.test.js` (onClick sans rôle, img sans alt). Reste (faible) : écoute réelle avec TalkBack sur l'émulateur de la CI (ordre de lecture), si un testeur le demande.

### C2 — Écran « Aujourd'hui »
- [x] **Remplacer le flux brut « Dernières entrées » par des résumés du jour** : « Vos derniers jours », une carte par jour (sommeil au jour du réveil, pas, FC repos, VFC, plage FC, dépense, bien-être, repas/kcal, cigarettes) + saisies du jour (#76)
- [x] **Baselines personnelles FC repos / VFC** (R#1) : moyenne 7 j vs norme des 60 j précédents (± 1 ET, VFC en log), cartes sur le tableau de bord (#60)
- [ ] Baselines, étape 2 : ajouter sommeil (durée) et une mini-courbe 30 j avec la bande de norme ; CV 7 j de la VFC
- [x] **Régularité du sommeil** (R#6) : coucher / lever moyens ± ET sur 14 j, SRI simplifié (nuits consécutives), décalage du week-end, carte du tableau de bord (run 11/10 06:30)
- [ ] Régularité, étape 2 : ET des horaires / SRI comme variable des Analyses et piste « heures fixes » ; mini-graphique des horaires 14 j
- [ ] Tendance de poids lissée (R#8, EMA α≈0,1) et objectif de pas fondé sur les preuves (R#10, défaut 7 000, adaptatif)
- [x] **« Radar forme »** (R#12) : FC repos / VFC / sommeil vs norme 60 j, ≥ 2 signaux défavorables (|z| ≥ 1,5), « à surveiller » 1 jour, alerte ≥ 2 jours, jamais de diagnostic
- [ ] Radar, étape 2 : fréquence respiratoire et température si Health Connect les fournit ; mini-courbe 14 j ; recalibrer les seuils sur retours réels
- [x] **Radar expliqué** (I22) : tags « cause » (alcool, sport le soir, repas tardif, stress, nouveaux Voyage / Vaccin) le jour signalé ou la veille → « Probablement lié à… », badge « Explicable » ; série expliquée seulement si chaque jour a sa cause ; « Malade » confirme (`explainRadar`) (run 12/10 10:30 Paris)
- [ ] Radar expliqué, étape 2 : « Je me sens bien / Je couve quelque chose » en 1 tap (entrée `radar_feedback`) + recalibration des seuils ; tags voyage / vaccin comme contrôles des Analyses
- [ ] **Briefing du matin** (I24) : carte « Votre journée » jusqu'à midi (nuit vs norme, cœur / Radar, pression / pollen, énergie prévue en fourchette) + une seule action tirée des pistes solides
- [ ] Contrôle qualité des nuits (I32) : nuits « 100 % léger » / sans phases / tronquées exclues des moyennes de phases — *sans objet au 04/11 : aucune moyenne de phases n'est calculée (durées seules, bornées) ; à reprendre si une carte de phases arrive*
- [ ] Glycémie après les repas (I29) : pic, retour à la base, aire 0–2 h sur la carte du repas (HC ← Juggluco / Libre / Dexcom), sans conseil d'insuline
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
- [ ] Plans « si… alors… » (I30) : 1 à 3 plans choisis, notification locale seulement quand la condition est vraie, ≤ 1 / j
- [ ] Cycle menstruel (I34, HC `MenstruationPeriod`) comme variable de contrôle ; risque migraine / allergie du jour (I35) après ≥ 30 épisodes
- [ ] Notifications locales intelligentes (R#15) : ≤ 2/j, heure apprise, effet mesuré

### C5 — Coach IA (Gemini) ancré dans les données
- [x] **Transparence Gemini** (R#9) : modèle configurable (3.8 Flash par défaut, repli auto sur les autres modèles), avertissement « clé gratuite », photo réduite et sans EXIF/GPS avant envoi
- [ ] Revue hebdo IA ancrée (R#13) : JSON calculé localement → Gemini rédige, chaque chiffre cité vérifié automatiquement, termine par une expérience proposée
- [ ] « Demander à HealthTrack » (R#22) : function calling sur des outils locaux, le LLM ne voit que leurs sorties
- [ ] **Réglage IA** (I33) : désactivée / à la demande / proactive ; ton sans culpabilité. Gemini Nano indisponible sur l'A56 (ML Kit GenAI, 08/10/2026) → LLM local = LiteRT-LM + Gemma 3 1B (I38), plus tard
- [ ] Import de bilans sanguins (R#26) ; LLM on-device optionnel (R#27, Gemma via LiteRT-LM — benchmarker l'A56 d'abord)

### C6 — Qualité, données & fondations
- [ ] Sync Health Connect en arrière-plan + historique complet (R#16) ; écrire les repas dans HC (R#23)
- [x] **Import sûr** : aperçu avant import, « Ajouter » sans doublons ou « Remplacer » confirmé, fichier invalide refusé sans rien effacer, entrées illisibles ignorées (run 10/10 04:30)
- [ ] Sauvegarde chiffrée automatique (R#19, AES-GCM + PBKDF2) — protège contre la perte de données
- [x] **Profil corporel juste** : sexe Withings corrigé (0 = homme), profil saisi dans l'app (sexe, année, taille, poids → pesée `app_weight`), provenance de chaque valeur affichée (run 11/10 10:30)
- [x] **Profil, étape 2** : profil (sexe, année, taille, activité) dans la sauvegarde JSON (champ `profile` optionnel, anciens fichiers acceptés ; « Ajouter » complète, « Remplacer » restaure) ; niveau d'activité choisi ou estimé d'après les pas des 14 derniers jours (×1,4 à ×1,85) (run 11/10 12:30)
- [ ] Dépense énergétique adaptative / TDEE (R#18)
- [x] Lint à 0 erreur (03/11 23:35 : 7 erreurs corrigées ; `npm run lint` dans le check « Frontend (Vitest) » de `tests.yml`)
- [x] **Sauvegarde exhaustive** : l'export n'applique plus les plafonds de l'analyse (perte silencieuse des données anciennes) (#72)
- [ ] Performance IndexedDB : `listEntries` fait un `getAll()` + filtre JS à chaque appel → utiliser les index
- [ ] Code splitting (bundle principal > 500 kB, avertissement Vite) — **PERF-CHANGELOG fait (04/11 19:35)** : Nouveautés
  chargées après le premier affichage (`hooks/useChangelog.js`), fichier de démarrage 902 → 696 Ko (gzip 290 → 230 Ko).
  Reste : **PERF-HUAWEI-LAZY** (pilote montre ≈ 186 Ko importé au démarrage par `watchAutoSync.js` : import dynamique
  seulement si une montre est configurée, à vérifier sur l'émulateur), `analysisEngine.js` (≈ 77 Ko) et `mood/`.
- [x] Tests instables corrigés (run 12/10 20:30) : `Recommendations.test.jsx` attendait la fin de « Chargement » au
      lieu de l'analyse (rouge une fois sur main, run Tests 309) ; `PhoneUsageCard.test.jsx` cliquait avant que l'accès
      accordé soit appliqué (rouge sur la PR #121)
- [ ] Mise à jour en 1 clic après 2027 (I48) : compte « distribution limitée » (gratuit, ≤ 20 appareils) ou parcours
      avancé unique de 24 h ; message clair dans la bannière si Android bloque — à décider avec le propriétaire.
      Précisé le 15/10 20:30 : le parcours avancé peut rester activé **indéfiniment** après l'attente unique de 24 h
      (app « Android Developer Verifier », déploiement progressif) et **ADB n'est pas concerné** → probable solution
      sans compte ; un guide d'une ligne dans la bannière suffira

## Prochaines étapes (ordre conseillé)

**Mise à jour du 27/10 (14:42 Paris)** : polissage de la version play, liste **POL-PLAY** (audit `--play --empty` du 27/10) :
- [x] **POL-PLAY-1** Analyses vierges : plus de carte « Rapport PDF » ni « Débloquer » sans note du ventre (ligne « Bientôt »).
- [x] **POL-PLAY-2** (fait le 27/10 16:33) Accueil vierge : « Sommeil, cœur et pas arrivent de votre montre » suppose une montre ; dire que
  le téléphone en donne déjà (pas, nuits) et proposer Sources.
- [x] **POL-PLAY-3** (fait le 27/10 16:33) « Tester un groupe FODMAP » : chevron collé au texte ; étiquette « premium » en play hors période
  de lancement (comme le rapport PDF).
- [x] **POL-PLAY-4** (fait le 27/10 17:33) Même audit sur données de démo, clair et sombre (Accueil, Journal, Analyses,
  Sources) : « hier à 10:19 » sur la carte ventre ; « Dépense totale de la journée » au lieu de « Calories brûlées
  totales (Health Connect) » (test : aucun nom de source dans les libellés de `VARIABLE_META`) ; ligne « visage »
  simplifiée. Rien à redire en sombre (contrastes corrects). Défauts restants :
- [x] **POL-PLAY-5** (27/10 19:33 : alias `energy_out` dans `mergeLinks`) Analyses : « Calories brûlées (activité) » et « Dépense totale de la journée » apparaissent comme
  deux liens presque identiques ; n'en garder qu'un (le plus solide) ou les regrouper.
- [x] **POL-PLAY-6** (27/10 18:33) Analyses : « Alcool » est à la fois une piste « À confirmer » (6 jours avec) et « En cours de
  collecte : Alcool (4/5 jours avec) » (fenêtre visage) : ne pas lister en collecte un tag déjà montré.
- [x] **POL-PLAY-7** (27/10 18:33) Analyses : la ligne mono « Autres mesures : le jour même (visage) piste solide » est technique ;
  la dire en phrase (« aussi avec votre bien-être estimé ») ou la mettre dans les détails.
- [x] **POL-PLAY-8** (27/10 18:33) Journal : la tuile « Repas · 1 · ≈ 479 kcal » passe sur deux lignes (« kcal » seul) ; Accueil :
  tuiles « VFC nuit » et « Pas » à « — » en fin de journée alors que la veille est connue (vérifier si les données de
  démo n'ont simplement pas le jour même, sinon afficher la veille avec « hier »).

**Ajouté le 27/10 20:33 (run « idées », spécification dans `IDEES.md` I184–I185)** — remarques de la Play Console
« Pour votre prochaine version » du 27/10, rangées dans le polissage :
- [x] **POL-PLAY-9** (27/10 21:33 ; encarts sous Android ≤ 14 injectés par notre `SystemBarsPlugin`, Capacitor ne le fait qu'à partir de 15) Bord à bord pour tous : `EdgeToEdge.enable(this)` avant `super.onCreate` dans `MainActivity`,
  dépendance `androidx.activity` explicite ; job émulateur **API 30 ou 34** en plus (Accueil, une modale, clavier
  ouvert) ; captures API 35/36 inchangées. Petit, sans risque pour les données.
- [x] **POL-PLAY-10 (R8a)** (28/10 01:33, #449 ; 90 % des classes renommées ; 100534 en test interne avec son mapping) R8 sur la variante play (`release` = play seulement) : `minifyEnabled true`,
  `proguard-android-optimize.txt`, `-keepattributes SourceFile,LineNumberTable` ; `mapping.txt` envoyé par
  `publish.mjs` (deobfuscationFiles, testé) ; job émulateur sur un APK **play release** (visage ONNX/LiteRT, Health
  Connect, Premium, PDF, notification, logcat sans `ClassNotFoundException`). Test interne seulement ; avant février 2027.
- [x] **POL-PLAY-16** (28/10 03:33) Table Ciqual en un seul exemplaire dans l'APK (−2 Mo non compressé) + dépendance `@m430/capacitor-app-install` retirée.
- [x] **POL-PLAY-17** (28/10 06:33) Sous-onglets du Journal à 360 px : « Tendances » touchait sa bordure → largeur selon le
  libellé + marge ; contrôle « TEXTE QUI DÉBORDE » ajouté à `npm run visual` (à lancer avec `--size=360x780`).
- [x] **POL-PLAY-18** (28/10 13:33 ; jours en deux lettres, barres en `--mint-label`) Historique du bien-être : les barres « Expressions » sont en lilas (couleur des pistes) sur une page
  menthe (bien-être) ; axe des jours « J V S D L M M » ambigu (deux « M ») → « lu ma me » ou dates courtes.
- [x] **POL-PLAY-19** (28/10 14:42 ; « Dernière mesure reçue », lignes `watch-data-row--<état>`) Écran Montre (démo) : « Pas encore de lecture détaillée : synchronisez la montre » alors que
  4 types sont reçus ; cartes « rien » à bordure et cartes « reçu » sans bordure (style incohérent).
- [x] **POL-PLAY-20** (28/10 07:33 ; bordure, badge et repère en encre neutre) Tendances : « FC au repos · Plus basse que d'habitude » en ocre (couleur d'alerte) alors qu'aucun
  écart n'est bon ou mauvais par principe (règle 6) : couleur neutre pour un écart sans jugement.
- [x] **POL-PLAY-104** (03/11 04:35) Audit `--play --subscription=launch --size=360x780` (16 pages, rien ne déborde) ; le faux relais du banc sert la vraie date de `launch-period.json` (`until` / `iosUntil`) : captures « 27 nov. » (Play) et « 6 nov. » (iPhone).
- [x] **POL-PLAY-105** (04/11 03:35) Audit `--play --empty --dark --size=360x780` (16 pages, rien de cassé) : le rail de la barre « Vos pistes arrivent dans N jours », seul repère visuel de la carte au jour 1, se confondait avec le fond lilas en sombre (≈ 1,3:1) → token `--lilac-track` (clair `#c6bff5`, sombre `#48428a`, ≥ 1,4:1 sur le lilas, barre ≥ 3:1 sur le rail), test dans `tokens.test.js`.
- [x] **P32-ABOS** (03/11 01:35) Abonnements vendables dans les 5 pays de la production (P32 : FR, BE, LU, CH, CA ; pas US) : `SALE_REGIONS` + `localPrices` (CHF, CAD) dans `app/scripts/play/subscriptions.mjs` ; à la création, toutes les régions ; sur un abonnement existant, PATCH `updateMask=basePlans` qui ajoute seulement les pays manquants (configurations et prix français renvoyés tels quels), puis l'offre d'essai (`updateMask=phases,regionalConfigs`) ; refus de Google → `regionError` dans le résumé, sans arrêter le reste. Sans ça, l'écran d'achat aurait été vide hors de France. [x] vérifié après le merge (03/11 ~02:05, run de `ab16d9a`) : Silver annuel et mensuel, essai 14 j et Gold mensuel ACTIVE dans BE, CA, CH, FR, LU ; prix français inchangés ; aucun refus de Google.
- [x] **POL-PLAY-102** (03/11 02:35, C4) Premier lancement : l'Accueil se montait et s'affichait un instant avant « Bienvenue » (calculs pour rien) → `Layout` attend la réponse de `needsOnboarding()` (rond de chargement) seulement si l'onboarding n'est pas fait, et précharge l'onboarding ; mesuré en Chromium : flash 3/3 → 0/3. Test `Layout.onboardingGate.test.jsx`. Émulateur de la PR : premier écran 14,4 → 12,5 s (debug), 8 → 3 s (release R8).
- [x] **POL-PLAY-103** (03/11 03:35) Audit `--play --empty` avant l'arrivée des testeurs, avec et sans la période de lancement (Accueil, Journal, Repas, Analyses, Sources, Paramètres, Premium, clair et sombre) : aucun défaut dans l'app ; « Gold offert pendant le test » partout où il faut, plus d'étiquette « premium » sur « Tester un groupe FODMAP ». Seul écart : le faux relais du banc visuel donnait 10 analyses par jour (Silver) pendant la période de lancement alors que le vrai relais donne Gold, 20 (`relay/src/credits.js`) ; recalé (`tier`, 19 / 20 ; `--subscription=gold` aussi premium).
- [x] **POL-PLAY-105** (03/11 13:35) Rapport PDF : les semaines d'avant la première note (période plus longue que le journal) ne font plus de rangées « 0 – – – » (une ligne « Aucune note avant la semaine du … ») ; `frDate` écrit « 1er » (oubli de POL-PLAY-99). Test `renderPdf.test.js`.
- [x] **POL-PLAY-11 (R8b/c)** Alpha après une journée sans plantage dans Android vitals ; `shrinkResources` à part (mergé le 03/11 15:35, #656 : AAB 100740 −29 Ko, gain faible ; à garder, sans risque vérifié à l'émulateur).
  **02/11 22:41 : Alpha = 100721** (envoyée par le propriétaire, P40 ; code de `bd7d5ac`, sans plantage connu en test interne).
  **03/11 14:35 : `shrinkResources true`** sur la release play, `res/raw/keep.xml` (mode safe, ressources de l'app
  gardées) ; modèles et polices dans assets/, jamais réduits. Reste à lire la taille au bilan (100739 = 15,9 Mo).
- [ ] **POL-PLAY-12** Nouvel audit `--play --empty` puis démo, écran par écran (Onboarding, Accueil, Journal, Analyses,
  Sources, Paramètres) — prévu par le run de 19:33 ; ✅ (27/10 22:33) « Marcher davantage » / « Bouger davantage » :
  un seul levier par famille (le plus solide). ✅ (27/10 23:33) audit `--play --empty` puis démo relu (Accueil,
  Journal, Analyses, Sources, Paramètres, Premium) ; carte ventre du soir : une seule question (bilan du jour), la
  note « à l'instant » derrière « Noter un moment précis ». Défauts restants rangés en POL-PLAY-13 à 15.
- [x] **POL-PLAY-13** (28/10 00:33) Paramètres → « Ce qui vous amène » sans aucun choix : le texte dit que la carte ventre n'apparaît
  qu'avec « Mon ventre », alors qu'elle s'affiche tant qu'aucun choix n'est fait (gutCardMode 'show'). Ajuster la phrase
  (« … ou tant que vous n'avez rien choisi ») ou présélectionner l'objectif.
- [x] **POL-PLAY-14** (28/10 00:33 ; famille du levier masquée dans les liens) Analyses (démo) : « Autres liens repérés » montre « Calories brûlées (activité) … Piste : Bouger
  davantage » juste sous la piste « Marcher davantage » : même famille, à regrouper ou à ne pas répéter.
- [x] **POL-PLAY-15** (28/10 00:33 ; « 37 · normal », échelle de la montre) Journal (démo) : « Stress montre 37 / 99 » — l'échelle « / 99 » est déroutante ; « 37 / 100 » ou
  « stress 37 (bas) ». Vérifier l'échelle réelle de la montre avant de changer.
- **Audit du run « idées » du 28/10 08:33** (`npm run visual -- --play --empty` clair, puis `--play --dark` sur
  données de démo ; défauts nouveaux, classés par impact) :
- [x] **POL-PLAY-21** (28/10 10:33 ; résumé `services/pistesSummary.js` écrit par Analyses, lu par l'Accueil) Accueil (démo) : la carte lilas dit encore « Assez de jours pour chercher des pistes… voyez
  l'onglet Analyses » alors qu'Analyses montre déjà 2 pistes solides → « 2 pistes repérées » + la première en une
  ligne (aperçu flou hors premium, comme Analyses), toucher = Analyses. Retirer les deux boutons contour « Vos derniers
  jours, dans le Journal » / « Vos tendances, dans le Journal » (doublons de la barre d'onglets, bas de page chargé).
- [x] **POL-PLAY-22** (28/10 11:33 ; `LinkCard` à chevron, en-tête sans « week-end ») Analyses, « Autres liens repérés » : la vue simple affiche les statistiques en mono (« 30 jours
  avec · 44 sans · déduit de vos séances (début après 18 h) · week-end à part : +0,8 », « r = +0,48 · ≈ 63 jours
  indépendants ») → une phrase + l'étiquette, chiffres derrière le chevron (principe « simple d'abord » du 24/10) ;
  en-tête « … · week-end pris en compte » dans les détails ; « « visage » : comparé à votre bien-être estimé par la
  caméra (29 jours) » à réécrire ; « plus c'est élevé, meilleur est votre bien-être » → « va avec un meilleur
  bien-être » (corrélation, pas causalité) ; « Comment c'est calculé » en petit (retour 7 du 24/10).
- [x] **POL-PLAY-23** (28/10 09:33 ; `evidenceLevel(q, minGroupDays)`, seuil `MIN_SOLID_GROUP_DAYS = 8` = `gutDays.MIN_EXPOSED_DAYS`) Statistique à vérifier : « Alcool · le lendemain · −0,2 point · Piste solide » avec **6 jours
  exposés** (démo). Les pistes ventre exigent 8 jours exposés (`gutDays.MIN_EXPOSED_DAYS`) ; les facteurs binaires du
  bien-être semblent n'en demander que 5 (« En cours de collecte : Malade (2/5 jours avec) »). Aligner : « Piste
  solide » seulement à partir de 8 jours exposés (sinon « à confirmer » au mieux), et le vérifier au banc des nulles.
- [x] **POL-PLAY-24** (28/10 15:39 ; `.btn` et `.upload-btn` en pilule, 52 px, compacts 44 px, `buttonShape.test.js`) Boutons de deux formes : pilules (« Continuer », « Photo du repas », « Débloquer ») et rectangles
  arrondis (« Découvrir le premium », « Restaurer un achat », « Ajouter une source », « Utiliser ma position
  approximative », « Connecter une montre », « Désactiver », « Donner mon avis sur le Play Store », « + 1 cigarette »).
  DESIGN.md : boutons pilule de 52 à 56 px → `.btn` en pilule partout, captures avant/après.
- **Demandes de la routine iOS** (dépôt spreadzenox/HealthTrack-iOS, `journal/DEMANDES.md`, transmises le 28/10) :
- [x] **IOS-ONB-ACTION** (04/11 02:35 ; demande iOS du 29/10) Onboarding, écran Health Connect : `.btn { flex: 1 }` dans la colonne
  `.onb-body` étirait « Autoriser Health Connect » en pilule de 646 px ; `flex: 0 0 auto` sur `.onb-action` (52 px), test
  `buttonShape.test.js`. Invisible aux audits : sur le web Health Connect est « indisponible », le bouton n'apparaît pas ;
  `--onboarding=health` ajouté au banc visuel (même limite : bouton vérifié par injection dans le DOM).
- [x] **IOS-NOTES-3010** (04/11 02:35 ; demandes iOS du 30 et 31/10) `variants: ["play", "sideload"]` sur `vfc-nuit`,
  `montre-compacte`, `sources-couleur` ; `onboarding-compteur` sans « Health Connect », `phrases-aide` sans la liste
  d'écrans (`sommeil-une-source` était déjà marquée). Encore « à transmettre » côté iOS : `repas-actions` (29/10, à
  scinder), `sources-titre` (29/10), `paywall-lancement` (29/10) — antérieures au 29/10 ou déjà cachées sur iPhone.
- [x] **IOS-1** (28/10 12:33) Relais : Play Integrity exigé des seules requêtes Android. `requestPlatform()` :
  `X-Platform: ios`, ou `X-Integrity-Status: no_plugin` sans `X-Platform` → statut `not_android`, jamais bloqué (même
  en `enforce`) jusqu'à App Attest ; `X-Platform` dans les en-têtes CORS ; bilan du déploiement : origine « iPhone »
  et « Part des requêtes iPhone (hors CI) ». En-têtes falsifiables : plafonds par installation et global inchangés.
- [ ] **I6-RELAIS** (PRIORITÉ des runs de code depuis la demande du 01/11 vers 17:10 ; seule une CI cassée passe avant)
  Le relais accepte aussi les abonnements App Store sans rien changer au chemin Google Play. Étapes :
  - [x] **I6-RELAIS-1+2** (01/11 17:33) `relay/src/appstore.js` : un `purchaseToken` en forme de JWS (en-tête JSON
    avec `alg`) est une transaction StoreKit 2, vérifiée sur place : ES256, chaîne x5c feuille → intermédiaire →
    racine égale octet pour octet à Apple Root CA - G3 (embarquée, empreinte testée), marqueurs OID de l'App Store,
    validité des certificats à `signedDate` ; bundleId `fr.jpesquet.sante` (`APPSTORE_BUNDLE_ID`), environnement
    Sandbox ou Production, abonnement auto-renouvelable ; `expiresDate`, `revocationDate` (→ `revoked`), essai
    (`offerDiscountType: FREE_TRIAL`) ; `renewalInfo` facultatif (à côté du jeton ou dans `transaction`) vérifié de la
    même façon : `autoRenewStatus` (0 → `canceled`, premium jusqu'à l'échéance) et `gracePeriodExpiresDate` (→ `grace`).
    `halcya_gold…` → Gold, `halcya_premium…` → Silver, autre → pas de premium. `appAccountTokenFor(installation)` =
    32 premiers chiffres de `accountIdFor` au format UUID ; comme pour Play, `accountMatch` est rapporté, pas bloquant
    (une réinstallation change l'identifiant). Sortie identique à Play avec `source: 'appstore'`,
    `data.transaction.type: 'ios-appstore'` ; JWS refusé → 400 `invalid_purchase`. `X-Purchase-Token` accepte un JWS
    (16 Kio max) pour les crédits (10/jour Silver, 20 Gold, inchangés). 10 tests sur une chaîne générée par openssl
    dans un dossier temporaire (aucune clé dans le dépôt).
  - [x] **I6-RELAIS-3** (01/11 18:33) `POST /appstore/notifications` : `signedPayload` vérifié par
    `createAppStoreVerifier` (64 Kio au plus), puis `signedTransactionInfo` / `signedRenewalInfo` ; bundleId et
    environnement contrôlés (autre app ou Xcode → 200 sans effet, signature fausse → 400). État de l'abonnement à la
    date de la notification : non premium (REFUND, REVOKE, EXPIRED, GRACE_PERIOD_EXPIRED, DID_FAIL_TO_RENEW sans grâce)
    → verrou ; premium (DID_RENEW, SUBSCRIBED, grâce, DID_CHANGE_RENEWAL_*) → ouvert. Registre `appstore-status`
    (Firestore ; clé = empreinte de `originalTransactionId`, champs state / premium / at) ; une notification plus
    ancienne que l'état connu ne change rien. `/v1/subscription/verify` refuse une transaction signée avant un verrou
    (`locked` au journal) ; registre injoignable → abonné jamais bloqué (`lockError`), notification → 503 (relivrée).
    URL : `https://halcya-relay-81378799481.europe-west1.run.app/appstore/notifications` (App Store Connect, production et sandbox, version 2). Limite connue : le cache des droits du relais
    (1 h par installation, en mémoire) peut garder Gold jusqu'à 1 h après un remboursement.
  - [x] **I6-RELAIS-6** (01/11 19:33) App : `STORE` dans `config/distribution.js`, fixé au build par `VITE_STORE`
    (`play` par défaut, `appstore` pour l'app iPhone) : `name`, `Name`, `inStore`, `fromStore`, `account`, `at`,
    `manageUrl`. Page d'abonnement (« … » pendant l'achat, « Annulable à tout moment … », « Lecture des formules … »,
    aucune formule, restauration), Paramètres, messages d'achat (erreur, attente, `ALREADY_GOLD_MESSAGE`) tirés de
    `STORE`. `storeOfPurchase(source)` : un achat garde son magasin (`play` / `appstore`), sinon celui de la version ;
    l'app garde maintenant `source: 'appstore'` du relais ; « Gérer mon abonnement » → https://apps.apple.com/account/subscriptions,
    grâce / suspension (Paramètres, carte de l'Accueil) nomment l'App Store ; `purchasePlan(…, { store })` : sur
    l'App Store, « Passer à Gold » part sans `oldPurchaseToken` ni `replacementMode`. Textes Android identiques.
    **À faire côté routine iOS** : construire avec `VITE_STORE=appstore` ; le plugin StoreKit doit rendre les
    `products` sous les identifiants `halcya_premium` / `halcya_gold` (ou adapter `OWN_PRODUCTS`) pour que le garde
    « déjà Gold » marche ; le rappel de fin d'essai reste réservé aux achats Play (Apple envoie le sien).
  - [x] **I6-RELAIS-7** (livré le 01/11 21:33 : `trialReminderPlugin(store = STORE)` rend `null` hors `STORE.id === 'play'`, faux plugin compris ; test unitaire ; captures `--play --routes=/premium` avec et sans `VITE_STORE=appstore`) (trouvé le 01/11 20:33, IDEES I206) Sur l'App Store, la page
    d'abonnement promettrait « jour 12 : On vous prévient par une notification » et « Rappel 2 jours avant la fin de
    l'essai » (`trialReminderAvailable()` vrai dès que le build est natif avec `FEATURES.billing`, plugin absent ou
    non), alors que le rappel n'est programmé que pour `source: 'play'`. Ne promettre le rappel que si
    `STORE.id === 'play'` et `Capacitor.isPluginAvailable('TrialReminder')` ; test `VITE_STORE=appstore` ; Android
    inchangé. À signaler à la routine iOS une fois livré.
  - [ ] **I6-RELAIS-5** (plus tard) App Attest ; d'ici là exemption iOS (`X-Platform: ios` / `no_plugin`) inchangée.
    **Spécifié le 02/11 08:33** (`IDEES.md` I208, doc Apple lue, racine App Attest épinglée par son empreinte ; zéro
    dépendance, zéro secret ; reçu et « fraud metric » laissés de côté). Un run par étape :
    - [x] **5a** ✅ 02/11 09:33 `relay/src/cbor.js` (décodeur borné : longueurs indéfinies, étiquettes, flottants,
      doublons, octets en trop refusés ; vecteurs de la RFC 8949) + `relay/src/authdata.js` (rpIdHash, flags,
      counter, aaguid → `production` / `development`, credentialId, clé COSE ES256 → point X9.62 + KeyObject, point
      hors courbe refusé, extensions `apple_validation_category_01` / `apple_bundle_version_01`) ; 12 tests, aucun
      branchement dans le serveur pour l'instant.
    - [x] **5b** ✅ 02/11 10:33 `relay/src/appattest.js` : `createAppAttestVerifier({ teamId })` vérifie l'attestation
      (chaîne `x5c` → racine « Apple App Attestation Root CA » épinglée, empreinte revérifiée ; nonce de l'OID
      1.2.840.113635.100.8.2 lu par un petit lecteur DER, forme `[1]` d'Apple et forme nue ; keyId = SHA-256 du point
      = credentialId, clé COSE identique au certificat ; rpId `<Team ID>.fr.jpesquet.sante`, compteur 0, aaguid de
      production, développement seulement avec `allowDevelopment` ; catégorie 2/4, 3 en développement) ; raisons
      `format`, `chain`, `nonce`, `key_id`, `rp_id`, `aaguid`, `counter`, `category`. 11 tests sur une chaîne
      `openssl` jetable (racine et intermédiaire P-384), Team ID fictif ; rien de branché.
    - [x] **5c** ✅ 02/11 11:33 `createAssertionVerifier` (`appattest.js`) : signature ECDSA sur
      SHA-256(authenticatorData ‖ SHA-256(clientData)), `clientData` recomposé par le relais
      (`halcya-assert:<installId>:<heure ms>:<SHA-256 hex du corps>`), heure ±5 min, rpIdHash, compteur strictement
      croissant ; raisons `signature`, `clock`, `counter`, `rp_id`, `format`. `relay/src/attestregistry.js` :
      `createAttestRegistry` (`register` : attestation vérifiée puis clé liée à l'empreinte `appattest:<installId>`,
      `key_reused` si autre installation ; `check` : `unknown_key`, `key_reused`, compteur avancé en mémoire avant
      l'écriture, rejeu simultané refusé, lecture Firestore en panne → erreur brute pour `unavailable` en 5d, écriture
      en panne → `persisted: false`), cache borné, `createFirestoreAttestStore` (collection `appattest`, `expireAt`
      13 mois). 15 tests (clés P-256 jetables + un bout-en-bout sur la chaîne openssl). Rien de branché.
      Au déploiement (5d/5e) : politique TTL sur `appattest` à ajouter à l'action du propriétaire (comme P33).
    - [x] **5d-1** ✅ 02/11 12:33 `relay/src/attestroutes.js` : `createChallengeStore` (32 octets aléatoires, 5 min,
      usage unique, lié à l'installation, brûlé à la première présentation, borné à 10 000) et `createAttestRoutes`
      (`POST /v1/attest/challenge` sans corps → `{ challenge, expiresInSec }` ; `POST /v1/attest/register`
      `{ keyId, attestation, challenge }` → `{ ok, environment }`, 400 corps incomplet, 403 `{ error: 'attest',
      reason }` dont `challenge`, 503 si Firestore ne répond pas). Même quota par installation que
      `/v1/subscription/verify`. `APP_ATTEST_MODE` (`off` par défaut, valeur inconnue → `off`) et `APPLE_TEAM_ID`
      (10 caractères, sinon vide) dans `config.js` ; `index.js` ne crée les routes qu'avec un mode autre que `off` ET
      un Team ID : **aucun changement au déploiement** (404 comme avant). CORS : `X-AppAttest-Key`,
      `X-AppAttest-Assertion`, `X-AppAttest-Time`. Journaux `event: 'appattest'` (statut, raison, empreinte ; jamais
      le défi ni la clé). 10 tests (`attestroutes.test.js`).
    - [x] **5d-2** ✅ 02/11 13:46 `createIntegrityGuard({ appAttest })` : requête iOS (X-Platform: ios ou no_plugin)
      avec `APP_ATTEST_MODE` ≠ off → `appAttest.verify` (`attestroutes.js`) : en-têtes `X-AppAttest-*` →
      `registry.check` sur le **corps brut** (le serveur lit les octets puis les parse) ; statuts `attest_passed` /
      `attest_missing` / `attest_rejected` (raison dans `reasons`) / `attest_unavailable` (Firestore : jamais bloquant),
      bloquants seulement en `APP_ATTEST_MODE=enforce`, indépendamment d'`INTEGRITY_MODE` ; 403 avec un message
      « App Store » pour l'iPhone. Journal `event: 'integrity', platform: 'ios'` (même tableau du bilan, origine
      « iPhone ») ; ligne « App Attest (clés de l'iPhone) » du bilan du déploiement (événements `appattest`).
      Mode `off` : comportement d'avant (`not_android`). 7 tests (`attestguard.test.js`), 188 tests relais.
    - [~] **5e** relais déployé en `APP_ATTEST_MODE=observe` avec le Team ID (02/11 21:35, vérifié le 02/11 22:35 :
      `POST /v1/attest/challenge` → 200) ; message à la routine iOS écrit dans `journal/POUR-IOS.md` (02/11 22:35).
      Reste : quelques jours propres en observation (bilan « App Attest » du déploiement), puis `enforce`
      seulement quand l'app iPhone signe ses requêtes.
  - [x] **IOS-LANCEMENT-FIN** (02/11 22:35, décision du propriétaire du 02/11 au soir) : `iosUntil`
    (`2026-11-06T23:00:00Z`) dans `relay/src/launch-period.json` ; `launchUntilFor(période, now, plateforme)` dans
    `billing.js` (iPhone = la plus tôt des deux dates ; une requête qui se dit Android n'a jamais plus que la période
    play) ; `isIosRequest` (`X-Platform: ios`, `no_plugin` sans en-tête, ou clé App Attest) sur `/v1/subscription/verify`,
    `/v1/credits` et l'analyse ; cache des droits séparé par plateforme ; variable `LAUNCH_PREMIUM_IOS_UNTIL`. App :
    `platformHeaders()` (`X-Platform: ios` si `VITE_STORE=appstore`) sur les appels au relais ; `renewalInfo` transmis
    (repris du correctif iOS 37). Bilan du déploiement : ligne « iPhone sans achat ». Tests : `launch-ios.test.js`
    (6), app (3). Captures `--play --store=appstore --routes=/premium --subscription=launch [--ios-launch=ended]`.
    **À vérifier au déploiement** : « iPhone sans achat … jusqu'au 2026-11-06 », puis le 07/11 « premium=false ».
- [x] **IOS-3** (28/10 12:33) Notes de Nouveautés propres à Android marquées `"variants": ["play", "sideload"]`
  (`2026-10-24-1630-sauvegarde-android`, `2026-10-27-2133-bord-a-bord`, `2026-10-28-0433-montre-restauree`) ; à
  faire pour toutes les suivantes (barres système, sauvegarde Android, montre Huawei en Bluetooth, Health Connect,
  Play Billing → `["play"]`).
- [x] **IOS-4** (28/10 12:33) Données : « la sauvegarde du téléphone » (« gérées par le système ») au lieu de « la
  sauvegarde Google » ; test. La politique de confidentialité et les conditions publiées restent celles de la version
  Android (Paramètres Android → Google) : l'app iPhone aura les siennes. À appliquer aussi dans POL-PLAY-25.
- [x] **POL-PLAY-25** (28/10 16:40 : « rangées sur ce téléphone, jamais chez Halcya », divulgations « Envoyé par Halcya : rien … sauvegarde du téléphone », test qui interdit les anciennes phrases) (écrire « la sauvegarde du téléphone », IOS-4) Textes « tout reste ici » à rendre honnêtes (décision « sauvegarde Android conservée » du 24/10,
  point a) : « Tout reste **sur cet appareil** » (Sources, `Connectors.jsx:500` ; profil corporel,
  `BodyProfileCard.jsx`) et « Vos données restent sur votre téléphone » (Premium) — alors que la météo envoie une
  position arrondie et que la sauvegarde Google du téléphone copie les données. Reprendre la formule déjà juste de
  Données (`Data.jsx:195`).
- [x] **POL-PLAY-26** (28/10 16:40 : encart retiré, test) Sources, carte météo : encart ambre « Pression en forte baisse : souvent citée comme déclencheur
  de maux de tête chez les personnes sensibles » — couleur d'alerte pour une norme générale (règle 6, même logique que
  POL-PLAY-20), hors de la cible ventre → encart neutre ou retiré (les Analyses disent si la pression compte pour vous).
- [x] **POL-PLAY-27** (28/10 17:34 : « ⋯ » par saisie, Météo lilas, « cette nuit », tests) Petits défauts : Accueil, tuile « Sommeil 6 h 30 » sans « cette nuit » alors que VFC et Pas disent
  « hier » ; Journal › Jours, tuile « Météo » noire (seule sans pastel, retour 6 du 24/10 « plus de couleur ») ;
  chaque note du jour garde « Modifier · Supprimer » visibles (encombrant) → toucher la ligne ou menu « ⋯ ».
- [x] **POL-PLAY-28** (28/10 18:33 : titre « Health Connect » + « Montre, bague, balance : … » en tête de la description ; carte visage éteinte en play avec `unlockAvailable` : « … et, si vous le voulez, à chaque déverrouillage » ; tests) Sources (vierge) : titre « Health Connect (montre, bague, balance…) » sur 2 lignes → « Health
  Connect » + sous-titre ; vérifier que la carte « Lecture du visage » parle du déverrouillage quand `faceUnlockPlay`
  est allumé (aujourd'hui « quand vous ouvrez Halcya »).
- [x] **POL-PLAY-29** (28/10 19:33 : ligne `.gut-card-actions`, icône « plus » comme « Noter moi-même », test) Accueil, carte
  « Votre ventre » le soir : « Noter un moment précis » et « + Selles » empilés sur deux lignes avec un vide, styles
  différents → une seule ligne de gestes facultatifs.
- [x] **POL-PLAY-30** ✅ 28/10 21:33 (`expireAt` = 1er du mois, 13 mois après le mois de la dernière analyse, `expiryOf` ; textes app + confidentialité ; test `serverRetentionTexts.test.js` ; reste **P33** au propriétaire) (idées 28/10 20:33, I189 ; **avant les testeurs**) Relais : compteurs de crédits dans Firestore sans
  expiration alors que confidentialité (« en mémoire »), Données (« Nos serveurs ne gardent rien ») et Paramètres
  (« Notre serveur ne garde rien ») disent le contraire. (a) `expireAt` écrit par `persist` (+ 13 mois) + test relais ;
  (b) action du propriétaire **P33** : politique TTL (commande dans I189) ; (c) textes app + `privacypolicy.html`
  justes, test qui interdit les anciennes phrases ; data-safety inchangé (déjà « éphémère : non »), à relire.
- [x] **POL-PLAY-31** ✅ 28/10 23:33 (`.btn-irreversible` : contour et texte `--color-alert`, clair et sombre ; confirmation `.btn-danger` inchangée) (I190 ①) Données : « Supprimer toutes mes données » en bouton d'action irréversible (contour orange ou
  encre), distinct d'« Importer ».
- [x] **POL-PLAY-32** ✅ 28/10 22:33 (`leverTitle` dans `leverSuggestion` ; Analyses et carte lilas ; action « À tester : … » au chevron) (I190 ③, règle 6) Accueil, carte lilas, et titres de pistes : « facteur → effet » (« Nuits plus longues →
  meilleur bien-être ») au lieu de l'impératif `LEVER_ACTIONS` ; l'action reste dans les détails d'Analyses.
- [x] **POL-PLAY-33** ✅ 28/10 23:33 (`GroupTag` : rien tant que pas testé ; chevron `.fodmap-group-chevron` sur les groupes à un aliment ; « Voir les liens incertains ») (I190 ② ④) Réintroduction : chevron sur chaque groupe, étiquette « pas testé » retirée (seulement les
  résultats) ; Analyses : « Voir les liens incertains » sans le nombre.
- [x] **POL-PLAY-34** ✅ 29/10 00:33 (`upload-btn--primary` : « Photo du repas » plein émeraude sur toute la ligne, Galerie et Décrire en contour dessous ; test) Journal › Repas : les trois gestes « Photo / Galerie / Décrire » avaient le même poids (retour 5 du 24/10 appliqué à l'Accueil seulement).
- [x] **POL-PLAY-35** ✅ 29/10 01:33 (« Vos repas » et « Vos apports », comme « Vos derniers jours » et « Vos tendances » ; tests) Journal : le titre « Repas » / « Nutrition » répète le sous-onglet actif (« Jours » dit « Vos derniers jours ») → titre utile ou retiré, petit.

- [x] **POL-PLAY-36** ✅ 29/10 02:33 (`utils/frenchSpacing.js` installé sur `#root` en français : espace insécable après « et avant », :, ;, ?, ! à l'affichage, champs de saisie et code exclus ; `h1, h2, h3 { text-wrap: balance }` ; 6 tests) Audit démo sombre (POL-PLAY-12) : guillemets seuls en bout de ligne (Réintroduction « (« / Blé »), titre du paywall « à « je / comprends » ».
- [x] **POL-PLAY-37** ✅ 29/10 03:33 (`fixFrenchSpacing` : insécable entre un nombre et son unité courte — hPa, kcal, bpm, pas, km, mm, h, j, %, €, °C… — sauf si une lettre suit, et entre les groupes de milliers ; 3 tests ; Sources démo : « 1004 hPa » sur une ligne) (audit 29/10 02:33) Nombre et unité séparables : Sources, carte météo « · 1004 / hPa (−8) » coupé en fin de ligne. Étendre `fixFrenchSpacing` (chiffre + espace + unité courte : hPa, mm, h, ms, °C, %, €, kcal, g) ou insécables dans `format.js` ; vérifier les captures.
- [x] **POL-PLAY-38** ✅ 29/10 04:33 (audit `--play --empty` du même run ; `wellbeing-charts-empty`, titre h3 « Votre bien-être », sous-titres h4 « Par jour, sur 5 » ; 2 tests) Journal › Tendances vierge : grand cadre gris « Pas encore de bien-être noté » de ~170 px et titre technique « Bien-être (0–5) » sous un « Votre forme » en simple ligne → une ligne discrète avec liens Sources et Aujourd'hui.
- [x] **POL-PLAY-39** ✅ 29/10 05:33 (audit onboarding play pas à pas, vierge, clair et sombre) Paywall en période de lancement : titre « Premium offert pendant le test » répété dans un cadre « Premium offert pendant le test, jusqu'au 18 / nov. 2026 » (date coupée) → date dans la phrase d'accueil, cadre retiré ; `fixFrenchSpacing` lie jour, mois et année ; `shortDate` écrit « 1er déc. ». Reste de l'audit : onboarding avec Health Connect (écrans `health`, `aha`) et lecture du visage (`face`) à relire au prochain run.
- [x] **POL-PLAY-40** ✅ 29/10 06:33 (audit onboarding play `aha` et `face`, clair et sombre) « Vos 30 derniers jours » : la source « Gadgetbridge via Health Connect » répétée en mono sous chacun des 4 chiffres → une seule ligne « D’après … » sous la liste quand tous viennent de la même app (une par chiffre sinon) ; test. Écran `face` (play, lecture à l'ouverture) relu : rien à redire.
- [x] **POL-PLAY-41** ✅ 29/10 07:33 (audit analyse photo play et repas décrit, clair et sombre ; `mealResultLayout.test.js`) Carte d'analyse d'un repas : la ligne FODMAP héritait de `.results li` (flex « espace entre ») et s'étirait d'un bord à l'autre ; « Enregistrer ce repas » coupé sur deux lignes à côté de « Nouvelle photo » / « Annuler » → ligne FODMAP en phrase, gestes en colonne, principal en premier.
- [x] **POL-PLAY-42** ✅ 29/10 15:00 (audit Analyses play démo, clair et sombre ; test page) « Autres liens repérés » : légende « Étiquette « visage » » affichée sans aucun lien étiqueté (le visage réduit à une ligne « aussi ») → seulement au-dessus d'une liste qui montre l'étiquette ; « Comment c'est calculé » du pied de page centré, gris, sans gras (retour 7 du 24/10).
- [x] **POL-PLAY-43** ✅ 29/10 16:00 (audit Réintroduction play `--subscription=launch`, clair et sombre ; tests de cohérence avec la table) Les aliments du test Sorbitol (avocat, mûres) et Mannitol (chou-fleur, champignons crus) restaient sous le repère du groupe même au 3e jour d'après Ciqual 2025 → pruneaux secs et champignons de Paris poêlés (`reference` Ciqual par aliment, avocat `retired` mais lisible) ; « Lait (lait) » → « Lait ».
- [x] **POL-PLAY-44** ✅ 29/10 17:00 (audit du rapport PDF rendu en PNG, démo et vierge ; carte `/data` play `--subscription=launch`) Rapport PDF : avant 28 jours de notes, « Aucun lien n'a passé toutes les vérifications » (le rendu attendait un statut `collecting` qui n'existe pas ; `summarizeGutLinks` renvoie `too_early`) → « Pas encore assez de notes du ventre (9/28 jours) » ; semaines sans note « 0 0 0 0 » → « 0 – – – » ; sans aucune note, ni tableau des semaines ni « 0 comparaisons faites ».
- [x] **POL-PLAY-45** ✅ 29/10 17:37 (audit Sources et Paramètres play, démo sombre et vierge clair) Sources : les sources actives (météo, Health Connect…) suivaient « Mes appareils » sans titre et se lisaient comme des appareils → bloc « Ce que lit Halcya » ; Paramètres : rien à redire.
- [x] **POL-PLAY-46** ✅ 29/10 18:33 (audit Accueil et Journal play vierge sombre ; `JournalEmpty.test.jsx`) Journal vierge : phrase grise seule, et « Notez votre ventre depuis Aujourd'hui » même avec l'objectif énergie (pas de carte ventre) → « Rien de noté pour l'instant » + tuiles pastel (repas, ventre ou bien-être selon `gutCardMode`, source).
- [x] **POL-PLAY-47** ✅ 29/10 19:34 (`TodayCards.test.jsx` : chiffre seul en mono ; « (6 dernières semaines) » insécable ; Analyses play vierge clair et sombre relues) Accueil, carte « Vos pistes arrivent » : « 0/21 jours avec un repas ou une note du ventre (6 dernières semaines) » est une phrase en mono (DESIGN : mono pour les chiffres) → chiffre en mono, phrase en Figtree.
- [x] **POL-PLAY-48** ✅ 29/10 21:34 (audit Tendances play vierge, sombre et clair ; `PastelTiles` partagé avec le Journal vierge ; 3 tests) Tendances vierges : « Ajoutez une montre dans Sources… » et « Pas encore de bien-être noté. Activez… ou notez-le… » en phrases grises (« un peu triste », retour 6 du 24/10) → une phrase courte + tuiles pastel (montre en lilas ; visage et note manuelle en menthe).
- [x] **POL-PLAY-49** ✅ 29/10 22:33 (audit Repas et Nutrition play vierges, sombre et clair, 360 px ; `Nutrition.test.jsx`) Nutrition sans repas sur 7 jours : phrase grise centrée + bouton plein « Ajouter un repas » qui concurrençait « Compléter mon profil » → titre court + tuile pêche « Photographier un repas ». Repas vierge : les trois gestes sont juste au-dessus, « Aucun repas enregistré pour l'instant » suffit.
- [x] **POL-PLAY-50** ✅ 29/10 23:33 (audit Repas, Nutrition et Montre play démo sombre ; `EntryActionsToggle` partagé ; `Food.test.jsx`, `coverage.test.js`) Repas : « Refaire · Modifier · Supprimer » visibles sous chaque repas (POL-PLAY-27 ne couvrait que Jours) → derrière « ⋯ » ; Montre : stress « 46 / 99 » → « 46 · normal » comme le Journal (POL-PLAY-15). Nutrition démo : rien à redire.
- [x] **POL-PLAY-51** ✅ 30/10 00:33 (audit Réintroduction et Montre play `--empty`, clair et sombre ; `Reintroduction.test.jsx`) Préparation d'un test : « repère général, à adapter avec votre diététicienne » était une phrase en mono dans une étiquette → phrase Figtree `.fodmap-plan-note`. Choix des groupes et écran Montre vierge (« Aucune montre connectée… » + « Connecter une montre ») : rien à redire.
- [x] **POL-PLAY-52** ✅ 30/10 01:33 (audit Réintroduction en cours de test, `--play --fodmap=day2|question|result`, clair et sombre ; `Reintroduction.test.jsx`) « C'est supportable ? » : « Oui, je continue » sur deux lignes à côté de « Non, j'arrête » → boutons à largeur égale. Résultat : « L'attente joue aussi : vous pourrez refaire le test » (ambigu, et affiché même quand tout passe) → seulement si une gêne a arrêté le test, reformulé « S'attendre à une gêne peut suffire à en ressentir : vous pourrez refaire le test plus tard. » Jour 2 : rien à redire.
- [x] **POL-PLAY-53** ✅ 30/10 02:33 (audit Données et Paramètres play démo sombre, POL-PLAY-12 ; `hintStyle.test.js`) La classe `.hint` (≈ 20 phrases d'aide : Paramètres, Premium, Montre, Nouveautés, lecture au déverrouillage) n'avait aucun style commun : texte encre 1 rem, plus fort que les explications `.page-intro` voisines → style global gris secondaire 0,9 rem. Données : rien à redire (boutons de largeur inégale entre « Télécharger la sauvegarde » et la carte rapport PDF partagée avec Analyses : laissé).
- [x] **POL-PLAY-54** ✅ 30/10 03:33 (audit complet play `--empty` clair, 15 pages, POL-PLAY-12 ; `DoctorReportCard.test.jsx`) Données vierges : « Préparer le rapport » menait à un PDF de 2 pages vides (Analyses masque déjà la carte sans note du ventre) → sans aucune note du ventre ni aucun repas, phrase « Le rapport se remplit dès votre première note du ventre ou votre premier repas. » (comptage IndexedDB ; en cas d'échec, le bouton reste). Reste du parcours vierge (Accueil, Journal ×4, Analyses, Sources, Paramètres, Réglages, Premium, Bien-être, onboarding) : rien à redire.
- [x] **POL-PLAY-55** ✅ 30/10 04:33 (audit démo clair Analyses + Accueil `--gut-links`, POL-PLAY-12 ; `format.test.js`, `gutLinks.test.js`) Titre de piste illisible « Banane, chair sans peau, café, non instantané, yaourt nature ou le lactose → ventre » → `shortFoodName` ignore la partie mangée (chair, pulpe, pelée) et « instantané » ; dans une liste de plusieurs aliments, la précision passe entre parenthèses (« Fromage (emmental) »). PR #517 (POL-PLAY-54) mergée par ce run.
- [x] **POL-PLAY-56** ✅ 30/10 05:33 (audit démo sombre Analyses, Jours, Repas, Tendances, Nutrition, POL-PLAY-12 ; `nutritionLegend.test.js`) Nutrition : barres et légende « bas » (`--color-danger` #ff7b72) indiscernables de « limite dépassée » (`--color-alert` #ff8a65) en sombre, et un repère pas atteint en rouge = jugement (règle 6) → `--text-muted`. Reste relu sans défaut : Analyses (pistes ventre, bien-être, autres liens, PDF), Jours, Tendances. Petit point laissé : « Sport le soir · bien-être 2,7 / 5 contre 2,0 sans +0,7 point » (le « +0,7 point » passe à la ligne, lisible).
- [x] **POL-PLAY-57** ✅ 30/10 06:33 (audit démo sombre à 360 px de l'Accueil, de Sources et de Paramètres, POL-PLAY-12 ; `gutNotesProgress`, `GUT_PISTES_MIN_NOTE_DAYS` = `GUT_LINKS_MIN_DAYS` vérifié par test) Accueil, carte lilas (objectif ventre, 21 jours suivis, aucune piste) : titre « Assez de jours pour chercher des pistes » contredit par « … (28 jours de notes du ventre au moins). En attendant, voyez l'onglet Analyses » → « Vos pistes du ventre arrivent dans N jours », barre et « n/28 jours avec une note du ventre » ; une fois 28 jours : « Aucune piste pour l'instant : elles se précisent à chaque note du ventre. » Sources et Paramètres : rien à redire. Reste : onboarding play à 360 px en sombre.
- [x] **POL-PLAY-58** ✅ 30/10 07:33 (audit onboarding play à 360 px, sombre puis clair, POL-PLAY-12 ; `onboardingContinue.test.js`) « Continuer » désactivé (aucun objectif, aucune montre ou aucun choix Health Connect) gardait le fond émeraude à 60 % d'opacité : en sombre comme en clair il passait pour un bouton actif qui ne réagissait pas → fond `--surface`, texte `--text-muted`, bordure `--border`. Écrans relus sans autre défaut : objectif, suivis, montre, visage, premier geste ventre, « aha », paywall de lancement. Petit point laissé : le compteur passe de « /05 » à « /07 » quand on choisit une montre Health Connect (étapes ajoutées), la barre reste juste.

**Ajouté le 30/10 08:33 (run « idées », `IDEES.md` I195–I198)** — par impact :
- [x] **POL-PLAY-59 (I195) — 🔴 Une nuit comptée deux fois.** ✅ 30/10 09:33 (`services/sleepSources.js` `oneSleepSourcePerNight`, branché dans `nightlySleep` et `buildDailyJournal` ; `sleepSources.test.js`, 7 tests ; VFC et FC au repos vérifiées : moyennes, non concernées ; tuile : sources listées inchangées, un seul chiffre). Vérifié par un essai (hors dépôt) : `nightlySleep`
  (`services/radar.js`) additionne les phases de **toutes** les sources rattachées au même jour de réveil ; une nuit de
  7 h lue par la montre Huawei **et** par Health Connect (Samsung Health, Health Sync, Sleep as Android…) donne
  **840 min (14 h)**, sous le seuil d'invraisemblance (960) donc gardée. Même somme dans `dailyJournal.js:187`
  (`_sleep +=`), donc Accueil (tuile « Sommeil »), Journal, analyses (`sleepMinutes`), Radar, rapport PDF, `gutDays`.
  Correctif, comme les pas du 27/10 : **une seule source par nuit** (celle qui a des phases, puis la plus longue
  durée endormie ; la montre Huawei d'abord à égalité), choisie dans une fonction partagée par `nightlySleep` et
  `dailyJournal` ; tests : deux sources qui se chevauchent → 7 h, pas 14 h ; sieste toujours exclue ; une seule
  source → inchangé ; deux sources sur deux nuits différentes → deux nuits. Aucune donnée effacée (choix à la
  lecture). Vérifier aussi la VFC et la FC au repos de la nuit (moyennes, pas des sommes : a priori juste) et
  la tuile « Sommeil » (sources listées : garder les deux noms, mais un seul chiffre).
- [x] **POL-PLAY-60 (I198) — « Quand consulter » sans alarmer.** ✅ 30/10 10:33 (`WHEN_TO_SEE_DOCTOR` dans `services/today.js` ; détails de la carte ventre — la carte n'existe qu'avec « Mon ventre » ou des notes du ventre —, `Reintroduction.jsx` Disclaimer, `report.whenToConsult` en pied du PDF ; `TodayCards.test.jsx`, `buildReport.test.js`, `renderPdf.test.js`). Une ligne discrète, statique, sous le chevron de la
  carte « Votre ventre » (objectif « Mon ventre ») et dans le rapport PDF : « Sang dans les selles, perte de poids
  sans raison, fièvre, réveils la nuit à cause du ventre, ou symptômes nouveaux après 50 ans : parlez-en
  rapidement à votre médecin. » Jamais déclenchée par les données (pas de détection : ce serait une fonction
  médicale), jamais en rouge. Même phrase que `Reintroduction.jsx:71` (une seule source de texte). Test : présente
  avec « Mon ventre », absente sinon.
- [x] **POL-PLAY-61** ✅ 30/10 11:33 (petit point laissé par POL-PLAY-58 ; `displayedStepCount` dans `Onboarding.jsx`, test « le compteur ne grimpe jamais ») Onboarding : le compteur passait de « /05 » à « /07 » quand on choisissait une montre Health Connect (écrans ajoutés). Il compte maintenant d'avance ces écrans (montre pas encore choisie → Health Connect supposée, accès pas encore décidé → accordé supposé) et ne fait que baisser ; la barre suit. Le diagnostic local (`markScreenSeen`) garde le vrai nombre d'écrans.
- [x] **POL-PLAY-62 (I197) — Fiche Play : montres et délais d'abord.** ✅ 30/10 12:33 (`app/store/listing/fr-FR/full-description.txt`, test « I197 » dans `scripts/play/listing.test.mjs`) Ordre : montres → saisie (bilan du soir, FODMAP par groupe avec Ciqual) → pistes avec délais → réintroduction et rapport PDF → bien-être → tendances → « Sans abonnement, ou avec Premium » (sans prix) → local. 3 951 caractères (limite 4 000). Envoyée par le workflow « Play — fiche du Store » au merge. Description courte inchangée.
- [x] **POL-PLAY-63 — Une séance de sport comptée deux fois.** ✅ 30/10 13:36 (même famille que POL-PLAY-59 ; `services/workoutSources.js` `oneSourcePerWorkout`, branché dans `buildDailyJournal`, `buildDailyDataset`, `buildTodayRow` et `summarizeImport` ; `workoutSources.test.js`, 6 tests, + 1 dans `firstImport.test.js`) Une séance vue par la montre **et** par Health Connect (ou deux apps de Health Connect) doublait `activityCalories` (« Calories brûlées (activité) », levier « Bouger davantage »), la liste du Journal et « N séances de sport » du premier import. Même séance = sources différentes qui se chevauchent sur ≥ la moitié de la plus courte ; on garde la FC, puis la montre, puis la plus longue ; une même source n'est jamais dédoublonnée ; choix à la lecture, rien d'effacé. Restent sommés sans risque : rien d'autre trouvé (pas et calories par heure : `activityTotals`, nuits : `sleepSources`, FC / VFC / SpO₂ : moyennes, pesées : `mergeWeighIns`).
- [x] **POL-PLAY-64 — Audit sombre (démo, play) : deux petits défauts.** ✅ 30/10 14:33 : tuile du Journal « VFC » →
  « VFC nuit » (même valeur que la tuile « VFC nuit » de l'Accueil ; « VFC jour » reste à part) ; étiquette « premium »
  de la carte « Débloquer » de la réintroduction collée au titre → `fodmap-tag--lead` (10 px). Reste de l'audit sombre
  (Accueil, Journal, Tendances, Analyses, Sources, Premium, Historique du bien-être) : rien à redire.
- [x] **POL-PLAY-65 — Paramètres pendant la période de lancement : le quota IA parlait d'abonnement.** ✅ 30/10 15:33 :
  audit `--play --empty` (sombre, puis `--subscription=launch`) de Paramètres, Premium, Données et Sources ; seul défaut :
  sous le compteur d'analyses IA, « Sans abonnement : 10 offertes, puis 15 par mois. Avec le premium : jusqu'à 10 par
  jour » s'affichait aussi aux testeurs qui ont déjà le premium offert (P23 a : ne pas pousser à l'achat pendant la
  période) → « Pendant le test : jusqu'à 10 analyses par jour, sans rien payer. » ; premium payé : « Avec votre
  premium : jusqu'à 10 analyses par jour. » (`Settings.jsx`, 2 tests dans `Settings.play.test.jsx`).
- [x] **SIGNALEMENT 30/10 16:35 — plantage « activer la lecture du visage » (Galaxy A56).** ✅ 30/10 17:33 (PR #531).
  **Cause exacte** (trace prise par le smoke R8 de l'émulateur API 35, APK play release avec faceUnlockPlay) :
  `FATAL EXCEPTION: CapacitorPlugins … NullPointerException at com.getcapacitor.C.getPermissionStates ← getPermissionState
  ← FaceSensePlugin.start` — R8 ne gardait pas de quoi relire `@CapacitorPlugin(permissions = @Permission(...))`
  (`Bridge.getPermissionStates` lit l'annotation). Touchait « Activer » (lecture à l'ouverture) comme le déverrouillage,
  et potentiellement tout `getPermissionState` / `checkPermissions` / `requestPermissionForAlias` d'un plugin en
  release. Le smoke R8 ne l'attrapait pas : il n'appelait que `test`, qui ne vérifie aucune permission.
  **Correctif** : `proguard-rules.pro` — `-keepattributes RuntimeVisibleAnnotations,…,AnnotationDefault,…`,
  `-keep @interface com.getcapacitor.annotation.** { *; }` et `NativePlugin`. **Corrigé en chemin** : `startService` au
  lieu de `startForegroundService` pour `FaceSenseService` (un `stopSelf` sans `startForeground` fait tuer l'app),
  `startFaceUnlock` vérifie que le service tourne (message « Android n'a pas permis la lecture au déverrouillage… »),
  `LinkageError` / `OutOfMemoryError` rattrapées dans les lectures. **Garde-fous** : `faceServiceStart.android.test.js`
  (3), `faceSense.test.js` (1), `FaceSenseCard.test.jsx` (1) ; smoke R8 construit avec faceUnlockPlay : `checkPermissions`
  de chaque plugin, `FaceSense.start`, lecture au déverrouillage, caméra refusée (appops), tampon crash publié
  (`play_release_unlock.txt`) ; caméra frontale émulée sur l'AVD API 35. `FACE_UNLOCK_INTERNAL` reste allumé.
  Reste : retest du propriétaire (version de test interne suivante).
- [x] **POL-PLAY-66 — Health Connect : des jours perdus au premier import.** ✅ 30/10 16:33 (même famille que
  POL-PLAY-59/63, « chiffres fiables ») : le plugin trie puis garde les `limit` premiers échantillons ; FC (`limit:
  2000`) et pas en échantillons (`limit: 1000`) lus en une fois sur 30 jours → avec une FC toutes les 5 min (8 640
  échantillons), les ~23 derniers jours étaient coupés, et `lastSyncAt = maintenant` empêchait de les relire.
  `readSamplesInWindows` (HealthConnectConnector.js) : une lecture par jour, fenêtre coupée en deux tant qu'elle
  atteint la limite (jusqu'à 15 min), doublons aux bords retirés. Historique > 30 jours : FC brute des 30 derniers
  jours seulement (avant : les 2 000 plus anciens ; FC au repos et VFC à part, complètes). « Aha » (`summarizeImport`) :
  `oneSleepSourcePerNight` + intervalles endormis réunis (`sleepRegularity.unionOf`) — deux apps pour une nuit
  donnaient 14 h. Tests : 3 connecteur, 2 premier import. Restent à vérifier : les autres lectures à `limit: 500`
  (sommeil = sessions, FC au repos, SpO₂, VFC : quelques-unes par jour, sous la limite sur 30 jours ; à surveiller
  pour un historique long) — noté **POL-PLAY-67**.
- [x] **POL-PLAY-67** (30/10 18:33 ; `readInWindows`, `windowMs: Infinity` pour les types peu denses, séances comprises) Historique long (> 30 jours) : lectures à `limit: 500` (FC au repos, VFC, SpO₂, sommeil, calories)
  coupées après ~500 jours ou plus tôt pour une source dense (SpO₂ la nuit) → même `readSamplesInWindows` (par
  semaine pour ces types) ; à mesurer sur l'émulateur avant de changer.
- [x] **POL-PLAY-68** (30/10 19:33 ; `MealItemList`, partagé Journal / Repas) Audit `--play --size=360x780` (démo, 15 pages,
  aucun débordement signalé) puis `--play --empty` (Repas, Nutrition, Tendances, Réglages, Nouveautés) : les aliments
  d'un repas « à la suite » (D1) laissaient un « · » seul en bout de ligne dès qu'un nom Ciqual était long (« Poulet,
  cuisse : 150 g · » / « Pomme de terre : 200 g · ») → un aliment par ligne, quantité à droite en mono (comme une
  étiquette nutritionnelle) ; séance du Journal « Course à pied · 32 min · 330 kcal » au lieu de tirets cadratins ;
  note « sommeil une source » marquée Android (`variants`, IOS-3). Restes vus, non traités : « Oeuf brouillé » (nom
  Ciqual sans ligature « Œ ») ; tuile « Ajouter une montre » de Tendances en lilas (choix établi : lilas = sources
  dans les tuiles pastel, à revoir seulement si le propriétaire le signale).
- [x] **POL-PLAY-69** (30/10 21:33 ; `frenchLigatures`, affichage seulement) « Oeuf brouillé », « Boeuf », « Coeur » (noms
  Ciqual) → « Œuf », « Bœuf », « Cœur » dans les listes d'aliments, Repas habituels, l'éditeur de repas et les pistes du
  ventre ; nom enregistré inchangé.
- [x] **POL-PLAY-70** (30/10 22:33 ; `pendingText`, Recommendations.jsx) Audit Analyses (démo, clair, 360 px, avec et sans
  premium) : « En cours de collecte : Malade (2/5 jours avec) » → « Bientôt comparés : Malade (encore 3 jours notés) »
  (« jours sans » si ce sont eux qui manquent, « avec » pour un repère mesuré). Prochain audit : réintroduction en clair.
- [x] **POL-PLAY-71** (30/10 23:33 ; `calmDaysLeftText` dans `fodmapChallenge.js`, utilisé par `Reintroduction.jsx` et
  `challengeSummary`) Audit réintroduction (`--play --light --size=360x780 --subscription=launch --fodmap`, choix, Blé,
  `=day2`, `=question`, `=result`) : « 1/3 jours calmes » → « encore 2 jours calmes » (attente avant de commencer, pause
  de fin, carte d'Analyses) ; « Oui, je continue » passait sur deux lignes à 360 px → « Oui, continuer » / « Non,
  arrêter » ; « Une estimation de votre ventre, pas un diagnostic » → « Une estimation, pas un diagnostic ». Vu, laissé
  tel quel : choix des groupes, préparation (portions, conseils), jour 2. Prochain audit : Journal → modifier un repas
  (démo, clair, 360 px).
- [x] **POL-PLAY-72** (31/10 00:33 ; `theme/safeAreaRestore.js` + `SystemBarsPlugin.getInsets`) Émulateur API 34 rouge sur
  main `d0926bf` (même code vert sur la PR) : « encarts au repos : haut 0 px, bas 0 px » alors que le natif avait
  injecté 128 px (log `HalcyaInsets`) → une page rechargée juste après l'injection perdait `--safe-area-inset-*`
  (contenu sous la barre d'état, Android ≤ 14, rare). Le natif garde les derniers encarts (dp) et la page les relit au
  démarrage (`restoreSafeArea`, appelé avec `setStyle`) ; Android 15+ : `known: false`, rien ne change. Prochain
  audit : Journal → modifier un repas (démo, clair, 360 px).
- [x] **POL-PLAY-73** (31/10 01:33 ; `MealEditor` : kcal sur la ligne du nom) Audit Journal → modifier un repas (démo,
  clair, 360 px) : la rangée « − g + kcal ✕ » débordait de la carte (✕ hors de la carte) → kcal à droite du nom, en
  mono ; « Enregistrer les modifications » sur trois lignes → « Enregistrer ». Vu, laissé : format de l'heure (locale
  du navigateur de capture), apostrophes droites des noms Ciqual. Prochain audit : Repas → repas habituels et
  « Décrire » (démo, clair, 360 px).
- [x] **POL-PLAY-74** (31/10 02:33 ; `.btn:disabled` dans `App.css`, `quickMeals.mealLabel`) Audit Repas et « Décrire »
  (démo, clair puis sombre, 360 px) : boutons `.btn` désactivés (« Remplir avec l’IA », « Enregistrer ce repas »)
  émeraude à 60 % → fond neutre, texte secondaire, bordure (comme POL-PLAY-58, pour toute l’app) ; repas habituels
  « Poulet, Pomme de terre » → « Poulet, pomme de terre » (sigles gardés). Prochain audit : Nutrition → « compléter
  mon profil » et Tendances (démo, clair, 360 px).
- [x] **POL-PLAY-75** (31/10 03:33 ; statut `uncertain` dans `nutritionIntakeCompare.js`, légende filtrée dans
  `Nutrition.jsx`) Audit Nutrition et Tendances (démo, clair puis sombre, 360 px) : avec des repas manquants (≈ 627 kcal/j),
  presque toutes les barres étaient « bas » en gris foncé (trompeur : l'apport réel est plus élevé, et triste) → vert
  pâle « incertain : repas manquants » (`--chart-bar-2`) ; « atteint » et « limite dépassée » restent ; la légende ne
  montre que les statuts présents. Vu, laissé tel quel : Tendances (VFC : l'étiquette passe sous le titre long ;
  graphique du bien-être en émeraude plutôt qu'en menthe) ; « À compléter : taille, sexe, âge » dans le profil.
  Prochain audit : Nutrition → « Modifier » le profil (formulaire) et Tendances en `--empty`.
- [x] **POL-PLAY-76** (31/10 04:33 ; `input, textarea, select { font-family: inherit }` dans `index.css`) Audit Nutrition →
  « Modifier » le profil (démo, clair, 360 px) et Tendances / Nutrition en `--empty` : les champs (année de naissance,
  taille, poids, mais aussi la description d'un repas, les réglages, la recherche d'aliments) gardaient la police
  système du navigateur au lieu de Figtree → règle globale. Vu, rien à redire : Tendances vierge (« Ajouter une
  montre », « Activer la lecture du visage », « Noter votre bien-être »), Nutrition vierge (profil puis « Aucun repas
  ces 7 derniers jours » + « Photographier un repas »), formulaire du profil. Prochain audit : Repas → recherche d'un
  aliment et Jours en sombre.
- [x] **POL-PLAY-77** (31/10 05:33 ; `.github/scripts/edge-insets/check.mjs`) Émulateur API 34 rouge sur main (#546,
  journal seul) : « encarts au repos : haut 0 px », alors que la capture montre l'onboarding bien sous la barre d'état,
  les logs natifs `top=128` et un dialogue « Pixel Launcher isn't responding » (émulateur surchargé). 3 échecs sur 25
  exécutions, dont un avant le correctif POL-PLAY-72. Contrôle durci : page `https://localhost` choisie parmi les cibles
  DevTools, dialogues système fermés, encarts relus jusqu'à 5 fois (≈ 15 s) avant de conclure, numéro de lecture et
  page lue dans le résumé. Une vraie régression (0 px persistant) reste rouge. Si l'échec revient malgré tout : lire
  « page lue » et la lecture n/5 dans le résumé avant de toucher au code de l'app.
- [x] **POL-PLAY-78** (31/10 06:33 ; `mealEditing.searchIngredients`, `index.css`) Audit Repas → recherche d'un aliment :
  « ail » proposait « Haché de volaille » (milieu de mot), « lait » la laitue avant les laits, « vin » le vinaigre
  avant les vins, et les alias Ciqual (même code) apparaissaient deux fois. Recherche en début de mot (milieu de mot en
  secours), mots entiers d'abord, un aliment Ciqual une seule fois ; croix « effacer » aux couleurs de l'app ; option
  `--search` de la capture. Journal → Jours en sombre : rien à redire. Prochain audit : repas habituels en sombre,
  Données en `--empty`.
- [x] **POL-PLAY-79** (31/10 07:33 ; `Data.jsx`, `DoctorReportCard.jsx`, `Food.css`) Audit Données en `--empty` et
  sombre, Repas (repas habituels) en sombre. Défauts : l'export ne disait pas ce qu'il contenait et proposait un fichier
  vide sur une installation neuve ; le rapport PDF poussait « Débloquer » (paywall) pour un rapport encore vide ; écart
  de 40 px au-dessus de la carte PDF contre 24 ailleurs, boutons de largeurs différentes. Corrigé : ligne mono
  « N entrées et votre profil » (recomptée après import, suppression ou nouvelle entrée ; comptage en échec = export
  laissé possible), export grisé avec « Rien à sauvegarder pour l’instant » à 0 entrée, pas de « Débloquer » sans
  contenu, boutons pleine largeur, écarts réguliers. Vu, rien à redire : repas habituels et derniers repas en sombre
  (quantités en IBM Plex Mono vérifiées), Repas vierge. Noté : `--empty` démarre avec 2 entrées automatiques (non
  gênant). Prochain audit : Paramètres en `--empty` et sombre, Nouveautés.
- [x] **POL-PLAY-80** (31/10 09:33 ; `Settings.jsx` `RelayAiBlock`, `App.jsx`) Audit Paramètres (`--play --empty` clair,
  `--play --dark`, 360 px) et Nouveautés (sombre). Défauts : « Ce qui est envoyé » de l'analyse IA en un paragraphe
  de 10 lignes (mur de texte, principe « simple d'abord » du 24/10) ; une adresse inconnue (lien périmé, ancienne
  notification) affichait une page blanche sans barre d'onglets. Corrigé : une phrase « Seule la photo ou la
  description du repas part, sans métadonnées ; rien d'autre de votre santé. », le détail dans un dépliant fermé
  « Ce qui est envoyé, en détail » (texte inchangé sauf « Halcya n'envoie aucune autre donnée de santé » au lieu de
  « ne quitte l'appareil », que le test POL-PLAY-25 interdit) ; route `*` → Accueil. Vu, rien à redire : Apparence,
  Ce qui vous amène, Abonnement, Votre avis, Nouveautés (longue mais claire). Prochain audit : Premium (paywall) en
  `--empty` et sombre, puis Montre.
- [x] **POL-PLAY-81** (31/10 10:33 ; `WatchData.jsx`, `WatchData.css`) Audit Premium (paywall `--play --empty` clair et
  `--play --dark`) et Montre (`--play` clair et sombre, données de démo). Paywall : rien de bloquant (structure, textes,
  prix du faux Play Billing, frise de l'essai, « Plus tard » conformes à la maquette). Montre : 9 cartes sur 13
  répétaient « Rien reçu depuis 30 jours. », la page faisait deux écrans et demi et les types reçus se perdaient entre
  elles. Corrigé : un type sans mesure ni issue de lecture tient sur une ligne (libellé + étiquette « rien »), la
  légende « « rien » : aucune mesure reçue depuis 30 jours » est dite une fois en bas ; un type qui porte l'issue d'une
  lecture (« dernière lecture : vide / sans réponse ») garde sa carte complète. Ordre des types inchangé (sommeil et
  VFC d'abord). Prochain audit : Sources (variante play) en `--empty` et sombre, puis Réintroduction en sombre.
- [x] **POL-PLAY-82** (31/10 11:33 ; `TabBar.jsx`) Audit Sources (`--play --empty` clair, `--play --dark` démo) et
  Réintroduction (`--play --dark`, `--fodmap` et `--fodmap=day2`). Sources : conforme à VC-25 / POL-PLAY-45 (sources
  à brancher en vue au premier lancement, « Ce que lit Halcya » puis « Ajouter une source » ensuite), rien à redire.
  Réintroduction en sombre : contrastes corrects ; mais aucun onglet du bas n'était surligné sur `/reintroduction`,
  ni sur `/montre` et `/bien-etre` (on ne savait plus où l'on était). Corrigé : Réintroduction sous Analyses, Montre
  sous Sources, Historique du bien-être sous Aujourd'hui ; Premium et réglages restent sans onglet. Prochain audit :
  Historique du bien-être (`/bien-etre`) en vierge et sombre, puis Nutrition en sombre.
- [x] **POL-PLAY-83** (31/10 12:33 ; `Onboarding.jsx`, `permissionDisclosures.js`, `play-bundle.yml`) Demande du
  propriétaire du 31/10 : lecture au déverrouillage dans toutes les versions play (`FACE_UNLOCK_PLAY`, test interne et
  alpha) et mise en avant dans l'onboarding (bénéfice en image sans chiffre de précision, divulgation complète
  `camera_onboarding_unlock`, « Activer » principal, « Plus tard » visible qui passe à la suite, rien de précoché).
- [x] **POL-PLAY-84** (31/10 13:33 ; `onboarding.js`, `MoodEstimateCard.jsx`, `Dashboard.jsx`) Rappel discret, une
  seule fois, dans la carte Bien-être de l'Accueil pour qui a répondu « Plus tard » à la lecture au déverrouillage
  dans l'onboarding (variante play avec l'interrupteur) : 2 jours après, tant qu'elle est coupée ; jamais après un
  « Pas maintenant » dans la divulgation ; « Voir dans Sources » ou la croix le ferment pour de bon.
- [x] **POL-PLAY-85** (31/10 14:33 ; `WellbeingHistory.jsx`) Audit Historique du bien-être (vierge clair, démo
  sombre et clair, Jour / Semaine / Mois) : légende « moyenne » (pointillés) et « fourchette » (vue Jour), « 1 jour »
  retiré en vue Jour, expressions « sur 13 des 33 lectures ». Prochain audit : Nutrition en sombre, puis Tendances
  en vierge.
- [x] **POL-PLAY-86** (31/10 15:33 ; `Nutrition.css`) Audit Nutrition en sombre et clair (démo) : les barres
  « incertain : repas manquants » (pastel `--chart-bar-2`) se voyaient à peine sur leur piste (contraste 2,0:1 en
  sombre, 1,3:1 en clair). Hachures `--chart-ref` / `--chart-bar-2` (signe d'une estimation), légende comprise ;
  reste lisible, sans couleur d'alerte. Profil, avertissement « repas manquent », étiquette « partiel » et notes :
  rien à redire. Prochain audit : Journal → Tendances en vierge (clair et sombre).
- [x] **POL-PLAY-87** (31/10 16:33 ; `PastelTiles.jsx`, `WellbeingCharts.jsx`, `JournalEmpty.jsx`) Audit Tendances en
  vierge (clair et sombre) : propre, « 3 semaines » juste (7 + 14 j). La tuile « Noter votre bien-être » (Tendances,
  Journal vierge) renvoyait à l'Accueil sans ouvrir la note : elle l'ouvre sur place. Prochain audit : Analyses en
  vierge sombre, puis Journal → Repas en vierge.
- [x] **POL-PLAY-88** (31/10 17:33 ; `MealsEmpty.jsx`, `Food.jsx`) Audit Analyses en vierge sombre : propre (carte lilas
  « 0/21 », « Tester un groupe FODMAP » premium), rien à corriger. Journal → Repas vierge : une phrase grise seule sous
  « Derniers repas enregistrés » ; remplacée par une carte pêche en trois étapes numérotées (photo ou mots → heure et
  aliments notés → comparés à votre ventre, ou à vos jours si la carte ventre est masquée). Prochain audit : Journal →
  Jours avec données de démo en sombre, puis Sources en vierge sombre.
- [x] **POL-PLAY-89** (31/10 18:33 ; `connectorsLayout.js` `sourceTone`, `Connectors.jsx`, `Connectors.css`) Audit
  Journal → Jours (démo, sombre) : coloré et lisible, rien à corriger. Sources en vierge sombre : quatre cartes grises
  identiques (« un peu triste », retour 8 du 24/10). Chaque carte prend le pastel de son thème, comme les tuiles de
  « Vos derniers jours » : menthe (visage, Health Connect, Withings), lilas (météo, temps d'écran), filet à gauche ;
  montre, capteurs et guides restent neutres. Prochain audit : Accueil en vierge sombre, puis Paramètres en démo clair.
- [x] **POL-PLAY-90** (31/10 19:33 ; `TodayCards.css`, `gutCardHierarchy.test.js`) Audit Accueil en vierge sombre et
  clair, et démo clair : le soir, la carte « Votre ventre » empilait deux titres de même couleur et presque même poids
  (« Votre ventre » puis « Et votre ventre aujourd'hui, dans l'ensemble ? »). La question prend le texte pêche, poids
  600 : un seul titre. Boutons Calme / Gêne / Douleur un peu moins serrés (marge intérieure, petits écrans). Paramètres
  en démo clair relus : rien à corriger. Prochain audit : Premium et paywall de l'onboarding en vierge sombre, puis
  Historique du bien-être en démo sombre vue Mois.
- [x] **POL-PLAY-91 (I202) — « Quand consulter » : antécédents familiaux.** Ajouter à `WHEN_TO_SEE_DOCTOR` un proche (parent, frère, sœur) avec un cancer du côlon ou une MICI ; texte statique, mêmes trois endroits ; tests `TodayCards`, `buildReport`, `renderPdf` adaptés. Sources : FMC-HGE POST'U 2022 (ACG 2020), VIDAL Recos 2022. **Livré 31/10 21:33** (`today.js`, test `TodayCards.test.jsx`).
- [x] **POL-PLAY-92 (I203) — Réintroduction : après l'éviction.** Une ligne statique en tête de `Reintroduction.jsx` : « À faire après 2 à 6 semaines de repas pauvres en FODMAP, si votre ventre va mieux. » Ne bloque rien, ne compte rien ; 1 test. **Livré 31/10 21:33** (`.fodmap-when`, pêche, dans `ChooseGroup`).
- [x] **POL-PLAY-93 (I207)** (01/11 22:33 : chiffre seul en mono, phrase en Figtree, une ligne) — — Paywall : phrase des tuiles Silver / Gold en mono.** `.paywall-tier-note` met « 10 analyses IA par jour » en IBM Plex Mono (deux lignes à 412 px) : chiffre en mono, reste en Figtree. Capture `--play --routes=/premium`, clair et sombre. Trouvé le 01/11 20:33.
- [x] **POL-PLAY-94** (02/11 01:33, audit `--play --dark` sur données de démo) Les milliers mis en forme par `toLocaleString('fr')` utilisent l'espace fine U+202F, presque invisible en Figtree (« 2 repas · ≈ 1039 kcal » sur la page Repas, « 7042 pas/jour » dans Nutrition) : `fixFrenchSpacing` la remplace par une insécable ordinaire entre chiffres (toute l'app d'un coup, mono inchangé). Test `frenchSpacing.test.js`.
- [x] **POL-PLAY-95** (02/11 02:33, audit `--play --dark` démo de Paramètres, Données, Réintroduction) Paramètres › Analyse des repas : « Pendant le test : jusqu’à 10 analyses par jour » et « Avec votre premium : jusqu’à 10 » alors que la période de lancement et Gold donnent 20 par jour au relais (`credits.js`, `billing.js:162`) → plafond tiré de `tierName` et de `PREMIUM_AI_DAILY` / `GOLD_AI_DAILY` ; version gratuite : « Silver : 10 par jour, Gold : 20. » Tests `Settings.play.test.jsx`. Données et Réintroduction (verrou premium) : rien à redire.
- [x] **POL-PLAY-96** (02/11 03:33, audit `--play --empty --dark` de l’Accueil, du Journal, des Analyses, de Sources, de Paramètres et de tout l’onboarding, POL-PLAY-12) Paywall (page Premium et fin d’onboarding), formule mensuelle sans essai : le prix apparaissait trois fois d’affilée (formule, bouton « S’abonner · 9,99 € / mois », puis « 9,99 € par mois. Annulable… ») → la mention garde seulement « Annulable à tout moment dans Google Play. » ; avec essai, « Puis 29,99 € par an. » reste (seul endroit qui donne le prix après l’essai). Test `Premium.test.jsx`. Reste du parcours vierge en sombre : rien à redire (le compteur « 01/08 » puis « 04/06 » est voulu, POL-PLAY-61 ; « 3 lectures aujourd’hui » contre « aucune lecture aujourd’hui » sur Sources vient du faux plugin lancé à 3 h du matin, pas de l’app).
- [x] **POL-PLAY-97** ✅ 02/11 04:33 (audit démo clair Jours, Repas, Nutrition, Tendances, POL-PLAY-12 ; `nutritionIntakeCompare.test.js`, `nutritionLegend.test.js`) Nutrition : le sodium sous son maximum avait la couleur et la légende « atteint » → état `under` « sous la limite » (teinte `--chart-ref` pleine) ; jours incomplets → « incertain ».
- [x] **POL-PLAY-98** (02/11 05:33, audit `--play` en clair sur données de démo : Jours, Repas, Tendances, Analyses, Bien-être, Sources ; POL-PLAY-12) Analyses : « Bientôt comparés : Malade (encore 3 jours notés) » flottait seul en petit gris sous les liens, juste au-dessus de la section « Bientôt » → chaque habitude en attente a sa ligne dans « Bientôt » (« Malade · encore 3 jours notés » ; semaine/week-end : « pas encore comparable (semaine et week-end) »), sans compteur « Vos habitudes » en double ; aussi avec peu de données (habitudes du visage). Tests `Recommendations.test.jsx` réécrits avant le code. Reste de l’audit en clair conforme (échelle 0–5 du bien-être noté voulue ; totaux du jour des repas justes).
- [x] **POL-PLAY-99** (02/11 07:33, audit `--play` en clair du parcours repas : analyse photo FODMAP, éditeur, historique ; POL-PLAY-12) « Hier 1 novembre » dans Repas et Jours → « 1er novembre » : `localeDate()` (`i18n/locale.js`) remplace `toLocaleDateString` pour toutes les dates à jour numérique (en-têtes des jours, Accueil « dim. 1er nov. », bien-être, montre, Données, Nouveautés, rappel d'essai, crédits IA, fin de la période de lancement ; les deux correctifs locaux d'`aiRelay` et `entitlement` remplacés). Axes des graphiques laissés courts. 5 tests `localeDate.test.js`. Reste de l'audit repas conforme ; petit point laissé : l'éditeur garde les noms Ciqual complets (« Lentille verte, bouillie/cuite à l'eau »), voulu pour choisir le bon aliment.
- [x] **POL-PLAY-100** (02/11 14:48, audit `--play` en clair et sombre de Montre, Nouveautés, Historique du bien-être, Données, Réintroduction, Plus ; POL-PLAY-12) Le nom technique « HSEmotion » restait visible en play (pied de l'Historique du bien-être, ligne « modèle » des détails de la carte Bien-être, explications de la carte Lecture du visage), contre la règle « aucun nom de modèle visible dans la variante play » (31/10) → `services/mood/modelName.js` (`faceModelTag(features)`, branché sur `FEATURES.aiModelName`) : « (HSEmotion) » en sideload seulement ; `modelLabel()` dans `today.js`. Le mode diagnostic caché garde le nom (support). 4 tests (`modelName.test.js`, `WellbeingHistory.test.jsx`). Reste de l'audit conforme.
- [x] **POL-PLAY-101** ✅ 02/11 18:40 (Figtree n’a ni U+1D49 ni U+02B3, vérifié avec fontTools sur les fichiers @fontsource : « 21ᵉ » s’affichait en police de secours → composant `Ordinal` en `<sup>` (`.ordinal sup` dans index.css) pour « 21e » (Premium, onboarding) et « 1er paiement » ; `ordinalGlyphs.test.js` échoue si « ᵉ » ou « ʳ » revient dans `src/` ; `Ordinal.test.jsx`. Les dates « 1er novembre » de `locale.js` restent en texte simple : ce sont des chaînes, utilisées hors JSX) (idée du 02/11 15:56, faible) Typographie des ordinaux : « 21ᵉ » est en exposant (Premium, onboarding) mais « 1er » ne l’est pas (« renouvellement le 1er décembre », « jour 14 : 1er paiement »). Vérifier que Figtree a les glyphes ᵉ/ʳ (U+1D49, U+02B3) avant d’uniformiser en « 1ᵉʳ », sinon passer par `<sup>` dans `locale.js` et la frise.
- [x] **LICENCES-TIERCES** ✅ 02/11 17:08 (`services/thirdPartyLicenses.js`, page `/licences`, ligne « Licences » dans Réglages ; `thirdPartyLicenses.test.js` échoue si une dépendance npm de production ou une bibliothèque Android de `build.gradle` manque ou change de licence ; `Licences.test.jsx`) Bibliothèques (MIT, MPL-2.0 pour Capacitor Health avec lien du code source, Apache-2.0, OFL-1.1, conditions du SDK Android pour Play Billing et Integrity, version Play seulement), lecture du visage (Google, A. Savchenko ; noms des modèles en sideload seulement), Ciqual 2025 (CC BY 4.0 : c’est la licence de la version utilisée, pas Etalab) et les 7 sources FODMAP publiées, lues dans `fodmapMeasurements.json`. Conditions (§ 9) inchangées.
- [x] **LICENCES-IOS** ✅ 02/11 18:10 (`licenseSections(features, store = STORE)`, `Licences` prend `store` ; 3 tests) L’app iPhone (`VITE_STORE=appstore`) ne liste plus AndroidX, LiteRT, ONNX Runtime ni Play Billing / Integrity ; ses bibliothèques natives propres vont dans `IOS_LICENSES` (vide : à remplir par la routine iOS, dont le dépôt n’est pas lisible ici). Android inchangé (capture `--play`).
- [x] **CI-JUNIT** (31/10 01:33) « Protocole montre (Java) » rouge sur main après #539 : 404 passager de Maven Central sur
  le jar JUnit ; `java-protocol-test.sh` réessaie (`--retry 4 --retry-all-errors`) et s'arrête net sinon.

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
3. **Humeur et bien-être estimés passivement** (priorité n° 3) — par signaux émotionnels **directs** (visage, voix,
   réseaux sociaux, auto-déclaration ; directives du 12/10 : sommeil / activité / écran sont des X, jamais des entrées) ;
   sur l'appareil ; toujours « estimation », jamais diagnostic.
4. **Comprendre ce qui marche *pour moi*** — moteur N-of-1 honnête (déjà riche : C3), expériences personnelles.
5. **Coach et assistant** — résumés, prévisions, alertes précoces, actions concrètes.
6. **Confiance** — zéro régression, données jamais perdues, transparence sur les méthodes.

Idées détaillées, sources et notation impact × faisabilité : **`IDEES.md`** (numéros I1…).

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
- [ ] **POLISH-SIM-57** (Ventre et données J45) Rapport PDF : la case « bien-être estimé (caméra) » est proposée sans
  aucune lecture du visage ; la cacher dans ce cas. Données › Exporter : « rangé dans Documents » et « Enregistrez le
  fichier… (ex. Dossier Documents) » se contredisent ; une seule phrase.
- [ ] **POLISH-SIM-58** (Sportif J14, Galaxy Watch) Séances : Sources annonce des « séances » reçues, la persona ne les
  trouve ni dans Journal › Jours ni dans Tendances. Vérifier dans l'outil (environ 1 jour sur 3 avec séance) et dans
  l'app où elles s'affichent ; si elles ne sont que dans une liste de saisies, une tuile « Séance » dans la carte du
  jour.
- [x] **POLISH-SIM-59** ✅ 12/11 12:35 (cause : capture prise avant le chargement de la table Ciqual ; tuile « ≈ … kcal » pendant le chargement, outil des personas qui attend la table) (Sportif J14) Journal › Jours : tuile « Repas 1 » sans kcal alors que Repas affiche ≈ 479 kcal
  pour ce repas, et qu'un autre jour dit ≈ 1 039 kcal. Vérifier la règle de la tuile (kcal dès qu'un repas est compté).
- [x] **POLISH-SIM-60** ✅ 12/11 10:35 (`notShared` au catalogue ; « Samsung Health ne partage pas la variabilité cardiaque avec Health Connect. ») (Sportif J14) Sources, carte Samsung Health : « Si votre montre en est capable, activez ce
  partage » pour la VFC, alors que Samsung Health ne l'écrit pas dans Health Connect. Dire ce qui est vrai pour l'app
  source connue (Samsung : « Samsung Health ne partage pas la VFC »). `MyDevices.jsx`.
- [ ] **POLISH-SIM-61** (Sportif J14) Tendances : la zone « attendu » (pointillé) n'est pas comprise (« d'où vient
  cette baisse prévue ? ») ; en Semaine, sommeil seul, des jours futurs vides. Une ligne de légende courte ; pas de
  jours futurs sans attendu.
- [ ] **POLISH-SIM-62** (Sportif J14) Analyses au 14e jour noté : « Aucun lien assez net » et « Moyen terme : encore 7
  jours notés », sans retour après « Enregistrer » la note de bien-être. Confirmer la note (« Noté : 4/5 ») ; dire en
  une ligne ce qui a été comparé.
- [ ] **POLISH-SIM-63** (Outil, Sportif J14) La persona voit « Cigarettes 3 » sans avoir activé le compteur
  (POLISH-SIM-42 : opt-in) : `personaData` garde les cigarettes de la démo. Les retirer sauf objectif tabac.
- [ ] **POLISH-SIM-64** (Outil) `persona-browse.mjs --dark` ne règle que le `colorScheme` du navigateur : l'app reste en
  clair. Régler aussi le thème de l'app (comme `visual-check --dark`).
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
  - [ ] **GOLD-a3-2** dès « P37 oui » : `GOLD_INSTALLS=5e4a69f72ffb` dans `relay-deploy.yml` (test 123 couvre déjà le
    mécanisme), vérifier au bilan. Sans réponse le 20/11 : le redemander en tête du résumé (ne pas l'ajouter sans
    confirmation : une erreur donnerait Gold à un testeur).
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
  VITALS-1 (attend P43).
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
- [ ] **FIN-LANCEMENT-MSG** (vers le 24/11) : message du jour ~21 dans `INVITATION-TESTEURS.md` §4 (fin de Gold
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

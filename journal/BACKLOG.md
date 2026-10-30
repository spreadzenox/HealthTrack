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
  d'invitation (`INVITATION-TESTEURS.md`, mis à jour le 25/10 : ouvrir l'app tous les 2-3 jours, rappel du jour 7).
  Pendant les 14 jours : au moins 2 versions en alpha, et une liste « changements faits pendant le test » dans
  `PRODUIT.md` pour le formulaire d’accès à la production (P30, à préparer au jour 10).
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
  (variable à part, après M5, si les données arrivent) ; [ ] P2P dans le lecteur Java en arrière-plan (M6) ; [~] **M3** température de la peau — **livré le 22/10 12:30** (classe 400012 après la VFC, capacité 29, `body_temperature` `subtype: 'skin'`, « Temp. peau » dans Journal → Jours, réglage « mesure continue » 7/0x2A choisi par l'utilisateur, envoyé une fois) ; [ ] M3 à confirmer sur la GT 6 Pro ; [x] **M4** stress — **livré le 24/10 12:30** (fichier `rrisqi_data.bin`, entrée `watch_stress`, X seulement ; SpO₂ et respiration de la nuit déjà livrés par M1) ; [ ] M4 à confirmer sur la GT 6 Pro ; [ ] **M4 bis** étages (compteur des bits inconnus des minutes, §10.6) ; [x] **M5** écran « Données de la montre » — **livré le 22/10 14:30** (`coverage.js` + page `/montre` : dernière valeur, date, n sur 7 j, issue de la dernière lecture gardée dans l'état de synchro `reads`) ; [ ] issue des lectures des captures en arrière-plan (aujourd'hui : synchro faite par l'app seulement) ; **ordre décidé le 22/10 13:30 : jalon 6 d'abord, puis M4, M6, M7** ; [~] **M6** rattrapage de
  l'historique + resynchro arrière-plan avec les nouvelles lectures (A.3) — **M6a livré le 24/10 13:30** (fichiers 0x2C sommeil détaillé + stress dans le lecteur Java, reprise par fichier recopiée du JS ; §10.15) ; [x] **M6b — FAIT le 25/10 04:33 CET** P2P (VFC jour, température) dans le lecteur Java (`WatchP2P`, capture `dict`, reprise par classe recopiée du JS) ; [ ] M6b à confirmer sur la GT 6 Pro ; [ ] M6a à confirmer sur la GT 6 Pro ; [ ] **M7** séances : FC et allure
  (0x17/0x0A, 0x0C) ; [x] A.1, A.2 (livrés le 18/10) ; [x] tuiles Accueil sommeil / VFC nuit « Montre Huawei » + export vérifiés (25/10 14:33 : tuile « VFC nuit », source courte, test d'intégration `watchHome.integration.test.js`).
- [~] **3c (dès P11)** envoi automatique de l'AAB en test interne par l'API Android Publisher (seule exception à M) —
  **branché le 21/10 22:30** (`app/scripts/play/publish.mjs`, étape « Envoyer en test interne » de « Play — AAB », symboles
  natifs `debugSymbolLevel`) ; [x] premier envoi réel vérifié (22/10 00:30 : versionCode **346** déployé en test interne dès le 21/10 22:51, accès gh-deployer effectif tout de suite) ;
  [x] page de confidentialité (22/10 02:30 : `app/public/privacypolicy.html` réécrite pour la variante play, source unique embarquée + **GitHub Pages** `.github/workflows/pages.yml` → https://spreadzenox.github.io/HealthTrack/confidentialite/ , lien Réglages → Confidentialité, `privacyPolicy.test.js` ; attend P19) ;
  [x] fiche du Store FR par l'API (22/10 04:30 : `app/store/listing/fr-FR/` textes + 5 captures 1080×1920 de la variante play (données de démo) + image de présentation 1024×500, `scripts/store/build-store-assets.mjs`, envoi `scripts/play/listing.mjs` par le workflow « Play — fiche du Store », images réenvoyées seulement si leur SHA-256 change, site web dans details) ;
  [ ] refaire les captures quand l'onboarding et les vraies pistes SII existeront (ajouter « Sources » sans marque tierce visible) ; [x] Sécurité des données (22/10 06:30 : réponses justifiées `app/store/data-safety/answers.mjs` → CSV complet `data-safety.csv` rempli sur le modèle de la Play Console, règles du formulaire vérifiées, envoi `applications.dataSafety` par le workflow manuel « Play — sécurité des données » (P21) ; repli : import manuel du CSV ; réponses exactes dans PLAY-CONFORMITE.md §Sécurité des données) ; [ ] test fermé (piste `alpha`, testeurs `halcya-testeurs@googlegroups.com`, edits.testers ; attend P18).
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
- [ ] **Paywall avant la version candidate** : rappel local 2 jours avant la fin de l'essai (puis remettre « jour 12 : on vous prévient » dans la frise) ; CGU/CGV publiées sur GitHub Pages + lien « Conditions » ; liste des bénéfices alignée sur ce que le premium débloque réellement (pistes, FODMAP, PDF pas encore livrés) ; phrase contextuelle « Vous avez N jours de données » (jalon 4).
- [x] **6b-2a** (23/10 06:30) relais : `src/integrity.js` (décodage `decodeIntegrityToken` sous relay-runtime, verdict : paquet, `requestHash` = sha256(`halcya-integrity:<installation>`), jeton < 10 min, `PLAY_RECOGNIZED`, `MEETS_DEVICE_INTEGRITY` ; licence journalisée, non exigée ; verdict accepté gardé 24 h, refus 10 min ; Google injoignable = on laisse passer), en-tête `X-Integrity-Token` sur `/v1/meal/analyze`, `INTEGRITY_MODE=observe` déployé (ne bloque rien, journalise).
- [x] **6b-2b** (23/10 07:30) app (variante play) : `PlayIntegrityPlugin.java` (`com.google.android.play:integrity:1.6.0`, `StandardIntegrityManager`, fournisseur préparé une fois avec le projet 81378799481, re-préparé une fois si `INTEGRITY_TOKEN_PROVIDER_INVALID`) enregistré par `FlavorPlugins` ; `playIntegrity.js` (requestHash = sha256 `halcya-integrity:<installation>`, même vecteur testé côté app et relais ; délai 8 s puis pause 1 h) ; `aiRelay.js` joint `X-Integrity-Token` à **chaque** analyse (pas « un par jour » : le relais à zéro instance perd son cache, un jeton manquant serait refusé en `enforce` ; le relais ne décode qu'une fois par jour et par installation tant qu'il tourne). Compilation play vérifiée par le check « Build APK » de la PR (`bundlePlayRelease`).
- [x] **6d — code livré le 24/10 09:30** (workflow « Play — abonnements », déclenché aussi par un push sur ses fichiers ; **créé et actif sur Play du premier coup**, run 40075832746) — **spécifié le 24/10 08:30, `IDEES.md` I158 :** workflow `workflow_dispatch` « Play — abonnements » sur `main` + `app/scripts/play/subscriptions.mjs` (`buildCatalog()` pur + `ensureCatalog()` idempotent : GET → création `halcya_premium` avec `regionsVersion.version=2022/02`, fiche fr-FR obligatoire dont les `benefits` viennent de `config/premiumBenefits.js`, formules `annuel` P1Y 29,99 € / `mensuel` P1M 4,99 € en FR, grâce + suspension dont la somme fait 30 à 60 j, offre `essai-14j` gratuite P14D ciblée « jamais eu cet abonnement », puis activation des formules et de l'offre, relecture en résumé de job). Identifiants figés par un test (immuables chez Google). Refus faute de vérification bancaire ou 403 → corps exact de l'erreur dans le compte rendu, réessai aux runs suivants.
- [x] **6e côté routine (24/10 10:30)** : carte Accueil « paiement à régulariser » (grâce / suspension) + scénario P27 ; reste la passe du propriétaire (P27). Spécification d'origine : **6e (spécifié le 24/10 08:30, I159)** scénario testeur de licence ≈ 30 min (essai 3 min, mensuel 5 min, annuel 30 min, grâce 5 min, suspension 10 min, pause 5 min ; 7 cases ① à ⑦ à cocher dans `PRODUIT.md`) ; à décider : carte Accueil « paiement à régulariser » en grâce / suspension.
- [x] **I160** (25/10 18:33, `src/data/noHardcodedPrice.test.js`, étendu aux textes de l'app et aux Nouveautés) test-garde : aucun prix en dur (`\d+,\d\d ?€`) dans `store/listing/**` ni `public/*.html`.
- [x] **6b-2c-1** (24/10 11:30) bilan `event=integrity` des 7 derniers jours dans le résumé de « Relais — déploiement » (statut × mode × raisons × installations).
- [x] **CI** (24/10 11:30) `play-cold-start.sh` : seuls les plantages du processus `fr.jpesquet.sante` comptent ; tampon `crash` vidé avant la mesure et publié.
- [x] **6b-2c-2** (28/10 02:33) bilan lu : 1 installation `passed` (le téléphone du propriétaire, verdict gardé 24 h), 51 `missing` sur 45 installations, indiscernables (CI ou téléphones). L'app envoie `X-Integrity-Status` (`timeout`, `backoff`, `no_plugin`, `bad_token`, `error:<code Google Play>`) quand elle n'a pas de jeton ; le relais le journalise (`client`, borné, `other` sinon) avec `ci` (identifiants `ci-smoke-`) ; colonnes « Origine » et « Raison » dans le résumé du workflow.
- [ ] **INSTALLS-21** (28/10) 21 « premiers crédits » hors CI en 7 jours alors que seul le propriétaire a la version play : vérifier si ce sont les robots du rapport de pré-lancement (Play Console) ; sinon, 5 crédits offerts.
  **28/10 05:33 : instrumenté** — la variante play lit le réglage système `firebase.test.lab` (`PlayIntegrity.environment()`) et envoie `X-Test-Device: 1` avec chaque analyse ; le relais ajoute `testlab` aux journaux `first_credit` et `integrity` ; résumé du déploiement : « dont N robot(s) du rapport de pré-lancement » et origine « robots Google ». **Reste** : lire le bilan quelques jours après la prochaine version play (les robots tournent sur chaque version envoyée) ; si les « premiers crédits » non-robots restent nombreux → 5 crédits offerts.
- [ ] **6b-2c** lire les journaux `event=integrity` du relais (workflow de lecture des journaux) après les premières analyses de la version Play ; si `passed` sur le téléphone du propriétaire et aucun `rejected` inexpliqué → `INTEGRITY_MODE=enforce` dans `relay-deploy.yml`. **28/10** : `passed` vu ; attendre quelques jours de lignes « téléphones » (version ≥ celle de 6b-2c-2) sans `missing` inexpliqué avant `enforce` ; un `timeout` récurrent sur de vrais téléphones → garder `observe` (ou n'exiger le jeton que pour les crédits offerts).
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
- [ ] **I139 perf : valeur attendue du jour (Tendances)** — la tâche `todayPrediction` lit ~20 300 enregistrements
  (3 ans de démo) contre ~14 700 pour les Pistes : regarder ce qu'elle lit en plus (6 lectures) et le réduire.
  Budget `/tendances` 22 000 en attendant (mesure corrigée le 21/10 18:30, voir le compte rendu).
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
- [ ] Perf : `evaluateGate` est maintenant recalculé 3 fois par ouverture de la carte (carte, `faceMoodEstimate`,
  `testReadingEstimate`) en O(regards × n² × k²) ; négligeable aujourd'hui (0 jour noté), à mémoïser si > 150 jours
  comparables (mesurer d'abord, D2).
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
- [ ] **I86** (score 12, absorbe I80) : « Pas pertinent pour moi » sur chaque lien des Analyses (masqué partout,
      réversible, exporté) ; force et confiance séparées, en mots

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
- [ ] Accueil : « Vos derniers jours » (`loadJournalEntries`) relit toutes les tranches FC / SpO₂ des 7 jours → mesurer
      sa part des 3 988 restants, puis lecture par type ou agrégat journalier
- [ ] Cache d'agrégats journaliers / hebdo précalculés, invalidés à l'écriture (`health-entries-updated`)
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
- [ ] Budget `npm run perf` en CI (lectures par page ≤ N, temps bloquant de l'Accueil) — les temps sont bruités
      (± 200 ms), viser plutôt le nombre d'enregistrements lus
- [ ] Accueil : `WellbeingCharts` lit encore `listEntriesForAnalysis` (≈ 15 k entrées) → agrégats journaliers
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
- [ ] `SleepRegularityCard` : « Horaires variables » encore classé `is-unfavourable` (couleur de jugement)
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
- [x] **Radar expliqué** (I22) : tags « cause » (alcool, sport le soir, repas tardif, stress, nouveaux Voyage / Vaccin) le jour signalé ou la veille → « Probablement lié à… », badge « Explicable » ; série expliquée seulement si chaque jour a sa cause ; « Malade » confirme (`explainRadar`) (run 12/10 10:30 Paris)
- [ ] Radar expliqué, étape 2 : « Je me sens bien / Je couve quelque chose » en 1 tap (entrée `radar_feedback`) + recalibration des seuils ; tags voyage / vaccin comme contrôles des Analyses
- [ ] **Briefing du matin** (I24) : carte « Votre journée » jusqu'à midi (nuit vs norme, cœur / Radar, pression / pollen, énergie prévue en fourchette) + une seule action tirée des pistes solides
- [ ] Contrôle qualité des nuits (I32) : nuits « 100 % léger » / sans phases / tronquées exclues des moyennes de phases
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
- [ ] Lint à 0 erreur (6 erreurs, 1 warning au 12/10 02:30)
- [x] **Sauvegarde exhaustive** : l'export n'applique plus les plafonds de l'analyse (perte silencieuse des données anciennes) (#72)
- [ ] Performance IndexedDB : `listEntries` fait un `getAll()` + filtre JS à chaque appel → utiliser les index
- [ ] Code splitting (bundle principal > 500 kB, avertissement Vite)
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
- [ ] **POL-PLAY-11 (R8b/c)** Alpha après une journée sans plantage dans Android vitals ; `shrinkResources` à part.
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
- [x] **IOS-1** (28/10 12:33) Relais : Play Integrity exigé des seules requêtes Android. `requestPlatform()` :
  `X-Platform: ios`, ou `X-Integrity-Status: no_plugin` sans `X-Platform` → statut `not_android`, jamais bloqué (même
  en `enforce`) jusqu'à App Attest ; `X-Platform` dans les en-têtes CORS ; bilan du déploiement : origine « iPhone »
  et « Part des requêtes iPhone (hors CI) ». En-têtes falsifiables : plafonds par installation et global inchangés.
- [ ] **I6-RELAIS** (quand l'abonnement iPhone I6 sera prévu) Le relais accepte aussi les abonnements App Store sans
  rien changer au chemin Google Play : transaction StoreKit 2 vérifiée sur place (signature JWS, chaîne x5c jusqu'à
  la racine d'Apple, bundleId `fr.jpesquet.sante`, `appAccountToken` tiré de l'identifiant d'installation),
  notifications serveur V2 sur une route à part, mêmes droits, mêmes crédits, même période de lancement.
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
- [ ] **VEILLE-1 (I196)** Sideload : ajouter à la migration de clé (`INFRA.md`, signature sideload) l'enregistrement
  de `com.healthtrack.app` dans la Play Console comme « app distribuée hors de Google Play » une fois signée avec une
  clé privée (la clé de debug publique ne peut pas prouver la propriété) ; échéance : avant l'extension mondiale de
  la vérification des développeurs (2027, date pas encore publiée).
- [ ] **TF-1** (I194 ; le jour où le propriétaire dit « j'invite le <date> ») `relay/src/launch-period.json` :
  `until` = invitation + 14 + 10 jours à 23:00 UTC ; date dans le texte d'invitation (`INVITATION-TESTEURS.md` §3,
  `<date de fin de la période de lancement>`) ; vérifier le résumé du déploiement du relais et l'affichage
  « jusqu'au … » (Premium, fin de l'onboarding). Pendant le test : au moins 2 versions en alpha (une par jour au plus),
  `PRODUIT.md` §4 bis tenu à jour à chaque changement venu d'un testeur.
- [ ] **TF-2** (I194 ; jour 12 du test) Compléter le brouillon P30 (`INVITATION-TESTEURS.md` §5) avec les vrais
  retours (le propriétaire colle les commentaires des testeurs), la liste du §4 bis et l'état réel d'Android vitals
  et du rapport de pré-lancement (POL-PLAY-11) ; signaler en tête du résumé « 👉 Formulaire d'accès prêt ».
- Audit 29/10 02:33 (démo sombre, Historique du bien-être, Montre, Données, Premium, Paramètres, Réglages) : rien d'autre de bloquant ; « 30 lectures » en tête de l'historique et « sur 10 lectures » sous les expressions (seules les lectures récentes ont les probabilités) peut surprendre : à expliquer en une demi-ligne si un retour le signale.

**Mise à jour du 27/10 (13:33 Paris)** : ✅ **P28-INTERNE** (version de test interne avec la lecture au déverrouillage). Décision du propriétaire du 27/10 13:00 : testeurs au plus tôt la semaine prochaine, 9 (anglais) en pause, priorité au **polissage de la version play** par impact (bugs, chiffres fiables, parcours écran par écran sur données vierges et de démo) ; fin de la période de lancement à recaler sur l'invitation.

**Mise à jour du 27/10 (11:33 Paris)** : ✅ **9a** socle i18n (`src/i18n/` : `t()`, `t.plural`, `appLocale()`, `decimalMark()`, test de catalogue sur `converted.js` ; réglage « Langue » caché derrière `VITE_I18N_EN` ; `visual --lang=en` qui compte les mots français restants ; rien de visible). Suite : **9b** (Layout, navigation, Accueil, Paramètres : ajouter chaque fichier converti à `i18n/converted.js`) ou 7d ; POL-1d dès P28.

**Mise à jour du 27/10 (10:33 Paris)** : ✅ **I176** forme des selles (« + Selles » dans la carte ventre : dures / normales / liquides, type de Bristol sur demande ; Journal ; PDF). Suite : **9a** (socle i18n, rien de visible) ou 7d ; POL-1d dès P28. Idée notée : forme des selles comme second Y des pistes repas → ventre (I176 b, plus tard, après assez de notes).

**Mise à jour du 27/10 (09:33 Paris)** : ✅ paywall au moment de la valeur pour les pistes repas → ventre (Play sans premium : nombre + aperçu flouté + « Débloquer ») ; écran premium : 4 avantages livrés. Suite : **9a** (socle i18n, rien de visible) ou I176 (forme des selles) ; POL-1d dès P28.

**Mise à jour du 26/10 (14:53 Paris)** : 🆕 **priorité du propriétaire du 26/10 14:45 — FODMAP par sous-groupe et
fiabilité de la table nutritionnelle** (passe avant I175 étape 2, M6 et le reste). Découpage :
- [x] **N1** audit chiffré + importeur Ciqual testé (`app/scripts/nutrition/` : `audit.mjs`, `ciqual.mjs`,
  `build-ciqual-table.mjs`) — **FAIT le 26/10 14:53**. Constat : 3 506 / 3 553 aliments partagent leur vecteur de
  micronutriments (59 gabarits inventés), 201 AGS > lipides, 145 énergies incohérentes, 98 sec / cuit implausibles.
- [x] **N2** reconstruction depuis **Ciqual 2025** — **FAIT le 26/10 16:33**. Source : https://zenodo.org/records/17550133
  (publiée par l'Anses, CC BY 4.0, md5 vérifiés ; ciqual.anses.fr toujours en 503). Importeur adapté au format 2025
  (« Alcool (éthanol) », vitamine A en équivalents rétinol, vitamine E en alpha-tocophérol à défaut, énergie
  recalculée depuis les macros quand elle n'est pas publiée, marquée `calculé`) ; 69 alias (`aliases.mjs`) pour les
  noms simples ; mêmes clés, même ordre ; attribution CC BY en bas de Nutrition ; test de la table livrée.
- [x] Test `UpdateBanner` « progression en Mo et en % » fiabilisé le 26/10 22:33 (attentes 3 s → 10 s : le suivi
  interroge toutes les 800 ms en temps réel ; échec vu sous la charge de la suite complète).
- [x] **N2b** — **FAIT le 27/10 00:33** (`unknown_share` par champ au poids mangé ; ligne « partiel » + « ≥ » dans Nutrition au-delà de 10 % ; les KPIs de l'analyse gardent leurs valeurs). Détail d'origine : inconnu ≠ 0 dans les totaux : `computeTotalsFromItems` compte encore une teneur `null` comme 0 (phrase
  d'avertissement en bas de Nutrition) ; renvoyer la part connue par nutriment et l'afficher (« sodium : partiel »)
  dans Nutrition et les KPIs. Valeur Ciqual suspecte vue au passage : fer de l'oignon cru 0,00019 mg (publiée telle
  quelle).
- [x] **N3a** calcul par sous-groupe — **FAIT le 26/10 18:33** : `services/fodmapGroups.js` (`fodmapPer100g`,
  `estimateMealFodmap`, `highFodmapGroups`) ; lactose, fructose en excès du glucose, polyols totaux depuis Ciqual
  (« < x » = traces = 0 ; excès sur glucose « < x » = `approché`) ; polyols nuls ⇒ sorbitol et mannitol nuls ; repères
  par portion Varney 2017 (PMID 28244665) : 0,3 / 0,3 / 0,15 / 1 / 0,4 / 0,4 g ; niveau `élevé` / `bas` (tous connus) /
  `inconnu` ; contributeurs par aliment ; `data/fodmapMeasurements.json` (vide, schéma + test : source déclarée,
  confiance `mesure` / `analogie`). Rien d'affiché.
- [x] **N3a-bis** — **FAIT le 26/10 22:33** (limite « < x » gardée en `max` ; `bas` seulement si le total au plafond reste sous le repère ; une mesure publiée ne précise un « < x » que si elle est ≤ x). Détail d'origine : : une teneur Ciqual « < x » ne donne `bas` que si `portion × x / 100` reste
  sous le repère, sinon `inconnu` (polyols « < 0,5 » : avocat, chou-fleur, légumineuses cuites passeraient `bas` à
  tort) ; test « avocat 100 g → sorbitol inconnu ». Détail : `IDEES.md` I178 règle 5 (run « idées » du 26/10 20:33).
- [x] **N3b-1** — **FAIT le 26/10 22:33** : `fodmapMeasurements.json` v2 (une entrée par groupe : `g` ou `share` des polyols
  Ciqual, `source`, `ref`, `confidence` `mesure` / `analogie` / `citée`, `notes`) ; 32 aliments : fructanes Ferjančič 2024
  (oignon, poireau, pâtes, pain, farine T55 en analogie, avoine, amande, noisette, noix, banane, orange, clémentine, raisin,
  pomme, poire), ail 17,4 et échalote 8,9 cités par Wang & Cheong 2023 (confiance basse), GOS Natale 2025 (tofu, tempeh,
  boisson au soja, farine de pois chiche, soja, avoine en analogie), sorbitol / mannitol MEXT (pomme 0,5 ; parts des polyols
  Ciqual : poire, pêche, pruneau → sorbitol ; champignon, céleri → mannitol ; abricot 0,3 précise « < 0,5 »). Tests :
  intégrité (nom Ciqual non alias, source, confiance, part seulement si Ciqual mesure des polyols > 0, valeur ≤ glucides,
  chaque valeur réellement utilisée) + exemples (oignon 70 g, ail 3 g, pomme, poire, tofu, pâtes).
- [x] **N3b-2** — **FAIT le 27/10 01:33** (GOS) : `scripts/nutrition/legumeGos.mjs` relit l'eau Ciqual 2025 et calcule les
  GOS de 13 légumineuses cuites / en conserve depuis Siva 2019 tableau 5 (base 10 % d'humidité) × pertes Njoumi 2019,
  `analogie` avec `derivation` recalculable ; sources citées dans le chevron de la carte d'un repas (`cite`).
  **Reste** (non bloquant) : sorbitol des lentilles / pois chiches (pertes à la cuisson inconnues), cerise et autres
  aliments MEXT, `fodmap_score` des nouveaux repas. Note d'origine : GOS des légumineuses cuites (lentilles, pois chiches, haricots ; S3 Siva 2019 × règle 3 d'`IDEES.md` I178,
  `analogie`) : garder l'eau Ciqual (`water_g`) dans l'importeur ou la relire du fichier Ciqual ; nectarine (MEXT 0,6 >
  Ciqual « < 0,5 » : contradiction, laissée inconnue), cerise, autres aliments MEXT ; brancher `fodmap_score` des nouveaux
  repas sur les sous-groupes (anciens exports lisibles). Ancienne note N3b :
- [ ] ~~**N3b**~~ remplir `fodmapMeasurements.json` — **sources prêtes** (`IDEES.md` I177–I179, 26/10 20:33) : sorbitol /
  mannitol de la table japonaise MEXT 2020 (usage commercial permis, compatible CC BY ; xlsx et md5 notés), fructanes de
  Ferjančič 2024 (CC BY), GOS des légumineuses sèches de Siva 2019 (CC BY) ramenés au cuit par l'eau Ciqual et les pertes
  de Njoumi 2019 (`analogie`), GOS du soja de Natale 2025 (CC BY) ; Ciqual d'abord pour les polyols (total réparti
  selon les proportions publiées) ; ail et échalote en confiance basse (cités par une revue) ; correspondance de
  départ de ~30 aliments avec leurs noms exacts. Ancienne liste de pistes (articles payants, non lus) :
  (pistes : Muir et al. 2007 J Agric Food Chem 55:6619 fructanes légumes et fruits ; Muir et al. 2009 J Agric Food Chem
  57:554 HPLC ; Biesiekierski et al. 2011 J Hum Nutr Diet céréales ; Yao et al. 2014 J Hum Nutr Diet polyols ;
  Tuck / Ly et al. légumineuses) — vérifier chaque valeur dans l'article, citer page / tableau ; un run « idées » peut
  préparer la liste. Puis brancher `fodmap_score` des nouveaux repas sur le sous-groupe (anciens exports lisibles).
- [x] **N3c** — **FAIT le 27/10 05:33** : `fodmap_score` des repas calculé depuis les sous-groupes (nombre de groupes au-dessus
  du repère, 0–6 ; `fodmap_groups` à côté) dans `computeTotalsFromItems` ; libellé « Groupes FODMAP au-dessus du repère » dans
  le moteur du bien-être ; champ inventé retiré de la table (et de `keepFields`). 1 104 → 600 aliments « chargés » à 100 g
  (fructanes du blé des produits transformés non mesurés → inconnus).
- [ ] **N3** (reste) FODMAP par sous-groupe (fructanes, GOS, lactose, fructose en excès du glucose, sorbitol, mannitol) par
  portion : lactose / fructose / glucose / polyols depuis Ciqual, fructanes / GOS / sorbitol / mannitol depuis des
  mesures publiées citées par aliment (jamais Monash ni FODMAP Friendly), sinon « inconnu » ou analogie à confiance
  basse ; `fodmap_score` reste lisible dans les anciens exports.
  - [x] **N3d** — **FAIT le 29/10 09:33** (#498) : `g_high` / `source_high` / `ref_high` (source `liljebo2020`, valeurs relues
    dans le supplément : pain blanc 1,02 d'après Whelan 2011, tableau 1 ; oignon 6,30 et poireau 3,80 d'après Muir 2007,
    tableau 3) ; niveau `probable` (borne haute ≥ repère, basse dessous), compté par `highFodmapGroups` (pistes, score) ;
    chevron « 0,11 à 0,82 g selon les mesures publiées ». Contrôle : borne haute ≤ glucides + fibres (les fructanes sont
    des fibres pour Ciqual : 6,3 > 6,25 g de glucides de l'oignon). Détail initial :
    (I191, préparé le 29/10 08:33) fourchette quand deux
    mesures publiées divergent de plus de 2 fois : `g_high` + `source_high` / `ref_high` dans `fodmapMeasurements.json`
    (pain blanc et de tradition 0,14 → 1,02 Whelan 2011 ; poireau 0,24 → 3,8 et oignon ×3 1,97 → 6,3 Muir 2007, tous
    via Liljebo 2020 CC BY / CC0, source `liljebo2020`, confiance `citée`) ; `estimateMealFodmap` : `max += g_high`,
    jamais `bas` si la borne haute dépasse le repère, `probable` entre les deux. Tests : 80 g de baguette et 100 g de
    poireau → `probable` (aujourd'hui `bas`) ; 40 g d'oignon → `élevé` ; chevron « 0,1 à 0,8 g selon les mesures
    publiées ». Nouveautés : « Pain et poireau ne sont plus dits pauvres en fructanes ».
  - [x] **N2c** — **FAIT le 29/10 13:41** : valeur de Ciqual 2025 elle-même (0,00019, confiance A ; jaune 0,1, rouge 0,19,
    cuit 0,21) → `scripts/nutrition/suspects.mjs` (null + `_q: suspect`, ligne périmée signalée si Ciqual corrige) ;
    recherche sur tous les micronutriments (sous-groupe ×300, variantes ×100) : seul cas retenu. Détail initial :
    `Oignon, cru` a `iron_mg` 0,00019 dans la table (l'ordre de grandeur attendu
    est ~0,2 mg) : relire la valeur Ciqual 2025 de l'oignon et, si c'est une erreur d'unité du script, chercher les autres
    (41 aliments sous 0,01 mg, surtout des eaux, plausibles).
  - [x] **N3e** (I192) — **FAIT le 29/10 10:33** : `scripts/nutrition/ferjancicFructans.mjs`, 49 entrées (20 lignes
    du tableau 1) ; « ND » = `{ g: 0, lt }`, limite prudente 0,3 % MS (l'article la donne en absorbance) ; analogies
    cuit ← cru à teneur égale (eau Ciqual absente de la table) ; fructanes et GOS nuls quand glucides et fibres Ciqual
    sont nuls (504 aliments). Fructanes connus 20 → 573. Écartés : pomme de terre au four, choucroute, navet aigre,
    chips, **pain bis (à reprendre dans N3f avec une borne haute)**.
  - [x] **N3f — fructanes FAIT le 29/10 11:33** : `scripts/nutrition/liljeboFructans.mjs` (23 entrées, valeurs relues
    dans le supplément MOESM1 : ail 17,4 remplace Wang & Cheong ; topinambour 12,2 ; son 3,7 ; germe 2,25 ; semoule 2,25 ;
    boulgour 2,0 (« valeur du couscous ») ; pain complet 0,79 ; pain de seigle complet 1,14 ; seigle complet 3,52 ; pain
    croustillant de seigle 3,2) ; sec → cuit par le rapport des glucides Ciqual (couscous 1,0, boulgour 0,73, ail grillé,
    rôti, poudre) ; pain bis = fourchette du pain blanc (0,14–1,02). Fructanes connus 573 → 595.
  - [x] **N3g — FAIT le 29/10 12:33** : `scripts/nutrition/liljeboPolyols.mjs` (14 entrées, tableau 6 relu : prune 2,4
    sorbitol et pois mange-tout crus 1,16 mannitol en `citée` ; prune violette en analogie ; mirabelle, reine-claude,
    abricot sec, sec moelleux et au sirop égouttés : part 1 du total Ciqual en sorbitol ; champignon de Paris sauté,
    bouilli, surgelé, appertisé : part 1 en mannitol comme le cru). Écartés (Ciqual « < 0,5 » contredit) : mûre 4,76,
    chou-fleur 2,96, avocat 0,65, nectarine 1,01, abricot cru 1,2 (MEXT 0,3 gardé, écart noté) ; poivron et maïs
    (sous-groupe non indiqué) ; pois mange-tout cuits, pruneau cuit et jus (non mesurés). Écart noté : abricot sec Ciqual
    22,6 g de polyols contre 6,0 g de sorbitol chez Liljebo (total Ciqual gardé).
  - [ ] ~~**N3g**~~ (détail initial) polyols Liljebo 2020 quand Ciqual ne mesure pas les polyols : pruneau 10,8 et abricot
    sec 6,0 sorbitol (Yao 2014), mûre 4,76, prune 2,4 sorbitol ; chou-fleur 2,96 et pois mange-tout 1,16 mannitol (Muir
    2009) ; champignon 2,74 (sorbitol + mannitol, répartition à documenter) ; avocat 0,65 ; abricot frais : garder MEXT,
    noter l'écart ; nectarine : laisser inconnu. Valeurs relues le 29/10 dans le supplément, tableau 6.
  - [ ] ~~**N3f** (I193)~~ (détail initial) Liljebo 2020 en `citée` : fructanes (ail 17,4 en remplacement de Wang & Cheong, topinambour,
    son de blé, pains de seigle, semoule / couscous / boulgour ramenés au cuit par l'eau Ciqual, pain complet) ;
    sorbitol / mannitol quand Ciqual ne mesure pas les polyols (pruneau, abricot sec, mûre, prune, chou-fleur, pois
    mange-tout, champignon, avocat, poivron, maïs) ; « green peas 1,88 » = pois cassés, pas les petits pois. Liste
    complète et noms Ciqual exacts : `IDEES.md` I193.
- [x] **N4** carte d'un repas — **FAIT le 26/10 23:33** : `MealFodmapLine` sous chaque repas de Journal → Repas (objectif
  ventre seulement, `gutCardMode`) : « Riche en fructanes : oignon », « Probablement riche » si le repère n'est dépassé
  qu'avec des valeurs à confiance basse (`mealFodmapHighlights`), grammes / repère / origine au chevron. **Fait le 27/10 06:33** : la même
  ligne sous l'éditeur du résultat d'une analyse photo, de « Décrire » / « Refaire » et de « Modifier », en direct.
  Reste possible (facultatif) : « Vos derniers jours ».
- [x] **N5** — **FAIT le 27/10 02:33** : `mealFactors` produit `fodmap:<groupe>` pour chaque sous-groupe au-dessus du
  repère (`estimateMealFodmap`) au lieu de `fodmap_eleve` ; tous les sous-groupes mangés sont candidats (un groupe trop
  rare n'est pas testé, donc ne coûte rien ; jumeaux comptés une fois) ; libellés « Repas riches en lactose », piste
  regroupée « Lentille verte (riche en GOS) » ou « Banane, yaourt nature ou le lactose » ; lien vers le test du même
  groupe (fructanes : groupe en tête, aliment à choisir) ; calendrier du rapport avec `fodmapGroups` par jour. Banc
  `gutFodmap.calibration.test.js` (vrais noms Ciqual, 200 jeux, 63 j) : nulles ≤ 13/200 avec, ≤ 14/200 sans ; puissance
  lactose (lait ou yaourt ×4, 90 j) 25/200 contre 13/200, oignon ×4 64 contre 66/200.
  **Reste** : fructanes presque toujours `too_early` dans un journal où oignon, ail ou pâtes reviennent chaque jour
  (peu de jours sans) : normal, la réintroduction guidée est là pour ça ; carotte « riche en fructose en excès » à 80 g
  d'après Ciqual (fructose 1,51 > glucose 0,89) : à surveiller (donnée Ciqual, pas une erreur de calcul).
- [x] **N6** rapport PDF par sous-groupe (avec I175 étape 2) — [x] **N6a FAIT le 27/10 03:33** : `services/report/renderPdf.js`
  (pdf-lib 1.17.1 + @pdf-lib/fontkit 1.1.1, MIT ; A4, 2 pages « En bref » / « Détail » ; calendrier avec les
  sous-groupes du jour en abrégé Fn / G / Fr / L / S / M ; tableau « FODMAP par sous-groupe » = décompte de jours
  riches / notés / gêne ou douleur, dit « pas une analyse » ; repère Varney présenté comme hypothèse ; attribution
  Ciqual) ; `buildReport().fodmapGroups` ; polices TTF de `src/assets/fonts/report/` (conversion WOFF → TTF par
  `scripts/fonts/woff-to-ttf.mjs` : le WOFF2 casse le découpage de fontkit, le WOFF de Plex Mono ses glyphes vides) ;
  2 pages même sur 12 semaines, 19–26 Ko ; rien d'affiché. [x] **N6b FAIT le 27/10 04:33** accès : `createReportPdf` (import dynamique,
  `loadReportFonts`), écriture dans Documents + partage (Share), bouton « Rapport PDF pour mon médecin » en bas
  d'Analyses et dans Données (choix 2 / 4 / 12 semaines, case « inclure mon bien-être estimé » décochée), premium sur
  play (offert pendant le lancement), libre en sideload ; vérifier le partage sur l'émulateur.
  Livré : `services/report/createReportPdf.js` + `components/DoctorReportCard.jsx` ; partage par `@capacitor/share` 8.0.3
  (MIT, aucune permission) ; partage annulé = fichier gardé dans Documents. [x] **N6c FAIT le 27/10 07:35** : `.github/scripts/pdf-share/drive.mjs`
  dans le job émulateur API 35 (non bloquant) : Données → « Créer le PDF » → feuille de partage Android (« Sharing 1 file ·
  Halcya-rapport-AAAA-MM-JJ.pdf », Quick Share, Drive, Messages…), fichier de 20 Ko dans Documents (`%PDF-`), partage annulé →
  « … est dans Documents », 2ᵉ rapport le même jour remplacé sans erreur ; captures + PDF dans l'artefact « rapport-pdf-emulateur ».
  Reste (facultatif) : `apt-get update` avant poppler-utils pour l'aperçu PNG dans la CI ; rendre l'étape bloquante après
  quelques runs verts.

**Mise à jour du 26/10 (13:48 Paris)** : ✅ **I175 étape 1** — modèle pur du rapport (`services/report/buildReport.js` : période 2 / 4 / 12 semaines, ventre jour par jour à la note la plus forte, semaine par semaine, calendrier avec jours riches en FODMAP, tests de réintroduction, pistes « à confirmer » avec le nombre de comparaisons, sommeil mesuré et régularité, aliments fréquents, sources lisibles, bien-être estimé seulement sur demande) ; rien d'affiché. Suite : **I175 étape 2** (`renderPdf.js` ✅ 27/10 03:33 avec N6a ; reste l'accès N6b) → I176 → 7d.

**Mise à jour du 26/10 (09:33 Paris)** : ✅ **7a** — machine de réintroduction pure (`services/fodmapChallenge.js` :
6 groupes et repères de départ, garde des 3 jours calmes, fenêtre de 24 h, question « supportable ? », verdict,
pause de fin, un test à la fois, jours sautés, fructanes par aliment) ; rien d'affiché ; « intolérance » et
« allergie » interdits dans les textes. I134 étape 4 laissée de côté (facultative). Suite : **7b** (écrans ①–④ +
rappel, `recordDose` / `answerTolerable` branchés sur `createEntry` / `updateEntry`) → I175 étape 1 → I175 étape 2
→ 7c → I176 → 7d. POL-1d attend P28.

**Mise à jour du 26/10 (08:33 Paris, run « idées »)** : jalon 7 spécifié (`IDEES.md` I174–I176). Ordre conseillé pour
les runs de code, une fois I134 étape 4 faite ou écartée : **7a** (machine de réintroduction, rien d'affiché) → **7b**
(écrans) → **I175 étape 1** (`buildReport.js`) → **I175 étape 2** (PDF) → 7c → I176 → 7d. Trancher au passage
`pistes-delays` dans `premiumBenefits.js`. POL-1d attend toujours P28.

**Mise à jour du 26/10 (07:33 Paris)** : I134 étape 3 — aliments du même jour estimés ensemble dans `gutDays` (chaque piste recomparée à exposition égale aux pistes plus nettes) ; piège « ail qui accompagne l'oignon » 23 → 1/60, 38 → 6/60 au plus lié ; ne peut que retirer des pistes. Suite : I134 étape 4 facultative (`gutWindows`) ou I135 / I171 c ; POL-1d dès P28.

**Mise à jour du 26/10 (06:33 Paris)** : I134 étape 2 — stress et temps d'écran de la veille en covariables des pistes ventre, retenus seulement s'ils vont avec le ventre (deux au plus) ; pièges « café » 26–29/30 → ≤ 3/30, puissance gardée. Suite : I134 étape 3 (repas du même jour estimés ensemble) ; POL-1d dès P28.

**Mise à jour du 26/10 (05:33 Paris)** : I134 étape 1 — la nuit d'avant en covariable des pistes ventre jour par jour (piège « café des nuits courtes » évité ; puissance 22 → 31/60 quand la nuit joue, 51 → 45/60 sinon). Suite : I134 étape 2 (stress, écran) ; POL-1d dès P28.

**Mise à jour du 26/10 (04:33 Paris)** : I173 — moins de comparaisons dans les moteurs ventre (12 aliments au plus, jumeaux comptés une fois), puissance +20 à +28 % sur journaux à longue traîne. Suite : I134 ; POL-1d dès P28.

**Mise à jour du 26/10 (03:33 Paris)** : pistes repas → ventre affichées dans Analyses (avec I171 a/b, aliments mangés ensemble regroupés). Suite : I134 ou moins de comparaisons (aliments fréquents / groupes FODMAP) ; POL-1d dès P28.

**Mise à jour du 26/10 (02:33 Paris)** : I170 étape 3 — analyse jour par jour avec les bilans du soir (`gutDays.js`, banc passé, rien d'affiché). Suite : **affichage des pistes ventre dans Analyses** (avec I171 a/b) → I134. Piste pour la puissance : limiter les comparaisons aux aliments fréquents ou aux groupes FODMAP (moins de 20 tests).

**Mise à jour du 26/10 (01:33 Paris)** : I170 étape 2 — notification native du bilan du ventre (proposée le soir dans la
carte, réglable dans Paramètres). Suite : **I170 étape 3** (analyse jour par jour avec les bilans) → affichage des pistes
ventre dans Analyses (avec I171 a/b) → I134.

**Mise à jour du 26/10 (00:33 Paris)** : I170 étape 1 — bilan du soir du ventre dans la carte de l'Accueil (à partir de
18 h, `scope: 'day'`). Suite : **I170 étape 2** (notification native du soir, objectif « Mon ventre » seulement) →
I170 étape 3 (analyse jour par jour avec les bilans) → affichage des pistes ventre dans Analyses (avec I171 a/b) → I134.

**Mise à jour du 25/10 (23:33 Paris)** : ✅ I169 étape 2 — le moteur ventre passe le banc des nulles (blocs de 3 jours,
Mantel-Haenszel). Suite : **I170** (bilan du soir du ventre) → affichage des pistes ventre dans Analyses (avec I171 a/b)
→ I134 ; groupes FODMAP seulement si la puissance manque sur les journaux réels.

**Mise à jour du 25/10 (22:33 Paris)** : I169 étape 1 — banc des 4 nulles réalistes livré ; constat : le moteur ventre
(Fisher + BH + porte TTS) laisse passer 15 à 27 % de fausses pistes avec 10 aliments et manque de puissance. Suite :
**I169 étape 2** (groupes FODMAP au lieu d'aliments + max-T sur z robuste, critère < 20/200 et puissance ≥ 50 %) →
I170 → affichage des pistes ventre. Rien n'est affiché dans l'app d'ici là.

**Mise à jour du 25/10 (21:33 Paris)** : ✅ LISTING-1 et ✅ I168 livrés (#380). Suite : **I169 → I170 → affichage des
pistes ventre dans Analyses (avec I171 a/b) → I134**.

**Mise à jour du 25/10 (20:33 Paris, run « idées »)** : [x] **LISTING-1** (FAIT le 25/10 21:33) (I172, court, à faire en premier) — la fiche
Play `app/store/listing/fr-FR/full-description.txt` dit encore « tout s'efface en désinstallant l'app » (faux depuis la
sauvegarde Android conservée le 24/10 : écrire qu'une copie peut rester dans la sauvegarde Google du téléphone, comme la
page de confidentialité) et parle de l'onglet « Pistes » (→ « Analyses ») ; ajouter naturellement « côlon irritable
(SII) », « journal alimentaire », « hypothèses FODMAP » (sans liste de mots-clés) ; test-garde. Puis jalon 5 dans
l'ordre **I168 → I169 → I170 → affichage des pistes ventre dans Analyses (avec I171 a/b) → I134**. POL-1d attend P28.

**Mise à jour du 25/10 (08:33 Paris, run « idées »)** : polissage du 24/10 livré (POL-1d attend P28). Audit de la
version candidate → 6 petits défauts (VC-22 à VC-27) + AVIS, puis **VC-PUBLIER** (alpha + période de lancement).
POL-1d après la version candidate, dans une version séparée. Détail : section « 🎯 Version candidate » ci-dessus.

**Mise à jour du 21/10 (18:30 Paris)** : ✅ 2b (accueil) — forme et courbes du bien-être rangées dans **Journal →
Tendances** ; ✅ 2e « Prédiction du jour » → « Attendu d'après vos habitudes ». Prochain run de code → **3b-3 « Lecture
rapide »** (play, déclenchée par l'utilisateur) ou, si plus utile, **jalon 4 onboarding** (premier écran de la maquette,
objectif ventre / énergie / tout comprendre) ; 2b réglages + Sources plus tard ; 3c dès P10/P11.

**Mise à jour du 21/10 (16:30 Paris)** : ✅ 2c-2 « Vos derniers jours » dans l'onglet Journal (Jours | Repas |
Nutrition), accueil allégé. Prochain run de code → **2b** : inventaire chiffré de ce qui reste sous l'accueil (Radar
forme, cartes cœur / régularité du sommeil, graphiques du bien-être) → les ranger derrière « détails » ou dans Pistes ;
2e « Prédiction du jour » → « estimation » ; puis 3b-3 « Lecture rapide » ; 3c dès P10/P11 ; puis jalon 4 onboarding.

**Mise à jour du 21/10 (14:30 Paris)** : ✅ 2c navigation 4 onglets (Aujourd'hui, Journal = Repas | Nutrition, Pistes,
Sources ; roue « Réglages » en haut à droite ; aucune route changée). Prochain run de code → **2b + 2c-2** : inventaire
chiffré de l'accueil, « Vos derniers jours » (et notes du ventre) dans l'onglet Journal, radar / graphiques allégés ;
puis 3b-3 « Lecture rapide » ; 3c dès P10/P11 ; puis jalon 4 onboarding.

**Mise à jour du 21/10 (12:30 Paris)** : ✅ 2 bis (iii) écran Accueil « Aujourd'hui » + saisie du ventre en un geste
(entrée `gut`, première brique du jalon 5). Prochain run de code → **2c navigation 4 onglets** (Aujourd'hui, Journal
— le journal des jours quitte l'accueil —, Pistes = Analyses, Sources = Connecteurs ; réglages en haut à droite ;
Repas / Nutrition / Données / Nouveautés rangés sans perte), avec 2b (inventaire chiffré) dans le même run ; puis 3b-3
« Lecture rapide » ; 3c dès P10/P11 ; puis jalon 4 onboarding.

**Mise à jour du 21/10 (10:30 Paris)** : ✅ 3b-2 + I131 (variante play sans service caméra, lecture du visage à
l'ouverture de l'app, 15 permissions Health Connect). Prochain run de code → **2b/2c + 2 bis (iii)** : écran Accueil
« Aujourd'hui » de la maquette et navigation 4 onglets (Aujourd'hui, Journal, Pistes, Sources), sans perte de
fonction ; puis 3b-3 (« Lecture rapide ») ; 3c dès P10/P11.

**Mise à jour du 21/10 (08:30 Paris, run « idées »)** : PR #246 (3b-1) fusionnée → v193. Ordre inchangé : prochain
run de code → **3b-2** (manifeste play sans service caméra + lecture à l'ouverture ; y joindre **I131**, permissions
Health Connect réduites, puisque le manifeste play est déjà ouvert), puis 2b/2c + 2 bis (iii) Accueil ; 3c dès
P10/P11. Nouvelles idées I130–I138 rangées dans les jalons 4, 5, 6, 7, 8, 10 ci-dessus.

**Mise à jour du 21/10 (06:30 Paris)** : ✅ 3b-1 (étude Play + divulgations avant autorisation). Prochain run de code →
**3b-2** (manifeste play sans service caméra, lecture du visage à l'ouverture de l'app), puis 2b/2c + 2 bis (iii)
Accueil ; 3c dès P10/P11. ⚠️ Ce run n'a pas pu merger (voir `runs/2026-10-21-0630-divulgations.md`) : le run suivant
reprend d'abord les PR « [Auto] » ouvertes.

**Mise à jour du 21/10 (04:30 Paris)** : ✅ 2 bis (ii) icône « H nuit ». Prochain run de code → **3b** (option caméra
la plus sûre pour play, divulgations avant permissions sensibles, revue des permissions du manifeste play), puis 2b/2c
+ 2 bis (iii) Accueil « Aujourd'hui » et navigation 4 onglets ; 3c (envoi automatique en test interne) dès que P10/P11
sont faits. Run « idées » de 08:30 : règles Play (FGS caméra, Health Connect, Data safety) → alimente 3b.

**Mise à jour du 21/10 (02:30 Paris)** : ✅ jalon 3a. « Play — AAB » sera **rouge sur main jusqu'à P9** : ce n'est pas
une panne à réparer (charte), sauf si le message n'est plus « Clé d'envoi Play absente » / « Accès refusé ». Prochain
run de code → **2 bis (ii) icône « H nuit »** + écran de démarrage (sert aussi la fiche Play), puis **3b** (option
caméra play, permissions sensibles), puis 2b/2c + 2 bis (iii) Accueil et navigation 4 onglets ; 3c dès que P10/P11 sont
faits. Run « idées » de 08:30 : règles Play (FGS caméra, Health Connect, Data safety) → alimente 3b.

**Réordonnées le 21/10 (00:30 Paris), sections INFRASTRUCTURE et IDENTITÉ VISUELLE du prompt (lues pour la première
fois)** : 1) PR « [Auto] » rouge ou workflow cassé ; 2) retour du propriétaire sur la mise à jour ; 3) prochain run de
code → **jalon 3 variantes play / sideload** (le test fermé dure 14 jours : une première variante play installable au
plus tôt ; AAB signé par la CI sur `main` avec le keystore Secret Manager, échec propre s'il manque), puis **2 bis (ii)
icône**, **2b/2c nettoyage + navigation 4 onglets** (Aujourd'hui, Journal, Pistes, Sources — maquette) avec **2 bis
(iii) Accueil**, puis jalons 4 → 10. I129 (alléger l'APK) quand un run a de la marge.

**Réordonnées le 20/10 (22:30 Paris), décisions produit du 20/10 au soir (charte §000000000) — priment sur tout ce
qui suit** : 1) PR « [Auto] » rouge ou Build & Release cassé ; 2) retour du propriétaire sur la mise à jour (v188 →
v189) ; 3) **jalons de `PRODUIT.md` dans l'ordre** : prochain run de code → **2b** inventaire chiffré + premières
décisions de nettoyage (et 2e « Prédiction du jour »), puis 2c, 2d, puis **3** variantes play / sideload. I129
(alléger l'APK de 18 Mo) dès qu'un run a de la marge : il sert la mise à jour sideload et la taille sur Play. Le
chantier bien-être automatique (I117 voix…) et la montre (A.1–A.3) passent après les jalons, sauf panne.
Runs « idées » : veille produit (concurrents SII, Play, juridique, acquisition) → `IDEES.md`, `RESEARCH.md`,
`PRODUIT.md`.

**Réordonnées le 19/10 (22:30 Paris), consigne du 19/10 au soir (charte §0000000) — prime sur l'ordre ci-dessous** :
1) diagnostic de l'A56 dès qu'il arrive (signalement 15:05, arbre I122) ; 2) ✅ étape 1 estimation dès la première
lecture (22:30) ; 3) **étape 2 modèle valence / éveil** (run idées 20/10 08:30 : comparatif et licence ; puis code) ;
4) ✅ I121 + I121 étendu à la calibration personnelle (20/10 00:30) ; 5) étape 3 visage + voix (I117) ; 6) I123, I124.
**Mise à jour du 20/10 20:30** : ✅ signalement 19:05 (mise à jour en un clic) ; prochain run de code → I129
alléger l'APK si le propriétaire confirme l'installation, sinon I117 préparation ; veille « idées » reportée à 08:30.
**Mise à jour du 20/10 18:30** : ✅ I127b lumière du visage ; prochain run de code sans diagnostic → I117 préparation
(dictée du soir côté JS) ou I125 « Rien reconnu — me le signaler ? » ; avec le diagnostic → I122 puis I117.
**Mise à jour du 20/10 16:30** : ✅ I127 lectures pondérées ; prochain run de code sans diagnostic → I117 préparation
(dictée du soir, côté JS, dans l'attente de la ligne « Voix ») ou I127b luminance ; avec le diagnostic → I122 puis I117.
**Mise à jour du 20/10 14:30** : ✅ habitudes / effets décalés sur l'humeur estimée ; prochain run de code sans
diagnostic → **I127** (pondération des lectures par leur qualité) ; avec le diagnostic → I122 puis I117 selon `voice`.
**Mise à jour du 20/10 12:30** : ✅ I124 sonde vocale livrée ; prochain run de code sans diagnostic → habitudes
(tags) / effets décalés sur l'humeur estimée, I127 en petit complément ; avec le diagnostic → I122 puis I117 selon
le bloc `voice`.
**Mise à jour du 20/10 10:30** : ✅ I126 duo livré ; prochain run de code sans diagnostic → **I124** sonde vocale, puis
habitudes (tags) / effets décalés sur l'humeur estimée ; I127 (pondération par qualité) en petit complément.
**Mise à jour du 20/10 08:30 (run idées)** : prochain run de code sans diagnostic → **I126** duo de modèles du
visage (désaccord = confiance), puis **I124** sonde vocale, puis habitudes (tags) / effets décalés sur l'humeur
estimée ; I127 en petit complément.
**Mise à jour du 20/10 06:30** : ✅ I123 livré ; prochain run de code sans diagnostic → **I124** sonde vocale (puis
étape 3) ou habitudes (tags) / effets décalés sur l'humeur estimée.
**Mise à jour du 20/10 00:30** : prochain run de code sans diagnostic ni choix de modèle → **I123** « Applis jamais en
veille » (One UI, point (c) du signalement 15:05) ou **I124** sonde vocale ; le run idées de 08:30 fait le comparatif
des modèles valence / éveil (étape 2).

**Réordonnées le 18/10 (22:30 Paris), consigne du 18/10 au soir (charte §00000) — prime sur tout ce qui suit** :
1) 🔴🙂 **bien-être entièrement automatique, seul chantier** : a) lire le diagnostic visage de l'A56 dès qu'il arrive
(`journal/diagnostics/`) ; b) ✅ **I90** import des rafales `face_burst` + test « composition » ; c) ✅ I88 ② notification
« Reprendre » ; d) I89 Shizuku / ADB ; e) I91 voix ; f) temps par app (X) ; g) ✅ I112 porte (19/10 02:30) → I115 estimation du jour ;
h) ✅ I113 note du soir (19/10 06:30). 2) ⏸️ En pause : montre (sauf régression), D1, D2, C7.
**Précision du run idées du 19/10 08:30 (ordre interne du point 1)** : a) diagnostic A56 dès qu'il arrive ;
b) ✅ **I116** temps par app (X) (19/10 12:30) ; c) ✅ **I118** diagnostic des rafales / jour + 2e essai (19/10 14:30) ; d) ✅ 🚑 déverrouillages repérés + I89 caméra (19/10 16:30,
signalement 15:05) — **lire le diagnostic de l'A56 qui suivra la mise à jour avant tout** ; e) **I119** lexiques puis **I117** dictée (voix) ; f) I115 estimation du jour quand la
porte peut s'ouvrir ; g) I120 plus tard.
**Précision du run idées du 19/10 20:30** : a) diagnostic de l'A56 dès qu'il arrive, lu avec l'arbre **I122** ;
b) sinon **I121** porte robuste aux dérives (petit run JS, testable seul) ; c) I123 « Applis jamais en veille » (si le
diagnostic montre un service endormi) ; d) I124 sonde vocale ; e) I115 estimation du jour, **après I121**.

**Réordonnées le 18/10 (16:30 Paris), consigne du 18/10 complétée après la capture de 15:03 (correctif confirmé sur
la montre)** : 1) 🔴 petites corrections montre A.1–A.3 — ✅ **livrées le 18/10 16:30** (A.1 détection des apps : un
seul appel natif `AppManager.installedPackages` + piège du Proxy Capacitor corrigé ; A.2 « Huawei non listé » plus en
avertissement quand le canal classique s'ouvre ; A.3 relectures natives comptées dans « dernière synchro réussie »,
minuteur de 5 min app à l'écran, fenêtre du jour sans trou vérifiée) ; 2) 🙂 **estimation automatique du bien-être**
(I100 ① b — ✅ 18/10 18:30 —, puis **I88** service « Lecture du visage » + rafales + diagnostic, I90, I110 ;
D5, D6) ; 3) 🧹 nettoyage de l'UI ; 4) ⚡ performance.
**Précision du run idées du 18/10 20:30 (ordre interne du point 2)** : a) **I113** note du soir d'un geste depuis la
notification (un run, indépendant du visage, sert tout de suite et accélère la calibration) ; b) **I88** service
« Lecture du visage » **déclenché au déverrouillage** (I114) + diagnostic exportable ; c) **I90** entrées
`face_burst` avec `trigger` + test « composition » (I114) ; d) **I112** porte `gate.js` ; e) I115 affichage.
- [ ] Montre (maintenance, à l'occasion) : l'heure entamée n'est relue qu'à la synchro suivante (fenêtre « jusqu'à
      l'heure pleine », voulue pour ne pas écrire de tranche à moitié ; les pas sont couverts par le total du jour). Si
      utile : écrire les tranches de 10 min de FC / SpO₂ terminées jusqu'à maintenant (clés stables, pas de doublon).
- [ ] Montre : si le propriétaire voit encore « dernière synchro il y a 4 h », lire dans son journal `background`
      (`lastDecision`, `lastTrigger`, `periodic`) pourquoi la relecture native n'a pas tourné (Doze, Samsung, « absent »).

**Réordonnées le 18/10 (12:30 Paris), consigne du propriétaire du 18/10 (charte §0000)** :
1) 🔴 régression montre du 18/10 (✅ livrée 12:30 ; reste la confirmation sur la montre si le propriétaire renvoie
un journal) ; 2) 🙂 **estimation automatique du bien-être : D4 (I100 ① moteur du visage — ① a fait le 18/10 14:30,
suite ① b LiteRT + modèles au build — + I106, I110) et D5**, dans
le respect de D6 ; 3) 🧹 D1 (nettoyage de l'UI, restes) ; 4) ⚡ D2 (performance). La liste numérotée ci-dessous
garde l'historique ; en cas de doute, cet ordre prime.

**Réordonnées le 15/10 (18:30 Paris), consigne du propriétaire « Ça marche côté montre, plus besoin de se
concentrer là-dessus »** : D3 en maintenance → **D1 (nettoyage de l'UI) en tête**, puis D2, D4, D5, D6 ; la montre
seulement sur régression ou journal reçu. Liste réordonnée en conséquence (montre en 6–8).
Avant : réordonnées le 12/10 (22:30 Paris) : priorité absolue = D3 (montre), puis D1 → D6 (sauf D3), hors runs « idées ».
**14/10 12:25, consigne du propriétaire : « Maintenant que ça marche tu peux nettoyer l'UI »** (charte §000) : carte
montre réduite à l'essentiel (fait le 14/10 12:30), puis D1 (nettoyage général), puis D2 (performance).

1. 🧹 D1 — restes (15/10 18:30 : journal du jour et Paramètres faits ; 22:30 : prédiction unique, « Sport le soir »
   déduit ; **16/10 02:30 : Données et Nutrition faites** — profil en 2 lignes, intros fusionnées ; **16/10 04:30 :
   « Repas tardif » déduit + radar sur tags mesurés** ; **16/10 06:30 : Analyses 4 → 3 écrans, méthode repliée sous
   « Comment c'est calculé », une ligne par section** ; **16/10 10:30 : Repas 3 → 2 écrans**, Photo / Galerie / Décrire sur une ligne, aliments à la suite ; **16/10 12:30 :
   Accueil 4 → 3 écrans (aliments à la suite, classe partagée `.inline-list`), avertissement « repas manquants » de
   Nutrition en une phrase qui remplace le compte de repères** ; **16/10 14:30 : Accueil sans doublons** — note de
   bien-être sur une ligne, tuiles « Bien-être » (note unique) et « Cigarettes » retirées du résumé du jour ;
   **17/10 10:30 : « Voyage » déduit du fuseau (I85 ②b)** ; **17/10 12:30 : Analyses — pistes non répétées dans les
   corrélations (« Autres liens ») ; Connecteurs — « Envoie ses données » retiré sous « Reçu »** ; **17/10 14:30 : note de méthode de l'analyse
   avancée — chaque notion dite une fois ; Météo — « Mettre à jour » retiré, « Réessayer » après échec** ; **17/10 16:30 :
   Analyse avancée en mots simples (« Ce qui pèse le plus dans le modèle », « A-t-il vu juste ? »), ligne Paramètres de
   Plus fidèle** ; **17/10 18:30 : saisie bien-être allégée** — pas de modale auto < 3 h après une note, échelle en
   une ligne, « Repéré sans vous : … » ; ligne Données de Plus sans « historique ») : **17/10 22:30 : Repas et Nutrition relus — composition Withings dans « Votre profil », avertissement sans redite, jour à un repas sans total → D1 bouclé** (ne reste qu'à l'occasion) ; Accueil : tuile « Repas » quand un seul repas (redit ses kcal ; gardée pour l'instant, total utile). Fait le 14/10 14:30 : bloc « Votre forme », Connecteurs par statut, `--border`.
2. ⚡ D2 — performance : **I82 livré le 16/10 00:30** (SpO₂ en tranches + migration ; Accueil 1 954 → 546 ms avec 30 j
   de SpO₂ minute) ; **17/10 00:30 : FC repos / VFC lues par sous-type (index v4) — Accueil 706 → 403 ms, 16,2 k → 4,0 k
   enregistrements lus** ; **17/10 04:30 : « Vos derniers jours » ne lit que les 3 jours affichés (14 à la demande, `countEntries`) — 4 016 → 2 190 enregistrements, TBT 114 → 31 ms ; nuit du plus ancien jour corrigée** ; **18/10 00:30 : `WellbeingCharts` ne lit que 14 j + 1 de marge (`since` par index [type, at]),
   anciennes notes seulement comptées (`countEntries({ type })`) — Accueil 1 725 → 644 enregistrements, 259 → 88 ms,
   TBT 20 → 0** ; **18/10 02:30 : `listEntries` avec limite ≤ 1 000 = curseur à rebours (Repas 1 647 → 101 lus) + budget de lectures par page en CI (`scripts/perf/budget.json`, job « Budget de lectures (perf) »)** ; suite : mesure et lectures par index (14/10 00:30), calculs dans un Worker + cache (14/10 04:30),
   **découpage du bundle (14/10 06:30)**, **Nutrition (5 lectures ciblées, 1 253 → 270 ms) et `upsertEntries` par
   index [source, at] (112 → 10 ms pour 336 mesures dans 16 k) le 14/10 16:30** ; reste : budget en CI ✅ (**18/10 04:30 : lectures du Worker des analyses comptées** — ≈ 15,8 k par calcul sur 3 ans de démo ; `heart_rate` lu par sous-type, FC repos / VFC plus évincées par les tranches de 10 min) ; **18/10 06:30 : agrégats journaliers précalculés (store v5 `daily_aggregates`, sommes horaires des pas, calories, FC, SpO₂, marqués à refaire à chaque écriture) — Worker 15,8 k → 11,4 k enregistrements (17,5 k → 11,4 k en dense), pas / calories plus évincés (≈ 4 mois / 1 mois avant)** ; prochain : les autres séries quotidiennes du Worker (≈ 8 k : notes, repas, sommeil, météo, contexte…) ne se relisent qu'en partie — cache des lignes journalières du dataset ? **taille de l'APK, I95 : `abiFilters` arm64 + x86_64 avant toute lib native**), Recommandations : panneau debug seul à lire toute la base (garde-fou).
3. 🙂 D4 — humeur par visage / voix / réseaux sociaux (service caméra de premier plan « niveau 2 », guide Shizuku / ADB) ;
   **spec du pipeline écrite et vérifiée le 17/10 08:30 (`protocoles/visage.md`) → premier code D4 = I100 ①** ;
   **plan vérifié au run idées du 16/10 08:30** : I92 d'abord (petit, D5 — **fait 16/10 16:30**), puis I88 (service + diagnostic, validé
   sur l'A56 avant tout affichage), I90 (indices et tendance 14 j), I89 (test Shizuku / ADB), I91 (voix), I93 ;
   faits du 14/10 : visage = blendshapes MediaPipe par défaut (AUC visage ≈ 0,6 → tendance 7 j), voix = prosodie
   maison (I67), réseaux sociaux = temps au premier plan par app seulement ; sur Android 15+, « paramètres restreints »
   bloque aussi l'accès aux données d'utilisation des APK hors magasin → le guide doit l'expliquer.
4. 🔁 D5 — **16/10 16:30 : I92 + I84 livrés** (`ESTIMATOR_INPUTS`, test anti-circularité, « Stress » côté Y,
   `moodEstimate.js` supprimé, calibration gardée dans `mood/calibration.js`). **16/10 22:30 : ordre temporel livré**
   (un jour noté avant 20 h, seuls pas / séances / calories / FC / cigarettes / écran d'avant la note comptent, analyses
   simple et avancée). Reste : repas d'après la note (aujourd'hui lissés sur 10 j), prédiction du jour, taille minimale,
   garde-fous visibles (I46) ; le stress
   physiologique de la montre (I76) sera un facteur.
5. 🧭 D6 — pistes et messages neutres / personnels. **16/10 18:30 : fait pour les pistes** — `leverSuggestion`
   suit le signe personnel (simples, décalées, avancées), piste contraire montrée « Ne pas chercher à … » +
   « Contraire à l'hypothèse générale : chez vous, vos données font foi » ; jamais plus d'alcool / tabac.
   **17/10 06:30 : Radar forme et cartes FC / VFC neutres (I97 ①)**. **18/10 10:30 : I108 livré (pistes « Chez vous » / « À vérifier », une seule fragile) ; puis I102 écrit directement avec l'a priori spike-and-slab d'I107** (I102 seul : ≥ 1 faux sens sur 40 facteurs dans 58 % des jeux à 120 j). Reste : sens personnel du radar (I97 ② → **I102 + I107**, puis I103–I105, I109),
   régularité du sommeil, prédiction, repères Nutrition ; `direction` en a priori faible chiffré (shrinkage).
6. ⌚ **D3 — VÉRIFIER QUE DE VRAIES MESURES ARRIVENT (v125+)**. Journal v124 (14/10 10:22) : montre **associée**
   ✅, mais 0 mesure (fenêtre 10:00 → 10:00, totaux non stockés ; `diagnostics/2026-10-14-1022-gt6pro-v124.md`).
   Livré le 14/10 12:30 : première synchro depuis 2000, reprise sur la dernière synchro avec données − 6 h, état v2,
   totaux du jour stockés, journal détaillé (`sync.kinds`, types de sommeil, mesures par minute). Prochain journal : lire
   `sync.kinds`, « minutes : N reçues… », types de sommeil ≠ 6 / 7. **Priorité absolue close quand des mesures
   apparaissent dans l'historique.**
7. ⌚ **Lire chaque nouveau journal du propriétaire** dès qu'il arrive (`journal/diagnostics/`). I63 (erreurs typées
   des étapes 0x8002 → 0x13) devient secondaire : l'appairage passe. **I69 ✅ livré (run 14/10 22:30)** (run idées
   14/10 20:30, score 25) — journal de synchro par service (réponse / vide / délai / non pris en charge), séances lues
   selon la longueur de chaque bloc (#5784), 0x2C expiré = piste du canal RFCOMM auxiliaire (#6448, à ne coder qu'au
   vu du journal), « stress : à activer sur la montre » ; texte du plan B « 16 à 19 chiffres ». Livré : `report.sync.services`
   (issue par lecture, sans valeur), `hints`, lecture qui continue après un service muet, bloc / séance / minute
   illisible sauté, état « sans réponse pour : … » sur la carte, plan B « 15 à 20 chiffres » (= `normalizeAccountId`).
   Reste d'I69 : « stress à activer » quand HealthTrack lira le stress (pas encore lu). Compte Huawei **non
   requis** pour une montre jamais liée (#6271) : question close.
8. ⌚ **D3 (d quater)** arrière-plan app fermée, selon le plan I49 précisé par **I72** (présence compagnon :
   `onDevicePresenceEvent` API 36 / `onDeviceAppeared` API 33–35, service `connectedDevice` court à `BT_CONNECTED`,
   `REQUEST_COMPANION_START_FOREGROUND_SERVICES_FROM_BACKGROUND`, jamais de boucle) + client Java, filet WorkManager.
   **Complété par I75 (run idées 15/10 08:30)** : la présence compagnon ne se déclenche qu'à la connexion du **lien
   Bluetooth système**, rien si aucune app ne l'ouvre → deuxième déclencheur au **déverrouillage** (récepteur dynamique
   dans un service actif, comme Gadgetbridge) + filet périodique ~2 h ; relancer la connexion si Android redémarre le
   service sans intent (#6869). Reste de (d bis) précisé par **I76** : stress = fichier 0x2C type 0x10 (`files.js` sait
   déjà télécharger), VFC de journée = dictionnaire 500044 (§7.11) ; phases du sommeil et VFC de la nuit déjà lues. (d) livré le
   13/10 04:30, (d ter) le 13/10 06:30, (d bis) capacités / séances / sommeil détaillé le 13/10 10:30 ; reste de
   (d bis) : stress, VFC de journée, échantillons de séance. **À ne traiter qu'une fois l'appairage réel débloqué.**
   **État au 15/10 12:30** : client Java complet et **lancé tout seul à la reconnexion de la montre app tuée** (③ a–e) ;
   reste ③ f (déverrouillage + filet ~2 h + notification clé refusée), puis le guide One UI (I50).
   **État au 15/10 14:30** : ③ f livré (déverrouillage, filet JobScheduler ~2 h, notification, état natif dans le
   journal) ; reste la validation sur l'A56, le guide One UI (I50), ③ g, puis I76 (stress, VFC de journée).
   **État au 15/10 16:30** : ③ g livré (app en arrière-plan → natif, liaison unique) ; reste la validation sur l'A56,
   le guide One UI (I50, si rien en 24 h), puis I76 (stress, VFC de journée) et les séances automatiques (#5784).
9. Ensuite seulement : **briefing du jour unique** (I47 → I51, gabarits, jamais de chiffre inventé), **mode calme**
   (I52, tendances 7 / 30 j), une question du soir (I54), réception BLE automatique, Colmi (I28).
10. Nouvelles idées du run 13/10 20:30 (toutes **sans nouvel écran**) : **I58** « Ma nuit en un coup d'œil » absorbé par
    le briefing I51 (signaux de la nuit vs votre plage habituelle, à la Samsung Vitals) ; **I60** traitements /
    compléments = expériences avant / après ; **I59** import d'analyses (OCR sur l'appareil) ; **I62** bruit ambiant
    comme X ; **I61** pilote Omi direct (BLE MIT documenté) + transcription locale — après D4.
11. Nouvelles idées du run 14/10 08:30 (toutes **sans nouvel écran**) : **I64** paliers de confiance bayésiens
    (« piste / probable / solide ») à la place des p-valeurs, avec contrôle des faux positifs — à faire **avec D5** ;
    **I65** contexte détecté tout seul (« Voyage » par changement de fuseau, « Sport le soir », « Sieste ») — à faire
    **avec les restes de D1** (remplace l'item « tags auto-détectés ») ; **I67** voix = prosodie maison (pas de modèle
    d'émotion vocale : licences NC) + transcription système → repli Vosk small-fr — **dans D4** ; **I66** (absorbé
    par I60) comportements suivis en une phrase + plan ABAB ; **I68** export FIT / CSV par type. Idée **écartée** :
    deviner « alcool / caféine » d'après la FC / VFC de la nuit (circulaire, D5).
12. Nouvelles idées du run 14/10 20:30 (toutes **sans nouvel écran**) : **I69** synchro qui dit où elle cale (→ n°2) ;
    **I70** force et confiance séparées (fusionne I64, **avec D5**) — HealthTrack corrige déjà tests multiples et
    autocorrélation, ce qu'Exist / Bearable ne font pas : le rendre lisible ; **I71** un seul parcours par jour (précise
    I51 / I54, n°9) ; **I72** arrière-plan par présence (→ n°3) ; **I73** visage **sans poids AffectNet** (licence non
    commerciale ; MediaPipe blendshapes, **dans D4**) ; **I74** phrase du soir à la voix, tags toujours confirmés
    (**dans D4**). Fait D4 confirmé (doc Android 01/10/2026) : service caméra / micro impossible à créer depuis
    l'arrière-plan sur Android 14+, exemptions comprises ; rien ne montre que `appops` le contourne.
13. Nouvelles idées du run 15/10 08:30 (toutes **sans nouvel écran**) : **I75** deux déclencheurs pour la synchro
    app fermée (→ n°3, score 20) ; **I78** réseaux sociaux = X, décidé (→ D4 / D5, score 20) ; **I76** stress et VFC de
    journée (→ n°3, 16) ; **I79** bilan du mois automatique dans le parcours du matin (avec I71, 16) ; **I80** rien
    d'imposé à l'écran : cartes d'interprétation masquables, état de synchro honnête par source (leçon Samsung Health
    7.0, 12) ; **I77** empreintes Huawei Link verrouillées par des tests + repli UUID SDP Honor (10, petit) ; **I81**
    lieux étiquetés comme X (9). Faits : poids **MediaPipe Face Landmarker sous Apache-2.0** (I73 débloquée) ; pas de
    modèle d'émotion vocale redistribuable et utile (I67 confirmée) ; ML Kit GenAI Speech encore alpha.
14. 💡 Prochain run idées (18/10 08:30 Paris) : combien de X tester sans noyer les vrais liens (BH ou 97,5 % par
    variable, simuler 15 X dont 2 vrais) ; auto-expériences ABAB (I45) avec I102 ; voix (I91) en 2026. **Fait au run
    17/10 20:30** : sens personnel avec peu de jours → I102–I105 (simulation `protocoles/sens-personnel-sim.py`),
    images test PD-USGov (I106), chemin One UI 8 pour I96. **Fait au run 17/10 08:30** : spec `protocoles/visage.md`
    vérifiée par un prototype (I98–I101). **Fait au run 16/10 20:30** :
    taille et télémétrie (I94, I95), Samsung (I96), Bearable / Exist (→ I70 confirmé, I97). Ancien :
    (15/10 20:30 Paris) : journal v125+ s'il arrive ; la GT 6 Pro rétablit-elle seule le lien
    Bluetooth système (condition d'I75) ; entrées du fichier stress (RRI) et dictionnaire VFC 500044 pour §7.11 bis ; comptes rendus de
    labo français.

- [ ] **MONTRE-SCORE (I200, basse priorité, après le polissage)** — afficher dans les détails de l'écran Montre et
  de Journal → Jours le score de sommeil (déjà dans l'écran Montre) et la FC de la nuit déjà gardés ; latence
  seulement une fois son unité confirmée (`watchSummary`, brut) ; source
  « montre » ; jamais une entrée du bien-être (D5). Test : une nuit synthétique avec résumé → ligne présente ; sans
  résumé → rien.
- [ ] **MONTRE-ALT (I199, à la demande)** — dénivelé positif du jour depuis la classe P2P 200003 (même canal que la
  VFC de journée, réels 4/8 octets déjà décodés) ; seulement si le propriétaire envoie sa journée de comparaison.

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
- [x] CI : test émulateur API 36 `HealthConnectTest.healthConnect_canWriteAndReadSleep` instable (« Conflict found, but couldn't read the entry », encore rouge sur main #344 le 25/10) → **rendu robuste le 25/10** : insertion réessayée deux fois sur ce seul message, la relecture juge.
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

- [x] 2026-10-24 — CI : envoi Google Play (AAB et fiche) réessayé automatiquement sur 429/5xx (`withRetry`), après l'échec de la v394 sur un 503 passager de Google (run 03:30 Paris)
- [x] 2026-10-17 — D1 : saisie bien-être allégée (pas de modale auto < 3 h après une note, échelle en une ligne, « Repéré sans vous : … »), ligne Données de Plus fidèle ; PR #197 fusionnée en début de run (run 18:30 Paris)
- [x] 2026-10-17 — D1 : Analyse avancée en mots simples (titres, fiabilité), légende des barres « le plus influent = 100 % » dite une fois ; Plus : ligne Paramètres fidèle ; PR #196 du run 14:30 fusionnée (run 16:30 Paris)
- [x] 2026-10-17 — D1 : I85 ②b « Voyage » déduit des changements de fuseau horaire (entrée `context` par jour, saisie, Analyses, Radar) (run 10:30 Paris)
- [x] 2026-10-17 — Run « idées » 08:30 : pipeline visage reproduit sur LiteRT seul et comparé à MediaPipe (0,78 px,
      blendshapes 0,009) → spec `protocoles/visage.md` + prototype ; capture 320 × 240 suffisante ; indices par unités
      d'action → I98–I101
- [x] 2026-10-16 — Run « idées » 20:30 : bibliothèques du visage mesurées (MediaPipe / ML Kit / LiteRT : taille,
      télémétrie sans option chez Google) → **I94 LiteRT seul** ; modèles exécutés ≈ 10 ms / image ; I95 APK maigre,
      I96 arrière-plan en un geste (Samsung), I97 Radar neutre
- [x] 2026-10-16 — Run « idées » 08:30 : plan D4 vérifié sur Android (règles FGS caméra / micro, `appops` lu dans AOSP,
      partage du micro) + leçons Emobot (préprint 12/2025) et FacePsy → I88–I93 ; I92 placé en tête de D5
- [x] 2026-10-16 — D1 : Repas 3 → 2 écrans — Photo / Galerie / Décrire sur une ligne, intro et aide « sur mobile » retirées, aliments d'un repas à la suite (run 10:30 Paris)
- [x] 2026-10-16 — D1 : Analyses 4 → 3 écrans, méthode sous « Comment c'est calculé », une ligne par section, onglet avancé replié (PR #180 → v142, run 06:30 Paris)
- [x] 2026-10-16 — D1 : I85 ②a « Repas tardif » déduit des repas notés (saisie, Analyses) ; Radar forme lit séances du soir et repas tardifs (PR #178 → v141, run 04:30 Paris)
- [x] 2026-10-16 — D2 / I82 : SpO₂ de la montre en tranches de 10 min + migration unique (et après import) ; Accueil 1 954 → 546 ms, 107 k → 12,5 k enregistrements lus (30 j de SpO₂ minute) ; `npm run perf -- --spo2=minute|slot` (run 00:30 Paris)
- [x] 2026-10-15 — D1 : « Prédiction du jour » en une ligne sous la courbe, hypothèse sommeil repliée (I87) ; I85 ① « Sport le soir » déduit des séances (saisie, Analyses) (PR #173 → v138, run 22:30 Paris)
- [x] 2026-10-15 — Run « idées » 20:30 : I82–I87 (SpO₂ en tranches, stress ressenti côté Y, check-in réduit, courbes
      MinMaxLTTB, donnée avant interprétation, « Pas pertinent ») ; I80 absorbée par I86 ; I48 précisée (parcours avancé)
- [x] 2026-10-15 — (PR #170 → v137) Charte : D3 en maintenance (consigne du 15/10), D1 en tête ; D1 : cigarettes du jour sur une ligne, « Écran tard » mesuré non répété, Paramètres allégés ; test App instable corrigé (`useLayoutEffect`) (run 18:30 Paris)

- [x] 2026-10-15 — D3 (d quater ③ c) : clé de la montre confiée au coffre natif (Keystore Android) après chaque connexion réussie, retirée si refusée (8 tests JUnit, 7 Vitest) (run 06:30 Paris)
- [x] 2026-10-15 — D3 (d quater ③ a) : cœur Java du client « synchro seule », identique au pilote JS (vecteurs communs, 13 tests JUnit, job CI) (run 02:30 Paris)
- [x] 2026-10-14 — D3 (d quinquies) : fenêtre de synchro jamais vide (1re depuis 2000, reprise − 6 h), totaux du jour stockés, carte montre simplifiée (état + « Synchroniser », « Diagnostic » replié) (run 12:30 Paris)
- [x] 2026-10-14 — D1 : Connecteurs ordonnés par statut (actif en tête, « Brancher une autre source » replié), pastilles masquées si désactivé, accueil « Votre forme » (1 titre, 1 explication), `--border` défini (run 14:30 Paris)
- [x] 2026-10-13 — D3 (a quater) : l'instrument de diagnostic donne la **taille** de chaque champ de la réponse « New Auth » (octets / caractères / type, jamais la valeur) → décoder d'un seul journal ; écran « challenge (16 o), epk (32 o)… » (run 18:30 Paris)
- [x] 2026-10-13 — D3 (c bis) : primitives crypto « New Auth » X25519 / Ed25519 sur @noble/curves, vecteurs RFC 7748 / 8032 (run 16:30 Paris)
- [x] 2026-10-13 — D3 (a ter) : l'instrument révèle les **champs** d'une réponse « New Auth » non-JSON (noms, sans valeur) ; spec §6.8 (run 14:30 Paris)
- [x] 2026-10-13 — D3 (d ter) : resynchro automatique de la montre à l'ouverture / au retour dans l'app (≤ 30 min, essais espacés, pause sur clé refusée), ligne d'état (run 06:30 Paris)
- [x] 2026-10-13 — D3 (d) : synchronisation simple (heure, sommeil léger / profond, minutes → pas, calories, FC, SpO₂, FC repos) → IndexedDB, « Synchroniser la montre » (run 06:30 Paris)
- [x] 2026-10-13 — D3 (c) : authentification HiChain (liaison par PIN, authentification, trames chiffrées), encadré « Connexion à la montre », constantes du PIN téléchargées sur le téléphone (run 02:30 Paris)
- [x] 2026-10-13 — D3 (b) : assistant « Libérer et appairer la montre » (désinstallation / réglages de l'app qui la tient, réinitialisation guidée, plan B compte Huawei, appairage Android `createBond`) (run 00:30 Paris)
- [x] 2026-10-12 — Priorité absolue « montre » reportée (charte §000, backlog) + D3 (a) : test de connexion directe à la montre Huawei (RFCOMM + BLE), journal exportable, spécification `protocoles/huawei.md` (run 22:30 Paris)
- [x] 2026-10-12 — Directives du 12/10 reportées (charte §00, chantiers D1–D6) + nettoyage, étape 1 : « Écran tard » mesuré plus demandé, « Humeur estimée » retirée, doublons Paramètres, « Mode diagnostic », titre « Analyses » (run 16:30 Paris)
- [x] 2026-10-12 — « Qui envoie quoi » dans Mes appareils (mesure arrêtée signalée, mesures jamais reçues) + Radar expliqué par les tags de la veille, tags Voyage / Vaccin (run 10:30 Paris)
- [x] 2026-10-12 — Run idées : 17 nouvelles idées (I22–I38) dans `IDEES.md`, backlog réorienté (Radar expliqué, « qui envoie quoi », sommeil par le téléphone, plage habituelle, briefing du matin) (run 08:30 Paris)
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

# Backlog — Halcya sur iOS

> Un run = une étape testable et mergeable. L'ordre peut s'adapter, mais deux règles ne bougent pas : HealthTrack
> (Android) reste en lecture seule, et les livraisons Android sont reportées dans `PARITE.md` à chaque run, même
> pendant le rattrapage.

## Prochaines étapes

> **13/11, dépôt unique** : ce backlog est désormais tenu par la routine unique. « HealthTrack reste en lecture
> seule » n'a plus cours : le code partagé (`app/`, `relay/`) se corrige dans la même PR. Suite de la fusion :
> FUSION-2 à FUSION-5 dans `journal/BACKLOG.md` ; les demandes de l'ancien `DEMANDES.md` encore ouvertes y sont
> reprises (DEM-IOS-1 à 21).
> Suivi d'Android au 13/11 22:35 : v1030 (correctif 58 refait après CYCLE-3a-1, #948).

- [x] **I0 — Mise en place** (27/10, session de configuration avec le propriétaire) : dépôt `HealthTrack-iOS`
  public, charte, parité de départ, `upstream.json` + `scripts/upstream.sh` (testé : récupère Android v514, applique
  les correctifs, échoue clairement si l'un ne s'applique plus).
- [x] **I1 — Socle iOS sur simulateur** (27/10, PR #1 et #2)
  - [x] Variante `appstore` (27/10) : correctif de `app/src/config/distribution.js` (comme play : relais IA, pas
    d'auto-mise à jour, abonnement App Store) ; les tests d'Android passent avec le correctif.
  - [x] `@capacitor/ios` 8.2 installé par le workflow (`npm install --no-save`, pas de correctif de `package.json`),
    `cap add ios` (CLI 8 via `npx -p`) → projet dans `ios/` (Swift Package Manager), bundle id `fr.jpesquet.sante`,
    nom « Halcya », icône et écran de démarrage générés depuis le glyphe d'Android (27/10).
  - [x] Version : `MARKETING_VERSION` = `versionCode` de `upstream.json`, `CURRENT_PROJECT_VERSION` =
    `<versionCode>.<commits de ce dépôt>`, passés à `xcodebuild` par le workflow (27/10).
  - [x] Workflow `ios-build.yml` (PR, push `main`, `workflow_dispatch`) : `scripts/upstream.sh`, `npm ci`, tests
    d'Android avec les correctifs, build web (`VITE_DISTRIBUTION=appstore`), `cap sync ios`, `xcodebuild` pour le
    simulateur sans signature, `concurrency` qui annule les runs dépassés (27/10).
  - [x] Captures (27/10) : deux simulateurs (390 × 844 points comme l'iPhone 12 de test, et un récent), 14 pages avec
    les données de démo d'Android en clair, 3 en sombre, onboarding d'une installation vierge ; parcours piloté par
    l'app (`captureMode.js`), synchronisé par fichier (`Documents/capture/ready.txt` → capture → `ack.txt`) : les 36
    images de la PR #2 correspondent à leur page ; poussées sur la branche `captures/pr-<n>` ou `captures/main`.
  - [x] États vides de chaque page (29/10, PR #64, mergée) : 8 pages capturées onboarding fini et base vide
    (`vide-*`, `EMPTY_ROUTES`), entre l'onboarding et les données de démo ; regardées sur les deux iPhone simulés :
    textes justes sur iPhone (app Santé, lecture du visage dans Sources), aucune carte cassée.
  - [x] Faire échouer la build sur erreur JavaScript (29/10, PR #63, mergée : 0 ligne sur les 10 dernières CI ;
    étape finale bloquante, promesses rejetées sans traitement comptées en mode captures ; 0 sur sa CI aussi).
- [ ] **I2 — Audit de parité et replis propres** (déjà repérés le 27/10 : texte Premium « Google Play », détection
  des apps par noms de paquets Android, carte « Lecture du visage » en erreur — traités dans la PR #3 avec « Vos
  données », « Mes appareils », montre Huawei, temps d'écran et les phrases d'usage Bluetooth et Santé
  d'`Info.plist` ; carte Santé, Sources et onboarding sans Health Connect ni montre
  Huawei en direct, sauvegarde et rapport PDF par la feuille de partage, huit services à plugin Android absent qui
  retombent proprement : PR #4, mergée le 27/10 ;
  restent, dans l'ordre : « Vos sources » qui conseille Health Connect
  dans Gadgetbridge (→ guide des montres réécrit, sous I4) ; captures défilées pour les pages longues : faites, PR #5) : compléter `PARITE.md` fonction par fonction (changelog depuis le
  lancement play, `journal/PRODUIT.md`, écrans) ; sur iOS, chaque service qui appelle un plugin Android absent
  retombe proprement (pas d'erreur, pas de carte cassée, pas d'interrupteur qui ne fait rien) ; % de parité.
  - [x] Audit automatique des textes (29/10, PR #70 puis #71) : chaque page capturée est relue (`androidWords`,
    `pageText`) ; les mots propres à Android (Health Connect, Google Play, Play Store, Android, Gadgetbridge, Samsung
    Health, temps d'écran) sont listés dans `texte-android.txt`. Première liste (#70) : « temps d'écran » seulement,
    dans la carte qui dit « Pas encore disponible sur iPhone » (juste, mise à part par `IPHONE_OK`) ; étape de CI
    bloquante depuis #71.
  - [x] Démo de l'iPhone fidèle à l'app Santé (30/10, PR #88) : la VFC de la démo est en SDNN
    (`heartRateVariabilitySdnn`), comme celle de l'app Santé ; elle a révélé la tuile VFC vide de l'Accueil (I4).
    Captures de la fiche à refaire avant la soumission (Journal et Accueil changent).
  - [x] Captures de la fiche refaites le 30/10 (`captures/store`, Android v597) et regardées : 8 captures propres, barre
    d'état à 9:41, sans la bannière système « Prêt pour Apple Intelligence » vue une fois sur une capture de PR (#73) ;
    à revérifier à chaque nouvelle prise (aucun réglage `simctl` documenté pour l'empêcher).
  - [x] Rapport PDF pour le médecin essayé à chaque build (29/10, PR #51, mergée) : PDF créé et feuille de partage
    ouverte sur les deux iPhone simulés ; l'enregistrement dans Fichiers par le test d'interface (feuille dépliée)
    est à confirmer sur la CI de #52.
  - [x] Nouveautés de l'iPhone à partir du premier TestFlight (30/10, PR #97) : `APPSTORE_CHANGELOG_SINCE` =
    2026-10-30-2100, note « Halcya arrive sur iPhone » (`variants: ["appstore"]`, correctif 33 pour le test d'Android).
- [ ] **I3 — Données** : durabilité d'IndexedDB dans WKWebView (27/10 : non durable d'après Capacitor et WebKit,
  plan dans `RECHERCHE.md` : `persist()`, instantané automatique en fichier natif, restauration proposée si la base
  est vide ; 27/10 : copie de secours automatique, PR #6), sauvegarde iCloud, export / import JSON par la feuille
  de partage (y compris d'un téléphone Android vers un iPhone), secrets dans le Trousseau (ThisDeviceOnly).
  - [x] Aller-retour des données vérifié en capture (PR #29, mergée le 28/10) : 1924 mesures exportées, écrites dans
    un fichier, relues, réimportées sans doublon sur les deux iPhone simulés.
  - [x] Sauvegarde du téléphone mesurée (PR #30, mergée le 28/10) : `BackupMarker` en Swift (repère hors
    sauvegarde, lu par `restoreGuard.js` : `restored: false`) ; sonde Debug `CaptureProbe` : **WebKit exclut la base
    IndexedDB de la sauvegarde iCloud**, Documents (copie de secours) est sauvegardé.
  - [x] « Supprimer toutes mes données » efface aussi la copie de secours (correctif 22, PR #31, mergée le 28/10 ;
    elle gardait toutes les entrées et le profil, et partait dans la sauvegarde iCloud) ; sonde `[suppression]` :
    `après {"entries":1925,"count":0,"copie":false}` sur les deux iPhone simulés.
  - [x] Après une restauration (base vide, copie présente) : la copie proposée d'emblée au premier écran de
    l'onboarding (PR #32, mergée le 28/10 : `SnapshotWelcome`, correctif 23 ; « Reprendre » rend les 1925 mesures sur
    les deux iPhone simulés, captures regardées).
  - [x] Réglages dans la copie de secours (PR #38, intégrée à #37) : thème, note du soir, bilan du ventre, météo ;
    jamais un secret, un état propre au téléphone ni le consentement à l'IA.
  - [ ] Identifiant d'installation (crédits IA) après une restauration iCloud : sur Android, il revient avec la
    sauvegarde ; sur iPhone, l'app en crée un neuf. Le garder dans la copie (visible dans Fichiers) ou laisser le
    relais en décider (App Attest, I6) : à trancher. Plan (28/10 11:40) : **dans l'onboarding, au premier écran**, pas à l'Accueil. Après une
    restauration iCloud ou un effacement par iOS, le localStorage est perdu lui aussi, donc l'onboarding revient.
    À l'Accueil, la synchro Santé autorisée pendant l'onboarding remplirait la base avant l'offre (« base vide »
    serait faux). Carte « Reprendre vos données ? Copie de secours du … (n mesures) » [Reprendre mes données]
    [Commencer sans] → `importFromJson` en fusion (entrées et profil), puis l'onboarding continue (autorisations à
    redonner sur un nouveau téléphone). Correctif minimal d'`Onboarding.jsx` (une ligne au-dessus de `GoalStep`),
    composant dans `overlay/app/src/ios/`. Capture : une étape du plan qui vide la base (`deleteAllEntries`, sans
    toucher la copie), remet l'onboarding à zéro et ouvre `/bienvenue`, puis la sonde touche « Reprendre » et
    compte.
  - [x] Import par le sélecteur de fichiers d'un ancien fichier (tableau nu), geste réel — PR #34, mergée le 28/10
    (sonde `[import]` : 1926 → 1928 ; test d'interface `DonneesUITests` : Explorer › Sur mon iPhone › Halcya).
  - [x] Export par la feuille de partage, geste réel (PR #37) : « Enregistrer dans Fichiers », 2 fichiers sur les
    deux iPhone simulés.
  - [ ] Gestes réels, suite : puis export par la feuille de partage ;
    fichier exporté d'Android réimporté sur iPhone (même format, déjà couvert par l'aller-retour de #29 ; 30/10 : code
    d'import identique, mesures Health Connect d'Android étiquetées « App Santé » sur iPhone, voir `PARITE.md`).
- [ ] **I4 — Santé (HealthKit)** par `@capgo/capacitor-health` (déjà une dépendance d'Android ; 27/10 : code iOS
  vérifié, mêmes méthodes et types que le connecteur ; **VFC en SDNN sur iOS contre RMSSD sur Android**, à ne pas
  mélanger ; voir `RECHERCHE.md`. 27/10 : **HealthKit marche sur simulateur sans compte Apple** (build signée à la
  volée, feuille d'autorisation capturée, PR #7) : I4 peut avancer avant A1) :
  mêmes types que Health Connect, historique, autorisations au bon moment avec divulgation.
  - [~] Connecteur sur HealthKit (PR #9) : disponibilité de HealthKit, « accordé » une fois la demande faite (HealthKit
    ne révèle pas la lecture), VFC ni demandée ni lue, textes iPhone (carte de Sources, onboarding, divulgation).
  - [ ] Vérifier l'import réel : sonde d'écriture et de relecture (PR #11, mergée ; `idb` écarté : dépôt Homebrew
    tiers non approuvé) ; feuille acceptée par un test d'interface XCUITest du dépôt (`uitests/`, PR #12, mergée :
    1234 pas écrits puis relus sur les deux iPhone simulés) ; pas relus par le connecteur de l'app (PR #15 : vu sur
    l'iPhone 16e, toucher du test fiabilisé ; mergée, vu sur les deux iPhone) ; ensuite les montrer dans le Journal
    (30/10, PR #77 : la sonde ouvre le Journal après la synchronisation, y cherche « 1 234 » pas, `[healthkit] journal`,
    capture `healthkit-journal`) ; à refaire sur l'iPhone 12.
  - [x] Textes Santé sur iPhone : source « App Santé » des mesures importées (Journal, tuiles, rapport), résumé du
    premier import, confirmation de suppression (PR #13, mergée le 28/10).
  - [x] Guide « Votre montre n'apparaît pas ? » réécrit pour l'iPhone (Health Connect, Gadgetbridge et Bluetooth
    direct n'y ont pas cours) : Apple Watch, Huawei Health, Mi Fitness et Zepp, Garmin, autres marques, Galaxy
    Watch récentes incompatibles ; recherche du 27/10 (`RECHERCHE.md`) ; PR #14, mergée le 27/10. Menus de Huawei
    Health, Zepp et Garmin Connect à confirmer sur l'iPhone 12.
  - [~] VFC SDNN : type ou source à part, libellé, norme personnelle distincte de la RMSSD ; puis la lire. Plan
    (27/10) : sur iPhone, le connecteur lit la VFC et la range sous un **type d'entrée à part** (pas `heart_rate` :
    `dailyJournal.js` range une sous-catégorie inconnue de `heart_rate` dans la fréquence cardiaque, elle s'y
    mélangerait) ; vérifier que les 29 lectures de `heartRateVariability` et chaque `switch` sur le type ignorent ce
    nouveau type ; l'afficher « VFC (SDNN) » dans le Journal ; norme personnelle SDNN ensuite. 27/10 23:10 :
    `analysisEngine.js` et `dailyAggregates.js` testent chaque sous-catégorie de `heart_rate` ; seul
    `dailyJournal.js` tombe par défaut dans la fréquence cardiaque → une sous-catégorie à part
    (`heartRateVariabilitySdnn`) plus un correctif de `dailyJournal.js` suffiraient. 28/10 : fait ainsi (PR #16, mergée :
    correctifs 08 et 13 refaits, 17 ajouté ; pastille « VFC (SDNN) » ; sonde qui écrit 48 ms et vérifie la
    sous-catégorie). « Mes appareils » compte la VFC SDNN (correctif 19, PR #25). Norme personnelle SDNN prête
    (correctif 20, PR #26) ; radar avec la VFC SDNN prêt (correctif 21, branche `claude/ios-i4-radar-sdnn`, PR après #26).
  - [x] Simulateurs en français pour les captures (PR #9).
  - [~] VFC de l'app Santé (SDNN) partout où Android montre la VFC (30/10) : Journal (correctif 17), normes et Radar
    (20, 21), **Accueil** (tuile « VFC (SDNN) », correctif 30, PR #88), **Analyses** (variable à part
    `hrv_sdnn_ms`, « Variabilité cardiaque (SDNN) ») et **résumé du premier import** (correctif 32, PR #91) ; à
    revoir sur l'iPhone 12 avec une vraie Apple Watch (fréquence des mesures SDNN, jour et nuit mêlés).
- [ ] **I5 — Notifications** : bilan du ventre du soir, note du soir, rappel de portion, rappel de fin d'essai ;
  actions dans la notification, réponse rangée à l'ouverture suivante.
  - [x] Règles du soir en Swift, testées par XCTest (`ios/HalcyaRules`, PR #18, mergée) : soirs programmés d'avance (iOS ne
    réveille pas l'app pour décider), geste après minuit rattaché au soir demandé.
  - [x] Plugin `GutEvening` en Swift (`configure`, `status`, `list`, `remove`, `requestNotifications`, PR #20), branché par une
    sous-classe de `CAPBridgeViewController` ; catégorie à actions Calme / Gêne / Douleur sans ouvrir l'app ; retirer
    `GutEvening` de `missingOnIos` ; capture de la notification.
  - [~] Sur simulateur (PR #21) : autorisation accordée et notification affichée dans le centre de notifications ✅ ;
    réponse « Gêne » depuis la bannière dépliée, rangée sans ouvrir l'app ✅ sur les deux iPhone simulés (PR #23,
    mergée) ; reste : import à l'ouverture suivante vérifié, geste réel sur l'iPhone 12 après A1.
  - [x] `EveningNote` en Swift (PR #24, mergée) : plugin, boîte commune avec le ventre (`EveningStore`), tests
    XCTest ; sur les deux iPhone simulés, les 6 notes s'affichent dans la notification dépliée et « 4 » est rangé
    sans ouvrir l'app.
  - [x] `PortionReminder` en Swift (PR #24, mergée) : rappels restants programmés d'avance ; bannière touchée app
    en arrière-plan → la réintroduction s'ouvre (le natif signale le toucher, transmis par iOS après le retour au
    premier plan : correctif 18) ; vérifié sur les deux iPhone simulés.
  - [x] Import des réponses à l'ouverture suivante vérifié en capture : bilan du ventre (PR #25 : inserted 1,
    boîte vide), note du soir (PR #26 : inserted 1, boîte vide), toujours vrai à chaque CI depuis ; gestes sur
    l'iPhone 12 après A1.
- [ ] **I6 — Abonnement et relais** — **décision du 31/10 (propriétaire et routine Android) : deux formules, Silver
  et Gold.** Gold à 10 €/mois, plus de crédits et la meilleure analyse des repas (dernier Gemini Flash en Europe) ;
  Silver avec le dernier Gemini Flash-Lite en Europe (prix et crédits à fixer). Le modèle n'est jamais nommé à
  l'utilisateur ; on met en avant que **Gold fait moins d'erreurs sur la reconnaissance des aliments et l'estimation
  des quantités**. Bêta-testeurs et propriétaire en Gold par défaut. Sur iPhone : un groupe d'abonnements « Halcya »,
  Gold au niveau le plus haut et Silver en dessous (Apple gère montée et descente, sans double facturation),
  identifiants `halcya_gold_mensuel` (et `halcya_gold_annuel` si décidé) et, pour Silver, `halcya_premium_annuel` /
  `halcya_premium_mensuel` comme le produit Silver d'Android et le plugin déjà écrit (1/11 : le brouillon
  `halcya_silver_mensuel` est abandonné) ; Silver à 4,99 €/mois ou 29,99 €/an, essai de 14 jours sur l'annuel ; offre
  Gold proposée par Android le 1/11 (P35 : mensuel seul, annuel à 79,99 € plus tard, pas d'essai), en attente du
  propriétaire ; textes préparés dans `store/app-store/abonnements.md` ; demande au relais dans `DEMANDES.md`. Le plan d'origine ci-dessous reste vrai
  pour la mécanique (StoreKit 2, `AppStoreBilling`, vérification par le relais), à adapter aux deux formules.
  Ancien libellé : StoreKit 2 (plugin Swift dans `ios/`), mêmes formules (annuel mis en avant,
  mensuel, essai 14 jours), prix lus dans StoreKit ; côté relais (dans HealthTrack → `DEMANDES.md`) : vérification des
  transactions signées par Apple, notifications serveur V2, App Attest, mêmes crédits IA, même période de lancement.
  Plan (28/10 12:25, après lecture de `playBilling.js`, `entitlement.js`, `distribution.js` d'Android v553) :
  - Natif : plugin Swift `AppStoreBilling` (StoreKit 2) qui rend **la même forme que `PlayBilling`**, pour que toute
    la logique JS d'Android serve telle quelle (`describePlans`, achat, restauration, vérification par le relais).
    - `getProducts` : deux produits App Store `halcya_premium_annuel` et `halcya_premium_mensuel` (un groupe
      d'abonnements, pas de « base plans » chez Apple), rendus comme les formules `annuel` / `mensuel` de
      `halcya_premium`. Pour chacun : `offerToken` = id du produit ; phase d'essai (`priceMicros` 0, `P14D`) si
      `isEligibleForIntroOffer` ; puis prix (`displayPrice`, micros, devise, `P1Y` / `P1M`).
    - `purchase` : `product.purchase(options: [.appAccountToken(uuid)])`, où `uuid` est tiré de
      `obfuscatedAccountId`, déjà une empreinte SHA-256 ; le relais devra faire de même.
    - `queryPurchases` : `Transaction.currentEntitlements`.
    - Événement `purchasesUpdated` : `Transaction.updates`.
    - Le « jeton d'achat » = `jwsRepresentation`.
  - JS : une ligne de correctif dans `loadBillingPlugin()` (`playBilling.js`) : sur iPhone, l'adaptateur
    (`overlay/app/src/ios/`). `FEATURES.billing` reste faux pour `appstore` tant que le relais ne vérifie pas les
    transactions d'Apple. Sinon le premium se fermerait sur iPhone sans moyen de payer.
  - Essais sans compte Apple :
    - règle de conversion en Swift dans `HalcyaRules` (XCTest) ;
    - adaptateur en Vitest ;
    - achat de bout en bout sur simulateur avec un fichier de configuration StoreKit (`.storekit`) branché au
      schéma, la feuille d'achat de test touchée par XCUITest.
  - [x] Groupe et abonnements dans App Store Connect (A4 fait le 1/11, contrat « Paid Applications » actif) :
    **créés par l'API le 1/11 à 17:48** (`scripts/store-subscriptions.mjs`, 9 tests, workflow « Abonnements App Store
    — création », PR #180) : groupe « Halcya » (nom affiché fr-FR), Gold mensuel 9,99 € (niveau 1), Silver annuel
    29,99 € avec 2 semaines d'essai et Silver mensuel 4,99 € (niveau 2), noms et descriptions fr-FR, en vente en France.
  - [x] **Renouvellement des abonnements iPhone (2/11, PR #199)** : le relais lit depuis v689 le `renewalInfo` signé par
    Apple, que ni le plugin ni le code partagé n'envoyaient : un abonné aurait lu « actif · jusqu'au … » au lieu de
    « renouvellement le … », et une période de grâce ne serait jamais repérée. Le plugin `AppStoreBilling` le joint
    à chaque achat (`Product.SubscriptionInfo.status`), le correctif 37 le transmet (achat, restauration, événement) ;
    5 tests Vitest, XCTest StoreKit. À retirer si Android reprend la demande du 1/11 (`DEMANDES.md`).
  - [x] **Régression des tests de la CI (vue le 2/11, réparée par #200)** : depuis #184, le faux magasin des captures (`installBillingFake`,
    « sans abonnement ») vaut pour toute la session de captures ; la carte « Rapport PDF pour mon médecin » montre alors
    « Débloquer », et le geste réel `DonneesUITests/testEnregistrerLeRapportDansFichiers` échoue (« « Créer le PDF »
    introuvable », simple avertissement dans la CI, sur `main` aussi, #196). À faire : ne poser le faux magasin que pour
    la capture de l'écran d'achat, ou rendre Gold aux gestes réels. **Fait (PR #200, `needsBillingFake`)** : le geste
    réel du rapport PDF repasse sur les deux iPhone.
  - [x] Avertissement « pas de copie de secours dans Documents » de la CI (`scripts/ios-captures.sh`) : la vérification
    lisait Documents après « Supprimer toutes mes données », qui efface la copie (dossier vide ensuite) ; elle lit
    désormais la sonde `[sauvegarde]` (Documents/Copie de secours, 1 fichier, exclu d'iCloud), prise avant (PR #201).
  - [ ] Plugin Swift `TrialReminder` (PR #182) inutilisé depuis Android v697 (#612 : pas de rappel d'essai promis sur
    l'App Store) : le retirer si la décision tient, ou le rebrancher si Android revient dessus. **Revu le 4/11 (v759)** :
    toujours inutilisé (`trialReminderPlugin` rend `null` hors Google Play, Apple envoie son propre rappel) ; retrait
    **après la soumission** : il touche au projet Xcode (`project.pbxproj`, `HalcyaBridgeViewController.swift`,
    `HalcyaRules`), à ne pas remuer avant la build finale du 6/11, et du code mort ne gêne pas l'examen.
  - [~] Capture d'écran pour l'examen de chaque abonnement : **envoyée le 1/11 à 22:24** (écran d'achat 6,9",
    « premium-2 » de `captures/store`) ; état chez Apple à revérifier (`MISSING_METADATA` juste après l'envoi) : l'écran d'achat de l'app, à prendre en CI et envoyer par l'API quand l'achat ouvrira sur iPhone ;
    adresse des notifications serveur V2 (relais d'Android, v691) réglée par le script (PR #182) ; la soumission,
    avec une version de l'app, reste au propriétaire.
  - [x] Natif et branchement JS (PR #33, mergée le 28/10) : `BillingRule` (5 tests XCTest), plugin `AppStoreBilling`,
    correctif 24, contrat avec `describePlans` (Vitest). Inactifs tant que `FEATURES.billing` est faux.
  - [x] Achat d'essai sur simulateur : cible de tests unitaires hébergée par l'app + fichier `.storekit` +
    `SKTestSession` (`RECHERCHE.md`, 28/10 13:30) ; fait le 28/10 (PR #40 : un abonnement d'essai s'achète et reste
    actif) ; étape de la CI **bloquante depuis le 29/10** (PR #58), après quatre passages sans faute. Un échec le
    30/10 (première CI de #77 : achat abouti, conversion vide), sans cause connue, la même étape verte sur `main` ; le
    test dit désormais pourquoi (`StoreKit Test : transaction non vérifiée …`) ; repassé sans faute sur la CI suivante.
  - Relais (Android, « I6-RELAIS ») : préciser dans `DEMANDES.md` l'en-tête ou le champ du JWS et la règle de
    l'`appAccountToken`.
  - [ ] **Sortie avec les abonnements (décision du propriétaire, 1/11 vers 15:00)** — avancement au 1/11 20:30 : A4 ✅, A5 ✅,
    abonnements créés par l'API ✅ (adresse des notifications réglée ✅), relais d'Android ✅ (v689, v691), nom du magasin
    chez Android ✅ (v693, #609), copie de secours hors d'iCloud ✅ (#181), rappel de fin d'essai en Swift ✅ (#182),
    capture pour l'examen par l'API ✅ (#183) ; **achat ouvert sur iPhone : PR #184** (FEATURES.billing, VITE_STORE,
    correctif 36, faux magasin des captures, partie vente des conditions, de la confidentialité et de la fiche) ; puis
    captures 6,9" et capture pour l'examen envoyée ; essai d'achat sur l'iPhone 12 (TestFlight, après le 20/11 : avant,
    Gold est offert) ; date de soumission selon la décision sur la période de lancement (`DEMANDES.md`). Ordre : A4 (propriétaire) → groupe
    « Halcya » et trois abonnements créés par l'API (`store/app-store/abonnements.md` : Silver annuel 29,99 € avec essai de
    2 semaines, Silver mensuel 4,99 €, Gold mensuel 9,99 € ; noms, descriptions, prix en euros, disponibilité, adresse des
    notifications serveur V2 du relais) ; relais d'Android qui vérifie les achats Apple (message prêt à coller dans
    `DEMANDES.md`) ; puis côté app iPhone : `FEATURES.billing` vrai pour appstore, « Restaurer les achats », prix,
    durée et renouvellement automatique près du bouton d'achat, liens vers les conditions et la confidentialité,
    « Gérer l'abonnement » vers l'App Store, textes « compte Apple » (le message d'Android « Vous avez déjà Gold sur ce
    compte Google Play » de la v685), rappel de fin d'essai en notification locale, partie vente des conditions, de la
    confidentialité et de la fiche ; essai sur l'iPhone 12 par TestFlight (achats de test gratuits) ; soumission des
    abonnements avec la version (propriétaire).
  - [x] Gold dans le plugin (1/11, PR #177, mergée, après Android v681 et v683) : `halcya_gold_mensuel` → `halcya_gold`, un produit
    rendu par abonnement demandé, Gold au niveau 1 du groupe dans le fichier StoreKit de la CI, achat d'essai Silver →
    Gold (un seul abonnement en cours).
  - [x] À l'ouverture de l'achat sur iPhone (Android v685, GOLD-b2) : le bouton « Passer à Gold », réservé par Android aux abonnés venus de Google Play, et `ALREADY_GOLD_MESSAGE` (« compte Google Play ») demandent un texte iPhone (« compte Apple ») ; le plugin `AppStoreBilling` ignore `oldPurchaseToken` et `replacementMode`, Apple fait le passage dans le groupe. **Fait chez Android** (v693, #609 : nom du magasin, « ce compte Apple » ; I6-RELAIS-6 : pas d'ancien jeton sur l'App Store) ; **vérifié sur iPhone le 2/11** (PR #194, `Premium.appstore.test.jsx`) : un abonné Silver de l'App Store voit « Passer à Gold · 9,99 € / mois », l'achat demande le Gold mensuel sans ancien jeton. Reste l'essai réel sur l'iPhone 12 (achats de test de TestFlight).
- [ ] **I7 — Bien-être par le visage** à l'ouverture de l'app : mêmes modèles qu'Android, mêmes scores sur ses vecteurs de référence.
  Étude du 28/10 (`RECHERCHE.md`) : ni Vision ni ARKit, qui changeraient les scores. Valence et éveil (HSEmotion, poids
  AffectNet) éteints tant que la licence n'est pas tranchée (`DEMANDES.md`). Étapes :
  - [x] 1. Paquet Swift pur `ios/HalcyaFace` (`swift test`) : ancres, letterbox et recadrage du détecteur, testés sur les portraits d'Android (entrées ±1e-5). 28/10 : passés sur le runner macOS (PR #43).
  - [x] 2. Décodage BlazeFace, zone du visage, points, sous-ensemble de 146 points, zone suivante (tolérances d'Android). 28/10 : 7 tests passés sur le runner macOS (PR #43).
  - [x] 3. Indices, `FaceRecord` et rafale `FacePipeline` sans valence ni éveil (28/10 : 20 tests Swift passés sur le runner macOS, PR #43) ; le JSON écrit sur iPhone est lu par `parseFaceBurst` d'Android (`overlay/app/src/ios/faceRecord.test.js`).
  - [x] 4. Moteur des 3 `.tflite` : TensorFlow Lite C 2.17.0 retenu (`RECHERCHE.md`). Modèles téléchargés en CI avec les empreintes d'Android (`scripts/face-models.sh`, empreinte du moteur figée), paquet `ios/HalcyaFaceModels`, workflow `face-models.yml`. 28/10 : les 5 tests passent du 1er coup sur iPhone simulé, aux tolérances de `FaceModelsTest` (PR #44) ; chaîne complète 108 à 122 ms pour la 1re image, 73 à 87 ms pour la suivante (simulateur ; à mesurer sur l'iPhone 12).
  - [x] 5. YUV → RVB (BT.601 plein écart, 4 rotations ; 28/10 : `FaceFrames`, plan CbCr entrelacé de l'iPhone et arrondi de Java, 9 tests, PR #44 ; garde-fous `FaceSchedule`, chaleur de l'iPhone sur l'échelle d'Android, 10 tests, PR #44 ; boîte des rafales `FaceInbox` et lecture `FaceOneShot` avec caméra et modèles injectables, 13 tests, branche `claude/ios-i7-plugin` ; caméra frontale `FrontCamera` (AVFoundation, 352 × 288, portrait sans miroir), conversion testée sur images fabriquées), puis plugin `FaceSense` en Swift (branché dans l'app, PR #46, mergée) avec images injectables (29/10 : un visage lu de bout en bout sur les deux iPhone simulés, PR #47).
  - [ ] 6. Sur l'iPhone 12 (dès TestFlight, après A1–A3) : la vraie caméra, le temps par lecture, la fluidité.
  - [ ] iPhone 12 de l'essai (A6) : **iOS 15.4 au moins** depuis le 4/11 (Android v767 : le code partagé utilise
    `Object.hasOwn` et `.at()`, absents avant iOS 15.4 ; cible minimale relevée, test `iosMinimum.test.js`).
  - [ ] 7. Décision du propriétaire sur les poids AffectNet (valence et éveil), `DEMANDES.md`. À l'intégration dans l'app : relire le `PrivacyInfo.xcprivacy` livré dans `TensorFlowLiteC.xcframework`.
- [~] **Temps d'écran réel, étapes 1 et 2 faites (31/10, PR #103, mergée)** : module `phoneUsageIos.js` (5 tests) ; plugin Swift
  `PhoneUsage` (`checkAccess`, `openAccessSettings` = demande d'autorisation Temps d'écran, `queryUsageSegments`),
  enregistré, entitlements Family Controls et App and Website Usage dans l'app ; compile avec `import SwiftUI`
  (les segments sont dans le recouvrement `_DeviceActivity_SwiftUI`, vérifié par `swiftc -typecheck`) ; mergé le 31/10.
  Étape 3 écrite (31/10, branche `claude/ios-temps-ecran-3`) : correctif 34 (`phoneUsageSync.js` lit les segments,
  carte et accord propres à l'iPhone), faux plugin des captures, note des Nouveautés de l'iPhone, lecture bornée à
  20 s et iPhone du même compte additionnés (PR #105) ; captures de Sources relues (31/10 03:20 : carte
  « Automatique », minutes d'écran, écran tard ; la carte vierge est sous le pli, couverte par les tests) ; l'audit
  des mots d'Android ne compte plus « temps d'écran » ; **mergé le 31/10 (#105), sur TestFlight (625.108)** ; temps par
  catégorie d'app et confidentialité (PR #110) ; reste : essai sur l'iPhone 12 (UE, iOS 26.4+ : noms d'apps rendus
  ou tus par Apple, lecture de moins de 20 s). Idée : une capture défilée de Sources en vierge.
- [ ] **Temps d'écran réel, conception (31/10)** : le code partagé d'Android (`phoneUsage.js`) attend des événements
  bruts `{ t, e: 'on' | 'off' | 'unlock' }` ; l'iPhone donne des segments horaires (`totalActivityDuration`,
  `firstPickup`, prises en main). Plugin Swift `PhoneUsage` : `checkAccess` (`approvedWithDataAccess`, iOS 26.4+),
  `openAccessSettings` (demande d'autorisation), `queryUsageSegments({ start, end })` → segments horaires ; module
  `overlay/app/src/ios/phoneUsageIos.js` qui en tire les mêmes entrées `phone_usage` (minutes par jour, écran tard
  22:00 → 04:00, déverrouillages, nuit estimée à l'heure près, la reprise du matin par `firstPickup`) ; correctif de
  `phoneUsageSync.js` (disponible sur iPhone, branche iOS si `queryUsageSegments` existe). Tests Vitest du module.
- [ ] **I8, revu le 30/10 (`RECHERCHE.md`)** : temps d'écran **réel** dans l'UE (iOS 26.4+, droits accordés le 30/10) :
  plugin Swift `PhoneUsage` (même forme qu'Android) lisant `DeviceActivityData.activityData`, entitlements Family Controls
  et App and Website Usage dans l'app, essai sur l'iPhone 12 (iOS 26.4+ ?) ; montre Huawei GT : deux pistes à étudier avant tout verdict
  (BLE à côté de Huawei Santé, essai sur l'iPhone 12 ; Health Kit de Huawei).
- [ ] **I8 — Le reste du natif** (28/10 : sonde vocale `VoiceProbe` en Swift, PR #40) : voix, temps d'écran, montre Huawei (BLE), détection des sources : étude honnête
  (sources datées) puis ce qui est faisable ; ⛔ argumentés dans `PARITE.md`.
- [~] **TestFlight (I9), 30/10** : A1, A2, A3 faits par le propriétaire, accord pour la signature par Apple ;
  `testflight.yml` : **premier envoi réussi** (616.97, après un refus pour `NSHealthUpdateUsageDescription`, #96) ;
  31/10 : 624.105 envoyée, droits Family Controls vérifiés dans l'app signée (étape ajoutée à `testflight.yml`) ;
  625.107 envoyée (31/10 04:00) ; 625.108 (31/10 05:00), première avec le temps d'écran ; 631.110 (31/10 05:45), même version
  qu'Android ; 631.112 (31/10 06:45), temps par catégorie d'app ; 633.114 (31/10 07:45) ; 635.116 (31/10 08:30) ; 638.118 (31/10 09:45) ; **638.121 (31/10 11:40), première avec
  `NSSpeechRecognitionUsageDescription`** (ITMS-90683 : les builds d'avant sont sans doute invalidées par Apple) ;
  642.124 (31/10 13:05) ; 644.127 (31/10 13:55) ; 648.128 (31/10 14:55) ; 652.135 (31/10 16:52) ; 654.137 (31/10 17:34) ; 654.139 (31/10 18:40, poids de l'app Santé) ; 658.141 (31/10 19:57) ; 661.146 (31/10 22:57) ; 663.147 (31/10 23:34) ; 665.149 (1/11 00:55) ; 667.151 (1/11 01:41) ; 670.153 (1/11 02:55) ; 671.155 (1/11 03:46) ; 672.157 (1/11 04:51) ; 673.159 (1/11 06:00) ; 674.161 (1/11 06:59) ; 675.163 (1/11 08:02) ; 677.167 (1/11 09:54) ; 678.169 (1/11 11:02) ; 679.171 (1/11 11:53) ; 680.173 (1/11 12:47) ; 681.175 (1/11 13:55) ; 683.177 (1/11 14:47) ; 687.179 (1/11 17:51) ; 689.181 (1/11 18:45, copie de secours hors d'iCloud) ; 691.183 (1/11 19:41, rappel de fin d'essai en Swift) ; **693.185 (1/11 21:59, achat ouvert)** ; 697.189 (2/11 00:05) ; 698.190 (2/11 00:57) ; 700.193 (2/11 02:52) ; 702.195 (2/11 03:58) ; 703.197 (2/11 04:49) ; 705.201 (2/11 08:10) ; 706.202 (2/11 09:08) ; 708.205 (2/11 11:09) ; 709.206 (2/11 11:42) ; 710.208 (2/11 13:20) ; 712.209 (2/11 13:59) ; 713.211 (2/11 15:04) ; 714.213 (2/11 17:12) ; 717.216 (2/11 19:43) ; 718.217 (2/11 19:48) ; 722.219 (2/11 23:08, fin de la période de lancement sur iPhone le 6/11) ; **722.221 (2/11 23:59, première avec App Attest en production)** ; 724.223 (3/11 00:58) ; 725.227 (3/11 01:45) ; 728.231 (3/11 03:57) ; 730.235 (3/11 05:58) ; 731.237 (3/11 06:48) ; 734.241 (3/11 10:05, second essai après « Error Downloading App Information ») ; 737.245 (3/11 13:08) ; 739.247 (3/11 14:20) ; 740.250 (3/11 16:02) ; 742.252 (3/11 17:31) ; 744.255 (3/11 19:22) ; 746.257 (3/11 21:22) ; 749.258 (3/11 22:18) ; 751.260 (4/11 00:08) ; 752.261 (4/11 00:50) ; 755.265 (4/11 03:03) ; 757.266 (4/11 03:50) ; 759.268 (4/11 04:47) ; 760.271 (4/11 07:01) ; 761.272 (4/11 07:59) ; 763.274 (4/11 09:59) ; **767.276 (4/11 11:59, iOS 15.4 au moins)** ; 768.277 (4/11 12:47) ; 769.278 (4/11 13:45) ; 771.281 (4/11 16:42) ; 772.282 (4/11 17:43) ; 774.283 (4/11 18:19) ; 776.286 (4/11 20:02) ; 777.288 (4/11 20:41, dernière lancée à la main : la livraison continue, #289, prend le relais) ; 778.290 (4/11 22:07, **premier envoi automatique**, au merge de #290) ; 780.291 (4/11 23:10, automatique, #291) ; 782.292 (4/11 23:48, automatique, #292, « Votre avis ») ; 784.293 (5/11 00:57, automatique, #293) ; 787.295 (5/11 04:14, automatique, #295, Analyses en onglets, correctif 41) ; 791.296 (5/11 05:08, automatique, #296) ; 792.298 (5/11 07:00, automatique, #298) ; 795.300 (5/11 09:14, automatique, #300, au second essai : paquets Swift non téléchargés au premier ; 3 essais depuis) ; 795.301 (5/11 09:24, lancée à la main pour contrôler l'étape des 3 essais, #301 : paquets résolus au premier essai) ; 798.302 (5/11 11:00, automatique, #302) ; 801.303 (5/11 13:15, automatique, #303) ; 805.304 (5/11 14:14, automatique, #304) ; 807.305 (5/11 15:18, automatique, #305) ; 809.308 (5/11 16:56, automatique, #308, photo des selles masquée) ; 813.309 (5/11 18:01, automatique, #309) ; 817.312 (5/11 21:05, automatique, #312) ; 817.314 (5/11 22:04, automatique, #314, photo des selles rouverte) ; 821.315 (5/11 23:08, automatique, #315) ; 825.318 (6/11 02:00, automatique, #318) ; 826.320 (6/11 03:56, automatique, #320) ; 828.321 (6/11 05:34, automatique, #321) ; 830.323 (6/11 08:09, relancée après le blocage de GitHub, #323) ; 831.330 (6/11 10:07, automatique, #330) ; 833.331 (6/11 11:03, automatique, #331, adresse IP dans la politique) ; 836.332 (6/11 11:42, automatique, #332) ; 837.335 (6/11 13:02, automatique, #334) ; 838.336 (6/11 14:12, automatique, #336) ; 839.337 (6/11 15:05, automatique, #337) ; 841.339 (6/11 17:30, automatique, #339) ; 843.342 (6/11 19:07, automatique, #342) ; **844.344 (6/11 20:01, automatique, #344 ; build finale, attachée à la version 844)** ; 846.346 (6/11 22:04, automatique, #346) ; 848.349 (7/11 00:15, automatique, #349) ; 848.350 (7/11 00:45, automatique, #350, historique de l'app Santé) ; 850.351 (7/11 02:18, automatique, #351) ; 850.352 (7/11 03:02, automatique, #352, autorisations à l'accueil) ; 852.353 (7/11 04:08, automatique, #353) ; 853.354 (7/11 05:02, automatique, #354) ; 871.370 (7/11 17:45, #356 mergée par le propriétaire) ; 881.372 (7/11 19:05, #358) ; 887.373 (7/11 20:05, #359) ; 893.374 (7/11 21:15, #360, première au numéro de version fixe 893) ; 895.375 (7/11 22:10, #361, version 893) ; 896.376 (7/11 23:01, #362, version 893, dernière du jour) ; 897.378 (8/11 01:10, #364) ; 898.379 (8/11 02:05, #365) ; 899.381 (8/11 04:00, #367) ; 901.382 (8/11 04:45, #368) ; 902.383 (8/11 06:05, #369) ; 903.384 (8/11 07:05, #370) ; 904.385 (8/11 08:05, #371) ;
  reste : A6 (la compagne du propriétaire, iPhone 12), puis brancher l'envoi sur chaque version (push sur `main`) une
  fois l'installation confirmée.
- [ ] **I9 — Publication** (28/10 : fiche App Store fr-FR en brouillon, PR #35, mergée ; réponses « Confidentialité de l'app » (A5) et données collectées du manifeste, PR #39 ; `PrivacyInfo.xcprivacy` et `ITSAppUsesNonExemptEncryption` préparés, vérifiés par la
  CI ; données collectées à compléter avec A5 ; captures 6,9" à la demande, données de démo fidèles à l'iPhone, PR #41 mergée ; 8 captures choisies le 29/10, `store/app-store/captures.md` ; textes sans lecture du visage ni « dans Apple Watch », PR #42) : signature par la CI (A2), envoi TestFlight interne à chaque version suivie, fiche App
  Store fr-FR (`store/`), captures, `PrivacyInfo.xcprivacy`, réponses « Confidentialité de l'app » (A5), relecture
  des directives d'Apple (santé, abonnement, IA) ; la soumission reste un geste du propriétaire.
  - [x] Politique de confidentialité propre à l'iPhone, embarquée (29/10, `overlay/app/public/confidentialite-iphone.html`,
    correctif 26 : Réglages → Confidentialité l'ouvre sur iPhone) : app Santé, copie de secours et iCloud, capteurs
    Bluetooth, visage, météo, analyse IA sans jeton Google, aucun achat pour l'instant ; ni montre Huawei, ni temps
    d'écran, ni Withings. Lien « ‹ Revenir à Halcya » en tête (pas de bouton retour sur iPhone). Témoin : quand la
    page d'Android change, `privacyPolicyIphone.test.js` échoue jusqu'à relecture de la page iPhone (empreinte à
    mettre à jour). Relue le 1/11 sur Android v671, avec les conditions (`conditionsIphone.test.js`) : refrain « pas un
    diagnostic » et « pas des causes » retirés comme sur Android, sans la lecture au déverrouillage (PR #154).
  - [ ] Publier en ligne la page de confidentialité et une page d'assistance (deux URL exigées par la fiche) :
    29/10, workflow `pages.yml` et `scripts/site.mjs` prêts (page d'assistance `site/assistance.html` ; la
    confidentialité est celle de l'app, sans son lien de retour ; directive 2.3.10 vérifiée) ; attend **A8** (Pages
    à activer une fois par le propriétaire), puis lancer le workflow. Adresses prévues :
    `https://spreadzenox.github.io/HealthTrack-iOS/confidentialite/` et `…/assistance/`. Contact de l'assistance :
    les demandes GitHub ; une adresse e-mail si le propriétaire en donne une (directive 1.5 : un moyen simple de le
    joindre).
  - [~] Fiche envoyée par l'API App Store Connect (31/10, PR #119 : `scripts/store-push.mjs`, workflow manuel
    `store-push.yml`) : nom, sous-titre, description, mots-clés, texte promotionnel, adresses d'assistance et de
    confidentialité, sur la version « Prête à soumettre ». **Envoyée le 31/10 11:39** (run 41197722535) après le retrait
    des « ★ », refusés par Apple (#122, règle dans `store-check`). Captures : envoi par l'API écrit (PR #124, option « captures » de
    `store-push.yml`). Captures 6,9" refaites le 31/10 (`ios-build.yml`, `devices: iPhone 17 Pro Max`, branche
    `captures/store`, Android v642, build 642.125) et regardées une à une : propres (09:41, aucun bandeau, aucun mot
    d'Android, pistes « pas des causes ni un diagnostic »), sauf Sources : « Jamais reçu en 30 jours : VFC » sous
    l'Apple Watch, qui envoie pourtant sa VFC (SDNN), faux sur tout iPhone → correctif 19 étendu (PR #127, mergée).
    **Refaites sur la v648 (build 648.128), regardées et envoyées le 31/10 à 15:21** (run 41214456732 : 8 captures
    dans l'ordre de `captures.md`). **Numéro de la
    version** : App Store Connect a créé « 1.0 », les builds envoyées portent le numéro d'Android (6xx), et une version
    ne reçoit que des builds de même numéro → `store-push.mjs` renomme la version « Prête à soumettre » au versionCode
    d'`upstream.json` à chaque envoi (PR #129, 31/10) : « 1.0 » renommée 648 le 31/10 à 15:21. État des captures chez
    Apple lu à chaque envoi (PR #132) : 7/8 traitées à 15:25, **8/8 traitées à 16:02** (run 41217672289), aucune
    refusée. Refaites sur la 658 (Sources en couleur) et renvoyées le 31/10 à 20:11 (run 41237667780) : 8/8 traitées.
    La capture 2 (Analyses) montrait encore « pas des causes ni un diagnostic », remplacé par « à vérifier avant d'y
    croire » depuis Android v667 : captures refaites sur la 667, regardées et renvoyées le 1/11 à 02:08 (run 41263918798) :
    8/8 traitées à 02:55 (run 41267111020), aucune refusée. À refaire après Android v673 : la capture 7 (Sources) montre encore « jamais chez Halcya », retiré de Sources ;
    captures refaites sur la 673 (run 41278746988), regardées et renvoyées le 1/11 à 06:17 (run 41280232640) :
    8/8 traitées à 06:59 (run 41282979617), aucune refusée. Refaites sur la 678 et renvoyées le 1/11 à 11:26 (run 41301867601) :
    8/8 traitées. Android reprend encore ses textes d'heure en heure (série SLOP) : prochaine série de captures à la fin
    de ces reprises, ou juste avant une soumission par le propriétaire. Après chaque envoi TestFlight d'une nouvelle version : `store-push.yml` sans « captures », pour que la
    version de la fiche suive (charte §4). Reste la relecture du propriétaire.
  - [x] Catégorie (Santé et forme) et classification par âge (18 ans et plus, comme sur Google Play) envoyées par l'API
    (`store/app-store/classification.json`, PR #130, acceptées le 31/10 à 15:21) : réponses au plus prudent (informations médicales et
    tabac « fréquents »), à relire par le propriétaire avant la soumission.
  - [x] Notes pour l'examen d'Apple, en anglais, prêtes à coller (`store/app-store/notes-examen.md`, 29/10) ; à relire
    avant la soumission (I6, directive 5.1.3 (ii), adresses après A8).
  - [x] Conditions d'utilisation propres à l'iPhone (29/10, `overlay/app/public/conditions-iphone.html`, correctif 26 :
    Réglages → Conditions les ouvre de nouveau sur iPhone) : aucun achat, App Store et contrat de licence standard
    d'Apple, app Santé et sauvegarde iCloud, « pas un dispositif médical » et 15 ou 112 (directive 1.4.1) ; même
    lien de retour ; témoin `conditionsIphone.test.js` (empreinte de la page d'Android) ; publiées aussi sur le site
    (`…/conditions/`, avec A8).
  - [ ] Avec I6 : leur partie vente (formules, renouvellement, annulation, remboursements par Apple), et les liens de
    confidentialité et de conditions du paywall (`PRIVACY_URL`, `TERMS_URL` d'Android) à remplacer.
  - [x] Données de démo iPhone (`captureMode.js`, `iphoneDemoEntries`) : le poids et la masse grasse y venaient de
    « Withings » (connexion directe, absente sur iPhone). Le code partagé annonçait un poids de l'app Santé « (saisi
    le …) » et taisait sa masse grasse (demande à Android du 29/10, `DEMANDES.md`, toujours à transmettre).
    **Correctif 35 (31/10, PR #138)** : origine « app Santé », libellés « (app Santé, 28/10) » ; démo de l'iPhone
    passée par l'app Santé (poids, masse grasse seule).
  - [x] **Directive 5.1.3 (ii) d'Apple** : une app « ne doit pas stocker de données de santé personnelles dans
    iCloud ». La copie de secours (I3) partait dans la sauvegarde iCloud de l'iPhone. **Décision du propriétaire du
    1/11 : l'exclure.** Fait (branche `claude/ios-copie-hors-icloud-011615`) : dossier « Copie de secours » de
    Documents, créé et marqué exclu de la sauvegarde par l'app à chaque lancement et changement d'état
    (`SnapshotFolder.swift`, 3 tests XCTest) ; la page y écrit la copie, lit encore l'ancienne de la racine et ne la
    retire qu'après avoir écrit la nouvelle ; « Supprimer toutes mes données » efface les deux ; sonde de la CI
    (`[sauvegarde] Documents/Copie de secours`, erreur si le dossier n'est pas exclu) ; textes : confidentialité,
    conditions, fiche, assistance, notes pour l'examen, Nouveautés de l'iPhone. Pour changer d'iPhone : l'export.
    Reste ouvert : les fichiers que la personne exporte elle-même vont à la racine de Documents (donc dans la
    sauvegarde iCloud) avant la feuille de partage ; c'est son geste, à revoir si Apple le relève.
- [x] **Page « Licences » d'Android (#632, v716 ; #633, v717) — fait le 2/11 (PR #215, correctifs 26 et 39)** : essai à blanc du 2/11 : le correctif 26 ne
  s'applique plus (`More.jsx` : ligne « Licences » avant la fin de la liste) ; ses tests passent avec nos correctifs.
  À faire : refaire le correctif 26 (et aligner au passage la description « Conditions » de l'iPhone sur celle
  d'Android, « Utilisation, abonnement et remboursements », vraie depuis l'ouverture de l'achat) ; sur iPhone, ni Play
  Billing / Play Integrity ni AndroidX / LiteRT / ONNX, mais TensorFlow Lite C (Apache-2.0) et Capacitor iOS (MIT) ;
  modèles valence / éveil tus (éteints) ; licences vérifiées ; capture de la page ; demande à Android (`DEMANDES.md`).
- [ ] **App Attest sur iPhone (I6, contrat d'Android du 2/11, #623)** — l'équivalent de Play Integrity, seule porte sans
  contrôle avant les crédits payants de l'iPhone :
  - [x] Plugin Swift `AppAttest` (clé dans la Secure Enclave, attestation, assertion ; 4 XCTest `AppAttestRule`) et
    `src/ios/appAttest.js` (clé attestée une fois, en-têtes `X-AppAttest-*`, « unsupported » sans Secure Enclave ;
    7 Vitest) : PR #203 (mergée le 2/11), non branchés.
  - [x] Branché sur l'analyse des repas (PR #210, correctif 38, 2/11) : en-têtes signés sur le corps exact ; enregistrement
    retenté au plus une fois par heure tant que les routes du relais sont coupées (Android v713 a tout livré, 5a à 5d,
    coupé par défaut).
  - [ ] Vérifier sur l'iPhone 12 (le simulateur n'a pas de Secure Enclave) quand le relais sera en `observe` : bilan
    « iPhone : attest_passed / missing / rejected » du déploiement d'Android.
  - [x] Droit `com.apple.developer.devicecheck.appattest-environment = production` : capacité « App Attest » cochée
    (compte rendu du propriétaire du 2/11) ; Team ID transmis, relais en `observe` depuis Android v721 (2/11). Droit
    vérifié dans l'app signée par `testflight.yml` (#219, #220) : **première build 722.221** (2/11 23:59).
- [ ] **Soumission du 7 ou du 8/11 (décision du propriétaire du 2/11)** : période de lancement coupée sur iPhone le
  6/11 inclus (demande du propriétaire à la routine Android ; repère `X-Platform: ios`, correctif 40). À vérifier avant :
  - [~] relais : `/v1/subscription/verify` avec `X-Platform: ios` ne rend plus `source: 'launch'` après le 6/11 (sans
    l'en-tête : la date de Google Play). **Fait par Android v722** (#638, `iosUntil`, déployé le 2/11 vers 22:00 UTC ;
    `X-Platform: ios` ajouté par le code partagé) ; reste l'essai sur TestFlight (avant le 7/11 : « jusqu'au 6 nov. » ;
    après : Silver / Gold et l'achat en bac à sable) ;
  - [~] écran d'achat sur iPhone avec les trois abonnements, chemin des notes d'examen juste (roue en haut à droite →
    « Paramètres » → « Découvrir le premium ») ; aucune date fausse dans l'app d'ici là (note de Nouveautés sans date,
    Paramètres affiche celle du relais) ; **vérifié à l'avance le 4/11** : sur l'iPhone simulé, l'écran d'achat (faux
    magasin « sans abonnement » des captures) montre Silver annuel 29,99 € avec 14 jours d'essai, Silver mensuel
    4,99 € et Gold ; la roue ouvre « Réglages », dont la ligne « Paramètres » mène à Paramètres ; test iOS
    (`Settings.appstore.test.jsx`) : relais sans période après le 6/11 → « Découvrir le premium » vers `/premium` et
    « Restaurer un achat », rien sur Gold offert ; pendant la période, pas encore ce lien ; les cartes de fin de Gold
    offert d'Android sont coupées sur iPhone (v749, v751, tests) ; reste l'essai réel le 7/11 au matin sur TestFlight
    (vrais prix de l'App Store en bac à sable) ;
  - [x] captures iPad 13" (choix « B », #217 : 8/8 traitées par Apple), `notes-examen.md` (#219) et droit App Attest
    (722.221) prêts le 2/11 ;
  - [x] **bloqué le 6/11 de 07:32 à 08:49 au plus tard (Paris), levé** : GitHub ne démarre plus aucun job (« The job was not started because
    your account is locked due to a billing issue ») ; TestFlight 830 (run 42175104845), build et modèles du visage de
    `462dd97` arrêtés avant le départ. Action du propriétaire (facturation GitHub) ; ensuite relancer ces trois runs
    (« Re-run failed jobs »), puis la fiche. Secours sans GitHub : le propriétaire renomme la version et attache
    828.321 à la main ;
  - [x] **fait le 6/11 à 20:12 UTC** : `store-push.yml` avec `version_des_builds` et `attacher_build` ; « Version 717
    renommée 844 » (Apple a accepté le renommage avec 717.216 encore attachée), puis, 844.344 traitée par Apple,
    « Build 844.344 attachée à la version 844 » (runs 42284768524 et 42286325559). Numéro donné au propriétaire
    (`POUR-ORCHESTRATEUR.md`, 21:15) ; build gardée (les renvois sans option disent « Version 844 gardée ») sauf
    « attacher la dernière ». **Après la soumission**, ne plus lancer `store-push.yml` jusqu'à la version suivante : il
    ne trouve plus de version modifiable et s'arrête en erreur (rien n'est changé).
  - [x] build finale le 6/11, en fin de journée (décision du propriétaire du 05/11 vers 23:00 : « renommez-la et
    donnez-lui la build finale ») : `store-push.yml` avec `version_des_builds` **et** `attacher_build` (nouveau, 6/11 :
    la plus récente build valide du numéro de la version, `latestBuild`, testé ; jamais soumise) ; puis numéro exact au
    propriétaire dans `POUR-ORCHESTRATEUR.md`. Ensuite, chaque renvoi de la fiche garde la version (build attachée) ;
    une version plus récente d'Android demande un nouveau passage avec les deux options.
  - [x] build finale le 6/11 : version d'App Store Connect renommée à son numéro (la 717 garde 717.216 jusque-là ; une
    build ne s'attache qu'à la version du même numéro ; option `version_des_builds` de `store-push.yml`, PR #219 ; si
    Apple refuse le renommage avec une build attachée, le propriétaire le fait dans la page de la version), puis numéro
    exact de la build donné au propriétaire ;
  - [x] **captures iPhone 6,9" refaites le 6/11, envoyées à 08:12 UTC** (8/8 traitées par Apple à 08:55) (8 dans l'ordre ; 4/8 traitées à la fin du run,
    à relire au prochain envoi de la fiche) ; iPad 13" refaites (`db9cb04`, v830, build 830.326), regardées, envoyées à 08:54 UTC (5/8 traitées, 3 en cours) ; anciennes sur
    `captures/store-ipad-0211` ; (`3d39633`, v828, build 828.322, regardées une à une ; `captures.md`
    à jour ; anciennes sur `captures/store-0111`) . Ancienne question : (facultatif, le 6/11) captures de la fiche refaites ? Celles de `captures/store` datent d'avant les
    sous-onglets d'Analyses (Android v786, 5/11) : l'écran « Vos analyses » (capture 2) n'y a pas la rangée Bien-être,
    Ventre, FODMAP, Tendances. Rien d'obligatoire pour Apple (les captures montrent l'app, pas une version exacte) ;
    à refaire seulement si la build finale change l'allure d'un écran montré ;
  - [ ] **12/11 : mission PI1** (`journal/missions/PI1.md`, lecture seule dans App Store Connect par Claude dans Chrome,
    décision du propriétaire de 16:15) : relever ce que la page de chaque abonnement signale ; puis corriger par l'API
    (`store-subscriptions.yml`). Soumission préparée par la mission PI2, arrêt avant « Ajouter pour examen ».
  - [ ] (6/11 10:10 et 16:05, Paris) toujours `MISSING_METADATA` ; forum d'Apple (fils 815654, 820990) : cause la plus
    citée, la localisation du **groupe** (la nôtre existe, fr-FR « Halcya ») ; question au propriétaire précisée
    (`POUR-ORCHESTRATEUR.md`, 16:10).
  - [ ] (6/11 01:15, après le prix de l'app réglé par le propriétaire) toujours `MISSING_METADATA`, tout le relevé
    rempli ; question au propriétaire (`POUR-ORCHESTRATEUR.md`) ; relevé à refaire dans la journée
  - [ ] abonnements encore `MISSING_METADATA` par l'API (relevé complet du 3/11 00:05 : groupe, noms, capture
    `COMPLETE`, prix, France, note pour l'examen, formule `UPFRONT`, version 1 `PREPARE_FOR_SUBMISSION`, rien de
    manquant que l'API expose) ; l'interface dit « Prepare for Submission » : à revoir le jour de la soumission (la
    section des abonnements de la page de version doit apparaître ; sinon, relire avec le propriétaire).
- [x] **« Prix et disponibilité » de l'app** : **fait par le propriétaire le 05/11 vers 23:00** (gratuite ; France,
  Belgique, Luxembourg, Suisse, Canada, sans les futurs pays ; Content Rights : oui). Ancienne note : vide chez Apple (relevé du
  3/11 01:15 : `appAvailabilityV2` et `appPriceSchedule` en 404). À régler : gratuite, disponible en FRA, BEL, LUX,
  CHE, CAN (P32), pas dans les nouveaux pays. Ou par l'API après « ok prix et disponibilité » : workflow « App Store —
  prix, disponibilité et Content Rights » (#228, prêt le 3/11 ; `--content-rights` aussi, sur son choix). Puis relire
  l'état des abonnements.
- [x] Abonnements d'Apple dans les 5 pays de P32 (3/11, #224 ; run 41557291477) : prix CHF et $CA d'Android, essai de
  2 semaines dans chaque pays.
- [ ] **Achat d'essai StoreKit sur simulateur, raté une fois (6/11 04:55, #321)** : `renewalInfo` vide, StoreKit Test ne
  donnait encore aucun statut d'abonnement juste après l'achat (iPhone 16e, iOS 26.2) ; vert à la relance, code natif
  inchangé par la PR. Si ça revient : relire le statut deux ou trois fois dans `AppStoreBillingPlugin.renewalInfo`
  (utile aussi sur un vrai iPhone : le relais dirait sinon « actif jusqu'au » au lieu de « renouvellement le »).
- [ ] **Plus tard, quand il y aura plus d'utilisateurs (décision du 31/10)** : la stratégie de cache décidée avec la
  routine Android pour l'analyse des repas, côté relais. Aujourd'hui, les consignes commencent par la longue liste des
  ingrédients, identique d'un appel à l'autre, que Vertex AI met en cache implicitement (`relay/src/prompts.js`
  d'Android). Rien à faire côté iPhone, qui passe par le même relais.
- [ ] **Ensuite — suivi continu** : chaque version Android suivie, correctifs refaits, nouveautés vérifiées.

- [x] **DIGESTIF — « ventre » devient « digestif »** (fait le 7/11 à 18:00 sur la PR #356, après Android #785 ; reste le nom App Store, après la soumission) (décision du propriétaire du 07/11, `POUR-IOS.md` 15:35 ; Android
  AUJ-7) : quand Android livre ses textes, reprendre les mêmes mots dans ce qui est propre à l'iPhone :
  `ios/App/App/EveningPlugins.swift` (« Et votre ventre aujourd'hui ? »), notes de Nouveautés de l'iPhone (sans
  réécrire les anciennes ?), `captureMode.js`, fiche App Store `store/app-store/fr-FR/` (`subtitle.txt`,
  `description.txt`, `promotional-text.txt`) ; données et identifiants inchangés. **Nom App Store** « Halcya —
  digestion & bien-être » (30 caractères au plus) **seulement après la soumission** du propriétaire.

- [ ] **BÊTA-NUIT — examen bêta chaque nuit** (message du propriétaire du 07/11 vers 18:30, inscrit dans la consigne de
  la routine ; même décision par `POUR-IOS.md` à 17:35 : ne jamais toucher à la version de l'App Store ni à la build
  844.344 ; si la clé n'a pas le droit, écrire le geste exact dans `POUR-ORCHESTRATEUR.md` ; question du même numéro de
  version posée le 07/11 à 19:15 ; réponse « ok même numéro de version » (19:35) : `testflight-version.json`, 893
  pendant ce cycle ; à la prochaine soumission, la version de l'App Store prendra ce numéro (`store-push.yml` avec
  « version des builds »), puis un nouveau numéro de cycle) : `scripts/store-beta-submit.mjs` et `.github/workflows/store-beta-submit.yml` (la build la plus récente
  traitée par Apple, ou `build` ; « À tester » de `store/app-store/fr-FR/testflight-a-tester.txt` ; groupe externe
  « Testeurs Halcya » ; `betaAppReviewSubmissions`) ; refuse tout chemin de la version de l'App Store. À lancer au
  premier run après 23:45 (heure de Paris), une fois la dernière version d'Android du jour mergée et sa build traitée ;
  sinon au run suivant ; résultat relevé par `store-beta.yml`.
- [ ] **LIVRAISON CONTINUE — expiration des builds** (décision du propriétaire du 09/11 vers 11:00, `POUR-IOS.md`
  11:05, ses mots : « la routine doit expirer les versions précédentes à chaque fois qu'une nouvelle version arrive ; le
  but c'est de faire du continuous deployment le plus propre possible et rapide ») :
  `scripts/store-beta-expire.mjs` et `.github/workflows/store-beta-expire.yml` (`builds` nommées, `nettoyage`, `essai` ;
  seule écriture permise : `expired: true` sur une build ; jamais 844.344 ni la build attachée à la version de l'App
  Store, lue seulement ; jamais la dernière build distribuée au groupe externe ; relevé de l'examen bêta après).
  - **Après chaque nouvelle build TestFlight** (merge → TestFlight → `store-beta-expire.yml` avec `nettoyage` →
    `store-push.yml`) : restent la build de l'App Store, la dernière distribuée aux testeurs externes (jusqu'à ce que sa
    remplaçante soit acceptée et distribuée), les builds en examen bêta, celles en traitement et la plus récente.
  - **Soumission de la nuit** : si la build en examen attend depuis plus de 24 h (le script l'affiche : « En examen
    depuis plus de 24 h ») et qu'une plus récente est prête, `builds` = celle en examen, puis `store-beta-submit.yml`
    avec la plus récente ; sinon attendre la décision d'Apple.
  - Chaque expiration notée dans le compte rendu ; erreur de l'API : message exact dans `POUR-ORCHESTRATEUR.md`.
  - **9/11 12:00** : outil mergé (#401) ; essai à blanc juste (146 builds non expirées : gardées 844.344, 839.337,
    896.376, 937.414 ; ≈145 à expirer, dont la 918.396 tant qu'elle n'est pas soumise : d'où l'ordre 896 → soumission
    de la 918 → nettoyage). **Exécution réelle refusée par le système de permissions de la session** (« Irreversible
    Deletion ») : rien d'expiré ; geste demandé au propriétaire (`POUR-ORCHESTRATEUR.md` 12:15). Sans contournement.
  - **9/11 14:00** : le nettoyage garde aussi une build du groupe externe pas encore soumise et plus récente que la
    distribuée (« dans le groupe externe, à soumettre » : la 918.396), pour qu'il puisse tourner avant sa soumission ;
    test ajouté ; marche à suivre dans la charte (§ 4).
  - **9/11 20:00** : la 896.376 n'est plus parmi les builds actives (expirée dans App Store Connect, pas par la routine) ;
    **918.396 soumise à l'examen bêta** (run 42679499099 : « À tester » déjà là, déjà dans le groupe, « Soumise à
    l'examen bêta d'Apple ») ; relevé de 20:03 : WAITING_FOR_REVIEW. Nettoyage (≈146 builds) toujours à lancer par le
    propriétaire ou après sa permission (`POUR-ORCHESTRATEUR.md` 20:05). Soumission de la nuit : la 918.396 est en
    examen depuis moins de 24 h → attendre la décision d'Apple ; Android ne fait pas d'Alpha ce soir (gel jusqu'au
    10/11 22:00).
  - **9/11 21:00** : décision du propriétaire « 896 expirée » (19:50) ; relevé : 896.376 absente, 918.396
    WAITING_FOR_REVIEW. Nettoyage réel lancé une fois comme demandé : **refusé par le système de permissions de la
    session** (« Irreversible Deletion »), rien expiré ; pas d'autre essai (consigne : « n'insiste pas ») ; geste du
    propriétaire ou permission demandés (`POUR-ORCHESTRATEUR.md` 21:05).
  - **10/11 00:00** : **918.396 acceptée par Apple** (APPROVED, IN_BETA_TESTING) : c'est la build des testeurs externes ;
    la 839.337 ne sert plus et partira au prochain nettoyage. Soumission de la nuit : aucune (pas d'Alpha d'Android,
    gel jusqu'au 10/11 22:00 ; testeurs iPhone et Android sur la même version). Prochaine : après l'Alpha d'Android du
    10/11 au soir, avec un passage des personas avant (décision (C)).
  - **10/11 06:00, prévu ce soir** : Android lève son gel des envois Alpha le 10/11 à 22:00 (Paris) ; au premier run
    après son Alpha : passage des personas iPhone (`npm run persona -- --store=appstore`, configurations iPhone de
    l'artefact d'Android) sur la build à envoyer, puis « À tester » réécrit pour elle et `store-beta-submit.yml`
    (la 918.396 est acceptée : pas de règle des 24 h à appliquer).
  - **10/11 09:00** : le groupe externe ne contient plus que la **959.434** (APPROVED, IN_BETA_TESTING) ; 918.396 et
    839.337 retirées du groupe, sans expiration ; aucun lancement de la routine (`store-beta-submit.yml` : dernier le
    9/11 19:02) : geste fait dans App Store Connect. Essai à blanc (run 42779431273) : 159 builds actives, gardées
    844.344, 959.434 (distribuée), 961.436 (la plus récente) ; 156 à expirer. Ce soir : la soumission de la nuit part
    d'une build plus récente que la 959.434, après les personas.
  - [x] **10/11 09:40 : nettoyage réel fait** (autorisation du propriétaire dans la session, vers 09:30, verbatim dans le
    résumé de la semaine et `POUR-ORCHESTRATEUR.md`) : run 42783898946, 157 builds expirées (de 961.436 à 638.121, dont
    918.396 et 839.337) ; restent 844.344, 959.434 (distribuée), 962.437 (la plus récente). Désormais : nettoyage
    réel, sans essai, après chaque nouvelle build mise chez les testeurs externes.
- [ ] **DÉPLOIEMENT CONTINU** (décisions du propriétaire du 10/11, `POUR-IOS.md` 09:10 et 09:15, verbatim dans le résumé
  de la semaine) : remplace BÊTA-NUIT. À chaque run (et après chaque TestFlight) : si la build la plus récente est
  traitée (`VALID`) et pas chez les testeurs externes → `store-beta-submit.yml` (groupe + examen) ; relevé jusqu'à
  `IN_BETA_TESTING` (accord d'Apple en ~1 min, même numéro de version) → `store-beta-expire.yml` « nettoyage ».
  - [x] **10/11 10:00** : 962.437 soumise (run 42787092826 : « À tester » complété, ajoutée au groupe, soumise),
    `IN_BETA_TESTING` au relevé de 10:01 ; nettoyage (run 42787291304) : 959.434 expirée ; restent 844.344 et 962.437.
  - [x] **10/11 12:12** : 968.442 (v968) envoyée par la chaîne automatique (`deploy.sh` de la session : TestFlight →
    fiche → soumission, refaite 5 min plus tard tant que la build n'était pas traitée → relevé → nettoyage) ;
    `IN_BETA_TESTING` à 11:12 UTC ; 962.437 expirée ; restent 844.344 et 968.442.
  - Version d'Android sans changement dans l'app (scripts, journal) : suivie avec la suivante qui change l'app, pour
    ne pas envoyer aux testeurs une build identique (v970, #891, scripts d'envoi seulement ; v971, #892, captures de la
    fiche Play) : suivies avec la v972 (#893, chiffre gris d'un lien pas assez net dans Analyses), le 10/11 à 15:00.
  - [x] **10/11 13:14** : 969.443 (v969) chez les testeurs ; 968.442 expirée ; restent 844.344 et 969.443.
  - [x] **10/11 19:00** : v975 (modifier une note de digestion dans le Journal) ; #437 mergée après captures ; déploiement
    lancé (975.451 sur TestFlight).
  - [x] **10/11 18:00** : v973 et v974 (Analyses sur Digestion ; tuiles du Journal → courbes, correctif 57 complété pour
    la VFC de l'app Santé) ; #436 mergée à 19:05 après captures (Journal clair, sombre et Santé), déploiement lancé.
  - [x] **13/11 18:34** : 1021.521 (v1021, #507) chez les testeurs ; 1019.513 expirée ; restent 844.344 et 1021.521.
  - [x] **13/11 10:29** : 1019.513 (v1019 + taille du texte de l'iPhone, #499) chez les testeurs ; 1019.510
    expirée ; restent 844.344 et 1019.513.
  - [x] **13/11 07:21** : 1019.510 (v1019 + geste de retour de l'iPhone, #496) chez les testeurs ; 1019.498 expirée ;
    restent 844.344 et 1019.510.
  - [x] **12/11 19:34** : 1019.498 (v1019, #484) chez les testeurs ; 1017.497 expirée ; restent 844.344 et 1019.498.
  - [x] **12/11 18:46** : 1017.497 (v1017, #482) chez les testeurs ; 1016.494 expirée ; restent 844.344 et 1017.497.
  - [x] **12/11 15:27** : 1016.494 (v1016, #480) chez les testeurs ; 1015.493 expirée ; restent 844.344 et 1016.494.
  - [x] **12/11 14:24** : 1015.493 (v1015, #479) chez les testeurs ; 1014.492 expirée ; restent 844.344 et 1015.493.
  - [x] **12/11 13:19** : 1014.492 (v1014, #478) chez les testeurs ; 1013.491 expirée ; restent 844.344 et 1014.492.
  - [x] **12/11 12:17** : 1013.491 (v1013, #477) chez les testeurs ; 1012.490 expirée ; restent 844.344 et 1013.491.
  - [x] **12/11 11:22** : 1012.490 (v1012, #476) chez les testeurs ; avant, 1010.489 (v1010, #475) à 10:21 ; 1009.488 et
    1010.489 expirées ; restent 844.344 et 1012.490.
  - [x] **12/11 09:27** : 1009.488 (v1009 et correctif 24, #474) chez les testeurs ; 1009.487 expirée ; restent 844.344
    et 1009.488.
  - [x] **12/11 08:28** : 1009.487 (v1009, #473) chez les testeurs ; 1008.485 expirée ; restent 844.344 et 1009.487.
  - [x] **12/11 07:17** : 1008.485 (v1008, #471) chez les testeurs ; 1007.484 expirée ; restent 844.344 et 1008.485.
  - [x] **12/11 06:11** : 1007.484 (v1007, #470) chez les testeurs ; 1006.483 expirée ; restent 844.344 et 1007.484.
  - [x] **12/11 05:15** : 1006.483 (v1006, #469) chez les testeurs ; 1005.482 expirée ; restent 844.344 et 1006.483.
  - [x] **12/11 04:05** : 1005.482 (v1005, #468) chez les testeurs ; avant, 1004.481 (v1004, #467) à 03:17 ; 1003.480 et
    1004.481 expirées ; restent 844.344 et 1005.482.
  - [x] **12/11 vers 02:00** : 1003.480 (v1003, #466) chez les testeurs (relevé de 02:04, examen accepté, distribuée) ;
    1002.479 expirée ; restent 844.344 et 1003.480. Disque de la session plein pendant ce déploiement : le script ne
    lisait plus les journaux des runs et a relancé l'envoi toutes les 5 min (8 fois, sans effet : « rien à faire, tout
    était fait ») ; arrêté, relevé et nettoyage relancés à part. Disque libéré (captures lues par l'API désormais).
  - [x] **12/11 00:17** : 1002.479 (v1002, #465) chez les testeurs ; 1000.477 expirée ; restent 844.344 et 1002.479.
  - [x] **11/11 22:10** : 1000.477 (v1000, #463) chez les testeurs ; 999.476 expirée ; restent 844.344 et 1000.477
    (première build à quatre chiffres : bien classée après la 999.476). Le run TestFlight était resté « en cours »
    (panne du service d'artefacts de GitHub à l'étape « Journaux », après l'envoi réussi à 20:18 UTC) : déploiement
    repris à la main depuis l'envoi de la fiche ; l'étape « Journaux » ne fait plus échouer le run.
  - [x] **11/11 20:23** : 999.476 (v999, #462) chez les testeurs ; 997.474 expirée ; restent 844.344 et 999.476
    (nettoyage relu : le bon run, script corrigé à 18:40).
  - [x] **11/11 18:39** : 997.474 (v997, #460) chez les testeurs ; 996.473 expirée ; restent 844.344 et 997.474.
    Script de déploiement : une réponse vide du relevé des runs était prise pour le nouveau run de nettoyage (le
    compte rendu montrait l'ancien) ; corrigé (identifiant non vide et différent exigé), le vrai nettoyage relu.
  - [x] **11/11 17:48** : 996.473 (v996, #459) chez les testeurs (examen accepté, distribuée) ; 995.472 expirée ;
    restent 844.344 et 996.473.
  - [x] **11/11 16:22** : 995.472 (v995, #458) chez les testeurs (examen accepté, distribuée) ; 994.471 expirée ;
    restent 844.344 et 995.472.
  - [x] **11/11 14:57** : 994.471 (v994, #457) chez les testeurs ; avant, 993.470 (v993, #456) à 14:16 ; 992.469 et
    993.470 expirées ; restent 844.344 et 994.471.
  - [x] **11/11 13:16** : 992.469 (v992, #455) chez les testeurs ; 991.468 expirée ; restent 844.344 et 992.469.
  - [x] **11/11 12:15** : 991.468 (v991, #454) chez les testeurs ; 990.467 expirée ; restent 844.344 et 991.468.
  - [x] **11/11 11:15** : 990.467 (v990, #453) chez les testeurs ; 988.464 expirée ; restent 844.344 et 990.467.
  - [ ] Captures : une notification du simulateur (« Prêt pour Apple Intelligence ») recouvrait l'en-tête de l'Accueil
    sur la capture de #454 (iPhone 16e, une fois) ; à surveiller, à fermer dans le workflow si elle revient.
  - [x] **11/11 07:58** : 988.464 (v988, #450) chez les testeurs ; avant, 987.463 (v987, #449) à 07:14 ; 986.462 et
    987.463 expirées ; restent 844.344 et 988.464.
  - [x] **11/11 07:00, personas du jour** (version 988) : reprise de la persona 4 Endométriose, iPhone seul, J14, après
    l'arrivée du cycle : 5 tâches sur 6 réussies (la veille 3), la ratée : le cycle relié aux douleurs (CYCLE-4
    d'Android) ; constats partagés relayés (`DEMANDES.md`, 11/11) ; aucun défaut propre à l'iPhone.
  - [x] **11/11 06:12** : 986.462 (v986, #448) chez les testeurs ; 984.460 expirée ; restent 844.344 et 986.462.
  - [x] **11/11 04:08** : 984.460 (v984, #446) chez les testeurs ; avant, 983.459 (v983, #445) à 03:15 ; 981.457 et
    983.459 expirées ; restent 844.344 et 984.460.
  - [x] **11/11 01:39** : 981.457 (v981, #443) chez les testeurs ; avant, 980.456 (#442, cycle dans Sources) à 00:48 ;
    980.455 et 980.456 expirées ; restent 844.344 et 981.457.
  - [x] **10/11 23:57** : 980.455 (v980, règles notées depuis Aujourd'hui) chez les testeurs ; 979.454 expirée (979.454
    y était depuis 23:21 : cycle de Santé dans le Journal) ; restent 844.344 et 980.455.
  - [x] **10/11 22:36** : 977.453 (v977, cycle lu et autorisé, rien d'affiché encore) chez les testeurs ; 975.451
    expirée ; restent 844.344 et 977.453.
  - [x] **10/11 20:17** : 975.451 (v975) chez les testeurs, chaîne entière sans intervention ; 974.450 expirée ;
    restent 844.344 et 975.451.
  - [x] **10/11 19:23** : 974.450 (v974) chez les testeurs, chaîne entière sans intervention (script corrigé) ;
    972.447 expirée ; restent 844.344 et 974.450.
  - [x] **10/11 16:36** : 972.447 (v972) chez les testeurs (soumise par `deploy.sh` au 2e essai, la build n'étant pas
    encore traitée au 1er) ; nettoyage (run 42850282884) : 969.443 expirée ; restent 844.344 et 972.447. `deploy.sh`
    bloqué au relevé : `gh run list` passe par `repositories/{id}/…`, refusé par le proxy de la session (403) →
    `latest()` en REST (`repos/…/actions/workflows/…/runs`), garde sur un identifiant vide.
  - [x] **10/11 13:00, personas du jour** (version 969) : persona 4 Endométriose, iPhone seul, J14
    (`journal/simulations/2026-11-10-1300-*`) ; constats partagés relayés (`DEMANDES.md`, 10/11).
  - [x] **Proposition (mode polish) : lire le cycle depuis l'app Santé sur iPhone** — ✅ acceptée (« Ok cycle », 10/11
    18:50, `POUR-IOS.md` 18:55) ; suite dans **CYCLE-iOS** ci-dessous. (règles notées dans Santé ou une
    app de cycle) ; à préparer avec maquette, en accord avec la décision d'Android sur la saisie du cycle. **10/11
    15:15** : proposition et deux maquettes (`journal/maquettes/cycle-sante/`), question au propriétaire
    (`POUR-ORCHESTRATEUR.md`) ; rien codé sans son accord. Liée à PROP-SIM-10 et I34 d'Android.
  - Personas (décision (C)) : les passages continuent (chaque jour), mais ne bloquent plus chaque envoi ; une
    régression trouvée part dans la build suivante.
  - « À tester » (`store/app-store/fr-FR/testflight-a-tester.txt`) : écrit pour la 918 ; à rafraîchir quand l'app
    change de façon visible pour les testeurs. Relu le 10/11 à 16:30 (v972) : tout ce qu'il cite existe encore
    (« Vos données du jour », Tendances à deux courbes, « Votre avis »), inchangé.
  - [x] **Captures de démo, Analyses** : depuis le 10/11 (captures de la v955 et après), « Pistes à tester » dit « Aucun
    lien assez net… » au lieu de la piste verrouillée du 9/11 : les données de démo d'Android (`scripts/visual/
    demoData.mjs`) dépendent de la date. Pas une régression d'une version ; à regarder si la capture de la fiche App
    Store doit montrer une piste (relais à Android par `DEMANDES.md` si c'est leur générateur).
    **Clos le 10/11 à 17:10** : même écran chez Android (capture de sa fiche Play du 10/11, compte rendu
    `2026-11-10-1335-fiche-captures.md` : « Aucun lien assez net » gardé tel quel, « c'est l'écran honnête ») ; sur
    iPhone, la capture tourne sans abonnement (fin de la période de lancement le 06/11) : « Ce qui va avec » et « À
    regarder » y sont masqués (`locked` dans `Recommendations.jsx`), d'où l'écran presque vide. Pas une régression.
    Les captures de la fiche App Store ne sont pas refaites (`captures=false`, décision du propriétaire).

- [ ] **CYCLE-iOS — lire le cycle de l'app Santé** (décision du propriétaire du 10/11 vers 18:50, « Ok cycle »,
  `POUR-IOS.md` 18:55 ; exception au mode polish). Android fait d'abord la brique partagée (CYCLE-1a à CYCLE-3 de son
  BACKLOG) ; ici, dès qu'elle est sur son main :
  - Brique partagée d'Android lue le 10/11 (CYCLE-1a, #898, `services/cycle.js`) : entrées ordinaires `type: 'cycle'`
    (aucune migration) ; `periodEntry(dateKey, flow, source)` (flux `light` / `medium` / `heavy` / `unknown`),
    `spottingEntry`, `symptomEntry` (5 symptômes : `cramps`, `pelvic_pain`, `bloating`, `headache`, `fatigue`) ;
    `cycleByDay`, `cycleVisible(goals, hasData)`. Affichage (CYCLE-1b) pas encore là.
  - Correspondance Santé → brique partagée : `menstrualFlow` (`HKCategoryValueVaginalBleeding` depuis iOS 18 :
    unspecified → `unknown`, light, medium, heavy ; none → rien), `intermenstrualBleeding` → `spotting`,
    `abdominalCramps` → `cramps`, `pelvicPain` → `pelvic_pain`, `bloating`, `headache`, `fatigue`. Constipation et
    diarrhée (de la proposition) n'ont pas de symptôme partagé : demande dans `DEMANDES.md` (10/11).
  - [x] **CYCLE-iOS-1** ✅ 10/11 20:00 (PR cycle, avec Android v977) — Lecteur natif (Swift) : correspondance pure dans `ios/HalcyaRules` (XCTest), petit plugin qui lit
    ces types sur la période d'import (6 mois, puis à chaque synchro) ; côté web, les entrées faites par la brique
    partagée, source `health_connect` (comme les autres mesures de Santé sur iPhone), sans doublon (Vitest).
  - [x] **CYCLE-iOS-2** ✅ 10/11 20:20 (même PR) — Autorisation : avec « Mon cycle » coché à l'accueil, les types du
    cycle dans la **même feuille d'Apple** que les autres mesures (`CycleHealth.requestAuthorization({ read, cycle })`,
    correspondance des 15 mesures du module dans `CycleRule.readTypeIdentifiers`, XCTest ; la demande du module qui
    suit ne montre plus rien) ; jamais demandé sans « Mon cycle ». Coché plus tard dans les Paramètres (correctif 59) :
    feuille du cycle seul, puis 6 mois relus, si Santé est déjà autorisée. Phrase d'accès à Santé, page de
    confidentialité iPhone et `confidentialite.md` complétées. Reste pour les testeurs qui ont déjà « Mon cycle » :
    le bouton de la source (CYCLE-iOS-3). Leçon (build de la PR #439) : ne jamais rendre un plugin de Capacitor
    depuis une fonction `async` (il répond à `then`) : le ranger dans un objet.
  - [x] Saisie des règles à la main (CYCLE-2 d'Android, v980) : sans travail ici ; PR v980 après #440.
  - [x] **CYCLE-iOS-3** ✅ 10/11 23:20 (PR après #441) — Sources : « cycle » parmi les mesures reçues de « Mes
    appareils » (correctif 60, `METRICS` ; jamais « arrêté », le cycle arrive par épisodes) ; carte « Suivi du cycle
    (Santé) » avec « Lire mon cycle dans Santé » pour qui a « Mon cycle » et a autorisé Santé avant (correctif 61,
    `CycleSanteCard`, `shouldOfferCycleSante`), une fois : le cycle demandé est noté (`halcya_ios_cycle_asked`).
    À relayer à Android avec CYCLE-3 : `cycle` dans `METRICS` (Health Connect aussi).
  - [x] Le Journal (« Règles · 2e jour », maquette 1) : CYCLE-1b d'Android (v979), sans retouche ; test de bout en bout
    Santé → Journal sur iPhone ; constipation et diarrhée lues (`SYMPTOMS` complété par Android à notre demande) ;
    note de Nouveautés iPhone `2026-11-10-2200-cycle-sante-iphone.json`.

- [ ] **POLISH — mode polish dès le 9/11** (décision du propriétaire du 07/11 au soir, `POUR-IOS.md` 08/11 00:35) : à
  partir de la version envoyée aux testeurs le dimanche 8/11 au soir, plus de nouvelle fonction sur iPhone ; bugs,
  polissage, textes en trop, retraits ; une idée propre à l'iPhone = proposition avec maquette dans `journal/maquettes/`
  (ou relayée par `POUR-ORCHESTRATEUR.md`), jamais codée sans accord. Le suivi d'Android continue. Le 8/11 : corrections
  du propriétaire d'abord.
  - [x] **8/11 14:00, correctif 50** : Analyses, piste verrouillée (sans abonnement) : la barre floutée était invisible
    (`span` vide hors conteneur flexible) ; titre verrouillé en `flex`, test CSS, note de Nouveautés iPhone ; demandé
    à Android (`DEMANDES.md`) : à retirer quand Android l'aura corrigé.
  - [x] **9/11 02:00, correctif 54** (remplace le 51, sans effet) : tuile des repas du Journal, « ≈ 1 039 kca / l » sur
    390 points ; cause : espace insécable entre nombre et unité ajoutée à l'affichage (`frenchSpacing.js`) ; marge et
    espacement des chiffres un peu réduits sous 400 px ; mesuré d'une ligne dans l'outil des personas ; note de
    Nouveautés iPhone corrigée. **Retiré le 9/11 05:00** : Android l'a réglé dans le code commun (v931, #854).
  - [x] **9/11 04:00, correctif 55** : nouvel accueil, ligne « Temps d'écran » proposée même avant iOS 26.4 (le
    correctif 44 ne couvrait que la carte de Sources) ; masquée quand `checkPhoneUsageAccess` répond `supported: false`,
    sauf si déjà activée ; test dans `Onboarding.appstore.test.jsx` ; note de Nouveautés iPhone.
  - [x] **9/11 10:00, correctif 56** : VFC de l'app Santé (SDNN, Apple Watch). Journal : tuile grise avec l'icône par
    défaut (« VFC (SDNN) » absente de `CHIP_KEYS`) → icône et couleur de la VFC, sans « d'habitude » ; Tendances : aucune
    courbe de VFC sur iPhone → mesure `hrvSdnn` « VFC (SDNN) » (rose, en ms, à part de la RMSSD) ; Accueil : la ligne
    « VFC (SDNN) » ouvrait `/tendances?mesure=hrv` (vide) → `hrvSdnn`. Tests `dailyJournal.ios`, `trendsData.ios`,
    `TodayBySource.ios` ; note de Nouveautés iPhone.
  - [x] **9/11 11:00, correctif 57** (avec la v937 d'Android, POLISH-SIM-22 : « d'habitude » de la VFC d'hier) : les
    normes (`dayDeviations.js`) ne lisaient pas la SDNN de l'app Santé ; mesure `hrvSdnn` à part (« VFC plus haute /
    basse », 4 ms au moins), SDNN lues avec les autres mesures ; la ligne « VFC (SDNN) » de l'Accueil prend cette norme
    (correctif 56, refait sur la v937), et la tuile du Journal aussi (ci-dessous). Tests `dayDeviations.ios`,
    `TodayBySource.ios` ; note de Nouveautés iPhone.
  - [x] **« d'habitude » de la SDNN dans le Journal** (même run, correctif 57) : la tuile « VFC (SDNN) » (clé `hrvDay`
    pour l'icône et la couleur) prend la norme `hrvSdnn` (`DailyJournal.jsx`, une ligne) ; « ↑ d'habitude » quand
    l'écart est net, comme la VFC nuit d'Android. Test `DailyJournal.ios.test.jsx` (échoue sans le correctif).
  - [x] **13/11 06:00, geste de retour** (passage des personas du 13/11, persona 7 « Stressé et pressé ») : Réglages,
    Paramètres et Données n'avaient aucun moyen de revenir sur iPhone hors roue dentée et onglets (pas de bouton retour
    comme sur Android, pas de balayage dans la vue web) ; `allowsBackForwardNavigationGestures` dans
    `HalcyaBridgeViewController` (balayage depuis le bord gauche = `goBack()`, comme le bouton retour d'Android),
    XCTest `BackGestureTests` (vert sur #496), note de Nouveautés iPhone ; à essayer sur l'iPhone 12.
  - [ ] « Autre moyen : un ticket GitHub » sous « Votre avis » (correctif 27) : mot technique pour un testeur d'iPhone
    (persona 7) ; à la sortie sur l'App Store, le remplacer par la page de l'app sur l'App Store (« Noter »), ou le
    retirer si le formulaire suffit.
  - [ ] Contrôles « façon Android » relevés par la persona 7 (onglets soulignés, boutons radio et cases carrées,
    fenêtres au milieu de l'écran plutôt qu'en feuille) : identité visuelle commune ; proposition avec maquette au
    propriétaire seulement s'il le souhaite, jamais codé sans accord.
- [ ] **INTÉGRATIONS (seule exception au mode polish)** — 8/11 09:00 : Android a commencé par Garmin et Samsung (INTEG-1,
  étude dans `journal/protocoles/garmin-samsung.md` d'Android) ; côté iPhone, Garmin arrive déjà par l'app Santé (configuration 9) ;
  à relire quand Android choisira une voie d'accès directe.
  [ ] **INTÉGRATIONS (seule exception au mode polish)**, dans l'ordre : 1) Garmin et Samsung ; 2) Withings ; 3) Huawei
  en direct sur Android et **Huawei sur iPhone (Huawei Health Kit)** ; 4) Xiaomi. Ce qui arrive déjà par l'app Santé se
  prend là ; l'accès direct sert à ce qui y manque. Garde-fous : coexistence avec l'app du fabricant ; jamais le mot de
  passe d'un autre service ; jamais de code décompilé ni de clé extraite ; secrets d'API seulement sur le relais (chez
  Android) ; relais de passage sans stockage ; tout stockage de santé sur un serveur attend l'accord du propriétaire ;
  comptes développeur et contrats : gestes du propriétaire, préparés pas à pas. Côté iPhone, à faire quand Android
  attaque le point 3 : étude de Huawei Health Kit sur iOS (SDK, licence, ce qui manque dans l'app Santé).
- [ ] **PERSONAS — simulation avant chaque envoi aux testeurs** (décision (C)) : un agent sans connaissance de l'app,
  accès visuel seul (captures, clics, saisie), persona et matériel tirés au hasard (parts de marché), moments J1 / J14 /
  J45 sur données de démonstration synthétiques ; configurations iPhone de l'artefact « Personas et matériel »
  d'Android (`journal/PERSONAS.md`, `journal/simulations/`, outillage en cours chez Android). Côté iPhone : brancher le
  passage sur les captures du simulateur avant `store-beta-submit.yml`, dès que l'outillage d'Android existe.
  **8/11 05:00** : l'outil existe chez Android (`npm run persona`, premier passage à 03:40, `journal/simulations/`) ;
  Android note que les configurations iPhone (2, 3, 9, 10, 11…) ont été jouées sur l'apparence Android et sont à
  rejouer sur la build iPhone (`--store=appstore`, son POLISH-SIM-9). À faire ici avant l'envoi aux testeurs du 8/11
  au soir : lancer l'outil d'Android dans `upstream/app` en variante appstore pour les configurations iPhone, rapports
  dans `journal/simulations/` de ce dépôt, constats propres à l'iPhone en POLISH (le reste relayé par `DEMANDES.md`).
  **8/11 09:30 : correctif 49** (`persona-browse.mjs --store=appstore`) : variante appstore et écran de 390 × 844 (iPhone
  12). Essai : l'app s'ouvre, gestes et captures marchent. **Limites du navigateur** (à dire à chaque agent et à ne pas
  rapporter comme défauts) : sans plateforme iOS, la source de santé s'affiche « Health Connect » au lieu de « App
  Santé » ; sans module natif, la lecture du visage dit « Bientôt sur iPhone » ; les données de démo de l'outil sont
  celles d'Android (« Samsung Health »). Pour lever ces limites : faire passer le navigateur pour un iPhone (plateforme
  `ios`, faux modules comme ceux de `captureMode.js`) ; sinon, garder le passage pour les textes, la mise en page à
  390 points et les parcours.

## Idées et questions ouvertes

- **Médiateur de la consommation (P26 d'Android), reporté par le propriétaire le 2/11** : à traiter aux 10 premiers
  utilisateurs payants (adhérer, ou se renseigner clairement ; candidats : Médiation Solution, CM2C, SMP). Ne bloque
  pas la mise en vente ; **ne pas le redemander d'ici là**. Le jour venu, les conditions de l'iPhone
  (`overlay/app/public/conditions-iphone.html`) devront nommer le médiateur choisi, comme celles d'Android.

- Sur l'iPhone 12 : toucher « Prendre une photo » (repas) et « Utiliser ma position approximative » (Météo) ; les phrases d'usage sont en place depuis le 28/10 (PR #45), le simulateur n'a ni caméra ni position réelle.

- Raccourci ou widget « Lire mon bien-être » pour compenser l'absence de lecture au déverrouillage.
- Apple Watch : HealthKit couvre déjà sommeil, FC, VFC, pas — atout de la version iOS.
- Huawei Santé sur iOS écrit une partie de ses données dans Santé : vérifier lesquelles (sommeil ? VFC ?).
  **8/11 15:10 : premier passage iPhone** (v911, deux simulations J45 en iPhone seul : persona 6 « maigrir » et 4
  « endométriose » ; `journal/simulations/2026-11-08-1510-synthese.md`) : « kca l » du Journal corrigé (correctif 51) ;
  limites de l'outil écartées (partage du PDF, IA des repas décrits) ; constats du code partagé relayés (`DEMANDES.md`) ;
  idées de fonction (poids, cycle de l'app Santé, douleur plus précise) à proposer avec maquette. Prochain passage : sur
  la dernière version du soir, avant l'examen bêta.
- [x] **Livraison continue (décision du propriétaire du 04/11 19:45)**, test interne : depuis le 04/11 au soir,
  `testflight.yml` part seul sur chaque push de `main` qui change l'app (plus de lancement à la main).
  Pas d'espacement comme Android (CD-ALPHA-2, une version par jour sur Alpha) : le test interne n'a pas d'examen ;
  à espacer seulement si un groupe externe est ouvert après la soumission.
- [ ] **Retours du premier testeur iPhone, point (5) (décision du propriétaire du 06/11 au soir, `POUR-IOS.md` de
  22:35)** ; les points (1) à (4) sont traités chez Android, dans le code partagé (BACKLOG d'Android « Retours du
  premier testeur iPhone », `journal/RETOURS-TESTEURS.md`) :
  - [x] toutes les autorisations pendant l'accueil, avant d'entrer dans l'app : Santé (avec son historique), position
    approximative (météo), caméra. **Santé fait (7/11, correctif 45)** : l'étape est proposée à tous sur iPhone (avec
    ou sans montre : l'iPhone écrit ses pas dans Santé) et le premier import remonte 6 mois (`IOS_FIRST_IMPORT_DAYS`
    = 180, comme Sources) au lieu de 30 jours ; avant, un nouvel utilisateur restait à un mois d'historique (le choix
    de Sources n'apparaît plus après le premier import). Tests dans `Onboarding.appstore.test.jsx` et
    `firstImport.appstore.test.js`. **Position et caméra faites (7/11, correctif 46)** : étape « Ce que Halcya peut
    utiliser » propre à l'iPhone, après Santé (`overlay/app/src/ios/PermissionsStep.jsx`) : une ligne par accès avec sa
    raison et « Autoriser » ; la position suit le chemin de la carte météo (explication `location`, lue une fois, arrondie
    ≈ 10 km, météo branchée) ; l'appareil photo par `FaceSense.requestCamera` (nouvelle méthode native, n'active pas la
    lecture du visage) ; « Continuer » toujours possible. Tests (`PermissionsStep.appstore.test.jsx`, accueil, plan des
    captures : autorisations à l'écran 4, visage 5, geste 6) ;
  - [x] mention propre à Android dans la source Santé (7/11, correctif 43) : la carte App Santé héritait de la fenêtre
    de lecture de Health Connect (`readWindowDays` = 29) : elle affichait « Android laisse lire les 30 jours qui
    précèdent votre première autorisation » **et n'importait qu'un mois d'historique** (`syncSince`, `firstImport`,
    `autoSync`), alors que HealthKit n'a pas cette limite. Sur iPhone : pas de fenêtre (`isIos() ? null : …`), tout
    l'historique choisi (jusqu'à 2 ans) ; test dans `HealthConnectConnector.ios.test.js` ;
  - [x] temps d'écran sous iOS 26.4 (7/11, correctif 44) : la carte n'est plus proposée quand `checkAccess` répond
    `supported: false` et qu'elle n'a jamais été activée (si elle l'avait été, elle dit toujours de mettre l'iPhone à
    jour) ; test dans `PhoneUsageCard.appstore.test.jsx`. Note de Nouveautés propre à l'iPhone
    (`2026-11-07-0030-sources-iphone`).
  Tout part sur TestFlight ; la build 844.344 attachée pour la soumission ne change pas sauf « attacher la dernière ».
- [ ] **Examen bêta d'Apple, relevé à chaque run (décision du propriétaire du 06/11 vers 18:20)** : état des builds du
  groupe externe « Testeurs Halcya » lu par l'API, en lecture seule (`store-beta.yml`, `scripts/store-beta.mjs`, tests :
  que des GET, lien public jamais demandé ni affiché). À 18:17 (relevé du propriétaire) : 817.312 et 839.337 « Waiting
  for Review ». **20:01 : 817.312 acceptée** ; **7/11 00:02 : 839.337 acceptée** (message au propriétaire, #348) (`APPROVED`, `BETA_APPROVED`), message au propriétaire ; 839.337 en attente. Dès qu'une build passe en test (lien public utilisable) ou est refusée : en tête de
  `POUR-ORCHESTRATEUR.md`, avec le motif s'il est lisible (l'API ne le donne pas : App Store Connect → TestFlight ou
  l'e-mail d'Apple) et la correction proposée. Rien soumis ni changé dans App Store Connect.
- [x] Testeurs **externes** : **fait par le propriétaire le 05/11 vers 23:00** : groupes « Interne Halcya » et
  « Testeurs Halcya », build 817.312 soumise à l'examen bêta, lien public gardé par lui (jamais écrit dans un dépôt).
  Décision du propriétaire du 05/11 vers 20:15 : TestFlight externe (remplace « ok test
  interne » de 12:00) ; il crée le groupe et soumet la build à l'examen bêta ; textes prêts dans
  `store/app-store/testflight-externe.md` (05/11 22:00). Ancienne décision : « ok test interne »,
  TestFlight reste en test interne jusqu'à la soumission du 7 ou du 8/11 (pas de testeurs externes, pas de Beta App
  Review). À revoir après la soumission, avec la fusion des deux routines.
- [x] **Photo des selles (Android v809, SELLES-PHOTO-2)** : masquée sur iPhone le 5/11 après-midi (correctif 42), rouverte
  le soir même sur décision du propriétaire (05/11 vers 20:15, dans la soumission) : correctif 42 retiré, notes de
  Nouveautés montrées, `NSCameraUsageDescription` (selles), section dans `confidentialite-iphone.html`,
  `PrivacyInfo.xcprivacy` et `confidentialite.md` (type « Santé »), `notes-examen.md`. Le propriétaire coche « Santé »
  dans « Confidentialité de l'app ». L'assertion App Attest couvre `/v1/stool/analyze` (correctif 38).
- [x] **Retours des utilisateurs (même décision)**, « Votre avis » : formulaire d'Android v782 (AVIS-RELAIS-2) repris
  sur iPhone le 5/11 : `variant: "ios"`, `X-Platform: ios`, assertion App Attest sur le corps exact (correctif 38),
  lien de secours vers un ticket du dépôt de l'iPhone (correctif 27), section dans la confidentialité de l'iPhone.
  À vérifier quand Android annonce le relais déployé : un avis envoyé depuis TestFlight arrive bien (bilan du relais).
  Depuis Android v784 (AVIS-RELAIS-3), le résumé anonyme quotidien (`journal/AVIS.md` d'Android, lu sans y toucher)
  compte les avis par variante : la ligne `ios` dira si les avis de l'iPhone arrivent. Relais déployé (bilan
  d'Android du 5/11, #702) : 0 avis au premier résumé.
- [x] **Taille du texte d'iOS** (écart vu avec Android v771, FONT-SCALE-1) — **fait le 13/11 (#499)** : la police de
  `<html>` suit la taille du texte d'iOS (`TextSize.swift`, plafond × 2 comme Android, suivie sans relancer l'app), comme
  la WebView d'Android agrandit le rem ; XCTest `TextSizeTests` ; 3e passage de captures en très grand texte (× 1,35)
  sur le petit iPhone à chaque build (+12 min). Écarté : `-webkit-text-size-adjust` (texte multiplié après les plafonds
  `min(1em, …cqi)` d'Android). Les notes « grande police » d'Android
  (4, 6 et 9/11) restent masquées sur iPhone (correctif 28 : antérieures) ; la note iPhone du 13/11 les résume. À essayer
  sur l'iPhone 12 (Réglages › Luminosité et affichage › Taille du texte).
- « FC nuit » sur iPhone (Android v746, MONTRE-SCORE) : Android l'affiche dans « Vos derniers jours » à partir du
  résumé de nuit de la montre Huawei en direct ; sur iPhone, la même pastille pourrait se calculer avec les mesures de
  cœur de l'app Santé prises pendant la nuit (Apple Watch, Huawei Santé). Ce serait un calcul propre à l'iPhone (une
  moyenne pendant le sommeil compté) : à proposer à Android d'abord (`DEMANDES.md`) pour que les deux versions
  donnent le même chiffre. Le « Score montre » n'a pas d'équivalent : le score de sommeil d'Apple n'est pas lisible par
  les apps (forum des développeurs d'Apple, sept. 2025).

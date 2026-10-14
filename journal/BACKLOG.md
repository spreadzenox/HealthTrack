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

## 🎯 PRIORITÉ ABSOLUE (12/10/2026 au soir) — D3 avant tout, hors runs « idées »

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
- [ ] Accueil, suite : « Radar forme » + « Votre cœur vs votre norme » + « Régularité du sommeil » → un seul bloc « Forme »
- [x] Analyses : « Écran tard » apparaît 2 fois (tag mesuré dans « Vos habitudes » + variable continue « Écran tard
      (veille au soir) » dans les corrélations) → n'en garder qu'une présentation
- [x] Analyses : la liste des corrélations affiche ~45 variables dont ~35 « incertaines » pâles → n'afficher que les
      liens au moins « à confirmer » + « voir les N autres »
- [x] Paramètres : la configuration Withings (Client ID / Secret / URL) est dans Paramètres, l'interrupteur dans
      Connecteurs → tout regrouper dans la carte Withings des Connecteurs
- [x] Accueil : « + 1 cigarette » seulement si une cigarette notée ces 14 jours, ou épinglé dans Paramètres → Cigarettes
      (run 12/10 18:30 Paris ; écran tard dédoublonné, corrélations incertaines repliées, Withings regroupé : même run)
- [ ] Connecteurs : intro + 6 blocs empilés → ordre par statut (ce qui envoie / ce qui reste à brancher)

### D2 — Performance (mesurer d'abord)
- [x] Mesure : `npm run perf` (build de prod, 3 ans de démo, `--dense`, CPU ×4) — temps stabilisé, temps bloquant,
      lectures IndexedDB par page (run 14/10 00:30 ; chiffres dans son compte rendu). Reste : profil fin des calculs
- [x] `listEntries` / `getLatestEntryAt` / `listEntriesForAnalysis` : requêtes par index et par plage, index
      `type_at` (schéma v3) — Accueil 3 046 → 1 289 ms, 128 552 → 16 884 enregistrements lus (run 14/10 00:30)
- [ ] Cache d'agrégats journaliers / hebdo précalculés, invalidés à l'écriture (`health-entries-updated`)
- [x] Web Worker pour l'analyse + cache des résultats invalidé à chaque écriture (révision des données) : Accueil
      1 289 → 271 ms, Analyses 1 503 → 295 ms ; garde-fou « aucun écran n'importe un calcul lourd » (run 14/10 04:30)
- [x] Code splitting : pages en `React.lazy` (sauf l'Accueil), table Ciqual chargée à la demande
      (`data/nutritionTable.js`, `ingredientNames.js` supprimé = clés de la table), JSON en `JSON.parse` : fichier
      principal 2 125 → 514 ko, temps bloquant de chaque page 100–150 → 0–17 ms ; CSS gardé d'emblée dans l'ordre
      d'origine (`pageStyles.js`) ; garde-fou `bundleGuard.test.js` (run 14/10 06:30)
- [ ] Nutrition par le runner (28 lectures, 15 k entrées) ; `upsertEntries` relit tout le magasin à chaque synchro
- [ ] Sous-échantillonnage des longues séries, graphiques chargés en différé
- [x] Test anti-régression : Vitest échoue si une lecture filtrée relit tout le magasin (run 14/10 00:30)
- [ ] Budget `npm run perf` en CI (lectures par page ≤ N, temps bloquant de l'Accueil) — les temps sont bruités
      (± 200 ms), viser plutôt le nombre d'enregistrements lus
- [ ] Accueil : `WellbeingCharts` lit encore `listEntriesForAnalysis` (≈ 15 k entrées) → agrégats journaliers
- Piste détaillée (run idées 12/10 20:30, I43) : index composé `[type, date]` (migration = ajout d'index seul),
  `listEntries({types, from, to})` par `IDBKeyRange`, magasin `daily_agg` versionné, LTTB ≥ 2 000 points dans un Worker,
  test « Accueil lit ≤ N entrées » — `localHealthStorage.js` fait aujourd'hui 7 `getAll()` sur tout le store

### D3 — Huawei Watch GT 6 Pro en direct (sans Gadgetbridge) — 🎯 PRIORITÉ ABSOLUE
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
- [ ] Pilote enregistré dans le registre générique (`src/devices/ble/drivers.js` → registre de familles de protocoles,
      transport classique ou BLE) pour ajouter d'autres montres ensuite

### D4 — Humeur par signaux émotionnels directs (visage, voix, réseaux sociaux)
- [ ] Étude des limites Android réelles (caméra / micro en arrière-plan, service de premier plan, indicateurs,
      Accessibility, UsageStats) + choix du modèle local (MediaPipe / TFLite / ONNX) → `RESEARCH.md`
- [ ] Capture opportuniste (au déverrouillage / à l'usage), scores seuls stockés, jamais d'image ni d'audio brut
- [ ] Usage des réseaux sociaux (UsageStats par app) — décider : entrée de l'estimateur **ou** X (D5).
      Proposition (I42) : **X**, minutes par app sociale via `queryEvents` du plugin existant, exclu de l'estimateur
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
      seulement s'il tient sur l'A56 (≤ 20 Mo, < 300 ms) — remplace à terme le formulaire de check-in (D1)

### D5 — Anti-circularité (Y ≠ X)
- [ ] Liste déclarée des entrées de l'estimateur d'humeur + test qui échoue si une variable est aussi un facteur des
      corrélations / du modèle / des tags
- [x] Estimateur comportemental retiré de l'affichage (carte « Humeur estimée », run 12/10 16:30 Paris)
- [ ] Revue des pièges : ordre temporel (X avant Y — ex. pas **du jour** vs bien-être du jour), comparaisons multiples
      (déjà BH), taille minimale, formulations « va de pair » partout
- [ ] Garde-fous visibles (I46) : X de la veille, ≥ 30 paires pour afficher / ≥ 90 jours pour « solide », préblanchiment
      AR(1), « k liens nets sur m testés » ; expériences ABAB randomisées pour un lien à confirmer (I45, plus tard)

### D6 — Science personnelle, pas de normes imposées
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
      avancé unique de 24 h ; message clair dans la bannière si Android bloque — à décider avec le propriétaire

## Prochaines étapes (ordre conseillé)

Réordonnées le 12/10 (22:30 Paris) : **priorité absolue = D3 (montre)**, puis D1 → D6 (sauf D3), hors runs « idées ».

1. ⌚ **D3 — ATTENDRE / LIRE LE JOURNAL v120** (le test du 13/10 20:42 était en v119, avant le correctif : échec
   identique attendu, `diagnostics/2026-10-13-2042-gt6pro-v119.md`) (app ≥ v120, lecture tolérante + variantes du jeton livrées le 13/10 22:30,
   §6.9–6.10). Selon le journal : `bind` ok → vérifier `auth`, `check` (batterie), `sync` sur la vraie montre ;
   `tokenCheck.matched` = « X + ordre » → implémenter cet ordre côté téléphone (jeton du téléphone en miroir) ;
   `tokenCheck.matched` nul → regarder les tailles (`idPeer` 64 o = identifiant texte de 64 caractères ?) et la casse
   / le format de notre `peerAuthId` ; erreur 0x8002+ → lire `class`/`errorCode` de l'étape 2 ; `trailingBytes` > 1 sur
   une autre réponse → rien à faire (déjà toléré). Ne **pas** ajouter de NUL à nos envois.
2. ⌚ **Lire chaque nouveau journal du propriétaire** dès qu'il arrive (`journal/diagnostics/`).
   **En attendant (run de code, petit, sans risque) — I63** : rendre lisibles d'avance les étapes 0x8002 → 0x8004 et
   0x11 → 0x13 (erreurs typées `final_unexpected` / `return_mac_mismatch` / `auth_token_missing` /
   `auth_token_decrypt_failed` / `final_error` + `errorCode`, `trailingBytes` par réponse, scénarios fausse montre) ;
   si la montre coupe ou se tait juste après l'authentification → issue qui propose l'identifiant de compte Huawei
   (cas GB #6731). Recoupement complet avec Gadgetbridge : `protocoles/huawei.md` §6.11 (aucun calcul à changer).
3. ⌚ **D3 (d quater)** arrière-plan app fermée, selon le plan I49 (CDM + client Java, filet WorkManager). (d) livré le
   13/10 04:30, (d ter) le 13/10 06:30, (d bis) capacités / séances / sommeil détaillé le 13/10 10:30 ; reste de
   (d bis) : stress, VFC de journée, échantillons de séance. **À ne traiter qu'une fois l'appairage réel débloqué.**
4. ⚡ D2 — performance : mesure et lectures par index (14/10 00:30), calculs dans un Worker + cache (14/10 04:30),
   **découpage du bundle (14/10 06:30)** ; reste : Nutrition par le runner (28 lectures, ≈ 0,8 s), `upsertEntries` par
   index, `WellbeingCharts` par agrégats, budget en CI (enregistrements lus).
5. 🧹 D1 — restes : bloc « Forme » unique sur l'accueil, Connecteurs ordonnés par statut, tags « Sport le soir » /
   « Voyage » auto-détectés ; `--border` inexistant utilisé par `.settings-input` (corriger globalement).
6. 🙂 D4 — humeur par visage / voix / réseaux sociaux (service caméra de premier plan « niveau 2 », guide Shizuku / ADB) ;
   faits du 14/10 : visage = blendshapes MediaPipe par défaut (AUC visage ≈ 0,6 → tendance 7 j), voix = prosodie
   maison (I67), réseaux sociaux = temps au premier plan par app seulement ; sur Android 15+, « paramètres restreints »
   bloque aussi l'accès aux données d'utilisation des APK hors magasin → le guide doit l'expliquer.
7. 🔁 D5 — liste déclarée des entrées de l'estimateur + test anti-circularité (à livrer avec D4 au plus tard).
8. 🧭 D6 — pistes et messages neutres / personnels (`LEVER_ACTIONS`, `direction`).
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
12. 💡 Prochain run idées (14/10 20:30 Paris) : journal v120+ s'il arrive ; licence AffectNet ; Whisper / Vosk fr sur
    Exynos 1580 ; comptes rendus de labo français ; compte Huawei exigé ou non par une montre jamais liée.

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

- [x] 2026-10-13 — D3 (a quater) : l'instrument de diagnostic donne la **taille** de chaque champ de la réponse « New Auth » (octets / caractères / type, jamais la valeur) → décoder d'un seul journal ; écran « challenge (16 o), epk (32 o)… » (run 18:30 Paris)
- [x] 2026-10-13 — D3 (c bis) : primitives crypto « New Auth » X25519 / Ed25519 sur @noble/curves, vecteurs RFC 7748 / 8032 (run 16:30 Paris)
- [x] 2026-10-13 — D3 (a ter) : l'instrument révèle les **champs** d'une réponse « New Auth » non-JSON (noms, sans valeur) ; spec §6.8 (run 14:30 Paris)
- [x] 2026-10-13 — D3 (d ter) : resynchro automatique de la montre à l'ouverture / au retour dans l'app (≤ 30 min, essais espacés, pause sur clé refusée), ligne d'état (run 06:30 Paris)
- [x] 2026-10-13 — D3 (d) : synchronisation simple (heure, sommeil léger / profond, minutes → pas, calories, FC, SpO₂, FC repos) → IndexedDB, « Synchroniser la montre » (run 04:30 Paris)
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

# Idées — le hub de santé et de vie ultime

> Alimenté par les runs « idées » (08 h et 20 h, heure de Paris). Chaque idée : **besoin servi**, **impact** (1–5),
> **faisabilité** (1–5, 5 = facile), **pistes d'implémentation**, **sources** (datées). Les meilleures entrent dans
> `BACKLOG.md`. Notation : [V] vérifié sur la source, [T] source tierce / commerciale, [H] hypothèse.
>
> Question de départ, à se reposer à chaque run : *« pour un hub qui suit ma santé et ma vie, de quoi aurais-je besoin,
> qu'est-ce qui me changerait vraiment la vie ? »*

---

## Run du 13/10/2026 20:30 (Paris) — la montre débloquée par un octet, puis consolider la journée

Question du jour, côté utilisateur : *« ma montre répond enfin à HealthTrack — qu'est-ce qui manque pour que ça marche
pour de bon, et qu'est-ce qui me donnerait, chaque matin, une lecture de mon état aussi utile que les "Vitals" de
Samsung ou le "Health Radar" d'Oura, sans ajouter d'écran ? »* Une grosse part sur la montre (journal du propriétaire de
17:03, priorité absolue), puis ce que font les leaders cet été / automne, puis conversations et humeur (D4).

### Montre — ce que tranche le journal de 17:03 (détail : `protocoles/huawei.md` §6.9)

- **La GT 6 Pro parle l'ISO classique pour la liaison, pas le « New Auth » (SPEKE)** : réponse `message` 0x8001 avec
  `isoSalt` (16 o), `peerAuthId` (64 o), `token` (32 o) — exactement ce que `runHichain` sait vérifier. L'hypothèse
  SPEKE des runs 11:04 → 18:30 est **réfutée** pour cette montre [V journal].
- **Cause de l'échec : 1 octet en trop après le JSON** (JSON reconstitué à ces tailles = 804 car., étiquette = 805).
  `JSON.parse` refuse tout caractère après l'objet ; **Gadgetbridge** lit l'étiquette en UTF-8 sans rien retirer
  (`getString` = `new String(bytes, UTF_8)`) puis `new JSONObject(...)`, et le `org.json` d'Android ignore ce qui suit
  l'objet → même trame, aucun problème chez eux [V code GB `HuaweiTLV.java`, `DeviceConfig.java`, lecture seule].
- **Calcul du jeton cohérent avec le nôtre** [V GB `GetHiChainRequest.java`, lecture seule] : PSK = HMAC(SHA-256(hex
  du PIN), graine 32 o) ; jeton de la montre = HMAC(PSK, aléa montre ‖ aléa téléphone ‖ id téléphone ‖ id montre) ;
  jeton du téléphone dans l'autre ordre (aléa tél. ‖ aléa montre ‖ id montre ‖ id tél.) — identique à `watchToken` /
  `phoneToken`. Seul point à surveiller : la casse de l'hexadécimal du PIN (majuscules chez nous) et le format exact de
  notre identifiant → si `token_mismatch` survient, c'est là qu'il faudra regarder (test des deux casses en diagnostic).
- **Lien Bluetooth permanent ?** Pas de réponse publique : fiches commerçants « BT 6.0, BLE / BR/EDR » [T] ; les appels
  Bluetooth exigent Huawei Santé [T Huawei]. → À lire dans un futur journal (événements de connexion CDM), pas à deviner.

### Ce que font les leaders (signaux de l'été / automne 2026)

1. **Samsung Health « Vitals »** (été 2026) : chaque matin, revue des signaux de la nuit **comparés à la ligne de base
   personnelle**, + « Fitness Index », charge cardio, et suivi du **bruit ambiant** (santé auditive) [T Digital Trends,
   Wareable, Samsung Newsroom — pages 403 en direct, résumés de recherche].
2. **Oura Ring 5** (05/2026) : « Health Radar » (tendances de **tension pendant le sommeil**, respiration nocturne),
   **GLP-1 Insights** (doses, effets, poids, données de la bague au même endroit), **import de résultats d'analyses**
   à côté des données de la bague [T CNBC 28/05, Athletech 26/06].
3. **Whoop** : Advanced Labs (bilans sanguins), dossiers médicaux reliés, Blood Pressure Insights recadré par la FDA
   (06/2026 : affichage **sans classes** « normal / élevé ») [T Athletech 26/06]. → Rappel utile pour nous : montrer des
   tendances personnelles, pas des catégories cliniques.
4. **Apple Watch Series 12 / Ultra 4** (10/2026) : jugées encore derrière Oura / Whoop sur le suivi santé [T Bloomberg
   08/10].

Lecture pour HealthTrack : tout le monde converge vers **une lecture du matin relative à soi** + **biomarqueurs
importés** (analyses) + **traitements suivis avec leurs effets**. Nous avons déjà le moteur « écarts à vos habitudes » :
il manque le **regroupement** (I51) et deux sources (analyses, traitements), pas des écrans.

### Conversations et humeur (D4)

- **Omi** est **entièrement open source (MIT, firmware compris)** et documente son protocole BLE : service audio
  `19B10000-E8F2-537E-4F6C-D104768A1214`, flux `…0001`, codec `…0002` (20 = Opus 16 kHz mono, trames 10 ms ; 21 =
  Opus 20 ms sur le CV1), en-tête de 3 octets par notification [V docs.omi.me ; T SDK communautaire]. → Un **pilote
  Omi direct** dans notre registre BLE générique est faisable **sans leur cloud** ; pas besoin d'API d'export.
- **Transcription sur l'appareil** : `SpeechRecognizer.createOnDeviceSpeechRecognizer` (API 31+),
  `checkRecognitionSupport` / `triggerModelDownload` pour le pack de langue ; lever d'exception si aucun reconnaisseur
  local → garde `isOnDeviceRecognitionAvailable` [V doc Android]. Français local sur l'A56 : ❓ à vérifier sur
  l'appareil (écran de diagnostic).
- **Bruit ambiant au micro** : les sonomètres de téléphone ne respectent aucune norme ; Android mesure au mieux entre
  **40 et 80 dB(A)** [V Arbetsmiljöverket]. → niveau relatif (calme / animé), jamais une alerte auditive « médicale ».
- **Poids HSEmotion valence / éveil (`enet_b0_8_va_mtl`)** : le code est Apache-2.0, **aucune licence n'est indiquée
  pour les poids** [V dépôt] ; ils sont appris sur AffectNet, dont la licence est réservée à la recherche non
  commerciale [H, à confirmer]. → HealthTrack est gratuit et personnel, mais par prudence : **blendshapes MediaPipe
  (sourire) par défaut**, modèle de valence en option téléchargée par l'utilisateur, licence affichée.
- MediaPipe dans une WebView Samsung (Xclipse) : **aucune mesure publiée** trouvée → la mesure sur l'A56 (écran de
  diagnostic I53) reste la seule source fiable.

*Reddit toujours inaccessible directement ; la recherche générique « quantified self 2026 » ne renvoie que des
annuaires. LinkedIn non exploité. Pages Samsung / Wareable / eMarketer en 403 : passé par les résumés de recherche.*

### Idées classées (impact × faisabilité) — consolider plutôt qu'ajouter

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I57 | **Lecture HiChain tolérante + diagnostic du jeton** : JSON suivi d'octets de fin accepté (comme `org.json`), `trailingBytes` au journal ; si le jeton diffère, le journal dit lequel des calculs (casse du PIN, ordre des identifiants) aurait correspondu — sans jamais écrire de valeur | Que la GT 6 Pro s'appaire enfin (D3) | 5 | 5 | **25** |
| I58 | **« Ma nuit en un coup d'œil » dans le briefing** (précise I51, à la Samsung Vitals) : FC repos, VFC, SpO₂, respiration, durée / régularité du sommeil, chacun en **flèche par rapport à votre plage habituelle** (médiane ± MAD 28 j), une phrase si ≥ 2 signaux sortent de la plage ; aucune classe clinique | Une lecture du matin relative à soi (D1, D6) | 5 | 4 | 20 |
| I59 | **Import de résultats d'analyses** : photo ou PDF → ML Kit Text Recognition **sur l'appareil** → biomarqueurs (ferritine, vitamine D, HbA1c, LDL…) reconnus par gabarits, l'utilisateur confirme en 1 écran ; repli Gemini (sa clé) seulement s'il le choisit ; courbes dans « Vos données » | Biomarqueurs à côté des données de la montre (Oura / Whoop) | 4 | 3 | 12 |
| I60 | **Traitements et compléments = expériences** : prise en 1 tap (ou rappel actionnable), puis « avant / après » personnel sur sommeil, FC repos, humeur avec les garde-fous D5 (ordre temporel, ≥ 14 j de chaque côté) ; jamais de conseil médical | Savoir si un traitement change quelque chose chez moi | 4 | 4 | 16 |
| I61 | **Pilote Omi direct** (registre BLE générique) : flux Opus 16 kHz → décodage → transcription locale (`createOnDeviceSpeechRecognizer` fr-FR) → résumé / tags dans le journal ; audio jamais conservé ; rappel sur l'accord des personnes enregistrées | Conversations dans le journal, sans cloud | 3 | 3 | 9 |
| I62 | **Niveau sonore ambiant** (réutilise le service micro de D4, quelques secondes par heure) : minutes « calme / animé / bruyant » comme **X** des Analyses (jamais entrée de l'estimateur d'humeur, consigné dans la liste D5) | Le bruit pèse-t-il sur mon sommeil / humeur ? | 3 | 4 | 12 |

Mises à jour d'idées existantes : **I20 / D3 (c ter)** → **en attente** (la GT 6 Pro n'utilise pas SPEKE ; garder pour
Honor) ; **I51** → absorbe I58 (pas de nouvelle carte) ; **I53** → défaut = blendshapes MediaPipe, valence en option
(licence des poids) ; **I41 / I55** → la transcription locale d'I61 sert aussi la dictée du soir.

### Détail et pistes d'implémentation

**I57 — HiChain tolérant.** Voir §6.9 et « Prochaines étapes » n°1 du backlog. En plus : si `token_mismatch`, calculer
en local 2–3 variantes (PIN hex minuscule / majuscule ; identifiants inversés) et consigner **seulement le nom** de la
variante qui correspond (`tokenVariant: "pin_lower"`), jamais les octets — un seul journal suffit alors à corriger.

**I58 — Ma nuit.** `src/services/` : fonction pure `nightSignals(entries, date)` → { signal, valeur, plage, sens } en
réutilisant les écarts robustes déjà calculés pour « Votre cœur vs votre norme » ; rendu dans la carte du briefing
(I51) ; tests sur séries d'exemple (plage < 14 nuits → « pas encore de plage habituelle »).

**I59 — Analyses.** Plugin natif ML Kit Text Recognition v2 (latin, sur l'appareil, ~4 Mo) ; dictionnaire FR / EN des
biomarqueurs courants avec unités et conversions (mmol/L ↔ mg/dL) ; type d'entrée `lab_result` { analyte, valeur,
unité, plage du labo, date } ; la plage **du labo** affichée telle quelle, pas d'interprétation ; export / import JSON.

**I60 — Traitements.** Type `intake` { nom, dose, heure } ; action de notification « Pris » ; analyse = comparaison
avant / après avec intervalle bootstrap, ou ABAB (I45) si l'utilisateur veut tester ; texte « va de pair avec », pas
« fait ».

**I61 — Omi.** `devices/omi/` : empreinte = service `19B10000-…` ; lecture du codec, abonnement au flux, retrait de
l'en-tête 3 o, décodage Opus (libopus WASM ou `MediaCodec` natif) → PCM 16 kHz → reconnaisseur local ; seul le texte
et un résumé sont stockés.

**I62 — Bruit.** `AudioRecord` dans le service de premier plan micro (D4) : RMS → dBFS relatif, calibration absente
assumée ; 3 classes par seuils personnels ; agrégat quotidien seulement.

### Sources (consultées le 13/10/2026)

- Montre : `journal/diagnostics/2026-10-13-1703-gt6pro.json` ; https://codeberg.org/Freeyourgadget/Gadgetbridge
  (lecture seule : `devices/huawei/HuaweiTLV.java`, `devices/huawei/packets/DeviceConfig.java`,
  `service/devices/huawei/requests/GetHiChainRequest.java`) ; https://consumer.huawei.com/ph/support/content/en-us16066730 ;
  https://www.nahdionline.com/en-sa/huawei-gt6-pro-46mm-atum-b29m-titanium-metal/pdp/103682622
- Leaders : https://www.bloomberg.com/news/articles/2026-10-08/apple-watch-series-12-ultra-4-new-features-aren-t-enough-to-beat-oura-whoop ;
  https://athletechnews.com/oura-whoop-push-deeper-into-healthcare/ ;
  https://www.cnbc.com/2026/05/28/oura-ring-smallest-wearable-health-fitness.html ;
  https://www.digitaltrends.com/wearables/samsung-healths-biggest-update-yet-will-turn-your-galaxy-watch-into-a-health-coach/ ;
  https://www.wareable.com/samsung/samsung-galaxy-watch-health-platform-update-vitals-fitness-index-cardio-load-new-features
- Conversations / humeur : https://docs.omi.me/doc/developer/Protocol ; https://github.com/BasedHardware/omi ;
  https://developer.android.com/reference/android/speech/SpeechRecognizer ;
  https://www.av.se/en/health-and-safety/noise/mata-ljud-och-buller/noise-exposure-app/ ;
  https://github.com/av-savchenko/face-emotion-recognition ; https://github.com/av-savchenko/hsemotion

### À creuser au prochain run idées (14/10 08:30)

- Selon le journal suivant du propriétaire : jeton accepté ou non (I57), puis réponses 0x8002 / 0x8003 (format de
  `encAuthToken`, présence du même octet de fin).
- Reconnaissance vocale **locale en français** sur Galaxy A56 (One UI 8) : `checkRecognitionSupport("fr-FR")`.
- Licence AffectNet / poids HSEmotion VA : texte exact.
- ML Kit Text Recognition sur des comptes rendus de laboratoire français (mise en page en tableau).
- Reddit via un autre chemin (archives, agrégateurs) pour r/Huawei et r/QuantifiedSelf.

---

## Run du 13/10/2026 08:30 (Paris) — montre app fermée, humeur réaliste, une seule réponse par jour

Question du jour, côté utilisateur : *« ma montre est maintenant lue par HealthTrack quand j'ouvre l'app ; comment
faire pour qu'elle le soit **sans que j'y pense**, sans vider ma batterie, et comment l'app peut-elle me donner **une
seule réponse claire par jour** au lieu de dix cartes ? »* Une bonne part sur la montre (priorité absolue), puis
visage / voix (D4) et la simplification (consigne : consolider plutôt qu'ajouter des écrans).

### Ce que veulent les gens (signaux du jour)

1. **Une réponse par jour, des tendances plutôt qu'une note par nuit** : l'« orthosomnie » (anxiété causée par le
   score de sommeil) est maintenant un sujet clinique ; les cliniciens conseillent de regarder des **tendances
   hebdomadaires** [T GMA 07/2025]. Oura agrège 31 jours en un « stress cumulé » de fond [T 11/2025] ; Samsung
   n'affiche des conseils d'Energy Score **que si le score est bas** [T Samsung 09/2025] ; Bevel plaît parce qu'il
   ramène tout à « es-tu prêt ? » [T 05/2026].
2. **Les « coachs IA » déçoivent quand ils inventent** : Whoop Coach — résumé du jour devenu quasi identique chaque
   jour, ignorant le contexte donné ; **caféine, alcool et dénivelé inventés**, maladie supposée à tort ; apprécié
   pour sa mémoire (suivi après une maladie) [V forum Whoop ; V Gear Patrol 06/07/2026]. Garmin Active Intelligence
   (abonnement Connect+) jugée « générique » [T TechRadar 2025]. → **Les chiffres viennent toujours du moteur, un
   texte au plus les reformule.**
3. **Bearable** exige ≥ 3 jours avec et 3 sans un facteur (30 j conseillés) et respecte l'ordre horaire (la caféine
   du soir n'explique pas le symptôme du matin) [V bearable.app] — même logique que D5 / I46.
4. **Sortir de Huawei Health** : Gadgetbridge et Huawei Health ne cohabitent pas (la clé est renouvelée à chaque
   réappairage par l'autre app, GT 6 sur Galaxy A34 One UI 8, issue GB #6010, 04/2026) [V] ; VFC souvent absente
   via Gadgetbridge (GT 5, #6461, 07/2026 ; Watch Fit 3, #6271) [V].

*Reddit toujours inaccessible directement (old.reddit bloqué, miroirs non indexés) : signaux pris via la presse et
les forums cités ; LinkedIn non exploité.*

### Faits clés (vérifiés aujourd'hui)

**Montre — synchro app fermée (D3 d quater)**
- **Companion Device Manager (CDM) et Bluetooth classique** [V doc Android, màj 01/10/2026] :
  `startObservingDevicePresence` prend en charge le **Bluetooth classique** — l'événement est la **connexion /
  déconnexion** de la montre (pas une détection de portée) ; l'app **n'a pas besoin de tourner** pour le recevoir.
  Android 16 : `ObservingDevicePresenceRequest.setAssociationId` + `CompanionDeviceService.onDevicePresenceEvent`
  (`EVENT_BT_CONNECTED`) ; le système lie alors le service, ce qui **remonte la priorité du processus**. Permission
  `REQUEST_OBSERVE_COMPANION_DEVICE_PRESENCE`.
- Une fois associée, l'app peut demander `REQUEST_COMPANION_RUN_IN_BACKGROUND` et
  `REQUEST_COMPANION_START_FOREGROUND_SERVICES_FROM_BACKGROUND` : le CDM est une **exemption officielle** à
  l'interdiction de démarrer un service de premier plan depuis l'arrière-plan [V].
- **Association d'une montre déjà appairée** : possible avec un filtre limité à son adresse et « appareil unique »,
  **une seule confirmation** de l'utilisateur (comportement observé chez Gadgetbridge, qui recommande d'ailleurs
  d'activer cette option contre les arrêts du service) [V doc GB].
- Service de premier plan type `connectedDevice` : `FOREGROUND_SERVICE_CONNECTED_DEVICE` + `BLUETOOTH_CONNECT`
  accordée (déjà demandée par HealthTrack) [V]. Le type `dataSync` est limité à **6 h / 24 h** depuis Android 15 [V].
- **`@capacitor/background-runner` est inutilisable** : JS exécuté dans QuickJS, **sans `crypto.subtle`** (donc ni
  AES-GCM, ni HKDF, ni HMAC) et sans Bluetooth ; ≥ 15 min entre deux exécutions [V README + code natif]. → Porter en
  **Java** le strict nécessaire de la synchro (trames, AES-GCM `javax.crypto` avec la clé déjà négociée, commandes
  7/0x0A-0x0D) ; l'appairage HiChain reste en JS au premier plan.
- **Leçons de reconnexion** (PR GB #6367, ouverte 07/2026) [V] : un socket RFCOMM resté ouvert bloque toute
  reconnexion ; la montre peut refuser une clé valide **pendant des heures** après une séparation nocturne ; selon un
  mainteneur, des reconnexions agressives hors de portée peuvent pousser la montre à **réinitialiser l'appairage**.
  → toujours fermer le socket, essais espacés et plafonnés (déjà le cas dans `watchAutoSync.js`), jamais de boucle.
- Gadgetbridge relit les montres au **déverrouillage du téléphone** (`USER_PRESENT`) avec un intervalle minimal
  réglable (#6775, 09/2026) [V] — même logique que notre synchro « à l'ouverture », étendue au déverrouillage.
- **GT 6 Pro chez Gadgetbridge** [V] : phases du sommeil (TruSleep) depuis 0.87.0 ; stress / VFC / SpO₂ / température
  « pas sur toutes les montres » ; plantage du parseur de **séances enregistrées automatiquement** sur GT 6 Pro
  (#5784, 02/2026, corrigé) → nos tests de séances devront couvrir ce cas ; la GT 6 Pro (firmware 6.0.0.188) demande
  **35 jours de calendrier** (#6356) — sans intérêt santé, à ignorer proprement.
- **One UI 8** [T] : pour qu'une app tourne en fond, il faut **à la fois** batterie « Sans restriction » **et** « Applis
  jamais en veille » ; « mettre en veille les applis inutilisées » coupe les tâches après ~3 jours sans usage [V
  dontkillmyapp]. ❓ La GT 6 Pro garde-t-elle un lien Bluetooth permanent (appels) ? Si oui, l'événement « connectée »
  ne viendra qu'aux reconnexions → filet WorkManager horaire indispensable.

**Humeur sur l'appareil (D4)**
- **WebGPU très probablement indisponible sur le Galaxy A56** : la liste de blocage Chromium n'autorise sur Android
  que les GPU ARM, Qualcomm, Intel (et Imagination sur Android 16) ; le GPU Xclipse (AMD, Samsung) n'y est pas [V
  source Chromium]. → LiteRT.js tournerait en WASM CPU. **MediaPipe Tasks (web)** passe par **WebGL2**, pas WebGPU :
  utilisable dans la WebView (fichiers `.wasm` et `.task` embarqués, ~3,6 Mo [E]).
- **Visage** : `HSEmotion-B0-LiteRT` (8 Mo, Apache-2.0) = **8 classes sans valence** [V] ; la variante
  `enet_b0_8_va_mtl` donne **valence + éveil**, 16 Mo, **60 ± 32 ms** sur Galaxy Fold 3 CPU, code Apache-2.0 mais
  **licence des poids non précisée** [V] → à vérifier avant usage ; sinon blendshapes MediaPipe (sourire) seuls.
- **Le signal est faible au niveau individuel** : MoodCam / FacePsy (25 personnes, 4 semaines, photos de 10 s au
  déverrouillage) : **AUC 0,58–0,64** pour la valence [V arXiv 2412.12625]. L'étude « sourires » de Google (r = 0,92)
  est **populationnelle** [T]. Voix spontanée : r valence 0,41 (PRIORI 2018), 61,6 % sur 3 classes (EMOVOME 2024) [T].
  → afficher des **tendances lissées sur 7 jours**, calibrées par l'auto-déclaration, jamais un score ponctuel.
- **Caméra en arrière-plan** : service caméra créé en arrière-plan → `SecurityException` (API 34+), seules
  exceptions : notification, widget, `PendingIntent` d'une app visible… ; `cameraserver` coupe en plus les apps
  inactives ; **aucun retour fiable** que `appops set … CAMERA allow` contourne cela sur Android 14–16 [V doc ; T
  AOSP]. → Le « niveau 2 » demandé reste à tester sur l'A56, mais la voie robuste est : service démarré **depuis
  l'app** ou **depuis une notification** (exemption officielle). Shizuku démarre sans PC (débogage sans fil) mais doit
  être **relancé à chaque redémarrage** [V].
- **Voix** : emotion2vec+ (code MIT, poids non précisés, ~90 M paramètres pour « base », pas d'ONNX officiel) [V] ;
  wav2vec2 « emotion » ONNX (MIT) **anglais seulement** [V] ; audeering valence/éveil = **non commercial** [T] ;
  **openSMILE exige une licence commerciale** pour un produit [T] → réimplémenter un petit sous-ensemble prosodique ;
  **pitchy** (hauteur de voix, JS, 0BSD) [V].
- **Emobot** : essai EmoDTx (98 patients) terminé fin 2025, **toujours aucun résultat publié** [T clinicaltrials.gov].

**IA locale pour expliquer ses données**
- **Gemini Nano (ML Kit GenAI)** : bêta, **Galaxy A56 absent** de la liste (côté Samsung : S26, Z Fold7/8, Z Flip8),
  premier plan seulement [V doc 08/10/2026]. MediaPipe LLM Inference mobile → remplacé par **LiteRT-LM** [V].
  **Gemma 4 E2B** (02/04/2026, **Apache-2.0**, ~1,5 Go en 4 bits) [T] ; aucune mesure de vitesse sur un milieu de
  gamme. → Possible plus tard via un plugin natif et un téléchargement à la demande, **uniquement pour reformuler**
  des chiffres calculés par le moteur.
- **Glucose en continu sans ordonnance** : Lingo écrit dans **Health Connect** (valeurs / 5 min, ~3 h de délai) [T
  vendeur] ; HealthTrack lit déjà la glycémie Health Connect (C7) → rien à construire, juste à le dire.

### Idées classées (impact × faisabilité) — nouvelles ou fortement précisées

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I49 | **Montre « sans y penser » : présence CDM + synchro Java** — association CDM en un geste (montre déjà appairée), événement « montre connectée » → service `connectedDevice` court qui relit 7/0x0A-0x0D en Java avec la clé déjà négociée, écrit un fichier que le JS importe à l'ouverture ; filet WorkManager horaire ; relecture au déverrouillage | Données de la montre sans ouvrir l'app (D3 d quater) | 5 | 3 | 15 |
| I50 | **Guide « ne pas tuer HealthTrack » One UI** : un seul écran, 2 interrupteurs (batterie « Sans restriction » + « Applis jamais en veille »), détection de l'état (`isIgnoringBatteryOptimizations`) et rappel si la synchro de fond n'a rien ramené depuis 24 h | Synchro fiable sur Samsung | 4 | 5 | 20 |
| I51 | **Briefing du jour unique** (précise I47) : un état (« en forme / habituel / à ménager »), 1–2 causes **chiffrées** tirées des écarts à vos habitudes, 1 piste ; texte par gabarits déterministes (jamais un chiffre inventé) ; les cartes actuelles deviennent son détail | Une seule réponse par jour (D1) | 5 | 4 | 20 |
| I52 | **Mode calme** : un réglage qui remplace les notes par nuit par des **flèches de tendance 7 / 30 jours** ; conseils affichés seulement quand la tendance s'écarte de votre habituel | Anxiété du score (orthosomnie), moins de chiffres | 4 | 5 | 20 |
| I53 | **Humeur visage, version réaliste** (précise I40) : MediaPipe Face Landmarker web (WebGL2, pas WebGPU sur l'A56) → blendshapes sourire / sourcils pendant 2 s à l'ouverture ; valence par `enet_b0_8_va_mtl` ONNX seulement si la licence des poids le permet ; **tendance 7 j** calibrée par l'auto-déclaration, précision affichée (« AUC ≈ 0,6 dans les études ») | Humeur sans saisie, honnête (D4) | 4 | 4 | 16 |
| I54 | **Une question du soir, la plus utile** : au lieu d'un formulaire, une seule question choisie là où l'incertitude d'un lien est la plus forte (apprentissage actif) ; réponse en 1 tap depuis la notification | Zéro saisie par défaut (D1) | 4 | 3 | 12 |
| I55 | **Voix niveau 1 sans modèle** (précise I41) : 15–30 s de dictée → hauteur (pitchy, 0BSD), variabilité, énergie, débit, pauses, comparés à **votre** ligne de base ; audio effacé ; modèle SER (emotion2vec ONNX int8 ~90 Mo) seulement plus tard, après mesure sur l'A56 | Voix comme signal direct (D4) | 4 | 4 | 16 |
| I56 | **Expliquer ses données avec une IA locale** : Gemma 4 E2B (Apache-2.0) par LiteRT-LM, téléchargé à la demande, qui **reformule** les résultats du moteur et cite les jours ; repli Gemini (clé de l'utilisateur) | Comprendre ses données, hors ligne | 3 | 2 | 6 |

Mises à jour d'idées existantes : **I20 / D3** → (d quater) suit I49 (CDM + Java), `background-runner` écarté ;
**I40** → remplacé par I53 (pas de WebGPU sur Xclipse, licence des poids à vérifier, tendance 7 j) ; **I41** → I55
(openSMILE écarté pour licence) ; **I47** → précisé par I51 (gabarits, jamais de chiffres inventés) ; **I24 / I13**
→ I54 pour la saisie du soir. Le « niveau 2 » caméra (service lancé au déverrouillage) reste demandé par le
propriétaire : à **tester** sur l'A56 avec l'écran de diagnostic prévu, sans promettre qu'Android le permette.

### Détail et pistes d'implémentation

**I49 — Montre sans y penser.** (1) `CompanionPlugin.java` : `associate` avec `BluetoothDeviceFilter` sur l'adresse de
la montre appairée, `setSingleDevice(true)` → l'utilisateur confirme une fois ; puis `startObservingDevicePresence`
(API 31–35) ou `ObservingDevicePresenceRequest.setAssociationId` (36+). (2) `WatchPresenceService extends
CompanionDeviceService` : sur `EVENT_BT_CONNECTED` (ou `onDeviceAppeared`), démarrer `WatchSyncService` (premier
plan, `connectedDevice`, notification « Synchro de la montre… » de quelques secondes). (3) **Java minimal** écrit
depuis `protocoles/huawei.md` §2, §3, §6.5, §7 (pas depuis le JS ni Gadgetbridge) : trame + CRC, TLV, AES-GCM avec la
clé de session dérivée des secrets déjà stockés (à déplacer de `localStorage` vers un stockage lisible par Java,
chiffré par le Keystore), commandes 1/5, 7/0x0A-0x0D ; sortie = JSON brut dans un fichier de l'app, importé par
`services/watchSync.js` (mêmes parseurs, mêmes dédoublonnages) à l'ouverture. (4) En cas d'échec d'authentification
en fond : **jamais** de réappairage, une notification « Ouvrez HealthTrack pour reconnecter la montre ». (5) Filet :
`PeriodicWorkRequest` 1 h (batterie non faible) + `USER_PRESENT`, mêmes délais et plafonds que `watchAutoSync`.
Tests : JVM (trames d'exemple de la spec, vecteurs AES-GCM), et la fausse montre JS pour l'import.

**I50 — Guide One UI.** Réutilise le plugin existant (`isIgnoringBatteryOptimizations`,
`ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`) ; pour « Applis jamais en veille », pas d'API → texte pas à pas
(Paramètres → Batterie → Limites d'utilisation en arrière-plan → Applis jamais en veille → +). S'affiche dans
« Connexion à la montre » seulement si la synchro de fond est activée et a échoué / n'a rien ramené.

**I51 — Briefing du jour.** Entrées : écarts robustes (médiane / MAD 28 j) de sommeil, FC repos, VFC, pas, + météo ;
sortie : un état et ≤ 2 causes triées par |z|, chacune avec son chiffre et « d'habitude » ; 1 piste tirée des liens
personnels (D6, jamais d'une norme). Gabarits FR testés. Fusionne « Prédiction du jour », Radar et cartes cœur sur
l'accueil (D1). LLM éventuel (I56) : reformulation seulement.

**I52 — Mode calme.** Paramètre unique ; les composants qui affichent une note par nuit lisent `calmMode` et montrent
la moyenne 7 j + flèche (seuil = 0,5 MAD). Aucune donnée supprimée.

**I53 — Visage.** `@mediapipe/tasks-vision` hébergé dans `public/` (pas de CDN, hors ligne), délégué GPU puis CPU ;
2 s à l'ouverture de l'accueil si l'interrupteur « Lecture du visage » est actif ; stocke `face_affect` { smile,
browDown, valence?, nFrames, conf } ; canvas vidé. Écran de diagnostic : latence par image, délégué utilisé,
`navigator.gpu` présent ou non → mesure réelle sur l'A56 avant d'aller plus loin.

**I54 — Une question du soir.** Le moteur d'analyse connaît l'incertitude de chaque lien (intervalle) ; choisir la
variable non captable dont l'information attendue est la plus grande ; notification locale à l'heure habituelle du
check-in ; réponses Oui / Non / note en 1 tap (action de notification). Remplace à terme les champs du check-in.

**I55 — Voix.** `getUserMedia({audio})` dans la WebView → `AudioWorklet` → trames de 30 ms : RMS, détection de parole
par énergie, F0 par pitchy ; résumé { f0Med, f0Var, energy, speechRatio, pauseMean, rate } ; ligne de base
personnelle 28 j ; entrée de l'estimateur (Y), jamais un X (D5).

### Sources (consultées le 13/10/2026)

- Montre / Android : https://developer.android.com/reference/android/companion/CompanionDeviceManager ;
  https://developer.android.com/reference/android/companion/ObservingDevicePresenceRequest ;
  https://developer.android.com/reference/android/companion/DevicePresenceEvent ;
  https://developer.android.com/reference/android/companion/CompanionDeviceService ;
  https://developer.android.com/develop/connectivity/bluetooth/companion-device-pairing ;
  https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start ;
  https://developer.android.com/develop/background-work/services/fgs/service-types ;
  https://developer.android.com/about/versions/15/behavior-changes-15 ;
  https://github.com/ionic-team/capacitor-background-runner ; https://dontkillmyapp.com/samsung ;
  https://www.sammyfans.com/2026/01/02/samsung-phone-can-stop-battery-drain-one-ui-8/ ;
  https://gadgetbridge.org/basics/topics/background-service/ ; https://gadgetbridge.org/basics/topics/huawei-honor/ ;
  https://codeberg.org/Freeyourgadget/Gadgetbridge/issues/5784 ; …/issues/6356 ; …/issues/6010 ; …/issues/6978 ;
  …/issues/6461 ; …/issues/6775 ; https://codeberg.org/Freeyourgadget/Gadgetbridge/pulls/6367
- Humeur : https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker ;
  https://chromium.googlesource.com/chromium/src.git/+/main/gpu/config/webgpu_blocklist_impl.cc ;
  https://developer.chrome.com/blog/new-in-webgpu-121 ; https://github.com/av-savchenko/face-emotion-recognition ;
  https://huggingface.co/litert-community/HSEmotion-B0-LiteRT ; https://arxiv.org/html/2412.12625v1 ;
  https://arxiv.org/abs/2512.11905 ; https://github.com/ddlBoJack/emotion2vec ;
  https://huggingface.co/onnx-community/wav2vec2-emotion-recognition-ONNX ; https://github.com/ianprime0509/pitchy ;
  https://pypi.org/project/opensmile/2.2.0/ ; https://shizuku.rikka.app/guide/setup/ ;
  https://clinicaltrials.gov/study/NCT06860165 ; https://arxiv.org/abs/2402.17496
- Besoins / apps : https://www.community.whoop.com/t/ai-coach-lacks-customizability-after-coming-out-of-beta/15909 ;
  https://www.gearpatrol.com/fitness/whoop-ai-reddit-user-feedback-pros-cons/ ; https://bearable.app/support/tips/what-are-factors/ ;
  https://news.samsung.com/global/samsung-highlights-sleep-and-wellness-innovations-at-world-sleep-2025 ;
  https://support.apple.com/en-ie/123002 ; https://blog.google/products/fitbit/personal-health-coach-public-preview/ ;
  https://www.techradar.com/health-fitness/smartwatches/garmins-new-subscription-ai-feature-is-hilariously-bad-so-far ;
  https://forum.quantifiedself.com/t/statistics-how-many-rows-did-you-need-to-get-a-robust-pattern/8848
- IA locale / glucose : https://developers.google.com/ml-kit/genai ;
  https://developers.google.com/edge/mediapipe/solutions/genai/llm_inference ;
  https://developers.googleblog.com/blazing-fast-on-device-genai-with-litert-lm/ ;
  https://www.hellolingo.com/blog/health-connect-integration-guide

### À creuser au prochain run idées (13/10 20:30)

- Lien Bluetooth permanent de la GT 6 Pro (appels / HFP) : l'événement CDM « connectée » arrive-t-il seulement aux
  reconnexions ? (journal du propriétaire, ou documentation Huawei sur les appels Bluetooth de la GT 6 Pro).
- Licence des poids `enet_b0_8_va_mtl` (HSEmotion) : demander / lire les fichiers du dépôt du modèle.
- Mesure de MediaPipe Face Landmarker dans une WebView Samsung (retours publiés, `chrome://gpu` d'un Xclipse 540).
- Commandes 1/0x03 (prises en charge) attendues d'une GT 6 Pro pour TruSleep / stress / VFC — à confirmer par le
  journal du propriétaire.
- Vitesse de Gemma 4 E2B sur un Exynos 1580 (AI Edge Gallery) si des mesures paraissent.

---

## Run du 12/10/2026 20:30 (Paris) — directives du 12/10 : montre en direct, visage / voix, science personnelle, simplifier

Premier run « idées » depuis les directives du 12/10. Question du jour, côté utilisateur : *« je ne veux plus rien
saisir ni rien régler : comment ma montre, mon visage et ma voix peuvent-ils dire à l'app ce qu'elle me demande
aujourd'hui, et comment être sûr que ce qu'elle m'apprend vaut pour moi et pas pour “les gens en général” ? »*
Consigne du propriétaire suivie : privilégier ce qui **simplifie et consolide** plutôt que de nouveaux écrans.

### Ce que veulent les gens (signaux du jour)

1. **Simple à noter, clair à lire** : sur r/QuantifiedSelf et le forum QS, la demande récurrente n'est pas « plus de
   variables » mais « une saisie minimale + une analyse lisible de ce qui influe sur mon humeur » ; un utilisateur qui
   tient un simple tracker humeur / habitudes depuis un mois découvre « l'ennui au travail → humeur juste OK » [T].
   Un développeur QS : « la complexité, c'est le moteur d'analyse qui trie la montagne de données » [T]. → Confirme
   D1 et D6 : moins de cartes, des conclusions personnelles mieux expliquées.
2. **Le sourire est le signal facial qui marche** : étude smartphone 12/2025 (arXiv 2512.11905) : 233 personnes,
   405 448 clips filmés pendant l'usage normal du téléphone ; le sourire suit les enquêtes de bonheur nationales
   (r = 0,92) et les rythmes de la journée (r = 0,80 avec la méthode DRM) ; plus de sourire ↔ plus d'activité et de
   lumière ; **aucun effet trouvé pour l'usage du smartphone** [V]. Pilote bipolaire 2021 (n = 5) : la vidéo ne
   reconnaissait guère que la joie, la voix était plus fiable [T]. → Ne pas promettre 8 émotions : viser **sourire +
   valence**, agrégés sur la journée.
3. **Emobot** : essai EmoDTx (NCT06860165, dépression unipolaire, visage vs MADRS / PHQ-9) — fin prévue 12/2025,
   **aucun résultat publié trouvé** [T]. Leur promesse reste invérifiée publiquement → HealthTrack affiche toujours
   « estimation ».

*Reddit direct toujours bloqué (passé par miroirs / moteurs) ; LinkedIn non exploitable.*

### Faits clés (vérifiés aujourd'hui)

- **Pourquoi la GT 6 Pro ne se connecte pas (hypothèse n° 1)** [V doc Gadgetbridge] : une montre Huawei déjà liée à
  Huawei Santé refuse toute autre app avec l'erreur **« Authentication key negotiation failed »**. Deux sorties
  documentées : **réinitialisation d'usine** de la montre, ou fournir l'**identifiant de compte Huawei** (17 chiffres,
  19 dans les versions récentes, trouvé dans un cookie de cloud.huawei.com ou par `adb logcat`), en désinstallant
  Huawei Santé ou en lui retirant ses autorisations ; **ne pas** dissocier la montre dans Huawei Santé (ça invalide
  la clé). Les modèles récents passent par une authentification « **HiChain** » (« New Auth Protocol » dans GB 0.90+) ;
  une PR GB ouverte (#6367) montre que l'échec d'un seul contrôle de jeton bloque toute reconnexion automatique.
  Un contributeur GB : « GT 6 Pro jamais connectée à Huawei Health, compte Huawei pas nécessaire » [V]. → Pour
  HealthTrack : **montre réinitialisée et appairée uniquement à HealthTrack** = le chemin le plus simple et le plus
  robuste ; l'identifiant de compte est un plan B pour qui veut garder Huawei Santé.
- **Protocole Huawei** [V] : `zyv/huawei-lpv2` (Python, **MIT**, 133 commits) = la base légale de réimplémentation
  (LPv2 : trames TLV, chiffrement, authentification « classique ») ; son fork note que l'ingénierie inverse de LPv2 est
  **incomplète** et qu'un **LPv3** est apparu ; conférence CCC eh19 (Kudera, 2019 : Jadx + Frida). **Rien de public
  sous licence permissive pour HiChain** → l'écran de diagnostic (D3) doit d'abord dire **quel mode
  d'authentification la GT 6 Pro annonce** avant d'écrire du code d'authentification.
- **Visage sur l'appareil** [V] : **HSEmotion EfficientNet-B0 en LiteRT** (Hugging Face `litert-community`,
  **Apache-2.0**, **8 Mo** fp16) : visage recadré 224×224 → 8 classes (colère, mépris, dégoût, peur, joie, neutre,
  tristesse, surprise) ; ~2 ms GPU Pixel 8a, 13 ms via TFLite GPU, LiteRT.js / WebGPU 2,6 ms dans un navigateur ;
  une variante HSEmotion donne aussi **valence et éveil**. Alternative ultra-légère : les **52 blendshapes** de
  MediaPipe Face Landmarker (Apache-2.0, < 1 ms CPU) + classifieur par prototypes (68 % sur 7 émotions, n = 31,
  mieux que les juges humains à 59 %) [V].
- **Voix sur l'appareil** [T] : emotion2vec (~19 M paramètres d'après un article, plausible sur mobile, aucune mesure
  Android publiée) ; un élève distillé de 9,7 Mo ONNX tourne en WASM mais ne prédit que 18 indices d'expression,
  pas des émotions ; distillations CNN 4–5 M paramètres. → À **mesurer** sur l'A56 avant de promettre.
- **Limites Android réelles** [V doc Android] : depuis Android 14, un service de premier plan *caméra* ou *micro*
  ne peut être **créé** que quand l'app est au premier plan (sinon `SecurityException`) ; interdit depuis
  `BOOT_COMPLETED` (micro dès Android 14, caméra dès 15) ; lancer une activité depuis l'arrière-plan est bloqué sauf
  exceptions (notification plein écran). Conséquence : **pas de capture déclenchée au déverrouillage** sans que
  l'utilisateur ouvre l'app ; en revanche un service caméra **démarré depuis l'app** peut continuer, avec notification
  permanente et voyant vert. [H, à tester sur A56 : One UI peut le tuer.]
- **Vérification des développeurs Android** [T] : compte « **distribution limitée** » gratuit, **sans pièce
  d'identité, jusqu'à 20 appareils** ; « parcours avancé » pour l'utilisateur (mode développeur, redémarrage, **attente
  unique de 24 h**, puis installations d'apps non vérifiées permises durablement) ; ADB non concerné. Dates
  contradictoires selon les sources (août / septembre 2026 dans 4 pays, mondial 2027). → Pour le propriétaire (un seul
  téléphone) : soit un compte « distribution limitée » (signature inchangée), soit le parcours avancé une fois. Pas
  d'urgence, mais à **décider avant 2027**.
- **Performance** [T] : sous-échantillonnage LTTB (garde pics et creux, ex. 100 000 → 1 200 points visuellement
  identiques), à faire **hors du rendu** (Web Worker), seuil usuel ≈ 2 000 points ; chaque nœud SVG coûte en mobile →
  limiter les points dessinés. Côté HealthTrack : `localHealthStorage.js` fait **7 `getAll()`** sur tout le store.
- **Science personnelle** [V/T] : simulation iMTracker (app de déclencheurs de crises) : **~90 jours** suffisent pour
  détecter des associations fortes, modèles bayésiens à puissance comparable ; Daza 2018 : les analyses N-of-1
  observationnelles **suggèrent** des causes que seule une expérience personnelle (périodes alternées) peut confirmer ;
  pratique N-of-1 : tests de permutation + BH + **préblanchiment** des séries autocorrélées, et attention aux
  décalages circulaires sur une série en tendance ; modèle bayésien à retards distribués avec erreurs AR (arXiv
  2112.13991) pour les effets décalés.

### Idées classées (impact × faisabilité) — nouvelles, toutes au service de D1–D6

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I39 | **Diagnostic GT 6 Pro guidé** : l'écran de diagnostic (D3) nomme l'étape qui échoue (scan → service Huawei → paramètres de lien → authentification) et la cause probable (« liée à Huawei Santé ») avec **une** consigne (« réinitialiser la montre puis l'appairer à HealthTrack » ou plan B identifiant de compte) ; journal exportable | Comprendre pourquoi ça ne marche pas | 5 | 4 | 20 |
| I40 | **Sourire et valence pendant l'usage de HealthTrack** : MediaPipe (détection) + HSEmotion-B0 LiteRT (8 Mo, Apache-2.0) quelques secondes à chaque ouverture de l'app ; seuls 3 nombres stockés (sourire, valence, confiance) ; puis option « capture continue » (service caméra lancé depuis l'app, voyant vert assumé) | Humeur sans saisie (D4) | 5 | 3 | 15 |
| I41 | **Dictée du soir = auto-déclaration + voix** : un seul geste (« Racontez votre journée ») donne la note déclarée, les tags extraits (I26) **et** des indices vocaux (débit, hauteur, énergie, score emotion2vec si l'A56 suit) ; l'audio est effacé après calcul | Remplace le formulaire de check-in (D1 + D4) | 5 | 3 | 15 |
| I42 | **Réseaux sociaux = X, jamais Y** : minutes par app sociale via `queryEvents` (plugin existant étendu aux apps au premier plan) comme facteur des Analyses ; exclues de l'estimateur, consigné dans la liste déclarée (D5) ; pas d'Accessibility (contenu illisible proprement, intrusif) | Comprendre l'effet des réseaux chez moi | 4 | 4 | 16 |
| I43 | **Lecture par plage + agrégats journaliers** : index `[type, date]` + `IDBKeyRange` à la place des 7 `getAll()`, magasin `daily_agg` versionné invalidé par `health-entries-updated`, LTTB ≥ 2 000 points dans un Worker, test budget « entrées lues par page » | L'app ne lague plus (D2) | 5 | 4 | 20 |
| I44 | **« Votre cas vs l'hypothèse générale »** : chaque lien montré avec son sens **chez vous**, l'a priori général en petit (« en général : moins d'écran le soir, meilleur sommeil — chez vous : l'inverse, 62 jours ») ; a priori faible = rétrécissement **vers zéro**, jamais vers la norme | Science personnelle sans culpabilité (D6) | 5 | 4 | 20 |
| I45 | **Expériences personnelles randomisées** (ABAB, 2 × 7 jours, l'app tire l'ordre) pour passer de « va de pair » à « chez vous, ça cause » ; proposé seulement pour un lien « à confirmer » qui intéresse l'utilisateur | Corrélation ≠ causalité (D5) | 4 | 3 | 12 |
| I46 | **Garde-fous statistiques visibles** : X mesuré **avant** Y (veille → jour), ≥ 30 jours appariés pour afficher un lien, ≥ 90 jours pour « solide », préblanchiment avant permutation, nombre de tests affiché (« 1 lien net sur 42 testés ») | Confiance (D5) | 4 | 4 | 16 |
| I47 | **Un seul flux du jour** (à la Whoop 09/2026) : briefing du matin, dictée du soir et carte « Forme » fusionnés dans une carte qui change avec l'heure → accueil plus court | Moins de cartes (D1) | 4 | 3 | 12 |
| I48 | **Mise à jour en 1 clic après 2027** : compte « distribution limitée » gratuit (≤ 20 appareils, sans pièce d'identité) ou parcours avancé unique de 24 h ; message clair dans la bannière de mise à jour si Android bloque | Continuer d'installer l'app | 3 | 4 | 12 |

Mises à jour d'idées existantes : **I7 / I31** (humeur « plage habituelle » comportementale) → **abandonnées** au
profit de I40 / I41 (D5) ; **I20** (pilote Huawei direct) → précédé de I39 (diagnostic) et conditionné au mode
d'authentification réellement annoncé par la GT 6 Pro ; **I26** (journal libre) fusionne avec I41 ; **I24**
(briefing du matin) fusionne dans I47.

### Détail et pistes d'implémentation

**I39 — Diagnostic GT 6 Pro.** Étapes journalisées (horodatage, octets en hex tronqués, jamais d'adresse MAC
complète) : (1) scan → nom annoncé « HUAWEI WATCH GT 6 Pro-xxx », services et données fabricant ; (2) connexion GATT,
liste des services (service propriétaire Huawei attendu, à confirmer [H]) ; (3) demande des paramètres de lien → le
mode d'authentification annoncé ; (4) authentification → code d'erreur. Chaque échec → une phrase et une action.
Export JSON par la feuille de partage Android. Tests : parseur de trames LPv2 d'exemple (en-tête 0x5A, longueur,
service, commande, TLV, CRC16) écrit **depuis la doc MIT**. Livrable même sans montre : le propriétaire exporte le
journal, le run suivant le lit.

**I40 — Visage.** Pipeline : `getUserMedia` caméra frontale (WebView, autorisation Android) → MediaPipe Face
Detector (tâches web, Apache-2.0) → recadrage → HSEmotion-B0 via LiteRT.js (WebGPU / WASM) ou ONNX Runtime Web ;
toutes les 500 ms pendant 5 s à l'ouverture de l'app → médianes. Entrée `face_affect` { smile, valence, arousal?,
conf, nFrames } ; aucune image en mémoire après inférence (canvas vidé). Indicateur visible « 📷 lecture du
visage » + interrupteur. Étape 2 : plugin natif service de premier plan type `camera`, démarré depuis l'app,
1 image / 5 min écran allumé et déverrouillé, voyant vert et notification assumés. Valider d'abord : le score du
jour suit-il le check-in de l'utilisateur ? (corrélation affichée honnêtement, même faible).

**I41 — Dictée du soir.** `SpeechRecognizer` hors ligne (fr-FR) pour le texte ; en parallèle, `AudioRecord` →
caractéristiques prosodiques (F0 moyenne / variabilité, énergie, débit syllabique, pauses) calculées en JS / natif,
puis audio effacé. Score SER seulement si un modèle ≤ 20 Mo tient < 300 ms sur l'A56 (à mesurer). Stockage :
`voice_affect` { pitchVar, energy, rate, pauses, ser? }. Les indices vocaux sont des **entrées de l'estimateur**
(Y), jamais des X.

**I42 — Réseaux sociaux.** `PhoneUsagePlugin` lit déjà `queryEvents` pour l'écran ; ajouter
`ACTIVITY_RESUMED / PAUSED` par paquet, filtrer une liste d'apps sociales (Instagram, TikTok, Facebook, X,
Snapchat, Reddit, YouTube…) → `social_minutes`, `social_late` (22 h–4 h). Déclaré dans `MOOD_ESTIMATOR_INPUTS`
comme **exclu** ; test D5 vérifie qu'il n'y figure pas. Les gens se demandent vraiment « est-ce que TikTok me
plombe ? » : c'est un X idéal.

**I43 — Performance.** Mesurer d'abord (temps par page, entrées lues) avec 3 ans de démo ; puis migration IndexedDB
v+1 ajoutant un index composé `[type, date]` (rétrocompatible : index seulement) ; `listEntries({types, from, to})`
par `IDBKeyRange.bound` ; magasin `daily_agg` (clé `date`, valeurs par variable, `version` du calcul) reconstruit
paresseusement ; `analysisWorker.js` (Vite `?worker`) pour `computeAdvancedAnalysis` ; LTTB pur testé ; budget en
test : « Accueil lit ≤ N entrées ».

**I44 — Votre cas vs l'hypothèse générale.** Remplacer `VARIABLE_META.direction` (`higher_better` /
`lower_better`) par `generalHypothesis` { sens, source } **utilisé seulement** pour ordonner ce qu'on regarde
d'abord et pour un texte en petit. Le sens affiché vient toujours des données ; si le sens personnel contredit
l'hypothèse avec un lien au moins « à confirmer » : « Chez vous, c'est l'inverse de ce qu'on observe en général ».
Couleurs : vert / rouge = effet **sur votre bien-être**, jamais un jugement du comportement.

**I46 — Garde-fous.** Fonction pure `analysisGuards(dataset)` testée : décale tous les X d'un jour quand Y est le
bien-être déclaré le soir (sauf X explicitement « du jour avant la saisie »), refuse d'afficher sous 30 paires,
préblanchit (AR(1)) avant le test, affiche « k liens nets sur m testés ». Phrase type : « va de pair avec », jamais
« améliore » ou « cause ».

### Sources (consultées le 12/10/2026)

- Besoins : https://forum.quantifiedself.com/t/my-notes-to-developers-as-promised-building-that-perfect-quantified-self-app/447 ; https://pol1.lr.ggtyler.dev/r/QuantifiedSelf ; https://arxiv.org/abs/2512.11905 ; https://reunir.unir.net/items/bc1e403a-9611-409c-a50e-4b404eff604a/full ; https://www.centerwatch.com/clinical-trials/listings/NCT06860165/validation-of-emodtx-as-a-digital-endpoint-for-mood-monitoring-in-adult-patients-suffering-from-unipolar-depression
- Huawei : https://gadgetbridge.org/basics/pairing/huawei-honor-pairing/ ; https://zff.dev/Freeyourgadget/website/issues/226 ; https://codeberg.org/Freeyourgadget/Gadgetbridge/pulls/6367 ; https://zff.dev/Freeyourgadget/Gadgetbridge/issues/6271 ; https://github.com/zyv/huawei-lpv2 ; https://www.github.com/psolyca ; https://media.ccc.de/v/eh19-186-all-your-fitness-data-belongs-to-you-reverse-engineering-the-huawei-health-android-app
- Visage / voix : https://huggingface.co/litert-community/HSEmotion-B0-LiteRT ; https://arxiv.org/pdf/2203.13436 ; https://www.mdpi.com/1424-8220/26/3/1060 ; https://pub.dev/documentation/face_detection_tflite/6.7.0/face_detection_tflite_native/FaceBlendshapesModel-class.html ; https://huggingface.co/thomashallock/emotion2vec-web-distill ; https://arxiv.org/pdf/2602.09121 ; https://arxiv.org/pdf/2210.14977
- Android : https://developer.android.com/develop/background-work/services/fgs/changes ; https://developer.android.com/about/versions/15/changes/foreground-service-types ; https://developer.android.com/guide/components/activities/background-starts ; https://www.androidauthority.com/how-android-app-verification-works-3603559/ ; https://thehackernews.com/2026/03/google-adds-24-hour-wait-for-unverified.html ; https://www.neowin.net/amp/google-relaxes-android-sideloading-requirement-for-experienced-users/
- Perf / stats : https://dev.to/wellallytech/health-data-visualization-building-high-performance-charts-for-millions-of-points-3n66 ; https://arxiv.org/html/2307.05389v1 ; https://www.medrxiv.org/content/10.1101/2020.04.28.20082339.full.pdf ; https://pmc.ncbi.nlm.nih.gov/articles/PMC6087468 ; https://arxiv.org/abs/2112.13991v1

### À creuser au prochain run idées (13/10 08:30)

- Wiki de `zyv/huawei-lpv2` : format exact des trames, mode d'authentification, liste des services → préparer les
  trames d'exemple des tests D3. UUID du service Huawei annoncé par la GT 6 Pro (à lire dans le journal du propriétaire).
- MediaPipe Face Detector + LiteRT.js dans une WebView Android 15 (Samsung) : WebGPU disponible ? sinon WASM, latence.
- Modèle SER le plus petit utilisable en français (emotion2vec base vs distillations) : taille, licence, latence.
- Google : texte officiel du compte « distribution limitée » (est-il compatible avec une release GitHub publique ?).
- Reddit : r/Huawei et r/Gadgetbridge sur la GT 6 / HiChain (miroirs).

---

## Run du 12/10/2026 08:30 (Paris) — tout capter depuis le téléphone, bagues ouvertes, du chiffre à l'action

Question du jour, côté utilisateur : *« j'ai une montre, un téléphone et une vie chargée : qu'est-ce qui, sans rien
saisir, me dirait chaque matin où j'en suis et quoi faire, et m'éviterait les fausses alertes ? »*

### Ce que veulent les gens (nouveaux signaux, 2025–2026)

1. **Un seul tableau de bord, humeur + santé + habitudes** : « Frustrated with fragmented tracking apps – would you use
   an all-in-one dashboard for mood, health, and habits? » (r/QuantifiedSelf, via gummysearch) [T]. Confirme le créneau.
2. **Le tag manuel tue l'adoption** : le *Lifestyle Logging* de Garmin est le « biggest gripe » de ses utilisateurs ;
   Garmin préparerait un auto-logging (fuite the5krunner, 06/11/2025) [V]. « 3 clics par case oui / non » = abandon [T].
3. **L'IA doit rester sous contrôle** : forum Whoop, 09/02 et 29/05/2026 : « Use of AI/LLMs needs to be under the
   control of the user », « not be forced to engage with the AI coach » [V]. Garmin Active Intelligence jugé
   « generic… just some math and some platitudes » [T]. → IA **optionnelle**, ancrée dans les chiffres, désactivable.
4. **Lassitude des abonnements** (Whoop, Oura 5,99 €/mois, Google Health 9,99 $/mois, Garmin Connect+) [T] → notre
   gratuité locale est un argument.
5. **Fausses alertes maladie** : alcool, voyage, vaccin, gros entraînement déclenchent les alertes (10/2026) [T].
6. **Bilans sanguins** : saisie « time consuming » dans un tableur, envie de tendances multi-labos [T].
7. **Ce que font les meilleurs en 2026** : Whoop fusionne Journal / Outlook / Check-ins en **un flux quotidien**
   (matin, journée, soir) et extrait les comportements d'un **journal vocal ou texte libre** (05/09/2026) [V] ;
   Bevel « Energy Bank » (énergie de la journée) [T] ; Samsung « Vitals » (écarts nocturnes à la norme) [T] ;
   Oura : migraine (brevet 08/2026), ménopause, cycle [T] ; Alan **Mo** (France) : « dans 10 ans nous aurons tous
   notre compagnon de santé personnel », apprécié parce qu'il **dit quand il ne sait pas et cite ses sources** [V].
8. **Ce qui change vraiment les comportements** : JITAI (méta-analyse 2025, g = 0,15, durable) et intentions
   « si X alors Y » (SMD ≈ 0,24–0,33) : petits effets, robustes et quasi gratuits à implémenter [T]. Les streaks
   rigides culpabilisent [T, faible].

*Reddit toujours bloqué (old.reddit, `.json`, miroirs en 503) : passé par gummysearch, redlib, forums officiels et
presse. LinkedIn : rien d'exploitable via les moteurs. npmjs.com en 403 (versions de plugins non vérifiées).*

### Faits clés trouvés ce matin

- **GT 6 Pro + Gadgetbridge, retours réels** [V] (Codeberg #5428, 8 participants, 09/2025 → 06/2026 ; #6271) : FC,
  SpO₂, stress, température cutanée, sommeil, séances, mises à jour firmware, réponses aux notifications **fonctionnent**
  chez un propriétaire de GT 6 Pro ; un contributeur l'utilise « depuis longtemps uniquement avec Gadgetbridge ».
  Limites : appels VoIP, cadrans partiels, ECG non fonctionnel ; **la VFC n'est jamais mentionnée** (à vérifier chez le
  propriétaire). La page officielle marque la GT 6 Pro « Mostly supported » mais « not tested ».
  **Gadgetbridge 0.95.0 / 0.95.1 sortis aujourd'hui (12/10/2026)** : tension artérielle → Health Connect, altitude,
  export FIT des séances Huawei, export FIT en lot [V]. 0.93 (08/2026) a corrigé les phases de sommeil tronquées dans HC.
  « HR Data Broadcasts » existe sur les montres Huawei, parfois seulement en mode économie ; GT 6 non confirmé [V].
  Packages : Health Sync = `nl.appyhapps.healthsync` [V] ; Huawei Health = `com.huawei.health` [T].
- **Bagues Colmi / Yawell (R02 → R12, ~30–45 €)** [V] : « Highly supported » dans Gadgetbridge sans app constructeur ;
  FC (intervalle réglable), SpO₂, stress, phases de sommeil, pas, VFC selon firmware, température (R09, Yawell R05).
  **Protocole documenté sous licence MIT** (`tahnok/colmi_r02_client` + notes.tahnok.ca : trames de 16 octets avec
  somme de contrôle). → **la première bague à données brutes 100 % locales, réimplémentable légalement.**
  PineTime / InfiniTime : FC 0x2A37 standard, doc BLE publique [V]. Bangle.js 2 : FC standard via une app
  communautaire [T]. Oura, Ultrahuman, RingConn, Galaxy Ring : aucun BLE ouvert, passer par HC [H].
- **CGM** : Juggluco (Libre 2/3, Dexcom G7, Sibionics) → Health Connect + broadcasts xDrip [V] ; Dexcom → HC avec
  **3 h de retard** [V] ; Lingo sur Android depuis 12/2025 (US / UK) [T]. En France, un Libre s'achète en pharmacie
  sans ordonnance pour un non-diabétique [H]. HealthTrack lit déjà la glycémie HC (run 11/10).
- **Types HC réellement écrits** : Samsung = pas, exercice, FC, sommeil avec phases (pas de VFC / SpO₂ / température
  listés) [V] ; Garmin = activité, FC, sommeil, poids (pas de stress / Body Battery / VFC) [T] → **la couverture varie
  par firmware : la mesurer dans l'app** plutôt que la supposer.
- **Téléphone seul** :
  - **ML Kit GenAI (Gemini Nano) : aucun Galaxy A, A56 compris** (page du 08/10/2026) [V] → résumé / sentiment hors
    ligne = LiteRT-LM + Gemma 3 1B int4 (~529 Mo, ~1,1 Go RAM ; 47–55 tok/s sur S24 Ultra, A56 estimé 15–25) [V/H].
  - **APK installé hors Play Store (Android 15+)** : l'accès aux données d'utilisation (temps d'écran), l'écoute des
    notifications et l'accessibilité sont des « paramètres restreints » → l'utilisateur doit d'abord ouvrir Infos de
    l'appli → ⋮ → **« Autoriser les paramètres restreints »** [T]. Le guide in-app doit le prévoir.
  - **Vérification des développeurs Android** : appliquée depuis le 30/09/2026 au Brésil, en Indonésie, à Singapour et
    en Thaïlande, **mondiale en 2027** [T] → risque pour l'installation de l'APK GitHub ; à surveiller (point
    d'attention propriétaire).
  - Sleep API Google Play (lumière + mouvement, `SleepSegmentEvent`) : guide toujours en ligne, codelab « deprecated »
    [V] → plan B : coucher / lever estimés par l'écran (R² ≈ 0,9 avec l'actigraphie, Borger 2019) [T].
  - `@capgo/capacitor-android-usagestatsmanager` n'expose pas `queryEvents` [V doc] → petit plugin Kotlin maison.
  - Preuves humeur passive : LifeSense (n = 1013, 2024) : plus de temps à la maison **que sa propre moyenne** → PHQ-8
    plus élevé 2 semaines après (β = 0,22) ; modèles à 5–6 % de variance expliquée [V]. MONDY n-of-1 (08/2026, n = 11) :
    les modèles personnels ne battent la moyenne personnelle que chez 8 / 11 [V]. Revue JMIR 08/2025 : sommeil
    d'abord, puis pas / mobilité, appels, écran nocturne [V]. → **écart à sa plage habituelle, modestie affichée.**
  - **Emobot** (désormais emobothealth.com, cap sur la psychiatrie US) : visage pendant l'usage normal, voix réduite
    sur l'appareil à des caractéristiques acoustiques, pas, sorties, usage nocturne ; installation 3 min puis rien ;
    bandes de « plage habituelle » + alerte de rechute ; résumé hebdo « Insight » ; MADRS r = 0,895 (n = 45, données
    fabricant, non publiées) [V]. **Sahha** : score 0–100 sur 6 habitudes (pas, heures actives, inactivité, régularité
    activité / sommeil, alignement circadien), r = −0,28 avec la dépression DASS, non diagnostique [T] → modèle simple
    à imiter.
  - Voix FR hors ligne : `SpeechRecognizer` on-device (fr-FR à tester sur l'A56), Vosk small-fr 41 Mo (WER 24 %),
    Whisper-small FR affiné (WER ~12 %, 250 Mo) [V/T]. Sentiment FR : `distilcamembert-base-sentiment` [T].
- **Conversations** : Omi (MIT, API REST + **serveur MCP**, gratuit en transcription locale) reste le seul ouvert ;
  Plaud NotePin S (CES 2026, vendu en UE) sans API publique ; Limitless coupé dans l'UE ; Bee US / iOS ; Sandbar
  Stream (bague de notes vocales, été 2026) [V/T]. Aucune app Android open source de lifelogging micro continu [T].

### Idées classées (impact × faisabilité) — nouvelles ou fortement précisées

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I22 | **Radar avec facteurs explicatifs** : alcool / sport du soir / malade / voyage tagués la veille → « explication probable » au lieu d'une alerte ; « Je me sens bien / pas bien » en 1 tap pour calibrer | Moins de fausses alertes | 4 | 5 | 20 |
| I23 | **« Qui envoie quoi »** : matrice source × mesure sur 30 j (d'après `sourceName` HC / BLE), trous signalés (« plus de VFC depuis 4 j ») | Objets connectés fiables | 4 | 5 | 20 |
| I24 | **Briefing du matin** : une carte « Votre journée » (sommeil vs norme, cœur, Radar, météo / pression, énergie prévue) + **une** action ; IA optionnelle | Des actions, pas des graphiques | 5 | 4 | 20 |
| I25 | **Sommeil estimé par le téléphone** (plus longue période écran éteint, charge, immobilité) quand aucune montre n'envoie | Zéro saisie sans montre | 5 | 4 | 20 |
| I26 | **Journal libre (dictée / texte) → tags et intensités extraits** (Gemini JSON, confirmation en 1 tap) | Saisie en un geste | 5 | 4 | 20 |
| I27 | **Courbe caféine (et alcool)** : modèle à 1 compartiment, demi-vie ajustable, « caféine restante au coucher » comme variable | Sommeil, décisions | 4 | 5 | 20 |
| I28 | **Bague Colmi / Yawell en direct** (pilote BLE réimplémenté d'après le protocole MIT) : FC, SpO₂, sommeil, pas, sans app | Données brutes, matériel bon marché | 4 | 3 | 12 |
| I29 | **Glycémie après les repas** (HC ← Juggluco / Libre / Dexcom) : courbe 2 h superposée au repas, aire sous la courbe ; avertir du retard Dexcom | Relier alimentation et métabolisme | 4 | 4 | 16 |
| I30 | **Plans « si… alors… »** choisis par l'utilisateur (« si VFC basse → marche 20 min, pas d'alcool »), notification locale seulement quand la condition est vraie, ≤ 1 / j | Passer à l'action | 4 | 3 | 12 |
| I31 | **Indice « dans votre plage habituelle »** (style Sahha / Emobot) : z-scores 28 j de sommeil, régularité, pas, écran tard, temps à la maison → bande perso, calibré par le check-in | Humeur estimée (affine I7) | 5 | 4 | 20 |
| I32 | **Contrôle qualité des nuits** : nuits « 100 % léger » ou sans phases, nuits tronquées → exclues des moyennes de phases | Fiabilité | 3 | 5 | 15 |
| I33 | **Réglage IA** (désactivée / à la demande / proactive) + ton sans culpabilité (pas de streak cassé) | Confiance | 3 | 5 | 15 |
| I34 | **Cycle menstruel** (HC `MenstruationPeriod`, température) → phase comme variable de contrôle des Analyses | Hub complet | 4 | 3 | 12 |
| I35 | **Risque migraine / allergie du jour** (pression 24 h, pollen, dette de sommeil, saut de caféine) — seulement après ≥ 30 épisodes tagués | Anticiper | 4 | 3 | 12 |
| I36 | **Pas du téléphone sans Health Connect** (`TYPE_STEP_COUNTER`, relevé périodique) | Activité sans montre | 3 | 4 | 12 |
| I37 | **Routine et temps à la maison sans GPS** (Wi-Fi dominant la nuit, haché ; transitions d'activité) | Humeur (meilleur signal intra-personne) | 4 | 3 | 12 |
| I38 | **LLM local** (LiteRT-LM + Gemma 3 1B, téléchargement optionnel) pour le résumé hebdo hors ligne — Gemini Nano indisponible sur A56 | Assistant sans cloud | 3 | 2 | 6 |

Mises à jour d'idées existantes : **I6** (temps d'écran) — prévoir le guide « Autoriser les paramètres restreints » et
un plugin Kotlin `queryEvents` maison ; **I14** — import FIT d'autant plus utile que Gadgetbridge 0.95 exporte en lot ;
**I21** (matériel) — ajouter la bague Colmi R10 (~35 €, ouverte), ceinture Coospo H6 (~30 €) / Polar H10, tensiomètre
A&D UA-651BLE (profil standard déclaré), Medisana BU 572 ; Omron / Beurer / Withings : profil standard **non garanti**.

### Détail et pistes d'implémentation

**I22 — Radar expliqué.** `radar.js` connaît déjà les signaux ; `behaviorTags.js` les tags (alcool, sport le soir,
malade…). Si un tag « confondant » existe la veille (alcool, sport le soir, repas tardif) ou un voyage / vaccin
(nouveaux tags), le niveau reste affiché mais le message devient « Probablement lié à l'alcool d'hier soir » ; tag
« malade » → confirmation. Bouton « Je me sens bien / Je couve quelque chose » stocké (entrée `radar_feedback`) pour
recalibrer plus tard les seuils. Tests purs sur des séries synthétiques. Petit, visible, fondé sur un vrai reproche.

**I23 — Qui envoie quoi.** Dans « Mes appareils » : pour chaque source détectée, les types reçus sur 30 jours avec la
date du dernier ; alerte douce si un type habituel s'arrête (≥ 3 j sans alors qu'il arrivait chaque jour). Fonction
pure `sourceCoverage(entries, now)` → testable. Répond au « est-ce que ma montre envoie vraiment la VFC ? ».

**I24 — Briefing du matin.** En haut du tableau de bord jusqu'à midi : 3 lignes calculées localement (sommeil de la
nuit vs norme, cœur / Radar, contexte météo — pression en chute, pollen) + « Énergie prévue » (prédiction du jour
existante, fourchette) + **une** suggestion tirée des « Pistes à tester » solides. Gemini seulement si l'utilisateur
l'active (I33). Gabarit testable, aucun chiffre inventé.

**I25 — Sommeil par le téléphone.** Plugin Kotlin `PhoneUsage` (même que I6) : événements `SCREEN_INTERACTIVE /
NON_INTERACTIVE`, `KEYGUARD_HIDDEN`, + état de charge ; plus longue période sans interaction entre 20 h et 12 h →
`sleep` source `phone_estimate`, confiance « estimée », jamais prioritaire sur une montre (dédoublonnage par source).
Correction en un geste (« je me suis couché à… »).

**I26 — Journal libre → tags.** Réutiliser la dictée du repas décrit (run 10/10) : un champ « Racontez votre journée »
→ Gemini (schéma JSON : tags connus + intensité, caféine (heures, quantités), alcool (verres), symptômes, personnes
vues, humeur 1–5) → écran de confirmation pré-coché → entrées habituelles. Le texte reste en local ; seul le texte
saisi part vers Gemini avec la clé de l'utilisateur. Repli sans clé : mots-clés locaux (« café », « verre de vin »).

**I27 — Caféine.** Saisie en 1 tap (« ☕ maintenant ») ou extraite par I26 ; C(t) = Σ dose·e^(−ln2·Δt/T½), T½ = 5 h par
défaut ; « caféine restante à l'heure habituelle de coucher » = variable des Analyses et levier (« dernier café avant
14 h »). Alcool : élimination linéaire ~0,1–0,15 g/L/h, présenté prudemment.

**I28 — Bague Colmi.** Pilote dans le registre BLE (`match` : nom annoncé « R02_… / R10_… », service UART Nordic
6E40FFF0…) ; trames de 16 octets (commande, données, somme de contrôle) ; d'abord FC en direct + batterie, puis
historique FC / SpO₂ / pas / sommeil. Réimplémenter **depuis les notes de protocole MIT**, jamais depuis Gadgetbridge
(AGPL). Tests sur trames d'octets. Limite : la bague ne doit pas être connectée en même temps à son app.

**I29 — Glycémie post-repas.** Entrées `blood_glucose` déjà lues ; pour chaque repas, fenêtre 0–2 h : pic, temps au
pic, aire au-dessus de la valeur avant le repas ; carte du repas « +38 mg/dL, retour en 1 h 40 ». Avertissement
« outil de curiosité, pas un avis médical » ; aucun conseil d'insuline (sinon dispositif médical).

**I31 — Plage habituelle.** Reprend I7 avec le modèle Sahha / Emobot : par signal, z-score sur 28 j ; indice = moyenne
pondérée (poids appris par Ridge sur les check-ins quand ≥ 14 jours, sinon égaux) ; affichage en bande « dans / au-dessus
/ en dessous de votre habitude » ; ≥ 7 jours valides / 14 ; mention « estimation, pas un diagnostic » ; si l'indice
reste bas ≥ 2 semaines : renvoi doux vers un professionnel (et 3114 en cas de détresse).

### Sources (consultées le 12/10/2026)

- Besoins / apps : https://gummysearch.com/r/QuantifiedSelf ; https://the5krunner.com/2025/11/06/garmin-connect-auto-logging-leak/ ; https://www.community.whoop.com/t/some-feedback-after-9-months-increased-ai-intrusion/13756 ; https://www.techradar.com/health-fitness/smartwatches/garmins-new-subscription-ai-feature-is-hilariously-bad-so-far ; https://gadgetsandwearables.com/2026/09/05/whoop-custom-journal-workout-tracking-update/ ; https://thenextweb.com/news/whoop-doctors-fitbit-air-google-health-ai ; https://idevice.com/oura-wants-your-ring-to-see-a-migraine-coming ; https://www.maddyness.com/2026/04/21/dans-10-ans-nous-aurons-tous-notre-compagnon-de-sante-la-french-tech-deploie-deja-ses-agents-ia/ ; https://ubiehealth.com/doctors-note/wearable-tracking-detect-illness-prior-symptoms-49101q7 ; https://pubmed.ncbi.nlm.nih.gov/35236896/ ; https://f-droid.org/packages/com.uc.caffeine/ ; https://fis.uni-bamberg.de/handle/uniba/116116
- Appareils : https://gadgetbridge.org/gadgets/wearables/huawei-honor/ ; https://codeberg.org/Freeyourgadget/Gadgetbridge/issues/5428 ; https://codeberg.org/Freeyourgadget/Gadgetbridge/issues/6271 ; https://gadgetbridge.org/blog/release-0_95_01/ ; https://consumer.huawei.com/ca/support/content/en-us15827504/ ; https://healthsync.app/ ; https://gadgetbridge.org/gadgets/rings/yawell/ ; https://github.com/tahnok/colmi_r02_client ; https://github.com/InfiniTimeOrg/InfiniTime/blob/main/doc/ble.md ; https://www.juggluco.nl/Juggluco/index.html ; https://www.dexcom.com/en-us/faqs/can-i-share-glucose-data-with-google-health-connect ; https://developer.samsung.com/health/health-connect-faq.html ; https://gadgetbridge.org/basics/pairing/huami-xiaomi-server/ ; https://developer.garmin.com/gc-developer-program/health-api/ ; https://f-droid.org/packages/com.health.openscale/
- Téléphone / ML / humeur : https://developers.google.com/ml-kit/genai ; https://huggingface.co/litert-community/Gemma3-1B-IT ; https://developers.google.com/location-context/sleep ; https://9to5google.com/2024/09/12/android-15-sideloaded-apps-restrictions/ ; https://capgo.app/docs/plugins/android-usagestatsmanager/ ; https://f1000research.com/articles/8-754 ; https://pmc.ncbi.nlm.nih.gov/articles/PMC10955925/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC12411791 ; https://pmc.ncbi.nlm.nih.gov/articles/PMC13507524/ ; https://emobothealth.com ; https://sahha.ai/mental-health-api/ ; https://alphacephei.com/vosk/models ; https://developer.android.com/reference/android/speech/SpeechRecognizer
- Conversations : https://github.com/BasedHardware/omi ; https://www.omi.me/pricing ; https://dataconomy.com/2026/01/05/plaud-launches-notepin-s-ai-notetaker-at-ces-2026/ ; https://www.uctoday.com/devices-workspace-tech/sandbar-ai-voice-note-taking-ring/

### À creuser au prochain run idées (12/10 20:30)

- VFC de la GT 6 Pro via Gadgetbridge → HC : présente ou non ? (demander au propriétaire ; lire `sourceName` des VFC).
- Protocole Colmi : lire notes.tahnok.ca en détail (commandes d'historique, sommeil) avant d'estimer l'effort.
- Vérification des développeurs Android 2027 : options pour un APK distribué hors store (compte développeur gratuit ?
  « advanced flow ») — impact direct sur la mise à jour en 1 clic.
- Tensiomètres / balances vendus en France qui implémentent vraiment les profils standard (tests communautaires).
- Reddit : retenter (miroirs, archives) ; LinkedIn : posts Emobot / Withings / Alan.

---

## Run du 11/10/2026 20:30 (Paris) — objets connectés, capture passive, humeur, conversations

### Ce que veulent les gens (synthèse)

1. **Fin des silos** : « tried every integration tool, and still struggle to get our data to "talk to each other" »
   (fil r/QuantifiedSelf cité sur le forum QS) ; chaque fabricant garde son silo, synchros à sens unique (Garmin → HC
   en écriture seule, mars 2026). Google lance « Google Health » (ex-Fitbit, mai 2026) comme hub + coach Gemini à
   9,99 $/mois → **notre créneau : hub multi-marques, local, gratuit, au-delà de la santé physique**.
2. **Moins de saisie** : Bearable est jugé bon pour ceux « qui ne craignent pas les check-ins manuels » — c'est
   précisément la limite. Complexité de saisie = cause n° 1 d'abandon (déjà noté RESEARCH V3).
3. **Des actions, pas des graphiques** (Bevel, Whoop Coach, Oura Advisor).
4. **Saisir une intensité**, pas seulement oui / non (critique d'Exist sur le forum QS).
5. **Être prévenu tôt** d'une maladie (Oura Symptom Radar ; FC repos ↑, VFC ↓, respiration ↑ jusqu'à ~1 semaine avant
   les symptômes).
6. **Relier le médical** (bilans sanguins : Whoop Advanced Labs, Guava).
7. **Maîtrise de ses données** (EFF, juillet 2026 : les wearables n'ont pas de protection santé particulière).

*Reddit inaccessible depuis la session (blocage de l'outil, miroirs en 403) : besoins tirés du forum Quantified Self,
de la presse, d'avis et d'études. À retenter au prochain run idées.*

### Faits clés trouvés ce soir

- **Huawei Watch GT 6 Pro (montre du propriétaire)** — [V] prise en charge par **Gadgetbridge depuis la 0.88.0
  (12/12/2025)**, « Mostly supported », appairage possible **sans réinitialiser** la montre (ID de compte Huawei à
  17 chiffres → clé d'authentification ; retirer les permissions de Huawei Health **sans désappairer** la montre).
  Données : FC, FC repos, VFC (selon appareil), SpO₂, stress, température cutanée, sommeil (phases avec HarmonyOS 5+),
  pas, calories, VO2max, séances avec GPS. [V] **Gadgetbridge écrit dans Health Connect depuis la 0.89 (10/02/2026)** :
  pas, distance, FC, FC repos, VFC, SpO₂, température, fréquence respiratoire, sommeil, VO2max, exercices (stress non
  écrit). Dernière version 0.94 (17/09/2026). → **chemin immédiat sans code : GT 6 Pro → Gadgetbridge → Health
  Connect → HealthTrack.**
  - Alternatives : Health Sync (Appyhapps, payant, HMS Core requis, couverture partielle — phases de sommeil / SpO₂
    souvent perdues) ; Huawei Health Kit = revue manuelle Huawei, dossier d'entreprise → irréaliste pour nous ; **pas
    de synchro native Huawei → Health Connect** en 2026 ; **export RGPD** (Privacy Center, XLS + JSON, ≤ 30 j,
    page du 18/05/2026) pour l'historique.
  - Protocole : Gadgetbridge (AGPL) ne documente pas le protocole Huawei ; base réutilisable **sous licence MIT** :
    `zyv/huawei-lpv2` (Python, « Huawei BLE Link Protocol v2 ») + conférence eh19. Les montres récentes semblent
    passer à une variante (LPv3 ? chiffrement réglable dans GB 0.92) [H]. Huawei et Honor = un seul pilote dans
    Gadgetbridge → une famille [H].
- **Autres fabricants** : Health Connect couvre 7 marques sur 9 (Samsung, Garmin en écriture seule depuis 07/2025,
  Fitbit/Pixel, Zepp (26 types, 01/2025), Mi Fitness, Withings, Oura, Polar, Coros). **Fitbit Web API éteinte le
  30/10/2026**, Google Health API fermée aux nouveaux projets [V]. Garmin Connect Developer = entreprises approuvées.
  OAuth ouverts à un particulier : **Polar AccessLink (gratuit)** [V], **Whoop API v2** (abonnement) [V], Oura v2
  (OAuth, ≤ 10 utilisateurs sans validation) [T].
- **Gadgetbridge, familles de protocoles** [V] : Huawei/Honor (un pilote) ; Xiaomi : **Huami** (Mi Band ≤ 7,
  Amazfit anciens), **Zepp OS** (Balance, Bip 5, GTR/GTS 3–4…), **Xiaomi protobuf** (Mi Band 8–10, Redmi Watch 2–6,
  Watch S1–S4) ; Garmin **GFDI/protobuf** (+59 modèles en 0.94). Tous (sauf vieux Bip / Mi Band 3) exigent une clé
  d'authentification issue de l'app officielle.
- **BLE standard** : FC 0x180D (+ intervalles RR → VFC RMSSD), balance 0x181D / 0x181B, tensiomètre 0x1810,
  glycémie 0x1808 / CGM 0x181F, oxymètre 0x1822, thermomètre 0x1809, RSC / CSC / puissance / Fitness Machine.
  Appareils réels : ceintures Polar H10 / Garmin / Wahoo, montres Garmin en « diffusion FC », Omron (mesure courante
  en standard, historique propriétaire), balances Mi / Chipsea (données dans l'annonce, sans connexion). GHS (Generic
  Health Sensor, 2023) : pas encore de produit grand public trouvé.
- **Capacitor** : `@capacitor-community/bluetooth-le` **8.3.0** (28/09/2026, compatible Capacitor 8) : filtres
  services / nom / données fabricant / service data, `getBondedDevices()` ; pas d'arrière-plan (→ service natif).
  Companion Device Manager (Android 16 : `startObservingDevicePresence`) → réveil quand l'appareil revient à portée,
  plugin natif à écrire. Apps installées : `<queries>` par package + `PackageManager` (pas de `QUERY_ALL_PACKAGES`).
- **Humeur** : Emobot (CentraleSupélec, 2022) — voix, visage, mouvement, usage de l'écran, sommeil, activité ;
  validation intermédiaire ASCP 2026 : r = 0,895 avec la MADRS en intra-individuel, ≥ 7 jours valides sur 14 ;
  annonce de « Weekly Insights » (résumé en langage simple de la semaine). Réalité hors labo : AUC ~0,6–0,75 ; GLOBEM
  (UW, 2022) : les modèles généralisent mal d'une cohorte à l'autre → **l'écart à sa propre ligne de base** est la
  bonne approche. Mobilité GPS = meilleur signal passif (r ≈ −0,45 à −0,6 avec le PHQ-9, Saeb 2015). Kintsugi (voix)
  a fermé en 02/2026 en publiant ses modèles.
- **Conversations** : **Omi** = seul vraiment ouvert (open source, API REST `api.omi.me/v1/dev` avec clé
  personnelle, webhooks, SDK BLE autonome, transcription illimitée sur le téléphone en gratuit). **Plaud** : Developer
  Platform en bêta (05/2026), CLI, exports TXT/SRT/DOCX/PDF. **Limitless** racheté par Meta (12/2025), coupé dans
  l'UE. **Bee** racheté par Amazon, pas d'API. Micro du téléphone : service de premier plan `microphone` (Android 14+),
  lancé depuis l'app, notification permanente ; transcription locale (`SpeechRecognizer` hors ligne, Whisper.cpp,
  Vosk FR ~50 Mo). Droit FR : art. 226-1 Code pénal → rappel simple, sans bloquer.

### Idées classées (impact × faisabilité)

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I1 | **Guide « Montre Huawei → Gadgetbridge → Health Connect »** dans Connecteurs + détection des apps installées | Objets connectés, zéro saisie | 5 | 5 | 25 |
| I2 | **Lire plus de types Health Connect** (fréquence respiratoire, température, poids, tension, glycémie, VO2max ?) | Données brutes, radar maladie | 4 | 5 | 20 |
| I3 | **Assistant « Mes appareils »** : apps santé installées (`<queries>`) → connecteur conseillé + étapes | Autodétection | 5 | 4 | 20 |
| I4 | **Contexte automatique : météo, pression, qualité de l'air, pollen** (Open-Meteo, sans clé) | Déclencheurs (migraine, énergie, allergies) | 4 | 5 | 20 |
| I5 | **Radar maladie étape 2** : + respiration et température, « signes mineurs / nets », mode repos | Être prévenu tôt | 5 | 4 | 20 |
| I6 | **Temps d'écran et « téléphone au lit »** (UsageStatsManager) | Sommeil, humeur, zéro saisie | 5 | 4 | 20 |
| I7 | **Humeur estimée** : écart à la norme (sommeil, VFC, activité, écran, régularité) calibré sur les check-ins | Priorité n° 3 | 5 | 4 | 20 |
| I8 | **Couche BLE générique, étape 1 : profils standard** (FC + RR → VFC, balance, tensiomètre, thermomètre, oxymètre) | Données brutes, compatibilité large | 5 | 3 | 15 |
| I9 | **Résumé de la semaine en langage simple** (local, Gemini optionnel pour la rédaction) | Des actions, pas des graphiques | 4 | 4 | 16 |
| I10 | **Import Omi** (clé perso → conversations / mémoires → journal, repas évoqués, stress) | Conversations | 4 | 3 | 12 |
| I11 | **Calendrier → charge de la journée** (CalendarContract) | Stress / énergie | 4 | 4 | 16 |
| I12 | **Repas détectés dans la galerie** (nouvelles photos → « repas à 12 h 40 ? ») | Zéro saisie repas | 4 | 3 | 12 |
| I13 | **Tags avec intensité** (douleur 0–10, nombre de verres) + check-in depuis une notification / un widget | Saisie en un geste | 3 | 4 | 12 |
| I14 | **Import des exports constructeurs** (Huawei JSON RGPD, Garmin FIT, Samsung CSV, Oura CSV, Zepp CSV) | Historique, silos | 4 | 3 | 12 |
| I15 | **Mobilité / temps dehors** (activity recognition, nb de lieux, rayon, sans coordonnées précises) | Humeur (meilleur signal passif) | 4 | 3 | 12 |
| I16 | **Bilans sanguins par photo / PDF** (Gemini → biomarqueurs, courbes) | Relier le médical | 4 | 4 | 16 |
| I17 | **Journal vocal** (dictée → transcription locale → résumé, sentiment) | Conversations / humeur | 4 | 3 | 12 |
| I18 | **« Jours similaires »** (kNN sur le vecteur du jour, « et le lendemain ? ») | Comprendre | 3 | 5 | 15 |
| I19 | **Bilan pour le médecin** (PDF 30 / 90 jours, local) | Utilité concrète | 3 | 5 | 15 |
| I20 | **Pilote BLE Huawei direct** (à partir de `huawei-lpv2`, MIT) | Données brutes sans app tierce | 4 | 1 | 4 |
| I21 | **Recommandations matériel** : ceinture FC (Polar H10, RR → VFC fiable), tensiomètre BLE standard, balance | Mieux mesurer | 3 | 5 | 15 |

### Détail et pistes d'implémentation

**I1 — Guide Huawei → Health Connect (zéro code natif).**
Dans Plus → Connecteurs, une carte « Montre Huawei / Honor » : « Votre montre n'écrit pas dans Health Connect. Solution
gratuite : Gadgetbridge. » Étapes : (1) installer Gadgetbridge (F-Droid) ; (2) récupérer l'ID de compte Huawei
(17 chiffres) ; (3) retirer les permissions de Huawei Health **sans désappairer la montre** ; (4) appairer dans
Gadgetbridge avec la clé ; (5) Réglages → Intégrations → Health Connect, cocher les types, « Sync after device sync » ;
(6) revenir dans HealthTrack → synchroniser. Contreparties affichées : on quitte l'app Huawei au quotidien, le stress ne
passe pas, une mise à jour du firmware peut casser des fonctions. Liens externes via `@capacitor/app-launcher` (déjà
présent). Variante payante : Health Sync. Même schéma pour Xiaomi / Amazfit (Zepp et Mi Fitness écrivent déjà dans HC →
simple « activez Health Connect dans Zepp »).

**I2 — Types Health Connect manquants.** `@capgo/capacitor-health` 8.4.5 lit déjà `respiratoryRate`,
`bodyTemperature`, `basalBodyTemperature`, `weight`, `bodyFat`, `bloodPressure`, `bloodGlucose`, `height`
(vérifié dans `definitions.d.ts`), mais `READ_TYPES` n'en demande que 9. Ajouter les types, les entrées et la carte du
journal ; `SkinTemperatureRecord` (température cutanée nocturne, écrite par Gadgetbridge / Samsung / Oura) n'est pas
exposé par le plugin → petit ajout natif ou PR au plugin. Attention : demander de nouvelles permissions HC → la
synchro existante ne doit pas échouer si l'utilisateur refuse les nouvelles (tester).

**I3 — « Mes appareils » (autodétection).** Plugin natif minimal `InstalledApps.check(packages[])` +
`<queries>` dans le manifeste pour ~15 packages (Huawei Health `com.huawei.health`, Samsung Health, Garmin Connect,
Fitbit, Zepp, Zepp Life, Mi Fitness, Withings, Oura, Polar Flow, Whoop, Gadgetbridge, Health Sync, Health Connect —
**noms à vérifier**). Table `appCatalog` : package → écrit-il dans HC ? quels types ? connecteur conseillé + guide.
Écran : « Détecté : Huawei Health → vos données n'arrivent pas dans Health Connect → [Guide] ». Plus tard :
`getBondedDevices()` (BLE) pour lister montres / balances appairées au téléphone.

**I4 — Contexte environnemental.** Open-Meteo (gratuit, sans clé) : température, pression, humidité, ensoleillement,
`european_aqi`, pollens (`air-quality-api`). Position **approximative** (ville, arrondie à 0,1°) choisie une fois, un
appel par jour + historique (`archive-api`) → variables des Analyses (« pression en baisse », « pollen élevé »). Seul
une position grossière sort du téléphone, aucune donnée de santé → conforme à la règle local-first ; le dire dans
Paramètres.

**I5 — Radar maladie étape 2.** Ajouter respiration (HC `respiratoryRate`, souvent nocturne) et température aux
signaux de `radar.js` ; niveaux « signes légers / nets » à la manière d'Oura ; proposer « journée calme » ; jamais de
diagnostic. Dépend d'I2.

**I6 — Écran et téléphone au lit.** Plugin `@capgo/capacitor-android-usagestatsmanager` (à vérifier) ou natif ;
permission spéciale accordée dans les réglages Android (guide en un écran). Variables : temps d'écran / j, après
22 h, après l'heure de coucher (sommeil HC), dernier usage avant l'endormissement, premier usage au réveil (→ sommeil
estimé sans montre), catégories (réseaux sociaux, jeux). Études : usage au lit ↔ latence d'endormissement et VFC.

**I7 — Humeur estimée (style Emobot, sur l'appareil).** Score quotidien « humeur estimée » = régression personnelle
(Ridge déjà disponible) des check-ins sur l'écart à la norme de : sommeil, régularité, VFC, FC repos, pas, temps
dehors, écran tard, météo ; affiché avec une fourchette et « estimation, pas un diagnostic » ; ≥ 7 jours valides /14
(seuil Emobot) ; sert aussi à **pré-remplir le check-in** (un tap pour confirmer → saisie en un geste). Étapes
suivantes : sentiment du journal / des conversations, prosodie (plus tard, fiabilité faible).

**I8 — Couche BLE générique.** `@capacitor-community/bluetooth-le` 8.3. Architecture :
`DeviceDriver { id, kind, match(fingerprint) → score, capabilities, requirements, connect, sync(since), stream }` ;
registre ordonné (BLE standard par service SIG → pilotes fabricant → « app installée → HC » → cloud OAuth) ; empreinte
= nom, UUID de services annoncés / découverts, company ID, service data, DIS (0x180A), état d'appairage ; garde-fou :
**ne jamais se connecter à une montre gérée par son app officielle** ; appareil inconnu → empreinte stockée en local
(sans adresse MAC) + export JSON pour ajouter un pilote. Étape 1 = FC 0x180D (mesure + RR → VFC RMSSD sur 5 min, idéal
avec une ceinture), puis balance / tensiomètre / thermomètre (indications, RACP pour l'historique). Tester le parsing
avec des trames d'octets en TDD (pas besoin d'appareil).

**I9 — « Votre semaine en clair ».** Agrégats calculés localement (moyennes vs norme, tags, liens solides) → texte
gabarit en français ; Gemini (clé utilisateur) seulement pour reformuler, chiffres vérifiés (déjà R#13).

**I10 — Import Omi.** Clé développeur personnelle saisie dans Paramètres, `GET /v1/dev/user/conversations` (≈ 60
lectures / h), stockage local (titre, résumé, horodatage, catégories) → carte « Conversations » du journal ; extraction
optionnelle (repas évoqués, sport, stress) ; rappel « l'enregistrement d'autrui peut nécessiter leur accord ».
Plaud : attendre la sortie de bêta du SDK ; en attendant, import de fichiers TXT exportés.

**I14 — Imports de fichiers constructeurs.** Garmin FIT (format documenté, SDK FIT officiel), Huawei JSON (RGPD,
schéma à découvrir sur un vrai export du propriétaire), Samsung CSV, Oura CSV. Aperçu avant import (même UX que
l'import sûr), dédoublonnage avec HC.

**I20 — Pilote BLE Huawei.** Seulement après I1/I3/I8 ; partir de `huawei-lpv2` (MIT) et de la conférence eh19,
vérifier sur la GT 6 Pro (chiffrement, LPv3 ?) ; jamais de code Gadgetbridge (AGPL). Contrainte : la montre ne parle
qu'à une app à la fois → mode « HealthTrack remplace Huawei Health ».

### Sources (consultées le 11/10/2026)

- Gadgetbridge : https://gadgetbridge.org/blog/release-0_88_00/ (12/12/2025) ; https://gadgetbridge.org/basics/topics/huawei-honor/ ; https://gadgetbridge.org/basics/pairing/huawei-honor-pairing/ ; https://gadgetbridge.org/basics/integrations/health-connect/ ; https://gadgetbridge.org/blog/release-0_94_00/ (17/09/2026) ; https://gadgetbridge.org/basics/topics/xiaomi-protobuf/ ; https://codeberg.org/Freeyourgadget/Gadgetbridge/issues/5428 (28/09/2025)
- Huawei : https://healthsync.app/f-a-q/ ; https://www.fitmesh.fit/en/blog/huawei-health-health-connect-sync (20/06/2026, éditeur intéressé) ; https://consumer.huawei.com/ie/support/data-act/ (18/05/2026) ; https://github.com/zyv/huawei-lpv2 (MIT) ; https://media.ccc.de/v/eh19-186-all-your-fitness-data-belongs-to-you-reverse-engineering-the-huawei-health-android-app
- Fabricants : https://developers.google.com/health/reference/rest/v4beta/users ; https://developer.samsung.com/health/data/release-note.html ; https://developer.garmin.com/gc-developer-program/overview ; https://www.polar.com/accesslink-api/ ; https://developer.whoop.com/docs/developing/overview ; https://support.ouraring.com/hc/en-us/articles/360025441594 ; https://gadgetsandwearables.com/2025/01/24/zepp-health-connect/
- BLE / Android : https://github.com/capacitor-community/bluetooth-le ; https://developer.android.com/develop/connectivity/bluetooth/companion-device-pairing ; https://developer.android.com/training/package-visibility/declaring ; https://www.bluetooth.com/specifications/specs/generic-health-sensor-profile/ ; https://dcrainmaker.com/2020/06/tidbit-bluetooth-broadcasting.html
- Humeur : https://www.biospace.com/press-releases/nrx-pharmaceuticals-nasdaq-nrxp-strategic-partner-emobot-presents-late-breaking-clinical-validation-of-the-emocare-depression-thermometer-at-ascp-2026 (28/05/2026) ; https://www.linkedin.com/company/emobot/ ; https://ubicomplab.cs.washington.edu/publications/globem ; https://peerj.com/articles/2537 ; https://mental.jmir.org/2026/1/e85319 ; https://bhbusiness.com/2026/02/11/mental-health-voice-biomarker-kintsugi-closes-makes-all-technology-and-research-public/ ; https://docs.sahha.ai/docs/products/scores/mental ; https://pmc.ncbi.nlm.nih.gov/articles/PMC9643910/
- Conversations : https://docs.omi.me/doc/developer/api/overview ; https://www.omi.me/pricing ; https://docs.plaud.ai/plaud-mcp-cli/cli ; https://www.neowin.net/news/meta-acquires-ai-startup-limitless-ending-sales-of-its-popular-pendant-wearable ; https://www.retaildive.com/news/amazon-acquires-ai-wearables-company-bee/753810/ ; https://developer.android.google.cn/develop/background-work/services/fg-service-types ; https://developers.google.com/ml-kit/genai
- Besoins / apps : https://forum.quantifiedself.com/t/personal-dashboards-for-self-tracking-data/8202?page=5 ; https://forum.quantifiedself.com/t/improving-my-mental-and-physical-health-through-data-where-to-start/8686 ; https://www.sensai.fit/blog/wearable-apple-health-integration-what-syncs-oura-whoop-garmin ; https://techcrunch.com/2026/05/07/googles-9-99-per-month-ai-health-coach-launches-may-19/ ; https://www.techadvisor.com/article/2575433/oura-symptom-radar-i-should-have-listened-to-new-smart-ring-feature.html ; https://bmjopen.bmj.com/content/12/6/e058274 ; https://www.wareable.com/health-and-wellbeing/whoop-advanced-labs-blood-test-uploads-global-rollout-official ; https://open-meteo.com/en/docs/air-quality-api ; https://kb.exist.io/article/55-will-exist-find-correlations-across-multiple-days ; https://www.eff.org/deeplinks/2026/07/most-smart-watches-rings-and-bands-lack-basic-transparency-reports-and-key-privacy

### À creuser au prochain run idées

- Reddit (r/Huawei, r/Gadgetbridge, r/QuantifiedSelf) par un autre chemin : retours réels sur GT 6 Pro + Gadgetbridge.
- Noms de packages exacts (Huawei Health, Health Sync) et liste des types HC écrits par Samsung / Mi Fitness.
- Gemini Nano (ML Kit GenAI) sur Galaxy A56 : disponible ou non ? (conditionne résumé / sentiment hors ligne).
- Règles Google Play pour `PACKAGE_USAGE_STATS` (sans objet tant que l'APK est distribué via GitHub).
- Bagues (Oura, RingConn, Ultrahuman, Samsung Ring), CGM grand public (Stelo, Lingo) : accès aux données brutes.

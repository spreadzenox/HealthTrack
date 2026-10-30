# Conformité Google Play — variante « play » (jalon 3b)

> Créé au run du 21/10/2026 06:30 (Paris). Étude de la lecture du visage face aux règles Play, revue des permissions
> du manifeste, divulgations avant les autorisations sensibles. Les règles Play bougent : **à revérifier à chaque
> run « idées »** (sources ci-dessous) et avant l'envoi en test fermé. Ce n'est pas un avis juridique.

## 0. Relectures datées des règles

- **30/10/2026 08:33** (`IDEES.md` I196) — annonces Play du 15/07 et du 29/10/2026 et tableau des échéances relus :
  réseau local et « gérer les contacts » (25/08/2027, Android 17), AppFunctions (14/04/2027), géorepérage retiré des
  services de premier plan, remises d'éligibilité, sélecteur de contacts, bouton de localisation (27/01/2027).
  **Rien ne concerne Halcya** (BLE seulement, pas de contacts, localisation approximative en API ≥ 31). Rien de neuf
  sur santé, Health Connect ou caméra. Vérification des développeurs : enregistrement des apps Play exigé depuis le
  30/09/2026 (P34) ; version GitHub à enregistrer après la migration de clé (VEILLE-1).

## 1. Lecture du visage : quelle option pour Google Play ?

Aujourd'hui (variante sideload) : un **service de premier plan de type `camera`** (`FaceSenseService`), démarré app
ouverte, qui prend 3 images à **chaque déverrouillage**, app fermée ; plus `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`,
une relance après redémarrage / mise à jour (`FaceResumeReceiver`) et le guide Shizuku / ADB (app-op `CAMERA allow`).

Ce que disent les règles (état connu au 21/10/2026, à revérifier) :

- **Types de services de premier plan** (cible Android 14+) : chaque type déclaré doit être justifié dans la Play
  Console (formulaire « Autorisations des services de premier plan », avec description et **vidéo** de la fonction).
  Le type `camera` est prévu pour « continuer à accéder à la caméra en arrière-plan », par ex. un appel vidéo que
  l'utilisateur a lancé et qui continue pendant qu'il fait autre chose : une tâche **lancée par l'utilisateur et
  perceptible**.
- **Accès caméra en arrière-plan** : Android interdit déjà de le démarrer depuis l'arrière-plan (« while-in-use ») ;
  Play considère avec méfiance toute capture que l'utilisateur ne voit pas au moment où elle a lieu (règles sur les
  logiciels de surveillance / « stalkerware » et « Utilisation abusive de l'appareil »).
- **`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`** : réservée à des cas listés (fonction principale cassée sans elle) ;
  la lecture du visage n'en fait pas partie.
- **Divulgation bien visible** (« Prominent disclosure ») : avant toute demande d'accès à des données personnelles
  sensibles, l'app doit expliquer dans l'app ce qu'elle lit, pourquoi, ce qui est partagé, et obtenir un **geste
  d'accord explicite** (pas un simple « Suivant » ni la fermeture de l'écran).
- **AI Act, art. 50 §3** (applicable depuis le 2 août 2026) : les personnes exposées à un système de reconnaissance
  des émotions doivent en être informées.

Options étudiées pour la variante play :

| Option | Conformité Play | Valeur produit | Décision |
|---|---|---|---|
| A. Identique à sideload (FGS caméra au déverrouillage) | ❌ risque fort de refus (capture non perçue, FGS non justifiable par une tâche lancée par l'utilisateur, exemption de batterie) | ★★★ | Non |
| B. **Lecture à l'ouverture de l'app** : quand l'utilisateur ouvre l'app (s'il l'a activée), quelques images avec un **indicateur visible** à l'écran, au premier plan, sans service | ✅ aucune FGS, capture visible, au premier plan | ★★ (une à plusieurs lectures par jour, de vrais moments d'usage) | **Oui** |
| C. **« Lecture rapide » déclenchée par l'utilisateur** : bouton de notification persistante facultative, tuile des réglages rapides ou widget, qui **ouvre une petite activité** au premier plan (aperçu, 2 s) | ✅ geste explicite, activité visible | ★★ (complète B) | **Oui, après B** |
| D. FGS caméra lancée par une notification (« Lire maintenant ») sans ouvrir d'activité | ⚠️ défendable mais même formulaire FGS + vidéo, gain faible face à C | ★ | Non |

**Décision (21/10)** : variante play = **B puis C**, **sans** `FaceSenseService` (FGS caméra), sans
`FOREGROUND_SERVICE_CAMERA`, sans `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, sans relance au démarrage ni guide
Shizuku. Les scores produits sont les mêmes (mêmes modèles HSEmotion, mêmes rafales `face_burst`, origine notée
`app_open` / `quick` pour que les analyses puissent les distinguer des lectures au déverrouillage). La sideload garde
tout (option A). Le **plus sûr** est B : aucune déclaration FGS à remplir, rien ne se passe sans que la personne ne
regarde l'écran.

## 1 bis. Décision du 24/10 : lecture au déverrouillage tentée aussi dans la version Play (POL-1, P28)

Le propriétaire a décidé le 24/10 vers 15:00, en connaissance du risque (option A jugée « risque fort de refus »
ci-dessus), de **tenter** la lecture au déverrouillage dans la version Play : c'est pour lui une des grandes valeurs
de l'app (bien plus de lectures par jour). L'option B (lecture à l'ouverture) reste en place et sert de secours.

**Règles relues le 24/10 (20:30)** — aide Play Console answer/13392821 et answer/16965181, Policy Center
« Device and Network Abuse » (answer/16559646), Android « Changes to foreground service types for Android 15 » :
- Pour chaque type de service de premier plan, la Play Console demande : description, **impact si le système
  diffère ou interrompt la tâche**, **lien vers une vidéo** du chemin de l'utilisateur, et un cas d'usage (liste ;
  pour `camera`, seulement « Background Camera Streaming », sinon saisie libre).
- Usage autorisé seulement s'il est **lancé par l'utilisateur ou perceptible** (une notification permanente claire
  et exacte le rend perceptible), **arrêtable par l'utilisateur**, non différable sans nuire, et limité au temps
  nécessaire.
- Android 15+ : **pas de service caméra démarré depuis `BOOT_COMPLETED`**. Android 11+ : la caméra n'est accessible
  depuis l'arrière-plan que si le service de type `camera` a été démarré **app à l'écran** (c'est déjà le cas en
  sideload).

**Comment POL-1 doit être construit pour être défendable** (cahier des charges du run de code) :
1. Interrupteur de build propre à play (`FACE_UNLOCK_PLAY`, désactivé par défaut) : s'il est coupé, le manifeste play
   continue de retirer `FaceSenseService` et `FOREGROUND_SERVICE(_CAMERA)` comme aujourd'hui (les versions suivantes
   partent même si Google refuse).
2. Activation **seulement** par un geste : Sources → Lecture du visage → interrupteur « Aussi à chaque déverrouillage »
   → feuille de divulgation (ce qui est lu : 3 images de la caméra frontale à chaque déverrouillage ; quand : seulement
   tant que la notification est là ; ce qui est gardé : quelques nombres, aucune image ; un système d'IA de
   reconnaissance des émotions, art. 50 AI Act ; une estimation, pas un diagnostic) → bouton « J’accepte, lire au
   déverrouillage » / « Pas maintenant ».
3. **Notification permanente** « Lecture du visage active » avec le bouton **« Arrêter »** ; l'indicateur caméra vert
   d'Android s'allume à chaque lecture.
4. Réglage pour couper à tout moment (même carte, et Paramètres). Service démarré **seulement app ouverte** ;
   **aucune relance au démarrage du téléphone** (la notification de reprise invite à ouvrir l'app) ; ni
   `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, ni guide Shizuku / ADB.
5. Sideload inchangée.

**État au 25/10 02:30 (POL-1a)** : interrupteur `-PfaceUnlockPlay=true` (défaut coupé) dans `build.gradle` ;
allumé, il choisit `src/playFaceUnlock/AndroidManifest.xml` (service caméra gardé, relance et exemption retirées) et
`BuildConfig.FACE_UNLOCK` ; `FACE_KEEPALIVE` reste faux en play. L'APK d'aperçu (`-PplayPreview=true`,
`fr.jpesquet.sante.apercu`) est l'artefact `halcya-apercu-deverrouillage` du workflow « Test — émulateur Samsung
Galaxy A56 ». Reste POL-1b (écran d'activation et divulgation) avant de filmer.

**État au 25/10 02:33 CET (POL-1b)** : côté app, la carte Lecture du visage de la variante play montre, seulement si
le natif annonce `unlockAvailable` (APK d'aperçu ou interrupteur allumé), une ligne « Aussi à chaque déverrouillage »
avec un interrupteur. L'allumer ouvre la divulgation `camera_unlock` (3 images à chaque déverrouillage, témoin vert,
IA de reconnaissance des émotions, nombres seulement, notification « Lecture du visage active » avec « Arrêter »,
aucune reprise après un redémarrage) ; « J’accepte, lire au déverrouillage » démarre le service app à l'écran
(`start({ unlock: true })`) puis demande l'autorisation des notifications (Android 13+). L'éteindre ne coupe que le
déverrouillage (`stopUnlock`) ; « Désactiver » coupe tout. Service arrêté par Android (redémarrage, mise à jour) →
« en pause » + bouton « Reprendre », jamais de reprise automatique. Ni Shizuku / ADB ni batterie en play. **L'APK
d'aperçu est prêt à filmer pour P28.** Reste au code : un raccourci « couper » dans Paramètres (le point 4 le
prévoit ; la carte et la notification suffisent pour la vidéo).

**État au 27/10 13:33 CET (P28-INTERNE)** : le brouillon `p28-100487` n'a pas fait apparaître la ligne (constat du
propriétaire, 27/10 13:30 : Contenu de l'app sans ligne ; la vérification du brouillon n'affiche que 2 avertissements,
désobscurcissement et symboles natifs). « Play — AAB » envoie désormais **chaque version de test interne** avec
l'interrupteur allumé (`FACE_UNLOCK_INTERNAL: "true"`, statut completed, versionCode normal, seul le propriétaire
testeur, vérifié avant l'envoi) ; l'alpha reste coupée. Si Google refuse l'envoi : erreur exacte dans le résumé du
workflow → passer `FACE_UNLOCK_INTERNAL` à `"false"`.
**27/10 vers 14:20 : refusé.** AAB 518 importé, validation de l'edit refusée : `HTTP 403 — You must let us know whether
your app uses any Foreground Service permissions.` Interrupteur recoupé. La déclaration est un préalable à toute
version active avec le service caméra ; chemin proposé au propriétaire : test interne → brouillon `p28-100487` →
« Modifier la version » → « Suivant » (lien vers la déclaration), sans déployer. Rallumer après son envoi.

### P28 — texte exact à coller dans la Play Console

Où : Play Console → Halcya → **Surveiller et améliorer → Règles et programmes → Contenu de l'app** → « Autorisations
des services de premier plan » (si la ligne n'existe pas encore, voir « Ordre des gestes » ci-dessous) → cocher
**Caméra** → remplir. Le texte est en anglais (lu par l'équipe d'examen) ; la version française sert de référence.

- **Cas d'usage** : « Autre » (saisie libre) → `User-enabled wellbeing check-in at phone unlock`
- **Description de la fonction** (anglais, à coller) :
  > Optional feature that the user turns on explicitly in the app (Sources > Face reading > "Also at each unlock"),
  > after an in-app disclosure. While it is on, a persistent notification "Face reading active" with a "Stop" button
  > is shown. Each time the user unlocks the phone, the service takes 3 frames from the front camera, runs two
  > on-device emotion-estimation models, keeps only a few numbers (wellbeing score, valence, arousal) and discards the
  > images immediately. Nothing leaves the device. The service is started only while the app is in the foreground and
  > is never restarted at boot.

  (FR : fonction facultative, activée par un geste explicite après une divulgation ; tant qu'elle est active, une
  notification permanente « Lecture du visage active » avec « Arrêter » est affichée ; à chaque déverrouillage,
  3 images de la caméra frontale, deux modèles embarqués d'estimation du bien-être, seuls quelques nombres gardés,
  images effacées aussitôt ; rien ne quitte le téléphone ; service démarré app ouverte seulement, jamais au
  démarrage.)
- **Impact si la tâche est différée ou interrompue** (anglais, à coller) :
  > The reading must happen within a second of the unlock, while the user is looking at the screen. If it is
  > deferred, the user is no longer in front of the camera and the reading is lost. If the service is interrupted,
  > no reading is taken until the user opens the app again; the user then gets fewer wellbeing estimates, which are
  > the core data of the app.

  (FR : la lecture doit avoir lieu dans la seconde qui suit le déverrouillage, pendant que la personne regarde
  l'écran ; différée, elle est perdue ; interrompue, plus aucune lecture jusqu'à la prochaine ouverture de l'app.)
- **Lien vidéo** : la vidéo filmée par la CI (workflow « Play — vidéo P28 », 26/10 ; décision du propriétaire du 26/10 15:00), publiée à https://spreadzenox.github.io/HealthTrack/p28/ dès que le film est vert (le script ci-dessous reste la référence des plans).

### Script de la vidéo (Galaxy A56, 60 à 90 s, sans son)

Enregistreur d'écran du Samsung (volet rapide → « Enregistreur d'écran », son : aucun). Données de démonstration ou
votre vraie app, peu importe ; **ne montrez aucune notification personnelle** (mode Ne pas déranger). Si
l'enregistreur s'arrête quand l'écran se verrouille, filmez les étapes 6 et 7 avec un autre téléphone.
1. Écran d'accueil → ouvrir **Halcya** (2 s sur l'Accueil).
2. Onglet **Sources** → carte **Lecture du visage** → interrupteur **« Aussi à chaque déverrouillage »**.
3. La **feuille d'explication** s'ouvre : la faire défiler lentement jusqu'en bas (3 à 4 s), toucher
   **« J’accepte, lire au déverrouillage »**.
4. Si Android le demande : autoriser la **caméra** (« Pendant l'utilisation de l'app ») et les **notifications**.
5. Tirer le volet des notifications : montrer **« Lecture du visage active »** et son bouton **« Arrêter »** (2 s).
6. Verrouiller le téléphone (bouton latéral), attendre 2 s, **déverrouiller** en regardant l'écran : le **point vert
   de la caméra** s'allume en haut à droite (1 s).
7. Rouvrir Halcya → Accueil : la carte « Bien-être estimé » montre la **nouvelle lecture** (« il y a 1 min »).
8. Tirer le volet → toucher **« Arrêter »** : la notification disparaît ; revenir dans Sources : l'interrupteur est
   **coupé**.
Puis YouTube (app ou studio.youtube.com) → Créer → Importer → titre « Halcya – face reading at unlock (Play review) »
→ visibilité **Non répertoriée** → copier le lien.

### Ordre des gestes (propriétaire puis runs)

1. Un run de code livre POL-1 avec l'interrupteur play **coupé** (rien ne change pour Google), et la CI produit en
   plus un APK d'aperçu play avec l'interrupteur **allumé** (identifiant `fr.jpesquet.sante.apercu`, pour cohabiter
   avec l'app du Play Store sans rien désinstaller) : c'est lui que vous filmez.
2. Vous filmez la vidéo et la mettez en ligne (non répertoriée).
3. Un run allume l'interrupteur play : la CI envoie l'AAB en test interne. ❓ Il est possible que la Play Console
   refuse l'envoi (« déclaration des services de premier plan requise ») ou que la ligne n'apparaisse dans « Contenu de
   l'app » qu'après cet envoi : le run note l'erreur exacte et vous demande de remplir la déclaration (texte ci-dessus)
   puis de l'envoyer pour examen ; le run suivant renvoie la version.
3 bis. **26/10 vers 20:40 : la ligne n'apparaissait pas** dans Contenu de l'app (10 déclarations traitées, rien en
   attente) : Google ne la demande qu'après avoir vu un AAB qui déclare le service caméra. **Décision du propriétaire :
   la faire apparaître sans rien publier à personne.** Livré le 26/10 21:33 : workflow « Play — brouillon P28 »
   (`.github/workflows/play-p28-draft.yml`, lancé à la main sur main) qui construit l'AAB play signé avec
   l'interrupteur **allumé** (`-PfaceUnlockPlay=true`, manifeste vérifié par `check-play-manifest.sh
   --face-unlock-play`), sous un **versionCode à part** (100000 + nombre de commits), et l'envoie en **brouillon**
   (status `draft`, nom `p28-<versionCode>`) sur la piste de test interne : jamais déployé, la version en test interne
   reste en place, et les envois suivants de « Play — AAB » (interrupteur coupé) **gardent ce brouillon** à côté (si
   Play refuse l'ensemble, la version normale passe seule et le résumé le dit). Si le brouillon ne suffit pas à faire
   apparaître la ligne : une version en test interne (propriétaire seul) est acceptable (décision du 26/10). Ne
   jamais déployer le brouillon (le téléphone resterait sur le versionCode 100xxx).
4. Si Google refuse : le run coupe l'interrupteur (les versions suivantes repartent sans la fonction), note le motif
   exact et vous présente vos options (recours avec la vidéo, ou rester sur la lecture à l'ouverture de l'app).

## 2. Revue des permissions du manifeste (main + flavors)

| Permission | Usage | Sideload | Play | Commentaire |
|---|---|---|---|---|
| `INTERNET` | Gemini, Open-Meteo, Withings, mises à jour | ✅ | ✅ | Normale. |
| `READ_EXTERNAL_STORAGE` | Ancien import de fichiers | ✅ (≤ Android 12) | ✅ (≤ Android 12) | **Fait (21/10 10:30)** : `maxSdkVersion="32"` dans le manifeste principal (sans effet depuis Android 13). |
| `REQUEST_INSTALL_PACKAGES` | Mise à jour en un clic | ✅ (manifeste `sideload`) | ❌ | Fait en 3a, vérifié par `scripts/check-play-manifest.sh`. |
| `REQUEST_DELETE_PACKAGES` | Ouvrir la désinstallation de l'app qui tient la montre Huawei | ✅ | ⚠️ à garder seulement si le parcours montre reste en play | Pas une permission restreinte, mais à justifier ; l'utilisateur confirme toujours. |
| `REQUEST_OBSERVE_COMPANION_DEVICE_PRESENCE`, `RECEIVE_BOOT_COMPLETED`, `POST_NOTIFICATIONS` | Montre, rappels | ✅ | ✅ | `POST_NOTIFICATIONS` est demandée au moment d'activer un rappel. |
| `CAMERA` | Lecture du visage | ✅ | ✅ (option B / C) | **Divulgation** `camera` avant la demande (fait). |
| `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_CAMERA` | Lecture au déverrouillage | ✅ | ❌ **retirées (21/10 10:30)** | `src/play/AndroidManifest.xml` (`tools:node="remove"`), avec `FaceSenseService`, `FaceResumeJob`, `FaceResumeReceiver`. Aucun autre service de premier plan dans l'app. |
| `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | Lecture au déverrouillage | ✅ | ❌ **retirée (21/10 10:30)** | Idem ; le plugin refuse aussi `requestBatteryExemption` en play. |
| `PACKAGE_USAGE_STATS` | Temps d'écran, sommeil estimé, temps par app | ✅ | ✅ | Accès spécial accordé dans Android ; **divulgation** `usage` avant d'ouvrir le réglage (fait). À décrire dans Data safety (« Activité dans les applis »). |
| `ACCESS_COARSE_LOCATION` (+ `FINE` ≤ Android 11 pour le BLE) | Météo (position arrondie ≈ 10 km) ; scan BLE ancien Android | ✅ | ✅ | **Divulgation** `location` (fait). Data safety : « Position approximative », partagée avec Open-Meteo. |
| `BLUETOOTH_SCAN` (`neverForLocation`) | Montre, capteurs BLE | ✅ | ✅ | Pas de localisation déduite. |
| Health Connect (`health.READ_*`) | Imports des montres | ✅ (41 déclarées par le plugin) | ✅ **15 lectures seulement (21/10 10:30, I131)** | Play retire les 20 `WRITE_*` et 6 lectures jamais demandées (température basale, métabolisme de base, étages, taille, pleine conscience, calories totales). Liste = `READ_TYPES` du connecteur, vérifiée par `distribution.android.test.js` et `check-play-manifest.sh`. Déclaration des types de données dans la Play Console + écran de justification (fourni par `@capgo/capacitor-health` : `SHOW_PERMISSIONS_RATIONALE` / `VIEW_PERMISSION_USAGE`), à relier à la politique de confidentialité (jalon 8 / 10). |
| `<queries>` (apps santé, lanceur, reconnaissance vocale) | « Mes appareils », temps par app | ✅ | ⚠️ | La requête `MAIN/LAUNCHER` donne la liste des apps installées : acceptable car liée au temps par app, à justifier si Play la signale (pas de `QUERY_ALL_PACKAGES`). |

### Justification par type Health Connect (brouillon pour le formulaire Play, P16)

Chaque type est **lu** (jamais écrit), sur le téléphone, pour l'afficher et le comparer à votre bien-être et à votre
ventre (« ce qui va avec vos bons et mauvais jours ») ; rien n'est envoyé à un serveur.

| Type | Pourquoi |
|---|---|
| Pas, distance, calories actives, séances d'exercice | Activité du jour, facteur comparé au bien-être et aux symptômes digestifs. |
| Sommeil | Durée et régularité des nuits, facteur principal du bien-être. |
| Fréquence cardiaque, FC au repos, VFC | Récupération et stress physiologique ; « Radar forme » (écart à votre norme personnelle). |
| Saturation en oxygène, fréquence respiratoire, température corporelle | Nuits et récupération ; signaux d'un début de maladie (Radar forme). |
| Tension artérielle, glycémie | Affichées si votre appareil les mesure, et comparées aux repas (glycémie après repas). |
| Poids, masse grasse | Suivi de la composition corporelle, profil nutritionnel. |

À revoir au jalon 8 (imports 100 % Health Connect) : si un type n'est plus affiché, le retirer aussi de `READ_TYPES`.

## 3. Divulgations dans l'app (fait le 21/10 06:30)

- Textes : `app/src/config/permissionDisclosures.js` (`camera`, `location`, `usage`) ; feuille
  `PermissionDisclosure` + crochet `useDisclosure()`. Bouton d'accord explicite « J'accepte, … » ; « Pas
  maintenant » ne demande rien à Android et n'active rien.
- Variante play : texte propre `camera_app_open` (« quand vous ouvrez HealthTrack… un bandeau l'indique…
  rien ne se passe quand l'app est fermée »), ajouté le 21/10 10:30.
- Branchées sur : Lecture du visage (« Activer » / « Autoriser »), Météo (« Utiliser ma position approximative »),
  Temps d'écran (« Activer » quand l'accès n'est pas encore accordé).
- Test-garde `permissionDisclosures.test.js` : tout écran qui lit la position, démarre la caméra ou ouvre l'accès
  aux données d'utilisation passe par `askConsent`.
- À ajouter quand le chantier les touche : **photo du repas → IA** (dire ce qui est envoyé à Gemini / au relais,
  avant le premier envoi), **Health Connect** (avant la boîte de Google, avec la permission d'historique, jalon 8),
  **Bluetooth** (montre, avant « Appareils à proximité »).

## 4. Suite (dans `BACKLOG.md`)

1. ✅ **3b-2 (21/10 10:30)** : manifeste `play` qui retire `FaceSenseService`, `FaceResumeJob`,
   `FaceResumeReceiver`, `FOREGROUND_SERVICE(_CAMERA)`, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` et 26 permissions
   Health Connect inutilisées ; `BuildConfig.FACE_UNLOCK` / `FEATURES.faceUnlock|faceAppOpen` ; **option B en
   place** : `FaceOneShot` (natif, app à l'écran, déclencheur `app_open`, 1 lecture / 30 min, 12 / jour, jamais
   pendant un appel) + bandeau `FaceReadIndicator` pendant toute la capture ; carte et diagnostic adaptés ;
   `check-play-manifest.sh` étendu. Les lectures `app_open` comptent pour le bien-être (HealthTrack est exclu des
   facteurs « temps par app », donc pas un X ; test D5 mis à jour).
2. **3b-3** : option C (tuile / notification → activité « Lecture rapide »).
3. Brouillons Data safety + déclaration des apps de santé (`journal/legal/`, jalon 10).

Sources à revérifier : Play Console Help « Foreground service types / declare » ; Developer Policy Center
« User Data — Prominent Disclosure and Consent », « Permissions and APIs that Access Sensitive Information »,
« Health apps » ; Android docs « Foreground service types » (camera) et « Restrictions on starting a foreground
service from the background » ; Règlement (UE) 2024/1689 art. 50.

## 5. Sécurité des données (formulaire Play, préparé le 22/10 06:30)

Source : `app/store/data-safety/answers.mjs` (une justification par réponse) → `data-safety.csv` (modèle exporté de la
Play Console, format « Question ID, Response ID, Response value, Answer requirement, label ») → envoyé par le workflow
« Play — sécurité des données » (`applications.dataSafety`), **lancé à la main par le propriétaire après relecture** (P21). Repli si Play refuse : Contenu de l'app → Sécurité des
données → Importer depuis un fichier CSV. Réponses, dans l'ordre de la Play Console :

1. **Collecte et sécurité** — L'app collecte-t-elle ou partage-t-elle des données ? **Oui**. Chiffrées en transit ?
   **Oui** (HTTPS). Création de compte : **« Mon app ne permet pas de créer de compte »**. Connexion avec un compte créé
   hors de l'app : **Non**. Les utilisateurs peuvent-ils demander la suppression de leurs données ? **Oui** — URL :
   `https://spreadzenox.github.io/HealthTrack/confidentialite/#vos-droits`.
2. **Types de données** — cocher seulement : **Position → Position approximative** ; **Photos et vidéos → Photos** ;
   **Activité dans les applis → Autres contenus générés par l'utilisateur** ; et depuis le 22/10 18:30 (6a-2)
   **Identifiants → Identifiants de l'appareil ou autres** (identifiant aléatoire d'installation envoyé au relais avec
   chaque analyse IA, pour compter les analyses du jour).
3. **Pour chacun** : **Collectée** (pas partagée : Open-Meteo, notre relais et Vertex AI traitent pour le compte de
   l'app) ; traitée de façon éphémère : **Non** (prudence) ; **Facultative** (l'utilisateur choisit) ; raison :
   **Fonctionnement de l'application** (+ **Prévention des fraudes, sécurité et conformité** pour l'identifiant).

Pourquoi rien d'autre : Google appelle « collecte » ce qui quitte le téléphone. Health Connect, la montre, le ventre,
le sommeil, le temps d'écran et la lecture du visage restent sur le téléphone (rien envoyé, aucune image gardée) ;
l'IA ne reçoit que la photo réduite sans métadonnées ou la description du repas. Aucun outil de plantage ou d'audience,
aucun identifiant, aucune publicité. **À revoir dès que** le relais Vertex AI (jalon 6), Play Billing ou Play Integrity
arrivent (achats, identifiants d'appareil), et à faire relire par un juriste (P5). Point discutable noté : avec la
clé Gemini saisie par l'utilisateur (sideload seulement à terme), Google traite selon ses propres conditions ; on
déclare quand même, par prudence.

**Sauvegarde Android (décision du propriétaire du 24/10 : conservée ; analysée le 24/10 16:30)** — Rien à ajouter au
formulaire, donc **pas de nouvelle relance de P21**. Raisons : ① la sauvegarde est faite par le système Android
(service de sauvegarde Google), pas par l'app : l'éditeur ne reçoit rien et n'a aucun serveur qui la garde ; ② depuis
Android 9, la sauvegarde dans le cloud est chiffrée côté client avec le code de verrouillage du téléphone : ni Google
ni l'éditeur ne peuvent la lire, ce qui correspond à l'exception « chiffrement de bout en bout » de la page d'aide
Sécurité des données (support.google.com/googleplay/android-developer/answer/10787469 : une donnée illisible par
tout intermédiaire, développeur compris, n'est pas une « collecte »). La page d'aide ne cite pas nommément la
sauvegarde Android (recherche du 24/10) : point à faire confirmer par le juriste (P5) ; si Google le demandait, on
déclarerait les types concernés en « chiffrés, facultatifs (l'utilisateur active ou non la sauvegarde) ». Côté textes :
politique de confidentialité (§ « Sauvegarde Android » + résumé), conditions §6, Paramètres → Données et onboarding
(« 0 Mo envoyé à Halcya sans votre accord ») disent désormais que les données sont incluses dans la sauvegarde Google
du téléphone si elle est activée. Règles explicites : `res/xml/data_extraction_rules.xml` (Android 12+, cloud et
transfert entre téléphones) et `backup_rules.xml` (Android 11 et avant) excluent les préférences natives propres au
téléphone (coffre de la clé de la montre, association compagnon, adresse de la montre, téléchargement de mise à
jour) ; les secrets du localStorage (clé Gemini, clés de la montre, jetons Withings, jeton d'achat) sont retirés au
premier lancement après une restauration (`restoreGuard.js` + repère hors sauvegarde `BackupMarkerPlugin.java`).

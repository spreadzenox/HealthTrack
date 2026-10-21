# Conformité Google Play — variante « play » (jalon 3b)

> Créé au run du 21/10/2026 06:30 (Paris). Étude de la lecture du visage face aux règles Play, revue des permissions
> du manifeste, divulgations avant les autorisations sensibles. Les règles Play bougent : **à revérifier à chaque
> run « idées »** (sources ci-dessous) et avant l'envoi en test fermé. Ce n'est pas un avis juridique.

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

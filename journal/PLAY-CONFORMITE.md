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
| `READ_EXTERNAL_STORAGE` | Ancien import de fichiers | ✅ | ⚠️ à retirer ou `maxSdkVersion="32"` | Sans effet depuis Android 13 ; Play la signale. |
| `REQUEST_INSTALL_PACKAGES` | Mise à jour en un clic | ✅ (manifeste `sideload`) | ❌ | Fait en 3a, vérifié par `scripts/check-play-manifest.sh`. |
| `REQUEST_DELETE_PACKAGES` | Ouvrir la désinstallation de l'app qui tient la montre Huawei | ✅ | ⚠️ à garder seulement si le parcours montre reste en play | Pas une permission restreinte, mais à justifier ; l'utilisateur confirme toujours. |
| `REQUEST_OBSERVE_COMPANION_DEVICE_PRESENCE`, `RECEIVE_BOOT_COMPLETED`, `POST_NOTIFICATIONS` | Montre, rappels | ✅ | ✅ | `POST_NOTIFICATIONS` est demandée au moment d'activer un rappel. |
| `CAMERA` | Lecture du visage | ✅ | ✅ (option B / C) | **Divulgation** `camera` avant la demande (fait). |
| `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_CAMERA` | Lecture au déverrouillage | ✅ | ❌ à retirer (option A refusée) | Prochaine étape (3b-2). |
| `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | Lecture au déverrouillage | ✅ | ❌ à retirer | Idem. |
| `PACKAGE_USAGE_STATS` | Temps d'écran, sommeil estimé, temps par app | ✅ | ✅ | Accès spécial accordé dans Android ; **divulgation** `usage` avant d'ouvrir le réglage (fait). À décrire dans Data safety (« Activité dans les applis »). |
| `ACCESS_COARSE_LOCATION` (+ `FINE` ≤ Android 11 pour le BLE) | Météo (position arrondie ≈ 10 km) ; scan BLE ancien Android | ✅ | ✅ | **Divulgation** `location` (fait). Data safety : « Position approximative », partagée avec Open-Meteo. |
| `BLUETOOTH_SCAN` (`neverForLocation`) | Montre, capteurs BLE | ✅ | ✅ | Pas de localisation déduite. |
| Health Connect (`health.READ_*`) | Imports des montres | ✅ | ✅ | Déclaration des types de données dans la Play Console + écran de justification (fourni par `@capgo/capacitor-health` : `SHOW_PERMISSIONS_RATIONALE` / `VIEW_PERMISSION_USAGE`), à relier à la politique de confidentialité (jalon 8 / 10). |
| `<queries>` (apps santé, lanceur, reconnaissance vocale) | « Mes appareils », temps par app | ✅ | ⚠️ | La requête `MAIN/LAUNCHER` donne la liste des apps installées : acceptable car liée au temps par app, à justifier si Play la signale (pas de `QUERY_ALL_PACKAGES`). |

## 3. Divulgations dans l'app (fait le 21/10 06:30)

- Textes : `app/src/config/permissionDisclosures.js` (`camera`, `location`, `usage`) ; feuille
  `PermissionDisclosure` + crochet `useDisclosure()`. Bouton d'accord explicite « J'accepte, … » ; « Pas
  maintenant » ne demande rien à Android et n'active rien.
- Branchées sur : Lecture du visage (« Activer » / « Autoriser »), Météo (« Utiliser ma position approximative »),
  Temps d'écran (« Activer » quand l'accès n'est pas encore accordé).
- Test-garde `permissionDisclosures.test.js` : tout écran qui lit la position, démarre la caméra ou ouvre l'accès
  aux données d'utilisation passe par `askConsent`.
- À ajouter quand le chantier les touche : **photo du repas → IA** (dire ce qui est envoyé à Gemini / au relais,
  avant le premier envoi), **Health Connect** (avant la boîte de Google, avec la permission d'historique, jalon 8),
  **Bluetooth** (montre, avant « Appareils à proximité »).

## 4. Suite (dans `BACKLOG.md`)

1. **3b-2** : manifeste `play` qui retire (`tools:node="remove"`) `FaceSenseService`, `FaceResumeJob`,
   `FaceResumeReceiver`, `FOREGROUND_SERVICE_CAMERA`, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` ; drapeau
   `FEATURES.faceUnlock` (sideload) ; carte « Lecture du visage » en play = option B (lecture à l'ouverture) ;
   `check-play-manifest.sh` étendu.
2. **3b-3** : option C (tuile / notification → activité « Lecture rapide »).
3. Brouillons Data safety + déclaration des apps de santé (`journal/legal/`, jalon 10).

Sources à revérifier : Play Console Help « Foreground service types / declare » ; Developer Policy Center
« User Data — Prominent Disclosure and Consent », « Permissions and APIs that Access Sensitive Information »,
« Health apps » ; Android docs « Foreground service types » (camera) et « Restrictions on starting a foreground
service from the background » ; Règlement (UE) 2024/1689 art. 50.

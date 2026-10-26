# Matrice de parité Android (variante play) → iOS

> **La vérité sur l'avancement d'iOS.** Tenue à jour à chaque run de la routine iOS. Référence : la variante
> **play** (Google Play). Graine écrite à la mise en place (26/10/2026) à partir des plugins natifs et de
> `app/src/config/distribution.js` : **l'étape I2 la complète fonction par fonction** (changelog, `journal/PRODUIT.md`,
> écrans) et vérifie chaque hypothèse ci-dessous (marquées « à vérifier »).

Légende : ✅ fait et vérifié sur iOS (preuve : capture, test ou workflow) · 🟡 partiel ou pas encore vérifié ·
❌ manquant · ⛔ impossible sur iOS (raison + source datée + alternative) · — sans objet sur iOS.

**Parité** : _à calculer en I2_ = ✅ / (toutes les lignes sauf ⛔ et —).
**Dernière version Android suivie** : v486 (commit `34cb644`, 26/10/2026).

## 1. Socle

| Fonction (play) | Android | iOS | État | Notes |
|---|---|---|---|---|
| Projet natif | `app/android` (Capacitor 8) | `app/ios` (Capacitor iOS, même majeure que `@capacitor/core`) | ❌ | I1 |
| Build CI | `Play — AAB` (signé, `main`) | `ios-*.yml` sur macOS (simulateur, puis signé) | ❌ | I1 puis I9 |
| Numéro de version | `git rev-list --count HEAD` | même nombre (`CFBundleShortVersionString` = `CFBundleVersion`) | ❌ | clone complet nécessaire (`fetch-depth: 0`) |
| Nom « Halcya », icône « H nuit », écran de démarrage | ✅ | AppIcon 1024, écran de démarrage | ❌ | `config/brand.js`, `journal/DESIGN.md` |
| Variante de distribution | `play` | `appstore` dans `distribution.js` | ❌ | comme play : relais IA, pas d'auto-mise à jour |
| Zones sûres, barres système | `SystemBarsPlugin`, `--safe-top/--safe-bottom` | encoche / Dynamic Island / indicateur d'accueil | ❌ | à vérifier en captures |
| Mise à jour de l'app | Play Store | App Store | — | pas de bandeau de mise à jour |

## 2. Écrans (code web partagé : arrivent avec le socle, à vérifier en captures)

| Écran | État | Notes |
|---|---|---|
| Onboarding (objectif, sources, autorisations, paywall passable) | 🟡 | autorisations iOS : HealthKit, caméra, notifications, Bluetooth |
| Accueil « Aujourd'hui » (bien-être estimé, tuiles, ventre, boutons, pistes) | 🟡 | |
| Journal (derniers jours, repas, galerie, tendances) | 🟡 | |
| Photo du repas + analyse IA (relais) | 🟡 | caméra / photothèque dans WKWebView, divulgation |
| Nutrition (Ciqual) | 🟡 | |
| Analyses (pistes repas → ventre, délais) | 🟡 | |
| Réintroduction FODMAP guidée | 🟡 | rappel de portion : voir §3 |
| Rapport PDF médecin | 🟡 | partage / enregistrement du fichier sur iOS |
| Sources (détection automatique) | 🟡 | sources iOS différentes : Santé (HealthKit) au lieu de Health Connect |
| Données (export / import JSON et CSV) | 🟡 | partage de fichier iOS (`@capacitor/filesystem` + feuille de partage) |
| Paramètres, mode diagnostic caché (7 touches) | 🟡 | |
| Premium / paywall | ❌ | prix lus dans StoreKit, jamais codés en dur |
| Nouveautés | 🟡 | `variants: ["appstore"]`, historique iOS depuis le lancement iOS |
| Confidentialité, conditions | 🟡 | textes à rendre exacts pour iOS (iCloud au lieu de la sauvegarde Android, HealthKit) |

## 3. Natif : plugins et services

| Fonction (play) | Android | iOS (piste) | État | Notes |
|---|---|---|---|---|
| Santé : imports et historique | Health Connect (`@capgo/capacitor-health`, patch Android) | HealthKit (le même plugin annonce le support iOS — à vérifier type par type) | ❌ | I4 ; capacité HealthKit, textes `NSHealthShareUsageDescription` |
| Abonnement | `PlayBillingPlugin` (play) | StoreKit 2 (plugin Swift) | ❌ | I6 ; mêmes formules, essai 14 j |
| Vérification des achats par le relais | Play Developer API, RTDN | JWS signés par Apple vérifiés par le relais, App Store Server Notifications V2 | ❌ | I6 ; additif côté relais |
| Anti-abus des crédits IA | `PlayIntegrityPlugin` | App Attest (DeviceCheck) | ❌ | I6 |
| Rappel de fin d'essai | `TrialReminderPlugin` | notification locale | ❌ | I5/I6 |
| Bilan du ventre du soir (notification à actions) | `GutEveningPlugin` | `UNNotificationCategory` + actions, réponse rangée à l'ouverture | ❌ | I5 |
| Note du soir | `EveningNotePlugin` | idem | ❌ | I5 |
| Rappel de la portion du jour | `PortionReminderPlugin` | idem | ❌ | I5 |
| Bien-être par le visage, à l'ouverture de l'app | `FaceSensePlugin`, ONNX / LiteRT | Vision + ONNX Runtime iOS ou Core ML ; mêmes scores sur `journal/protocoles/visage-*.py` | ❌ | I7 |
| Bien-être par le visage, au déverrouillage | `FaceSenseService` (service caméra de premier plan) | — | ⛔ à confirmer | iOS n'autorise pas la caméra en arrière-plan ; alternative : ouverture de l'app, widget, raccourci |
| Voix | `VoiceProbePlugin` | AVAudioEngine, traitement local | ❌ | I8 |
| Temps d'écran / usage du téléphone | `PhoneUsagePlugin` (UsageStats) | API Temps d'écran (DeviceActivity) | ⛔ à confirmer | données non lisibles par l'app d'après ce qu'on sait ; I8 |
| Montre Huawei en direct | `BtClassicPlugin`, `RfcommTransport`, `huawei/*` (RFCOMM) | CoreBluetooth (BLE seulement) | ⛔/🔬 à étudier | pas de RFCOMM sans MFi ; piste BLE ; Huawei Santé iOS écrit une partie dans Santé → HealthKit |
| Synchro montre en arrière-plan | `WatchSyncJob`, `BackgroundWatchSync`, `WatchPresenceService` | BGTaskScheduler | dépend de la ligne précédente | |
| Coffre de la montre (clés) | `WatchVaultPlugin` | Trousseau « ThisDeviceOnly » | dépend | |
| Captures de trames montre (diagnostic) | `WatchCapturePlugin` | — | dépend | |
| Applications installées / compagnons | `AppManagerPlugin`, `CompanionPlugin`, `devices/phoneApps.js` | `canOpenURL` sur schémas déclarés | 🔬 | iOS ne liste pas les apps installées |
| Sauvegarde du téléphone (décision du 24/10 : conservée) | sauvegarde Android + règles d'exclusion, `BackupMarkerPlugin`, `restoreGuard.js` | sauvegarde iCloud du conteneur ; secrets exclus (Trousseau ThisDeviceOnly) | ❌ | I3 |
| Persistance des données locales | IndexedDB (WebView Android) | IndexedDB (WKWebView) | 🔬 | I3 : risque d'effacement à étudier |
| Ouvrir une autre app | `@capacitor/app-launcher` | idem (iOS supporté) | 🟡 | |
| Fichiers (export) | `@capacitor/filesystem` | idem (iOS supporté) | 🟡 | |
| BLE générique | `@capacitor-community/bluetooth-le` | idem (iOS supporté) | 🟡 | `NSBluetoothAlwaysUsageDescription` |
| Mise à jour par APK | `AppUpdatePlugin`, `@m430/capacitor-app-install` | — | — | sideload seulement |

## 4. Store et conformité

| Fonction (play) | Android | iOS | État | Notes |
|---|---|---|---|---|
| Piste de test interne automatique | test interne Play à chaque version | TestFlight interne à chaque version | ❌ | après A1–A3 |
| Test fermé | piste Alpha + groupe | TestFlight externe (examen bêta d'Apple) | ❌ | A6 |
| Fiche du Store fr-FR (titre, textes, captures, icône) | `app/store/`, `Play — fiche du Store` | `app/store-ios/` | ❌ | sous-titre 30 caractères, captures 6,9" |
| Sécurité des données | `app/store/data-safety` | « Confidentialité de l'app » (A5) + `PrivacyInfo.xcprivacy` | ❌ | |
| Déclarations santé, âge 18+ | Contenu de l'app | classification par âge, directives santé d'Apple | ❌ | |
| Chiffrement à l'export | — | `ITSAppUsesNonExemptEncryption` | ❌ | |
| Production | « Promouvoir la version » (propriétaire) | « Soumettre pour examen » puis publier (propriétaire) | — | A6 |

## 5. Suivi des livraisons Android

Une ligne par livraison Android reportée ici (date, PR `[Auto]`, ce que ça change pour iOS, état).

| Date | PR Android | Ce que ça demande côté iOS | État |
|---|---|---|---|
| 26/10 | jusqu'à #401 (v486) | point de départ : tout ce qui précède est couvert par les tableaux ci-dessus | — |

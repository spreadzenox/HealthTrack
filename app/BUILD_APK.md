# Générer l’APK Android (HealthTrack)

L’app web est packagée en application Android avec **Capacitor**. Pour produire un fichier APK installable :

## Prérequis

- **Node.js** 20.19+ ou 22+ (pour `npm run build`)
- **Android Studio** (recommandé) ou Android SDK + Gradle en ligne de commande
- **Java JDK 21** (ou celui requis par votre version d’Android Studio)

## Étapes

### 1. Build de l’app web

Depuis la racine de `app/` :

```bash
cd app
npm install
npm run build
```

**Important :** pour que « Analyser les ingrédients » fonctionne dans l’APK, l’utilisateur doit avoir enregistré une **clé API Gemini** dans l’app (**Paramètres**). L’analyse appelle directement l’API Google depuis l’appareil ; aucun serveur HealthTrack n’est nécessaire.

### 2. Synchroniser avec le projet Android

```bash
npx cap sync
```

Cela copie le contenu de `dist/` dans le projet Android.

### 3. Générer l’APK

**Option A – Android Studio (recommandé)**

```bash
npx cap open android
```

Dans Android Studio :

1. Attendre la fin de la synchronisation Gradle.
2. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
3. L’APK sera dans :  
   `app/android/app/build/outputs/apk/debug/app-debug.apk`  
   (ou **release** si vous avez configuré une signature).

**Option B – Ligne de commande (Gradle)**

```bash
cd android
./gradlew assembleDebug
```

Sur Windows :

```bash
cd android
gradlew.bat assembleDebug
```

APK généré : `android/app/build/outputs/apk/debug/app-debug.apk`.

### 4. Installer sur un appareil

- Transférez `app-debug.apk` sur le téléphone et ouvrez-le (autorisez l’installation depuis des sources inconnues si demandé), ou
- Branchez le téléphone en USB, puis dans Android Studio : **Run** (▶).

## Résumé des commandes

```bash
cd app
npm run build
npx cap sync
npx cap open android
# Puis dans Android Studio : Build > Build APK(s)
```

## Build et release automatiques (CI)

À chaque **push sur `main`**, le workflow GitHub Actions **Build & Release** (`.github/workflows/build-release.yml`) :

1. Build l’app avec une version = numéro de run (`VITE_APP_VERSION`)
2. Synchronise Capacitor et build l’APK (debug)
3. Crée une **GitHub Release** avec le tag `v<run_number>` (ex. `v42`) et attache l’APK en pièce jointe

Les utilisateurs qui ont une **version antérieure** voient une **bannière de mise à jour** en haut de l’app (vérification toutes les 30 min via l’API GitHub `releases/latest`). Un clic ouvre la page de la release ou télécharge directement l’APK.

- **Version affichée / comparée** : celle injectée au build (`VITE_APP_VERSION` en CI, sinon `package.json` → `version`).
- Pour déclencher manuellement : **Actions** → **Build & Release** → **Run workflow**.

## Test sur émulateur Samsung Galaxy A56

Le workflow **`.github/workflows/emulator-samsung-a56.yml`** lance HealthTrack dans un émulateur Android reproduisant fidèlement le Galaxy A56 et **exécute les tests instrumentés Health Connect** à chaque push et PR.

| Paramètre | Valeur |
|---|---|
| Android | API 35 (Android 15) |
| Résolution | 1080 × 2340 px |
| Densité | ~385 ppi (xxhdpi) |
| Taille écran | 6.7" |
| RAM | 8 Go |
| Architecture | x86_64 (accéléré KVM) |

### Déclenchement

Ce workflow se déclenche **automatiquement** à chaque :
- push sur `main` ou une branche `cursor/**`
- pull request vers `main`

Il peut aussi être déclenché **manuellement** depuis **Actions → Test — émulateur Samsung Galaxy A56 → Run workflow**.

### Ce que fait le workflow

1. Build de l'app web + synchronisation Capacitor
2. Construction de l'APK debug **et** de l'APK de tests instrumentés (`assembleDebugAndroidTest`)
3. Création d'un AVD `samsung_a56` avec les specs ci-dessus
4. Démarrage de l'émulateur (KVM, sans fenêtre)
5. Installation des deux APK
6. **Accord des permissions Health Connect via ADB** (sans popup utilisateur sur l'émulateur)
7. **Exécution des tests instrumentés** `com.healthtrack.app.HealthConnectTest` qui vérifient :
   - Disponibilité du SDK Health Connect
   - Écriture et lecture de pas (`StepsRecord`)
   - Écriture et lecture de fréquence cardiaque (`HeartRateRecord`)
   - Écriture et lecture de sommeil (`SleepSessionRecord`)
   - Simulation d'une synchronisation increméntale (plage de la dernière heure)
8. Capture d'écran de l'app au démarrage et sur la page Connecteurs

### Tests instrumentés Android

Les tests sont dans :
```
app/android/app/src/androidTest/java/com/healthtrack/app/HealthConnectTest.kt
```

Ils utilisent directement le SDK `androidx.health.connect:connect-client` pour insérer des données synthétiques dans Health Connect, puis lisent ces données pour vérifier que le flux complet fonctionne.

### Artefacts produits

À la fin du run, les artefacts suivants sont disponibles dans l'onglet **Actions → Artifacts** :

- **`screenshots-samsung-a56`** — captures d'écran (démarrage + page Connecteurs)
- **`instrumented-test-results`** — sortie brute des tests instrumentés
- **`apk-debug`** — l'APK installé lors du test

## Version release (signée)

Pour publier sur le Play Store, il faut configurer une clé de signature et un build release. Voir la [doc Capacitor Android](https://capacitorjs.com/docs/android) et la doc Android sur [signing your app](https://developer.android.com/studio/publish/app-signing).

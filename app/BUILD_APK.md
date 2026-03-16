# Générer l’APK Android (HealthTrack)

L’app web est packagée en application Android avec **Capacitor**. Pour produire un fichier APK installable :

## Prérequis

- **Node.js** 20.19+ ou 22+ (pour `npm run build`)
- **Android Studio** (recommandé) ou Android SDK + Gradle en ligne de commande
- **Java JDK 17** (ou celui requis par votre version d’Android Studio)

## Étapes

### 1. Build de l’app web

Depuis la racine de `app/` :

```bash
cd app
npm install
npm run build
```

**Important :** Pour que « Analyser les ingrédients » fonctionne dans l’APK, l’app doit connaître l’URL de votre backend. Définissez-la au build (sans slash final) :

```bash
VITE_API_URL=https://votre-api.onrender.com npm run build
```

Sans cette variable, l’app appellera l’API sur elle-même et vous verrez une erreur du type « is not valid JSON ».

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

## Version release (signée)

Pour publier sur le Play Store, il faut configurer une clé de signature et un build release. Voir la [doc Capacitor Android](https://capacitorjs.com/docs/android) et la doc Android sur [signing your app](https://developer.android.com/studio/publish/app-signing).

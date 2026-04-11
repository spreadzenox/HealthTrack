# HealthTrack – Hub de suivi santé

**HealthTrack** est un hub pour centraliser vos données santé. Fonctionnalités disponibles :

1. **Alimentation** : photo d'assiette → **Gemini** (clé API sur l'appareil) → ingrédients et quantités, enregistrés dans l'app.
2. **Bien-être** : saisie manuelle d'un score quotidien de bien-être (1–5).
3. **Health Connect** : pas, sommeil, fréquence cardiaque, calories et activité synchronisés depuis une montre ou l'application Health Connect Android (Samsung Fit 3, etc.).
4. **Recommandations** : analyse locale (corrélations de Pearson, régression OLS) des facteurs qui influencent votre bien-être.

L'application est une **app mobile-first** (React + Vite + Capacitor) avec stockage **local** (IndexedDB). Aucun serveur HealthTrack n'est requis.

**Stockage des données** : toutes les données utilisateur sont stockées **uniquement sur l'appareil**. Pour survivre à une **réinstallation** de l'app, l'utilisateur peut **exporter** ses données (fichier JSON) depuis la page « Données », puis **réimporter** ce fichier après réinstallation.

## Application web / mobile

L'**app** (`app/`) analyse les photos **directement** via l'**API Gemini** avec une clé saisie dans **Paramètres** (jamais envoyée ailleurs qu'à Google). Aucun serveur HealthTrack n'est requis.

```bash
cd app
npm install
npm run dev
```

Ouvre l'URL affichée (ex. http://localhost:5173) sur ton téléphone (même réseau Wi‑Fi) ou déploie l'app statique.

### APK Android

L'app peut être packagée en **APK** (Capacitor). Voir **[app/BUILD_APK.md](app/BUILD_APK.md)** pour les étapes : build web → `npx cap sync` → ouvrir le projet Android dans Android Studio → Build APK(s).

À chaque push sur `main`, la CI crée une **GitHub Release** avec l'APK. Les utilisateurs qui ont une **version antérieure** voient une **bannière de mise à jour** dans l'app (vérification via l'API GitHub `releases/latest`). Détails dans [app/BUILD_APK.md#build-et-release-automatiques-ci](app/BUILD_APK.md#build-et-release-automatiques-ci).

### Version et mises à jour

- **Bannière de mise à jour** : l'app compare `VITE_APP_VERSION` (injectée au build) au tag de la dernière release GitHub.
- Définis `VITE_APP_VERSION` en CI ou au build (ex. numéro de run, SHA, semver) pour que la comparaison reflète bien tes releases.

## Tests (TDD)

Le dépôt est piloté par le **test-driven development** : toutes les fonctionnalités clés doivent être testables de bout en bout (sauf le pur visuel).

- **Frontend** : `cd app && npm run test` — navigation, pages Dashboard/Food, chargement des données (Vitest + React Testing Library).
- **Règle** : toute nouvelle feature doit être couverte par des tests sur les flux importants. Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Structure du projet

```
HealthTrack/
└── app/                    # App mobile-first (React + Vite + Capacitor, IndexedDB)
    ├── src/
    │   ├── pages/          # Dashboard, Food, Data, Connectors, Settings, Recommendations
    │   ├── components/     # WellbeingCharts, WellbeingPrompt, UpdateBanner
    │   ├── services/       # geminiStandalone, nutritionKPIs, analysisEngine, …
    │   ├── connectors/     # HealthConnectConnector, connectorRegistry
    │   ├── storage/        # localHealthStorage (IndexedDB)
    │   └── settings/       # geminiApiKey, connectorSettings
    ├── android/            # Projet Capacitor Android
    ├── BUILD_APK.md
    └── README.md
```

## Licence

À définir selon ton projet.

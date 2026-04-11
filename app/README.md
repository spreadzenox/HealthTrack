# HealthTrack – App mobile

Hub de suivi santé **mobile-first** : alimentation (photo → Gemini), bien-être, Health Connect (pas, sommeil, fréquence cardiaque), recommandations personnalisées. Données stockées **localement** (IndexedDB), aucun serveur requis.

## Développement

```bash
cd app
npm install
npm run dev
```

Sur téléphone (même Wi‑Fi) : ouvre `http://<IP_DE_TON_PC>:5173` pour utiliser l'app.

## Tests

```bash
npm run test
```

(Vitest + React Testing Library. En cas d'erreur de binding natif sur Windows, réessayer `npm i` ou utiliser Node 20.19+ / 22.)

## Production

- **Build** : `npm run build`
- **Analyse photo** : l'utilisateur doit avoir enregistré une **clé API Gemini** dans l'app (Paramètres). Aucun serveur HealthTrack requis.
- **APK Android** : voir [BUILD_APK.md](BUILD_APK.md) pour la génération via Capacitor / Android Studio.
- **Version / mises à jour** : définir `VITE_APP_VERSION` à la build (ex. numéro de run CI ou semver) pour que la bannière de mise à jour (comparaison avec GitHub Releases) reflète la bonne version.

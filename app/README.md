# HealthTrack – App mobile (web)

Application web **mobile-first** : photo d’assiette → **Gemini** (clé API sur l’appareil, voir **Paramètres**) → ingrédients et quantités, enregistrés **localement** (IndexedDB).

## Développement

```bash
cd app
npm install
npm run dev
```

## Tests

```bash
npm run test
```

(Vitest + React Testing Library. En cas d’erreur de binding natif sur Windows, réessayer `npm i` ou utiliser Node 20.19+ / 22.)

Sur téléphone (même Wi‑Fi) : ouvre `http://<IP_DE_TON_PC>:5173` pour utiliser l’app.

## Production

- **Build** : `npm run build`
- **Analyse photo** : l’utilisateur doit avoir enregistré une **clé API Gemini** dans l’app (Paramètres). Aucun serveur HealthTrack requis.
- **Version / mises à jour** : définir `VITE_APP_VERSION` à la build (ex. commit SHA ou semver) pour que la bannière de mise à jour (comparaison avec GitHub Releases) reflète la bonne version.
- L’app peut être installée comme **PWA** sur le téléphone (meta viewport et theme-color déjà en place).

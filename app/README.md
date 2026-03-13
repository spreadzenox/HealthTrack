# HealthTrack – App mobile (web)

Application web **mobile-first** pour envoyer une photo d’assiette à l’API et afficher les ingrédients et quantités.

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

En dev, l’app est configurée pour envoyer les requêtes à `http://localhost:8000` via le proxy Vite (backend à lancer dans `backend/`).

Sur téléphone (même Wi‑Fi) : ouvre `http://<IP_DE_TON_PC>:5173` pour utiliser l’app et l’API sur ta machine.

## Production

- **Build** : `npm run build`
- **API** : définir `VITE_API_URL` avec l’URL de base de ton API si besoin. Si tu sers l’app et l’API sous le même domaine, laisse vide.
- **Version pour les mises à jour** : définir `VITE_APP_VERSION` à la build (ex. commit SHA ou semver) avec la **même valeur** que `APP_VERSION` côté backend. Les utilisateurs connectés verront alors un bandeau et l’app se rechargera pour prendre les changements.
- L’app peut être installée comme **PWA** sur le téléphone (meta viewport et theme-color déjà en place).

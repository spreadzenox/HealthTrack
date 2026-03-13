# HealthTrack – App mobile (web)

Application web **mobile-first** pour envoyer une photo d’assiette à l’API et afficher les ingrédients et quantités.

## Développement

```bash
cd app
npm install
npm run dev
```

En dev, l’app est configurée pour envoyer les requêtes à `http://localhost:8000` via le proxy Vite (backend à lancer dans `backend/`).

Sur téléphone (même Wi‑Fi) : ouvre `http://<IP_DE_TON_PC>:5173` pour utiliser l’app et l’API sur ta machine.

## Production

- **Build** : `npm run build`
- **API** : définir `VITE_API_URL` avec l’URL de base de ton API (ex. `https://api.healthtrack.example.com`) avant le build. Si tu sers l’app et l’API sous le même domaine (reverse proxy), laisse vide.
- L’app peut être installée comme **PWA** sur le téléphone (meta viewport et theme-color déjà en place).

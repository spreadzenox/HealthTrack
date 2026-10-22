# Relais Halcya (Cloud Run)

Petit serveur HTTP sans dépendance (Node 22) qui fait l'analyse IA des repas de la variante **play** avec Gemini sur
**Vertex AI dans l'UE**, sous l'identité du compte de service `relay-runtime` : aucune clé API n'existe, ni dans l'app
ni ici. Décisions et infrastructure : `journal/INFRA.md`, jalon 6 de `journal/PRODUIT.md`.

- `POST /v1/meal/analyze` (en-tête `X-Install-Id`, identifiant aléatoire de l'installation) :
  `{ "kind": "photo", "image": { "mimeType": "image/jpeg", "data": "<base64>" } }` ou
  `{ "kind": "text", "description": "2 œufs au plat et une tartine" }` →
  `{ "parsed": { "not_food": false, "dish": "…", "ingredients": [ … ] }, "model": "…", "quota": { "remaining": 19, "resetAt": "…" } }`.
  429 quand un plafond est atteint (`scope` : `install`, `global` ou `minute`), 502 si le modèle n'a pas répondu.
- `GET /healthz` → `{ "ok": true }`.

Garde-fous : les consignes sont construites par le relais (pas de prompt libre), métadonnées des photos retirées,
rien n'est stocké ni journalisé du contenu, plafonds par installation, par jour et par minute (`src/quota.js`),
une seule instance au plus. Prochaine étape (6b) : jetons Play Integrity et vérification de l'abonnement.

Tests : `npm test` (node:test, sans réseau). Déploiement : à chaque push sur `main` qui touche `relay/` (workflow
« Relais — déploiement »), qui vérifie ensuite `/healthz` et une vraie analyse de texte.

# Relais Halcya (Cloud Run)

Petit serveur HTTP sans dépendance (Node 22) qui fait l'analyse IA des repas de la variante **play** avec Gemini sur
**Vertex AI dans l'UE**, sous l'identité du compte de service `relay-runtime` : aucune clé API n'existe, ni dans l'app
ni ici. Décisions et infrastructure : `journal/INFRA.md`, jalon 6 de `journal/PRODUIT.md`.

- `POST /v1/meal/analyze` (en-tête `X-Install-Id`, identifiant aléatoire de l'installation) :
  `{ "kind": "photo", "image": { "mimeType": "image/jpeg", "data": "<base64>" } }` ou
  `{ "kind": "text", "description": "2 œufs au plat et une tartine" }` →
  `{ "parsed": { "not_food": false, "dish": "…", "ingredients": [ … ] }, "model": "…", "quota": { "remaining": 19, "resetAt": "…" } }`.
  En-têtes facultatifs `X-Credits` (dernier état des crédits donné par le relais) et `X-Purchase-Token` (premium).
  La réponse porte aussi `credits` : `{ "plan": "free", "remaining": 24, "monthly": 14, "welcome": 10,
  "resetAt": "2026-11-01T00:00:00.000Z", "state": "2026-10:1:0" }` (premium : `daily`, renouvellement à minuit UTC).
  429 quand un plafond est atteint (`scope` : `install`, `global`, `minute`, `credits` ou `premium_day`), 502 si le
  modèle n'a pas répondu.
- `GET /v1/credits` (mêmes en-têtes) → `{ "credits": { … } }` sans rien consommer. Règle (`src/credits.js`) :
  10 analyses offertes une fois + 15 par mois civil non cumulables en gratuit, 10 par jour en premium. Registre en
  mémoire (empreintes seulement) ; l'app renvoie son dernier état et le relais garde le plus restrictif.
- `POST /v1/subscription/verify` (en-tête `X-Install-Id`) : `{ "purchaseToken": "…" }` (ou au format du validateur
  cdv-purchase, `{ "transaction": { "purchaseToken": "…" } }`) → droits premium relus chez Google Play
  (`subscriptionsv2.get`) : `{ "ok": true, "premium": true, "source": "play", "state": "active", "expiresAt": "…",
  "trial": false, "acknowledged": true, "replaces": null, "accountMatch": true, "data": { "collection": [ … ] } }`.
  Le relais accuse réception de l'achat (sinon Google le rembourse au bout de 3 jours). Sans jeton : seulement la
  « période de lancement » (`LAUNCH_PREMIUM_UNTIL`, vide par défaut). 404 si Google ne connaît pas le jeton.
- `POST /pubsub/rtdn` : notifications d'abonnement Google Play (abonnement push `play-rtdn-relay` du sujet
  `play-rtdn`, créé par la CI, jeton OIDC de relay-runtime vérifié) → relecture de l'abonnement et accusé.
- `GET /health` → `{ "ok": true }`.

Garde-fous : les consignes sont construites par le relais (pas de prompt libre), métadonnées des photos retirées,
rien n'est stocké ni journalisé du contenu, plafonds par installation, par jour et par minute (`src/quota.js`),
une seule instance au plus. Play Integrity (`src/integrity.js`, jalon 6b-2) : l'app joint `X-Integrity-Token`
(jeton standard, `requestHash` = sha256(`halcya-integrity:<installation>`)) ; le relais le fait décoder par Google et
lit le verdict (app reconnue par Play, appareil certifié, jeton récent). `INTEGRITY_MODE` : `off`, `observe` (déployé :
journalise `event=integrity`, ne bloque rien) ou `enforce` (403 `integrity` sans verdict accepté).

Tests : `npm test` (node:test, sans réseau). Déploiement : à chaque push sur `main` qui touche `relay/` (workflow
« Relais — déploiement »), qui vérifie ensuite `/health` et une vraie analyse de texte.

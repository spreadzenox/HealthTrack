# Run du 28/10/2026 23:33 (Paris, CET) — Gestes plus clairs (POL-PLAY-31, POL-PLAY-33)

**Type** : 🎨 UI / ergonomie

## Constat au démarrage
- Main à `7beec40` (#487), tous les workflows verts (Build & Release v347, Play — AAB, Tests, émulateur A56).
- Aucune PR « [Auto] » ouverte. PR #51 (`cursor/*`) non touchée.

## Fait
- **POL-PLAY-31** — `Data.jsx` : « Supprimer toutes mes données » passe de `.btn-secondary` (contour émeraude, comme
  « Choisir un fichier à importer ») à `.btn-irreversible` (`Food.css` : contour et texte `--color-alert`, #C2410C en
  clair, #FF8A65 en sombre ; survol `--alert-rgb`). La confirmation (`.btn-danger`, « Exporter d’abord ») ne change pas.
- **POL-PLAY-33** — `Reintroduction.jsx` : `groupTag` renvoie `null` tant qu'un groupe n'est pas testé ; `GroupTag`
  n'affiche l'étiquette que pour un résultat. Les groupes à un aliment (GOS, fructose, lactose, sorbitol, mannitol)
  ont un chevron à droite (`.fodmap-group-chevron`, lilas). `Recommendations.jsx` : « Voir les liens incertains »
  sans le nombre (singulier inchangé).

## Tests
- `Data.test.jsx` : le bouton a `btn-irreversible`, pas `btn-secondary`. `Reintroduction.test.jsx` : aucun « pas
  testé », chevron présent sur Lactose. `Recommendations.test.jsx` : « Voir les liens incertains ». Rouges avant, verts après.

## Vérifications
- `npm run test` : vert (2 641) ; lint 6 erreurs (inchangé) ; build OK.
- Captures relues : `--play --dark --routes=/data,/reintroduction` (bouton orange clair sur fond sombre ; la
  réintroduction est derrière le paywall sans abonnement, normal) et `--play --subscription=launch
  --routes=/reintroduction,/data` (clair : chevrons alignés, aucune étiquette, Fructanes avec ses trois boutons ;
  bouton orange lisible sur la surface). `npm run visual` complet : voir ci-dessous.

## Demandes iOS
- Note de Nouveautés commune aux deux plateformes (écrans partagés) : pas de `variants`.

## Suite
- I190 soldé. Prochain run de code : suite du BACKLOG polissage par impact (nouvel audit `--play --empty` si rien
  de plus prioritaire), P33 toujours au propriétaire.

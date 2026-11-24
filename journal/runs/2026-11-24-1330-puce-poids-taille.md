# Run 24/11 13:30 — #1238 mergée, puce « Poids · dès 3 pesées » à la taille de ses voisines

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 5c34444 vert (Tests,
émulateur A56, Build & Release, Play — AAB) avant le merge de #1238 ; Alpha du 24/11 partie (06:26 UTC, succès) ·
**TestFlight** : build du soir faite (iOS — TestFlight 04:49 UTC), examen bêta soumis et anciennes builds expirées
(04:31 et 04:33 UTC, succès) · **Parité** : 70 % (33/47)

## État de départ
- #1238 (POLISH-SIM-94) ouverte par le run de 12:30 : 18 checks verts, dont « Build iOS (simulateur) et captures »
  (41 min) et les 5 émulateurs Android ; branche à jour sur main.
- Captures regardées : iPhone (branche `captures/pr-1238`, Tendances en clair et en sombre, données de démo : rien
  de cassé) ; Android (`npm run visual -- --routes=/tendances --history-days=4 --weigh-in --click="Ajouter une
  mesure"`) : la puce « Poids · dès 3 pesées » est là, mais plus haute que ses voisines (44 px contre 32 px).
- **#1238 mergée** (squash, titre et texte écrits à la main, sans ligne d'attribution) : défaut mineur, retouche à part.
- #51 (`cursor/*`) pas touchée.

## Retouche de la puce en attente
- La puce reprenait la classe `is-daily` (min-height 44 px, faite pour les puces « · en Mois » de Jour). Elle a
  maintenant son style `is-pending` (texte et pastille gris) ; sous « Choisissez une courbe », elle prend
  `trends-pick-chip`, la taille des grandes puces de choix.
- Test : `Trends.test.jsx` vérifie que la puce de « + » n'a ni `is-daily` ni `trends-pick-chip` (rouge avant, vert après).
- Captures Android refaites en clair et en sombre : « Poids · dès 3 pesées » fait 155×32, comme ses voisines.

## Vérifications
- `npm run test` : 456 fichiers verts ; `npm run lint` : 0 erreur ; `npm run build` vert.
- Pas de note de Nouveautés : la note de #1238 couvre la fonction ; seule sa taille change.

## Suite
1. Run suivant : checks de la PR (dont le build iPhone), puis merge.
2. FUSION-3 étape 3 : réponse de l'orchestrateur attendue (notes `["appstore"]` dans `app/src/data/changelog/` ?).
3. `ios/cameraPermission.js` (non branché) : à brancher ou retirer.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

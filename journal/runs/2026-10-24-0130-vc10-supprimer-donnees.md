# 2026-10-24 01:30 Paris (23:30 UTC) — VC-10 : « Supprimer toutes mes données »

**Type** : 🧭 chantier produit (passe « version candidate », critère C1 ; RGPD, droit à l'effacement)

## Constat
- Main à `c9f09ba` (#305 mergée entre-temps) ; Tests, Build & Release, Play — AAB, émulateur A56 verts. Aucune PR
  « [Auto] » ouverte (seule #51 `cursor/*`, non touchée). Run de code.
- Seul moyen de tout effacer jusqu'ici : désinstaller ou « Effacer les données » d'Android (politique de
  confidentialité).

## Ce qui a été fait
- `storage/localHealthStorage.js` : `deleteAllEntries()` vide `health_entries` et `daily_aggregates` (schéma inchangé,
  pas de migration), renvoie le nombre d'entrées effacées, incrémente la révision des données.
- `services/deleteAllData.js` : `deleteAllMyData()` = entrées + `DELETED_KEYS` (profil, cache d'analyses, journaux de
  connexion de la montre, appareils BLE inconnus) + clé de session de l'invite bien-être, puis
  `health-entries-updated`. `KEPT_KEYS` documente ce qui reste exprès : réglages qui reflètent un état natif (lecture
  du visage, temps d'écran, note du soir, synchro auto de la montre) — les effacer ferait dire « désactivé » à l'app
  pendant que le service Android tourne —, dates de reprise des synchros (sinon l'historique revient à la synchro
  suivante), appairage de la montre (ne pas forcer un nouvel appairage), abonnement, crédits IA, identifiant
  d'installation, clé Gemini, thème, onboarding.
- `pages/Data.jsx` : 3ᵉ bloc « Supprimer » ; confirmation avec le nombre d'entrées, ce qui reste, « Exporter
  d'abord », « Supprimer définitivement » (rouge), « Garder mes données ». Message final avec le nombre effacé ;
  erreur affichée avec « Rien n'a été supprimé ».
- Politique de confidentialité (`public/privacypolicy.html`, « Vos droits ») : décrit ce geste ; test de contenu
  mis à jour.
- Changelog `2026-10-24-0130-supprimer-mes-donnees.json`.

## Vérifications
- `npm run test` : 167 fichiers, 2 054 tests, tous verts (dont 9 nouveaux).
- `npm run build` OK ; `npm run lint` : 6 erreurs, identiques à main.
- `npm run visual -- --play --routes=/data` en clair et `--dark` : captures relues ; `npm run visual` complet : toutes les pages OK, 0 erreur JS.

## Suite
- VC-18 (rappel de fin d'essai, page Conditions), VC-15, VC-5, VC-9 ; VC-19.

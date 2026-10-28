# Run du 28/10/2026 04:33 (Paris, CET) — Montre « À reconnecter » après une restauration (reste de SAUV)

**Type** : 🎨 polissage (visible)

## Constat au démarrage
- Main à `fdd3329` (#454), aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, pas à nous). Run de code (pas 08 h / 20 h).
- Liste POL-PLAY presque vide (POL-PLAY-11 demande la Play Console) → reste ouvert de SAUV : « si l'auto-synchro de la
  montre tente un réappairage sans geste après restauration, le rendre explicite ».

## Analyse
- `restoreGuard` retire `healthtrack_watch_keys` après une restauration ; `syncWatchIfStale` rend alors `not_paired` :
  **aucun réappairage silencieux** (bien).
- Mais l'état `healthtrack_watch_autosync` restauré gardait `outcome: 'connected'`, batterie et date : la carte « Montre
  Huawei » disait « Connectée · batterie 80 % · synchro il y a 2 j » et « Synchroniser la montre », sans jamais plus
  synchroniser. L'utilisateur ne pouvait pas deviner qu'il fallait réappairer.

## Fait
- `watchAutoSync.js` : `markWatchRestored()` (seulement si une montre a déjà été connectée) → `outcome: 'restored'`
  (ajouté aux issues qui mettent l'automatique en pause), batterie oubliée ; `describeWatchStatus` → « À reconnecter ·
  Vos données sont revenues sur ce téléphone, pas la clé de la montre… ». Une connexion réussie efface l'état.
- `restoreGuard.js` : l'appelle quand la clé de la montre fait partie des secrets retirés.
- `WatchConnect.jsx` : bouton « Reconnecter ma montre » dans cet état (même geste : sans clé, PIN + liaison).
- `npm run visual -- --routes=/connectors --ble=watch --connect=restored --devices` (nouvelle option).

## Vérifications
- Tests : 6 nouveaux (rouges avant le code) ; suite complète 2 594 verts ; lint 6 erreurs (inchangé) ; build OK.
- Captures Sources clair et sombre relues (« À reconnecter », bouton émeraude) ; `npm run visual` (démo) 15 pages sans erreur.

## Suite
- À tester par le propriétaire à la prochaine réinstallation (voir résumé).
- POL-PLAY-11 (alpha après une journée sans plantage, Android vitals) ; suite de l'audit écran par écran.

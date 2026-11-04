# 04/11 18:35 — Historique du bien-être : un point par heure quand la journée est très lue

Type : 🎨 lisibilité (I83, version utile).

## Constat au démarrage
- main vert (`fa30052`, #691 mergée par le run de 17:35) ; seule PR ouverte : #51 (cursor/*, non touchée) ; aucune
  autre exécution en cours.
- Priorités du prompt en attente du propriétaire (P42 Alpha, P37, P43, P44, P45) ; `iosUntil` déjà servi (06/11).
- Accès à HealthTrack-iOS refusé à cette session (`add_repo` refusé) : `DEMANDES.md` non relu ce run (relu à 16:35).
- I83 relu : les courbes de l'Accueil et de Tendances lisent déjà des agrégats journaliers, la réduction de points y
  serait sans effet. Le seul endroit dense : la vue **Jour** de l'Historique du bien-être, un point par lecture alors
  que la lecture au déverrouillage peut tourner toutes les 2 min (`FaceSchedule.MIN_INTERVAL_MS`) : > 100 points et
  fourchettes superposées sur 284 px.

## Fait
- `services/mood/wellbeingHistory.js` : au-delà de `DAY_MAX_POINTS` (24) lectures dans la journée, un point par heure
  locale (médianes pondérées de la note, du bas et du haut de la fourchette, comme les jours de la semaine ; `hourly`,
  `readings`). La moyenne du jour reste celle des lectures (pas celle des heures). Semaine et mois inchangés.
- `pages/WellbeingHistory.jsx` : libellé accessible « … : 120 lectures, un point par heure » (comptait les points) ;
  légende « estimé (visage), par heure ».
- `npm run visual -- --face-dense` : aujourd'hui, une lecture toutes les 6 min depuis 7 h (synthétique).
- Tests : `wellbeingHistory.test.js` (regroupement, moyenne des lectures ≠ moyenne des heures, ≤ 24 lectures inchangé),
  `WellbeingHistory.test.jsx` (libellé et légende).

## Vérifications
- `npm run test` (3 012 verts), `npm run lint` (0 erreur), `npm run build`, `npm run visual` (toutes les pages),
  `--routes=/bien-etre --face-dense --click=Jour` en clair et `--dark` (captures relues : 120 lectures → 12 points
  horaires avec leur fourchette, moyenne 2,7).

## Suite
- TEST-ALPHA-1 (07–08/11, clic P42) avec `--font-scale=1.3` ; P37, P43, P44, P45 en attente du propriétaire.

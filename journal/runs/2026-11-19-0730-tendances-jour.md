# Run du 19/11 07:30 — Tendances : la mesure choisie reste en Jour (POLISH-SIM-107)

**Type** : 🛠️ code (polish de la refonte, objectif du 22/11) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 25f72cd.

## État de départ
- main vert (#1116 : Tests, Build & Release, Play — AAB verts ; émulateur en cours au départ).
- Aucune PR « [Auto] » ouverte (seule #51, brouillon de mai, hors routine).
- Alpha de la nuit partie (03:51 UTC) ; TestFlight 1173.1173 soumise à l'examen bêta (run de 04:30). Rien de neuf côté Apple à faire avant le prochain envoi du soir.

## Ce qui a été fait
- **POLISH-SIM-107 (1re moitié)** : dans Tendances, Sommeil choisi en Semaine redevenait « Bien-être » en passant à
  Jour (la puce affichée en Jour était toujours Bien-être, et la courbe heure par heure du bien-être s'affichait sous
  une fiche du jour qui parlait de sommeil). Maintenant, en Jour : les puces sont les mesures choisies ; la courbe heure
  par heure n'apparaît que si le bien-être en fait partie ; « + » propose le bien-être (non grisé, on reste en Jour) et
  les autres mesures grisées (elles passent en Semaine, comme avant) ; une puce se retire aussi en Jour. Au retour en
  Semaine, la mesure choisie est toujours là. `TrendsViewer.jsx` ; test `Trends.test.jsx` écrit d'abord (rouge, puis vert).
- **2e moitié laissée** : le « + » ne propose ni FC continue, ni phases du sommeil, ni SpO2 : ce sont de nouvelles
  courbes (nouvelle fonction, mode polish) → proposition au propriétaire, pas codée. La digestion y est dès qu'elle a
  3 points.
- Note de Nouveautés `2026-11-19-0730-tendances-jour` (Android et iPhone).

## iPhone
- Code partagé ; aucun correctif de `iphone/patches/` ni fichier de l'overlay ne touche `TrendsViewer.jsx` ou
  `Trends.test.jsx`. Parité : 70 % (inchangée). Une seule build iPhone sur la PR.

## Vérifications
- `npm run test` : **4 092 verts** ; `npm run build` vert ; ESLint propre sur les fichiers touchés.
- Capture relue : `--routes=/tendances?mesure=sleep --click=Jour` (démo) : puce « Sommeil » et « + », Jour actif,
  mercredi 18 novembre, « Sommeil 7 h 41 » puis « Vos saisies » ; plus de courbe du bien-être sous Sommeil.

## Suite proposée
1. Merger cette PR après ses checks (build iPhone compris).
2. Polish du 22/11 : POLISH-SIM-105 (Accueil « Ce que Halcya suit pour vous »), POLISH-SIM-100 (objectifs migrés
   expliqués), POLISH-SIM-108.

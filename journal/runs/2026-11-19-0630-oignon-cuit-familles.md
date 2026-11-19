# Run du 19/11 06:30 — Oignon cuit, familles « pas assez nettes » (POLISH-SIM-104, POLISH-SIM-106)

**Type** : 🛠️ code (polish de la refonte, objectif du 22/11) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main b0c5547.

## État de départ
- main vert (#1115 : Tests, Build & Release, Play — AAB verts ; émulateur en cours au départ).
- Aucune PR « [Auto] » ouverte (seule #51, brouillon de mai, hors routine).
- Alpha de la nuit partie (03:51 UTC) ; TestFlight 1173.1173 soumise à l'examen bêta par le run de 04:30 ; expiration des builds passée à 03:36 UTC.

## Ce qui a été fait
- **POLISH-SIM-104** (simulation « Ventre et données » J1 du 16/11) : dans Objectifs › Votre bien-être › Par famille,
  une famille dont aucun facteur n'est net disait « Pas de lien net pour l'instant », au-dessus de lignes hachurées
  chiffrées (GOS −1,1 pt) : « il y a un lien ou pas ? ». Elle dit maintenant « Pas assez net pour l'instant », les mots
  de la légende des barres (« hachuré, chiffre en gris : pas assez net ») et du lien « Voir les liens pas encore nets ».
  `influenceFamilies.js` (NONE_WORD), test mis à jour d'abord (rouge, puis vert). « Essayer dans Agir » : déjà retiré
  par POLISH-SIM-99.
- **POLISH-SIM-106** : l'oignon cuit n'était marqué que « fructose en excès ». `fodmapMeasurements.json` reçoit
  « Oignon, cuit », « Oignon blanc ou jaune, sauté/poêlé sans matière grasse » et « Oignon rouge, sauté/poêlé » :
  fructanes de l'oignon cru (Ferjančič 2024, borne haute Liljebo 2020) ramenés par les glucides Ciqual cuit / cru
  (comme l'ail cuit), confiance « analogie » (donc « probable » dans le repas). Oignon nouveau non repris (autre
  légume). Fichier remis en forme par `formatMeasurements` (diff de 9 lignes). Test : 40 g de chacun → fructanes
  « élevé », alias « Oignon cuit » compris.
- Note de Nouveautés `2026-11-19-0630-oignon-cuit-familles` (Android et iPhone).

## iPhone
- Code et données partagés ; aucun correctif de `iphone/patches/` ne touche `influenceFamilies.js`,
  `fodmapMeasurements.json` ni leurs tests. Parité : 70 % (inchangée). Une seule build iPhone sur la PR.

## Vérifications
- `npm run test` : **4 091 verts** ; `npm run build` vert ; ESLint propre sur les fichiers touchés.
- Capture relue : `--routes=/recommendations/bien-etre` (démo) : Sommeil, Alimentation, Activité « Pas assez net pour
  l'instant », puis « Voir les liens pas encore nets ».

## Suite proposée
1. Merger cette PR après ses checks (build iPhone compris).
2. Polish du 22/11 : POLISH-SIM-105 (Accueil « Ce que Halcya suit pour vous »), POLISH-SIM-100 (objectifs migrés
   expliqués), POLISH-SIM-107 (Tendances, mesure gardée de Semaine à Jour).

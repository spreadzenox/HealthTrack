# Run du 19/11 21:30 — Bien-être : un seul délai (POLISH-SIM-116)

**Type** : 🛠️ code (polish de la refonte, objectif du 22/11) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 238a9bd.

## État de départ
- main vert sur #1130 (Tests, émulateur Galaxy A56) et #1129 (Build & Release, Play — AAB).
- Aucune PR « [Auto] » ouverte (seule #51, brouillon de mai, hors routine).

## Ce qui a été fait
- **POLISH-SIM-116** (persona « Stressé et pressé » J1 : Accueil « Jour 1 sur 7 », Objectifs « 6 jours »,
  « Votre bien-être » « Encore 13 jours notés, 1/14 »). Le compte à rebours de la page d'un objectif
  (`Countdown`, `Recommendations.jsx`) suit maintenant les deux paliers de `config/firstResults.js` :
  - avant `FIRST_SCORE_DAY` (7 bien-être, 14 digestion) : « Premier score dans N jours notés », barre N/7
    (ou N/14), puis « Pistes au 14e jour noté. » (28e pour la digestion) ;
  - score passé, pistes pas encore là : « Vos pistes dans N jours notés », barre N/14 (ou N/28), « Votre score est
    déjà dans Objectifs. »
- Même vocabulaire que la carte d'Objectifs (« Premier score dans N jours notés ») et que Ma journée (04:30).
- Tests d'abord (`Recommendations.test.jsx` : 2 cas modifiés, 1 ajouté), rouges puis verts.
- Note de Nouveautés `2026-11-19-2130-bien-etre-un-palier` (sans variante : Android et iPhone).

## iPhone
- Seul correctif touchant cette page : `50-piste-verrouillee.patch` (CSS, non touché) ; code partagé repris tel quel.
- Parité : 70 % (inchangée). TestFlight : 1173.1173 en examen bêta depuis le 19/11 04:31 ; la build du soir n'était
  pas encore partie à 20:45 UTC (cron de GitHub en retard, comme les nuits précédentes).

## Vérifications
- `npm run test` : 4 116 verts (367 fichiers) ; `npm run build` vert ; ESLint propre sur les fichiers touchés.
- Captures relues : `--routes=/recommendations/bien-etre,/recommendations/ventre --onboarding=gut --history-days=3`
  (« Premier score dans 4 jours notés », 3/7, « Pistes au 14e jour noté » ; digestion « 12 jours », 2/14, « 28e ») et
  `--history-days=10` (« Vos pistes dans 4 jours notés », 10/14, « Votre score est déjà dans Objectifs »).

## Suite proposée
1. Finir cette PR si besoin (checks, build iPhone, merge en squash).
2. POLISH-SIM-117 (Jour sans point pour une note), 118 (poids en Semaine), 120, 119, 121.
3. Après l'Alpha de 23:45 : soumission bêta de la build TestFlight du soir et expiration des anciennes.

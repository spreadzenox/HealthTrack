# Run 28/11 00:30 — valeur habituelle par famille (REFONTE-6b-2)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 354c3f2 (#1317) vert
(Tests, Build & Release v953, Play — AAB ; émulateur A56 en cours à 23:30 UTC) · **TestFlight** : 1362.1362 chez
« Testeurs Halcya » ; build du soir et Alpha de 23:45 pas encore parties à 23:30 UTC (le cron de GitHub part en
général entre 02:50 et 04:35 UTC) · **Parité** : 70 % (33/47), inchangée (code partagé)

## État de départ
- #1317 (POLISH-BOISSON-ML) mergée par le run de 23:30. Aucune PR de la routine ouverte ; #51 (`cursor/*`) pas touchée.
- Pas de nouvelle réponse du propriétaire.
- Le « À vérifier (petit) » du passage des personas du 27/11 08:30 (fructanes et mannitol tus dans Alimentation) était
  déjà fait par POLISH-FODMAP-ABSENT (#1308) : coché.

## Fait
- **REFONTE-6b-2, moyenne par famille** (tests d'abord) : `familyUsuals(days, now)` dans `influenceFamilies.js`.
  Sommeil et pas : médiane des 14 jours passés, dès 7 jours de mesure (mêmes constantes que `dayDeviations.js`, donc
  le même chiffre que « d'habitude » sur l'Accueil) ; aujourd'hui exclu. Repas : nombre noté sur 14 jours, aujourd'hui
  compris. Rien sans mesure (la carte garde son « Notez vos repas… »).
- `Recommendations.jsx` : lecture des nuits, pas et repas des 15 derniers jours (`readFamilyDays`, injectable ; une
  lecture en échec n'affiche rien), « · 7 h 38 par nuit » en texte courant à côté du nom de la famille
  (`.reco-family-usual`). Rien de stocké, pas de migration.

## Vérifications
- Tests : 3 nouveaux (service) + 2 (page) ; `vitest related` 71 verts. Suite complète : 4 751 verts ; les 3 rouges de
  ce passage venaient d'un `git stash` fait pendant qu'elle tournait (fichier de service absent), verts une fois relancés.
- Lint : 0 problème. Build : ok.
- Captures `--routes=/recommendations/bien-etre,/recommendations/ventre --now=14:00`, en clair, `--dark` et
  `--font-scale=1.3` relues : « Sommeil · 7 h 38 par nuit », « Alimentation · 18 repas en 14 jours », « Activité ·
  6 386 pas par jour » ; à 1,3 tout tient sur une ligne, chevron compris.

## Suite proposée
1. Finir la PR (passer en « prête » pour son seul build iPhone, captures iPhone d'Objectifs) puis merger.
2. Vérifier la build du soir, TestFlight et l'Alpha (parties tard) ; soumission bêta de la build du soir au premier run
   qui la voit traitée, expiration des anciennes.
3. SPEC § 6.5 (« Vos 14 dernières nuits · en moyenne 7 h 05 » dans le détail de la famille) : petit reste possible.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, le message E.

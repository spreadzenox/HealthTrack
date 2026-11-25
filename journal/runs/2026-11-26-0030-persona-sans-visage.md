# Run 26/11 00:30 — Personas sans lecture du visage (POLISH-SIM-65)

**Type** : 🔧 (outillage des simulations, aucun code de l'app) · **Contrôle d'intégrité** : empreinte conforme
(dd430fbd…) · **Android** : main a69f905 (#1272) vert (Tests, Play — AAB, Build & Release ; émulateur A56 en cours au
départ) · **TestFlight** : 1313.1313 chez « Testeurs Halcya » ; build du soir du 25/11 (cron 21:20 Paris) et Alpha de
23:45 pas encore partis à 23:30 UTC (retard habituel du cron de GitHub) · **Parité** : 70 % (33/47), inchangée

## État de départ
- #1272 (POLISH-SIM-85) déjà mergée à 23:15 UTC, Build & Release vert. Aucune PR de la routine ouverte (seule #51,
  `cursor/*`, pas à la routine). Pas de réponse du propriétaire (LANT-4, courbes de la montre, PROP-SIM-19).
- iPhone : `upstream.json` à `HEAD`, plus aucun correctif dans `iphone/patches/` ; rien à avancer.

## Fait
- **POLISH-SIM-65** : `personaEntries(…, { face: 'off' })` et `persona-browse.mjs --face=off` donnent une persona qui
  n'a jamais activé la caméra : aucune entrée `face_burst`, tout le reste identique ; valeur inconnue refusée. Test
  dans `personaData.test.mjs` (rouge avant, vert après). Tirage décrit dans `PERSONAS.md` (environ une persona sur
  trois parmi « téléphone seul » et « sans technique »).
- Vérifié en vrai : `--day=14 --equipment=phone --face=off`, 80 entrées ; l'Accueil dit « Notez votre bien-être dans
  Ma journée, ou laissez la caméra lire votre visage : à activer dans Sources. », sans lecture inventée.
- **POLISH-SIM-64** soldée : `--dark` règle déjà le thème de l'app (POLISH-SIM-81b).
- Aucun changement visible dans l'app : pas de note de Nouveautés. `app/scripts/persona/**` est exclu du build
  iPhone : aucune minute de Mac.

## Suite proposée
1. Run « idées » de 08:30 : tirer `--face=off` pour une des deux personas.
2. Vérifier le build du soir, TestFlight et l'Alpha ; soumission bêta et expiration au premier run qui voit la build
   traitée par Apple.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

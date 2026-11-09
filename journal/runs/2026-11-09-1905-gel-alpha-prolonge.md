# Run 09/11 19:05 — Alpha : gel prolongé jusqu'au 10/11 au soir (examen de 100918)

> ⚠️ **PR #870 non mergée par ce run** : checks « Frontend (Vitest) » et « Build APK » verts à 18:15 UTC et branche à
> jour sur main, mais le merge a été refusé par les permissions de la session (merge sans relecture). Elle doit être
> mergée (squash) avant 22:30 UTC par le propriétaire ou l'orchestrateur, sinon l'envoi Alpha de 22:45 UTC partira.

**Type** : infra (run court « gel Alpha prolongé », lancé par l'orchestrateur).

## Contexte
- 100918 (nouvel accueil) est sur la piste Alpha depuis le 08/11 à 19:52 et toujours en examen chez Google ;
  l'API ne dit pas quand l'examen se termine.
- Le gel du 08/11 (#844, `until` = `2026-11-09T21:00:00Z`) expirait ce soir à 22:00 (Paris) : l'envoi nocturne de
  « Play — Alpha » (cron 22:45 UTC, 23:45 à Paris) serait parti.
- Décision du propriétaire du 09/11 vers 18:40 : « ne prolonge pas le gel sauf si ça pose problème avce google comme
  c'est le cas avec apple ». Jugement de l'orchestrateur : la condition est remplie. D'après l'en-tête de
  `reviewGate.mjs` (aide de la Play Console), le délai d'examen repart du dernier changement envoyé, et un envoi
  pendant l'examen peut renvoyer l'app en fin de file ; avec un envoi chaque nuit, les examens s'enchaîneraient sans
  aboutir et les testeurs resteraient sur 100898. Prolongation de 24 h seulement.

## Fait
- `app/scripts/play/review-freeze.json` : `until` = `2026-11-10T21:00:00Z` (22:00 à Paris), avec la raison.
- `reviewGate.test.mjs` : nouveau test pour ce gel (pendant de celui du 08/11, gardé tel quel) : l'envoi du 09/11
  à 22:45 UTC est retenu (`frozen`), celui du 10/11 à 22:45 UTC part.
- Aucune PR « [Auto] » ouverte ne touchait `review-freeze.json` (seule PR ouverte : #51, sans rapport).
- Vérifs : `npm ci`, `npm run test` (3 341 tests verts, 44 ignorés), `npm run build` (OK).
- Rien dans `app/src`, pas d'entrée Nouveautés. Aucun envoi lancé.
- BACKLOG.md : aucune ligne ne parle de ce gel en particulier (la ligne CD-ALPHA-6/7 parle du mécanisme), rien changé.
- README : point d'attention en tête ; la phrase « Part sur Alpha ce soir 23:45 (fin du gel à 22:00) » du point
  « Gold expliqué » corrigée pour ne plus annoncer un envoi ce soir.

## Reste
- Le 10/11 à 23:45 (Paris), l'envoi repart seul si le gel n'est pas prolongé à nouveau.
- Si le propriétaire voit 100918 publiée dans la Play Console avant, lever le gel par PR (`until` = `null`).

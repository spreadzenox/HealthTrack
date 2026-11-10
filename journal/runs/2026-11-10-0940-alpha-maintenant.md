# Run 10/11 09:40 — Alpha : gel levé, envoi immédiat (décision du propriétaire)

**Type** : infra (run court « Alpha maintenant », lancé par l'orchestrateur).

## Contexte
- Les testeurs Alpha sont encore sur 100898 (publiée le 08/11). 100918 (nouvel accueil) est en examen chez Google
  depuis le 08/11 à 19:52 (Paris), soit environ 38 h ; le propriétaire signale que les testeurs Alpha prennent un
  retard important.
- Le gel `review-freeze.json` (#870, `until` = `2026-11-10T21:00:00Z`) retenait « Play — Alpha » jusqu'à ce soir
  22:00 (Paris) ; avec `NIGHTLY_MIN_HOURS = 0`, seul ce gel retenait l'envoi.
- Décision du propriétaire du 10/11 vers 09:35 : « Ne prolonge pas et meme lance la publication android alpha
  maintenant ».

## Fait
- Aucune PR « [Auto] » ouverte ne touchait `review-freeze.json` (seule PR ouverte : #51, sans rapport).
- `app/scripts/play/review-freeze.json` : `until` = `null`, avec la raison.
- `reviewGate.test.mjs` : test court « gel levé » (`freezeUntil: null` le 10/11 à 09:00 UTC → `send: true`) ; les
  tests des gels du 08/11 et du 09/11 sont gardés (ils sortent tôt quand `until` est `null`).
- Vérifs : `npm ci`, `npm run test` (3 359 tests verts, 44 ignorés), `npm run build` (OK).
- Rien dans `app/src`, pas d'entrée Nouveautés.

## Envoi Alpha
- Lancé à la main (`workflow_dispatch` de « Play — Alpha (livraison continue) » sur main) juste après le merge.
- Résultat : voir le commentaire de la PR et la mise à jour de ce compte rendu.

## Reste
- Envoi nocturne normal ensuite (23:45, heure de Paris), sans gel.

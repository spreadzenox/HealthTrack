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
- PR #886 mergée (squash) après « Frontend (Vitest) » et « Build APK » verts ; gel levé vérifié sur main.
- Lancé une fois à la main (`workflow_dispatch` sur main) :
  [exécution 42785591067](https://github.com/spreadzenox/HealthTrack/actions/runs/42785591067), **succès**
  (08:49 → 08:54 UTC).
- Résumé de l'exécution : commit `d7a5916` · versionCode **100962** · alpha avant : 100918 · test interne : 100965 ;
  décision « envoi de 100962 » (85 fichiers de l'app modifiés depuis 100918) ; ✅ 100962 placé sur l'alpha (même AAB
  que le test interne), en examen chez Google (quelques heures à 2 jours) avant d'arriver aux testeurs.
- État des pistes : test interne 100965 (déployée) ; test fermé (Alpha) 100962 (déployée). « déployée » = validée
  par l'envoi ; l'API ne dit pas si Google a fini l'examen.
- 100962 remplace 100918 sur l'alpha : c'est elle que Google examine désormais.

## Reste
- Envoi nocturne normal ensuite (23:45, heure de Paris), sans gel.

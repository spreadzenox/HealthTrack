# Run 08/11 08:35 — idées : deux simulations de personas, Garmin et Samsung (INTEG-1)

**Type** : 💡 idées (pas de code produit ; outillage de simulation seulement). **Branche** : `auto/run-0835`.
Aucune PR « [Auto] » ouverte, CI de main verte (be3409a, #826). Pas de nouvelle correction du propriétaire dans le prompt.

## Ce qui a été fait
1. **Deux simulations (décision C)**, tirées au sort : « Tout mesurer », Android seul, J1 ; « Stressé et pressé »,
   Samsung + Galaxy Watch, J14. Rapports, 15 captures et [synthèse](../simulations/2026-11-08-0835-synthese.md).
2. **Outil corrigé** (trois faux constats vérifiés) : nom de source réaliste par matériel au lieu de « Gadgetbridge » ;
   la Galaxy Watch n'a plus FC au repos, température ni respiration ; navigateur en `LANG=fr_FR` (le champ heure du
   repas sortait en « 11/08/2026, 08:37 AM », vérifié en capture : « 08/11/2026 08:37 »). 2 tests ajoutés.
3. **Vrais constats → BACKLOG** : POLISH-SIM-10 (« Ce qui pèse » liste aussi des effets favorables, sans unité),
   11 (habitude de sommeil 7 h 19 / 7 h 17), 12 (PDF depuis Agir), 13 (pointillé de Tendances), SIM-2 élargi (ligne
   Sommeil inerte, « Pas · hier »), SIM-5 confirmé.
4. **INTEG-1 (B)** : `protocoles/garmin-samsung.md` : ce qui arrive par Health Connect, ce qui manque, Samsung Health
   Data SDK (lecture sur le téléphone, enregistrement par Samsung), Garmin (clé personnelle en lecture par le
   téléphone ; Starter en push = stockage serveur, donc accord HDS), rétro-ingénierie Garmin écartée (coexistence).
   Ordre proposé au propriétaire (§ 4). Sources datées.

## Vérifications
- `npx vitest run scripts/persona/personaData.test.mjs` : 7 verts ; `npm run test` : voir la PR.

## Suite
- Run de code suivant : corrections du propriétaire du 08/11 s'il y en a, sinon POLISH-SIM-10 et 11 (petits, sûrs).
- Run « idées » de 20 h : deux simulations avec l'outil corrigé ; lire la documentation Garmin du niveau personnel.

# Run 09/11 14:35 — Note de bien-être : la phrase expliquée

**Type** : code (mode polish) — POLISH-SIM-26.

## Contexte
- Aucune PR « [Auto] » ouverte ; dernier « Build & Release » de main vert (#864). Gel Alpha jusqu'à 22:00 : pas touché.

## Fait
- Persona « Stressé et pressé » (09/11 08:35) : « Elle propose des précisions, elle n'est pas gardée. » — « qui
  "elle" ? ma phrase est perdue ? ». La ligne sous « En une phrase » dit maintenant : « Halcya en tire une note et des
  précisions à vous proposer ; la phrase n'est pas enregistrée. » (vrai : `readPhrase` ne fait que proposer, la phrase
  n'est jamais enregistrée, I119).
- Test `WellbeingPrompt.test.jsx` rouge puis vert. Nouveautés : `2026-11-09-1435-phrase-bien-etre.json`.
- Captures (variante play, `--click="Bien-être > Note 4 sur 5"`) :
  `runs/captures/2026-11-09-1435-phrase-bien-etre-{clair,sombre}.png`.

## Relevé en passant
- L'outil visuel signale en clair un contraste de 3,72:1 sur le chiffre de la note choisie (« 4 » vert sur fond vert
  pâle). Ajouté au BACKLOG (POLISH-CONTRASTE-NOTE), pas corrigé ici.

## Vérifs
- `npm run test` (3 335 verts), `npm run build`, `npm run lint` (0 erreur), `npm run visual` (18 pages ok).

## Suite
- POLISH-SIM-27 (« Automatique » → « Modérément actif (d'après vos pas) »), 28, POLISH-CONTRASTE-NOTE.

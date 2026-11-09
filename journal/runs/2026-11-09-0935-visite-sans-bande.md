# Run 09/11 09:35 — Visite guidée sans bande blanche

**Type** : code (mode polish) — POLISH-SIM-20, POLISH-SIM-21.

## Contexte
- main vert (#858 : Tests, Build & Release, Play — AAB, émulateur A56), aucune PR « [Auto] » ouverte. Gel Alpha jusqu'à 22:00 (pas touché).

## Fait
- **Cause** de la bande blanche (POLISH-SIM-14 puis 20) : au passage « Voir dans 14 jours », `.tour-curtain` (couleur du
  fond, glisse vers le bas en 1 s) était rendu après le voile, donc peint au-dessus de lui. L'outil des personas capture
  600 ms après un geste : en plein milieu du rideau.
- **Correctif** : le rideau est rendu avant le projecteur/voile (`GuidedTour.jsx`), même contexte d'empilement sans
  z-index : l'écran se remplit sous le voile. Test `GuidedTour.test.jsx` (ordre DOM) rouge puis vert.
- **POLISH-SIM-21** : « jour 10 » au lieu de 14 = capture à 600 ms d'un compteur de 900 ms. `persona-browse.mjs` attend
  désormais que le rideau disparaisse avant la capture.
- Captures à 450 ms (milieu) et à la fin : `runs/captures/2026-11-09-0935-visite-{avant,apres}-light-milieu.png`,
  `…-apres-light-fin.png` (« jour 14 »). Vu au passage, non traité : l'étiquette « Exemple » chevauche le mot « Halcya »
  de l'en-tête (déjà le cas avant).

## Vérifs
- `npm run test` (3 331 verts), `npm run build`, `npm run lint` (0 erreur, comme avant), `npm run visual` (toutes les pages ok).

## Suite
- POLISH-SIM-22 (VFC nuit sans « d'habitude »), puis 23, 24.

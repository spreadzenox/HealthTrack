# Run 12/11 09:35 — Bloc digestion : un titre qui dit vrai (POLISH-SIM-52)

**Type** : code (mode polish).

## Contexte
- Main f983a8d (#932) vert ; aucune PR « [Auto] » ouverte (seule la #51, hors routine).
- Constat le plus fort des personas de 08:35 : « Vos analyses digestives sont prêtes » ouvrait un écran qui dit
  « Aucun lien assez net pour l'instant ».

## Fait
- Test d'abord (`DigestBlock.test.jsx`, rouge puis vert) : 30 jours notés, résumé d'Analyses sans piste digestive →
  « Analyses digestives : aucun lien net pour l'instant » ; Analyses jamais ouvert (aucun résumé) → « Voir vos analyses
  digestives ». « … sont prêtes » seulement quand le résumé a au moins un lien repas → digestion. Le lien mène toujours à
  Analyses › Digestion.
- Nouveautés : `2026-11-12-0935-analyses-digestives-titre.json` (correctif).

## Vérifs
- `npm run test` (3465 verts), `npm run lint`, `npm run build`.
- `npm run visual -- --play --routes=/ --gut-links --pistes-summary` (clair : « aucun lien net ») et `--dark --gut-links`
  sans résumé (« Voir vos analyses digestives ») ; captures lues :
  `runs/captures/2026-11-12-0935-digest-aucun-lien-clair.png`, `…-digest-sans-resume-sombre.png`.

## Suite
- POLISH-SIM-60 (VFC Samsung), 53 (sens du « + »), 54 (Calme / Gêne / Douleur ↔ note sur 5), puis 58 et 59 à vérifier.

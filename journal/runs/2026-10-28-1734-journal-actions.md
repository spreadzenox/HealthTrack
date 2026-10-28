# Run du 28/10/2026 17:34 (Paris, CET) — Actions du Journal derrière « ⋯ » (POL-PLAY-27)

**Type** : 🎨 UI (variantes play et sideload, code commun avec l'app iPhone)

## Constat au démarrage
- Main à `037a111` (#477), v342 verte (Build & Release, Play — AAB, Tests, émulateur). Aucune PR « [Auto] » ouverte
  (PR #51 `cursor/*` hors routine, non touchée).

## Fait (POL-PLAY-27)
- **Journal › Jours** : chaque saisie n'affiche plus « Refaire · Modifier · Supprimer » en permanence ; un bouton
  « ⋯ » (44 px, `aria-label` « Actions pour ce repas », `aria-expanded`) les déplie, « ✕ » les replie. Replié, le
  « ⋯ » reste au bout de la dernière ligne du contenu (`.entry-card-row-closed`), sans ligne à lui. Même geste pour
  le groupe de cigarettes. Ouvrir « Modifier » referme les actions. Les saisies importées (sans action) n'ont pas de
  « ⋯ ». Aucune donnée touchée.
- **Tuile Météo** du résumé du jour : pastel lilas (« ce qu'on fait et ce qui entoure la journée ») au lieu du fond
  neutre, qui paraissait noir en thème sombre.
- **Accueil, tuile Sommeil** : « cette nuit » (nuit rangée au jour du réveil), « nuit d’avant » quand elle reprend
  la veille, comme VFC et Pas disent « hier ».

## Tests
- `today.test.js` : « cette nuit » / « nuit d’avant » (échouait avant) ; `journalChips.test.js` : chaque tuile a un
  pastel, Météo lilas (échouait avant) ; `Journal.test.jsx` : nouveau test du « ⋯ » (replié par défaut, une seule
  saisie s'ouvre, « Fermer les actions ») et tests existants passés par le « ⋯ ».

## Vérifications
- `npm run test` : vert (2 625) ; lint 6 erreurs (inchangé) ; build OK.
- `npm run visual -- --play` : `/` et `/journal` en clair et `--dark`, `/journal --click="Actions pour ce repas"`
  (déplié : Refaire · Modifier · Supprimer · ✕ sur une ligne) : relus.

## Demandes iOS
- Note de Nouveautés commune (Journal et Accueil partagés avec l'app iPhone) : pas de `variants`.

## Suite
- POL-PLAY-28 (titre Health Connect sur 2 lignes, carte visage au déverrouillage quand `faceUnlockPlay`).

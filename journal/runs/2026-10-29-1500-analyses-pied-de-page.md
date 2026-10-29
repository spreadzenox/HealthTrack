# Run du 29/10/2026 15:00 (Paris, CET) — Analyses : légende « visage » et pied de page (POL-PLAY-42)

**Type** : 🎨 Code (polissage de la version play, POL-PLAY-12 : audit écran par écran)

## Constat au démarrage
- Main à `fd119c7` (#502), tous les workflows verts ; aucune PR « [Auto] » ouverte (PR #51 `cursor/*` non touchée).

## Audit
- `npm run visual -- --play --routes=/recommendations --gut-links=lactose` (démo, clair puis sombre), 3 captures relues.
- Défaut 1 : « Autres liens repérés » commence par « Étiquette « visage » : lien repéré avec votre bien-être estimé
  par la caméra (30 jours). » alors qu'aucun lien affiché ne porte l'étiquette (le visage n'y est qu'une ligne « Se
  retrouve aussi avec votre bien-être estimé ») : légende orpheline.
- Défaut 2 : « Comment c'est calculé » en lien vert gras aligné à gauche, sous une mise en garde centrée en gris
  (retour 7 du 24/10 : « en tout petit tout en bas »).

## Fait (POL-PLAY-42)
- `Recommendations.jsx` : la légende ne s'affiche qu'au-dessus d'une liste qui montre l'étiquette (liens nets) ; si
  seuls des liens incertains la portent, elle va dans « Voir les liens incertains ».
- `Recommendations.css` : résumé de la note de méthode du pied de page centré, gris (`--text-muted`), sans gras ;
  aligné à gauche une fois ouvert.

## Tests
- Nouveau test page (VFC liée aux notes et au visage : lien « notes » gagnant, ligne « aussi », pas de légende) ;
  il échouait avant la correction. Test existant (lien « visage » → légende) inchangé et vert.

## Vérifications
- `npm run test`, `npm run build` OK, `npm run lint` 6 erreurs (comme avant), `npm run visual` (voir PR) ; captures
  Analyses play démo claire et sombre relues après correction.

## Demandes iOS
- Rien de propre à Android : note de Nouveautés sans `variants`.

## Suite
- POL-PLAY-12 : poursuivre l'audit (Réintroduction et Rapport PDF en premium, `--subscription=launch`).

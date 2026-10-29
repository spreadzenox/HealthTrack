# Run du 29/10/2026 20:33 (Paris, CET) — Idées : campagne des testeurs et accès à la production

**Type** : 💡 Idées (run de 20 h : pas de code produit)

## Constat au démarrage
- Main à `1be63e2` (#508), tous les workflows verts (Tests, Build & Release, Play — AAB, émulateur A56). Aucune PR
  « [Auto] » ouverte (PR #51 `cursor/*` non touchée).
- Les testeurs arrivent au plus tôt la semaine prochaine (décision du 27/10) ; P30 (formulaire d'accès à la
  production) était annoncée « à préparer au jour 10 » sans brouillon : sujet choisi.

## Fait
- Aide officielle de la Play Console lue (answer/14151465) : 12 testeurs, 14 jours sans interruption, retour à zéro
  par testeur qui quitte puis revient ; formulaire en 3 parties, 10 questions ; conseils (canal de retour, répondre,
  corriger ; « Supprimer » perd les réponses). Causes de refus rapportées par des sources tierces (engagement, réponses
  vagues, plantages).
- `INVITATION-TESTEURS.md` : date de fin en champ à remplir (`<date de fin de la période de lancement>`) au lieu du
  20 novembre ; formule de recalage (invitation + 14 + 10 jours) ; §4 « Missions des 14 jours » (4 messages) ; §5
  brouillon des 10 réponses en anglais, champs `<…>` à remplir au jour 12.
- `PRODUIT.md` : P30 dans les actions du propriétaire ; §4 bis « Changements faits pendant le test fermé » ;
  historique. `IDEES.md` : I194. `BACKLOG.md` : TF-1, TF-2. Résumé de la semaine : encart et action 2 complétée.

## Vérifications
- Journal seul : `npm run test` vert (2 698 réussis, 44 ignorés).

## Demandes iOS
- Aucune concernée (rien de visible dans l'app).

## Suite
- Runs de code : POL-PLAY-12 (Tendances play vierge sombre) ; POL-PLAY-11 quand Android vitals le permet ; TF-1 dès
  que le propriétaire donne la date d'invitation.

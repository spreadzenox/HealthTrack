# Run du 03/11/2026 08:35 (Paris, CET) — Idées : ce qui fait refuser l'accès à la production

**Type** : 💡 idées (journal seul, aucun code produit)

## Constat au démarrage
- Main à `1068795` (#648) ; aucune PR « [Auto] » ouverte (seule la #51, hors routine, n'est pas touchée) ; aucun run
  en cours. Priorités du 02/11 livrées ou en attente du propriétaire (Alpha 100721 en examen, invitation P41, P37).
- Demandes reprises : compte rendu du 02/11 (testeurs, `until`), fin iPhone au 06/11 (rien à faire avant le bilan
  du 07/11), montre du 21/10 (confirmations GT 6 Pro attendues), règle SLOP (31/10) pour les textes proposés.

## Fait
- Veille sur les refus d'accès à la production après le test fermé (aide Google 14151465 relue, retours de
  développeurs 2026) : **I212**. Deux causes officielles (moins de 12 inscrits, engagement insuffisant) ; un refus
  recommande 14 jours de test de plus, ce que la marge de `until` (27/11) ne couvre pas.
- `BACKLOG.md` : section « Test fermé en cours » (TEST-ALPHA-1 vers le 07–08/11, TEST-ALPHA-2 vers le 12–13/11,
  TEST-REFUS). `PRODUIT.md` : **P42** (un clic « Play — AAB » piste alpha, deux fois pendant le test, puisque l'envoi
  sur Alpha est refusé à la session) et ligne d'historique.
- Vérifié dans le code : « Votre avis » (version Play) ouvre la fiche du Play Store, où les testeurs ont les
  commentaires privés au développeur ; les notes de version alpha viennent des « Nouveautés » (500 caractères).

## Vérifications
- Journal seul ; `npm run test` (app) et `npm test` (relais) lancés avant la PR (garde-fou).

## Demandes iOS
- Aucune. Aucune note de Nouveautés (rien de visible dans l'app).

## Suite
- Jour de l'invitation à confirmer (recaler `until` si J ≠ 03/11) ; accord du propriétaire sur le recalage d'office
  en cas de refus ; TEST-ALPHA-1 vers le 07/11 ; 07/11 : bilan du relais pour l'iPhone ; GOLD-a3 attend P37.

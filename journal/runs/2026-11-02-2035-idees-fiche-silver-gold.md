# Run du 02/11/2026 20:35 (Paris, CET) — Idées : fiche Play et abonnements aux noms Silver / Gold

**Type** : 💡 idées (journal seul, aucun code produit)

## Constat au démarrage
- Main à `a9e661b` (#635) ; « Build & Release », « Play — AAB », tests et émulateur verts ; aucune PR « [Auto] »
  ouverte (seule la #51, hors routine, n'est pas touchée).
- Demandes reprises : I6-RELAIS (01/11 17:10) livré sauf 5e (attend P38) ; GOLD-a3 attend P37, GOLD-b6 attend P36 ;
  montre (21/10) en attente de confirmation sur la GT 6 Pro ; règle SLOP (31/10) appliquée aux textes proposés.

## Fait
- Relu la fiche Play (`app/store/listing/fr-FR`) et les produits Play (`subscriptions.mjs`) face aux libellés de
  l'app : **défaut** — la fiche ne connaît que « Premium » (10 analyses par jour, Gold absent) et le produit Silver
  s'appelle « Halcya Premium » dans la feuille d'achat de Google, alors que l'app dit « Silver ». `IDEES.md` **I209**
  (texte de remplacement prêt), **I210** (description courte avec « SII, FODMAP », 80 caractères).
- Veille des règles Play (page officielle des échéances) et de la vérification des développeurs : **I211**, Halcya
  non concernée par les échéances de 2027 ; aucune date pour l'UE ; P-SIDELOAD-KEY reste à faire avant 2027.
- `BACKLOG.md` : **LISTING-2** (run de code court, avant la version candidate). `PRODUIT.md` : ligne du jour.

## Vérifications
- Journal seul ; `npm run test` (app) et `npm test` (relais) lancés avant la PR (garde-fou).

## Demandes iOS
- Aucune. La fiche App Store (routine iOS) devra reprendre les mêmes noms Silver / Gold : à signaler quand LISTING-2
  sera livré. Aucune note de Nouveautés (rien de visible dans l'app).

## Suite
- Prochain run de code : LISTING-2 (fiche + produits + tests-gardes), puis POL-PLAY-12.

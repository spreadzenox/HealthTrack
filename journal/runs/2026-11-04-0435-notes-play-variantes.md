# Run du 04/11/2026 04:35 (Paris, CET) — Notes de version Play filtrées par variante

**Type** : 🔧 code (chaîne de publication)

## Constat au démarrage
- Main à `a0e946f` : Tests, Build & Release v480, Play — AAB et émulateur verts. Aucune PR « [Auto] » ouverte.
- Priorités du prompt : compte rendu du 02/11 et fin iPhone livrés ; P37, P42, P43, P44 attendent le propriétaire ;
  TEST-ALPHA-1 prévu le 07–08/11.
- Tentative de relancer « Relais — déploiement » à la main pour relire le bilan des robots (INSTALLS-21b) :
  **refusée à la session** (garde-fou « déploiement en production »). Rien contourné ; le bilan sera relu au prochain
  déploiement déclenché par un merge sur `relay/`, ou par le clic du propriétaire.
- Demandes iOS : `DEMANDES.md` de HealthTrack-iOS non relu (accès refusé à la session, comme au run précédent).

## Fait
- En préparant TEST-ALPHA-1 (notes de version que verront les testeurs à la mise à jour Alpha), relu
  `buildReleaseNotes` (`scripts/play/publish.mjs`) : il prenait les titres de **toutes** les Nouveautés, sans
  regarder `variants`. Aucune note réservée à la sideload aujourd'hui (35 notes portent `["play"]` ou
  `["play", "sideload"]`), mais une future note « sideload » (clé Gemini, mise à jour par le bouton) serait partie
  dans les notes du Play Store. TDD : test « écarte les notes réservées à une autre variante » (rouge) → filtre
  `variant = 'play'` comme `changelogFor`.
- Notes que produirait l'envoi suivant (vérifié en local) : 12 titres, de « Pistes : une barre qui se voit en sombre »
  à « « 1er » et « 21e » dans la bonne police » ; rien de propre à la sideload ni à l'iPhone.
- Pas de note Nouveautés : rien ne change dans l'app.

## Vérifications
- Voir « Après les vérifications ».

## Suite
- TEST-ALPHA-1 (07–08/11, clic P42) ; FIN-LANCEMENT-MSG vers le 24/11 ; P37, P43, P44 en attente du propriétaire ;
  INSTALLS-21b : relire le bilan des robots au prochain déploiement du relais.

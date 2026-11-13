# 2026-11-06 08:00 UTC — reprise après le blocage de GitHub (TestFlight 830.323, captures iPhone envoyées)

**Étape** : suivi d'Android, fiche  ·  **PR** : #325 (captures), journal  ·  **Android suivi** : v830 (`1e39212`)  ·
**iOS** : 830 sur TestFlight (830.323) ; version 717 dans App Store Connect, build 717.216 attachée  ·  **Parité** :
67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf (dernière décision : 05/11 vers 23:00) ; pas de réponse écrite au message sur la
  facturation, mais GitHub relance les jobs : les « Tests » d'Android passent depuis 07:49 UTC (ceux de 06:40, relancés,
  aussi).

## Reprise
- Relancés (« Re-run failed jobs », jobs jamais démarrés) : TestFlight 42175104845 → **830.323** (08:09 UTC) ; modèles
  du visage → vert ; build simulateur de `462dd97` → en cours à la fin du run ; contrôle de la fiche de #325 → vert.
- #325 remise à jour sur `main` (merge), contrôle vert, mergée.
- `store-push.yml` avec « captures » (run 42185768940) : version 717 gardée (717.216), fiche fr-FR mise à jour,
  **8 captures iPhone 6,9" envoyées dans l'ordre de `captures.md`** ; chez Apple : 4/8 traitées, 4 en cours, 0 refusée
  (iPad : 8/8, les anciennes).
- Captures iPad 13" relancées sur `main` (`db9cb04`, run 42185050080) : à regarder puis envoyer (« captures_ipad »).
- Message urgent retiré de `POUR-ORCHESTRATEUR.md` et du résumé (blocage levé).

## Fin du run (08:55 UTC)
- Captures iPad 13" (`db9cb04`, v830, build 830.326) regardées sur une planche des 8 : colonne centrée, rien de coupé,
  onglets visibles, ni mot d'Android ni erreur JS. #328 (`captures.md`) : contrôle vert, mergée ; anciennes sur
  `captures/store-ipad-0211`.
- `store-push.yml` avec « captures_ipad » (run 42189873598) : 8 envoyées ; chez Apple, iPad 5/8 traitées (3 en cours),
  **iPhone 8/8 traitées**, 0 refusée ; version 717 gardée.

## Android depuis le run précédent
- Rien : dernier commit de `main` `1e39212` (v830).

## Suite
- Captures iPad : regarder, mettre `captures.md` à jour, envoyer ; relire l'état des captures iPhone (8/8 traitées).
- Suivi d'Android ; fin de journée : build finale (renommage + `attacher_build`), numéro au propriétaire.

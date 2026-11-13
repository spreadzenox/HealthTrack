# 2026-11-06 02:00 UTC — fin du suivi de v825 ; la fiche sait attacher la build finale

**Étape** : I9 publication  ·  **PR** : `store-push` + journal  ·  **Android suivi** : v825 (`87a5410`, inchangé)  ·
**iOS** : 825 sur TestFlight (825.318) ; version 717 dans App Store Connect, build 717.216 attachée  ·  **Parité** : 67 %

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf (dernière décision : 05/11 vers 23:00).

## Fin du run précédent (v825)
- #318 mergée après ses trois vérifications (25 écrans de démo, sans texte d'Android ni erreur JS ; onglets Bien-être et
  Ventre regardés, colonnes des semaines visibles) ; **825.318** partie seule sur TestFlight ; fiche renvoyée.
- Abonnements relevés à nouveau (01:04) : toujours `MISSING_METADATA` (question au propriétaire en cours).

## Ce qui a été fait
- `scripts/store-push.mjs` : option `--attacher-build` (et entrée `attacher_build` de `store-push.yml`) : après le
  renommage éventuel, attache à la version la plus récente build **valide, non expirée, du même numéro** (`latestBuild`,
  test d'abord, rouge puis vert : 11 tests sur 11) ; ne soumet rien. Répond à la décision du propriétaire du 05/11 vers
  23:00 (« renommez-la et donnez-lui la build finale avant la soumission »).
- README (lignes de 02:00 et 03:00, heure de Paris ; tableau), BACKLOG (825.318 ; marche à suivre de la build finale).

## Suite
- Fin de journée du 6/11 : `store-push.yml` avec `version_des_builds` et `attacher_build` sur la dernière version
  suivie ; numéro exact au propriétaire (`POUR-ORCHESTRATEUR.md`).

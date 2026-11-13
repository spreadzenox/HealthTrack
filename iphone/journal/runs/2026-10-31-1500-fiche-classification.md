# 2026-10-31 15:00 UTC — 648 sur TestFlight ; fiche App Store complète (captures, numéro 648, catégorie, âge)

**Étape** : I9 (fiche)  ·  **PR** : #130 (catégorie et âge), #132 (état des captures), mergées ; journal  ·  **Android suivi** : v648 sur `main` (v650 pas encore publié sur Google Play)  ·  **iOS** : 648 sur `main` et sur TestFlight (648.128)  ·  **Parité** : 48 % (23/48)

## Messages du propriétaire depuis le run précédent
- Aucun. A6 et version d'iOS de l'iPhone 12 attendus.

## Ce qui a été fait
- **Envoi TestFlight de la 648** (run 41212310775, `main` 7ed9849) : réussi, build **648.128**, la première avec le
  correctif de la VFC de l'Apple Watch.
- **Android** : v649 (#565, journal) et v650 (#566, Nutrition : barres « incertain » hachurées) sont sur `main`
  d'Android, mais « Play — AAB » n'a pas encore réussi pour eux : `--latest` reste sur v648. Rien à suivre ce run.
- **PR #130 : catégorie et classification par âge envoyées par l'API.**
  - `classification.json` : catégorie principale `HEALTH_AND_FITNESS` ; questionnaire d'âge au plus prudent
    (santé et bien-être ; informations médicales « fréquentes » pour la réintroduction et le rapport au médecin ;
    tabac « fréquent » pour le relevé des cigarettes ; tout le reste à non) ; âge forcé à 18 ans et plus.
  - Envoi : `store-push.mjs`, après la fiche (`PATCH appInfos` pour la catégorie, `PATCH ageRatingDeclarations`).
  - Noms et valeurs admises relevés dans la documentation de l'API ; 1 test rouge avant ; README de la fiche :
    réponses à relire par le propriétaire avant la soumission.
- **#130 mergée** après `store-check` vert.
- **Captures 6,9" de la fiche** (run 41212312731, `main` 7ed9849, Android v648, build 648.128) :
  - 8 fichiers en 1320 × 2868 ; aucun mot d'Android, aucune erreur JavaScript ;
  - Sources regardée : sous l'Apple Watch, « Jamais reçu en 30 jours : SpO₂ » seulement ; Accueil regardé ;
  - les six autres sont identiques au pixel près à celles de la v642, regardées une à une au run de 13:00 ;
  - `captures.md` à jour (date, version, temps d'écran sur la capture de Sources).
- **Fiche complète envoyée** (`store-push.yml` avec « captures », run 41214456732, `main` 00ce044) :
  - version « 1.0 » renommée **648** ; textes fr-FR mis à jour ;
  - **8 captures envoyées** dans l'ordre de `captures.md` ;
  - nom, sous-titre et confidentialité ; catégorie Santé et forme ; âge 18+.
  - Rien n'est soumis.

## Fin du run
- **PR #132 mergée** : `store-push.mjs` lit l'état de chaque capture chez Apple (traitée, en cours, refusée avec la
  raison) ; après un envoi de captures, il attend la fin du traitement ; une capture refusée fait échouer l'envoi.
  1 test rouge avant.
- Envoi sans captures (run 41214750833, `main` 7ac18c9) : **7 captures sur 8 traitées par Apple, 1 en cours, aucune
  refusée** ; fiche, catégorie et âge réécrits à l'identique.

## Suite
- Au prochain envoi de la fiche : confirmer la 8e capture traitée (l'envoi l'affiche désormais).
- Android v650 dès sa publication sur Google Play (barres « incertain » hachurées de Nutrition).
- Le reste attend le propriétaire : A6 (iPhone 12), version d'iOS de l'iPhone 12, décisions (sauvegarde iCloud,
  identifiant d'installation, AffectNet).

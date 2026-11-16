# Run 16/11 15:30 — Outil de personas « mise à jour depuis la version des testeurs » (REFONTE-UPG-0)

**Type** : run de code (outillage, aucun code de l'app)  ·  **Android** : main vert (release de #1040 publiée) ;
v756+ inchangée par ce run  ·  **TestFlight** : 1107.1107 chez « Testeurs Halcya » (inchangé ; la build du soir sera
ajoutée après l'Alpha de 23:45)  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions conforme (69177875…). Les quatre fichiers lus en entier.
- main vert (Tests, Build & Release, émulateurs, Play — AAB, Play — fiche du Store sur 62446e4).
- PR de la routine ouverte : **#1041** (7d-4, run de 14:30), 13 checks verts, **build iOS encore en cours** (lancée
  à 13:42 UTC) : pas mergeable dans ce run, à finir au run suivant (captures d'Objectifs sur `captures/pr-1041`).
  Ce run ne touche aucun de ses fichiers. #51 (cursor) pas touchée.

## Fait
1. **REFONTE-UPG-0** : `persona-browse.mjs --legacy` (jour > 1) rejoue un testeur d'avant la refonte : accueil fini
   dans l'ancienne version (objectifs de `--goals`, sans `goalsVersion`, donc la migration 5a tourne au lancement),
   Nouveautés lues jusqu'au 14/11 (`legacyLastSeen`), un essai d'Agir en cours (`legacyTrial`, jour 4 sur 10, format
   de `createTrial`), aucune habitude. 3 tests ajoutés (rouges puis verts) dans `personaData.test.mjs` ; doc dans
   `simulations/README.md`.
2. Premier passage à la main (J45, montre Health Connect, objectifs `sport,cycle`) : Accueil, Objectifs, « Votre
   bien-être », Agir, Ma journée. Aucune erreur. L'essai est intact dans Agir ; « Règles » reste dans le bandeau
   d'ajout ; Objectifs montre Bien-être (3,1/5) et Confort digestif.

## Repéré (BACKLOG, REFONTE-UPG)
- **UPG-1** : la carte « Agir » du bas de l'Accueil dit « Vérifier une piste par un essai » alors qu'un essai tourne ;
  avant la refonte, Agir avait son onglet. Le testeur ne voit plus son essai sans descendre et ouvrir la carte.
- **UPG-2** : le bandeau des Nouveautés titre « Nouvelle police et fond crème et 17 autres changements »
  (`WhatsNewBanner` prend la dernière note) ; pour ce testeur, la nouvelle à lire est la navigation à 4 onglets.
- Artefact de l'outil, pas de l'app : « Gold offert jusqu'au 6 déc. » vient du relais simulé (+20 jours).

## Vérifications
- Suite Vitest complète, build : voir la PR. Aucun fichier de `app/src/` touché, pas de build iOS nécessaire.

## #1041 : build iOS rouge, relancée
- « Build iOS (simulateur) et captures » de #1041 a fini à 14:45 UTC en **échec** à l'étape « Achat d'essai App Store
  (StoreKit Test, I6) » : `StoreKit Test : transaction non vérifiée (halcya_premium_mensuel) : invalidCertificateChain`
  (`AppStoreBillingTests.swift:90`). La PR ne touche ni StoreKit ni le Swift ; la même étape est verte sur main
  (09f448e, 12:31 UTC) et sur les 5 builds précédentes ; même panne intermittente déjà vue le 30/10 (#77, verte en
  relance). Le test UI `testEnregistrerLeRapportDansFichiers` (« Créer le PDF » introuvable) échoue aussi mais n'est
  pas bloquant. **Job relancé à 15:45** (pas d'étape assouplie). Si la relance est rouge au même endroit : traiter
  `invalidCertificateChain` (certificat de test StoreKit du simulateur) comme un vrai défaut avant tout merge.
- Si `invalidCertificateChain` revient sur une 3e PR, ouvrir une étape iPhone au BACKLOG (fiabiliser la chaîne de
  certificats de StoreKit Test, ou dire « échec de l'environnement » à part d'un vrai échec d'achat).

## Suite
- Run suivant : merger #1041 après sa build iOS relancée (captures d'Objectifs), puis #1042 (rebase sur main), puis UPG-1 et UPG-2 (petits, Android et
  iPhone), puis UPG-3 (passage complet des personas sur les deux parcours) avant le 22/11.

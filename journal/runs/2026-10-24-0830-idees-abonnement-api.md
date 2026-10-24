# 2026-10-24 08:30 Paris (06:30 UTC) — Run « idées » : 6d et 6e prêts à coder

**Type** : 💡 idées (sans code produit)

## Pourquoi
Le prochain run de code est 6d (créer l'abonnement par l'API Play), puis 6e (scénario de bout en bout) : ce sont les
dernières briques du critère C3 de la version candidate. Aucune spécification précise n'existait (I147/I148 restaient
généraux, l'API `monetization.*` n'avait jamais été lue).

## Constat au démarrage
- Main à `023966e` (#312), aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- L'app attend déjà `halcya_premium`, `annuel`, `mensuel` et une phase d'essai gratuite (`playBilling.js`) ; le relais
  gère `grace`, `on_hold`, `paused` (`relay/src/billing.js`) et les Paramètres affichent un message pour chacun.

## Ce qui a été fait
- `IDEES.md` : **I158** (spécification de 6d : GET → création avec `regionsVersion.version=2022/02`, fiche fr-FR
  obligatoire, formules P1Y/P1M en FR, grâce + suspension entre 30 et 60 j, offre `essai-14j` gratuite ciblée
  `thisSubscription`, activation des brouillons, relecture ; module `scripts/play/subscriptions.mjs` + workflow
  `workflow_dispatch`), **I159** (scénario testeur de licence, durées accélérées officielles, 7 cases), **I160**
  (test-garde : aucun prix en dur hors paywall — vérifié : aucun aujourd'hui), **I161** (testeur de licence =
  abonnement arrêté après ~3 h → l'option ② de P23 est indispensable).
- `BACKLOG.md` : 6d, 6e et I160 ajoutés comme étapes ; `PRODUIT.md` : P23 précisée, historique.

## Vérifications
- `npm ci` puis `npx vitest run` : 172 fichiers, 2 104 tests verts (journal seul modifié).

## Apprentissages / décisions
- Identifiants d'abonnement et de formule **immuables** : figés par un test avant tout appel.
- Points non confirmés (❓) : version de régions la plus récente (sources tierces : `2022/02`), prix TTC en France, et
  forme de l'erreur tant que la vérification bancaire n'est pas finie ; droits de gh-deployer pour le catalogue
  (« Gérer la présence sur le Store », d'après des guides tiers).

## Suite proposée
- Run de code suivant : **6d** selon I158 ; puis M4.
- Prochain run idées (20:30) : erreur de 6d si refus, audit `--play --empty` mis à jour, veille prix concurrents SII.

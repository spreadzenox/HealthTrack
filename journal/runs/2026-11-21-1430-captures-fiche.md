# Run du 21/11 14:30 — Captures de la fiche App Store : Agir et Réintroduction comme sur Play

**Type** : 🛠️ (outillage iPhone, pas de code produit) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…),
origin/main d4be953 au départ.

## État de départ
- main vert sur d4be953 (Tests, émulateurs, Build & Release, Play — AAB ; build iPhone de d1e2b79 vert).
- PR « [Auto] » #1172 (DEM-IOS-2, run de 13:30) prête, tous checks verts sauf le build iPhone, en cours depuis 13:09 UTC :
  priorité (b), à merger dès qu'il est vert.
- Série 6,9" de la fiche App Store (run 44904461830, lancée par le run de 13:30) finie et publiée sur `captures/store`.
- Rien de neuf du propriétaire dans le prompt.

## Ce qui a été fait
- **Les 8 captures 6,9" regardées une à une** (1320 × 2868, barre d'état 9:41, aucune erreur) :
  - Accueil clair et sombre : Pilou de jour sur son île, bulles Repas, Digestion, Bien-être ; bien.
  - Tendances (semaine, courbe et « attendu ») et Repas (Photo du repas, repas habituels) : bien.
  - Objectifs : bien-être 3,0/5 ; « Confort digestif : premier score dans 5 jours notés » (démo honnête, gardé).
  - **Agir : « Rien en cours pour l'instant »**, un état vide : ne montre rien du produit.
  - **Réintroduction : seulement l'encart premium « Débloquer »**.
  - **Ma journée : pastilles d'avant `d4be953`** (pleines pour ce qui reste) ; corrigé sur main, la prochaine série le
    montrera.
  La fiche Play évite les deux premiers défauts avec `--trial=8` et `--subscription=gold` (`app/scripts/store/screenshots.mjs`).
- **Mode captures iPhone** (`iphone/overlay/app/src/ios/captureMode.js`) :
  - `TRIAL_ROUTES = ['/agir']` → capture `demo-clair-agir-essai` : un essai du sommeil au jour 8 sur 10
    (`sleepTrialEntry`, le même que `--trial=8` d'Android) posé par `prepare` pour cette seule capture, puis retiré avant
    la page suivante (les sondes et les captures sombres gardent la démo telle quelle) ;
  - `/reintroduction` ajoutée à `SUBSCRIBED_ROUTES` → `demo-clair-reintroduction-abonne` (droits d'abonné factices
    déjà utilisés pour Objectifs, retirés avant la page suivante).
  - Coût : deux captures de plus par build (quelques secondes de Mac).
- `iphone/store/app-store/captures.md` : n° 5 et n° 7 (iPhone) et n° 5 (iPad) pointent sur ces captures ; constat de la
  série écrit sous le tableau. `store-push.test.mjs` suit.
- Série iPad 13" lancée sur main (run 44909299453) puis **annulée** : elle aurait refait le même Agir vide (40 min de Mac
  pour rien). À relancer après le merge.

## Vérifications
- Tests écrits d'abord (3 cas dans `captureMode.test.js`, liste des captures d'abonné dans `subscriptionFake.test.js`) ;
  `scripts/upstream.sh` (49 correctifs, v1232) puis `vitest src/ios` dans `iphone/upstream/app` : 214 verts ;
  `node --test scripts/store-push.test.mjs` : 11 verts ; eslint propre.
- Rien dans `app/` : pas de note de Nouveautés (rien de visible pour l'utilisateur), parité sans ligne à ajouter.

## Suite proposée
0. Merger #1172 quand son build iPhone est vert ; puis cette PR (un build iPhone, captures `-essai` et `-abonne` à
   regarder dans `captures/pr-<N>`).
1. Après le merge, de jour (avant 17:00) : relancer `ios-build.yml` avec `devices: iPhone 17 Pro Max`, puis
   `iPad Pro 13-inch (M5)` (même groupe de concurrence : l'une après l'autre), regarder les 16 captures, puis
   `store-push.yml` « captures » et « captures_ipad », et « 👉 PI2 prête ». Si l'après-midi n'y suffit pas : demain
   matin, dans le temps de l'objectif du 22/11.
2. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45.

## Pour le propriétaire
Rien à faire.

# Run 23/11 06:30 — FUSION-3 : correctif 24 ajouté à #1211, PR passée en « prête »

**Type** : 🔧 run de code (code partagé, rien de visible sur Android) · **Contrôle d'intégrité** : empreinte conforme
(dd430fbd…) · **Android** : main 5cbcfc1 (#1210), release v881 · **TestFlight** : 1268.1268 chez « Testeurs Halcya »,
1244.1244 attachée à la version 893 · **Parité** : 70 % (33/47), 5 correctifs iPhone restent

## Contexte
- main vert sur 5cbcfc1 (Tests, Build & Release, émulateur A56, Play — AAB).
- PR de la routine ouverte : **#1211** (run de 05:30, brouillon, correctif 28), qui attendait le correctif 24 avant son
  build iPhone. #51 (`cursor/*`) pas touchée.

## Fait
1. **Correctif 24 fondu** dans la branche de #1211 : `loadBillingPlugin` (`app/src/services/playBilling.js`) prend le
   plugin StoreKit 2 `AppStoreBilling` sur iPhone (enregistré une seule fois), le faux plugin des captures marche aussi
   dans la build de captures de l'iPhone (`VITE_IOS_CAPTURE`). Rien ne change sur Android : la branche iPhone n'est
   atteinte que si la variante a l'abonnement et que la plateforme est `ios`. `iphone/patches/24-abonnement-app-store.patch`
   supprimé.
2. Tests (TDD : rouges avant le correctif) : les deux tests « plugin natif sur iPhone » passent de
   `overlay/…/playBilling.appstore.test.js` au test commun `playBilling.test.js` (ils ne dépendent pas de la variante
   `appstore`), avec un test Android (toujours `PlayBilling`) et un test sideload (aucun plugin, même sur iPhone).
   L'overlay garde les tests du contrat `describePlans` avec StoreKit 2.
3. **#1211 passée en « prête »** : un seul build iPhone pour 28 et 24.

## Vérifications
- `npm run test` (app) : 401 fichiers verts (3 sautés), 4 376 tests ; eslint propre sur les fichiers touchés.
- `iphone/scripts/upstream.sh` : v1272 (HEAD), 5 correctifs appliqués ; Vitest de `upstream/app` sur facturation,
  distribution, Premium et Nouveautés (dont les tests d'overlay) : 116 tests verts.
- Pas de `npm run visual` : aucun écran Android ne change.

## Suite
1. Run suivant : checks de #1211 (build iPhone), captures iPhone de Nouveautés et Premium (doivent être identiques), merge.
2. FUSION-3 : 38 (App Attest) ou 49 (personas), puis 02 ; 27 attend une décision (lien « Envoyer un avis ») ; 01 en dernier.
3. Vérifier la fin de l'examen bêta de 1268.1268 et le départ de la build du soir.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

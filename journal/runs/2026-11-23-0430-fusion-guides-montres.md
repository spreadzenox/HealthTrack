# Run 23/11 04:30 — FUSION-3 : correctif 16 ajouté à #1210, PR passée en « prête »

**Type** : 🔧 run de code (code partagé, rien de visible sur Android) · **Contrôle d'intégrité** : empreinte conforme
(dd430fbd…) · **Android** : main 7058de4 (#1209), release v880 ; « Play — Alpha » de la nuit parti à 03:09 UTC, vert ·
**TestFlight** : 1268.1268 chez « Testeurs Halcya » (validée), 1244.1244 attachée à la version 893 · **Parité** : 70 %
(33/47), 7 correctifs iPhone restent

## Contexte
- main vert sur 7058de4 (Tests, Build & Release, émulateur A56, Play — AAB, fiche, abonnements, Alpha).
- PR de la routine ouverte : **#1210** (run de 03:30, brouillon, CI économe), qui attendait le correctif 16 avant
  son build iPhone. #51 (`cursor/*`) pas touchée.

## Fait
1. **Correctif 16 fondu** dans la branche de #1210 : guides « Votre montre n’apparaît pas ? » de l'iPhone (par l'app
   Santé ; Samsung sans liste d'étapes vide) dans `app/src/data/watchGuides.jsx` (`IOS_WATCH_GUIDES`, choisis par
   `watchGuidesFor` quand `features.iosStore`) et `WatchGuides.jsx` (introduction « vers l’app Santé », pas de liste
   vide). `iphone/patches/16-guides-montres-iphone.patch` supprimé.
2. Test Android ajouté (`WatchGuides.test.jsx`) : play et sideload ne reçoivent jamais les guides iPhone, l'intro
   Android parle toujours de Health Connect. `watchGuides.appstore.test.jsx` reste dans l'overlay (preuve iPhone).
3. **#1210 passée en « prête »** : un seul build iPhone pour 05, 10 et 16.

## Vérifications
- `npm run test` (app) : 401 fichiers verts (3 sautés) ; eslint propre sur les fichiers touchés.
- `iphone/scripts/upstream.sh` : v1272 (HEAD), 7 correctifs appliqués ; Vitest de `upstream/app` sur les guides
  (dont le test d'overlay `.appstore`) : vert.
- Pas de `npm run visual` : aucun écran Android ne change.

## Suite
1. Run suivant : checks de #1210 (build iPhone), captures iPhone de Sources (guides des montres, carte Visage), merge.
2. FUSION-3 : 28 (Nouveautés iPhone) ou 24 (abonnement App Store) ; 27 attend une décision (lien « Envoyer un avis »
   vers l'ancien dépôt iOS) ; 01 en dernier.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

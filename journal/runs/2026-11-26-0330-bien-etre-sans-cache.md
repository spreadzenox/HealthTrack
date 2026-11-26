# Run 26/11 03:30 — Bien-être stable sans relire l'historique (#1275 refaite)

**Type** : 🔧 (code produit, polish) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) ·
**Android** : main 0553a29 vert (Tests, émulateur A56, Play — AAB, Build & Release) · **TestFlight** : 1313.1313
chez « Testeurs Halcya » ; build du soir du 25/11 et Alpha de 23:45 pas encore partis à 02:40 UTC (la veille :
03:33 et 05:02 UTC) · **Parité** : 70 % (33/47), inchangée (code partagé)

## État de départ
- #1275 (POLISH-SIM-80, run de 02:30) ouverte : 17 checks verts dont le build iPhone, mais **« Budget de lectures
  (perf) » rouge** : l'Accueil lisait 2 056 enregistrements pour 1 500 autorisés (990 sur main). La 1re version
  faisait lire au calcul de secours toutes les notes (bien-être, digestion, selles) depuis le début ; le compte
  rendu de 02:30 disait à tort que la démo ne lirait rien de plus. Seule autre PR ouverte : #51 (`cursor/*`).

## Fait
- Budget non relevé (garde-fou D2 : ne pas relire des années d'historique à chaque ouverture). Correction refaite :
  l'Accueil ne prend plus le résultat en cache de `dayStates` ; `todayWellbeingState` calcule toujours sur les
  entrées déjà lues (depuis la première lecture du visage). Le chiffre ne dépend plus de l'état du cache, donc il ne
  bouge qu'avec une nouvelle lecture ou une note : le symptôme de la persona disparaît.
- Test d'abord : « même chiffre avec ou sans cache » (`faceMoodData.test.js`), rouge sur main, vert après.
- Limite connue, au BACKLOG : **POLISH-SIM-80b**, écart possible d'un dixième entre l'Accueil et Tendances (qui lit
  toutes les notes) ; piste : réutiliser les paramètres du modèle gardés en local.
- Note de Nouveautés corrigée (elle promettait « le même chiffre que dans Tendances »). Journal du run de 02:30
  corrigé (BACKLOG, PRODUIT, résumé, note dans son compte rendu).
- Vérifications : `npm run test` 4 703 verts (44 sautés, comme avant) ; ESLint propre sur les fichiers touchés ;
  `npm run build` vert ; `npm run perf -- --budget` respecté sur les 10 pages (Accueil 990 comme sur main) ;
  `npm run visual -- --routes=/` sans erreur, capture relue (« Pas encore de lecture du visage aujourd'hui » à 3 h
  du matin : attendu).

## Suite proposée
1. Merger #1275 au run suivant si tous les checks sont verts (build iPhone relancé par ce push : correction de ce qui
   bloquait).
2. Vérifier le build du soir, TestFlight et l'Alpha ; soumission bêta et expiration au premier run qui voit la build
   traitée par Apple.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

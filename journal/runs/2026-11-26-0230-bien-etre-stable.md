# Run 26/11 02:30 — Un seul chiffre de bien-être pour la journée (POLISH-SIM-80)

**Type** : 🔧 (code produit, polish) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) ·
**Android** : main 69f7baa vert au départ (Tests, émulateur A56, Play — AAB, Build & Release) · **TestFlight** :
1313.1313 chez « Testeurs Halcya » ; build du soir du 25/11 (cron 21:20) et Alpha de 23:45 pas encore partis à
01:35 UTC (retard habituel du cron : la veille, 03:33 et 05:02 UTC) · **Parité** : 70 % (33/47), inchangée (code
partagé)

## État de départ
- #1274 (POLISH-SIM-76 et 93, run de 01:30) ouverte, prête, à jour sur main, 18 checks verts dont le build iPhone.
  Seule autre PR ouverte : #51 (`cursor/*`, pas à la routine). Pas de réponse du propriétaire.

## Fait
- **#1274 mergée** (squash, 0553a29) après relecture du code et de la capture iPhone d'Objectifs (démo claire :
  propre, inchangée ; la nouvelle ligne n'apparaît que sans l'objectif digestion, cas relu sur Android au run
  précédent).
- **POLISH-SIM-80** (persona du 14/11 : « note de bien-être 3, puis 2,9, puis 3 sans saisie ») : cause trouvée.
  « Bien-être aujourd'hui » vient de `todayWellbeingState` : le calcul complet `dayStates` (Objectifs, Tendances)
  s'il est en cache, sinon un calcul de secours sur les notes lues depuis la première lecture du visage. Sans les
  notes d'avant la caméra, le modèle estimait d'autres paramètres : le chiffre changeait selon l'état du cache.
  `loadWellbeingToday` lit maintenant toutes les notes pour ce calcul ; l'estimation du visage et la courbe du jour
  gardent les notes depuis la première lecture, comme avant. Test d'abord (rouge : 2,07 contre 2,05 ; vert après).
- Budget de lectures : la démo du contrôle de perf lit le visage dès le premier jour, donc aucune lecture de plus
  sur l'Accueil ; pour une vraie personne, seulement ses notes d'avant la caméra (une ou deux par jour).
- Vérifications : `npm run test` 4 703 verts (44 sautés, comme avant) ; ESLint propre sur les fichiers touchés ;
  `npm run build` vert ; `npm run visual -- --routes=/` sans erreur de page, capture `dashboard-1.png` relue.
- Note de Nouveautés `2026-11-26-0230-bien-etre-stable.json` (code partagé : vaut pour les deux magasins).

**Correction du run de 03:30** : faux pour la démo du contrôle de perf (2 056 enregistrements lus sur l'Accueil
pour 1 500 autorisés, « Budget de lectures (perf) » rouge). Correction refaite sans lecture de plus : voir
`2026-11-26-0330-bien-etre-sans-cache.md`.

## Suite proposée
1. Merger la PR au run suivant si les checks (dont le build iPhone et le budget de lectures) sont verts.
2. Vérifier le build du soir, TestFlight et l'Alpha ; soumission bêta et expiration au premier run qui voit la
   build traitée par Apple.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

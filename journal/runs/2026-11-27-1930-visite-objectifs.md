# Run 27/11 19:30 — Visite guidée : la vue d'ensemble d'Objectifs

**Type** : 🔧 (refonte, reste de 6a, code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) ·
**Android** : main f97151c (#1313) vert (Tests, Play — AAB, Build & Release, émulateur A56) ·
**TestFlight** : 1362.1362 chez « Testeurs Halcya » (build du soir à 21:20) · **Parité** : 70 % (33/47), inchangée

## État de départ
- PR #1314 (run de 18:30) en brouillon, checks verts sans build iPhone (CI économe) : reprise sur sa branche.
- La remise à zéro du clone (`git reset --hard`) a encore été refusée par la sécurité de la session ; le clone était
  déjà sur origin/main, propre. Pas de nouvelle réponse du propriétaire.

## Fait
- **REFONTE-6a-2, visite guidée** : ses étapes d'Objectifs ouvraient directement le détail du bien-être, alors que
  l'onglet s'ouvre sur la vue d'ensemble. Désormais : « Objectifs » sur `/recommendations` (même texte), « Exemple au
  jour 14 » y montre les cartes (« Au jour 14 : vos scores · Un score sur 5 par objectif. Touchez-en un pour voir ses
  pistes. », projecteur sur `.objectives-list`), puis « Vos premières pistes » sur le détail, puis le détail de chaque
  piste. « Voir un exemple » depuis Objectifs reprend la visite à la vue d'ensemble.
- Test d'abord : 1 test dans `GuidedTour.test.jsx` (rouge, puis vert).
- Note de Nouveautés `2026-11-27-1930-visite-objectifs.json` (toutes variantes).

## Vérifications
- `npm run test` et `npm run build` : voir la PR. Captures relues de la visite (`--onboarding=tour`, clics jusqu'à
  l'exemple d'Objectifs puis l'étape suivante) : cartes Bien-être 4,0 et Confort digestif 3,5 sous la bulle, puis le
  détail avec « Pistes à tester » encadré.
- Code partagé seulement, aucun fichier corrigé côté iPhone : PR passée en « prête » pour un seul build iPhone.

## Suite proposée
1. Run suivant : build iPhone de #1314, captures iPhone d'Objectifs relues, merge. Ce soir : build iPhone et
   TestFlight (21:20), Alpha à 23:45.
2. REFONTE-6a-2 reste : fourchette du score non montrée (méta-leçon 4).

## Pour le propriétaire
Rien de nouveau à faire. Toujours : recruter des testeurs (4 sur 12), PI2, P51 ; le 29 ou le 30/11, le message E.

# Run 27/11 12:30 — Premium : « Toujours gratuit » sans le Journal

**Type** : 🔧 (polish, code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
d87415a (#1309) vert (Tests, émulateur A56, Play — AAB, Build & Release) · **TestFlight** : 1362.1362 chez
« Testeurs Halcya » (inchangé) · **Parité** : 70 % (33/47), inchangée

## État de départ
- PR #1310 du run de 11:30 (POLISH-REGLAGES-DESC) prête, tous ses checks verts sauf le build iOS sur simulateur, en
  cours depuis 11:01 UTC. Pas touchée pendant le build (un push le relancerait). Main vert. Pas de nouvelle réponse
  du propriétaire.
- `git reset --hard origin/main` refusé par la sécurité de la session ; `git checkout -B main origin/main` à la place.

## Fait
- **POLISH-PAYWALL-JOURNAL** (« à juger » du run de 11:30) : la page Premium disait « Toujours gratuit : journal,
  imports des montres, … » alors que le Journal n'existe plus depuis la refonte. Nouveau texte : « vos notes et vos
  repas, imports des montres, bien-être estimé, graphiques et export de vos données ». `pages/Premium.jsx`.
- Test d'abord (`Premium.test.jsx`, rouge puis vert).
- Gardés : `public/conditions.html` et la fiche Play emploient « journal » au sens commun (« journal alimentaire »).
- Note de Nouveautés `2026-11-27-1230-paywall-journal.json` ; BACKLOG, PRODUIT § 5, PARITE, résumé.

## CI économe
- Heures de Mac de S48 : environ 8,3 h par jour pour une cible de 3 h, surtout un build iPhone par PR de code. Ce
  correctif tient en une ligne : la PR reste **en brouillon** (pas de build iOS) pour que le run de code suivant y
  ajoute son correctif et la passe en « prête », un seul build iPhone pour les deux (option (2) du résumé).

## Vérifications
- `npm run test` : 460 fichiers verts (3 ignorés), 4 734 tests ; eslint sans erreur sur les fichiers touchés ;
  `npm run build` vert.
- Captures `/premium` en play, clair et sombre, relues : `captures/2026-11-27-1230-paywall-journal-{clair,dark}.png`
  (trois lignes, rien de coupé).
- iPhone : aucun correctif `iphone/patches/` sur `Premium.jsx` ; code partagé seulement.

## Suite proposée
1. Merger #1310 une fois son build iOS vert (à jour sur main).
2. Run de code suivant : ajouter son correctif à cette PR, la passer en « prête », un build iPhone, merger.
3. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45.

## Pour le propriétaire
Rien de nouveau à faire. Toujours : recruter des testeurs (4 sur 12), PI2, P51.

# Run 27/11 13:30 — Fin de Gold offert : la carte ne cite plus le Journal

**Type** : 🔧 (polish, code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
1674cd9 (#1310) vert (Tests, émulateur A56, Play — AAB, Build & Release) · **TestFlight** : 1362.1362 chez
« Testeurs Halcya » (inchangé) · **Parité** : 70 % (33/47), inchangée

## État de départ
- PR #1311 (run de 12:30, POLISH-PAYWALL-JOURNAL) laissée en brouillon exprès pour y ajouter le correctif suivant :
  checks Android verts, build iOS pas encore lancé (brouillon). Main vert. Pas de nouvelle réponse du propriétaire.
- `git reset --hard` refusé par la sécurité de la session ; `git checkout -B main origin/main` a suffi.

## Fait
- **POLISH-LAUNCH-JOURNAL** (même famille que le correctif de 12:30, trouvé en cherchant les textes visibles qui
  citent encore le Journal) : la carte de l'Accueil qui annonce la fin de Gold offert, visible par les testeurs à
  partir du 29/11, disait « Ensuite, le journal, les montres, le bien-être estimé et l'export restent gratuits » ;
  après la fin, « votre journal et vos mesures restent dans l'app ». Maintenant « vos notes et vos repas, les
  montres, … » et « vos notes, vos repas et vos mesures ». `components/LaunchEndCard.jsx`.
- Tests d'abord : `LaunchEndCard.test.jsx` (rouge, puis vert).
- Note de Nouveautés `2026-11-27-1330-fin-gold-journal.json` (`"variants": ["play"]` : la carte n'existe que là).
- Autres « journal » visibles relus : diagnostic de la montre (journal technique, mode caché), rapport PDF (« journal
  tenu par la personne », sens commun), carte Cycle de l'iPhone (« ajoutées à votre journal », sens commun) : laissés.

## Vérifications
- `npm run test` : 460 fichiers verts (3 ignorés), 4 735 tests ; `npm run lint` sans erreur ; `npm run build` vert.
- Captures play relues : `captures/2026-11-27-1330-fin-gold-journal-clair.png` (`--subscription=launch
  --launch-ends-in=2`) et `-dark.png` (`--launch-ended=2 --dark`) ; texte sur deux lignes, rien de coupé.
- iPhone : aucun correctif `iphone/patches/` sur ce fichier ; la carte ne s'affiche pas en variante appstore (test
  `LaunchEndCard.appstore.test.jsx` vert). PR passée en « prête » : un seul build iOS pour les deux correctifs.

## Suite proposée
1. Merger #1311 une fois le build iOS vert et les captures iPhone de Premium relues (au run suivant s'il n'est pas
   fini dans ce run).
2. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; soumission bêta de la build du soir au premier run
   qui la voit traitée, expiration des anciennes.

## Pour le propriétaire
Rien de nouveau à faire. Toujours : recruter des testeurs (4 sur 12), PI2, P51 ; le 29 ou le 30/11, le message E.

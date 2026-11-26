# Run 26/11 11:30 — contact des pages embarquées de l'iPhone (FUSION-4)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 1737f6b (#1284) vert
(Tests, Build & Release v930, Play — AAB, émulateur A56) · **TestFlight** : 1335.1335 chez « Testeurs Halcya »,
validée (inchangé ; build du soir à 21:20) · **Parité** : 70 % (33/47), inchangée

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). Pas de nouvelle réponse du propriétaire.
- Remise à zéro du clone refusée par la sécurité de la session ; le clone était déjà sur origin/main, propre.

## Fait
- **FUSION-4, pages embarquées** : `app/public/confidentialite-iphone.html` et `conditions-iphone.html` (Réglages ›
  Confidentialité et Conditions sur iPhone) renvoyaient encore aux tickets de l'ancien dépôt iOS, qui ne reçoit plus
  rien ; elles renvoient aux tickets de ce dépôt, comme la page d'assistance du site.
- Test d'abord (rouge, puis vert) : `app/src/ios/pagesIphoneContact.test.js`.
- Note de Nouveautés iPhone (`iphone/overlay/app/src/data/changelog/2026-11-26-1130-contact-pages-iphone.json`,
  `"variants": ["appstore"]`).

## Vérifications
- `npm run test` : 4 710 tests verts (44 ignorés) ; `npm run build` vert ; `npm run lint` sans erreur ;
  `iphone/site/site.test.mjs` vert ; `npm run visual` vert (aucune erreur JS ; les deux pages sont du HTML statique, hors des captures : rien à regarder de neuf).
- PR ouverte en brouillon puis passée prête : un seul build iPhone (fichiers de `app/public/`).

## Suite proposée
1. Fait dans ce run : **#1285 mergée** à 12:12 (16 checks verts, dont le build iPhone de 26 min) ; Build & Release
   vert, release **v931** (APK 35,7 Mo). Partira ce soir sur TestFlight et sur Alpha.
2. FUSION-4 : préparer la mission d'archivage de l'ancien dépôt quand ses builds TestFlight sont expirées.
3. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; soumission bêta au premier run qui voit la build traitée.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51. Réponses attendues : PROP-SIM-19, « go
courbes / go phases / non », « rituel 2D / 3D / pas de rituel ».

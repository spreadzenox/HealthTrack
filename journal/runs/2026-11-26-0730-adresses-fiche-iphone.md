# Run 26/11 07:30 — Adresses de la fiche App Store sur le site de ce dépôt (FUSION-4, suite)

**Type** : 🔧 (fiche App Store et page d'assistance ; aucun code de l'app) · **Contrôle d'intégrité** : empreinte
conforme (dd430fbd…) · **Android** : main c7da489 vert (Tests, émulateur A56) · **TestFlight** : 1335.1335 chez
« Testeurs Halcya », validée (inchangé) · **Parité** : 70 % (33/47), inchangée

## État de départ
- main c7da489 (journal de 06:30) vert ; aucune PR de la routine ouverte (seule #51, `cursor/*`).
- Suite proposée par le run de 06:30 : changer les adresses de la fiche App Store. Les 4 pages
  `https://spreadzenox.github.io/HealthTrack/iphone/…` répondent 200 (revérifié), l'ancien site aussi.

## Fait
- Test d'abord (rouge, puis vert) dans `iphone/scripts/store-push.test.mjs` : adresses attendues
  `…/HealthTrack/iphone/confidentialite/` et `…/assistance/`, et plus aucune adresse `github.io/HealthTrack-iOS` dans
  la description, les notes pour l'examen, `confidentialite.md`, `testflight-externe.md`, `store/app-store/README.md`,
  ni de lien vers le dépôt iOS dans la page d'assistance.
- `store-push.mjs` : `SITE = https://spreadzenox.github.io/HealthTrack/iphone`. Textes ci-dessus mis à jour ; la page
  d'assistance renvoie aux tickets de ce dépôt (comme « Votre avis » depuis le 24/11).
- `store-check.mjs` : limites tenues (description 3 998 / 4 000 caractères) ; `store-push.mjs --dry-run` et
  `site/site.test.mjs` verts. Tous les fichiers touchés sont hors des déclencheurs de `ios-build.yml` : **aucun build
  de Mac**. Aucune note de Nouveautés (rien de visible dans l'app).

## Après le merge
- **#1280 mergée** (14 checks verts, aucun build de Mac). « Build & Release » ne tourne pas (`iphone/**` et `journal/**`
  ignorés) : la release reste **v928** (APK 35,7 Mo), rien ne change dans l'app Android.
- « Fiche App Store — envoi » lancé sur main sans case cochée (run 45770706754, vert) : « Version 893 : fiche fr-FR
  mise à jour (description, mots-clés, texte promotionnel, assistance) » et « App : nom, sous-titre et confidentialité
  fr-FR mis à jour ». Numéro 893 inchangé, build 1244.1244 toujours attachée, rien soumis.

## Suite proposée
1. Pages embarquées `app/public/confidentialite-iphone.html` et `conditions-iphone.html` : lien des tickets encore vers
   le dépôt iOS ; à changer dans la prochaine PR qui lance de toute façon un build iPhone.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

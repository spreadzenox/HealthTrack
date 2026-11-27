# Run 27/11 08:30 — personas du matin (run « idées »)

**Type** : 💡 (sans code produit) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
f1f0a74 (#1306) vert (Tests, émulateur A56, Build & Release, Play — AAB) · **TestFlight** : 1362.1362 chez « Testeurs
Halcya » (inchangé) · **Parité** : 70 % (33/47), inchangée

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). main vert. Pas de nouvelle réponse du
  propriétaire.
- La remise à zéro du clone (`git reset --hard`) a encore été refusée par la sécurité de la session ; le clone était
  déjà sur origin/main, propre.
- iPhone : `upstream.json` suit HEAD, aucun correctif propre ; rien à soumettre ni à expirer (1362 déjà chez les
  testeurs ; build du soir à 21:20).

## Personas (décision C)
Tirage : « Stressé et pressé » (la moins jouée, dernière fois le 25/11), puis au hasard « Ventre et données » ;
configurations au prorata (1 et 1), moments uniformes (1 et 45), mise à jour pour la seconde.
- « Stressé et pressé » J1, Android seul : `--day=1 --equipment=phone --notes=few`.
- « Ventre et données » J45, mise à jour, Android seul : `--day=45 --equipment=phone --goals=gut --legacy`.

Synthèse : `simulations/2026-11-27-0830-synthese.md`. Chaque constat vérifié dans les captures et le code :
- Aucun nouveau défaut sûr à corriger : humeur de Pilou (voulu, POLISH-SIM-109), rappels absents (version web),
  repas « Midi » à 08:33 (POLISH-SIM-122), essai planté par l'outil, etc. (raisons dans la synthèse).
- PROP-SIM-20 relevée une 4ᵉ fois, et pour la première fois par « Ventre et données » : ajouté à la proposition le
  nombre de repas par ligne.
- À vérifier au prochain run de code : fructanes et mannitol absents d'Alimentation sans explication (outil ou app).

## Vérifications
Journal seulement (rapports, captures, synthèse, BACKLOG, PRODUIT, résumé) : aucun fichier de `app/` modifié. Checks
de la PR attendus verts (Tests) ; aucun build iPhone (journal seul, CI économe).

## Suite proposée
1. Run de code : le point « fructanes absents » (vérifier les repas de l'outil, puis l'écran).
2. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; soumission bêta de la build du soir au premier run
   qui la voit traitée, expiration des anciennes.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, le message E. Réponses
attendues : PROP-SIM-20 (4 personas), PROP-SIM-19, « go courbes / go phases / non », « rituel 2D / 3D / pas de rituel ».

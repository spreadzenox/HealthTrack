# Run 26/11 08:30 — personas du matin (run « idées »)

**Type** : 💡 (sans code produit) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
ae1d75a vert (Tests, émulateur A56), release v928 (APK 35,7 Mo) · **TestFlight** : 1335.1335 chez « Testeurs Halcya »,
validée (inchangé ; build du soir à 21:20) · **Parité** : 70 % (33/47), inchangée

## État de départ
- main ae1d75a (journal de 07:30) vert ; aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée).
- Pas de réponse du propriétaire (LANT-4, courbes de la montre, PROP-SIM-19).
- Note : la remise à zéro du clone (`git reset --hard origin/main`) a été refusée par la sécurité de la session ; le
  clone était déjà sur origin/main, propre (vérifié par `git rev-parse` et `git status`).

## Personas (décision C)
Tirage : les deux personas les moins jouées depuis le 23/11 ; configuration au prorata, moment uniforme ;
installations neuves (tirées).
- « Prendre soin de soi » J45, téléphone + balance (config 5) : `--day=45 --equipment=phone-scale --goals=care`.
- « Ventre et données » J45, iPhone seul (config 2, apparence Android) : `--day=45 --equipment=phone --goals=gut`.

Synthèse : `simulations/2026-11-26-0830-synthese.md`. Constats vérifiés dans les captures et le code, au BACKLOG :
- **POLISH-SIM-168** : « Encore 3 choses aujourd'hui » ne baisse pas quand on note un repas (`dayChecklist.js`).
- **POLISH-SIM-169** : champ des grammes d'un repas, taper ajoute au nombre (`MealEditor.jsx`).
- **PERSONAS-OUTIL-3** : l'outil montre « Samsung Health » pour une configuration iPhone.
- **PROP-SIM-19** renforcée (poids introuvable pour la 4ᵉ fois ; masse grasse sans courbe dans Tendances).
- À étudier et écartés : dans la synthèse.

## Vérifications
Journal seulement (rapports, captures, synthèse, BACKLOG, PRODUIT, résumé) : aucun fichier de `app/` modifié. Checks
de la PR attendus verts (Tests) ; aucun build iPhone (journal seul, CI économe).

## Suite proposée
1. Runs de code : POLISH-SIM-168 et 169 groupés en une PR (un seul build iPhone) ; PERSONAS-OUTIL-3 avec.
2. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; soumission bêta au premier run qui voit la build traitée.
3. Pages embarquées `confidentialite-iphone.html` et `conditions-iphone.html` (lien des tickets, run de 07:30) dans
   la prochaine PR qui lance un build iPhone.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51. Réponses attendues : PROP-SIM-19, « go
courbes / go phases / non », « rituel 2D / 3D / pas de rituel ».

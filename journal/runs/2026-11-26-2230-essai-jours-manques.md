# Run 26/11 22:30 — Essai : rattraper les jours manqués (POLISH-SIM-176)

**Type** : 🔧 (polish, code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
2ae0d88 (#1296) vert (Tests, Build & Release, Play — AAB, émulateur A56) · **TestFlight** : 1335.1335 chez « Testeurs
Halcya », validée ; build du soir (cron de 21:20) pas encore partie à 22:30 (retard habituel du cron GitHub) ·
**Parité** : 70 % (33/47), inchangée (code partagé)

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). Pas de nouvelle réponse du propriétaire.
- Run de 22:30 : run de code. Suite proposée par le run de 21:30 : restes « À étudier » du passage de 20:30.

## Fait
- **« Jour 1 sur 7 » (Accueil) / « 0 sur 7 jours notés » (Objectifs)** : écarté après lecture du code. `firstWeek.js`
  compte les jours notés comme Objectifs ; le « jour en cours » vaut jours notés + 1 tant qu'aujourd'hui n'est pas noté.
  Après la note du jour, les deux disent 1 sur 7. Rien à changer.
- **POLISH-SIM-176** : sur la page d'un essai, quand la mesure manque (sommeil, pas, écran) ou qu'une habitude n'a pas
  de réponse, seule la veille se demandait (« Hier, … : c'était tenu ? ») ; un jour non répondu la veille restait inconnu
  pour toujours (lanterne en attente, « Consigne tenue » sous-compté). `trialStatus` cherche maintenant le jour le plus
  récent sans tenue parmi les 3 derniers (`ASK_BACK_DAYS`) : « Hier », « Avant-hier », puis le jour nommé (« Lundi, … »),
  une question à la fois. Pour les jours d'avant la veille, la phrase de mesure absente dit « pour cette nuit-là » /
  « de ce jour-là » (`missingOld`). Le groupe accessible s'appelle « Question sur avant-hier », etc.
  Le résultat de l'essai n'en dépend pas (il suit le calendrier tiré au sort, POLISH-ESSAI-SANS).
- Tests d'abord : `trials.test.js` (rouge avant le code : `when` absent, question seulement pour la veille),
  `Trial.test.jsx` (la veille répondue, la question passe à avant-hier ; « Non » enregistre le 3).
- Nouveautés : `2026-11-26-2230-essai-jours-manques.json` (les deux magasins).

## Vérifications
- `npm run test` : 4 724 tests verts ; `npm run lint` : 0 erreur (comme avant) ; `npm run build` vert.
- `npm run visual -- --play --routes=/agir --trial=8 --trial-factor=alcohol --click="alcool"` : page de l'essai relue
  (jour 8 sur 10, « Hier, un peu moins d’alcool que d’habitude : c’était tenu ? », lanternes, résultat en cours) ;
  aucune erreur JS. L'outil ne sait pas planter une réponse de la veille : le passage à « Avant-hier » est couvert par
  le test de la page (`Trial.test.jsx`).
- PR en brouillon, puis « prête » une fois le journal fini : un seul build iPhone (CI économe).

## Suite proposée
1. Finir la PR si le build iPhone n'est pas fini à la fin du run (capture de la page d'un essai).
2. Ce soir : TestFlight du soir et Alpha de 23:45 ; soumission bêta de la build du soir au premier run qui la voit
   traitée, expiration des anciennes.
3. Reste du passage de 20:30 : « vous notez vous-même » à vérifier sur l'émulateur ; jours déjà comptés du long terme
   (à grouper avec un autre passage sur Objectifs).

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, le message E (fin de Gold
offert). Réponses attendues : PROP-SIM-19, « go courbes / go phases / non », « rituel 2D / 3D / pas de rituel ».

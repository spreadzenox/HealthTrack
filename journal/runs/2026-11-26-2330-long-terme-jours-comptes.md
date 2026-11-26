# Run 26/11 23:30 — Objectifs : les jours déjà comptés (POLISH-SIM-177)

**Type** : 🔧 (polish, code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
d5abe8e (#1297) vert (Tests, Build & Release, Play — AAB, émulateur A56) · **TestFlight** : 1335.1335 chez « Testeurs
Halcya » ; build du soir pas encore partie à 23:30 (dernier envoi TestFlight le 26/11 02:52 UTC, cron en retard comme
d'habitude) · **Parité** : 70 % (33/47), inchangée (code partagé)

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). Pas de nouvelle réponse du propriétaire.
- Run de 23:30 : run de code. Suite : restes « À étudier » du passage de 20:30.

## Fait
- **POLISH-SIM-177** (« Ventre, sans technique », J45) : « encore 11 jours avec votre digestion notée » après 45 jours
  de notes faisait croire que rien n'était compté. La ligne du prochain délai d'Objectifs dit maintenant
  « Long terme (de 7 à 27 jours avant) : 45 jours sur 56 avec votre digestion notée, encore 11. »
  `resultsView.js` : `nextLock` porte `have` (borné à `need`) et `need` ; `Recommendations.jsx` les écrit.
- Tests d'abord : `resultsView.test.js` (`have`, `need`), `Recommendations.test.jsx` (phrase entière, un seul compte).
- Nouveautés : `2026-11-26-2330-long-terme-jours-comptes.json` (les deux magasins).

## Vérifications
- `npm run test` : 4 724 tests verts ; `npm run lint` : 0 erreur ; `npm run build` vert.
- `npm run visual -- --play --routes=/recommendations/bien-etre --history-days=25` : « Moyen terme (de 2 à 6 jours
  avant) : 25 jours sur 35 avec votre bien-être noté ou lu, encore 10. »
  ([capture](captures/2026-11-26-2330-jours-comptes.png)) ; aucune erreur JS.
- PR en brouillon, puis « prête » une fois le journal fini : un seul build iPhone (CI économe).

## Suite proposée
1. Finir la PR si le build iPhone n'est pas fini à la fin du run (capture d'Objectifs › bien-être).
2. Cette nuit : TestFlight du soir et Alpha de 23:45 ; soumission bêta de la build du soir au premier run qui la voit
   traitée, expiration des anciennes.
3. Reste du passage de 20:30 : « vous notez vous-même » à vérifier sur l'émulateur.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, le message E (fin de Gold
offert). Réponses attendues : PROP-SIM-19, « go courbes / go phases / non », « rituel 2D / 3D / pas de rituel ».

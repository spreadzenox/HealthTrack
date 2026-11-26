# Run 26/11 18:30 — Exemple du 28e jour plus réaliste (POLISH-SIM-173)

**Type** : 🔧 (polish, code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
79f85e6 (#1292) vert (Tests, Build & Release, Play — AAB, émulateur A56) · **TestFlight** : 1335.1335 chez « Testeurs
Halcya », validée (inchangé ; build du soir à 21:20) · **Parité** : 70 % (33/47), inchangée (code partagé)

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). Pas de nouvelle réponse du propriétaire.
- Run de 18:30 : run de code. Travail parti de origin/main, branche `auto/exemple-j28-ordre-grandeur`.

## Choix de l'étape
Dernier « À étudier » du passage du 25/11 20:30 (« Ventre, sans technique », capture `exemple-j28-points.png`) :
« Fructanes −3,5 pt » sur une note de 1 à 5 (« un seul repas me ferait passer de calme à douleur ? ») et
« GOS +1,8 pt » (pois chiches, lentilles) qui semblait bon pour le ventre.

## Constat
L'exemple vient des données fictives de la visite (`services/tourData.js`) : deux soirs d'oignon sur trois notés
« douleur », gêne le lendemain, calme sinon. Mesuré avec le vrai moteur d'Analyses : fructanes −3,50 (net), GOS +1,0
à +1,8 selon la date (hasard des repas de la démo qui tombent les autres jours).

## Fait
- `tourData.js` : gêne le soir d'oignon et le lendemain, jamais douleur. Essais comparés (sortie du moteur, 3 dates ×
  2 configurations) : « douleur 1 sur 3 » ou « gêne seule le soir » donnaient −1,5 à −2,1 mais plus de piste nette à
  certaines dates ; la règle gardée donne −2,6 à −2,8, net partout, GOS ≤ 0,43.
- Test d'abord, rouge (3,5 > 3) puis vert : `tourResults.test.js`, au 28e jour, fructanes ≤ 3 pt et aucun autre
  groupe FODMAP à 1 pt ou plus (5 dates × 4 configurations). Les tests existants (piste fructanes nette, piste
  bien-être) restent verts.
- Nouveautés : `2026-11-26-1830-exemple-j28-ordre-grandeur.json` (les deux magasins).

## Vérifications
- `npm run test` : 4 719 verts ; `npm run lint` : 0 erreur ; `npm run build` vert.
- Outil des personas (jour 3, téléphone seul, objectif digestion), Voir un exemple → jusqu'à « Au jour 28 : ce qui va
  avec votre ventre » : [`capture`](captures/2026-11-26-1830-exemple-j28-ordre-grandeur.png) (Fructanes −2,7 pt,
  puis fructose −0,6, sorbitol −0,6, lactose −0,4 ; plus de GOS). Aucune règle CSS changée : pas de capture sombre.
- PR en brouillon puis prête : un build iPhone (code embarqué changé).

## Reste (pas fait ici)
Les mots « pt », « GOS », « FODMAP » du tableau « Ce qui va avec » sont ceux de l'écran réel aussi : à proposer avec
une maquette si un passage le redemande (noté au BACKLOG sous POLISH-SIM-173).

## Suite proposée
1. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; soumission bêta au premier run qui voit la build.
2. Run « idées » de 20:00 : passage de personas sur la version du jour.
3. FUSION-4 : mission d'archivage de l'ancien dépôt quand ses builds TestFlight sont expirées.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, envoyer le message E.

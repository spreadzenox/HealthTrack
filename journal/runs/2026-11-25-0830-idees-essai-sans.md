# Run 25/11 08:30 — idées : les jours « sans » d'un essai

**Type** : 💡 (run « idées », sans code produit) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) ·
**Android** : main 5a52335, release v915 · **TestFlight** : 1313.1313 chez « Testeurs Halcya », en examen bêta depuis
le 25/11 04:31 UTC · **Parité** : 70 % (33/47), inchangée

## État de départ
- main 5a52335 vert (Tests, émulateur A56 ; Build & Release v915 et Play — AAB verts sur c9aa1d8). Aucune PR de la
  routine ouverte (seule #51, `cursor/*`, pas à la routine).
- Suite proposée par le run de 07:30 : maquette cœur et oxygène dans Tendances ; ligne « Sans » vide au jour 4.

## Fait
1. **Cœur et oxygène dans Tendances** : la maquette existe déjà (19/11 08:30, `maquettes/tendances-courbes/`, réponse
   « go courbes », « go phases » ou « non ») ; elle n'était plus dans « Toujours en attente de vous ». Remise en tête du
   résumé ; BACKLOG corrigé (pas de nouvelle maquette).
2. **Ligne « Sans » vide au jour 4** : recalculée avec les données exactes de l'outil (`personaEntries` J14 montre +
   `legacyTrial`, test jetable supprimé) : nuits des jours « sans » 2 et 3 à 7 h 59 et 7 h 41, donc « non tenues »
   (`heldFromData`) et écartées par `pick`, alors que l'écran disait « comme d'habitude, rien à changer ». Défaut réel.
3. **Banc à vérité connue** (méta-leçon 10), `journal/methode/ESSAI-SANS.md` et `methode/bancs/banc-essai-sans.mjs` :
   la règle actuelle conclut 47 % des essais de 10 jours, gonfle l'écart (0,70 pour 0,30) et, sans effet mais avec un
   facteur caché, penche vers « Plutôt oui » (3,6 % contre 1,5 %, +0,14). Par calendrier : 100 % concluent, écart sans
   biais, fausses alertes symétriques (≈ 4 %). Constat : 10 jours ne repèrent un vrai effet de 0,3 qu'une fois sur huit.
4. **POLISH-ESSAI-SANS** écrit au BACKLOG, prêt pour le prochain run de code (tests d'abord, aucun schéma touché,
   iPhone dans la même PR).

## Vérifications
Journal seulement : aucun fichier de `app/` modifié (le test jetable a été supprimé avant le commit). Checks de la PR
attendus verts (Tests) ; aucun build iPhone (journal seul, CI économe).

## Suite proposée
1. Prochain run de code : POLISH-ESSAI-SANS (`trials.js`, `trials.test.js`).
2. Restes « À étudier » : note « Douleur » lissée (banc avant tout changement) ; poids (PROP-SIM-19, en attente).
3. Build iPhone et TestFlight du soir, puis soumission bêta au premier run qui voit la build traitée.

## Pour le propriétaire
Rien de nouveau à faire : recruter des testeurs (4 sur 12), puis PI2, puis P51. Une réponse attendue : « go courbes »,
« go phases » ou « non » (maquette du 19/11).

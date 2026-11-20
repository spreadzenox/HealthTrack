# Run du 20/11 05:30 — Un repas décrit garde tous ses plats (UPG-8)

**Type** : 🛠️ code (polish de la refonte, objectif du 22/11) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 7503e5b.

## État de départ
- main (#1138) : Tests, Build & Release, Play — AAB et émulateur verts. Alpha de la nuit partie à 03:44 UTC.
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas à nous).
- Constats des personas : tous soldés sauf UPG-8 (à vérifier hors analyse factice) et les deux propositions en
  attente du propriétaire (POLISH-SIM-107 courbes, POLISH-SIM-108 « Encore N choses »).

## Ce qui a été fait
- **UPG-8 vérifié dans le code réel** (« pâtes carbonara, un yaourt et une pomme » ne rendait que la carbonara dans
  l'outil, dont l'analyse est factice) :
  - côté app, rien n'est perdu : `toMealResult` garde chaque élément renvoyé, même un nom hors de la base ;
  - côté consigne, la règle texte (`relay/src/prompts.js`, et la même dans `geminiStandalone.js` pour la sideload)
    ne parlait que d'**un** plat composé ; rien ne disait qu'une description peut en citer plusieurs, avec un seul
    champ `dish`. C'est le seul endroit où un modèle peut réduire le repas à son premier plat.
- Règle ajoutée dans les deux consignes, juste avant celle du plat composé : chaque plat, aliment ou boisson cité
  apparaît dans `ingredients`, avec l'exemple carbonara + yaourt + pomme ; pour plusieurs plats, `dish` les nomme
  ensemble. La liste des ingrédients reste en tête (cache implicite de Vertex inchangé).
- Tests d'abord, rouges puis verts : `relay/test/server.test.js` (la consigne envoyée au modèle pour une description
  à trois plats) et `geminiStandalone.test.js` (même chose en sideload).
- Note de Nouveautés `2026-11-20-0530-plusieurs-plats` (toutes variantes).
- Limite : l'effet sur une vraie analyse n'est pas mesurable ici (pas d'accès à Vertex depuis la session) ; à
  confirmer sur une analyse réelle après le déploiement du relais.

## iPhone
- Aucun correctif de `iphone/patches/` ne touche ces deux fichiers (le 38 importe seulement `geminiStandalone.js`) ;
  les 51 correctifs s'appliquent en séquence, sur main comme sur la branche. Même relais pour l'iPhone : la règle
  vaut des deux côtés. Parité : 70 %. TestFlight : 1196.1196 en test externe (relevé du run de 03:30).

## Vérifications
- `npm run test` (app) : 4 126 verts ; tests du relais : 250 verts ; `npm run build` vert ; lint des fichiers touchés
  propre ; `npm run visual --routes=/,/food` vert, capture Nutrition relue (inchangée, aucun écran touché).

## Suite proposée
1. Finir cette PR (checks), puis vérifier le déploiement du relais.
2. Fin du passage UPG-3 : « Tout mesurer » en installation neuve et « Ventre, sans technique » en mise à jour (run
   « idées » de 08:00).
3. Préparation de PI2 (soumission App Store, objectif du 22/11).

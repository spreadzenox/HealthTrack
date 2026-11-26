# Run 26/11 19:30 — Le pain des personas (PERSONAS-OUTIL-4)

**Type** : 🔧 (outil des personas, aucun code de l'app) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) ·
**Android** : main bf52161 (#1293) vert (Tests, Build & Release, Play — AAB, émulateur A56) · **TestFlight** :
1335.1335 chez « Testeurs Halcya », validée (inchangé ; build du soir à 21:20) · **Parité** : 70 % (33/47), inchangée

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). Pas de nouvelle réponse du propriétaire.
- Run de 19:30 : run de code. Travail parti de origin/main, branche `auto/personas-outil-4-pain`.

## Choix de l'étape
Premier « À étudier » restant du passage du 26/11 08:30 (« Ventre et données », J45) : fructanes absents des facteurs
comparés et « pain » sans alerte « Riche en … ». La synthèse soupçonnait l'outil : à vérifier avant d'en faire un
défaut de l'app. Étude sans code de l'app, donc sans build de Mac.

## Constat
- `scripts/persona/fakeMeal.mjs` cherche le premier mot dans la table et prend le nom le plus court : « pain »,
  « baguette » et « tartine » donnaient « Pain pita », qui n'a aucune mesure de fructanes
  (`fodmapMeasurements.json` a le pain blanc, le pain de tradition, le complet, le bis, le seigle…). L'app réelle
  reçoit de l'IA le nom Ciqual du pain mangé ; l'outil, lui, ne pouvait jamais déclencher l'alerte.
- Les repas de démo (`scripts/visual/demoData.mjs` 40-41) n'ont pas de fructanes, exprès (la visite guidée plante
  les siens) : sans pain mesuré noté par la persona, le facteur fructanes ne peut pas apparaître.
- Conclusion : défaut de l'outil, pas de l'app.

## Fait
- `fakeMeal.mjs` : un alias peut nommer directement un aliment de la table ; « pain », « baguette », « tartine »
  → « Pain blanc (par ex. : baguette, boule…) ».
- Test d'abord, rouge puis vert : `fakeMeal.test.mjs`, chaque mot donne un pain dont les fructanes sont mesurés, et
  une baguette de 100 g ressort « riche en fructanes » (`estimateMealFodmap`, `highFodmapGroups`).
- Pas de Nouveautés : rien ne change dans l'app.

## Vérifications
- `npm run test` : 4 720 verts ; `npm run lint` : 0 erreur.
- Outil rejoué (J14, téléphone seul, objectif digestion) : Accueil › Repas › Décrire le repas, « baguette avec du
  beurre et un café » → Pain blanc, Beurre, Café, et « Probablement riche en fructanes : pain blanc »
  ([capture](captures/2026-11-26-1930-personas-outil-4-baguette.png)).
- `app/scripts/persona/**` ne lance pas le build iPhone de PR : aucune minute de Mac.

## Reste (pas fait ici)
- L'outil met 100 g par aliment quand aucune quantité n'est écrite (100 g de beurre) : sans effet sur ce constat,
  à corriger si un passage s'en trouve gêné.
- Autres « À étudier » du 26/11 08:30 : éviction ou réintroduction sans piste nette, Pilou au toucher, rien à faire à
  J45 pour qui note peu (fonction nouvelle, donc proposition).

## Suite proposée
1. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; soumission bêta au premier run qui voit la build.
2. Run « idées » de 20:00 : passage de personas sur la version du jour (l'outil donne maintenant un vrai pain).

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, envoyer le message E.

# Run 14/11 13:35 — Tendances, fiche d'un jour : la note telle que donnée (POLISH-SIM-90)

**Type** : code (mode polish)  ·  **Android** : v1047 sur main au début  ·
**TestFlight** : 1030.1031 chez les testeurs externes (depuis le 14/11 à 00:33) ; aucune soumission bêta avant la
nuit prochaine ; 844.344 intacte  ·  **Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main a568661 (#971, v1047) : Build & Release, Tests, Play — AAB et émulateur A56 verts.
- PR #970 du run précédent (suivi iPhone, code embarqué v1047, correctifs 17, 32, 56 et 57 refaits) : tous les
  checks verts sauf « Build iOS (simulateur) et captures », en cours depuis 13:09. #51 (`cursor/*`) non touchée.

## Fait
1. **POLISH-SIM-90** (`trendsData.js`, `trendsDay.js`, `TrendsViewer.jsx`) : dans la fiche d'un jour de Journal ›
   Tendances, quand le chiffre du jour s'écarte de la note, la ligne dit d'abord la note telle qu'elle a été donnée,
   puis d'où vient l'estimation.
   - Bien-être : « votre note 3,4 et le visage » devient « vous avez noté 3 · estimé avec le visage » (ou « avec les
     jours voisins » sans lecture du visage). La note est le choix de 1 à 5 (`scoreToChoice`, comme dans la saisie
     et dans Analyses) ; « 3,4 » venait de la conversion de l'échelle interne (0 à 5) vers l'échelle affichée.
   - Digestion : « estimé, avec votre note « douleur » » devient « vous avez noté « douleur » (1) · estimé avec les
     jours voisins » : la valeur de la note est celle de la légende sous la courbe.
   - Quand le chiffre est la note : « votre note » ou « noté « gêne » », inchangé.
2. Nouveautés : `2026-11-14-1335-fiche-jour-note-telle-que-donnee.json` (pour tous).

## Vérifs
- Trois tests de `trendsData.test.js` vus rouges avant le code ; deux assertions de `Trends.test.jsx` alignées (la
  fiche ne contient plus de « 3,4 et »).
- `npm run test` : 3543 verts, 44 ignorés. `npm run build` : passe. `npm run lint` : aucune erreur.
- `npm run visual` sur `/tendances`, fiche du vendredi 13/11, clair et sombre : aucune erreur JavaScript ; la ligne
  tient sur une ligne à droite sous « 3,3 /5 »
  ([clair](captures/2026-11-14-1335-tendances-fiche-jour-clair.png) ·
  [sombre](captures/2026-11-14-1335-tendances-fiche-jour-sombre.png) ·
  [avant, persona](../simulations/captures/2026-11-14-0835-ventre-sans-technique-J14/tendances-detail-13nov.png)).

## Limites
- Le cas digestion (« vous avez noté « douleur » (1) ») n'est vérifié que par les tests : les données de démo
  n'ont pas de jour où le confort estimé s'écarte d'une note « douleur ». La phrase, plus longue, peut passer sur
  deux lignes sur un petit écran : à regarder au prochain passage des personas.
- Pas de capture « avant » refaite à ce run : celle de la persona de 08:35 sert de référence.
- Plusieurs notes de bien-être le même jour : la fiche ne dit toujours que la dernière.
- Seul `/tendances` a été capturé (seul écran touché) ; les 18 pages n'ont pas été rejouées.
- Charte, PRODUIT, BACKLOG, PARITE et journal iPhone lus par sections, pas en entier (plus de 1 Mo) ;
  `iphone/journal/README.md` § 3, 4 et 8 non relus à ce run.

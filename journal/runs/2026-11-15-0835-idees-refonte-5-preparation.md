# Run 15/11 08:35 — Idées : préparation de l'étape 5 de la refonte (onboarding)

**Type** : idées (aucun code produit)  ·  **Android** : main 44f4107 (#1004, v1080), vert  ·  **TestFlight** :
relevé de 08:40, « en test 1072.1073 ; refusées aucune ; en attente aucune » ; 844.344 intacte  ·  **Parité** :
70 % (33/47), inchangée

## Contexte
- Empreinte des instructions vérifiée : conforme (710f9e8b…). Les quatre fichiers d'instructions, le brief de la
  refonte et `iphone/README.md` lus en entier.
- Main 44f4107 : Tests, Build & Release, Play — AAB et émulateur verts.
- #1005 (suivi iPhone de l'étape 4b, code v1080), ouverte par le run précédent : sa build iOS avait échoué en 35 s
  sur « error: fatalError » pendant la compilation du paquet Swift `HalcyaRules`, avant toute ligne de l'app.

## Fait
1. **#1005** : build iOS relancée (échec lu comme un plantage de l'outil de build, pas comme une erreur du code :
   les mêmes fichiers Swift compilent sur main, et #1005 ne touche que `upstream.json`). La relance est verte.
   15 checks verts, branche à jour sur main, `js-errors.txt` et `texte-android.txt` vides. Captures d'Objectifs
   regardées (iPhone 17 Pro, clair et sombre) : même écran que sur main (carte floutée « Débloquer », le simulateur
   n'a pas Gold). Mergée vers 09:25 (615c891).
2. **Préparation de l'étape 5** :
   [`ETAPE-5-ONBOARDING.md`](../maquettes/compagnon-etapes/ETAPE-5-ONBOARDING.md).
   - Inventaire des 7 étapes de l'accueil actuel et de leur sort.
   - Relevé de ce que chaque objectif change dans le code : seuls `gut` et l'ancien `cycle` ont un effet (le
     ventre) ; `stress`, `all`, `sport` aucun ; `care` un mot. `homeFocus` n'a plus de lecteur.
   - Table de migration vers « bien-être toujours, confort digestif facultatif », avec le cas du cycle
     (`cycleVisible` lit l'objectif `cycle` : à préserver) et celui des installations sans objectif.
   - Six choix à trancher (tuto, visage, première note, longueur, version du parcours, anciens utilisateurs).
   - Correctifs iPhone touchés : 23, 45, 52, 55 (`Onboarding.jsx`), 18 (`Layout.jsx`).
   - Découpage : 5a (migration), 5b (les 4 temps), 5c (carte du tuto).
3. **Défaut trouvé** : la carte 2 du tuto présente encore « Agir » comme un onglet (REFONTE-5c).
4. **TestFlight** : relevé lancé (lecture seule). Rien à soumettre ni à expirer : aucune build en attente, et la
   suivante part chez les testeurs après l'Alpha de ce soir.
5. Journal : résumé, `BACKLOG.md` (REFONTE-5a, 5b, 5c), `PRODUIT.md`.

## Vérifs
- Aucun fichier de `app/`, `relay/` ni `iphone/` modifié.
- Captures de l'accueil actuel regardées (Android, 412 px, clair, installation vide) : objectifs, sources.

## Limites
- iPhone, 4b : les lignes miel d'Objectifs n'ont pas été vues sur simulateur (écran verrouillé sans Gold, et les
  données de démo n'ont pas d'habitude) ; iPhone 16e et grand texte non regardés ; workflows de main après le merge
  non attendus.
- Pas de simulation de personas à ce run (deux par jour demandées) : le temps est allé à l'étape 5.
- Le relevé TestFlight ne liste que les builds soumises à l'examen bêta : l'arrivée chez Apple des builds des codes
  v1075 et v1078 n'est toujours pas vérifiée.
- Deux écrans de l'accueil sur sept regardés ; ni sombre, ni iPhone. Correctifs iPhone comptés, pas relus.
- Aucune maquette de l'onboarding sans Pilou : la proposition suit les textes de la SPEC, pas une image.
- Non relus en entier : la charte, `PRODUIT.md`, `DESIGN.md`, `INFRA.md`, les deux `BACKLOG.md`, `PARITE.md`,
  `iphone/journal/README.md` (§ 3, 4 et 8), les SPEC hors § 4 de `comprendre`.
- Pas de veille web à ce run.
- L'horloge du conteneur retarde sur celle de GitHub : heures approximatives.

## Suite
- Vérifier « iOS — TestFlight » de 615c891 et l'arrivée de la build du code v1080.
- REFONTE-4b-iOS : une capture iPhone d'Objectifs avec Gold et une habitude suivie.
- Run de code : REFONTE-5a, tests de migration d'abord.
- REFONTE-4b-2 (banc avec un facteur binaire) reste ouverte.

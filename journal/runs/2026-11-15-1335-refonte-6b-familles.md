# Run 15/11 13:35 — Refonte « Compagnon », étape 6b : les liens par famille

**Type** : code (refonte « Compagnon », étape 6 du § 10 du brief, deuxième partie)  ·  **Android** : main 06ae67b
(#1013, v1088) au début  ·  **TestFlight** : aucun relevé à ce run (dernier connu : 11:39, 1072.1073 en test)  ·
**Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions vérifiée : conforme (710f9e8b…). Lus en entier : les quatre fichiers d'instructions,
  le brief de la refonte, le compte rendu de 12:35, la préparation `ETAPE-6-OBJECTIFS.md`, les § 6 et § 7 de
  `specs/comprendre.SPEC.md`. Du résumé de la semaine, seul le début a été lu.
- Main 06ae67b : Tests, Build & Release (v741) et Play — AAB verts ; l'émulateur de main tournait encore.
- Une PR de la routine ouverte : **#1014** (suivi iPhone de 6a, ouverte à 13:28 par le run de 12:35, build macOS en
  cours). Elle ne touche que `iphone/` et le journal ; ce run n'a touché à aucun de ses fichiers de code. #51 non
  touchée.

## Fait
1. **Étape 6b sur Android** (découpage de la préparation, § 5) :
   - `services/influenceFamilies.js` (pur, sur le contrat de la méthode, aucune statistique nouvelle) : les liens
     nets des délais prêts, rangés par famille. Sommeil (avec « Écran tard le soir », comme la SPEC § 6.5),
     Alimentation et Activité sont toujours montrées ; Habitudes (miel) et Écrans (gris : temps d'écran, réseaux
     sociaux) ne s'ajoutent qu'avec un lien net. Le corps et la météo restent dans « À regarder, pas à changer ».
     Niveau d'une famille : son lien net le plus fort, en points sur 5 pour une variation habituelle (moins de
     0,25 : faible ; de 0,25 à 0,5 : moyen ; 0,5 et plus : fort). La famille la plus forte vient en premier.
   - `pages/Recommendations.jsx` et `.css` : bloc « Par famille » en tête des résultats du détail d'un objectif
     (bien-être et confort digestif) : une carte par famille à la couleur de son thème, trois points et « Lien
     fort », « Lien moyen » ou « Lien faible » ; sous le nom, le facteur qui porte le lien s'il diffère du nom de
     la famille ; sans lien net, carte neutre « Pas de lien net pour l'instant » ; sans facteur comparé, « Pas
     assez de données ». Non montré tant que les pistes sont floutées (version Play sans abonnement).
   - « Comment est calculé votre bien-être ? » (SPEC § 6.4) : un lien replié en bas du détail du bien-être,
     au-dessus de « Comment c'est calculé » : « Deux sources, réunies chaque jour : votre note et la lecture du
     visage, si vous l'utilisez. Un jour sans note ni lecture, Halcya l'estime d'après les jours voisins. »
   - note de Nouveautés `2026-11-15-1335-objectifs-familles.json` (les deux magasins).
2. Journal : résumé, les deux `BACKLOG.md`, `PRODUIT.md`, `PARITE.md` (la ligne du tableau des runs et les deux
   fichiers de l'iPhone ajoutés après le merge de #1014, qui modifiait les lignes voisines).

## Vérifs
- `app/` : `npm run test` 3677 verts, 44 ignorés ; `npm run lint` sans erreur ; `npm run build` ; `npm run visual`
  complet (20 pages) sans erreur, lancé avant l'ajout de la règle CSS qui rapproche les deux liens du bas ; ensuite
  seule `/recommendations/bien-etre` a été recapturée (sombre).
- Tests : ceux du service (6 cas) écrits dans la même commande que le service, donc jamais vus rouges ; ceux de
  l'écran (4 cas) écrits avec l'écran ; celui de la version Play sans abonnement écrit après, vert du premier coup.
  Après ce dernier test, seuls les tests de `Recommendations` (27) ont été relancés en local ; la suite complète
  tourne sur la PR.
- Captures regardées (Android, 412 px, données de démo) : détail du bien-être, haut de page, clair et sombre (une
  famille avec un lien faible, deux sans lien net) ; bas de page, clair et sombre (les deux liens « Comment… ») ;
  détail du confort digestif avant les résultats (inchangé, pas de familles).
- Capture ajoutée après coup (`--habits=history`, clair) : une ligne Habitudes en miel, « Méditation », trois
  points, « Lien fort », au-dessus de Sommeil « Lien faible » et de deux familles sans lien net.
- iPhone : `git apply --check` du correctif 50 (seul à toucher `Recommendations.css`) passe.

## Écarts et choix (dits au propriétaire dans le résumé)
- Titre « Par famille » et niveaux « Lien fort / moyen / faible », au lieu de « Ce qui influence votre bien-être »
  et « Influence forte » de la SPEC : la règle 5 demande des mots qui ne confondent pas lien et cause.
- « Ce sont des pistes, pas des causes. » non affichée (SLOP-1 la refuse hors « Comment c'est calculé »).
- Deux lignes de plus que la maquette quand elles ont un lien net : Habitudes et Écrans.
- Pas de moyenne par famille (« 7 h 05 par nuit », « 19 repas », « 8 400 pas par jour »).
- La fiche est un texte replié, pas une feuille du bas ; sans les deux cartes illustrées ni la barre.

## Limites
- Les seuils 0,25 et 0,5 sont des repères d'affichage choisis par ce run, pas des tests ; « Lien faible » peut
  qualifier un lien net de 0,05 point.
- Les cartes des familles ne s'ouvrent pas (le détail d'une famille est l'étape 6c) ; sur les données de démo, la
  carte Sommeil et la piste Sommeil se suivent et disent presque la même chose.
- « Comment est calculé votre bien-être ? » et « Comment c'est calculé » se suivent : deux libellés proches.
- États jamais capturés : le niveau « Lien moyen », une ligne Écrans, « Pas assez de
  données », le confort digestif avec des résultats, le lien déplié. La version Play sans abonnement (bloc masqué)
  a un test (`Recommendations.play.test.jsx`), pas de capture.
- Captures non regardées : 320 px, grand texte, les 19 autres pages du passage complet (lancé pour ses erreurs).
- Pas de Pilou, pas de galets, aucune animation.
- iPhone : rien d'embarqué à ce run pour 6b.
- Non relus : la charte, `PRODUIT.md`, `DESIGN.md`, `INFRA.md`, les deux `BACKLOG.md`, `PARITE.md`,
  `iphone/README.md`, `iphone/journal/README.md`.
- Pas de simulation de personas. Arrivée chez Apple des builds des codes v1075 à v1088 non vérifiée : le relevé ne
  montre que le groupe externe.

## Suite
- REFONTE-6b-iOS (embarquer, regarder le détail du bien-être sur simulateur), puis 6c (détail d'une famille et
  défi doux) ; 6d demande d'abord le banc à n = 7 et 14.

## Fin de run (vers 14:25)
- **TestFlight relevé à 13:43** (« TestFlight — examen bêta (relevé) », vert) : 1072.1073 en test chez les testeurs
  externes ; les builds plus anciennes expirées ; rien de refusé ni en attente.
- **#1015** (cette étape) : 12 checks verts sur 1accc23 à 14:03 (Tests, Build APK, 5 émulateurs, budget de
  lectures). Gardée ouverte jusqu'au merge de #1014, pour ne pas mettre celle-ci en retard sur main et relancer sa
  build macOS.
- **#1014 mergée à 14:15** (3036290, suivi iPhone de 6a, code v1088) : 15 checks verts, build iOS sur simulateur
  verte à 14:14. Captures regardées sur iPhone 17 Pro (`captures/pr-1014`) : Objectifs en clair (3,0 / 5, « Plutôt
  en hausse cette semaine », confort digestif « Premier score dans 5 jours notés »), en sombre, sans donnée (« 0 sur
  7 », « 0 sur 14 ») ; détail du bien-être : « ← Objectifs », pistes floutées et « Débloquer ». Non regardées :
  iPhone 16e, grand texte, `/recommendations/ventre`.
- Constat pour 6b sur iPhone : sans abonnement, le bloc « Par famille » sera masqué dans les captures actuelles.
- Main fusionnée dans la branche de #1015 après ce merge (sans conflit) ; merge après les checks du nouveau commit
  (état final : voir la PR).
- **#1015 mergée à 14:31** (6d86ddf, v1090), sur 44a0b4a, 12 checks verts, branche à jour sur main. Le merge n'a
  pas été fait par cette session : elle attendait les checks et l'a trouvée mergée (sans doute le run suivant ;
  aucun commentaire sur la PR).
- Après ce merge : « Build & Release » vert, **release v742**, APK 34,6 Mo ; « Play — AAB » vert (v1090 en test
  interne) ; « Tests » vert. **« Test — émulateur » de main rouge** : « Build APK » a échoué sur un 429 de Maven
  Central (`kotlin-stdlib-2.2.0.pom`, « Too Many Requests »), les 5 émulateurs n'ont pas tourné ; jobs échoués
  relancés à 14:40 (résultat : voir la ligne suivante, ou le run suivant si elle manque).
- Main 3036290 (#1014) : « iOS — TestFlight » vert (le code v1088 est parti vers TestFlight, arrivée non vérifiée) ;
  la build simulateur de main tournait encore.
- Ce run a dépassé les 50 minutes visées : l'attente de la build macOS de #1014.


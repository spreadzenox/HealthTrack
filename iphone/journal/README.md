# Journal de bord — Halcya sur iOS

## 📅 Semaine en cours — S46 (lundi 9 novembre → dimanche 15 novembre 2026)

> Résumé tenu à jour à chaque run de la routine iOS : **c'est ce que lit le propriétaire.**
> Le premier run d'une nouvelle semaine (lundi, heure de Paris) archive ce bloc dans `semaines/AAAA-Sww.md` et en
> ouvre un neuf. Semaine précédente : `semaines/2026-S45.md`.

**Où en est iOS**

| | Android (Google Play) | iOS (App Store) |
|---|---|---|
| Dernière version | v1024 suivie (13/11) ; Alpha 100918 (nouvel accueil) chez les testeurs, en examen chez Google | **1021.521 chez les testeurs externes** (13/11, 18:34 ; déploiement continu) ; **844.344 reste attachée à la version 844 pour votre soumission** |
| Où l'installer | Play Store, test fermé | **TestFlight** : groupe interne, et lien public du groupe « Testeurs Halcya » (1021.521 depuis le 13/11, 18:34) |
| Parité des fonctions | référence | **70 %** (33 fonctions vérifiées sur 47 faisables ; 13/11 : taille du texte, test fermé TestFlight recompté) |

**👉 Prochaine action du propriétaire**
- **Quand vous voulez (3 min)** : dans Chrome, connecté à App Store Connect, dites à Claude **« fais la mission PI1 »**
  (`journal/missions/PI1.md`, lecture seule : ce qu'Apple reproche encore aux abonnements) et renvoyez « PI1 fait » avec
  son relevé. Le jour où vous voulez soumettre : **« fais la mission PI2 »** (tout prêt jusqu'au bouton
  « Ajouter pour examen », que vous cliquez). Classement complet dans `journal/missions/README.md`.
- Votre « Ok cycle » (10/11, 18:50) est fait sur iPhone : règles et symptômes lus dans Santé, carte « Suivi du cycle
  (Santé) » dans Sources ; la suite (le cycle dans les analyses) attend Android (CYCLE-4).
- Fait : déploiement continu en place (chaque nouvelle build part chez les testeurs) ; nettoyage après chaque envoi
  (restent 844.344 et la build des testeurs).

**Vos décisions en vigueur**
- **Missions navigateur** (12/11 vers 16:15) : tout ce qui se fait dans un navigateur, Claude le fait pour vous
  (« fais la mission PIx » dans Chrome) ; vos actions classées en (a) CI ou API, (b) mission, (c) votre geste
  (soumission, publication, engagement auprès d'Apple) : `journal/missions/`.
- **Mode polish dès le 9/11** (décision du 7/11 au soir, (A)) : plus de nouvelle fonction ; bugs, polissage, textes
  en trop, retraits ; une idée de fonction devient une proposition avec maquette (`journal/maquettes/`), jamais codée
  sans votre accord. (B) **intégrations** (seule exception) : Garmin et Samsung, Withings, Huawei (dont Huawei Health
  Kit sur iPhone), Xiaomi. (C) **personas** avant chaque envoi aux testeurs.
- **Nouvel accueil** (8/11, 18:45) : repris sur iPhone (Santé, 6 mois importés, temps d'écran de l'iPhone, visage à
  l'ouverture seulement).
- **Merges et examen bêta** (votre message du 7/11 vers 18:30) : je merge mes PR dès que les garde-fous sont verts ;
  chaque nuit, la dernière build part au groupe « Testeurs Halcya » et à l'examen bêta, jamais la version de l'App
  Store. **Numéro de version fixe** des builds de test (893) pendant le cycle (7/11, 19:35).
- **Déploiement continu** (10/11 vers 09:15, vos mots : « Ceci dit normalement la clé api apple permet à la routine de le faire j'aimerais qu'elle le fasse tout seul pour que le déploiement des nouvelles versions soit le plus continuous possible :) ») : à chaque run, dès que la build
  TestFlight la plus récente est traitée par Apple et n'est pas chez les testeurs externes, je l'ajoute au groupe
  « Testeurs Halcya » et la soumets (accord d'Apple immédiat grâce au même numéro de version), puis je lance le
  nettoyage. Remplace le rythme « chaque nuit ». Les passages des personas continuent, sans bloquer chaque envoi.
- **Nettoyage par la routine** (10/11 vers 09:30, vos mots dans cette session) : « J'autorise la routine à lancer elle-même le nettoyage réel des anciennes builds TestFlight (store-beta-expire.yml, nettoyage coché, essai décoché) après chaque mise d'une nouvelle build chez les testeurs externes, sans me redemander. »
- **Livraison continue** (9/11 vers 11:00, vos mots : « la routine doit expirer les versions précédentes à chaque fois
  qu'une nouvelle version arrive ») : après chaque nouvelle build, j'expire celles qui ne servent plus ; restent la
  build de votre soumission (844.344), la dernière distribuée aux testeurs externes jusqu'à ce que la suivante le soit,
  et celle en examen chez Apple. Une build en examen depuis plus de 24 h cède sa place à une plus récente.
- **« Digestif »** dans les textes visibles ; nom App Store « Halcya — digestion & bien-être » seulement après votre
  soumission (7/11). **Fusion des deux routines** après la soumission (4/11).
- **Cycle** (10/11 vers 18:50, vos mots : « Ok cycle », réponse à la proposition du 10/11 15:15 et à PROP-SIM-10
  d'Android ; exception au mode polish) : Android fait la brique partagée (règles et symptômes rangés sans migration,
  ligne « Règles · 2e jour » du Journal, jour du cycle, saisie à la main, Health Connect) ; ensuite, sur iPhone, la
  lecture des règles et des symptômes notés dans l'app Santé, une ligne de plus dans l'autorisation de Santé et la
  source « Suivi du cycle (Santé) ». Rien ne sort du téléphone ; dans les analyses, le cycle reste un contexte de la
  digestion, jamais une cause ni un diagnostic.

**Ce que vous pouvez voir** : les captures de l'app sur iPhone simulé, refaites à chaque changement :
https://github.com/spreadzenox/HealthTrack-iOS/tree/captures/main

**Ce qui ne pourra pas marcher pareil sur iPhone** (à confirmer, détail dans `PARITE.md`)
- Lecture du visage **au déverrouillage** : iOS ne laisse pas une app utiliser la caméra en arrière-plan → lecture à
  l'ouverture de l'app (comme la version Google Play actuelle), raccourci ou widget à étudier.
- **Temps d'écran** du téléphone : possible seulement **dans l'Union européenne, avec iOS 26.4 ou plus** (règle
  d'Apple) ; ailleurs, la carte le dit et rien ne s'affiche. Écran écrit (PR #105), à essayer sur l'iPhone 12.
- **Montre Huawei** : en attendant, Huawei Santé écrit une partie des mesures (pas, cœur, sommeil, séances) dans l'app
  Santé d'Apple, que Halcya lit déjà. Deux pistes pour aller plus loin, sans verdict pour l'instant : la liaison
  directe en Bluetooth basse consommation (le seul Bluetooth permis aux apps iPhone, celui qu'utilise Huawei Santé
  sur iPhone), à essayer sur l'iPhone 12 ; et le « HUAWEI Health Kit » en ligne (Huawei Santé › Services tiers ›
  Lier), qui laisserait Halcya lire sommeil et cœur depuis votre compte Huawei, avec un léger différé : il faudrait
  un compte développeur Huawei et l'accord de Huawei (jusqu'à 15 jours ouvrés). À décider quand vous voulez
  (détail dans `RECHERCHE.md`, 31/10).
- **Repérer les apps de montre installées** (Garmin, Oura…) : iOS ne laisse pas une app voir les autres apps → la
  montre est reconnue par les données qu'elle écrit dans l'app Santé, et un guide dit quoi activer dans chaque app.

**Ce qui a changé cette semaine**
- **Semaine précédente (S45), en bref** : l'iPhone a suivi Android de la v699 à la v924, chaque version sur TestFlight ;
  build 844.344 attachée à la version 844 pour votre soumission ; numéro de version fixe (893) ; « digestif » ;
  nouvel accueil ; premiers passages des personas sur iPhone ; panne de GitHub du 8/11 surmontée (paquets gardés en
  cache) ; examen bêta de la 918 bloqué par la 896 (détail dans `semaines/2026-S45.md`).
- **Cette semaine, polish sur iPhone** : temps d'écran pas proposé à l'accueil avant iOS 26.4 ; la VFC de l'app Santé
  (Apple Watch) a sa couleur dans le Journal, sa courbe dans Tendances et son « d'habitude » sur Aujourd'hui ; on revient
  en arrière en balayant depuis le bord gauche de l'écran, comme ailleurs sur l'iPhone (13/11, trouvé par une persona) ; Halcya suit la
  taille du texte réglée dans l'iPhone, comme sur Android (13/11) ; l'iPhone
  a suivi Android jusqu'à la v937.

**Runs de la semaine**

| Date (Paris) | Run | Ce qui a été fait | PR |
|---|---|---|---|
| 9/11 01:00 | semaine S46 ouverte ; examen bêta | résumé de la S45 archivé ; la 896.376 est toujours « en attente d'examen » hors du groupe, la 918.396 attend derrière (pas de nouvel essai : Apple refuserait) ; Android : visite guidée avec des pistes dès le jour 14, Gold expliqué en une phrase (sans objet sur iPhone) : v927 reprise, en vérification. Mode polish à partir d'aujourd'hui. Parité : 67 % | PR semaine S46 |
| 9/11 02:00 | suivi d'Android v928 | la 927 part sur TestFlight. Serveur : une analyse IA de repas qui ne reconnaît aucun aliment ne compte plus dans vos analyses restantes, sur Android comme sur iPhone (note de Nouveautés iPhone). Examen bêta : la 896.376 toujours en examen, la 918.396 attend. Parité : 67 % | #390 (mergée), PR v928 |
| 9/11 02:30 | polish : « kca l » du Journal | trouvé pourquoi la correction d'hier ne marchait pas (l'app colle chaque nombre à son unité à l'affichage) : la tuile des repas gagne un peu de place sur les iPhone de 6,1 pouces, « ≈ 1 039 kcal » tient sur une ligne ; la note de Nouveautés qui l'annonçait trop tôt est corrigée. Parité : 67 % | PR polish « kcal » |
| 9/11 03:00 | suivi d'Android v929 ; examen bêta | la 928 est sur TestFlight (calories du Journal sur une ligne). Android v929 : si vous fermez l'appareil photo sans photo, Halcya propose de décrire le repas. Examen bêta : la 896.376 est toujours « en attente d'examen » chez Apple (relevé corrigé : il ne regardait que les 20 dernières builds et l'a crue partie) ; la 918.396 attend votre geste (faire expirer la 896). Parité : 67 % | #391, #392 (mergées), PR v929 |
| 9/11 04:00 | polish : temps d'écran à l'accueil | l'écran « Branchez vos sources » ne propose plus le temps d'écran aux iPhone sous iOS 26.4, qui ne le permettent pas (comme Sources depuis le 7/11) ; Android n'a rien publié ; examen bêta : la 896.376 toujours en examen, la 918.396 attend. Parité : 67 % | #393 (mergée), PR polish |
| 9/11 05:00 | suivi d'Android v931 | Android a réglé de son côté les valeurs coupées du Journal (« kca l ») et rend les onglets lisibles en grande police sur petit écran : notre correction de l'iPhone, devenue inutile, est retirée. La 929 est sur TestFlight. Examen bêta : la 896.376 toujours en examen, la 918.396 attend. Parité : 67 % | PR polish + v931 |
| 9/11 06:00 | rien de neuf | la 931 est sur TestFlight (931.408 : valeurs du Journal entières, pas de temps d'écran à l'accueil avant iOS 26.4). Android n'a rien publié ; captures relues (Sources, Paramètres, Agir, Nouveautés) : rien à corriger. Examen bêta : la 896.376 toujours en examen, la 918.396 attend votre geste. Parité : 67 % | #394 (mergée) |
| 9/11 07:00 | suivi d'Android v933 | boutons d'ajout de l'Accueil lisibles en grande police ; Tendances sans historique, sans boutons de période inutiles. Examen bêta : la 896.376 toujours en examen, la 918.396 attend votre geste. Parité : 67 % | PR v933 |
| 9/11 08:00 | suivi d'Android v934 | la 933 est sur TestFlight. Android v934 : la phrase d'introduction des pages n'a plus l'air d'un titre ; « Version gratuite » dit plus court que vos notes restent. Examen bêta : la 896.376 toujours en examen, la 918.396 attend votre geste. Parité : 67 % | #396 (mergée), PR v934 |
| 9/11 09:00 | suivi d'Android v935 | rien de visible (outil des personas d'Android) ; la 934 part sur TestFlight. Examen bêta : la 896.376 toujours en examen, la 918.396 attend votre geste (faire expirer la 896). Parité : 67 % | #397 (mergée), PR v935 |
| 9/11 10:00 | polish : VFC de l'app Santé | la 935 est sur TestFlight (935.412). Android n'a rien publié. Repéré sur les captures : dans le Journal, la VFC de l'Apple Watch (« VFC (SDNN) ») était grise, sans son icône ; Tendances n'en avait aucune courbe, et la ligne de l'Accueil ouvrait la « VFC nuit », vide sur iPhone → couleur et icône de la VFC, courbe « VFC (SDNN) » ouverte depuis l'Accueil (note de Nouveautés iPhone). Examen bêta : la 896.376 toujours en examen, la 918.396 attend votre geste. Parité : 67 % | PR polish VFC |
| 9/11 11:00 | suivi d'Android v936, v937 | la correction de la VFC (10:00) est mergée et part sur TestFlight. Android v936 : la visite guidée ne blanchit plus le bas de l'écran ; v937 : sur Aujourd'hui, la VFC d'hier dit son « d'habitude ». Sur iPhone, la VFC vient de l'app Santé (Apple Watch) sous une autre forme, que ce calcul ne lisait pas : elle a maintenant sa propre habitude, sur Aujourd'hui et dans le Journal (note de Nouveautés iPhone). Examen bêta : la 896.376 toujours en examen, la 918.396 attend votre geste. Parité : 67 % | #399 (mergée), PR v937 |
| 9/11 12:00 | livraison continue ; suivi d'Android v939 | votre décision « expire la 896 » et la règle de livraison continue : outil d'expiration écrit, testé et mergé (il garde toujours la 844.344, la build des testeurs et celle en examen) ; essai à blanc juste ; **l'expiration elle-même a été bloquée par les permissions de ma session** : rien n'est expiré, votre geste en tête. La 937 est sur TestFlight (937.414). Android v939 : Analyses, « pt » expliqué et « Comment c'est calculé » en deux phrases (aussi sur iPhone). Parité : 67 % | #401 (mergée), PR v939 |
| 9/11 13:00 | suivi d'Android v940 ; livraison continue en attente | la 896.376 est toujours en examen chez Apple (votre geste de 12:15 attendu : lancer l'expiration, ou me donner la permission). Android v940 : dans le Journal, la tuile Repas dit « repas incomplets ? » quand les repas notés sont bien en dessous de la dépense du jour (aussi sur iPhone). Notre correctif de la VFC de l'app Santé refait sur ce code. Parité : 67 % | PR v939 + v940 |
| 9/11 14:00 | livraison continue : outil plus prudent | la 940 est sur TestFlight (940.416 : « repas incomplets ? », « pt » expliqué). Android n'a rien publié. La 896.376 est toujours en examen chez Apple : votre geste de 12:15 reste attendu. L'outil d'expiration garde maintenant aussi une build déjà dans le groupe des testeurs et pas encore soumise (la 918.396), pour qu'un nettoyage ne la retire jamais avant son examen. Captures des écrans vides relues : rien à corriger. Parité : 67 % | PR outil + journal |
| 9/11 15:00 | suivi d'Android v941, v942 | « Décrire un repas » ouvre directement le champ à écrire ; sous « En une phrase », la note de bien-être dit ce qu'elle fait de votre phrase (rien n'est gardé). Aussi sur iPhone. Essai à blanc du nettoyage : la 918.396 est bien gardée (141 anciennes builds à expirer). La 896.376 toujours en examen : votre geste de 12:15 attendu. Parité : 67 % | #403 (mergée), PR v942 |
| 9/11 16:00 | suivi d'Android v943 | profil nutrition : le niveau d'activité automatique dit « d'après vos pas » (sur iPhone, les pas de l'app Santé). La 942 part sur TestFlight. La 896.376 toujours en examen : votre geste de 12:15 attendu. Parité : 67 % | #404 (mergée), PR v943 |
| 9/11 17:00 | suivi d'Android v944 | Tendances : une ligne de repère à chaque graduation (aussi sur la courbe de la VFC de l'Apple Watch). La 943 part sur TestFlight, la 942 y est (942.418). La 896.376 toujours en examen : votre geste de 12:15 attendu. Parité : 67 % | #405 (mergée), PR v944 |
| 9/11 18:00 | v944 livrée | la v944 (grille de Tendances) est mergée et part sur TestFlight ; la 943 y est (943.419). Android n'a rien publié depuis. La 896.376 toujours en examen chez Apple : votre geste de 12:15 reste attendu (lancer l'expiration ou me donner la permission) ; sans lui, la soumission de cette nuit aux testeurs externes ne pourra pas partir. Parité : 67 % | #406 (mergée) |
| 9/11 19:00 | suivi d'Android v945, v946 | la 944 est sur TestFlight (944.420). Android : le chiffre de la note de bien-être choisie ressort mieux ; dans Agir, un essai proposé dit quoi faire (« Dormir au moins 7 h 53 »). Aussi sur iPhone. La 896.376 toujours en examen : votre geste de 12:15 attendu avant l'envoi de cette nuit. Parité : 67 % | PR v946 |
| 9/11 20:00 | examen bêta débloqué ; suivi d'Android v950 | la 896.376 n'est plus en examen : **la 918.396 est soumise à l'examen bêta d'Apple** (20:02) ; les testeurs gardent la 839.337 en attendant. La 946 est sur TestFlight (946.422). Android v950 : dans Agir, chaque essai a pour titre ce qu'il faut faire. Android prolonge son gel des envois aux testeurs jusqu'au 10/11 au soir. Reste votre geste pour le nettoyage des anciennes builds. Parité : 67 % | #408 (mergée), PR v950 |
| 9/11 21:00 | v950 livrée ; nettoyage refusé | votre « 896 expirée » confirmé par le relevé ; la 918.396 attend l'examen d'Apple (soumise à 20:02). La v950 (Agir : chaque essai a pour titre sa consigne) est mergée et part sur TestFlight. Le nettoyage des anciennes builds, lancé une fois comme vous l'avez demandé, a été refusé par ma session : votre geste en tête. Parité : 67 % | #410 (mergée) |
| 9/11 22:00 | suivi d'Android v952 | la 950 est sur TestFlight (950.424). Android v952 : sur la page d'un essai (Agir), les 14 jours numérotés en deux semaines. La 918.396 attend toujours l'examen d'Apple ; le nettoyage des anciennes builds attend votre geste. Parité : 67 % | PR v952 |
| 9/11 23:00 | suivi d'Android v953 ; examen en cours | **Apple examine la 918.396** (« en cours d'examen »). La v952 est mergée et part sur TestFlight. Android v953 : sur la page d'un essai, le résultat passe avant le calendrier. Pas d'Alpha d'Android cette nuit (gel jusqu'au 10/11 au soir) : rien d'autre à soumettre. Le nettoyage des anciennes builds attend toujours votre geste. Parité : 67 % | #412 (mergée), PR v953 |
| 10/11 00:00 | 918.396 chez les testeurs ; suivi d'Android v954 | **Apple a accepté la 918.396** : le lien public des testeurs la donne (même version que les testeurs Android). La 953 est sur TestFlight (953.427). Android v954 : le résultat d'un essai est dessiné dès le premier jour. Pas de soumission cette nuit (Android en pause d'Alpha, versions alignées). Le nettoyage des anciennes builds attend votre geste. Parité : 67 % | #413 (mergée), PR v954 |
| 10/11 01:00 | suivi d'Android v955 | la v954 est mergée et part sur TestFlight. Android v955 : sur la page d'un essai, le graphique « Avec / Sans » sur une même échelle et une phrase qui dit l'écart et sa fourchette. Les testeurs externes ont la 918.396. Le nettoyage des anciennes builds attend votre geste. Parité : 67 % | #415 (mergée), PR v955 |
| 10/11 02:00 | suivi d'Android v956 | la 955 est sur TestFlight (955.430). Android v956 : la réintroduction guidée se range sous Agir (retour « ← Agir »). Les testeurs externes ont la 918.396. Le nettoyage des anciennes builds attend votre geste. Parité : 67 % | #416 (mergée), PR v956 |
| 10/11 03:00 | v956 livrée | la v956 (réintroduction rangée sous Agir, retour « ← Agir » vu sur la capture) est mergée et part sur TestFlight. Android n'a rien publié depuis. Les testeurs externes ont la 918.396. Le nettoyage des anciennes builds attend votre geste. Parité : 67 % | #417 (mergée) |
| 10/11 04:00 | suivi d'Android v957 | la 956 est sur TestFlight (956.431). Android v957 : au premier jour, la barre « 0/28 jours » se voit vide (elle paraissait pleine, aussi sur iPhone). Les testeurs externes ont la 918.396. Le nettoyage des anciennes builds attend votre geste. Parité : 67 % | PR v957 |
| 10/11 05:00 | suivi d'Android v958, v959 | la v957 est mergée (barre « 0/28 jours » vide sur la capture iPhone) et part sur TestFlight. Android : Tendances dit la durée de la nuit même ; Nutrition, « Votre profil » plus compact. Les testeurs externes ont la 918.396. Le nettoyage des anciennes builds attend votre geste. Parité : 67 % | #419 (mergée), PR v959 |
| 10/11 06:00 | v959 livrée | la v959 (Nutrition : « Votre profil » resserré, vu sur la capture) est mergée et part sur TestFlight ; la 957 y est (957.433). Android n'a rien publié depuis. Les testeurs externes ont la 918.396. Ce soir, après l'Alpha d'Android (fin de son gel à 22:00) : passage des personas sur iPhone, puis soumission de la dernière build aux testeurs. Le nettoyage des anciennes builds attend votre geste. Parité : 67 % | #420 (mergée) |
| 10/11 07:00 | suivi d'Android v960, v961 | la 959 est sur TestFlight (959.434). Android : seuls les chiffres gardent leur police à chasse fixe (« 6 h 30 » sans grands blancs) ; les étiquettes reprennent la police du texte. Aussi sur iPhone ; deux de nos tests adaptés. Les testeurs externes ont la 918.396. Parité : 67 % | #421 (mergée), PR v961 |
| 10/11 08:00 | suivi d'Android v962 | la v961 est mergée (« 6 h 30 » sans grands blancs sur la capture) et part sur TestFlight. Android v962 : page d'abonnement, les mots dans la police du texte. Les testeurs externes ont la 918.396. Parité : 67 % | #422 (mergée), PR v962 |
| 10/11 09:00 | v962 livrée | la v962 (abonnement : « premium » dans la police du texte, vu sur la capture) est mergée et part sur TestFlight ; la 961 y est (961.436). Android n'a rien publié depuis. Les testeurs externes ont la 918.396. Parité : 67 % | #423 (mergée) |
| 10/11 09:00 (suite) | 959.434 chez les testeurs | relevé de 08:00 UTC : le groupe « Testeurs Halcya » ne contient plus que la **959.434, acceptée par Apple et en test** ; 918.396 et 839.337 en sont retirées (sans être expirées). Ce n'est pas un lancement de ma part (geste fait dans App Store Connect, par vous a priori). 159 builds actives : le nettoyage en expirerait 156 (restent 844.344, 959.434 et la plus récente). | journal |
| 10/11 10:00 | nettoyage fait | avec votre autorisation (« sans me redemander ») : **157 anciennes builds expirées** ; restent 844.344, 959.434 (testeurs) et 962.437 (la plus récente, sur TestFlight). Je relancerai le nettoyage après chaque nouvelle build mise chez les testeurs externes. Parité : 67 % | journal |
| 10/11 11:00 | déploiement continu | vos décisions de 09:05 (« déployé instantanément ») et 09:15 (« le plus continuous possible ») appliquées : la **962.437 soumise et acceptée en une minute**, chez les testeurs externes ; nettoyage : la 959.434 expirée ; restent 844.344 et 962.437. Android : gel Alpha levé, rien de changé dans l'app (v965 suivie). Parité : 67 % | PR v965 |
| 10/11 12:00 | suivi d'Android v968 | Android : sur l'écran de la montre et pendant l'accueil, les mots reprennent la police du texte. Sur iPhone, notre adaptation de l'accueil (« Import de vos 6 derniers mois ») refaite sur ce code ; note de Nouveautés iPhone. La v965 et la v968 partent ensemble. Les testeurs externes ont la 962.437. Parité : 67 % | PR v965 + v968 |
| 10/11 13:00 | suivi d'Android v969 | la v968 est mergée (accueil iPhone « 6 derniers mois » conservé) et part sur TestFlight puis chez les testeurs. Android v969 : la note du jour s'écrit « 3,2 » sans blancs autour de la virgule. Parité : 67 % | #428 (mergée), PR v969 |
| 10/11 13:00 (suite) | déploiement continu, 2e tour | la **968.442** est chez les testeurs depuis 12:12 (accord d'Apple en une minute) ; la 962.437 expirée. La v969 (« 3,2 ») est mergée et suit le même chemin. Android v970 : rien dans l'app (scripts d'envoi) ; reprise avec sa prochaine version qui change l'app, pour ne pas envoyer aux testeurs une build identique. Parité : 67 % | #429 (mergée) |
| 10/11 14:00 | personas du jour | la 969.443 est chez les testeurs (13:14) ; Android n'a rien changé dans l'app. Passage des personas sur la version 969 : une femme atteinte d'endométriose, iPhone seul, 14e jour ; elle note sa digestion, voit sa courbe et prépare le rapport PDF, mais ne trouve aucun endroit pour son cycle. Constats relayés à Android ; idée propre à l'iPhone (lire le cycle de l'app Santé) gardée pour une proposition. Parité : 67 % | journal |
| 10/11 15:00 | suivi d'Android v972 | Android v972 : dans Analyses, un lien pas assez net a maintenant son chiffre en gris (le hachurage ne se voyait pas sur les petites barres). Les v970 et v971 (scripts et captures de la fiche Play) ne changeaient rien à l'app : suivies avec elle. Les testeurs externes ont la 969.443 ; la 972 partira chez eux dès sa build traitée. **Proposition** (rien codé) : lire le cycle déjà noté dans l'app Santé (règles, crampes, ballonnements), deux maquettes ; votre réponse attendue. Parité : 67 % | #433 (mergée), #432 |
| 10/11 16:00 | v972 livrée | la v972 (chiffre gris d'un lien pas assez net dans Analyses) est mergée après les trois vérifications et les captures, puis part seule : TestFlight (972.447), fiche, ajout au groupe « Testeurs Halcya » et examen bêta. Android n'a rien publié depuis. Parité : 67 % | #432 (mergée) |
| 10/11 17:00 | 972.447 chez les testeurs | Apple a accepté la **972.447** : elle est chez les testeurs externes depuis 16:36. Nettoyage : la 969.443 expirée ; restent 844.344 (votre soumission) et 972.447. La chaîne automatique s'était arrêtée au relevé (une commande de GitHub refusée par le réseau de la session) : corrigée, la suite faite à la main. La note « À tester » des testeurs, relue : toujours juste. Parité : 67 % | journal |
| 10/11 18:00 | suivi d'Android v974 | Android v973 : Analyses s'ouvre sur Digestion pour qui suit sa digestion ou son cycle. Android v974 : dans le Journal, toucher une mesure du jour ouvre sa courbe ; sur iPhone, la VFC de l'app Santé ouvre la sienne (elle n'en aurait pas eu sans retouche). Les testeurs externes ont la 972.447 ; la 974 suivra dès sa build traitée. Parité : 67 % | #436 (mergée) |
| 10/11 19:00 | suivi d'Android v975 | Android v975 : dans le Journal, une note de digestion se modifie sur place (Calme, Gêne ou Douleur), l'heure gardée. La v974 part la première chez les testeurs, la 975 la suit. Parité : 67 % | #437 (mergée) |
| 10/11 20:00 | cycle, 1re étape iPhone | Votre « Ok cycle » est arrivé. Android a posé la brique commune (rien d'affiché encore) ; côté iPhone, l'app sait maintenant lire dans Santé les règles et cinq symptômes (crampes, douleur pelvienne, ballonnements, maux de tête, fatigue). Rien ne change à l'écran tant que l'autorisation n'est pas demandée (prochaine étape) et qu'Android n'affiche pas le cycle. Et l'autorisation : si vous cochez « Mon cycle », la demande de Santé d'Apple inclut le cycle, dans la même fenêtre ; cochée plus tard dans les Paramètres, une petite demande pour le cycle seul. Jamais sans « Mon cycle », et rien ne sort du téléphone. La 975.451 est chez les testeurs depuis 20:17. Parité : 67 % | #438 (mergée), #439 |
| 10/11 22:00 | cycle visible sur iPhone | Android affiche maintenant le cycle dans le Journal (« Règles · 2e jour · flux moyen », jour du cycle) et a ajouté constipation et diarrhée à notre demande. Sur iPhone, avec « Mon cycle », les règles et symptômes notés dans Santé s'y affichent ; note de Nouveautés. La 1re étape iPhone (#439) avait un blocage trouvé par la build (la synchro de Santé s'arrêtait au cycle) : corrigé, testé. Parité : 67 % | #439 (mergée), #440 (mergée) |
| 10/11 23:00 | règles notées à la main | Android v980 : avec « Mon cycle », un bouton « Règles » dans le bandeau d'ajout d'Aujourd'hui (Léger, Moyen, Abondant). Sur iPhone, il s'ajoute à la lecture de Santé. La v979 (#440, cycle de Santé dans le Journal) est mergée et part chez les testeurs. Parité : 67 % | #440 (mergée), #441 (mergée) |
| 10/11 23:20 | cycle dans Sources | Dans Sources, « cycle » apparaît parmi ce que Santé envoie ; et une carte « Suivi du cycle (Santé) » propose, une fois, de lire le cycle à qui avait déjà coché « Mon cycle » avant ce soir (les testeurs actuels). Parité : 67 % (31/46) | #442 (mergée) |
| 11/11 00:00 | suivi d'Android v981 | La 980.455 est chez les testeurs depuis 23:57 (règles notées depuis Aujourd'hui). Android v981 : dans le Journal, une règle notée à la main se corrige ou se supprime ; celles qui viennent de Santé restent telles que Santé les donne. Parité : 67 % (31/46) | #443 (mergée) |
| 11/11 01:00 | 981.457 chez les testeurs | Les testeurs ont eu la 980.456 à 00:48 (cycle dans Sources), puis la **981.457** à 01:39 (règles notées à la main corrigeables dans le Journal). Chaque envoi : accord d'Apple en une minute, ancienne build expirée ; restent 844.344 et 981.457. Android n'a rien publié depuis. Parité : 67 % (31/46) | journal |
| 11/11 02:00 | suivi d'Android v983 | Android v982 : dans « Mes règles », les symptômes du cycle se notent en un geste (crampes, ballonnements, fatigue…) ; sur iPhone, ils s'ajoutent à ceux lus dans Santé. v983 : un test d'Android réparé. Les testeurs ont la 981.457 ; la 983 suit. Parité : 67 % (31/46) | #445 (mergée) |
| 11/11 03:00 | suivi d'Android v984 | Android v984 : dans « Mes règles », « Hier » pour noter les règles et symptômes de la veille. La 983 part chez les testeurs. Parité : 67 % (31/46) | #446 (mergée) |
| 11/11 04:00 | 984.460 chez les testeurs | La 983.459 (symptômes du cycle en un geste) est arrivée chez les testeurs à 03:15, puis la **984.460** (« Hier » dans « Mes règles ») à 04:08 ; les anciennes builds expirées ; restent 844.344 et 984.460. Android n'a rien publié depuis. Parité : 67 % (31/46) | journal |
| 11/11 05:00 | suivi d'Android v986 | Android v985 : la 2e carte de l'accueil dit « Trois usages » (Journal, Analyses, Agir). v986 : une seule durée d'essai (réintroduction 3 jours, piste deux semaines). Les testeurs ont la 984.460 ; la 986 suivra. Parité : 67 % (31/46) | #448 (mergée) |
| 11/11 06:00 | suivi d'Android v987 | Android v987 : l'app renvoie à « Réglages › Paramètres » (la roue en haut à droite). Sur iPhone, « Réglages » est aussi l'app d'Apple : proposition à Android d'écrire « la roue en haut à droite › Paramètres ». La 986 part chez les testeurs. Parité : 67 % (31/46) | #449 (mergée) |
| 11/11 07:00 | suivi d'Android v988 | La 986.462 est chez les testeurs depuis 06:12. Android v988 : « Autre chose » ne note plus une cigarette par erreur ; il propose « Je fume : compter mes cigarettes ». La 987 part chez les testeurs. Parité : 67 % (31/46) | #450 (mergée) |
| 11/11 08:00 | personas du jour | Les testeurs ont la 988.464 depuis 07:58. Passage des personas sur cette version, avec la femme atteinte d'endométriose d'hier (iPhone seul, 14e jour) : elle note maintenant ses règles, ses crampes, la veille, corrige le flux, et retrouve tout dans le Journal (5 tâches sur 6, contre 3 hier). Ce qui manque encore : que les analyses de la digestion tiennent compte du cycle (prévu chez Android), et un mot du cycle sur l'Accueil. Relayé à Android. Parité : 67 % (31/46) | journal |
| 11/11 09:00 | rien de neuf | Android v989 ne touche que son outil des personas, pas l'app : reprise avec sa prochaine version qui change l'app. Les testeurs ont la 988.464. Rien n'attend de vous. Parité : 67 % (31/46) | journal |
| 11/11 10:00 | suivi d'Android v990 | Android v990 : le soir, la fenêtre « Ma digestion » ne pose plus qu'une question à la fois (le bilan de la journée, ou un moment précis). Les testeurs ont la 988.464 ; la 990 suivra. Parité : 67 % (31/46) | #453 (mergée) |
| 11/11 11:00 | suivi d'Android v991 | Android v991 : sur Aujourd'hui, la note de bien-être n'est plus répétée dans « Vos données du jour ». La 990 part chez les testeurs. Parité : 67 % (31/46) | #454 (mergée) |
| 11/11 12:00 | suivi d'Android v992 | La 990.467 est chez les testeurs depuis 11:15. Android v992 : dans « Mes règles », un symptôme touché se coche et la fenêtre dit « Noté » (ce que la persona d'hier ne voyait pas). La 991 part chez les testeurs. Parité : 67 % (31/46) | #455 (mergée) |
| 11/11 13:00 | suivi d'Android v993 | La 991.468 est chez les testeurs depuis 12:15 ; la 992 suit. Android v993 : un aliment que la base ne connaît pas est nommé dans le total du repas (« ≈ 592 kcal, sans Sauce maison ») au lieu d'être ignoré. Parité : 67 % (31/46) | #456 (mergée) |
| 11/11 14:00 | suivi d'Android v994 | La 992.469 est chez les testeurs depuis 13:16 ; la 993 suit. Android v994 : votre poids a sa courbe dans Journal › Tendances (sur iPhone, les pesées de l'app Santé comprises) ; une retouche iPhone refaite pour garder la VFC de Santé à sa place. Parité : 67 % (31/46) | #457 (mergée) |
| 11/11 15:00 | suivi d'Android v995 | Les testeurs ont eu la 993.470 à 14:16 puis la **994.471** à 14:57 (courbe du poids). Android v995 : le nom d'un repas se modifie (après l'analyse ou plus tard). Parité : 67 % (31/46) | #458 (mergée) |
| 11/11 16:00 | suivi d'Android v996 | Les testeurs ont la **995.472** depuis 16:22 (le nom d'un repas se modifie) ; la 994.471 expirée. Android v996 : dans Analyses, un lien qui change de sens selon le délai, sans être net, est dit en une ligne (rien à en tirer pour l'instant). Parité : 67 % (31/46) | #459 (mergée) |
| 11/11 17:00 | suivi d'Android v997 | Android v997 : à l'accueil, sans l'app Santé, « Ce que vous noterez » suit votre objectif (poids, règles, digestion). Sa note de Nouveautés parlait de « Health Connect » : remplacée sur iPhone par « Sans l'app Santé… ». La v996 (#459) part chez les testeurs. Parité : 67 % (31/46) | #460 (mergée) |
| 11/11 18:00 | 997.474 chez les testeurs | Les testeurs ont eu la 996.473 à 17:48 (Analyses : un lien flou est dit), puis la **997.474** à 18:39 (accueil : « Ce que vous noterez » suit votre objectif) ; anciennes builds expirées, restent 844.344 et 997.474. Android v998 ne touche que son outil de personas : rien dans l'app, suivie avec la prochaine version. Parité : 67 % (31/46) | #461 (mergée) |
| 11/11 19:00 | suivi d'Android v999 | Android v999 : « Voir un exemple » part de l'écran où vous êtes (Analyses › Digestion montre l'exemple de la digestion) ; Vos données dit que la sauvegarde est un fichier JSON. Sur iPhone, la ligne dit aussi où la retrouver : l'app Fichiers › Sur mon iPhone › Halcya (au lieu de « Documents », qui n'existe pas dans Fichiers). Parité : 67 % (31/46) | #462 (mergée) |
| 11/11 20:00 | suivi d'Android v1000 | Les testeurs ont la **999.476** depuis 20:23 (« Voir un exemple » part de l'écran où vous êtes ; la sauvegarde dit où la retrouver dans l'app Fichiers) ; la 997.474 expirée, restent 844.344 et 999.476. Android v1000 : l'exemple de la digestion n'affiche plus un bandeau « masqué » en trop. Parité : 67 % (31/46) | #463 (mergée) |
| 11/11 22:00 | 1000.477 chez les testeurs | Les testeurs ont la **1000.477** depuis 22:10 (l'exemple de la digestion sans bandeau en trop), avec une heure de retard : une panne de GitHub a laissé la build « en cours » alors qu'elle était déjà chez Apple ; j'ai repris le déploiement à la main. La 999.476 expirée, restent 844.344 et 1000.477. Android n'a rien publié de plus. Parité : 67 % (31/46) | #464 (mergée) |
| 11/11 23:00 | suivi d'Android v1002 | Android v1001 : dans la visite guidée, l'étiquette « Exemple » ne cache plus le nom de l'app. v1002 : le compteur de la digestion dit « pas forcément d'affilée » (un jour oublié ne remet rien à zéro). La panne de GitHub de ce soir avait aussi mis la build de contrôle en rouge (alors que l'app était bonne) : corrigé comme pour TestFlight. Parité : 67 % (31/46) | #465 (mergée) |
| 12/11 00:00 | suivi d'Android v1003 | Les testeurs ont la **1002.479** depuis 00:17 (compteur de la digestion « pas forcément d'affilée ») ; la 1000.477 expirée. Android v1003 : dans la visite, le bouton dit « Exemple au jour 14 ». Parité : 67 % (31/46) | #466 (mergée) |
| 12/11 01:00 | 1003.480 chez les testeurs | La **1003.480** (« Exemple au jour 14 » dans la visite, dernière version d'Android du 11/11) est chez les testeurs, examen accepté ; la 1002.479 expirée, restent 844.344 et 1003.480. Elle tient lieu d'examen bêta de la nuit. | — |
| 12/11 02:00 | suivi d'Android v1004 | Android v1004 : dans Tendances, le détail d'un jour suit la mesure affichée (pas de lectures du visage sous Sommeil ou Pas) ; un lien pas assez net est hachuré, comme dans Analyses. La session a manqué de place disque cette nuit (copies des captures accumulées) : nettoyée, rien de perdu. Parité : 67 % (31/46) | #467 (mergée) |
| 12/11 03:00 | suivi d'Android v1005 | La v1004 (#467) part chez les testeurs. Android v1005 : sur Aujourd'hui, toucher « Bien-être aujourd'hui » ouvre Tendances sur la journée, heure par heure. Parité : 67 % (31/46) | #468 (mergée) |
| 12/11 04:00 | suivi d'Android v1006 | Les testeurs ont eu la 1004.481 à 03:17 (Tendances), puis la **1005.482** à 04:05 (« Bien-être aujourd'hui » ouvre la journée) ; restent 844.344 et 1005.482. Android v1006 : dans Sources, l'heure des dernières mesures d'un total de pas est juste ; valable aussi sur iPhone (note ajoutée). Parité : 67 % (31/46) | #469 (mergée) |
| 12/11 05:00 | suivi d'Android v1007 | La v1006 (#469) part chez les testeurs. Android v1007 : dans Nutrition, la carte du profil dit à quoi il sert (sexe, âge, taille, poids règlent vos repères). Un correctif iPhone (le poids lu dans Santé) refait pour cette version, sans changement pour vous. Parité : 67 % (31/46) | #470 (mergée) |
| 12/11 06:00 | suivi d'Android v1008 | Les testeurs ont la **1006.483** depuis 05:15 (Sources : l'heure des dernières mesures) ; la v1007 (#470) est en route. Android v1008 : les champs de saisie des réglages et du profil à 44 px de haut, la cible au doigt que recommande aussi Apple. Parité : 67 % (31/46) | #471 (mergée) |
| 12/11 07:00 | personas du jour | Les testeurs ont la **1007.484** depuis 06:11 ; la v1008 (#471) part à son tour. Passage des personas sur iPhone : une femme qui veut maigrir, iPhone + Apple Watch, 14e jour. Rien de propre à l'iPhone ; elle cherche le poids sur l'Accueil (absent, seulement dans le profil de Nutrition), un objectif et un repère de calories, et trouve Analyses décevant au 14e jour : relayé à Android. Parité : 67 % (31/46) | #472 (mergée) |
| 12/11 07:05 | suivi d'Android v1009 | Android v1009 : un réglage interne (un module natif déclaré deux fois) ; rien de visible. Le nouveau contrôle d'Android a trouvé le même défaut dans nos outils de captures iPhone : corrigé. La v1008 (#471) part chez les testeurs. Parité : 67 % (31/46) | #473 (mergée) |
| 12/11 08:00 | un plugin enregistré une fois | Les testeurs ont la **1008.485** depuis 07:17 ; la v1009 (#473) part à son tour. La console de la build de captures montrait encore l'abonnement de l'App Store déclaré deux fois : corrigé (rien de visible pour vous) ; un autre doublon, dans le code partagé, signalé à Android. Parité : 67 % (31/46) | #474 (mergée) |
| 12/11 09:00 | suivi d'Android v1010 | Les testeurs ont la **1009.487** depuis 08:28 ; la build avec l'abonnement corrigé (#474) suit. Android v1010 : dans un Journal encore vide, « Noter ma digestion » ouvre directement la note. Parité : 67 % (31/46) | #475 (mergée) |
| 12/11 10:00 | suivi d'Android v1012 | Les testeurs ont la **1009.488** depuis 09:27 (abonnement corrigé) ; la v1010 (#475) part à son tour. Android v1012 : le bloc digestion d'Aujourd'hui n'annonce plus « analyses prêtes » tant qu'aucun lien net n'est trouvé. Parité : 67 % (31/46) | #476 (mergée) |
| 12/11 11:00 | suivi d'Android v1013 | Les testeurs ont eu la 1010.489 à 10:21 (Journal vide), puis la **1012.490** à 11:22 (bloc digestion honnête). Android v1013 : dans Sources, une app qui ne partage pas une mesure le dit au lieu de proposer de l'activer ; trois correctifs iPhone refaits pour cette version, sans changement pour vous. Parité : 67 % (31/46) | #477 (mergée) |
| 12/11 12:00 | suivi d'Android v1014 | La v1013 (#477) part chez les testeurs (Sources vérifié : la VFC de Santé compte, phrase de l'Apple Watch juste). Android v1014 : dans Analyses, la ligne de l'unité dit ce que veut dire le « + » (meilleur bien-être, plus de confort digestif) et la note de chaque niveau de digestion. Parité : 67 % (31/46) | #478 (mergée) |
| 12/11 13:00 | suivi d'Android v1015 | Les testeurs ont la **1013.491** depuis 12:17 ; la v1014 (#478) part à son tour. Android v1015 : à l'ouverture du Journal, la tuile Repas n'affiche plus un faux « 1 » le temps de calculer les kcal. Parité : 67 % (31/46) | #479 (mergée) |
| 12/11 14:00 | suivi d'Android v1016 | Les testeurs ont la **1014.492** depuis 13:19 (sens du « + » dans Analyses) ; la v1015 (#479) part à son tour. Android v1016 : dans Tendances, la note de chaque niveau de digestion sous la courbe. Parité : 67 % (31/46) | #480 (mergée) |
| 12/11 15:00 | 1015.493 chez les testeurs | Les testeurs ont la **1015.493** depuis 14:24 (tuile Repas sans faux « 1 ») ; la v1016 (#480) part à son tour. Android n'a rien publié de plus. Parité : 67 % (31/46) | #481 (mergée) |
| 12/11 16:00 | suivi d'Android v1017 | Les testeurs ont la **1016.494** depuis 15:27 (échelle de la digestion dans Tendances). Android v1017 : dans Analyses, « Lactose », « Fructanes » ou « GOS » sont dits groupes FODMAP. Parité : 67 % (31/46) | #482 (mergée) |
| 12/11 17:00 | missions navigateur | Votre décision de 16:15 est appliquée sur iPhone : vos actions classées et deux missions pour Claude dans Chrome, PI1 (relevé des abonnements, lecture seule) et PI2 (soumission préparée jusqu'au dernier bouton). La v1017 (#482) attendait un Mac libre chez GitHub : build relancée. Parité : 67 % (31/46) | #483 (mergée) |
| 12/11 18:00 | suivi d'Android v1019 | La v1017 (#482) part chez les testeurs (deux machines Mac introuvables chez GitHub, relancées). Android v1019 : dans Données, le rapport PDF ne propose plus le bien-être de la caméra sans lecture du visage, et la sauvegarde ne dit où est le fichier qu'après l'export ; dans Analyses, ce qui reste à noter pour le long terme. Parité : 67 % (31/46) | #484 (mergée) |
| 12/11 19:00 | 1017.497 chez les testeurs | Les testeurs ont la **1017.497** depuis 18:46 (groupes FODMAP nommés dans Analyses) ; la v1019 (#484) part à son tour (Données vérifié : « Un fichier JSON, à garder en lieu sûr. »). Android n'a rien changé de plus dans l'app. Parité : 67 % (31/46) | #485 (mergée) |
| 12/11 20:00 | 1019.498 chez les testeurs | Les testeurs ont la **1019.498** depuis 19:34 (Données : rapport et sauvegarde plus clairs) ; restent 844.344 et 1019.498. Android n'a rien publié de plus. Parité : 67 % (31/46) | #486 (mergée) |
| 12/11 21:00 | rien de neuf | Android n'a pas publié de nouvelle version ; les testeurs gardent la **1019.498**. Toutes les vérifications de l'iPhone sont vertes. En attente de votre « PI1 fait ». Parité : 67 % (31/46) | #487 (mergée) |
| 12/11 22:00 | rien de neuf | Android n'a toujours rien publié depuis la v1019 ; les testeurs gardent la **1019.498**. Parité : 67 % (31/46) | #488 (mergée) |
| 12/11 23:00 | rien de neuf | Android n'a rien publié depuis la v1019 (17:00) ; les testeurs gardent la **1019.498**. Parité : 67 % (31/46) | #489 (mergée) |
| 13/11 00:00 | examen bêta de la nuit | Android n'a rien publié depuis 18:06 (passation de ses routines) : sa dernière version du 12/11 est la v1019, déjà chez les testeurs (**1019.498**, examen d'Apple accepté à 19:34). Rien d'autre à envoyer cette nuit. Parité : 67 % (31/46) | PR du journal |
| 13/11 01:00 | attente | Android n'a rien publié depuis la v1019 (12/11) ; l'iPhone est au même niveau (**1019.498** chez les testeurs). Rien à faire cette heure. Parité : 67 % (31/46) | PR du journal |
| 13/11 02:00 | attente | Rien de neuf chez Android ; l'iPhone reste au même niveau (**1019.498** chez les testeurs). Parité : 67 % (31/46) | PR du journal |
| 13/11 03:00 | attente | Rien de neuf chez Android ; l'iPhone reste au même niveau (**1019.498** chez les testeurs). Parité : 67 % (31/46) | PR du journal |
| 13/11 04:00 | attente | Rien de neuf chez Android ; l'iPhone reste au même niveau (**1019.498** chez les testeurs). Parité : 67 % (31/46) | PR du journal |
| 13/11 05:00 | attente | Rien de neuf chez Android depuis hier 18:06 (11 h, inhabituel : signalé à l'orchestrateur) ; l'iPhone reste au même niveau (**1019.498** chez les testeurs). Parité : 67 % (31/46) | PR du journal |
| 13/11 06:00 | personas du jour ; geste de retour | une persona « stressée et pressée » (iPhone + Apple Watch, 14e jour) a joué la version des testeurs : la note du jour en 4 touchers lui plaît, mais l'app ne lui dit ni comment elle va ni quoi faire contre le stress (9 constats transmis à Android). Propre à l'iPhone : aucun moyen de revenir depuis Réglages, Paramètres et Données → corrigé : on revient en balayant depuis le bord gauche de l'écran (test sur simulateur vert). Parité : 67 % (31/46) | #496 |
| 13/11 07:00 | geste de retour livré | le retour par balayage est mergé et chez les testeurs : **1019.510** depuis 07:21 (accord d'Apple immédiat), l'ancienne 1019.498 expirée ; restent 844.344 (votre soumission) et 1019.510. Android n'a toujours rien publié depuis hier 18:06. Parité : 67 % (31/46) | #496, PR du journal |
| 13/11 08:00 | taille du texte de l'iPhone | Android n'a toujours rien publié ; j'ai repris un écart connu depuis le 4/11 : sur Android, Halcya suit la taille du texte choisie dans le téléphone, sur iPhone non. Correction en cours de vérification sur simulateur (captures en très grand texte) ; elle partira aux testeurs ensuite. Parité : 67 % (31/46) | #499 (en cours) |
| 13/11 09:00 | taille du texte, 2e essai | les captures en très grand texte montraient deux onglets du Journal qui se chevauchent et « Aujourd'hui » coupé dans la barre du bas : j'agrandis maintenant le texte de la même façon qu'Android, pour que ses réglages de mise en page jouent aussi sur iPhone. Nouvelle vérification sur simulateur en cours. Parité : 67 % (31/46) | #499 (en cours) |
| 13/11 10:00 | taille du texte livrée | vérifiée sur simulateur en très grand texte (onglets, barre du bas, réglages : tout tient) et mergée ; chez les testeurs depuis 10:29 (**1019.513**, l'ancienne 1019.510 expirée). Halcya suit maintenant la taille du texte réglée dans l'iPhone, comme sur Android. Android n'a toujours rien publié. Parité : 68 % (32/47) | #499 |
| 13/11 11:00 | parité recomptée | deux lignes du tableau de parité étaient en retard : le test externe sur TestFlight (en place depuis le 9/11) compte maintenant comme fait ; la protection des crédits IA de l'iPhone est prête mais reste à essayer sur un vrai iPhone. Parité : **70 %** (33/47). Android n'a toujours rien publié | PR du journal |
| 13/11 12:00 | attente | Android n'a toujours rien publié depuis hier 18:06 ; l'iPhone est à jour (**1019.513** chez les testeurs, avec le retour par balayage et la taille du texte). Ce qui reste à essayer demande un vrai iPhone. Parité : 70 % (33/47) | PR du journal |
| 13/11 13:00 | attente | Rien de neuf chez Android depuis hier 18:06 ; l'iPhone est à jour (**1019.513** chez les testeurs). Parité : 70 % (33/47) | PR du journal |
| 13/11 14:30 | attente | Rien de neuf chez Android depuis hier 18:06 ; l'iPhone est à jour (**1019.513** chez les testeurs). Parité : 70 % (33/47) | PR du journal |
| 13/11 16:15 | attente | Rien de neuf chez Android depuis hier 18:06 ; l'iPhone est à jour (**1019.513** chez les testeurs). Parité : 70 % (33/47) | PR du journal |
| 13/11 17:15 | suivi d'Android v1021 | Android a repris (premier run depuis hier 18:56) : dans Tendances, une ligne sous la courbe explique le pointillé (« attendu d'après vos habitudes »), et une mesure sans attendu s'arrête à aujourd'hui. Vérifiée sur simulateur (légende lisible aussi en très grand texte), chez les testeurs depuis 18:34 (**1021.521**, l'ancienne 1019.513 expirée). Parité : 70 % (33/47) | #507 |
| 13/11 19:00 | suivi d'Android v1023 et v1024 | dans le Journal, un jour avec une séance de sport (votre Apple Watch) a une tuile « Séance » ; dans Analyses, votre note est confirmée après « Enregistrer », et quand rien n'est encore net, une ligne dit ce qui a été comparé. Vérification sur simulateur en cours, puis envoi aux testeurs. Parité : 70 % (33/47) | #509 (en cours) |

---

## Charte

### 1. Mission

Porter Halcya sur iPhone et **maintenir la version iOS au même niveau d'avancement et au même numéro de version que
la version Google Play**, sans jamais gêner, ralentir ni casser la version Android et son développement. La routine
Android (« HealthTrack — amélioration autonome », PR `[Auto]` dans HealthTrack) mène le produit ; la routine iOS
(« Halcya iOS — parité avec Android », dans ce dépôt) suit. **Depuis le 27/10 (vers 15:30), le projet iOS est la
priorité du propriétaire** : runs pleins (jusqu'à 50 min), étapes enchaînées ; HealthTrack reste en lecture seule.

- **Référence = la variante play** : même parcours, mêmes écrans, mêmes textes, mêmes fonctions, même modèle
  économique (abonnement par les achats intégrés d'Apple au lieu de Google Play Billing), même relais IA (Vertex AI,
  aucune clé dans l'app). Les fonctions propres à la sideload (mise à jour par APK, clé Gemini saisie, guides de
  développeur) sont sans objet sur iOS.
- **Chaque fonction play a son équivalent iOS**, ou une ligne « ⛔ impossible sur iOS » argumentée (règle Apple ou
  API inexistante, source datée) avec la meilleure alternative. [`PARITE.md`](PARITE.md) est la vérité.
- **Le prompt de la routine prime** sur cette charte en cas de contradiction ; la routine peut améliorer la charte
  quand elle trouve une meilleure façon de travailler.

### 2. Deux dépôts, une seule règle

| Dépôt | Rôle | Accès de la routine iOS |
|---|---|---|
| `spreadzenox/HealthTrack` | l'app (code web partagé), la version Android, le relais, le journal du produit | **lecture seule** |
| `spreadzenox/HealthTrack-iOS` (ici) | tout ce qui est propre à iOS : correctifs, projet natif, workflows macOS, fiche App Store, journal iOS | lecture et écriture |

- Dans HealthTrack, la routine iOS **lit** (code, `journal/PRODUIT.md`, `journal/BACKLOG.md`, `journal/DESIGN.md`,
  `app/src/data/changelog/`, workflows) et **n'écrit jamais** : ni push, ni branche, ni PR, ni commentaire, ni
  workflow lancé, ni réglage.
- Un changement nécessaire côté HealthTrack (ex. le relais qui doit vérifier les achats App Store, ou un petit point
  d'accroche qui rendrait un correctif inutile) → une ligne dans [`DEMANDES.md`](DEMANDES.md) ; le propriétaire la
  transmet s'il le veut à la routine Android. En attendant, contourner côté iOS.

### 3. Comment la build iOS est faite

1. `upstream.json` fixe le commit Android suivi et son numéro (`versionCode` = `git rev-list --count` de ce commit,
   comme l'AAB play).
2. `scripts/upstream.sh` récupère ce commit dans `upstream/` (ignoré par git), applique `patches/*.patch` dans
   l'ordre de leurs noms, copie `overlay/` par-dessus, et copie `ios/` (le projet Xcode) dans `upstream/app/ios`
   (une copie, pas un lien : le `Package.swift` régénéré par `cap sync ios` pointe en relatif vers `app/node_modules`).
   `scripts/upstream.sh --latest` avance d'abord `upstream.json` sur le **dernier commit de main dont « Play — AAB »
   a réussi** : la dernière version réellement envoyée sur Google Play.
3. La build web se fait dans `upstream/app` avec `VITE_DISTRIBUTION=appstore` et `VITE_APP_VERSION` = le
   `versionCode` suivi, puis `npx cap sync ios`, puis `xcodebuild` sur les runners macOS.

Règles des adaptations :
- **Correctif** (`patches/NN-sujet.patch`, produit par `git -C upstream diff HEAD -- <fichiers>` : **HEAD** obligatoire,
  car `scripts/upstream.sh` met les correctifs déjà appliqués dans l'index ; exception : un nouveau correctif sur un
  fichier qu'un correctif précédent touche déjà se tire de `git -C upstream diff -- <fichiers>`, sans HEAD, juste
  après `scripts/upstream.sh`, pour ne garder que la nouvelle modification) pour modifier un fichier Android ;
  le plus petit possible, un sujet par fichier, pour qu'il survive aux changements d'Android. Un correctif qui ne
  s'applique plus fait échouer le script : le refaire sur le nouveau code (c'est le travail normal du suivi).
  Le script applique les correctifs **directement**, comme la CI (leçon du 29/10 : avec `--3way`, le correctif 02
  passait en local par fusion à trois sur v575 et échouait sur la CI, dont le clone n'a pas l'historique) ; pour
  refaire un correctif : `git apply --3way` à la main sur la version d'avant, puis `git diff`.
- **Tests d'interface (Swift)** : ils ne compilent que sur la CI ; une erreur y laissait la CI verte, sans aucun
  geste essayé (leçon du 29/10, PR #53 : sondes à zéro, 70 captures au lieu de 84). Depuis, la dernière étape de la
  build échoue si `test-interface-build.txt` n'a pas « TEST BUILD SUCCEEDED ». Après un push de Swift, le lire.
- **Fichier ajouté** (`overlay/<chemin>`) pour du code nouveau propre à iOS (ex. `overlay/app/src/services/appStoreBilling.js`).
  Pas de nouvelle feuille CSS dans `overlay/` : le test `bundleGuard` d'Android exige que toute feuille soit
  chargée d'emblée par `src/pageStyles.js` ; réutiliser les classes d'Android (ex. `.actions`) ou, à défaut, un
  correctif de `pageStyles.js`.
- **Avant chaque push de code** : la suite complète d'Android avec les correctifs (`npx vitest run` dans
  `upstream/app`), pas seulement les tests ciblés (leçon du 27/10 : PR #8 rouge sur `bundleGuard`).
- **CI et commits de journal** (leçons du 28/10) : sur une PR, le filtre de chemins porte sur tout le diff de la
  PR ; un commit de journal seul relance donc la CI et annule celle en cours → le pousser avec le code ou en fin de
  run. Un `[skip ci]` en tête de PR la laisse sans CI. Après un merge, vérifier que la CI de `main` a bien démarré
  (celle de #22 n'est jamais partie : relancée par `workflow_dispatch`). Après un push de Swift, regarder l'étape de
  build quelques minutes plus tard. Après une fusion avec conflits, comparer le nombre de tests avant / après : un
  fichier de test rendu illisible par la fusion disparaît du total sans faire échouer la suite (28/10, #40).
  Plusieurs PR vertes à la fois : chaque merge oblige les autres à repasser la CI ; regrouper dans une seule PR
  celles qui touchent les mêmes fichiers (#38 dans #37, 28/10). Un lancement manuel sur `main` partageait le groupe
  de concurrence de la CI de `main` et l'aurait annulée (29/10) : les captures de la fiche ont désormais leur groupe.
  Une PR de journal seul (sans CI) se merge **en dernier** dans le run, après les PR de code : sinon leurs branches
  passent en retard sur `main` et leur CI repart (31/10, #107 mergée avant #106). Une PR qui dure (fonction en
  plusieurs étapes) se merge avant le suivi d'Android suivant, qui la remettrait sinon en retard à chaque heure.
- **Fichiers d'`overlay/`** : vérifier qu'un fichier n'existe pas avant d'en écrire un « nouveau » (`ls`) : l'écrire
  l'écrase sans erreur (31/10 : le test d'origine de la carte du temps d'écran, remis ensuite). Comparer la liste
  des fichiers de test (`npx vitest list --filesOnly`) avant / après quand le total ne bouge pas comme prévu.
- **Calcul natif d'Android réécrit en Swift** (I7, 28/10) : paquet Swift pur, mêmes cas et mêmes tolérances que les
  tests JVM d'Android, vecteurs et portraits lus dans `upstream/` (jamais copiés) ; arrondis et tris de Java reproduits
  (`Math.round`, `%.4f`, tri stable) ; modèles téléchargés en CI avec les empreintes d'Android (`scripts/face-models.sh`).
- Jamais de copie d'un fichier Android entier dans `overlay/` : elle effacerait en silence les évolutions d'Android.
- Les tests d'Android (`npm run test` dans `upstream/app`) doivent passer avec les correctifs appliqués ; les tests
  propres à iOS vont dans `overlay/` (Vitest) ou `ios/` (XCTest).

### 4. Version

- **Numéro de version iOS** (`CFBundleShortVersionString`) = le `versionCode` Android suivi (ex. `514`) : le même
  nombre que sur Google Play, affiché aussi dans Paramètres (`VITE_APP_VERSION`). Depuis le 27/10 (Android #437),
  la variante play affiche ce nombre (`versionName` = commits de `main`) mais envoie à Google Play un `versionCode`
  de 100000 + ce nombre ; `upstream.json` garde le nombre affiché, qui reste celui d'iOS.
  **Depuis le 7/11 (décision du propriétaire vers 19:35)** : les builds de TestFlight gardent un numéro de version
  fixe pendant un cycle, celui de la prochaine version de l'App Store (`testflight-version.json`, lu par
  `testflight.yml`, `ios-build.yml` et `store-push.mjs`), pour que l'examen bêta ne soit pas complet à chaque build ;
  la version affichée dans l'app reste le `versionCode` d'Android (`VITE_APP_VERSION`). Nouveau cycle après chaque
  soumission du propriétaire : le fichier prend le numéro d'Android du moment.
- **Numéro de build** (`CFBundleVersion`) = `<versionCode Android>.<nombre de commits de ce dépôt>` (ex. `514.12`) :
  toujours croissant, même quand seul le code iOS change.
- **Même version** = la dernière build iOS publiée suit le dernier commit envoyé sur Google Play, et `PARITE.md`
  n'y trouve aucune fonction faisable manquante. La plupart des nouveautés Android sont du code web partagé : elles
  arrivent sur iOS en avançant `upstream.json` ; il reste à refaire les correctifs cassés, vérifier sur simulateur et
  cocher.
- **Version de la fiche App Store** : elle porte le même numéro que les builds (une version n'accepte que des builds
  de même numéro). Après chaque envoi TestFlight d'une nouvelle version, lancer `store-push.yml` sans « captures » :
  il renomme la version « Prête à soumettre » et dit l'état des captures chez Apple (31/10, #129, #132).
- **Livraison continue** (décision du propriétaire du 04/11, 19:45) : `testflight.yml` part seul à chaque merge sur
  `main` qui change l'app (`upstream.json`, `patches/`, `overlay/`, `ios/`, scripts de préparation) ; le journal, la
  fiche et le site n'envoient rien. Ne plus le lancer à la main après un tel merge (deux builds du même commit) ;
  relever « Version X, build Y » dans le run déclenché par le commit de merge.
- **Expiration des builds** (décision du propriétaire du 09/11 vers 11:00) : après chaque build arrivée sur TestFlight,
  `store-beta-expire.yml` avec « nettoyage » (d'abord « essai » en cas de doute), puis `store-push.yml`. Restent : la
  build de la version de l'App Store (844.344), la dernière distribuée au groupe externe jusqu'à ce que sa remplaçante
  le soit, celles en examen bêta, celles du groupe pas encore soumises (plus récentes que la distribuée), celles en
  traitement et la plus récente. Soumission de la nuit : examen de plus de 24 h et build plus récente prête →
  `builds` = celle en examen, puis `store-beta-submit.yml`. Chaque expiration dans le compte rendu. **9/11 : le
  lancement réel est refusé par le système de permissions de la session** (action irréversible) tant que le
  propriétaire ne l'y autorise pas ; essais à blanc permis. **10/11 vers 09:30 : autorisé par le propriétaire dans la
  session** (« sans me redemander ») : nettoyage réel après chaque nouvelle build mise chez les testeurs externes.
- **Nouveautés in-app** : variante `appstore` (correctif de `app/src/config/distribution.js`) ; les entrées de
  changelog propres à iOS vont dans `overlay/app/src/data/changelog/` avec `"variants": ["appstore"]`, et
  l'historique iOS commence au lancement iOS (équivalent de `PLAY_CHANGELOG_SINCE`).

### 5. Contraintes techniques

- **Pas de Mac** : les sessions sont des conteneurs Linux. Tout ce qui compile, teste ou capture iOS passe par
  GitHub Actions sur des runners macOS (dépôt public : minutes gratuites). La routine écrit les workflows, les lance,
  lit leurs logs, télécharge leurs artefacts et **regarde** les captures du simulateur.
- **Xcode / SDK** : la version d'Xcode la plus récente des runners ; vérifier l'exigence courante d'Apple sur le SDK
  minimal pour publier, avec sa source, dans `RECHERCHE.md`.
- **Projet** : Capacitor iOS et CLI de **la même version exacte** que `@capacitor/core` d'Android (8.2.0 au 27/10 ;
  `npx -p @capacitor/cli@<version> cap …`, Node 22 exigé) : une CLI plus récente génère un projet qui ne compile pas
  avec le runtime (constaté le 27/10 : `SceneDelegateProxy` introuvable avec la CLI 8.5 et le runtime 8.2). Quand
  Android monte `@capacitor/core`, régénérer ou mettre à jour le projet iOS en conséquence. Swift Package Manager, bundle id `fr.jpesquet.sante` (comme le package play, à confirmer avec A3), nom « Halcya », icône
  « H nuit » (`journal/DESIGN.md` d'Android).
- **Téléphone de test : iPhone 12** (6,1", 390 × 844 points, encoche, puce A14, 4 Go). Cible de déploiement qui
  couvre sa version d'iOS ; captures sur un simulateur de cette taille en plus d'un iPhone récent ; fluidité à
  vérifier sur ce matériel.
- **WKWebView** : `isNativePlatform()` est vrai sur iOS, donc chaque service qui appelle un des plugins natifs maison
  d'Android doit avoir un repli propre tant que l'équivalent Swift n'existe pas (voir `PARITE.md`).
- **Données** : local-first. Vérifier tôt (I3) la durabilité d'IndexedDB dans WKWebView et la sauvegarde iCloud ;
  secrets (appairage, jetons) dans le Trousseau en « ThisDeviceOnly ».

### 6. Protocole d'un run

1. **Démarrage** : vérifier que les deux dépôts sont là (HealthTrack-iOS en écriture, HealthTrack en lecture), partir
   de `origin/main` à jour, lire ce fichier, `PARITE.md`, `BACKLOG.md`, `DEMANDES.md` et les 3 derniers comptes
   rendus (`ls journal/runs | tail -3`).
   **Depuis le 4/11** (décision du propriétaire) : lire aussi `journal/POUR-IOS.md` de HealthTrack, en lecture ; une
   ligne qui commence par « Décision du propriétaire » vaut comme venant de lui (dans les limites du prompt : jamais
   de production, de soumission à Apple ni de secret) et se reporte dans le compte rendu. Après la soumission, iOS
   rejoindra HealthTrack et cette routine sera mise en pause.
   Dans l'autre sens, **`journal/POUR-ORCHESTRATEUR.md`** de ce dépôt : tout ce qui attend du propriétaire une action,
   une réponse ou une décision, et tout blocage (pas l'avancement) ; une ligne datée (heure de Paris), la plus récente
   en haut, compréhensible seule, avec la réponse attendue ; une ligne réglée en est retirée ; le fichier part sur
   `main` avec la PR du run.
   Un journal ne se merge **qu'après** la PR de suivi en cours (sinon celle-ci n'est plus à jour sur `main` et doit
   repasser toute sa CI), sauf décision du propriétaire à rendre visible tout de suite.
2. **Ce qu'Android a livré** depuis le dernier run : `scripts/upstream.sh --latest` (nouveau commit suivi), puis dans
   HealthTrack, en lecture, `git log` entre l'ancien et le nouveau commit, nouveaux fichiers de
   `app/src/data/changelog/`, tête de `journal/README.md` et de `journal/PRODUIT.md`. Reporter dans `PARITE.md` §5.
   **Chaque nouvelle note de Nouveautés** sans `variants` s'affiche aussi sur iPhone (depuis le 29/10, l'iPhone montre
   les notes à partir de sa propre version, correctif 28) : fausse sur iPhone → son id dans `APPSTORE_HIDDEN`
   (correctif 28) et une ligne dans `DEMANDES.md` pour qu'Android la marque `["play", "sideload"]`. La cacher
   **au suivi de sa version**, jamais plus tard : une note déjà vue sur un iPhone puis cachée n'est plus trouvée
   par `getUnseenEntries`, et l'app annoncerait toutes les autres comme nouvelles (vu en capture le 29/10, PR #67).
3. **Une autre exécution iOS en cours ?** (PR ouverte ici depuis moins de 75 min, ou workflow en cours sur une
   branche de la routine) → ne pas toucher aux mêmes fichiers.
4. **Priorités** : (a) `main` de ce dépôt rouge → réparer ; (b) une PR de la routine rouge ou en conflit → la
   réparer ; (c) correctifs cassés par la dernière version Android → les refaire ; (d) étape suivante de
   `BACKLOG.md`.
5. **Réaliser** : TDD (Vitest pour le web, XCTest pour le Swift), style du code d'Android, UI en français et au
   vouvoiement, identité visuelle validée (`journal/DESIGN.md` d'Android), conventions iOS (zones sûres, encoche /
   Dynamic Island, indicateur d'accueil, geste de retour). Pendant qu'une build macOS tourne (10 à 20 min), avancer
   la recherche ou la matrice.
6. **Livrer** : compte rendu, `PARITE.md`, `BACKLOG.md`, résumé de la semaine ; PR vers `main` de ce dépôt, merge
   (squash) quand tout est vert. **Bloqué** : pousser quand même compte rendu et résumé, PR ouverte qui explique.

### 7. Garde-fous avant tout merge sur `main`

- `scripts/upstream.sh` passe ; dans `upstream/app`, `npm ci`, `npm run test` et `npm run build`
  (avec `VITE_DISTRIBUTION=appstore`) passent.
- Dès qu'ils existent, les checks iOS de la PR sont verts (build simulateur, XCTest, captures) et les captures des
  écrans touchés ont été regardées.
- Branche remise à jour sur `origin/main` juste avant le merge.
- Sinon : pas de merge, PR laissée ouverte, raison et suite dans le compte rendu.

### 8. Actions du propriétaire (Apple)

Jamais faites par la routine (pas de création de compte, de clé, de certificat ni de dépense). La routine prépare
chaque étape pas à pas, avec les valeurs exactes à saisir, au moment où elle devient utile.

| | Action | Débloque | État |
|---|---|---|---|
| A0 | Téléphone de test | tests sur un vrai téléphone | ✅ 26/10 : iPhone 12 de sa compagne (version d'iOS à préciser) |
| A1 | Adhérer à l'Apple Developer Program (individuel, payant à l'année ; pas à pas ci-dessous) | signature, TestFlight, App Store | ✅ 30/10 : adhésion validée (e-mail de bienvenue d'Apple ; inscription et paiement le 28/10) |
| A2 | Créer une clé API App Store Connect (rôle Admin ; pas à pas « A2 et A3 » ci-dessous) et l'enregistrer en secrets GitHub Actions de ce dépôt, dans un environnement `appstore` réservé à `main` | builds signées et envoi TestFlight automatiques | ✅ 30/10 : clé « Halcya CI » (Admin), environnement `appstore` (main seulement, administrateurs sans contournement), « signature par Apple d'accord » |
| A3 | Créer la fiche de l'app dans App Store Connect (nom, langue principale français, bundle id, SKU) | envoi TestFlight, fiche | ✅ 30/10 : identifiant (HealthKit, In-App Purchase, App Attest) et fiche « Halcya » créés ; le nom se modifie encore dans « Informations sur l'app » tant que rien n'est soumis |
| A4 | Contrat « Paid Applications », coordonnées bancaires et fiscales | abonnement App Store | ✅ 1/11 : contrat, banque, fiscalité et DAC7 actifs ; statut de professionnel (DSA) en examen chez Apple |
| A5 | Remplir « Confidentialité de l'app » (pas d'API) avec les réponses préparées dans `store/app-store/confidentialite.md` | examen Apple | ✅ 1/11 : rempli par le propriétaire, relu sur capture |
| A6 | Inviter les testeurs (d'abord sa compagne : interne via « Utilisateurs et accès » ou externe avec l'examen bêta, la routine dira), soumettre à l'examen, publier | testeurs, production | lui seul |
| A7 | **Maintenant, après A3** : demander à Apple « Family Controls (Distribution) » pour Halcya (Certificates, IDs & Profiles → Identifiers → Halcya → onglet **Capability Requests** → Family Controls (Distribution)), en demandant aussi dans le texte le droit **« Family Controls App and Website Usage »** (absent de cet onglet le 30/10 ; justification en anglais préparée dans la conversation du 30/10 et dans `RECHERCHE.md`). Rien d'autre à demander dans cet onglet (passé en revue le 30/10, `RECHERCHE.md`) | tuile « Écran » sur iPhone (temps d'écran, peut-être réel et non plus approché, `RECHERCHE.md`) | ✅ 30/10 : Family Controls (Distribution) accordé dans la minute ; Distribution et App and Website Usage activés sur l'identifiant |
| A8 | (1 minute, sur ordinateur, quand vous voulez) Activer GitHub Pages pour ce dépôt : sur github.com, HealthTrack-iOS → Settings → Pages → « Build and deployment » → Source : « GitHub Actions ». Rien d'autre : la routine publie ensuite les pages | adresses de la politique de confidentialité, des conditions d'utilisation et de l'assistance de l'iPhone, demandées par la fiche App Store (A3, A5) | ✅ 30/10 : Pages activé, site publié (`pages.yml`, déploiement réussi) |

#### A1 pas à pas (préparé le 27/10/2026)

1. **Compte Apple** : celui du propriétaire, avec l'identification à deux facteurs activée (obligatoire), au nom
   légal exact (il apparaîtra comme « vendeur » sur l'App Store).
2. **S'inscrire** : sur https://developer.apple.com/programs/enroll/ (ou depuis l'app « Apple Developer » sur
   iPhone, qui propose aussi l'inscription). Sans Mac ni iPhone : lien « Continue enrollment on the web » en bas de
   la page (fait ainsi le 28/10). Choisir **« Individu / entreprise individuelle »** : l'app paraîtra
   sous le nom du propriétaire. Le type « organisation » demande une société avec un numéro D-U-N-S, plus long.
3. **Payer la cotisation annuelle** : 99 USD par an, montant en euros (TVA comprise) affiché par Apple à ce moment-là
   — c'est la seule dépense, et elle revient chaque année (sans renouvellement, l'app quitte l'App Store).
4. **Attendre la validation** (souvent un ou deux jours, parfois une vérification d'identité), puis le dire à la
   routine en une ligne dans cette conversation. Elle prépare alors A2 (clé API, rôle exact) et A3 (fiche de l'app,
   avec les valeurs à recopier).
5. **À savoir avant de publier dans l'UE (Digital Services Act)** : App Store Connect demandera si vous êtes un
   « commerçant ». Avec un abonnement payant, la réponse est oui : une adresse (une boîte postale est acceptée), un
   téléphone et un e-mail seront affichés sur la page de l'app dans l'UE. Rien à faire avant A3 ; mieux vaut
   choisir ces coordonnées à l'avance. Source : aide d'App Store Connect, « Manage EU Digital Services Act compliance
   information » (lue le 27/10/2026).

#### A2 et A3 pas à pas (préparés le 28/10/2026, à faire après l'e-mail de confirmation d'A1)

**A3 d'abord : l'identifiant et la fiche de l'app** (sur un ordinateur, navigateur suffisant)
1. https://developer.apple.com/account → **Certificates, Identifiers & Profiles** → **Identifiers** → « + ».
   Choisir **App IDs** puis **App**.
   - Description : `Halcya`.
   - Bundle ID : **Explicit**, `fr.jpesquet.sante` (celui du projet iOS).
   - Capabilities : cocher **HealthKit**. « In-App Purchase » est déjà inclus. Rien d'autre pour l'instant : pas de
     Push Notifications, car les rappels sont des notifications locales.
   - Continue → Register.
2. https://appstoreconnect.apple.com → **Apps** → « + » → **Nouvelle app** :
   - Plateforme : iOS ;
   - Nom : `Halcya — ventre et bien-être` (30 caractères au plus ; s'il est déjà pris, `Halcya : ventre et bien-être`) ;
   - Langue principale : Français (France) ;
   - Identifiant de lot : `fr.jpesquet.sante` ;
   - SKU : `halcya-ios` ;
   - Accès utilisateur : Accès complet.

**A2 ensuite : la clé API pour que la CI envoie l'app sur TestFlight**
1. App Store Connect → **Utilisateurs et accès** → **Intégrations** → **API App Store Connect**. La première fois,
   cliquer « Demander l'accès » et accepter.
2. **Clés d'équipe** → « + ».
   - Nom : `Halcya CI`.
   - Accès : **Admin**. D'après les forums développeurs, c'est le seul rôle qui laisse la CI signer sans Mac, avec un
     certificat de distribution géré par Apple : la clé privée du certificat reste chez Apple, aucun fichier à garder.
     Avec ce rôle, **la CI créera ce certificat dans votre compte** : c'est votre accord, à me confirmer en une ligne
     (« A2 : signature par Apple d'accord »). Sinon, autre voie possible mais plus longue sans Mac : vous créez vous-même
     le certificat avec OpenSSL et le déposez en secret GitHub ; je vous la détaillerai.
3. **Télécharger la clé** : un fichier `AuthKey_XXXXXXXXXX.p8`, téléchargeable **une seule fois**. Noter le **Key ID**
   et l'**Issuer ID** affichés au-dessus du tableau.
4. Sur GitHub, dépôt `spreadzenox/HealthTrack-iOS` → Settings → **Environments** → New environment → nom `appstore`.
   - **Deployment branches** : Selected branches → `main` seulement.
   - **Environment secrets** :
     - `ASC_KEY_ID` = le Key ID ;
     - `ASC_ISSUER_ID` = l'Issuer ID ;
     - `ASC_KEY_P8` = tout le contenu du fichier `.p8`, ouvert avec le Bloc-notes, lignes BEGIN / END comprises.
5. Me dire « A2 fait ». Je n'ai jamais besoin de voir la clé : ne la collez pas dans la conversation.

### 9. Outillage

- **GitHub** : outils `mcp__github__*` s'ils sont présents, sinon `gh api` en REST (pas de GraphQL). Artefacts d'un
  run : `gh api repos/spreadzenox/HealthTrack-iOS/actions/runs/<id>/artifacts` puis `…/artifacts/<id>/zip`.
- **Captures iOS** : le workflow les pousse sur la branche `captures/pr-<N>` (PR) ou `captures/main` ; les lire **fichier
  par fichier par l'API**, sans `git fetch` : liste avec `gh api repos/spreadzenox/HealthTrack-iOS/git/trees/captures/pr-<N>
  -q '.tree[].path'`, fichier avec `gh api "repos/spreadzenox/HealthTrack-iOS/contents/<fichier>?ref=captures/pr-<N>" -H
  "Accept: application/vnd.github.raw" > <copie>` (le téléchargement des artefacts peut être bloqué par le réseau de la
  session). 12/11 : les `git fetch` de ces branches, réécrites à chaque build, avaient rempli le disque de la session
  (15 Go d'objets, dont 6,6 Go d'un envoi interrompu) ; nettoyé (`git gc`), et les copies de captures du bloc-notes
  effacées après lecture.
- **Attendre la CI** sans boucle active : outil Monitor (`until` sur les check-runs) ou abonnement à la PR.
- **Vérification visuelle web** : dans `upstream/app`, `npm run visual` (options en tête de
  `scripts/visual/visual-check.mjs`), avec `VITE_DISTRIBUTION=appstore` ; pour iOS, captures du simulateur produites
  par le workflow iOS (clair et sombre, données vierges et de démo).
- **Mécanique** : la tâche planifiée « Halcya iOS — parité avec Android » se déclenche toutes les heures (à :59, heure
  de Paris, 30 min après la routine Android) dans la session claude.ai « Halcya iOS — routine », qui a les deux dépôts
  attachés, avec le prompt de [`PROMPT-ROUTINE.md`](PROMPT-ROUTINE.md). La conversation est résumée au fil du temps :
  la seule mémoire fiable est ce dossier. Ne pas archiver cette session.

### Modèle de compte rendu

`journal/runs/AAAA-MM-JJ-HHMM-<slug>.md` (heure UTC) :

```markdown
# AAAA-MM-JJ HH:MM UTC — <titre>

**Étape** : I<n>  ·  **PR** : #NN (fusionnée / ouverte)  ·  **Android suivi** : v<N>  ·  **iOS** : v<N>.<b> / —  ·  **Parité** : NN %

## Ce qu'Android a livré depuis le run précédent
- …

## Ce qui a été fait
- …

## Vérifications
- upstream.sh ✅ (N correctifs) · Tests Android avec correctifs : NNN ✅ · Build ✅ · iOS (simulateur) ✅ / —
- Captures regardées : …

## Apprentissages / décisions
- …

## Suite proposée
- …
```

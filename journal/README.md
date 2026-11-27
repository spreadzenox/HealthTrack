# Journal de bord de Claude — HealthTrack

## 📅 Semaine en cours — S48 (lundi 23 → dimanche 29 novembre 2026)

> Résumé tenu à jour à chaque run : **c'est ce que lit le propriétaire chaque semaine.**
> Le premier run d'une nouvelle semaine archive ce bloc dans `semaines/AAAA-Sww.md` et en ouvre un neuf.
> Semaine précédente : [`semaines/2026-S47.md`](semaines/2026-S47.md) (sprint de la refonte : Pilou en 3D, son île,
> les bulles et le Studio, étapes 8 à 14 ; CI économe après le blocage GitHub du 17-18/11 ; version 893 de l'App Store
> prête avec la build de la refonte 1244.1244 ; passages des personas et leurs défauts corrigés ; correctifs propres
> à l'iPhone fondus dans le code commun, 15 restent).

**👉 Prochaine action du propriétaire (18/11) : recruter au moins 8 testeurs de plus (viser 11 de plus, 15 au total).**
Le tableau de bord Play compte **4 inscrits sur 12** (dernier relevé connu) ; l'accès à la production viendra 14 jours
après le 12ᵉ. **Tout est prêt** dans [`INVITATION-TESTEURS.md` § 0](INVITATION-TESTEURS.md) : un message aux 4
inscrits, un SMS court pour un proche, un message de groupe, un post de communauté, les 3 liens dans l'ordre.
⚠️ Gold est offert jusqu'au 2/12 : si le 12ᵉ s'inscrit après le 18/11, dites « prolonge Gold jusqu'au … ». Dites le
nombre d'inscrits quand vous le voyez.

**👉 PI2 prête (depuis le 22/11 06:30) : soumission App Store de la refonte.** La version **893** a la build
**1244.1244** (validée par Apple pour « Testeurs Halcya »), les notes pour l'examen revues, la publication manuelle.
Dites à Claude dans Chrome « fais la mission PI2 » ([`PI2.md`](../iphone/journal/missions/PI2.md)) : il range les
trois abonnements dans le brouillon et s'arrête devant **Submit for Review** ; ce bouton est le vôtre (5 min en tout).
Si une build plus récente a été attachée d'ici là, ce résumé le dira.

**👉 Le dimanche 29 ou le lundi 30/11 (2 min) : prévenir les testeurs de la fin de Gold offert (2/12).** Message prêt à
copier : [`INVITATION-TESTEURS.md`, message E](INVITATION-TESTEURS.md) (au groupe des testeurs). Il dit que Gold continue
jusqu'au 27/12 pour ceux qui ont analysé un repas, ce qui reste gratuit, les prix, et leur demande surtout de **rester
inscrits** : sans ça, le décompte des 14 jours de Google ne pourra jamais aboutir. Si vous dites « prolonge Gold »
d'ici là, ne l'envoyez pas : la routine le réécrit avec la nouvelle date.

**Ensuite, 1 minute (P51)** : la Sécurité des données Google déclare maintenant « Infos de santé » pour la photo des
selles, comme Apple. Actions → « Play — sécurité des données » → Run workflow (main).

**⏱️ Heures de Mac de S48 (relevé partiel, 23/11 → 27/11 05:30) : 35,3 h, environ 8,3 h par jour** (23/11 8,6 h ;
24/11 10,4 h ; 25/11 7,4 h ; 26/11 6,9 h). Builds de PR 30,6 h (103 jobs), builds du soir 4,2 h, TestFlight 0,5 h.
Moins de la moitié de S47, toujours près de trois fois la cible de 3 h : la décision ci-dessous reste ouverte.

**⚠️ Heures de Mac de la semaine S47 (bilan complet, 16 → 22/11) : 147,6 h, environ 21 h par jour pour une cible
de 3 h.** Par jour : 16/11 52,3 h (sprint de la refonte, plusieurs PR en parallèle) ; 17/11 40,7 h ; 18/11 3,1 h
(compte bloqué) ; 19/11 12,4 h ; 20/11 13,4 h ; 21/11 13,1 h ; 22/11 12,4 h. Depuis la CI économe (19/11) : environ
12,8 h par jour. Par origine : builds de PR 114,6 h (309 jobs), builds de main au merge 24,8 h (avant la CI économe),
builds du soir 3,4 h, lancements manuels 1,9 h, TestFlight 2,9 h. Ce qui pèse : un build iPhone de 26 min par PR de
code, une PR par run et un run par heure. **Décision toujours à prendre (orchestrateur ou propriétaire)**, la routine
ne change pas seule la règle « build iOS sur simulateur avant tout merge qui change le code embarqué » : (1) build iOS
de PR seulement quand la PR touche `iphone/` ou le code natif, le code web partagé étant vérifié par le build du soir
sur main ; ou (2) regrouper les petits correctifs de plusieurs runs dans une même PR (au plus 6 builds de PR par jour).
En attendant, ce run-ci n'a lancé aucun build iPhone (journal seulement).

**Où en est Halcya**

| | Android (Google Play) | iPhone (App Store) |
|---|---|---|
| Dernière version | release **v927** (#1275, 26/11 03:35 UTC, APK 35,7 Mo) ; test interne à chaque merge ; Alpha : **101363** (version du 26/11) partie le 27/11 à 04:34 UTC (cron de 23:45, parti avec 4 h 50 de retard) | **1362.1362** (build du 26/11 au soir) chez « Testeurs Halcya », soumise à l'examen bêta le 27/11 04:31 UTC et validée, 1335.1335 expirée ; **1244.1244** (refonte) reste attachée à la version **893** pour votre soumission ; build du soir et TestFlight à 21:20 (même retard) |
| Où l'installer | Play Store, test fermé | TestFlight : groupe interne et groupe « Testeurs Halcya » |
| Parité des fonctions | référence | **70 %** (33 sur 47, [`PARITE.md`](../iphone/journal/PARITE.md)) ; plus aucun correctif propre à l'iPhone ; `overlay/` ne garde que les notes de Nouveautés de l'iPhone (FUSION-3 : reste `ios/` → `app/ios/`) |

**🧸 Refonte « Compagnon »** : étapes 1 à 7 faites (4 onglets, Ma journée, accueil en 4 temps, Objectifs, Données sur
Tendances, Nunito et fond crème) ; étapes 8 à 14 livrées pendant le sprint du 16-17/11 (scène 3D, Pilou, bulles, vie,
monde, Studio à la main), restes au [`BACKLOG.md`](BACKLOG.md) ; **étape 15 (selfie) écrite mais éteinte partout**
jusqu'à vos déclarations (P49 et PI3). Rien n'est encore mesuré sur un vrai téléphone. La semaine passée a servi au
polissage (personas) et à la soumission App Store ; cette semaine : vos retours sur la version des testeurs d'abord,
puis la fin de FUSION-3 et les restes de la refonte.

**Toujours en attente de vous**
- **Courbes de la montre dans Tendances** (cœur, oxygène la nuit, phases du sommeil, et les calories du téléphone, reçues sans courbe ; maquette du 19/11, [`maquettes/tendances-courbes/`](maquettes/tendances-courbes/README.md)) : trois personas les cherchent sans les trouver. Répondez « go courbes », « go phases » ou « non ».
- **Rituel du soir (LANT-4, 25/11)** : pendant un essai « pas d'écran après 22 h », Pilou range son téléphone dans un tiroir et s'endort. Maquette en 2D dans une feuille, [`maquettes/rituel-soir/`](maquettes/rituel-soir/README.md) (la 3D sur l'îlot demanderait 2,5 fois le budget de triangles). Répondez « rituel 2D », « rituel 3D » ou « pas de rituel ».
- **PROP-SIM-20** (27/11, nouveau) : Objectifs › Confort digestif › Alimentation dit « Rien à éviter » juste au-dessus de « Fructanes −1,2 pt » ; 3 personas « sans technique » ne savent plus si elles doivent éviter l'oignon, et le 27/11 08:30 une 4ᵉ, « Ventre et données », qui veut aussi savoir sur combien de repas repose chaque ligne. Maquette dans [`maquettes/rien-a-eviter/README.md`](maquettes/rien-a-eviter/README.md) : A, « Rien de sûr pour l'instant », le plus marqué nommé avec « ça peut venir du hasard » et un lien vers la réintroduction guidée ; B, le verdict corrigé seul. Répondez « PROP-SIM-20 A », « PROP-SIM-20 B » ou « non ».
- **PROP-SIM-19** (poids, 24/11 ; 26/11 : 4ᵉ persona « Prendre soin de soi » de suite qui le cherche, et la masse grasse de la balance n'a pas de courbe) : maquette dans [`maquettes/poids/README.md`](maquettes/poids/README.md) ; répondez « PROP-SIM-19 oui », « saisie seulement » ou « non ». Aussi en attente : PROP-SIM-17 (bilan digestif avant le 28e jour).
- **P32** (pays de vente) : le jour de la production, 2 min, geste exact dans [`PRODUIT.md`](PRODUIT.md) §4.
- **iPhone** : la décision sur la licence des poids du visage (DEM-IOS-9 du backlog) ; les essais sur l'iPhone 12.

**À faire par l'orchestrateur (missions Play Console et Google Cloud, quand vous le lui écrivez)**
- Relevés des commentaires des testeurs du 16/11 et du 19/11 ([P45](missions/P45.md)) : il les donne à la routine.
- [P29](missions/P29.md) et [P34](missions/P34.md) : pas urgentes. [ETAT-PLAY](missions/ETAT-PLAY.md) : à la demande.

| Run | Type | Résultat |
|---|---|---|
| 27/11 15:30 — [Accueil : ajouter une habitude sur petit écran](runs/2026-11-27-1530-habitude-petit-ecran.md) | 🔧 | REFONTE-5b-3 (en partie) : les 4 temps de l'accueil capturés à 320 px et en grande police ; un seul défaut, le champ « Ajouter une habitude… » coupait son texte : le bouton « Ajouter » passe dessous quand la place manque. Ajouté à #1312, passée en « prête » : un build iPhone pour les deux correctifs. |
| 27/11 14:30 — [Accueil : ce qui est reçu, en une ligne](runs/2026-11-27-1430-onboarding-recu.md) | 🔧 | REFONTE-5b-2 : à l'étape 3 du premier lancement, avec l'accès aux données donné, six grandes lignes « reçu » répétaient les tuiles du dessus ; elles tiennent maintenant en une ligne « Bien reçu : … », seules les mesures que vos appareils ne donnent pas gardent leur ligne et leur raison. PR en brouillon (CI économe), à regrouper avec le correctif suivant. #1311 (Premium et fin de Gold) mergée à 14:15. Rien à faire de votre côté |
| 27/11 13:30 — [Fin de Gold offert : les bons mots](runs/2026-11-27-1330-fin-gold-journal.md) | 🔧 | POLISH-LAUNCH-JOURNAL : la carte de l'Accueil qui annonce la fin de Gold offert (visible par les testeurs dès le 29/11) disait « Ensuite, le journal, les montres, … restent gratuits » ; elle dit « vos notes et vos repas, les montres, le bien-être estimé et l'export ». Ajoutée à #1311 avec le correctif de 12:30, un seul build iPhone. Rien à faire de votre côté |
| 27/11 12:30 — [Premium : ce qui reste gratuit](runs/2026-11-27-1230-paywall-journal.md) | 🔧 | POLISH-PAYWALL-JOURNAL : la page Premium disait « Toujours gratuit : journal, … » alors que le Journal n'existe plus ; elle dit « vos notes et vos repas, imports des montres, bien-être estimé, graphiques et export de vos données ». PR en brouillon, à regrouper avec le correctif suivant pour un seul build iPhone (CI économe). Rien à faire de votre côté |
| 27/11 11:30 — [Réglages : la ligne Paramètres](runs/2026-11-27-1130-reglages-desc.md) | 🔧 | POLISH-REGLAGES-DESC : dans Réglages, la ligne Paramètres annonçait « analyse des repas (IA) » mais ne nommait ni Pilou, ni vos objectifs, ni vos habitudes, qui s'y règlent. Elle dit maintenant « Apparence, Pilou, objectifs et habitudes, abonnement ». Rien à faire de votre côté |
| 27/11 10:30 — [Note de bien-être : « Enregistrer » fixe](runs/2026-11-27-1030-bien-etre-bouton-fixe.md) | 🔧 | POLISH-SIM-178 : la fenêtre « Comment vous sentez-vous ? » s'ouvre en bas de l'écran ; au choix de la note, elle grandit vers le haut et « Enregistrer » ne descend plus de 200 px sous le doigt (relevé par « Stressé et pressé » ce matin). Un build iPhone pour la PR. Rien à faire de votre côté |
| 27/11 09:30 — [Alimentation : FODMAP pas comparés](runs/2026-11-27-0930-fodmap-pas-compares.md) | 🔧 | POLISH-FODMAP-ABSENT : dans Votre confort digestif › Alimentation, les fructanes et le mannitol manquaient sans explication (relevé par « Ventre et données » ce matin). Le détail des chiffres le dit maintenant : « Pas encore comparés, trop peu de vos repas en sont riches : fructanes (blé, oignon, ail) et mannitol (…) ». Un build iPhone pour la PR. Rien à faire de votre côté |
| 27/11 08:30 — [Personas du matin](runs/2026-11-27-0830-personas-matin.md) | 💡 | Run « idées », sans code produit. « Stressé et pressé » au 1er jour et « Ventre et données » au 45ᵉ jour après la mise à jour, toutes deux sur Android seul. Aucun nouveau défaut sûr : ce qu'elles ont relevé est voulu, déjà proposé ou propre à la version web. « Rien à éviter » au-dessus de chiffres négatifs gêne une 4ᵉ persona : votre réponse à PROP-SIM-20 débloquerait le correctif. Rien d'autre à faire de votre côté |
| 27/11 07:30 — [Confort digestif masqué](runs/2026-11-27-0730-ventre-masque.md) | 🔧 | POLISH-GUT-OFF-NOTE : quand le suivi digestif est masqué, la page Votre confort digestif (atteinte depuis un essai ou la réintroduction) ne propose plus « Noter maintenant » sous « Le suivi digestif est masqué » ; vos jours notés restent comptés. Reste du run de 06:30. Un build iPhone pour la PR. Rien à faire de votre côté |
| 27/11 06:30 — [Agir : un lien pour revenir](runs/2026-11-27-0630-agir-retour.md) | 🔧 | POLISH-AGIR-RETOUR : la page Agir, ouverte depuis l'Accueil, était la seule sous-page sans lien de retour ; elle a « ← Accueil » en haut, comme « ← Objectifs » ailleurs. Vu en relisant les pages de main. Un build iPhone pour la PR. Rien à faire de votre côté |
| 27/11 05:30 — [Examen bêta de 1362, 1335 expirée](runs/2026-11-27-0530-testflight-1362-examen.md) | 📓 | La build iPhone de cette nuit, **1362.1362**, est chez « Testeurs Halcya » : soumise à l'examen bêta d'Apple et validée en quelques minutes. L'ancienne, 1335.1335, est expirée ; 1244.1244 reste attachée à la version 893 pour votre soumission. Alpha du soir partie à 04:34 UTC : **101363** en test fermé. Heures de Mac de la semaine relevées (8,3 h par jour). Journal seulement, aucun build de Mac. Rien à faire de votre côté |
| 27/11 04:30 — [TestFlight 1362, soumission bêta bloquée](runs/2026-11-27-0430-testflight-1362.md) | 📓 | La build iPhone de cette nuit, **1362.1362**, est sur TestFlight (02:57 UTC). Sa soumission à l'examen bêta pour « Testeurs Halcya » a été bloquée par les permissions de la session (rien n'est parti chez Apple) : le run suivant la refait, sinon l'orchestrateur devra l'autoriser. 1335.1335 reste chez les testeurs. Alpha du soir pas encore partie à 03:30 UTC. Journal seulement, aucun build de Mac. Rien à faire de votre côté |
| 27/11 03:30 — [Tendances : un jour avec peu de lectures](runs/2026-11-27-0330-tendances-deux-lectures.md) | 🔧 | POLISH-VISAGE-1 : avec 2 lectures du visage dans la journée, l'Accueil disait 3,1 et Tendances › Jour 2,7 « d'après le visage », alors que ce 2,7 vient des jours voisins (le visage compte dès 3 lectures). La ligne le dit maintenant : « estimé avec les jours voisins (il faut 3 lectures) ». Vu en relisant toutes les pages de main. Build iPhone du soir, TestFlight et Alpha pas encore partis à 03:30. Un build iPhone pour la PR. Rien à faire de votre côté |
| 27/11 02:30 — [Ma journée : la nuit après minuit](runs/2026-11-27-0230-pilou-nuit.md) | 🔧 | POLISH-NUIT-1 : de minuit à 5 h, Ma journée disait « Bonjour ! » avec Pilou qui salue, alors que l'Accueil le montre endormi. Elle dit maintenant « Bonne nuit. Le reste peut attendre demain. », Pilou endormi, aux couleurs du soir. Vu en relisant toutes les pages de main. Build iPhone du soir, TestFlight et Alpha pas encore partis à 02:30 (retard des tâches programmées de GitHub). Un build iPhone pour la PR. Rien à faire de votre côté |
| 27/11 01:30 — [Proposition « Rien à éviter »](runs/2026-11-27-0130-proposition-rien-a-eviter.md) | 📓 | PROP-SIM-20 : maquette pour la page Alimentation de Confort digestif, où « Rien à éviter » côtoie « Fructanes −1,2 pt » (3ᵉ fois chez « Ventre, sans technique »). Deux options, à vous de choisir (voir « Toujours en attente de vous »). Main vert ; build iPhone du soir et Alpha toujours pas partis à 01:30 (retard des tâches programmées de GitHub). Journal seulement, aucun build de Mac |
| 27/11 00:30 — [« Vous notez vous-même » vérifié](runs/2026-11-27-0030-notez-vous-meme.md) | 📓 | Dernier reste du passage de 20:30 : au 3e temps de l'accueil, « Pour l’instant, vous notez vous-même » est juste aussi sur un vrai téléphone (vos pas n'y apparaissent qu'une fois l'accès Health Connect donné à l'écran d'avant, et c'est déjà testé). Main vert ; build iPhone du soir et Alpha pas encore partis à 00:30 (retard habituel des tâches programmées de GitHub). Journal seulement, aucun build de Mac. Rien à faire de votre côté |
| 26/11 23:30 — [Objectifs : les jours déjà comptés](runs/2026-11-26-2330-long-terme-jours-comptes.md) | 🔧 | POLISH-SIM-177 : sous les pistes d'Objectifs, la ligne du prochain délai dit aussi ce qui est déjà compté (« Long terme (de 7 à 27 jours avant) : 45 jours sur 56 avec votre digestion notée, encore 11 ») ; la persona du 45e jour croyait n'avoir rien compté. Un build iPhone pour la PR. Rien à faire de votre côté |
| 26/11 22:30 — [Essai : rattraper les jours manqués](runs/2026-11-26-2230-essai-jours-manques.md) | 🔧 | POLISH-SIM-176 : sur la page d'un essai, quand la mesure ou la réponse manque, « c'était tenu ? » se demande pour hier, puis avant-hier et le jour d'avant, une question à la fois (avant, un jour non répondu la veille restait inconnu pour toujours, lanterne éteinte) ; constat du passage de 20:30. « Jour 1 sur 7 » et « 0 sur 7 jours notés » écarté : même compte. Un build iPhone pour la PR. Rien à faire de votre côté |
| 26/11 21:30 — [Accueil et Ma journée comptent pareil](runs/2026-11-26-2130-compte-et-champ-habitude.md) | 🔧 | POLISH-SIM-174 et 175 : sous Pilou, l'Accueil dit « Encore 4 choses aujourd’hui » comme Ma journée (chaque repas qui manque compte) ; à l'étape 4 de l'accueil, le champ « Ajouter une habitude » remonte au-dessus du bouton « C'est parti ! » quand on le touche. Un build iPhone pour la PR. Rien à faire de votre côté |
| 26/11 20:30 — [Personas du soir](runs/2026-11-26-2030-personas-soir.md) | 💡 | « Tout mesurer » au 1er jour sur Android seul et « Ventre, sans technique » au 45e jour après la mise à jour, sur iPhone seul. Deux défauts au BACKLOG : l'Accueil dit « 6 bulles à faire » quand Ma journée dit « Encore 8 choses » (POLISH-SIM-174), un champ de l'accueil rogné par le bouton « C'est parti ! » (POLISH-SIM-175). Vos calories du téléphone n'ont pas de courbe : ajoutées à la proposition « go courbes ». Journal seulement, aucun build de Mac. Rien à faire de votre côté |
| 26/11 19:30 — [Le pain des personas](runs/2026-11-26-1930-personas-outil-4-pain.md) | 🔧 | PERSONAS-OUTIL-4 : les « fructanes absents » et le « pain sans alerte » vus par « Ventre et données » ce matin venaient de l'outil des personas (il prenait du pain pita, sans mesure), pas de l'app. L'outil prend maintenant le pain blanc courant ; rejoué, une baguette est bien « Probablement riche en fructanes ». Aucun changement dans l'app, aucun build de Mac. Rien à faire de votre côté |
| 26/11 18:30 — [Exemple du 28e jour plus réaliste](runs/2026-11-26-1830-exemple-j28-ordre-grandeur.md) | 🔧 | POLISH-SIM-173 : dans la visite guidée, l'exemple « Ce qui va avec votre ventre » montre « Fructanes −2,7 pt » (gêne le soir d'oignon et le lendemain) au lieu de −3,5 pt (douleur), et le « GOS +1,8 pt » qui laissait croire qu'un FODMAP soulage disparaît ; constat de « Ventre, sans technique » du 25/11. Un build iPhone pour la PR. Rien à faire de votre côté |
| 26/11 17:30 — [Repas : le détail FODMAP en mots simples](runs/2026-11-26-1730-repas-fodmap-mots-simples.md) | 🔧 | POLISH-SIM-172 : quand vous dépliez les détails d'un repas, chaque groupe dit « Bien plus », « Un peu plus » ou « Peut-être plus que ce qui gêne certaines personnes » au lieu d'une suite de grammes ; les grammes restent en petit dessous. Constat de la persona « Ventre, sans technique » du 25/11. Un build iPhone pour la PR. Rien à faire de votre côté |
| 26/11 16:30 — [Accueil : la carte Confort digestif](runs/2026-11-26-1630-accueil-confort-digestif.md) | 🔧 | POLISH-SIM-171 : avec l'objectif Confort digestif, l'Accueil montre sa carte sous le bien-être du jour (moyenne des 7 derniers jours et tendance, ou les jours qui restent), comme le veut le brief ; constat de la persona « Ventre, sans technique » du 25/11. Un build iPhone pour la PR. Rien à faire de votre côté |
| 26/11 15:30 — [Familles « Pas assez de données » : quoi faire](runs/2026-11-26-1530-familles-action.md) | 🔧 | POLISH-SIM-170 : dans Objectifs › Votre bien-être, une famille sans données dit ce qu'il faut (vos nuits, vos repas ou vos pas, au moins un jour sur deux) et sa carte mène à Sources ou à vos repas ; constat de la persona « Stressé et pressé » du 25/11. Un build iPhone pour la PR. Rien à faire de votre côté |
| 26/11 14:30 — [Budget de lectures sur Ubuntu 26.04](runs/2026-11-26-1430-ci-ubuntu-26.md) | 🔧 | CI-UBUNTU-26 : le contrôle « Budget de lectures » des tests passe à Playwright 1.65.1, qui prend en charge la nouvelle image Ubuntu de GitHub ; il n'est plus épinglé sur l'ancienne. CI seulement, aucun build de Mac. Rien à faire de votre côté |
| 26/11 13:30 — [Charte de l'iPhone fondue](runs/2026-11-26-1330-fusion-5-charte.md) | 📓 | FUSION-5 : la charte de `iphone/journal/README.md` ne décrit plus l'ancien montage (« lecture seule », `DEMANDES.md`) ; elle renvoie à celle-ci, qui dit où regarder les captures de l'iPhone. Journal seulement, aucun build de Mac. Rien à faire de votre côté |
| 26/11 12:30 — [Message de fin de Gold offert](runs/2026-11-26-1230-fin-gold-message.md) | 🔧 | FIN-LANCEMENT-MSG : message E du kit des testeurs, à envoyer le 29 ou le 30/11 (Gold jusqu'au 2/12, prolongé au 27/12 pour qui a analysé un repas, ce qui reste gratuit, prix vérifiés, « restez inscrits »). Journal seulement, aucun build de Mac. **À faire de votre côté : envoyer ce message le 29 ou le 30/11** |
| 26/11 11:30 — [Contact des pages de l'iPhone](runs/2026-11-26-1130-contact-pages-iphone.md) | 🔧 | FUSION-4 : sur iPhone, Réglages › Confidentialité et Conditions donnent l'adresse de contact de ce dépôt, plus celle de l'ancien dépôt iOS ; test d'abord. **#1285 mergée** dans le run (16 checks verts, dont le build iPhone), release v931 (APK 35,7 Mo). Rien à faire de votre côté |
| 26/11 10:30 — [Personas sur iPhone : la bonne source](runs/2026-11-26-1030-personas-outil-3.md) | 🔧 | PERSONAS-OUTIL-3 : dans l'outil des personas, une configuration iPhone (`--store=appstore`) reçoit ses mesures de Santé (« iPhone », « Apple Watch ») et non plus de Samsung Health ; test d'abord, Sources relu. #1283 (un repas, une chose) était déjà mergée et partie (release v929). Aucun changement dans l'app, aucun build de Mac. Rien à faire de votre côté |
| 26/11 09:30 — [Un repas, une chose](runs/2026-11-26-0930-un-repas-une-chose.md) | 🔧 | Dans Ma journée, « Encore … choses aujourd’hui » baisse à chaque repas noté (un point par repas sous Pilou, et le widget aussi) ; dans un repas, toucher les grammes sélectionne le nombre, ce qu’on tape le remplace. Tests d’abord, captures relues. Un build iPhone de PR (code partagé). Rien à faire de votre côté |
| 26/11 08:30 — [Personas du matin](runs/2026-11-26-0830-personas-matin.md) | 💡 | Run « idées », sans code produit. « Prendre soin de soi » (45ᵉ jour, balance) et « Ventre et données » (45ᵉ jour, iPhone seul). À corriger : dans Ma journée, « Encore 3 choses » ne baisse pas quand on note un repas ; taper dans le champ des grammes d'un repas ajoute au nombre au lieu de le remplacer. 4ᵉ persona de suite qui cherche son poids, et sa masse grasse n'a pas de courbe : PROP-SIM-19 attend votre réponse. Aucun build de Mac. Rien d'autre à faire de votre côté |
| 26/11 07:30 — [Adresses de la fiche App Store](runs/2026-11-26-0730-adresses-fiche-iphone.md) | 🔧 | FUSION-4, suite : la fiche App Store, sa description et les notes pour l'examen donnent les adresses du site de ce dépôt (`/HealthTrack/iphone/…`), test à l'appui ; la page d'assistance renvoie aux tickets de ce dépôt. **#1280 mergée** ; la version 893 les a reçues par l'API (rien soumis). Aucun build de Mac. Rien à faire de votre côté |
| 26/11 06:30 — [Pages de l'iPhone sur le site de ce dépôt](runs/2026-11-26-0630-site-iphone.md) | 🔧 | FUSION-4 : la politique de confidentialité, les conditions et l'assistance de l'iPhone sont aussi publiées par le site de ce dépôt (`/HealthTrack/iphone/`), test à l'appui ; **#1278 mergée**, les 4 pages répondent en ligne (release v928) ; les adresses de la fiche App Store changeront au prochain run. Aucun build de Mac. Rien à faire de votre côté |
| 26/11 05:30 — [Restes soldés, Alpha partie](runs/2026-11-26-0530-restes-soldes.md) | 📓 | L'Alpha de cette nuit est partie (04:25 UTC, verte) avec le chiffre de bien-être stable. Deux restes soldés après vérification : les captures iPhone de Tendances › Jour (la veille, et la visite guidée) sont propres ; la pesée des personas passait déjà par Health Connect. Aucun code, aucun build de Mac. Rien à faire de votre côté |
| 26/11 04:30 — [#1275 mergée, TestFlight 1335](runs/2026-11-26-0430-merge-1275.md) | 📓 | **#1275 mergée** : « Bien-être aujourd'hui » ne bouge plus sans nouvelle lecture ni note (captures Accueil relues sur Android et iPhone). TestFlight **1335.1335** (build de cette nuit) ajoutée à « Testeurs Halcya », validée par Apple, 1313 expirée. Release Android v927. Aucun build de Mac lancé. Rien à faire de votre côté |
| 26/11 03:30 — [Bien-être stable, sans relire l'historique](runs/2026-11-26-0330-bien-etre-sans-cache.md) | 🔧 | La correction du run de 02:30 faisait relire toutes les notes de bien-être à chaque ouverture de l'Accueil (contrôle de vitesse rouge). Refaite : l'Accueil calcule toujours son chiffre de la même façon, il ne bouge plus sans nouvelle lecture ni note. Merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 26/11 02:30 — [Un seul chiffre de bien-être](runs/2026-11-26-0230-bien-etre-stable.md) | 🔧 | #1274 (notes de digestion gardées) mergée après le build iPhone vert. POLISH-SIM-80 : le chiffre « Bien-être aujourd'hui » de l'Accueil pouvait passer de 3 à 2,9 puis à 3 sans saisie, selon qu'un autre écran avait déjà fait le calcul complet ; 1re version refaite au run suivant (trop de lectures à l'ouverture). Rien à faire de votre côté |
| 26/11 01:30 — [Notes de digestion gardées](runs/2026-11-26-0130-notes-digestion-gardees.md) | 🔧 | POLISH-SIM-76 et 93 : sans l'objectif « Confort digestif », Objectifs dit « Vos notes de digestion (N jours) sont gardées » et où rallumer l'objectif ; le chemin indiqué par la page Confort digestif nommait un réglage disparu (« Ce qui vous amène » → « Vos objectifs »). Trois vieux défauts du Journal et de l'objectif sport soldés sans objet. Mergée à 02:30 (#1274). Rien à faire de votre côté |
| 26/11 00:30 — [Personas sans lecture du visage](runs/2026-11-26-0030-persona-sans-visage.md) | 🔧 | Outil des simulations : une persona peut maintenant n'avoir jamais activé la caméra (`--face=off`), pour voir l'app sans bien-être lu. #1272 (« Voir un exemple ») mergée à 00:15. Aucun changement dans l'app, aucun build de Mac. Rien à faire de votre côté |
| 25/11 23:30 — [« Voir un exemple » au 14e jour](runs/2026-11-25-2330-exemple-jour-14.md) | 🔧 | POLISH-SIM-85 : le bouton « Voir un exemple » ne propose plus « Exemple au jour 14 » à qui y est déjà (il reste du 1er au 13e jour). Trois anciens défauts des personas soldés après vérification (déjà corrigés). **#1272 mergée** le 26/11 à 00:15 (build iPhone vert). Rien à faire de votre côté |
| 25/11 22:30 — [#1270 mergée](runs/2026-11-25-2230-merge-1270.md) | 📓 | **#1270 mergée** : axe du poids d'au moins 2 kg dans Tendances, balance « à jour » 14 jours dans Sources, carte Agir qui dit s'il y a des pistes à tester (build iPhone vert, captures relues). Elle partira ce soir sur TestFlight et sur Alpha. Rien à faire de votre côté |
| 25/11 21:30 — [Poids, balance et carte Agir](runs/2026-11-25-2130-poids-balance-agir.md) | 🔧 | POLISH-SIM-165 à 167 : dans Tendances, l'axe du poids couvre au moins 2 kg (100 g ne ressemblent plus à une forte montée) ; dans Sources, une balance pesée tous les quelques jours n'est plus « En pause » ; sur l'Accueil, la carte Agir dit « N pistes à tester » ou « Aucune piste à tester pour l'instant ». Mergée au run suivant (#1270). Rien à faire de votre côté |
| 25/11 20:30 — [Personas du soir](runs/2026-11-25-2030-personas-2511-soir.md) | 💡 | Run « idées », sans code produit. Deux personas jouées : « Ventre, sans technique » au 14ᵉ jour après la mise à jour et « Stressé et pressé » au 45ᵉ jour avec une balance. À corriger : dans Tendances, 100 g de poids ressemblent à une forte montée ; dans Sources, une balance passe « En pause » après 3 jours sans pesée ; sur l'Accueil, la carte « Agir » mène à une page vide quand rien n'est à tester. Aucun build de Mac. Rien à faire de votre côté |
| 25/11 19:30 — [#1267 mergée](runs/2026-11-25-1930-merge-1267.md) | 📓 | **#1267 mergée** : à la fin d'un essai, le bilan garde ses lanternes ; le lendemain d'un jour manqué, Pilou hausse les épaules en souriant (build iPhone vert, captures relues). Run court de journal, sans build de Mac. Rien à faire de votre côté |
| 25/11 18:30 — [Les lanternes du bilan](runs/2026-11-25-1830-lanternes-du-bilan.md) | 🔧 | LANT-2b : à la fin d'un essai, le bilan garde ses lanternes et « Consigne tenue N jours sur 5 prévus » ; le lendemain d'un jour manqué, Pilou hausse les épaules en souriant (« Pas grave : la prochaine lanterne vous attend. »). Mergée au run suivant (#1267). Rien à faire de votre côté |
| 25/11 17:30 — [Rituel du soir : la question](runs/2026-11-25-1730-lant4-question.md) | 💡 | LANT-4 : maquette du rituel du soir en 2D (Pilou range son téléphone, « Bonne nuit. »), question 2D / 3D posée plus haut. #1265 (journal du run précédent) fermée : son contenu était déjà sur main. Aucun code, aucun build de Mac. **Une réponse attendue de vous** |
| 25/11 16:30 — [#1264 mergée](runs/2026-11-25-1630-merge-1264.md) | 📓 | **#1264 mergée** : le Pilou du widget Android et des rappels du soir sur iPhone est celui de l'app (build iPhone vert, planche avant / après et console du simulateur relues). Run court de journal, sans build de Mac. Rien à faire de votre côté |
| 25/11 15:30 — [Le vrai Pilou dans le widget](runs/2026-11-25-1530-widget-poses.md) | 🔧 | WIDGET-POSES : le Pilou du widget Android et des rappels du soir sur iPhone est maintenant celui de l'app (même modèle 3D, entier, sur fond crème), au lieu de l'ancienne figurine des maquettes. Rendu reproductible au bit près. Mergée au run suivant (#1264). Rien à faire de votre côté |
| 25/11 14:30 — [Banc de perf plus solide](runs/2026-11-25-1430-perf-hangup.md) | 🔧 | main était rouge pour une coupure ponctuelle pendant le banc de lectures (rien dans l'app) : job relancé, et le banc refait un essai au lieu de s'arrêter. Aucun changement dans l'app, aucun build de Mac. Rien à faire de votre côté |
| 25/11 13:30 — [#1261 mergée](runs/2026-11-25-1330-merge-1261.md) | 📓 | **#1261 mergée** : pendant un essai, le matin qui suit un jour réussi, la lanterne de l'îlot s'allume un instant sur l'Accueil (build iPhone vert, captures de l'Accueil relues sur iPhone en clair et en sombre). Release v918. Run court de journal, sans build de Mac. Rien à faire de votre côté |
| 25/11 12:30 — [La lanterne du matin](runs/2026-11-25-1230-lanterne-du-matin.md) | 🔧 | **#1260 mergée** (votre note en losange dans Tendances), release v917. LANT-3 : pendant un essai, le matin qui suit un jour réussi, la lanterne de l'îlot s'allume un instant sur l'Accueil et Pilou la regarde, une fois par jour. PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 25/11 11:30 — [Votre note sur la courbe](runs/2026-11-25-1130-note-en-losange.md) | 🔧 | POLISH-NOTE-LOSANGE : dans Tendances, en Semaine et en Mois, la note que vous avez donnée apparaît en losange quand la courbe lissée s'en écarte (une « douleur » reste à 1 au lieu de se fondre vers 2,5), avec la légende « votre note · l'estimation du jour ». Le modèle ne change pas ; son échelle du ventre, plus serrée que celle affichée, passera au banc. PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 25/11 10:30 — [#1258 mergée](runs/2026-11-25-1030-merge-1258.md) | 📓 | **#1258 mergée** : le bilan d'un essai compte tous les jours tirés au sort, tenus ou non (build iPhone vert, capture Agir relue sur iPhone). Release v916. Run court de journal, sans build de Mac. Rien à faire de votre côté |
| 25/11 09:30 — [Un essai compte tous ses jours](runs/2026-11-25-0930-essai-par-calendrier.md) | 🔧 | POLISH-ESSAI-SANS : le résultat d'un essai compte le lendemain de chaque jour tiré au sort, que la consigne ait été tenue ou non (les jours « comme d'habitude » un peu au-dessus du seuil disparaissaient, et le bilan penchait vers « Plutôt oui »). PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 25/11 08:30 — [Essai : jours « sans » perdus](runs/2026-11-25-0830-idees-essai-sans.md) | 💡 | Run « idées », sans code. Un essai écarte les jours « sans » où la mesure dépasse le seuil, alors que l'écran demandait « comme d'habitude » : banc à vérité connue, compter par calendrier conclut 100 % des essais (47 % aujourd'hui) sans pencher vers « Plutôt oui ». Correctif prêt pour le prochain run de code. La maquette des courbes de la montre (19/11) attend votre réponse. Aucun build de Mac |
| 25/11 07:30 — [#1255 mergée](runs/2026-11-25-0730-merge-1255.md) | 📓 | **#1255 mergée** : en notant un repas sans photo, « Hier midi » et « Hier soir » règlent l'heure en un geste (build iPhone vert, captures relues). Run court de journal, sans build de Mac. Rien à faire de votre côté |
| 25/11 06:30 — [#1254 mergée, repas d'hier en un geste](runs/2026-11-25-0630-repas-d-hier.md) | 🔧 | **#1254 mergée** (bouton secondaire touché lisible ; captures `/data` iPhone relues). Nouveau repas sans photo : boutons « Hier midi » et « Hier soir » sous l'heure (hier 12:30 ou 19:30), demandés par la persona « Ventre et données » qui s'y reprenait à trois fois dans le champ date. PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 25/11 05:30 — [Bouton touché lisible, TestFlight 1313](runs/2026-11-25-0530-contraste-bouton-touche.md) | 🔧 | TestFlight **1313.1313** (build de cette nuit) chez « Testeurs Halcya » et soumise à l'examen bêta, anciennes builds expirées. POLISH-CONTRASTE-FOCUS : un bouton secondaire qu'on vient de toucher (« Télécharger en CSV », etc.) garde un texte lisible (3,98:1 → 4,86:1 en clair). PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 25/11 04:30 — [#1252 mergée](runs/2026-11-25-0430-merge-1252.md) | 🔧 | **#1252 mergée** : après « Télécharger en CSV », l'app dit ce que contient le fichier (lignes, période, compte de chaque mesure) ; build iPhone vert, captures relues sur les deux. Aucun build iPhone de plus. Rien à faire de votre côté |
| 25/11 03:30 — [L'export CSV dit ce qu'il contient](runs/2026-11-25-0330-contenu-du-csv.md) | 🔧 | POLISH-SIM-163 : après « Télécharger en CSV » (Réglages › Sauvegarde), l'app dit le nombre de lignes, la période et le compte de chaque mesure ; dans le fichier, l'oxygène du sang, la variabilité cardiaque et le cœur au repos ont leur nom (tout s'appelait « Fréquence cardiaque »). PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 25/11 02:30 — [#1250 mergée](runs/2026-11-25-0230-merge-1250.md) | 🔧 | **#1250 mergée** : en notant un repas depuis Ma journée ou l'Accueil, l'onglet d'où vous venez reste allumé (build iPhone vert, captures relues sur les deux ; un job d'émulateur Android bloqué 30 min a été relancé, vert). Rien à faire de votre côté |
| 25/11 01:30 — [Un repas garde son onglet](runs/2026-11-25-0130-onglet-des-repas.md) | 🔧 | POLISH-SIM-162 : en notant un repas depuis Ma journée ou l'Accueil, l'onglet d'où vous venez reste allumé en bas, au lieu de « Données » (deux personas ne savaient plus où elles étaient). PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 25/11 00:30 — [Cache Gradle](runs/2026-11-25-0030-cache-gradle.md) | 🔧 | L'envoi en test interne de main avait échoué sur un refus passager de Maven Central (429) : relancé, et les builds Android gardent désormais leurs dépendances Gradle en cache (moins de téléchargements, aucune minute Mac). Rien à faire de votre côté |
| 24/11 21:30 — [Le jour parle aussi du ventre](runs/2026-11-24-2130-jour-ventre-et-facteurs.md) | 🔧 | POLISH-SIM-161 : dans Tendances, avec Bien-être et Confort digestif affichés, le détail d'un jour dit ce qui a pu jouer sur les deux, chacun sous sa note (il ne parlait que du bien-être). POLISH-SIM-160 : dans Objectifs, une famille sans graphique nomme ses facteurs comparés. PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 24/11 23:30 — [#1247 mergée, main relancé](runs/2026-11-24-2330-merge-1247-maven-429.md) | 🔧 | **#1247 mergée** (Tendances : une mesure d'une troisième unité reste dans « + », grisée, avec la raison ; essai : « Consigne tenue 2 jours sur 5 prévus » ; build iPhone vert, captures relues sur les deux). Le seul check rouge de main venait d'un refus passager de Maven Central (429) au téléchargement de JUnit : job relancé, et ces fichiers sont désormais gardés en cache par la CI. Rien à faire de votre côté |
| 24/11 22:30 — [#1246 mergée, troisième unité et essai](runs/2026-11-24-2230-troisieme-unite-et-essai.md) | 🔧 | **#1246 mergée** (le détail d'un jour parle aussi du ventre ; Objectifs nomme les facteurs comparés ; build iPhone vert, captures relues). POLISH-SIM-158 : dans Tendances, une mesure d'une troisième unité reste dans « + », grisée, avec « Deux unités au plus : retirez une courbe ». POLISH-SIM-159 : la page d'un essai dit « Consigne tenue 1 jour sur 5 prévus ». PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 24/11 20:30 — [Personas du soir](runs/2026-11-24-2030-personas-2411-soir.md) | 💡 | Deux personas jouées : « Ventre et données » au 45ᵉ jour (Android seul) et « Tout mesurer » au 14ᵉ jour après la mise à jour (montre Amazfit). À corriger : dans Tendances, « Pas » disparaît du « + » sans explication ; la page d'un essai dit « Jour 4 sur 10 » puis « 1 jour réussi sur 5 » ; Objectifs › Sommeil compte des facteurs sans les nommer ; le détail d'un mauvais jour de ventre ne parle que du bien-être. #1244 mergée, main vert. Rien à faire de votre côté |
| 24/11 19:30 — [#1244 : note iPhone sans « Android »](runs/2026-11-24-1930-note-iphone-sans-android.md) | 🔧 | Les deux checks rouges de #1244 venaient de sa note de Nouveautés de l'iPhone, qui parlait d'« Android » (interdit sur iPhone) : reformulée, nouveau build iPhone lancé, merge au run suivant. Rien à faire de votre côté |
| 24/11 18:30 — [Variabilité cardiaque sans sigle](runs/2026-11-24-1830-vfc-sans-sigle.md) | 🔧 | POLISH-SIM-72-iOS-c : sur iPhone, le sigle « SDNN » disparaît ; la mesure de l'app Santé s'appelle « Variabilité cardiaque, app Santé » dans Tendances, votre norme et Analyses (elle se distingue de celle d'une sauvegarde Android). Android inchangé. PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 24/11 17:30 — [#1242 mergée](runs/2026-11-24-1730-merge-coeur.md) | 📓 | **#1242 mergée** : « Cœur » remplace « FC » partout dans l'app (build iPhone vert, captures iPhone de Ma journée et de Tendances › Jour relues). Run court de journal, sans build de Mac. Rien à faire de votre côté |
| 24/11 16:30 — [« Cœur » au lieu de « FC »](runs/2026-11-24-1630-coeur-au-lieu-de-fc.md) | 🔧 | POLISH-SIM-86b : le sigle « FC » disparaît de l'app (« Cœur », « Cœur la nuit », « fréquence cardiaque », comme dans Sources). Code mort de l'appareil photo de l'iPhone retiré. PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 24/11 15:30 — [#1240 mergée, backlog relu](runs/2026-11-24-1530-backlog-releve.md) | 📓 | **#1240 mergée** (vos notes d'avant la caméra dans Tendances › Jour ; build iPhone vert, captures relues). Run de journal sans build de Mac : deux défauts signalés par les personas étaient déjà réglés ou ont disparu avec la refonte, rayés du backlog. Rien à faire de votre côté |
| 24/11 14:30 — [#1239 mergée, notes d'avant la caméra](runs/2026-11-24-1430-notes-avant-camera.md) | 🔧 | **#1239 mergée** (la puce « Poids · dès 3 pesées » a la taille de ses voisines ; captures iPhone de Tendances relues). POLISH-SIM-88 : une note de bien-être donnée avant d'activer la lecture du visage apparaît de nouveau sur son jour dans Tendances › Jour (elle n'était pas lue). PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 24/11 13:30 — [#1238 mergée, puce du poids à la bonne taille](runs/2026-11-24-1330-puce-poids-taille.md) | 🔧 | **#1238 mergée** (« Poids · dès 3 pesées » dans Tendances, build iPhone vert, captures relues sur les deux téléphones). Retouche : cette puce grise était plus haute que ses voisines ; elle a maintenant leur taille. PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 24/11 12:30 — [#1237 mergée, poids dès 3 pesées](runs/2026-11-24-1230-poids-des-3-pesees.md) | 🔧 | **#1237 mergée** (10 derniers tests de l'iPhone hors d'`overlay/`, build iPhone vert). POLISH-SIM-94 : dans Tendances, après une première pesée, « + » montre « Poids · dès 3 pesées » en gris (le poids n'apparaissait nulle part avant la 3ᵉ pesée). PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 24/11 11:30 — [#1236 mergée, derniers tests de l'iPhone](runs/2026-11-24-1130-fusion-overlay-derniers-tests.md) | 🔧 | **#1236 mergée** (images de Pilou et pages publiques de l'iPhone dans le code commun, build iPhone vert). FUSION-3 : les 10 derniers tests de l'iPhone qui relisent des fichiers (projet Xcode, fiche App Store, workflows) passent dans le code commun et tournent aussi avec ceux d'Android ; le dossier `overlay/` ne garde que les notes de Nouveautés de l'iPhone. Rien de visible. PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 24/11 10:30 — [#1235 mergée, fichiers publics de l'iPhone](runs/2026-11-24-1030-fusion-overlay-public.md) | 🔧 | **#1235 mergée** (34 tests de l'iPhone dans le code commun, build iPhone vert). FUSION-3 : les 2 images de Pilou des notifications du soir et les 2 pages publiques de l'iPhone (conditions, confidentialité) passent d'`overlay/` à `app/public/` ; le site de l'iPhone les lit là. Rien de visible. PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 24/11 09:30 — [Tests de l'iPhone dans le code commun](runs/2026-11-24-0930-fusion-overlay-tests.md) | 🔧 | FUSION-3, dossier `overlay/` entamé : 34 fichiers de tests de l'iPhone (97 tests) passent dans le code commun et tournent aussi avec ceux d'Android, verts sans changement. Rien de visible. PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 24/11 08:30 — [Maquette « noter son poids »](runs/2026-11-24-0830-maquette-poids.md) | 💡 | Proposition **PROP-SIM-19** avec maquette : « Noter mon poids » dans Ma journée › Autre chose, une feuille qui reprend le dernier poids, et dans Tendances une courbe lissée avec sa marge ; ni cible, ni IMC jugé, ni rappel. L'accueil promet déjà le poids à « Prendre soin de moi » sans place simple pour le noter. #1233 mergée, main vert. **Votre réponse en un mot** : « PROP-SIM-19 oui », « saisie seulement » ou « non » |
| 24/11 07:30 — [Derniers correctifs iPhone fondus](runs/2026-11-24-0730-fusion-01-27.md) | 🔧 | FUSION-3 : les correctifs iPhone 01 (variante App Store) et 27 (« Votre avis » sur iPhone) passent dans le code commun, `iphone/patches/` est vide. Sur iPhone, le lien de secours de « Votre avis » ouvre un ticket de ce dépôt au lieu de l'ancien dépôt iOS ; rien ne change sur Android. Alpha du 23/11 partie à 06:26 UTC. PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 24/11 06:30 — [#1231 mergée](runs/2026-11-24-0630-merge-fodmap-aliments.md) | 🔧 | **#1231 mergée** (POLISH-SIM-157 : dans Objectifs › « Ce qui a été comparé », chaque groupe FODMAP nomme ses aliments ; captures iPhone relues), release **v898**. Pas de nouveau code pour ne pas relancer de build iPhone pendant celui du soir. L'Alpha du 23/11 au soir n'était pas encore partie à 05:40 UTC (cron en retard). Rien à faire de votre côté |
| 24/11 05:30 — [#1230 mergée, aliments FODMAP](runs/2026-11-24-0530-fodmap-aliments.md) | 🔧 | **#1230 mergée** (« Cœur » selon la montre ; capture iPhone de l'accueil relue). TestFlight **1290.1290** chez « Testeurs Halcya » et soumise à l'examen bêta, anciennes builds expirées. POLISH-SIM-157 : dans Objectifs › « Ce qui a été comparé », chaque groupe FODMAP dit ses aliments (« sorbitol (FODMAP : pruneaux, prunes) »). Alpha du 23/11 pas encore partie à 04:45 UTC. PR prête, merge au run suivant. Rien à faire de votre côté |
| 24/11 04:30 — [#1229 mergée, cœur selon la montre](runs/2026-11-24-0430-coeur-selon-montre.md) | 🔧 | **#1229 mergée** (ancien objectif « stress » ; Réglages relus sur Android et iPhone). POLISH-SIM-156 : à l'étape 3 de l'accueil, « Cœur » passe dans « Selon votre montre », plus promis aux bracelets qui ne l'envoient pas. TestFlight du soir lancé à la main : le cron de 20:20 UTC n'était pas parti à 03:30 UTC ; l'Alpha de 23:45 pas encore partie non plus. PR prête, merge au run suivant. |
| 24/11 03:30 — [Ancien objectif « stress »](runs/2026-11-24-0330-ancien-objectif-stress.md) | 🔧 | POLISH-SIM-155 : Réglages › Vos objectifs dit à qui suivait « Mon stress et mon sommeil » que Bien-être le remplace, le sommeil compris. PR prête ; merge au run suivant après le build iPhone. Build du soir et TestFlight pas encore partis à 02:30 UTC. Rien à faire de votre côté |
| 24/11 02:30 — [#1227 mergée, faux repas des personas](runs/2026-11-24-0230-merge-pilou-faux-repas.md) | 🔧 | **#1227 mergée** (la tête entière de Pilou dépasse de la carte de Tendances ; captures iPhone relues en clair, sombre et vide). Outil des personas : leurs repas décrits par écrit sont mieux lus (« pâtes » n'est plus du pâté, « 200 g » compte). Les PR qui ne touchent que cet outil ne lancent plus de build iPhone. Rien à faire de votre côté |
| 24/11 01:30 — [#1226 mergée, Pilou dans Tendances](runs/2026-11-24-0130-pilou-tendances.md) | 🔧 | **#1226 mergée** (habitudes sur place, portion de plus de 2 kg à confirmer ; captures Ma journée et Repas relues sur iPhone et Android). POLISH-SIM-154 : dans Tendances, la tête entière de Pilou dépasse de la carte (elle était coupée aux yeux) ; PR prête, merge au run suivant après le build iPhone. Build du soir et TestFlight pas encore partis à 00:40 UTC. Rien à faire de votre côté |
| 24/11 00:30 — [Habitudes sur place, portion à 5 kg](runs/2026-11-24-0030-liste-stable-portion.md) | 🔧 | POLISH-SIM-152 : dans Ma journée, une habitude répondue reste à sa place (« Noté ») jusqu'à la dernière réponse, le toucher suivant ne tombe plus sur la mauvaise ligne. POLISH-SIM-153 : au-delà de 2 kg pour un aliment, « 5 kg, c’est bien ça ? ». PR en brouillon puis prête ; merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 23/11 23:30 — [#1224 mergée](runs/2026-11-23-2330-merge-poids.md) | 🔧 | **#1224 mergée** (POLISH-SIM-151 : Tendances dit « Poids : la courbe arrive à 3 pesées. » avant la 3ᵉ pesée ; captures relues sur iPhone et Android), release **v892** (35,7 Mo). Build iPhone du soir, TestFlight et Alpha pas encore partis à 23:30 (cron en retard) : soumission bêta au run suivant. Rien à faire de votre côté |
| 23/11 22:30 — [#1222 mergée, poids sans courbe](runs/2026-11-23-2230-poids-courbe-a-venir.md) | 🔧 | Sur iPhone, « Réglages de l’app › Sources » s'écrit en texte (#1222, captures relues). Tendances dit « Poids : la courbe arrive à 3 pesées. » quand on vient de l'Accueil avant la 3ᵉ pesée (POLISH-SIM-151, PR à merger au prochain run). Rien à faire de votre côté |
| 23/11 21:30 — [#1222 : « Réglages de l’app » en texte](runs/2026-11-23-2130-roue-en-texte.md) | 🔧 | Sur iPhone, les renvois aux réglages de Halcya écrivent « Réglages de l’app › Sources » en toutes lettres (plus de roue en emoji couleur) ; Android inchangé. Un build iPhone relancé sur #1222, merge au run suivant après les captures. Rien à faire de votre côté |
| 23/11 20:30 — [personas du soir, #1222 retenue](runs/2026-11-23-2030-personas-2311-soir.md) | 💡 | Deux personas : « Tout mesurer » J1 (Galaxy Watch) et « Prendre soin de soi » J14 (Android seul). À corriger : « Poids » de l'Accueil ouvre Tendances sans courbe Poids, la liste de Ma journée remonte sous le doigt, 5 kg de pâtes acceptés sans un mot. #1222 (roue des réglages sur iPhone) pas mergée : la roue s'affiche en emoji couleur, correction au prochain run de code. Rien à faire de votre côté |
| 23/11 19:30 — [#1222 prête, poids de la note](runs/2026-11-23-1930-poids-de-la-note.md) | 🔧 | Main vert (release **v890**). Ajouté à #1222 : « Comment c’est calculé » du bien-être dit que votre note compte environ 5 fois plus que la lecture du visage au départ (une persona ne comprenait pas « 4/5 et 2,8 donnent 3,7 »). PR passée en « prête » : un seul build iPhone pour les deux correctifs, merge au run suivant. Rien à faire de votre côté |
| 23/11 18:30 — [DEM-IOS-7, #1222 en brouillon](runs/2026-11-23-1830-roue-reglages-iphone.md) | 🔧 | Main vert (release **v890**). Sur iPhone, les textes qui renvoient aux réglages de l'app écrivent « ⚙ Réglages › Sources » pour ne pas être pris pour l'app Réglages d'Apple ; Android inchangé. PR en brouillon pour grouper un seul build iPhone. Rien à faire de votre côté |
| 23/11 17:30 — [#1220 mergée, cibles arrondies](runs/2026-11-23-1730-merge-cibles-arrondies.md) | 🔧 | **#1220 mergée** (build iPhone vert, captures Agir relues des deux côtés : « Dormir au moins 7 h 55 »). Un nouvel essai d'Agir propose une cible ronde. Pas de nouveau code ce run pour ne pas relancer un build iPhone (heures de Mac). Rien à faire de votre côté |
| 23/11 16:30 — [PERSONAS-OUTIL-1, #1220 prête](runs/2026-11-23-1630-personas-objectifs.md) | 🔧 | Main vert (release **v889**, 35,7 Mo). Outil des personas : une persona installée après la refonte a les objectifs de la refonte (« Tout mesurer » a de nouveau le confort digestif). Ajouté à la PR des cibles arrondies, qui passe en « prête » : un seul build iPhone pour les deux. Rien à faire de votre côté |
| 23/11 15:30 — [#1219 mergée, cibles d'essai arrondies](runs/2026-11-23-1530-cible-arrondie.md) | 🔧 | **#1219 mergée** (POLISH-SIM-146 : le matin, « Ce qui a pu jouer » lit les pas de la veille ; capture iPhone de Tendances › Jour relue). Un nouvel essai donne une cible ronde (« Faire au moins 8 700 pas » plutôt que 8 683) ; PR en brouillon pour grouper le build iPhone avec le correctif suivant. Rien à faire de votre côté |
| 23/11 14:30 — [#1218 mergée, POLISH-SIM-146](runs/2026-11-23-1430-pas-du-matin.md) | 🔧 | **#1218 mergée** (outil des personas). Tendances › Jour, aujourd'hui : « Ce qui a pu jouer ce jour-là » ne compare plus les pas, l'activité ou l'écran d'un jour à peine commencé (162 pas à 8 h 30) à une journée entière ; il lit la veille et le dit (« La veille, moins de pas que d'habitude »). Jours passés inchangés. PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 23/11 13:30 — [#1217 mergée, PERSONAS-OUTIL-2](runs/2026-11-23-1330-rapport-merge-faux-repas.md) | 🔧 | **#1217 mergée** (build iPhone relu : le rapport PDF s'enregistre de nouveau sur le simulateur, captures de restauration revenues). Outil des personas : un repas décrit par écrit revient avec ses propres aliments, plus « Pâtes à la carbonara » à chaque fois. Outillage seulement, aucun build iPhone. Rien à faire de votre côté |
| 23/11 12:30 — [#1216 mergée, rapport PDF sur iPhone](runs/2026-11-23-1230-ios-rapport-pdf-abonne.md) | 🔧 | **#1216 mergée** (mode captures iPhone dans le code commun). Le geste réel « rapport PDF enregistré dans Fichiers » échouait sur tous les builds iPhone depuis le 6/11 (fin de la période de lancement iPhone : la carte montrait « Débloquer ») ; la sonde pose les droits d'abonné le temps de l'essai. PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 23/11 11:30 — [#1215 mergée, FUSION-3 : correctif 02](runs/2026-11-23-1130-fusion-mode-captures.md) | 🔧 | **#1215 mergée** (captures iPhone de l'Accueil relues : la bulle cadeau ne cache plus Bien-être). Build & Release du merge tombé sur une limite de débit de Maven Central (429), relancé et vert : release v885. Correctif iPhone 02 (mode captures du simulateur) fondu dans le code commun, absent de l'APK et de TestFlight. 2 correctifs restent. Rien à faire de votre côté |
| 23/11 10:30 — [#1214 mergée, POLISH-SIM-148](runs/2026-11-23-1030-polish-cadeau-ilot.md) | 🔧 | **#1214 mergée** (captures iPhone relues : galet Activité lilas, « Pas encore de note »), release **v884** (35,7 Mo). Le cadeau du jour de la première semaine se pose dans le coin de l'îlot et ne cache plus la bulle « Bien-être » (test sur toutes les rotations des bulles) ; PR prête, merge au run suivant après le build iPhone. Rien à faire de votre côté |
| 23/11 09:30 — [Galet Activité, bien-être du jour 1](runs/2026-11-23-0930-polish-galet-bienetre-j1.md) | 🔧 | Trois défauts des personas du matin corrigés en une PR (un seul build iPhone) : le galet Activité à côté de Pilou n'est plus noir, Tendances › Jour ne donne plus un bien-être « estimé » tant que rien n'est noté ni lu (« Pas encore de note »), Ma journée dit « vos pistes digestives » comme Objectifs. Tests et captures verts ; merge au run suivant après les captures iPhone. Rien à faire de votre côté |
| 23/11 08:30 — [Personas du matin, #1212 mergée](runs/2026-11-23-0830-personas-2311-matin.md) | 💡 | Deux personas jouées (« Ventre, sans technique » au 1er jour avec un bracelet sur iPhone, « Stressé et pressé » au 14e jour après la mise à jour) : 6 défauts vérifiés au backlog, dont un galet noir à côté de Pilou dans « Votre bien-être » et un bien-être « 3,4/5 estimé » au 1er jour sans aucune note. Build iPhone 1268.1268 validée pour les testeurs. **#1212 mergée** (signature App Attest des analyses sur iPhone ; un émulateur relancé après un délai dépassé). 3 correctifs iPhone restent. Rien à faire de votre côté |
| 23/11 07:30 — [#1211 mergée, FUSION-3 : 38 et 49](runs/2026-11-23-0730-fusion-app-attest.md) | 🔧 | **#1211 mergée** (captures iPhone de Nouveautés et Premium relues : prix lus dans StoreKit). Correctifs iPhone 38 (signature App Attest des analyses et de l'avis) et 49 (outil des personas iPhone) fondus dans le code commun, une seule PR donc un seul build iPhone ; rien ne change sur Android (tests). 3 correctifs restent. Rien à faire de votre côté |
| 23/11 06:30 — [FUSION-3 : correctif 24, #1211 prête](runs/2026-11-23-0630-fusion-abonnement.md) | 🔧 | Correctif iPhone 24 (l'iPhone prend son plugin d'abonnement App Store) fondu dans le code commun, ajouté à #1211 qui passe en « prête » : un seul build iPhone pour deux correctifs. Android inchangé (tests). 5 correctifs restent. Rien à faire de votre côté |
| 23/11 05:30 — [#1210 mergée, FUSION-3 : correctif 28](runs/2026-11-23-0530-fusion-nouveautes.md) | 🔧 | **#1210 mergée** (captures iPhone de Sources relues : guides des montres par l'app Santé, carte Visage), release **v881** (35,7 Mo). Correctif iPhone 28 (quelles notes de « Nouveautés » l'iPhone montre) fondu dans le code commun ; PR en brouillon pour grouper le build iPhone avec le correctif suivant. 6 correctifs restent. Rien à faire de votre côté |
| 23/11 04:30 — [FUSION-3 : correctif 16, #1210 prête](runs/2026-11-23-0430-fusion-guides-montres.md) | 🔧 | Correctif iPhone 16 (guides « Votre montre n’apparaît pas ? » par l’app Santé) fondu dans le code commun, ajouté à #1210 qui passe en « prête » : un seul build iPhone pour trois correctifs. Alpha de la nuit partie (verte). 7 correctifs restent. Rien à faire de votre côté |
| 23/11 03:30 — [#1209 mergée, FUSION-3 : 05 et 10](runs/2026-11-23-0330-fusion-plugins.md) | 🔧 | **#1209 mergée** (captures iPhone de Licences relues). TestFlight **1268.1268** validée pour « Testeurs Halcya », rien à expirer. Correctifs iPhone 05 et 10 (plugins natifs absents sur iPhone) fondus dans le code commun ; PR en brouillon pour grouper le build iPhone avec le correctif suivant. 8 correctifs restent. Rien à faire de votre côté |
| 23/11 02:30 — [FUSION-3 : correctifs 47, 39 ; #1208 mergée](runs/2026-11-23-0230-fusion-notifs-licences.md) | 🔧 | **#1208 mergée** (captures iPhone relues). TestFlight **1268.1268** ajoutée à « Testeurs Halcya » et soumise à l'examen bêta. Deux correctifs iPhone de plus fondus (message « notifications refusées », page Licences) ; rien ne change sur Android. 10 restent. Rien à faire de votre côté |
| 23/11 01:30 — [FUSION-3 : correctifs 06, 07, 15](runs/2026-11-23-0130-fusion-textes.md) | 🔧 | Trois correctifs propres à l'iPhone (texte de Sauvegarde, montre Huawei, « app Santé ») fondus dans le code commun en une seule PR, donc un seul build iPhone ; rien ne change sur Android (tests). 12 correctifs restent. Mergée au run suivant (#1208). Rien à faire de votre côté |
| 23/11 00:30 — [Archive S47, #1206 mergée](runs/2026-11-23-0030-archive-s47.md) | 📝 | **#1206 mergée** (correctif iPhone 18, rappel de portion, dans le code commun ; captures iPhone relues), release **v878** (35,7 Mo). Résumé S47 archivé dans `semaines/2026-S47.md`, résumé S48 ouvert, bilan des heures de Mac de S47 (147,6 h). Build iPhone et Alpha de la nuit pas encore partis à 00:30 (cron en retard comme d'habitude). Rien à faire de votre côté |

---

## Charte

Ce dossier appartient à Claude. C'est sa mémoire entre deux exécutions de la routine
autonome (une par heure depuis le 22/10 au soir) : chaque exécution démarre sans aucun souvenir et
**doit lire ce fichier en premier**. Claude peut et doit faire évoluer cette charte
quand il trouve une meilleure façon de travailler (en le notant dans le compte rendu du run).

**Méta-leçons C — comment travaille la routine** (propriétaire, 07/11 au soir) : 12. Elle ne connaît que le prompt et
le dépôt. 13. Une spécification vit dans le dépôt, le prompt y renvoie. 14. Les mots exacts du propriétaire passent
tels quels. 15. Ce qui est remplacé est retiré explicitement. 16. Chaque transmission est vérifiée. 17. Les personas
simulées (`PERSONAS.md`, `simulations/`) jugent chaque version. Dès le 09/11 : **mode polish** (`PRODUIT.md` § 0).

**Routine unique, Android et iPhone** (décision du 13/11 vers 19:05) : la version iPhone vit dans `iphone/` et cette
routine fait les deux apps. À chaque run, après cette charte : `iphone/README.md`, `iphone/journal/README.md` § 3, § 4
et § 8, `iphone/journal/PARITE.md`, `iphone/journal/BACKLOG.md`. Une fonction n'est livrée que des deux côtés, ou avec
une ligne de `PARITE.md` qui dit pourquoi pas. **Depuis le 15/11 (IOS-HEAD), une seule PR pour les deux apps** :
`iphone/upstream.json` suit `HEAD`, l'app iPhone embarque le code partagé du commit construit ; plus de PR de suivi ni
de `--latest`. Avant de pousser une PR qui touche `app/src/` : `cd iphone && scripts/upstream.sh` (clone complet :
`git fetch --unshallow --filter=blob:none origin main`) ; un correctif cassé se refait dans la même PR (`patch -p1
--fuzz=3` dans `upstream/`, puis `git -C upstream diff -- <fichier> > patches/NN.patch`), tests et lint dans
`iphone/upstream/app`. Une PR qui touche `app/` (hors `app/android/`, `app/store/`, `.md`), `relay/`, `iphone/` (hors
journal, fiche, site) ou `ios-build.yml` attend « iOS — build simulateur » (job Ubuntu en quelques minutes, job macOS
près d'une heure) et ses captures (`captures/pr-<N>`) avant le merge : **une PR de code est donc le plus souvent
mergée par le run suivant**, qui regarde les captures iPhone des écrans touchés ; pendant la build, le run prépare
l'étape d'après sur une autre branche, sans la pousser en PR avant le merge de la première (chaque merge remet
l'autre en retard sur main). Une PR de journal seul ne déclenche pas la build. Le merge envoie seul la build sur
TestFlight. Les
workflows qui parlent à Apple ne se lancent que sur main. Il n'y a plus de relais : ni `POUR-IOS.md`, ni
`DEMANDES.md`, ni `POUR-ORCHESTRATEUR.md` (archivés dans `archives/ancien-montage/`). Le compte rendu donne la version
Android, la build TestFlight et la parité.

**Captures de l'iPhone** (FUSION-5, 26/11) : branches `captures/main` (build du soir de `main`) et `captures/pr-<N>`
(build d'une PR), fichiers `iphone-16e-<demo|vierge>-<clair|sombre>-<écran>.png`. Pour en regarder une :
`git fetch origin captures/pr-<N> --depth=1 && git show FETCH_HEAD:<fichier> > /tmp/<fichier>`. La charte de
`iphone/journal/README.md` ne garde que ce qui est propre à l'iPhone (§ 3 build, § 4 versions, § 5 contraintes, § 8
gestes chez Apple) ; ses § 2 et § 6 renvoient ici.

**Gestes du propriétaire automatisés** (décision du 12/11 vers 16:15, `PRODUIT.md` § 4) : une action du propriétaire
n'arrive jamais comme une simple marche à suivre. Elle a sa voie : (a) CI ou API, au besoin après un droit accordé une
fois (droit et commande exacte) ; (b) mission navigateur `missions/Pxx.md` (page de départ, étapes, valeurs exactes,
vérification finale, capture attendue), qu'il fait exécuter par Claude dans Chrome (« fais la mission Pxx ») ; (c) son
geste (production, envoi final d'une déclaration qui l'engage, signature, paiement, identité), préparé jusqu'au bouton.
Aucun secret dans une mission ; ne jamais demander de mot de passe. Toute autre tâche qu'un modèle Claude pourrait
faire à sa place est proposée en tête du résumé.

| Fichier | Rôle |
|---|---|
| `README.md` | Résumé de la semaine en cours (en tête) + charte : mission, principes, protocole d'un run |
| `BACKLOG.md` | Vision, chantiers long terme, backlog priorisé, idées en vrac |
| `RESEARCH.md` | Veille : besoins utilisateurs, ce qui marche en health tech, avancées ML — avec sources |
| `IDEES.md` | Idées des runs « idées » (08 h / 20 h Paris), classées impact × faisabilité, avec sources et pistes |
| `runs/AAAA-MM-JJ-HHMM-<slug>.md` | Un compte rendu par exécution (un fichier par run = pas de conflit Git) |
| `semaines/AAAA-Sww.md` | Résumés des semaines passées |
| `INFRA.md` | Infrastructure (20/10 au soir) : Google Cloud `healthtrack-824b26`, connexion GitHub sans clé (WIF, `main` seulement), comptes de service, Vertex AI, Play, ce que la CI peut faire seule |
| `DESIGN.md` | Identité visuelle « Clair et précis » validée le 20/10 au soir : couleurs, polices, formes, icône, maquettes, étapes de mise en œuvre |
| `PRODUIT.md` | **Chantier produit (décisions du 20/10 au soir)** : décisions, 10 jalons et leur état, inventaire des écrans, « Actions du propriétaire » — à lire juste après ce résumé |
| `BIEN-ETRE-AUTO.md` | État des lieux et plan du chantier « bien-être entièrement automatique » (consigne §00000), décisions Y / X, ce qu'il faut valider sur le téléphone |
| `missions/Pxx.md` | Missions navigateur du propriétaire (décision du 12/11) : index et règles dans `missions/README.md` |
| `protocoles/<famille>.md` | Spécifications de protocoles d'appareils, écrites avec nos mots (sources citées) : le code des pilotes est écrit à partir d'elles |

---

## 000000000. Décisions produit du propriétaire du 20 octobre 2026 au soir — CADRE GÉNÉRAL (remplace §00000 / §0000000 comme cadre)

Objectif : un **produit vendable sur Google Play**, compréhensible en 30 s, sans jamais casser ce qui marche.
Détail complet, jalons, inventaire et actions du propriétaire : **[`PRODUIT.md`](PRODUIT.md)** (le prompt de la
routine fait foi). Points clés pour chaque run :
- **Workflow « Play — AAB »** (21/10) : tant que le propriétaire n'a pas fait P9, il est rouge sur `main` avec le
  message « Clé d'envoi Play absente » (ou « Accès refusé ») — c'est attendu, **pas** la « priorité absolue » de
  réparation ; tout autre échec de ce workflow, si.
- **Ordre** : signalement en cours éventuel → jalons de `PRODUIT.md` dans l'ordre (2 nettoyage → 3 variantes
  play / sideload → 4 onboarding + « aha » → 5 analyses avec délais → 6 Billing, paywalls, crédits, relais Gemini →
  7 FODMAP + PDF → 8 Health Connect → 9 i18n → 10 fiche Play). Un run = une étape testable et mergeable.
- **Textes** : « bien-être » (plus « humeur ») ; « local par défaut, IA optionnelle et clairement signalée » (jamais
  « 100 % privé ») ; jamais « diagnostiquer », « prédire une crise », « traiter » → « comprendre vos tendances »,
  « estimation, pas un diagnostic ». Garde-fou automatique : `app/src/data/wording.test.js`.
- **Gratuit / payant** : collecter est gratuit, comprendre est payant ; **ne jamais bloquer une fonction locale**.
- **Design** : pas de nouvelle identité tant que `journal/DESIGN.md` n'existe pas ; centraliser en tokens.
- **Interdits** : créer des comptes, payer, déployer, publier sur le Play Store → « Actions du propriétaire ».
- Le bien-être automatique (§0000000) et la montre (§000, maintenance A.1–A.3) restent valables, après les jalons.


**Ajout du 21/10 00:30** — le prompt apporte deux sections lues pour la première fois : **INFRASTRUCTURE ET
AUTONOMIE** (→ [`INFRA.md`](INFRA.md) : aucun identifiant dans la session ; Google Cloud et Google Play uniquement via
GitHub Actions sur `main` avec Workload Identity Federation ; Vertex AI sans clé API ; la routine peut déployer le
relais et publier sur les pistes de test, jamais en production) et **IDENTITÉ VISUELLE** (→ [`DESIGN.md`](DESIGN.md) :
« Clair et précis », tokens, Figtree + IBM Plex Mono embarquées, icône « H nuit », maquettes ; appliquée par étapes,
un run = une étape, captures claires et sombres). Couleurs : uniquement via `app/src/theme/tokens.css` (tests).

## 00000000. Signalement du propriétaire du 20 octobre 2026 à 19:05 — mise à jour bloquée sur « Téléchargement… » — corrigé au run 20/10 20:30 (à confirmer sur l'A56)

Bandeau « version 187 » figé sur « Téléchargement… » sans aucune indication (Galaxy A56, 4G). Cause : APK passé de
6,8 à 33,6 Mo (ONNX Runtime 18 Mo) et téléchargé d'un bloc en mémoire (`CapacitorHttp` → base64 → pont → `writeFile`),
sans délai ni progression. Correction : `AppUpdatePlugin` (DownloadManager + vérification taille / SHA-256 / paquet)
et `services/appUpdate.js` + `UpdateBanner` (progression, étapes, blocage 45 s, Réessayer, navigateur). La version
installée chez le propriétaire ne peut pas en profiter : **installation manuelle une fois** depuis
`https://github.com/spreadzenox/HealthTrack/releases/latest`, puis essai du bouton à la release suivante.
**Leçon** : tout ce qui grossit l'APK se mesure à la release (taille notée après chaque merge, déjà au protocole) ; un
téléchargement sans progression ni délai est une panne silencieuse — toujours afficher l'avancement et une sortie.

## 0000000. Consigne du propriétaire du 19 octobre 2026 au soir — lecture du bien-être 100 % automatique, sans attendre la calibration (prime sur l'ordre de §00000)

Message : **« Je ne veux pas avoir à attendre les 30 jours de calibration, quitte à embarquer un modèle plus puissant :
je veux une lecture du bien-être 100 % auto. »**
- Dès la **première lecture réussie**, l'app affiche une estimation de l'humeur et du bien-être (du moment et du jour),
  par un modèle pré-entraîné qui marche d'emblée, sans aucune note. Préférer un modèle qui sort **valence et éveil**
  (ex. HSEmotion `enet_b0_8_va_mtl`) plutôt que des classes d'émotions ; combiner visage et voix quand la voix sera là.
- Choisir le modèle le plus fiable qui tourne correctement sur un Galaxy A56 (LiteRT ou ONNX, GPU / NNAPI si possible),
  quelques dizaines de Mo acceptés ; documenter dans `journal/` le choix, les alternatives, la précision publiée, la
  taille, la latence, la consommation et la **licence (compatible obligatoire)** ; trop gros pour le dépôt →
  téléchargé au build ou au premier lancement depuis une source officielle, empreinte vérifiée ; aucune donnée de
  l'utilisateur envoyée.
- Notes manuelles et calibration personnelle **facultatives** : elles affinent (ligne de base, adaptation
  personnelle), elles ne conditionnent **jamais** l'affichage. Retirer « Rien n'est affiché avant… » et la condition
  des 30 jours partout où elle bloque.
- Honnêteté : niveau de confiance (lectures du jour, qualité / cadrage du visage, accord entre signaux), toujours
  « estimation », jamais diagnostic ; l'incertitude diminue avec les lectures et la calibration facultative.
- D5 (anti-circularité) et D6 (science personnelle) inchangés : l'estimateur n'utilise que visage, voix et
  auto-déclaration facultative.
- Livraison par étapes fusionnables : **1) estimation dès la première lecture avec le modèle actuel + verrou retiré
  (✅ run 19/10 22:30)** ; 2) modèle valence / éveil plus puissant ; 3) fusion visage + voix. Tests et captures à
  chaque étape.
- Runs « idées » : veille en priorité sur ce choix de modèle (comparatif précision / poids / licence des modèles
  valence-éveil faciaux et vocaux embarquables, benchmarks AffectNet, AFEW-VA…, retours de terrain).

**Décision de l'étape 1** (run 19/10 22:30, `app/src/services/mood/faceMood.js`) : en attendant le modèle valence /
éveil, une valence **a priori** est tirée des indices de blendshapes déjà mesurés (AU12, AU6 + AU12 → +, AU15, AU4,
AU1 → −, poids fixes documentés), note = 2,5 + 2,5 × valence ; le neutre de population est remplacé peu à peu par le
**visage habituel** de la personne (médianes 28 j, poids j / (j + 7)) ; la calibration Ridge sur les notes (≥ 14 jours,
gardée si ≥ 10 % mieux que la moyenne en LOO) prend le relais quand elle existe. Fourchette = √(erreur du modèle² +
dispersion des lectures² / n) × pénalités qualité / cadrage. Cohérent avec D6 : l'a priori est présenté comme une
hypothèse générale, supplantée par les données personnelles dès qu'elles suffisent. La porte `gate.js` reste, comme
**vérification facultative** affichée, sans rien bloquer.

## 000000bis. Signalement du propriétaire du 19 octobre 2026 à 15:05 — corrigé au run 19/10 16:30 — ✅ RÉSOLU (confirmé le 20/10 19:05)

Confirmé par la capture du propriétaire du 20/10 19:05 : carte « Humeur estimée — Confiance moyenne », 44 lectures
automatiques dans la journée, deux modèles d'accord. Chantier clos, ne pas rouvrir.


« J'ai déverrouillé plusieurs fois et toujours aucune prise de photo automatique. Le test manuel fonctionne. Je
déverrouille avec l'empreinte. » Diagnostic : « Aucun déverrouillage depuis minuit », service actif, caméra
autorisée (« seulement lorsque l'appli est utilisée »), batterie sans restriction. Cause : le récepteur
`USER_PRESENT` du service était enregistré `RECEIVER_NOT_EXPORTED` ; la diffusion vient de SystemUI (pas l'uid
système), donc filtrée. Correctif : récepteur `RECEIVER_EXPORTED` (diffusions protégées) livré sur le fil du service,
secours `UnlockWatch` (interrogation de `isKeyguardLocked` 60 s après `SCREEN_ON`, écran allumé déjà déverrouillé),
diagnostic v2 (allumages / déverrouillages du jour par source, dernier, démarrage du service, app-op caméra,
12 dernières tentatives avec l'erreur exacte), état « À relancer » + `start({ restart })`, guide Shizuku / ADB.
**Leçon** : une diffusion système reçue dynamiquement se teste avec son **émetteur réel** en tête (SystemUI ≠
system_server) ; `RECEIVER_NOT_EXPORTED` ne convient qu'aux diffusions de l'app elle-même. Et tout déclencheur doit
avoir un compteur « reçu » distinct du compteur « traité » pour que le diagnostic dise où ça casse.

## 000000. Signalement du propriétaire du 19 octobre 2026 à 08:37 — corrigé au run 19/10 10:30

« Je ne vois pas la carte pour la lecture du visage dans connecteur. » Cause : `connectorsLayout` ne mettait la carte
`face` en tête que **activée** ; désactivée, elle tombait dans le volet replié « Brancher une autre source », sous la
montre. Correctif : dans l'app Android (`isFaceSenseAvailable()`), `face` est toujours la première source active ;
`nothingSending` garde « Sources à brancher » ouvert au premier lancement ; message + « Réessayer » si le plugin natif
ne répond pas. Tests : `connectorsLayout.test.js`, `Connectors.test.jsx` (Android natif simulé), `FaceSenseCard.test.jsx`.
**Leçon** : une carte « censée être en tête » se vérifie dans l'état **par défaut** du propriétaire (non activée,
montre connectée), pas seulement avec le faux plugin actif.

## 00000. Consigne du propriétaire du 18 octobre 2026 au soir — *remplacée comme cadre général par §000000000 le 20/10 au soir* (le bien-être automatique reste un pilier)

Message du propriétaire : **« Ok à partir de maintenant concentration maximale sur la collecte entièrement automatique
du bien-être »**. Objectif : que HealthTrack connaisse l'humeur et le bien-être du propriétaire, jour après jour et au
fil de la journée, **sans qu'il ait rien à saisir** ; l'auto-déclaration en un geste reste possible comme calibration
et vérité terrain, jamais obligatoire.
- **Tous les runs de code** livrent une étape testable et fusionnable de ce chantier ; les runs « idées » (08 h / 20 h)
  y consacrent toute leur veille (émotions faciales / vocales embarquées, phénotypage par l'usage du téléphone, Emobot
  et concurrents, validité des mesures, retours d'utilisateurs, Android 14–16 / One UI).
- Contenu : points 4 (visage via service caméra « niveau 2 », voix, usage du téléphone / des réseaux sociaux), 5
  (anti-circularité) et 6 (science personnelle) des directives du 12/10 (§00).
- Ordre conseillé : (1) état des lieux + plan (**fait : [`BIEN-ETRE-AUTO.md`](BIEN-ETRE-AUTO.md)**) ; (2) cœur Y / X
  et test anti-circularité (existant) ; (3) visage (service niveau 2, modèle embarqué, aucune image gardée, diagnostic
  exportable) ; (4) voix ; (5) usage du téléphone / réseaux sociaux (décidé : **X**) ; (6) restitution simple
  (estimation du jour, incertitude, jamais un diagnostic).
- Signaux physiologiques de la montre (stress / VFC, FC, sommeil) : **décidé le 18/10 22:30 → X**, jamais en entrée
  de l'estimateur (voir `BIEN-ETRE-AUTO.md` §2).
- Validation sur l'appareil réel (Galaxy A56, One UI) : dire précisément au propriétaire quoi faire et quoi renvoyer,
  dans le compte rendu et dans le résumé de la semaine.
- **En pause** : petites corrections montre A.1–A.3 (livrées de toute façon le 18/10 16:30), nettoyage de l'UI (D1),
  performance (D2), interconnexion d'autres appareils. Exceptions : build / release cassés, PR « [Auto] » rouge,
  régression bloquante signalée, travail strictement nécessaire au bien-être automatique.

## 0000. Consigne du propriétaire du 18 octobre 2026 — PRIORITÉ ABSOLUE — *remplacée par §00000 le 18/10 au soir* (prime sur tout, y compris l'ordre du 12/10)

**A. Régression de l'écran montre** (capture du 18/10 11:06, « Ça ça ne marche pas ») : test bloqué sur « Test en
cours… » dès « Apps qui peuvent tenir la montre » ; carte « Libérer et appairer » qui propose « Appairer » alors que
la montre est appairée et synchronise ; « 14 pas aujourd'hui → 2 mesures » à 11 h à vérifier. Attendu : délai
maximal par étape, erreur claire au lieu d'un blocage, test qui marche montre déjà connectée, carte cohérente avec
l'état réel, synchro complète ; tests pour chaque cas ; ne casser ni l'appairage, ni l'authentification, ni la
synchro. → **Corrigé au run du 18/10 12:30** (voir son compte rendu). **Confirmé sur l'appareil réel par le
propriétaire (capture du 18/10 15:03)** : le test se termine (« Relancer le test »), titre « HUAWEI WATCH GT 6 Pro-169 »,
verdict « La montre répond à HealthTrack — protocole v2, HiChain 3 (GCM) ; HealthTrack synchronise déjà cette montre
(dernière synchro réussie il y a 4 h) : rien d'autre à faire ». Étapes : ✓ Bluetooth · – Apps (« délai dépassé
(8 s) ») · ✓ Recherche (appairée, ne s'annonce pas) · ✓ Connexion directe (classique) · ! Services (« 2 services
connus, Huawei non listé ») · ✓ Canal Huawei · ✓ Paramètres du lien. **Restes à traiter en petites corrections (un
seul run, sans freiner B)** : **A.1** détection des apps rapide et fiable (ou échec expliqué) ; **A.2** plus
d'avertissement « Huawei non listé » quand le canal s'ouvre en classique ; **A.3** resynchro de fond réellement à la
fréquence prévue + historique du jour complet ; tests pour chaque cas. → **A.1–A.3 livrés au run du 18/10 16:30.**
**B. Ensuite : l'estimation automatique du bien-être et de l'humeur** (« une fois que c'est fixé j'aimerais que ça
avance le côté estimation du bien-être automatique ») : D4 (humeur captée par visage / voix, approche Emobot) et D5
(anti-circularité) passent **devant** D1 (nettoyage de l'UI) et D2 (performance), en respectant D6.
**Ordre des « Prochaines étapes » (BACKLOG)** : 1) petites corrections montre restantes (A.1 à A.3) ; 2) estimation automatique du
bien-être (D4 + D5, D6) ; 3) nettoyage de l'UI ; 4) performance. Runs « idées » : la régression d'abord tant
qu'elle n'est pas fusionnée.

## 000. PRIORITÉ ABSOLUE (propriétaire, 12 octobre 2026 au soir) — la montre d'abord → **EN MAINTENANCE depuis le 15/10**

> **Mise à jour du propriétaire du 15 octobre 2026, mot pour mot : « Ça marche côté montre, plus besoin de se
> concentrer là-dessus ».** Objectif atteint : HealthTrack appaire, authentifie et relit la GT 6 Pro sans
> Gadgetbridge ni Huawei Santé. **D3 passe en maintenance** : les runs ne le traitent plus en premier. On n'y revient
> que pour (1) corriger une régression, (2) exploiter un journal de diagnostic envoyé par le propriétaire, ou
> (3) compléter au fil de l'eau (types de données manquants : stress, VFC de journée, séances auto ; resynchro en
> arrière-plan) quand c'est le travail le plus utile du moment. **L'ordre redevient celui du §00 : D1 (nettoyage de
> l'UI) en tête, puis D2, D4, D5, D6.** Les règles ci-dessous (parcours, licence, méthode, pilote générique) restent
> valables pour tout travail sur les montres.


**HealthTrack devient l'app principale de communication avec la ou les montres, sans Gadgetbridge ni app constructeur.**
Hors runs « idées », **chaque run travaille d'abord sur ce chantier (D3)**, avant le nettoyage et la performance,
jusqu'à ce que la Huawei Watch GT 6 Pro du propriétaire remonte ses données dans HealthTrack. Les runs « idées » de
08 h et 20 h y consacrent aussi une bonne part de leur recherche.

- **Parcours visé, en un minimum de gestes** : autodétection (scan BLE + appareils appairés, empreinte : nom, services,
  données fabricant, Device Information Service) → savoir ce qui tient la montre (apps installées : Huawei Santé,
  Gadgetbridge, Zepp, Mi Fitness… dans `<queries>` ; appairage système ; réponse aux paramètres du lien et à
  l'authentification) → **libération** (bouton qui ouvre la boîte de désinstallation Android de l'app concurrente,
  `ACTION_DELETE` + `REQUEST_DELETE_PACKAGES`, ou ses réglages pour lui retirer le Bluetooth ; Android interdit la
  désinstallation silencieuse et la réinitialisation à distance : un geste de l'utilisateur, guide pas à pas avec le
  menu exact de la montre ; **jamais** « dissocier dans Huawei Santé » ; plan B identifiant de compte Huawei) →
  **assistant d'appairage** (liaison Android, authentification Huawei, clés générées et stockées en local seulement) →
  **synchronisation** (FC, sommeil, pas, SpO₂, stress / VFC, séances) puis resynchro en arrière-plan (WorkManager ou
  service de premier plan) → IndexedDB.
- **Méthode** : plugin Capacitor natif (Java / Kotlin) pour le Bluetooth et le protocole. Étudier Gadgetbridge (paquets
  Huawei, issues / PR GT 6, HiChain), `zyv/huawei-lpv2` (MIT), CCC eh19, toute doc publique ; rétro-ingénierie
  d'interopérabilité permise (directive UE 2009/24, art. 6).
- **Licence (décision du propriétaire)** : réimplémentation totale, HealthTrack ne passe pas sous AGPL. Lire pour
  comprendre, **jamais** copier ni traduire ligne à ligne. D'abord la spécification avec nos mots
  (**`protocoles/huawei.md`**, sources citées), puis le code à partir d'elle. Pilote compact : seulement ce dont
  HealthTrack a besoin.
- Jamais de firmware, d'APK, de code décompilé propriétaire ni de clé extraite d'une app constructeur dans le dépôt.
- **Étapes livrables, chacune mergeable seule** : (a) écran de diagnostic qui déroule chaque étape et exporte un
  journal (le propriétaire le renvoie, le run suivant le lit) ; (b) détection et libération ; (c) authentification ;
  (d) synchronisation et resynchro en arrière-plan. Tests sur trames d'exemple à chaque étape.
- Un **pilote dans un registre générique**, pour ajouter d'autres montres et familles de protocoles ensuite.
- **Consigne du propriétaire du 14/10/2026 (≈ 12:25), mot pour mot : « Maintenant que ça marche tu peux nettoyer
  l'UI ».** La connexion à la GT 6 Pro fonctionne (association acceptée par la montre, journal v124). L'interface de la
  montre se réduit à une seule carte : par défaut l'état (connectée, batterie, dernière synchro, mesures) et
  « Synchroniser la montre » ; tout le technique (étapes, « Refaire l'appairage », test, « Libérer et appairer », export
  du journal) dans « Diagnostic » replié, sans perdre l'export ; pas de bandeaux redondants. Ensuite : passe de
  nettoyage générale (D1), puis performance (D2). La priorité absolue reste active **tant que de vraies mesures
  n'apparaissent pas dans l'historique** (run du 14/10 12:30 : fenêtre de synchro et totaux du jour corrigés).

## 00. Directives du propriétaire (12 octobre 2026) — priment sur tout le reste (la montre §000 est en maintenance depuis le 15/10)

Constat du propriétaire : l'app devient un « sac à features ». **Hors runs « idées », les runs traitent ces chantiers
dans cet ordre, avant toute nouvelle fonctionnalité** (chantiers D1–D6 de `BACKLOG.md`) :

1. **D1 — Passe de nettoyage.** Inventaire de chaque écran, champ, carte, réglage ; supprimer / fusionner le redondant,
   le peu utile, le désormais captable automatiquement. **Ne jamais demander une donnée que l'app capte déjà**
   (ex. « écran tard » auto-détecté → plus demandé). Données existantes toujours lisibles (migration, import / export) :
   seuls l'affichage et la saisie sont simplifiés. Lister dans le compte rendu ce qui est retiré et pourquoi.
2. **D2 — Performance.** L'app lag au chargement des courbes. **Mesurer d'abord** (profil, temps par page, volume lu
   dans IndexedDB), puis : cache d'agrégats journaliers / hebdo invalidés à l'écriture, requêtes IndexedDB par index et
   par plage, mémoïsation, sous-échantillonnage des longues séries, calculs lourds en Web Worker, graphiques différés.
   Une mesure / un test anti-régression ; chiffres avant / après dans le compte rendu.
3. **D3 — Montre Huawei en direct, sans app tierce** (remplacé et promu par la **priorité absolue, §000**). La GT 6 Pro ne se connecte pas, même avec Gadgetbridge.
   HealthTrack fait tout elle-même (seules étapes manuelles : autorisations Android) : découverte BLE, connexion,
   authentification, récupération (FC, sommeil, pas, SpO₂, stress / VFC…), resynchro en arrière-plan. Protocole Huawei
   réimplémenté d'après la documentation et les observations publiques, **sans code AGPL**, tests sur trames d'exemple.
   Commencer par **diagnostiquer** l'échec actuel : journal de connexion lisible + écran de diagnostic. Documenter la
   contrainte d'appairage (montre liée à Huawei Santé → quoi faire exactement). Ce qui n'est pas vérifiable sans la
   montre : livré avec un mode diagnostic qui permet au propriétaire **d'exporter les logs** pour le run suivant.
4. **D4 — Humeur « à la Emobot » : signaux émotionnels directs.** Visage (caméra frontale, modèle local d'émotions
   faciales : MediaPipe / TFLite / ONNX), voix (timbre, prosodie : modèle local d'émotion vocale), usage des réseaux
   sociaux (temps, apps, contenu si faisable). Captation la plus continue possible, **traitement 100 % sur l'appareil,
   aucune image ni audio brut conservé** (seulement les scores). Documenter les vraies limites d'Android (caméra / micro
   en arrière-plan, service de premier plan + notification, indicateurs de confidentialité, Accessibility, UsageStats) ;
   construire le meilleur possible dedans (ex. capture opportuniste au déverrouillage / à l'usage).
5. **D5 — Pas de raisonnement circulaire (non négociable).** Y = humeur, estimée **uniquement** par des signaux
   émotionnels directs (visage, voix, auto-déclaration). X = comportements et contexte (sommeil, activité, écran,
   alimentation…), qui servent seulement à expliquer Y. Les réseaux sociaux sont soit dans l'estimateur, soit dans les
   X : choisir et documenter. **Liste déclarée des entrées de l'estimateur + test qui échoue** si une variable est à la
   fois entrée de l'estimateur et facteur des corrélations. Retirer les entrées comportementales des estimateurs
   existants. Contrôler aussi : ordre temporel (X avant Y), comparaisons multiples, taille d'échantillon minimale,
   formulations qui ne confondent pas corrélation et causalité.
6. **D6 — Science personnelle, pas de normes imposées.** Le but : vérifier, pour **cet** utilisateur, quels facteurs
   influent réellement sur son humeur et son bien-être ; ses données font foi (si l'écran le soir va chez lui avec une
   meilleure humeur, l'app le montre tel quel). Aucun X codé « bon » ou « mauvais », aucun score / alerte / conseil qui
   pénalise un comportement par principe. Les normes générales = hypothèses (quoi examiner d'abord, quoi tester, a
   priori faible), supplantées par les données personnelles dès qu'elles suffisent ; quand elles se contredisent, le
   dire simplement, sans culpabiliser. Revoir scores, conseils et messages normatifs (ex. « écran tard = mauvais »).

Runs « idées » : privilégier les idées qui **simplifient et consolident** plutôt que celles qui ajoutent des écrans.
Conséquence sur §0 ci-dessous : la priorité n° 3 (humeur) ne s'appuie plus sur sommeil / VFC / activité / écran comme
entrées de l'estimation (ce sont des X), mais sur des signaux émotionnels directs.

## 0. Directions du propriétaire (11 octobre 2026) — priment sur le choix libre du mode

- **Vision** : HealthTrack devient le **hub ultime de la santé, de l'humeur et de la vie** de l'utilisateur, voire un
  assistant personnel : un « humain augmenté par les données » (connaissance de soi et décisions guidées par beaucoup
  de données, sans modification du corps). Il faut donc **capter beaucoup de données**. Tout reste sur le téléphone :
  ne pas brider les idées par excès de prudence sur la vie privée.
- **Priorité n° 1 — simplifier la vie** : tout ce qui peut être capté automatiquement doit l'être ; la saisie manuelle
  devient le dernier recours, en un geste minimum.
- **Priorité n° 2 — objets connectés (gros chantier)** : détecter automatiquement les équipements / apps santé présents
  ou connectés au téléphone et récupérer leurs données sans intervention. Cas concret : **Huawei Watch GT 6 Pro**
  (absente de Health Connect). Puis Samsung, Garmin, Fitbit, Xiaomi/Zepp, Withings, Oura, Polar… Étape manuelle
  inévitable → guide pas à pas dans l'app.
  - **Données brutes d'abord** (montre, bague, capteurs) ; sans API ouverte : reverse engineering à des fins
    d'interopérabilité (protocoles BLE documentés, exports, sauvegardes, captures BLE), viser une **connexion BLE
    directe** (plugin Capacitor natif si besoin). Respecter les licences (Gadgetbridge = AGPL : **ne pas copier son
    code**, réimplémenter d'après la documentation du protocole), ne jamais committer clés, secrets ni firmware
    propriétaire, documenter les limites (montre appairée à une seule app à la fois…).
  - **Approche générique** : couche de connexion avec autodétection (scan BLE, empreinte : nom annoncé, UUID de
    services, données fabricant, Device Information Service) → choix automatique du pilote. D'abord les **profils BLE
    standard** (FC 0x180D, batterie, balance, tensiomètre, glycémie, oxymètre, vélo/course…), puis les **familles de
    protocoles propriétaires** partagées entre modèles. Registre de pilotes extensible, détection des capacités plutôt
    que listes de modèles, repli propre pour un appareil inconnu (empreinte collectée localement).
- **Priorité n° 3 — humeur et bien-être captés automatiquement** (inspiration Emobot) : estimation à partir de
  signaux passifs (sommeil, VFC, activité, usage du téléphone, voix, visage, conversations), traitée sur l'appareil,
  toujours présentée comme une **estimation**, jamais un diagnostic.
- **Conversations** : importer les résumés des enregistreurs (Omi, Plaud, Limitless, Bee… et équivalents) ou faire
  pareil avec le micro du téléphone, pour le journal et l'humeur ; stockage local ; rappel simple (sans blocage) que
  l'enregistrement d'autrui peut demander leur accord selon le pays.
- **Recommandations de matériel** utile (capteurs, wearables) quand elles servent le suivi.
- **Runs « idées »** (08 h et 20 h, heure de Paris) : pas de code produit ; se mettre à la place de l'utilisateur,
  chercher (Reddit QS / Biohackers / wearables…, LinkedIn, wearables récents, reverse engineering, enregistreurs de
  conversations, humeur, ML embarqué, meilleures apps) et enrichir **`IDEES.md`** (idées classées par impact et
  faisabilité, besoin servi, sources, dates, pistes d'implémentation), puis faire entrer les meilleures dans
  `BACKLOG.md`. Les garde-fous de fusion s'appliquent (tests verts même si seul le journal change).

Conséquence sur le principe 3 ci-dessous : « local-first » reste la règle (rien ne sort de l'appareil hors Gemini
déclenché par l'utilisateur), mais **à l'intérieur du téléphone** on capte large.

## 1. Mission

Faire de HealthTrack **la meilleure app de santé personnelle possible** : celle qui
transforme les données d'une personne (alimentation, sommeil, activité, cœur, corps,
humeur, habitudes) en **compréhension** et en **actions concrètes** pour aller mieux —
sans friction de saisie, et sans que les données quittent l'appareil.

L'utilisateur (propriétaire du dépôt) passe une fois par semaine : il installe la
dernière version via la **mise à jour en 1 clic** et découvre les changements dans la
page **Nouveautés**. Chaque semaine doit donc apporter des progrès visibles et fiables.

## 2. Principes non négociables

1. **Ne jamais casser l'app installée.** Le mécanisme de mise à jour (`UpdateBanner`,
   `services/updateCheck.js`, `services/installUpdate.js`, `.github/workflows/build-release.yml`,
   `android/app/debug.keystore`) est vital : s'il casse, l'utilisateur est bloqué sur une
   vieille version. Toute modification de ces fichiers exige des tests et une justification.
2. **Ne jamais perdre de données.** Toute évolution du schéma IndexedDB passe par une
   migration testée (`storage/localHealthStorage.js`, `DB_VERSION`). L'export/import JSON
   doit rester compatible avec les anciens fichiers.
3. **Local-first et vie privée.** Aucune donnée de santé n'est envoyée à un serveur tiers,
   sauf les appels Gemini explicitement déclenchés avec la clé de l'utilisateur. Pas de
   nouveau service distant sans nécessité forte, documentée dans le run.
4. **Honnêteté scientifique.** Pas d'allégation médicale ni de diagnostic. Corrélation ≠
   causalité : toujours afficher l'incertitude (intervalle, taille d'échantillon), et
   citer les références (recommandations OMS/ANSES/EFSA…) quand l'app donne un repère.
5. **TDD.** Écrire le test qui échoue, puis le code (voir `CONTRIBUTING.md`). Le visuel
   pur n'exige pas de test, mais exige une **vérification visuelle**.
6. **Un run = un changement cohérent, fini, vérifié et livré.** Les gros chantiers sont
   découpés en étapes livrables (voir `BACKLOG.md` → Chantiers). Mieux vaut un petit
   progrès livré qu'un gros chantier à moitié fait.
7. **Respecter le travail des autres** : ne pas toucher aux PR/branches qui ne sont pas
   celles de la routine (ex. branches `cursor/*`), sauf pour en récupérer des idées.

## 3. Protocole d'un run

### 3.1 Démarrage (≈ 5 min)
1. `git fetch origin main` puis partir de `origin/main` à jour sur la branche de travail.
2. `cd app && npm ci`.
3. Lire ce fichier, `BACKLOG.md`, et les **5 derniers comptes rendus** (`ls journal/runs | tail -5`).
   Regarder aussi `journal/diagnostics/` : un journal de montre déposé par le propriétaire oriente la priorité absolue (§000).
4. Vérifier les PR ouvertes par la routine (titre préfixé `[Auto]`) : une PR rouge ou en
   conflit d'un run précédent est **la priorité absolue** — la réparer et la fusionner
   avant toute autre chose (ou la fermer en expliquant pourquoi dans le compte rendu).

### 3.2 Choisir le type de run
Regarder la répartition des derniers runs et choisir ce qui apporte le plus maintenant.
Repères (pas des règles rigides) :

| Type | Quand | Contenu |
|---|---|---|
| 🐛 **Bugs & vérif visuelle** | ≥ 1 run sur 4 ; toujours après un gros chantier | `npm run visual` (+ `--empty`, `--light`), lire **chaque** capture, traquer erreurs console, débordements, états vides/erreur, cas limites ; écrire le test qui reproduit puis corriger |
| 💡 **Idées** | runs de 08 h et 20 h (heure de Paris) | Pas de code produit : recherche orientée utilisateur → `IDEES.md` + meilleures idées dans `BACKLOG.md` |
| 🔭 **Recherche** | ~1 run sur 6, jamais deux de suite | Recherche web (besoins réels, apps qui marchent, publications ML/santé récentes) → `RESEARCH.md` + nouvelles idées priorisées dans `BACKLOG.md`. Finir si possible par un quick win issu de la recherche |
| 🎨 **UI / ergonomie** | régulièrement | Réduire la friction (moins de taps), lisibilité, hiérarchie visuelle, cohérence du design system, accessibilité (contraste, tailles tactiles ≥ 44 px), mode clair. Captures avant/après obligatoires |
| 🏗️ **Travail de fond** | le reste du temps | Nouvelles fonctionnalités, moteur d'analyse / ML, architecture, performance, dette technique, tests |

En cas de doute : prendre l'item du haut de `BACKLOG.md` → « Prochaines étapes ».

### 3.3 Réaliser
- TDD, code lisible qui ressemble au code existant, UI en **français**.
- Toujours penser mobile (viewport ~412 px, doigts, une main) et données réelles imparfaites
  (trous, doublons, fuseaux horaires, montre non portée).

### 3.4 Vérifier — obligatoire avant de livrer
1. `npm run test` → tout vert.
2. `npm run lint` → **pas plus d'erreurs qu'avant** (baseline dans le dernier compte rendu ;
   en réduire le nombre est un bonus apprécié).
3. `npm run build` → OK.
4. `npm run visual` (pages concernées au minimum, avec `--routes=`) et **regarder les captures**
   `app/.visual/tiles/*.png` avec l'outil de lecture d'image. Comparer avant/après pour toute
   modification visuelle (`--out=.visual/avant` sur `origin/main`, puis `--out=.visual/apres`).
   Le script échoue sur erreur JS ; il signale aussi les débordements horizontaux.
5. Relire son diff de façon critique : qu'est-ce qui pourrait casser chez l'utilisateur ?

### 3.5 Livrer
1. **Nouveautés in-app** : pour tout changement visible par l'utilisateur, ajouter
   `app/src/data/changelog/AAAA-MM-JJ-HHMM-<slug>.json` (heure UTC, langage simple, orienté
   bénéfice : « Le graphique du sommeil se lit mieux sur petit écran », pas « refactor CSS »).
2. **Compte rendu** : créer `journal/runs/AAAA-MM-JJ-HHMM-<slug>.md` (modèle ci-dessous) et
   mettre à jour `BACKLOG.md` (cocher, ajouter, re-prioriser).
3. **Résumé de la semaine** (en tête de ce fichier) : l'enrichir — ce que l'utilisateur verra dans
   l'app, ce qui a changé en coulisses, les points d'attention, une ligne dans le tableau des runs.
   Écrit pour l'utilisateur (clair, concret, sans jargon). Nouvelle semaine ISO (lundi, heure de
   Paris) → déplacer l'ancien bloc dans `semaines/AAAA-Sww.md` et repartir d'un bloc vide.
4. Commit(s) clairs, push, PR vers `main` intitulée `[Auto] <résumé>`, corps = résumé du run. Les captures
   du journal (`journal/**/*.png`) sont suivies par git depuis le 12/11 17:35 (plus de `git add -f`) : vérifier quand
   même avec `git ls-files` que chaque capture citée dans le résumé existe (oubli du 09/11 au soir, puis du 12/11
   00:35 à 15:35 : liens morts).
5. Attendre la CI (s'abonner à l'activité de la PR, pas de boucle d'attente) : **Frontend (Vitest)**
   et **Build APK** doivent être verts (*Build APK* échoue = la release échouera aussi). Les jobs
   émulateur sont longs : les attendre seulement si le changement touche `android/`, Capacitor
   ou Health Connect.
6. CI verte **et** vérifications du §3.4 faites → **fusionner (squash)** : le push sur `main` déclenche le build de l'APK et la
   release que l'utilisateur installera en 1 clic. CI rouge → corriger et recommencer.
7. Après la fusion, vérifier que le workflow **Build & Release** de `main` a réussi et publié
   la release `v<N>` avec son APK. S'il échoue (même sans lien avec ton changement : image des
   runners, action obsolète…), le réparer est la priorité absolue — sans release, l'utilisateur
   ne reçoit plus rien.
8. Si le run ne peut pas aboutir (ou si une vérification du §3.4 échoue) : laisser la PR ouverte, documenter précisément l'état
   et la suite dans le compte rendu — le run suivant reprendra.

### Modèle de compte rendu

```markdown
# AAAA-MM-JJ HH:MM UTC — <titre>

**Type** : 🐛 / 🔭 / 🎨 / 🏗️  ·  **PR** : #NN (fusionnée / ouverte)

## Pourquoi
<le besoin, l'observation ou la source qui a motivé ce run>

## Ce qui a été fait
- …

## Vérifications
- Tests : NNN ✅ · Lint : NN erreurs (avant : NN) · Build ✅
- Visuel : pages vérifiées, ce qui a été observé

## Apprentissages / décisions
- …

## Suite proposée
- …
```

## 4. Outillage

- **Vérification visuelle** : `cd app && npm run visual` — lance Vite, injecte ~75 jours de
  données de démo corrélées (`scripts/visual/demoData.mjs`), capture chaque page dans un
  viewport Galaxy A56 (412×915, Chromium/Playwright). Options : `--empty`, `--light`,
  `--routes=/,/food`, `--radar` (début d'infection simulé), `--wellbeing-gap` (pas de note de J−9 à J−4), `--food-analysis` (analyse photo
  simulée sur /food, réponse Gemini factice), `--update-banner`, `--wellbeing-prompt`, `--whats-new`, `--out=`,
  `--click="Analyse avancée"` (clique un bouton avant la capture, ex. un onglet),
  `--viewport` (capture de l'écran visible, pour les éléments fixes), `--insets=24,48` (simule les
  barres système d'Android 15+ ; à combiner avec `--viewport`).
- **Captures sur émulateur Android réel** : chaque PR produit les artefacts `screenshots-samsung-a56-api35`
  et `-api36` (`screenshot_app.png`, `screenshot_plus.png` + arbres `ui_*.xml`). Les récupérer avec
  `gh api repos/spreadzenox/HealthTrack/actions/runs/<id>/artifacts` puis `…/artifacts/<id>/zip`, et les
  regarder pour tout changement d'interface. Toujours utiliser `var(--safe-top)` / `var(--safe-bottom)`,
  jamais `env(safe-area-inset-*)` directement (WebView ≤ 139).
  Pour une interaction précise (clic, saisie, modale), écrire un petit script Playwright
  ad hoc dans le scratchpad en s'inspirant de `visual-check.mjs`.
- **Données de démo** : enrichir `demoData.mjs` quand une nouvelle donnée apparaît, pour
  que les captures restent représentatives.
- **GitHub** : outils `mcp__github__*` s'ils sont présents ; sinon `gh api` (REST uniquement — le
  GraphQL est bloqué dans les sessions, donc pas de `gh pr create` / `gh pr checks`) :
  - PR : `gh api repos/spreadzenox/HealthTrack/pulls -f title='[Auto] …' -f head=<branche> -f base=main -f body=…`
  - checks : `gh api repos/spreadzenox/HealthTrack/commits/<sha>/check-runs --jq '.check_runs[]|[.name,.status,.conclusion]|@tsv'`
  - merge : **préférer** l'outil `mcp__github__merge_pull_request` (squash, `expectedHeadSha`) — le
    `gh api -X PUT …/pulls/<n>/merge` a été refusé par les permissions d'une session (run 17:40)
  - release : `gh api repos/spreadzenox/HealthTrack/releases/latest --jq .tag_name`
  - attendre la CI sans boucle active : outil Monitor (boucle `until` sur les check-runs) ou abonnement à la PR.
- **Mécanique de la routine** : la tâche planifiée « HealthTrack — amélioration autonome » réveille
  toutes les 2 h une session « orchestrateur » qui crée une **session neuve avec le dépôt attaché**
  (seul moyen d'avoir le droit de pousser) et lui transmet le prompt du run. Chaque run est donc
  indépendant : sa seule mémoire est ce dossier. Sessions de run étiquetées `healthtrack-routine`.
- **CI** : `Tests` (Vitest, rapide) sur PR ; `Test — émulateur Samsung Galaxy A56` (long) ;
  `Build & Release` sur push `main` → release `v<run_number>` + APK (sauf si le push ne touche
  que `journal/` : un run de pure veille ne publie donc pas de release vide).

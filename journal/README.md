# Journal de bord de Claude — HealthTrack

## 📅 Semaine en cours — S46 (lundi 9 → dimanche 15 novembre 2026)

> Résumé tenu à jour à chaque run : **c'est ce que lit le propriétaire chaque semaine.**
> Le premier run d'une nouvelle semaine archive ce bloc dans `semaines/AAAA-Sww.md` et en ouvre un neuf.
> Semaine précédente : [`semaines/2026-S45.md`](semaines/2026-S45.md) (nouvel écran Aujourd'hui, Journal › Tendances,
> Agir ; nouvel accueil et visite guidée avec données fictives ; livraison continue sur Alpha ; premières simulations de
> personas ; Alpha 100918 en examen chez Google).

> ⚖️ **Le poids a sa courbe (11/11 13:35)** : une persona qui veut maigrir ne trouvait pas ses pesées dans Tendances.
> « Poids » y est maintenant une mesure (dernière pesée du jour, à la main ou par une balance), dès 3 pesées sur la
> période : en Mois si vous vous pesez chaque semaine. Au passage, les graduations n'arrondissent plus à tort
> (« 77,25 » au lieu de « 77,3 ») ([clair](runs/captures/2026-11-11-1335-poids-tendances-clair.png) ·
> [sombre](runs/captures/2026-11-11-1335-poids-tendances-sombre.png)). Part ce soir sur Alpha. Rien à faire de votre côté.

> 🍽️ **Un aliment non compté se voit (11/11 12:35)** : une persona a vu « 220 g de pâtes ≈ 0 kcal » sans explication :
> un aliment absent de la base comptait pour 0 en silence. Le total du repas le nomme maintenant (« ≈ 592 kcal, sans
> Sauce maison du chef »), dit « inconnu » si aucun aliment n'est compté, et Journal › Repas comme Aujourd'hui
> mettent « ≥ » devant les kcal d'un tel repas ([clair](runs/captures/2026-11-11-1235-kcal-incomplet-clair.png) ·
> [sombre](runs/captures/2026-11-11-1235-kcal-incomplet-sombre.png)). Part ce soir sur Alpha. Rien à faire de votre côté.

> 🩸 **Un symptôme noté se voit (11/11 11:35)** : dans « Mes règles », toucher Crampes ne changeait que la couleur de la
> puce (une persona n'a pas su si c'était noté). La puce porte maintenant une coche et la fenêtre écrit « Noté : Crampes »
> (« Retiré : Crampes » au second toucher) ([clair](runs/captures/2026-11-11-1135-symptome-note-clair.png) ·
> [sombre](runs/captures/2026-11-11-1135-symptome-note-sombre.png)). Part ce soir sur Alpha. Rien à faire de votre côté.

> 👣 **Pas du jour et bien-être une seule fois (11/11 10:35)** : trois personas ne voyaient pas leurs pas sur
> Aujourd'hui. Vérifié : votre téléphone les lit bien jusqu'à l'instant présent ; c'étaient nos données de démonstration
> qui n'en avaient aucun pour la journée en cours (corrigé, les personas les verront). Et « Vos données du jour »
> répétait la note de bien-être de la carte juste au-dessus : retirée ([clair](runs/captures/2026-11-11-1035-pas-du-jour-clair.png) ·
> [sombre](runs/captures/2026-11-11-1035-pas-du-jour-sombre.png)). Part ce soir sur Alpha. Rien à faire de votre côté.

> 🧪 **Deux personas (11/11 08:35)** : « Prendre soin de soi, maigrir » au premier lancement (téléphone seul) et
> « Endométriose » au 45e jour, pour la première fois avec ses règles notées. Constats : les pas toujours absents
> d'Aujourd'hui (3e fois), une pesée sans courbe dans Tendances, un aliment inconnu compté 0 kcal sans le dire, le nom
> du plat non modifiable, un symptôme du cycle touché sans retour visible ; six corrections rangées (POLISH-SIM-46 à 51)
> ([synthèse](simulations/2026-11-11-0835-synthese.md)). Le cycle ne se voit encore que dans Journal › Jours : la
> persona voulait le jour du cycle sur Aujourd'hui, les règles dans Tendances et dans le rapport médecin. Ce serait une
> fonction : proposition PROP-SIM-11, maquette à venir. Rien à faire de votre côté.

> 🫃 **Ma digestion, une question à la fois (11/11 07:35)** : le soir, la fenêtre « Ma digestion » montrait deux rangées
> Calme / Gêne / Douleur (« dans l'ensemble » et « À l'instant ») sans dire laquelle choisir (une persona l'a relevé).
> Elle n'en montre plus qu'une : le bilan de la journée d'abord ; « Noter un moment précis » passe à « À l'instant »
> seule, et « Bilan de la journée » ramène ([bilan du soir](runs/captures/2026-11-11-0735-digestion-journee-clair.png), refaite au merge
> du 11/11 09:35). Part ce soir sur Alpha. PR #910 verte, pas encore mergée (merge
> refusé par les permissions de la session) : le prochain run la merge.

> 🚭 **Plus de cigarette notée par erreur (11/11 06:35)** : « Autre chose » (bandeau d'Aujourd'hui) notait une cigarette
> d'un seul toucher, même pour qui ne fume pas (une persona l'a relevé). Il propose maintenant « Je fume : compter mes
> cigarettes », qui met « + 1 cigarette » dans le bandeau ; on le retire dans Réglages › Paramètres › Cigarettes
> ([clair](runs/captures/2026-11-11-0635-cigarettes-clair.png) · [sombre](runs/captures/2026-11-11-0635-cigarettes-sombre.png)).
> Rien à faire de votre côté.

> ⚙️ **« Réglages › Paramètres » (11/11 05:35)** : l'accueil disait « vous pourrez le changer dans Paramètres », mais la
> roue en haut à droite ouvre « Réglages » (une persona s'y est perdue). L'accueil, le rappel du soir et Agir donnent
> maintenant le chemin complet, « Réglages › Paramètres » ([objectif](runs/captures/2026-11-11-0535-reglages-objectif.png) ·
> [visage](runs/captures/2026-11-11-0535-reglages-visage.png)). Rien à faire de votre côté.

> ⏱️ **Une seule durée d'essai (11/11 04:35)** : l'accueil promettait « un essai de deux semaines » et Agir « quelques
> jours » (une persona l'a relevé). Les deux sortes d'essais n'ont pas la même durée (réintroduction FODMAP 3 jours,
> piste 14 jours) : l'accueil dit maintenant « vérifier une piste par un essai », et Agir vide « de quelques jours à
> deux semaines selon la piste » ([Agir](runs/captures/2026-11-11-0435-une-duree-agir.png) ·
> [accueil](runs/captures/2026-11-11-0435-une-duree-tuto.png)). Rien à faire de votre côté.

> ✏️ **Accueil : « Trois usages » (11/11 03:35)** : la 2e carte de l'accueil disait « Trois onglets » alors que la barre
> du bas en a cinq ; deux personas l'avaient relevé. Elle dit maintenant « Trois usages : » au-dessus de Journal,
> Analyses et Agir ([clair](runs/captures/2026-11-11-0335-tuto-usages-clair.png) ·
> [sombre](runs/captures/2026-11-11-0335-tuto-usages-sombre.png)). **Envoi Alpha du soir parti** : 100984 placé sur
> l'alpha le 11/11 à 03:16 (cron de GitHub 3 h 30 en retard), avec tout le cycle jusqu'aux règles d'hier ; Google
> l'examine. Rien à faire de votre côté.

> 🩸 **Noter ses règles d'hier (11/11 02:35)** : « Mes règles » a en haut le choix « Aujourd'hui · Hier » (la même
> pastille que Jour / Semaine / Mois de Tendances). « Hier » note le flux et les symptômes de la veille sans quitter
> Aujourd'hui ; la fenêtre dit alors « Hier, 2e jour des règles » ([sombre](runs/captures/2026-11-11-0235-regles-hier-dark.png),
> données de démo). Part demain soir sur Alpha. À tester : Aujourd'hui › Règles › Hier › Moyen. L'envoi Alpha de
> ce soir n'était toujours pas parti à 02:35 (cron de GitHub en retard, comme les deux derniers soirs).

> 🔧 **Vérifications de main réparées (11/11 01:35)** : un test a cassé parce qu'on est le 11 : il cherchait une note
> « le 1 novembre », l'app écrit correctement « le 1er novembre ». Test corrigé, rien ne change dans l'app. Sans ce
> correctif, l'envoi Alpha de ce soir aurait pris la version d'avant les symptômes du cycle.

> 🩸 **Noter les symptômes du cycle (11/11 00:35)** : « Mes règles » (Aujourd'hui › Règles) propose maintenant
> Crampes, Douleur pelvienne, Ballonnements, Maux de tête, Fatigue, Constipation et Diarrhée : une touche note le
> symptôme du jour, une deuxième le retire ([clair](runs/captures/2026-11-11-0035-symptomes-cycle-clair.png) ·
> [sombre](runs/captures/2026-11-11-0035-symptomes-cycle-sombre.png)). Ils s'affichent dans Journal › Jours. Part
> demain soir sur Alpha. L'envoi Alpha de ce soir n'était pas encore parti à 00:35 (le cron de GitHub part souvent
> 2 à 3 h en retard) : vérifié au prochain run.

> 🩸 **Corriger ses règles depuis le Journal (10/11 23:35)** : dans Journal › Jours, la ligne « Règles » a maintenant
> son « … », comme les saisies : « Modifier » ouvre Léger / Moyen / Abondant sur place pour ce jour, « Supprimer »
> demande confirmation ([clair](runs/captures/2026-11-10-2335-regles-journal-clair.png) ·
> [sombre](runs/captures/2026-11-10-2335-regles-journal-sombre.png)). Mergé après 23:45 : part demain soir sur Alpha.
> À tester : notez vos règles depuis Aujourd'hui, puis Journal › Jours › « … » › Modifier.

> 🩸 **Noter ses règles depuis Aujourd'hui (10/11 22:35)** : avec l'objectif « Mon cycle », le bandeau d'ajout a un
> bouton « Règles » (rose). Il ouvre « Mes règles » : touchez Léger, Moyen ou Abondant (ou « Sans préciser le flux »),
> c'est noté ; un autre flux corrige, « Retirer » efface ; les jours suivants, la fenêtre dit « 2e jour des règles »
> ([clair](runs/captures/2026-11-10-2235-regles-clair.png) · [sombre](runs/captures/2026-11-10-2235-regles-sombre.png)).
> Le Journal affiche ensuite la ligne « Règles · 2e jour · flux moyen ». Tout reste sur le téléphone ; la page de
> confidentialité le dit. À tester (cochez d'abord « Mon cycle » dans Paramètres › Ce qui vous amène) : Aujourd'hui › Règles › Moyen, puis Journal › Jours. Suite : modifier depuis le Journal, symptômes.

> 🩸 **Cycle dans le Journal (10/11 21:35)** : Journal › Jours montre maintenant, sous le titre d'un jour de règles,
> « Règles · 2e jour · flux moyen » et les symptômes notés, et à côté de la date des autres jours « 3e jour du cycle »
> ([clair](runs/captures/2026-11-10-2135-cycle-journal-clair.png) · [sombre](runs/captures/2026-11-10-2135-cycle-journal-sombre.png),
> données de démo). Vous ne le verrez pas encore : il faut d'abord pouvoir noter ses règles (prochaine étape, depuis
> Aujourd'hui). Constipation et diarrhée rejoignent les symptômes du cycle, à la demande de la routine iPhone.

> 🧪 **Deux personas au premier lancement (10/11 20:35)** : « Stressé et pressé » (Android et montre Amazfit) et
> « Endométriose » (iPhone seul) ont fait l'accueil complet. Elles s'y retrouvent, mais relèvent « Trois onglets » quand
> la barre en a cinq, un « Voir dans 14 jours » flou, des pas absents d'Aujourd'hui, et la persona Endométriose ne
> trouve pas où noter ses règles (c'est l'étape cycle en cours). Huit corrections rangées (POLISH-SIM-38 à 45)
> ([synthèse](simulations/2026-11-10-2035-synthese.md)). **Une question pour vous** : sur les trois cartes du tuto, le
> compteur reste à « 01/06 », comme sur la maquette v3 que vous avez validée. Trois simulations l'ont lu comme un bug.
> Répondez « compteur 01/06 : garder » ou « compteur : faire avancer ».
> 📋 **Cycle dans Health Connect (P48), pour plus tard** : le geste dans la Play Console est rédigé (`PRODUIT.md` §4),
> avec le texte à coller. Ne le faites pas encore : la routine écrira « P48 maintenant » quand la lecture sera prête.

> 🩸 **Cycle : la brique de base est posée (10/11 19:35, votre « Ok cycle »)** : règles (avec le flux), saignements
> et symptômes du cycle ont maintenant leur place dans les données du téléphone, comprises par l'export et l'import
> (aucune migration, anciens fichiers intacts). Rien ne s'affiche encore. Prochaines étapes, une par run : la ligne
> « Règles · 2e jour · flux moyen » dans Journal › Jours, puis la saisie en un geste depuis Aujourd'hui, puis la
> lecture Health Connect (elle vous demandera d'ajouter le type « règles » dans la déclaration Health Connect de la
> Play Console : le chemin exact vous arrivera au moment voulu). Rien à faire de votre côté pour l'instant.

> ✏️ **Journal : modifier une note de digestion (10/11 18:35)** : une persona ne pouvait que supprimer une note
> « Gêne » saisie par erreur. Le « … » propose maintenant « Modifier » : Calme, Gêne ou Douleur sur place, avec les
> mêmes boutons que sur Aujourd'hui, l'heure est gardée ([clair](runs/captures/2026-11-10-1835-digestion-modifier-clair.png) ·
> [sombre](runs/captures/2026-11-10-1835-digestion-modifier-sombre.png)). Part ce soir (23:45). À tester : Journal ›
> Jours, « … » d'une note de digestion, « Modifier ».

> 👆 **Journal : toucher une tuile ouvre sa courbe (10/11 16:35)** : une persona touchait « Sommeil » dans le Journal
> sans que rien ne se passe. Comme sur Aujourd'hui, les tuiles Sommeil, Pas, VFC nuit, FC au repos, Écran et Bien-être
> ouvrent maintenant Tendances sur leur mesure ; l'apparence ne change pas
> ([clair](runs/captures/2026-11-10-1635-journal-tuiles-clair.png) · [sombre](runs/captures/2026-11-10-1635-journal-tuiles-sombre.png)).
> Part ce soir (23:45). À tester : Journal › Jours, touchez « Sommeil ».

> 🥗 **Analyses s'ouvre sur Digestion (10/11 15:35)** : avec l'objectif « Ma digestion » (ou « Mon cycle »), une persona
> arrivait sur Bien-être et cherchait son ventre. L'onglet s'ouvre maintenant sur Digestion, Bien-être reste à côté
> ([capture](runs/captures/2026-11-10-1535-analyses-digestion.png)). Le test sur émulateur A56 de 14:58 a échoué au
> téléchargement de l'image Android (panne de GitHub, pas l'app) : relancé. Part ce soir (23:45).

> 🩶 **Analyses : les liens pas assez nets se voient tous (10/11 14:35)** : deux personas sur deux croyaient « nettes »
> les lignes aux petites barres, où le hachurage ne se voit pas. Leur chiffre est maintenant en gris
> ([capture](runs/captures/2026-11-10-1435-analyses-gris-1.png)). Les mêmes simulations (Endométriose J14, Ventre et
> données J45) demandent aussi de noter ses règles, le type de gêne et un essai lancé soi-même : une proposition avec
> maquette vous arrivera, rien n'est codé ([synthèse](simulations/2026-11-10-1435-synthese.md)). Part ce soir (23:45).

> 📸 **Fiche du Store : captures à jour (10/11 13:35)** : les images de la fiche dataient du 03/11 et montraient
> encore l'ancien accueil et l'ancien Historique du bien-être. Sept captures neuves sur les données de démo : Aujourd'hui,
> Tendances, Analyses, Agir (un essai en cours), Repas, Réintroduction, Journal
> ([planche](runs/captures/2026-11-10-1335-fiche-captures.png)). Elles partent ce soir avec la fiche (23:23). Rien à faire
> de votre côté.

> 🏷️ **Fiche du Store : elle repart, chaque soir avec la version (10/11 12:35)** : la fiche n'était plus envoyée à
> Google depuis le 03/11. Le délai de 24 h entre deux envois comptait la version Alpha de chaque soir et la retenait
> pour toujours ; votre nouveau titre « Halcya — digestion & bien-être » et les avantages à jour des abonnements
> attendaient. Fiche et abonnements partent maintenant juste avant la version du soir (23:23 et 23:33, Paris), s'ils
> ont changé : un seul examen par jour. Premier envoi ce soir. Rien à faire de votre côté.

> 🧊 **Gel Alpha levé le 10/11 matin à la demande du propriétaire ; envoi Alpha lancé à la main (résultat ci-dessous). Envoi nocturne normal ensuite.**
> Résultat : **100962 placé sur l'alpha** le 10/11 à 09:54 (Paris), en examen chez Google avant d'arriver aux testeurs
> ([exécution](https://github.com/spreadzenox/HealthTrack/actions/runs/42785591067)).

> 🔁 **Alpha : chaque envoi remplace le précédent (10/11 09:45, votre demande de 10:15)** : c'était déjà le cas chez
> Google (un envoi remplace la version de la piste et annule l'examen en cours, sans file d'attente). Le script d'envoi
> le demande maintenant explicitement. Aucun gel ne sera remis sans votre demande. Rien à faire de votre côté.

> 🔢 **Note du jour : « 3,2 », plus « 3 , 2 » (10/11 10:35)** : sur Aujourd'hui, la grande note de bien-être avait des
> blancs autour de la virgule (toute la valeur était dans la police des chiffres). Corrigé aussi pour « +0,4 pt »
> d'Analyses et les niveaux avant/après de Tendances ([clair](runs/captures/2026-11-10-1035-mono-virgule-carte-clair.png) ·
> [sombre](runs/captures/2026-11-10-1035-mono-virgule-carte-sombre.png)). Part avec l'envoi du soir (23:45).

> 🧽 **Mode polish depuis ce matin (votre décision (A) du 07/11)** : plus de nouvelle fonction ; seulement bugs,
> polissage, textes en trop et retraits. Une idée de fonction vous arrivera en proposition avec une maquette, jamais
> codée sans votre accord. Seule exception : les intégrations (Garmin et Samsung d'abord).

> 🥇 **Accueil : « Gold » expliqué en une phrase (09/11 00:35)** : une persona peu technique ne savait pas ce qu'est
> Gold ni de quel test on parlait. L'écran dit maintenant « Gold est la formule payante de Halcya, avec toutes les
> analyses. Comme l'app est encore en test, vous l'avez sans rien payer, jusqu'au 2 déc. 2026 inclus. »
> ([clair](runs/captures/2026-11-09-0035-gold-clair.png) · [sombre](runs/captures/2026-11-09-0035-gold-sombre.png)).
> Le compteur « 01/06 » sur les trois cartes du début est voulu (la maquette fait pareil : les trois cartes sont un
> seul écran, les points disent la carte). Part sur Alpha avec l'envoi lancé à la main le 10/11 matin (gel levé).

> 🧾 **Analyse IA sans résultat : plus décomptée (09/11 01:35)** : une persona voyait « 19 analyses restantes » après
> un seul essai où l'IA n'avait reconnu aucun aliment. C'était bien le relais qui comptait l'essai. Désormais, « pas un
> repas » ou aucun aliment reconnu vous rend l'analyse (comme une photo de selles illisible). Le relais se redéploie
> seul au merge ; rien à faire de votre côté.

> 📷 **Repas : un secours si l'appareil photo ne s'ouvre pas (09/11 02:35)** : deux personas sur deux touchaient
> « Repas » sans rien voir se passer quand l'appareil photo se fermait. Désormais un bandeau dit « Aucune photo prise. »
> avec « Décrire le repas » ([clair](runs/captures/2026-11-09-0235-repas-sans-photo-clair.png) ·
> [sombre](runs/captures/2026-11-09-0235-repas-sans-photo-sombre.png)). À tester : touchez Repas puis revenez en
> arrière sans photo.

> 🔤 **Onglets entiers sur petit écran (09/11 03:35)** : avec une grande police d'Android, la barre du bas coupait
> « Aujourd'… » et « Analys… », et les onglets du Journal se touchaient (« NutritionTendances »). Les libellés
> rapetissent maintenant juste assez pour tenir ; rien ne change à la taille normale de votre A56
> ([clair](runs/captures/2026-11-09-0335-onglets-320-clair.png) · [sombre](runs/captures/2026-11-09-0335-onglets-320-sombre.png)).

> 🔢 **Journal : valeurs entières en grande police (09/11 04:35)** : avec la grande taille de police d'Android, les
> tuiles des jours coupaient en plein mot (« 2 285 kca / l », « 37, / normal »). Un nombre reste maintenant collé à
> son unité ; rien ne change en taille normale ([clair](runs/captures/2026-11-09-0435-tuiles-grande-police-clair.png) ·
> [sombre](runs/captures/2026-11-09-0435-tuiles-grande-police-sombre.png)).

> 🔘 **Boutons d'ajout lisibles en grande police (09/11 05:35)** : à 320 px avec la grande police d'Android,
> « Digestion » touchait le bord de son bouton et « + 1 cigarette » en sortait. Les boutons s'élargissent avec la
> police (le bandeau défile un peu plus tôt) ; rien ne change en taille normale sur votre A56
> ([clair](runs/captures/2026-11-09-0535-bandeau-grande-police-clair.png) ·
> [sombre](runs/captures/2026-11-09-0535-bandeau-grande-police-sombre.png)).

> 📈 **Tendances au tout début (09/11 06:35)** : sans aucune mesure, l'onglet affichait Jour / Semaine / Mois qui ne
> montraient rien. Il ne dit plus que « Vos courbes apparaîtront après 3 jours de mesures. »
> ([clair](runs/captures/2026-11-09-0635-tendances-vide-clair.png) · [sombre](runs/captures/2026-11-09-0635-tendances-vide-sombre.png)).
> Au passage, les boutons d'ajout en grande police (run de 05:35) sont mergés.

> 🔠 **Pages plus lisibles (09/11 07:35)** : sur Sources, Vos données et Paramètres, la phrase d'introduction était en
> gras, comme un titre : « Mes appareils » se confondait avec elle. Elle est maintenant en texte normal
> ([avant](runs/captures/2026-11-09-0735-intro-sources-avant-clair.png) ·
> [après](runs/captures/2026-11-09-0735-intro-sources-apres-clair.png) ·
> [sombre](runs/captures/2026-11-09-0735-intro-donnees-apres-sombre.png)).

> 🧑‍🤝‍🧑 **Personas avec leur objectif (09/11 08:35, run « idées »)** : « Prendre soin de soi » (iPhone seul, 45 jours)
> et « Stressé et pressé » (Pixel Watch, 14 jours, presque rien noté) ont rejoué avec l'objectif coché à l'accueil.
> Verdict des deux : l'écran Aujourd'hui reste centré sur les repas et la digestion
> ([stressé](simulations/captures/2026-11-09-0835-stresse-presse-J14/accueil.png) ·
> [prendre soin](simulations/captures/2026-11-09-0835-prendre-soin-maigrir-J45/accueil-apres.png)). Changer cela
> touche la structure : une maquette vous sera proposée ce soir (PROP-OBJECTIF), rien n'est codé sans votre accord.
> Les petits défauts (bande blanche de la visite, VFC sans « d'habitude », « pt » non expliqué…) partent aux runs de
> code ([synthèse](simulations/2026-11-09-0835-synthese.md)).

> 🌫️ **Visite guidée sans bande blanche (09/11 09:35)** : en touchant « Voir dans 14 jours », le bas de l'écran
> devenait blanc pendant une seconde (l'animation qui remplit l'écran passait au-dessus du voile sombre). Il reste
> maintenant assombri ([avant](runs/captures/2026-11-09-0935-visite-avant-light-milieu.png) ·
> [après](runs/captures/2026-11-09-0935-visite-apres-light-milieu.png)). Le « jour 10 » vu par une persona venait de sa
> capture prise trop tôt : l'étiquette finit bien à « jour 14 ». Mergé au run suivant (#859).

> 📊 **Analyses : « pt » expliqué (09/11 11:35)** : une ligne sous « Ce qui va avec votre bien-être » dit « pt : points
> de votre note de bien-être, sur 5 » (une seule fois sur la page). « Comment c'est calculé » s'ouvre sur deux phrases
> simples ; le modèle et ses fenêtres sont sous « Le détail ». Le prochain horizon dit « encore 12 jours notés »
> ([capture](runs/captures/2026-11-09-1135-analyses-pt-clair.png) ·
> [calcul](runs/captures/2026-11-09-1135-analyses-calcul-sombre.png)).

> ✍️ **« Décrire un repas » ouvre le champ (09/11 13:35)** : depuis « Autre chose » (ou le bandeau « Aucune photo
> prise. »), on arrivait sur la page Repas générale et il fallait encore toucher « Décrire ». Le champ « Décrivez
> votre repas » est maintenant ouvert et prêt à écrire ([clair](runs/captures/2026-11-09-1335-decrire-repas-clair.png) ·
> [sombre](runs/captures/2026-11-09-1335-decrire-repas-sombre.png)).

> 💬 **Note de bien-être : la phrase expliquée (09/11 14:35)** : sous « En une phrase », « Elle propose des précisions,
> elle n'est pas gardée » laissait croire que la phrase se perdait (« qui "elle" ? », persona Stressé). La ligne dit
> maintenant « Halcya en tire une note et des précisions à vous proposer ; la phrase n'est pas enregistrée. »
> ([clair](runs/captures/2026-11-09-1435-phrase-bien-etre-clair.png) ·
> [sombre](runs/captures/2026-11-09-1435-phrase-bien-etre-sombre.png)).

> ↩️ **Réintroduction : rangée sous Agir (10/11 01:35)** : la page « Réintroduction guidée » s'ouvre depuis Agir, mais
> affichait encore en haut les onglets d'Analyses (« Bien-être · Digestion »), aucun sélectionné. Elle a maintenant
> un retour « ← Agir », comme la page d'un essai ([avant](runs/captures/2026-11-10-0135-reintro-agir-avant-clair.png) ·
> [après](runs/captures/2026-11-10-0135-reintro-agir-play-clair.png) ·
> [sombre](runs/captures/2026-11-10-0135-reintro-agir-play-sombre.png) ·
> [groupes](runs/captures/2026-11-10-0135-reintro-agir-groupes-clair.png)).

> ⚪ **Barres de progression vides lisibles (10/11 02:35)** : au premier jour, « 0/28 jours avec une note digestive »
> s'affichait sous une barre qui paraissait pleine (le rail orange seul). La barre a maintenant un point de départ
> foncé : vide, elle se voit vide (même chose pour le compte à rebours d'Analyses)
> ([clair](runs/captures/2026-11-10-0235-barre-vide-aujourdhui-clair.png) ·
> [sombre](runs/captures/2026-11-10-0235-barre-vide-aujourdhui-sombre.png) ·
> [Analyses](runs/captures/2026-11-10-0235-barre-vide-analyses-clair.png)).

> ⌚ **Montre et accueil : fin des mots en police mono (10/11 09:35)** : sur l'écran Montre, « reçu », « rien », les
> dates et « 14 mesures sur 7 j » ; sur l'accueil, « reçu » et les chiffres de vos 30 derniers jours ; « partiel » dans
> Nutrition. Seuls les chiffres gardent la police à chasse fixe. Dix règles de style qui ne servaient plus sont retirées
> ([Montre clair](runs/captures/2026-11-10-0935-mono-mots-3-montre-clair.png) ·
> [sombre](runs/captures/2026-11-10-0935-mono-mots-3-montre-sombre.png) ·
> [accueil](runs/captures/2026-11-10-0935-mono-mots-3-accueil-clair.png)). Mergé après l'envoi Alpha de 09:40 : part avec l'envoi du soir (23:45).

> 💶 **Abonnement : mots dans la police du texte (10/11 07:35)** : sur la page de l'abonnement, « premium »,
> « / an », « par mois », « −50 % » et « jour 12 » étaient en police à chasse fixe ; seuls les prix et les nombres le
> restent ([clair](runs/captures/2026-11-10-0735-mono-paywall-clair.png) ·
> [sombre](runs/captures/2026-11-10-0735-mono-paywall-sombre.png) ·
> [essai](runs/captures/2026-11-10-0735-mono-paywall-essai-sombre.png)). Part sur Alpha à la fin du gel.

> 🔤 **Mots dans la police du texte (10/11 06:35)** : suite du run précédent. L'étiquette « premium », le nom du
> groupe et « Jour 1 » de la Réintroduction, « type 4 » des selles, « pt » d'Analyses ou « kcal » des repas étaient
> encore en police à chasse fixe ; seuls leurs chiffres le restent
> ([premium, clair](runs/captures/2026-11-10-0635-mono-mots-reintro-clair.png) ·
> [sombre](runs/captures/2026-11-10-0635-mono-mots-reintro-sombre.png) ·
> [portions](runs/captures/2026-11-10-0635-mono-mots-reintro-portions-clair.png)). Part sur Alpha à la fin du gel.

> 🔢 **Chiffres sans grands blancs (10/11 05:35)** : la police des chiffres (à chasse fixe) s'appliquait aussi aux
> unités et aux espaces : « 6  h  30 », « 49  ms », « 37,  normal », « 31  % ». Seules les suites de chiffres la gardent
> maintenant, sur Aujourd'hui, les tuiles du Journal, les quantités des repas, Tendances et Vos données (leçon de
> design 11 : « police mono pour les chiffres seulement ») ([Journal clair](runs/captures/2026-11-10-0535-mono-chiffres-journal-clair.png) ·
> [sombre](runs/captures/2026-11-10-0535-mono-chiffres-journal-sombre.png) ·
> [Aujourd'hui](runs/captures/2026-11-10-0535-mono-chiffres-aujourdhui-clair.png) ·
> [sombre](runs/captures/2026-11-10-0535-mono-chiffres-aujourdhui-sombre.png) ·
> [Tendances](runs/captures/2026-11-10-0535-mono-chiffres-tendances-jour-clair.png)). Part sur Alpha à la fin du gel.

> 📐 **Nutrition : « Votre profil » resserré (10/11 04:35)** : chaque ligne du profil (poids, composition, activité)
> prenait 48 px de haut pour 20 px de texte ; la carte occupait la moitié de l'écran et ses lignes semblaient flotter.
> Elles sont resserrées, la zone qu'on touche garde ses 44 px ; vos apports remontent d'environ 70 px
> ([clair](runs/captures/2026-11-10-0435-profil-serre-clair.png) ·
> [sombre](runs/captures/2026-11-10-0435-profil-serre-sombre.png)).

> 🌙 **Tendances : « Nuit plus courte » au singulier (10/11 03:35)** : dans le détail d'un jour, « Ce qui a pu peser »
> disait « Nuits plus courtes que d'habitude » avec la moyenne de deux nuits. Il dit maintenant, comme la maquette,
> « Nuit plus courte que d'habitude (6 h 21) » avec la durée de la nuit même, quand elle va dans le même sens
> ([clair](runs/captures/2026-11-10-0335-nuit-singulier-clair.png) ·
> [sombre](runs/captures/2026-11-10-0335-nuit-singulier-sombre.png)).

> 📏 **Agir : le graphique d'un essai comme la maquette (10/11 00:35)** : « Résultat en cours » range maintenant les
> lendemains « Avec » et « Sans » sur deux lignes d'une même échelle, resserrée sur vos valeurs ; la ligne « Écart »
> a ses repères (−1, 0, +1) et une phrase dit l'écart : « Après 11 lendemains : −0,1 point, entre −1,4 et +1,2. »
> ([clair](runs/captures/2026-11-10-0035-essai-axes-clair.png) · [sombre](runs/captures/2026-11-10-0035-essai-axes-sombre.png)
> · [essai du sommeil au jour 13](runs/captures/2026-11-10-0035-essai-axes-sommeil-clair.png)). Les captures liées
> des runs de 21:35, 22:35 et 23:35 n'avaient pas été enregistrées (liens morts) ; celles-ci montrent l'état actuel.
> Part sur Alpha à la fin du gel.

> 📐 **Agir : le résultat dessiné dès le premier jour (09/11 23:35)** : au début d'un essai, « Résultat en cours »
> empilait trois phrases. Il montre maintenant ses axes Avec / Sans et la ligne « Écart » vides, avec une seule phrase
> ([clair](runs/captures/2026-11-09-2335-essai-vide-clair.png) · [sombre](runs/captures/2026-11-09-2335-essai-vide-sombre.png)).
> Part sur Alpha à la fin du gel.

> 🔝 **Agir : le résultat d'un essai en premier (09/11 22:35)** : comme sur la maquette, « Résultat en cours » passe
> avant le calendrier, et la légende des 14 jours dit la consigne (« ● dormir au moins 7 h 53 ○ comme d'habitude ✓ tenu
> · – pas tenu ») au lieu de « Pleine : jour avec. Contour : jour sans. »
> ([clair](runs/captures/2026-11-09-2235-essai-ordre-clair.png) · [sombre](runs/captures/2026-11-09-2235-essai-ordre-sombre.png)).
> Part sur Alpha à la fin du gel.

> 🗓️ **Agir : les 14 jours d'un essai en deux semaines (09/11 21:35)** : sur la page d'un essai, les 14 ronds sans
> numéro se rangeaient en 13 + 1. Comme sur la maquette, ce sont maintenant « Les 14 jours », numérotés, en deux lignes
> de 7, avec ✓ ou – au coin ([clair](runs/captures/2026-11-09-2135-essai-grille-clair.png) ·
> [sombre](runs/captures/2026-11-09-2135-essai-grille-sombre.png)). Part sur Alpha à la fin du gel.

> ✅ **Agir : chaque essai porte sa consigne (09/11 19:35)** : un essai en cours ou terminé s'appelait « Sommeil ». Comme
> sur la maquette, il s'appelle maintenant par ce qu'il faut faire (« Dormir au moins 7 h 30 ») et dit « Aujourd’hui,
> jour avec. » ou « jour sans : comme d’habitude » ; une réintroduction s'appelle « Réintroduction : les fructanes »
> ([proposé](runs/captures/2026-11-09-1935-agir-titres-clair.png) · [essai, sombre](runs/captures/2026-11-09-1935-essai-titre-sombre.png)).

> 🎯 **Agir : des essais concrets (09/11 18:35)** : une piste proposée disait « Tester : sommeil · court terme ». Comme
> sur la maquette validée, elle dit maintenant quoi faire et ce qui a été repéré : « Dormir au moins 7 h 53 » ·
> « Lien repéré : +0,2 point de bien-être pour 40 min de sommeil de plus. 14 jours, un jour sur deux tiré au sort. »
> ([clair](runs/captures/2026-11-09-1835-agir-propose-clair.png) · [sombre](runs/captures/2026-11-09-1835-agir-propose-sombre.png)).

> 🟢 **Note de bien-être plus lisible (09/11 17:35)** : le chiffre de la note choisie (« 4 » vert sur vert pâle) était
> trop peu contrasté en thème clair (3,72:1). Il prend les couleurs du thème bien-être, vérifiées au-dessus de 4,5:1 en
> clair et en sombre ([clair](runs/captures/2026-11-09-1735-contraste-note-clair.png) ·
> [sombre](runs/captures/2026-11-09-1735-contraste-note-sombre.png)). Au passage, un test qui échouait certains jours
> (un « -0 » dans l'analyse des heures de repas) est corrigé.

> 📏 **Tendances : une vraie grille (09/11 16:35)** : une persona prenait la ligne grise du graphique pour « votre
> habitude ». C'était la seule ligne de grille, au milieu de l'axe. Il y en a maintenant une par graduation, comme une
> grille ordinaire ([clair](runs/captures/2026-11-09-1635-grille-tendances-clair.png) ·
> [sombre](runs/captures/2026-11-09-1635-grille-tendances-sombre.png)).

> 🚶 **Profil nutrition : le niveau d'activité dit d'où il vient (09/11 15:35)** : « Automatique » devenait
> « Modérément actif » sans explication. Le profil dit maintenant « Modérément actif d’après vos pas » ; le toucher
> montre la moyenne de pas utilisée ([clair](runs/captures/2026-11-09-1535-activite-pas-clair.png) ·
> [sombre](runs/captures/2026-11-09-1535-activite-pas-sombre.png)).

> 🍽️ **Journal : « repas incomplets ? » (09/11 12:35)** : « Dépense 2 285 kcal » à côté de « Repas ≈ 479 kcal »
> faisait croire à un gros déficit. Quand les repas notés font moins de la moitié de la dépense du jour, la tuile Repas
> dit maintenant « repas incomplets ? », avec la même règle que la page Nutrition
> ([clair](runs/captures/2026-11-09-1235-repas-incomplets-clair.png) ·
> [sombre](runs/captures/2026-11-09-1235-repas-incomplets-sombre.png)).

> 💓 **VFC : « d'habitude » aussi quand elle date d'hier (09/11 10:35)** : le matin, tant que la montre n'a pas envoyé
> la nuit, Aujourd'hui reprend la VFC d'hier, mais sans repère (« 51 ms, c'est bien ou pas ? », persona Stressé). Elle
> a maintenant son « d'habitude 49 ms », comme le sommeil, et sa flèche si l'écart est net
> ([avant](runs/captures/2026-11-09-1035-vfc-habitude-avant-clair.png) ·
> [après](runs/captures/2026-11-09-1035-vfc-habitude-clair.png) ·
> [sombre](runs/captures/2026-11-09-1035-vfc-habitude-sombre.png)).

**Toujours en attente de vous (repris de la semaine dernière)**
- **Tendances › Jour** (question du 08/11) : « Nuits plus longues (7 h 46) » est la moyenne des derniers jours ;
  voulez-vous la nuit du seul jour, au singulier, comme la maquette ?
- **P45** (1 min, avant d'inviter, nouveau) : Play Console → Halcya → Tester → Test fermé → Alpha → onglet Testeurs → « Adresse e-mail ou URL pour les commentaires » : si vide, mettez l'adresse de contact de la fiche Play. Ensuite, aux jours 4, 8 et 11, collez les retours des testeurs dans une consigne (« RETOURS TESTEURS jour N : … », sans nom ni adresse) : aucune API ne permet à la routine de les lire seule.
- **P43** (1 min, nouveau, pas urgent) : activer « Google Play Developer Reporting API » dans la console Google Cloud (projet healthtrack-824b26 → API et services → Bibliothèque → Activer). La routine pourra alors lire elle-même les plantages signalés par Google et choisir les versions Alpha du test sans plantage connu.
- **P37 — votre Gold après la période de lancement (simplifié le 03/11 18:35)** : le relais a trouvé une seule
  installation Android au jeton accepté, la vôtre en toute vraisemblance : empreinte **`5e4a69f72ffb`** (vue du 29/10
  au 02/11). Il suffit de **confirmer** : Paramètres → touchez 7 fois « Version » → « Empreinte de l'installation »
  commence-t-elle par **5e4a** ? Répondez « P37 oui » (ou donnez l'empreinte affichée si elle diffère) : la routine
  l'ajoute alors au relais et vous gardez Gold après le 30/11.
- **P44** (question, réponse avant le 20/11) : remercier les testeurs restés jusqu'au bout par **un mois de Gold en plus** (jusqu'au 27/12, sans carte bancaire, sous les plafonds du budget) ? Répondez « P44 oui » ou « P44 non » dans une consigne ; détail dans [`PRODUIT.md`](PRODUIT.md) §4.
- **P39** (pas urgent) : expiration des clés App Attest dans Firestore, même geste que P33 (commande dans `PRODUIT.md` §4).
- **P32** (pays de vente) : le jour de la production, 2 min, geste exact dans [`PRODUIT.md`](PRODUIT.md) §4 (abonnements déjà prêts dans les 5 pays ; Suisse 4,90 / 29,00 / 9,90 CHF, Canada 6,99 / 39,99 / 12,99 $CA hors taxes : dites-le si vous voulez d'autres prix).
- P34 (encart « Enregistrez vos applications » dans la Play Console) : pas urgents, détail dans
  [`semaines/2026-S44.md`](semaines/2026-S44.md).

| Run | Type | Résultat |
|---|---|---|
| 11/11 13:35 — [Poids dans Tendances](runs/2026-11-11-1335-poids-tendances.md) | ✏️ | POLISH-SIM-47 : mesure « Poids » (dernière pesée du jour) dans Tendances ; graduations à 2 décimales ; tests rouges puis verts, captures claires et sombres. Rien à faire de votre côté |
| 11/11 12:35 — [Aliment non compté visible](runs/2026-11-11-1235-kcal-incomplet.md) | ✏️ | POLISH-SIM-48 : total « sans … » ou « inconnu » ; « ≥ » dans les listes ; tests rouges puis verts. Rien à faire de votre côté |
| 11/11 11:35 — [Symptôme noté visible](runs/2026-11-11-1135-symptome-note.md) | ✏️ | POLISH-SIM-46 : coche dans la puce et « Noté : Crampes » / « Retiré » ; test rouge puis vert. Rien à faire de votre côté |
| 11/11 10:35 — [Pas du jour, bien-être une fois](runs/2026-11-11-1035-pas-du-jour.md) | ✏️ | POLISH-SIM-40 : pas absents = artefact de la démo (pas du jour ajoutés) ; bien-être retiré de « Vos données du jour » (doublon) ; tests rouges puis verts. Rien à faire de votre côté |
| 11/11 09:35 — [#910 mergée](runs/2026-11-11-0935-merge-910.md) | 🔧 | PR #910 (Ma digestion, une question à la fois) remise à jour sur main, vérifiée (tests, build, lint, visual, capture du soir) et mergée. Rien à faire de votre côté |
| 11/11 08:35 — [Deux personas](runs/2026-11-11-0835-personas.md) | 💡 | Simulations Maigrir J1 et Endométriose J45 (règles notées) ; POLISH-SIM-46 à 51, PROP-SIM-11 et 12 ; outil complété. Rien à faire de votre côté |
| 11/11 07:35 — [Ma digestion, une question à la fois](runs/2026-11-11-0735-digestion-une-question.md) | ✏️ | POLISH-SIM-41 : le soir, une seule rangée Calme / Gêne / Douleur (journée, ou moment précis) ; test rouge puis vert. Rien à faire de votre côté |
| 11/11 06:35 — [Compter ses cigarettes](runs/2026-11-11-0635-compter-cigarettes.md) | ✏️ | POLISH-SIM-42 : « Autre chose » ne note plus de cigarette d'un toucher, « Je fume : compter mes cigarettes » active le compteur ; test rouge puis vert. Rien à faire de votre côté |
| 11/11 05:35 — [« Réglages › Paramètres »](runs/2026-11-11-0535-reglages-parametres.md) | ✏️ | POLISH-SIM-44 : l'accueil, le rappel du soir et Agir donnent le chemin depuis la roue ; tests rouges puis verts. Rien à faire de votre côté |
| 11/11 04:35 — [Une seule durée d'essai](runs/2026-11-11-0435-une-duree.md) | ✏️ | POLISH-SIM-43 : accueil « vérifier une piste par un essai », Agir vide « de quelques jours à deux semaines selon la piste » ; tests rouges puis verts. Rien à faire de votre côté |
| 11/11 03:35 — [« Trois usages »](runs/2026-11-11-0335-tuto-usages.md) | ✏️ | POLISH-SIM-38 : 2e carte de l'accueil, « Trois onglets » → « Trois usages : ». Alpha 100984 envoyé à 03:16. Rien à faire de votre côté |
| 11/11 02:35 — [Règles d'hier](runs/2026-11-11-0235-regles-hier.md) | 🧱 | CYCLE-2d : choix « Aujourd'hui · Hier » dans « Mes règles » (flux et symptômes de la veille). À tester : Aujourd'hui › Règles › Hier |
| 11/11 01:35 — [Test du « 1er » réparé](runs/2026-11-11-0135-test-1er.md) | 🔧 | CI de main rouge le 11/11 : un test attendait « le 1 novembre », l'app écrit « le 1er novembre ». Test corrigé, rien ne change dans l'app. Rien à faire de votre côté |
| 11/11 00:35 — [Symptômes du cycle](runs/2026-11-11-0035-symptomes-cycle.md) | 🧱 | CYCLE-2c : puces des symptômes dans « Mes règles » (une touche note, une autre retire). À tester : Aujourd'hui › Règles › Crampes |
| 10/11 23:35 — [Corriger ses règles](runs/2026-11-10-2335-regles-journal.md) | 🧱 | CYCLE-2b : « … » de la ligne « Règles » du Journal (Modifier le flux sur place, Supprimer). À tester : Journal › Jours › « … » |
| 10/11 22:35 — [Noter ses règles](runs/2026-11-10-2235-regles-aujourdhui.md) | 🧱 | CYCLE-2 : bouton « Règles » du bandeau d'Aujourd'hui (avec « Mon cycle »), un geste par flux, corriger ou retirer ; confidentialité à jour. À tester : Aujourd'hui › Règles |
| 10/11 21:35 — [Cycle dans le Journal](runs/2026-11-10-2135-cycle-journal.md) | 🧱 | CYCLE-1b : ligne « Règles · 2e jour · flux moyen » et jour du cycle dans Journal › Jours (seulement avec des données de cycle) ; constipation et diarrhée ajoutées aux symptômes (demande iOS). Rien à faire de votre côté |
| 10/11 20:35 — [Deux personas au jour 1](runs/2026-11-10-2035-personas-j1.md) | 💡 | Simulations Stressé et pressé J1 et Endométriose J1 : POLISH-SIM-38 à 45 ; faux relais de l'outil corrigé ; P48 (cycle dans Health Connect) rédigée, pas encore à faire. Une question : compteur « 01/06 » du tuto |
| 10/11 19:35 — [Cycle : brique partagée](runs/2026-11-10-1935-cycle-brique.md) | 🧱 | CYCLE-1a : règles, saignements et symptômes rangés en entrées `cycle` (sans migration), jour des règles et jour du cycle calculés, export / import testés ; rien d'affiché. Rien à faire de votre côté |
| 10/11 18:55 — [Relais iOS : cycle accepté](runs/2026-11-10-1855-relais-ios-cycle.md) | 📨 | Décision « Ok cycle » relayée à la routine iOS (POUR-IOS.md) : Android fait d'abord la brique partagée (CYCLE-*), puis iOS lit le cycle dans Santé. Rien à faire de votre côté |
| 10/11 18:35 — [Journal : modifier une note de digestion](runs/2026-11-10-1835-digestion-modifier.md) | 🎨 | POLISH-SIM-36b : « Modifier » dans le « … » d'une note de digestion, choix sur place, heure gardée ; test rouge puis vert, captures claires et sombres. Rien à faire de votre côté |
| 10/11 17:35 — [Deux PR prêtes mergées](runs/2026-11-10-1735-merge-prs.md) | 🔧 | #894 (Analyses s'ouvre sur Digestion) mergée, release v653 ; #895 (tuiles du Journal) remise à jour sur main et vérifiée. Rien à faire de votre côté |
| 10/11 16:35 — [Journal : les tuiles ouvrent leur courbe](runs/2026-11-10-1635-journal-tuiles.md) | 🎨 | POLISH-SIM-36 : les tuiles du jour qui ont une courbe ouvrent Tendances sur leur mesure, tuile entière touchable ; test rouge puis vert, captures claires et sombres. Reste POLISH-SIM-36b. Rien à faire de votre côté |
| 10/11 15:35 — [Analyses s'ouvre sur Digestion](runs/2026-11-10-1535-analyses-digestion.md) | 🎨 | POLISH-SIM-33 : avec « Ma digestion » ou « Mon cycle », l'onglet Analyses ouvre Digestion ; test rouge puis vert, vérifié dans Chromium. Émulateur A56 relancé (panne de téléchargement). Rien à faire de votre côté |
| 10/11 14:35 — [Deux personas, liens pas assez nets en gris](runs/2026-11-10-1435-analyses-gris.md) | 🎨 | Simulations Endométriose J14 et Ventre et données J45 (POLISH-SIM-31 à 37, PROP-SIM-10) ; POLISH-SIM-30 : dans Analyses, un lien pas assez net a son chiffre en gris ; test, captures. Rien à faire de votre côté |
| 10/11 13:35 — [Fiche du Store : captures à jour](runs/2026-11-10-1335-fiche-captures.md) | 🎨 | LISTING-CAPTURES : 7 captures refaites (Aujourd'hui, Tendances, Analyses, Agir avec essai, Repas, Réintroduction, Journal) ; options propres à chaque capture ; test contre les routes de redirection (rouge puis vert). Rien à faire de votre côté |
| 10/11 12:35 — [Fiche du Store au passage du soir](runs/2026-11-10-1235-fiche-passage-soir.md) | 🔧 | CD-ALPHA-7b : la fiche (nouveau titre) et les abonnements n'étaient plus envoyés depuis le 03/11 ; ils partent chaque soir juste avant la version Alpha s'ils ont changé ; 5 tests rouges puis verts. Rien à faire de votre côté |
| 10/11 10:35 — [Note du jour sans blancs autour de la virgule](runs/2026-11-10-1035-mono-virgule.md) | 🎨 | MONO-VIRGULE : « 3 , 2 /5 » devient « 3,2/5 » sur Aujourd'hui ; « +0,4 pt » d'Analyses et niveaux avant/après de Tendances aussi ; test rouge puis vert, captures claires et sombres. Rien à faire de votre côté |
| 10/11 09:45 — [Alpha : remplacer l'examen en cours](runs/2026-11-10-0945-alpha-remplace-examen.md) | 🔧 | CD-ALPHA-7 : votre demande du 10/11 vers 10:15 (« retirer de la file toutes les versions précédentes ») est déjà ce que fait Google ; l'envoi le dit maintenant explicitement (`changesInReviewBehavior=CANCEL_IN_REVIEW_AND_SUBMIT`), tests adaptés. Rien à faire de votre côté |
| 10/11 09:40 — [Alpha : gel levé, envoi immédiat](runs/2026-11-10-0940-alpha-maintenant.md) | 🧊 | Run court : gel Alpha levé (`until` = `null`) selon votre décision du 10/11 vers 09:35 (« Ne prolonge pas et meme lance la publication android alpha maintenant ») ; test ajouté ; envoi « Play — Alpha » lancé à la main après le merge : 100962 placé sur l'alpha (en examen chez Google). Envoi nocturne normal ensuite. Rien à faire de votre côté |
| 10/11 09:35 — [Montre et accueil : mots hors mono](runs/2026-11-10-0935-mono-mots-3.md) | 🎨 | MONO-MOTS-3 : écran Montre, « partiel » de Nutrition et accueil hors mono sauf les chiffres ; 10 règles CSS mortes retirées ; test garde-fou rouge puis vert. Rien à faire de votre côté |
| 10/11 09:15 — [Relais iOS : déploiement continu](runs/2026-11-10-0915-relais-ios-deploiement-continu.md) | 📨 | Run court : votre réponse (« j'aimerais qu'elle le fasse tout seul… ») relayée mot pour mot dans POUR-IOS.md : chaque build TestFlight traitée part aux « Testeurs Halcya » et à l'examen bêta dès qu'elle est prête, puis la routine iOS lance elle-même le nettoyage réel des anciennes builds (restent la 844.344, la build des testeurs et la plus récente). Rien d'autre touché. Rien à faire de votre côté |
| 10/11 09:10 — [Relais iOS : nettoyage fait](runs/2026-11-10-0910-relais-ios-nettoyage.md) | 📨 | Run court : votre réponse de 09:05 (nettoyage fait, dernière build chez les testeurs externes, accord d'Apple immédiat avec le même numéro de version) relayée mot pour mot en tête de `POUR-IOS.md` ; la routine iOS vérifiera les builds restantes. Rien à faire de votre côté |
| 10/11 06:35 — [Mots dans la police du texte](runs/2026-11-10-0635-mono-mots.md) | 🎨 | MONO-MOTS : étiquettes et unités hors mono dans 9 composants (Réintroduction, rapport médecin, visite, selles, frise digestive, repas, Analyses, Tendances) ; test garde-fou rouge puis vert, captures claires et sombres. Rien à faire de votre côté |
| 10/11 07:35 — [Abonnement : mots dans la police du texte](runs/2026-11-10-0735-mono-paywall.md) | 🎨 | MONO-MOTS-2 : paywall (étiquette, prix, « par mois », badge, frise de l'essai) hors mono sauf les chiffres ; colonnes de jours de Tendances marquées bande continue (plus d'avertissement de cible). Rien à faire de votre côté |
| 10/11 05:35 — [Chiffres sans grands blancs](runs/2026-11-10-0535-mono-chiffres.md) | 🎨 | MONO-CHIFFRES (revue `--play` du run) : `utils/monoDigits` met en mono les seules suites de chiffres (unités, virgule et espace des milliers dans la police du texte), appliqué à Aujourd'hui, Journal, repas, Tendances et Vos données ; tests rouges puis verts, captures claires et sombres. Rien à faire de votre côté |
| 10/11 04:35 — [Nutrition : « Votre profil » resserré](runs/2026-11-10-0435-profil-serre.md) | 🎨 | POLISH-PROFIL-SERRE (revue `--play` du run) : lignes du profil à 28 px avec un débord invisible qui garde la cible de 44 px ; l'outil visuel compte ce débord ; test rouge puis vert, captures claires et sombres. Rien à faire de votre côté |
| 10/11 03:35 — [Tendances : la nuit même, au singulier](runs/2026-11-10-0335-nuit-singulier.md) | 🎨 | T4-suite : « Nuit plus courte que d'habitude (6 h 21) » avec la nuit du jour (valeur du jour exposée au court terme) ; tests rouges puis verts, captures claires et sombres. PR #878 (barres vides) relancée après une coupure réseau de la CI. Rien à faire de votre côté |
| 10/11 02:35 — [Barres de progression vides lisibles](runs/2026-11-10-0235-barre-vide.md) | 🎨 | POLISH-BARRE-VIDE : à 0/28, la barre paraissait pleine ; un point de départ de la hauteur du rail (Aujourd'hui et Analyses) ; test rouge puis vert, captures claires et sombres. Rien à faire de votre côté |
| 10/11 01:35 — [Réintroduction rangée sous Agir](runs/2026-11-10-0135-reintro-agir.md) | 🎨 | POLISH-REINTRO-AGIR : plus d'onglets d'Analyses sur la réintroduction (reste de l'ancienne organisation), retour « ← Agir » ; test rouge puis vert, captures claires et sombres. Rien à faire de votre côté |
| 10/11 00:35 — [Agir : le graphique d'un essai comme la maquette](runs/2026-11-10-0035-essai-axes.md) | 🎨 | POLISH-ESSAI-AXES : Avec / Sans en lignes sur une échelle commune, Écart gradué, phrase « Après N lendemains : … » ; option `--trial` de l'outil visuel ; test rouge puis vert, captures claires et sombres. Captures des 3 runs précédents jamais commitées (règle `git add -f` ajoutée à la charte). Rien à faire de votre côté |
| 09/11 23:35 — [Agir : résultat dessiné dès le jour 1](runs/2026-11-09-2335-essai-vide.md) | 🎨 | POLISH-ESSAI-VIDE et POLISH-ESSAI-CLASSE : graphique vide avec axes et piste « Écart », une seule phrase ; classe SVG renommée ; test rouge puis vert, captures claires et sombres. Rien à faire de votre côté |
| 09/11 22:35 — [Agir : le résultat en premier](runs/2026-11-09-2235-essai-ordre.md) | 🎨 | POLISH-ESSAI-ORDRE : « Résultat en cours » avant « Les 14 jours », légende avec la consigne ; test rouge puis vert, captures claires et sombres. Rien à faire de votre côté |
| 09/11 21:35 — [Agir : les 14 jours en deux semaines](runs/2026-11-09-2135-essai-grille.md) | 🎨 | POLISH-ESSAI-GRILLE : page d'un essai, « Les 14 jours » en 2 × 7 cases numérotées, ✓ / – au coin, comme la maquette ; test rouge puis vert, captures claires et sombres. Le run « idées » de 20:35 n'a rien laissé : PROP-OBJECTIF reste à faire. Rien à faire de votre côté |
| 09/11 19:55 — [Relais iOS : 896 expirée](runs/2026-11-09-1955-relais-ios-896-expiree.md) | 📨 | Run court : votre réponse « 896 expirée » relayée mot pour mot dans POUR-IOS.md (vérifier l'expiration de la 896.376, soumettre la 918.396 ou plus récente à « Testeurs Halcya », puis nettoyer les anciennes builds selon la règle de 11:05). Rien d'autre touché. Rien à faire de votre côté |
| 09/11 19:05 — [Gel Alpha prolongé](runs/2026-11-09-1905-gel-alpha-prolonge.md) | 🧊 | Run court : 100918 toujours en examen ; gel prolongé de 24 h (jusqu'au 10/11 22:00 Paris) selon votre décision du 09/11 vers 18:40, car un envoi pendant l'examen peut renvoyer l'app en fin de file ; test ajouté (envoi du 09/11 retenu, celui du 10/11 part). Pour lever plus tôt : dites-le à l'orchestrateur |
| 09/11 14:35 — [Note de bien-être : la phrase expliquée](runs/2026-11-09-1435-phrase-bien-etre.md) | 🎨 | POLISH-SIM-26 : phrase sous « En une phrase » reformulée ; test rouge puis vert, captures claires et sombres (variante play) ; contraste faible du chiffre de la note choisie relevé au BACKLOG. Rien à faire de votre côté |
| 09/11 15:35 — [Profil nutrition : niveau d'activité expliqué](runs/2026-11-09-1535-activite-pas.md) | 🎨 | POLISH-SIM-27 : « d’après vos pas » visible sans toucher ; test rouge puis vert, captures claires et sombres. Rien à faire de votre côté |
| 09/11 19:35 — [Agir : chaque essai porte sa consigne](runs/2026-11-09-1935-agir-titres.md) | 🎨 | POLISH-AGIR-TITRES : consigne en titre des essais (cartes et page), « Réintroduction : les fructanes » ; tests rouges puis verts, captures claires et sombres ; émulateur A56 de main relancé (jobs jamais démarrés côté GitHub). Rien à faire de votre côté |
| 09/11 18:35 — [Agir : essais proposés concrets](runs/2026-11-09-1835-agir-propose.md) | 🎨 | POLISH-AGIR-PROPOSE : consigne et effet chiffré comme la maquette ; tests rouges puis verts, captures claires et sombres (variante play). Rien à faire de votre côté |
| 09/11 17:35 — [Note de bien-être : contraste](runs/2026-11-09-1735-contraste-note.md) | 🎨 | POLISH-CONTRASTE-NOTE : couple mint-bg / mint-label (≥ 4,5:1 clair et sombre) ; -0 normalisé dans `mealHours` (test du cache rouge ce jour-là sur main). Rien à faire de votre côté |
| 09/11 16:35 — [Tendances : une grille lisible](runs/2026-11-09-1635-grille-tendances.md) | 🎨 | POLISH-SIM-28 : la ligne grise isolée n'était pas une habitude ; grille à chaque graduation ; test rouge puis vert, captures claires et sombres. Rien à faire de votre côté |
| 09/11 13:35 — [Décrire un repas](runs/2026-11-09-1335-decrire-repas.md) | 🎨 | POLISH-SIM-25 : « Décrire un repas » et « Décrire le repas » ouvrent directement le champ de description ; tests rouges puis verts, captures claires et sombres (variante play) ; tests du relais rouges depuis 12:00 UTC (certificats de test datés de l'heure de la CI) réparés. Rien à faire de votre côté |
| 09/11 12:35 — [Repas incomplets](runs/2026-11-09-1235-repas-incomplets.md) | 🎨 | POLISH-SIM-24 : tuile Repas « repas incomplets ? » sous la moitié de la dépense du jour, règle partagée avec Nutrition ; test rouge puis vert, captures claires et sombres. Rien à faire de votre côté |
| 09/11 11:35 — [Analyses : « pt » expliqué](runs/2026-11-09-1135-analyses-pt.md) | 🎨 | POLISH-SIM-23 : unité « pt » dite une fois, « Comment c'est calculé » en deux phrases puis « Le détail », « encore N jours notés » ; tests rouges puis verts, captures claires et sombres. Rien à faire de votre côté |
| 09/11 11:05 — [Relais iOS : expiration des anciennes builds](runs/2026-11-09-1105-relais-ios-expiration.md) | 📨 | Run court : votre décision du 09/11 vers 11:00 relayée mot pour mot dans POUR-IOS.md (expirer la 896.376 puis soumettre la 918.396 ; règle durable : expirer les builds TestFlight qui ne servent plus, en gardant la 844.344, la dernière build distribuée aux testeurs et celle en examen). Rien d'autre touché. Rien à faire de votre côté |
| 09/11 10:35 — [VFC d'hier avec son habitude](runs/2026-11-09-1035-vfc-habitude.md) | 🎨 | PR #859 du run précédent mergée ; POLISH-SIM-22 : une mesure reprise d'hier (VFC, sommeil « nuit d'avant ») a son « d'habitude » ; test rouge puis vert, captures avant/après claires et sombres. Rien à faire de votre côté |
| 09/11 09:35 — [Visite sans bande blanche](runs/2026-11-09-0935-visite-sans-bande.md) | 🎨 | POLISH-SIM-20 : le rideau de « Voir dans 14 jours » passe sous le voile ; POLISH-SIM-21 était un artefact de l'outil (corrigé) ; test rouge puis vert, captures avant/après ; PR #859 verte, merge refusé par les permissions de la session : à merger au run suivant |
| 09/11 08:35 — [Personas et objectif](runs/2026-11-09-0835-idees-personas-objectifs.md) | 💡 | Outil : objectif d'accueil et persona pressée ; 2 simulations (Prendre soin de soi J45, Stressé J14) ; Aujourd'hui ne suit pas l'objectif → maquette PROP-OBJECTIF ce soir ; POLISH-SIM-20 à 28. Rien à faire de votre côté |
| 09/11 07:35 — [Intro ≠ titre](runs/2026-11-09-0735-intro-titre.md) | 🎨 | INTRO-TITRE : la phrase d'introduction de Sources, Données, Paramètres, Licences et Montre n'a plus le style d'un titre ; phrase d'abonnement reformulée ; test rouge puis vert, captures avant/après. Rien à faire de votre côté |
| 09/11 06:35 — [Tendances vierge](runs/2026-11-09-0635-tendances-vide.md) | 🎨 | PR #855 du run précédent mergée ; Tendances sur historique vierge : le message seul ; test rouge puis vert, captures claires et sombres. Rien à faire de votre côté |
| 09/11 05:35 — [Boutons d'ajout en grande police](runs/2026-11-09-0535-bandeau-grande-police.md) | 🎨 | GRANDE-POLICE-1 soldée : cases du bandeau d'ajout à la largeur de la police, « + 1 cigarette » à la ligne ; le contrôle visuel ne confond plus un libellé sur deux lignes avec un débordement ; test rouge puis vert, captures claires et sombres. Rien à faire de votre côté |
| 09/11 04:35 — [Valeurs en grande police](runs/2026-11-09-0435-tuiles-grande-police.md) | 🎨 | GRANDE-POLICE-1 (tuiles du Journal) : nombre et unité jamais séparés, coupure seulement entre deux morceaux ; tests rouges puis verts, captures claires et sombres. Rien à faire de votre côté |
| 09/11 03:35 — [Onglets petit écran](runs/2026-11-09-0335-onglets-petit-ecran.md) | 🎨 | NAV-LIBELLE-320 : libellés des onglets entiers en grande police ; le contrôle visuel voit désormais les libellés coupés ; test, captures claires et sombres. Rien à faire de votre côté |
| 09/11 02:35 — [Repas sans photo](runs/2026-11-09-0235-repas-sans-photo.md) | 🎨 | POLISH-SIM-17 : appareil photo fermé sans photo → « Décrire le repas » ; tests, captures claires et sombres. À tester sur votre téléphone |
| 09/11 01:35 — [Analyse sans résultat](runs/2026-11-09-0135-analyse-sans-resultat.md) | 🎨 | POLISH-SIM-19 : un repas sans aliment reconnu ne prend plus de crédit IA (relais, test rouge puis vert). Rien à faire de votre côté |
| 09/11 00:35 — [Gold expliqué](runs/2026-11-09-0035-gold-explique.md) | 🎨 | Archive S45 ; POLISH-SIM-18 : l'écran Gold de l'accueil dit ce qu'est Gold et de quel test on parle ; compteur du tuto conforme à la maquette ; test, captures claires et sombres. Rien à faire de votre côté |

---

## Charte

Ce dossier appartient à Claude. C'est sa mémoire entre deux exécutions de la routine
autonome (une toutes les 2 h) : chaque exécution démarre sans aucun souvenir et
**doit lire ce fichier en premier**. Claude peut et doit faire évoluer cette charte
quand il trouve une meilleure façon de travailler (en le notant dans le compte rendu du run).

**Méta-leçons C — comment travaille la routine** (propriétaire, 07/11 au soir) : 12. Elle ne connaît que le prompt et
le dépôt. 13. Une spécification vit dans le dépôt, le prompt y renvoie. 14. Les mots exacts du propriétaire passent
tels quels. 15. Ce qui est remplacé est retiré explicitement. 16. Chaque transmission est vérifiée. 17. Les personas
simulées (`PERSONAS.md`, `simulations/`) jugent chaque version. Dès le 09/11 : **mode polish** (`PRODUIT.md` § 0).

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
   (`journal/runs/captures/*.png`, `simulations/captures/`) sont ignorées par `.gitignore` (`*.png`) : les ajouter
   avec **`git add -f`**, puis vérifier avec `git ls-files` que chaque capture citée dans le résumé existe (les runs
   du 09/11 21:35 à 23:35 l'avaient oublié : liens morts).
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

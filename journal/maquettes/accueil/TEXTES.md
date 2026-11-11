# Nouvel accueil Halcya — textes de la maquette v3 (verbatim)

Source : artifact claude.ai « Nouvel accueil Halcya » (slug D83X3qWWhqU1NofwnihmDZ, version `1794156907-8eb9`, « Version 3 (08/11 vers 18:15) »). Copie locale : `maquette-v3.html` (+ `tour/*.jpg`). Captures : `android-samsung-watch-NN-*.png`, `iphone-seul-NN-*.png`.
Les espaces fines/insécables avant `? : ! ; »` sont ajoutées au rendu (fonction `nb`). `{hub}` = « Health Connect » (Android) ou « Santé » (iPhone).

Ordre : `tuto` (3 cartes) → `goal` → `sources` → `found` → `face` → `first` → `premium` → `tour`. Compteur en haut : barre + `01/07`…`07/07` (le tour n'a pas de compteur). Bouton retour « ‹ » (aria « Retour ») dès l'écran 2 (et entre cartes du tuto). Barre d'état simulée : `9:41` + `Android`/`iPhone`.

## 01 Découvrir (tuto, 3 cartes, points de pagination)

Cartes 1 et 2 : lien « Passer » en haut à droite (→ écran Objectif seulement), bouton « Suivant ».

| Carte | Titre | Sous-titre | Illustration |
|---|---|---|---|
| 1 | Bienvenue dans Halcya | Vos repas, votre sommeil, votre montre et votre ressenti, au même endroit. | pastilles « repas », « sommeil », « montre », « ressenti » → carte « vos journées » avec courbe |
| 2 | Halcya cherche ce qui va avec vos bons et mauvais jours | Trois usages : (« Trois onglets » retiré le 11/11, POLISH-SIM-38 : la barre en a cinq) | 3 lignes : **Journal** — voir vos journées, vos repas, vos mesures · **Analyses** — les liens que Halcya trouve dans vos données · **Agir** — vérifier une piste par un essai (« de deux semaines » retiré le 11/11, POLISH-SIM-43 : une réintroduction dure 3 jours) |
| 3 | Vos données restent sur votre téléphone | Elles n’en sortent que dans ces cas : | (pas d'illustration, liste ci-dessous ; pas de « Passer ») |

Carte 3, liste :
- **QUAND VOUS LE DEMANDEZ**
  - **Analyser un repas ou une photo de selles** — La photo ou le texte est lu par une IA de Google, en Europe. Halcya n’en garde rien.
  - **Exporter vos données, partager le rapport pour votre médecin** — Le fichier part là où vous l’envoyez.
  - **Envoyer votre avis** — Le texte que vous écrivez et la version de l’app.
- **SI VOUS L’ACTIVEZ**
  - **Météo** — Votre position, à quelques kilomètres près.
  - **Sauvegarde du téléphone** — Une copie chiffrée, comme pour vos autres apps.
- Petit texte : « La lecture du visage se fait sur le téléphone : aucune image n’en sort. Pour l’abonnement, seul un numéro anonyme est vérifié. Halcya ne pose pas de diagnostic. En continuant, vous confirmez avoir 18 ans ou plus. »
- Bouton : « Commencer »

(Illustration carte 3 si affichée : cadenas dans téléphone, nuage « IA » + « seulement si vous le demandez » — définie dans le code mais non rendue en v3 car la carte 3 a sa propre mise en page.)

## 02 Objectif (choix multiple, cases à cocher)

- Titre : « Qu’est-ce qui vous amène ? »
- Sous-titre : « Cochez tout ce qui compte pour vous. Halcya vous le montrera d’abord. »
- Options (titre — aide) [persona] :
  - Ma digestion — ballonnements, SII, inconforts [Ventre et données ; Ventre, sans technique]
  - Mon cycle — règles, douleurs, endométriose [Endométriose (et ventre)]
  - Mon stress et mon sommeil — fatigue, nuits, charge mentale [Stressé et pressé]
  - Mon sport et ma récupération — entraînements, cœur, repos [Sportif]
  - Prendre soin de moi — alimentation, poids, forme [Prendre soin de soi, maigrir]
  - Tout mesurer — toutes mes montres et mesures au même endroit [Tout mesurer]
- Bouton « Continuer » (jamais grisé) ; petit texte « Vous pourrez le changer dans Paramètres. » (11/11, POLISH-SIM-44 : « … dans Réglages › Paramètres (roue en haut à droite). »)
- Règle : « Ma digestion » ou « Mon cycle » coché ⇒ question ventre à l'écran 06 + étapes digestion dans la visite.

## 03 Sources

- Titre : « Branchez vos sources » — Sous-titre : « Chaque accès se donne ici, d’un geste, et se retire quand vous voulez. »
- Carte principale (bordure verte) : **{hub}** — Android : « votre téléphone, vos montres, bagues et balances » ; iPhone : « votre iPhone et votre montre ». Texte : « Halcya lit vos pas, votre sommeil, ce que vos appareils mesurent et vos 30 derniers jours. Elle n’écrit rien et n’envoie rien. Vous choisissez type par type. » Bouton « Connecter {hub} » ; après refus : bouton « Réessayer » + « Sans cet accès, Halcya vivra de vos notes et de votre visage. Vous pourrez le donner plus tard dans Sources. » ; après accord : pastille « connecté » (bouton disparu).
- Carte Huawei (seulement config Huawei ; fond rose) : **Montre Huawei trouvée** — « Huawei Santé est installée sur ce téléphone ». « Huawei ne partage pas avec Health Connect : Halcya peut lire votre montre directement, en Bluetooth, sans la retirer de Huawei Santé. » Bouton « Relier ma montre » → pastille « reliée ».
- **Météo** — « votre ville, à quelques kilomètres près » [interrupteur, éteint par défaut]
- **Temps d’écran** — Android : « le temps passé sur le téléphone, le soir surtout » ; iPhone : « iOS 26.4 ou plus récent » [interrupteur, éteint]
- Bouton « Continuer » (toujours actif) ; petit texte « D’autres sources se trouvent dans l’onglet Sources. »

Fenêtres système simulées (étiquette « écran du système, simulé ») :
- Android : « Autoriser Halcya à lire les données de Health Connect ? » — Tout autoriser ●, Pas, Sommeil, Fréquence cardiaque, FC au repos, Variabilité cardiaque, Température, Oxygène du sang, Poids, Tension, Cycle menstruel, Exercices, Données de plus de 30 jours (✓) — [Annuler] [Autoriser]
- iPhone : « « Halcya » souhaite accéder à vos données de santé » — Activer toutes les catégories ›, même liste (●, sans « Données de plus de 30 jours ») — [Ne pas autoriser] [Autoriser]
- Huawei : « Huawei Watch GT 6 trouvée » — « Gardez la montre près du téléphone. Elle reste reliée à Huawei Santé. » — [Annuler] [Relier]

## 04 Ce qui arrive (found)

Si rien n'est connecté (ni {hub} accordé, ni Huawei reliée) :
- Titre « Votre téléphone suffit pour commencer » — « Sans {hub}, Halcya part de vos notes, de vos repas et, si vous l’activez, de votre visage. »
- Ligne : **Ce que vous noterez** — bien-être, digestion, repas en photo
- Boutons : « Connecter {hub} » (secondaire, retour) / « Continuer sans »

Sinon :
- Titre « Voici ce que Halcya recevra »
- Lignes appareils (icône + nom + « par … »)
- Groupes colorés : ACTIVITÉ (lilas : Pas) · SOMMEIL (bleu nuit : Durée du sommeil, Phases du sommeil) · CORPS (rose : Fréquence cardiaque, FC au repos, VFC, Température, Oxygène du sang, Poids, Tension, Cycle)
- Chaque mesure : nom + statut `reçu` / `en partie` / `à vérifier` (fond de la couleur) ou `pas partagée` (fond blanc, bordure pointillée, nom grisé). La raison (1 ligne) s'affiche sous la mesure sauf si statut `reçu`. Mesures « pas mesuré » : retirées de la liste et résumées : « Pas mesuré par vos appareils : {liste en minuscules}. »
- Tuiles (max 4) : `7 840` pas par jour (toujours) · `6 h 52` de sommeil par nuit (si sommeil reçu/en partie ; « , estimé » si en partie) · `58 bpm` FC au repos (si reçu) · `41 ms` VFC la nuit (si reçu) · `68,4 kg` dernier poids (si poids reçu/en partie)
- Petit texte : « Vos 30 derniers jours sont importés. Halcya les comparera à votre digestion et à votre bien-être. » — Bouton « Continuer »

### Exemples rendus

**Samsung + Galaxy Watch** (Android, Health Connect accordé) — appareil : Galaxy Watch 7 / par Samsung Health.
ACTIVITÉ : Pas reçu. SOMMEIL : Durée reçu ; Phases reçu. CORPS : Fréquence cardiaque reçu ; FC au repos *pas partagée* — Samsung ne la partage pas avec Health Connect ; VFC *pas partagée* — votre montre la mesure, Samsung ne la partage avec aucune app ; Température *pas partagée* — réservée aux partenaires de Samsung ; Oxygène du sang reçu ; Tension *pas partagée* — réservée aux partenaires de Samsung ; Cycle à vérifier — à vérifier sur un vrai téléphone. « Pas mesuré par vos appareils : poids. » Tuiles : 7 840 pas par jour · 6 h 52 de sommeil par nuit.

**iPhone seul** (Santé accordé) — appareil : Cet iPhone / pas et heures de coucher, par Santé.
Pas reçu ; Durée du sommeil en partie — les heures de coucher réglées sur l’iPhone ; Cycle en partie — si vous le notez dans Santé. « Pas mesuré par vos appareils : phases du sommeil, fréquence cardiaque, fc au repos, vfc, température, oxygène du sang, poids, tension. » Tuiles : 7 840 pas par jour · 6 h 52 de sommeil par nuit, estimé.

**Android + Garmin** — appareil : Garmin Forerunner 265 / par Garmin Connect.
Pas, Durée, Phases, Fréquence cardiaque, FC au repos : reçu ; VFC *pas partagée* — votre montre la mesure, Garmin ne la partage pas avec Health Connect ; Température *pas partagée* — Garmin ne la partage pas ; Oxygène du sang *pas partagée* — Garmin ne la partage pas ; Poids en partie — balance Garmin Index : oui ; Cycle à vérifier — à vérifier. « Pas mesuré par vos appareils : tension. » Tuiles : 7 840 · 6 h 52 · 58 bpm FC au repos.

**Android + Huawei**, montre reliée — appareil : Huawei Watch GT 6 / reliée directement en Bluetooth (affiché seulement si reliée).
Pas reçu ; Durée du sommeil en partie — sommeil détaillé : en cours chez Halcya ; Phases en partie — en cours chez Halcya ; Fréquence cardiaque reçu ; FC au repos, VFC, Température, Oxygène du sang : en partie — en cours chez Halcya ; Cycle à vérifier — à vérifier. « Pas mesuré par vos appareils : poids, tension. » Tuiles : 7 840 · 6 h 52 de sommeil par nuit, estimé.
Huawei **non reliée** (Health Connect seul) : aucune ligne appareil ; seulement Pas reçu + Durée du sommeil en partie (raison « sommeil détaillé : en cours chez Halcya » ; repli prévu dans le code si pas de raison : « estimé par le téléphone ; la montre donnera plus ») ; tuiles 7 840 · 6 h 52 …, estimé.

## 05 Visage

- Titre « Votre bien-être, sans rien noter »
- « Quand vous regardez votre téléphone, Halcya peut lire votre expression quelques secondes et en tirer une estimation de votre bien-être. »
- Carte modes : Android : **À chaque déverrouillage** (24 points, encadré = recommandé) « une vingtaine de lectures par jour » + **Quand vous ouvrez Halcya** (4 points) « quelques lectures par jour ». iPhone : seulement « Quand vous ouvrez Halcya » (recommandé, pleine largeur).
- Divulgation :
  - Ce qui est lu — l’expression du visage, par la caméra avant
  - Ce qui est gardé — l’image est effacée aussitôt, seul le score de la lecture reste
  - Où — sur ce téléphone, et dans sa sauvegarde si elle est activée
  - Ce que c’est — une estimation de votre bien-être par un modèle, pas un avis médical
  - Comment l’arrêter — à tout moment, dans [Paramètres] (lien) (11/11, POLISH-SIM-44 : « Réglages › Paramètres »)
- Boutons « Activer » (principal) / « Plus tard » (secondaire)
- Android seulement : « Android vous demandera ensuite les notifications : pendant la lecture, Halcya affiche la sienne. »
- Fenêtres simulées : « Autoriser Halcya à utiliser la caméra ? » [Refuser] [Autoriser] ; puis Android : « écran du système, simulé (Android 13 et plus) » « Autoriser Halcya à vous envoyer des notifications ? » « Annoncé sur l’écran précédent, sous les boutons. » [Ne pas autoriser] [Autoriser].

## 06 Premier geste

- Titre « Comment vous sentez-vous maintenant ? »
- « Votre première note. Les premiers jours, elle sert aussi à régler l’estimation du visage sur vous. »
- 5 visages : Mal · Bof · Neutre · Bien · Très bien
- Si digestion ou cycle coché : « Et votre ventre ? » — Calme · Gêné · Douloureux
- Bouton « Enregistrer » (grisé tant que pas de réponse(s))

## 07 Gold / abonnement

- Android : titre « Gold est offert pendant le test » — « Toutes les analyses, sans rien payer, jusqu’au 2 décembre inclus. Aucune carte bancaire n’est demandée. » — carte **Gold** « 20 analyses par jour, rapport pour votre médecin » + pastille « offert » — bouton « Continuer ».
- iPhone : titre « Silver et Gold » — « L’écran d’abonnement actuel de l’iPhone, inchangé : les formules, l’essai, puis « Plus tard ». » — encart « Ici, l’écran d’achat actuel, tel qu’il est dans la build 905. » — bouton « Plus tard ».

## 08 Visite guidée (tour)

Plein écran sur de vraies captures v913 (412×915). Phase « maintenant » = capture vide `e-*.jpg` ; phase « plus tard » = capture remplie `d-*.jpg` qui se dévoile de haut en bas (1,2 s), badge noir en haut « EXEMPLE · DONNÉES FICTIVES », pastille « jour 1 → jour 14 » (verte) ou « jour 28 » (pêche) qui compte. Zone surlignée (`spot`, contour menthe, reste assombri) ; bulle blanche au-dessus ou en dessous. Boutons bulle : « Passer la visite » (sauf dernière étape) + bouton principal. Variables : `hc` = {hub} accordé ou Huawei reliée ; `face on` = visage activé ; `gut` = Ma digestion ou Mon cycle coché. Boîte = [gauche, haut, largeur, hauteur] en % de l'écran.

| # | Écran (onglet) | Image | Zone surlignée | Jour | Titre | Texte | Bouton |
|---|---|---|---|---|---|---|---|
| 1 | Aujourd’hui | e-today | [3.4,12.4,93.2,53] boutons d'ajout + carte bien-être + carte digestion | – | Votre écran Aujourd’hui | hc : « Vos 30 derniers jours arrivent. Le reste se remplit au fil des jours. » / sinon : « Pour l’instant, il attend vos premières notes. » | Voir dans 14 jours |
| 2 | Aujourd’hui | d-today | [3.6,22.4,92.8,24.8] carte « Bien-être aujourd’hui 3,1/5 » | 14 | Votre bien-être du jour | face on : « Lu par la caméra quand vous regardez votre téléphone, et par vos notes. » / sinon : « D’après vos notes. Avec la lecture du visage, il se remplit tout seul. » | Suivant |
| 3 | Aujourd’hui | d-today | [3.6,48.2,92.8,31.8] « Vos données du jour » | 14 | Vos mesures du jour | hc : « Ce que vos appareils envoient, comparé à vos habitudes. » / sinon : « Avec Health Connect ou une montre, vos nuits et vos pas s’affichent ici. » | Suivant |
| 4 | Journal | e-journal | [3.4,13.4,93.2,31] « Vos derniers jours » vide | – | Le Journal | Chacune de vos journées sera gardée ici. | Voir dans 14 jours |
| 5 | Journal | d-journal | [3.6,30,92.8,33.6] carte « Hier » | 14 | Une journée d’un coup d’œil | Sommeil, pas, cœur, repas et notes au même endroit. | Suivant |
| 6 | Analyses › Bien-être | e-reco | [3.6,19.8,92.8,26.6] carte « Encore 14 jours… » | – | Les analyses | Elles démarrent après 14 jours notés. | Voir au jour 14 |
| 7 | Analyses › Bien-être | d-reco | [3.6,22.4,92.8,15.8] « Pistes à tester » | 14 | Au jour 14 : vos premières pistes | Ce qui va avec vos bons et vos mauvais jours. Des pistes, pas des causes. | Suivant |
| 8 | Analyses › Bien-être | d-reco | [3.6,39.8,92.8,53] « Ce qui va avec votre bien-être » | 14 | Le détail de chaque piste | De combien chaque facteur joue sur votre bien-être, en points sur 5. | Suivant |
| 9* | Analyses › Digestion | e-ventre | [3.6,19.8,92.8,32.2] carte « Encore 28 jours… » | – | Votre digestion | Ses analyses demandent 28 jours notés, dont 5 avec une gêne. | Voir au jour 28 |
| 10* | Analyses › Digestion | d-ventre | [3.6,29.5,92.8,63.5] « Ce qui va avec votre confort digestif » | 28 | Au jour 28 : ce qui va avec votre ventre | Repas, sommeil, écran : ce qui va avec vos jours calmes et vos jours de gêne. | Suivant |
| 11 | Agir | e-agir | [3.6,16.4,92.8,17.6] « Rien en cours pour l’instant » | – | Agir | Ici, vous vérifierez une piste par vous-même. | Voir au jour 14 |
| 12 | Agir | d-agir | [3.6,19.4,92.8,10.2] carte « Tester : sommeil » | 14 | Vérifier par un essai | Halcya vous propose deux semaines d’essai, puis compare avant et après. | Revenir à mes données |
| 13 | Aujourd’hui | e-today | [1,93.4,19,6.4] onglet « Aujourd’hui » de la barre du bas | – | À vous | Pour revoir cette visite : « Voir un exemple », en bas des écrans encore vides. | Terminer |

\* étapes 9–10 seulement si « Ma digestion » ou « Mon cycle » coché (13 étapes sinon 11). « Terminer » / « Passer la visite » ramènent au début de la maquette (dans l'app : arrivée sur Aujourd’hui).

Données fictives visibles sur les captures « plus tard » (v913, données démo du dépôt ; identiques quel que soit le matériel) :
- **d-today** : « Dimanche 8 novembre » ; raccourcis Repas, Bien-être, Digestion, Selles, « + 1 cigarette » ; « Bien-être aujourd’hui 3,1/5 D’après 4 lectures du visage » + courbe 4 points ; « Vos données du jour » : Sommeil · cette nuit 7 h 10 (d’habitude 7 h 34) ; VFC nuit · hier 51 ms ; Pas · hier 8 585 ; « D’après votre montre. » ; « Vos analyses digestives sont prêtes › » ; bouton « Noter ma digestion ».
- **d-journal** : onglets Jours / Repas / Nutrition / Tendances ; « Vos derniers jours » ; Aujourd’hui 8 novembre : Sommeil 7 h 10 ; Hier 7 novembre : Sommeil 8 h 21, Pas 8 585 (↑ d’habitude 6 328), FC au repos 60 bpm, VFC nuit 51 ms, VFC jour 40 ms, Respiration 14 /min, Température 36,6 °C, Temp. peau 33,7 °C, Stress 37, normal, FC 68 à 82 bpm, Dépense 2 285 kcal, Repas ≈ 479 kcal, Écran 3 h 56, Météo 11° / 1° ; 21:30 Bien-être 3,4 / 5 ; Cigarettes 3 (09:10, 11:11, 13:12) ; 12:15 Repas ≈ 479 kcal : Poulet, cuisse 150 g, Pomme de terre 200 g, Haricot vert 120 g.
- **d-reco** (Analyses › Bien-être) : « Votre bien-être » ; Pistes à tester : **Sommeil** « +0,4 point sur 5 pour 40 min de sommeil de plus (court terme) » « Essayer dans Agir » ; « Ce qui va avec votre bien-être » — Court terme (le jour même et la veille) : Sommeil pour 40 min de sommeil de plus +0,4 pt ; Pas pour 1 500 pas de plus +0,2 pt ; Activité pour 150 kcal d’activité de plus +0,2 pt ; Lipides pour 10 g de lipides de plus +0,2 pt ; Temps d’écran pour 30 min d’écran de plus −0,1 pt ; Moyen terme (de 2 à 6 jours avant) : Lactose pour 1 repas riche en lactose de plus −0,3 pt ; Sommeil pour 20 min de sommeil de plus −0,1 pt.
- **d-ventre** (Analyses › Digestion) : « Votre confort digestif » ; Pistes à tester : « Aucun lien assez net pour l’instant sur ce que vous pouvez changer. » ; Court terme : Lactose −0,5 pt ; Lipides +0,2 pt ; Temps d’écran −0,1 pt ; Sucres (pour 10 g de sucres de plus) −0,1 pt ; Calories mangées (pour 250 kcal) +0,1 pt ; Moyen terme : Lactose +0,4 pt ; Calories mangées (pour 100 kcal) −0,1 pt ; Écran tard le soir (pour 5 min) −0,1 pt ; Lipides −0,1 pt.
- **d-agir** : « Agir » ; « Proposés par vos analyses » ; **Tester : sommeil** « Lien repéré avec votre bien-être, court terme. » [Commencer] ; « Tous vos essais, vérifiés ou non, figurent dans votre rapport médecin. »

Captures « maintenant » (états vides v913) :
- **e-today** : raccourcis Repas, Bien-être, Digestion, Selles, « Autre chose » ; « Bien-être aujourd’hui — Notez votre bien-être en haut, ou laissez la caméra lire votre visage : à activer dans Sources. » ; « Encore 28 jours notés avant vos analyses digestives — Halcya cherchera quels facteurs sont statistiquement liés à votre confort digestif. 0/28 jours avec une note digestive » [Noter ma digestion] ; « Mes repas du jour — Aucun repas aujourd’hui » [Photographier un repas].
- **e-journal** : « Rien de noté pour l’instant — Vos jours s’afficheront ici, en couleur. » [Photographier un repas] [Noter votre digestion] [+ Ajouter une source].
- **e-reco** : « Encore 14 jours notés avant vos premiers résultats — Notez votre bien-être chaque jour : Halcya cherchera ensuite quels facteurs sont statistiquement liés à votre bien-être. 0/14 jours » [Noter maintenant] ; « Comment c’est calculé ».
- **e-ventre** : « Encore 28 jours notés avant vos premiers résultats — Notez votre digestion chaque jour : Halcya cherchera ensuite quels facteurs sont statistiquement liés à votre confort digestif. 0/28 jours. Il faut aussi 5 jours avec une gêne ou une douleur notée : vous en avez 0. » [Noter maintenant] ; « Comment c’est calculé ».
- **e-agir** : « Rien en cours pour l’instant — Quand vos analyses repèrent une piste, vous pourrez l’essayer ici quelques jours pour voir si elle compte pour vous. » « Où en sont vos analyses » ; « Tous vos essais, vérifiés ou non, figurent dans votre rapport médecin. »
- Barre du bas : Aujourd’hui · Journal · Analyses · Agir · Sources.

## Notes par écran (panneau droit ; « Pourquoi » / « Dans v906 » / « Comment l’app le sait »)

**Découvrir** — Pourquoi : Le tutoriel que vous demandez : ce que fait l’app, ses trois onglets et la confidentialité, en trois cartes à faire glisser. · Carte 3 refaite (votre retour) : les données restent sur le téléphone, puis la liste complète des cas où elles en sortent, et quand l’IA sert. Tirée du code de v913 : relais (repas, selles, avis, abonnement), météo, export, sauvegarde. · « Passer » mène seulement à l’objectif. Dans v906, « Passer » termine tout l’accueil d’un coup, autorisations comprises. — v906 : v906 entre directement sur « Qu’est-ce qui vous amène ? », avec trois tuiles chiffrées (0 Mo, 2–48 h, 1 geste) que personne ne lit au premier écran.

**Objectif** — Pourquoi : Choix multiple (votre retour) : une option par persona. Ma digestion (Ventre et données, Ventre sans technique), Mon cycle (Endométriose), Mon stress et mon sommeil (Stressé et pressé), Mon sport (Sportif), Prendre soin de moi (Prendre soin de soi, maigrir), Tout mesurer. · Les suivis en découlent et se changent dans Paramètres. « Continuer » n’est jamais grisé : sans choix, Halcya montre tout. · Mon cycle : l’app ne lit pas encore le cycle (voir D9). Ce soir, ce choix met en avant le ventre et les douleurs. — v906 : v906 pose deux questions de suite : l’objectif, puis « Que voulez-vous suivre ? » (cinq cases). La seconde disparaît (D1) : ce choix est enregistré mais l’app ne le lit nulle part.

**Sources** — Pourquoi : Un seul écran pour tous les accès. Chaque carte dit ce qui est lu juste au-dessus de son bouton : c’est la divulgation que Google demande avant chaque autorisation. · iPhone : « Sur iPhone, la carte principale est Santé. » / Android : « Sur Android, la carte principale est Health Connect. » · Huawei : « La carte Huawei n’apparaît que si l’app Huawei Santé est installée ou si une montre Huawei est déjà appairée au téléphone. » / autres : « Pas de carte Huawei : elle n’apparaît que si une montre Huawei est trouvée. » — v906 : v906 demande d’abord « Avez-vous une montre ? » (trois choix), puis un écran Health Connect, puis un écran Météo. Trois écrans deviennent un (D2). · Dans v906, « Continuer » reste grisé sur l’écran Health Connect tant qu’on n’a pas ouvert la divulgation et répondu « Pas maintenant ». Ici, on peut toujours continuer. · Choisir Huawei dans v906 ne mène à rien de précis : l’app finit sur l’onglet Sources, sans rien mettre en avant. — Comment l’app le sait : iPhone : « Santé ne dit rien avant l’autorisation ; ensuite, Halcya liste les sources et les appareils qui ont écrit des données (le nom de la montre compris). » / Android : « Avant l’autorisation, Android permet de savoir si une app connue est installée (Samsung Health, Garmin Connect, Huawei Santé, Mi Fitness, Withings, Oura…), si on la déclare. Après, Health Connect donne l’app d’origine de chaque donnée. »

**Ce qui arrive** — Pourquoi : La réponse à « qu’est-ce que Halcya va faire de ma montre ? ». Chaque mesure est rangée dans sa couleur : lilas activité, bleu nuit sommeil, rose corps. · Avec marque : « Les mesures en pointillés sont mesurées par l’appareil mais {marque} ne les partage pas. On le dit, plutôt que de laisser croire que Halcya les oublie (D4). » / sans marque : « Rien n’est caché : ce qui arrive en partie est dit, avec la raison. » · Les tuiles du bas reprennent l’ancien « Vos 30 derniers jours ». — v906 : v906 montre « Vos 30 derniers jours » (pas, sommeil…) seulement avec une montre Health Connect et l’accès donné. — Comment : Le tableau vient de journal/PERSONAS.md (15 configurations, 07/11). Dans l’app : un catalogue par appareil, croisé avec ce qui est vraiment arrivé ces 30 derniers jours.

**Visage** — Pourquoi : Textes revus (votre retour et celui de votre bêta-testeuse) : l’image est effacée aussitôt, « une estimation de votre bien-être par un modèle, pas un avis médical », « Comment l’arrêter » avec le lien vers Paramètres. La notification est annoncée sous les boutons, sur Android. · L’écran dédié que vous aviez demandé le 31/10 (P28), plus visuel : les points montrent pourquoi le déverrouillage donne une estimation plus solide. · Divulgation complète (AI Act), « Activer » en principal, « Plus tard » bien visible, rien de précoché. Sur Android, la demande de notification est annoncée ici (aujourd’hui elle arrive sans prévenir). · iPhone : « Sur iPhone, seulement à l’ouverture de l’app (à confirmer avec la routine iOS). » / Android : « Sur Android, le déverrouillage est proposé en premier. » — v906 : Même écran dans v906, mais la divulgation est une longue feuille de six paragraphes, et la demande de notification n’est pas annoncée.

**Premier geste** — Pourquoi : La première donnée : la personne a déjà quelque chose dans son journal en arrivant. · (gut) « Digestion ou cycle cochés : on demande aussi le ventre. » / sinon « Si Ma digestion ou Mon cycle est coché, on demande aussi le ventre. » — v906 : Gardé de v906 (« premier geste »).

**Gold** — Pourquoi : iPhone : « iPhone : l’écran d’abonnement actuel, inchangé (la période offerte y est finie depuis le 06/11). » / Android : « Android : un seul écran qui dit que Gold est offert jusqu’au 2 décembre, sans formule ni prix. » — v906 : v906 ouvre la page Premium complète en fin d’accueil.

**Visite guidée** — Pourquoi : Comme le tutoriel d’un jeu (votre retour) : la visite se fait dans la vraie app, sur les vrais écrans. D’abord l’écran de la personne tel qu’il est, puis le même écran qui se remplit de données fictives, avec le jour où il ressemblera à ça : 14 jours pour le bien-être, 28 pour la digestion. · Rien n’est réinventé : ce sont les vrais écrans de l’app, nourris par un jeu de données fictives gardé en mémoire, jamais écrit dans les données de la personne. · Dans l’app, les données fictives suivent son matériel : sans VFC chez elle, pas de VFC dans l’exemple. L’étape digestion n’apparaît que si Ma digestion ou Mon cycle est coché. — v906 : v906 n’a ni visite ni aperçu. La maquette précédente dessinait trois écrans inventés, dont un essai : retirés à votre demande. — Comment : Les images sont de vraies captures de l’app v913 (variante play) : écrans vides, puis données de démonstration du dépôt. Elles ne changent pas avec le matériel choisi à gauche ; seuls les textes changent. · Ensuite, « Voir un exemple » en bas des écrans encore vides relance la visite.

## Décisions (bas de page)

Retours de 17:40 appliqués : Carte 3 : la liste des cas où les données sortent du téléphone, et quand l’IA sert. · Objectif : choix multiple, une option par persona. · Visage : image effacée aussitôt ; « une estimation de votre bien-être par un modèle, pas un avis médical » ; « Comment l’arrêter » avec le lien vers Paramètres. · Aperçu inventé et page « essai » retirés : visite guidée sur la vraie app, avec des données fictives.

- D1 Supprimer l’écran « Que voulez-vous suivre ? » : les suivis découlent de l’objectif et se changent dans Paramètres.
- D2 Remplacer « Avez-vous une montre ? » par la détection : Halcya trouve elle-même vos appareils après l’accès à Health Connect ou Santé. Météo et temps d’écran rejoignent le même écran.
- D3 Remplacé par votre retour : visite guidée sur la vraie app avec des données fictives (14 jours pour le bien-être, 28 pour la digestion), relancée par « Voir un exemple » sur les écrans vides. Elle passe en dernier ce soir : si elle n’est pas sûre à 22:30, elle part demain.
- D4 Montrer honnêtement ce que l’appareil mesure mais ne partage pas (VFC de Samsung, Garmin, Xiaomi, Oura), avec la raison en une ligne.
- D5 Le rappel du soir (noter sa digestion) : le proposer pendant l’accueil, ou seulement plus tard, depuis le bloc digestion d’Aujourd’hui ?
- D6 Gold en fin d’accueil : un écran court sur Android pendant le test ; sur iPhone, l’écran d’abonnement actuel. Ou rien du tout pendant le test ?
- D7 Ce soir : livrer tout l’accueil d’un coup avant minuit (une session dédiée, comme le chantier du 07/11), ou d’abord les écrans 01 à 04 et l’aperçu demain ?
- D9 Mon cycle : l’app ne lit pas encore le cycle. Ce soir, ce choix met en avant le ventre et les douleurs. Lire le cycle depuis Health Connect ou Santé demande une autorisation de plus et une déclaration à Google : plus tard, sur proposition ?
- D8 Un seul calendrier partout : premières pistes au jour 14, analyses de la digestion au jour 28. Aujourd’hui, l’accueil et l’abonnement disent « vers 21 jours », Aujourd’hui dit 28 et Analyses dit 14.

Défauts de v906 listés : « Que voulez-vous suivre ? » enregistre un choix que l’app ne lit nulle part · « Continuer » grisé sur Health Connect tant qu’on n’a pas ouvert la divulgation et répondu « Pas maintenant » · « Passer » termine tout l’accueil, autorisations et abonnement compris · Activer le visage demande aussi les notifications sans l’annoncer · Choisir Huawei ne mène à rien de précis · Trois délais différents (21 / 28 / 14 jours) · Sans Health Connect, l’écran Health Connect s’affiche quand même, juste pour s’excuser · Sur l’écran Gold, la croix et « Continuer gratuitement » font la même chose · Le code partagé ne dit jamais « Santé » (à vérifier avec la routine iOS).
Comparaison : v906 = 9 écrans (Qu’est-ce qui vous amène ? · Que voulez-vous suivre ? · Avez-vous une montre ? · Health Connect · Vos 30 derniers jours (si accès) · Météo · Lecture du visage · Premier geste · Premium). Proposition (texte de la page, pas mis à jour pour v3) : Découvrir · Objectif · Sources · Voici ce que Halcya recevra · Visage · Premier geste · Aperçu avec données fictives · Gold — « 8 écrans, toujours le même nombre : le compteur ne change plus en route. »

## Catalogue des 15 configurations (source : `CFG` dans la maquette, d'après journal/PERSONAS.md du 07/11)

| # | Configuration | OS | Exemples | Part | Pas | Durée du sommeil | Phases du sommeil | Fréquence cardiaque | FC au repos | VFC | Température | Oxygène du sang | Poids | Tension | Cycle |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Android seul | android | Samsung, Xiaomi, Honor, Pixel | 33 % | y | p | n | n | n | n | n | n | n | n | n |
| 2 | iPhone seul | ios | iPhone 12 à 17 | 23 % | y | p | n | n | n | n | n | n | n | n | p |
| 3 | iPhone + Apple Watch | ios | Watch SE 3, Series 10 à 12, Ultra | 11 % | y | y | y | y | y | y | p | y | n | n | p |
| 4 | Samsung + Galaxy Watch | android | Galaxy Watch 7 et 8, Watch FE, Fit3 | 8 % | y | y | y | y | x | x | x | y | n | x | q |
| 5 | Téléphone + balance ou tensiomètre | android | Withings, Xiaomi, Renpho, Omron | 4 % | y | p | n | n | n | n | n | n | p | p | n |
| 6 | Android + Xiaomi | android | Smart Band 9 et 10, Redmi Watch 5 | 4 % | y | y | y | p | x | x | n | x | n | n | q |
| 7 | Android + Huawei | android | Watch GT 5 et 6, Watch Fit 4, Band 10 | 2,5 % | y | p | p | y | p | p | p | p | n | n | q |
| 8 | Android + Garmin | android | Forerunner, Venu, vivoactive | 2,5 % | y | y | y | y | y | x | x | x | p | n | q |
| 9 | iPhone + Garmin | ios | coureurs, cyclistes | 2,5 % | y | y | p | y | y | x | x | x | n | n | q |
| 10 | iPhone + bracelet d’une autre marque | ios | Fitbit, Xiaomi, Huawei, Amazfit | 2,5 % | y | p | p | p | p | x | x | x | n | n | n |
| 11 | iPhone + Apple Watch + Withings | ios | balance Body, tensiomètre BPM | 2 % | y | y | y | y | y | y | p | y | p | p | p |
| 12 | Android + autre montre | android | Amazfit, Honor, Polar, Coros | 2 % | y | p | p | p | p | x | x | p | n | n | n |
| 13 | Android + Fitbit ou Pixel Watch | android | Charge 6, Inspire 3, Pixel Watch 3 et 4 | 1 % | y | y | y | y | y | q | q | x | n | n | q |
| 14 | iPhone + Oura | ios | ± Apple Watch, ± Natural Cycles | 1 % | y | y | y | y | x | x | x | x | n | n | p |
| 15 | Niche « tout mesurer » | android | Whoop, Ultrahuman, Galaxy Ring | 1 % | y | y | y | y | p | p | p | p | n | n | n |

Légende : y = reçu · p = en partie · x = mesuré mais pas partagé (affiché « pas partagée », carte en pointillés) · q = à vérifier · n = pas mesuré (absent de la liste, repris dans « Pas mesuré par vos appareils : … »).

### Détail par configuration (appareils affichés, raisons en une ligne)

**1. Android seul** (Android · Samsung, Xiaomi, Honor, Pixel · 33 %)
- Appareils : « Ce téléphone » / « pas et sommeil estimé, par Samsung Health ou Google Fit » (icône phone)
- Pas : reçu
- Durée du sommeil : en partie — « estimé d’après l’usage du téléphone »
- « Pas mesuré par vos appareils : phases du sommeil, fréquence cardiaque, fc au repos, vfc, température, oxygène du sang, poids, tension, cycle. »

**2. iPhone seul** (iPhone · iPhone 12 à 17 · 23 %)
- Appareils : « Cet iPhone » / « pas et heures de coucher, par Santé » (icône phone)
- Pas : reçu
- Durée du sommeil : en partie — « les heures de coucher réglées sur l’iPhone »
- Cycle : en partie — « si vous le notez dans Santé »
- « Pas mesuré par vos appareils : phases du sommeil, fréquence cardiaque, fc au repos, vfc, température, oxygène du sang, poids, tension. »

**3. iPhone + Apple Watch** (iPhone · Watch SE 3, Series 10 à 12, Ultra · 11 %)
- Appareils : « Apple Watch Series 10 » / « par Santé » (icône watch) ; « Cet iPhone » / « pas, par Santé » (icône phone)
- Pas : reçu
- Durée du sommeil : reçu
- Phases du sommeil : reçu
- Fréquence cardiaque : reçu
- FC au repos : reçu
- VFC : reçu
- Température : en partie — « la nuit, au poignet (Series 8 et suivantes) »
- Oxygène du sang : reçu
- Cycle : en partie — « noté par vous, ou estimé par la température »
- « Pas mesuré par vos appareils : poids, tension. »

**4. Samsung + Galaxy Watch** (Android · Galaxy Watch 7 et 8, Watch FE, Fit3 · 8 %) — marque citée dans la note : Samsung
- Appareils : « Galaxy Watch 7 » / « par Samsung Health » (icône watch)
- Pas : reçu
- Durée du sommeil : reçu
- Phases du sommeil : reçu
- Fréquence cardiaque : reçu
- FC au repos : pas partagée — « Samsung ne la partage pas avec Health Connect »
- VFC : pas partagée — « votre montre la mesure, Samsung ne la partage avec aucune app »
- Température : pas partagée — « réservée aux partenaires de Samsung »
- Oxygène du sang : reçu
- Tension : pas partagée — « réservée aux partenaires de Samsung »
- Cycle : à vérifier — « à vérifier sur un vrai téléphone »
- « Pas mesuré par vos appareils : poids. »

**5. Téléphone + balance ou tensiomètre** (Android · Withings, Xiaomi, Renpho, Omron · 4 %)
- Appareils : « Balance Withings Body » / « par l’app Withings » (icône scale) ; « Ce téléphone » / « pas, par Samsung Health » (icône phone)
- Pas : reçu
- Durée du sommeil : en partie — « estimé d’après l’usage du téléphone »
- Poids : en partie — « Withings demande Withings+ pour les comptes créés depuis le 12/10 »
- Tension : en partie — « Omron : oui ; Withings : Withings+ »
- « Pas mesuré par vos appareils : phases du sommeil, fréquence cardiaque, fc au repos, vfc, température, oxygène du sang, cycle. »

**6. Android + Xiaomi** (Android · Smart Band 9 et 10, Redmi Watch 5 · 4 %) — marque citée dans la note : Xiaomi
- Appareils : « Xiaomi Smart Band 9 » / « par Mi Fitness » (icône band)
- Pas : reçu
- Durée du sommeil : reçu
- Phases du sommeil : reçu
- Fréquence cardiaque : en partie — « seulement pendant l’effort »
- FC au repos : pas partagée — « Xiaomi ne la partage pas »
- VFC : pas partagée — « votre bracelet la mesure, Xiaomi ne la partage avec aucune app »
- Oxygène du sang : pas partagée — « mesurée, jamais partagée par Xiaomi »
- Cycle : à vérifier — « à vérifier »
- « Pas mesuré par vos appareils : température, poids, tension. »

**7. Android + Huawei** (Android · Watch GT 5 et 6, Watch Fit 4, Band 10 · 2,5 %) — carte Huawei (lien Bluetooth direct)
- Appareils : « Huawei Watch GT 6 » / « reliée directement en Bluetooth » (icône watch)
- Pas : reçu
- Durée du sommeil : en partie — « sommeil détaillé : en cours chez Halcya »
- Phases du sommeil : en partie — « en cours chez Halcya »
- Fréquence cardiaque : reçu
- FC au repos : en partie — « en cours chez Halcya »
- VFC : en partie — « en cours chez Halcya »
- Température : en partie — « en cours chez Halcya »
- Oxygène du sang : en partie — « en cours chez Halcya »
- Cycle : à vérifier — « à vérifier »
- « Pas mesuré par vos appareils : poids, tension. »

**8. Android + Garmin** (Android · Forerunner, Venu, vivoactive · 2,5 %) — marque citée dans la note : Garmin
- Appareils : « Garmin Forerunner 265 » / « par Garmin Connect » (icône watch)
- Pas : reçu
- Durée du sommeil : reçu
- Phases du sommeil : reçu
- Fréquence cardiaque : reçu
- FC au repos : reçu
- VFC : pas partagée — « votre montre la mesure, Garmin ne la partage pas avec Health Connect »
- Température : pas partagée — « Garmin ne la partage pas »
- Oxygène du sang : pas partagée — « Garmin ne la partage pas »
- Poids : en partie — « balance Garmin Index : oui »
- Cycle : à vérifier — « à vérifier »
- « Pas mesuré par vos appareils : tension. »

**9. iPhone + Garmin** (iPhone · coureurs, cyclistes · 2,5 %) — marque citée dans la note : Garmin
- Appareils : « Garmin Venu 3 » / « par Garmin Connect et Santé » (icône watch)
- Pas : reçu
- Durée du sommeil : reçu
- Phases du sommeil : en partie — « selon le modèle »
- Fréquence cardiaque : reçu
- FC au repos : reçu
- VFC : pas partagée — « votre montre la mesure, Garmin ne la partage pas avec Santé »
- Température : pas partagée — « Garmin ne la partage pas »
- Oxygène du sang : pas partagée — « Garmin ne la partage pas »
- Cycle : à vérifier — « à vérifier »
- « Pas mesuré par vos appareils : poids, tension. »

**10. iPhone + bracelet d’une autre marque** (iPhone · Fitbit, Xiaomi, Huawei, Amazfit · 2,5 %) — marque citée dans la note : la marque du bracelet
- Appareils : « Fitbit Charge 6 » / « par Google Health et Santé » (icône band)
- Pas : reçu
- Durée du sommeil : en partie — « Fitbit : complet ; Huawei et Xiaomi : la durée seulement »
- Phases du sommeil : en partie — « selon la marque »
- Fréquence cardiaque : en partie — « Huawei : en partie »
- FC au repos : en partie — « selon la marque »
- VFC : pas partagée — « aucune de ces marques ne la partage avec Santé »
- Température : pas partagée — « pas partagée avec Santé »
- Oxygène du sang : pas partagée — « pas partagée avec Santé »
- « Pas mesuré par vos appareils : poids, tension, cycle. »

**11. iPhone + Apple Watch + Withings** (iPhone · balance Body, tensiomètre BPM · 2 %)
- Appareils : « Apple Watch Series 11 » / « par Santé » (icône watch) ; « Balance Withings Body » / « par Withings et Santé » (icône scale)
- Pas : reçu
- Durée du sommeil : reçu
- Phases du sommeil : reçu
- Fréquence cardiaque : reçu
- FC au repos : reçu
- VFC : reçu
- Température : en partie — « la nuit, au poignet »
- Oxygène du sang : reçu
- Poids : en partie — « Withings+ pour les comptes créés depuis le 12/10 »
- Tension : en partie — « Withings+ pour les comptes créés depuis le 12/10 »
- Cycle : en partie — « noté par vous, ou estimé par la température »

**12. Android + autre montre** (Android · Amazfit, Honor, Polar, Coros · 2 %) — marque citée dans la note : la marque de la montre
- Appareils : « Amazfit Balance » / « par Zepp » (icône watch)
- Pas : reçu
- Durée du sommeil : en partie — « Amazfit : complet ; Polar, Coros : en partie »
- Phases du sommeil : en partie
- Fréquence cardiaque : en partie
- FC au repos : en partie
- VFC : pas partagée — « pas partagée avec Health Connect »
- Température : pas partagée — « pas partagée »
- Oxygène du sang : en partie — « Amazfit : oui ; les autres : non »
- « Pas mesuré par vos appareils : poids, tension, cycle. »

**13. Android + Fitbit ou Pixel Watch** (Android · Charge 6, Inspire 3, Pixel Watch 3 et 4 · 1 %) — marque citée dans la note : Google
- Appareils : « Pixel Watch 3 » / « par Google Health » (icône watch)
- Pas : reçu
- Durée du sommeil : reçu
- Phases du sommeil : reçu
- Fréquence cardiaque : reçu
- FC au repos : reçu
- VFC : à vérifier — « à vérifier sur un vrai téléphone »
- Température : à vérifier — « à vérifier »
- Oxygène du sang : pas partagée — « Google la lit mais ne la partage pas »
- Cycle : à vérifier — « à vérifier »
- « Pas mesuré par vos appareils : poids, tension. »

**14. iPhone + Oura** (iPhone · ± Apple Watch, ± Natural Cycles · 1 %) — marque citée dans la note : Oura
- Appareils : « Bague Oura » / « par l’app Oura et Santé » (icône ring)
- Pas : reçu
- Durée du sommeil : reçu
- Phases du sommeil : reçu
- Fréquence cardiaque : reçu
- FC au repos : pas partagée — « Oura ne la partage pas avec Santé »
- VFC : pas partagée — « votre bague la mesure, Oura ne la partage pas avec Santé »
- Température : pas partagée — « Oura ne la partage pas avec Santé »
- Oxygène du sang : pas partagée — « Oura ne la partage pas avec Santé »
- Cycle : en partie — « Natural Cycles écrit le cycle dans Santé »
- « Pas mesuré par vos appareils : poids, tension. »

**15. Niche « tout mesurer »** (Android · Whoop, Ultrahuman, Galaxy Ring · 1 %)
- Appareils : « Bague Ultrahuman » / « par Health Connect » (icône ring) ; « Galaxy Ring » / « par Samsung Health » (icône ring)
- Pas : reçu
- Durée du sommeil : reçu
- Phases du sommeil : reçu
- Fréquence cardiaque : reçu
- FC au repos : en partie — « selon l’appareil »
- VFC : en partie — « Ultrahuman : oui ; Whoop : par son API seulement »
- Température : en partie — « selon l’appareil »
- Oxygène du sang : en partie — « selon l’appareil »
- « Pas mesuré par vos appareils : poids, tension, cycle. »


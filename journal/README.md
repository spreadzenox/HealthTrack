# Journal de bord de Claude — HealthTrack

## 📅 Semaine en cours — S43 (lundi 19 → dimanche 25 octobre 2026)

> Résumé tenu à jour à chaque run : **c'est ce que lit le propriétaire chaque semaine.**
> Le premier run d'une nouvelle semaine archive ce bloc dans `semaines/AAAA-Sww.md` et en ouvre un neuf.
> Semaine précédente : [`semaines/2026-S42.md`](semaines/2026-S42.md) (montre GT 6 Pro en direct, nettoyage,
> performance, puis lancement de la Lecture du visage ; v98 → v168).

**🧭 Nouveau cadre depuis vos décisions produit du 20/10 au soir : faire de HealthTrack un produit vendable sur
Google Play.** Tout est consigné dans [`PRODUIT.md`](PRODUIT.md) : décisions (bien-être, « local par défaut, IA
optionnelle et clairement signalée », toutes les montres dont Huawei en direct ; porte d'entrée SII ; abonnement
4,99 €/mois ou 29,99 €/an, « collecter est gratuit, comprendre est payant » ; variantes play / sideload ; relais
Gemini), les **10 jalons** et leur état, un **premier inventaire des écrans**, et la liste **« Actions du
propriétaire »** (micro-entreprise, compte développeur Play et ses 12 testeurs × 14 jours, projet Google Cloud et clé
Gemini payante, validation juridique, budget pub, identité visuelle). Le bien-être automatique reste un pilier
gratuit, mais n'est plus le seul chantier.

**Run du 20/10 22:30 — premier pas du chantier produit.** ① `PRODUIT.md` créé (jalon 1). ② Jalon 2 commencé :
**« humeur » devient « bien-être » dans tous les textes de l'app** — la carte de l'accueil s'appelle **« Bien-être
estimé »**, les Analyses « Avec votre bien-être estimé (visage) », la carte « Lecture du visage » et le temps d'écran
aussi. Rien ne change dans vos données ni dans les calculs. Un test automatique empêche désormais le retour du mot
« humeur », de « 100 % privé » et de termes médicaux interdits (« diagnostiquer », « prédire une crise »…) dans le
code de l'app. Ce changement a publié la **v189** (33,6 Mo) : c'est elle qui vous servira à **tester le nouveau bouton de mise à
jour** depuis la v188 (voir ci-dessous). Prochain run de code : inventaire chiffré et propositions de nettoyage
(masquer / fusionner / déplacer, navigation simplifiée), puis tokens de design.

**Run du 21/10 00:30 — la nouvelle identité visuelle arrive (étape 1 sur 3).** Ce que vous verrez dans la
**v190** (publiée, 33,7 Mo, installable avec le bouton du bandeau) : **l'app passe en clair** — fond blanc, texte encre, **vert émeraude** pour les actions, et
les polices **Figtree** (les mots) et **IBM Plex Mono** (prévue pour les chiffres), embarquées dans l'app (rien n'est
chargé depuis Internet). Le **thème sombre reste disponible** : Plus → Paramètres → **Apparence** (Clair / Sombre /
Comme le téléphone). Les icônes de la barre d'état (heure, batterie) s'accordent au thème choisi. Rien ne change dans
vos données. En coulisses : toutes les couleurs de l'app viennent maintenant d'**un seul fichier de tokens**, et deux
tests empêchent de réintroduire une couleur « en dur » ou un texte dont le contraste passerait sous 4,5:1 (clair et
sombre). Vos décisions du 20/10 au soir sur l'**infrastructure** (Google Cloud sans clé, CI sur `main`) et l'**identité
visuelle** sont consignées dans [`INFRA.md`](INFRA.md) et [`DESIGN.md`](DESIGN.md) ; la liste « Actions du
propriétaire » de [`PRODUIT.md`](PRODUIT.md) a été refaite pas à pas. Prochaines étapes : **variantes play / sideload**
(pour avoir au plus tôt un AAB à envoyer en test interne), puis l'icône « H nuit » et l'écran d'accueil de la maquette.
**👉 Votre prochaine action la plus utile** : quand Google aura validé votre compte « jpesquet », **créer l'app** dans
la Play Console (P8), et commencer à **recruter 12 à 15 testeurs** (P12, il faut leurs adresses Gmail).

**Run du 21/10 02:30 — la version Google Play existe (jalon 3a).** Dans l'app que vous utilisez, rien ne change :
c'est la variante **« sideload »** (GitHub, mise à jour en un clic), même identifiant, vos données restent. À côté
naît la variante **« play »** : identifiant **`fr.jpesquet.sante`** (neutre et définitif — Google ne permet jamais de
le changer ; le nom affiché, lui, restera modifiable), sans la permission « installer des applis » ni le bandeau de mise
à jour (sur Play, c'est le Store qui met à jour). Les deux peuvent cohabiter sur un téléphone. Un nouveau workflow
**« Play — AAB »** fabrique à chaque version le fichier `.aab` signé à envoyer sur Play. **Il sera rouge tant que vous
n'aurez pas créé la clé d'envoi**… sauf que vous l'aviez déjà créée : **le premier run est passé au vert** et a
produit l'AAB signé **versionCode 330** (artefact `HealthTrack-play-330`, 17 Mo, gardé 30 jours ; un nouveau à
chaque version). La v191 sideload (33,7 Mo) est publiée comme d'habitude.
**👉 Votre prochaine action la plus utile : dès que Google a validé votre compte, P8 (créer l'app) puis P10** —
GitHub → Actions → « Play — AAB » → dernier run vert → artefact en bas de page → dézipper → Play Console → Test
interne → importer l'`.aab` (pas à pas dans [`PRODUIT.md`](PRODUIT.md), §4). Prochain run de
code : l'icône « H nuit » et l'écran de démarrage.

**Run du 21/10 04:30 — la nouvelle icône « H nuit » (identité visuelle, étape 2 sur 3).** Ce que vous verrez dans la
**v192** (publiée, 33,7 Mo, bouton du bandeau) : sur l'écran d'accueil du téléphone, l'icône HealthTrack devient le **H blanc sur fond encre**, avec sa barre
centrale en courbe menthe et le point ambre ; elle suit les **icônes à thème** d'Android 13+ si vous les avez activées
(Fond d'écran et style → Icônes à thème). L'**écran de démarrage** passe au même fond encre avec le glyphe, et **toutes
les notifications** de l'app (Lecture du visage, note du soir, montre) portent ce H au lieu d'icônes Android génériques.
Le petit logo en haut de l'app change aussi. Rien ne change dans vos données. En coulisses : un test vérifie que le
glyphe reste dans la zone sûre des icônes rondes et carrées, et l'**icône 512 × 512 de la fiche Play** est déjà prête
(`app/store/play-icon-512.png`). Note : un lanceur garde parfois l'ancienne icône en cache après la mise à jour ; un
redémarrage du téléphone suffit. Prochain run de code : **3b** (lecture du visage conforme aux règles Play,
explications avant chaque autorisation sensible), puis l'écran Accueil de la maquette.

*Avant le 20/10 au soir :* **En bref** — **Une seule priorité, à votre demande du 18/10 au soir : que HealthTrack connaisse votre humeur et
votre bien-être sans que vous ayez rien à saisir.** L'humeur estimée ne viendra que de signaux émotionnels directs
(visage, voix, et vos notes quand vous le voulez) ; votre usage du téléphone / des réseaux sociaux et les signaux de la
montre (stress, VFC, cœur, sommeil) restent des **facteurs** que les Analyses comparent à votre humeur, jamais des
ingrédients de l'estimation. Plan et état des lieux : [`BIEN-ETRE-AUTO.md`](BIEN-ETRE-AUTO.md). **Depuis votre consigne du 19/10 au soir : une
humeur estimée s'affiche dès la première lecture, sans attendre 30 jours** ; vos notes ne font plus que l'affiner.
Tout le reste
(nettoyage, performance, autres appareils, petites finitions de la montre) est en pause sauf panne.

**🚑 Votre signalement du 20/10 19:05 — mise à jour bloquée sur « Téléchargement… » : corrigé (run 20/10 20:30).
À faire une seule fois, à la main**, car la version installée sur votre téléphone a encore l'ancien code et restera
bloquée : ① sur le Galaxy A56, ouvrez dans Chrome ou Samsung Internet
**https://github.com/spreadzenox/HealthTrack/releases/latest** ; ② sous « Assets », touchez **`HealthTrack-vNNN.apk`**
(**v188** ou plus récente, 33,6 Mo) ; ③ ouvrez le fichier téléchargé (notification ou
« Téléchargements ») ; si Android le demande, autorisez **ce navigateur** à installer des applis ; ④ touchez
**« Mettre à jour »**. Vos données sont gardées (même signature, installation par-dessus). Pour vérifier : Plus →
Nouveautés, « Version installée ». ⑤ **À la version suivante** (v189, publiée par le run du 20/10 22:30), touchez « Mettre à jour (33,6 Mo) » dans le bandeau :
vous devez voir la barre, les Mo et le temps restant, puis l'installateur. Si ça bloque encore, envoyez-moi une
capture du bandeau : il dit maintenant pourquoi. (La Lecture du visage s'arrête à chaque mise à jour : touchez
« Reprendre » dans la notification.)

**Run du 19/10 00:30 — les lectures du visage sont rangées dans votre historique.** Jusqu'ici, ce que la caméra
lisait au déverrouillage attendait dans une boîte privée du service. Désormais, à chaque ouverture de l'app (et à
chaque retour dedans), ces lectures — une dizaine de nombres par déverrouillage, jamais d'image — sont rangées dans
votre historique, sans doublon, puis retirées de la boîte. Elles sont donc **sauvegardées avec vos données** (export /
import JSON compris). Toujours **aucun chiffre affiché** : la carte dit seulement « N lectures gardées depuis le … »,
et le diagnostic combien comptent pour l'humeur. Seules les lectures **du déverrouillage** compteront : celles d'un
« Tester maintenant » restent du diagnostic, et c'est vérifié par un test automatique (sinon l'usage du téléphone
fausserait les liens qu'on vous montrera).

**Run du 19/10 02:30 — la calibration sur vos notes démarre.** HealthTrack sait maintenant décider, chaque semaine,
si ce que lit la caméra au déverrouillage suit vraiment **vos** notes de bien-être — dans un sens comme dans l'autre,
rien n'est supposé d'avance. Il faut 30 jours avec une note et des lectures, puis un accord net deux semaines de suite
pour qu'une humeur estimée ait le droit d'être affichée ; si le lien se perd, elle repasse en attente. En simulation :
moins d'un faux départ sur 100 en 4 mois quand il n'y a aucun lien, et un lien net reconnu en 3 mois 9 fois sur 10.
La carte dit « Calibration : N jours sur 30 ». Vos notes restent facultatives, mais **plus vous notez votre soirée,
plus vite ça aboutit**.

**Run du 19/10 04:30 — si Android arrête la lecture du visage, vous êtes prévenu.** Chaque mise à jour de l'app,
chaque redémarrage (et parfois One UI pour économiser la batterie) arrête la lecture du visage, et Android interdit
de la relancer sans vous. Désormais une notification discrète, sans son, « **Lecture du visage arrêtée** » apparaît
tout de suite après une mise à jour ou un redémarrage, sinon au plus tard dans l'heure : touchez **« Reprendre »**,
l'app s'ouvre et la relance d'elle-même. Ignorée, elle ne revient pas avant 6 h ; « Arrêter » éteint la lecture.

**Run du 19/10 06:30 — votre note du soir, d'un geste, sans ouvrir l'app.** Dans la fenêtre « Comment vous
sentez-vous ? », un nouveau bouton **« 🔔 Me la demander le soir »**. Allumé, il fait apparaître chaque soir une
notification discrète, sans son, avec **0 1 2 3 4 5** : un geste et c'est noté (« Noté : 4 sur 5 »), l'app n'a
même pas besoin de s'ouvrir. Elle arrive à l'heure où vous notez d'habitude (21 h au début), jamais deux fois, jamais
si vous avez déjà noté ce jour-là, et disparaît d'elle-même si vous l'ignorez. La note entre dans votre historique à
l'ouverture suivante, exactement comme une note saisie. Toujours facultatif — mais c'est ce qui fera aboutir le plus
vite la calibration du visage.

**Run « idées » du 19/10 08:30 — ce qui reste à capter.** Trois constats pour la suite. ① **Vos réseaux sociaux**
peuvent être comptés sans rien vous demander de plus : l'accès « Données d'utilisation » que vous avez déjà donné
suffit pour savoir combien de minutes vous passez sur les réseaux, la vidéo, les jeux, heure par heure. Ce sera un
**facteur** que les Analyses compareront à votre humeur, **sans aucun a priori** : les études récentes trouvent des
effets moyens minuscules et très différents d'une personne à l'autre — seules vos données diront ce qu'il en est
chez vous. C'est le prochain run de code. ② **Votre voix** : une étude de février 2026 (3 151 journaux vocaux) montre
que **ce que l'on dit** de sa journée en apprend bien plus que **le son** de la voix (qui fait à peine mieux que le
hasard). D'où le plan : une **dictée du soir** facultative (« journée crevante mais contente ») qui vous propose la
note et les étiquettes, l'audio n'étant jamais écrit nulle part ; pas de micro qui écoute en continu pour l'instant.
③ **Assez de déverrouillages ?** En simulation, le visage peut servir avec environ **12 à 16 lectures réussies par
jour** ; en dessous de 8, il faudrait beaucoup plus longtemps. Le diagnostic vous le dira — votre nombre de
déverrouillages est déjà connu de l'app.

**Run du 19/10 10:30 — la carte « Lecture du visage » est enfin visible (votre signalement de 08:37).** Vous ne la
trouviez pas, et pour cause : elle n'était mise en tête de Connecteurs **qu'une fois activée** ; tant qu'elle ne
l'était pas, elle était rangée dans le volet replié « Brancher une autre source », tout en bas de la page, sous la
montre. Désormais, dans l'app Android, elle est **toujours juste sous « Mes appareils »**, activée ou non, avec son
bouton « Activer la lecture du visage ». Un test automatique simule l'app Android native et vérifie qu'elle est là,
en tête, hors du volet replié. Et si le module du visage ne répondait pas (version trop ancienne…), la carte le dit
maintenant avec un bouton « Réessayer » au lieu de rester muette. **Pour vérifier votre version** : Plus →
Nouveautés, la première ligne dit « Version installée : … » ; la carte existe depuis la v168, la correction arrive
dans la version publiée juste après ce run (v173 ou plus).

**Run du 19/10 12:30 — le temps passé sur les réseaux sociaux, la vidéo, les jeux, compté tout seul.** L'accès
« Données d'utilisation » que vous avez déjà donné suffit : HealthTrack compte maintenant, chaque jour, les minutes
passées par type d'app (réseaux sociaux, messageries — à part —, vidéo, jeux), et heure par heure. La carte « Temps
d'écran et sommeil » ajoute « Dont réseaux sociaux 1 h 12 · vidéo 40 min… », et le journal de chaque journée une puce
« Réseaux sociaux ». Les Analyses comparent ces minutes à votre bien-être **sans aucun a priori** : rien n'est codé
comme « bon » ou « mauvais », et aucun conseil « passez moins de temps sur… » n'est proposé — vos données diront si,
chez vous, ça va de pair avec une meilleure ou une moins bonne humeur. C'est un **facteur**, jamais un ingrédient de
l'humeur estimée (vérifié par un test). Seul le nom de l'app ouverte est lu, jamais son contenu. Les 10 derniers
jours sont repris d'un coup.

**Run du 19/10 14:30 — moins de lectures du visage perdues, et le diagnostic dit si c'est assez.** Quand la caméra
ne voit pas votre visage au déverrouillage (tête tournée, pièce sombre…), elle **réessaie une seule fois, 2 secondes
plus tard** — toujours dans les 10 secondes qui suivent le déverrouillage, pour que la lecture reste celle du
déverrouillage et pas celle de ce que vous regardez ensuite. Et le **Diagnostic** de la carte dit maintenant, sur vos
7 derniers jours : combien de déverrouillages, de lectures et de lectures avec un visage vous avez par jour, et si
vous atteignez les **12 par jour** qui permettent à la calibration d'aboutir en 2 à 3 mois.

**Run du 19/10 16:30 — votre signalement de 15:05 : chaque déverrouillage est enfin repéré.** Vous aviez raison :
la lecture ne voyait **aucun** déverrouillage, donc aucune photo automatique (le test, lui, ne passe pas par là). Le
signal « déverrouillé » d'Android est envoyé par l'écran de verrouillage, et l'app l'écoutait d'une façon qui le
filtrait. C'est corrigé, et il y a désormais un **secours** : dans la minute qui suit l'allumage de l'écran,
HealthTrack regarde toutes les demi-secondes si l'écran de verrouillage a disparu — empreinte, visage ou Smart Lock,
le déverrouillage est vu même si Android ne prévient pas. Une seule lecture par déverrouillage. Si Android refusait
quand même la caméra en arrière-plan, la carte passe à **« À relancer »** (un geste, app ouverte) et un guide
explique comment accorder **l'accès permanent à la caméra** (Shizuku sans PC, ou ADB) ; le diagnostic dit s'il est
accordé. Le **Diagnostic** dit enfin combien de fois l'écran s'est allumé et combien de déverrouillages ont été vus
aujourd'hui (et par quelle voie), l'heure du dernier, comment le service a démarré, et les 5 dernières tentatives
avec leur résultat ou l'erreur exacte d'Android.

**Run du 19/10 18:30 — votre journée en une phrase.** Dans « Comment vous sentez-vous ? », un champ facultatif
**« En une phrase »** : écrivez, ou **dictez avec le micro du clavier**, « journée crevante mais contente, apéro le
soir », et HealthTrack vous **propose** « Note 3 » et « 🍷 Alcool » en puces à toucher — rien n'est coché sans vous,
et **la phrase n'est pas gardée**. Elle est lue sur le téléphone par deux listes de mots qui ne se recoupent jamais
(vérifié par un test) : les mots de votre **ressenti** ne proposent que la note (et « Stress »), ceux de votre
**journée** que les tags de contexte — sinon les Analyses compareraient votre humeur à elle-même. C'est la voix « par
le texte » qu'avait retenue la veille (ce qu'on dit en apprend plus que le son de la voix), sans permission micro.

**Run « idées » du 19/10 20:30 — avant de vous montrer une humeur estimée, s'assurer qu'elle ne ment pas.** En
rejouant la règle qui décidera si votre visage « suit vos notes », j'ai trouvé un piège : notre humeur ressemble à
celle de la veille, et ce que lit la caméra dérive aussi lentement pour des raisons sans rapport (la lumière qui baisse
en automne, des lunettes, une nouvelle coque). Deux choses qui dérivent chacune de leur côté ont l'air liées bien plus
souvent qu'on ne le croit : en simulation, la règle actuelle aurait affiché une humeur **sans fondement chez 1
personne sur 8**. Une correction (comparer chaque jour en laissant de côté la semaine qui l'entoure, et tenir compte
de cette ressemblance d'un jour à l'autre) ramène ce risque à 1 ou 2 sur 100 ; le prix, une calibration un peu plus
longue. Ce sera codé **avant** toute estimation du jour. J'ai aussi écrit d'avance comment lire votre diagnostic de la
lecture du visage, pour corriger dès qu'il arrive, et vérifié que Samsung propose un lien direct vers « Applis jamais
en veille » (un bouton possible si One UI endort la lecture). Rien de nouveau dans l'app ce soir.

**Run du 19/10 22:30 — votre consigne du soir : l'humeur estimée s'affiche dès la première lecture.** Le verrou
« Calibration : 0 jour sur 30… Rien n'est affiché avant… » a disparu. Dès qu'une lecture au déverrouillage a vu votre
visage, l'**accueil** affiche une carte **« Humeur estimée »** : votre bien-être du jour sur 0–5 (« moyenne, ≈ 2,8 / 5,
entre 1,6 et 4,0 »), une barre qui montre la fourchette, l'humeur à la dernière lecture, et une **confiance**
(faible / moyenne / bonne) qui dit pourquoi : nombre de lectures du jour, visage bien cadré ou de biais, lectures
concordantes ou dispersées, un seul signal pour l'instant (le visage). La même chose apparaît dans la carte « Lecture
du visage », et **« Tester maintenant » dit l'humeur de ce moment** (un test ne compte pas dans le jour). D'où vient le
chiffre : ① au début, un **modèle général des expressions** (sourire, sourire « des yeux », coins de la bouche
abaissés, froncement…) — une hypothèse de population, d'où la confiance faible ; ② il s'ajuste tout seul à **votre
visage habituel** au fil des jours (quelqu'un qui fronce toujours un peu n'est pas plus triste pour autant) ; ③ si
vous donnez des notes (facultatif), au bout de 14 jours notés il passe à un **modèle personnel**, seulement s'il
prédit vraiment mieux vos notes. L'étape suivante remplacera ① par un vrai modèle valence / éveil embarqué, plus
fiable. Toujours une estimation, jamais un diagnostic ; le diagnostic exportable ne contient aucune valeur d'humeur.

**Run du 20/10 00:30 — une humeur estimée qui ne se laisse pas tromper par les saisons.** Votre humeur ressemble à
celle de la veille, et ce que lit la caméra change lentement pour des raisons sans rapport (lumière d'automne,
lunettes, coque). En simulation, sans aucun lien réel, l'app aurait adopté un « modèle personnel » appris sur vos notes
**plus d'une fois sur deux**, et sa vérification « votre visage suit vos notes » se serait trompée 1 fois sur 8.
Corrigé : chaque jour est jugé sans la semaine qui l'entoure, l'effet « humeur qui dure » est retiré, et si votre
visage dérive nettement, chaque lecture est comparée à vos 14 jours précédents → 1 à 3 erreurs sur 100. **Rien ne
change à l'affichage** : l'humeur estimée est toujours là dès la première lecture ; seul le passage au modèle
personnel est plus prudent (après la vérification réussie, vers 6 semaines de notes au lieu de 14 jours).

**Run du 20/10 02:30 — l'humeur estimée par un vrai modèle valence / éveil (étape 2 de votre consigne du soir).**
Vous vouliez « un modèle plus puissant » : chaque lecture du déverrouillage passe désormais aussi par **HSEmotion**, un
modèle de reconnaissance des émotions appris sur des centaines de milliers de visages, qui donne directement la
**valence** (agréable ↔ désagréable) et l'**éveil** (calme ↔ animé) — sur des photos qu'il n'a jamais vues, son accord
avec des annotateurs humains est de 0,59 pour la valence et 0,55 pour l'éveil (CCC), le meilleur compromis précision /
poids / licence trouvé (comparatif dans [`BIEN-ETRE-AUTO.md`](BIEN-ETRE-AUTO.md)). La carte « Humeur estimée » dit
maintenant aussi l'éveil (« plutôt calme », « modéré », « plutôt animé ») et quel modèle a servi ; la fourchette est un
peu plus étroite. Le modèle (16 Mo) n'est **pas dans l'APK** : le téléphone le télécharge une fois depuis le dépôt de
ses auteurs à la première ouverture de la carte « Lecture du visage » (lecture active), et ne le garde que si son
empreinte est exacte — ses poids ont été appris sur une base d'images réservée à la recherche, je préfère ne pas les
redistribuer moi-même. Rien ne part de votre téléphone. En coulisses : moteur ONNX Runtime 1.22, choisi parce que les
versions plus récentes ajoutent une télémétrie vers Microsoft ; l'APK grossit d'environ 18 Mo.

**Run du 20/10 04:30 — vos facteurs comparés à votre humeur estimée, sans aucune note.** Jusqu'ici, les Analyses ne
comparaient votre sommeil, vos pas, votre écran ou vos réseaux sociaux qu'à vos **notes** de bien-être — et sans notes,
elles restaient vides. Désormais, chaque jour avec au moins 3 lectures du visage au déverrouillage reçoit une **humeur
estimée** (médiane de ses lectures), et Analyses → Analyse simple ajoute une section **« 🙂 Avec votre humeur estimée
(visage) »** : ce qui va de pair, chez vous, avec une meilleure ou une moins bonne humeur estimée, avec les mêmes
garde-fous que pour vos notes (week-end, jours qui se ressemblent, nombre de facteurs testés). Elle s'affiche **même
sans aucune note** ; avant 14 jours estimés, elle dit « N jours sur 14 ». L'humeur estimée ne vient que de votre visage
(et de vos notes si vous en donnez) : aucun facteur comparé ne sert à l'estimer (vérifié par un test), et ce que vous
faites après la dernière lecture d'un jour (avant 20 h) ne compte pas pour ce jour-là. Aucun comportement jugé bon ou
mauvais d'avance ; ce sont des hypothèses à observer, pas des causes.

**Run du 20/10 06:30 — si la lecture du visage s'arrête, la carte dit pourquoi ; « Applis jamais en veille » sur
Samsung (point (c) de votre signalement du 15:05).** Une lecture arrêtée disait seulement « Android a arrêté… (mise à
jour, redémarrage, économie d'énergie…) ». Elle dit maintenant **laquelle** : la mise à jour de l'app, un redémarrage,
ou **le téléphone lui-même** sans l'un ni l'autre — sur un Samsung, c'est presque toujours la mise en veille des applis
de One UI, qui agit **même quand la batterie est « sans restriction »**. Dans ce cas, un bouton **« Applis jamais en
veille »** ouvre directement la liste de One UI : touchez « + » et cochez HealthTrack. Le bouton est aussi, sur un
Samsung, dans le Diagnostic, et le diagnostic enregistré dit la cause du dernier arrêt.

**Run « idées » du 20/10 08:30 — le meilleur modèle pour votre visage, et pourquoi pas encore la voix.** J'ai
comparé, fichiers officiels en main, les modèles qui lisent l'humeur (valence) et l'éveil sur un visage. Sur des
photos de bases de recherche, le plus lourd paraît bien meilleur ; **sur de vraies vidéos, tous se valent** — ce qui
améliore vraiment l'estimation, c'est de **moyenner plusieurs images et plusieurs lectures**, ce que l'app fait déjà.
D'où la prochaine étape : ajouter au modèle actuel un **second modèle officiel des mêmes auteurs, deux fois plus
léger (8 Mo)**, et faire voter les deux : quand ils sont d'accord, la confiance monte ; quand ils divergent, la
fourchette s'élargit. EmoNet, souvent cité, est **définitivement écarté** (licence qui interdit de l'adapter au
téléphone). Pour **la voix** : aucun modèle du son de la voix n'est à la fois assez léger et sous une licence qui nous
permette de l'utiliser (les meilleurs sont réservés à la recherche) ; la voix passera donc d'abord par **ce que vous
dites** (la phrase du soir, puis la dictée). Rien de nouveau dans l'app ce matin.

**Run du 20/10 10:30 — deux modèles lisent votre visage, et leur accord entre dans la confiance.** Comme proposé par
le run « idées » de ce matin : chaque lecture du déverrouillage passe maintenant par **deux** modèles officiels des
mêmes auteurs (HSEmotion) — celui d'hier (EfficientNet, 16 Mo) et un second, plus léger (**MobileFaceNet, 8 Mo**),
qui lit le visage autrement (en 112 px, moins sensible à la basse résolution). L'humeur estimée est la **moyenne des
deux** ; quand ils sont d'accord, la fourchette se resserre un peu, quand ils divergent elle s'élargit — sans jamais
déplacer l'estimation elle-même. La confiance le dit en clair : « deux modèles d'accord », « à peu près d'accord » ou
« en désaccord ». Le second modèle se télécharge tout seul (8 Mo, une fois, empreinte vérifiée) à la prochaine
ouverture de la carte « Lecture du visage », **même si le premier est déjà là** ; le Diagnostic dit « Second modèle
(MobileFaceNet) : prêt · N lectures lues par les deux modèles ». Vérifié : l'image préparée par le téléphone pour ce
modèle est identique, à 1/10 000 près, à celle que prépare la bibliothèque officielle des auteurs.

**Run du 20/10 12:30 — votre téléphone sait-il reconnaître votre voix sans Internet ?** La voix entrera dans
l'humeur estimée par **ce que vous dites** (une dictée du soir), pas par le son — à condition que la reconnaissance
se fasse **sur le téléphone** : sinon le son de votre voix partirait sur Internet, ce que je refuse. Avant d'écrire
la dictée, le **Diagnostic** de la carte « Lecture du visage » le vérifie : une nouvelle dernière ligne **« Voix »**
dit si la reconnaissance est sur le téléphone ou seulement en ligne, si le français est installé ou à télécharger,
et quel moteur (Google, Bixby…). **Aucun micro n'est ouvert**, aucune permission demandée : l'app pose seulement la
question à Android, une fois, quand vous dépliez le Diagnostic. C'est aussi dans le fichier enregistré.

**Run du 20/10 14:30 — vos habitudes comparées à votre humeur estimée, sans aucune note.** Dans Analyses, la
section « Avec votre humeur estimée (visage) » ne compare plus seulement sommeil, pas, écran… : elle dit aussi, pour
**vos habitudes** (alcool, café après 14 h, écran tard, sport le soir…), si l'humeur lue sur votre visage **le
lendemain** est meilleure ou moins bonne les jours avec que les jours sans, et s'il y a des **effets décalés** (ce que
vous avez fait la veille ou 2–3 jours avant, à humeur de la veille égale). Les habitudes que le téléphone mesure seul
(écran tard, sport le soir, voyage) comptent même un soir sans lecture du visage ; celles que vous cochez dans une note
comptent aussi. Le **stress** ressenti fait partie de l'humeur : il n'est jamais comparé (sinon l'humeur serait
comparée à elle-même). Aucun sens présupposé, aucune « piste » : un lien est une hypothèse à observer. Les liens
incertains sont repliés. Rien à faire de votre côté : ça apparaît après 14 jours avec au moins 3 lectures du visage.

**Run du 20/10 16:30 — les lectures nettes comptent plus.** Le bien-être estimé du jour ne met plus toutes les
lectures du visage sur le même plan : une lecture prise de biais, floue, ou où les deux modèles hésitent compte
**moins** qu'une lecture bien cadrée (aucune n'est jetée). La carte « Humeur estimée » le dit (« 2 lectures peu nettes
comptées moins ») et sa fourchette se resserre moins vite dans ce cas : la confiance reste honnête. Même règle pour
l'humeur estimée jour par jour des Analyses. Rien à faire de votre côté.

**Run du 20/10 18:30 — la lumière compte aussi.** Chaque lecture du visage mesure maintenant la **lumière sur votre
visage** (un seul nombre, jamais d'image). Une lecture prise dans la pénombre ou sous une lumière trop vive compte un
peu moins dans le bien-être du jour, sans que sa note bouge ; la carte le dit (« souvent dans la pénombre ») quand
c'est le cas de la plupart des lectures de la journée. La lumière n'entre **jamais** dans l'humeur elle-même ni dans
la vérification visage ↔ notes : elle suit l'endroit et l'heure (dehors, bureau, soir), c'est du contexte, pas une
émotion — vérifié par un test. Le Diagnostic ajoute « lumière correcte / souvent dans la pénombre » à la ligne
« Humeur estimée ». Rien à faire de votre côté (la mesure commence avec la version publiée après ce run).

**Run du 20/10 20:30 — la mise à jour en un clic montre enfin où elle en est (votre signalement de 19:05).** La
cause : depuis la v180, l'app pèse 33,6 Mo (contre 6,8 Mo il y a trois jours) et l'ancien bouton chargeait tout le
fichier en mémoire d'un bloc, sans délai ni progression — sur 4G il pouvait ne jamais finir, sans rien dire. Désormais
c'est **Android qui télécharge** : le bandeau indique la **version installée**, la nouvelle et sa **taille**, puis une
**barre de progression** « 12,3 Mo / 33,6 Mo · 36 % · 1,4 Mo/s · encore ≈ 14 s » et les étapes **Téléchargement →
Vérification → Installation**. Vous pouvez quitter l'app : le téléchargement continue avec sa notification et reprend
seul après une coupure. Si plus rien n'arrive pendant 45 s, ou en cas d'échec, le bandeau dit pourquoi (pas de réseau,
stockage plein, fichier abîmé…) et propose **« Réessayer »** ou **« Télécharger depuis le navigateur »**. Avant
l'installateur, le fichier est vérifié (taille et empreinte publiées avec la version). Ce qui pèse, au passage : pas
les modèles du visage (≈ 4 Mo) mais le moteur ONNX (18 Mo) — je proposerai de s'en passer pour revenir vers 15 Mo.
*Ce créneau de 20:30 était un run « idées » ; la veille est reportée à 08:30 pour corriger d'abord votre mise à jour.*

**Nouveau (12:30, voix)** : dans le Diagnostic, lisez la ligne « Voix … » (ou envoyez-moi le fichier, qui la
contient) : elle décide comment sera faite la dictée du soir.

**✅ Signalement du 19/10 15:05 résolu** (votre capture du 20/10 19:05 montre 44 lectures automatiques). *Ancienne consigne, pour mémoire* — : ① installez la version publiée après ce run (≥ celle du
19/10 ~17 h) ; ② Plus → Connecteurs → Lecture du visage : si elle dit « Arrêtée » ou « À relancer », touchez
**Relancer** ; ③ verrouillez puis **déverrouillez 2 ou 3 fois à l'empreinte** en regardant l'écran, à plus de
2 minutes d'écart si possible (le point vert doit s'allumer ~1 s après) ; ④ **Diagnostic → « Enregistrer le
diagnostic »** et envoyez-moi le fichier (ou une capture des lignes « Aujourd'hui : écran allumé… », « Accès
caméra… » et « Dernières tentatives… ») : elles suffisent à trancher. **Nouveau (22:30)** : avec la version publiée
après le run de 22:30, revenez sur l'accueil après ces déverrouillages : la carte **« Humeur estimée »** doit être
apparue (sinon, c'est qu'aucune lecture du déverrouillage n'a vu votre visage — le diagnostic dira pourquoi). Dites-moi
aussi si l'estimation vous semble plausible, et touchez « Tester maintenant » en souriant puis sans sourire : la
phrase « Humeur de ce moment » doit changer.

**Nouveau (10:30, second modèle)** : après la mise à jour, ouvrez la carte « Lecture du visage » en Wi-Fi (8 Mo),
rouvrez-la une minute plus tard : le Diagnostic doit dire « Second modèle (MobileFaceNet) : prêt ». Après quelques
déverrouillages, la ligne « Humeur estimée : … deux modèles : accord / partiel / désaccord » apparaît, et le temps
d'analyse (« Temps moyen : … analyse N ms ») me dira ce que coûte le second modèle sur l'A56 (attendu : +20 à 60 ms).

**Nouveau (06:30, une minute)** : Plus → Connecteurs → Lecture du visage → Diagnostic → **« Applis jamais en
veille »** → « + » → cochez HealthTrack (préventif : One UI ne l'endormira plus). Si un jour la carte dit « Le
téléphone a arrêté la lecture… de lui-même », envoyez-moi le diagnostic : la ligne « Arrêt : … » me le confirmera.

**Nouveau (02:30, modèle valence / éveil)** : après la mise à jour, ouvrez la carte « Lecture du visage » une fois en
Wi-Fi (16 Mo), rouvrez-la une minute plus tard : le Diagnostic doit dire « Modèle valence / éveil : prêt ». Après vos
déverrouillages, la carte « Humeur estimée » de l'accueil doit dire « Modèle valence / éveil embarqué (HSEmotion) » et
une ligne « Éveil ». Le diagnostic exporté contiendra le temps d'analyse et l'erreur exacte s'il y en a une. Dites-moi
si l'humeur et l'éveil vous paraissent plausibles (« Tester maintenant » en souriant, puis sans sourire).

**Ce qu'il me faut (votre Galaxy A56)** — c'est l'étape qui débloque la suite : après la mise à jour (vérifiez dans
Plus → Nouveautés que la version installée est au moins celle publiée le 19/10 vers 11 h), Plus → Connecteurs → la
carte **Lecture du visage**, juste sous « Mes appareils » → **« Activer la lecture du visage »** (accepter l'appareil photo) →
**« Sans restriction »** (accepter) ; utilisez le téléphone normalement quelques heures ; puis **Diagnostic →
« Enregistrer le diagnostic »** et envoyez-moi le fichier `Documents/healthtrack-visage-….json` (ni image ni mesure
dedans ; il dit maintenant aussi combien de lectures sont rangées). Dites-moi si le **point vert** s'allume environ
1 s après chaque déverrouillage. **Nouveau (temps par app)** : un soir, une capture de la ligne « Dont réseaux
sociaux … » (Plus → Connecteurs → Temps d'écran et sommeil) et une de Paramètres → Bien-être numérique (détail des
apps du jour), pour vérifier que les chiffres concordent. **Nouveau (lectures par jour)** : dans le diagnostic
exporté après une semaine, la ligne « Par jour » et la ligne « 2e essais » m'indiqueront si le visage donne assez. **Nouveau (phrase du soir)** : dictez une phrase dans « En une phrase » et dites-moi si la note et les tags proposés tombent juste (et les mots ratés). **Nouveau (facultatif)** : allumez « 🔔 Me la demander le soir » dans la saisie bien-être, autorisez les
notifications, et dites-moi si la notification arrive le soir, si les 6 chiffres sont lisibles et si la note
apparaît dans le journal à l'ouverture suivante. **Test « Reprendre »** : juste après l'installation de cette mise à jour, sans ouvrir l'app, une
notification « Lecture du visage arrêtée » devrait apparaître (si la lecture était activée) ; touchez « Reprendre »
et dites-moi si l'app s'ouvre et si le point vert revient au déverrouillage suivant.

**Nouveau dans l'app** (Plus → Nouveautés après la mise à jour en 1 clic)
- **Habitudes et effets décalés avec l'humeur estimée (run 20/10 14:30)** : Analyses → section visage, « Le
  lendemain : humeur estimée … contre … sans », stress jamais comparé, aucune piste.
- **Sonde vocale dans le Diagnostic (run 20/10 12:30, I124)** : ligne « Voix » — reconnaissance sur le téléphone ou
  en ligne, français installé / téléchargeable, moteur ; aucun micro ouvert.
- **Deux modèles du visage qui votent (run 20/10 10:30, I126)** : humeur = moyenne d'EfficientNet et de
  MobileFaceNet ; leur accord resserre ou élargit la fourchette ; « Second modèle » dans le diagnostic.
- **Lecture du visage : cause de l'arrêt et « Applis jamais en veille » (run 20/10 06:30)** : mise à jour,
  redémarrage ou téléphone ; bouton One UI direct sur Samsung ; ligne « Arrêt : … » dans le diagnostic.
- **Facteurs comparés à votre humeur estimée (run 20/10 04:30)** : Analyses → « Avec votre humeur estimée (visage) »,
  sans aucune note, dès 14 jours avec ≥ 3 lectures du visage.
- **Humeur estimée par un modèle valence / éveil (run 20/10 02:30, votre consigne du soir, étape 2)** : HSEmotion sur
  le téléphone (16 Mo téléchargés une fois), éveil affiché, diagnostic « Modèle valence / éveil ».
- **Humeur estimée robuste aux dérives lentes (run 20/10 00:30)** : le « modèle personnel » ne s'installe plus sur
  une simple coïncidence de saison ; le diagnostic dit combien votre visage dérive.
- **Humeur estimée dès la première lecture (run 19/10 22:30, votre consigne du soir)** : carte sur l'accueil et dans
  « Lecture du visage », bien-être du jour sur 0–5 avec fourchette et confiance ; plus de verrou des 30 jours.
- **Lecture du visage : chaque déverrouillage repéré (run 19/10 16:30, votre signalement)** : empreinte, visage,
  Smart Lock ; état « À relancer » si Android refuse la caméra ; guide d'accès permanent ; diagnostic détaillé.
- **Lecture du visage : 2e essai et lectures par jour (run 19/10 14:30)** : une lecture ratée est reprise une fois
  2 s plus tard ; le diagnostic dit si vous avez assez de lectures par jour (12 visées).
- **Temps par type d'app (run 19/10 12:30)** : réseaux sociaux, messageries, vidéo, jeux, comptés seuls et comparés à
  votre bien-être sans a priori.
- **Carte « Lecture du visage » visible (run 19/10 10:30)** : toujours juste sous « Mes appareils », même pas encore
  activée ; « Réessayer » si le module ne répond pas.
- **Note du soir d'un geste (run 19/10 06:30)** : une notification 0–5 le soir, notée sans ouvrir l'app.
- **Lecture du visage : notification « Reprendre » (run 19/10 04:30)** : quand Android l'arrête, un geste suffit
  pour la relancer.
- **Lecture du visage : calibration (run 19/10 02:30)** : la carte dit combien de jours sur 30 ont une note et des
  lectures (depuis le 19/10 22:30 : vérification facultative, elle ne bloque plus l'affichage).
- **Lecture du visage : lectures gardées (run 19/10 00:30)** : rangées dans l'historique à chaque ouverture, comprises
  dans la sauvegarde ; la carte dit combien sont gardées ; rien n'est affiché avant la calibration.

**Points d'attention**
- Les points ouverts de la semaine dernière (montre, Google et l'installation hors Play Store en 2027, etc.) sont dans
  [`semaines/2026-S42.md`](semaines/2026-S42.md) ; aucun n'a changé.

**Meilleures idées des runs « idées »** (détail, sources et notes dans [`IDEES.md`](IDEES.md))
- **Deux modèles du visage qui votent** (I126, 20/10 08:30) : hors des bases de recherche, les modèles se valent ;
  la moyenne de deux modèles officiels et leur désaccord donnent une humeur plus stable et une confiance honnête.
- **Temps par app comme facteur, sans liste de « mauvaises » apps** (I116, 19/10 08:30) : catégories déclarées par
  les apps elles-mêmes, minutes par heure, comparées à votre humeur **après coup** seulement.
- **La voix par ce que vous dites, pas par le son** (I117, I119) : une seule prise de son lue deux fois, aucun
  fichier ; mots du ressenti (humeur) et mots du contexte (facteurs) dans deux listes qui ne se croisent jamais.
- **Une humeur estimée qu'on peut croire** (I121, 19/10 20:30) : la calibration du visage doit tenir compte des
  dérives lentes (saison, lumière, humeur qui dure) ; simulé : 1 faux « ça marche » sur 8 sans correction, 1–2 sur 100
  avec.
- **Assez de lectures du visage, sans biais** (I118) : viser ≥ 12 lectures réussies par jour, toujours au
  déverrouillage (jamais quand une notification allume l'écran : son contenu fausserait tout).

**Prochaines priorités (20/10 20:30)** — ✅ mise à jour en un clic avec progression (signalement 19:05) ; votre
installation manuelle de la v188+ puis l'essai à la version suivante ; I129 alléger l'APK (retirer ONNX Runtime) ;
puis votre diagnostic (déverrouillages, duo, « Voix ») et la dictée du soir (I117).
*Prochaines priorités (20/10 18:30)* — ✅ I127 lectures pondérées, ✅ I127b lumière du visage ; ensuite : votre
diagnostic (déverrouillages, duo, ligne « Voix ») ; puis la dictée du soir (I117) selon la ligne « Voix ».
*Prochaines priorités (20/10 14:30)* — ✅ habitudes et effets décalés sur l'humeur estimée ; ensuite : votre
diagnostic (déverrouillages, duo, ligne « Voix ») ; I127 (lectures pondérées par leur qualité) ; puis la dictée du
soir (I117) selon la ligne « Voix ».
*Prochaines priorités (20/10 12:30)* — ✅ I124 sonde vocale ; ensuite : votre diagnostic (déverrouillages, duo,
ligne « Voix ») ; habitudes (tags) et effets décalés sur l'humeur estimée ; I127 ; puis la dictée du soir (I117)
selon la ligne « Voix ».
*Prochaines priorités (20/10 08:30, run idées)* — votre diagnostic d'abord ; sinon **I126** duo de modèles du
visage (désaccord = confiance), puis I124 sonde vocale, puis habitudes (tags) et effets décalés sur l'humeur estimée.
*Priorités précédentes (20/10 06:30)* — ✅ « Applis jamais en veille » + cause de l'arrêt (I123) ; ensuite : votre
diagnostic ; run idées 08:30 : licence d'EmoNet, modèles vocaux (étape 3) ; I124 sonde vocale ; habitudes (tags) et
effets décalés sur l'humeur estimée.
*Priorités précédentes (20/10 04:30)* — ✅ facteurs X comparés à l'humeur estimée (Y automatique) ; ensuite : votre
diagnostic (déverrouillages + modèle) ; run idées 08:30 : licence d'EmoNet, modèles vocaux (étape 3) ; « Applis jamais
en veille » (I123) ; habitudes (tags) et effets décalés aussi sur l'humeur estimée.
*Priorités précédentes (20/10 02:30)* — ✅ étape 2, modèle valence / éveil embarqué ; ensuite : votre diagnostic
(déverrouillages + modèle) ; la vérification visage ↔ notes lit aussi la valence du modèle ; run idées 08:30 : licence
d'EmoNet et modèles à licence de poids explicite, modèles vocaux (étape 3) ; « Applis jamais en veille » (I123).
*Priorités précédentes (20/10 00:30)* — ✅ dérives lentes (I121) corrigées dans la vérification et le modèle
personnel ; ensuite : votre diagnostic dès qu'il arrive ; le comparatif des modèles valence / éveil (run idées de
08:30) puis leur intégration (étape 2) ; « Applis jamais en veille » sur Samsung (I123) ; la voix (étape 3).
*Priorités précédentes (19/10 22:30)* — votre consigne du 19/10 au soir d'abord : ✅ étape 1, estimation affichée dès
la première lecture (22:30) ; **étape 2, un vrai modèle valence / éveil embarqué** (comparatif précision / poids /
licence par les runs idées, puis intégration, téléchargé au build avec vérification d'empreinte) ; étape 3, visage +
voix. En parallèle : votre diagnostic de la Lecture du visage dès qu'il arrive, et la robustesse aux dérives lentes
(I121) appliquée aussi au passage au « modèle personnel ».
*Priorités précédentes (19/10 20:30)* — uniquement le bien-être automatique : votre diagnostic de la Lecture du
visage (et l'adapter à One UI), ✅ temps par app comme facteur (19/10 12:30), ✅ lectures du visage par jour dans le
diagnostic + 2e essai (19/10 14:30), 🚑 déverrouillages enfin repérés + guide Shizuku / ADB (19/10 16:30, votre
signalement — **votre diagnostic après la mise à jour est attendu**), ✅ phrase du soir (19/10 18:30), **porte de
calibration robuste aux dérives lentes (I121, prochain run de code si le diagnostic n'est pas arrivé)**, puis estimation
du jour avec sa fourchette (derrière la porte).

| Run | Type | Résultat |
|---|---|---|
| 21/10 04:30 — [Identité visuelle (ii) : icône « H nuit »](runs/2026-10-21-0430-icone-h-nuit.md) | 🧭🎨 | Icône adaptative + monochrome + notification (5 notifications) + écran de démarrage (API SplashScreen) + logo de l'en-tête ; PNG et icône Play 512 px générés par `scripts/brand/render-icons.mjs` ; test-garde (zone sûre, couleurs) ; 1 666 Vitest ; PR #244 → **v192, 33,7 Mo** + AAB play 332 |
| 21/10 02:30 — [Jalon 3a : variantes play / sideload](runs/2026-10-21-0230-variantes-play-sideload.md) | 🧭📦 | Flavors `sideload` (`com.healthtrack.app`) / `play` (`fr.jpesquet.sante`, sans `REQUEST_INSTALL_PACKAGES` ni mise à jour), `VITE_DISTRIBUTION`, versionCode croissant, workflow « Play — AAB » (WIF → Secret Manager → AAB signé ; attend P9) ; correctif de date dans `loadNutritionEntries` ; 1 660 Vitest ; PR #242 → **v191, 33,7 Mo** + AAB play 330 signé |
| 21/10 00:30 — [Identité visuelle (i) : tokens, polices, thème clair](runs/2026-10-21-0030-design-tokens.md) | 🧭🎨 | `INFRA.md` + `DESIGN.md` créés, PRODUIT / BACKLOG revus (Vertex AI sans clé, actions du propriétaire pas à pas) ; `theme/tokens.css` seule source des couleurs (~240 couleurs brutes remplacées), Figtree + IBM Plex Mono embarquées, clair par défaut, Apparence dans Paramètres, `SystemBarsPlugin` ; 1 653 Vitest ; PR #240 → **v190, 33,7 Mo** |
| 20/10 22:30 — [Chantier produit : PRODUIT.md + « bien-être » partout (jalons 1 et 2a)](runs/2026-10-20-2230-produit-cadre.md) | 🧭🙂 | Décisions du 20/10 au soir reportées (PRODUIT.md, charte §000000000, BACKLOG) ; libellés visibles « humeur » → « bien-être » ; test-garde `wording.test.js` ; 1 642 Vitest ; PR #238 → **v189, 33,6 Mo** |
| 19/10 00:30 — [Visage : lectures rangées dans l'historique (I90)](runs/2026-10-19-0030-visage-import.md) | 🔴🙂 | S42 archivée ; I90 + test « composition » (I114) ; PR #213, checks verts → fusionnée |
| 19/10 02:30 — [Visage : porte de calibration (I112)](runs/2026-10-19-0230-visage-porte.md) | 🔴🙂 | `gate.js` + simulations ; carte « Calibration : N jours sur 30 » ; PR #214 |
| 19/10 04:30 — [Visage : notification « Reprendre » (I88 ②)](runs/2026-10-19-0430-visage-reprendre.md) | 🔴🙂 | Règle `FaceResume` + tâche horaire + redémarrage / mise à jour ; relance dans `onResume` ; diagnostic `resume` ; PR #215 |
| 19/10 06:30 — [Note du soir d'un geste (I113)](runs/2026-10-19-0630-note-du-soir.md) | 🔴🙂 | Règle `EveningNote` (JVM), notification 6 boutons + alarme du soir, file native → note `wellbeing` ; bouton dans la saisie ; diagnostic `eveningNote` ; PR #216 |
| 19/10 08:30 — [Idées : temps par app, voix par la dictée, assez de rafales](runs/2026-10-19-0830-idees-apps-voix-rafales.md) | 💡 | I116–I120 ; simulation rafales / jour ; npj 2026 (texte ≫ audio) ; pas de Gemini Nano sur l’A56 ; PR #217 |
| 19/10 10:30 — [Carte « Lecture du visage » visible (signalement 08:37)](runs/2026-10-19-1030-carte-visage-visible.md) | 🚑🙂 | Cause : carte rangée dans le volet replié tant que non activée ; épinglée en tête sur Android ; « Réessayer » si le natif est muet ; tests natifs ; PR #218 |
| 19/10 12:30 — [Temps par app comme facteur X (I116)](runs/2026-10-19-1230-temps-par-app.md) | 🔴🙂 | `queryAppEvents` natif + `phoneApps.js` ; entrées `phone_apps` ; 4 facteurs neutres sans levier, test anti-circularité ; ligne « Dont… » + puce journal ; PR #219 |
| 19/10 14:30 — [Visage : 2e essai et lectures par jour (I118)](runs/2026-10-19-1430-visage-rafales-par-jour.md) | 🔴🙂 | `FaceSchedule.shouldRetry` (1 fois, +2 s, ≤ 10 s après le déverrouillage) ; `faceDailyCounts` → diagnostic « Par jour » / « 2e essais » ; PR #220 |
| 19/10 16:30 — [Visage : chaque déverrouillage repéré (signalement 15:05)](runs/2026-10-19-1630-visage-deverrouillage.md) | 🚑🙂 | Cause : récepteur `RECEIVER_NOT_EXPORTED` → `USER_PRESENT` (SystemUI) filtré ; `UnlockWatch` (diffusion / verrou interrogé / écran déjà ouvert), récepteur exporté sur le fil du service ; diagnostic v2 (allumages, sources, tentatives + erreur exacte, démarrage, app-op caméra) ; « À relancer » + guide Shizuku / ADB (I89) ; PR #221 |
| 19/10 18:30 — [Votre journée en une phrase (I119)](runs/2026-10-19-1830-phrase-du-soir.md) | 🔴🙂 | Lexiques disjoints ressenti (Y) / contexte (X) + test d'intersection vide ; champ « En une phrase » (dictable au clavier) → note et tags proposés, phrase jamais gardée ; 1 539 tests |
| 19/10 22:30 — [Humeur estimée dès la première lecture (consigne du 19/10 au soir, étape 1)](runs/2026-10-19-2230-humeur-des-la-1re-lecture.md) | 🔴🙂 | Consigne reportée (charte §0000000) ; `mood/faceMood.js` (a priori FACS → ligne de base personnelle → calibration facultative), fourchette + confiance ; carte « Humeur estimée » sur l'accueil + bloc dans la carte visage + « Tester maintenant » ; verrou « Rien n'est affiché » retiré ; diagnostic : modèle / confiance sans valeur ; 1 559 tests ; PR #224 |
| 20/10 00:30 — [Humeur estimée robuste aux dérives lentes (I121 + étendu)](runs/2026-10-20-0030-humeur-derives-lentes.md) | 🔴🙂 | `mood/blockCv.js` (blocs ±7 j, n effectif) ; détrendage adaptatif du visage ; faux départs 12,5 % → 2,5 % ; modèle personnel sans lien 60 % → ≤ 5 % (porte exigée) ; diagnostic `a` / `drift` ; 1 573 tests ; PR #225 |
| 20/10 02:30 — [Modèle valence / éveil embarqué (consigne du 19/10 au soir, étape 2)](runs/2026-10-20-0230-modele-valence-eveil.md) | 🔴🙂 | HSEmotion `enet_b0_8_va_mtl` (CCC V 0,59 / A 0,55) téléchargé par le téléphone, SHA-256 ; ONNX Runtime 1.22 (sans télémétrie) ; `FaceAffect` + vecteurs ; `faceMood` modèle `va` + éveil ; diagnostic v3 ; 111 JVM + 1 584 Vitest ; PR #226 |
| 20/10 04:30 — [Facteurs comparés à l'humeur estimée (Y automatique)](runs/2026-10-20-0430-facteurs-humeur-estimee.md) | 🔴🙂 | `mood/faceMoodDays.js` : série quotidienne (≥ 3 lectures, médiane, ligne de base par jour), corrélations X ↔ humeur estimée (ordre temporel à la dernière lecture, week-end, n effectif, BH) ; section Analyses visible sans notes ; `face_burst` lu jusqu'à 10 000 ; 1 597 tests ; PR #227 |
| 20/10 06:30 — [Visage : cause de l'arrêt + « Applis jamais en veille » (I123)](runs/2026-10-20-0630-applis-jamais-en-veille.md) | 🔴🙂 | `faceStopCause` (mise à jour / redémarrage / téléphone) via `lastUpdateAt` + `bootAt` natifs ; `openNeverSleep` (One UI `activity_type` 2, repli réglages de l'app) ; diagnostic v4 ; 1 602 tests ; PR #228 |
| 20/10 08:30 — [Run idées : modèles valence / éveil, visage et voix](runs/2026-10-20-0830-idees-modeles-va.md) | 💡 | 3 modèles VA officiels HSEmotion mesurés (B0 20 ms, MobileFaceNet 8 Mo 22 ms, MobileViT 73 ms) : se valent hors AffectNet → duo B0 + MBF (I126) ; EmoNet écarté (CC BY-NC-ND) ; voix : aucun modèle léger sous licence permissive (I128) ; journal seulement |
| 20/10 10:30 — [Duo de modèles du visage (I126)](runs/2026-10-20-1030-duo-modeles-visage.md) | 🔴🙂 | `mbf_va_mtl` (8 Mo, SHA-256) téléchargé après le B0, même pour qui l'a déjà ; `FaceAffect.Spec` (112 px, normalisation 0,5) + vecteurs Python ; valence = moyenne, `affectGap` → fourchette et « deux modèles d'accord » ; diagnostic « Second modèle » ; 114 JVM + 1 609 Vitest |
| 20/10 12:30 — [Sonde vocale dans le diagnostic (I124)](runs/2026-10-20-1230-sonde-vocale.md) | 🔴🙂 | `VoiceProbePlugin` (disponibilité, sur l'appareil, moteurs, langues fr-FR API 33) sans micro ; `voiceProbe.js` (verdict) ; diagnostic v5 `voice`, sonde à l'ouverture du Diagnostic ; 1 616 Vitest |
| 20/10 14:30 — [Habitudes et effets décalés sur l'humeur estimée](runs/2026-10-20-1430-habitudes-humeur-estimee.md) | 🔴🙂 | `computeTagEffects(…, { outcomeByDay })`, `computeLaggedEffects` sur l'humeur estimée sans piste, bloc dans la section visage ; stress (Y) exclu ; 1 621 Vitest |
| 20/10 16:30 — [Lectures du jour pondérées par leur qualité (I127)](runs/2026-10-20-1630-lectures-ponderees.md) | 🔴🙂 | `weightedMedian` + poids 1 / demi-largeur² (images valides, lacet, duo), n effectif de Kish dans la fourchette, « N lectures peu nettes comptées moins » ; même pondération dans `faceMoodDays` ; 1 625 Vitest |
| 20/10 18:30 — [Lumière du visage dans le poids des lectures (I127b)](runs/2026-10-20-1830-lumiere-visage.md) | 🔴🙂 | natif : `light` (médiane de la luminance des images valides) ; JS : ×1,15 hors [0,25 ; 0,8], « souvent dans la pénombre » ; `FACE_QUALITY_KEYS` hors de la porte ; 1 631 Vitest, 114 JUnit |
| 20/10 20:30 — [Mise à jour en un clic : progression et vérification (signalement 19:05)](runs/2026-10-20-2030-maj-telechargement.md) | 🚑 | Cause : APK 33,6 Mo chargé d'un bloc en base64 via le pont, sans délai ; `AppUpdatePlugin` (DownloadManager, notification, SHA-256 + paquet vérifiés), bandeau Mo / % / débit / reste, blocage 45 s, Réessayer, navigateur ; 1 640 Vitest, 118 JUnit ; PR #235 → **v188, 33,6 Mo** |
| 19/10 20:30 — [Idées : porte et dérives lentes, lire le diagnostic, voix et lexiques](runs/2026-10-19-2030-idees-porte-derives.md) | 💡 | Signalement 15:05 vérifié corrigé (v176/v177) ; simulation : porte 12,7 % de faux départs si humeur / visage autocorrélés → I121 (blocs ±7 j + n effectif ≈ 1–2 %) ; I122 arbre de lecture du diagnostic ; I123 « Applis jamais en veille » ; I124 sonde vocale ; FEEL / NRC écartés (licences) ; PR #223 |

---

## Charte

Ce dossier appartient à Claude. C'est sa mémoire entre deux exécutions de la routine
autonome (une toutes les 2 h) : chaque exécution démarre sans aucun souvenir et
**doit lire ce fichier en premier**. Claude peut et doit faire évoluer cette charte
quand il trouve une meilleure façon de travailler (en le notant dans le compte rendu du run).

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
4. Commit(s) clairs, push, PR vers `main` intitulée `[Auto] <résumé>`, corps = résumé du run.
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

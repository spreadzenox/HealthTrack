# Journal de bord de Claude — HealthTrack

## 📅 Semaine en cours — S42 (lundi 12 → dimanche 18 octobre 2026)

> Résumé tenu à jour à chaque run : **c'est ce que lit le propriétaire chaque semaine.**
> Le premier run d'une nouvelle semaine archive ce bloc dans `semaines/AAAA-Sww.md` et en ouvre un neuf.
> Semaine précédente : [`semaines/2026-S41.md`](semaines/2026-S41.md) (mise en place de la routine, v59 → v97).

**En bref** — Début de semaine tourné vers vos directions du 11/10 (brancher montres et apps, capter sans saisie).
**Depuis vos directives du 12/10, la routine a changé de cap** : plus de nouvelles fonctionnalités avant d'avoir fait,
dans l'ordre, le nettoyage (D1), la performance (D2), la connexion directe à la GT 6 Pro (D3), l'humeur par visage /
voix (D4), l'anti-circularité (D5) et une science personnelle sans normes imposées (D6). Premier pas livré : le nettoyage.
**Depuis le soir du 12/10, une priorité absolue passe avant tout** : faire de HealthTrack l'app qui parle directement à
votre GT 6 Pro, sans Huawei Santé ni Gadgetbridge. Premier pas livré à 22:30 : le **test de connexion directe** ;
deuxième pas (13/10 00:30) : l'assistant **« Libérer et appairer la montre »** ; troisième pas (13/10 02:30) :
**l'authentification** (« Connexion à la montre ») ; quatrième pas (13/10 04:30) : **la lecture des mesures** (pas, cœur,
SpO₂, FC repos, sommeil) à chaque connexion ; cinquième pas (13/10 06:30) : la **synchro automatique** à l'ouverture
de l'app ; sixième pas (13/10 10:30) : **phases du sommeil, VFC de la nuit et séances**.
**Vous avez essayé « Se connecter à la montre » sur votre vraie GT 6 Pro et renvoyé le journal (13/10 09:04) : merci,
c'est la première vraie donnée.** Elle dit que la montre parle **HiChain 3** (le protocole récent de Huawei), que les
premières étapes passent (lien, négociation, PIN reçu), et que ça **bloque juste après, quand la montre répond au
message d'appairage** : HealthTrack ne sait pas encore lire cette réponse. Ce run (11:04) a donc renforcé l'outil de
diagnostic pour **capter exactement ce que la montre renvoie** (sans aucune donnée sensible) ; le prochain journal que
vous enverrez me dira comment décoder cette réponse. Le run de 14:30 a creusé le sujet et **renforcé encore l'outil** :
quand la montre répond dans son nouveau format, l'app repère et nomme désormais les **champs** de sa réponse (sans
jamais leurs valeurs) — c'est exactement ce qu'il me faut pour écrire le décodage. Il a aussi confirmé, en étudiant
le protocole à fond, que **même Gadgetbridge ne sait pas encore connecter la GT 6 Pro** en direct : c'est un travail
de frontière, pas un retard de notre côté. **Ce qu'il me faut au prochain run : relancer « Se connecter à la
montre », puis « Enregistrer le journal » et me le transmettre.** Reste ensuite : écrire le décodage du nouveau format,
puis synchro app fermée, stress, VFC de journée.
Le run « idées » de 08:30 a tranché **comment relire la montre app fermée** (voir « Meilleures idées »).

**Nouveau dans l'app** (Plus → Nouveautés après la mise à jour en 1 clic)
- **Mes appareils** (Plus → Connecteurs, en haut) : HealthTrack repère tout seul les apps de montre et de santé du
  téléphone (Huawei Health, Samsung Health, Garmin, Zepp, Mi Fitness, Fitbit, Withings, Oura, Polar, Gadgetbridge… 19 apps)
  et dit pour chacune « Reçu » (date et types des dernières mesures), « En pause », « À brancher » (avec le réglage
  exact à activer) ou « Relayé » (Huawei Health quand Gadgetbridge envoie déjà). « Voir le guide » ouvre le bon guide,
  « Ouvrir Huawei Health » ouvre l'app en un tap. Avec votre GT 6 Pro : tant que Gadgetbridge n'envoie rien, la carte
  Huawei Health reste « À brancher ».
- **Capteurs Bluetooth** (Plus → Connecteurs, sous Health Connect et Withings) : « Rechercher autour de moi » trouve les
  appareils proches et les reconnaît tout seul par leur profil Bluetooth standard. Une **ceinture cardio** (Polar H10,
  Garmin HRM, Wahoo…) ou une **montre qui diffuse sa fréquence cardiaque** → « Mesurer ma VFC (5 min) » : pouls en direct,
  puis FC et VFC enregistrées (elles nourrissent « Votre cœur », le Radar et les analyses). Tensiomètres, balances,
  thermomètres, oxymètres sont déjà reconnus (« Bientôt »). Votre GT 6 Pro apparaît « Via son app » avec le guide Huawei.
- **Tensiomètre, balance, thermomètre, oxymètre Bluetooth** (même écran) : tout appareil au profil standard est
  « Compatible ». « Recevoir la mesure », vous faites la mesure, et tension + pouls, poids + masse grasse, température
  ou SpO₂ s'affichent puis s'enregistrent tout seuls (mesures en mémoire comprises, sans doublon).
- **Météo, pression et air** (Plus → Connecteurs) : un geste (« Utiliser ma position approximative » ou votre ville) et
  la température, le soleil, la pluie, la pression atmosphérique (et sa variation), la qualité de l'air et les pollens
  arrivent tout seuls chaque jour, 3 mois d'historique d'un coup. Les Analyses regardent si une pression qui chute, le
  pollen ou la pollution pèsent sur votre bien-être ; une puce « Météo » s'ajoute à chaque journée.
- **Ce que votre montre envoie vraiment** (Mes appareils) : chaque app liste ses mesures reçues (cœur, FC repos, VFC,
  SpO₂, sommeil, pas…). Si une mesure qui arrivait chaque jour s'arrête, un encadré jaune le dit (« VFC : plus rien
  depuis 4 jours ») avec quoi vérifier ; « Jamais reçu en 30 jours : SpO₂ » montre le partage qui manque.
- **Temps d'écran et sommeil** (Plus → Connecteurs, sous la météo) : « Activer », autoriser HealthTrack dans « Accès
  aux données d'utilisation » (guide pas à pas dans l'app), et chaque jour arrivent tout seuls le temps d'écran,
  l'écran tard (22 h–4 h) et les déverrouillages — puce « Écran » dans « Vos derniers jours », variables des Analyses.
  Les nuits **sans montre**, le sommeil est estimé d'après la plus longue période sans écran (« Sommeil (estimé) ») ;
  la montre passe toujours avant. Seuls les allumages / extinctions de l'écran sont lus, rien ne sort du téléphone.
- **Plus simple (nettoyage, étape 1)** : « Écran tard » n'est plus demandé au check-in quand « Temps d'écran » est
  activé — le téléphone le mesure (≥ 30 min après 22 h) et « Vos habitudes » s'en sert tout seul. La carte « Humeur
  estimée » (ajoutée plus tôt aujourd'hui) est **retirée** : elle doublait « Prédiction du jour » et devinait l'humeur à
  partir de vos comportements, ce que vos directives interdisent ; elle reviendra fondée sur le visage / la voix.
  L'onglet s'appelle « Analyses » partout ; Paramètres perd le lien Nouveautés en double et le mode debug à adresse MAC
  devient un simple interrupteur « Mode diagnostic ». Liste complète et raisons : compte rendu du run 16:30.
- **Plus simple (nettoyage, étape 2)** : Analyses → seules les corrélations nettes s'affichent, les ~35 « incertaines »
  sont repliées (« Voir les 35 liens incertains ») et « Écran tard » n'apparaît plus deux fois. Accueil → « + 1
  cigarette » n'apparaît que si vous en avez noté une ces 14 jours (Paramètres → Cigarettes pour l'épingler), les
  explications de calcul des cartes Radar / cœur / régularité sont repliées sous « Comment c'est calculé ». Withings →
  les identifiants se règlent dans sa carte des Connecteurs (plus dans Paramètres). Le conseil « horaires réguliers »
  devient une hypothèse générale que vos données confirmeront ou non (directive D6).
- **Montre Huawei en direct — le test** (Plus → Connecteurs, juste sous « Mes appareils ») : « Tester la connexion
  directe » déroule 7 étapes (Bluetooth, apps qui peuvent tenir la montre, recherche, connexion, services, canal Huawei,
  première trame du protocole) et conclut en clair (« La montre répond à HealthTrack », « La montre ne répond pas »…).
  **Rien n'est modifié sur la montre** (ni appairage, ni réinitialisation). « Enregistrer le journal » (dossier
  Documents) ou « Copier le journal » : c'est ce fichier qu'il me faut pour la suite.
- **Montre Huawei — libérer et appairer** (même carte, sous le test) : un encadré dit l'étape suivante et le geste qui
  la débloque. ① « Désinstaller Huawei Health » ouvre la boîte de désinstallation d'Android (vous confirmez) ou
  « Réglages de Huawei Health » pour lui retirer le Bluetooth ; ② réinitialisation guidée avec le menu officiel
  (Paramètres → Système et mises à jour → Réinitialiser) ; ③ « Appairer la montre » la cherche et lance l'appairage
  Android (s'il reste un ancien appairage, l'app vous envoie l'oublier dans les réglages Bluetooth) ; ④ relancer le test.
  **Plan B** « Garder Huawei Santé » : votre identifiant de compte Huawei (17 à 19 chiffres), gardé sur le téléphone.
- **Montre Huawei — connexion** (même carte, encadré « Connexion à la montre ») : une fois la montre libérée et
  appairée, « **Se connecter à la montre** » fait toute l'authentification comme le ferait Huawei Santé : la montre remet
  une clé à HealthTrack, gardée **sur le téléphone uniquement**, qui sert ensuite à chaque connexion. Le premier
  appairage a besoin de 3 constantes publiques : « **Télécharger les paramètres** » (un geste) ou les coller. Si la
  montre ne reconnaît plus la clé, « Refaire l'appairage ». Journal exportable sans clé ni PIN. **Vos mesures ne
  remontent pas encore** : c'est l'étape suivante.
- **Montre Huawei — vos mesures** (même encadré) : une fois connectée, chaque connexion lit la montre : **pas,
  calories, fréquence cardiaque, SpO₂, FC de repos et sommeil** (léger / profond) arrivent dans l'historique (source
  « Montre Huawei ») et nourrissent l'accueil, « Votre cœur » et les Analyses. 7 jours la première fois, puis seulement
  le nouveau, sans doublon. Le bouton devient « **Synchroniser la montre** ». « Mes appareils » dit alors que vos
  données passent par la montre en direct (Huawei Health n'est plus nécessaire pour elles).
- **Montre Huawei — synchro automatique** (même encadré) : une fois la montre connectée une première fois, plus besoin
  de toucher « Synchroniser la montre » : HealthTrack la relit **tout seul quand vous ouvrez l'app ou y revenez**, au
  plus toutes les 30 min. Une ligne dit quand et ce qui est arrivé (« 38 minutes → 9 mesures »). Montre loin ou
  Bluetooth coupé : rien en erreur, l'app réessaie plus tard (essais espacés jusqu'à 4 h). Clé refusée : synchro
  automatique en pause, la carte le dit.
- **Montre Huawei — sommeil détaillé, VFC, séances** (run 13/10 10:30, rien à toucher) : chaque synchro ramène aussi
  vos **nuits par phases** (léger, profond, paradoxal, réveils) avec le **score de sommeil** de la montre, la **VFC
  moyenne de la nuit** (« Votre cœur », Analyses) et vos **séances** (type, durée, calories, distance, pas, FC mini /
  maxi). Une nuit détaillée remplace le sommeil simple lu plus tôt pour la même nuit : rien n'est compté deux fois.
- **Montre Huawei — « Se connecter » dit où ça bloque** (run 13/10 11:04) : quand l'appairage s'arrête, l'écran nomme
  désormais l'étape et la raison exactes, et le journal que vous enregistrez contient de nouveaux détails techniques
  (toujours sans clé, sans PIN ni adresse) pour que je comprenne ce que votre GT 6 Pro attend. **Rien n'est modifié sur
  la montre.**
- **Montre Huawei — « Se connecter » repère les champs de la réponse** (run 13/10 14:30) : quand votre montre répond
  dans son nouveau format d'appairage, l'écran affiche les **champs repérés** dans sa réponse (« champs repérés :
  challenge, epk, salt »), et le journal en garde la structure complète (noms des champs seulement, jamais les valeurs).
  C'est précisément ce qu'il me faut pour écrire le décodage de votre montre au prochain run. **Rien n'est modifié sur
  la montre** : relancer « Se connecter à la montre » puis « Enregistrer le journal » suffit.
- **Montre Huawei — « Se connecter » donne aussi la taille des champs** (run 13/10 18:30) : à côté des noms, l'écran et
  le journal indiquent maintenant la **taille** de chaque champ (« challenge (16 o), epk (32 o), salt (16 o) »). C'est
  la pièce qui me manquait pour **décoder votre montre d'un seul journal**, sans avoir à vous en redemander un autre
  (les tailles disent quel champ est la clé publique, laquelle est la signature…). Toujours **sans aucune valeur** et
  **sans rien modifier sur la montre** : il suffit de relancer « Se connecter à la montre » puis « Enregistrer le
  journal » et de me le transmettre.
- **Radar forme qui connaît vos soirées** : avec « Alcool », « Sport le soir », « Repas tardif », « Stress » ou les
  nouveaux tags **« Voyage »** et **« Vaccin »** notés la veille ou le jour même, le Radar ne s'inquiète plus :
  « Probablement lié à… », badge « Explicable ». Avec « Malade », il confirme et rappelle quand consulter.
- **Capteurs Bluetooth plus fiables** : la mesure de VFC n'échoue plus sur un premier battement mal capté, un
  tensiomètre à l'horloge non réglée n'enregistre plus « en l'an 2000 », « Annuler » coupe vraiment la connexion.

**En coulisses**
- **Primitives crypto de la montre prêtes (run 13/10 16:30)** : les deux briques qui manquaient pour parler le nouveau
  protocole de la GT 6 Pro — **X25519** (échange de clés) et **Ed25519** (signatures) — sont écrites et vérifiées sur
  les vecteurs officiels (RFC). Elles s'appuient sur une bibliothèque libre reconnue (@noble/curves, licence MIT) plutôt
  que sur le moteur du navigateur, qui ne sait pas faire le calcul exact dont le protocole a besoin et dépendrait d'une
  version très récente de la WebView. **Rien de visible dans l'app** : c'est la fondation sur laquelle le prochain
  décodage s'écrira vite une fois votre journal reçu. (Une 3ᵉ brique, « Elligator2 », n'a **pas** été ajoutée à l'aveugle :
  sa forme exacte chez Huawei n'est pas publique ; on l'ajoutera quand la montre nous l'aura montrée.)
- **« New Auth Protocol » HiChain 3 étudié à fond (run 13/10 14:30)** : recherche dans le code libre (lecture seule,
  faits seulement, aucun code copié) + doc OpenHarmony. Trois enseignements : (1) 🩺 **même Gadgetbridge ne décode pas
  encore la GT 6 Pro** (sa couche moderne n'est activée que pour des Honor ; les Huawei GT 6 / GT 7 retombent sur
  l'ancien schéma, comme nous) ; (2) la réponse de 835 octets est au format « New Auth » (SPEKE / clés publiques et
  signatures Ed25519), d'où sa taille ; (3) le **PIN** se déchiffre bien en CBC pour cette montre (ça dépend d'un
  réglage de lien, pas du type 4) — l'ancienne hypothèse « passer le PIN en GCM » était **fausse**, rien à changer.
  Tout est consigné dans `protocoles/huawei.md` §6.8 (algorithmes, codes, champs) : la base pour écrire le décodage dès
  que le prochain journal donnera les noms de champs réels. L'instrument de diagnostic a été renforcé pour les révéler
  (champ `structure`, en-tête 32 octets, champs nommés à l'écran), avec une fausse montre « New Auth » pour les tests.
- **1er journal réel de la GT 6 Pro analysé (run 13/10 11:04)** : le journal du 13/10 09:04 est enregistré dans le dépôt
  (`diagnostics/2026-10-13-0904-gt6pro.json`). Il établit **HiChain 3** (type 4, chiffrement GCM, authVersion 1) et un
  blocage **au décodage de la réponse d'appairage (trame de 835 octets)**, sans code d'erreur. Nouvel analyseur
  `inspectHichainReply` : chaque réponse du protocole est résumée sans secret dans le journal (`report.hichain` :
  structure, code de message, noms des champs, 1ers octets si ce n'est pas du JSON). Spec `protocoles/huawei.md` §6.7.
  Hypothèse à confirmer au prochain journal : HiChain 3 (« New Auth Protocol ») a une réponse plus riche que l'ancien
  schéma ISO qu'on a implémenté (sa taille le suggère). Point ouvert noté : PIN à déchiffrer en GCM plutôt qu'en CBC
  pour le type 4.
- **Sommeil détaillé et séances (run 13/10 10:30)** : la montre envoie les nuits sous forme de **fichier** (protocole
  de téléchargement par blocs, décrit avec nos mots dans `protocoles/huawei.md` §7.6) ; HealthTrack demande d'abord à
  la montre **ce qu'elle sait faire** (§7.8) et saute ce qu'elle ne connaît pas. Cette liste de capacités est écrite
  dans le journal de connexion : c'est elle qui me dira, quand vous l'enverrez, ce que la GT 6 Pro accepte.
- **Synchro automatique (run 13/10 06:30)** : une seule connexion à la montre à la fois (la manuelle attend
  l'automatique), jamais de réappairage ni de constantes en automatique, rien tant que HealthTrack n'a pas sa clé.
  La synchro **app fermée** (tâche de fond Android) demandera du code natif : prochaine grosse étape après les sommeils
  détaillés / VFC.
- **Synchronisation (run 13/10 04:30)** : commandes de données décrites avec nos mots (`protocoles/huawei.md` §7 :
  minute par minute avec masques de champs, sommeil, heure, totaux), code écrit depuis cette spec, testé sur un exemple
  de trame et avec la fausse montre. Les mesures sont **agrégées à l'écriture** (pas / calories par heure, cœur par
  10 min) : l'historique reste léger, ce qui aide aussi la performance des courbes. Aucun changement de format de
  données : export / import inchangés.
- **Authentification (run 13/10 02:30)** : protocole HiChain (le même que Huawei Santé, issu d'OpenHarmony) réécrit
  de zéro d'après notre spécification (`protocoles/huawei.md` §6, recoupée avec le code Apache-2.0 d'OpenHarmony),
  chiffrement des échanges ensuite (AES-GCM / CBC), 1 050 tests dont une **fausse montre** qui joue l'autre côté. Bonne
  surprise : l'identifiant de groupe que Gadgetbridge garde en dur se calcule à partir de deux noms publics, donc
  **une seule constante Huawei** reste nécessaire, et seulement au premier appairage (déchiffrer le PIN). Elle n'est pas
  dans le code : l'app la télécharge sur votre téléphone depuis le projet libre huawei-lpv2 (MIT).
- **Libération et appairage (run 13/10 00:30)** : 3e plugin natif maison (`AppManagerPlugin.java` : boîte de
  désinstallation et page de l'app, nouvelle autorisation `REQUEST_DELETE_PACKAGES`, l'utilisateur confirme toujours)
  et `BtClassicPlugin` qui sait chercher en Bluetooth classique et demander l'appairage Android. Recherche : la GT 6 Pro
  est « en grande partie prise en charge » par Gadgetbridge depuis déc. 2025 et un contributeur l'utilise sans jamais
  l'avoir liée à Huawei Santé : la clé se négocie localement, sans compte ni service en ligne — bon signe pour nous.
- **Découverte clé (run 22:30)** : la GT 6 Pro ne parle pas en Bluetooth basse consommation mais en **Bluetooth
  « classique »** (comme les GT 3 à GT 7) ; elle doit donc être appairée à Android. HealthTrack a reçu son **2e plugin
  natif maison** (`BtClassicPlugin.java`, une connexion à la fois, rien gardé côté natif) ; le test essaie le classique
  puis le BLE. Le protocole est décrit avec nos mots dans `journal/protocoles/huawei.md` (sources citées, aucun code
  copié de Gadgetbridge) ; le code est écrit à partir de ce document, avec des tests sur trames d'exemple.
- Votre montre attend très probablement l'authentification « HiChain » ; l'étape d'authentification aura besoin de
  constantes publiées par un projet libre mais issues de l'app Huawei : **je vous demanderai votre accord** avant
  (ou une saisie unique sur le téléphone, jamais dans le dépôt).
- Détection sans code natif : le plugin déjà présent `@capacitor/app-launcher` + la liste des apps déclarée dans le
  manifeste Android (obligatoire depuis Android 11 ; un test vérifie que chaque app du catalogue y figure).
- Les mesures Health Connect gardaient déjà le nom de l'app d'origine : c'est lui qui dit quelle app envoie vraiment.
- Lint : 18 → 6 erreurs (caractères invisibles dans les guides de montres).
- Première brique de la **couche Bluetooth générique** : chaque appareil est identifié par son empreinte (nom, services,
  fabricant — jamais son adresse), puis un registre de « pilotes » choisit quoi en faire. Ajouter un appareil = ajouter un
  pilote, pas une liste de modèles. Les appareils inconnus sont notés sur le téléphone pour les prendre en charge plus tard.
- Sur Android 12+, la recherche Bluetooth ne demande **pas** la position (seulement « Appareils à proximité »).
- Météo : seule une position arrondie à ≈ 10 km part vers Open-Meteo (gratuit, sans compte), aucune donnée de santé.
  L'app demande l'autorisation de position **approximative** seulement, et seulement si vous touchez le bouton.
- Une relecture complète du code Bluetooth des derniers jours a trouvé 6 bugs invisibles à l'écran (courses
  d'annulation, horloges d'appareils) : tous corrigés avec un test. Je referai cette relecture après chaque gros chantier.
- Premier **plugin natif maison** (`PhoneUsagePlugin.java`, quelques dizaines de lignes, aucune dépendance) : le modèle
  pour les prochaines captures du téléphone (pas sans montre, montre appairée identifiée par son nom…).
- « Qui envoie quoi » : une mesure est « habituelle » si elle arrive au moins 7 jours sur 14 ; alerte après 3 jours
  sans rien — une pesée ou une séance ne déclenche donc jamais d'alerte.
- Humeur estimée : l'estimation ne **pré-remplit pas** le check-in, volontairement — une note pré-remplie serait
  souvent validée telle quelle et l'app apprendrait sa propre réponse. Elle tourne entièrement sur le téléphone.
- Le workflow **Tests** de main était rouge par intermittence (un test de la page Nutrition qui lisait un libellé du
  formulaire juste avant sa fermeture ; aucun impact sur l'app, l'APK était bien publié). Cause trouvée et corrigée (#110).

**Points d'attention**
- **Visage « dès le déverrouillage » (run idées 13/10 08:30)** : Android 14+ refuse qu'une app démarre la caméra depuis
  l'arrière-plan, et rien de fiable ne montre que la commande `appops … CAMERA allow` (Shizuku / ADB) lève ce verrou.
  Je le **testerai** sur votre A56 avec un écran de diagnostic comme vous l'avez demandé, mais la voie sûre sera : un
  service lancé depuis l'app (ou depuis une notification), voyant vert visible. Autre fait : les études publiées
  trouvent un lien **modeste** entre visage et humeur chez un individu ; l'app montrera donc une tendance sur 7 jours,
  pas une note à l'instant.
- **🎯 Nouveau (13/10 04:30)** : si la connexion réussit, l'étape « Lecture des mesures » dit combien de minutes et de
  nuits ont été lues. Comparez un jour avec Huawei Santé (pas, FC) : si les **calories** ou les pas semblent faux d'un
  facteur 10 ou 1 000, dites-le-moi (l'unité exacte n'est pas documentée).
- **🎯 Nouveau (13/10 02:30) — à essayer quand vous voulez passer à HealthTrack seule** : après « Libérer et appairer »
  (réinitialisation + appairage Android), « Connexion à la montre » → « Télécharger les paramètres » → « Se connecter à
  la montre ». Puis **Enregistrer le journal** et déposez-le dans `journal/diagnostics/` : rien n'a encore été essayé
  sur une vraie GT 6 Pro, le journal me dira à quelle étape ça coince. Tant que la synchro des mesures n'est pas là
  (prochains runs), le plan B « Garder Huawei Santé » reste possible.
- **Décision à valider** : pour respecter « jamais de clé d'app constructeur dans le dépôt », l'app **télécharge** les 3
  constantes du PIN depuis GitHub (huawei-lpv2, licence MIT) d'un geste de votre part, au lieu de les embarquer. C'est
  la seule requête réseau de l'étape, elle n'envoie aucune donnée. Si vous préférez que je les intègre à l'app, dites-le.
- **🎯 Nouveau (après le test)** : si le test dit « La montre ne répond pas », suivez l'encadré « Libérer et appairer
  la montre ». **Avant de réinitialiser**, sachez que les mesures pas encore synchronisées sur la montre seront perdues
  (celles de Huawei Santé y restent) et que **HealthTrack ne lit pas encore vos données** (authentification et synchro :
  prochains runs). Si vous préférez attendre, choisissez « Garder Huawei Santé » et ne réinitialisez rien pour l'instant.
  Dites-moi si la montre a demandé un mot de passe / compte Huawei après réinitialisation (non documenté).
- **🎯 À faire en priorité (2 minutes)** : mettez à jour, montre au poignet près du téléphone, puis Plus → Connecteurs →
  « Montre Huawei en direct » → **Tester la connexion directe**, puis **Enregistrer le journal** et déposez le fichier
  `healthtrack-diagnostic-montre-….json` dans le dépôt (`journal/diagnostics/`) ou envoyez-le-moi. Il dit si la montre
  répond en Bluetooth classique, et surtout **quelle méthode d'authentification elle attend** : tout le reste en dépend.
  Le test n'a pas besoin de couper Huawei Santé ; ne dissociez pas la montre dans Huawei Santé.
- **À essayer** : Connecteurs → « Temps d'écran et sommeil » → Activer. Dites-moi si Android a affiché « Paramètre
  restreint » (le guide explique quoi faire) et si la « Nuit estimée » du lendemain matin colle à votre nuit réelle.
- **Votre avis compte pour le nettoyage** : s'il y a un écran, une carte ou une question que vous ne regardez jamais,
  dites-le ; la liste de ce que je compte encore retirer ou fusionner est dans `BACKLOG.md` › D1.
- « Mes appareils » n'a été vérifié que sur captures simulées : **dites-moi ce que la carte affiche sur votre A56**
  (Huawei Health doit apparaître ; si une app manque ou si une app est mal nommée, c'est à corriger).
- **À essayer avec la GT 6 Pro** : lancez une séance, activez sur la montre la diffusion / le partage de la fréquence
  cardiaque, puis Connecteurs → Capteurs Bluetooth → Rechercher. Si elle apparaît « Compatible », c'est la première
  donnée **brute** de la montre qui arrive sans passer par une autre app. Dites-moi ce qui s'affiche (et le nom exact du
  réglage sur la montre).
- Si vous avez un **tensiomètre, une balance ou un thermomètre Bluetooth**, essayez « Recevoir la mesure » : la lecture
  suit la norme Bluetooth mais n'a pas encore été testée sur un vrai appareil. Dites-moi la marque et ce qui s'affiche.
- **À essayer** : activez « Météo, pression et air » et dites-moi si votre ville et la météo du jour s'affichent bien.
- **À surveiller (2027)** : Google impose la « vérification des développeurs » pour installer une app hors Play Store
  (déjà en vigueur dans 4 pays, partout en 2027). Bonne nouvelle (run idées 20:30) : il existe un compte développeur
  **« distribution limitée » gratuit, sans pièce d'identité, jusqu'à 20 téléphones**, et sinon un « parcours avancé »
  à faire une seule fois sur votre téléphone (mode développeur, 24 h d'attente). La mise à jour en 1 clic restera
  donc possible ; **à décider ensemble avant 2027** (rien à faire aujourd'hui).
- **Votre GT 6 Pro et Huawei Santé** : la cause la plus probable de l'échec de connexion, même avec Gadgetbridge, est
  documentée : une montre **liée à Huawei Santé refuse les autres apps** (« Authentication key negotiation failed »).
  La solution la plus simple sera de réinitialiser la montre puis de l'appairer **uniquement** à HealthTrack. **Ne
  faites rien pour l'instant** : l'écran de diagnostic (prochains runs) le confirmera d'abord et vous guidera pas à pas.
- **Question GT 6 Pro** : si vous passez par Gadgetbridge, la **VFC** arrive-t-elle ? L'app le dit maintenant toute
  seule : Plus → Connecteurs → Mes appareils, ligne Gadgetbridge (« … VFC … » dans la liste, ou « Jamais reçu en 30
  jours : VFC »). Les retours d'utilisateurs ne la mentionnent jamais pour ce modèle.

**Meilleures idées des runs « idées »** (détail, sources et notes dans [`IDEES.md`](IDEES.md))
- **La montre relue sans ouvrir l'app** (run 13/10 08:30) : Android sait prévenir une app quand une montre Bluetooth
  « classique » se connecte (« appareil compagnon »), même app fermée, et l'autorise alors à travailler en fond. Plan :
  vous confirmez une fois « associer la montre », puis à chaque reconnexion (et toutes les heures en secours)
  HealthTrack relit la montre en quelques secondes. Le petit moteur de lecture sera réécrit en Java, car le JavaScript
  ne peut pas tourner app fermée avec le chiffrement nécessaire. Sur Samsung, il faudra mettre HealthTrack en batterie
  « Sans restriction » **et** dans « Applis jamais en veille » (l'app vous guidera seulement si la synchro échoue).
- **Une seule réponse par jour** (run 13/10 08:30) : ce que les gens reprochent aux « coachs IA » (Whoop, Garmin), c'est
  un texte générique et des **chiffres inventés**. Idée : un briefing du matin unique (un état, une ou deux causes
  chiffrées tirées de **vos** habitudes, une piste), écrit par des gabarits — jamais un chiffre inventé — qui remplace
  plusieurs cartes de l'accueil. Et un **mode calme** : des tendances sur 7 / 30 jours au lieu d'une note par nuit,
  contre l'anxiété du score.
- **Une question du soir, pas un formulaire** (run 13/10 08:30) : l'app ne pose qu'une question, celle qui l'aide le
  plus à trancher un lien encore incertain, et vous répondez d'un tap depuis la notification.
- **Radar expliqué** : si la FC repos monte après un verre ou un sport tardif, l'app dira « probablement lié à hier
  soir » au lieu de sonner l'alerte — le reproche n° 1 fait aux alertes maladie des montres.
- **« Qui envoie quoi »** : pour chaque montre / app, quelles mesures arrivent vraiment, et une alerte si l'une
  s'arrête (« plus de VFC depuis 4 jours »).
- **Votre sommeil sans montre** : estimé par le téléphone (écran éteint, charge), plus le temps d'écran du soir.
- **« Dans votre plage habituelle »** : une estimation d'humeur à la Emobot / Sahha (écart à vos habitudes de sommeil,
  pas, écran tard, sorties), calibrée par vos check-ins, jamais un diagnostic.
- **Briefing du matin** : une carte « Votre journée » (nuit, cœur, pression / pollen, énergie prévue) et **une** action.
- **Racontez votre journée** (dictée) → tags, cafés, verres, symptômes remplis tout seuls, confirmés en 1 tap.
- **Bague Colmi (~35 €)** : une des rares bagues au protocole Bluetooth documenté sous licence libre (MIT) → données brutes
  sans app ni compte. Idée de matériel bon marché pour compléter la montre (sommeil, SpO₂ la nuit).
- **Humeur par le visage, sans photo gardée** (run 20:30) : un petit modèle libre (8 Mo) lit le **sourire** et le
  ressenti (agréable / désagréable) quelques secondes quand vous ouvrez l'app, puis ne garde que 3 nombres. Une étude
  2025 (233 personnes) montre que le sourire pendant l'usage du téléphone suit très bien le bien-être. Android
  interdit d'allumer la caméra en arrière-plan au déverrouillage : la capture se fera pendant l'usage de l'app.
- **Une seule dictée le soir à la place du formulaire** : vous racontez votre journée, l'app en tire votre note, les
  tags, et des indices de la voix (débit, énergie), puis efface l'audio.
- **Votre cas vs « en général »** : chaque lien montrera son sens **chez vous**, la norme générale en petit (« en
  général : moins d'écran le soir aide — chez vous : c'est l'inverse, sur 62 jours »), sans jamais vous culpabiliser.
- **Réseaux sociaux** : le temps passé par app (Instagram, TikTok…) deviendra un **facteur** testé contre votre humeur,
  jamais un ingrédient de l'estimation (sinon le lien serait tautologique).
- Bon à savoir : Gadgetbridge 0.95 est sorti aujourd'hui (tension → Health Connect, export des séances). Gemini Nano
  (IA hors ligne de Google) n'est **pas** disponible sur le Galaxy A56.

**Prochaines priorités** — **la montre d'abord** (priorité absolue du 12/10 au soir) : étapes (a) diagnostic et
(b) libération + appairage, (c) authentification ISO, (d) lecture des mesures et synchro automatique livrées. Blocage
réel : la GT 6 Pro répond à l'appairage dans son **nouveau format (« New Auth Protocol »)** que l'ancien schéma ne lit
pas. **Dès que vous renvoyez un journal** (relancer « Se connecter à la montre » → « Enregistrer le journal »), l'app
me donnera les **noms ET les tailles des champs** de cette réponse (depuis le run 18:30) ; le run suivant écrira alors
le **décodage du nouveau format d'un seul journal**, sans second aller-retour. Les briques de base de ce décodage
(X25519 / Ed25519) sont **déjà en place depuis le run 16:30** : il ne restera qu'à les assembler dans le bon ordre
d'après votre journal. Puis synchro app fermée, stress / VFC de journée. Ensuite :
performance des courbes, restes du nettoyage, humeur par le visage / la voix.

| Run | Type | Résultat |
|---|---|---|
| 12/10 00:30 — [Mes appareils](runs/2026-10-12-0030-mes-appareils.md) | 🏗️ | PR #107 fusionnée → v98 |
| 12/10 02:30 — [Capteurs Bluetooth](runs/2026-10-12-0230-capteurs-bluetooth.md) | 🏗️ | PR #108 fusionnée → v99 |
| 12/10 04:30 — [Mesures Bluetooth](runs/2026-10-12-0430-mesures-bluetooth.md) | 🏗️🐛 | PR #109 fusionnée → v100, PR #110 (test instable) |
| 12/10 06:30 — [Météo automatique + bugs BLE](runs/2026-10-12-0630-meteo-automatique.md) | 🐛🏗️ | PR #111 fusionnée → v102 |
| 12/10 08:30 — [Idées : téléphone, bagues, action](runs/2026-10-12-0830-idees-telephone-bagues-action.md) | 💡 | 17 idées (I22–I38), journal seul |
| 12/10 10:30 — [Qui envoie quoi + Radar expliqué](runs/2026-10-12-1030-qui-envoie-quoi-radar-explique.md) | 🏗️ | PR #113 fusionnée → v103 |
| 12/10 12:30 — [Temps d'écran + sommeil par le téléphone](runs/2026-10-12-1030-temps-ecran-sommeil-telephone.md) | 🏗️ | PR #114 fusionnée → v104 |
| 12/10 14:30 — [Humeur estimée](runs/2026-10-12-1230-humeur-estimee.md) | 🏗️🐛 | PR #115 fusionnée → v105 (+ test Nutrition instable corrigé) |
| 12/10 16:30 — [Directives du 12/10 + nettoyage](runs/2026-10-12-1430-nettoyage-directives.md) | 🧹 | PR #117 fusionnée → v106 |
| 12/10 18:30 — [Nettoyage, étape 2](runs/2026-10-12-1630-nettoyage-etape-2.md) | 🧹 | PR #119 fusionnée → v107 |
| 12/10 20:30 — [Idées : montre en direct, visage / voix, science perso](runs/2026-10-12-2030-idees-directives.md) | 💡 | 10 idées (I39–I48), 2 tests instables corrigés — PR #121 fusionnée → v108 |
| 12/10 22:30 — [Priorité montre : test de connexion directe](runs/2026-10-12-2230-montre-diagnostic.md) | ⌚🏗️ | PR #123 fusionnée → v109 |
| 13/10 00:30 — [Montre : libérer et appairer](runs/2026-10-13-0030-montre-liberer-appairer.md) | ⌚🏗️ | PR #125 fusionnée → v110 |
| 13/10 02:30 — [Montre : authentification HiChain](runs/2026-10-13-0230-montre-authentification.md) | ⌚🏗️ | PR #127 fusionnée → v111 |
| 13/10 04:30 — [Montre : lecture des mesures](runs/2026-10-13-0430-montre-synchro.md) | ⌚🏗️ | PR #129 fusionnée → v112 |
| 13/10 06:30 — [Montre : synchro automatique](runs/2026-10-13-0630-montre-synchro-auto.md) | ⌚🏗️ | PR #131 fusionnée → v113 |
| 13/10 08:30 — [Idées : montre app fermée, humeur réaliste, une réponse par jour](runs/2026-10-13-0830-idees-montre-fond-une-reponse.md) | 💡 | 8 idées (I49–I56), journal seul |
| 13/10 10:30 — [Montre : sommeil détaillé, VFC, séances](runs/2026-10-13-1030-montre-sommeil-seances.md) | ⌚🏗️ | PR #134 fusionnée → v114 |
| 13/10 11:04 — [Montre : 1er journal réel GT 6 Pro + analyseur HiChain](runs/2026-10-13-1104-montre-hichain-journal-reel.md) | ⌚🏗️ | PR #136 fusionnée → v115 |
| 13/10 14:30 — [Montre : champs de la réponse HiChain 3 + spec New Auth](runs/2026-10-13-1250-montre-hichain3-champs.md) | ⌚🏗️ | PR #138 fusionnée → v116 |
| 13/10 16:30 — [Montre : primitives crypto New Auth (X25519 / Ed25519)](runs/2026-10-13-1430-montre-crypto-newauth.md) | ⌚🏗️ | PR #140 fusionnée → v117 |
| 13/10 18:30 — [Montre : taille des champs de la réponse New Auth](runs/2026-10-13-1830-montre-tailles-champs-newauth.md) | ⌚🏗️ | PR #142 fusionnée → v118 |

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
| `protocoles/<famille>.md` | Spécifications de protocoles d'appareils, écrites avec nos mots (sources citées) : le code des pilotes est écrit à partir d'elles |

---

## 000. PRIORITÉ ABSOLUE (propriétaire, 12 octobre 2026 au soir) — la montre d'abord

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

## 00. Directives du propriétaire (12 octobre 2026) — priment sur tout le reste, sauf la priorité absolue (§000)

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

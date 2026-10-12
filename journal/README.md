# Journal de bord de Claude — HealthTrack

## 📅 Semaine en cours — S42 (lundi 12 → dimanche 18 octobre 2026)

> Résumé tenu à jour à chaque run : **c'est ce que lit le propriétaire chaque semaine.**
> Le premier run d'une nouvelle semaine archive ce bloc dans `semaines/AAAA-Sww.md` et en ouvre un neuf.
> Semaine précédente : [`semaines/2026-S41.md`](semaines/2026-S41.md) (mise en place de la routine, v59 → v97).

**En bref** — Début de semaine tourné vers vos directions du 11/10 (brancher montres et apps, capter sans saisie).
**Depuis vos directives du 12/10, la routine a changé de cap** : plus de nouvelles fonctionnalités avant d'avoir fait,
dans l'ordre, le nettoyage (D1), la performance (D2), la connexion directe à la GT 6 Pro (D3), l'humeur par visage /
voix (D4), l'anti-circularité (D5) et une science personnelle sans normes imposées (D6). Premier pas livré : le nettoyage.

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
- **Radar forme qui connaît vos soirées** : avec « Alcool », « Sport le soir », « Repas tardif », « Stress » ou les
  nouveaux tags **« Voyage »** et **« Vaccin »** notés la veille ou le jour même, le Radar ne s'inquiète plus :
  « Probablement lié à… », badge « Explicable ». Avec « Malade », il confirme et rappelle quand consulter.
- **Capteurs Bluetooth plus fiables** : la mesure de VFC n'échoue plus sur un premier battement mal capté, un
  tensiomètre à l'horloge non réglée n'enregistre plus « en l'an 2000 », « Annuler » coupe vraiment la connexion.

**En coulisses**
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
  (déjà en vigueur au Brésil, en Indonésie, à Singapour et en Thaïlande depuis le 30/09/2026, partout en 2027). La mise
  à jour en 1 clic de HealthTrack pourrait être concernée ; j'étudie les options au prochain run idées.
- **Question GT 6 Pro** : si vous passez par Gadgetbridge, la **VFC** arrive-t-elle ? L'app le dit maintenant toute
  seule : Plus → Connecteurs → Mes appareils, ligne Gadgetbridge (« … VFC … » dans la liste, ou « Jamais reçu en 30
  jours : VFC »). Les retours d'utilisateurs ne la mentionnent jamais pour ce modèle.

**Meilleures idées des runs « idées »** (détail, sources et notes dans [`IDEES.md`](IDEES.md))
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
- Bon à savoir : Gadgetbridge 0.95 est sorti aujourd'hui (tension → Health Connect, export des séances). Gemini Nano
  (IA hors ligne de Google) n'est **pas** disponible sur le Galaxy A56.

**Prochaines priorités** (vos directives du 12/10) — nettoyage étapes 1 et 2 faites ; prochain run : **mesurer** la
lenteur des courbes et l'éliminer ; puis l'écran de diagnostic de la GT 6 Pro avec export des journaux, première étape
de la connexion directe sans Gadgetbridge. Les derniers restes du nettoyage (un seul bloc « Forme » sur l'accueil,
Connecteurs triés par statut) se feront en passant.

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
| 12/10 18:30 — [Nettoyage, étape 2](runs/2026-10-12-1630-nettoyage-etape-2.md) | 🧹 | PR en cours |

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

---

## 00. Directives du propriétaire (12 octobre 2026) — priment sur tout le reste

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
3. **D3 — Montre Huawei en direct, sans app tierce.** La GT 6 Pro ne se connecte pas, même avec Gadgetbridge.
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

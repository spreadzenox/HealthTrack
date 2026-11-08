# Garmin et Samsung : ce qui arrive, ce qui manque, comment l'obtenir (INTEG-1)

> Décision (B) du propriétaire du 07/11 : intégrations dans l'ordre Garmin et Samsung, puis Withings, Huawei,
> Xiaomi. Ce qui arrive par Health Connect se prend là ; l'accès direct sert à ce qui y manque. Garde-fous :
> coexistence avec l'app du fabricant, jamais le mot de passe d'un autre service, jamais de code décompilé ni de clé
> extraite, secrets d'API sur le relais seulement, données lues par le téléphone quand l'API le permet, sinon relais
> de passage sans stockage ; tout stockage serveur de données de santé (HDS) attend l'accord du propriétaire.
>
> Première version : run « idées » du 08/11 08:35. Sources consultées le 08/11 (liste en bas). Rien n'a été testé sur
> un vrai appareil : chaque ligne marquée « à vérifier » se confirme avec une montre réelle (P-INTEG, plus bas).

## 1. Ce que Halcya lit déjà par Health Connect

`app/src/connectors/HealthConnectConnector.js` lit : pas, sommeil, FC, FC au repos, VFC, SpO₂, calories, distance,
entraînements, puis respiration, température corporelle, tension, glycémie, poids, masse grasse. **Pas lus
aujourd'hui** alors que Health Connect les expose : étages (`FloorsClimbed`), température cutanée
(`SkinTemperature`, Android 15+), cycle (`MenstruationPeriod`, `MenstruationFlow`), VO₂ max (`Vo2Max`). Ajouter un
type lu est une petite étape de code, mais une nouvelle donnée collectée : Sécurité des données, confidentialité et
déclaration Health Connect à mettre à jour (règle du jalon 6). En mode polish, c'est une proposition au
propriétaire, sauf si on la range sous (B).

## 2. Samsung (Galaxy Watch, Galaxy Ring ; ≈ 8 % des utilisateurs probables)

### Par Health Connect (déjà pris)
Samsung Health écrit dans Health Connect les pas, le sommeil avec phases, la FC, la SpO₂, les entraînements, le
poids (`PERSONAS.md`, config. 4). **N'y écrit pas** : FC au repos, VFC, température cutanée, tension, Energy Score.

### Samsung Health Data SDK (sur le téléphone)
- Kit Android qui lit directement le magasin de Samsung Health sur le téléphone. Types lisibles (page officielle) :
  glycémie, SpO₂, tension, composition corporelle, température corporelle, **Energy Score**, exercice et tracé,
  étages, FC, notification de rythme irrégulier, nutrition, **température cutanée**, sommeil, apnée du sommeil, pas,
  hydratation, résumé d'activité, profil.
- **Pas de VFC** dans la liste officielle (seuls des agrégateurs l'annoncent : non confirmé). Pas de FC au repos
  explicite (à vérifier : peut-être dans le résumé d'activité ou calculable depuis la FC nocturne).
- Conditions : Samsung Health ≥ 6.30.2, Android 10+, pas d'émulateur. **Lecture sans code d'accès**, mais une app
  distribuée doit être **enregistrée par Samsung** (« partnership request » : package et empreinte SHA-256 de la
  clé de signature) ; sans enregistrement, le kit renvoie `AuthorizationException`. Le mode développeur de Samsung
  Health (7 touches sur la version dans À propos) contourne la vérification pour tester, jamais pour les
  utilisateurs.
- Données lues **par le téléphone** : aucun relais, aucun secret, conforme aux garde-fous. Coexistence parfaite (on
  lit ce que Samsung Health a déjà).
- Gain réel pour Halcya : température cutanée nocturne (facteur X du cycle et du sommeil), Energy Score (à présenter
  comme la mesure de Samsung, jamais mêlé à notre bien-être : règle 5, ce n'est qu'un X), tension, étages.
- **Geste du propriétaire** : la demande de partenariat (formulaire du site Samsung Developers, compte Samsung).
  Empreinte à donner : celle de la clé de signature de Google Play (Play Console → Intégrité de l'app → Signature de
  l'app → SHA-256), pas celle de la clé d'envoi. Délai annoncé par des tiers : 5 à 15 jours ouvrés (non officiel).

### Samsung Health Sensor SDK (sur la montre)
- Kit Wear OS pour une app installée **sur la Galaxy Watch** : FC continue, **intervalles entre battements (IBI)**,
  température cutanée, accéléromètre, selon le modèle. Les IBI permettent de **calculer nous-mêmes la VFC** (RMSSD
  nocturne), ce qu'aucune autre voie Samsung ne donne.
- Coût : une app montre à écrire et maintenir, une batterie à ménager (mesure la nuit seulement), et le même
  enregistrement par Samsung pour distribuer. Effort élevé ; à garder en piste 2, après le Data SDK.

### Rétro-ingénierie
Aucune piste utile : la montre est un appareil Wear OS appairé à Galaxy Wearable, chiffré, et la remplacer casserait
la coexistence. Les kits officiels suffisent.

## 3. Garmin (≈ 5 % sur Android et iPhone)

### Par Health Connect (déjà pris)
Garmin Connect écrit (page d'aide Garmin, citée par la presse en mai 2025) : masse grasse, calories, **étages**, FC,
sommeil, pas et distance, poids ; et les entraînements (calories, distance, dénivelé, FC). Transfert à sens unique.
`PERSONAS.md` donne aussi la FC au repos : **à vérifier** sur un vrai compte. **N'y écrit pas** : VFC, stress, Body
Battery, SpO₂, respiration, température, VO₂ max.

### Garmin Connect Developer Program (rouvert en octobre 2026, trois niveaux)
| Niveau | Accès | Livraison | Historique | Utilisateurs |
|---|---|---|---|---|
| Personnel | Clé API créée par la personne dans les réglages de Garmin Connect, sans demande ni validation | **Lecture à la demande (pull)** | à confirmer | son propre compte |
| Starter | Entreprise validée, gratuit d'après la presse | **Envoi par Garmin vers notre serveur (push) seulement** | aucun | limité (≈ 1 000 selon la presse) ; étiquette « non vérifiée » pendant l'examen |
| Enterprise | Contrat négocié | push ou ping/pull | ≥ 1 mois | illimité |

Données de la Health API : résumés quotidiens, sommeil, **VFC**, **stress**, **Body Battery**, SpO₂, respiration,
température cutanée, composition corporelle, plus la Women's Health API (cycle). Interdit : entraîner une IA avec ces
données (Halcya n'en entraîne aucune).

Lecture au regard des garde-fous :
- **Starter = push** : Garmin envoie les données à notre serveur dès qu'elles existent, quand le téléphone n'est pas
  forcément là. Pour les remettre au téléphone, le relais devrait les **garder** jusqu'à ce que l'app les réclame :
  c'est un stockage de données de santé sur un serveur, donc HDS, donc **accord du propriétaire requis**. Variante
  sans stockage : le relais ne garde que l'avis « nouvelles données » (identifiant et date, pas la valeur) et
  l'app va chercher la valeur au moment de la synchro ; possible seulement en ping/pull (Enterprise). À trancher.
- **Personnel = pull par le téléphone** : l'app pourrait lire directement les données de la personne avec **sa
  propre clé** (pas un mot de passe : une clé qu'elle crée et révoque elle-même chez Garmin), sans relais, sans
  stockage, sans partenariat. Parcours plus technique (copier une clé), mais immédiat et conforme. Bonne voie pour
  la persona « Tout mesurer » et le propriétaire ; à vérifier : conditions d'usage de la clé personnelle par une app
  tierce, en-têtes et points d'accès (documentation du niveau personnel, à lire avant tout code).

### Rétro-ingénierie
Le protocole Bluetooth des montres Garmin est connu (Gadgetbridge le parle), mais une montre Garmin ne s'appaire
qu'à une seule app : la lire en direct impose de quitter Garmin Connect. **Contraire à la coexistence : écarté.**
Les fichiers FIT exportés à la main depuis Garmin Connect (format public, kit FIT gratuit) restent une voie
d'import ponctuel sans rétro-ingénierie : proposition possible pour « Tout mesurer ».

## 4. Ordre proposé (à valider par le propriétaire, ce sont des fonctions)

1. **Lire dans Health Connect ce qui y est déjà** : étages, température cutanée, cycle (petit, utile à toutes les
   montres ; Sécurité des données à jour). Proposition avec maquette de l'écran Sources.
2. **Samsung Health Data SDK** : température cutanée, Energy Score, tension ; dépend de la demande de partenariat
   (geste du propriétaire, à préparer pas à pas dans `PRODUIT.md` § 4).
3. **Garmin, clé personnelle** : VFC, stress, Body Battery, SpO₂ lus par le téléphone ; après lecture de la
   documentation du niveau personnel et de ses conditions.
4. **Garmin Starter/Enterprise** : seulement si le propriétaire accepte un hébergement HDS ou si l'Enterprise
   (ping/pull) est obtenu ; sinon attendre.
5. **Samsung Sensor SDK** (VFC calculée sur la montre) : plus tard.

## 5. À vérifier avec un vrai appareil (P-INTEG)
- Garmin → Health Connect : FC au repos présente ? sommeil avec phases ? (un compte Garmin réel suffit)
- Samsung Data SDK en mode développeur : FC au repos ou VFC quelque part ? fréquence de la température cutanée ?

## Sources (consultées le 08/11/2026)
- Samsung Health Data SDK, présentation et types : https://developer.samsung.com/health/data/overview.html
- Processus, mode développeur, vérification : https://developer.samsung.com/health/data/process.html ,
  https://developer.samsung.com/health/data/guide/developer-mode.html ,
  https://developer.samsung.com/health/data/guide/app-verification.html , https://developer.samsung.com/health/data/faq.html
- Notes de version du Data SDK (v1.1.0, 12/03/2026) : https://developer.samsung.com/health/data/release-note.html
- Garmin → Health Connect : https://www.tomsguide.com/wellness/fitness-trackers/garmin-clarifies-what-data-its-sharing-with-google-health-connect-heres-the-full-list ,
  https://www.androidcentral.com/wearables/garmin/heres-everything-garmin-will-and-wont-share-with-google-health-connect
- Programme Garmin : https://developer.garmin.com/gc-developer-program/overview ,
  https://the5krunner.com/2026/10/22/garmin-personal-api/ (mis à jour le 30/10/2026),
  https://openwearables.io/blog/garmin-connect-developer-program-reopened
- Page Health API de Garmin : 404 le 08/11 (lien ancien) ; à relire depuis la page du programme.

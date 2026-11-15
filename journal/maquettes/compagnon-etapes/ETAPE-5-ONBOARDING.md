# Refonte « Compagnon », étape 5 (Onboarding) : préparation

> Écrit par le run « idées » du 15/11 à 08:35, pendant la build macOS de #1005. Relevé du code de main à 44f4107
> (v1080). Le brief fait foi (`../compagnon/BRIEF-REFONTE-COMPAGNON.md` § 3.2, § 3.4, § 10.5) ; les textes exacts des
> 4 temps sont dans `../compagnon/specs/comprendre.SPEC.md` § 4. Ce qui suit est une proposition de découpage, pas
> une décision : les points marqués **À trancher** sont des choix que le run de code fera et dira au propriétaire.

## 1. L'accueil d'aujourd'hui (`app/src/pages/Onboarding.jsx`, 933 lignes)

`stepsFor()` (`services/onboardingFlow.js`) donne jusqu'à 7 étapes et 9 écrans. Captures du jour (412 px, clair,
installation vide) : [objectifs](../../runs/captures/2026-11-15-0835-onboarding-actuel-objectifs.png) ·
[sources](../../runs/captures/2026-11-15-0835-onboarding-actuel-sources.png).

| Étape | Écran | Ce qu'il fait | Sort à l'étape 5 |
|---|---|---|---|
| `tuto` (3 cartes) | `TutoStep` | À quoi sert Halcya ; les 4 onglets expliqués (`TABS_EXPLAINED`) ; ce qui quitte le téléphone (`DATA_LEAVES`) | **À trancher** (§ 4, A) |
| `goal` | `GoalStep` | 4 cases : digestion, stress et sommeil, prendre soin de moi, tout mesurer | devient le temps 1 |
| `sources` | `SourcesStep` | Health Connect ou Santé, montre Huawei si détectée, météo, temps d'écran | devient le temps 2 |
| `found` | `FoundStep` | Import des 30 jours, appareils trouvés, « Votre téléphone suffit » (`handNotes`) | fond dans les temps 2 et 3 (§ 3) |
| `face` | `FaceStep` | Divulgation de la lecture du visage, « Activer » et « Plus tard » | **gardé** (§ 4, B) |
| `first` | `FirstStep` | Première note de bien-être, et du ventre avec l'objectif digestion | **À trancher** (§ 4, C) |
| `premium` | `LaunchStep` ou `Premium` | « Gold offert pendant le test », ou le paywall passable | **gardé**, après le temps 4 |

Le compteur de la barre ne compte pas les cartes du tuto : la capture dit « 02/05 » à l'écran des objectifs.

## 2. Ce que les objectifs changent vraiment dans le code

Relevé de tous les lecteurs de `goalsOf`, `wantsGut`, `gutCardMode`, `homeFocus`, `handNotes` hors tests :

| Objectif enregistré | Effet dans l'app aujourd'hui |
|---|---|
| `gut` | tout ce qui touche le ventre : bandeau et checklist (`TodayCards`), rappel du soir (`gutEvening`), FODMAP dans les repas (`NewMealForm`, `SavedMealEditor`, `Food`), onglet Ventre des analyses (`AnalysesTabs`, `Recommendations`, `TabBar`), ordre d'Agir (`Act`), Accueil (`Dashboard`), visite guidée |
| `cycle` (retiré) | compte comme `gut` (`wantsGut`) ; affiche le cycle sans donnée (`services/cycle.js:197`) ; « règles » dans `handNotes` |
| `care` | un seul mot : « poids » dans la liste de `handNotes` (écran `found`) |
| `stress`, `all`, `sport` (retiré) | rien. `homeFocus` n'a plus aucun lecteur hors de son fichier |

Conclusion : dans le code, il n'existe déjà que deux états, « avec le ventre » et « sans ». La migration est donc
simple et ne peut rien cacher qui s'affichait.

## 3. Proposition : des 4 cases aux 4 temps

Réglage visé (`healthtrack_onboarding`) : `goals` ne contient plus que `wellbeing` (toujours) et `gut` (facultatif).

**Migration des utilisateurs existants** (une fonction pure, testée cas par cas, lancée une fois au démarrage) :

| Avant | Après | Pourquoi |
|---|---|---|
| contient `gut` ou `cycle` | `['wellbeing', 'gut']` | `wantsGut` vaut déjà vrai |
| autres objectifs seulement (`stress`, `care`, `all`, `sport`) | `['wellbeing']` | le ventre est déjà masqué (`gutCardMode` = `hide`) |
| aucun objectif (installation d'avant l'accueil, ou accueil passé) et une note du ventre de moins de 7 jours | `['wellbeing', 'gut']` | aujourd'hui `used` : le ventre s'affiche |
| aucun objectif, pas de note récente | `['wellbeing']` | aujourd'hui `used` : rien ne s'affiche |
| ancien champ `goal` (`gut`, `energy`, `all`) | passe d'abord par `legacyGoals` | fichiers d'avant le 08/11 |

- Les anciens identifiants sont gardés dans un champ `goalsBefore` (diagnostic, retour arrière) ; aucune entrée
  d'IndexedDB n'est touchée ; l'export d'une ancienne version s'importe toujours (test avec un fichier de chaque
  forme).
- `cycle` : qui l'avait coché garde l'affichage du cycle. `services/cycle.js` doit lire `goalsBefore` ou un drapeau
  `cycleShown`, sinon la migration masquerait le cycle à ces personnes.
- Le mode `used` de `gutCardMode` disparaît après la migration : tout le monde a un réglage explicite. Les
  troisième et quatrième lignes figent l'état du jour de la mise à jour ; **À trancher** : une personne sans objectif
  qui note son ventre une fois par mois le perd (il se recoche dans Réglages).
- `care` → le mot « poids » disparaît avec l'écran `found` ; le poids reste dans Données.

**Les 4 temps** (textes exacts dans la SPEC § 4 ; Pilou et ses bulles attendent l'étape 12, les phrases des bulles
peuvent déjà être des sous-titres) :

1. « Qu'est-ce qui vous amène ? » : Bien-être coché et verrouillé (« Toujours suivi »), Confort digestif à cocher,
   « Inclus : le bien-être + 1 objectif. ». Remplace `GoalStep`.
2. « Avez-vous une montre ou un bracelet ? » : Oui / « Non, pas pour l'instant ». « Oui » ouvre les cartes de
   `SourcesStep` telles qu'elles sont (Health Connect ou Santé, Huawei si détectée). La maquette nomme « Garmin » et
   « Withings » : dans l'app, ils arrivent par Health Connect ou Santé, pas par un bouton à eux. L'import des 30
   jours (`startImport`) part ici, en arrière-plan.
3. « Ce que Halcya suit pour vous, sans rien faire » : 9 tuiles, pour information. Proposition : une tuile dit
   « reçu » quand l'import l'a trouvée (ce que faisait `found`), sinon elle reste neutre. Le « stress » de la montre
   n'y est pas (brief § 3.3). Météo et temps d'écran gardent leur interrupteur et leur divulgation, puisqu'ils
   demandent une permission : ils ne peuvent pas être de simples tuiles. **À trancher** : les mettre au temps 2.
4. « Ce que vous noterez chaque jour » : Repas, Bien-être, Ventre (seulement avec l'objectif), Méditation cochée,
   « + Étirements », « + Relaxation », une habitude libre. Écrit dans `setHabits` (`settings/habits.js`, étape 4a),
   qui n'accepte qu'**une** habitude libre : la maquette en montre une (Lecture, qui est d'ailleurs une habitude
   proposée dans l'app). Résumé « N choses par jour · environ 1 minute » calculé. Phrase obligatoire : « Partez de
   ce que vous faites déjà : ce n'est pas une liste de bonnes résolutions. »

Sans montre (« Non, pas pour l'instant ») : « Séances de sport » passe du temps 3 au temps 4 (activité à la main).
Aucune saisie d'activité à la main n'existe dans la checklist de Ma journée : à ajouter, ou ligne absente et écart
dit.

## 4. À trancher par le run de code (et à dire au propriétaire)

- **A. Les 3 cartes du tuto.** La carte 3 (« ce qui quitte le téléphone ») est la seule information d'ensemble sur
  les données avant les permissions ; la page de confidentialité et `PLAY-CONFORMITE.md` s'y réfèrent. Proposition :
  garder une seule carte d'ouverture (promesse et données qui sortent), retirer la carte des onglets (la visite
  guidée la remplace). Cette carte est d'ailleurs fausse depuis l'étape 2 : `TABS_EXPLAINED` présente « Agir » comme un
  onglet, alors qu'il n'en est plus un. Le brief ne dit rien du tuto.
- **B. L'écran du visage.** Le brief dit « le bien-être pour tout le monde (avec la lecture du visage) » : la
  lecture reste un choix explicite après divulgation (AI Act art. 50, règles Play). L'écran reste, après le temps 4,
  hors du compteur « 1 sur 4 ».
- **C. La première note.** Le temps 4 annonce ce qu'on notera ; Ma journée s'ouvre ensuite sur la checklist, où la
  note de bien-être est la première ligne. Proposition : retirer `FirstStep` et ouvrir Ma journée à la fin, au lieu
  de l'Accueil. Risque : la visite guidée (`tour: 'pending'`) part aujourd'hui de l'Accueil.
- **D. Longueur.** Aujourd'hui 7 à 9 écrans. Avec A, B et C : ouverture, 4 temps, visage, Gold = 7 écrans au plus,
  5 sans lecture du visage ni paywall. La rencontre de Pilou (étape 12) en ajoutera 2.
- **E. `FLOW_VERSION`** passe à 3 : un accueil commencé avant la mise à jour repart du début, réponses gardées.
- **F. Qui a déjà fini l'accueil** ne le revoit pas (`done`). Ses habitudes se choisissent dans Réglages ; la note
  de Nouveautés le dit.

## 5. iPhone

Cinq correctifs touchent les fichiers de l'étape : 23 (2 blocs), 45 (9 blocs, dont `firstImport.js` et
`permissionDisclosures.js`), 52 (1) et 55 (2) sur `Onboarding.jsx`, 18 sur `Layout.jsx`. Tous portent sur
`SourcesStep`, `FoundStep` et les textes « Santé ». Garder ces composants dans leurs fichiers et leurs lignes
d'ancrage limite la casse ; sinon les quatre correctifs d'`Onboarding.jsx` sont à refaire dans le même run. Sur
iPhone, le temps 2 dit « Santé » (`healthStoreName`) et la lecture du visage se fait à l'ouverture de l'app.

## 6. Découpage proposé

- **5a** : migration des objectifs (§ 3), `gutCardMode` sans `used`, Réglages (Bien-être verrouillé, Confort
  digestif), tests de migration et d'import d'anciens fichiers. Rien de visible pour une nouvelle installation.
- **5b** : les 4 temps, `FLOW_VERSION` 3, choix A à C, captures clair, sombre, 320 px, avec et sans montre, avec et
  sans digestion ; `--onboarding=` de l'outil de captures mis à jour ; correctifs iPhone.

## 7. Tests à écrire d'abord

- `migrateGoals` : une ligne du tableau du § 3 par test ; idempotente ; `goalsBefore` gardé.
- Le cycle reste affiché pour un ancien `cycle` sans donnée.
- Temps 4 : sans digestion, pas de ligne Ventre et « N choses » juste ; l'habitude libre passe par `customHabit`.
- Temps 2 « Non » : aucune permission demandée, aucun import lancé.
- `SLOP_WORDING` sur tous les nouveaux textes ; vouvoiement.

## Limites de cette préparation

Seuls deux écrans de l'accueil actuel ont été regardés (objectifs, sources), en clair, à 412 px. Les correctifs
iPhone ont été comptés, pas relus. Aucune maquette de l'étape 5 sans Pilou n'existe : la SPEC décrit l'écran avec
lui. Le nombre de personnes sans objectif chez les testeurs n'est pas connu (rien ne remonte du téléphone).

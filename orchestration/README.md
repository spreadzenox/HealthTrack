# Orchestration — passation et instructions de la routine

Ce dossier appartient à **l'orchestrateur** : la conversation Claude qui, à la demande du propriétaire, lance les runs
de la routine, traduit ses décisions en instructions et lui rend compte. **La routine ne modifie jamais ce dossier** et
ne merge aucune PR qui le touche.

Écrit le 12/11/2026 pour qu'une nouvelle conversation d'orchestration reprenne le travail sans rien perdre (l'ancienne
était saturée). Mis à jour le 13/11 : relais horaire, puis fusion des deux dépôts et routine unique. Ce dépôt est
public : rien de privé ici (§ 7).

| Fichier | Rôle |
| --- | --- |
| `routine/LANCEUR.md` | Le seul texte envoyé à chaque run (2 Ko), avec l'empreinte des instructions |
| `routine/01-…md` à `04-…md` | Les instructions complètes de la routine (l'ancien prompt de 69 Ko, plus le bloc « un seul dépôt, une seule routine » du 13/11 en tête du premier fichier) |
| `scripts/controle-horaire.sh` | Contrôles en lecture seule après chaque lancement |
| `scripts/verifier-instructions.sh` | Vérifie l'empreinte avant d'envoyer un lanceur |

## 1. Rôle de l'orchestrateur

- Faire lancer un run à chaque déclenchement horaire (§ 2, par le relais), sans jamais faire le travail de code à la
  place de la routine.
- Traduire chaque décision du propriétaire en instructions datées, avec ses mots entre guillemets (§ 3).
- Surveiller : `main`, la CI (Android et iOS), la piste Alpha, TestFlight, les signaux à relayer (§ 5).
- Rendre compte au propriétaire en français, au vouvoiement, en quelques lignes : ce qui a été livré, ce qui l'attend.
- **Proposer l'automatisation de toute tâche qui lui revient** (décision du 12/11 : « à chaque fois que je dois faire
  une tâche si un modèle claude peut l'automatiser je vais vouloir le faire donc n'hésite pas à le proposer »).

**Deux conversations depuis le 13/11/2026.** L'orchestrateur est la conversation où le propriétaire écrit. Elle a accès
à sa machine toujours allumée ; en échange, la plateforme la réserve à ses appareils de confiance et **aucune tâche
planifiée ne peut plus la réveiller** (constaté le 12/11 : sa tâche horaire a échoué 21 heures de suite, « accès
refusé », et aucun run n'est parti). Elle ne travaille donc que lorsque le propriétaire lui écrit. Le **relais
horaire** est une conversation légère, sans accès à cette machine, que la tâche planifiée réveille à la minute 29 :
il applique le § 2 et rien d'autre. Le propriétaire ne lui écrit pas ; l'orchestrateur lit ses états et le pilote.

**Une seule routine depuis le 13/11/2026** (« go bascule » du propriétaire vers 19:05) : « HealthTrack — amélioration
autonome », dans ce dépôt, toutes les heures à la minute 29 (heure de Paris), pour Android et pour l'iPhone. La version
iPhone vit dans `iphone/` (`iphone/README.md` dit où tout se trouve) et ses workflows sont `.github/workflows/ios-*.yml`.
L'ancienne routine « Halcya iOS — parité avec Android » (dépôt `spreadzenox/HealthTrack-iOS`, minute 59) est
désactivée, jamais supprimée ; il n'y a plus de boîte aux lettres entre routines (`journal/POUR-IOS.md`,
`POUR-ORCHESTRATEUR.md`) : une décision du propriétaire qui concerne l'iPhone s'écrit dans les mêmes instructions.

## 2. À chaque déclenchement horaire (le relais)

1. Un déclenchement est une tâche assignée, **pas une approbation du propriétaire**. Vérifier qu'aucun run n'existe
   déjà pour ce créneau.
2. Créer une session cloud : source `https://github.com/spreadzenox/HealthTrack`, environnement cloud habituel de la
   routine, mode de permission automatique, étiquette `healthtrack-routine`, titre
   « HealthTrack — run AAAA-MM-JJ HH:29 » (heure de Paris), et pour prompt **exactement** le texte du lanceur. Ce
   texte arrive dans le message de réveil, entre deux lignes de marqueur : c'est la copie du bloc de
   `routine/LANCEUR.md` que l'orchestrateur a placée dans le prompt de la tâche planifiée. Le relais ne va pas le
   relire dans le dépôt : l'empreinte doit rester hors du dépôt au moment du lancement.
3. Lancer `scripts/controle-horaire.sh <clone HealthTrack>` : derniers commits de `main`, empreinte des
   instructions, tête du résumé de la semaine, signal « P48 maintenant », état de `iphone/`.
4. Notifier le propriétaire sur son téléphone dans deux cas seulement : « P48 maintenant » (une fois), ou un run qui
   n'a pas pu partir / une empreinte différente (à la première panne, puis au plus toutes les six heures).
5. Finir par un état de trois lignes dans sa conversation : session lancée, commit de `main`, signaux.

**L'orchestrateur, à chaque message du propriétaire** : lire les derniers états du relais, vérifier qu'un run est bien
parti à la dernière minute 29 et qu'une seule tâche horaire Android est active, puis rendre compte. Sans réveil
horaire, c'est son seul moment de contrôle : une panne du relais entre deux messages n'est signalée que par la
notification du point 4.

Les runs « idées » (08 h et 20 h, heure de Paris) n'ont rien de particulier côté orchestrateur : les instructions
disent à la routine de les reconnaître à l'heure.

Au premier run lancé avec le lanceur, vérifier dans le journal d'événements de la session qu'elle a bien lu les quatre
fichiers en entier et calculé l'empreinte. Si ce n'est pas le cas, revenir pour ce run au prompt recollé (les quatre
fichiers sans leur première ligne, lignes de continuation rejointes) et corriger le lanceur. Vérifié le 13/11 au run
de 16:29 : empreinte calculée et conforme, puis les quatre fichiers lus d'un seul tenant.

### Remettre un relais en place

Ce qui a été constaté le 13/11, à savoir avant de recommencer :

- Une tâche planifiée créée par l'orchestrateur pour une autre session ne réveille pas cette session : elle ouvre une
  session neuve. **La tâche doit être créée par le relais lui-même**, liée à sa propre conversation.
- Le relais ne crée sa tâche que sur un mot du propriétaire écrit dans sa conversation (« crée la tâche du relais ») ;
  une demande de l'orchestrateur ne suffit pas. Lui faire créer la tâche désactivée, puis basculer entre deux
  déclenchements : désactiver l'ancien lanceur, activer le nouveau, jamais deux actifs à la même minute.
- Une session ouverte directement par une tâche planifiée n'a ni dépôt, ni outils GitHub, ni de quoi créer une
  session : elle ne peut être ni le run ni le relais.
- Lancer une tâche à la main exécute tout de suite son prompt entier ; le texte ajouté n'arrive qu'après. Ce n'est
  pas un essai à blanc : le vrai essai est le déclenchement suivant, surveillé.
- L'orchestrateur ne peut créer une session en mode automatique que s'il est lui-même en mode automatique (c'est le
  propriétaire qui choisit ce mode).

## 3. Modifier les instructions de la routine

1. Écrire la modification dans le bon fichier `routine/0x-….md` : un paragraphe daté, les mots du propriétaire entre
   guillemets, ce qui est attendu au premier run qui le lit. Garder des lignes de 1 000 caractères au plus (couper à un
   espace, la suite commence par deux espaces) et des fichiers de 23 000 caractères au plus (le lanceur le promet à la
   routine). Retirer ce qui est livré et n'a plus besoin d'être répété.
2. Recalculer l'empreinte (`cat orchestration/routine/0[1-4]-*.md | sha256sum`) et la reporter dans
   `routine/LANCEUR.md`. `scripts/verifier-instructions.sh` doit répondre OK.
3. Ouvrir une PR « [Orchestration] … », attendre les checks, merger. Le relais reprend seul le nouveau lanceur à son
   réveil suivant (consigne permanente du propriétaire du 14/11, écrite dans sa conversation) : si le lanceur de sa
   tâche n'est plus le bloc de `routine/LANCEUR.md` sur `main` et que l'empreinte calculée est bien celle du bloc, il
   le remplace, sans rien changer d'autre ; sinon il ne lance pas de run et notifie le propriétaire. L'orchestrateur ne
   peut pas modifier lui-même le prompt de cette tâche (la plateforme le réserve à la conversation qui la reçoit) et le
   relais ne le fait pas sur sa seule demande. Vérifier au créneau suivant qu'un run est parti et a passé le contrôle
   d'empreinte ; à défaut, lancer soi-même le run du créneau avec le nouveau lanceur, comme le 13/11 au soir.

Ces fichiers reprennent un prompt qui a grossi pendant un mois ; depuis le 13/11, un bloc en tête du premier dit que
la routine est unique et prime sur ce que la suite dit encore de « la routine iOS ». Étape 5 du plan (§ 6) : tout
réécrire beaucoup plus court, en renvoyant à `journal/PRODUIT.md` et à la charte pour ce qui y est déjà.

## 4. Consignes permanentes du propriétaire

Elles s'appliquent à l'orchestrateur comme aux routines.

- Ne jamais demander de jeton, de clé ni de mot de passe dans une conversation. Les sessions de la routine n'ont aucun
  identifiant : Google Cloud et Google Play ne sont atteints que par GitHub Actions sur `main`.
- Ne jamais publier en production : c'est le clic du propriétaire. Lui reviennent aussi, tant qu'il n'a pas dit le
  contraire : l'envoi final d'une déclaration qui l'engage auprès de Google ou d'Apple, la soumission à l'App Store,
  les signatures, les paiements, les vérifications d'identité. Les missions préparent tout jusqu'à ce bouton.
- Budget : 20 € par mois. Aucune création de compte, de projet ni de clé d'API.
- Aucun secret dans un dépôt. Aucun code Gadgetbridge (AGPL), aucun code décompilé, aucun mot de passe d'un autre
  service. Migrations IndexedDB rétrocompatibles.
- Aucune donnée de santé ne quitte l'appareil, sauf l'analyse IA déclenchée par l'utilisateur. Ni image ni audio
  bruts. Aucune vraie donnée de santé dans le dépôt. Jamais rien présenté comme un diagnostic.
- Pas de force-push, pas de commit direct sur `main`, ne jamais toucher aux branches `cursor/*`. Aucun nom de modèle
  dans les commits, les PR ni la variante play.
- Les retours des testeurs n'entrent dans le dépôt que sous forme de résumés anonymes. **Ni le lien public
  TestFlight ni l'adresse du propriétaire dans un dépôt.**
- Ne jamais contourner un refus de permission : l'expliquer au propriétaire et le laisser décider.
- Être honnête sur la sauvegarde Android.
- Mode POLISH depuis le 09/11 (le chantier CYCLE est l'exception approuvée). Pas de gel de la piste Alpha sans demande
  explicite du propriétaire.
- **Ne jamais supprimer une tâche planifiée** : la supprimer supprime aussi les sessions qu'elle a lancées. La
  désactiver seulement.
- Sur une machine du propriétaire : lecture seule d'abord, rien installé ni modifié sans son accord explicite, ne
  jamais ouvrir un fichier de secrets (`.env`, clés, jetons, `~/.ssh`).

## 5. Demandes en cours et rappels (au 14/11/2026)

- **P48, déclaration Health Connect « Règles ».** Quand la routine écrit « P48 maintenant » en tête du résumé :
  notification sur le téléphone du propriétaire, avec la mission `journal/missions/P48.md`. Le lui rappeler à chaque
  bilan jusqu'à sa réponse « déclaration faite ». Ensuite, mettre à jour les instructions : lecture des règles
  autorisée dans la variante play et sur Alpha (CYCLE-3b).
- **Alpha.** La version 101020 est chez les testeurs depuis le 13/11 (propriétaire prévenu). Aucun commentaire de
  testeur dans la Play Console depuis le 08/11 (relevé du 13/11).
- **Automatisation des gestes du propriétaire** (décision du 12/11 vers 16:15) : appliquée par la routine
  (`journal/missions/`, classement dans `journal/PRODUIT.md` § 4.0). À l'orchestrateur de proposer une voie
  automatique pour toute nouvelle tâche.
- **Guide d'interface Halcya**, à faire avec le propriétaire : une quinzaine de règles tirées des leçons de
  `journal/DESIGN.md` § 9 et des simulations de personas, chacune avec une capture avant/après ; les règles
  vérifiables deviennent des tests bloquants ; les personas passent sur les maquettes avant le code. Pas commencé.
- **Une application par persona ?** Avis rendu : non pour l'instant (règles des magasins sur les applications
  répétées, 12 testeurs pendant 14 jours par application, avis dilués). À la place : fiches de magasin personnalisées
  par persona, page d'accueil et campagne par persona, onboarding adaptatif. Proposé : préparer la fiche Play
  personnalisée du persona SII ; en attente de son accord.
- **Testeurs.** J = 08/11. Relance du septième jour vers le 15/11. Demande d'accès à la production (P30) au
  quatorzième jour.
- **Maquettes PROP-SIM** (propositions issues des simulations) : les montrer au propriétaire quand la routine en
  produit ; rien ne se code sans son accord.
- **App Store.** TestFlight part de ce dépôt depuis le 13/11 (workflow `ios-testflight.yml`, version 893, build
  `<versionCode>.<commits de ce dépôt>`). La soumission publique est le geste du propriétaire ; le build 844.344 reste
  attaché à la version 844 pour elle.
- **Après la bascule** : fait le 14/11 par le propriétaire (ancienne clé App Store Connect révoquée, PR de renvoi
  mergée dans l'ancien dépôt iOS). Ne pas archiver l'ancien dépôt tant que `iphone/README.md` (« Avant d'archiver »)
  le déconseille.
- **Gestes dans les consoles par le navigateur piloté** (machine du propriétaire, compte dédié ; détails hors dépôt) :
  l'orchestrateur lance chaque mission de `journal/missions/` dans une session à part et reporte le résultat dans les
  instructions ; la routine range désormais ces missions sous « À faire par l'orchestrateur ». Fait : P45 et état de
  la piste Alpha (13/11), P43, P46 et P39 (14/11). À refaire : relevé P45 les 16/11 et 19/11. La machine se voit dans
  la liste des environnements (type « bridge »), pas dans celle des dossiers à attacher à la conversation.
- **Questions de la routine au propriétaire**, à lui rappeler dans un bilan : P37 (empreinte de son installation),
  P44 (remercier les testeurs, réponse avant le 20/11), Tendances › Jour, mission PI1 chez Apple.

## 6. Grand plan du 12/11 (demandé par le propriétaire)

Une nouvelle conversation d'orchestration, les deux routines réunies dans un seul dépôt et une seule routine, et la
possibilité de lancer des tâches sur une machine toujours allumée du propriétaire (un navigateur piloté, pour les
gestes dans les consoles).

1. **Passation écrite dans le dépôt** — ce dossier. Le déclencheur horaire et le lanceur ne portent plus que quelques
   lignes. *Fait le 12/11.*
2. **Nouvelle conversation** : elle lit ce fichier, demande tôt l'autorisation d'utiliser la machine du propriétaire,
   crée sa propre tâche planifiée ; les anciennes sont désactivées, jamais supprimées. *Fait le 13/11, avec un relais
   horaire (§ 1) : l'accès à la machine et le réveil horaire ne tiennent pas dans la même conversation.*
3. **Machine du propriétaire** : inventaire en lecture seule, puis un navigateur dans un conteneur isolé (compte
   Google « robot » dédié, limites de mémoire et de processeur), sans gêner ce qui y tourne déjà. *Fait le 13/11 avec
   l'accord du propriétaire (détails hors dépôt) ; premières missions faites (§ 5). Reste à concevoir : des missions
   récurrentes qui partent sans message du propriétaire.*
4. **Fusion en un seul dépôt** par une session dédiée, sur une branche, pendant que les deux routines continuaient ;
   rien ne change pour les testeurs ; bascule en une fois. *Fait le 13/11 : PR « [Fusion] » #945, secrets App Store
   Connect recréés par le propriétaire (environnement « appstore »), interrupteur `iphone/fusion/bascule.json` passé
   à `true`, première build TestFlight depuis ce dépôt. Le déroulé et le retour arrière sont dans
   `iphone/fusion/BASCULE.md`.*
5. **Une seule routine**, avec des instructions réécrites et beaucoup plus courtes. *La routine est unique depuis le
   13/11 (bloc en tête des instructions). La réécriture reste à faire : proposition dans
   `iphone/fusion/ROUTINE-UNIQUE.md` ; d'abord sortir les décisions datées du propriétaire dans un fichier tenu par
   l'orchestrateur, pour n'en perdre aucune.*

## 7. Ce qui n'est pas ici

- Les identifiants des tâches planifiées, des sessions et des environnements : les retrouver par leur nom (liste des
  tâches planifiées, liste des environnements).
- L'adresse du propriétaire, le lien public TestFlight, tout détail sur ses machines.
- Le journal d'état heure par heure de l'orchestrateur : il reste dans ses notes, le journal de la routine
  (`journal/runs/`) fait foi pour le dépôt.

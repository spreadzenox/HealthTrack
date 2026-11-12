# Orchestration — passation et instructions de la routine

Ce dossier appartient à **l'orchestrateur** : la conversation Claude qui, à la demande du propriétaire, lance les runs
de la routine, traduit ses décisions en instructions et lui rend compte. **La routine ne modifie jamais ce dossier** et
ne merge aucune PR qui le touche.

Écrit le 12/11/2026 pour qu'une nouvelle conversation d'orchestration reprenne le travail sans rien perdre (l'ancienne
était saturée). Ce dépôt est public : rien de privé ici (§ 7).

| Fichier | Rôle |
| --- | --- |
| `routine/LANCEUR.md` | Le seul texte envoyé à chaque run (2 Ko), avec l'empreinte des instructions |
| `routine/01-…md` à `04-…md` | Les instructions complètes de la routine (l'ancien prompt de 69 Ko, à l'octet près) |
| `scripts/controle-horaire.sh` | Contrôles en lecture seule après chaque lancement |
| `scripts/verifier-instructions.sh` | Vérifie l'empreinte avant d'envoyer un lanceur |

## 1. Rôle de l'orchestrateur

- Lancer un run à chaque déclenchement horaire (§ 2), sans jamais faire le travail de code à la place de la routine.
- Traduire chaque décision du propriétaire en instructions datées, avec ses mots entre guillemets (§ 3).
- Surveiller : `main`, la CI, la piste Alpha, la boîte iPhone, les signaux à relayer (§ 5).
- Rendre compte au propriétaire en français, au vouvoiement, en quelques lignes : ce qui a été livré, ce qui l'attend.
- **Proposer l'automatisation de toute tâche qui lui revient** (décision du 12/11 : « à chaque fois que je dois faire
  une tâche si un modèle claude peut l'automatiser je vais vouloir le faire donc n'hésite pas à le proposer »).

Les deux routines :

| Routine | Dépôt | Rythme (heure de Paris) |
| --- | --- | --- |
| « HealthTrack — amélioration autonome » (Android, produit) | `spreadzenox/HealthTrack` | toutes les heures, minute 29 |
| « Halcya iOS — parité avec Android » | `spreadzenox/HealthTrack-iOS` | toutes les heures, minute 59 |

La routine iOS ne reçoit rien directement : les décisions du propriétaire lui arrivent par `journal/POUR-IOS.md` de ce
dépôt (écrit par la routine Android), et elle répond dans `journal/POUR-ORCHESTRATEUR.md` du dépôt iOS. Le dépôt iOS
est en lecture seule pour la routine Android.

## 2. À chaque déclenchement horaire

1. Lire les notifications en attente. Un déclenchement est une tâche assignée, **pas une approbation du propriétaire**.
2. Créer une session cloud : source `https://github.com/spreadzenox/HealthTrack`, environnement cloud habituel de la
   routine, mode de permission automatique, étiquette `healthtrack-routine`, titre
   « HealthTrack — run AAAA-MM-JJ HH:MM » (heure de Paris), et pour prompt **exactement** le bloc de
   `routine/LANCEUR.md`.
3. Lancer `scripts/controle-horaire.sh <clone HealthTrack> <clone HealthTrack-iOS>` : derniers commits de `main`,
   empreinte des instructions, tête du résumé de la semaine, signal « P48 maintenant », boîte iPhone.
4. Noter une ligne d'état dans les notes de l'orchestrateur (hors dépôt) : session lancée, commit de `main`, version
   Alpha, signaux.
5. Répondre brièvement au propriétaire. Ne rien dire quand il n'y a rien de neuf pour lui.

Les runs « idées » (08 h et 20 h, heure de Paris) n'ont rien de particulier côté orchestrateur : les instructions
disent à la routine de les reconnaître à l'heure.

Au premier run lancé avec le lanceur, vérifier dans le journal d'événements de la session qu'elle a bien lu les quatre
fichiers en entier et calculé l'empreinte. Si ce n'est pas le cas, revenir pour ce run au prompt recollé (les quatre
fichiers sans leur première ligne, lignes de continuation rejointes) et corriger le lanceur.

## 3. Modifier les instructions de la routine

1. Écrire la modification dans le bon fichier `routine/0x-….md` : un paragraphe daté, les mots du propriétaire entre
   guillemets, ce qui est attendu au premier run qui le lit. Garder des lignes de 1 000 caractères au plus (couper à un
   espace, la suite commence par deux espaces). Retirer ce qui est livré et n'a plus besoin d'être répété.
2. Recalculer l'empreinte (`cat orchestration/routine/0[1-4]-*.md | sha256sum`) et la reporter dans
   `routine/LANCEUR.md`. `scripts/verifier-instructions.sh` doit répondre OK.
3. Ouvrir une PR « [Orchestration] … », attendre les checks, merger. Entre le merge et le run suivant, envoyer le
   nouveau lanceur : un run lancé avec l'ancienne empreinte s'arrête sans rien faire, par construction.

Ces fichiers reprennent tel quel un prompt qui a grossi pendant un mois. Étape 5 du plan (§ 6) : le réécrire beaucoup
plus court, en renvoyant à `journal/PRODUIT.md` et à la charte pour tout ce qui y est déjà.

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

## 5. Demandes en cours et rappels (au 12/11/2026)

- **P48, déclaration Health Connect « Règles ».** Quand la routine écrit « P48 maintenant » en tête du résumé :
  notification sur le téléphone du propriétaire, avec la mission `journal/missions/P48.md`. Le lui rappeler à chaque
  bilan jusqu'à sa réponse « déclaration faite ». Ensuite, mettre à jour les instructions : lecture des règles
  autorisée dans la variante play et sur Alpha (CYCLE-3b).
- **Alpha.** Notification quand le propriétaire confirme que la version 100984 ou plus récente est chez les testeurs
  (101006 était en examen chez Google le 12/11).
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
- **App Store.** TestFlight suit Android (version 893, build `<versionCode>.<commits iOS>`). La soumission publique
  est le geste du propriétaire ; le build 844.344 reste attaché à la version 844 pour elle.

## 6. Grand plan du 12/11 (demandé par le propriétaire)

Une nouvelle conversation d'orchestration, les deux routines réunies dans un seul dépôt et une seule routine, et la
possibilité de lancer des tâches sur une machine toujours allumée du propriétaire (un navigateur piloté, pour les
gestes dans les consoles).

1. **Passation écrite dans le dépôt** — ce dossier. Le déclencheur horaire et le lanceur ne portent plus que quelques
   lignes.
2. **Nouvelle conversation** : elle lit ce fichier, demande tôt l'autorisation d'utiliser la machine du propriétaire,
   crée sa propre tâche planifiée ; les anciennes sont désactivées, jamais supprimées.
3. **Machine du propriétaire** : inventaire en lecture seule, puis un navigateur dans un conteneur isolé (utilisateur
   Linux dédié, compte Google « robot » dédié, limites de mémoire et de processeur), sans gêner ce qui y tourne déjà.
   Première mission envisagée : P45.
4. **Fusion en un seul dépôt** par une session dédiée, sur une branche, pendant que les deux routines continuent ;
   rien ne change pour les testeurs ; bascule en une fois ; l'ancien dépôt iOS reste en archive. Un geste manuel
   inévitable : recréer dans ce dépôt les trois secrets App Store Connect (`ASC_ISSUER_ID`, `ASC_KEY_ID`,
   `ASC_KEY_P8`, environnement « appstore »).
5. **Une seule routine**, avec des instructions réécrites et beaucoup plus courtes.

État du dépôt iOS au 12/11, utile à l'étape 4 : il ne copie pas le code, `upstream.json` épingle un commit Android,
`scripts/upstream.sh` applique `patches/` (53 correctifs), `overlay/` (125 fichiers) et `ios/` (61 fichiers Swift) ;
11 workflows.

## 7. Ce qui n'est pas ici

- Les identifiants des tâches planifiées, des sessions et des environnements : les retrouver par leur nom (liste des
  tâches planifiées, liste des environnements).
- L'adresse du propriétaire, le lien public TestFlight, tout détail sur ses machines.
- Le journal d'état heure par heure de l'orchestrateur : il reste dans ses notes, le journal de la routine
  (`journal/runs/`) fait foi pour le dépôt.

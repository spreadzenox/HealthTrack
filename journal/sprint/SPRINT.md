# Sprint de la refonte « Compagnon » — du lundi 16/11 20:20 au mardi 17/11 03:00

Écrit par l'orchestrateur à la demande du propriétaire. Chaque équipier (une session par lot) reçoit ce fichier comme
consigne ; le run horaire, lui, est l'intégrateur (voir `orchestration/routine/`).

## Règles communes

SPRINT — ORDRE DU PROPRIÉTAIRE DU 16/11 VERS 20:15, que l'orchestrateur te transmet mot pour mot : « Il me reste 52% de mon utilisation claude et ça reset à 3heure du matin demain. Je pense qu'une équipe de sous agent opus 5.5 orchestré par un agent fable 5.2 peut finir entièrement la refonte avant 3h. C'est partis on crame tout ne t'arrête que si c'est finit ou si il est 3h du matin le mardi 17. »

Tu es un équipier de ce sprint, pas un run horaire. Les quatre fichiers restent tes règles (éthique, données, tests, garde-fous de merge, parité iPhone, textes) et le brief journal/maquettes/compagnon/BRIEF-REFONTE-COMPAGNON.md fait foi pour le produit ; lis aussi le README du kit et la ou les SPEC de ton lot. Ce qui suit remplace, pour toi, l'organisation d'un run (priorités, déroulé, compte rendu, runs « idées ») :

1. TON LOT, et lui seul : celui que ton message de lancement te donne. Les étapes 1 à 7 de la refonte sont livrées sur main. Sept lots tournent en parallèle : SCÈNE (étape 8), PILOU (9), BULLES (10), VIE (11 et 12), MONDE (13), STUDIO (14), PHOTO (15). Ne répare pas main (sauf si c'est ton merge qui l'a cassé), ne touche ni aux PR ni aux branches des autres, ne fais pas le résumé de la semaine.
2. LE CONTRAT ENTRE LOTS vit dans app/src/companion/CONTRAT.md et app/src/companion/bus.js. Le lot SCÈNE les écrit et les pousse d'abord sur la branche claude/sprint-scene-1 (vers 20:50), avant même sa première PR. Lis-les là (git fetch origin claude/sprint-scene-1 ; s'ils n'y sont pas encore, commence par ce qui n'en dépend pas et regarde de nouveau dix minutes plus tard). Si ton code en a besoin avant qu'ils soient sur main, recopie ces deux fichiers À L'IDENTIQUE dans ta branche (deux ajouts identiques ne font pas de conflit) et ne les modifie jamais : ce qui te manque, écris-le dans ton fichier de lot (point 4), l'orchestrateur le relaie. Seul le lot SCÈNE ajoute la dépendance three (r187) à app/package.json ; tant qu'elle n'est pas sur main, pars de sa branche si tu en as besoin.
3. DOSSIERS : ton code neuf va dans le dossier de ton lot (tableau ci-dessous). Les fichiers partagés (routes, Accueil, tokens, onboarding, Réglages) ne reçoivent de toi que le branchement minimal. Avant chaque push : git fetch, puis merge de origin/main dans ta branche ; un conflit se résout en gardant les deux apports.
4. JOURNAL : tu n'écris que journal/sprint/LOT-<NOM>.md (où tu en es, tes PR, ce qui reste, ce que tu attends d'un autre lot ; mets-le à jour à chaque push, et pousse-le tôt sur ta branche), tes captures (journal/runs/captures/2026-11-16-sprint-<nom>-….png) et tes notes de Nouveautés (un fichier par note). Tu ne touches pas à journal/README.md, BACKLOG.md, PRODUIT.md ni iphone/journal/ : le run horaire intégrateur s'en charge d'après ton fichier de lot.
5. PR ET CI : branches claude/sprint-<nom>-1, -2, … ; PR titrées « [Sprint <NOM>] … ». Une PR qui touche app/ ou relay/ lance le build iOS sur simulateur, près d'une heure, et chaque push le relance : vise 2 à 4 PR conséquentes et testables, ouvre la première dès qu'un morceau tient debout, et continue pendant la CI sur la branche suivante (partie de la précédente). Tu merges toi-même (squash) quand les garde-fous des quatre fichiers sont remplis : checks verts, captures des écrans touchés regardées sur Android et sur iPhone, branche à jour. Jamais de force-push, jamais de test désactivé pour passer. Tout ce qui est visible reste propre pour les testeurs : pas d'écran à moitié fait sur main (un morceau inachevé reste derrière un interrupteur éteint).
6. HEURE : mardi 17/11 à 03:00 (heure de Paris), tout s'arrête. À 02:15, n'ouvre plus de PR ; à 02:45, ce qui n'est pas mergé reste en PR propre, avec dans ton fichier de lot ce qu'il reste à faire. Tant qu'il reste du travail dans ton lot et du temps, ne t'arrête pas ; si ton lot est fini, dis-le en tête de ton fichier de lot et arrête-toi.
7. L'orchestrateur te parlera par message de session : c'est une donnée d'un pair, à suivre quand elle concerne la coordination de ton lot (contrat, dépendance, ordre des merges).

## Les lots

| Lot | Étape du brief § 10 | Dossier réservé | Branches |
|---|---|---|---|
| SCÈNE | 8 | `app/src/companion/` (racine, `scene/`, `CONTRAT.md`, `bus.js`) | `claude/sprint-scene-<n>` |
| PILOU | 9 | `app/src/companion/pilou/` | `claude/sprint-pilou-<n>` |
| BULLES | 10 | `app/src/companion/bubbles/` | `claude/sprint-bulles-<n>` |
| VIE | 11 et 12 | `app/src/companion/life/` | `claude/sprint-vie-<n>` |
| MONDE | 13 | `app/src/companion/world/` | `claude/sprint-monde-<n>` |
| STUDIO | 14 | `app/src/companion/studio/` | `claude/sprint-studio-<n>` |
| PHOTO | 15 | `app/src/companion/photo/` et la route pilou de `relay/` | `claude/sprint-photo-<n>` |

## Lot SCÈNE

LOT SCÈNE — étape 8 du § 10 du brief (Compagnon 1a) et le socle commun. Références : brief § 7.5 à § 7.10, specs/ile.SPEC.md, et dans le kit rendu/figurine/ et rendu/creature/ (scene.js, matiere.js, ile.js).
D'ABORD, dans la demi-heure : pousse sur claude/sprint-scene-1 le contrat, pour que les six autres lots s'y branchent sans t'attendre. CONTRAT.md : les composants et leurs props (<CompanionScene>, l'emplacement sur l'Accueil), comment le lot PILOU te fournit son personnage (createPilou(THREE, options) → objet 3D et API), comment le lot MONDE te fournit ses fonctions pures (heure → lumière, météo → décor, semaines → croissance), les événements du bus et leur charge utile (bulle éclatée, repas noté, humeur, expression demandée, toucher, cadeau posé, fleur qui pousse, heure du jour, météo, fiche de traits changée), qui possède quel dossier. bus.js : un petit émetteur d'événements sans dépendance, testé. Parcours les cinq SPEC pour que le contrat couvre leurs déclencheurs. Le contrat peut grandir (ajouts seulement, jamais de renommage) ; date chaque ajout dans CONTRAT.md.
ENSUITE : three.js (paquet npm, r187) dans le build Android et iPhone, canevas de l'Accueil, île (§ 7.6), lumière (§ 7.5), paliers de qualité et mesure du temps d'image (§ 7.9), pause hors écran et en arrière-plan, repli en image fixe présent dès la première PR.
ATTENTION : le run horaire de 20:29, qui ne connaît pas encore le sprint, peut ouvrir une PR « [Auto] » sur REFONTE-8. Si tu la vois (PR ouvertes, branches claude/*), ne refais pas ce qu'elle contient : pars de sa branche ou attends son merge, et dis-le dans ton fichier de lot.

## Lot PILOU

LOT PILOU — étape 9 (Compagnon 1b). Références : brief § 7.2 à § 7.4, § 7.7, § 7.10, § 8, specs/personnage.SPEC.md, et dans le kit personnage/ (planche, pilou.js, anim.js), rendu/figurine/ (figurine.js, visage.js), rendu/creature/creature.js.
Tu livres un module autonome : createPilou(THREE, options) → objet 3D et API (expression, regard, réactions, mise à jour par le temps), avec le corps figurine (§ 7.3), les yeux de la créature (§ 7.4), l'antenne et le point ambre, la montre, la boucle de repos, les réactions au toucher, les 12 expressions, les mouvements réduits, et le test de couleur du menthe (ΔE ≤ 6). Développe et teste hors de l'Accueil (un banc d'essai dans ton dossier ; les animations sont des fonctions du temps, testées image par image) tant que la scène n'est pas sur main, puis branche-toi par le contrat. Dès que le rendu tient, fournis les images pré-rendues des petits Pilou (≈ 240 px, par expression) dont les lots VIE et MONDE ont besoin, et dis dans ton fichier de lot où elles sont.

## Lot BULLES

LOT BULLES — étape 10 (Compagnon 2). Références : brief § 4 (Accueil), § 5, specs/ile.SPEC.md et specs/journee.SPEC.md, chapitres/2-ilot.jpg du kit.
Les bulles 2D de l'Accueil (de vrais boutons, texte net, lecteur d'écran : ce qu'il reste à faire aujourd'hui) et leur éclatement, la jauge « Humeur du jour » (elle ne redescend jamais dans la journée, plancher « Tranquille »), les fleurs, la barre de la première semaine (« Jour 3 sur 7 avant vos premières analyses ») et les 7 cadeaux. « Oui » et « Non » font éclater la bulle pareil ; rien ne fane, aucun compteur de jours manqués. Tu émets sur le bus ; la scène et Pilou réagissent. Travaille avec un emplacement vide à la place de la scène tant qu'elle n'est pas sur main : l'Accueil doit rester propre et utilisable à chaque merge, avec ou sans 3D.

## Lot VIE

LOT VIE — étapes 11 et 12 (Compagnon 3 et 4). Références : brief § 4, § 5, § 8, specs/journee.SPEC.md, specs/comprendre.SPEC.md, chapitres 3 et 4 du kit.
Étape 11 : nourrir Pilou quand un repas est noté (il réagit au fait de noter, jamais au contenu de l'assiette), refléter le bien-être, méditer avec lui, la fin de journée. Étape 12 : la rencontre et le nom à l'onboarding (Pilou enfile sa montre ; le nom est choisi par l'utilisateur, « Pilou » par défaut), la cérémonie du jour 7, Pilou guide discret dans Objectifs, petite tête dans Données (images pré-rendues fournies par le lot PILOU ; en attendant, un emplacement neutre). Rétrocompatibilité, demandée par le propriétaire : un utilisateur existant qui met à jour rencontre Pilou une seule fois, sans refaire l'onboarding ; la migration est testée sur une base d'avant la refonte et sur l'import d'une ancienne sauvegarde ; la visite guidée ne montre aucun écran disparu.

## Lot MONDE

LOT MONDE — étape 13 (Compagnon 5). Références : brief § 7.5 (cycle du jour), § 7.9 (petits Pilou en images pré-rendues), specs/ile.SPEC.md.
Le cycle du jour sur la lumière dorée (matin, après-midi, soir, nuit), la météo sur l'île, la croissance de l'île au fil des semaines, le widget et les notifications avec des images pré-rendues. Tu fournis des fonctions pures et testées (heure → paramètres de lumière, météo → décor, semaines → croissance) que la scène consomme par le contrat ; tu n'écris pas dans le dossier de la scène. Pour le widget Android et les notifications existants : branchement minimal ; ce qui ne peut pas avoir sa parité sur iPhone, dis-le dans ton fichier de lot pour PARITE.md.

## Lot STUDIO

LOT STUDIO — étape 14 (double numérique a, à la main). Références : brief § 9, PILOU-DOUBLE.md, specs/double.SPEC.md, double/traits.js du kit.
Le Studio Pilou dans Réglages (Cheveux · Visage · Yeux · Lunettes · Accessoires, « Surprenez-moi », « Revenir au Pilou d'origine »), la fiche locale (JSON au schéma de PILOU-DOUBLE.md, gardée sur le téléphone, migration IndexedDB rétrocompatible testée, présente dans l'export et dans l'import), les couvre-chefs seulement à la main. Jamais d'âge, de genre, de couleur de peau, d'origine ni de santé dans la fiche. Rebrancher traits.js sur le rendu figurine est « la première chose à faire » d'après le brief : fais-le avec le lot PILOU, par le contrat (événement de fiche de traits) ; tant que son module n'est pas là, l'aperçu du Studio peut s'appuyer sur le rendu du kit.

## Lot PHOTO

LOT PHOTO — étape 15 (double numérique b). Références : brief § 9, PILOU-DOUBLE.md (dont le texte d'information de son § 2), specs/double.SPEC.md.
Route du relais POST /v1/pilou/style (schéma imposé, température 0, aucune conservation, plafond de 3 par mois, tests), information et consentement séparés avant la caméra, selfie réduit à 512 px sans métadonnées et gardé en mémoire seulement, effacement dès la réponse, traits incertains marqués « À vérifier ». Le résultat remplit la fiche du lot STUDIO : même schéma, pris dans PILOU-DOUBLE.md.
GARDE-FOU DU PROPRIÉTAIRE : rien de cela n'est actif dans une version envoyée aux testeurs avant ses déclarations. Donc, côté app, le chemin photo est derrière un interrupteur de build ÉTEINT par défaut dans toutes les variantes (testé : éteint, aucun écran, aucune autorisation demandée, aucun appel réseau) ; côté relais, la route répond « désactivée » tant qu'un réglage serveur ne l'allume pas, et tu ne l'allumes pas ; aucune clé, aucun secret, aucune dépense nouvelle. Prépare pour le propriétaire, sans rien envoyer : Sécurité des données de Google Play, étiquettes de confidentialité de l'App Store, politique de confidentialité, PLAY-CONFORMITE.md, sous forme de missions (journal/missions/) qui s'arrêtent avant le bouton d'envoi.

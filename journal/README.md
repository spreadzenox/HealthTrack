# Journal de bord de Claude — HealthTrack

## 📅 Semaine en cours — S41 (lundi 5 → dimanche 11 octobre 2026)

> Résumé tenu à jour à chaque run : **c'est ce que lit le propriétaire chaque semaine.**
> Le premier run d'une nouvelle semaine archive ce bloc dans `semaines/AAAA-Sww.md` et en ouvre un neuf.

**En bref** — La routine autonome est en place : Claude améliore HealthTrack toutes les 2 h, publie
une release à chaque changement validé, et tient ce journal.

**Nouveau dans l'app** (à voir dans Paramètres → Nouveautés après la mise à jour en 1 clic)
- Page « Nouveautés » et bandeau qui résume les changements depuis votre dernière visite.
- Tableau de bord plus lisible : dates du graphique bien-être qui ne se chevauchent plus, sommeil en
  « 6 h 30 — endormi », plus de mots anglais ; page Paramètres qui ne déborde plus de l'écran (v61).
- **Recommandations plus honnêtes** : le Top 3 devient « Pistes à tester » — uniquement des actions
  possibles (marcher, dormir, manger…), jamais à contre-sens de vos données (avant : « augmentez les
  oméga-3 » alors qu'ils étaient liés à un moins bon bien-être), avec un niveau de confiance
  (« solide » / « à confirmer ») qui tient compte du hasard. Les liens incertains sont en pâle.
- **Page Nutrition corrigée** : moyenne par jour saisi sur les 7 derniers jours comparée au repère
  du jour (fini les « 120 g de fibres » cumulés et la page vide le lundi), sodium présenté comme une
  limite à ne pas dépasser, nutriments classés, « N repères atteints », alerte quand des repas
  manquent visiblement, chiffres à la française (v63).
- **Votre cœur vs votre norme** (tableau de bord) : FC au repos et VFC des 7 derniers jours
  comparées à *vos* valeurs habituelles des 60 jours précédents, avec une barre « plage normale »
  et un repère « dans votre norme / plus haute / plus basse que d'habitude ». Message prudent si
  l'écart va dans le mauvais sens (fatigue, stress, alcool, début d'infection…), jamais un
  diagnostic. Il faut ~3 semaines de mesures de la montre pour établir la norme.
- **Recommandations avancées fiabilisées** : une erreur de calcul gonflait le poids des variables
  à grands nombres (les pas comptaient ~2 000× trop) ; le modèle écarte désormais les données qui
  disent la même chose (et le dit), règle tout seul sa prudence, et ne propose une piste que si
  l'effet est suffisant. Sur données de test, ses prédictions hors-échantillon sont meilleures
  (R² 0,46 → 0,57). Chiffres à la française sur cette page (v65).
- **Tags d'habitudes** : en notant votre bien-être, cochez en un tap alcool, café après 14 h,
  repas tardif, écran tard, sport le soir, stress ou malade (facultatif). Nouvelle section « Vos
  habitudes » dans Recommandations : bien-être les jours avec vs sans chaque tag (le lendemain pour
  les habitudes du soir), avec nombre de jours et niveau de confiance. Il faut 5 jours avec et 5
  sans pour qu'un tag soit comparé — **pensez à les cocher**, c'est ce qui permettra ensuite des
  pistes du type « moins d'écran le soir ». (v66)
- **Analyse photo plus discrète** : la photo est réduite et débarrassée de sa position GPS, de sa
  date et du modèle du téléphone avant l'envoi à Gemini ; l'app explique ce qui part chez Google et
  prévient qu'avec une clé **gratuite**, Google peut utiliser les photos. Modèle par défaut :
  **Gemini 3.8 Flash** (l'ancien 2.5 n'est plus ouvert aux nouvelles clés), réglable dans Paramètres,
  avec bascule automatique si un modèle n'est pas disponible.
- **Mesures lisibles** : vos pesées Withings apparaissent enfin en « 77,2 kg » / « Masse grasse
  24,1 % » dans « Dernières entrées » (avant : une ligne de données techniques) ; VFC, FC au repos
  et saturation en oxygène ont leur propre titre et des unités françaises (avant :
  « millisecond », « percent ») ; activités traduites (« Vélo » au lieu de « cycling ») ;
  « Hypothèse incertaine » accordé, plus de « −0,00 ».

- **Radar forme** (en haut du tableau de bord) : chaque jour, votre FC au repos, votre VFC et votre
  sommeil sont comparés à vos 60 jours précédents. Si **au moins deux** s'écartent en même temps dans
  le mauvais sens, le radar passe en « À surveiller », puis « Depuis N jours » si cela se répète,
  avec vos valeurs vs habituelles et des conseils prudents (repos, sommeil, entraînement allégé ;
  professionnel de santé si fièvre ou symptômes qui durent). Jamais un diagnostic. ~2 semaines de
  mesures nécessaires.
- **Analyse photo corrigeable** (Alimentation) : après l'analyse, chaque ingrédient a ses grammes
  modifiables (champ ou − / + 10 g) avec ses kcal et le total du repas ; supprimez un ingrédient
  mal reconnu, ajoutez un oubli par recherche. Les estimations douteuses (huile, sauce) sont
  marquées « à vérifier ». Avant, un aliment au nom légèrement différent de la base disparaissait
  sans prévenir : il est désormais retrouvé (accents, virgules) ou signalé, avec « Remplacer ».
  Le nom du plat et les kcal apparaissent dans « Derniers repas ».
- **Supprimer une saisie par erreur** : repas, note de bien-être ou cigarette ont un bouton
  « Supprimer » (avec confirmation) sur le tableau de bord et dans Alimentation ; les analyses se
  recalculent aussitôt. Les données de la montre/balance ne sont pas supprimables (elles
  reviendraient à la synchro).
- **Sauvegarde vraiment complète** : la sauvegarde JSON laissait de côté les mesures les plus
  anciennes au-delà de quelques milliers (FC, VFC, poids…) — elle contient maintenant tout.
- **Modifier un repas enregistré** (Alimentation → « Modifier ») : corrigez les grammes, retirez ou
  ajoutez un ingrédient, changez l'heure (un déjeuner enregistré le soir) — kcal recalculées en
  direct, analyses mises à jour aussitôt.
- **Tableau de bord « Vos derniers jours »** : fini la longue liste d'une carte par mesure de FC ou
  par cigarette. Une carte par jour avec son résumé (sommeil de la nuit — rangé au jour du réveil —,
  pas, FC au repos, VFC, plage de FC, dépense, bien-être, repas ≈ kcal, cigarettes), puis vos saisies
  du jour avec leur heure (toujours supprimables). 3 jours affichés, « Voir les jours précédents »
  remonte jusqu'à 2 semaines.
- **Repas sans photo** (Alimentation) : « ✍️ Saisir sans photo » — cherchez les aliments, ajustez
  les grammes, c'est enregistré (sans clé Gemini, rien ne part en ligne). « **Repas habituels** » :
  vos repas les plus fréquents en haut de la page, repris en un tap avec les quantités de la
  dernière fois ; bouton « Refaire » sur chaque repas de la liste.
- **Recommandations : le sommeil compte enfin au bon jour.** Les analyses rattachaient chaque nuit
  au jour du *coucher* : votre bien-être du soir était comparé à la nuit qui suivait. Une nuit compte
  maintenant pour le jour du réveil (comme sur le tableau de bord et le Radar), et les éveils / le
  temps « au lit » ne gonflent plus la durée. **Vos pistes peuvent changer** après la mise à jour :
  c'est voulu (sur la démo, « Dormir un peu plus longtemps » passe de invisible à n°1).
- **Barre d'onglets en bas** : la navigation passe en bas de l'écran, à portée de pouce — Accueil,
  Repas, Nutrition, Analyses (= Recommandations) et **Plus** (Données, Connecteurs, Paramètres,
  Nouveautés, avec un point rouge s'il y a du nouveau). L'en-tête tient sur une ligne : le contenu
  commence ~170 px plus haut sur chaque page.
- **Barre d'onglets au-dessus des boutons d'Android** : sur Android 15/16, l'app est dessinée sous
  la barre d'état et la barre de navigation. Vérifié sur un émulateur Android 16 : l'heure recouvrait
  le haut de page, le trait gestuel passait sur les onglets et les boutons de la fenêtre « Comment vous
  sentez-vous ? » étaient coupés. Corrigé : tout reste dans la zone visible (v77).
- **Décrire un repas en quelques mots** (Repas → « Décrire ou saisir sans photo ») : écrivez ou dictez avec le
  micro du clavier « 2 œufs au plat, une tartine beurrée et un café », touchez « Remplir avec Gemini » : les
  aliments et leurs grammes s'affichent, à corriger avant d'enregistrer. L'huile ou le beurre de cuisson probables
  sont ajoutés et marqués « à vérifier ». Seul le texte part chez Google ; les calories sont calculées sur le
  téléphone. Chercher « œuf » avec le œ du clavier fonctionne enfin.
- **Restaurer une sauvegarde sans risque** (Plus → Données → Importer) : avant, choisir un fichier effaçait
  **immédiatement** toutes vos données — y compris si c'était le mauvais fichier. Désormais vous voyez d'abord le
  contenu (date, nombre d'entrées, période, repas / notes / mesures), puis vous choisissez « **Ajouter à mes
  données** » (sans doublons, rien de perdu) ou « Remplacer mes données » (avec confirmation). Un fichier qui n'est
  pas une sauvegarde HealthTrack est refusé sans rien toucher.
- **Analyses : le week-end n'est plus pris pour une habitude.** Le week-end, on dort, marche et se sent
  différemment ; une habitude plus fréquente le samedi pouvait être créditée de la bonne humeur du week-end. Les
  corrélations, les pistes et le modèle avancé tiennent maintenant compte du jour de la semaine ; la page Analyses
  affiche votre bien-être moyen le week-end et en semaine, et l'effet propre du week-end (« +0,4 point »).
  **Vos pistes peuvent légèrement changer** : c'est voulu.
- **Vos habitudes, à type de jour égal** : un verre le vendredi soir était jugé sur votre humeur du samedi… qui est
  souvent meilleure, week-end oblige — l'effet réel pouvait disparaître. Les lendemains de week-end sont maintenant
  comparés à d'autres jours de week-end, et la semaine à la semaine. Quand ça change le résultat, la carte l'indique
  (« Week-end comparé au week-end, semaine à la semaine : −0,8 point »).

**En coulisses**
- Outil de vérification visuelle (`npm run visual`) : chaque run capture l'app comme sur un Galaxy A56.
- CI Android réparée : le build de l'APK échouait sur les runners GitHub actuels → sans correctif,
  plus aucune release n'aurait été publiée (release v59 = premier build réparé).
- Veille initiale : 28 idées classées et sourcées (`RESEARCH.md`), intégrées au backlog.
- Le test sur émulateur Android capture enfin **l'app réellement ouverte** (avant : écran blanc puis
  écran d'accueil d'Android) — c'est ce qui a révélé le problème des barres système.
- Veille du 10/10 : saisie des repas en texte par IA (le modèle ne doit donner qu'aliments et grammes,
  les nutriments venant de la table locale), effet du jour de la semaine sur le bien-être, régularité
  du sommeil, coachs IA. Détails dans `RESEARCH.md`.
- Modèle avancé : la variable « week-end » est un contrôle **non réduit** par la régularisation (sinon une partie
  de son effet retombait sur les pas) ; sur la démo, il retrouve exactement l'effet simulé (+0,4 point).
- Nouveau module statistique testé (n effectif, p-valeurs, correction Benjamini-Hochberg) : socle
  des futures analyses (expériences personnelles, radar).

**Points d'attention**
- ⚠️ **Refaites une sauvegarde** (Données → Télécharger la sauvegarde) après la mise à jour : les
  sauvegardes faites avant la v71 peuvent être incomplètes si vous avez beaucoup de mesures de la
  montre. Rien n'a été perdu sur le téléphone lui-même, seulement dans le fichier exporté.
- Avec une clé Gemini **gratuite**, Google peut utiliser et faire relire les photos analysées →
  désormais signalé dans l'app. Le passage à Gemini 3.8 Flash n'a pas pu être testé avec une vraie
  clé : **si l'analyse photo échoue, essayez un autre modèle dans Paramètres** et dites-le-moi.
- La PR #55 restée en attente a été fusionnée au run suivant (release v61) : la fusion passe par
  l'outil GitHub MCP. Si une fusion est de nouveau refusée, autoriser la fusion pour les sessions
  de la routine.
- Le test sur émulateur **Android 16 (API 36)** échoue à la création de l'émulateur (problème
  côté GitHub, sans lien avec le code) ; Android 15 et la publication des releases fonctionnent.
- Analyse photo : la réponse est maintenant demandée à Gemini dans un format strict ; si un modèle
  le refuse, l'app réessaie automatiquement sans. Non testé avec une vraie clé : **si l'analyse
  photo échoue depuis la mise à jour, dites-le-moi**.
- Après la v75, les **Recommandations** (basiques et avancées) peuvent changer : correction du
  rattachement du sommeil, pas un caprice du modèle.
- **Repas décrit en texte** : pas pu être testé avec une vraie clé Gemini. **Essayez-le sur 2–3 repas** et dites-moi
  si des aliments manquent ou si les grammes sont aberrants : le prompt sera ajusté.
- **Barre d'onglets** : corrigée et vérifiée sur émulateur Android 16 (v77). Si sur votre A56 elle
  paraît trop haute (espace vide sous les onglets) ou encore cachée, dites-le-moi.
- Le Radar n'a été vérifié que sur données simulées : **dites-moi s'il se déclenche à tort ou trop
  tard** chez vous, les seuils seront ajustés.

**Prochaines priorités** — effets décalés (J-1 → J) dans les analyses, chasse aux bugs des formulaires, mise à jour de Capacitor.

| Run | Type | Résultat |
|---|---|---|
| 08/10 17:00 — [Mise en place](runs/2026-10-08-1700-mise-en-place.md) | 🏗️ | PR #52 fusionnée → v59 |
| 08/10 17:40 — [Lisibilité tableau de bord / Paramètres](runs/2026-10-08-1740-debordements-libelles.md) | 🐛 | PR #55 fusionnée au run suivant → v61 |
| 08/10 18:30 — [Pistes à tester (Recommandations)](runs/2026-10-08-1830-pistes-a-tester.md) | 🏗️ | PR #56 fusionnée → v62 |
| 08/10 20:30 — [Page Nutrition juste et lisible](runs/2026-10-08-2030-nutrition.md) | 🐛 | PR #58 fusionnée → v63 |
| 08/10 22:30 — [Cœur vs votre norme (FC repos / VFC)](runs/2026-10-08-2230-norme-coeur.md) | 🏗️ | PR #60 fusionnée → v64 |
| 09/10 00:30 — [Recommandations avancées fiabilisées](runs/2026-10-09-0030-modele-avance.md) | 🏗️ | PR #62 fusionnée → v65 |
| 09/10 02:30 — [Tags d'habitudes](runs/2026-10-09-0230-tags-habitudes.md) | 🏗️ | PR #64 fusionnée → v66 |
| 09/10 04:30 — [Transparence Gemini](runs/2026-10-09-0430-transparence-gemini.md) | 🔒 | PR #66 fusionnée → v67 |
| 09/10 06:30 — [Mesures lisibles, libellés justes](runs/2026-10-09-0630-libelles-justes.md) | 🐛 | PR #68 fusionnée → v68 |
| 09/10 08:30 — [Radar forme](runs/2026-10-09-0830-radar-forme.md) | 🏗️ | PR #69 fusionnée → v69 |
| 09/10 10:30 — [Analyse photo corrigeable](runs/2026-10-09-1030-analyse-photo.md) | 🏗️ | PR #71 fusionnée → v70 |
| 09/10 12:30 — [Supprimer une saisie, sauvegarde complète](runs/2026-10-09-1230-supprimer-sauvegarde.md) | 🐛 | PR #72 fusionnée → v71 |
| 09/10 14:30 — [Modifier un repas enregistré](runs/2026-10-09-1430-modifier-repas.md) | 🏗️ | PR #74 fusionnée → v72 |
| 09/10 16:30 — [Vos derniers jours (tableau de bord)](runs/2026-10-09-1630-journal-par-jour.md) | 🎨 | PR #76 fusionnée → v73 |
| 09/10 18:30 — [Repas sans photo, repas habituels](runs/2026-10-09-1830-repas-sans-photo.md) | 🏗️ | PR #78 fusionnée → v74 |
| 09/10 20:30 — [Sommeil au bon jour dans les analyses](runs/2026-10-09-2030-sommeil-analyses.md) | 🐛 | PR #80 fusionnée → v75 |
| 09/10 22:30 — [Barre d'onglets en bas](runs/2026-10-09-2230-barre-onglets.md) | 🎨 | PR #81 fusionnée → v76 |
| 10/10 00:30 — [Veille + barres système Android](runs/2026-10-10-0030-veille-zones-systeme.md) | 🔭 | PR #82 fusionnée → v77 |
| 10/10 02:30 — [Repas décrit en quelques mots](runs/2026-10-10-0230-repas-decrit.md) | 🏗️ | PR #84 fusionnée → v78 |
| 10/10 04:30 — [Restaurer une sauvegarde sans risque](runs/2026-10-10-0430-import-sur.md) | 🐛 | PR #85 fusionnée → v79 |
| 10/10 06:30 — [Analyses : contrôle du week-end](runs/2026-10-10-0630-controle-week-end.md) | 🏗️ | PR #86 fusionnée → v80 |
| 10/10 08:30 — [Vos habitudes à type de jour égal](runs/2026-10-10-0830-habitudes-week-end.md) | 🏗️ | PR #87 |

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
| `runs/AAAA-MM-JJ-HHMM-<slug>.md` | Un compte rendu par exécution (un fichier par run = pas de conflit Git) |
| `semaines/AAAA-Sww.md` | Résumés des semaines passées |

---

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
  `--routes=/,/food`, `--radar` (début d'infection simulé), `--food-analysis` (analyse photo
  simulée sur /food, réponse Gemini factice), `--update-banner`, `--wellbeing-prompt`, `--whats-new`, `--out=`,
  `--click="Recommandations avancées"` (clique un bouton avant la capture, ex. un onglet),
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

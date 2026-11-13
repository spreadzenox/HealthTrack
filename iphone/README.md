# iphone/ — la version iPhone de Halcya

Ce dossier contient tout ce qui vivait dans le dépôt `spreadzenox/HealthTrack-iOS` : il y est importé tel quel par
[`fusion/importer.sh`](fusion/importer.sh), relançable à tout moment jusqu'à la bascule
([`fusion/BASCULE.md`](fusion/BASCULE.md)). Le dernier import est noté dans `fusion/IMPORT.json`.

| Ici | Rôle |
| --- | --- |
| `upstream.json` | le commit de **ce dépôt** dont le code est embarqué dans l'app iPhone, et son numéro de version |
| `scripts/upstream.sh` | prépare `upstream/` (ignoré par git) : le code à ce commit + `patches/` + `overlay/` + `ios/` |
| `patches/`, `overlay/` | correctifs du code partagé et fichiers ajoutés pour l'iPhone |
| `ios/`, `uitests/` | projet Xcode, paquets Swift, tests d'interface |
| `store/`, `scripts/store-*.mjs` | fiche App Store, abonnements, examen bêta (API App Store Connect) |
| `site/`, `scripts/site.mjs` | pages publiques de l'iPhone (confidentialité, conditions, assistance) |
| `journal/` | le journal de la routine iOS jusqu'à la bascule (charte, parité, backlog, comptes rendus) |
| `fusion/` | import, portage des workflows, interrupteur de publication, liste de bascule, instructions proposées |

Les workflows sont dans `.github/workflows/ios-*.yml`, à la racine du dépôt. Toutes les commandes se lancent depuis
`iphone/` : les scripts, les chemins de la charte (`journal/README.md` § 3) et ceux des comptes rendus restent vrais
tels qu'ils sont écrits.

## Ce qui change par rapport au dépôt HealthTrack-iOS

- **Le code n'est plus téléchargé.** `scripts/upstream.sh` lit le commit de `upstream.json` dans ce dépôt
  (`git archive`), sans réseau. `upstream/` reste un petit dépôt git jetable : `git -C upstream diff HEAD -- <fichier>`
  et `git -C upstream apply --3way` marchent comme avant. Il faut l'historique des commits (clone complet, ou
  `git fetch --unshallow --filter=blob:none`).
- **« Lecture seule » n'a plus cours** : `app/`, `relay/` et le journal du produit sont dans le même dépôt. Les § 2 et
  « DEMANDES » de la charte, `journal/DEMANDES.md`, `journal/POUR-ORCHESTRATEUR.md`, `journal/PROMPT-ROUTINE.md` et
  `journal/POUR-IOS.md` (à la racine) décrivent l'ancien montage : à archiver par la routine unique à son premier run.
- **Workflows** : mêmes étapes, préfixe `ios-`, dossier de travail `iphone/`, filtres sur `iphone/**`. Ils sont
  générés par `fusion/porter-workflows.mjs` jusqu'à la bascule ; ensuite ce sont des fichiers ordinaires.
- **Publication** : les workflows de l'environnement `appstore` commencent par une garde
  (`fusion/garde.sh`) : branche `main` de ce dépôt et `fusion/bascule.json` à `true`, sinon rien ne démarre.
- **Captures** : toujours sur les branches `captures/pr-<N>`, `captures/main`, `captures/store`, `captures/store-ipad`,
  maintenant dans ce dépôt.

## Sort des correctifs

À la bascule, rien ne change : le commit épinglé par `upstream.json` est celui que suivait le dépôt iOS, les mêmes
correctifs s'y appliquent, l'app construite est la même. C'est ce qui rend la bascule sans risque pour les testeurs.

Ensuite, la routine unique fait fondre `patches/` dans le code partagé, un sujet à la fois :

1. passer `upstream.json` à `"commit": "HEAD"` : `upstream.sh` prend alors les fichiers du dossier de travail, et une
   même PR peut changer `app/` et le correctif qui en dépend. Ajouter dans la même PR `app/**` et `relay/**` aux
   filtres de `ios-build.yml` (pas `app/android/**`), et un job léger (Ubuntu) « les correctifs s'appliquent » aux
   PR qui touchent `app/src/**`, pour qu'une PR Android ne casse plus l'iPhone sans le voir ;
2. remplacer chaque correctif par une condition sur la plateforme ou la variante dans `app/src/` (la variante
   `appstore` du correctif 01 en premier : presque tous les autres en dépendent), avec ses tests ; déplacer les
   fichiers d'`overlay/app/src/` dans `app/src/` ;
3. quand `patches/` et `overlay/` sont vides : `ios/` devient `app/ios/`, `upstream.sh` et `upstream.json`
   disparaissent, la build iOS se fait dans `app/`.

Tant que l'étape 1 n'est pas faite, la routine avance `upstream.json` comme avant (`scripts/upstream.sh --latest`).

## Versions

- **Version affichée dans l'app** : le `versionCode` du code embarqué (`upstream.json`), comme avant.
- **Version TestFlight** (`CFBundleShortVersionString`) : `testflight-version.json` (893 pendant le cycle), comme avant.
- **Numéro de build** (`CFBundleVersion`) : `<versionCode du code embarqué>.<nombre de commits de main de ce dépôt>`,
  par exemple `1019.1040`. C'est la même ligne dans les workflows (`git rev-list --count HEAD`), mais le compteur est
  désormais celui du dépôt unique. Il est plus grand que le dernier compteur du dépôt iOS (520 à l'import) et le
  restera, donc chaque build est acceptée par TestFlight après les précédentes de la version 893 ; il augmente à
  chaque merge ; et il se lit seul : « code de la version 1019, construit au 1040ᵉ commit du dépôt ». Aucun
  décalage à retenir, aucun fichier à tenir.
- **Build 844.344, version 844** : réservée à la soumission du propriétaire. Aucune build de la version 844 ne peut
  être produite ici (les builds portent la version de `testflight-version.json`), et
  `scripts/store-beta-expire.mjs` refuse de l'expirer (`PROTECTED`, testé).

## Site

`ios-site.yml` construit et vérifie les trois pages à chaque changement, sans rien publier. Les adresses inscrites
dans la fiche App Store (`https://spreadzenox.github.io/HealthTrack-iOS/confidentialite/` et `/assistance/`,
`scripts/store-push.mjs`) restent servies par le site du dépôt iOS, qui continue d'exister même archivé. Étape
suivante pour la routine : publier ces pages avec le site de ce dépôt (sous `/HealthTrack/iphone/`, dans `pages.yml`),
puis changer les adresses de la fiche à la version suivante de l'App Store.

## Avant d'archiver le dépôt iOS

Le correctif 27 envoie « Votre avis » de l'iPhone vers les tickets de `HealthTrack-iOS`, et un dépôt archivé
n'accepte plus de ticket. Tant que des testeurs ont une build qui pointe là-bas, le dépôt iOS reste ouvert, avec un
README qui renvoie ici ; on l'archive quand les avis de l'iPhone arrivent ailleurs et que les pages ont déménagé.

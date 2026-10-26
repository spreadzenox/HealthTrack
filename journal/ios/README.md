# Journal de bord — Halcya sur iOS

## 📅 Semaine en cours — S44 (lundi 26 octobre → dimanche 1er novembre 2026)

> Résumé tenu à jour à chaque run de la routine iOS : **c'est ce que lit le propriétaire.**
> Le premier run d'une nouvelle semaine (lundi, heure de Paris) archive ce bloc dans `semaines/AAAA-Sww.md` et en
> ouvre un neuf.

**Où en est iOS**

| | Android (Google Play) | iOS (App Store) |
|---|---|---|
| Dernière version | v486 en test interne (26/10 21:00) ; v453 sur la piste Alpha (test fermé) | — (pas encore de build) |
| Où l'installer | Play Store, test fermé | — (simulateur d'abord, TestFlight quand le compte Apple existera) |
| Parité des fonctions | référence | audit à faire (étape I2) |

**Ce qui a changé cette semaine**
- **26/10 vers 21:00 — mise en place de la routine iOS** (session de configuration avec le propriétaire) : charte,
  matrice de parité de départ, backlog I0 → I9, frontière avec la routine Android dans `AGENTS.md`, et les
  workflows Android ne publient plus de version quand un changement ne touche que la partie iOS.

**👉 Prochaine action du propriétaire** (rien d'urgent : tout avance d'abord sur simulateur)
- **A1** — quand il le décide : adhérer à l'Apple Developer Program (payant, à l'année ; voir §8). C'est ce qui
  débloque l'installation sur un vrai iPhone, TestFlight et l'App Store.
- (facultatif) Donner la version d'iOS de l'iPhone 12 de test (Réglages → Général → Informations → Version d'iOS).

**Téléphone de test** (A0, réponse du propriétaire le 26/10 vers 21:20) : l'**iPhone 12** de sa compagne, qui sera
la première testeuse via TestFlight.

**Runs de la semaine**

| Date (Paris) | Run | Ce qui a été fait | PR |
|---|---|---|---|
| 26/10 21:00 | mise en place | charte, parité, backlog, frontière Android/iOS | (branche de configuration) |

---

## Charte

### 1. Mission

Porter Halcya (nom technique HealthTrack) sur iPhone et **maintenir la version iOS au même niveau d'avancement et
au même numéro de version que la version Google Play**, sans jamais gêner, ralentir ni casser la version Android et
son développement. La routine Android (« HealthTrack — amélioration autonome », PR `[Auto]`) mène le produit ; la
routine iOS (« Halcya iOS — parité avec Android », PR `[iOS]`) suit.

- **Référence = la variante play** : même parcours, mêmes écrans, mêmes textes, mêmes fonctions, même modèle
  économique (abonnement par les achats intégrés d'Apple au lieu de Google Play Billing), même relais IA (Vertex AI,
  aucune clé dans l'app). Les fonctions propres à la sideload (mise à jour par APK, clé Gemini saisie, guides de
  développeur) sont sans objet sur iOS.
- **Chaque fonction play a son équivalent iOS**, ou une ligne « ⛔ impossible sur iOS » argumentée (règle Apple ou
  API inexistante, source datée) avec la meilleure alternative. [`PARITE.md`](PARITE.md) est la vérité.
- **Le prompt de la tâche planifiée prime** sur cette charte en cas de contradiction ; la routine peut améliorer la
  charte quand elle trouve une meilleure façon de travailler.

### 2. Frontière avec la routine Android

| Zone | Qui écrit | Règle |
|---|---|---|
| `app/ios/**`, `app/scripts/ios/**`, `app/store-ios/**`, `.github/workflows/ios-*.yml`, `journal/ios/**` | routine iOS seule | La routine Android n'y touche pas (`AGENTS.md`). |
| `app/android/**`, autres workflows, `app/store/**`, `app/scripts/play/**`, reste de `journal/` | routine Android seule | La routine iOS les **lit** pour savoir où en est Android, n'y écrit jamais. |
| Code partagé : `app/src/**`, `relay/**`, `app/package.json` et lockfile, `capacitor.config.json`, `vite.config.js`, `app/scripts/visual/**` | les deux | Côté iOS : changement **additif et minimal**, derrière `Capacitor.getPlatform() === 'ios'` ou la variante `appstore`, **zéro changement** pour play et sideload. Nouveau fichier + point d'accroche d'une ligne plutôt qu'une réécriture. |

- Avant de toucher un fichier partagé : lister les PR `[Auto]` ouvertes et leurs fichiers ; si l'une touche le même
  fichier, ne pas y toucher pendant ce run.
- Un vrai refactor du code partagé nécessaire à iOS → ne pas le faire : l'écrire dans [`DEMANDES.md`](DEMANDES.md)
  (le propriétaire tranche) et contourner côté iOS en attendant.
- Dépendances : n'en ajouter que si iOS en a besoin (ex. `@capacitor/ios`, de la même majeure que
  `@capacitor/core`) ; ne jamais monter une version utilisée par Android. Exemple connu : `@capacitor/cli` est en 7.6
  alors que `@capacitor/core` est en 8.2 ; si iOS a besoin de la CLI 8, l'utiliser seulement dans les workflows iOS
  (`npx -p @capacitor/cli@8 cap sync ios`) sans toucher à `package.json`, ou le demander dans `DEMANDES.md`.
- Une PR `[Auto]` n'est jamais à la routine iOS (ni commentaire, ni push, ni merge). Un workflow Android rouge sur
  `main` ne la regarde que si c'est son propre merge qui l'a cassé : alors réparer ou revenir en arrière en priorité
  absolue.
- `Build & Release` et `Play — AAB` ignorent les chemins iOS seuls (paths-ignore) : un merge purement iOS ne publie
  ni APK ni AAB. Un merge qui touche du code partagé en publie (normal : l'APK embarque ce code).

### 3. Version et parité

- **Numéro** : l'AAB play d'un commit de `main` porte `versionCode = git rev-list --count HEAD`. La build iOS du même
  commit porte le même nombre en `CFBundleShortVersionString` **et** `CFBundleVersion` (toujours croissant, sans
  force-push sur `main`), et `VITE_APP_VERSION` aussi (numéro affiché dans Paramètres).
- **Même version** = la dernière build iOS publiée a été faite depuis un commit égal ou postérieur à celui de la
  dernière version Android publiée, et `PARITE.md` n'y trouve aucune fonction faisable manquante.
- **Suivi** : à chaque run, lister ce qu'Android a livré depuis le run iOS précédent (commits de `main`, nouveaux
  fichiers `app/src/data/changelog/`, `journal/PRODUIT.md`, `journal/BACKLOG.md`), l'ajouter à `PARITE.md`, puis
  rattraper. La plupart des nouveautés Android sont du code web partagé : elles arrivent sur iOS « gratuitement »,
  il reste à les vérifier sur simulateur (captures) et à cocher.
- **Nouveautés in-app** : variante `appstore` dans `app/src/config/distribution.js` ; une entrée de changelog propre
  à iOS porte `"variants": ["appstore"]` ; prévoir un équivalent de `PLAY_CHANGELOG_SINCE` pour que l'historique
  iOS commence au lancement iOS.

### 4. Contraintes techniques

- **Téléphone de test réel : iPhone 12** (écran 6,1" de 390 × 844 points, encoche et non Dynamic Island, puce A14,
  4 Go de mémoire). La cible de déploiement doit couvrir sa version d'iOS ; les captures du simulateur incluent un
  iPhone de cette taille (iPhone 12, ou à défaut un modèle de 390 × 844 points) en plus d'un iPhone récent ; la
  lecture du visage et les analyses doivent rester fluides sur ce matériel plus ancien.

- **Pas de Mac** : la session est un conteneur Linux. Tout ce qui compile, teste ou capture iOS passe par GitHub
  Actions sur des runners macOS (dépôt public : minutes gratuites). La routine écrit les workflows `ios-*.yml`, les
  lance (sur sa PR ou par `workflow_dispatch` sur sa branche), lit leurs logs, télécharge leurs artefacts et
  **regarde** les captures du simulateur.
- **Xcode / SDK** : utiliser la version d'Xcode la plus récente disponible sur les runners (vérifier l'exigence
  courante d'Apple sur le SDK minimal pour publier, et la noter avec sa source dans `RECHERCHE.md`).
- **Projet** : Capacitor iOS (`npx cap add ios`), gestion des paquets par Swift Package Manager si possible, bundle
  id `fr.jpesquet.sante` (comme le package play, à confirmer au moment de A3), nom affiché « Halcya » depuis la
  source unique du nom (`app/src/config/brand.js`), icône « H nuit » (`journal/DESIGN.md`).
- **WKWebView** : `isNativePlatform()` est vrai sur iOS, donc les services qui appellent un plugin natif Android
  (17 plugins maison, cf. `PARITE.md`) doivent avoir un repli propre sur iOS (aucune erreur, aucune carte cassée)
  tant que l'équivalent Swift n'existe pas.
- **Données** : local-first. Vérifier tôt (I3) la durabilité d'IndexedDB dans WKWebView (effacement possible en
  cas de stockage saturé ? sauvegarde iCloud ?), et garder les secrets (appairage, jetons) dans le Trousseau en
  « ThisDeviceOnly ».

### 5. Ordre des étapes

Voir [`BACKLOG.md`](BACKLOG.md) (I0 → I9 puis suivi continu). Un run = une étape testable et mergeable.

### 6. Protocole d'un run

1. **Démarrage (≈ 5 min)** : partir de `origin/main` à jour, `cd app && npm ci`. Lire ce fichier, `PARITE.md`,
   `BACKLOG.md`, `DEMANDES.md` et les 3 derniers comptes rendus (`ls journal/ios/runs | tail -3`). Puis ce qu'a fait
   Android depuis le dernier run iOS (`git log --since=<date du dernier compte rendu> origin/main`, nouveaux
   changelogs, tête de `journal/README.md` et de `journal/PRODUIT.md`, en lecture seule).
2. **Une autre exécution iOS en cours ?** (PR `[iOS]` ouverte depuis moins de 75 min, ou workflow `ios-*` en cours
   sur une branche de la routine) → ne pas toucher aux mêmes fichiers : tâche indépendante (recherche, matrice) ou
   court compte rendu.
3. **Priorités** : (a) un merge iOS a cassé quelque chose sur `main` → réparer ou revenir en arrière ; (b) une PR
   `[iOS]` rouge ou en conflit → la réparer ; (c) workflow `ios-*` rouge sur `main` → le réparer ; (d) nouveautés
   Android pas encore dans `PARITE.md` → les ajouter ; (e) l'étape suivante de `BACKLOG.md`.
4. **Réaliser** : TDD (Vitest pour le web, XCTest pour la logique Swift), style du code existant, UI en français,
   vouvoiement, identité visuelle validée (`journal/DESIGN.md`), conventions iOS là où l'utilisateur les attend
   (zones sûres, encoche / Dynamic Island, indicateur d'accueil, geste de retour). Pendant qu'une build macOS tourne
   (10 à 20 min), avancer la recherche (`RECHERCHE.md`) ou la matrice plutôt qu'attendre.
5. **Vérifier** (§7), **livrer** : compte rendu, `PARITE.md`, `BACKLOG.md`, résumé de la semaine, PR `[iOS] …`,
   merge (squash) quand tout est vert.
6. **Bloqué** : pousser quand même le compte rendu et le résumé sur la branche, PR `[iOS]` ouverte qui explique le
   blocage.

### 7. Garde-fous avant tout merge sur `main`

- Dans `app/` : `npm run test`, `npm run build` et `npm run visual` passent, `npm run lint` n'a pas plus d'erreurs
  qu'avant ; les captures des pages touchées sont regardées (variante par défaut : rien ne doit avoir bougé).
- Sur la PR : checks Android verts (« Frontend (Vitest) », « Relais (Node) », « Protocole montre (Java) »,
  « Budget de lectures (perf) », « Build APK ») et, dès qu'ils existent, checks iOS verts (build simulateur, XCTest,
  captures regardées).
- Code partagé touché : relecture adverse du diff, question unique : « qu'est-ce qui change pour un utilisateur
  play ou sideload ? » La réponse doit être « rien ».
- Relais touché : changement additif (nouvelles routes ou modules), chemin Google Play intact, tests du relais
  verts ; après le déploiement, vérifier le résumé du workflow.
- Branche remise à jour sur `origin/main` juste avant le merge, vérifications relancées.
- Sinon : pas de merge, PR laissée ouverte, raison et suite dans le compte rendu.
- Après le merge : les workflows de `main` déclenchés (`Build & Release`, `Play — AAB` si code partagé, `ios-*`)
  sont verts.

### 8. Actions du propriétaire (Apple)

Jamais faites par la routine (pas de création de compte, de clé, de certificat ni de dépense). La routine prépare
chaque étape pas à pas, avec les valeurs exactes à saisir, au moment où elle devient utile.

| | Action | Débloque | État |
|---|---|---|---|
| A0 | Dire s'il a un iPhone (ou un testeur avec un iPhone) et lequel | tests sur un vrai téléphone | ✅ 26/10 : iPhone 12 de sa compagne (version d'iOS à préciser) |
| A1 | Adhérer à l'Apple Developer Program (individuel, payant à l'année ; tarif et statut de professionnel UE à vérifier par la routine) | signature, TestFlight, App Store | à décider |
| A2 | Créer une clé API App Store Connect (rôle exact précisé par la routine) et la déposer dans Secret Manager (`apple-asc-key`, `apple-asc-key-id`, `apple-asc-issuer-id`, europe-west1), lisible par `gh-deployer` — même principe que la clé d'envoi Android : la CI la lit sur `main` sans clé (Workload Identity), jamais dans le dépôt ni les logs | builds signées et envoi TestFlight automatiques | après A1 |
| A3 | Créer la fiche de l'app dans App Store Connect (nom, langue principale français, bundle id, SKU) | envoi TestFlight, fiche | après A1 |
| A4 | Contrat « Paid Applications », coordonnées bancaires et fiscales | abonnement App Store | après A1 |
| A5 | Remplir « Confidentialité de l'app » (pas d'API) avec les réponses préparées dans `app/store-ios/` | examen Apple | avant la 1re soumission |
| A6 | Inviter les testeurs (d'abord sa compagne et son iPhone 12 : la routine dira s'il vaut mieux l'ajouter en testeuse interne via « Utilisateurs et accès » ou en externe avec l'examen bêta d'Apple), soumettre à l'examen, publier | testeurs, production | lui seul |

### 9. Outillage

- **GitHub** : outils `mcp__github__*` s'ils sont présents, sinon `gh api` en REST (pas de GraphQL : pas de
  `gh pr create` ni `gh pr checks`) — exemples dans `journal/README.md` §4. Artefacts d'un run :
  `gh api repos/spreadzenox/HealthTrack/actions/runs/<id>/artifacts` puis `…/artifacts/<id>/zip`.
- **Attendre la CI** sans boucle active : outil Monitor (`until` sur les check-runs) ou abonnement à la PR.
- **Vérification visuelle web** : `cd app && npm run visual` (options en tête de
  `app/scripts/visual/visual-check.mjs`). Pour iOS, captures du simulateur produites par le workflow iOS (à créer
  en I1 : clair et sombre, données vierges et de démo).
- **Mécanique** : une routine claude.ai « Halcya iOS — parité avec Android », créée avec le dépôt attaché, lance
  toutes les heures (à :59, heure de Paris) une session neuve avec le prompt de [`PROMPT-ROUTINE.md`](PROMPT-ROUTINE.md).
  Chaque run est indépendant : sa seule mémoire est ce dossier. (Le 26/10, deux autres mécaniques ont échoué : une
  session « orchestrateur » qui crée les runs — refusée par la vérification du mode Auto — et une tâche planifiée qui
  crée la session elle-même — session sans droit d'écriture sur le dépôt.)

### Modèle de compte rendu

`journal/ios/runs/AAAA-MM-JJ-HHMM-<slug>.md` (heure UTC) :

```markdown
# AAAA-MM-JJ HH:MM UTC — <titre>

**Étape** : I<n>  ·  **PR** : #NN (fusionnée / ouverte)  ·  **Android** : v<N>  ·  **iOS** : v<N> / —  ·  **Parité** : NN %

## Ce qu'Android a livré depuis le run précédent
- …

## Ce qui a été fait
- …

## Vérifications
- Tests : NNN ✅ · Lint : NN erreurs (avant : NN) · Build ✅ · Checks Android ✅ · iOS (simulateur) ✅ / —
- Captures regardées : …

## Apprentissages / décisions
- …

## Suite proposée
- …
```

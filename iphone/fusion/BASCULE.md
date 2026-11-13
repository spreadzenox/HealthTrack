# Liste de bascule — un seul dépôt pour Android et l'iPhone

La branche `claude/fusion-ios` prépare tout ; la bascule se fait en une fois, un jour choisi avec le propriétaire.
Avant elle, rien ne change pour les testeurs : le dépôt iOS continue de livrer TestFlight, et ici aucun workflow iOS
ne peut publier (`bascule.json` à `false`, pas de secrets).

Durée : environ une heure, dont cinq minutes pour le propriétaire. Faire la bascule juste après un run de la routine
iOS (minute 59), pour avoir l'heure devant soi.

## Avant le jour J (orchestrateur ou session dédiée, sans le propriétaire)

1. Remettre `claude/fusion-ios` à jour sur `origin/main` (merge, pas de force-push).
2. Relancer l'import : `iphone/fusion/importer.sh`. S'il sort en code 3, reporter à la main les changements qu'il
   montre (`scripts/upstream.sh`, `CLAUDE.md`, `README.md` ou `pages.yml` du dépôt iOS), puis committer.
3. Vérifier la CI de la PR : checks Android verts, « iOS — build simulateur » vert, captures regardées
   (branche `captures/pr-<N>`).

## Jour J, dans l'ordre

| # | Qui | Quoi |
| --- | --- | --- |
| 1 | Orchestrateur | **Désactiver** (jamais supprimer) la tâche planifiée « Halcya iOS — parité avec Android ». Attendre la fin du run en cours et le merge de sa dernière PR dans le dépôt iOS. |
| 2 | Orchestrateur | Étapes 1 à 3 ci-dessus une dernière fois : l'import est alors l'état final du dépôt iOS. Noter le commit importé (`iphone/fusion/IMPORT.json`). |
| 3 | Propriétaire | Créer l'environnement et les trois secrets (détail ci-dessous). |
| 4 | Propriétaire | Dire « secrets créés », puis donner son accord pour merger la PR « [Fusion] ». |
| 5 | Orchestrateur | Merger la PR « [Fusion] » (squash). À ce stade rien ne part chez Apple : l'interrupteur est éteint. Vérifier sur `main` : « Tests », émulateurs, « Play — AAB » et « iOS — build simulateur » verts. |
| 6 | Orchestrateur | Ouvrir et merger une PR d'une ligne : `iphone/fusion/bascule.json` → `"publication": true`. |
| 7 | Orchestrateur | Lancer à la main « TestFlight — examen bêta (relevé) » (`ios-store-beta.yml`, lecture seule) sur `main` : il prouve que les trois secrets sont lus, sans rien envoyer. S'il échoue sur un secret, revenir à l'étape 3. |
| 8 | Orchestrateur | Première build : lancer « iOS — TestFlight » (`ios-testflight.yml`) sur `main`. Relever « Version 893, build `<versionCode>.<commits>` » dans le résumé du run ; le second nombre doit dépasser celui de la dernière build du dépôt iOS. Vérifier dans le relevé (étape 7 relancée) qu'Apple l'a traitée. |
| 9 | Orchestrateur | Refaire les captures de la fiche dans ce dépôt, pour que `ios-store-push.yml` les trouve : « iOS — build simulateur » lancé à la main avec `devices` = « iPhone 17 Pro Max », puis avec l'iPad de la fiche (branches `captures/store` et `captures/store-ipad`). Rien n'est envoyé à Apple par cette étape. |
| 10 | Orchestrateur | Mettre à jour les instructions : `orchestration/routine/` reprend [`ROUTINE-UNIQUE.md`](ROUTINE-UNIQUE.md) (nouvelle empreinte dans le lanceur), `orchestration/README.md` § 1, § 5 et § 6 (une seule routine, plus de `POUR-IOS.md`), `AGENTS.md` (une ligne sur `iphone/`). Envoyer le nouveau lanceur avant le run suivant. |
| 11 | Routine unique, premier run | Fusionner les résumés (une seule tête de `journal/README.md`, avec la ligne iPhone), archiver les fichiers de l'ancien montage (`iphone/README.md`), retirer l'en-tête « GÉNÉRÉ » des workflows `ios-*.yml`, et livrer normalement. |
| 12 | Propriétaire, quand il veut | Dans le dépôt `HealthTrack-iOS` : merger la PR que l'orchestrateur aura préparée (README qui renvoie ici, `testflight.yml` sans déclenchement sur `push`). **Ne pas archiver tout de suite** : voir « Avant d'archiver » dans `iphone/README.md`. |

### Étape 3, pas à pas (propriétaire, sur ordinateur, 5 minutes)

La clé est celle du 30/10 (« Halcya CI », rôle Admin). Si le fichier `.p8` n'a pas été gardé, il faut en créer une
nouvelle dans App Store Connect › Utilisateurs et accès › Intégrations › API App Store Connect, et révoquer l'ancienne
après la première build réussie. GitHub ne permet pas de relire ni de copier un secret d'un dépôt à l'autre.

1. Ouvrir `https://github.com/spreadzenox/HealthTrack/settings/environments` (dépôt HealthTrack › **Settings** ›
   **Environments**).
2. **New environment**, nom exact : `appstore` › **Configure environment**.
3. **Deployment branches and tags** : choisir **Selected branches and tags** › **Add deployment branch or tag rule** ›
   `main`. Décocher **Allow administrators to bypass configured protection rules**, comme dans le dépôt iOS.
4. **Environment secrets** › **Add environment secret**, trois fois, avec ces noms exacts :

   | Nom | Valeur |
   | --- | --- |
   | `ASC_ISSUER_ID` | l'« Issuer ID » affiché en haut de la page des clés d'App Store Connect |
   | `ASC_KEY_ID` | l'identifiant de la clé (10 caractères) |
   | `ASC_KEY_P8` | tout le contenu du fichier `.p8`, lignes `-----BEGIN PRIVATE KEY-----` et `-----END PRIVATE KEY-----` comprises |

5. Ne coller ces valeurs nulle part ailleurs : ni dans une conversation, ni dans un fichier, ni en secret du dépôt
   (**Environment** secrets, pas **Repository** secrets : seuls les jobs de `main` qui demandent `appstore` les lisent).

## Revenir en arrière

À chaque étape, le dépôt iOS est intact : rien n'y a été modifié avant l'étape 12.

- **Avant l'étape 6** : il suffit de réactiver la tâche horaire iOS. La PR « [Fusion] » mergée ne publie rien et ne
  gêne pas Android ; on peut la laisser, ou la reverter (une PR de revert).
- **Après l'étape 6, si la build TestFlight de ce dépôt est mauvaise ou refusée** : PR d'une ligne
  `bascule.json` → `false` (plus rien ne part d'ici), réactiver la tâche horaire iOS, et relancer `testflight.yml`
  dans le dépôt iOS après un commit quelconque : son numéro de build `<versionCode>.<commits iOS>` doit dépasser
  celui de la build envoyée d'ici pour le même `versionCode` ; si ce n'est pas le cas, avancer d'abord
  `upstream.json` là-bas (`scripts/upstream.sh --latest`), ce qui augmente le premier nombre.
- Les secrets créés ici peuvent rester : sans l'interrupteur, aucun job ne les demande.
- Une build déjà envoyée à Apple ne se retire pas, elle s'expire (`ios-store-beta-expire.yml`, jamais la 844.344).

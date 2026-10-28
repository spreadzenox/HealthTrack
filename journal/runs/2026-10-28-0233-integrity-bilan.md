# Run du 28/10/2026 02:33 (Paris, CET) — Bilan Play Integrity lisible (6b-2c-2)

**Type** : 🏗️ travail de fond (relais + app, rien de visible)

## Constat au démarrage
- Main à `77c48e7` (#449, R8), Build & Release / Play — AAB / Tests verts ; émulateur de main en cours.
- PR « [Auto] » #450 (journal du run R8, 01:26 UTC) ouverte, checks en cours → pas touché aux mêmes fichiers tant
  qu'elle n'était pas verte ; tous ses checks verts à 01:39 UTC → **mergée** (squash `982b24b`), branche remise à jour.
- Tâche indépendante choisie : **6b-2c**, jamais lu (« lis le bilan Play Integrity » du prompt, analyse du 24/10 13:38).

## Bilan lu (« Relais — déploiement » du 27/10 04:49, 7 jours)
| Statut | Mode | Installations | Événements |
|---|---|---|---|
| missing | observe | 45 | 51 |
| passed | observe | 1 | 1 |

- **Le téléphone du propriétaire passe** (un seul `passed` : c'est la seule installation play réelle qui a fait une
  analyse avec jeton ; verdict gardé 24 h, donc un seul événement).
- Aucun `rejected`. Mais les 51 `missing` mélangent l'analyse de test de chaque déploiement (`ci-smoke-<run>`) et de
  possibles vrais téléphones (14 « premiers crédits » hors CI sur la semaine, dont 10 le 26/10 : origine inconnue —
  rapports de pré-lancement de Google ? réinstallations ?). Impossible de passer en `enforce` sans les distinguer.

## Fait
- **App** (`playIntegrity.js`) : `requestIntegrity()` → `{ token, reason }`, `reason` ∈ `no_plugin`, `backoff`,
  `timeout`, `bad_token`, `error:<code>` (code du plugin natif, borné `[A-Z0-9_-]{1,24}`, jamais le message) ;
  `getIntegrityToken` garde son contrat. `aiRelay.js` envoie `X-Integrity-Status` seulement sans jeton.
- **Relais** (`integrity.js`, `server.js`) : `check(id, token, { clientStatus })` ; journal `missing` avec `client`
  (valeur reconnue, sinon `other` ; `none` = ancienne version) et `ci` (identifiants `ci-smoke-`), `ci` aussi sur
  les verdicts ; en-tête autorisé par CORS.
- **Workflow** : bilan avec colonnes « Origine » (CI / téléphones / — pour les anciens événements) et « Raison »,
  `--limit=1000` ; jq vérifié sur des événements synthétiques.
- **Confidentialité** : une phrase (« l'app indique seulement pourquoi : délai dépassé ou code d'erreur de Google
  Play »). Sécurité des données : rien de neuf à déclarer (même échange anti-fraude que le jeton, déjà déclaré sous
  « Identifiants de l'appareil ou autres · prévention des fraudes ») → pas de relance du workflow.

## Vérifications
- Relais : 83 tests verts (3 nouveaux, rouges avant le code).
- App : `playIntegrity` + `aiRelay` (2 nouveaux), suite complète 2 586 verts ; lint 6 erreurs (inchangé) ; build OK ;
  `npm run visual -- --play` OK (aucun écran touché).

## Suite
- Le déploiement du relais (push sur main) lira le bilan ; quelques jours après la version play suivante, lire les
  lignes « téléphones » : `enforce` seulement si tout passe ; `timeout` récurrent → rester en `observe`.
- Polissage : POL-PLAY-11 (alpha après une journée sans plantage dans Android vitals, `shrinkResources` à part).

## Après le merge (#451, `01df703`)
- Build & Release **v329** publiée (APK 34,9 Mo), Tests, Pages, Play — AAB et Relais — déploiement verts.
- Nouveau bilan (02:0x UTC) : `CI · missing · none` (1) ; `— · missing` 52 installations / 60 (événements d'avant
  6b-2c-2) ; `— · passed` 1. Les lignes « téléphones » viendront avec la prochaine version play installée.
- **À surveiller** : « Nouvelles installations qui prennent leur 1er crédit IA » = **21 en 7 jours** hors CI
  (25/10 : 2, 26/10 : 10, 27/10 : 9) alors que seul le propriétaire a la version play. Hypothèse : robots des rapports
  de pré-lancement de Google Play (appareils de test qui parcourent l'app à chaque version envoyée) ; à vérifier au
  prochain run (Play Console → Tests → Rapport de pré-lancement, ou l'origine `ci`/`client` des prochains événements).
  Sans effet sur la facture (plafonds du relais) ; si ce n'est pas ça, envisager 5 crédits offerts (CREDITS-INSTALLS).

# Infrastructure et autonomie (mise en place avec le propriétaire le 20/10/2026 au soir)

> Reporté au run du 21/10/2026 00:30 (Paris) depuis la section « INFRASTRUCTURE ET AUTONOMIE » du prompt de la
> routine. En cas de contradiction, le prompt prime. **Aucun des identifiants ci-dessous n'est un secret** : ils
> peuvent figurer dans les workflows et le journal. Les secrets (keystore, mots de passe) ne vivent que dans
> Secret Manager et ne passent jamais par la session de la routine, les logs ou le dépôt.

## Principe

La session de la routine **ne détient aucun identifiant**. Tout accès à Google Cloud et à Google Play passe par
**GitHub Actions sur `main`**, via une connexion **sans clé** (Workload Identity Federation). La routine écrit le
code et les workflows, merge (garde-fous du prompt), et c'est la CI qui déploie et publie.

Conséquence : les workflows de PR n'ont **pas** accès à Google Cloud. Déploiements et publications = `push` sur
`main` ou `workflow_dispatch` sur `main`. On teste donc la logique (scripts, tests du relais) dans la PR, et
l'accès réel après le merge.

## Google Cloud

| Élément | Valeur |
|---|---|
| Projet | `healthtrack-824b26` (numéro `81378799481`) |
| Région | `europe-west1` |
| Budget | 20 €/mois, alertes e-mail 50 / 90 / 100 % |
| APIs activées | Cloud Run, Artifact Registry, Secret Manager, Pub/Sub, Android Publisher, Play Integrity, Vertex AI (aiplatform), IAM, IAM Credentials, STS, Billing Budgets, Logging |
| Fournisseur WIF | `projects/81378799481/locations/global/workloadIdentityPools/github/providers/healthtrack-main` — n'accepte que `spreadzenox/HealthTrack` et `refs/heads/main` |
| Compte de service CI | `gh-deployer@healthtrack-824b26.iam.gserviceaccount.com` — `run.admin`, `artifactregistry.writer`, `pubsub.editor`, `logging.viewer`, `serviceAccountUser` sur relay-runtime, lecture des secrets de signature. **Pas d'admin IAM** : s'il manque un droit, ne pas contourner → « Action du propriétaire » avec la commande `gcloud` exacte. |
| Compte de service du relais | `relay-runtime@healthtrack-824b26.iam.gserviceaccount.com` — `aiplatform.user`, `logging.logWriter` ; identité du service Cloud Run (`--service-account`) |
| Images Docker | `europe-west1-docker.pkg.dev/healthtrack-824b26/healthtrack` |
| Pub/Sub RTDN | `projects/healthtrack-824b26/topics/play-rtdn` (Google Play peut y publier) ; **la CI crée l'abonnement push** vers le relais |
| Secrets de signature (play) | `android-upload-keystore` (PKCS12 en base64, alias `upload`) et `android-upload-keystore-password` (keystore et clé), région `europe-west1`. Créés par le propriétaire à l'étape 3 ; absents → le workflow **échoue proprement** avec un message clair. |

Squelette d'authentification dans un workflow :

```yaml
permissions:
  contents: read
  id-token: write
steps:
  - uses: google-github-actions/auth@v2
    with:
      workload_identity_provider: projects/81378799481/locations/global/workloadIdentityPools/github/providers/healthtrack-main
      service_account: gh-deployer@healthtrack-824b26.iam.gserviceaccount.com
```

## IA : Vertex AI dans l'UE (décision du 20/10)

- Gemini via **Vertex AI** en `europe-west1` (ou le point de terminaison UE le plus proche si un modèle n'y est pas),
  appelé par un **relais Cloud Run** qui s'exécute sous l'identité `relay-runtime`. **Aucune clé API Gemini n'existe
  ni ne doit être créée.**
- Le relais : vérifie l'abonnement Play (Play Developer API + RTDN), décompte les crédits (Play Integrity contre la
  réinstallation), supprime l'EXIF, ne stocke rien, utilise le modèle le moins cher adapté (Flash-Lite), applique un
  **plafond global par jour** et un plafond par utilisateur. Service public, qui se protège lui-même. Instances à
  zéro au repos.
- La clé Gemini saisie par l'utilisateur (Paramètres actuels) peut rester dans la variante **sideload**.

## Google Play

- Une fois l'app créée par le propriétaire, son **premier envoi manuel** fait (test interne, signature d'app par
  Google Play acceptée) et `gh-deployer` invité (pistes de test, fiche du Store, produits/abonnements — **pas la
  production**), la CI : envoie chaque version play en **test interne puis test fermé** (Android Publisher, edits),
  met à jour la fiche, crée les abonnements (4,99 €/mois, 29,99 €/an, essai 14 j sur l'annuel) quand le profil de
  paiement existe.
- `relay-runtime` sera invité avec « Voir les données financières » et « Gérer les commandes et les abonnements ».
- **La mise en production est le seul geste du propriétaire** (« Promouvoir la version »). La routine prépare tout
  (notes de version, fiche, déclarations) et ne publie jamais en production.

## Ce que la routine peut faire seule, via la CI

Déployer / redéployer le relais ; gérer ses abonnements Pub/Sub ; lire les logs (workflow_dispatch qui publie un
résumé) ; publier sur les pistes de test Play ; mettre à jour la fiche et les produits. Coûts : sous 20 €/mois ; si
une alerte est probable → arrêter et le signaler en tête du résumé.

## Signature de la variante sideload

Aujourd'hui signée avec la **clé de debug publique** d'Android (`app/android/app/debug.keystore`). À migrer vers une
clé privée (même mécanisme Secret Manager) **avant la vérification obligatoire des développeurs Android** (France,
2027), avec un parcours sans perte de données (export puis import JSON : changer de clé impose une réinstallation).
Pas urgent — planifié au BACKLOG (P-SIDELOAD-KEY).

## État

| Élément | État |
|---|---|
| Projet GCP, WIF, comptes de service, Pub/Sub | ✅ créés par le propriétaire le 20/10 |
| Keystore d'envoi play dans Secret Manager | ⬜ propriétaire, à l'étape 3 (jalon 3) |
| Workflows de build play / publication Play | ⬜ jalon 3 |
| Relais Cloud Run (code, tests, workflow de déploiement) | ✅ 22/10 16:30 : `halcya-relay` déployé par la CI, analyse réelle OK (`gemini-2.5-flash-lite`, UE) ; l'app ne l'appelle pas encore (6a-2) |

## Variantes et workflows (jalon 3a, 21/10 02:30)

| Workflow | Déclencheur | Ce qu'il fait |
|---|---|---|
| « Build & Release » | push `main` (hors `journal/`) | variante **sideload** (`com.healthtrack.app`, clé de debug), `versionCode` = numéro du run, release GitHub `vNNN` |
| « Play — AAB » | push `main` (hors `journal/`), `workflow_dispatch` | WIF → lit `android-upload-keystore` + `android-upload-keystore-password` → build web `VITE_DISTRIBUTION=play` → `bundlePlayRelease` signé (`fr.jpesquet.sante`, `versionCode` = nombre de commits de main) → artefact `HealthTrack-play-NNN` (30 j) + empreinte SHA-256 du certificat d'envoi dans le résumé. **Rouge tant que P9 n'est pas fait** (message « Clé d'envoi Play absente » ou « Accès refusé ») : ce n'est pas une panne à réparer par la routine, c'est l'action P9. |
| « Play — fiche du Store » | push `main` sur `app/store/**`, `app/scripts/play/listing*.mjs` ou ce workflow ; `workflow_dispatch` | Valide la fiche (`app/store/listing/fr-FR/` + `app/store/play-icon-512.png`) → jeton `androidpublisher` de gh-deployer → edit : textes fr-FR, images remplacées seulement si leur SHA-256 change, site web dans details → commit. Aucune piste touchée. Concurrence `play-edits` partagée avec « Play — AAB » (un seul edit à la fois). Accès refusé → avertissement. (22/10 04:30) |
| « Test — émulateur Samsung Galaxy A56 » (check « Build APK ») | PR et push | construit `assembleSideloadDebug` + tests instrumentés + `bundlePlayRelease` non signé, puis `scripts/check-play-manifest.sh` |

### Envoi sur Google Play (jalon 3c, branché le 21/10 22:30)

Après le build signé, « Play — AAB » demande un **jeton à portée `androidpublisher`** pour gh-deployer (deuxième appel
à `google-github-actions/auth`, `token_format: access_token`, masqué dans les logs) puis lance
`app/scripts/play/publish-cli.mjs` (logique dans `publish.mjs`, tests dans `publish.test.mjs`) :

1. `POST edits` → 2. `GET edits/{id}/details` (langue par défaut de la fiche) → 3. import de l'AAB
(`upload/…/bundles?uploadType=media`) → 4. `PUT edits/{id}/tracks/internal` : une version `versionCode`, statut
`completed`, notes de version (≤ 500 car.) = titres des dernières entrées « Nouveautés » → 5. `POST edits/{id}:commit`.

- **Pistes autorisées : `internal` et `alpha` (test fermé) seulement** ; `production` (et `beta`) refusées par le code,
  testé. `workflow_dispatch` propose le choix de la piste.
- App encore « brouillon » côté Play → version recréée en `draft` (le résumé dit quoi faire dans la Play Console).
  Validation qui exige `changesNotSentForReview` → relancée avec ce paramètre. versionCode déjà envoyé (relance) → edit
  abandonné, pas d'erreur. Toute autre erreur → edit abandonné et workflow rouge avec le message exact.
- **401/403 = accès refusé** (invitation de gh-deployer pas encore propagée côté API, jusqu'à 24-48 h) →
  **avertissement, workflow vert**, réessai à la version suivante ; si ça dure > 48 h après le 21/10 20:45 → action du
  propriétaire (vérifier l'invitation, droits « Gérer les versions des canaux de test »).
- Symboles de débogage natifs : `ndk { debugSymbolLevel 'SYMBOL_TABLE' }` sur la variante play ; ils voyagent dans
  l'AAB et Play les extrait seul (pas de fichier de désobscurcissement tant que R8 n'est pas activé).

## Relais Cloud Run (jalon 6a, 22/10 16:30)

| Élément | Valeur |
|---|---|
| Code | `relay/` — Node 22 sans dépendance ; tests `cd relay && npm test` (node:test, sans réseau), job « Relais (Node) » du workflow Tests |
| Service | `halcya-relay`, europe-west1, adresse `https://halcya-relay-81378799481.europe-west1.run.app` ; identité `relay-runtime` ; public (`--allow-unauthenticated`) ; `--min-instances=0 --max-instances=1 --concurrency=8`, 1 vCPU, 512 Mio, délai 60 s |
| Image | `europe-west1-docker.pkg.dev/healthtrack-824b26/healthtrack/halcya-relay:<sha>` ; la CI copie `app/src/data/ingredientsNutrition.json` dans l'image (liste des ingrédients des consignes) |
| Workflow | « Relais — déploiement » (`relay-deploy.yml`) : push `main` sur `relay/**`, la base d'ingrédients ou le workflow ; `workflow_dispatch`. Tests → build → push → `gcloud run deploy` → `/health` + une vraie analyse de texte (modèle et plat dans le résumé ; rouge si l'analyse échoue) |
| IA | Vertex AI, `europe-west1` puis `europe-west4` ; modèles `gemini-3.5-flash-lite` puis `gemini-2.5-flash-lite` (404/403 → suivant, le couple qui marche est retenu) ; jeton OAuth du serveur de métadonnées, **aucune clé** |
| Routes | (`/healthz` est réservé par Cloud Run : ne jamais finir un chemin par « z ») `POST /v1/meal/analyze` (`X-Install-Id` aléatoire par installation ; `kind: photo` JPEG ou `kind: text` ≤ 500 car.) ; `GET /health` |
| Garde-fous | consignes construites par le relais (pas de prompt libre) ; EXIF / commentaires retirés ; corps ≤ 6 Mo, photo ≤ 4 Mo ; rien stocké ; journaux sans contenu ni identifiant en clair (empreinte de 12 caractères) ; CORS limité à la WebView (https://localhost, capacitor://localhost) |
| Plafonds | 20 analyses / installation / jour, 200 / jour au total, 10 / minute (variables `INSTALL_DAILY_CAP`, `GLOBAL_DAILY_CAP`, `GLOBAL_PER_MINUTE_CAP`) ; compteurs en mémoire (une seule instance) remis à zéro quand l'instance s'arrête au repos → le plafond par minute borne le pire cas ; Play Integrity (6b) fermera la porte aux appels qui ne viennent pas de l'app ; P22 (facultatif) ajoute un plafond dur côté Google |
| Coût | consignes = longue liste d'ingrédients en tête, identique d'un appel à l'autre → cache implicite de Vertex AI ; Flash-Lite ; zéro instance au repos |

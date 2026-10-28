# Run du 28/10/2026 05:33 (Paris, CET) — Robots du rapport de pré-lancement comptés à part (INSTALLS-21)

**Type** : 🏗️ travail de fond (app play + relais + workflow, rien de visible)

## Constat au démarrage
- Main à `790bbd6` (#456), Build & Release v331 verte, aucune PR « [Auto] » ouverte (seule #51, `cursor/*`). Run de code.
- POL-PLAY restants : POL-PLAY-11 demande Android vitals (Play Console, hors de portée). Pris : **INSTALLS-21** —
  21 `first_credit` hors CI en 7 jours (25/10 : 2, 26/10 : 10, 27/10 : 9) alors que seul le propriétaire a la version play.
- Vérifié : aucun job émulateur de la CI n'appelle `/v1/meal/analyze` (seul `visual-check` le simule, en local). Les
  `first_credit` sont de vraies analyses Vertex réussies ; hypothèse la plus probable : robots du rapport de
  pré-lancement (Firebase Test Lab, une passe par version envoyée en test ; 9 à 10 versions par jour les 26 et 27/10).

## Fait
- **Natif** (`PlayIntegrityPlugin.java`, variante play) : `environment()` → `{ testLab }`, lu dans le réglage système
  `firebase.test.lab` (méthode documentée par Google pour reconnaître Test Lab).
- **App** (`playIntegrity.js`) : `isTestDevice()` (lu une fois par lancement, jamais d'erreur, faux sans plugin) ;
  `aiRelay.js` envoie `X-Test-Device: 1` avec l'analyse sur un tel appareil.
- **Relais** : `testDevice` (en-tête exactement `1`) transmis à la garde Play Integrity (`testlab` dans chaque journal
  `integrity`) et ajouté à `first_credit` (`testlab: true`) ; en-tête autorisé par CORS. Ne change aucun droit : le
  falsifier ne fait que fausser une statistique.
- **Workflow** « Relais — déploiement » : « dont N robot(s) du rapport de pré-lancement de Google » après le nombre de
  premiers crédits ; origine « robots Google » dans le bilan Play Integrity (jq vérifié sur des événements synthétiques).
- **Confidentialité** : une phrase (les appareils de test de Google sont signalés pour ne pas compter comme de vraies
  installations). Sécurité des données : rien de nouveau à déclarer (aucune donnée sur l'utilisateur ; un drapeau qui
  ne vaut « 1 » que sur les appareils de Google) → pas de relance du workflow.
- BACKLOG : ligne « Crédits durables » cochée (faite le 24/10, restée ouverte par oubli).

## Vérifications
- Relais : 84 tests verts (2 nouveaux, rouges avant le code).
- App : 2 nouveaux tests (rouges avant), suite complète 2 596 verts ; lint 6 erreurs (inchangé) ; build OK ;
  `npm run visual -- --play` 15 pages sans erreur, Accueil relu (aucun écran touché).
- Compilation Java : par le check « Build APK » de la PR (`bundlePlayRelease`, R8 ; les méthodes `@PluginMethod` sont
  gardées par les règles Capacitor, comme `request`).

## Suite
- Après la prochaine version play envoyée en test interne : lire le résumé du déploiement du relais (« dont N robots »).
  Si les premiers crédits non-robots restent nombreux → 5 crédits offerts (CREDITS-INSTALLS).
- POL-PLAY-11 ; suite de l'audit écran par écran.

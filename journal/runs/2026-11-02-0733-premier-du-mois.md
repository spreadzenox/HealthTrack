# Run du 02/11/2026 07:33 (Paris, CET) — « 1er novembre » (POL-PLAY-99)

**Type** : 🔧 code (polissage play, POL-PLAY-12)

## Constat au démarrage
- Main à `354be50` (#621), tous les workflows verts ; aucune PR « [Auto] » ouverte.
- Demandes reprises : I6-RELAIS (01/11 17:10) livré sauf I6-RELAIS-5 (App Attest, « plus tard ») ; GOLD-a3 attend
  P37, GOLD-b6 attend P36 ; montre (21/10) en attente de confirmation sur la GT 6 Pro. Rien de neuf à faire côté
  iPhone : suite du polissage play.

## Audit (`npm run visual -- --play --routes=/food --food-analysis=fodmap`, clair, démo)
- Analyse photo : éditeur, « à vérifier », total, ligne FODMAP par sous-groupe, gestes en colonne : conformes.
- Historique des repas : **« Hier 1 novembre »** (Intl écrit « 1 », le français veut « 1er »). Même défaut dans Jours,
  l'Accueil (« dim. 1 nov. »), le bien-être, la montre, Données, Nouveautés, le rappel d'essai.
- Laissé : l'éditeur garde les noms Ciqual complets (« Lentille verte, bouillie/cuite à l'eau ») pour choisir le bon
  aliment ; l'historique les raccourcit déjà.

## Fait (POL-PLAY-99)
- `localeDate(date, opts)` dans `i18n/locale.js` : `toLocaleDateString(appLocale(), opts)` + « 1er » en français
  quand l'option `day` est demandée et que c'est le 1er du mois. Branché sur toutes les dates à jour numérique
  (`dailyJournal.dayHeading`, `today.js`, `FaceSenseCard`, `TodayCards`, `MoodEstimateCard`, `HealthRadar`,
  `mood/gate.js`, `mood/faceMood.js`, `Data`, `WhatsNew`, `trialReminder`) ; les deux correctifs locaux
  (`aiRelay.describeCredits`, `entitlement.shortDate`) passent par le même helper. Axes des graphiques inchangés.
- Tests : `src/i18n/localeDate.test.js` (5, écrits avant le code, rouges puis verts) ; `gate.test.js` attendait
  « perdu le 1 décembre » → « 1er décembre ».

## Vérifications
- `npm run test` : 2 860 réussis. `npm run build` OK. Lint : 5 erreurs (6 avant).
- Captures `--play --light --routes=/food,/journal,/` relues : « Hier 1er novembre » dans Jours et Repas.

## Suite
- POL-PLAY-12 : onboarding en clair.
- P37 pour GOLD-a3 ; P36 pour GOLD-b6.

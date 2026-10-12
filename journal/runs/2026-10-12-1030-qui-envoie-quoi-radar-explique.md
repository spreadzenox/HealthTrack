# 2026-10-12 08:30 UTC (10:30 Paris) — « Qui envoie quoi » + Radar expliqué

**Type** : 🏗️  ·  **PR** : voir la PR « [Auto] Qui envoie quoi + Radar expliqué »

## Pourquoi
- Démarrage : aucune PR [Auto] ouverte ; Tests, émulateur et Build & Release (v102) verts sur main (214cdf4).
- Le run idées de 08:30 Paris proposait pour un run court I23 (« qui envoie quoi », priorité n° 2 : est-ce que ma montre
  envoie vraiment la VFC ?) et I22 (Radar expliqué : le reproche n° 1 fait aux alertes des montres, les fausses alertes
  après un verre ou un sport tardif). Les deux sont purs, testables, sans code natif — contrairement à I6 / I25 (plugin
  Kotlin `PhoneUsage`) gardé pour un run plus long.

## Ce qui a été fait
- **I23 — Qui envoie quoi** (`src/devices/healthApps.js`) : `METRICS` (14 mesures, FC / FC repos / VFC / SpO₂ séparées
  par sous-type), `sourceCoverage(entries, now)` (dernière date, jours reçus sur les 14 précédant la dernière mesure,
  « habituelle » si ≥ 7 jours, « arrêtée » après 3 jours pleins), `missingWatchMetrics` (mesures courantes d'une montre
  jamais reçues, seulement pour une source qui envoie déjà du cœur). `summarizeHealthConnectSources` joint `metrics`.
- **« Mes appareils »** : mesures détaillées par app (« cœur, FC repos, VFC, sommeil… »), encadré jaune « VFC : plus
  rien depuis 5 jours, alors que cette mesure arrivait chaque jour… » (seulement si l'app envoie encore le reste : sinon
  « En pause » suffit), ligne « Jamais reçu en 30 jours : SpO₂… ».
- **I22 — Radar expliqué** (`src/services/radar.js`, `explainRadar`) : tags « cause » (`radarCause` dans
  `behaviorTags.js` : alcool, sport le soir, repas tardif, stress, + nouveaux **Voyage** et **Vaccin**) notés le jour
  signalé ou la veille → « Probablement lié à … », badge « Explicable », bordure bleue apaisée ; une alerte sur 2–3 jours
  n'est « expliquée » que si **chaque** jour a sa cause (sinon « À noter : … peut en expliquer une partie, pas tout ») ;
  « Malade » confirme et renvoie vers un professionnel. Écran tard et café écartés des causes (effet trop faible sur
  FC repos / VFC — vu sur les captures, la phrase devenait une liste).
- `behaviorTags.js` importe `localDateKey` depuis `wellbeingSeries` (et non `analysisEngine`) pour éviter le cycle
  radar → behaviorTags → analysisEngine → radar.
- Captures : `npm run visual -- --radar=explained` (Voyage noté chaque jour simulé malade) et `--hrv-gap` (plus de VFC
  depuis 4 jours) ajoutés à `visual-check.mjs`.
- Nouveautés : `2026-10-12-0830-qui-envoie-quoi.json`.

## Vérifications
- Tests : 922 ✅ (61 fichiers, +19) · Lint : 6 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : `npm run visual` complet OK (8 pages, aucune erreur JS) ; lu : Connecteurs avec `--hrv-gap --devices=Huawei,Gadgetbridge`
  (encadré VFC, « Jamais reçu : SpO₂ », Huawei « Relayé »), tableau de bord `--radar=explained` (« Explicable »,
  « Probablement lié à 🍷 Alcool (samedi 10) et ✈️ Voyage (hier) »), modale de check-in à 9 tags (4 lignes, pas de
  débordement), tableau de bord par défaut (Radar calme inchangé).

## Apprentissages / décisions
- Le check-in peut être fait le soir (tag du jour J) ou le lendemain matin (tag noté à J+1 pour la soirée de J) : la
  fenêtre [veille, jour signalé] couvre les deux sans demander « hier soir / aujourd'hui ».
- Pas encore de bouton « Je me sens bien / Je couve quelque chose » : stocker un retour sans l'utiliser n'apporte rien
  tant que les seuils ne sont pas recalibrés ; à faire avec la recalibration (Radar, étape 2).
- « Habituelle » = ≥ 7 jours sur 14 : une pesée ou une séance ne déclenche jamais d'alerte d'arrêt.

## Suite proposée
- Bandeau sur l'accueil quand une mesure habituelle s'arrête ou qu'une app est « À brancher » (« Mes appareils », étape 2).
- Run long : I6 + I25 (plugin Kotlin `PhoneUsage` : temps d'écran + sommeil estimé).
- Radar, étape 2 : retour « je me sens bien / je couve » + recalibration ; respiration et température.

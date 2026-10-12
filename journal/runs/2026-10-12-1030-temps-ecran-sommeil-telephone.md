# 2026-10-12 10:30 UTC (12:30 Paris) — Temps d'écran et sommeil estimé par le téléphone

**Type** : 🏗️  ·  **PR** : voir ci-dessous

## Pourquoi
- Démarrage : aucune PR [Auto] ouverte, main vert (v103, 85fa2ee).
- Priorité n° 1 (tout capter sans saisie) : le run précédent proposait le run long I6 + I25 (plugin natif `PhoneUsage`).
  C'est la première donnée captée **par le téléphone lui-même**, utile à tout le monde (avec ou sans montre), et la
  base de l'humeur estimée (I7 / I31 : écran tard, sommeil, régularité).

## Ce qui a été fait
- **Plugin natif maison** `android/app/src/main/java/com/healthtrack/app/PhoneUsagePlugin.java` (Java, enregistré dans
  `MainActivity` avant `super.onCreate`) : `checkAccess` (AppOps `GET_USAGE_STATS`), `openAccessSettings`
  (`ACTION_USAGE_ACCESS_SETTINGS` avec le paquet, repli sans), `queryScreenEvents({start, end})` → seulement
  `SCREEN_INTERACTIVE` / `SCREEN_NON_INTERACTIVE` / `KEYGUARD_HIDDEN` (`on` / `off` / `unlock`, API 28+), jamais de nom
  d'app. Manifeste : `PACKAGE_USAGE_STATS` (`tools:ignore="ProtectedPermissions"`). Pas de dépendance npm ajoutée.
- **Calculs purs** `src/services/phoneUsage.js` : sessions d'écran (« allumé » orphelin fermé au suivant, plafond 6 h),
  stats du jour (temps d'écran sur le jour civil, écran tard 22 h–4 h rattaché au jour du réveil, déverrouillages),
  **nuit estimée** = plus longue période sans écran entre 20 h et 12 h, coups d'œil ≤ 2 min entre 00:30 et 06:00
  ignorés (et déduits), il faut un usage avant et après (sinon null), 3–14 h. `phoneUsageEntries` : une entrée
  `phone_usage` par journée **terminée** et entièrement couverte par le journal Android (jamais modifiée ensuite :
  `upsertEntries` dédoublonne par source|at|type).
- **Synchro** `src/services/phoneUsageSync.js` (calquée sur la météo) : réglages localStorage, au plus toutes les 30 min
  à l'ouverture (`useAutoSync`), 10 jours relus, journée en cours gardée dans les réglages pour la carte.
- **Analyses** : 3 variables « mode de vie » (`screen_minutes`, `screen_late_minutes`, `phone_unlocks`, inconnues sans
  journal, leviers « Lâcher le téléphone plus tôt le soir »…) ; `nightlySleep(entries, { phoneFallback: true })` utilise
  la nuit estimée **seulement** sans montre — le Radar ne l'utilise pas (trop imprécise pour signaler un écart).
  `countTotalDataDays` ignore les journées qui n'ont que météo / téléphone.
- **UI** : carte « Temps d'écran et sommeil » (Connecteurs, sous la météo) : Activer → réglage Android ouvert + guide
  en 3 étapes (+ « Autoriser les paramètres restreints » si grisé), revérification au retour dans l'app
  (`visibilitychange`), puis « Aujourd'hui 2 h 15 d'écran · 50 min hier soir après 22 h · 31 déverrouillages » et
  « Nuit estimée 23:33 → 07:05 ». Journal : puce « Écran », « Sommeil (estimé) » quand la nuit vient du téléphone.
- Captures : `npm run visual -- --phone` / `--phone=ask` (faux plugin) ; données de démo avec `phone_usage`.
- Nouveautés : `2026-10-12-1030-temps-ecran.json`.

## Vérifications
- Tests : 953 ✅ (64 fichiers, +31) · Lint : 6 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : `npm run visual` complet OK (8 pages, aucune erreur JS) ; lu : Connecteurs `--phone` (carte active, nuit
  23:33 → 07:05 avec le coup d'œil de 3 h ignoré), `--phone=ask` (guide, badge « À autoriser »), `--empty` (« Disponible
  dans l'app Android »), tableau de bord (puces « Écran 3 h 56 »), Analyses. Prédiction du jour identique à main (1,8/5).
- **Java non compilé localement** (pas de SDK Android dans la session) : c'est le check « Build APK » de la PR qui fait foi.

## Apprentissages / décisions
- Plugin maison dans le projet Android plutôt qu'un paquet npm : `registerPlugin` dans `MainActivity` suffit, et
  `npx cap sync` ne touche pas `app/src/main/java`. Modèle réutilisable pour I36 (pas), I37 (Wi-Fi), `getBondedDevices`.
- Les entrées automatiques ne sont écrites que pour les journées terminées : contourne l'absence de mise à jour dans
  `upsertEntries` (même limite que la météo du jour).
- Pas de charge (batterie) dans l'estimation pour l'instant : `UsageEvents` ne la donne pas ; à ajouter via
  `ACTION_POWER_CONNECTED` si l'estimation se trompe souvent.

## Suite proposée
- Retour du propriétaire : l'accès s'accorde-t-il sans « paramètre restreint » sur l'A56 ? la nuit estimée colle-t-elle ?
- « Écran tard » : pré-cocher le tag du check-in quand l'écran tard dépasse 30 min (saisie en un geste).
- Régularité du sommeil (carte) avec les nuits estimées quand il n'y a pas de montre.
- Temps par catégorie d'apps (réseaux sociaux, jeux) via `queryUsageStats` — demande de lire les noms d'apps : à
  proposer en option explicite.

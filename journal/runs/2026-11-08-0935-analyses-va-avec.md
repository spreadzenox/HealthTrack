# Run 08/11 09:35 — Analyses : « Ce qui va avec », une seule habitude (POLISH-SIM-10, 11)

**Type** : 🎨 code. **Branche** : `claude/analyses-bien-etre-titre`. Aucune PR « [Auto] » ouverte, CI de main verte
(b02562f, #827). Pas de nouvelle correction du propriétaire dans le prompt pour le 08/11.

## Pourquoi
Constats des personas du 08/11 08:35 : « Ce qui pèse sur votre bien-être » liste aussi des effets favorables, sans
unité ; habitude de sommeil 7 h 19 sur l'Accueil, 7 h 17 dans le Journal.

## Ce qui a été fait
- `pages/Recommendations.jsx` : titres « Ce qui va avec votre bien-être / confort digestif » ; valeurs « +0,4 pt »
  (espace insécable ; colonne élargie, sans retour à la ligne, `Recommendations.css`).
- `services/dayDeviations.js` : `measureNorms(days, now, { dayKey })` compare un jour passé des 14 derniers jours à
  l'habitude d'aujourd'hui (même chiffre que l'Accueil ; un jour passé est fini, les cumuls en moins se disent) ; hors
  fenêtre, aucune norme. `DailyJournal.jsx` l'utilise, et retombe sur la fenêtre propre au jour pour un jour ancien.
  Cause de l'écart : la carte d'hier prenait les 14 jours avant hier.
- Tests : `Recommendations.test.jsx` (titre, « pt ») ; `dayDeviations.test.js` (1 cas, 3 assertions).
- Captures lues : Analyses clair et sombre (`comparaison/analyses-va-avec-sombre.png`), Journal (démo).

## Vérifications
- `npm run test` : 3 264 verts ; lint sans erreur ; build OK ; `npm run visual --routes=/recommendations,/journal` (+ `--dark`) : ok.

## Restes (polish, BACKLOG)
- POLISH-SIM-2 (petit « + », ligne Sommeil qui ne s'ouvre pas), 5 (Analyses et Agir vides), 6 (jargon), 12 (PDF), 13
  (« attendu »), 7, 9.

## Après le merge (#828)
- « Build & Release », « Play — AAB » et l'émulateur ont échoué trois fois : le wrapper Gradle n'obtenait pas
  `gradle-8.11.1-all.zip` en 10 s (services.gradle.org lent : 1 Mo en 11 s depuis la session ; pas une erreur du code).
- Correctif : `networkTimeout=120000` dans `gradle-wrapper.properties` (PR #829). Sur la PR, Gradle se télécharge
  désormais (plus de 10 s : le délai sert), mais « Build APK » échoue ensuite : `kotlin-compiler-embeddable-2.1.0.jar`
  redirigé vers les releases GitHub → **504 Gateway Time-out**. Panne des téléchargements de releases GitHub vers
  09:00–09:17 UTC, hors de portée. **Non mergé** (garde-fou : Build APK rouge).
- **À reprendre au run suivant, avant tout** : relancer « Build APK » de #829 (`rerun-failed-jobs`) ; vert → merger
  #829 ; puis vérifier que « Build & Release », « Play — AAB » et l'émulateur passent sur main (le merge de #829 les
  relance) et qu'une release > v595 a son APK. Si la panne dure, relancer seulement les runs de main de a4887eb.

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
- Correctif : `networkTimeout=120000` dans `gradle-wrapper.properties` (PR « [Auto] CI : délai de téléchargement de
  Gradle »), prouvé par le check « Build APK » de la PR, puis release vérifiée.

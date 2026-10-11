# 2026-10-11 00:30 UTC — Courbe du bien-être sur un vrai calendrier

**Type** : 🐛 (chasse aux bugs + vérif visuelle)  ·  **PR** : #96 (fusion en fin de run si CI verte)

## Pourquoi
Dernier run 🐛 au 10/10 16:30, après deux gros chantiers (effets décalés, tableau de bord). Revue de toutes les captures
(`npm run visual`, `--empty`) : pas d'erreur JS ni de débordement. En relisant le graphique « Par jour (14 derniers
jours) », le code (`seriesByDay`) prenait en fait les **14 derniers jours notés**, placés à intervalles réguliers
(idée en vrac du backlog « points espacés par index ») :
- après une interruption (vacances, oubli), d'anciennes notes s'affichaient comme si elles dataient de la veille, avec
  une ligne droite qui enjambait le trou ;
- la prédiction du jour était collée juste après la dernière note, même vieille de 10 jours ;
- sur la démo, la courbe montrait 15 points (14 notes + prédiction) pour « 14 jours ».

## Ce qui a été fait
- `wellbeingSeries.seriesByCalendarDay(entries, days, now)` remplace `seriesByDay` : un élément par jour du
  calendrier (aujourd'hui inclus), `average: null` sans note ; jours calculés par `new Date(y, m, d − k)` (sûr aux
  changements d'heure).
- `WellbeingLineChart` : x en unités de données sur un domaine fixe ; la ligne n'est tracée qu'entre jours consécutifs
  (`maxGap = 1`), un point isolé reste un point ; pointillé vers la prédiction seulement si la note d'hier existe ;
  étiquettes à dates fixes (aujourd'hui puis tous les 3 jours). Le graphique « Par heure » place aussi les heures
  proportionnellement (9 h et 21 h ne sont plus côte à côte).
- Message « Aucune note ces 14 derniers jours » quand il n'y a que des notes anciennes.
- `npm run visual -- --wellbeing-gap` : supprime les notes de J−9 à J−4 dans la démo pour voir ce cas.

## Vérifications
- Tests : 662 ✅ (655 avant ; 4 série + 5 composant ; 4 des tests du composant échouaient sur l'ancien code)
  · Lint : 7 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : 8 pages sans erreur JS, `--empty` OK ; avant/après du graphique (démo : 14 jours au lieu de 15 points) et
  `--wellbeing-gap` (trou visible de 02/10 à 07/10, dates justes, prédiction reliée à la note d'hier).

## Apprentissages / décisions
- Couper la ligne plutôt que relier en pointillé : un pointillé ressemble à la prédiction, et une interpolation
  inventerait des valeurs.

## Suite proposée
- 🐛 Formulaires restants : heure `datetime-local` sur l'A56, modifier une note de bien-être (aujourd'hui seulement
  supprimable), modale de check-in sur /food.
- 🎨 Journal du tableau de bord, étape 2 (poids fusionné, noms courts).
- 🏗️ Effets décalés, étape 2 (tags du soir comme contrôles, piste décalée dans « Pistes à tester »).

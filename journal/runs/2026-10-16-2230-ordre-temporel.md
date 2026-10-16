# 2026-10-16 22:30 Paris (20:30 UTC) — Ordre temporel : seul ce qui précède la note compte (D5)

**Type** : 🔁 D5  ·  **PR** : « [Auto] Ordre temporel : seul ce qui précède la note de bien-être compte »

## Pourquoi
- Démarrage : main à `92f895b` (#188, run idées, journal seul ; dernière release v147 de #187) ; « Tests » et
  émulateur A56 verts. Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, hors routine, non touchée). Aucun nouveau
  journal dans `journal/diagnostics/`.
- 22:30 Paris = run normal. D1 : Connecteurs et Analyses relus en captures (`/connectors` tient en 1 écran, Analyses
  déjà raccourcies le 16/10 06:30) → rien d'évident à retirer ce soir. Piège D5 noté depuis le 16/10 16:30 :
  **ordre temporel**. La note est demandée une fois par session, à n'importe quelle heure ; `buildDailyDataset`
  comparait la note de 10 h avec **tous** les pas, séances, cigarettes et le temps d'écran du jour, y compris ce qui
  vient après (et peut en être la conséquence : on bouge parce qu'on va bien = causalité inverse).

## Ce qui a été fait
- `services/analysisEngine.js` :
  - `DAY_OVER_HOUR = 20` : dernière note du jour avant 20 h → limite = heure de cette note ; à 20 h ou après, la
    journée est jugée finie (tout compte, comme avant) ;
  - `SAME_DAY_KEYS` (liste déclarée) : `steps`, `activityCalories`, `dailyCaloriesHC`, `avgHR`, `cigaretteCount`,
    `screen_minutes`, `phone_unlocks` — comportements du jour que l'humeur peut elle-même modifier ;
  - option `beforeRating` de `buildDailyDataset` : une entrée compte si sa **fin** (`endDate`, sinon début + durée,
    sinon son heure) est ≤ la note. Totaux « journée entière » : un total Health Connect (fin = minuit) est ignoré ce
    jour-là ; un total de la montre arrêté à la synchro du matin reste. `phone_usage` (journée entière) : écran et
    déverrouillages inconnus ce jour-là, **écran tard (veille au soir) gardé** ;
  - activée pour l'analyse simple et l'analyse avancée. **Non** activée pour les effets « la veille » (X de la veille,
    déjà avant Y) ni pour la prédiction du jour (à revoir : modèle entraîné jour entier vs journée en cours).
- Non concernés, déjà antérieurs ou extérieurs : sommeil (jour du réveil), écran tard (22 h veille → 4 h), météo,
  mesures du matin, VFC / FC repos / SpO₂, alimentation (fenêtre lissée sur 10,5 jours ; un dîner après une note de
  midi pèse encore le jour même → noté dans « Reste »).
- `pages/Recommendations.jsx` : une phrase dans « Comment c'est calculé ».
- Tests écrits avant le code : bloc `buildDailyDataset — ordre temporel (D5, beforeRating)` (7 tests, heures
  locales) dont un de bout en bout : des pas **après** une note du matin, parfaitement liés à la note, donnaient
  r = 0,99 sans le correctif (vérifié en désactivant l'option), < 0,9 avec. Fixtures `makeWellbeing` /
  `makeEntries` passées de 12:00 à 21:30 (leurs pas sont à 22:00 : elles testent autre chose que l'ordre temporel).

### Retiré et pourquoi
| Retiré | Pourquoi |
|---|---|
| Comportements d'après la note (jours notés avant 20 h) dans les analyses simple et avancée | X après Y : ne peut pas expliquer la note, risque de causalité inverse (D5) |

## Vérifications
- `npm run test` : **1306 tests verts** (101 fichiers). Lint : **6 erreurs** (inchangé). Build ✅.
- `npm run visual --routes=/recommendations,/` ✅ ; captures avant / après de `/recommendations` regardées :
  identiques (la démo note à 21:30, journée finie), texte ajouté dans la note repliée couvert par le test.

## Suite
- D5 : repas d'après la note (décaler au lendemain dans la fenêtre lissée ?), prédiction du jour cohérente,
  taille minimale et garde-fous visibles (I46).
- D6 : Radar (I97), repères Nutrition. D1 : « Voyage » déduit. D4 : I95 puis spec visage.

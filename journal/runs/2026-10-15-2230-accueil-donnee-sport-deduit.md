# 2026-10-15 22:30 Paris (20:30 UTC) — Nettoyage : prédiction unique, « Sport le soir » déduit (D1, I85 ①, I87)

**Type** : 🧹 D1  ·  **PR** : « [Auto] Nettoyage : prédiction unique, « Sport le soir » déduit »

## Pourquoi
- Démarrage : main à `90f442f` (#172, journal seul) ; « Tests », émulateur A56 verts ; dernier « Build & Release »
  (v137, `7256751`) vert. Aucune PR « [Auto] » ouverte (`cursor/*` #51 hors routine, non touchée). Aucun nouveau
  journal dans `journal/diagnostics/`. Consigne montre du 15/10 déjà reportée (run 18:30).
- 22:30 Paris = run normal → D1 en tête : suite proposée par le run idées (fusion « Prédiction du jour » + I87, puis I85).

## Ce qui a été fait
- **`WellbeingCharts`** : la carte « 🤖 Prédiction du jour » au-dessus du graphique est retirée ; une seule ligne
  sous la courbe (`PredictionLegend`) : point orange (s'il est sur le graphique), « Prédiction du jour : 1,6 / 5 »,
  « · réel : 3,0 » une fois la note saisie. La mention « journée en cours… journée habituelle » est repliée
  (`<details>`, ⓘ) au lieu d'un paragraphe de 3 lignes.
- **`SleepRegularityCard`** (I87) : l'hypothèse générale « horaires réguliers » (paragraphe jaune de 3 lignes) devient
  une ligne repliée « Hypothèse générale à tester chez vous » ; le texte (D6 : hypothèse, vos données tranchent) est
  inchangé une fois déplié.
- **I85 ① « Sport le soir » déduit** (`behaviorTags.js`) : `auto: 'workouts'`, `isWorkoutEntry` (entrée `activity`
  avec `durationSeconds` ≥ 10 min : séance montre ou Health Connect, pas une entrée de distance seule),
  `EVENING_SPORT_FROM_HOUR = 18`. Analyse : soirées avec séance = « avec », jours entre la première et la dernière
  séance enregistrée sans séance du soir = « sans », hors de cette plage rien n'est supposé (montre pas encore
  portée / plus synchronisée). Contrairement à « Écran tard », un tag déclaré **compte encore** (OU,
  `declaredAlsoCounts`) : une séance sans montre n'est pas effacée par une absence d'enregistrement.
- **Saisie du bien-être** (`WellbeingPrompt`) : « Sport le soir » masqué s'il existe une séance enregistrée ces
  14 jours (lecture par index `type_at`, ≤ 200 entrées) ; ligne d'aide « Sport le soir : déduit de vos séances
  (début après 18 h) ». Une ancienne note qui porte le tag le garde visible pour pouvoir le retirer (règle existante).
- **Analyses** : la carte d'un tag automatique dit d'où il vient (« déduit de vos séances » / « mesuré par le
  téléphone ») — avant, tout tag `auto` aurait affiché « mesuré par le téléphone ».

### Retiré et pourquoi (D1)
| Retiré / fusionné | Pourquoi |
|---|---|
| Carte « 🤖 Prédiction du jour » au-dessus du graphique | Doublon de la légende du point orange ; la valeur est maintenant dans la légende |
| Paragraphe « Journée en cours… » toujours visible | Explication de méthode → repliée (I87 : la donnée avant l'interprétation) |
| Paragraphe « Hypothèse générale (études)… » du sommeil | Même règle : une ligne repliée sous les chiffres |
| Tag « Sport le soir » dans la saisie (si séances enregistrées) | L'app le capte déjà : ne jamais demander ce qui est mesuré |

## Vérifications
- Vitest : **1271 ✅** (+11 : 6 `behaviorTags` sport déduit, 2 `WellbeingCharts` mention unique, 2 `WellbeingPrompt`,
  1 `Recommendations` source du tag auto ; 1 test Sommeil complété).
- Build ✅. Lint : **6 erreurs** (inchangé).
- `npm run visual -- --wellbeing-prompt` : 8 pages ok, aucune erreur JS ; relues : `dashboard-1` (saisie sans
  « Sport le soir », ligne d'aide), `dashboard-2` (une ligne « Prédiction du jour : 1,6 / 5 ⓘ » sous la courbe),
  hypothèse sommeil repliée (capture pleine page), `recommendations-2` (« Sport le soir … déduit de vos séances (début
  après 18 h) »). `--empty` (/, /recommendations) et `--light` (/) ok.

## Sécurité / vie privée
- Rien ne sort du téléphone ; aucun schéma ni donnée modifié (affichage, saisie et analyse seulement). Anciens tags
  « Sport le soir » conservés et toujours comptés.

## Apprentissages / décisions
- Un tag déduit d'un capteur qui peut **manquer** un évènement (séance sans montre) doit s'ajouter au déclaré (OU),
  pas le remplacer ; « Écran tard », mesuré en continu, garde la règle « la mesure prime ».
- D5 : « Sport le soir » est un X (comportement) ; il n'entre dans aucun estimateur d'humeur.

## Suite proposée
1. 🧹 D1 : I85 ② (« Voyage » par fuseau, « Repas tardif » par repas saisis) ; radar qui lit aussi les séances du
   soir ; relire Données et Nutrition.
2. ⚡ D2 : I82 (SpO₂ en tranches de 10 min, mesurer d'abord avec une SpO₂ minute dans la démo `--dense`).
3. 🔁 D5 : I84 (« Stress » ressenti côté Y) + `ESTIMATOR_INPUTS` et test anti-circularité.

# 2026-10-16 04:30 Paris (02:30 UTC) — Nettoyage : « Repas tardif » déduit des repas (D1, I85 ②a)

**Type** : 🧹 D1  ·  **PR** : « [Auto] Nettoyage : « Repas tardif » déduit des repas »

## Pourquoi
- Démarrage : main à `5a23a4d` (#177) ; « Tests », « Build & Release » (v140) et émulateur A56 verts. Aucune PR
  « [Auto] » ouverte (`cursor/*` #51 hors routine, non touchée). Aucun nouveau journal dans `journal/diagnostics/`.
- 04:30 Paris = run normal → D1 en tête. Reste D1 le plus concret : I85 ② (« ne jamais demander ce que l'app capte
  déjà ») — « Repas tardif » se déduit des repas déjà saisis dans Repas.

## Ce qui a été fait
- **`behaviorTags.js`** : `late_meal` devient `auto: 'meals'`, `declaredAlsoCounts: true` (même mécanique que
  « Sport le soir »). Un soir est **mesuré** : vrai si un repas est noté ≥ 21 h (ou avant 4 h la nuit suivante, compté
  sur la veille) ; faux seulement si ≥ 2 repas ont été notés ce jour-là sans repas tardif ; sinon inconnu (un seul repas
  noté ne dit rien des autres). `measuredTags` exporté sous `measuredTagsByDay`. `mealsLoggedRegularly(food, now)` :
  ≥ 2 repas notés sur ≥ 7 des 14 derniers jours.
- **`WellbeingPrompt`** : lit séances **et** repas des 14 derniers jours (2 lectures par index, ≤ 200 chacune) ;
  « Repas tardif » masqué quand les repas sont notés régulièrement, ligne d'aide « Repas tardif : déduit de vos repas
  notés (après 21 h) ». Un ancien check-in qui porte le tag le garde visible (pour le retirer).
- **`Recommendations`** : la note d'origine d'un tag mesuré passe par `autoSourceNote` (écran / séances / repas).
- **`radar.js` / `HealthRadar`** : `explainRadar` lit aussi les tags mesurés à vrai (séance du soir, repas tardif) —
  c'était le reste noté au backlog (« le radar ne lit que les tags déclarés »). L'Accueil lit en plus `activity` et
  `food` sur la même fenêtre (≈ 65 j, quelques centaines d'entrées au plus).

### Retiré et pourquoi (D1)
| Retiré | Pourquoi |
|---|---|
| Tag « Repas tardif » dans la saisie bien-être (si repas notés régulièrement) | L'heure des repas est déjà saisie dans Repas |

## Vérifications
- Vitest : **1287 ✅** (+7 : soir tardif / sans / inconnu / après minuit, analyse sans tag, « régulièrement »,
  `measuredTagsByDay`, radar expliqué par séance du soir et repas tardif, saisie masquée / non masquée, note Analyses).
- Build ✅. Lint : **6 erreurs** (inchangé).
- `npm run visual` : 8 pages ok, aucune erreur JS ; relues `recommendations-2/3` et `dashboard-1` (inchangées : la
  démo n'a pas de repas après 21 h, donc pas de carte « Repas tardif ») ; `--empty` ok.

- CI, 1er passage : « Frontend (Vitest) » rouge — 1287 tests verts mais **1 rejet non géré** : une autre page de test
  mocke le stockage sans `listEntries`, l'accès lève une erreur synchrone, que l'ancien `try/catch` avalait et que mes
  `.catch` par promesse ne voyaient pas. Corrigé (un seul `try/catch` autour des deux lectures) ; non reproduit en
  local (dépend de l'ordre d'exécution des fichiers).

- PR #178 : Vitest, Build APK, Protocole montre (Java), émulateurs A56 API 35 et 36 verts → fusionnée (squash),
  **v141 publiée avec son APK** (« Build & Release » vert).

## Sécurité / vie privée
- Rien ne sort du téléphone ; aucun schéma modifié (lecture seule d'entrées existantes) ; export / import inchangés.

## Science (D5 / D6)
- « Repas tardif » reste un **X** (comportement), jamais une entrée de l'humeur. Aucune direction présupposée : la
  carte montre l'écart mesuré tel quel. Les jours inconnus ne sont pas lus comme « sans » (pas de biais de saisie).

## Apprentissages
- Un mock de module sans l'export lève **à l'accès**, de façon synchrone : `fn().catch()` ne l'attrape pas, seul un
  `try` autour de l'appel le fait. Garder un `try/catch` englobant dans les lectures « best effort » des composants.

## Suite proposée
1. 🧹 D1 : I85 ②b « Voyage » par fuseau — entrée `context` légère par jour pour qu'elle soit exportée et lue par
   les Analyses ; relire Repas (`food-*`) et Analyses (intro « Vos habitudes » de 5 lignes, « Effets décalés » 6 lignes).
2. ⚡ D2 : lecture `heart_rate` partagée / par sous-type pour l'Accueil.
3. 🔁 D5 : I84 (« Stress » ressenti côté Y) + `ESTIMATOR_INPUTS` et test anti-circularité.

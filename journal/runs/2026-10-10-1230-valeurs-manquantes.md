# 2026-10-10 12:30 UTC — Analyses : mesure absente ≠ 0 (montre non portée, pas de pesée)

**Type** : 🐛  ·  **PR** : #89 (fusionnée)

## Pourquoi
Priorité n° 2 du backlog, même famille que le bug de la prédiction du jour (run 10:30) : à l'entraînement,
`buildDailyDataset` mettait **0** pour toute mesure absente (nuit sans montre → 0 min de sommeil, FC repos 0,
VFC 0, poids 0 kg les jours sans pesée). Pour les corrélations et le modèle avancé, ces 0 sont des valeurs
extrêmes qui écrasent le vrai signal — et, si la montre est oubliée plutôt les mauvais jours, créent des liens
fictifs. Le poids (pesée tous les 3 jours sur la démo) n'était qu'un indicateur « pesé ce jour-là ».

## Ce qui a été fait
- `analysisEngine.js`
  - `MEASURED_KEYS` : sommeil, pas, dépense HC, FC repos / moyenne, VFC, SpO₂ et toutes les mesures de la balance
    valent **null** quand rien n'a été mesuré ce jour-là. Les compteurs (cigarettes, repas, séances, nutriments)
    restent à 0.
  - Corrélations basiques : **paires complètes** (seulement les jours où la variable est connue, ≥ 5 jours),
    contrôle du week-end recalculé sur ces jours, `n` = jours mesurés.
  - Modèle avancé : une mesure n'est candidate que si elle est connue **≥ 50 %** des jours d'entraînement
    (`MIN_FEATURE_COVERAGE`) ; les trous sont remplis par la moyenne d'entraînement (`fillMissing`), y compris pour
    les jours de validation et l'élagage des doublons.
  - Prédiction du jour : toute variable du modèle inconnue aujourd'hui (ex. pas encore pesé) → moyenne (avant :
    0 kg → prédiction absurde dès que le poids entrait dans le modèle).
  - Conseils « votre moyenne actuelle » : moyenne des seuls jours mesurés.
- `Recommendations.jsx` : une phrase de méthode dans chaque onglet.
- Démo (`demoData.mjs`) : montre oubliée ~1 jour sur 8 (RNG séparé, jamais les 4 derniers jours) → 9 jours sans
  nuit / FC / VFC sur 75.

## Résultat sur la démo (même données, moteur avant / après)
| | Avant | Après |
|---|---|---|
| Sommeil (vrai moteur simulé) | r = +0,25, q = 0,31 (invisible) | r = **+0,58**, « solide », piste n° 1 |
| VFC | r = +0,28 | r = +0,53 |
| Pistes basiques | Marcher | Dormir, Marcher |
| Modèle avancé, R² hors échantillon (LOO) | 0,09 | **0,44** |
| Pistes avancées | Marcher | Dormir, Marcher, Fumer moins (= la simulation) |

## Vérifications
- Tests : 622 ✅ (616 avant ; +6 « valeurs manquantes », rouges avant le correctif ; 5 tests existants passent de
  `toBe(0)` à `toBeNull()` — changement de contrat voulu). Lint : 7 erreurs, 1 warning (inchangé). Build ✅
- Visuel : `npm run visual` toutes pages ok ; Analyses basiques et avancées relues (phrases de méthode lisibles,
  pistes cohérentes, moyenne sommeil 7 h 13) ; tableau de bord inchangé (normes cœur sur 52 j au lieu de 60, déjà
  robustes aux trous) ; `--empty` ok.

## Apprentissages / décisions
- Paires complètes pour les corrélations (le plus honnête : n réel affiché), imputation par la moyenne seulement
  dans le modèle multivarié, avec un seuil de couverture pour qu'une variable ne soit pas « surtout de la moyenne ».
- Pas de report de la dernière pesée (LOCF) pour le poids : plus de couverture mais suppose un poids stable ; à
  reconsidérer si le poids devient une variable utile.
- Les jours **sans repas saisi** restent comptés comme 0 kcal dans le lissage nutritionnel : c'est un problème
  voisin (saisie incomplète ≠ jeûne) → backlog.

## Suite proposée
- 🏗️ Effets décalés (lags 0–3 j) sur sommeil / activité / tags (C3).
- 🐛 Jours sans repas saisi dans le lissage nutritionnel (ignorer les jours vides plutôt que les compter à 0 ?).
- 🐛 Formulaires : heure `datetime-local` sur l'A56, modifier une note de bien-être.

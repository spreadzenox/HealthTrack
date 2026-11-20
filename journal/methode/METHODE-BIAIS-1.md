# METHODE-BIAIS-1 — Préparation (run « idées » du 20/11 20:30)

But : qu'Objectifs et Agir affichent la **taille** d'un lien et sa **fourchette** sans les rétrécir, sans toucher à
ce qui décide qu'un lien est **net** (tri univarié, Holm, stabilité du signe), qui reste juste au banc (aucun faux
lien). Né de REFONTE-4b-2 (#1154, run du 20/11 19:30).

## Mesures de ce run (banc, notes brutes, 40 jeux, 90 jours, terme court du bien-être)

Script jetable (non commité) : `simulateMatrix` (option `binary` de #1154) → `analyzeMatrix` avec l'habitude, puis
lecture de la ligne du facteur ; vraie pente par unité = `size` pour une habitude, `0,5 × size / 45` par minute pour le
sommeil (`wellbeingSd` 0,5, écart type du sommeil 45 min). `RIDGE_GRID` remplacé par `[1e-6]` pour « sans pénalité ».

| Variante | Habitude 0,8 pt : estimé / vrai | fourchette juste | Sommeil (size 1) : estimé / vrai | fourchette juste |
|---|---|---|---|---|
| Actuelle (ridge, 10 % de jours sans valeur) | 0,51 | 17 % | 0,53 | 10 % |
| Ridge, aucun jour manquant | 0,61 | 38 % | 0,57 | 13 % |
| Sans pénalité, 10 % manquants | 0,74 | 75 % | 0,75 | 85 % |
| Sans pénalité, aucun manquant | **0,86** | **90 %** | **0,81** | **82 %** |
| λ ≤ 3 seulement, 10 % manquants | 0,70 | 60 % | 0,71 | 57 % |

Puissance (part des jeux où le lien est net) et faux liens **identiques** dans toutes les variantes (17 % / 97 % /
68 % de puissance, 0 à 3 % de jeux avec un faux lien) : la netteté ne dépend pas de la taille affichée.

## Trois causes, par ordre de poids

1. **La pénalité de la ridge** (`ridgeModel.js`, λ choisi par validation croisée jusqu'à 100 pour ~80 jours) :
   0,5 → 0,75. La fourchette est le bootstrap du coefficient pénalisé, donc centrée sur une valeur rétrécie : elle
   manque la vraie valeur 8 à 9 fois sur 10.
2. **Jours sans valeur remplacés par la moyenne** (`colOf` dans `fitOutcomeModel`) : un jour sans mesure compte comme
   un jour « moyen », ce qui dilue la pente : 0,75 → 0,85 environ.
3. **Le lissage TS-1 du résultat** (dans l'app, pas au banc) : un effet du jour même passe de 0,63 à 0,38 (mesure du
   run de 19:30 sur les mondes d'`analysisResults.test.js`). Le banc ne le voit pas : il donne les notes brutes.
   Reste ~0,15 inexpliqué (contrôles de rupture TS-2 ? fenêtre de 2 jours avec un jour manquant ?) : à mesurer au
   run de code, contrôle par contrôle.

## Proposition pour le run de code (un run, banc d'abord)

1. **Garder la ridge** pour ce qu'elle fait bien : choix des facteurs du modèle, stabilité du signe (net),
   « bat demain = aujourd'hui », contributions du jour (« Ce qui a pu peser »).
2. **Taille et fourchette affichées** : un second ajustement **sans pénalité** des seuls facteurs retenus (`used`) et
   des contrôles, **sur les jours où ils sont tous connus** (pas d'imputation) ; fourchette = bootstrap par semaines
   de ce même ajustement (mêmes tirages que la stabilité, donc aucun coût de plus que 100 petites régressions).
   Si trop peu de jours complets (< 2 semaines ou < 8 jours par facteur) : garder l'estimation actuelle.
3. **TS-1** : pour la taille seulement, régresser sur les notes brutes du jour (le poids de TS-1 reste) ; ou mesurer au
   banc avec TS-1 dans la boucle (matrice construite depuis des entrées simulées, `buildAnalysisMatrix`) et choisir.
   Règle 5 inchangée : aucune entrée de l'estimateur ne devient facteur.
4. **Tests** (`method/bench.test.js`) : relever le plancher du test « habitude à effet fort » de 0,4 à 0,75 ; ajouter
   la couverture (fourchette juste dans ≥ 80 % des jeux, effet fort et moyen, habitude et sommeil) ; faux liens
   toujours ≤ 5 % (inchangés par construction : `net` ne change pas).
5. **Ce qui change à l'écran** : les chiffres d'Objectifs (« +0,2 pt » → environ « +0,3 pt ») et les fourchettes,
   un peu plus larges ; `SCALE_SPAN` (effet plus grand que l'échelle → « pas assez de données ») touchera un peu plus de
   lignes : à compter sur les données de démo. Captures d'Objectifs, du détail d'un facteur et d'Agir, clair et
   sombre ; note de Nouveautés courte (« les tailles des liens sont plus justes ») ; code partagé, donc iPhone aussi.
   Aucune donnée ni aucun schéma touchés ; le cache des résultats (`contractVersion`) se recalcule seul.

## Risques
- Sans pénalité, deux facteurs retenus corrélés (jusqu'à 0,9 permis) peuvent donner des tailles instables : les
  mesurer au banc avec deux facteurs corrélés à 0,8 ; au besoin, abaisser `MAX_FACTOR_CORR` pour le seul affichage.
- Agir (`trials.js`) ne lit de la taille que son signe (sens de l'essai, inchangé) et le chiffre qu'il affiche
  (« +0,3 point de bien-être pour… ») : seul ce texte grandit ; le bilan d'un essai a sa propre fourchette.

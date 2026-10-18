# 2026-10-18 08:30 Paris (06:30 UTC) — Run « idées » : tester beaucoup de facteurs, expériences, voix

**Type** : 💡 idées (D5, D6, D4)  ·  **PR** : « [Auto] Idées : faux liens sur 40 facteurs, expériences de nuit, voix 2026 »

## Pourquoi
- 08:30 Paris = run « idées » : pas de code produit.
- Démarrage : main à `e13fad3` (#204, v162). « Tests », « Build & Release » et émulateur A56 verts sur main ; aucune
  PR « [Auto] » ouverte ; `cursor/*` #51 non touchée. Aucun nouveau journal dans `journal/diagnostics/`.
- Sujets prévus par le run idées du 17/10 20:30 : combien de X tester sans noyer les vrais liens ; ABAB avec I102 ;
  voix 2026.

## Ce qui a été fait
- Relecture de la gestion actuelle des tests multiples (`analysisEngine.js` : ≈ 55 variables, n effectif, BH ;
  pistes à q < 0,2 ; `laggedEffects.js` q < 0,05).
- **Simulation** `journal/protocoles/multiplicite-abab-sim.py` (outil de recherche hors app) : A) 40 facteurs dont
  12 corrélés, 2 vrais liens, 6 règles × 3 durées ; B) expérience tirée au sort, blocs de 1 / 3 / 7 jours, effets
  0 → 1,5, deux règles de décision. 600 tirages par case.
- Veille : n-of-1 ABAB (Lin 2016, `nof1kit`), préprint « cold-start » 2026, voix (Koch et al. Interspeech 2026,
  emotion2vec+ et sa licence, Wav2Small, FRILL), plaintes Bearable.
- `IDEES.md` : nouvelle section, **5 idées I107–I111**. `BACKLOG.md` : D6 (I107, I108, I109 avant I103), D5
  (garde-fous → I107 / I108 / I109), D4 (I110, I111), prochaines étapes n° 5. `README.md` : résumé, « Meilleures
  idées », tableau.
- Pas d'entrée « Nouveautés » : rien de visible dans l'app.

## Idées retenues (détail dans `IDEES.md`)
| # | Idée | Score |
|---|---|---|
| I107 | I102 avec a priori spike-and-slab (90 % des facteurs sans effet) : contrôle de la famille | 20 |
| I108 | Pistes « Chez vous » (q < 0,05) / « À vérifier » (q < 0,2, une seule) | 20 |
| I110 | Porte d'entrée de l'estimateur : visage / voix actifs seulement après calibration chez l'utilisateur | 16 |
| I109 | Expérience tirée au sort chaque soir, sur une mesure de nuit, 6 semaines (remplace I45) | 12 |
| I111 | Voix : dictée d'abord, prosodie maison en écart à soi, aucun modèle d'émotion vocale embarqué | 12 |

## Vérifications
- `npm ci` puis `npm run test` : **1366 tests verts** (104 fichiers). Pas de `build` / `visual` / `lint` : aucun
  fichier de l'app touché (journal seulement).
- Simulation A (≥ 1 faux sens / puissance, 120 j) : pistes actuelles 25 % / 58 % ; I102 seul **58 % / 87 %** ;
  I102 + BH 2 % / 38 % ; **spike-and-slab 1,2 % / 36 %** (180 j : 0,7 % / 70 %).
- Simulation B : sur la note de bien-être, d = 0,5 tranché 26–36 % après 84–112 j (strict) ; d = 1,5 sur une mesure
  de nuit, tirage quotidien, 97,5 % : 58 % à 28 j, 83 % à 42 j, 3–4 % de faux sens sans effet (nominal 2,5 % :
  l'erreur type de Cochrane-Orcutt est un peu optimiste sur peu de jours, à corriger par un bootstrap ou t de Student).

## Apprentissages / décisions
- La règle I102 du 17/10 n'était validée que **par facteur** ; l'app en teste des dizaines : sans correction de
  famille, « chez vous » serait faux une fois sur deux. **I102 ne sera pas codé sans I107.**
- Un a priori « la plupart des facteurs ne font rien » est à la fois honnête (littérature n-of-1) et compatible D6 :
  il est centré sur zéro, n'avantage aucun sens, et ne dépend d'aucune liste de facteurs « importants ».
- Les expériences ne valent la peine que sur des mesures de la montre la nuit ; sur l'humeur elles sont trop lentes.
- Voix : la valence ne se lit pas dans la prosodie d'une personne inconnue (ρ = 0,02) ; tout signal d'humeur doit
  passer une calibration individuelle avant d'être affiché (I110).

## Suite proposée
1. 🧭 D6 : **I108** (petit, un run), puis I102 écrit avec I107, puis I103 / I104.
2. ⚡ D2 : séries quotidiennes du Worker (≈ 8 k lectures restantes), taille de l'APK.
3. 🙂 D4 : I100 ① (moteur LiteRT du visage) avec I106 ; I110 dès le premier signal.
4. 💡 Prochain run idées (18/10 20:30) : π0 adaptatif ; taille d'effet individuelle alcool / café sur VFC et
   sommeil ; besoins quotidiens hors statistiques (Reddit 2026).

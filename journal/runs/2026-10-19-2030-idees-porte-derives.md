# 2026-10-19 20:30 Paris (18:30 UTC) — Run « idées » : la porte du visage face aux dérives lentes, lire le diagnostic, voix et lexiques

**Type** : 💡 idées (consigne du 18/10 au soir, priorité unique ; D4, D5, D6)  ·  **PR** : #223

## Pourquoi
- 20:30 Paris = run « idées » : pas de code produit, sauf si le signalement du 19/10 15:05 n'était pas corrigé.
- Vérifications de début de run : signalement 15:05 **corrigé et fusionné** (PR #221 → v176) ; main à `cd2a28a`
  (#222), « Tests », « Build & Release » (**v177** avec `HealthTrack-v177.apk`) et émulateur A56 verts. Aucune PR
  « [Auto] » ouverte (#51 `cursor/*` non touchée). Rien de nouveau dans `journal/diagnostics/` : le diagnostic de
  l'A56 n'est pas encore revenu, donc pas de nouvelle hypothèse à coder.
- Pistes laissées par le run de 08:30 : lexique français libre, Bien-être numérique vs `queryEvents`, reconnaissance
  vocale hors ligne fr-FR sur un Galaxy A. Ajouté : la solidité de la porte de calibration avant I115.

## Ce qui a été fait
- Relecture de `services/mood/gate.js` et `gate.test.js` : les simulations ne testent que des **jours indépendants**.
- Simulation avec le **vrai** `faceIndexLoo` / `jackknifeCorrelation` (`journal/protocoles/porte-autocorrelation-sim.test.js`,
  300 tirages sans lien + 150 avec ρ 0,5, 120 j) : faux départs selon l'autocorrélation de l'humeur et du visage,
  et trois correctifs (n effectif ; blocs ±7 j ; écart à la moyenne des 14 j précédents).
- Veille : Samsung *App management* (lu), restrictions FGS Android 12+, NRC / FEEL (licences), reconnaissance vocale
  hors ligne Samsung / Android, Bien-être numérique, MoodCam + relecture 2026, CHI 2026, Emobot.
- `IDEES.md` : section du 19/10 20:30, **I121–I125** + écartées + arbre de lecture du diagnostic (I122).
  `RESEARCH.md` : section du soir. `BACKLOG.md` : I121–I125, I115 après I121, note licences sous I119, ordre des
  prochaines étapes. `README.md` : paragraphe du run, meilleures idées, priorités, tableau.
- Pas d'entrée « Nouveautés » : rien de visible dans l'app.

## Résultat principal (simulation)
| humeur / visage (autocorr. jour à jour) | règle actuelle | blocs ±7 j + n effectif | + écart 14 j | lien ρ 0,5 ouvert J120 (actuelle → corrigée) |
|---|---|---|---|---|
| 0 / 0 | 1,3 % | 1,0 % | 2,7 % | 55 → 53 % |
| 0,6 / 0,6 | **12,7 %** | 1,0 % | 2,7 % | 62 → 35 % |
| 0,8 / 0,95 (moitié dérive) | **22,3 %** | 2,0 % | 1,3 % | 77 → 37 % |
| 0,9 / 0,95 (70 % dérive) | **55,7 %** | 7,0 % | 3,0 % | 79 → 21 % |

→ Avant d'afficher une humeur estimée (I115), la porte doit apprendre « sans les voisins » et corriger son erreur type
(I121). Perte de puissance assumée (D5).

## Idées retenues (détail dans `IDEES.md`)
| # | Idée | Score |
|---|---|---|
| I121 | Porte robuste aux dérives lentes (blocs ±7 j + n effectif, option écart 14 j) + test AR(1) | 20 |
| I122 | Arbre de lecture du diagnostic de l'A56, écrit d'avance | 20 |
| I123 | Bouton « Applis jamais en veille » (lien direct Samsung), Samsung seulement, si service endormi | 15 |
| I124 | Sonde vocale dans le diagnostic (moteur local, fr-FR) avant I117 natif | 12 |
| I125 | « Rien reconnu — me le signaler ? » sous la phrase du soir | 8 |

## Vérifications
- `npm ci` puis `npm run test` dans `app/` : **1 539 tests verts** (115 fichiers). Journal seulement (pas de build / visual / lint : aucun fichier de l'app touché) ; les fichiers de simulation
  temporaires ont été retirés de `app/src`).

## Apprentissages / décisions
- **Tester une règle statistique sur des séries réalistes, pas seulement indépendantes** : l'autocorrélation est la
  norme pour l'humeur quotidienne et pour tout capteur exposé à la saison / lumière.
- **Pas de lexique tiers** tant qu'une licence claire n'est pas lue (FEEL muet, NRC payant hors recherche).
- **One UI** : la veille automatique touche les apps non ouvertes ≈ 3 j ; le propriétaire ouvre l'app tous les jours,
  donc ce n'est probablement pas la cause du 15:05 (déjà expliquée par le récepteur non exporté).

## Pour le propriétaire (Galaxy A56) — inchangé, toujours en premier
1. Installer la dernière version (v177 ou plus : Plus → Nouveautés, première ligne).
2. Plus → Connecteurs → **Lecture du visage** : si « Arrêtée » ou « À relancer », toucher **Relancer** (app ouverte).
3. Verrouiller puis **déverrouiller 2 ou 3 fois à l'empreinte**, en regardant l'écran, à plus de 2 min d'écart.
4. **Diagnostic → « Enregistrer le diagnostic »** et renvoyer le fichier `Documents/healthtrack-visage-….json` (ou une
   capture des lignes « Aujourd'hui : écran allumé… », « Accès caméra… », « Dernières tentatives… »).

## Suite proposée
1. 📥 Diagnostic de l'A56 dès qu'il arrive → arbre I122.
2. 🙂 Sinon, prochain run de code (22:30) : **I121** porte robuste (JS seul, tests AR(1)), puis I123 / I124.
3. 💡 Prochain run idées (20/10 08:30) : autocorrélation réelle de l'humeur quotidienne (inertie émotionnelle) pour
   calibrer les tests de I121 ; comportement de `USER_PRESENT` sur One UI 8.

# Étape 6d — Banc des seuils 7 et 14 jours (15/11, run « idées » de 20:35)

Question de la préparation (`ETAPE-6-OBJECTIFS.md` § 4) : si l'horizon court du moteur s'ouvrait à 7 jours notés
(bien-être) et à 14 (digestion), les pistes resteraient-elles honnêtes (au plus 5 % de jeux avec un faux lien
« net », brief § 3.5 et règle 5), et trouveraient-elles quelque chose ?

Méthode : le banc d'ORG-5a (`app/src/services/method/bench.js`, `simulate.js`) sur la méthode réelle de l'app
(`analyzeMatrix`), seuil court abaissé le temps du banc. Données synthétiques : 16 facteurs autocorrélés avec
28 jours d'historique importé avant le premier jour noté, rythme de la semaine, tendance, bruit autocorrélé ;
tous les jours notés sauf mention. 400 jeux par scénario. Effet « fort » = 1 écart type du bruit (≈ 0,5 point sur 5
de bien-être pour une variation habituelle de sommeil), « très fort » = 1,5. Fichiers pour rejouer :
[`banc-6d/`](banc-6d/) (copier `bench.seuils6d.test.js` dans `app/src/services/method/`, puis
`BENCH_6D=1 npx vitest run bench.seuils6d --disableConsoleIntercept` ; `node banc-6d/essai-5-5.mjs`).

## Résultats

| Scénario (400 jeux) | Jeux avec faux lien | Faux liens par jeu | Puissance | Durée |
|---|---|---|---|---|
| nul, 7 j tous notés, seuils 7/14 | 0 % | 0.00 | — | 0 s |
| nul, 8 j tous notés, seuils 7/14 | 0 % | 0.00 | — | 0 s |
| nul, 10 j tous notés, seuils 7/14 | 0 % | 0.00 | — | 1 s |
| nul, 14 j tous notés, seuils 7/14 | 2.3 % | 0.02 | — | 1 s |
| nul, 16 j (10 % non notés), seuils 7/14 | 2 % | 0.02 | — | 1 s |
| nul, 21 j tous notés, seuils 7/14 | 2 % | 0.02 | — | 4 s |
| nul, 14 j, gêne 1 j sur 2, seuils 7/14 | 3.5 % | 0.04 | — | 2 s |
| nul, 21 j, gêne 1 j sur 2, seuils 7/14 | 3.3 % | 0.03 | — | 4 s |
| sommeil fort (1), 8 j, seuils 7/14 | 0 % | 0.00 | wellbeing|sleepMinutes|short=0% | 1 s |
| sommeil fort (1), 10 j, seuils 7/14 | 0 % | 0.00 | wellbeing|sleepMinutes|short=0% | 1 s |
| sommeil fort (1), 14 j, seuils 7/14 | 3.5 % | 0.04 | wellbeing|sleepMinutes|short=5% | 1 s |
| sommeil fort (1), 21 j, seuils 7/14 | 7.8 % | 0.09 | wellbeing|sleepMinutes|short=8% | 3 s |
| sommeil fort (1), 28 j, seuils 7/14 | 6 % | 0.07 | wellbeing|sleepMinutes|short=13% | 5 s |
| sommeil très fort (1,5), 8 j, seuils 7/14 | 0 % | 0.00 | wellbeing|sleepMinutes|short=0% | 1 s |
| sommeil très fort (1,5), 14 j, seuils 7/14 | 4.5 % | 0.04 | wellbeing|sleepMinutes|short=14% | 1 s |
| fibres très fort (1,5), 14 j, gêne 1 j sur 2, seuils 7/14 | 5.3 % | 0.05 | digestion|fiber_g|short=4% | 1 s |
| fibres très fort (1,5), 21 j, gêne 1 j sur 2, seuils 7/14 | 3.3 % | 0.03 | digestion|fiber_g|short=14% | 4 s |
| fibres très fort (1,5), 28 j, gêne 1 j sur 2, seuils 7/14 | 4 % | 0.04 | digestion|fiber_g|short=25% | 6 s |
| sommeil fort (1), 14 j, seuils 14/28 | 3.5 % | 0.04 | wellbeing|sleepMinutes|short=5% | 1 s |
| fibres très fort (1,5), 28 j, gêne 1 j sur 2, seuils 14/28 | 4.5 % | 0.04 | digestion|fiber_g|short=26% | 5 s |

Constat technique : un facteur n'est comparé qu'avec au moins 8 jours où il a une valeur (`fitOne`) ; à 7 jours
notés, le moteur ne compare donc **aucun** facteur, quel que soit le seuil affiché.

## Ce que ça tranche
1. **Bien-être à 7 jours : lecture A.** Ouvrir les pistes à 7 jours n'apporterait rien : aucune comparaison avant
   8 jours, et à 8-10 jours un effet très fort n'est jamais retrouvé (0 %). À 14 jours (seuil actuel) : 2 à 3,5 %
   de faux liens, effet fort retrouvé 5 fois sur 100, très fort 14. Le score et la tendance s'ouvrent à 7 jours
   (livré en 6a) ; les pistes restent au 14e jour, et l'écran ne promet rien avant.
2. **Digestion à 14 jours : lecture A aussi.** Avec une gêne un jour sur deux, 3,5 à 5,3 % de faux liens à 14 jours,
   au bord de la limite, pour un effet très fort retrouvé 4 fois sur 100 ; à 28 jours, 4 à 4,5 % et 25 %. Le score à
   14 jours (6a), les pistes à 28.
3. **Trouvé en passant, à corriger au run de 6d : l'horizon moyen du bien-être s'ouvre trop tôt.** Quand un vrai lien
   existe (sommeil, effet fort), 7,2 % des jeux à 21 jours et 6 % à 28 montrent un faux lien, presque tous sur
   l'horizon moyen (fenêtre de 2 à 6 jours), qui s'ouvre à 21 jours (`UNLOCK_DAYS.wellbeing.medium`). C'est la
   méthode actuelle, pas seulement l'hypothèse 7 jours. Ouvert à 35 jours (comme la digestion) :

   | Horizon moyen ouvert à | 21 j | 28 j | 35 j | 42 j |
   |---|---|---|---|---|
   | 21 jours (aujourd'hui) | 7,2 % · 8 % | 6,0 % · 13 % | 3,8 % · 23 % | 3,8 % · 27 % |
   | 28 jours | 4,0 % · 14 % | 6,0 % · 13 % | 3,8 % · 23 % | 3,8 % · 27 % |
   | 35 jours | 4,0 % · 14 % | 3,8 % · 18 % | 3,8 % · 23 % | 3,8 % · 27 % |

   (jeux avec un faux lien · effet fort retrouvé au court terme, par nombre de jours notés.) À 35 jours, tout reste
   sous 5 %, et le court terme gagne en puissance (moins de comparaisons, Holm moins sévère). Sans effet vrai, le
   seuil de 21 jours restait à 1,5 % : le défaut n'apparaît que quand un lien existe, ce qui est le cas utile.
4. **Essai 5 jours avec, 5 jours sans (reste de 6c-2)** : « Plutôt oui » à tort 3,9 % (tous les jours suivis), 4,4 %
   (un jour sur cinq sans note ou non tenu ; « trop peu » 11 %), 4,1 % avec un bruit plus autocorrélé ; « Plutôt
   non » à tort, autant. Sous 5 % : la règle ± 2 erreurs types reste. Le seuil de Student (Welch) descendrait à 2 %
   mais ferait passer la puissance pour un effet d'un écart type de 41 à 28 %. À 7 + 7 jours : 3,2 % et 51 %.

## Pour le run de code de 6d
- `FIRST_RESULTS_DAY` reste { 14, 28 } ; `FIRST_SCORE_DAY` { 7, 14 } (déjà là).
- `UNLOCK_DAYS.wellbeing.medium` : 21 → 35 ; textes et ORG-6 qui disent « 21 jours » ; cas de non-régression dans
  `bench.test.js` (effet fort, 21 et 28 jours, ≤ 5 %).
- Textes : « premier score au 7e jour », « premières pistes vers le 14e » (digestion : 14 et 28) dans la visite
  guidée, Premium, « Voir un exemple » ; le test des délais vérifie les deux couples.

## Limites
- Simulation : facteurs indépendants entre eux, effets linéaires ; un vrai journal a des facteurs liés (sommeil et
  écran tard), ce qui rend les faux liens plus probables, pas moins.
- 400 jeux : ± 1 point environ sur un taux de 5 %. Les scénarios partagent les mêmes graines.
- Les seuils d'affichage de 6b (« faible » sous 0,25 point, « fort » au-delà de 0,5) ne sont pas mesurés ici.

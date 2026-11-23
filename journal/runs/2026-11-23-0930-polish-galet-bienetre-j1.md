# Run du 23/11 09:30 (Paris) — POLISH-SIM-145, 147 et 149

Type : 🔧 code (polish, constats des personas du 23/11 08:30). Instructions vérifiées (empreinte de
`orchestration/routine/0[1-4]-*.md` conforme). main vert (Tests, émulateur A56, Play — AAB et Build & Release de #1212
et #1213), aucune PR de la routine ouverte.

## Fait
- **POLISH-SIM-145** : le galet Activité du cairn (Objectifs › Votre bien-être › Par famille) était peint
  `var(--lilac-label)`, variable absente : ovale noir. `--lilac-label` ajoutée dans les deux thèmes (= `--lilac-bar`),
  `[data-tone='lilac']` passe par elle ; test des tokens : chaque teinte a son `-label` et son `-track`, et
  `lilac-label` sur `lilac-bg` ≥ 4,5:1 (clair et sombre).
- **POLISH-SIM-147** : `buildTrendSeries` rend `observedAny` (un état a-t-il déjà une note ou une lecture) ; tant que
  ce n'est pas le cas, le détail du jour de Tendances dit « Pas encore de note » au lieu d'un chiffre « estimé » tiré
  du seul départ du modèle. Tests `trendsData` et `Trends` (le test échoue sans le correctif, vérifié).
- **POLISH-SIM-149** : Ma journée, « Encore N jours notés avant vos pistes digestives » (le palier du 28e jour porte le
  même nom que dans Objectifs et la visite). Test `DigestBlock`.
- Nouveautés : `2026-11-23-0930-galet-bien-etre-jour1.json` (code partagé : Android et iPhone).

## Vérifications
- `npm run test` : 4 393 tests verts (404 fichiers) avant l'ajout du test `Trends` (35/35 ensuite) ; lint : 0 erreur
  (comme avant) ; `npm run build` vert.
- `npm run visual -- --routes=/recommendations/bien-etre,/tendances?vue=jour` : captures relues (cairn : galets
  Sommeil bleu nuit, Alimentation pêche, Activité lilas pâle « calme ») ; persona jour 1 rejouée
  (`persona-browse.mjs --day=1 --equipment=watch`) : au jour 1 sans note, Bien-être n'est pas proposé en Tendances
  (moins de 3 points), le correctif sert donc dès qu'il apparaît sans observation ; couvert par le test de composant.
- iPhone : aucun des 3 correctifs restants (`01`, `02`, `27`) ne touche ces fichiers.

## État
- Android : release v883 (avant ce run). iPhone : 1268.1268 validée pour « Testeurs Halcya » ; 1244.1244 attachée à
  la 893 (PI2). Parité : 70 % (inchangée, code partagé).
- PR « [Auto] » ouverte prête : build iPhone sur simulateur et émulateur à attendre ; **merge au run suivant** après
  les captures iPhone (Objectifs › Votre bien-être, Tendances, Ma journée).

## Suite
1. Run suivant : checks de la PR, captures iPhone, merge.
2. POLISH-SIM-148 (cadeau sur la bulle Bien-être, capture au jour 1 avant/après), puis 146 et 150 après le banc.
3. FUSION-3 : 02 (mode captures), 27 (décision), 01 en dernier.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

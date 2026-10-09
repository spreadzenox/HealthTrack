# 2026-10-09 02:30 UTC — Tags d'habitudes dans le check-in + analyse « jours avec / sans »

**Type** : 🏗️ (fonctionnalité + analyse)  ·  **PR** : voir ci-dessous

## Pourquoi
Item n°1 des « Prochaines étapes » (C4, R#2) : les pistes actuelles ne portent que sur des données
mesurées (pas, sommeil, nutriments). Les comportements qui comptent le plus pour le ressenti
(alcool, café tardif, écran le soir, stress) n'étaient pas saisis. Démarrage : main sain
(dernier Tests ✅, Build & Release v65 ✅ au run précédent), aucune PR [Auto] ouverte (seule PR
ouverte : #51 `cursor/*`, non touchée).

## Ce qui a été fait (TDD)
- `services/behaviorTags.js` (nouveau, 13 tests) :
  - 7 tags : Alcool, Café après 14 h, Repas tardif, Écran tard, Sport le soir (effet mesuré **le
    lendemain**), Stress, Malade (effet **le jour même**).
  - `computeTagEffects` : par jour, moyenne des notes et union des tags ; ne compte que les jours
    **depuis le premier tag utilisé** (l'historique d'avant la fonctionnalité n'est pas lu comme
    « sans ») ; ≥ 5 jours avec **et** 5 sans, sinon « en cours de collecte » ; différence de
    moyennes, **test de permutation** bilatéral (2 000 permutations, graine fixe → déterministe,
    estimateur +1 de Phipson & Smyth), Benjamini-Hochberg entre tags → « solide / à confirmer /
    incertain » (réutilise `statistics.js`).
- **Stockage** : `payload.tags` (tableau d'identifiants, ordre stable) dans l'entrée `wellbeing`
  existante, omis si vide → **aucune migration IndexedDB**, export/import JSON inchangés, anciens
  fichiers compatibles.
- `WellbeingPrompt` : puces « Aujourd'hui (facultatif) » à bascule (`aria-pressed`, ≥ 44 px),
  remises à zéro à chaque ouverture ; modale défilable si l'écran est petit.
- Recommandations (onglet basique) : section **🏷️ Vos habitudes** entre « Pistes à tester » et
  « Corrélations » : « Le lendemain : bien-être 1,0 / 5 contre 2,3 sans (−1,3 point) · 8 jours
  avec · 31 sans · Hypothèse solide » ; cartes « incertain » en pâle ; invitation si aucun tag.
- Tableau de bord : tags affichés sous la note dans « Dernières entrées » (ids inconnus ignorés).
- Démo (`demoData.mjs`) : tags sur les 40 derniers jours (RNG séparé pour ne pas décaler les
  autres séries), effets simulés (alcool −0,8 le lendemain, écran tard −0,3, stress −0,9…).

## Vérifications
- Tests : 403 ✅ (384 + 19) · Lint : 14 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : 7 pages démo sans erreur JS ni débordement. Relu : section « Vos habitudes » (alcool
  « solide », stress / écran tard « à confirmer », café « incertain » en pâle, Malade en
  collecte), modale de check-in avec les 7 puces (tient dans l'écran A56), entrée bien-être avec
  « 📱 Écran tard ». `--empty` : Recommandations « Données insuffisantes », tableau de bord vide OK.

## Apprentissages / décisions
- Tags rattachés au **jour du check-in** ; les habitudes du soir sont comparées au bien-être du
  lendemain. Si l'utilisateur note le matin ce qui s'est passé la veille, le décalage sera faux :
  à surveiller (option future : choisir « hier soir » / « aujourd'hui »).
- Permutation plutôt que t de Welch : petits effectifs, notes entières bornées 0–5 → pas
  d'hypothèse de normalité. L'autocorrélation n'est pas corrigée ici (jours taggés épars) : noté.
- Les tags ne sont pas (encore) des variables du modèle avancé ni des « pistes à tester » : étape
  suivante possible une fois que de vraies données existent.

## Suite proposée
- 🔒 Transparence Gemini (R#9).
- 🏗️ Radar (R#12), puis tags dans les « Pistes à tester » (« Essayer moins d'écran le soir »).
- 🐛 Run bugs & visuel (le dernier date de 20:30 hier).

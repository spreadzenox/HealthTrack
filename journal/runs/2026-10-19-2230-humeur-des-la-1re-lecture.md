# 2026-10-19 22:30 Paris (20:30 UTC) — Humeur estimée dès la première lecture (consigne du 19/10 au soir, étape 1)

**Type** : 🏗️ bien-être automatique (consigne du 19/10 au soir, charte §0000000)  ·  **PR** : #224

## Pourquoi
- Vérifications de début de run : main à `d181521` (#223) ; aucune PR « [Auto] » ouverte ; signalement du 19/10 15:05
  corrigé et fusionné (#221) ; rien de nouveau dans `journal/diagnostics/` (diagnostic de l'A56 pas encore revenu).
- Nouvelle consigne du propriétaire (19/10 au soir) : « Je ne veux pas avoir à attendre les 30 jours de calibration…
  je veux une lecture du bien-être 100 % auto. » Elle prime sur l'ordre du 18/10. Premier run qui la lit : reportée
  dans la charte (§0000000), le résumé de la semaine et le backlog, puis étape 1 livrée.

## Ce qui a été fait
- `app/src/services/mood/faceMood.js` (nouveau, fonction pure) :
  - valence **a priori** dans [−1, 1] à partir des indices déjà mesurés (`smile`, `duchenne`, `mouthFrown`,
    `browDown`, `browInnerUp` ; poids FACS documentés), note = 2,5 + 2,5 × valence ;
  - **visage habituel** : médianes des 28 j précédents, mêlées au neutre de population (poids j / (j + 7)) ;
  - **calibration facultative** : `calibrateRidge` sur les jours notés (≥ 14, gardée si ≥ 10 % mieux en LOO) →
    « modèle personnel » ;
  - fourchette et **confiance** (faible / moyenne / bonne) : erreur du modèle, dispersion et nombre de lectures du
    jour, part d'images valides, cadrage (lacet) ; un seul signal (visage) pour l'instant ;
  - `testReadingEstimate` : la lecture d'un « Tester maintenant » récent, estimée à part (jamais dans le jour).
- `MoodEstimateCard` (accueil, au-dessus de « Votre forme ») : phrase du jour, barre 0–5 avec la fourchette, humeur à
  la dernière lecture, confiance, modèle ; rien sans lecture. Rafraîchie quand des lectures sont rangées
  (`useAutoSync` émet `health-entries-updated` si l'import en insère).
- `FaceSenseCard` : bloc « Humeur estimée » sous l'état du jour ; intro réécrite (plus de « plusieurs semaines ») ;
  « Tester maintenant » affiche « Humeur de ce moment : … ».
- `gate.js` : `describeGate` devient une **vérification facultative** (« Rien n'est affiché » retiré partout) ;
  diagnostic : ligne « Humeur estimée : modèle général / personnel, confiance… » et champ `estimate` (comptes
  seulement, jamais la valeur), « Vérification visage ↔ notes (facultative) ».
- Démo visuelle : rafales du déverrouillage sur les 10 derniers jours (RNG séparé, aujourd'hui compris).
- Entrée « Nouveautés » `2026-10-19-2230-humeur-des-la-1re-lecture.json`.

## Vérifications
- `npm run test` : **1 559 tests verts** (117 fichiers ; +15 `faceMood.test.js`, +3 `MoodEstimateCard.test.jsx`,
  FaceSenseCard / gate / faceSense mis à jour).
- `npm run build` OK ; `npm run lint` : 6 erreurs, identiques à main (aucune dans les fichiers touchés).
- `npm run visual` (toutes les pages) OK, plus `--empty` et `--light` sur l'accueil, `--face` sur Connecteurs.
  Captures lues : accueil (carte « Humeur estimée », confiance faible, fourchette 1,6–4,0), Connecteurs (bloc sous
  « Aujourd'hui… », avant les comptes et boutons), accueil vide (aucune carte, pas de message de verrou).

- Check CI « Budget de lectures (perf) » rouge au 1er push : l'accueil lisait **toutes** les notes de bien-être
  (3 ans de démo : 13 252 enregistrements > 12 500). Corrigé : `mood/faceMoodData.js` ne lit les notes que depuis le
  jour de la première rafale (une note plus ancienne n'a aucune lecture à qui être comparée) → 12 166, budget
  respecté en local (`npm run perf -- --budget`), 1 561 tests.

## Apprentissages / décisions
- **Penser au budget de lectures (D2) dès qu'une carte de l'accueil lit un type d'entrée en entier** : borner par
  `since` à la période utile.
- **L'a priori est une hypothèse de population, affichée comme telle** (D6) : large fourchette, confiance faible tant
  que seul lui parle ; les données personnelles (visage habituel, puis notes) le supplantent.
- La porte I112 reste utile comme vérification honnête, mais n'est plus un verrou. I121 (dérives lentes) concerne
  désormais aussi l'adoption du « modèle personnel » (LOO simple) : à étendre.
- Le diagnostic exportable continue de ne contenir **aucune valeur d'humeur** (vérifié par un test).

## Pour le propriétaire (Galaxy A56)
1. Installer la version publiée après ce run (Plus → Nouveautés, première ligne).
2. Plus → Connecteurs → Lecture du visage : si « Arrêtée » ou « À relancer », toucher **Relancer** (app ouverte).
3. Déverrouiller 2 ou 3 fois à l'empreinte en regardant l'écran, à plus de 2 min d'écart.
4. Revenir sur l'accueil : la carte **« Humeur estimée »** doit être là. Sinon : **Diagnostic → « Enregistrer le
   diagnostic »** et renvoyer le fichier (ou une capture des lignes « Aujourd'hui : écran allumé… », « Accès
   caméra… », « Dernières tentatives… »).
5. « Tester maintenant » en souriant, puis sans sourire : la phrase « Humeur de ce moment » doit changer. Dire si
   l'estimation paraît plausible.

## Suite proposée
1. 📥 Diagnostic de l'A56 dès qu'il arrive (arbre I122).
2. 💡 Run idées 20/10 08:30 : comparatif des modèles valence / éveil embarquables (précision, poids, latence A56,
   **licence des poids**), choix argumenté dans `IDEES.md` / `RESEARCH.md`.
3. 🙂 Run de code suivant : I121 étendu (blocs ±7 j) à la calibration personnelle, puis étape 2 dès que le modèle est
   choisi.

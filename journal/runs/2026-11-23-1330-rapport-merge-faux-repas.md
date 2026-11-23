# Run 23/11 13:30 — #1217 mergée, PERSONAS-OUTIL-2 (repas simulé des personas)

**Type** : 🔧 (outillage, rien de visible dans l'app) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) ·
**Android** : main 7dd2548 (#1217) · **TestFlight** : 1268.1268 validée pour « Testeurs Halcya » (dernier relevé,
07:33 UTC), 1244.1244 attachée à la version 893 · **Parité** : 70 % (33/47), 2 correctifs iPhone restent (01, 27)

## État de départ
- main vert sur 60c3698 (#1216 : Tests, Build & Release, émulateur, Play — AAB).
- PR de la routine ouverte : **#1217** (run de 12:30, prête), 15 checks verts dont le build iPhone (16 min), branche
  sur la pointe de main. #51 (`cursor/*`) pas touchée.

## #1217
- Captures iPhone (`captures/pr-1217`, build 1280.1280) relues, les trois points demandés par le run de 12:30 :
  `iphone-16e-rapport-apres-test.txt` : `testEnregistrerLeRapportDansFichiers` **passé** (18,9 s) ; ligne
  `[rapport] partage` avec `avant` 0, `après` **2**, 24 135 octets ; `restauration-onboarding.png` et
  `restauration-reprise.png` **présentes** (« 1 330 mesures reprises, avec vos réglages »). Carte « Rapport PDF pour
  mon médecin » ouverte avec « Créer le PDF » (plus « Débloquer »).
- **Mergée en squash (7dd2548)**, titre et message écrits à la main, sans ligne d'attribution. Workflows du merge
  lancés (Tests, Build & Release, émulateur, Play — AAB) : en cours à la fin de ce run, à vérifier au suivant.

## PERSONAS-OUTIL-2
- `app/scripts/persona/fakeMeal.mjs` : le faux relais de `persona-browse.mjs` lit le corps de `/v1/meal/analyze` ;
  une description écrite (`kind: 'text'`) est coupée en morceaux (virgules, « et », « + », « avec »), chaque morceau
  donne un aliment de `ingredientsNutrition.json` trouvé par son premier mot (le nom le plus court, donc le plus
  générique ; « tartine » et « baguette » → pain), 100 g par portion, le nombre devant multiplie (5 portions au plus).
  Photo, ou rien de reconnu : le plat d'exemple d'avant (carbonara).
- Exemples : « 2 tartines de pain, café et banane » → Pain (200 g), Café, Banane ; « riz, poulet, yaourt avec
  confiture » → Riz blanc cuit, Poulet grillé, Yaourt nature, Confiture.
- Test d'abord : `fakeMeal.test.mjs` (4 cas : mots repris, aliments présents dans la table, quantités, repli).
- `journal/simulations/brief.md` : une ligne dit que l'analyse est simulée (ce n'est pas un défaut à relever).

## Vérifications
- `npm run test` : voir la PR (suite complète verte en local) ; `eslint scripts/persona/` : 0 erreur ;
  `node --check` de `persona-browse.mjs`.
- Pas de `npm run visual` ni de build iPhone : aucun écran ni code embarqué ne change.

## Suite
1. Run suivant : workflows du merge de #1217 (release, APK), checks de cette PR, merge.
2. POLISH-SIM-146 et 150 (à vérifier contre le banc d'abord).
3. FUSION-3 : 27 attend une décision (FUSION-4), puis 01 en dernier.
4. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45 ; ajout aux testeurs externes au premier run où Apple
   a traité la build.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

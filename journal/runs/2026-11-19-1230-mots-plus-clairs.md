# Run du 19/11 12:30 — Des mots plus clairs (POLISH-SIM-111 à 113)

**Type** : 🛠️ code (polish de la refonte, objectif du 22/11) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 94b8962.

## État de départ
- main vert (#1121 : Tests, Build & Release, Play — AAB, émulateur Galaxy A56 verts).
- Aucune PR « [Auto] » ouverte (seule #51, brouillon de mai, hors routine).
- iPhone : `upstream.json` à `HEAD`, rien à avancer ; rien chez Apple avant l'envoi du soir.

## Ce qui a été fait
- **POLISH-SIM-112** : « analyses » ne garde qu'un sens (celles des repas par l'IA). Accueil : « Jour N sur 7 avant vos
  premiers résultats », carte du 7e jour « Vos premiers résultats de bien-être sont prêts » ; cérémonie du 7e jour
  « Vos premiers résultats sont prêts ». Objectifs disait déjà « premiers résultats ».
- **POLISH-SIM-111** : seuil vérifié avant de toucher : `frequentMeals` garde exprès un repas noté une fois (tests
  existants, refaire un repas récent en un geste, apprécié par la persona « maigrir » le 12/11). Rien retiré : c'est
  le titre « Repas habituels » qui trompait ; il devient « Refaire un repas ».
- **POLISH-SIM-113** : en-tête de Nouveautés « Ce qui a changé dans Halcya : la note importante d’abord, puis de la plus
  récente à la plus ancienne. » seulement quand la note à la une passe en tête ; sinon la phrase d'avant.
- Tests écrits d'abord (`CompanionHome.test.jsx`, `Ceremony7.test.jsx`, `Food.test.jsx`, `WhatsNew.test.jsx`), rouges
  puis verts.
- Note de Nouveautés `2026-11-19-1230-mots-plus-clairs` (code partagé, Android et iPhone).

## iPhone
- Les 52 correctifs de `iphone/patches/` s'appliquent en séquence sur le code modifié (copie de travail) ; le 33
  touche `WhatsNew.test.jsx` sur une autre partie. Parité : 70 % (inchangée).

## Vérifications
- `npm run test` : 4 099 verts ; `npm run build` vert ; ESLint propre sur les fichiers touchés.
- Captures relues (`--history-days=2 --routes=/,/food,/nouveautes`) : barre « Jour 2 sur 7 avant vos premiers
  résultats », « Refaire un repas » sous les boutons de Repas, Nouveautés en ordre de date (cas « à la une » couvert
  par le test).

## Suite proposée
1. Merger cette PR après ses checks (build iPhone compris).
2. POLISH-SIM-110 (nom d'un repas corrigé), 114 (rappels regroupés), 115 (balance), puis 105i.

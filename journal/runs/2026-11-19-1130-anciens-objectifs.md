# Run du 19/11 11:30 — Réglages : où sont passés les anciens objectifs (POLISH-SIM-100)

**Type** : 🛠️ code (polish de la refonte, objectif du 22/11) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main b89b3c2.

## État de départ
- main vert (#1120 : Tests, Build & Release, Play — AAB verts ; émulateur en cours au départ).
- Aucune PR « [Auto] » ouverte (seule #51, brouillon de mai, hors routine).
- iPhone : `upstream.json` à `HEAD`, rien à avancer ; rien chez Apple avant l'envoi du soir (1173.1173 en examen bêta).

## Ce qui a été fait
- **POLISH-SIM-100** (spécification du run « idées » de 08:30) : dans Réglages › Paramètres › « Vos objectifs »
  (`Settings.jsx`), `FormerGoalsNote` lit `goalsBefore` par `migrateGoals` (fonction pure, rien n'est écrit, que la
  migration du démarrage soit faite ou non) et affiche une ligne par ancien objectif retiré :
  - « Sport : vos séances comptent dans la famille Activité d’Objectifs. »
  - « Mon cycle : notez vos règles dans Ma journée › Règles. Confort digestif le remplace. »
  Rien pour une installation neuve ni pour les autres anciens objectifs (stress, soin de soi, tout mesurer). Confort
  digestif reste coché après l'ancien « Mon cycle » : voulu par la migration 5a (cycle = contexte de la digestion).
  Aucun réglage ni aucune donnée touchés.
- Tests écrits d'abord (`Settings.test.jsx` : migré sport + cycle → 2 lignes ; ancien sport non migré → 1 ligne ;
  neuf ou autres objectifs → aucune), rouges puis verts.
- Outil de captures : `--onboarding=former` (mise à jour d'un ancien « sport + cycle »).
- Note de Nouveautés `2026-11-19-1130-anciens-objectifs` (code partagé, Android et iPhone).

## iPhone
- Aucun correctif de `iphone/patches/` ne touche `Settings.jsx`, `Food.css` ni l'outil de captures ; le bouton
  « Règles » de Ma journée existe aussi sur iPhone. Parité : 70 % (inchangée).

## Vérifications
- `npm run test` : 4 099 verts ; `npm run build` vert ; ESLint propre sur les fichiers touchés.
- Capture relue : `--routes=/settings --onboarding=former` (deux lignes grises sous le texte de Confort digestif).

## Suite proposée
1. Merger cette PR après ses checks (build iPhone compris).
2. POLISH-SIM-110 à 113, puis 105i.

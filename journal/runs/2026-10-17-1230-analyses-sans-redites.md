# 2026-10-17 12:30 Paris (10:30 UTC) — Analyses et Connecteurs sans redites (D1)

**Type** : 🧹 D1  ·  **PR** : #195 « [Auto] Analyses et Connecteurs sans redites »

## Pourquoi
- Démarrage : main à `97feb21` (#194, release v152) ; « Tests », « Build & Release » et émulateur A56 verts. Aucune
  PR « [Auto] » ouverte (#51 `cursor/*` non touchée). Aucun nouveau journal dans `journal/diagnostics/`. 12:30 Paris
  = run de code.
- D1 en tête ; le reste prévu : « relire Connecteurs et Analyses ». Captures lues avant : `recommendations-1..3`,
  `connectors-1`.

## Ce qui a été fait
- `pages/Recommendations.jsx` : `CorrelationsSection` reçoit les pistes (`levers`) et n'affiche plus leurs variables
  (même r déjà donné dans la carte de la piste) ; titre « Autres liens avec votre bien-être » quand des pistes existent,
  « Aucun autre lien net » le cas échéant ; section masquée s'il ne reste rien.
- `devices/healthApps.js` : `adviseDevices` rend `message: null` pour le statut `ok` ; `MyDevices` n'affiche la phrase
  que si elle existe.
- Tests écrits avant le code (vus rouges) : Recommendations (piste non répétée, section masquée), MyDevices (« Envoie
  ses données » absent sous « Reçu »).

### Retiré et pourquoi
| Retiré | Pourquoi |
|---|---|
| Barres « Durée de sommeil » / « Pas quotidiens » (démo) dans les corrélations quand elles sont déjà des pistes | même r affiché deux fois sur la page |
| « Envoie ses données » sous le badge « Reçu » | redit le badge |

### Données
- Aucune : affichage seul.

## Vérifications
- `npm run test` : **1335 tests verts** (102 fichiers). Lint : **6 erreurs** (inchangé). Build ✅.
- `npm run visual` (toutes pages) ✅ et `--empty --routes=/recommendations,/connectors` ✅. Captures regardées :
  `recommendations-3` (« Autres liens » : VFC +0,51, calories +0,35 ; sommeil et pas plus répétés),
  `connectors-1` (Gadgetbridge : badge « Reçu » puis directement « Dernières mesures… »).

## Suite
- D1 : onglet Analyses avancée (note de méthode : deux paragraphes redondants, à fusionner) ; carte Météo (« Mettre à
  jour » utile alors que c'est automatique ?) ; tuile « Repas » unique.
- D4 : I100 ① (moteur LiteRT) ; D6 : I97 ② (sens personnel du radar) ; D2 : `WellbeingCharts` par agrégats.

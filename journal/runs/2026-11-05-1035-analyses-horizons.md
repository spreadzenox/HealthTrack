# 05/11 10:35 — Analyses rangées par horizon d'effet (ANALYSES-ONGLETS-3, première partie)

Type : 🎨 run de code (10:35 Paris). Priorité : retours du 04/11, point (4) (Analyses à refaire, trois horizons).

## Constat au démarrage
- main vert (`b01533e`, v507 ; « Play — Alpha » réussi). PR #716 (bilan du run précédent) ouverte depuis 10 min, checks
  en cours : pas touché à ses fichiers ; elle a été mergée pendant le run, branche remise à jour dessus.

## Fait (branche `claude/auto-analyses-horizons`)
- `services/horizons.js` : `HORIZONS` (heures, jours, semaines : titre et une ligne d'explication), `gutLinkHorizon`
  (fenêtre repas → ventre finie avant 24 h = heures ; 24–48 h, jour même et veille = jours), `groupByHorizon` (groupes
  non vides, ordre des pistes gardé). Rien n'est recalculé.
- `components/Horizon.jsx` : `HorizonHeading` (filet lilas, titre, ligne) et `WeeksHorizon` (« Sur quelques
  semaines » → « Voir vos tendances › »). CSS chargée d'emblée via `pageStyles.js` (garde `bundleGuard`).
- Onglet Ventre : les pistes repas → ventre sont rangées sous « Dans les heures » puis « Sur quelques jours » ; lien
  vers Tendances en bas, même trop tôt.
- Onglet Bien-être : « Sur quelques jours » au-dessus des pistes et liens (tous comparent le jour même ou 1 à 3 jours
  de délai, `LAGS`) ; pas de titre « Dans les heures » vide ; lien vers Tendances en bas (aussi en attente de données).
- Reste d'ANALYSES-ONGLETS-3 : « Pistes à tester » et « Liens repérés » expliqués (ce qui les distingue, en une ligne
  chacun), et pistes de bien-être à l'échelle des heures quand le visage aura assez de lectures (pas encore calculé).

## Vérifications
- TDD : 4 tests `horizons.test.js`, 2 tests `GutLinks.test.jsx`, 2 tests `Recommendations.test.jsx`.
  `npm run test` vert (après la garde CSS), lint 0 erreur, build OK.
- Captures relues : `/recommendations` et `/recommendations/ventre` (démo `--gut-links`, clair et sombre ; vierge) :
  titres lisibles, filet lilas contrasté sur les deux thèmes, rien de vide. `npm run visual` complet : 17 pages ok (seul avertissement : cible « Clé API Gemini » de la sideload, déjà connu).

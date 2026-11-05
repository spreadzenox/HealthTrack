# 05/11 01:35 — Analyses rangées en sous-onglets (ANALYSES-ONGLETS-1, retour (4) du 04/11)

Type : 🎨 run de code (01:35 Paris).

## Constat au démarrage
- main vert (`8c5b80b`, #702) : Tests, émulateur Galaxy A56, « Play — Alpha » réussis. Aucune PR « [Auto] » ouverte
  (seule #51, cursor/*, non touchée). Aucun autre run en cours.
- Étapes précédentes du 04/11 faites (CD-ALPHA-1, AVIS-RELAIS-1 à 3, VENTRE-BE-1). AVIS-RELAIS-3b attend des avis
  (0 au dernier bilan) : on passe au retour (4).

## Fait
- `components/AnalysesTabs.jsx` : pastilles Bien-être (`/recommendations`), Ventre (`/recommendations/ventre`),
  FODMAP (`/reintroduction`), Tendances (`/tendances`) ; Ventre et FODMAP seulement si `gutCardMode() !== 'hide'`
  (POL-4 : rien d'effacé). Même style que les sous-onglets du Journal.
- `JournalTabs` : Tendances retirée (Jours, Repas, Nutrition). `TabBar` : `/tendances` passe sous Analyses.
- `Recommendations.jsx` : prop `view` ; `GutView` (intro « Ce qui va avec vos jours de gêne ou de douleur… », pistes
  repas → ventre, « Tester un groupe FODMAP », « Bientôt » du ventre avec `0/28 jours` sans note, rapport PDF dès une
  note ; renvoi vers Paramètres → « Ce qui vous amène » si le ventre n'est pas suivi). La vue Bien-être n'affiche plus
  rien du ventre (code mort retiré d'`AnalysisView`). Même analyse et même cache pour les deux onglets.
- `Reintroduction.jsx` : les sous-onglets remplacent « ← Analyses ». `Trends.jsx` : sous-onglets d'Analyses.
- Carte « N pistes repérées » de l'Accueil : ouvre `/recommendations/ventre` quand la piste annoncée porte sur le ventre.
- `visual-check.mjs` : capture `/recommendations/ventre` par défaut.
- Nouveautés : `2026-11-05-0135-analyses-onglets.json`.

## Vérifications
- Tests ajoutés ou adaptés (TDD) : `AnalysesTabs.test.jsx` (6), `Recommendations.test.jsx` (4 nouveaux, gut en
  `view: 'gut'`), `JournalTabs`, `TabBar`, `Trends`, `TodayCards`.
- `npm run test` : 3 052 verts (puis `kind` des Nouveautés corrigé en « amélioration » après un échec du check Vitest de la PR : `WhatsNew.test.jsx` n’avait pas été relancé après l’ajout de la note) ; `npm run build` OK ; `npm run lint` : 0 erreur (comme avant).
- Captures lues : Bien-être, Ventre, FODMAP, Tendances (démo, `--gut-links`) ; Ventre et Tendances en sombre à
  360×780 (les 4 pastilles tiennent) ; Bien-être et Ventre sur données vierges.

## Constat à corriger (suite)
- Onglet Bien-être sur données vierges : la carte lilas compte « jours avec un repas ou une note du ventre »
  (inchangé depuis avant, mais mélange ventre / bien-être) → ANALYSES-ONGLETS-2.

## Suite
- ANALYSES-ONGLETS-2 (compte à rebours par onglet, intro Ventre en pêche), puis trois horizons.
- AVIS-RELAIS-3b dès qu'un avis arrive ; P46 au propriétaire.

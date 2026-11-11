# Run 11/11 22:35 — Le compteur de la digestion dit ce qu'il compte (POLISH-SIM-32)

**Type** : code (mode polish).

## Contexte
- Main 13532ac (#921) : Build & Release, Tests, Play — AAB et émulateur A56 verts.
- PR #922 (run de 20:35, POLISH-SIM-37c, `GuidedTour`) ouverte depuis moins de 90 min, checks émulateur encore en
  cours : pas touchée ; tâche indépendante prise (autres fichiers).

## Constat (POLISH-SIM-32, « 9/28 jours » à J45 : quelle fenêtre ?)
- Analyses compte tous les jours notés depuis le début (`daysHave`, limite de lecture 1000 notes), d'affilée ou non.
- Aujourd'hui (`DigestBlock`) ne lisait que les 42 derniers jours : au-delà, les deux écrans pouvaient diverger.
- Le « 9/28 » des personas au 45e jour venait de l'outil : la démo n'a des notes digestives que sur ses 10 derniers jours.

## Fait
- PR #922 (run de 20:35, POLISH-SIM-37c) : tous ses checks verts, à jour sur main, non mergée par son run : mergée
  (squash, 7c17b33) ; ma branche rebasée dessus (conflits du journal seulement).
- `services/gutNotes.js` : `readGutNotes` lit toutes les notes digestives avec la limite d'Analyses ; `DigestBlock` s'en sert.
- Compteur, Aujourd'hui et Analyses : « 9/28 jours notés, pas forcément d'affilée » (répond aussi à « il faut noter
  tous les jours, pourquoi ? » de la persona Endométriose).
- Outil personas : objectif ventre et profil `full` = une note digestive chaque soir sur toute la période (jours de la
  démo gardés ; niveaux fixés par le rang du jour).
- Tests rouges puis verts : `DigestBlock.test.jsx` (note d'il y a 60 jours lue ; texte), `Recommendations.test.jsx`,
  `personaData.test.mjs`.

## Vérifs
- `npm run test` (3451 verts), `npm run lint` (0, une erreur react-refresh corrigée en sortant la lecture du composant),
  `npm run build`, `npm run visual` complet (18 pages ok ; cible < 44 px de Paramètres et message console de Sources
  déjà là avant).
- Captures lues : [clair](captures/2026-11-11-2235-compteur-digestion-clair.png) ·
  [sombre](captures/2026-11-11-2235-compteur-digestion-sombre.png).

## Suite
- POLISH-SIM-39, 31, 34 ; PROP-SIM-11, 12, 13 (maquettes) ; CYCLE-3 attend P48.

# Run du 18/11 22:30 — noms de la nouvelle navigation (restes de REFONTE-2)

**Type** : 🛠️ code (polish, textes) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main bb7117d.

## État de départ
- main vert (Tests, fiche App Store, « App Store — préparer la soumission » ; émulateur de bb7117d en cours).
- PR « [Auto] » #1108 (journal du run de 21:30, relevé de la version App Store) ouverte depuis 10 min, checks
  émulateur en cours : laissée à son run (règle 0 du déroulé), aucun fichier commun touché avant son merge.
- Build iPhone du soir (cron 21:20 Paris) **pas encore partie à 22:30** : le cron de GitHub part en retard (nouvelle
  programmation de CI-ECO, ajoutée à 18:18). À vérifier au run suivant, avant l'Alpha de 23:45.

## Ce qui a été fait
- Restes de **REFONTE-2** (noms d'avant la refonte encore visibles) :
  - Réglages › Sauvegarde : le titre de la page disait « Vos données » ; il dit « Sauvegarde », comme la ligne de
    Réglages (`app/src/pages/Data.jsx`).
  - Cartes Météo, Temps d'écran et Régularité du sommeil (Réglages › Sources) : « Vos Analyses … » devient
    « L'onglet Objectifs … » (l'onglet Analyses n'existe plus depuis REFONTE-2).
  - iPhone, même PR : correctifs 06 (contexte du titre) et 34 (phrase du temps d'écran) refaits ; `upstream.sh` :
    52 correctifs appliqués, textes vérifiés dans le code embarqué.
- Note de Nouveautés `2026-11-18-2230-sauvegarde-titre.json` (les deux magasins).

## Vérifications
- Voir la PR : tests, build, lint, captures de Réglages › Sauvegarde et de Sources.

## État
- TestFlight : 1148.1148 chez « Testeurs Halcya » (pas de nouvelle build ce soir à 22:30). Parité : 70 % (pas de
  recompte : même code des deux côtés). Testeurs Play : 4 inscrits sur 12 (pas de nouveau relevé).

## Suite proposée
1. Build iPhone du soir, TestFlight, puis soumission bêta et expiration après l'Alpha de 23:45.
2. Le 21/11 ou le 22/11 : `--preparer --build <N>` avec la build de la refonte validée, puis « 👉 PI2 prête ».
3. Autres restes de REFONTE-2 : la visite guidée ne passe pas par Ma journée ; `/ma-journee` absente des captures de
   la fiche Play.

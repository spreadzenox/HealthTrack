# Run du 07/11 17:15 → (en cours) — chantier du soir, session « interface »

**Déclencheur** : demande du propriétaire du 07/11 vers 17:15 (« tout ce qu'on a vu mis en place sur Android et sur
iOS avant ce soir minuit »). Session « interface » (tout ce qui se voit) ; la session « méthode » livre en parallèle
TS-1, ORG-5a à 5d et les contributions du jour.

## Livré (une étape = une PR « [Auto] »)
| Étape | PR | État |
|---|---|---|
| Journal : ORG-1b, ORG-3c, ORG-8, TS-1, TS-2 au BACKLOG ; décision « chantier du soir » en tête de POUR-IOS.md | #784 | mergée |
| AUJ-7 « ventre » → « digestion » partout (app, notification du soir, pages légales, fiche du Store) + test | #785 | mergée (v561) |
| AUJ-8 une couleur par thème (bleu nuit, rose framboise, gris ajoutés ; `data-tone`) | #788 | mergée |
| AUJ-2b calibration : « Remplir maintenant » / « Recevoir un rappel » | #789 | mergée |
| AUJ-3 (+ précision) « Vos données du jour » en un bloc, écart à votre norme | #791 | mergée |
| AUJ-4 bloc digestif | #793 | mergée |
| AUJ-5 Mes repas du jour, AUJ-6 « + », AUJ-1b selles dans le bandeau, AUJ-4b apports | #794, #796, #798 → #800 | pile mergée par #800 (les PR intermédiaires, en conflit après les squashs, sont fermées) |
| ORG-1 et ORG-1b onglet Agir | (ce run) | PR ouverte |

## Vérifications
Chaque étape : tests Vitest (3 270 → 3 336), lint 0 erreur, `npm run visual` sur les pages touchées (clair, sombre,
vierge), checks « Frontend (Vitest) » et « Build APK » verts avant merge. Après le merge d'AUJ-3, main avait reçu
TS-1 entre-temps : suite complète relancée sur main, verte.

## Points d'attention
- « Play — AAB » du commit d'AUJ-7 a été annulé par la file `play-edits` (fiche du Store et abonnements envoyés en
  même temps) : la version suivante de main repart en test interne normalement. La fiche « Halcya — digestion &
  bien-être » est partie (workflow « Play — fiche du Store » vert).
- Un push forcé a été refusé par le garde-fou de la session : les branches sont désormais mises à jour par fusion de
  main, jamais réécrites.
- Bandeau d'ajout : avec la cigarette et les selles (6 gestes), il défile horizontalement ; « Autre chose » est alors
  hors de l'écran au départ.

## Suite
ORG-2, ORG-3 / 3b / 3c (Tendances, sur TS-1 déjà mergé), AUJ-9, ORG-4, ORG-8, ORG-6 et « Ce qui a pu peser ce
jour-là » (contrat `analysisResults`, contributions du jour mergées).

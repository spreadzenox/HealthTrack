# Run du 07/11 17:15 → 21:00 — chantier du soir, session « interface »

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
| ORG-1 et ORG-1b onglet Agir | #803 | mergée |
| ORG-3, ORG-3b, ORG-3c, AUJ-9 Tendances dans le Journal | #806 (remplace #805) | mergée |
| ORG-4, ORG-6 Analyses sur le contrat | #807 | mergée |
| ORG-2, AUJ-3b Journal › Jours | #808 | mergée |
| ORG-8 essais et habitudes, rapport PDF | #809 | mergée |
| Correctif budget de lectures + TS-2 (repères) | #813 (remplace #810) | mergée |
| TESTEUR-5a-2 Health Connect sans montre | #811 | mergée |
| TS-2 côté Agir (essai traversé) | #814 | voir la PR |

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

- Le contrôle « Budget de lectures (perf) » ne faisait pas partie des checks attendus avant merge : il a été rouge sur
  main de #806 à #809, corrigé par #813. Leçon : attendre aussi ce check quand une page lit le worker.
- La session méthode mergeait toutes les 20 minutes : les branches étaient remises à jour par fusion de main, la suite
  complète relancée en local, puis mergées.

## Suite
`normStart` (norme des écarts après un changement durable) et la valeur du jour de l'Accueil sur TS-1, en vérifiant le
budget de lectures de l'Accueil ; TESTEUR-5a-3 ; nettoyage du code mort (anciens composants d'Analyses : `GutLinks`,
`Horizon`, `GutWeeks`, `SoonList`, `ReintroductionEntry`, `PistesTeaser`, `FormeSection` sur Tendances).

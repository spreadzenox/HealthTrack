# Run 10/11 18:55 — Relais iOS : cycle accepté

**Type** : relais court (réponse du propriétaire du 10/11 vers 18:50), sans code.

## Fait
- Décision « Ok cycle » écrite mot pour mot en tête de `journal/POUR-IOS.md` (ligne 10/11 18:55) : exception au
  mode polish ; Android fait d'abord la brique partagée (stockage IndexedDB du cycle avec migration rétrocompatible,
  ligne du Journal, jour du cycle, export/import JSON), la saisie manuelle et la lecture Health Connect, invisibles
  tant que « Mon cycle » n'est pas coché et sans donnée ; iOS ensuite le lecteur natif de Santé.
- Une ligne dans le tableau du résumé de la semaine.

## Non fait (volontairement)
- Aucun fichier de `app/` touché (un run horaire travaille peut-être en parallèle). Les étapes CYCLE-* du BACKLOG
  restent à inscrire et à réaliser par les runs horaires.

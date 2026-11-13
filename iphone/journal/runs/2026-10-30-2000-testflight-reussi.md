# 2026-10-30 20:00 UTC — Halcya sur TestFlight (616.97) ; Nouveautés de l'iPhone ; Android v617

**Étape** : I9 (TestFlight), suivi d'Android  ·  **PR** : #96 (mergée), #97  ·  **Android suivi** : v617  ·  **iOS** : 616 sur `main` et sur TestFlight, 617 en PR  ·  **Parité** : 49 % (23/47)

## Messages du propriétaire depuis le run précédent
- Aucun nouveau depuis 18:55 UTC (dernières demandes : guide A6 et décisions, toujours attendues).

## Ce qui a été fait
- **Merge de #96** (à 20:24) : CI verte sur `d6b3603` (50 min) ; 112 captures, 0 erreur JavaScript, aucun texte
  propre à Android ; sur les deux iPhone : synchro Santé (la build de captures écrit toujours ses pas de démonstration
  avec sa propre phrase), Journal, notification, import, export. Squash-merge → `4d54df1`.
- **Deuxième envoi TestFlight réussi** (run 41122984483, lancé sur `main`) : version 616, build 616.97 ; archive,
  export signé par le certificat de distribution géré par Apple, entitlements de l'app signée relus
  (`application-identifier` 67R69L355R.fr.jpesquet.sante, HealthKit, `beta-reports-active`, `get-task-allow` faux),
  phrase « n'écrit rien » vérifiée, puis « Upload succeeded ». Traitement par Apple ensuite (10 à 30 min).
- **Nouveautés de l'iPhone** (PR #97) : `APPSTORE_CHANGELOG_SINCE` avancé au premier TestFlight (2026-10-30-2100)
  et première note propre à l'iPhone, « Halcya arrive sur iPhone » (`overlay/app/src/data/changelog/`,
  `"variants": ["appstore"]`) ; le test d'Android des Nouveautés n'admettait que `play` et `sideload` :
  **correctif 33** (variante `appstore` admise). L'entrée d'`APPSTORE_HIDDEN` pour la note du sommeil devient sans
  effet (Android l'a réservée lui-même), de même que les autres entrées antérieures à la nouvelle date de départ.
- **Android v617** (#533) : repas, un aliment par ligne et quantité à droite : code partagé, vrai sur iPhone, note
  vraie (mais antérieure au départ des Nouveautés de l'iPhone) ; Android a repris la demande iOS sur la note du
  sommeil (`DEMANDES.md` à jour). 33 correctifs ; suite d'Android : 2930 passés ; build appstore faite.

## Suite
- CI de #97, captures de Nouveautés (une seule note, « Halcya arrive sur iPhone ») ; puis merger.
- Propriétaire : A6 (inviter sa compagne, groupe de test interne quand la build apparaît dans TestFlight), puis
  retour de l'iPhone 12 (installation, Santé, caméra, notifications). Ensuite, envoi TestFlight à chaque version.

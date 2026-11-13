# 2026-11-06 07:00 UTC — en attente de GitHub (compte bloqué pour la facturation)

**Étape** : suivi d'Android  ·  **PR** : journal  ·  **Android suivi** : v830 (`1e39212`)  ·  **iOS** : 828 sur
TestFlight (828.321) ; 830 mergée, pas construite ; version 717 dans App Store Connect, build 717.216 attachée  ·
**Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf (dernière décision : 05/11 vers 23:00). Pas encore de réponse au message urgent
  de 07:40 (facturation GitHub).

## Fin du run précédent
- #323 (v830) et #324 (message urgent) mergées. #325 (captures iPhone 6,9" refaites, `captures.md`) ouverte : son
  contrôle ne peut pas démarrer.

## Blocage GitHub
- Essai à 07:00 UTC : « Re-run failed jobs » du contrôle de la fiche (#325, Ubuntu) → toujours « The job was not
  started because your account is locked due to a billing issue ». C'était la seule relance ; la suivante attendra la
  réponse du propriétaire.
- Côté Android, même compte : ses « Tests » et l'émulateur échouent depuis 06:40 UTC ; aucun commit sur son `main`
  depuis `1e39212` (v830), donc rien à suivre.

## Ce qui a été fait
- README (ligne de 08:00) ; ce compte rendu.

## Suite
- Dès « facturation GitHub réglée » : relancer TestFlight 830 (run 42175104845), build et modèles du visage de
  `462dd97`, le contrôle de #325 puis le merger ; `store-push.yml` avec « captures » ; captures iPad 13" ; reprendre le
  suivi d'Android.
- Fin de journée : build finale (renommage + `attacher_build`) si GitHub repart ; sinon le secours à la main de
  `POUR-ORCHESTRATEUR.md` (828.321).

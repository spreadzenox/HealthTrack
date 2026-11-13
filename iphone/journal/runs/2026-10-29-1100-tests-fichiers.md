# 2026-10-29 11:00 UTC — iPhone à v583 comme Android ; tests de Fichiers plus robustes

**Étape** : suivi d'Android, tests  ·  **PR** : #59 (mergée), #60  ·  **Android suivi** : v583 (#500, v584, pas encore envoyée sur Google Play)  ·  **iOS** : 583 sur `main`  ·  **Parité** : 49 % (23/47)

## Messages du propriétaire depuis le run précédent
- Aucun. A1 reste en cours.

## Ce qui a été fait
- **Merge de #59** : CI verte sur `fcc80bd` (94 captures, 0 erreur JavaScript, tests d'interface construits,
  achat d'essai réussi, `[healthkit] base` correct). Captures Repas et Analyses regardées (v583). Branche à jour sur
  `main` (`df97c5d`), squash-merge → `34a89d0`. iOS = v583 = Android.
- **Échec isolé sur l'iPhone 16e** : le test d'import par Fichiers a touché le fichier, mais l'aperçu de l'import
  n'est jamais venu (30 s) ; le sélecteur, resté ouvert, a fait échouer l'export et le rapport derrière lui (la
  hiérarchie de l'export montre encore le dossier Halcya du sélecteur). Les trois tests ont réussi sur l'iPhone
  17 Pro, et sur les deux iPhone dans les CI de #53 à #58 : pas de cause trouvée côté app. **#60** : en cas d'échec,
  le test d'import referme le sélecteur (« Annuler »), et les tests d'export et du rapport ferment au départ un
  sélecteur resté ouvert ; l'échec reste visible, sans entraîner les autres. Vu dans la hiérarchie au moment de
  l'échec : sélecteur ouvert dans le dossier Halcya, fichier affiché (grille) : le toucher a dû tomber pendant
  l'animation du dossier ; le test retouche le fichier s'il est encore là 5 s après.

## Suite
- CI de #60 ; si l'import échoue encore sur le 16e, regarder le moment où le fichier est touché (le sélecteur
  peut-il être encore en train d'indexer le fichier que la sonde vient d'écrire ?).
- v584 dès sa sortie.

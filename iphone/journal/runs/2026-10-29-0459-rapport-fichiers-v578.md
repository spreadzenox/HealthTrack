# 2026-10-29 04:59 UTC — Test du rapport PDF corrigé, note d'Android cachée sur iPhone ; Android v578

**Étape** : I2 (parité), suivi d'Android  ·  **PR** : #52 (mergée), puis #53  ·  **Android suivi** : v578  ·  **iOS** : 577 sur `main`, 578 en PR  ·  **Parité** : 38 % (18/47)

## Messages du propriétaire depuis le run précédent
- Aucun. A1 reste en cours.

## Merge de #52
- CI verte (84 captures, 0 erreur JavaScript ; sondes correctes). Captures regardées : Nouveautés (les notes du
  29/10, « Version installée : 577 »), Tendances. Branche à jour sur `main` (`9e0674a`), squash-merge → `e5566ec`.
- Rapport PDF, test d'interface : **réussi sur l'iPhone 17 Pro** (feuille dépliée, « Enregistrer dans Fichiers »,
  « Enregistrer », feuille fermée, message de la carte affiché) mais la sonde ne compte qu'un PDF : l'étape
  « Halcya » a pris le fichier « Halcya-rapport-… » pour le dossier, et l'enregistrement a remplacé le PDF au lieu
  d'en ajouter une copie. **Échec sur l'iPhone 16e** : le glissement sur « Copier » a valu un toucher (copie, feuille
  fermée, message affiché, aucun fichier ajouté).

## Ce qui a été fait
- Test d'interface corrigé : la feuille se tire vers le haut par son en-tête (« Document PDF · … »), plus par une
  action ; les étapes de dossier (`repertoire`) ignorent les fichiers (libellé ou identifiant avec une extension).
  Le test de l'export en profite aussi (le dossier Halcya contient des fichiers « Halcya-… »).
- **Android v578** (#494) : écran Premium du lancement en une phrase, « 1er déc. », dates insécables. Sur iPhone,
  l'écran Premium n'a pas de période de lancement : la note de Nouveautés y serait fausse → cachée par une liste
  `APPSTORE_HIDDEN` (correctif 28, testée) et demande à Android de la marquer. Nouvelle règle dans la charte (§6) :
  chaque note d'Android est relue pour l'iPhone. 28 correctifs s'appliquent directement ; suite d'Android : 2807
  passés ; builds appstore et captures faites.
- Onboarding (🟡) : seuls ses écrans 1 et 3 étaient capturés ; les autres écrans de l'iPhone (suivi, Santé quand une
  montre écrit dans Santé, visage, geste) s'ajoutent au parcours (`MORE_ONBOARDING`, `buildPlan` inchangé pour ses
  tests) ; poussé sur #53 quelques minutes après le début de sa CI.
- Repris de la branche `claude/ios-recherche-icloud` (run de 03:59) : recherche sur la directive 5.1.3 (ii)
  (`RECHERCHE.md`) et « Fichiers (export) » ✅ : parité 38 %.

## CI de #53 (premier passage, `ed85120`)
- Verte, mais **aucun test d'interface n'a tourné** : `test-interface-build.txt` : « cannot convert value of type
  'XCUICoordinate' to expected argument type 'XCUIElement' » (`press(forDuration:thenDragTo:)` d'un élément attend un
  élément). Conséquences : 70 captures au lieu de 84, sondes à zéro (export, rapport, import), visage
  `skip:screen_off`. Corrigé (glissement entre deux coordonnées) ; nouvelle étape finale de la build, rouge si les
  tests d'interface ne se construisent pas ; leçon dans la charte (§3). Captures de l'onboarding à revoir au
  prochain passage.

## Suite
- CI de #53 : sonde `[rapport]` « après » : 2 sur les deux iPhone, test d'interface réussi sur les deux ; captures
  des écrans d'onboarding à regarder (si justes, avec les feuilles Santé et notifications déjà essayées : Onboarding
  ✅) ; puis merger.
- La branche `claude/ios-recherche-icloud` (fondue ici) n'a pas pu être supprimée : `git push --delete` refusé
  (« the remote end hung up unexpectedly », trois fois) ; sans effet, à supprimer à la main si besoin.
- A8 fait → lancer « Site — GitHub Pages ».
- Ensuite (I2) : autres 🟡 vérifiables sur simulateur (onboarding, sources), puis I9.

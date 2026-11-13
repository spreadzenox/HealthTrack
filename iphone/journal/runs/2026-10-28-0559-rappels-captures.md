# 2026-10-28 05:59 UTC — Note du soir et rappel de portion vérifiés sur simulateur (PR #24 mergée), VFC SDNN dans « Mes appareils » (PR #25)

**Étape** : I5, I4  ·  **PR** : #24, #25  ·  **Android suivi** : v542 (inchangé)  ·  **iOS** : 542 (simulateur)  ·  **Parité** : 23 % (11/47)

## Déclenchement
- Tâche planifiée de 05:59 UTC, à l'heure. `main` vert (753d77e, #23 ; run 83). PR #24 : CI verte (run 86),
  70 captures, 0 erreur JavaScript. `scripts/upstream.sh --latest` : toujours v542, rien de neuf côté Android.

## Ce que les sondes de la PR #24 ont montré (run 86, deux iPhone)
- Bilan du ventre : « Gêne » toujours rangé sans ouvrir l'app (`count 1`).
- **Note du soir** : notification « Votre soirée ? » affichée (icône, titre, « 0 = très bas, 5 = très bien »),
  mais **dans le centre de notifications** : l'étape précédente (test du centre de notifications) le laissait ouvert,
  la notification y arrivait en liste au lieu d'une bannière, et l'appui long sur la liste ne la déplie pas (comme à
  la PR #21) → 0 action trouvée. Le nombre d'actions affichées reste donc inconnu.
- **Rappel de portion** : programmé par `schedule`, bannière touchée app en arrière-plan, l'app revient au premier
  plan, le toucher est retenu (`open: true`)… mais **la réintroduction ne s'ouvre pas** (page restée
  `/recommendations`) : iOS transmet le toucher après le retour au premier plan, quand `usePortionOpen` a déjà
  vérifié. Défaut réel propre à iOS (sur Android, le toucher est connu avant).

## Ce qui a été fait
- Rappel de portion : le natif signale le toucher à la page (`halcya-portion-open`, `PortionReminderPlugin.load`) ;
  `overlay/app/src/ios/portionOpen.js` (3 tests écrits d'abord) et **correctif 18** (`Layout.jsx`, 5 lignes) : la
  page refait la même vérification à ce signal. App lancée par le toucher : le drapeau reste, lu au montage (inchangé).
- Captures : test du centre de notifications retiré (il échoue toujours depuis que la réponse retire la
  notification, et laissait le centre ouvert pour l'étape suivante).
- Suite d'Android avec les 18 correctifs : 2678 ✅ (code de sortie 0) ; build web `appstore` ✅.

## Résultats (CI de la PR #24, run 87, deux iPhone ; 68 captures, 0 erreur JavaScript)
- **Note du soir : les 6 notes s'affichent** dans la notification dépliée (`actions visibles : 0 1 2 3 4 5 (6 sur 6)`,
  boutons en liste verticale) ; « 4 » touché, rangé sans ouvrir l'app (`[note] boîte {"count":1,"scores":[4]}`).
  Les sources non officielles (« 4 actions au plus ») ne valent plus : rien à changer côté présentation.
- **Rappel de portion : la réintroduction s'ouvre** au toucher, app en arrière-plan (`{"page":"/reintroduction",
  "open":false}`, capture regardée).
- Bilan du ventre : toujours rangé (`count 1`).
- **PR #24 mergée** (5337325).
- PR #25 : VFC SDNN comptée dans « qui envoie quoi » (« Mes appareils ») sous « VFC (SDNN) », **correctif 19**
  (`healthApps.js`, 1 ligne), sans drapeau « montre » (sinon une montre Android la réclamerait : deux tests
  d'Android l'ont signalé) ; test `overlay` écrit d'abord. Suite : 2680 ✅ (code de sortie 0) ; build `appstore` ✅.
- PR #25, suite (I5) : les sondes du ventre et de la note du soir lancent ensuite l'import de l'app
  (`importPendingGutEvenings`, `importPendingEveningNotes`, comme à l'ouverture suivante) et relèvent
  `[… ] import {imported, inserted, …, left}` : la réponse doit entrer dans l'historique et la boîte se vider. Tests
  des sondes mis à jour d'abord.
- Leçon : un correctif se régénère par `git diff HEAD` (depuis le code d'Android) quand aucun autre ne touche le
  fichier, jamais par rapport à sa propre version appliquée.

## À savoir
- Le réglage de la note du soir est dans la carte bien-être de l'Accueil (`WellbeingPrompt`), celui du rappel de
  portion dans la page Réintroduction : rien de neuf dans Paramètres (captures regardées).

## Suite
- Merger #25 après sa CI.
- Préparé et poussé sans PR (branche `claude/ios-i4-norme-sdnn`, empilée sur #25, pas de CI tant que #25 n'est pas
  mergée) : **norme personnelle de la VFC SDNN** sur iPhone — `src/ios/sdnnBaseline.js` (même méthode que la VFC
  d'Android, échelle log, seulement dans la variante appstore : les tests d'Android ne la voient pas) et
  **correctif 20** (`BaselineCards.jsx`, 4 lignes) ; 4 tests écrits d'abord (dont un rendu de la carte
  « VFC (SDNN) ») ; suite : 2684 ✅ ; build `appstore` ✅. À ouvrir en PR au prochain run, après #25. Radar ensuite.
- I5 : lire `[notification] import` et `[note] import` dans les captures de #25 (attendu `inserted 1`, `left 0`) ;
  si c'est le cas, bilan du ventre, note du soir et rappel de portion passent ✅ dans `PARITE.md` (vérifiés sur
  iPhone simulé, gestes à refaire sur l'iPhone 12). Rappel de fin d'essai avec I6 (il dépend de la facturation).

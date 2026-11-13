# 2026-10-27 21:59 UTC — Pas relus par le connecteur (PR #15), guide des montres capturé (PR #14)

**Étape** : I4 (vérification de l'import, textes Santé)  ·  **PR** : #13, #14, #15 (ouvertes en début de run)  ·  **Android suivi** : v527  ·  **iOS** : 527 (simulateur)  ·  **Parité** : 23 % (11/47)

## Déclenchement
- Tâche planifiée de 21:59 UTC, à l'heure. `main` vert (f91cb0f, PR #12) ; trois PR de la routine ouvertes : à
  finir d'abord.

## Ce qu'Android a livré depuis le run précédent
- Rien depuis #443 (journal seul) : v527 reste la dernière build Play réussie.

## État des PR au début du run et ce qui a été fait
- **PR #15** (pas relus par le connecteur) : CI lancée à la main au run précédent (le dernier commit, journal seul,
  portait `[skip ci]` : aucune CI de PR). Captures sur `captures/claude/ios-i4-import-connecteur` :
  - iPhone 16e : feuille acceptée, 1234 pas écrits, relus, puis **relus par le connecteur de l'app** :
    `connecteur {"synced":1,"errors":[],"pas":[{"value":1234,"source":"Halcya"}]}` ;
  - iPhone 17 Pro : le toucher sur « Tout activer » s'est perdu (feuille encore en animation), « Autoriser » est
    resté grisé, feuille ouverte (capture `healthkit-apres`) ; à la PR #12, les deux iPhone étaient passés.
  - Correction : le test retouche « Tout activer » tant qu'« Autoriser » reste grisé (3 fois au plus, 5 s chacune),
    seulement si le libellé est encore là. Poussée → CI.
- **PR #13** (« App Santé ») : CI verte après la correction du test (rejet non rattrapé du run précédent) ; branche
  remise sur `main` (PR #12) → CI.
- **PR #14** (guide des montres) : Vitest rouge sur `UpdateBanner.test.jsx` (test d'Android de la mise à jour hors
  store, sans rapport avec le diff ; même échec ponctuel qu'en local au run précédent) ; la suite repasse deux fois
  en local (code de sortie 0). Demande notée dans `DEMANDES.md` (minuteurs simulés pour ce test). Les captures ne
  montraient pas le guide, replié sous « Ajouter une source » : le mode captures sait maintenant **ouvrir un volet
  avant la capture** (`REVEALS` : bouton touché par son texte, `<details>` ouvert, élément amené en haut) →
  `demo-clair-connectors-guides`, guide Garmin ouvert. Tests écrits d'abord. Branche remise sur `main` → CI.
- Remarque sur les captures : une bannière système du simulateur (« Prêt pour Apple Intelligence ») couvre parfois
  le haut d'une capture ; sans effet sur l'app.

## Merges
- **PR #14 mergée** (1e8f772) : CI verte sur la branche remise sur `main`, 52 captures, 0 erreur JavaScript ; guide
  des montres capturé et regardé (Garmin ouvert, liste des marques) ; feuille Santé acceptée sur les deux iPhone
  (le toucher perdu de la PR #15 ne s'est pas reproduit ici).
- PR #13 et #15 remises sur `main` (PR #14) aussitôt, suite repassée (2645 et 2643 ✅, code de sortie 0) → CI ; merge
  au run suivant si elles ne finissent pas avant la fin de celui-ci.

## Vérifications
- Suite d'Android avec les correctifs, code de sortie vérifié à chaque fois : PR #13 2641 ✅, PR #14 2642 ✅,
  PR #15 2639 ✅ (44 ignorés) · build web `appstore` ✅.

## Apprentissages / décisions
- Ne jamais pousser un commit `[skip ci]` en tête d'une branche dont le code n'a pas encore eu sa CI : la PR
  n'aurait aucun check (PR #15). Journal seul : seulement après une CI de code, ou dans le même commit que le code.
- Plusieurs PR ouvertes en même temps coûtent un cycle de CI de plus chacune (remise sur `main` avant chaque merge,
  25 min) : une seule PR de code à la fois quand c'est possible.
- VFC en SDNN : `analysisEngine.js` et `dailyAggregates.js` testent chaque sous-catégorie de `heart_rate` ; seul
  `dailyJournal.js` range une sous-catégorie inconnue dans la fréquence cardiaque → plan dans `BACKLOG.md`.

## Suite
- Merger les PR vertes l'une après l'autre (remise sur `main` entre deux), puis montrer les pas importés dans le
  Journal, puis la VFC en SDNN.

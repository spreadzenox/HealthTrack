# 2026-10-28 00:59 UTC — Android v533 (PR #19), plugin du bilan du ventre du soir en Swift (PR #20)

**Étape** : suivi d'Android, I5 (2e partie)  ·  **PR** : #19, #20  ·  **Android suivi** : v533  ·  **iOS** : 533 (simulateur)  ·  **Parité** : 23 % (11/47)

## Déclenchement
- Tâche planifiée de 00:59 UTC, à l'heure. `main` : PR #18 mergée à 00:56 (sa CI de `main` en cours) ; aucune PR ouverte.

## Ce qu'Android a livré depuis le run précédent (v531 → v533)
- #448 répare les tests `UpdateBanner` et Réintroduction : **les deux demandes de `DEMANDES.md` reprises**, avec la même
  correction de l'horloge que le correctif 18 d'iOS, qui ne s'appliquait plus (`scripts/upstream.sh --latest` l'a
  signalé) → retiré.
- #447 textes plus clairs (stress de la montre en mots dans le Journal, Analyses, Paramètres) : code web partagé ; le
  correctif 17 de `journalChips.js` s'applique toujours.

## Ce qui a été fait
- PR #19 : `upstream.json` → v533, correctif 18 retiré, demandes marquées « reprises ».
- PR #20 (I5, 2e partie) : plugin `GutEvening` en Swift, mêmes méthodes qu'Android ; le code partagé ne change pas
  (`missingOnIos` le laisse passer dès qu'il est enregistré) :
  - `HalcyaRules` › `GutEveningStore` (état reçu, boîte des bilans bornée à 60, soirs à programmer), 6 tests XCTest ;
  - `GutEveningPlugin.swift` : 7 soirs programmés d'avance, notification discrète, Calme / Gêne / Douleur sans ouvrir
    l'app ; `HalcyaNotificationHandler` reçoit le geste avant ou après le chargement de Capacitor (délégué posé par
    `AppDelegate`, puis relais du `NotificationRouter` de Capacitor, lu dans ses sources 8.2.0) ;
  - `HalcyaBridgeViewController` (désigné par `Main.storyboard`) enregistre le plugin ; paquet lié au projet Xcode.

## Vérifications
- Suite d'Android avec les correctifs (code de sortie vérifié) : v533 + 17 correctifs 2653 ✅ ; PR #20 2649 ✅.
- PR #20, 1re CI : `swift test` ✅, build Xcode de l'app avec le plugin ✅ du premier coup.

## Résultats de la CI et merges
- **PR #19 mergée** (620d45d) : CI verte, 52 captures, 0 erreur JavaScript ; « Stress montre 37 · normal » dans le
  Journal (v533).
- PR #20, 1re CI (sur l'ancienne base) : `swift test` ✅, build ✅, 52 captures, 0 erreur JavaScript, aucun plantage ;
  le code partagé appelle le plugin natif (`GutEvening list`, `configure` dans la console) et **Paramètres montre
  maintenant le réglage « Bilan du ventre le soir, d'un geste depuis une notification » sur iPhone**. Branche
  remise sur `main` (PR #19) → CI ; merge au run suivant.

## Suite
- Merger #19 puis #20 (remise sur `main`), captures de Paramètres regardées (réglage « Bilan du ventre le soir »).
- Capturer la notification et le geste sur simulateur (autorisation des notifications acceptée par le test
  d'interface, notification déclenchée à la demande par le mode captures) ; puis `EveningNote` et `PortionReminder`.

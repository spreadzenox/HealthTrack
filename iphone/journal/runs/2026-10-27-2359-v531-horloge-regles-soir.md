# 2026-10-27 23:59 UTC — Android v531, test d'Android daté réparé (PR #17), règles du soir en Swift (PR #18)

**Étape** : suivi d'Android, I5 (1re partie)  ·  **PR** : #17, #18  ·  **Android suivi** : v531  ·  **iOS** : 531 (simulateur)  ·  **Parité** : 23 % (11/47)

## Déclenchement
- Tâche planifiée de 23:59 UTC, à l'heure. `main` vert (4d319cd, PR #16) ; aucune PR ouverte.

## Ce qu'Android a livré depuis le run précédent (v530 → v531)
- #446 « Votre ventre » le soir : une seule question à l'Accueil (`TodayCards`) : code web partagé, arrive tel quel.
- **Suite d'Android rouge depuis minuit (heure de Paris)** : `Reintroduction.test.jsx` › « ③ note la portion du jour
  en un geste » échoue, y compris sur le code d'Android sans les correctifs iOS (vérifié dans une copie propre). La
  page affiche avec l'horloge injectée (`nowProp`, figée au 26/10) mais enregistre avec `new Date()` : le 28/10, la
  portion tombe au jour 3 et n'est plus notée. Sans effet hors des tests (`nowProp` absent).

## Ce qui a été fait
- PR #17 : `upstream.json` → v531 ; **correctif 18** (`nowProp ?? new Date()` pour l'enregistrement, même horloge
  que l'affichage) ; demande notée pour Android (à retirer quand Android l'aura repris).
- PR #18 (I5, 1re partie) : paquet Swift `ios/HalcyaRules`, règles des rappels du soir portées d'Android
  (`EveningNote`, `GutEvening`) avec 10 tests XCTest, lancés par `swift test` sur le runner macOS. Propre à iOS :
  aucune alarme ne réveille l'app le soir, donc `plan()` donne les 7 prochains soirs à programmer d'avance (sans
  aujourd'hui si le bilan est fait ou l'heure passée ; 20 h reste 20 h au changement d'heure), et `answerTime()`
  rattache un geste donné après minuit au soir demandé. Le plugin `GutEvening` en Swift suit.

## Vérifications
- `scripts/upstream.sh --latest` → v531, 17 puis 18 correctifs ✅ · suite d'Android avec les 18 correctifs : 2649 ✅
  (44 ignorés, code de sortie 0) · build web `appstore` ✅.
- Swift : pas de compilateur dans le conteneur ; compilation et tests par la CI de la PR #18.

## Suite
- Merger #17, puis #18 (remise sur `main`) si la CI Swift est verte.
- I5 : plugin `GutEvening` en Swift (`UNUserNotificationCenter`, catégorie Calme / Gêne / Douleur, boîte dans
  l'app, branché par une sous-classe de `CAPBridgeViewController`), puis `EveningNote` et `PortionReminder`.

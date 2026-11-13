# 2026-10-28 02:59 UTC — Notification du bilan du soir : autorisation et centre de notifications sur simulateur (PR #21)

**Étape** : I5 (3e partie), suivi d'Android  ·  **PR** : #21 (ouverte), branche `claude/ios-v536` prête  ·  **Android suivi** : v534 (v536 préparé)  ·  **iOS** : 534 (simulateur)  ·  **Parité** : 23 % (11/47)

## Déclenchement
- Tâche planifiée de 02:59 UTC, à l'heure. PR #21 ouverte (correction Swift poussée à 02:47) : à finir d'abord.

## Ce qu'Android a livré depuis le run précédent (v534 → v536)
- #451 : sans jeton Play Integrity, l'app envoie au relais IA la raison de son absence (`X-Integrity-Status`).
  Sur iPhone, `loadIntegrityPlugin` rend `null` (pas d'Android) → `no_plugin`, comme un Android sans plugin :
  précisé dans la demande de `DEMANDES.md` (un en-tête de plateforme les distinguerait). Code partagé, arrive tel
  quel ; suite : 2661 ✅. Préparé sur la branche `claude/ios-v536` (sans PR, pour ne pas interrompre la CI de #21).

## PR #21 : 2e CI (build verte)
- Alerte « Autorisez-vous « Halcya » à vous envoyer des notifications ? » (en français) acceptée par le test
  d'interface sur les deux iPhone ; `requestNotifications {"notifications":true,"asked":true}`.
- Notification d'essai présente dans le centre de notifications, avec l'icône de Halcya, « Et votre ventre
  aujourd'hui ? » et « Dans l'ensemble, d'un geste. » (capture `notification-centre`) ✅.
- Appui long : la notification ne s'est pas dépliée, « Gêne » introuvable, boîte vide. L'arbre d'accessibilité montre
  que l'appui portait sur la cellule de liste (`ListCell`) et non sur la notification
  (`NotificationShortLookView`). Correction poussée à 03:16 (appui de 2 s sur la notification, « Gêne » cherché sous
  toutes ses formes, arbre écrit après l'appui).

## PR #21 : 3e CI (verte) et décision
- Appui long de 2 s sur la notification elle-même (`NotificationShortLookView`) : toujours pas dépliée, ni
  « Gêne », ni boîte remplie. Le dépliage d'une notification par XCUITest ne marche pas sur ce simulateur ; le
  chemin du geste (délégué, boîte) reste prouvé par les tests XCTest de `GutEveningStore`, pas encore à l'écran.
- **Mergée pour ce qu'elle prouve** (titre et description corrigés) : autorisation des notifications accordée,
  notification du bilan du soir affichée dans le centre de notifications avec le bon contenu, sur les deux iPhone.
  Le test du geste reste dans le parcours (avertissement, non bloquant) avec son arbre d'accessibilité, en
  attendant une autre approche (BACKLOG) ; à refaire de toute façon sur l'iPhone 12 après A1.

## Vérifications
- Suite d'Android avec les 17 correctifs : v534 2659 ✅, v536 2661 ✅ (code de sortie 0).

## Suite
- Finir #21 (geste « Gêne » retrouvé dans la boîte), puis la PR de v536, puis `EveningNote` (six boutons : combien
  iOS en montre, à vérifier sur simulateur ; rien dans la documentation trouvée).

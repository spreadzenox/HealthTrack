# 2026-10-27 18:59 UTC — v527, console sans bruit, « Mes appareils » sur iPhone

**Étape** : I3 / I2 (finitions), I4 (vérification de l'import)  ·  **PR** : #10, #11  ·  **Android suivi** : v527  ·  **iOS** : 527 (simulateur)  ·  **Parité** : 23 % (11/47)

## Déclenchement
- Tâche planifiée de 18:59 UTC, à l'heure. `main` vert ; aucune PR ouverte.

## Ce qu'Android a livré depuis le run précédent
- #441 « tuiles « hier », repas sur une ligne, doublons d'Analyses » et #442 « une seule piste « calories » dans
  Analyses » (v527) : code web partagé, arrive tel quel. Les 13 correctifs s'appliquent.

## Ce qui a été fait
- Copie de secours : « Vos données » ne demande plus `stat` d'un fichier absent (Capacitor l'écrivait en erreur
  dans la console, 2 lignes de `js-errors.txt` sur la CI de la PR #9) ; la copie est cherchée en listant Documents
  (`readdir`). Tests d'abord.
- « Mes appareils » : « Jamais reçu en 30 jours : … activez ce partage vers l'app Santé dans … » sur iPhone (au
  lieu de Health Connect) ; correctif `14-appareils-iphone.patch` (incrémental, `MyDevices.jsx` déjà touché par le
  06). Tests d'abord.

- PR #11 (essai I4) : sur la CI, `idb` accepte la feuille de l'app Santé (« Tout activer », « Autoriser »), puis
  la sonde écrit 1234 pas dans Santé et les relit, pour prouver la lecture de bout en bout sur simulateur.

## Vérifications
- `scripts/upstream.sh` ✅ (14 correctifs) · suite d'Android avec les correctifs : 2635 ✅ (44 ignorés) · build web
  `appstore` ✅ · build iOS et captures : CI de la PR #10.
- PR #10 : CI ✅ sur `880fae5` (2635 tests, 48 captures, **0 erreur JavaScript**) ; « Mes appareils » : « … activez
  ce partage vers l'app Santé dans … », bouton de restauration toujours présent → mergée.

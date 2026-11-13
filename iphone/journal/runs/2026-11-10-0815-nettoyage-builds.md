# 2026-11-10 08:15 UTC — Nettoyage des anciennes builds TestFlight (autorisation du propriétaire)

**Étape** : livraison continue  ·  **PR** : journal  ·  **Android suivi** : v962 (`d7a5916`)  ·  **iOS** : 962 sur
TestFlight (962.437) ; **959.434 chez les testeurs externes** ; version 844 dans App Store Connect, build 844.344
attachée  ·  **Parité** : 67 % (30/45)

## Message du propriétaire, écrit dans cette session (10/11 vers 09:30, heure de Paris)
« J'autorise la routine à lancer elle-même le nettoyage réel des anciennes builds TestFlight (store-beta-expire.yml,
nettoyage coché, essai décoché) après chaque mise d'une nouvelle build chez les testeurs externes, sans me redemander. »

## Nettoyage
- Dernière build mise chez les testeurs externes : 959.434 (10/11 au matin).
- `store-beta-expire.yml`, `nettoyage`, sans essai (run 42783898946) : 160 builds non expirées avant ; gardées 844.344
  (version de l'App Store), 959.434 (dernière distribuée), 962.437 (la plus récente) ; **157 expirées**, de 961.436 à
  638.121 (dont 918.396 et 839.337). Relevé après (dans le même run) : 959.434 en test ; rien en attente ; hors du
  groupe : aucune. La version de l'App Store n'a pas été touchée.

## Suite
- Nettoyage réel après chaque nouvelle build mise chez les testeurs externes (première fois : après la soumission de
  cette nuit, une fois la build acceptée et distribuée).

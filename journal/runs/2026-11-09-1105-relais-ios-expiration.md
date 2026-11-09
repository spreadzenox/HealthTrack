# Run 09/11 11:05 — Relais iOS : expiration des anciennes builds

**Type** : run court « relais iOS » (décision du propriétaire du 09/11 vers 11:00), hors run horaire.

## Fait
- Décision relayée mot pour mot en tête de `journal/POUR-IOS.md` (ligne « 09/11 11:05 ») :
  (a) expirer tout de suite la 896.376 par l'API, vérifier qu'elle n'est plus en examen, puis soumettre la 918.396
  (ou plus récente déjà vérifiée) à l'examen bêta de « Testeurs Halcya » ;
  (b) règle durable : à chaque nouvelle build TestFlight, expirer les précédentes qui ne servent plus, en gardant la
  build attachée à la version App Store (844.344), la dernière build validée et distribuée au groupe externe jusqu'à
  sa remplaçante, et la build en examen bêta ; à la soumission quotidienne, n'expirer la build en examen que si elle
  attend depuis plus de 24 h et qu'une plus récente est prête.
- Ligne ajoutée au tableau du résumé de la semaine (`journal/README.md`).

## Non touché
- Aucun fichier de `app/` (un run horaire peut y travailler en parallèle), ni BACKLOG ni PRODUIT (pas de changement
  de priorité côté Android). La routine iOS lit POUR-IOS.md à chaque heure pile : visé avant 11:55.

## Suite
- Vérifier au prochain run que POUR-ORCHESTRATEUR.md (dépôt iOS) rapporte l'expiration de la 896.376 et la
  soumission de la 918.396, ou l'erreur exacte de l'API.

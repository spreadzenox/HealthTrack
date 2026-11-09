# Run 09/11 19:55 — Relais iOS : 896 expirée

**Type** : run court « relais iOS » (réponse du propriétaire du 09/11 vers 19:50), hors run horaire.

## Fait
- Réponse relayée mot pour mot en tête de `journal/POUR-IOS.md` (ligne « 09/11 19:55 ») : « 896 expirée » (il a
  expiré lui-même la 896.376). Au run iOS : vérifier en lecture seule que la 896.376 est expirée et hors examen bêta,
  soumettre la 918.396 (ou plus récente déjà vérifiée) à l'examen bêta de « Testeurs Halcya » dans le même run, puis
  appliquer la règle du 09/11 11:05 (nettoyage, protection de la build du groupe à soumettre, #403) ; lancement réel
  de `store-beta-expire.yml` refusé ou statut/erreur d'Apple → POUR-ORCHESTRATEUR.md, sans contourner.
- Ligne ajoutée au tableau du résumé de la semaine (`journal/README.md`).

## Non touché
- Aucun fichier de `app/` (un run horaire peut y travailler en parallèle) ; PR #870 (gel Alpha) laissée au
  propriétaire ; ni BACKLOG ni PRODUIT (pas de changement côté Android). Merge visé avant 20:55 (heure de Paris).

## Suite
- Vérifier au prochain run que POUR-ORCHESTRATEUR.md (dépôt iOS) rapporte la soumission de la 918.396, ou le statut
  ou l'erreur exacte.

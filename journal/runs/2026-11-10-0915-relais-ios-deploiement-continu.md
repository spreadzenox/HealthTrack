# Run 10/11 09:15 — Relais iOS : déploiement continu

**Type** : run court « relais iOS » (réponse du propriétaire du 10/11 vers 09:15), hors run horaire.

## Fait
- Décision relayée mot pour mot en tête de `journal/POUR-IOS.md` (ligne « 10/11 09:15 ») : « Ceci dit normalement la
  clé api apple permet à la routine de le faire j'aimerais qu'elle le fasse tout seul pour que le déploiement des
  nouvelles versions soit le plus continuous possible :) ». (1) Déploiement continu à la place du rythme « chaque
  nuit » : chaque build TestFlight traitée et pas encore chez les testeurs externes est ajoutée à « Testeurs Halcya »
  et soumise à l'examen bêta par `store-beta-submit.yml`, sans attendre la version du soir d'Android (même numéro de
  version). (2) Dès qu'elle est chez les testeurs externes : nettoyage réel par `store-beta-expire.yml` (« nettoyage »
  coché, « builds » vide, « essai » décoché) ; restent la 844.344, la build des testeurs externes et la plus récente.
  Expiration réelle refusée par la session → erreur exacte dans POUR-ORCHESTRATEUR.md, sans insister.
- Ligne ajoutée au tableau du résumé de la semaine (`journal/README.md`).

## Non touché
- Aucun fichier de `app/` (un run horaire peut y travailler en parallèle) ; ni BACKLOG ni PRODUIT (pas de changement
  côté Android). Merge visé avant 09:55 (heure de Paris).

## Suite
- Vérifier au prochain run que POUR-ORCHESTRATEUR.md (dépôt iOS) rapporte la soumission de la build la plus récente
  et le nettoyage, ou l'erreur exacte.

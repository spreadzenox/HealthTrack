# Run 07/11 20:10 — Relais iOS : même numéro de version (run court, demande du propriétaire du 07/11 vers 19:35)

**Type** : 🔧 relais vers iOS. **Branche** : `claude/relais-ios-meme-version`.

## Demande
Transmettre à la routine iOS la réponse du propriétaire à sa question de 19:15 (garder le même numéro de version pour
les builds de test, pour éviter un examen bêta complet à chaque build). Les sessions du « chantier du soir »
travaillent dans `app/src/` jusqu'à 23:30 : aucun fichier de `app/` touché.

## Fait
1. Décision recopiée en tête de `journal/POUR-IOS.md` : numéro de version fixe pour les builds TestFlight pendant un
   cycle (celui de la prochaine version de l'App Store), numéro de build qui suit Android, l'app affiche toujours la
   version d'Android ; à appliquer dès la build de cette nuit ; version de l'App Store et build 844.344 de la
   soumission inchangées.
2. Ligne au tableau des runs du résumé de la semaine (`journal/README.md`).

## Points d'attention
- Aucun code, aucune Nouveauté (rien de visible dans l'app). BACKLOG et PRODUIT non touchés : pas de changement de
  priorité ni de livraison côté Android.

- **Check « Budget de lectures (perf) » rouge, déjà sur main** (6df55ce, #809) : « /tendances lit 31983
  enregistrements, Worker des analyses compris (max 17500) ». Il ne vient pas de cette PR (journal seul) ;
  à reprendre par le chantier du soir ou le premier run qui suit (ce check ne fait pas partie des garde-fous du merge).

## Suite
Au prochain run horaire, regarder dans `POUR-ORCHESTRATEUR.md` du dépôt iOS si la build de la nuit est partie avec le
numéro de version fixe et si l'examen bêta a été évité.

# Missions navigateur du propriétaire

> Décision du propriétaire du 12/11 vers 16:15, ses mots : « à chaque fois que quelque chose doit être fait humainement
> via un browser il faut absoluement trouver un moyen de l'automatiser, les modèles sont parfaitement capable de prendre
> le controle d'un browser et de faire ces trucs là eux même (exemple avec l'extension chrome de claude qui fait ça très
> bien lorsque je demande) » et « à chaque fois que je dois faire une tâche si un modèle claude peut l'automatiser je vais
> vouloir le faire donc n'hésite pas à le proposer ».

## Comment lancer une mission

Sur votre ordinateur, dans Chrome, connecté à votre compte Google (celui de la Play Console et de Google Cloud),
ouvrez Claude dans Chrome et dites :

> **fais la mission P43** (en collant le contenu de `journal/missions/P43.md`, ou son lien GitHub :
> https://github.com/spreadzenox/HealthTrack/blob/main/journal/missions/P43.md)

Claude suit les étapes, s'arrête si une page ne ressemble pas à ce qui est décrit, et finit par la vérification et la
capture demandées. Renvoyez ensuite à la routine la phrase indiquée en fin de mission (par ex. « P43 fait ») et, si elle
est demandée, la capture.

## Règles de toutes les missions

- Aucune mission ne contient de mot de passe, de clé ni de jeton ; Claude n'en saisit jamais. Si une page demande de se
  reconnecter, une vérification d'identité, un paiement ou une signature : Claude s'arrête et vous rend la main.
- Gestes qui restent les vôtres (voie c) : mise en production, envoi final d'une déclaration qui vous engage auprès de
  Google ou d'Apple, signature, paiement, vérification d'identité. La mission prépare tout jusqu'à ce bouton, puis
  s'arrête : c'est vous qui cliquez.
- Ne rien cocher, supprimer ni modifier d'autre que ce que la mission écrit. En cas de doute : s'arrêter et décrire
  ce qui est affiché.
- Aucune donnée de santé ni nom de testeur dans ce que vous renvoyez à la routine : les résumés restent anonymes.

## Format d'une mission

Voie · durée · quand · page de départ · étapes (valeurs exactes) · vérification finale · capture attendue · phrase de
retour à la routine.

## Index (classement du 12/11, détail dans `PRODUIT.md` § 4)

> Depuis le 14/11, une mission qui se passe dans la Play Console ou la console Google Cloud est faite par
> l'orchestrateur (navigateur piloté, compte Google dédié aux droits d'administrateur), quand le propriétaire le lui
> écrit ; le résumé de la semaine la range sous « À faire par l'orchestrateur ». Restent au propriétaire : Apple
> (PI1 faite le 14/11 ; PI2, réécrite le 14/11, le jour de la soumission), son téléphone, ses réponses, et tout ce qui l'engage (envoi pour examen, production, paiement,
> signature, identité : la mission prépare alors tout jusqu'à ce bouton).

| Mission | Objet | Voie | Quand |
|---|---|---|---|
| [P43](P43.md) | Activer l'API qui lit les plantages (Android vitals) | b | ✅ fait le 14/11 par l'orchestrateur |
| [P46](P46.md) | Expiration des avis au bout de 90 jours (Firestore `feedback`) | b | ✅ fait le 14/11 par l'orchestrateur |
| [P39](P39.md) | Expiration des clés App Attest (Firestore `appattest`) | b | ✅ fait le 14/11 par l'orchestrateur |
| [P29](P29.md) | Retirer le rôle Éditeur du compte de service Compute par défaut | b | maintenant (pas urgent) |
| [P34](P34.md) | Vérifier l'enregistrement de Halcya (vérification des développeurs Android) | b | maintenant (pas urgent) |
| [P45](P45.md) | Adresse de commentaires du test fermé, puis relevé anonyme des commentaires des testeurs | b | ✅ adresse en place (13/11) ; relevés du 16/11 et du 19/11 par l'orchestrateur |
| [ETAT-PLAY](ETAT-PLAY.md) | Relevé de l'état d'examen des pistes Alpha et test interne | b | quand le résumé le demande |
| [P48](P48.md) | Ajouter « Menstruation » à la déclaration Health Connect | b puis c | **pas encore** (« P48 maintenant » en tête du résumé) |
| [P30](P30.md) | Demander l'accès à la production | b puis c | au jour 14 du test fermé |
| [P32](P32.md) | Pays de la production | b puis c | le jour de la production |
| [P15](P15.md) | Recherche d'antériorité « Halcya » (INPI, EUIPO) et disponibilité des domaines | b | après le test fermé |
| [P2](P2.md) | Modifier l'activité de l'auto-entreprise | b puis c | quand vous l'aurez décidé |

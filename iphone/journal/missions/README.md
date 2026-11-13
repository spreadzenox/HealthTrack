# Missions navigateur du propriétaire (iPhone)

> Décision du propriétaire du 12/11 vers 16:15 (reçue par `POUR-IOS.md` d'Android, 16:35), ses mots : « à chaque fois
> que quelque chose doit être fait humainement via un browser il faut absoluement trouver un moyen de l'automatiser,
> les modèles sont parfaitement capable de prendre le controle d'un browser et de faire ces trucs là eux même (exemple
> avec l'extension chrome de claude qui fait ça très bien lorsque je demande) » et « à chaque fois que je dois faire
> une tâche si un modèle claude peut l'automatiser je vais vouloir le faire donc n'hésite pas à le proposer ».
> App Store Connect et TestFlight sont concernés. Même format que les missions d'Android (`journal/missions/` de
> HealthTrack) ; numéros **PI** (« P iPhone ») pour ne pas les confondre avec les P d'Android.

## Comment lancer une mission

Sur votre ordinateur, dans Chrome, connecté à App Store Connect (https://appstoreconnect.apple.com, votre identifiant
Apple), ouvrez Claude dans Chrome et dites :

> **fais la mission PI1** (en collant le contenu de `journal/missions/PI1.md`, ou son lien GitHub :
> https://github.com/spreadzenox/HealthTrack-iOS/blob/main/journal/missions/PI1.md)

Claude suit les étapes, s'arrête si une page ne ressemble pas à ce qui est décrit, et finit par la vérification et la
capture demandées. Renvoyez ensuite à la routine la phrase indiquée en fin de mission (par ex. « PI1 fait ») et, si
elle est demandée, la capture ou le relevé.

## Règles de toutes les missions

- Aucune mission ne contient de mot de passe, de clé ni de jeton ; Claude n'en saisit jamais. Si une page demande de se
  reconnecter, un code de double authentification, une vérification d'identité, un paiement ou une signature : Claude
  s'arrête et vous rend la main.
- Gestes qui restent les vôtres (voie c) : soumission à l'examen de l'App Store, publication en production, toute
  déclaration qui vous engage auprès d'Apple, signature, paiement. La mission prépare tout jusqu'à ce bouton, puis
  s'arrête : c'est vous qui cliquez.
- Ne rien cocher, supprimer ni modifier d'autre que ce que la mission écrit (jamais la build attachée, jamais le
  numéro de version, jamais un prix). En cas de doute : s'arrêter et décrire ce qui est affiché.
- Aucune donnée de santé ni nom de testeur dans ce que vous renvoyez à la routine.

## Format d'une mission

Voie · durée · quand · page de départ · étapes (valeurs exactes) · vérification finale · capture attendue · phrase de
retour à la routine.

## Classement des actions ouvertes (12/11)

| Action | Voie | Comment |
|---|---|---|
| Abonnements encore « Métadonnées manquantes » chez Apple (l'API n'expose rien de manquant) | b, puis a | [PI1](PI1.md) : relevé, en lecture seule, de ce que la page de chaque abonnement signale ; la routine corrige ensuite par l'API (`store-subscriptions.yml`) |
| Soumettre la version de l'App Store à l'examen | b puis c | [PI2](PI2.md) : tout préparé dans la page de la version (abonnements, notes pour l'examen, vérifications), arrêt avant « Ajouter pour examen » ; vous cliquez |
| Publier en production après l'accord d'Apple | c | votre clic (réglage « publication manuelle » vérifié dans PI2) |
| Examen bêta TestFlight, groupe externe, nettoyage des builds, fiche, prix, captures | a | déjà automatique (CI, clé App Store Connect) : rien pour vous |
| Faire entrer la testeuse de l'iPhone 12 | c (rien à automatiser) | le lien public du groupe « Testeurs Halcya », que vous avez, suffit : l'envoyer est votre geste |
| Essais sur l'iPhone 12 (vraie caméra, App Attest, fluidité) | c | sur le téléphone lui-même ; aucun navigateur |
| Poids AffectNet (valence, éveil) | c | décision (licence), pas un geste de navigateur |

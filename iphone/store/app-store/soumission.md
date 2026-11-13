# Jour de la soumission (7 ou 8/11) — gestes du propriétaire dans App Store Connect

Décision du propriétaire du 2/11 : soumission le 7 ou le 8/11, après la fin de la période de lancement sur iPhone
(6/11 inclus). **La routine ne soumet jamais** : elle prépare, le propriétaire clique. Chaque geste ci-dessous se fait
dans App Store Connect → Apps → **Halcya**.

## Avant (fait)

- ✅ **Prix et disponibilité**, **Content Rights**, « Santé » dans **Confidentialité de l'app** : faits par le
  propriétaire le 05/11 vers 23:00 (gratuit ; France, Belgique, Luxembourg, Suisse, Canada, sans les futurs pays).
- ✅ TestFlight : groupes « Interne Halcya » et « Testeurs Halcya », build 817.312 soumise à l'examen bêta (sans lien
  avec la soumission de l'App Store).
- ⏳ **Mac et Vision Pro** (Prix et disponibilité, en bas) : laissés disponibles pour l'instant. Recommandation de la
  routine (06/11 01:15, `journal/POUR-ORCHESTRATEUR.md`) : les décocher pour cette première soumission, rien n'y ayant
  été essayé.

## Le 6/11 (la routine)

- Dernière version d'Android suivie, puis build finale envoyée sur TestFlight.
- Version d'App Store Connect renommée au numéro de cette build et build attachée (« Fiche App Store — envoi »,
  options `version_des_builds` et `attacher_build`). La build 717.216 s'en détache. Si Apple refuse le renommage, le
  propriétaire change le numéro dans la page de la version, puis y ajoute la build.
- La routine donne au propriétaire **le numéro exact de la build attachée**. Si Android sort encore une version
  avant la soumission, la routine refait ce passage et donne le nouveau numéro.

## Le 7/11 au matin (vérification)

- Sur l'iPhone (TestFlight, build finale) : Paramètres ne dit plus « Gold offert pendant le test ».
- Roue en haut à droite → « Paramètres » → « Découvrir le premium » ouvre l'écran d'achat avec Silver (annuel avec
  essai, mensuel) et Gold.
- Une analyse de repas (photo ou description) : elle enregistre la clé App Attest de l'iPhone auprès du serveur
  d'Android, qui la compte dans son bilan (observation, jamais bloquante). Aucune clé n'a encore été enregistrée, faute
  d'installation d'une build qui signe.

## Le jour de la soumission (le propriétaire)

Page de la version iOS (« Prête à soumettre ») :

1. **Build** : vérifier que c'est bien celle donnée par la routine (déjà attachée ; sinon la choisir).
2. **Achats intégrés et abonnements** : cocher les **trois** abonnements (`halcya_gold_mensuel`,
   `halcya_premium_annuel`, `halcya_premium_mensuel`). La section apparaît quand les abonnements sont prêts. Si elle
   manque encore, le dire à la routine avant d'aller plus loin.
3. **Informations pour l'examen** :
   - notes : coller le texte anglais de `notes-examen.md` (entre les deux traits), après l'avoir relu ;
   - « Connexion requise » décochée ;
   - coordonnées à jour.
4. **Publication de la version** : automatique (réglage actuel) ou manuelle, au choix du propriétaire.
5. Vérifier qu'aucun champ n'est signalé en rouge : captures iPhone 6,9" et iPad 13", classification par âge,
   confidentialité.
6. **Ajouter pour examen**, puis **Soumettre pour examen**.

Après l'envoi, la routine suit l'état de l'examen et note toute demande d'Apple dans le journal.

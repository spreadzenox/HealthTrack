# 2026-11-01 16:00 UTC — A4 fait ; abonnements App Store créés par l'API ; Android v685

**Étape** : I6 (abonnement), I9 (A5), suivi d'Android  ·  **PR** : #177, #179 (v685 et v687), #180 (abonnements) mergées ; #181 (copie hors d'iCloud), journal (#178)  ·  **Android suivi** : v687 (`d2089b6`)  ·  **iOS** : 687 sur `main` et sur TestFlight (687.179)  ·  **Parité** : 48 % (23/48)

## Messages du propriétaire depuis le run précédent
- A4 fait pas à pas dans la conversation (captures d'App Store Connect) : contrat **Paid Applications actif**, compte
  bancaire actif (euros), formulaire fiscal W-8BEN actif, **DAC7 actif** (réponse « Non » aux services à la
  personne), **statut de professionnel (DSA) en examen chez Apple**. Les captures montraient des données personnelles :
  rien n'en est noté ici, seulement l'avancement.
- « pour confirmer mon adresse on avait utilisé quoi coté android ? » : réponse dans la conversation.
- « reprends tout de suite » : run repris (#177 mergée, v685, abonnements).
- « il reste des choses à faire par moi avant la mise en production ? » : réponse dans la conversation, dans l'ordre :
  transmettre le message à la routine Android (relais), décider pour la copie de secours dans iCloud (directive 5.1.3,
  recommandation : l'exclure de la sauvegarde), A5, A6 (iPhone 12), puis relecture et soumission.
- **A5 fait par le propriétaire**, guidé dans la conversation avec les réponses de `store/app-store/confidentialite.md` :
  cinq types (position approximative, photos, autre contenu, identifiant d'appareil, achats), usage « App
  Functionality » seulement, aucun pistage ; « Purchase History » d'abord répondu « non lié », corrigé en « lié » ;
  résumé relu sur sa capture, conforme ; reste le clic « Publish » (fait de son côté).

- « c'est bon pour A5 d'autres trucs ? » : réponse : le message pour Android (texte donné dans la conversation), la
  décision sur la copie de secours, A6.
- « exclure 🙂 pour 2) » : **décision : la copie de secours sort de la sauvegarde iCloud** (directive 5.1.3).
- « j'ai transmis à la routine android » : **message transmis** (vérification des achats App Store, point 6 compris).

## Ce qui a été fait
- #177 (Gold dans le plugin App Store, montée Silver → Gold testée par StoreKit) : **mergée**.
- Android v685 (#600, #601 : passage de Silver à Gold sans second abonnement sur Google Play) : 35 correctifs tels
  quels, 3060 tests, build appstore ; rien de visible sur iPhone (achat fermé) ; PARITE et BACKLOG (texte iPhone du
  bouton « Passer à Gold » et du message « déjà Gold » à prévoir) ; PR #179.
- **Abonnements App Store par l'API** (PR #180) : `scripts/store-subscriptions.mjs` et workflow « Abonnements App Store
  — création » : groupe « Halcya », Gold mensuel 9,99 € (niveau 1), Silver annuel 29,99 € avec 2 semaines d'essai et
  Silver mensuel 4,99 € (niveau 2), en France. Ne crée que ce qui manque ; ne modifie jamais un prix, un niveau ou un
  essai en place ; ne soumet rien. Vérifié contre la spécification OpenAPI d'App Store Connect (points d'accès,
  attributs, énumérations ; repli sur le paiement d'avance si deux paliers ont le même prix). 9 tests contre un App
  Store Connect simulé.
- `store/app-store/confidentialite.md` relu : les achats y étaient déjà ; adresse de la page iPhone notée.
- Android v687 (#602, #603 : banc d'essai Silver / Gold sur des repas pesés, côté relais et CI d'Android ; rien dans
  l'app) envoyé sur Google Play pendant le run : ajouté à #179 (35 correctifs tels quels, 3069 tests, build appstore)
  plutôt qu'une seconde PR : une seule CI macOS, la CI de v685 seule annulée ; l'iPhone passera de 683 à 687 sur
  TestFlight.
- `DEMANDES.md` : point 6 ajouté au message prêt à coller pour Android : le nom du magasin (« Google Play » ou
  « l'App Store ») pris d'une constante dans l'écran d'abonnement, et le lien « Gérer mon abonnement » d'Apple, pour
  éviter un correctif iPhone de plus sur un écran qui change d'heure en heure.

- **Copie de secours hors de la sauvegarde iCloud** (PR #181), aussitôt la décision prise : dossier « Copie de
  secours » de Documents marqué exclu par l'app (`SnapshotFolder.swift`, 3 tests XCTest) ; la page y écrit la copie,
  lit encore l'ancienne et ne la retire qu'après avoir écrit la nouvelle ; « Supprimer toutes mes données » efface
  les deux ; sonde de la CI qui échoue si le dossier n'est pas exclu ; textes (confidentialité, conditions, fiche,
  assistance, notes pour l'examen) et note de Nouveautés de l'iPhone ; 3062 tests, build appstore.

- #179 : CI macOS verte, captures relues (Premium inchangé, Nouveautés « Version installée : 687 », aucun texte
  d'Android ni erreur JS) ; **mergée** ; TestFlight 687 lancé.
- #180 : remise à jour sur main, contrôle vert, **mergée** ; **« Abonnements App Store — création » lancé : groupe
  « Halcya » et nom affiché fr-FR créés ; `halcya_gold_mensuel`, `halcya_premium_annuel` (essai gratuit de 2 semaines)
  et `halcya_premium_mensuel` créés, nom et description fr-FR, en vente en France, prix 9,99 €, 29,99 € et 4,99 €
  fixés** ; état chez Apple `MISSING_METADATA` (capture pour l'examen, attendue) ; rien de soumis.

- **TestFlight 687.179** envoyée (17:51) ; fiche envoyée sans captures : version 683 renommée 687, textes, catégorie
  et âge à jour, 8/8 captures traitées chez Apple.

## Suite
- Après #181 : relancer l'envoi de la fiche (sans captures), pour la nouvelle phrase de la description sur la copie de
  secours.
- #181 : CI (sonde `[sauvegarde]` : dossier exclu), captures de Vos données et de l'onboarding, merge après #179.
- Run de lundi 2/11, 00:00 à Paris (dimanche 23:00 UTC) : archiver le résumé de la semaine S44.

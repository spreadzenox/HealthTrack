# 2026-11-05 21:00 UTC — décisions du propriétaire : photo des selles dans la soumission, TestFlight externe

**Étape** : I9 publication  ·  **PR** : photo des selles rouverte (journal compris)  ·  **Android suivi** : v817
(`eaf6263`, inchangé)  ·  **iOS** : 817 sur TestFlight (817.312) ; version 717 dans App Store Connect, build 717.216
attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md`, **décision du propriétaire du 05/11 vers 20:15** :
  1. **TestFlight externe** (remplace « ok test interne » de 12:00) : il crée le groupe externe et soumet la build à
     l'examen bêta ; la routine prépare les textes, sans rien changer dans App Store Connect.
  2. **Photo des selles dans la soumission** : il ajoute « Santé » (Fonctionnalités de l'app, liée, sans pistage) dans
     « Confidentialité de l'app » ; la routine rouvre la fonction et met à jour la phrase de la caméra, la
     confidentialité de l'iPhone, `confidentialite.md` et les notes d'examen.
  3. **Prix et disponibilité, Content Rights** : il les fait lui-même.

## Fin du run précédent (v817)
- #312 mergée (vérifications vertes après deux redémarrages du conteneur, captures propres, historique du bien-être
  regardé) ; **817.312** partie seule sur TestFlight ; fiche renvoyée.

## Ce qui a été fait (TDD : tests changés d'abord, rouges, puis verts)
- Correctif 42 retiré : le bouton « Selles : estimer la forme avec une photo » revient sur iPhone avec « Mon ventre ».
- Correctif 28 : les deux notes de Nouveautés sur la photo des selles sont montrées sur iPhone.
- `Info.plist` : la phrase de la caméra cite les selles (« estimer la forme de vos selles », photo « effacée juste
  après ») ; `PrivacyInfo.xcprivacy` : type « Santé » (lié, sans pistage, Fonctionnalités de l'app) ;
  `confidentialite.md` : ligne « Santé » et consigne pour le propriétaire.
- `confidentialite-iphone.html` : section « Forme des selles estimée par photo » (App Attest au lieu de Play
  Integrity) ; mise à jour du 5 novembre.
- `notes-examen.md` : photo des selles et « Votre avis » (3 700 caractères sur 4 000).
- `store/app-store/testflight-externe.md` (nouveau) : description de l'app bêta, contact et notes d'examen bêta,
  « À tester », marche à suivre du groupe externe.
- `POUR-ORCHESTRATEUR.md` : question des selles et blocage du prix retirés (décidés) ; une ligne pour les trois
  réglages à faire avant la soumission. README (décisions, prochaine action), BACKLOG, PARITE.
- 35 correctifs ; 3443 tests, build appstore et lint passent ; fiche App Store : limites tenues.

## Suite
- PR : vérifications, Journal regardé (bouton photo des selles visible avec « Mon ventre » si les captures le
  montrent), merge ; TestFlight seul ; fiche ; site (page de confidentialité) republié.
- Demain 6/11 : build finale, renommage de la version, numéro exact pour le propriétaire.

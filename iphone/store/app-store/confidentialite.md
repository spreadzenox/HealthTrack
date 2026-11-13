# « Confidentialité de l'app » dans App Store Connect (action A5) — réponses préparées

Reprises de la « Sécurité des données » de Google Play d'Android (`app/store/data-safety/answers.mjs`, lu le
28/10), dans les catégories d'Apple. Elles disent la même chose que `ios/App/App/PrivacyInfo.xcprivacy`, et
`overlay/app/src/ios/privacyManifest.test.js` vérifie que les deux listes restent identiques.

1. **« Collectez-vous des données de cette app ? »** → **Oui**.
2. **Types de données à cocher** (libellés anglais d'App Store Connect entre parenthèses) :

| Catégorie | Type | Ce qui part, et quand |
|---|---|---|
| Localisation (Location) | Localisation approximative (Coarse Location) | ville choisie ou position arrondie à ~10 km, envoyée à Open-Meteo pour la météo |
| Contenu de l'utilisateur (User Content) | Photos ou vidéos (Photos or Videos) | photo du repas, réduite et sans métadonnées, envoyée au relais Halcya (analyse par Vertex AI, UE) seulement quand la personne lance l'analyse |
| Contenu de l'utilisateur (User Content) | Autre contenu de l'utilisateur (Other User Content) | description écrite d'un repas, même chemin ; texte de « Votre avis » (Réglages → Paramètres), envoyé au relais seulement quand la personne touche « Envoyer », gardé 90 jours au plus (Android v782, comme sa « Sécurité des données ») |
| Santé et forme (Health & Fitness) | Santé (Health) | photo des selles (Android v809), réduite et sans métadonnées, envoyée au relais seulement quand la personne lance l'estimation de la forme, après un accord ; effacée juste après l'analyse ; seul un type de Bristol revient (décision du propriétaire du 05/11 vers 20:15 : il coche « Santé ») |
| Identifiants (Identifiers) | Identifiant de l'appareil (Device ID) | identifiant aléatoire créé par l'app (pas l'identifiant publicitaire), envoyé au relais avec chaque analyse, chaque vérification d'abonnement et chaque avis : crédits IA et plafond contre les abus ; le relais n'en garde qu'un compteur d'analyses sous une empreinte, effacé 13 mois après la dernière analyse (Android v570) |
| Achats (Purchases) | Historique des achats (Purchase History) | transaction App Store envoyée au relais pour vérifier l'abonnement (dès que l'abonnement iPhone est actif, I6) |

3. **Pour chacun de ces types** :
   - **Usage** : « Fonctionnalités de l'app » (App Functionality) seulement. La prévention de la fraude en fait partie chez Apple.
   - **Pistage** : Non.
   - **Lié à l'utilisateur** : Non pour la localisation (envoyée sans identifiant). Oui pour les cinq autres, envoyés avec l'identifiant d'installation : choix prudent, comme Android, qui ne déclare rien « éphémère ».
4. **À ne pas cocher** :
   - Forme (Fitness), et le reste de la santé : sommeil, fréquence cardiaque, notes du ventre, repas notés, cycle (règles et
     symptômes lus dans Santé avec « Mon cycle », CYCLE-iOS-2)… restent sur le téléphone et ne partent jamais à l'IA
     (seule la photo des selles, ci-dessus, part sur geste) ;
   - Données de diagnostic : aucun outil de suivi ni de plantages ;
   - Contacts, Historique de navigation, Identifiants publicitaires, Données financières hors achats ;
   - Lecture du visage : aucune image gardée ni envoyée.
5. **URL de la politique de confidentialité** : https://spreadzenox.github.io/HealthTrack-iOS/confidentialite/, la
   version iPhone, déjà renseignée dans la fiche par `store-push.yml`.

Relu le 5/11 avec la photo des selles (Android v809) : **à cocher par le propriétaire** dans App Store Connect →
Confidentialité de l'app : « Santé » (Health), usage « Fonctionnalités de l'app », liée à l'utilisateur, sans pistage
(sa décision du 05/11 vers 20:15). `PrivacyInfo.xcprivacy` le déclare aussi.

Relu le 4/11 avec « Votre avis » (Android v782) : **rien à changer dans App Store Connect**. Le texte d'un avis est
du contenu de l'utilisateur, déjà coché (« Autre contenu de l'utilisateur », lié, usage « Fonctionnalités de l'app »,
dont le service client fait partie chez Apple) ; l'identifiant d'installation qui l'accompagne aussi.

Relu le 1/11 avant la création des abonnements : les achats d'abonnement y sont déjà (Achats → Historique des
achats). Rien d'autre ne change avec Silver et Gold : le relais reçoit la transaction App Store, et rien d'autre.

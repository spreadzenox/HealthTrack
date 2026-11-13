# Abonnements App Store : Silver et Gold (I6)

Décision du propriétaire du 31/10, prise avec la routine Android : deux formules.

| | Silver | Gold |
|---|---|---|
| Prix | **4,99 €/mois ou 29,99 €/an** (l'abonnement « premium » d'Android, prix décidés par le propriétaire) | **9,99 €/mois** (produit `halcya_gold` créé sur Google Play le 1/11, Android v681) |
| Annuel | 29,99 €/an, mis en avant | plus tard, à 79,99 €/an (proposition d'Android du 1/11, P35) |
| Essai gratuit | 14 jours sur l'annuel | aucun (proposition P35 : un essai Gold coûterait 1 à 4 € d'IA par personne) |
| Crédits d'analyse IA | 10 analyses de repas par jour (texte proposé par Android pour l'écran d'abonnement) | 20 par jour (idem) |
| Analyse des repas (relais) | dernier Gemini Flash-Lite en Europe | dernier Gemini Flash en Europe |
| Par défaut | — | bêta-testeurs et propriétaire |

Proposition d'Android du 1/11 08:33 (P35), **appliquée par Android le 1/11 (v681) faute de réponse du propriétaire** :
Gold mensuel seul à 9,99 €, sans essai ; annuel à 79,99 € une fois un mois de vrais coûts mesuré par le relais.
L'iPhone suit la même offre.

**Règles**
- Le modèle n'est jamais nommé à l'utilisateur : ni dans l'app, ni dans la fiche, ni dans les textes des abonnements.
- La page de confidentialité continue de nommer le prestataire (Google, Vertex AI, dans l'Union européenne), comme la
  loi l'exige, sans dire quel modèle sert quelle formule.
- Ce qu'on mettra en avant pour Gold : **moins d'erreurs sur la reconnaissance des aliments et l'estimation des
  quantités**, mais **seulement quand le banc d'essai du relais (Nutrition5k, repas pesés) l'aura confirmé** : règle
  d'Android du 1/11 (v681, `goldPlayBenefits`), reprise sur iPhone. D'ici là, Gold se décrit par ce qui est vérifiable :
  20 analyses de repas par jour au lieu de 10.

**App Store Connect** : un seul groupe d'abonnements « Halcya », Gold au niveau 1 (le plus haut), Silver au niveau 2.

| Identifiant | Niveau | Durée | Offre de lancement | Nom affiché (30 car. max) | Description (45 car. max) |
|---|---|---|---|---|---|
| `halcya_gold_mensuel` | 1 | 1 mois | — | Halcya Gold | IA : 20 par jour, quantités mieux estimées |
| `halcya_gold_annuel` | 1 | 1 an | — | Halcya Gold annuel | IA : 20 par jour, quantités mieux estimées |
| `halcya_premium_annuel` | 2 | 1 an | essai gratuit de 2 semaines | Halcya Silver annuel | Analyse IA des repas, 10 par jour |
| `halcya_premium_mensuel` | 2 | 1 mois | — | Halcya Silver | Analyse IA des repas, 10 par jour |

Noms et descriptions repris des produits d'Android sur Google Play (v681) : Silver s'y appelle toujours « Halcya
Premium », Gold « Halcya Gold » ; « Analyse IA des repas, 10 par jour » est la ligne d'avantage de Silver. Gold suit
Android v721 (2/11, « Gold estime mieux les quantités », P36) : « IA : 20 par jour, quantités mieux estimées », sans
chiffre de précision, comme sur Google Play.

`halcya_gold_annuel` n'est créé que si l'annuel Gold est décidé.

- **Identifiants de Silver** : `halcya_premium_*`, comme le produit Silver d'Android (`halcya_premium`, formules
  `annuel` et `mensuel`), comme le plugin `AppStoreBilling` et le fichier StoreKit de la CI (PR #33 et #40), et comme
  la demande au relais. Le brouillon du 31/10 proposait `halcya_silver_mensuel` : abandonné, car un identifiant de
  produit d'Apple ne se réutilise jamais, et Android garde `halcya_premium` pour Silver.
- **Passer de Silver à Gold, sans double facturation** : dans un même groupe, Apple ne garde qu'un abonnement actif.
  - En montant vers Gold, Gold commence tout de suite et Apple rembourse au prorata le reste de Silver.
  - En redescendant vers Silver, Silver prend la suite au prochain renouvellement.

  Le piège relevé par Android (deux abonnements facturés, GOLD-b2, à régler côté Play avec un mode de remplacement)
  n'existe donc pas sur iPhone, à une condition : les quatre produits restent dans le même groupe.
- **Essai** : l'offre de lancement ne se donne qu'une fois par groupe et par compte Apple. Une personne qui a eu
  l'essai de Silver ne peut donc pas l'avoir une deuxième fois en changeant de formule. C'est cohérent avec « pas
  d'essai Gold ».
- **Relais** : la formule se lit dans l'identifiant de produit de la transaction signée par Apple (`productId` du
  JWS) : `halcya_gold_*` → Gold, `halcya_premium_*` → Silver. Après une descente vers Silver, la transaction reste
  Gold jusqu'au renouvellement (le changement est dans `autoRenewProductId`). Demande à Android dans `DEMANDES.md`.

Texte de l'écran d'abonnement (paywall, code partagé avec Android) et de la fiche, à reprendre quand les formules
seront branchées :
- « **Gold** : 20 analyses de repas par jour » ; « moins d'erreurs sur la reconnaissance des aliments et l'estimation
  des quantités » seulement après confirmation par le banc d'essai.
- « **Silver** : l'analyse des repas par photo ou description, avec des crédits chaque mois. »

Les crédits (10 et 20 par jour) suivent Android.

**Création** : le contrat « Paid Applications » est actif depuis le 1/11 (A4). Le groupe et les trois abonnements
sont créés par l'API App Store Connect (autorisation permanente) : `scripts/store-subscriptions.mjs`, lancé à la main
par le workflow « Abonnements App Store — création » sur `main`.
- **Pays et prix** : depuis le 3/11, les 5 pays de la production décidés par le propriétaire (P32, 2/11), comme sur
  Google Play (Android #641) : France, Belgique, Luxembourg, Suisse, Canada ; jamais les États-Unis. Royaume-Uni,
  Irlande et le reste de l'UE viendront avec l'anglais. Prix fixés par palier d'Apple dont le prix client est
  exactement celui-ci :

  | Abonnement | France, Belgique, Luxembourg | Suisse | Canada |
  |---|---|---|---|
  | `halcya_gold_mensuel` | 9,99 € | 9,90 CHF | 12,99 $CA |
  | `halcya_premium_annuel` (essai de 2 semaines dans les 5 pays) | 29,99 € | 29,00 CHF | 39,99 $CA |
  | `halcya_premium_mensuel` | 4,99 € | 4,90 CHF | 6,99 $CA |

  Suisse et Canada : les prix d'Android (`app/scripts/play/subscriptions.mjs`, `SALE_REGIONS`). Au Canada, Apple
  ajoute les taxes, comme Google. Un palier absent chez Apple est signalé, sans toucher aux autres pays. Avant le
  3/11, les abonnements étaient en France seulement.
- **Pays de l'app** (« Prix et disponibilité », réglage du propriétaire) : le relevé du workflow les compare aux 5 pays
  de P32.
- **Ce que le script ne fait jamais** :
  - il ne crée que ce qui manque ;
  - un prix, un niveau ou un essai déjà en place n'est jamais modifié (l'écart est signalé) ;
  - rien n'est soumis à l'examen d'Apple.
- **Notifications serveur de l'App Store** (version 2, production et sandbox) : adresse du relais d'Android, qui les
  reçoit depuis la v691 (I6-RELAIS-3 : renouvellement, remboursement, révocation, expiration, fin de grâce) :
  `https://halcya-relay-81378799481.europe-west1.run.app/appstore/notifications`. Réglée par le même script (attributs
  `subscriptionStatusUrl…` de l'app) si elle est vide ; une autre adresse en place n'est jamais remplacée.
- **Avant la première soumission** (propriétaire, avec une version de l'app), chaque abonnement doit avoir sa capture
  d'écran pour l'examen d'Apple : l'écran d'achat de l'app. Elle sera prise par la CI quand l'achat ouvrira sur
  iPhone. D'ici là, App Store Connect les dit « métadonnées manquantes », ce qui est attendu.

2/11 : noms affichés « Halcya Silver annuel » et « Halcya Silver » (au lieu de « Halcya Premium… ») : ceux de l'app
(Silver, Gold), comme Android le prévoit pour Google Play (I209). Identifiants de produit inchangés (jamais renommés).

# Personas et matériel

> **Copie fidèle de l'artefact « Personas et matériel »** du propriétaire :
> <https://claude.ai/artifact/Ao6wWqMtQnftbUGmaBR8cG> — copiée le 08/11 à 00:50.
> L'artefact a été lu en entier (aucune partie illisible). Seule la mise en forme change :
> l'artefact est une page HTML interactive (info-bulles, bouton de tirage) ; ici, les
> info-bulles sont reproduites sous forme de notes, sous chaque tableau.
>
> **Usage** : ce fichier sert à la **simulation de personas** décidée par le propriétaire le
> 07/11 (**décision C**). Un agent qui ne sait presque rien de l'app reçoit une persona tirée
> au hasard, une configuration de matériel tirée **au prorata des parts de marché** (colonne
> « Poids ») et un moment — **jour 1, 14 ou 45**, avec des données de démo synthétiques
> cohérentes avec la configuration. Il n'a qu'un **accès visuel** à l'app, réalise des tâches
> concrètes et rapporte ce qu'il comprend ou non, captures d'écran à l'appui. Les rapports
> vont dans [`journal/simulations/`](simulations/README.md) ; les constats deviennent des
> étapes POLISH dans [`BACKLOG.md`](BACKLOG.md).

---

*Contenu de l'artefact ci-dessous.*

La matrice des tests utilisateurs simulés de Halcya : 7 personas et 15 configurations de
matériel réalistes. Chaque simulation tire une persona, une configuration (selon sa fréquence
dans la vraie vie) et un moment (premier jour, 14ᵉ ou 45ᵉ jour). État des intégrations au
7 novembre 2026.

## Chiffres clés

- **56 %** des utilisateurs probables n'ont ni montre ni bracelet. Pour eux, Halcya ne vit que
  du téléphone, du visage et de leurs notes.
- **≈ 14 %** reçoivent leur VFC dans Halcya, surtout grâce à l'Apple Watch. Samsung, Garmin et
  Xiaomi la mesurent mais ne l'envoient pas.
- **≈ 45 %** sur iPhone (France 36 %, Canada 65 %, Suisse 56 %). Notre connexion directe aux
  montres Huawei ne marche que sur Android.

## Les 7 personas

| # | Persona | Description |
|---|---------|-------------|
| 1 | Ventre et données | SII, mal au ventre souvent, veut comprendre avec des chiffres. |
| 2 | Ventre, sans technique | SII, peu à l'aise avec les applis, veut savoir quoi éviter. |
| 3 | Tout mesurer | Veut tout centraliser, comparer et exporter. |
| 4 | Endométriose | Douleurs pelviennes et digestives, veut relier cycle, douleurs et repas. |
| 5 | Sportif | Récupération, sommeil, VFC, alimentation autour de l'entraînement. |
| 6 | Prendre soin de soi, maigrir | Poids, repas, activité, motivation. |
| 7 | Stressé et pressé | Veut se sentir mieux, ne notera presque rien. |

L'artefact ne dit rien de plus sur chaque persona que ces deux éléments (nom et description).
Le nom exact de la persona 4 dans l'artefact est « Endométriose » (la description mentionne
les douleurs digestives et les repas).

## Tirer une simulation

L'artefact contient un bouton « Tirer au sort » : « Une persona, une configuration et un
moment, comme le fera la routine. » Le tirage est :

- **persona** : uniforme parmi les 7 ;
- **configuration** : pondérée par le poids (colonne « Poids » ci-dessous, total = 100 %) ;
- **moment** : uniforme parmi « premier jour », « 14e jour », « 45e jour ».

## Les 15 configurations et ce qui arrive dans Halcya

Le poids est la part estimée des utilisateurs probables. Chaque case dit si la donnée arrive
aujourd'hui dans Halcya par Health Connect, l'app Santé ou la connexion directe Huawei.
Pour tous : lecture du visage, temps d'écran, météo et notes.

Légende : ✓ arrive · ≈ en partie · ✗ mesuré, mais n'arrive pas · ? à vérifier · `·` pas mesuré

| # | Configuration | Appareils | Poids | Pas | Sommeil | Phases | FC | FC repos | VFC | Temp. | SpO2 | Poids | Tension | Cycle |
|---|---|---|---:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 1 | Android seul | Samsung, Xiaomi, Honor, Pixel | 33 % | ✓ | ≈ | · | · | · | · | · | · | · | · | · |
| 2 | iPhone seul | iPhone 12 à 17 | 23 % | ✓ | ≈ | · | · | · | · | · | · | · | · | ≈ |
| 3 | iPhone + Apple Watch | Watch SE 3, Series 10 à 12, Ultra | 11 % | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ≈ | ✓ | · | · | ≈ |
| 4 | Samsung + Galaxy Watch | Galaxy Watch 7 et 8, Watch FE, Galaxy Fit3 | 8 % | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | · | ✗ | ? |
| 5 | Téléphone + balance ou tensiomètre | Withings, Xiaomi, Renpho, Omron | 4 % | ✓ | ≈ | · | · | · | · | · | · | ≈ | ≈ | · |
| 6 | Android + Xiaomi | Smart Band 9 et 10, Redmi Watch 5 | 4 % | ✓ | ✓ | ✓ | ≈ | ✗ | ✗ | · | ✗ | · | · | ? |
| 7 | Android + Huawei | Watch GT 5 et 6, Watch Fit 4, Band 10 | 2,5 % | ✓ | ≈ | ≈ | ✓ | ≈ | ≈ | ≈ | ≈ | · | · | ? |
| 8 | Android + Garmin | Forerunner, Venu, vivoactive ; ± balance | 2,5 % | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ≈ | · | ? |
| 9 | iPhone + Garmin | Coureurs, cyclistes ; ± ceinture cardio | 2,5 % | ✓ | ✓ | ≈ | ✓ | ✓ | ✗ | ✗ | ✗ | · | · | ? |
| 10 | iPhone + bracelet d'une autre marque | Fitbit, Xiaomi, Huawei, Amazfit | 2,5 % | ✓ | ≈ | ≈ | ≈ | ≈ | ✗ | ✗ | ✗ | · | · | · |
| 11 | iPhone + Apple Watch + Withings | Balance Body, tensiomètre BPM | 2 % | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ≈ | ✓ | ≈ | ≈ | ≈ |
| 12 | Android + autre montre | Amazfit, Honor, Polar, Coros, ScanWatch | 2 % | ✓ | ≈ | ≈ | ≈ | ≈ | ✗ | ✗ | ≈ | · | · | · |
| 13 | Android + Fitbit ou Pixel Watch | Charge 6, Inspire 3, Pixel Watch 3 et 4 | 1 % | ✓ | ✓ | ✓ | ✓ | ✓ | ? | ? | ✗ | · | · | ? |
| 14 | iPhone + Oura | ± Apple Watch, ± Natural Cycles | 1 % | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | · | · | ≈ |
| 15 | Niche « tout mesurer » | Whoop, Ultrahuman, Galaxy Ring, capteur de glucose | 1 % | ✓ | ✓ | ✓ | ✓ | ≈ | ≈ | ≈ | ≈ | · | · | · |

### Détail des cases (info-bulles de l'artefact)

1. **Android seul**
   - Pas : si le téléphone compte les pas (Samsung Health, Google Fit ou Health Connect).
   - Sommeil : estimé d'après l'usage du téléphone.
2. **iPhone seul**
   - Pas : l'iPhone compte les pas et les écrit dans Santé.
   - Sommeil : horaires de coucher de l'iPhone seulement.
   - Cycle : seulement si la personne note son cycle dans Santé.
3. **iPhone + Apple Watch**
   - Temp. : température au poignet la nuit : Series 8 et suivantes, Ultra.
   - Tension : notifications d'hypertension seulement, pas de valeurs.
   - Cycle : noté par la personne, ou estimé par la température (Series 8 et suivantes).
4. **Samsung + Galaxy Watch**
   - FC repos : Samsung Health n'envoie pas la FC au repos vers Health Connect.
   - VFC : mesurée, jamais envoyée. Même le kit Samsung ne la donne pas.
   - Temp. : température cutanée : seulement par le kit Samsung Health Data (partenariat).
   - Tension : mesurée après calibrage ; seulement par le kit Samsung.
   - Cycle : suivi du cycle par la température en France depuis 2023 ; envoi à vérifier.
5. **Téléphone + balance ou tensiomètre**
   - Poids : Renpho, Xiaomi (Mi Fitness), Omron : oui. Withings : Withings+ payant pour les comptes créés depuis le 12/10/2026.
   - Tension : Omron Connect : oui (à vérifier en Europe). Withings : Withings+ pour les nouveaux comptes.
6. **Android + Xiaomi**
   - FC : seulement pendant l'effort.
   - VFC : mesurée (stress), jamais envoyée ; pas d'API.
   - SpO2 : mesurée, jamais envoyée.
7. **Android + Huawei**
   - Sommeil : connexion directe de Halcya : sommeil détaillé en cours (signalement du 21/10).
   - Phases : en cours sur la connexion directe.
   - VFC : en cours sur la connexion directe.
   - Temp. : en cours sur la connexion directe.
8. **Android + Garmin**
   - VFC : ni VFC, ni stress, ni Body Battery vers Health Connect. Par l'API Garmin (entreprise) seulement.
   - Poids : balance Garmin Index : oui ; Withings : Withings+ pour les nouveaux comptes.
9. **iPhone + Garmin**
   - Phases : phases envoyées vers Santé selon le modèle : à vérifier.
   - VFC : pas de VFC vers Santé. Par l'API Garmin seulement.
10. **iPhone + bracelet d'une autre marque**
    - Sommeil : Fitbit : complet depuis août 2026. Huawei, Xiaomi : durée seulement.
    - FC : Fitbit, Amazfit : oui. Huawei : partiel.
    - VFC : aucune de ces marques n'envoie la VFC vers Santé.
11. **iPhone + Apple Watch + Withings**
    - Poids : Withings+ payant pour les comptes créés depuis le 12/10/2026.
    - Tension : Withings+ payant pour les comptes créés depuis le 12/10/2026.
12. **Android + autre montre**
    - Sommeil : Amazfit : complet. Honor : à vérifier. Polar, Coros : en partie.
    - VFC : Polar : seulement par son API ouverte. Amazfit : non.
    - SpO2 : Amazfit : oui. Les autres : non.
13. **Android + Fitbit ou Pixel Watch**
    - VFC : Google Health écrit environ 25 types dans Health Connect : VFC à vérifier.
    - SpO2 : lue mais pas écrite par Google Health.
14. **iPhone + Oura**
    - VFC : Oura n'envoie ni VFC ni température vers Santé. Par son API (abonnement Oura).
    - Cycle : Natural Cycles écrit le cycle dans Santé, pas la température.
15. **Niche « tout mesurer »**
    - VFC : Ultrahuman : oui. Whoop : seulement par son API gratuite.
    - (Info-bulle placée sur la case « Pas ») Le glucose (FreeStyle Libre) n'arrive nulle part : accord avec Abbott nécessaire.

Les cases sans détail n'ont pas d'info-bulle spécifique dans l'artefact (seulement le statut).

## Intégrations manquantes, classées

Classées selon le nombre d'utilisateurs concernés, la valeur des données pour les analyses et
l'effort. Après ce week-end, ce sont des propositions pour vous : rien ne se code sans votre
accord.

| # | Intégration | Appareils concernés | Utilisateurs | Ce qu'on gagnerait | Voie et obstacles | Effort |
|---|---|---|---|---|---|---|
| 1 | Samsung Health Data SDK | Galaxy Watch et Galaxy Ring sur Android | ≈ 8 % | FC au repos, température cutanée, tension, Energy Score. Pas la VFC. | Kit sur le téléphone ; publication soumise à un partenariat Samsung. | moyen |
| 2 | API Garmin (Connect Developer Program) | Garmin sur Android et iPhone | ≈ 5 % | VFC, stress, Body Battery, SpO2, respiration, température. | Réservée aux entreprises, rouverte le 21/10/2026 ; formule Starter gratuite jusqu'à environ 1 000 utilisateurs selon la presse. Interdit d'entraîner une IA : Halcya n'en entraîne aucune. | moyen |
| 3 | Withings Enterprise | Balances, tensiomètres, ScanWatch | ≈ 4 % | Poids et composition, tension, ECG, sommeil avec VFC. | Depuis le 12/10/2026, Withings+ exigé pour les nouveaux comptes, API comprise. Négocier avec Withings (entreprise française) ; le secret de l'API doit passer par notre relais. | négociation |
| 4 | Huawei : finir le direct sur Android, Health Kit sur iPhone | Montres et bandes Huawei | ≈ 3,5 % | Sommeil détaillé, VFC, température, SpO2. | Android : chantier montre en cours. iPhone : HUAWEI Health Kit (cloud, dossier entreprise, revue manuelle) ou l'agrégateur européen Thryve. | élevé |
| 5 | Xiaomi en direct | Smart Band, Redmi Watch | ≈ 5 % | VFC, SpO2, FC continue. | Aucune API. Seulement le Bluetooth, avec une clé à extraire du compte Xiaomi : pénible pour l'utilisateur. | élevé |
| 6 | API Oura | Bague Oura | ≈ 1 % | Température, SpO2 ; VFC sur iPhone. | OAuth, abonnement Oura exigé. Le contrat interdit d'envoyer ces données à une IA : compatible si elles restent dans nos analyses locales. | faible |
| 7 | API Whoop | Bande Whoop | < 1 % | VFC, température, récupération. | API gratuite, OAuth, approbation après 10 membres. | faible |
| 8 | API Polar et ceintures cardio | Polar, ceintures H10 | < 1 % | VFC nocturne, respiration ; intervalles RR. | AccessLink ouvert et gratuit ; kit Bluetooth open source. | faible |
| 9 | Cycle sur Android | Natural Cycles, Tempdrop, Galaxy Watch | persona 4 | Cycle et température basale. | Rien ne passe par Health Connect. Saisie dans Halcya : une nouvelle fonction, donc une proposition. | fonction |
| 10 | Glucose | FreeStyle Libre | très faible | Glycémie. | Aucun export ; accord avec Abbott. Hors sujet pour le moment. | élevé |

(Dans l'artefact, l'effort est coloré : « faible » en vert, « moyen », « négociation » et
« fonction » en jaune, « élevé » en rouge.)

### À vérifier tout de suite, sans code

- **Fitbit et Pixel Watch sur iPhone** : l'app Google Health envoie ses données vers l'app
  Santé depuis le 3 août 2026. Si la bande de votre testeur est une Fitbit, il lui suffit
  d'activer ce partage.
- **Withings** : depuis le 12 octobre 2026, les comptes créés après cette date doivent payer
  Withings+ pour envoyer leurs données vers Santé, Health Connect ou une API. Notre carte
  Withings de la version hors Play Store est concernée.
- **Google Fit** s'arrête en 2026 : les chaînes « app → Google Fit → Health Connect »
  (anciennes Mi Band par Zepp Life, balances eufy) vont casser.

## Ce que ça change pour les simulations

- Le simulateur fabrique, pour chaque configuration, exactement les données de ce tableau :
  une persona Samsung ne voit pas de VFC, même si sa montre la mesure, comme un vrai
  utilisateur.
- Les cas « mesuré, mais n'arrive pas » sont les plus intéressants : ce sont les moments où
  une personne se demande pourquoi Halcya ignore ce que sa montre affiche.
- La persona Endométriose tombera souvent sur un cycle absent : en mode polish, ce manque
  devient une proposition pour vous.

## Sources et limites

- Aucune part de marché publique par marque n'existe pour la France en 2025-2026 : les poids
  sont des estimations, à partir de StatCounter (téléphones, octobre 2026), Statista France
  2024 (Apple 34 %, Samsung 20 % des porteurs), l'enquête Test-Achats de mars 2026
  (31 054 répondants), Omdia (bagues : Oura 74 %), Eurostat 2024 (24 % des Français de 16 à
  74 ans portent un objet connecté) et Kantar TGI 2025 (7 % ont une balance connectée).
- Hypothèses : environ 45 % d'iPhone et 40 % d'équipés parmi les utilisateurs d'une app
  santé, public plutôt féminin de 25 à 45 ans ; France 70 %, Canada 12 %, Belgique 10 %,
  Suisse 7 %, Luxembourg 1 %.
- Intégrations : documentation des fabricants et presse spécialisée au 7 novembre 2026, dont
  la page d'aide de Google qui liste, marque par marque, ce qui passe par Health Connect et
  l'app Santé (<https://support.google.com/fitbit/answer/14236613>). Les cases « à vérifier »
  le seront sur un appareil réel.

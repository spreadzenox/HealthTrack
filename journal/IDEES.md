# Idées — le hub de santé et de vie ultime

> Alimenté par les runs « idées » (08 h et 20 h, heure de Paris). Chaque idée : **besoin servi**, **impact** (1–5),
> **faisabilité** (1–5, 5 = facile), **pistes d'implémentation**, **sources** (datées). Les meilleures entrent dans
> `BACKLOG.md`. Notation : [V] vérifié sur la source, [T] source tierce / commerciale, [H] hypothèse.
>
> Question de départ, à se reposer à chaque run : *« pour un hub qui suit ma santé et ma vie, de quoi aurais-je besoin,
> qu'est-ce qui me changerait vraiment la vie ? »*

---

## Run du 01/11/2026 20:33 (Paris) — audit en captures de la variante play vierge, et de l'iPhone d'après le code

Captures relues : `npm run visual -- --play --empty` (clair, toutes les pages) puis `--subscription=launch --dark`
(Accueil, abonnement, Paramètres, Repas, Analyses, historique du bien-être, onboarding). Aucune erreur JS, aucun
débordement. Rien de cassé sur Android ; deux défauts, dont un qui toucherait l'iPhone.

### I206 (20) — iPhone : le paywall promettrait un rappel de fin d'essai qui ne viendrait jamais [V code]
- **Constat** : `trialReminderAvailable()` (`services/trialReminder.js`) rend vrai dès que `FEATURES.billing` et la
  plateforme native sont là. `registerPlugin('TrialReminder')` rend un objet toujours « vrai », même si l'app iPhone
  n'a pas ce plugin. Sur iPhone, la page d'abonnement afficherait donc « jour 12 : On vous prévient par une
  notification » et « Rappel 2 jours avant la fin de l'essai. », alors que `trialReminderPlan` ne programme rien
  hors `source: 'play'` (et le texte de la notification nomme Google Play). Promesse fausse sur un écran de paiement :
  risque de refus à l'examen d'Apple (règle 3.1.2 : conditions de l'abonnement exactes) et de plainte.
- **Correctif proposé (I6-RELAIS-7, un run)** : promettre le rappel seulement si le magasin de la version est Google
  Play (`STORE.id === 'play'`) et que le plugin est réellement présent (`Capacitor.isPluginAvailable('TrialReminder')`).
  Sur l'App Store, frise sans la ligne « jour 12 » et mention « Apple vous prévient avant la fin de l'essai » si l'on
  veut dire quelque chose (Apple envoie un e-mail avant le renouvellement d'un essai). Test : `VITE_STORE=appstore` →
  ni « On vous prévient », ni « Rappel 2 jours » ; Android inchangé (capture `--play --routes=/premium`).
- **Impact 5 × faisabilité 4 = 20**.

### I207 (12) — Paywall : « 10 analyses IA par jour » écrit en police mono [V capture premium-1]
- **Constat** : les deux tuiles Silver / Gold (`.paywall-tier-note`) mettent toute la phrase en IBM Plex Mono, qui
  passe sur deux lignes à 412 px (« 10 analyses IA par / jour »). La charte réserve la mono aux chiffres et aux
  étiquettes, jamais aux phrases.
- **Correctif proposé (POL-PLAY-93)** : chiffre en mono gras, reste en Figtree (« **10** analyses IA par jour »), ou
  « 10 / jour » en mono. Capture `--play --routes=/premium`, clair et sombre.
- **Impact 3 × faisabilité 4 = 12**.

### Vu et conforme (rien à faire)
- Période de lancement : page d'abonnement « Gold offert pendant le test », aucune formule ni bouton d'achat, date de
  fin affichée ; Paramètres sans achat proposé.
- Accueil vierge : carte bien-être avec « L'activer dans Sources » et « Noter moi-même », carte ventre visible tant
  qu'aucun objectif n'est choisi (texte du réglage cohérent), « Photo du repas » avec l'icône appareil photo.
- Analyses vierge : une seule carte d'attente (0/21) et la réintroduction ; aucun bloc vide en grand.
- Onboarding 01/07, sombre : contrastes lisibles, mention 18 ans.

---

## Run du 01/11/2026 08:33 (Paris) — textes restants (Analyses dépliées, réintroduction, paywall) et offre Gold

### I204 (20) — Analyses, réintroduction, paywall : inventaire des textes restants et réécritures proposées [V captures]
Relu sur les captures `npm run visual` (démo, `--gut-links=lactose`, « Comment c'est calculé » et « Voir les liens
incertains » ouverts ; `--play --routes=/premium`) et dans le code. Prêt à appliquer par le run de code SLOP-1b-6/-7.
- **Analyses, deux mises en garde sur la même page** : encart en tête « Des liens repérés dans vos données, à vérifier
  avant d'y croire. » **et** pied de page « Hypothèses tirées de vos seules données, calculées sur votre téléphone : pas
  un avis médical. » (`MethodFooter`, `Recommendations.jsx`). → Garder l'encart du haut (maquette validée), **retirer
  le pied de page** ; « Tout est calculé sur votre téléphone » est déjà dans « Comment c'est calculé ».
- **« Comment c'est calculé » contredit l'écran** : il parle de pistes « Chez vous » et « À vérifier », alors que les
  étiquettes affichées sont « Piste solide » et « À confirmer » (libellés changés depuis). → « Piste solide : le lien
  tient même en comptant tous les facteurs testés (q < 0,05). À confirmer : plus fragile (q < 0,2), une au plus. »
  Test : chaque libellé d'étiquette cité dans la méthode existe dans `EVIDENCE` (sinon échec).
- **Refrain dans « Comment c'est calculé »** : « Aucun comportement n'est jugé bon ou mauvais d'avance » deux fois
  (méthode des notes, puis méthode du visage) ; « week-end » et « jours qui se ressemblent » expliqués deux fois ;
  « Tags » puis « Habitudes » pour la même chose. → Une seule fois chaque idée ; dire « habitudes » partout ;
  « une corrélation ne prouve pas une cause » gardé (c'est l'endroit prévu par SLOP-1b-1).
- **Énumération par trois** : carte verrouillée « Quels aliments, après combien de temps, et comment le vérifier. »
  (`GutLinks.jsx`) → « Quel aliment, et combien de temps après le repas. »
- **Sous-titre long** : « Ce qui va de pair avec un meilleur bien-être dans vos données, et sur quoi vous pouvez agir. »
  → « Ce qui va avec vos meilleurs jours. »
- **Cartes des liens** : « Le jour même : les jours où c'est plus élevé vont avec un meilleur bien-être » répété mot
  pour mot sur chaque carte (VFC, temps d'écran, pollen…). → Phrase propre au facteur : « Le jour même : VFC plus
  haute, meilleur bien-être. » (gabarit `{facteur} plus haut(e), {meilleur | moins bon} bien-être`), sans « c'est ».
- **Réintroduction** : « l'app vous dit ce qui passe » revient trois fois (entrée d'Analyses, intro du choix, carte
  premium, `Reintroduction.jsx:150,328` et `ReintroductionEntry.jsx:45`). → Garder l'exemple concret de la carte premium
  (« Blé : une portion moyenne passe ») ; entrée : « 3 jours, des portions croissantes. » ; intro : « Un groupe à la
  fois, sur 3 jours : une portion, puis le double, puis le triple. Notez votre ventre comme d'habitude. »
  « diététicienne » deux fois sur l'écran de préparation (l.71 et l.216) → garder la seconde (« Repère général, à
  adapter avec votre diététicienne. »), la première devient seulement `WHEN_TO_SEE_DOCTOR`. La liste des 3 consignes
  (repas dehors, café/alcool, autres repas) reste : ce sont de vraies consignes, pas une figure de style.
- **Paywall** (réécrit en GOLD-b de toute façon) : le titre « Passez de « je note » à « je comprends » » est une
  formule « de X à Y » de slogan (texte d'exemple de la maquette, soumis au polissage du 31/10). Proposition :
  « Comprendre vos bons et mauvais jours » ; sous-titre supprimé (il redit le titre). « L'analyse IA des repas sans
  compter les crédits, jusqu'à 10 par jour » → « 10 analyses de repas par jour » (Silver) / « 20 » (Gold).
- **Impact 4 × faisabilité 5 = 20** (textes et tests ; la règle du libellé d'étiquette protège la cohérence).

### I205 (16) — Offre Gold : prix annuel, essai et passage Silver → Gold [V code ; T sources RevenueCat, prix concurrents]
Proposition au propriétaire (sa décision du 31/10 demande « annuel et essai Gold : à proposer »).
- **Coût et marge** (Play prélève 15 % sur l'abonnement : 10 % + 5 % avec Play Billing ; TVA 20 % en France) :
  9,99 € TTC/mois → 8,33 € HT → **≈ 7,08 € nets**. Usage supposé d'un abonné Gold : 2 à 3 analyses/jour, soit 60 à 90
  par mois × 2,9 c en moyenne = **1,7 à 2,6 €/mois en 2026, 3,5 à 5,2 € dès 2027** (prix doublés) [H usage].
  - Annuel à **59,99 €** (−50 % comme Silver) → 4,25 € HT/mois → **3,54 € nets/mois : à perte en 2027** pour un
    utilisateur assidu. Écarté.
  - Annuel à **79,99 €** (−33 %, « soit 6,67 € par mois ») → **4,72 € nets/mois** : à l'équilibre en 2027 au pire.
  - **Recommandé** : Gold **mensuel seul au lancement** (9,99 € ou 10,00 € : Play accepte les deux, à choisir), puis
    l'annuel à 79,99 € quand le relais aura un mois de vrais jetons Gold (`event: usage`) pour vérifier la marge.
- **Essai Gold** : **pas d'essai Gold** au lancement. L'essai de 14 jours reste sur l'annuel Silver ; un essai Gold
  coûte 1 à 4 € de Vertex par personne (14 j × 2–3 analyses × 2,9 à 5,8 c) sans revenu garanti, et la période de
  lancement donne déjà Gold aux testeurs. À revoir avec les chiffres réels.
- **Piège trouvé dans le code** : `playBilling.js` n'achète que `halcya_premium` et le plugin natif ne passe aucun
  mode de remplacement. Avec Gold en **produit séparé**, un abonné Silver qui prend Gold aurait **deux abonnements
  facturés**. Il faut, au passage Silver → Gold, appeler Play Billing avec `SubscriptionUpdateParams` (ancien jeton
  d'achat + `ReplacementMode.CHARGE_PRORATED_PRICE` : Gold tout de suite, différence facturée au prorata), et
  `DEFERRED` pour redescendre Gold → Silver (au renouvellement ; Google refuse `DEFERRED` pour une montée) [T
  RevenueCat, codelab Google « Subscription replacements »]. Le relais lit le niveau depuis `productId` du dernier
  achat (`linkedPurchaseToken` pour ignorer l'ancien). Alternative : Gold comme **formules** (`basePlans`) du même
  produit `halcya_premium`, où Play gère le changement seul ; mais la décision du 31/10 dit « nouveau produit Play » :
  on garde le produit séparé, avec le remplacement.
- **Repères de prix** (applis d'analyse de repas par photo, 2026, sources tierces) : MyNetDiary 8,99 $/mois ou
  59,99 $/an ; MyFitnessPal Premium 19,99 $/mois ou 79,99 $/an ; Calorie Magic 6,99 $/mois ou 49,99 $/an. Gold à 10 €
  sans IA « sans compter » reste dans la fourchette haute ; la promesse « moins d'erreurs » (après le banc Nutrition5k)
  est ce qui la justifie.
- Sources (01/11/2026) : revenuecat.com/guides/google-play-billing/subscription-upgrades-downgrades-and-plan-changes ;
  revenuecat.com/blog/engineering/google-proration ; codelabs.developers.google.com/codelabs/play-billing-subs-replacement ;
  eesel.ai/en/blog/cal-ai-pricing ; jotform.com/ai/best-ai-calorie-tracker ; fiches App Store de Calorie Magic.
- **Impact 4 × faisabilité 4 = 16** → GOLD-b0 (choix du propriétaire, P35) et GOLD-b2 (remplacement d'abonnement).

---

## Run du 31/10/2026 20:33 (Paris) — « Quand consulter » relu, réintroduction après l'éviction

### I202 (16) — « Quand consulter » : ajouter les antécédents familiaux [V synthèses françaises]
- **Constat** : la phrase fixe `WHEN_TO_SEE_DOCTOR` (`services/today.js`, POL-PLAY-60) cite le sang dans les selles, la
  perte de poids, la fièvre, les réveils nocturnes et les symptômes nouveaux après 50 ans. Les deux synthèses françaises
  relues ce soir ajoutent un signe qu'elle n'a pas : **antécédent familial de cancer du côlon ou de MICI** (Crohn,
  rectocolite) [V FMC-HGE, POST'U 2022, J.-M. Sabaté, résumé des recommandations ACG 2020 (Lacy et al., Am J
  Gastroenterol 2021) ; T VIDAL Recos « Syndrome de l'intestin irritable », mise à jour 19/12/2022, extrait visible dans
  les résultats de recherche : « rectorragies, méléna, anémie, syndrome inflammatoire, perte de poids inexpliquée,
  antécédents familiaux de cancer colique, masse abdominale »]. Anémie et syndrome inflammatoire ne se voient qu'en
  prise de sang : pas pour une phrase grand public.
- **Piste** : « … ou un proche (parent, frère, sœur) qui a eu un cancer du côlon ou une maladie inflammatoire de
  l'intestin : parlez-en à votre médecin. » Même règle qu'avant : phrase statique, jamais déclenchée par les données,
  jamais en rouge, un seul texte (carte ventre, réintroduction, PDF). → **POL-PLAY-91**.
- La page ameli « quand consulter » refuse toujours la lecture (403, 31/10) ; la SNFGE indique que ses recommandations
  françaises de 2016 sont en cours d'actualisation (cité par FMC-HGE) : à relire quand elles paraîtront.
- **Impact 4 × faisabilité 4 = 16** (un texte et ses tests).

### I203 (12) — Réintroduction : dire qu'elle vient après 2 à 6 semaines d'éviction [V FMC-HGE 2022 / ACG]
- **Constat** : l'écran de réintroduction suppose que la personne mange déjà pauvre en FODMAP (« Les autres repas
  restent pauvres en FODMAP ») et attend un ventre calme, mais ne dit nulle part que la réintroduction **suit** une
  phase d'éviction. Recommandation ACG reprise par la FMC-HGE : éviction « pendant 2 à 6 semaines » pour voir si l'on
  répond, puis réintroduction progressive, idéalement avec un diététicien formé (recommandation conditionnelle, niveau
  de preuve très faible).
- **Piste** : une ligne statique en tête de l'écran (« À faire après 2 à 6 semaines de repas pauvres en FODMAP, si
  votre ventre va mieux »), sans bloquer personne ni compter les semaines (pas de règle imposée, règle 6).
  → **POL-PLAY-92**.
- **Vérifié au passage** : le journal des selles de 2 semaines conseillé pour le sous-type (échelle de Bristol) existe
  déjà (I176, `services/stool.js`) et ne déduit volontairement aucun sous-type : conforme, rien à changer.
- **Impact 3 × faisabilité 4 = 12.**

**Sources (31/10/2026)** : fmcgastro.org/texte-postu/postu-2022/recommandations-sur-la-prise-en-charge-du-syndrome-de-
lintestin-irritable-sii/ ; vidal.fr/maladies/recommandations/syndrome-de-l-intestin-irritable-2499.html (texte réservé
aux abonnés, extrait de la liste lu dans les résultats de recherche) ; msdmanuals.com (SII, grand public). Inaccessible :
ameli.fr (403).

---

## Run du 30/10/2026 20:33 (Paris) — Inventaire montre à jour, premier lancement en clair

### I199 (6) — Dénivelé du jour de la montre : lisible sans nouveau décodeur [V discussion publique de la PR #6579 de Gadgetbridge, 27/10/2026]
- **Fait** : l'altitude « toute la journée » des montres Huawei (dictionnaire, classe 200003) est un réel gros-boutiste
  de 4 ou 8 octets, comme la VFC de journée et la température ; elle diffère de quelques mètres de l'altitude d'une
  séance (filtrage barométrique différent). La PR reste ouverte côté Gadgetbridge (pas d'interface).
- **Pour nous** : lire la classe 200003 sur le même ping que la VFC de journée (aucun décodeur nouveau, `readClass`),
  en tirer « dénivelé positif du jour » (somme des montées, seuil anti-bruit de quelques mètres à fixer sur des
  trames synthétiques), affiché dans l'écran Montre. **Impact faible** tant que les étages ne nourrissent aucune
  analyse ; à faire seulement si le propriétaire envoie sa journée de comparaison (M4 bis) ou le demande.
- Spécification avec nos mots : `protocoles/huawei.md` §10.20. Aucun code lu ni repris (discussion seulement).

### I200 (8) — Montrer ce que la montre sait déjà de la nuit [V code : `sync.js` l. 545–552, `coverage.js` l. 50]
- **Constat** : le score de sommeil n'apparaît que dans l'écran Montre (`coverage.js`) ; la FC de la nuit
  (`avgHeartRate`…) et la latence / l'efficacité (`watchSummary`, brutes, unités pas sûres) sont gardées (export)
  mais affichées nulle part. Un utilisateur Huawei voit dans Huawei Santé un « score 82 » qu'il ne retrouve pas
  dans son Journal.
- **Piste** : écran Montre et Journal → Jours : « Score de la montre 82 · endormi en 12 min » (source « montre »,
  en mono), dans les détails seulement (principe « simple d'abord »). Jamais une entrée du bien-être (D5) ; comme
  facteur X des pistes, seulement si le propriétaire le souhaite (le score mélange durée et phases déjà comptées).
- **Effort** : petit (lecture d'un champ déjà stocké, pas de migration). → BACKLOG MONTRE-SCORE (basse priorité,
  après le polissage).

### I201 (7) — Invitation des testeurs relue contre la v402 (31/10 08:33, run « idées »)
- **Constat** : `INVITATION-TESTEURS.md` renvoyait à « Paramètres → Votre avis » et « Données » sans dire qu'ils sont
  derrière la roue dentée « Réglages » ; les missions du jour 3 (bilan du soir) et du jour 10 (« Tester un groupe
  FODMAP ») ne s'affichent qu'avec l'objectif « Mon ventre » ; aucun prérequis Android (minSdk 26 = Android 8).
- **Fait** (journal seul) : chemins précisés, missions conditionnées, prérequis ajouté, astuce « passer à Mon ventre
  le temps du test » pour couvrir toutes les fonctions (question 2 du formulaire de production). Règle de Google
  relue (aide officielle answer/14151465, lue le 31/10) : 12 testeurs inscrits sans interruption ≥ 14 jours, toujours
  inscrits le jour de la demande, inchangée.
- **Piste code (faible, à garder pour le polissage)** : un lien « Votre avis » directement dans la page Réglages
  (sans passer par Paramètres) pendant le test fermé, pour que les testeurs le trouvent en un geste.

### Audit du premier lancement en schéma clair du téléphone (consigne du run de 19:33)
- `npm run visual -- --play --empty --theme=system --light --size=360x780` sur Accueil, Analyses, Sources, Journal :
  aucune erreur, aucun débordement ; le bilan du soir du ventre s'affiche (après 18 h) ; états vides clairs
  (« Vos pistes arrivent dans 21 jours », « Rien de noté pour l'instant »). Rien à corriger.

---

## Run du 30/10/2026 08:33 (Paris) — Règles Play d'octobre, concurrents 2026, une nuit comptée deux fois

### I195 (25) — Une nuit de sommeil comptée deux fois quand deux sources la voient [V code + essai Vitest hors dépôt]
- **Besoin servi** : des chiffres fiables (consigne du 27/10 : « ne jamais additionner deux sources des mêmes pas » ;
  même principe pour le sommeil, facteur X clé des analyses).
- **Constat** : `nightlySleep` (`services/radar.js`) additionne toutes les phases endormies (`light`, `deep`, `rem`,
  `asleep`) rattachées au jour du réveil, **quelle que soit la source**. Essai : montre Huawei 23:00–06:00 (240 + 180
  min) et Health Connect 23:05–06:05 (250 + 170 min) → **840 min (14 h)**, gardés car sous le plafond de 960 min.
  `dailyJournal.js:187` fait la même somme (`day._sleep +=`). Touchés : tuile « Sommeil » de l'Accueil, Journal → Jours,
  analyses (`sleepMinutes`, sommeil comme facteur des pistes ventre « à nuit comparable »), Radar, rapport PDF.
- **Qui est concerné** : tout utilisateur avec deux écrivains de sommeil. Montre Huawei en direct + Health Sync
  (passerelle Huawei → Health Connect, toujours la seule voie en septembre 2026, aucune synchro officielle [T fitmesh,
  healthsync.app]) ; Samsung Health + Sleep as Android ; une bague + une montre. Le propriétaire a Samsung Health dans
  Health Connect (pas du 27/10) : à vérifier s'il y écrit aussi des nuits.
- **Piste** : choisir **une source par nuit** au lieu d'additionner (comme les pas par heure) : priorité aux sources
  avec phases, puis à la plus longue durée endormie, la montre Huawei d'abord à égalité ; fonction partagée par
  `nightlySleep` et `dailyJournal`. Choix à la lecture : aucune donnée effacée, rien à migrer. → **POL-PLAY-59**.
- **Impact 5 × faisabilité 5 = 25.**

### I196 (12) — Règles Google Play relues le 30/10 : rien de bloquant, deux points à noter [V aide officielle]
- **Annonce du 29/10/2026** (Play Console → Annonces, lue ce matin) et tableau des échéances : permission « réseau
  local » réservée et déclarée pour les apps qui ciblent Android 17 (25/08/2027) ; « gérer les contacts » restreinte
  (25/08/2027) ; règles des AppFunctions / agents IA (14/04/2027) ; le géorepérage n'est plus un usage de service de
  premier plan, abonnements à remise « sous condition » (étudiants…) à expliciter, sélecteur de contacts et bouton de
  localisation (27/01/2027). **Halcya n'est concernée par aucune** : pas de réseau local (BLE seulement), pas de
  contacts, pas de remise d'éligibilité, localisation **approximative** seulement en API ≥ 31 (`ACCESS_FINE_LOCATION`
  plafonnée à l'API 30 pour le Bluetooth). Rien de neuf sur les apps de santé, Health Connect ou la caméra.
- **Vérification des développeurs** : depuis le **30/09/2026**, les apps doivent être enregistrées dans la Play Console
  sous peine de retrait ; Google dit que 99 % des apps Play l'ont été automatiquement [V support.google.com 10788890].
  → vérification de 2 minutes pour le propriétaire (P34). Côté sideload : obligation appliquée au Brésil, en Indonésie,
  à Singapour et en Thaïlande depuis le 30/09/2026, **mondiale en 2027 sans date publiée** [T androidauthority,
  gsmarena] ; une app distribuée hors Play peut être enregistrée **depuis la Play Console** [V developer.android.com
  /developer-verification]. L'APK GitHub signé avec la clé de debug publique ne pourra pas l'être tel quel → **VEILLE-1**
  (rattacher l'enregistrement à la migration de clé déjà prévue dans `INFRA.md`).
- **Impact 3 × faisabilité 4 = 12.**

### I197 (12) — Concurrents en octobre 2026 : le terrain se remplit, notre angle tient [T fiches et sites]
- **FoodLog: IBS & Gut Health** (iOS et Android, fiche Play mise à jour le 25/10/2026) : base FODMAP, « analyse de
  motifs » et export PDF / CSV **en premium**, méthode non décrite. **Plop** (plopdiary.com) : le plus proche de notre
  discours « local » — données sur l'appareil par défaut, sauvegarde chiffrée facultative, échelle de Bristol, rapport
  PDF fait sur l'appareil, motifs visibles après **2 à 3 semaines**, mode « aidant » (enfant, parent âgé) ; **aucune
  montre** (Apple Santé « prévu »). **Gut Health IBS Symptom Tracker** : résumé IA « Pro » qui envoie noms d'aliments et
  symptômes à une IA tierce. Nombreuses apps « IA scanne ton assiette » (FODMAPai, FODMAP Snap, Gut Lens), avis qui
  doutent de leurs teneurs.
- **Cara Care** : à corriger dans nos notes. Ce n'est pas « abandonnée sur Android » : la version **DiGA sur
  ordonnance** (Allemagne, Bayer depuis 2025, code d'activation de 16 chiffres donné par la caisse, 90 jours) existe sur
  iOS et Android, notée 4,4 [T diga-verzeichnis.de, cara.care]. La version **grand public**, elle, n'existe plus en
  France. Aucune de nos pages publiques ne la cite (vérifié : `app/`, fiche Play).
- **Ce qui reste à nous** (à garder dans la fiche et le paywall, sans dénigrer personne) : montres (Health Connect +
  Huawei en direct), délais 2–48 h et **honnêteté statistique publiée** (« pas encore assez de données »), FODMAP par
  sous-groupe avec sources citées, réintroduction guidée, bien-être estimé sur l'appareil, français d'abord. Plop
  montre que « local par défaut » ne suffit plus comme seul argument : le mettre **après** les montres et les délais.
- **Idée tirée de Plop, pour plus tard** : rien pour l'« aidant » (18+ et une personne par téléphone chez nous).
- **Impact 3 × faisabilité 4 = 12** (texte de fiche à revoir au jalon 10 ; pas de code).

### I198 (16) — « Quand consulter » : une ligne statique, jamais une alerte [V sources médicales françaises]
- **Besoin servi** : une app pour le ventre doit rappeler, sans alarmer, les signes qui ne sont **pas** du SII.
  Aujourd'hui seule la réintroduction le dit (`Reintroduction.jsx:71`).
- **Signes d'alarme** cités par les synthèses françaises : âge > 50 ans au début des symptômes, amaigrissement, sang
  dans les selles (rectorragies), anémie, fièvre, symptômes **nocturnes**, apparition ou changement récent, antécédent
  familial de cancer colorectal ou de MICI [V Progrès en urologie 2010 (synthèse SII) ; Le Quotidien du médecin,
  « Intestin irritable : gare aux pathologies organiques »]. La page ameli « que faire, quand consulter » a refusé la
  lecture (403) : à relire au prochain run « idées ».
- **Piste** : une phrase fixe sous le chevron de la carte « Votre ventre » et en pied du rapport PDF ; jamais déclenchée
  par les données (une détection serait une fonction médicale, règle « jamais diagnostiquer »), jamais en rouge, même
  texte partout. → **POL-PLAY-60**.
- **Impact 4 × faisabilité 4 = 16.**

**Sources (30/10/2026)** : support.google.com/googleplay/android-developer/announcements/13412212 (annonces du 15/07 et
du 29/10/2026) ; support.google.com/googleplay/android-developer/table/12921780 (échéances) ;
support.google.com/googleplay/android-developer/answer/10788890 ; developer.android.com/developer-verification ;
androidauthority.com (calendrier de la vérification, première vague) ; gsmarena.com (calendrier) ;
play.google.com (fiches FoodLog, FODMAP Snap, CareClinic, IBS Tracker) ; apps.apple.com (FoodLog, Gut Lens, FODMAPai) ;
plopdiary.com/en ; diga-verzeichnis.de/digas/verdauung/reizdarm ; cara.care ; bayer.com (rachat de HiDoc) ;
fitmesh.fit (Huawei et Health Connect, 25/09/2026) ; healthsync.app ; urofrance.org (Progrès en urologie 2010) ;
lequotidiendumedecin.fr. Inaccessibles : ameli.fr (403), fiche Play FoodLog (page tronquée), apkcombo.com (hors
réseau autorisé).

---

## Run du 29/10/2026 20:33 (Paris) — Campagne des testeurs et accès à la production

### I194 (22) — Faire réussir le test fermé du premier coup [V sur l'aide officielle ; T pour les causes de refus]
- **Besoin servi** : la mise en production (le seul clic du propriétaire) dépend d'un test fermé validé par Google.
  Un refus coûte au moins 14 jours de plus.
- **Règles officielles** (support.google.com/googleplay/android-developer/answer/14151465, lue le 29/10) [V] : comptes
  personnels créés après le 13/11/2023 ; **au moins 12 testeurs inscrits sans interruption pendant au moins 14 jours**
  au moment de la demande ; un testeur qui quitte puis revient doit refaire **14 jours consécutifs** (les jours
  d'avant ne comptent plus). Le formulaire a **3 parties, 10 questions** : (1) facilité de recrutement (choix),
  (2) les testeurs ont-ils utilisé toutes les fonctions, (3) l'usage ressemblait-il à la production, (4) résumé des
  retours, (5) comment ils ont été collectés ; (6) public visé, (7) valeur apportée, (8) installations estimées la
  1re année (choix) ; (9) changements faits grâce au test, (10) comment vous avez jugé l'app prête. Google conseille
  un canal de retour clair, de lire *Commentaires des testeurs* dans la Play Console, de **répondre et corriger**, et
  avertit que « Supprimer » ou quitter la page sans « Suivant » perd les réponses.
- **Causes de refus rapportées** (choicely, testerscommunity, extendsclass, levelup ; sources commerciales) [T] :
  « engagement insuffisant » (installés une fois puis oubliés, proches surtout) ; réponses vagues ; plantages ou ANR
  non corrigés du rapport de pré-lancement. Les sources se contredisent sur la remise à zéro sous 12 : on garde la
  règle prudente (inviter 15, rappel au jour 7).
- **Ce qui est préparé (sans code)** : `INVITATION-TESTEURS.md` §4 (4 messages « missions » jours 1, 3, 7, 10 qui
  couvrent onboarding, photo de repas, bilan du ventre, Journal et Tendances, Sources, réintroduction, PDF et export,
  avis) et §5 (10 réponses en anglais avec traduction, champs `<…>` à remplir au jour 12) ; `PRODUIT.md` §4 bis
  (tableau des changements pendant le test) et P30 ; formule de recalage de `until` (invitation + 14 + 10 jours).
- **Limite honnête** : en 14 jours, aucun testeur ne voit de piste (21 jours de repas, 28 jours de ventre) ni de
  résultat de réintroduction ; la réponse 3 le dit et renvoie aux bancs simulés.
- **Écarté** : une carte « mission du jour » dans l'app pendant la période de lancement (code visible de tous les
  utilisateurs play, et la période sert aussi au lancement public) ; les services payants de testeurs (comptes
  inconnus, engagement factice : c'est précisément ce que Google détecte).
- **Étapes** : **TF-1** et **TF-2** dans `BACKLOG.md`.

---

## Run du 29/10/2026 08:33 (Paris) — FODMAP : des valeurs qui collent aux repères, et les aliments courants couverts

**But** : la demande du 26/10 14:45 (« vérifie bien que la base est fiable ») appliquée aux mesures FODMAP elles-mêmes,
pas seulement à Ciqual. Méthode : relecture de `fodmapMeasurements.json` (45 aliments) et de `fodmapGroups.js`
(repères Varney 2017 : fructanes et GOS 0,3 g, fructose en excès 0,15 g, lactose 1 g, polyols 0,4 g par portion),
puis lecture des sources ouvertes. Aucun code produit. Résultat : **N3d à N3f** dans `BACKLOG.md`.

### Sources lues (29/10)
- **Liljebo T. et al., BMC Nutrition 2020;6:47** (doi 10.1186/s40795-020-00374-3, PMC7499970) : article **CC BY 4.0,
  données CC0** [V]. Le supplément `40795_2020_374_MOESM1_ESM.pdf` (15 p.) donne, aliment par aliment et avec la
  référence primaire, les 20 aliments les plus riches pour chaque groupe (fructanes, GOS, lactose, polyols) et les
  aliments les plus consommés. Valeurs **compilées** depuis des articles publiés (Muir 2007 et 2009, Biesiekierski 2011,
  Whelan 2011, Yao 2014, Haskå 2008, Andersson 2009) : à citer en confiance `citée` (comme Wang & Cheong 2023), jamais
  en `mesure`. Ce ne sont pas des données d'application Monash : ce sont les articles scientifiques de cette équipe,
  ce que la consigne autorise. Sorbitol et mannitol y sont additionnés (« polyols ») sauf mention dans la colonne
  commentaire (« Sorbitol », « Mannitol »).
- **Ferjančič 2024** (déjà utilisé) : le tableau 1 a 40 aliments ; **23 ne sont pas encore repris**, dont 12 « ND »
  (non détecté) [V].
- **Pejcz E. et al., Foods 2019;8:663** (CC BY, PMC6963594) [V] : pains de blé 0,23 à 0,58 g/100 g de matière sèche
  selon la fermentation (−56 à −60 % avec 150 min en deux temps) ; farines 1,18 (type 450) et 1,59 (complète).
- **Miranda J. et al., IJERPH 2020;17:5882** (CC BY) [V] : 87 produits céréaliers espagnols mesurés, mais seulement
  des apports en g/jour publiés : rien de réutilisable par aliment.
- **Écartée : table australienne AFCD / NUTTAB (FSANZ)** [V/T] : licence dérivée d'une CC BY-SA 3.0 et accord
  d'utilisation des données à accepter : le partage à l'identique est risqué pour une app commerciale fermée.

### I191 (18) — Pain, poireau, oignon : des mesures qui divergent de 3 à 15 fois → une fourchette, jamais « bas » [V code]

Les repères de Varney 2017 ont été fixés avec les mesures de l'équipe de Monash (Muir 2007, Biesiekierski 2011). La
table utilise surtout Ferjančič 2024, nettement plus bas pour les aliments qui comptent le plus :

| Aliment (100 g) | Ferjančič 2024 | Série Monash (via Liljebo 2020) | Portion | Avec Ferjančič | Avec Monash |
|---|---|---|---|---|---|
| Pain blanc / tradition | 0,14 | 1,02 (Whelan 2011) | 80 g | 0,11 g → **bas** | 0,82 g → élevé |
| Poireau cru | 0,24 | 3,8 (Muir 2007) | 100 g | 0,24 g → **bas** | 3,8 g → élevé |
| Oignon cru | 1,97 | 6,3 (Muir 2007) | 40 g | 0,79 g → élevé | 2,5 g → élevé |
| Pâtes cuites | 0,33 | 0,34 (Biesiekierski 2011) | 200 g | 0,66 g → élevé | 0,68 g → élevé |

Conséquence aujourd'hui : un sandwich ou une soupe de poireaux sont classés « bas en fructanes » ; ces jours-là
comptent comme « sans fructanes » dans les pistes repas → ventre (facteur `fodmap:fructans`), ce qui dilue le seul
groupe que la plupart des personnes SII cherchent. Les pâtes, elles, sont « élevées » : incohérent pour un utilisateur.
La divergence est réelle et documentée (Pejcz 2019 : la fermentation détruit 56 à 60 % des fructanes du pain ; la
variété d'oignon et la méthode comptent), donc ni l'une ni l'autre valeur n'est « la bonne ».
**Proposition** : un champ `g_high` (borne haute publiée, avec sa propre `source_high` et `ref_high`) quand deux
mesures publiées diffèrent de plus de 2 fois ; `estimateMealFodmap` ajoute `g_high` au `max` existant (le mécanisme
des « < x » sert déjà à ça) : le repas n'est jamais « bas » si la borne haute dépasse le repère ; il est « élevé » si la
borne basse le dépasse ; sinon `probable` (la carte affiche déjà « probable »). Rien n'est inventé, l'incertitude est
dite (« 0,1 à 0,8 g selon les mesures publiées »), et les données personnelles tranchent (l'aliment « pain » reste
testé à part dans les pistes, règle 6). Entrées concernées : pain blanc, pain de tradition, poireau, oignon (3
variantes). Test : 80 g de baguette → `probable`, jamais `bas` ; 100 g de poireau idem ; 40 g d'oignon → `élevé`.

### I192 (17) — Les aliments courants à fructanes « non détectés » ou faibles : Ferjančič en entier [V]

Les 23 lignes de Ferjančič 2024 non reprises couvrent l'ordinaire d'une assiette : carotte 0,11 ; tomate 0,01 ;
laitue 0,01 ; poivron 0,02 ; chou-fleur 0,09 ; brocoli 0,02 ; chou 0,03 ; courgette 0,01 ; haricot vert 0,03 ;
polenta cuite 0,04 ; orge mondé 0,47 ; petits pois en conserve 0,33 ; haricots en conserve 0,24 ; pain bis 0,14 ;
ND : chou-rave, concombre, cornichon, navet aigre, choucroute, pomme de terre cuite et au four, frites, chips, riz
cuit, pétales de maïs. Aujourd'hui, un « poulet, riz, carottes » reste **inconnu** en fructanes faute de mesure, alors
que les trois aliments en sont presque dépourvus. **Proposition** : les reprendre (noms Ciqual exacts, analogies
cuit/cru seulement par l'eau Ciqual comme `legumeGos.mjs`) ; « ND » saisi comme une limite (« < limite de
détection ») et non comme 0 — **à vérifier dans l'article** : la limite de détection du dosage (sinon prendre 0,01,
la plus petite valeur publiée du tableau, comme borne haute prudente). Les aliments faibles sont ceux où les deux
séries s'accordent (pâtes, fruits), donc sans risque de faux « bas ». Effet visible : moins de « inconnu » dans la
carte d'un repas, le calendrier du rapport PDF et le décompte des jours.

### I193 (16) — Fructanes des céréales et polyols des fruits et légumes : Liljebo 2020 [V]

Valeurs `citée` à reprendre, aliment par aliment, en priorité celles qui manquent (la règle « Ciqual d'abord » pour les
polyols tient toujours : ne remplir que si Ciqual ne mesure pas les polyols de l'aliment) :
- **Fructanes** : ail 17,4 (Muir 2007 ; remplace la citation de seconde main Wang & Cheong) ; topinambour 12,2 ; son
  de blé 3,7 (Haskå 2008) ; pain de seigle complet 1,14 (Andersson 2009) ; pain croustillant de seigle 3,2 à 4,27 ;
  semoule 2,25 (Haskå, produit sec) et boulgour / couscous 2,0 (Biesiekierski, sec) → **cuits par l'eau Ciqual**
  (analogie, dérivation recalculable) ; pain complet de blé 0,79 (moyenne Whelan + Biesiekierski).
- **Polyols** (colonne commentaire = sous-groupe) : pruneau 10,8 sorbitol ; abricot sec 6,0 sorbitol ; mûre 4,76
  sorbitol ; prune 2,4 sorbitol ; abricot 1,2 sorbitol (contredit Ciqual « < 0,5 » et MEXT 0,3 déjà en place : garder MEXT, noter l'écart) ;
  nectarine 1,01 sorbitol (Ciqual « < 0,5 » : contradiction, laisser inconnu comme décidé le 27/10) ; chou-fleur 2,96 mannitol ; pois mange-tout 1,16 mannitol ; céleri 1,5
  mannitol (déjà couvert par Ciqual) ; champignon de Paris 2,74 sorbitol + mannitol ; avocat 0,65 ; poivron 0,37 ;
  maïs doux en conserve 0,45.
- **GOS** : « Green peas 1,88 » correspond aux **pois cassés bouillis** d'après le texte de l'article : ne pas
  l'appliquer aux petits pois frais ; soja 0,79 ; lentilles cuites 0,46 et haricots blancs cuits 0,42 (à comparer aux
  valeurs Siva × Njoumi déjà en place, qui priment car recalculables).
Correspondance Ciqual vérifiée le 29/10 (noms exacts présents) : « Semoule ou graine de couscous, cuite, sans sel
ajouté », « Boulgour de blé, cuit, sans sel ajouté », « Son de blé », « Topinambour, cru », « Pain complet ou intégral
(à la farine T150) », « Pain de seigle et froment », « Chou-fleur, cru », « Prune, sans noyau, crue », « Mûre (de
ronce), crue », « Pois mange-tout ou pois gourmand, cru », « Avocat, chair sans peau, sans noyau, cru », « Maïs doux,
appertisé, égoutté », « Poivron rouge, cru ». Analogies cuit ← cru à prévoir pour « Oignon cuit », « Poireau, cuit »,
« Ail, rôti/cuit au four » (par l'eau Ciqual ; les fructanes résistent à la cuisson à sec, une partie passe dans
l'eau de cuisson : confiance basse).

## Run du 28/10/2026 08:33 (Paris) — Audit écran par écran de la version Play (vierge + démo)

**But** : nourrir le polissage avant l'invitation des testeurs (décision du 27/10 13:00) avec des défauts concrets,
classés par impact, pour que chaque run de code en prenne un sans rien chercher. Méthode : `npm run visual -- --play
--empty` (thème clair, premier lancement) puis `--play --dark` (75 jours de démo), 20 et 29 captures relues
(Accueil, Journal ×4, Analyses, Sources, Montre, Historique du bien-être, Premium, Paramètres, Onboarding). Aucun
code produit. Résultat : **POL-PLAY-21 à 28** dans `BACKLOG.md`.

### Ce qui va bien (à ne pas casser)
- Onboarding « 01/05 » fidèle à la maquette ; « 0 Mo envoyé à Halcya sans votre accord » honnête ; 18 ans rappelé.
- États vides explicites partout (Journal, Repas, Montre, Historique du bien-être, pistes « 0/21 ») : aucun zéro
  trompeur, aucune carte cassée ; carte ventre en pêche, carte bien-être en menthe, pistes en lilas.
- Journal › Jours désormais coloré par thème ; Tendances sans couleur d'alerte (POL-PLAY-20).

### I189 (18) — Le relais garde des compteurs durables : le dire, et les faire expirer (POL-PLAY-30) [V code]

Constat du 28/10 20:33 : depuis P24, le registre des crédits est recopié dans Firestore (`relay/src/credits.js`,
`createFirestoreStore`, collection `credits`, un document par empreinte SHA-256 de l'identifiant d'installation),
**sans date d'expiration**. Or la politique de confidentialité dit « ces compteurs, en mémoire, jusqu'à leur
renouvellement » (`app/public/privacypolicy.html`), Données dit « Nos serveurs ne gardent rien : il n'y a rien d'autre
à effacer » (`Data.jsx:314`) et Paramètres « Notre serveur ne garde rien » (`Settings.jsx:43`,
`permissionDisclosures.js:100`). Ce ne sont pas des données de santé (empreinte d'un identifiant aléatoire + nombres
d'analyses), et le formulaire Sécurité des données est déjà prudent (« éphémère : non »), mais un texte public inexact
est précisément ce qu'un examen Play ou un juriste relève. Proposition : (a) champ `expireAt` écrit à chaque `persist`
(fin du mois suivant + 13 mois : assez pour que les analyses offertes ne reviennent pas, minimisation RGPD) et
politique TTL Firestore (gratuite) posée par le propriétaire — gh-deployer n'a pas le droit d'administrer les index :
`gcloud firestore fields ttls update expireAt --collection-group=credits --enable-ttl --project=healthtrack-824b26` ;
(b) textes : « Notre serveur ne garde ni la photo ni le texte ; il garde seulement, sous une empreinte, le nombre
d'analyses faites (effacé au bout de 13 mois sans usage) » ; Données → Supprimer : « … Seul reste chez nous un compteur
d'analyses sous une empreinte anonyme, effacé seul au bout de 13 mois » ; (c) test qui interdit « ne garde rien » et
« en mémoire » à côté de « compteur ». Option écartée pour l'instant : un appel « effacer mon compteur » au relais
depuis Supprimer (nouvel appel réseau, et un compteur effacé rendrait les 10 analyses offertes : contraire au but).

### I190 (13) — Petits défauts vus en lançant la période de lancement (POL-PLAY-31 à 33) [V captures]

Captures `--play --dark` (démo) et `--play --subscription=launch` (clair) de Paramètres, Données, Réglages,
Onboarding, Premium, Réintroduction, Analyses, Accueil : tout s'affiche, aucune erreur JS ; « Premium offert pendant le
test, jusqu'au … : vous n'avez rien à payer » bien présent dans Paramètres. Défauts : ① Données → « Supprimer toutes
mes données » a le même bouton contour émeraude que « Choisir un fichier à importer » : rien ne signale un geste
irréversible (contour orange `#C2410C` ou texte encre, et la confirmation existante) ; ② Réintroduction : « pas testé »
répété sur les 6 cartes de groupe, et seules les « Fructanes » ont des boutons visibles : on ne voit pas que GOS,
Fructose… se touchent (chevron, et étiquette seulement quand il y a un résultat) ; ③ Accueil, carte lilas : le titre de
la piste est l'action générique `LEVER_ACTIONS` (« Dormir un peu plus longtemps ») : un conseil à l'impératif, alors que
DESIGN.md demande « facteur → effet » (« Nuits plus longues → meilleur bien-être ») ; règle 6 : décrire le lien
personnel, pas prescrire ; ④ Analyses : « Voir les 39 liens incertains » : le nombre impressionne sans rien apprendre
(« Voir les liens incertains »).

### I186 (17) — Le premier écran doit dire ce qu'on a trouvé (POL-PLAY-21) [V captures]
- Sur la démo, Analyses a 2 pistes solides mais l'Accueil répète « Assez de jours pour chercher des pistes… voyez
  l'onglet Analyses ». Le moment de valeur (le « aha » qui justifie le paywall des jours 14–21) est caché un onglet
  plus loin. Proposition : carte lilas « 2 pistes repérées » + la première en une ligne (« Dormir un peu plus
  longtemps · piste solide »), aperçu flou hors premium (même rendu que l'aperçu d'Analyses), toucher = Analyses.

### I187 (16) — Analyses : une phrase, puis les chiffres (POL-PLAY-22, 23) [V captures, V code]
- Les cartes « Autres liens repérés » montrent la ligne mono des statistiques sans qu'on la demande : c'est le
  « tout empilé » que le propriétaire a décrit le 24/10. Les chiffres vont derrière le chevron, comme pour « Pistes à
  tester ».
- Honnêteté : une piste « solide » sur 6 jours d'exposition (Alcool, démo) est plus permissive que la règle des pistes
  ventre (8 jours). `evidenceLevel(q)` ne regarde que q : ajouter un plancher de jours exposés pour « solide ».

### I188 (12) — Cohérence visuelle et textes honnêtes (POL-PLAY-24 à 28) [V captures]
- Deux familles de boutons (pilule / rectangle arrondi) cohabitent ; DESIGN.md dit pilule.
- « Tout reste sur cet appareil » contredit la sauvegarde Android conservée (24/10) et l'appel météo.
- Encart ambre « maux de tête » de la météo : norme générale en couleur d'alerte (règle 6), hors cible ventre.

## Run du 27/10/2026 20:33 (Paris) — Les deux remarques de la Play Console (bord à bord, R8) prêtes à coder

**But** : que le run de code qui traite les deux avertissements « Pour votre prochaine version » du 27/10 n'ait rien
à chercher, et ne casse rien (R8 est la modification la plus risquée du natif depuis des semaines : une classe retirée
par erreur ne plante qu'en version release, jamais en debug ni dans les tests). Lu sur `main` (`a6d9dc5`) le 27/10 ;
pas de SDK Android dans la session : tout ce qui suit est à vérifier par la CI (émulateurs API 35 et 36 existants).

### I184 (18) — Bord à bord pour tous : `EdgeToEdge.enable()` dans `MainActivity` [V dépôt, T forums]
- **Constat** : `targetSdk` 36 → Android 15 et 16 affichent déjà l'app bord à bord (imposé). Sur **Android 8 à 14**
  (minSdk 26), rien ne l'active : l'app s'y affiche sous des barres opaques. C'est exactement le message « Le bord à bord
  peut ne pas s'afficher pour tous les utilisateurs » ; le correctif que Google indique dans ce message est
  `EdgeToEdge.enable()` (Java) pour la rétrocompatibilité [T : forums Flutter, Solar2D, Kodular, AppMySite, 2025-2026].
- **Aucun appel déprécié chez nous** (`setStatusBarColor`, `setNavigationBarColor`, `statusBarColor` dans un thème) :
  `grep` vide sur `app/android/app/src`, `@capacitor/android` 8.2.0 et les plugins. `styles.xml` ne règle que
  `android:windowLightStatusBar` (non déprécié). Le second avertissement possible (« API obsolètes ») n'a pas été
  signalé ; s'il venait, il citerait une bibliothèque (androidx l'appelle lui-même sous Android 15), à noter sans plus.
- **Les encarts sont déjà gérés** : le plugin `SystemBars` de Capacitor 8 (`capacitor.config` : `style: DARK`,
  `insetsHandling` « css » par défaut) injecte `--safe-area-inset-*` sur toutes les versions, et `src/index.css` en
  tire `--safe-top` / `--safe-bottom` (11 usages). Sur Android ≤ 14, ces valeurs passeront de 0 à la vraie hauteur
  des barres : c'est voulu.
- **Code (3 lignes)** : `import androidx.activity.EdgeToEdge;` puis `EdgeToEdge.enable(this);` dans `onCreate` **avant**
  `super.onCreate` (la fenêtre existe déjà ; `BridgeActivity` pose sa vue dans `super.onCreate`). Ajouter la
  dépendance explicite `androidx.activity:activity:$androidxActivityVersion` (1.9.2 déjà déclarée dans
  `variables.gradle`, tirée aujourd'hui seulement par appcompat). Le style par défaut suit le thème du **système** ;
  `SystemBars` (au chargement) puis `SystemBarsPlugin.setStyle` (thème de l'app) passent après et gardent le dernier
  mot sur la couleur des icônes : à vérifier en captures (thème de l'app clair sur un téléphone en mode sombre).
- **Vérification** : ajouter au workflow émulateur un passage **API 30 ou 34** (captures Accueil + une modale + le
  clavier ouvert dans « Décrire ») : en-tête sous la barre d'état mais lisible, barre d'onglets au-dessus de la barre
  de gestes / des 3 boutons, rien sous l'encoche ; API 35 et 36 inchangés. Les deux variantes sont concernées (code
  commun), sans risque pour les données.

### I185 (18) — R8 sur la variante play : optimisation, obscurcissement, réduction [V dépôt, T Capgo]
- **Exigence** (Play Console, Android vitals « Optimisation de l'app ») : obscurcissement, optimisation et réduction
  du code DEX chacun **≥ 25 %** ; appliquée à partir de **février 2027** aux bundles de plus de 10 Mo de DEX [T :
  guide Capgo, oct. 2026, qui cite la page Google]. Nous sommes à 4 % : R8 est simplement coupé.
- **Où** : `app/android/app/build.gradle`, `buildTypes.release` : `minifyEnabled false` + `proguard-android.txt` (qui
  contient `-dontoptimize`). **Seule la variante play est construite en release** (Build & Release fait
  `assembleSideloadDebug`, l'émulateur aussi en debug) : passer `release` à R8 ne touche donc que Play — la sideload
  ne change pas, ce qui est le bon ordre de risque.
- **Réglage** : `minifyEnabled true`, `proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
  'proguard-rules.pro'` ; `shrinkResources` **pas tout de suite** (le visage et les polices passent par des
  ressources et des assets lus par nom : étape à part, gain faible). `proguard-rules.pro` :
  `-keepattributes SourceFile,LineNumberTable` + `-renamesourcefileattribute SourceFile` (traces lisibles avec le
  fichier de correspondance).
- **Ce qui est déjà protégé** : `@capacitor/android` fournit des règles « consumer » qui gardent toute classe
  `extends com.getcapacitor.Plugin` (tous nos plugins maison, dont `PlayBillingPlugin`, `PlayIntegrityPlugin`,
  `FlavorPlugins`, et ceux de npm), leurs `@PluginMethod`, rappels de permission et d'activité, et Cordova ;
  `proguard-android-optimize.txt` garde les `@JavascriptInterface` ; les services, récepteurs, jobs et l'activité
  déclarés dans le manifeste sont gardés par AAPT. Pas de réflexion dans notre code (`Class.forName`, `getMethod` :
  `grep` vide) ; le JSON passe par `JSONObject` et `MiniJson` (pas de sérialisation par noms de champs).
- **Ce qui est à surveiller** (bibliothèques JNI, dont les noms de classes et de méthodes sont appelés depuis le
  natif) : `onnxruntime-android` 1.22.0 et `litert` 1.4.2 (lecture du visage), Health Connect (via
  `@capgo/capacitor-health`, Kotlin), `billing` 8.3.0 et `integrity` 1.6.0 (fournissent leurs règles). Si l'une
  plante en release : règle **étroite** (`-keep class ai.onnxruntime.** { *; }`, `-keep class com.google.ai.edge.litert.** { *; }`
  ou `org.tensorflow.lite.**`), jamais `-keep class ** { *; }` (qui ramènerait le score près de 0).
- **Fichier de correspondance** : AGP 8.10.1 range `mapping.txt` dans `build/outputs/mapping/playRelease/` (et met
  `r8.json` dans l'AAB). `scripts/play/publish.mjs` l'envoie dans la même édition que l'AAB :
  `POST {UPLOAD_API}/{pkg}/edits/{edit}/apks/{versionCode}/deobfuscationFiles/proguard?uploadType=media` (test sur les
  routes simulées comme les autres appels ; échec = avertissement dans le résumé, pas un échec de l'envoi). Le fichier
  ne contient que des noms de classes : rien de secret, mais il ne va **pas** dans la release GitHub publique.
- **Preuve avant merge** (sinon la PR reste ouverte) : un job émulateur API 35 qui installe un **APK play release**
  (`assemblePlayRelease` signé avec la clé de debug **pour ce test seulement**, propriété `-PreleaseDebugSign=true`,
  jamais quand `HT_UPLOAD_KEYSTORE` est là) et rejoue : démarrage sans plantage, lecture du visage à l'ouverture
  (ONNX + LiteRT chargés, un score rendu), Health Connect (écran de permission ouvert), écran Premium (Play Billing
  répond « non disponible » sans planter sur l'émulateur sans compte), création du rapport PDF (partage), notification
  du soir. `adb logcat` sans `ClassNotFoundException` / `NoSuchMethodError` / `UnsatisfiedLinkError`.
- **Découpage** : **R8a** (règles, build, mapping envoyé, job émulateur release ; publication en test interne
  seulement : le propriétaire installe et dit si tout marche) ; **R8b** après une journée sans plantage remonté dans
  Android vitals : la même version peut aller en alpha. `shrinkResources` éventuel en R8c.

**Sources** : [Capgo, « Google Play obfuscation » pour Capacitor](https://capgo.app/blog/google-play-obfuscation-capacitor-android/)
(lu le 27/10) ; fils [AppMySite](https://community.appmysite.com/t/edge-to-edge-may-not-display-for-all-users/2544),
[Solar2D](https://forums.solar2d.com/t/warnings-on-play-console/357455),
[Flutter #169810](https://github.com/flutter/flutter/issues/169810) (texte du message et correctif `EdgeToEdge.enable()`) ;
règles consumer lues dans `node_modules/@capacitor/android/capacitor/proguard-rules.pro` (8.2.0).

---

## Run du 27/10/2026 08:33 (Paris) — Jalon 9 (anglais) prêt à coder : mesure, choix technique, découpage

**But** : que les runs de code du jalon 9 (i18n + anglais) n'aient plus rien à chercher, et que le propriétaire
tranche à temps le seul vrai choix produit (quels pays anglophones). Le chantier FODMAP du 26/10 est livré (N1–N6c) ;
le jalon 9 est le plus gros chantier restant sans spécification. Mesures faites sur `main` (`90569d4`) le 27/10.

### I180 (18) — Ce qu'il y a à traduire, mesuré [V, dépôt]
- **Textes de l'app web** : script jetable (`@babel/parser`, déjà en devDependencies) sur 211 fichiers `src/**/*.js(x)`
  hors tests : **≈ 2 800 chaînes à espaces / accents, ≈ 17 500 mots** (surestimation : messages de journal et de
  diagnostic compris). Par dossier : components 733, pages 678, services 648, devices 407, connectors 136, config 72,
  data 64. Plus gros fichiers : `pages/Recommendations.jsx` 161, `services/faceSense.js` 146,
  `connectors/HealthConnectConnector.js` 120, `devices/huawei/diagnostic.js` 84, `pages/Data.jsx` 79,
  `pages/Onboarding.jsx` 78, `components/FaceSenseCard.jsx` 77, `components/BleDevices.jsx` 75,
  `pages/Reintroduction.jsx` 70, `pages/Connectors.jsx` 69, `config/permissionDisclosures.js` 57,
  `services/report/renderPdf.js` 51.
- **À laisser en français** (mode diagnostic caché, jamais vu par un utilisateur normal) : `devices/huawei/diagnostic.js`,
  journaux de synchro de la montre, écran de diagnostic du visage → ≈ 300 chaînes de moins. Reste **≈ 2 000 chaînes
  visibles, ≈ 12 000 mots**.
- **Formats** : `fr-FR` écrit en dur dans **41 fichiers** ; **14** `.replace('.', ',')` pour la virgule décimale.
- **Natif** : 25 fichiers Java hors tests contiennent du texte français (notifications : bilan du soir, portion du jour,
  reprise de la lecture du visage, synchro montre, Play Billing…), sans `res/values/strings.xml` pour ces textes.
- **Relais** : `relay/src/prompts.js` demande `dish` et `reason` « en français » ; les noms d'ingrédients rendus par
  le modèle sont des **clés** (noms Ciqual français copiés de la liste) : à garder tels quels.
- **Table des aliments** : **Ciqual 2025 publie un nom anglais pour chacun de ses 3 484 aliments** (`alim_nom_eng`
  dans `alim_2025_11_03.xml` de https://zenodo.org/records/17550133, vérifié le 27/10 : 3 484 / 3 484, aucun
  manquant ; ex. « Pastis » → « Pastis (anise-flavoured spirit) »). La table `ingredientsNutrition.json` garde déjà
  `ciqual_code` : l'importeur peut ajouter `name_en` sans traduction maison (+ ≈ 100 Ko non compressés, à mesurer).
  Seuls les **69 alias** de `scripts/nutrition/aliases.mjs` (« Banane », « Riz blanc cuit »…) demandent un nom anglais
  écrit à la main.
- **Tests** : 59 fichiers de test cherchent des textes français (`getByText`…) → ils doivent continuer de tourner en
  français (langue forcée dans `src/test/setup`), sinon des centaines de tests cassent.
- **Nouveautés** : 202 entrées JSON en français ; on ne traduit pas l'historique.

### I181 (17) — Choix technique : un `t()` maison, le français comme clé [V/H]
- **Proposition** : `app/src/i18n/` sans dépendance (≈ 80 lignes) : `t('Plutôt une bonne journée')` ; interpolation
  `t('{n} jours notés', { n })` ; pluriels par `Intl.PluralRules` (`t.plural(n, { one: '…', other: '…' })` — attention :
  en français 0 est « one », en anglais « other », c'est `Intl` qui tranche) ; dates et nombres par `Intl` via
  `i18n/locale.js` qui remplace les 41 `fr-FR` et les 14 `replace('.', ',')` (« 3,4 / 5 » → « 3.4 / 5 »).
  Catalogue `i18n/en.json` { « texte français » : « English text » }. Clé absente → **le français s'affiche** (jamais
  une clé brute ni un vide).
- **Pourquoi le français comme clé** (façon gettext / Lingui) : le code reste lisible et cherchable, les 59 fichiers de
  test ne bougent pas, et une conversion se fait fichier par fichier sans renommer quoi que ce soit. Inconvénient
  connu : modifier une phrase française change sa clé → un **test de catalogue** extrait (même `@babel/parser`) tous les
  `t('…')` littéraux des fichiers déclarés « convertis » et échoue si l'un manque dans `en.json` ou si `en.json` garde
  des clés orphelines.
- **Écartés** : i18next + react-i18next (MIT, ≈ 40 Ko, API plus large que le besoin) ; Lingui (MIT, mais macro Babel
  / SWC à brancher dans Vite 5 et étape de compilation) ; react-intl (BSD-3, ICU complet, plus lourd). Aucun n'apporte
  ce dont des runs d'une heure ont besoin de plus qu'un `t()` testé. À reconsidérer seulement si une 3ᵉ langue arrive.
- **Choix de la langue** : Paramètres → « Langue » (Automatique / Français / English), Automatique = français si la
  langue du téléphone est le français, **sinon anglais** une fois l'anglais complet. Tant que l'anglais n'est pas
  complet, le réglage reste caché derrière `VITE_I18N_EN` (français partout, comme aujourd'hui).
- **Android** : déclarer `res/xml/locales_config.xml` (fr, en) + `android:localeConfig` pour le réglage système
  « Langue de l'app » d'Android 13+ ; textes natifs dans `res/values/strings.xml` (français, langue par défaut) +
  `res/values-en/` ; le JS lit la langue effective **auprès du natif** (petite méthode de plugin) plutôt que
  `navigator.language`, dont le comportement avec une langue par app dans la WebView n'est pas documenté
  **[à vérifier sur l'émulateur]**. Plugins Capacitor tiers repérés pour ce réglage (`@capacitor-trancee/app-language`)
  : inutiles, 10 lignes Java suffisent.
- **Relais** : champ `lang` (fr | en) dans la requête ; `dish` / `reason` dans cette langue ; clés d'ingrédients
  inchangées ; affichage par `name_en`.
- **Lexique de la dictée du soir** (`services/mood/lexicon.js`, FEEL, français) : pas d'équivalent anglais repris sans
  vérification — le lexique NRC VAD, le plus connu, n'est gratuit que pour la recherche (licence commerciale payante)
  **[H : à vérifier avant tout usage ; les normes de Warriner 2013 aussi]** → en anglais, la proposition automatique
  de mots est **désactivée** au départ (la note libre reste).

### I182 (16) — Où vendre en anglais : Royaume-Uni et Irlande d'abord, États-Unis plus tard [T]
- **États-Unis** : deux textes visent directement les apps de santé hors HIPAA. ① La **Health Breach Notification Rule**
  de la FTC, élargie le 26/04/2024 (en vigueur le 29/07/2024), couvre explicitement les apps de santé et compte comme
  « faille » toute divulgation **non autorisée par la personne**, même volontaire (amendes jusqu'à ≈ 51 744 $ par
  infraction) ; ② le **My Health My Data Act** de l'État de Washington (RCW 19.373) : aucun seuil de taille,
  politique de confidentialité **dédiée aux données de santé**, consentement séparé, droit d'action privé. Notre
  modèle local réduit beaucoup le risque, mais l'envoi des photos de repas au relais et l'abonnement en font des
  sujets de juriste. Sources : Federal Register 89 FR 47028 (30/05/2024) ; synthèses Mofo, Mondaq, Fenwick, OneTrust,
  accountablehq (consultées le 27/10, secondaires).
- **Royaume-Uni / Irlande** : RGPD (Irlande) ou UK GDPR, régime proche du nôtre ; questions pour le juriste : frais
  de protection des données de l'ICO et représentant britannique (UK GDPR art. 27) pour un responsable établi en
  France [H].
- **Proposition (P32, décision du propriétaire)** : à la mise en production, pays = France + Belgique, Suisse,
  Luxembourg, Canada (francophones) **puis**, quand l'anglais est fini, Royaume-Uni, Irlande et le reste de l'UE ;
  **États-Unis exclus** jusqu'à une relecture juridique (politique « Consumer Health Data » de Washington). Les pays
  se règlent dans la Play Console (Production → Pays / régions), sans mise à jour de l'app.
- **Concurrence en anglais** (fiches App Store / Play lues le 27/10, chiffres non vérifiés) : *Tract* (SII et MICI,
  « FODMAP stacking » entre repas, iOS), *IBS Tracker: FODMAP Food Guide* (14,99 $ une fois, « données sur
  l'appareil », iOS), *bloaty* (code-barres, FODMAP **par ingrédient**, iOS), sur Android *mySymptoms*, *FODMAP Helper*,
  *Fodmap Snap*, *FoodLog*. La décomposition par sous-groupe se banalise (bloaty) : notre avance reste **l'analyse
  personnelle avec délais + montres + local + Android**. Mots-clés à tester (non mesurés) : « IBS tracker »,
  « FODMAP », « food and symptom diary », « bloating », « gut health », « symptom tracker ».
- **Vocabulaire anglais interdit / préféré** (même règle qu'en français, à mettre dans `wording.test.js` pour `en.json`) :
  jamais *diagnose, detect, predict (a flare), treat, cure, prevent* ; dire *possible link, pattern, estimate — not a
  diagnosis, talk to your doctor*. « piste » → *lead* ou *possible link* (pas *trigger*, qui sous-entend une cause).

### I183 (18) — Découpage du jalon 9 (un run = une étape testable)
1. **9a socle** : `i18n/` (`t`, `t.plural`, `locale.js`), langue forcée `fr` dans les tests, test de catalogue,
   remplacement des 41 `fr-FR` / 14 virgules par `locale.js` ; réglage « Langue » caché (`VITE_I18N_EN`) ; option
   `--lang=en` de `npm run visual` + avertissement si une page anglaise contient encore des lettres accentuées
   françaises ou des mots-outils français (« vous », « les », « des »). **Rien de visible.**
2. **9b** Layout, navigation, Accueil (`TodayCards`…), Paramètres.
3. **9c** Onboarding, Premium / paywall, `permissionDisclosures.js` (divulgations : à relire mot à mot, Play les lit).
4. **9d** Journal, Repas, Nutrition, ligne FODMAP ; importeur Ciqual → `name_en` (3 484 noms officiels) + 69 alias
   anglais à la main ; attribution Ciqual en anglais.
5. **9e** Analyses, Réintroduction, rapport PDF (`buildReport` / `renderPdf`).
6. **9f** Sources, Health Connect, lecture du visage, montre (hors diagnostic).
7. **9g** natif (`strings.xml` + `values-en`, `locales_config.xml`) et relais (`lang`).
8. **9h** fiche Play en-GB / en-US (titre ≤ 30 car. : « Halcya — gut & wellbeing », 24 car.), captures anglaises,
   politique de confidentialité et conditions en anglais sur Pages, `VITE_I18N_EN` allumé. Sécurité des données :
   inchangée (ne dépend pas de la langue).
Coût estimé : 8 runs. Traduction faite par la routine, relue par le propriétaire sur les captures `--lang=en` (P33,
facultatif : faire relire par un anglophone l'onboarding et le paywall).

---

## Run du 26/10/2026 20:33 (Paris) — N3b prêt à coder : d'où viendront les fructanes, les GOS, le sorbitol et le mannitol

**But** : que le run de code N3b remplisse `app/src/data/fodmapMeasurements.json` sans chercher ses sources, avec
uniquement des mesures publiées réutilisables commercialement (jamais Monash ni FODMAP Friendly), et sans fausse
précision. Tout ce qui suit a été lu dans les documents eux-mêmes le 26/10 (sauf mention « cité par »).

### I177 — Sources retenues (par ordre d'usage)

| # | Source | Licence | Ce qu'on y prend | Remarques |
|---|---|---|---|---|
| S1 | **Table de composition japonaise 2020 (8e éd.), volume « glucides »**, MEXT, tableau principal : https://www.mext.go.jp/content/20201225-mxt_kagsei-mext_01110_042.xlsx (md5 `84b49185ce943eece162a586098b0ce7`, mis à jour le 27/12/2021) | Règles du site MEXT : usage commercial permis, compatible CC BY 4.0 ; « les données chiffrées ne sont pas protégées » (https://www.mext.go.jp/b_menu/1351168.htm) | **Sorbitol (`SORTL`) et mannitol (`MANTL`)**, g/100 g, 1 075 aliments, dont 253 avec sorbitol et 190 avec mannitol renseignés | « - » = non mesuré (→ inconnu), « (x) » = estimé par MEXT (→ confiance basse), « Tr » = traces. Exemples : pomme crue 0,5–0,7 sorbitol ; poire « européenne » (2,9) ; pêche jaune 2,7 / blanche 0,3 ; nectarine (0,6) ; abricot (0,3) ; pruneau sec (12,1) ; cerise (2,2) ; champignon de Paris cru mannitol 1,3 ; céleri branche mannitol 1,0. **Non mesurés** : avocat, chou-fleur, patate douce, oignon, ail. |
| S2 | **Ferjančič B. et al. 2024**, « Fructan content in most commonly consumed Slovenian foods… », *Front. Nutr.* 11:1446771, doi:10.3389/fnut.2024.1446771, tableau 1 | CC BY 4.0 | **Fructanes**, % de matière fraîche (= g/100 g), 37 aliments, méthode AOAC 999.03 (Megazyme) | Oignon 1,97 ; poireau 0,24 ; farine de blé T500 0,75 ; pâtes cuites 0,33 ; pain blanc 0,14 ; pain bis 0,14 ; flocons d'avoine 0,32 ; orge 0,47 ; petits pois en conserve 0,33 ; haricots en conserve 0,24 ; amande 0,60 ; noisette 0,73 ; noix 0,37 ; banane 0,11 ; pomme 0,09 ; orange 0,21 ; poire 0,13 ; mandarine 0,11 ; raisin 0,06 ; chou-fleur 0,09 ; carotte 0,11 ; non détecté : pommes de terre (toutes), riz cuit, corn-flakes, concombre, chou-rave, choucroute. |
| S3 | **Siva N. et al. 2019**, « Variability in prebiotic carbohydrates in different market classes of chickpea, common bean, and lentil… », *Front. Nutr.* 6:38, doi:10.3389/fnut.2019.00038, tableaux 4 et 5 | CC BY | **GOS** (raffinose, stachyose, verbascose) et **sorbitol / mannitol** des légumineuses **sèches** (mg/100 g, base 10 % d'humidité) | Moyennes : lentilles raffinose 496 + stachyose 2 292 (+ verbascose 1 354), sorbitol 662, mannitol 22 ; haricots 662 + 2 218 (+ 168), sorbitol 0,8, mannitol 5,5 ; pois chiches 441 + 1 533 (+ 120), sorbitol 515, mannitol 17. |
| S4 | **Natale A. et al. 2025**, « Quantification of naturally occurring prebiotics in selected foods », *Nutrients* 17(4):683, doi:10.3390/nu17040683, tableau 1 | CC BY 4.0 | **GOS** (raffinose + stachyose), g/100 g, produits du commerce italien (HPAEC-PAD) | Boisson au soja 0,039 + 0,230 ; tofu 0,026 + 0,114 ; tempeh < LQ + 0,035 ; yaourt au soja 0,026 + 0,112 ; farine de pois chiche 0,473 + 1,640 ; soja sec 0,513 + 2,810 ; boulgour 0,319 ; semoule 0,237 ; épeautre 0,409 ; son de blé 1,210 ; farine d'avoine 0,101 + 0,164 ; farine de seigle 0,307 ; quinoa 0,057 + 0,046. **Ses « FOS » (kestose, nystose) ne sont pas les fructanes totaux** : ne pas s'en servir pour les fructanes. |
| S5 | **Njoumi S. et al. 2019**, « Soaking and cooking modify the α-galacto-oligosaccharide and dietary fibre content in five Mediterranean legumes », *Int J Food Sci Nutr* 70(5):551–561, doi:10.1080/09637486.2018.1544229 (HAL hal-02310096) | CC BY-NC-ND 4.0 : on ne reprend que des **facteurs chiffrés** (non protégés), cités | **Pertes de GOS au trempage et à la cuisson** : trempage −10 % (lentille, fève) à −40 % (pois chiche) ; cuisson après trempage : raffinose −32 %, stachyose −25 %, verbascose −35 %. Tableau 1 (sec, mg/100 g MS) : lentille raffinose 283, stachyose 1 829, verbascose 850 ; pois chiche 516, 1 824, 82. | Sert seulement à l'**analogie documentée** « cuit depuis sec » (ci-dessous). |

**Écartées ou en attente** : Muir 2007 / 2009, Biesiekierski 2011, Yao 2014, Whelan 2011 (articles de l'équipe Monash, payants : citables en principe car ce sont des articles, mais **non lus** — ne rien reprendre sans avoir lu le tableau) ; la revue Wang & Cheong 2023 (*Molecules* 28:1613, CC BY) cite d'après Muir l'ail ≈ 17,4 g/100 g, l'échalote ≈ 8,9, le topinambour ≈ 12,2, le blé 1–4 : utilisable seulement en **confiance basse** (« cité par une revue »), faute de mieux pour l'**ail** et l'**échalote**, qui n'ont aucune autre mesure ouverte trouvée ; la base suédoise de Liljebo, Störsrud et Andreasson 2020 (*BMC Nutrition*, doi:10.1186/s40795-020-00374-3, CC BY 4.0) n'est qu'une compilation de ces mêmes articles (utile pour la liste des sources primaires et sa méthode de conversion sec → frais par l'eau de la table nationale) ; Frida (Danemark) : pas de sorbitol / mannitol trouvé, conditions d'usage commercial à vérifier.

### I178 — Règles de calcul proposées pour N3b

1. **Une source par aliment et par groupe**, la plus proche de l'aliment tel que mangé (cru / cuit, frais / sec) ;
   les autres valeurs vont dans un champ `notes` (pas dans le calcul). Écarts à assumer : l'oignon vaut 1,97 g/100 g
   chez Ferjančič mais 6,3 dans la base suédoise (d'après Muir 2009) — les fructanes varient fortement selon la
   variété et la méthode ; avec le repère de 0,3 g par portion, 70 g d'oignon dépassent dans les deux cas.
2. **GOS = raffinose + stachyose** (comme les mesures qui ont servi aux repères de Varney 2017) ; la verbascose, quand
   elle est mesurée, va dans `notes` (elle fermente aussi : à revoir si les données personnelles le demandent).
3. **Cuit depuis sec (légumineuses), en `analogie`** : `GOS_cuit = GOS_sec × (100 − eau_cuit) / (100 − eau_sec) ×
   rétention`, eau prise dans Ciqual, rétention = (1 − perte au trempage) × (1 − perte à la cuisson) d'après S5
   (lentille ≈ 0,9 × 0,72 ≈ 0,65 ; pois chiche ≈ 0,6 × 0,72 ≈ 0,43). Ordre de grandeur pour une lentille verte cuite
   (≈ 70 % d'eau) : 2,79 g × 0,33 × 0,65 ≈ 0,6 g/100 g → 150 g ≈ 0,9 g, au-dessus du repère, comme attendu.
   Ciqual n'a pas d'eau dans `ingredientsNutrition.json` : l'importeur doit la garder (champ `water_g`) ou la
   relire depuis le fichier Ciqual au moment de construire `fodmapMeasurements.json`. Conserves : ajouter le
   jus d'égouttage comme perte supplémentaire non chiffrée → confiance basse, sans autre correction.
4. **Sorbitol / mannitol : Ciqual d'abord.** Quand Ciqual publie des polyols totaux > 0 (poire 2,02 ; pêche 0,72 ;
   pruneau sec 9,6 ; céleri 0,8 ; champignon de Paris 0,28), on **répartit ce total** selon les proportions de S1
   (ou S3) ; la valeur absolue de S1 va dans `notes` (champignon : 1,3 g chez MEXT contre 0,28 total chez Ciqual —
   gros écart, on garde Ciqual et on le dit). Quand Ciqual n'a rien (pomme : `null`), on prend S1 tel quel.
   Quand une seule des deux colonnes S1 est mesurée (« - » pour l'autre), la répartition est en `analogie`.
5. ⚠️ **Correction à faire dans N3a (bug de méthode trouvé ce soir)** : `fodmapGroups.js` compte une teneur Ciqual
   « < x » comme 0 avec le statut `traces`, donc le niveau du repas peut sortir `bas`. Or pour les polyols la limite
   Ciqual est souvent « < 0,5 » g/100 g : **avocat, chou-fleur, lentilles et pois chiches cuits** ont « < 0,5 » ; une
   portion de 100 g pourrait contenir jusqu'à 0,5 g, au-dessus du repère de 0,4 g. Règle proposée : une teneur
   « < x » donne `bas` seulement si `portion × x / 100` reste sous le repère ; sinon le groupe reste `inconnu` (ou
   prend la mesure publiée si elle existe). L'exemple de l'oignon reste juste : lactose « < x » avec une petite limite
   → bien sous 1 g. À couvrir par un test (avocat 100 g → sorbitol `inconnu`, pas `bas`).
6. **Trous assumés** (resteront « inconnu » faute de mesure ouverte trouvée) : sorbitol de l'avocat, mannitol du
   chou-fleur et de la patate douce, fructanes de l'artichaut et du seigle (hors farine), GOS des noix de cajou et
   pistaches. Les runs « idées » suivants peuvent chercher encore ; rien n'est inventé.
7. **Mise en forme** : chaque entrée de `foods` porte `source` (clé de `sources`, avec titre, doi, licence, tableau),
   `confidence` (`mesure` ou `analogie`), `analogy_of` pour une analogie, et `notes`. Le test existant vérifie déjà
   que la source est déclarée et que l'aliment existe. Ajouter un test « aucune valeur sans source » et un test de
   plausibilité (g/100 g ≤ glucides Ciqual de l'aliment quand ils sont connus).

### I179 — Correspondance de départ (noms exacts de `ingredientsNutrition.json`)

| Aliment de la table | Groupe(s) | Source |
|---|---|---|
| `Oignon, cru` | fructanes | S2 (oignon, 1,97) |
| `Poireau, cru` | fructanes | S2 (0,24) |
| `Ail, cru`, `Échalote, crue` | fructanes | revue Wang & Cheong 2023 citant Muir 2007 — `analogie`, confiance basse |
| `Pâtes cuites` | fructanes | S2 (pâtes cuites, 0,33) |
| `Pain blanc (par ex. : baguette, boule…)`, `Pain de tradition française (par ex. : baguette, boule…)` | fructanes | S2 (pain blanc, 0,14) |
| `Farine de blé tendre ou froment T…` | fructanes | S2 (T500, 0,75) — `analogie` pour T110 / T150 |
| `Flocons d'avoine` | fructanes, GOS | S2 (0,32) ; S4 (farine d'avoine, 0,265) |
| `Amande, avec peau, sans sel ajouté`, `Noisette, sans sel ajouté` | fructanes | S2 (0,60 ; 0,73) |
| `Banane, chair sans peau, crue`, `Orange, chair sans peau, sans pépins, crue` | fructanes | S2 (0,11 ; 0,21) |
| `Pomme, chair et peau, crue` | fructanes, sorbitol | S2 (0,09) ; S1 (pomme avec peau, sorbitol 0,5) |
| `Poire, chair et peau, crue` | fructanes, sorbitol | S2 (0,13) ; Ciqual 2,02 réparti selon S1 (sorbitol) |
| `Pêche, chair et peau, sans noyau, crue`, `Nectarine ou brugnon, … crue` | sorbitol | Ciqual total réparti selon S1 |
| `Abricot, dénoyauté, cru`, `Pruneau, sans noyau, sec` | sorbitol | S1 (0,3 estimé ; 12,1 estimé) / Ciqual (« < 0,5 » ; 9,6) |
| `Champignon de Paris ou champignon de couche, cru` | mannitol | Ciqual 0,28 réparti selon S1 (mannitol seul) ; S1 1,3 en note |
| `Céleri branche, cru` | mannitol | Ciqual 0,8 réparti selon S1 (mannitol seul) |
| `Lentille verte / blonde / corail, bouillie/cuite à l'eau` | GOS | S3 sec × règle 3 (`analogie`) |
| `Pois chiche, bouilli/cuit à l'eau`, `Pois chiches cuits` | GOS | S3 sec × règle 3 (`analogie`) |
| `Haricot rouge / blanc, bouilli/cuit à l'eau` | GOS | S3 sec × règle 3 (`analogie`) |
| `Tofu`, `Tofu nature, préemballé`, `Tempeh`, boissons au soja | GOS | S4 (mesures directes) |

**Ce qu'il faut afficher (N4) avec ces données** : la source de chaque teneur dans les détails de la carte d'un repas
(« fructanes : mesure publiée, Ferjančič 2024 » ; « estimation à partir des lentilles sèches ») et, pour une confiance
basse, une formulation prudente (« probablement riche en GOS »). Les trous restent « on ne sait pas encore ».

Sources consultées le 26/10/2026 : [Ferjančič 2024](https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2024.1446771/full),
[Siva 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6462997/), [Natale 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11858256/),
[Njoumi 2019 (HAL)](https://hal.science/hal-02310096v1), [MEXT 2020, glucides](https://www.mext.go.jp/a_menu/syokuhinseibun/mext_01110.html),
[conditions MEXT](https://www.mext.go.jp/b_menu/1351168.htm), [Liljebo 2020, BMC Nutrition](https://bmcnutr.biomedcentral.com/articles/10.1186/s40795-020-00374-3),
[Wang & Cheong 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC9967297/), [Alowo 2025](https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2025.1520510/full)
(sorgho, millet, soja, sésame ; non retenu pour nos aliments).

## Run du 26/10/2026 08:33 (Paris) — jalon 7 prêt à coder : réintroduction FODMAP guidée et rapport PDF

Contexte : le jalon 5 (pistes repas → ventre) est affiché depuis le 26/10 03:33 et renforcé jusqu'à 07:33 (I134). Le
jalon 7 est le suivant ; deux de ses trois promesses sont déjà affichées dans le paywall comme « en préparation »
(`config/premiumBenefits.js` : `fodmap`, `pdf-report`). Ce run fixe le protocole, les écrans, le modèle de données et
la technique du PDF pour que les runs de code n'aient qu'à suivre.

### Ce qu'on apprend (faits)
- **Protocole clinique** [V, fiche patient NHS Gloucestershire, mise à jour 02/2023, PDF lu en entier] : attendre
  **au moins 3 jours de symptômes minimes** avant chaque test ; même aliment les 3 jours ; **jour 1 = portion de
  départ, jour 2 = double, jour 3 = triple**, en regardant les **24 h** qui suivent ; gêne jugée inacceptable → on
  s'arrête là et on retestera plus tard avec moins ; arrêt à J2 ou J3 = « une petite quantité passe » / « une
  portion modérée passe, pas sans limite » ; pas de gêne à J3 = groupe toléré, résultat **étendu au groupe**
  (fructose, lactose, GOS, polyols) **sauf les fructanes, à tester source par source** (blé, oignon, ail…) ; sorbitol
  et mannitol **testés séparément** ; on ne réintroduit durablement **qu'après la fin de tous les tests** ; pas de
  repas dehors ni de café / alcool en plus pendant les 3 jours. Portions de départ : blé 1 tranche de pain (ou
  5 c. à s. de pâtes cuites) ; oignon 1 c. à s. cuit ; ail ¼ de gousse ; autres fruits / légumes à fructanes 40 g ;
  GOS 2 c. à s. de légumineuses (pois chiches, lentilles…) ; fructose ¼ de mangue ou 1 c. à c. de miel ; lactose
  125 ml de lait demi-écrémé ou 125 g de yaourt nature ; sorbitol 3 c. à s. de maïs doux ou ¼ d'avocat ; mannitol
  2 c. à s. de chou-fleur, ¼ de branche de céleri ou 3 c. à s. de patate douce.
- **Monash** [V, blog « Reintroduction using the diary function »] : chaque sous-groupe sur **~3 jours**, un aliment
  à la fois, sur fond pauvre en FODMAP ; **arrêt si symptômes désagréables à J1 ou J2** ; des gaz ou ballonnements
  légers qui ne gênent pas la journée = **réussi** ; **combinaisons en dernier**, une fois les tolérances
  individuelles connues ; ordre libre (commencer par un aliment qu'on mange souvent, ou qu'on pense bien tolérer).
  Pas de durée de pause chiffrée.
- **Variantes** [T, FODMAP Friendly, A Little Bit Yummy, UH Liverpool] : doses et ordres diffèrent d'une source à
  l'autre (lait 125/250/375 ml chez l'un, 60 → 250 ml chez l'autre ; GOS 40/80/120 g) → **aucune table n'est « la »
  norme** : la nôtre est une hypothèse de départ affichée comme telle (règle 6), modifiable par la personne ou sa
  diététicienne. Les portions Monash de son application sont sa propriété : on ne les copie pas ; la fiche NHS est
  une information publique de santé, on reprend des ordres de grandeur avec nos mots et en citant la source.
- **Rapport pour le médecin** [T, guides de journaux SII ; V, carte « Bristol Stool Form Scale » de la Rome
  Foundation] : ce que demandent les médecins = 2 à 4 semaines d'affilée, aliments avec l'heure, forme des selles
  (échelle de Bristol, 7 types), douleur (intensité, soulagée ou non après les selles), sommeil / stress / cycle /
  médicaments ; **un court résumé des tendances**, car un journal brut est rarement lu ; signes d'alerte (sang,
  perte de poids inexpliquée, diarrhée qui réveille la nuit) à faire voir rapidement. Rome IV classe les sous-types
  par la part de selles de types 1–2 et 6–7 sur les jours anormaux (seuil 25 %) — **on montre la répartition, jamais
  le sous-type** (ce serait un diagnostic).
- **Technique PDF** [V, registre npm le 26/10] : `pdf-lib` 1.17.1 (MIT) + `@pdf-lib/fontkit` 1.1.1 (MIT) génèrent
  un PDF dans la WebView, hors ligne, avec **Figtree et IBM Plex Mono embarquées** (OFL 1.1 : l'incorporation dans un
  document est permise) ; `jspdf` 4.2.1 (MIT) est plus lourd et moins net pour les polices. L'export JSON actuel
  (`pages/Data.jsx`) écrit déjà dans `Directory.Documents` avec `@capacitor/filesystem` : même chemin pour le PDF,
  aucun nouveau plugin natif. `window.print()` ne marche pas dans la WebView Capacitor : écarté.

### Idées
- **I174 (25) — Réintroduction guidée : machine à états pure + 4 écrans [V].** Précise I135. Besoin : la promesse
  premium « réintroduction FODMAP guidée » (jalon 7), et la réponse honnête aux pistes « à confirmer » (I171 b).
  - **Données** : nouvelle entrée `fodmap_challenge` (une par test) dans le magasin des entrées existant (aucune
    migration de schéma : type nouveau, exporté / importé comme les autres, ignoré par les anciens fichiers) :
    `{ group, food, doses: [{day, amount, unit, at}], state, startedAt, endedAt, verdict, blind?, note }`. Les
    notes du ventre restent les entrées `gut` existantes : le verdict se **calcule** à partir d'elles (aucune donnée
    en double).
  - **Machine** (`services/fodmapChallenge.js`, sans React) : `ready` → `day1` → `day2` → `day3` → `washout` →
    `done` ; garde de départ = **3 bilans du ventre « calme » d'affilée** (bilans du soir I170 ou aucune note de gêne
    sur 3 jours) — sinon « On attend que votre ventre soit calme : ça rend le test lisible » ; à chaque jour, la
    fenêtre est **les 24 h après la prise** ; gêne ou douleur dans la fenêtre → question « C'est supportable ? »
    (oui = on continue, Monash : léger = réussi ; non = arrêt) ; arrêt à J1 → « à retester plus tard, en plus
    petit », J2 → « une petite portion passe », J3 → « une portion moyenne passe », sans gêne → « bien toléré à cette
    dose » ; `washout` jusqu'à 3 jours calmes (pas de durée fixe) ; **un seul test à la fois** (le suivant est
    refusé pendant un test ou une pause) ; un verdict sur fructose / lactose / GOS / sorbitol / mannitol vaut pour le
    groupe, sur les fructanes **seulement pour cet aliment** ; combinaisons proposées seulement quand ≥ 2 groupes
    sont « bien tolérés ». Un jour sauté décale le test (aucune dose rattrapée en double) ; 2 jours sautés → le test
    est mis en pause et repart de J1 (« pour garder un résultat lisible »).
  - **Écrans** (Analyses, carte lilas « Tester un groupe », et lien depuis chaque piste ventre « Vérifier avec une
    réintroduction guidée ») : ① choix du groupe — 7 cartes (Fructanes · blé, oignon, ail ; GOS ; Fructose ;
    Lactose ; Sorbitol ; Mannitol ; Combinaisons, grisée), l'état de chacun en étiquette (« pas testé », « bien
    toléré », « petite portion », « à retester »), les aliments suggérés en premier si une piste ventre les cite ;
    ② préparation — l'aliment, les 3 portions (« jour 1 : 1 tranche de pain · jour 2 : 2 · jour 3 : 3 », modifiables,
    étiquette « repère général, à adapter avec votre diététicienne »), 3 conseils courts (pas de repas dehors, pas
    plus de café ni d'alcool que d'habitude, les autres repas pauvres en FODMAP), rappel à l'heure choisie (même
    mécanisme que `gutEvening.js`), bouton « Commencer » ; ③ jour en cours — frise J1 / J2 / J3 / pause, « J'ai
    mangé ma portion » (un geste, horodaté), puis la carte ventre habituelle ; ④ résultat — une phrase (« Blé :
    une portion moyenne passe (2 tranches). Au-delà, gêne. »), la frise, « Une estimation de votre ventre, pas un
    diagnostic. L'attente joue aussi : vous pouvez refaire le test, à l'aveugle avec un proche. » + « Refaire le
    test ».
  - **À l'aveugle (I171 c)** : option à l'étape ② — un proche prépare 3 jours où l'aliment est présent ou non (l'app
    tire l'ordre, l'affiche seulement au proche derrière « Je suis le proche · afficher »), la personne note son
    ventre sans savoir ; levée de l'aveugle au résultat. Deuxième temps (après la version simple).
  - **Garde-fous** : texte testé par `wording.test.js` (jamais « intolérance », « allergie », « traitement ») ;
    phrase d'entrée « À faire de préférence avec une diététicienne. En cas de sang dans les selles, de perte de
    poids ou de diarrhée la nuit, parlez-en d'abord à votre médecin. » ; le régime d'éviction n'est **pas** proposé
    par l'app (hors de notre rôle : on accompagne la réintroduction, sur un fond que la personne gère). Règle 5 :
    le ventre n'entre jamais dans l'estimateur du bien-être.
  - **Premium** : toute la saisie reste gratuite (« J'ai mangé ma portion » et les notes du ventre sont des
    données) ; le guidage (machine, rappels, verdict) est premium ; sans premium, la carte montre ce que fait la
    fonction et le bouton Débloquer. Dans la période de lancement (P23), tout le monde y a accès.
  - **Tests** : table de transitions (chaque état × chaque évènement), refus d'un 2e test pendant la pause, garde
    des 3 jours calmes, fenêtre 24 h (une note à 25 h ne compte pas pour ce jour), jour sauté, fructanes non
    généralisés, import d'un ancien fichier sans `fodmap_challenge`, export / import aller-retour.
  - Découpage : **7a** machine + données + tests (rien d'affiché) ; **7b** écrans ①–④ et rappel ; **7c** lien depuis
    les pistes ventre + étiquettes d'état dans la carte lilas ; **7d** à l'aveugle. Impact 5, faisabilité 4.
- **I175 (20) — Rapport PDF pour le médecin : 2 pages, local, résumé d'abord [V/T].** Besoin : la promesse premium
  « rapport PDF » ; utile au premier rendez-vous et pour les diététiciennes (canal d'acquisition).
  - **Contenu** (période au choix : 2, 4 ou 12 semaines ; défaut 4) — page 1 « En bref » : période, nombre de jours
    notés, part des jours calmes / gêne / douleur (barre), évolution semaine par semaine, résultats de la
    réintroduction (tableau groupe → résultat → portion), pistes ventre retenues **avec leur étiquette de
    solidité et le nombre de comparaisons faites**, sommeil moyen et régularité si connus, encart « Estimations et
    liens repérés dans un journal personnel, pas un diagnostic. » ; page 2 « Détail » : calendrier des 28 jours
    (une case par jour, couleur du bilan, pictogramme repas riche en FODMAP), répartition des formes de selles si
    I176 est fait (sans sous-type), liste des aliments les plus fréquents, sources des données (« montre Huawei »,
    « Health Connect », « saisi à la main »), version de l'app. Rien sur le bien-être estimé du visage par défaut
    (case à cocher « inclure mon bien-être estimé », décochée) : c'est une donnée sensible et une estimation.
  - **Technique** : `services/report/buildReport.js` (pur : entrées → modèle du rapport, testé sans PDF) puis
    `services/report/renderPdf.js` (pdf-lib + fontkit, polices de `src/assets/fonts`, A4, couleurs des tokens
    converties) ; chargé à la demande (`import()` dynamique) pour ne pas alourdir le premier lancement (critère C4) ;
    fichier `Halcya-rapport-AAAA-MM-JJ.pdf` écrit dans Documents comme l'export JSON, puis ouvert / partagé ;
    **aucune donnée ne sort de l'appareil** sans geste de la personne (pas de mise à jour du formulaire Sécurité des
    données nécessaire : rien n'est transmis par l'app). Test : modèle sur journal synthétique ; PDF généré lisible
    par `pdf-lib` (nombre de pages, textes clés présents, aucun « HealthTrack ») ; taille < 300 Ko.
  - **Accès** : Analyses (bas de page, « Rapport PDF pour mon médecin », comme la maquette) et Données → Export.
    Premium ; dans la variante sideload, disponible sans abonnement (pas de Play Billing). Impact 4, faisabilité 4.
- **I176 (15) — Forme des selles, facultative, en un geste [V Rome Foundation].** Besoin : ce que le médecin regarde
  en premier, et un X utile (ou un second Y du ventre) pour les pistes. Dans la carte « Votre ventre », sous les trois
  boutons, une ligne discrète « + selles » ouvrant 7 pictogrammes de l'échelle de Bristol regroupés en 3 (« dures »
  1–2, « normales » 3–5, « liquides » 6–7) avec le détail au besoin ; entrée `stool` `{ bristol: 1..7 }` ; visible
  seulement avec l'objectif « Mon ventre » ; aucun sous-type affiché (diagnostic) ; dans le rapport, répartition par
  groupe. Pictogrammes dessinés par nous (la carte de la Rome Foundation est sous droits). Ne bloque pas I174 / I175.
  Impact 3, faisabilité 4.
- **Constat en passant** : `premiumBenefits.js` marque encore `pistes-delays` comme « en préparation » alors que les
  pistes repas → ventre avec délais sont affichées dans Analyses depuis le 26/10 03:33 ; à passer à `delivered: true`
  (avec `deliveredBy: 'src/services/gutLinks.js'`) au prochain run de code, si les pistes sont bien réservées au
  premium hors période de lancement — sinon, décider (P25 ①) qu'elles restent gratuites et retirer la ligne.

### Sources (consultées le 26/10/2026)
- NHS Gloucestershire Hospitals, *Re-introduction of FODMAPs after exclusion* (fiche patient, 02/2023) —
  https://www.gloshospitals.nhs.uk/documents/17365/FODMAP_reintroduction_information_for_website_Feb_23_update.pdf [V]
- Monash University FODMAP, *Reintroduction using the diary function* —
  https://monashfodmap.com/blog/reintroduction-using-diary-function [V]
- FODMAP Friendly, *Reintroduction* — https://fodmapfriendly.com/blogpost/reintroduction/ [T] ; A Little Bit Yummy
  (guide de réintroduction) [T] ; UH Liverpool, fiche « FODMAP reintroduction » (403 au chargement, citée par le
  moteur de recherche seulement) [T]
- Rome Foundation, *Bristol Stool Form Scale Card* (2021) — https://theromefoundation.org/wp-content/uploads/Bristol-Stool-Form-Scale-Card-2021.pdf [T, via résumé]
- Guides de journal SII (Bupa, NHS Lothian, IFFGD) via recherche [T]
- Registre npm : `pdf-lib` 1.17.1 MIT, `@pdf-lib/fontkit` 1.1.1 MIT, `jspdf` 4.2.1 MIT [V]

---

## Run du 25/10/2026 20:33 (Paris) — préparer I133 / I134 : des pistes ventre qui résistent aux vraies données

Contexte : le moteur repas → ventre (I132, `services/gutWindows.js`) est mergé depuis 19:33 mais pas encore affiché.
Il traite chaque note du ventre comme indépendante (Fisher + BH). Les vraies données d'un journal ne le sont pas :
on mange les mêmes choses plusieurs jours de suite, le ventre a ses semaines, et on note surtout quand ça va mal.
Ce run cherche comment s'en protéger avant que les pistes ne s'affichent, et relit la fiche Play.

- **I168 (25) — Garde-fou « décalage temporel tronqué » (TTS) contre les fausses pistes dues aux séries [V].**
  Le risque : 2 semaines de lentilles pendant une mauvaise passe du ventre → Fisher voit 20 notes « exposées » et
  conclut, alors que ce sont deux tendances lentes qui se superposent. Une simulation publiée (paquet R `nof1kit`) le
  chiffre : sans effet réel, avec une exposition en blocs et une dérive lente (φ = 0,7), un test qui ignore la
  dépendance conclut **4 fois sur 10** au seuil de 5 %. La méthode retenue : le test TTS de Yuan et Shou (PLoS Biology
  2024) — on retire r jours à chaque bout de la série du ventre, on décale la série d'exposition de −r à +r jours
  **sans l'enrouler** (l'enroulement colle la fin au début et fausse le test), on recalcule la même statistique à
  chaque décalage ; u = B / (r + 1), où B = nombre de décalages (dont 0) au moins aussi forts que l'alignement réel.
  Valide dès qu'une des deux séries est stationnaire, quelle que soit la statistique ; le décalage « naïf »
  B / (2r + 1) peut doubler les fausses alertes. Contraintes : u ne descend pas sous 1/(r + 1), donc **ce n'est pas
  le test principal** (BH sur 30 aliments exige des p bien plus petits) mais une **porte en plus** : une piste doit
  passer BH (Fisher, notes) **et** TTS (séries journalières) à u ≤ 0,1. Avec α = 0,1, r = 9 (j = 1) exige plus de
  18 jours, r = 19 (j = 2, plus puissant) plus de 38 ; la fenêtre (0–4, 4–24, 24–48 h) est fixée d'avance, ce que la
  méthode exige (délai choisi sans regarder les données). Séries : x(j) = 1 si l'aliment est dans la fenêtre avant au
  moins une note du jour j ; y(j) = pire niveau du ventre du jour (ou bilan du soir, I170) ; statistique = écart de
  part de jours « gêne/douleur » entre jours exposés et non exposés. Tests à écrire : nulle avec dérive AR(1) φ = 0,7 +
  aliment en séries (rester mangé 85 %) → Fisher seul > 10 % de jeux avec une piste, avec la porte < 10 % ; effet à
  6 h avec un aliment qui alterne → toujours repéré. Impact 5, faisabilité 4 (≈ 60 lignes, pur JS).
- **I169 (22) — Quatre nulles réalistes pour fixer N (précise I133) [H, d'après I168 et les études de journaux].**
  La calibration de N (aujourd'hui 8/8) doit se faire sur des données sans effet mais **réalistes**, sinon elle
  rassure à tort : (a) dérive lente du ventre (AR(1)) ; (b) aliments en séries (chaîne de Markov) ; (c) **saisie
  informative** : une note a plus de chances d'être prise quand ça va mal (ex. 30 % des moments calmes, 80 % des
  moments de gêne) ; (d) notes prises surtout dans les 2 h qui suivent un repas. Critère inchangé : sur 200 jeux par
  scénario, en 6 et 9 semaines, moins d'un sur dix avec au moins une piste ; puissance mesurée sur l'effet à 6 h.
  Littérature : rien ne mesure directement « on note plus les mauvais jours » dans les applis (un journal
  d'endométriose n'a pas trouvé de lien entre douleur et jours manqués, mais un effet du jour de la semaine : 18,5 %
  de jours manqués le vendredi, 22,9 % le samedi) → le scénario (c) reste une hypothèse à simuler, pas un fait.
  Les seuils trouvés vont dans `gutWindows.js` avec un commentaire qui cite le scénario le plus exigeant. Impact 5,
  faisabilité 3 (le banc de simulation reste hors du dépôt ou en test lent marqué).
- **I170 (20) — « Et votre ventre aujourd'hui ? » : un bilan du soir en un geste [H].** Les notes prises au fil de
  l'eau oublient les journées calmes (limite notée par I132). Un bilan quotidien déclenché par l'app (le
  « signal-contingent » des études EMA, par opposition au « event-contingent ») donne une série sans trou des bons
  jours, dont I168 a besoin. Forme : même mécanisme que la note du soir du bien-être (`eveningNote.js`, natif
  `EveningNoteNotice.java`), trois boutons Calme / Gêne / Douleur, **seulement si l'objectif « Mon ventre » est
  choisi** (POL-4), jamais deux fois par soir, coupable dans Paramètres ; l'entrée `gut` porte `scope: 'day'` pour ne
  pas se mélanger aux notes horodatées (le moteur I132 les ignore, TTS les utilise). Le ventre n'entre jamais dans
  l'estimateur du bien-être (règle 5 inchangée). Impact 4, faisabilité 4.
- **I171 (18) — L'effet d'attente rendu visible, sans culpabiliser [V].** Dans l'essai en aveugle publié en 2025
  (Lancet Gastroenterology & Hepatology, personnes SII convaincues que le blé ou le gluten leur fait mal), les
  symptômes revenaient presque autant avec la barre factice : 11/28 blé, 10/28 gluten, 8/28 placebo, et la plupart
  n'ont pas changé d'avis après la levée de l'aveugle. Pistes : (a) dans les détails d'une piste, « x % de vos notes
  ont été prises dans les 2 h après ce repas » quand c'est le cas, pour que la personne voie si elle surveille cet
  aliment de près ; (b) une phrase sous chaque piste : « L'attente joue aussi : une réintroduction guidée aide à
  trancher. » ; (c) dans la réintroduction guidée (I135), une option **« à l'aveugle avec un proche »** (un proche
  prépare le plat avec ou sans le groupe testé et le note dans l'app ; la personne ne le voit qu'à la fin) —
  différenciateur fort, aucune appli concurrente vue ne le propose. Toujours « piste », jamais « cause » ni
  « intolérance ». Impact 4, faisabilité 3 (a, b) / 2 (c).
- **I172 (16) — Fiche Play : deux phrases fausses et des mots que les gens tapent [V, fichiers du dépôt].**
  `app/store/listing/fr-FR/full-description.txt` dit encore « tout s'efface en désinstallant l'app » — faux depuis la
  décision du 24/10 de garder la sauvegarde Android (la page de confidentialité, elle, le dit justement : « Une copie
  peut rester dans la sauvegarde Google de votre téléphone ») — et appelle encore l'onglet « Pistes » (devenu
  « Analyses », VC-22). Mots-clés : la fiche contient « intestin irritable » (1 fois) et « ballonnements », mais ni
  « côlon irritable », ni « SII », ni « FODMAP », ni « journal alimentaire », les mots qu'on tape en France.
  Concurrents vus sur Android : MyIBS (fondation canadienne, gratuite, en anglais), Gut Health IBS Symptom Tracker
  (10 langues, Pro, export PDF), FODMAPLAB (locale, hors ligne), Monash FODMAP (rapport PDF) ; **toujours aucune app
  SII conçue en français**. À faire (run de code court, la CI pousse la fiche) : corriger les deux phrases, ajouter
  naturellement « côlon irritable (SII) », « journal alimentaire » et « hypothèses FODMAP » — sans liste de mots-clés
  (interdite par Google Play) ; un test-garde vérifie que la fiche ne dit plus « s'efface en désinstallant » sans
  mentionner la sauvegarde. Impact 3, faisabilité 5.

- **Ordre proposé pour les runs de code** : LISTING-1 (I172, court) → I168 (porte TTS, testée sur nulle AR(1)) →
  I169 (calibration N sur les 4 nulles) → I170 (bilan du soir du ventre) → affichage des pistes ventre dans
  Analyses (cartes « facteur → effet », barres par délai, avec I171 a/b) → I134. POL-1d reste suspendu à P28.

Sources (25/10/2026) : https://archive.linux.duke.edu/cran/web/packages/nof1kit/vignettes/nof1kit.html (simulation
OLS / AR(1)) ; https://pmc.ncbi.nlm.nih.gov/articles/PMC11398661/ (Yuan & Shou, PLoS Biol 2024, test TTS) ;
https://arxiv.org/pdf/2012.06862 (test de décalage de Harris, conservateur) ;
https://research-information.bris.ac.uk/en/publications/properties-of-bootstrap-tests-for-n-of-1-studies/ ;
https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5994094/ (jours manqués d'un journal d'endométriose) ;
https://m-path.io/learn/what-is-esm/ (échantillonnage signal / événement) ;
https://news.mcmaster.ca/analysis-the-nocebo-effect-in-ibs-why-gluten-might-not-be-the-real-problem/ ;
https://www.psypost.org/the-nocebo-effect-not-gluten-may-trigger-symptoms-for-many-with-ibs/ ;
https://similarweb.com/app/google/ca.cdhf.myibs ; https://www.coddykit.com/fr/apps/ibs-and-gut-health-tracker ;
https://en.androidayuda.com/applications/general/FODMAP-diet%3A-Android-apps-that-make-a-difference-in-IBS/ ;
https://monashfodmap.com/blog/app-how-to

---

## Run du 25/10/2026 08:33 (Paris) — audit de la version candidate après le polissage, et ce qu'il reste avant d'inviter les testeurs

Contexte : le polissage du parcours demandé le 24/10 vers 15:00 est livré (POL-2 à POL-8, POL-1 a/b/c côté app ; POL-1d
attend P28), les critères C1 à C5 sont presque tous verts. Ce run relit toute la variante play en captures
(`npm run visual -- --play --empty`, clair, 14 pages ; puis `--play --dark` sur données de démo : Accueil, Analyses,
Sources, Journal) pour dire ce qui empêche encore de publier la version candidate en alpha. Aucune erreur JS, aucun
débordement horizontal sur les 14 pages.

- **I165 (25) — audit « version candidate » du 25/10 : 6 défauts restants, tous petits [V, captures du jour].**
  ① **VC-22** — 4 textes disent encore « vos Pistes » alors que l'onglet s'appelle « Analyses » depuis le 24/10 :
  carte Météo (`WeatherCard.jsx:127` et `:177`, « Vos Pistes vérifient si c'est votre cas »), Temps d'écran
  (`PhoneUsageCard.jsx:134`), Capteurs Bluetooth (`BleDevices.jsx:298`). Correctif : « vos Analyses », et étendre le
  test-garde de vocabulaire (`wording.test.js`) à « vos Pistes » / « Vos Pistes ».
  ② **VC-23** — trois vocabulaires de solidité sur le même écran Analyses : « Chez vous : lien net » / « À vérifier :
  peut-être le hasard » (pistes à tester), « Hypothèse solide » / « Hypothèse à confirmer » (autres liens), et
  `DESIGN.md` prévoit « piste solide » / « à confirmer » / « trop tôt pour dire ». Un nouvel utilisateur ne peut pas
  comparer. Correctif : une seule échelle (`solide` · `à confirmer` · `trop tôt pour dire`), mêmes couleurs (menthe /
  pêche / gris), la phrase longue seulement dans le détail déplié. Aucun calcul ne change.
  ③ **VC-24** — « Autres liens repérés » mélange deux gabarits : des lignes compactes à barre (« Variabilité cardiaque
  ↑ 0,56 ») et des cartes de texte en gras (« Calories brûlées (activité) · La veille, 192 kcal de plus… · Piste :
  Bouger davantage ») ; un libellé tronqué (« Calories brûlées totales (H… ») ; « 2,43 / 5 » à deux décimales quand
  le reste de l'app en montre une. Correctif : un seul gabarit (ligne compacte + phrase au chevron), une décimale.
  ④ **VC-25** — Sources : « ▶ Brancher une autre source » (volet repliable) **et** le bouton « Ajouter une source »
  juste en dessous font la même chose ; le volet utilise encore le triangle ▶ (comme « Comment c'est calculé » dans
  Analyses) au lieu du chevron discret adopté partout le 24/10 (POL-3). Correctif : garder le seul bouton, chevron
  partout.
  ⑤ **VC-26** — Accueil sur installation neuve : l'intro fait 5 lignes de texte au-dessus de la première carte, et
  les trois tuiles Sommeil / VFC / Pas sont vides (« – ») avec une phrase dessous ; puis deux boutons « … dans le
  Journal » qui mènent à des pages vides. Principe du propriétaire : moins de texte, rien de vide. Correctif : intro
  en une phrase (« Notez vos repas et votre ventre, ajoutez votre montre : on regarde ce qui va avec vos bons jours. »),
  une seule ligne « Sommeil, cœur et pas arrivent de votre montre · Ajouter une source » à la place des 3 tuiles tant
  qu'aucune n'a de valeur, et les deux boutons Journal masqués tant qu'il n'y a aucune donnée.
  ⑥ **VC-27** — carte Health Connect (Sources) : la description cite « Gadgetbridge » (app de bidouilleurs, inconnue
  du public visé) et énumère 13 types de données sur 5 lignes. Correctif play : « Importe ce que vos apps santé
  écrivent dans Health Connect (Samsung Health, Garmin, Withings, Oura…) : sommeil, cœur, pas, poids… » ; la liste
  complète au chevron.
  Vu et **conforme** : onboarding 01/05 (= maquette, 18 ans), paywall (prix lus dans Play Billing, « soit 2,50 € par
  mois » secondaire, frise d'essai, « Plus tard »), Paramètres (« Ce qui vous amène » à jour), Historique du bien-être
  vide, Journal en couleurs, Tendances (« bientôt » en une ligne), Repas, thème sombre. Impact : C1 et C2 restent
  verts après correction ; chaque défaut tient dans un run court (②+③ ensemble, ⑤ seul, ①+④+⑥ ensemble).

- **I166 (24) — ce que Google regarde vraiment au bout des 14 jours (accès à la production) [T, à vérifier sur
  l'aide Play Console].** Sources tierces concordantes (indiehackers, testerscommunity, extendsclass, choicely,
  hackernoon, consultées le 25/10) : (a) le compteur de 14 jours ne court que si **12 testeurs au moins restent
  inscrits sans interruption** (un désinscrit qui fait passer sous 12 remet le compteur à zéro) → **inviter 15** comme
  prévu ; (b) Google refuse de plus en plus pour **« engagement insuffisant »** : des inscrits qui n'ouvrent jamais
  l'app ne comptent pas, ni des comptes de la même personne ou des émulateurs ; (c) le formulaire de demande d'accès
  pose des questions courtes (~300 caractères) sur le recrutement des testeurs, les retours reçus et **les changements
  faits** pendant le test ; (d) **publier au moins une mise à jour en alpha pendant les 14 jours** est un signal
  attendu. Conséquences pour nous : ① le texte d'invitation (`INVITATION-TESTEURS.md`) demande d'**ouvrir l'app au
  moins tous les 2-3 jours** et de **ne pas se désinscrire** avant la fin ; ② prévoir un **rappel au jour 7** (message
  du propriétaire au groupe, texte prêt) ; ③ le bouton « Envoyer un avis » doit exister dans la version play (à
  vérifier : sinon un lien `mailto:` dans Paramètres, sans donnée de santé) pour récolter des retours citables ; ④ la
  routine publie **au moins 2 versions en alpha** pendant le test (la piste alpha reste limitée à une par jour) et
  tient dans `PRODUIT.md` une liste « changements faits pendant le test » qui servira mot pour mot aux réponses du
  formulaire (P30 à préparer : réponses du formulaire d’accès à la production, dès le jour 10).

- **I167 (15) — réinstallation sans sauvegarde = 10 crédits IA offerts de nouveau : rien de simple à faire [V].**
  Piste du 24/10 : le « device recall » de Play Integrity (3 bits par appareil, lus dans le verdict) est fait pour ça,
  mais il est en **bêta réservée à des partenaires choisis** (programme d'accès anticipé, page Android « Detect repeat
  abuse using device recall (beta) », consultée le 25/10) : inaccessible pour un compte individuel. Le risque reste
  borné par `INSTALL_DAILY_CAP` et le plafond global du relais (facture plafonnée). Décision proposée : ne rien coder
  maintenant ; ajouter au résumé du workflow relais le **nombre de nouvelles installations par jour** qui prennent leurs
  crédits offerts, et ne passer à 5 crédits offerts (au lieu de 10) que si ce nombre s'envole sans hausse des
  téléchargements Play.

- **Recommandation d'ordre (pour les runs de code)** : POL-1d attend P28, et la lecture au déverrouillage dans la
  version Play ajoute un examen Google à risque (§1 de `PLAY-CONFORMITE.md`) : **ne pas la mettre dans la version
  candidate**. Ordre proposé : VC-22 + VC-25 + VC-27 (textes, un run) → VC-23 + VC-24 (Analyses, un run) → VC-26
  (Accueil vierge, un run) → I166 ③ (« Envoyer un avis ») → **publication de la version candidate en alpha** avec
  les dates de la période de lancement (début = jour de la publication, fin = +14 j + 7 j de marge), C5 vert, et
  « 👉 Version candidate prête » en tête du résumé. POL-1d (interrupteur play allumé) ensuite, dans une version
  séparée, une fois P28 acceptée.

Sources (25/10/2026) : captures `app/.visual/` du jour (non commitées) ;
https://www.indiehackers.com/post/google-play-production-access-rejected-why-fixes-1efcef20e8 ;
https://www.testerscommunity.com/blog/why-apps-fail-google-play-production-access ;
https://extendsclass.com/blog/google-plays-closed-testing-requirement-what-developers-need-to-know-in-2026 ;
https://www.choicely.com/blog/google-play-12-tester-rule ;
https://hackernoon.com/from-rejection-to-release-how-the-pinoy-made-app-todochi-got-on-google-play ;
https://developer.android.com/google/play/integrity/device-recall

---

## Run du 24/10/2026 20:30 (Paris) — P28 prêt pour le propriétaire, POL-7 et POL-8 maquettés

Contexte : il reste trois étapes de polissage (POL-7 Analyses, POL-6 Journal, POL-8 Sources) puis POL-1 (lecture au
déverrouillage aussi dans la version Play), qui exige d'abord la déclaration P28. Ce run prépare P28 mot pour mot et
décrit les deux écrans les plus chargés, à partir des captures `npm run visual -- --play` (démo et `--empty`) de ce soir.
Sources Play lues le 24/10 : aide Play Console « Understanding foreground service and full-screen intent
requirements » (answer/13392821) et sa version d'avril 2026 (answer/16965181), Developer Policy Center « Device and
Network Abuse » (section Foreground Service Permissions, answer/16559646) ; Android « Changes to foreground service
types for Android 15 ».

- **I162 (25) — P28 : déclaration « Autorisations des services de premier plan », prête à coller [V/H].**
  Ce que Google demande pour chaque type déclaré (cible Android 14+) [V] : (1) description de la fonction, (2) impact
  pour l'utilisateur si le système **diffère** ou **interrompt** la tâche, (3) **lien vers une vidéo** montrant le chemin
  de l'utilisateur jusqu'à la fonction, (4) un cas d'usage pris dans une liste (pour `camera`, la seule entrée est
  « Background Camera Streaming » = continuer à accéder à la caméra depuis l'arrière-plan ; sinon saisie libre). Critères
  de la règle [V] : usage **lancé par l'utilisateur ou perceptible** (une notification permanente claire suffit à le
  rendre perceptible), **arrêtable par l'utilisateur**, qui ne peut pas être différé sans nuire, et qui ne dure que le
  temps nécessaire. Android 15 [V] : interdit de démarrer un service caméra depuis `BOOT_COMPLETED` (la version Play
  n'aura donc **aucune relance au démarrage** : la lecture reprend à la prochaine ouverture de l'app). Le texte exact,
  le script de la vidéo et l'ordre des gestes sont dans `PLAY-CONFORMITE.md` §1 bis. Risque principal : notre service
  attend des déverrouillages pendant des heures, ce qui s'éloigne de « ne dure que le temps nécessaire » [H] ; la
  défense est « l'utilisateur l'a allumée et la voit en permanence, un geste l'arrête ». **Point non confirmé (❓)** : le
  formulaire peut n'apparaître dans « Contenu de l'app » qu'après l'envoi d'un AAB qui déclare le type `camera` ;
  la marche à suivre couvre les deux cas.
- **I163 (24) — POL-7 : maquette de l'onglet « Analyses » [H, d'après les captures].** Constat (démo, play) :
  4 écrans de défilement ; deux onglets « Analyse simple ≥ 5j / Analyse avancée ≥ 9j » ; deux « Comment c'est calculé »
  (un en haut, un au milieu) ; « Alcool » affiché **deux fois** (bien-être estimé, puis habitudes) avec deux verdicts
  différents ; « Voir les 34 liens incertains » puis « Voir les 37 liens incertains » ; chiffres techniques à la
  première lecture (r = +0,57, ≈ 59 jours indépendants) ; émojis dans les titres d'habitudes ; vert / rouge pour
  « meilleur / moins bon » (jugement implicite, et rouge = « mauvais » est proche d'une norme). Proposition, de haut
  en bas :
  1. Ligne mono « 75 jours notés · 61 repas · délais 1–3 j » puis titre **« Vos analyses »** (onglet renommé
     « Analyses », icône inchangée ; dans les cartes, on dit toujours « piste »).
  2. Encart lilas court : « Des liens repérés dans vos données, pas des causes ni un diagnostic. »
  3. **« Pistes à tester »** : au plus 3 cartes, triées par solidité. Fermée : étiquette (« piste solide » menthe,
     « à confirmer » pêche), titre « facteur → effet » en une ligne (« Dormir plus longtemps → meilleur bien-être »),
     une phrase avec des mots (« Les nuits de plus de 7 h, bien-être 3,1 contre 2,6 »). Chevron → statistiques en mono
     (r, jours indépendants, q ajusté), délai, source (notes ou visage), « Comment c'est calculé » de **cette** piste.
  4. **« Autres liens repérés »** : une seule liste fusionnée (visage, habitudes, effets décalés, corrélations) avec
     **un** verdict par facteur (le plus solide gagne ; l'autre source en détail), en barres neutres lilas
     plus ou moins longues avec « ↑ va avec un meilleur bien-être / ↓ avec un moins bon » au lieu de vert / rouge.
     Repliée au-delà de 5 lignes : « Voir 4 autres liens ».
  5. **« Bientôt »** : une ligne discrète par bloc qui n'a pas assez de données (« Avec votre bien-être estimé ·
     dans 6 jours », « Effets décalés · dans 3 jours », « Repas → ventre · 12/21 jours »), jamais une carte vide.
  6. Pied de page en 12 px : « Hypothèses tirées de vos seules données, calculées sur votre téléphone : pas un avis
     médical. » + lien « Comment c'est calculé » (une seule note de méthode, qui réunit les 3 actuelles) + liens
     incertains.
  L'analyse « avancée » (régression Ridge, « A-t-il vu juste ? ») : ses pistes rejoignent la liste 3 quand elles
  passent le même seuil, « Ce qui pèse le plus » disparaît (doublon des corrélations), « A-t-il vu juste ? » passe
  dans la note de méthode. Aucun calcul ne change, aucun seuil ne baisse : c'est de la présentation. Tests à prévoir :
  un facteur n'apparaît qu'une fois ; aucun onglet « avancée » ; état vierge = carte lilas seule ; vocabulaire
  (« cause », « diagnostic » seulement en négation).
- **I164 (24) — POL-8 : maquette de l'onglet « Sources » [H/V].** Ce qui existe déjà et qu'on réutilise : la
  détection des apps de santé installées (`src/devices/healthApps.js`, liste `<queries>` du manifeste :
  Huawei Health, Samsung Health, Garmin Connect, Withings, Oura, Zepp, Fitbit, Polar…), « Mes appareils » (apps qui
  ont écrit dans Health Connect ces 30 jours, nécessite l'accord Health Connect) et la montre appairée. Proposition :
  1. **« Vos sources »** : uniquement ce qui envoie déjà quelque chose, une ligne par source avec pastille d'état
     (« reçu il y a 2 h ») et chevron vers le détail ; en vierge, rien.
  2. **« Trouvées sur votre téléphone »** : cartes seulement pour ce qui est détecté — Health Connect présent →
     « Brancher Health Connect » avec les apps détectées qui y écrivent (« Samsung Health et Withings sont installés ») ;
     **Huawei Health installé, ou montre déjà appairée → carte « Montre Huawei »** (sinon jamais affichée) ; Lecture
     du visage, Météo, Temps d'écran et sommeil **toujours** (présents sur tous les téléphones).
  3. Bouton secondaire **« Ajouter une source »** → feuille avec la liste par marque actuelle (« Votre montre
     n'apparaît pas ? »), la montre Huawei (même non détectée) et les capteurs Bluetooth.
  4. Tout le technique (journal de connexion de la montre, « enregistrer le journal », compteurs, diagnostic
     Health Connect) seulement en **mode diagnostic** (7 touches sur la version) ; aucune carte à identifiant de
     développeur (Withings API) dans la version Play — déjà le cas (`FEATURES.withingsApi`, absente de la capture vierge play).
  Détection Bluetooth d'une montre Huawei « à proximité » : demander `BLUETOOTH_SCAN` pour seulement afficher une carte
  serait une autorisation de plus au premier écran, sans divulgation possible au bon moment → **non** ; on se contente
  du paquet Huawei Health installé, de l'appairage existant et du bouton « Ajouter ». Défaut vu au passage (vierge,
  play) : le mot « Détails » des cartes Visage, Météo et Temps d'écran (`MethodNote`) apparaît en gris sans chevron,
  comme un texte orphelin → à aligner sur le chevron de POL-3.

---

## Run du 24/10/2026 08:30 (Paris) — 6d et 6e prêts à coder : créer l'abonnement par l'API, puis le tester en accéléré

Contexte : le prochain run de code est **6d** (créer l'abonnement `halcya_premium` par la CI). L'app attend déjà
`PRODUCT_ID = 'halcya_premium'`, les formules `annuel` puis `mensuel` (`src/services/playBilling.js:16-17`) et
reconnaît l'essai à une phase gratuite (`priceMicros === 0`, durée lue dans `billingPeriod`). Il ne manque que le
catalogue côté Google. Lu ce matin dans la référence de l'API Android Publisher v3 (pages `monetization.*`,
consultées le 24/10) et l'aide « Test des achats intégrés » (developer.android.com/google/play/billing/test).

- **I158 (25) — Spécification de 6d : le catalogue en 5 appels idempotents [V/T/H].**
  1. **Lire d'abord** : `GET …/applications/fr.jpesquet.sante/subscriptions/halcya_premium`. 404 → étape 2 ; trouvé →
     comparer et ne rien recréer (un `productId` et un `basePlanId` sont **immuables** et ne se suppriment pas une
     fois actifs : une faute de frappe serait définitive, d'où un test qui fige les identifiants).
  2. **Créer** : `POST …/subscriptions?productId=halcya_premium&regionsVersion.version=2022/02` [V : paramètres
     obligatoires ; T : `2022/02` est la dernière version citée par les bibliothèques clientes officielles —
     ❓ à confirmer par la réponse, qui renvoie la version utilisée]. Corps :
     - `listings: [{ languageCode: 'fr-FR', title: 'Halcya Premium', description (≤ 200 car.), benefits (≤ 4) }]`
       [V : une fiche dans la langue par défaut de l'app est **obligatoire**]. Les `benefits` doivent dire **ce qui est
       livré** (VC-17 / `config/premiumBenefits.js` : aujourd'hui seule l'analyse IA des repas « sans compter », plafond
       10 / jour) — les générer depuis ce fichier, avec un test, pour ne jamais promettre plus que le paywall.
     - `basePlans` : `annuel` (`autoRenewingBasePlanType.billingPeriodDuration: 'P1Y'`) et `mensuel` (`'P1M'`), chacun
       avec `regionalConfigs: [{ regionCode: 'FR', price: { currencyCode: 'EUR', units: '29', nanos: 990000000 },
       newSubscriberAvailability: true }]` (resp. `units: '4'`). [H] Prix **TTC** en France (Play affiche des prix
       taxes comprises dans l'UE ; indice [V] : `convertRegionPrices` renvoie des prix régionaux « tax inclusive ») —
       vérifier dans la réponse ou la Play Console que 29,99 € est bien le prix vu par l'acheteur.
     - Période de grâce et suspension (décision du 20/10) : `gracePeriodDuration` (≤ min(30 j, période)) et
       `accountHoldDuration` (≤ 60 j), **somme entre P30D et P60D** [V]. Proposé : mensuel `P7D` + `P53D`, annuel
       `P14D` + `P46D` (le maximum de récupération, que recommande Google). `resubscribeState: RESUBSCRIBE_STATE_ACTIVE`.
     - Pas de `otherRegionsConfig` au début (seule la France est ouverte en test fermé) ; plus tard,
       `POST …/pricing:convertRegionPrices` avec le prix **hors taxes** donne les prix de toutes les régions [V].
  3. **Offre d'essai** : `POST …/subscriptions/halcya_premium/basePlans/annuel/offers?offerId=essai-14j&regionsVersion.version=2022/02`
     avec `phases: [{ recurrenceCount: 1, duration: 'P14D', regionalConfigs: [{ regionCode: 'FR', free: {} }] }]`,
     `regionalConfigs: [{ regionCode: 'FR', newSubscriberAvailability: true }]` et `targeting.acquisitionRule.scope.thisSubscription: {}`
     (« jamais eu cet abonnement » : Google ne montre l'offre qu'aux personnes éligibles, l'app n'a rien à vérifier)
     [V]. Seules les formules auto-renouvelables acceptent des offres [V]. `offerTags: ['essai']` facultatif.
  4. **Activer** : formules et offre naissent **en brouillon** [V] → `POST …/basePlans/annuel:activate`,
     `…/basePlans/mensuel:activate`, puis `…/basePlans/annuel/offers/essai-14j:activate`. L'état de la formule prime
     sur celui de l'offre [V].
  5. **Relire** et écrire un résumé dans la page du job (identifiants, état, prix, essai) — la même lecture sert de
     « sonde » aux runs suivants tant que Google refuse.
  Mise en œuvre conseillée (≈ 1 run) : `app/scripts/play/subscriptions.mjs` (fonction pure `buildCatalog()` +
  `ensureCatalog({ token, fetchImpl })` réutilisant `call`/`withRetry`/`PlayApiError` de `publish.mjs`), tests sur un
  faux `fetch` (404 → création → activation ; déjà actif → aucun POST ; 403 → message clair), et un workflow
  `workflow_dispatch` « Play — abonnements » sur `main` (WIF, `gh-deployer`). **Droits** [T] : guides tiers (aso.dev,
  Glassfy, Adapty) rangent les produits intégrés et abonnements sous « Gérer la présence sur le Store », que
  gh-deployer a (fiche du Store) ; en cas de 403, noter l'erreur exacte et l'action du propriétaire. **Profil de
  paiement** : aucune source officielle ne décrit l'erreur renvoyée tant que la vérification bancaire n'est pas finie
  [❓] → recopier le corps de l'erreur dans le compte rendu, réessayer aux runs suivants, ne rien contourner.
  Impact 5 (débloque C3 et 6e), faisabilité 4. → **BACKLOG 6d précisé.**
- **I159 (22) — Spécification de 6e : le scénario « testeur de licence » en 30 minutes [V].** Pour un testeur de
  licence (l'adresse Gmail du propriétaire l'est depuis le 22/10), Google accélère tout : **mensuel renouvelé toutes
  les 5 min, annuel toutes les 30 min, essai 3 min, période de grâce 5 min, suspension 10 min, pause d'1 mois = 5 min,
  accusé de réception attendu sous 5 min** (sinon remboursement au bout de 3 min pour un testeur de licence) ;
  **6 renouvellements au plus**, essai non compté [V]. Moyens de paiement de test : « toujours accepté », « toujours
  refusé », « carte lente, accepte / refuse après quelques minutes » (paiements en attente : 6c-3c), « accepte puis
  rétrofacturation » [V]. Attention [V] : chez un testeur de licence, **la pause et le réabonnement sont toujours
  activés**, même désactivés dans la Play Console. Liste de vérifications pour le propriétaire (≈ 30 min, une ligne =
  une case dans `PRODUIT.md`, preuve = capture + ligne du journal du relais) :
  ① Premium → Annuel → « Essayer 14 jours » avec « toujours accepté » → l'app passe premium en < 10 s, le relais
  journalise l'accusé ; ② 3 min plus tard (fin d'essai) → toujours premium (renouvelé) ; ③ Google Play → Abonnements
  → Annuler → l'app reste premium jusqu'à l'échéance puis repasse en gratuit, compteur 10 + 15 revenu ; ④ mensuel
  avec « toujours refusé » au renouvellement (changer le moyen de paiement après l'achat) → période de grâce : premium
  gardé + « Premium actif · Paiement à régulariser dans Google Play. » dans Paramètres → Abonnement (déjà dans `entitlement.js`) ; 5 min plus tard →
  suspension : plus de premium ; ⑤ pause d'1 mois → plus de premium pendant 5 min, reprise automatique ;
  ⑥ désinstaller / réinstaller → « Restaurer un achat » → premium revenu ; ⑦ « carte lente, accepte » → « paiement en
  attente » puis premium sans rouvrir le paywall. Les cas ③ à ⑤ se vérifient aussi par les RTDN reçues
  (`play-rtdn-relay`). Ce qui manque peut-être côté app : pendant la période de grâce et la suspension, le message n'apparaît
  que dans Paramètres → Abonnement ; Google recommande d'inviter à corriger le paiement là où la personne le voit
  [H] → petite carte sur l'Accueil (état `grace` / `on_hold` du relais, lien `manageSubscriptionUrl`), à décider en 6e. Impact 4, faisabilité 4. → **BACKLOG 6e précisé.**
- **I161 (20) — Conséquence pour P23 : un testeur de licence perd son premium au bout de ~3 h [V/H].** Si le groupe
  `halcya-testeurs@googlegroups.com` devient testeur de licence (option ① de P23), ses achats sont gratuits **mais
  accélérés** : essai de 3 min puis 6 renouvellements de 30 min au plus pour l'annuel [V] → l'abonnement s'arrête au
  bout d'environ **3 h** [H : déduit des durées officielles], et le testeur repasse en gratuit au milieu de ses 14 jours.
  L'option ① seule ne suffit donc pas à « ne jamais payer **et** garder le premium » : elle sert à vérifier le parcours
  d'achat, c'est l'option ② (période de lancement côté relais, `LAUNCH_PREMIUM_UNTIL`, déjà prête) qui garde le premium
  pendant tout le test. Recommandation de P23 inchangée (① + ②), argument ajouté dans `PRODUIT.md`. Impact 4,
  faisabilité 5 (aucun code).
- **I160 (12) — Prix affichés ailleurs que dans le paywall [H].** La fiche Play (`app/store/listing/fr-FR/`) et
  `public/conditions.html` ne doivent jamais citer un prix en dur (VC-18a l'a respecté) : si la description longue
  annonce « 29,99 €/an », un changement de prix rendrait la fiche trompeuse. Test-garde simple : aucun motif
  `\d+,\d\d ?€` dans `store/listing/**` ni `public/*.html`. Impact 2, faisabilité 5.

### Sources (consultées le 24/10/2026)
- developers.google.com/android-publisher/api-ref/rest/v3/monetization.subscriptions (ressource, `basePlans`,
  `AutoRenewingBasePlanType`, contraintes grâce + suspension), …/monetization.subscriptions/create,
  …/monetization.subscriptions.basePlans/activate, …/monetization.subscriptions.basePlans.offers (et `/create`),
  …/monetization/convertRegionPrices, …/RegionsVersion [V].
- Version de régions `2022/02` : documentation des bibliothèques clientes Ruby (googleapis.dev) et Dart (pub.dev) [T].
- developer.android.com/google/play/billing/test — durées accélérées, moyens de paiement de test [V].
- aso.dev/google-play/permissions, glassfy.io, adapty.io — droits Play Console d'un compte de service [T].

### À creuser au prochain run idées (24/10 20:30)
- Le corps exact de l'erreur de 6d (si Google refuse) et sa signification.
- Audit `--play --empty` après VC-15 / VC-5 / VC-9 (les captures ont changé depuis le 23/10 20:30).
- Veille concurrents SII : prix et essais en 2026 (Nerva, mySymptoms, Bearable, Cara Care) pour situer 29,99 €/an.

---

## Run du 23/10/2026 08:30 (Paris) — jalon 4 prêt à coder, et l'import du jour 1 qui ne marcherait pas

- **I153 (24) — Première synchro Health Connect : 180 jours demandés, 30 autorisés → rien d'importé [V/H].** La doc
  Health Connect (« Read data », lue le 23/10) : sans `READ_HEALTH_DATA_HISTORY`, une app ne lit que **30 jours avant
  la date de sa toute première autorisation** (date réinitialisée à chaque réinstallation) et **lire plus ancien
  « results in an error »**. Or `autoSync.js:28` et `Connectors.jsx:28` partent de `DEFAULT_HISTORY_DAYS = 180` à la
  première synchro, et aucun manifeste (play, sideload, plugin `@capgo/capacitor-health` 8.4.5) ne déclare la
  permission d'historique. Sur une installation neuve, chaque type tomberait donc en erreur (attrapée type par type
  dans `HealthConnectConnector.sync`), **puis `lastSyncAt = now` serait enregistré quand même** (`autoSync.js` ~l. 121)
  : les synchros suivantes repartent de « maintenant − 2 h » et **les 30 jours ne sont jamais importés**. Le
  propriétaire ne le voit pas (son autorisation date de plusieurs mois [H]). C'est exactement l'« aha » du jour 1
  (I130) qui casserait chez chaque testeur. [H] à confirmer sur l'émulateur : le message exact de l'erreur, et si le
  plugin borne lui-même. Correctif (≈ 1 run court, TDD) : ① `firstGrantAt` enregistré dans `connectorSettings` au
  premier `granted` (sinon : maintenant) ; ② `since = max(demandé, firstGrantAt − 29 j)` tant que la permission
  d'historique n'est pas accordée, dans les deux variantes ; ③ ne pas avancer `lastSyncAt` quand **tous** les types
  lus ont échoué ; ④ « Importer depuis N jours » de `Connectors.jsx` borné de même, avec la phrase « Android
  laisse lire 30 jours avant votre première autorisation ». Tests : faux plugin qui lève au-delà de J−30 → 30 j importés ;
  tout en erreur → `lastSyncAt` inchangé. Impact 5, faisabilité 5. → **VC-11, avant le jalon 4.**
- **I154 (24) — Spécification du jalon 4, écran par écran [V/H].** Repères lus le 23/10 : RevenueCat 2026 (via SaaStr)
  — **50 % des conversions payantes ont lieu le jour 0**, les essais de 17 à 32 jours convertissent mieux (42,5 %) que
  ceux de ≤ 4 jours (25,5 %) ; Adapty 2026 (via thesocialoutline) — paywall **après un moment de valeur : 65 %
  d'essais démarrés, contre 31 %** pour un paywall dur d'entrée ; un onboarding compte ~13 étapes en moyenne ; la revue
  de l'onboarding de Nerva (SII) loue les questions de santé d'abord, puis la méthode expliquée, puis le paywall, et
  reproche la **demande de notifications avant toute valeur** et des écrans trop bavards. Donc : questions courtes →
  autorisations au moment où elles servent → résultat réel → paywall passable. **9 écrans** (le « 01/09 » de la
  maquette), une route `/bienvenue`, plein écran sans barre d'onglets :
  1. **Accueil + objectif** (maquette validée) : « Comprenez ce qui va avec vos bons et mauvais jours », 3 tuiles,
     choix 01 Mon ventre / 02 Mon énergie et mon sommeil / 03 Tout comprendre de mes données, ligne cadenas, ligne
     « En continuant, vous confirmez avoir 18 ans ou plus. » (public 18+ déclaré, pas de date de naissance demandée).
  2. **Ce que vous voulez suivre** (cases cochées d'avance selon l'objectif) : ventre, repas, sommeil, énergie /
     bien-être, activité, cycle (plus tard) ; ne fait que régler l'ordre et la visibilité des cartes, ne cache aucune
     donnée.
  3. **Vos montres** : « Montre ou bague qui écrit dans Health Connect (Garmin, Oura, Samsung, Withings, Fitbit…) » /
     « Montre compatible Huawei » / « Pas de montre » ; aucune autorisation ici.
  4. **Health Connect** (si choisi) : divulgation `health_connect` (nouvelle entrée de `permissionDisclosures.js` :
     lu, sur le téléphone, rien envoyé ; « 30 derniers jours importés ») puis `requestPermissions()` ; refus → on
     continue sans reproche. Huawei → renvoi vers Sources après l'onboarding (l'appairage est long, pas au milieu).
  5. **Import** : barre de progression réelle (types lus / total), sans pourcentage inventé ; ≤ 20 s, sinon « on
     continue en arrière-plan ».
  6. **« Aha » — vos 30 derniers jours** : 3 à 4 chiffres seulement, chacun avec sa source (« 27 nuits · 7 h 05 en
     moyenne · montre Garmin via Health Connect »), et une phrase honnête si rien n'est venu (« Rien à importer pour
     l'instant : vos données arriveront au fil des jours »). Jamais de zéro trompeur (C1).
  7. **Bien-être estimé (facultatif)** : lecture du visage expliquée en 3 lignes, divulgation `camera_app_open`
     existante, « Essayer maintenant » (une lecture, résultat « estimation, pas un diagnostic ») ou « Plus tard ».
  8. **Votre premier geste** : selon l'objectif, « Comment va votre ventre ? » Calme / Gêne / Douleur (entrée `gut`
     existante) ou « Comment vous sentez-vous ? » ; c'est le point de départ du compteur X/21 de la carte lilas.
  9. **Paywall soft** : la page `/premium` existante avec un contexte `onboarding` (« Vos pistes arriveront vers le
     21ᵉ jour ; l'essai les débloque dès qu'elles sont prêtes ») et un **« Continuer gratuitement » aussi visible que
     la croix** ; en sideload, l'écran 9 n'existe pas (8/8).
  Puis Accueil. Notifications : **jamais pendant l'onboarding** ; la permission est demandée la première fois que la
  personne allume un rappel (note du soir). Mécanique : `settings/onboarding.js` (`done`, `goal`, `tracks`, `step`
  pour reprendre là où on s'est arrêté), redirection vers `/bienvenue` seulement si `!done` **et** aucune entrée en
  base (une mise à jour ne montre jamais l'onboarding à un utilisateur existant ; testé), « Passer » discret sur
  chaque écran sauf le 1. Captures : `npm run visual -- --play --empty` doit ouvrir `/bienvenue` ; ajouter une page
  par écran. Découpage conseillé : **4a** écrans 1-3 + mécanique + redirection ; **4b** Health Connect, import et
  « aha » (après VC-11) ; **4c** visage, premier geste et paywall soft. Impact 5, faisabilité 4.
- **I155 (14) — L'objectif choisi règle l'Accueil, pas l'inverse [H].** Avec « Mon énergie et mon sommeil », la carte
  pêche « Votre ventre » descend sous les tuiles et la carte lilas parle de « vos pistes sommeil → bien-être » ; avec
  « Mon ventre », l'ordre de la maquette. Réglable ensuite dans Paramètres (« Ce qui vous amène »). Aucune donnée
  masquée. Impact 3, faisabilité 4. → après 4c.
- **I157 (15) — Un paywall qui ne vend que ce qui existe [H] (run « idées » du 23/10 20:30, → P25 / VC-17).**
  Constat : le paywall coche 4 avantages ; seul « l'analyse IA des repas, jusqu'à 10 par jour » est réellement servi
  (relais) ; pistes avec délais (jalon 5), réintroduction FODMAP et rapport PDF (jalon 7) n'existent pas, et aucune
  page ne lit les droits premium. Risques : règles Play sur les abonnements (dire clairement ce qui est gratuit et ce
  qui est payant, aucune formulation trompeuse — l'application de cette règle depuis 2020 vise justement les paywalls
  qui promettent plus qu'ils ne donnent), droit de la consommation (pratique commerciale trompeuse), et surtout
  confiance des 12 à 15 premiers testeurs, qui sont aussi nos premiers avis. Options pour la version candidate :
  ① **(recommandée)** liste cochée = avantages livrés seulement ; « En préparation, inclus sans supplément : pistes
  avec délais, réintroduction FODMAP, rapport PDF » derrière « détails » ; paywall soft de l'onboarding conservé
  (il fait connaître l'offre et teste Play Billing) ; ② masquer le paywall soft de l'onboarding jusqu'au jalon 5
  (premier avantage « comprendre » réel) et garder `/premium` accessible seulement depuis les Paramètres ;
  ③ avancer une version minimale du jalon 5 (fenêtres 0–4 h / 4–24 h / 24–48 h repas → ventre sur le moteur N-of-1
  existant, réservée au premium) avant d'inviter les testeurs — la plus vendeuse, mais 3 à 5 runs de plus. Dans tous
  les cas : drapeau `delivered` par avantage et test-garde. Impact 5, faisabilité 5 (① ou ②). Source : couverture de
  la politique « Subscriptions » de Google Play (TechRadar, Slashdot/Engadget, 16/04/2020 ; Sophos sur les
  « fleeceware »), à relire sur le centre d'aide des règles Play avant la mise en vente.
- **I156 (12) — ✅ livré le 23/10 15:30 — Mesurer l'onboarding sans rien envoyer [H].** Pas d'analytique tierce : un compteur local
  (`onboarding.step` atteint, écrans passés) inclus dans le diagnostic exporté, que les testeurs peuvent joindre à leur
  retour. Suffit pour repérer l'écran où l'on décroche avec 12 à 15 testeurs. Impact 2, faisabilité 5.

Sources (lues le 23/10/2026) : https://developer.android.com/health-and-fitness/health-connect/read-data ;
https://developer.android.com/reference/androidx/health/connect/client/permission/HealthPermission ;
https://saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps-how-115000-mobile-apps-deliver-16b-in-revenue-whats-working-whats-quietly-killing-growth
(rapport RevenueCat 2026 lui-même non ouvert) ; https://thesocialoutline.com/blog/install-to-trial-conversion-rate-benchmarks
(chiffres Adapty, source tierce [T]) ; https://screensdesign.com/showcase/nerva-ibs-gut-hypnotherapy [T] ;
https://apps.apple.com/us/app/cara-care-ibs-fodmap-tracker/id1133687886.

---

## Run du 22/10/2026 20:30 (Paris) — audit de la version candidate et testeurs sans paiement

- **I149 (20) — Audit sans code de la variante play sur données vierges [V].** `npm run visual -- --play --empty`
  (clair, puis sombre pour l'Accueil et les Pistes) : 11 pages sans erreur JS ni débordement, mais 8 défauts qui
  feraient mauvaise impression à un testeur (VC-1 à VC-8 dans `BACKLOG.md` et `PRODUIT.md` §2 bis) : mots collés au
  nom (« Halcyavous »), page Pistes vide qui contredit l'Accueil et parle de « recommandations », profil nutritionnel
  inventé affiché comme vrai, mode diagnostic visible, historique des Nouveautés rempli de « HealthTrack », écran montre
  proposé sans montre, carte Withings qui demande un secret de développeur. Le thème sombre de l'Accueil est propre.
  Impact 4, faisabilité 5 (chaque défaut tient en quelques lignes + un test). → **passe de finition VC.**
- **I150 (16) — Test-garde « premier lancement play » [H].** Un test Vitest qui monte chaque page en variante play sans
  données et échoue sur : « HealthTrack », `/Halcya\S/`, « recommandation », « bientôt », « diagnostic » hors des
  écrans prévus, un chiffre affiché suivi de « (par défaut) ». Il rend le critère C2 vérifiable à chaque PR au lieu
  d'un audit manuel. Impact 4, faisabilité 4.
- **I151 (18) — Testeurs du test fermé : ne jamais payer [V].** Faits (aide Play Console « Test des achats intégrés »,
  guides RevenueCat et Qonversion, lus le 22/10) : ① dans **Paramètres → Test de licence**, on peut ajouter une liste
  d'e-mails **ou un groupe Google** (pas de limite de membres ; le compte du développeur est toujours testeur) ; leurs
  achats passent par des cartes de test, jamais débitées ; mais les renouvellements sont **accélérés** (un mois ≈ 5 min,
  au plus 6 renouvellements, cf. I148) : le premium d'un testeur s'éteindrait en moins d'une heure — bien pour tester le parcours
  d'achat, pas pour 14 jours d'usage. ② Hors testeurs de licence, en test fermé, **les achats sont réels**. Options :
  (A) groupe `halcya-testeurs` en testeurs de licence seul ; (B) **« période de lancement » côté relais** : premium
  accordé à toutes les installations play jusqu'à une date réglée sur le serveur (fin du test fermé), sans achat ni mise
  à jour ; (C) codes promo Play (offres d'abonnement, saisies dans le Play Store) — un geste de plus par testeur et un
  moyen de paiement demandé ; (D) essai gratuit de 14 jours puis annulation — risque réel de débit si un testeur
  oublie. **Recommandation : A + B** (personne ne paie, l'achat reste testable, B se coupe sans nouvelle version). →
  **P23** (choix du propriétaire), puis 6c/6e.
- **I152 (12) — Pas de calories ni d'IMC imposés à un public SII [V/H].** Une étude de 955 adultes SII trouve 13,2 %
  d'évitement / restriction alimentaire sévère, associé à plus de symptômes et une moins bonne qualité de vie
  (étude de 2022 rapportée par gutsandgrowth.com et Michigan Medicine, lus le 22/10) ; le lien avec les applis de comptage
  de calories n'est pas démontré chez les SII [H]. Cohérent avec la règle 6 (pas de normes imposées) : en play,
  objectif calorique et IMC repliés derrière « détails », jamais de jugement d'un repas. Impact 3, faisabilité 5. →
  VC-3.

---

## Run du 22/10/2026 08:30 (Paris) — M2 prêt à coder, et le choix de Google Play Billing

- **I144 (22) — M2 directement codable : aiguilleur P2P par numéro et par classe [V].** Spec complétée dans
  `protocoles/huawei.md` §10.10 (Gadgetbridge master `32a3de0b2c`, faits seulement). Deux pièges qu'on aurait payés en
  essais sur la vraie montre : ① le premier numéro envoyé est **2** (compteur incrémenté avant l'envoi) ; ② notre
  `session.request()` prendrait l'accusé de la montre pour la réponse (rattachement par service / commande) → il faut un
  aiguilleur sur `session.listen(0x34, 0x01)` qui rattache le ping par **numéro** et les données par **classe**, et
  acquitte chaque message de la montre avec **son** numéro. Réels de 4 o (simple) ou 8 o (double), délai par page (10 s)
  et garde-fou de 50 pages, absents chez Gadgetbridge. Impact 4, faisabilité 4. → **M2, prochain run de code montre.**
- **I145 (8) — Ne pas lire les « émotions » calculées par la montre (classe 500031) [H].** Décision proposée pour le
  point laissé ouvert au §10.1 : les lire n'apporte rien au parcours (Y vient du visage / de la voix / de
  l'auto-déclaration, D5) et ajouterait un **second système de reconnaissance des émotions** à déclarer (AI Act,
  fiche Play). On ne demande pas la classe ; on pourra la reconsidérer comme X affiché à part si un utilisateur la
  réclame. Impact 2, faisabilité 5.
- **I146 (20) — Google Play Billing : plugin `capacitor-plugin-cdv-purchase` (MIT) + notre relais comme validateur
  [V].** Comparatif du 22/10 : cdv-purchase 13.19 (MIT, **PBL 9.0**, Capacitor 6 / 7 / 8, validateur configurable vers
  notre URL, sans le service Iaptic) ; `@capgo/native-purchases` (MPL-2.0, PBL 9.1, Capacitor ≥ 7) ; RevenueCat (SDK MIT
  mais **tous les achats passent par leurs serveurs**, clé de compte de service Play à leur confier, sous-traitant RGPD,
  gratuit jusqu'à 2 500 $ / mois puis 1 %) → écarté (« local par défaut », doublon du relais) ; plugin Kotlin maison
  (~400 lignes, 2–4 jours) gardé en secours. **PBL 8 minimum** obligatoire depuis le 1/11/2026 pour toute app qui
  facture (PBL 9 valable jusqu'au 31/08/2028). Côté relais : `purchases.subscriptionsv2.get` (seule source de vérité),
  **accusé de réception par le serveur** (`purchases.subscriptions.acknowledge`, sinon remboursement automatique au bout
  de 3 jours), `linkedPurchaseToken` (changement de formule, réabonnement), RTDN = simple signal pour relire
  `subscriptionsv2`, `obfuscatedAccountId` = identifiant aléatoire par installation (aucune donnée personnelle).
  Impact 5, faisabilité 4. → jalon 6.
- **I147 (15) — Prix et essai jamais codés en dur, conformes à la règle « abonnements » [V].** Lire
  `subscriptionOfferDetails` → `pricingPhases` (`formattedPrice` déjà localisé, `billingPeriod` P1M / P1Y) ; l'essai
  n'est montré **que si l'offre gratuite revient dans la réponse** (Google ne renvoie que les offres auxquelles la
  personne a droit : pas d'essai « promis » à quelqu'un qui l'a déjà eu). Ne pas mettre en cache `ProductDetails`.
  Règle Play confirmée : prix facturé (29,99 €/an) en principal, équivalent mensuel en petit ; avant l'essai, dire quand
  et comment il devient payant ; lien d'annulation `play.google.com/store/account/subscriptions?sku=…&package=…` dans
  les Réglages. Impact 4, faisabilité 5.
- **I148 (10) — Tests d'abonnement rapides avec les testeurs de licence [V].** Renouvellements accélérés (mois = 5 min,
  an = 30 min, essai = 3 min, 6 renouvellements au plus) et cartes de test (toujours acceptée / refusée / lente /
  rétrofacturée) → un scénario de bout en bout (essai → paiement → annulation → période de grâce) en moins d'une heure.
  Ordre imposé : profil de paiement (propriétaire) → AAB contenant la permission BILLING en test interne → création des
  abonnements par l'API (`monetization.subscriptions`, ❓ non confirmé sans profil de paiement). Note annexe : le dépôt
  a `@capacitor/core` 8 mais `@capacitor/cli` 7 → à aligner (petit run de maintenance). Impact 3, faisabilité 5.

## Run du 21/10/2026 20:30 (Paris) — montre Huawei : pourquoi le sommeil, la VFC et la température ne remontent pas

Signalement du propriétaire du 21/10 ~20:00. Spécification complète : `protocoles/huawei.md` §10 (inventaire GT 6 Pro,
cause, voie P2P, plan M1–M7). Source : Gadgetbridge master `0735529275` du 21/10, lu par l'API Codeberg, faits seulement.

- **I139 (25) — Corriger la question des capacités : le sommeil détaillé revient [V].** Besoin : le sommeil et la VFC
  de nuit sont des facteurs X clés des pistes. HealthTrack demande à la montre si elle prend en charge le service de
  fichiers 0x2C ; la GT 6 Pro répond « non » (journal du 14/10) et HealthTrack saute donc le sommeil détaillé à chaque
  synchro. Or ce service n'est pas une « capacité » : Gadgetbridge ne pose jamais la question et l'utilise directement
  (GT 6 Pro : sommeil confirmé par un testeur, #5428). Décider par TruSleep (7/0x16) + capacité étendue 143. Impact 5,
  faisabilité 5 (quelques lignes + tests). Un seul fichier rapporte d'un coup : phases, score, réveils, siestes, **VFC,
  respiration, SpO₂ et FC de la nuit**. → **M1, premier run de code.**
- **I140 (20) — Service P2P « dictionnaire » : VFC de journée et température cutanée [V].** Messages 0x34/0x01 entre
  `hw.unitedevice.datadictionarysync` et `hw.watch.health.filesync` (identifiants publics) ; classes 500044 (RMSSD,
  capacité 235) et 400012 (température de la peau, capacité 29). Impact 4, faisabilité 3 (ping, séquences, accusés,
  pagination). → M2, M3.
- **I141 (12) — Stress de la montre comme facteur X.** Même correctif de capacité, fichier `rrisqi` v3. Jamais une
  entrée du bien-être estimé (D5). → M4.
- **I142 (10) — Identifier les étages sans données réelles.** Consigner, en nombres seulement, les bits inconnus des
  minutes et comparer au chiffre que la montre affiche (le propriétaire le dit) : ce qu'aucun projet n'a encore décodé
  (#5724). → M4.
- **I143 (15) — Écran « Montre » orienté propriétaire.** Une ligne par type de donnée : dernière valeur, date, n sur
  7 j, issue de la dernière lecture. Rend chaque correctif vérifiable en un coup d'œil. → M5.
- **Garde-fou D5** : la GT 6 Pro calcule elle-même des « émotions » (classe 500031, valence / éveil). Elles ne doivent
  jamais nourrir l'estimation du bien-être (Y) ; à ignorer, ou à montrer comme une mesure de la montre à part.
- **Différenciateur produit [H]** : Huawei Santé n'écrit pas dans Health Connect ; les utilisateurs passent par des
  passerelles tierces (applis de synchro via le cloud Huawei) ou par Gadgetbridge (qui remplace Huawei Santé). Lire la
  montre en direct, sur le téléphone, sommeil détaillé, VFC et température compris, reste rare : argument pour la fiche
  Play (« compatible avec les montres Huawei »), à n'écrire qu'une fois M1–M3 validés sur la vraie montre.

---

## Run du 21/10/2026 08:30 (Paris) — premier run « idées » du chantier produit : Health Connect, pistes SII, paywall

Question du jour, côté utilisateur SII : *« au premier lancement, est-ce que l'app me montre déjà quelque chose
d'utile ; quand elle me parlera de mes déclencheurs, puis-je lui faire confiance ; et quand elle me demandera de
payer, est-ce clair et honnête ? »* Démarrage : PR #246 (jalon 3b-1) verte mais laissée ouverte par le run de 06:30
→ revérifiée en local (1 676 Vitest, build, lint 6 = main, visuel + divulgation caméra lue) puis **fusionnée** (v193) ;
#245 fermée (contenu repris). Méthode : trois recherches en parallèle sur sources primaires (developer.android.com,
support.google.com/googleplay, monashfodmap.com, RevenueCat / Adapty), [V] = lu sur la source, [T] = tierce.

### Ce qu'on apprend (faits)

**Health Connect et Play (jalons 4, 8, 10)**
- **« Aha » du jour 1 sans permission spéciale** [V developer.android.com/…/read-data, 21/10] : dès le premier
  octroi, une app lit les **30 jours précédant l'octroi**, de toutes les sources (Android 14+ : ses propres données
  sans limite). Au-delà : `READ_HEALTH_DATA_HISTORY`, à ne demander que si `getFeatureStatus(
  FEATURE_READ_HEALTH_DATA_HISTORY)` = disponible (connect-client ≥ 1.1.0-alpha08). Désinstaller révoque tout ; la
  fenêtre de 30 j repart du nouvel octroi. `READ_HEALTH_DATA_IN_BACKGROUND` : même principe (feature flag),
  l'app doit marcher sans.
- **Notre plugin** `@capgo/capacitor-health` 8.4.5 déclare **21 permissions READ** (glycémie, tension, SpO₂…) et ni
  HISTORY ni BACKGROUND [V `node_modules/…/AndroidManifest.xml`]. Or Play **refuse les types demandés mais non
  utilisés** et les écarts manifeste ↔ formulaire [V support.google.com/…/12991134] ; justification **par type**
  (« needed for app functionality » refusé) ; les « self-reported symptoms » sont examinés de plus près ; nouveau
  formulaire si les types changent.
- **Aucun type Health Connect pour les symptômes digestifs, les selles ou la douleur** [V page data-types,
  23/09/2026] → les symptômes SII restent locaux (et on évite la revue renforcée). Utiles : Nutrition, Hydration,
  Sleep, Exercise, Steps, HRV, MenstruationFlow/Period (extension SII + cycle).
- **Déclaration « Health apps »** obligatoire (même en test fermé) [V answer/14738291] : catégories Health & fitness
  (Nutrition & Weight Management, Sleep, Stress…) ; « Diseases and Conditions Management » est dans le groupe
  **Medical** — à éviter pour rester en Health & Fitness (décision du 20/10) ; la case « Medical Device Apps » reste
  décochée. **Politique « Health Content and Services »** [V answer/16679511] : une app non dispositif médical doit dire
  dans sa description qu'elle « n'est pas un dispositif médical et ne diagnostique, ne traite, ne guérit ni ne prévient
  aucune maladie », et renvoyer vers un professionnel.
- **Test fermé : toujours 12 testeurs × 14 jours** pour les comptes personnels [V answer/14151465]. **Vérification des
  développeurs** : France concernée « en 2027 et au-delà » [V developer.android.com/developer-verification].
  **Google Fit** : « supported until the end of 2026 » [V migration/fit, 10/09/2026].

**Pistes SII (jalons 5 et 7)**
- **Délais** [V monashfodmap.com/blog/timing-of-symptoms, 2016] : transit bouche-anus 12–48 h ; un symptôme
  quelques minutes après un repas vient du **réflexe gastro-colique**, pas de la fermentation ; un repas « pousse »
  les précédents → on accuse le mauvais aliment ; regarder les 48 h précédentes. IRM Nottingham 2017 [T] : fructose
  → eau dans l'intestin grêle, pic ≈ 75 min ; inuline (fructanes) → gaz côlon, pic 3–5 h. **Pas de source primaire
  chiffrant le délai de chaque groupe** (lactose, GOS, polyols).
- **Réintroduction Monash** [V practical-tips 2020 + diary function 2020] : un sous-groupe à la fois, **3 jours de
  doses croissantes** à la même heure, **pause de 2–3 jours** (ou jusqu'au calme) en restant pauvre en FODMAP,
  arrêt si gêne à J1/J2, combinaisons en dernier, 6–8 semaines au total ; « un peu de gaz est normal ».
- **Statistique N-of-1** [T] : l'autocorrélation entre jours réduit fortement la puissance ; tests par bootstrap /
  permutation par blocs mieux calibrés que Wald ; **aucune source ne donne de nombre minimal de jours** → à fixer
  par simulation (comme pour la porte du visage).
- **Fiabilité des journaux** [T] : 9 710 journaux mySymptoms (Dig Dis Sci 2024, auteurs liés à l'éditeur) — café →
  diarrhée en 1–2 h, alcool 4–72 h, édulcorants 24–72 h, **aucun signal FODMAP** ; pilote 2016 : 73 % des
  participants avec une association « forte » en 2 semaines (faux positifs probables) ; essai 2025 : gluten, blé et
  placebo donnent les mêmes réponses chez des SII « sensibles au gluten » (**effet d'attente**) ; 3 patients sur 19
  seulement trouvent le bon aliment. → Notre promesse « on préfère attendre » est un vrai différenciateur.
- **Concurrence** : Monash FODMAP 8,99 € (achat unique, FR, 4,2/5) avec journal de réintroduction ; Bearable
  34,99 $/an, corrélations payantes **sans méthode publiée** ; mySymptoms analyse payante, algorithme opaque ; Cara Care
  = DiGA allemande (Bayer), absente en France ; nouveaux venus IA (BellyCue…) sans validation publiée. **Aucune app
  française dédiée au SII trouvée.** APSSII : 52 % des patients connaissaient le FODMAP en 2017 (7 % en 2013).

**Paywall et abonnement (jalon 6)**
- **Benchmarks Health & Fitness** [V RevenueCat State of Subscription Apps 2026 ; Adapty 27/03/2026] : 37,7 % des
  essais deviennent payants (médiane) ; essais de 10–16 j ≈ 35 % contre 25 % pour ≤ 4 j ; **82–86 % des essais
  démarrent à J0** ; médiane ≈ 39,94 $/an et 9,99 $/mois (nos 29,99 € / 4,99 € sont sous la médiane) ; l'annuel
  ≈ 61 % du revenu H&F ; Android convertit nettement moins qu'iOS ; **31 % des annulations Play sont involontaires**
  (paiement) ; remboursements H&F 4,7 %.
- **Play Billing** [V developer.android.com/google/play/billing, 20/10/2026] : un seul essai par utilisateur et par
  app par défaut ; `queryProductDetailsAsync` ne renvoie que les offres auxquelles la personne a droit → afficher
  « Essayer 14 jours » **seulement si l'offre revient** ; prix via `formattedPrice` (jamais en cache) ; **PBL ≥ 8
  obligatoire** (9.1.0 actuelle) ; grâce + suspension activées par défaut (60 j cumulés) — accès gardé en grâce,
  coupé en suspension.
- **Politique « Subscriptions »** [V answer/9900533] — **point d'attention pour la maquette validée** : est une
  violation explicite « un plan annuel qui **met en avant** son prix mensuel ». Notre « soit 2,50 € par mois » doit
  rester **secondaire** (plus petit que « 29,99 €/an », jamais en titre ni dans le bouton). Aussi : prix, fréquence,
  renouvellement automatique et « l'app reste utilisable sans abonnement » visibles sans étape ; pour l'essai, durée,
  date et prix de la conversion, comment annuler ; fermeture bien visible ; ne pas nommer un produit « Free Trial » ;
  lien d'annulation dans l'app (centre d'abonnements Play). Google envoie lui-même un e-mail avant la fin de l'essai ;
  notre rappel J-2 est un plus.

### Idées

- **I130 (20) — « Vos 30 derniers jours » au jour 1, sans permission d'historique.** Besoin : l'« aha » du jour 1
  (jalon 4). Après l'octroi Health Connect dans l'onboarding, importer J-30 (sommeil, pas, FC/VFC, séances, cycle) et
  afficher un résumé simple (« 30 nuits, 7 h 05 en moyenne · 6 800 pas par jour · 3 sources »), chaque chiffre avec
  sa source. Pas de `READ_HEALTH_DATA_HISTORY` en v1 : plus tard, en option « Importer plus d'historique », derrière
  le feature flag (patch natif du plugin). Test : faux Health Connect avec 45 j → 30 j importés, résumé correct,
  sources citées. Impact 5, faisabilité 4.
- **I131 (16) — Manifeste play : seulement les permissions Health Connect utilisées.** Besoin : passer la revue Play
  du premier coup (jalons 3b-2 / 8). Retirer en play (`tools:node="remove"`) les READ du plugin non lues par
  `healthConnect` ; une liste déclarée `HC_READ_TYPES` comme seule source, et un test qui compare le manifeste fusionné
  de l'AAB (`check-play-manifest.sh`) à cette liste ; texte de justification **par type** préparé dans
  `PLAY-CONFORMITE.md`. Impact 4, faisabilité 4.
- **I132 (20) — Fenêtres de délai par hypothèse, pas un balayage.** Besoin : des pistes justes (jalon 5). Le moteur ne
  teste que **3 fenêtres** fixées d'avance : 0–4 h (présentée comme « réflexe après le repas, pas les FODMAP »),
  4–24 h, 24–48 h ; les normes par groupe (fructose/lactose plutôt tôt, fructanes/GOS 3–24 h, polyols/édulcorants
  24–48 h) ne servent que d'**hypothèses de départ affichées comme telles** (D6). Moins de fenêtres = moins de
  comparaisons = plus de puissance. Test : effet simulé à 6 h → piste dans 4–24 h, rien ailleurs. Impact 5,
  faisabilité 3.
- **I133 (20) — Seuil minimal et taux de fausses pistes mesurés par simulation.** Besoin : « on préfère attendre ».
  Avant toute piste : ≥ N jours exposés **et** ≥ N non exposés sur ≥ 21 jours ; N choisi par simulation (départ
  N = 8) pour que, sur 200 jeux **sans effet**, **moins d'un sur dix** affiche au moins une piste ; permutation par
  blocs de jours (autocorrélation) puis BH sur toutes les combinaisons facteur × symptôme × fenêtre ; le nombre de
  combinaisons examinées est affiché en mode détails. Même démarche que la porte du visage (I112). Impact 5,
  faisabilité 3.
- **I134 (16) — Repas du même jour démêlés, et facteurs non alimentaires en covariables.** Besoin : ne pas accuser
  le café quand c'est la mauvaise nuit (et le « repas qui pousse le précédent »). Sommeil, stress (Y ≠ X : seulement
  les X), écran entrent comme covariables ; les aliments d'un même jour sont estimés ensemble (régression pénalisée)
  et non un par un. Test : symptôme simulé dû à la nuit seule → aucune piste alimentaire. Impact 4, faisabilité 2.
- **I135 (20) — Réintroduction guidée au format Monash, machine à états testée.** Besoin : le premium SII (jalon 7).
  Groupe choisi → 3 jours de doses croissantes (rappel à heure fixe) → pause ≥ 3 j **ou jusqu'au calme** → verdict à
  trois niveaux (« bien toléré à cette dose », « à retester », « gêne observée »), **aucun verdict si le ventre de
  départ n'était pas calme** ; arrêt anticipé si gêne à J1/J2 ; groupe suivant bloqué pendant la pause ; combinaisons
  en dernier. Chaque verdict propose un retest et mentionne l'effet d'attente. Test : la machine refuse un 2e groupe
  pendant la pause. Impact 5, faisabilité 4.
- **I136 (16) — Paywall conforme à la politique Play (à intégrer à la maquette).** Besoin : ne pas se faire refuser
  et inspirer confiance. « 29,99 €/an » en grand, « soit 2,50 €/mois » en petit ; sous le bouton : « 14 jours gratuits,
  puis 29,99 € par an, renouvelé automatiquement. Annulable dans Google Play avant le JJ/MM. » (date calculée) ;
  bouton fermer bien visible + « Continuer gratuitement » ; « Essayer 14 jours » seulement si l'offre d'essai est
  renvoyée par Play, sinon « S'abonner » ; « Gérer mon abonnement » dans les réglages. Test : un test de rendu
  vérifie la taille relative des deux prix et la présence des mentions obligatoires. Impact 4, faisabilité 4.
- **I137 (12) — Suspension de compte : bandeau « Mettre à jour le paiement ».** 31 % des annulations Play sont
  involontaires : en période de grâce, accès gardé + bandeau ; en suspension, premium coupé (jamais les fonctions
  locales) + lien vers le centre d'abonnements. Impact 3, faisabilité 4.
- **I138 (12) — Phrase obligatoire « pas un dispositif médical » à un seul endroit.** Description Play, écran « À
  propos », bas des Pistes et du rapport PDF ; texte unique dans `src/config`, testé par `wording.test.js`. Impact 3,
  faisabilité 5.

### Sources (consultées le 21/10/2026)
- Health Connect : developer.android.com/health-and-fitness/guides/health-connect/develop/read-data ;
  …/plan/data-types (maj 23/09/2026) ; …/health-connect/features/availability ; …/health-connect/publish ;
  …/health-connect/migration/fit (maj 10/09/2026).
- Play : support.google.com/googleplay/android-developer/answer/12991134 (Health Connect), 14738291 (Health apps),
  16679511 (Health Content and Services), 14151465 (test fermé), 9900533 (Subscriptions), 112622 (frais) ;
  developer.android.com/developer-verification ; developer.android.com/google/play/billing/subscriptions,
  …/integrate (20/10/2026), …/lifecycle/subscriptions (15/10/2026).
- SII : monashfodmap.com/blog/timing-of-symptoms (2016), /practical-tips-fodmap-reintroduction (2020),
  /reintroduction-using-diary-function (2020) ; PMC10078221 (Algera 2023) ; nottingham-repository output/838398
  (IRM 2017), output/36013201 (mySymptoms 2024) ; PMC4822101, PMC5432136 ; pubmed 40706614 (gluten 2025) ;
  arXiv 2112.13991 ; PMC10817775 ; apps.apple.com/fr/app/id586149216 ; bearable.app/pricing.
- Abonnements : revenuecat.com/state-of-subscription-apps (2026) et -2025 ; adapty.io/blog/health-fitness-app-
  subscription-benchmarks (27/03/2026).
- Non trouvés / inaccessibles : avis Play Store en texte (Bearable, mySymptoms), Fody, ModifyHealth ; délai propre
  à chaque groupe FODMAP ; volumes de recherche des mots-clés français (Google Trends à faire).

### À creuser au prochain run idées (21/10 20:30)
- Plugin Capacitor de Play Billing compatible **PBL ≥ 8** (licence commerciale ? RevenueCat, cordova-plugin-purchase,
  ou petit plugin maison) — bloquant pour le jalon 6.
- Lecture de Whelan et al. 2018 (King's College) et des délais par groupe ; mots-clés FR (Trends) pour la fiche.
- AI Act art. 50 et RGPD art. 9 : formulation exacte du consentement à garder (preuve datée).

---

## Run du 20/10/2026 08:30 (Paris) — quel modèle valence / éveil, pour le visage et pour la voix ?

Question du jour, côté utilisateur (consignes du 18/10 et du 19/10 au soir) : *« l'humeur que l'app m'affiche dès la
première lecture vient-elle du meilleur modèle possible sur mon téléphone, et quand la voix s'y ajoutera-t-elle ? »*
Démarrage : signalement du 19/10 15:05 **corrigé et fusionné** (#221 pour (a) et (b), #228 pour (c)) ; main à
`81f7ce3` (#228) ; aucune PR « [Auto] » ouverte ; aucun diagnostic de l'A56 dans `journal/diagnostics/`. Méthode :
lecture des sources primaires (dépôts, fiches de modèles, article HSEmotion ABAW-6), **téléchargement des fichiers
ONNX officiels et mesure** dans le conteneur (onnxruntime CPU, 1 fil).

### Ce qu'on apprend (faits)

- **HSEmotion publie trois modèles valence / éveil en ONNX officiel, pas un seul** [V `git ls-tree` du dépôt
  `sb-ai-lab/EmotiEffLib`, 20/10] : `enet_b0_8_va_mtl.onnx` (16,0 Mo, 224 px — celui de l'app, empreinte `c43e056a…`
  identique), **`mbf_va_mtl.onnx`** (MobileFaceNet, **8,3 Mo, entrée 112 px**, SHA-256 `0323ace5…a4828c`) et
  `mobilevit_va_mtl.onnx` (39,4 Mo, 224 px, `93a2bee1…01b0c`). Même sortie (10 valeurs : 8 émotions + V + A),
  même dépôt Apache-2.0, même origine AffectNet. Pas de MT-DDAMFN publié en ONNX dans le dépôt.
- **Précision publiée** [V arXiv 2403.11590, tab. 1, 2 et 5] :

  | Modèle | AffectNet val. CCC V / A | Aff-Wild2 (vidéo réelle, sans réentraînement) CCC V / A | + lissage temporel | Taille | Mesuré ici (x86, 1 fil) |
  |---|---|---|---|---|---|
  | MT-EmotiEffNet-B0 (actuel) | 0,594 / 0,549 | 0,404 / 0,248 | 0,490 / 0,604 * | 16 Mo | 20 ms |
  | MT-EmotiMobileFaceNet | 0,577 / 0,547 | **0,413 / 0,266** | 0,483 / 0,610 * | **8 Mo** | 22 ms |
  | MT-EmotiMobileViT | 0,599 / 0,565 | 0,403 / 0,244 | 0,493 / 0,612 * | 39 Mo | 73 ms |
  | MT-DDAMFN (non publié en ONNX) | **0,729 / 0,643** | 0,412 / 0,230 | 0,519 / 0,616 * | — | — |

  \* tableau 2 (modèle + lissage + régression entraînée sur Aff-Wild2) ; tableau 5 = modèle brut, la colonne qui
  ressemble le plus à notre usage. **Leçon** : l'avance de DDAMFN sur AffectNet (0,73) **disparaît** sur des vidéos
  réelles (0,41 comme les autres) — les quatre se valent hors de leur base d'apprentissage ; le **lissage temporel**
  (moyenner plusieurs images) rapporte plus (+0,05 à +0,09) que changer de modèle.
- **EmoNet** [V README `face-analysis/emonet`, 20/10] : CCC 0,82 / 0,75 (AffectNet « nettoyé », 8 classes — jeu de
  test propre aux auteurs, non comparable aux chiffres ci-dessus) ; **licence CC BY-NC-ND 4.0 confirmée** ; PyTorch
  seulement → l'exécuter sur Android exigerait une conversion (œuvre dérivée interdite). **Définitivement écarté.**
- **Validité intra-personne** [V MoodCam, arXiv 2412.12625] : 25 personnes, 15 995 interactions avec le téléphone,
  4 semaines → AUC 0,58–0,64 (valence), 0,60–0,63 (éveil) pour l'humeur auto-déclarée. Aucune étude 2026 plus forte
  trouvée. Le plafond vient de la tâche (visage au repos devant un écran), pas du modèle : choisir un modèle plus
  lourd n'y changera presque rien ; **la moyenne de nombreuses lectures et la ligne de base personnelle, si**.
- **Voix — aucun modèle valence / éveil à la fois embarquable et sous licence claire** [V fiches HF, 20/10] :
  - audEERING `wav2vec2-large-robust-12-ft-emotion-msp-dim` (≈ 300 M param.) : CC BY-NC-SA 4.0, « recherche
    uniquement », licence commerciale payante ;
  - audEERING **Wav2Small** (72 K param., ≈ 120 Ko ONNX quantifié d'après l'article arXiv 2408.13920) et son élève
    MobileNetV4 (3,1 M) : **CC BY-NC-SA 4.0, recherche uniquement** — idéal techniquement, interdit de licence ;
  - `3loi/SER-Odyssey-Baseline-WavLM-Multi-Attributes` : **MIT**, valence / éveil / dominance, CCC test 0,58 / 0,41
    (valence / éveil, MSP-Podcast) mais WavLM-large ≈ 316 M param. (≈ 1,2 Go en float32, ≈ 320 Mo en int8 [H]) :
    beaucoup trop lourd pour un téléchargement « quelques dizaines de Mo » et pour tourner plusieurs fois par jour ;
  - emotion2vec+ (90 M–300 M) : licence non trouvée ; SenseVoice-Small : « model-license » maison, pas de français
    annoncé, émotions en classes seulement ;
  - l'article MSP-Podcast (arXiv 2509.09791, sept. 2025) dit que les enregistrements viennent de sources dont la
    licence « permet la distribution » ; la licence d'accès au corpus lui-même reste à lire [H].
  → La conclusion du 19/10 (I117 : **le texte avant le son**) est renforcée par la licence, pas seulement par la
  précision.

### Idées

- **I126 (16) — Duo de modèles du visage : B0 + MobileFaceNet, et leur désaccord dans la confiance.**
  Besoin : une humeur plus stable et une confiance honnête (« accord entre signaux » demandé par la consigne du 19/10
  au soir). Ajouter `mbf_va_mtl.onnx` (8 Mo, même source, même téléchargement vérifié, empreinte ci-dessus) ; chaque
  image passe dans les deux ; valence = moyenne ; **|V_B0 − V_MBF|** moyen de la lecture entre dans la confiance (fort
  désaccord → « lectures discordantes », fourchette élargie). MobileFaceNet a la meilleure CCC sur Aff-Wild2 et lit un
  visage de 112 px, moins sensible à la basse résolution de nos images. Coût : +20 ms par image (mesuré x86, à revoir
  sur l'A56), +8 Mo une fois. Test : vecteur d'entrée 112 px (même recadrage aligné, redimensionné), équivalence
  Java ↔ Python sur une image synthétique, puis `faceMood` (moyenne, désaccord → confiance). Impact 4, faisabilité 4.
  *Pourquoi pas MobileViT* : 2,4× plus lourd, 3,6× plus lent, aucun gain hors AffectNet.
- **I127 (7) — Lisser avant de croire : déjà en grande partie en place.** Le gain le plus net du tableau est le
  lissage temporel. Vérifié dans le code : chaque lecture prend la **médiane** des valences de ses images valides
  (`FacePipeline.java:140`) et le jour la médiane de ses lectures (`mood/faceMoodDays.js`). Reste : pondérer les
  lectures du jour par leur qualité (cadrage, lumière) — petit run JS, testable seul.
- **I128 (10) — Voix : rester sur le texte ; sonder la prosodie seulement avec un modèle sous licence claire.**
  Pas de modèle vocal valence / éveil dans l'APK tant qu'aucun n'est léger **et** sous licence permissive. Étape 3 de
  la consigne du 19/10 = fusion **visage + phrase du soir** (déjà là, I119) puis **dictée** (I117, I124 d'abord).
  Veille à reprendre : licence d'accès MSP-Podcast (si elle permet d'entraîner un petit modèle à nous à partir d'un
  modèle MIT comme professeur — recette Wav2Small, dont l'article est sous CC BY-SA), modèles 2026 « small » sous
  Apache / MIT.

### Écartées (et pourquoi)
- EmoNet (CC BY-NC-ND, conversion interdite) ; MobileViT (lourd, sans gain réel) ; MT-DDAMFN (non publié en ONNX,
  avance limitée à AffectNet) ; audEERING / Wav2Small (licence recherche) ; WavLM MIT (316 M paramètres).

### Sources (consultées le 20/10/2026)
- Savchenko, *HSEmotion Team at the 6th ABAW Competition*, arXiv 2403.11590 (PDF, tableaux 1, 2, 5) [V].
- Dépôt `sb-ai-lab/EmotiEffLib` (arborescence, LICENSE Apache-2.0, fichiers ONNX téléchargés, SHA-256 calculés) [V].
- `face-analysis/emonet` README et LICENSE.txt [V].
- Hugging Face : `audeering/wav2small` (CC BY-NC-SA 4.0), arXiv 2408.13920 (Wav2Small) ;
  `3loi/SER-Odyssey-Baseline-WavLM-Multi-Attributes` (MIT) ; `FunAudioLLM/SenseVoiceSmall` [V] ;
  `audeering/mobilenetv4-emotion` (page en 401, licence d'après un résultat de recherche [T]).
- MoodCam, arXiv 2412.12625 [V résumé] ; MSP-Podcast, arXiv 2509.09791 [V résumé].

---

## Run du 19/10/2026 20:30 (Paris) — la porte du visage face aux dérives lentes, lire le diagnostic de l'A56, voix et lexiques

Question du jour, côté utilisateur (consigne du 18/10 au soir, priorité unique) : *« quand HealthTrack me dira enfin
"votre visage suit vos notes", est-ce que je pourrai le croire ? Et quand j'enverrai mon diagnostic, saurez-vous tout
de suite quoi corriger ? »* Démarrage : signalement du 19/10 15:05 **déjà corrigé et fusionné** (PR #221, v176 ;
v177 publiée depuis avec #222) ; aucun diagnostic de l'A56 dans `journal/diagnostics/` ; aucune PR « [Auto] » ouverte ;
main vert. Méthode : relecture de `gate.js`, simulation avec le vrai code (`protocoles/porte-autocorrelation-sim.test.js`),
veille sur les pistes laissées par le run de 08:30.

### Ce qu'on apprend (faits)

- **La porte de calibration croit à de faux liens quand tout dérive lentement** [V simulation, vrai `gate.js`] :
  `gate.test.js` simule des jours **indépendants**. Or l'humeur d'un jour ressemble à celle de la veille (inertie
  émotionnelle, saisons, périodes chargées) et les indices du visage dérivent aussi pour des raisons sans rapport avec
  l'humeur (lumière qui baisse en automne, lunettes, coupe de cheveux, nouvelle coque, exposition automatique). Deux
  séries qui dérivent chacune de leur côté se « corrèlent » par hasard bien plus souvent que ne le croit une erreur
  type calculée comme si les jours étaient indépendants ; et la validation croisée « un jour en moins » laisse dans
  l'apprentissage la veille et le lendemain, qui partagent la même dérive. Mesuré (300 tirages sans aucun lien,
  120 jours, règle actuelle) :

  | autocorrélation humeur / visage (jour à jour) | faux départs, règle actuelle | bloc ±7 j + n effectif | + écart à la moyenne des 14 j précédents | lien ρ 0,5 ouvert à J120 (actuelle → bloc + n eff. + écart) |
  |---|---|---|---|---|
  | 0 / 0 (jours indépendants) | 1,3 % | 1,0 % | 2,7 % | 55 → 53 % |
  | 0,4 / 0,4 | 2,7 % | 1,7 % | 1,7 % | 63 → 45 % |
  | 0,6 / 0,6 | **12,7 %** | 1,0 % | 2,7 % | 62 → 35 % |
  | 0,6 / 0,9 (moitié dérive) | 9,3 % | 2,0 % | 2,0 % | 71 → 49 % |
  | 0,8 / 0,95 (moitié dérive) | **22,3 %** | 2,0 % | 1,3 % | 77 → 37 % |
  | 0,9 / 0,95 (70 % dérive) | **55,7 %** | 7,0 % | 3,0 % | 79 → 21 % |

  (Écart d'échantillonnage ≈ ±1 point sur les faux départs ; le cas indépendant donne 1,3 % au lieu des 0,5 % de
  `gate.test.js` parce que les graines diffèrent.) Avec l'autocorrélation typique de l'humeur quotidienne (0,4 à 0,6
  dans les études de journaux), la règle actuelle afficherait une humeur estimée **sans fondement** chez 1 personne
  sur 8 ; correctif « bloc + n effectif » : ≈ 1 à 2 %. Le prix : une porte plus lente à s'ouvrir pour un vrai lien
  (un lien ρ 0,5 ouvert à J120 dans 35–50 % des cas au lieu de 60–75 %, une partie de l'« avantage » de la règle
  actuelle étant justement due à la dérive commune). C'est le bon côté de l'erreur (D5 : jamais d'humeur qui ne veut
  rien dire), et les notes du soir d'un geste (I113) et le 2e essai (I118) compensent en partie.
- **Ce qui est déjà sain dans `gate.js`** [V code] : λ fixé d'avance (pas choisi sur les mêmes jours), sélection des
  indices sans regarder les notes (présence ≥ 80 % des jours), un seul indice combiné (pas de comparaisons multiples).
  C'est exactement ce que reproche à **MoodCam** une relecture automatique publiée en 2026 sur Pith (fuite par la
  sélection des variables, modèle « moyenne du jour » circulaire) [T, relecture générée par un modèle, à prendre comme
  un avis] : nous n'avons pas ce défaut-là, mais nous avons celui des **voisins dans le temps** (ci-dessus).
- **Samsung documente enfin ses « applis en veille »** [V developer.samsung.com/mobile/app-management.html] : une
  app non ouverte **≈ 3 jours** et jugée gourmande passe « en veille » (tâches, alarmes **et services de premier plan
  restreints**) ; ≈ 16 jours → « veille profonde » (rien ne tourne hors de l'app ouverte). Exemption : Paramètres →
  Entretien de l'appareil → Batterie → Limites d'utilisation en arrière-plan → **Applis jamais en veille**. Samsung
  fournit un **lien direct** vers ces listes : action `com.samsung.android.sm.ACTION_OPEN_CHECKABLE_LISTACTIVITY`,
  paquet `com.samsung.android.lool`, extra `activity_type` = 0 (en veille), 1 (veille profonde), **2 (jamais en
  veille)**. Aucune API ne dit si une app y est : seul le diagnostic peut le déduire (service vivant, rafales qui
  manquent). Le propriétaire ouvre l'app chaque jour, donc la veille automatique ne devrait pas le toucher, mais
  « Optimiser automatiquement » de One UI peut la déclencher plus tôt [T forums].
- **Service caméra et arrière-plan, rappel exact** [V developer.android.com, FGS Android 12+] : un service de premier
  plan qui a besoin d'une autorisation « pendant l'utilisation » (caméra, micro, position) **ne peut pas être créé
  depuis l'arrière-plan, même avec une exemption** (optimisation de batterie désactivée, appareil compagnon,
  `SYSTEM_ALERT_WINDOW`…) ; s'il l'est quand même, Logcat écrit « Foreground service started from background can not
  have location/camera/microphone access ». → Confirme le choix du 19/10 16:30 (`startOrigin`, état « À relancer »,
  relance app ouverte) ; seul l'app-op `CAMERA allow` (Shizuku / ADB) lève la contrainte.
- **Lexiques français libres : rien d'utilisable sans risque** [V NRC ; T FEEL] : NRC EmoLex est gratuit pour la
  **recherche**, payant (licence commerciale perpétuelle) sinon, et sa version française vient d'une traduction
  automatique « parfois fausse » selon NRC lui-même. FEEL (LIRMM, Abdaoui et al. 2017, 14 000 termes) en dérive
  (traduction + synonymes de NRC, validée par un traducteur) : **aucune licence trouvée** (page HAL bloquée par un
  anti-robot, NoRaRe et `sentometrics` ne disent rien). → On garde le lexique écrit à la main (I119), enrichi par les
  retours du propriétaire ; pas d'import tant qu'une licence claire n'est pas lue.
- **Reconnaissance vocale hors ligne en français sur un Galaxy A** [T] : Samsung distribue des paquets « En-Fr
  Language Pack » / « Samsung on-device Resource » (dictée hors ligne du clavier Samsung, Bixby hors ligne en
  français depuis 02/2023), réservés à ses propres apps ; côté Android, `SpeechRecognizer.isOnDeviceRecognitionAvailable`
  / `createOnDeviceSpeechRecognizer` (API 31) et `checkRecognitionSupport` (API 33) disent si un moteur local existe et
  s'il gère fr-FR ; sur certains téléphones l'appel lève `UnsupportedOperationException` [T]. **Personne ne publie ce
  que fait un A56** : il faut le mesurer chez le propriétaire avant d'écrire I117 natif.
- **Bien-être numérique ≠ `queryEvents`** [T issuetracker 118564471 / 118331259, forums] : Google ne publie pas la
  définition ; Bien-être numérique compte le temps **à l'écran, écran allumé** ; les écarts viennent de l'appariement
  des événements (appels en incrustation, apps superposées, `PAUSED` manquant — « Instagram 23 h » signalé). Notre
  plafond de session (2 h) et la coupure à l'écran éteint couvrent les cas connus ; l'écart réel se mesure sur l'A56.
- **Recherche 2026 sur le visage** : rien de neuf qui change le plan. Un article CHI 2026 sur la dynamique du sourire
  dans la dépression (ACM DL 10.1145/3772318.3791208, titre seulement) suit MoodCapture / FacePsy ; MoodCam reste la
  référence la plus proche (AUC 0,58–0,64). **Emobot** : toujours rien de publié en 2026 (homonymes seulement).

### Idées classées (impact × faisabilité) — aucune n'ajoute d'écran

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I121 | **Porte robuste aux dérives lentes** : dans `gate.js`, validation croisée **par blocs** (pour prédire un jour, apprendre sans les 7 jours avant et après) et z corrigé par la **taille d'échantillon effective** (z × √((1 − a)/(1 + a)), a = produit des autocorrélations d'un jour à l'autre de l'indice prédit et des notes, borné à ≥ 0) ; option : écart à la moyenne des 14 jours précédents si la dérive reste forte. Test : jeu AR(1) (0,6 / 0,6 et 0,8 / 0,95) dans `gate.test.js`, faux départs < 3 % à J120 | Une humeur estimée qu'on peut croire (D5) : 12,7 % → ≈ 1–2 % de faux départs avec une humeur réaliste | 5 | 4 | **20** |
| I122 | **Arbre de lecture du diagnostic de l'A56, écrit d'avance** (ci-dessous) : le run qui reçoit le fichier sait quoi coder en 5 minutes | Que votre prochain retour suffise à trancher (signalement 15:05) | 4 | 5 | **20** |
| I123 | **« Applis jamais en veille » en un geste, sur Samsung seulement** : bouton dans le Diagnostic (et dans la carte si le service a été retrouvé arrêté sans mise à jour ni redémarrage) qui ouvre directement la liste Samsung (`ACTION_OPEN_CHECKABLE_LISTACTIVITY`, `activity_type` 2), repli sur l'écran batterie de l'app ; complète « Sans restriction » (I96) | Que One UI n'endorme pas la lecture du visage ni la montre (D4, D3 maintenance) | 3 | 5 | 15 |
| I124 | **Sonde vocale avant la dictée native** : le diagnostic dit si un moteur de reconnaissance local existe (`isOnDeviceRecognitionAvailable`), s'il gère fr-FR (`checkRecognitionSupport`, API 33), quel service est par défaut, et si ML Kit GenAI *Basic* est disponible ; aucun micro ouvert | Décider I117 natif sur un fait, pas une supposition | 3 | 4 | 12 |
| I125 | **Mots ratés de la phrase du soir, sans garder la phrase** : quand la phrase ne donne aucune proposition, une puce « Rien reconnu — me le signaler ? » ouvre un brouillon de retour (mots tapés par la personne elle-même, rien d'enregistré par l'app) | Enrichir le lexique à partir des vrais mots du propriétaire, sans lexique sous licence douteuse | 2 | 4 | 8 |

**Écartées (pour l'instant)** : *importer FEEL ou NRC-FR* — licence absente (FEEL) ou commerciale payante / traduction
automatique (NRC). *Ouvrir la porte plus vite en abaissant le seuil z* — la simulation montre que c'est la dérive, pas
le seuil, qui fabrique les faux départs ; baisser le seuil les multiplierait. *Retirer la tendance de long terme par une
régression sur le temps* — moins robuste qu'un écart à une moyenne glissante passée quand la dérive n'est pas linéaire,
et risque de fuite si la fenêtre inclut l'avenir.

### Détail et pistes d'implémentation

**I121 — porte robuste.** `faceIndexLoo(days, { gapDays = 7 })` : pour chaque jour i, Ridge apprise sur les jours
j tels que |date_j − date_i| > 7 jours (λ = 10 toujours fixé ; standardisation inchangée, sans les notes) ; si moins
de 20 jours d'apprentissage, indice = moyenne des notes d'apprentissage. `jackknifeCorrelation` inchangé, puis
`zEff = z × √((1 − a)/(1 + a))`, `a = max(0, r1(indice)) × max(0, r1(notes))`, r1 = autocorrélation au pas d'un jour
comparable (jours triés, trous ignorés). Regards et seuils inchangés (z ≥ 3,29, deux regards, ≥ 30 jours ; refermeture
z < 1,5 sur 8 semaines). Tests : garder les tests actuels (jours indépendants : faux départs ≤ 1 %, lien 0,7 ouvert à J90
≥ 80 % — à revérifier, la puissance baisse un peu), ajouter `simulateDays({ phiMood, phiFace })` : faux départs < 3 % pour
(0,6 ; 0,6) et (0,8 ; 0,95). Diagnostic : `gate.a` (autocorrélation retenue) pour suivre ce qu'on corrige chez lui. Si
l'A56 montre une dérive forte du visage (a > 0,5), activer l'écart à la moyenne des 14 jours précédents (option déjà
simulée). Coût : ≈ 30 lignes ; calcul O(n² × p²) par regard, n ≤ 200 → négligeable.

**I122 — lire le diagnostic de l'A56 (fichier `healthtrack-visage-*.json`, v2).**
1. `detection.screenOns = 0` alors que le téléphone a servi → le récepteur du service n'existe pas : service mort ou
   recréé sans `onCreate` complet → regarder `camera.startOrigin`, `resume`, `starts` ; corriger l'enregistrement.
2. `screenOns > 0`, `unlocks = 0` → ni la diffusion ni l'interrogation du verrou ne voient le déverrouillage
   (One UI) → dernier secours prévu au backlog : interrogation écran allumé toutes les 2 min + `KEYGUARD_HIDDEN`
   d'UsageStats.
3. `unlocks > 0` mais `attempts` vide → `FaceSchedule` refuse tout : lire les motifs (intervalle, appel, chaleur,
   plafond) ; vérifier que l'horloge de `minIntervalMs` n'est pas remise à zéro à chaque allumage.
4. `attempts` avec `camera_disabled` / `camera_denied` / `CameraAccessException` et `startOrigin = background` →
   relance app ouverte (« À relancer ») ; avec `startOrigin = app` → One UI coupe la caméra malgré l'exemption :
   seule issue robuste, `appops CAMERA allow` (guide), et tester une relance du service à chaque retour dans l'app.
5. `attempts` réussies mais 0 visage → angle / lumière / délai : regarder `valid`, `rejected` ; essayer un délai de
   déverrouillage 1,2 → 0,8 s et le 2e essai (I118) ; la caméra frontale de l'A56 peut être lente à s'exposer.
6. Tout va bien (`unlocks ≈ screenOns`, lectures avec visage ≥ 12 / jour) → passer à I121, puis I115.
   `userPresents = 0` avec `bySource.keyguard > 0` est **normal** chez Samsung si la diffusion reste filtrée : le
   secours fait le travail ; le noter dans `protocoles/` comme comportement One UI.

**I123.** `FaceSensePlugin.openSamsungNeverSleep()` : `Intent("com.samsung.android.sm.ACTION_OPEN_CHECKABLE_LISTACTIVITY")`
`.setPackage("com.samsung.android.lool").putExtra("activity_type", 2)`, `FLAG_ACTIVITY_NEW_TASK` ; si
`resolveActivity` est nul (autre marque, One UI ancien) → `ACTION_APPLICATION_DETAILS_SETTINGS`. Affiché seulement si
`Build.MANUFACTURER` = samsung. Manifeste : `<queries><package android:name="com.samsung.android.lool" /></queries>`.

**I124.** Dans `FaceSensePlugin` ou un petit `VoiceProbePlugin` : `SpeechRecognizer.isRecognitionAvailable`,
`isOnDeviceRecognitionAvailable` (API 31), `checkRecognitionSupport(intent fr-FR, executor, callback)` (API 33 :
langues installées / téléchargeables), `Settings.Secure.getString(cr, "voice_recognition_service")` ; tout dans un
`try/catch` (`UnsupportedOperationException`) ; ajouté au diagnostic exporté sous `voice`. Aucun micro ouvert.

### Sources (consultées le 19/10/2026)
- Samsung Developers, *App management* (applis en veille / veille profonde, lien direct) :
  developer.samsung.com/mobile/app-management.html (lu).
- Android Developers, *Foreground service launch restrictions* (Android 12+, autorisations « pendant l'utilisation ») :
  developer.android.com/about/versions/12/foreground-services (résumé).
- NRC, *Sentiment and Emotion Lexicons* (conditions) : nrc.canada.ca/en/research-development/products-services/
  technical-advisory-services/sentiment-emotion-lexicons ; saifmohammad.com/WebPages/NRC-Emotion-Lexicon.htm (résumés).
- Abdaoui, Azé, Bringay, Poncelet, *FEEL: a French Expanded Emotion Lexicon*, Lang. Resour. Eval. 51:833–855 (2017),
  hal-lirmm.ccsd.cnrs.fr/lirmm-01348016 (notice ; page logicielle lirmm-02136090 bloquée par un anti-robot) ;
  norare.clld.org/contributions/Abdaoui-2017-EmoLex.
- Android `SpeechRecognizer` (`createOnDeviceSpeechRecognizer`, `checkRecognitionSupport`) : developer.android.com/
  reference/android/speech/SpeechRecognizer ; Samsung Research, *On-Device Bixby for 4 European Languages* (02/2023) ;
  apkmirror « En-Fr Language Pack » (mirroir tiers) [T].
- issuetracker.google.com/issues/118564471 et /118331259 ; forums Android Central / communauté Samsung [T].
- MoodCam, arXiv 2412.12625 ; relecture automatique sur pith.science/paper/2412.12625 [T] ; ACM DL
  10.1145/3772318.3791208 (CHI 2026, titre) ; Emobot : recherches FR / EN sans résultat 2026.
- Simulation : `journal/protocoles/porte-autocorrelation-sim.test.js` (vrai `faceIndexLoo` / `jackknifeCorrelation`).

### À creuser au prochain run idées (20/10 08:30)
- Autocorrélation réelle de l'humeur quotidienne auto-déclarée (méta-analyses d'inertie émotionnelle) pour fixer les
  cas de test de I121 ; et celle des indices du visage dès que l'A56 en a 2 semaines.
- Ce que fait One UI 8 de `ACTION_USER_PRESENT` (diffusion filtrée ou non) — à confirmer par le diagnostic.
- Reportés : π0 adaptatif ; I109 (verre / café tardif et VFC).

---

## Run du 19/10/2026 08:30 (Paris) — ce qui reste à capter : le temps par app, la voix, et assez de déverrouillages

Question du jour, côté utilisateur (consigne du 18/10 au soir, priorité unique) : *« le visage est en place et ma
note du soir se fait d'un geste. Qu'est-ce qui manque pour que HealthTrack connaisse mon humeur sans rien saisir ?
Mes réseaux sociaux, ma voix ? Et est-ce que je déverrouille assez souvent mon téléphone pour que le visage serve ? »*
Les quatre étapes restantes du plan (`BIEN-ETRE-AUTO.md` §3) : I89 Shizuku / ADB, I91 voix, temps par app (X), I115
estimation du jour. Aucun nouveau journal dans `journal/diagnostics/` (le diagnostic visage de l'A56 n'est pas encore
arrivé). Méthode : relire le code concerné, veille 2026, une simulation (`protocoles/rafales-par-jour-sim.py`).

### Ce qu'on apprend (faits)

- **Temps par app : presque tout est déjà là** [V code] : `PhoneUsagePlugin.queryScreenEvents` lit déjà
  `UsageStatsManager.queryEvents` (écran allumé / éteint, `KEYGUARD_HIDDEN` = déverrouillage) et l'accès « Données
  d'utilisation » est déjà demandé, avec le guide « Autoriser les paramètres restreints » (`PhoneUsageCard`). Il
  suffit de garder aussi `ACTIVITY_RESUMED` / `ACTIVITY_PAUSED` / `ACTIVITY_STOPPED` avec leur paquet. `queryEvents`
  est plus juste que `queryUsageStats` (agrégats signalés incohérents, Google « won't fix ») [T issuetracker
  118564471, 118331259] ; piège AOSP connu : un `PAUSED` peut manquer (passage direct `STOPPED`) [V commit AOSP] →
  fermer une session au `STOPPED`, à l'écran éteint, au `RESUMED` d'une autre app, plafond de durée. Android 15 a bien
  ajouté « Accès aux données d'utilisation » aux **paramètres restreints** des apps hors store [T 9to5Google,
  Android Authority 09/2024] : le guide existant couvre ce cas.
- **Catégorie d'app sans liste codée en dur** [H, API connue] : `ApplicationInfo.category` (API 26 :
  `CATEGORY_SOCIAL`, `VIDEO`, `GAME`, `NEWS`, `AUDIO`, `PRODUCTIVITY`, `MAPS`…) est déclarée par chaque app ; il faut
  voir le paquet (Android 11+) : le manifeste ne déclare que des `<package>` santé → ajouter `<queries><intent>`
  `MAIN` + `LAUNCHER` (apps qui ont une icône, sans `QUERY_ALL_PACKAGES`). Repli sur une petite table de paquets
  connus quand la catégorie est absente (WhatsApp, Snapchat… déclarent parfois `SOCIAL`, parfois rien).
- **Réseaux sociaux et humeur : effets moyens minuscules, très différents d'une personne à l'autre** [T résumé] :
  Elmer et al. 2025 (trois échantillons, ESM + journaux du téléphone) : usage du téléphone **dans l'heure avant** une
  mesure lié à une humeur un peu plus basse, β standardisés **0,00 à 0,08**, avec une hétérogénéité nette entre
  personnes ; Valkenburg, Beyens & Keijsers (Metapsychology) : coupler moyenne et séries N = 1 par personne. → Conforte
  D6 (aucun sens présupposé, analyse « chez vous ») et donne l'ordre temporel naturel : X = minutes de réseaux sociaux
  **avant** l'humeur, jamais pendant.
- **Voix : le texte dit beaucoup plus que le son** [V npj Digit. Med. 9:230, 28/02/2026, Emden… Opel] : 3 151
  journaux vocaux hebdomadaires (1–3 min, « comment vous êtes-vous senti cette semaine ? »), 284 adultes
  germanophones, transcription locale. Prédire le BDI : **texte (plongements Qwen3-8B) R² 0,34**, TF-IDF 0,19,
  **meilleur audio (wav2vec2 émotion d'audEERING) 0,06**, openSMILE eGeMAPS / ComParE et autres plongements audio
  proches du hasard ; la fusion audio + texte n'ajoute presque rien. **Intra-personne (changement d'une semaine à
  l'autre) : proche du hasard** — résultat négatif assumé par les auteurs. Revue de portée Frontiers Digit. Health
  2026 : les marqueurs vocaux ne sont **pas validés** en parole spontanée, à plusieurs voix ou ambiante [T résumé] ;
  parole ambiante captée par le téléphone (JMIR 2021) : seulement ≈ 16 % de l'audio contient de la parole
  intelligible, sans séparation de la voix de l'utilisateur [T résumé]. Sci. Rep. 2026 (WavLM affiné, AUC 0,90) :
  récits d'une minute sur téléphone d'étude, entre personnes, pas de validation externe [T résumé].
  → Ce que l'utilisateur **dit** de sa journée est le signal vocal le plus utile (c'est de l'auto-déclaration, donc
  Y) ; la prosodie reste candidate derrière la porte I112, sans promesse.
- **Une seule prise de son, deux lecteurs, aucun fichier** [V doc] : ML Kit GenAI *Speech Recognition*
  (`com.google.mlkit:genai-speech-recognition:1.0.0-alpha1`, alpha) : mode *Basic* sur la plupart des appareils
  API 31+, **fr-FR en bêta** ; `AudioSource.fromPfd()` accepte du **PCM 16 kHz mono 16 bits fourni par l'app en
  temps réel**. La plateforme fait pareil depuis l'API 33 : `RecognizerIntent.EXTRA_AUDIO_SOURCE` (un
  `ParcelFileDescriptor` ouvert par l'app ; la session finit quand l'app ferme le flux) [V doc]. → L'app lit le micro
  une fois (`AudioRecord`), calcule la prosodie en direct et pousse le même flux dans un tube vers la reconnaissance :
  rien n'est écrit sur disque. Dépend d'AICore (ML Kit) ou du service de reconnaissance installé (plateforme) : à
  vérifier sur l'A56 par le diagnostic.
- **Pas de Gemini Nano sur l'A56** [V liste ML Kit GenAI, 19/10/2026] : Prompt API et API de résumé / réécriture
  seulement sur Galaxy S25 / S26 / Z Fold7–8 / Z Flip8 / TriFold côté Samsung, aucun Galaxy A. → Lire la dictée par
  des **règles locales** (lexique français du ressenti, négations, intensifs), pas par un LLM embarqué.
- **Déverrouillages par jour** : 30 à 110 selon les sources, souvent anciennes et commerciales (≈ 30 en 2024, 80
  annoncés par Apple, 79 pour la génération Z en 2018) [T]. Le nombre réel du propriétaire est **déjà dans ses
  données** : `KEYGUARD_HIDDEN` est lu depuis des jours par le Temps d'écran.
- **Simulation** (`protocoles/rafales-par-jour-sim.py`, 300 tirages par case, même modèle que le 18/10 20:30, note du
  soir à 85 %, porte |z| ≥ 3,29 à deux regards) — part des tirages où la porte est ouverte :

  | rafales valides / jour | r_b = 0,2 : J60 / J90 / J120 | r_b = 0,3 : J60 / J90 / J120 | qualité (r_b 0,2 / 0,3) |
  |---|---|---|---|
  | 4 | 11 / 20 / 30 % | 30 / 54 / 72 % | 0,24 / 0,36 |
  | 8 | 18 / 34 / 55 % | 61 / 78 / 93 % | 0,32 / 0,45 |
  | 16 | 35 / 61 / 78 % | 76 / 93 / 98 % | 0,38 / 0,52 |
  | 32 | 44 / 67 / 87 % | 81 / 96 / 99 % | 0,41 / 0,56 |

  Faux départs (r_b = 0) : 1 à 3 % à J120 dans tous les cas. → **≈ 16 rafales valides par jour suffisent presque
  autant que 32 ; en dessous de 8, tout ralentit nettement.** Le seuil à surveiller dans le diagnostic est donc
  « rafales valides par jour ≥ 12 ».
- **Shizuku** [V manuel] : à relancer **après chaque redémarrage** (débogage sans fil) ; signalements « waiting for
  service… » sur la bêta One UI 8.5 [T forum Samsung]. Une commande `appops set` passée une fois devrait survivre au
  redémarrage (enregistrée par le système) [H] : c'est ce que I89 doit mesurer, sans promettre.
- **Emobot** : toujours rien de neuf publié en 2026 (homonymes seulement).

### Idées classées (impact × faisabilité) — aucune n'ajoute d'écran

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I116 | **Temps par app → facteurs X, sans liste de « mauvaises » apps** : `queryEvents` garde aussi `ACTIVITY_RESUMED / PAUSED / STOPPED` + paquet ; minutes par jour et **par heure** pour chaque catégorie (`ApplicationInfo.category` : réseaux sociaux, vidéo, jeux, actualités, messagerie…) ; entrées `phone_apps` ; facteurs « Réseaux sociaux (min) », « Vidéo (min) »… dans les Analyses ; test anti-circularité : aucune clé `phone_apps` dans `ESTIMATOR_INPUTS` | « Est-ce que mes réseaux me font du bien ou pas ? », chez moi (D5, D6), sans rien saisir | 5 | 5 | **25** |
| I117 | **Dictée du soir, une prise de son, deux lecteurs** : 🎤 dans la saisie bien-être ; `AudioRecord` 16 kHz → prosodie maison en direct (F0, énergie, débit, pauses) **et** même flux poussé en temps réel vers la reconnaissance (ML Kit *Basic* fr-FR, sinon plateforme `EXTRA_AUDIO_SOURCE`) ; rien d'écrit sur disque ; le texte → **note et tags proposés** par règles locales, rien d'enregistré sans un tap ; texte gardé seulement si l'utilisateur le valide comme note | La voix là où elle vaut quelque chose (npj 2026 : texte R² 0,34 contre audio 0,06), saisie en une phrase | 4 | 3 | 12 |
| I118 | **Assez de rafales, sans biais** : le diagnostic affiche les déverrouillages / jour (déjà lus) et les rafales valides / jour ; si < 12 valides / jour : un 2e essai 2 s plus tard quand la 1re rafale est écartée (visage absent, trop sombre), et intervalle minimal ramené de 5 à 2 min ; **toujours au déverrouillage, avant tout contenu** (jamais à l'allumage d'écran par une notification : contenu = biais de composition, I114) | Que le visage serve en 2–3 mois au lieu de 4+ (simulé : 8 → 16 rafales / jour = 55 → 78 % ouvert à J120 pour r_b 0,2) | 4 | 4 | **16** |
| I119 | **Mots du ressenti = Y, mots du contexte = X, jamais les mêmes** : la dictée et les notes libres sont lues par deux lexiques **disjoints** (ressenti : « contente, épuisé, stressé… » → proposition de note = auto-déclaration ; contexte : « mal dormi, sport, apéro… » → tags X) ; test qui échoue si un mot / une racine est dans les deux | Pas de cercle caché quand le texte sert à la fois à l'humeur et aux facteurs (D5) | 4 | 5 | **20** |
| I120 | **Au fil de la journée, plus tard** : une fois la porte ouverte, comparer les rafales du déverrouillage à ce qui s'est passé **dans l'heure d'avant** (réseaux sociaux, pas, appels) — ordre temporel garanti, beaucoup plus d'observations qu'au niveau du jour ; correction pour l'autocorrélation et la multiplicité (règles I107 / I108) | « Au fil de la journée » (consigne du 18/10 au soir) ; détecter des effets courts que la moyenne du jour efface | 3 | 3 | 9 |

**Écartées (pour l'instant)** : *voix de fond en continu* (service `microphone` permanent) — les marqueurs ne sont pas
validés en parole spontanée ou ambiante, ≈ 16 % seulement de parole intelligible, il faudrait reconnaître la voix du
propriétaire parmi d'autres et le micro serait coupé par Android pendant les appels (`isClientSilenced`) ; à
reconsidérer si la prosodie de la dictée passe la porte I112 chez lui. *Modèle d'émotion vocale embarqué* — inchangé
(licences non commerciales, audio ≈ hasard dans npj 2026). *LLM sur l'appareil pour lire la dictée* — pas de Gemini
Nano sur l'A56 ; un petit LLM embarqué alourdirait l'APK pour un gain incertain sur des phrases courtes. *Rafale à
l'allumage de l'écran* — l'écran s'allume aussi à l'arrivée d'une notification (contenu → biais de composition).

### Détail et pistes d'implémentation

**I116 — temps par app.** Natif : dans `queryScreenEvents` (ou une méthode sœur `queryAppEvents` pour garder la
réponse actuelle intacte), ajouter `ACTIVITY_RESUMED` (`e: 'fg'`), `ACTIVITY_PAUSED` / `ACTIVITY_STOPPED`
(`e: 'bg'`) avec `p: packageName` ; ignorer HealthTrack, le lanceur (`Intent.CATEGORY_HOME` résolu) et l'interface
système ; joindre une fois par paquet `{ p, label, category }` (`PackageManager.getApplicationInfo`, catégorie API 26).
Manifeste : `<queries><intent><action android:name="android.intent.action.MAIN" /><category
android:name="android.intent.category.LAUNCHER" /></intent></queries>`. JS (`services/phoneUsage.js`, fonction pure
testée) : sessions par paquet fermées au `bg`, au `fg` d'une autre app, à l'écran éteint, plafond 2 h ; agrégats
`{ date, byCategory: { social: min, video: min, … }, byHour: [24 × { social, video, … }], topApps: [5 × { label,
min }] }` → entrée `phone_apps` (même modèle que les entrées `phone_usage` actuelles ; aucune migration : nouveau
type d'entrée, export / import génériques). Catégories : `social` = `CATEGORY_SOCIAL` + table de repli (Instagram,
TikTok, Facebook, X, Snapchat, Reddit, LinkedIn, Threads, Bluesky) ; `messaging` séparé (WhatsApp, Messages, Signal,
Telegram…) car ce n'est pas la même chose ; `video`, `game`, `news`. Analyses : facteurs X déclarés dans
`VARIABLE_META` **sans sens** (pas de « moins = mieux »), et pour l'ordre temporel : minutes de la veille au soir
(18 h–24 h) pour l'humeur du lendemain, minutes du jour pour la note du soir (la note arrive après). Test :
`antiCircularity.test.js` vérifie que `social_min`, `video_min`… sont des facteurs et jamais dans `ESTIMATOR_INPUTS`.
Restitution : une ligne dans la carte « Temps d'écran » existante (« dont réseaux sociaux 1 h 12 »), aucune nouvelle
carte. À valider sur l'A56 : les minutes « réseaux sociaux » ≈ Bien-être numérique de One UI (± 10 %).

**I117 — dictée.** Natif `VoiceNotePlugin` : `AudioRecord` (`VOICE_RECOGNITION`, 16 kHz mono PCM16) en premier plan
seulement (app ouverte, aucun service), fenêtres de 20 ms → énergie RMS, F0 (autocorrélation / YIN maison), part de
voisé, pauses > 250 ms, débit ≈ pics d'énergie syllabiques / s ; même tampon écrit dans
`ParcelFileDescriptor.createPipe()` → `SpeechRecognizer` (plateforme, `EXTRA_AUDIO_SOURCE`, `EXTRA_PREFER_OFFLINE`)
ou ML Kit `AudioSource.fromPfd` si `checkStatus()` = disponible ; arrêt au relâchement ou à 60 s ; tampon remis à
zéro, rien sur disque. Retour JS : `{ text, prosody: { f0Median, f0Iqr, energyDb, voicedRatio, pauseRatio,
rate }, ms }` ; `prosody` → entrée `voice_note` (indices `voice_*`, déjà déclarés dans `ESTIMATOR_INPUTS`, inactifs
tant que la porte ne les a pas validés) ; `text` → propositions (I119) affichées en puces à toucher. Diagnostic :
moteur utilisé (ML Kit / plateforme / aucun), langue, durée, erreurs. Licence : API Google (conditions GenAI) ou
plateforme ; aucun modèle tiers embarqué.

**I118 — rafales.** `FaceSchedule` (règle pure, testée JVM) : `minIntervalMs` 300 000 → paramètre ; nouveau
`retryAfterRejectMs = 2000` (une seule fois par déverrouillage, même `trigger: 'unlock'`, toujours dans les 10 s après
le déverrouillage). Diagnostic : `unlocksPerDay` (médiane 7 j, depuis `KEYGUARD_HIDDEN`), `validBurstsPerDay`, part
écartée par motif. Règle : intervalle 2 min seulement si `validBurstsPerDay` < 12 sur 7 jours. Le test
« composition » (I114) reste vert par construction (même déclencheur).

**I119 — lexiques.** `services/mood/lexicon.js` : `FEELING_WORDS` (→ valence −2…+2, intensifs « très, super,
vraiment », négation « pas, plus, jamais » dans les 3 mots précédents) et `CONTEXT_WORDS` (→ tags existants) ; test
d'intersection vide sur les racines normalisées (minuscules, sans accents) ; documenté dans `estimatorInputs.js`.

**I120 — intra-journée.** Après I112 ouvert : modèle mixte simple par jour (indice de la rafale ~ minutes de la
catégorie dans les 60 min précédentes + effet du jour), erreur type robuste par jour, règle I107 pour décider ;
jamais affiché avant ≥ 30 jours et ≥ 300 rafales.

### Sources (consultées le 19/10/2026)
- Emden, Richter, Chevance, …, Opel, *Scalable depression monitoring with smartphone speech using a multimodal
  benchmark and topic analysis*, npj Digital Medicine 9:230, 28/02/2026 (PMC12996298, lu).
- *Screening for depression risk via smartphone narratives with fully fine-tuned WavLM*, Scientific Reports 2026
  (nature.com/articles/s41598-026-53432-4, résumé) ; revue de portée sur les marqueurs vocaux, Frontiers in Digital
  Health 2026 (10.3389/fdgth.2026.1964389, résumé) ; *Smartphone-Detected Ambient Speech and Self-Reported Measures of
  Anxiety and Depression*, JMIR Formative Research 2021 (PubMed 33512325, résumé).
- ML Kit GenAI — vue d'ensemble et appareils (developers.google.com/ml-kit/genai) ; *Speech Recognition* Android
  (developers.google.com/ml-kit/genai/speech-recognition/android) ; `RecognizerIntent.EXTRA_AUDIO_SOURCE`
  (developer.android.com/reference/android/speech/RecognizerIntent).
- Restricted settings Android 15 : 9to5google.com/2024/09/12/android-15-sideloaded-apps-restrictions ;
  androidauthority.com/android-15-restricted-settings-sideloading-3481098.
- `queryEvents` / `queryUsageStats` : issuetracker.google.com/issues/118564471 et /118331259 ; commit AOSP
  « ACTIVITY_PAUSED must follow ACTIVITY_RESUMED » (gerrit.omnirom.org, 289f1679).
- Elmer et al. 2025 (usage du téléphone et affect momentané, résumé via research.tilburguniversity.edu) ; Valkenburg,
  Beyens & Keijsers, *Investigating Heterogeneity in (Social) Media Effects*, Metapsychology.
- Déverrouillages / jour : statista.com (1050339), businessinsider (Apple, 80 / jour), WFAE / Benton (2013), rapport
  radio 02/2024 (≈ 30 / jour) — toutes [T].
- Shizuku : shizuku.rikka.app/guide/setup ; forum Samsung (bêta One UI 8.5) [T].

### À creuser au prochain run idées (19/10 20:30)
- Lexique français du ressenti sous licence libre (FEEL, Lexique des émotions, NRC-FR : vérifier les licences) pour I119.
- Bien-être numérique de One UI : d'où viennent ses chiffres, écart attendu avec `queryEvents` (pour valider I116).
- Reconnaissance vocale hors ligne fr-FR réellement disponible sur un Galaxy A (service Google ou Samsung) et
  `EXTRA_AUDIO_SOURCE` accepté ou non.
- Reportés : π0 adaptatif ; effet d'un verre / d'un café tardif sur la VFC chez une personne (I109).

---

## Run du 18/10/2026 20:30 (Paris) — l'humeur par le visage : quand pourra-t-on y croire, et sans quel piège ?

Question du jour, côté utilisateur (consigne du 18/10, point B : « que ça avance le côté estimation du bien-être
automatique ») : *« le moteur du visage est dans l'app. Concrètement, au bout de combien de temps HealthTrack me
dira-t-il quelque chose de juste sur mon humeur sans que je saisisse rien ? Qu'est-ce que je dois faire, moi, pour
que ça marche plus vite ? Et est-ce que ce que je regarde sur mon téléphone (une vidéo drôle) ne va pas fausser
tout ça ? »* Montre en maintenance (A.1–A.3 fusionnés, #209), aucun nouveau journal dans `diagnostics/`. Méthode :
lire l'étude la plus proche de notre dispositif (MoodCam / FacePsy), puis simuler la porte d'entrée I110
(`protocoles/humeur-etiquettes-sim.py`, 1 000 tirages par case).

### Ce qu'on apprend (faits)

- **MoodCam** (Islam, Zhang, Bae ; IEEE UIC 2024, arXiv 2412.12625) [V texte intégral] : c'est **exactement le
  dispositif prévu par I88**. Système FacePsy en arrière-plan sur Android, rafale de 10 s **au déverrouillage ou à
  l'ouverture d'apps « déclencheurs »** (réseaux sociaux, communication, divertissement…), 12 unités d'action,
  sourire, ouverture des yeux, pose de la tête, points du visage ; photos effacées. 25 personnes, 4 semaines, 15 995
  rafales (≈ 26 / jour / personne). Étiquettes : valence et éveil de −4 à 4, **3 questionnaires par jour à heure
  fixe** (10 h, 15 h, 20 h), 2,23 réponses / jour en moyenne ; rafales des 30 min précédentes appariées à la réponse.
  Modèles **entre personnes** (validation « une personne mise de côté ») : valence AUC **0,64** (moment), 0,64 (jour),
  0,61 (lendemain) ; éveil 0,58–0,63. Variables les plus utiles : le **rapport d'ouverture des yeux** (surtout pour la
  journée et le lendemain), puis les unités d'action (moment). Limite reconnue : **aucun modèle personnel** testé.
  → Un AUC de 0,64 correspond à une corrélation rafale ↔ humeur d'environ **0,2** [calcul : d ≈ 0,5]. C'est l'ordre de
  grandeur à attendre chez une personne, ni plus ni moins.
- **FacePsy** (Islam & Bae, MobileHCI 2024, DOI 10.1145/3676505) [T presse + résumé] : mêmes données, épisodes
  dépressifs repérés à AUROC 0,81 ; signes : ouverture des yeux, gestes de la tête, sourire, AU 2, 6, 7, 12, 15, 17 ;
  surprise : **des yeux plus ouverts le matin et le soir allaient avec plus de symptômes** → aucun indice n'a de sens
  fixe (D6).
- **Ringwald et al. 2025** (*J Affect Disord*, 112 personnes, 90 jours de vidéo quotidienne, 8 953 vidéos) [T
  résumé] : modèles **personne par personne** ; 80 % ont au moins un lien fiable expression ↔ symptômes, mais **le
  sens varie** (sur-expressivité chez les uns, sous-expressivité chez les autres). → Confirme D6 et le test
  bilatéral de la porte I110 : on ne présuppose pas que « plus de sourire = meilleure humeur ».
- **Meegahapola et al. 2023** (IMWUT, 678 étudiants, 8 pays, 329 k auto-évaluations) [T résumé] : modèles
  d'humeur par capteurs du téléphone, valence AUROC ≈ 0,51 entre personnes, **0,78–0,98 partiellement personnalisés**.
  → La personnalisation est ce qui fait marcher ces signaux ; c'est notre voie (calibration chez l'utilisateur).
- **Déverrouillage et réponses** : questions posées **juste après un déverrouillage** = plus de réponses (van Berkel
  et al., IJHCS 2019, 20 personnes ; Reiter, …, Schoedel, AMPPS 2025, préenregistrée, N = 395) mais réponses plus
  lentes, et les humeurs déclarées ne changent pas selon le protocole [V résumé AMPPS].
- **Emobot** : pas d'actualité 2026 trouvée ; le dispositif (visage + voix, traitement local) alerte l'équipe
  soignante quand l'état se dégrade **sur plusieurs jours** [T presse 2025]. → L'unité utile est la tendance de
  quelques jours, pas l'instant.
- **Constat dans le code** : HealthTrack n'envoie **aucun rappel** pour la note de bien-être (aucune notification
  hors montre : `WatchNotifications.java`, `BackgroundWatchSync.java`). La fiche I109 du 18/10 08:30 supposait des
  « rappels du soir existants » : c'est faux, corrigé ici.

### Simulation (`protocoles/humeur-etiquettes-sim.py`, 1 000 tirages par case)

Modèle : humeur du jour AR(1) 0,4 ; humeur du moment = humeur du jour + écart intra-jour lent (é.t. 0,8) ; ≈ 32
rafales valides par jour ; indice du visage d'une rafale corrélé à r_b avec l'humeur du moment, plus lumière du
jour et bruit ; sens tiré au hasard. Porte : corrélation, erreur type par jackknife sur les jours, regard chaque
semaine à partir de J14.

**A. Quelle étiquette ?** Part des tirages où la porte est ouverte (seuil |z| ≥ 2,81) :

| Étiquettes | r_b = 0 (faux départ) J60 / J120 | r_b = 0,2 : J28 / J42 / J60 / J90 | r_b = 0,3 : J28 / J60 |
|---|---|---|---|
| **Note du soir** (85 % des jours) × moyenne des rafales du jour | 7 % / 8 % | **41 / 58 / 72 / 87 %** | 70 / 95 % |
| 1 micro-note au déverrouillage × rafales des 30–60 min | 8 % / 10 % | 12 / 20 / 26 / 33 % | 22 / 46 % |
| 3 micro-notes au déverrouillage (comme MoodCam) | 5 % / 7 % | 23 / 36 / 47 / 63 % | 46 / 79 % |
| Note du soir, **2 regards consécutifs** au-dessus du seuil | **2 % / 4 %** | 25 / 43 / 59 / 81 % | 50 / 90 % |
| Note du soir, seuil 3,29 + 2 regards consécutifs | **1 % / 2 %** | 16 / 34 / 48 / 73 % | 40 / 83 % |

- **La note du soir l'emporte**, même sur 3 micro-notes par jour : la moyenne de ≈ 32 rafales lisse le bruit de
  chaque image, alors qu'une micro-note n'a que 2–3 rafales à côté d'elle. **Pas besoin de questions au
  déverrouillage** (moins de saisie, priorité n° 1 du 11/10).
- Le jackknife sur 14–40 jours est **optimiste**, et regarder chaque semaine multiplie les chances : avec un seul
  passage à 2,81, 8 % des signaux **inutiles** finiraient « activés ». Il faut **deux regards consécutifs** et un
  seuil plus haut (3,29) : 2 % de faux départs à 4 mois.
- Avec un signal réaliste (r_b ≈ 0,2, ordre de grandeur de MoodCam) : porte ouverte chez **≈ 1 utilisateur sur 2
  à 2 mois, 3 sur 4 à 3 mois**. Une fois ouverte, l'indice du jour suit la vraie humeur du jour à **≈ 0,4** :
  utile pour une tendance de quelques jours, pas pour une note précise d'un jour donné.

**B. Et si la note n'est donnée qu'un jour sur deux ?** (seuil 3,29, 2 regards, réponse 40 % au lieu de 85 %) :
r_b = 0,2 → 24 % à J60 (au lieu de 48 %), 39 % à J90 (au lieu de 73 %). **La régularité de la note du soir divise
par deux le temps d'attente** : c'est le levier n° 1 que l'utilisateur contrôle.

**C. Biais de composition** (partie B du script) : humeur **sans aucun lien** avec les réseaux sociaux ; la part
des rafales prises pendant leur usage varie selon les jours (40 % ± 15 %), et ces rafales ont un indice décalé de δ
(on sourit devant une vidéo drôle, quelle que soit son humeur). Corrélation fabriquée entre « humeur estimée du
jour » et part de réseaux sociaux : **0,09 (δ = 0,25) à 0,19 (δ = 0,5)** sur 120 jours, alors que le vrai lien est
nul. 0,19 sur 120 jours = p ≈ 0,04 : une « piste à vérifier » **entièrement fabriquée par la mesure**. C'est le
cercle interdit par D5, par la petite porte : les réseaux sociaux ne sont pas une entrée de l'estimateur, mais ils
changent **quelles images** l'estimateur voit. MoodCam déclenche justement ses rafales à l'ouverture des réseaux
sociaux.

### Idées classées (impact × faisabilité) — aucune n'ajoute d'écran

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I114 | **Rafales prises au déverrouillage seulement pour l'humeur** (avant tout contenu) ; les rafales « pendant l'usage » restent dans le diagnostic tant qu'un test ne montre pas qu'elles ne dépendent pas de l'app au premier plan ; **test anti-circularité « composition »** : jeu simulé où les réseaux sociaux décalent le sourire en cours d'usage sans changer l'humeur → corrélation entre humeur estimée et temps de réseaux sociaux < 0,05 | Ne pas fabriquer « réseaux sociaux → humeur » (D5) ; estimation honnête | 5 | 5 | **25** |
| I112 | **Porte I110 précisée** : au niveau du jour (note du soir × moyenne des rafales du déverrouillage) ; **un seul indice combiné** par validation croisée sur les jours (Ridge de `calibration.js`, pas un test par indice) ; ouverte si \|z\| ≥ 3,29 (jackknife) **à deux regards hebdomadaires consécutifs**, ≥ 30 jours notés ; refermée si \|z\| < 2 sur les 6 dernières semaines ; sens libre | Afficher une humeur estimée seulement quand elle veut dire quelque chose chez lui (simulé : 2 % de faux départs à 4 mois) | 5 | 4 | **20** |
| I113 | **Note du soir d'un geste depuis la notification** : 5 boutons dans la notification (aucune ouverture d'app), à l'heure habituelle de ses notes (sinon 21 h), jamais si une note existe déjà, jamais deux fois ; la note attend dans une file native et entre dans IndexedDB à l'ouverture suivante (même forme qu'une note saisie) | Moins de saisie (un geste), et la régularité de la note **divise par deux** le temps avant que le visage serve (simulé) | 5 | 3 | **15** |
| I115 | **Le visage complète les jours sans note, jamais à la place** : une fois la porte ouverte, un jour sans note reçoit « plutôt bonne / moyenne / basse journée, d'après votre visage » avec la fourchette de la calibration ; la courbe le distingue (point creux) ; tendance sur 3 jours et plus (logique Emobot), aucune alerte ni conseil ; recalibré chaque semaine | « Humeur captée sans rien saisir » (D4) les jours où il n'a pas noté, sans prétendre à une précision qu'on n'a pas (≈ 0,4) | 4 | 3 | 12 |

**Écartées** : *micro-questions au déverrouillage* (simulé : moins efficaces que la note du soir, même à 3 par jour,
et plus de saisie) ; *rafales déclenchées à l'ouverture des réseaux sociaux* (MoodCam) — biais de composition
ci-dessus ; *modèle d'humeur entre personnes* (AUC 0,64 au mieux, sens qui varie selon les gens) ; *énergie / fatigue
lue dans les yeux* comme 2e dimension : prometteur (meilleure variable de MoodCam), mais **aucune étiquette**
aujourd'hui (pas de question « énergie » dans l'app) ; à reprendre seulement si une étiquette existe sans saisie de
plus (par exemple un mot de la dictée I111).

### Détail et pistes d'implémentation

**I114 — déclencheur et test.** Dans la spécification `protocoles/visage.md` §8 : « Déverrouillage ou toutes les
~3 min écran allumé » devient « **déverrouillage** (`ACTION_USER_PRESENT`), au plus une rafale par 5 min » pour les
entrées `face_burst` qui servent à l'humeur ; les rafales périodiques écran allumé, si on les garde pour mesurer la
batterie, sont marquées `trigger: 'inUse'` et exclues de l'estimateur. Chaque rafale garde `trigger` (`unlock` /
`inUse`). Test (JS, `antiCircularity.test.js` ou voisin) : 120 jours simulés, humeur indépendante d'une variable
« réseaux sociaux » qui décale `smile` des rafales `inUse` → `estimateDailyMood()` ne doit pas corréler (|r| < 0,05
en moyenne sur 50 tirages) avec cette variable ; le même test avec des rafales `inUse` incluses doit échouer (preuve
que le test voit le biais). Coût : quelques lignes, à faire **dans la PR I90**.

**I112 — porte.** Dans `services/mood/` : `gate.js`, fonction pure `evaluateGate(days)` → `{ state: 'candidate' |
'active', z, r, nDays, history }` ; jour = `{ note, faceIndex }` où `faceIndex` = prédiction en validation croisée
(un jour en moins) du Ridge de `calibrateRidge` sur les indices du jour (médianes des rafales `unlock`) ; jackknife
par jour ; historique hebdomadaire stocké pour la règle des deux regards et la refermeture. Tests d'abord : sur
200 jeux nuls de 120 jours, ≤ 3 % ouverts ; r_b = 0,3 → ouverte à J60 dans ≥ 75 % des jeux ; refermeture quand le
lien disparaît. Rien à migrer (calculé).

**I113 — notification.** Natif : `NotificationCompat` avec 5 actions (😞 … 😄 ou 1–5, libellés de l'échelle
actuelle), `BroadcastReceiver` qui écrit `{ date, value, at }` dans une file `SharedPreferences`, ferme la
notification ; `WellbeingQuickNote` plugin : `drainPending()` appelé au démarrage et au retour au premier plan →
`saveWellbeing()` habituel (même schéma, même export). Planification : `AlarmManager.setAndAllowWhileIdle` à l'heure
médiane des notes des 14 derniers jours (21 h par défaut), annulée si une note du jour existe. Interrupteur dans la
saisie bien-être existante (« Me la demander le soir »), pas de nouvel écran. Permission `POST_NOTIFICATIONS` déjà
déclarée dans le manifeste (vérifié) ; le récepteur dynamique `ACTION_USER_PRESENT` de `WatchPresenceService` montre
le modèle à réutiliser pour le déclencheur I114.

**I115 — affichage.** Seulement si `gate.state === 'active'` ; la note estimée n'est jamais enregistrée comme une
note (champ séparé, calculé) et n'entre ni dans la calibration ni dans les Analyses comme une note déclarée
(sinon le visage s'auto-validerait) ; les Analyses peuvent utiliser Y = note déclarée, ou Y = note déclarée sinon
estimée, **avec la mention** et une sensibilité « notes déclarées seules ».

### Sources (consultées le 18/10/2026)
- Simulation : `journal/protocoles/humeur-etiquettes-sim.py` (ce run ; arguments : tirages, seuil, taux de réponse).
- Islam, Zhang, Bae, *MoodCam: Mood Prediction Through Smartphone-Based Facial Affect Analysis in Real-World
  Settings*, IEEE UIC 2024, arXiv 2412.12625 (PDF lu en entier).
- Islam & Bae, *FacePsy: An Open-Source Affective Mobile Sensing System…*, MobileHCI 2024, arXiv 2406.17181 ;
  stevens.edu (« When detecting depression, the eyes have it »).
- Ringwald et al., *Day-to-day dynamics of facial emotion expressions in posttraumatic stress disorder*, J Affect
  Disord 2025 (résumé, experts.umn.edu).
- Meegahapola et al., *Generalization and Personalization of Mobile Sensing-Based Mood Inference Models*, IMWUT 6(4),
  arXiv 2211.03009 (résumé).
- Reiter, Sakel, Scharbert, ter Horst, van Zalk, Back, Bühner, Schoedel, *Side Effects of Experience-Sampling
  Protocols*, AMPPS 8(3), 2025, doi:10.1177/25152459251347274 (résumé) ; van Berkel et al., *Effect of experience
  sampling schedules on response rate and recall accuracy of objective self-reports*, IJHCS 2019 (résumé).
- Emobot : allodocteurs.fr, leclaireur.fnac.com (2023–2025) ; aucune source 2026 trouvée.

### À creuser au prochain run idées (19/10 08:30)
- π0 adaptatif (reporté deux fois) : gain réel quand l'utilisateur a beaucoup de vrais liens ?
- Taille d'effet d'un verre d'alcool / d'un café tardif sur la VFC et le sommeil chez une personne (préparer I109).
- Dictée (I111) : un mot d'énergie dans la dictée suffit-il comme étiquette pour la fatigue lue dans les yeux ?
- Combien de déverrouillages par jour sur l'A56 du propriétaire (le diagnostic I88 le dira) : la porte suppose ≈ 30
  rafales valides par jour.

---

## Run du 18/10/2026 08:30 (Paris) — tester beaucoup de facteurs sans se raconter d'histoires, expériences, voix

Question du jour, côté utilisateur : *« l'app examine des dizaines de choses (sommeil, pas, 20 nutriments, météo,
écran…). Si elle en teste 50, il y en aura bien une qui "marche" par hasard. Combien de ce qu'elle me dira sera
faux ? Et si un lien reste incertain, est-ce que je peux le trancher en faisant une petite expérience ? »* Suite
directe du run du 17/10 20:30 (I102 : règle « chez vous » simulée **variable par variable**). Montre en maintenance,
aucun nouveau journal (`diagnostics/` inchangé). Méthode : relire ce que fait l'app aujourd'hui, simuler
(`protocoles/multiplicite-abab-sim.py`, 600 tirages par case), puis veille voix 2026.

### Ce qu'on apprend (faits)

- **Ce que l'app teste aujourd'hui** [V code, `analysisEngine.js`] : ≈ 55 variables dans `VARIABLE_META` (dont
  ≈ 20 nutriments très corrélés entre eux), plus les tags et les effets décalés. Corrélation contrôlée week-end,
  p calculé sur un **n effectif** (autocorrélation), Benjamini-Hochberg sur la famille ; une **piste** est proposée
  si q < 0,2 (`LEVER_MAX_Q`), « solide » si q < 0,05 ; effets décalés à q < 0,05.
- **Simulation A — 40 facteurs, dont 12 nutriments corrélés à 0,6 et 2 vrais liens r = 0,3, tout en AR(1) 0,4**
  [V, ce run] :

  | Règle | ≥ 1 faux sens affiché (60 / 120 / 180 j) | Vrais liens trouvés (60 / 120 / 180 j) |
  |---|---|---|
  | Pistes actuelles (BH q < 0,2) | 18 % / **25 %** / 36 % | 23 % / 58 % / 84 % |
  | « Solide » actuel (BH q < 0,05) | 3 % / 4 % / 9 % | 8 % / 34 % / 66 % |
  | **I102 seul, variable par variable** | **40 % / 58 % / 70 %** | 45 % / 87 % / 98 % |
  | I102 limité à 8 facteurs « primaires » | 10 % / 16 % / 19 % | 45 % / 87 % / 98 % |
  | I102 + BH à 5 % sur la famille | 0,2 % / 2 % / 5 % | 2 % / 38 % / 79 % |
  | **A priori « 90 % des facteurs ne font rien » (spike-and-slab), P ≥ 0,9** | **0,7 % / 1,2 % / 0,7 %** | 6 % / 36 % / 70 % |

  → **I102 tel que spécifié la veille ne suffit pas** : ses 3,6 % d'erreur valent pour *un* facteur ; sur 40, l'app
  dirait au moins un « chez vous » faux **une fois sur deux**. Et les pistes actuelles (q < 0,2) en proposent une
  fausse chez un utilisateur sur quatre après 4 mois. L'a priori « la plupart des facteurs ne font rien »
  (cohérent avec l'étude Oura n-of-1 du 17/10 : la plupart des liens attendus absents chez une personne donnée)
  corrige la multiplicité tout seul, sans liste à part, et garde l'essentiel de la puissance.
- **Simulation B — auto-expérience tirée au sort** (condition A/B, observance 85 %, demi-effet le premier jour
  d'un changement, Y en AR(1) 0,4 ; régression préblanchie) [V, ce run] :
  - sur la **note de bien-être** (bruitée), un effet moyen (d = 0,5 écart type) n'est tranché qu'à 26–36 % après
    **84–112 jours** (règle stricte) ; 41–55 % avec une règle « expérience » (a priori N(0 ; 0,5²), 95 %) mais
    7–10 % de faux sens sans effet (l'erreur type estimée sur peu de jours est un peu optimiste) ;
  - le **tirage au sort chaque jour** (L = 1) bat les blocs de 3 ou 7 jours malgré la rémanence ;
  - effet **grand** (d = 1,5, ordre de grandeur d'un verre d'alcool sur la VFC de la nuit [H, à vérifier sur les
    données]) : 58 % à 28 jours, 83 % à 42 jours, ≤ 4 % de faux sens à 97,5 %.
  → Une expérience n'est rentable que sur une **mesure nocturne de la montre** (VFC, FC repos, sommeil) et un effet
  attendu fort ; sur l'humeur, elle demande 3–4 mois. Son atout : **un seul test décidé d'avance**, donc pas de
  multiplicité.
- **Littérature** : Lin et al. 2016 (*Br J Math Stat Psychol*, PMC5082548) : ABAB plus puissant qu'AB, tests à
  autocorrélation ; `nof1kit` (CRAN) : `sim_power()`, autocorrélation typique de l'humeur quotidienne 0,2–0,5 [T doc] ;
  préprint *Progressive Bayesian Confidence Architectures for Cold-Start Personal Health Analytics* (Chakraborty,
  arXiv 2601.03299, janv. 2026) : première « piste » en 5,3 j, **5,9 % de fausses découvertes à 30 j** [T, résumé
  seul, simulation non détaillée] ; l'exemple classique d'un 2016 arXiv : 100 corrélations, 10 vraies → ≈ 40 % des
  liens trouvés sont faux sans correction [T].
- **Voix 2026** [V] :
  - *Collecting Prosody in the Wild* (Koch, Bemmann, Schoedel, Bühner, Stachl ; Interspeech 2026, arXiv
    2603.17061) : 560 personnes, 9 877 enregistrements de phrases lues, openSMILE sur le téléphone, audio effacé.
    Prédire l'humeur d'une personne **inconnue** : valence **ρ = 0,02**, éveil **ρ = 0,12** (le sexe : 92 %). Les
    différences **entre personnes** expliquent 32–69 % de la variance des indices. → La prosodie n'a de sens que
    **comparée à soi-même**, et rien ne garantit qu'elle suive l'humeur chez un utilisateur donné.
  - **emotion2vec+** : code MIT, mais **poids sous « FunASR Model License »** (usage « for reference and learning »,
    licence révocable, perte de licence en cas de « dénigrement », révisable unilatéralement) ; un élève distillé de
    9,7 Mo en ONNX (`thomashallock/emotion2vec-web-distill`) hérite de cette licence et **rate la plupart des émotions
    non neutres en parole spontanée** (accord 14 %). **Wav2Small / MobileNetV4 d'audEERING** : CC-BY-NC-SA, recherche
    seulement. **FRILL** (Google, embedding 2021 pour mobile) : licence non vérifiée [H].
  - → Décision inchangée et renforcée : **prosodie maison** (débit, pauses, énergie, F0 via pitchy 0BSD) en écart à
    sa propre plage, et le **contenu de la dictée** (ce que l'utilisateur dit de son humeur = auto-déclaration) comme
    signal principal. Aucun modèle d'émotion vocale embarqué tant qu'aucun n'a une licence claire **et** une validité
    individuelle démontrée.

### Idées classées (impact × faisabilité) — aucune n'ajoute d'écran

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I107 | **I102 corrigé pour la famille** : a priori « spike-and-slab » (90 % des facteurs sans effet, 10 % N(0 ; 0,3²)), même calcul pour tous les X (Radar, cartes, pistes, effets décalés) ; « chez vous : … » seulement si P(lien et sens) ≥ 0,9 | Ne pas raconter de faux liens (D5), base fiable de D6 | 5 | 4 | **20** |
| I108 | **Pistes à deux étages, mots exacts** : q < 0,05 → « chez vous » ; 0,05 ≤ q < 0,2 → « à vérifier » (jamais formulé comme un fait, une seule à la fois) ; au-delà rien. Remplace l'affichage actuel de 3 pistes à q < 0,2 | Moins de fausses pistes tout de suite (1 sur 4 → < 1 sur 20 en « chez vous »), sans attendre I107 | 4 | 5 | **20** |
| I109 | **Expérience d'un geste sur une mesure de nuit** : pour une piste « à vérifier » dont la mesure est nocturne (VFC, FC repos, durée / début du sommeil), « Tirer au sort chaque soir pendant 6 semaines ? » (café après 16 h, écran au lit, verre du soir…) ; un rappel le soir, un seul test décidé d'avance | Trancher un lien incertain en 4–6 semaines (simulé 58–83 % pour un effet fort), au lieu de 4–6 mois d'observation | 4 | 3 | 12 |
| I110 | **Porte d'entrée de l'estimateur d'humeur** : un signal (visage, voix) n'entre dans `ESTIMATOR_INPUTS` actifs qu'après avoir prouvé **chez l'utilisateur** qu'il suit ses notes (corrélation en validation croisée ≥ 0,3 sur ≥ 30 jours, même règle I107) ; sinon il reste en diagnostic | Ne pas afficher une « humeur » qui ne veut rien dire chez lui (leçon Koch 2026 : ρ = 0,02 entre personnes) | 4 | 4 | **16** |
| I111 | **Voix : la dictée d'abord, prosodie en écart à soi** : ce que l'utilisateur dit (« journée crevante mais contente ») → note et tags proposés ; indices maison (débit, pauses, énergie, F0) z-scorés sur sa plage 28 j ; aucun modèle d'émotion vocale embarqué (licences FunASR / CC-BY-NC-SA, validité faible) | Saisie en un geste (directions du 11/10), voix sans licence douteuse | 3 | 4 | 12 |

**Écartées** : *Bonferroni* (puissance trop faible, et les nutriments corrélés le rendent encore plus sévère) ;
*limiter l'examen à une liste fixe de facteurs « primaires »* (16–19 % de faux sens quand même, et contraire à
l'esprit « vos données font foi » : un facteur inattendu doit pouvoir apparaître) ; *expériences ABAB sur la note de
bien-être* (3–4 mois pour un effet moyen : trop long pour être proposé par défaut) ; *emotion2vec+ / Wav2Small*
(licences ci-dessus).

### Détail et pistes d'implémentation

**I107 — spike-and-slab.** Dans `services/personalDirection.js` (I102, à écrire) : garder préblanchiment, X de la
veille, n ≥ 30 ; remplacer l'a priori N(0 ; 0,2²) par le mélange π0·δ0 + (1 − π0)·N(0 ; 0,3²) avec π0 = 0,9 :
`p1 = (1−π0)·φ(b ; 0, se²+τ²) / [π0·φ(b ; 0, se²) + (1−π0)·φ(b ; 0, se²+τ²)]`, puis `pSign` du postérieur gaussien
conditionnel ; verdict `positive` / `negative` si `p1·max(pSign, 1−pSign) ≥ 0,9`. Verdict « pas de lien notable »
(I103) : `p1 < 0,2` **et** n ≥ 60. Fonction pure, sans état, rien à migrer. Option plus tard : π0 estimé sur
l'ensemble des facteurs de l'utilisateur (borne basse 0,7) pour s'adapter. Tests d'abord : sur 200 jeux simulés de
40 X sans lien, au plus 5 jeux avec un verdict de sens ; 2 vrais liens r = 0,3 sur 180 j trouvés ≥ 60 % ;
facteurs corrélés entre eux (nutriments) sans inflation.

**I108 — deux étages.** Petit changement de `analysisEngine.js` : `levers` filtrés à `LEVER_MAX_Q` (0,2) mais
chaque piste reçoit `stage: q < 0.05 ? 'personal' : 'toVerify'` ; l'UI des pistes dit « Chez vous : … » ou « À
vérifier : … » et n'affiche **qu'une** piste « à vérifier » à la fois. Test : un jeu de démo où une piste a q = 0,12
→ libellé « À vérifier ». Ne remplace pas I107 (qui reprendra la décision), mais réduit tout de suite le risque.

**I109 — expérience.** Réutilise les rappels du soir existants *(corrigé le 18/10 20:30 : il n'y en a pas ; réutilisera la notification du soir d'I113)* ; tirage au sort dans l'app (graine stockée,
calendrier visible) ; jours où la consigne n'a pas été suivie gardés (intention de faire) ; analyse unique à la fin :
régression préblanchie (Cochrane-Orcutt), seuil 97,5 %, a priori N(0 ; 0,5²) **centré sur 0**. Mesures éligibles :
celles de la nuit suivante uniquement (ordre temporel garanti). Résultat formulé « chez vous, pendant ces 6 semaines,
… », sans jamais transformer un effet en consigne de santé.

**I110 — porte d'entrée.** Dans `services/mood/estimatorInputs.js` : chaque entrée déclarée a un état `candidate` →
`active` après calibration (LOO, `mood/calibration.js`), recalculé chaque semaine ; seul `active` compte dans
l'estimation affichée ; le test anti-circularité reste inchangé (la liste déclarée ne bouge pas, seul l'état change).

**I111 — voix.** Ordre : dictée du soir (reconnaissance sur l'appareil, `createOnDeviceSpeechRecognizer`) → texte
analysé par règles locales (mots de ressenti, intensité, négations) pour **proposer** une note et des tags (rien
n'est enregistré sans un tap) ; indices prosodiques calculés sur l'audio puis audio effacé ; ces indices sont
`candidate` (I110).

### Sources (consultées le 18/10/2026)
- Simulation : `journal/protocoles/multiplicite-abab-sim.py` (ce run).
- Lin, Lin, Lin et al., *Properties of bootstrap tests for N-of-1 studies*, Br J Math Stat Psychol 2016, PMC5082548.
- `nof1kit`, CRAN (documentation de `sim_power()`).
- Chakraborty, *Progressive Bayesian Confidence Architectures for Cold-Start Personal Health Analytics*, arXiv
  2601.03299 (6 janv. 2026, résumé).
- Koch et al., *Collecting Prosody in the Wild: A Content-Controlled, Privacy-First Smartphone Protocol and Empirical
  Evaluation*, Interspeech 2026, arXiv 2603.17061v2 (HTML lu).
- emotion2vec : github.com/ddlBoJack/emotion2vec (MIT pour le code) ; FunASR `MODEL_LICENSE` v1.1 ;
  huggingface.co/thomashallock/emotion2vec-web-distill (carte du modèle).
- audEERING Wav2Small : huggingface.co/audeering/wav2small (CC-BY-NC-SA-4.0) ; arXiv 2408.13920.
- FRILL : research.google (blog 2021), arXiv 2011.04609 (licence non trouvée).
- Bearable : fil r/BearableApp (« les activités fréquentes faussent mes corrélations ») [T].

### À creuser au prochain run idées (18/10 20:30)
- π0 adaptatif (estimé sur les facteurs de l'utilisateur) : gain réel quand l'utilisateur a beaucoup de vrais liens ?
- Taille d'effet réelle d'un verre d'alcool / d'un café tardif sur la VFC et le sommeil **chez une personne**
  (publications 2024–2026, WHOOP / Oura / Firstbeat) pour calibrer I109.
- Sujets hors statistiques, côté vie quotidienne : ce qui manque encore aux gens dans les fils Reddit 2026.

---

## Run du 17/10/2026 20:30 (Paris) — « chez vous » : apprendre le sens personnel d'un signal sans se tromper

Question du jour, côté utilisateur : *« vous avez retiré le "bon" et le "mauvais" codés en dur (D6). Très bien. Mais
alors, quand l'app me dira-t-elle ce qui est vrai **chez moi** — que ma FC repos haute va avec une journée moins
bonne, ou au contraire avec rien du tout ? Et comment être sûr qu'elle ne me raconte pas n'importe quoi après
trois semaines ? »* C'est I97 ② (sens personnel du Radar) et, plus largement, la ligne `direction` de D6. Montre en
maintenance, aucun nouveau journal (`diagnostics/` inchangé). **Méthode : lire ce qui existe (études n-of-1, apps
grand public), puis simuler** les règles candidates sur des séries synthétiques aussi « collantes » que les vraies
(autocorrélation 0,4) pour chiffrer jours nécessaires et erreurs de sens. Outil : `protocoles/sens-personnel-sim.py`.

### Ce qu'on apprend (faits)

- **Chez une personne, la plupart des liens attendus n'apparaissent pas, même avec des mois de données** [V étude
  JMIR 2022, PMC9823534, *multiple n-of-1*, 8 policiers, bague Oura + questionnaire quotidien, 125–386 jours chacun,
  modèle VAR par personne] : « aucun lien entre une mesure de la bague et un ressenti n'a été observé chez tous les
  participants ». Le plus fréquent : sommeil plus court → plus d'épuisement le lendemain chez 5 sur 8 ; VFC → stress
  chez **1** sur 8. Variance expliquée ≤ 22 %, souvent < 10 % (soit r ≈ 0,2–0,3). Un lien de sens contraire à la
  norme a été vu (participant 4) puis écarté par le test de Granger. → Pour D6 : le cas fréquent n'est ni « comme
  la norme » ni « contraire », c'est **« pas de lien visible chez vous »**, et ça mérite d'être dit.
- **L'analyse bayésienne convient aux auto-expériences** [V *A Patient-Centered Proposal for Bayesian
  Analysis of Self-Experiments for Health*, J Healthc Inform Res 2019, PMC6398612] : 12 jours alternés suffisent **si** l'a priori est
  explicite ; présenter des **prédictions** (« sur 20 jours comme ça, 13 ont dépassé… », graphiques en points)
  plutôt que des intervalles ; montrer l'a priori ; préférer une **zone d'équivalence** (« écart sans importance
  pratique ») aux facteurs de Bayes. Pas d'autocorrélation dans leur exemple : à ajouter.
- **Ce que font les apps grand public** [V aide en ligne, 17/10/2026] : **Exist** attend 3 semaines de données par
  attribut, recalcule chaque lundi, cherche d'abord le même jour puis le lendemain, affiche une force et une
  « confiance » en étoiles (« un lien fort peut avoir une confiance faible ») ; **Bearable** montre une corrélation
  dès 3 jours avec / 3 jours sans un facteur, conseille 7 + 7 puis 30 jours, et a une page entière « mes corrélations
  sont fausses » (cause inverse, confusion, valeurs extrêmes, « caféine après 15 h → meilleur sommeil » parce que ces
  jours-là on bouge plus) ; **Welltory** affiche un lien dès que deux courbes « vont ensemble dans plus de 20 % des
  cas ». → Personne ne traite l'autocorrélation ni ne dit « pas de lien chez vous » ; c'est notre différence possible.
- **Simulation (2 000 tirages par case, séries AR(1) à 0,4, `protocoles/sens-personnel-sim.py`)** [V, ce run] :

  | Règle « chez vous : … » | Faux sens quand il n'y a **aucun** lien | Lien r = 0,3 trouvé (60 / 120 j) |
  |---|---|---|
  | Corrélation brute, probabilité du sens ≥ 90 % | **10 % à 30 j, 23 % à 120 j** | 76 % / 96 % |
  | Préblanchiment AR(1) + même seuil | 6 % à 30 j, 15 % à 120 j | 78 % / 97 % |
  | **Préblanchiment + rétrécissement vers 0 (τ = 0,2) + seuil 97,5 %** | **0,2 % à 30 j, 2,5 % à 120 j, 3,6 % à 180 j** | **43 % / 88 %** |

  Sens **inversé** quand le lien existe (r = 0,15 ou 0,3) : ≤ 0,05 % avec la règle retenue. Et la phrase « **pas de
  lien notable chez vous** » (borne haute à 95 % de |effet| < 0,2) devient possible vers **60 jours** (15 % des cas
  sans lien), **120 jours** (59 %), **180 jours** (80 %) ; elle n'est presque jamais dite à tort quand r = 0,3 (≤ 1,1 %).
  Sans correction de l'autocorrélation, l'app se tromperait de sens une fois sur cinq : **le garde-fou n'est pas
  optionnel**.

### Idées classées (impact × faisabilité) — aucune n'ajoute d'écran

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I102 | **Un seul estimateur « chez vous »** pour Radar, cartes du cœur et pistes : X de la veille (ou d'avant la note), Y = note, **préblanchiment AR(1)** des deux séries, pente standardisée, **a priori N(0 ; 0,2²) centré sur zéro** (jamais sur la norme), affichage d'un sens seulement si P(sens) ≥ 97,5 % ; sinon l'hypothèse générale reste en petit, marquée comme telle | Science personnelle fiable (D6), anti-faux positifs (D5) | 5 | 4 | **20** |
| I103 | **Trois verdicts, dont « pas de lien notable chez vous »** (zone d'équivalence |effet| < 0,2, borne haute à 95 %) : dit par exemple « votre FC repos haute ne va avec rien de notable dans vos notes (142 jours) » au lieu de laisser croire qu'elle compte | Déculpabiliser (D6), simplifier : retirer de l'affichage ce qui ne compte pas chez vous (D1) | 4 | 4 | **16** |
| I104 | **Des fréquences au lieu de r** : « après une nuit comme celle-ci, 7 de vos 10 journées comparables ont été au-dessus de votre moyenne » (jours voisins réels, pas un modèle), à la place des « r = 0,32 » et des étoiles | Comprendre sans statistique (D1, demande « mots simples ») | 4 | 4 | **16** |
| I105 | **Jours hors norme repérés sans saisie** et écartés du calcul : voyage (déjà déduit du fuseau), maladie probable (FC repos + température cutanée + VFC hors plage plusieurs jours, Radar « alert »), changement d'heure ; listés une fois (« 4 jours mis de côté : voyage, … ») | Moins de liens absurdes (leçon Bearable), zéro saisie (directions du 11/10) | 3 | 4 | 12 |
| I106 | **Images test du visage (I101) : portraits officiels du gouvernement fédéral américain** sur Wikimedia Commons (domaine public, « PD-USGov ») ; écarter FFHQ (licences mêlées et interdiction de servir à la reconnaissance faciale) et les jeux « académiques » | Débloquer le test d'équivalence en CI sans risque de licence (D4) | 2 | 5 | 10 |

**Écartées** : *modèle hiérarchique avec d'autres utilisateurs* (il n'y a qu'un utilisateur et rien ne sort du
téléphone ; et ce serait réimposer une norme par la porte de derrière) ; *VAR complet / test de Granger* (des
dizaines de paramètres pour 60–120 jours : instable ; le préblanchiment + une pente donne l'essentiel) ; *a priori
centré sur la norme générale* (contraire à D6 : il ferait parfois dire « chez vous » ce qui n'est que la norme ;
la norme ne sert qu'à **l'ordre** d'examen et à un texte en petit) ; *recalcul hebdomadaire façon Exist* (on
recalcule déjà en Worker avec cache ; une stabilité affichée suffit).

### Détail et pistes d'implémentation

**I102 — L'estimateur.** Nouveau `services/personalDirection.js`, fonction pure : `personalDirection(xByDay,
yByDay, { lagDays = 1 })` → `{ n, nUsed, estimate, sd, pSign, verdict: 'positive' | 'negative' | 'none' |
'unknown' }`. Étapes : paires (X de la veille, Y du jour ; ou X d'avant 20 h comme `SAME_DAY_KEYS`) en excluant les
jours I105 ; standardisation dans la personne ; préblanchiment (coefficient AR(1) de chaque série estimé sur elle-même,
résidus `s[t] − a·s[t−1]`) ; r des résidus, erreur type 1/√(n − 4) ; a priori N(0 ; τ²) avec τ = 0,2 (justifié par
l'ordre de grandeur des liens publiés, ≤ 0,3) ; postérieur gaussien. `verdict` : `positive`/`negative` si
P(sens) ≥ 0,975 et n ≥ 30 ; `none` si |moyenne| + 1,64·sd < 0,2 ; `unknown` sinon. Tests écrits d'abord : séries
synthétiques déterministes (graine fixe) — aucun lien → jamais `positive`/`negative` sur 200 tirages au-delà de
5 % ; r = 0,4 sur 120 jours → bon sens ; sens contraire à la norme bien rendu tel quel (D6). Brancher ensuite :
`radar.js` (`generalFatigue` gardé comme hypothèse, `personal` ajouté), cartes FC / VFC, `leverSuggestion` (une piste
dont le verdict personnel est `none` n'est plus proposée ; `LEVER_ACTIONS` formulées « Tester : plus / moins de … »).
Réutiliser `lag1Autocorrelation` de `statistics.js`. Pas de migration : rien de stocké.

**I103 — « Pas de lien notable ».** Dans Analyses, sous les liens, une ligne repliée « Sans lien notable chez vous :
FC repos, écran le soir (142 j) » ; dans le Radar, si le verdict d'un signal est `none`, il ne compte plus pour
« inhabituel » dans la phrase d'interprétation (il reste affiché comme mesure). Formulation sans jugement, et sans
« donc vous pouvez » : « dans vos données, … ne va avec rien de notable ».

**I104 — Fréquences.** Pour un verdict `positive`/`negative` : prendre les jours où X était dans le même tiers que
aujourd'hui (≥ 10 jours), compter ceux où Y était au-dessus de la médiane personnelle → « 7 sur 10 ». Calcul trivial,
honnête (ce sont des jours réels), et lisible ; remplace r et les étoiles dans la carte. Ne s'affiche qu'avec un
verdict établi par I102 (sinon la fréquence brute réintroduit les faux positifs).

**I105 — Jours mis de côté.** `excludedDays(entries)` : `timezoneContext` (voyage), Radar en « alert » ≥ 2 jours
(maladie probable), jours de changement d'heure. Un ensemble de clés de jour passé à I102 et à `computeBasicCorrelations`.
Ne rien demander ; une ligne dans « Comment c'est calculé ».

**I106 — Images.** 2–3 portraits PD-USGov (Commons, catégorie des portraits officiels), visage de face, lumière
variée ; noter dans le test l'URL Commons, l'auteur et le modèle de licence. Les valeurs MediaPipe de référence
seront calculées dans une session (comme le 17/10 08:30) et figées en JSON ; seules les images (domaine public)
et le JSON entrent dans le dépôt.

**Notes annexes.**
- **One UI 8** [T sammyfans, communauté Samsung ; V dontkillmyapp] : « Applis en veille » et « Applis en veille
  profonde » sont sous Paramètres → Batterie → **Limites d'utilisation en arrière-plan** ; une app en veille profonde
  ne tourne jamais en arrière-plan. Samsung a promis (juillet 2024) que les services de premier plan conformes à la
  politique d'Android 14 ne sont plus tués depuis One UI 6. → I96 : la consigne doit donner **ce chemin exact** et
  « Applis jamais en veille » ; le diagnostic D4 doit noter si des rafales manquent alors que le service est déclaré
  actif (seule preuve qu'on peut collecter, aucune API ne lit ces listes).
- Rien trouvé de 2025–2026 qui fasse mieux qu'un modèle simple par personne pour 2–6 mois de données.

### Sources (consultées le 17/10/2026)
- *Wearable-Measured Sleep and Resting HRV as an Outcome of and Predictor for Subjective Stress
  Measures: A Multiple N-of-1 Observational Study*, JMIR / PMC9823534.
- *A Patient-Centered Proposal for Bayesian Analysis of Self-Experiments for Health*, J Healthc
  Inform Res 2019, PMC6398612.
- Exist : kb.exist.io (articles 18 « How long does it take to find correlations? », 37 « What are correlations? »,
  55 « across multiple days »).
- Bearable : bearable.app/support/troubleshooting/my-correlations-are-wrong-dont-make-sense ; « get the most out of
  your free trial » ; Welltory : help.welltory.com/articles/3878885, 3377372.
- N-of-1 sommeil → humeur (Oura + eMood, VAR(2), 4 ans, une personne) : arXiv 2510.02511.
- One UI 8 : sammyfans.com (?p=141856), us.community.samsung.com (Galaxy S22, applis fermées après One UI 8),
  dontkillmyapp.com/samsung.
- Licences d'images : FFHQ (README, Hugging Face), Wikimedia Commons (modèle PD-USGov).

### À creuser au prochain run idées (18/10 08:30)
- Ordre d'examen des X : combien de variables tester sans noyer les vrais liens (BH sur la famille « chez vous »
  ou seuil 97,5 % par variable ? simuler 15 X dont 2 vrais).
- Auto-expériences guidées (I45) avec l'estimateur I102 : combien de jours ABAB pour trancher un lien `unknown`.
- Voix (I91) : état 2026 des modèles de prosodie légers et sous licence permissive.

---

## Run du 17/10/2026 08:30 (Paris) — le visage, de la recherche à une spécification vérifiée

Question du jour, côté utilisateur : *« vous m'avez promis une lecture du visage qui ne parle pas à Google et ne vide
pas ma batterie. Concrètement, ça marchera aussi bien que la version de Google ? Avec une image minuscule ? Et
qu'est-ce que l'app retiendra de mon visage ? »* Le run du 16/10 20:30 a laissé « à creuser » les ancres du détecteur
et les 146 points des blendshapes : c'était le dernier verrou avant d'écrire le code D4 (I94). Montre en maintenance,
aucun nouveau journal (`diagnostics/` inchangé). **Méthode : reproduire le pipeline dans la session** (LiteRT +
numpy, sans MediaPipe) et le comparer à MediaPipe Tasks 1.1.1 sur la même image, puis écrire la spécification
`protocoles/visage.md` avec nos mots. Courte veille web en complément.

### Ce qu'on apprend (faits)

- **Le pipeline se reproduit sans MediaPipe, à moins d'un pixel près** [V, `protocoles/visage-reference.py`] :
  points du visage à **0,78 px** médian de ceux de MediaPipe (117 px entre les yeux) ; les 52 coefficients
  d'expression à **0,009** en moyenne (max 0,054). Le modèle de blendshapes lui-même est reproduit exactement
  (5·10⁻⁵) quand on lui donne les mêmes points. Pour situer : MediaPipe s'écarte en moyenne de 0,2 des vraies
  déformations du visage (fiche du modèle, citée par Turrisi 2026).
- **Deux pièges trouvés en le faisant**, désormais écrits dans la spec : (1) le modèle de blendshapes attend des
  **coordonnées en pixels** (ou une échelle identique en x et y) ; lui donner les coordonnées normalisées d'une image
  non carrée fausse tout (écart jusqu'à 0,37) ; (2) un demi-pixel de trop dans le recadrage décale les points de
  ≈ 0,3 px. Ancres du détecteur : 16 × 16 × 2 + 8 × 8 × 6 = 896, taille fixe [V].
- **Une petite image suffit** [V, image test réduite] : à 320 px de large (visage ≈ 90 px), écart moyen 0,019
  vs pleine résolution, sourire 0,95 au lieu de 0,96 ; à 160 px, le maximum grimpe à 0,21. Capture **320 × 240**
  retenue (moins de données à transférer depuis le capteur, moins d'énergie), 480 × 360 si le visage est petit.
- **Lire les coefficients comme des « unités d'action »** [V Turrisi et al., *Computers in Human Behavior Reports*,
  2026] : 10 experts ont mis en correspondance les 52 blendshapes de MediaPipe et les unités d'action du codage
  FACS (accord κ = 0,92 après discussion). Exemple : sourire gauche + droite = AU12 ; avec « cheekSquint » (AU6) =
  sourire « des yeux » (joie). Limite écrite par les auteurs : **pas encore validé** sur une vraie tâche de
  reconnaissance d'émotion. Utile pour nommer nos indices, pas pour décréter une émotion.
- **État de l'art** [V Frontiers in Neurorobotics 2026, BlendFER-Lite] : un petit LSTM sur les blendshapes atteint
  ≈ 71 % sur FER2013 (7 émotions posées) ; aucune mesure publiée de valence / activation à partir des blendshapes.
  MoodCapture (Dartmouth, CHI 2024, 177 patients) : 75 % pour repérer des symptômes dépressifs à partir de photos
  prises pendant l'usage normal du téléphone — en combinant visage, regard, posture **et** décor / lumière. Pas
  d'étude 2026 plus récente trouvée sur la caméra passive.
- Veille « besoins » (agrégateurs d'avis, à prendre avec prudence) : les plaintes n° 1 restent des **mesures
  fausses** (≈ 28 % des avis négatifs) et la **synchro des montres** (15–18 %) — cohérent avec le choix d'afficher
  la qualité et l'état de synchro plutôt que d'ajouter des cartes.

### Idées classées (impact × faisabilité) — aucune n'ajoute d'écran

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I98 | **Capture minuscule et filtrée** : 320 × 240, 3 images, contrôle qualité avant tout calcul (présence ≥ 0,9, visage ≥ 80 px, tête de face ±30°, lumière, bouche fermée) ; **jamais quand la caméra est déjà utilisée** par une autre app (appel vidéo, photo) ; le diagnostic compte les images rejetées par raison | Batterie, chaleur, résultats fiables, ne jamais gêner (D4) | 4 | 5 | **20** |
| I99 | **Des indices nommés comme des unités d'action, sans valeur morale** : sourire (AU12), sourire des yeux (AU6 + 12), froncement (AU4), sourcils intérieurs levés (AU1), coins de la bouche abaissés (AU15), ouverture des yeux, mobilité ; aucun n'est « bon » ou « mauvais » : seul l'écart à **votre** plage (28 j) et ce que **vos** notes montrent donnent un sens | Science personnelle (D6), honnêteté (estimation, pas diagnostic) | 4 | 4 | **16** |
| I100 | **Livrer D4 en trois PR mergeables seules** : ① moteur LiteRT + modèles téléchargés et vérifiés au build + `abiFilters` (I95) + test d'équivalence ; ② service de premier plan « Lecture du visage » + rafales + stockage des indices ; ③ écran de diagnostic exportable (temps, rejets, batterie) | Avancer sans casser (charte) | 4 | 4 | **16** |
| I101 | **Test d'équivalence en CI** : valeurs de MediaPipe figées en JSON sur 2–3 images, test instrumenté sur l'émulateur x86_64 déjà en CI ; échec si points > 1,5 px médian ou blendshapes > 0,02 moyen | Pas de régression silencieuse du visage (D2, qualité) | 3 | 4 | 12 |

**Écartées** : *un modèle d'émotions en 7 classes* (FER2013 : visages posés, 71 % ; décréterait « triste » à l'instant,
contraire à D4 / D6) ; *garder le décor et la lumière comme MoodCapture* (nécessiterait d'analyser l'image entière ; on
ne garde que des indices du visage + une luminance de contrôle) ; *pleine résolution* (aucun gain mesurable au-delà
de 320 px pour un visage au bras tendu).

### Détail et pistes d'implémentation

**I98 — Capture.** Camera2, `ImageReader` YUV_420_888 320 × 240 (taille supportée la plus proche), AE / AWB en
automatique, 3 images après ~300 ms de convergence de l'exposition. Avant d'ouvrir : `CameraManager.AvailabilityCallback`
→ si la caméra frontale est indisponible (une autre app l'utilise), on saute la rafale (« caméra occupée » dans le
diagnostic). Qualité : seuils de `protocoles/visage.md` §6, évalués sur le recadrage 256 × 256 (luminance) et sur les
sorties (présence, taille, lacet, `jawOpen`). Image libérée (`image.close()`) dès les 146 points extraits.

**I99 — Indices.** Tableau de `protocoles/visage.md` §5 ; stockage `{ at, subtype: 'face_burst', values }`. Côté JS,
les indices entrent dans `ESTIMATOR_INPUTS` (côté Y, D5) ; le sens de chacun n'est fixé qu'à la calibration
personnelle (`mood/calibration.js`, ≥ 14 jours de notes) ; avant, la seule sortie est « dans votre plage / inhabituel ».
`yaw` / `pitch` : Procrustes sur le maillage canonique (fichier `geometry_pipeline_metadata_landmarks.binarypb` du
`.task`) ou approximation nez / joues — à trancher au code (servent seulement à la qualité).

**I100 — Découpage.** ① `app/android/app/build.gradle` : tâche `downloadFaceModels` (URL + SHA-256 de la spec §1),
`ndk { abiFilters 'arm64-v8a', 'x86_64' }`, dépendance `com.google.ai.edge.litert:litert:2.3.0` ; `FaceEstimator.java`
(détecteur → ROI → maillage → 146 points → 52 coefficients → indices) + test instrumenté I101 ; taille de l'APK notée.
② `FaceCaptureService` (`foregroundServiceType="camera"`), récepteurs écran / déverrouillage, rafale toutes les ~3 min
écran allumé, notification « Reprendre » si tué (I88). ③ Diagnostic exportable (temps par étape, rejets, % batterie).

**I101 — Test.** Script de dev (repris de `protocoles/visage-reference.py`) qui produit `face-golden.json` avec
MediaPipe Tasks hors app ; test `androidTest` qui charge les images, exécute `FaceEstimator` et compare. Images :
vérifier la licence de `portrait.jpg` (bucket `mediapipe-assets`) ; à défaut, 2 portraits CC0.

### Sources (consultées le 17/10/2026)

- MediaPipe (Apache-2.0), lus pour les paramètres : https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/tasks/cc/vision/face_detector/face_detector_graph.cc ,
  …/face_landmarker/face_landmarks_detector_graph.cc , …/face_landmarker/face_blendshapes_graph.cc ,
  https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/calculators/tflite/ssd_anchors_calculator.cc ,
  https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/calculators/tensor/landmarks_to_tensor_calculator.cc
- Modèle et image test : https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task ;
  https://storage.googleapis.com/mediapipe-assets/portrait.jpg (exécutés dans la session, rien gardé dans le dépôt)
- Turrisi et al. 2026, doi 10.1016/j.chbr.2026.101125 (pré-épreuve : https://iris.cnr.it/retrieve/b57d9fa2-3eb6-403b-8190-dbe4bbda0a16/Blendshape%20features%20meet%20action%20units%20pre-proof.pdf)
- BlendFER-Lite : https://www.frontiersin.org/journals/neurorobotics/articles/10.3389/fnbot.2025.1678984/full
- MoodCapture : https://www.newswise.com/articles/smartphone-app-uses-ai-to-detect-depression-from-facial-cues ; https://arxiv.org/html/2402.16182v1
- Plaintes (agrégateurs, confiance modeste) : https://unstar.app/ar/blog/health-fitness-app-reviews-what-users-really-want-2026
- Non trouvés : étude 2026 sur la caméra passive ; mesure valence / activation à partir des blendshapes.


## Run du 16/10/2026 20:30 (Paris) — le visage sans Google dans la boucle, un APK qui reste léger, Samsung en veille

Question du jour, côté utilisateur : *« la lecture du visage va tourner sur mon téléphone toute la journée. Est-ce
qu'elle va alourdir chaque mise à jour, ralentir le téléphone, ou envoyer quelque chose chez Google ? Et est-ce que
Samsung ne va pas la tuer en douce ? »* Ce sont les trois points laissés « à creuser » par le run de 08:30, avant le
premier code D4 (I88). Montre en maintenance, aucun nouveau journal (`diagnostics/` inchangé). Cette fois, **mesures
faites dans la session** (bibliothèques téléchargées depuis le dépôt Maven de Google, modèles exécutés), plus
recherche web et lecture du code de HealthTrack.

### Ce qu'on apprend (faits)

- **MediaPipe Tasks et ML Kit envoient des statistiques d'usage à Google, sans option pour l'empêcher.**
  - MediaPipe [V GitHub google-ai-edge/mediapipe #6291, réponse d'un mainteneur du 06/07/2026] : une télémétrie
    (« clearcut », vers `play.googleapis.com`) est apparue entre 0.10.21 et 0.10.35, **elle « sera déployée sur toutes
    les plateformes »**, il n'y aura **pas d'API pour la couper** ; seules issues : compiler MediaPipe soi-même ou
    bloquer l'hôte. Google affirme n'envoyer « jamais aucune donnée d'entrée ».
  - Vérifié dans l'AAR Android `tasks-core 1.1.1` (publié le 14/10/2026) [V] : classes
    `tasks/core/logging/RemoteLoggingClient`, `TasksStatsLogger`, et dépendances `transport-backend-cct` /
    `transport-runtime` (le canal d'envoi de Google).
  - ML Kit [V conditions d'utilisation ML Kit] : images et résultats restent sur l'appareil, **mais les API envoient
    des métriques de performance et d'usage**, à déclarer aux utilisateurs ; `face-detection 16.1.7` dépend des mêmes
    `transport-*`, de `firebase-components` et des Play Services.
  - **LiteRT seul** (`com.google.ai.edge.litert:litert:2.3.0`, l'exécuteur TFLite) [V pom et AAR] : une seule
    dépendance (`litert-api`), **aucune bibliothèque d'envoi**, aucune chaîne `clearcut` / `play.googleapis` dans sa
    bibliothèque native.
  - Pour HealthTrack : ce ne sont pas des données de santé, mais **c'est un envoi réseau à chaque lecture du visage**,
    toute la journée, contraire à l'esprit « rien ne sort du téléphone ».
- **Taille, mesurée sur les AAR** [V, scratchpad du run] :

  | Brique | `.so` arm64 (non compressé / compressé) | Toutes ABI (non compressé) | Modèles |
  |---|---|---|---|
  | MediaPipe `tasks-core` + `tasks-vision` 1.1.1 | 14,4 Mo / 6,6 Mo | 63 Mo | + `face_landmarker.task` 3,8 Mo |
  | ML Kit `face-detection` 16.1.7 (groupé) | 8,5 Mo / 3,4 Mo | 33 Mo | inclus (4 détecteurs, 1,7 Mo) ; **sourire et yeux seulement** |
  | **LiteRT 2.3.0** | **5,6 Mo / 2,3 Mo** | 17 Mo (3 ABI) | + les 3 `.tflite` du `.task` : 3,7 Mo |

  L'APK actuel (v147) fait **6,8 Mo** et le `build.gradle` n'a **aucun `abiFilters`** : toute bibliothèque native est
  embarquée pour 4 architectures. MediaPipe tel quel ferait passer l'APK à ≈ 40–70 Mo selon le stockage des `.so`, et
  chaque mise à jour en 1 clic (plusieurs par jour) téléchargerait tout.
- **Le pipeline du visage est petit et rapide** [V, modèles du `.task` exécutés avec LiteRT, 1 cœur, conteneur x86] :
  détecteur 128 × 128 → 896 ancres (**1,7 ms**) ; maillage 256 × 256 → 478 points × 3 + présence (**7,9 ms**) ;
  blendshapes : 146 points (x, y) → 52 coefficients (**0,8 ms**). ≈ **10 ms par image** ; sur les cœurs A720 de
  l'Exynos 1580, ordre de grandeur 15–30 ms [H, à mesurer par le diagnostic I88]. L'énergie d'une rafale est donc
  dominée par **l'ouverture de la caméra**, pas par le modèle. Aucun chiffre publié pour un téléphone milieu de gamme
  (Qualcomm AI Hub : NPU / GPU haut de gamme seulement).
- **Samsung** [T guides récents d'éditeurs d'apps ; aucun retour précis sur un service caméra de fond trouvé] : One UI
  met les apps jugées inactives en « veille » puis « veille profonde » (gelées), **même si l'optimisation de batterie
  d'Android est désactivée** ; il faut aussi les ajouter à **Paramètres → Batterie → Limites d'utilisation en
  arrière-plan → Applis jamais en veille**. Côté HealthTrack [V code] : **aucune** demande d'exclusion de
  l'optimisation de batterie (`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`) ni guide One UI, alors que la directive D4 la
  demande et que la synchro de fond de la montre (`WatchSyncJob`, ~2 h) en dépend aussi.
- **Formulation des liens chez les autres** [V aides officielles] : Bearable affiche un effet dès **3 jours avec et
  3 jours sans** le facteur, sans incertitude ni mise en garde sur la causalité, et regarde les 7 jours suivants ;
  Exist sépare **force** et **confiance** (étoiles sur 5, basse quand il y a peu de données), dit que la corrélation
  ne donne pas la cause, et teste aussi « le lendemain ». Plainte récurrente sur r/BearableApp [T, agrégateur] :
  « les retours ne m'aident pas à décider ». HealthTrack corrige déjà tests multiples (FDR) et autocorrélation, mais
  propose une piste dès **5 jours** (`MIN_DAYS_BASIC`) : I70 (force et confiance séparées) reste la bonne réponse.

### Idées classées (impact × faisabilité) — aucune n'ajoute d'écran

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I96 | **Une seule autorisation « Travailler en arrière-plan »** pour la montre et le visage : demande Android d'exclusion de l'optimisation de batterie (un geste) + ligne One UI « Applis jamais en veille » avec le chemin exact, affichée seulement sur un Samsung et seulement si des relectures ou des rafales manquent | Montre et visage qui tiennent la journée sans y penser (D3 maintenance, D4) | 4 | 4 | **16** |
| I94 | **Le visage avec LiteRT seul, sans MediaPipe Tasks ni ML Kit** : les 3 modèles Apache-2.0 du Face Landmarker exécutés en Java (détecteur → recadrage → maillage → 146 points → 52 blendshapes) ; aucune télémétrie, ≈ 4× moins lourd ; vérifié image par image contre MediaPipe dans un test hors app | Rien ne sort du téléphone, mises à jour légères (D4, principes) | 5 | 3 | **15** |
| I95 | **APK maigre et surveillé** : `abiFilters 'arm64-v8a', 'x86_64'` (téléphone + émulateur de CI), budget de taille vérifié en CI (échoue si l'APK grossit de plus de 2 Mo sans le dire dans la PR) | Mise à jour en 1 clic qui reste rapide (D2) | 3 | 5 | **15** |
| I97 | **Radar forme sans « mauvais sens »** : un écart inhabituel dans les deux sens est signalé « inhabituel chez vous » ; le sens « va avec une moins bonne forme » n'est affiché que s'il est appris sur vos notes (≥ 30 jours), sinon donné comme hypothèse générale en petit | Pas de norme imposée (D6) | 3 | 4 | 12 |

**Écartées** : *MediaPipe Tasks* (télémétrie sans option, 14 Mo par architecture) ; *ML Kit* (télémétrie, Play
Services, seulement sourire et yeux : FacePsy montrait que la tête et les yeux comptent, mais les sourcils et la
mobilité de l'expression manqueraient) ; *compiler MediaPipe soi-même* (Bazel, maintenance lourde pour 3 modèles) ;
*bloquer l'hôte de télémétrie* (fragile, l'app a besoin d'Internet pour Gemini et les mises à jour).

### Détail et pistes d'implémentation

**I94 — Pipeline visage maison sur LiteRT.** À écrire comme la montre : d'abord une spécification avec nos mots
(`journal/protocoles/visage.md` : entrées / sorties de chaque modèle, ancres du détecteur, recadrage, les 146 indices
de points attendus par le modèle de blendshapes, noms des 52 sorties, sources : fiche du modèle, code Apache-2.0 de
MediaPipe **lu seulement**). Puis :
- dépendance `com.google.ai.edge.litert:litert:2.3.0` ; les 3 `.tflite` extraits du `.task` officiel au moment du
  build (tâche Gradle qui télécharge le `.task` depuis `storage.googleapis.com/mediapipe-models/…`, vérifie son
  SHA-256 et le dézippe dans `assets/` ; rien de binaire dans le dépôt) ;
- `FaceEstimator.java` : image YUV 320 × 240 → RGB 128 × 128 → détecteur (896 ancres SSD, NMS, garde le plus grand
  visage) → recadrage pivoté selon les yeux, 256 × 256 → maillage (478 points + présence ; rejet sous 0,5) → 146
  points normalisés → 52 coefficients → la dizaine d'indices d'I90 (sourire, yeux, sourcils, bouche, tangage, lacet,
  mobilité entre images, qualité) ;
- **test d'équivalence hors app** (script Python du dossier `scripts/`, avec `ai-edge-litert` et `mediapipe` en
  dépendances de dev uniquement) : sur quelques images publiques sous licence libre, nos blendshapes doivent coller à
  ceux de MediaPipe (écart absolu < 0,05) ; les valeurs attendues sont gardées en JSON pour un test JUnit sur
  l'émulateur x86_64 de la CI ;
- 1 thread, XNNPACK, interprète gardé en mémoire tant que le service vit ; temps d'inférence noté dans le diagnostic.

**I95 — APK maigre.** `android { defaultConfig { ndk { abiFilters 'arm64-v8a', 'x86_64' } } }` (l'A56 est arm64 ;
x86_64 garde l'émulateur de la CI). Étape CI dans « Build APK » : taille de l'APK écrite dans le résumé du job, échec
si elle dépasse la valeur notée dans `app/android/apk-budget.txt` (mise à jour volontaire dans la PR qui ajoute une
bibliothèque). Mesurer aussi `useLegacyPackaging true` (`.so` compressés : téléchargement plus léger, ≈ 3 Mo gagnés
pour LiteRT, au prix d'une extraction à l'installation).

**I96 — Arrière-plan en un geste.** Permission `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` ; dans le plugin natif
existant, `isIgnoringBatteryOptimizations()` et `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` (boîte Android avec le
paquet). Où : **une ligne** dans la carte de la montre (sous « Synchro auto même app fermée ») et plus tard dans
l'interrupteur « Lecture du visage », jamais une page à part. One UI : détecté par `Build.MANUFACTURER`; la consigne
« Applis jamais en veille » n'apparaît que si le journal natif montre des trous (aucune relecture ~2 h depuis plus de
6 h alors que la montre était connectée, ou service visage mort) ; bouton qui ouvre les réglages de batterie de
l'app (`ACTION_APPLICATION_DETAILS_SETTINGS`, le menu Samsung n'a pas d'Intent public stable). Le diagnostic exporte
`batteryOptimizationIgnored`, `manufacturer`, `oneUiVersion` (propriété `ro.build.version.oneui` si lisible).

**I97 — Radar neutre.** `radar.js` : remplacer `higherIsBetter` par `generalHypothesis` (comme D6 pour les pistes) ;
sortie « inhabituel » si |z| ≥ seuil, dans les deux sens ; l'étiquette « accompagne souvent la fatigue » ne reste que
comme hypothèse générale en petit, remplacée par « chez vous : … » quand la corrélation personnelle avec la note du
lendemain est connue (FDR, n ≥ 30).

### Sources (consultées le 16/10/2026)

- MediaPipe, télémétrie : https://github.com/google-ai-edge/mediapipe/issues/6291 ;
  dépôt Maven Google (AAR et pom téléchargés et inspectés) :
  https://dl.google.com/android/maven2/com/google/mediapipe/tasks-core/1.1.1/ ,
  https://dl.google.com/android/maven2/com/google/mediapipe/tasks-vision/1.1.1/ ,
  https://dl.google.com/android/maven2/com/google/mlkit/face-detection/16.1.7/ ,
  https://dl.google.com/android/maven2/com/google/ai/edge/litert/litert/2.3.0/
- Modèle : https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
  (exécuté avec `ai-edge-litert`, rien gardé dans le dépôt)
- ML Kit : https://developers.google.com/ml-kit/terms ; https://developers.google.com/ml-kit/vision/face-detection/android
- Samsung : https://docs.sportstracklive.com/android-battery-saving/samsung ;
  https://www.xda-developers.com/samsungs-one-ui-3-update-annoying-app-killing-behavior
- Bearable : https://bearable.app/support/howto/the-factor-effect-report/ ; https://bearable.app/support/tips/what-are-factors/ ;
  https://gummysearch.com/r/BearableApp/ — Exist : https://kb.exist.io/article/37-what-are-correlations ;
  https://kb.exist.io/article/55-will-exist-find-correlations-across-multiple-days
- Benchmarks : https://pub.dev/documentation/mediapipe_face_mesh/2.9.0/ (Dimensity 9400, maillage 1–5 ms)
- Non trouvés : retour d'utilisateur Samsung sur un service caméra de premier plan de longue durée (à mesurer par le
  diagnostic I88) ; temps d'inférence publié sur Exynos 1580.

### À creuser au prochain run idées (17/10 08:30)

- Spécification `protocoles/visage.md` : ancres exactes du détecteur court-portée, liste des 146 points d'entrée des
  blendshapes (code MediaPipe Apache-2.0, lecture seule).
- La GT 6 Pro et la veille profonde de One UI : un propriétaire de Huawei sur Samsung qui l'a vécue avec Gadgetbridge ?
- Welltory / Exist : plaintes sur des liens « évidents » (reporté depuis le 15/10).

---

## Run du 16/10/2026 08:30 (Paris) — l'humeur par le visage et la voix : ce qu'Android permet vraiment sur l'A56

Question du jour, côté utilisateur : *« je veux que l'app sache comment je vais sans que je le note, en lisant mon
visage quand j'utilise mon téléphone. Est-ce que ça peut marcher sur mon Galaxy A56, toute la journée, sans vider la
batterie, et est-ce que ça vaut quelque chose ? »* C'est le sujet que le run du 15/10 20:30 a laissé « à creuser
avant tout code D4 ». Montre en maintenance, aucun nouveau journal (`diagnostics/` inchangé). Recherche web, **lecture
du code d'Android (AOSP main)** et du code de HealthTrack.

### Ce qu'on apprend (faits)

- **Emobot a publié ses premiers chiffres** [V medRxiv 10.64898/2025.12.20.25341076, préprint 22/12/2025, étude
  financée par Emobot] : app **EmoDTx**, qui analyse le visage par la **caméra frontale pendant l'usage normal du
  téléphone** avec un modèle maison ; le score (« FADS », dynamique de l'expressivité) résume **14 jours**. 17 patients
  déprimés, 34 visites : ρ = 0,65 avec le PHQ-9 (IC 95 % 0,50–0,87), et les **variations** d'une visite à l'autre
  suivent celles du PHQ-9 (ρ = 0,67). Petit échantillon, analyse intermédiaire (17 % des 98 prévus), comparé à un
  auto-questionnaire. **Leçon pour HealthTrack : Emobot mesure une tendance sur deux semaines, pas une émotion à
  l'instant.**
- **FacePsy** [V arXiv 2406.17181, MobileHCI 2024, Stevens ; code `github.com/stevenshci/FacePsy`, licence du code
  non affichée → lecture seule, rien copié], la référence citée par Emobot : service Android qui prend une **rafale de
  10 s à 2,5 images/s au déverrouillage et à l'ouverture de 35 apps** (réseaux sociaux, messagerie…), ML Kit (sourire,
  yeux ouverts, angles de la tête) + 12 unités d'action, images effacées après extraction, notification « collecte
  active » et voyant vert. 25 personnes, 4 semaines : **modèle personnalisé AUROC 0,81 contre 0,67 pour un modèle
  universel** ; indices les plus liés le matin : **ouverture des yeux et inclinaison de la tête** (r ≈ 0,33–0,35),
  plus que le sourire. AUROC 0,62 dès le 1er jour, 0,71 dès le 7e.
- **Android, règles vérifiées (doc officielle, 16/10/2026)** :
  - un service de premier plan `camera` ou `microphone` **doit être créé pendant qu'une activité de l'app est
    visible** (Android 14+) ; les exemptions générales (batterie « sans restriction », superposition…) **ne lèvent
    pas** ce verrou. Exemptions qui le lèvent : démarrage par **un geste sur une notification**, un widget, un composant
    système, le service vocal par défaut, un propriétaire d'appareil ;
  - une fois créé, le service garde la caméra en arrière-plan (c'est son rôle : « continuer d'accéder à la caméra
    depuis l'arrière-plan ») ;
  - un récepteur `BOOT_COMPLETED` ne peut **pas** lancer un service `camera` (Android 15) ni `microphone` (Android 14) ;
  - Android 16 n'ajoute rien sur la caméra (quotas des tâches lancées depuis un service seulement).
- **`appops set com.healthtrack.app CAMERA allow`, tranché par le code d'Android** [V AOSP main, lecture seule] :
  - le contrôle à la création du service (`ForegroundServiceTypePolicy`) accorde la caméra **sans condition** quand le
    mode est `MODE_ALLOWED`, et seulement « si l'app est au premier plan » quand il est `MODE_FOREGROUND` ;
  - **mais** `CAMERA` et `RECORD_AUDIO` déclarent une permission d'arrière-plan (`BACKGROUND_CAMERA`,
    `RECORD_BACKGROUND_AUDIO`) de niveau `internal|role`, impossible à accorder par `pm grant` ; le service de
    politique des permissions (`PermissionPolicyService`) en déduit `MODE_FOREGROUND` et **resynchronise le mode à
    chaque changement d'app-op, de permission, de mise à jour de l'app et au démarrage** [V code ; effet sur un vrai
    téléphone : H fort] → un `appops … allow` est très probablement **effacé en quelques instants**. C'est
    l'explication la plus simple du « aucun retour fiable » noté le 13/10.
- **Micro, règles de partage (doc officielle)** : deux apps ordinaires ne captent jamais en même temps ; l'app dont
  l'écran est au premier plan, ou une source « sensible » (`VOICE_COMMUNICATION` des appels / visios), gagne ; **un
  appel en cours gagne toujours**. Les autres reçoivent du **silence** (détectable : `isClientSilenced()`). Donc un
  micro de fond n'entend jamais vos appels ni vos messages vocaux, c'est-à-dire justement quand vous parlez.
- **Code de HealthTrack** : `targetSdk 36` ; déjà 2 services natifs et un récepteur de déverrouillage
  (`WatchPresenceService`, `WatchSyncJob`) dont on peut reprendre le modèle ; `moodEstimate.js` garde encore ses
  entrées **comportementales** (sommeil, pas, écran tard avec `higherIsBetter: false`) : code mort qui contredit
  D5 / D6 ; aucune `ESTIMATOR_INPUTS` encore.

### Idées classées (impact × faisabilité) — aucune n'ajoute d'écran

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I88 | **« Lecture du visage » en un interrupteur, sur un plan qu'Android autorise** : service `camera` créé depuis l'app ouverte, rafales courtes au déverrouillage et toutes les ~3 min écran allumé, veille écran éteint ; s'il est tué : **notification « Reprendre » d'un geste** (exemption officielle), jamais de relance automatique | Humeur captée sans rien saisir, toute la journée (D4) | 5 | 3 | **15** |
| I90 | **Le visage mesuré comme Emobot / FacePsy** : par rafale, une dizaine de nombres (sourire, yeux, sourcils, tête, mobilité) ; par jour et par moment (matin / après-midi / soir) ; affiché en **tendance 14 jours vs votre plage**, calibré sur **vos** notes (modèle personnel, pas universel) | Une estimation qui vaut quelque chose pour vous (D4, D6) | 5 | 3 | **15** |
| I92 | **Nettoyer `moodEstimate.js` avant D4** : retirer les entrées comportementales (sommeil, pas, écran tard « mauvais »), garder la calibration (Ridge + garde-fou LOO) pour les signaux directs ; poser `ESTIMATOR_INPUTS = ['face', 'voice', 'selfReport']` + le test anti-circularité | Pas de cercle, pas de norme cachée (D5, D6) — petit et livrable seul | 3 | 5 | **15** |
| I89 | **Shizuku / ADB testé, pas promis** : le guide demandé reste, mais dans le Diagnostic ; l'app lit elle-même le mode app-op brut de la caméra et du micro (`unsafeCheckOpRawNoThrow`) juste après, 10 s plus tard, après une mise à jour et après un redémarrage, et le dit (« accès permanent : tenu / effacé par Android ») | Savoir en un journal si le « niveau 2 » tient sur l'A56 (D4) | 3 | 4 | 12 |
| I91 | **La voix là où elle existe vraiment** : d'abord la dictée du soir (app au premier plan, prosodie + note + tags proposés, audio effacé) ; échantillons de fond seulement en option, jamais pendant un appel ou une autre capture, rejetés s'ils sont silencieux ou si ce n'est pas votre voix | Voix utile sans micro « espion » inutile (D4) | 4 | 3 | 12 |
| I93 | **Moins de notes à saisir quand le visage suffit** : une fois l'estimation calibrée, la question du soir n'est posée qu'un jour sur deux tirés au hasard, plus les jours où l'estimation hésite (le hasard évite de fausser la calibration) | Saisie au dernier recours (D1, directions du 11/10) | 4 | 3 | 12 |

**Écartées** : *capture continue de la vidéo* (batterie, chaleur, rien de plus que des rafales d'après FacePsy) ;
*modèle d'émotion « universel » affiché seul* (FacePsy : 0,67 contre 0,81 personnalisé ; Emobot : tendance 14 j) ;
*analyse du contenu consulté sur les réseaux sociaux* (il faudrait lire l'écran par un service d'accessibilité :
faisable mais lourd, et ça mélangerait X et Y ; le temps par app, déjà décidé en X, suffit pour l'instant).

### Détail et pistes d'implémentation

**I88 — Service visage.** Natif Java, sur le modèle de `WatchPresenceService` :
- `FaceSenseService`, `foregroundServiceType="camera"`, permissions `CAMERA` + `FOREGROUND_SERVICE_CAMERA` ;
  `startForegroundService` appelé **uniquement** depuis l'interrupteur de l'app ouverte (plugin Capacitor `FaceSense`)
  ou depuis l'action « Reprendre » d'une notification (`PendingIntent.getForegroundService`).
- `START_NOT_STICKY` : une relance automatique d'Android viendrait de l'arrière-plan et lèverait une
  `SecurityException`. À la place, le récepteur de déverrouillage déjà vivant (`WatchPresenceService`, ou
  `WatchSyncJob` toutes les ~2 h) remarque « interrupteur activé mais service absent » et poste la notification
  « Lecture du visage arrêtée · Reprendre » (une fois, pas en boucle) ; même chose après un redémarrage.
- Récepteurs dynamiques `SCREEN_ON` / `USER_PRESENT` / `SCREEN_OFF` dans le service : rafale au déverrouillage, puis
  une toutes les ~3 min écran allumé et déverrouillé, rien écran éteint.
- Rafale : Camera2 (ou CameraX `ImageAnalysis`), caméra frontale, ≈ 320 × 240 YUV, 3 images à ≈ 2,5 /s, caméra fermée
  en moins de 2 s. Sautée si la caméra est prise (`CameraManager.AvailabilityCallback`), si un appel est en cours, ou
  si la marge thermique est faible (`PowerManager.getThermalHeadroom` > 0,8). Aucune image écrite sur le disque.
- Batterie [H, à mesurer] : ≈ 140 rafales par jour (≈ 60 déverrouillages + 4 h d'écran / 3 min) × ≈ 1 J (caméra
  ≈ 0,7 W pendant 1,5 s + inférence) ≈ 0,04 Wh, soit **≈ 0,2 % d'une batterie de 5 000 mAh par jour** ; même cinq fois
  plus resterait sous 1 %. Mesure réelle dans le diagnostic : `BATTERY_PROPERTY_CHARGE_COUNTER` avant / après 1 h,
  nombre de rafales, durée moyenne de caméra ouverte.
- Diagnostic exportable (comme la montre) : version d'Android / One UI, service vivant ou non, rafales faites / sautées
  (et pourquoi), visage trouvé ou non, temps d'inférence, notification « Reprendre » utilisée. **Aucune image, aucun
  score individuel** dans le journal.

**I90 — Ce qu'on garde d'une rafale.** MediaPipe Face Landmarker (poids Apache-2.0, I73) en natif (LiteRT ;
taille ajoutée à l'APK à mesurer, arm64 seulement) : sur 52 coefficients de « blendshapes », n'en garder qu'une dizaine
utiles et lisibles : sourire (moyenne gauche / droite), ouverture des yeux (1 − clignement), sourcils froncés /
levés, bouche abaissée, angles de la tête (tangage, lacet), mobilité de l'expression entre les 3 images, + présence
du visage et qualité (luminosité, taille du visage). Entrée stockée : `{ at, subtype: 'face_burst', values: {…} }`.
Agrégats par jour et par moment (matin / après-midi / soir : moyenne, écart, nombre de rafales). Affichage :
**une ligne** dans le bloc humeur existant, « Expressivité des 14 derniers jours : dans votre plage / plus basse que
d'habitude », jamais une émotion à l'instant, jamais un diagnostic. Calibration : la régression Ridge + garde-fou LOO
de `moodEstimate.js` (≥ 14 jours de notes), qui choisit **pour vous** quels indices comptent.

**I92 — Nettoyage préalable.** `moodEstimate.js` : retirer `MOOD_SIGNALS` comportementaux et tout ce qui les lit ;
extraire la calibration dans `services/mood/calibration.js` (générique : entrées = colonnes de signaux directs) ;
`services/mood/estimatorInputs.js` exporte `ESTIMATOR_INPUTS` ; test : aucune clé d'`ESTIMATOR_INPUTS` (ni ses
colonnes, ni le tag « Stress » ressenti, I84) n'apparaît dans les facteurs de `analysisEngine` / `behaviorTags`.

**I89 — Shizuku / ADB.** Dans le diagnostic du visage : commande à copier (`appops set com.healthtrack.app CAMERA
allow`, idem `RECORD_AUDIO`), puis lecture du mode brut par l'app (`AppOpsManager.unsafeCheckOpRawNoThrow(
OPSTR_CAMERA, uid, package)`) à 0 s, 10 s, à l'ouverture suivante, après une mise à jour et après un redémarrage.
Si le mode tient en `allow` (contrairement à ce que prévoit le code d'AOSP, par exemple un comportement propre à
Samsung), l'app peut relancer le service depuis l'arrière-plan sans notification. Sinon le guide le dit en une ligne
et on s'en tient à « Reprendre ».

**I91 — Voix.** Étape 1 : la dictée du soir (I41 / I74) donne prosodie (hauteur, énergie, débit, pauses ; maison +
pitchy 0BSD, I67) et la note, l'audio est effacé. Étape 2, en option : service `microphone` créé avec celui du visage,
échantillon de 5 s seulement si `AudioManager.getActiveRecordingConfigurations()` est vide et pas d'appel ; rejeté si
`isClientSilenced()`, si aucune voix n'est détectée, ou si la hauteur sort de la plage de **votre** voix apprise
pendant les dictées (filtre simple, à valider). Rappel non bloquant sur l'accord des personnes enregistrées.

**I93 — Question du soir allégée.** Tirage d'un jour sur deux, plus les jours où l'intervalle de l'estimation est
large ; les jours tirés sont marqués pour que la calibration n'utilise que des jours choisis sans regarder
l'estimation (sinon biais de sélection). Une note donnée spontanément compte toujours.

### Sources (consultées le 16/10/2026)

- Emobot : https://www.medrxiv.org/content/10.64898/2025.12.20.25341076.full.pdf (NCT06860165) ;
  https://france-biotech.fr/wp-content/uploads/2025/06/Communique-de-Presse-EMOBOT-Vivatech-11-juin-2025-FR-Version-1.pdf
- FacePsy : https://arxiv.org/html/2406.17181v1 ; MoodCam : https://arxiv.org/pdf/2412.12625 ;
  MoodCapture : https://dl.acm.org/doi/10.1145/3613904.3642680
- Android : https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start ;
  https://developer.android.com/develop/background-work/services/fgs/changes ;
  https://developer.android.com/about/versions/15/behavior-changes-15 ;
  https://developer.android.com/develop/background-work/services/fgs/service-types ;
  https://developer.android.com/media/platform/sharing-audio-input
- AOSP (lecture seule) : https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/core/java/android/app/ForegroundServiceTypePolicy.java ;
  https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/services/core/java/com/android/server/policy/PermissionPolicyService.java ;
  https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/core/res/AndroidManifest.xml
- Non trouvés : retours d'utilisateurs Samsung One UI 7 / 8 sur un service caméra de fond (recherche sans résultat
  utile) → à mesurer par le diagnostic ; chiffres de consommation publiés pour MediaPipe sur téléphone (aucun).

### À creuser au prochain run idées (16/10 20:30)

- Taille réelle ajoutée à l'APK par MediaPipe Tasks Vision (ou LiteRT seul + modèles) en arm64, et temps d'inférence
  publié sur un Exynos 1580.
- Reddit / forums : propriétaires de Samsung qui utilisent une app caméra de fond (voyant vert, coupures, « Applis
  jamais en veille »).
- Bearable / Welltory : formulations des liens et plaintes (« évident », « moralisateur ») — reporté du 15/10.

---

## Run du 15/10/2026 20:30 (Paris) — alléger sans rien perdre : moins de volume, moins de saisie, moins de sermons

Question du jour, côté utilisateur : *« la montre marche, mais l'app me paraît chargée et lente ; qu'est-ce que je
peux arrêter de saisir, qu'est-ce qui ne sert à rien à l'écran, et pourquoi les courbes rament ? »* Montre en
maintenance depuis ce matin (consigne du 15/10), D1 en tête. Aucun nouveau journal (`diagnostics/` inchangé).
Recherche web + **lecture du code** (les sous-agents de recherche étaient indisponibles ce run).

### Ce qu'on apprend des autres (faits)

- **Google Health remplace l'app Fitbit (19/05/2026) : rejet massif** [T WebProNews, TechRadar, helentech] — post
  Reddit « Thanks, Google, for ruining Fitbit » ≈ 2 000 votes en quelques jours, avis Play surtout à 1 étoile, ≈ 50 %
  d'insatisfaits dans un sondage [T]. Griefs : **des paragraphes de résumé IA à faire défiler avant de voir ses
  données** ; tableau de bord à la fois chargé et moins informatif ; **impossible de retirer ou réordonner** les
  tuiles ; détails déplacés (« un geste de plus »). Feuille de route de Google du 27/05 : tableaux de bord
  personnalisables (ajouter / retirer / réordonner), coach IA « plus concis, moins de commentaires sur une petite
  marche », graphiques horaires remis en vue principale.
- **MyFitnessPal 26.16.0 (04/2026)** [T mwm.ai] : le journal remplacé par un écran « Aujourd'hui » → note moyenne
  −1,7 étoile, sans retour possible. Avec Samsung Health 7.0 (run de 08:30), **trois refontes rejetées en 2026 pour la
  même raison** : l'interprétation passe devant la donnée, et l'utilisateur ne peut pas la ranger.
- **Exist.io** [V kb.exist.io] : chaque corrélation affiche **force et confiance séparément** (une relation forte
  peut avoir une confiance faible faute de données) ; l'utilisateur peut **noter une corrélation négativement, elle
  disparaît partout** ; si rien le jour même, Exist teste le lendemain. Rappel explicite : coïncidence, tierce
  variable ou sens inverse possibles.
- **Statistique N-of-1** [T vignette CRAN nof1kit ; Daza 2018] : sans tenir compte de l'autocorrélation, jusqu'à
  ≈ 40 % de faux positifs à 5 % nominal sur un planning lent (≈ 10 % avec un modèle AR(1)). **Vérifié dans le code :
  HealthTrack corrige déjà** (`statistics.js` : `effectiveSampleSize` par autocorrélation lag-1, `benjaminiHochberg`,
  résidualisation week-end) et teste le décalage (`laggedEffects.js`). Rien à refaire ; à garder en tête pour D5.
- **Une seule question d'humeur suffit** [V *Assessment* 2023, WUSTL] : en suivi intensif, un item unique a une
  validité prédictive significative dans la plupart des modèles (r = 0,24–0,61 avec les échelles longues), le gain
  des items multiples est modeste. Méta-analyse EMA : observance ≈ 79 % à ≈ 6 sollicitations / jour sur ≈ 7 jours
  [V PMC9999286]. → Conforte la note unique 0–5 du check-in ; ne rien y ajouter.
- **Affichage des longues séries** [V arXiv 2305.00332, IEEE VIS 2023] : **MinMaxLTTB** (pré-sélection min/max puis
  LTTB sur quelques multiples de la cible) garde le rendu de LTTB avec un gain de plus d'un ordre de grandeur ;
  c'est le défaut de plotly-resampler. Implémentation JS triviale (~40 lignes), sans dépendance.
- **Health Connect** [V page Jetpack] : 1.1.0 stable (22/04/2026), 1.2.0-alpha04 ; types « pleine conscience » et
  « température cutanée » disponibles — pas d'autre nouveau type confirmé pour 2026.
- **Installation hors Play Store** [T 9to5Google 18/08/2026, The Hacker News 03/2026] : le parcours avancé (Options
  pour les développeurs → « Autoriser les apps de développeurs non vérifiés », **attente unique de 24 h**,
  redémarrage, puis réglage gardé 7 jours ou **indéfiniment**) arrive progressivement via l'app « Android Developer
  Verifier » ; **les installations par ADB ne sont pas concernées**. → Pour le propriétaire : une fois le réglage
  activé « indéfiniment », la mise à jour en 1 clic continue (précise I48).
- **MediaPipe Face Landmarker sur téléphone** : aucun chiffre public sur un milieu de gamme ; ≈ 1–5 ms par image sur
  puce haut de gamme d'après des tiers [T pub.dev mediapipe_face_mesh, Qualcomm AI Hub] → à mesurer nous-mêmes sur
  l'A56 (écran de diagnostic D4), quelques images par minute restent négligeables côté calcul ; la caméra elle-même
  coûte plus que le modèle [H].

### Ce que dit le code (vérifié ce run)

- **SpO₂ stockée minute par minute** : `devices/huawei/sync.js` (`watchEntries`) écrit **une entrée `heart_rate`
  par minute mesurée** pour la SpO₂, alors que la FC est déjà regroupée en tranches de 10 min (min / moyenne / max).
  Or l'Accueil (`HealthRadar.jsx`, `BaselineCards.jsx`) lit **tout le type `heart_rate`** sur la période. Avec la
  SpO₂ continue de la GT 6 Pro, ça peut faire des centaines d'entrées par jour [H : volume réel à lire dans le
  prochain journal ou `countAllEntries` par sous-type] → **risque direct de lenteur des courbes** sur le vrai
  téléphone, que la démo `npm run perf` ne reproduit pas (pas de SpO₂ minute dans la démo).
- **Tag « Stress » du check-in** (`behaviorTags.js`, `effectDay: 'same'`) : c'est un **ressenti émotionnel déclaré
  au même moment que la note de bien-être**. Le présenter ensuite comme un facteur du bien-être du jour est presque
  tautologique (même source, même instant) — exactement le cercle que D5 interdit. Le stress **physiologique** de la
  montre (fichier 0x2C, I76), lui, est un vrai X.
- **Tags encore demandés alors que la montre sait** : « Sport le soir » (les séances de la montre sont lues depuis
  le 13/10), « Voyage » (changement de fuseau détectable à l'ouverture), « Repas tardif » (heure des repas saisis).
- **Courbes** : graphiques SVG maison (pas de bibliothèque) ; `WellbeingCharts` lit jusqu'à 2 000 notes pour 14
  jours affichés ; aucune réduction de points pour les longues séries.

### Idées classées (impact × faisabilité) — toutes retirent ou allègent, aucune n'ajoute d'écran

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I82 | **SpO₂ en tranches de 10 min** (min / moyenne / max / n, comme la FC) au lieu d'une entrée par minute ; migration rétrocompatible qui regroupe l'existant ; lectures de l'Accueil limitées aux sous-types utiles ; `npm run perf --dense` enrichi d'une SpO₂ minute pour reproduire le cas réel | Courbes et Accueil fluides avec une vraie montre (D2) | 5 | 4 | **20** |
| I84 | **« Stress » ressenti = côté Y** : retiré des facteurs des Analyses (il entre dans la liste déclarée des entrées auto-déclarées de l'estimateur, D5) ; le stress physiologique de la montre prend la place de facteur quand il sera lu (I76) ; anciens tags gardés et lisibles | Des liens honnêtes, pas « je suis stressé → je vais mal » (D5) | 4 | 5 | **20** |
| I85 | **Check-in réduit à ce que seul l'utilisateur sait** : « Sport le soir » déduit des séances (début ≥ 18 h), « Voyage » d'un changement de fuseau, « Repas tardif » des repas saisis (seulement les jours où des repas sont notés) ; ces tags disparaissent de la saisie quand la source existe (même règle que « Écran tard ») ; restent Alcool, Café après 14 h, Vaccin, Malade (+ Stress côté Y) | Ne jamais demander ce que l'app capte déjà (D1) — précise I65 | 4 | 4 | **16** |
| I83 | **Courbes à résolution adaptée** : au-delà de ~2 points par pixel, MinMaxLTTB (≈ 40 lignes, testé sur séries synthétiques : extrêmes conservés) ; périodes longues servies par les agrégats journaliers (D2 « cache d'agrégats »), le brut seulement pour aujourd'hui | Plus de lag au chargement des courbes (D2) | 4 | 4 | 16 |
| I87 | **La donnée avant l'interprétation** (leçon Google Health 05/2026) : sur l'Accueil, chiffres et courbes d'abord, texte d'interprétation en une ligne repliable ; « Prédiction du jour » fusionnée dans le point orange du graphique (déjà en D1) | Voir ses données sans faire défiler du texte (D1) | 3 | 5 | 15 |
| I86 | **« Pas pertinent pour moi »** sur chaque lien des Analyses (comme Exist) : masqué partout, réversible ; force et confiance affichées séparément, en mots (« lien net, encore peu de jours ») ; fusionne I80 | Garder le contrôle, ne jamais subir un lien évident ou faux (D6) | 3 | 4 | 12 |

**Écartée** : *questionnaire d'humeur à plusieurs items* — l'item unique suffit en suivi quotidien (gain modeste,
observance meilleure). **Mises à jour** : I65 précisée par I85 ; I80 absorbée par I86 ; I48 précisée (parcours avancé
« indéfiniment » + ADB non concerné).

### Détail et pistes d'implémentation

**I82 — SpO₂ en tranches.** Dans `watchEntries`, regrouper `m.spo2` par `HR_SLOT` comme la FC :
`{ value: moyenne, min, max, samples, subtype: 'oxygenSaturation' }` à `iso(s) + 30 s` (jamais la même clé
qu'une tranche de FC). Migration au démarrage (une fois, drapeau en `localStorage`/méta) : lire les SpO₂
`huawei_watch` par plage, réécrire par tranche, supprimer les minutes, en une transaction par jour ; test sur une
base fake-indexeddb avec anciennes entrées + export/import d'un ancien fichier. Vérifier que la nuit (désaturations
minimales) garde l'info utile : le `min` de la tranche. Mesurer avant / après avec `npm run perf --dense` après
ajout de 1 SpO₂ / 5 min sur 3 ans dans la démo.

**I84 — Stress côté Y.** `behaviorTags.js` : propriété `side: 'Y'` sur `stress` ; le moteur de corrélation filtre
les tags `side: 'Y'` ; la future `ESTIMATOR_INPUTS` (D5, `services/mood/estimatorInputs.js`) inclut `selfReport`
(note + stress ressenti). Test anti-circularité : aucune variable de `ESTIMATOR_INPUTS` dans les X. Texte dans
« Comment c'est calculé » : « votre stress ressenti fait partie de votre humeur ; il n'est pas présenté comme sa cause ».

**I85 — Tags déduits.** `behaviorTags.js` a déjà `auto: 'phone_usage'` pour l'écran : ajouter `auto: 'workouts'`
(séance dont le début ≥ 18 h, source montre ou Health Connect) et `auto: 'timezone'` (fuseau `Intl` mémorisé à
chaque ouverture, changement = voyage pour le jour). `auto: 'meals'` seulement si ≥ 2 repas notés ce jour-là. Même
mécanique que « Écran tard » : masqué dans la saisie quand la source est active, mesure prioritaire sur le tag
déclaré, anciens tags conservés.

**I83 — Réduction de points.** `utils/downsample.js` : `minMaxLttb(points, target, ratio = 4)` ; appliqué dans les
composants de courbes quand `points.length > 2 × largeur`. Avec les agrégats journaliers de D2 (store ou cache mémoire
invalidé à l'écriture), la plupart des vues ne lisent plus le brut.

**I86 / I87** : dans la passe D1 en cours (Accueil puis Analyses) ; « Pas pertinent » stocké en réglage local
(liste d'identifiants de liens), exporté avec la sauvegarde.

### Sources (consultées le 15/10/2026)

- Refontes : https://www.webpronews.com/fitbit-loyalists-revolt-as-google-health-app-replaces-trusted-tracker/ ;
  https://www.techradar.com/health-fitness/fitbit-fans-arent-happy-about-the-official-apps-redesign-heres-why ;
  https://helentech.jp/news-google-health-fitbit-user-backlash-86718/ ;
  https://mwm.ai/articles/myfitnesspal-v26-16-0-replaces-diary-with-new-ui-sparking-rating-drop-in-april-2026
- Analyses : https://kb.exist.io/article/37-what-are-correlations ;
  https://kb.exist.io/article/55-will-exist-find-correlations-across-multiple-days ;
  https://archive.linux.duke.edu/cran/web/packages/nof1kit/vignettes/nof1kit.html ;
  https://statsof1.netlify.com/2018_daza_latexversion.pdf ; https://arxiv.org/pdf/2306.14019
- Humeur : https://profiles.wustl.edu/en/publications/examining-the-concurrent-and-predictive-validity-of-single-items-/ ;
  https://pmc.ncbi.nlm.nih.gov/articles/PMC9999286 ; https://pmc.ncbi.nlm.nih.gov/articles/PMC3640573
- Courbes : https://arxiv.org/pdf/2305.00332 ; https://ar5iv.labs.arxiv.org/html/2304.00900
- Android : https://developer.android.com/jetpack/androidx/releases/health-connect ;
  https://9to5google.com/2026/08/18/google-gradually-rolling-out-androids-advanced-sideloading-ahead-of-developer-verification/ ;
  https://thehackernews.com/2026/03/google-adds-24-hour-wait-for-unverified.html
- ML : https://pub.dev/documentation/mediapipe_face_mesh/2.9.0/ ; https://aihub.qualcomm.com/jobs/jp2j204x5
- Non consultés : Reddit (non tenté ce run), contraintes Android de la caméra en service de premier plan (recherche
  non aboutie ce run → à reprendre au prochain run idées, avant de coder le service D4).

### À creuser au prochain run idées (16/10 08:30)

- Règles exactes Android 14–16 / One UI pour un service de premier plan `camera` qui reprend l'image au
  déverrouillage (accès « pendant l'utilisation », effet de `appops … allow`), avant le premier code D4.
- Volume réel de SpO₂ / FC par jour sur la GT 6 Pro (journal du propriétaire ou compteur par sous-type).
- Bearable / Welltory : formulations des liens et plaintes d'utilisateurs (« évident », « moralisateur »).

---

## Run du 15/10/2026 08:30 (Paris) — la montre sans y penser, la suite des mesures, l'humeur sur des bases légales

Question du jour, côté utilisateur : *« ma montre parle enfin à HealthTrack ; comment l'avoir à jour sans jamais
ouvrir l'app, avec aussi mon stress, ma VFC et mes phases de sommeil ? Et l'humeur par le visage, c'est faisable
légalement dans une APK publique ? »* Aucun nouveau journal du propriétaire depuis v124 (`diagnostics/` inchangé) ;
v132 publiée (coffre de la clé). Recherche en 3 volets parallèles (montre, humeur / ML, besoins / marché).

### Montre — ce qui change le plan (lecture seule, faits seulement, aucun code copié ; détail `protocoles/huawei.md` §7.11)

- **La présence « appareil compagnon » ne suffit pas seule** [V doc `CompanionDeviceService`, 16/09/2026] : en
  Bluetooth classique, l'événement n'arrive qu'à la connexion / déconnexion **du lien Bluetooth au niveau système**.
  Si personne n'ouvre ce lien (app tuée, montre revenue à portée), le service n'est jamais lié. → Il faut un
  **deuxième déclencheur**. Gadgetbridge (GB) n'utilise justement **pas** la reconnexion (jugée risquée, #6266,
  20/06/2026) mais une **synchro au déverrouillage de l'écran** avec un intervalle minimum [T doc GB « sync »]. Le
  futur service caméra de D4 réagit déjà au déverrouillage : un seul service peut porter les deux.
- **Redémarrage par le système** [V #6869 / PR #6905, fusionnée 02/10, confirmée 13/10 sur GT 6] : quand Android
  relance un service « sticky » sans intent, il faut relancer la connexion soi-même ; sinon plus aucune synchro.
  → règle à reprendre dans `WatchPresenceService` (③ e).
- **Ordre de synchro de GB** [V] : sommeil (7/0x0C) → minutes (7/0x0A) → totaux (7/0x03) → fichiers (TruSleep,
  stress, ECG) → séances, dans une file à part ; rien si déjà occupé ; début = dernier échantillon, sinon 1/1/2000.
  HealthTrack fait déjà presque pareil (minutes avant sommeil : sans importance).
- **Stress, VFC, sommeil détaillé : trois chemins différents** (le 3e est déjà lu par HealthTrack) [V code GB master, 15/10] : stress = **fichier**
  « rrisqi_data.bin » (service 0x2C, type 0x10, entrées de 66 octets : début, fin, score, niveau…) ; VFC = **synchro
  « dictionnaire »** P2P (classe 500044, valeur RMSSD), pas un fichier ; sommeil détaillé HarmonyOS 5+ = fichier
  **« sequence_data »** (type 0x16, classe 700013). Téléchargement 0x2C en 5 étapes (init → hash facultatif → infos →
  blocs → accusé). GB lui-même ne sort pas la VFC d'une GT 5 (#6461 ouverte) : ne rien promettre sur la VFC.
- **Watch 6 / Watch 6 Pro** : PR GB #7074 (ouverte le 15/10) les ajoute, en Bluetooth classique, préfixes
  « huawei watch 6- » / « huawei watch 6 pro- » [V]. Même famille → notre pilote doit les reconnaître par empreinte.
- **Rien de neuf** côté synchro GT 6 Pro depuis le 10/10 (recherches « GT6 », « TruSleep », « HarmonyOS ») [V].

### Humeur, voix, réseaux sociaux (D4 / D5)

- **MediaPipe Face Landmarker : poids sous Apache-2.0** [V fiches de modèle Blendshape V2 et Face Mesh V2] → la piste
  I73 est **légalement ouverte** pour une APK publique. Usage prévu « divertissement AR, pas de décision critique » :
  présenter l'humeur comme estimation de bien-être, jamais comme diagnostic (déjà la règle). Un seul travail récent
  sur les blendshapes : LSTM sur 27 blendshapes, 3 classes, 72 % [V arXiv 2501.13432, Frontiers 02/2026] — entraîné
  sur FER2013 (licence floue) → on garde les règles maison suivies en écart à soi.
- **Voix** : le seul modèle français redistribuable (Lajavaness, Apache-2.0) plafonne à F1-macro 0,45 et pèse un
  wav2vec2 « large » [V] ; emotion2vec+ : licence FunASR maison (redistribuable, non OSI, révisable) [V] ; openSMILE
  interdit en produit commercial [T]. → Confirme I67 : prosodie maison (F0, énergie, débit, pauses), signal faible.
- **Transcription** : ML Kit GenAI Speech toujours **alpha**, fr-FR en bêta, mode avancé réservé aux Pixel [V
  13/10/2026] ; aucune source sur le moteur hors ligne par défaut de One UI → tester `isOnDeviceRecognitionAvailable`
  sur l'A56 (repli Vosk inchangé).
- **Réseaux sociaux** : lien avec l'affect **très faible** (β 0,00–0,04, Elmer et al., *Emotion* 2025) [T], dans les
  deux sens → **décision D5 : l'usage des réseaux sociaux est un facteur X, jamais une entrée de l'estimateur**.
  L'estimateur se limite au visage, à la voix et à l'auto-déclaration.
- **Emobot** (emobothealth.com) : préprint 03/2026, r = 0,895 avec la MADRS sur n = 45 (poster ASCP 05/2026), voix +
  visage + mouvement + comportement à l'écran, dossier FDA De Novo en préparation [V] — financé par Emobot.
- **Distribution hors Play Store** [T Android Authority] : vérification obligatoire des développeurs pour le
  sideload, déjà en vigueur dans 4 pays depuis le 30/09/2026, partout en 2027 → point d'attention pour le
  propriétaire (installer depuis GitHub restera possible par un parcours « avancé »).

### Ce que veulent les gens (signaux du jour)

- **Samsung Health 7.0, contre-exemple parfait** [V unstar.app, 2 082 avis, 20/06–06/09/2026] : note 1,74 contre 2,57
  pour la 6.x ; plaintes : montre qui ne synchronise plus sans geste manuel (193), données perdues (189), navigation
  trop longue (146), **carte d'insight IA impossible à masquer** (69, presque toutes à 1 étoile).
- **Le modèle qui s'impose** : un bilan du matin par rapport à **votre** base (Galaxy Watch 9 « Vitals », 7 → 28 j)
  [T], et un **rapport mensuel automatique** (Pixel Watch 5 « Health Guardian », 12/08/2026) [V].
- **Gadgetbridge 0.95** (12/10/2026) [V] : liste des séances dont la synchro a échoué, export FIT par lot.
- **Lieux étiquetés** (« travail », « maison ») : une étude JMIR 2026 teste s'ils améliorent la prédiction de
  l'affect [T] ; mobilité GPS et humeur liées dans les deux sens avec décalage [T JMIR 2024].
- **Présenter des résultats N-of-1** : mots qualitatifs (« mieux / pire ») + un repère visuel plutôt que des chiffres
  seuls ; les croyances de départ pèsent sur la confiance → montrer la donnée, accompagner [T Self-E CHI 2021,
  insuffisance cardiaque]. Conforte I70.
- **Conversations** : Limitless (Meta) fermé à la vente, support jusqu'à ≈ 12/2026 ; Bee (Amazon) sans export ; Omi
  toujours ouvert et auto-hébergeable [V/T] → I61 (Omi direct) reste la seule piste viable.

### Idées classées (impact × faisabilité) — aucune n'ajoute d'écran

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I75 | **Deux déclencheurs pour la synchro app fermée** : présence compagnon (si le lien système existe) **+** déverrouillage de l'écran avec intervalle minimum (≥ 30 min), plus un filet WorkManager toutes les ~2 h ; relance de la connexion si Android redémarre le service sans intent (#6869) ; un seul service natif, partagé plus tard avec la lecture du visage (D4) | Montre à jour sans jamais ouvrir l'app (D3 d quater) | 5 | 4 | **20** |
| I78 | **Réseaux sociaux = X, décidé et testé** : la liste déclarée des entrées de l'estimateur (D5) = visage, voix, auto-déclaration ; le temps sur les réseaux sociaux (UsageStats, déjà accordé pour « Temps d'écran ») entre dans les Analyses comme facteur ; le test anti-circularité l'impose | Savoir si les réseaux me font du bien ou non, sans tautologie (D5, D6) | 4 | 5 | **20** |
| I76 | **Stress et VFC de journée par la montre** (phases du sommeil et VFC de la nuit déjà lues depuis le 13/10 via `sequence_data`) : fichier stress 0x2C type 0x10 (même téléchargement que le sommeil, `files.js`) et synchro dictionnaire classe 500044 (VFC), chacun dans le journal par service (I69) ; « non fourni par la montre » plutôt qu'un vide | Les données qui comptent le plus pour la récupération et comme X de l'humeur (D3 d bis) | 4 | 4 | **16** |
| I79 | **Bilan du mois, automatique** : le 1er du mois, le parcours du matin (I71) affiche une fois « ce que le mois dit de vous » (vos tendances vs votre base, liens devenus solides ou abandonnés), puis disparaît | Prendre du recul sans ouvrir les Analyses (leçon Pixel Health Guardian) | 4 | 4 | 16 |
| I80 | **Rien d'imposé à l'écran** (leçon Samsung Health 7.0) : toute carte d'interprétation de l'Accueil masquable d'un appui long, état de synchro honnête par source (dernière réussite, échecs listés comme GB 0.95) | Garder le contrôle, ne jamais subir un « insight » | 3 | 4 | 12 |
| I77 | **Empreintes Huawei Link : verrouiller par des tests** — vérifié ce run : `isHuaweiWatchName` et `isHuaweiLinkDevice` reconnaissent déjà « HUAWEI WATCH 6 Pro-… », « HONOR Band 9-… » et FE86 sans liste de modèles ; manquent l'UUID SDP Honor (`C9770A18-…`) comme repli quand le nom est générique, et des tests sur des noms réels | Brancher d'autres montres Huawei / Honor sans attendre (D3 registre) | 2 | 5 | 10 |
| I81 | **Lieux étiquetés comme contexte** : regroupement des positions approximatives sur le téléphone, l'utilisateur nomme 2–3 lieux d'un tap (« maison », « travail »), temps passé par lieu = X | Comprendre l'effet de ses journées hors de chez soi | 3 | 3 | 9 |

**Vérifié dans le code ce run** : le sommeil détaillé (`sequence_data`, phases, score, VFC de la nuit) est **déjà lu**
par le pilote JS depuis le 13/10 ; le client Java (③ d) le recevra brut comme le reste. **Écartée** : *modèle d'émotion vocale pré-entraîné dans l'APK* (Lajavaness trop lourd et faible, emotion2vec sous
licence révisable, audeering non commercial). **Mise à jour** : I73 (visage) **débloquée côté licence** (Apache-2.0) ;
I72 complétée par I75 (la présence seule ne couvre pas le cas « app tuée, montre revenue »).

### Détail et pistes d'implémentation

**I75 — Deux déclencheurs.** `WatchPresenceService` (③ e) reste le point d'entrée ; un récepteur
`ACTION_USER_PRESENT` enregistré **dynamiquement** dans un service de premier plan déjà actif (ce broadcast implicite
n'est plus reçu par un récepteur déclaré dans le manifeste) ; sans service actif, filet `PeriodicWorkRequest` (2 h,
contrainte Bluetooth activé) qui ouvre RFCOMM < 1 min. Même verrou que le JS (30 min, un essai, socket fermé).
`onStartCommand(null intent)` → relancer la connexion. Test JVM : planificateur pur (dernière synchro, occupé, clé
refusée → jamais d'essai).

**I78 — Liste déclarée.** `src/services/mood/estimatorInputs.js` exporte `ESTIMATOR_INPUTS = ['face', 'voice',
'selfReport']` ; le moteur de corrélation refuse tout X de cette liste ; `socialMediaMinutes` (par catégorie
d'apps : réseaux sociaux connus) rejoint les variables quotidiennes. Test : intersection vide, et le test échoue si on
y ajoute `socialMediaMinutes`.

**I76 — Stress et VFC de journée.** Le téléchargement 0x2C existe déjà (`devices/huawei/files.js`, type `STRESS`
déclaré mais non lu) : ajouter la lecture des entrées de 66 octets (début, fin, score, niveau) d'après §7.11, trames
d'exemple construites par nous ; VFC de journée = synchro dictionnaire (classe 500044), à spécifier en §7.11 bis avant
tout code. Ne lancer que si les capacités de la GT 6 Pro l'annoncent (`stress auto`, `VFC` déjà notés dans le journal).
À noter : la montre déclare aussi une capacité « émotion » (`EXPAND.EMOTION`) — c'est un calcul physiologique de la
montre ; s'il est lu un jour, ce sera un **X**, pas une entrée de l'estimateur d'humeur (D5).

**I77** : tests sur des noms réels (« HUAWEI WATCH GT 6 Pro-1A2 », « HUAWEI WATCH 6 Pro-3F1 », « HONOR Band 9-xxx »,
« HUAWEI WATCH FIT 4 Pro-… ») + repli sur l'UUID SDP Honor dans `isHuaweiLinkDevice`. Petit, à glisser dans un run montre.

**I79 / I80 / I81** : après I71 (parcours unique) ; I80 réutilise le « Mode calme » (I52).

### Sources (consultées le 15/10/2026)

- Montre : https://codeberg.org/Freeyourgadget/Gadgetbridge/pulls/7074 · /issues/7055 · /issues/7035 · /issues/6978 ·
  /issues/6869 · /pulls/6905 · /issues/6461 · /issues/6266 · /pulls/6701 · /pulls/6816 · /pulls/6579 · /issues/6938
  (via l'API REST) ; https://gadgetbridge.org/basics/features/sync/ ; https://gadgetbridge.org/basics/topics/huawei-honor/
- Android : https://developer.android.com/reference/android/companion/CompanionDeviceService ;
  https://developer.android.com/reference/android/companion/CompanionDeviceManager ;
  https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start
- Humeur / ML : https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker ; fiches
  https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Blendshape%20V2.pdf et …Face%20Mesh%20V2.pdf ;
  https://arxiv.org/abs/2501.13432 ; https://huggingface.co/emotion2vec/emotion2vec_plus_base ;
  https://raw.githubusercontent.com/modelscope/FunASR/main/MODEL_LICENSE ;
  https://huggingface.co/Lajavaness/wav2vec2-lg-xlsr-fr-speech-emotion-recognition ;
  https://developers.google.com/ml-kit/genai/speech-recognition/android ; https://developers.google.com/edge/litert/next/npu ;
  https://support.google.com/android/answer/12623953 ; https://www.medrxiv.org/content/10.64898/2026.03.08.26347894v1 ;
  https://emobothealth.com
- Besoins / marché : https://unstar.app/blog/samsung-health-update-not-syncing-watch-layout-reviews-2026 ;
  https://blog.google/products-and-platforms/devices/pixel/pixel-watch-5/ ;
  https://www.techadvisor.com/article/3225480/huawei-watch-6-official-as-pixel-watch-5-rival.html ;
  https://gadgetbridge.org/blog/release-0_95_01/ ; https://docs.omi.me/ ;
  https://techcrunch.com/2026/01/12/why-amazon-bought-bee-an-ai-wearable/ ; https://news.samsung.com/us/samsung-whats-new-galaxy-watch9/ ;
  https://www.jmir.org/2024/1/e55635 ; https://jeffhuang.com/papers/SelfE_CHI21.pdf
- Inaccessibles : old.reddit.com, channelnews.com.au et androidauthority.com (403), mhealth.jmir.org e90970 (vide),
  thieme-connect.com (anti-robot), recherche de code GitHub (hors périmètre de la session).

### À creuser au prochain run idées (15/10 20:30)

- Le journal v125+ du propriétaire s'il arrive : mesures reçues, capacités annoncées (téléchargement de fichiers ?).
- La GT 6 Pro rétablit-elle d'elle-même le lien Bluetooth système avec le téléphone sans app active (condition
  d'I75) ? Retours d'utilisateurs Gadgetbridge.
- Détail des entrées du fichier stress (RRI) et de la synchro dictionnaire VFC (classe 500044), pour écrire §7.11 bis.

---

## Run du 14/10/2026 20:30 (Paris) — si la montre envoie encore 0 mesure, relire app fermée, un seul parcours par jour

Question du jour, côté utilisateur : *« ma montre est associée, mais si demain l'historique est encore vide, qu'est-ce
qui peut bloquer ? Et une fois que ça marche, comment l'avoir sans y penser, avec une app qui me pose moins de
questions et ne m'invente rien ? »* Aucun nouveau journal du propriétaire depuis v124 (`diagnostics/` inchangé). La
recherche montre a donc porté sur **les pièges connus de la synchro** (après l'association) et sur l'arrière-plan.

### Montre — ce qui peut encore bloquer la synchro (lecture seule, faits seulement, aucun code copié)

Codeberg refuse la lecture web (HTTP 429) ; l'API REST `codeberg.org/api/v1` répond : issues et PR lues sur la source.
- **Compte Huawei inutile pour une montre jamais liée** [V #6271, 10/06/2026] : un contributeur Huawei de Gadgetbridge
  (GB) utilise une GT 6 Pro jamais connectée à Huawei Santé, « Huawei Account not required » ; l'identifiant ne sert qu'à
  partager la montre avec Huawei Santé. Seul manque signalé : la mise à jour AGPS. → **Ferme la question ouverte du
  run 08:30** (compte exigé ?). L'identifiant observé fait 16 à 18 chiffres selon les comptes (#6271, #6010), pas
  toujours 17 : vérifié, le plan B accepte 15 à 20 chiffres (`normalizeAccountId`) ; seul le texte « 17 à 19
  chiffres » de l'assistant est à corriger (« 16 à 19 ») au prochain run de code.
- **Synchro confirmée sur GT 6 Pro par GB** [V #5784, 02/2026] : pas, distance, sommeil OK ; seules les **séances
  enregistrées automatiquement** échouaient (« longueur des données ≠ masque ») → la lecture d'une séance doit suivre
  la longueur annoncée de chaque bloc interne et ignorer un bloc vide, au lieu de rejeter la séance.
- **Deuxième canal RFCOMM** [V PR #6448, fusionnée 07/2026] : sur les Huawei Watch 3 / 4 / 5 (pas la série GT), la
  synchro santé exige un **canal auxiliaire** ; la montre envoie une table de routage des services, et le
  téléchargement de fichiers (service 0x2C) peut ne marcher que sur ce canal (essai principal, bascule sur délai
  dépassé). [H] Peu probable sur la GT 6 Pro (GB la synchronise sur un seul canal), mais c'est **le premier suspect si
  le sommeil détaillé ne vient jamais** : le journal doit dire si 0x2C a répondu ou expiré.
- **Stress et VFC dépendent du modèle** [V doc GB Huawei/Honor] : le stress doit être activé et calibré sur la montre ;
  VFC absente sur GT 5 HarmonyOS 5.1 (#6461 ouverte). → « Jamais reçu : stress » doit dire « à activer sur la montre ».
- **Clé remplacée** [V #6978, 08/10/2026] : si une autre app (ou une mise à jour HarmonyOS 6.1 → 7) a refait l'appairage,
  l'ancienne clé est morte ; la solution est un **appairage initial complet**, pas une reconnexion. Reconnexions
  répétées à longue distance = montre instable (#6367) → espacer, jamais boucler. Déjà le comportement de HealthTrack.
- **Deux apps à la fois : impossible** [V #6010, 15/04/2026 ; #6271 18/06/2026] — confirme la consigne « une seule
  app ». Alterner est possible en retirant le Bluetooth à l'app inactive (automatisable via Shizuku, #7025, 11/10/2026).

### Arrière-plan — le plan I49 précisé (sources Android, mises à jour 01/10/2026)

- `CompanionDeviceService` : en Bluetooth classique, l'événement arrive **à la connexion de la montre**
  (`EVENT_BT_CONNECTED`), sans scan ; le système lie le service et relève la priorité de l'app, « qui n'a pas besoin de
  rester ouverte » [V]. `onDeviceAppeared` est **déprécié en API 36** au profit de `onDevicePresenceEvent` +
  `startObservingDevicePresence(ObservingDevicePresenceRequest)` (permission
  `REQUEST_OBSERVE_COMPANION_DEVICE_PRESENCE`) → coder les deux chemins selon la version.
- Démarrer le service de premier plan `connectedDevice` depuis l'arrière-plan est permis aux apps associées avec
  `REQUEST_COMPANION_START_FOREGROUND_SERVICES_FROM_BACKGROUND` [V]. Sur Samsung : batterie « Sans restriction » et
  hors « applis en veille » [T dontkillmyapp, 07/2024, One UI 7 / 8 non couverts].
- GB sous Android 15 recommande « connexion déclenchée par l'appareil » plutôt que la reconnexion automatique [V #5429].

### Humeur et voix — faits de licence et de faisabilité (D4)

- **AffectNet** : licence « usage académique, non commercial, sans redistribution » [T copie de l'accord v2,
  30/03/2023] ; **HSEmotion / EmotiEffLib** : code Apache-2.0, mais **aucune licence propre aux poids**, entraînés sur
  AffectNet [V dépôts consultés le 14/10]. FER+ : étiquettes MIT mais images FER2013 floues ; RAF-DB : site en 503.
  → Pour un APK distribué, **pas de poids issus d'AffectNet** : MediaPipe Face Landmarker (52 blendshapes, page du
  09/10/2026) + règles maison, suivies en écart à soi.
- **Restriction Android confirmée** [V doc FGS, 01/10/2026] : depuis Android 14, impossible de *créer* un service
  caméra / micro depuis l'arrière-plan, et **les exemptions habituelles ne lèvent pas cette règle** ; seules marchent
  une activité visible ou un geste sur notification / widget. Aucune source ne montre que `appops … CAMERA allow`
  contourne la vérification (elle porte sur l'état du processus). → Le diagnostic D4 le testera, mais le service se
  lance depuis l'app ou d'un tap sur sa notification.
- **Transcription française sur le téléphone** : `createOnDeviceSpeechRecognizer` sans liste officielle de langues,
  tester `checkRecognitionSupport("fr-FR")` sur l'A56 [V] ; ML Kit GenAI Speech (alpha, fr-FR en bêta, API 31+,
  08/10/2026) [V] ; repli **Vosk small-fr 0.22** (41 Mo, Apache-2.0, WER ≈ 19–27 %) [V] ; **Parakeet TDT 0.6B v3**
  (CC-BY-4.0, WER FR ≈ 5 %) [V] mais ≈ 1,2 Go en ONNX INT8 [T] ; Voxtral Mini 4B (Apache-2.0) trop gros ; Moonshine :
  anciens modèles non anglais sous licence non commerciale. Aucun banc whisper.cpp sur Exynos 1580 trouvé.
- **Littérature** : modèles **personnalisés > universels** pour l'humeur / dépression [V JMIR 2025 ; npj Digit Med
  2024] ; voix : débit plus lent et voix plus douce quand la dépression s'aggrave [T RADAR-CNS] ; visage en conditions
  réelles AUC 0,58–0,64 [V MoodCam]. Conforte : z-scores par personne, agrégat quotidien, tendance 7 j.

### Ce que veulent les gens (signaux du jour)

- **« Les coachs IA inventent »** : Google Health 5.0 (ex-Fitbit, 19/05/2026) voit de la natation dans une marche, IA
  affichée avant les chiffres → promesse d'une IA « plus concise, qui demande l'intention » [T 9to5Google 27/05/2026] ;
  WHOOP Coach a enregistré caféine ou alcool jamais pris, supposé une maladie à tort [V Gear Patrol 06/07/2026] ;
  Garmin « platitudes » [T the5krunner 20/04/2026]. Pew : 18 % jugent les chatbots santé très exacts [T 04/2026].
- **Scores composites non validés** : aucune preuve que suivre un « readiness » améliore quoi que ce soit ; seule la
  tendance personnelle sur plusieurs jours est utile [V gadgetsandwearables 21/09/2026].
- **Consolidation chez WHOOP** (05/09/2026) [V] : Journal, Daily Outlook, check-ins et Day in Review fusionnés en **un
  seul parcours quotidien** terminé par une réflexion du soir ; comportements personnalisés et saisie à la voix / texte
  libre. Apple watchOS 27 (14/09/2026) : Readiness 0–10, résumés IA, import de labo [V]. Oura : signaux de tension
  nocturne sur 30 j, **alerte seulement sur un motif durable** [T 06/2026].
- **Apps de corrélation personnelle** : Exist affiche **force** et **confiance** séparées, minimum 3 semaines, teste
  aussi le lendemain [V kb.exist.io] ; Bearable : ≥ 3 jours avec / 3 sans, ordre horaire respecté [T]. **Aucune ne
  corrige les comparaisons multiples** ni l'autocorrélation — HealthTrack le fait déjà (Benjamini-Hochberg,
  `effectiveSampleSize`, décalages J / J+1 corrigés ensemble) : c'est un vrai point fort, à rendre lisible.

### Idées classées (impact × faisabilité) — aucune n'ajoute d'écran

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I69 | **Synchro qui dit où elle cale** : par service (7/0x0A, 7/0x0C, 0x17, 0x2C, stress), le journal note « réponse / vide / délai dépassé / non pris en charge » ; séances lues selon la longueur annoncée de chaque bloc (un bloc vide n'annule plus la séance, #5784) ; si 0x2C expire alors que la montre le déclare, le dire (piste canal auxiliaire, #6448) ; « Jamais reçu : stress » → « à activer et calibrer sur la montre » | Que le prochain journal suffise si l'historique reste vide (D3) | 5 | 5 | **25** |
| I70 | **Force et confiance, séparées et honnêtes** (fusionne avec I64) : chaque lien des Analyses montre sa force (taille d'effet) et sa confiance (déjà corrigée pour les tests multiples et l'autocorrélation), « jours avec / sans » (≥ 5 chacun), et la mention « lien observé, pas une cause » ; une phrase d'aide dit que l'app corrige les faux positifs | Croire ce que disent les Analyses, sans jargon (D5, D6) | 4 | 5 | 20 |
| I71 | **Un seul parcours par jour** (précise I51 / I54) : matin = état de la nuit vs votre plage + une piste ; soir = **une** question (celle qui tranche le lien le plus incertain) + réflexion libre facultative ; remplace check-in séparé, briefing et question du soir. Chiffres d'abord, texte ensuite, jamais un chiffre inventé | Moins de saisie, moins d'écrans (D1) | 5 | 3 | 15 |
| I72 | **Arrière-plan par présence de la montre** (précise I49) : association compagnon, `onDevicePresenceEvent` (API 36) / `onDeviceAppeared` (API 33–35), à `BT_CONNECTED` un service `connectedDevice` court (< 1 min) relit la montre ; permission `REQUEST_COMPANION_START_FOREGROUND_SERVICES_FROM_BACKGROUND` ; jamais de boucle de reconnexion | Données à jour sans ouvrir l'app (D3 d quater) | 5 | 3 | 15 |
| I73 | **Visage sans poids AffectNet** (précise I53) : MediaPipe blendshapes + règles maison, z-score par personne, agrégat quotidien ; service lancé depuis l'app ou d'un tap sur sa notification (Android 14+), le diagnostic teste quand même `appops` | Humeur par le visage, distribuable légalement (D4) | 4 | 4 | 16 |
| I74 | **Phrase du soir à la voix, toujours confirmée** (précise I66 / I67) : transcription sur le téléphone (`checkRecognitionSupport("fr-FR")`, repli Vosk small-fr) → tags **proposés**, jamais enregistrés sans un tap (leçon WHOOP / Google) ; le texte n'entre pas dans l'estimateur d'humeur s'il sert de X (liste D5) | Noter son contexte en 5 secondes | 4 | 3 | 12 |

**Écartée** : *afficher Huawei Santé et HealthTrack connectés en même temps* — impossible côté montre (#6010). L'alternance
par retrait du Bluetooth via Shizuku (#7025) reste une note pour le plan B, pas un chantier.
**Mise à jour** : I52 (mode calme) absorbe « alerte seulement sur un motif durable » (Oura, 30 j) ; I59 (labo) conforté
par Apple / WHOOP / Oura (import PDF), toujours sur le téléphone.

### Détail et pistes d'implémentation

**I69 — Synchro lisible.** `devices/huawei/sync.js` (ou équivalent) : `report.sync.services[]` = `{ service, command,
outcome: 'ok' | 'empty' | 'timeout' | 'unsupported' | 'error', count }`, sans valeur ; tests fausse montre : un scénario
par issue, une séance avec un bloc interne vide (longueur 0) qui doit être gardée. Aucune trame nouvelle : on ne fait
que nommer ce qui se passe déjà. Le canal auxiliaire n'est **pas** codé à l'aveugle : seulement si le journal montre
0x2C en délai dépassé (spec à écrire alors, §7.10).

**I70 — Force / confiance.** `services/statistics.js` a déjà q-valeurs et n effectif : exposer `effect` (d de Cohen ou
écart en unités de Y) et `confidence` (palier depuis q et n effectif) séparément dans le résultat ; l'UI des
Analyses change ses mots, pas sa structure. Test : séries synthétiques nulles → « solide » < 5 % des cas.

**I71 — Parcours unique.** Pas de nouvelle page : la carte du matin de l'Accueil et la notification du soir partagent un
même objet « journée » ; le formulaire bien-être devient la réponse du soir (une question + champs facultatifs repliés).

**I72 — Arrière-plan.** Plugin natif `CompanionPlugin.java` (association par `AssociationRequest` filtré sur le nom de
la montre appairée), `HuaweiPresenceService extends CompanionDeviceService` ; le client de synchro réécrit en Java
d'après `protocoles/huawei.md` (déjà prévu par I49) ; écriture dans un tampon lu par la WebView à l'ouverture si
IndexedDB n'est pas joignable app fermée.

**I73 / I74** : voir I53 / I67 ; entrées déclarées dans la liste de l'estimateur (D5).

### Sources (consultées le 14/10/2026)

- Montre : https://codeberg.org/Freeyourgadget/Gadgetbridge/issues/6271 · /issues/6731 · /issues/6978 · /issues/6370 ·
  /issues/6010 · /issues/6341 · /issues/5784 · /issues/6461 · /issues/5429 · /issues/7025 ; PR /pulls/6448 (lue via
  l'API : « second RFCOMM channel … Watch 3, 4, 5 », 20/07/2026), /6539, /6367, /6823, /6701, /6816, /5585, /5176 ;
  https://gadgetbridge.org/basics/pairing/huawei-honor-pairing/ ; https://gadgetbridge.org/basics/topics/huawei-honor/
- Android : https://developer.android.com/reference/android/companion/CompanionDeviceService ;
  https://developer.android.com/reference/android/companion/DevicePresenceEvent ;
  https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start ;
  https://developer.android.com/develop/background-work/services/fgs/changes ; https://dontkillmyapp.com/samsung ;
  https://developer.android.com/reference/android/speech/SpeechRecognizer ;
  https://developers.google.com/ml-kit/genai/speech-recognition/android
- ML : https://github.com/sb-ai-lab/EmotiEffLib ; https://github.com/av-savchenko/face-emotion-recognition ;
  https://studylib.net/doc/27680111/affectnet-agreement-v2-30mar2023 ; https://github.com/microsoft/FERPlus ;
  https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker ; https://alphacephei.com/vosk/models ;
  https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3 ; https://huggingface.co/kyutai/stt-1b-en_fr ;
  https://huggingface.co/mistralai/Voxtral-Mini-4B-Realtime-2602 ; https://github.com/moonshine-ai/moonshine ;
  https://www.jmir.org/2025/1/e57418 ; https://www.nature.com/articles/s41746-024-01035-6 ; https://arxiv.org/abs/2412.12625 ;
  https://www.isca-archive.org/interspeech_2025/hidalgojulia25_interspeech.html
- Besoins / marché : https://9to5google.com/2026/05/27/google-health-roadmap-fitbit-backlash/ ;
  https://www.gearpatrol.com/fitness/whoop-ai-reddit-user-feedback-pros-cons/ ;
  https://the5krunner.com/2026/04/20/garmin-connect-plus-review/ ;
  https://gadgetsandwearables.com/2026/09/21/wearable-readiness-scores-science/ ;
  https://gadgetsandwearables.com/2026/09/05/whoop-custom-journal-workout-tracking-update/ ;
  https://apple.com/newsroom/2026/09/apple-advances-health-and-fitness-capabilities-using-apple-intelligence/ ;
  https://medtechdive.com/news/oura-to-add-blood-pressure-feature-following-fda-policy-change/821427/ ;
  https://kb.exist.io/article/37-what-are-correlations ; https://kb.exist.io/article/18-how-long-does-it-take-to-find-correlations ;
  https://bearable.app/support/tips/what-are-factors/ ; https://gadgetbridge.org/blog/category/releases/
- Inaccessibles : reddit.com (bloqué, passé par la presse qui en rend compte), LinkedIn (rien d'exploitable), Codeberg
  en lecture web (429, API REST OK), whdeng.cn (RAF-DB, 503), PyPI emotiefflib, page « correlations » d'exist.io (404).

### À creuser au prochain run idées (15/10 08:30)

- Le journal v125+ du propriétaire s'il arrive : `sync.kinds`, minutes reçues, sommeil, et 0x2C répondu ou expiré.
- `checkRecognitionSupport("fr-FR")` et ML Kit GenAI Speech sur One UI 8 (rapports d'utilisateurs).
- Licence exacte des modèles MediaPipe Face Landmarker (model card).

---

## Run du 14/10/2026 08:30 (Paris) — la montre recoupée de bout en bout, des preuves plus tôt, zéro saisie de contexte

Question du jour, côté utilisateur : *« ma montre va bientôt parler à HealthTrack — que faut-il pour que la suite de
l'appairage passe du premier coup, et comment l'app peut-elle me dire plus tôt, sans se tromper, ce qui marche chez
moi, sans me demander de noter mon contexte ? »* Pas de nouveau journal de la GT 6 Pro depuis le correctif v120 : la
recherche montre a donc porté sur **les étapes d'après** (0x8002 → authentification → trames chiffrées), pour qu'aucun
aller-retour ne soit perdu.

### Montre — recoupement complet de l'appairage avec Gadgetbridge (détail : `protocoles/huawei.md` §6.11)

Lecture seule de Gadgetbridge master `bb7a1e83a2` (13/10/2026), faits seulement, aucun code copié. La logique ISO
(`GetHiChainRequest.java`) n'a pas bougé depuis 09/2024 [V].
- **Chaque calcul de HealthTrack correspond** [V] : PIN (1/0x2C) déchiffré en GCM **seulement** si la méthode de
  chiffrement vaut 1, sinon CBC (le type d'appareil 4 n'entre **pas** en jeu pour le PIN, contrairement aux trames) ;
  PIN traité comme des octets opaques, **ré-encodé en hex majuscule même s'il ressemble déjà à du texte** (notre
  référence) ; identifiant du téléphone = 32 caractères hex majuscules, octets ASCII dans les HMAC ; identifiant de la
  montre = son `peerAuthId` décodé de l'hex ; ordres des deux jetons, `returnCodeMac`, clé de session, AAD = le défi
  pour `encAuthToken`, AAD fixes des étapes 3 et 4, clé des trames « hichain_return_key », trames en GCM avec un IV
  aléatoire de 16 octets dès que le type vaut 4. → Le PIN de **64 octets** du journal est donc normal pour ce modèle.
- **Aucun cas particulier pour la GT 6 / GT 6 Pro / GT 7** dans Gadgetbridge (coordinateurs « Bluetooth classique »
  simples) ; le protocole SPEKE n'est activé que pour les Honor Watch 5 / 5 Pro / 6 (PR #6472, 17/07/2026) [V].
- **Retours d'utilisateurs** [V issues Codeberg] : #6731 (09/2026) une GT 7 s'appaire en choisissant le type « GT 6
  (Pro) » **et en saisissant l'identifiant de compte Huawei** ; #6978 (07/10/2026) GT 7 sous HarmonyOS 7 : « Authentication
  key negotiation failed » avec la clé gardée → **refaire la liaison** a suffi (une autre app avait remplacé la clé) ;
  PR #6367 (ouverte) : la montre refuse parfois une clé valide ou se fige → fermer le canal, attendre, réessayer, sans
  reconnexions agressives.
- **Arrière-plan** : PR #6905 (02/10/2026, signalements GT 6) relance la connexion après que le système a tué l'app ;
  PR #6823 (23/09/2026) l'appairage « appareil compagnon » gère les montres classiques déjà appairées [V]. → Conforte
  le plan I49 (CDM + filet).
- **Gadgetbridge 0.94 (17/09) ajoute la GT 7, 0.95 (12/10) 15 appareils** ; les cadrans ne s'installent plus sous
  HarmonyOS 6.1+ [V gadgetbridge.org]. Aucun firmware GT 6 Pro daté sept.–oct. trouvé (GT 6 globale : 6.1.0.118 en
  07/2026) [T HuaweiCentral].

### Ce que font les leaders (sept.–oct. 2026)

- **Google Health (12/10)** : détection automatique de **100+ types d'activité** (séance ≥ 15 min à FC élevée
  enregistrée en < 30 min, « moitié moins de séances manquées »), rapport mensuel « Health Guardian » [V blog.google].
- **WHOOP Journal (18/09)** : on dit à l'app quel **comportement** suivre (routine du soir, complément) et elle en mesure
  l'effet sur la récupération — de la science personnelle grand public ; chaque activité affiche sa **provenance**
  (auto-détectée / importée) [T].
- **Huawei GT 7 (IFA, 02/09)** : briefing du matin + « Physical Readiness » [V AndroidHeadlines].
- **Samsung « Fitness Index »** compare aux pairs — exactement ce que D6 écarte ; « Vitals » (écarts à soi) reste le bon
  modèle [T].
- **Fitbit → Google Health forcé (10/2026)** : colère des fidèles (« aucune des fonctions que j'aimais n'est restée ») [T
  TechRadar] → argument pour l'archive locale que HealthTrack constitue.
- **Lassitude** : > 1 Américain sur 3 a cessé de suivre une métrique parce qu'elle le faisait se sentir plus mal
  (enquête commanditée, biais possible) [T KVIA 27/08] ; ≈ 1/3 des suiveurs de sommeil à risque d'orthosomnie [T].

### Science personnelle (D5 / D6)

- **Paliers de confiance bayésiens** : arXiv 2601.03299 (01/2026) — des signaux de **direction** fiables en ≈ 5 jours au
  lieu de 32 avec un seuil fixe, ≈ 6 % de fausses découvertes à J30, sur données synthétiques [V].
- **Modèles individuels > modèles universels** pour l'humeur (prédiction jusqu'à 3 semaines, validation « une personne
  laissée de côté » défavorable aux modèles communs) [T PMC10902386, Appl. Sci. 2026] → conforte D6.
- **Interventions déclenchées par capteurs** : effets proximaux faibles dans un essai micro-randomisé 2026 [T] → pas
  d'alertes « faites ceci maintenant ».

### Humeur, voix, analyses (D4)

- **Visage** : MoodCam (arXiv 2412.12625, 25 personnes × 4 semaines, ≈ 16 000 interactions) → AUC **0,58–0,64** pour la
  valence [V]. Signal faible : confirme « tendance sur 7 jours, jamais une note à l'instant ». Licence : code HSEmotion
  Apache-2.0, poids sans licence séparée, AffectNet sur accord (texte non lisible publiquement) [V/H] → **défaut
  MediaPipe** (blendshapes sourire / froncement, Apache-2.0), HSEmotion seulement en téléchargement facultatif.
- **Voix** : les modèles d'émotion vocale sont NC (audEERING CC-BY-NC-SA) ou flous (emotion2vec), openSMILE payant en
  commercial [V/T] → **prosodie maison** (F0, énergie, débit, pauses) : quelques Ko, aucune licence.
- **Transcription fr-FR** : API système sur l'appareil (`isOnDeviceRecognitionAvailable`, `checkRecognitionSupport`)
  **non confirmée sur Samsung** (pas d'API publique du moteur Samsung) [V/T] ; repli **Vosk small-fr** (41 Mo,
  Apache-2.0, WER ≈ 19–24 %) [V] ; Parakeet v3 (WER fr ≈ 5 %, CC-BY-4.0) mais ≈ 890 Mo → téléchargement facultatif.
- **Bilan sanguin** : ML Kit Text Recognition v2 hors ligne [V] ; aucun analyseur libre français trouvé ; la France
  impose LOINC pour la biologie structurée (Ségur) et une traduction LOINC fr-FR existe [V] → dictionnaire maison
  d'≈ 40 analytes (alias → LOINC → unité → conversions) ; **PDF texte avant OCR**.
- **Réseaux sociaux** : sur Android 15+, le blocage « paramètres restreints » des APK installés hors magasin couvre aussi
  l'**accès aux données d'utilisation** [T Android Authority] → le guide « Temps d'écran » doit l'expliquer ; le
  « contenu vu » exigerait l'Accessibilité (fragile, intrusif) → écarté.

### Idées classées (impact × faisabilité) — consolider plutôt qu'ajouter

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I63 | **Suite d'appairage « sans aller-retour »** : rendre lisibles d'avance dans le journal les étapes 0x8002 → 0x8004 et 0x11 → 0x13 (`returnCodeMac` faux ≠ défi refusé ≠ clé non déchiffrée), consigner `trailingBytes` à chaque réponse, et si la montre coupe juste après l'authentification, le dire et proposer l'identifiant de compte Huawei (cas #6731) | Que la GT 6 Pro aille au bout dès le prochain essai (D3) | 5 | 5 | **25** |
| I64 | **Paliers de confiance bayésiens** à la place des p-valeurs dans les Analyses : « piste / probable / solide » par lien, a priori faible tiré de la littérature (D6), contraction du postérieur, contrôle des faux positifs sur l'ensemble des liens (D5) ; mêmes cartes, mots changés | Savoir plus tôt, sans se tromper, ce qui joue chez moi | 5 | 4 | 20 |
| I65 | **Contexte détecté tout seul** : « Voyage » (changement de fuseau du téléphone), « Sport le soir » (FC ≥ 60 % de la réserve ≥ 15 min après 18 h, ou séance de la montre), « Sieste » (sommeil de jour de la montre) → tags pré-cochés, retirables d'un tap, provenance affichée | Zéro saisie de contexte (D1) | 4 | 5 | 20 |
| I66 | **Comportements suivis en une phrase** (précise I60, à la WHOOP Journal) : « je teste le magnésium le soir » → tag récurrent + proposition d'un plan ABAB, analysé avec I64 | Expériences personnelles sans formulaire | 4 | 3 | 12 |
| I67 | **Voix sans modèle sous licence** : prosodie maison (F0 par autocorrélation, énergie RMS, débit via la transcription, part de pauses), suivie en écart à sa propre base ; transcription système → repli Vosk small-fr | Humeur par la voix, légale et légère (D4) | 4 | 3 | 12 |
| I68 | **Archive « sources jetables »** : la montre ou l'app d'origine peuvent changer (Fitbit → Google Health), HealthTrack garde tout ; export FIT / CSV par type en plus du JSON | Ne plus perdre son historique | 3 | 4 | 12 |

**Idée écartée (D5)** : *suggérer « alcool / caféine hier ? » à partir d'une FC de nuit haute et d'une VFC basse*.
Le tag serait alors en partie déduit des signaux qu'on veut ensuite expliquer par lui : la corrélation « alcool → VFC
basse » serait gonflée (biais de sélection). Si un jour on le fait, ces tags suggérés seront marqués et **exclus** des
corrélations avec les signaux qui les ont déclenchés.

Mises à jour : **I52** (mode calme) conforté par les chiffres de lassitude et d'orthosomnie ; **I53** défaut MediaPipe
confirmé (AUC visage ≈ 0,6) ; **I59** → PDF texte d'abord, dictionnaire LOINC fr ; **I49** conforté par GB #6905 /
#6823 ; **I60** absorbe I66.

### Détail et pistes d'implémentation

**I63 — Suite d'appairage.** `hichain.js` : chaque étape lève une erreur typée (`return_mac_mismatch`,
`auth_token_decrypt_failed`, `final_error` avec `errorCode`) écrite telle quelle dans `report.hichain.steps[]` (codes,
tailles, `trailingBytes`, jamais de valeur) ; fausse montre : un scénario par erreur. Après l'authentification, si la
première trame chiffrée (infos produit / batterie) n'a pas de réponse ou si la montre coupe en < 5 s : issue
« account_required? » qui propose le plan B (champ déjà présent, envoyé en 0x1A/0x05). Clé refusée : fermer, attendre
≈ 6 s, une seule nouvelle tentative, puis proposer la liaison (déjà en place, à vérifier contre #6978).

**I64 — Paliers.** `src/services/` : pour chaque paire (X, Y), modèle normal conjugué sur la différence standardisée
(jours X haut vs bas, X la veille de Y), a priori N(0, τ²) faible (ou centré sur l'effet publié si une hypothèse
générale existe, toujours affiché comme tel) ; palier = P(effet > 0) et largeur de l'intervalle ; seuil ajusté au
nombre de liens testés (Benjamini-Hochberg sur les probabilités a posteriori converties, ou « local FDR »). Calcul dans
le Worker existant. Tests : séries synthétiques (effet nul → jamais « solide » sur 500 tirages > 5 %).

**I65 — Contexte auto.** Fuseau : `Intl.DateTimeFormat().resolvedOptions().timeZone` noté chaque jour à l'ouverture
(aucune permission) ; un changement → « Voyage » ce jour-là et les 2 suivants. Sport du soir : séances montre / Health
Connect déjà importées, sinon FC minute. Provenance (`source: "auto"`) dans l'entrée ; un tap retire.

**I67 — Prosodie.** Plugin natif `AudioRecord` du service micro (D4) ; trames de 30 ms : RMS, F0 (autocorrélation
50–400 Hz), voisement ; agrégats par prise (moyenne, écart-type, part de pauses) ; débit = mots / s de la
transcription ; seuls les nombres sont gardés. Entrées déclarées de l'estimateur (liste D5).

**I68 — Archive.** Export par type (FIT pour les séances, CSV pour les séries) depuis l'écran d'export existant ; pas de
nouvel écran.

### Sources (consultées le 14/10/2026)

- Montre : https://codeberg.org/Freeyourgadget/Gadgetbridge (lecture seule, master `bb7a1e83a2` : `devices/huawei/HuaweiCrypto.java`,
  `devices/huawei/packets/DeviceConfig.java`, `service/devices/huawei/requests/GetHiChainRequest.java`,
  `service/devices/huawei/HuaweiSupportProvider.java`, coordinateurs GT 6 / GT 7) ; issues #6731, #6978, #4193 ;
  PR #6367, #6472, #6823, #6905 ; https://gadgetbridge.org/blog/release-0_94_00/ ; https://gadgetbridge.org/basics/topics/huawei-honor/ ;
  https://www.huaweicentral.com/standard-huawei-watch-gt-6-global-users-receive-harmonyos-6-1/
- Leaders : https://blog.google/products-and-platforms/products/google-health/fitbit-google-health-updates/ ;
  https://www.whoop.com/us/en/thelocker/2026-whats-new/ ; https://www.androidheadlines.com/2026/09/huawei-watch-gt-7-watch-6-series-arrive.html ;
  https://9to5google.com/2026/06/04/samsung-health-ai-redesign-galaxy-watch-9/ ; https://techradar.com/health-fitness/fitness-apps/i-hate-the-new-google-health-app-fitbit-fans-bemoan-the-end-of-an-era-as-last-holdouts-are-forced-to-switch-to-googles-alternative ;
  https://kvia.com/stacker-wellness/2026/08/27/survey-how-health-tracking-is-affecting-americans-sleep-and-mental-health/ ;
  https://academic.oup.com/sleep/article/49/Supplement_1/A246/8674102
- Science perso : https://arxiv.org/abs/2601.03299 ; https://arxiv.org/abs/2606.13556 ; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10902386/
- Humeur / voix / analyses : https://arxiv.org/abs/2412.12625 ; https://github.com/av-savchenko/face-emotion-recognition ;
  https://ai.google.dev/mediapipe/solutions/vision/face_landmarker ; https://zenodo.org/records/6221127 ;
  https://alphacephei.com/vosk/models ; https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3 ;
  https://developer.android.com/reference/android/speech/SpeechRecognizer ;
  https://developers.google.com/ml-kit/tips/installation-paths ; https://www.health-data-hub.fr/sites/default/files/2025-01/loinc%20%281%29.pdf ;
  https://androidauthority.com/android-15-restricted-settings-sideloading-3481098
- Inaccessibles : Reddit (direct et via extraits), page WHOOP (lue par extrait de recherche), corps de l'article TechRadar.

### À creuser au prochain run idées (14/10 20:30)

- Le journal v120+ du propriétaire s'il arrive : jeton accepté ? étape atteinte ?
- Texte de la licence AffectNet (formulaire d'accès) ; benchmarks Whisper / Vosk fr sur Exynos 1580.
- Mises en page réelles de comptes rendus Biogroup / Cerballiance (exemples publics anonymisés).
- Huawei : le « compte Huawei » est-il exigé par une montre jamais liée (GT 6 Pro) après l'authentification ?

---

## Run du 13/10/2026 20:30 (Paris) — la montre débloquée par un octet, puis consolider la journée

Question du jour, côté utilisateur : *« ma montre répond enfin à HealthTrack — qu'est-ce qui manque pour que ça marche
pour de bon, et qu'est-ce qui me donnerait, chaque matin, une lecture de mon état aussi utile que les "Vitals" de
Samsung ou le "Health Radar" d'Oura, sans ajouter d'écran ? »* Une grosse part sur la montre (journal du propriétaire de
17:03, priorité absolue), puis ce que font les leaders cet été / automne, puis conversations et humeur (D4).

### Montre — ce que tranche le journal de 17:03 (détail : `protocoles/huawei.md` §6.9)

- **La GT 6 Pro parle l'ISO classique pour la liaison, pas le « New Auth » (SPEKE)** : réponse `message` 0x8001 avec
  `isoSalt` (16 o), `peerAuthId` (64 o), `token` (32 o) — exactement ce que `runHichain` sait vérifier. L'hypothèse
  SPEKE des runs 11:04 → 18:30 est **réfutée** pour cette montre [V journal].
- **Cause de l'échec : 1 octet en trop après le JSON** (JSON reconstitué à ces tailles = 804 car., étiquette = 805).
  `JSON.parse` refuse tout caractère après l'objet ; **Gadgetbridge** lit l'étiquette en UTF-8 sans rien retirer
  (`getString` = `new String(bytes, UTF_8)`) puis `new JSONObject(...)`, et le `org.json` d'Android ignore ce qui suit
  l'objet → même trame, aucun problème chez eux [V code GB `HuaweiTLV.java`, `DeviceConfig.java`, lecture seule].
- **Calcul du jeton cohérent avec le nôtre** [V GB `GetHiChainRequest.java`, lecture seule] : PSK = HMAC(SHA-256(hex
  du PIN), graine 32 o) ; jeton de la montre = HMAC(PSK, aléa montre ‖ aléa téléphone ‖ id téléphone ‖ id montre) ;
  jeton du téléphone dans l'autre ordre (aléa tél. ‖ aléa montre ‖ id montre ‖ id tél.) — identique à `watchToken` /
  `phoneToken`. Seul point à surveiller : la casse de l'hexadécimal du PIN (majuscules chez nous) et le format exact de
  notre identifiant → si `token_mismatch` survient, c'est là qu'il faudra regarder (test des deux casses en diagnostic).
- **Lien Bluetooth permanent ?** Pas de réponse publique : fiches commerçants « BT 6.0, BLE / BR/EDR » [T] ; les appels
  Bluetooth exigent Huawei Santé [T Huawei]. → À lire dans un futur journal (événements de connexion CDM), pas à deviner.

### Ce que font les leaders (signaux de l'été / automne 2026)

1. **Samsung Health « Vitals »** (été 2026) : chaque matin, revue des signaux de la nuit **comparés à la ligne de base
   personnelle**, + « Fitness Index », charge cardio, et suivi du **bruit ambiant** (santé auditive) [T Digital Trends,
   Wareable, Samsung Newsroom — pages 403 en direct, résumés de recherche].
2. **Oura Ring 5** (05/2026) : « Health Radar » (tendances de **tension pendant le sommeil**, respiration nocturne),
   **GLP-1 Insights** (doses, effets, poids, données de la bague au même endroit), **import de résultats d'analyses**
   à côté des données de la bague [T CNBC 28/05, Athletech 26/06].
3. **Whoop** : Advanced Labs (bilans sanguins), dossiers médicaux reliés, Blood Pressure Insights recadré par la FDA
   (06/2026 : affichage **sans classes** « normal / élevé ») [T Athletech 26/06]. → Rappel utile pour nous : montrer des
   tendances personnelles, pas des catégories cliniques.
4. **Apple Watch Series 12 / Ultra 4** (10/2026) : jugées encore derrière Oura / Whoop sur le suivi santé [T Bloomberg
   08/10].

Lecture pour HealthTrack : tout le monde converge vers **une lecture du matin relative à soi** + **biomarqueurs
importés** (analyses) + **traitements suivis avec leurs effets**. Nous avons déjà le moteur « écarts à vos habitudes » :
il manque le **regroupement** (I51) et deux sources (analyses, traitements), pas des écrans.

### Conversations et humeur (D4)

- **Omi** est **entièrement open source (MIT, firmware compris)** et documente son protocole BLE : service audio
  `19B10000-E8F2-537E-4F6C-D104768A1214`, flux `…0001`, codec `…0002` (20 = Opus 16 kHz mono, trames 10 ms ; 21 =
  Opus 20 ms sur le CV1), en-tête de 3 octets par notification [V docs.omi.me ; T SDK communautaire]. → Un **pilote
  Omi direct** dans notre registre BLE générique est faisable **sans leur cloud** ; pas besoin d'API d'export.
- **Transcription sur l'appareil** : `SpeechRecognizer.createOnDeviceSpeechRecognizer` (API 31+),
  `checkRecognitionSupport` / `triggerModelDownload` pour le pack de langue ; lever d'exception si aucun reconnaisseur
  local → garde `isOnDeviceRecognitionAvailable` [V doc Android]. Français local sur l'A56 : ❓ à vérifier sur
  l'appareil (écran de diagnostic).
- **Bruit ambiant au micro** : les sonomètres de téléphone ne respectent aucune norme ; Android mesure au mieux entre
  **40 et 80 dB(A)** [V Arbetsmiljöverket]. → niveau relatif (calme / animé), jamais une alerte auditive « médicale ».
- **Poids HSEmotion valence / éveil (`enet_b0_8_va_mtl`)** : le code est Apache-2.0, **aucune licence n'est indiquée
  pour les poids** [V dépôt] ; ils sont appris sur AffectNet, dont la licence est réservée à la recherche non
  commerciale [H, à confirmer]. → HealthTrack est gratuit et personnel, mais par prudence : **blendshapes MediaPipe
  (sourire) par défaut**, modèle de valence en option téléchargée par l'utilisateur, licence affichée.
- MediaPipe dans une WebView Samsung (Xclipse) : **aucune mesure publiée** trouvée → la mesure sur l'A56 (écran de
  diagnostic I53) reste la seule source fiable.

*Reddit toujours inaccessible directement ; la recherche générique « quantified self 2026 » ne renvoie que des
annuaires. LinkedIn non exploité. Pages Samsung / Wareable / eMarketer en 403 : passé par les résumés de recherche.*

### Idées classées (impact × faisabilité) — consolider plutôt qu'ajouter

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I57 | **Lecture HiChain tolérante + diagnostic du jeton** : JSON suivi d'octets de fin accepté (comme `org.json`), `trailingBytes` au journal ; si le jeton diffère, le journal dit lequel des calculs (casse du PIN, ordre des identifiants) aurait correspondu — sans jamais écrire de valeur | Que la GT 6 Pro s'appaire enfin (D3) | 5 | 5 | **25** |
| I58 | **« Ma nuit en un coup d'œil » dans le briefing** (précise I51, à la Samsung Vitals) : FC repos, VFC, SpO₂, respiration, durée / régularité du sommeil, chacun en **flèche par rapport à votre plage habituelle** (médiane ± MAD 28 j), une phrase si ≥ 2 signaux sortent de la plage ; aucune classe clinique | Une lecture du matin relative à soi (D1, D6) | 5 | 4 | 20 |
| I59 | **Import de résultats d'analyses** : photo ou PDF → ML Kit Text Recognition **sur l'appareil** → biomarqueurs (ferritine, vitamine D, HbA1c, LDL…) reconnus par gabarits, l'utilisateur confirme en 1 écran ; repli Gemini (sa clé) seulement s'il le choisit ; courbes dans « Vos données » | Biomarqueurs à côté des données de la montre (Oura / Whoop) | 4 | 3 | 12 |
| I60 | **Traitements et compléments = expériences** : prise en 1 tap (ou rappel actionnable), puis « avant / après » personnel sur sommeil, FC repos, humeur avec les garde-fous D5 (ordre temporel, ≥ 14 j de chaque côté) ; jamais de conseil médical | Savoir si un traitement change quelque chose chez moi | 4 | 4 | 16 |
| I61 | **Pilote Omi direct** (registre BLE générique) : flux Opus 16 kHz → décodage → transcription locale (`createOnDeviceSpeechRecognizer` fr-FR) → résumé / tags dans le journal ; audio jamais conservé ; rappel sur l'accord des personnes enregistrées | Conversations dans le journal, sans cloud | 3 | 3 | 9 |
| I62 | **Niveau sonore ambiant** (réutilise le service micro de D4, quelques secondes par heure) : minutes « calme / animé / bruyant » comme **X** des Analyses (jamais entrée de l'estimateur d'humeur, consigné dans la liste D5) | Le bruit pèse-t-il sur mon sommeil / humeur ? | 3 | 4 | 12 |

Mises à jour d'idées existantes : **I20 / D3 (c ter)** → **en attente** (la GT 6 Pro n'utilise pas SPEKE ; garder pour
Honor) ; **I51** → absorbe I58 (pas de nouvelle carte) ; **I53** → défaut = blendshapes MediaPipe, valence en option
(licence des poids) ; **I41 / I55** → la transcription locale d'I61 sert aussi la dictée du soir.

### Détail et pistes d'implémentation

**I57 — HiChain tolérant.** Voir §6.9 et « Prochaines étapes » n°1 du backlog. En plus : si `token_mismatch`, calculer
en local 2–3 variantes (PIN hex minuscule / majuscule ; identifiants inversés) et consigner **seulement le nom** de la
variante qui correspond (`tokenVariant: "pin_lower"`), jamais les octets — un seul journal suffit alors à corriger.

**I58 — Ma nuit.** `src/services/` : fonction pure `nightSignals(entries, date)` → { signal, valeur, plage, sens } en
réutilisant les écarts robustes déjà calculés pour « Votre cœur vs votre norme » ; rendu dans la carte du briefing
(I51) ; tests sur séries d'exemple (plage < 14 nuits → « pas encore de plage habituelle »).

**I59 — Analyses.** Plugin natif ML Kit Text Recognition v2 (latin, sur l'appareil, ~4 Mo) ; dictionnaire FR / EN des
biomarqueurs courants avec unités et conversions (mmol/L ↔ mg/dL) ; type d'entrée `lab_result` { analyte, valeur,
unité, plage du labo, date } ; la plage **du labo** affichée telle quelle, pas d'interprétation ; export / import JSON.

**I60 — Traitements.** Type `intake` { nom, dose, heure } ; action de notification « Pris » ; analyse = comparaison
avant / après avec intervalle bootstrap, ou ABAB (I45) si l'utilisateur veut tester ; texte « va de pair avec », pas
« fait ».

**I61 — Omi.** `devices/omi/` : empreinte = service `19B10000-…` ; lecture du codec, abonnement au flux, retrait de
l'en-tête 3 o, décodage Opus (libopus WASM ou `MediaCodec` natif) → PCM 16 kHz → reconnaisseur local ; seul le texte
et un résumé sont stockés.

**I62 — Bruit.** `AudioRecord` dans le service de premier plan micro (D4) : RMS → dBFS relatif, calibration absente
assumée ; 3 classes par seuils personnels ; agrégat quotidien seulement.

### Sources (consultées le 13/10/2026)

- Montre : `journal/diagnostics/2026-10-13-1703-gt6pro.json` ; https://codeberg.org/Freeyourgadget/Gadgetbridge
  (lecture seule : `devices/huawei/HuaweiTLV.java`, `devices/huawei/packets/DeviceConfig.java`,
  `service/devices/huawei/requests/GetHiChainRequest.java`) ; https://consumer.huawei.com/ph/support/content/en-us16066730 ;
  https://www.nahdionline.com/en-sa/huawei-gt6-pro-46mm-atum-b29m-titanium-metal/pdp/103682622
- Leaders : https://www.bloomberg.com/news/articles/2026-10-08/apple-watch-series-12-ultra-4-new-features-aren-t-enough-to-beat-oura-whoop ;
  https://athletechnews.com/oura-whoop-push-deeper-into-healthcare/ ;
  https://www.cnbc.com/2026/05/28/oura-ring-smallest-wearable-health-fitness.html ;
  https://www.digitaltrends.com/wearables/samsung-healths-biggest-update-yet-will-turn-your-galaxy-watch-into-a-health-coach/ ;
  https://www.wareable.com/samsung/samsung-galaxy-watch-health-platform-update-vitals-fitness-index-cardio-load-new-features
- Conversations / humeur : https://docs.omi.me/doc/developer/Protocol ; https://github.com/BasedHardware/omi ;
  https://developer.android.com/reference/android/speech/SpeechRecognizer ;
  https://www.av.se/en/health-and-safety/noise/mata-ljud-och-buller/noise-exposure-app/ ;
  https://github.com/av-savchenko/face-emotion-recognition ; https://github.com/av-savchenko/hsemotion

### À creuser au prochain run idées (14/10 08:30)

- Selon le journal suivant du propriétaire : jeton accepté ou non (I57), puis réponses 0x8002 / 0x8003 (format de
  `encAuthToken`, présence du même octet de fin).
- Reconnaissance vocale **locale en français** sur Galaxy A56 (One UI 8) : `checkRecognitionSupport("fr-FR")`.
- Licence AffectNet / poids HSEmotion VA : texte exact.
- ML Kit Text Recognition sur des comptes rendus de laboratoire français (mise en page en tableau).
- Reddit via un autre chemin (archives, agrégateurs) pour r/Huawei et r/QuantifiedSelf.

---

## Run du 13/10/2026 08:30 (Paris) — montre app fermée, humeur réaliste, une seule réponse par jour

Question du jour, côté utilisateur : *« ma montre est maintenant lue par HealthTrack quand j'ouvre l'app ; comment
faire pour qu'elle le soit **sans que j'y pense**, sans vider ma batterie, et comment l'app peut-elle me donner **une
seule réponse claire par jour** au lieu de dix cartes ? »* Une bonne part sur la montre (priorité absolue), puis
visage / voix (D4) et la simplification (consigne : consolider plutôt qu'ajouter des écrans).

### Ce que veulent les gens (signaux du jour)

1. **Une réponse par jour, des tendances plutôt qu'une note par nuit** : l'« orthosomnie » (anxiété causée par le
   score de sommeil) est maintenant un sujet clinique ; les cliniciens conseillent de regarder des **tendances
   hebdomadaires** [T GMA 07/2025]. Oura agrège 31 jours en un « stress cumulé » de fond [T 11/2025] ; Samsung
   n'affiche des conseils d'Energy Score **que si le score est bas** [T Samsung 09/2025] ; Bevel plaît parce qu'il
   ramène tout à « es-tu prêt ? » [T 05/2026].
2. **Les « coachs IA » déçoivent quand ils inventent** : Whoop Coach — résumé du jour devenu quasi identique chaque
   jour, ignorant le contexte donné ; **caféine, alcool et dénivelé inventés**, maladie supposée à tort ; apprécié
   pour sa mémoire (suivi après une maladie) [V forum Whoop ; V Gear Patrol 06/07/2026]. Garmin Active Intelligence
   (abonnement Connect+) jugée « générique » [T TechRadar 2025]. → **Les chiffres viennent toujours du moteur, un
   texte au plus les reformule.**
3. **Bearable** exige ≥ 3 jours avec et 3 sans un facteur (30 j conseillés) et respecte l'ordre horaire (la caféine
   du soir n'explique pas le symptôme du matin) [V bearable.app] — même logique que D5 / I46.
4. **Sortir de Huawei Health** : Gadgetbridge et Huawei Health ne cohabitent pas (la clé est renouvelée à chaque
   réappairage par l'autre app, GT 6 sur Galaxy A34 One UI 8, issue GB #6010, 04/2026) [V] ; VFC souvent absente
   via Gadgetbridge (GT 5, #6461, 07/2026 ; Watch Fit 3, #6271) [V].

*Reddit toujours inaccessible directement (old.reddit bloqué, miroirs non indexés) : signaux pris via la presse et
les forums cités ; LinkedIn non exploité.*

### Faits clés (vérifiés aujourd'hui)

**Montre — synchro app fermée (D3 d quater)**
- **Companion Device Manager (CDM) et Bluetooth classique** [V doc Android, màj 01/10/2026] :
  `startObservingDevicePresence` prend en charge le **Bluetooth classique** — l'événement est la **connexion /
  déconnexion** de la montre (pas une détection de portée) ; l'app **n'a pas besoin de tourner** pour le recevoir.
  Android 16 : `ObservingDevicePresenceRequest.setAssociationId` + `CompanionDeviceService.onDevicePresenceEvent`
  (`EVENT_BT_CONNECTED`) ; le système lie alors le service, ce qui **remonte la priorité du processus**. Permission
  `REQUEST_OBSERVE_COMPANION_DEVICE_PRESENCE`.
- Une fois associée, l'app peut demander `REQUEST_COMPANION_RUN_IN_BACKGROUND` et
  `REQUEST_COMPANION_START_FOREGROUND_SERVICES_FROM_BACKGROUND` : le CDM est une **exemption officielle** à
  l'interdiction de démarrer un service de premier plan depuis l'arrière-plan [V].
- **Association d'une montre déjà appairée** : possible avec un filtre limité à son adresse et « appareil unique »,
  **une seule confirmation** de l'utilisateur (comportement observé chez Gadgetbridge, qui recommande d'ailleurs
  d'activer cette option contre les arrêts du service) [V doc GB].
- Service de premier plan type `connectedDevice` : `FOREGROUND_SERVICE_CONNECTED_DEVICE` + `BLUETOOTH_CONNECT`
  accordée (déjà demandée par HealthTrack) [V]. Le type `dataSync` est limité à **6 h / 24 h** depuis Android 15 [V].
- **`@capacitor/background-runner` est inutilisable** : JS exécuté dans QuickJS, **sans `crypto.subtle`** (donc ni
  AES-GCM, ni HKDF, ni HMAC) et sans Bluetooth ; ≥ 15 min entre deux exécutions [V README + code natif]. → Porter en
  **Java** le strict nécessaire de la synchro (trames, AES-GCM `javax.crypto` avec la clé déjà négociée, commandes
  7/0x0A-0x0D) ; l'appairage HiChain reste en JS au premier plan.
- **Leçons de reconnexion** (PR GB #6367, ouverte 07/2026) [V] : un socket RFCOMM resté ouvert bloque toute
  reconnexion ; la montre peut refuser une clé valide **pendant des heures** après une séparation nocturne ; selon un
  mainteneur, des reconnexions agressives hors de portée peuvent pousser la montre à **réinitialiser l'appairage**.
  → toujours fermer le socket, essais espacés et plafonnés (déjà le cas dans `watchAutoSync.js`), jamais de boucle.
- Gadgetbridge relit les montres au **déverrouillage du téléphone** (`USER_PRESENT`) avec un intervalle minimal
  réglable (#6775, 09/2026) [V] — même logique que notre synchro « à l'ouverture », étendue au déverrouillage.
- **GT 6 Pro chez Gadgetbridge** [V] : phases du sommeil (TruSleep) depuis 0.87.0 ; stress / VFC / SpO₂ / température
  « pas sur toutes les montres » ; plantage du parseur de **séances enregistrées automatiquement** sur GT 6 Pro
  (#5784, 02/2026, corrigé) → nos tests de séances devront couvrir ce cas ; la GT 6 Pro (firmware 6.0.0.188) demande
  **35 jours de calendrier** (#6356) — sans intérêt santé, à ignorer proprement.
- **One UI 8** [T] : pour qu'une app tourne en fond, il faut **à la fois** batterie « Sans restriction » **et** « Applis
  jamais en veille » ; « mettre en veille les applis inutilisées » coupe les tâches après ~3 jours sans usage [V
  dontkillmyapp]. ❓ La GT 6 Pro garde-t-elle un lien Bluetooth permanent (appels) ? Si oui, l'événement « connectée »
  ne viendra qu'aux reconnexions → filet WorkManager horaire indispensable.

**Humeur sur l'appareil (D4)**
- **WebGPU très probablement indisponible sur le Galaxy A56** : la liste de blocage Chromium n'autorise sur Android
  que les GPU ARM, Qualcomm, Intel (et Imagination sur Android 16) ; le GPU Xclipse (AMD, Samsung) n'y est pas [V
  source Chromium]. → LiteRT.js tournerait en WASM CPU. **MediaPipe Tasks (web)** passe par **WebGL2**, pas WebGPU :
  utilisable dans la WebView (fichiers `.wasm` et `.task` embarqués, ~3,6 Mo [E]).
- **Visage** : `HSEmotion-B0-LiteRT` (8 Mo, Apache-2.0) = **8 classes sans valence** [V] ; la variante
  `enet_b0_8_va_mtl` donne **valence + éveil**, 16 Mo, **60 ± 32 ms** sur Galaxy Fold 3 CPU, code Apache-2.0 mais
  **licence des poids non précisée** [V] → à vérifier avant usage ; sinon blendshapes MediaPipe (sourire) seuls.
- **Le signal est faible au niveau individuel** : MoodCam / FacePsy (25 personnes, 4 semaines, photos de 10 s au
  déverrouillage) : **AUC 0,58–0,64** pour la valence [V arXiv 2412.12625]. L'étude « sourires » de Google (r = 0,92)
  est **populationnelle** [T]. Voix spontanée : r valence 0,41 (PRIORI 2018), 61,6 % sur 3 classes (EMOVOME 2024) [T].
  → afficher des **tendances lissées sur 7 jours**, calibrées par l'auto-déclaration, jamais un score ponctuel.
- **Caméra en arrière-plan** : service caméra créé en arrière-plan → `SecurityException` (API 34+), seules
  exceptions : notification, widget, `PendingIntent` d'une app visible… ; `cameraserver` coupe en plus les apps
  inactives ; **aucun retour fiable** que `appops set … CAMERA allow` contourne cela sur Android 14–16 [V doc ; T
  AOSP]. → Le « niveau 2 » demandé reste à tester sur l'A56, mais la voie robuste est : service démarré **depuis
  l'app** ou **depuis une notification** (exemption officielle). Shizuku démarre sans PC (débogage sans fil) mais doit
  être **relancé à chaque redémarrage** [V].
- **Voix** : emotion2vec+ (code MIT, poids non précisés, ~90 M paramètres pour « base », pas d'ONNX officiel) [V] ;
  wav2vec2 « emotion » ONNX (MIT) **anglais seulement** [V] ; audeering valence/éveil = **non commercial** [T] ;
  **openSMILE exige une licence commerciale** pour un produit [T] → réimplémenter un petit sous-ensemble prosodique ;
  **pitchy** (hauteur de voix, JS, 0BSD) [V].
- **Emobot** : essai EmoDTx (98 patients) terminé fin 2025, **toujours aucun résultat publié** [T clinicaltrials.gov].

**IA locale pour expliquer ses données**
- **Gemini Nano (ML Kit GenAI)** : bêta, **Galaxy A56 absent** de la liste (côté Samsung : S26, Z Fold7/8, Z Flip8),
  premier plan seulement [V doc 08/10/2026]. MediaPipe LLM Inference mobile → remplacé par **LiteRT-LM** [V].
  **Gemma 4 E2B** (02/04/2026, **Apache-2.0**, ~1,5 Go en 4 bits) [T] ; aucune mesure de vitesse sur un milieu de
  gamme. → Possible plus tard via un plugin natif et un téléchargement à la demande, **uniquement pour reformuler**
  des chiffres calculés par le moteur.
- **Glucose en continu sans ordonnance** : Lingo écrit dans **Health Connect** (valeurs / 5 min, ~3 h de délai) [T
  vendeur] ; HealthTrack lit déjà la glycémie Health Connect (C7) → rien à construire, juste à le dire.

### Idées classées (impact × faisabilité) — nouvelles ou fortement précisées

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I49 | **Montre « sans y penser » : présence CDM + synchro Java** — association CDM en un geste (montre déjà appairée), événement « montre connectée » → service `connectedDevice` court qui relit 7/0x0A-0x0D en Java avec la clé déjà négociée, écrit un fichier que le JS importe à l'ouverture ; filet WorkManager horaire ; relecture au déverrouillage | Données de la montre sans ouvrir l'app (D3 d quater) | 5 | 3 | 15 |
| I50 | **Guide « ne pas tuer HealthTrack » One UI** : un seul écran, 2 interrupteurs (batterie « Sans restriction » + « Applis jamais en veille »), détection de l'état (`isIgnoringBatteryOptimizations`) et rappel si la synchro de fond n'a rien ramené depuis 24 h | Synchro fiable sur Samsung | 4 | 5 | 20 |
| I51 | **Briefing du jour unique** (précise I47) : un état (« en forme / habituel / à ménager »), 1–2 causes **chiffrées** tirées des écarts à vos habitudes, 1 piste ; texte par gabarits déterministes (jamais un chiffre inventé) ; les cartes actuelles deviennent son détail | Une seule réponse par jour (D1) | 5 | 4 | 20 |
| I52 | **Mode calme** : un réglage qui remplace les notes par nuit par des **flèches de tendance 7 / 30 jours** ; conseils affichés seulement quand la tendance s'écarte de votre habituel | Anxiété du score (orthosomnie), moins de chiffres | 4 | 5 | 20 |
| I53 | **Humeur visage, version réaliste** (précise I40) : MediaPipe Face Landmarker web (WebGL2, pas WebGPU sur l'A56) → blendshapes sourire / sourcils pendant 2 s à l'ouverture ; valence par `enet_b0_8_va_mtl` ONNX seulement si la licence des poids le permet ; **tendance 7 j** calibrée par l'auto-déclaration, précision affichée (« AUC ≈ 0,6 dans les études ») | Humeur sans saisie, honnête (D4) | 4 | 4 | 16 |
| I54 | **Une question du soir, la plus utile** : au lieu d'un formulaire, une seule question choisie là où l'incertitude d'un lien est la plus forte (apprentissage actif) ; réponse en 1 tap depuis la notification | Zéro saisie par défaut (D1) | 4 | 3 | 12 |
| I55 | **Voix niveau 1 sans modèle** (précise I41) : 15–30 s de dictée → hauteur (pitchy, 0BSD), variabilité, énergie, débit, pauses, comparés à **votre** ligne de base ; audio effacé ; modèle SER (emotion2vec ONNX int8 ~90 Mo) seulement plus tard, après mesure sur l'A56 | Voix comme signal direct (D4) | 4 | 4 | 16 |
| I56 | **Expliquer ses données avec une IA locale** : Gemma 4 E2B (Apache-2.0) par LiteRT-LM, téléchargé à la demande, qui **reformule** les résultats du moteur et cite les jours ; repli Gemini (clé de l'utilisateur) | Comprendre ses données, hors ligne | 3 | 2 | 6 |

Mises à jour d'idées existantes : **I20 / D3** → (d quater) suit I49 (CDM + Java), `background-runner` écarté ;
**I40** → remplacé par I53 (pas de WebGPU sur Xclipse, licence des poids à vérifier, tendance 7 j) ; **I41** → I55
(openSMILE écarté pour licence) ; **I47** → précisé par I51 (gabarits, jamais de chiffres inventés) ; **I24 / I13**
→ I54 pour la saisie du soir. Le « niveau 2 » caméra (service lancé au déverrouillage) reste demandé par le
propriétaire : à **tester** sur l'A56 avec l'écran de diagnostic prévu, sans promettre qu'Android le permette.

### Détail et pistes d'implémentation

**I49 — Montre sans y penser.** (1) `CompanionPlugin.java` : `associate` avec `BluetoothDeviceFilter` sur l'adresse de
la montre appairée, `setSingleDevice(true)` → l'utilisateur confirme une fois ; puis `startObservingDevicePresence`
(API 31–35) ou `ObservingDevicePresenceRequest.setAssociationId` (36+). (2) `WatchPresenceService extends
CompanionDeviceService` : sur `EVENT_BT_CONNECTED` (ou `onDeviceAppeared`), démarrer `WatchSyncService` (premier
plan, `connectedDevice`, notification « Synchro de la montre… » de quelques secondes). (3) **Java minimal** écrit
depuis `protocoles/huawei.md` §2, §3, §6.5, §7 (pas depuis le JS ni Gadgetbridge) : trame + CRC, TLV, AES-GCM avec la
clé de session dérivée des secrets déjà stockés (à déplacer de `localStorage` vers un stockage lisible par Java,
chiffré par le Keystore), commandes 1/5, 7/0x0A-0x0D ; sortie = JSON brut dans un fichier de l'app, importé par
`services/watchSync.js` (mêmes parseurs, mêmes dédoublonnages) à l'ouverture. (4) En cas d'échec d'authentification
en fond : **jamais** de réappairage, une notification « Ouvrez HealthTrack pour reconnecter la montre ». (5) Filet :
`PeriodicWorkRequest` 1 h (batterie non faible) + `USER_PRESENT`, mêmes délais et plafonds que `watchAutoSync`.
Tests : JVM (trames d'exemple de la spec, vecteurs AES-GCM), et la fausse montre JS pour l'import.

**I50 — Guide One UI.** Réutilise le plugin existant (`isIgnoringBatteryOptimizations`,
`ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`) ; pour « Applis jamais en veille », pas d'API → texte pas à pas
(Paramètres → Batterie → Limites d'utilisation en arrière-plan → Applis jamais en veille → +). S'affiche dans
« Connexion à la montre » seulement si la synchro de fond est activée et a échoué / n'a rien ramené.

**I51 — Briefing du jour.** Entrées : écarts robustes (médiane / MAD 28 j) de sommeil, FC repos, VFC, pas, + météo ;
sortie : un état et ≤ 2 causes triées par |z|, chacune avec son chiffre et « d'habitude » ; 1 piste tirée des liens
personnels (D6, jamais d'une norme). Gabarits FR testés. Fusionne « Prédiction du jour », Radar et cartes cœur sur
l'accueil (D1). LLM éventuel (I56) : reformulation seulement.

**I52 — Mode calme.** Paramètre unique ; les composants qui affichent une note par nuit lisent `calmMode` et montrent
la moyenne 7 j + flèche (seuil = 0,5 MAD). Aucune donnée supprimée.

**I53 — Visage.** `@mediapipe/tasks-vision` hébergé dans `public/` (pas de CDN, hors ligne), délégué GPU puis CPU ;
2 s à l'ouverture de l'accueil si l'interrupteur « Lecture du visage » est actif ; stocke `face_affect` { smile,
browDown, valence?, nFrames, conf } ; canvas vidé. Écran de diagnostic : latence par image, délégué utilisé,
`navigator.gpu` présent ou non → mesure réelle sur l'A56 avant d'aller plus loin.

**I54 — Une question du soir.** Le moteur d'analyse connaît l'incertitude de chaque lien (intervalle) ; choisir la
variable non captable dont l'information attendue est la plus grande ; notification locale à l'heure habituelle du
check-in ; réponses Oui / Non / note en 1 tap (action de notification). Remplace à terme les champs du check-in.

**I55 — Voix.** `getUserMedia({audio})` dans la WebView → `AudioWorklet` → trames de 30 ms : RMS, détection de parole
par énergie, F0 par pitchy ; résumé { f0Med, f0Var, energy, speechRatio, pauseMean, rate } ; ligne de base
personnelle 28 j ; entrée de l'estimateur (Y), jamais un X (D5).

### Sources (consultées le 13/10/2026)

- Montre / Android : https://developer.android.com/reference/android/companion/CompanionDeviceManager ;
  https://developer.android.com/reference/android/companion/ObservingDevicePresenceRequest ;
  https://developer.android.com/reference/android/companion/DevicePresenceEvent ;
  https://developer.android.com/reference/android/companion/CompanionDeviceService ;
  https://developer.android.com/develop/connectivity/bluetooth/companion-device-pairing ;
  https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start ;
  https://developer.android.com/develop/background-work/services/fgs/service-types ;
  https://developer.android.com/about/versions/15/behavior-changes-15 ;
  https://github.com/ionic-team/capacitor-background-runner ; https://dontkillmyapp.com/samsung ;
  https://www.sammyfans.com/2026/01/02/samsung-phone-can-stop-battery-drain-one-ui-8/ ;
  https://gadgetbridge.org/basics/topics/background-service/ ; https://gadgetbridge.org/basics/topics/huawei-honor/ ;
  https://codeberg.org/Freeyourgadget/Gadgetbridge/issues/5784 ; …/issues/6356 ; …/issues/6010 ; …/issues/6978 ;
  …/issues/6461 ; …/issues/6775 ; https://codeberg.org/Freeyourgadget/Gadgetbridge/pulls/6367
- Humeur : https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker ;
  https://chromium.googlesource.com/chromium/src.git/+/main/gpu/config/webgpu_blocklist_impl.cc ;
  https://developer.chrome.com/blog/new-in-webgpu-121 ; https://github.com/av-savchenko/face-emotion-recognition ;
  https://huggingface.co/litert-community/HSEmotion-B0-LiteRT ; https://arxiv.org/html/2412.12625v1 ;
  https://arxiv.org/abs/2512.11905 ; https://github.com/ddlBoJack/emotion2vec ;
  https://huggingface.co/onnx-community/wav2vec2-emotion-recognition-ONNX ; https://github.com/ianprime0509/pitchy ;
  https://pypi.org/project/opensmile/2.2.0/ ; https://shizuku.rikka.app/guide/setup/ ;
  https://clinicaltrials.gov/study/NCT06860165 ; https://arxiv.org/abs/2402.17496
- Besoins / apps : https://www.community.whoop.com/t/ai-coach-lacks-customizability-after-coming-out-of-beta/15909 ;
  https://www.gearpatrol.com/fitness/whoop-ai-reddit-user-feedback-pros-cons/ ; https://bearable.app/support/tips/what-are-factors/ ;
  https://news.samsung.com/global/samsung-highlights-sleep-and-wellness-innovations-at-world-sleep-2025 ;
  https://support.apple.com/en-ie/123002 ; https://blog.google/products/fitbit/personal-health-coach-public-preview/ ;
  https://www.techradar.com/health-fitness/smartwatches/garmins-new-subscription-ai-feature-is-hilariously-bad-so-far ;
  https://forum.quantifiedself.com/t/statistics-how-many-rows-did-you-need-to-get-a-robust-pattern/8848
- IA locale / glucose : https://developers.google.com/ml-kit/genai ;
  https://developers.google.com/edge/mediapipe/solutions/genai/llm_inference ;
  https://developers.googleblog.com/blazing-fast-on-device-genai-with-litert-lm/ ;
  https://www.hellolingo.com/blog/health-connect-integration-guide

### À creuser au prochain run idées (13/10 20:30)

- Lien Bluetooth permanent de la GT 6 Pro (appels / HFP) : l'événement CDM « connectée » arrive-t-il seulement aux
  reconnexions ? (journal du propriétaire, ou documentation Huawei sur les appels Bluetooth de la GT 6 Pro).
- Licence des poids `enet_b0_8_va_mtl` (HSEmotion) : demander / lire les fichiers du dépôt du modèle.
- Mesure de MediaPipe Face Landmarker dans une WebView Samsung (retours publiés, `chrome://gpu` d'un Xclipse 540).
- Commandes 1/0x03 (prises en charge) attendues d'une GT 6 Pro pour TruSleep / stress / VFC — à confirmer par le
  journal du propriétaire.
- Vitesse de Gemma 4 E2B sur un Exynos 1580 (AI Edge Gallery) si des mesures paraissent.

---

## Run du 12/10/2026 20:30 (Paris) — directives du 12/10 : montre en direct, visage / voix, science personnelle, simplifier

Premier run « idées » depuis les directives du 12/10. Question du jour, côté utilisateur : *« je ne veux plus rien
saisir ni rien régler : comment ma montre, mon visage et ma voix peuvent-ils dire à l'app ce qu'elle me demande
aujourd'hui, et comment être sûr que ce qu'elle m'apprend vaut pour moi et pas pour “les gens en général” ? »*
Consigne du propriétaire suivie : privilégier ce qui **simplifie et consolide** plutôt que de nouveaux écrans.

### Ce que veulent les gens (signaux du jour)

1. **Simple à noter, clair à lire** : sur r/QuantifiedSelf et le forum QS, la demande récurrente n'est pas « plus de
   variables » mais « une saisie minimale + une analyse lisible de ce qui influe sur mon humeur » ; un utilisateur qui
   tient un simple tracker humeur / habitudes depuis un mois découvre « l'ennui au travail → humeur juste OK » [T].
   Un développeur QS : « la complexité, c'est le moteur d'analyse qui trie la montagne de données » [T]. → Confirme
   D1 et D6 : moins de cartes, des conclusions personnelles mieux expliquées.
2. **Le sourire est le signal facial qui marche** : étude smartphone 12/2025 (arXiv 2512.11905) : 233 personnes,
   405 448 clips filmés pendant l'usage normal du téléphone ; le sourire suit les enquêtes de bonheur nationales
   (r = 0,92) et les rythmes de la journée (r = 0,80 avec la méthode DRM) ; plus de sourire ↔ plus d'activité et de
   lumière ; **aucun effet trouvé pour l'usage du smartphone** [V]. Pilote bipolaire 2021 (n = 5) : la vidéo ne
   reconnaissait guère que la joie, la voix était plus fiable [T]. → Ne pas promettre 8 émotions : viser **sourire +
   valence**, agrégés sur la journée.
3. **Emobot** : essai EmoDTx (NCT06860165, dépression unipolaire, visage vs MADRS / PHQ-9) — fin prévue 12/2025,
   **aucun résultat publié trouvé** [T]. Leur promesse reste invérifiée publiquement → HealthTrack affiche toujours
   « estimation ».

*Reddit direct toujours bloqué (passé par miroirs / moteurs) ; LinkedIn non exploitable.*

### Faits clés (vérifiés aujourd'hui)

- **Pourquoi la GT 6 Pro ne se connecte pas (hypothèse n° 1)** [V doc Gadgetbridge] : une montre Huawei déjà liée à
  Huawei Santé refuse toute autre app avec l'erreur **« Authentication key negotiation failed »**. Deux sorties
  documentées : **réinitialisation d'usine** de la montre, ou fournir l'**identifiant de compte Huawei** (17 chiffres,
  19 dans les versions récentes, trouvé dans un cookie de cloud.huawei.com ou par `adb logcat`), en désinstallant
  Huawei Santé ou en lui retirant ses autorisations ; **ne pas** dissocier la montre dans Huawei Santé (ça invalide
  la clé). Les modèles récents passent par une authentification « **HiChain** » (« New Auth Protocol » dans GB 0.90+) ;
  une PR GB ouverte (#6367) montre que l'échec d'un seul contrôle de jeton bloque toute reconnexion automatique.
  Un contributeur GB : « GT 6 Pro jamais connectée à Huawei Health, compte Huawei pas nécessaire » [V]. → Pour
  HealthTrack : **montre réinitialisée et appairée uniquement à HealthTrack** = le chemin le plus simple et le plus
  robuste ; l'identifiant de compte est un plan B pour qui veut garder Huawei Santé.
- **Protocole Huawei** [V] : `zyv/huawei-lpv2` (Python, **MIT**, 133 commits) = la base légale de réimplémentation
  (LPv2 : trames TLV, chiffrement, authentification « classique ») ; son fork note que l'ingénierie inverse de LPv2 est
  **incomplète** et qu'un **LPv3** est apparu ; conférence CCC eh19 (Kudera, 2019 : Jadx + Frida). **Rien de public
  sous licence permissive pour HiChain** → l'écran de diagnostic (D3) doit d'abord dire **quel mode
  d'authentification la GT 6 Pro annonce** avant d'écrire du code d'authentification.
- **Visage sur l'appareil** [V] : **HSEmotion EfficientNet-B0 en LiteRT** (Hugging Face `litert-community`,
  **Apache-2.0**, **8 Mo** fp16) : visage recadré 224×224 → 8 classes (colère, mépris, dégoût, peur, joie, neutre,
  tristesse, surprise) ; ~2 ms GPU Pixel 8a, 13 ms via TFLite GPU, LiteRT.js / WebGPU 2,6 ms dans un navigateur ;
  une variante HSEmotion donne aussi **valence et éveil**. Alternative ultra-légère : les **52 blendshapes** de
  MediaPipe Face Landmarker (Apache-2.0, < 1 ms CPU) + classifieur par prototypes (68 % sur 7 émotions, n = 31,
  mieux que les juges humains à 59 %) [V].
- **Voix sur l'appareil** [T] : emotion2vec (~19 M paramètres d'après un article, plausible sur mobile, aucune mesure
  Android publiée) ; un élève distillé de 9,7 Mo ONNX tourne en WASM mais ne prédit que 18 indices d'expression,
  pas des émotions ; distillations CNN 4–5 M paramètres. → À **mesurer** sur l'A56 avant de promettre.
- **Limites Android réelles** [V doc Android] : depuis Android 14, un service de premier plan *caméra* ou *micro*
  ne peut être **créé** que quand l'app est au premier plan (sinon `SecurityException`) ; interdit depuis
  `BOOT_COMPLETED` (micro dès Android 14, caméra dès 15) ; lancer une activité depuis l'arrière-plan est bloqué sauf
  exceptions (notification plein écran). Conséquence : **pas de capture déclenchée au déverrouillage** sans que
  l'utilisateur ouvre l'app ; en revanche un service caméra **démarré depuis l'app** peut continuer, avec notification
  permanente et voyant vert. [H, à tester sur A56 : One UI peut le tuer.]
- **Vérification des développeurs Android** [T] : compte « **distribution limitée** » gratuit, **sans pièce
  d'identité, jusqu'à 20 appareils** ; « parcours avancé » pour l'utilisateur (mode développeur, redémarrage, **attente
  unique de 24 h**, puis installations d'apps non vérifiées permises durablement) ; ADB non concerné. Dates
  contradictoires selon les sources (août / septembre 2026 dans 4 pays, mondial 2027). → Pour le propriétaire (un seul
  téléphone) : soit un compte « distribution limitée » (signature inchangée), soit le parcours avancé une fois. Pas
  d'urgence, mais à **décider avant 2027**.
- **Performance** [T] : sous-échantillonnage LTTB (garde pics et creux, ex. 100 000 → 1 200 points visuellement
  identiques), à faire **hors du rendu** (Web Worker), seuil usuel ≈ 2 000 points ; chaque nœud SVG coûte en mobile →
  limiter les points dessinés. Côté HealthTrack : `localHealthStorage.js` fait **7 `getAll()`** sur tout le store.
- **Science personnelle** [V/T] : simulation iMTracker (app de déclencheurs de crises) : **~90 jours** suffisent pour
  détecter des associations fortes, modèles bayésiens à puissance comparable ; Daza 2018 : les analyses N-of-1
  observationnelles **suggèrent** des causes que seule une expérience personnelle (périodes alternées) peut confirmer ;
  pratique N-of-1 : tests de permutation + BH + **préblanchiment** des séries autocorrélées, et attention aux
  décalages circulaires sur une série en tendance ; modèle bayésien à retards distribués avec erreurs AR (arXiv
  2112.13991) pour les effets décalés.

### Idées classées (impact × faisabilité) — nouvelles, toutes au service de D1–D6

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I39 | **Diagnostic GT 6 Pro guidé** : l'écran de diagnostic (D3) nomme l'étape qui échoue (scan → service Huawei → paramètres de lien → authentification) et la cause probable (« liée à Huawei Santé ») avec **une** consigne (« réinitialiser la montre puis l'appairer à HealthTrack » ou plan B identifiant de compte) ; journal exportable | Comprendre pourquoi ça ne marche pas | 5 | 4 | 20 |
| I40 | **Sourire et valence pendant l'usage de HealthTrack** : MediaPipe (détection) + HSEmotion-B0 LiteRT (8 Mo, Apache-2.0) quelques secondes à chaque ouverture de l'app ; seuls 3 nombres stockés (sourire, valence, confiance) ; puis option « capture continue » (service caméra lancé depuis l'app, voyant vert assumé) | Humeur sans saisie (D4) | 5 | 3 | 15 |
| I41 | **Dictée du soir = auto-déclaration + voix** : un seul geste (« Racontez votre journée ») donne la note déclarée, les tags extraits (I26) **et** des indices vocaux (débit, hauteur, énergie, score emotion2vec si l'A56 suit) ; l'audio est effacé après calcul | Remplace le formulaire de check-in (D1 + D4) | 5 | 3 | 15 |
| I42 | **Réseaux sociaux = X, jamais Y** : minutes par app sociale via `queryEvents` (plugin existant étendu aux apps au premier plan) comme facteur des Analyses ; exclues de l'estimateur, consigné dans la liste déclarée (D5) ; pas d'Accessibility (contenu illisible proprement, intrusif) | Comprendre l'effet des réseaux chez moi | 4 | 4 | 16 |
| I43 | **Lecture par plage + agrégats journaliers** : index `[type, date]` + `IDBKeyRange` à la place des 7 `getAll()`, magasin `daily_agg` versionné invalidé par `health-entries-updated`, LTTB ≥ 2 000 points dans un Worker, test budget « entrées lues par page » | L'app ne lague plus (D2) | 5 | 4 | 20 |
| I44 | **« Votre cas vs l'hypothèse générale »** : chaque lien montré avec son sens **chez vous**, l'a priori général en petit (« en général : moins d'écran le soir, meilleur sommeil — chez vous : l'inverse, 62 jours ») ; a priori faible = rétrécissement **vers zéro**, jamais vers la norme | Science personnelle sans culpabilité (D6) | 5 | 4 | 20 |
| I45 | **Expériences personnelles randomisées** (ABAB, 2 × 7 jours, l'app tire l'ordre) pour passer de « va de pair » à « chez vous, ça cause » ; proposé seulement pour un lien « à confirmer » qui intéresse l'utilisateur | Corrélation ≠ causalité (D5) | 4 | 3 | 12 |
| I46 | **Garde-fous statistiques visibles** : X mesuré **avant** Y (veille → jour), ≥ 30 jours appariés pour afficher un lien, ≥ 90 jours pour « solide », préblanchiment avant permutation, nombre de tests affiché (« 1 lien net sur 42 testés ») | Confiance (D5) | 4 | 4 | 16 |
| I47 | **Un seul flux du jour** (à la Whoop 09/2026) : briefing du matin, dictée du soir et carte « Forme » fusionnés dans une carte qui change avec l'heure → accueil plus court | Moins de cartes (D1) | 4 | 3 | 12 |
| I48 | **Mise à jour en 1 clic après 2027** : compte « distribution limitée » gratuit (≤ 20 appareils, sans pièce d'identité) ou parcours avancé unique de 24 h ; message clair dans la bannière de mise à jour si Android bloque | Continuer d'installer l'app | 3 | 4 | 12 |

Mises à jour d'idées existantes : **I7 / I31** (humeur « plage habituelle » comportementale) → **abandonnées** au
profit de I40 / I41 (D5) ; **I20** (pilote Huawei direct) → précédé de I39 (diagnostic) et conditionné au mode
d'authentification réellement annoncé par la GT 6 Pro ; **I26** (journal libre) fusionne avec I41 ; **I24**
(briefing du matin) fusionne dans I47.

### Détail et pistes d'implémentation

**I39 — Diagnostic GT 6 Pro.** Étapes journalisées (horodatage, octets en hex tronqués, jamais d'adresse MAC
complète) : (1) scan → nom annoncé « HUAWEI WATCH GT 6 Pro-xxx », services et données fabricant ; (2) connexion GATT,
liste des services (service propriétaire Huawei attendu, à confirmer [H]) ; (3) demande des paramètres de lien → le
mode d'authentification annoncé ; (4) authentification → code d'erreur. Chaque échec → une phrase et une action.
Export JSON par la feuille de partage Android. Tests : parseur de trames LPv2 d'exemple (en-tête 0x5A, longueur,
service, commande, TLV, CRC16) écrit **depuis la doc MIT**. Livrable même sans montre : le propriétaire exporte le
journal, le run suivant le lit.

**I40 — Visage.** Pipeline : `getUserMedia` caméra frontale (WebView, autorisation Android) → MediaPipe Face
Detector (tâches web, Apache-2.0) → recadrage → HSEmotion-B0 via LiteRT.js (WebGPU / WASM) ou ONNX Runtime Web ;
toutes les 500 ms pendant 5 s à l'ouverture de l'app → médianes. Entrée `face_affect` { smile, valence, arousal?,
conf, nFrames } ; aucune image en mémoire après inférence (canvas vidé). Indicateur visible « 📷 lecture du
visage » + interrupteur. Étape 2 : plugin natif service de premier plan type `camera`, démarré depuis l'app,
1 image / 5 min écran allumé et déverrouillé, voyant vert et notification assumés. Valider d'abord : le score du
jour suit-il le check-in de l'utilisateur ? (corrélation affichée honnêtement, même faible).

**I41 — Dictée du soir.** `SpeechRecognizer` hors ligne (fr-FR) pour le texte ; en parallèle, `AudioRecord` →
caractéristiques prosodiques (F0 moyenne / variabilité, énergie, débit syllabique, pauses) calculées en JS / natif,
puis audio effacé. Score SER seulement si un modèle ≤ 20 Mo tient < 300 ms sur l'A56 (à mesurer). Stockage :
`voice_affect` { pitchVar, energy, rate, pauses, ser? }. Les indices vocaux sont des **entrées de l'estimateur**
(Y), jamais des X.

**I42 — Réseaux sociaux.** `PhoneUsagePlugin` lit déjà `queryEvents` pour l'écran ; ajouter
`ACTIVITY_RESUMED / PAUSED` par paquet, filtrer une liste d'apps sociales (Instagram, TikTok, Facebook, X,
Snapchat, Reddit, YouTube…) → `social_minutes`, `social_late` (22 h–4 h). Déclaré dans `MOOD_ESTIMATOR_INPUTS`
comme **exclu** ; test D5 vérifie qu'il n'y figure pas. Les gens se demandent vraiment « est-ce que TikTok me
plombe ? » : c'est un X idéal.

**I43 — Performance.** Mesurer d'abord (temps par page, entrées lues) avec 3 ans de démo ; puis migration IndexedDB
v+1 ajoutant un index composé `[type, date]` (rétrocompatible : index seulement) ; `listEntries({types, from, to})`
par `IDBKeyRange.bound` ; magasin `daily_agg` (clé `date`, valeurs par variable, `version` du calcul) reconstruit
paresseusement ; `analysisWorker.js` (Vite `?worker`) pour `computeAdvancedAnalysis` ; LTTB pur testé ; budget en
test : « Accueil lit ≤ N entrées ».

**I44 — Votre cas vs l'hypothèse générale.** Remplacer `VARIABLE_META.direction` (`higher_better` /
`lower_better`) par `generalHypothesis` { sens, source } **utilisé seulement** pour ordonner ce qu'on regarde
d'abord et pour un texte en petit. Le sens affiché vient toujours des données ; si le sens personnel contredit
l'hypothèse avec un lien au moins « à confirmer » : « Chez vous, c'est l'inverse de ce qu'on observe en général ».
Couleurs : vert / rouge = effet **sur votre bien-être**, jamais un jugement du comportement.

**I46 — Garde-fous.** Fonction pure `analysisGuards(dataset)` testée : décale tous les X d'un jour quand Y est le
bien-être déclaré le soir (sauf X explicitement « du jour avant la saisie »), refuse d'afficher sous 30 paires,
préblanchit (AR(1)) avant le test, affiche « k liens nets sur m testés ». Phrase type : « va de pair avec », jamais
« améliore » ou « cause ».

### Sources (consultées le 12/10/2026)

- Besoins : https://forum.quantifiedself.com/t/my-notes-to-developers-as-promised-building-that-perfect-quantified-self-app/447 ; https://pol1.lr.ggtyler.dev/r/QuantifiedSelf ; https://arxiv.org/abs/2512.11905 ; https://reunir.unir.net/items/bc1e403a-9611-409c-a50e-4b404eff604a/full ; https://www.centerwatch.com/clinical-trials/listings/NCT06860165/validation-of-emodtx-as-a-digital-endpoint-for-mood-monitoring-in-adult-patients-suffering-from-unipolar-depression
- Huawei : https://gadgetbridge.org/basics/pairing/huawei-honor-pairing/ ; https://zff.dev/Freeyourgadget/website/issues/226 ; https://codeberg.org/Freeyourgadget/Gadgetbridge/pulls/6367 ; https://zff.dev/Freeyourgadget/Gadgetbridge/issues/6271 ; https://github.com/zyv/huawei-lpv2 ; https://www.github.com/psolyca ; https://media.ccc.de/v/eh19-186-all-your-fitness-data-belongs-to-you-reverse-engineering-the-huawei-health-android-app
- Visage / voix : https://huggingface.co/litert-community/HSEmotion-B0-LiteRT ; https://arxiv.org/pdf/2203.13436 ; https://www.mdpi.com/1424-8220/26/3/1060 ; https://pub.dev/documentation/face_detection_tflite/6.7.0/face_detection_tflite_native/FaceBlendshapesModel-class.html ; https://huggingface.co/thomashallock/emotion2vec-web-distill ; https://arxiv.org/pdf/2602.09121 ; https://arxiv.org/pdf/2210.14977
- Android : https://developer.android.com/develop/background-work/services/fgs/changes ; https://developer.android.com/about/versions/15/changes/foreground-service-types ; https://developer.android.com/guide/components/activities/background-starts ; https://www.androidauthority.com/how-android-app-verification-works-3603559/ ; https://thehackernews.com/2026/03/google-adds-24-hour-wait-for-unverified.html ; https://www.neowin.net/amp/google-relaxes-android-sideloading-requirement-for-experienced-users/
- Perf / stats : https://dev.to/wellallytech/health-data-visualization-building-high-performance-charts-for-millions-of-points-3n66 ; https://arxiv.org/html/2307.05389v1 ; https://www.medrxiv.org/content/10.1101/2020.04.28.20082339.full.pdf ; https://pmc.ncbi.nlm.nih.gov/articles/PMC6087468 ; https://arxiv.org/abs/2112.13991v1

### À creuser au prochain run idées (13/10 08:30)

- Wiki de `zyv/huawei-lpv2` : format exact des trames, mode d'authentification, liste des services → préparer les
  trames d'exemple des tests D3. UUID du service Huawei annoncé par la GT 6 Pro (à lire dans le journal du propriétaire).
- MediaPipe Face Detector + LiteRT.js dans une WebView Android 15 (Samsung) : WebGPU disponible ? sinon WASM, latence.
- Modèle SER le plus petit utilisable en français (emotion2vec base vs distillations) : taille, licence, latence.
- Google : texte officiel du compte « distribution limitée » (est-il compatible avec une release GitHub publique ?).
- Reddit : r/Huawei et r/Gadgetbridge sur la GT 6 / HiChain (miroirs).

---

## Run du 12/10/2026 08:30 (Paris) — tout capter depuis le téléphone, bagues ouvertes, du chiffre à l'action

Question du jour, côté utilisateur : *« j'ai une montre, un téléphone et une vie chargée : qu'est-ce qui, sans rien
saisir, me dirait chaque matin où j'en suis et quoi faire, et m'éviterait les fausses alertes ? »*

### Ce que veulent les gens (nouveaux signaux, 2025–2026)

1. **Un seul tableau de bord, humeur + santé + habitudes** : « Frustrated with fragmented tracking apps – would you use
   an all-in-one dashboard for mood, health, and habits? » (r/QuantifiedSelf, via gummysearch) [T]. Confirme le créneau.
2. **Le tag manuel tue l'adoption** : le *Lifestyle Logging* de Garmin est le « biggest gripe » de ses utilisateurs ;
   Garmin préparerait un auto-logging (fuite the5krunner, 06/11/2025) [V]. « 3 clics par case oui / non » = abandon [T].
3. **L'IA doit rester sous contrôle** : forum Whoop, 09/02 et 29/05/2026 : « Use of AI/LLMs needs to be under the
   control of the user », « not be forced to engage with the AI coach » [V]. Garmin Active Intelligence jugé
   « generic… just some math and some platitudes » [T]. → IA **optionnelle**, ancrée dans les chiffres, désactivable.
4. **Lassitude des abonnements** (Whoop, Oura 5,99 €/mois, Google Health 9,99 $/mois, Garmin Connect+) [T] → notre
   gratuité locale est un argument.
5. **Fausses alertes maladie** : alcool, voyage, vaccin, gros entraînement déclenchent les alertes (10/2026) [T].
6. **Bilans sanguins** : saisie « time consuming » dans un tableur, envie de tendances multi-labos [T].
7. **Ce que font les meilleurs en 2026** : Whoop fusionne Journal / Outlook / Check-ins en **un flux quotidien**
   (matin, journée, soir) et extrait les comportements d'un **journal vocal ou texte libre** (05/09/2026) [V] ;
   Bevel « Energy Bank » (énergie de la journée) [T] ; Samsung « Vitals » (écarts nocturnes à la norme) [T] ;
   Oura : migraine (brevet 08/2026), ménopause, cycle [T] ; Alan **Mo** (France) : « dans 10 ans nous aurons tous
   notre compagnon de santé personnel », apprécié parce qu'il **dit quand il ne sait pas et cite ses sources** [V].
8. **Ce qui change vraiment les comportements** : JITAI (méta-analyse 2025, g = 0,15, durable) et intentions
   « si X alors Y » (SMD ≈ 0,24–0,33) : petits effets, robustes et quasi gratuits à implémenter [T]. Les streaks
   rigides culpabilisent [T, faible].

*Reddit toujours bloqué (old.reddit, `.json`, miroirs en 503) : passé par gummysearch, redlib, forums officiels et
presse. LinkedIn : rien d'exploitable via les moteurs. npmjs.com en 403 (versions de plugins non vérifiées).*

### Faits clés trouvés ce matin

- **GT 6 Pro + Gadgetbridge, retours réels** [V] (Codeberg #5428, 8 participants, 09/2025 → 06/2026 ; #6271) : FC,
  SpO₂, stress, température cutanée, sommeil, séances, mises à jour firmware, réponses aux notifications **fonctionnent**
  chez un propriétaire de GT 6 Pro ; un contributeur l'utilise « depuis longtemps uniquement avec Gadgetbridge ».
  Limites : appels VoIP, cadrans partiels, ECG non fonctionnel ; **la VFC n'est jamais mentionnée** (à vérifier chez le
  propriétaire). La page officielle marque la GT 6 Pro « Mostly supported » mais « not tested ».
  **Gadgetbridge 0.95.0 / 0.95.1 sortis aujourd'hui (12/10/2026)** : tension artérielle → Health Connect, altitude,
  export FIT des séances Huawei, export FIT en lot [V]. 0.93 (08/2026) a corrigé les phases de sommeil tronquées dans HC.
  « HR Data Broadcasts » existe sur les montres Huawei, parfois seulement en mode économie ; GT 6 non confirmé [V].
  Packages : Health Sync = `nl.appyhapps.healthsync` [V] ; Huawei Health = `com.huawei.health` [T].
- **Bagues Colmi / Yawell (R02 → R12, ~30–45 €)** [V] : « Highly supported » dans Gadgetbridge sans app constructeur ;
  FC (intervalle réglable), SpO₂, stress, phases de sommeil, pas, VFC selon firmware, température (R09, Yawell R05).
  **Protocole documenté sous licence MIT** (`tahnok/colmi_r02_client` + notes.tahnok.ca : trames de 16 octets avec
  somme de contrôle). → **la première bague à données brutes 100 % locales, réimplémentable légalement.**
  PineTime / InfiniTime : FC 0x2A37 standard, doc BLE publique [V]. Bangle.js 2 : FC standard via une app
  communautaire [T]. Oura, Ultrahuman, RingConn, Galaxy Ring : aucun BLE ouvert, passer par HC [H].
- **CGM** : Juggluco (Libre 2/3, Dexcom G7, Sibionics) → Health Connect + broadcasts xDrip [V] ; Dexcom → HC avec
  **3 h de retard** [V] ; Lingo sur Android depuis 12/2025 (US / UK) [T]. En France, un Libre s'achète en pharmacie
  sans ordonnance pour un non-diabétique [H]. HealthTrack lit déjà la glycémie HC (run 11/10).
- **Types HC réellement écrits** : Samsung = pas, exercice, FC, sommeil avec phases (pas de VFC / SpO₂ / température
  listés) [V] ; Garmin = activité, FC, sommeil, poids (pas de stress / Body Battery / VFC) [T] → **la couverture varie
  par firmware : la mesurer dans l'app** plutôt que la supposer.
- **Téléphone seul** :
  - **ML Kit GenAI (Gemini Nano) : aucun Galaxy A, A56 compris** (page du 08/10/2026) [V] → résumé / sentiment hors
    ligne = LiteRT-LM + Gemma 3 1B int4 (~529 Mo, ~1,1 Go RAM ; 47–55 tok/s sur S24 Ultra, A56 estimé 15–25) [V/H].
  - **APK installé hors Play Store (Android 15+)** : l'accès aux données d'utilisation (temps d'écran), l'écoute des
    notifications et l'accessibilité sont des « paramètres restreints » → l'utilisateur doit d'abord ouvrir Infos de
    l'appli → ⋮ → **« Autoriser les paramètres restreints »** [T]. Le guide in-app doit le prévoir.
  - **Vérification des développeurs Android** : appliquée depuis le 30/09/2026 au Brésil, en Indonésie, à Singapour et
    en Thaïlande, **mondiale en 2027** [T] → risque pour l'installation de l'APK GitHub ; à surveiller (point
    d'attention propriétaire).
  - Sleep API Google Play (lumière + mouvement, `SleepSegmentEvent`) : guide toujours en ligne, codelab « deprecated »
    [V] → plan B : coucher / lever estimés par l'écran (R² ≈ 0,9 avec l'actigraphie, Borger 2019) [T].
  - `@capgo/capacitor-android-usagestatsmanager` n'expose pas `queryEvents` [V doc] → petit plugin Kotlin maison.
  - Preuves humeur passive : LifeSense (n = 1013, 2024) : plus de temps à la maison **que sa propre moyenne** → PHQ-8
    plus élevé 2 semaines après (β = 0,22) ; modèles à 5–6 % de variance expliquée [V]. MONDY n-of-1 (08/2026, n = 11) :
    les modèles personnels ne battent la moyenne personnelle que chez 8 / 11 [V]. Revue JMIR 08/2025 : sommeil
    d'abord, puis pas / mobilité, appels, écran nocturne [V]. → **écart à sa plage habituelle, modestie affichée.**
  - **Emobot** (désormais emobothealth.com, cap sur la psychiatrie US) : visage pendant l'usage normal, voix réduite
    sur l'appareil à des caractéristiques acoustiques, pas, sorties, usage nocturne ; installation 3 min puis rien ;
    bandes de « plage habituelle » + alerte de rechute ; résumé hebdo « Insight » ; MADRS r = 0,895 (n = 45, données
    fabricant, non publiées) [V]. **Sahha** : score 0–100 sur 6 habitudes (pas, heures actives, inactivité, régularité
    activité / sommeil, alignement circadien), r = −0,28 avec la dépression DASS, non diagnostique [T] → modèle simple
    à imiter.
  - Voix FR hors ligne : `SpeechRecognizer` on-device (fr-FR à tester sur l'A56), Vosk small-fr 41 Mo (WER 24 %),
    Whisper-small FR affiné (WER ~12 %, 250 Mo) [V/T]. Sentiment FR : `distilcamembert-base-sentiment` [T].
- **Conversations** : Omi (MIT, API REST + **serveur MCP**, gratuit en transcription locale) reste le seul ouvert ;
  Plaud NotePin S (CES 2026, vendu en UE) sans API publique ; Limitless coupé dans l'UE ; Bee US / iOS ; Sandbar
  Stream (bague de notes vocales, été 2026) [V/T]. Aucune app Android open source de lifelogging micro continu [T].

### Idées classées (impact × faisabilité) — nouvelles ou fortement précisées

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I22 | **Radar avec facteurs explicatifs** : alcool / sport du soir / malade / voyage tagués la veille → « explication probable » au lieu d'une alerte ; « Je me sens bien / pas bien » en 1 tap pour calibrer | Moins de fausses alertes | 4 | 5 | 20 |
| I23 | **« Qui envoie quoi »** : matrice source × mesure sur 30 j (d'après `sourceName` HC / BLE), trous signalés (« plus de VFC depuis 4 j ») | Objets connectés fiables | 4 | 5 | 20 |
| I24 | **Briefing du matin** : une carte « Votre journée » (sommeil vs norme, cœur, Radar, météo / pression, énergie prévue) + **une** action ; IA optionnelle | Des actions, pas des graphiques | 5 | 4 | 20 |
| I25 | **Sommeil estimé par le téléphone** (plus longue période écran éteint, charge, immobilité) quand aucune montre n'envoie | Zéro saisie sans montre | 5 | 4 | 20 |
| I26 | **Journal libre (dictée / texte) → tags et intensités extraits** (Gemini JSON, confirmation en 1 tap) | Saisie en un geste | 5 | 4 | 20 |
| I27 | **Courbe caféine (et alcool)** : modèle à 1 compartiment, demi-vie ajustable, « caféine restante au coucher » comme variable | Sommeil, décisions | 4 | 5 | 20 |
| I28 | **Bague Colmi / Yawell en direct** (pilote BLE réimplémenté d'après le protocole MIT) : FC, SpO₂, sommeil, pas, sans app | Données brutes, matériel bon marché | 4 | 3 | 12 |
| I29 | **Glycémie après les repas** (HC ← Juggluco / Libre / Dexcom) : courbe 2 h superposée au repas, aire sous la courbe ; avertir du retard Dexcom | Relier alimentation et métabolisme | 4 | 4 | 16 |
| I30 | **Plans « si… alors… »** choisis par l'utilisateur (« si VFC basse → marche 20 min, pas d'alcool »), notification locale seulement quand la condition est vraie, ≤ 1 / j | Passer à l'action | 4 | 3 | 12 |
| I31 | **Indice « dans votre plage habituelle »** (style Sahha / Emobot) : z-scores 28 j de sommeil, régularité, pas, écran tard, temps à la maison → bande perso, calibré par le check-in | Humeur estimée (affine I7) | 5 | 4 | 20 |
| I32 | **Contrôle qualité des nuits** : nuits « 100 % léger » ou sans phases, nuits tronquées → exclues des moyennes de phases | Fiabilité | 3 | 5 | 15 |
| I33 | **Réglage IA** (désactivée / à la demande / proactive) + ton sans culpabilité (pas de streak cassé) | Confiance | 3 | 5 | 15 |
| I34 | **Cycle menstruel** (HC `MenstruationPeriod`, température) → phase comme variable de contrôle des Analyses | Hub complet | 4 | 3 | 12 |
| I35 | **Risque migraine / allergie du jour** (pression 24 h, pollen, dette de sommeil, saut de caféine) — seulement après ≥ 30 épisodes tagués | Anticiper | 4 | 3 | 12 |
| I36 | **Pas du téléphone sans Health Connect** (`TYPE_STEP_COUNTER`, relevé périodique) | Activité sans montre | 3 | 4 | 12 |
| I37 | **Routine et temps à la maison sans GPS** (Wi-Fi dominant la nuit, haché ; transitions d'activité) | Humeur (meilleur signal intra-personne) | 4 | 3 | 12 |
| I38 | **LLM local** (LiteRT-LM + Gemma 3 1B, téléchargement optionnel) pour le résumé hebdo hors ligne — Gemini Nano indisponible sur A56 | Assistant sans cloud | 3 | 2 | 6 |

Mises à jour d'idées existantes : **I6** (temps d'écran) — prévoir le guide « Autoriser les paramètres restreints » et
un plugin Kotlin `queryEvents` maison ; **I14** — import FIT d'autant plus utile que Gadgetbridge 0.95 exporte en lot ;
**I21** (matériel) — ajouter la bague Colmi R10 (~35 €, ouverte), ceinture Coospo H6 (~30 €) / Polar H10, tensiomètre
A&D UA-651BLE (profil standard déclaré), Medisana BU 572 ; Omron / Beurer / Withings : profil standard **non garanti**.

### Détail et pistes d'implémentation

**I22 — Radar expliqué.** `radar.js` connaît déjà les signaux ; `behaviorTags.js` les tags (alcool, sport le soir,
malade…). Si un tag « confondant » existe la veille (alcool, sport le soir, repas tardif) ou un voyage / vaccin
(nouveaux tags), le niveau reste affiché mais le message devient « Probablement lié à l'alcool d'hier soir » ; tag
« malade » → confirmation. Bouton « Je me sens bien / Je couve quelque chose » stocké (entrée `radar_feedback`) pour
recalibrer plus tard les seuils. Tests purs sur des séries synthétiques. Petit, visible, fondé sur un vrai reproche.

**I23 — Qui envoie quoi.** Dans « Mes appareils » : pour chaque source détectée, les types reçus sur 30 jours avec la
date du dernier ; alerte douce si un type habituel s'arrête (≥ 3 j sans alors qu'il arrivait chaque jour). Fonction
pure `sourceCoverage(entries, now)` → testable. Répond au « est-ce que ma montre envoie vraiment la VFC ? ».

**I24 — Briefing du matin.** En haut du tableau de bord jusqu'à midi : 3 lignes calculées localement (sommeil de la
nuit vs norme, cœur / Radar, contexte météo — pression en chute, pollen) + « Énergie prévue » (prédiction du jour
existante, fourchette) + **une** suggestion tirée des « Pistes à tester » solides. Gemini seulement si l'utilisateur
l'active (I33). Gabarit testable, aucun chiffre inventé.

**I25 — Sommeil par le téléphone.** Plugin Kotlin `PhoneUsage` (même que I6) : événements `SCREEN_INTERACTIVE /
NON_INTERACTIVE`, `KEYGUARD_HIDDEN`, + état de charge ; plus longue période sans interaction entre 20 h et 12 h →
`sleep` source `phone_estimate`, confiance « estimée », jamais prioritaire sur une montre (dédoublonnage par source).
Correction en un geste (« je me suis couché à… »).

**I26 — Journal libre → tags.** Réutiliser la dictée du repas décrit (run 10/10) : un champ « Racontez votre journée »
→ Gemini (schéma JSON : tags connus + intensité, caféine (heures, quantités), alcool (verres), symptômes, personnes
vues, humeur 1–5) → écran de confirmation pré-coché → entrées habituelles. Le texte reste en local ; seul le texte
saisi part vers Gemini avec la clé de l'utilisateur. Repli sans clé : mots-clés locaux (« café », « verre de vin »).

**I27 — Caféine.** Saisie en 1 tap (« ☕ maintenant ») ou extraite par I26 ; C(t) = Σ dose·e^(−ln2·Δt/T½), T½ = 5 h par
défaut ; « caféine restante à l'heure habituelle de coucher » = variable des Analyses et levier (« dernier café avant
14 h »). Alcool : élimination linéaire ~0,1–0,15 g/L/h, présenté prudemment.

**I28 — Bague Colmi.** Pilote dans le registre BLE (`match` : nom annoncé « R02_… / R10_… », service UART Nordic
6E40FFF0…) ; trames de 16 octets (commande, données, somme de contrôle) ; d'abord FC en direct + batterie, puis
historique FC / SpO₂ / pas / sommeil. Réimplémenter **depuis les notes de protocole MIT**, jamais depuis Gadgetbridge
(AGPL). Tests sur trames d'octets. Limite : la bague ne doit pas être connectée en même temps à son app.

**I29 — Glycémie post-repas.** Entrées `blood_glucose` déjà lues ; pour chaque repas, fenêtre 0–2 h : pic, temps au
pic, aire au-dessus de la valeur avant le repas ; carte du repas « +38 mg/dL, retour en 1 h 40 ». Avertissement
« outil de curiosité, pas un avis médical » ; aucun conseil d'insuline (sinon dispositif médical).

**I31 — Plage habituelle.** Reprend I7 avec le modèle Sahha / Emobot : par signal, z-score sur 28 j ; indice = moyenne
pondérée (poids appris par Ridge sur les check-ins quand ≥ 14 jours, sinon égaux) ; affichage en bande « dans / au-dessus
/ en dessous de votre habitude » ; ≥ 7 jours valides / 14 ; mention « estimation, pas un diagnostic » ; si l'indice
reste bas ≥ 2 semaines : renvoi doux vers un professionnel (et 3114 en cas de détresse).

### Sources (consultées le 12/10/2026)

- Besoins / apps : https://gummysearch.com/r/QuantifiedSelf ; https://the5krunner.com/2025/11/06/garmin-connect-auto-logging-leak/ ; https://www.community.whoop.com/t/some-feedback-after-9-months-increased-ai-intrusion/13756 ; https://www.techradar.com/health-fitness/smartwatches/garmins-new-subscription-ai-feature-is-hilariously-bad-so-far ; https://gadgetsandwearables.com/2026/09/05/whoop-custom-journal-workout-tracking-update/ ; https://thenextweb.com/news/whoop-doctors-fitbit-air-google-health-ai ; https://idevice.com/oura-wants-your-ring-to-see-a-migraine-coming ; https://www.maddyness.com/2026/04/21/dans-10-ans-nous-aurons-tous-notre-compagnon-de-sante-la-french-tech-deploie-deja-ses-agents-ia/ ; https://ubiehealth.com/doctors-note/wearable-tracking-detect-illness-prior-symptoms-49101q7 ; https://pubmed.ncbi.nlm.nih.gov/35236896/ ; https://f-droid.org/packages/com.uc.caffeine/ ; https://fis.uni-bamberg.de/handle/uniba/116116
- Appareils : https://gadgetbridge.org/gadgets/wearables/huawei-honor/ ; https://codeberg.org/Freeyourgadget/Gadgetbridge/issues/5428 ; https://codeberg.org/Freeyourgadget/Gadgetbridge/issues/6271 ; https://gadgetbridge.org/blog/release-0_95_01/ ; https://consumer.huawei.com/ca/support/content/en-us15827504/ ; https://healthsync.app/ ; https://gadgetbridge.org/gadgets/rings/yawell/ ; https://github.com/tahnok/colmi_r02_client ; https://github.com/InfiniTimeOrg/InfiniTime/blob/main/doc/ble.md ; https://www.juggluco.nl/Juggluco/index.html ; https://www.dexcom.com/en-us/faqs/can-i-share-glucose-data-with-google-health-connect ; https://developer.samsung.com/health/health-connect-faq.html ; https://gadgetbridge.org/basics/pairing/huami-xiaomi-server/ ; https://developer.garmin.com/gc-developer-program/health-api/ ; https://f-droid.org/packages/com.health.openscale/
- Téléphone / ML / humeur : https://developers.google.com/ml-kit/genai ; https://huggingface.co/litert-community/Gemma3-1B-IT ; https://developers.google.com/location-context/sleep ; https://9to5google.com/2024/09/12/android-15-sideloaded-apps-restrictions/ ; https://capgo.app/docs/plugins/android-usagestatsmanager/ ; https://f1000research.com/articles/8-754 ; https://pmc.ncbi.nlm.nih.gov/articles/PMC10955925/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC12411791 ; https://pmc.ncbi.nlm.nih.gov/articles/PMC13507524/ ; https://emobothealth.com ; https://sahha.ai/mental-health-api/ ; https://alphacephei.com/vosk/models ; https://developer.android.com/reference/android/speech/SpeechRecognizer
- Conversations : https://github.com/BasedHardware/omi ; https://www.omi.me/pricing ; https://dataconomy.com/2026/01/05/plaud-launches-notepin-s-ai-notetaker-at-ces-2026/ ; https://www.uctoday.com/devices-workspace-tech/sandbar-ai-voice-note-taking-ring/

### À creuser au prochain run idées (12/10 20:30)

- VFC de la GT 6 Pro via Gadgetbridge → HC : présente ou non ? (demander au propriétaire ; lire `sourceName` des VFC).
- Protocole Colmi : lire notes.tahnok.ca en détail (commandes d'historique, sommeil) avant d'estimer l'effort.
- Vérification des développeurs Android 2027 : options pour un APK distribué hors store (compte développeur gratuit ?
  « advanced flow ») — impact direct sur la mise à jour en 1 clic.
- Tensiomètres / balances vendus en France qui implémentent vraiment les profils standard (tests communautaires).
- Reddit : retenter (miroirs, archives) ; LinkedIn : posts Emobot / Withings / Alan.

---

## Run du 11/10/2026 20:30 (Paris) — objets connectés, capture passive, humeur, conversations

### Ce que veulent les gens (synthèse)

1. **Fin des silos** : « tried every integration tool, and still struggle to get our data to "talk to each other" »
   (fil r/QuantifiedSelf cité sur le forum QS) ; chaque fabricant garde son silo, synchros à sens unique (Garmin → HC
   en écriture seule, mars 2026). Google lance « Google Health » (ex-Fitbit, mai 2026) comme hub + coach Gemini à
   9,99 $/mois → **notre créneau : hub multi-marques, local, gratuit, au-delà de la santé physique**.
2. **Moins de saisie** : Bearable est jugé bon pour ceux « qui ne craignent pas les check-ins manuels » — c'est
   précisément la limite. Complexité de saisie = cause n° 1 d'abandon (déjà noté RESEARCH V3).
3. **Des actions, pas des graphiques** (Bevel, Whoop Coach, Oura Advisor).
4. **Saisir une intensité**, pas seulement oui / non (critique d'Exist sur le forum QS).
5. **Être prévenu tôt** d'une maladie (Oura Symptom Radar ; FC repos ↑, VFC ↓, respiration ↑ jusqu'à ~1 semaine avant
   les symptômes).
6. **Relier le médical** (bilans sanguins : Whoop Advanced Labs, Guava).
7. **Maîtrise de ses données** (EFF, juillet 2026 : les wearables n'ont pas de protection santé particulière).

*Reddit inaccessible depuis la session (blocage de l'outil, miroirs en 403) : besoins tirés du forum Quantified Self,
de la presse, d'avis et d'études. À retenter au prochain run idées.*

### Faits clés trouvés ce soir

- **Huawei Watch GT 6 Pro (montre du propriétaire)** — [V] prise en charge par **Gadgetbridge depuis la 0.88.0
  (12/12/2025)**, « Mostly supported », appairage possible **sans réinitialiser** la montre (ID de compte Huawei à
  17 chiffres → clé d'authentification ; retirer les permissions de Huawei Health **sans désappairer** la montre).
  Données : FC, FC repos, VFC (selon appareil), SpO₂, stress, température cutanée, sommeil (phases avec HarmonyOS 5+),
  pas, calories, VO2max, séances avec GPS. [V] **Gadgetbridge écrit dans Health Connect depuis la 0.89 (10/02/2026)** :
  pas, distance, FC, FC repos, VFC, SpO₂, température, fréquence respiratoire, sommeil, VO2max, exercices (stress non
  écrit). Dernière version 0.94 (17/09/2026). → **chemin immédiat sans code : GT 6 Pro → Gadgetbridge → Health
  Connect → HealthTrack.**
  - Alternatives : Health Sync (Appyhapps, payant, HMS Core requis, couverture partielle — phases de sommeil / SpO₂
    souvent perdues) ; Huawei Health Kit = revue manuelle Huawei, dossier d'entreprise → irréaliste pour nous ; **pas
    de synchro native Huawei → Health Connect** en 2026 ; **export RGPD** (Privacy Center, XLS + JSON, ≤ 30 j,
    page du 18/05/2026) pour l'historique.
  - Protocole : Gadgetbridge (AGPL) ne documente pas le protocole Huawei ; base réutilisable **sous licence MIT** :
    `zyv/huawei-lpv2` (Python, « Huawei BLE Link Protocol v2 ») + conférence eh19. Les montres récentes semblent
    passer à une variante (LPv3 ? chiffrement réglable dans GB 0.92) [H]. Huawei et Honor = un seul pilote dans
    Gadgetbridge → une famille [H].
- **Autres fabricants** : Health Connect couvre 7 marques sur 9 (Samsung, Garmin en écriture seule depuis 07/2025,
  Fitbit/Pixel, Zepp (26 types, 01/2025), Mi Fitness, Withings, Oura, Polar, Coros). **Fitbit Web API éteinte le
  30/10/2026**, Google Health API fermée aux nouveaux projets [V]. Garmin Connect Developer = entreprises approuvées.
  OAuth ouverts à un particulier : **Polar AccessLink (gratuit)** [V], **Whoop API v2** (abonnement) [V], Oura v2
  (OAuth, ≤ 10 utilisateurs sans validation) [T].
- **Gadgetbridge, familles de protocoles** [V] : Huawei/Honor (un pilote) ; Xiaomi : **Huami** (Mi Band ≤ 7,
  Amazfit anciens), **Zepp OS** (Balance, Bip 5, GTR/GTS 3–4…), **Xiaomi protobuf** (Mi Band 8–10, Redmi Watch 2–6,
  Watch S1–S4) ; Garmin **GFDI/protobuf** (+59 modèles en 0.94). Tous (sauf vieux Bip / Mi Band 3) exigent une clé
  d'authentification issue de l'app officielle.
- **BLE standard** : FC 0x180D (+ intervalles RR → VFC RMSSD), balance 0x181D / 0x181B, tensiomètre 0x1810,
  glycémie 0x1808 / CGM 0x181F, oxymètre 0x1822, thermomètre 0x1809, RSC / CSC / puissance / Fitness Machine.
  Appareils réels : ceintures Polar H10 / Garmin / Wahoo, montres Garmin en « diffusion FC », Omron (mesure courante
  en standard, historique propriétaire), balances Mi / Chipsea (données dans l'annonce, sans connexion). GHS (Generic
  Health Sensor, 2023) : pas encore de produit grand public trouvé.
- **Capacitor** : `@capacitor-community/bluetooth-le` **8.3.0** (28/09/2026, compatible Capacitor 8) : filtres
  services / nom / données fabricant / service data, `getBondedDevices()` ; pas d'arrière-plan (→ service natif).
  Companion Device Manager (Android 16 : `startObservingDevicePresence`) → réveil quand l'appareil revient à portée,
  plugin natif à écrire. Apps installées : `<queries>` par package + `PackageManager` (pas de `QUERY_ALL_PACKAGES`).
- **Humeur** : Emobot (CentraleSupélec, 2022) — voix, visage, mouvement, usage de l'écran, sommeil, activité ;
  validation intermédiaire ASCP 2026 : r = 0,895 avec la MADRS en intra-individuel, ≥ 7 jours valides sur 14 ;
  annonce de « Weekly Insights » (résumé en langage simple de la semaine). Réalité hors labo : AUC ~0,6–0,75 ; GLOBEM
  (UW, 2022) : les modèles généralisent mal d'une cohorte à l'autre → **l'écart à sa propre ligne de base** est la
  bonne approche. Mobilité GPS = meilleur signal passif (r ≈ −0,45 à −0,6 avec le PHQ-9, Saeb 2015). Kintsugi (voix)
  a fermé en 02/2026 en publiant ses modèles.
- **Conversations** : **Omi** = seul vraiment ouvert (open source, API REST `api.omi.me/v1/dev` avec clé
  personnelle, webhooks, SDK BLE autonome, transcription illimitée sur le téléphone en gratuit). **Plaud** : Developer
  Platform en bêta (05/2026), CLI, exports TXT/SRT/DOCX/PDF. **Limitless** racheté par Meta (12/2025), coupé dans
  l'UE. **Bee** racheté par Amazon, pas d'API. Micro du téléphone : service de premier plan `microphone` (Android 14+),
  lancé depuis l'app, notification permanente ; transcription locale (`SpeechRecognizer` hors ligne, Whisper.cpp,
  Vosk FR ~50 Mo). Droit FR : art. 226-1 Code pénal → rappel simple, sans bloquer.

### Idées classées (impact × faisabilité)

| # | Idée | Besoin servi | I | F | Score |
|---|---|---|---|---|---|
| I1 | **Guide « Montre Huawei → Gadgetbridge → Health Connect »** dans Connecteurs + détection des apps installées | Objets connectés, zéro saisie | 5 | 5 | 25 |
| I2 | **Lire plus de types Health Connect** (fréquence respiratoire, température, poids, tension, glycémie, VO2max ?) | Données brutes, radar maladie | 4 | 5 | 20 |
| I3 | **Assistant « Mes appareils »** : apps santé installées (`<queries>`) → connecteur conseillé + étapes | Autodétection | 5 | 4 | 20 |
| I4 | **Contexte automatique : météo, pression, qualité de l'air, pollen** (Open-Meteo, sans clé) | Déclencheurs (migraine, énergie, allergies) | 4 | 5 | 20 |
| I5 | **Radar maladie étape 2** : + respiration et température, « signes mineurs / nets », mode repos | Être prévenu tôt | 5 | 4 | 20 |
| I6 | **Temps d'écran et « téléphone au lit »** (UsageStatsManager) | Sommeil, humeur, zéro saisie | 5 | 4 | 20 |
| I7 | **Humeur estimée** : écart à la norme (sommeil, VFC, activité, écran, régularité) calibré sur les check-ins | Priorité n° 3 | 5 | 4 | 20 |
| I8 | **Couche BLE générique, étape 1 : profils standard** (FC + RR → VFC, balance, tensiomètre, thermomètre, oxymètre) | Données brutes, compatibilité large | 5 | 3 | 15 |
| I9 | **Résumé de la semaine en langage simple** (local, Gemini optionnel pour la rédaction) | Des actions, pas des graphiques | 4 | 4 | 16 |
| I10 | **Import Omi** (clé perso → conversations / mémoires → journal, repas évoqués, stress) | Conversations | 4 | 3 | 12 |
| I11 | **Calendrier → charge de la journée** (CalendarContract) | Stress / énergie | 4 | 4 | 16 |
| I12 | **Repas détectés dans la galerie** (nouvelles photos → « repas à 12 h 40 ? ») | Zéro saisie repas | 4 | 3 | 12 |
| I13 | **Tags avec intensité** (douleur 0–10, nombre de verres) + check-in depuis une notification / un widget | Saisie en un geste | 3 | 4 | 12 |
| I14 | **Import des exports constructeurs** (Huawei JSON RGPD, Garmin FIT, Samsung CSV, Oura CSV, Zepp CSV) | Historique, silos | 4 | 3 | 12 |
| I15 | **Mobilité / temps dehors** (activity recognition, nb de lieux, rayon, sans coordonnées précises) | Humeur (meilleur signal passif) | 4 | 3 | 12 |
| I16 | **Bilans sanguins par photo / PDF** (Gemini → biomarqueurs, courbes) | Relier le médical | 4 | 4 | 16 |
| I17 | **Journal vocal** (dictée → transcription locale → résumé, sentiment) | Conversations / humeur | 4 | 3 | 12 |
| I18 | **« Jours similaires »** (kNN sur le vecteur du jour, « et le lendemain ? ») | Comprendre | 3 | 5 | 15 |
| I19 | **Bilan pour le médecin** (PDF 30 / 90 jours, local) | Utilité concrète | 3 | 5 | 15 |
| I20 | **Pilote BLE Huawei direct** (à partir de `huawei-lpv2`, MIT) | Données brutes sans app tierce | 4 | 1 | 4 |
| I21 | **Recommandations matériel** : ceinture FC (Polar H10, RR → VFC fiable), tensiomètre BLE standard, balance | Mieux mesurer | 3 | 5 | 15 |

### Détail et pistes d'implémentation

**I1 — Guide Huawei → Health Connect (zéro code natif).**
Dans Plus → Connecteurs, une carte « Montre Huawei / Honor » : « Votre montre n'écrit pas dans Health Connect. Solution
gratuite : Gadgetbridge. » Étapes : (1) installer Gadgetbridge (F-Droid) ; (2) récupérer l'ID de compte Huawei
(17 chiffres) ; (3) retirer les permissions de Huawei Health **sans désappairer la montre** ; (4) appairer dans
Gadgetbridge avec la clé ; (5) Réglages → Intégrations → Health Connect, cocher les types, « Sync after device sync » ;
(6) revenir dans HealthTrack → synchroniser. Contreparties affichées : on quitte l'app Huawei au quotidien, le stress ne
passe pas, une mise à jour du firmware peut casser des fonctions. Liens externes via `@capacitor/app-launcher` (déjà
présent). Variante payante : Health Sync. Même schéma pour Xiaomi / Amazfit (Zepp et Mi Fitness écrivent déjà dans HC →
simple « activez Health Connect dans Zepp »).

**I2 — Types Health Connect manquants.** `@capgo/capacitor-health` 8.4.5 lit déjà `respiratoryRate`,
`bodyTemperature`, `basalBodyTemperature`, `weight`, `bodyFat`, `bloodPressure`, `bloodGlucose`, `height`
(vérifié dans `definitions.d.ts`), mais `READ_TYPES` n'en demande que 9. Ajouter les types, les entrées et la carte du
journal ; `SkinTemperatureRecord` (température cutanée nocturne, écrite par Gadgetbridge / Samsung / Oura) n'est pas
exposé par le plugin → petit ajout natif ou PR au plugin. Attention : demander de nouvelles permissions HC → la
synchro existante ne doit pas échouer si l'utilisateur refuse les nouvelles (tester).

**I3 — « Mes appareils » (autodétection).** Plugin natif minimal `InstalledApps.check(packages[])` +
`<queries>` dans le manifeste pour ~15 packages (Huawei Health `com.huawei.health`, Samsung Health, Garmin Connect,
Fitbit, Zepp, Zepp Life, Mi Fitness, Withings, Oura, Polar Flow, Whoop, Gadgetbridge, Health Sync, Health Connect —
**noms à vérifier**). Table `appCatalog` : package → écrit-il dans HC ? quels types ? connecteur conseillé + guide.
Écran : « Détecté : Huawei Health → vos données n'arrivent pas dans Health Connect → [Guide] ». Plus tard :
`getBondedDevices()` (BLE) pour lister montres / balances appairées au téléphone.

**I4 — Contexte environnemental.** Open-Meteo (gratuit, sans clé) : température, pression, humidité, ensoleillement,
`european_aqi`, pollens (`air-quality-api`). Position **approximative** (ville, arrondie à 0,1°) choisie une fois, un
appel par jour + historique (`archive-api`) → variables des Analyses (« pression en baisse », « pollen élevé »). Seul
une position grossière sort du téléphone, aucune donnée de santé → conforme à la règle local-first ; le dire dans
Paramètres.

**I5 — Radar maladie étape 2.** Ajouter respiration (HC `respiratoryRate`, souvent nocturne) et température aux
signaux de `radar.js` ; niveaux « signes légers / nets » à la manière d'Oura ; proposer « journée calme » ; jamais de
diagnostic. Dépend d'I2.

**I6 — Écran et téléphone au lit.** Plugin `@capgo/capacitor-android-usagestatsmanager` (à vérifier) ou natif ;
permission spéciale accordée dans les réglages Android (guide en un écran). Variables : temps d'écran / j, après
22 h, après l'heure de coucher (sommeil HC), dernier usage avant l'endormissement, premier usage au réveil (→ sommeil
estimé sans montre), catégories (réseaux sociaux, jeux). Études : usage au lit ↔ latence d'endormissement et VFC.

**I7 — Humeur estimée (style Emobot, sur l'appareil).** Score quotidien « humeur estimée » = régression personnelle
(Ridge déjà disponible) des check-ins sur l'écart à la norme de : sommeil, régularité, VFC, FC repos, pas, temps
dehors, écran tard, météo ; affiché avec une fourchette et « estimation, pas un diagnostic » ; ≥ 7 jours valides /14
(seuil Emobot) ; sert aussi à **pré-remplir le check-in** (un tap pour confirmer → saisie en un geste). Étapes
suivantes : sentiment du journal / des conversations, prosodie (plus tard, fiabilité faible).

**I8 — Couche BLE générique.** `@capacitor-community/bluetooth-le` 8.3. Architecture :
`DeviceDriver { id, kind, match(fingerprint) → score, capabilities, requirements, connect, sync(since), stream }` ;
registre ordonné (BLE standard par service SIG → pilotes fabricant → « app installée → HC » → cloud OAuth) ; empreinte
= nom, UUID de services annoncés / découverts, company ID, service data, DIS (0x180A), état d'appairage ; garde-fou :
**ne jamais se connecter à une montre gérée par son app officielle** ; appareil inconnu → empreinte stockée en local
(sans adresse MAC) + export JSON pour ajouter un pilote. Étape 1 = FC 0x180D (mesure + RR → VFC RMSSD sur 5 min, idéal
avec une ceinture), puis balance / tensiomètre / thermomètre (indications, RACP pour l'historique). Tester le parsing
avec des trames d'octets en TDD (pas besoin d'appareil).

**I9 — « Votre semaine en clair ».** Agrégats calculés localement (moyennes vs norme, tags, liens solides) → texte
gabarit en français ; Gemini (clé utilisateur) seulement pour reformuler, chiffres vérifiés (déjà R#13).

**I10 — Import Omi.** Clé développeur personnelle saisie dans Paramètres, `GET /v1/dev/user/conversations` (≈ 60
lectures / h), stockage local (titre, résumé, horodatage, catégories) → carte « Conversations » du journal ; extraction
optionnelle (repas évoqués, sport, stress) ; rappel « l'enregistrement d'autrui peut nécessiter leur accord ».
Plaud : attendre la sortie de bêta du SDK ; en attendant, import de fichiers TXT exportés.

**I14 — Imports de fichiers constructeurs.** Garmin FIT (format documenté, SDK FIT officiel), Huawei JSON (RGPD,
schéma à découvrir sur un vrai export du propriétaire), Samsung CSV, Oura CSV. Aperçu avant import (même UX que
l'import sûr), dédoublonnage avec HC.

**I20 — Pilote BLE Huawei.** Seulement après I1/I3/I8 ; partir de `huawei-lpv2` (MIT) et de la conférence eh19,
vérifier sur la GT 6 Pro (chiffrement, LPv3 ?) ; jamais de code Gadgetbridge (AGPL). Contrainte : la montre ne parle
qu'à une app à la fois → mode « HealthTrack remplace Huawei Health ».

### Sources (consultées le 11/10/2026)

- Gadgetbridge : https://gadgetbridge.org/blog/release-0_88_00/ (12/12/2025) ; https://gadgetbridge.org/basics/topics/huawei-honor/ ; https://gadgetbridge.org/basics/pairing/huawei-honor-pairing/ ; https://gadgetbridge.org/basics/integrations/health-connect/ ; https://gadgetbridge.org/blog/release-0_94_00/ (17/09/2026) ; https://gadgetbridge.org/basics/topics/xiaomi-protobuf/ ; https://codeberg.org/Freeyourgadget/Gadgetbridge/issues/5428 (28/09/2025)
- Huawei : https://healthsync.app/f-a-q/ ; https://www.fitmesh.fit/en/blog/huawei-health-health-connect-sync (20/06/2026, éditeur intéressé) ; https://consumer.huawei.com/ie/support/data-act/ (18/05/2026) ; https://github.com/zyv/huawei-lpv2 (MIT) ; https://media.ccc.de/v/eh19-186-all-your-fitness-data-belongs-to-you-reverse-engineering-the-huawei-health-android-app
- Fabricants : https://developers.google.com/health/reference/rest/v4beta/users ; https://developer.samsung.com/health/data/release-note.html ; https://developer.garmin.com/gc-developer-program/overview ; https://www.polar.com/accesslink-api/ ; https://developer.whoop.com/docs/developing/overview ; https://support.ouraring.com/hc/en-us/articles/360025441594 ; https://gadgetsandwearables.com/2025/01/24/zepp-health-connect/
- BLE / Android : https://github.com/capacitor-community/bluetooth-le ; https://developer.android.com/develop/connectivity/bluetooth/companion-device-pairing ; https://developer.android.com/training/package-visibility/declaring ; https://www.bluetooth.com/specifications/specs/generic-health-sensor-profile/ ; https://dcrainmaker.com/2020/06/tidbit-bluetooth-broadcasting.html
- Humeur : https://www.biospace.com/press-releases/nrx-pharmaceuticals-nasdaq-nrxp-strategic-partner-emobot-presents-late-breaking-clinical-validation-of-the-emocare-depression-thermometer-at-ascp-2026 (28/05/2026) ; https://www.linkedin.com/company/emobot/ ; https://ubicomplab.cs.washington.edu/publications/globem ; https://peerj.com/articles/2537 ; https://mental.jmir.org/2026/1/e85319 ; https://bhbusiness.com/2026/02/11/mental-health-voice-biomarker-kintsugi-closes-makes-all-technology-and-research-public/ ; https://docs.sahha.ai/docs/products/scores/mental ; https://pmc.ncbi.nlm.nih.gov/articles/PMC9643910/
- Conversations : https://docs.omi.me/doc/developer/api/overview ; https://www.omi.me/pricing ; https://docs.plaud.ai/plaud-mcp-cli/cli ; https://www.neowin.net/news/meta-acquires-ai-startup-limitless-ending-sales-of-its-popular-pendant-wearable ; https://www.retaildive.com/news/amazon-acquires-ai-wearables-company-bee/753810/ ; https://developer.android.google.cn/develop/background-work/services/fg-service-types ; https://developers.google.com/ml-kit/genai
- Besoins / apps : https://forum.quantifiedself.com/t/personal-dashboards-for-self-tracking-data/8202?page=5 ; https://forum.quantifiedself.com/t/improving-my-mental-and-physical-health-through-data-where-to-start/8686 ; https://www.sensai.fit/blog/wearable-apple-health-integration-what-syncs-oura-whoop-garmin ; https://techcrunch.com/2026/05/07/googles-9-99-per-month-ai-health-coach-launches-may-19/ ; https://www.techadvisor.com/article/2575433/oura-symptom-radar-i-should-have-listened-to-new-smart-ring-feature.html ; https://bmjopen.bmj.com/content/12/6/e058274 ; https://www.wareable.com/health-and-wellbeing/whoop-advanced-labs-blood-test-uploads-global-rollout-official ; https://open-meteo.com/en/docs/air-quality-api ; https://kb.exist.io/article/55-will-exist-find-correlations-across-multiple-days ; https://www.eff.org/deeplinks/2026/07/most-smart-watches-rings-and-bands-lack-basic-transparency-reports-and-key-privacy

### À creuser au prochain run idées

- Reddit (r/Huawei, r/Gadgetbridge, r/QuantifiedSelf) par un autre chemin : retours réels sur GT 6 Pro + Gadgetbridge.
- Noms de packages exacts (Huawei Health, Health Sync) et liste des types HC écrits par Samsung / Mi Fitness.
- Gemini Nano (ML Kit GenAI) sur Galaxy A56 : disponible ou non ? (conditionne résumé / sentiment hors ligne).
- Règles Google Play pour `PACKAGE_USAGE_STATS` (sans objet tant que l'APK est distribué via GitHub).
- Bagues (Oura, RingConn, Ultrahuman, Samsung Ring), CGM grand public (Stelo, Lingo) : accès aux données brutes.

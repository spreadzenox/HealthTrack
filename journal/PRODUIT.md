# Chantier produit — HealthTrack sur Google Play

> Créé au run du 20/10/2026 22:30 (Paris) à partir des **décisions produit du propriétaire du 20/10/2026 au soir**
> (prompt de la routine). Elles remplacent la consigne du 18/10 au soir comme cadre général. Ce fichier est tenu à
> jour à chaque run : décisions, jalons et leur état, inventaire, **actions du propriétaire**.
> En cas de contradiction, le prompt de la routine prime.

## 1. Décisions (résumé fidèle)

| Sujet | Décision |
|---|---|
| **Objectif** | Un vrai produit vendable sur Google Play (side project qui rapporte un peu), compréhensible en 30 s, sans jamais casser ce qui marche. |
| **Positionnement** | Le **bien-être** (plus « l'humeur » dans les textes visibles) ; « **local par défaut, IA optionnelle et clairement signalée** » (jamais « 100 % privé » : l'analyse Gemini envoie des données) ; **toutes les montres** (Health Connect : Garmin, Oura, Withings, Samsung, Xiaomi, Fitbit… + **Huawei en direct**, différenciateur : Huawei n'écrit pas dans Health Connect). L'interconnexion n'est plus en pause. |
| **Cible** | Porte d'entrée : personnes atteintes du **SII** (intestin irritable) ; bien-être global en fond ; passionnés de données (quantified self) en ambassadeurs (export en un geste, toutes les montres, local). Plus tard seulement : SII + cycle, histamine / intolérances, sportifs. |
| **Angle SII** | Délais pris en compte (fenêtres 2–48 h réglables) ; honnêteté statistique (« pas encore assez de données », échantillon minimal, comparaisons multiples) ; collecte quasi passive ; saisie repas / symptômes en un geste, horodatée ; réintroduction FODMAP guidée (auto-tests par groupe) ; rapport PDF pour le gastro-entérologue / la diététicienne. Français d'abord, anglais ensuite. |
| **Modèle économique** | Abonnement **4,99 €/mois** ou **29,99 €/an** (annuel mis en avant : « 2,50 €/mois »), essai gratuit **14 j** sur l'annuel (rappel 2 j avant la fin), **Google Play Billing** (décision du 20/10 : pas Stripe pour l'app Play — Google prend 10 % sur les abonnements quel que soit le moyen de paiement depuis le 30/06/2026, +5 % avec Play Billing, mais gère TVA, remboursements, essai et relances ; Stripe éventuellement plus tard pour la sideload ou le web). Période de grâce + suspension de compte activées. **Collecter est gratuit, comprendre est payant.** |
| **Gratuit pour toujours** | Journal et saisie en un geste, imports de toutes les montres, estimation automatique du bien-être, graphiques, export CSV / JSON, crédits IA (ex. 10 à l'inscription + 15 / mois, non cumulables, compteur visible « X analyses restantes, renouvellement le … », dernier résultat gratuit toujours montré). **Ne jamais bloquer une fonction locale.** |
| **Premium** | Analyses personnelles avec délais (« ce qui va avec vos bons et mauvais jours »), réintroduction FODMAP guidée, rapport PDF médecin, IA illimitée avec plafond raisonnable (~10 / jour). |
| **Parcours** | Onboarding court (8–12 écrans : objectif — ventre / énergie et sommeil / tout comprendre —, quoi suivre, montres, import de l'historique Health Connect) ; « aha » du jour 1 (30 derniers jours résumés, première estimation du bien-être si caméra) ; paywall soft passable en fin d'onboarding avec l'essai ; vrai paywall au moment de la valeur (≈ 14–21 j : « 2 pistes repérées… », aperçu flouté, « Débloquer »). |
| **Variantes** | Deux flavors depuis le même code ; la variante play a **son propre applicationId, neutre et définitif** (indépendant du nom commercial), distinct de la sideload pour que les deux coexistent. **play** (sans `REQUEST_INSTALL_PACKAGES` ni auto-mise à jour ; lecture du visage optionnelle et conforme aux règles Play sur les services de premier plan caméra ; divulgation avant chaque permission sensible ; Data safety + déclaration apps de santé préparées) et **sideload** (version complète actuelle). Catégorie **Health & Fitness**, pas Medical. **applicationId play choisi le 21/10 : `fr.jpesquet.sante`** — préfixe du développeur (compte Play « jpesquet » ; Google n'exige pas de posséder le domaine), mot générique « santé » sans nom commercial ; ne pourra jamais changer une fois l'app créée sur Play (P8). La sideload garde `com.healthtrack.app` (sinon les mises à jour ne s'installeraient plus par-dessus). |
| **IA (Gemini)** | **Clé du développeur jamais dans l'app.** Décision du 20/10 : **Vertex AI dans l'UE** (europe-west1) appelé par un **relais Cloud Run** sous l'identité du compte de service `relay-runtime` — **aucune clé API Gemini n'existe ni ne doit être créée**. Le relais vérifie l'abonnement (Play Developer API / RTDN via `play-rtdn`), décompte les crédits (Play Integrity), supprime l'EXIF, ne stocke rien, Flash-Lite, plafond global par jour et par utilisateur. Déployé par la CI (voir `INFRA.md`). Âge minimum 18 ans. La clé saisie par l'utilisateur reste possible en sideload. |
| **Conformité** | Jamais « diagnostiquer », « prédire une crise », « traiter » ; toujours « comprendre vos tendances », « estimation, pas un diagnostic ». Visage : opt-in explicite + transparence (AI Act, reconnaissance d'émotions). Brouillons politique de confidentialité, CGU / CGV, mentions légales dans `journal/legal/` (« à faire valider par un juriste »). Oura via Health Connect seulement. |
| **Design** | Identité **« Clair et précis » validée le 20/10 au soir** : tout est dans [`DESIGN.md`](DESIGN.md) (couleurs, Figtree + IBM Plex Mono, formes, icône « H nuit », maquettes Accueil / Onboarding / Pistes / Paywall). Appliquée par étapes testables (jalon 2 bis). |
| **Nom** | « HealthTrack » est **provisoire** (« Halia » étudié, pas retenu). Nom affiché centralisé (une seule source) ; aucun nom commercial dans les identifiants techniques définitifs. |
| **Infrastructure** | Aucune donnée d'accès dans la session : tout passe par GitHub Actions sur `main` (Workload Identity Federation). Projet GCP `healthtrack-824b26`, budget 20 €/mois. Détail : [`INFRA.md`](INFRA.md). |

Règles permanentes inchangées : data science D5 (Y ≠ X, ordre temporel, comparaisons multiples, n minimal,
corrélation ≠ causalité) et D6 (science personnelle, normes — FODMAP compris — seulement comme hypothèses de départ) ;
montre en maintenance (A.1–A.3) ; bien-être automatique = pilier gratuit, poursuivi après les jalons prioritaires.

## 2. Jalons (ordre de livraison conseillé) et état

| # | Jalon | État | Notes |
|---|---|---|---|
| 0 | Signalement 20/10 19:05 (mise à jour bloquée) | ✅ corrigé (v188) — à confirmer par le propriétaire | Mécanisme réservé à la future variante sideload. I129 (alléger l'APK, −18 Mo) reste ouvert. |
| 1 | `journal/PRODUIT.md` | ✅ 20/10 22:30 | Ce fichier. |
| 2 | Nettoyage du « sac à features » | 🟡 commencé 20/10 22:30 | ✅ 2a vocabulaire : « humeur » → « bien-être » dans tous les textes visibles + test-garde `src/data/wording.test.js` (humeur, « 100 % privé », termes médicaux). Suite : 2b inventaire chiffré (ci-dessous) → décider masquer / fusionner / déplacer ; 2c navigation simplifiée ; ✅ 2d tokens → fait au jalon 2 bis (i). Aucune donnée perdue. |
| 2 bis | Identité visuelle (`DESIGN.md`) | 🟡 21/10 00:30 | ✅ `DESIGN.md` ; ✅ (i) tokens + polices embarquées + thème clair par défaut (sombre en option) ; ⬜ (ii) icône + écran de démarrage ; ⬜ (iii) Accueil ; puis chaque écran touché par le chantier. |
| 3 | Variantes de build play / sideload | 🟡 **3a livré le 21/10 02:30** (v191) ; 3b à faire | **3a** : `productFlavors` `sideload` (`com.healthtrack.app`, inchangé, mise à jour en un clic) et `play` (`fr.jpesquet.sante`, neutre et définitif, sans `REQUEST_INSTALL_PACKAGES`, plugin de mise à jour non enregistré) ; drapeau `VITE_DISTRIBUTION` (bandeau masqué en play, aucune requête à GitHub) ; versionCode croissant ; check « Build APK » des PR qui construit aussi l'AAB play et vérifie les manifestes ; workflow **« Play — AAB »** sur `main` (WIF → Secret Manager → AAB signé en artefact, échec clair tant que P9 n'est pas fait). **3b** : étude et choix de l'option caméra la plus sûre pour play (services de premier plan), divulgations avant permissions sensibles, revue des autres permissions sensibles du manifeste ; puis envoi automatique en test interne (après P10/P11). |
| 4 | Onboarding + « aha » du jour 1 | ⬜ | Dépend de 2 (écrans à garder). |
| 5 | Analyses personnelles avec délais + honnêteté statistique | ⬜ | Le moteur N-of-1 existe déjà (BH, n effectif, week-end, effets décalés en jours) : il manque les **fenêtres en heures (2–48 h) repas → symptômes**, et la saisie de symptômes digestifs. |
| 6 | Abonnement Play Billing, paywalls, crédits ; puis relais Vertex AI | ⬜ | Relais Cloud Run (`relay-runtime`, europe-west1), code + tests dans le dépôt, **déployé par la CI** sur `main` ; produits Play créés par la CI quand le profil de paiement existe. |
| 7 | Réintroduction FODMAP guidée + rapport PDF | ⬜ | |
| 8 | Imports 100 % Health Connect + permission d'historique | ⬜ | Google Fit s'arrête fin 2026. |
| 9 | i18n + anglais | ⬜ | |
| 10 | Fiche Play (textes FR, captures, Data safety, déclarations) | ⬜ | |

## 3. Inventaire de l'existant (premier jet, 20/10 22:30) — base du jalon 2

Onglets : **Accueil** · **Repas** · **Nutrition** · **Analyses** · **Plus** (Données, Connecteurs, Paramètres,
Nouveautés).

| Écran | Contenu principal | Sert le parcours SII + bien-être ? | Piste (à décider au jalon 2b) |
|---|---|---|---|
| Accueil | Bandeaux (mise à jour, nouveautés), compteur cigarettes (si utilisé), saisie du bien-être, **Bien-être estimé** (visage), Forme, graphiques du bien-être, journal par jour | Oui (cœur) | Alléger : un résumé du jour + saisie en un geste (repas / symptôme / bien-être) en tête ; graphiques et radar plus bas ou dans Analyses. |
| Repas | Photo → analyse Gemini, repas enregistrés, journal des repas | Oui (porte SII) | Ajouter la saisie de **symptômes digestifs** horodatée à côté (jalon 5). Signaler clairement l'IA. |
| Nutrition | Tables nutritionnelles, apports | Partiel | Candidat à fusionner dans Repas (sous-onglet) pour libérer un onglet. |
| Analyses | Corrélations, tags, effets décalés, section visage, méthode | Oui (valeur payante) | Réorganiser autour de « ce qui va avec vos bons et mauvais jours » ; le futur paywall s'y place. |
| Connecteurs | Mes appareils, Lecture du visage, montre Huawei (BLE), Health Connect, Withings, temps d'écran | Oui (« toutes vos montres ») | Simplifier : une liste « Vos sources » ; diagnostics repliés. |
| Paramètres | Clé Gemini, cigarettes, diagnostic | Partiel | La clé Gemini disparaîtra côté play (relais) ; garder en sideload. |
| Données | Export / import JSON, CSV | Oui (ambassadeurs) | Garder, « export en un geste ». |
| Nouveautés | Changelog | Utile | Garder (Plus). |

Données à ne jamais perdre en masquant : toutes les entrées IndexedDB (repas, bien-être, cigarettes, rafales du
visage, montre, Health Connect…) restent stockées et exportées même si leur écran est masqué.

## 4. Actions du propriétaire (jamais faites par la routine) — la plus débloquante d'abord

| # | Action | État | Pas à pas |
|---|---|---|---|
| P1 | Installer la v188+ à la main une fois, puis tester le bouton de mise à jour | ⬜ | Sur le téléphone, ouvrir dans Chrome **https://github.com/spreadzenox/HealthTrack/releases/latest** → « Assets » → `HealthTrack-vNNN.apk` → ouvrir → autoriser ce navigateur si demandé → « Mettre à jour ». À la version suivante : bouton du bandeau. |
| P3 | **Compte développeur Google Play** « jpesquet » | 🟡 créé le 20/10 ; vérification d'identité en cours, puis validation du téléphone | Attendre l'e-mail de Google ; Play Console → « Valider votre numéro de téléphone ». |
| P8 | **Créer l'app** dans la Play Console | ⬜ (après P3) | « Créer une application » → nom : *HealthTrack* (provisoire, modifiable) · langue par défaut : **Français – fr-FR** · Application · **Gratuite** · cocher les déclarations. |
| P9 | **Keystore d'envoi** de la variante play dans Secret Manager | ⬜ **à faire maintenant** (le workflow « Play — AAB » est prêt et l'attend) | Dans **Cloud Shell** (console.cloud.google.com, projet `healthtrack-824b26`, bouton `>_` en haut à droite), coller ligne par ligne : ① `keytool -genkeypair -v -storetype PKCS12 -keystore upload.p12 -alias upload -keyalg RSA -keysize 4096 -validity 10000 -dname "CN=jpesquet, C=FR"` (choisir un mot de passe long, le noter dans votre gestionnaire de mots de passe) ; ② `read -s -p "Mot de passe : " P && printf '%s' "$P" \| gcloud secrets create android-upload-keystore-password --project=healthtrack-824b26 --replication-policy=user-managed --locations=europe-west1 --data-file=-` ; ③ `base64 -w0 upload.p12 \| gcloud secrets create android-upload-keystore --project=healthtrack-824b26 --replication-policy=user-managed --locations=europe-west1 --data-file=-` ; ④ `for s in android-upload-keystore android-upload-keystore-password; do gcloud secrets add-iam-policy-binding $s --project=healthtrack-824b26 --member=serviceAccount:gh-deployer@healthtrack-824b26.iam.gserviceaccount.com --role=roles/secretmanager.secretAccessor; done` ; ⑤ menu `⋮` de Cloud Shell → **Télécharger** → `upload.p12` (copie hors ligne, avec le mot de passe), puis `rm upload.p12` ; ⑥ GitHub → Actions → **« Play — AAB »** → *Run workflow* (branche `main`) : il doit passer au vert et afficher l'empreinte du certificat. |
| P10 | **Premier envoi manuel de l'AAB** en test interne (Google l'impose pour une nouvelle app) | ⬜ (après P8 + P9) | GitHub → Actions → dernier run vert de **« Play — AAB »** → en bas, artefact **HealthTrack-play-NNN** (zip contenant `HealthTrack-play-NNN.aab`, à dézipper) → Play Console → votre app → Tester → **Test interne** → Créer une version → **accepter la signature d'app par Google Play** → importer l'`.aab` → nom de version : laisser celui proposé → Enregistrer → Vérifier → Déployer. Ajouter votre adresse Gmail comme testeur (onglet Testeurs). L'app s'installe à côté de la version actuelle (identifiant différent, données séparées). |
| P11 | **Inviter les comptes de service** dans « Utilisateurs et autorisations » | ⬜ (après P10) | Inviter `gh-deployer@healthtrack-824b26.iam.gserviceaccount.com` : pistes de test, fiche du Store, produits/abonnements — **pas la production**. Plus tard `relay-runtime@healthtrack-824b26.iam.gserviceaccount.com` : « Voir les données financières » + « Gérer les commandes et les abonnements ». |
| P12 | Recruter **12 testeurs (idéalement 15)** pour le test fermé de 14 jours | ⬜ | Commencer dès maintenant (entourage, communautés SII). Il faut leurs adresses Gmail. |
| P13 | **Profil de paiement**, compte bancaire, informations fiscales | ⬜ | Play Console → Paramètres → Profil de paiement. Requis pour créer les abonnements. |
| P14 | **RTDN** et **liaison Play Integrity** | ⬜ | Play Console → Monétisation → Notifications en temps réel : sujet `projects/healthtrack-824b26/topics/play-rtdn`. Intégrité de l'app → lier le projet Cloud `healthtrack-824b26`. |
| P2 | Vérifier que l'activité déclarée de l'**auto-entreprise** couvre la vente d'une app | ⬜ | Sur le site de l'URSSAF / guichet unique : activité « édition de logiciels applicatifs » ou équivalent ; sinon déclarer une modification. |
| P15 | **Nom définitif**, recherche d'antériorité, dépôt de marque **INPI** | ⬜ | Le nom affiché se change ensuite en un commit. |
| P5 | **Validation juridique** : AI Act (reconnaissance d'émotions), RGPD (art. 9), non-dispositif médical, CGU / CGV, confidentialité | ⬜ | Brouillons à venir dans `journal/legal/`. |
| P6 | Budget publicitaire (petits tests Google Ads ciblés) | ⬜ | Après la fiche Play ; organique d'abord. |
| ~~P4~~ | ~~Projet Google Cloud + clé Gemini~~ | ✅ 20/10 | Projet `healthtrack-824b26` créé avec WIF et comptes de service ; **aucune clé Gemini** (Vertex AI). |
| ~~P7~~ | ~~Identité visuelle~~ | ✅ 20/10 | Validée → `DESIGN.md`. |

## 5. Historique

- **20/10 22:30** — fichier créé ; jalon 1 ✅ ; jalon 2a (vocabulaire bien-être + test-garde) livré.
- **21/10 00:30** — sections INFRASTRUCTURE et IDENTITÉ VISUELLE du prompt reportées (`INFRA.md`, `DESIGN.md`) ; décisions mises à jour (Vertex AI sans clé, Play Billing, essai 14 j, applicationId play, nom provisoire) ; actions du propriétaire refaites ; jalon 2 bis (i) livré.
- **21/10 02:30** — jalon 3a livré : variantes `sideload` / `play` (`fr.jpesquet.sante`), workflow « Play — AAB » sur `main` (attend P9) ; P9 et P10 détaillés pas à pas.

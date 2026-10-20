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
| **Modèle économique** | Abonnement **4,99 €/mois** ou **29,99 €/an** (annuel mis en avant : « 2,50 €/mois »), essai gratuit 7–14 j sur l'annuel, Google Play Billing (période de grâce + suspension). **Collecter est gratuit, comprendre est payant.** |
| **Gratuit pour toujours** | Journal et saisie en un geste, imports de toutes les montres, estimation automatique du bien-être, graphiques, export CSV / JSON, crédits IA (ex. 10 à l'inscription + 15 / mois, non cumulables, compteur visible « X analyses restantes, renouvellement le … », dernier résultat gratuit toujours montré). **Ne jamais bloquer une fonction locale.** |
| **Premium** | Analyses personnelles avec délais (« ce qui va avec vos bons et mauvais jours »), réintroduction FODMAP guidée, rapport PDF médecin, IA illimitée avec plafond raisonnable (~10 / jour). |
| **Parcours** | Onboarding court (8–12 écrans : objectif — ventre / énergie et sommeil / tout comprendre —, quoi suivre, montres, import de l'historique Health Connect) ; « aha » du jour 1 (30 derniers jours résumés, première estimation du bien-être si caméra) ; paywall soft passable en fin d'onboarding avec l'essai ; vrai paywall au moment de la valeur (≈ 14–21 j : « 2 pistes repérées… », aperçu flouté, « Débloquer »). |
| **Variantes** | Deux flavors : **play** (sans `REQUEST_INSTALL_PACKAGES` ni auto-mise à jour ; lecture du visage optionnelle et conforme aux règles Play sur les services de premier plan caméra ; divulgation avant chaque permission sensible ; Data safety + déclaration apps de santé préparées) et **sideload** (version complète actuelle). Catégorie **Health & Fitness**, pas Medical. |
| **IA (Gemini)** | API payante obligatoire ; **la clé du développeur jamais dans l'app** → petit **serveur relais** (Cloud Run / Functions UE ou Vertex AI UE) : garde la clé, vérifie l'abonnement (Play Developer API / RTDN), décompte les crédits (Play Integrity), supprime l'EXIF, ne stocke rien, modèle par défaut le moins cher adapté (Flash-Lite). Code + IaC dans le dépôt, sans secret. Âge minimum 18 ans. |
| **Conformité** | Jamais « diagnostiquer », « prédire une crise », « traiter » ; toujours « comprendre vos tendances », « estimation, pas un diagnostic ». Visage : opt-in explicite + transparence (AI Act, reconnaissance d'émotions). Brouillons politique de confidentialité, CGU / CGV, mentions légales dans `journal/legal/` (« à faire valider par un juriste »). Oura via Health Connect seulement. |
| **Design** | Identité visuelle travaillée à part (propriétaire + orchestrateur). Tant que `journal/DESIGN.md` n'existe pas : ne pas refaire l'identité ; structure, parcours, textes ; **centraliser couleurs / typo / espacements en tokens**. |

Règles permanentes inchangées : data science D5 (Y ≠ X, ordre temporel, comparaisons multiples, n minimal,
corrélation ≠ causalité) et D6 (science personnelle, normes — FODMAP compris — seulement comme hypothèses de départ) ;
montre en maintenance (A.1–A.3) ; bien-être automatique = pilier gratuit, poursuivi après les jalons prioritaires.

## 2. Jalons (ordre de livraison conseillé) et état

| # | Jalon | État | Notes |
|---|---|---|---|
| 0 | Signalement 20/10 19:05 (mise à jour bloquée) | ✅ corrigé (v188) — à confirmer par le propriétaire | Mécanisme réservé à la future variante sideload. I129 (alléger l'APK, −18 Mo) reste ouvert. |
| 1 | `journal/PRODUIT.md` | ✅ 20/10 22:30 | Ce fichier. |
| 2 | Nettoyage du « sac à features » | 🟡 commencé 20/10 22:30 | ✅ 2a vocabulaire : « humeur » → « bien-être » dans tous les textes visibles + test-garde `src/data/wording.test.js` (humeur, « 100 % privé », termes médicaux). Suite : 2b inventaire chiffré (ci-dessous) → décider masquer / fusionner / déplacer ; 2c navigation simplifiée ; 2d tokens de design (`index.css` → variables). Aucune donnée perdue. |
| 3 | Variantes de build play / sideload | ⬜ | `productFlavors` Gradle, manifeste play sans `REQUEST_INSTALL_PACKAGES`, bandeau de mise à jour masqué en play (drapeau de build côté JS), CI qui construit les deux (release publiée = sideload). Étudier l'option caméra la plus sûre pour play. |
| 4 | Onboarding + « aha » du jour 1 | ⬜ | Dépend de 2 (écrans à garder). |
| 5 | Analyses personnelles avec délais + honnêteté statistique | ⬜ | Le moteur N-of-1 existe déjà (BH, n effectif, week-end, effets décalés en jours) : il manque les **fenêtres en heures (2–48 h) repas → symptômes**, et la saisie de symptômes digestifs. |
| 6 | Abonnement Play Billing, paywalls, crédits ; puis serveur relais Gemini | ⬜ | Relais : code + IaC sans secret ; déploiement = action du propriétaire. |
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

## 4. Actions du propriétaire (jamais faites par la routine)

| # | Action | État | Détail |
|---|---|---|---|
| P1 | Installer la v188+ à la main depuis le navigateur du téléphone (une fois), puis tester le bouton vers la v189 (publiée le 20/10, 33,6 Mo) | ⬜ | https://github.com/spreadzenox/HealthTrack/releases/latest → Assets → `HealthTrack-vNNN.apk`. Voir le résumé de la semaine. |
| P2 | Statut **micro-entreprise** (vendeur sur Play, factures) | ⬜ | Pas à pas à rédiger au jalon 6. |
| P3 | **Compte développeur Google Play** (25 $ une fois) ; adresse publique du vendeur ; pour un compte personnel : **test fermé 12 testeurs × 14 jours** avant la production | ⬜ | Recruter les 12 testeurs tôt (entourage, communautés SII). |
| P4 | **Projet Google Cloud** + facturation + **clé Gemini payante** (région UE) ; déployer le relais quand son code sera prêt | ⬜ | Étapes écrites au jalon 6. |
| P5 | **Validation juridique** : AI Act (reconnaissance d'émotions), RGPD (données de santé, art. 9), statut non-dispositif médical, CGU / CGV, politique de confidentialité | ⬜ | Brouillons à venir dans `journal/legal/`. |
| P6 | Budget publicitaire (petits tests Google Ads ciblés) | ⬜ | Après la fiche Play. Acquisition organique d'abord (APSSII, Carenity, diététiciens, micro-créateurs, Reddit, Product Hunt). |
| P7 | Identité visuelle (icône, palette, typo, maquettes) avec l'orchestrateur → `journal/DESIGN.md` | ⬜ | La routine prépare les tokens. |

## 5. Historique

- **20/10 22:30** — fichier créé ; jalon 1 ✅ ; jalon 2a (vocabulaire bien-être + test-garde) livré.

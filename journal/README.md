# Journal de bord de Claude — HealthTrack

## 📅 Semaine en cours — S43 (lundi 19 → dimanche 25 octobre 2026)

> Résumé tenu à jour à chaque run : **c'est ce que lit le propriétaire chaque semaine.**
> Le premier run d'une nouvelle semaine archive ce bloc dans `semaines/AAAA-Sww.md` et en ouvre un neuf.
> Semaine précédente : [`semaines/2026-S42.md`](semaines/2026-S42.md) (montre GT 6 Pro en direct, nettoyage,
> performance, puis lancement de la Lecture du visage ; v98 → v168).

**🧭 Nouveau cadre depuis vos décisions produit du 20/10 au soir : faire de HealthTrack un produit vendable sur
Google Play.** Tout est consigné dans [`PRODUIT.md`](PRODUIT.md) : décisions (bien-être, « local par défaut, IA
optionnelle et clairement signalée », toutes les montres dont Huawei en direct ; porte d'entrée SII ; abonnement
4,99 €/mois ou 29,99 €/an, « collecter est gratuit, comprendre est payant » ; variantes play / sideload ; relais
Gemini), les **10 jalons** et leur état, un **premier inventaire des écrans**, et la liste **« Actions du
propriétaire »** (micro-entreprise, compte développeur Play et ses 12 testeurs × 14 jours, projet Google Cloud et clé
Gemini payante, validation juridique, budget pub, identité visuelle). Le bien-être automatique reste un pilier
gratuit, mais n'est plus le seul chantier.

**Run du 20/10 22:30 — premier pas du chantier produit.** ① `PRODUIT.md` créé (jalon 1). ② Jalon 2 commencé :
**« humeur » devient « bien-être » dans tous les textes de l'app** — la carte de l'accueil s'appelle **« Bien-être
estimé »**, les Analyses « Avec votre bien-être estimé (visage) », la carte « Lecture du visage » et le temps d'écran
aussi. Rien ne change dans vos données ni dans les calculs. Un test automatique empêche désormais le retour du mot
« humeur », de « 100 % privé » et de termes médicaux interdits (« diagnostiquer », « prédire une crise »…) dans le
code de l'app. Ce changement a publié la **v189** (33,6 Mo) : c'est elle qui vous servira à **tester le nouveau bouton de mise à
jour** depuis la v188 (voir ci-dessous). Prochain run de code : inventaire chiffré et propositions de nettoyage
(masquer / fusionner / déplacer, navigation simplifiée), puis tokens de design.

**Run du 21/10 00:30 — la nouvelle identité visuelle arrive (étape 1 sur 3).** Ce que vous verrez dans la
**v190** (publiée, 33,7 Mo, installable avec le bouton du bandeau) : **l'app passe en clair** — fond blanc, texte encre, **vert émeraude** pour les actions, et
les polices **Figtree** (les mots) et **IBM Plex Mono** (prévue pour les chiffres), embarquées dans l'app (rien n'est
chargé depuis Internet). Le **thème sombre reste disponible** : Plus → Paramètres → **Apparence** (Clair / Sombre /
Comme le téléphone). Les icônes de la barre d'état (heure, batterie) s'accordent au thème choisi. Rien ne change dans
vos données. En coulisses : toutes les couleurs de l'app viennent maintenant d'**un seul fichier de tokens**, et deux
tests empêchent de réintroduire une couleur « en dur » ou un texte dont le contraste passerait sous 4,5:1 (clair et
sombre). Vos décisions du 20/10 au soir sur l'**infrastructure** (Google Cloud sans clé, CI sur `main`) et l'**identité
visuelle** sont consignées dans [`INFRA.md`](INFRA.md) et [`DESIGN.md`](DESIGN.md) ; la liste « Actions du
propriétaire » de [`PRODUIT.md`](PRODUIT.md) a été refaite pas à pas. Prochaines étapes : **variantes play / sideload**
(pour avoir au plus tôt un AAB à envoyer en test interne), puis l'icône « H nuit » et l'écran d'accueil de la maquette.
**👉 Votre prochaine action la plus utile** : quand Google aura validé votre compte « jpesquet », **créer l'app** dans
la Play Console (P8), et commencer à **recruter 12 à 15 testeurs** (P12, il faut leurs adresses Gmail).

**Run du 21/10 02:30 — la version Google Play existe (jalon 3a).** Dans l'app que vous utilisez, rien ne change :
c'est la variante **« sideload »** (GitHub, mise à jour en un clic), même identifiant, vos données restent. À côté
naît la variante **« play »** : identifiant **`fr.jpesquet.sante`** (neutre et définitif — Google ne permet jamais de
le changer ; le nom affiché, lui, restera modifiable), sans la permission « installer des applis » ni le bandeau de mise
à jour (sur Play, c'est le Store qui met à jour). Les deux peuvent cohabiter sur un téléphone. Un nouveau workflow
**« Play — AAB »** fabrique à chaque version le fichier `.aab` signé à envoyer sur Play. **Il sera rouge tant que vous
n'aurez pas créé la clé d'envoi**… sauf que vous l'aviez déjà créée : **le premier run est passé au vert** et a
produit l'AAB signé **versionCode 330** (artefact `HealthTrack-play-330`, 17 Mo, gardé 30 jours ; un nouveau à
chaque version). La v191 sideload (33,7 Mo) est publiée comme d'habitude.
**👉 Votre prochaine action la plus utile : dès que Google a validé votre compte, P8 (créer l'app) puis P10** —
GitHub → Actions → « Play — AAB » → dernier run vert → artefact en bas de page → dézipper → Play Console → Test
interne → importer l'`.aab` (pas à pas dans [`PRODUIT.md`](PRODUIT.md), §4). Prochain run de
code : l'icône « H nuit » et l'écran de démarrage.

**Run du 21/10 04:30 — la nouvelle icône « H nuit » (identité visuelle, étape 2 sur 3).** Ce que vous verrez dans la
**v192** (publiée, 33,7 Mo, bouton du bandeau) : sur l'écran d'accueil du téléphone, l'icône HealthTrack devient le **H blanc sur fond encre**, avec sa barre
centrale en courbe menthe et le point ambre ; elle suit les **icônes à thème** d'Android 13+ si vous les avez activées
(Fond d'écran et style → Icônes à thème). L'**écran de démarrage** passe au même fond encre avec le glyphe, et **toutes
les notifications** de l'app (Lecture du visage, note du soir, montre) portent ce H au lieu d'icônes Android génériques.
Le petit logo en haut de l'app change aussi. Rien ne change dans vos données. En coulisses : un test vérifie que le
glyphe reste dans la zone sûre des icônes rondes et carrées, et l'**icône 512 × 512 de la fiche Play** est déjà prête
(`app/store/play-icon-512.png`). Note : un lanceur garde parfois l'ancienne icône en cache après la mise à jour ; un
redémarrage du téléphone suffit. Prochain run de code : **3b** (lecture du visage conforme aux règles Play,
explications avant chaque autorisation sensible), puis l'écran Accueil de la maquette.

**Run du 21/10 06:30 — l'app explique avant de demander un accès (jalon 3b, étape 1).** Ce que vous verrez dans la
**v193** (publiée le 21/10 à 08:43, 33,7 Mo, bouton du bandeau) : quand vous touchez « Activer la lecture du visage »,
« Utiliser ma position approximative » (météo) ou « Activer » le temps d'écran, une feuille dit d'abord **ce qui est
lu, pourquoi et ce qui quitte le téléphone**, avec « J'accepte, … » ou « Pas maintenant » (qui ne demande rien à
Android). Pour la caméra, elle dit qu'un **système d'IA de reconnaissance des émotions** travaille sur le téléphone,
qu'aucune image n'est gardée et que c'est une estimation, pas un diagnostic (Google Play l'exige, l'AI Act aussi). En
coulisses : l'étude [`PLAY-CONFORMITE.md`](PLAY-CONFORMITE.md) tranche la question de la caméra sur Google Play — la
lecture **au déverrouillage, app fermée, reste réservée à votre version sideload** ; la version Play lira le visage
**à l'ouverture de l'app** puis par un geste (« Lecture rapide »), sans service caméra en arrière-plan ni exemption de
batterie, ce qui évite le formulaire de justification et un refus probable. Revue de toutes les permissions du
manifeste dans le même fichier. Ce run n'avait pas pu fusionner sa PR ; **le run de
08:30 l'a revérifiée et fusionnée** (v193 ; AAB play `HealthTrack-play-333`, c'est lui à envoyer pour P10).

**Run « idées » du 21/10 08:30 — ce que la recherche change pour la suite (rien de nouveau dans l'app).**
① **Le « waouh » du premier jour est gratuit** : dès que la personne autorise Health Connect, Android laisse lire
**les 30 jours précédents** sans permission spéciale. L'onboarding pourra donc afficher tout de suite « vos 30 derniers
jours » (sommeil, pas, cœur), chaque chiffre avec sa source. ② **Pour passer la revue Google du premier coup** : notre
module Health Connect demande 21 types de données (glycémie, tension…) alors que Google refuse ceux qu'on n'utilise
pas → la version Play ne gardera que ceux qu'on lit vraiment. Health Connect n'a **aucun type pour les symptômes
digestifs** : ils restent sur le téléphone. ③ **Pistes SII** : un inconfort quelques minutes après un repas vient du
réflexe de l'intestin, pas des FODMAP (transit 12 à 48 h) ; les journaux du marché produisent beaucoup de faux suspects
(et l'effet d'attente joue fort : dans un essai de 2025, gluten et placebo donnaient les mêmes symptômes). Notre
moteur testera donc **trois fenêtres choisies d'avance** (0–4 h, 4–24 h, 24–48 h), avec un **seuil de jours fixé par
simulation** pour qu'au plus 1 jeu de données sans aucun effet sur 10 montre une piste. Réintroduction guidée au
format Monash (3 jours de doses croissantes, puis 2 à 3 jours de pause). **Aucune app française dédiée au SII** n'est
ressortie. ④ **Paywall — une correction à votre maquette** : la politique Google Play interdit de **mettre en avant
le prix mensuel d'un abonnement annuel** ; « soit 2,50 € par mois » restera donc en petit sous « 29,99 €/an » (jamais
dans le bouton). Vos prix sont **sous la médiane** du marché santé (≈ 40 $/an) ; un essai de 14 jours convertit aussi
bien qu'un essai de 7 et bien mieux qu'un de 3 ; plus de 80 % des essais démarrent le premier jour. ⑤ Nouvelle
**action P16** (après P8) : les formulaires « Contenu de l'app » — en « Applications de santé », ne cochez **que** le
groupe *Santé et remise en forme*, pas « Gestion des maladies » (classé Médical). Détail : [`IDEES.md`](IDEES.md)
I130–I138. **👉 Votre prochaine action la plus utile reste P8 puis P10** dès que Google a validé votre compte.

**Run du 21/10 10:30 — la version Google Play lit le visage à l'ouverture de l'app (jalon 3b, étape 2).** Dans
**votre** app (sideload, GitHub), rien ne change : la lecture au déverrouillage continue. La future version **Play**,
elle, n'a plus de service caméra en arrière-plan (Google le refuserait) : quand on ouvre l'app — au plus une fois par
demi-heure —, un **bandeau menthe « Lecture du visage · regardez l'écran une seconde »** apparaît pendant la lecture,
puis « Bien-être lu · quelques nombres gardés, aucune image ». L'explication avant d'autoriser la caméra le dit, la
carte et le diagnostic s'adaptent (plus de « Sans restriction », ni d'« Applis jamais en veille »). En coulisses :
la version Play ne demande plus que les **15 types Health Connect qu'on lit vraiment** (le module en déclarait 41,
dont 20 en écriture) — Google refuse les autres ; la justification par type pour le formulaire Health Connect (P16)
est prête dans [`PLAY-CONFORMITE.md`](PLAY-CONFORMITE.md). Publié : **v194** (33,7 Mo, bouton du bandeau ; même app pour
vous) et l'AAB play **`HealthTrack-play-335`**, le premier conforme (c'est lui à envoyer pour P10). **👉 Votre prochaine action la plus utile reste P8 puis P10** (envoyer
le dernier AAB `HealthTrack-play-NNN` en test interne). Prochain run de code : l'**écran Accueil « Aujourd'hui »** de
la maquette et la navigation en 4 onglets.

**Run du 21/10 12:30 — le nouvel accueil « Aujourd'hui » (identité visuelle, étape 3 sur 3).** Ce que vous verrez
dans la **v195** (publiée, 33,7 Mo, bouton du bandeau) : l'accueil s'ouvre sur **« mer. 21 oct. · Bonjour »** et une phrase
qui résume la journée d'après votre bien-être estimé (« Plutôt une bonne journée »…). Puis la **carte menthe
« Bien-être estimé »** de la maquette : grand chiffre sur 5, écart à votre moyenne des 14 jours, courbe de ces jours ;
**« détails »** montre la fourchette, le nombre de lectures, la moyenne et le modèle (un seul réglage pour toute la
page). Ensuite vos **tuiles sommeil / VFC / pas** (en détails : d'où vient chaque chiffre), la **carte pêche « Votre
ventre » : Calme / Gêne / Douleur en un geste**, horodaté — c'est la première brique des pistes SII ; ces notes
apparaissent dans « Vos derniers jours », se suppriment et partent dans l'export —, les boutons **« Photo du repas »**
et **« Une note »**, et la **carte lilas « Vos pistes arrivent dans N jours »** (X/21 jours avec un repas ou une note du
ventre ; une fois les 21 jours atteints, elle dit honnêtement que les pistes repas → ventre arrivent dans une
prochaine version). Le radar forme, les graphiques et le journal des jours restent en dessous, rien n'est perdu.
**À tester** : noter votre ventre deux fois dans la journée et regarder « Vos derniers jours ». Prochain run de code :
**navigation en 4 onglets** (Aujourd'hui, Journal, Pistes, Sources). **👉 Votre prochaine action la plus utile reste P8
puis P10** (envoyer le dernier AAB, `HealthTrack-play-337` ou plus récent).

**Run du 21/10 14:30 — navigation en 4 onglets (maquette).** Ce que vous verrez dans la **v196** (publiée, 33,7 Mo, bouton
du bandeau) : en bas, **Aujourd'hui · Journal · Pistes · Sources**. **Journal** regroupe vos repas et la nutrition
(boutons « Repas » / « Nutrition » en haut de la page) ; **Pistes** est l'ancienne page Analyses ; **Sources** les
anciens Connecteurs (montre, Health Connect, météo, lecture du visage). **Données, Paramètres et Nouveautés** sont
derrière la **roue en haut à droite** (avec la pastille quand il y a des nouveautés). Rien n'est supprimé, aucune
donnée ne bouge. En coulisses : le nom affiché « HealthTrack » vient maintenant d'un seul fichier
(`app/src/config/brand.js`), pour changer de nom en un commit. Prochain run de code : déplacer « Vos derniers jours »
dans l'onglet Journal et alléger l'accueil (2b). **👉 Votre prochaine action la plus utile reste P8 puis P10** (AAB `HealthTrack-play-339` ou plus récent).

**Run du 21/10 16:30 — « Vos derniers jours » rejoint l'onglet Journal.** Ce que vous verrez dans la **v198** (publiée, 33,7 Mo,
bouton du bandeau ; la v197 est identique) : l'onglet **Journal** s'ouvre sur **« Jours »** — chaque journée avec ce que vos sources ont mesuré
et ce que vous avez noté (repas, ventre, bien-être, cigarettes), avec Modifier / Refaire / Supprimer comme avant — et
les boutons **Repas** et **Nutrition** juste à côté. L'**accueil** est plus court : il finit par un bouton « Vos derniers
jours, dans le Journal ». Aucune donnée ne bouge. Prochain run de code : ranger le Radar forme et les graphiques qui
restent sous l'accueil (2b). **👉 Votre prochaine action la plus utile reste P8 puis P10** (AAB `HealthTrack-play-341` ou plus récent).

**Run du 21/10 18:30 — l'accueil est maintenant celui de la maquette.** Ce que vous verrez dans la **v199** (publiée, 33,7 Mo,
bouton du bandeau) : le **Radar forme**, vos cartes **FC au repos / VFC**, vos **horaires de sommeil** et les **courbes
du bien-être** quittent le bas de l'accueil pour un nouveau sous-onglet **Journal → Tendances** (Jours · Repas ·
Nutrition · Tendances). L'accueil s'arrête au résumé du jour et finit par deux boutons, « Vos derniers jours » et
« Vos tendances » ; il lit environ **340 enregistrements au lieu de 12 500** sur 3 ans de données, donc s'ouvre plus
vite. Sous la courbe, « Prédiction du jour » devient **« Attendu d'après vos habitudes »** (vocabulaire conformité :
pas de « prédiction »). Aucune donnée ne bouge. Prochain run de code : « Lecture rapide » (version Play) ou le premier
écran de l'onboarding. **👉 Votre prochaine action la plus utile reste P8 puis P10** (AAB `HealthTrack-play-343` ou plus récent). En coulisses : le
contrôle « budget de lectures » mesurait les analyses sur des agrégats vides (biais de l'outil, corrigé) ; budgets recalés sur les vraies valeurs.

**Run « idées » du 21/10 20:30 — votre montre : pourquoi le sommeil, la VFC et la température ne remontent pas
(rien de nouveau dans l'app ce soir).** ① **Cause trouvée pour le sommeil** : HealthTrack demandait à la montre si
elle « sait » envoyer des fichiers ; votre GT 6 Pro répond **non** (journal du 14/10)… alors qu'elle le fait très bien
— ce n'est pas une question qu'il faut lui poser. HealthTrack sautait donc à chaque synchro le fichier qui contient
**toute la nuit** : phases (léger, profond, paradoxal, éveil), coucher et lever, score, réveils, siestes, et aussi la
**VFC de la nuit, la respiration, la SpO₂ et la FC de la nuit**. La correction tient en quelques lignes : c'est le
**premier run de code** (M1, prochain run). ② **VFC de journée et température de la peau** passent par un autre
canal de la montre (messages « entre applis », dictionnaire de données) que HealthTrack ne parle pas encore : spécifié
ce soir, ce sera M2 puis M3. ③ Plan complet du chantier montre (M1 → M7, avec l'écran « Montre » de diagnostic en M5)
et inventaire de tout ce que mesure la GT 6 Pro : [`protocoles/huawei.md`](protocoles/huawei.md) §10. ④ Vos
décisions de ce soir sont reportées : l'app s'appellera **« Halcya »** (appliqué au prochain run de code, aucun
identifiant technique ne change), et la **montre passe en priorité principale des runs de code** jusqu'à couverture
maximale — sauf un run court dès que **gh-deployer** est invité dans la Play Console, pour l'envoi automatique en test
interne.

**⌚ Montre Huawei — état par type de donnée (mis à jour le 22/10 14:30 ; à vérifier d'un coup d'œil dans Sources → montre → « Voir ce qui remonte de la montre »)** :

| Donnée | État | Prochaine étape |
|---|---|---|
| Sommeil détaillé (phases, score, réveils, siestes) | 🟡 corrigé le 22/10 (M1), **à confirmer sur votre montre** | M1 bis si la montre ne répond pas |
| VFC de la nuit · respiration · SpO₂ et FC de la nuit | 🟡 lues avec la nuit (M1), à confirmer | — |
| VFC de journée | 🟡 livrée le 22/10 10:30 (M2), **à confirmer sur votre montre** (Journal → Jours, « VFC jour ») | — |
| Température de la peau | 🟡 livrée le 22/10 12:30 (M3), **à confirmer sur votre montre** (Journal → Jours, « Temp. peau ») | — |
| Stress | ❌ même cause que le sommeil | M4 (après le jalon 6, décision du 22/10 13:30) |
| Étages | ❌ personne ne sait encore les lire | M4 (avec votre aide) |
| FC continue, FC au repos, SpO₂ de journée, pas, distance, calories | ✅ | — |
| Séances (type, durée, distance, FC mini / maxi) | ✅ ; FC moyenne, courbe FC et allure au km 🟡 livrées le 25/10 (M7), **à confirmer sur votre montre** | — |
| Synchro en arrière-plan | 🟡 pas, FC, sommeil simple seulement | M6 |
| Écran « Données de la montre » (dernière valeur, date, n sur 7 j, réponse de la montre) | 🟡 livré le 22/10 14:30 (M5) | — |

**À faire sur votre montre dès maintenant** (ça prépare M1–M4) : vérifier que **TruSleep**, la **surveillance du
stress** et, si la montre la propose, la **mesure de la température de la peau** sont activés (Réglages de la montre →
Santé). Après la prochaine version : « Synchroniser la montre », puis regarder si votre nuit apparaît dans Journal →
Jours. **👉 Votre prochaine action la plus utile : finir P11** (inviter `gh-deployer@healthtrack-824b26.iam.gserviceaccount.com`
dans Play Console → Utilisateurs et autorisations, droits sur les pistes de test, testeurs, fiche et produits, **pas la
production** ; pas à pas dans [`PRODUIT.md`](PRODUIT.md) §4).

**Run du 21/10 22:30 — chaque version part toute seule en test interne sur Google Play (jalon 3c).** Merci pour
l'invitation de gh-deployer (P11). Rien ne change dans l'app ce soir. En coulisses : le workflow « Play — AAB », après
avoir fabriqué l'AAB signé, l'**envoie lui-même en test interne** (avec des notes de version tirées des Nouveautés) ;
vous n'avez plus d'AAB à télécharger ni à importer : la nouvelle version arrive dans le Play Store de votre téléphone
quelques minutes après chaque merge. Le code refuse toute autre piste que le test interne et le test fermé : **la mise
en production reste votre seul geste**. Si Google n'a pas encore propagé l'invitation (jusqu'à 24-48 h pour un compte
de service), le workflow le dit en avertissement et réessaie à la version suivante, sans rien casser. Si Play ne
prend la version qu'en **brouillon**, le résumé du workflow vous dit où cliquer. Prochain run de code : le nom
**Halcya** (M0), puis le **sommeil de la montre** (M1).

**Run du 22/10 00:30 — l'app s'appelle « Halcya ».** ✅ **Le premier envoi automatique sur Google Play a marché** :
la version 346 est arrivée en test interne le 21/10 à 22:51, sans rien faire de votre côté (votre invitation de
gh-deployer a pris effet en moins de 2 h). Ce que vous verrez dans la prochaine version (sideload et Play) :
**« Halcya » sous l'icône du téléphone**, en haut de l'app, dans les notifications (lecture du visage, note du soir,
montre, téléchargement de mise à jour) et dans les textes. L'icône « H » ne change pas, **aucune donnée ne bouge**, les
identifiants techniques non plus (vos deux apps restent distinctes ; les anciennes sauvegardes s'importent). Un test
empêche le retour de « HealthTrack » dans un texte visible. Note : si votre lanceur garde l'ancien nom, redémarrez le
téléphone.
**Et surtout : votre sommeil devrait enfin arriver depuis la montre (M1).** Cause confirmée dans le code : avant de
lire le fichier de la nuit, l'app demandait à la montre si elle « sait » envoyer des fichiers ; votre GT 6 Pro répond
« non »… et le fait très bien. La question a disparu. À chaque synchro, l'app lit maintenant **la nuit complète** :
phases (léger, profond, paradoxal, éveil), score, réveils, **VFC de la nuit**, **respiration** et **SpO₂ de la nuit**,
FC mini / maxi. **À la première synchro, elle rattrape les 60 derniers jours** que la montre garde encore. Les
**siestes** sont rangées à part : gardées dans l'historique et l'export, jamais ajoutées à la nuit. **👉 À tester
(2 min)** : après la mise à jour, Sources → montre → « Synchroniser la montre », puis Journal → Jours : vos nuits
doivent porter « Sommeil » et « Respiration », et l'accueil la VFC. Si rien n'arrive, exportez le journal de la
synchro (même carte) et envoyez-le-moi : il dit maintenant précisément ce que la montre a répondu pour le fichier
de la nuit (sinon, étape M1 bis : un second canal Bluetooth).
Publié : **v201** (nom Halcya) puis **v202** (sommeil de la montre), 33,7 Mo chacune, bouton du bandeau ; côté Play,
les versions **347** et **348** sont arrivées toutes seules en test interne. **👉 Votre prochaine action la plus
utile** : synchroniser la montre avec la v202 et me dire si vos nuits apparaissent ; puis créer le groupe
**halcya-testeurs@googlegroups.com** et activer **GitHub Pages** (P18 et P19 de `PRODUIT.md` : ils ouvrent le test fermé de 14 jours).

**Run du 22/10 02:30 — la page de confidentialité pour Google Play (préparation du test fermé).** Ce que vous verrez
dans la prochaine version : **Réglages (roue) → Confidentialité**, une page claire qui dit ce qui reste sur le
téléphone (tout, par défaut), ce qui en sort et quand (la position arrondie à ~10 km pour la météo, la photo ou la
description d'un repas quand vous lancez l'analyse IA), la lecture du visage sur le téléphone sans aucune image
gardée, la montre en Bluetooth, et comment tout exporter ou tout effacer. C'est aussi la page que montre Health
Connect quand on demande pourquoi Halcya lit ses données. En coulisses : la même page sera publiée sur Internet
par un nouveau workflow **« Site — GitHub Pages »**, à l'adresse **https://spreadzenox.github.io/HealthTrack/confidentialite/**
— celle à donner à la Play Console. C'est un brouillon fidèle au code, à faire relire par un juriste plus tard (P5),
sans bloquer le test fermé. **👉 Votre prochaine action la plus utile (2 min) : P19** — GitHub → dépôt → Settings →
Pages → Source : **« GitHub Actions »**, puis Actions → « Site — GitHub Pages » → **Run workflow** (tant que ce n'est
pas fait, ce workflow est rouge avec ce message : c'est normal). Puis **P18** (groupe Google des testeurs). Toujours
attendu : votre retour sur le **sommeil de la montre** avec la v202. Prochain run de code : la **fiche du Store en
français** envoyée par l'API (titre, descriptions, icône, captures de démonstration), puis retour à la montre (M2, VFC).
Publié : **v203** (33,7 Mo, bouton du bandeau) et la version Play **350** en test interne ; le workflow « Site — GitHub
Pages » est rouge comme prévu en attendant P19.

**Run du 22/10 04:30 — la fiche Google Play est prête et part toute seule.** Rien ne change dans l'app. En coulisses :
la **fiche du Store en français** existe maintenant dans le dépôt et est envoyée à Google Play par un nouveau workflow
**« Play — fiche du Store »** : titre **« Halcya — ventre et bien-être »**, description courte (« Repas, ventre,
sommeil et montres : voyez ce qui va avec vos bons jours. »), description longue (chaque phrase vérifiée dans le code :
local par défaut, IA facultative, « pas un dispositif médical », « une estimation, pas un diagnostic », 18 ans et plus,
« compatible avec les montres Huawei »), l'icône, une **image de présentation** (le H sur fond encre avec « Comprenez
ce qui va avec vos bons et mauvais jours ») et **5 captures** de la version Play sur des données de démonstration
(Aujourd'hui, Repas, Jours, Tendances, Pistes). Pour changer un texte, c'est dans `app/store/listing/fr-FR/` (si vous
le modifiez dans la Play Console, la CI le réécrasera à la prochaine modification de la fiche). **⚠️ Google Play a
tout reçu mais refuse d'enregistrer la fiche tant qu'aucune adresse e-mail de contact n'est saisie** (« This app does
not have a contact email address set ») : rien n'est publié pour l'instant. **👉 Vos deux actions les plus utiles
(2 min chacune)** : **P20** — Play Console → Halcya → Présence sur le Store → **Paramètres du Store → Coordonnées** →
e-mail public → Enregistrer, puis GitHub → Actions → **« Play — fiche du Store » → Run workflow** ; et **P19** (activer
GitHub Pages). Puis **P18** (groupe des testeurs). Publié aussi : **v204** (33,7 Mo, identique pour vous) et la
version Play **352** en test interne. Prochain run de code : le formulaire **Sécurité des
données**, puis la piste de test fermé, puis retour à la montre (M2, VFC).

**Run du 22/10 06:30 — le formulaire « Sécurité des données » de Google Play est prêt, à vous de le relire et de l'envoyer.** Rien ne change
dans l'app (sauf une ancre invisible dans la page de confidentialité). En coulisses : les réponses au formulaire
**Sécurité des données** sont dans le dépôt, chacune justifiée par le code, et un nouveau workflow **« Play — sécurité
des données »** les envoie à Google Play **quand vous le lancez** (c'est une déclaration faite en votre nom : elle ne
part jamais toute seule). Ce que la fiche Play dira : Halcya **collecte seulement 3 types de données,
tous facultatifs et jamais partagés** — la position approximative (météo, Open-Meteo), la photo et la description d'un
repas (seulement quand vous lancez l'analyse IA) ; **aucune donnée de santé ne quitte le téléphone**, pas de compte,
pas de publicité, données chiffrées en transit, suppression possible. Si Google refuse l'envoi par l'API, le workflow le
dit et il vous suffira d'**importer le fichier `app/store/data-safety/data-safety.csv`** dans Play Console → Contenu de
l'app → Sécurité des données (réponses détaillées dans [`PLAY-CONFORMITE.md`](PLAY-CONFORMITE.md) §5). **👉 Nouvelle action P21 (5 min)** : relire les réponses
(`PLAY-CONFORMITE.md` §5), puis GitHub → Actions → **« Play — sécurité des données » → Run workflow**. **Puis
P20** (e-mail de contact, puis relancer « Play — fiche du Store »), **P19**
(GitHub Pages) et **P18** (groupe des testeurs). Prochain run de code : la piste de **test fermé** si P18 est fait,
sinon retour à la montre (**M2**, VFC de journée).

**Run « idées » du 22/10 08:30 — la VFC de journée est prête à coder, et on sait comment encaisser les abonnements
(rien de nouveau dans l'app).** ① **Montre** : la façon exacte de demander la VFC de journée et la température de la
peau à la GT 6 Pro est maintenant écrite pas à pas ([`protocoles/huawei.md`](protocoles/huawei.md) §10.10). Deux
pièges évités d'avance, qui auraient coûté plusieurs allers-retours avec votre montre : le premier message doit
porter le numéro 2 (pas 1), et notre code actuel aurait pris l'accusé de réception de la montre pour sa réponse. Le
prochain run de code montre (**M2**) peut donc s'y mettre directement. Proposition : **ne pas lire les « émotions »
que calcule la montre** (ça ferait un second système de reconnaissance des émotions à déclarer, pour rien : votre
bien-être vient du visage et de vos notes). ② **Abonnements Google Play** (jalon 6) : on utilisera un module libre
(licence MIT) qui parle directement à Google Play, avec **notre** serveur relais pour vérifier les achats — pas
RevenueCat, qui verrait passer chaque achat de vos utilisateurs. Les prix et l'essai seront lus chez Google (jamais
écrits en dur), l'essai ne sera proposé qu'aux personnes qui y ont droit, et les tests d'abonnement se font en
accéléré (un an = 30 min). Il faudra d'abord votre **profil de paiement** dans la Play Console. Détail :
[`IDEES.md`](IDEES.md) I144–I148. **👉 Vos actions les plus utiles ne changent pas : P21** (relire puis lancer « Play —
sécurité des données »), **P20** (e-mail de contact), **P19** (GitHub Pages), **P18** (groupe des testeurs). Prochain
run de code : test fermé si P18 est fait, sinon **M2**.

**Run du 22/10 10:30 — votre VFC de journée arrive depuis la montre (M2).** Ce que vous verrez dans la prochaine
version (sideload et Play) : à chaque « Synchroniser la montre », Halcya demande aussi à la GT 6 Pro les **mesures de
VFC qu'elle prend pendant la journée** — la première fois, **tout l'historique** qu'elle garde encore, ensuite seulement
les nouvelles. Dans **Journal → Jours**, une case **« VFC jour »** (moyenne de la journée) s'ajoute à côté de « VFC »
(celle de la nuit). Exprès, la **tuile VFC de l'accueil, le Radar, vos normes et les pistes restent sur la VFC de la
nuit** : mélanger des mesures de jour (souvent plus basses) ferait bouger ces repères sans que rien n'ait changé chez
vous. En coulisses : HealthTrack parle maintenant le canal « entre applis » de la montre (P2P) ; il servira aussi à la
température de la peau (M3). **👉 À tester (2 min)** : après la mise à jour, Sources → montre → « Synchroniser la
montre », puis Journal → Jours. Si « VFC jour » n'apparaît pas, exportez le journal de la synchro : la ligne « VFC de
journée » dit si la montre a répondu (sans réponse, indisponible, ou 0 mesure). Toujours attendu : votre retour sur
le **sommeil** (M1). **👉 Vos actions les plus utiles** : P21, P20, P19, P18 (inchangées).

**Run du 22/10 12:30 — la température de votre peau arrive depuis la montre (M3).** Ce que vous verrez dans la
prochaine version (sideload et Play) : à chaque « Synchroniser la montre », Halcya demande aussi à la GT 6 Pro la
**température de la peau au poignet** qu'elle mesure (la première fois, tout l'historique qu'elle garde encore). Dans
**Journal → Jours**, une case **« Temp. peau »** (moyenne de la journée) apparaît ; elle reste **à part** de la
« Température » d'un thermomètre (une peau au poignet est vers 33 °C, rien d'anormal). Dans **Sources → montre**, un
nouvel interrupteur **« Mesure continue de la température de la peau »**, **désactivé par défaut** car il use un peu
la batterie : si vous l'activez, il part vers la montre à la synchro suivante, une seule fois. **👉 À tester (2 min)** :
activer l'interrupteur si vous le souhaitez, « Synchroniser la montre », puis Journal → Jours. Si « Temp. peau »
n'apparaît pas, exportez le journal de la synchro : la ligne « température de la peau » dit ce que la montre a
répondu. Toujours attendus : vos retours sur le **sommeil** (M1) et la **VFC de journée** (M2). Prochain run de code :
**M4** (stress, étages). **👉 Vos actions les plus utiles** : P21, P20, P19, P18 (inchangées).

**Run du 22/10 14:30 — un écran pour voir d'un coup d'œil ce qui remonte de votre montre (M5).** Ce que vous verrez
dans la **v209** (publiée, 33,7 Mo, bouton du bandeau ; et la version Play envoyée en test interne) : dans **Sources → montre**, sous l'interrupteur de la température, un
bouton **« Voir ce qui remonte de la montre »**. Il ouvre **« Données de la montre »** : une ligne par donnée —
sommeil (nuits), siestes, VFC de la nuit, VFC de journée, température de la peau, SpO₂, respiration, fréquence
cardiaque, FC au repos, pas, calories, séances (et le stress, marqué « à venir ») —, chacune avec **la dernière
valeur reçue et sa date**, le **nombre de mesures des 7 derniers jours**, et **ce que la montre a répondu à la
dernière synchro** (« reçu (3) », « vide », « sans réponse », « non pris en charge »). En haut : « N types sur 12
reçus ces 7 derniers jours ». Rien ne change dans vos données. **👉 À tester (2 min), c'est P17** : « Synchroniser la
montre », puis « Voir ce qui remonte de la montre », et m'envoyer **une capture de la liste** (deux écrans) : elle
me dira en une fois si le sommeil (M1), la VFC de journée (M2) et la température (M3) arrivent. **Votre décision de
13:30 est appliquée** : le **prochain run de code attaque le jalon 6** (abonnement Google Play et relais Vertex AI,
en commençant par le relais Cloud Run et l'analyse des repas), pour qu'il soit prêt pendant les 14 jours du test
fermé ; M4 (stress, étages), M6 et M7 viennent ensuite. **👉 Vos actions les plus utiles** : **P13** (profil de
paiement, désormais urgent : il débloque la création des abonnements et la vérification bancaire prend plusieurs
jours), puis P21, P20, P19, P18.

**Run du 22/10 16:30 — le serveur relais de l'IA est en ligne (jalon 6a, première moitié).** Rien ne
change dans l'app ce soir. En coulisses : un petit serveur, **le relais Halcya**, vit maintenant dans le dépôt
(`relay/`). C'est lui qui fera l'analyse des repas (photo ou description) pour la version Google Play, avec Gemini
sur **Vertex AI, en Europe (Belgique)**, sous l'identité du compte `relay-runtime` : **aucune clé Gemini n'existe**,
ni dans l'app ni sur le serveur. Il retire les métadonnées des photos (position, appareil), ne garde rien, n'écrit
jamais le contenu dans ses journaux, construit lui-même les consignes (impossible de s'en servir comme « Gemini
gratuit » pour autre chose qu'un repas) et se bride : **20 analyses par installation et par jour, 200 par jour au
total, 10 par minute**, une seule instance, **zéro instance au repos** (rien à payer quand personne ne s'en sert). À
chaque modification, la CI le teste, le déploie sur Cloud Run et **fait une vraie analyse de test** (« une pomme et un
yaourt ») dont le résultat s'affiche dans le résumé du workflow « Relais — déploiement ». **Premier déploiement réussi** :
le relais a reconnu « pomme et yaourt nature » (150 g de pomme, 125 g de yaourt) avec Gemini 2.5 Flash-Lite sur
Vertex AI en Europe ; seul le petit test de santé avait une adresse que Cloud Run réserve, corrigée dans la foulée. Prochain run de code (6a-2) :
la version Play appelle le relais au lieu de vous demander une clé Gemini, et la page de confidentialité le dit. Puis
6b (vérification des achats, Play Integrity). **👉 Vos actions les plus utiles** : **P13** (profil de paiement,
urgent), puis P21, P20, P19, P18 ; et, facultatif (3 min), **P22** : un plafond dur côté Google sur Vertex AI, en plus
de ceux du relais (pas à pas dans [`PRODUIT.md`](PRODUIT.md) §4).

**Run du 22/10 18:30 — la version Google Play analyse vos repas sans clé (jalon 6a, seconde moitié).** ✅ **Merci
pour P19, P20 et P21** : la page de confidentialité est en ligne, la fiche du Store est enregistrée (titre, icône,
présentation, 5 captures) et la sécurité des données est envoyée. Ce que verront les testeurs de la **version Play**
à la prochaine version : « Analyser les ingrédients » (photo) et « ✨ Remplir avec l’IA » (description) **marchent
tout de suite, sans clé Gemini**. La toute première fois, une feuille **« Avant d’analyser un repas avec l’IA »** dit ce
qui part (la photo réduite sans position, ou la description, rien d'autre), où (notre serveur en Europe, Gemini sur
Google Cloud) et que rien n'y est gardé, puis demande l'accord. **Réglages → Paramètres** montre les **analyses qui
restent aujourd'hui** (20 par jour). Dans **votre** version (sideload, GitHub), rien ne change : votre clé Gemini sert
toujours. En coulisses : un identifiant **aléatoire** d'installation accompagne chaque analyse (il sert seulement à
compter), la politique de confidentialité et la sécurité des données le disent ; vérifié en vrai depuis la session
(le relais accepte l'app et a reconnu « riz et œuf »). **👉 Vos actions les plus utiles** : ① **P21 bis (1 min)** :
GitHub → Actions → **« Play — sécurité des données » → Run workflow** une fois de plus (la déclaration gagne un 4ᵉ
type, « Identifiants de l'appareil ou autres ») ; ② **P13** (profil de paiement, urgent pour les abonnements) ;
③ **P18** (groupe des testeurs, qui ouvre le test fermé de 14 jours). À tester sur la version Play (test interne) :
photographier un repas → accepter → vérifier les aliments. Publié : **v212** (33,7 Mo, identique pour vous) et la version Play **362** en test interne. Prochain run de code : **6b** (vérification des achats par
le relais, Play Integrity).

**Run « idées » du 22/10 20:30 — votre « version candidate » a sa liste de contrôle (rien de nouveau dans
l'app).** ✅ **Merci** pour la soirée : déclarations envoyées pour examen, piste Alpha créée (v362, France, groupe
`halcya-testeurs`), RTDN, Play Integrity, profil marchand, testeur de licence, relance de la sécurité des données, et
le test de la montre (« tout remonte ») — tout est reporté dans [`PRODUIT.md`](PRODUIT.md). Votre décision de 19:15
est en place : nouvelle section **§2 bis « Version candidate »** avec vos 5 critères, chacun avec son état et sa
preuve ; on n'invitera les testeurs que quand tout sera vert. J'ai déjà **passé la version Play au crible, comme un
nouvel utilisateur sans données** (clair et sombre) : aucun plantage, mais **8 défauts** à corriger dans la passe de
finition (VC-1 à VC-8) — par exemple « **Halcyavous** aide » collé sur l'accueil, la page **Pistes** qui parle encore
de « recommandations basiques » et contredit l'accueil, un **profil nutritionnel inventé** (« Homme, 30 ans, ~2 507
kcal/jour ») affiché comme s'il était le vôtre, le **mode diagnostic** visible, des **Nouveautés** pleines de
« HealthTrack », l'écran montre proposé sans montre, et une carte **Withings** qui demande un secret de développeur.
Votre remarque sur le bloc « Diagnostic » de la carte montre y est (VC-8). **👉 Une décision pour vous (P23, critère
5) : comment les testeurs ne paient jamais.** Je recommande ① d'ajouter le groupe `halcya-testeurs` en **testeurs de
licence** (Play Console → Paramètres → Test de licence : leurs achats ne sont jamais débités) **et** ② une **« période
de lancement »** réglée sur notre serveur : tout est débloqué pour la version Play jusqu'à la fin du test, sans achat.
Répondez « ① + ② » (ou autre) dans une prochaine consigne. Autres gestes en attente : confirmer le virement de test de
Google (P13), envoyer pour examen la modification « sécurité des données » si elle apparaît dans la Play Console (P21).
Prochain run de code : **6b** (vérification des achats par le relais), puis 6c et l'onboarding. Détail :
[`IDEES.md`](IDEES.md) I149–I152.

**Run du 22/10 21:30 — le serveur sait vérifier un abonnement Google Play (jalon 6b, première moitié ; rien de
nouveau dans l'app).** Quand la version Play vendra l'abonnement (6c), c'est **notre relais**, pas l'app, qui dira si
quelqu'un est premium : il relit l'achat directement chez Google (actif, essai, période de grâce, annulé mais payé
jusqu'au…, en pause, suspendu, expiré) et en **accuse réception lui-même** — sans cela, Google rembourse l'achat au
bout de 3 jours. Il écoute aussi les **notifications en temps réel** que vous avez activées (sujet `play-rtdn`) : le
déploiement crée l'abonnement `play-rtdn-relay` qui les lui transmet, protégé par un jeton Google. Rien n'est stocké,
ni compte ni jeton. La **« période de lancement »** que je vous ai proposée (P23 ②) est prête côté serveur : elle reste
**coupée** tant que vous n'avez pas répondu. Le résumé du workflow « Relais — déploiement » dit si Google Play donne
déjà accès à `relay-runtime` (« ✅ relay-runtime lit les achats ») ou s'il faut encore attendre l'effet de votre
invitation (24 à 48 h). Prochain run de code : **6c** (achat dans l'app, droits premium, crédits IA, paywall).
**👉 Toujours en attente de vous : P23** (« ① + ② » ou autre).

**Run du 22/10 22:30 — réparation du déploiement du relais (rien ne change dans l'app).** Le déploiement de 21:30
avait échoué pour une faute de syntaxe dans le workflow (le caractère `@` servait à séparer les réglages du serveur, et
l'adresse de `relay-runtime` en contient un). Corrigé, avec un test qui relit désormais ces réglages comme Google
Cloud. Pendant ce temps, l'ancienne version du relais a continué de répondre : l'analyse des repas n'a pas été coupée.
Ce merge redéploie le relais avec la vérification des abonnements et les notifications Google Play. Prochain run de
code : **6c**. **👉 Toujours en attente de vous : P23.**

**Run du 22/10 23:30 — ⚠️ l'analyse des repas de la version Play était en panne depuis 22:47, réparation en cours.**
Le redéploiement de 22:30 a bien mis le nouveau relais en ligne, mais son analyse de test répond « L'analyse IA n'a pas
abouti » (confirmé par une relance et un appel direct) : depuis 22:47, **le bouton « Photo du repas » de la version
Play affiche une erreur** (la version sideload, qui utilise votre clé Gemini, n'est pas touchée). Le relais n'essayait
le modèle suivant que si un modèle était introuvable ; il passe désormais au suivant aussi quand un modèle refuse la
demande, tombe en panne ou répond sans JSON lisible (sauf plafond 429), et le workflow recopie dans son résumé le
message exact de Vertex AI en cas d'échec. Vérification au merge (voir le compte rendu du run).

**Run du 23/10 00:30 — cause trouvée : Google a retiré le modèle que le relais utilisait.** `gemini-2.5-flash-lite`
est **retiré de Vertex AI depuis le 20/10/2026** (page « Model versions and lifecycle » de Google), et ses successeurs
`gemini-3.5-flash-lite` / `gemini-3.1-flash-lite` ne sont servis en Europe que par le **point de terminaison
multi-région « eu »** (`aiplatform.eu.rep.googleapis.com`), pas par europe-west1/4 où le relais les cherchait : les
quatre essais répondaient « introuvable », d'où l'erreur de la version Play. Le relais interroge maintenant d'abord la
multi-région UE avec 3.5 puis 3.1 Flash-Lite (toujours dans l'UE, jamais « global »), et le workflow attend jusqu'à
2 minutes que Cloud Logging indexe l'erreur avant de la recopier. Rien à faire de votre côté ; P22 (facultatif) vise
désormais la ligne de quota **eu** (voir `PRODUIT.md`).

**Run du 23/10 01:30 — ✅ l'analyse des repas de la version Play remarche, et l'app connaît votre abonnement (jalon
6c, étape 1).** Vérifié dans le dernier « Relais — déploiement » : l'analyse de test répond (HTTP 200, modèle
`gemini-3.5-flash-lite` dans l'UE), et **Google Play accepte déjà `relay-runtime`** (« ✅ relay-runtime lit les
achats ») : votre invitation a pris effet. Nouveau dans la **version Play** : **Réglages → Paramètres → Abonnement**
dit en une phrase où vous en êtes (« Version gratuite… », « Essai gratuit en cours · premier paiement le … », « Premium
actif · renouvellement le … », « Abonnement en pause… ») et, dès qu'un abonnement existe, un bouton **« Gérer mon
abonnement dans Google Play »** (obligatoire pour Google). C'est le relais qui le dit, pas l'app : hors connexion,
l'app garde le dernier état sans jamais le prolonger au-delà de son échéance. Rien ne change dans la version
sideload. Prochain run de code : **6c-2**, le bouton d'achat lui-même (bibliothèque Google Play Billing, variante Play
seulement). **👉 Toujours en attente de vous : P23** (« ① + ② » ou autre : comment les testeurs ne paient jamais).

**Run du 23/10 02:30 — l'app sait acheter l'abonnement auprès de Google Play (jalon 6c, étape 2).** Dans la
**version Play**, l'app embarque maintenant la bibliothèque officielle **Google Play Billing** (version 8.3, celle
qu'exige Google à partir du 1er novembre) : elle lira les **prix et l'essai gratuit directement chez Google** (jamais
écrits dans l'app), lancera l'achat, et fera **revérifier chaque achat par notre relais** avant d'ouvrir le premium.
Visible tout de suite : **Réglages → Paramètres → Abonnement → « Restaurer un achat »** (nouveau téléphone,
réinstallation). Le bouton d'achat lui-même arrivera avec le paywall (6c-3), et les abonnements `halcya_premium`
(formules `annuel` avec essai de 14 jours et `mensuel`) seront créés par la CI en 6d, après votre vérification
bancaire. Rien ne change dans la version sideload (elle n'a ni la bibliothèque ni la permission d'achat). Politique de
confidentialité complétée (section « Abonnement ») et formulaire Sécurité des données : nouveau type « Historique
d'achats ». **👉 Votre action (2 min), P21 :** après ce merge, GitHub → Actions → « Play — sécurité des données » →
Run workflow (branche main), puis Play Console → Vue d'ensemble de la publication → envoyer la modification pour
examen. **Toujours en attente de vous : P23** (comment les testeurs ne paient jamais).

**Run du 23/10 03:30 — la page Premium (jalon 6c, étape 3).** Dans la **version Play** : **Réglages → Paramètres →
Abonnement → « Découvrir le premium »** ouvre le paywall de la maquette (ce que le premium apporte, l'encart « Toujours
gratuit », formules annuelle présélectionnée et mensuelle, badge d'économie, frise de l'essai, « Essayer 14 jours
gratuitement », « Plus tard »). Tous les montants (prix, « soit 2,50 € par mois », « −50 % », durée de l'essai) sont
**calculés à partir de ce que renvoie Google Play**, jamais écrits dans l'app. Aujourd'hui, comme l'abonnement
`halcya_premium` n'existe pas encore (6d, après votre vérification bancaire), la page dit simplement « Google Play ne
propose pas encore de formule ». Deux écarts volontaires à la maquette : pas encore de « jour 12 : on vous prévient »
(le rappel n'existe pas encore, on ne promet pas) ni de lien « Conditions » (pas de CGV publiées) — tous deux au
backlog avant la version candidate. Rien ne change dans la version sideload.

**Run du 23/10 04:30 — vos analyses IA restantes (jalon 6c, crédits IA).** Dans la **version Play** : sous le bouton
d'analyse d'une photo ou d'une description de repas, et dans **Réglages → Paramètres → Analyse des repas (IA)**, un
compteur « **22 analyses IA restantes · renouvellement le 1er novembre** ». Règle « collecter est gratuit, comprendre
est payant » : sans abonnement, **10 analyses offertes** pour commencer **puis 15 par mois** (non cumulables) ; avec le
premium, **jusqu'à 10 par jour** (le paywall dit désormais « jusqu'à 10 par jour » au lieu de « sans compter »). C'est
le relais qui compte (il retrouve votre premium tout seul à partir du jeton Google Play), sans rien garder d'autre
qu'une empreinte et des compteurs en mémoire ; politique de confidentialité mise à jour. Limite assumée pour le test
fermé : quand le relais redémarre, il s'appuie sur le dernier état renvoyé par l'app ; pour la vente, je propose de
rendre ces compteurs durables (**P24**, 3 commandes à copier, pas urgent). Rien ne change dans la version sideload.

**Run du 23/10 05:30 — un achat confirmé plus tard s'active tout seul (jalon 6c, étape 6c-3c).** Dans la **version
Play** : si Google Play met un paiement « en attente » (carte à valider, paiement en espèces), ou si vous utilisez un
code promo directement dans le Play Store, le premium **s'active dès que Google confirme**, sans rouvrir l'app ni
toucher « Restaurer un achat » ; la page premium et le bloc « Abonnement » se mettent à jour d'eux-mêmes. L'app relit
aussi vos achats au démarrage et à chaque retour dedans (au plus tous les quarts d'heure), comme Google le recommande.
Chaque achat reste revérifié par notre relais, une seule fois. Rien ne change dans la version sideload. Prochain run de
code : **6b-2** (Play Integrity contre l'abus des crédits), puis le jalon 4 (onboarding court et paywall passable).

**Run du 23/10 06:30 — le relais sait reconnaître la vraie app (jalon 6, étape 6b-2a).** Rien ne change dans l'app
pour l'instant. En coulisses, notre relais d'analyse IA sait maintenant vérifier un **jeton Play Integrity** : Google
lui confirme que la demande vient bien de l'app installée depuis le Play Store, sur un vrai téléphone, et pas d'un
script qui inventerait de faux identifiants d'installation pour toucher sans fin les analyses offertes. Il est déployé
en mode **« observation »** : il vérifie et note le résultat, sans jamais bloquer personne. Prochain run de code :
**6b-2b**, l'app demande ce jeton (variante play), puis on passera en mode « bloquant » quand les journaux montreront
que les vrais téléphones passent. Aucune action de votre part (Play Integrity est déjà relié au projet Cloud, P14).

**Run du 23/10 07:30 — l'app Play présente sa « carte d'identité » au relais (jalon 6, étape 6b-2b).** Rien de
visible : dans la **version Play**, chaque analyse IA d'un repas emporte maintenant un **jeton Play Integrity** que
Google Play fabrique sur le téléphone ; notre relais le fait lire par Google (installée depuis le Play Store ? téléphone
certifié ?) et, pour l'instant, **se contente de noter le résultat** (mode observation, personne n'est bloqué). Si
Google tarde plus de 8 s, l'analyse part sans jeton. La politique de confidentialité le dit. Rien ne change dans la
version sideload. **À tester quand la prochaine version Play vous arrive** : lancez une ou deux analyses IA de repas ;
le run suivant lira les journaux du relais et passera en mode bloquant si votre téléphone passe. Prochain run de code :
cette lecture, puis le **jalon 4** (onboarding court, « aha » du jour 1, paywall passable).

**Run « idées » du 23/10 08:30 — l'onboarding est prêt à coder, et un défaut qui l'aurait gâché (rien de nouveau
dans l'app).** ① **Défaut trouvé (VC-11)** : sans permission spéciale, Android ne laisse lire dans Health Connect que
les **30 jours précédant la première autorisation**, et refuse en bloc toute demande plus ancienne. Or notre première
synchronisation en demande **180** : sur un téléphone neuf (chaque testeur), rien ne serait importé, et l'app
noterait quand même « synchronisé », si bien que ces 30 jours ne viendraient jamais. Chez vous ça marche, parce que
votre autorisation est ancienne. Correctif court prévu **avant l'onboarding**, puisque son « waouh » du premier jour
(« vos 30 derniers jours ») en dépend. ② **L'onboarding (jalon 4) est décrit écran par écran** : 9 écrans (votre
maquette « 01/09 ») — objectif, ce que vous voulez suivre, vos montres, Health Connect avec son explication, import,
**vos 30 derniers jours résumés avec leur source**, lecture du visage facultative, premier geste (votre ventre), puis
la page Premium **passable** (« Continuer gratuitement » aussi visible que la croix). Jamais montré à quelqu'un qui a
déjà des données (vous ne le verrez pas après une mise à jour). Les notifications ne sont jamais demandées pendant
l'onboarding mais au premier rappel allumé : c'est le reproche principal fait à l'app SII Nerva. Les chiffres du
marché vont dans ce sens : la moitié des abonnements payants démarrent le jour de l'installation (RevenueCat 2026), et
un paywall montré après un premier résultat fait démarrer deux fois plus d'essais qu'un paywall d'entrée (Adapty).
Une ligne « En continuant, vous confirmez avoir 18 ans ou plus » suffit pour l'âge minimum. Prochains runs de code :
6b-2c (lecture des journaux Integrity), puis **VC-11**, puis 4a / 4b / 4c. Détail : [`IDEES.md`](IDEES.md)
I153–I156. **👉 Toujours en attente de vous : P23** (testeurs sans paiement : « ① + ② » ou autre).

**Run du 23/10 09:30 — l'import « 30 derniers jours » marchera chez les testeurs (VC-11 corrigé).** Ce que vous
verrez : **rien chez vous** (votre autorisation Health Connect est ancienne, la synchro continue comme avant). Sur un
téléphone neuf, en revanche, la première synchronisation Health Connect ne demande plus 6 mois — Android les aurait
refusés en bloc — mais **les 30 jours qui précèdent la première autorisation**, ce qu'Android laisse lire sans
permission spéciale ; le choix « Importer l'historique des derniers » n'offre plus que **7 jours / 30 jours**, avec
la phrase « Android laisse lire les 30 jours qui précèdent votre première autorisation ». Et si **toutes** les
lectures échouent, l'app ne note plus « synchronisé » : elle réessaie une heure plus tard depuis le même point, au
lieu de perdre l'historique. En coulisses : un petit module `syncWindow` partagé par la synchro automatique et l'écran
Sources, 23 nouveaux tests. À confirmer sur l'émulateur ou chez un premier testeur : le message exact d'Android. Le
6b-2c (passer Play Integrity en mode bloquant) attend vos premières analyses IA depuis la version Play. Prochain run
de code : **jalon 4a** (onboarding, mécanique des écrans). **👉 Toujours en attente de vous : P23** (testeurs sans
paiement).

**Run du 23/10 10:30 — un accueil pour les nouveaux venus (jalon 4a).** Ce que vous verrez : **rien chez vous**
(vous avez des données : ces écrans ne s'affichent jamais, c'est testé). Sur un téléphone neuf, la première ouverture
mène à **trois écrans plein écran** : celui de la maquette (« Comprenez ce qui va avec vos bons et mauvais jours », les
trois tuiles, « Qu'est-ce qui vous amène ? » 01 / 02 / 03, la ligne cadenas et « En continuant, vous confirmez avoir
18 ans ou plus »), puis « Que voulez-vous suivre ? » (cases cochées d'avance selon l'objectif) et « Avez-vous une
montre ? » (Health Connect / compatible Huawei / pas de montre). Aucune autorisation demandée, « Passer » dès le 2ᵉ
écran, reprise là où l'on s'était arrêté. Pour l'instant, une montre mène ensuite à l'onglet Sources ; le **4b**
ajoutera l'écran Health Connect et le « aha » de vos 30 derniers jours, le **4c** la lecture du visage, le premier
geste et le paywall passable. Pour le voir vous-même : Paramètres de l'app Android → Halcya (version play) →
Stockage → Effacer les données (⚠️ efface tout sur cette version-là). **👉 Toujours en attente de vous : P23**
(testeurs sans paiement).

**Run du 23/10 11:30 — vos 30 derniers jours dès la première ouverture (jalon 4b).** Ce que vous verrez : **rien
chez vous** (l'onboarding ne s'affiche jamais quand il y a des données) ; **une seule chose change aussi pour vous** :
dans Sources, « Autoriser » Health Connect passe désormais par une **explication avant la boîte d'Android** (ce qui est
lu, rien n'est envoyé, « Pas maintenant » ne demande rien), comme la caméra ou la position. Sur un téléphone neuf, le
choix « Une montre qui écrit dans Health Connect » mène à **deux nouveaux écrans** : ① « Vos données Health Connect »
(divulgation puis autorisation ; refus ou téléphone sans Health Connect → on continue sans reproche) ; ② l'**import
des 30 derniers jours** avec une barre réelle (« 5/14 · VFC », types lus sur total, rien d'inventé ; au-delà de 20 s,
« vous pouvez continuer, l'import se poursuit en arrière-plan »), puis **« Vos 30 derniers jours »** : sommeil moyen et
nombre de nuits, pas par jour, VFC de nuit, cœur au repos, chacun avec l'app d'origine (« Garmin Connect via Health
Connect ») ; **aucun zéro** : s'il n'y a rien, « Rien à importer pour l'instant : vos données arriveront au fil des
jours ». La synchro est notée comme une synchro normale : la synchro automatique reprend de là. En coulisses :
progression ajoutée à la synchro Health Connect, module `firstImport`, 17 nouveaux tests. Prochain run de code :
**4c** (lecture du visage facultative, premier geste « Comment va votre ventre ? », paywall passable dans la variante
play). **👉 Toujours en attente de vous : P23** (testeurs sans paiement).

**Run du 23/10 12:30 — un premier geste, puis le premium passable (jalon 4c, 1re partie).** Ce que vous verrez :
**rien chez vous** (l'onboarding ne s'affiche que sur un téléphone neuf). Sur une installation neuve, l'accueil finit
désormais par **« Comment va votre ventre ? »** (Calme / Gêne / Douleur, si l'objectif est « Mon ventre ») ou
**« Comment vous sentez-vous ? »** (0 à 5, sinon) : facultatif, horodaté (« C'est noté, à 12:39 : c'est votre premier
jour de suivi. Les pistes arrivent vers le 21ᵉ. »), changer d'avis modifie la même note. Dans la **version Play**
seulement, un dernier écran présente le **premium** avec une phrase adaptée (« Vos pistes arriveront vers le 21ᵉ jour
de suivi… rien ne presse ») et un grand bouton **« Continuer gratuitement »** (la croix fait de même). En coulisses :
correction d'un défaut du 4b — si l'on quittait l'app au milieu de l'accueil après l'import Health Connect, il était
noté « utilisateur existant » et ne revenait plus ; il **reprend** maintenant à l'écran atteint. 6 nouveaux tests.
Prochain run de code : **4c-2**, la lecture du visage facultative dans l'accueil (divulgation caméra, une lecture,
« estimation, pas un diagnostic »). **👉 Toujours en attente de vous : P23** (testeurs sans paiement).

**Run du 23/10 13:30 — la lecture du visage, proposée dans l'accueil (jalon 4c, 2e partie).** Ce que vous verrez :
**rien chez vous** (l'onboarding ne s'affiche que sur un téléphone neuf). Sur une installation neuve, juste avant le
premier geste, un écran **« Votre bien-être, estimé tout seul »** explique en trois lignes ce que fait la caméra (une à
deux secondes, au déverrouillage en sideload, **à l'ouverture de l'app en version Play**), qu'une IA l'analyse sur le
téléphone sans garder d'image, et que c'est une estimation, pas un diagnostic. **« Essayer maintenant »** affiche
d'abord l'explication habituelle avant l'accès à la caméra, puis fait une lecture d'essai et montre son résultat
(« Lecture faite : plutôt bien, ≈ 3,4 / 5 (entre 2,9 et 3,9). Une estimation, pas un diagnostic. ») ; cet essai ne
compte pas dans l'estimation du jour. **« Plus tard »** ne demande rien. Refus de la caméra : dit simplement, rien
d'activé. L'écran n'apparaît pas si le téléphone ne sait pas lire le visage. 13 nouveaux tests. **Le jalon 4 est
presque fini** : restent I155 (l'objectif choisi règle l'Accueil) et I156. **👉 Toujours en attente de vous : P23**
(testeurs sans paiement).

**Run du 23/10 14:30 — l'objectif choisi règle l'Accueil (jalon 4, I155).** Ce que vous verrez : dans **Plus →
Paramètres**, un nouveau bloc **« Ce qui vous amène »** (Mon ventre / Mon énergie et mon sommeil / Tout comprendre de
mes données), prérempli par l'onboarding. Avec **« Mon énergie et mon sommeil »**, l'Accueil met la carte **« Votre
ventre » tout en bas** et la carte lilas des pistes compte les **nuits suivies d'une mesure du bien-être** (note ou
lecture du visage le jour du réveil), les seuls jours utiles à une future piste sommeil → bien-être. Avec « Mon
ventre » ou « Tout comprendre » (et chez vous, qui n'avez jamais fait l'onboarding), rien ne change : l'ordre de la
maquette. Rien n'est masqué ni effacé. 7 nouveaux tests. **Il reste I156** (compteur local d'étapes de l'onboarding
dans le diagnostic) avant la passe « version candidate ». **👉 Toujours en attente de vous : P23** (testeurs sans
paiement).

**Run du 23/10 16:30 — plus de réglage technique visible dans la version Play (VC-4).** Ce que vous verrez : dans
votre version **sideload**, rien ne change, sauf une petite ligne **« Version N »** en bas des Paramètres. Dans la
version **Play**, le bloc « Mode diagnostic — Afficher les journaux techniques » **n'apparaît plus** : un nouvel
utilisateur ne voit aucun réglage de développeur. Pour le support et les testeurs, **7 touches sur « Version N »** (bas
des Paramètres) le font apparaître une fois pour toutes ; il reste aussi visible si le mode était déjà actif. C'est
le geste à donner à un testeur pour exporter son journal technique (avec la ligne `[onboarding]`). **Prochain run de
code : VC-2, VC-3, VC-6** (Pistes vide, profil Nutrition inventé, carte montre avant appairage). **👉 Toujours en
attente de vous : P23** (testeurs sans paiement).

**Run du 23/10 18:30 — Nutrition n'invente plus votre profil (VC-3).** Ce que vous verrez sur une installation
neuve : **Journal → Nutrition** ne montre plus « 70 kg · 170 cm · IMC 24,2 · Homme · 30 ans · ~2 507 kcal/jour »
inventés, mais « Complétez votre profil pour voir vos repères » et le bouton « Compléter mon profil ». Avec un profil
partiel (votre cas si seule la balance Withings remonte), seules les vraies valeurs apparaissent, puis « À compléter
pour ajuster vos repères : taille, sexe, âge ». L'**IMC** et le **besoin en calories** sont rangés derrière
**« détails »** (même réglage que l'Accueil) : pas de chiffre imposé à un public SII (I152). L'avertissement « des repas
manquent » ne cite plus d'objectif calorique. **Prochain run de code : VC-6** (carte montre avant appairage), puis VC-7,
VC-8. **👉 Toujours en attente de vous : P23** (testeurs sans paiement).

**Run « idées » du 23/10 20:30 — nouvel audit de la version Play « comme un nouvel utilisateur » (rien de nouveau
dans l'app).** Après les six correctifs du jour (VC-1 à VC-4, VC-6, VC-8), j'ai refait les 18 captures de la variante
play sur un téléphone vierge (13 pages, 0 erreur JS). L'Accueil, l'onboarding, le Journal, Nutrition et la page
« Données de la montre » sont propres. **Le point le plus important pour vous : le paywall promet 3 avantages qui
n'existent pas encore** (pistes avec délais de 2 à 48 h — jalon 5 —, réintroduction FODMAP guidée et rapport PDF —
jalon 7) ; aujourd'hui, le premium ne débloque que davantage d'analyses IA. Faire payer (ou faire essayer) des
testeurs pour des fonctions absentes serait trompeur, et les règles Play sur les abonnements exigent de dire
clairement ce qui est inclus. **👉 Décision à prendre : P25** (dans [`PRODUIT.md`](PRODUIT.md) §4) — ma recommandation :
pour la version candidate, le paywall ne liste que ce qui est livré et dit « Et bientôt : … » seulement dans les
détails, sans prix différent. Cinq autres défauts rangés pour la passe de finition : **VC-12** (Pistes affiche deux
seuils contradictoires : « 21 jours avec un repas ou une note du ventre » puis « au moins 5 jours avec une note de
bien-être »), **VC-13** (le guide « Huawei / Honor » de Sources conseille encore Gadgetbridge et la récupération d'un
cookie avec F12, alors que la version Play connecte la montre directement), **VC-14** (réglage « Cigarettes » dans les
Paramètres play), **VC-15** (émojis 📷🖼️✍️🗂️⚙️✨🔒 hors identité visuelle, apostrophes droites mêlées aux
typographiques), **VC-16** (Tendances : « Enregistrez votre bien-être à l'ouverture de l'app »). **Prochain run de
code : VC-7**, puis VC-12, VC-13 et P25 dès votre réponse. **👉 Toujours en attente de vous : P23** (testeurs sans
paiement) et **P25** (paywall honnête).

**Run du 24/10 09:30 — l'abonnement se crée tout seul chez Google (6d).** Rien ne change dans l'app. En coulisses,
un nouveau workflow **« Play — abonnements »** crée chez Google l'abonnement **`halcya_premium`** (« Halcya Premium »),
ses formules **annuel 29,99 €** et **mensuel 4,99 €** pour la France, la **période de grâce et la suspension de
compte** (14 + 46 jours sur l'annuel, 7 + 53 jours sur le mensuel : le maximum que Google autorise, pour laisser le
temps de corriger une carte refusée) et l'**essai gratuit de 14 jours** sur l'annuel, réservé aux personnes qui n'ont
jamais eu l'abonnement ; puis il les active. Il relit d'abord ce qui existe : relancé, il ne recrée rien et **ne
change jamais un prix déjà en place** (il le signale seulement). La fiche de l'abonnement sur Play ne cite que ce qui
est livré (« Analyse IA des repas, 10 par jour »), comme le paywall. **Résultat : créé et actif du premier coup** (annuel 29,99 € et mensuel 4,99 € actifs, essai de 14 jours actif ; aucun refus de Google). **À tester : ouvrez la version Play (à jour depuis le Play Store) → Réglages → « Découvrir le premium » : les deux formules et l'essai doivent s'afficher avec leurs prix.** Vous pouvez voir l'abonnement dans Play Console → Monétiser → Produits → Abonnements. **Prochain run de code : 6e** (liste de vérifications avec votre compte testeur de licence), puis M4. **👉 En attente de vous : confirmer le virement de test de Google (P13)**, puis P23.

**Run du 24/10 10:30 — l'abonnement prêt à être testé par vous (6e).** Ce que vous verrez dans la **version Play** :
si le paiement de votre abonnement échoue, une **carte « Votre paiement n'est pas passé »** apparaît en haut de
l'Accueil (premium gardé pendant la période de grâce), puis **« Abonnement suspendu »** si rien n'est fait, avec un
bouton **« Mettre à jour mon paiement »** qui ouvre directement vos abonnements Google Play ; elle disparaît dès que
le paiement passe. Google recommande de le dire là où la personne le voit, pas seulement dans les Paramètres. Rien ne
change dans la version sideload ni dans vos données. **👉 Votre prochaine action la plus utile : P27 (≈ 30 min)**,
le test de l'abonnement de bout en bout avec votre compte de testeur de licence (rien n'est débité, Google accélère
tout : essai de 3 min, renouvellements de 5 à 30 min) — les 7 cases à cocher, pas à pas, sont dans
[`PRODUIT.md`](PRODUIT.md) §4. C'est la dernière preuve qui manque au critère C3 de la version candidate. Puis
P23 (« ① + ② » ou autre). **Prochain run de code : 6b-2c** (Play Integrity bloquant, si des analyses IA ont été
journalisées), sinon M4 (stress, étages de la montre).

**Run du 24/10 11:30 — un faux « plantage » dans le test automatique, corrigé (rien ne change dans l'app).** Le test
qui installe la version Play sur un émulateur de Galaxy A56 était rouge après le run de 10:30 : il comptait **1
plantage** au premier lancement, alors que sa capture montre l'écran d'accueil de l'onboarding parfaitement affiché.
Cause : il comptait les plantages de **tous** les programmes de l'émulateur, pas seulement ceux de l'app. Il ne compte
plus que ceux de Halcya, repart d'un journal vide et publie désormais la trace exacte, pour qu'un vrai plantage soit
compris tout de suite. En coulisses aussi : le workflow du relais écrit maintenant un **bilan Play Integrity des 7
derniers jours** (combien de téléphones ont envoyé un jeton valide, refusé ou absent) ; c'est ce qu'il faut lire avant
de rendre la protection des crédits IA bloquante. **👉 Votre prochaine action la plus utile reste P27** (≈ 30 min, test
de l'abonnement avec votre compte de testeur de licence, [`PRODUIT.md`](PRODUIT.md) §4) : si vous faites aussi
**une analyse IA d'un repas** depuis la version Play, le bilan pourra confirmer que votre téléphone passe la
vérification. **Prochain run de code** : protection bloquante si le bilan le permet, sinon M4 (stress, SpO₂,
respiration de la montre).

**Run du 24/10 13:30 — la montre envoie son sommeil détaillé et son stress même app fermée (M6, 1re partie).**
Jusqu'ici, la relecture de la montre en arrière-plan (app fermée, au déverrouillage ou toutes les 30 min au mieux) ne
rapportait que les minutes, le sommeil simple et les totaux du jour : le **sommeil détaillé** (phases, score, VFC de la
nuit, SpO₂, respiration) et le **stress** n'arrivaient qu'en ouvrant l'app et en synchronisant. Désormais, le lecteur en
arrière-plan télécharge aussi ces deux fichiers de la montre (dès que l'app les a lus une fois : c'est elle qui fait le
rattrapage des 60 jours), et l'app les range à son ouverture, comme une synchro normale. Ce que vous verrez (version
sideload comme Play) : le matin, la nuit détaillée et la VFC de nuit peuvent déjà être là **sans avoir touché « Synchroniser »**.
Rien ne change dans vos données. **👉 À tester demain matin** : n'ouvrez pas l'app avant d'avoir déverrouillé le téléphone
une ou deux fois avec la montre au poignet ; ouvrez ensuite Sources → montre → « Données de la montre » : « Sommeil
détaillé » doit dater de la nuit. **Prochain run de code** : M6 suite (VFC de journée et température de la peau en
arrière-plan, P2P), puis M7 (courbe FC et allure des séances). **👉 Votre prochaine action la plus utile reste P27**.

**Run « idées » du 24/10 20:30 — P28 est prêt pour vous, et les deux derniers écrans chargés sont dessinés (rien
de nouveau dans l'app).** ① **P28 (lecture au déverrouillage dans la version Play)** : j'ai relu les règles Google sur
les services de premier plan. Google demande, pour la caméra, une description, l'impact si Android retarde ou coupe la
tâche, et **une vidéo** du chemin de l'utilisateur ; la fonction doit être allumée par vous, visible en permanence
(notification « Lecture du visage active » avec « Arrêter ») et arrêtable d'un geste. Android 15 interdit aussi de la
relancer au démarrage du téléphone : dans la version Play, elle reprendra à la prochaine ouverture de l'app. Le
**texte exact à coller** (en anglais, avec sa traduction), le **script de la vidéo de 60 à 90 s sur votre Galaxy A56**
(8 plans) et l'**ordre des gestes** sont dans [`PLAY-CONFORMITE.md`](PLAY-CONFORMITE.md) §1 bis. **Rien à faire tout
de suite** : la vidéo doit montrer la fonction, donc un run de code livrera d'abord un **APK d'aperçu** de la version
Play (qui s'installe à côté de celle du Play Store), que vous filmerez. ② **Onglet « Analyses » (POL-7)** : d'après les
captures, l'écran fait 4 hauteurs d'écran, affiche « Alcool » deux fois avec deux verdicts, deux « Comment c'est
calculé » et des chiffres techniques dès la première lecture. Maquette proposée : au plus 3 « pistes à tester » en
cartes dépliables, puis une seule liste « autres liens repérés » (un verdict par facteur), une ligne discrète
« bientôt » par bloc qui manque de données, et la méthode en tout petit en bas ; aucun calcul ne change.
③ **Onglet « Sources » (POL-8)** : ne montrer que ce qui envoie déjà, puis ce qui est **trouvé sur le téléphone**
(la carte montre Huawei seulement si Huawei Health est installée ou une montre déjà appairée) ; météo, temps d'écran
et visage toujours ; un bouton « Ajouter une source » pour le reste ; le technique seulement en mode diagnostic.
Détail : [`IDEES.md`](IDEES.md) I162–I164. **Prochain run de code : POL-7.** **👉 Votre prochaine action** : rien de
bloquant ; P13 (virement de test) dès qu'il arrive.

**Run du 24/10 21:30 — l'onglet « Pistes » devient « Analyses » (POL-7, 1re partie).** Ce que vous verrez : dans la
barre du bas, **« Analyses »** ; la page s'appelle **« Vos analyses »** et il n'y a **plus d'onglets « Analyse simple
/ avancée »** : une seule page, avec en haut « analyse sur N jours notés » (que vous aimiez) et un court encart lilas
« des liens, pas des causes ni un diagnostic », puis les **pistes à tester** et les liens repérés. Ce qui n'a pas encore
assez de données (bien-être estimé par le visage, habitudes, effets décalés) tient en **une ligne discrète « Bientôt »**
avec le compteur de jours. **« Comment c'est calculé »** n'apparaît plus qu'une fois, tout en bas, en petit ; le modèle
de l'ex-« analyse avancée » y est rangé (« Le modèle qui prédit votre bien-être »), rien n'est perdu. Aucun calcul ne
change. **👉 À tester** : onglet « Analyses », défilez jusqu'en bas. Prochain run de code : POL-7 2e partie (un seul
verdict par facteur — « Alcool » n'apparaîtra plus deux fois —, pistes dépliables, barres sans vert / rouge).  Publié : **v257** (33,7 Mo) et la version play en test interne.

**Run du 24/10 22:30 — des pistes plus simples à lire (POL-7, 2e partie).** Ce que vous verrez dans l'onglet
« Analyses » : chaque **piste à tester** dit d'abord l'essentiel en mots (« Dormir un peu plus longtemps · Lien fort
avec votre bien-être · Chez vous : lien net ») ; les chiffres (r, jours pris en compte, effet du week-end) s'ouvrent
avec le **petit chevron** à droite de la carte, le même geste que sur l'Accueil. Les **barres des liens sont toutes
lilas** : une flèche **↑** dit « va avec un meilleur bien-être », **↓** « avec un moins bon » ; fini le vert et le
rouge, qui jugeaient implicitement un comportement « bon » ou « mauvais ». Les écarts des habitudes (« −0,4 point »)
ne sont plus en rouge non plus. Aucun calcul ne change. **👉 À tester** : onglet « Analyses », touchez le chevron
d'une piste. Reste pour la 3e partie (POL-7c) : un seul verdict par facteur (« Alcool » est encore montré côté visage
et côté notes) et la liste « autres liens » fusionnée. Publié : **v258** (33,7 Mo) et la version play en test interne.

**Run du 25/10 01:30 — des Sources plus simples (POL-8).** Ce que vous verrez dans l'onglet **Sources** : la carte
**« Montre Huawei » n'apparaît que si votre montre est déjà appairée** (votre cas : rien ne change pour vous) **ou si
l'app Huawei Santé / Honor Santé est installée** ; la plupart des gens n'en ont pas et ne la verront plus. En bas de page,
un bouton **« Ajouter une source »** rassemble le reste : la montre Huawei, les capteurs Bluetooth et les guides par
marque (« Votre montre n'apparaît pas ? »). « Mes appareils » disparaît quand aucune app de santé n'est trouvée sur le
téléphone. Les **outils techniques de la montre** (test de connexion, « Enregistrer / Copier le journal », étapes de
l'appairage) ne s'affichent plus : ils reviennent **si une connexion échoue** (dépannage) ou en **mode diagnostic**
(7 touches sur la version). Les « Détails » des cartes Visage, Météo et Temps d'écran ont leur petit chevron. Pas de
scan Bluetooth pour « détecter » une montre (ce serait une autorisation de plus dès l'ouverture) : on se fie à l'app
compagnon installée et à l'appairage. **👉 À tester** : onglet Sources (votre montre doit toujours être là, avec
« Synchroniser la montre ») ; touchez « Ajouter une source ». Prochain run de code : **POL-1** (lecture au déverrouillage
dans la version play, après votre déclaration P28). Publié : **v261** (33,7 Mo) et la version play en test interne.

**Run du 25/10 03:33 — un réglage pour couper la lecture au déverrouillage (POL-1c).** Rien ne change dans vos deux
apps publiées (interrupteur de build toujours coupé). Dans l'**APK d'aperçu**, Plus → **Paramètres** a maintenant un
bloc **« Lecture au déverrouillage »** : quand elle est active (ou en pause), un interrupteur la coupe d'un geste (la
lecture à l'ouverture continue, rien n'est effacé) ; quand elle est coupée, une ligne renvoie vers Sources → Lecture du
visage, seul endroit où on peut l'allumer, derrière sa feuille d'explication. Avec la notification « Arrêter » et la
carte de Sources, cela fait trois façons de la couper, comme le demandent les règles Play. **POL-1 est terminé côté
app.** **👉 Votre prochaine action : P28** (vidéo + déclaration, pas à pas dans [`PRODUIT.md`](PRODUIT.md) §4) ; dès
qu'elle est faite, un run allume la fonction dans la version play. Prochain run de code : M6b. Publié : **v264**
(33,8 Mo) et la version play en test interne ; tous les tests verts.

**Run du 25/10 04:33 — la VFC de journée et la température de la peau relues aussi app fermée (M6b).** Jusqu'ici,
la relecture de la montre en arrière-plan (app fermée) rapportait le sommeil, les minutes, les totaux, le sommeil
détaillé et le stress, mais **la VFC de journée et la température de la peau n'arrivaient qu'en ouvrant l'app**. Le
lecteur Java parle maintenant aussi le canal « P2P » de la montre (mêmes messages que la synchro app ouverte, vérifiés
octet par octet contre elle) ; les pages reçues sont gardées telles quelles et décodées à l'ouverture par le même code
que d'habitude. Comme pour les fichiers, une donnée n'est demandée en arrière-plan **qu'après avoir été reçue une fois
app ouverte** (preuve que votre montre la fournit). Rien ne change à l'écran. **👉 À tester** (sur la v265) : ouvrez
l'app une fois avec la montre, puis laissez-la fermée quelques heures ; à la réouverture, Sources → montre → « Données
de la montre » doit montrer une **VFC de journée** et une **température** plus récentes que votre dernière ouverture.
Prochain run de code : M7 (séances : FC et allure), sauf si P28 est faite (on allume alors la lecture au déverrouillage
dans la version play). Publié : **v265** (33,8 Mo) et la version play en test interne ; tous les tests verts.

**Run du 25/10 05:33 — la fréquence cardiaque et l'allure de vos séances (M7).** Jusqu'ici, une séance de la montre
n'arrivait qu'avec ses totaux (type, durée, calories, distance, FC mini et maxi). Désormais, à chaque synchro app
ouverte, Halcya lit aussi les **mesures prises pendant la séance** et les **allures au kilomètre**. Ce que vous verrez
dans **Journal → Jours**, sous la séance : « **FC moy. 143 bpm · 5:37 /km** » et une **petite courbe de votre
fréquence cardiaque** pendant l'effort ; la ligne « Séances » de « Données de la montre » le dit aussi. Tout part dans
l'export. Une séance dont la montre n'envoie pas ce détail garde ses totaux, comme avant. **👉 À tester** (sur la
v266) : enregistrez une course ou une marche avec la montre, puis « Synchroniser la montre » et Journal → Jours. Si la
ligne « FC moy. » n'apparaît pas, exportez le journal de la synchro (mode diagnostic) et envoyez-le-moi. Prochain run
de code : POL-1d si P28 est faite, sinon M4 bis (étages) ou les séances relues app fermée. Publié : **v266**
(33,8 Mo) et la version play en test interne ; tous les tests verts.

**Run du 25/10 06:33 — premier pas vers les étages montés (M4 bis).** Rien ne change à l'écran. Les mesures minute
par minute de la montre contiennent des champs que personne n'a encore identifiés (ni nous, ni les projets libres) ;
l'un d'eux est probablement le nombre d'**étages** (ou le dénivelé). Halcya les met maintenant de côté (jamais dans
vos données) et écrit, à chaque synchro, **une ligne par jour** dans le journal de la synchro, en nombres seulement :
« bits inconnus des minutes (étages ?) 24/10 : 1/0x10 42 min Σ 318, 1/0x20 12 min Σ 96 ». **👉 À tester** (sur la
v267) : un jour où vous montez des escaliers, notez le nombre d'**étages** affiché par la
montre (ou Huawei Santé) ; le soir, ouvrez le mode diagnostic (7 touches sur la version), « Synchroniser la montre »,
« Enregistrer le journal », et envoyez-moi la ligne « bits inconnus » du jour avec votre chiffre d'étages : si une
somme colle (Σ ou nombre de minutes), on saura lequel décoder et l'afficher. Prochain run de code : POL-1d si P28 est
faite, sinon les séances relues app fermée (M7b). Publié : **v267** (33,8 Mo) et la version play en test interne ; tous
les tests verts.

**Run du 25/10 07:33 — vos séances arrivent aussi app fermée (M7b).** Jusqu'ici, la relecture de la montre en
arrière-plan rapportait sommeil, minutes, stress, VFC et température, mais **pas les séances** : une course faite
pendant que l'app était fermée n'apparaissait qu'à la synchro suivante app ouverte. Désormais, la relecture en
arrière-plan lit aussi les séances, avec leur **FC moyenne, leur courbe et leurs allures au km** ; elles sont dans
Journal → Jours à l'ouverture suivante. Comme pour le reste, rien n'est demandé à la montre tant qu'une première
synchro app ouverte n'a pas lu ses séances. **👉 À tester** (sur la v268) : ouvrez l'app une fois et synchronisez,
fermez-la, faites une course ou une marche avec la montre, puis rouvrez l'app plus tard sans toucher « Synchroniser » :
la séance doit être là avec « FC moy. ». Prochain run de code : POL-1d si P28 est faite, sinon les petites corrections
A.1 / A.2 du chantier montre. Publié : **v268** (33,8 Mo) et la version play en test interne ; tous les tests verts.

**Run du 25/10 11:33 — un Accueil plus léger au premier jour (VC-26).** Ce que verra un nouvel utilisateur (**v271**,
publiée, 33,8 Mo ; version play envoyée en test interne ; vous ne verrez rien changer avec vos données) : sur un téléphone neuf, la présentation de l'Accueil
tient en **une phrase** ; tant qu'aucune mesure n'arrive, **une seule ligne** « Sommeil, cœur et pas arrivent de votre
montre · Ajouter une source » remplace les trois tuiles vides « — » ; les boutons « … dans le Journal » n'apparaissent
qu'une fois qu'il y a quelque chose à y voir. Tous les défauts d'écran de l'audit sont corrigés ; reste « Envoyer un
avis », puis la publication en alpha pour inviter vos testeurs.

**Run du 25/10 10:33 — Analyses plus lisibles (VC-23, VC-24).** Ce que vous verrez dans la **v270** (publiée, 33,8 Mo ; version play envoyée en test interne) : dans
l'onglet **Analyses**, chaque lien porte la même étiquette partout — **« Piste solide »** (menthe), **« À confirmer »**
(pêche) ou **« Trop tôt pour dire »** (gris) — au lieu de trois façons de dire la même chose ; l'explication longue se
déplie au chevron. Sous « Autres liens repérés », toutes les cartes ont le même modèle (le nom du facteur en entier, une
phrase, les chiffres en petit) et les moyennes sur 5 n'ont plus qu'une décimale. Aucun calcul ne change. Reste avant la
version candidate : VC-26 (Accueil vierge), « Envoyer un avis », puis la publication en alpha.

**Run du 25/10 09:33 — Sources plus simple, premiers défauts de l'audit corrigés (VC-22, VC-25, VC-27).** Ce que
vous verrez dans la **v269** (publiée, 33,8 Mo ; version play envoyée en test interne) : sur **Sources**, un seul bouton **« Ajouter une source »** regroupe tout ce
qui n'est pas encore branché (le volet « Brancher une autre source », qui faisait doublon, a disparu ; sur un
téléphone neuf, les sources à brancher restent en vue, et une montre Huawei détectée aussi). La carte **Health
Connect** tient en une phrase avec des apps connues (Samsung Health, Garmin, Withings, Oura…), la liste complète des
données se déplie sous « Ce qui est importé » ; plus de « Gadgetbridge ». Les triangles ▸ des volets deviennent le
chevron discret du reste de l'app, et les textes disent « vos Analyses ». Rien ne change dans vos données. Reste
avant la version candidate : VC-23 + VC-24 (Analyses), VC-26 (Accueil vierge), « Envoyer un avis », puis la
publication en alpha.

**Run « idées » du 25/10 08:33 — la version candidate est presque prête : ce qu'il reste avant d'inviter vos
testeurs (rien de nouveau dans l'app).** J'ai relu toute la version Play en captures, sur un téléphone neuf (clair) puis
avec des données (sombre) : 14 écrans, aucune erreur. Votre polissage du 24/10 est bien là. Restent **6 petits défauts**,
corrigés aux prochains runs de code : ① 4 textes disent encore « vos Pistes » (Météo, Temps d'écran, capteurs) alors
que l'onglet s'appelle « Analyses » ; ② dans Analyses, trois façons de dire si un lien est solide (« lien net »,
« hypothèse solide », « piste solide ») → une seule ; ③ les « autres liens » mêlent deux présentations → une seule ;
④ dans Sources, « Brancher une autre source » fait doublon avec « Ajouter une source » ; ⑤ l'Accueil d'un nouvel
utilisateur commence par 5 lignes de texte et trois tuiles vides → une phrase et une ligne ; ⑥ la carte Health
Connect cite Gadgetbridge (inconnu du grand public). Et il manque un **« Envoyer un avis »** dans les Paramètres pour
que vos testeurs vous répondent facilement. **Ensuite, la version candidate part en test fermé** (avec le premium
offert jusqu'à la fin du test), et je vous écrirai « 👉 Version candidate prête » ici. Je propose de **garder la
lecture au déverrouillage hors de cette version** : elle demande un examen Google à part (P28), et un refus ne doit
pas bloquer le test fermé ; elle viendra dans une version suivante. **Ce que Google regarde au bout des 14 jours**
(sources tierces concordantes) : au moins 12 testeurs **inscrits sans interruption** (sinon le compteur repart à
zéro : invitez-en 15), qui **ouvrent vraiment l'app**, et au moins une mise à jour pendant le test ; le formulaire
d'accès à la production demande ce qui a changé grâce aux retours. J'ai donc durci le texte d'invitation (« ouvrez
l'app tous les 2 ou 3 jours, ne quittez pas le test ») et ajouté un **rappel du jour 7** prêt à envoyer
([`INVITATION-TESTEURS.md`](INVITATION-TESTEURS.md)). Crédits IA après réinstallation sans sauvegarde : l'outil
Google prévu pour ça est réservé à des partenaires ; le risque reste plafonné par le relais, je le surveille.
Détail : [`IDEES.md`](IDEES.md) I165–I167. **👉 Votre prochaine action** : rien de bloquant ; P28 quand vous voulez
(elle ne retarde plus la version candidate).

**Run du 25/10 02:33 (heure d'hiver) — l'écran d'activation de la lecture au déverrouillage (POL-1b) : 👉 P28 est
prêt à filmer.** Rien ne change encore dans vos deux apps publiées (l'interrupteur de build reste coupé). Dans l'**APK
d'aperçu** (`fr.jpesquet.sante.apercu`), la carte **Sources → Lecture du visage** a maintenant une ligne **« Aussi à
chaque déverrouillage »** avec un interrupteur. L'allumer ouvre une feuille d'explication (3 images à chaque
déverrouillage, témoin vert de la caméra, IA de reconnaissance des émotions, seuls des nombres gardés, notification
« Lecture du visage active » avec « Arrêter », rien ne reprend seul après un redémarrage) ; « J'accepte, lire au
déverrouillage » démarre la lecture app ouverte puis demande l'autorisation des notifications. L'éteindre ne coupe
que le déverrouillage (la lecture à l'ouverture continue). Si Android l'arrête (redémarrage, mise à jour), la carte
dit « en pause » avec **« Reprendre »**. En coulisses : le test émulateur Android 16 qui rougissait par intermittence
(« Conflict found » de Health Connect, encore sur main cette nuit, sans lien avec l'app) est rendu robuste.
**👉 Votre prochaine action : P28** — installer l'APK d'aperçu (artefact `halcya-apercu-deverrouillage` du workflow
« Test — émulateur Samsung Galaxy A56 »), filmer 60–90 s selon le script, puis coller la déclaration (pas à pas dans
[`PRODUIT.md`](PRODUIT.md) §4, P28). Prochain run de code : raccourci pour couper dans Paramètres (POL-1c), puis M6b. Publié : **v263** (33,7 Mo) et la version play en test interne ; tous les tests verts, émulateur Android 16 compris.

**Run du 25/10 02:30 — préparation de la lecture au déverrouillage dans la version play (POL-1a, rien de visible).**
Rien ne change dans vos deux apps : la fonction est construite **derrière un interrupteur coupé**, pour que les
versions play continuent de partir quoi que décide Google. En coulisses : l'app sait maintenant, dans sa variante play,
lancer la lecture au déverrouillage **en plus** de la lecture à l'ouverture (qui reste le secours), avec la
notification permanente « Lecture du visage active » et son bouton **« Arrêter »** (qui ne coupe que le
déverrouillage), **sans** relance au démarrage du téléphone ni exemption de batterie. La CI fabrique désormais à
chaque PR un **APK d'aperçu** (`fr.jpesquet.sante.apercu`, s'installe à côté de l'app du Play Store) avec
l'interrupteur allumé : c'est lui que vous filmerez pour P28, **dès que le prochain run aura ajouté l'écran
d'activation** (POL-1b). Pas encore de geste pour vous. Publié : **v262** (33,7 Mo) et la version play en test interne.

**Run du 25/10 00:30 — le Journal en couleurs (POL-6).** Ce que vous verrez dans Journal → **Jours** : « Vos derniers
jours » n'est plus gris. Chaque mesure du jour a son pastel : **menthe** pour le corps et le bien-être (sommeil, FC,
VFC, respiration, température, stress), **pêche** pour les repas, **lilas** pour ce que vous faites (pas, dépense,
écran) ; les chiffres passent en police « données ». Vos repas et notes du ventre sont sur fond pêche, vos notes de
bien-être sur fond menthe, vos séances sur fond lilas. Dans **Tendances**, un graphique qui n'a pas encore assez de
mesures (radar, FC au repos, VFC, horaires de sommeil) ne prend plus une carte : une ligne discrète **« Bientôt »** dit
ce qui lui manque (« encore 10 j », « encore 4 nuits »). Rien n'est effacé, aucun calcul ne change. **👉 À tester** :
Journal → Jours, puis Tendances. Prochain run de code : **POL-8** (Sources simplifiées). Publié : **v260** (33,7 Mo) et la version play en test interne.

**Run du 24/10 23:30 — un seul verdict par facteur (POL-7, 3e et dernière partie).** Ce que vous verrez dans l'onglet
« Analyses » : sous les pistes à tester, **une seule liste « Autres liens repérés »** réunit ce qui était éparpillé en
quatre blocs (liens avec le visage, habitudes, effets décalés, autres liens). **Chaque facteur n'apparaît qu'une fois**,
avec son lien le plus solide : « Alcool » n'est plus montré deux fois. Une petite étiquette **« visage »** dit quand le
lien vient du bien-être estimé ; une ligne discrète rappelle l'autre mesure si elle est nette aussi. Les 5 liens les
plus nets sont visibles, le reste derrière « Voir N autres liens », les incertains derrière un seul lien. Plus d'émojis
dans les titres. Quand un facteur est déjà une piste (« Marcher davantage »), son effet du lendemain s'ouvre avec le
chevron de la piste. En démo, l'onglet passe de 3 écrans à 2. Aucun calcul ne change. **👉 À tester** : onglet
« Analyses », vérifiez qu'aucun facteur n'est répété. Prochain run de code : **POL-6** (Journal plus coloré, graphiques
pas encore actifs regroupés). Publié : **v259** (33,7 Mo) et la version play en test interne.

**Run du 24/10 19:30 — l'historique de votre bien-être (POL-2).** Ce que vous verrez : en bas de la carte « Bien-être
estimé », **« Historique › »** ouvre une page avec **Jour / Semaine / Mois** : la courbe de votre bien-être estimé (en
Jour, chaque lecture avec sa fourchette ; en Semaine et Mois, un point par jour, creux s'il y a eu peu de lectures), vos
**notes à la main en losanges ambre**, et « Noter moi-même ». Dessous, pour qui veut creuser, **« Ce que lisent les
modèles »** : valence (désagréable ↔ agréable), éveil (calme ↔ animé) et **les 8 expressions du visage** (joie, neutre,
surprise, tristesse…), toujours présentées comme des estimations de l'expression, pas de ce que vous ressentez. En
coulisses : j'ai vérifié ce que sortent les deux modèles embarqués — 8 scores d'expression en plus de la valence et de
l'éveil, jusqu'ici jetés ; ils sont maintenant gardés (des nombres seulement, aucune image, rien qui quitte le
téléphone, pas de changement de base de données). **👉 À tester** : après quelques lectures du visage sur la nouvelle
version, Accueil → « Historique » → « Jour » ; la carte « Expressions » se remplit avec ces nouvelles lectures (les
anciennes n'en ont pas). Prochain run de code : POL-7 (onglet « Analyses »). Publié : **v256** (33,7 Mo) et la version play en test interne.

**Run du 24/10 18:30 — la carte « Bien-être estimé » se lit d'un coup d'œil (POL-3).** Ce que vous verrez : le
bouton texte « détails » devient une **petite flèche** en haut à droite des cartes (bien-être, ventre, pistes, et aussi
sur la page Premium et le profil Nutrition) ; touchée, elle pivote et ouvre les détails. Dans la carte bien-être, les
détails sont **visuels** : la fourchette sur une barre de 0 à 5, un **badge de confiance** à trois points, le nombre de
lectures et votre moyenne en pastilles, le modèle en petit. **« + Noter moi-même »**, en bas de la carte, sert à noter
votre bien-être à la main ; le bouton « Ajouter une note » disparaît, et **l'app ne vous demande plus votre bien-être à
chaque ouverture**. Rien n'est effacé. **👉 À tester** : ouvrez l'app (plus de question), touchez la flèche de la carte
bien-être, puis « Noter moi-même ». Prochain run de code : POL-2 (historique du bien-être, ouvert depuis la carte). Publié : **v255** (33,7 Mo) et la version play en test interne.

**Run du 24/10 17:30 — l'Accueil se simplifie (POL-5 et POL-4).** Ce que vous verrez : **« Photo du repas »** prend
toute la largeur avec une **icône appareil photo** ; « Une note » devient **« Ajouter une note »** (icône crayon), juste
en dessous. La **carte « Votre ventre »** n'apparaît plus qu'avec l'objectif **« Mon ventre »** (Paramètres → « Ce qui
vous amène », dont le texte l'explique) ; avec « énergie et sommeil » ou « tout comprendre », plus de carte ventre.
Aucune note n'est effacée : revenez à « Mon ventre » et elle réapparaît. Cas particulier : une installation d'avant
l'onboarding, sans objectif, garde la carte tant que vous notez votre ventre. **👉 À tester** : Paramètres → « Ce qui vous
amène » → « Mon énergie et mon sommeil », puis l'Accueil (pas de carte ventre), puis retour à « Mon ventre ». Prochain
run de code : POL-3 (carte bien-être : un geste plus joli que « détails », ajout manuel discret, fin de la question
automatique à l'ouverture). Publié : **v254** (33,7 Mo) et la version play en test interne.

**Run du 24/10 16:30 — la sauvegarde Android reste, en plus sûr et dit honnêtement (SAUV).** Ce que vous verrez :
Réglages → **Données** dit maintenant que vos données sont incluses dans la sauvegarde Google du téléphone si elle est
activée (chiffrées, gérées par Android, jamais lues par Halcya) ; l'onboarding affiche « **0 Mo envoyé à Halcya sans
votre accord** » ; la politique de confidentialité a un paragraphe « Sauvegarde Android » (et les conditions §6). En
coulisses : des **règles de sauvegarde explicites** (Android 12+ et avant) gardent tout sauf ce qui est propre au
téléphone (coffre de la clé de la montre, association compagnon, téléchargement de mise à jour), et un **repère hors
sauvegarde** détecte une restauration : au premier lancement sur le nouveau téléphone (ou après réinstallation), la clé
Gemini saisie, les clés de la montre et les jetons sont retirés ; l'identifiant d'installation reste (il porte vos
crédits IA) et l'abonnement est relu dans Google Play. **Sécurité des données : rien à ajouter** (la sauvegarde est
faite par Android et chiffrée de bout en bout), donc **pas besoin de relancer P21**. **👉 À tester à votre prochaine
réinstallation** : vos données reviennent, la montre demande un nouvel appairage (PIN sur la montre), le premium revient
seul. Publié : **v253** (33,7 Mo) et la version play en test interne. Prochain run de code : POL-5 + POL-4 (boutons de l’Accueil, carte ventre seulement si « Mon ventre »).

**Run du 24/10 15:30 — « Premium offert pendant le test » est prêt (6f, P23 ②).** Vos retours de 15:00 sur le
parcours (Accueil, Journal, « Analyses », Sources, lecture au déverrouillage aussi sur Play) sont consignés dans
[`BACKLOG.md`](BACKLOG.md) en étapes **POL-1 à POL-8** : ce sera la priorité des prochains runs de code, juste après la
sauvegarde Android. Ce run livre la **période de lancement** : entre deux dates réglées dans un petit fichier du
relais (`relay/src/launch-period.json`), toute installation de la version Play a le premium, **sans achat ni mise à
jour de l'app**. Pendant cette période, la page Premium et le dernier écran de l'onboarding disent **« Premium offert
pendant le test · jusqu'au …, vous n'avez rien à payer »**, sans aucune formule ni bouton d'achat (impossible de payer
par erreur) ; à l'échéance, le paywall habituel revient tout seul. **Aujourd'hui le fichier est vide : rien ne change
pour vous** ; les dates seront posées le jour où la version candidate part en alpha (début = cette publication, fin =
invitation + 14 jours + 10 jours de marge). **Pour prolonger ou couper**, une ligne à changer dans ce fichier sur
GitHub, le relais se redéploie seul en 3 à 5 minutes : pas à pas dans
[`INVITATION-TESTEURS.md`](INVITATION-TESTEURS.md), qui contient aussi **le texte d'invitation des testeurs** (avec le
chemin d'installation qui marche malgré l'absence de l'app dans la recherche du Play Store). Le résumé du workflow
« Relais — déploiement » affiche désormais l'état de la période. **Petite renumérotation** : l'action IAM devient
**P29** ; **P28** est la déclaration « services de premier plan » de la lecture au déverrouillage (je vous préparerai
le texte et le script de la vidéo). Publié : **v252** (33,7 Mo ; rien de visible tant que la période n'est pas posée). **Prochain run de code : SAUV** (règles de sauvegarde Android qui excluent les clés
de la montre, textes honnêtes), puis POL-5 et POL-4.

**Run du 24/10 14:30 — merci pour la session guidée : vos retours sont consignés, et le compteur d'analyses IA est fiable.**
**P27 est terminée** (critère C3 de la version candidate ✅ : achat, annulation, paiement refusé, pause et
réinstallation fonctionnent tous) ; **P23 tranchée** : seulement la « période de lancement » (aucun testeur de licence en
plus) ; P21 relancée, P22 abandonnée, P24 faite. **Le « 10 analyses IA restantes » de 14:11 est expliqué** : le relais
gardait ses compteurs en mémoire, et le plafond premium du jour n'était sauvegardé nulle part ; quand Google a mis le
relais en veille (personne ne l'appelait), le compteur est reparti à zéro. La réinstallation n'y était pour rien. C'est
corrigé : les compteurs sont maintenant gardés dans **Firestore** (la base que vous avez créée à 14:03, offre gratuite),
avec seulement des chiffres et une empreinte de l'installation, rien de personnel. Ce que vous verrez : la carte de
résultat d'une analyse IA (**v251**, 33,7 Mo) dit simplement **« Analyse IA · une estimation »** (le nom du modèle reste sous « détails »).
**À tester** : faites une analyse IA, attendez 30 minutes, puis Réglages → le compteur doit afficher 9 (et non 10).
**Bonne nouvelle Play Integrity** : votre analyse de 13:38 a envoyé le seul vrai jeton reçu en 7 jours, et il est
**valide** : votre téléphone passe la vérification anti-abus.
**Prochain run de code : 6f**, la période de lancement (« Premium offert pendant le test », date réglée côté relais,
interrupteur pour vous laisser retester l'abonnement), puis la sauvegarde Android (règles qui excluent les clés de la
montre, textes honnêtes). **Nouvelle action facultative : P28** (retirer un droit trop large au compte Compute par
défaut, une commande, détail dans [`PRODUIT.md`](PRODUIT.md) §4).

**Run du 24/10 12:30 — la montre envoie maintenant son stress (M4).** Le bilan Play Integrity du run précédent ne
montre que 6 envois **sans jeton** en 7 jours (essais de la CI et vieilles versions), aucun de votre téléphone : la
protection des crédits IA reste donc en mode « observation » (rien n'est bloqué) jusqu'à ce que vous ayez fait une
analyse IA d'un repas depuis la version Play. Ce run a donc repris le **chantier montre** : à chaque synchro,
Halcya télécharge le **fichier de stress** de la montre (le score 1–99 que la montre calcule elle-même, et son
niveau), avec rattrapage des 60 derniers jours la première fois. Ce que vous verrez (les deux versions) :
**Réglages → Sources → « Données de la montre »** a une ligne **« Stress (montre) »** (dernière valeur, date, nombre
sur 7 jours) au lieu de « à venir », et **Journal → Jours** montre une puce **« Stress montre 37 / 99 »** (moyenne du
jour). Ce stress est rangé **à part** du « Stress » que vous notez vous-même : c'est un facteur possible du bien-être,
jamais une entrée de son estimation (règle anti-circularité, test à l'appui). **👉 À tester sur votre GT 6 Pro** :
vérifiez que « Stress automatique » est activé sur la montre (Huawei Santé → Stress, test de calibration fait une
fois), portez-la une demi-journée, synchronisez depuis la carte montre puis envoyez une capture de « Données de la
montre » : la ligne « Stress (montre) » doit dire « reçu ». Si elle dit « non pris en charge » ou « vide », le journal
technique saura dire pourquoi. **👉 Votre prochaine action la plus utile reste P27** (test de l'abonnement, ≈ 30 min,
[`PRODUIT.md`](PRODUIT.md) §4), avec une analyse IA de repas au passage. **Prochain run de code** : M6 (relecture en
arrière-plan du sommeil détaillé et du stress, rattrapage complet), puis M7 (courbe FC et allure des séances).

**Run « idées » du 24/10 08:30 — l'abonnement est prêt à être créé, et une précision importante pour P23 (rien de
nouveau dans l'app).** ① **6d est spécifié appel par appel** ([`IDEES.md`](IDEES.md) I158) : le prochain run de code
crée chez Google l'abonnement `halcya_premium` (identifiant que l'app attend déjà), ses formules **annuel 29,99 €** et
**mensuel 4,99 €** pour la France, l'**essai gratuit de 14 jours** réservé aux personnes qui n'ont jamais eu
l'abonnement, la période de grâce et la suspension de compte (Google impose que les deux additionnées fassent 30 à
60 jours), puis les active (tout naît en brouillon). Rien n'est lancé tout seul : c'est un workflow à déclencher, qui
relit d'abord ce qui existe (les identifiants ne pourront plus jamais changer). Si Google refuse tant que votre
banque n'est pas vérifiée, j'écrirai l'erreur exacte. ② **6e est prêt** (I159) : avec votre adresse de testeur de
licence, Google accélère tout (essai de 3 min, renouvellement mensuel toutes les 5 min, annuel toutes les 30 min,
période de grâce 5 min) ; vous pourrez vérifier achat, essai, annulation, échec de paiement, pause et restauration en
**une trentaine de minutes**, avec 7 cases à cocher. ③ **Pour P23, une précision** (I161) : déclarer le groupe des
testeurs comme testeurs de licence (option ①) les fait acheter sans payer, mais leur abonnement s'arrête **au bout
d'environ 3 heures** (6 renouvellements accélérés au plus) ; c'est l'option ② (« période de lancement » réglée sur le
relais) qui leur garde le premium pendant les 14 jours. D'où la recommandation « ① + ② ». **Prochain run de code :
6d.** **👉 En attente de vous : confirmer le virement de test de Google (P13)**, puis P23 (« ① + ② » ou autre).

**Run du 24/10 07:30 — la mesure du premier lancement de la version Play a trouvé un vrai bug, corrigé (VC-9).**
À chaque PR et sur `main`, l'émulateur « Galaxy A56 » (Android 15 et 16) installe maintenant la **version Play
neuve, sans données**, chronomètre l'arrivée du premier écran, relève les erreurs JavaScript et les plantages, et
**échoue** en cas de problème. Dès son premier passage il a échoué, à raison : sur un vrai téléphone, la version Play
**n'aurait jamais chargé les formules d'abonnement** (la liaison avec Google Play attendait pour toujours, à cause
d'une particularité de Capacitor), et le même défaut empêchait le jeton Play Integrity de partir avec les analyses IA.
Aucun test ne pouvait le voir, puisqu'ils utilisent de faux plugins. C'est corrigé, avec un test qui reproduit le
blocage ; la version Play l'annonce dans ses Nouveautés. Mesures : Android affiche l'app en 1,1 à 1,5 s, l'onboarding
est lisible au bout de 6,5 s après correctif (9 à 12 s avant) **sur un émulateur lent en build de débogage** (un vrai téléphone sera nettement plus
rapide : à confirmer par un testeur), aucun plantage. Détail dans le
[compte rendu](runs/2026-10-24-0730-vc9-premier-lancement.md). Un test instable (VC-19) a aussi été réparé.
**Prochain run de code : 6d** — créer l'abonnement `halcya_premium` (4,99 €/mois, 29,99 €/an avec 14 jours d'essai)
par l'API ; si Google refuse tant que votre banque n'est pas vérifiée, j'écrirai l'erreur exacte et réessaierai.
**👉 En attente de vous : confirmer le virement de test de Google (P13)**, puis P23 (testeurs sans paiement :
« ① + ② » ou autre).

**Run du 24/10 06:30 — des icônes fines à la place des émojis, et des apostrophes soignées (VC-15).** Ce que vous
verrez : dans **Réglages**, les lignes Données, Paramètres, Nouveautés, Confidentialité et Conditions ont les mêmes
**icônes fines** que la barre du bas (fini 🗂️ ⚙️ ✨ 🔒) ; la page **Repas** s'appelle enfin « Repas » (et non
« Alimentation ») et ses boutons Photo / Galerie / Décrire ont aussi des icônes fines ; l'onboarding, les Paramètres
et la note du soir suivent. Les titres de Pistes perdent leurs émojis décoratifs. Partout, **l'apostrophe devient
typographique** (« l’instant » au lieu de « l'instant », 59 textes). En coulisses : deux tests empêchent désormais le
retour d'un émoji ou d'une apostrophe droite dans les textes de l'app. Seul reste : les étiquettes d'habitudes (✈️
Voyage, ☕ Café…) gardent leur émoji, car ce sont vos données (VC-20, avec la refonte de Pistes). **Le critère C2
(textes relus) n'a plus de défaut connu ouvert.** **Prochain run de code : VC-9** (premier lancement à froid sur
l'émulateur, critère C4).

**Run du 24/10 05:30 — la page « Nouveautés » de la version Play ne raconte plus notre historique (VC-5).** Ce que
verront les testeurs de la version Play : Réglages → **Nouveautés** ne montre plus que les changements qui les
concernent, à partir du 24/10 (rappel de fin d'essai, conditions, suppression des données…), au lieu de nos 160
entrées d'historique, dont 36 parlaient de « HealthTrack », de la clé Gemini ou du bouton de mise à jour. Et à la
toute première ouverture, plus de bandeau « Nouveau : … et 150 autres changements » : il reviendra à la prochaine
mise à jour. **Votre version sideload ne change pas** : elle garde tout l'historique. En coulisses : une entrée peut
désormais être réservée à une variante (`"variants": ["play"]`), et un test refuse toute entrée visible en play qui
mentionnerait HealthTrack, Gemini, l'APK ou GitHub. **Prochain run de code : VC-15** (émojis et apostrophes), puis
VC-9 (premier lancement à froid sur l'émulateur).

**Run du 24/10 04:30 — l'app vous prévient 2 jours avant la fin de l'essai (VC-18, 2ᵉ moitié).** Ce que verront
les utilisateurs de la version Play : sur l'écran premium, la frise de l'essai a une étape de plus, **« jour 12 · On
vous prévient par une notification »**, et la petite ligne dit **« Rappel 2 jours avant la fin de l'essai »**. Ce
n'est plus une promesse en l'air : dès que l'essai commence, le téléphone programme une **notification locale**
(« Votre essai gratuit se termine dans 2 jours · Premier paiement samedi 7 novembre, sauf si vous annulez ») qui
ouvre directement la page « Abonnements » de Google Play. Elle se déplace si la date change, disparaît si l'essai
est annulé ou payé, survit à un redémarrage du téléphone, et l'app demande l'autorisation des notifications juste
après le début de l'essai si elle ne l'a pas. Rien ne quitte le téléphone ; votre version sideload n'est pas
concernée. Les conditions d'utilisation le disent aussi. **Le critère C3 n'attend plus que les abonnements eux-mêmes
(6d, après la validation de votre banque) et le scénario de bout en bout (6e).** À tester quand les abonnements
existeront : avec votre compte testeur de licence, l'essai est raccourci par Google (quelques minutes) — le rappel
tombera donc aussitôt. **Prochain run de code : VC-15** (émojis et apostrophes), puis VC-5 et VC-9.

**Run du 24/10 03:30 — l'envoi automatique sur Google Play résiste aux pannes passagères de Google.** Rien ne
change dans l'app. En coulisses : l'envoi de la **version play 394** (conditions d'utilisation) avait échoué cette
nuit sur un **« 503 — service momentanément indisponible »** des serveurs de Google, à la toute première lecture. Le
job a été relancé (vert : la 394 est bien partie en test interne), et surtout le script d'envoi (AAB et fiche du Store) **réessaie désormais tout seul** jusqu'à trois
fois (après 5, 10 puis 20 s) quand Google répond 429 ou 5xx ; les vrais refus (accès, version déjà envoyée…) ne sont
jamais réessayés. Rien à faire de votre côté. **Prochain run de code : VC-18, 2ᵉ moitié** (rappel local J−2 de fin
d'essai), puis VC-15 et VC-5.

**Run du 24/10 02:30 — les conditions d'utilisation et de vente existent (VC-18, 1ʳᵉ moitié).** Ce que vous
verrez : Réglages → **Conditions**, et un lien **« Conditions »** à côté de « Confidentialité » en bas de l'écran
premium. La page dit, en mots simples : ce que fait l'app (des pistes, « une estimation, pas un diagnostic », pas un
dispositif médical), ce qui est **toujours gratuit**, les crédits IA (10 offerts puis 15 par mois ; 10 par jour en
premium — chiffres vérifiés par un test contre ceux du relais), et l'abonnement Google Play : prix et essai **lus
dans Google Play** (aucun prix écrit dans le texte), renouvellement automatique, annulation, période de grâce, pause,
remboursements par Google Play, restauration. Elle est embarquée dans l'app et publiée par GitHub Pages à
https://spreadzenox.github.io/HealthTrack/conditions/ (lien à coller plus tard dans la fiche Play si besoin). C'est
un **brouillon à faire valider par un juriste (P5)**. **👉 Nouvelle action pour vous, avant la mise en vente (pas
pour le test fermé) : P26** — adhérer à un médiateur de la consommation (obligatoire pour vendre à des particuliers
en France), dont le nom sera ajouté aux conditions. **Prochain run de code : VC-18, 2ᵉ moitié** (rappel local
« votre essai se termine dans 2 jours », puis seulement la frise « jour 12 : on vous prévient »), puis VC-15 et VC-5.

**Run du 24/10 01:30 — vous pouvez tout effacer depuis l'app (VC-10).** Ce que vous verrez : Réglages → **Données**
a un 3ᵉ bloc **« Supprimer »**. « Supprimer toutes mes données » affiche d'abord combien d'entrées seront effacées,
propose **« Exporter d'abord »**, puis « Supprimer définitivement » ou « Garder mes données ». Sont effacés : repas,
notes, mesures, lectures du visage et profil. **Restent exprès** : vos réglages, vos connexions (et leurs dates de
reprise, pour que l'historique ne revienne pas à la synchro suivante), l'appairage de la montre (pas de nouvel
appairage à refaire), l'abonnement et les crédits IA. La politique de confidentialité le dit désormais. C'est un
point attendu par Google Play (suppression des données dans l'app) et par le RGPD. **Prochain run de code : VC-18**
(rappel de fin d'essai, page Conditions), puis VC-15 et VC-5. **👉 En attente de vous : P23** (testeurs sans paiement).

**Run du 23/10 23:30 — la page Premium ne promet plus que ce qui marche (VC-17).** Sans réponse de votre part à
**P25**, j'ai appliqué l'option ① (réversible) : le paywall — et le dernier écran de l'onboarding — ne coche plus que
**l'analyse IA des repas sans compter les crédits, jusqu'à 10 par jour**. Les pistes avec délais, la réintroduction
FODMAP et le rapport PDF sont sous **« détails »**, dans « En préparation, inclus sans supplément ». Un test empêche
désormais de cocher un avantage qui n'est relié à aucune fonction. Reste pour le critère C3 (**VC-18**) : le rappel 2
jours avant la fin de l'essai (rien ne l'envoie encore, donc je ne l'affiche pas) et une page « Conditions ».
**Prochain run de code : VC-18**, puis VC-15 et VC-5. **👉 En attente de vous : P23** (testeurs sans paiement) ; P25
seulement si vous préférez ② ou ③.

**Run du 23/10 22:30 — Pistes, Tendances et Paramètres plus cohérents au début (VC-12, VC-14, VC-16).** Ce que vous
verrez : sur **Pistes**, tant que vos jours ne suffisent pas, il n'y a plus qu'**un seul compteur** (la carte lilas
« Vos pistes arrivent dans N jours ») ; l'autre seuil (5 jours de note de bien-être) est rangé sous **« détails »**.
Dans **Journal → Tendances** vide : « Activez la lecture du visage ou notez-le avec « Une note » » et « Ajoutez une
montre dans **Sources** » (au lieu de « via Health Connect », faux pour la Huawei). Dans la **version Play** : le
réglage **« Cigarettes »** disparaît des Paramètres sur une installation neuve (il reste chez qui l'a activé ; le
bouton « + 1 cigarette » de l'Accueil revient toujours si une cigarette a été notée). Votre version sideload ne perd
rien. **Prochain run de code : VC-17** selon votre réponse à **P25** (sans réponse : ①, ne cocher que ce qui est
livré), puis VC-15 et VC-5. **👉 En attente de vous : P25 (①, ② ou ③) et P23** (testeurs sans paiement).

**Run du 23/10 21:30 — page Sources plus claire en version Play (VC-7 + VC-13).** Ce que vous verrez : les cartes
**Lecture du visage**, **Temps d'écran** et **Météo** tiennent en deux lignes (ce que ça fait, ce qui sort ou non du
téléphone) ; le reste est sous **« Détails »**. Dans la **version Play** seulement : la carte **Withings** (qui
demandait un identifiant et un secret de développeur) n'est plus proposée — Withings passe déjà par Health Connect —
sauf chez quelqu'un qui l'utilise déjà ; et le guide **« Votre montre n'apparaît pas ? → Huawei / Honor »** renvoie
maintenant à **« Connecter ma montre »** (connexion directe), Gadgetbridge seulement en dernier recours, sans plus
demander d'aller lire un cookie avec F12. Dans les deux versions : si Huawei Santé est détecté sur le téléphone, la
ligne « Mes appareils » propose la connexion directe au lieu de Gadgetbridge. Pour vous (sideload, Withings branché) :
rien ne disparaît. **Prochain run de code : VC-12**, puis VC-17 selon votre réponse à **P25** (sans réponse : ①, ne
cocher que ce qui est livré). **👉 En attente de vous : P25 (①, ② ou ③) et P23** (testeurs sans paiement).

**Run du 23/10 19:30 — carte montre simple pour un nouvel utilisateur (VC-6 + VC-8, votre retour P17).** Ce que
vous verrez : dans **Sources → Montre Huawei**, le bloc **« Diagnostic » est toujours fermé** à l'ouverture, même
avant le premier appairage ; les termes techniques (HiChain, AES-GCM, « Fin d'association — 11 acceptés ») n'y
apparaissent qu'une fois déplié. Avant toute montre, la carte dit simplement « Connectez une montre compatible
Huawei… » avec le bouton **« Connecter ma montre »**, qui télécharge lui-même les 3 paramètres publics au premier geste
(plus de bouton « Télécharger les paramètres » ni de mention de licence en tête ; le collage reste sous
« Diagnostic »). En cas d'échec, le conseil reste visible sans rien déplier. Le lien **« Voir ce qui remonte de la
montre »** n'apparaît qu'après un premier appairage ; ouverte sans montre, la page **Données de la montre** affiche une
phrase et « Connecter une montre » au lieu de 12 lignes « Rien reçu ». Pour vous (montre déjà connectée) : rien ne
change, à part le Diagnostic replié. **Prochain run de code : VC-7** (Withings Body Scan masqué en play, textes des
cartes raccourcis), puis VC-5, VC-10, VC-9. **👉 Toujours en attente de vous : P23** (testeurs sans paiement).

**Run du 23/10 17:30 — la page Pistes vide parle comme l'Accueil (VC-2).** Ce que vous verrez sur une installation
neuve (ou tant qu'il n'y a pas assez de jours) : l'onglet **Pistes** montre **la même carte lilas que l'Accueil**
(« Vos pistes arrivent dans N jours », compteur X/21, « On préfère attendre plutôt que de vous montrer de faux
suspects »), puis une phrase simple : « Pas encore assez de jours mesurés — les liens avec votre bien-être demandent au
moins 5 jours avec une note de bien-être ». Disparus de cet état : « Données insuffisantes pour les recommandations
basiques », les onglets « ≥ 5j / ≥ 9j » et le 📊. Dès que l'analyse a des résultats (votre cas, avec vos données),
rien ne change : les onglets Analyse simple / avancée reviennent. **Prochain run de code : VC-3** (profil Nutrition
inventé), puis VC-6. **👉 Toujours en attente de vous : P23** (testeurs sans paiement).

**Run du 23/10 15:30 — le jalon 4 est livré, la passe « version candidate » commence (I156, VC-1).** Ce que vous
verrez : dans **Journal → Tendances** (sans montre), « après 3 semaines de mesures, Halcya compare… » n'est plus collé
(« mesures,Halcya ») ; même correction dans le message « accès à la caméra retiré » de la lecture du visage. Un test
empêche désormais tout mot collé au nom de l'app. En coulisses (I156) : l'onboarding note **sur le téléphone** les
écrans vus et celui où l'on s'est arrêté, et le **journal technique exporté** (Paramètres → Mode diagnostic →
Exporter) commence par cette ligne : avec 12 à 15 testeurs, on saura à quel écran on décroche, sans aucune
analytique ni envoi. **Prochain run de code : VC-4** (mode diagnostic masqué en version Play mais accessible aux
testeurs), puis les autres défauts VC. **👉 Toujours en attente de vous : P23** (testeurs sans paiement).

*Avant le 20/10 au soir :* **En bref** — **Une seule priorité, à votre demande du 18/10 au soir : que HealthTrack connaisse votre humeur et
votre bien-être sans que vous ayez rien à saisir.** L'humeur estimée ne viendra que de signaux émotionnels directs
(visage, voix, et vos notes quand vous le voulez) ; votre usage du téléphone / des réseaux sociaux et les signaux de la
montre (stress, VFC, cœur, sommeil) restent des **facteurs** que les Analyses comparent à votre humeur, jamais des
ingrédients de l'estimation. Plan et état des lieux : [`BIEN-ETRE-AUTO.md`](BIEN-ETRE-AUTO.md). **Depuis votre consigne du 19/10 au soir : une
humeur estimée s'affiche dès la première lecture, sans attendre 30 jours** ; vos notes ne font plus que l'affiner.
Tout le reste
(nettoyage, performance, autres appareils, petites finitions de la montre) est en pause sauf panne.

**🚑 Votre signalement du 20/10 19:05 — mise à jour bloquée sur « Téléchargement… » : corrigé (run 20/10 20:30).
À faire une seule fois, à la main**, car la version installée sur votre téléphone a encore l'ancien code et restera
bloquée : ① sur le Galaxy A56, ouvrez dans Chrome ou Samsung Internet
**https://github.com/spreadzenox/HealthTrack/releases/latest** ; ② sous « Assets », touchez **`HealthTrack-vNNN.apk`**
(**v188** ou plus récente, 33,6 Mo) ; ③ ouvrez le fichier téléchargé (notification ou
« Téléchargements ») ; si Android le demande, autorisez **ce navigateur** à installer des applis ; ④ touchez
**« Mettre à jour »**. Vos données sont gardées (même signature, installation par-dessus). Pour vérifier : Plus →
Nouveautés, « Version installée ». ⑤ **À la version suivante** (v189, publiée par le run du 20/10 22:30), touchez « Mettre à jour (33,6 Mo) » dans le bandeau :
vous devez voir la barre, les Mo et le temps restant, puis l'installateur. Si ça bloque encore, envoyez-moi une
capture du bandeau : il dit maintenant pourquoi. (La Lecture du visage s'arrête à chaque mise à jour : touchez
« Reprendre » dans la notification.)

**Run du 19/10 00:30 — les lectures du visage sont rangées dans votre historique.** Jusqu'ici, ce que la caméra
lisait au déverrouillage attendait dans une boîte privée du service. Désormais, à chaque ouverture de l'app (et à
chaque retour dedans), ces lectures — une dizaine de nombres par déverrouillage, jamais d'image — sont rangées dans
votre historique, sans doublon, puis retirées de la boîte. Elles sont donc **sauvegardées avec vos données** (export /
import JSON compris). Toujours **aucun chiffre affiché** : la carte dit seulement « N lectures gardées depuis le … »,
et le diagnostic combien comptent pour l'humeur. Seules les lectures **du déverrouillage** compteront : celles d'un
« Tester maintenant » restent du diagnostic, et c'est vérifié par un test automatique (sinon l'usage du téléphone
fausserait les liens qu'on vous montrera).

**Run du 19/10 02:30 — la calibration sur vos notes démarre.** HealthTrack sait maintenant décider, chaque semaine,
si ce que lit la caméra au déverrouillage suit vraiment **vos** notes de bien-être — dans un sens comme dans l'autre,
rien n'est supposé d'avance. Il faut 30 jours avec une note et des lectures, puis un accord net deux semaines de suite
pour qu'une humeur estimée ait le droit d'être affichée ; si le lien se perd, elle repasse en attente. En simulation :
moins d'un faux départ sur 100 en 4 mois quand il n'y a aucun lien, et un lien net reconnu en 3 mois 9 fois sur 10.
La carte dit « Calibration : N jours sur 30 ». Vos notes restent facultatives, mais **plus vous notez votre soirée,
plus vite ça aboutit**.

**Run du 19/10 04:30 — si Android arrête la lecture du visage, vous êtes prévenu.** Chaque mise à jour de l'app,
chaque redémarrage (et parfois One UI pour économiser la batterie) arrête la lecture du visage, et Android interdit
de la relancer sans vous. Désormais une notification discrète, sans son, « **Lecture du visage arrêtée** » apparaît
tout de suite après une mise à jour ou un redémarrage, sinon au plus tard dans l'heure : touchez **« Reprendre »**,
l'app s'ouvre et la relance d'elle-même. Ignorée, elle ne revient pas avant 6 h ; « Arrêter » éteint la lecture.

**Run du 19/10 06:30 — votre note du soir, d'un geste, sans ouvrir l'app.** Dans la fenêtre « Comment vous
sentez-vous ? », un nouveau bouton **« 🔔 Me la demander le soir »**. Allumé, il fait apparaître chaque soir une
notification discrète, sans son, avec **0 1 2 3 4 5** : un geste et c'est noté (« Noté : 4 sur 5 »), l'app n'a
même pas besoin de s'ouvrir. Elle arrive à l'heure où vous notez d'habitude (21 h au début), jamais deux fois, jamais
si vous avez déjà noté ce jour-là, et disparaît d'elle-même si vous l'ignorez. La note entre dans votre historique à
l'ouverture suivante, exactement comme une note saisie. Toujours facultatif — mais c'est ce qui fera aboutir le plus
vite la calibration du visage.

**Run « idées » du 19/10 08:30 — ce qui reste à capter.** Trois constats pour la suite. ① **Vos réseaux sociaux**
peuvent être comptés sans rien vous demander de plus : l'accès « Données d'utilisation » que vous avez déjà donné
suffit pour savoir combien de minutes vous passez sur les réseaux, la vidéo, les jeux, heure par heure. Ce sera un
**facteur** que les Analyses compareront à votre humeur, **sans aucun a priori** : les études récentes trouvent des
effets moyens minuscules et très différents d'une personne à l'autre — seules vos données diront ce qu'il en est
chez vous. C'est le prochain run de code. ② **Votre voix** : une étude de février 2026 (3 151 journaux vocaux) montre
que **ce que l'on dit** de sa journée en apprend bien plus que **le son** de la voix (qui fait à peine mieux que le
hasard). D'où le plan : une **dictée du soir** facultative (« journée crevante mais contente ») qui vous propose la
note et les étiquettes, l'audio n'étant jamais écrit nulle part ; pas de micro qui écoute en continu pour l'instant.
③ **Assez de déverrouillages ?** En simulation, le visage peut servir avec environ **12 à 16 lectures réussies par
jour** ; en dessous de 8, il faudrait beaucoup plus longtemps. Le diagnostic vous le dira — votre nombre de
déverrouillages est déjà connu de l'app.

**Run du 19/10 10:30 — la carte « Lecture du visage » est enfin visible (votre signalement de 08:37).** Vous ne la
trouviez pas, et pour cause : elle n'était mise en tête de Connecteurs **qu'une fois activée** ; tant qu'elle ne
l'était pas, elle était rangée dans le volet replié « Brancher une autre source », tout en bas de la page, sous la
montre. Désormais, dans l'app Android, elle est **toujours juste sous « Mes appareils »**, activée ou non, avec son
bouton « Activer la lecture du visage ». Un test automatique simule l'app Android native et vérifie qu'elle est là,
en tête, hors du volet replié. Et si le module du visage ne répondait pas (version trop ancienne…), la carte le dit
maintenant avec un bouton « Réessayer » au lieu de rester muette. **Pour vérifier votre version** : Plus →
Nouveautés, la première ligne dit « Version installée : … » ; la carte existe depuis la v168, la correction arrive
dans la version publiée juste après ce run (v173 ou plus).

**Run du 19/10 12:30 — le temps passé sur les réseaux sociaux, la vidéo, les jeux, compté tout seul.** L'accès
« Données d'utilisation » que vous avez déjà donné suffit : HealthTrack compte maintenant, chaque jour, les minutes
passées par type d'app (réseaux sociaux, messageries — à part —, vidéo, jeux), et heure par heure. La carte « Temps
d'écran et sommeil » ajoute « Dont réseaux sociaux 1 h 12 · vidéo 40 min… », et le journal de chaque journée une puce
« Réseaux sociaux ». Les Analyses comparent ces minutes à votre bien-être **sans aucun a priori** : rien n'est codé
comme « bon » ou « mauvais », et aucun conseil « passez moins de temps sur… » n'est proposé — vos données diront si,
chez vous, ça va de pair avec une meilleure ou une moins bonne humeur. C'est un **facteur**, jamais un ingrédient de
l'humeur estimée (vérifié par un test). Seul le nom de l'app ouverte est lu, jamais son contenu. Les 10 derniers
jours sont repris d'un coup.

**Run du 19/10 14:30 — moins de lectures du visage perdues, et le diagnostic dit si c'est assez.** Quand la caméra
ne voit pas votre visage au déverrouillage (tête tournée, pièce sombre…), elle **réessaie une seule fois, 2 secondes
plus tard** — toujours dans les 10 secondes qui suivent le déverrouillage, pour que la lecture reste celle du
déverrouillage et pas celle de ce que vous regardez ensuite. Et le **Diagnostic** de la carte dit maintenant, sur vos
7 derniers jours : combien de déverrouillages, de lectures et de lectures avec un visage vous avez par jour, et si
vous atteignez les **12 par jour** qui permettent à la calibration d'aboutir en 2 à 3 mois.

**Run du 19/10 16:30 — votre signalement de 15:05 : chaque déverrouillage est enfin repéré.** Vous aviez raison :
la lecture ne voyait **aucun** déverrouillage, donc aucune photo automatique (le test, lui, ne passe pas par là). Le
signal « déverrouillé » d'Android est envoyé par l'écran de verrouillage, et l'app l'écoutait d'une façon qui le
filtrait. C'est corrigé, et il y a désormais un **secours** : dans la minute qui suit l'allumage de l'écran,
HealthTrack regarde toutes les demi-secondes si l'écran de verrouillage a disparu — empreinte, visage ou Smart Lock,
le déverrouillage est vu même si Android ne prévient pas. Une seule lecture par déverrouillage. Si Android refusait
quand même la caméra en arrière-plan, la carte passe à **« À relancer »** (un geste, app ouverte) et un guide
explique comment accorder **l'accès permanent à la caméra** (Shizuku sans PC, ou ADB) ; le diagnostic dit s'il est
accordé. Le **Diagnostic** dit enfin combien de fois l'écran s'est allumé et combien de déverrouillages ont été vus
aujourd'hui (et par quelle voie), l'heure du dernier, comment le service a démarré, et les 5 dernières tentatives
avec leur résultat ou l'erreur exacte d'Android.

**Run du 19/10 18:30 — votre journée en une phrase.** Dans « Comment vous sentez-vous ? », un champ facultatif
**« En une phrase »** : écrivez, ou **dictez avec le micro du clavier**, « journée crevante mais contente, apéro le
soir », et HealthTrack vous **propose** « Note 3 » et « 🍷 Alcool » en puces à toucher — rien n'est coché sans vous,
et **la phrase n'est pas gardée**. Elle est lue sur le téléphone par deux listes de mots qui ne se recoupent jamais
(vérifié par un test) : les mots de votre **ressenti** ne proposent que la note (et « Stress »), ceux de votre
**journée** que les tags de contexte — sinon les Analyses compareraient votre humeur à elle-même. C'est la voix « par
le texte » qu'avait retenue la veille (ce qu'on dit en apprend plus que le son de la voix), sans permission micro.

**Run « idées » du 19/10 20:30 — avant de vous montrer une humeur estimée, s'assurer qu'elle ne ment pas.** En
rejouant la règle qui décidera si votre visage « suit vos notes », j'ai trouvé un piège : notre humeur ressemble à
celle de la veille, et ce que lit la caméra dérive aussi lentement pour des raisons sans rapport (la lumière qui baisse
en automne, des lunettes, une nouvelle coque). Deux choses qui dérivent chacune de leur côté ont l'air liées bien plus
souvent qu'on ne le croit : en simulation, la règle actuelle aurait affiché une humeur **sans fondement chez 1
personne sur 8**. Une correction (comparer chaque jour en laissant de côté la semaine qui l'entoure, et tenir compte
de cette ressemblance d'un jour à l'autre) ramène ce risque à 1 ou 2 sur 100 ; le prix, une calibration un peu plus
longue. Ce sera codé **avant** toute estimation du jour. J'ai aussi écrit d'avance comment lire votre diagnostic de la
lecture du visage, pour corriger dès qu'il arrive, et vérifié que Samsung propose un lien direct vers « Applis jamais
en veille » (un bouton possible si One UI endort la lecture). Rien de nouveau dans l'app ce soir.

**Run du 19/10 22:30 — votre consigne du soir : l'humeur estimée s'affiche dès la première lecture.** Le verrou
« Calibration : 0 jour sur 30… Rien n'est affiché avant… » a disparu. Dès qu'une lecture au déverrouillage a vu votre
visage, l'**accueil** affiche une carte **« Humeur estimée »** : votre bien-être du jour sur 0–5 (« moyenne, ≈ 2,8 / 5,
entre 1,6 et 4,0 »), une barre qui montre la fourchette, l'humeur à la dernière lecture, et une **confiance**
(faible / moyenne / bonne) qui dit pourquoi : nombre de lectures du jour, visage bien cadré ou de biais, lectures
concordantes ou dispersées, un seul signal pour l'instant (le visage). La même chose apparaît dans la carte « Lecture
du visage », et **« Tester maintenant » dit l'humeur de ce moment** (un test ne compte pas dans le jour). D'où vient le
chiffre : ① au début, un **modèle général des expressions** (sourire, sourire « des yeux », coins de la bouche
abaissés, froncement…) — une hypothèse de population, d'où la confiance faible ; ② il s'ajuste tout seul à **votre
visage habituel** au fil des jours (quelqu'un qui fronce toujours un peu n'est pas plus triste pour autant) ; ③ si
vous donnez des notes (facultatif), au bout de 14 jours notés il passe à un **modèle personnel**, seulement s'il
prédit vraiment mieux vos notes. L'étape suivante remplacera ① par un vrai modèle valence / éveil embarqué, plus
fiable. Toujours une estimation, jamais un diagnostic ; le diagnostic exportable ne contient aucune valeur d'humeur.

**Run du 20/10 00:30 — une humeur estimée qui ne se laisse pas tromper par les saisons.** Votre humeur ressemble à
celle de la veille, et ce que lit la caméra change lentement pour des raisons sans rapport (lumière d'automne,
lunettes, coque). En simulation, sans aucun lien réel, l'app aurait adopté un « modèle personnel » appris sur vos notes
**plus d'une fois sur deux**, et sa vérification « votre visage suit vos notes » se serait trompée 1 fois sur 8.
Corrigé : chaque jour est jugé sans la semaine qui l'entoure, l'effet « humeur qui dure » est retiré, et si votre
visage dérive nettement, chaque lecture est comparée à vos 14 jours précédents → 1 à 3 erreurs sur 100. **Rien ne
change à l'affichage** : l'humeur estimée est toujours là dès la première lecture ; seul le passage au modèle
personnel est plus prudent (après la vérification réussie, vers 6 semaines de notes au lieu de 14 jours).

**Run du 20/10 02:30 — l'humeur estimée par un vrai modèle valence / éveil (étape 2 de votre consigne du soir).**
Vous vouliez « un modèle plus puissant » : chaque lecture du déverrouillage passe désormais aussi par **HSEmotion**, un
modèle de reconnaissance des émotions appris sur des centaines de milliers de visages, qui donne directement la
**valence** (agréable ↔ désagréable) et l'**éveil** (calme ↔ animé) — sur des photos qu'il n'a jamais vues, son accord
avec des annotateurs humains est de 0,59 pour la valence et 0,55 pour l'éveil (CCC), le meilleur compromis précision /
poids / licence trouvé (comparatif dans [`BIEN-ETRE-AUTO.md`](BIEN-ETRE-AUTO.md)). La carte « Humeur estimée » dit
maintenant aussi l'éveil (« plutôt calme », « modéré », « plutôt animé ») et quel modèle a servi ; la fourchette est un
peu plus étroite. Le modèle (16 Mo) n'est **pas dans l'APK** : le téléphone le télécharge une fois depuis le dépôt de
ses auteurs à la première ouverture de la carte « Lecture du visage » (lecture active), et ne le garde que si son
empreinte est exacte — ses poids ont été appris sur une base d'images réservée à la recherche, je préfère ne pas les
redistribuer moi-même. Rien ne part de votre téléphone. En coulisses : moteur ONNX Runtime 1.22, choisi parce que les
versions plus récentes ajoutent une télémétrie vers Microsoft ; l'APK grossit d'environ 18 Mo.

**Run du 20/10 04:30 — vos facteurs comparés à votre humeur estimée, sans aucune note.** Jusqu'ici, les Analyses ne
comparaient votre sommeil, vos pas, votre écran ou vos réseaux sociaux qu'à vos **notes** de bien-être — et sans notes,
elles restaient vides. Désormais, chaque jour avec au moins 3 lectures du visage au déverrouillage reçoit une **humeur
estimée** (médiane de ses lectures), et Analyses → Analyse simple ajoute une section **« 🙂 Avec votre humeur estimée
(visage) »** : ce qui va de pair, chez vous, avec une meilleure ou une moins bonne humeur estimée, avec les mêmes
garde-fous que pour vos notes (week-end, jours qui se ressemblent, nombre de facteurs testés). Elle s'affiche **même
sans aucune note** ; avant 14 jours estimés, elle dit « N jours sur 14 ». L'humeur estimée ne vient que de votre visage
(et de vos notes si vous en donnez) : aucun facteur comparé ne sert à l'estimer (vérifié par un test), et ce que vous
faites après la dernière lecture d'un jour (avant 20 h) ne compte pas pour ce jour-là. Aucun comportement jugé bon ou
mauvais d'avance ; ce sont des hypothèses à observer, pas des causes.

**Run du 20/10 06:30 — si la lecture du visage s'arrête, la carte dit pourquoi ; « Applis jamais en veille » sur
Samsung (point (c) de votre signalement du 15:05).** Une lecture arrêtée disait seulement « Android a arrêté… (mise à
jour, redémarrage, économie d'énergie…) ». Elle dit maintenant **laquelle** : la mise à jour de l'app, un redémarrage,
ou **le téléphone lui-même** sans l'un ni l'autre — sur un Samsung, c'est presque toujours la mise en veille des applis
de One UI, qui agit **même quand la batterie est « sans restriction »**. Dans ce cas, un bouton **« Applis jamais en
veille »** ouvre directement la liste de One UI : touchez « + » et cochez HealthTrack. Le bouton est aussi, sur un
Samsung, dans le Diagnostic, et le diagnostic enregistré dit la cause du dernier arrêt.

**Run « idées » du 20/10 08:30 — le meilleur modèle pour votre visage, et pourquoi pas encore la voix.** J'ai
comparé, fichiers officiels en main, les modèles qui lisent l'humeur (valence) et l'éveil sur un visage. Sur des
photos de bases de recherche, le plus lourd paraît bien meilleur ; **sur de vraies vidéos, tous se valent** — ce qui
améliore vraiment l'estimation, c'est de **moyenner plusieurs images et plusieurs lectures**, ce que l'app fait déjà.
D'où la prochaine étape : ajouter au modèle actuel un **second modèle officiel des mêmes auteurs, deux fois plus
léger (8 Mo)**, et faire voter les deux : quand ils sont d'accord, la confiance monte ; quand ils divergent, la
fourchette s'élargit. EmoNet, souvent cité, est **définitivement écarté** (licence qui interdit de l'adapter au
téléphone). Pour **la voix** : aucun modèle du son de la voix n'est à la fois assez léger et sous une licence qui nous
permette de l'utiliser (les meilleurs sont réservés à la recherche) ; la voix passera donc d'abord par **ce que vous
dites** (la phrase du soir, puis la dictée). Rien de nouveau dans l'app ce matin.

**Run du 20/10 10:30 — deux modèles lisent votre visage, et leur accord entre dans la confiance.** Comme proposé par
le run « idées » de ce matin : chaque lecture du déverrouillage passe maintenant par **deux** modèles officiels des
mêmes auteurs (HSEmotion) — celui d'hier (EfficientNet, 16 Mo) et un second, plus léger (**MobileFaceNet, 8 Mo**),
qui lit le visage autrement (en 112 px, moins sensible à la basse résolution). L'humeur estimée est la **moyenne des
deux** ; quand ils sont d'accord, la fourchette se resserre un peu, quand ils divergent elle s'élargit — sans jamais
déplacer l'estimation elle-même. La confiance le dit en clair : « deux modèles d'accord », « à peu près d'accord » ou
« en désaccord ». Le second modèle se télécharge tout seul (8 Mo, une fois, empreinte vérifiée) à la prochaine
ouverture de la carte « Lecture du visage », **même si le premier est déjà là** ; le Diagnostic dit « Second modèle
(MobileFaceNet) : prêt · N lectures lues par les deux modèles ». Vérifié : l'image préparée par le téléphone pour ce
modèle est identique, à 1/10 000 près, à celle que prépare la bibliothèque officielle des auteurs.

**Run du 20/10 12:30 — votre téléphone sait-il reconnaître votre voix sans Internet ?** La voix entrera dans
l'humeur estimée par **ce que vous dites** (une dictée du soir), pas par le son — à condition que la reconnaissance
se fasse **sur le téléphone** : sinon le son de votre voix partirait sur Internet, ce que je refuse. Avant d'écrire
la dictée, le **Diagnostic** de la carte « Lecture du visage » le vérifie : une nouvelle dernière ligne **« Voix »**
dit si la reconnaissance est sur le téléphone ou seulement en ligne, si le français est installé ou à télécharger,
et quel moteur (Google, Bixby…). **Aucun micro n'est ouvert**, aucune permission demandée : l'app pose seulement la
question à Android, une fois, quand vous dépliez le Diagnostic. C'est aussi dans le fichier enregistré.

**Run du 20/10 14:30 — vos habitudes comparées à votre humeur estimée, sans aucune note.** Dans Analyses, la
section « Avec votre humeur estimée (visage) » ne compare plus seulement sommeil, pas, écran… : elle dit aussi, pour
**vos habitudes** (alcool, café après 14 h, écran tard, sport le soir…), si l'humeur lue sur votre visage **le
lendemain** est meilleure ou moins bonne les jours avec que les jours sans, et s'il y a des **effets décalés** (ce que
vous avez fait la veille ou 2–3 jours avant, à humeur de la veille égale). Les habitudes que le téléphone mesure seul
(écran tard, sport le soir, voyage) comptent même un soir sans lecture du visage ; celles que vous cochez dans une note
comptent aussi. Le **stress** ressenti fait partie de l'humeur : il n'est jamais comparé (sinon l'humeur serait
comparée à elle-même). Aucun sens présupposé, aucune « piste » : un lien est une hypothèse à observer. Les liens
incertains sont repliés. Rien à faire de votre côté : ça apparaît après 14 jours avec au moins 3 lectures du visage.

**Run du 20/10 16:30 — les lectures nettes comptent plus.** Le bien-être estimé du jour ne met plus toutes les
lectures du visage sur le même plan : une lecture prise de biais, floue, ou où les deux modèles hésitent compte
**moins** qu'une lecture bien cadrée (aucune n'est jetée). La carte « Humeur estimée » le dit (« 2 lectures peu nettes
comptées moins ») et sa fourchette se resserre moins vite dans ce cas : la confiance reste honnête. Même règle pour
l'humeur estimée jour par jour des Analyses. Rien à faire de votre côté.

**Run du 20/10 18:30 — la lumière compte aussi.** Chaque lecture du visage mesure maintenant la **lumière sur votre
visage** (un seul nombre, jamais d'image). Une lecture prise dans la pénombre ou sous une lumière trop vive compte un
peu moins dans le bien-être du jour, sans que sa note bouge ; la carte le dit (« souvent dans la pénombre ») quand
c'est le cas de la plupart des lectures de la journée. La lumière n'entre **jamais** dans l'humeur elle-même ni dans
la vérification visage ↔ notes : elle suit l'endroit et l'heure (dehors, bureau, soir), c'est du contexte, pas une
émotion — vérifié par un test. Le Diagnostic ajoute « lumière correcte / souvent dans la pénombre » à la ligne
« Humeur estimée ». Rien à faire de votre côté (la mesure commence avec la version publiée après ce run).

**Run du 20/10 20:30 — la mise à jour en un clic montre enfin où elle en est (votre signalement de 19:05).** La
cause : depuis la v180, l'app pèse 33,6 Mo (contre 6,8 Mo il y a trois jours) et l'ancien bouton chargeait tout le
fichier en mémoire d'un bloc, sans délai ni progression — sur 4G il pouvait ne jamais finir, sans rien dire. Désormais
c'est **Android qui télécharge** : le bandeau indique la **version installée**, la nouvelle et sa **taille**, puis une
**barre de progression** « 12,3 Mo / 33,6 Mo · 36 % · 1,4 Mo/s · encore ≈ 14 s » et les étapes **Téléchargement →
Vérification → Installation**. Vous pouvez quitter l'app : le téléchargement continue avec sa notification et reprend
seul après une coupure. Si plus rien n'arrive pendant 45 s, ou en cas d'échec, le bandeau dit pourquoi (pas de réseau,
stockage plein, fichier abîmé…) et propose **« Réessayer »** ou **« Télécharger depuis le navigateur »**. Avant
l'installateur, le fichier est vérifié (taille et empreinte publiées avec la version). Ce qui pèse, au passage : pas
les modèles du visage (≈ 4 Mo) mais le moteur ONNX (18 Mo) — je proposerai de s'en passer pour revenir vers 15 Mo.
*Ce créneau de 20:30 était un run « idées » ; la veille est reportée à 08:30 pour corriger d'abord votre mise à jour.*

**Nouveau (12:30, voix)** : dans le Diagnostic, lisez la ligne « Voix … » (ou envoyez-moi le fichier, qui la
contient) : elle décide comment sera faite la dictée du soir.

**✅ Signalement du 19/10 15:05 résolu** (votre capture du 20/10 19:05 montre 44 lectures automatiques). *Ancienne consigne, pour mémoire* — : ① installez la version publiée après ce run (≥ celle du
19/10 ~17 h) ; ② Plus → Connecteurs → Lecture du visage : si elle dit « Arrêtée » ou « À relancer », touchez
**Relancer** ; ③ verrouillez puis **déverrouillez 2 ou 3 fois à l'empreinte** en regardant l'écran, à plus de
2 minutes d'écart si possible (le point vert doit s'allumer ~1 s après) ; ④ **Diagnostic → « Enregistrer le
diagnostic »** et envoyez-moi le fichier (ou une capture des lignes « Aujourd'hui : écran allumé… », « Accès
caméra… » et « Dernières tentatives… ») : elles suffisent à trancher. **Nouveau (22:30)** : avec la version publiée
après le run de 22:30, revenez sur l'accueil après ces déverrouillages : la carte **« Humeur estimée »** doit être
apparue (sinon, c'est qu'aucune lecture du déverrouillage n'a vu votre visage — le diagnostic dira pourquoi). Dites-moi
aussi si l'estimation vous semble plausible, et touchez « Tester maintenant » en souriant puis sans sourire : la
phrase « Humeur de ce moment » doit changer.

**Nouveau (10:30, second modèle)** : après la mise à jour, ouvrez la carte « Lecture du visage » en Wi-Fi (8 Mo),
rouvrez-la une minute plus tard : le Diagnostic doit dire « Second modèle (MobileFaceNet) : prêt ». Après quelques
déverrouillages, la ligne « Humeur estimée : … deux modèles : accord / partiel / désaccord » apparaît, et le temps
d'analyse (« Temps moyen : … analyse N ms ») me dira ce que coûte le second modèle sur l'A56 (attendu : +20 à 60 ms).

**Nouveau (06:30, une minute)** : Plus → Connecteurs → Lecture du visage → Diagnostic → **« Applis jamais en
veille »** → « + » → cochez HealthTrack (préventif : One UI ne l'endormira plus). Si un jour la carte dit « Le
téléphone a arrêté la lecture… de lui-même », envoyez-moi le diagnostic : la ligne « Arrêt : … » me le confirmera.

**Nouveau (02:30, modèle valence / éveil)** : après la mise à jour, ouvrez la carte « Lecture du visage » une fois en
Wi-Fi (16 Mo), rouvrez-la une minute plus tard : le Diagnostic doit dire « Modèle valence / éveil : prêt ». Après vos
déverrouillages, la carte « Humeur estimée » de l'accueil doit dire « Modèle valence / éveil embarqué (HSEmotion) » et
une ligne « Éveil ». Le diagnostic exporté contiendra le temps d'analyse et l'erreur exacte s'il y en a une. Dites-moi
si l'humeur et l'éveil vous paraissent plausibles (« Tester maintenant » en souriant, puis sans sourire).

**Ce qu'il me faut (votre Galaxy A56)** — c'est l'étape qui débloque la suite : après la mise à jour (vérifiez dans
Plus → Nouveautés que la version installée est au moins celle publiée le 19/10 vers 11 h), Plus → Connecteurs → la
carte **Lecture du visage**, juste sous « Mes appareils » → **« Activer la lecture du visage »** (accepter l'appareil photo) →
**« Sans restriction »** (accepter) ; utilisez le téléphone normalement quelques heures ; puis **Diagnostic →
« Enregistrer le diagnostic »** et envoyez-moi le fichier `Documents/healthtrack-visage-….json` (ni image ni mesure
dedans ; il dit maintenant aussi combien de lectures sont rangées). Dites-moi si le **point vert** s'allume environ
1 s après chaque déverrouillage. **Nouveau (temps par app)** : un soir, une capture de la ligne « Dont réseaux
sociaux … » (Plus → Connecteurs → Temps d'écran et sommeil) et une de Paramètres → Bien-être numérique (détail des
apps du jour), pour vérifier que les chiffres concordent. **Nouveau (lectures par jour)** : dans le diagnostic
exporté après une semaine, la ligne « Par jour » et la ligne « 2e essais » m'indiqueront si le visage donne assez. **Nouveau (phrase du soir)** : dictez une phrase dans « En une phrase » et dites-moi si la note et les tags proposés tombent juste (et les mots ratés). **Nouveau (facultatif)** : allumez « 🔔 Me la demander le soir » dans la saisie bien-être, autorisez les
notifications, et dites-moi si la notification arrive le soir, si les 6 chiffres sont lisibles et si la note
apparaît dans le journal à l'ouverture suivante. **Test « Reprendre »** : juste après l'installation de cette mise à jour, sans ouvrir l'app, une
notification « Lecture du visage arrêtée » devrait apparaître (si la lecture était activée) ; touchez « Reprendre »
et dites-moi si l'app s'ouvre et si le point vert revient au déverrouillage suivant.

**Nouveau dans l'app** (Plus → Nouveautés après la mise à jour en 1 clic)
- **Habitudes et effets décalés avec l'humeur estimée (run 20/10 14:30)** : Analyses → section visage, « Le
  lendemain : humeur estimée … contre … sans », stress jamais comparé, aucune piste.
- **Sonde vocale dans le Diagnostic (run 20/10 12:30, I124)** : ligne « Voix » — reconnaissance sur le téléphone ou
  en ligne, français installé / téléchargeable, moteur ; aucun micro ouvert.
- **Deux modèles du visage qui votent (run 20/10 10:30, I126)** : humeur = moyenne d'EfficientNet et de
  MobileFaceNet ; leur accord resserre ou élargit la fourchette ; « Second modèle » dans le diagnostic.
- **Lecture du visage : cause de l'arrêt et « Applis jamais en veille » (run 20/10 06:30)** : mise à jour,
  redémarrage ou téléphone ; bouton One UI direct sur Samsung ; ligne « Arrêt : … » dans le diagnostic.
- **Facteurs comparés à votre humeur estimée (run 20/10 04:30)** : Analyses → « Avec votre humeur estimée (visage) »,
  sans aucune note, dès 14 jours avec ≥ 3 lectures du visage.
- **Humeur estimée par un modèle valence / éveil (run 20/10 02:30, votre consigne du soir, étape 2)** : HSEmotion sur
  le téléphone (16 Mo téléchargés une fois), éveil affiché, diagnostic « Modèle valence / éveil ».
- **Humeur estimée robuste aux dérives lentes (run 20/10 00:30)** : le « modèle personnel » ne s'installe plus sur
  une simple coïncidence de saison ; le diagnostic dit combien votre visage dérive.
- **Humeur estimée dès la première lecture (run 19/10 22:30, votre consigne du soir)** : carte sur l'accueil et dans
  « Lecture du visage », bien-être du jour sur 0–5 avec fourchette et confiance ; plus de verrou des 30 jours.
- **Lecture du visage : chaque déverrouillage repéré (run 19/10 16:30, votre signalement)** : empreinte, visage,
  Smart Lock ; état « À relancer » si Android refuse la caméra ; guide d'accès permanent ; diagnostic détaillé.
- **Lecture du visage : 2e essai et lectures par jour (run 19/10 14:30)** : une lecture ratée est reprise une fois
  2 s plus tard ; le diagnostic dit si vous avez assez de lectures par jour (12 visées).
- **Temps par type d'app (run 19/10 12:30)** : réseaux sociaux, messageries, vidéo, jeux, comptés seuls et comparés à
  votre bien-être sans a priori.
- **Carte « Lecture du visage » visible (run 19/10 10:30)** : toujours juste sous « Mes appareils », même pas encore
  activée ; « Réessayer » si le module ne répond pas.
- **Note du soir d'un geste (run 19/10 06:30)** : une notification 0–5 le soir, notée sans ouvrir l'app.
- **Lecture du visage : notification « Reprendre » (run 19/10 04:30)** : quand Android l'arrête, un geste suffit
  pour la relancer.
- **Lecture du visage : calibration (run 19/10 02:30)** : la carte dit combien de jours sur 30 ont une note et des
  lectures (depuis le 19/10 22:30 : vérification facultative, elle ne bloque plus l'affichage).
- **Lecture du visage : lectures gardées (run 19/10 00:30)** : rangées dans l'historique à chaque ouverture, comprises
  dans la sauvegarde ; la carte dit combien sont gardées ; rien n'est affiché avant la calibration.

**Points d'attention**
- Les points ouverts de la semaine dernière (montre, Google et l'installation hors Play Store en 2027, etc.) sont dans
  [`semaines/2026-S42.md`](semaines/2026-S42.md) ; aucun n'a changé.

**Meilleures idées des runs « idées »** (détail, sources et notes dans [`IDEES.md`](IDEES.md))
- **Deux modèles du visage qui votent** (I126, 20/10 08:30) : hors des bases de recherche, les modèles se valent ;
  la moyenne de deux modèles officiels et leur désaccord donnent une humeur plus stable et une confiance honnête.
- **Temps par app comme facteur, sans liste de « mauvaises » apps** (I116, 19/10 08:30) : catégories déclarées par
  les apps elles-mêmes, minutes par heure, comparées à votre humeur **après coup** seulement.
- **La voix par ce que vous dites, pas par le son** (I117, I119) : une seule prise de son lue deux fois, aucun
  fichier ; mots du ressenti (humeur) et mots du contexte (facteurs) dans deux listes qui ne se croisent jamais.
- **Une humeur estimée qu'on peut croire** (I121, 19/10 20:30) : la calibration du visage doit tenir compte des
  dérives lentes (saison, lumière, humeur qui dure) ; simulé : 1 faux « ça marche » sur 8 sans correction, 1–2 sur 100
  avec.
- **Assez de lectures du visage, sans biais** (I118) : viser ≥ 12 lectures réussies par jour, toujours au
  déverrouillage (jamais quand une notification allume l'écran : son contenu fausserait tout).

**Prochaines priorités (20/10 20:30)** — ✅ mise à jour en un clic avec progression (signalement 19:05) ; votre
installation manuelle de la v188+ puis l'essai à la version suivante ; I129 alléger l'APK (retirer ONNX Runtime) ;
puis votre diagnostic (déverrouillages, duo, « Voix ») et la dictée du soir (I117).
*Prochaines priorités (20/10 18:30)* — ✅ I127 lectures pondérées, ✅ I127b lumière du visage ; ensuite : votre
diagnostic (déverrouillages, duo, ligne « Voix ») ; puis la dictée du soir (I117) selon la ligne « Voix ».
*Prochaines priorités (20/10 14:30)* — ✅ habitudes et effets décalés sur l'humeur estimée ; ensuite : votre
diagnostic (déverrouillages, duo, ligne « Voix ») ; I127 (lectures pondérées par leur qualité) ; puis la dictée du
soir (I117) selon la ligne « Voix ».
*Prochaines priorités (20/10 12:30)* — ✅ I124 sonde vocale ; ensuite : votre diagnostic (déverrouillages, duo,
ligne « Voix ») ; habitudes (tags) et effets décalés sur l'humeur estimée ; I127 ; puis la dictée du soir (I117)
selon la ligne « Voix ».
*Prochaines priorités (20/10 08:30, run idées)* — votre diagnostic d'abord ; sinon **I126** duo de modèles du
visage (désaccord = confiance), puis I124 sonde vocale, puis habitudes (tags) et effets décalés sur l'humeur estimée.
*Priorités précédentes (20/10 06:30)* — ✅ « Applis jamais en veille » + cause de l'arrêt (I123) ; ensuite : votre
diagnostic ; run idées 08:30 : licence d'EmoNet, modèles vocaux (étape 3) ; I124 sonde vocale ; habitudes (tags) et
effets décalés sur l'humeur estimée.
*Priorités précédentes (20/10 04:30)* — ✅ facteurs X comparés à l'humeur estimée (Y automatique) ; ensuite : votre
diagnostic (déverrouillages + modèle) ; run idées 08:30 : licence d'EmoNet, modèles vocaux (étape 3) ; « Applis jamais
en veille » (I123) ; habitudes (tags) et effets décalés aussi sur l'humeur estimée.
*Priorités précédentes (20/10 02:30)* — ✅ étape 2, modèle valence / éveil embarqué ; ensuite : votre diagnostic
(déverrouillages + modèle) ; la vérification visage ↔ notes lit aussi la valence du modèle ; run idées 08:30 : licence
d'EmoNet et modèles à licence de poids explicite, modèles vocaux (étape 3) ; « Applis jamais en veille » (I123).
*Priorités précédentes (20/10 00:30)* — ✅ dérives lentes (I121) corrigées dans la vérification et le modèle
personnel ; ensuite : votre diagnostic dès qu'il arrive ; le comparatif des modèles valence / éveil (run idées de
08:30) puis leur intégration (étape 2) ; « Applis jamais en veille » sur Samsung (I123) ; la voix (étape 3).
*Priorités précédentes (19/10 22:30)* — votre consigne du 19/10 au soir d'abord : ✅ étape 1, estimation affichée dès
la première lecture (22:30) ; **étape 2, un vrai modèle valence / éveil embarqué** (comparatif précision / poids /
licence par les runs idées, puis intégration, téléchargé au build avec vérification d'empreinte) ; étape 3, visage +
voix. En parallèle : votre diagnostic de la Lecture du visage dès qu'il arrive, et la robustesse aux dérives lentes
(I121) appliquée aussi au passage au « modèle personnel ».
*Priorités précédentes (19/10 20:30)* — uniquement le bien-être automatique : votre diagnostic de la Lecture du
visage (et l'adapter à One UI), ✅ temps par app comme facteur (19/10 12:30), ✅ lectures du visage par jour dans le
diagnostic + 2e essai (19/10 14:30), 🚑 déverrouillages enfin repérés + guide Shizuku / ADB (19/10 16:30, votre
signalement — **votre diagnostic après la mise à jour est attendu**), ✅ phrase du soir (19/10 18:30), **porte de
calibration robuste aux dérives lentes (I121, prochain run de code si le diagnostic n'est pas arrivé)**, puis estimation
du jour avec sa fourchette (derrière la porte).

| Run | Type | Résultat |
|---|---|---|
| 22/10 23:30 — [Relais : analyse des repas en panne (502)](runs/2026-10-22-2330-relais-analyse-502.md) | 🚑 | Révision 6b-1 en ligne mais analyse de test en 502 (relance et appel direct identiques) ; repli sur le modèle suivant aussi pour 400 / 5xx / réponse vide ou illisible (pas 429) ; message exact de Vertex AI dans le résumé du workflow ; 44 tests relais |
| 23/10 08:30 — [Idées : onboarding spécifié, import Health Connect du jour 1](runs/2026-10-23-0830-idees-onboarding.md) | 💡 | Jalon 4 écran par écran (I154 : 9 écrans, 4a / 4b / 4c, paywall soft, notifications hors onboarding) ; **VC-11** (I153 : 1re synchro HC sur 180 j alors que 30 j autorisés → rien importé sur installation neuve, `lastSyncAt` avance quand même) ; I155–I156 ; journal seul |
| 23/10 09:30 — [VC-11 : import Health Connect borné à 30 jours](runs/2026-10-23-0930-vc11-fenetre-hc.md) | 🧭 | `syncWindow.js` : 1re synchro HC bornée à 1re autorisation − 29 j (`firstGrantAt` noté sur installation neuve seulement) ; `lastSyncAt` n'avance plus si tout échoue (`lastAttemptAt`, réessai après 1 h) ; choix 7 / 30 jours + phrase ; 23 tests |
| 23/10 10:30 — [Jalon 4a : onboarding, écrans 1 à 3](runs/2026-10-23-1030-jalon4a-onboarding.md) | 🧭 | `/bienvenue` plein écran : maquette écran 1 (objectif, 18+), suivis, montre ; `settings/onboarding.js` (reprise, `maxStep`) ; redirection seulement si jamais fait **et** base vide (utilisateur existant → jamais) ; captures `--onboarding` ; 18 tests |
| 23/10 11:30 — [Jalon 4b : Health Connect, import et « aha »](runs/2026-10-23-1130-jalon4b-health-connect.md) | 🧭 | Écran Health Connect (divulgation `health_connect`, aussi dans Sources) ; import des 30 j avec progression réelle (`onProgress` de la synchro, types lus / total, 20 s puis arrière-plan) ; « Vos 30 derniers jours » (≤ 4 chiffres avec source, jamais de zéro) ; `services/firstImport.js` ; `--onboarding=aha` ; 17 tests |
| 23/10 12:30 — [Jalon 4c-1 : premier geste et paywall soft](runs/2026-10-23-1230-jalon4c-geste-paywall.md) | 🧭 | Écran « premier geste » selon l'objectif (`gut` ou `wellbeing` 0–5, une seule entrée modifiable) ; `/premium` intégré en dernier écran (play seulement, contexte `onboarding`, « Continuer gratuitement ») ; reprise d'un onboarding commencé même si la base s'est remplie ; `--onboarding=gesture|gesture-energy|premium` ; 6 tests |
| 23/10 14:30 — [I155 : l'objectif règle l'Accueil](runs/2026-10-23-1430-i155-objectif-accueil.md) | 🧭 | `homeFocus(goal)` ; objectif énergie → carte ventre en bas, pistes = nuits suivies d'une mesure du bien-être (`pistesProgress(entries, 'energy')`) ; bloc « Ce qui vous amène » dans Paramètres ; `--goal=energy` ; 7 tests |
| 23/10 15:30 — [I156 + VC-1 : onboarding mesuré, nom décollé](runs/2026-10-23-1530-i156-vc1.md) | 🧭 | `markScreenSeen` / `onboardingDiagnostic` ; ligne `[onboarding]` en tête de l'export du journal technique ; test-garde `gluedNames` (2 cas corrigés, dont `FaceSenseCard`) ; jalon 4 livré ; 6 tests |
| 23/10 16:30 — [VC-4 : mode diagnostic caché en Play](runs/2026-10-23-1630-vc4-diagnostic.md) | 🧭 | `featuresFor().debugMenu` (sideload seulement) ; 7 touches sur « Version N » en bas des Paramètres → `unlockDebugMenu` (n'active pas les journaux) ; visible si déjà actif ; 6 tests |
| 23/10 17:30 — [VC-2 : Pistes vide aligné sur l'Accueil](runs/2026-10-23-1730-vc2-pistes-vide.md) | 🧭 | État vide de `/recommendations` = `PistesTeaser` (même compteur que l'Accueil, objectif suivi, `onPistesPage` sans lien vers soi-même) + « Pas encore assez de jours mesurés » ; onglets masqués tant que l'analyse simple n'a rien ; « recommandations basiques », « ≥ 5j » et 📊 retirés de l'état vide ; 3 tests ; v232 (33,7 Mo) ; test `FaceSenseCard` fragile (horodatage) corrigé |
| 23/10 19:30 — [VC-6 + VC-8 : carte montre simple avant appairage](runs/2026-10-23-1930-vc6-vc8-carte-montre.md) | 🧭⌚ | `WatchConnect` : « Diagnostic » toujours replié, constantes téléchargées au premier « Connecter ma montre » (téléchargement/collage sous « Diagnostic »), conseil d'échec hors du repli ; lien `/montre` seulement après appairage ; `/montre` sans montre → phrase + bouton ; 4 tests |
| 23/10 20:30 — [Idées : audit play vierge après les correctifs VC](runs/2026-10-23-2030-idees-audit-vc.md) | 💡 | 18 captures `--play --empty` relues (0 erreur JS) ; **paywall : 3 avantages sur 4 non livrés → P25** ; VC-12 (Pistes : 2 seuils contradictoires), VC-13 (guide Huawei → Gadgetbridge + cookie F12 en play), VC-14 (cigarettes), VC-15 (émojis, apostrophes), VC-16 (Tendances) ; journal seul |
| 24/10 01:30 — [VC-10 : supprimer toutes mes données](runs/2026-10-24-0130-vc10-supprimer-donnees.md) | 🧭 | `deleteAllEntries` + `services/deleteAllData.js` (`DELETED_KEYS` / `KEPT_KEYS`) ; bloc « Supprimer » de Données (compte, export d'abord, confirmation) ; politique de confidentialité ; 2 054 Vitest |
| 24/10 02:30 — [VC-18a : conditions d'utilisation et de vente](runs/2026-10-24-0230-vc18a-conditions.md) | 🧭 | `public/conditions.html` (brouillon P5, crédits vérifiés contre `relay/src/config.js`, aucun prix en dur) ; GitHub Pages `/conditions/` ; lien « Conditions » du paywall et de Réglages ; P26 (médiateur) |
| 24/10 03:30 — [CI : réessais Play sur 5xx](runs/2026-10-24-0330-ci-play-reessais.md) | 🔧 | « Play — AAB » rouge sur un 503 de Google (v394) : job relancé ; `withRetry` (429/5xx, 5-10-20 s) dans `scripts/play/publish.mjs`, utilisé aussi par la fiche ; 4 tests |
| 24/10 04:30 — [VC-18b : rappel de fin d'essai](runs/2026-10-24-0430-vc18b-rappel-essai.md) | 🧭💳 | `services/trialReminder.js` (J−2, déplacé/annulé selon les droits du relais) ; plugin play `TrialReminderPlugin` + `TrialReminderReceiver` (alarme inexacte, redémarrage) ; paywall « jour 12 · On vous prévient » seulement si le rappel est possible ; Conditions ; 10 tests |
| 24/10 05:30 — [VC-5 : Nouveautés par variante](runs/2026-10-24-0530-vc5-nouveautes-play.md) | 🧭 | `changelogFor` + `PLAY_CHANGELOG_SINCE` (play : entrées depuis le 24/10, champ `variants`) ; installation neuve → historique déjà « lu » (onboarding) ; test-garde de vocabulaire sur les entrées play ; 2 097 Vitest |
| 24/10 06:30 — [VC-15 : icônes trait et apostrophes](runs/2026-10-24-0630-vc15-icones-apostrophes.md) | 🧭 | `components/LineIcon` (Réglages, Repas, Paramètres, onboarding, note du soir) ; émojis des titres de Pistes retirés ; 59 apostrophes typographiques (réécriture sur l'AST) ; titre « Repas » ; tests-gardes apostrophes + émojis ; 2 102 Vitest |
| 24/10 07:30 — [VC-9 : premier lancement play sur l'émulateur](runs/2026-10-24-0730-vc9-premier-lancement.md) | 🧭🐛 | `.github/scripts/play-cold-start.sh` (APK debug play, installation neuve, TotalTime + premier écran + erreurs JS + plantages, API 35 et 36, résumé du job) ; bug trouvé : chargeurs PlayBilling / PlayIntegrity / AppUpdate bloqués par le `then` du proxy Capacitor → `services/nativePlugin.js` ; VC-19 (`UpdateBanner.test.jsx` sans minutage) ; 2 104 Vitest |
| 24/10 08:30 — [Idées : 6d et 6e prêts à coder](runs/2026-10-24-0830-idees-abonnement-api.md) | 💡 | I158 (création de `halcya_premium` par `monetization.subscriptions` : 5 appels idempotents, grâce + suspension 30–60 j, offre `essai-14j`, activation) ; I159 (scénario testeur de licence ~30 min) ; I161 (testeur de licence : premium perdu après ~3 h → P23 ① + ②) ; I160 ; journal seul |
| 24/10 09:30 — [6d : abonnements créés par l'API](runs/2026-10-24-0930-6d-abonnements.md) | 🧭💳 | `scripts/play/subscriptions.mjs` (`buildCatalog` pur, `ensureCatalog` idempotent : lecture → création / ajout des formules manquantes → offre `essai-14j` → activation → relecture ; prix existants jamais modifiés) ; workflow « Play — abonnements » : **créé et actif du 1er coup** ; `playLabel` ≤ 40 car. ; 12 tests ; v246 |
| 24/10 10:30 — [6e : paiement à régulariser + scénario P27](runs/2026-10-24-1030-6e-paiement-scenario.md) | 🧭💳 | `paymentIssue()` (grâce / suspension) + `PaymentIssueCard` en haut de l'Accueil (play), lien vers les abonnements Google Play ; `--subscription=grace|on_hold` ; P27 : 7 cases pour le propriétaire (testeur de licence) ; 2 122 Vitest |
| 24/10 11:30 — [CI : faux plantage du test émulateur](runs/2026-10-24-1130-ci-plantage-emulateur.md) | 🔧 | `play-cold-start.sh` : seuls les plantages de `fr.jpesquet.sante` comptent, tampon `crash` vidé et publié ; « Relais — déploiement » : bilan Play Integrity 7 j (6b-2c-1) ; 2 122 Vitest |
| 24/10 15:30 — [6f : période de lancement](runs/2026-10-24-1530-6f-periode-lancement.md) | 🧭💳 | `relay/src/launch-period.json` (`from` / `until` / `off`, `LAUNCH_PREMIUM_*` prioritaires), `isLaunchPeriod` avec début et interrupteur, état dans le résumé du workflow relais ; Premium / onboarding « Premium offert pendant le test » sans achat ; `INVITATION-TESTEURS.md` ; retours de 15:00 → POL-1…8 ; P28 = FGS, IAM → P29 ; 78 tests relais |
| 24/10 16:30 — [SAUV : sauvegarde Android](runs/2026-10-24-1630-sauvegarde-android.md) | 🧭🔒 | `data_extraction_rules.xml` + `backup_rules.xml` (préférences natives propres au téléphone exclues), `BackupMarkerPlugin` (repère hors sauvegarde) + `restoreGuard.js` (secrets du localStorage retirés après restauration), textes confidentialité / conditions / Données / onboarding ; Sécurité des données inchangée ; +10 tests |
| 24/10 17:30 — [POL-5 + POL-4 : Accueil](runs/2026-10-24-1730-pol5-pol4-accueil.md) | 🧭 | « Photo du repas » pleine largeur + icône `camera`, « Ajouter une note » (`pen`) ; `gutCardMode` (ventre → carte, énergie / tout → aucune, sans objectif : `existing` → `GutCard onlyIfUsed`, sinon carte) ; texte « Ce qui vous amène » ; captures clair / sombre / vierge play |
| 24/10 18:30 — [POL-3 : carte bien-être](runs/2026-10-24-1830-pol3-carte-bien-etre.md) | 🧭 | `DetailsToggle` → chevron (`aria-expanded`, partout) ; détails visuels (`MoodRange`, `ConfidenceBadge`, pastilles, modèle en petit) ; « Noter moi-même » dans la carte, « Ajouter une note » retiré ; `WellbeingPrompt` seulement contrôlée (plus d'ouverture auto) |
| 24/10 19:30 — [POL-2 : historique du bien-être](runs/2026-10-24-1930-pol2-historique-bien-etre.md) | 🧭 | `FaceAffect.expressions` (softmax des 8 scores) gardées par rafale (`exAnger`…`exSurprise`, JUnit) ; `wellbeingHistory.js` (jour / semaine / mois, notes à part) ; page `/bien-etre` (courbe SVG, valence / éveil, barres d'expressions) ; lien « Historique › » dans la carte ; démo avec expressions |
| 24/10 20:30 — [Idées : P28 prêt, POL-7 et POL-8 maquettés](runs/2026-10-24-2030-idees-p28-pol7-pol8.md) | 💡 | Règles FGS caméra relues (formulaire : description, impact, vidéo, cas d'usage ; Android 15 : pas de relance au démarrage) → `PLAY-CONFORMITE.md` §1 bis (texte à coller, script vidéo en 8 plans, ordre des gestes, APK d'aperçu) ; I163 maquette Analyses ; I164 maquette Sources ; journal seul |
| 24/10 21:30 — [POL-7a : onglet « Analyses »](runs/2026-10-24-2130-pol7a-onglet-analyses.md) | 🧭 | Onglet et titre « Analyses » ; plus d'onglets simple / avancée (`AnalysisView`) ; ligne mono d'en-tête + encart lilas ; « Bientôt » (`soonLines`) ; une seule note de méthode en pied de page avec le modèle de prédiction calculé à l'ouverture ; 2 156 Vitest |
| 24/10 22:30 — [POL-7b : pistes dépliables, barres neutres](runs/2026-10-24-2230-pol7b-pistes-depliables.md) | 🧭 | `LeverCard` : phrase + étiquette, statistiques (r, jours indépendants, week-end) derrière `DetailsToggle` ; `CorrelationBar` / `ImportanceBar` : `reco-corr-up` / `-down` en lilas, valeur « ↑ 0,59 », `DIRECTION_HINT` ; écarts des habitudes sans rouge ; captures play clair / sombre |
| 24/10 23:30 — [POL-7c : un verdict par facteur](runs/2026-10-24-2330-pol7c-un-verdict-par-facteur.md) | 🧭 | `LinksSection` + `mergeLinks` (corrélations, tags, effets décalés, notes et visage ; `FACTOR_ALIAS` ; plus solide gagne) ; « Voir N autres liens » au-delà de 5 ; étiquette « visage » ; effet décalé d'une piste au chevron ; émojis retirés ; captures play clair / sombre / vierge |
| 25/10 00:30 — [POL-6 : Journal en couleurs](runs/2026-10-25-0030-pol6-journal-en-couleurs.md) | 🧭 | `chipTheme` → tuiles du résumé en pastels (menthe / pêche / lilas), valeurs en mono ; saisies en pastel ; `onStatus` sur radar, norme cardiaque et régularité du sommeil → `SoonList` « Bientôt » (partagé avec Analyses) ; méthode seulement si un bloc est actif ; captures play clair / sombre / vierge |
| 25/10 01:30 — [POL-8 : Sources plus simples](runs/2026-10-25-0130-pol8-sources-simples.md) | 🧭 | `splitSourcesByStatus` : `watchDetected` (app Huawei / Honor Santé installée, ou mode diagnostic) et `addable` (montre non détectée, Bluetooth, guides) derrière « Ajouter une source » ; détection partagée avec « Mes appareils » (masqué si rien) ; `troubleshooting` de `WatchDiagnostic` / `WatchConnect` (Diagnostic seulement après un échec ou en mode diagnostic) ; chevron de `MethodNote` ; 2 165 Vitest |
| 25/10 02:30 — [POL-1a : interrupteur play de la lecture au déverrouillage](runs/2026-10-25-0230-pol1a-interrupteur-play.md) | 🧭 | `-PfaceUnlockPlay` (coupé) + `FACE_KEEPALIVE` ; manifeste `src/playFaceUnlock` (test de parité) ; plugin : `unlock` distinct de `enabled`, `stopUnlock`, `skip:unlock` ; notification basse en play ; CI : APK d'aperçu `.apercu` vérifié et envoyé en artefact ; 2 167 Vitest |
| 25/10 02:33 CET — [POL-1b : écran d'activation du déverrouillage (play)](runs/2026-10-25-0233-pol1b-activation-deverrouillage.md) | 🧭 | `describeFaceUnlock` / `startFaceUnlock` / `stopFaceUnlock` ; interrupteur `role=switch` si `unlockAvailable` ; divulgation `camera_unlock` ; « Reprendre » sans reprise auto ; `--face-unlock` et `--disclosure=camera_unlock` dans `npm run visual` ; test HC API 36 robuste ; 2 178 Vitest |
| 25/10 03:33 CET — [POL-1c : couper depuis Paramètres](runs/2026-10-25-0333-pol1c-reglage-deverrouillage.md) | 🧭 | `FaceUnlockSetting` (play + `unlockAvailable`) : interrupteur qui coupe (actif / en pause), lien vers Sources quand coupée, pas d'allumage sans divulgation ; captures clair / sombre / coupée ; 2 182 Vitest |
| 25/10 04:33 CET — [M6b : VFC de journée et température en arrière-plan](runs/2026-10-25-0433-m6b-p2p-arriere-plan.md) | ⌚ | `WatchP2P.java` (ping 0xCA, pages du dictionnaire 500044 / 400012, accusés 0xCF, 10 pages au plus, octets vérifiés contre `p2p.js`) ; capture `dict` décodée par `dataFromCapture` ; reprise `hrvDayUntil` / `skinTempUntil` recopiée du JS ; 132 JUnit, 2 185 Vitest |
| 25/10 05:33 CET — [M7 : séances, FC et allure](runs/2026-10-25-0533-m7-seances-fc-allure.md) | ⌚ | `parseWorkoutIndex` (blocs annoncés), `parseWorkoutSamples` (en-tête 14 octets, FC + vitesse, reste sauté d'après la longueur annoncée), `parseWorkoutPace` (km complets), `heartRateCurve` ; Journal : « FC moy. · allure » + courbe SVG ; spécification §7.5 bis |
| 25/10 06:33 CET — [M4 bis : bits inconnus des minutes (étages ?)](runs/2026-10-25-0633-m4bis-bits-inconnus.md) | ⌚ | `parseMinuteBytes` garde les bits non identifiés à part (`unknown`, jamais écrits) ; `describeUnknownBits` : une ligne par jour local (minutes, somme) dans le journal de la synchro, app ouverte et capture d'arrière-plan ; spécification §10.18 |
| 25/10 07:33 CET — [M7b : séances relues app fermée](runs/2026-10-25-0733-m7b-seances-arriere-plan.md) | ⌚ | `WatchReader.workouts` (liste, totaux, échantillons, allures ; brut, index = numéro de séance ; octets vérifiés contre `sync.js`) ; `State.workouts` recopié du JS (`workoutsRead`) ; `dataFromCapture` assemble avec `withWorkoutDetail` ; 136 JUnit, 2 194 Vitest |
| 25/10 08:33 CET — [Idées : audit de la version candidate](runs/2026-10-25-0833-idees-audit-version-candidate.md) | 💡 | Captures play vierge clair + démo sombre (14 pages, 0 erreur) → VC-22 à VC-27 + AVIS + VC-PUBLIER au BACKLOG ; I166 fin de test fermé (12 inscrits continus, engagement, mise à jour pendant le test) → invitation durcie + rappel J7 ; I167 device recall réservé ; POL-1d après la version candidate ; journal seul, 2 194 Vitest |
| 25/10 09:33 CET — [VC-22 + VC-25 + VC-27 : textes « Analyses », Sources sans doublon](runs/2026-10-25-0933-vc22-vc25-vc27-sources.md) | 🧭 | « Vos Analyses » + règle `wordingRules` ; volet « Brancher une autre source » fusionné dans « Ajouter une source » (montre détectée en vue) ; chevrons à la place des ▸ / ▶ ; Health Connect en une phrase, 15 types au chevron ; 2 195 Vitest |
| 25/10 10:33 CET — [VC-23 + VC-24 : Analyses, une échelle et un gabarit](runs/2026-10-25-1033-vc23-vc24-analyses.md) | 🧭 | « Piste solide / À confirmer / Trop tôt pour dire » partout (pastels, phrase au chevron) ; `LinkCard` unique pour les liens (facteur entier, une phrase, chiffres mono, une décimale) ; 2 192 Vitest |
| 25/10 11:33 CET — [VC-26 : Accueil vierge plus léger](runs/2026-10-25-1133-vc26-accueil-vierge.md) | 🧭 | Intro en une phrase ; une ligne « … · Ajouter une source » au lieu de 3 tuiles « — » ; liens Journal masqués à vide ; relance unique de l'émulateur API 35 (rouge sur un commit journal seul) ; 2 193 Vitest |
| 24/10 14:30 — [Retours du 24/10, crédits IA durables](runs/2026-10-24-1430-credits-durables.md) | 🧭💳 | Cause du « 10 restantes » : registre en mémoire, plafond premium du jour absent de `X-Credits`, instance arrêtée → `createFirestoreStore` (collection `credits`, empreinte, 5 compteurs), `hydrate` / `persist`, panne non bloquante ; « Analyse IA · une estimation » ; P23 ②, P27 ✅ (C3), P28 ; 76 tests relais |
| 24/10 13:30 — [M6a : fichiers de la montre en arrière-plan](runs/2026-10-24-1330-m6a-fichiers-arriere-plan.md) | ⌚ | `WatchReader` télécharge `sequence_data` et `rrisqi_data.bin` (0x2C, blocs poussés, octets bruts dans la capture `files`) ; `BackgroundSync` : reprise par fichier recopiée du JS (`sleepFileUntil`, `stressFileUntil`, `sleepBedTime`) ; `dataFromCapture` décode nuits et stress ; 124 JUnit, Vitest verts |
| 24/10 12:30 — [M4 : stress de la montre Huawei](runs/2026-10-24-1230-m4-stress-montre.md) | ⌚ | Bilan Play Integrity : 6 « missing », 0 jeton réel → reste `observe` ; `parseStressFile` (rrisqi v3, 66 o, score 1–99, niveau) ; lecture 0x2C type 0x10 si stress auto + bit 0x04 de 1/0x31, reprise `stressFileUntil` ; entrée `watch_stress` (X, jamais estimateur) ; écran Montre + puce Journal ; 2 127 Vitest |
| 23/10 23:30 — [VC-17 : paywall honnête](runs/2026-10-23-2330-vc17-paywall-honnete.md) | 🧭💳 | `config/premiumBenefits.js` (`delivered`, `deliveredBy`) ; paywall : 1 avantage coché, 3 « en préparation » sous « détails » ; test relié au plafond du relais ; 2 045 Vitest (1 instable hors sujet : UpdateBanner, VC-19) |
| 23/10 22:30 — [VC-12 + VC-14 + VC-16 : Pistes, Tendances, Cigarettes](runs/2026-10-23-2230-vc12-vc14-vc16.md) | 🧭 | Pistes vide : `NotEnoughData` retiré sous la carte lilas, seuil bien-être dans ses détails (`extraDetail`) ; Tendances vide : visage / « Une note », « Ajoutez une montre dans Sources » ; `cigaretteSetting` (play : masqué sauf s'il est activé) ; 2 041 Vitest |
| 23/10 21:30 — [VC-7 + VC-13 : Sources plus claires en play](runs/2026-10-23-2130-vc7-vc13-sources.md) | 🧭 | `visibleConnectorIds` (Withings masqué en play sauf s'il sert) ; visage / écran / météo en 2 lignes + « Détails » ; guide Huawei play → « Connecter ma montre », sans F12 ni cookie ; Huawei Santé détecté → connexion directe ; 2 042 Vitest |
| 23/10 18:30 — [VC-3 : profil Nutrition sans valeurs inventées](runs/2026-10-23-1830-vc3-profil-nutrition.md) | 🧭 | `BodyProfileCard` : profil vide → invitation sans chiffre ; partiel → valeurs connues + « À compléter : … » ; IMC / kcal derrière « détails » (I152) ; avertissement « repas manquants » sans objectif calorique ; `DetailsToggle.css` ; 3 tests |
| 23/10 13:30 — [Jalon 4c-2 : lecture du visage dans l'onboarding](runs/2026-10-23-1330-jalon4c2-visage.md) | 🧭 | Écran 7 d'I154 avant le premier geste (seulement si le plugin caméra existe) : 3 lignes, divulgation `camera`/`camera_app_open`, lecture d'essai (`services/faceTrial.js`, ne compte pas), « Plus tard » sans demande ; `--onboarding=face` ; 13 tests |
| 23/10 01:30 — [6c-1 : droits premium lus auprès du relais](runs/2026-10-23-0130-6c1-abonnement.md) | 🧭💳 | Relais vérifié vert (HTTP 200 `gemini-3.5-flash-lite`, relay-runtime lit les achats) ; `services/entitlement.js` + bloc « Abonnement » (play) + lien de gestion Play ; `--subscription` dans le visuel ; 1 885 Vitest ; PR (voir le compte rendu) |
| 23/10 02:30 — [6c-2 : Google Play Billing (variante play)](runs/2026-10-23-0230-6c2-play-billing.md) | 🧭💳 | Plugin maison `PlayBillingPlugin` (PBL 8.3.0, `src/play/java`, sideload sans BILLING) au lieu de cdv-purchase ; `playBilling.js` (formules lues chez Google, achat revérifié par le relais, restauration) ; « Restaurer un achat » ; sécurité des données + confidentialité (achats) ; 1 902 Vitest |
| 23/10 03:30 — [6c-3 : paywall (variante play)](runs/2026-10-23-0330-6c3-paywall.md) | 🧭💳 | Page `/premium` de la maquette, prix / essai / économie calculés sur Play Billing ; état « aucune formule » ; « Découvrir le premium » dans les Paramètres ; faux plugin Play Billing pour les captures ; 1 913 Vitest |
| 23/10 07:30 — [6b-2b : Play Integrity (app)](runs/2026-10-23-0730-6b2b-integrity-app.md) | 🧭💳 | Plugin `PlayIntegrityPlugin` (integrity 1.6.0, `src/play/java`, jeton standard, projet 81378799481, fournisseur re-préparé si périmé) ; `playIntegrity.js` (requestHash identique au relais, délai 8 s puis pause 1 h) ; `X-Integrity-Token` sur chaque analyse ; confidentialité ; 1 932 Vitest, 71 tests relais |
| 23/10 06:30 — [6b-2a : Play Integrity (relais)](runs/2026-10-23-0630-6b2a-integrity-relais.md) | 🧭💳 | Relais `integrity.js` (décodage `decodeIntegrityToken`, verdict app / appareil / `requestHash` / fraîcheur, cache 24 h, refus 10 min), `X-Integrity-Token` sur l'analyse, `INTEGRITY_MODE=observe` ; 71 tests relais |
| 23/10 05:30 — [6c-3c : achats confirmés plus tard](runs/2026-10-23-0530-6c3c-achats-differes.md) | 🧭💳 | `handlePurchasesUpdated` + `startPurchaseWatch` (écoute `purchasesUpdated`, relecture au démarrage et au retour ≤ 1 / 15 min, jeton vérifié une fois) ; événement `halcya:entitlement` + `useEntitlement` (paywall et Paramètres à jour en direct) ; 1 925 Vitest |
| 23/10 04:30 — [6c-3b : crédits IA](runs/2026-10-23-0430-6c3b-credits-ia.md) | 🧭💳 | Relais `credits.js` (10 offerts + 15 / mois, premium 10 / jour, `GET /v1/credits`, état `X-Credits`, premium par `X-Purchase-Token`) ; app `AiCreditsHint` (Paramètres, photo, description) ; confidentialité ; 55 tests relais, 1 917 Vitest |
| 23/10 00:30 — [Relais : modèle retiré, multi-région UE](runs/2026-10-23-0030-relais-modele-retire.md) | 🚑 | Cause du 502 : `gemini-2.5-flash-lite` retiré le 20/10 ; 3.5 / 3.1 Flash-Lite seulement sur la multi-région `eu` → relais sur `aiplatform.eu.rep.googleapis.com`, modèles 3.5 puis 3.1 Flash-Lite ; lecture des journaux réessayée 2 min ; 45 tests relais |
| 22/10 22:30 — [Réparation du déploiement du relais](runs/2026-10-22-2230-relais-deploiement-repare.md) | 🐛 | « Relais — déploiement » rouge (séparateur `^@^` de `--set-env-vars` qui coupait l'adresse de relay-runtime) → `^;^` ; test `relay/test/workflow.test.js` (rouge sur l'ancien workflow) ; 42 tests relais |
| 22/10 21:30 — [6b-1 : le relais vérifie les abonnements Play](runs/2026-10-22-2130-6b-achats-relais.md) | 🧭 | `billing.js` : `subscriptionsv2.get` (droits : actif, grâce, annulé non échu ; pas en pause / suspendu / expiré), accusé côté serveur, `linkedPurchaseToken`, `/v1/subscription/verify` (format validateur cdv-purchase), `/pubsub/rtdn` (OIDC vérifié), période de lancement `LAUNCH_PREMIUM_UNTIL` (coupée) ; CI : abonnement push `play-rtdn-relay` + test d'accès Play ; 40 tests relais |
| 22/10 18:30 — [6a-2 : la version Play analyse les repas par le relais](runs/2026-10-22-1830-relais-app-play.md) | 🧭 | `aiRelay.js` + façade `mealAi.js` (play : relais, identifiant aléatoire, accord `ai_meal` une fois, analyses restantes ; sideload : clé Gemini inchangée) ; confidentialité et sécurité des données (+ identifiant) à jour ; CORS et analyse réelle vérifiés ; P19, P20, P21 faits par le propriétaire ; P21 à relancer |
| 22/10 20:30 — [Idées : audit de la version candidate, testeurs sans paiement](runs/2026-10-22-2030-idees-version-candidate.md) | 💡 | `PRODUIT.md` §2 bis (5 critères) ; audit play vierge → VC-1…VC-10 au BACKLOG ; I149–I152 ; P12–P18, P21 à jour ; P23 proposé (testeurs de licence + période de lancement) |
| 22/10 16:30 — [6a : relais Cloud Run + Vertex AI](runs/2026-10-22-1630-relais-vertex.md) | 🧭 | `relay/` (Node sans dépendance : `/v1/meal/analyze` photo / texte, consignes côté relais, EXIF retiré, rien stocké, plafonds 20/inst./j, 200/j, 10/min, Vertex europe-west1 sans clé ; 24 tests) + workflow « Relais — déploiement » (Cloud Run `halcya-relay`, vérification par une vraie analyse) + job « Relais (Node) » ; app inchangée ; PR #273 fusionnée, relais déployé, analyse réelle OK (gemini-2.5-flash-lite, UE) ; `/healthz` réservé par Cloud Run → `/health` |
| 22/10 14:30 — [M5 : écran « Données de la montre »](runs/2026-10-22-1430-m5-ecran-montre.md) | ⌚ | Page `/montre` (lien dans la carte montre) : 12 types + stress « à venir », dernière valeur et date, n sur 7 j, issue de la dernière lecture (`reads` gardé dans l'état de synchro, nombres seulement) ; décision du 22/10 13:30 notée (jalon 6 ensuite) ; 1 857 Vitest ; PR #271 fusionnée → v209 |
| 22/10 12:30 — [M3 : température de la peau de la montre](runs/2026-10-22-1230-m3-temperature-peau.md) | ⌚ | Classe 400012 après la VFC (même ping, capacité 29), `body_temperature` `subtype: 'skin'` à part de la température corporelle, « Temp. peau » dans Journal → Jours, interrupteur « mesure continue » (7/0x2A, désactivé par défaut, envoyé une fois) ; 1 847 Vitest ; PR (voir le compte rendu) |
| 22/10 10:30 — [M2 : VFC de journée de la montre](runs/2026-10-22-1030-m2-vfc-journee.md) | ⌚ | `p2p.js` (ping 0xCA, pages par classe, accusés 0xCF, 10 s / page, 50 pages), classe 500044 → VFC `during: 'day'` tenue hors de la VFC de nuit (tuile, Radar, normes, pistes), « VFC jour » dans Journal → Jours, reprise `dictUntil` ; 1 840 Vitest ; PR (voir le compte rendu) |
| 22/10 08:30 — [Idées : M2 P2P prêt, Play Billing](runs/2026-10-22-0830-idees-p2p-billing.md) | 💡⌚ | Spec M2 complétée (`huawei.md` §10.10 : numéro 2 au départ, ping par numéro, données par classe, accusés au numéro de la montre, réels 4 / 8 o, conception `p2p.js` sur `session.listen` car `request` prendrait l'accusé) ; émotions de la montre non lues (I145) ; Play Billing : cdv-purchase (MIT, PBL 9) + relais, pas RevenueCat (I146–I148) ; journal seul, 1 814 Vitest |
| 22/10 06:30 — [Sécurité des données par l'API](runs/2026-10-22-0630-securite-donnees.md) | 🧭📄 | Modèle CSV de la Play Console rempli depuis des réponses justifiées (3 types collectés, facultatifs, non partagés ; aucune donnée de santé), règles du formulaire vérifiées, workflow « Play — sécurité des données » (`applications.dataSafety`), lancement manuel (P21), repli import manuel ; 1 814 Vitest ; PR (voir le compte rendu) |
| 22/10 04:30 — [Fiche du Store FR par l'API](runs/2026-10-22-0430-fiche-store.md) | 🧭📄 | Textes FR vérifiés contre le code, 5 captures 1080×1920 (variante play, démo) + présentation 1024×500, `listing.mjs` (SHA-256, site web, commit) et workflow « Play — fiche du Store » (concurrence `play-edits`) ; 1 790 Vitest ; PR #265 fusionnée → v204, Play 352 ; fiche refusée par Play faute d'e-mail de contact → P20 |
| 22/10 02:30 — [Page de confidentialité + GitHub Pages](runs/2026-10-22-0230-confidentialite-pages.md) | 🧭📄 | Politique réécrite pour la variante play (source unique, embarquée + Pages `/confidentialite/`), workflow « Site — GitHub Pages » (attend P19), Réglages → Confidentialité ; 1 778 Vitest ; PR #263 fusionnée → v203, Play 350 ; Pages rouge en attente de P19 |
| 22/10 00:30 — [M0 « Halcya » + M1 sommeil de la montre](runs/2026-10-22-0030-halcya-sommeil.md) | 🧭⌚ | PR #260 reprise et fusionnée (nom affiché **Halcya**) ; 1er envoi Play automatique vérifié (versionCode 346, internal) ; **M1** : 0x2C plus interrogé, sommeil détaillé + résumé complet (VFC, respiration, SpO₂ de la nuit), siestes à part, rattrapage 60 j ; 1 759 Vitest ; PR (voir le compte rendu) |
| 21/10 22:30 — [Jalon 3c : envoi automatique en test interne](runs/2026-10-21-2230-play-test-interne.md) | 🧭📦 | « Play — AAB » → API Android Publisher (edit, import, piste `internal`, notes depuis les Nouveautés, commit) ; pistes limitées à internal / alpha ; brouillon, déjà envoyé, accès refusé gérés ; `debugSymbolLevel` ; 1 747 Vitest ; PR (voir le compte rendu) |
| 21/10 20:30 — [Idées : montre Huawei, sommeil / VFC / température](runs/2026-10-21-2030-idees-montre-huawei.md) | 💡⌚ | Décisions du 21/10 au soir reportées (nom **Halcya**, P3 / P8 / P10 faits, P11 en cours, **jalon M montre = priorité des runs de code**) ; cause du sommeil absent trouvée (0x2C demandé en capacité → « non » → sommeil détaillé jamais lu) ; spec `huawei.md` §10 (inventaire GT 6 Pro, P2P dictionnaire VFC 500044 / température 400012, plan M1–M7) ; I139–I143 ; journal seul, 1 738 Vitest |
| 21/10 18:30 — [Tendances dans le Journal](runs/2026-10-21-1830-tendances.md) | 🧭🎨 | 2b accueil : Radar forme, cœur, sommeil et courbes du bien-être → `/tendances` (Journal → Tendances) ; accueil ≈ 340 lectures au lieu de 12 500 sur 3 ans ; 2e « Attendu d'après vos habitudes » ; 1 738 Vitest ; PR #256 → **v199, 33,7 Mo** + AAB play 343 ; outil perf corrigé (agrégats vides) |
| 21/10 16:30 — [« Vos derniers jours » dans Journal](runs/2026-10-21-1630-journal-jours.md) | 🧭🎨 | Page `/journal` (Jours \| Repas \| Nutrition), `DailyJournal` + `journalEntries` sortis de l'accueil, accueil allégé ; budget de lectures `/journal` ; 1 734 Vitest ; PR #254 → **v198, 33,7 Mo** (v197 = même commit, double push) + AAB play 341 |
| 21/10 14:30 — [Navigation 4 onglets](runs/2026-10-21-1430-navigation-4-onglets.md) | 🧭🎨 | Aujourd'hui / Journal (Repas \| Nutrition) / Pistes / Sources, roue « Réglages » en haut à droite, titres « Vos sources » / « Vos pistes », `APP_NAME` centralisé ; aucune route ni donnée changée ; 1 730 Vitest ; PR #252 → **v196, 33,7 Mo** + AAB play 339 |
| 21/10 12:30 — [Accueil « Aujourd'hui » + ventre en un geste](runs/2026-10-21-1230-accueil-aujourdhui.md) | 🧭🎨 | Carte menthe bien-être (chiffre, écart 14 j, courbe, « détails »), tuiles sommeil / VFC / pas avec source, carte pêche ventre → entrée `gut` (sans migration, exportée), boutons pilule, carte lilas pistes X/21 (6 semaines, budget de lectures) ; 1 718 Vitest ; PR #250 → **v195, 33,7 Mo** + AAB play 337 |
| 21/10 10:30 — [Jalon 3b-2 : variante play sans service caméra](runs/2026-10-21-1030-visage-ouverture-play.md) | 🧭🛡️ | Play : lecture du visage à l'ouverture de l'app (`FaceOneShot`, 1 / 30 min) + bandeau visible, sans FGS caméra / relance / exemption de batterie ; 15 permissions Health Connect (I131, −26) ; justification HC par type ; 1 693 Vitest, 119 JUnit ; sideload inchangée ; PR #248 → **v194, 33,7 Mo** + AAB play 335 |
| 21/10 08:30 — [Idées : Health Connect jour 1, pistes SII avec délais, paywall Play](runs/2026-10-21-0830-idees-produit-hc-sii-paywall.md) | 💡 | PR #246 revérifiée et **fusionnée** (v193, 33,7 Mo ; AAB play 333), #245 fermée ; veille → I130–I138 (30 j Health Connect d'office, permissions HC réduites, 3 fenêtres de délai + seuil par simulation, réintroduction Monash, paywall conforme : « 2,50 €/mois » secondaire) ; P16 ajouté |
| 21/10 06:30 — [Jalon 3b-1 : divulgations avant autorisation](runs/2026-10-21-0630-divulgations.md) | 🧭🛡️ | `PLAY-CONFORMITE.md` (option caméra play : à l'ouverture + lecture rapide, sans FGS ; revue des permissions) ; feuille de divulgation avant caméra / position / temps d'écran + test-garde ; 1 676 Vitest ; PR #246 (fusionnée au run suivant → v193) ; reprend aussi #245 |
| 21/10 04:30 — [Identité visuelle (ii) : icône « H nuit »](runs/2026-10-21-0430-icone-h-nuit.md) | 🧭🎨 | Icône adaptative + monochrome + notification (5 notifications) + écran de démarrage (API SplashScreen) + logo de l'en-tête ; PNG et icône Play 512 px générés par `scripts/brand/render-icons.mjs` ; test-garde (zone sûre, couleurs) ; 1 666 Vitest ; PR #244 → **v192, 33,7 Mo** + AAB play 332 |
| 21/10 02:30 — [Jalon 3a : variantes play / sideload](runs/2026-10-21-0230-variantes-play-sideload.md) | 🧭📦 | Flavors `sideload` (`com.healthtrack.app`) / `play` (`fr.jpesquet.sante`, sans `REQUEST_INSTALL_PACKAGES` ni mise à jour), `VITE_DISTRIBUTION`, versionCode croissant, workflow « Play — AAB » (WIF → Secret Manager → AAB signé ; attend P9) ; correctif de date dans `loadNutritionEntries` ; 1 660 Vitest ; PR #242 → **v191, 33,7 Mo** + AAB play 330 signé |
| 21/10 00:30 — [Identité visuelle (i) : tokens, polices, thème clair](runs/2026-10-21-0030-design-tokens.md) | 🧭🎨 | `INFRA.md` + `DESIGN.md` créés, PRODUIT / BACKLOG revus (Vertex AI sans clé, actions du propriétaire pas à pas) ; `theme/tokens.css` seule source des couleurs (~240 couleurs brutes remplacées), Figtree + IBM Plex Mono embarquées, clair par défaut, Apparence dans Paramètres, `SystemBarsPlugin` ; 1 653 Vitest ; PR #240 → **v190, 33,7 Mo** |
| 20/10 22:30 — [Chantier produit : PRODUIT.md + « bien-être » partout (jalons 1 et 2a)](runs/2026-10-20-2230-produit-cadre.md) | 🧭🙂 | Décisions du 20/10 au soir reportées (PRODUIT.md, charte §000000000, BACKLOG) ; libellés visibles « humeur » → « bien-être » ; test-garde `wording.test.js` ; 1 642 Vitest ; PR #238 → **v189, 33,6 Mo** |
| 19/10 00:30 — [Visage : lectures rangées dans l'historique (I90)](runs/2026-10-19-0030-visage-import.md) | 🔴🙂 | S42 archivée ; I90 + test « composition » (I114) ; PR #213, checks verts → fusionnée |
| 19/10 02:30 — [Visage : porte de calibration (I112)](runs/2026-10-19-0230-visage-porte.md) | 🔴🙂 | `gate.js` + simulations ; carte « Calibration : N jours sur 30 » ; PR #214 |
| 19/10 04:30 — [Visage : notification « Reprendre » (I88 ②)](runs/2026-10-19-0430-visage-reprendre.md) | 🔴🙂 | Règle `FaceResume` + tâche horaire + redémarrage / mise à jour ; relance dans `onResume` ; diagnostic `resume` ; PR #215 |
| 19/10 06:30 — [Note du soir d'un geste (I113)](runs/2026-10-19-0630-note-du-soir.md) | 🔴🙂 | Règle `EveningNote` (JVM), notification 6 boutons + alarme du soir, file native → note `wellbeing` ; bouton dans la saisie ; diagnostic `eveningNote` ; PR #216 |
| 19/10 08:30 — [Idées : temps par app, voix par la dictée, assez de rafales](runs/2026-10-19-0830-idees-apps-voix-rafales.md) | 💡 | I116–I120 ; simulation rafales / jour ; npj 2026 (texte ≫ audio) ; pas de Gemini Nano sur l’A56 ; PR #217 |
| 19/10 10:30 — [Carte « Lecture du visage » visible (signalement 08:37)](runs/2026-10-19-1030-carte-visage-visible.md) | 🚑🙂 | Cause : carte rangée dans le volet replié tant que non activée ; épinglée en tête sur Android ; « Réessayer » si le natif est muet ; tests natifs ; PR #218 |
| 19/10 12:30 — [Temps par app comme facteur X (I116)](runs/2026-10-19-1230-temps-par-app.md) | 🔴🙂 | `queryAppEvents` natif + `phoneApps.js` ; entrées `phone_apps` ; 4 facteurs neutres sans levier, test anti-circularité ; ligne « Dont… » + puce journal ; PR #219 |
| 19/10 14:30 — [Visage : 2e essai et lectures par jour (I118)](runs/2026-10-19-1430-visage-rafales-par-jour.md) | 🔴🙂 | `FaceSchedule.shouldRetry` (1 fois, +2 s, ≤ 10 s après le déverrouillage) ; `faceDailyCounts` → diagnostic « Par jour » / « 2e essais » ; PR #220 |
| 19/10 16:30 — [Visage : chaque déverrouillage repéré (signalement 15:05)](runs/2026-10-19-1630-visage-deverrouillage.md) | 🚑🙂 | Cause : récepteur `RECEIVER_NOT_EXPORTED` → `USER_PRESENT` (SystemUI) filtré ; `UnlockWatch` (diffusion / verrou interrogé / écran déjà ouvert), récepteur exporté sur le fil du service ; diagnostic v2 (allumages, sources, tentatives + erreur exacte, démarrage, app-op caméra) ; « À relancer » + guide Shizuku / ADB (I89) ; PR #221 |
| 19/10 18:30 — [Votre journée en une phrase (I119)](runs/2026-10-19-1830-phrase-du-soir.md) | 🔴🙂 | Lexiques disjoints ressenti (Y) / contexte (X) + test d'intersection vide ; champ « En une phrase » (dictable au clavier) → note et tags proposés, phrase jamais gardée ; 1 539 tests |
| 19/10 22:30 — [Humeur estimée dès la première lecture (consigne du 19/10 au soir, étape 1)](runs/2026-10-19-2230-humeur-des-la-1re-lecture.md) | 🔴🙂 | Consigne reportée (charte §0000000) ; `mood/faceMood.js` (a priori FACS → ligne de base personnelle → calibration facultative), fourchette + confiance ; carte « Humeur estimée » sur l'accueil + bloc dans la carte visage + « Tester maintenant » ; verrou « Rien n'est affiché » retiré ; diagnostic : modèle / confiance sans valeur ; 1 559 tests ; PR #224 |
| 20/10 00:30 — [Humeur estimée robuste aux dérives lentes (I121 + étendu)](runs/2026-10-20-0030-humeur-derives-lentes.md) | 🔴🙂 | `mood/blockCv.js` (blocs ±7 j, n effectif) ; détrendage adaptatif du visage ; faux départs 12,5 % → 2,5 % ; modèle personnel sans lien 60 % → ≤ 5 % (porte exigée) ; diagnostic `a` / `drift` ; 1 573 tests ; PR #225 |
| 20/10 02:30 — [Modèle valence / éveil embarqué (consigne du 19/10 au soir, étape 2)](runs/2026-10-20-0230-modele-valence-eveil.md) | 🔴🙂 | HSEmotion `enet_b0_8_va_mtl` (CCC V 0,59 / A 0,55) téléchargé par le téléphone, SHA-256 ; ONNX Runtime 1.22 (sans télémétrie) ; `FaceAffect` + vecteurs ; `faceMood` modèle `va` + éveil ; diagnostic v3 ; 111 JVM + 1 584 Vitest ; PR #226 |
| 20/10 04:30 — [Facteurs comparés à l'humeur estimée (Y automatique)](runs/2026-10-20-0430-facteurs-humeur-estimee.md) | 🔴🙂 | `mood/faceMoodDays.js` : série quotidienne (≥ 3 lectures, médiane, ligne de base par jour), corrélations X ↔ humeur estimée (ordre temporel à la dernière lecture, week-end, n effectif, BH) ; section Analyses visible sans notes ; `face_burst` lu jusqu'à 10 000 ; 1 597 tests ; PR #227 |
| 20/10 06:30 — [Visage : cause de l'arrêt + « Applis jamais en veille » (I123)](runs/2026-10-20-0630-applis-jamais-en-veille.md) | 🔴🙂 | `faceStopCause` (mise à jour / redémarrage / téléphone) via `lastUpdateAt` + `bootAt` natifs ; `openNeverSleep` (One UI `activity_type` 2, repli réglages de l'app) ; diagnostic v4 ; 1 602 tests ; PR #228 |
| 20/10 08:30 — [Run idées : modèles valence / éveil, visage et voix](runs/2026-10-20-0830-idees-modeles-va.md) | 💡 | 3 modèles VA officiels HSEmotion mesurés (B0 20 ms, MobileFaceNet 8 Mo 22 ms, MobileViT 73 ms) : se valent hors AffectNet → duo B0 + MBF (I126) ; EmoNet écarté (CC BY-NC-ND) ; voix : aucun modèle léger sous licence permissive (I128) ; journal seulement |
| 20/10 10:30 — [Duo de modèles du visage (I126)](runs/2026-10-20-1030-duo-modeles-visage.md) | 🔴🙂 | `mbf_va_mtl` (8 Mo, SHA-256) téléchargé après le B0, même pour qui l'a déjà ; `FaceAffect.Spec` (112 px, normalisation 0,5) + vecteurs Python ; valence = moyenne, `affectGap` → fourchette et « deux modèles d'accord » ; diagnostic « Second modèle » ; 114 JVM + 1 609 Vitest |
| 20/10 12:30 — [Sonde vocale dans le diagnostic (I124)](runs/2026-10-20-1230-sonde-vocale.md) | 🔴🙂 | `VoiceProbePlugin` (disponibilité, sur l'appareil, moteurs, langues fr-FR API 33) sans micro ; `voiceProbe.js` (verdict) ; diagnostic v5 `voice`, sonde à l'ouverture du Diagnostic ; 1 616 Vitest |
| 20/10 14:30 — [Habitudes et effets décalés sur l'humeur estimée](runs/2026-10-20-1430-habitudes-humeur-estimee.md) | 🔴🙂 | `computeTagEffects(…, { outcomeByDay })`, `computeLaggedEffects` sur l'humeur estimée sans piste, bloc dans la section visage ; stress (Y) exclu ; 1 621 Vitest |
| 20/10 16:30 — [Lectures du jour pondérées par leur qualité (I127)](runs/2026-10-20-1630-lectures-ponderees.md) | 🔴🙂 | `weightedMedian` + poids 1 / demi-largeur² (images valides, lacet, duo), n effectif de Kish dans la fourchette, « N lectures peu nettes comptées moins » ; même pondération dans `faceMoodDays` ; 1 625 Vitest |
| 20/10 18:30 — [Lumière du visage dans le poids des lectures (I127b)](runs/2026-10-20-1830-lumiere-visage.md) | 🔴🙂 | natif : `light` (médiane de la luminance des images valides) ; JS : ×1,15 hors [0,25 ; 0,8], « souvent dans la pénombre » ; `FACE_QUALITY_KEYS` hors de la porte ; 1 631 Vitest, 114 JUnit |
| 20/10 20:30 — [Mise à jour en un clic : progression et vérification (signalement 19:05)](runs/2026-10-20-2030-maj-telechargement.md) | 🚑 | Cause : APK 33,6 Mo chargé d'un bloc en base64 via le pont, sans délai ; `AppUpdatePlugin` (DownloadManager, notification, SHA-256 + paquet vérifiés), bandeau Mo / % / débit / reste, blocage 45 s, Réessayer, navigateur ; 1 640 Vitest, 118 JUnit ; PR #235 → **v188, 33,6 Mo** |
| 19/10 20:30 — [Idées : porte et dérives lentes, lire le diagnostic, voix et lexiques](runs/2026-10-19-2030-idees-porte-derives.md) | 💡 | Signalement 15:05 vérifié corrigé (v176/v177) ; simulation : porte 12,7 % de faux départs si humeur / visage autocorrélés → I121 (blocs ±7 j + n effectif ≈ 1–2 %) ; I122 arbre de lecture du diagnostic ; I123 « Applis jamais en veille » ; I124 sonde vocale ; FEEL / NRC écartés (licences) ; PR #223 |

---

## Charte

Ce dossier appartient à Claude. C'est sa mémoire entre deux exécutions de la routine
autonome (une toutes les 2 h) : chaque exécution démarre sans aucun souvenir et
**doit lire ce fichier en premier**. Claude peut et doit faire évoluer cette charte
quand il trouve une meilleure façon de travailler (en le notant dans le compte rendu du run).

| Fichier | Rôle |
|---|---|
| `README.md` | Résumé de la semaine en cours (en tête) + charte : mission, principes, protocole d'un run |
| `BACKLOG.md` | Vision, chantiers long terme, backlog priorisé, idées en vrac |
| `RESEARCH.md` | Veille : besoins utilisateurs, ce qui marche en health tech, avancées ML — avec sources |
| `IDEES.md` | Idées des runs « idées » (08 h / 20 h Paris), classées impact × faisabilité, avec sources et pistes |
| `runs/AAAA-MM-JJ-HHMM-<slug>.md` | Un compte rendu par exécution (un fichier par run = pas de conflit Git) |
| `semaines/AAAA-Sww.md` | Résumés des semaines passées |
| `INFRA.md` | Infrastructure (20/10 au soir) : Google Cloud `healthtrack-824b26`, connexion GitHub sans clé (WIF, `main` seulement), comptes de service, Vertex AI, Play, ce que la CI peut faire seule |
| `DESIGN.md` | Identité visuelle « Clair et précis » validée le 20/10 au soir : couleurs, polices, formes, icône, maquettes, étapes de mise en œuvre |
| `PRODUIT.md` | **Chantier produit (décisions du 20/10 au soir)** : décisions, 10 jalons et leur état, inventaire des écrans, « Actions du propriétaire » — à lire juste après ce résumé |
| `BIEN-ETRE-AUTO.md` | État des lieux et plan du chantier « bien-être entièrement automatique » (consigne §00000), décisions Y / X, ce qu'il faut valider sur le téléphone |
| `protocoles/<famille>.md` | Spécifications de protocoles d'appareils, écrites avec nos mots (sources citées) : le code des pilotes est écrit à partir d'elles |

---

## 000000000. Décisions produit du propriétaire du 20 octobre 2026 au soir — CADRE GÉNÉRAL (remplace §00000 / §0000000 comme cadre)

Objectif : un **produit vendable sur Google Play**, compréhensible en 30 s, sans jamais casser ce qui marche.
Détail complet, jalons, inventaire et actions du propriétaire : **[`PRODUIT.md`](PRODUIT.md)** (le prompt de la
routine fait foi). Points clés pour chaque run :
- **Workflow « Play — AAB »** (21/10) : tant que le propriétaire n'a pas fait P9, il est rouge sur `main` avec le
  message « Clé d'envoi Play absente » (ou « Accès refusé ») — c'est attendu, **pas** la « priorité absolue » de
  réparation ; tout autre échec de ce workflow, si.
- **Ordre** : signalement en cours éventuel → jalons de `PRODUIT.md` dans l'ordre (2 nettoyage → 3 variantes
  play / sideload → 4 onboarding + « aha » → 5 analyses avec délais → 6 Billing, paywalls, crédits, relais Gemini →
  7 FODMAP + PDF → 8 Health Connect → 9 i18n → 10 fiche Play). Un run = une étape testable et mergeable.
- **Textes** : « bien-être » (plus « humeur ») ; « local par défaut, IA optionnelle et clairement signalée » (jamais
  « 100 % privé ») ; jamais « diagnostiquer », « prédire une crise », « traiter » → « comprendre vos tendances »,
  « estimation, pas un diagnostic ». Garde-fou automatique : `app/src/data/wording.test.js`.
- **Gratuit / payant** : collecter est gratuit, comprendre est payant ; **ne jamais bloquer une fonction locale**.
- **Design** : pas de nouvelle identité tant que `journal/DESIGN.md` n'existe pas ; centraliser en tokens.
- **Interdits** : créer des comptes, payer, déployer, publier sur le Play Store → « Actions du propriétaire ».
- Le bien-être automatique (§0000000) et la montre (§000, maintenance A.1–A.3) restent valables, après les jalons.


**Ajout du 21/10 00:30** — le prompt apporte deux sections lues pour la première fois : **INFRASTRUCTURE ET
AUTONOMIE** (→ [`INFRA.md`](INFRA.md) : aucun identifiant dans la session ; Google Cloud et Google Play uniquement via
GitHub Actions sur `main` avec Workload Identity Federation ; Vertex AI sans clé API ; la routine peut déployer le
relais et publier sur les pistes de test, jamais en production) et **IDENTITÉ VISUELLE** (→ [`DESIGN.md`](DESIGN.md) :
« Clair et précis », tokens, Figtree + IBM Plex Mono embarquées, icône « H nuit », maquettes ; appliquée par étapes,
un run = une étape, captures claires et sombres). Couleurs : uniquement via `app/src/theme/tokens.css` (tests).

## 00000000. Signalement du propriétaire du 20 octobre 2026 à 19:05 — mise à jour bloquée sur « Téléchargement… » — corrigé au run 20/10 20:30 (à confirmer sur l'A56)

Bandeau « version 187 » figé sur « Téléchargement… » sans aucune indication (Galaxy A56, 4G). Cause : APK passé de
6,8 à 33,6 Mo (ONNX Runtime 18 Mo) et téléchargé d'un bloc en mémoire (`CapacitorHttp` → base64 → pont → `writeFile`),
sans délai ni progression. Correction : `AppUpdatePlugin` (DownloadManager + vérification taille / SHA-256 / paquet)
et `services/appUpdate.js` + `UpdateBanner` (progression, étapes, blocage 45 s, Réessayer, navigateur). La version
installée chez le propriétaire ne peut pas en profiter : **installation manuelle une fois** depuis
`https://github.com/spreadzenox/HealthTrack/releases/latest`, puis essai du bouton à la release suivante.
**Leçon** : tout ce qui grossit l'APK se mesure à la release (taille notée après chaque merge, déjà au protocole) ; un
téléchargement sans progression ni délai est une panne silencieuse — toujours afficher l'avancement et une sortie.

## 0000000. Consigne du propriétaire du 19 octobre 2026 au soir — lecture du bien-être 100 % automatique, sans attendre la calibration (prime sur l'ordre de §00000)

Message : **« Je ne veux pas avoir à attendre les 30 jours de calibration, quitte à embarquer un modèle plus puissant :
je veux une lecture du bien-être 100 % auto. »**
- Dès la **première lecture réussie**, l'app affiche une estimation de l'humeur et du bien-être (du moment et du jour),
  par un modèle pré-entraîné qui marche d'emblée, sans aucune note. Préférer un modèle qui sort **valence et éveil**
  (ex. HSEmotion `enet_b0_8_va_mtl`) plutôt que des classes d'émotions ; combiner visage et voix quand la voix sera là.
- Choisir le modèle le plus fiable qui tourne correctement sur un Galaxy A56 (LiteRT ou ONNX, GPU / NNAPI si possible),
  quelques dizaines de Mo acceptés ; documenter dans `journal/` le choix, les alternatives, la précision publiée, la
  taille, la latence, la consommation et la **licence (compatible obligatoire)** ; trop gros pour le dépôt →
  téléchargé au build ou au premier lancement depuis une source officielle, empreinte vérifiée ; aucune donnée de
  l'utilisateur envoyée.
- Notes manuelles et calibration personnelle **facultatives** : elles affinent (ligne de base, adaptation
  personnelle), elles ne conditionnent **jamais** l'affichage. Retirer « Rien n'est affiché avant… » et la condition
  des 30 jours partout où elle bloque.
- Honnêteté : niveau de confiance (lectures du jour, qualité / cadrage du visage, accord entre signaux), toujours
  « estimation », jamais diagnostic ; l'incertitude diminue avec les lectures et la calibration facultative.
- D5 (anti-circularité) et D6 (science personnelle) inchangés : l'estimateur n'utilise que visage, voix et
  auto-déclaration facultative.
- Livraison par étapes fusionnables : **1) estimation dès la première lecture avec le modèle actuel + verrou retiré
  (✅ run 19/10 22:30)** ; 2) modèle valence / éveil plus puissant ; 3) fusion visage + voix. Tests et captures à
  chaque étape.
- Runs « idées » : veille en priorité sur ce choix de modèle (comparatif précision / poids / licence des modèles
  valence-éveil faciaux et vocaux embarquables, benchmarks AffectNet, AFEW-VA…, retours de terrain).

**Décision de l'étape 1** (run 19/10 22:30, `app/src/services/mood/faceMood.js`) : en attendant le modèle valence /
éveil, une valence **a priori** est tirée des indices de blendshapes déjà mesurés (AU12, AU6 + AU12 → +, AU15, AU4,
AU1 → −, poids fixes documentés), note = 2,5 + 2,5 × valence ; le neutre de population est remplacé peu à peu par le
**visage habituel** de la personne (médianes 28 j, poids j / (j + 7)) ; la calibration Ridge sur les notes (≥ 14 jours,
gardée si ≥ 10 % mieux que la moyenne en LOO) prend le relais quand elle existe. Fourchette = √(erreur du modèle² +
dispersion des lectures² / n) × pénalités qualité / cadrage. Cohérent avec D6 : l'a priori est présenté comme une
hypothèse générale, supplantée par les données personnelles dès qu'elles suffisent. La porte `gate.js` reste, comme
**vérification facultative** affichée, sans rien bloquer.

## 000000bis. Signalement du propriétaire du 19 octobre 2026 à 15:05 — corrigé au run 19/10 16:30 — ✅ RÉSOLU (confirmé le 20/10 19:05)

Confirmé par la capture du propriétaire du 20/10 19:05 : carte « Humeur estimée — Confiance moyenne », 44 lectures
automatiques dans la journée, deux modèles d'accord. Chantier clos, ne pas rouvrir.


« J'ai déverrouillé plusieurs fois et toujours aucune prise de photo automatique. Le test manuel fonctionne. Je
déverrouille avec l'empreinte. » Diagnostic : « Aucun déverrouillage depuis minuit », service actif, caméra
autorisée (« seulement lorsque l'appli est utilisée »), batterie sans restriction. Cause : le récepteur
`USER_PRESENT` du service était enregistré `RECEIVER_NOT_EXPORTED` ; la diffusion vient de SystemUI (pas l'uid
système), donc filtrée. Correctif : récepteur `RECEIVER_EXPORTED` (diffusions protégées) livré sur le fil du service,
secours `UnlockWatch` (interrogation de `isKeyguardLocked` 60 s après `SCREEN_ON`, écran allumé déjà déverrouillé),
diagnostic v2 (allumages / déverrouillages du jour par source, dernier, démarrage du service, app-op caméra,
12 dernières tentatives avec l'erreur exacte), état « À relancer » + `start({ restart })`, guide Shizuku / ADB.
**Leçon** : une diffusion système reçue dynamiquement se teste avec son **émetteur réel** en tête (SystemUI ≠
system_server) ; `RECEIVER_NOT_EXPORTED` ne convient qu'aux diffusions de l'app elle-même. Et tout déclencheur doit
avoir un compteur « reçu » distinct du compteur « traité » pour que le diagnostic dise où ça casse.

## 000000. Signalement du propriétaire du 19 octobre 2026 à 08:37 — corrigé au run 19/10 10:30

« Je ne vois pas la carte pour la lecture du visage dans connecteur. » Cause : `connectorsLayout` ne mettait la carte
`face` en tête que **activée** ; désactivée, elle tombait dans le volet replié « Brancher une autre source », sous la
montre. Correctif : dans l'app Android (`isFaceSenseAvailable()`), `face` est toujours la première source active ;
`nothingSending` garde « Sources à brancher » ouvert au premier lancement ; message + « Réessayer » si le plugin natif
ne répond pas. Tests : `connectorsLayout.test.js`, `Connectors.test.jsx` (Android natif simulé), `FaceSenseCard.test.jsx`.
**Leçon** : une carte « censée être en tête » se vérifie dans l'état **par défaut** du propriétaire (non activée,
montre connectée), pas seulement avec le faux plugin actif.

## 00000. Consigne du propriétaire du 18 octobre 2026 au soir — *remplacée comme cadre général par §000000000 le 20/10 au soir* (le bien-être automatique reste un pilier)

Message du propriétaire : **« Ok à partir de maintenant concentration maximale sur la collecte entièrement automatique
du bien-être »**. Objectif : que HealthTrack connaisse l'humeur et le bien-être du propriétaire, jour après jour et au
fil de la journée, **sans qu'il ait rien à saisir** ; l'auto-déclaration en un geste reste possible comme calibration
et vérité terrain, jamais obligatoire.
- **Tous les runs de code** livrent une étape testable et fusionnable de ce chantier ; les runs « idées » (08 h / 20 h)
  y consacrent toute leur veille (émotions faciales / vocales embarquées, phénotypage par l'usage du téléphone, Emobot
  et concurrents, validité des mesures, retours d'utilisateurs, Android 14–16 / One UI).
- Contenu : points 4 (visage via service caméra « niveau 2 », voix, usage du téléphone / des réseaux sociaux), 5
  (anti-circularité) et 6 (science personnelle) des directives du 12/10 (§00).
- Ordre conseillé : (1) état des lieux + plan (**fait : [`BIEN-ETRE-AUTO.md`](BIEN-ETRE-AUTO.md)**) ; (2) cœur Y / X
  et test anti-circularité (existant) ; (3) visage (service niveau 2, modèle embarqué, aucune image gardée, diagnostic
  exportable) ; (4) voix ; (5) usage du téléphone / réseaux sociaux (décidé : **X**) ; (6) restitution simple
  (estimation du jour, incertitude, jamais un diagnostic).
- Signaux physiologiques de la montre (stress / VFC, FC, sommeil) : **décidé le 18/10 22:30 → X**, jamais en entrée
  de l'estimateur (voir `BIEN-ETRE-AUTO.md` §2).
- Validation sur l'appareil réel (Galaxy A56, One UI) : dire précisément au propriétaire quoi faire et quoi renvoyer,
  dans le compte rendu et dans le résumé de la semaine.
- **En pause** : petites corrections montre A.1–A.3 (livrées de toute façon le 18/10 16:30), nettoyage de l'UI (D1),
  performance (D2), interconnexion d'autres appareils. Exceptions : build / release cassés, PR « [Auto] » rouge,
  régression bloquante signalée, travail strictement nécessaire au bien-être automatique.

## 0000. Consigne du propriétaire du 18 octobre 2026 — PRIORITÉ ABSOLUE — *remplacée par §00000 le 18/10 au soir* (prime sur tout, y compris l'ordre du 12/10)

**A. Régression de l'écran montre** (capture du 18/10 11:06, « Ça ça ne marche pas ») : test bloqué sur « Test en
cours… » dès « Apps qui peuvent tenir la montre » ; carte « Libérer et appairer » qui propose « Appairer » alors que
la montre est appairée et synchronise ; « 14 pas aujourd'hui → 2 mesures » à 11 h à vérifier. Attendu : délai
maximal par étape, erreur claire au lieu d'un blocage, test qui marche montre déjà connectée, carte cohérente avec
l'état réel, synchro complète ; tests pour chaque cas ; ne casser ni l'appairage, ni l'authentification, ni la
synchro. → **Corrigé au run du 18/10 12:30** (voir son compte rendu). **Confirmé sur l'appareil réel par le
propriétaire (capture du 18/10 15:03)** : le test se termine (« Relancer le test »), titre « HUAWEI WATCH GT 6 Pro-169 »,
verdict « La montre répond à HealthTrack — protocole v2, HiChain 3 (GCM) ; HealthTrack synchronise déjà cette montre
(dernière synchro réussie il y a 4 h) : rien d'autre à faire ». Étapes : ✓ Bluetooth · – Apps (« délai dépassé
(8 s) ») · ✓ Recherche (appairée, ne s'annonce pas) · ✓ Connexion directe (classique) · ! Services (« 2 services
connus, Huawei non listé ») · ✓ Canal Huawei · ✓ Paramètres du lien. **Restes à traiter en petites corrections (un
seul run, sans freiner B)** : **A.1** détection des apps rapide et fiable (ou échec expliqué) ; **A.2** plus
d'avertissement « Huawei non listé » quand le canal s'ouvre en classique ; **A.3** resynchro de fond réellement à la
fréquence prévue + historique du jour complet ; tests pour chaque cas. → **A.1–A.3 livrés au run du 18/10 16:30.**
**B. Ensuite : l'estimation automatique du bien-être et de l'humeur** (« une fois que c'est fixé j'aimerais que ça
avance le côté estimation du bien-être automatique ») : D4 (humeur captée par visage / voix, approche Emobot) et D5
(anti-circularité) passent **devant** D1 (nettoyage de l'UI) et D2 (performance), en respectant D6.
**Ordre des « Prochaines étapes » (BACKLOG)** : 1) petites corrections montre restantes (A.1 à A.3) ; 2) estimation automatique du
bien-être (D4 + D5, D6) ; 3) nettoyage de l'UI ; 4) performance. Runs « idées » : la régression d'abord tant
qu'elle n'est pas fusionnée.

## 000. PRIORITÉ ABSOLUE (propriétaire, 12 octobre 2026 au soir) — la montre d'abord → **EN MAINTENANCE depuis le 15/10**

> **Mise à jour du propriétaire du 15 octobre 2026, mot pour mot : « Ça marche côté montre, plus besoin de se
> concentrer là-dessus ».** Objectif atteint : HealthTrack appaire, authentifie et relit la GT 6 Pro sans
> Gadgetbridge ni Huawei Santé. **D3 passe en maintenance** : les runs ne le traitent plus en premier. On n'y revient
> que pour (1) corriger une régression, (2) exploiter un journal de diagnostic envoyé par le propriétaire, ou
> (3) compléter au fil de l'eau (types de données manquants : stress, VFC de journée, séances auto ; resynchro en
> arrière-plan) quand c'est le travail le plus utile du moment. **L'ordre redevient celui du §00 : D1 (nettoyage de
> l'UI) en tête, puis D2, D4, D5, D6.** Les règles ci-dessous (parcours, licence, méthode, pilote générique) restent
> valables pour tout travail sur les montres.


**HealthTrack devient l'app principale de communication avec la ou les montres, sans Gadgetbridge ni app constructeur.**
Hors runs « idées », **chaque run travaille d'abord sur ce chantier (D3)**, avant le nettoyage et la performance,
jusqu'à ce que la Huawei Watch GT 6 Pro du propriétaire remonte ses données dans HealthTrack. Les runs « idées » de
08 h et 20 h y consacrent aussi une bonne part de leur recherche.

- **Parcours visé, en un minimum de gestes** : autodétection (scan BLE + appareils appairés, empreinte : nom, services,
  données fabricant, Device Information Service) → savoir ce qui tient la montre (apps installées : Huawei Santé,
  Gadgetbridge, Zepp, Mi Fitness… dans `<queries>` ; appairage système ; réponse aux paramètres du lien et à
  l'authentification) → **libération** (bouton qui ouvre la boîte de désinstallation Android de l'app concurrente,
  `ACTION_DELETE` + `REQUEST_DELETE_PACKAGES`, ou ses réglages pour lui retirer le Bluetooth ; Android interdit la
  désinstallation silencieuse et la réinitialisation à distance : un geste de l'utilisateur, guide pas à pas avec le
  menu exact de la montre ; **jamais** « dissocier dans Huawei Santé » ; plan B identifiant de compte Huawei) →
  **assistant d'appairage** (liaison Android, authentification Huawei, clés générées et stockées en local seulement) →
  **synchronisation** (FC, sommeil, pas, SpO₂, stress / VFC, séances) puis resynchro en arrière-plan (WorkManager ou
  service de premier plan) → IndexedDB.
- **Méthode** : plugin Capacitor natif (Java / Kotlin) pour le Bluetooth et le protocole. Étudier Gadgetbridge (paquets
  Huawei, issues / PR GT 6, HiChain), `zyv/huawei-lpv2` (MIT), CCC eh19, toute doc publique ; rétro-ingénierie
  d'interopérabilité permise (directive UE 2009/24, art. 6).
- **Licence (décision du propriétaire)** : réimplémentation totale, HealthTrack ne passe pas sous AGPL. Lire pour
  comprendre, **jamais** copier ni traduire ligne à ligne. D'abord la spécification avec nos mots
  (**`protocoles/huawei.md`**, sources citées), puis le code à partir d'elle. Pilote compact : seulement ce dont
  HealthTrack a besoin.
- Jamais de firmware, d'APK, de code décompilé propriétaire ni de clé extraite d'une app constructeur dans le dépôt.
- **Étapes livrables, chacune mergeable seule** : (a) écran de diagnostic qui déroule chaque étape et exporte un
  journal (le propriétaire le renvoie, le run suivant le lit) ; (b) détection et libération ; (c) authentification ;
  (d) synchronisation et resynchro en arrière-plan. Tests sur trames d'exemple à chaque étape.
- Un **pilote dans un registre générique**, pour ajouter d'autres montres et familles de protocoles ensuite.
- **Consigne du propriétaire du 14/10/2026 (≈ 12:25), mot pour mot : « Maintenant que ça marche tu peux nettoyer
  l'UI ».** La connexion à la GT 6 Pro fonctionne (association acceptée par la montre, journal v124). L'interface de la
  montre se réduit à une seule carte : par défaut l'état (connectée, batterie, dernière synchro, mesures) et
  « Synchroniser la montre » ; tout le technique (étapes, « Refaire l'appairage », test, « Libérer et appairer », export
  du journal) dans « Diagnostic » replié, sans perdre l'export ; pas de bandeaux redondants. Ensuite : passe de
  nettoyage générale (D1), puis performance (D2). La priorité absolue reste active **tant que de vraies mesures
  n'apparaissent pas dans l'historique** (run du 14/10 12:30 : fenêtre de synchro et totaux du jour corrigés).

## 00. Directives du propriétaire (12 octobre 2026) — priment sur tout le reste (la montre §000 est en maintenance depuis le 15/10)

Constat du propriétaire : l'app devient un « sac à features ». **Hors runs « idées », les runs traitent ces chantiers
dans cet ordre, avant toute nouvelle fonctionnalité** (chantiers D1–D6 de `BACKLOG.md`) :

1. **D1 — Passe de nettoyage.** Inventaire de chaque écran, champ, carte, réglage ; supprimer / fusionner le redondant,
   le peu utile, le désormais captable automatiquement. **Ne jamais demander une donnée que l'app capte déjà**
   (ex. « écran tard » auto-détecté → plus demandé). Données existantes toujours lisibles (migration, import / export) :
   seuls l'affichage et la saisie sont simplifiés. Lister dans le compte rendu ce qui est retiré et pourquoi.
2. **D2 — Performance.** L'app lag au chargement des courbes. **Mesurer d'abord** (profil, temps par page, volume lu
   dans IndexedDB), puis : cache d'agrégats journaliers / hebdo invalidés à l'écriture, requêtes IndexedDB par index et
   par plage, mémoïsation, sous-échantillonnage des longues séries, calculs lourds en Web Worker, graphiques différés.
   Une mesure / un test anti-régression ; chiffres avant / après dans le compte rendu.
3. **D3 — Montre Huawei en direct, sans app tierce** (remplacé et promu par la **priorité absolue, §000**). La GT 6 Pro ne se connecte pas, même avec Gadgetbridge.
   HealthTrack fait tout elle-même (seules étapes manuelles : autorisations Android) : découverte BLE, connexion,
   authentification, récupération (FC, sommeil, pas, SpO₂, stress / VFC…), resynchro en arrière-plan. Protocole Huawei
   réimplémenté d'après la documentation et les observations publiques, **sans code AGPL**, tests sur trames d'exemple.
   Commencer par **diagnostiquer** l'échec actuel : journal de connexion lisible + écran de diagnostic. Documenter la
   contrainte d'appairage (montre liée à Huawei Santé → quoi faire exactement). Ce qui n'est pas vérifiable sans la
   montre : livré avec un mode diagnostic qui permet au propriétaire **d'exporter les logs** pour le run suivant.
4. **D4 — Humeur « à la Emobot » : signaux émotionnels directs.** Visage (caméra frontale, modèle local d'émotions
   faciales : MediaPipe / TFLite / ONNX), voix (timbre, prosodie : modèle local d'émotion vocale), usage des réseaux
   sociaux (temps, apps, contenu si faisable). Captation la plus continue possible, **traitement 100 % sur l'appareil,
   aucune image ni audio brut conservé** (seulement les scores). Documenter les vraies limites d'Android (caméra / micro
   en arrière-plan, service de premier plan + notification, indicateurs de confidentialité, Accessibility, UsageStats) ;
   construire le meilleur possible dedans (ex. capture opportuniste au déverrouillage / à l'usage).
5. **D5 — Pas de raisonnement circulaire (non négociable).** Y = humeur, estimée **uniquement** par des signaux
   émotionnels directs (visage, voix, auto-déclaration). X = comportements et contexte (sommeil, activité, écran,
   alimentation…), qui servent seulement à expliquer Y. Les réseaux sociaux sont soit dans l'estimateur, soit dans les
   X : choisir et documenter. **Liste déclarée des entrées de l'estimateur + test qui échoue** si une variable est à la
   fois entrée de l'estimateur et facteur des corrélations. Retirer les entrées comportementales des estimateurs
   existants. Contrôler aussi : ordre temporel (X avant Y), comparaisons multiples, taille d'échantillon minimale,
   formulations qui ne confondent pas corrélation et causalité.
6. **D6 — Science personnelle, pas de normes imposées.** Le but : vérifier, pour **cet** utilisateur, quels facteurs
   influent réellement sur son humeur et son bien-être ; ses données font foi (si l'écran le soir va chez lui avec une
   meilleure humeur, l'app le montre tel quel). Aucun X codé « bon » ou « mauvais », aucun score / alerte / conseil qui
   pénalise un comportement par principe. Les normes générales = hypothèses (quoi examiner d'abord, quoi tester, a
   priori faible), supplantées par les données personnelles dès qu'elles suffisent ; quand elles se contredisent, le
   dire simplement, sans culpabiliser. Revoir scores, conseils et messages normatifs (ex. « écran tard = mauvais »).

Runs « idées » : privilégier les idées qui **simplifient et consolident** plutôt que celles qui ajoutent des écrans.
Conséquence sur §0 ci-dessous : la priorité n° 3 (humeur) ne s'appuie plus sur sommeil / VFC / activité / écran comme
entrées de l'estimation (ce sont des X), mais sur des signaux émotionnels directs.

## 0. Directions du propriétaire (11 octobre 2026) — priment sur le choix libre du mode

- **Vision** : HealthTrack devient le **hub ultime de la santé, de l'humeur et de la vie** de l'utilisateur, voire un
  assistant personnel : un « humain augmenté par les données » (connaissance de soi et décisions guidées par beaucoup
  de données, sans modification du corps). Il faut donc **capter beaucoup de données**. Tout reste sur le téléphone :
  ne pas brider les idées par excès de prudence sur la vie privée.
- **Priorité n° 1 — simplifier la vie** : tout ce qui peut être capté automatiquement doit l'être ; la saisie manuelle
  devient le dernier recours, en un geste minimum.
- **Priorité n° 2 — objets connectés (gros chantier)** : détecter automatiquement les équipements / apps santé présents
  ou connectés au téléphone et récupérer leurs données sans intervention. Cas concret : **Huawei Watch GT 6 Pro**
  (absente de Health Connect). Puis Samsung, Garmin, Fitbit, Xiaomi/Zepp, Withings, Oura, Polar… Étape manuelle
  inévitable → guide pas à pas dans l'app.
  - **Données brutes d'abord** (montre, bague, capteurs) ; sans API ouverte : reverse engineering à des fins
    d'interopérabilité (protocoles BLE documentés, exports, sauvegardes, captures BLE), viser une **connexion BLE
    directe** (plugin Capacitor natif si besoin). Respecter les licences (Gadgetbridge = AGPL : **ne pas copier son
    code**, réimplémenter d'après la documentation du protocole), ne jamais committer clés, secrets ni firmware
    propriétaire, documenter les limites (montre appairée à une seule app à la fois…).
  - **Approche générique** : couche de connexion avec autodétection (scan BLE, empreinte : nom annoncé, UUID de
    services, données fabricant, Device Information Service) → choix automatique du pilote. D'abord les **profils BLE
    standard** (FC 0x180D, batterie, balance, tensiomètre, glycémie, oxymètre, vélo/course…), puis les **familles de
    protocoles propriétaires** partagées entre modèles. Registre de pilotes extensible, détection des capacités plutôt
    que listes de modèles, repli propre pour un appareil inconnu (empreinte collectée localement).
- **Priorité n° 3 — humeur et bien-être captés automatiquement** (inspiration Emobot) : estimation à partir de
  signaux passifs (sommeil, VFC, activité, usage du téléphone, voix, visage, conversations), traitée sur l'appareil,
  toujours présentée comme une **estimation**, jamais un diagnostic.
- **Conversations** : importer les résumés des enregistreurs (Omi, Plaud, Limitless, Bee… et équivalents) ou faire
  pareil avec le micro du téléphone, pour le journal et l'humeur ; stockage local ; rappel simple (sans blocage) que
  l'enregistrement d'autrui peut demander leur accord selon le pays.
- **Recommandations de matériel** utile (capteurs, wearables) quand elles servent le suivi.
- **Runs « idées »** (08 h et 20 h, heure de Paris) : pas de code produit ; se mettre à la place de l'utilisateur,
  chercher (Reddit QS / Biohackers / wearables…, LinkedIn, wearables récents, reverse engineering, enregistreurs de
  conversations, humeur, ML embarqué, meilleures apps) et enrichir **`IDEES.md`** (idées classées par impact et
  faisabilité, besoin servi, sources, dates, pistes d'implémentation), puis faire entrer les meilleures dans
  `BACKLOG.md`. Les garde-fous de fusion s'appliquent (tests verts même si seul le journal change).

Conséquence sur le principe 3 ci-dessous : « local-first » reste la règle (rien ne sort de l'appareil hors Gemini
déclenché par l'utilisateur), mais **à l'intérieur du téléphone** on capte large.

## 1. Mission

Faire de HealthTrack **la meilleure app de santé personnelle possible** : celle qui
transforme les données d'une personne (alimentation, sommeil, activité, cœur, corps,
humeur, habitudes) en **compréhension** et en **actions concrètes** pour aller mieux —
sans friction de saisie, et sans que les données quittent l'appareil.

L'utilisateur (propriétaire du dépôt) passe une fois par semaine : il installe la
dernière version via la **mise à jour en 1 clic** et découvre les changements dans la
page **Nouveautés**. Chaque semaine doit donc apporter des progrès visibles et fiables.

## 2. Principes non négociables

1. **Ne jamais casser l'app installée.** Le mécanisme de mise à jour (`UpdateBanner`,
   `services/updateCheck.js`, `services/installUpdate.js`, `.github/workflows/build-release.yml`,
   `android/app/debug.keystore`) est vital : s'il casse, l'utilisateur est bloqué sur une
   vieille version. Toute modification de ces fichiers exige des tests et une justification.
2. **Ne jamais perdre de données.** Toute évolution du schéma IndexedDB passe par une
   migration testée (`storage/localHealthStorage.js`, `DB_VERSION`). L'export/import JSON
   doit rester compatible avec les anciens fichiers.
3. **Local-first et vie privée.** Aucune donnée de santé n'est envoyée à un serveur tiers,
   sauf les appels Gemini explicitement déclenchés avec la clé de l'utilisateur. Pas de
   nouveau service distant sans nécessité forte, documentée dans le run.
4. **Honnêteté scientifique.** Pas d'allégation médicale ni de diagnostic. Corrélation ≠
   causalité : toujours afficher l'incertitude (intervalle, taille d'échantillon), et
   citer les références (recommandations OMS/ANSES/EFSA…) quand l'app donne un repère.
5. **TDD.** Écrire le test qui échoue, puis le code (voir `CONTRIBUTING.md`). Le visuel
   pur n'exige pas de test, mais exige une **vérification visuelle**.
6. **Un run = un changement cohérent, fini, vérifié et livré.** Les gros chantiers sont
   découpés en étapes livrables (voir `BACKLOG.md` → Chantiers). Mieux vaut un petit
   progrès livré qu'un gros chantier à moitié fait.
7. **Respecter le travail des autres** : ne pas toucher aux PR/branches qui ne sont pas
   celles de la routine (ex. branches `cursor/*`), sauf pour en récupérer des idées.

## 3. Protocole d'un run

### 3.1 Démarrage (≈ 5 min)
1. `git fetch origin main` puis partir de `origin/main` à jour sur la branche de travail.
2. `cd app && npm ci`.
3. Lire ce fichier, `BACKLOG.md`, et les **5 derniers comptes rendus** (`ls journal/runs | tail -5`).
   Regarder aussi `journal/diagnostics/` : un journal de montre déposé par le propriétaire oriente la priorité absolue (§000).
4. Vérifier les PR ouvertes par la routine (titre préfixé `[Auto]`) : une PR rouge ou en
   conflit d'un run précédent est **la priorité absolue** — la réparer et la fusionner
   avant toute autre chose (ou la fermer en expliquant pourquoi dans le compte rendu).

### 3.2 Choisir le type de run
Regarder la répartition des derniers runs et choisir ce qui apporte le plus maintenant.
Repères (pas des règles rigides) :

| Type | Quand | Contenu |
|---|---|---|
| 🐛 **Bugs & vérif visuelle** | ≥ 1 run sur 4 ; toujours après un gros chantier | `npm run visual` (+ `--empty`, `--light`), lire **chaque** capture, traquer erreurs console, débordements, états vides/erreur, cas limites ; écrire le test qui reproduit puis corriger |
| 💡 **Idées** | runs de 08 h et 20 h (heure de Paris) | Pas de code produit : recherche orientée utilisateur → `IDEES.md` + meilleures idées dans `BACKLOG.md` |
| 🔭 **Recherche** | ~1 run sur 6, jamais deux de suite | Recherche web (besoins réels, apps qui marchent, publications ML/santé récentes) → `RESEARCH.md` + nouvelles idées priorisées dans `BACKLOG.md`. Finir si possible par un quick win issu de la recherche |
| 🎨 **UI / ergonomie** | régulièrement | Réduire la friction (moins de taps), lisibilité, hiérarchie visuelle, cohérence du design system, accessibilité (contraste, tailles tactiles ≥ 44 px), mode clair. Captures avant/après obligatoires |
| 🏗️ **Travail de fond** | le reste du temps | Nouvelles fonctionnalités, moteur d'analyse / ML, architecture, performance, dette technique, tests |

En cas de doute : prendre l'item du haut de `BACKLOG.md` → « Prochaines étapes ».

### 3.3 Réaliser
- TDD, code lisible qui ressemble au code existant, UI en **français**.
- Toujours penser mobile (viewport ~412 px, doigts, une main) et données réelles imparfaites
  (trous, doublons, fuseaux horaires, montre non portée).

### 3.4 Vérifier — obligatoire avant de livrer
1. `npm run test` → tout vert.
2. `npm run lint` → **pas plus d'erreurs qu'avant** (baseline dans le dernier compte rendu ;
   en réduire le nombre est un bonus apprécié).
3. `npm run build` → OK.
4. `npm run visual` (pages concernées au minimum, avec `--routes=`) et **regarder les captures**
   `app/.visual/tiles/*.png` avec l'outil de lecture d'image. Comparer avant/après pour toute
   modification visuelle (`--out=.visual/avant` sur `origin/main`, puis `--out=.visual/apres`).
   Le script échoue sur erreur JS ; il signale aussi les débordements horizontaux.
5. Relire son diff de façon critique : qu'est-ce qui pourrait casser chez l'utilisateur ?

### 3.5 Livrer
1. **Nouveautés in-app** : pour tout changement visible par l'utilisateur, ajouter
   `app/src/data/changelog/AAAA-MM-JJ-HHMM-<slug>.json` (heure UTC, langage simple, orienté
   bénéfice : « Le graphique du sommeil se lit mieux sur petit écran », pas « refactor CSS »).
2. **Compte rendu** : créer `journal/runs/AAAA-MM-JJ-HHMM-<slug>.md` (modèle ci-dessous) et
   mettre à jour `BACKLOG.md` (cocher, ajouter, re-prioriser).
3. **Résumé de la semaine** (en tête de ce fichier) : l'enrichir — ce que l'utilisateur verra dans
   l'app, ce qui a changé en coulisses, les points d'attention, une ligne dans le tableau des runs.
   Écrit pour l'utilisateur (clair, concret, sans jargon). Nouvelle semaine ISO (lundi, heure de
   Paris) → déplacer l'ancien bloc dans `semaines/AAAA-Sww.md` et repartir d'un bloc vide.
4. Commit(s) clairs, push, PR vers `main` intitulée `[Auto] <résumé>`, corps = résumé du run.
5. Attendre la CI (s'abonner à l'activité de la PR, pas de boucle d'attente) : **Frontend (Vitest)**
   et **Build APK** doivent être verts (*Build APK* échoue = la release échouera aussi). Les jobs
   émulateur sont longs : les attendre seulement si le changement touche `android/`, Capacitor
   ou Health Connect.
6. CI verte **et** vérifications du §3.4 faites → **fusionner (squash)** : le push sur `main` déclenche le build de l'APK et la
   release que l'utilisateur installera en 1 clic. CI rouge → corriger et recommencer.
7. Après la fusion, vérifier que le workflow **Build & Release** de `main` a réussi et publié
   la release `v<N>` avec son APK. S'il échoue (même sans lien avec ton changement : image des
   runners, action obsolète…), le réparer est la priorité absolue — sans release, l'utilisateur
   ne reçoit plus rien.
8. Si le run ne peut pas aboutir (ou si une vérification du §3.4 échoue) : laisser la PR ouverte, documenter précisément l'état
   et la suite dans le compte rendu — le run suivant reprendra.

### Modèle de compte rendu

```markdown
# AAAA-MM-JJ HH:MM UTC — <titre>

**Type** : 🐛 / 🔭 / 🎨 / 🏗️  ·  **PR** : #NN (fusionnée / ouverte)

## Pourquoi
<le besoin, l'observation ou la source qui a motivé ce run>

## Ce qui a été fait
- …

## Vérifications
- Tests : NNN ✅ · Lint : NN erreurs (avant : NN) · Build ✅
- Visuel : pages vérifiées, ce qui a été observé

## Apprentissages / décisions
- …

## Suite proposée
- …
```

## 4. Outillage

- **Vérification visuelle** : `cd app && npm run visual` — lance Vite, injecte ~75 jours de
  données de démo corrélées (`scripts/visual/demoData.mjs`), capture chaque page dans un
  viewport Galaxy A56 (412×915, Chromium/Playwright). Options : `--empty`, `--light`,
  `--routes=/,/food`, `--radar` (début d'infection simulé), `--wellbeing-gap` (pas de note de J−9 à J−4), `--food-analysis` (analyse photo
  simulée sur /food, réponse Gemini factice), `--update-banner`, `--wellbeing-prompt`, `--whats-new`, `--out=`,
  `--click="Analyse avancée"` (clique un bouton avant la capture, ex. un onglet),
  `--viewport` (capture de l'écran visible, pour les éléments fixes), `--insets=24,48` (simule les
  barres système d'Android 15+ ; à combiner avec `--viewport`).
- **Captures sur émulateur Android réel** : chaque PR produit les artefacts `screenshots-samsung-a56-api35`
  et `-api36` (`screenshot_app.png`, `screenshot_plus.png` + arbres `ui_*.xml`). Les récupérer avec
  `gh api repos/spreadzenox/HealthTrack/actions/runs/<id>/artifacts` puis `…/artifacts/<id>/zip`, et les
  regarder pour tout changement d'interface. Toujours utiliser `var(--safe-top)` / `var(--safe-bottom)`,
  jamais `env(safe-area-inset-*)` directement (WebView ≤ 139).
  Pour une interaction précise (clic, saisie, modale), écrire un petit script Playwright
  ad hoc dans le scratchpad en s'inspirant de `visual-check.mjs`.
- **Données de démo** : enrichir `demoData.mjs` quand une nouvelle donnée apparaît, pour
  que les captures restent représentatives.
- **GitHub** : outils `mcp__github__*` s'ils sont présents ; sinon `gh api` (REST uniquement — le
  GraphQL est bloqué dans les sessions, donc pas de `gh pr create` / `gh pr checks`) :
  - PR : `gh api repos/spreadzenox/HealthTrack/pulls -f title='[Auto] …' -f head=<branche> -f base=main -f body=…`
  - checks : `gh api repos/spreadzenox/HealthTrack/commits/<sha>/check-runs --jq '.check_runs[]|[.name,.status,.conclusion]|@tsv'`
  - merge : **préférer** l'outil `mcp__github__merge_pull_request` (squash, `expectedHeadSha`) — le
    `gh api -X PUT …/pulls/<n>/merge` a été refusé par les permissions d'une session (run 17:40)
  - release : `gh api repos/spreadzenox/HealthTrack/releases/latest --jq .tag_name`
  - attendre la CI sans boucle active : outil Monitor (boucle `until` sur les check-runs) ou abonnement à la PR.
- **Mécanique de la routine** : la tâche planifiée « HealthTrack — amélioration autonome » réveille
  toutes les 2 h une session « orchestrateur » qui crée une **session neuve avec le dépôt attaché**
  (seul moyen d'avoir le droit de pousser) et lui transmet le prompt du run. Chaque run est donc
  indépendant : sa seule mémoire est ce dossier. Sessions de run étiquetées `healthtrack-routine`.
- **CI** : `Tests` (Vitest, rapide) sur PR ; `Test — émulateur Samsung Galaxy A56` (long) ;
  `Build & Release` sur push `main` → release `v<run_number>` + APK (sauf si le push ne touche
  que `journal/` : un run de pure veille ne publie donc pas de release vide).

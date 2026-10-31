# Invitation des testeurs du test fermé (prête pour la version candidate)

> Préparé le 24/10 15:30 (BACKLOG « 6f »). À envoyer **seulement** quand le résumé de la semaine affiche
> « 👉 Version candidate prête : vous pouvez inviter les testeurs ». Ne rien envoyer avant.
>
> **Relu le 31/10 08:33 contre la version 402** (run « idées ») : chaque chemin cité existe tel quel dans l'app ;
> chemins précisés (« Votre avis » et « Données » sont derrière la roue dentée « Réglages », en haut à droite) ;
> missions du ventre et de la réintroduction réservées à l'objectif « Mon ventre » (ailleurs, elles ne s'affichent
> pas) ; prérequis ajouté (Android 8 ou plus récent, pas d'iPhone). Règle de Google relue le même jour sur l'aide
> officielle (answer/14151465) : toujours **12 testeurs inscrits sans interruption pendant au moins 14 jours**, et
> encore inscrits le jour de la demande ; un testeur qui quitte puis revient ne compte pas.

## 1. Le jour où la version candidate part en alpha (fait par Claude, via la CI)

**✅ Fait le 25/10 13:33 (Paris)** : `from` = `2026-10-25T12:00:00Z` (publication de la version candidate) et
`until` = `2026-11-20T23:00:00Z` (fin exclue : premium offert **jusqu'au 20 novembre 2026 inclus**, heure de Paris ;
l'app affiche « jusqu'au 20 nov. 2026 »). Calcul : invitation vers le 27/10 (après l'examen de la piste alpha par
Google) + 14 jours de test + 10 jours de marge. La version est envoyée sur la piste alpha par « Play — AAB »
(lancement manuel, piste `alpha`), qui ajoute aussi le groupe `halcya-testeurs@googlegroups.com` aux testeurs s'il
manque.

1. Claude choisit les dates de la **période de lancement** (premium offert à toutes les installations de la version
   Google Play, sans achat) et les écrit dans `relay/src/launch-period.json` :
   - `from` = date et heure de publication de la version candidate sur la piste alpha (UTC) ;
   - `until` = jour de l'invitation + 14 jours (durée du test fermé obligatoire) + 10 jours de marge
     (retardataires, examen de la demande de production), à minuit UTC.
2. Le merge sur `main` redéploie le relais (« Relais — déploiement ») : son résumé affiche
   « Période de lancement : premium offert du … au … » et « Installation sans achat : premium=true source=launch ».
   **Aucune mise à jour de l'app n'est nécessaire.**
3. Dans l'app, la page Premium et le dernier écran de l'onboarding affichent alors **« Premium offert pendant le
   test »** (« jusqu'au …, vous n'avez rien à payer ») : aucune formule, aucun bouton d'achat, aucun « Restaurer un
   achat ». Le jour de l'échéance, le paywall habituel revient tout seul (prix lus dans Google Play).

**Recalage prévu (décision du 27/10 13:00 : testeurs au plus tôt la semaine du 2/11)** : le jour où vous dites
« j'invite », le run suivant pose `until` = jour de l'invitation + 14 jours + 10 jours de marge, à 23:00 UTC (par
exemple invitation le lundi 2/11 → `"2026-11-26T23:00:00Z"`, premium offert jusqu'au 26 nov. inclus), remplace
`<date de fin de la période de lancement>` dans le texte ci-dessous, et vérifie le résumé du déploiement du relais.
Les 14 jours ne courent qu'à partir de l'inscription du 12ᵉ testeur : la marge couvre un remplissage lent du groupe.

## 2. Ce que vous faites, vous (propriétaire)

**Prolonger la période** (sans mise à jour de l'app) : sur GitHub, ouvrez `relay/src/launch-period.json` → crayon
« Modifier » → changez la date de `until` (même format, par exemple `"2026-12-15T00:00:00Z"`) → « Commit changes »
directement sur `main`. Le relais est redéployé en 3 à 5 minutes (Actions → « Relais — déploiement », vert). Vous
pouvez aussi simplement le demander dans une consigne : le run suivant le fera.

**Couper la période** (pour retester vous-même l'abonnement, par exemple) : même fichier, `"off": false` → `"off": true`,
commit sur `main`. Attention : **tous** les testeurs perdent alors le premium jusqu'à ce que vous remettiez `false`
(ils voient de nouveau le paywall et pourraient payer avec une vraie carte). Comme votre Gmail est testeur de licence,
le plus sûr est de retester l'abonnement **après** la fin du test fermé, ou sur un créneau très court.

**Inviter** (dans cet ordre) :
1. Partagez le lien du groupe : https://groups.google.com/g/halcya-testeurs (chaque testeur clique « Rejoindre le
   groupe » avec le compte Gmail de son téléphone Android).
2. Puis le lien « Rejoindre sur le Web » de la piste de test fermé : Play Console → Halcya → Tester → Test fermé →
   Alpha → onglet **Testeurs** → en bas, « Rejoindre sur le Web » → « Copier le lien ».
3. Puis le lien de la fiche : https://play.google.com/store/apps/details?id=fr.jpesquet.sante

## 3. Texte d'invitation à envoyer (copier-coller)

> Bonjour,
>
> Je lance **Halcya**, une app Android qui aide à comprendre ce qui va avec vos bons et mauvais jours (ventre,
> sommeil, énergie, bien-être), en gardant vos données sur votre téléphone. Avant sa sortie publique, Google
> m'impose un test fermé de **14 jours avec au moins 12 personnes** : pouvez-vous m'aider ?
>
> **Le premium est offert pendant le test (jusqu'au <date de fin de la période de lancement>) : vous n'avez rien à payer**, aucune carte
> bancaire n'est demandée.
>
> Il faut un téléphone **Android 8 ou plus récent** (l'app n'existe pas encore sur iPhone).
>
> Ce qu'il faut faire (5 minutes, avec le compte Gmail de votre téléphone Android) :
> 1. Rejoindre le groupe des testeurs : https://groups.google.com/g/halcya-testeurs
> 2. Accepter le test : <lien « Rejoindre sur le Web »>
> 3. Installer l'app depuis le Play Store : https://play.google.com/store/apps/details?id=fr.jpesquet.sante
> 4. **Garder l'app installée pendant 14 jours, sans quitter le groupe ni le test**, et **l'ouvrir au moins tous les
>    2 ou 3 jours** (une photo de repas, une note du ventre, ce que vous voulez) : Google vérifie que l'app est
>    vraiment utilisée. Vos retours, même courts, me sont précieux : dans l'app, roue dentée en haut à droite →
>    Paramètres → « Votre avis » (ou directement, sur la page Halcya du Play Store, « Envoyer des commentaires privés
>    au développeur »).
>
> Astuces :
> - L'app ne sort pas dans la recherche du Play Store tant qu'elle est en test : passez par le lien ci-dessus, ou
>   Play Store → votre photo de profil → Gérer les applications et l'appareil → Gérer → filtre « Non installées ».
> - Si l'app ou sa mise à jour n'apparaît pas : Paramètres du téléphone → Applications → Google Play Store →
>   Forcer l'arrêt, puis Stockage → Vider le cache, et rouvrez le lien.
> - Si vous désinstallez puis réinstallez, passez aussi par le lien ou par « Non installées ».
>
> Merci beaucoup !


## Rappel du jour 7 (à envoyer au groupe par le propriétaire ; ajouté le 25/10, I166)

> Bonjour à tous, on est à la moitié du test de Halcya, merci ! Deux petites choses : **restez bien inscrits au test
> jusqu'au <date de fin : 14 jours après l'inscription du 12ᵉ testeur>** (si on passe sous 12 personnes, Google remet le compteur à zéro), et **ouvrez l'app de
> temps en temps** d'ici là. Si quelque chose vous a gêné ou plu, même en une phrase, répondez-moi : vos retours
> servent directement aux prochaines versions.


## 4. Missions des 14 jours (ajouté le 29/10 20:33, run « idées », `IDEES.md` I194)

> Pourquoi : le formulaire d'accès à la production demande si les testeurs ont **utilisé toutes les fonctions** et
> si leur usage **ressemble à celui des vrais utilisateurs** (aide Play Console, lue le 29/10). Des testeurs qui
> installent une fois puis oublient l'app sont la première cause de refus. Quatre messages courts au groupe, un
> geste de 2 minutes chacun, suffisent à couvrir tout le parcours. Le propriétaire les envoie (e-mail au groupe
> `halcya-testeurs@googlegroups.com`) ; rien n'est envoyé par l'app.

**Jour 1 (avec l'invitation)** — rien à ajouter : installation, onboarding, et si vous le voulez la lecture du
visage et Health Connect (les deux restent facultatifs).

**Jour 3** :
> Petite mission Halcya (2 min) : photographiez votre prochain repas avec « Photo du repas » sur l'écran
> Aujourd'hui, corrigez un ingrédient si besoin, puis enregistrez. Le soir, si vous avez choisi « Mon ventre » au
> démarrage, répondez sur le même écran à « Et votre ventre aujourd'hui, dans l'ensemble ? ». Si quelque chose vous
> paraît bizarre : roue dentée en haut à droite → Paramètres → « Votre avis ».

**Jour 7** : le rappel ci-dessus (« Rappel du jour 7 »), avec en plus :
> Mission de la semaine : allez voir l'onglet **Journal** (vos derniers jours, Tendances) et l'onglet **Sources**.
> Dites-moi en une phrase ce qui vous a paru clair ou confus.

**Jour 10** :
> Dernière mission (3 min) : si vous avez choisi « Mon ventre », ouvrez dans **Analyses** « Tester un groupe
> FODMAP » (sans forcément le commencer) et regardez ce qui est proposé. Puis, pour tout le monde : roue dentée en
> haut à droite → **Données** → « Rapport PDF pour mon médecin » ou « Télécharger la sauvegarde ». Et dites-moi :
> recommanderiez-vous l'app à quelqu'un ? Pourquoi (pas) ?

> Note (31/10) : la carte « Tester un groupe FODMAP », le bilan du soir du ventre et la carte « Votre ventre » ne
> s'affichent qu'avec l'objectif « Mon ventre » (choisi au démarrage ou dans Paramètres → « Ce qui vous amène ») ;
> c'est voulu (retour du 24/10, point 4). Si le formulaire de production doit dire que « la plupart » des fonctions
> ont été utilisées, glissez dans le message du jour 3 : « si vous ne l'avez pas choisi, vous pouvez passer à
> “Mon ventre” dans Paramètres → Ce qui vous amène, le temps du test ».

Honnêteté à garder en tête : en 14 jours, personne ne verra de « piste » (il faut 21 jours de repas ou 28 jours de
notes du ventre) ni de résultat de réintroduction (3 jours de ventre calme, puis 3 jours de test). C'est normal et
c'est dit dans le formulaire (question 3 ci-dessous) : on préfère attendre plutôt que de montrer de faux suspects.

## 5. Formulaire d'accès à la production (P30) — brouillon, à compléter au jour 12

> Où : Play Console → Halcya → Tableau de bord → « Demander l'accès à la production » (le bouton apparaît quand
> 12 testeurs sont inscrits depuis 14 jours **sans interruption** ; un testeur qui quitte puis revient recommence ses
> 14 jours). Questions relevées sur l'aide officielle le 29/10 (support.google.com/googleplay/android-developer/answer/14151465) :
> 3 parties, 10 questions. **Attention** : « Supprimer » ou quitter la page sans « Suivant » / « Envoyer » efface les
> réponses : préparez-les ici, collez-les d'une traite. Les réponses sont en anglais (lues par des examinateurs du
> monde entier) ; la traduction est en dessous pour vous. Les passages entre `<…>` sont à remplir avec les vrais
> chiffres et retours au jour 12 (un run peut le faire si vous collez les commentaires des testeurs dans une consigne :
> Play Console → *Tester → Test fermé → Alpha → Commentaires*, ou *Notes et avis → Commentaires des testeurs*).

**Partie 1 — Le test fermé**

1. *Facilité de recrutement* (choix) : la réponse vraie (probablement « Assez facile » si le groupe s'est rempli en
   quelques jours).
2. *Les testeurs ont-ils utilisé toutes les fonctions ?* — « Most of them. »
   > Testers were guided by four short "missions" (day 1, 3, 7, 10) covering onboarding, meal photo analysis, the
   > evening gut check-in, the journal and trends, data sources (Health Connect, optional on-device face reading),
   > the guided FODMAP reintroduction screen, the PDF report and data export. Personal insights need 21–28 days of
   > data by design, so testers saw the "not enough data yet" state rather than actual insights.
3. *L'usage ressemblait-il à celui attendu en production ?*
   > Mostly yes: short daily sessions (log a meal, a gut check-in, glance at today's summary). Difference: in
   > production we expect users to keep logging for weeks, which is when personal insights appear (after 21–28
   > days); a 14-day test cannot show that part, so we validated it with simulated data and automated statistical
   > checks instead.
4. *Résumé des retours* — `<3 à 5 retours réels, regroupés : ce qui a plu, ce qui a gêné, bugs>`. Exemple de forme :
   > <N> testers sent feedback. Liked: <…>. Confusing: <…>. Bugs: <…> (all fixed in versions <…>).
5. *Comment les retours ont été collectés*
   > In-app "Your feedback" button (opens the Play Store private feedback form), Play Console testing feedback,
   > and replies by e-mail to our tester group (Google Group) after each mission message.

**Partie 2 — L'app**

6. *Public visé*
   > French-speaking adults (18+) with irritable bowel syndrome or digestive discomfort who want to understand which
   > meals, sleep and habits go with their good and bad days; secondarily, people interested in their own health data
   > (smartwatch owners). Not a medical device: no diagnosis or treatment.
7. *Valeur apportée*
   > Halcya puts meals, gut check-ins, sleep, activity and wellbeing in one private journal stored on the phone,
   > then looks for links with realistic delays (2 to 48 h) and honest statistics (it waits for enough data instead of
   > naming false suspects). It offers a guided FODMAP reintroduction and a PDF report to discuss with a doctor or
   > dietitian. Logging is free forever; personal insights are a subscription.
8. *Installations estimées la 1re année* (choix) : la plus basse proposée (lancement organique en français, sans
   budget publicitaire).

**Partie 3 — Prêt pour la production**

9. *Changements faits grâce au test* — reprendre mot pour mot la liste « Changements faits pendant le test fermé » de
   `PRODUIT.md` (§ 5), traduite. Forme :
   > Based on tester feedback we shipped <N> updates during the test (versions <…> in the closed track), including:
   > <…>; <…>; <…>.
10. *Comment avez-vous décidé que l'app était prête ?*
   `<à vérifier au jour 12 : Android vitals et rapport de pré-lancement réellement propres>`
   > No crashes or ANRs reported in Android vitals and the pre-launch report for the last versions; all screens
   > checked in light and dark themes on empty and demo data before each release; about 2,800 automated tests plus
   > an emulator test run on every change; tester feedback addressed; subscription and free launch period verified
   > end to end with a license tester account.

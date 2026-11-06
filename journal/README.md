# Journal de bord de Claude — HealthTrack

## 📅 Semaine en cours — S45 (lundi 2 → dimanche 8 novembre 2026)

> Résumé tenu à jour à chaque run : **c'est ce que lit le propriétaire chaque semaine.**
> Le premier run d'une nouvelle semaine archive ce bloc dans `semaines/AAAA-Sww.md` et en ouvre un neuf.
> Semaine précédente : [`semaines/2026-S44.md`](semaines/2026-S44.md) (polissage de la version Play, table Ciqual
> rebâtie et FODMAP par sous-groupe, réintroduction guidée et rapport PDF, lecture du visage au déverrouillage dans la
> version Play, textes « slop IA » réécrits, Silver et Gold, abonnements iPhone côté relais ; v279 → v438).

> ✅ **GitHub Actions repart (06/11 08:35, P47 levée).** Entre 06:40 et ~07:30 UTC, GitHub refusait de lancer les
> jobs (« account is locked due to a billing issue »). À 07:33 UTC, le run de 08:35 a relancé les checks de la PR #748 :
> ils ont tous démarré et sont **verts** (11 sur 11). Rien à faire, sauf si vous recevez un e-mail de GitHub sur un
> paiement en échec : réglez-le alors dans Settings → Billing and licensing. Le passage vers Alpha de 16:30 peut partir.
> #748 (petit correctif d'un graphique) est mergée (09:35).

> 📅 **Gold offert jusqu'au 30 novembre (au lieu du 27) : date recalée sur votre invitation (05/11 22:35).** Alpha
> (100811) est encore en examen chez Google et reste en place au moins jusqu'à demain vers 16:30 : l'invitation ne
> peut donc partir que **vendredi 6/11 au plus tôt**. Comme convenu le 02/11 (J + 14 jours + 10 jours), la fin de
> Gold offert passe au **30 novembre inclus** ; le texte d'invitation plus bas est à jour. Si vous invitez plus tard
> que le 6/11, dites le jour : le run suivant décalera encore la date. Rien à mettre à jour dans l'app : le relais
> sert la nouvelle date dès son redéploiement.

> ⏸️ **Alpha : une version par jour au plus, pour que Google finisse son examen (05/11 19:35, CD-ALPHA-2).** Depuis
> hier soir, la livraison continue envoyait sur Alpha chaque version qui change l'app : **15 envois en 20 heures**
> (100778 → 100811). Chaque envoi relance l'examen de Google, qui pouvait donc ne jamais aboutir, et c'est cet examen
> que vous attendez pour inviter les testeurs. Désormais, une nouvelle version ne part sur Alpha que **24 heures après
> la précédente** (le test interne, lui, reçoit toujours chaque version). La version actuelle d'Alpha, **100811**
> (05/11 vers 17:30), reste donc en place au moins jusqu'à demain vers 16:30 : c'est le moment pour Google de la
> valider. **Ce que vous pouvez vérifier** : Play Console → Tester → Test fermé → Alpha. Si elle est disponible,
> vous pouvez inviter les testeurs (texte plus bas) ; si elle est encore « En cours d'examen » après-demain, dites-le :
> la routine passera à 48 heures, ou à un envoi seulement sur demande pendant le test. Depuis 21:35, la fiche du Store
> et les abonnements suivent la même règle (Google compte aussi leurs envois) et ne repartent que s'ils ont changé.

> 🚀 **Livraison continue vers Alpha : vous n'avez plus rien à lancer (04/11 20:35, retours du 04/11 19:45).**
> La routine a envoyé elle-même la version actuelle du test interne (**100776**, corrigée pour Android 8 à 12) sur
> Alpha ce soir ; Google l'examine (quelques heures à 2 jours). Ensuite, un nouveau workflow, « Play — Alpha
> (livraison continue) », envoie seul sur Alpha chaque version de main qui change l'app, dès que les tests, les
> émulateurs (dont Android 9) et l'envoi en test interne sont verts. P42 est retirée de vos actions. La production
> reste votre clic. **Ce que vous pouvez vérifier** : Play Console → Tester → Test fermé → Alpha : 100776 « En cours
> d'examen » puis disponible. **D'ici là, n'invitez que des testeurs sous Android 13 ou plus récent** (l'Alpha 100721
> se ferme à l'ouverture sous Android 8 à 12). **I220 : merci pour votre « oui » (05/11)**, appliqué le
> 05/11 13:35 : une gêne ou une douleur du ventre fait un peu baisser le bien-être estimé du jour, et le ventre n'est
> jamais un facteur des liens du bien-être.

> 👉 **Version candidate prête : vous pouvez inviter les testeurs** (02/11 23:35), **dès que la Play Console
> n'affiche plus « En cours d'examen » pour Alpha.** Vous avez lancé l'envoi vous-même hier soir (P40, merci) :
> la version **100721** (même code que la 100719 du test interne, sans plantage connu) est sur Alpha depuis 22:41,
> avec le groupe des testeurs ; Google l'examine (quelques heures à 2 jours). Le relais en production sert bien
> **Gold offert jusqu'au 27 novembre inclus** pour Android (et jusqu'au 6 novembre pour l'iPhone), vérifié au bilan
> du déploiement. **Gestes** : (1) Play Console → Halcya → Tester → Test fermé → **Alpha** : attendez que 100721 soit
> disponible ; (2) envoyez le texte ci-dessous (e-mail, WhatsApp…) à 12 à 15 personnes avec un téléphone Android ;
> (3) vérifiez au passage que le lien du point 2 est le même que « Rejoindre sur le Web » (onglet **Testeurs** de la
> piste, en bas) ; (4) les jours 3, 7 et 10 : messages courts de [`INVITATION-TESTEURS.md`](INVITATION-TESTEURS.md)
> §4. **Si vous invitez après le mardi 3/11, dites le jour à la routine** : elle décale la date de fin d'autant.
>
> Texte à envoyer :
>
> > Bonjour,
> >
> > Je lance **Halcya**, une app Android qui aide à comprendre ce qui va avec vos bons et mauvais jours (ventre,
> > sommeil, énergie, bien-être), en gardant vos données sur votre téléphone. Avant sa sortie publique, Google
> > m'impose un test fermé de **14 jours avec au moins 12 personnes** : pouvez-vous m'aider ?
> >
> > **Gold (le premium) est offert pendant le test (jusqu'au 30 novembre inclus) : vous n'avez rien à payer**,
> > aucune carte bancaire n'est demandée. Il faut un téléphone **Android 8 ou plus récent** (pas encore d'iPhone).
> >
> > Ce qu'il faut faire (5 minutes, avec le compte Gmail de votre téléphone Android) :
> > 1. Rejoindre le groupe des testeurs : https://groups.google.com/g/halcya-testeurs
> > 2. Accepter le test : https://play.google.com/apps/testing/fr.jpesquet.sante
> > 3. Installer l'app depuis le Play Store : https://play.google.com/store/apps/details?id=fr.jpesquet.sante
> > 4. **Garder l'app installée pendant 14 jours, sans quitter le groupe ni le test**, et **l'ouvrir au moins tous
> >    les 2 ou 3 jours** (une photo de repas, une note du ventre…). Vos retours, même courts, me sont précieux :
> >    roue dentée en haut à droite → Paramètres → « Votre avis ».
> >
> > Astuces : l'app ne sort pas dans la recherche du Play Store tant qu'elle est en test, passez par le lien du
> > point 3 (ou Play Store → photo de profil → Gérer les applications et l'appareil → Gérer → « Non installées »).
> > Si l'app ou sa mise à jour n'apparaît pas : Paramètres du téléphone → Applications → Google Play Store → Forcer
> > l'arrêt, puis Stockage → Vider le cache, et rouvrez le lien.
> >
> > Merci beaucoup !
>
> Ensuite : P30 (accès à la production) au plus tôt 14 jours après l'inscription du 12ᵉ testeur, réponses prêtes
> dans `INVITATION-TESTEURS.md` §5. P2 (activité de l'auto-entreprise) : étapes exactes sur le guichet unique
> écrites dans [`PRODUIT.md`](PRODUIT.md) §4, à vous de décider.

> 💶 **Prix de Google doublés au 1er janvier 2027 : déjà pris en compte (02/11 00:33, GOLD-a4).** Le relais compte le
> coût de chaque analyse avec une grille de prix qui double d'elle-même le 1er janvier 2027 (aucun redéploiement à
> faire). Une analyse Gold passera d'environ 4 à 8 centimes. Les seuils restent en euros : Gold repasse sur Flash-Lite
> au-delà de 15 € dans le mois, tout s'arrête à 19 €, donc **le budget de 20 €/mois reste protégé**, mais il sera
> atteint avec deux fois moins d'analyses (environ 190 analyses Gold par mois avant la bascule sur Flash-Lite). Rien à
> faire tant qu'il n'y a pas d'abonnés payants ; avec des abonnés Gold, il faudra relever ce budget (proposition au
> moment voulu). Le résumé de chaque déploiement du relais continue d'afficher le coût réel des 7 derniers jours.

> 🍎 **iPhone : fin de « Gold offert » le vendredi 6 novembre inclus (02/11 22:35).** Comme décidé ce soir, le relais
> arrête la période de lancement pour l'app iPhone le 06/11 à minuit (Paris) ; à partir du 07/11, l'iPhone sans
> achat voit l'écran d'abonnement (Silver / Gold), ce qu'Apple doit pouvoir essayer pendant l'examen. Google Play n'est
> pas touché (Gold offert jusqu'au 27/11). Relais en production vérifié ce soir : 27/11 pour Android, App Attest en
> observation (défi App Attest OK). La routine iOS est prévenue dans [`POUR-IOS.md`](POUR-IOS.md) (date, réponse du
> relais, test en TestFlight). Vérifié au déploiement du 02/11 22:59 (Paris) : « iPhone sans achat … jusqu’au 2026-11-06 ».

> 🧪 **Pendant les 14 jours du test (idée du 03/11 08:35, I212)** : Google refuse souvent la production pour
> « testeurs pas assez actifs » et demande alors **14 jours de test en plus**. Deux choses pour l'éviter : des testeurs
> qui ouvrent vraiment l'app (les messages des jours 3, 7 et 10 servent à ça) et **au moins deux mises à jour sur Alpha**
> pendant le test. L'envoi sur Alpha étant refusé à la session, il faudra **votre clic deux fois** (P42, vers le 07–08/11
> puis le 12–13/11 ; le résumé dira le jour) : Actions → « Play — AAB » → Run workflow → piste `alpha`.
> **Une question pour vous** : en cas de refus, Gold offert s'arrêterait le 27/11 au milieu du second test. D'accord
> pour que la routine décale alors `until` d'elle-même (jour du refus + 24 jours) ? Répondez oui ou non dans une consigne.

**Toujours en attente de vous (repris de la semaine dernière)**
- **P45** (1 min, avant d'inviter, nouveau) : Play Console → Halcya → Tester → Test fermé → Alpha → onglet Testeurs → « Adresse e-mail ou URL pour les commentaires » : si vide, mettez l'adresse de contact de la fiche Play. Ensuite, aux jours 4, 8 et 11, collez les retours des testeurs dans une consigne (« RETOURS TESTEURS jour N : … », sans nom ni adresse) : aucune API ne permet à la routine de les lire seule.
- **P43** (1 min, nouveau, pas urgent) : activer « Google Play Developer Reporting API » dans la console Google Cloud (projet healthtrack-824b26 → API et services → Bibliothèque → Activer). La routine pourra alors lire elle-même les plantages signalés par Google et choisir les versions Alpha du test sans plantage connu.
- **P37 — votre Gold après la période de lancement (simplifié le 03/11 18:35)** : le relais a trouvé une seule
  installation Android au jeton accepté, la vôtre en toute vraisemblance : empreinte **`5e4a69f72ffb`** (vue du 29/10
  au 02/11). Il suffit de **confirmer** : Paramètres → touchez 7 fois « Version » → « Empreinte de l'installation »
  commence-t-elle par **5e4a** ? Répondez « P37 oui » (ou donnez l'empreinte affichée si elle diffère) : la routine
  l'ajoute alors au relais et vous gardez Gold après le 30/11.
- **P44** (question, réponse avant le 20/11) : remercier les testeurs restés jusqu'au bout par **un mois de Gold en plus** (jusqu'au 27/12, sans carte bancaire, sous les plafonds du budget) ? Répondez « P44 oui » ou « P44 non » dans une consigne ; détail dans [`PRODUIT.md`](PRODUIT.md) §4.
- **P39** (pas urgent) : expiration des clés App Attest dans Firestore, même geste que P33 (commande dans `PRODUIT.md` §4).
- **P32** (pays de vente) : le jour de la production, 2 min, geste exact dans [`PRODUIT.md`](PRODUIT.md) §4 (abonnements déjà prêts dans les 5 pays ; Suisse 4,90 / 29,00 / 9,90 CHF, Canada 6,99 / 39,99 / 12,99 $CA hors taxes : dites-le si vous voulez d'autres prix).
- P34 (encart « Enregistrez vos applications » dans la Play Console) : pas urgents, détail dans
  [`semaines/2026-S44.md`](semaines/2026-S44.md).

| Run | Type | Résultat |
|---|---|---|
| 06/11 10:35 — [Titres : « bien-être » entier](runs/2026-11-06-1035-titres-entiers.md) | 🎨 | Revue de la version Play sur un téléphone neuf, thème sombre, écran étroit : dans Analyses, « Vos pistes du bien-être arrivent dans 5 jours » se coupait au milieu de « bien-être ». Le mot reste entier, là et sur la carte lilas de l'Accueil. Le reste des 17 pages est propre. Rien à faire de votre côté |
| 06/11 09:35 — [Relais : le réseau de test de Google reconnu](runs/2026-11-06-0935-reseau-test-relais.md) | 🧰 | En coulisses : le serveur d'analyse reconnaît maintenant les robots de Google qui testent chaque version, à l'adresse d'où part leur requête (comparée en mémoire aux adresses que Google publie, jamais enregistrée). Le bilan du déploiement les compte à part (« dont N depuis le réseau de test de Google »), pour lire enfin les vrais chiffres des testeurs. Rien ne change dans l'app ni pour personne ; une phrase ajoutée à la politique de confidentialité. Au passage, #748 (graphique « Sur quelques semaines ») et #749 (run « idées ») sont mergées. Rien à faire de votre côté |
| 06/11 08:35 — [Idées : reconnaître les robots de Google](runs/2026-11-06-0835-idees-robots-reseau.md) | 💡 | GitHub Actions repart (le blocage de facturation de 06:40 est levé : checks de #748 relancés, 11 sur 11 verts ; son merge a été refusé par le garde-fou de la session, il revient au run suivant). Veille : les robots de Google qui testent chaque version consomment des analyses Gold et brouillent les bilans ; ils sortent d'adresses que Google publie. Proposition (INSTALLS-21c) : le relais les reconnaît sans jamais garder l'adresse, puis leur sert le modèle le moins cher. Rien à faire de votre côté |
| 06/11 07:35 — [Bien-être par semaine : repère clair](runs/2026-11-06-0735-semaines-repere.md) | 🎨 | Revue sur données de démo : dans Analyses → Bien-être, le graphique « Sur quelques semaines » marquait le milieu de l'échelle d'un pointillé, que l'historique du bien-être réserve à la moyenne. C'est maintenant un trait plein, comme dans l'historique. **Non mergée : GitHub Actions bloqué par la facturation de votre compte GitHub (P47, en tête)** ; PR #748 en attente |
| 06/11 06:35 — [Analyses : un lien vers la carte où noter](runs/2026-11-06-0635-compte-lien-accueil.md) | 🎨 | Dans Analyses, tant que vos pistes ne sont pas prêtes, les onglets Bien-être et Ventre disaient « Notez … depuis la carte de l'Accueil » sans lien : c'est maintenant un lien qui y mène. Au passage, la PR de 05:35 (banc de captures fiable) est mergée. Alpha reste sur 100811 (porte de 24 h, vers 16:30). Rien à faire de votre côté |
| 06/11 05:35 — [Banc de captures fiable](runs/2026-11-06-0535-visual-fiable.md) | 🧰 | En coulisses : l'outil qui photographie chaque écran avant un merge échouait environ une fois sur quatre en attendant que le réseau se taise. Il attend maintenant que la page soit chargée et affichée, et réessaie une fois (6 passages sur 6 réussis). Rien ne change dans l'app. PR #746 verte, laissée ouverte (merge refusé par le garde-fou de la session) pour le run suivant. Alpha reste sur 100811 (porte de 24 h, vers 16:30). Rien à faire de votre côté |
| 06/11 04:35 — [Onglet Ventre : le rapport PDF en une phrase](runs/2026-11-06-0435-ventre-rapport-ligne.md) | 🐛 | Revue d'une installation neuve : avant la première note du ventre, l'onglet Ventre d'Analyses affichait un bloc « Bientôt » avec une phrase en police de chiffres. C'est maintenant une phrase simple en bas : « Le rapport PDF pour votre médecin arrive avec votre première note du ventre. » Alpha reste sur 100811 (porte de 24 h, vers 16:30). Rien à faire de votre côté |
| 06/11 03:35 — [Un seul compte à rebours des pistes](runs/2026-11-06-0335-pistes-un-compte.md) | 🐛 | PR #743 (vos semaines du bien-être) **mergée**. Défaut vu en revue sur une installation neuve (ce que verront vos testeurs) : l'Accueil disait « Vos pistes arrivent dans 21 jours » et l'onglet Ventre d'Analyses « dans 28 jours ». Avec « Mon ventre », l'Accueil compte maintenant les jours de notes du ventre, comme l'onglet (démo : 19 jours des deux côtés) ; avec un autre objectif, il compte les jours avec un repas et ne parle plus du ventre. Rien à faire de votre côté |
| 06/11 02:35 — [Onglet Bien-être : vos semaines](runs/2026-11-06-0235-bien-etre-semaines.md) | 🔧 | Analyses → Bien-être : en bas, « Sur quelques semaines » montre une colonne par semaine, votre bien-être estimé en moyenne et vos notes à part (en point), dès 2 semaines. Le lien vers Tendances (qui ne montre que 14 jours) disparaît : chaque onglet a maintenant ses trois horizons, heures, jours et semaines. Alpha reste sur 100811 (porte de 24 h). PR #743 verte, mergée par le run de 03:35. Rien à faire de votre côté |
| 06/11 01:35 — [Bien-être juste après les repas](runs/2026-11-06-0135-bien-etre-heures.md) | 🔧 | Analyses → Bien-être : un bloc « Dans les heures » en haut compare votre bien-être estimé par le visage dans les 2 h après un repas au reste de la même journée (corrigé du moment de la journée). Il faut 10 jours avec des lectures avant et après vos repas ; un écart n'est dit que s'il est net, dans un sens ou dans l'autre, sans conseil. Les trois horizons (heures, jours, semaines) existent maintenant dans les deux onglets. Alpha reste sur 100811 (porte de 24 h). Rien à faire de votre côté |
| 06/11 00:35 — [Onglet Ventre : vos semaines](runs/2026-11-06-0035-ventre-semaines.md) | 🔧 | Analyses → Ventre : en bas, une colonne par semaine montre vos jours calmes, de gêne et de douleur (mêmes chiffres que le rapport PDF). Le lien « Sur quelques semaines » de cet onglet menait à Tendances, qui ne parle que du bien-être : le ventre a maintenant son propre long terme, sans mélange. La PR du run de 23:35 (décision App Store Connect pour l'iPhone), restée ouverte, est mergée. Alpha reste sur 100811 en examen (porte de 24 h) : cette version n'y partira qu'après demain 16:30 environ. Rien à faire de votre côté |
| 05/11 23:35 — [Décision App Store Connect transmise à l'iPhone](runs/2026-11-05-2335-ios-asc.md) | 🔧 | Coulisses seulement. Vos réglages App Store Connect du 05/11 vers 23:00 sont transmis à la routine iOS (dont : renommer la page de version 717 et lui donner la build finale avant la soumission ; vérifier l'app sur Mac et Vision Pro, sans HealthKit ni caméra). Les photos du repas et des selles ouvrent le sélecteur de fichiers sans caméra. Alpha reste sur 100811 (porte de 24 h), en examen chez Google. Rien à faire de votre côté |
| 05/11 22:35 — [Gold offert jusqu'au 30/11](runs/2026-11-05-2235-until-j06.md) | 🔧 | Fin de Gold offert recalée du 27 au 30 novembre, car l'invitation ne peut partir que vendredi 6/11 au plus tôt (Alpha encore en examen). Texte d'invitation à jour. Rien à faire de votre côté |
| 05/11 21:35 — [Fiche et abonnements : même délai de 24 h que Alpha](runs/2026-11-05-2135-porte-envois-examines.md) | 🔧 | Coulisses seulement. Google compte son délai d'examen depuis le dernier changement envoyé (Alpha, fiche du Store, abonnements). Les trois envois respectent maintenant ensemble les 24 h, la fiche et les abonnements ne repartent que si leur contenu a changé, et un gel permet de ne rien envoyer pendant l'examen de votre demande de production (P30). Rien à faire de votre côté |
| 05/11 20:35 — [Idées : l'examen de Google pendant le test fermé](runs/2026-11-05-2035-idees-examen-google.md) | 💡 | D'après l'aide officielle de la Play Console, le délai d'examen court depuis le **dernier changement envoyé pour l'app** (Alpha, mais aussi la fiche du Store ; pas le test interne), de quelques heures à 7 jours, et un nouvel envoi peut renvoyer l'app en fin de file. L'espacement d'Alpha (24 h) va dans ce sens ; prochaine étape (CD-ALPHA-5) : appliquer la même règle à la fiche et aux abonnements, et ne rien envoyer pendant l'examen de la demande de production. Aucune mise à jour de fiche depuis le 03/11 : l'examen de 100811 suit son cours. Décision iPhone du 05/11 vers 20:15 transmise à la routine iOS. #732 (tendance lissée) reprise et mergée. Rien à faire de votre côté |
| 05/11 19:35 — [Alpha : une version par jour au plus](runs/2026-11-05-1935-alpha-espacee.md) | 🔧 | Retour (1) du 04/11 (« si les examens s'enchaînent sans aboutir, espace les envois ») : 15 envois sur Alpha en 20 h relançaient sans cesse l'examen de Google. Une nouvelle version ne part plus sur Alpha que 24 h après la précédente (réglable, 0 coupe la règle) ; un passage chaque matin envoie la dernière version si le délai est écoulé. 100811 reste sur Alpha au moins jusqu'au 06/11 vers 16:30. Rien ne change dans l'app. **À vérifier** : Alpha disponible dans la Play Console, puis invitation des testeurs. Mergée (#733) : **v517** |
| 05/11 18:35 — [Historique du bien-être : tendance lissée](runs/2026-11-05-1835-tendance-lissee.md) | 🔧 | Retour (5) du 04/11, reste « lectures bruitées (creux à 8 h, pic à midi) » : en vue Jour de l'historique du bien-être, la ligne suit désormais une tendance lissée (moyenne glissante sur environ une heure, les lectures nettes pèsent plus, une lecture isolée est ramenée vers votre journée) ; chaque lecture reste un point creux qu'on touche pour son détail, légende « tendance lissée ». La note du jour et les Analyses ne changent pas. Alpha : 100811 (rien de neuf à envoyer avant ce run). **À tester** : Aujourd'hui → carte Bien-être → Jour, un jour avec beaucoup de lectures. Mergée au run de 20:35 (#732) : **v518** |
| 05/11 17:35 — [Avis du Play Store lus chaque matin](runs/2026-11-05-1735-avis-play-store.md) | 🔧 | Retour (2) du 04/11, suite : chaque matin, le workflow « Votre avis — résumé » lit aussi les avis du Play Store des 7 derniers jours et n'en publie que des comptes (étoiles, versions, thèmes comme « plantage » ou « montre », avis à 3 étoiles ou moins sans réponse) ; jamais le texte ni le nom. Répondre reste votre geste (Play Console → Qualité → Avis) ; si Google refuse la lecture, le bilan donne le droit à cocher. Aucun avis public avant la production. Lecture vérifiée (Google l'accepte, 0 avis). Rien ne change dans l'app, rien à faire de votre côté. Mergée (#730) : **v516** |
| 05/11 16:35 — [Selles en photo : vos corrections](runs/2026-11-05-1635-selles-photo-fiabilite.md) | 🔧 | Retour (7) du 04/11, dernière étape : après 5 photos, Journal → Jours dit sous la ligne « Vous avez corrigé N estimations sur M. » ; si vous en corrigez plus d'une sur trois, le résultat dit « Souvent corrigée chez vous : vérifiez la forme. » Les notes faites avec une photo portent « · photo » dans le Journal, et le rapport PDF les compte. Le retour (7) est traité. v513 (100809) est sur Alpha, en examen chez Google. Rien à faire de votre côté. **À tester** : Journal → Jours après quelques photos. Mergée (#728) : **v514** |
| 05/11 15:35 — [Selles en photo dans le Journal](runs/2026-11-05-1535-selles-photo-app.md) | 🔧 | Retour (7) du 04/11, deuxième étape : dans **Journal → Jours**, si vous suivez votre ventre, une ligne discrète « Selles : estimer la forme avec une photo ». En version Play, une feuille dit une fois ce qui part (la photo, effacée juste après) avant d'ouvrir l'appareil photo (jamais la galerie). L'app propose la forme et le type de Bristol, présélectionnés, que vous corrigez ; rien n'est enregistré avant « Enregistrer ». Photo illisible : « Photo difficile à lire. Choisissez vous-même. » Politique de confidentialité complétée. **À tester** : Journal → Jours, photographiez n'importe quoi (une feuille, un objet) : la réponse doit être « difficile à lire ». Suite : SELLES-PHOTO-3 (combien de fois vous corrigez l’estimation). Mergée (#726) : **v513** |
| 05/11 14:35 — [Selles en photo : le serveur sait estimer](runs/2026-11-05-1435-selles-photo-relais.md) | 🔧 | Retour (7) du 04/11, première étape : le serveur de l'app accepte une photo de selles et répond seulement le type de Bristol (1 à 7) et une confiance, toujours avec le modèle le moins cher, une analyse décomptée comme un repas. Il ne juge que la forme (jamais la couleur ni le sang). Photo illisible : « difficile à lire », analyse rendue. Rien ne change encore dans l’app (la ligne du Journal vient au prochain run). Mergée (#724, v512), relais redéployé et vérifié. Rien à faire de votre côté |
| 05/11 13:35 — [Ventre → bien-être](runs/2026-11-05-1335-ventre-bien-etre.md) | 🧠 | Votre « I220 oui » appliqué : une note du ventre **Gêne** ou **Douleur** fait un peu baisser le bien-être estimé du jour (un pas de 20 % vers 2 / 5 ou 1 / 5, jamais vers le haut ; « Calme » ne change rien). Même chiffre sur l'Accueil, l'historique, Tendances et dans les Analyses. Les détails de la carte (« douleur au ventre comptée ») et le détail d'un jour de l'historique le disent. Le ventre n'est jamais un facteur des liens du bien-être (test de la règle 5 étendu). **À tester** : notez « Douleur » sur l'Accueil puis ouvrez les détails de la carte Bien-être. Mergée (#722) : **v511** |
| 05/11 12:35 — [Tendances : bien-être estimé](runs/2026-11-05-1235-tendances-visage.md) | 🚑 | Votre signalement de 11:45 : dans **Analyses → Tendances**, « Votre bien-être » montre maintenant le bien-être **estimé** (même série que l'historique et l'Accueil), vos notes à la main en losanges à part ; toucher un point ouvre sa lecture ; « Attendu d'après vos habitudes » dit qu'il vient de vos jours notés à la main et se compare à **votre note du jour**. Captures avant / après : `captures/tendances-visage/`. I220 OUI noté (prochain run de code : VENTRE-BE-2). **À tester** : Analyses → Tendances, touchez un point de la courbe. Mergée (#720) : **v510** |
| 05/11 11:35 — [Pistes et liens expliqués](runs/2026-11-05-1135-pistes-et-liens.md) | 🎨 | Retour (4) du 04/11, fin : dans **Analyses → Bien-être**, une ligne sous « Pistes à tester » (ce que vous pouvez changer) et une sous « Liens repérés » (tout ce qui varie avec votre bien-être, même la météo ou le pouls). La PR de 10:35 (trois horizons) est mergée ce run : **v508**. **À tester** : Analyses → Bien-être, lisez les deux lignes : la différence est-elle claire ? Mergées : #717 (**v508**, **100800 envoyée sur Alpha**, en examen) et #718 (**v509**, Alpha automatique après les émulateurs) |
| 05/11 10:35 — [Analyses rangées par délai](runs/2026-11-05-1035-analyses-horizons.md) | 🎨 | Retour (4) du 04/11, trois horizons : dans **Analyses → Ventre**, les pistes repas → ventre sont rangées sous « Dans les heures » (jusqu'à 24 h après le repas) puis « Sur quelques jours » ; dans **Bien-être**, pistes et liens sont sous « Sur quelques jours » ; en bas des deux onglets, « Sur quelques semaines » ouvre vos Tendances. Aucun calcul changé. **À tester** : Analyses → Ventre, regardez sous quel délai tombe chaque piste. PR #717 mergée au run de 11:35 (v508). Suite : « Pistes à tester » et « Liens repérés » expliqués |
| 05/11 09:35 — [Expressions comparées à votre habitude](runs/2026-11-05-0935-be-biais-habitude.md) | 🎨 | Retour (5) du 04/11, fin : dans **Historique du bien-être**, un trait marque votre part habituelle de chaque expression (28 derniers jours) et une phrase dit ce qui change (« moins de tristesse, plus de joie » ou « proche de votre habitude ») : un visage au repos lu « triste » à 40 % ne compte plus comme un mauvais jour s'il l'est tous les jours. Un encart montre l'**écart moyen entre vos notes et le visage**, mesuré sur vos jours notés. **À tester** : ouvrez l'historique, touchez un matin « triste » et comparez au trait. Mergée (v507), **100798 envoyée sur Alpha** (en examen) |
| 05/11 08:35 — [Les selles en photo, étudiées](runs/2026-11-05-0835-idees-selles-photo.md) | 💡 | Retour (7) du 04/11, étude : la photo se prendra dans le Journal (rubrique Selles, seulement avec l'objectif « Mon ventre »), jamais sur l'Accueil ; elle part à l'analyse puis est effacée ; l'app propose une des 3 formes (dures, normales, liquides) et le type de Bristol, que vous corrigez si besoin, et dit ensuite combien de fois vous l'avez corrigée. Pas d'avis sur la couleur ni le sang. Aucune étude publiée sur les IA généralistes pour ce cas : d'où les 3 formes d'abord. Trois runs de code prévus (SELLES-PHOTO-1 à 3) |
| 05/11 07:35 — [Trois notes pour caler le bien-être](runs/2026-11-05-0735-be-calibration-depart.md) | 🎨 | Retour (5) du 04/11, deuxième étape : les 3 premiers jours de lecture du visage, la carte « Bien-être estimé » demande votre note du jour (« Réglage sur vous : 1 jour sur 3 », bouton « Noter mon bien-être du jour ») ; une fois notée, « Prochaine note demain ». Jamais bloquant. Au passage, la PR de 05:35 (remonter le temps dans l'historique), restée en conflit, est remise à jour et mergée. v505 et v506 publiées, **100795 sur Alpha** (en examen). |
| 05/11 06:35 — [Bien-être recalé sur vos notes](runs/2026-11-05-0635-be-biais-recalage.md) | 🎨 | Retour (5) du 04/11, première étape : si votre visage est lu plus triste (ou plus gai) que vous ne l'êtes, l'estimation se recale sur vos notes de bien-être dès 3 jours notés (écart moyen, prudent, plafonné). **À tester** : notez votre bien-être 3 soirs de suite (« Noter moi-même » dans la carte) ; le détail de la carte dira « recalé sur vos notes de 3 jours ». Mergée (v504), **100792 envoyée sur Alpha** (en examen). Suite : notes demandées les premiers jours |
| 05/11 05:35 — [Remonter le temps dans l'historique du bien-être](runs/2026-11-05-0535-histo-remonter.md) | 🎨 | Retour (6) du 04/11, fin : dans **Historique du bien-être**, des flèches de part et d'autre de la période (« Ces 7 jours », puis « du 23 au 29 octobre ») montrent le jour, la semaine ou le mois d'avant, jusqu'à votre première lecture ; on peut aussi balayer la courbe du doigt. Toucher un point reste possible sur les périodes passées. **À tester** : remontez quelques semaines et touchez un matin « triste » pour voir ce que le modèle a lu. Suite : le biais du visage neutre lu triste (retour (5)). **Une question CI** (CI-OLDWEBVIEW-1, `BACKLOG.md`) : le test Android 9 a compté un plantage de son propre outil de lecture d'écran comme un plantage de l'app ; la routine propose de ne compter que ceux de l'app, mais n'a pas le droit de modifier ce test seule : répondez « CI-OLDWEBVIEW-1 oui » si vous êtes d'accord. **PR #709 non mergée** : la session a refusé le merge (garde-fou « merge sans revue ») ; tout est vert, à merger par vous ou au run suivant |
| 05/11 04:35 — [Toucher un point de l'historique du bien-être](runs/2026-11-05-0435-histo-detail.md) | 🎨 | Retour (6) du 04/11, première étape : dans **Historique du bien-être** (carte « Bien-être estimé » de l'Accueil), touchez un point de la courbe : sa lecture s'ouvre en dessous, avec la note, la fourchette, la valence, l'éveil et les huit expressions lues en grille (joie, neutre, tristesse, mépris…), et combien de lectures étaient peu nettes. En semaine ou en mois, le point d'un jour résume ses lectures. Utile pour voir vous-même le biais signalé (visage neutre lu triste). Suite : remonter le temps au-delà de 30 jours |
| 05/11 03:35 — [Livraison continue : plus de version oubliée](runs/2026-11-05-0335-alpha-heritage.md) | 🔧 | Trou trouvé dans l'envoi automatique vers Alpha : quand la routine pousse son compte rendu juste après une version de l'app, le test sur émulateur de cette version était annulé et elle ne partait jamais sur Alpha (cas de la 100787 cette nuit). Désormais le commit du compte rendu reprend la version du test interne, testée sur le même code. Mergée (v502) : la **100789**, avec les onglets d'Analyses, est **partie sur Alpha** (en examen chez Google). Rien ne change dans l'app, rien à faire de votre côté |
| 05/11 02:35 — [Un compte à rebours par onglet](runs/2026-11-05-0235-analyses-comptes.md) | 🎨 | La PR de 01:35 (Analyses en onglets) est **mergée** (v500, **100786 envoyée sur Alpha**, en examen ; v501 pour cette étape). Retour (4), deuxième étape : l'onglet **Bien-être** compte vos jours avec une note de bien-être (5 suffisent pour les premières pistes), plus les repas ni le ventre ; l'onglet **Ventre** a sa propre carte « Vos pistes du ventre arrivent dans N jours » (jours avec une note du ventre) et son encart passe en pêche, la couleur du ventre |
| 05/11 01:35 — [Analyses rangées en onglets](runs/2026-11-05-0135-analyses-onglets.md) | 🎨 | Retour (4) du 04/11, première étape : en haut d'Analyses, quatre onglets **Bien-être, Ventre, FODMAP, Tendances**. Le ventre a enfin son onglet à lui (pistes repas → ventre, « Tester un groupe FODMAP », rapport PDF) et l'onglet Bien-être ne parle plus que du bien-être ; Tendances quitte le Journal. Ventre et FODMAP n'apparaissent que si vous suivez votre ventre. La carte « pistes repérées » de l'Accueil ouvre le bon onglet. PR #703 mergée par le run de 02:35 (le merge avait été refusé par les permissions de la session à 01:35) |
| 05/11 00:35 — [« Votre avis » : résumé anonyme chaque matin](runs/2026-11-05-0035-avis-resume.md) | 🔧 | Retour (2) du 04/11, troisième étape : chaque matin, un workflow demande au serveur de l'app combien d'avis sont arrivés et sur quels thèmes (plantage, bug, idée, prix, montre, repas, bien-être, ventre, compliment…). Seuls des comptes sortent, jamais le texte d'un avis ; la routine les reporte dans `journal/AVIS.md`. Rien ne change dans l'app. **P46 toujours à faire avant que les testeurs écrivent** |
| 04/11 23:35 — [« Votre avis » dans l'app](runs/2026-11-04-2335-avis-formulaire.md) | 🔧 | Retour (2) du 04/11, deuxième étape : Paramètres → « Votre avis » a maintenant une zone de texte et un bouton « Envoyer » ; l'avis part au serveur de l'app avec le numéro de version, rien d'autre (aucune donnée de santé). Le lien Play Store reste en secours. Politique de confidentialité complétée (avis gardés 90 jours). Sécurité des données : rien à changer. v498, **100782 envoyée sur Alpha** (en examen). **P46 (2 min) à faire avant que les testeurs écrivent** : commande dans `PRODUIT.md` §4 |
| 04/11 22:35 — [« Votre avis » : le relais sait recevoir](runs/2026-11-04-2235-avis-relais.md) | 🔧 | Retour (2) du 04/11, première étape : le serveur de l'app accepte les avis écrits (2 000 caractères, adresses e-mail et numéros masqués à la réception, aucun identifiant de téléphone gardé, effacés au bout de 90 jours, 5 par jour au plus). Rien ne change encore dans l'app : le formulaire vient à l'étape suivante (relais déployé et vérifié, v497). **Nouvelle action P46 (2 min)** : la commande d'expiration des avis, dans `PRODUIT.md` §4 |
| 04/11 21:35 — [Chaque piste dit « Ventre » ou « Bien-être »](runs/2026-11-04-2135-pistes-ventre-bien-etre.md) | 🎨 | Retour (3) du 04/11, première étape : dans Analyses, chaque piste porte en haut une étiquette « Ventre » (orange) ou « Bien-être » (vert), et « Pistes à tester » dit « ce qui va avec vos meilleurs jours de bien-être ». Livraison continue vérifiée : « pas d'envoi » pour 100777 (rien de neuf dans l'app), puis **premier envoi automatique : 100778 placé sur Alpha** sans aucun clic (v496, 34,5 Mo). **Question I220 toujours ouverte** |
| 04/11 20:35 — [Livraison continue vers Alpha](runs/2026-11-04-2035-livraison-continue.md) | 💡🚀 | Version 100776 envoyée sur Alpha par la routine (plus de clic P42) ; workflow « Play — Alpha (livraison continue) » pour chaque version suivante qui change l'app. Retours du 04/11 rangés (BACKLOG) ; études : « Votre avis » par le relais (I219), modèle ventre / bien-être (I220, question posée) ; décisions iPhone du 04/11 reportées à la routine iOS |
| 04/11 19:35 — [Démarrage allégé](runs/2026-11-04-1935-demarrage-allege.md) | ⚡ | Le fichier de code lu à l'ouverture de l'app perd un quart de son poids (902 → 696 Ko) : la liste des Nouveautés (340 notes) se charge juste après le premier affichage. Rien ne change à l'écran. **Toujours à faire : P42 (Alpha)** |
| 04/11 18:35 — [Bien-être : un point par heure](runs/2026-11-04-1835-bien-etre-par-heure.md) | 🎨 | Historique du bien-être, vue « Jour » : avec la lecture du visage à chaque déverrouillage (jusqu'à une toutes les 2 min), la courbe empilait plus de 100 points illisibles. Au-delà de 24 lectures, elle montre un point par heure ; la moyenne du jour reste celle de toutes les lectures. **Toujours à faire : P42 (Alpha)** |
| 04/11 17:35 — [Vérification visage ↔ notes plus rapide](runs/2026-11-04-1735-memo-porte.md) | 🔧 | La PR de 16:35 (Nouveautés propres à Android, badge « Nouveau » plus lisible) est mergée. En coulisses : la vérification « votre visage suit vos notes » était refaite 3 fois à chaque ouverture de la carte du visage ; mesurée (jusqu'à 0,4 s sur ce PC après deux ans de notes), elle n'est plus calculée qu'une fois tant que rien ne change. Rien ne change à l'écran. **Toujours à faire : P42 (Alpha)** |
| 04/11 16:35 — [Notes iPhone, étiquette « Nouveau »](runs/2026-11-04-1635-notes-ios.md) | 🎨 | Page Nouveautés : l'étiquette « Nouveau » était un peu pâle en thème clair (contraste 4,2:1) ; elle passe en menthe, lisible. Deux notes d'octobre propres à Android (Health Connect, stress de la montre) ne s'afficheront plus sur iPhone (demande de la routine iOS). **Toujours à faire : P42 (Alpha)** |
| 04/11 15:35 — [Grande police sur l'émulateur](runs/2026-11-04-1535-police-emulateur.md) | 🔧 | En coulisses : à chaque version, la CI ouvre maintenant l'app sur un téléphone virtuel réglé en grande police (130 %) et vérifie que le texte grandit vraiment et que rien ne sort de l'écran (Accueil, Sources, Paramètres) : c'est le cas (texte ×1,3, rien ne déborde). Rien ne change dans l'app. **Toujours à faire : P42 (Alpha)** |
| 04/11 14:35 — [Grande taille de police](runs/2026-11-04-1435-grande-police.md) | 🎨 | Si un testeur a agrandi le texte dans les réglages de son téléphone (fréquent), deux boutons sortaient de leur cadre sur un petit écran : « Utiliser ma position approximative » (Sources, météo) et « Douleur » (carte du ventre). Corrigé ; les 16 pages de la version Play revues à 130 % et 150 %. Rien ne change à taille normale. **Toujours à faire : P42 (Alpha)** |
| 04/11 13:35 — [Bilan du relais et des pistes](runs/2026-11-04-1335-bilan-robots.md) | 🔎 | Relais redéployé et vérifié : Gold offert jusqu'au 27/11 (Android) et au 06/11 (iPhone), analyses Gold en Europe (≈ 1,2 € sur 7 jours pour les téléphones). Pistes Play : Alpha toujours sur **100721** (celle qui plante sous Android ≤ 12), test interne sur 100769 (corrigée). Les « nouvelles installations » sont retombées à 1–4 par jour ; le réglage des robots de Google n'est présent chez aucune (piste suivante au run « idées »). Rien ne change dans l'app. **Toujours à faire : P42 (Alpha)** |
| 04/11 12:35 — [Méthodes natives sous Android 12](runs/2026-11-04-1235-natif-android12.md) | 🔧 | En coulisses : à chaque version, la CI ouvre maintenant l'app sur un téléphone virtuel Android 12, parcourt les 9 écrans du premier lancement et appelle 17 fonctions du code Android : aucun plantage. C'est le type de test qui aurait trouvé le plantage du 04/11 sous Android 12 et avant. La PR de 11:35 (lint) est mergée. Rien ne change dans l'app. **Toujours à faire : P42 (Alpha avec la 100765)** |
| 04/11 11:35 — [Lint « NewApi »](runs/2026-11-04-1135-lint-newapi.md) | 🔧 | En coulisses : la CI vérifie maintenant chaque appel du code Android qui n'existe pas sous Android 8 (le type d'erreur qui a fait planter l'app sous Android 12 et avant). La PR de 10:35 (étiquette neutre des horaires de sommeil) est reprise et mergée (v486). 12 signalements, tous déjà protégés, annotés. Mergée (#685) au run suivant. Rien ne change dans l'app. **Toujours à faire : P42 (Alpha avec la 100765)** |
| 04/11 10:35 — [Horaires de sommeil neutres](runs/2026-11-04-1035-horaires-neutres.md) | 🎨 | Journal → Tendances : « Horaires variables » s'affiche en gris neutre, comme les autres écarts à votre norme (des horaires qui bougent ne sont ni bons ni mauvais en soi, règle 6). PR #682, merge refusé à la session : repris au run suivant. Rien à faire de votre côté |
| 04/11 09:35 — [WebView trop ancienne, plantage Android ≤ 12](runs/2026-11-04-0935-webview-ancienne.md) | 🚑 | **Plantage à l'ouverture sous Android 8 à 12 trouvé et corrigé** (présent depuis le 15/10, donc dans l'Alpha 100721) : voir l'alerte en tête. Trouvé par un nouveau test sur un émulateur Android 9, désormais lancé à chaque version. Sur un téléphone dont le composant « Android System WebView » est trop ancien, l'app explique maintenant comment le mettre à jour au lieu de rester blanche. « Voir » et la croix du bandeau des nouveautés agrandis. Mergée (#681, v485, **100765 en test interne**) ; #679 et #680 mergées aussi. **À faire : P42 (Alpha) dès que possible** |
| 04/11 08:35 — [Idées : retours des testeurs](runs/2026-11-04-0835-idees-retours-testeurs.md) | 💡 | Aucune API ne donne les commentaires d'un test fermé (seulement la production) : la routine ne lira les retours de vos testeurs que si vous les collez dans une consigne, aux jours 4, 8 et 11 (format prêt dans `INVITATION-TESTEURS.md` §4). **P45 (1 min)** : adresse de commentaires sur la piste Alpha. La 2e mise à jour Alpha portera leurs corrections (question 9 du formulaire de production). Mergée (#680) au run suivant. Rien ne change dans l’app |
| 04/11 07:35 — [Lecteur d'écran](runs/2026-11-04-0735-lecteur-ecran.md) | 🔧 | Accessibilité, dernière étape : vérifié que TalkBack (le lecteur d'écran d'Android) annonce bien chaque élément qu'on peut toucher et chaque volet ouvert ou fermé, sur les 16 pages de la version Play : rien à corriger. Un test bloque désormais tout retour en arrière. Mergée (#679) au run suivant. Rien ne change dans l'app, rien à faire de votre côté |
| 04/11 06:35 — [Contrastes](runs/2026-11-04-0635-contrastes.md) | 🎨 | v483. Accessibilité, suite : l’onboarding a été vérifié écran par écran (rien à corriger). Le contrôle des captures mesure désormais le contraste de chaque texte ; « Reçu », « Automatique » (Sources) et « Dans votre norme » (Tendances) étaient un peu pâles en thème clair, ils sont maintenant plus foncés. Rien à faire de votre côté |
| 04/11 05:35 — [Cibles tactiles](runs/2026-11-04-0535-cibles-tactiles.md) | 🎨 | Accessibilité : « Comment c’est calculé », « Restaurer un achat », « Désactiver » et les liens de la page Licences étaient plus petits que la taille de doigt recommandée (32 à 40 px au lieu de 44) ; corrigé. Le contrôle des captures signale désormais tout bouton trop petit ou sans nom pour les lecteurs d’écran : 0 sur les 16 pages de la version Play. Rien à faire de votre côté |
| 04/11 04:35 — [Notes de version Play](runs/2026-11-04-0435-notes-play-variantes.md) | 🔧 | En coulisses : les notes de version envoyées au Play Store (ce que vos testeurs lisent à chaque mise à jour) ne pourront plus reprendre une Nouveauté réservée à la version sideload. La relecture du bilan du serveur (robots de Google) a été refusée à la session : reprise au prochain déploiement. Rien ne change dans l'app, rien à faire de votre côté |
| 04/11 03:35 — [Rail des pistes](runs/2026-11-04-0335-rail-pistes.md) | 🎨 | Relecture de la version Play telle que la verront vos testeurs au premier lancement, en thème sombre (16 écrans) : rien de cassé. Un détail corrigé : sur la carte « Vos pistes arrivent dans 21 jours », la barre vide se voyait à peine en sombre ; elle se distingue maintenant du fond. Mergée (#673, v480). Rien à faire de votre côté |
| 04/11 02:35 — [Bouton de bienvenue](runs/2026-11-04-0235-bouton-bienvenue.md) | 🎨 | La PR #670 (masquer une piste du ventre) est mergée. Défaut trouvé grâce à la routine iPhone : au premier lancement, sur l'écran « Vos données Health Connect », le bouton « Autoriser Health Connect » remplissait presque tout l'écran en grande pilule ; il a retrouvé sa taille. Vos testeurs le verront à leur première ouverture. Mergée (#671, v479). Rien à faire de votre côté |
| 04/11 01:35 — [Masquer une piste du ventre](runs/2026-11-04-0135-masquer-piste-ventre.md) | 🎨 | Même geste pour « Votre ventre et vos repas » : flèche de la carte → « Masquer cette piste » (l'aliment disparaît, tous délais confondus, et la carte lilas de l'Accueil ne le cite plus) ; « Tout réafficher » le remet. Rien n'est effacé, aucun calcul ne change. Mergée au run de 02:35 (#670). Rien à faire de votre côté |
| 04/11 00:35 — [Masquer un lien](runs/2026-11-04-0035-masquer-lien.md) | 🎨 | Dans Analyses, un lien ou une piste qui ne vous parle pas (évident, faux) se retire : flèche de la carte → « Masquer ce lien » ; « Tout réafficher » en bas de la liste. Rien n'est effacé, aucun calcul ne change, l'export le garde. Relais revérifié (27/11 Android, 06/11 iPhone). Mergée (#668, v477). Rien à faire de votre côté |
| 03/11 23:35 — [Lint à zéro](runs/2026-11-03-2335-lint-zero.md) | 🔧 | Ménage du code : les 7 erreurs de vérification automatique (ESLint) qui traînaient depuis octobre sont corrigées, et la CI refuse désormais toute nouvelle erreur. Rien ne change dans l'app, rien à faire de votre côté |
| 03/11 22:35 — [« Le test est terminé. Merci ! »](runs/2026-11-03-2235-fin-lancement-2.md) | 🔧 | Le 28/11, au premier lancement après la fin de Gold offert, vos testeurs verront une seule fois sur l'Accueil « Le test est terminé. Merci ! », « Rien n'est effacé : votre journal et vos mesures restent dans l'app » et un lien vers les formules. Rien pour un abonné, rien dans l'app iPhone. Rien à faire de votre côté |
| 03/11 21:35 — [Fin de Gold offert annoncée](runs/2026-11-03-2135-fin-lancement-1.md) | 🔧 | À partir du 25/11 (3 jours avant la fin), vos testeurs verront sur l'Accueil « Gold offert jusqu'au 27 nov. 2026 » et ce qui reste gratuit ensuite (journal, montres, bien-être estimé, export), avec une croix pour la fermer ; si la date est recalée, la carte suit. Rien dans l'app iPhone. Rien à faire de votre côté |
| 03/11 20:35 — [Idées : fin de Gold offert](runs/2026-11-03-2035-idees-fin-gold-offert.md) | 💡 | Le 28/11, vos testeurs passeront sans un mot de Gold à la version gratuite. Deux petites cartes prévues avant cette date (« Gold offert jusqu'au 27 nov., ensuite … reste gratuit », puis « Le test est terminé. Merci ! ») ; vérifié que chaque testeur gardera droit aux 14 jours d'essai. **Question P44** : leur offrir un mois de Gold en plus ? Rien ne change dans l'app |
| 03/11 19:35 — [Score de la montre](runs/2026-11-03-1935-score-montre.md) | 🔧 | Avec votre montre Huawei, Journal → Jours montre maintenant le score de la nuit calculé par la montre (sur 100) et votre FC moyenne de la nuit, juste à côté du sommeil (ils étaient enregistrés mais invisibles). **À regarder** : le score est-il le même que dans Huawei Santé pour la même nuit ? |
| 03/11 18:35 — [Votre empreinte lue](runs/2026-11-03-1835-empreinte-lue.md) | 🔧 | PR #660 mergée, relais redéployé (vert, 27/11 Android et 06/11 iPhone toujours servis). Une seule installation Android au jeton accepté : `5e4a69f72ffb`, sans doute votre téléphone. Il reste à confirmer ses 4 premiers caractères (P37, 30 s) pour que vous gardiez Gold après le 27/11. |
| 03/11 17:35 — [Votre empreinte pour Gold](runs/2026-11-03-1735-empreinte-proprio.md) | 🔧 | Pour que vous gardiez Gold après le 27/11 sans rien recopier : le bilan du serveur listera l'installation dont la vérification Google passe (aujourd'hui, seulement votre téléphone), avant que les testeurs ne s'y ajoutent. PR #660 verte, merge refusé à la session : repris au run suivant. Rien ne change dans l'app |
| 03/11 16:35 — [Bilan du relais lisible](runs/2026-11-03-1635-testenv-journal.md) | 🔧 | Relais redéployé et vérifié : Gold offert jusqu'au 27/11 sur Android et au 06/11 sur iPhone, analyses Gold en Europe sans erreur (≈ 1,5 € sur 7 jours). Le diagnostic des robots de Google s'écrit maintenant aussi là où la routine peut le lire ; trop tôt pour conclure (2 installations aujourd'hui). Rien ne change dans l'app |
| 03/11 15:35 — [Merge de la version allégée](runs/2026-11-03-1535-merge-shrink.md) | 🔧 | La PR #656 est mergée : la version 100740 du test interne est un peu plus légère (−29 Ko sur 15,8 Mo ; les bibliothèques n'avaient presque rien d'inutile). Alpha garde la 100721 de vos testeurs. Rien à faire de votre côté ; rien ne change dans l'app |
| 03/11 14:35 — [Version Play allégée](runs/2026-11-03-1435-shrink-resources.md) | 🔧 | La version Play retire maintenant les images et textes inutilisés des bibliothèques Android au moment du build (les modèles du visage et les polices n'y sont pas exposés) : téléchargement un peu plus léger pour les testeurs. Vérifié sur l'émulateur (tout vert). Mergée au run de 15:35 (#656) |
| 03/11 13:35 — [Rapport PDF : semaines](runs/2026-11-03-1335-rapport-pdf-semaines.md) | 🎨 | Relu le rapport PDF pour le médecin tel qu'un testeur l'enverrait : si la période choisie est plus longue que le journal, les semaines vides d'avant la première note ne s'affichent plus en rangées de « 0 » (une ligne les résume) ; « 1er » pour le premier du mois. Le reste du rapport est bon |
| 03/11 12:35 — [Plantages dans le bilan Play](runs/2026-11-03-1235-plantages-vitals.md) | 🔧 | Après chaque envoi sur Google Play, le bilan liste maintenant les plantages et blocages (ANR) signalés par Google sur 30 jours, et alerte si la version envoyée est touchée : la routine choisira les versions Alpha du test sur des faits. Rien ne change dans l'app |
| 03/11 11:35 — [Robots de Google : diagnostic](runs/2026-11-03-1135-signal-robots.md) | 🔧 | L'app dit maintenant au serveur pourquoi elle ne reconnaît pas les robots de test de Google (réglage illisible, absent…), sans rien de personnel : le prochain bilan du serveur dira quelle correction faire, pour distinguer vos testeurs des robots pendant le test. Rien ne change dans l'app |
| 03/11 10:35 — [Bilan du relais](runs/2026-11-03-1035-bilan-relais.md) | 🔎 | Vérifié avant vos testeurs : Alpha a bien la 100721 ; Gold répond avec le bon modèle, en Europe, sans erreur (≈ 1,3 € de Google sur 7 jours). Environ 10 installations par jour viennent sans doute des robots de test de Google, que l'app ne reconnaît pas encore : sans risque ni coût notable, à corriger pour lire les chiffres du test. Rien ne change dans l'app |
| 03/11 09:35 — [État des pistes Play](runs/2026-11-03-0935-etat-pistes.md) | 🔧 | Le bilan de chaque envoi sur Google Play montre maintenant quelle version est sur chaque piste (test interne, Alpha, production) : la routine voit d'un coup d'œil ce qu'ont vos testeurs. Rien ne change dans l'app |
| 03/11 08:35 — [Idées : refus de la production](runs/2026-11-03-0835-idees-refus-production.md) | 💡 | Ce qui fait refuser l'accès à la production après le test : testeurs inactifs, version jamais mise à jour ; un refus coûte 14 jours. Calendrier de deux versions Alpha (P42, votre clic) et question sur la prolongation de Gold en cas de refus. Rien ne change dans l'app |
| 03/11 02:35 — [Premier lancement](runs/2026-11-03-0235-premier-lancement.md) | 🔧 | À la toute première ouverture, l'Accueil vide s'affichait un instant avant l'écran de bienvenue (et calculait pour rien) : l'app attend maintenant de savoir s'il faut l'onboarding, puis va droit à « Bienvenue » (sur l'émulateur, version Play : 3 s au lieu de 8). Rien ne change pour vous (onboarding déjà fait). Mergée au run de 03:35 (#643) |
| 03/11 03:35 — [Audit avant les testeurs](runs/2026-11-03-0335-audit-testeurs.md) | 🔧 | Premier lancement mergé (#643). Revu toute la version Play telle que vos testeurs la verront, vierge, avec Gold offert, en clair et en sombre : rien à corriger dans l'app. Le simulateur des captures comptait 10 analyses par jour pendant le test au lieu de 20 (le vrai serveur dit bien 20) : recalé. Rien ne change dans l'app |
| 03/11 04:35 — [Audit 360 px](runs/2026-11-03-0435-audit-360.md) | 🔧 | Revu la version Play sur un petit écran (360 px, comme les téléphones d'entrée de gamme de vos testeurs) : rien ne déborde, rien à corriger. Les captures de contrôle affichent désormais la vraie date de fin du test (« jusqu'au 27 nov. », 6 nov. sur iPhone), la même que dans votre texte d'invitation. Rien ne change dans l'app |
| 03/11 05:35 — [Captures de la fiche Play](runs/2026-11-03-0535-captures-fiche.md) | 🔧 | Les images de la fiche Play dataient du 22/10 (onglet « Pistes », « Analyse simple / avancée », boutons « détails » : tout ce qui a changé depuis). Refaites sur la version actuelle, 6 au lieu de 5 : Aujourd'hui, Analyses, Repas, Historique du bien-être, Réintroduction guidée, Jours (données de démonstration). Vos testeurs les verront sur la fiche ; envoyées par la CI au merge. Rien ne change dans l'app |
| 03/11 06:35 — [Montre : lectures en arrière-plan](runs/2026-11-03-0635-montre-arriere-plan.md) | 🔧 | Captures de la fiche Play envoyées (6 images, vérifié). Écran « Données de la montre » : il ne montrait l'issue des lectures que pour une synchro faite app ouverte ; il reprend maintenant celles faites app fermée et l'écrit (« Dernière lecture en arrière-plan : il y a 1 h »). **À regarder sur votre montre** : Sources → Montre → « Données de la montre » après une nuit sans ouvrir l'app |
| 03/11 07:35 — [Mesure des temps de chargement](runs/2026-11-03-0735-mesure-perf.md) | 🔧 | Avant l'arrivée des testeurs, mesuré chaque page sur 3 ans de données denses, téléphone ralenti : tout s'affiche en moins de 0,75 s (Aujourd'hui 0,36 s). Rien à corriger. Rien ne change dans l'app |
| 03/11 01:35 — [Abonnements dans les 5 pays](runs/2026-11-03-0135-pays-abonnements.md) | 🔧 | En préparant P32, défaut trouvé : Silver et Gold n'avaient de prix qu'en France, l'écran d'achat aurait été vide en Belgique, Suisse, Luxembourg et au Canada. Corrigé (prix en euros, francs suisses et dollars canadiens, essai de 14 jours partout) ; votre geste du jour de la production est écrit dans `PRODUIT.md` §4 (P32). Rien ne change dans l'app |
| 03/11 00:35 — [Fiche Play aux noms Silver / Gold](runs/2026-11-03-0035-listing-silver-gold.md) | 🔧 | Au moment de payer, Google affichait « Halcya Premium » alors que l'app dit « Silver » : corrigé (« Halcya Silver », « Halcya Gold »). La fiche du Play Store présente les deux formules (10 et 20 analyses IA par jour, « Gold estime mieux les quantités ») et sa description courte cite « SII, FODMAP ». Rien ne change dans l'app |
| 02/11 23:35 — [Alpha en examen, invitation prête](runs/2026-11-02-2335-alpha-invitation.md) | 🔧 | Votre envoi sur Alpha a marché : la 100721 est en examen chez Google. Relais vérifié en production (Android 27/11, iPhone 06/11). **Version candidate prête** : gestes et texte d'invitation en tête du résumé ; étapes P2 (guichet unique) écrites. Rien ne change dans l'app |
| 02/11 22:35 — [Fin du lancement sur iPhone](runs/2026-11-02-2235-fin-lancement-iphone.md) | 🔧 | Sur iPhone, Gold offert s’arrête le vendredi 6/11 inclus (Google Play reste au 27/11) ; après, l’app iPhone montre l’écran d’achat pour l’examen d’Apple. Relais vérifié en production (27/11, App Attest en observation) ; routine iOS prévenue (`POUR-IOS.md`). Rien ne change sur Android |
| 02/11 21:35 — [Compte rendu du 02/11](runs/2026-11-02-2135-compte-rendu-0211.md) | 🔧 | Gold offert jusqu’au 27 novembre (relais) ; App Attest de l’iPhone en observation avec votre Team ID ; « Gold estime mieux les quantités » sur le paywall et la fiche Gold. **Envoi sur Alpha refusé à la session : P40, un clic pour vous** |
| 02/11 20:35 — [Idées : fiche Play et abonnements](runs/2026-11-02-2035-idees-fiche-silver-gold.md) | 💡 | Défaut trouvé : la fiche du Play Store parle encore d’un seul « Premium » (sans Gold), et Google affiche « Halcya Premium » au moment de payer alors que l’app dit « Silver ». Texte corrigé prêt (LISTING-2, prochain run de code), description courte avec « SII, FODMAP ». Règles Play de 2027 relues : Halcya non concernée |
| 02/11 19:35 — [Mesure de perf de Tendances](runs/2026-11-02-1935-perf-tendances.md) | 🔧 | Audit Play de Sources et Réglages en démo (clair et sombre) : rien à corriger. En coulisses : Tendances ne lisait pas plus que les Analyses, c’est la mesure qui se trompait ; corrigée, et le garde-fou de la CI pour Tendances est resserré. Rien ne change dans l’app |
| 02/11 18:40 — [Ordinaux](runs/2026-11-02-1840-ordinaux.md) | 🔧 | POL-PLAY-101 : le « e » de « 21e » (paywall, premier geste de l’onboarding) s’affichait dans une autre police que Figtree ; « 21e » et « 1er paiement » ont maintenant un exposant propre, en clair comme en sombre |
| 02/11 18:10 — [Licences sur iPhone](runs/2026-11-02-1810-licences-ios.md) | 🔧 | LICENCES-IOS : la page Licences de l’app iPhone ne cite plus les bibliothèques Android ni Google Play ; rien ne change sur Android |
| 02/11 17:08 — [Page Licences](runs/2026-11-02-1708-licences.md) | 🔧 | Nouvelle page Réglages → « Licences » : bibliothèques, polices, modèles du visage (sans nom en version Play), table Ciqual et sources FODMAP, chacun avec sa licence ; un test échoue si une dépendance est ajoutée sans y figurer |
| 02/11 15:56 — [Audit onboarding en clair](runs/2026-11-02-1556-audit-onboarding-clair.md) | 🔧 | Audit Play sur données vierges en clair : onboarding complet, Paramètres, paywall Silver et Gold (POL-PLAY-12) ; rien à corriger, aucun changement dans l’app ; petite idée de typographie notée (POL-PLAY-101) |
| 02/11 14:48 — [Modèle du visage sans nom](runs/2026-11-02-1448-modele-visage.md) | 🔧 | App Attest fait jusqu’à ce qui attend P38 ; audit Play de Montre, Nouveautés, Historique du bien-être, Données, Réintroduction (POL-PLAY-12) ; POL-PLAY-100 : « HSEmotion » n’apparaît plus dans la version Play (historique et détails du bien-être), comme pour les modèles de l’analyse des repas |
| 02/11 13:46 — [App Attest 5d-2 : vérification](runs/2026-11-02-1346-appattest-garde.md) | 🔧 | Relais : chaque analyse de l'iPhone est vérifiée par sa signature App Attest (quatrième des 5 étapes) ; coupé tant que `APP_ATTEST_MODE` vaut `off`, aucun changement visible ni au déploiement ; bilan du déploiement complété |
| 02/11 12:33 — [App Attest 5d-1 : routes](runs/2026-11-02-1233-appattest-routes.md) | 🔧 | Relais : routes « défi » et « enregistrement de la clé » pour l'iPhone, coupées tant que `APP_ATTEST_MODE` vaut `off` et qu'il n'y a pas de Team ID (P38) ; aucun changement visible ni au déploiement |
| 02/11 11:33 — [App Attest 5c : assertions](runs/2026-11-02-1133-appattest-assertions.md) | 🔧 | Relais : vérification de la signature de chaque requête de l'iPhone (anti-rejeu) et registre des clés dans Firestore (troisième des 5 étapes d'App Attest) ; rien de branché, aucun changement visible |
| 02/11 10:33 — [App Attest 5b : attestation](runs/2026-11-02-1033-appattest-attestation.md) | 🔧 | Relais : vérification de l'attestation envoyée une fois par l'iPhone (deuxième des 5 étapes d'App Attest) ; rien de branché, aucun changement visible |
| 02/11 09:33 — [App Attest 5a : CBOR](runs/2026-11-02-0933-appattest-cbor.md) | 🔧 | Relais : lecteur CBOR et lecture des données de clé envoyées par l'iPhone (première des 5 étapes d'App Attest) ; rien de branché, aucun changement visible |
| 02/11 08:33 — [Idées : App Attest](runs/2026-11-02-0833-idees-app-attest.md) | 💡 | I6-RELAIS-5 spécifié d'après la doc d'Apple (attestation, assertion, registre Firestore, interrupteur à part, tests sur chaîne jetable, zéro secret) et découpé en 5 runs ; P38 : votre Team ID Apple, pas urgent |
| 02/11 07:33 — [« 1er novembre »](runs/2026-11-02-0733-premier-du-mois.md) | 🔧 | Audit play en clair du parcours repas (analyse photo, éditeur, historique ; POL-PLAY-12) ; POL-PLAY-99 : le premier du mois s’écrit « 1er » dans toutes les dates (Journal, Repas, Accueil, bien-être, Données, Nouveautés) |
| 02/11 06:33 — [Merge #620 et #621](runs/2026-11-02-0633-merge-620-621.md) | 🔧 | Les deux PR vertes restées ouvertes (merge refusé aux runs précédents) sont mergées, #621 après remise à jour du journal |
| 02/11 05:33 — [Bientôt sur Analyses](runs/2026-11-02-0533-analyses-bientot.md) | 🔧 | Audit démo en clair (Jours, Repas, Tendances, Analyses, Bien-être, Sources ; POL-PLAY-12) ; POL-PLAY-98 : les habitudes pas encore comparables ont chacune leur ligne dans « Bientôt » au lieu d’une phrase isolée. PR #621 mergée au run de 06:33 |
| 02/11 04:33 — [Sodium sous la limite](runs/2026-11-02-0433-sodium-limite.md) | 🔧 | Audit démo clair Jours, Repas, Nutrition, Tendances (POL-PLAY-12) ; POL-PLAY-97 : le sodium sous son maximum n’est plus coloré « atteint » (état « sous la limite », « incertain » si des repas manquent) ; PR #620 mergée au run de 06:33 |
| 02/11 03:33 — [Prix dit une fois](runs/2026-11-02-0333-paywall-prix.md) | 🔧 | Audit play sur données vierges en sombre, onboarding compris (POL-PLAY-12) ; POL-PLAY-96 : paywall mensuel sans essai, le prix n’est plus répété sous le bouton |
| 02/11 02:33 — [Quota IA selon la formule](runs/2026-11-02-0233-quota-gold.md) | 🔧 | Audit démo sombre Paramètres, Données, Réintroduction (POL-PLAY-12) ; POL-PLAY-95 : Paramètres dit 20 analyses IA par jour pendant le test et avec Gold (au lieu de 10) |
| 02/11 01:33 — [Milliers lisibles](runs/2026-11-02-0133-milliers.md) | 🔧 | Audit démo sombre de la version Play (POL-PLAY-12) ; POL-PLAY-94 : « 1039 kcal » → « 1 039 kcal » partout (espace fine d'Intl élargie à l'affichage) ; reste de l'audit conforme |
| 02/11 00:33 — [Prix 2027 du relais](runs/2026-11-02-0033-gold-a4-prix-2027.md) | 🔧 | Archive S44 ; GOLD-a4 : `PRICE_SCHEDULE` (×2 au 1/1/2027 UTC) appliqué par le cumul du mois selon la date de l'appel, facteur dans l'événement `start` ; seuils 15 € / 19 € et plafonds revus, inchangés ; 134 tests relais |

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

# Journal de bord de Claude — HealthTrack

## 📅 Semaine en cours — S47 (lundi 16 → dimanche 22 novembre 2026)

> Résumé tenu à jour à chaque run : **c'est ce que lit le propriétaire chaque semaine.**
> Le premier run d'une nouvelle semaine archive ce bloc dans `semaines/AAAA-Sww.md` et en ouvre un neuf.
> Semaine précédente : [`semaines/2026-S46.md`](semaines/2026-S46.md) (refonte « Compagnon » décidée et lancée : étapes
> 1 à 6 et 7a faites des deux côtés ; une seule routine et un seul dépôt pour Android et l'iPhone, puis une seule PR
> pour les deux apps ; mode polish ; chantier cycle commencé).

**🧸 Bilan du sprint (fini le 17/11 à 03:00), étape par étape. Rien n'a encore été mesuré sur un vrai téléphone.**
- **8 Scène** : livrée (île 3D, lumière, météo, 7 cadeaux, la nuit). Reste : croissance de l'île et vrai lever/coucher
  du soleil (écrits, pas branchés), palier de qualité sur un vrai téléphone.
- **9 Pilou** : livrée (figurine, 12 expressions, montre, effets dessinés). **La nuit, Pilou dort vraiment** (#1081
  mergée le 17/11 vers 07:35) : ouvrir l'app ne le réveille plus (il gardait les yeux ouverts sous « Pilou dort »), et il
  se réveille au lever du jour, même si l'app est restée ouverte.
- **10 Bulles** : livrée. Reste : retour haptique (à décider), îlot rangé en haut au défilement.
- **11-12 Vie** : livrée. Reste : rituel du soir et lanternes. Votre nom choisi apparaît déjà sur l'étiquette de l'île.
  **La carte de la rencontre illisible en sombre est corrigée : #1079 mergée le 17/11 vers 04:40**, captures iPhone relues.
- **13 Monde** : livrée, widget Android seulement. Le widget prend votre nom choisi (PR #1080). Reste : nouvelles
  poses dans le widget, et le monde branché dans l'île (découpé le 17/11 en 4 runs : lever et coucher à vos heures,
  saison, croissance, îlot voisin et mare). **Lever et coucher à vos heures sur l'île : fait (17/11 09:30, MONDE-1)**. **La saison sur l'îlot : faite et mergée (#1086, 17/11 vers 14:40, MONDE-2)** : herbe dorée en ce moment. **La croissance de l'île : faite et mergée (#1088, MONDE-3, 17/11 vers 17:50)** : l'îlot s'élargit et l'arbuste pousse avec les jours où vous notez quelque chose (jusqu'à 90 jours). Prochain : îlot voisin, mare et petit arbre (MONDE-4).
- **14 Studio** : réglages à la main livrés ; **les traits sur le vrai Pilou (#1072) mergés le 17/11 vers 06:35** (pièces 3D et
  visage peint ; l'aperçu du Studio reste en 2D).
- **15 Photo** : écrite, **éteinte partout** jusqu'à vos déclarations (missions P49 et PI3).
- Captures iPhone de main (9b785e3) relues : l'Accueil vierge n'est plus blanc, la rencontre ne recouvre plus rien.

**🚀 Sprint de la refonte, ce soir jusqu'à 03:00 (votre ordre du 16/11 vers 20:15)** — relevé de 02:30 : sept équipiers
ont codé Pilou et son monde en parallèle (étapes 8 à 15). **Cinq lots finis sur sept : Scène, Bulles, Vie, Monde et
Photo.** Sur main : #1047, #1048, #1053, #1062, #1056, #1060, #1050, #1057, #1058, #1052, #1066, puis **#1067 (Vie, 02:07 :
le cairn des galets dans « Par famille »)** et **#1070 (Scène, 02:09 : l'assemblage, la nuit sur l'île, Pilou qui dort,
images fixes avec le vrai Pilou ; release v777, APK 35,3 Mo)**. Tests de main verts. **#1071 (Pilou, 02:38 : petits effets dessinés des
expressions, yeux fermés en trait) mergée.** **Une PR encore ouverte, tous ses checks verts sauf la build iPhone, en
cours** : #1072 (Studio : vos réglages de Studio portés par le vrai Pilou, pièces 3D et visage peint). Son équipier la
merge si la build iPhone finit avant 03:00 ; sinon elle reste en PR propre et le run suivant la reprend.
**Ce soir, l'envoi Alpha (prévu 23:45, parti les nuits précédentes vers 03:10 à 03:40) emporte la refonte avec Pilou.**
**Un défaut à corriger en premier après 03:00** (relevé par le lot Scène sur les captures iPhone) : en thème sombre, la
carte de la rencontre de Pilou garde un fond clair sous un texte clair (« Comment voulez-vous l'appeler ? ») ; vous la
verrez une fois, à la mise à jour. La capture iPhone « Accueil sans données » sort blanche : à vérifier.
- **Scène (8)** : **lot fini.** #1053, #1062 et **#1070 mergées** (#1065 fermée, contenue dans #1070) : l'île en 3D en
  tête de l'Accueil, sa lumière dorée et sa météo, les 7 cadeaux en 3D, la nuit (« Pilou dort. Le reste peut attendre
  demain. »), Réglages › Mouvements de Pilou. Reste : la croissance de l'île au fil des semaines et le vrai lever et
  coucher du soleil (fonctions de Monde écrites, pas branchées), le palier de qualité mesuré sur un vrai téléphone.
- **Pilou (9)** **#1058 mergée** (00:58) : la figurine vernie, ses yeux, 12 expressions, sa montre à l'heure réelle.
  **#1071 mergée** (02:38) : petits effets dessinés des expressions, yeux fermés en trait. Plus rien en PR.
- **Bulles (10)** : **lot fini.** #1056 et #1066 : bulles, « Humeur du jour », fleurs, « Jour 3 sur 7 », 7 cadeaux, lucioles
  la nuit, jour 14, bandeau au défilement. Restes : retour haptique (à décider : ajoute un module natif), îlot qui se
  range en haut au défilement.
- **Vie (11 et 12)** : **lot fini.** #1060 et #1067 : Pilou dans Ma journée, la rencontre et son nom (une seule fois pour
  vous, sans refaire l'accueil), le jour 7, Pilou dans Objectifs et Données, le cairn des galets. Restes : rituel du soir
  et lanternes du défi des 5 soirs ; le nom choisi dans l'étiquette de l'île (une ligne) ; la carte de la rencontre en
  thème sombre (voir plus haut).
- **Monde (13)** : **lot fini.** #1048 et #1057 : le widget Android « Ma journée » avec Pilou, Pilou dans les notifications
  du soir (Android et iPhone). **Le widget n'existe que sur Android** pour l'instant.
- **Studio (14)** **#1052 mergée** (01:22) : habiller Pilou à la main dans Réglages (Cheveux, Visage, Yeux, Lunettes,
  Accessoires), fiche gardée sur le téléphone, dans l'export et l'import. #1072 (en PR, build iPhone en cours) : les
  traits sur le vrai Pilou ; l'aperçu du Studio reste en 2D.
- **Photo (15)** : **lot fini.** #1047 (relais) et #1050 (app) : **éteinte partout** jusqu'à vos déclarations (missions P49
  et PI3 prêtes, arrêtées avant le bouton d'envoi).
- Ce que le sprint aura livré et ce qui restera, lot par lot : en tête de ce résumé au premier run après 03:00.

**🎯 Version propre de la refonte pour le dimanche 22/11 au soir (votre objectif du 15/11) : ce qui sera prêt, ce qui ne le sera pas**
- **Prêt, sauf surprise** (étapes 1 à 7, sans Pilou) : 4 onglets et Réglages ; Ma journée et les habitudes ; l'accueil
  en 4 temps ; Objectifs (score, familles, défi de 10 jours, réintroduction, seuils de 6d) ; Données sur Tendances,
  avec le détail du jour qui reprend ce que faisait le Journal (7a faite le 15/11 ; 7b, deux onglets et la visite
  guidée, mergée le 16/11 ; 7c, le retrait du code du Journal, mergée le 16/11). À chaque étape : une base d'avant la refonte et une ancienne
  sauvegarde ouvertes sans perte, visite guidée à jour. La police Nunito et le fond crème (7d, mergée le 16/11 vers 12:50).
- **Pilou en 3D, son île et le double numérique (étapes 8 à 15)** : en sprint ce soir (voir plus haut) ; ce qui sera prêt
  le 22/11 dépendra de ce qui sera mergé à 03:00.
- **Avant le 22/11** : passage complet des personas, installation neuve et mise à jour depuis la version des testeurs
  (outil du parcours « mise à jour » prêt le 16/11 ; l'essai en cours visible depuis l'Accueil, UPG-1, mergé le 16/11 à
  18:00 ; le bandeau Nouveautés qui annonce la nouvelle navigation, UPG-2, mergé, #1043 ; « Ma digestion » reste cochée, UPG-4, #1045, mergée le 17/11 à 05:38 ; passage UPG-3 commencé le 16/11 20:30 : 2 personas, rien de perdu, 10 constats, d'abord la visite guidée sans « Ma journée » et les anciens objectifs « sport » et « cycle » convertis sans un mot).

**Où en est Halcya**

| | Android (Google Play) | iPhone (App Store) |
|---|---|---|
| Dernière version | release **v783** (APK 35,4 Mo, 17/11 06:36 UTC, merge de #1081 : Pilou dort vraiment la nuit ; v782 au merge de #1072) ; Alpha : **101147** envoyée le 17/11 à 05:48, en examen chez Google ; release v780 (merge de #1079 : la rencontre en thème sombre ; v777 à l’assemblage de la Scène #1070) ; test interne à chaque merge ; Alpha : la version du soir part à 23:45 (le cron de GitHub part souvent avec 3 à 4 h de retard) | **1148.1148 validée par Apple et chez « Testeurs Halcya »** (17/11 vers 06:40 UTC ; le bilan de digestion du soir) ; anciennes builds expirées le 17/11 vers 07:40 ; **844.344 reste attachée à la version 844 pour votre soumission** |
| Où l'installer | Play Store, test fermé | TestFlight : groupe interne et groupe « Testeurs Halcya » |
| Parité des fonctions | référence | **70 %** (33 fonctions vérifiées sur 47 faisables, [`PARITE.md`](../iphone/journal/PARITE.md)) |

**🧸 Refonte « Compagnon »** : étapes 1 à 6 et 7a faites sur Android et sur iPhone (6d mergée le 16/11 à 00:41 :
score au 7e jour noté, pistes au 14e, horizon moyen du bien-être à 35 jours) ; 7b mergée le 16/11 à 03:32 (Données sur Tendances et Nutrition), 7c (retrait du code du Journal) mergée le 16/11 vers 05:35, 7c soldée (« Hier » dans Ma journée mergé vers 09:35), restes de captures 7a-2 et 7b-2 mergés vers 11:45 (#1037), **7d (police Nunito, fond crème) mergée** (16/11 12:50, #1038), 7d-2 (flèches des listes) mergée (16/11 13:45, #1039), images de la fiche Play refaites en Nunito (7d-3, mergée, #1040), derniers chevrons texte (7d-4, mergée, #1041), passage des personas commencé (outil « mise à jour » mergé, #1042 ; l'essai en cours revient sur l'Accueil, UPG-1, mergé, #1044 ; bandeau Nouveautés, UPG-2, mergé, #1043 ; 2 personas sur 5 passées le 16/11 à 19:30, UPG-4 en PR), puis la fin du passage des personas, puis
Pilou (8 à 13) et le double numérique (14 et 15). Les 15 étapes : [`BACKLOG.md`](BACKLOG.md) (REFONTE-1 à 15) ; le
brief : [`BRIEF-REFONTE-COMPAGNON.md`](maquettes/compagnon/BRIEF-REFONTE-COMPAGNON.md).

> 🧸 **Refonte « Compagnon », étape 6d : les délais annoncés (16/11 00:41)** : la visite guidée et l'écran premium de
> l'accueil disent « un premier score après 7 jours notés, vos pistes après 14 » (digestion : 14 et 28). Les pistes de
> bien-être à moyen terme s'ouvrent à 35 jours notés au lieu de 21 : à 21 jours, le banc trouvait 6 à 7 % de faux liens.
> Rien ne change sur un historique déjà long. Android et iPhone par le même merge.


**👉 Prochaine action du propriétaire (une seule, celle qui débloque le plus)**
- **Le jour où vous voulez soumettre l'iPhone à l'App Store (10 min, deux clics pour vous)** : dans Chrome, connecté
  à App Store Connect, dites à Claude **« fais la mission PI2 »**
  ([`PI2.md`](../iphone/journal/missions/PI2.md), réécrite le 14/11 d'après le relevé PI1). Claude prépare tout et
  s'arrête deux fois : avant « Save » de la déclaration « dispositif médical » (réponse préparée : « No »), puis
  avant « Submit for Review ». Rien d'autre aujourd'hui ; pas de date imposée.

**Toujours en attente de vous (repris de la semaine dernière)**
- **iPhone** (repris de l'ancien résumé iOS) : mission **PI1** faite le 14/11 (Apple ne reproche rien aux abonnements) ; le jour où vous voulez soumettre à
  l'App Store, **« fais la mission PI2 »** ([`PI2.md`](../iphone/journal/missions/PI2.md), réécrite le 14/11 : arrêt
  avant « Save » de la déclaration « dispositif médical », puis avant « Submit for Review ») ; la décision sur la licence des poids du visage (valence et éveil,
  appris sur AffectNet, éteints sur iPhone en attendant : DEM-IOS-9 du backlog) ; les essais sur l'iPhone 12.
- **P32** (pays de vente) : le jour de la production, 2 min, geste exact dans [`PRODUIT.md`](PRODUIT.md) §4 (abonnements déjà prêts dans les 5 pays ; Suisse 4,90 / 29,00 / 9,90 CHF, Canada 6,99 / 39,99 / 12,99 $CA hors taxes : dites-le si vous voulez d'autres prix).

**À faire par l'orchestrateur (missions Play Console et Google Cloud, quand vous le lui écrivez)**
- Relevés des commentaires des testeurs du 16/11 et du 19/11 ([P45](missions/P45.md)) : il les donne à la routine.
- [P29](missions/P29.md) (rôle Éditeur du compte Compute par défaut) et [P34](missions/P34.md) (encart
  « Enregistrez vos applications ») : pas urgentes.
- [ETAT-PLAY](missions/ETAT-PLAY.md) : état d'examen des pistes chez Google, à la demande.
- Faites le 13/11 et le 14/11 : P43 (lecture des plantages, vérifiée le 14/11 à 18:20 : elle répond, aucun plantage ni ANR sur 30 jours), P46 et P39
  (expiration des avis et des clés App Attest), P45 (adresse de commentaires ; aucun commentaire depuis le 08/11).

| Run | Type | Résultat |
|---|---|---|
| 18/11 00:30 — [LANT-1 en PR](runs/2026-11-18-0030-lanternes-defi.md) | 🛠️ | **GitHub Actions toujours bloqué** (facturation du compte, mission P50 : c'est votre geste qui débloque tout ; sonde refusée à 23:31 UTC). Pas d'envoi Alpha ni TestFlight cette nuit. En attendant : **les lanternes du défi**, une par jour avec, allumée quand le jour est tenu (4 042 tests verts, captures relues en clair et en sombre). PR ouverte, indépendante des PR de l'îlot ; merge dès que les Actions repartent |
| 17/11 17:30 — [MONDE-3 mergée](runs/2026-11-17-1730-merge-1088.md) | 🛠️ | **#1088 mergée** : l'îlot de Pilou grandit avec les jours où vous notez quelque chose (14 checks verts, build iPhone comprise ; captures iPhone de l'Accueil relues en clair, en sombre et sans données). Sur le simulateur et dans Chromium l'Accueil sort en image fixe : la croissance se voit sur votre téléphone, à l'usage. Release v789 (APK 35,4 Mo). Après le merge, deux pannes extérieures (Maven Central saturé pour l'émulateur, App Store Connect pour TestFlight) : jobs relancés. Prochain : MONDE-4 (îlot voisin, mare, petit arbre). Rien à faire de votre côté |
| 17/11 16:30 — [MONDE-3 : budget de lectures](runs/2026-11-17-1630-monde-3-budget.md) | 🛠️ | #1088 était rouge : le premier décompte des jours d'usage relisait toutes vos notes (4 761 lectures pour l'Accueil, plafond 1 500). Il lit maintenant une note par jour et par type de note, sur 90 jours au plus : 1 004 lectures. Rien ne change à l'écran. 4 039 tests verts. Merge quand la build iPhone est verte. Rien à faire de votre côté |
| 17/11 15:30 — [MONDE-3 en PR #1088](runs/2026-11-17-1530-monde-3.md) | 🛠️ | **L'îlot grandit avec vous** : plus large et plus haut, l'arbuste plus grand, jusqu'à 90 jours de notes ; Pilou garde sa taille et l'îlot adulte tient dans le cadre (banc relu à 0, 30 et 90 jours). Le décompte des jours n'est relu qu'une fois par jour, après l'ouverture de l'Accueil. 4 034 tests verts. PR ouverte, checks et build iPhone en cours : merge au run suivant. Rien à faire de votre côté |
| 17/11 14:30 — [MONDE-2 mergée](runs/2026-11-17-1430-merge-1086.md) | 🛠️ | **#1086 mergée** : l'îlot de Pilou suit les saisons (14 checks verts, build iPhone comprise ; captures iPhone de l'Accueil relues en clair et en sombre, banc des 4 saisons relu). Sur le simulateur et dans Chromium l'Accueil sort en image fixe, donc la saison ne s'y voit pas : à regarder sur votre téléphone (herbe dorée en ce moment). Release v788 (APK 35,4 Mo). MONDE-3 préparée pour le run suivant. Rien à faire de votre côté |
| 17/11 13:30 — [MONDE-1 mergée](runs/2026-11-17-1330-merge-1083.md) | 🛠️ | **#1083 mergée** : sur l'île de l'Accueil, Pilou se couche et se lève à vos heures habituelles, comme sur le widget Android (14 checks verts, captures iPhone relues en clair et en sombre). #1086 (l'îlot suit les saisons) remise sur main, build iPhone en cours : merge au run suivant. Rien à faire de votre côté |
| 17/11 12:30 — [L'îlot suit les saisons](runs/2026-11-17-1230-monde-2.md) | 🛠️ | **MONDE-2** : l'herbe de l'îlot et l'arbuste prennent la couleur de la saison (aujourd'hui l'automne : herbe dorée, arbuste orangé ; neige en hiver ; amandier en fleur fin janvier), selon l'hémisphère de votre position météo. En PR, après #1083 (MONDE-1, attend sa build iPhone). Rien à faire de votre côté |
| 17/11 11:30 — [Main rouge : délais des simulations](runs/2026-11-17-1130-gate-timeout.md) | 🛠️ | **CI-GATE-TIMEOUT** : les tests de main étaient rouges sur 9c9e09e (4 simulations du bien-être plus lentes que 5 s sur un runner chargé, sans régression du code). Délai porté à 30 s pour ces simulations (#1085). #1080 mergée : **le widget Android affiche le nom que vous avez choisi pour votre compagnon**. MONDE-1 (#1083) remise à jour, mergée après sa build iPhone. Rien à faire de votre côté |
| 17/11 10:30 — [Accueil léger, PR finies](runs/2026-11-17-1030-monde-1-budget.md) | 🛠️ | #1084 mergée (un émulateur Android bloqué échoue en 30 min au lieu de retenir une PR 6 h). #1083 (Pilou à vos heures) corrigée avant merge : l'Accueil lisait 3 fois trop de données au démarrage, il ne lit plus que vos nuits. #1080 (widget avec votre nom) remise à jour, build iPhone relancée. Rien à faire de votre côté |
| 17/11 09:30 — [Pilou se couche à vos heures](runs/2026-11-17-0930-monde-1.md) | 🛠️ | **MONDE-1** : après 7 nuits de sommeil lisibles, l'île de l'Accueil endort et réveille Pilou à vos heures habituelles, exactement comme le widget Android (même lecture du jour). #1080 : l'émulateur bloqué depuis 2 h a été annulé puis relancé. Rien à faire de votre côté |
| 17/11 08:30 — [Idées : le monde de Pilou à brancher](runs/2026-11-17-0830-idees-monde.md) | 💡 | Restes du sprint découpés en 4 runs de code (MONDE-1 à 4 : lever et coucher à vos heures, saison sur l'îlot, croissance, îlot voisin et mare). Défaut repéré : la nuit, l'île et le widget Android ne s'endorment pas à la même heure (l'île à 22 h 30 fixe). #1080 (widget avec votre nom) non mergée : un émulateur Android est bloqué depuis plus de 50 min. Rien à faire de votre côté |
| 17/11 07:30 — [#1081 mergée, builds TestFlight nettoyées](runs/2026-11-17-0730-merge-1081-expire.md) | 🛠️ | **#1081 mergée** (Pilou dort vraiment la nuit ; 14 checks verts, captures iPhone de l'Accueil relues en clair et en sombre). #1080 (widget avec votre nom) remise à jour sur main, build iPhone relancée ; un test instable de Ma journée corrigé. **La build iPhone 1148.1148 est validée par Apple et chez « Testeurs Halcya »** ; 19 anciennes builds expirées (844.344 gardée) ; release v783 (APK 35,4 Mo). Rien à faire de votre côté |
| 17/11 06:30 — [#1072 mergée, examen bêta iPhone](runs/2026-11-17-0630-merge-1072-beta.md) | 🛠️ | **#1072 mergée** (les traits du Studio sur le vrai Pilou ; 14 checks verts, captures iPhone de l'Accueil relues en clair et en sombre ; release v782, APK 35,4 Mo). #1080 (widget) et #1081 (Pilou dort) remises à jour sur main, CI relancée (build iPhone ≈ 1 h). **Alpha du soir parti le 17/11 à 05:48** (versionCode 101147, la rencontre en sombre), en examen chez Google. **Build iPhone 1148.1148 soumise à l'examen bêta** des « Testeurs Halcya ». Rien à faire de votre côté |
| 17/11 05:30 — [Pilou dort vraiment la nuit](runs/2026-11-17-0530-pilou-dort.md) | 🛠️ | **POLISH-PILOU-DORT-YEUX** : la nuit, ouvrir l'app ne réveille plus Pilou (le « matin » commençait à minuit) et il se réveille au lever du jour même app ouverte. **#1045 (UPG-4) mergée** ; #1072, #1080 et #1081 remises à jour sur main, builds iPhone relancées (merge une par une). |
| 17/11 04:30 — [#1079 mergée, widget avec votre nom](runs/2026-11-17-0430-merge-1079-widget-nom.md) | 🛠️ | **#1079 mergée** (la rencontre lisible en thème sombre ; 14 checks verts, captures iPhone relues ; release v780, APK 35,3 Mo). #1045 (« Ma digestion » reste cochée) remise à jour sur main, tests locaux verts, CI relancée. Le widget Android reprend le nom choisi (PR, CI en cours). #1072 (Studio) : build iPhone en cours. Envoi Alpha du soir pas encore parti à 04:45. Rien à faire de votre côté |
| 17/11 03:30 — [Rencontre en thème sombre](runs/2026-11-17-0330-rencontre-sombre.md) | 🛠️ | **POLISH-MEET-DARK** : la carte de la rencontre de Pilou lisible en sombre (couleurs sombres du compagnon, test de contraste). Captures iPhone de main relues : défauts « vide-accueil » et surimpression déjà réglés par #1067. Bilan du sprint étape par étape en tête du résumé. PR #1079 en attente de sa build iPhone (merge au run suivant) ; #1072 remise à jour sur main (conflit de `visage.js` résolu), CI relancée. |
| 17/11 02:30 — [Intégrateur du sprint](runs/2026-11-17-0230-integrateur-sprint.md) | 📝 | Main vert (Tests ; Build & Release v777, APK 35,3 Mo). **#1067 (Vie) mergée à 02:07, #1070 (assemblage de la Scène) à 02:09 ; #1065 fermée. Cinq lots finis sur sept.** **#1071 (Pilou) mergée à 02:38.** #1072 (Studio) : checks verts sauf la build iPhone, en cours. Défaut relevé : carte de la rencontre illisible en thème sombre (premier correctif après 03:00). Alpha du soir pas encore parti. Journal seul. |
| 17/11 01:30 — [Intégrateur du sprint](runs/2026-11-17-0130-integrateur-sprint.md) | 📝 | Main vert (Tests ; Build & Release v774, APK 35,3 Mo). **#1052 (Studio) mergée à 01:22, #1066 (Bulles 2) à 01:30 : lots Bulles, Monde et Photo finis.** Un rouge isolé de Tests sur 99c1de6 (test de Ma journée instable), vert au commit suivant. 5 PR du sprint ouvertes (#1065, #1067, #1070, #1071, #1072). Alpha du soir pas encore parti (retard habituel du cron). Journal seul. |
| 17/11 00:30 — [Intégrateur du sprint](runs/2026-11-17-0030-integrateur-sprint.md) | 📝 | Main vert (Tests, Build & Release v771). **#1050 (Photo, éteinte) mergée à 00:26 : lot Photo fini**, puis **#1057 (Monde : widget Android, notifications du soir)** à 00:40. puis **#1058 (Pilou figurine)** à 00:58. 4 PR du sprint ouvertes (#1052 Studio, #1065 Scène, #1066 Bulles, #1067 Vie). Envoi Alpha du soir pas encore parti à 00:30 (retard habituel du cron) ; examen bêta TestFlight au premier run où la build du soir est traitée. Journal seul. |
| 16/11 23:30 — [Intégrateur du sprint](runs/2026-11-16-2330-integrateur-sprint.md) | 📝 | Main vert (v767). **#1062 (Scène 2 : cadeaux en 3D, météo de l'île) mergée** pendant le run, puis **#1056 (Bulles)** et **#1060 (Vie)**, Tests de main verts ; 4 PR du sprint attendent leur build iPhone. Assemblage local des 7 PR par le lot Scène : 3 980 tests verts, l'Accueil complet tient ; conflits entre lots identifiés et résolus sur le papier. Rien à faire de votre côté |
| 16/11 22:30 — [Intégrateur du sprint](runs/2026-11-16-2230-integrateur-sprint.md) | 📝 | Main vert (v767). **Scène (#1053) mergée** : Pilou sur son île en tête de l'Accueil. 7 PR ouvertes (#1050, #1052, #1056, #1057, #1058, #1060, #1062) ; Vie réunie dans #1060. Widget de Pilou : Android seulement (noté dans PARITE). Rien à faire de votre côté |
| 16/11 21:30 — [Intégrateur du sprint](runs/2026-11-16-2130-integrateur-sprint.md) | 📝 | Main vert. Sprint de la refonte en cours : #1047 (relais photo, éteint) et #1048 (Monde) mergées, 7 PR encore ouvertes (étapes 8 à 15) ; état par lot noté au BACKLOG, PRODUIT et PARITE. #1045 (« Ma digestion » reste cochée) verte, mergée après 03:00. Rien à faire de votre côté |
| 16/11 20:30 — [« idées » : 2 personas, installation neuve et mise à jour](runs/2026-11-16-2030-idees-upg-3-personas.md) | 💡 | Passage des personas commencé (UPG-3) : une personne qui installe Halcya (jour 1) et un testeur de 45 jours qui reçoit la refonte. **Rien de perdu** à la mise à jour (essai, jours passés, export). 10 points à polir avant le 22/11, d'abord : la visite guidée ne présente pas « Ma journée » et parle encore d'« Agir » comme d'un onglet ; vos anciens objectifs « sport » et « cycle » sont convertis sans explication (et « Confort digestif » se retrouve coché) ; la page Nouveautés ne met pas la note de la nouvelle navigation en tête. Rien à faire de votre côté |
| 16/11 19:30 — [#1043 mergée, personas, UPG-4](runs/2026-11-16-1930-merge-1043-personas-upg-4.md) | 🛠️ | **#1043 mergée** : un testeur qui arrive d'avant la refonte lit d'abord « Nouveaux onglets » dans le bandeau des Nouveautés (vu par la persona). **Passage des personas commencé** : installation neuve (Ventre sans technique, jour 1) et mise à jour (Ventre et données, jour 45, anciens objectifs ventre et cycle, essai en cours) : rien de perdu. Premier constat corrigé (PR, Android et iPhone) : le soir, votre réponse « Ma digestion » reste cochée. Rien à faire de votre côté |
| 16/11 18:30 — [#1044 mergée, #1043 remise à jour](runs/2026-11-16-1830-merge-1044-upg-1.md) | 🛠️ | **#1044 mergée** : un essai en cours se voit de nouveau depuis l'Accueil (consigne et jour de l'essai, carte remontée sous le bien-être les jours « avec »), Android et iPhone, après 14 checks verts et les captures iPhone de l'Accueil (clair et sombre) ; release **v761** (34,8 Mo). #1043 (bandeau des Nouveautés qui annonce d'abord la nouvelle navigation) remise à jour sur main ; sa build iOS repart, à merger au run suivant. Rien à faire de votre côté |
| 16/11 17:30 — [UPG-1 : l'essai en cours sur l'Accueil](runs/2026-11-16-1730-upg-1-essai-accueil.md) | 🛠️ | Un essai en cours se voit de nouveau depuis l'Accueil : la carte du bas dit sa consigne et le jour (« Dormir au moins 7 h 30 · jour 4 sur 10 · aujourd’hui, jour avec ») et remonte sous votre bien-être les jours « avec ». Android et iPhone dans la même PR (#1044), à merger après sa build iOS. #1042 (outil « mise à jour » des personas) mergée. Rien à faire de votre côté |
| 16/11 16:30 — [#1041 mergée, Nouveautés d'abord la navigation](runs/2026-11-16-1630-upg-2-nouveautes.md) | 🛠️ | **#1041 mergée** (derniers chevrons en icône) après sa build iOS relancée verte, release **v759** (34,7 Mo), captures iPhone d'Objectifs regardées. **UPG-2 en PR** : un testeur qui arrive d'avant la refonte voit d'abord, dans le bandeau des Nouveautés, la note « Nouveaux onglets » au lieu de « Nouvelle police » ; cette note dit maintenant que Données regroupe Tendances et Nutrition. #1042 remise à jour, à merger au run suivant. Rien à faire de votre côté |
| 16/11 15:30 — [Personas : parcours « mise à jour »](runs/2026-11-16-1530-personas-mise-a-jour.md) | 🛠️ | L'outil de simulation rejoue maintenant un testeur qui avait la version d'avant la refonte (anciens objectifs « sport » et « cycle », essai en cours, aucune habitude). Premier passage : rien de perdu, l'essai est intact. Deux défauts notés : l'essai en cours ne se voit plus depuis l'Accueil, et le bandeau Nouveautés met en avant la police plutôt que la nouvelle navigation. #1041 : la build iPhone a échoué sur un test d'achat sans rapport avec la PR (panne connue de l'environnement de test d'Apple), relancée. Rien à faire de votre côté |
| 16/11 14:30 — [7d-4 : derniers chevrons en icône](runs/2026-11-16-1430-7d-4-chevrons.md) | 🛠️ | Dans Objectifs, « Ce qui va avec votre bien-être » et les familles (Sommeil, Alimentation…) finissent par une flèche nette au lieu d'un « › » rapetissé par Nunito. Android et iPhone dans la même PR, à merger après la build iOS. Main vert (v758). Rien à faire de votre côté |
| 16/11 13:30 — [#1039 mergée, fiche Play en Nunito](runs/2026-11-16-1330-merge-1039-fiche-play.md) | 🛠️ | **#1039 mergée** (flèches des listes en icône) après 14 checks verts, captures iPhone Accueil et Réglages regardées en clair et en sombre. **7d-3** : les 6 captures et l'image de la fiche Play refaites (Nunito, fond crème, 4 onglets) ; elles partiront avec l'envoi du soir de la fiche. Release v756 publiée (34,8 Mo). |
| 16/11 12:30 — [#1038 mergée : Nunito et fond crème](runs/2026-11-16-1230-merge-7d-chevron.md) | 🛠️ | **#1038 mergée** après 15 checks verts, build iOS comprise (captures iPhone regardées : Nunito et fond crème en clair, sombre inchangé). **Votre app passe à la police Nunito sur fond crème**, Android et iPhone. 7d-2 en PR : les flèches « › » des cartes Agir et Réglages, devenues minuscules avec Nunito, redeviennent nettes. Rien à faire de votre côté |
| 16/11 11:30 — [#1037 mergée, 7d en PR](runs/2026-11-16-1130-merge-1037-7d-pr.md) | 🛠️ | **#1037 mergée** après sa build iOS verte (captures iPhone de Tendances › Jour d'hier et de la visite guidée regardées : propres). Étapes 7a à 7c soldées. **Étape 7d en PR** : police Nunito et fond crème, Android et iPhone (le thème sombre ne change pas) ; à merger après sa build iOS. Rien à faire de votre côté |
| 16/11 10:30 — [#1036 mergée, captures de Tendances](runs/2026-11-16-1030-7a-2-captures-tendances.md) | 🛠️ | **#1036 mergée** (Ma journée : carte « Hier » pour les habitudes restées sans réponse la veille), Android et iPhone. Restes 7a-2 et 7b-2 : les captures de l'iPhone montreront désormais un jour passé de Tendances et la visite guidée sur Tendances (PR ouverte, à merger après sa build iOS) ; côté Android, Tendances › Jour vérifié en grand texte, à 320 px et sur historique presque vide. Prochaine étape : la police Nunito et le fond crème. Rien à faire de votre côté |
| 16/11 09:30 — [7c-2 : « Hier » dans Ma journée](runs/2026-11-16-0930-7c-2-hier.md) | 🛠️ | Ma journée repose en haut de l'écran les habitudes d'hier restées sans réponse (« Hier, dimanche », Oui / Non, « Passer »), une seule fois et seulement si vous répondiez encore la veille. Android et iPhone dans la même PR, à merger après la build iOS. Rien à faire de votre côté |
| 16/11 08:30 — [« idées » : étape 7d préparée](runs/2026-11-16-0830-idees-7d-nunito.md) | 💡 | **#1034 mergée** (iPhone : la VFC de l'app Santé dans « Ce qui a pu peser ») après sa build iOS verte et la capture iPhone de Tendances. Étape **7d** (police Nunito et fond crème) préparée : mesures, contrastes, et captures avant/après de 4 écrans sur la vraie app ([fiche](maquettes/compagnon-etapes/ETAPE-7D-NUNITO.md)). iPhone : build **1107.1107** ajoutée aux testeurs externes et soumise à l'examen bêta d'Apple. Rien à faire de votre côté |
| 16/11 07:30 — [7c-2 : VFC de l'app Santé](runs/2026-11-16-0730-7c-2-vfc-sante.md) | 🛠️ | iPhone : « Ce qui a pu peser ce jour-là » (Tendances › Jour) tient compte de la variabilité cardiaque de l'app Santé, comme l'ancien Journal (elle n'y apparaissait jamais). PR ouverte, à merger après sa build iOS ; **#1033 (CSS morte du Journal) mergée** après sa build iOS verte (captures iPhone de Tendances et Nutrition regardées). Rien à faire de votre côté |
| 16/11 06:30 — [#1032 mergée, CSS morte du Journal](runs/2026-11-16-0630-merge-7b-2-css-journal.md) | 🛠️ | **#1032 mergée** (Tendances montre un chargement pendant que l'exemple de la visite se prépare) après 14 checks verts et les captures iPhone. Étape **7c-2 (1)** en PR : 110 lignes de mise en forme de l'ancien Journal retirées ; rien ne change à l'écran. Rien à faire de votre côté |
| 16/11 05:30 — [7b-2 : chargement de l'exemple](runs/2026-11-16-0530-7b-2-chargement-exemple.md) | 🛠️ | Pendant la visite, Tendances montre un chargement le temps de préparer l'exemple (3 à 6 s) au lieu de « Vos courbes apparaîtront après 3 jours ». **#1031 (7c) mergée** après sa build iOS verte (captures iPhone de Tendances regardées), release **v752** (34,6 Mo). PR #1032 ouverte, à merger après sa build iOS. Rien à faire de votre côté |
| 16/11 02:30 — [7b : garde-fou de lectures](runs/2026-11-16-0230-7b-budget-perf.md) | 🛠️ | Check « Budget de lectures » de la PR de 7b rouge : la mesure ouvrait encore `/journal`, devenu un renvoi vers Tendances › Jour. Garde-fou corrigé (Tendances › Jour mesurée sous son nom, avec son budget) ; rien ne change dans l'app. PR à merger après la build iOS. Rien à faire de votre côté |
| 16/11 01:30 — [Refonte 7b : Données sur 2 onglets](runs/2026-11-16-0130-refonte-7b-donnees-deux-onglets.md) | 🛠️ | Données n'a plus que **Tendances et Nutrition** ; « Tous vos repas » depuis Nutrition ; l'ancienne adresse du Journal mène à Tendances › Jour ; visite guidée à jour. Android et iPhone dans la même PR, à merger après la build iOS. Rien à faire de votre côté |
| 16/11 04:30 — [7c : code du Journal retiré](runs/2026-11-16-0430-refonte-7c-retrait-journal.md) | 🛠️ | **#1030 mergée** (exemple de la visite au petit matin). Étape **7c** en PR : le code de l'ancien Journal est retiré, Android et iPhone ; rien ne change à l'écran, l'ancienne adresse mène toujours à Tendances › Jour. À merger après la build iOS. Rien à faire de votre côté |
| 16/11 03:35 — [7b mergée, exemple au petit matin](runs/2026-11-16-0335-merge-7b-exemple-matin.md) | 🔧 | **#1029 (7b) mergée** à 03:32 après 14 checks verts et les captures iPhone de Tendances et Nutrition : Données n'a plus que Tendances et Nutrition, l'ancien Journal ouvre Tendances › Jour. Release **v750** (34,6 Mo). Envoi Alpha de la nuit parti à 02:24 UTC (avec 6d). Correctif : l'exemple de la visite ouvert tôt le matin ne met plus deux repas à la même minute (PR ouverte) |
| 16/11 00:30 — [Archive S46, 6d mergée](runs/2026-11-16-0030-archive-s46.md) | 📝 | Main vert (v748). **#1026 (6d) mergée** à 00:41 après 14 checks verts, build iOS comprise (captures iPhone Premium et bien-être regardées, identiques à main). Résumé S46 archivé dans `semaines/2026-S46.md`, résumé S47 ouvert. Envoi Alpha de la nuit pas encore parti à 00:30 (cron en retard comme d'habitude). Rien à faire de votre côté |

---

## Charte

Ce dossier appartient à Claude. C'est sa mémoire entre deux exécutions de la routine
autonome (une toutes les 2 h) : chaque exécution démarre sans aucun souvenir et
**doit lire ce fichier en premier**. Claude peut et doit faire évoluer cette charte
quand il trouve une meilleure façon de travailler (en le notant dans le compte rendu du run).

**Méta-leçons C — comment travaille la routine** (propriétaire, 07/11 au soir) : 12. Elle ne connaît que le prompt et
le dépôt. 13. Une spécification vit dans le dépôt, le prompt y renvoie. 14. Les mots exacts du propriétaire passent
tels quels. 15. Ce qui est remplacé est retiré explicitement. 16. Chaque transmission est vérifiée. 17. Les personas
simulées (`PERSONAS.md`, `simulations/`) jugent chaque version. Dès le 09/11 : **mode polish** (`PRODUIT.md` § 0).

**Routine unique, Android et iPhone** (décision du 13/11 vers 19:05) : la version iPhone vit dans `iphone/` et cette
routine fait les deux apps. À chaque run, après cette charte : `iphone/README.md`, `iphone/journal/README.md` § 3, § 4
et § 8, `iphone/journal/PARITE.md`, `iphone/journal/BACKLOG.md`. Une fonction n'est livrée que des deux côtés, ou avec
une ligne de `PARITE.md` qui dit pourquoi pas. **Depuis le 15/11 (IOS-HEAD), une seule PR pour les deux apps** :
`iphone/upstream.json` suit `HEAD`, l'app iPhone embarque le code partagé du commit construit ; plus de PR de suivi ni
de `--latest`. Avant de pousser une PR qui touche `app/src/` : `cd iphone && scripts/upstream.sh` (clone complet :
`git fetch --unshallow --filter=blob:none origin main`) ; un correctif cassé se refait dans la même PR (`patch -p1
--fuzz=3` dans `upstream/`, puis `git -C upstream diff -- <fichier> > patches/NN.patch`), tests et lint dans
`iphone/upstream/app`. Une PR qui touche `app/` (hors `app/android/`, `app/store/`, `.md`), `relay/`, `iphone/` (hors
journal, fiche, site) ou `ios-build.yml` attend « iOS — build simulateur » (job Ubuntu en quelques minutes, job macOS
près d'une heure) et ses captures (`captures/pr-<N>`) avant le merge : **une PR de code est donc le plus souvent
mergée par le run suivant**, qui regarde les captures iPhone des écrans touchés ; pendant la build, le run prépare
l'étape d'après sur une autre branche, sans la pousser en PR avant le merge de la première (chaque merge remet
l'autre en retard sur main). Une PR de journal seul ne déclenche pas la build. Le merge envoie seul la build sur
TestFlight. Les
workflows qui parlent à Apple ne se lancent que sur main. Il n'y a plus de relais : ni `POUR-IOS.md`, ni
`DEMANDES.md`, ni `POUR-ORCHESTRATEUR.md` (archivés dans `archives/ancien-montage/`). Le compte rendu donne la version
Android, la build TestFlight et la parité.

**Gestes du propriétaire automatisés** (décision du 12/11 vers 16:15, `PRODUIT.md` § 4) : une action du propriétaire
n'arrive jamais comme une simple marche à suivre. Elle a sa voie : (a) CI ou API, au besoin après un droit accordé une
fois (droit et commande exacte) ; (b) mission navigateur `missions/Pxx.md` (page de départ, étapes, valeurs exactes,
vérification finale, capture attendue), qu'il fait exécuter par Claude dans Chrome (« fais la mission Pxx ») ; (c) son
geste (production, envoi final d'une déclaration qui l'engage, signature, paiement, identité), préparé jusqu'au bouton.
Aucun secret dans une mission ; ne jamais demander de mot de passe. Toute autre tâche qu'un modèle Claude pourrait
faire à sa place est proposée en tête du résumé.

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
| `missions/Pxx.md` | Missions navigateur du propriétaire (décision du 12/11) : index et règles dans `missions/README.md` |
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
4. Commit(s) clairs, push, PR vers `main` intitulée `[Auto] <résumé>`, corps = résumé du run. Les captures
   du journal (`journal/**/*.png`) sont suivies par git depuis le 12/11 17:35 (plus de `git add -f`) : vérifier quand
   même avec `git ls-files` que chaque capture citée dans le résumé existe (oubli du 09/11 au soir, puis du 12/11
   00:35 à 15:35 : liens morts).
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

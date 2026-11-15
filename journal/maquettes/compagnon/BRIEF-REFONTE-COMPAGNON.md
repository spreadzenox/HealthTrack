# Brief de la refonte « Compagnon » — version complète (14/11/2026)

> Pour l'orchestrateur, à traduire en instructions datées de la routine unique (Android + iPhone, dépôt
> `spreadzenox/HealthTrack`). Ce brief **remplace** le brief du 13/11 (`BRIEF-ROUTINE-COMPAGNON.md`) : il en reprend
> tout, ajoute le rendu de Pilou choisi le 14/11 et le double numérique. Les références (maquettes, SPEC, code,
> images) sont dans le kit `journal/maquettes/compagnon/` (§ 13).

## 0. En une page
- **Ce qui change** : Halcya devient une app à **compagnon** (« Pilou », nommé par l'utilisateur), sur 4 onglets
  (Accueil · Ma journée · Objectifs · Données) et une icône Réglages. Le Journal jour par jour disparaît ; Tendances
  devient l'écran de visualisation. Premières analyses à 7 jours (bien-être) et 14 jours (digestion). Nunito remplace
  Figtree. Les habitudes entrent dans les saisies et ont leur couleur.
- **Le rendu de Pilou** (choisi le 14/11) : une **figurine de collection en vinyle verni**, avec **les yeux et la
  lumière de la créature** (vrais yeux 3D à iris et pupille vivante ; heure dorée en contre-jour). Silhouette,
  proportions, couleurs et règles du personnage restent celles de la planche du chapitre 1.
- **Le double numérique** : Pilou peut porter les traits de l'utilisateur (cheveux, lunettes, yeux, barbe…), par
  le Studio Pilou à la main ou par une photo analysée une fois par le relais. Jamais d'âge, de genre, d'origine ni de
  santé déduits.
- **Comment** : une refonte, donc une exception au mode polish ; **un run de code = une étape testable**, dans
  l'ordre du § 10, avec la parité iPhone dans le même run. Les étapes 1 à 7 ne dépendent pas du compagnon.

## 1. Les décisions du propriétaire, avec ses mots
| Date | Ses mots | Ce que ça décide |
|---|---|---|
| 13/11 | « Celle avec le compagnon est clairement la meilleure. » Il demande de « mettre en place tout ça ». | Direction « Compagnon », la refonte de ce brief. |
| 13/11 | « Nunito oui, 7 jours bien-être, 14 jours digestion, l'écran journal jour par jour tel qu'il existe devrait purement et simplement être supprimé son intérêt est moindre. L'écran de visualisation privilégié devient celui des tendances (cf discussion) » | Police Nunito ; seuils 7/14 ; suppression du Journal ; Tendances écran de référence. Remplace sa satisfaction du 04/11 sur le Journal, et règle la question en attente « Tendances › Jour ». |
| 14/11 | « 1: oui à priori sauf si le design plus réaliste y change quelque chose 2: oui propre couleur pour les habitudes 3: objectifs très bien 4: oui il garde la montre » | Fond crème (§ 6) ; couleur propre des habitudes ; onglet « Objectifs » ; Pilou garde sa montre. |
| 14/11 | « sur la partie Pilou lui-même j'aimerais ajouter des détails et du réalisme autant que faire se peut » | Quatre esquisses réalistes ont été faites (§ 7.1). |
| 14/11 | « j'aimerais que l'apparence du Pilou soit un peu le double numérique de l'utilisateur. On pourrait prendre une photo du visage de l'utilisateur et l'envoyer à gemini une fois pour qu'il en tire un subset structuré en json des caractéristiques du visage de l'utilisateur et faire en sorte que le pilou lui ressemble. Pour que ce soit viable il faut que les combinaisons soient multiples » | Le double numérique (§ 9). |
| 14/11 vers 18:35 | « ok figurine avec les yeux et la lumière de la créature rédige un gros brief et transmets le pour la refonte » | Le rendu de Pilou (§ 7) et la transmission de ce brief. |

## 2. Statut et façon de travailler
- C'est une **refonte**, donc une **exception au mode polish** (comme les intégrations et le chantier CYCLE). Le
  polish continue sur ce que la refonte ne touche pas ; rien de ce qui doit disparaître (Journal, objectifs sport et
  cycle) ne reçoit plus de polish.
- **Un run de code = une étape** du § 10, testable et fusionnable, sans casser ce qui marche. Les runs « idées »
  (8 h, 20 h) préparent l'étape suivante : inventaires, mesures, maquettes, découpage.
- **Parité iPhone dans le même run**, avec le même code Capacitor ; `iphone/journal/PARITE.md` dit ce qui ne peut pas
  l'être. Captures des écrans touchés regardées des deux côtés avant tout merge.
- La question en attente **« Tendances › Jour »** est tranchée par ce brief : le détail d'un jour vit dans Tendances
  (§ 3.6, étape 7).

## 3. Décisions produit (elles remplacent ce qui les contredit)
1. **Cible** : un seul besoin, plusieurs intensités. D'un côté les curieux de leurs données (bien-être), de l'autre
   les gens qui ont mal au ventre, notamment avec un syndrome de l'intestin irritable (confort digestif). **On
   abandonne les sportifs** (objectif « Mon sport et ma récupération », tout score de performance) **et la cible
   endométriose** (objectif « Mon cycle »). La lecture du cycle décidée le 10/11 reste un **contexte** de la
   digestion. Les anciens utilisateurs de ces objectifs gardent toutes leurs données.
2. **Objectifs** : **le bien-être pour tout le monde** (avec la lecture du visage), plus **un objectif particulier
   facultatif**, le confort digestif. Inclus : le bien-être et un objectif ; un objectif de plus relève de l'offre
   payante, mentionnée en une ligne discrète. **Sans l'objectif digestion, l'app ne demande jamais de noter son
   ventre.**
3. **Entrées** :
   - **automatiques**, jamais demandées ni validées : sommeil, pas, cœur, VFC, respiration, température de la peau,
     séances si montre, temps d'écran, météo. Le « stress » calculé par la montre ne s'affiche pas.
   - **à la main** : repas (photo), activité seulement sans montre, **habitudes**. Proposées : méditation,
     étirements, relaxation, lecture ; plus une habitude libre (un nom, puis oui ou non chaque jour, durée habituelle
     facultative). Les habitudes entrent dans les analyses comme des entrées.
4. **Onboarding en 4 temps**, plus la rencontre de Pilou que l'on nomme :
   1. « Qu'est-ce qui vous amène ? »
   2. « Avez-vous une montre ? » : les sources se branchent **une seule fois**, puis vivent dans Réglages.
   3. « Ce que Halcya suit pour vous, sans rien faire », pour information.
   4. « Ce que vous noterez chaque jour » : cases déjà cochées selon l'objectif, une habitude libre, et
      « Partez de ce que vous faites déjà : ce n'est pas une liste de bonnes résolutions. »
5. **Premières analyses : 7 jours pour le bien-être, 14 jours pour la digestion** (aujourd'hui 14 et 28 dans
   `app/src/config/firstResults.js`). La barre de la première semaine (« Jour 3 sur 7 ») porte sur le bien-être ; la
   carte Confort digestif dit son propre délai (« encore 7 jours »). Fiabilité affichée honnêtement ; la règle « on
   préfère attendre plutôt que de se tromper » reste.
6. **Le Journal jour par jour est supprimé** ; **Tendances est l'écran de visualisation de référence** : on y
   superpose des courbes, et toucher un point ouvre le détail du jour.

## 4. Navigation : 4 onglets et une icône Réglages
| Onglet | Rôle (une seule fonction) | Vient de |
|---|---|---|
| **Accueil** | Pilou sur son île, entouré de **bulles** : ce qu'il reste à faire aujourd'hui. Une bulle éclate quand c'est fait et une fleur pousse ; la jauge « Humeur du jour » monte. Première semaine : barre « Jour 3 sur 7 avant vos premières analyses », un cadeau par jour (J1 arbuste, J2 lanterne, J3 écharpe, J4 galets, J5 papillon, J6 nuage, J7 arc-en-ciel). En dessous : les cartes des objectifs (score sur 7 jours, tendance), puis « Agir : 3 pistes à tester ». | `Dashboard`, `Act` |
| **Ma journée** | La checklist du jour, seulement ce qui se note à la main : repas (3 cercles et une photo ; noter un repas « nourrit » Pilou), bien-être (note rapide ou lecture du visage), ventre le soir (seulement avec l'objectif digestion), habitudes (oui ou non). Une ligne part quand c'est fait ; en fin de journée « Plus rien à faire ». | `TodayCards` |
| **Objectifs** | Le score de chaque objectif et sa tendance, en mots simples. Toucher un objectif montre **ce qui l'influence** en 3 familles (sommeil, alimentation, activité), puis le détail d'une famille et **la piste à tester** en défi doux (5 soirs) avec un bilan honnête. « Comment est calculé votre bien-être ? » explique le calcul. La réintroduction FODMAP passe sous Confort digestif. | `Recommendations`, `Trial`, `Reintroduction` |
| **Données** | Visualiser, sans analyse. S'ouvre sur **Tendances** ; **Nutrition** en second onglet (historique des repas). | `Trends`, `Nutrition`, `Food` (`Journal` supprimé) |
| **Réglages** (icône) | Sources, objectifs, habitudes, Pilou (nom, Studio, mouvements réduits), abonnement, export, confidentialité. | `Connectors`, `WatchData`, `Data`, `Settings`, `More` |

Les routes actuelles sont redirigées (liens profonds, notifications, widget) ; aucune ne mène à un écran vide.

## 5. Choix d'expérience, repris des maquettes (sauf avis contraire du propriétaire)
- Pilou réagit **au fait de noter, jamais au contenu** de l'assiette : pas de calories, aucun aliment « bon » ou
  « mauvais ».
- **« Oui » et « Non » font éclater la bulle pareil** : on récompense le fait de noter, pas la réponse.
- **Rien ne fane, rien ne s'accumule** : aucun compteur de jours manqués ni de série perdue ; « Bon retour » après
  une absence ; l'humeur ne redescend jamais dans la journée, son plancher est « Tranquille ».
- **Les bulles sont des boutons 2D** (texte net, lecteur d'écran) ; seuls l'île et Pilou sont en 3D.
- **Pilou tient moins de place à mesure qu'on va vers les chiffres** : héros à l'Accueil, guide discret dans
  Objectifs, petite tête qui dépasse dans Données.
- **La piste à tester est un défi doux** : 5 soirs, pas forcément d'affilée ; un soir manqué n'éteint rien ; bilan
  en mots honnêtes (« plutôt oui », « à confirmer »).

## 6. Identité visuelle de l'app
- **Fond crème** pour l'interface (décision du 14/11). Le rendu choisi ne le remet pas en cause : la lumière dorée
  de la créature vit **dans la scène 3D** (ciel abricot derrière l'île), l'interface autour reste crème. C'est ma
  proposition, à garder sauf avis contraire du propriétaire.
- **Nunito** (OFL, embarquée comme Figtree aujourd'hui) remplace Figtree ; 800–900 pour les titres.
- **Code couleur par thème** : menthe = bien-être, pêche = digestion et nutrition, lilas = activité, bleu nuit =
  sommeil, rose = corps, gris = contexte, et **miel = habitudes** (proposition : fond `#FFF3D1`, texte `#5A4520`,
  étiquette `#7A5200`, rail `#F2D27A` ; contrastes à confirmer par `tokens.test.js` ; distinct de l'ambre de
  l'antenne).
- `app/src/theme/tokens.css` et `journal/DESIGN.md` sont mis à jour dans la même étape que la police.

## 7. Pilou : le rendu retenu
### 7.1 D'où il vient
Quatre esquisses de 10 s ont été rendues le 14/11 : peluche artisanale, **figurine de collection**, **créature de
film d'animation**, miniature photographiée. Le propriétaire a retenu **la figurine, avec les yeux et la lumière de
la créature**. Images et code : kit `rendu/figurine/`, `rendu/creature/` (§ 13). Le chapitre 1
(`planche-personnage.png`, `pilou.js`, `anim.js`) reste la référence de la silhouette, des proportions, de la
palette, des expressions, des ressorts et des règles. **Le rendu toon et le contour brun sont remplacés** : la
matière et la lumière dessinent la forme.

### 7.2 Ce qui ne change pas (planche du chapitre 1)
- Silhouette en galet : corps = 1, largeur 0,87, antenne + 26 %, yeux aux 2/3 de la hauteur, bouche à 56 %, bras
  0,26, pieds plats ×2.
- Palette : corps `#78D8B4`, ventre `#FFF1DC`, pieds `#4FC097`, antenne `#33B989`, point ambre `#FFB84D`, joues
  `#FF8A8A`. **Sous la lumière dorée, le menthe ne doit pas virer au sauge** (défaut vu sur l'esquisse créature) : un
  test de couleur compare la zone éclairée du corps à `#78D8B4` (écart ΔE ≤ 6).
- Les 12 expressions (Tranquille, Content, Rayonnant, Curieux, Surpris, Concentré, Absorbé, Rassasié, Endormi, Fier,
  Réconfortant, Salut), jamais tristes ni déçues.
- Les ressorts (antenne, bras) et la boucle de repos sur 4 couches aux périodes premières (3,6 / 5,3 / 7,7 / 9,1 s),
  hasard à graine (`anim.js`).
- **La montre** au poignet, enfilée à l'onboarding (chapitre 4).

### 7.3 Le corps : vinyle verni peint à la main (de la figurine)
- `MeshPhysicalMaterial` : rugosité ≈ 0,52 modulée par une petite carte de surface, vernis `clearcoat` ≈ 0,72
  (rugosité du vernis ≈ 0,13) avec une très légère « peau d'orange », `sheen` léger (≈ 0,3, retiré au palier
  moyen), métal 0.
- Ventre peint, au **bord légèrement irrégulier** ; joues à l'aérographe (dégradé doux) ; pieds un peu plus mats.
  Peinture faite sur une toile 2D puis projetée sur le corps, comme le visage du chapitre 1 (une toile 1024 au plus
  dans l'app ; 512 au palier moyen).
- Antenne laquée (rugosité ≈ 0,3, vernis 1). **Point ambre en verre qui luit de l'intérieur** : shader dédié
  (cœur clair, bord saturé, lumière qui ressort du côté opposé à la lumière principale) et un petit halo en sprite
  additif. Pas de `transmission` three.js (essayée : bille jaune opaque, une passe de plus). La lueur pulse
  doucement (2 400 ms, planche).
- Montre : boîtier chromé, verre bombé, bracelet émail indigo `#5B5F9E`, petit écran. Proposition : les aiguilles
  (ou l'écran) donnent **l'heure réelle** de l'appareil.

### 7.4 Les yeux (de la créature)
- **Vrais globes 3D**, enfoncés dans le corps aux positions de la planche. **Pas de blanc d'œil** : de grands yeux
  sombres, aucun trait humain.
- **Cornée vernie** (reflets de l'environnement : on y voit le ciel et une fenêtre de lumière) ; **iris peint** sur
  une toile 512 et **lu à travers la cornée par réfraction** (indice ≈ 1,34) : il a de la profondeur et bouge
  légèrement quand la caméra tourne. Iris brun chaud par défaut (dégradé `#6E4A2C` → `#0E0907`, fibres claires,
  collerette dorée) ; c'est plus doux que les yeux presque noirs de la planche, et c'est ce que le propriétaire a
  choisi.
- **Pupille vivante** : elle se **dilate quand Pilou vous regarde** (≈ + 18 % en 550 ms), se contracte vers la
  lumière, respire très légèrement au repos.
- **Paupières de peau** (coques du corps qui glissent) : clignements, yeux qui sourient (paupière basse ≤ 0,32 pour
  ne pas faire de « poches »), petite ombre sous la paupière, liseré humide à la jonction.
- **Le regard suit** : la caméra (« il vous regarde »), un papillon, une bulle qui éclate, le doigt qui le touche.
- Lien avec le double numérique : la **couleur des yeux** de la fiche (§ 9) devient la couleur de l'iris.

### 7.5 La lumière (de la créature)
- **Heure dorée en contre-jour** : soleil bas (élévation ≈ 15°) derrière Pilou, un peu sur le côté, couleur
  `#FFCFA0` ; lumière d'appoint de face `#FFE4D2`, plus faible ; environnement PMREM **généré au démarrage** (ciel
  abricot, sol d'herbe, un nuage clair pour les reflets des yeux), pas d'image HDR téléchargée.
- **Sous-surface simulée** sur la peau, l'antenne et les bras : *wrap lighting* par canal (le rouge déborde, bord
  chaud) et transluminance de contre-jour pondérée par l'épaisseur. Réglée pour que le bas du ventre ne vire pas à
  l'orange.
- **Ciel abricot** avec une brume chaude (`#FFC9A6`) derrière l'île ; quelques poussières lentes dans la lumière.
- Courbe de tonalité **Khronos Neutral** (`THREE.NeutralToneMapping`), qui garde les couleurs de la marque.
- **Le cycle du jour** (étape 13) module cette lumière sans la quitter : matin plus pâle et plus haut, après-midi
  doré, soir plus orangé, nuit bleutée avec le point ambre comme lumière principale. Le contre-jour reste la
  signature.

### 7.6 L'île : un socle de figurine
- Dessus en gazon trapu (touffes, pas des milliers de brins), bourrelet du bord ; **coupe en couches de terre**
  striées en terrasses avec des galets pris dedans ; fleurs en céramique émaillée aux couleurs des thèmes ; galets
  polis ; arbuste émaillé ; cadeaux de la première semaine (§ 4).
- Dans l'app : ≤ 600 touffes instanciées (ou un gazon texturé en relief), fleurs fusionnées, **ombre de contact
  précalculée** (une tache) au lieu de l'ombre portée au palier moyen. La flaque de l'esquisse est facultative ; si
  elle reste, c'est un reflet peint, pas un second rendu.

### 7.7 Animation (rien ne change dans les principes)
- `anim.js` du chapitre 1 fait foi : ressorts (raideur et amortissement de la SPEC du chapitre 1), anticipation,
  étirement-écrasement, chevauchement, arcs ; jamais de courbe linéaire ; hasard à graine.
- S'ajoutent les mouvements des yeux (§ 7.4) et la **lumière qui réagit** : la lueur du point ambre monte d'un cran
  quand une bulle éclate ; la poussière s'écarte quand Pilou saute.
- **Mouvements réduits** (`prefers-reduced-motion` ou le réglage) : plus de sauts, de rotation de caméra ni de
  poussière ; Pilou garde ses expressions, ses clignements et sa respiration très atténuée. Il ne doit jamais avoir
  l'air d'une statuette « éteinte » : les yeux restent vivants.

### 7.8 Ce qui ne passe pas dans l'app (seulement en vidéo)
La profondeur de champ, les rayons de lumière (second rendu de la scène), le halo plein écran (bloom), les 7 700 à
11 000 brins d'herbe, le reflet réel de la flaque, le duvet de la créature, l'anticrénelage 4× à densité 3, le grain.
Remplacements : fond pré-flouté, halo en sprite autour du point ambre, touffes, ombre de contact précalculée.

### 7.9 Budget et paliers de qualité (à mesurer, rien ne l'a été sur un téléphone)
| | Haut | Moyen | Bas |
|---|---|---|---|
| Appareils visés | iPhone 12 et plus récents, Android récents | Android d'entrée de gamme (job Android 9 de la CI) | appareil lent, économie d'énergie |
| Pilou | ≤ 10 000 triangles, physique avec vernis, yeux réfractés | sans `sheen`, une lumière + environnement, visage 512 | image fixe ou séquence WebP pré-rendue par expression |
| Île | ≤ 12 000 triangles, 600 touffes | 300 touffes, ombre précalculée | dans l'image |
| Canevas | ≤ 360 px CSS, densité ≤ 2, 30 i/s | densité 1,5 | — |
| Appels de dessin | ≤ 40 | ≤ 30 | — |

- Le palier se choisit seul : on mesure le temps d'image pendant les 2 premières secondes et on descend d'un palier
  si l'on dépasse 33 ms. Rendu **en pause** hors écran, en arrière-plan et quand l'onglet n'est pas visible.
- Poids ajouté visé : three.js (≈ 150 Ko compressés) + scène ≤ 250 Ko compressés ; textures générées au démarrage ou
  ≤ 300 Ko précalculées.
- Les petits Pilou (tête dans Données, widget, notifications, mosaïque) sont des **images pré-rendues** depuis la
  scène, pas un second canevas.

### 7.10 Critères d'acceptation du rendu
- Captures de l'Accueil (données de démo et historique presque vide) côte à côte avec `rendu/figurine/apercu.jpg` et
  `rendu/creature/apercu.jpg` ; Pilou à ≈ 240 px lisible comme dans les `petit.jpg`.
- Test de couleur du menthe (§ 7.2) ; aucun crénelage visible sur la silhouette ; aucune saccade.
- Mesure du temps d'image sur le job Android 9 et sur le simulateur iPhone, reportée dans le journal avec le palier
  choisi.

## 8. Les règles du personnage (non négociables)
- **Pilou ne culpabilise jamais** : un jour vide, il reste tranquille ; un jour difficile, il est **réconfortant**,
  jamais déçu ; une tâche oubliée ne le rend pas triste.
- **Aucune information ne passe seulement par lui** : il y a toujours un texte (« Pilou est rassasié »), lisible par
  le lecteur d'écran.
- **Mouvements réduits** respectés partout (§ 7.7).
- On parle de **« pistes »**, jamais de « causes » ; ni diagnostic ni traitement.
- Une réponse à chaque geste en moins de 100 ms ; jamais deux fois la même boucle.
- Le nom est choisi par l'utilisateur ; « Pilou » n'est que celui des maquettes.

## 9. Le double numérique (conception complète : `PILOU-DOUBLE.md` et `specs/double.SPEC.md` du kit)
- **Le principe** : Pilou garde son corps menthe, son antenne, ses joues et sa montre, et **porte les traits de
  l'utilisateur** : cheveux (longueur, texture, coiffure, couleur, mèches, volume), sourcils, couleur et forme des
  yeux, lunettes, barbe, taches de rousseur, grain de beauté, boucles d'oreilles, piercing.
- **Deux chemins** : le **Studio Pilou** à la main (Cheveux · Visage · Yeux · Lunettes · Accessoires,
  « Surprenez-moi », « Revenir au Pilou d'origine »), toujours disponible sans photo ; ou **une photo** :
  1. proposition après le nom (« Et si Pilou vous ressemblait ? »), refusable ;
  2. **information affichée avant la caméra** (texte du § 2, point 2, de `PILOU-DOUBLE.md`) et consentement séparé ;
  3. selfie réduit à 512 px, sans métadonnées, **gardé en mémoire seulement**, jamais écrit sur le disque ;
  4. **un envoi** au relais `POST /v1/pilou/style` (Gemini Flash-Lite en Europe, `responseSchema` imposé,
     température 0) ; la photo est effacée dès la réponse (ou 30 s sans réponse) ; rien n'est gardé côté serveur ;
  5. les traits apparaissent un par un sur Pilou ; ce que l'IA juge incertain est marqué « À vérifier » ;
  6. la fiche (≈ 450 octets de JSON) reste **sur le téléphone**, dans l'export ; 3 analyses par mois au plus.
- **Jamais déduit ni stocké** : âge, genre, couleur de peau ou origine, émotions, santé, identité, gabarit
  biométrique. Les **couvre-chefs, dont le foulard**, se choisissent seulement à la main.
- **Combinaisons** : ≈ 10¹³ en théorie (7,9 × 10¹² comptées par `traits.js`), plus d'un million de Pilou
  visuellement distincts (mosaïque de 32 dans le kit).
- **Rendu** : `traits.js` sépare la peinture du visage (sourcils, iris, taches, barbes courtes) et les pièces 3D
  (≤ 2 000 triangles chacune : calotte de cheveux refermée autour de l'antenne, queue, tresses, locks, montures,
  barbe longue, boucles, couvre-chefs percés pour l'antenne). Sur la figurine, les cheveux sont des **pièces de
  vinyle satiné** peintes (comme les cheveux amovibles d'une figurine de collection). Le module se rebranche par un
  « kit » (matière, contour, groupe du corps) : **le rebranchement sur le rendu figurine n'a pas été vérifié**,
  c'est la première chose à faire à l'étape 14.
- **Déclarations à préparer** (l'envoi final reste au propriétaire) : Google Play, Sécurité des données (photos
  traitées de façon éphémère, partage avec un sous-traitant d'IA) ; App Store, étiquettes de confidentialité et
  autorisation explicite du partage avec une IA tierce ; politique de confidentialité ; `PLAY-CONFORMITE.md`.
- **À faire relire** : la représentation des cheveux crépus et des locks, par des personnes concernées (testeurs).

## 10. Étapes, dans l'ordre (un run de code par étape)
1. **Cohérence** : ne plus demander le ventre sans l'objectif digestion ; retirer « sport » et « cycle » de
   l'onboarding (les anciens utilisateurs gardent leurs données) ; sortir Sources de la barre d'onglets vers
   Réglages.
2. **Navigation** : les 4 onglets et l'icône Réglages ; routes actuelles redirigées ; le contenu existant est
   simplement rangé dans les nouveaux onglets.
3. **Ma journée** : la checklist (3 cercles des repas, oui ou non, lignes qui partent, « Plus rien à faire »).
4. **Habitudes** : modèle de données (migration IndexedDB rétrocompatible), saisie, couleur miel, prise en compte
   dans les analyses.
5. **Onboarding** : les 4 temps, et la migration des utilisateurs existants (objectifs déduits de leurs réglages,
   données intactes).
6. **Objectifs** : score et tendance, ce qui l'influence (3 familles), le détail, la piste en défi ; puis les seuils
   **7 jours (bien-être) et 14 jours (digestion)**.
7. **Données et suppression du Journal** : Données s'ouvre sur Tendances, Nutrition en second onglet. Avant de
   supprimer le Journal, **inventaire** de ce qui n'est accessible que par lui (modifier ou supprimer une saisie
   passée, la ligne « Règles · 2e jour », les ajouts rapides…) et une autre maison pour chaque chose (détail du jour
   dans Tendances, « Hier » dans Ma journée, Nutrition pour les repas). Puis suppression de l'écran, de ses routes
   (redirigées vers Tendances) et du code mort, tests compris. **Nunito et les tokens** dans cette étape ou la
   suivante.
8. **Compagnon 1a — la scène** : three.js intégré au build (Android et iPhone), canevas de l'Accueil, île du § 7.6,
   lumière du § 7.5, paliers de qualité et mesure du temps d'image (§ 7.9), pause hors écran, repli image fixe.
   Pilou encore simple (corps et yeux de base).
9. **Compagnon 1b — Pilou** : corps figurine (§ 7.3), yeux de la créature (§ 7.4), antenne et point ambre, montre,
   boucle de repos, réactions au toucher, les 12 expressions, mouvements réduits ; test de couleur ; captures face
   aux aperçus du kit.
10. **Compagnon 2** : les bulles (2D) et leur éclatement, la jauge d'humeur, les fleurs, la barre de la première
    semaine et les cadeaux.
11. **Compagnon 3** : nourrir Pilou (repas), refléter le bien-être, méditer avec lui, la fin de journée.
12. **Compagnon 4** : la rencontre et le nom à l'onboarding (Pilou enfile sa montre), la cérémonie du jour 7, Pilou
    guide discret dans Objectifs, petite tête dans Données.
13. **Compagnon 5** : le cycle du jour sur la lumière dorée (§ 7.5), la météo sur l'île, la croissance au fil des
    semaines, le widget et les notifications (images pré-rendues).
14. **Double numérique a — Studio Pilou à la main** : rebrancher `traits.js` sur le rendu figurine (cheveux en
    vinyle satiné, iris à la couleur choisie), fiche locale, export, « Surprenez-moi », retour au Pilou d'origine.
15. **Double numérique b — la photo** : route du relais (schéma imposé, aucun stockage, plafond 3 par mois),
    information et consentement, capture en mémoire, effacement, « À vérifier » ; déclarations préparées pour le
    propriétaire. Sur iPhone, même parcours.

Les étapes 1 à 7 ne dépendent pas du compagnon et peuvent commencer tout de suite.

**À chaque étape** : textes en français et au vouvoiement, avec des tests ; rien ne sort du téléphone (sauf l'envoi
unique de l'étape 15, déclenché par l'utilisateur) ; captures sur les données de démo et sur un historique presque
vide, côte à côte avec la maquette du kit ; parité iPhone dans le même run (sur iPhone, la lecture du visage se fait
à l'ouverture de l'app) ; une note de Nouveautés par étape visible.

## 11. Risques
- **Poids de la 3D sur les petits téléphones** : les esquisses font 300 000 à 400 000 triangles ; la cible est ≈ 22 000.
  Le palier bas (images pré-rendues) doit exister dès l'étape 8.
- **Le vernis brillant** demande l'environnement PMREM et une passe physique : coûteux sur Mali-G52 ; repli « vinyle
  mat » (matière standard et reflets peints) au palier moyen.
- **Couleurs sous la lumière dorée** : le menthe peut virer au sauge et le ventre à l'orange (test du § 7.2).
- **Une figurine se lit « objet »** : ce sont les yeux, le regard et les ressorts qui la gardent vivante, y compris
  en mouvements réduits.
- **Écart de style** entre une scène 3D riche et une interface plate : les bulles, les cartes et Nunito font le lien ;
  à juger sur captures.
- **Le temps d'écran sur iPhone** (défi « pas d'écran après 22 h ») n'est lisible que dans l'UE avec iOS 26.4 ou
  plus ; en secours, une question le matin.
- **Double numérique** : règles des magasins et RGPD (aucun gabarit biométrique, aucune inférence sensible) ;
  relecture des représentations de cheveux.
- Rien n'a encore été mesuré sur un vrai téléphone.

## 12. Ce que la routine ne fait pas
Elle ne change ni l'éthique (pas de culpabilisation, pas de diagnostic) ni le local-first ; elle ne publie pas en
production, n'envoie aucune déclaration qui engage le propriétaire et n'ajoute aucune dépense ; elle ne recopie aucun
jeu ni personnage existant ; une idée hors de ce brief reste une proposition avec maquette, montrée au propriétaire.

## 13. Le kit de référence (`journal/maquettes/compagnon/`)
- `BRIEF-REFONTE-COMPAGNON.md` (ce brief), `PILOU-DOUBLE.md` (conception du double numérique).
- `specs/` : les 5 `SPEC.md` à coder (personnage, île, journée, comprendre, double) : déclencheurs, durées, courbes,
  haptique, textes, mouvements réduits, budget.
- `personnage/` : `planche-personnage.jpg` (tour, palette, 12 expressions, règles), `pilou.js` et `anim.js` (la
  référence d'animation).
- `rendu/figurine/` et `rendu/creature/` : aperçus, `petit.jpg` (Pilou à 240 px), `NOTES.md`, le code de la scène
  (`figurine.js`, `visage.js` ; `creature.js`, `matiere.js`, `scene.js`), et la vidéo de 10 s en définition réduite.
- `double/` : `traits.js` (avec ses copies de `pilou.js` et `anim.js`, qui ajoutent la montre, les crochets de
  peinture et deux ressorts), `NOTES.md`, la mosaïque de 32 Pilou et des images clés de la vidéo ; sa SPEC est
  `specs/double.SPEC.md`.
- `chapitres/` : les aperçus des 4 approfondissements du 13/11 (Accueil, île, journée, comprendre).
- Le code des maquettes importe three.js r187 ; dans l'app, l'importer depuis le paquet npm `three` (même version).
  Toutes les animations sont des fonctions du temps (`seek(ms)`), donc faciles à tester image par image.
- Les vidéos complètes (2 à 3 min par chapitre, 87 s pour le double) ne sont pas dans git : le propriétaire les a.

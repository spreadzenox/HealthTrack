# Ma journée avec Pilou — spécification des interactions (chapitre 3)

Pour la routine qui code l'app (React + Capacitor, WebView Android et iOS). Toutes les valeurs ci-dessous sont
celles de la vidéo `halcya-compagnon-3-journee.mp4` ; le code de référence est dans `pilou.js` (personnage, poses,
ressorts, éclairage) et `journee.js` (chorégraphies, écrans, durées : objet `K`, fonctions `pose*`).

## 0. Règles communes

**Éthique (non négociable).** Pilou réagit au *geste de noter*, jamais au *contenu* : il ne commente pas ce que vous
mangez (aucun aliment « bon » ou « mauvais », pas de calories dans l'analyse), ne fronce jamais les sourcils, n'a
jamais d'air déçu. « Non » est une vraie réponse : elle fait aussi fleurir l'îlot. Un niveau bas (bien-être,
ventre) le rend **tendre** (il se rapproche, bras ouverts), pas triste. Toute information passe aussi par un
**texte** (lu par VoiceOver / TalkBack) ; le canevas de Pilou est décoratif (`aria-hidden`).

**Courbes nommées** (à déclarer une fois en CSS / JS) :

| Nom | Valeur | Usage |
|---|---|---|
| `sortie` | `cubic-bezier(.5, 0, .75, 0)` | ligne qui glisse hors de la liste |
| `feuille` | `cubic-bezier(.2, .9, .3, 1)` | feuille qui monte (caméra, bien-être, ventre) |
| `vol` | `cubic-bezier(.45, 0, .2, 1)` + arc parabolique | assiette qui vole jusqu'à Pilou |
| `io` | `cubic-bezier(.65, 0, .35, 1)` (easeInOutCubic) | transitions, fermeture de feuille |
| `out` | `cubic-bezier(.33, 1, .68, 1)` (easeOutCubic) | apparitions |
| `in` | `cubic-bezier(.32, 0, .67, 0)` (easeInCubic) | disparitions, « croc » |
| `doux` | `cubic-bezier(.37, 0, .63, 1)` (easeInOutSine) | respiration, paupières, lumière |
| `rebond` | `cubic-bezier(.34, 1.56, .64, 1)` (back 1,7) | pastilles, vignettes, textes « Bravo » |

**Ressorts** (masse 1 ; en JS, ou en CSS via `linear()` échantillonné) :

| Nom | Raideur / amortissement | Effet |
|---|---|---|
| `liste` | 300 / 26 (ζ ≈ 0,75) | la liste se resserre, dépassement ≈ 2 à 3 px |
| `bouchée` | 420 / 16 (ζ ≈ 0,39) | Pilou revient de son « croc » avec un rebond |
| `curseur` | 260 / 22 | le curseur rejoint un niveau proposé |
| `notification` | 220 / 20 | bandeau de notification (côté système) |
| `antenne` | 3,1 Hz, ζ = 0,22 (≈ 379 / 8,6) | antenne qui suit le corps, avec retard |

**Procédural vs images clés.** Procédural (calculé à chaque image) : respiration (période 3,3 s, ±1,2 à 2,6 %
d'écrasement selon l'humeur), balancement (8,2 s et 11,9 s), flottement de l'îlot (6,9 s), clignements (instants
irréguliers 2,4 à 5,2 s, 170 ms : fermeture 60 ms `out`, ouverture 110 ms `doux`), mastication, regard (suit
l'assiette, le doigt), antenne (ressort piloté par l'accélération du haut du corps et par sa propre cible). Images
clés : les poses (repérage, bouchée, joues pleines, tapes, rassasié, méditation, haussement, bouillotte, fête,
sommeil). Une chorégraphie = une fonction pure du temps écoulé depuis son déclencheur ; dans l'app, un petit
« lecteur » la joue, **interruptible** : un toucher saute à la pose de fin en 200 ms (`io`). La saisie est
enregistrée *avant* l'animation ; l'animation n'est jamais bloquante.

**Retour haptique** (Capacitor `@capacitor/haptics`) : `tac léger` = `impact({ style: Light })` (boutons, toucher
d'un cercle) ; `tac moyen` = `impact({ style: Medium })` (déclencheur photo) ; `succès` =
`notification({ type: Success })` (saisie validée, Bravo, fin de journée) ; `sélection` = `selectionChanged()`
(chaque cran de l'échelle). Jamais plus d'un `succès` par saisie. Suit le réglage du système + interrupteur
« Retours haptiques » dans Réglages.

**Mouvements réduits.** Actif si `prefers-reduced-motion: reduce` (réglage du téléphone) ou si Réglages ›
Accessibilité › « Mouvements réduits » est sur Activé (choix : Automatique / Activé / Désactivé). Alors : aucun
déplacement, rotation ni changement d'échelle > 2 % ; tout devient **fondu ≤ 200 ms** (`io`). Pilou garde ses
**expressions** (yeux, bouche, joues, lueur de l'antenne : fondu 150 ms) mais ne saute, ne flotte, ne tourne plus ;
pas de vol d'assiette, pas de bulle qui vole, pas de confettis (remplacés par un halo fixe). Textes, compteurs,
haptique : identiques.

## 1. L'écran Ma journée

- **En-tête** : « Jeudi · jour 3 » / « Ma journée » / roue des Réglages.
- **Bannière de Pilou** (16 px des bords, haut 106, hauteur 80) : Pilou dans un hublot rond de 66 px (ciel
  abricot ; mauve-pêche après 19 h), sa phrase (15,5 px, 900, deux lignes au plus) et « Encore N choses
  aujourd'hui » avec une pastille par tâche (pleine = à faire, vide = faite). Pilou y vit en continu : respiration,
  clignements, **il regarde la ligne qu'on touche** (regard = position du doigt, pondéré 0,8), et il répond à
  chaque saisie (§ 2 à 7).
- **Lignes** (une couleur par thème) : Repas (pêche, 136 px, trois cercles Matin / Midi / Soir), Bien-être (menthe,
  68 px, bouton « Noter »), Méditation (lilas, 104 px, Oui / Non), Lecture (bleu nuit, 104 px, Oui / Non), Votre
  ventre ce soir (pêche, 68 px ; grisé à 85 % et « À partir de 19 h » avant 19 h, puis « Noter »). Écart 10 px.
- **« Déjà noté (n) ⌄ »** sous la dernière ligne : ouvre la liste des saisies du jour pour les modifier.
- **Toast « Annuler »** (5 s) après chaque saisie, au-dessus de la barre d'onglets.
- **Ouverture** depuis le widget ou une notification : l'écran se déploie depuis la forme d'origine
  (`clip-path: inset(...)`), 500 ms `io`. Réduit : fondu 200 ms.

## 2. Une ligne qui part (Oui, une note validée, Repas 3 sur 3)

| Étape | Début | Durée | Courbe | Détail |
|---|---|---|---|---|
| Bouton enfoncé | 0 | 60 + 170 ms | — | translateY 3 px, ombre réduite ; haptique selon la ligne |
| Confirmation | +300 ms | 150 ms | fondu | « ✓ Fait ! » / « ✓ Plutôt bien · noté » sur la ligne (temps de pose ≥ 300 ms) |
| Anticipation | L | 120 ms | `out` | recul de 8 px vers la gauche |
| Glissé | L + 120 | 400 ms | `sortie` | +438 px, rotation 0 → 3°, opacité 1 → 0 sur les 220 dernières ms |
| Repli et resserrage | L + 260 | ≈ 600 ms | ressort `liste` | la hauteur se ferme ; les lignes du dessous montent avec 28 ms de décalage par rang (chevauchement), léger rebond |
| Bulle | L + 120 | 520 ms | `io`, arc de Bézier | bulle de 34 px aux couleurs de la ligne, de la ligne au hublot de Pilou, échelle 1 → 0,6 |
| Pilou attrape | L + 640 | 700 ms | — | petit saut (0,08), yeux rieurs, bras levés à 80 %, 6 étincelles autour du hublot |
| Toast « Annuler » | L + 750 | 5 s | `out` 260 ms / `in` 220 ms | « Bien-être noté : plutôt bien · Annuler » |

**Réduit** : la ligne s'efface (200 ms), la liste se referme (200 ms `io`, sans rebond), pas de bulle ; Pilou passe
aux yeux rieurs (fondu 150 ms). **Lecteur d'écran** : « Méditation : fait. Encore 3 choses aujourd'hui. »

## 3. Repas = nourrir Pilou

**3.1 Toucher un cercle → viseur.** Cercle enfoncé (échelle 0,9) + `tac léger`. La feuille caméra monte (844 →
0 px, 420 ms `feuille`). Titre « Petit-déjeuner / Déjeuner / Dîner », coins du viseur, aide « Cadrez votre
assiette ».

- **Pilou curieux** : s'il reste du temps de cadrage (≥ 1,4 s sans déclencher), Pilou glisse dans le **coin
  inférieur droit** du viseur (650 ms, `rebond` 1,3), penché de 17°, on ne voit qu'une moitié de visage et **un
  œil curieux** tourné vers l'assiette (yeux 108 %, petite bouche ronde) ; il occupe au plus 15 % du cadre et ne
  couvre jamais l'assiette. Au flash, il plisse les yeux (420 ms). Rendu sur un canevas transparent superposé au
  flux caméra.
- **Déclencheur** : `tac moyen`, flash blanc 90 % → 0 en 280 ms, la photo se fige (échelle 1,05 → 1, 320 ms
  `out`).
- **Analyse** (durée réelle, au moins 800 ms pour qu'on la lise ; au-delà de 4 s : « Encore un instant… ») :
  voile 28 %, reflet qui balaie la photo (1,3 s, en boucle, `doux`), texte « Pilou regarde votre assiette… ».
  **Pilou renifle** : il se penche (−0,14), yeux fermés, 4 reniflements toutes les 350 ms (150 ms chacun : petit
  coup de tête, étirement de 3 %), deux traits de reniflement, trois volutes d'arôme qui montent de l'assiette
  (1,6 s, en boucle).
- **Résultat** : pastilles d'aliments (sans calories ni jugement) qui apparaissent une à une (décalage 70 ms,
  échelle 0 → 1 en 320 ms `rebond`), lien « Modifier », boutons « Reprendre » / « Valider » (fondu 200 ms). Pilou,
  satisfait, ferme les yeux en souriant (« mmm »).
- **Valider** : `tac léger` ; Pilou quitte le coin (400 ms `io`) : il file à table. La feuille caméra cède la place
  à la feuille « repas » (fondu 300 ms).

**3.2 Les trois chorégraphies** (temps depuis le départ de l'assiette ; la variante suit le **cercle** touché, pas
l'heure). Pour qu'elles ne se répètent jamais à l'identique, deux détails varient chaque jour (graine = date) :
l'ordre des aliments mangés et ±1 mastication.

**Midi · le festin (5,6 s)** — la plus détaillée :

| Phase | Temps | Pilou | Assiette / effets |
|---|---|---|---|
| Il voit l'assiette | −300 → 0 | yeux 112 %, regard qui la suit, antenne qui se dresse, bouche ronde | — |
| Elle arrive en arc | 0 → 700 | s'écrase de 10 % (anticipation), bras prêts, bouche qui s'ouvre (300 → 700) | vol 700 ms `vol`, arc de 0,55 unité (≈ 120 px), rotation −40° → 0, pose avec un rebond de 260 ms |
| Trois bouchées | 800, 1 450, 2 100 | chaque bouchée (650 ms) : ouverture 180 ms `out` (recul −0,08, étirement 8 %, langue) ; **croc** 80 ms `in` (penché +0,15, écrasement 12 %) ; retour au ressort `bouchée` ; une mastication | un aliment disparaît à +220 ms ; 9 à 10 miettes (650 ms, gravité) ; joues : 1/3 → 2/3 → pleines |
| Il mâche, joues pleines | 2 750 → 3 850 | cycles de 275 ms : bouche décalée à gauche puis à droite, joue gauche puis droite, écrasement 3 %, yeux fermés de plaisir | assiette vide : elle tourne, rétrécit et s'efface (2 380 → 2 800), 6 étincelles ; quelques miettes |
| Glouc | 3 850 → 4 100 | joues qui se vident en 150 ms `in`, écrasement 10 % puis étirement 6 %, yeux grands ouverts | l'antenne rebondit (ressort) |
| Petites tapes | 4 100 → 4 950 | mains sur le ventre (200 ms `io`), deux tapes (4 400, 4 650 ; 180 ms), yeux rieurs, joues roses avec traits de joie | — |
| Rassasié | 4 950 → 5 600 | saut de 0,14 (400 ms), bras levés qui ondulent, lueur de l'antenne au maximum | 7 étincelles ; **« Bravo, Pilou est rassasié »** + `succès` |

**Matin · il se réveille en mangeant (4,4 s)** : encore ensommeillé (paupières à 52 %, coins tombants, antenne
basse −0,38 rad, léger roulis) ; le bol arrive (650 ms) ; deux reniflements (780, 940 ms) ; une bouchée lente
(1 150 → 1 400) ; **réveil à 1 700 ms** : les yeux s'ouvrent en **90 ms**, grandissent à 120 % puis reviennent à
103 % (500 ms `doux`), l'antenne passe de −0,38 à +0,22 rad et oscille (ressort), petit saut de 0,07 ; trois traits
« réveil » autour de la tête ; quatre petites bouchées rapides (toutes les 280 ms : 60 ms ouverture, 60 ms
fermeture) ; le bol s'en va (3 100 → 3 500) ; étirement bras en l'air (3 150 → 4 250). Texte : « Bravo, Pilou est
rassasié… et bien réveillé ! »

**Soir · il savoure (5,3 s)** : lumière du soir ; l'assiette glisse lentement (950 ms `doux`, arc bas 0,32) ; deux
bouchées lentes (900 et 2 500 ms ; 250 ms ouverture, 200 ms fermeture) ; il savoure **les yeux fermés** (mastication
lente de 420 ms, bouche ondulée « mmm », balancement ±0,07 rad sur 1,5 s) ; l'assiette s'efface sans tourner (3 600
→ 4 100) ; soupir (bouche ronde 3 800 → 4 300) et **main qui frotte le ventre** en cercle (600 ms par tour) ; petit
bâillement (4 400 → 5 200). Texte : « Bravo, Pilou a bien dîné ».

**3.3 Retour dans la liste.** « Bravo » : échelle 0,7 → 1 (420 ms `rebond`) + fondu 200 ms ; pastille « Repas · 2
sur 3 » (+350 ms, 12 px → 0, 300 ms `out`). La feuille redescend (450 ms `io`). Le cercle se remplit : anneau 0 →
100 % (500 ms `io`, depuis midi), pointillés qui s'effacent, vignette de la photo (+250 ms, `rebond` 350 ms), coche
(+450 ms, 300 ms) ; le compteur **roule** (+300 ms : l'ancien chiffre monte et s'efface, le nouveau arrive du bas,
300 ms `out` ; pastille 1 → 1,12 → 1). Pilou, dans la bannière : petite joie + « Merci, c'était délicieux ! ». À 3
sur 3, les trois vignettes sautillent l'une après l'autre (220 ms, décalage 90 ms), puis la ligne part (§ 2).

**Réduit** : pas de vol ni de mastication animée ; l'assiette apparaît près de Pilou (fondu 200 ms), les aliments
disparaissent en trois fondus, l'expression de Pilou passe à « rassasié » (fondu 150 ms) ; mêmes textes, même
haptique.

## 4. Bien-être : l'échelle et le miroir

- « Noter » (`tac léger`) → feuille (haut 64 px, 450 ms `feuille`, voile 38 %). Titre « Comment vous
  sentez-vous ? », Pilou sur son îlot (330 × 236), le mot du niveau (28 px, menthe foncé), sa phrase, l'échelle.
- **Échelle à 5 crans** (318 px) : *Difficile · Bof · Correct · Plutôt bien · Très bien*. Le curseur suit le doigt
  **1:1** (aucun lissage), grossit à 112 % pendant l'appui ; au relâcher, il rejoint le cran le plus proche
  (ressort `curseur`). `sélection` à chaque changement de cran.
- **Le miroir, en direct** : la pose de Pilou est un mélange continu des 5 poses clés selon la position du doigt
  (`doux` entre deux crans). Pour le chevauchement : visage immédiat, corps avec 70 ms de retard, bras avec
  130 ms, antenne au ressort.

| Cran | Pilou | Sa phrase |
|---|---|---|
| Très bien | bras en l'air qui ondulent, petits sauts (période 0,75 s), yeux rieurs, langue, lueur 100 % | « Super ! Ça se fête. » |
| Plutôt bien | bras entrouverts, yeux à demi rieurs, léger rebond | « Ça me fait plaisir. » |
| Correct | pose calme, petit sourire | « D'accord, merci. » |
| Bof | paupières à 30 % (coins extérieurs tombants : fatigué, pas blasé), bouche douce, antenne basse | « Merci de me le dire. » |
| Difficile | **tendre** : il se penche vers vous, bras ouverts, regard doux, petit sourire, antenne basse | « Journée difficile ? Je reste près de vous. » |

- « Valider » : `succès`, la feuille redescend (420 ms `io`), la ligne part (§ 2) avec « ✓ Plutôt bien · noté ».
- **Réduit** : le curseur saute de cran en cran (fondu des libellés) ; Pilou change d'expression (fondu 150 ms), sans
  saut ni bras.

## 5. Bien-être : la lecture du visage

- « Lecture du visage » (`tac léger`) → caméra frontale en plein écran (fondu + échelle 0,96 → 1, 380 ms `out`).
  Ovale de cadrage en pointillés ; Pilou dans un hublot de 86 px en haut à droite.
- **Pendant la lecture (≈ 3 s)** : l'anneau de progression fait le tour de l'ovale (`io`) ; quelques points de
  repère menthe apparaissent sur le visage. **Pilou vous regarde** : regard droit vers vous, yeux 107 %, tête qui
  s'incline doucement (±0,07 rad), antenne qui frémit (≈ 4 Hz, faible) et perle qui pulse (1,1 s). Textes :
  « Pilou vous regarde… » / « Gardez le visage détendu, 3 secondes. »
- **Fin** : `tac léger`, l'anneau passe au menthe, Pilou sourit et hoche la tête (300 ms). Carte de résultat
  (400 ms `rebond`) : **« Vous avez l'air plutôt bien aujourd'hui. »** / « Je mets « Plutôt bien » ? Vous pouvez
  ajuster. » Boutons « Oui, c'est ça » / « Ajuster ». Mention permanente : « Une estimation, pas un diagnostic. »
- La lecture **propose**, elle ne décide pas : « Oui » ramène à l'échelle, dont le curseur rejoint le niveau proposé
  (ressort `curseur`) ; on valide ou on ajuste. Formulations : décrire sans juger, toujours une question (« Je mets
  « Bof » ? »), formes neutres en genre (« Vous avez l'air un peu fatigué·e » est à éviter : « La journée a l'air
  un peu lourde. Je mets « Bof » ? »).
- **Réduit** : l'anneau se remplit toujours (c'est une information), sans points animés ; Pilou immobile, attentif.

## 6. Habitudes (Oui / Non)

**Oui (Méditation)** — `succès`. « ✓ Fait ! Pilou médite avec vous ». **Pilou médite un instant (4,4 s,
interruptible)** : yeux qui se ferment (500 ms `doux`), il s'élève de 0,17 unité (900 ms `io`), flotte (±0,022,
période 2,6 s), bras posés vers l'extérieur, respiration lente (4 s) ; **trois ondes lilas** concentriques autour de
lui (1,5 s chacune, décalées de 500 ms, rayon 0,62 → 1,25 `out`, opacité en cloche) et quelques points de lumière
lilas qui montent ; il redescend (3 500 → 4 100) et se pose avec un écrasement de 7 %. La ligne part pendant qu'il
médite (à +2,9 s). Bannière : « Respirez avec moi… » puis « Merci pour ce moment calme. » Pour une autre habitude :
petite joie générique (§ 2).

**Non (Lecture)** — `tac léger`. La question devient **« Pas grave, à demain ! »** (fondu 200 ms), le bouton Non se
teinte. **Haussement d'épaules, gentiment (1,3 s)** : bras ouverts à 1,12 rad (260 ms `rebond`), épaules qui
montent (étirement 5 %), tête penchée de 0,14 rad, yeux doux, sourire en coin ; pose de 640 ms ; retour 400 ms
`io`. La ligne **se replie** sans bruit (pas de glissé, pas de bulle : hauteur → 0, 380 ms `io`) à +2 s ; la fleur
bleu nuit pousse quand même sur l'îlot. Toast « Lecture : non · Annuler ».

**Réduit** : méditation = yeux fermés + halo lilas fixe (fondu 200 ms), sans lévitation ni ondes ; haussement =
expression seule.

## 7. Votre ventre, le soir

- Ligne active à partir de 19 h (seulement si l'objectif « confort digestif » est choisi). Feuille aux couleurs du
  soir (dégradé crépuscule, étoiles, halo de lampe qui vacille ±15 % sur 2,4 s), 480 ms `feuille`.
- **Pilou et sa bouillotte** (housse tricotée pêche, bouchon ambre) : il la serre dans ses bras (les épaules glissent
  vers l'avant), yeux rieurs mi-clos, respiration lente (4,2 s), lanterne allumée.
- **Une note en un geste** : « Comment va votre ventre, ce soir ? » — cinq galets *Douloureux · Inconfort · Moyen
  · Plutôt bien · Très bien*. Toucher un galet **enregistre** (pas de « Valider ») : galet choisi `rebond` 380 ms,
  les autres à 55 % ; `succès` ; « Plutôt bien · noté. Merci, bonne soirée Léa. » ; Pilou se blottit contre sa
  bouillotte (écrasement 7 % en 300 ms, yeux fermés de bien-être, joues roses) et soupire (bouche ronde). La
  feuille se referme seule après 2,4 s ; « Annuler » reste 5 s.
- Une note basse ne change pas son attitude : il garde sa bouillotte et dit « Merci de me l'avoir dit. Reposez-vous
  bien. »
- **Réduit** : mêmes textes, sans écrasement ; feuille en fondu.

## 8. « Plus rien à faire »

- Déclencheur : la dernière ligne part. +400 ms : la bannière s'efface (450 ms), la carte de fin apparaît (fondu +
  échelle 0,94 → 1, 400 ms `rebond`).
- **Fête, une seule, sobre** : Pilou s'accroupit (160 ms) puis fait deux sauts (0,2 puis 0,16 ; 400 ms ; écrasement
  9 % à l'atterrissage), bras levés qui ondulent, lueur maximale ; **les bulles finales** (une par tâche, aux
  couleurs des thèmes) tournent autour de lui puis éclatent en chaîne (à +700 ms puis toutes les 160 ms ; 260 ms,
  échelle 1 → 1,35 + fondu, étincelles) ; 18 confettis (24 en grand) tombent 2,2 s. « Plus rien à faire, bravo ! »
  (`rebond`) ; « Tout est noté pour aujourd'hui. Pilou garde vos bulles jusqu'à demain. » Un seul `succès`.
- **Le calme du soir** (si l'heure ≥ 21 h, sinon il reste content) : la lumière baisse en 2 s, la lanterne
  s'allume, Pilou bâille (+600 → 1 600 ms), ses yeux se ferment (1,3 s), « z » qui montent (2,4 s, en boucle) ;
  « À demain, Léa. » / « Pilou dort sur son îlot. Bonne nuit. »
- **Réduit** : pas de sauts ni de confettis ; les bulles s'effacent une à une ; halo fixe 3 s.

## 9. En dehors de l'app

- **Widget** (iOS WidgetKit, Android App Widget : code natif, hors WebView) : image fixe de Pilou sur son îlot (pas
  d'animation : le système ne le permet pas, et c'est reposant), « Encore N choses », les bulles qui restent,
  « Jeudi · jour 3 ». Mis à jour après chaque saisie (`WidgetCenter.reloadAllTimelines()` / `updateAppWidget`), à
  19 h et à minuit. Six poses pré-rendues (dort, se réveille, content, rassasié, soir, fête), exportées depuis
  `pilou.js` en PNG. Toucher → `halcya://journee` (ouverture « déployée » § 1).
- **Notification de repas** (Local Notifications) : une par repas, à l'heure choisie, **seulement si le repas n'est
  pas noté** ; ignorée, elle ne revient pas ; jamais pendant les heures calmes. Textes : « Pilou garde une place pour
  votre déjeuner » / « Une photo de votre assiette, et c'est noté. » (petit-déjeuner, dîner : même forme). Vignette :
  Pilou content. Option (désactivée par défaut) : « Comment va votre ventre ce soir ? Un geste suffit. » à 20 h 30.
- **Haptique** : voir § 0. Dans la vidéo, chaque retour est noté à côté du téléphone (« tac léger », « succès »…).

## 10. Cas limites

- **Journée oubliée** : à la première ouverture après une journée vide, Pilou salue (bras qui fait coucou 1,6 s,
  petit saut), « Bon retour, Léa ! Content de vous voir. » Aucune série, aucun compteur perdu, aucun ton déçu.
- **Saisie après coup** : carte « Hier, vendredi » en tête de liste : « Deux questions, si vous voulez. » → les
  habitudes d'hier en Oui / Non (« ✓ Oui », « Pas grave ») ; « Aucune série perdue. » · « Passer ». Pilou hoche la
  tête à chaque réponse (220 ms). La carte se replie (380 ms) et la liste se resserre (ressort `liste`). Après deux
  jours ou plus d'absence : pas de rattrapage, seulement « Bon retour ! On repart d'aujourd'hui. »
- **Annuler** — *Pilou ne recrache rien : il rembobine.* Toast « … · Annuler » pendant 5 s ; ensuite, depuis « Déjà
  noté (n) ». Au toucher (`tac léger`) : l'espace de la ligne se rouvre (ressort `liste`), la ligne se déplie
  (`rebond` 380 ms) et revient à sa question ; Pilou fait **un tour sur lui-même à l'envers** (600 ms `io`, bras
  écartés), un tourbillon lilas ↺ l'entoure (760 ms), puis deux signes de tête (220 ms) : « Pas de souci, c'est
  annulé. » La fleur correspondante se referme (400 ms). Pour un repas : la vignette quitte le cercle (220 ms),
  l'anneau se déroule (300 ms), le compteur redescend. **Réduit** : pas de tour ; un ↺ fixe apparaît en fondu.
- **Hors ligne** : la saisie est gardée et confirmée tout pareil ; l'analyse de photo affiche « Pilou regardera votre
  assiette dès que possible » (non montré).

## 11. Budget de performance (Android d'entrée de gamme)

- **Un seul contexte WebGL** (three.js), un seul Pilou visible à la fois dans l'app (bannière *ou* feuille). Cible
  **≤ 25 000 triangles** contours compris (la vidéo en utilise ≈ 70 000 : corps 48 × 64 au lieu de 72 × 96, îlot 64
  segments, fleurs simplifiées, contour en coque inversée seulement sur corps, bras, antenne, îlot).
- **Taille du canevas** : bannière 66 px CSS × DPR ≤ 2 (132 px) ; feuilles 330 × 236 px CSS × DPR plafonné à 2
  (1,5 sur appareil lent). Antialias : MSAA du WebGL (`antialias: true`) ; sinon rendu à 1,5× puis réduction.
- **Images par seconde** : 60 i/s visées sur un milieu de gamme, **30 i/s garanties** sur un Android d'entrée de
  gamme (GPU type Mali-G52) ; au repos (respiration, clignements), rendu à 30 i/s puis **à la demande** après 10 s
  sans interaction ; arrêt complet hors écran (`IntersectionObserver`, `visibilitychange`).
- **Visage** : la texture peinte (768 × 512 dans la vidéo) passe à 384 × 256 et n'est redessinée que si
  l'expression change (clé de cache). Antenne : géométrie reconstruite seulement si l'angle varie de plus de 0,005.
  Ressort de l'antenne : simulé en continu (état), pas ré-simulé à chaque image comme dans la vidéo.
- **Repli** : si WebGL est absent, perd son contexte (`webglcontextlost`) ou si une image dépasse 40 ms pendant 2 s,
  bascule sur des **poses pré-rendues** (≈ 24 poses × 2 tailles en WebP, ≈ 600 Ko) animées en CSS (mêmes
  courbes) ; les mêmes images servent au widget et aux notifications.
- Mémoire : < 20 Mo de textures ; aucun son.

## 12. Risques

- **WebView Android lente** sur entrée de gamme (pilotes WebGL, perte de contexte) → repli images, mesurer tôt.
- **Widget** et **notifications riches** : code natif dans les projets Xcode / Android Studio (hors React).
- **Trop d'animation** fatigue : chaque chorégraphie est interruptible, la fête n'a lieu qu'une fois par jour, le
  soir l'app se calme ; « Mouvements réduits » doit être testé comme un mode à part entière.
- **Lecture du visage** : formulations à relire avec soin (jamais de verdict, toujours une question) ; ne jamais
  stocker l'image sans le dire (règle produit à confirmer).
- **Expressions ambiguës** : une paupière plate lit comme « blasé », un reflet dans un œil rieur comme une larme ; les
  réglages retenus (paupière en arc, coins tombants, reflets effacés quand l'œil sourit) sont dans `pilou.js`
  (`drawEye`) : à garder si on refait les yeux.
- **Repas en retard** (petit-déjeuner noté à midi) : la variante suit le cercle, pas l'heure.
- **Lecteurs d'écran** : annoncer les textes, pas les animations ; respecter l'ordre de lecture pendant les feuilles.

# Compagnon · chapitre 4 — « Faire connaissance, puis comprendre » · SPEC

Spécification de la rencontre, de l'onboarding, de la cérémonie du jour 7, du jour 14, d'Objectifs, du défi de
5 soirs et de Données, pour l'app réelle (React + Capacitor, WebView Android et iOS). Tout ce qui est décrit est
visible dans `halcya-compagnon-4-comprendre.mp4` et codé dans `prototype.html` + `pilou.js` (les durées et courbes
ci-dessous sont celles du code). Décisions du propriétaire du 13/11 au soir intégrées : **bien-être analysé dès
7 jours, digestion dès 14 jours** ; **pas de Journal jour par jour** (Données = Tendances puis Nutrition) ;
**Nunito** pour toute l'app.

## 0. Règles communes

- **Pilou** : galet menthe, ventre crème, joues rosées, contour brun chaud `#4A332B`, antenne = courbe montante du
  logo terminée par le point ambre `#FFB84D`. Le nom vient de l'utilisateur (`{nom}` dans les textes ci-dessous).
- **Éthique** : Pilou ne culpabilise jamais (un oubli, un soir manqué, une note basse ne le rendent pas triste) ;
  chaque information existe **en texte** (Pilou n'est jamais le seul porteur d'un sens) ; on dit « piste », jamais
  « cause » ; « une estimation, pas un diagnostic ».
- **Place de Pilou par écran** : héros (rencontre, onboarding, cérémonie, défi) → guide discret dans un coin
  (Objectifs : 84 px dans l'en-tête, 80 px près du bouton « Je teste ») → presque absent (Données : 64 px, la tête
  derrière le bord d'une carte, aucun saut, aucune bulle).
- **Bulles de parole** : fond blanc, rayon 20 px, queue latérale (losange 18 px), Nunito 900 15–17 px. Entrée :
  opacité 0 → 1 en 125 ms + échelle 0,6 → 1 en 200 ms `cubic-bezier(.34,1.56,.64,1)` depuis la queue ; sortie :
  fondu 200–300 ms. Une bulle reste au moins 2,5 s (≈ 15 mots par 4 s). Jamais plus de 2 lignes, sauf
  l'avertissement de l'onboarding (4 lignes, affiché 5 s).
- **Toutes les animations sont des fonctions du temps** (rien ne dépend de la fréquence d'images) ; le hasard
  (miettes, confettis, clignements) est graine.

### Courbes de référence

| Nom dans le code | Usage | CSS |
|---|---|---|
| `eio` (cubique) | déplacements, transitions d'écran, tracés de courbes | `cubic-bezier(.65,0,.35,1)` |
| `eout` (cubique) | entrées, ralentissement à l'arrivée | `cubic-bezier(.33,1,.68,1)` |
| `ein` (cubique) | anticipation, départ | `cubic-bezier(.32,0,.67,0)` |
| `ein2` (quadratique) | chute (gravité) | `cubic-bezier(.11,0,.5,0)` |
| `back` | pops (bulles, badges, galets, fleurs) | `cubic-bezier(.34,1.56,.64,1)` |
| `hop` = 4u(1−u) | aller-retour (tapes, hochements) | deux demi-courbes `eout` / `ein` |

### Ressorts (masse 1 ; formule fermée, voir `springStep` / `springImp` dans `prototype.html`)

| Ressort | Raideur | Amortissement | ζ | Usage |
|---|---|---|---|---|
| Corps | 260 | 14 | 0,43 | amorti après chaque atterrissage (écrasé → 1), stable à 2 % en ≈ 600 ms |
| Antenne | 140 | 6 | 0,25 | chevauchement : l'antenne plie au décollage (−0,35 à −0,6 rad) et à l'atterrissage, oscille à 1,9 Hz, s'éteint en ≈ 1,2 s |
| Galets | 300 | 18 | 0,52 | impact d'un galet (écrasé à 82 %) |

### Saut générique (`jumpAt`)
Anticipation 70–120 ms (`eio`, écrasé à 88 %) → vol 260–400 ms (parabole, étiré à 112 % au départ, 105 % à
l'arrivée) → impact 90 ms (`eout`, écrasé à 84 %) → ressort corps. L'antenne reçoit deux impulsions (décollage,
atterrissage). Hauteur : 0,1 (petit pas) à 0,42 (joie) en unités Pilou (Pilou mesure 1,24).

### Repos (toujours actif sauf « Mouvements réduits »)
Respiration : écrasement ±1,4 % (sin, période 3,27 s) ; balancement : roulis ±0,022 rad (8,2 s) ; antenne : torsion
±0,05 rad (10,7 s) ; clignement toutes les 3,1 à 4,4 s (graine), paupière qui descend en 70 ms et remonte en 120 ms ;
îlot qui flotte ±0,045 (6,9 s).

## 1. Pilou en 3D (`pilou.js`)

- Même silhouette, mêmes proportions, mêmes couleurs que la direction 2 ; affinés : géométrie plus lisse (corps
  65 × 81), contour « coque inversée » d'**épaisseur constante à l'écran** (2,8–3,4 px en gros plan, 1,2 px pour
  les mini-Pilou), lumière de contour douce (`#FFF3DF`, 0,42 × lissage 0,58–0,97), **paupières** (hémisphère menthe
  qui descend ; œil fermé = trait `‿`), **regard** (yeux décalés de ±0,035 / ±0,03), bouches : sourire (taille
  0,3–1,25), « o » (surprise), « D » (rire), parole ; joues `#FF8A8A` opacité 0,55–0,95.
- **Paramètres de pose** (un objet par image) : `x, z, turn, scale, hop, emerge, clipY, sq` (écrasement à volume
  constant), `leanX/leanZ/twist`, `armL/armR {x, z, pv, py}` (rotations + glissement de l'épaule vers l'avant le
  long du corps : `pv` 0 = côté, 1 = devant ; `py` 0 = ventre, 1 = cœur), `eyeOpen, happy, gazeX/Y`, `smile, mouthO,
  mouthD`, `bendZ/bendX/antTwist` (antenne), `glow` (perle), `watch` (+ `watchFly`, `watchLit`), `phone` (+
  `phoneTo`), `scarf`.
- **Accessoires de ce chapitre** : montre (bracelet lilas foncé, cadran qui s'allume en menthe `#7FF0C4`), petit
  téléphone (écran `#A8D0FF` + halo bleu + lumière ponctuelle bleutée sur le visage, de nuit), tiroir (commode bois,
  tiroir coulissant 0,2), 5 lanternes du défi (halo additif), 3 galets des familles (bleu nuit `#5D78D6`, pêche
  `#FF9C66`, lilas `#9D8BF7`, rayons 0,34 / 0,245 / 0,16), grand arc-en-ciel 4 bandes (pêche, menthe, lilas,
  bleu nuit), motte de terre, trou, 22 miettes, 7 bouffées de poussière.

## 2. La rencontre (premier lancement, une seule fois)

Écran plein : l'îlot vide (3 pousses fermées), ciel abricot. Puis la carte « Comment voulez-vous l'appeler ? »
monte par-dessus. **Un toucher n'importe où passe la séquence** (on saute à l'état final : Pilou debout, yeux
ouverts, en fondu de 300 ms).

| t (ms) | Ce qui se passe | Courbe / réglage | Procédural ou clé |
|---|---|---|---|
| 0–700 | une motte de terre gonfle (hauteur 0 → 0,15), le sol tremble | `eout` ; tremblement ±6 % (périodes 23/37/41 ms) | procédural |
| 700–1500 | **l'antenne sort d'abord, comme une pousse** ; elle se balance | montée `eout`, pousse 30 % → 100 % ; balancement ±0,18 rad | clé + procédural |
| 1250–1600 | la perle ambre « fleurit » + 8 étincelles | `back` ; lueur 1 → 0,3 | clé |
| 1500–2000 | l'antenne regarde à gauche, à droite (temps de pose) | torsion ±0,9 rad | clé |
| 1900–2120 | **anticipation** : il se tasse sous terre | `ein`, écrasé à 90 %, la motte gonfle de 25 % | clé |
| 2120–2450 | **éclosion** : il jaillit, étiré à 128 %, trou + anneau de terre, 14 miettes | montée `1−(1−u)²` jusqu'au sommet (0,55) | clé + balistique (g = 6,5) |
| 2450–2720 | **vol** puis chute (yeux fermés) | chute `u²` (gravité) | clé |
| 2720–2840 | **impact** : écrasé à 76 %, bouffée de poussière (700 ms) | `eout` | clé |
| 2840–3400 | amorti | ressort corps 260 / 14 ; antenne 140 / 6 | procédural |
| 2720–3300 | le trou se referme sous lui ; 3 fleurs éclosent (2950, 3100, 3250) | `eio` ; fleurs `back` 450 ms | clé |
| 3300–4000 | **il s'ébroue** (yeux fermés), 8 miettes partent sur les côtés | torsion 0,26 rad à 6,5 Hz, enveloppe (1−u)^1,4 ; antenne déphasée de −0,9 rad | procédural |
| 4000–4560 | il **ouvre les yeux pour la première fois**, cligne, sourit | ouverture `eout` 180 ms ; clignement 60/120 ms ; sourire `eio` 400 ms | clé |
| 4500–5800 | il salue ; bulle « Bonjour ! » (4600–6200) | bras `eout` 220 ms, vague 2,4 Hz ±0,32 rad, retour `eio` 300 ms | clé + procédural |

Le ralenti × 0,35 de la vidéo (1800–3200 ms) montre la planche annotée correspondante (hauteur et étirement tracés
par les mêmes fonctions). **Haptique** : `ImpactStyle.Light` à l'impact (2720 ms). **Mouvements réduits** : l'îlot
avec Pilou debout apparaît en fondu de 300 ms, puis la bulle « Bonjour ! » en fondu de 200 ms ; ni motte, ni saut,
ni miettes. Texte de la légende (vidéo) : « Au premier lancement, Pilou pousse sur son îlot comme une graine :
d'abord l'antenne, puis lui. Environ 4 secondes, une seule fois ; un toucher permet de passer. »

## 3. « Comment voulez-vous l'appeler ? »

- Carte (fond `#FFF9F2`, rayon 32 px) qui monte en 500 ms `eout` sous l'îlot. Titre « Comment voulez-vous
  l'appeler ? » ; sous-titre « C'est vous qui choisissez. Vous pourrez changer son nom dans Réglages. » ; champ
  « Son nom… » ; bouton « Valider » (grisé tant que le champ est vide), qui devient « Continuer ».
- **Il écoute** : au focus, il baisse les yeux vers le champ (300 ms) ; **à chaque lettre**, un hochement de 160 ms
  (`hop`, 0,07 rad) + impulsion d'antenne 0,18.
- **Il réagit à son nom** (à « Valider ») : perle qui s'illumine (1 → 0 en 700 ms), antenne qui se dresse (+0,5),
  bouche « o » (60–420 ms) ; **un saut par syllabe** : « Pi… » (saut 0,22, vol 300 ms, à +400 ms) puis « Pi… lou ! »
  (saut 0,30, vol 340 ms, à +850 ms) ; à +1300 ms la joie : yeux rieurs, bras levés (2,5 rad, oscillation ±0,18 à
  1,45 Hz), petit saut, 10 étincelles (1 s), bulle « {nom} ! Ça me plaît. » ; à +2700 ms : « Enchanté ! On fait
  connaissance ? ». Le nom tapé passe en vert avec une coche.
- La syllabation vient du nom (découpage simple en syllabes françaises ; au-delà de 3 syllabes, deux sauts : début
  et fin). **Haptique** : `Light` à chaque atterrissage. **Réduit** : sourire + yeux rieurs, bulle en fondu, aucun
  saut ni étincelle.

## 4. L'onboarding (4 étapes, une par écran)

Mise en page : barre de progression 4 segments + « 1 sur 4 » ; bandeau-ciel (220 px) avec Pilou à gauche et sa
bulle à droite ; question (Nunito 900, 23 px) + sous-titre ; contenu ; bouton bas « Continuer » / « C'est parti ! ».
Transition entre étapes : glissement horizontal de 390 px en 500 ms `eio` ; la question fond (creux au milieu).

| Étape | Question / sous-titre (textes exacts) | Contenu | Réaction de Pilou (déclencheur → animation) | Bulle |
|---|---|---|---|---|
| 1 | « Qu'est-ce qui vous amène ? » / « Choisissez ce que vous voulez améliorer. » | Bien-être (« Comprendre ce qui influence comment vous vous sentez. », badge « Toujours suivi », coché, verrouillé) ; Confort digestif (« Pour un ventre sensible : repérer ce qui le soulage. », badge « Ajouté » à la sélection) ; ligne discrète « Inclus : le bien-être + 1 objectif. » | arrivée : petit salut 1,2 s ; puis regard vers la liste. **Choix « Confort digestif » → il se tapote le ventre** : +120 ms les épaules glissent vers le ventre (`pv` 0 → 1, 220 ms `eio`) ; 2 tapes de 150 ms (+300, +650), écrasement 4 % au contact, yeux plissés, sourire ; retour 250 ms | « Le ventre aussi : c'est noté. » |
| 2 | « Avez-vous une montre ou un bracelet ? » / « On la branche une seule fois. » | Oui / « Non, pas pour l'instant » ; à « Oui », la liste des sources s'ouvre (400 ms `eio`) : « Santé (iPhone) », « Garmin », « Withings » (noms en texte) ; « Connecter » → anneau 500 ms → « Connectée » ; note « Une seule fois. Ensuite, vos sources se gèrent dans ⚙ Réglages » (la puce Réglages pulse 2 fois) | **« Oui » → il enfile une montre** : elle arrive en arc (550 ms `eout`, 6 tours qui ralentissent) ; il tend le bras pour l'attraper ; clic au poignet (pop 250 ms) + 8 étincelles menthe ; il **lève le bras pour la regarder** (300 ms, pose 700 ms), le cadran s'allume (200 ms). « Connectée » → le cadran pulse, hochement 320 ms | « Une montre ? Moi aussi ! » puis « Et voilà : c'est branché. » |
| 3 | « Ce que Halcya suit pour vous, sans rien faire » / « Pour information : rien à valider. » | 9 tuiles aux couleurs des thèmes : Sommeil, Pas, Séances de sport, Cœur, Variabilité cardiaque, Respiration, Température de la peau, Temps d'écran, Météo (pop `back` 350 ms, 110 ms d'écart) ; note « Rien à cocher : tout se fait en arrière-plan, grâce à votre montre et à votre téléphone. » | **il suit les tuiles du regard** (120 ms par tuile) puis **se détend** : yeux rieurs, bras écartés, balancement lent (roulis 0,07 rad, 5,6 s) | « Tout ça, je m'en occupe. Vous n'avez rien à faire. » |
| 4 | « Ce que vous noterez chaque jour » / « Déjà coché : décochez ce qui ne vous parle pas. » | Repas (en photo, 3 par jour), Bien-être (une note rapide), Ventre (le soir), Méditation (suggestion) — cochés ; suggestions « + Étirements », « + Relaxation » ; champ « Ajouter une habitude… » + « Ajouter » → Lecture (oui ou non, chaque jour) ; résumé « 5 choses par jour · environ 1 minute » | Lecture ajoutée → hochement + petit saut 0,12. Puis **main sur le cœur** (épaule glisse vers la poitrine, 350 ms `eio`), deux hochements doux (400 ms), paupières à 62 %. « C'est parti ! » → saut de joie 0,36 (vol 380 ms), bras levés | « **Partez de ce que vous faites déjà : ce n'est pas une liste de bonnes résolutions.** » (≥ 5 s, jusqu'au bouton) |

Si « Confort digestif » n'est pas choisi : la ligne « Ventre » n'apparaît pas à l'étape 4 et le résumé dit « 4 choses
par jour ». Si « Non, pas pour l'instant » : pas de montre pour Pilou ; Séances de sport passe dans « à noter »
(activité si pas de montre). **Réduit** : seulement les expressions (yeux, bouche) et les bulles en fondu ; la
montre apparaît directement au poignet (fondu 200 ms).

## 5. Jour 7 : la cérémonie (bien-être seulement)

- Avant : Accueil « Jour 7 sur 7 : votre semaine est complète » ; 6 cadeaux sur l'îlot (arbuste, lanterne, écharpe,
  galets, papillon, nuage) ; dernier cadeau « Dernier cadeau : un arc-en-ciel pour {nom} » + « Ouvrir ».
- « Ouvrir » → voile plein écran (sauf la barre d'onglets) : 350 ms, échelle 0,96 → 1 `eout`.

| t (ms) | Ce qui se passe | Courbe |
|---|---|---|
| 100–1400 | le grand arc-en-ciel se trace derrière l'îlot, 4 bandes (pêche, menthe, lilas, bleu nuit) décalées de 20 % | `eio` |
| 50–1500 | Pilou lève les yeux, bouche « o », antenne qui se dresse | `win` 300 ms |
| 1450–2900 | saut de joie (0,42, anticipation 120 ms, vol 400 ms), bras levés, yeux rieurs ; 22 confettis (2,2 s) | `jumpAt` |
| 1600–2100 | étiquette « Bien-être » (menthe) ; titre « **Vos premières analyses sont prêtes** » (pop `back` 400 ms) | `back` |
| 2200–2500 | sous-titre « **Pour le confort digestif, encore 7 jours : le ventre demande un peu plus de recul.** » | fondu |
| 2900–4100 | **le ruban** : les 4 bandes quittent le bout de l'arc-en-ciel, longent le bord droit et rejoignent l'onglet Objectifs | tracé `eio` (stroke-dashoffset) |
| 3900–4300 | l'onglet Objectifs s'illumine (halo qui respire) + pastille ; puce « Nouveau : votre bien-être » | `back` |
| 4300–4800 | le grand arc-en-ciel se replie dans le petit arc-en-ciel du nuage (le 7e cadeau reste sur l'îlot) | `eio` |

Une seule fois dans la vie de l'app. **Haptique** : `NotificationType.Success` quand le ruban touche l'onglet.
**Réduit** : l'arc-en-ciel et le ruban apparaissent en fondu (300 ms), Pilou sourit sans sauter, pas de confettis.

## 6. Objectifs

### 6.1 Vue d'ensemble (jour 7)
- En-tête « Vos 7 derniers jours » / « Objectifs » ; Pilou **84 px** à côté du titre (sans îlot) ; phrase « Plutôt
  une bonne semaine. »
- Carte Bien-être (menthe) : « 3,8 / 5 », puce « ↑ Plutôt en hausse cette semaine », 7 barres (pousse 400 ms,
  60 ms d'écart).
- Carte Confort digestif (pêche), **sans score** : « Premier score dans 7 jours », jauge de 14 segments dont 7
  pleins (remplissage 300 ms, 50 ms d'écart), « Le ventre demande plus de recul : 14 jours de notes du soir. »
- « Des estimations, pas un diagnostic. »
- Pilou : petit salut (1,1 s), puis **il montre** la carte dont on parle (bras tendu, regard qui suit), puis se tait.
  Il ne réagit pas à la baisse ou à l'attente par de la tristesse.

### 6.2 Jour 14 : le ventre a son score
- Intertitre « Jour 14 » (14 points, les 7 derniers se remplissent à 70 ms d'écart) + « Deux semaines de notes du
  soir : le confort digestif a son premier score. »
- La carte Digestion devient « 3,1 / 5 », « ↓ Un peu en baisse sur 7 jours », barres, étiquette « Premier score »
  (pop 350 ms). Pilou regarde la carte et hoche deux fois la tête (420 ms) : **ni fête, ni tristesse**.

### 6.3 Ce qui influence votre bien-être (toucher la carte Bien-être)
- Transition : poussée latérale 500 ms `eio` (l'écran précédent recule de 110 px et s'assombrit de 8 %).
- Titre « Ce qui influence votre bien-être ». **Métaphore : les galets**. Sur l'îlot, à côté de Pilou, un cairn de
  trois galets aux couleurs des familles ; **la taille du galet = la force du lien** ; le plus gros porte les autres.
  - Sommeil tombe (380 ms, `ein2`, depuis +2,2), impact écrasé à 82 % + ressort galets + poussière ;
  - Alimentation tombe 650 ms plus tard (le premier s'écrase un peu à son tour) ;
  - **Pilou pose lui-même le petit galet** Activité : il le tient au-dessus de sa tête (pop 300 ms), fait un pas
    (saut 0,1), le dépose en arc (400 ms `eio`), recule, puis montre le cairn et hoche la tête deux fois.
  - Les noms s'affichent à côté de chaque galet (Sommeil, Alimentation, Activité ; 180 ms d'écart, fondu + 8 px).
- Sous l'illustration, **le même contenu en texte** : « Sommeil · 7 h 05 par nuit — ●●● Influence forte »,
  « Alimentation · 19 repas — ●● Influence moyenne », « Activité · 8 400 pas par jour — ● Influence faible »
  (glissement `back` 420 ms, 160 ms d'écart) ; encart « Plus le galet est gros, plus le lien avec votre bien-être est
  fort. Ce sont des pistes, pas des causes. » ; lien « ? Comment est calculé votre bien-être ? ».
- Pourquoi des galets : ils rappellent le cadeau du jour 4 et l'idée d'équilibre ; un poids dit « ça compte », sans
  dire « bien » ou « mal » (une bulle ou une plante qui grandit suggéreraient un progrès).

### 6.4 « Comment est calculé votre bien-être ? » (fiche)
Feuille du bas (montée 400 ms `eout`, voile 38 %) : « Comment est calculé votre bien-être ? » / « Deux sources,
réunies chaque jour : » ; deux cartes « Votre note du jour » (5 visages, le 4e s'allume) + « La lecture du visage »
(**mini-Pilou de 104 px qui se fait lire le visage** : cadre qui se resserre 600 ms `eout`, balayage 800 ms `eio`,
puis sourire et yeux rieurs) → barre « Votre bien-être du jour » (remplissage 800 ms) ; « Votre note compte toujours ;
la lecture du visage la complète quand vous l'utilisez. Une estimation, pas un diagnostic. » ; bouton « Compris ».
Pilou ne porte aucun chiffre.

### 6.5 Sommeil, puis la piste (toucher « Sommeil »)
- « Sommeil » / « Vos 14 dernières nuits · en moyenne 7 h 05 ». Barres des 14 nuits (une à une, 45 ms d'écart,
  `eout`) ; point ambre sur les soirs avec plus de 2 h d'écran ; puis les autres barres pâlissent et **deux moyennes
  se tracent** (1 s `eio`) : « Autres soirs : 7 h 25 » (trait plein) et « Soirs avec plus de 2 h d'écran : 6 h 45 »
  (pointillé ambre) ; l'écart est écrit « −40 min ».
- Carte : « Les soirs avec plus de 2 h d'écran, vous dormez 40 min de moins. » + « Observé sur 14 nuits : un lien,
  pas une preuve. »
- Carte bleu nuit « ✦ PISTE À TESTER » : « Pas d'écran après 22 h, 5 soirs » / « Ensuite, on regarde si votre sommeil
  change. » ; bouton « Je teste » ; **Pilou (80 px) attend à côté du bouton**, paupières mi-closes.
- « Je teste » → le bouton passe ambre « ✓ C'est parti ! Soir 1 sur 5 » (pop 5 %, 320 ms), le texte devient
  « Chaque soir réussi allume une lanterne sur l'îlot. », 18 confettis, Pilou saute (0,2) bras levés.

## 7. Le défi doux de 5 soirs

**Règle** : 5 soirs réussis, pas forcément d'affilée, en 10 jours au plus. Un soir est réussi si le temps d'écran
entre 22 h et 6 h reste sous 5 min (tolérance pour un réveil). **Rien à noter** : le temps d'écran est une entrée
automatique ; si elle n'est pas disponible (voir risques, iOS), une question du matin dans Ma journée : « Hier soir,
pas d'écran après 22 h ? » Oui / Non.

- **Le soir (facultatif, si l'app est ouverte vers 22 h, ou rappel choisi à « Je teste » : « Me le rappeler à
  21 h 55 ? »)** : le rituel. Ciel de nuit (bleu `#18214A` → `#4A4F8C`, étoiles), Pilou (réduit à 84 %) tient son
  petit téléphone allumé (halo bleu sur son visage) ; il **bâille** (800 ms) ; se tourne vers le tiroir (300 ms) ;
  deux petits sauts (400 ms chacun) ; le tiroir s'ouvre (350 ms) ; il **range le téléphone** (300 ms `eio`, l'écran
  s'éteint dans le tiroir) ; il ferme d'un petit coup de hanche (400 ms) ; la lanterne s'allume.
- **Allumage d'une lanterne** (le lendemain matin, à l'ouverture, quand le temps d'écran confirme) : vacillement
  120 ms (intensité 0,45 + 0,35·sin(u/9)), puis montée 400 ms `eout` ; halo additif qui **respire** (±8 %, période
  2,6 s, boucle) ; Pilou la regarde, yeux rieurs, petit saut. Bandeau : 5 icônes de lanternes (fondu de la lueur),
  « Soir 2 sur 5 », jour (« Mercredi » → « Lundi ») en fondu.
- **Soir manqué** : la lanterne reste éteinte, rien ne se casse, aucun compteur ne repart à zéro ; Pilou garde son
  téléphone, puis hausse doucement les épaules en souriant (bras écartés 250 ms, pose 750 ms). Texte : « **Samedi :
  écran après 22 h.** Pas grave : la lanterne attend demain. On compte 5 soirs, pas 5 soirs d'affilée. »
- **5/5** : vague de lumière sur les 5 lanternes (120 ms d'écart), Pilou saute (0,22) bras levés ; « 5 soirs sur 5 :
  bravo ! ». (Au bout de 10 jours sans 5 soirs : bilan avec ce qu'on a, voir ci-dessous.)

### Le bilan (écran « Bilan de votre piste »)
« ‹ Sommeil » ; « Bilan de votre piste » / « Pas d'écran après 22 h · du mercredi au lundi » ; illustration au
crépuscule (les 5 lanternes allumées), Pilou hoche deux fois la tête, bulle « Bravo pour vos 5 soirs. » (**il salue
l'effort, pas le résultat ; pas de confettis**). Carte : 5 lanternes « 5 soirs sur 5 » ; « **Plutôt oui** » ;
« **+25 min de sommeil en moyenne** » ; barres sur la même échelle « Vos soirs habituels 7 h 05 » / « Les 5 soirs sans
écran 7 h 30 » (600 ms `eout`, 200 ms d'écart) ; encart « **À confirmer sur plus de soirs.** 5 soirs, c'est encore
peu : Halcya continue d'observer, sans rien vous demander. » ; boutons « Garder ce rituel » / « Essayer une autre
piste ».

Grille de mots du bilan (moyenne des soirs testés − moyenne des 14 nuits habituelles) : écart < 10 min → « Pas de
différence nette » ; 10 à 30 min dans le bon sens → « Plutôt oui » ; ≥ 30 min → « Oui, plutôt nettement » ; dans
l'autre sens → « Plutôt non ». Sous 10 soirs testés, toujours « À confirmer sur plus de soirs ». Moins de 3 soirs :
« Trop peu de soirs pour conclure : on peut réessayer quand vous voulez. »

## 8. Données (sans analyse)

- En-tête « Vos données, sans analyse » / « Données » ; segment **Tendances | Nutrition** ; **Données s'ouvre sur
  Tendances**. Pas d'écran « Journal ».
- **Tendances** : « Choisissez les courbes à superposer » ; puces Bien-être (active), Sommeil, Digestion, Pas,
  Écran. Courbe bien-être (axe gauche 3–5) tracée en 1 s `eio` ; toucher « Sommeil » ajoute la courbe sommeil (axe
  droit 6 h–8 h, 1 s `eio`) ; bande discrète « Piste testée » sur les soirs du défi (un fait, pas une analyse) ;
  « Moyennes sur 14 jours » : « Bien-être 3,9 / 5 », « Sommeil 7 h 14 ». **Toucher un point ouvre le détail du
  jour** : bulle sombre sous le point (250 ms, `back`), trait vertical pointillé, « Vendredi · jour 9 » : Bien-être
  4,1 / 5 · Sommeil 7 h 32 · Repas 3 sur 3 · Écran 1 h 40.
- **Nutrition** : « Apports de la semaine » / « 19 repas photographiés, du jeudi au mercredi » ; « 1 850 kcal par
  jour, en moyenne » ; Glucides 215 g, Protéines 72 g, Lipides 68 g, Fibres 21 g (barres 600 ms `eout`, 120 ms
  d'écart) ; « **Historique des repas** » : 3 pastilles par jour (pleines = photographié, pointillées = non), sans
  jugement.
- **Pilou** : 64 px, seule la tête dépasse du bord haut de la carte ; il suit des yeux la courbe qui se trace ; il
  ne saute pas, ne parle pas. Il plonge (fondu 200 ms) quand on change d'onglet.

## 9. Mouvements réduits

Réglages › Accessibilité › Mouvements réduits : **suit `prefers-reduced-motion`** (Android « Supprimer les
animations », iOS « Réduire les animations »), modifiable dans l'app. En mode réduit :

| Animation complète | Variante réduite |
|---|---|
| éclosion (antenne, saut, miettes, ébrouement) | îlot + Pilou debout en fondu 300 ms, bulle « Bonjour ! » en fondu |
| sauts (prénom, onboarding, cérémonie, défi) | aucun déplacement vertical ; changement d'expression (sourire, yeux rieurs) |
| tapes sur le ventre, main sur le cœur, montre | pose finale en fondu 200 ms (la montre apparaît au poignet) |
| arc-en-ciel tracé + ruban + confettis | arc-en-ciel et ruban en fondu 300 ms ; pas de confettis |
| galets qui tombent, Pilou qui pose le dernier | cairn complet en fondu 300 ms ; noms en fondu |
| lanterne qui vacille, halo qui respire | lanterne en fondu 300 ms, halo fixe |
| respiration, balancement, îlot qui flotte, antenne | arrêtés ; clignements conservés (pas de mouvement de corps) |
| transitions d'écran glissées / poussées | fondus enchaînés 200 ms |
| bulles en `back` | bulles en fondu 200 ms, sans rebond |
| barres et courbes qui poussent | présentes d'emblée, fondu 200 ms |

Chaque information reste écrite (titres, bulles, légendes des galets, bandeau du défi).

## 10. Haptique (`@capacitor/haptics`, coupé si le téléphone est en silencieux)

`ImpactStyle.Light` : impact de l'éclosion, atterrissages « Pi… lou ! », clic de la montre, galet posé, lanterne
allumée. `NotificationType.Success` : ruban qui touche l'onglet (jour 7), « Je teste », bilan affiché. `selection` :
choix d'une option, d'une puce. Jamais de vibration pour un soir manqué ou un score en baisse.

## 11. Budget de performance (mesuré sur le prototype)

| Vue | Triangles (contours inclus) | Appels de dessin |
|---|---|---|
| Pilou seul (mini-vues) | 36 800 | 36 |
| Pilou + îlot + fleurs | 54 800 | 114 |
| Îlot complet (7 cadeaux) | 67 600 | 151 |
| Défi de nuit (tiroir, 5 lanternes) | 61 200 | 136 |

Cible pour un Android d'entrée de gamme (GPU type Mali-G52 / Adreno 610) : **≤ 25 000 triangles et ≤ 40 appels**
par vue → corps 48 × 40 (≈ 4 000 tris), îlot statique fusionné en une géométrie (+ son contour), fleurs instanciées,
accessoires invisibles retirés de la scène. Canevas ≤ 390 × 360 px CSS, densité plafonnée à 2 (780 × 720), MSAA ×4
(sinon FXAA). **30 i/s pendant une animation, rendu à la demande au repos** (respiration à 30 i/s seulement si la vue
est visible ; arrêt hors écran via `IntersectionObserver` et quand l'app passe en arrière-plan). Un seul contexte
WebGL par écran ; les **mini-Pilou (≤ 96 px : Objectifs, piste, Données, fiche) en images pré-rendues** (atlas de
6 poses, PNG 2×) plutôt qu'en 3D. Mesure indicative ici (WebGL logiciel, sans GPU) : ≈ 90 ms pour 1000 × 1000.

## 12. Risques

- **Temps d'écran sur iOS** : l'API Screen Time (DeviceActivity) ne donne pas le temps d'écran brut à l'app ; la
  détection automatique du défi risque d'être impossible sur iPhone → prévoir la question du matin (§ 7).
- **Perte du contexte WebGL** (Android en arrière-plan, mémoire WKWebView) : écouter `webglcontextlost/restored`,
  repli sur une image fixe de Pilou.
- **GPU faible** : MSAA et contours coûtent cher ; prévoir un mode « léger » (densité 1,5, pas de lumière de
  contour, mini-Pilou en images).
- **Contours « coque inversée »** : petites coupures sur les arêtes vives (boîtes) ; utiliser des géométries
  arrondies (déjà le cas pour le tiroir et le téléphone).
- **Syllabes du prénom** : prénoms longs, composés, emojis ou chiffres → règle simple (2 sauts max), et un
  prénom refusé s'il est vide ; jamais de moquerie sur le nom.
- **Cérémonies vues une seule fois** : stocker l'état (rencontre, jour 7, jour 14) pour ne jamais les rejouer ;
  sauf depuis Réglages (« Revoir l'arrivée de {nom} »), si souhaité.
- **Ton du bilan** : la grille de mots (§ 7) doit être tenue, même quand le résultat est décevant.

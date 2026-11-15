# Pilou — catalogue des états et des animations (SPEC)

Halcya · direction « Compagnon » · chapitre 1 « la bible de Pilou ». Ce document est la référence des chapitres 2 à 4
et de la routine qui codera Pilou dans l'app (React + Capacitor, WebView Android et iOS).

**Implémentation de référence** (dans ce dossier, sans dépendance autre que three.js 0.187) :
- `pilou.js` : géométrie, matières, visage dessiné, rendu d'une vue (`createStudio().render(view, pose)`).
- `anim.js` : courbes, ressorts, expressions, boucle de repos, clignements, regard, réactions, mouvements réduits.
- `prototype.html` : la vidéo ; chaque partie montre comment composer ces briques.

Toute pose est une **fonction pure du temps** `τ` (ms) et d'une **graine** : on peut rejouer n'importe quel instant à
l'image près. Les valeurs ci-dessous sont celles du code ; en cas d'écart, le code fait foi.

---

## 1. Identité (ne change pas)

| Élément | Valeur |
|---|---|
| Silhouette | Galet de révolution : rayon `r(t) = sin t · 0,62 · (1 + 0,12 cos t)`, hauteur 1,38 (t ∈ [0, π]), posé à 0,06 du sol sur deux pieds. Plus large en bas qu'en haut. |
| Proportions | Corps = **1** (référence, 1,44 avec l'appui). Largeur **0,87**. Antenne **+26 %**. Yeux à **2/3** de la hauteur (y = 0,90), bouche à **56 %** (y = 0,745), joues à x = ±0,345, y = 0,785. Bras : capsules de 0,37 (rayon 0,085) à x = ±0,58, y = 0,66. Pieds : ellipsoïdes 0,34 × 0,19 × 0,44 à x = ±0,25. |
| Ventre | Ovale crème sur le bas de la face : `e = (φ/0,9)² + ((y − 0,34)/0,25)²`, bord adouci de e = 0,86 à 1,06 (calculé au pixel). |
| Antenne | La courbe montante du logo : tube Ø 0,064 passant par (0 ; 0,02), (0,012 ; 0,14), (0,09 ; 0,25), (0,20 ; 0,29) au-dessus de la tête ; **point ambre** Ø 0,156 au bout. |
| Nom | « Pilou » est choisi par l'utilisateur à l'accueil ; partout dans l'UI : « Pilou est rassasié », etc. |

**Palette** : menthe `#78D8B4` · ventre `#FFF1DC` · pieds `#4FC097` · antenne `#33B989` · point ambre `#FFB84D`
(lueur `#FF9F2E`) · contour `#4A332B` · yeux `#2B2320` · bouche `#552822` (intérieur `#6E2A26`, langue `#FF8C8C`) ·
joues `#FF8A8A`. Lumières : ciel `#FFF0E0` / sol `#BFAEEA` (hémisphère 1,5) + soleil blanc 2,3 venant d'en haut à droite.

**Matière** :
- **Toon doux** : rampe de 4 paliers `120 · 178 · 228 · 255` (8 texels, filtrage linéaire → paliers fondus).
- **Contour brun** `#4A332B`, coque inversée décalée **en pixels écran** : `px = clamp(1,7 + 0,0032 · ppu, 2, 5,6)`
  (ppu = pixels par unité du modèle). À multiplier par le `devicePixelRatio` effectif.
- **Lumière de contour** crème `#FFF2D6`, 42 % : `smoothstep(0,58 ; 0,86 ; 1 − N·V) · (0,6 + 0,4 Nʸ)`.
- **Point ambre** : émissif `0,2 + 0,55 · glow` + halo additif (opacité `0,75 · max(0, glow − 0,35)`). Il **luit**
  (cycle sinusoïdal 2 400 ms), il ne clignote jamais (< 0,5 Hz).

## 2. Le visage : une texture dessinée, projetée de face

Le visage est dessiné en 2D (Canvas) puis projeté sur une coque qui épouse le corps (décalée de 0,004). Projection plane
de face : la texture couvre x ∈ [−0,52 ; 0,52], y ∈ [0,32 ; 1,36]. On peut donc animer n'importe quelle forme sans
modèle 3D, et le visage tourne avec le corps. Taille : 1 024² en gros plan, **512² dans l'app**, 256² en vignette.
Redessiner **seulement quand un paramètre change** (clignement, regard, expression).

| Paramètre | Plage | Effet |
|---|---|---|
| `lookX`, `lookY` | −1…1 | Les yeux glissent (± 0,045 / ± 0,036) ; les reflets bougent un peu moins (parallaxe). Regarder vers le bas abaisse aussi la paupière (+22 % × −lookY). |
| `fx`, `fy` | ± 0,08 | Tout le visage glisse : c'est la tête qui pivote (Pilou est « tout tête »). |
| `es`, `esx`, `esy` | 0,8…1,3 | Taille des yeux (ovale 0,078 × 0,098). |
| `lidTop` | 0…1 | Paupière du haut. 1 = œil fermé « ‿ » (trait de 0,026 qui suit le bas de l'œil). Trait de cils entre 0,1 et 0,95. |
| `lidBot` | 0…1 | Paupière du bas : 0,3 = yeux qui sourient, 1 = yeux en arc « ∩ ». Annulée quand `lidTop` > 0,55. |
| `lidTilt` | −1…1 | Inclinaison de la paupière (non utilisé dans les états actuels : risque de lecture « triste »). |
| `brow`, `browY`, `browA`, `browYL/R` | 0…1 | Sourcils discrets, **seulement** curieux et surpris. Jamais de sourcils relevés au centre (= tristesse). |
| `mw`, `mU`, `mL`, `mA`, `mx`, `mSkew` | — | Bouche : demi-largeur, creux de la lèvre du haut (+ = sourire), creux de la lèvre du bas (ouverture = mL − mU), arrondi des coins (0 = ovale), décalage, sourire en coin. |
| `tongue` | 0…1 | Langue visible dans la bouche ouverte. |
| `blush`, `hatch` | 0…1 | Joues (taille et opacité montent ensemble) ; rayures « /// » quand il est aux anges. |
| `sparkle`, `shine` | 0…1 | Étoile dans le reflet ; intensité des reflets. |

**Six bouches de référence** (même fonction, passage de l'une à l'autre en 180 ms, courbe « douce ») :

| Bouche | mw | mU | mL | mA | autres |
|---|---|---|---|---|---|
| Doux | 0,07 | 0,026 | 0,026 | 0,12 | — |
| Ouvert | 0,086 | 0,044 | 0,09 | 0,12 | langue 0,55 |
| « o » | 0,04 | −0,04 | 0,05 | 0 | — |
| Rire | 0,1 | 0,046 | 0,15 | 0,1 | langue 0,85 |
| Mâchouille | 0,07 | 0,015 | 0,03 ± 0,018 (sin u/85) | 0,2 | largeur ± 0,008 |
| En coin | 0,088 | 0,042 | 0,042 | 0,12 | mSkew 0,8, mx 0,012 |

## 3. Le squelette (paramètres de pose)

| Paramètre | Effet | Remarques |
|---|---|---|
| `x`, `z`, `yaw`, `y0`, `scale` | Position et orientation des pieds. | yaw : 0 = face caméra. |
| `lift` | Le corps (et les pieds) montent. | Saut, lévitation. |
| `sq` | Étirement-écrasement **à volume constant** : hauteur × (1 + sq), largeur × 1/√(1 + sq). Pivot au sol. | Bras et antenne ne sont **pas** déformés (contre-échelle). |
| `leanX`, `leanZ` | Penché avant/arrière, côté. Pivot au sol. | |
| `twist` | Rotation du corps sur lui-même (la tête) par rapport aux pieds. | Sert à « la tête d'abord ». |
| `aL`, `aR` | Bras écartés (0 = le long du corps, 2,5 = en l'air). | Ordre : écart puis avant. |
| `aLx`, `aRx` | Bras vers l'avant (négatif). | Les bras sont courts : ils n'atteignent pas l'avant du ventre (c'est voulu). |
| `sit`, `footTuck` | Assis (corps −0,1, penché −0,2 rad, pieds en avant, semelles visibles) ; pieds repliés en l'air. | |
| `antX`, `antZ` | Courbure **de repos** de l'antenne (la courbure dynamique vient du ressort). | Endormi : −0,55 (elle tombe). Curieux : +0,22 / +0,25 (point d'interrogation). |
| `glow` | Lueur du point ambre (0,15 endormi … 1,15 rayonnant). | |
| `book`, `page`, `scarf`, `shadow` | Accessoires (livre de lecture, écharpe du jour 3), opacité de l'ombre. | |
| `breath`, `breathT`, `sway`, `idle`, `bob`, `gazeW`, `headW` | Réglages de la boucle de repos (amplitude, période, poids du regard…). | Voir § 6. |

## 4. Courbes et ressorts nommés

| Nom | Définition | Usage |
|---|---|---|
| **douce** | `cubic-bezier(.45, 0, .55, 1)` | Fondus d'expression (400 ms), humeur (1 200 ms), caméra, tête qui suit. |
| **sortie** | `cubic-bezier(.22, 1, .36, 1)` | Apparitions, saccades du regard (90 ms), écrasement d'un toucher (90 ms), ouverture des paupières. |
| **entrée** | `cubic-bezier(.55, 0, .85, .4)` | Anticipations, fermeture des paupières, chute. |
| **rebond** | `cubic-bezier(.34, 1.56, .64, 1)` | Petits « pop » : fleur qui éclot, accessoire. |
| **élan** | `cubic-bezier(.5, -.32, .36, 1.28)` | Pirouette : contre-mouvement puis dépassement dans une seule courbe. |
| ressort **vif** | raideur 420, amortissement 16, masse 1 | Rebond après un toucher (dépassement ≈ 26 %). |
| ressort **réception** | 300 / 13 | Retour après la réception d'un saut. |
| ressort **doux** | 170 / 15 | Retour après un câlin. |
| ressort **antenne** | 160 / 4,5 | Antenne (≈ 2 Hz, s'éteint en ≈ 1,2 s). Gains : latéral 0,7 · vertical 0,62 · avant 0,7 · rotation 0,3 · lacet 0,26 ; limite douce ± 0,75 rad (tanh). |
| ressort **bras** | 230 / 11 | Traîne des bras (accélération verticale × 0,9), limite ± 0,6. |

Les ressorts sont pilotés par l'accélération du sommet de la tête (dérivée seconde de la pose) : tout mouvement du corps
— saut, écrasement, rotation, micro-geste — fait vivre l'antenne sans animation dédiée. Dans l'app, intégrer **pas à pas**
(semi-implicite, sous-pas de 1/120 s) en gardant l'état entre deux images ; la vidéo resimule 1,5 s d'histoire à chaque
image pour rester déterministe.

## 5. Ordre de composition d'une image

1. **Expression** (piste `{t, e, d}` ; fondu `d` = 400 ms, courbe douce) + sa petite animation propre, pondérée par le fondu.
2. **Boucle de repos** (§ 6), multipliée par `idle`.
3. **Réactions** en cours (§ 7), additives, chacune avec sa fenêtre.
4. **Regard dirigé** (doigt, objet), qui remplace le regard qui se promène (`gazeW`).
5. **Clignement** : `lidTop = max(lidTop, clignement × (1 − smoothstep(.6, .9, lidBot)))` (pas de clignement sur des yeux en arc).
6. **Ressorts** (antenne, bras).
7. **Mouvements réduits** (§ 10) en dernier.

## 6. Boucle de repos (« on ne voit jamais la boucle »)

| Couche | Période | Amplitude | Détail |
|---|---|---|---|
| Respiration | 3 600 ms (`breathT`) | sq ± 0,013 × `breath` ; bras + 0,035 | Inspiration un peu plus courte : `sin(2πφ + 0,35 sin 2πφ)`. |
| Balancement | 5 300 ms | leanZ ± 0,024 × `sway` | |
| Avant/arrière | 7 700 ms | leanX ± 0,012 | |
| Torsion | 9 100 ms | twist ± 0,065 | |
| Petit rebond (si `bob`) | 1 150 ms | lift 0,016 × bob × sin²₊ | Seulement content/rayonnant. |
| Regard | événements tous les **1,5 à 4 s** (graine) | lookX ∈ [−0,75 ; 0,75], lookY ∈ [−0,3 ; 0,4] ; 38 % retour caméra | Yeux : saccade 90 ms (sortie) ; tête : 450 ms (douce), 80 ms plus tard, twist 0,16 × regard. |
| Clignements | tous les **2,5 à 6 s** (graine), **1 sur 6 double** (+260 ms) | fermeture 75 ms (entrée) · fermé 35 ms · ouverture 130 ms (sortie) = 240 ms | |
| Micro-gestes | tous les **6 à 11 s** (graine) | haussement (sq + 0,035, 380 ms) · tête penchée (± 0,07, 1 400 ms) · petit rebond (si bob) | Ils font vivre l'antenne. |

Périodes premières entre elles : la même combinaison ne revient qu'au bout de **53 heures** ; les événements sont tirés
avec un générateur graine (mulberry32) par Pilou : deux Pilou côte à côte ne clignent jamais ensemble.

**Regard dirigé** (le doigt qui glisse sur l'écran, une bulle qui éclate, l'assiette qui arrive) : il remplace le regard
qui se promène (`gazeW → 0` en 300 ms). Trois retards, c'est le chevauchement qui rend Pilou vivant :
- **yeux** : cible retardée de **60 ms** → `lookX = clamp(dx / 0,4)`, `lookY = clamp(dy / 0,32)` (dx, dy en unités du
  modèle depuis le visage) ;
- **tête** : **250 ms** → `fx = 0,05 · lookX`, `fy = 0,03 · lookY`, `twist = 0,14 · lookX` ;
- **corps** : **400 ms** → `leanZ = 0,06 · lookX`, `leanX = −0,03 · lookY`.
Quand la cible disparaît, retour au regard libre en 400 ms (douce). Un toucher sur le nez déclenche un toucher (§ 7).

## 7. Réactions au toucher

Toute réaction commence en **< 100 ms** (premier changement visible dans l'image suivante). Le geste est détecté sur la
zone du personnage (boîte englobante + 12 px). Une réaction en cours n'est pas coupée ; on en empile au plus deux.

| Geste | Détection | Ce qu'il fait (ms) | Courbes | Vibration (Capacitor Haptics) | Mouvements réduits |
|---|---|---|---|---|---|
| **Toucher** | appui < 250 ms, < 10 px | Écrasement sq −0,11 en **90 ms** (sortie), puis ressort **vif** ; penché arrière ½ ; yeux en arc 60→380 ms, bouche +0,07, joues +0,4 qui retombent en 1 100 ms ; « son visuel » : 3 traits + onde (520 ms). Total ≈ 650 ms. | sortie + ressort vif | `impact({ style: Light })` | Sourire et joues, fondu 200 ms, rien ne bouge. |
| **Appui long** | ≥ **350 ms** sans bouger | Avant 350 ms : comme un toucher ; puis il se blottit en 420 ms (douce) : penché vers le doigt (leanX + 0,13, leanZ + 0,1, oscillation lente 260 ms), yeux fermés « ‿ », bras qui serrent (aLx −0,95), joues 100 %, petits cœurs toutes les 650 ms. Au lâcher : retour 520 ms + petit rebond. | douce | `impact(Light)` à 350 ms puis toutes les 400 ms (3 max) | Yeux fermés, joues, un seul cœur fixe en fondu. |
| **Double toucher** | 2 touchers en < 300 ms, < 30 px | Le 1er toucher réagit tout de suite ; le 2e déclenche le **saut** : anticipation **130 ms** (sq −0,17, entrée, bras en bas) → vol **440 ms** (parabole, hauteur 0,5, étirement +0,13 au départ, bras en l'air, pieds repliés) → réception **90 ms** (sq −0,15, sortie) → amorti **360 ms** (ressort réception). Antenne et bras suivent par ressort. | entrée · parabole · sortie · ressort | `impact({ style: Medium })` à la réception | Yeux rieurs, bouche ouverte, sans quitter le sol. |
| **Glisser** | > 60 px horizontal sur Pilou | Les yeux suivent le doigt (60 ms), la tête suit (twist 0,3) ; 600 ms après le début, **pirouette** de 360° en **760 ms** (courbe élan) dans le sens du geste, petit bond (0,14), bras écartés, réception douce. | élan | aucune | Les yeux suivent, c'est tout. |
| **Chatouiller** | ≥ 3 changements de sens en < 900 ms sur le ventre | Fou rire : yeux en arc, bouche rire qui tremble (sin u/22), joues 100 % + rayures ; corps qui tremble (≈ 8 Hz, leanZ ± 0,06), se tortille (twist ± 0,14), bras qui battent. Après le dernier passage, s'éteint en 420 ms (exponentielle), puis grand souffle. Pause de 2 s avant un nouveau fou rire. | sinusoïdes amorties | 3 × `impact(Light)` espacés de 120 ms | Visage qui rit, rien ne tremble. |

## 8. Les expressions

Valeurs = écarts au visage par défaut. Fondu d'entrée **400 ms** (courbe douce) depuis l'état précédent. Aucune n'est
triste ni déçue : le plancher est **Tranquille**.

| État | Déclencheur dans l'app | Visage | Corps | Animation propre | Texte |
|---|---|---|---|---|---|
| **Tranquille** | Par défaut ; 0 tâche faite ; jour vide. | lidTop 0,18, lidBot 0,14, bouche douce (0,066 / 0,024), joues 0,45 | bras 0,22, lueur 0,4 | repos | « Pilou est tranquille » |
| **Content** | 1 à 3 tâches faites. | lidTop 0,04, lidBot 0,3, bouche entrouverte (0,085 / 0,042 / 0,075), langue 0,5, joues 0,7, étoile 0,15 | bras 0,42, lueur 0,62, bob 0,5 | petit rebond | « Pilou est content » |
| **Rayonnant** | Toutes les tâches du jour faites. | yeux en arc (lidBot 1), bouche rire (0,1 / 0,046 / 0,15), langue 0,85, joues 1 + rayures 0,8 | bras 1,25 qui dansent (± 0,28, sin u/125), lueur 1,15, bob 1 | étincelles autour | « Pilou est rayonnant » |
| **Curieux** | Nouvelle habitude, nouvel écran, premier jour. | yeux 1,1, regard de côté puis vers vous (900→2 000 ms), sourcil droit levé, bouche « o » | tête penchée (leanZ −0,16), antenne en « ? » | | « Pilou découvre… » |
| **Surpris** | Le cadeau du jour s'ouvre. | yeux 1,24, sourcils levés, bouche « o » (0,044 / −0,05 / 0,068) | anticipation 110 ms (sq −0,1) puis étirement +0,07, bras écartés | 3 traits au-dessus de la tête | « Un cadeau pour Pilou ! » |
| **Concentré** | Pendant une méditation (minuteur). | yeux fermés « ‿ », petit sourire | lévite (0,07 ± 0,018, 5,2 s), bras devant, souffle 5 200 ms × 1,7 | anneaux lilas qui s'élargissent (2 700 ms) | « Pilou médite avec vous » |
| **Absorbé** | Pendant la lecture (habitude « Lecture »). | regard en bas (lookY −1), visage baissé (fy −0,06), paupières 0,26 ; les yeux suivent des lignes (1 400 ms : 86 % de lecture, retour en saccade) | livre ouvert, bras en avant, penché 0,07 | la page tourne toutes les 4 200 ms (520 ms) | « Pilou lit » |
| **Rassasié** | Après un repas noté. | yeux plissés (lidBot 0,82), large sourire fermé, joues 0,78 | penché en arrière (−0,08), plus rond (sq −0,03), se frotte le ventre (cercles 900 ms) | | « Bravo, Pilou est rassasié » |
| **Endormi** | Le soir (après 22 h ou mode nuit). | yeux fermés, petite bouche « o » qui respire | tête tombée (leanZ 0,1), antenne qui tombe (−0,55), lueur 0,15, souffle 4 200 ms × 2,2 | « z » qui montent (2 100 ms) | « Pilou dort. À demain ! » |
| **Réveil** | Première ouverture du matin. | 0–700 ms : deux ouvertures brèves des yeux, petite bouche endormie, tête penchée ; 700–1 700 bâillement (yeux fermés, bouche « O ») ; puis sourire. Jamais de paupière à moitié baissée qui traîne (elle se lit « blasé »). | étirement (bras + 2,3, sq + 0,1), l'antenne se redresse en 1 200 ms | | « Bonjour ! » |
| **Fier** | Piste testée jusqu'au bout, semaine complète. | yeux en arc (0,88), regard levé, sourire en coin, joues 0,8 + rayures | menton levé (leanX −0,12), torse bombé (anticipation 160 ms puis ressort vif), lueur 1 + éclat | « ting » sur le point ambre | « Pilou est fier de vous » |
| **Réconfortant** | Bien-être noté « difficile » (≤ 2/5). | regard doux (lidBot 0,45), sourire tendre ; pendant le câlin, yeux fermés « ‿ » | penché vers vous, tête inclinée, bras ouverts, puis il serre (1 300→2 300 ms) et se berce | petits cœurs | « Journée difficile ? Pilou est là. » |
| **Salut** | Ouverture de l'app (une fois par jour). | content | bras droit qui salue (± 0,38, sin u/150) | | « Bonjour Léa » (le prénom) |

**Boucle ou non.** Tranquille, Content, Rayonnant, Curieux, Concentré, Absorbé, Rassasié, Endormi et Salut sont des
**états** : ils durent tant que leur déclencheur dure, leur petite animation tourne en boucle par-dessus la boucle de
repos. Surpris (≈ 1 s), Réveil (≈ 2,4 s), Fier (≈ 1 s) et Réconfortant (≈ 4,2 s) sont des **séquences** jouées une fois,
puis Pilou revient à l'état de l'humeur du jour (fondu 400 ms).

**Procédural ou image clé.** Il n'y a aucune animation précalculée : chaque état est un **jeu de paramètres** (l'image
clé), et tout le reste est procédural (fondus, courbes, ressorts, couches de repos, hasard à graine). C'est ce qui
permet de mélanger deux états, de ralentir, et de respecter « Mouvements réduits » sans dupliquer le travail.

## 9. Humeur du jour

- Valeur `m` = tâches faites / tâches prévues aujourd'hui (seulement ce qui se note à la main). **Elle ne redescend
  jamais dans la journée** ; elle repart à 0 la nuit (Pilou dort).
- À chaque tâche faite : bulle qui éclate (particules de sa couleur), **une fleur éclot** sur l'îlot (rebond, 550 ms),
  petit saut (h 0,2, amplitude 0,7), puis `m` glisse vers sa nouvelle valeur en **1 200 ms** (douce) : pas de saut d'état.
- Visage : `m ≤ 0,5` → mélange Tranquille→Content (2m) ; `m > 0,5` → Content→Rayonnant ; l'animation de Rayonnant est
  dosée par `smoothstep(.6, 1, m) × 0,7`.
- Mot affiché (toujours un texte) : `m < 0,2` « Pilou est tranquille » · `< 0,9` « Pilou est content » · sinon « Pilou est rayonnant ».
- **Jour vide** : Pilou reste Tranquille, peut s'asseoir et faire un petit salut ; texte « Pilou vous attend, tranquille ».
  Jamais de tête basse, de pluie, de fleur fanée ni de « vous n'avez rien fait ».
- **Jour difficile** : Réconfortant (≈ 4 s à l'arrivée sur l'accueil), puis Tranquille aux yeux doux.

## 10. Mouvements réduits

Activés si `matchMedia('(prefers-reduced-motion: reduce)')` ou si le réglage de l'app est coché
(Réglages → Accessibilité → « Mouvements réduits », par défaut = réglage du système).

- **Supprimé** : lift, écrasement, penchés, rotations (yaw/twist), ressorts (antenne rigide), respiration, balancement,
  micro-gestes, lévitation, orbite des bulles (positions fixes), particules, confettis, cœurs et « z » qui montent.
- **Gardé** : les visages (fondu de paramètres 200 ms, courbe douce), les clignements, le regard (yeux seulement), la
  lueur fixe du point ambre, **tous les textes**, les vibrations (elles ont leur propre réglage).
- Une bulle faite **s'efface** en 200 ms (pas d'éclatement) ; la fleur apparaît en fondu.
- Rien ne se déplace de plus de 4 px ; rien ne clignote au-dessus de 0,5 Hz.

## 11. Déplacements sur l'îlot

| Mouvement | Durées | Détail |
|---|---|---|
| **Sautiller** | bond de 560 ms : élan 110 (sq −0,12, entrée) · vol 340 (h 0,28, déplacement en douce) · réception 110 (sq −0,11 puis ressort réception) | Il se tourne vers sa destination pendant l'élan (160 ms). Les bonds s'enchaînent. |
| **Se retourner** | 650 ms | La tête (twist) arrive en 420 ms, les pieds suivent de 120 à 650 ms en deux petits pas (h 0,04). |
| **S'asseoir** | 650 ms + soupir | Petite montée (sq + 0,04, 180 ms), descente 650 ms (douce), réception (sq −0,07), puis un soupir de 1,8 s (yeux fermés à moitié) et un souffle plus lent (4 600 ms). |

## 12. Événements de l'app → Pilou

| Événement | Pilou | Texte (vouvoiement, toujours présent) | Vibration |
|---|---|---|---|
| Ouverture (1re du jour) | Réveil le matin, sinon Salut | « Bonjour Léa » | — |
| Toucher Pilou sur l'accueil | Réactions § 7 | — (jeu, aucune information) | § 7 |
| Bulle touchée | Ouvre la tâche (Ma journée ou feuille) | — | — |
| Tâche faite | Bulle qui éclate · fleur · petit saut · humeur qui monte | « Méditation notée · Pilou est content » | `impact(Light)` |
| Repas validé | L'assiette vole vers lui, il mâchouille (bouche « Mâchouille » 1,5 s), puis Rassasié | « Bravo, Pilou est rassasié » | `notification(Success)` |
| Habitude « Non » | Tranquille, petit hochement | « Pas grave, à demain ! » | — |
| Cadeau du jour | Surpris → Content, l'accessoire apparaît (rebond) | « Pilou porte son écharpe » | `impact(Medium)` |
| Méditation en cours | Concentré | « Pilou médite avec vous » | — |
| Lecture en cours | Absorbé | « Pilou lit » | — |
| Bien-être « difficile » | Réconfortant | « Journée difficile ? Pilou est là. » | — |
| Piste testée jusqu'au bout / 7 jours | Fier | « Pilou est fier de vous » | `notification(Success)` |
| Après 22 h | Endormi | « Pilou dort. À demain ! » | — |

## 13. Budget de performance (Android d'entrée de gamme)

Mesures faites sur ce prototype (rendu logiciel SwiftShader, sans GPU) : Pilou **32 700 triangles** contour compris,
îlot **19 500**, 140 maillages ; visage 512² dessiné en 0,16 ms ; resimulation des ressorts 1 ms. Cibles pour l'app :

| Poste | Cible |
|---|---|
| Canevas de l'accueil | 390 × 330 px CSS, **DPR plafonné à 1,5** (585 × 495) ; MSAA 4× si DPR ≤ 1,5, sinon pas d'antialias. |
| Triangles | **≤ 20 000** visibles : corps 48 × 40 segments (≈ 3 800 × 2 avec contour), sphères 20 × 12 ; îlot ≤ 8 000 (fleurs fusionnées en un maillage). |
| Appels de dessin | ≤ 60 (contour : même géométrie, 2e passe). |
| Images par seconde | **60** pendant une réaction (≤ 2 s), **30** au repos, **20** après 20 s sans geste, **0** hors écran (IntersectionObserver) ou app en arrière-plan (`visibilitychange`, `App` de Capacitor). Mouvements réduits : rendu seulement quand quelque chose change. |
| Visage | 512², redessiné uniquement à un changement de paramètre (≈ 10 fois/s au plus), `texSubImage` sans mipmaps sur Android bas de gamme si besoin. |
| Ressorts | Intégration pas à pas (sous-pas 1/120 s) : < 0,05 ms par image. |
| Poids | three.js (tree-shaking) ≈ 130 ko gzip + `pilou.js`/`anim.js` ≈ 15 ko. |
| Repli | WebGL absent ou contexte perdu (`webglcontextlost`) : image fixe de Pilou dans l'expression courante (13 états × 2 tailles, pré-rendus), textes identiques. |

Objectif mesurable : 16 ms par image à 60 i/s sur un appareil de classe Mali-G52 / 3 Go, 8 ms de rendu GPU max.

## 14. Risques

- **Performance WebView** sur Android bas de gamme (MSAA, surcharge du contour) → plafonner le DPR, baisser les segments,
  passer à 30 i/s ; mesurer sur un vrai appareil avant de figer.
- **Perte du contexte WebGL** en arrière-plan (Android) → recréer la scène à `webglcontextrestored`, image fixe en attendant.
- **Contour en pixels écran** : il faut le multiplier par le DPR réel, sinon il paraît trop fin sur iPhone.
- **Visage projeté de face** : au-delà de 70° de rotation les traits s'étirent sur les bords (caché par le corps en pratique).
- **Éthique** : « Tranquille » en fin de journée ne doit jamais se lire comme une déception → mots positifs, humeur qui
  ne baisse pas, pas de série perdue ni de compteur rouge. Réconfortant ≠ triste : pas de sourcils relevés au centre,
  pas de larmes.
- **Accessibilité** : tremblement du fou rire (8 Hz, petite amplitude) et pirouette supprimés en mouvements réduits ;
  lecteur d'écran : l'état est annoncé par le texte (`aria-live="polite"`), jamais seulement par l'image.
- **Vibrations** : différences iOS/Android, respecter le réglage du système et proposer un interrupteur.
- **Cohérence entre chapitres** : les chapitres 2 à 4 ont été faits en parallèle depuis le prototype ; en cas d'écart
  (taille des yeux, bouche, joues), ce document fait foi.

# Pilou, votre double numérique — SPEC des traits (pour l'app)

Halcya · 14/11/2026 · conception : `../PILOU-DOUBLE.md`. Référence du personnage : `../compagnon-1-personnage/SPEC.md`
(identité, visage peint, ressorts, courbes). Ce document fixe **les traits** : chaque pièce, sa géométrie et son budget,
les palettes, les règles de compatibilité, les animations d'apparition et l'écran Studio. Les valeurs sont celles du
code (`traits.js`) ; en cas d'écart, le code fait foi.

**Fichiers**
- `traits.js` — le module des traits, **séparé du personnage** : schéma, libellés, palettes, `normaliser()`, `tirer()`,
  `compter()`, peintre du visage (`creerPeintre`), pièces 3D (`creerPieces(kit)`), table `APPARITION`.
- `pilou.js`, `anim.js` — copies du chapitre 1 avec trois ajouts seulement : crochets de peinture dans `drawFace`
  (phases `sous`, `peau`, iris, `sourcils`, `dessus`), le « kit » exposé par `createStudio()`, la **montre** au poignet ;
  deux ressorts de plus (cheveux, pendants) intégrés dans la même passe que l'antenne.
- `lea.js` — Léa, illustration (personnage fictif dessiné). `video.js` + `prototype.html` — la vidéo. `render.mjs`.

---

## 1. Principe : Pilou reste Pilou

| Ne change jamais | Change (les traits) |
|---|---|
| Silhouette de galet, proportions, corps **menthe `#78D8B4`** pour tout le monde, ventre crème, antenne-logo et point ambre, **joues `#FF8A8A`**, contour brun, matière toon, la **montre** (bracelet `#5B5F9E`, cadran menthe) | Cheveux (coupe, texture, couleur, mèches, volume), sourcils, couleur et forme des yeux, lunettes, barbe, taches de rousseur, grain de beauté, boucles d'oreilles, piercing du nez, couvre-chef (à la main) |

Deux familles de traits :
1. **Peinture du visage** (coût nul : le visage est déjà une texture 2D projetée) — sourcils, iris, forme des yeux,
   taches, grain de beauté, piercing, ombre de barbe, moustache, bouc, collier, barbe courte.
2. **Pièces 3D modulaires** — calotte de cheveux (+ queue, chignon, tresses, locks), montures, barbe longue, boucles
   d'oreilles, couvre-chefs. **Au plus une pièce par famille, ≤ 2 000 triangles par pièce**, construites à la demande
   (rien n'existe tant que la famille est vide ; reconstruction seulement quand la valeur change).

**Brancher les traits sur un autre Pilou** (rendu plus réaliste) : `creerPieces(kit)` n'utilise que
`kit = { THREE, toon(hex, opts), ol(mesh, épaisseur), body }` et le profil `bodyR(t)`, `H`, `BY`. Un autre rendu fournit sa
propre fonction de matière (`toon`) et de contour (`ol` peut ne rien faire) ; la géométrie, les palettes, la peinture
et les apparitions restent identiques. Le peintre (`peintre.peindre(ctx, X, Y, k, F, phase)`) dessine dans le repère du
visage de face (x ∈ [−0,52 ; 0,52], y ∈ [0,32 ; 1,36]) : tout visage projeté de face peut l'appeler.

## 2. Données

- **Fiche** : le JSON imposé à Gemini (`SCHEMA`, identique au § 4 de la conception) + ce que l'app ajoute :
  `version`, `couvre_chef` (`aucun · bonnet · casquette · bandeau · foulard · chapeau · serre_tete`), nuances fines du
  Studio (non montrées dans la vidéo). La fiche de Léa pèse **454 octets** (JSON compact) et **≈ 480** avec `version` et
  `couvre_chef` : la conception annonçait ≈ 300 (écart, voir NOTES).
- **`normaliser(fiche)`** est appelé sur toute fiche (relais, Studio, tirage) : valeur inconnue → valeur par défaut +
  nom du champ ajouté à `incertains` ; puis règles de compatibilité (§ 6). Retourne `{ fiche, corrections }`.
- **`incertains`** pilote le Studio : chaque champ listé a un point ambre sur son onglet et un bandeau « Vérifiez … ».
  Toucher la valeur (même inchangée) la confirme et retire le champ.
- **Effacement** : « Réinitialiser Pilou » supprime la fiche ; « Revenir au Pilou d'origine » = fiche `null`.

## 3. Peinture du visage (texture du chapitre 1 : 1 024² en gros plan, 512² dans l'app, 256² en vignette)

Repère du visage : unités du modèle, x vers la droite de l'écran, y vers le haut (yeux à y = 0,90, bouche à 0,745,
joues à (±0,345 ; 0,785)). Tout suit `fx/fy` (la tête qui tourne) ; rien n'est dessiné sur les joues roses.

| Trait | Dessin | Valeurs | Ordre |
|---|---|---|---|
| **Sourcils** | Forme pleine (bords haut/bas), longueur 0,145, centrée en x = ±0,207, 0,05 au-dessus de l'œil (+ 0,026 avec des lunettes, pour passer au-dessus de la monture). Bout arrondi côté nez, effilé côté tempe (épaisseur × 1,08 → × 0,53). | Épaisseur : fins 0,012 · moyens 0,018 · épais 0,026. Profil : droits (bombé 0,005) · arqués (sinus 0,019) · anguleux (pic 0,022 à 64 %). Couleur : `sourcil` de la palette des cheveux. **Règle anti-tristesse** : l'extrémité côté nez n'est jamais plus haute que l'autre ; les expressions ne font que monter le sourcil entier (`browY`) ou l'incliner vers l'extérieur. | après les yeux |
| **Iris** | Anneau entre la pupille (56 % de l'œil) et 93 %, dégradé vertical *foncé* (haut) → *clair* (bas), liseré `anneau` 0,009. En petit, il ne reste que le **reflet bas teinté** (couleur `reflet`). Les reflets blancs du chapitre 1 restent par-dessus. | 7 palettes § 5. | dans l'œil |
| **Forme des yeux** | Multiplie la taille de l'ovale : ronds 1 × 1 · amande 1,07 × 0,90 · allongés 1,14 × 0,82 ; paupière haute +0,06 pour amande/allongés. Les yeux restent grands. | | avant le dessin |
| **Taches de rousseur** | 64 positions graine sur les joues (jamais sur les yeux) + 14 sur l'arête du nez, ellipses Ø 0,012–0,021, `rgba(196,118,74,α)`. | légères : 28 points, α × 0,8, pas sur le nez · marquées : 78 points. | après les joues |
| **Grain de beauté** | Disque Ø 0,021 `#5A3A2E`. | joue gauche (−0,33 ; 0,72) · joue droite (0,33 ; 0,72) · menton (0,07 ; 0,64) · lèvre (0,105 ; 0,775). | après les joues |
| **Piercing du nez** | Disque doré Ø 0,018 + reflet, en (0,05 ; 0,818). | `#E7B44A` / `#FFF3C4`. | dessus |
| **Ombre de barbe** | Région « barbe » remplie à 20 % + 520 points graine (Ø 0,0064) à 55 %, couleur `ombre` de la barbe. | | sous les joues |
| **Barbe courte / collier / bouc** | Région remplie (couleur `base`) + 260 petits traits (ombre / reflet) + liseré à 28 %. Région : contour du bas du visage de (±0,455 ; 0,90) à (0 ; 0,592) ; bord haut sous les joues (0,25 ; 0,703) qui remonte au-dessus de la bouche. Collier : bande de 0,03–0,04 le long du contour. Bouc : ovale 0,124 × 0,08 sous la bouche + petite moustache (× 0,74). | | sous les joues |
| **Moustache** | Deux lobes accrochés au centre de la bouche (elle suit `mx`, `my`), 0,13 de demi-largeur, au-dessus de la lèvre. | | après la bouche |

## 4. Pièces 3D

Repère « tour » : celui du profil de révolution (y = 0 en bas du galet, 1,38 au sommet, z vers l'avant), groupe
`tete` qui pivote avec le visage (`rotation.y = fx / 0,55`, `rotation.x = −fy / 0,55`). Toutes les pièces sont filles
du corps : elles s'écrasent et s'étirent avec lui (étirement-écrasement à volume constant du chapitre 1).

### 4.1 Cheveux (une pièce : calotte + ce qui pend) — ≤ 2 000 triangles
**Calotte** : grille `NU × NV` (48 × 16 = 1 536 triangles, réduite automatiquement si la coiffure ajoute une pièce)
refermée **autour de l'antenne** (couronne Ø 0,11 : l'antenne sort toujours entre les mèches) et **sur le crâne aux
pointes** (arrondi en quart d'ellipse sur 0,085 : volume fermé, contour propre). Chaque colonne φ suit le crâne
(abscisse curviligne depuis la couronne), puis pend verticalement sous le point le plus large (y = 0,61).

- **Fin des mèches** `yFin(φ)` par zones : *front* (selon la coiffure) → *cadre* (mèches devant la joue, |φ| 0,84–1,26,
  jamais sur les joues) → *oreille* (dégagée, 1,36–1,50 : les boucles restent visibles) → *côtés* (au-dessus des bras,
  1,50–1,70) → *dos*.

| Longueur | cadre | oreille | côtés | dos | épaisseur |
|---|---|---|---|---|---|
| rasés | 1,00 | 1,00 | 0,98 | 0,95 | 0 (moucheté peint) |
| très courts | 1,02 | 1,00 | 0,99 | 0,965 | 0,032 |
| courts | 0,94 | 0,955 | 0,93 | 0,90 | 0,046 |
| mi-longs | 0,79 | 0,93 | 0,79 | 0,62 | 0,054 |
| longs | 0,74 | 0,93 | 0,78 | 0,40 | 0,058 |
| très longs | 0,72 | 0,93 | 0,78 | 0,17 | 0,058 |

| Coiffure | Front (y) et effet |
|---|---|
| libres | 1,16 → 1,17, léger feston |
| frange | 1,118 droite, festons atténués (× 0,4) |
| raie au milieu | 1,25 au centre → 1,13 (rideau) ; sillon sur la colonne φ = 0 |
| raie sur le côté | raie en φ = 0,39 (une colonne) : 1,27 → 1,14 du côté balayé, 1,175 de l'autre ; mèches et pointes en biais (dents de scie) ; ça gonfle de part et d'autre de la raie (× 1,12) |
| en arrière, queue, chignon, tresses | 1,235 lisse ; volume × 0,6, pas de festons au dos |
| locks | 1,175 ; calotte fine (0,034) + 14 locks |
| côtés rasés | 1,16 ; côtés (|φ| > 0,7, y < 1,13) mouchetés, épaisseur 0 |

| Texture | Mèches sur le tour | Relief | Volume | Pointes |
|---|---|---|---|---|
| raides | 14 | 0,010 | × 1,0 | pointues (0,035) |
| ondulés | 12 | 0,011 + ondulation (fréquence 9, phase ± 1,0) | × 1,12 | demi-rondes (0,04) |
| bouclés | 13 | bosses 0,048 (fréquence 15) | × 1,30 | rondes (0,04) |
| frisés | 18 | bosses 0,042 (fréquence 21) | × 1,55 | rondes (0,035) ; ne pendent pas sous 0,5 |
| crépus | 22 | bosses 0,034 (fréquence 24) | × 2,0, dôme + 45 % en haut | ne pendent pas : volume « nuage » (cadre ≥ 0,86, dos ≥ 0,74) |

Volume : plat × 0,72 · moyen × 1 · volumineux × 1,42 ; gonflement sur les côtés du crâne (+12 % raides … +65 % crépus) ;
évasement des longueurs qui pendent (0,05 à 0,2 par unité sous y = 0,92). **Carte de relief peinte** dans le shader :
fines mèches (lignes antialiasées par `fwidth`, qui disparaissent en petit) pour raides/ondulés, petites boucles pour
bouclés/frisés/crépus. **Reflet** : une bande dentelée sur le dessus, côté lumière (couleur `reflet`, 75 %).

| Pièce ajoutée | Géométrie | Triangles |
|---|---|---|
| Queue de cheval | Tube effilé 8 côtés × 16 sur une courbe de Bézier qui part de l'arrière (y = 1,12) et retombe **de côté** (lisible de face) ; chouchou framboise `#E0557A` | ≈ 300 |
| Chignon | Sphère 18 × 12 déformée (enroulement), élastique (tore 6 × 20), en haut à l'arrière | ≈ 640 |
| Tresses | Deux tubes 6 côtés × 26 en φ = ± 1,74 (derrière les bras), 9 lobes alternés, élastique à 86–90 % | ≈ 620 |
| Locks | 14 tubes 6 côtés × 7 en deux rangées autour de la tête (|φ| ≥ 1,02), longueur ± 15 % (graine) | ≈ 1 180 |

**Ressort « cheveux »** (raideur 95, amortissement 7,5, ≈ 1,5 Hz, plus lent que l'antenne) : piloté par l'accélération
du sommet de la tête comme l'antenne, il décale les longueurs qui pendent (`w = (0,96 − y)^1,5 × 1,5`), la queue, les
tresses, les locks. Ressort « pendants » (190 / 6) pour les boucles pendantes. Mouvements réduits : ressorts à 0.

### 4.2 Montures — ≤ 1 600 triangles (mesuré : 1 464, aviateur 1 564)
Construites **par la même projection que le visage peint** : chaque point (x, y) de la forme 2D est posé sur le
corps puis décalé de 0,052 le long de la normale → la monture entoure toujours l'œil peint, quelle que soit la courbure.
Cercles (tube 44 × 6), pont, branches qui suivent la tête jusqu'à φ = 1,5, verres (disque transparent + bande de
reflet qu'on fait glisser).

| Type | Forme (demi-axes, superellipse) | Tube |
|---|---|---|
| rondes | cercle 0,126 | 0,0115 |
| rectangulaires | 0,15 × 0,112, n = 4,2 | 0,011 |
| carrées épaisses | 0,152 × 0,128, n = 5 | 0,021 |
| papillon | 0,15 × 0,114, n = 3, coin extérieur relevé de 0,045 | 0,016 |
| aviateur | goutte 0,148 × 0,118, pointe basse côté nez, double pont | 0,0085 |
| sans monture | 0,142 × 0,11, n = 3,6, liseré fin | 0,0045 |

### 4.3 Barbe longue — 384 triangles
Grille 16 × 12 posée sur le bas du visage (de y ≈ 0,655 à 0,445), épaisseur 0,07 au centre, bosses ; **son bord haut
descend quand la bouche s'ouvre** (`(mL − 0,03) × 1,3`) : on voit toujours la bouche. Plus la barbe courte peinte et la
moustache.

### 4.4 Boucles d'oreilles — ≤ 600 triangles
Pilou n'a pas d'oreilles : un **point d'oreille** en φ = ± 1,42, y = 0,83 (zone dégagée par les cheveux). Puces :
icosaèdre Ø 0,06 · anneaux : tore 0,05 · pendantes : tige + goutte bleu `#7FD0F0` sur ressort. Or `#E7B44A`.

### 4.5 Couvre-chefs (choisis seulement à la main) — ≤ 1 750 triangles, percés pour l'antenne
Posés **sur** les cheveux : leur épaisseur = enveloppe des cheveux (`.0065 + T × volume + relief`) + marge. Avec
bonnet, chapeau ou casquette, le volume des cheveux est plafonné à « moyen » et le chignon est caché.

| Couvre-chef | Géométrie | Couleur |
|---|---|---|
| Bonnet | calotte 40 × 10 à côtes (20), sommet gonflé, revers fermé de 0,094 ; **l'antenne fait le pompon** | `#E8A63A` |
| Casquette | calotte 36 × 9 à panneaux, visière (secteur de cylindre 1,9 rad, inclinée de 0,2), bouton | `#4F67C4` |
| Bandeau | anneau à section pleine, 0,09 de haut, plus bas derrière | `#FF8A73` |
| Foulard | coque 44 × 14 qui **encadre le visage** (front 1,13, descend à 0,63 devant les joues, tombe à 0,48 dans le dos), plis, pli de bord (tube), motif à pois ; cache cheveux et oreilles | `#A08CF7` |
| Chapeau | calotte haute, bord de 0,2 incliné vers le bas, ruban `#C25B3F`, chapeau penché de 0,16 rad | `#E9CC8E` |
| Serre-tête | demi-arc tubulaire juste devant l'antenne | `#E0557A` |

### 4.6 Budget mesuré (rendu de référence, `stats()`)
Léa : cheveux 1 536 · lunettes 1 464 · boucles 160 · bonnet 1 120. Cheveux : queue 1 840 · tresses 1 904 · locks 1 944 ·
chignon 1 916 · rasés 640. Montures 1 464 (aviateur 1 564). Couvre-chefs : serre-tête 480 · bandeau 352 · casquette 952 ·
bonnet 1 120 · chapeau 1 344 · foulard 1 712. Barbe longue 384. Boucles 160 à 576. Pilou nu : ≈ 16 000 (corps + contour) → **Pilou complet ≤ 22 000 triangles**, dans le budget de 20 000
du chapitre 1 à 10 % près (couper le contour des boucles et des branches si besoin). Le visage peint ne coûte rien.

## 5. Palettes curatées (pas de couleur libre)

**Cheveux** — base · ombre · reflet · sourcils (lisibles à 60 px, harmonieuses avec le menthe ; le « vert » est un vert sapin, jamais proche du corps).

| | base | ombre | reflet | sourcils |
|---|---|---|---|---|
| noir | `#36302F` | `#1E1A1A` | `#6A6878` | `#262122` |
| brun foncé | `#4E3125` | `#2F1D16` | `#80594A` | `#35221A` |
| brun | `#6E4632` | `#4A2E20` | `#A0705A` | `#4A2E20` |
| châtain | `#996443` | `#6B432A` | `#D09A6A` | `#5A3A26` |
| châtain clair | `#AA7C52` | `#7E5838` | `#D8AC7E` | `#6E4A30` |
| blond foncé | `#C09458` | `#977140` | `#E0C08A` | `#86643C` |
| blond | `#E6C47C` | `#C29C58` | `#F4DEA4` | `#A2804C` |
| blond platine | `#F0E4C6` | `#D2C29C` | `#FBF4E2` | `#B09C78` |
| roux | `#CC6532` | `#9A4420` | `#F09A60` | `#8E4020` |
| auburn | `#923E2C` | `#66261A` | `#C26C56` | `#5E281C` |
| poivre et sel | `#948D86` | `#605A55` | `#D6D0C8` | `#5A5552` |
| gris | `#B2ABA3` | `#8E877F` | `#D8D2C9` | `#6E6A66` |
| blanc | `#EFEAE2` | `#CFC7BC` | `#FBF8F2` | `#A9A49D` |
| rose | `#F49CBA` | `#CF6A8E` | `#FFD3E2` | `#7A4A3A` |
| bleu | `#7096E0` | `#4867B6` | `#B8CEF8` | `#5A4A4A` |
| violet | `#9E80E0` | `#6C50B4` | `#D0C0F8` | `#5A4450` |
| vert | `#3F8058` | `#28583C` | `#7DB892` | `#3E4A3A` |

Gris et blonds : contraste de valeur réduit et teinte légèrement chaude (sinon ils se lisent « métal » en toon).
Mèches : *claires* = reflet éclairci de 45 % vers `#FFF4DC` ; *colorées* = rose `#F49CBA` (bleu `#8FB4F2` si les
cheveux sont déjà roses), sur ≈ 40 % des mèches (graine). Barbe : *comme les cheveux* = base/ombre/reflet ; *plus claire*
= reflet ; *plus foncée* = ombre ; *grise* = `#ADA69E` / `#8A837B` / `#D4CEC6`.

**Yeux** — foncé (haut) · clair (bas) · liseré · reflet teinté : marron foncé `#4C2E1E` `#7E5236` · marron `#6E4024`
`#B0743E` · noisette `#6A5626` `#BB9A48` · vert `#3A6638` `#7DB064` · gris `#5A6870` `#AAB6BE` · bleu `#2C5698` `#72A4DE`
· bleu clair `#4A88C2` `#AAD6F4`.

**Montures** : noir `#2E2725` · écaille (texture : `#8A5530` + taches `#341C10` et `#D69650`) · doré `#D8A63C` · argent
`#AEB6BF` · transparent `#E6DDD0` à 80 % · colorée `#E0557A`. **Bijoux** `#E7B44A`. **Taches** `rgba(196,118,74,·)`.

## 6. Compatibilité (`REGLES`, appliquées par `normaliser`)
1. Sans cheveux ou rasés → coiffure « libres », volume plat, pas de mèches.
2. Queue de cheval, chignon, tresses → au moins mi-longs.
3. Locks → au moins courts.
4. Côtés rasés → de très courts à mi-longs sur le dessus.
5. Frange et raies → au moins courts (sinon « libres »).
6. Crépus très longs « libres » → longs (le volume remplace la longueur).
7. Pas de lunettes → pas de couleur ; lunettes sans couleur → noir (aviateur : doré).
8. Pas de barbe → pas de couleur ; barbe « comme les cheveux » sans cheveux → brun naturel.
9. Foulard → cache cheveux et oreilles (rien n'est perdu, juste caché). Bonnet, chapeau, casquette → volume ≤ moyen,
   chignon caché.

## 7. Combien de Pilou ? (calculé par `compter()`)
| Famille | Combinaisons |
|---|---|
| Cheveux 7 × 5 × 10 × 17 × 3 × 3 | **53 550** (la conception écrivait ≈ 160 000) · **29 427** cohérentes |
| Barbe · sourcils · yeux · lunettes · peau · oreilles · couvre-chef | 25 · 9 · 21 · 37 · 15 · 8 · 7 |
| **Total théorique** | **7 863 978 150 000 ≈ 10¹³** (cohérent : 4,3 · 10¹²) |

`tirer(graine, force)` (« Surprenez-moi ») : tirage pondéré (78 % de couleurs naturelles, 1 sur 4 avec lunettes,
couvre-chef rare) puis `normaliser`. La mosaïque utilise un **tirage stratifié** : chaque tuile impose une famille
(`force`), la graine `1000 + 17 i` fait le reste.

## 8. Animations d'apparition (transformation et Studio)

| Trait | Déclencheur | Durée | Courbe | Ce qui bouge | Pilou | Vibration | Mouvements réduits |
|---|---|---|---|---|---|---|---|
| Cheveux | 1er trait | **1 400 ms** | `cubic-bezier(.33, 1.18, .55, 1)` (« pousse », dépasse de 6 %) | La calotte pousse depuis l'antenne (longueur × g, épaisseur `smoothstep(0, .55, g)`), puis ce qui pend (≥ 45 %) | yeux fermés, il inspire (sq + 0,022), s'étire (+0,05) ; l'antenne est bousculée (sinus amorti 420 ms) | `impact(Light)` à la fin | fondu 200 ms |
| Sourcils | +2 100 ms | 420 ms | sortie | tracés du nez vers la tempe | petit haussement (+0,018, 750 ms) | — | fondu |
| Yeux | +900 ms | 600 ms | sortie | l'iris s'élargit depuis la pupille ; forme qui glisse | clignement à +650 ms, étoile dans le reflet | — | fondu |
| Lunettes | +1 200 ms | 900 ms | rebond | descendent de 0,55 avec une petite rotation, se posent | il les regarde arriver ; à la pose : écrasement −0,05 en 80 ms puis ressort vif, cligne ; reflet qui balaie le verre (320 ms) | `impact(Light)` à la pose | apparaissent en fondu |
| Taches | +1 500 ms | 700 ms | rebond, 50 % de décalage du centre vers l'extérieur | chaque tache « pop » | joues + 0,25 | — | fondu |
| Boucles | +1 200 ms | 500 ms | rebond (× 1,35 au pic) | pop + étoile (520 ms) | tête penchée vers la caméra | `impact(Light)` | fondu |
| Barbe | — | 800 ms | sortie | peinte en pointillé ; la barbe longue descend | — | — | fondu |
| Couvre-chef | toucher dans le Studio | 650 ms | rebond | tombe de 0,5, s'écrase un peu | surpris, regarde en haut ; écrasement −0,06 (ressort vif) | `impact(Medium)` | apparaît en fondu |

Puis **« Voilà, c'est nous ! »** : il se regarde (yeux en bas, 380 ms), secoue la tête deux fois en 1 100 ms (les
cheveux suivent sur leur ressort), regarde la personne, saute (anticipation 130 ms, vol 440 ms, réception, amorti), la
bulle arrive (rebond 450 ms). **C'est la seule phrase** : Pilou ne commente jamais l'apparence. Texte toujours présent
(la liste nomme chaque trait). Durée totale de la transformation ≈ 9 s + 3 s de fête ; un toucher la passe.

## 9. L'écran Studio Pilou (390 × 844)

- **En-tête** « Studio Pilou » / « C'est vous ? Ajustez si besoin. »
- **Aperçu en direct** (362 × 270, Pilou 3D, rendu à chaque réglage) : la caméra se rapproche de la partie réglée
  (visage pour Yeux/Lunettes/Visage, tête pour Cheveux/Accessoires) en 700 ms (douce).
- **Bandeau ambre** pour chaque champ incertain (« Vérifiez la couleur des yeux ») ; une fois confirmé : « Couleur des
  yeux vérifiée, merci ! » (menthe) puis il se replie (400 ms).
- **Onglets** Cheveux · Visage · Yeux · Lunettes · Accessoires (icône + libellé, point ambre si incertain) ; l'onglet
  du premier champ incertain est ouvert d'office.
  - Cheveux : longueur, texture, coiffure (les incompatibles sont grisés avec leur raison), couleur (17 pastilles),
    mèches, volume. Visage : sourcils (épaisseur, forme), barbe (type, couleur), taches, grain de beauté.
    Yeux : couleur (7 pastilles), forme. Lunettes : monture (7), couleur (6).
    Accessoires : **couvre-chef « choisi par vous seulement »** (7 tuiles, dont le foulard, proposées à tout le monde),
    boucles d'oreilles, piercing.
- **Boutons** « Surprenez-moi » (`tirer(graine)`, la graine change à chaque toucher) · « Valider » ; lien « Revenir au
  Pilou d'origine ». Valider : toast « Pilou est prêt · Fiche gardée sur ce téléphone · rien d'autre » + petit saut.
- Accessibilité : chaque pastille a un nom lu (« Noisette, sélectionnée, à vérifier ») ; l'aperçu a une description
  texte (« Pilou : cheveux châtains mi-longs, lunettes rondes framboise, bonnet moutarde ») ; contraste AA.

## 10. Garde-fous codés
- `couvre_chef` ne vient **jamais** de l'IA (pas dans le schéma, ajouté par l'app) ; le foulard est une option du Studio
  comme les autres.
- Corps menthe pour tous : aucune couleur de peau à deviner ; aucun trait dérivé de l'âge, du genre, de l'origine.
- Pas de phrase de Pilou sur l'apparence ; les textes de l'app décrivent des **réglages**, pas des personnes.
- Repli sans photo : le Studio s'ouvre avec le Pilou d'origine (« On le fait ensemble ? »).

## 11. Risques
- **Cheveux sur Android d'entrée de gamme** : la calotte est recalculée à chaque image quand elle bouge (≈ 800 sommets,
  normales comprises : < 1 ms en JS) ; au repos, ne recalculer que si le ressort dépasse 0,002.
- **Lisibilité à 60 px** (widget, vignettes) : la carte de relief s'efface toute seule (`fwidth`) ; les pointes et le
  reflet portent la texture. À valider sur un vrai écran.
- **Barbe noire peinte** : grande masse sombre sur le menthe ; garder la région au-dessous des joues (c'est le cas).
- **Projection du visage** : au-delà de 70° de rotation, montures et sourcils s'étirent (caché en pratique).
- **Crépus et frisés** : le rendu « nuage » est plus convaincant que les bouclés en petit ; à revoir avec des personnes
  concernées avant la mise en ligne (représentation juste et respectueuse).

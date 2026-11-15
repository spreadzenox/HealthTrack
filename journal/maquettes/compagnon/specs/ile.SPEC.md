# SPEC — Compagnon, chapitre 2 : l'îlot vivant

Pour la routine qui code l'Accueil (React + Capacitor, WebView Android et iOS). Référence visuelle :
`halcya-compagnon-2-ilot.mp4` et `prototype.html` (lisible à tout instant avec `?t=ms`). Le code des maquettes est
réutilisable : `monde.js` (three.js : îlot, Pilou, fleurs, cadeaux, lumière), `dessin.js` (canvas 2D : ciel, bulles,
éclatement, météo), `outils.js` (courbes et ressorts **identiques** à ce document).

Décisions du 13/11 intégrées : premières analyses **bien-être au jour 7**, **confort digestif au jour 14** ; Nunito
est la police de l'app.

## 0. Principes non négociables
- **Pilou ne culpabilise jamais** : aucune fleur ne fane, aucune bulle ne s'accumule, aucun compteur de jours manqués,
  la nuit apaise. « Non » à une habitude est noté comme « Oui » : on récompense le fait de noter, pas la réponse.
- **Tout a son texte** : chaque bulle porte un mot ; la météo, l'heure, le sommeil de Pilou et ses répliques sont
  écrits dans une étiquette en bas à gauche de l'îlot.
- **Mouvements réduits** : réglage dans Réglages › Compagnon, activé d'office si `prefers-reduced-motion: reduce`
  (ou l'équivalent système iOS/Android lu par Capacitor). Chaque animation ci-dessous a sa variante « MR ».
- **Lisibilité d'abord** : la météo et les effets restent derrière les bulles et le texte ; une bulle n'en recouvre
  jamais une autre ; aucune bulle ne passe devant le visage de Pilou.

## 1. Architecture de rendu (4 couches, de l'arrière vers l'avant)
| Couche | Contenu | Technique en production |
|---|---|---|
| 1. Ciel | dégradé selon l'heure, soleil/lune, étoiles, nuages, voile météo | `<canvas>` 2D redessiné **seulement** quand l'heure (par pas de 5 min) ou la météo change ; étoiles scintillantes en CSS (opacité) |
| 2. Arrière | grand arc-en-ciel (passe lointaine), pluie lointaine, bulles « derrière » | 2D + passe three.js `layers=1` (jour 7 seulement) |
| 3. Monde 3D | îlot, Pilou, fleurs, cadeaux, lanterne | three.js, un seul canevas WebGL |
| 4. Avant | bulles « devant », éclatement, goutte attrapée, pluie proche, flocons, « z », buée | **bulles = `<button>` DOM** (texte net, focus, lecteur d'écran) ; particules = petit `<canvas>` 2D actif seulement pendant l'effet |

Les bulles ne sont **pas** en 3D : le texte reste net à toutes les tailles, elles sont des boutons accessibles, et la
3D n'a plus à se redessiner pour elles. Une bulle passe de la couche 4 à la couche 2 quand elle passe derrière Pilou
(z < −0,05), c'est-à-dire sur les côtés, là où elle ne chevauche ni Pilou ni un accessoire.

## 2. Courbes et ressorts (noms utilisés partout)
| Nom | Valeur | Usage |
|---|---|---|
| `std` | `cubic-bezier(.2, 0, 0, 1)` | déplacements d'interface, ouverture de la feuille d'action |
| `out` | `cubic-bezier(.22, 1, .36, 1)` | arrivées, anneau d'éclatement |
| `in` | `cubic-bezier(.55, 0, .8, .2)` | départs, chute d'un cadeau, tension |
| `io` | `cubic-bezier(.65, 0, .35, 1)` | caméra, trajets en arc, migration des fleurs |
| `back` | `cubic-bezier(.34, 1.56, .64, 1)` | apparitions avec léger dépassement (bulles, pétales, cadeaux) |
| `soft` | `cubic-bezier(.4, 0, .2, 1)` | fondus, reprise de l'orbite |
| ressort `orbite` | raideur 110, amortissement 19 (masse 1) | les bulles restantes se répartissent |
| ressort `bulle` | 340 / 9 | oscillation de la membrane au relâchement |
| ressort `vague` | 120 / 5,5 | remplissage du Repas |
| ressort `fleur` | 260 / 9 | rebond de la tête de fleur |
| ressort `atterrissage` | 320 / 12 | écrasement de Pilou, de la boîte-cadeau (380 / 12), des galets (400 / 14) |
| ressort `humeur` | 200 / 16 | jauge « Humeur du jour » |
| ressort `retour` | 170 / 22 | retour de l'îlot en haut de page |
| ressort `écharpe` | 140 / 5 | balancement de la queue d'écharpe |

Ressort = réponse à un échelon `x(t) = 1 − e^(−ζω₀t)(cos ω_d t + ζω₀/ω_d sin ω_d t)` (`outils.js › spring`). Tout
est fonction du temps écoulé depuis l'événement : pas d'état accumulé, donc reprise exacte après une mise en pause.

## 3. Les bulles
**Contenu** : une bulle par chose à noter **aujourd'hui** (Repas, Bien-être, Ventre si objectif digestion,
habitudes). Couleur = thème (pêche, menthe, lilas, bleu nuit…). Icône + mot, toujours. « Ventre » porte une pastille
lune jusqu'à 19 h (texte d'accessibilité : « à partir de 19 h »).

**Orbite** (unités du monde ; Pilou mesure 1,24, l'îlot 1,3 de rayon) :
`x = 1,86·sin θ ; z = 1,25·cos θ ; y = 0,9 − 0,95·cos θ + 0,45·max(0, −cos θ)²`, rayon d'une bulle 0,46.
Devant (θ = 0) la bulle passe devant le bord de l'îlot, jamais devant son ventre ni son visage ; derrière, elle
remonte au-dessus de sa tête. Vitesse : 1 tour en 60 s. Oscillation propre à chaque bulle : ±0,045 vertical,
±0,02 horizontal, périodes ≈ 8 s et 11 s, déphasées (≈ 4 px à l'écran). Le monde entier flotte de ±0,045 (6,9 s).
**Profondeur** : la perspective donne ≈ 80 % de taille derrière ; derrière, opacité 0,92 et voile couleur du ciel
jusqu'à 18 %. **Parallaxe** : la caméra suit l'inclinaison du téléphone (gyroscope, ±4°, lissé 300 ms) ; les bulles
proches bougent plus que les lointaines. Désactivé en MR.

**Répartition et non-chevauchement** : créneaux angulaires égaux (2π/n). Quand une bulle part, les autres glissent
vers la nouvelle répartition au ressort `orbite`, en minimisant le déplacement moyen (décalage = moyenne circulaire).
Garantie à l'écran : 4 passes de relaxation par paires, écart minimum 8 px. Au-delà de 6 bulles, rayon de bulle × 0,85.

**Toucher** : dès qu'un doigt touche l'écran, l'orbite ralentit jusqu'à l'arrêt (300 ms, `out`) ; elle reprend 900 ms
après le dernier toucher (`soft`). Appui : la bulle « se tend » (échelle 0,93 × 0,90 en 120 ms) ; relâchement :
oscillation `bulle` + gonflement de 12 % (100 ms) ; puis la bulle **s'ouvre en feuille d'action** : un cercle de sa
couleur part de la bulle et s'agrandit jusqu'à la feuille (400 ms, `std`), contenu en fondu à 55–100 %. Fermeture :
le cercle se referme sur la bulle (300 ms, `in`). Pilou tourne les yeux vers la bulle pressée, yeux un peu agrandis.
Feuille d'habitude : « Avez-vous médité aujourd'hui ? » · **Oui** / **Non** · « Oui ou non, les deux comptent. »
Haptique : `selection` à l'appui.

**Remplissage du Repas** : niveau à 1/3, 2/3, 3/3 (repères de tiers en pointillés), montée 600 ms (`out`) avec une
vague amortie (ressort `vague`) ; libellé « Repas 1/3 ». À 3/3, la bulle éclate.

**Éclatement** (t = 0 à la rupture ; la bulle se tend avant, de −120 à 0 ms : +7 %, film ×4 plus rapide, `in`) :
| ms | Événement |
|---|---|
| 0–70 | le film se déchire depuis un point et se rétracte (arc qui s'ouvre, `in`) ; haptique `impact light` |
| 0–110 | éclair blanc doux |
| 0–340 | anneau couleur du thème, rayon 1 → 1,8 (`out`), épaisseur et opacité → 0 |
| 0–≈700 | 11 gouttelettes balistiques (vitesse 2–3,6 r/s, gravité 11 r/s²), reflet blanc, fondu sur les 40 % finaux |
| 0–560 | 12 étincelles en étoile (thème et blanc), scintillement |
| 0–430 | **une goutte part en arc vers la main de Pilou** (`io`, sommet 1,6 r au-dessus) |
| 150 | les bulles restantes se répartissent (ressort `orbite`, ≈ 900 ms) |
| 600 | jauge d'humeur +1 cran (ressort `humeur`), mot mis à jour (« Tranquille » → « De bonne humeur » …) |
| 620–2 020 | la fleur pousse (§ 4) |

**Pilou à l'éclatement** (procédural, même horloge) : regard vers la bulle dès −500 ms (400 ms) ; anticipation
(accroupi, écrasement 0,16) 60–200 ms ; saut 220–600 ms (hauteur 0,15) ; **le bras du côté de la bulle se lève**
100–260 ms et attrape la goutte à 430 ms ; atterrissage avec ressort `atterrissage` ; il ramène la goutte contre son
ventre 640–860 ms, elle s'illumine puis se fond 1 100–1 330 ms (sa perle s'allume 900–1 700 ms) ; joie 560–1 900 ms
(yeux en arcs, joues, petite bouche ouverte, l'autre bras s'agite). « Non » déclenche exactement la même chose.
Message bref : « Méditation notée » / « C'est noté. À demain pour la lecture ! » (2 s).
**MR** : la bulle disparaît en fondu (200 ms) avec une coche ; pas de gouttes, pas de saut ; Pilou passe au sourire.

**Rendu d'une bulle** : corps translucide (dégradé radial blanc 80 % → couleur 80 % au bord) ; film irisé = 2 images
pré-calculées (256 px, WebP ≈ 12 Ko chacune) qui tournent en sens contraire (14 s et ≈ 23 s par tour, opacités
0,52 et 0,42) ; contour couleur du thème (4 % du rayon) ; reflet de fenêtre fixe en haut à gauche + petit point ;
**voile blanc de lisibilité** sous l'icône et le mot (contraste du mot ≥ 4,5:1) ; mot en Nunito 900 à 0,3 r, réduit
pour tenir dans 1,56 r. **MR** : film figé.

## 4. Une fleur par geste
**Déclencheur** : 620 ms après l'éclatement. **Durée** 1 400 ms, une seule variable de croissance g ∈ [0, 1] :
pousse (0–20 %, cotylédons, `out`) · tige (15–45 %, `back`) · bourgeon (40–60 %, pointe de la couleur, `back`) ·
éclosion (58–85 %, ≈ 380 ms, `back`) · rebond (82–100 %, ressort `fleur`). Ensuite balancement ±0,04 rad (+0,22 × vent).
Couleur = thème de la bulle. Petite poussière de terre à la pousse. **MR** : la fleur apparaît en fondu (200 ms).

**Placement** (repère de l'îlot : centre = Pilou, avant = vers l'écran, rayon du plateau = 1) :
- 6 places du jour sur un arc devant Pilou : angles −74°, −44°, −14°, 30°, 58°, 84° (rayons 0,82–1,0), remplies
  de gauche à droite dans l'ordre des gestes ; au-delà de 6, rangée intérieure (rayon 0,62, angles −59°, −29°, 44°, 71°).
- Jamais derrière Pilou (zone réservée : rayon 0,62 autour de lui et secteur arrière > 100°), jamais sur un accessoire.
- **Le lendemain**, à la première ouverture après 4 h : les fleurs d'hier rapetissent (× 0,58) et rejoignent la
  prairie du bord en arc (1 300 ms, `io`, décalées de 30 ms) ; les places du jour sont libres, les bulles du jour se
  gonflent. Si l'app n'est pas ouverte, on affiche directement l'état final.
- **Prairie** : couronne au bord (rayon 1,0–1,13), positions à l'angle d'or, écart minimum 0,16, à 0,2 des
  accessoires. Elle garde les fleurs des 7 derniers jours (au plus 44) ; les plus anciennes deviennent, au changement
  de jour et hors de la vue, des touffes d'herbe fleuries : une couronne par semaine. Une fleur ne fane jamais.

## 5. La journée qui passe
**Heure** : l'heure locale du téléphone. Lumière (hémisphère, soleil, contour) interpolée entre des clés (`soft`) :
| Clé | Ciel (haut → bas) | Lumière |
|---|---|---|
| 6 h 48 aube | `#F2B6A6 → #FFE6CF` | soleil bas, doré `#FFD7AE` |
| 8 h 12 matin | `#FFCCAE → #FFF1E2` | `#FFE6C4`, contour chaud |
| 12 h 30 midi | `#FFD7BA → #FFF3E6` (ciel abricot de l'app) | blanc, contour discret |
| 18 h 40 soir | `#C9A4E2 → #FFD9B0` | orangé bas `#FF9F72`, contour rosé |
| 21 h 24 nuit | `#1C2452 → #4A4A8C` + étoiles | lune `#CCD6FF`, contour bleuté |

- **Réveil** (première ouverture après l'heure de lever habituelle, lue dans le sommeil ; sinon 7 h) : paupières
  700 ms avec un battement, bâillement 1 000 ms, étirement 1 000 ms (bras levés, corps étiré −20 % puis écrasé +14 %),
  perle qui s'allume ; puis les bulles du jour se gonflent (450 ms, `back`, décalées de 240 ms). ≈ 3,5 s, une fois par jour.
- **Soir** (17 h 48 → 21 h 24) : la lanterne (cadeau J2) s'allume en trois battements (≈ 300 ms) puis brille
  (scintillement ±8 %) ; les guirlandes de l'arbuste s'allument (600 ms). Pilou s'assoit (700 ms, `io`).
- **Nuit** (dès l'heure de coucher habituelle, sinon 22 h 30) : bâillement, paupières lourdes, il s'endort assis ;
  respiration lente (2 × plus lente, amplitude × 1,4), « z » qui montent (période 2,6 s), sa perle reste allumée comme
  une veilleuse. Les **bulles restantes deviennent des lucioles** (1 600 ms, `io`) : elles rapetissent à 15 %,
  prennent une lueur couleur du thème mêlée d'or, et flânent lentement autour de l'îlot (Lissajous, périodes 24–45 s,
  pulsation 8 s). Elles restent touchables (cible de 44 px). Étiquette : « Pilou dort. Le reste peut attendre demain. »
- **Changement de jour** (4 h) : les lucioles s'éteignent, rien ne s'accumule ; le matin, seules les bulles du jour.
- Toucher Pilou la nuit : il ouvre un œil, sourit, se rendort (aucun reproche, aucune notification).
- **MR** : l'heure change en fondu de 600 ms ; Pilou ne bouge pas, ses yeux sont ouverts le jour et fermés la nuit.

## 6. La météo réelle
Source : la météo que Halcya lit déjà (température, précipitations, vent, code météo), relue à l'ouverture puis
toutes les 30 min. **Un seul effet à la fois**, par priorité :
| Condition | Effet sur l'îlot | Pilou | Étiquette |
|---|---|---|---|
| pluie ≥ 0,2 mm/h | gouttes (téléphone : 40 au plus, 30 derrière et 10 devant, opacité ≤ 0,45), ronds dans l'herbe, ciel voilé | lève les yeux (300 ms), tend le bras, **ouvre une feuille-parapluie** (450 ms, `back`) au-dessus de sa tête | « Pluie fine · 11 °C » |
| neige | flocons (≤ 30), herbe givrée | met son écharpe | « Neige · 0 °C » |
| rafales ≥ 35 km/h | traînées d'air, 6 feuilles et pétales, nuages 5 × plus rapides, fleurs penchées | se penche, l'antenne plie, la queue d'écharpe flotte | « Vent · 38 km/h » |
| ≥ 28 °C | ciel plus doré, ondes de chaleur, soleil plus grand | s'évente avec une petite feuille, joues plus roses | « Chaleur · 31 °C » |
| ≤ 5 °C | flocons rares, herbe givrée, buée qui sort de sa bouche (toutes les 2,6 s) | frisson (700 ms) puis **met son écharpe** (700 ms, tour complet) | « Froid · 2 °C » |
Entrée d'un effet : fondu 1 200 ms. Les particules restent dans le cadre de l'îlot, jamais devant le texte de la page.
**MR** : pas de particules ; l'accessoire (feuille, écharpe) apparaît en fondu ; l'étiquette dit la météo.

## 7. La première semaine
**Barre** « Jour 3 sur 7 avant vos premières analyses » (7 segments, ceux du passé pleins). Un jour compte s'il a au
moins une donnée notée ; un jour sans rien ne fait pas reculer la barre (elle attend).
**Cérémonie du cadeau** (une fois par jour, à la première ouverture ; t = 0 au toucher de la bulle-cadeau ou du
bouton « Ouvrir ») :
| ms | Événement |
|---|---|
| avant | une **bulle-cadeau dorée** descend devant Pilou (900 ms, `out`), hors de l'orbite, et attend en se balançant |
| 0 | toucher : la bulle s'ouvre (éclatement doré, sans goutte attrapée) ; haptique `impact light` ; l'orbite s'arrête et les bulles du jour s'estompent à 45 % (300 ms) jusqu'à la joie |
| 200–620 | la boîte tombe (`in`), atterrit (ressort 380 / 12) |
| 800–1 100 | Pilou se penche, regarde la boîte, tend les bras |
| 1 400–1 700 | il tire le ruban (anticipation : recul, écrasement) ; le nœud se défait (300 ms) |
| 1 900–2 420 | le couvercle saute en arc (`out`) ; rayons dorés jusqu'à 2 900 |
| 2 100–2 900 | l'accessoire sort et vole jusqu'à sa place (arc `io`, hauteur 0,9, rotation) |
| 2 900–3 350 | il se pose (`back`) ; queue d'écharpe au ressort `écharpe` ; haptique `notification success` |
| 3 400–5 800 | joie : petit saut, bras levés, confettis sobres 1 800 ms ; la case du jour passe à l'icône du cadeau (`back`, 400 ms), le segment se remplit (600 ms) |
| 4 000–4 450 | la boîte se range (rapetisse, `in`) |
Texte : « Une écharpe pour Pilou ! Prochain cadeau demain. » Un second toucher pendant la cérémonie la termine.
**Les 7 cadeaux et leur place** : J1 arbuste (−0,72 ; −0,62), pousse de la terre (700 ms, `back`) puis oscille ·
J2 lanterne (0,8 ; −0,55), tombe (450 ms, `in`), s'allume en trois battements · J3 écharpe, sur Pilou · J4 galets
(0,98 ; 0,22), trois pierres tombent l'une sur l'autre (300 ms chacune, ressort 400 / 14) · J5 papillon, arrive en vol
(700 ms) puis se pose sur la perle de l'antenne · J6 nuage, petit nuage de compagnie qui flotte sous le bord gauche,
hors du trajet des bulles · J7 arc-en-ciel.
**Jour 7** (bien-être) : le dernier segment se remplit (600 ms), le grand arc-en-ciel se dessine derrière l'îlot le
long de ses bandes (1 000 ms, `io`), Pilou fait un double saut ; la barre s'éclaire puis **s'efface** (600 ms, `io`)
et la carte « Vos premières analyses de bien-être sont prêtes · Confort digestif : premier score dans 7 jours ·
Découvrir » arrive (500 ms, `back`). L'arc-en-ciel reste ensuite en petit au-dessus du nuage.
**Jour 14** (confort digestif) : pas de seconde cérémonie. Une grande fleur pêche (× 2,1) pousse près des galets
(1 400 ms) avec l'étiquette « Confort digestif : premier score prêt » ; la carte Confort digestif passe au score.
Avant : la carte dit son propre délai (« Premier score dans 11 jours », « … dans 4 jours », « … demain »).
**MR** : chaque accessoire apparaît en fondu ; l'arc-en-ciel apparaît en fondu ; pas de confettis.

## 8. Le temps long
- **Croissance** g = jours d'usage / 90, plafonnée à 1, lissée : îlot × (1 + 0,3 g) en largeur, × (1 + 0,12 g) en
  hauteur ; touffes d'herbe 14 → 42 ; l'arbuste devient un petit arbre (× 1,45). Mois 1 : un **îlot voisin** flotte
  à droite (apparition 900 ms, `back`). Mois 3 : une **mare**. Les changements se font hors de la vue (au changement
  de jour) ; à l'ouverture, Pilou fait un petit saut et l'étiquette dit ce qui est nouveau (« Un îlot voisin est apparu »).
- **Saisons** selon la date et l'hémisphère : automne (feuillage orange, herbe dorée), hiver (calotte de neige, neige
  sur l'arbre), fin d'hiver (amandier en fleur), printemps-été (herbe vive).
- **Absence** : rien ne fane, rien ne s'accumule (seules les bulles du jour existent), pas de série perdue. Pilou
  attend assis, regarde les nuages et le papillon, dort la nuit. **Retour** : il remarque Léa (yeux agrandis, antenne
  dressée, 500 ms), se lève, double saut, salue (2 s) ; en-tête « Re-bonjour Léa », étiquette « « Content de vous
  revoir ! » ». Aucune mention des jours manqués, aucune notification de relance culpabilisante.

## 9. La caméra (défilement de l'Accueil)
L'îlot occupe 390 × 350. Au défilement de 0 à 260 px : l'îlot passe de 100 % à 26 % et monte se ranger en haut à
gauche ; le ciel du héros s'efface entre 20 % et 70 % de la course ; les bulles s'estompent avant 70 % ; le contenu
défile normalement par-dessus (profondeur : l'îlot recule moins vite que la page, à 25 %). À 70 %, un **bandeau**
(84 px) prend le relais : mini-îlot à gauche (rendu 3D réduit), « Pilou est content », pastilles de couleur et
« 3 bulles à faire ». **Retour** : toucher le bandeau ou tirer vers le bas → ressort `retour` (170 / 22), léger rebond.
**MR** : pas de mise à l'échelle ; l'îlot disparaît en fondu et le bandeau apparaît en fondu (200 ms).

## 10. Pilou au repos (rappel commun aux 4 chapitres)
Respiration 3,5 s (amplitude 1,2–3 % selon l'humeur) ; clignements irréguliers (fermeture 60 ms `in`, tenue 25 ms,
ouverture 85 ms `out`, toutes les 3,9 s ± 1,2 s, parfois double) ; balancement ±0,035 rad (8 s) ; l'antenne et sa
perle suivent les mouvements avec 60 à 130 ms de retard (suivi procédural de la vitesse du saut). **MR** : pose fixe,
seuls l'expression et les accessoires changent.

## 11. Budget de performance et risques
**Mesuré sur la maquette** (qualité vidéo, pas un budget) : 46 000 à 67 000 triangles par image, 130 à 150 appels de
dessin, dont Pilou ≈ 32 600 triangles avec ses contours.
**Cible en production** (Android d'entrée de gamme, job Android 9, iPhone 12) :
- canevas 3D ≤ 360 × 320 px CSS, densité ≤ 2 (repli 1,5 puis 1) ; 30 i/s plafonnés ; 20 i/s quand rien d'autre
  que la respiration ne bouge ; **0 i/s** hors écran (IntersectionObserver), app en arrière-plan ou MR au repos ;
- ≤ 12 000 triangles : Pilou ≤ 4 000 (tour 32 × 24 segments ; contours seulement sur Pilou et les gros accessoires),
  îlot ≤ 2 500, fleurs du jour ≤ 6 × 250, prairie fusionnée en une seule géométrie reconstruite au changement de jour
  (≤ 3 000) ; ≤ 45 appels de dessin ;
- bulles en DOM (transformations composées, aucune mise en page à chaque image) ; particules sur un canevas 2D qui
  n'existe que pendant l'effet (< 1 s) ;
- textures : 2 films irisés 256 px WebP (≈ 24 Ko), ombre 128 px, rayures d'écharpe 128 × 8 ;
- pas d'ombres portées temps réel (ombre = disque dégradé), MSAA désactivé si densité 2.
**Risques** : poids de three.js (≈ 150 Ko compressés après élagage, proche du plafond de 200 Ko : n'importer que les
classes utiles, ou repli sur des séquences WebP) ; WebGL1 seulement ou lent sur certains Android 9 (détection au
premier rendu : si > 40 ms par image sur 30 images, image fixe de Pilou + bulles DOM, tout le reste identique) ;
batterie (cap 30 i/s, pause stricte) ; contours « coque inversée » qui doublent les triangles ; lecture d'écran :
les bulles sont une liste ordonnée de boutons (« Méditation, à faire, touchez pour noter ») et l'orbite s'arrête quand
un lecteur d'écran est actif.

## 12. Textes de l'îlot (français, vouvoiement)
« Humeur du jour » : Au calme · Tranquille · De bonne humeur · Content · Ravi · Rayonnant ·
« Oui ou non, les deux comptent. » · « Méditation notée » · « C'est noté. À demain pour la lecture ! » ·
« Pluie fine · 11 °C » · « Pilou dort. Le reste peut attendre demain. » · « Cadeau du jour : touchez la bulle dorée » ·
« Une écharpe pour Pilou ! Prochain cadeau demain. » · « Un arc-en-ciel pour l'îlot ! La semaine est complète. » ·
« Vos premières analyses de bien-être sont prêtes » · « Confort digestif : premier score dans 7 jours. » ·
« Confort digestif : premier score prêt » · « Re-bonjour Léa » · « Content de vous revoir ! » ·
« Pilou est content · 3 bulles à faire ».

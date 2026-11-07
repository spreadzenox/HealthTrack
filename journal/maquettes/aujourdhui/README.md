# Maquette — nouvel écran « Aujourd'hui » (TESTEUR-1b, run idées du 07/11 08:35)

> Réponse au point (1) du premier testeur (06/11) : « on ne comprend ni à quoi sert l'écran ni quoi y faire ».
> Maquette statique, données synthétiques : `maquette.html` (paramètres `?state=demo|empty|good|hard`,
> `?theme=dark`, `?motion=off`), captures par `node journal/maquettes/aujourdhui/render.mjs`.
> Elle sert de référence aux runs de code TESTEUR-1c, 1d et 1e. Rien n'est livré dans l'app par ce run.

| Avant (v actuelle, démo) | Après, démo clair | Après, démo sombre | Après, premier jour |
|---|---|---|---|
| ![](avant-clair.jpg) | ![](demo-clair.jpg) | ![](demo-sombre.jpg) | ![](vierge-clair.jpg) |

Variantes du statut : [bonne journée](bonne-journee-haut.jpg), [journée plus difficile (sombre)](journee-difficile-haut-sombre.jpg).

## 1. Ce qui ne va pas aujourd'hui (capture « avant »)
- Le titre « Une journée moyenne » est séparé de ce qui le produit (la carte « Bien-être estimé » en dessous, avec
  « 2,9 / 5 » et « +0,2 vs moy. ») : deux réponses à la même question, en deux endroits.
- Trois tuiles grises (sommeil, VFC, pas) sans dire d'où elles viennent ni si c'est normal pour vous.
- Les gestes pour noter sont éparpillés : « Noter moi-même » dans la carte menthe, ventre dans la carte pêche, photo
  du repas en bouton, cigarette en bouton, selles en lien. On ne voit pas « où noter ».
- La carte lilas « Vos analyses du ventre arrivent dans 19 jours » ne dit pas ce qu'est une analyse.

## 2. Ordre de l'écran (de haut en bas)
1. **En-tête** : date (mono) puis « Bonjour » sur la ligne suivante (fait en 1a).
2. **Statut du jour** (carte menthe, la seule du haut) : étiquette « Votre journée », titre en deux mots, l'échelle
   1 à 5 en cinq segments (celui du jour plein), puis **d'où il vient** en une phrase (« D'après votre visage ce
   matin et votre note de 9 h. ») et des étiquettes mono (« 12 lectures du visage », « note : 3/5 », « ventre : gêne
   à 10:19 » quand une gêne ou douleur ajuste l'estimation, VENTRE-BE-2). Toucher la carte ouvre l'historique du
   bien-être (geste déjà en place). « Noter moi-même » quitte cette carte et va dans « Noter ».
   - Titres : mêmes seuils que `daySummaryTitle` aujourd'hui (note interne 0–5 > 3 « Plutôt bonne », < 2 « Plus
     difficile », sinon « Plutôt moyenne » ; soit > 3,4 et < 2,6 sur l'échelle affichée 1 à 5, TESTEUR-2a) ; le
     segment plein est la note affichée arrondie.
   - Pas encore de lecture ni de note : « Pas encore d'avis », une phrase (« Dites comment vous vous sentez, ou
     laissez la caméra lire votre visage quand vous ouvrez le téléphone. ») et **un seul** bouton principal « Noter
     comment je me sens ». Si la lecture au déverrouillage est refusée, la phrase s'arrête à « Dites comment vous
     vous sentez. » (aucun rappel ici : le rappel discret reste unique, POL-PLAY-84).
   - Confiance faible (peu de lectures, calibration de départ) : le titre reste, une étiquette mono « estimation
     prudente » s'ajoute ; jamais de chiffre de précision.
3. **Ce qui change aujourd'hui** (surface neutre, une ligne par écart) : au plus 3 lignes, les mesures du jour les
   plus éloignées de **votre** médiane des 14 derniers jours (sommeil, pas, VFC, FC au repos, écran), plus la gêne
   ou douleur du ventre si elle ajuste le statut. Chaque ligne : icône, phrase factuelle (« Nuit plus courte »),
   source (« Montre »), valeur et « d'habitude … » en mono. **Aucune couleur de jugement** (ni vert ni rouge, règle
   6), aucun lien de cause : le titre ne dit pas « pourquoi ». Rien à montrer (tout dans l'habituel) : « Une journée
   comme les autres pour vos mesures. » ; moins de 7 jours de données : section masquée.
   - Dessous, la carte **lilas** des analyses, qui dit enfin ce qu'elles sont : « Vos analyses arrivent dans
     19 jours » + « Halcya cherchera ce qui revient avant vos bons et vos mauvais jours. » + barre + « 9/28 jours
     notés ». Quand les analyses existent : la piste la plus solide qui touche à une mesure du jour (« Les nuits
     courtes vont souvent avec un bien-être plus bas le lendemain, à confirmer »), lien vers Analyses.
4. **Vos données du jour**, une carte neutre par source, en-tête icône + nom + fraîcheur (« il y a 12 min », « en
   direct ») :
   - **Montre** (Health Connect ou Huawei) : sommeil, VFC nuit, FC au repos ;
   - **Téléphone** : pas, temps d'écran, météo ;
   - **Noté par vous** : bien-être (tuile menthe), ventre (tuile pêche, seulement avec « Mon ventre »), repas du
     jour, cigarettes si le compteur est actif.
   Une source absente ne s'affiche pas ; sans montre, un seul lien discret « Ajouter une montre › » (vers Sources).
   Les tuiles reprennent `measureTiles` (même règle « aujourd'hui, sinon hier », la mention « hier » en mono).
5. **Noter** : un seul endroit. Bouton principal « Photo du repas » (ouvre l'appareil photo, 4b), puis deux tuiles
   « Mon bien-être » (menthe, ouvre la fenêtre de note 1 à 5) et « Mon ventre » (pêche, ouvre calme / gêne /
   douleur ; seulement avec « Mon ventre », sinon la tuile bien-être prend toute la largeur), puis « Autre chose »
   (selles, cigarette, note libre) en surface neutre.

## 3. Règle de sens constant (retour du 06/11)
| Apparence | Sens, partout |
|---|---|
| Carte menthe | bien-être (statut, note, historique) |
| Carte ou tuile pêche | ventre |
| Carte lilas | analyses (liens repérés, compte à rebours) |
| Surface neutre grise | mesure ou geste sans thème (montre, téléphone, autre note) |
| Bouton émeraude plein | l'action principale de l'écran, une seule visible à la fois |
| Chiffre en mono | une mesure ou une date, jamais une phrase |
Aucun autre fond coloré sur l'Accueil (la carte « Votre ventre » pêche actuelle disparaît : son contenu va dans
« Noter » et « Vos données du jour »). Les cartes de service (paiement, fin de Gold offert, mise à jour) restent au
même endroit qu'aujourd'hui, au-dessus du statut.

## 4. L'animation (TESTEUR-1e)
Un « horizon qui respire », original : deux disques menthe concentriques qui gonflent doucement (cycle de 5 s,
échelle 1 → 1,08), une courbe dont la pente suit le statut (monte, plate, descend : écho de la barre du logo) et un
point ambre qui flotte de 4 px sur la courbe. CSS seul, aucune bibliothèque ; immobile avec
`prefers-reduced-motion` ; `aria-hidden`. Pas de visage, pas d'émoticône : rien qui ressemble à une autre app.

## 5. Découpage en runs de code
- **1c** — composant `DayStatusCard` (statut, échelle, « d'après… », étiquettes) qui remplace le titre et la carte
  « Bien-être estimé » en tête ; tests : trois titres et seuils sur l'échelle 1 à 5, état « pas encore d'avis »,
  étiquette ventre seulement si VENTRE-BE-2 l'a compté, toucher → historique ; `MoodEstimateCard` reste pour
  l'historique. Captures avant/après, clair et sombre, vierge et démo.
- **1d** — « Vos données du jour » par source (`TodayBySource`) et section « Noter » ; la carte ventre pêche et les
  boutons épars disparaissent (aucune donnée touchée) ; tests : source absente masquée, ventre seulement avec
  « Mon ventre », compteur de cigarettes dans « Autre chose ».
- **1d-2** — « Ce qui change aujourd'hui » (fonction pure `dayDeviations(entries, now)` : médiane 14 j, écart
  normalisé, 3 premiers, seuil minimal) + carte lilas réécrite ; tests de la fonction et de la règle 6 (aucune
  classe de couleur de jugement).
- **1e** — l'animation, avec test `prefers-reduced-motion`.

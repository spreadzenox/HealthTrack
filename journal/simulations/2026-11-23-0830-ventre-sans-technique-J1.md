# Simulation — Ventre, sans technique — J1 — 2026-11-23 08:30

- **Persona** : n° 2 « Ventre, sans technique » — la cinquantaine, SII (mal au ventre souvent), peu à l'aise avec les applis, tape lentement, lit en diagonale, veut savoir quoi éviter.
- **Configuration** : n° 10 « iPhone + bracelet d'une autre marque » (bracelet Fitbit/Xiaomi/Huawei/Amazfit qui écrit dans Santé d'Apple, poids 2,5 %) — reçus : sommeil (6 h 30, habitude 7 h 34) et pas (162, habitude 6 431) ; absents à l'écran : fréquence cardiaque (pourtant annoncée « Cœur » à l'accueil), VFC.
- **Moment** : jour 1 — installation neuve, 30 jours de bracelet disponibles, aucune saisie. Objectifs choisis : Bien-être (imposé) + Confort digestif. Habitude « Méditation » laissée cochée par défaut.

## Tâches
1. Comprendre ce que fait l'app en 30 secondes — réussie (écran d'accueil clair « repas, sommeil, appareils, ressenti » ; mais parcours long : nom de la mascotte, 4 étapes, puis un écran « Gold » après « 4 sur 4 », puis une visite guidée de 10 bulles).
2. Noter que j'ai mal au ventre ce matin — réussie (bulle Digestion → « Noter un moment » → « Gêne » : un geste, l'heure est notée).
3. Noter mon petit-déjeuner sans photo — réussie au 2e essai (la description « 2 tartines… café au lait » envoyée à l'IA est revenue en « Pâtes à la carbonara » ; j'ai annulé et cherché « pain » à la main → « Pain blanc », enregistré, avec l'alerte « Probablement riche en fructanes »).
4. Savoir ce que je dois éviter pour mon ventre — ratée pour aujourd'hui (rien avant 28 jours notés ; je l'ai compris seulement grâce à l'exemple « jour 28 » de la visite, qui montre bien « Fructanes : blé, oignon, ail »).
5. Retrouver les données de mon bracelet — à moitié réussie (sommeil et pas sur l'Accueil et dans Tendances ; pas de cœur nulle part).

## Compris
- Noter une gêne à tout moment est simple : trois gros boutons Calme / Gêne / Douleur, « Un geste suffit » — capture : `captures/2026-11-23-0830-ventre-sans-technique-J1/digestion-28jours.png`
- L'exemple du jour 28 répond exactement à ma question : « avec 1 repas riche en fructanes de plus (blé, oignon, ail), votre digestion va plutôt moins bien » — capture : `captures/2026-11-23-0830-ventre-sans-technique-J1/exemple-ventre-fodmap.png`
- Mon sommeil et mes pas du bracelet arrivent tout seuls, comparés à mon habitude — capture : `captures/2026-11-23-0830-ventre-sans-technique-J1/donnees-du-jour.png`
- Le compteur ventre a bougé après ma première note (« premier score dans 13 jours » au lieu de 14) — capture : `captures/2026-11-23-0830-ventre-sans-technique-J1/donnees-du-jour.png`

## Pas compris
- « J'ai écrit tartines et café au lait, et il me met des pâtes carbonara avec des lardons ?! » — capture : `captures/2026-11-23-0830-ventre-sans-technique-J1/ia-carbonara.png`
- « Alors c'est dans combien de jours ? » : l'Accueil dit « Jour 1 sur 7 avant vos premiers résultats », juste dessous « Confort digestif : premier score dans 14 jours », Ma journée dit « Encore 28 jours notés avant vos analyses digestives » — captures : `captures/2026-11-23-0830-ventre-sans-technique-J1/accueil-jour1sur7.png`, `captures/2026-11-23-0830-ventre-sans-technique-J1/digestion-28jours.png`
- « Je n'ai jamais noté mon bien-être, d'où sort ce 3,4/5 "estimé" ? » (Tendances), alors que l'Accueil me demande encore de le noter — capture : `captures/2026-11-23-0830-ventre-sans-technique-J1/tendances-bienetre-estime.png`
- « GOS, FODMAP, fructose en excès, sorbitol, "pt"… c'est du chinois » dans le détail des pistes ; « fructanes » apparaît sur mon pain sans mot simple à côté — capture : `captures/2026-11-23-0830-ventre-sans-technique-J1/exemple-ventre-fodmap.png`
- « On m'a dit que le bracelet donnait le cœur, je ne le trouve pas » : l'accueil liste « Cœur », mais seuls Sommeil et Pas apparaissent — capture : `captures/2026-11-23-0830-ventre-sans-technique-J1/tendances-bienetre-estime.png`
- Sur l'Accueil, la bulle cadeau dorée recouvre l'étiquette de la bulle « Bien-être » — capture : `captures/2026-11-23-0830-ventre-sans-technique-J1/accueil-jour1sur7.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Repas « Décrire » + « Remplir avec l'IA » : la description « 2 tartines de pain avec beurre et confiture, café au lait » a donné « Pâtes à la carbonara » (pâtes, lardons, œuf, parmesan). Vérifier que le texte saisi est bien celui envoyé/analysé (ou que le résultat n'est pas un repas d'exemple), et afficher la description d'origine au-dessus du résultat pour que l'erreur saute aux yeux.
- [ ] Délais incohérents pour la digestion : Accueil « Jour 1 sur 7 avant vos premiers résultats » + « premier score dans 14 jours » ; Ma journée « Encore 28 jours notés avant vos analyses digestives ». Pour un objectif Confort digestif, n'afficher qu'un seul compte à rebours, nommé pareil partout (ex. « score dans 13 jours, pistes dans 27 »).
- [ ] Tendances, vue Jour, jour 1 : « Bien-être 3,4/5 estimé » sans aucune note de bien-être saisie. Ne pas afficher d'estimation sans note, ou dire en une ligne d'où elle vient.
- [ ] Données de cœur absentes : l'onboarding (étape 3) promet « Cœur » mais ni « Vos données du jour » ni le sélecteur « + » de Tendances (Sommeil, Pas seulement) ne le proposent. Soit l'afficher, soit dire « Cœur : pas reçu de votre bracelet ».
- [ ] Vocabulaire FODMAP : sur l'alerte repas « Probablement riche en fructanes » et dans les pistes (GOS, lactose, sorbitol, fructose en excès), ajouter les aliments en clair entre parenthèses comme le fait déjà la carte « Fructanes (blé, oignon, ail) ».
- [ ] Accueil, îlot : la bulle cadeau dorée chevauche la bulle « Bien-être » et cache son libellé ; décaler la bulle cadeau.
- [ ] Onboarding : la barre dit « 4 sur 4 » mais un écran « Gold est offert » suit ; et le nom de la mascotte demande deux boutons (« Valider » puis « Continuer »). Fusionner en un seul bouton et intégrer l'écran Gold au compte des étapes (ou le montrer plus tard).
- [ ] Visite guidée : 10 bulles d'affilée, la bulle du bas cache en partie la zone qu'elle présente (« Vos mesures du jour »). Raccourcir pour l'objectif digestif (Ma journée + exemple jour 28) et placer la bulle au-dessus de la zone.

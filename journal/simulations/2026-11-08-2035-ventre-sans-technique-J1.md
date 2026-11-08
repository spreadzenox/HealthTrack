# Simulation — Ventre, sans technique — J1 — 2026-11-08 20:35

- **Persona** : 2 · Ventre, sans technique — 52 ans, SII, peu à l'aise avec les applis, lit lentement, les mots techniques la découragent ; sa gastro-entérologue lui a parlé d'un « journal alimentaire ». Elle veut savoir quoi éviter.
- **Configuration** : 1 · Android seul (téléphone Samsung, pas de montre, poids 33 %) — reçu : les pas du téléphone (8 585 hier, 5 606 vendredi dans le Journal) et une « Dépense » en kcal ; absent : sommeil (rien vu, même pas estimé), cœur, montre.
- **Moment** : jour 1 — tout premier lancement. Aucune note avant l'accueil ; après : bien-être 2/5, digestion « Douleur », un repas (haricots verts + bœuf, 244 kcal), plus les pas des jours passés.

## Tâches
1. Comprendre en 30 secondes à quoi sert l'app — réussie : l'écran 1 (« Vos repas, votre sommeil, votre montre et votre ressenti ») et l'écran 2 (Journal / Analyses / Agir) sont clairs ; mais rien ne dit « Halcya vous aidera à trouver ce qui dérange votre ventre » avant l'écran « Qu'est-ce qui vous amène ? ».
2. Finir l'accueil sans me perdre — réussie avec hésitations : 8 écrans d'accueil (3 de présentation affichés tous « 01/06 », puis 02/06 à 06/06) + 11 bulles de visite guidée, soit ~19 écrans. Hésitations : « Branchez vos sources » / « Health Connect » (je ne sais pas ce que c'est), « Continuer sans » (sans quoi ?), « estimation du visage » (on va me filmer ?), « Gold » (c'est quoi ce mot anglais, c'est payant ?).
3. Noter que j'ai mal au ventre — réussie, dès l'accueil (« Et votre ventre ? » → Douloureux) ; ça apparaît bien dans Journal › Jours (« Digestion Douleur »).
4. Noter mon repas de midi sans photo — réussie à moitié : le gros bouton « Repas » de l'accueil ne fait rien ; j'ai trouvé Journal › Repas › « Décrire » ; « Remplir avec l'IA » a répondu « Aucun aliment reconnu » ; j'ai ajouté les aliments un par un. Le repas est noté à 20:41 et pas à midi (je n'ai pas osé toucher au champ date/heure). Le yaourt est resté de côté.
5. Savoir quand l'app me dira quoi éviter — réussie mais décourageante : il faut 28 jours notés dont 5 avec une gêne ; la visite dit pourtant « Elles démarrent après 14 jours notés ». Et même l'exemple fictif « au jour 28 » dit « Aucun lien assez net ».
6. Préparer quelque chose pour ma gastro-entérologue — réussie : lien « rapport médecin » en bas d'Agir → « Rapport PDF pour mon médecin » → période 2/4/12 sem. → « Créer le PDF » (pas cliqué).

## Compris
- La question « Qu'est-ce qui vous amène ? » avec « Ma digestion — ballonnements, SII, inconforts » : c'est exactement moi — capture : `captures/2026-11-08-2035-ventre-sans-technique-J1/accueil-compteur-01.png`
- « Et votre ventre ? Calme / Gêné / Douloureux » : simple, des mots à moi.
- Il faut noter ma digestion tous les jours, la barre « 1/28 jours » me montre où j'en suis — capture : `captures/2026-11-08-2035-ventre-sans-technique-J1/digestion-28-jours.png`
- La recherche d'aliments propose vite « Haricots verts cuits », et je règle les grammes avec – / +.
- « Rapport PDF pour mon médecin — deux pages à montrer à votre médecin » : c'est ce que je cherchais — capture : `captures/2026-11-08-2035-ventre-sans-technique-J1/rapport-medecin.png`

## Pas compris
- « 01/06 » sur les trois premiers écrans alors que la barre avance et qu'il y a 3 petits points : je ne savais plus combien il en restait — capture : `captures/2026-11-08-2035-ventre-sans-technique-J1/accueil-compteur-01.png`
- « Lecture du visage », « estimation du visage », « bien-être estimé (caméra) » : on ne m'a jamais expliqué ce que ça fait ; ça m'inquiète un peu.
- « Gold est offert pendant le test » : quel test ? « 20 analyses par jour » : une analyse, c'est quoi ? Et sur l'écran Repas c'est déjà « 19 analyses IA restantes » alors que je n'en avais lancé aucune — capture : `captures/2026-11-08-2035-ventre-sans-technique-J1/repas-decrire-ia.png`
- La visite me promet « Voir dans 14 jours » / « Voir au jour 28 », mais l'étiquette en haut dit « jour 11 » ou « jour 5 » : je ne sais pas quel jour on me montre — capture : `captures/2026-11-08-2035-ventre-sans-technique-J1/visite-jour5-vs-jour28.png`
- Les graphiques d'Analyses (« pour 10 g de lipides de plus », « +0,0 pt », « Court/Moyen/Long terme ») : trop compliqué pour moi ; je voulais juste une liste « à éviter ».
- J'appuie sur « Repas » en haut de l'accueil : rien ne se passe ; une autre fois j'ai atterri sur une page « Tendances » avec seulement « Pas » — capture : `captures/2026-11-08-2035-ventre-sans-technique-J1/bouton-repas-muet.png`
- « Bœuf, steak haché 15% MG cru » : je l'ai mangé cuit, et « MG » je ne sais pas.
- « 61 entrées et votre profil » dans la sauvegarde : j'ai noté 3 choses.

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil : les 3 écrans de présentation affichent tous « 01/06 » ; numéroter réellement (ou retirer le compteur sur la présentation) pour que la barre, les points et le chiffre disent la même chose.
- [ ] Visite guidée : la pastille « EXEMPLE · jour N » affiche jour 5 / jour 11 alors que le bouton annonce « jour 14 » / « jour 28 » ; caler la pastille sur le jour annoncé (au moins sur la 1re image de l'étape).
- [ ] Visite guidée, étape « Les analyses » : « Elles démarrent après 14 jours notés » contredit les 28 jours de la digestion affichés juste avant sur l'accueil ; pour un profil « Ma digestion », dire « Bien-être : 14 jours ; ventre : 28 jours ».
- [ ] Visite guidée, exemple digestion « au jour 28 » : montre « Aucun lien assez net » ; l'exemple devrait montrer au moins une piste digestive (« ce qui va avec vos jours de gêne ») pour donner envie de tenir 28 jours.
- [ ] Accueil : le bouton « Repas » (icône photo) ne donne aucun retour quand l'appareil photo ne s'ouvre pas ; ouvrir un petit choix « Photo / Décrire » pour qu'on puisse noter sans photo depuis l'accueil.
- [ ] Repas › Décrire : l'heure est pré-remplie à l'heure actuelle ; proposer des raccourcis « Ce midi / Ce soir / Ce matin » au-dessus du champ date-heure.
- [ ] Repas › Décrire : « 19 analyses IA restantes » dès le premier usage alors que l'offre Gold dit 20 et qu'aucune analyse n'a abouti (« Aucun aliment reconnu ») ; ne pas décompter une analyse ratée, ou expliquer.
- [ ] Accueil 04/06 et 05/06 : « lecture du visage / estimation du visage » arrive sans explication ; une phrase « (optionnel) la caméra peut estimer votre humeur, rien ne sort du téléphone » ou retirer la mention tant que ce n'est pas activé.
- [ ] Écran 06/06 : « Gold », « pendant le test » ; dire « Toutes les fonctions sont gratuites jusqu'au 28 nov. 2026 » et expliquer « analyse = un repas lu par l'IA ».
- [ ] Analyses : pour les profils « digestion », ajouter en tête un résumé en phrases (« À surveiller : … ») avant les barres « pt » et « g de lipides ».
- [ ] Recherche d'aliments : les noms bruts (« 15% MG cru ») déroutent ; afficher un libellé simple (« Steak haché ») avec le détail en petit.

### Artefacts de la simulation (version web, pas des défauts)
- « Health Connect n'est pas sur ce téléphone » à l'écran 03/06 ; pas de sommeil reçu.
- Le bouton « Repas »/« Photo » ne peut pas ouvrir d'appareil photo ici (mais l'absence de tout retour reste notée plus haut).
- « Remplir avec l'IA » → « Aucun aliment reconnu » : probablement pas d'IA joignable dans la simulation.
- Pendant plusieurs bulles de visite, la moitié basse de l'écran est un grand bandeau blanc vide (capture d'écran ou rendu ? à vérifier sur téléphone).

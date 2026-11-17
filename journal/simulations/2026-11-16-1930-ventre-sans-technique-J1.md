# Simulation — Ventre, sans technique — J1 — 2026-11-16 19:30

- **Persona** : n° 2 « Ventre, sans technique » — SII, peu à l'aise avec les applis, veut savoir quels aliments éviter
- **Configuration** : n° 1 « Android seul » (Samsung, poids 33 %) — reçues : pas du téléphone (3 551 aujourd'hui, « d'habitude 6 431 ») ; absentes : montre, sommeil, VFC (météo laissée désactivée)
- **Moment** : jour 1 — installation neuve, accueil fait en entier (objectif Confort digestif ajouté, « pas de montre », Méditation décochée, Gold offert), visite guidée commencée puis passée ; un dîner et une digestion notés ; aucun autre historique que les pas

## Tâches
1. Faire l'accueil et comprendre ce que fait l'app — réussie (4 étapes claires, mais 3 explications de confidentialité avant d'avoir rien fait, et « Inclus : le bien-être + 1 objectif » ressemble à une histoire d'abonnement).
2. Noter mon dîner sans photo — réussie avec effort (pas d'appareil photo → « Décrire le repas » ; l'IA a gardé les pâtes carbonara mais a oublié le yaourt et la pomme, je les ai ajoutés à la main par la recherche).
3. Noter ma digestion du soir — réussie (Calme / Gêne / Douleur, un geste ; mais le bouton choisi ne se coche pas).
4. Savoir quels aliments m'embêtent le ventre — abandonnée (normal au J1 : il faut attendre ; mais deux délais différents, 14 et 28 jours, et l'exemple est en « −2,7 pt » et « FODMAP »).
5. Comprendre ce que je vais obtenir plus tard (exemple au jour 28, rapport pour le médecin) — en partie (l'exemple montre « Pistes à tester : Fructanes », compris ; le graphique à barres hachurées, non).

## Compris
- L'app garde mes données sur le téléphone et n'envoie le repas à l'IA que si je le demande ; la fenêtre d'accord est claire (« J'accepte, analyser ce repas » / « Pas maintenant »). — capture : `captures/2026-11-16-1930-ventre-sans-technique-J1/ia-oublie-yaourt-pomme.png`
- Après le repas, l'app me dit ce qui peut gêner le ventre (fructanes dans les pâtes, lactose dans le yaourt…) avec une phrase rassurante « d'autres digèrent très bien, vos propres données priment ». — capture : `captures/2026-11-16-1930-ventre-sans-technique-J1/alertes-fodmap.png`
- Noter ma digestion, c'est trois gros boutons, l'heure est notée toute seule : « Bilan du jour : Gêne. Merci ! ». — capture : `captures/2026-11-16-1930-ventre-sans-technique-J1/digestion-gene-non-cochee.png`
- Dans l'exemple au jour 28, la carte « Pistes à tester : Fructanes — Essayer dans Agir » répond enfin à ma question « quoi éviter ». — capture : `captures/2026-11-16-1930-ventre-sans-technique-J1/exemple-jour28-pistes.png`

## Pas compris
- « J'avais écrit pâtes carbonara, un yaourt et une pomme, et il ne me met que les pâtes. Si je n'avais pas relu, mon yaourt n'y était pas. » — capture : `captures/2026-11-16-1930-ventre-sans-technique-J1/ia-oublie-yaourt-pomme.png`
- « Quatre lignes rouges pour un repas normal : fructose en excès, sorbitol, “repère de 0,15 g”, “Varney 2017, MEXT 2020”… Je ne sais pas ce que c'est, et ça me fait peur de tout manger. » — capture : `captures/2026-11-16-1930-ventre-sans-technique-J1/alertes-fodmap.png`
- « J'ai appuyé sur Gêne, mais le rond n'est pas rempli : est-ce que ça a marché ? » (seule la phrase en dessous le confirme). — capture : `captures/2026-11-16-1930-ventre-sans-technique-J1/digestion-gene-non-cochee.png`
- « Objectifs me dit premier score dans 13 jours, l'écran juste après me dit encore 27 jours. C'est lequel ? » (l'explication score à 14 / pistes à 28 n'apparaît que dans la visite « Voir un exemple »). — captures : `captures/2026-11-16-1930-ventre-sans-technique-J1/objectifs-14-jours.png`, `captures/2026-11-16-1930-ventre-sans-technique-J1/ventre-28-jours.png`
- « “−2,7 pt pour 1 repas riche en fructanes (FODMAP) de plus”, “statistiquement liés”, les barres hachurées : je n'y comprends rien. Dites-moi juste : les pâtes, ça me réussit ou pas. » — capture : `captures/2026-11-16-1930-ventre-sans-technique-J1/exemple-jour28-pistes.png`
- Autres petites gênes vues sans capture : en venant de Ma journée, l'écran repas allume l'onglet « Données » ; après un seul repas il apparaît déjà dans « Repas habituels » ; « Encore 3 choses aujourd'hui » ne baisse pas après le dîner noté (normal si les repas comptent pour 1, mais pas dit) ; le titre « Suivre une habitude » est posé au-dessus des boutons Repas / Bien-être / Digestion / Selles, qui ne sont pas des habitudes ; « Gold est prolongé » le jour même où on me l'offre ; l'écran 3 de l'accueil liste « Météo » parmi ce qui est suivi alors que je l'ai laissée éteinte, et ne dit pas que mes pas viennent du téléphone.

## Constats → étapes POLISH au BACKLOG
- [ ] Repas décrit → IA : l'analyse texte de « pâtes carbonara, un yaourt et une pomme » ne renvoie que la carbonara ; garder tous les aliments cités (ou afficher « Non reconnu : yaourt, pomme — les ajouter ? »).
- [ ] Carte d'alertes FODMAP après un repas : 4 lignes rouges + grammes + références (Varney, MEXT) sont trop techniques ; replier par défaut sur une phrase simple (« 3 aliments parfois mal digérés : pâtes, yaourt, pomme ») et garder chiffres/sources derrière « Détails ».
- [ ] Fenêtre « Ma digestion » : le bouton choisi (Calme / Gêne / Douleur) ne prend pas d'état sélectionné ; remplir le rond et colorer le bouton.
- [ ] Délais digestion incohérents : Objectifs « Premier score dans 13 jours » vs Confort digestif / Ma journée « Encore 27 jours » ; nommer les deux paliers sur la même carte (« score au jour 14, pistes au jour 28 ») hors de la visite.
- [ ] Résultats du ventre (exemple J28) : remplacer « −2,7 pt pour 1 repas riche en fructanes (FODMAP) de plus » par une phrase en clair (« Les jours avec des fructanes — blé, oignon, ail — votre ventre va moins bien »), barres hachurées expliquées ou en second niveau.
- [ ] Ma journée : renommer « Suivre une habitude » (au-dessus de Repas / Bien-être / Digestion / Selles) en « Noter autre chose » ou équivalent.
- [ ] Écran repas (/food) ouvert depuis Ma journée : l'onglet du bas allumé est « Données » ; garder « Ma journée » allumé ou proposer un retour.
- [ ] Accueil, étape 3 « Ce que Halcya suit pour vous » : n'afficher « Météo » que si activée, et mentionner « Pas (de votre téléphone) » pour la configuration sans montre.
- [ ] Bannière Gold J1 : « Gold est prolongé » le premier jour est trompeur ; dire « Gold est offert pendant le test ».

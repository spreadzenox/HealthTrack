# Simulation — Stressé et pressé — J1 — 2026-11-21 08:30

- **Persona** : n° 7 « Stressé et pressé » — veut se sentir mieux, ne notera presque rien ; peu de patience, lit en diagonale, abandonne vite si c'est long.
- **Configuration** : n° 1 « Android seul » (Samsung, Xiaomi, Honor, Pixel, poids 33 %) — reçu : pas du téléphone (115 aujourd'hui, « d'habitude 6 386 ») ; absent : montre, sommeil, Health Connect (normal en web).
- **Moment** : jour 1 — installation neuve, aucune donnée ; accueil fait (objectif Bien-être seul, pas de montre, Méditation gardée), puis 1 note de bien-être (2/5 + Stress) et Méditation « Non ».

## Tâches
1. Faire l'accueil vite — réussie (≈ 10 écrans/taps : bienvenue, nom en 2 taps « Valider » puis « Continuer », 4 étapes, puis encore un écran « Gold » après « C'est parti ! »).
2. Comprendre en 30 s ce que l'app m'apporte — à moitié (Accueil = Pilou + bulles + « Jour 1 sur 7 avant vos premiers résultats » ; mais quels résultats ? rien ne le dit sur l'Accueil).
3. Noter une chose rapidement — réussie (bulle Bien-être → 2 → Stress → Enregistrer : 4 taps, très bien ; Méditation oui/non en 1 tap).
4. Savoir quand j'aurai quelque chose d'utile — à moitié (Accueil dit 7 jours, Objectifs dit « premier score dans 6 jours notés », la page Bien-être ajoute « Pistes au 14e jour noté » : trois messages, et le vrai « ce qui me fait du bien » n'arrive qu'à 14).
5. Noter un repas sans photo — ratée (pas de caméra → « Décrire le repas » ; j'écris « café et croissant », 2e écran de consentement, et l'IA me renvoie « Pâtes à la carbonara 638 kcal » ; j'annule).

## Compris
- La note de bien-être depuis la bulle de l'Accueil : échelle 1-5 expliquée, puces « Stress / Alcool… » optionnelles, 4 taps — capture : `captures/2026-11-21-0830-stresse-presse-J1/bienetre-saisie.png`
- Objectifs : « Encore 6 jours notés pour votre premier score », « pas forcément d'affilée » — clair et rassurant — capture : `captures/2026-11-21-0830-stresse-presse-J1/objectifs-6-jours.png`
- Le choix d'objectifs à l'accueil (Bien-être toujours suivi + Confort digestif en option) — capture : `captures/2026-11-21-0830-stresse-presse-J1/accueil-objectifs.png`

## Pas compris
- « Ce que Halcya suit pour vous, sans rien faire » et Pilou dit « Tout ça, je m'en occupe »… mais « tout ça » c'est quoi ? La liste est vide pour moi (juste « activables : météo » et « avec une montre… »). Mes pas, qu'il lit pourtant, ne sont même pas cités — capture : `captures/2026-11-21-0830-stresse-presse-J1/accueil-suivi-vide.png`
- « Repas en photo, 3 par jour » imposé et non décochable, puis « 3 choses par jour · environ 1 minute » : 3 photos de repas + bien-être + méditation, ça fait 5, pas 3. Moi je voulais noter presque rien — capture : `captures/2026-11-21-0830-stresse-presse-J1/accueil-a-noter.png`
- Je mets 2/5 « Bof » avec Stress, et juste après Pilou passe de « Tranquille » à « De bonne humeur » puis « Content ». Je vais mal et la mascotte est ravie ? — capture : `captures/2026-11-21-0830-stresse-presse-J1/apres-note-2.png`
- 7 jours ? 6 jours ? 14 jours ? « Premier score » et « Pistes » c'est quoi la différence ? Ce que je veux (ce qui me fait du bien), c'est au 14e jour, et ça n'est écrit qu'au fond de Objectifs › Bien-être — capture : `captures/2026-11-21-0830-stresse-presse-J1/bienetre-7-vs-14.png`
- Ma journée : « Encore 1 chose aujourd'hui » avec 1 point plein et 2 vides — j'ai l'impression qu'il en reste 2 ; et « Repas 0 sur 3 » à côté — capture : `captures/2026-11-21-0830-stresse-presse-J1/ma-journee-points.png`
- J'écris « café et croissant », l'IA répond « Pâtes à la carbonara » (peut-être un bouchon de test du navigateur, à vérifier) ; et avant ça un 2e écran de consentement qui répète l'accueil — captures : `captures/2026-11-21-0830-stresse-presse-J1/repas-consentement.png`, `captures/2026-11-21-0830-stresse-presse-J1/repas-ia-carbonara.png`

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil étape 3 « Ce que Halcya suit pour vous » : la liste est vide sans montre ; y afficher ce qui est réellement suivi sur ce téléphone (pas, et sommeil estimé sur Android), ou changer le titre et la bulle « Tout ça, je m'en occupe ».
- [ ] Carte « Jour 1 sur 7 avant vos premiers résultats » (Accueil) : dire en une ligne ce qu'on aura au J7 (« votre premier score bien-être ») et au J14 (« ce qui vous fait du bien »), et aligner avec Objectifs (« jours notés, pas forcément d'affilée ») — aujourd'hui J1…J7 ressemble à des jours de calendrier.
- [ ] Humeur de Pilou : ne pas la faire monter en « De bonne humeur / Content » juste après une note bien-être basse (2/5 + Stress) ; au minimum une réplique empathique au lieu d'une jauge qui grimpe, ou expliquer que l'humeur de Pilou suit la régularité, pas mon état.
- [ ] Étape 4 de l'accueil : permettre de décocher ou d'alléger « Repas en photo, 3 par jour » pour le profil « je veux noter peu », et rendre « 3 choses par jour » cohérent avec la liste affichée.
- [ ] Ma journée, bandeau Pilou : les 3 points (1 plein, 2 vides) contredisent « Encore 1 chose aujourd'hui » ; faire correspondre points et texte.
- [ ] Repas décrit : vérifier que l'analyse par texte respecte la description (« café et croissant » → « Pâtes à la carbonara » ici, possiblement le bouchon web) et éviter le 2e écran de consentement quand l'accueil l'a déjà expliqué (ou le réduire à 2 lignes).
- [ ] Nom de Pilou : « Valider » puis « Continuer » = 2 taps pour la même chose ; un seul bouton suffit. Écran « Gold offert » après « C'est parti ! » : le placer avant ou l'enlever du parcours (faux départ).
- [ ] Mineur : après « Ouvrir » le cadeau du jour (« Un arbuste pour l'îlot ! »), aucun arbuste visible sur l'îlot ; et en ouvrant le formulaire repas depuis Ma journée, l'onglet actif bascule sur « Données ».

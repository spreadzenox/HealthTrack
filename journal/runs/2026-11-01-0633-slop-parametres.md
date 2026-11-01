# Run du 01/11/2026 06:33 (Paris, CET) — Textes : Paramètres et Données (SLOP-1b-4)

**Type** : ✍️ textes (demande du propriétaire du 31/10 vers 21:35)

## Constat au démarrage
- Main à `ac424f8` (SLOP-1b-3) ; Build & Release, Play — AAB, Tests et émulateur A56 verts. Aucune PR « [Auto] »
  ouverte ; #51 (`cursor/*`) non touchée.

## Inventaire (captures `npm run visual -- --play --routes=/settings,/data` relues)
- **Paramètres** : le bloc « Analyse des repas (IA) » nommait encore **Gemini** dans la variante play (contraire à la
  décision du 31/10 : aucun nom de modèle visible) ; la divulgation avant la première analyse (`ai_meal`) aussi.
  Phrase longue sur la carte ventre ; « Version gratuite : … restent gratuits » (énumération de 5, « gratuit » ×2) ;
  « Votre avis » en trois morceaux avec « Vous écrivez ce que vous voulez ».
- **Données** : intro avec emphase en gras et parenthèse à trois éléments ; export qui répète le compteur ;
  rapport PDF en énumération par trois ; suppression en liste de 5 éléments puis phrase longue.

## Changements
| Écran | Avant | Après |
|---|---|---|
| Paramètres, IA | « …l'app la fait analyser par Gemini (Google Cloud, en Europe) via notre serveur, seulement quand vous touchez « Analyser ». Aucune clé à saisir. Sans IA, la saisie manuelle reste possible. » | « Quand vous touchez « Analyser », notre serveur envoie la photo ou la description du repas à une IA de Google, en Europe. Sans IA, vous pouvez ajouter les aliments à la main. » |
| Paramètres, cadenas | « Seule la photo ou la description du repas part, sans métadonnées ; rien d'autre de votre santé. » | « Seule la photo ou la description part, sans ses métadonnées. » |
| Divulgation IA (play) | « …part vers notre serveur, qui la fait analyser par Gemini (Google Cloud, en Europe). » + 2 phrases longues | « La photo, réduite et sans position, ou votre description part vers notre serveur. Une IA de Google l'analyse en Europe. » ; « Notre serveur ne garde ni la photo ni le texte. Il compte vos analyses, et ce compteur s'efface après 13 mois sans analyse. Google ne s'en sert pas pour entraîner ses modèles. » ; « Seuls les aliments et leurs grammes reviennent. Aucune autre donnée de santé ne part. » |
| Ce qui vous amène | « La carte « Votre ventre » de l'Accueil n'apparaît qu'avec « Mon ventre », ou tant que vous n'avez rien choisi. Vos notes ne sont jamais effacées : changez d'avis quand vous voulez. » | « L'Accueil montre la carte « Votre ventre » avec « Mon ventre », ou tant que rien n'est choisi. Vos notes sont gardées, quel que soit votre choix. » |
| Abonnement (gratuit) | « Version gratuite : journal, imports des montres, bien-être estimé, graphiques et export restent gratuits. » | « Version gratuite. Ce que vous notez et importez le reste, avec ou sans abonnement. » |
| Votre avis (play) | « Pendant le test : « Envoyer des commentaires privés… », en bas de la page Halcya. Ensuite : « Noter cette application ». Vous écrivez ce que vous voulez : aucune donnée n'est jointe. » | « Sur la page Halcya du Play Store : « Envoyer des commentaires privés au développeur » pendant le test, « Noter cette application » ensuite. Aucune donnée n'est jointe. » |
| Données, intro | « Vos données restent **sur cet appareil** et survivent aux mises à jour. Si la sauvegarde… (chiffrées, gérées par le système, jamais lues par Halcya). Avant de réinstaller…, exportez-les aussi. » | « Vos données sont sur ce téléphone et passent les mises à jour. Si la sauvegarde du téléphone est activée, elles y sont copiées, chiffrées ; Halcya ne la lit pas. Exportez-les avant de réinstaller l'app ou de changer de téléphone. » (sauvegarde Android toujours dite, décision SAUV) |
| Exporter | « Un fichier avec toutes vos entrées et votre profil, rangé dans **Documents**. » | « Un fichier rangé dans Documents. » (le compteur « 1 918 entrées et votre profil » suit) |
| Importer | « …choisir : **ajouter** (sans doublons) ou **remplacer**. » | « Vous verrez son contenu, puis choisirez d'ajouter (sans doublons) ou de remplacer. » |
| Rapport PDF | « Votre ventre semaine par semaine, vos repas et vos pistes, sur 2 pages. Créé sur votre téléphone : vous choisissez à qui l'envoyer. » | « Deux pages à montrer à votre médecin ou à votre diététicienne. Le fichier est créé sur le téléphone, et c'est vous qui l'envoyez. » |
| Supprimer | « Efface de ce téléphone vos repas, notes, mesures, lectures du visage et votre profil. Chez nous, il ne reste au plus qu'un compteur…, sous une empreinte anonyme, effacé seul au bout de 13 mois sans analyse. » | « Efface de ce téléphone vos entrées et votre profil. Notre serveur ne garde qu'un compteur d'analyses IA, anonyme, effacé après 13 mois sans analyse. » |

Captures avant/après : `journal/captures/slop-1b-4/` (Paramètres haut et bas, Données haut et bas, variante play).

## Tests
- Paramètres (play) : aucun « Gemini » dans tout l'écran, « une IA de Google » présent ; divulgation `ai_meal` :
  pas de « Gemini », mais « Google » et « Europe ». Les deux échouaient sur l'ancien code.
- Tests mis à jour sur les nouvelles phrases (carte ventre sans objectif, cadenas, avis).
- Inchangés et verts : sauvegarde du téléphone dite (Données), « 13 mois » (Paramètres, Données, divulgations),
  3 lignes d'aide dans Données.

## Vérifications
- `npm run test` (2 810 verts), `npm run build`, `npm run lint` (6 erreurs, inchangé), `npm run visual --play`
  (Paramètres, Données) relu.

## Données
- Aucune donnée touchée ni collectée (Sécurité des données inchangée).

## Demandes iOS
- Note de Nouveautés commune (pas de `variants`) : Paramètres et Données existent aussi sur iOS.

## Suite
- SLOP-1 : détails dépliés des Analyses, réintroduction, onboarding complet ; puis GOLD-b (paywall à deux niveaux).

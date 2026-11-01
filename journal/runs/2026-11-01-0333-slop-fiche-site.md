# Run du 01/11/2026 03:33 (Paris, CET) — Textes : fiche Play, confidentialité et conditions (SLOP-1d)

**Type** : ✍️ textes (demande du propriétaire du 31/10 vers 21:35)

## Constat au démarrage
- Main à `817b931` (v419, SLOP-1c) ; workflows de main verts (Build & Release, Play — AAB, émulateur A56).
  Aucune PR « [Auto] » ouverte ; #51 (`cursor/*`) non touchée.

## Inventaire (règles `SLOP_WORDING` appliquées aux textes hors app)
- Fiche Play : « C'est une estimation, pas un diagnostic » (exigé par `listing.test.mjs`), « on préfère attendre…
  plutôt que de vous montrer de faux suspects », tiret cadratin « ventre sensible — ballonnements… — », « plutôt
  qu'un score unique », « pas à une moyenne imposée ».
- Confidentialité : « Le résultat est une estimation, pas un diagnostic », « …pas des causes », énumération par trois
  « (sans lien avec vous, votre compte Google ou votre téléphone) ». **Écart de fidélité trouvé** : la page ne
  parlait que de la lecture à l'ouverture de l'app, alors que la lecture au déverrouillage est allumée dans toutes
  les versions play depuis le 31/10.
- Conditions : refrain deux fois (« En bref » et § 2) + « des pistes, pas des causes ».
- Page d'accueil du site : « Une aide pour repérer des tendances, pas un diagnostic ».
- Fiche de l'abonnement Play (`subscriptions.mjs`) : déjà sobre, inchangée.

## Changements
| Où | Avant | Après |
|---|---|---|
| Fiche, intro | « Pensée d'abord pour les personnes qui ont le ventre sensible — ballonnements, inconforts digestifs, SII… —, Halcya convient aussi à qui veut… » | « Elle est pensée d'abord pour les personnes qui ont le ventre sensible : ballonnements, syndrome de l'intestin irritable ou côlon irritable (SII). Elle sert aussi à suivre son énergie et ses nuits. » |
| Fiche, pistes | « On parle de pistes, jamais de causes, et on préfère attendre… faux suspects. » | « Une piste n'apparaît qu'avec assez de jours pour comparer : en général trois à quatre semaines de notes. » (21 j pour les pistes, 28 j de notes du ventre pour repas → ventre) |
| Fiche, FODMAP | « …plutôt qu'un score unique. …ce qui n'est pas mesuré reste « inconnu ». » | « …par exemple « riche en fructanes : oignon ». … Une teneur jamais mesurée est marquée « inconnue ». » |
| Fiche, bien-être | « …à l'ouverture de l'app… C'est une estimation, pas un diagnostic, avec sa marge d'incertitude affichée. » | « …à l'ouverture de l'app et, si vous l'ajoutez, à chaque déverrouillage. Tout se passe sur le téléphone… La marge d'incertitude est affichée. » |
| Fiche, tendances | « comparée à votre propre norme, pas à une moyenne imposée » | « comparée à vos propres semaines habituelles » |
| Fiche, fin | règle dite une fois (inchangée sur le fond) | « Halcya n'est pas un dispositif médical. Elle ne pose aucun diagnostic… » : seule occurrence de « diagnostic » |
| Confidentialité, visage | lecture à l'ouverture seulement ; « estimation, pas un diagnostic » ; « bandeau visible » | ajoute le déverrouillage (3 images, notification visible tant que c'est en marche, arrêt depuis la notification) ; refrain retiré |
| Confidentialité, identifiant | « (sans lien avec vous, votre compte Google ou votre téléphone) » | « (il ne permet pas de vous identifier) » |
| Conditions | « C'est une estimation, pas un diagnostic » (En bref) ; « Ces liens sont des pistes, pas des causes. Le bien-être estimé est une estimation, pas un diagnostic. » | « Ce n'est pas un dispositif médical (voir le point 2). » ; « Un lien repéré est une piste à vérifier : il ne prouve pas que l'un entraîne l'autre. Le bien-être affiché est estimé à partir de votre visage ou de vos saisies. » |
| Site, accueil | « Une aide pour repérer des tendances, pas un diagnostic. » | retiré (dit dans les conditions) |

Fiche : 3 988 caractères (limite 4 000). Dates : confidentialité « mise à jour du 1er novembre 2026 », conditions
« version du 1er novembre 2026 ».

## Tests
- `listing.test.mjs` : n'exige plus le refrain ; « diagnostic » une seule fois ; `SLOP_WORDING` sur la description
  courte et longue (le titre décidé par le propriétaire garde son tiret).
- `privacyPolicy.test.js`, `terms.test.js` : `SLOP_WORDING` sur le texte (sans `<title>`), « diagnostic » une seule
  fois ; la page d'accueil du site passe aussi `SLOP_WORDING`.
- Les anciens textes échouaient à ces règles (relevé fait avec les mêmes expressions avant réécriture).

## Vérifications
- `npm run test` : 2 808 réussis ; `npm run build` OK ; `npm run lint` : 6 erreurs (inchangé) ; `npm run visual` OK.
- Captures après (confidentialité, conditions) : `journal/captures/slop-1d/`, relues.

## Données
- Aucune donnée touchée. Pas de nouvelle donnée collectée : formulaire Sécurité des données inchangé.

## Demandes iOS
- Rien de propre à Android dans la note de Nouveautés (confidentialité et conditions partagées).

## Suite
- SLOP-1b : Journal relu phrase par phrase (paywall avec GOLD-b) ; SLOP-1e : anciennes Nouveautés, puis test étendu
  aux notes.

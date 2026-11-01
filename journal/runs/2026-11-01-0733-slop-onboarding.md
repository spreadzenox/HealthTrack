# Run du 01/11/2026 07:33 (Paris, CET) — Textes : onboarding complet (SLOP-1b-5)

**Type** : ✍️ textes (demande du propriétaire du 31/10 vers 21:35)

## Constat au démarrage
- Main à `f61a841` (SLOP-1b-4) ; Build & Release, Play — AAB, Tests et émulateur A56 verts. Aucune PR « [Auto] »
  ouverte ; #51 (`cursor/*`) non touchée.
- Les captures `journal/captures/slop-1b-4/` citées par le run précédent ne sont pas dans le dépôt : `.gitignore` ignore les `*.jpg`, il faut `git add -f` (seuls `slop-1a/`
  et `slop-1b-3/` y sont) : rien de bloquant, à ne pas citer comme preuve.

## Inventaire (captures `npm run visual -- --play` de `/bienvenue` relues : accueil, suivis, montre, visage, premier geste, « aha »)
- « Pas de souci : vous pourrez… » sur deux écrans (Health Connect refusé, visage « Plus tard ») : tic de chatbot.
- Sous-titres en énumération par trois : « SII, ballonnements, inconforts digestifs », « fatigue, nuits,
  récupération », « pas, cœur, entraînements » ; « toutes mes montres, tout mesurer ».
- Phrases à rallonge ou en deux temps : écran montre, Health Connect (énumération de 5), import lent, « aha »,
  erreurs, lecture du visage (« Facultatif : … »), premier geste.

## Changements
| Écran | Avant | Après |
|---|---|---|
| Objectifs (aussi dans Paramètres) | « SII, ballonnements, inconforts digestifs » · « fatigue, nuits, récupération » · « toutes mes montres, tout mesurer » | « SII, ballonnements » · « fatigue, nuits » · « toutes mes montres et mesures » |
| Suivis | « pas, cœur, entraînements » | « pas et entraînements » |
| Montre | « Rien n'est demandé à cette étape : vous choisirez ce que l'app peut lire juste après. » ; « reliée directement en Bluetooth » ; « …suffisent pour commencer » | « Aucune autorisation pour l'instant. Vous choisirez ensuite ce que l'app peut lire. » ; « reliée en Bluetooth » ; « …suffisent » |
| Health Connect | « Sommeil, pas, cœur, VFC et activité de vos 30 derniers jours, lus sur le téléphone. Rien n'est envoyé. » ; « Pas de souci : vous pourrez l'autoriser plus tard… » | « L'app lit sur le téléphone vos 30 derniers jours de sommeil, de pas et de cœur. Rien n'est envoyé. » ; « Vous pourrez l'autoriser plus tard depuis l'onglet Sources. » |
| Import | « C'est un peu long : vous pouvez continuer, … » ; « Il sera retenté tout seul ; vous pourrez aussi le relancer… » | « Vous pouvez continuer : l'import se poursuit en arrière-plan. » ; « L'app réessaiera seule, ou relancez-le depuis l'onglet Sources. » |
| « Aha » | « Ce sont vos chiffres de départ. Les pistes viendront en les croisant avec votre ventre et votre bien-être. » | « Vos chiffres de départ. L'app les comparera à votre ventre et à votre bien-être. » |
| Visage | « Facultatif : la caméra frontale regarde votre expression… » ; « Seuls quelques nombres sont gardés, aucune image. » ; « Pas de souci : vous pourrez l'activer quand vous voulez… » | « La caméra frontale regarde votre visage une à deux secondes, … » (le bouton « Plus tard » dit déjà que c'est facultatif) ; « Une IA l'analyse sur le téléphone et ne garde que des scores, aucune image. » ; « Vous pourrez l'activer plus tard depuis l'onglet Sources. » |
| Premier geste | « C'est noté, à 08:12 : c'est votre premier jour de suivi. Les pistes arrivent vers le 21ᵉ. » ; « Facultatif : vous pouvez aussi continuer sans répondre. » | « C'est noté, à 08:12. C'est votre premier jour de suivi ; les premières pistes viennent vers le 21ᵉ. » ; « Vous pouvez aussi continuer sans répondre. » |

Non touchés exprès : les fenêtres d'accord avant une permission (`permissionDisclosures.js` : divulgation bien visible
exigée par Google Play et l'AI Act, déjà en phrases courtes), la phrase « Le résultat est une estimation. Il ne
remplace pas l'avis d'un médecin. » (l'endroit choisi pour dire la règle une fois), les trois tuiles du premier écran
(maquette validée). Captures avant/après : `journal/captures/slop-1b-5/` (accueil, montre, « aha »).

## Tests
- `SLOP_WORDING` : « Pas de souci », « Pas de panique », « Pas d'inquiétude » bannis (le test échouait sur l'ancien
  onboarding).
- Onboarding : « Pas maintenant » à Health Connect affiche la nouvelle phrase, sans « Pas de souci » ; visage « Plus
  tard » idem.

## Vérifications
- `npm run test` (2 810 verts), `npm run build`, `npm run lint` (6 erreurs, inchangé), `npm run visual --play`
  (`/bienvenue` : accueil, suivis, montre, visage, premier geste, « aha ») relu.

## Données
- Aucune donnée touchée ni collectée (Sécurité des données inchangée). Les identifiants d'objectifs et de suivis ne
  changent pas : seuls les sous-titres affichés changent.

## Demandes iOS
- Note de Nouveautés commune (pas de `variants`) : l'onboarding existe aussi sur iOS.

## Suite
- SLOP-1b : détails dépliés des Analyses, réintroduction ; puis GOLD-b (paywall à deux niveaux, réécrit à ce moment).

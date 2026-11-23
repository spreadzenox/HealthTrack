# Run 23/11 12:30 — #1216 mergée, geste réel du rapport PDF sur iPhone réparé (IOS-RAPPORT-ABONNE)

**Type** : 🔧 (outillage iPhone, rien de visible dans l'app) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) ·
**Android** : main 60c3698 (#1216) · **TestFlight** : 1268.1268 validée pour « Testeurs Halcya » (relevé de 07:33 UTC),
1244.1244 attachée à la version 893 · **Parité** : 70 % (33/47), 2 correctifs iPhone restent (01, 27)

## État de départ
- main vert sur 8abf151 (#1215 : Tests, Build & Release, émulateur, Play — AAB).
- PR de la routine ouverte : **#1216** (run de 11:30, FUSION-3 correctif 02), 15 checks verts dont le build iPhone
  (41 min). #51 (`cursor/*`) pas touchée.

## #1216
- Captures iPhone (`captures/pr-1216`, build 1279.1279) : 84 fichiers, Accueil et accueil vierge relus, `js-errors.txt`
  vide. Le mode captures, désormais dans le code partagé, a bien fait tout le parcours.
- Deux captures manquent par rapport à #1215 : `restauration-onboarding` et `restauration-reprise`. Cause trouvée
  dans le log du job : le parcours a touché sa limite de 25 min (app lancée à 10:55, arrêt à 11:20:15, « parcours des
  pages inachevé ») ; le démarrage à froid a pris 9,5 min contre 6 pour #1215. Rien à voir avec le changement.
- **Mergée en squash (60c3698)**, titre et message écrits à la main, sans ligne d'attribution.

## Le geste réel du rapport PDF échouait sur tous les builds iPhone
- `DonneesUITests/testEnregistrerLeRapportDansFichiers` : « « Créer le PDF » introuvable » sur `captures/main`,
  pr-1214, pr-1215, pr-1216 (simple avertissement, donc passé inaperçu) ; la sonde disait `"préparer":false`.
- Cause : le rapport est réservé aux abonnés, et depuis la fin de la période de lancement iPhone (6/11) le relais ne
  donne plus Gold au simulateur. La carte montre « Débloquer » : même symptôme que la régression du 2/11 (#200), autre
  cause. Le test d'interface attendait 30 s pour rien, ce qui mangeait la marge du parcours.
- Correctif (`app/src/ios/captureMode.js`, build de captures seulement) : `probeShareReport` pose les droits d'abonné
  des captures `-abonne` (`installSubscriptionFake`) avant d'ouvrir Vos données et les retire à la fin, même en cas
  d'échec (`finally`).
- Test d'abord (`captureMode.test.js`) : ordre « droits d'abonné, page /data, … capture, droits retirés », et retrait
  même quand la sonde échoue ; rouge avant le correctif, vert après.
- `iphone/scripts/ios-captures.sh` : limite du parcours de 25 à 30 min par iPhone. C'est une limite, pas une attente :
  elle ne coûte du Mac que si le parcours est long, et le geste réel du rapport, qui remarche, demande jusqu'à 1 à 2
  min de plus.

## Vérifications
`npm run test` : 407 fichiers, 4 469 tests verts ; eslint sur les deux fichiers : 0 erreur. Après le merge de #1216 :
Build & Release **v886** publiée (APK 35 672 949 octets, 11:32 UTC). Pas de `npm run visual` : aucun écran de
l'app ne change (le code n'entre que dans la build de captures du simulateur, `VITE_IOS_CAPTURE=1`).

## Suite
1. Run suivant : build iPhone de la PR ; regarder `iphone-16e-rapport-partage.png` (carte ouverte, « Créer le PDF »),
   `rapport-apres-test.txt` (test passé), la ligne `[rapport] partage` (`après` = 2) et les captures de restauration ;
   puis merge.
2. FUSION-3 : 27 attend une décision (FUSION-4), puis 01 en dernier.
3. POLISH-SIM-146 et 150 ; PERSONAS-OUTIL-2.
4. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

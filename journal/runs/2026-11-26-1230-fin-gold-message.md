# Run 26/11 12:30 — message de fin de Gold offert aux testeurs (FIN-LANCEMENT-MSG)

**Type** : 🔧 (journal seulement) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
c6e9e91 (#1285) vert (Tests, Build & Release v931, Play — AAB, émulateur A56) · **TestFlight** : 1335.1335 chez
« Testeurs Halcya », validée (inchangé ; build du soir à 21:20) · **Parité** : 70 % (33/47), inchangée

## État de départ
- Remise à zéro du clone refusée par la sécurité de la session ; le clone était déjà sur origin/main, propre.
- #1286 (journal du run 11:30) ouverte, checks verts ; elle a été mergée par le run précédent à 11:32 pendant que je
  la vérifiais. Aucune autre PR de la routine ouverte (#51, `cursor/*`, pas touchée). Pas de nouvelle réponse du
  propriétaire.

## Choix de l'étape
Heures de Mac encore très au-dessus de la cible (≈ 12,8 h/jour pour 3 h) : une étape utile sans build iPhone. Gold
offert s'arrête le 2/12 (dans 6 jours) et le message aux testeurs prévu au BACKLOG (FIN-LANCEMENT-MSG) n'existait pas.

## Fait
- **Message E** dans `journal/INVITATION-TESTEURS.md` § 4 : Gold offert jusqu'au 2/12 au soir ; prolongé au 27/12 pour
  les installations qui ont analysé un repas (P44, liste inscrite le 2/12 au matin, P44-2b) ; ce qui reste gratuit
  (Pilou, journal, montres, bien-être estimé, Tendances, sauvegarde, 15 analyses de repas par mois) ; ce qu'ajoute
  l'abonnement (liste de `premiumBenefits.js`) ; prix et essai lus dans `app/scripts/play/subscriptions.mjs` (Silver
  4,99 €/mois ou 29,99 €/an avec 14 jours d'essai, Gold 9,99 €/mois) et crédits dans `relay/src/config.js` ; surtout
  « restez inscrits » (4 inscrits sur 12 : les 14 jours de Google n'ont pas commencé, un testeur qui part en voyant
  l'écran d'achat le 3/12 recule la production) ; les 3 liens pour faire venir un proche.
- Garde-fou écrit dans le message : ne pas l'envoyer si le propriétaire prolonge `until` ; la routine le réécrit.
- BACKLOG (FIN-LANCEMENT-MSG coché), PRODUIT § 5, résumé (nouvelle ligne 👉 datée du 29-30/11 et ligne du tableau).

## Vérifications
- Textes de l'app relus pour rester cohérents (`LaunchEndCard.jsx` : « le journal, les montres, le bien-être estimé et
  l'export restent gratuits », « Gold est prolongé : vous n'avez rien à payer »).
- Journal seulement : `npm run test` côté CI (Frontend) ; aucun fichier hors de `journal/`, aucun build de Mac.

## Suite proposée
1. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; soumission bêta au premier run qui voit la build.
2. 2/12 au matin : P44-2b (relancer « Relais — déploiement », inscrire les empreintes dans `offered.installs`).
3. FUSION-4 : mission d'archivage de l'ancien dépôt quand ses builds TestFlight sont expirées ; puis FUSION-3.

## Pour le propriétaire
Recruter des testeurs (4 sur 12), puis PI2, puis P51 ; **le 29 ou le 30/11, envoyer le message E** au groupe.
Réponses attendues : PROP-SIM-19, « go courbes / go phases / non », « rituel 2D / 3D / pas de rituel ».

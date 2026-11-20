# Run du 20/11 16:30 — Les pas du téléphone dès l'accueil (POLISH-SIM-124b)

**Type** : 🛠️ code (polish, constat des personas) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main b9e0494.

## État de départ
- main vert sur #1149 (Tests, Build & Release v831, Play — AAB, émulateur).
- #1150 (run de 15:30, « votre montre ou votre bague ») ouverte : émulateur API 35 rouge sur un paquet
  « Android Emulator » arrivé corrompu (sans rapport avec le diff). Job relancé une fois à 15:31 UTC : **vert**.
  Build iOS vert à 15:43 UTC ; captures iPhone de l'Accueil (clair, sombre) relues, audit des mots Android vide.
  **#1150 mergée** (squash, 12bdaff).

## Ce qui a été fait
- **POLISH-SIM-124b** (`pages/Onboarding.jsx`) : au temps 2, « Non, pas pour l'instant » affichait seulement « Si
  votre téléphone compte vos pas, vous pourrez relier Health Connect dans Réglages › Sources. », et le temps 3 restait
  sans tuile pour la configuration la plus fréquente (téléphone seul). La carte Health Connect / Santé est maintenant
  proposée aussi à « Non », en version téléphone : « vos pas, comptés par votre téléphone », « Halcya lit vos pas et
  vos 30 derniers jours. Elle n'écrit rien et n'envoie rien. » (divulgation au-dessus du bouton, comme avec une
  montre), bouton « Connecter … ». Accès donné → import lancé et tuile « Pas (votre téléphone) » au temps 3
  (POLISH-SIM-124). Rien n'est demandé sans le geste ; Health Connect absent → la ligne « n'est pas sur ce
  téléphone » existante. Pas de ligne « balance » à « Non ».
- Aucune donnée ni schéma changés.

## Vérifications
- Tests d'abord : 2 cas neufs (`Onboarding.sources.test.jsx` : carte téléphone, tuile au temps 3) et 1 cas repris
  (`Onboarding.test.jsx` : sans Health Connect), rouges puis verts ; le cas « aucune permission demandée » ne
  vérifie plus que la disponibilité n'est pas lue (elle l'est, en lecture seule), il vérifie toujours qu'aucune
  permission n'est demandée et qu'aucun import ne part sans geste.
- `npm run test` : 4 155 verts ; `npm run build` vert ; lint des fichiers touchés propre.
- `npm run visual -- --routes=/bienvenue --onboarding=watch-no` (clair et `--dark`) : captures relues, la bulle de
  Pilou (« D'accord, votre téléphone suffit. ») et la carte disent la même chose.

## iPhone
- Code partagé. Le correctif **45** (« 6 derniers mois » de Santé) ne s'appliquait plus sur la carte : refait
  (`IMPORT_SPAN` dans les deux phrases de la carte) ; `scripts/upstream.sh` applique les 49 correctifs. Sur iPhone :
  « Santé », « vos pas et vos 6 derniers mois ». Note de Nouveautés commune sans nom d'app Android ni durée d'import.
  Parité inchangée : 70 %.

## Suite proposée
1. Finir cette PR (#1151) : rebasée sur #1150 (conflits du journal seulement), un seul build iOS lancé après le
   rebase (celui d'avant annulé pour ne pas payer deux heures de Mac) ; capture iPhone du temps 2, puis merge.
2. De jour : captures App Store de la refonte (REFONTE-2-ASC), puis PI2 (21 ou 22/11).

## Coût CI
- Build iOS de #1151 annulé à 15:39 UTC (moins d'une minute) et PR remise en brouillon : le rebase après #1150
  l'aurait relancé. Un seul build iOS pour #1151.

# 05/11 21:35 — Fiche et abonnements : même délai de 24 h que l'alpha (CD-ALPHA-5)

Type : 🔧 run de code (21:35 Paris). Priorité : retours du 04/11, point (1) (garder la livraison continue verte et
laisser l'examen de Google aboutir), étape préparée par le run « idées » de 20:35 (I222).

## Constat au démarrage
- main `e3320bf` (#735, journal + CI-OLDWV-1) : Tests, Build & Release, émulateur et « Play — AAB » en cours ; derniers
  « Play — Alpha » verts. Aucune PR « [Auto] » ouverte. Tâche indépendante des fichiers du build (scripts Play).
- Historique réel : dernier envoi réussi de la fiche le 03/11 05:01 UTC (`e140e2f`), des abonnements le 03/11 00:57
  (`ab16d9a`). Le passage de la fiche du 04/11 22:59 (`b481d9e`) avait été annulé ; il ne portait que sur
  `app/store/data-safety/answers.mjs`, qui n'est pas la fiche.

## Fait
- `reviewGate.mjs` (pur) : `decideReviewed` (le plus récent des envois examinés compte ; délai réglable ; gel),
  `lastSent` (étape d'envoi réussie → date et commit), `hasNewContent` (contenu propre à la fiche ou aux abonnements).
- `alphaGate.mjs` : la porte de 24 h passe par `decideReviewed`, avec `otherSends` (fiche, abonnements) et le gel.
- `reviewIo.mjs` : lecture des exécutions et de leurs étapes (API Actions), gel, commit d'une version, fichiers depuis.
- `review-gate-cli.mjs` + `play-listing.yml` / `play-subscriptions.yml` : étape « Délai entre deux envois examinés par
  Google » avant l'envoi (sorti `send`), clone complet, `actions: read`, passage quotidien 07:23 / 07:33 UTC. Rien de
  neuf depuis le dernier envoi → pas d'envoi (la fiche était renvoyée en entier à chaque passage, même inchangée).
  Lecture impossible → report, jamais d'envoi à l'aveugle.
- `alpha-cli.mjs` : lit ces envois ; illisibles → report au passage suivant.
- Gel `app/scripts/play/review-freeze.json` (`until: null`) : la routine y met une date le jour où le propriétaire
  envoie la demande de production (P30), par PR (hors app, aucun envoi déclenché).
- Pas d'entrée Nouveautés : rien ne change dans l'app.

## Vérifications
- 11 nouveaux tests (8 `reviewGate.test.mjs`, 3 `alphaGate.test.mjs`) ; anciens tests CD-ALPHA-2 inchangés et verts.
- Sur l'historique réel (`git diff` depuis les commits des derniers envois) : `hasNewContent` faux pour la fiche et les
  abonnements → le merge (qui touche les deux workflows) n'enverra rien.
- `npm run test`, `npm run lint`, `npm run build`, `npm run visual` : voir « Après les vérifications ».

## Suite
- CD-ALPHA-6 : relire le bilan de la porte au premier vrai report.
- CD-ALPHA-4 si 100811 est encore « En cours d'examen » après 48 h. Ensuite GOLD-a3-2 (dès P37), chantier montre.

## Après les vérifications et le merge
- Local : `npm run test` 3 154 verts, `npm run lint` 0 erreur, `npm run build` OK, `npm run visual` toutes les pages
  « ok » (`dashboard-1.png` relu, inchangé).
- #736 mergée (squash `fbaa9c5`) après 11 checks verts. « Build & Release » vert : **v520** (APK 34 553 586 octets).
- « Play — abonnements » sur main : porte « rien de neuf dans les abonnements depuis le dernier envoi (`ab16d9a`) :
  pas d'envoi », étape d'envoi sautée : la porte marche en vrai.
- « Play — fiche du Store » **annulé** par la file `play-edits` (un seul passage en attente par groupe : celui de
  « Play — Alpha » l'a remplacé, comme le 04/11). Sans conséquence ici (rien de neuf) ; et une fiche modifiée dont le
  passage serait annulé partira quand même au passage quotidien de 07:23 UTC, la porte comparant les fichiers au
  dernier envoi réussi. Noté dans CD-ALPHA-6.
- « Play — Alpha » : seuls des scripts et des workflows ont changé, rien ne part (100811 reste sur Alpha).

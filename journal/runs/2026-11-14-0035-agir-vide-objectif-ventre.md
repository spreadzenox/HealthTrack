# Run 14/11 00:35 — Nuit iPhone : 1030.1031 chez les testeurs ; Agir vide selon l'objectif (POLISH-SIM-70)

**Type** : code (mode polish) et suivi iPhone  ·  **Android** : v1033 sur main après ce run  ·
**TestFlight** : **1030.1031** (version 893) chez les testeurs externes depuis le 14/11 à 00:33, validée par Apple
sans attente ; 1024.1028 et 1024.523 expirées ; 844.344 intacte  ·  **Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main 55d4e43 vert (Tests, Build & Release, Play — AAB, émulateur A56). Aucune PR « [Auto] » ouverte (#51
  `cursor/*` non touchée).
- L'envoi Alpha du soir (cron de 23:45) n'était pas parti à 00:35.

## Fait
1. **Soumission bêta de la nuit** (`ios-store-beta-submit.yml` sur main, build 1030.1031) : « Build 1030.1031
   (traitée par Apple) », « À tester » complété, ajoutée au groupe externe « Testeurs Halcya », soumise à l'examen
   bêta (00:33). Le relevé suivant dit : « en test 1030.1031 ; refusées aucune ; en attente aucune ». C'est la
   première build de ce dépôt chez les testeurs : la chaîne de publication marche après la bascule.
   Lancée avant l'envoi Alpha, qui tardait : la build était prête et les testeurs avaient encore le code de la v1024.
2. **Nettoyage** (`ios-store-beta-expire.yml`, d'abord en essai, puis réel) : « Gardée : 844.344 (version de l'App
   Store) », « Gardée : 1030.1031 (dernière build distribuée au groupe externe) », « Expirée : 1024.1028 »,
   « Expirée : 1024.523 (examen bêta APPROVED) ». La version de l'App Store n'a pas été touchée.
3. **Suivi iPhone** : `scripts/upstream.sh --latest` : v1030 → v1032 (55d4e43, POLISH-SIM-68). Les 52 correctifs
   s'appliquent sans retouche.
4. **POLISH-SIM-70** (deux personas J45) : sur Agir vide, « Où en sont vos analyses » ouvrait Analyses › Bien-être
   même avec l'objectif ventre. `Act.jsx` : avec l'objectif digestion ou cycle (`wantsGut(goalsOf())`, la règle de la
   barre d'onglets), le lien ouvre `/recommendations/ventre` ; une phrase dit quoi faire en attendant : « D'ici là,
   notez votre digestion chaque jour. » (« votre bien-être » sinon).
   Nouveautés : `2026-11-14-0035-agir-vide-objectif-ventre.json` (code partagé).

## Vérifs
- Tests écrits d'abord (2 rouges, puis verts) : `Act.test.jsx`. `npm run test` (3509 verts, 44 ignorés),
  `npm run lint` (0 erreur), `npm run build`, `npm run visual` complet (18 pages) sans erreur.
- Agir vide, variante play, objectif ventre : [clair](captures/2026-11-14-0035-agir-vide-ventre-clair.png),
  [sombre](captures/2026-11-14-0035-agir-vide-ventre-sombre.png) ; sans objectif ventre (données de démo) : la phrase
  dit « votre bien-être », regardée.
- Code embarqué v1032 avec les 52 correctifs (`iphone/upstream/app`) : Vitest 3866 verts (44 ignorés), ESLint 0
  erreur.
- La PR change `iphone/upstream.json` : « iOS — build simulateur » (près d'une heure) et ses captures
  `captures/pr-<N>` doivent être vertes et regardées avant le merge. Si ce compte rendu est sur main, c'était le cas.

## Limites
- `ios-store-push.yml` non lancé : il écrit dans la fiche de la version de l'App Store, et la version 844 est
  soumise par le propriétaire. Je n'ai pas vérifié s'il s'abstient seul dans cet état : à lire avant de le relancer.
- Le plan de l'essai à blanc du nettoyage n'a pas été lu ligne à ligne avant le lancement réel (seul son relevé
  l'a été) ; le résultat réel est conforme à la règle du 09/11.
- La phrase « D'ici là… » suit l'objectif, pas le réglage qui masque la carte digestion.
- POLISH-SIM-70 sur iPhone : au prochain suivi (le code embarqué de cette PR est la v1032).
- Charte, PARITE, BACKLOG et PRODUIT lus par sections, pas en entier (plus de 1 Mo).

## Suite
- Finir cette PR si la build iOS n'est pas verte à la fin du run (captures Aujourd'hui : bloc digestion), merger,
  relever la build TestFlight envoyée. Ne pas la soumettre avant la nuit suivante (une soumission par jour).
- Vérifier que l'envoi Alpha de la nuit est parti et vert.
- FUSION-2 (upstream à HEAD) ; POLISH-SIM-69, 71 ; CYCLE-3a-2.

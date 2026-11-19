# Run du 19/11 03:30 — Nouveautés : la nouvelle navigation en premier (POLISH-SIM-101, UPG-5)

**Type** : 🛠️ code (polish de la refonte, objectif du 22/11) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main f82cecb.

## État de départ
- main vert (#1112 mergée : Tests, Build & Release, Play — AAB, émulateur, Fiche App Store verts).
- Aucune PR « [Auto] » ouverte (seule #51, brouillon de mai, hors routine).
- Envoi du soir iPhone : « iOS — TestFlight » (planifié) a envoyé **893 (1173.1173)** le 19/11 vers 02:00 UTC ;
  « iOS — build simulateur » planifié vert.
- Alpha de 23:45 pas encore partie à 02:30 UTC (dernier passage planifié : 18/11 03:53 UTC, en échec pendant le
  blocage de facturation ; les nuits d'avant entre 02:24 et 04:47 UTC).

## Ce qui a été fait
- `app/src/pages/WhatsNew.jsx` : la note marquée `aLaUne` (nouvelle navigation), quand elle n'est pas lue, passe en
  tête de la page Nouveautés ; elle est choisie par `bannerHeadline`, comme le titre du bandeau. Une fois lue, la page
  reprend l'ordre par date.
- `2026-11-15-0435-refonte-navigation.json` : une ligne dit où est passé « Mon cycle » (bouton « Règles » de Ma
  journée, visible avec des données de cycle ou l'ancien objectif).
- Note de Nouveautés `2026-11-19-0330-nouveautes-a-la-une` (Android et iPhone).
- Tests d'abord (2 rouges, puis verts) : ordre avec la note non lue, ordre une fois lue, ligne « Mon cycle ».

## Vérifications
- `npm run test` : **4 086 verts** (367 fichiers) ; `npm run build` vert ; ESLint propre sur les fichiers touchés.
- `npm run visual -- --routes=/nouveautes --now=14:00` (tout lu : ordre par date) et `--whats-new` (testeur qui met à
  jour : la note du 15/11 en premier, avec sa ligne « Mon cycle », pastilles « non lu ») : captures relues.
- iPhone : code partagé ; le correctif 33 (test de Nouveautés) s'applique toujours (`git apply --check`). La PR
  passe en « prête » pour son build iPhone.

## Non fait
- **Soumission bêta de la 1173.1173** (« TestFlight — examen bêta (soumission) ») : le lancement du workflow depuis
  cette session a été refusé par l'outil de permissions de la session. Rien n'a été contourné. À lancer au run suivant,
  après l'Alpha, puis l'expiration des anciennes builds.

## État
- TestFlight : 893 (1173.1173) envoyée ; 1148.1148 chez « Testeurs Halcya ». Parité : 70 % (inchangée).
- Testeurs Play : 4 inscrits sur 12 (pas de nouveau relevé).

## Suite proposée
1. Après l'Alpha : 1173.1173 aux « Testeurs Halcya », soumission bêta, puis expiration.
2. REFONTE-2-ASC, de jour (9:00 à 17:00, Paris) : séries de captures iPhone puis iPad.
3. Polish du 22/11 : POLISH-SIM-102 et UPG-7 (deux décomptes de la digestion), UPG-6 (moyenne sur 7 jours dite).

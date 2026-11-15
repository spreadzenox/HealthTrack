# Run 15/11 05:35 — Refonte « Compagnon », étape 3 : la checklist de Ma journée

**Type** : code (refonte « Compagnon », étape 3 du § 10 du brief)  ·  **Android** : main b4ce358 (#999, v1075) au début  ·
**TestFlight** : **1072.1073 validée par Apple et chez les testeurs externes** (relevé de 06:03) ; 13 builds plus
anciennes expirées à 06:05 ; « iOS — TestFlight » parti seul au merge de #1000 (code v1075, en cours à 06:01,
arrivée non vérifiée) ; aucune soumission à ce run ; 844.344 intacte  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions vérifiée : conforme (710f9e8b…). Brief de la refonte lu en entier ;
  `specs/journee.SPEC.md` § 0 à 2 et 4 à 10 lus (pas le § 3, « nourrir Pilou », ni les § 11 et 12).
- Main b4ce358 vert : Tests, Build & Release, Play — AAB (v1075), émulateur.
- #1000 (suivi iPhone de l'étape 2) ouverte à 05:10 par le run de 04:35, build macOS en cours. #51 non touchée.

## Fait
1. **#1000 finie et mergée à 06:00** (30960fc) : 15 checks verts, « TEST BUILD SUCCEEDED », branche à jour sur
   main, « Play — AAB » vert sur b4ce358. Captures `captures/pr-1000` regardées (iPhone 16e) : Accueil (démo clair,
   sombre, installation vide), Ma journée (démo clair, sombre, vide), Données › Tendances. Les 4 onglets y sont.
2. **Étape 3 sur Android, #1001** :
   - `services/dayChecklist.js` (fonction pure) : les tâches du jour et ce qui est déjà noté. Repas : trois
     créneaux, un repas remplit celui de son heure (avant 11 h, avant 16 h, après). Bien-être : une note
     d'aujourd'hui. Digestion : seulement avec l'objectif digestion, bilan du jour, disponible à partir de 18 h.
   - `DayChecklist.jsx` : « Encore N choses aujourd'hui » et une pastille par tâche ; ligne Repas (cercle vide =
     appareil photo, cercle rempli = lien vers Repas), ligne Bien-être (« Noter »), ligne « Votre digestion ce
     soir » ; une ligne faite dit « Noté » puis part en 700 ms (fondu seul en mouvements réduits) ; annonce au
     lecteur d'écran ; « Plus rien à faire » ; « Déjà noté (n) » (repas, note de bien-être modifiable, bilan).
   - `Dashboard.jsx` : la checklist en tête de Ma journée, le bandeau d'ajout et le bloc digestif dessous.
   - **Retiré** : `TodayMeals` (« Mes repas du jour », avec ses calories), remplacé par la ligne Repas et « Déjà
     noté ».
   - `npm run visual -- --day-done[=partial]` ; icône `check` ; note de Nouveautés
     `2026-11-15-0535-ma-journee-checklist.json` (les deux magasins).
3. **TestFlight** : relevé (`ios-store-beta.yml`, lecture seule) : « en test 1072.1073, 1030.1031 ; refusées aucune ;
   en attente aucune ». Expiration (`ios-store-beta-expire.yml`, sur main) : essai d'abord (plan : garder 844.344 et
   1072.1073, expirer 13 builds), puis nettoyage réel : expirées 1065.1067, 1059.1063, 1054.1057, 1050.1051,
   1047.1048, 1044.1045, 1040.1041, 1037.1038, 1036.1037, 1035.1036, 1034.1035, 1032.1033 et 1030.1031 ; relevé
   d'après : « en test 1072.1073 ». La version de l'App Store n'a pas été touchée.
4. Journal : résumé, `BACKLOG.md` (REFONTE-2 et 3), `PRODUIT.md`, `PARITE.md`, `iphone/journal/BACKLOG.md`.

## Vérifs
- TDD : 9 tests du service et 7 du composant écrits avant leur code ; le test d'intégration de `Dashboard` écrit
  après le branchement.
- `app/` : `npm run test` 3593 verts, 44 ignorés ; `npm run lint` sans erreur ; `npm run build` ; `npm run visual`
  (toutes les pages ok).
- Captures regardées (Android, 412 px) : données de démo, installation vide, un repas et le bien-être notés avec
  « Déjà noté » ouvert, le soir (digestion disponible), tout noté en clair et en sombre. Deux défauts vus et
  corrigés : chevrons dans le mauvais sens, trait arrondi sous une ligne de « Déjà noté ».
- iPhone : le correctif 56 (seul à toucher un fichier modifié) s'applique sur la branche (`git apply --check`).

## Limites
- **L'animation de départ d'une ligne n'a été vue sur aucune capture** : seuls les tests la couvrent (classe et
  retrait après 700 ms).
- **Écarts avec la spec, à confirmer par le propriétaire** (dits dans le résumé) : 18 h au lieu de 19 h ; un
  cercle se remplit selon l'heure du repas, pas selon le cercle touché ; une lecture du visage ne coche pas le
  bien-être.
- Non faits : bannière de Pilou, bulle, toast « Annuler », haptique, « Hier », « Bon retour », hauteurs exactes des
  lignes de la spec.
- Le bandeau d'ajout double Repas, Bien-être et Digestion ; le bloc digestif reste dans Ma journée.
- Une journée à deux repas ne finit jamais. Le bilan digestif déjà noté ne se modifie pas depuis « Déjà noté » (la
  fenêtre s'ouvre, la question n'y est plus).
- Pas de maquette de la liste dans le kit (`chapitres/3-journee.jpg` montre Pilou qui mange) : captures jugées
  seules.
- Non regardés : grand texte, `--light`, 320 px ; les autres pages après le changement (ok au rapport, pas ouvertes).
- Tests du code embarqué iPhone non lancés ; les 51 correctifs non rejoués (un seul vérifié).
- `iphone/journal/README.md` § 3 et § 4 lus, § 8 non ; `PARITE.md`, les deux `BACKLOG.md`, `PRODUIT.md`, `DESIGN.md`,
  `INFRA.md` et la charte non relus en entier (plus de 1 Mo) : sections touchées seulement.
- TestFlight : `ios-store-push.yml` (renommage de la version « Prête à soumettre », charte iPhone § 4) non lancé après
  l'expiration ; la build du code v1075 non relevée.

## Fin du run
- **PR #1001 mergée à 06:23** (squash, c0f316e, v1077) : 12 checks verts (Vitest, Build APK, quatre émulateurs, WebView
  ancienne, relais, perf, protocole montre), branche à jour sur main.
- Après le merge : **release v736, APK 33,0 Mo** (06:26). « Play — AAB », Tests et l'émulateur de main encore en
  cours à 06:28 : à relire au run suivant.
- « iOS — TestFlight » vert sur 30960fc (merge de #1000, code v1075) ; la build n'a pas été relevée chez Apple.
- **iPhone, étape 3 : PR de suivi ouverte, pas mergée** (branche `claude/iphone-refonte-3`) : `upstream.json` de
  v1075 à v1077 (c0f316e, écrit à la main : `--latest` attend la fin de « Play — AAB »). À blanc, sous Linux, sur
  le code de l'étape 3 : les 51 correctifs s'appliquent sans retouche ; tests du code embarqué : 3944 verts,
  44 ignorés, **3 échecs et 1 fichier non chargé**, tous sur des fichiers lus hors du dossier (`store/app-store/…`,
  `.github/workflows/…` : `ENOENT`), parce que j'avais préparé `upstream/` dans un dossier temporaire et non dans
  `iphone/upstream` ; non relancés au bon endroit : la CI de la PR tranche.

## Suite
- **Finir la PR de suivi iPhone de l'étape 3** : « Play — AAB » vert sur c0f316e, checks verts (dont « Tests
  d'Android avec les correctifs iOS »), captures `captures/pr-<N>` de Ma journée regardées (démo clair, sombre,
  vide, grand texte : la ligne Repas tient-elle en grand texte ?), puis merge.
- **Étape 4 (Habitudes)** : modèle de données et migration IndexedDB, saisie, couleur miel, analyses ; y réduire le
  bandeau d'ajout de Ma journée à ce que la checklist ne porte pas.
- Réponses attendues du propriétaire sur les trois choix de l'étape 3 (18 h, cercle selon l'heure, note seule).
- Relever la build du code v1075 chez Apple ; elle part chez les testeurs après l'Alpha de ce soir.
- Restes de l'étape 2 et de l'étape 3 au BACKLOG ; le bouton « + 1 cigarette » sur iPhone, toujours non regardé.

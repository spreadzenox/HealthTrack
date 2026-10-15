# 2026-10-15 08:30 Paris (06:30 UTC) — Idées : synchro sans y penser, stress / VFC, humeur sur des bases légales

**Type** : 💡⌚ (run « idées »)  ·  **PR** : journal seul, pas de code produit

## Pourquoi
- Démarrage : main à `944ae66` (#164), **v132 publiée** avec son APK (Build & Release, Tests et émulateur A56 verts).
  Aucune PR « [Auto] » rouge ou en conflit ; seule `cursor/*` #51 est ouverte, hors routine, et je n'y ai pas touché.
- 08:30 Paris = run « idées ». Aucun nouveau journal du propriétaire depuis v124 (`diagnostics/` inchangé). La part
  montre de la recherche a porté sur **ce qui déclenche la synchro app fermée** (étape ③ e) et sur les mesures
  encore absentes (stress, VFC de journée).

## Ce qui a été fait
- Recherche en 3 volets parallèles : montre et arrière-plan (API REST Codeberg + doc Android), humeur et ML
  embarqué (licences), besoins et marché.
- **Spécification montre** (`protocoles/huawei.md` §7.11, nouveau) :
  - présence compagnon liée au lien Bluetooth système ;
  - synchro de Gadgetbridge (GB) au déverrouillage, pas à la reconnexion (#6266) ;
  - relance après redémarrage « sticky » (#6869 / PR #6905) ;
  - ordre de synchro, messages spontanés de la montre ;
  - stress = fichier 0x2C type 0x10 (entrées de 66 octets), VFC de journée = dictionnaire 500044, sommeil détaillé
    `sequence_data` ;
  - téléchargement 0x2C en 5 étapes, en mots ;
  - famille et empreintes (Watch 6 / 6 Pro, PR GB #7074 du 15/10).
- **Recoupement avec le code** avant de proposer :
  - le sommeil détaillé et la VFC de la nuit sont **déjà lus** (`files.js`, depuis le 13/10) ;
  - `isHuaweiWatchName` et `isHuaweiLinkDevice` reconnaissent déjà les noms Watch 6 / Honor Band.
  - Les idées I76 et I77 ont été réduites en conséquence.
- **Idées** (`IDEES.md`, 7 nouvelles, I75–I81) :
  - I75 deux déclencheurs pour la synchro app fermée (20) ;
  - I78 réseaux sociaux = X, décidé (20) ;
  - I76 stress et VFC de journée (16) ;
  - I79 bilan du mois (16) ;
  - I80 rien d'imposé à l'écran (12) ;
  - I77 empreintes verrouillées par des tests (10) ;
  - I81 lieux étiquetés (9).
- **Décisions consignées** :
  - **D5** : l'usage des réseaux sociaux est un X, et l'estimateur = visage + voix + auto-déclaration (backlog D4 / D5) ;
  - **I73** : débloquée côté licence (poids MediaPipe Face Landmarker sous Apache-2.0) ;
  - **écartée** : un modèle d'émotion vocale pré-entraîné dans l'APK.
- **Backlog** : n°3 précisé (I75, I76), D4 / D5 (décision réseaux sociaux), n°13 (nouvelles idées), n°14 (prochain
  run idées).
- **Résumé hebdo** : paragraphe pour le propriétaire, 2 meilleures idées, ligne de run ; la ligne du run 06:30 est
  passée à « #164 → v132 ».
- Pas d'entrée « Nouveautés », car rien ne change dans l'app.

## Vérifications
- Tests : **1228 ✅** (96 fichiers) · Build ✅ · Lint : **6 erreurs** (baseline inchangée).
- `npm run visual` (démo) : 8 pages OK, aucune erreur JS ; capture `dashboard-1` relue, inchangée (aucun code produit modifié).

## Apprentissages / décisions
- La présence compagnon seule ne couvre pas « app tuée, montre revenue à portée » : il faut un second déclencheur.
  Corrige l'hypothèse implicite d'I72.
- Vérifier le code avant de proposer une idée de mesure : deux des sept idées étaient déjà en partie livrées.
- Point d'attention pour le propriétaire : la vérification des développeurs pour le sideload. Elle s'applique dans 4
  pays depuis le 30/09/2026 et partout en 2027 [T]. Le cas des releases GitHub est à suivre.
- Sites inaccessibles : old.reddit.com, channelnews.com.au et androidauthority.com (403), mhealth.jmir.org e90970
  (page vide), thieme-connect.com, recherche de code GitHub (hors périmètre de la session).

## Suite proposée
1. ⌚ Lire le journal v125+ dès qu'il arrive.
2. ⌚ D3 (③ d) : lectures 7/x en Java vers un tampon importé par le JS. Puis (③ e) avec **I75** : présence +
   déverrouillage + filet périodique, relance après un redémarrage sans intent.
3. ⌚ I76 (stress, VFC de journée) une fois la synchro de base confirmée ; I77 à glisser dans un run montre.
4. ⚡ D2 suite (`WellbeingCharts` par agrégats). Puis 🧹 D1 avec I65, et 🔁 D5 avec I70 + I78.

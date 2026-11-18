# Run du 18/11 18:30 — PR regroupée, kit testeurs, « Infos de santé » chez Google

**Type** : 🛠️ code (journal, déclaration Play, outillage App Store) · **Contrôle d'intégrité** : empreinte conforme
(dd430fbd…), origin/main 0af7f4c.

## Ce qui a été fait
- **PR regroupée #1102** (#1090 à #1097) : checks suivis jusqu'au bout, captures iPhone relues, merge (voir § Merge).
- **#1099 fermée** (empreinte du run de 16:30, obsolète depuis la mise à jour des instructions) ; son compte rendu
  est repris dans le journal (`runs/2026-11-18-1630-empreinte.md`).
- **Testeurs (retours du 18/11, point 3)** : `INVITATION-TESTEURS.md` § 0 nouveau : 4 inscrits sur 12, il en faut
  8 de plus (viser 11) ; messages prêts A (aux 4 inscrits : rester et parrainer), B (proche, SMS), C (groupe d'amis),
  D (communauté en ligne) ; les 3 liens dans l'ordre ; canaux du plus sûr au moins sûr ; alerte sur `until` (2/12).
  Texte d'invitation (§ 3) et missions des jours 3, 7 et 10 réécrits pour la refonte (Pilou, Ma journée, Objectifs,
  Données, Réglages › Sauvegarde) ; P12 à jour.
- **SECU-SANTE (point 4)** : Apple déclare « Health » pour la photo des selles, c'est juste (photo qui dit quelque
  chose de la digestion, envoyée au relais). Google ne déclarait rien en santé : `PSL_HEALTH` (Infos de santé)
  ajouté, collecté, facultatif, pour le fonctionnement, pas partagé ; CSV régénéré ; test qui l'exigeait absent
  réécrit + 1 test. Envoi = **P51**, geste du propriétaire (workflow « Play — sécurité des données »).
- **R18-GOLD-PRIX (point 2), outillage** : le script des abonnements App Store imprime désormais toujours son relevé
  sans écriture, chaque prix avec sa date de début (une date future = prix pas encore valable, cause probable d'un
  « You must add a subscription price » alors que la page montre des prix) et le drapeau « gardé ». 19 tests verts.

## Vérifications
- Premier passage de #1103 : « Tests d'Android avec les correctifs iOS » rouge : `privacyManifest.test.js` (overlay iPhone)
  ajoutait « Health » à part, en plus des types de Google. Corrigé : `PSL_HEALTH` ↔ `NSPrivacyCollectedDataTypeHealth`,
  les deux déclarations sont désormais identiques ; vérifié en local (4 tests A5 verts).
- `npm run test` (app/) : 4 081 verts (367 fichiers). `node --test scripts/store-subscriptions.test.mjs` : 19 verts.
- `node scripts/play/data-safety-cli.mjs --write` : types déclarés PURCHASE_HISTORY, APPROX_LOCATION, PHOTOS,
  HEALTH, USER_GENERATED_CONTENT, DEVICE_ID.
- Aucun écran touché par ce run (pas de capture à relire hors #1102).

## Merge
- **#1102 mergée** (e35c665, squash) : 15 checks verts (Vitest, APK, 4 émulateurs, relais, build iPhone avec un seul
  iPhone, 0 erreur JS). Captures iPhone relues : Accueil démo clair et sombre (îlot élargi, herbe dorée, bulles,
  étiquette « Pilou est tranquille »), Agir. #1090 à #1097 fermées. Build & Release de main : **v792**, APK 35,6 Mo (35 625 541 octets).
- Cette PR-ci (journal, déclaration Play, script App Store) : en brouillon, puis prête ; merge si ses checks passent.

## Suite proposée
1. Lancer « Abonnements App Store — création » sur main, lire le relevé des prix (R18-GOLD-PRIX) et corriger par l'API.
2. Vérifier le build iPhone du soir (21:20) et l'envoi TestFlight, puis la soumission bêta après l'Alpha.
3. R18-SOUMISSION : version 844 avec une build de la refonte, notes d'examen, PI2 réécrite.

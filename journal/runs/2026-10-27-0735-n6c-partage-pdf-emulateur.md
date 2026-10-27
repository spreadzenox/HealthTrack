# Run du 27/10/2026 07:35 (Paris, CET) — N6c : partage du rapport PDF vérifié sur l'émulateur

**Type** : 🏗️ code (chantier FODMAP / rapport PDF, demande du propriétaire du 26/10 14:45 ; dernière étape de N6)

## Constat au démarrage
- Main à `2cb2ab0` (#420, N4 reste, v309). PR #421 (journal du merge N4, tous les checks verts, « le run suivant la
  merge ») mergée en ouverture → `e6dde79`. Aucune autre PR « [Auto] » ouverte, aucun « Build & Release » en cours.
- N6b (27/10 04:33) avait livré le bouton « Rapport PDF pour mon médecin » sans preuve sur un vrai Android : écriture
  dans Documents (stockage partagé), FileProvider pour le partage, feuille de partage du système.

## Ce qui a été fait
- `.github/scripts/pdf-share/drive.mjs` (même pilotage que la vidéo P28 : DevTools de la WebView de la build debug pour
  trouver les éléments, vrais appuis `adb shell input tap`, uiautomator pour Android) : 30 jours de données de démo
  synthétiques, objectif « Mon ventre » → Données → « Préparer le rapport » → « Créer le PDF » ; vérifie la feuille de
  partage, le fichier `*-rapport-AAAA-MM-JJ.pdf` dans `/sdcard/Documents` (en-tête `%PDF-`, > 5 Ko), le message après
  annulation (retour), puis un 2ᵉ rapport le même jour. Résumé `pdf_share.md` dans le job, captures + PDF dans
  l'artefact « rapport-pdf-emulateur ».
- `run-emulator-tests.sh` : l'étape tourne si `PDF_SHARE_CHECK=1` (job API 35 seulement, Node 22 ajouté), **non
  bloquante** pour l'instant (avertissement si une étape échoue).
- Choix : les aides DevTools sont recopiées depuis `p28-video/drive.mjs` plutôt que factorisées, pour ne pas toucher
  au film P28 (workflow manuel, non rejoué ici). À factoriser si un 3ᵉ script en a besoin.

## Résultat sur l'émulateur (PR #422, Android 15)
| Étape | |
|---|---|
| 889 entrées de démo insérées | ✅ |
| Données → « Préparer le rapport » → « Créer le PDF » | ✅ |
| Feuille de partage d'Android ouverte, « Sharing 1 file · Halcya-rapport-2026-10-27.pdf » (Quick Share, Imprimer, Drive, Messages, Bluetooth) | ✅ |
| Fichier dans Documents : 20 352 octets, `%PDF-` | ✅ |
| Partage annulé → « Halcya-rapport-2026-10-27.pdf est dans Documents (app Fichiers › Documents). » | ✅ |
| 2ᵉ rapport le même jour : un seul fichier, même message | ✅ |

PDF relu (rendu local par pdftoppm) : 2 pages « En bref » / « Détail » correctes (ventre 5 / 1 / 3 jours, semaine par
semaine, calendrier, sommeil mesuré, aliments fréquents, sources, attribution Ciqual). Pied « Halcya 0.0.0 » : seulement
la build de test de la CI (sans `VITE_APP_VERSION`) ; les releases et la version Play injectent leur numéro.
pdftoppm absent du runner (`apt-get install` sans `apt-get update`) : aperçu PNG facultatif, à corriger un jour.

## Vérifications
- `npm run test` : **2 519** verts (+ 44 sautés) ; `npm run build` OK ; `npm run visual` : 15 pages « ok », 0 erreur JS
  (app inchangée, page Données regardée). Lint inchangé (aucun fichier de l'app touché).
- PR #422 : Frontend (Vitest), Build APK, relais, protocole montre, budget de lectures, émulateurs API 35 et 36 verts →
  mergée (squash) en `1d05c98`.

## Suite
- M6 / M7 / jalon 5 selon l'ordre du propriétaire ; « Vos derniers jours » avec FODMAP (facultatif) ; rendre l'étape
  PDF bloquante après quelques runs verts.

## Merge
- « Build & Release » vert : **v310** publiée, APK 34,9 Mo (34 892 417 octets).

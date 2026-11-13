# 2026-10-28 20:00 UTC — Textes justes sur iPhone : bien-être sans lecture du visage, conseil Apple Watch

**Étape** : I9 (fidélité de l'app et de la fiche), I7 en attente  ·  **PR** : #42 (CI en cours), #43 (I7, première étape)  ·  **Android suivi** : v567 (aucune nouvelle version publiée depuis le run précédent)  ·  **iOS** : 567 sur `main` (simulateur)  ·  **Parité** : 32 % (15/47)

## Messages du propriétaire depuis le run précédent
- Aucun. A1 reste en cours : il attend l'e-mail de confirmation d'Apple.

## Ce qui a été fait
- Reprise de la branche `claude/ios-i9-textes-iphone`, poussée à la fin du run de 18:59 avec les deux défauts relevés sur les captures de #41. `scripts/upstream.sh --latest` donne toujours v567.
- **Correctif 25** (`25-textes-sans-visage-iphone.patch`). Sur iPhone, rien n'invite à activer la lecture du visage, absente tant qu'I7 n'est pas fait :
  - Accueil, « Bien-être estimé » vide : « Notez votre bien-être du jour. Son estimation par la lecture du visage arrive bientôt sur iPhone. », suivi de « Noter moi-même ». Le lien « L'activer dans Sources » n'apparaît plus.
    - Un vrai utilisateur d'iPhone le voyait aussi : la démo d'Android le cachait avec ses lectures du visage.
    - La condition est `FEATURES.iosStore && !isFaceSenseAvailable()` : l'invitation d'Android revient d'elle-même avec le plugin d'I7, et rien ne change sur Android.
  - Historique du bien-être sans note : « Notez-le avec « Noter moi-même »… », sans « Activez la lecture du visage ».
  - Sources, « Mes appareils », pour une Apple Watch : « Si votre montre en est capable, activez cette mesure dans l'app Watch de l'iPhone. » remplace « activez ce partage vers l'app Santé dans Apple Watch ».
  - Le correctif ne fait qu'ajouter des lignes à `MoodEstimateCard.jsx` et `WellbeingCharts.jsx`, et une ligne remplacée dans `MyDevices.jsx` : il résiste mieux aux évolutions d'Android.
- Tests (3 nouveaux, variante appstore) : `MoodEstimateCard.appstore.test.jsx`, `WellbeingCharts.appstore.test.jsx`, et un cas Apple Watch dans `MyDevices.appstore.test.jsx`. Suite d'Android : 2759 passés ; build appstore faite.
- Leçon : un correctif se génère depuis l'état sans lui. Le premier essai, fait après un `upstream.sh` qui l'avait déjà appliqué, ne gardait que le dernier fichier modifié. Refait en mettant le correctif de côté.

- **I7 commencé** (branche `claude/ios-i7-visage`, PR #43, posée sur #42).
  - Étude du code visage d'Android déléguée à un sous-agent en lecture seule, puis vérifiée ; résumée dans `RECHERCHE.md`.
  - ⚠️ Poids HSEmotion appris sur AffectNet (recherche non commerciale), idée I73 d'Android non tranchée : valence et éveil restent éteints sur iPhone jusqu'à la décision du propriétaire (`DEMANDES.md`). La première version iOS se contentera de MediaPipe (Apache-2.0).
  - Étape 1 : paquet Swift `ios/HalcyaFace`, avec les ancres du détecteur, le carré à bandes noires et le recadrage tourné.
    - Ses tests XCTest lisent les portraits et vecteurs d'Android dans `upstream/`, sans copie ; nouvelle étape de CI `swift test --package-path ios/HalcyaFace`.
    - L'algorithme, rejoué en Python sur les deux portraits, retrouve les entrées des deux modèles à 5e-7 près (tolérance d'Android : 1e-5).

  - 1er essai en CI (run 148) : compilation et tests des ancres passés. Les vecteurs d'Android étaient cherchés un dossier trop haut (`/Users/runner/work/HealthTrack-iOS/upstream`) : chemin corrigé.
  - Étape 2 dans la même PR : décodage et fusion des boîtes de BlazeFace, zone du visage, retour des 478 points dans l'image, entrée des blendshapes, taille et lacet.
    - Mêmes cas et mêmes tolérances que `FaceGeometryTest.java`, dont la fusion pondérée et « garder le plus grand visage » ; le tri d'Android est stable, d'où le départage par index.
    - Rejoué en Python sur les deux portraits : écart max 2e-6.

  - 2e essai en CI (run de `db8c722`) : les 11 tests Swift du visage passent sur le runner macOS, contre les vecteurs d'Android.
  - Étape 3, début : indices par unités d'action, contrôle qualité, médianes et mobilité de la rafale (`FaceIndices`, 7 tests repris de `FaceIndicesTest.java`). Les moyennes gauche / droite s'additionnent en Float avant la division, comme en Java.
  - `FaceRecord` : le JSON d'une rafale, au caractère près comme Android (5 tests repris de `FaceRecordTest.java`, plus l'arrondi).
    - Ordre des champs d'Android : la rafale garde l'ordre d'export de son `LinkedHashMap`.
    - Rejets triés comme le `TreeMap` de Java.
    - `%.4f` de Java : l'écriture décimale la plus courte, arrondie avec les milieux loin de zéro (`0.03125` → `0.0313`, alors que `printf` donne `0.0312`). C'est un écart possible au 4e chiffre seulement, sans effet sur les scores.
  - En CI (run de `51a58fb`) : indices et `FaceRecord` passent sur le runner macOS. L'arrondi « à la Java » par `Decimal` fonctionne.
  - `FacePipeline` : la chaîne d'une image et d'une rafale, modèles injectés (protocole `FaceModel`). Image suivante suivie sans détecteur, rejets, lumière des seules images valides, ordre d'export d'Android.
    - 8 des 13 scénarios de `FacePipelineTest.java`. Les 5 autres portent sur la valence et l'éveil, éteints sur iPhone.
  - En CI (run de `69b9cfc`) : `FacePipeline` passe sur le runner macOS.
  - Test JS `overlay/app/src/ios/faceRecord.test.js` : un JSON au format iOS est lu par `parseFaceBurst` d'Android et compte pour l'humeur (`app_open`), sans valence.
  - **I7 étapes 1 à 3 faites** : tout le calcul sans caméra ni modèle, aux tolérances d'Android.

## Suite
- CI de #43 (toute la build). Merger après #42.
- I7 étape 4 : moteur des 3 `.tflite` sur iPhone. Choix entre TFLite C (`binaryTarget` SPM) et une conversion ONNX en CI, à étudier, avec la licence et la télémétrie de chaque option. Modèles téléchargés en CI, SHA-256 vérifiés, sorties aux tolérances de `FaceModelsTest`.
- CI de #42 → regarder l'accueil (carte vide sans lien vers Sources) et Sources (conseil Apple Watch), puis merger.
- Ensuite, un lancement manuel sur `main` avec `devices="iPhone 17 Pro Max"` pour les captures de la fiche ; en choisir 3 à 10.
- À « A1 fait » : A3 puis A2 avec le propriétaire, et sa décision sur la signature.

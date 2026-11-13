# 2026-10-28 14:06 UTC — Abonnement App Store en place, éteint (PR #33, mergée) ; fiche App Store (PR #35) ; sélecteur de fichiers, 2e essai (PR #34)

**Étape** : I6, I9, I3  ·  **PR** : #33 (mergée à 14:00, fin du run précédent), #34, #35  ·  **Android suivi** : v555 (inchangé)  ·  **iOS** : 553 sur `main`, 555 en PR (simulateur)  ·  **Parité** : 30 % (14/47)

## Déclenchement
- Tâche planifiée de 13:59 UTC, reçue à 14:06. Aucun message du propriétaire depuis le run précédent.
- Fin du run de 13:19 : CI de #33 verte (run 110 : `swift test`, build Xcode avec StoreKit, 72 captures, 0 erreur JavaScript, sondes inchangées) ; branche à jour de `main` vérifiée, **#33 mergée** (b7bda3e) à 14:00 ; CI de `main` (run 113) partie.
- `scripts/upstream.sh --latest` : toujours v555.

## Ce qui a été fait
- **I9, fiche App Store fr-FR** (PR #35) : nom, sous-titre, texte promotionnel, description et mots-clés réécrits pour l'iPhone, à partir de la fiche Google Play d'Android. Ce qui change :
  - l'app Santé à la place de Health Connect ;
  - rien sur la montre Huawei en Bluetooth direct, le temps d'écran ni la lecture du visage ;
  - aucun nom d'une autre plateforme (directive 2.3.10).

  `scripts/store-check.mjs` vérifie les limites (échec essayé) ; workflow `store-check.yml` sur ubuntu ; `store/**` ne relance plus la build macOS. Ce qui reste est listé dans `store/app-store/README.md` : catégorie, âge 18+, URL propres à l'iPhone, captures 6,9 pouces, notes pour l'examen.
- **CI de #34 lue** (run 112). Sur les deux iPhone simulés :
  - `[import] fichier {"avant":1926,"bouton":true,"ajouter":false,"après":1926}` : le test d'interface a ouvert le sélecteur de fichiers (sur « Récents », « Rien de récent ») mais n'a pas trouvé « Parcourir ». Sous iOS 26, les onglets sont **Récents / Partagé / Explorer** (arbre d'accessibilité du journal du test) ;
  - corrigé : onglet « Explorer » (ou « Parcourir »), puis « Sur mon iPhone » et « Halcya » cherchés parmi les cellules et les boutons seulement, les textes de la page derrière ne comptent pas ; 2e essai lancé ;
  - le reste est vert : restauration, suppression, aller-retour (1926 mesures : les données de démo suivent l'heure), 0 erreur JavaScript ;
  - capture `/bien-etre` (v555) regardée : « je ve sa di lu ma me », barres en menthe.
- `main` (avec #33) fusionnée dans #34.
- Pistes d'essai de l'abonnement sur simulateur notées dans `RECHERCHE.md` (`SKTestSession` : fichier `.storekit` dans le bundle, cible de tests unitaires hébergée par l'app).

## Suite
- CI de #34 (2e essai) : attendu `"ajouter":true,"après":1928` et la capture `import-apres` ; sinon, lire l'arbre après « Explorer ».
- CI de #35 → merger (après #34 ou avant, la première verte ; l'autre remise à jour).
- I6 : cible de tests unitaires hébergée par l'app avec `.storekit` (achat d'essai sans compte Apple).

# 2026-10-28 16:00 UTC — v559 et fiche App Store (PR #35, mergée), « Confidentialité de l'app » préparée (PR #39), export et achat d'essai relancés

**Étape** : I9, I3, I6  ·  **PR** : #35 (mergée), #36, #37, #38, #39  ·  **Android suivi** : v559 (inchangé)  ·  **iOS** : 559 sur `main` (simulateur)  ·  **Parité** : 30 % (14/47)

## Déclenchement
- Tâche planifiée de 15:59 UTC, reçue à 16:00. Aucun message du propriétaire depuis le run précédent.
- CI : `main` (run 117) verte ; #35 (run 119) et #37 (run 120) terminées ; #36 (run 122) et #38 (run 121) en cours.
- `scripts/upstream.sh --latest` : toujours v559.

## Ce qui a été fait
- **#35 lue et mergée** (4e25555) : 76 captures, 0 erreur JavaScript, sondes inchangées. Boutons pilule de v559 regardés sur l'iPhone 16e (Repas : Photo / Galerie / Décrire ; Premium). iOS est maintenant à v559 sur `main`.
- **#37 (export par la feuille de partage)**, 1er essai :
  - iPhone 17 Pro : `[export] partage {"avant":0,"après":2}`, réussi (l'export puis sa copie « Garder les deux » dans Fichiers) ;
  - iPhone 16e : c'est l'import qui a échoué d'abord, et l'export n'a pas pu se faire ensuite. Dans le dossier Halcya, le fichier porte son nom en *identifiant*, pas en libellé ; et « Halcya, Menu d'actions » (titre du dossier) est un bouton qui ouvrirait un menu.

  Corrigé : dossiers et fichiers cherchés parmi les cellules seulement, par libellé ou identifiant. `main` (v559) fusionnée, relancé.
- **#36 (achat d'essai StoreKit)** : 2e essai en cours (fichier `.storekit` complété, formules redemandées).
- **« Confidentialité de l'app » (A5), PR #39** : `PrivacyInfo.xcprivacy` déclare les 5 types collectés de la déclaration Google Play d'Android :
  - les types : position approximative, photos, autre contenu de l'utilisateur, identifiant de l'appareil, historique d'achats ;
  - pour chacun : usage « fonctionnalités de l'app », pas de pistage ; liés à l'installation sauf la position ;
  - ni santé ni forme ;
  - un test compare la liste à celle d'Android (`DECLARED_DATA_TYPES`) : un nouveau type côté Android le fera échouer ;
  - réponses du questionnaire pour le propriétaire dans `store/app-store/confidentialite.md`.

  Suite : 2736 ✅ ; build ✅.

## Suite
- CI de #39 (manifeste dans l'app construite), #37 (export sur l'iPhone 16e), #36 (formules StoreKit), #38 (réglages) : merger dans l'ordre où elles sont vertes, en remettant chaque fois les autres à jour.

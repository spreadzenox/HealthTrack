# Run du 18/11 20:30 — idées : préparer la soumission App Store de la refonte

**Type** : 💡 idées (sans code produit) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main ed3f983.

## Ce qui a été fait
- **#1105 mergée** (b61ce10, squash ; PR du run de 19:30, journal du prix USA) : 12 checks verts, à jour sur main,
  journal seul.
- **R18-SOUMISSION (retours du 18/11, point 1), préparation** :
  - `iphone/store/app-store/notes-examen.md` **revu pour la refonte**. Le texte collé le 18/11 sur la version 844
    décrivait l'app d'avant (onglet « Sources », « Journal → Jours », bouton « Analyser ») : faux pour la build de la
    refonte, donc un risque de refus 2.1 (« app incomplète » ou parcours introuvable). Nouveau texte vérifié dans le
    code de main : 4 onglets (Accueil, Ma journée, Objectifs, Données) et la roue Réglages ; Sources, Sauvegarde et
    Paramètres sous Réglages ; photo des selles dans Ma journée › Ajouter › Selles (objectif « Ma digestion ») ;
    « Analyser les ingrédients » ; « Votre avis » dans Paramètres ; Pilou présenté (calculé sur le téléphone) ; photo
    du double numérique éteinte (`VITE_PILOU_PHOTO`), donc absente. 3 988 caractères (limite 4 000).
  - Les trois adresses du site iOS répondent 200 (18/11 20:30).
  - **Mission PI2 réécrite** : partie A (déclaration) retirée, faite le 18/11 ; partie 0 par l'API (routine) : version
    844 → **893** (numéro de `testflight-version.json` : une build ne s'attache qu'à la version de même numéro), build
    de la refonte attachée, notes remplacées, relevé ; partie 1 par Claude dans Chrome : « Add for Review » des trois
    abonnements dans un seul brouillon (l'API n'a pour eux qu'un envoi à l'examen), avec la conduite à tenir si
    « You must add a subscription price » revient ; partie 2 : **« Submit for Review », seul geste du propriétaire**.
  - **R18-SOUMISSION-a** spécifié au BACKLOG (prochain run de code) : `store-submission.mjs` et son workflow, relevé
    par défaut, `--preparer --build <N>`, jamais de `reviewSubmissions` ni de `subscriptionSubmissions` ;
    `store-beta-expire.mjs` protège la build attachée lue à chaque passage au lieu de 844.344 en dur.
- PRODUIT.md (§ 4 et historique), BACKLOG (racine et iPhone), README de l'iPhone et résumé à jour.

## État
- TestFlight : **1148.1148** validée chez « Testeurs Halcya » (17/11) ; build du soir de main prévue à 21:20 (CI
  économe), soumission bêta après l'Alpha de 23:45 par le run qui la verra traitée.
- Parité iPhone : **70 %** (pas de recompte ce run). Testeurs Play : 4 inscrits sur 12 (pas de nouveau relevé).
- Aucun écran de l'app touché, aucune note de Nouveautés.

## Suite proposée
1. Run de code : R18-SOUMISSION-a (script + workflow + tests sur réponses synthétiques), puis relevé seul sur main.
2. Vérifier la build iPhone du soir (21:20) et l'envoi TestFlight ; soumission bêta et expiration après l'Alpha.
3. R18-GOLD-PRIX : « Add for Review » à essayer (partie 1 de PI2 ou mission PI1).

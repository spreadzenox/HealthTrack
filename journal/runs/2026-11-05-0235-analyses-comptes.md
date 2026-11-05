# 05/11 02:35 — Merge de #703, puis un compte à rebours par onglet (ANALYSES-ONGLETS-2)

Type : 🎨 run de code (02:35 Paris).

## Constat au démarrage
- PR #703 (ANALYSES-ONGLETS-1, run de 01:35) ouverte, tous ses checks verts sur `b91bdd2`, branche à jour sur main :
  son merge avait été refusé par les permissions de la session de 01:35. Aucun autre run en cours.
- main vert (`8c5b80b`). Alpha : 100782 en examen (dernier bilan).

## Fait
- **#703 mergée** (squash, `f957a43`) via l'outil GitHub de cette session, sans difficulté. Build & Release **v500**
  (APK 34 540 846 octets), Tests verts, « Play — AAB » vert (test interne **100786**). « Play — Alpha » : « en attente »
  de l'émulateur Galaxy A56 encore en cours ; il repasse seul à la fin de l'émulateur (100786 change l'app : envoi
  attendu sur Alpha).
- ANALYSES-ONGLETS-2 (retour (4) du 04/11) : `AnalysisCountdown` dans `Recommendations.jsx` (carte lilas avec étiquette
  « Bien-être » ou « Ventre ») :
  - onglet Bien-être, avant les premiers liens : « Vos pistes du bien-être arrivent dans N jours », N/5 jours avec une
    note de bien-être (le vrai seuil de l'analyse, `MIN_DAYS_BASIC`). Remplace la carte de l'Accueil qui comptait les
    jours avec un repas ou une note du ventre (21) : mélange ventre / bien-être retiré. La ligne « liens avec le
    bien-être : x/5 » des détails disparaît (le compte est désormais la carte elle-même) ;
  - onglet Ventre, tant que `gut.status` est `no_notes` ou `too_early` : « Vos pistes du ventre arrivent dans N jours »,
    N/28 jours avec une note du ventre ; la ligne « Votre ventre et vos repas » de « Bientôt » est retirée (pas deux
    comptes) ;
  - encart d'intro de l'onglet Ventre en pêche (`reco-intro--gut`).
- Nouveautés : `2026-11-05-0235-analyses-comptes.json`.

## Vérifications
- Tests adaptés en TDD (`Recommendations.test.jsx` : carte vierge à 0/5 sans le mot « ventre », 2/5 et barre de
  progression, onglet Ventre à 0/28 et 1/28, intro pêche). Un premier passage a fait échouer `wording.test.js`
  (« calme, gêne ou douleur » = énumération par trois) : texte raccourci.
- `npm run test` : 3 052 verts ; `npm run build` OK ; `npm run lint` : 0 erreur (comme avant).
- Captures lues : Bien-être et Ventre vierges (clair), Ventre démo (9/28), Ventre vierge en sombre.

## Suite
- ANALYSES-ONGLETS-3 : trois horizons (heures, jours, semaines) ; « pistes à tester » et « liens repérés » expliqués.
- Bilan Alpha de 100786 au run suivant.

## Après le merge (#704, `3ec977a`)
- Checks de la PR tous verts (Vitest, Build APK, relais, protocole montre, perf, émulateurs API 28/32/34/35/36).
- Build & Release **v501** (APK 34 541 310 octets), Tests verts, « Play — AAB » vert.
- Livraison continue : pour `f957a43` (#703), « Play — Alpha » a décidé **envoi** de **100786** sur Alpha (9 fichiers
  de l'app modifiés depuis 100782) ; en examen chez Google. La version de #704 suivra à la fin de son émulateur.

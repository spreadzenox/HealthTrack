# Run du 03/11/2026 00:35 (Paris, CET) — Fiche Play et abonnements aux noms Silver / Gold (LISTING-2)

**Type** : 🔧 run de code (scripts Play et fiche du Store ; rien ne change dans l'app).

## Constat au démarrage
- Main à `dc18ba0` (#639) ; tous les workflows de main verts. Aucune PR « [Auto] » ouverte (#51 Cursor non touchée),
  aucun « Build & Release » en cours.
- Compte rendu du 02/11 : étapes (1) et (2) faites, (3) rédigée en tête du résumé (Alpha 100721 en examen chez
  Google au dernier constat ; la session n'a pas d'accès direct à la Play Console pour relire l'état de l'examen).
  Fin de la période iPhone (06/11) déployée et vérifiée au run de 22:35. Rien de nouveau à reprendre côté iOS.
- Étape suivante au backlog : **LISTING-2** (idées I209–I210 du 02/11 20:35).

## Fait
1. `app/scripts/play/subscriptions.mjs` : Silver s'appelle « Halcya Silver » chez Google (identifiant
   `halcya_premium` inchangé) ; Gold « Tout Silver, deux fois plus d'analyses IA par jour, quantités mieux estimées. ».
   Nouveau : `listingDiffers()` et, pour un abonnement déjà créé, PATCH `updateMask=listings` de la seule fiche fr-FR
   quand titre, description ou avantages diffèrent (autres langues et formules renvoyées telles quelles, prix jamais
   modifiés). Avant, la fiche d'un abonnement existant n'était jamais remise à jour : c'est pour ça que « Halcya
   Premium » restait. Résumé du workflow : « Fiche mise à jour » / « Fiche déjà à jour ».
2. `app/store/listing/fr-FR/full-description.txt` : section « ★ Sans abonnement, avec Silver ou Gold » (Silver :
   pistes, réintroduction, PDF, 10 analyses IA/jour ; Gold : tout Silver, 20/jour, « Gold estime mieux les
   quantités ») ; description courte (80 caractères) : « Repas, ventre (SII, FODMAP), sommeil et montres : ce qui
   va avec vos bons jours. »
3. Tests-gardes : titres = `APP_NAME` + `tierName` de l'app ; « Premium » absent des fiches d'abonnement et de la
   fiche du Store ; plafonds lus dans `PREMIUM_AI_DAILY` / `GOLD_AI_DAILY` ; mise à jour de fiche qui ne touche
   qu'au fr-FR.

## Vérifications
- `npm run test` : 2 892 tests verts (239 fichiers) ; `npm run build` OK ; `npm run lint` : 7 erreurs préexistantes, aucune nouvelle ; `npm run visual` : voir la PR.
- Aucun écran de l'app touché : pas de captures nécessaires, pas de Nouveauté (la fiche du Store et la feuille
  d'achat de Google ne sont pas dans l'app).
- Après le merge : lire les résumés des workflows « Play — fiche » et « Play — abonnements ».

## Suite
- Quand le propriétaire dit le jour de l'invitation : recaler `until` si J ≠ 03/11.
- 07/11 : revérifier au bilan du relais `premium=false` pour l'iPhone.
- Prochains runs de code : P32 (geste des pays prêt), GOLD-a3 (attend P37), montre Huawei.

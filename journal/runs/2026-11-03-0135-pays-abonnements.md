# Run du 03/11/2026 01:35 (Paris, CET) — Abonnements vendables dans les 5 pays de la production (P32)

**Type** : 🔧 run de code (script et workflow « Play — abonnements » ; rien ne change dans l'app).

## Constat au démarrage
- Main à `2581cce` (#640) ; tous les workflows de main verts, dont « Play — abonnements » (fiches « Halcya Silver »
  et « Halcya Gold » mises à jour, lu dans le journal du job) et « Play — fiche du Store » (fr-FR, 5 captures).
  Aucune PR « [Auto] » ouverte (#51 Cursor non touchée), aucun « Build & Release » en cours.
- Compte rendu du 02/11 : (1) et (2) faits, (3) en tête du résumé ; Alpha 100721 en examen au dernier constat (la
  session ne lit pas l'état de l'examen ; le dernier « Play — AAB » a envoyé la 100724 en test interne).
- Chantier montre : toutes les étapes codables sont livrées (M7 l'était depuis le 25/10, la ligne du backlog était
  restée ouverte : cochée) ; le reste attend des confirmations sur la GT 6 Pro.

## Défaut trouvé et corrigé
P32 (décision du 02/11 : production en France, Belgique, Suisse, Luxembourg, Canada) demandait de préparer le geste.
En le préparant : les abonnements Silver et Gold n'avaient de prix **qu'en France**. Dans les 4 autres pays, Google
n'aurait proposé aucune formule : l'écran d'achat de l'app y serait resté vide (« aucune formule »).

## Fait
1. `app/scripts/play/subscriptions.mjs` : `SALE_REGIONS` (FR, BE, LU en EUR ; CH en CHF ; CA en CAD ; jamais US) et
   `localPrices` par formule : Silver 4,90 CHF / 6,99 $CA par mois, 29,00 CHF / 39,99 $CA par an ; Gold 9,90 CHF /
   12,99 $CA ; zone euro au prix français. `regionPrice()`, `missingRegions()`.
2. Abonnement existant : les pays manquants sont ajoutés aux formules (PATCH `updateMask=basePlans`, configurations
   existantes et prix français renvoyés tels quels), puis à l'offre d'essai de 14 jours (PATCH
   `updateMask=phases,regionalConfigs`). Refus de Google → `regionError` dans le résumé (avertissement), sans arrêter
   la fiche, l'activation ni la relecture ; l'essai n'est alors pas touché.
3. Résumé du workflow : pays de chaque formule, pays ajoutés, refus éventuel ; catalogue prévu avec les prix par pays.
4. Tests : 6 nouveaux (pays, prix dans chaque devise, annuel < 60 % de 12 mensuels, Gold > Silver mensuel, ajout aux
   formules et à l'essai sans toucher au FR, refus rapporté) ; fixtures mises à jour.
5. `PRODUIT.md` §4 P32 : geste exact du jour de la production (Production → Pays/régions → 5 pays → Promouvoir).

## Vérifications
- `npm run test` : 2 898 tests verts ; `npm run build` OK ; `npm run lint` : 7 erreurs préexistantes, aucune
  nouvelle ; `npm run visual` OK (aucun écran touché, pas de Nouveauté : rien de visible dans l'app).
- L'app lit déjà prix et devise dans Play Billing (`formatMicros(priceMicros, currency)`) : CHF et $CA s'affichent
  sans changement de code.

## Suite
- Après le merge : lire le résumé de « Play — abonnements » (pays : FR, BE, LU, CH, CA pour chaque formule et l'essai).
  Si Google refuse l'ajout de pays à une formule active : noter l'erreur exacte et passer par
  `basePlans:batchUpdateStates`/console (action du propriétaire) au besoin.
- Quand le propriétaire dit le jour de l'invitation : recaler `until` si J ≠ 03/11. 07/11 : bilan du relais
  (`premium=false` pour l'iPhone).
- Prochains runs de code : GOLD-a3 (attend P37), `shrinkResources` (POL-PLAY-11, après les premiers jours des
  testeurs : risque sur les icônes de notification nommées depuis le JS), montre à confirmer.

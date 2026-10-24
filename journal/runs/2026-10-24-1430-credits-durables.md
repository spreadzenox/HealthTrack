# 2026-10-24 14:30 Paris (12:35 UTC) — Retours du 24/10 consignés, crédits IA durables

**Type** : 🧭💳 chantier produit (retours de la session guidée du propriétaire, 13:30–14:30)

## Constat au démarrage
- Main à `6d4f5d4` (#319, M6a). Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- Nouvelles consignes du propriétaire (24/10 13:30–14:30) à traiter avant M6b et M7 : P23 tranchée (② seule),
  P27 faite (C3), P21 relancée, P22 abandonnée, P24 faite, sauvegarde Android conservée, crédits « 10 restantes »
  à expliquer, libellé « Source : gemini-3.5-flash-lite », remarque IAM.

## Cause du compteur revenu à 10
Le registre des crédits du relais vivait **en mémoire seulement**. Pour la version gratuite, l'app renvoyait son
dernier état (`X-Credits` : mois, utilisés, offerts) et le relais gardait le plus restrictif ; mais **le plafond
premium du jour (`dayUsed`) n'était dans aucun état renvoyé**. Cloud Run est à zéro instance au repos : entre 13:38
et 14:11 l'instance s'est arrêtée, le compteur du jour est reparti à 0 → « 10 analyses IA restantes ». Les passages
premium → gratuit → premium et la réinstallation n'y sont pour rien (identifiant d'installation restauré avec les
données par la sauvegarde Android). Faille réelle mais bornée : au pire 10 analyses de plus à chaque redémarrage,
toujours sous `INSTALL_DAILY_CAP` (20) et le plafond global (200 / jour).

## Ce qui a été fait
- Relais `credits.js` : `createFirestoreStore` (REST Firestore, jeton du serveur de métadonnées avec la portée
  `datastore`, collection `credits`, document = empreinte SHA-256 de l'installation, seuls 5 compteurs) ;
  `createCredits({ store })` + `hydrate` (une lecture par installation et par instance, retentée si échec) et
  `persist` (après chaque crédit pris ou rendu) ; fusion « le plus restrictif » commune (`mergeInto`).
- `server.js` : relecture avant `peek` / `take`, écriture après ; panne Firestore → `credits_store_failed` journalisé,
  l'analyse continue en mémoire. `config.js` : `CREDITS_STORE` (`firestore` par défaut, `memory` possible).
- App `Food.jsx` : « Analyse IA · une estimation », modèle sous « détails » (test dans `Food.test.jsx`).
- Journal : PRODUIT (C3 ✅, C5, P21–P24, P27, P28 nouveau), BACKLOG (bloc « Retours du 24/10 » : 6f, SAUV,
  INTEGRITY-BILAN, PLAY-COMPLETED, IAM), Nouveautés `2026-10-24-1430-credits-ia.json`.
- IAM : vérifié dans le dépôt que ni le relais (`--service-account relay-runtime`, image poussée par docker, pas de
  Cloud Build) ni la CI (`gh-deployer`) n'utilisent le compte Compute par défaut → P28 proposé.

## Vérifications
- Relais : `npm test` 76 verts (+5 : redémarrage, mois suivant, lecture retentée, REST Firestore, serveur avec panne).
- App : Vitest 2 131 verts (1er passage CI rouge : type « correction » au lieu de « correctif » dans la Nouveauté, corrigé), build OK, lint inchangé (6 erreurs préexistantes), `npm run visual` vert (page Repas relue ; la carte de résultat IA n'a pas de capture, elle est couverte par `Food.test.jsx`).

## Suite
- **6f** (période de lancement : début/fin/interrupteur par la CI, « Premium offert pendant le test » dans l'app,
  texte d'invitation), puis **SAUV** (règles de sauvegarde, textes honnêtes, P21), INTEGRITY-BILAN, puis M6b.
- Après déploiement : vérifier dans les journaux du relais l'absence de `credits_store_failed` (droit Firestore).

# Run du 28/10/2026 21:33 (Paris, CET) — Compteurs du relais datés, textes honnêtes (POL-PLAY-30)

**Type** : 🎨 Conformité / textes (relais + variantes play et sideload, code commun avec l'app iPhone)

## Constat au démarrage
- Main à `c204492` (#484), tous les workflows verts (Build & Release v345, Play — AAB, Tests, émulateur A56). Aucune PR
  « [Auto] » ouverte (PR #51 `cursor/*` non touchée). Run de 21:33 : run de code.
- Priorité du run « idées » de 20:33 : POL-PLAY-30 (avant les testeurs).

## Fait (POL-PLAY-30)
- `relay/src/credits.js` : `RETENTION_MONTHS = 13`, `expiryOf(ms)` (1er du mois, 13 mois après la fin du mois en cours) ;
  `persist` écrit `expireAt` (repoussé à chaque écriture) ; `createFirestoreStore.set` l'écrit en `timestampValue`
  (champ lu par la politique TTL de Firestore). Doc en tête du module : une installation revenue après plus de 13 mois
  sans analyse retrouverait ses analyses offertes (prix assumé de la minimisation).
- Textes : divulgation `ai_meal` (`permissionDisclosures.js`), Paramètres → Analyse des repas, Données → Supprimer,
  `privacypolicy.html` (Firestore en Belgique, effacement 13 mois après la dernière analyse ; date de mise à jour
  28/10), commentaires `aiRelay.js` / `deleteAllData.js`, `relay/README.md`.
- `app/store/data-safety/answers.mjs` : seules les justifications (`why`) changent ; aucune réponse modifiée → pas de
  relance du workflow « Play — sécurité des données » nécessaire.

## Tests
- Relais : `expiryOf` (2 dates, dont passage d'année) ; `persist` repousse `expireAt` ; Firestore écrit `expireAt` en
  horodatage. Rouges avant, verts après (88).
- App : `serverRetentionTexts.test.js` (9) interdit « ne garde(nt) rien » et « compteurs, en mémoire », exige « 13 mois »
  dans les 4 textes ; `Settings.play.test.jsx` mis à jour.

## Vérifications
- `npm run test` : vert (2 636) ; lint 6 erreurs (inchangé) ; build OK ; relais `npm test` vert.
- `npm run visual -- --play --routes=/settings,/data` : captures Paramètres (phrase IA) et Données (Supprimer) relues.

## Action du propriétaire
- **P33** (2 min, Cloud Shell) : `gcloud firestore fields ttls update expireAt --collection-group=credits --enable-ttl
  --project=healthtrack-824b26`. Les compteurs écrits avant ce run n'ont pas encore `expireAt` : ils le reçoivent à la
  prochaine analyse de l'installation (seulement quelques documents, tous du propriétaire ou des robots de Google).

## Demandes iOS
- Note de Nouveautés commune (le relais sert aussi l'app iPhone) : pas de `variants`.

## Suite
- POL-PLAY-32 (pistes en « facteur → effet »), puis 31, 33.

## Après le merge (#485, `29ccccf`)
- Checks de la PR verts (Vitest, Build APK, relais, protocole montre, budget de lectures, bord à bord API 34,
  émulateur A56 API 35 et 36).
- Sur main : Build & Release **v346** publiée, APK **34,5 Mo** (34 493 337 octets) ; Relais — déploiement vert (le relais
  écrit désormais `expireAt`) ; Site — GitHub Pages vert (politique de confidentialité à jour en ligne) ; Play — AAB
  (test interne), Play — fiche du Store, Tests et émulateur A56 verts.

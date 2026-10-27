# Run du 27/10/2026 09:33 (Paris, CET) — Écran premium à jour + paywall au moment de la valeur

**Type** : 🏗️ code (jalon 6 / 5 : « vrai paywall au moment de la valeur », `premiumBenefits` à trancher)

## Constat au démarrage
- Main à `9aae19b` (#424, run « idées »), tous les workflows verts ; aucune PR « [Auto] » ouverte (seule #51 `cursor/*`).
- Chantier FODMAP (N1–N6c), M1–M7 livrés. Trouvé : `premiumBenefits.js` annonçait encore le **rapport PDF** (livré et
  premium depuis N6b) et les **pistes avec délais** (affichées depuis le 26/10) comme « en préparation » — l'écran
  d'achat sous-vendait l'abonnement, et la fiche de l'abonnement sur Play aussi (`subscriptions.mjs` lit ce fichier).
- Les pistes repas → ventre étaient gratuites partout, alors que la décision du 20/10 (« collecter est gratuit,
  comprendre est payant ») prévoit un paywall au moment de la valeur (aperçu flouté + « Débloquer »).

## Ce qui a été fait
- `GutLinks.jsx` : sur la version Play sans premium, quand des pistes ressortent : « N pistes repérées entre vos repas
  et votre ventre », aperçu flouté fait de **barres neutres** (aucun nom d'aliment ni lien de réintroduction dans le
  DOM : un flou CSS se retire), « premium » + « Débloquer » → `/premium`, dans une carte pêche. « Aucun aliment ne
  ressort » et la ligne « Bientôt » restent gratuits. Sideload inchangée ; premium (dont la période de lancement) : pistes en clair.
- `premiumBenefits.js` : `pistes-delays` → `GutLinks.jsx`, `pdf-report` → `DoctorReportCard.jsx` ; la section « En
  préparation » disparaît d'elle-même. La fiche de l'abonnement Play suit au merge (« Play — abonnements », 4 avantages).
- `public/conditions.html` : contenu du premium à jour.
- Tests : `GutLinks.premium.test.jsx` (5 cas : sideload, play sans premium, singulier, « rien ne ressort », lancement) ;
  `premiumBenefits.test.js` et `Premium.test.jsx` (VC-17) mis à jour.

## Vérifications
- `npm run test` : **2 524** verts (+ 44 sautés) ; `npm run build` OK ; lint : 6 erreurs, comme avant.
- Captures `--play --gut-links` (clair et sombre) d'Analyses et du paywall regardées : carte pêche lisible, aperçu
  flou, bouton émeraude ; paywall avec 4 coches, plus de « En préparation ». `npm run visual` complet : 15 pages « ok », 0 erreur JS.

## Points d'attention
- Rien de visible pour le propriétaire ni les testeurs avant la fin de la période de lancement (20/11).
- Les autres analyses (bien-être, « Pistes à tester ») restent gratuites : à trancher plus tard si besoin.

## Suite
- 9a (socle i18n) ou I176 (forme des selles) ; POL-1d dès P28.

## Merge
- PR #425 : tous les checks verts (Vitest, Build APK, relais, protocole montre, budget de lectures, émulateurs API 35
  et 36) → mergée (squash) en `d00ba7a`.
- « Build & Release » vert : **v311** publiée, APK 34,9 Mo (34 893 117 octets) ; « Play — abonnements » vert (fiche de
  l'abonnement avec les 4 avantages) ; « Play — AAB » et « Site — GitHub Pages » (conditions) verts.

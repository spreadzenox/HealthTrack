# Run du 31/10/2026 22:33 (Paris, CET) — Gold sur Gemini 3.8 Flash (bascule (a) du 31/10 vers 22:45)

**Type** : 🔧 relais (petit run de code, prioritaire sur le polissage des textes d'après la consigne)

## Constat au démarrage
- Main à `d967298` (#578, journal) ; Tests, Build & Release, Play — AAB et émulateur A56 verts. Aucune PR « [Auto] »
  ouverte (#51 `cursor/*` non touchée).

## Fait (GOLD-a)
- `relay/src/vertex.js` : option `thinkingLevel` (→ `generationConfig.thinkingConfig`) ; chaque réponse facturée est
  rendue dans `spent` (modèle + `usageMetadata`), aussi sur l'erreur.
- `relay/src/costs.js` (nouveau) : jetons (entrée, cache, réflexion, sortie), grille de prix prudente en €/M jetons
  (`MODEL_PRICES` la remplace, modèle inconnu = prix le plus élevé), cumul du mois en micro-euros (mémoire + Firestore
  `relay-costs/AAAA-MM`, incrément serveur, panne non bloquante), seuils Gold 15 € et arrêt 19 €.
- `relay/src/server.js` : niveau de l'analyse (`gold` = premium par la période de lancement ou empreinte dans
  `GOLD_INSTALLS` ; `silver` = abonnement Play actuel ; `free`) ; Gold : `goldVertex` (3.8 Flash, eu, MEDIUM, 25 s) sous
  le plafond du jour (40) et le seuil du mois, sinon et en cas d'échec Flash-Lite ; journaux `usage`, `gold_fallback`,
  `analyze` (`tier`, `served`, `eur`) ; 429 « global » au-delà de 19 €.
- `relay/src/config.js`, `index.js`, `.github/workflows/relay-deploy.yml` : `GOLD_*`, `VERTEX_TIMEOUT_MS=30000` (Gold
  25 s + secours 30 s < 60 s de Cloud Run), `GLOBAL_DAILY_CAP` 200 → 150.
- App (variante play) : le nom du modèle n'apparaît plus dans les détails de la carte de résultat
  (`FEATURES.aiModelName`, sideload inchangée).

## Plafonds recalculés
- Gold au pire 4,3 c (sans cache, réflexion longue) → 40 Gold/jour ≤ 1,72 € ; Flash-Lite au pire ≈ 1 c → pire jour
  ≈ 2,8 € ; le seuil de 19 € borne le mois. Prix ×2 en 2027 : GOLD-a4.

## Tests
- Relais : 103 réussis (+13 : `costs.test.js`, `gold.test.js`, vertex, workflow).
- App : `npm run test` (2 801 réussis), `npm run build`, `npm run lint` (6 erreurs, comme avant), `npm run visual --play`.

## Données
- Aucune donnée d'utilisateur touchée ; le relais ne garde que des compteurs (coût du mois), jamais de contenu.

## Demandes iOS
- Note de Nouveautés marquée `"variants": ["play"]`. L'exemption iOS d'Integrity est inchangée. Une installation iOS
  premium par la période de lancement reçoit aussi Gold (même relais).

## Suite
- GOLD-a2 : vérifier en production (journaux `served`, `usage`) ; si 3.8 Flash est refusé en zone eu, Flash-Lite
  prend le relais sans casse — le noter.
- Puis SLOP-1 (polissage des textes du 31/10 21:35), puis GOLD-b.

## Après le merge (#579)
- Les 9 checks de la PR étaient verts (Vitest, Build APK, relais, Java, émulateurs…).
- Sur main (`334cda4`) : Tests, Build & Release, Play — AAB et **Relais — déploiement** verts. La release **v415** est
  publiée (APK de 34 523 698 octets). Le relais est redéployé avec les variables `GOLD_*` ; l'analyse de test du
  workflow a réussi (installation neuve, donc gratuite, sur Flash-Lite). Une première analyse Gold réelle reste à
  lire dans les journaux (GOLD-a2).

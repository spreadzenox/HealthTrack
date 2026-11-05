# 05/11 14:35 — Selles en photo : la route du relais (SELLES-PHOTO-1)

Type : 🔧 run de code (14:35 Paris). Priorité : retours du 04/11, point (7) (étude I221 du 05/11 08:35).

## Constat au démarrage
- main vert (`b08ae4d`) : « Tests », émulateur A56, « Play — Alpha (livraison continue) » verts sur `b08ae4d` (v511 :
  Alpha reprise par le commit du compte rendu). Aucune PR « [Auto] » ouverte, aucun autre run actif.
- Décision iOS du 05/11 vers 12:00 déjà en tête de `POUR-IOS.md`.

## Fait (relais seulement)
- `prompts.js` : `STOOL_SCHEMA` (`visible`, `bristol` entier, `confidence`) et `STOOL_INSTRUCTION` (échelle de Bristol
  décrite en mots, forme seule ; ni couleur, ni sang, ni mucus, ni santé ; texte de la photo ignoré).
- `server.js` : `buildStoolRequest` (JPEG seulement, EXIF retiré par `stripJpegMetadata`, `liteOnly`),
  `normalizeStool` (ne laisse sortir que `{ visible, bristol 1..7 | null, confidence }`), route `/v1/stool/analyze` sur le
  même chemin que les repas (installation, intégrité / App Attest, budget du mois, quotas, crédits). `generate` saute
  Gold quand `liteOnly`. Réponse vide ou illisible du modèle (502, dont filtre de sécurité) → 200 `unreadable: true`,
  crédit rendu, quota rendu seulement si l'appel n'a rien coûté. Journal `event: 'analyze', kind: 'stool'`, sans résultat.
- `relay/README.md` : route documentée.

## Vérifications
- TDD : `relay/test/stool.test.js` (6 tests, rouges avant le code) ; `npm test` du relais : 216 verts.
- App inchangée : `npm run test`, `npm run build`, `npm run visual` relancés (voir PR).
- Aucune image réelle dans le dépôt : JPEG synthétique de 17 octets, réponses du modèle simulées.

## Suite
- SELLES-PHOTO-2 : `analyzeStoolPhoto` (relais en play, clé Gemini en sideload avec la même consigne), ligne
  « Estimer avec une photo » dans la rubrique Selles du Journal (objectif « Mon ventre »), entrée `stool` +
  `estimated`/`estimate`, captures. Puis SELLES-PHOTO-3 (fiabilité personnelle, confidentialité, Nouveautés).
- Après déploiement du relais : vérifier au bilan que la route répond (400 sans photo).

## Après le merge
- #724 mergée (squash `42ae6e6`) : « Frontend (Vitest) », « Build APK », relais, montre, perf, WebView API 28,
  Android 12L et bord à bord verts au merge. « Build & Release » **v512** (APK 34 548 150 octets). « Relais —
  déploiement » vert (bilans Play, Integrity, analyses IA OK). Route vérifiée en production : `POST /v1/stool/analyze`
  sans en-tête → 400 `install_id` (la route existe ; une adresse inconnue → 404).
- App inchangée : pas d'envoi Alpha attendu pour cette version (la livraison continue saute les versions sans changement
  de l'app).

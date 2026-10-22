# 2026-10-22 18:30 Paris (16:30 UTC) — Jalon 6a-2 : la variante play analyse les repas par le relais

**Type** : 🧭 code (chantier produit, jalon 6) · **PR** : voir ci-dessous

## Pourquoi
- Main à `61adc9e` (#274), tous les workflows de main verts (Build & Release, Play — AAB, Relais — déploiement, Tests,
  émulateur A56). Aucune PR « [Auto] » ouverte. Signalement du 20/10 19:05 corrigé depuis la v188 ; ce run n'est pas un
  run « idées » (18:30).
- Constat : le propriétaire a fait **P19** (GitHub Pages : « Site — GitHub Pages » vert, page de confidentialité en HTTP
  200), **P20** (e-mail de contact : « Play — fiche du Store » vert, icône, présentation et 5 captures enregistrées) et
  **P21** (« Play — sécurité des données » vert, 3 types) vers 17:55–18:18.
- Suite logique du jalon 6 (décision du 22/10 13:30) : 6a-2, brancher la variante play sur le relais déployé à 16:30.

## Ce qui a été fait
- `featuresFor('play').aiRelay` (`config/distribution.js`).
- `services/aiRelay.js` : `POST {RELAY_URL}/v1/meal/analyze` (photo préparée par `imagePrep` ou texte ≤ 500 car.),
  en-tête `X-Install-Id` = identifiant aléatoire de 48 hex créé au premier appel (`localStorage`), délai 60 s
  (`AbortController`), messages clairs (réseau, délai, quota 429 du relais, erreur serveur), mémorise
  `{ remaining, resetAt }` pour l'afficher ; décodage commun avec l'appel direct (`toMealResult`, provider `relay`).
  `VITE_RELAY_URL` facultatif (défaut : l'adresse Cloud Run).
- `services/mealAi.js` : façade play / sideload (`canAnalyzeMeals`, `analyzeMealPhoto`, `analyzeMealDescription`,
  accord `needsAiConsent` / `rememberAiConsent`, rappels de confidentialité adaptés, libellé « ✨ Remplir avec l’IA »).
- Divulgation `ai_meal` (feuille « Avant d’analyser un repas avec l’IA ») montrée **une fois** avant le premier envoi
  en play, depuis Repas (photo) et Nouveau repas (description) ; test de garde ajouté.
- Paramètres en play : bloc « Analyse des repas (IA) » sans clé, avec les analyses restantes du jour ; sideload
  inchangé (clé Gemini, choix du modèle). « Plus » : « analyse des repas (IA) ».
- Politique de confidentialité : relais en Europe → Gemini sur Vertex AI UE, rien gardé, identifiant aléatoire
  (empreinte en mémoire jusqu'au lendemain), mention de la clé Gemini pour la version hors Play.
- Sécurité des données : + `PSL_DEVICE_ID` (collecté, facultatif, fonctionnement + prévention des abus), textes
  « relais + Vertex AI » ; CSV régénéré. **P21 à relancer** une fois mergé.
- `npm run visual -- --play --routes=/food --food-analysis [--ai-consent=ask]` et `--meal-text` : relais simulé.
- Nouveautés : `2026-10-22-1830-analyse-ia-sans-cle.json`.

## Vérifications
- `npm run test` : 150 fichiers, **1 873 tests verts** (+ `aiRelay.test.js`, `mealAi.test.js`, `Settings.play.test.jsx`,
  gardes de divulgation, déclaration Sécurité des données).
- `npm run build` OK ; `npm run lint` : 6 erreurs, comme avant.
- `npm run visual` complet (sideload) : 0 erreur ; captures Repas et Paramètres inchangées. En play : divulgation,
  résultat photo, description remplie, Paramètres sans clé — regardées.
- **Relais réel depuis la session**, avec l'origine de la WebView (`https://localhost`) : pré-vol CORS 204 avec
  `Access-Control-Allow-Origin: https://localhost` et `X-Install-Id` autorisé ; analyse « un bol de riz et un oeuf » →
  200, riz 250 g + œuf 55 g, `gemini-2.5-flash-lite`, quota 19.

## Limites connues
- Compteur du relais en mémoire (une instance) ; Play Integrity viendra en 6b pour réserver le relais aux vraies
  installations.
- Pas encore de crédits « 10 + 15 / mois » (6c) : seulement le plafond du relais (20 / jour / installation).

## Suite proposée
- 6b : vérification des achats par le relais (`subscriptionsv2.get`, accusé, RTDN via `play-rtdn`, Play Integrity).
- Propriétaire : relancer « Play — sécurité des données » (P21 bis), P13 (profil de paiement), P18 (groupe des testeurs).

## Après le merge
- PR #275 : Frontend (Vitest), Build APK, Relais (Node), Protocole montre, Budget de lectures, émulateur A56 (API 35 et
  36) verts ; fusionnée en squash (`179f423`).
- Sur main : **v212** publiée (`HealthTrack-v212.apk`, 33,7 Mo) ; « Play — AAB » : **versionCode 362 en test interne**
  (validée, déployée aux testeurs internes) ; Tests, émulateur, Site, fiche du Store verts.

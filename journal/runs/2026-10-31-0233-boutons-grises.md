# Run du 31/10/2026 02:33 (Paris, CET) — Repas : boutons inactifs et repas habituels (POL-PLAY-74)

**Type** : 🎨 Polissage play

## Constat au démarrage
- Main à `9d1c0fb` (#540) : Tests, Build & Release (v396), Play — AAB et émulateur Samsung A56 verts.
- Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, non touchée). Plantage du visage du 30/10 corrigé (#531) :
  retest du propriétaire attendu.

## Audit
- `npm run visual -- --play --size=360x780 --routes=/food` puis `--click="Décrire ou saisir sans photo"` (démo, clair).
- Défauts : (1) « Remplir avec l’IA » et « Enregistrer ce repas » désactivés (rien de décrit ni d’ajouté) gardaient le
  fond émeraude à 60 % d’opacité : ils passaient pour des boutons actifs qui ne réagissent pas (même défaut que
  POL-PLAY-58 dans l’onboarding, mais dans le style commun `.btn`, utilisé par ≈ 30 écrans) ; (2) repas habituels
  « Poulet, Pomme de terre, Haricot vert » : une majuscule par aliment.
- Vu, laissé tel quel : format de l’heure du repas (locale du navigateur de capture) ; textes d’aide de « Décrire ».

## Fait
- `App.css` : `.btn:disabled` → fond `--surface`, texte `--text-muted`, bordure 2 px `--border` (plus d’opacité) ; le
  survol ne change plus le fond d’un bouton désactivé.
- `quickMeals.mealLabel` : une seule majuscule en tête de liste ; un nom dont la 2ᵉ lettre est majuscule (sigle,
  marque : « AOP Comté ») est gardé tel quel. Aussi dans le titre « Refaire : … ».

## Tests
- `src/disabledButton.test.js` (2 tests, rouges avant) ; `quickMeals.test.js` : attentes mises à jour + 1 test.

## Vérifications
- `npm run test` (2 758 tests), `npm run build`, `npm run lint` (6 erreurs, comme avant).
- Captures relues : Repas et « Décrire » (clair et sombre, 360 px) ; `--play --size=360x780` complet (15 pages, ok) ;
  Paramètres relu.

## Données
- Aucune donnée, migration ni export touché (libellé calculé à l’affichage).

## Demandes iOS
- Changement commun aux plateformes : note de Nouveautés sans `variants`.

## Suite
- Retest du visage par le propriétaire ; POL-PLAY-11 (alpha) après une journée sans plantage dans Android vitals.
- Prochain audit : Nutrition → « compléter mon profil » et Tendances (démo, clair, 360 px).

## Après le merge (#541)
- Checks de la PR tous verts (Vitest, Build APK, relais, Java, émulateurs API 34/35/36).
- Build & Release : release **v397** publiée (APK 34 517 446 octets) ; Play — AAB et Tests verts sur main.

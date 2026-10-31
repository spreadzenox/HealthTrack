# Run du 31/10/2026 03:33 (Paris, CET) — Nutrition : apports incertains (POL-PLAY-75)

**Type** : 🎨 Polissage play

## Constat au démarrage
- Main à `a49a2ff` (#542) : Tests, Build & Release (v397), Play — AAB et émulateur Samsung A56 verts.
- Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, non touchée). Plantage du visage du 30/10 corrigé (#531) :
  retest du propriétaire attendu.

## Audit
- `npm run visual -- --play --size=360x780 --routes=/nutrition,/tendances` (démo, clair), puis Nutrition en sombre.
- Défaut : semaine de démo incomplète (8 repas, ≈ 627 kcal/j) → l'avertissement « des repas manquent » s'affiche,
  mais presque toutes les barres restaient « bas » en gris foncé : chiffre trompeur (l'apport réel est plus élevé) et
  écran triste (retour du propriétaire : plus de couleur).
- Vu, laissé tel quel : Tendances (étiquette « Dans votre norme » sous le titre long de la VFC ; courbe du bien-être en
  émeraude plutôt qu'en menthe ; échelle 0–5 cohérente avec la saisie) ; « À compléter : taille, sexe, âge ».

## Fait
- `nutritionIntakeCompare.js` : si `likelyIncomplete`, les statuts `low` et `partial` deviennent `uncertain`
  (« atteint » et « limite dépassée » restent vrais malgré les repas manquants) ; nouveau champ `statuses`.
- `Nutrition.jsx` / `.css` : barre `uncertain` en `--chart-bar-2` (vert pâle, clair et sombre) ; légende limitée aux
  statuts présents (« incertain : repas manquants »).

## Tests
- `nutritionIntakeCompare.test.js` : 2 tests (rouges avant) ; test des statuts passé sur une journée complète.
- `Nutrition.test.jsx` : test « jours incomplets » étendu (pas de barre « bas », légende).

## Vérifications
- `npm run test` (2 760 tests), `npm run build`, `npm run lint` (6 erreurs, comme avant) ; `npm run visual` Nutrition
  et Tendances ok ; captures Nutrition relues (clair et sombre, 360 px).

## Données
- Aucune donnée, migration ni export touché (statut calculé à l'affichage).

## Demandes iOS
- Changement commun aux plateformes : note de Nouveautés sans `variants`.

## Suite
- Retest du visage par le propriétaire ; POL-PLAY-11 (alpha) après une journée sans plantage dans Android vitals.
- Prochain audit : Nutrition → « Modifier » le profil, Tendances en `--empty`.

## Après le merge (#543)
- Checks de la PR tous verts (Vitest, Build APK, relais, Java, budget de lectures, émulateurs API 34/35/36).
- Build & Release : release **v398** publiée (APK 34 517 686 octets) ; Play — AAB et Tests verts sur main.

# 2026-10-21 12:30 Paris (10:30 UTC) — Jalon 2 bis (iii) : écran Accueil « Aujourd'hui » + ventre en un geste

**Type** : 🛠️ code (jalons 2 bis et 5) · **PR** : « [Auto] Accueil « Aujourd'hui » de la maquette + ventre en un geste »

## Pourquoi
- Main à `441239d` (#249), tous les workflows verts (Tests, Build & Release v194, Play — AAB 335, émulateur A56),
  aucune PR « [Auto] » ouverte. Signalement du 20/10 19:05 déjà corrigé.
- 12:30 Paris → run de code. `PRODUIT.md` / `BACKLOG.md` : prochaine étape **2 bis (iii)** — Accueil « Aujourd'hui »
  de la maquette validée. La navigation 4 onglets (2c) est gardée pour le run suivant (un run = une étape testable).

## Ce qui a été fait
- **`services/today.js`** (+ 13 tests) : ligne « mer. 21 oct. · Bonjour », titre-résumé tiré **uniquement** du bien-être
  estimé du jour (Y ; aucun comportement jugé, D6), écart à la moyenne des 13 jours précédents (≥ 3 jours estimés,
  sinon « Encore quelques jours… »), tuiles sommeil / VFC / pas avec la **source** de chaque chiffre
  (« Health Connect · Gadgetbridge »), bilan du ventre sur 7 jours, avancement vers les pistes (jours avec un repas ou
  une note du ventre, sur 21).
- **`MoodEstimateCard`** devient la carte **menthe** de la maquette : grand chiffre Figtree 800, écart en mono, courbe
  SVG des 14 jours (ligne de moyenne pointillée, point ambre du jour), phrase simple + « Une estimation, pas un
  diagnostic » ; **« détails »** → fourchette, n lectures, moyenne 14 j, confiance, modèle, puis les phrases de
  `describeFaceMood`. Sans aucune lecture : invitation à l'activer dans Sources (au lieu de rien).
  Chargement : `loadWellbeingToday` (faceMoodData.js), partagé avec le titre.
- **`TodayCards`** : tuiles de mesures ; carte **pêche « Votre ventre »** (Calme / Gêne / Douleur, choix 18 px bordure
  2 px avec rond radio) → nouvelle entrée **`gut` / `app_gut`** `{ level: 'calm'|'discomfort'|'pain' }`, horodatée,
  supprimable, affichée dans le journal (« Ventre · Gêne », bordure pêche) ; carte **lilas** « Vos pistes arrivent
  dans N jours » (barre X/21, « On préfère attendre… » ; une fois prêt, dit honnêtement que les pistes repas → ventre
  arrivent dans une prochaine version ; en détails : délais **qui seront** testés et correction BH).
- **Boutons pilule** « Photo du repas » (→ Repas) et « Une note » (contour encre 2 px, ouvre la note de bien-être).
- **`DetailsToggle` + `hooks/useDetailsMode`** : un seul mode « détails » pour la page, retenu (localStorage, try/catch).
- Données : **aucune migration** (le magasin d'entrées est générique : type + payload) ; export / import JSON inchangés
  et emportent les notes du ventre. `gut` n'entre ni dans l'estimateur du bien-être ni dans les facteurs (D5 inchangé).
- Démo visuelle : notes du ventre sur 10 jours (RNG séparé, autres données identiques).

## Vérifications
- `npm run test` : **1 718 verts** (134 fichiers) ; `npm run lint` : 6 erreurs (= main) ; `npm run build` ✅.
- `npm run visual` complet sans erreur JS ; captures lues : accueil clair, `--dark --click=détails`, `--empty`,
  `--click=détails` (ventre 7 jours, pistes), `--play --face=reading` (bandeau au-dessus du nouvel accueil), journal
  (lignes « Ventre »). Contrastes : seuls des couples de tokens déjà vérifiés (`tokens.test.js`).

## Suite proposée
- **2c** navigation 4 onglets (Aujourd'hui, Journal, Pistes, Sources ; réglages en haut à droite), avec 2b.
- Jalon 5 : fenêtres 0–4 h / 4–24 h / 24–48 h repas → ventre sur les entrées `gut`.
- À tester par le propriétaire : toucher Calme / Gêne / Douleur, vérifier la ligne dans « Vos derniers jours ».

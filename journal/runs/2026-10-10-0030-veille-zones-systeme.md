# 2026-10-10 00:30 UTC — Veille ciblée + barre d'onglets au-dessus des barres Android

**Type** : 🔭 (+ 🐛 quick win)  ·  **PR** : #82

## Pourquoi
La veille n'avait pas tourné depuis le 08/10 17:00 (1er item des « Prochaines étapes »). Le run précédent
laissait un doute : la nouvelle barre d'onglets passe-t-elle sous la barre de navigation Android (bord à
bord imposé depuis Android 15) ? Les captures de la CI émulateur ne montraient pas l'app (écran blanc à 5 s,
puis l'écran d'accueil d'Android).

## Ce qui a été fait
- **Veille** (`RESEARCH.md`, section 2026-10-10) : bord à bord Android / Capacitor 8 ; précision de la saisie
  texte et photo des repas par LLM (2025–2026) ; effet du jour de la semaine sur le bien-être ; régularité du
  sommeil ; coachs IA et causes d'abandon des apps. Idées reportées dans le backlog.
- **CI émulateur** (`.github/scripts/run-emulator-tests.sh`) : après les tests instrumentés, relance l'app,
  attend que l'onglet « Accueil » apparaisse dans l'arbre d'accessibilité (≤ 120 s), capture
  `screenshot_app.png`, ferme la modale bien-être, tape « Plus » → `screenshot_plus.png`, publie aussi les
  arbres `ui_*.xml` (bornes des éléments) et logue la version de la WebView et les encarts système.
  L'ancien tap aveugle (810, 260) et la capture à 5 s sont supprimés.
- **Constat sur émulateur API 36 (WebView 133)** avant correctif : l'heure et les icônes recouvrent le bandeau
  de mise à jour, le trait gestuel passe sur les libellés des onglets, les boutons de la modale bien-être sont
  coupés en bas.
- **Correctif** : icônes de la barre d'état en clair (`SystemBars.style = "DARK"` dans `capacitor.config.json` : elles étaient sombres sur fond sombre) ; `viewport-fit=cover` (sans lui, Capacitor 8.2 n'injecte pas `--safe-area-inset-*`, et
  `env()` est faux sur les WebView ≤ 139) ; `--safe-top/--safe-bottom` = variable Capacitor puis `env()` en
  repli ; fond opaque sous la barre d'état (`body::before`) ; bandeau de mise à jour collé sous la barre
  d'état ; modale bien-être et assistant Connecteurs dans la zone visible.
- **Outil visuel** : `npm run visual -- --viewport --insets=24,48` simule les encarts injectés par Capacitor
  et dessine les barres système en rose translucide.
- Test `src/safeArea.test.js` (3 cas : viewport-fit, variables, pas de `env()` direct dans les CSS).

## Vérifications
- Tests : 559 ✅ (556 avant) · Lint : 7 erreurs, 1 warning (inchangé) · Build ✅
- Visuel navigateur : toutes les pages (démo et `--empty`) sans erreur JS ; `--insets=24,48` sur `/`, `/plus`
  et la modale bien-être : en-tête sous la barre d'état, barre d'onglets au-dessus de la barre de navigation.
- Visuel émulateur : voir la section « Résultat CI » ci-dessous.

## Apprentissages / décisions
- La WebView de l'image émulateur API 36 est en **133** : exactement la plage où `env(safe-area-inset-*)`
  est faux. Les téléphones à jour ont une WebView ≥ 140, mais on ne peut pas compter dessus.
- Avec `viewport-fit=cover` et WebView ≤ 139, Capacitor 8.2 met les marges natives à zéro et compte sur les
  variables CSS → il faut **toujours** passer par `--safe-top/--safe-bottom`, jamais `env()` directement
  (test ajouté).
- Les artefacts `screenshots-samsung-a56-api35/36` de chaque PR montrent maintenant l'app réelle : à regarder
  à chaque changement d'interface.

## Suite proposée
- 🏗️ Saisie texte libre / dictée d'un repas (prompt : unités ménagères françaises, matières grasses).
- 🏗️ Capacitor 8.4 + CLI 8, avec captures émulateur avant/après.
- 🏗️ Variable « week-end » de contrôle dans les analyses, puis effets décalés.

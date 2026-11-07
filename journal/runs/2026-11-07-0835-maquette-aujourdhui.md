# 07/11 08:35 — Maquette du nouvel écran « Aujourd'hui » (TESTEUR-1b)

Type : 💡 run idées (08:35 Paris), sans code produit. Étape prévue par le run de 07:35.

## Constat au démarrage
- main `531caeb` (#773), tous les workflows verts (Build & Release, Tests, Play — AAB, émulateur A56, Alpha).
  Aucune PR « [Auto] » ouverte (seule #51, cursor/*, non touchée).
- Capture de l'Accueil actuel (`npm run visual -- --play --routes=/`, démo) : titre « Une journée moyenne » séparé de
  la carte « Bien-être estimé » qui le produit, tuiles sans source, gestes pour noter éparpillés en cinq endroits,
  carte lilas qui ne dit pas ce qu'est une analyse.

## Fait
- `journal/maquettes/aujourdhui/` : `maquette.html` (tokens et polices de l'app, données synthétiques, états démo /
  vierge / bonne / difficile, clair et sombre, animation CSS immobile avec `prefers-reduced-motion`), `render.mjs`
  (Playwright), 6 captures JPEG (avant, démo clair, démo sombre, premier jour, bonne journée, journée difficile
  sombre), `README.md` : ordre de l'écran, textes, cas limites (aucune lecture, confiance faible, sources absentes,
  sans « Mon ventre »), règle de sens constant des couleurs, découpage en runs 1c, 1d, 1d-2, 1e.
- Règles vérifiées dans la maquette : statut = bien-être seul (le ventre ajuste, VENTRE-BE-2, et le dit en
  étiquette) ; « Ce qui change » factuel, sans couleur de jugement ni « pourquoi » (règles 5 et 6) ; seuils du
  titre repris de `daySummaryTitle` ; aucune mention « diagnostic » en refrain.
- `BACKLOG.md` (1b coché, 1c / 1d / 1d-2 / 1e précisés), `PRODUIT.md`, `DESIGN.md` §7 (renvoi vers la nouvelle
  maquette), résumé de la semaine.
- Pas de Nouveautés : rien ne change dans l'app.

## Vérifications
- Captures relues une à une (titres longs qui chevauchaient le halo et « 9 h » coupé : corrigés avant le rendu final).
- `npm run test` lancé avant merge (seul le journal change).

## Suite
- TESTEUR-1c au prochain run de code : `DayStatusCard`.
- TESTEUR-3b (Bien-être et Tendances) : proposition à préparer au run idées de 20:35.

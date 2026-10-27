# Run du 27/10/2026 08:33 (Paris, CET) — Idées : jalon 9 (anglais) prêt à coder

**Type** : 💡 run « idées » (08 h) — journal seul, aucun code produit.

## Constat au démarrage
- Main à `90569d4` (#423, journal N6c, v310) ; « Build & Release », tests et émulateurs verts ; aucune PR « [Auto] »
  ouverte (seule la PR #51 `cursor/*`, pas à nous).
- Chantier FODMAP du 26/10 livré (N1–N6c) ; M6a/M6b/M7/M7b livrés. Le jalon 9 (i18n + anglais) était le plus gros
  chantier sans spécification.

## Ce qui a été fait
- **Mesure de l'existant** (script jetable `@babel/parser` dans le scratchpad, rien de committé) : 211 fichiers,
  ≈ 2 800 chaînes / 17 500 mots (≈ 2 000 visibles hors diagnostic) ; 41 fichiers avec `fr-FR` en dur, 14 virgules
  décimales à la main ; 25 fichiers Java avec du texte ; prompts du relais « en français » ; 59 fichiers de test qui
  cherchent du texte français.
- **Trouvaille** : `alim_2025_11_03.xml` (Ciqual 2025, Zenodo, CC BY 4.0) donne `alim_nom_eng` pour **3 484 / 3 484**
  aliments → noms anglais officiels, seuls les 69 alias restent à écrire.
- **Choix technique** (I181) : `t()` maison sans dépendance, français = clé, `Intl` pour pluriels / dates / nombres,
  test de catalogue ; i18next, Lingui et react-intl écartés (motifs notés).
- **Marché** (I182) : États-Unis à exclure avant relecture juridique (FTC Health Breach Notification Rule élargie en
  2024 ; Washington My Health My Data Act) → **P32** dans `PRODUIT.md` §4 ; concurrence anglophone notée (Tract,
  IBS Tracker, bloaty, mySymptoms, FODMAP Helper, Fodmap Snap) ; vocabulaire anglais interdit / préféré.
- **Découpage** (I183) : 9a–9h, ≈ 8 runs, reporté dans `BACKLOG.md` et `PRODUIT.md` (jalon 9).

## Points ouverts
- Comportement de `navigator.language` dans la WebView avec une langue par app (Android 13+) : non documenté →
  lire la langue auprès du natif, à vérifier sur l'émulateur en 9g.
- Lexique anglais de la dictée du soir : licences à vérifier (NRC VAD = recherche seulement) → désactivé en anglais
  au départ.

## Vérifications
- Journal seul : pas d'entrée « Nouveautés », Sécurité des données inchangée. `npm run test` lancé avant le merge
  (garde-fou de la charte).

## Suite
- Run de code suivant : M6 / M7 / jalon 5 selon l'ordre du propriétaire ; sinon **9a** (socle i18n, rien de visible).

# Run du 31/10/2026 06:33 (Paris, CET) — Recherche d'aliments plus juste (POL-PLAY-78)

**Type** : 🎨 polissage (audit Repas → recherche d'un aliment, Journal en sombre)

## Constat au démarrage
- Main à `4d585a7` (#548) : Tests, Build & Release (v400), Play — AAB et émulateur A56 verts. Aucune PR « [Auto] »
  ouverte (seule #51, `cursor/*`, non touchée). Plantage du visage du 30/10 corrigé (#531) : retest du propriétaire attendu.

## Audit
- 35 recherches courantes passées dans `searchIngredients` (riz, lait, ail, vin, œuf, huile d'olive…). Défauts :
  - recherche en milieu de mot : « ail » proposait « Dinde, aile crue » et **« Haché de volaille »** (vol*ail*le) ;
  - « lait » mettait « Laitue, crue » en 3e, avant les laits ; « vin » mettait « Vinaigre » avant « Vin rouge » ;
  - alias Ciqual (même `ciqual_code`, anciens noms gardés pour la compatibilité) proposés deux fois :
    « Oignon cuit » / « Oignon, cuit », « Oeuf dur » / « Œuf cuit »…
- Capture de l'éditeur : la croix « effacer » du champ de recherche était le bleu système du navigateur.
- Journal → Jours en sombre (démo) : lisible, pastels par thème bien contrastés, rien à corriger.

## Fait
- `searchIngredients` : chaque mot de la requête doit commencer un mot du nom (milieu de mot seulement en secours si
  rien ne correspond) ; ordre : nom qui commence par la requête en mot entier, puis par la requête, puis par son premier
  mot ; à rang égal, mots entiers avant débuts de mot, puis les plus courts ; un aliment Ciqual n'est proposé qu'une fois.
- `index.css` : croix des champs `type="search"` dessinée en gris secondaire de l'app (clair et sombre).
- `visual-check.mjs` : option `--search=<texte>` (tape dans la recherche de l'éditeur de repas avant la capture).

## Tests
- 4 tests neufs dans `mealEditing.test.js` (rouges avant le correctif) : « ail » sans « Haché de volaille », mots
  entiers d'abord (lait, vin), secours en milieu de mot, alias Ciqual dédoublonnés.

## Vérifications
- `npm run test` (2 765 tests), `npm run build`, `npm run lint` (6 erreurs, comme avant).
- Captures relues : `--routes=/food --meal-text --search=ail|lait` en clair et `--dark`, `/journal --dark`.

## Données
- Aucune donnée, migration ni export touché (seul l'ordre des propositions change ; les repas existants gardent leurs noms).

## Demandes iOS
- Aucune concernée (changement commun aux deux plateformes, pas de variante).

## Suite
- Retest du visage par le propriétaire ; POL-PLAY-11 (alpha) après une journée sans plantage dans Android vitals.
- Prochain audit : Repas → repas habituels en sombre, Données (export/import) en `--empty`.

## Après le merge (#549)
- 1er push : « Frontend (Vitest) » rouge — `tokens.test.js` refuse le mot `black` dans le SVG du masque de la croix ;
  remplacé par `currentColor` (un masque ne lit que l'opacité), rendu identique vérifié en capture.
- Checks de la PR tous verts (Vitest, Build APK, relais, Java, budget, émulateur A56 API 35/36 et bord à bord API 34).
- Tests, Build & Release et Play — AAB verts sur main : release **v401** publiée (APK 34 518 614 octets).

# Run du 04/11/2026 05:35 (Paris, CET) — Cibles tactiles et noms accessibles (A11Y-1)

**Type** : 🎨 code (accessibilité, version Play)

## Constat au démarrage
- Main à `514bf1c` : Tests, Build & Release, Play — AAB et émulateur verts. Aucune PR « [Auto] » ouverte.
- Priorités du prompt : compte rendu du 02/11 et fin iPhone livrés ; P37, P42 (07–08/11), P43, P44 attendent le
  propriétaire. Pris dans le backlog C1 : « Accessibilité : cibles tactiles ≥ 44 px, libellés ARIA », utile avant
  l'arrivée des testeurs (petits écrans, doigts).

## Fait
- `npm run visual` : nouveau contrôle `findA11y` (avertissement, comme « TEXTE QUI DÉBORDE ») : éléments interactifs
  visibles sans nom accessible (« SANS NOM ACCESSIBLE ») et cibles de moins de 44 px (« CIBLE < 44 px »). Ignore les
  liens dans une phrase, les champs fichier cachés et ce qui est dans un volet replié (y compris imbriqué).
- Premier passage `--play` (démo) : 8 cibles trop petites et 1 faux positif (volet imbriqué), corrigé dans le contrôle.
  Corrections (TDD, `src/tapTargets.test.js` rouge puis vert) : volets `summary` de `MethodNote`, `BaselineCards`,
  `Recommendations` 32 → 44 px ; « Désactiver » (Sources, lecture du visage) 40 → 44 px ; « Restaurer un achat » et
  liens du paywall 36 → 44 px ; volet « Attendu d'après vos habitudes » 17 → 44 px ; liens de licence 15 → 44 px
  (alignés à droite) ; liens des guides montre 32 → 44 px. Le test interdit tout `summary` ou `.btn` sous 44 px.
- Note Nouveautés « Des boutons plus faciles à toucher ».

## Vérifications
- `npm run test` 2974 verts ; `npm run lint` 0 erreur ; build OK.
- `npm run visual -- --play` et `--play --empty` : 16 pages, 0 avertissement d'accessibilité ; `--play --dark` sur
  Licences, Analyses, Tendances. Captures lues : paywall (liens alignés sur « · »), Licences clair et sombre,
  Tendances (« Comment c'est calculé », « Attendu d'après vos habitudes »), Analyses sombre.

## Suite
- A11Y-2 : onboarding pas à pas avec le contrôle ; TalkBack sur l'émulateur ; contrastes automatiques.
- TEST-ALPHA-1 (07–08/11, clic P42) ; P37, P43, P44 en attente du propriétaire.

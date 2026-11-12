# Run 12/11 07:35 — Journal vide : « Noter ma digestion » ouvre la note (POLISH-JOURNAL-VIDE)

**Type** : code (mode polish).

## Contexte
- Main c853444 (#930) : « Build & Release », « Tests », émulateur A56, « Play — AAB » verts. Aucune PR « [Auto] »
  ouverte (seule la #51, hors routine).
- File du mode polish vide côté code ; suite de l'audit visuel : `npm run visual -- --play --empty --dark` (18 pages).

## Constat
- Journal › Jours vide : la tuile « Noter votre digestion » était un lien vers `/` sans état : Aujourd'hui s'ouvrait
  sans la fenêtre « Ma digestion ». La tuile bien-être, elle, ouvre sa note sur place (POL-PLAY-87), et Analyses ›
  Digestion passe déjà `state: { open: 'digestion' }`. Libellé différent du bouton d'Aujourd'hui (« Noter ma digestion »).
- Vus sans défaut à corriger : Aujourd'hui, Tendances (« Vos courbes apparaîtront après 3 jours de mesures »), Analyses
  (Bien-être, Digestion), Agir, Sources. Le petit « + » seul sous « Noter ma digestion » laisse un blanc dans l'outil
  seulement (sur le téléphone, le rappel du soir le précède) : laissé.

## Fait
- Test d'abord (`JournalEmpty.test.jsx`) : toucher la tuile arrive sur `/` avec `open: 'digestion'` ; rouge puis vert.
- `PastelTiles` transmet `state` au lien ; tuiles « Noter ma digestion » et « Noter mon bien-être ».
- Nouveautés : `2026-11-12-0735-journal-vide-digestion.json`.

## Vérifs
- `npm run test`, `npm run lint`, `npm run build`, `npm run visual -- --play --empty --dark --routes=/journal
  --click="Noter ma digestion"` (fenêtre ouverte), clair vide. Captures `runs/captures/2026-11-12-0735-journal-vide-*`.

- Faux pas : la suite complète locale avait tourné avant l'ajout de l'entrée Nouveautés, écrite avec le genre
  « correction » ; la CI l'a refusé (`WhatsNew.test.jsx` : nouveau, amélioration, correctif). Corrigé en « correctif ».
  Leçon : relancer `WhatsNew.test.jsx` après avoir écrit l'entrée.

## Suite
- Simulations du run « idées » de 08:35 ; PROP-SIM-11, 12, 13 (maquettes) ; CYCLE-3 attend P48.

# Run du 25/10/2026 11:33 (Paris, CET) — VC-26 : Accueil vierge plus léger

**Type** : 🧭 chantier produit (version candidate, dernier défaut d'écran de l'audit du 25/10 08:33)

## Constat au démarrage
- Main à `d2718a8` (#361, journal v270) ; aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- « Test — émulateur Samsung Galaxy A56 » **rouge sur `d2718a8`** (job API 35 seul : « Variante play : premier écran
  non affiché après 90 s ») alors que ce commit ne touche que le journal et que le même code (`3fab5a6`) était vert
  sur les deux émulateurs ; API 36 vert sur `d2718a8`. Jugé instabilité de l'émulateur (démarrage lent : « Unable to
  connect to adb daemon », snapshot non chargé) → **une seule relance** des jobs en échec : **verte** (instabilité confirmée, rien à corriger).

## Ce qui a été fait (VC-26)
- `MeasureTiles` : si aucune des trois mesures n'a de valeur, **une seule ligne** sur surface neutre « Sommeil, cœur
  et pas arrivent de votre montre · Ajouter une source » au lieu de trois tuiles « — » ; les tuiles reviennent avec le
  premier chiffre (une tuile vide reste « — » quand une autre a une valeur).
- `Dashboard` : présentation du premier lancement en **une phrase** (« Notez vos repas [et votre ventre si l'objectif
  est « Mon ventre »] en un geste : Halcya vous aide à comprendre ce qui va avec vos bons et mauvais jours. ») ; le lien
  « Sources » de l'intro est remplacé par « Ajouter une source » de la ligne des mesures. Liens « Vos derniers jours /
  Vos tendances, dans le Journal » **masqués sans aucune donnée**.

## Vérifications
- Vitest **2 193** verts (+1 : liens Journal masqués à vide ; tests intro « une phrase » et ligne unique des mesures) ;
  build OK ; lint inchangé (6 erreurs préexistantes) ; `npm run visual` complet OK ; captures relues : `/` play vierge
  clair et sombre (une phrase, ligne des mesures, plus de liens Journal), play démo clair et sombre (inchangé).

## Suite
- **AVIS** (Paramètres → « Envoyer un avis »), puis **VC-PUBLIER**. POL-1d après, à part (P28).

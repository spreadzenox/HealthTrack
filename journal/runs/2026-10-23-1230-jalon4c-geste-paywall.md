# 2026-10-23 12:30 Paris (10:30 UTC) — Jalon 4c-1 : premier geste et paywall soft

**Type** : 🧭 chantier produit (jalon 4, découpage I154 : écrans 8 et 9)

## Constat
- Main à `ba8f5bb` (#292) ; Build & Release, Tests, émulateur A56, Play — AAB : verts. Aucune PR « [Auto] » ouverte
  (seule #51 `cursor/*`, non touchée). Run de code (12:30).

## Ce qui a été fait
- `Onboarding.jsx` : étape `gesture` après la montre / le « aha » — objectif `gut` → Calme / Gêne / Douleur (entrée
  `gut`, source `app_gut`, comme la carte pêche) ; sinon note 0–5 (entrée `wellbeing`, source `app_wellbeing`, la même
  auto-déclaration que `WellbeingPrompt`). Facultatif ; une seule entrée (id gardé dans l'état de l'onboarding,
  `updateEntry` si l'on change d'avis) ; `health-entries-updated` émis.
- Étape `premium` (seulement si `FEATURES.billing`, donc play) : la page `Premium` rendue dans l'onboarding avec
  `context="onboarding"` (phrase « Vos pistes arriveront vers le 21ᵉ jour de suivi… rien ne presse ») et `onClose` ;
  « Plus tard » devient « Continuer gratuitement » ; le bouton « Continuer » et « Passer » de l'onboarding sont masqués
  sur cet écran (la croix et « Continuer gratuitement » terminent l'onboarding, `endedBy: completed`).
- Défaut corrigé (introduit par 4b) : `needsOnboarding` notait « existing » un onboarding interrompu après l'import
  Health Connect (la base n'est plus vide). Un onboarding commencé (`maxStep > 0`) reprend désormais sans lire la base.
- `visual-check.mjs` : `--onboarding=gesture | gesture-energy | premium` (table d'états).
- Changelog `2026-10-23-1230-bienvenue-premier-geste.json`.

## Vérifications
- `npm run test` : **1 996 verts** sur 161 fichiers (1 échec isolé de `WellbeingPrompt.test.jsx` au premier passage,
  fichier non touché, vert seul et au second passage complet : lenteur de la machine).
- `npm run build` OK ; `npm run lint` : 6 erreurs, identiques à main.
- Captures relues : premier geste ventre (clair, « Gêne » sélectionné), bien-être 0–5 (sombre, « 4 »), paywall soft
  play (05/05, phrase contextuelle, « Continuer gratuitement » en bas, pas de « Passer »).

## Suite
- **4c-2** : écran 7, lecture du visage facultative (divulgation `camera_app_open`, « Essayer maintenant » / « Plus
  tard », résultat « estimation, pas un diagnostic »), placé avant le premier geste. Puis I155 (l'objectif règle
  l'Accueil), I156.
- Paywall : la phrase « vers le 21ᵉ jour » reste vraie quel que soit l'essai (14 j) ; à revoir si l'essai change.

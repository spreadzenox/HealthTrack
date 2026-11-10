# Run 10/11 15:35 — Analyses s'ouvre sur Digestion pour qui suit son ventre (POLISH-SIM-33)

**Type** : code (mode polish).

## Contexte
- Main 6575ddc : Tests, Build & Release, Play — AAB verts. « Test — émulateur Samsung Galaxy A56 » rouge sur deux
  jobs (API 35 et API 34) : `Error on ZipFile unknown archive` au téléchargement de l'image Android, panne du
  runner et pas notre code (les trois autres jobs émulateur verts). Jobs relancés (`rerun-failed-jobs`).
- Aucune PR « [Auto] » ouverte.

## Fait
- POLISH-SIM-33 (simulation Ventre et données J45 du 10/11) : l'onglet Analyses de la barre du bas mène à
  `/recommendations/ventre` quand les objectifs comprennent « Ma digestion » ou « Mon cycle » (`wantsGut`), sinon à
  Bien-être comme avant. Le sous-onglet Bien-être reste à un geste ; l'onglet reste actif sur les deux.
  Test rouge puis vert (`TabBar.test.jsx`, 4 cas d'objectifs).
- Vérifié dans Chromium : objectif « Ma digestion », Journal → Analyses ouvre Digestion
  ([capture](captures/2026-11-10-1535-analyses-digestion.png), base vide, aucune erreur JS).

## Vérifs
- `npm run test` vert (3 378) ; `npm run lint` 0 erreur ; `npm run build` OK ; `npm run visual` OK.

## Reste
- POLISH-SIM-31, 32, 34 à 37 ; PROP-SIM-10 (maquette au prochain run « idées »).
- Le lien « Où en sont vos analyses » d'Agir mène toujours à Bien-être (sans objectif lu) : à aligner si une persona
  le relève.

## Merge
- PR #894 : tous les checks verts (Vitest, Build APK, relais, protocole montre, 5 jobs émulateur). Le merge
  (squash) a été refusé par le contrôle d'autorisations de la session (« merge sans relecture ») : la PR reste
  ouverte, prête. Au run suivant : remettre la branche à jour sur origin/main et la merger si les checks sont verts,
  ou le propriétaire la merge d'un clic.

# Run du 04/11/2026 01:35 (Paris, CET) — Analyses : masquer une piste du ventre (I86, suite)

**Type** : 🎨 code (Analyses)

## Constat au démarrage
- Main à `2ed0d1b` (#669) : Tests, Build & Release v477, Play — AAB, Relais — déploiement verts ; aucune PR « [Auto] »
  ouverte (la #51, hors routine, pas touchée).
- Priorités du prompt : compte rendu du 02/11 et fin iPhone faits (relais vérifié au run de 00:35 : 27/11 Android,
  06/11 iPhone) ; P37, P42, P44 attendent le propriétaire ; TEST-ALPHA-1 le 07–08/11. Suite d'I86 notée au run
  précédent : les pistes repas → ventre.

## Fait
- `settings/hiddenLinks.js` : `gutLinkKey(link)` = `gut:<facteur>` (un aliment ou un sous-groupe FODMAP, tous délais).
- `GutLinks.jsx` : « Masquer cette piste » derrière le chevron ; pistes masquées filtrées (aperçu flouté compris) ;
  « Vous avez masqué toutes les pistes du ventre. » quand tout est masqué.
- `Recommendations.jsx` : compteur « N liens masqués » et « Tout réafficher » comptent les pistes du ventre.
- `pistesSummary.js` : la carte lilas de l'Accueil ne cite plus une piste du ventre masquée.
- Export / import JSON : rien à changer (même clé `hiddenLinks`).
- Note Nouveautés `2026-11-04-0135-masquer-piste-ventre.json` (toutes variantes).

## Vérifications
- `npm run test` 2966 verts (4 nouveaux) ; `npm run lint` 0 erreur ; build OK ;
  `npm run visual -- --play --routes=/recommendations --gut-links` (clair, sans abonnement : aperçu flouté inchangé) et
  `--subscription=launch --dark --click="Afficher les détails"` : captures lues (bouton discret en bas de la carte pêche).

## PR
- PR #670 : Frontend (Vitest), Build APK, Relais (Node), Budget de lectures, Protocole montre verts (émulateurs encore en
  cours). **Merge refusé à la session** (classificateur « Merge Without Review ») : non contourné ; au run suivant, remettre
  la branche à jour sur origin/main, revérifier les checks et merger (squash).

## Demandes iOS
- Aucune nouvelle.

## Suite
- I87 (force et confiance en mots) ; TEST-ALPHA-1 (07–08/11, P42) ; P37, P44 en attente du propriétaire.

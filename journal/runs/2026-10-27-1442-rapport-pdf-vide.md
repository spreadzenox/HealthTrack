# Run du 27/10/2026 14:42 (Paris, CET) — polissage play : pas de rapport PDF vide dans Analyses

**Type** : 🎨 UI / polissage de la version play (décision du 27/10 13:00 : polir écran par écran, par impact)

## Constat au démarrage
- Main à `e5bc035` (#434, v316), « Build & Release », « Play — AAB » et émulateur verts ; aucune PR « [Auto] » ouverte
  (seule #51 `cursor/*`, non touchée). P28 attend le propriétaire (interrupteur coupé).
- Audit des 15 pages en `npm run visual -- --play --empty` (installation neuve de la variante play) : Accueil, Journal
  (Jours, Nutrition, Tendances), Sources, Données lus. Défaut le plus visible : **Analyses, objectif « Mon ventre »,
  sur données vierges, montrait la carte « Rapport PDF pour mon médecin » avec « premium » et un gros bouton
  « Débloquer »** — un appel à payer pour un rapport qui serait vide (et, en sideload, « Préparer le rapport » sur rien).
  Contraire au principe « blocs sans données = une ligne discrète » (POL-7) et au paywall « au moment de la valeur ».

## Fait
- `Recommendations.jsx` : sans aucune note du ventre (`gut.status === 'no_notes'`), la carte n'est plus rendue ; une
  ligne « Bientôt » « Rapport PDF pour mon médecin · dès votre 1re note du ventre » la remplace, mais seulement si
  quelque chose est déjà noté (`currentDays > 0`) : données vierges = carte lilas seule (décision VC-12 conservée).
- Données garde la carte (le propriétaire est content de cet écran, et l'utilisateur y va exprès).
- Tests : `Recommendations.test.jsx` +1 (ligne « Bientôt », ni carte ni « Débloquer ») et l'assertion « vierge » vérifie
  l'absence de la carte.

## Vérifications
- `npm run test` : 209 fichiers, 2 565 tests verts ; `npm run build` OK ; lint : 6 erreurs, comme avant.
- `npm run visual -- --play --empty` (15 pages, 0 erreur JS) puis Analyses relue : carte lilas + « Tester un groupe
  FODMAP », plus de « Débloquer ». `--play --dark` (démo) : le rapport reste en bas d'Analyses.

## Autres défauts vus (rangés dans BACKLOG, POL-PLAY)
- Accueil vierge : « Sommeil, cœur et pas arrivent de votre montre » suppose une montre (le téléphone seul en donne aussi).
- « Tester un groupe FODMAP » : chevron « › » collé au texte, pas de mention premium alors que le test l'est en play.

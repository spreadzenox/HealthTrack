# Run du 28/10/2026 09:33 (Paris, CET) — « Piste solide » à partir de 8 jours (POL-PLAY-23)

**Type** : 🎨 Honnêteté statistique / polissage play (variantes play et sideload)

## Constat au démarrage
- Main à `012ce8d` (#462). Aucune PR « [Auto] » ouverte (PR #51 `cursor/*` hors routine, non touchée). Derniers
  workflows de main verts (Build & Release v334, Play — AAB, émulateur).
- Run de code. Pris : **POL-PLAY-23** (une erreur d'honnêteté statistique passe avant la mise en page de POL-PLAY-21).

## Cause
- `evidenceLevel(q)` ne regardait que la valeur q. Les pistes « jours avec / sans » du bien-être
  (`behaviorTags.computeTagEffects`, aussi utilisé pour le bien-être estimé par le visage) n'exigent que
  `MIN_TAG_DAYS = 5` jours de chaque côté : avec 6 jours d'alcool, un q < 0,05 donnait « Piste solide », alors que les
  pistes du ventre exigent 8 jours exposés (`gutDays.MIN_EXPOSED_DAYS`).

## Fait
- `statistics.js` : `MIN_SOLID_GROUP_DAYS = 8` et `evidenceLevel(q, minGroupDays = Infinity)` : « solide » seulement si
  le plus petit groupe a au moins 8 jours, sinon « à confirmer » ; les autres niveaux sont inchangés. Corrélations
  continues et effets décalés (14 paires minimum) non concernés (paramètre absent = comportement d'avant).
- `behaviorTags.js` : passe `min(nWith, nWithout)`. Le seuil d'affichage (5 jours) reste : la piste se montre, mais
  « à confirmer ».
- Tests (rouges avant) : seuils 6 / 7 / 8, cohérence avec `gutDays.MIN_EXPOSED_DAYS`, et une piste nette sur 5 jours
  qui sort « à confirmer ». Le plafond est déterministe : pas besoin d'un nouveau banc des nulles (il ne peut que
  retirer des « solide »). Cache d'analyse invalidé par la version de l'app.

## Vérifications
- `npm run test` : 2 598 verts ; lint 6 erreurs (inchangé) ; build OK.
- `npm run visual -- --play --dark --routes=/recommendations` (démo) : « Alcool · 6 jours avec · 23 sans » affiche
  maintenant « À confirmer » ; « Sport le soir » (30 / 44) reste « Piste solide ».

## Suite
- POL-PLAY-21 (Accueil : annoncer les pistes), POL-PLAY-22 (statistiques derrière le chevron), puis 18, 19, 24 à 28.

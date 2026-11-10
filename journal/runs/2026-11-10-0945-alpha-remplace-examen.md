# Run 10/11 09:45 — Alpha : remplacer l'examen en cours (CD-ALPHA-7)

**Type** : infra (tâche courte demandée par le prompt).

## Contexte
- Décision du propriétaire du 10/11 vers 10:15 : « En fait il faudrait faire comme sur apple c'est à dire retirer de
  la file toutes les versions précédentes à chaque nouveau submit ».
- C'est déjà le comportement de Google : chaque envoi remplace la version de la piste alpha, et `edits.commit`
  annule l'examen en cours avant d'envoyer la nouvelle version (`changesInReviewBehavior`, valeur par défaut
  `CANCEL_IN_REVIEW_AND_SUBMIT`).
- Aucune PR « [Auto] » ouverte (seule PR ouverte : #51, sans rapport) ; main vert (Tests, émulateur A56, Build & Release).

## Fait
- `app/scripts/play/publish.mjs` : constante `CHANGES_IN_REVIEW_BEHAVIOR` ; première validation
  `:commit?changesInReviewBehavior=CANCEL_IN_REVIEW_AND_SUBMIT` ; repli `?changesNotSentForReview=true` inchangé.
- `publish.test.mjs` : routes de validation adaptées (rouge 17 tests, puis vert) ; le test du repli vérifie que le
  second appel est bien `?changesNotSentForReview=true` seul.
- `reviewGate.mjs` : une phrase en tête (chaque envoi remplace la version et annule l'examen en cours).
- Non touchés : `listing.mjs`, `subscriptions.mjs`, `review-freeze.json`. Aucun envoi lancé à la main.
- Rien dans `app/src` : pas d'entrée Nouveautés.

## Vérifs
- `npx vitest run scripts/play/` : 167 tests verts. Suite complète et build : voir la PR.

## Reste
- Envoi nocturne normal à 23:45 (Paris) ; il utilisera la validation explicite. 100962 en examen chez Google.

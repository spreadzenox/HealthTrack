# Mission ETAT-PLAY — Relever l'état d'examen des versions sur Google Play

- **Voie** : b. L'API de publication dit quelle version est sur chaque piste, pas si Google l'examine encore.
- **Durée** : 2 min. **Quand** : quand le résumé de la semaine la demande (par ex. une version Alpha en examen depuis
  plus de 36 h), ou quand vous voulez savoir où en est l'examen.

## Étapes

1. Ouvrir https://play.google.com/console → **Halcya** → **Vue d'ensemble de la publication**
   (Publishing overview).
2. Relever : modifications « En cours d'examen » (lesquelles, depuis quand), modifications « Prêtes à être publiées ».
   Ne cliquer ni sur « Envoyer pour examen » ni sur « Publier » sauf si la routine l'a écrit dans le résumé.
3. **Tester et publier → Tests → Test fermé → Alpha** : version (code) affichée, état, date.
4. **Test interne** : même relevé.

## Vérification finale

Trois lignes : examen en cours (oui/non, depuis), Alpha (code, état, date), test interne (code, état, date).

**Capture attendue** : la vue d'ensemble de la publication. **Phrase de retour** : « État Play : » suivi des trois
lignes.

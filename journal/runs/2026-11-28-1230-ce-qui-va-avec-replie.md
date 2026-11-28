# Run 28/11 12:30 — « Ce qui va avec » replié sous les familles (fin de REFONTE-6c-3)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 976d741 (#1329) vert
(Tests, Build & Release, Play — AAB, émulateur A56) · **TestFlight** : 1381.1381 chez « Testeurs Halcya » (inchangé ;
build du soir à 21:20) · **Parité** : 70 % (33/47), inchangée (code partagé, aucun fichier de `iphone/` touché)

## État de départ
- #1329 mergée, main vert. Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée).
- Pas de nouvelle réponse du propriétaire.

## Fait (test d'abord)
- **REFONTE-6c-3, dernier reste** : dans le détail d'un objectif (Votre bien-être, Votre confort digestif), sous
  « Par famille », la section « Ce qui va avec votre … » montrait toutes les barres par délai, que chaque famille
  reprend déjà dans son détail. Elle se replie sur « 11 facteurs comparés, délai par délai. » et le chevron
  `DetailsToggle`, la même forme que « Ce qui a été comparé » du détail d'une famille (même apparence, même type
  d'information). Rien n'est retiré : le chevron rouvre unité, barres, légende et « change de sens ».
- Restent ouverts d'emblée : dans l'exemple de la visite guidée (l'étape « Le détail de chaque piste » pointe ces
  barres) ; quand rien n'est net et qu'on a touché « Voir les liens pas encore nets » (déjà un geste explicite) ;
  sans familles.
- L'unité « pt » se dit sous « À regarder, pas à changer » tant que « Ce qui va avec » est replié (sinon ces barres
  restaient sans unité).
- Rétrocompatibilité : aucun stockage changé.

## Vérifications
- Tests : 2 nouveaux (`Recommendations.test.jsx` : repli et unité ; exemple de la visite ouvert), 5 mis à jour
  (ils ouvrent le chevron avant de lire les barres) ; vus rouges puis verts. Suite complète : 4 785 tests verts. Build : ok.
  Lint : 0 problème sur les fichiers touchés.
- Captures relues : `--routes=/recommendations/bien-etre --habits=history --now=14:00 --settle=2500`, clair et
  sombre : « 11 facteurs comparés, délai par délai. » et le chevron, puis « À regarder » avec son unité. Sur les
  données de démo seules (rien de net), la page est inchangée (« Voir les liens pas encore nets »).
- iPhone : aucun fichier de `iphone/` touché ; build iOS sur simulateur de la PR quand elle passe en « prête ».

## Suite proposée
1. REFONTE-6c-3 est soldée : prochaine étape du BACKLOG de la refonte (restes des étapes 8 à 14).
2. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; soumission bêta de la build du soir, expiration.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, le message E.

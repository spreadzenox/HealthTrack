# Run 28/11 05:30 — L'essai « Pas d'écran après 22 h » (REFONTE-6c-7)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main f722c82 (#1322) vert
(Tests, Build & Release, Play — AAB, émulateur A56) ; **Alpha du 27/11 partie** (« Play — Alpha », 04:16 UTC, vert) ·
**TestFlight** : 1362.1362 chez « Testeurs Halcya », 1381.1381 en examen bêta depuis 03:38 UTC (moins de 24 h :
pas d'expiration) · **Parité** : 70 % (33/47), inchangée (code partagé)

## État de départ
- #1322 (REFONTE-6c-6) mergée. Aucune PR de la routine ouverte ; #51 (`cursor/*`) pas touchée.
- Pas de nouvelle réponse du propriétaire.

## Fait
- **REFONTE-6c-7, suite de la SPEC comprendre § 6.5 et § 7**, tests d'abord. Constat : une piste « Écran tard » lancée
  par « Je teste » ou Agir donnait la consigne « Un peu moins d'écran tard (veille au soir, 22 h–4 h) que d'habitude »
  et sa tenue n'était jamais lue (question chaque matin).
  - `trials.js` : `screen_late_minutes` dans `MEASURED`, consigne « Pas d’écran après 22 h » (sens inverse : « Écran
    après 22 h permis »), seuil fixe 30 min (`AUTO_LATE_SCREEN_MIN`, la même mesure que les points ambre du détail
    Sommeil et que les pistes ; la SPEC dit 5 min, mais un même objet, une seule mesure). Le soir du jour D se lit au
    résumé de D + 1 (`nextDay` : l'écran de 22 h à 4 h est rangé au jour du réveil).
  - `withTodayLateScreen` : la journée en cours n'est pas encore une entrée `phone_usage`, mais son écran tard (la
    veille au soir) est complet dès 4 h ; `readTrialsData` l'ajoute, pour que la lanterne s'allume le matin même
    (SPEC § 7). Une entrée déjà enregistrée garde sa valeur.
  - `visual-check.mjs` : `--trial-factor=late-screen`.
- Rien de nouveau stocké ; les essais existants ne changent pas.

## Vérifications
- Tests : 4 nouveaux dans `trials.test.js` ; suite complète verte (4 771 tests, 461 fichiers).
- Lint : 0 problème sur les fichiers touchés. Build : ok.
- Captures `--play --routes=/agir --trial=8 --trial-factor=late-screen --click="Pas d’écran"`, clair et sombre :
  titre « Pas d’écran après 22 h », jours 1, 4 et 5 lus dans l'écran tard de la démo (lanterne allumée, deux
  éteintes), légende « pas d’écran après 22 h / comme d’habitude », et pour hier soir (pas de journée en cours dans la
  démo) « Nous n’avons pas reçu votre temps d’écran d’hier soir. » / « Hier, pas d’écran après 22 h : c’était tenu ? ».

## Suite proposée
1. Finir la PR (« prête » pour son seul build iPhone) puis merger.
2. 1381.1381 validée → `ios-store-beta-expire.yml`.
3. SPEC § 6.5 : la phrase « Les soirs avec écran après 22 h, vous dormez 40 min de moins » sur la carte, et la piste
   « Écran tard » proposée dans la famille Sommeil quand l'écart des deux moyennes est net.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, le message E.

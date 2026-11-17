# Run 17/11 03:30 — la rencontre de Pilou en thème sombre (POLISH-MEET-DARK)

**Type** : code (polish, premier run après le sprint)  ·  **Android** : main vert (Tests et émulateur A56 de c6b3ff1)
  ·  **TestFlight** : 1107.1107 chez « Testeurs Halcya » (inchangé) ; « iOS — TestFlight » de 9b785e3 réussi
  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions conforme (4fa797bd…). Les quatre fichiers lus en entier. 03:31 heure de Paris.
- Aucune PR « [Auto] » de moins de 90 min. PR ouvertes : #1072 (Studio, sprint), #1045 (UPG-4), #51 (cursor, pas à nous).
- Priorité (1) des instructions : ce que voient les testeurs, d'abord la carte de la rencontre en sombre.

## Fait
- `companion/life/life.tokens.css` : bloc `:root[data-theme='dark']` (ciel du soir assourdi, carte `#1d2a24`, bulles et
  champ `#26332d`, voile sombre). `MeetPilou.css` : texte de la carte et du champ sur `var(--text)`.
- Test `companion/life/lifeTokens.test.js` : contraste ≥ 4,5:1 de l'encre et de l'encre secondaire sur la carte, la
  bulle et le ciel, en clair et en sombre (rouge avant le correctif en sombre : 1,1:1).
- Captures `--routes=/ --meet` en sombre et en clair relues : carte et bulle « Bonjour ! » lisibles en sombre, clair
  inchangé. Le code est partagé : l'iPhone reçoit le correctif par le même merge (aucun correctif iPhone touché).
- captures/main (136e969, de 9b785e3) relues côté iPhone : « vide-accueil » n'est plus blanche, aucune rencontre en
  surimpression (graine `metAt` de `captureMode.js`, corrigée par #1067). Vu : la nuit, « Pilou dort » mais yeux
  ouverts sur l'île → POLISH-PILOU-DORT-YEUX au BACKLOG.

## Vérifications
- Local : `npm run test` vert (TEST EXIT 0), `npm run build` vert, `npm run lint` sans erreur, nouveau test lint propre.
- PR #1079 ouverte à 03:36 ; la build iOS simulateur (≈ 1 h) finit après le budget du run : **non mergée par ce run**,
  le run suivant la merge si tous ses checks sont verts et ses captures iPhone de l'Accueil relues.

## #1072 (Studio, sprint)
- En conflit avec main (`pilou/visage.js`, après #1071). Mise à jour sur main (9462958) : le peintre du Studio et les
  cils des yeux fermés cohabitent ; 302 tests du compagnon verts. Sa CI repart (build iOS ≈ 1 h) : le run suivant la
  merge si tout est vert, après #1079.

## Livraison continue
- « Play — Alpha » du soir pas encore parti à 03:40 (dernier : 16/11 03:24) : s'il part après ce merge, il emporte le
  correctif.

## Suite
- #1072 (Studio : build iPhone), #1045 (UPG-4), POLISH-PILOU-DORT-YEUX, POLISH-FLAKY-DASH, REFONTE-RESTES-SPRINT.

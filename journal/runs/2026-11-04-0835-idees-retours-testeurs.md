# Run du 04/11/2026 08:35 (Paris, CET) — Idées : les retours des testeurs

**Type** : 💡 run « idées » (aucun code produit)

## Constat au démarrage
- Main à `f2abb5b` : Tests, Build & Release, Play — AAB et émulateur verts.
- PR #679 (A11Y-3, run de 07:35) ouverte depuis moins de 90 min, verte : laissée à son run ; ce run ne touche pas ses
  fichiers de code et se remet à jour sur main avant merge.
- Bilan « Play — AAB » du 04/11 06:10 UTC : 100761 en test interne, Alpha « 100721 déployée », vitals illisibles (P43).

## Fait
- Vérifié sur la doc officielle : l'API des avis ne lit que la production, avec texte, sur 7 jours ; les commentaires
  d'un test fermé ne sont lisibles que dans la Play Console ; le rapport de pré-lancement n'a pas d'API (la Reporting
  API ne donne qu'Android vitals).
- `IDEES.md` : I215 (relais des retours par consigne aux jours 4, 8, 11 ; formulaire dans l'app écarté pendant le
  test), I216 (la 2e mise à jour Alpha porte les corrections des testeurs, pour la question 9), I217 (rapport de
  pré-lancement au jour 12).
- `INVITATION-TESTEURS.md` §4 : format de la consigne « RETOURS TESTEURS ».
- `PRODUIT.md` §4 : **P45** (adresse de commentaires de la piste Alpha). `BACKLOG.md` : TEST-RETOURS.

## Vérifications
- `npm run test` (journal seul modifié).

## Suite
- TEST-ALPHA-1 (07–08/11, clic P42) ; TEST-RETOURS à la première consigne de retours ; P37, P43, P44, P45.

# 05/11 03:35 — Livraison continue : un commit de journal reprend la version du test interne (CD-ALPHA-3)

Type : 🔧 run de CI (03:35 Paris). Priorité : retour (1) du 04/11 (livraison continue), CI avant le reste.

## Constat au démarrage
- Aucune PR « [Auto] » ouverte ; main vert (`40926c7`, bilan du run de 02:35). Émulateur de `40926c7` en cours.
- « Play — Alpha » pour `3ec977a` (#704, test interne **100787**) : « en attente » de l'émulateur… qui a été
  **annulé** par le push de `40926c7` (journal seul ; `concurrency` + `cancel-in-progress` sur main). Et `40926c7` n'a
  pas d'AAB : sa décision aurait été « aucun AAB pour ce commit ». **100787 ne serait jamais partie sur l'alpha.**
  Ce cas se reproduit à chaque run qui pousse son bilan après le merge : la livraison continue ratait une version sur deux.

## Fait
- `alphaGate.mjs` : `decideAlpha` reçoit `inherited` ({ versionCode, filesSince } de la version du test interne).
  Sans AAB pour le commit, il reprend cette version si aucun fichier de l'app n'a changé entre son commit et la tête ;
  « Tests » et émulateurs (dont Android 9) doivent réussir sur la tête (même code d'app). Renvoie `versionCode`.
- `alpha-cli.mjs` : retrouve le commit de la version du test interne (`findCommitByCount`), calcule `filesSince`,
  envoie `decision.versionCode`. Vérifié à la main sur le cas réel : 100787 = `3ec977a`, `3ec977a..40926c7` = 2 fichiers
  du journal, aucun de l'app → héritage.
- Le run de `40926c7` utilise encore l'ancien script (workflow_run lance le code du commit) : 100787 ne partira pas,
  mais cette PR change `app/scripts` → « Play — AAB » construit une nouvelle version, qui contient #704 et part sur
  l'alpha (app modifiée depuis 100786).

## Vérifications
- TDD : 5 nouveaux tests rouges puis verts (`alphaGate.test.mjs`, 18) ; `npm run test` 3 057 verts ; build OK ;
  lint 0 erreur ; `npm run visual` OK, capture Analyses relue (aucun écran touché). Pas de Nouveautés (rien de visible).

## Suite
- Bilan Alpha de la version de cette PR au run suivant ; CD-ALPHA-2 (examens qui s'enchaînent).
- ANALYSES-ONGLETS-3 (trois horizons, pistes expliquées).

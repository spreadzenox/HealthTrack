# Run du 18/11 21:30 — outillage de la soumission App Store (R18-SOUMISSION-a)

**Type** : 🛠️ code (outillage, aucun écran de l'app) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main fa5a00f.

## Ce qui a été fait
- État de départ : main vert (Tests, émulateur, fiche App Store), aucune PR « [Auto] » ouverte.
- **R18-SOUMISSION-a** (retours du 18/11, point 1 ; mission PI2, partie 0) :
  - `iphone/scripts/store-submission.mjs` : relevé seul par défaut (versions iOS, version « Prepare for Submission »,
    publication, build attachée, notes pour l'examen comparées à `notes-examen.md`, build demandée) ;
    `--preparer --build <N>` : numéro de la version = `testflight-version.json` (893), build N attachée seulement si
    elle porte la version 893, est VALID, non expirée et validée chez « Testeurs Halcya », notes = texte après le trait
    de `notes-examen.md` (≤ 4 000 caractères, aucune adresse e-mail), `demoAccountRequired` false, `releaseType`
    MANUAL ; `--essai` : plan seul ; relevé après écriture.
  - Garde `submissionClient` : seules ces quatre écritures passent ; `reviewSubmissions`, `reviewSubmissionItems`,
    `subscriptionSubmissions`, `appStoreVersionSubmissions`, expiration de build, suppression : refusées (testé).
  - `iphone/scripts/store-submission.test.mjs` : 9 tests sur réponses d'API synthétiques, verts.
  - Workflow `.github/workflows/ios-store-submission.yml` (« App Store — préparer la soumission ») : manuel, main,
    garde de bascule, environnement `appstore`, mêmes files d'attente que la fiche (`store-push`).
  - `store-beta-expire.mjs` : la 844.344 n'est plus protégée en dur (consigne du 18/11) ; la build attachée à une
    version de l'App Store, lue à chaque passage, reste gardée, et `expire` la refuse aussi. Tant que la 844.344 est
    attachée, rien ne change. Tests mis à jour ; les 7 suites de `iphone/scripts` vertes.
- Pas de build iOS sur la PR (scripts `store-*` exclus du filtre de chemins) : aucun code de l'app touché.

- **#1107 mergée** (bb7117d, squash) : 13 checks verts ; le job émulateur Android 16 bloqué 30 min (coupé) a été
  relancé une fois et est passé.
- **Relevé seul lancé sur main** (« App Store — préparer la soumission », run 44400224159, vert) : versions iOS :
  **844 (PREPARE_FOR_SUBMISSION)** ; publication **MANUAL** ; build attachée **844.344** ; notes pour l'examen
  **3 708 caractères, différentes de `notes-examen.md`** (l'ancien texte d'avant la refonte) ; compte de démonstration
  non requis. Rien n'a été modifié ni soumis. L'outil voit donc bien la version : la préparation (`--preparer --build`)
  attend la build de la refonte choisie.

## État
- TestFlight : **1148.1148** chez « Testeurs Halcya ». Build iPhone du soir (cron 21:20) pas encore partie à 21:40 :
  le cron de GitHub part souvent en retard ; le run suivant vérifie la build et l'envoi TestFlight.
- Parité iPhone : **70 %** (pas de recompte). Testeurs Play : 4 inscrits sur 12 (pas de nouveau relevé).
- Aucune note de Nouveautés (rien de visible dans l'app).

## Suite proposée
1. Relevé fait (ci-dessus).
2. Build iPhone du soir et TestFlight ; soumission bêta et expiration après l'Alpha de 23:45.
3. Le 21/11 ou le 22/11 : `--preparer --build <N>` avec la build de la refonte validée, puis « 👉 PI2 prête ».

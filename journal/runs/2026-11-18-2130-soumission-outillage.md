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

## État
- TestFlight : **1148.1148** chez « Testeurs Halcya ». Build iPhone du soir (cron 21:20) pas encore partie à 21:40 :
  le cron de GitHub part souvent en retard ; le run suivant vérifie la build et l'envoi TestFlight.
- Parité iPhone : **70 %** (pas de recompte). Testeurs Play : 4 inscrits sur 12 (pas de nouveau relevé).
- Aucune note de Nouveautés (rien de visible dans l'app).

## Suite proposée
1. Après le merge : lancer « App Store — préparer la soumission » sur main **sans option** (relevé seul) et noter
   l'état réel de la version 844 (R18-SOUMISSION-b).
2. Build iPhone du soir et TestFlight ; soumission bêta et expiration après l'Alpha de 23:45.
3. Le 21/11 ou le 22/11 : `--preparer --build <N>` avec la build de la refonte validée, puis « 👉 PI2 prête ».

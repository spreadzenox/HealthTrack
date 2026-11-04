# 04/11 20:35 — Livraison continue vers Alpha (retours du propriétaire du 04/11 19:45)

Type : 💡 run « idées » (20 h, Paris) + 🚀 CI (le retour (1) est de la CI, priorité absolue même en run « idées »).

## Constat au démarrage
- main vert (`653e48c`, #693) : Tests, émulateurs (dont Android 9 et 12L), « Play — AAB » (test interne) et « Build &
  Release » réussis. Aucune autre exécution de la routine en cours ; seule PR ouverte : #51 (cursor/*, non touchée).
- Alpha toujours sur 100721 (plantage à l'ouverture sous Android 8–12) ; P42 attendait un clic du propriétaire.
- Clone local superficiel : `git rev-list --count` donnait 50 avant `git fetch --unshallow` (le workflow a
  `fetch-depth: 0`, pas concerné).

## Fait
1. **Version actuelle sur Alpha** : `workflow_dispatch` de « Play — AAB » sur main, piste `alpha` (run 41898124647),
   versionCode **100776** (`653e48c`), même AAB que le test interne (réutilisation). Accepté par GitHub (204) : le
   refus noté le 03/11 (P40/P42) ne s'est pas reproduit. Résultat : voir « Vérifications ».
2. **Workflow « Play — Alpha (livraison continue) »** (`.github/workflows/play-alpha.yml`) : `workflow_run` des
   « Tests », des émulateurs et de « Play — AAB » sur main (push) ; le dernier à finir envoie. Décision pure dans
   `app/scripts/play/alphaGate.mjs` (tests `alphaGate.test.mjs`) : tous verts sur le commit, versionCode > alpha,
   version présente en test interne, au moins un fichier de l'app modifié depuis la version de l'alpha (journal,
   relais, scripts, tests exclus) ; frein `ALPHA_AUTO`. `findCommitByCount` retrouve le commit d'un versionCode malgré
   les anciens merges (vérifié : 100721 → `bd7d5ac`, #637). CLI `alpha-cli.mjs` ; `publishBundle({ reuseOnly })` place
   la version du test interne sur l'alpha sans réimporter d'AAB (2 tests). Jamais la production.
3. **Retours du 04/11** rangés : `PRODUIT.md` §1 (encadré) et §4 (P42 retirée), `BACKLOG.md` (CD-ALPHA-1/2,
   AVIS-RELAIS, VENTRE-BE-1, ANALYSES-ONGLETS, BE-BIAIS, BE-HISTO-DETAIL, SELLES-PHOTO).
4. **Études (`IDEES.md` I218–I220)** : livraison continue et risque d'examens remplacés ; « Votre avis » par le relais
   en 4 étapes (route, formulaire, résumé anonyme quotidien, avis du Play Store) ; modèle ventre / bien-être (deux
   mesures, ventre comme auto-déclaration à poids faible du bien-être, sous-onglets et trois horizons) avec une
   question au propriétaire.
5. **`POUR-IOS.md`** : « Décision du propriétaire (04/11 19:30) » (prix, disponibilité, Content Rights) et retours (1)
   et (2) du 04/11 19:45.

## Vérifications
- **Envoi Alpha réussi** (run 41898124647, 19:33–~20:00 UTC) : « versionCode 100776 déjà envoyé : la même version est
  placée sur la piste alpha » ; « Validée » (envoyée pour examen, pas de changesNotSentForReview). État des pistes :
  Test interne 100776 déployée, **Test fermé (Alpha) 100776 déployée** (l'API ne dit pas si l'examen est fini).
- `npm run test` (3 033 verts, 44 ignorés), `npm run lint` (0 erreur), `npm run build`, `npm run visual` (toutes les
  pages ok ; aucun écran touché : seuls des scripts de CI et le journal changent).

## Suite
- Bilan du prochain run : 100776 sur Alpha (tableau « État des pistes ») ; premier déclenchement de « Play — Alpha »
  au prochain merge qui touche l'app (ce merge-ci ne touche que la CI et le journal : décision « pas d'envoi » attendue).
- Prochain run de code : VENTRE-BE-1 (étiquettes « Ventre » / « Bien-être » sur chaque piste), puis AVIS-RELAIS-1.

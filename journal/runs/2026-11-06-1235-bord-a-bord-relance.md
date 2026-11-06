# 06/11 12:35 — Émulateur « Bord à bord » : relancer l'app avant de conclure (EDGE-FLAKE)

Type : 🧰 run CI (main rouge sur un job d'émulateur).

## Constat au démarrage
- main `cb3ee5d` (#753) : Build & Release, Tests, Play — AAB verts ; **« Test — émulateur Samsung Galaxy A56 » rouge**,
  job « Bord à bord sous Android 14 (API 34) » : « encarts au repos : haut undefined px, bas undefined px (lecture ?/5) ».
  Les logs natifs `HalcyaInsets` du même job donnent pourtant `status top=128`, `nav bottom=63` : l'app est juste,
  c'est la lecture par le protocole DevTools de la WebView qui n'a rien rendu.
- Conséquence : la livraison continue vers Alpha ne part pas sur un commit dont les émulateurs sont rouges (run
  « Play — Alpha » de 11:02 UTC `skipped`). Sans nouveau commit vert, le créneau de ~16:30 UTC n'aurait rien envoyé.
- Historique du job : **9 échecs sur environ 35 exécutions depuis le 27/10**, tous sur ce seul contrôle, de trois
  formes : « WebView inaccessible » (05/11 15:38 et 17:05), « undefined px » (03/11 15:08, 06/11 10:59), « 0 px » sur les
  5 lectures (01/11 18:05, 03/11 19:35). Le durcissement POL-PLAY-77 (5 lectures en ≈ 15 s) ne suffit pas.
- Aucune PR « [Auto] » ouverte.

## Fait (EDGE-FLAKE)
- `.github/scripts/edge-insets/check.mjs` : le lancement à froid et la lecture des encarts passent dans
  `launchAndRead()`, répétée **jusqu'à 3 lancements** (arrêt forcé, logcat vidé, relance, reconnexion DevTools) tant que
  la lecture n'est pas bonne. Le job passe dès qu'un lancement lit des encarts valides ; une vraie régression (0 px à
  chaque lancement) reste rouge. Le résumé du job liste les lancements (« 1 : haut undefined px… ; 2 : haut 24 px… »)
  et dit « lancement n/3, lecture n/5 ». Captures nommées par lancement.
- Aucun code de l'app modifié : pas de note de Nouveautés.

## Vérifications
- `node --check` sur le script : OK. Le script ne tourne que sur l'émulateur de la CI : la preuve est le job API 34 de
  cette PR et des prochains commits de main.
- `npm run test` (app) : voir la PR ; code de l'app inchangé, donc `build` et `visual` inchangés.

## Suite
- Si « Bord à bord » échoue encore : lire la ligne « lancements » du résumé. Trois lancements inaccessibles = souci de
  l'émulateur (envisager `-gpu host` ou une image `google_apis_playstore`) ; trois lectures à 0 px = vraie régression.
- CD-ALPHA-6 vers 16:30 UTC sur le commit vert de cette PR ; fin de la période de lancement iPhone ce soir 23:00 UTC ;
  TEST-ALPHA-1 (07–08/11) ; INSTALLS-21c-2 (08–09/11) ; GOLD-a3-2 dès P37.

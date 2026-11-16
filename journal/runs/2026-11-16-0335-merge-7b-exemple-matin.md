# Run 16/11 03:35 — 7b mergée (#1029) ; exemple de la visite au petit matin (REFONTE-7b-2, point 1)

**Type** : run de code (Android et iPhone, code partagé)  ·  **Android** : main 40bb25d (#1029), « Build & Release »
vert, release **v750** (APK 34,6 Mo, 16/11 02:34 UTC), « Play — fiche du Store » vert, « Play — AAB » et émulateurs
en cours à la fin du run ; envoi Alpha de la nuit **parti à 02:24 UTC** (« Play — Alpha », vert, sur c8d0059 : 6d
comprise)  ·  **TestFlight** : « iOS — TestFlight » vert sur 40bb25d (build de 7b envoyée) ; pas de relevé App Store
Connect à ce run  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions conforme (69177875…). Lus en entier : les quatre fichiers d'instructions, les comptes
  rendus de 23:35, 00:30, 01:30 et 02:30 ; le résumé S47. Brief et documents iPhone non relus (run de fin de PR et
  petit correctif sans changement d'écran).
- Main vert. PR de la routine ouverte : **#1029** (7b), 14 checks verts, build iOS comprise, à jour sur main. #51
  (cursor) pas touchée.

## Fait
1. **#1029 mergée à 03:32 (squash, 40bb25d)**. Captures iPhone regardées sur `captures/pr-1029` (iPhone 16e) :
   `tendances` clair, sombre, vide et grand texte (onglets Tendances · Nutrition, courbe et « Touchez un jour pour
   son détail », état vide propre), `nutrition` (lien « Tous vos repas ») et `food` (onglet Nutrition actif, bandeau
   système d'Apple sans rapport). Côté Android, captures regardées par le run de 01:30.
2. **REFONTE-7b-2 (1)** : vers 1 h 30, l'exemple de la visite montrait les deux repas d'hier recopiés sur aujourd'hui
   à la même minute (et la note, la digestion avec). Reproduit : à 1 h 30 et 9 h 30, quatre saisies à « il y a
   10 min ». Correctif dans `tourData.js` (`pullBeforeNow`) : ce qui tomberait plus tard aujourd'hui est ramené avant
   maintenant dans son ordre, 15 min d'écart, la dernière 10 min avant maintenant, jamais avant minuit. Test (TDD,
   rouge puis vert) à 0 h 20, 1 h 30, 9 h 30 et 14 h 30 : repas à des heures distinctes, rien dans le futur ni
   avant minuit, la note du soir reste la dernière saisie du jour.
3. Nouveautés : « Exemple de la visite au petit matin » (correctif).

## Données (objectif du 15/11)
Données fictives de la visite seulement (jamais écrites en base) : rien à migrer, export et import intacts.

## Vérifs
- Suite complète verte (316 fichiers, 3 720 tests), build, ESLint sans erreur sur les fichiers touchés.
- iPhone : aucun des 51 correctifs ne touche `tourData.js` ; la build de la PR le confirmera.
- Capture : le banc visuel enchaîne mal deux `--click` (« Voir un exemple » puis « Exemple au jour 14 ») ; l'écran
  d'exemple n'a pas pu être capturé ici. Le test unitaire couvre le correctif ; capture à faire avec REFONTE-7b-2 (3).

## Suite
- Merger la PR de ce run quand ses checks sont verts, build iOS comprise.
- REFONTE-7b-2 (2) (chargement plutôt qu'état vide avant l'exemple) et (3) (capture de la visite), puis REFONTE-7c
  (retrait du code du Journal), puis Nunito.
- Relever « Play — AAB », émulateurs et build iOS de 40bb25d, et la build TestFlight chez les testeurs externes.

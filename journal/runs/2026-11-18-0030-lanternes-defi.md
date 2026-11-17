# Run 18/11 00:30 — LANT-1 : les lanternes du défi (Actions toujours bloqué)

**Type** : code (priorités a et b impossibles tant que les Actions sont bloquées : tâche indépendante)  ·  **Android** :
main vert sur 0bc5c27 ; **GitHub Actions toujours bloqué** (facturation du compte, P50)  ·  **TestFlight** : inchangé
chez « Testeurs Halcya » (1148.1148)  ·  **Parité** : 70 % (33/47), inchangée (code partagé, aucun correctif
`iphone/patches/` ne touche `trials`, `Trial.jsx` ni `Act.css`)

## Contexte
- Empreinte des instructions conforme (4fa797bd…), les quatre fichiers lus en entier. 00:30 heure de Paris : run de code.
- PR ouvertes de la routine : #1090 (MONDE-4a), #1091 (journaux 19:30 et 20:30, mission P50, découpage LANT), #1092
  (MONDE-4b, empilée sur #1090), #1093 (image fixe, empilée sur #1092) ; #51 (cursor) : pas à nous.
- **Sonde** : relance des jobs échoués de « Tests » de #1093 (run 44192392120, tentative 2) à 23:31 UTC : refusée aussitôt,
  « The job was not started because your account is locked due to a billing issue ». Aucun merge possible. L'envoi
  Alpha de 23:45 n'a pas pu partir (le cron est un workflow), ni la build TestFlight, ni la soumission bêta.
- Pour ne pas empiler une quatrième PR sur l'îlot, LANT-1 part d'origin/main sur sa propre branche : seuls les fichiers
  du journal peuvent entrer en conflit avec #1091 à #1093.

## Fait (branche `claude/lant-1-lanternes`)
- Tests rouges d'abord : `trials.test.js` (5 jours avec, 2 tenus, 1 pas tenu, 2 à venir → `lit, lit, out, pending,
  pending` ; ancien essai de 14 jours → 7 lanternes, tenue inconnue → en attente) et `Trial.test.jsx` (5 lanternes,
  classes et noms accessibles « 1 novembre : tenu », « 3 novembre : pas tenu »).
- `services/trials.js` : `lanterns(status)`, pure, une entrée par jour « avec » dans l'ordre du calendrier.
- `components/TrialLanterns.jsx` : SVG, liste « Lanternes des jours avec » ; allumée = ambre de Pilou (`--accent-amber`,
  graphique seulement) avec un halo qui respire ±8 % sur 2,6 s (fixe si mouvements réduits) ; éteinte = remplie de la
  couleur de piste du thème ; à venir = contour pointillé.
- `pages/Trial.jsx` : les lanternes au-dessus de « 2 jours avec tenus sur 5 », dans la carte du jour. Textes inchangés
  (« Un jour manqué n'annule rien : l'essai continue. » reste : il dit déjà ce que proposait le découpage).
- Nouveautés : `2026-11-18-0030-lanternes-defi.json`.

## Vérifications
- `npm run test` : **4 042 verts** (44 ignorés) ; `npm run build` ; eslint des fichiers touchés propre.
- `npm run visual -- --play --routes=/agir --trial=8 --click="Dormir au moins"`, en clair puis `--dark` : sans erreur JS,
  captures relues (2 allumées, 2 éteintes, 1 à venir ; lisibles sur le fond nuit du thème sommeil dans les deux thèmes).
- Checks de la PR : impossibles tant que les Actions sont bloquées. **Pas mergée.**

## Suite
- Dès « P50 fait » : #1090, puis #1092, #1093, #1091 (voir le run de 23:30), puis cette PR (conflit attendu sur la ligne
  du tableau du résumé : garder toutes les lignes). Captures iPhone de la page du défi à relire sur `captures/pr-N`.
- Ensuite LANT-2 : Pilou sur la page du défi et au bilan (il salue l'effort, même bulle quel que soit le résultat).

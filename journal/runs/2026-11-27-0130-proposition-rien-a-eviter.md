# Run 27/11 01:30 — Proposition « Rien à éviter » (PROP-SIM-20)

**Type** : 📓 (journal et maquette, aucun code produit) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) ·
**Android** : main 3a8b9a6 (#1299) vert (Tests, Build & Release, Play — AAB, émulateur A56) · **TestFlight** : 1335.1335
chez « Testeurs Halcya » ; build iPhone du soir (cron de 21:20 Paris) et Alpha de 23:45 pas encore partis à 01:30
(dernières exécutions programmées : 26/11 02:52 et 04:25 UTC ; retard habituel de GitHub) · **Parité** : 70 % (33/47),
inchangée

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). Pas de nouvelle réponse du propriétaire.
- Restes du passage des personas du 26/11 20:30 : tous soldés sauf « Rien à éviter » au-dessus de « Fructanes
  −1,2 pt », que la synthèse range en proposition avec maquette (3ᵉ fois chez « Ventre, sans technique »).

## Fait
- **PROP-SIM-20, maquette** : `journal/maquettes/rien-a-eviter/` (`maquette.html`, `render.mjs`, 5 captures, README).
  Captures relues (clair, sombre, détail ouvert). Option A (recommandée) : « Rien de sûr pour l'instant. Le plus
  marqué : les fructanes (blé, oignon, ail), avec un peu plus de gêne, mais ça peut encore venir du hasard », carte
  « En avoir le cœur net » vers la réintroduction guidée du groupe (test d'une dizaine de jours, premium comme
  aujourd'hui), tableau en mots (« un peu moins bien, pas sûr », « presque pareil ») au lieu des « pt ». Option B :
  le verdict « Rien de sûr » seul. Solde aussi le reste de POLISH-SIM-173.
- Pourquoi pas codé directement : nommer un facteur pas encore net touche à l'honnêteté statistique (« faux
  suspects ») ; c'est au propriétaire de trancher. Le verdict seul (B) aurait pu passer en polish, mais il coûte un
  build iPhone pour une demi-réponse : mieux vaut un seul build pour A ou B après sa réponse (CI économe).
- BACKLOG (PROP-SIM-20, « À étudier » du passage barré), PRODUIT.md § 5, résumé de la semaine.

## Vérifications
- Journal seulement : les tests de la PR doivent passer (garde-fou des runs sans code). Aucun build de Mac.

## Suite proposée
1. Run suivant : build iPhone du soir et TestFlight partis ? Soumission bêta de la build du soir au premier run qui
   la voit traitée par Apple, puis expiration des anciennes (sauf 1244.1244 de la version 893). Alpha du 26/11.
2. Run « idées » de 08:00 : passage des personas (les deux moins jouées).
3. À la réponse « PROP-SIM-20 A » ou « B » : un run de code, tests d'abord (`Recommendations.test.jsx`).

## Pour le propriétaire
Nouveau : PROP-SIM-20 à trancher (« A », « B » ou « non »). Le reste inchangé : recruter des testeurs (4 sur 12),
PI2, P51 ; le 29 ou le 30/11, le message E.

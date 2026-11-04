# 04/11 21:35 — Chaque piste dit « Ventre » ou « Bien-être » (VENTRE-BE-1, retour (3) du 04/11)

Type : 🎨 run de code (22:35 Paris).

## Constat au démarrage
- main vert (`4226c49`, #694) : Tests, émulateur, « Play — AAB » (test interne 100777) et « Build & Release » réussis.
- **Livraison continue** : premier passage de « Play — Alpha (livraison continue) » sur `4226c49` : deux runs
  « en attente » (émulateur encore en cours), puis le troisième conclut **« pas d'envoi »** (rien ne change dans l'app
  depuis 100776). Conforme à l'attendu. Alpha : 100776 (envoyée pour examen le 04/11 ~20:00 UTC ; l'API ne dit pas
  si l'examen est fini).
- Aucune autre PR « [Auto] » ouverte ; seule #51 (cursor/*, non touchée).

## Fait
- `components/DomainTag.jsx` (+ CSS, chargé d'emblée via `pageStyles.js`, garde-fou `bundleGuard`) : une ligne
  d'en-tête « ● Ventre » (pêche, `--peach-label`) ou « ● Bien-être » (menthe, `--mint-label`) au-dessus du titre de
  chaque piste. Une ligne d'en-tête plutôt qu'un badge : les badges « Piste solide » / « À confirmer » utilisent
  déjà menthe et pêche, deux pastilles côte à côte se seraient confondues.
- Placée sur les pistes repas → ventre (`GutLinks`), les pistes à tester et tous les liens repérés (notes et visage)
  d'Analyses. « Pistes à tester » : « Ce qui va avec vos meilleurs jours de bien-être. »
- Tests : `DomainTag.test.jsx` (2), `GutLinks.test.jsx` (+1), `Recommendations.test.jsx` (2 assertions).
- Nouveautés : `2026-11-04-2135-pistes-ventre-bien-etre.json`.

## Vérifications
- `npm run test` : tout vert après ajout du CSS à `pageStyles.js` (le garde-fou de découpage l'avait signalé).
- `npm run lint` : 0 erreur. `npm run build` : ok.
- `npm run visual` : toutes les pages ok ; `/recommendations --gut-links` regardé en clair et en sombre : étiquettes
  lisibles, distinctes des badges, aucun débordement.

## Après le merge (#695, `5d403aa`)
- Tests, Build & Release (**v496**, APK 34 538 419 octets), Play — AAB (test interne **100778**) et émulateur verts.
- **Premier envoi automatique sur Alpha réussi** (« Play — Alpha », run 41912610888) : deux passages « en attente »
  (émulateur en cours), puis « envoi (6 fichiers de l'app modifiés depuis 100776) » → **100778 placé sur l'alpha**
  (même AAB que le test interne). Google l'examine. 100776 était peut-être encore en examen : si les examens
  s'enchaînent sans aboutir, espacer les envois (consigne du 04/11), à surveiller au prochain bilan.

## Suite
- VENTRE-BE-1 étape 2 attend « I220 oui / non » du propriétaire. Prochain run de code : AVIS-RELAIS-1 (route
  `POST /v1/feedback` du relais) ou ANALYSES-ONGLETS (sous-onglets Bien-être / Ventre / FODMAP / Tendances).

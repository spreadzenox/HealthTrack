# Run 25/11 18:30 — Les lanternes du bilan (LANT-2b)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 185fadb, release
**v920** · **TestFlight** : 1313.1313 chez « Testeurs Halcya » (examen bêta depuis le 25/11 04:31 UTC) ; build du
soir à 21:20 · **Parité** : 70 % (33/47), inchangée

## État de départ
- main 185fadb vert (Tests, émulateur ; Build & Release et Play — AAB de 66fff4e verts).
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas à la routine). Pas de réponse du propriétaire à LANT-4,
  aux courbes ni à PROP-SIM-19 : ce run prend un reste de la SPEC qui ne dépend d'aucune de ces réponses.

## Fait
- **LANT-2b** (SPEC `comprendre` § 6.5 « soir manqué » et § 7 « bilan », laissés par LANT-2) :
  - au bilan d'un essai, les lanternes et « Consigne tenue N jours sur M prévus » restent dans la carte du résultat,
    sous Pilou et avant le titre du bilan (elles disparaissaient avec la carte du jour) ;
  - le lendemain d'un jour « avec » pas tenu, Pilou hausse les épaules en souriant (`move: 'shrug'`, déjà dans
    `PilouFigure.css`) et dit « Pas grave : la prochaine lanterne vous attend. » ; le saut de « Commencer » passe avant.
  - Tests d'abord (rouges puis verts) : `trials.test.js` (1), `Trial.test.jsx` (2).
- Note de Nouveautés `2026-11-25-1830-lanternes-du-bilan.json` (les deux variantes : code partagé).
- PARITE, BACKLOG, PRODUIT et résumé à jour.

## Vérifications
- `npm run test` : 4 685 tests verts (456 fichiers) ; `npm run lint` : 0 erreur (comme avant) ; `npm run build` vert.
- Captures relues : `--play --routes=/agir --trial=12` en clair et en sombre (bilan : 5 lanternes, « Consigne tenue
  2 jours sur 5 prévus », puis « Pas de différence nette ») ; `--trial=5 --trial-factor=habit` (Pilou « Pas grave : la
  prochaine lanterne vous attend. », lanterne du jour 4 éteinte). Copies : `captures/2026-11-25-1830-bilan-lanternes.png`,
  `captures/2026-11-25-1830-jour-manque.png`.

## Suite proposée
1. Merger la PR après le build iPhone (un seul, PR ouverte en brouillon puis prête) et la relecture des captures de la
   page d'un essai sur iPhone, si le banc les filme.
2. Build du soir et TestFlight (21:20), soumission bêta au premier run qui voit la build traitée ; IOS-SANTE-FLAKY.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51. Réponses attendues : « rituel 2D / 3D / pas de
rituel », « go courbes / go phases / non », PROP-SIM-19.

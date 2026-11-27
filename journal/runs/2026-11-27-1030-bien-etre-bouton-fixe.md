# Run 27/11 10:30 — Note de bien-être : « Enregistrer » à place fixe

**Type** : 🔧 (polish, code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
0bb6a7c (#1308) vert (Tests, Build & Release, Play — AAB ; émulateur A56 en cours au départ) · **TestFlight** :
1362.1362 chez « Testeurs Halcya » (inchangé) · **Parité** : 70 % (33/47), inchangée

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). main vert. Pas de nouvelle réponse du
  propriétaire. Rien à soumettre ni à expirer chez Apple (build du soir à 21:20).

## Fait
- **POLISH-SIM-178** (reste du passage des personas de 08:30, « Stressé et pressé » J1) : la fenêtre « Comment vous
  sentez-vous ? » (`WellbeingPrompt.jsx`) était centrée ; au choix de la note, le miroir de Pilou et les précisions
  s'ouvraient et « Enregistrer » descendait d'environ 200 px sous le doigt. Vérifié en capture avant correctif.
- `App.css` : `.wellbeing-modal-backdrop` pose la fenêtre en bas (`align-items: flex-end`, comme les feuilles de Ma
  journée) ; elle grandit vers le haut, les boutons ne bougent plus. `.wellbeing-modal-actions` reste collé en bas
  (`position: sticky`, fond de la fenêtre) si la fenêtre défile (petit écran, police agrandie).
- Test d'abord : `components/wellbeingSheetAnchor.test.js` (rouge, puis vert), dans le style de
  `wellbeingNoteContrast.test.js`.
- Note de Nouveautés `2026-11-27-1030-bien-etre-bouton-fixe.json` ; BACKLOG, PRODUIT § 5, PARITE, résumé.

## Vérifications
- `npm run test` vert ; `npm run lint` sans erreur ; `npm run build` vert.
- Captures `--routes=/ --click="Bien-être"` puis `--click="Bien-être > Note 2 sur 5"`, clair et sombre, relues :
  « Enregistrer » est à la même hauteur (y ≈ 1700 sur 1830) avant et après le choix de la note ; la fenêtre monte
  sur l'îlot. `captures/2026-11-27-1030-bien-etre-bouton-fixe-{avant-note,clair,dark}.png`.
- iPhone : aucun correctif `iphone/patches/` sur `App.css` ; code partagé seulement ; un build iOS pour la PR.

## Suite proposée
1. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; soumission bêta de la build du soir au premier run
   qui la voit traitée, expiration des anciennes.
2. Run « idées » de 20:00 : nouveau passage des personas.

## Pour le propriétaire
Rien de nouveau à faire. Toujours : recruter des testeurs (4 sur 12), PI2, P51 ; le 29 ou le 30/11, le message E.

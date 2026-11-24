# Run 24/11 21:30 — le détail d'un jour parle aussi du ventre (POLISH-SIM-161, 160)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 1cf5526 (#1245) vert
(Tests, émulateur A56, Build & Release) · **TestFlight** : 1290.1290 chez « Testeurs Halcya » (build du soir pas encore
partie, cron en retard) · **Parité** : 70 % (33/47), inchangée (code commun, part sur les deux)

## État de départ
Aucune PR de la routine ouverte (#51 `cursor/*` pas touchée). main vert.

## Fait
- **POLISH-SIM-161** (persona « Ventre et données », J45) : dans Tendances, avec Bien-être et Confort digestif
  affichés, « Ce qui a pu jouer ce jour-là » ne parlait que du bien-être. `Trends.jsx` rend maintenant une entrée par
  note affichée (`weighs`, dans l'ordre des courbes) ; `TrendsDayDetail` montre un sous-bloc par note, chacun sous
  « Sur votre … , en points sur 5. », même quand il n'a qu'une phrase (« Rien de marquant… »). Une seule note : rien
  ne change. Les anciennes props (`contributions`, `outcome`, `value`) restent acceptées.
- **POLISH-SIM-160** (« Tout mesurer », J14) : Objectifs › famille sans barres disait « 2 facteurs comparés » sans les
  nommer. `familyDetail` rend `names` (une fois chacun) ; la page écrit « … dans cette famille : sommeil et écran tard
  le soir. »
- Note de Nouveautés commune (Android et iPhone) : `2026-11-24-2130-jour-ventre-et-facteurs.json`.

## Vérifications
- Tests d'abord : `Trends.test.jsx` (les deux notes dans le détail), `TrendsDayDetail.test.jsx` (deux sous-blocs ;
  une note sans contribution n'en montre qu'un), `influenceFamilies.test.js` (`names`), `Recommendations.test.jsx`
  (phrase nommée). Suite complète : 4 647 tests verts ; lint sans erreur ; build OK.
- `npm run visual -- --routes=/tendances --onboarding=gut --click="Ajouter une mesure > Confort digestif > lundi 23
  novembre"` : deux courbes, détail du 23/11 lisible. Les données de démo n'ont pas de contribution « confort
  digestif » ce jour-là : le bloc n'y montre que le bien-être (cas couvert par le test « une seule note calculée »).
- Build iPhone sur simulateur : sur la PR (un seul).

## Suite proposée
1. Merger la PR au run suivant, après le build iPhone et la relecture des captures de Tendances.
2. POLISH-SIM-158 (« Pas » grisé dans « + ») et 159 (essai : deux totaux), groupées en une PR.
3. Soumission bêta de la build du soir au premier run qui la voit traitée par Apple.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

# Run 25/11 05:30 — POLISH-CONTRASTE-FOCUS : bouton secondaire touché lisible ; TestFlight 1313.1313 en examen bêta

**Type** : 🔧 (code partagé, CSS) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
d50e4f5 (#1253), release v913 · **TestFlight** : **1313.1313** (build du soir, main 0fe8f23) ajoutée à « Testeurs
Halcya » et soumise à l'examen bêta · **Parité** : 70 % (33/47), inchangée

## État de départ
- Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, pas à la routine). main d50e4f5 : Tests et émulateur verts ;
  v913 : Build & Release, Play — AAB, émulateur verts.
- Crons du soir partis cette nuit : build iPhone de main (03:35 → 04:30 UTC, vert) et TestFlight (03:33 UTC, vert).
  Alpha de 23:45 pas vue à 04:30 UTC (le cron part 2 à 4 h en retard ; pas lancée à la main, interdit).

## TestFlight du soir
- `ios-store-beta-submit.yml` (run 45547313339) : « Build 1313.1313 (traitée par Apple). Ajoutée au groupe externe
  « Testeurs Halcya ». Soumise à l'examen bêta d'Apple. »
- `ios-store-beta-expire.yml` avec nettoyage (run 45548139786) : voir « Après » ci-dessous.

## POLISH-CONTRASTE-FOCUS
- Signalé au run de 03:30 par la vérification visuelle : « Télécharger en CSV 3,98:1 » en clair une fois le bouton
  touché. Cause : après un toucher, le bouton reste survolé ; `.btn-secondary:hover` teinte le fond de la marque à 12 %
  et garde le texte vert de la marque (#0b7a5e sur fond mêlé : 3,98:1).
- Correctif (`App.css`) : au survol, le texte passe à `--accent-dim` (#0b6b53 en clair : 4,86:1 ; #5ee0b5 en sombre :
  7,63:1). Une règle commune : tous les boutons secondaires de l'app en profitent.
- Test d'abord (`theme/tokens.test.js`, rouge à 3,98 puis vert) : lit la règle d'`App.css`, calcule le fond mêlé et
  exige 4,5:1 dans les deux thèmes. Suite complète 4 664 tests verts, build, lint du fichier touché.
- Captures `/data` après le clic sur « Télécharger en CSV », clair et sombre, relues : plus d'alerte de contraste,
  texte du bouton lisible, rien d'autre ne bouge.
- Pas de note de Nouveautés : nuance de couleur d'un bouton touché, rien que l'utilisateur ait à apprendre.
- Les autres fonds teintés à 12-15 % (onglets, suggestions du repas, Sources) ne sont pas signalés par la vérification
  visuelle : rien changé.

## Après
- PR en brouillon puis prête : un build iPhone de PR (capture `/data`), merge au run suivant.

## Suite proposée
1. Merge au run suivant après le build iPhone de la PR (capture `/data` côté iPhone).
2. Vérifier l'Alpha du 24/11 au soir.
3. Run « idées » de 08:30 : maquette « cœur et oxygène de la montre dans Tendances ».

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

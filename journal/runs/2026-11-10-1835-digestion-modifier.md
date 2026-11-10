# Run 10/11 18:35 — Journal : modifier une note de digestion (POLISH-SIM-36b)

**Type** : code (mode polish).

## Contexte
- Main vert (fa6cf29, v654). Aucune PR « [Auto] » ouverte, aucun « Build & Release » en cours.
- Constat de persona (BACKLOG POLISH-SIM-36b) : le « … » d'une note de digestion n'offrait que « Supprimer » ;
  pour corriger un niveau, il fallait supprimer puis ressaisir (et perdre l'heure).

## Fait
- `DailyJournal.jsx` : « Modifier » dans le « … » d'une note digestive saisie dans l'app. Il ouvre sur place la même
  rangée Calme / Gêne / Douleur que la carte ventre d'Aujourd'hui (mêmes classes, même mise en page à grande police),
  niveau actuel enfoncé, et « Annuler ». Le choix met à jour la note (`updateEntry`) en gardant le reste du payload
  (heure, portée `day` du bilan du soir) ; même niveau = rien écrit. Les notes importées restent sans action.
- Tests (rouge puis vert) dans `Journal.test.jsx` : modification avec payload gardé, « Annuler » n'écrit rien.
- Captures : [clair](captures/2026-11-10-1835-digestion-modifier-clair.png) ·
  [sombre](captures/2026-11-10-1835-digestion-modifier-sombre.png).

## Vérifs
- `npm run test` vert (3 381) ; `npm run lint` 0 erreur ; `npm run build` OK ; `npm run visual` (voir la PR).

## Reste
- POLISH-SIM-36b, 2e partie possible : ouvrir Tendances sur le jour touché (paramètre de date).
- POLISH-SIM-31, 32, 34, 35, 37 ; PROP-SIM-10 (maquette au prochain run « idées », 20:00).

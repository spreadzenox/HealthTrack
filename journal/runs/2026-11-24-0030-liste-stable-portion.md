# Run 24/11 00:30 — POLISH-SIM-152 et 153 (habitudes sur place, portion à 5 kg)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 25e5cdf (#1225),
dernière release v892 · **TestFlight** : 1268.1268 validée pour « Testeurs Halcya » (relevé du 23/11 07:33 UTC),
1244.1244 attachée à la version 893 ; `ios-testflight.yml` du soir pas encore parti à 23:35 UTC · **Parité** : 70 %
(33/47), 2 correctifs iPhone restent (01, 27)

## État de départ
- main vert sur 25e5cdf (#1225) : Tests et émulateur verts ; Build & Release v892 vert.
- Aucune PR de la routine ouverte. #51 (`cursor/*`) pas touchée.

## POLISH-SIM-152 — Ma journée : la liste ne remonte plus sous le doigt
- Constat (J1) : répondre « Non » à Méditation faisait partir la ligne après 700 ms, la liste remontait, le toucher
  suivant validait « Café » au lieu d'« Étirements ».
- `DayChecklist.jsx` : une habitude répondue reste à sa place, en état « Noté » (classe `is-answered`, un peu
  effacée), tant qu'une autre habitude reste à répondre ; la dernière réponse les range toutes ensemble avec le
  glissé habituel. Repas, bien-être et digestion ne changent pas. L'effet passe en `useLayoutEffect` : la ligne
  répondue ne disparaît plus le temps d'une image avant de revenir. Les minuteries de sortie ne s'annulent plus entre
  deux réponses rapprochées (avant, une ligne pouvait rester bloquée en « Noté »).
- Tests d'abord (`DayChecklist.test.jsx`) : la ligne reste en place après 1 s, sans boutons, avant la suivante ; la
  dernière réponse range les deux. Rouges puis verts.

## POLISH-SIM-153 — Portion invraisemblable
- `MealEditor.jsx` : au-delà de 2 000 g pour un aliment, « 5 kg, c’est bien ça ? » sous la ligne (texte de statut),
  sans rien bloquer. Un seul plafond pour tous les aliments (une table par aliment serait du travail sans preuve de
  besoin ; à revoir si un vrai cas de boisson dépasse 2 L).
- Test d'abord (`MealEditor.test.jsx`) : 5 000 g → « 5 kg », 2 500 g → « 2,5 kg », 1 500 g → rien.

## Captures et vérifications
- `npm run visual -- --routes=/ma-journee,/food --now=12:00` : Ma journée et Repas sans changement de mise en page,
  aucune erreur JS. Les données de démo n'ont pas d'habitude suivie : l'état « Noté » en attente et la question des
  5 kg sont couverts par les tests.
- Tests 4 484 verts, build vert, lint sans erreur (0 avant, 0 après).

## iPhone
- Aucun correctif de `iphone/patches/` ne touche ces fichiers (01 et 27 vérifiés) : rien à refaire. Parité : le code
  partagé part tel quel ; la PR lance le build simulateur une fois prête.

## Suite
1. Run suivant : captures `captures/pr-<N>` (Ma journée, repas) relues, puis merge si tout est vert.
2. Build du soir traitée par Apple → `ios-store-beta-submit.yml`, puis `ios-store-beta-expire.yml` ; noter l'Alpha.
3. POLISH-SIM-154 (Pilou coupé derrière la carte de Tendances).

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

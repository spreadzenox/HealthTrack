# 06/11 07:35 — « Sur quelques semaines » : repère du milieu en trait plein (WEEKS-MIDLINE)

Type : 🎨 run de code (07:35 Paris). Priorités 02/11 et 04/11 traitées ou en attente (Alpha 100811 en examen, porte
de 24 h jusque vers 16:04 UTC ; invitation au plus tôt aujourd'hui, `until` = 30/11 tant que J = 06/11).

## Constat au démarrage
- main `1e39212` : Tests, Build & Release, émulateur A56, Play — AAB, Play — Alpha verts. Aucune PR « [Auto] » ouverte.
- « Votre avis — résumé » : pas encore de passage planifié aujourd'hui (le cron de 05:47 UTC part souvent en retard) ;
  rien à reporter dans `AVIS.md`.

## Fait
- Revue C1 sur **données de démo** (`--play`, 360 × 780) des onglets récents d'Analyses (Bien-être, Ventre) et de
  l'historique du bien-être. Rien de cassé. Un défaut retenu : le graphique « Sur quelques semaines » marquait le
  milieu de l'échelle (2,5 / 5) d'un **pointillé**, sans légende, alors que l'historique du bien-être réserve le
  pointillé à la **moyenne** (légende « -- moyenne ») et trace le 2,5 en trait plein. Corrigé : trait plein
  `var(--chart-bar-2)`, la couleur des repères de l'historique (`Horizon.css`).
- Test `src/components/wellbeingWeeksMidline.test.js` (vu en échec avant le correctif).
- Nouveautés `2026-11-06-0735-semaines-repere.json`.
- Notés sans y toucher : « Rapport PDF pour mon médecin » (titre à la 1re personne, texte au vouvoiement) : libellé
  de bouton assumé depuis N6b, laissé tel quel.

## Vérifications
- `npm run test` 3 187 verts ; build OK ; lint 0 erreur ; `npm run visual -- --play --routes=/recommendations` en
  clair et en sombre, graphique relu dans les deux thèmes ; `/recommendations/ventre` et `/bien-etre` relus en clair.

## Suite
- CD-ALPHA-6 vers 16:30 ; `until` à redécaler si l'invitation part après le 06/11 ; GOLD-a3-2 dès P37 ;
  TEST-ALPHA-1 (07–08/11) ; chantier montre (relevés du propriétaire).

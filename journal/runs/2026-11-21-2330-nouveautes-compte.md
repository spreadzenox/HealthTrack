# Run du 21/11 23:30 — Bandeau Nouveautés sans compte à rallonge (POLISH-SIM-135)

**Type** : 🛠️ · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main a9406bd au départ.

## État de départ
- main vert sur a9406bd (#1181) : Tests, Build & Release, Play — AAB et émulateur verts.
- Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, pas à nous). Rien de neuf du propriétaire dans le prompt.
- TestFlight : l'envoi de la nuit prendra #1180, #1181 et cette PR. Parité iPhone : 70 % ; 45 correctifs iPhone.

## Ce qui a été fait
- **POLISH-SIM-135** : `WhatsNewBanner.jsx` compte exactement les autres notes non lues jusqu'à 3 (« et 1 autre
  changement », « et 3 autres changements ») ; au-delà, « et d'autres nouveautés ». La note à la une reste en tête.
- Tests écrits d'abord dans `WhatsNewBanner.test.jsx` (99 notes non lues : rouge avant le correctif, vert après ;
  4 notes : « et 3 autres changements »).
- Note de Nouveautés `2026-11-21-2330-nouveautes-compte.json` (les deux magasins).
- iPhone : aucun correctif de `iphone/patches/` ne touche ce fichier ; livré des deux côtés, PARITE.md à jour.

## Vérifications
- Suite Vitest complète : 4 201 tests verts (372 fichiers) ; `npm run build` passe ; eslint propre sur les fichiers touchés.
- `npm run visual -- --routes=/ --whats-new --now=13:00 --usage-days=76` (toutes les notes non lues) : capture relue,
  « Nouveau : Nouveaux onglets : Accueil, Ma journée, Objectifs, Données et d'autres nouveautés » tient sur trois
  lignes à côté de « Voir », aucune erreur JS.

## Suite proposée
1. Runs de code : POLISH-SIM-137 (lien « Vos repas » dans Ma journée), 138.
2. Demain matin : rattacher la build validée à la version 893, puis « 👉 PI2 prête ».

## Pour le propriétaire
Rien à faire.

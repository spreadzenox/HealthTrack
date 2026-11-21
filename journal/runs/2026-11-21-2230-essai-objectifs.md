# Run du 21/11 22:30 — L'essai en cours en haut d'Objectifs (POLISH-SIM-136)

**Type** : 🛠️ · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main f918d33 au départ.

## État de départ
- main vert sur f918d33 (#1180) : Tests, Build & Release, Play — AAB et émulateur verts.
- Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, pas à nous). Rien de neuf du propriétaire dans le prompt.
- TestFlight : 1221.1221 chez les testeurs externes ; l'envoi TestFlight de la nuit (planifié vers 02:30) prendra #1180
  et cette PR. Parité iPhone : 70 % ; 45 correctifs iPhone.

## Ce qui a été fait
- **POLISH-SIM-136** : la vue d'ensemble d'Objectifs affiche, sous le titre, l'essai en cours (bien-être ou
  digestion, le plus avancé s'il y en a plusieurs : `homeTrial`), qui ouvre sa page. La page d'un essai allume l'onglet
  Objectifs (`TabBar.jsx`) ; on l'y retrouve donc. Rien en mode exemple, rien sans essai ou si la lecture échoue.
- La ligne d'essai d'un objectif (POLISH-SIM-120, `Recommendations.jsx`) devient un composant partagé
  `components/TrialLink.jsx`, utilisé aux deux endroits (même rendu, mêmes tests).
- Tests écrits d'abord dans `Objectives.test.jsx` (rouges, puis verts) : lien vers `/agir/essai/<id>`, texte
  « jour 4 sur 10 », placé avant les cartes ; un essai de digestion compte ; rien sans essai ni en cas d'erreur.
- Note de Nouveautés `2026-11-21-2230-essai-objectifs.json` (les deux magasins).
- iPhone : aucun correctif de `iphone/patches/` ne touche ces fichiers ; livré des deux côtés, PARITE.md à jour.

## Vérifications
- Suite Vitest complète (voir la PR) ; eslint propre sur les fichiers touchés.
- `npm run visual -- --play --routes=/recommendations --trial=4 --now=13:00 --usage-days=76`, clair et `--dark` :
  captures relues, la ligne « Essai en cours : Dormir au moins 7 h 30 · jour 4 sur 10 · aujourd'hui, jour avec » est
  au-dessus de Pilou et de la carte Bien-être, entière, aucune erreur JS.
- Build iPhone de la PR : un seul, PR passée « prête » une fois finie.

## Suite proposée
1. Runs de code : POLISH-SIM-135 (« et 98 autres changements »), 137, 138.
2. Demain matin : rattacher la build validée à la version 893, puis « 👉 PI2 prête ».

## Pour le propriétaire
Rien à faire.

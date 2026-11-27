# Run 27/11 09:30 — Alimentation : les groupes FODMAP pas encore comparés

**Type** : 🔧 (polish, code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
1cf2ebb (#1307) vert (Tests, émulateur A56) · **TestFlight** : 1362.1362 chez « Testeurs Halcya » (inchangé) ·
**Parité** : 70 % (33/47), inchangée

## État de départ
- Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). main vert. Pas de nouvelle réponse du
  propriétaire. Rien à soumettre ni à expirer chez Apple (build du soir à 21:20).
- La remise à zéro du clone (`git reset --hard`) a encore été refusée par la sécurité de la session ; le clone était
  déjà sur origin/main, propre.

## Fait
- **POLISH-FODMAP-ABSENT** (point « à vérifier » du run de 08:30, « Ventre et données » J45) : dans Votre confort
  digestif › Alimentation, seuls lactose, fructose, sorbitol et GOS étaient comparés, sans un mot sur les fructanes et
  le mannitol. Cause vérifiée : un groupe sans repas au-dessus de son repère vaut 0 tous les jours, ne varie pas, et
  `fitOne` (analysisResults.js) le laisse de côté. Les repas de démonstration n'ont ni blé, ni oignon, ni ail, ni
  champignons : c'est donc juste, pas un défaut de l'outil. La table nutritionnelle est chargée avant l'analyse
  (`workers/analysisTasks.js`), la phrase ne peut donc pas mentir faute de table.
- `familyDetail` (influenceFamilies.js) rend `fodmapNotCompared` pour Alimentation ; la page l'écrit en une ligne,
  dans le détail des chiffres (avec barres) ou après les facteurs nommés (sans barres) : « Pas encore comparés, trop
  peu de vos repas en sont riches : fructanes (blé, oignon, ail) et mannitol (champignons, pois mange-tout). »
- Au passage : `listFr` mettait « GOS » en « gOS » alors que son commentaire promet de garder les sigles ; corrigé
  (testé dans le même test).
- Tests d'abord : `influenceFamilies.test.js` (rouge, puis vert) et `Recommendations.test.jsx`.
- Note de Nouveautés `2026-11-27-0930-fodmap-pas-compares.json` ; BACKLOG, PRODUIT § 5, PARITE, résumé.

## Vérifications
- `npm run test` : 459 fichiers verts (3 ignorés) ; `npm run lint` sans erreur ; `npm run build` vert.
- Captures `--onboarding=gut --gut-links=lactose --routes=/recommendations/ventre/famille/nutrition
  --click="Afficher les détails"`, clair et sombre, relues : `captures/2026-11-27-0930-fodmap-pas-compares-{clair,dark}.png`.
  La ligne vient sous la légende, lisible sur trois lignes.
- iPhone : aucun correctif `iphone/patches/` sur ces fichiers ; code partagé seulement ; un build iOS pour la PR.

## Suite proposée
1. Le reste du passage de 08:30 : « Enregistrer » qui descend sous le doigt dans la fenêtre du bien-être (à voir en
   capture).
2. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; soumission bêta de la build du soir au premier run
   qui la voit traitée, expiration des anciennes.

## Pour le propriétaire
Rien de nouveau à faire. Toujours : recruter des testeurs (4 sur 12), PI2, P51 ; le 29 ou le 30/11, le message E.

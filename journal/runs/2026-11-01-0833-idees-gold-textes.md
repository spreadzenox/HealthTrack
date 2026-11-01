# Run du 01/11/2026 08:33 (Paris, CET) — Idées : textes restants et offre Gold

**Type** : 💡 idées (journal seul, aucun code produit)

## Constat au démarrage
- Main à `0e39a53` (#591, SLOP-1b-5). Aucune PR « [Auto] » ouverte d'un run précédent.

## Fait
- **Inventaire SLOP-1b restant** (captures `npm run visual` relues : Analyses en démo avec `--gut-links=lactose`,
  « Comment c'est calculé » et liens incertains ouverts ; Premium en `--play`) → `IDEES.md` I204, réécritures prêtes
  pour SLOP-1b-6 (Analyses) et SLOP-1b-7 (réintroduction). Défaut trouvé au passage : « Comment c'est calculé » cite
  des étiquettes « Chez vous » / « À vérifier » qui n'existent plus à l'écran (« Piste solide » / « À confirmer »).
- **Offre Gold** (annuel et essai, à proposer selon la décision du 31/10) chiffrée → I205, action P35 : mensuel seul
  au lancement, annuel 79,99 € plus tard (59,99 € serait à perte en 2027), pas d'essai Gold.
- **Piège trouvé dans le code** : `playBilling.js` et le plugin natif n'ont aucun mode de remplacement ; avec un
  produit Gold séparé, un passage Silver → Gold créerait deux abonnements → GOLD-b2.

## Fichiers
- `journal/IDEES.md` (I204, I205), `journal/BACKLOG.md` (SLOP-1b-6, -7, GOLD-b0, -b2), `journal/PRODUIT.md` (P35,
  ligne G), `journal/README.md`.

## Vérifications
- Journal seul ; `npm run test` lancé avant la PR (garde-fou).

## Demandes iOS
- Aucune concernée (pas de note de Nouveautés). GOLD-b2 concernera aussi iOS (StoreKit gère les groupes
  d'abonnements seul) : à signaler au dépôt iOS quand GOLD-b sera livré.

## Suite
- Prochain run de code : SLOP-1b-6 puis SLOP-1b-7 (textes prêts dans I204), puis GOLD-b (paywall à deux niveaux,
  GOLD-b2, banc Nutrition5k).

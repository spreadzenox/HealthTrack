# Run du 30/10/2026 20:33 (Paris, CET) — Idées : inventaire montre à jour, premier lancement en clair

**Type** : 💡 Idées (pas de code produit)

## Constat au démarrage
- Main à `6c09780` (#533) : Tests, Build & Release, Play — AAB et émulateur A56 verts. Aucune PR « [Auto] » ouverte
  (seule #51, `cursor/*`, non touchée).
- Plantage du visage du 30/10 corrigé et mergé (#531, run de 17:33) : reste le retest du propriétaire. Rien à coder
  en urgence dans ce run « idées ».

## Recherche
- **Chantier montre, point (a)/(f) du signalement du 21/10** : le tableau d'inventaire de `protocoles/huawei.md`
  §10.1 datait du 21/10 et disait « ❌ » pour des données livrées depuis (M1–M7b). Relu dans le code
  (`coverage.js`, `sync.js`, `files.js`, `p2p.js`, lecteur Java) et dans le journal (P17 du 22/10, M4 validé le
  24/10) → nouveau §10.20 : une ligne par donnée, voie, arrière-plan, état (confirmé sur la montre / code seul /
  partiel / volontairement absent), où on la voit. Le résumé de la semaine (README) a maintenant ses lignes par type
  et le geste à tester ; l'ancien paragraphe (« restent M6… ») était périmé.
- **Gadgetbridge, PR #6579 (discussion seulement, aucun code lu ni repris)** : l'altitude du jour (classe 200003) se
  lit en réel gros-boutiste 4 ou 8 octets, comme nos autres classes → I199, MONTRE-ALT (à la demande).
- **Constat de code** : FC de la nuit et latence gardées mais jamais affichées ; score de sommeil seulement dans
  l'écran Montre → I200, MONTRE-SCORE (basse priorité, après le polissage).
- Règles Play : relues ce matin (run de 08:33), pas de nouvelle annonce trouvée ce soir. ameli.fr refuse toujours la
  lecture (403) ; « Quand consulter » est déjà livré (POL-PLAY-60), rien à reprendre.

## Audit
- `npm run visual -- --play --empty --theme=system --light --size=360x780 --routes=/,/recommendations,/connectors,/journal`
  (suite proposée par le run de 19:33) : 4 pages ok, aucun débordement, seul message console « AppManager already
  registered » (connu). Captures relues : Accueil (bilan du soir du ventre après 18 h, carte bien-être « L'activer dans
  Sources »), Analyses (« Vos pistes arrivent dans 21 jours », réintroduction premium), Sources, Journal vide. Rien à
  corriger.

## Fichiers
- `journal/protocoles/huawei.md` (§10.20), `journal/IDEES.md` (I199, I200, audit), `journal/BACKLOG.md`
  (MONTRE-SCORE, MONTRE-ALT), `journal/PRODUIT.md` (historique), `journal/README.md` (chantier montre, tableau).

## Vérifications
- Journal seul ; `npm run test` lancé avant la PR (garde-fou).

## Demandes iOS
- Aucune reprise ce run (rien de visible ; pas de note de Nouveautés).

## Suite
- Runs de code : polissage de la version Play (liste BACKLOG par impact) ; POL-PLAY-11 (alpha) après le retest du
  visage par le propriétaire et une journée sans plantage dans Android vitals.
- Prochain run « idées » : texte d'invitation des testeurs relu contre la version actuelle (INVITATION-TESTEURS.md),
  en vue de l'invitation de la semaine prochaine.

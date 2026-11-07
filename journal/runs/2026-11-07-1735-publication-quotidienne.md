# Run 07/11 17:35 — Publication quotidienne (run court, demande du propriétaire du 07/11 vers 17:30)

**Type** : 🔧 CI / livraison. **Branche** : `claude/publication-quotidienne`.

## Demande
Chaque modification arrive aux testeurs une fois par jour, sur Android comme sur iPhone ; ce soir, la version qui
contient le chantier du soir part vers les testeurs des deux plateformes (de même demain soir). Les sessions du
« chantier du soir » travaillent dans `app/src/` : aucun de leurs fichiers touché.

## Fait
1. **CD-ALPHA-6 (Android)** — `.github/workflows/play-alpha.yml` : déclenchement `workflow_run` et passage de 07:13
   retirés ; cron `45 22 * * *` (23:45 à Paris en heure d'hiver ; à recaler en `45 21 * * *` le 28/03/2027) ;
   `workflow_dispatch` gardé ; `ALPHA_MIN_HOURS` retiré (0 par défaut). `alphaGate.mjs` : « Build & Release » rejoint
   les workflows exigés, `decideNightly` choisit la plus récente version prête parmi les commits de main dont
   « Build & Release » a réussi (une version pas prête cède la place à la précédente ; déjà sur l'alpha ou sans
   changement de l'app = rien ne part). `alpha-cli.mjs` lit ces commits par l'API Actions. TDD : 7 tests écrits
   rouges, puis verts. L'envoi de ce soir part même si Alpha a reçu une version il y a moins de 24 h.
2. **iPhone** — décision recopiée mot pour mot en tête de `POUR-IOS.md`.
3. BACKLOG (section « Publication quotidienne », CD-ALPHA-7 et 8 notés), PRODUIT, résumé de la semaine.

## Points d'attention
- **CD-ALPHA-7** : la porte de 24 h de la fiche et des abonnements (07:23 / 07:33 UTC) compte l'envoi Alpha de la
  veille au soir : leurs changements ne partiraient plus. À régler au prochain run CI.
- Si un merge du soir n'a pas fini ses workflows à 22:45 UTC, c'est la version prête précédente qui part.

## Suite
Vérifier le bilan du workflow « Play — Alpha » de ce soir (22:45 UTC) au premier run de demain.

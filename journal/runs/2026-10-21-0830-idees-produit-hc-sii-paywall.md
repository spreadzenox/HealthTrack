# 2026-10-21 08:30 Paris (06:30 UTC) — Run « idées » : Health Connect jour 1, pistes SII avec délais, paywall Play

**Type** : 💡 idées (pas de code produit) · **PR** : celle de ce compte rendu (journal seul)

## Pourquoi
- Main à `e489bc8` (#244), workflows verts. PR **#246** (jalon 3b-1, run de 06:30) **verte mais non fusionnée**
  (merge refusé à cette session-là) et #245 (journal) ouverte → priorité du run.
- 08:30 Paris → run « idées ». Signalement du 20/10 19:05 déjà corrigé (v188). Premier run « idées » depuis les
  décisions produit du 20/10 au soir : veille tournée vers les jalons 4 (onboarding), 5 (pistes), 6 (paywall), 8 et 10.

## Ce qui a été fait
- **PR #246** revérifiée sur sa tête `56ddbac` : `npm ci`, Vitest **1 676 verts**, build ✅, lint 6 erreurs (= main),
  `npm run visual` sans erreur JS ; captures de la feuille de divulgation caméra (`--routes=/connectors --face=off
  --disclosure=camera`) lues : titre, puces AI Act, encart menthe, boutons visibles. 7 checks verts (Frontend
  (Vitest), Build APK, émulateur A56 API 35/36…) → **fusionnée en squash (`b4eb49e`)**. **#245 fermée** (contenu
  repris dans #246, commentaire posté).
- **Veille** (3 recherches en parallèle, sources primaires) → `IDEES.md` (section du 21/10 08:30, **I130–I138**),
  `RESEARCH.md` (synthèse), `BACKLOG.md` (idées rangées dans les jalons 4, 5, 6, 7, 8, 10 ; prochaines étapes),
  `PRODUIT.md` (jalons 3, 4, 6 ; **P16** formulaires « Contenu de l'app »), `DESIGN.md` (note sur le prix mensuel du
  paywall), résumé de la semaine.

## Faits marquants
- Health Connect : **30 jours lisibles d'office** dès le premier octroi → « aha » du jour 1 sans permission
  d'historique ; plugin = 21 permissions READ déclarées, Play refuse les types non utilisés ; aucun type pour les
  symptômes digestifs.
- Play : « Diseases and Conditions Management » est du groupe Medical (à ne pas cocher) ; phrase « pas un dispositif
  médical » exigée ; 12 testeurs × 14 j confirmé ; vérification développeurs en France en 2027+.
- SII : minutes après un repas = réflexe gastro-colique ; transit 12–48 h ; Monash 3 j croissants + 2–3 j de pause ;
  aucun minimum de jours publié (→ simulation) ; journaux grand public = faux positifs + effet d'attente.
- Paywall : **mettre en avant le prix mensuel d'un annuel est une violation Play** → « 2,50 €/mois » secondaire ;
  essai affiché seulement si Play le propose ; PBL ≥ 8 obligatoire ; 37,7 % essai → payant (H&F, médiane).

## Vérifications
- Journal seul dans cette PR ; `npm run test` à relancer en CI (garde-fou : les tests doivent passer même si seul le
  journal change).

## Suite proposée
- Prochain run de code : **3b-2** (manifeste play sans service caméra + lecture à l'ouverture) en y joignant **I131**
  (permissions Health Connect réduites au strict nécessaire) ; puis 2b/2c + 2 bis (iii) Accueil.
- Prochain run « idées » (20:30) : plugin Play Billing PBL ≥ 8 sous Capacitor (licence), délais par groupe FODMAP
  (Whelan 2018), mots-clés FR (Trends), AI Act art. 50 / RGPD art. 9 (preuve de consentement).
- Propriétaire : P8 puis P10 (AAB `HealthTrack-play-333`), puis P16.

## Après le merge
- (à compléter)

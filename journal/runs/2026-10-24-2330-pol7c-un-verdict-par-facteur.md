# 2026-10-24 23:30 Paris (21:32 UTC) — POL-7c : un verdict par facteur, « Autres liens repérés »

**Type** : 🧭 chantier produit (polissage du parcours, retours du propriétaire du 24/10 vers 15:00, point 7)

## Constat au démarrage
- Main à `125fe80` (#336), workflows de main verts (Tests, émulateur ; Build & Release v258, Play — AAB). Aucune PR
  « [Auto] » ouverte (seule #51 `cursor/*`, non touchée).
- Dernière partie de POL-7 (maquette `IDEES.md` I163 §4). Captures avant : 3 écrans en démo, « Alcool » deux fois
  (visage puis notes, deux verdicts), deux « Voir les N liens incertains », émojis dans les titres d'habitudes.

## Ce qui a été fait (présentation seulement : aucun calcul ni seuil ne change)
- `Recommendations.jsx` : `FaceMoodSection`, `FaceMoodHabits`, `TagsSection`, `LaggedEffectsSection` et
  `CorrelationsSection` remplacées par **`LinksSection`** (« Autres liens repérés », ou « Liens repérés » sans piste),
  alimentée par `mergeLinks` : corrélations, habitudes (tags) et effets décalés, avec les notes **et** avec le
  bien-être estimé, regroupés par facteur (`FACTOR_ALIAS` : `alcohol_g` ↔ tag `alcohol`, `screen_late_minutes` ↔
  `late_screen`) ; le verdict retenu est le plus solide (évidence, puis q, puis les notes avant le visage). Les autres
  mesures **nettes** du même facteur tiennent en une ligne mono « Autres mesures : jours avec / sans (notes) à
  confirmer ». Étiquette mono menthe « visage » sur ce qui vient du bien-être estimé (D6 : jamais de « Piste » sur un
  effet décalé du visage).
- 5 liens nets visibles, le reste derrière « Voir N autres liens » ; les incertains derrière un seul « Voir les N liens
  incertains » ; « En cours de collecte » en une ligne (notes + visage dédupliqués), sans émojis.
- Un facteur déjà **piste à tester** n'est plus relisté : son effet décalé (« La veille, 2 300 pas de plus… → +0,4
  point (hypothèse solide) ») s'ouvre au chevron de la piste (`LeverCard` prop `lag`).
- Émojis retirés des titres d'habitudes (`TagEffectCard`). Plus de bloc « Effets décalés » vide (« Aucun effet décalé
  net… » supprimé : la ligne « Bientôt » couvre l'attente).
- CSS : `.reco-link-list`, `.reco-link-bar`, `.reco-link-src`, `.reco-link-also` (tokens `--mint-bg`, `--mint-label`,
  `--text-muted`, `--font-mono`).
- Nouveauté `2026-10-24-2330-un-verdict-par-facteur.json`.

## Vérifications
- Vitest : `Recommendations.test.jsx` 52 verts (2 nouveaux : « Voir 2 autres liens » au-delà de 5, « Alcool » variable +
  tag montré une fois avec « Autres mesures » ; tests visage, effets décalés et titres réécrits) ; suite complète
  **2 158** verts.
- Build OK ; lint inchangé (6 erreurs préexistantes).
- Captures relues : `--play` démo clair (2 écrans au lieu de 3), `--play --dark` avec les incertains ouverts,
  `--play --empty` (toutes les pages, Analyses = carte lilas seule).

## Suite
- POL-7 terminé. Ensuite : **POL-6** (Journal en pastels, Tendances inactives en une ligne) → POL-8 (Sources) → POL-1.

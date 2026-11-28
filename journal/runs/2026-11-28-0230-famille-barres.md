# Run 28/11 02:30 — vos 14 jours en barres dans le détail d'une famille (REFONTE-6c-4)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 124009e (#1319) vert
(Tests, Build & Release v955, Play — AAB, émulateur A56) · **TestFlight** : 1362.1362 chez « Testeurs Halcya » ;
build du soir du 27/11, TestFlight et Alpha pas encore partis à 01:30 UTC (cron de GitHub en retard, comme chaque
soir : la veille, TestFlight à 02:52 et Alpha à 04:34 UTC) · **Parité** : 70 % (33/47), inchangée (code partagé)

## État de départ
- #1319 (REFONTE-6c-3) mergée par le run de 01:30. Aucune PR de la routine ouverte ; #51 (`cursor/*`) pas touchée.
- Pas de nouvelle réponse du propriétaire.

## Fait
- **REFONTE-6c-4, les 14 barres du détail d'une famille** (SPEC comprendre § 6.5, « Barres des 14 nuits »), tests
  d'abord : `familyBars(days, now)` dans `influenceFamilies.js`, sur les mêmes jours que l'en-tête (`usualValues`) :
  sommeil et pas, les 14 jours passés ; repas, 13 jours passés et aujourd'hui. `{ days: [{ dateKey, value }], usual }`.
- `Recommendations.jsx` : `FamilyBars` sous la ligne d'en-tête ; barres à la couleur de la famille (bleu nuit, lilas,
  pêche), jour sans mesure = petite barre vide, trait pointillé gris à la valeur habituelle (pas pour les repas).
  Échelle depuis zéro (honnête, même si les nuits se ressemblent). `aria-hidden` : l'en-tête dit déjà la même chose
  en mots. Rien de stocké, pas de migration.

## Vérifications
- Tests : 2 nouveaux (service) + 1 enrichi (page) ; suite complète verte (4 760 tests, 461 fichiers).
- Lint : 0 problème sur les fichiers touchés. Build : ok.
- Captures `--routes=…/famille/sleep,activity,nutrition --now=14:00` en clair, puis sommeil en sombre, relues : 14
  barres, une nuit vide sur les données de démo, aujourd'hui vide pour les repas à 14:00 (rien noté), trait à 7 h 38
  et 6 386 pas.

## Suite proposée
1. Finir la PR (passer en « prête » pour son seul build iPhone, capture iPhone de la famille Sommeil) puis merger.
2. Build du soir, TestFlight et Alpha du 27/11 : vérifier ; soumission bêta au premier run qui voit la build traitée,
   expiration des anciennes.
3. Fin de la SPEC § 6.5 : lire `phone_usage` dans `readFamilyDaysFromStorage`, point ambre sur les soirs avec plus de
   2 h d'écran et les deux moyennes (« Autres soirs » / « Soirs avec plus de 2 h d'écran »), avec l'écart.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, le message E.

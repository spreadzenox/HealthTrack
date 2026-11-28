# Run 28/11 01:30 — vos 14 derniers jours dans le détail d'une famille (REFONTE-6c-3)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 5364e58 (#1318) vert
(Tests, Build & Release v954, Play — AAB, émulateur A56) · **TestFlight** : 1362.1362 chez « Testeurs Halcya » ;
build du soir, TestFlight et Alpha de 23:45 pas encore partis à 00:40 UTC (cron de GitHub en retard, comme chaque
soir) · **Parité** : 70 % (33/47), inchangée (code partagé)

## État de départ
- #1318 (REFONTE-6b-2) mergée par le run de 00:30. Aucune PR de la routine ouverte ; #51 (`cursor/*`) pas touchée.
- Pas de nouvelle réponse du propriétaire.

## Fait
- **REFONTE-6c-3, la ligne d'en-tête du détail d'une famille** (SPEC comprendre § 6.5, « Vos 14 dernières nuits · en
  moyenne 7 h 05 »), tests d'abord : `familyPeriods(days, now)` dans `influenceFamilies.js`, qui partage le calcul de
  `familyUsuals` (`usualValues`). « Vos 14 dernières nuits · d’habitude 7 h 38 », « Vos 14 derniers jours ·
  d’habitude 6 386 pas par jour », « Vos 14 derniers jours · 18 repas notés ». « d’habitude » au lieu de « en
  moyenne » : c'est la médiane, le même chiffre que « Par famille » et l'Accueil. Rien sans mesure.
- `Recommendations.jsx` : les jours lus sont gardés tels quels (`familyDays`), `usuals` et `periods` en dérivent ;
  la ligne s'affiche sous le titre (`.reco-family-period`, texte gris). Une première version en `.reco-intro`
  faisait un encadré coloré, trop fort pour un sous-titre (leçon : même apparence = même type d'information) :
  remplacée. Rien de stocké, pas de migration.

## Vérifications
- Tests : 1 nouveau (service) + 1 (page) ; les 51 de ces deux fichiers verts. Suite complète : voir la PR.
- Lint : 0 problème sur les fichiers touchés. Build : ok.
- Captures `--routes=/recommendations/bien-etre/famille/sleep --now=14:00` en clair, puis `--dark --font-scale=1.3`
  relues : « Vos 14 dernières nuits · d’habitude 7 h 38 » sous « Sommeil », sur une ligne même à 1,3.

## Suite proposée
1. Finir la PR (passer en « prête » pour son seul build iPhone, capture iPhone de la famille Sommeil) puis merger.
2. Vérifier la build du soir, TestFlight et l'Alpha ; soumission bêta de la build du soir au premier run qui la voit
   traitée, expiration des anciennes.
3. Reste de la SPEC § 6.5 : les 14 barres et les deux moyennes (soirs avec ou sans écran).

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, le message E.

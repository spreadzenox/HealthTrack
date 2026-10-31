# Run du 31/10/2026 14:33 (Paris, CET) — Historique du bien-être : légende complète (POL-PLAY-85)

**Type** : 🎨 polissage (audit prévu par le run de 13:33 : Historique du bien-être en vierge et sombre)

## Constat au démarrage
- Main à `fa02659` (#563, journal) ; v407 publiée, Tests / Build & Release / Play — AAB verts. Aucune PR « [Auto] »
  ouverte (seule #51, `cursor/*`, non touchée).

## Audit `/bien-etre` (variante play)
- `--empty` clair : état vide propre (« Pas encore d’estimation », lien Sources, « Noter moi-même »). Rien à redire.
- Démo sombre (Semaine) et clair (Jour, Mois) : lisible, contrastes corrects. Défauts trouvés :
  1. la ligne pointillée (moyenne) n'était pas légendée ;
  2. en vue Jour, les barres verticales (fourchette de chaque lecture) n'étaient pas légendées ;
  3. en vue Jour, « 3 lectures · 1 jour » : « 1 jour » ne disait rien ;
  4. « Expressions … sur 13 lectures » sous « 33 lectures » : incohérence apparente (seules les lectures récentes
     ont les probabilités d'expressions).
- « Éveil −0,09 » identique sur les trois périodes : artefact des données de démo (`demoData.mjs`, bruit centré),
  pas un défaut.

## Fait (`WellbeingHistory.jsx`, `WellbeingHistory.css`)
- Légende « fourchette » (vue Jour, si des lectures ont une fourchette) et « moyenne » (trait pointillé, si la ligne
  est tracée).
- Vue Jour : nombre de lectures seul.
- Expressions : « sur 13 des 33 lectures » quand elles ne couvrent qu'une partie des lectures, sinon « sur 13 lectures ».

## Tests
- `WellbeingHistory.test.jsx` : 2 cas (légende moyenne / fourchette et « 1 jour » retiré ; base des expressions).

## Vérifications
- `npm run test` (2 791 réussis), `npm run build`, `npm run lint` (6 erreurs, comme avant), `npm run visual` complet (toutes les pages ok).
- Captures relues : `/bien-etre` `--play --empty`, `--play --dark` (Semaine), `--play` (Jour, Semaine, Mois),
  `--play --dark --click=Jour` après correctif.

## Données
- Aucune : affichage seulement.

## Demandes iOS
- Rien de propre à Android (note de Nouveautés sans `variants`, valable aussi pour l'iPhone).

## Suite
- Nutrition en sombre (POL-PLAY-82), puis Journal → Tendances en vierge.

## Après le merge (#564)
- Les 9 checks de la PR étaient verts (Vitest, Build APK, Publier l'APK, relais, Java, budget, émulateurs API 34/35/36).
- Tests, Build & Release et Play — AAB verts sur main (`2845cf9`) : release **v408** publiée (APK 34 521 922 octets) ;
  AAB play envoyé en test interne.

# Run 14/11 03:35 — Tendances, fiche d'un jour (POLISH-SIM-71) ; iPhone en v1035, correctifs 06 et 12 refaits

**Type** : code (mode polish) et suivi iPhone  ·  **Android** : v1036 sur main après ce run  ·
**TestFlight** : 1030.1031 chez les testeurs externes (depuis le 14/11 à 00:33) ; 1032.1033 envoyée à 01:41 ; la build
du code v1034 envoyée le 14/11 à 03:32 (« iOS — TestFlight » vert sur 6d028a7 ; numéro non relevé, attendu
1034.1035) ; aucune soumission bêta avant la nuit prochaine ; 844.344 intacte  ·  **Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main 6d028a7 : Build & Release, iOS — TestFlight et modèles du visage verts ; Tests, Play — AAB, émulateur A56 et
  « iOS — build simulateur » encore en cours au début du run (Play — AAB vert ensuite : `upstream.sh --latest` l'a
  pris). Aucune PR « [Auto] » ouverte (#51 `cursor/*` non touchée).
- L'envoi Alpha du soir (cron de 23:45 du 13/11) n'était toujours pas parti à 04:05 : dernier « Play — Alpha » le
  13/11 à 03:56, vert.

## Fait
1. **POLISH-SIM-71** (deux personas J45), fiche d'un jour de Journal › Tendances :
   - « Ce qui a pu peser ce jour-là » dit sur quelle note portent les points : « Sur votre bien-être, en points sur
     5. » ou « Sur votre confort digestif, en points sur 5. » (`Trends.jsx` passe `outcome`).
   - Seuil d'affichage : un effet de moins de 0,05 pt n'est plus montré (`MIN_SHOWN_POINTS`, `weighView` dans
     `trendsDay.js`). Le filtre est à l'affichage : rien à recalculer, les résultats déjà en cache en profitent.
   - Tous les effets sous le seuil : « Rien de marquant ce jour-là parmi ce que Halcya compare. », sans barre.
   - Note du jour à 2,5/5 ou moins (`LOW_DAY`) et aucun effet négatif affiché : « Rien de ce que Halcya compare
     n'explique cette note basse. » sous les barres.
   - Confort digestif : le chiffre du jour est une estimation (modèle d'état) ; quand il ne s'arrondit pas à la note
     du niveau noté (douleur = 1), la ligne dit « estimé, avec votre note « douleur » » au lieu de « noté
     « douleur » » (`detailSource`, `gutScore` dans `dayFaceDetail`).
   - Nouveautés : `2026-11-14-0335-fiche-jour-ce-qui-pese.json` (code partagé : Android et iPhone).
2. **Suivi iPhone** : `scripts/upstream.sh --latest` : v1034 → v1035 (6d028a7, POLISH-SIM-73). Le changement de
   l'import de `Data.jsx` (`EXPORT_FILE_PREFIX`) cassait les correctifs **06** et **12** : ligne de contexte mise à
   jour dans les deux, rien d'autre. Les 52 correctifs s'appliquent.

## Vérifs
- Tests écrits avant le code (lancés une fois le code écrit, pas vus rouges) : `TrendsDayDetail.test.jsx` (+6),
  `trendsDay.test.js` (+2), `trendsData.test.js` (+1). `npm run test` : 3523 verts, 44 ignorés. `npm run lint` :
  0 erreur. `npm run build` : vert.
- `npm run visual` sur `/tendances` et `/tendances?mesure=digestion`, variante play, jour du 13/11 ouvert, clair et
  sombre, sans erreur JS ; captures regardées :
  [bien-être clair](captures/2026-11-14-0335-fiche-jour-bien-etre-clair.png) ·
  [sombre](captures/2026-11-14-0335-fiche-jour-bien-etre-sombre.png) ·
  [digestion clair](captures/2026-11-14-0335-fiche-jour-digestion-clair.png) ·
  [sombre](captures/2026-11-14-0335-fiche-jour-digestion-sombre.png).
- Code embarqué v1035 avec les 52 correctifs (`iphone/upstream/app`) : voir la PR pour Vitest et ESLint.
- La PR change `iphone/upstream.json` et `iphone/patches/` : « iOS — build simulateur » (près d'une heure) doit être
  vert et ses captures regardées avant le merge. Si ce compte rendu est sur main, c'était le cas.

## Limites
- `npm run visual` complet (18 pages) non relancé : seules les deux pages touchées l'ont été.
- Les phrases « rien de marquant » et « n'explique cette note basse » ne sont vérifiées que par test : les données de
  démo n'ont pas de jour qui les déclenche.
- Les repas de la veille et un lien « Voir toute la journée » dans la fiche (demandés par les personas) ne sont pas
  faits : nouvelle étape POLISH-SIM-71b.
- `LOW_DAY` est un seuil absolu (2,5/5), pas un écart à l'habitude de la personne.
- PARITE.md non modifié (changement du code partagé, aucune fonction nouvelle). Charte, PRODUIT, BACKLOG et journal
  iPhone lus par sections, pas en entier (plus de 1 Mo).

## Suite
- Finir cette PR si la build iOS n'est pas verte à la fin du run.
- Vérifier que l'envoi Alpha de la nuit est parti et vert ; relever le numéro de la build TestFlight du code v1034.
- Nuit prochaine, après l'Alpha de 23:45 : soumettre la dernière build TestFlight traitée, puis expirer les anciennes.
- Suivi iPhone (v1036), FUSION-2 (éviterait de refaire des lignes de contexte à chaque run) ; POLISH-SIM-71b, 69
  (fin), 72 ; CYCLE-3a-2.

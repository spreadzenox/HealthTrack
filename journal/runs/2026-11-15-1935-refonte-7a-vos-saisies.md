# Run 15/11 19:35 — Refonte « Compagnon », étape 7a : « Vos saisies » dans le détail du jour de Tendances

**Type** : code (refonte « Compagnon », étape 7 du § 10 du brief, première partie)  ·  **Android** : main 25e29c5
(v1094) au début  ·  **TestFlight** : 1096.1096 envoyée au merge de #1022 (18:40 UTC, « Upload succeeded ») ; arrivée
chez Apple non relevée  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions vérifiée : conforme (69177875…). Lus en entier : les quatre fichiers d'instructions, le
  brief de la refonte, `ETAPE-7-DONNEES.md` (PR #1023), le compte rendu de 16:35. Lus en partie : le résumé de la
  semaine, `iphone/CLAUDE.md`. Non relus : `iphone/README.md`, `iphone/journal/README.md`, `PARITE.md`, `PRODUIT.md`.
- Main 25e29c5 vert (Tests, Build & Release, Play — AAB, émulateur). Deux PR de la routine ouvertes : #1022
  (IOS-HEAD, build iOS en cours) et #1023 (préparation de l'étape 7, journal seul, à merger après #1022).

## Fait
1. **#1022 (IOS-HEAD) mergée à 19:39** (754fbfd) : « Build iOS (simulateur) et captures » verte à 19:33, 16 checks
   verts, branche à jour sur main. Captures regardées sur `captures/pr-1022` (iPhone 17 Pro, clair, démo) : le confort
   digestif (« 9/28 jours notés », seuil d'avant 6d) et la réintroduction (« ← Votre confort digestif » : 6e est sur
   iPhone). Après le merge : « iOS — TestFlight » vert, **build 1096.1096 envoyée** (numéro `N.N` d'IOS-HEAD).
2. **#1023 remise à jour sur main** (conflits du tableau des runs et de `PRODUIT.md` : les deux lignes gardées, la plus
   récente en haut), checks relancés.
3. **Étape 7a sur Android et iPhone** (branche `claude/refonte-7a-vos-saisies`, une seule PR depuis IOS-HEAD) :
   - `components/DayEntries.jsx` : « Vos saisies » d'un jour, extrait du Journal (saisies avec heure, « … »,
     Modifier, Refaire, Supprimer ; ligne « Règles · 2e jour » et jour du cycle). Lit les entrées de ce seul jour.
     Rien si le jour n'a ni saisie ni règles ; une lecture en échec ne montre rien.
   - **Habitudes** : « Méditation  Oui », couleur miel, une seule réponse par habitude et par jour (la dernière,
     comme Ma journée), « Modifier » ouvre Oui / Non sur place, Supprimer. Dans le Journal elles s'affichaient en
     JSON brut (ligne 8 de l'inventaire : confirmé en lisant le code).
   - `TrendsViewer.jsx` : le détail d'un jour passé (Jour, et jour touché en Semaine ou Mois) se termine par « Vos
     saisies » ; rien sur un jour futur.
   - `DailyJournal.jsx` réutilise `DayEntries` (aucun changement visible) ; `services/cycleRead.js` (lecture du cycle
     partagée).
   - `App.css` : carte d'habitude en miel (clair et sombre).
   - Note de Nouveautés `2026-11-15-1935-vos-saisies-tendances.json` (les deux magasins).
   - Lignes de l'inventaire couvertes : 1, 2, 3, 5, 6, 8. Restent 4 (Repas depuis Nutrition, 7b), 9 (« Hier », 7c),
     10 (visite guidée, 7b).

## Vérifs
- Tests écrits avant le branchement, vus rouges (celui de Tendances) : 8 de `DayEntries` (lecture du seul jour,
  bien-être modifiable, digestif, habitude Oui → Non et doublon, repas Refaire / Modifier / Supprimer, séance de la
  montre sans geste, règles modifiables, **base d'avant la refonte** avec objectifs sport et cycle et aucune habitude),
  1 de Tendances (Semaine, Jour, jour futur). `npm run test` : 3713 verts, 44 ignorés. Journal : 47 verts, inchangés.
- `npm run lint` sans erreur ; `npm run build` ; `npm run visual` (voir la PR pour le passage complet).
- Captures regardées (Android, 412 px) : Tendances › Jour, la veille, données de démo avec `--habits=history
  --cycle`, clair et sombre : « Vos saisies » sous « Ce qui a pu peser », règles, bien-être, cigarettes, repas,
  Méditation (miel), digestion, selles, séance de la montre.
- iPhone : `scripts/upstream.sh` → v1097 (HEAD), 51 correctifs appliqués (le correctif 57 touche `DailyJournal.jsx`,
  il s'applique encore). La build simulateur de la PR dira le reste.

## Limites
- Pas de capture sur historique presque vide, ni grand texte, ni 320 px, ni version Play.
- Le cycle n'est relu que sur 76 jours : sans importance pour Tendances (30 jours au plus).
- Le Journal reste en place (ses saisies sont en double dans Tendances jusqu'à 7b et 7c).

## Suite
- Finir cette PR : build iOS verte, captures `tendances` regardées des deux côtés, puis merge.
- **REFONTE-7b** : Données sur 2 onglets (Tendances · Nutrition), `/journal` redirigé, visite guidée sur Tendances,
  `captureMode.js` iPhone sans `/journal`, dans la même PR.
- REFONTE-6d : le banc à n = 7 et 14 (run « idées » de 20 h), puis les seuils.

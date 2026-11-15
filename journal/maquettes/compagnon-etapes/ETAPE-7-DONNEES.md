# Étape 7 de la refonte « Compagnon » : Données et suppression du Journal — préparation (15/11 18:35)

> Écrit pendant la build iPhone de #1022 (IOS-HEAD), sans code produit. Sources : brief § 3.6, § 4 et § 10 (étape 7) ;
> objectif du propriétaire du 15/11 vers 17:45 (rétrocompatibilité des données, tutoriel de départ) ; le code de main
> 25e29c5. Rien ici n'a été essayé dans l'app : c'est l'inventaire que le BACKLOG demande avant toute suppression,
> et un découpage à vérifier par le run de code qui commence l'étape.

## 1. Ce que demande le brief
- « Le Journal jour par jour est supprimé ; Tendances est l'écran de visualisation de référence : on y superpose
  des courbes, et toucher un point ouvre le détail du jour. »
- Onglet Données : s'ouvre sur **Tendances**, **Nutrition** en second onglet (historique des repas). `Journal`
  supprimé.
- Avant de supprimer : **inventaire** de ce qui n'est accessible que par le Journal et une autre maison pour chaque
  chose (« détail du jour dans Tendances, « Hier » dans Ma journée, Nutrition pour les repas »). Puis suppression de
  l'écran, de ses routes (redirigées vers Tendances) et du code mort, tests compris.
- Nunito et les tokens « dans cette étape ou la suivante ».

## 2. Aujourd'hui
- `/journal` = `pages/Journal.jsx` (14 lignes) : `JournalTabs` + `components/DailyJournal.jsx` (682 lignes) +
  `SeeExample`. Sous-onglets de Données (`JournalTabs`) : Tendances · Nutrition · Repas · Jours.
- `DailyJournal` : 3 jours, puis 4 de plus par « Voir les jours précédents » ; par jour un en-tête (date, jour du
  cycle), la ligne « Règles · 2e jour · flux moyen · Crampes », des puces résumé (sommeil, pas, cœur… avec écart à
  la norme et lien vers la courbe de Tendances), puis chaque saisie avec ses gestes.

## 3. Inventaire : ce qui n'est accessible que par le Journal
| # | Chose | Ailleurs aujourd'hui ? | Nouvelle maison proposée |
|---|---|---|---|
| 1 | **Modifier une note de bien-être passée** (`WellbeingPrompt` avec l'entrée) | Non (Ma journée : seulement aujourd'hui) | Détail du jour de Tendances : liste « Vos saisies » du jour, même geste « … » |
| 2 | **Supprimer une note de bien-être, digestive, des selles, une cigarette** passée | Non | Idem (1) |
| 3 | **Modifier le niveau d'une note digestive** passée (`GutLevelPicker`) | Non | Idem (1) |
| 4 | Modifier, refaire, supprimer **un repas** | **Oui** : page Repas (`/food`, 100 derniers repas, `SavedMealEditor`, `DeleteEntryButton`) | Nutrition ; Repas reste joignable depuis Nutrition (lien « Tous vos repas ») |
| 5 | **Ligne « Règles · 2e jour · flux » et jour du cycle**, avec modifier / supprimer les règles d'un jour passé (`PeriodSheet` avec `dateKey`) | Non (Ma journée : saisie du jour seulement, si « Mon cycle ») | Détail du jour de Tendances, sous le titre du jour, mêmes conditions (`cycleVisible`) |
| 6 | Voir **séances, pesées, composition corporelle** d'un jour passé, avec leur source | En partie (courbes de Tendances, sans le détail d'une séance) | Liste « Vos saisies » du détail du jour (lecture seule pour ce qui vient d'une source) |
| 7 | Puces résumé avec **écart à la norme** (`dayDeviations`) et lien vers la courbe | Écarts aussi dans Ma journée (`TodayBySource`) ; courbes dans Tendances | Rien à recaser : le détail du jour de Tendances montre déjà chaque mesure |
| 8 | **Habitudes** d'un jour passé (oui ou non) | Non, et le Journal les montre en données brutes (type `habit` absent de `ITEM_TYPES_WITH_RENDERER` : à vérifier en capture) | Liste « Vos saisies » : « Méditation : oui », modifiable |
| 9 | « Hier » : compléter la veille (note du soir oubliée) | Non | Brief : « Hier » dans Ma journée. Proposition : une ligne « Hier : 1 chose à noter » seulement s'il manque la note du soir de la veille (leçon 17) ; sinon rien |
| 10 | Exemple fictif (`SeeExample`) et visite guidée : 2 étapes sur `/journal` (`tour.js` l. 48-49 : « Vos journées », « Une journée d'un coup d'œil ») | — | La visite passe ces 2 étapes sur Tendances › Jour (le détail du jour), **dans la même étape** (objectif du 15/11, point 2) |

Références à `/journal` à changer : `App.jsx` (route), `TabBar.jsx` (chemins de Données), `JournalTabs.jsx`,
`services/tour.js`, `scripts/visual/visual-check.mjs`, et côté iPhone `iphone/overlay/app/src/ios/captureMode.js`
(`ROUTES`, `DARK_ROUTES`, `EMPTY_ROUTES`, `LARGE_TEXT_ROUTES`, contrôle l. 532-534 qui lit « 1 234 » pas sur
`/journal`) : depuis IOS-HEAD, dans la **même PR**. Aucun lien `/journal` trouvé dans le code natif Android ni dans les
notifications (à revérifier pour le widget).

Code qui ne sert qu'au Journal (à retirer à la fin, tests compris) : `pages/Journal.jsx`, `components/DailyJournal.jsx`,
`components/JournalEmpty.jsx`, la partie journal de `services/journalChips.js` (aussi lu par
`devices/huawei/coverage.js` : garder ce qu'il lit). **À garder** : `services/dailyJournal.js` (lu par Ma journée,
le rapport, les essais, Tendances), `services/journalEntries.js` (Ma journée), `dayDeviations` (Ma journée),
`SavedMealEditor`, `EntryActionsToggle`, `PeriodSheet` (Repas, Ma journée).

## 4. Données (objectif du 15/11, point 1)
- Aucune donnée n'est stockée par le Journal : il lit des entrées. Le supprimer ne change ni le schéma IndexedDB ni
  l'export/import. Test à écrire quand même : une base d'avant la refonte (notes, digestion, règles, repas,
  habitudes) ouvre Tendances › Jour d'un jour passé et chaque saisie y est listée, modifiable si elle l'était.
- Rien n'est perdu ni caché sans autre maison : les 10 lignes du § 3 ont chacune la leur avant la suppression (7c).

## 5. Découpage proposé (un run chacun, une seule PR Android + iPhone depuis IOS-HEAD)
- **7a — « Vos saisies » dans le détail du jour** : extraire `EntryItem` et `CycleLine` de `DailyJournal` dans
  `components/DayEntries.jsx` ; les afficher sous les mesures du détail du jour de Tendances (vue Jour et point
  touché en Semaine ou Mois), pour un jour passé ; règles du cycle sous le titre. Rien n'est retiré. Tests : chaque
  geste de (1) à (3), (5), (8) depuis Tendances ; base d'avant la refonte.
- **7b — Données sur 2 onglets et visite guidée** : `JournalTabs` = Tendances · Nutrition ; Repas joignable depuis
  Nutrition ; `/journal` redirigé vers `/tendances?vue=jour` (comme `/bien-etre`) ; visite guidée sur Tendances ;
  captures iPhone et `visual-check` sans `/journal`. Note de Nouveautés (« Le Journal jour par jour rejoint
  Tendances : touchez un jour pour voir et modifier vos saisies »).
- **7c — Code mort** : retrait de `Journal.jsx`, `DailyJournal.jsx`, `JournalEmpty.jsx` et de leurs tests ; « Hier »
  dans Ma journée si l'inventaire (9) le confirme utile.
- **7d — Nunito et tokens** (ou étape 8) : police embarquée (OFL), `tokens.css`, miel déjà fait en 4a, `DESIGN.md`.

## 6. Questions ouvertes (pas bloquantes, choix proposés)
- « Voir les jours précédents » disparaît : on remonte jour par jour avec les flèches de la vue Jour (30 jours) ou
  en touchant un point du Mois. Plus loin que 30 jours, rien aujourd'hui : à mesurer sur les personas avant le 22/11.
- « Hier » (9) : version minimale proposée ; la SPEC `journee.SPEC.md` à relire au run de 7c.

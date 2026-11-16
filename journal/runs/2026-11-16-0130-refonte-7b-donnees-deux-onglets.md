# Run 16/11 01:30 — Refonte « Compagnon », étape 7b : Données sur 2 onglets

**Type** : run de code (Android et iPhone, une seule PR)  ·  **Android** : main c8d0059 (#1028) vert ; release
**v749** (APK 34,6 Mo, 15/11 23:44 UTC, merge de 6d) ; « Play — AAB » vert  ·  **TestFlight** : « iOS — TestFlight »
vert sur c317b5b (merge de 6d, 15/11 23:41 UTC) ; pas de relevé App Store Connect à ce run  ·  **Parité** : 70 %
(33/47), inchangée

## Contexte
- Empreinte des instructions conforme (69177875…). Lus en entier : les quatre fichiers d'instructions, le brief de la
  refonte, `ETAPE-7-DONNEES.md`, `iphone/README.md`, `iphone/journal/README.md` § 3, 4 et 8 ; le résumé S47 et les
  deux derniers comptes rendus. `PARITE.md` et le backlog iPhone lus en partie (en-têtes et suivi).
- Main vert, aucune PR de la routine ouverte (#51, cursor, pas touchée). 01:30 à Paris : run de code.

## Fait (REFONTE-7b)
1. **Données = Tendances · Nutrition** (`JournalTabs.jsx`) : plus d'onglets Repas ni Jours ; Repas (`/food`) est
   rangé sous Nutrition, qui porte un lien « Tous vos repas » à côté de « Vos apports ».
2. **`/journal` → `/tendances?vue=jour`** (`App.jsx`, comme `/bien-etre`) ; la page Journal n'est plus chargée (son
   code part en 7c). Test `AppRedirects.test.jsx` sur la vraie table des routes. `TabBar` ne connaît plus `/journal`.
3. **Visite guidée** (`tour.js`) : « Vos journées » et « Une journée d'un coup d'œil » sur Tendances › Jour,
   projecteur sur le détail du jour ; « Voir un exemple » depuis Tendances reprend la visite à cette étape
   (`startIndex` compare le chemin sans la requête). Texte de la 2e étape : « Touchez un jour pour revoir vos notes
   et vos repas. » (l'ancien promettait sommeil, pas et cœur, que ce détail ne montre pas tous). « Voir un exemple »
   ajouté en bas de Tendances, comme sur les autres écrans encore vides.
4. **Fiche Play** : la capture « 07-jours » (Journal) est retirée (6 captures) : l'écran n'existe plus.
   `visual-check` sans `/journal`.
5. **iPhone, même PR** : `captureMode.js` sans `/journal` (sombre et grand texte sur `/tendances`), sonde des pas de
   Santé lue sur Tendances › Jour (nom du signal inchangé, `healthkit-journal`, lu par le test d'interface).
   `upstream.sh` : les 51 correctifs s'appliquent sans retouche.
6. Nouveautés : « Données : Tendances et Nutrition ».

## Données (objectif du 15/11)
Aucune lecture ni écriture ne change : rien à migrer, export et import intacts. Les saisies d'un jour passé restent
modifiables depuis Tendances (7a, testé sur une base d'avant la refonte).

## Vérifs
- Suite complète Android verte (316 fichiers), build, lint sans erreur (comme avant). Suite avec les correctifs
  iPhone dans `iphone/upstream/app` : 392 fichiers verts après mise à jour du test de la sonde HealthKit
  (`captureMode.test.js`, qui attendait `/journal`). Leçon : lancer cette suite **sans** `VITE_DISTRIBUTION=appstore`,
  comme le job Ubuntu de la CI (avec, 10 tests de la variante tombent sans rapport avec le changement).
- Captures regardées : `tendances`, `nutrition` (lien « Tous vos repas »), `food` (onglet Nutrition actif),
  Tendances vide, visite guidée « Vos journées » puis l'exemple au jour 14 sur Tendances › Jour (`--settle=6000`).

## Vu en passant (REFONTE-7b-2)
- L'exemple de la visite ne s'affiche qu'après le calcul d'Analyses (quelques secondes) : avant, « Vos courbes
  apparaîtront après 3 jours de mesures ».
- À 01:30, deux repas fictifs identiques datés de l'heure présente dans « Vos saisies » de l'exemple.

## Suite
- Merger la PR de 7b quand ses checks sont verts, build iOS comprise, après avoir regardé les captures iPhone
  `tendances` (clair, sombre, vide, grand texte).
- Puis REFONTE-7c (retrait du code du Journal), puis Nunito (7d).
- Relever l'envoi Alpha de cette nuit et la build TestFlight de 6d chez les testeurs externes.

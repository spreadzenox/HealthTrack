# Refonte « Compagnon », étape 2 (Navigation) : préparation

> Écrit par le run du 15/11 à 03:35, pendant la build macOS de l'étape 1. Relevé du code de main à d5d1ef8 (v1072).
> Le brief fait foi (`../compagnon/BRIEF-REFONTE-COMPAGNON.md` § 4 et § 10.2) : « le contenu existant est simplement
> rangé dans les nouveaux onglets ». Ce qui suit est une proposition de découpage, pas une décision.

## 1. Table des routes (`app/src/App.jsx`)

Aucune adresse ne change à l'étape 2 : seuls la barre d'onglets et l'onglet actif changent. Les adresses qui
disparaissent le font aux étapes 3, 6 et 7, chacune avec sa redirection.

| Route actuelle | Écran | Onglet aujourd'hui | Onglet à l'étape 2 | Plus tard |
|---|---|---|---|---|
| `/` | `Dashboard` | Aujourd'hui | **Accueil** | étape 3 : `TodayCards` part dans Ma journée ; étape 8 : Pilou |
| `/agir`, `/agir/essai/:id` | `Act`, `Trial` | Agir | **Accueil** pour `/agir` (brief : « Agir : 3 pistes à tester » sous les cartes), **Objectifs** pour l'essai | étape 6 : la piste devient un défi dans Objectifs |
| (à créer) `/ma-journee` | `TodayCards` seul | — | **Ma journée** | étape 3 : la vraie checklist |
| `/recommendations`, `/recommendations/ventre` | `Recommendations` | Analyses | **Objectifs** | étape 6 |
| `/reintroduction` | `Reintroduction` | Agir | **Objectifs** | étape 6 : sous Confort digestif |
| `/tendances` | `Trends` | Journal | **Données** (page d'ouverture de l'onglet) | — |
| `/nutrition`, `/food` | `Nutrition`, `Food` | Journal | **Données** | — |
| `/journal` | `Journal` | Journal | **Données** (encore accessible, plus la page d'ouverture) | étape 7 : supprimé, redirigé vers `/tendances` |
| `/bien-etre` | redirige vers `/tendances?vue=jour` | Journal | **Données** | — |
| `/plus`, `/connectors`, `/montre`, `/data`, `/settings`, `/nouveautes`, `/licences`, `/premium` | Réglages | roue | roue, inchangé | — |
| `*` | redirige vers `/` | — | inchangé | — |

## 2. Fichiers à toucher

- `app/src/components/TabBar.jsx` : `TABS` (4 entrées, nouveaux libellés, icônes, `paths`) ; `tabTarget` (Analyses
  s'ouvre sur Digestion avec l'objectif : à garder pour Objectifs) ; ses tests et `App.test`.
- `app/src/App.jsx` : la route de Ma journée.
- `app/src/components/AnalysesTabs.jsx` et `JournalTabs.jsx` (onglets internes : Jours, Tendances, Nutrition) : à l'étape 2,
  Données montre Tendances d'abord ; l'ordre des onglets internes change, le Journal passe en dernier.
- `app/src/services/tour.js` : la visite guidée nomme « Le Journal », « Les analyses », « Agir » et pointe
  `/journal`, `/recommendations`, `/agir` : textes et ordre à reprendre avec les nouveaux noms.
- Textes qui nomment un onglet (« l'onglet Analyses », « dans Agir », « Journal › Tendances ») : à chercher dans
  `app/src` et dans les notes de Nouveautés récentes ; le test `SLOP_WORDING` couvre les nouveaux.
- Captures : `app/scripts/visual/visual-check.mjs` (liste des pages, ligne 171 et suivantes) ;
  `iphone/overlay/app/src/ios/captureMode.js` (`ROUTES`, `DARK_ROUTES`, `EMPTY_ROUTES`, `LARGE_TEXT_ROUTES`,
  et `go('/journal')` ligne 471).
- Correctifs iPhone : parmi `TabBar`, `tour.js`, `App.jsx`, `Dashboard`, `Journal`, `Act`, `Trends`, `TodayCards`,
  `AnalysesTabs` et `JournalTabs`, aucun n'est corrigé ; seuls 26 (`More.jsx`) et 50 (`Recommendations.css`) sont
  voisins. L'étape 2 ne devrait casser aucun correctif.
- Natif Android : aucune route de l'app n'est écrite dans `app/android/app/src/main/java` (recherche de `/journal`,
  `/agir`, `/recommendations`, `/tendances` : rien). Les notifications et le widget ouvrent l'app sans adresse : à
  confirmer en lisant les services de notification (`gutEvening`, rappels) avant de conclure.

## 3. Points à trancher en codant (ou à poser au propriétaire)

1. **Deux « Données »** : l'onglet Données (Tendances) et la ligne Réglages › Données (`/data`, sauvegarde et
   restauration). Le brief range « export » dans Réglages. Proposition : la ligne de Réglages devient
   « Sauvegarde » ; à confirmer, c'est un écran dont le propriétaire s'est dit content le 04/11.
2. **Ma journée à l'étape 2** : le brief demande 4 onglets dès cette étape, mais la checklist est l'étape 3. Le plus
   simple qui tienne : une page qui montre `TodayCards` et le bandeau d'ajout tels qu'ils sont, retirés de l'Accueil.
   L'Accueil garde alors le reste d'Aujourd'hui, puis les pistes d'Agir.
3. **Agir** : l'écran entier sous l'Accueil (lien « Agir : 3 pistes à tester »), ou déjà fondu dans la page. À
   l'étape 2, un lien suffit ; la fusion vient avec l'étape 6.
4. **Icônes** des 4 onglets : rien dans le kit ne les fixe (les chapitres montrent des pictogrammes simples) ; à
   juger sur capture face à `../compagnon/chapitres/`.

## 4. Vérifications prévues

- Tests : onglet actif pour chaque route de la table ; chaque ancienne adresse rend un écran non vide.
- Captures Android (`npm run visual`, aussi `--empty` et `--light`) et iPhone (`captures/pr-<N>`) des 4 onglets,
  clair et sombre, face aux aperçus `../compagnon/chapitres/`.
- Visite guidée rejouée de bout en bout.

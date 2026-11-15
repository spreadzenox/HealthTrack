# Run 15/11 04:35 — Refonte « Compagnon », étape 2 : navigation en 4 onglets

**Type** : code (refonte « Compagnon », étape 2 du § 10 du brief)  ·  **Android** : main 9a99673 (#998, v1074) au début  ·
**TestFlight** : « iOS — TestFlight » vert sur 7fdb159 (code v1072, 04:22) ; soumission bêta lancée à ce run (résultat
en fin de compte rendu) ; 844.344 intacte  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions vérifiée : conforme (710f9e8b…). Brief de la refonte et note de préparation de l'étape 2
  lus en entier.
- Main vert (Tests, Build & Release, Play — AAB, iOS — TestFlight). Aucune PR de la routine ouverte au début ; liste
  des PR relue juste avant d'ouvrir #999 (leçon du run de 03:35). #51 (`cursor/*`) non touchée.

## Fait
1. **Barre d'onglets** (`TabBar.jsx`) : Accueil · Ma journée · Objectifs · Données, nouvelles icônes (maison, liste à
   cocher, cible, courbe). Aucune adresse ne change. `/agir` est sous Accueil, un essai (`/agir/essai/…`) et
   `/reintroduction` sous Objectifs ; `/tendances`, `/nutrition`, `/food`, `/journal`, `/bien-etre` sous Données.
2. **L'ancien Aujourd'hui rangé dans deux onglets** (`Dashboard.jsx`, prop `view`) : **Accueil** (`/`) garde la date,
   les cartes de paiement et de fin de test, le bien-être du jour, les mesures et gagne une ligne « Agir · Vérifier
   une piste par un essai » ; **Ma journée** (`/ma-journee`, nouvelle route) reçoit le bandeau d'ajout, le bloc
   digestif et les repas du jour. « Noter ma digestion » (Journal vide) et « Noter maintenant » (Objectifs ›
   Digestion) ouvrent la fenêtre dans Ma journée.
3. **Données** (`JournalTabs.jsx`) : sous-onglets Tendances, Nutrition, Repas, Jours ; l'onglet s'ouvre sur Tendances.
4. **Réglages › Données devient « Sauvegarde »** (« Exporter et restaurer vos données ») : point 1 de la note de
   préparation, tranché ici pour ne pas avoir deux « Données » ; dit au propriétaire dans le résumé.
5. Textes : carte bien-être (« Notez votre bien-être dans Ma journée »), visite guidée (« Votre Accueil », « Vos
   journées », « Objectifs »), accueil (« Trois usages » : Données, Objectifs, Agir), règle de vocabulaire.
6. Note de Nouveautés `2026-11-15-0435-refonte-navigation.json` (les deux magasins).

## Vérifs
- `app/` : `npm run test` 3579 verts, 44 ignorés, **1 échec une fois** (`App.test.jsx`, « reaches secondary pages »,
  pendant que les captures tournaient sur la même machine) ; le fichier seul passe, deux fois. `npm run lint` sans
  erreur, `npm run build`, `npm run visual` (19 pages ok).
- Captures regardées : Accueil et Ma journée (données de démo, installation vide, sombre), Données › Tendances,
  Réglages.
- iPhone, à blanc : `scripts/upstream.sh` sur le commit de la branche, les 51 correctifs s'appliquent. Tests du code
  embarqué non lancés.

## Limites
- **TDD partiel** : les tests de la barre d'onglets ont été écrits avant le code ; ceux de l'Accueil, de Ma journée
  et des liens ont été adaptés après.
- **Ma journée n'est pas la checklist** (étape 3) : c'est le bandeau et les cartes d'avant, déplacés.
- **L'Accueil d'une installation vide est court** (bien-être, puis « Agir », vide lui aussi au 1er jour).
- **La visite guidée ne passe pas par Ma journée** et n'a pas été rejouée de bout en bout (tests seulement).
- « Vos Analyses » reste écrit dans trois cartes de Sources ; l'écran Réglages › Sauvegarde garde le titre « Vos
  données ».
- Non regardés : Objectifs, Agir, Nutrition, Repas, Jours après le changement de barre (pages ok au rapport, pas
  ouvertes) ; grand texte ; `--light`.
- Pas de maquette du kit pour cette étape : captures jugées seules, non comparées à `chapitres/`.
- Services de notification natifs non lus (point laissé ouvert par la note de préparation).
- Charte, PRODUIT, BACKLOG, DESIGN, INFRA et journal iPhone non relus en entier (plus de 1 Mo) : sections touchées
  seulement ; `iphone/journal/README.md` § 3, 4, 8 non relus.

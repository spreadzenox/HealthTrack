# Run 15/11 09:35 — Refonte « Compagnon », étape 5a : migration des objectifs

**Type** : code (refonte « Compagnon », étape 5 du § 10 du brief, première partie)  ·  **Android** : main 615c891
(#1005, v1080) au début  ·  **TestFlight** : relevé non relancé à ce run (dernier connu, 08:40 : « en test
1072.1073 ; refusées aucune ; en attente aucune »)  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions vérifiée : conforme (710f9e8b…). Les quatre fichiers d'instructions et le brief de la
  refonte lus en entier ; `iphone/README.md` lu jusqu'à « Site ».
- Main 615c891 au début : Tests verts ; émulateur et build iOS sur simulateur de ce commit encore en cours.
- #1006 (run « idées » de 08:35, ouverte depuis moins de 90 minutes) : laissée à ce run-là, qui l'a mergée
  (4deb1cf) pendant que celui-ci codait. Sa préparation (`ETAPE-5-ONBOARDING.md`) a servi de plan. #51 non touchée.

## Fait
1. **Étape 5a sur Android, #1007** (`app/src/settings/onboarding.js`) :
   - `migrateGoals(s, gutRecent)`, pure et idempotente : `goals` devient `wellbeing`, plus `gut` si « Ma digestion »,
     l'ancien « Mon cycle », ou (sans aucun objectif) une note de digestion de moins de 7 jours ; anciens choix
     gardés dans `goalsBefore` ; `goalsVersion: 2`.
   - `ensureGoalsMigrated()` : une fois, au démarrage (`App.jsx`), quand l'accueil est fini ; ne lit la base que
     sans objectif enregistré ; base illisible : rien n'est figé, nouvel essai au lancement suivant.
     `finishOnboarding` migre un accueil terminé ou passé ; `needsOnboarding` lance la migration d'un utilisateur
     existant sans accueil.
   - `wantsGut` : après la migration, seul `gut` compte ; `cycle` n'est plus qu'un marqueur d'affichage du cycle.
   - `OBJECTIVES` (Bien-être verrouillé, Confort digestif) ; `GOALS` reste la liste de l'ancien accueil jusqu'à 5b.
   - Réglages : « Ce qui vous amène » (4 cases) devient « Vos objectifs » (Bien-être « Toujours suivi », Confort
     digestif). Diagnostic exportable : `goalsBefore` ajouté.
   - Note de Nouveautés `2026-11-15-0935-objectifs-bien-etre-digestion.json` (les deux magasins).
2. Journal : résumé, `BACKLOG.md` (REFONTE-5a cochée, 5a-2 ajoutée), `PRODUIT.md`, `PARITE.md`,
   `iphone/journal/BACKLOG.md`.

## Vérifs
- `app/` : `npm run test` 3647 verts, 44 ignorés (suite complète relancée après correction, voir « Écarts ») ;
  `npm run lint` sans erreur ; `npm run build`.
- Tests écrits avant le code : une ligne de la table de migration par test, idempotence, `goalsBefore`, cycle,
  démarrage (accueil pas fini, sans lecture de la base, 7 jours et 8 jours, base illisible, choix de Réglages non
  écrasé), fin d'accueil, utilisateur existant, diagnostic ; Réglages (5 tests).
- Captures regardées (Android, 412 px, données de démo) : Réglages en clair et en sombre.
- iPhone : aucun correctif ne touche les fichiers modifiés (`grep` des en-têtes de `iphone/patches/`).

## Écarts et choix
- **Le marqueur `cycle` reste dans `goals`** (la préparation proposait `goals` réduit à deux identifiants et une
  lecture de `goalsBefore`) : `cycleVisible` et le correctif iPhone 58 lisent `goalsOf().includes('cycle')` ; les
  garder tels quels évite de refaire un correctif. Choix de moi.
- **`used` n'est pas retiré de `gutCardMode`** : il reste le repli d'une installation dont la migration n'a pas
  encore pu lire la base.
- **Sous-titres de la SPEC non repris** : « Pour un ventre sensible : repérer ce qui le soulage. » fait échouer
  `digestifWording.test.js` (aucun texte visible ne dit « ventre », AUJ-7). Je l'avais écrit dans `OBJECTIVES` sans
  l'afficher ; retiré. À trancher en 5b (REFONTE-5a-2).
- La première passe de la suite complète avait 2 échecs (ce texte, et une attente de `Onboarding.test.jsx` sur
  l'ancienne forme de `goals`), corrigés ; la suite complète relancée ensuite est verte.
- Les réglages de l'accueil ne sont pas dans l'export JSON : pas de test d'import d'anciens fichiers (la
  préparation en demandait).

## Limites
- **Une nouvelle installation voit encore les 4 anciennes cases à l'accueil** ; ses choix sont convertis à la fin
  de l'accueil. Qui avait « Prendre soin de moi », « Mon stress et mon sommeil » ou « Tout mesurer » ne les retrouve
  plus dans Réglages (ils restent dans `goalsBefore`).
- Sans objectif et sans note de digestion depuis 7 jours : le confort digestif n'est pas coché ; la personne le
  recoche dans Réglages. Le nombre de testeurs concernés n'est pas connu.
- Les écrans déjà ouverts au moment où la migration se termine gardent l'ancien calcul jusqu'à leur prochain
  affichage (résultat identique par construction, non testé de bout en bout).
- Captures : pas de Réglages avec Confort digestif coché ni avec le rappel du soir ; ni installation vide, ni
  320 px, ni grand texte ; Accueil et Ma journée non recapturés (logique inchangée, non vérifié à l'écran).
- `npm run visual` complet non lancé (seulement `/settings`).
- iPhone : rien d'embarqué pour 5a à ce run ; TestFlight non relevé ; arrivée des builds des codes v1075, v1078 et
  v1080 toujours non vérifiée ; pas de soumission ni d'expiration.
- REFONTE-4b-2 (effet d'une habitude sous-estimé) et REFONTE-4b-iOS toujours ouvertes.
- Non relus en entier : la charte, `PRODUIT.md`, `DESIGN.md`, `INFRA.md`, les deux `BACKLOG.md`, `PARITE.md`,
  `iphone/journal/README.md` (§ 3, 4 et 8), les SPEC hors § 4 de `comprendre`.

## Suite
- Embarquer 5a sur iPhone (`upstream.sh --latest`), regarder Paramètres sur simulateur.
- REFONTE-5b : les 4 temps de l'accueil (et REFONTE-5a-2, REFONTE-5c).
- Relevé TestFlight et vérification de l'arrivée des builds.

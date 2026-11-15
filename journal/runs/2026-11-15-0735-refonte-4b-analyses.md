# Run 15/11 07:35 — Refonte « Compagnon », étape 4b : les habitudes dans les analyses

**Type** : code (refonte « Compagnon », étape 4 du § 10 du brief, seconde moitié)  ·  **Android** : main 410db86
(#1003, v1078) au début  ·  **TestFlight** : relevé de 07:43, « en test 1072.1073 ; refusées aucune ; en attente
aucune » ; 844.344 intacte  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions vérifiée : conforme (710f9e8b…). Les quatre fichiers d'instructions et le brief de la
  refonte lus en entier ; `iphone/README.md` lu jusqu'à « Site ».
- Main 410db86 : Tests, Build & Release, Play — AAB et émulateurs verts.
- #1002 (suivi iPhone des étapes 3 et 4a, code v1078) : build macOS relancée à 07:05 par le run précédent, en cours
  pendant presque tout ce run. #51 non touchée.

## Fait
1. **Étape 4b sur Android, #1004** :
   - `analysisResults.js` : `habitFactors(entries)` rend un facteur `habit_<id>` par habitude qui a des réponses
     (libellé de la dernière réponse, thème `habit`, « pour un jour « oui » ») ; `factorDays` range oui = 1, non = 0,
     sans réponse = inconnu ; `computeAnalysisResults` les ajoute à `FACTORS`. Même pente, même correction de Holm,
     même modèle régularisé et même stabilité que les autres facteurs : rien de propre aux habitudes dans la méthode.
   - Ordre temporel (règle 5) : `ratingCutoffs` (exportée de `analysisEngine.js`) ; un jour noté avant 20 h, une
     réponse saisie plus d'une heure après la note (`HABIT_SAME_SESSION_MS`) reste inconnue ce jour-là.
   - `resultsView.js` et `TrendsDayDetail.jsx` : thème `habit` → ton miel. `trendsDay.js` : « Méditation » plus
     souvent que d'habitude.
   - `localHealthStorage.js` : `ANALYSIS_LIMITS.types.habit = 3000`.
   - `npm run visual -- --habits=history` ; note de Nouveautés `2026-11-15-0735-habitudes-analyses.json` (les deux
     magasins).
2. **Marqueurs de conflit git dans `iphone/journal/BACKLOG.md`** (lignes 17 à 20), laissés par le run précédent dans
   la branche de #1002 : retirés ici, dans #1004 (les corriger dans #1002 aurait relancé une heure de build macOS).
3. **#1002 finie** (suivi iPhone des étapes 3 et 4a, code v1078) : build iOS sur simulateur verte, 15 checks verts,
   branche à jour sur main ; captures iPhone regardées (iPhone 17 Pro : Ma journée en clair, en sombre et sur
   installation vide ; Paramètres avec « Vos habitudes ») ; mergée vers 08:05 (d29ed96).
4. Journal : résumé, `BACKLOG.md` (REFONTE-4b cochée ; 4b-2, 4b-3, 4b-4 ajoutées), `PRODUIT.md`, `PARITE.md`,
   `iphone/journal/BACKLOG.md`. Les fichiers de journal partent de ceux de #1002.

## Vérifs
- `app/` : `npm run test` 3623 verts, 44 ignorés ; `npm run lint` sans erreur ; `npm run build`.
- Tests ajoutés : lien planté positif (net, thème miel) ; lien planté négatif (net, règle 6) ; 10 mondes sans lien
  (aucune habitude nette) ; le résultat est le même avec et sans habitudes (règle 5) ; ordre temporel (avant la
  note, dans l'heure, après, journée notée à 21 h) ; phrase de Tendances.
- Captures regardées (Android, 412 px, clair, données de démo avec un lien fabriqué) : Objectifs (carte et ligne
  miel), Agir (carte miel proposée).
- iPhone : le correctif 32 (seul à toucher un fichier modifié) s'applique (`git apply --check`).

## Écarts et choix
- **Le brief parle d'« analyses »** : les habitudes entrent dans le contrat d'Objectifs (`analysisResults.js`), pas
  dans `computeTagEffects` (`behaviorTags.js`), dont plus aucun écran ne montre le résultat.
- **Toute habitude qui a des réponses** entre, même si elle n'est plus suivie dans Réglages.
- **Tolérance d'une heure** entre la note de bien-être et la réponse : choix de moi, pour que la checklist remplie
  d'un trait compte. L'heure réelle de l'habitude n'est pas connue (REFONTE-4b-4).
- Le texte « pour un jour « oui » » : choix de moi, aucune maquette.

## Limites
- **Effet sous-estimé** : sur 70 jours simulés (3 graines), 0,8 point planté ressort à 0,37, 0,55 (et 0,17 dans le
  monde des tests) ; 0,4 planté ressort entre 0,05 et 0,15 et n'est net qu'une fois sur trois. La fourchette affichée
  ne contient pas la vraie valeur. Je n'ai pas cherché la cause au-delà de l'hypothèse du lissage de TS-1 et de la
  régularisation ; le banc (`method/bench.test.js`) n'a pas été relancé ni étendu à un facteur binaire, alors que le
  BACKLOG demandait « banc des nulles relancé » : seuls 10 mondes sans lien ont été joués (REFONTE-4b-2).
- **TDD non suivi** : les tests ont été écrits après le code.
- L'essai d'Agir sur une habitude garde une consigne de quantité et ne lit pas les réponses (REFONTE-4b-3).
- Les habitudes n'entrent pas dans le rapport médecin ni dans `computeTagEffects` ; non vérifié : la digestion (le
  facteur y entre par le même chemin, aucun test propre).
- La capture d'Objectifs repose sur un lien fabriqué (« oui » les jours de meilleure note) ; `+1,0 pt` n'est pas un
  résultat réaliste. Non regardés : sombre, installation vide, grand texte, 320 px, Tendances (« Ce qui a pu
  peser ») avec une habitude.
- Une réponse importée sans `created_at` d'origine prend la date de l'import : un jour noté avant 20 h, elle est
  alors écartée.
- iPhone, #1002 : aucune capture avec une habitude suivie (les lignes miel n'ont pas été vues sur simulateur) ;
  iPhone 16e et grand texte non regardés ; la build TestFlight du code v1078 non vérifiée.
- iPhone : rien d'embarqué pour 4b ; les correctifs non rejoués en séquence.
- TestFlight : seule la fin du relevé a été lue ; l'arrivée de la build du code v1075 n'est pas vérifiée ;
  `ios-store-push.yml` non lancé ; pas de soumission ni d'expiration à ce run (aucune nouvelle build constatée).
- L'horloge du conteneur retarde sur celle de GitHub : les heures de ce compte rendu sont approximatives.
- Non relus en entier : la charte, `PRODUIT.md`, `DESIGN.md`, `INFRA.md`, les deux `BACKLOG.md`, `PARITE.md`,
  `iphone/journal/README.md` (§ 3, 4 et 8 non relus), `specs/`. `DESIGN.md` ne décrit toujours pas le miel.

## Suite
- Embarquer 4b sur iPhone (`upstream.sh --latest`), regarder Objectifs sur simulateur.
- REFONTE-4b-2 (banc avec un facteur binaire) avant de montrer ces lignes à des testeurs comme fiables.
- Étape 5 : onboarding en 4 temps (le choix des habitudes y entre).

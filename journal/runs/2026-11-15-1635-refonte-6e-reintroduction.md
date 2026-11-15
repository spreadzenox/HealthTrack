# Run 15/11 16:35 — Refonte « Compagnon », étape 6e : la réintroduction sous Confort digestif

**Type** : code (refonte « Compagnon », étape 6 du § 10 du brief, cinquième partie)  ·  **Android** : main 4733021
(#1019, v1092) au début  ·  **TestFlight** : aucun relevé à ce run (dernier connu : 13:43, 1072.1073 chez les
testeurs externes)  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions vérifiée : conforme (710f9e8b…). Lus en entier : les quatre fichiers d'instructions,
  le brief de la refonte, le compte rendu de 15:35, `iphone/README.md`. Lus en partie : le début du résumé de la
  semaine, la charte (routine unique, § 3 et § 4), le bloc REFONTE-6 du `BACKLOG.md`, `ETAPE-6-OBJECTIFS.md`.
- Main 4733021 : Tests, Build & Release (v744), Play — AAB (v1092 en test interne) et émulateur verts.
- Une PR de la routine ouverte : **#1016** (iPhone, code v1092 : 6b, 6c-1 et 6c-2), à jour sur main, 14 checks
  verts, « Build iOS (simulateur) et captures » en cours depuis 16:12. #51 non touchée.

## Fait
1. **Étape 6e sur Android**, préparée pendant la build de #1016 (branche `claude/refonte-6e-reintroduction`,
   gardée ouverte jusqu'au merge de #1016 pour ne pas relancer une heure de build macOS).
   - `pages/Recommendations.jsx` : dans le détail du confort digestif, une ligne « Réintroduction guidée » qui mène
     à `/reintroduction`. Elle dit « Test en cours : le lactose », « À tester d'après vos analyses : les
     fructanes, le lactose » ou « 2 groupes testés ». Elle n'apparaît que dans ces trois cas (leçon 17 : une
     fonction n'apparaît que quand elle sert), y compris avant les premiers résultats si un test existe. Pas dans
     l'exemple fictif, pas sur le bien-être ; une lecture en échec ne montre rien.
   - `services/act.js` : `reintroLine()`, sur les mêmes sections qu'Agir (un seul calcul pour les deux écrans) ;
     chaque section porte le nom du groupe.
   - `pages/Reintroduction.jsx` : le retour est « ← Votre confort digestif » (il était « ← Agir »).
   - note de Nouveautés `2026-11-15-1635-reintroduction-confort-digestif.json` (les deux magasins).
2. Journal : résumé, les deux `BACKLOG.md`, `PRODUIT.md`, `PARITE.md`.

## Vérifs
- Tests écrits et **vus rouges avant le code** : 4 du service, 4 de l'écran, 1 de la page de réintroduction
  (7 rouges sur 9 ; les deux « rien ne s'affiche » passaient déjà). `npm run test` : 3704 verts, 44 ignorés.
  `npm run lint` sans erreur ; `npm run build` ; `npm run visual` complet (21 pages) sans erreur.
- Captures regardées (Android, 412 px, clair) : [le confort digestif avec un test en cours](captures/2026-11-15-1635-refonte-6e-confort-digestif.png),
  [la réintroduction et son retour](captures/2026-11-15-1635-refonte-6e-reintroduction.png), le confort digestif
  avec résultats et sans groupe cité (aucune ligne, comme prévu).
- iPhone : le correctif 50, seul à toucher un fichier modifié (`Recommendations.css`), s'applique (`git apply
  --check`). Rien n'a tourné sur simulateur pour 6e.

## Choix (dits au propriétaire dans le résumé)
- La ligne n'est pas permanente : sans test ni groupe repéré, la réintroduction reste introuvable depuis Objectifs,
  comme elle l'était depuis Agir. C'est la leçon 17 ; le brief dit seulement qu'elle « passe sous Confort digestif ».
- Agir liste toujours les tests (en cours, proposés, terminés) : la même chose à deux endroits jusqu'à ce qu'Agir
  rejoigne l'Accueil (étape 10).

## Limites
- État « À tester d'après vos analyses » jamais capturé : les données de démo ne donnent aucun lien net entre un
  groupe FODMAP et la digestion (testé, pas vu). Ni sombre, ni 320 px, ni grand texte, ni version Play sans
  abonnement (la ligne n'y cite aucun groupe proposé, la page de réintroduction y affiche « Débloquer » : testé
  seulement pour la page).
- Depuis Agir, on arrive sur la réintroduction et le retour mène au confort digestif, pas à Agir.
- Non relus : `PRODUIT.md`, `DESIGN.md`, `INFRA.md`, `PARITE.md` en entier, `iphone/journal/README.md` (§ 3, 4 et
  8). Pas de simulation de personas, pas de relevé TestFlight.

## Suite
- **REFONTE-6e-iOS** : embarquer 6e (code partagé, rien de natif) avec la prochaine PR iPhone.
- REFONTE-6d : le banc à n = 7 et 14 d'abord (run « idées » de 20 h), puis les seuils.
- IOS-HEAD avant l'étape 7.

## Fin de run (17:15)
- **#1016 mergée à 17:12** (c8af00f) : « Build iOS (simulateur) et captures » verte à 17:08, 15 checks verts, à jour
  sur main. Captures regardées sur `captures/pr-1016` (iPhone 17 Pro, clair, données de démo) : le bloc « Par
  famille » (Sommeil, lien moyen), le détail de la famille Sommeil (piste et barres par délai), Agir (« 5 jours
  avec, 5 jours sans, tirés au sort »). Non regardés : iPhone 16e, sombre, grand texte. Agir écrit encore « Tous vos
  essais, vérifiés ou non » alors que le mot « vérifié » a quitté les bilans (à reprendre, REFONTE-6c-3).
- La PR de ce run (#1020) : 12 checks verts sur son premier commit, puis main (c8af00f) repris et journal mis à
  jour ; à merger une fois ses checks verts sur le nouveau commit. L'état après merge (release, « Play — AAB »,
  « iOS — TestFlight » de #1016) est à lire sur main par le run suivant s'il n'est pas dit dans la PR.

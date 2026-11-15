# Run 15/11 14:35 — Refonte « Compagnon », étape 6c, première moitié : le détail d'une famille

**Type** : code (refonte « Compagnon », étape 6 du § 10 du brief, troisième partie)  ·  **Android** : main 3036290
(#1014) au début, 6d86ddf (#1015, v1090) ensuite  ·  **TestFlight** : aucun relevé à ce run (dernier connu : 13:43,
1072.1073 chez les testeurs externes)  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions vérifiée : conforme (710f9e8b…). Lus en entier : les quatre fichiers d'instructions,
  le brief de la refonte, `iphone/README.md`, les comptes rendus de 12:35 et 13:35, la préparation
  `ETAPE-6-OBJECTIFS.md`, le § 6.5 de `specs/comprendre.SPEC.md` (le § 7 en partie). Du résumé de la semaine, le
  début seulement.
- Main 3036290 : Tests, TestFlight et émulateur verts ; build iOS sur simulateur de main en cours.
- Une PR de la routine ouverte : **#1015** (étape 6b, run de 13:35), 12 checks verts sur 44a0b4a, à jour sur main,
  captures regardées par son run. #51 non touchée.

## Fait
1. **#1015 mergée à 14:31** (6d86ddf, v1090), sans rien y changer. « Play — AAB » vert à 14:36 sur ce commit.
2. **Étape 6c-1 sur Android** (branche `claude/refonte-6c-famille`) :
   - `services/influenceFamilies.js` : `familyDetail(outcome, id)`, pur, sur le contrat de la méthode : les
     facteurs de la famille par délai prêt, ses liens nets (un par facteur, au délai où il est le plus fort),
     `bars` (comme « Ce qui va avec » : seulement si la méthode prévoit mieux que la persistance), `count` ;
   - `pages/Recommendations.jsx` et `.css` : dans « Par famille », une famille qui a des facteurs comparés est un
     lien (toute la carte, « › » après le nom) ; l'écran d'une famille : « ← Votre bien-être », le nom, « Piste à
     tester » (la même carte qu'avant, « Essayer dans Agir »), « Ce qui a été comparé » par délai, « Comment c'est
     calculé » ; sans lien net, « Aucun lien assez net pour l'instant dans cette famille. » ; la carte d'une piste
     est devenue un composant (`PisteCard`) ;
   - routes `/recommendations/bien-etre/famille/:family` et `/recommendations/ventre/famille/:family` ; famille
     inconnue, sans facteur, avant les résultats ou pistes floutées : retour au détail de l'objectif ;
   - outil de captures : `/recommendations/bien-etre/famille/sleep` dans le passage complet ;
   - note de Nouveautés `2026-11-15-1435-objectifs-detail-famille.json` (les deux magasins).
3. **Suivi iPhone de 6b ouvert : #1016** (branche `claude/iphone-code-6b`) : `upstream.json` de v1088 à v1090, 51
   correctifs sans retouche ; `SUBSCRIBED_ROUTES` dans `overlay/app/src/ios/captureMode.js` : une capture
   `demo-clair-recommendations-bien-etre-abonne` avec des droits de démonstration (Silver) posés pour cette seule
   page et retirés avant la suivante, parce que sans abonnement « Par famille » est masqué.
4. Journal : résumé, les deux `BACKLOG.md`, `PRODUIT.md`, `PARITE.md`.

## Vérifs
- `app/` : `npm run test` 3687 verts, 44 ignorés ; `npm run lint` sans erreur ; `npm run build` ; `npm run visual`
  complet (21 pages) sans erreur ni avertissement.
- Tests du service (4 cas) écrits et vus rouges **avant** `familyDetail`. Tests de l'écran (4 cas, plus 1 pour la
  version Play sans abonnement) écrits dans la même commande que l'écran : jamais vus rouges.
- Un avertissement de l'outil de captures corrigé en route : « CIBLE < 44 px » sur le nom de la famille quand seul
  le nom était le lien ; la carte entière est maintenant le lien.
- Captures regardées (Android, 412 px, données de démo) : détail du bien-être avec les trois familles en liens
  (clair) ; Sommeil (clair, haut de page) ; Habitudes avec `--habits=history` (sombre) ; Alimentation sans lien net
  (sombre, haut de page) ; sans aucune donnée, l'adresse d'une famille ramène au compte à rebours du bien-être.
- iPhone (#1016), dans `upstream/app` (code v1090 et correctifs) : `subscriptionFake` (5 cas), `billingFake`,
  `captureMode*`, `Recommendations*` : 98 verts ; lint propre sur les 2 fichiers. Le test a trouvé un défaut,
  corrigé : une réponse tardive du vrai relais repassait les écrans sur « sans abonnement ».
- Le correctif 50 (`Recommendations.css`), seul correctif iPhone à toucher un fichier de 6c-1, s'applique.

## Écarts et choix (dits au propriétaire dans le résumé)
- Pas l'histoire du sommeil de la SPEC § 6.5 (14 nuits en barres, deux moyennes, « 40 min de moins ») : toute
  famille montre les barres que la méthode calcule déjà.
- La piste mène toujours à l'essai d'Agir (tirage au sort d'ORG-8). Le défi doux de 5 soirs est 6c-2 ; question
  posée au propriétaire (tirage gardé ou comparaison aux 14 nuits habituelles).
- « Un lien, pas une preuve » non affiché sur l'écran d'une famille (SLOP-1 le refuse hors « Comment c'est
  calculé », qui reste en bas de l'écran).

## Limites
- L'écran d'une famille répète une partie du détail de l'objectif (mêmes barres, même carte de piste).
- Il montre tous les facteurs de la famille, sans le plafond de 5 par délai du détail de l'objectif : Alimentation
  fait trois écrans.
- Sur les données de démo, « Méditation » affiche « −3,3 pt » à long terme, hachuré : chiffre non net et très
  grand, déjà présent dans le détail de l'objectif ; noté REFONTE-6c-3, pas corrigé.
- États jamais capturés : une famille du confort digestif, une famille sans barres (`bars` faux : la phrase « N
  facteurs comparés » a un chemin de code mais ni test d'écran ni capture), plusieurs pistes dans une famille.
- Captures non regardées : 320 px, grand texte, version Play, les écrans suivants de Sommeil et d'Alimentation, les
  19 autres pages du passage complet (lancé pour ses erreurs).
- iPhone : rien n'a tourné sur simulateur pour #1016 à l'écriture de ce compte rendu ; la suite complète de la
  variante iPhone n'a pas été lancée en local. 6c-1 n'est pas embarquée.
- Non relus : la charte, `PRODUIT.md`, `DESIGN.md`, `INFRA.md`, les deux `BACKLOG.md`, `PARITE.md`,
  `iphone/journal/README.md` (§ 3, 4 et 8).
- Pas de simulation de personas, pas de relevé TestFlight, arrivée des builds chez Apple non vérifiée à ce run.

## Suite
- Finir #1016 (build simulateur, capture d'abonné regardée, merge), puis REFONTE-6c-1-iOS.
- REFONTE-6c-2 (défi doux) selon la réponse du propriétaire ; 6d demande d'abord le banc à n = 7 et 14.

## Fin de run (vers 14:55)
- **Après #1015** (6d86ddf) : « Build & Release » vert, **release v742**, APK 34,6 Mo ; « Play — AAB » vert (v1090
  en test interne).
- **#1017** (cette étape) ouverte, checks en cours à l'écriture de ces lignes ; merge après les checks verts
  (état final : voir la PR). Si elle est encore ouverte au run suivant : la finir.
- **#1016** (6b sur iPhone) ouverte, build macOS en cours (près d'une heure) : à finir par le run suivant.

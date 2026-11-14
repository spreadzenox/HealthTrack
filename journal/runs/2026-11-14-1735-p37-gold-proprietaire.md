# Run 14/11 17:35 — Réponses du 14/11 : P37 au relais, P44 découpée

**Type** : code (relais et journal, décisions du propriétaire)  ·  **Android** : v1054 sur main au début  ·
**TestFlight** : 1030.1031 chez les testeurs externes (depuis le 14/11 à 00:33), d'après le journal ; pas de relevé
refait à ce run ; aucune soumission bêta avant la nuit prochaine ; 844.344 intacte  ·  **Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme (921d17b8…).
- Main d26ab8a (#977, instructions de l'orchestrateur) : Build & Release, Tests, Play — AAB et émulateur A56 verts.
- PR ouvertes : #976 (suivi iPhone du run précédent, 15 checks verts dont la build iOS finie à 17:27, mais en retard
  de deux commits sur main : #978 et #977) ; #979 (orchestrateur, `orchestration/` : non touchée) ; #51
  (`cursor/*`, non touchée).
- Nouvelles instructions depuis le run précédent : réponses du propriétaire du 14/11 vers 16:50 (P44, P37,
  Tendances › Jour), missions P43, P46, P39, P45 faites par l'orchestrateur, nouvelle répartition des missions.

## Fait
1. **GOLD-a3-2 (« P37 oui confirmé »)** : `GOLD_INSTALLS=5e4a69f72ffb` dans `--set-env-vars` de
   `.github/workflows/relay-deploy.yml`. Test de garde écrit d'abord (rouge sans la variable) dans
   `relay/test/workflow.test.js` : la liste lue par `loadConfig` ne contient que cette empreinte.
2. **Constat en lisant le relais** : `GOLD_INSTALLS` ne change que le modèle servi (`tierOf`). Hors période de
   lancement, l'installation listée garde les crédits gratuits et l'app reçoit `premium: false`. Le propriétaire ne
   « garde » donc pas encore Gold au sens de l'app ; sans effet avant le 02/12 (période générale). Suite écrite :
   GOLD-a3-3.
3. **P44 (« P44 oui »)** : découpée au BACKLOG en P44-1 (relais : période offerte par installation), P44-2 (relevé
   des empreintes qui ont analysé un repas pendant le test) et P44-3 (textes et vérification dans l'app). Rien n'est
   en service à ce run.
4. **Journal** : P43, P46, P39 et P45 passées à « fait » (PRODUIT.md § 4.0 et tableau, index des missions) et retirées
   de « Toujours en attente de vous » avec P37 et P44 ; question Tendances › Jour retirée ; bloc « À faire par
   l'orchestrateur » ajouté au résumé ; « prochaine action du propriétaire » : rien aujourd'hui.
5. Pas de note de Nouveautés : rien de visible dans l'app.

## Vérifs
- `relay` : `npm test`, 225 tests verts (224 avant). Le nouveau test échoue sans la variable (vérifié en retirant le
  changement du workflow).
- `app` (aucun fichier touché) : `npm run test`, 3548 verts, 44 ignorés ; `npm run lint`, aucune erreur ; `npm run build`
  passe ; `npm run visual`, 18 pages « ok », aucune erreur JavaScript. Aucune capture regardée : aucun écran ne change.

## Limites
- **Instructions changées pendant le run** : #979 (orchestrateur, « PI1 faite ») est arrivée sur main à 17:52,
  après le contrôle d'empreinte de ce run (921d17b8…). Je n'ai pas agi sur ce nouveau texte : le résumé dit seulement
  que le relevé PI1 est arrivé ; le run suivant, lancé avec la nouvelle empreinte, en tire la suite (PI2, encadré
  « Declare Your Regulated Medical Device »).
- GOLD-a3-2 n'est pas vérifiée en production à l'écriture de ce compte rendu : le déploiement du relais part au
  merge (voir « Fin du run »). Aucune analyse réelle du téléphone du propriétaire n'est observée avec la variable.
- L'empreinte inscrite est celle lue dans les journaux le 03/11 ; le propriétaire a confirmé les quatre premiers
  caractères, pas les douze. S'il réinstalle l'app, l'empreinte change.
- Les fichiers `journal/missions/P43.md`, `P46.md`, `P39.md` et `P45.md` gardent leur texte adressé au
  propriétaire ; seul l'index dit qu'elles sont faites.
- La charte (`journal/README.md`, sous le résumé) ne dit pas encore « qui fait les missions » : inscrit dans
  PRODUIT.md § 4 (ligne du 14/11 17:35) et dans l'index des missions seulement.
- Charte, PRODUIT, BACKLOG, PARITE lus par sections, pas en entier (plus de 1 Mo) ; `iphone/README.md` relu ;
  `iphone/journal/README.md` et `BACKLOG.md` iPhone, `DESIGN.md` et `INFRA.md` non relus à ce run.
- Captures iPhone de #976 (`captures/pr-976`) : une seule regardée (accueil, écran 02/07 « Qu'est-ce qui vous
  amène ? », normal). La première carte (« vos appareils ») et l'écran « Sans Santé » (« Continuer ») ne sont pas
  dans les captures automatiques : le changement de #975 n'est pas vu sur iPhone.

## Fin du run
- **PR #980 mergée à 18:15** (7b749a2, v1056), 12 checks verts, branche à jour sur main (après #979). Elle est
  passée avant #976 pour que #976 ne reprenne pas de retard.
- **Après le merge** : « Relais — déploiement » vert, révision `halcya-relay-00052-gpm` à 100 % du trafic, la ligne
  `--set-env-vars` du log contient la variable, analyse de test passée. Build & Release vert : release v725, APK
  34,6 Mo. Tests et Play — AAB verts ; l'émulateur A56 tournait encore à 18:21.
- **P43 vérifiée** : le bilan de ce « Play — AAB » lit Android vitals (« Aucun plantage ni ANR signalé par Google
  sur 30 jours »). VITALS-1 peut s'en servir.
- **PR #976** (suivi iPhone) : non mergée à ce run, elle n'était plus à jour sur main. Remise à jour à 18:17,
  `upstream.json` de v1052 à v1054 (pesée du jour comprise), 52 correctifs sans retouche (`upstream.sh --latest`) ;
  ce compte rendu y est ajouté à 18:25, ce qui relance sa build macOS (près d'une heure) : à finir au run suivant.
- Aucune analyse réelle du téléphone du propriétaire n'est observée avec la variable (limite inchangée).

## Suite
- PI1 (relevé du 14/11 vers 17:15, dans les instructions depuis #979) : en tirer la suite au prochain run.
- GOLD-a3-3 puis P44-1 (même mécanisme), P44-2 sans attendre (durée de conservation des journaux), avant le 02/12.
- VITALS-1 : se servir de la lecture des plantages (P43 vérifiée à ce run).
- Finir #976 (suivi iPhone) : build iOS verte après la remise à jour, captures de l'accueil regardées, merge avant
  toute autre PR.
- POLISH-SIM-84b, 87b, 86b, 85 ; POLISH-SIM-72-iOS-c ; fin de POLISH-SIM-69 ; FUSION-2 ; POLISH-SIM-71b ; CYCLE-3a-2.
- Run « idées » de 20 h : maquettes de PROP-SIM-17 et PROP-SIM-18, simulation de personas.
- Nuit prochaine, après l'Alpha de 23:45 : soumettre la dernière build TestFlight traitée, puis expirer les anciennes.

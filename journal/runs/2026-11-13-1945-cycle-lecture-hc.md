# Run 13/11 19:45 — Cycle : les règles de Health Connect, côté app (CYCLE-3a-1)

**Type** : code (exception « cycle » au mode polish, décision du propriétaire du 10/11). Rien de visible.

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée avant de les suivre. Aucune PR « [Auto] » ouverte
  (#945 « [Fusion] », brouillon d'une autre session, et #51 `cursor/*` ne sont pas touchées). Sur main c9f79e4 :
  Tests, Build & Release, Play — AAB et émulateur A56 verts.
- Les constats de simulation encore ouverts sont des corrections d'outil (POLISH-SIM-63 à 66) ou des propositions
  avec maquette. CYCLE-3 attendait depuis le 10/11 : P48 ne peut être demandée au propriétaire qu'une fois la
  lecture prête, donc ce run commence CYCLE-3a.

## Fait
- `connectors/healthConnectCycle.js` (nouveau) : `cycleEntriesFromHealthConnect({ periods, flows })` rend un « jour
  de règles » par jour local (`periodEntry`, source `health_connect`, `connector` et `sourceName` dans le payload).
  Une fin de période à minuit pile reste au jour d'avant ; le flux du jour vient du dernier flux connu (constantes
  de Health Connect 0 à 3) ; un flux sans période est un jour de règles ; une période de plus de 15 jours, inversée
  ou sans date lisible est écartée. `readCycleEntries(bridge, fenêtre)` ne lit que si l'autorisation est déjà donnée.
- Contrat du pont natif `HealthCycle` écrit en tête de ce fichier (`checkPermission`, `requestPermission`, `read`).
- `HealthConnectConnector.sync` : après les mesures, lit les règles par `getCycleBridge()` (`Capacitor.Plugins`,
  seulement si `isPluginAvailable('HealthCycle')`). Sans pont (partout aujourd'hui) : rien n'est appelé.
- `services/cycle.js` : `supersedes` ; un jour de règles saisi dans l'app l'emporte sur un import du même jour
  (`cycleByDay`, `periodEntryOn`), même si l'import est arrivé après. Avant, un import plus récent au flux inconnu
  aurait effacé le flux choisi. Routine iOS prévenue (`POUR-IOS.md`, code partagé).
- Pas d'entrée Nouveautés : aucun changement visible, aucune autorisation ajoutée, aucun appel réseau.

## Vérifs
- Tests écrits avant le code : `healthConnectCycle.test.js` (11), `cycle.test.js` (+2), `HealthConnectConnector.test.js`
  (+3), sur des enregistrements synthétiques. `npm run test` (3502 verts), `npm run lint` (0 erreur), `npm run build`,
  `npm run visual` complet sans erreur ; `journal-1.png` lu (inchangé, la démo n'a pas de cycle).

## Limites
- Aucun code natif : rien n'est encore lu sur un téléphone. Le contrat du pont n'a pas été essayé contre Health
  Connect ; CYCLE-3a-2 le fera (test instrumenté).
- L'import ne réécrit pas un jour déjà rangé : un flux ajouté après coup dans l'autre app n'est pas repris, et un jour
  importé supprimé dans le Journal reviendrait à la synchro suivante (noté dans CYCLE-3a-3).
- `DEMANDES.md` du dépôt iOS non lu (dépôt hors de portée de cette session).

## Suite
- CYCLE-3a-2 (pont natif Java, variante sideload), puis CYCLE-3a-3 (demande d'autorisation sur un geste), puis
  « P48 maintenant » au propriétaire et CYCLE-3b.
- POLISH-SIM-63 à 66 (outil), JOURNAL-CAPTURES-1, PROP-SIM-15. Deux simulations de personas au run « idées » de 20 h.

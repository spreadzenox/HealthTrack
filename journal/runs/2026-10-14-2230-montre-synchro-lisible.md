# 2026-10-14 22:30 Paris (20:30 UTC) — Montre : synchro qui dit où elle cale (I69)

**Type** : ⌚ D3 (priorité absolue)  ·  **PR** : « [Auto] Montre : une lecture qui cale n'arrête plus la synchro »

## Pourquoi
- Démarrage : main à `8489b15` (#160, journal seul), v128 publiée (Build & Release de #159 vert ; Tests et émulateur
  A56 verts sur #160). Aucune PR « [Auto] » rouge ou en conflit (seule PR ouverte : `cursor/*` #51, non touchée).
  Aucune issue, aucun nouveau journal du propriétaire depuis v124.
- Suite proposée par le run idées de 20:30 : coder **I69** (score 25) pour que le prochain journal suffise si
  l'historique reste vide.
- En relisant `sync.js`, j'ai trouvé un **vrai défaut** : la lecture était séquentielle et sans filet. Un sommeil sans
  réponse (7/0x0C), un bloc minute muet ou une seule minute tronquée (`Minute tronquée`) faisait **échouer toute la
  synchro**, minutes, totaux et séances compris. Avec une montre réelle qui tarde sur un service, on aurait eu 0 mesure
  sans savoir pourquoi.

## Ce qui a été fait
- `devices/huawei/sync.js` :
  - chaque lecture (sommeil, minutes, totaux du jour, séances, sommeil détaillé) passe par `attempt` : un échec est
    consigné et la synchro continue ;
  - `report.sync.services[]` = `{ id, label, command, outcome, count, units?, failed? }`, avec `outcome` parmi ok,
    empty, timeout, refused, unsupported et error. Seulement des nombres, jamais de valeur ;
  - `readBlocks` : un bloc sans réponse arrête ce service mais garde ce qui est lu. Les blocs suivants ne sont pas
    tentés, pour éviter N délais d'attente. Un bloc refusé ou illisible est sauté ;
  - `parseMinuteBlock` saute une minute plus courte que son masque ; `readWorkouts` saute une séance illisible
    (#5784, §7.10) ;
  - `syncHints` : 0x2C déclaré mais muet → piste du canal auxiliaire ; aucun bloc minute alors que les totaux ont des
    pas ; aucune lecture n'aboutit → liaison instable. Ces pistes sont écrites dans le journal ;
  - ligne `lectures : …` dans le journal de connexion.
- `services/watchSync.js` : `stalled`, `services` et `hints` sont ajoutés au résultat, et le libellé finit par
  « · sans réponse : sommeil ». `pairing.js` : l'étape « Lecture des mesures » passe en avertissement si une lecture a
  calé. `watchAutoSync.js` : `stalled` est gardé dans l'état, et la carte affiche « sans réponse de la montre pour : … »
  avec le ton d'avertissement.
- Plan B : le texte « 17 à 19 chiffres » devient « 15 à 20 chiffres », comme `normalizeAccountId` et les
  identifiants observés (16 à 18).
- Fausse montre : totaux vides par défaut (une vraie montre répond), `silentTotals`, `silentBlock`.
  `npm run visual -- --connect=stalled` ajouté.

## Vérifications
- Tests : **1200 ✅** (92 fichiers ; +5). Cas couverts : sommeil muet → minutes quand même lues ; bloc minute muet →
  bloc 0 gardé, un seul essai de plus ; minute tronquée sautée ; séance illisible sautée ; `outcomeOf` ; pistes ; état
  « sans réponse ». Build ✅. Lint : **6 erreurs** (baseline inchangée).
- `npm run visual` (démo, 8 pages) : aucune erreur JS ; `connectors-1` est inchangée.
  `--routes=/connectors --ble=watch --connect=stalled` : capture relue, la ligne d'état montre « rien de nouveau · sans
  réponse de la montre pour : sommeil ».

## Apprentissages / décisions
- « Aucune trame nouvelle » : I69 ne fait que nommer ce qui se passe déjà. Le canal RFCOMM auxiliaire n'est **pas**
  codé à l'aveugle, seulement si un journal montre 0x2C sans réponse.
- Le stress n'est pas encore lu par HealthTrack, donc pas de message « stress à activer » pour l'instant.

## Suite proposée
1. ⌚ Lire le prochain journal (v129+) : `sync.services` dit mesure par mesure ce que rend la GT 6 Pro.
2. ⌚ D3 (d quater) arrière-plan app fermée (I72), si les mesures arrivent.
3. ⚡ D2 : `WellbeingCharts` par agrégats ; 🧹 D1 avec I65 ; 🔁 D5 avec I70.

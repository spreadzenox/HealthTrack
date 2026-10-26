# Run du 26/10/2026 01:33 (Paris, CET) — I170 étape 2 : bilan du ventre du soir par notification

**Type** : 🏗️ jalon 5 (un changement visible : carte « Votre ventre » le soir, Paramètres, notification Android)

## Constat au démarrage
- Main à `e857787` (#383) ; Build & Release, Play — AAB, Tests, émulateur verts. Aucune PR « [Auto] » ouverte
  (#51 `cursor/*` non touchée).

## Ce qui a été fait
- **Natif** (même mécanisme que la note du soir I113) :
  - `gut/GutEvening.java` (règle pure) : mêmes raisons de se taire que `mood/EveningNote` (éteint, bilan fait, déjà
    demandé, alarme retardée de plus de 2 h) ; 20 h par défaut, heure bornée 18–23 h ; la notification **disparaît
    avant minuit** (une réponse après minuit parlerait du mauvais jour) ; la boîte ne garde que `{ v, level, at }`.
  - `GutEveningNotice.java` : alarme inexacte tenue en Doze, canal bas « Bilan du ventre », notification « Et votre
    ventre aujourd'hui ? » avec **3 actions natives** Calme / Gêne / Douleur (pas de vue personnalisée), « Bilan du
    jour : Gêne » éphémère après le geste ; boîte `gut-evening/`.
  - `GutEveningPlugin.java` (`status`, `configure`, `list`, `remove`, `requestNotifications` partagé avec
    `EveningNotePlugin`) ; actions ajoutées à `EveningNoteReceiver` (non exporté), réarmement au démarrage dans
    `EveningNoteBootReceiver`. Aucune nouvelle permission (POST_NOTIFICATIONS déjà déclarée).
- **JS** : `services/gutEvening.js` — choix de la personne gardé en local (`healthtrack_gut_evening`), **état effectif
  = choix × carte ventre** (`gutCardMode` ≠ `hide`, POL-4) : changer d'objectif coupe le natif sans oublier le choix ;
  heure apprise des bilans (`learnEveningMinute`, extraite de `eveningNote.js`), dernier bilan transmis ; import
  par `drainNativeInbox` (extraite de `eveningNote.js`, même logique sans doublon). Bilan importé = même entrée qu'un
  geste dans la carte (`gut`, `app_gut`, `payload: { level, scope: 'day' }`) : même export / import.
- **Interface** : `GutEveningReminder` — dans la carte pêche le soir, une ligne discrète « Me le demander chaque soir
  par notification » (seulement dans l'app Android, plus rien une fois choisi) ; dans Paramètres → Ce qui vous
  amène, l'interrupteur « Bilan du ventre le soir… » avec l'heure prévue, seulement avec la carte ventre.
- `useAutoSync` : import + synchro à l'ouverture, au retour dans l'app et après chaque saisie. Captures :
  `--gut-evening[=on]`.
- Formulaire Sécurité des données : **inchangé** (rien ne sort du téléphone, aucune nouvelle donnée collectée).

## Tests
- `gutEvening.test.js` (+12) ; `TodayCards.test.jsx` (+3) ; `Settings.test.jsx` (+1) ; `eveningNote.test.js`
  inchangé et vert après l'extraction. Java : `GutEveningTest` (+6), avec `EveningNoteTest` : 15 verts (javac + JUnit).
  Les classes Android (Notice, Plugin, Receivers) sont compilées par le check « Build APK ».

## Vérifications
- `npm run test` : 184 fichiers, 2 256 verts (+ 14 sautés : le banc) ; `npm run build` OK ; lint 6 erreurs
  (inchangé).
- Captures lues : Accueil le soir (`--tz=America/New_York --gut-evening`) clair et sombre (ligne soulignée pêche,
  sous les trois bilans, hiérarchie nette) ; après le geste : « C'est noté : rappel chaque soir vers 20 h » ;
  Paramètres (`--gut-evening=on`) : interrupteur et « Vers 20 h, seulement si le bilan du jour n'est pas déjà fait ».

## À tester par le propriétaire (sur le téléphone, objectif « Mon ventre »)
- Un soir, toucher « Me le demander chaque soir par notification », accepter les notifications ; le lendemain vers
  20 h : notification avec Calme / Gêne / Douleur ; répondre sans ouvrir l'app ; à l'ouverture, la carte affiche
  « Bilan du jour : … ». Pas de notification un soir où le bilan est déjà fait.

## Suite
- **I170 étape 3** : analyse jour par jour (bilan du jour j ↔ aliments des jours j et j − 1 ; blocs + TTS), puis
  affichage des pistes ventre dans Analyses (avec I171 a/b).

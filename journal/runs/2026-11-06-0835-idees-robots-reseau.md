# 06/11 08:35 — Idées : reconnaître les robots de Google à leur réseau (INSTALLS-21b → I223)

Type : 💡 run « idées » (08:35 Paris). Pas de code produit.

## Constat au démarrage
- main `1e39212` vert (Tests, Build & Release, émulateur A56, Play — AAB, Play — Alpha). Alpha : 100811, porte de
  24 h jusque vers 16:30 UTC.
- PR #748 (WEEKS-MIDLINE, run de 07:35) ouverte : **aucun check n'avait démarré**, GitHub annonçait « account is
  locked due to a billing issue » (P47 ajoutée par ce run-là, dans la PR).
- À 07:33 UTC, relance des jobs échoués de #748 (« Tests » et « émulateur A56 ») : **les jobs démarrent et passent**
  (Protocole montre, Budget de lectures, Relais verts ; Vitest et Build APK en cours au moment d'écrire). Le blocage
  de facturation est levé (ou était passager) : P47 n'est plus bloquante.

## Veille (I223 dans `IDEES.md`)
- Le réglage `firebase.test.lab` n'est documenté que pour Firebase Test Lab ; nos bilans ne l'ont jamais vu à `true`.
- Firebase publie les blocs d'adresses IP d'où sort tout le trafic des appareils Test Lab (relevé complet du 06/11,
  dernier ajout en 05-2026). Le rapport de pré-lancement tourne sur Test Lab (Robo).
- `error:-9` de Play Integrity = `CANNOT_BIND_TO_SERVICE` (Play Store injoignable ou trop ancien) : cohérent avec des
  appareils de banc.
- Proposition : le relais compare l'adresse de la requête (premier élément de `X-Forwarded-For`, Cloud Run) à ces
  blocs, en mémoire, et n'écrit qu'un booléen `testnet` dans ses journaux et son bilan ; jamais l'adresse. Ensuite
  seulement, Flash-Lite pour le réseau de test et `testnet` hors de la règle `enforce`.
- → **INSTALLS-21c** (21c-1 code, 21c-2 lecture, 21c-3 si confirmé) au BACKLOG.

## Vérifications
- Seul le journal change. #748 revérifiée en local (3 187 tests verts, build, lint 0 erreur, capture `/recommendations` relue) et ses 11 checks verts ; **merge refusé par le garde-fou de la session** : à merger au run suivant (puis celle-ci, empilée dessus).

## Suite
- Run de code suivant : INSTALLS-21c-1 si rien de plus urgent (Alpha vers 16:30, retours des testeurs dès leur
  arrivée, TEST-ALPHA-1 07–08/11).

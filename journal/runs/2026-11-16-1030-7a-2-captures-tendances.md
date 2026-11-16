# Run 16/11 10:30 — #1036 mergée ; restes 7a-2 et 7b-2 (3) : captures de Tendances

**Type** : run de code  ·  **Android** : main vert avant le run (Tests, émulateurs sur 54d6a66) ; merge de #1036 à
09:35 UTC (1957e16)  ·  **TestFlight** : 1107.1107 soumise à l'examen bêta à 07:37 UTC (run de 08:30), à relever  ·
**Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions conforme (69177875…). Lus en entier : les quatre fichiers d'instructions, le brief de la
  refonte, le compte rendu de 08:30, la fiche de l'étape 7d, l'étape 7 du BACKLOG.
- PR de la routine ouverte : **#1036** (7c-2 (3), « Hier » dans Ma journée, ouverte à 08:38 UTC par le run de 09:30) :
  14 checks verts, build iOS comprise ; base = main. #51 (cursor) pas touchée.

## Fait
0. **#1036 mergée** (squash, 1957e16) après 14 checks verts ; captures iPhone 16e `demo-clair-ma-journee`,
   `demo-sombre-ma-journee` regardées : propres ; la carte « Hier » n'y paraît pas, attendu (la démo ne suit aucune
   habitude, règle « rien sans habitude suivie »). Étape 7c soldée.
1. **REFONTE-7b-2 (3) et 7a-2, plan de captures iPhone** (`iphone/overlay/app/src/ios/captureMode.js`) :
   - `demo-clair-tendances-jour-veille` : Tendances, « Jour » puis « Jour précédent » ; `REVEALS` accepte une suite
     de boutons, trouvés par texte, libellé d'accessibilité ou motif (`findButton`, `clickInOrder`) ; un bouton
     introuvable est noté dans la console.
   - `vide-tendances-visite` : base vide, accueil fini à l'instant (`justNow`), « Voir un exemple » puis
     « Exemple au jour N », 8 s d'attente (l'exemple attend le calcul d'Analyses). `prepare` garde l'accueil demandé
     par l'étape au lieu de celui des captures.
   - 4 tests (plan, boutons, ordre, accueil gardé) ; 62 tests du mode captures verts, lint propre.
2. **7a-2, côté Android** : Tendances › Jour › veille capturée sur historique presque vide (`--history-days=2`), en
   grand texte (`--play --font-scale=1.5`) et à 320 px (`--play --size=320x640`) : propre, aucune erreur JS.
3. BACKLOG, résumé de la semaine.

## Suite
- Merger cette PR après « iOS — build simulateur » et regarder les deux nouvelles captures iPhone.
- Puis **7d** (Nunito et fond crème) d'après la fiche ; puis passage des personas avant le 22/11.
- Relever l'examen bêta de 1107.1107 ; quand elle est chez les testeurs, expirer les anciennes.

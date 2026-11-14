# Run 14/11 02:35 — La sauvegarde s'appelle « halcya-export » (POLISH-SIM-73) ; iPhone en v1034

**Type** : code (mode polish) et suivi iPhone  ·  **Android** : v1035 sur main après ce run  ·
**TestFlight** : 1030.1031 (version 893) chez les testeurs externes depuis le 14/11 à 00:33 ; **1032.1033** (code de
la v1032) envoyée le 14/11 à 01:41 (« iOS — TestFlight » vert, envoi accepté), pas encore soumise à l'examen bêta
(une soumission par jour, après l'Alpha de 23:45) ; 844.344 intacte  ·  **Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main 42a9ee7 vert (Tests, Build & Release, Play — AAB, émulateur A56 ; « iOS — build simulateur » de #955 vert sur
  main). Aucune PR « [Auto] » ouverte (#51 `cursor/*` non touchée).
- L'envoi Alpha du soir (cron de 23:45 du 13/11) n'était pas parti à 02:45 : dernier « Play — Alpha » le 13/11 à
  03:56, vert.

## Fait
1. **POLISH-SIM-73** (persona « Tout mesurer » J45) : la sauvegarde téléchargée depuis Vos données s'appelait
   `healthtrack-export-AAAA-MM-JJ.json`. Elle s'appelle `halcya-export-AAAA-MM-JJ.json`.
   - `config/brand.js` : `EXPORT_FILE_PREFIX`, dérivé de `APP_NAME` (le commentaire dit que c'est la seule exception
     à « jamais dans un nom de fichier ») ; `Data.jsx` l'utilise. Rien d'autre ne change dans l'export.
   - L'import ne lit pas le nom du fichier : test ajouté avec trois noms (ancien, nouveau, quelconque).
   - iPhone : la sonde de l'export par la feuille de partage (`iphone/overlay/app/src/ios/captureMode.js`) comptait
     les fichiers `healthtrack-export-*` ; elle compte les deux noms, pour rester juste avant et après le suivi de la
     v1035. Aucun correctif de `iphone/patches/` ne contient ce nom.
   - `analyze-export.js` (outil du dépôt) : exemple d'usage mis au nouveau nom.
   - Nouveautés : `2026-11-14-0235-sauvegarde-nom-halcya.json` (code partagé : Android et iPhone).
2. **Suivi iPhone** : `scripts/upstream.sh --latest` : v1032 → v1034 (42a9ee7 : POLISH-SIM-70 et 69). Les 52
   correctifs s'appliquent sans retouche.

## Vérifs
- Tests écrits d'abord (4 rouges, puis verts) : `Data.test.jsx` (+3). `npm run test` : 3514 verts, 44 ignorés.
  `npm run lint` : 0 erreur. `npm run build` : vert. `npm run visual` complet (18 pages) : aucune erreur.
- Le test VC-5 des Nouveautés a refusé ma première rédaction (elle citait l'ancien nom du fichier) : note réécrite
  sans ce mot.
- Vos données après « Télécharger la sauvegarde », variante play :
  [clair](captures/2026-11-14-0235-sauvegarde-nom-clair.png),
  [sombre](captures/2026-11-14-0235-sauvegarde-nom-sombre.png) : « halcya-export-2026-11-14.json téléchargé. »
- Code embarqué v1034 avec les 52 correctifs et l'overlay modifié (`iphone/upstream/app`) : Vitest 3870 verts (44
  ignorés), ESLint 0 erreur.
- La PR change `iphone/upstream.json` et `iphone/overlay/` : « iOS — build simulateur » (près d'une heure) et ses
  captures `captures/pr-<N>` (Agir, Analyses, Vos données) doivent être vertes et regardées avant le merge. Si ce
  compte rendu est sur main, c'était le cas.

## Limites
- Sur Android, le texte après l'export (« …enregistré dans Documents ») n'est vérifié que par test, pas sur
  l'émulateur.
- Les fichiers du mode diagnostic caché (`healthtrack-visage-…`, `healthtrack-journal-montre-…`,
  `healthtrack-debug-…`) gardent leur nom : hors de la vue normale, et leurs champs `format` servent d'identifiant.
- Le nom de la sauvegarde sur iPhone ne changera qu'au suivi de la v1035 (le code embarqué de cette PR est la v1034).
- Le merge de cette PR lance une build TestFlight (code v1034). Elle ne sera pas soumise avant la nuit prochaine.
- Charte, PARITE, BACKLOG et PRODUIT lus par sections, pas en entier (plus de 1 Mo) ; `iphone/README.md` lu,
  `iphone/journal/README.md` non relu à ce run (aucun geste vers Apple).

## Suite
- Finir cette PR si la build iOS n'est pas verte à la fin du run ; relever la build TestFlight du code v1034.
- Vérifier que l'envoi Alpha de la nuit est parti et vert.
- Nuit prochaine, après l'Alpha de 23:45 : soumettre la dernière build TestFlight traitée, puis expirer les anciennes.
- Suivi iPhone (v1035), FUSION-2 ; POLISH-SIM-69 (fin), 71, 72 ; CYCLE-3a-2.

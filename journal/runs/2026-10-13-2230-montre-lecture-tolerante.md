# 2026-10-13 22:30 Paris (20:30 UTC) — Montre : lecture tolérante de la réponse d'appairage + variantes du jeton

**Type** : ⌚🏗️ (priorité absolue D3)  ·  **PR** : #146 (fusionnée → release v120 avec APK)

## Pourquoi
- Démarrage : main à `8a3cf12` (PR #144 journal + #145 test météo). Aucune PR « [Auto] » rouge ou en conflit.
- Le journal GT 6 Pro de 17:03 (v118) est bien enregistré (`diagnostics/2026-10-13-1703-gt6pro.json`) et le correctif
  (a quinquies) est n°1 des « Prochaines étapes » (run idées 20:30) : vérifié, puis traité en premier.

## Ce qui a été fait
- **`decodeHichainJson`** (`devices/huawei/hichain.js`, §6.9–6.10) : lecture unique de l'étiquette 1 des réponses 0x28 —
  objet JSON équilibré à l'offset 0, suite ignorée et comptée (`trailingBytes`). Utilisée par `inspectHichainReply`,
  `parseHichainReply` (charge utile **et** texte du message final, NUL retiré). `findEmbeddedJson` partage le même
  balayage d'accolades (`objectEnd` / `objectAt`) — plus de doublon.
- **Libellé** : les champs `isoSalt` + `token` dans un JSON réellement illisible sont nommés « réponse ISO » ; « New Auth
  Protocol » n'apparaît plus que si `epk` / `salt` / `challenge` sont présents.
- **Diagnostic du jeton (I57, §6.10)** : `pinBaseKeyVariants` (5 variantes) — la première qui reproduit le jeton de la
  montre est retenue pour toute la liaison et nommée dans le journal ; sinon `WATCH_TOKEN_ORDERS` (4 ordres) nomme la
  combinaison ; `report.tokenCheck` (noms + tailles). Motif : le PIN réel fait **64 octets**, sa forme exacte est
  incertaine. Un jeton différent à la liaison ne mène plus à « PIN refusé » (conseil « montre liée ailleurs » trompeur)
  mais à « failed » + journal.
- **Journal exporté** : `trailingBytes` par réponse 0x28, `tokenCheck`.
- **Fausse montre** : options `trailingNul`, `pinBaseVariant`, `tokenOrder`.
- **Tests (+11)** : trame d'exemple ISO 0x8001 reconstituée **804 car. + 0x00 = 805 octets** (taille du journal réel) →
  `json_ok`, `isoSalt` lu, `trailingBytes: 1` ; variantes `\n`, `\0\0`, blancs, octets quelconques ; vrai non-JSON
  toujours `json_unparsable` ; parcours complet de la fausse montre GT 6 Pro (`deviceSupportType` 4, authVersion 1,
  NUL sur toutes les réponses) → **connected** ; variante de clé retenue ; ordre inversé nommé sans valeur.
- Spec `protocoles/huawei.md` §6.10 ; backlog (a quinquies) et (a sexies) cochés, étape n°1 = lire le 3e journal ;
  Nouveautés `2026-10-13-2230-montre-lecture-tolerante.json` ; résumé hebdo.

## Vérifications
- Tests : **1111 ✅** (81 fichiers ; 1100 avant) · Build ✅ · Lint : **6 erreurs** (baseline inchangée)
- `npm run visual` : toutes les pages OK, aucune erreur JS ; `/connectors` relue (inchangée : le changement est dans
  le protocole, visible seulement sur la vraie montre).

## Apprentissages / décisions
- Ne **rien** ajouter à nos envois (la montre a accepté nos 695 octets sans NUL).
- Variantes d'ordre seulement **nommées**, pas poursuivies : le jeton du téléphone en miroir serait une supposition.

## Suite proposée
1. Lire le 3e journal du propriétaire (v ≥ 120) : `bind` ok → `auth` / `check` / `sync` ; sinon `tokenCheck`.
2. Puis (d quater) arrière-plan app fermée.

## Après le merge
- PR #146 : checks « Frontend (Vitest) », « Build APK » et émulateurs A56 (API 35, 36) verts → fusionnée (squash,
  `89d1caa`). « Build & Release » vert → **release v120** publiée avec `HealthTrack-v120.apk`.

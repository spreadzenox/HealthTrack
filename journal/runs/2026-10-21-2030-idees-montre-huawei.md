# 2026-10-21 20:30 Paris (18:30 UTC) — Run « idées » : montre Huawei, sommeil / VFC / température

**Type** : 💡⌚ idées (pas de code produit) · **PR** : celle de ce compte rendu (journal seul)

## Pourquoi
- Main à `d29e069` (#257), tous les workflows verts (Build & Release v199, Play — AAB 343, Tests, émulateur A56).
  Aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, pas à nous).
- 20:30 Paris → run « idées ». Signalement du 20/10 19:05 déjà corrigé (v188). **Nouveau signalement du 21/10 ~20:00**
  (montre Huawei : sommeil, VFC, température absents ; couverture maximale) : les runs « idées » peuvent avancer la
  spécification du protocole → sujet de ce run. Nouvelles décisions du 21/10 au soir à reporter (nom Halcya, état
  Play Console).

## Ce qui a été fait
- **Décisions reportées** : `PRODUIT.md` (nom **Halcya** à appliquer au prochain run de code via `config/brand.js`,
  aucun identifiant technique changé ; P3 / P8 / P10 faits, **P11 en cours** et détaillé pas à pas, P12 via groupe
  Google, P15 domaines + INPI / EUIPO, nouvelle P17 « tester la montre » ; jalon **M** en tête), `BACKLOG.md`
  (jalon M : M0 nom, M1–M7 ; 3c dès P11), résumé de la semaine (paragraphe du run + tableau « une ligne par type de
  donnée » demandé par le signalement).
- **Recherche protocole** (agent, Gadgetbridge master `0735529275` du 21/10 via l'API Codeberg, faits seulement, aucun
  code) → `protocoles/huawei.md` **§10** : inventaire GT 6 Pro (21 données, état ✅ / 🟡 / ❌), cause, service P2P
  0x34 et synchro « dictionnaire », classes 500044 (VFC) / 400012 (température cutanée) / 500031 / 500002 / 200003,
  champs complets du résumé de sommeil 700013, capacités étendues utiles, plan M1–M7 avec tests ; correction au §7.8.
- `IDEES.md` : I139–I143 (+ garde-fou D5 sur les « émotions » calculées par la montre).

## Faits marquants
- **Cause du sommeil absent** : `CAPABILITY_QUERY` (`sync.js`) demande le service 0x2C en 1/0x02 ; la GT 6 Pro répond
  « non » (journal v124 du 14/10) → `canDo(caps, FILES, 0x01)` faux → `sleepFile` « non pris en charge », jamais lu.
  Gadgetbridge ne pose jamais cette question (0x2C n'est pas une capacité) et lit `sequence_data` dès que TruSleep
  (7/0x16) + capacité 143 sont présents ; sommeil confirmé sur GT 6 Pro chez un testeur (#5428).
- Le même fichier donne la VFC, la respiration, la SpO₂ et la FC de la nuit → un seul correctif débloque 5 données.
- VFC de journée et température : P2P 0x34/0x01, `hw.unitedevice.datadictionarysync` → `hw.watch.health.filesync`,
  ping 0xCA, accusés 0xCF, réponses paginées (réel 8 o, parfois 4 o).
- Aucune voie connue pour les étages (#5724) ni le cycle.

## Vérifications
- Journal seul. `npm ci` + `npm run test` sur la branche : **1 738 Vitest verts**. Pas de changement visible → pas
  d'entrée « Nouveautés ».

## Suite proposée
- **Prochain run de code (22:30) : M0 + M1** — nom affiché « Halcya » (petit) puis la correction des capacités et le
  sommeil complet (§10.2, §10.3, §10.8), en TDD sur trames synthétiques (réponse 1/0x02 « 0x2C non » + capacité 143
  → `sequence_data` demandé). Sauf si P11 est fait : alors 3c d'abord (run court).
- Prochain run « idées » (08:30) : finir la spec M2 (séquence exacte des messages P2P spontanés à acquitter, réel 4 o
  vs 8 o), et la veille produit laissée en plan (Play Billing PBL ≥ 8 sous Capacitor, délais FODMAP).
- Propriétaire : finir P11 ; activer TruSleep, stress et température cutanée sur la montre (P17).

## Après le merge
- (à compléter)

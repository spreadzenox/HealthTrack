# Run du 03/11/2026 16:35 (Paris, CET) — Bilan du relais lisible par la routine (INSTALLS-21b-2)

**Type** : 🔧 code (workflow du relais seulement, rien ne change dans l'app)

## Constat au démarrage
- Main à `c379b9c` (#657), workflows verts ; aucune PR « [Auto] » ouverte (la #51, hors routine, pas touchée).
- Prochaines étapes du journal : P43 (propriétaire), TEST-ALPHA-1 (07–08/11), INSTALLS-21b-2.

## Fait
- « Relais — déploiement » lancé à la main sur main (run 41665157520, vert) pour lire le bilan :
  - période de lancement : Android `jusqu'au 2026-11-27T23:00Z`, iPhone `jusqu'au 2026-11-06T23:00Z` ✅ ;
  - Gold : téléphones 27 analyses, 23 installations, `gemini-3.8-flash` en `eu`, 1,05 € ; CI 11 analyses 0,43 € ;
    61 analyses Flash-Lite sans niveau (anciennes versions) ;
  - Play Integrity : téléphones `missing error:-9` 56 installations, `passed` 1 (propriétaire) → rester en `observe` ;
  - nouvelles installations : 63 sur 7 jours (27/10 : 4, 28 : 10, 29 : 11, 30 : 10, 31 : 14, 01/11 : 6, 02 : 6, 03 : 2).
- **Défaut trouvé** : la répartition `testenv` (INSTALLS-21b-1) n'était écrite que dans le résumé du workflow, que la
  session ne peut pas lire par l'API REST. Ajoutée au journal de l'étape « Nouvelles installations » (total et
  répartition par jour), lisible par `gh api …/jobs/<id>/logs`. Commande jq vérifiée localement sur un échantillon.

## Après le merge
- Le push sur main redéploie le relais (chemin du workflow) : relire la ligne « Lecture du réglage Test Lab » du
  journal. Avec 2 installations le 03/11, rien à conclure encore.

## Données
- Aucune.

## Demandes iOS
- Aucune.

## Suite
- INSTALLS-21b-2 : relire après 2 ou 3 versions du test interne ; TEST-ALPHA-1 (07–08/11) ; P43.

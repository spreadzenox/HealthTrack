# Run du 03/11/2026 17:35 (Paris, CET) — Empreinte de l'installation du propriétaire (GOLD-a3-1)

**Type** : 🔧 code (workflow du relais seulement, rien ne change dans l'app)

## Constat au démarrage
- Main à `f359919` (#659), workflows verts ; aucune PR « [Auto] » ouverte.
- Dernier « Play — AAB » : test interne 100742, **Alpha 100721** (l'API ne dit pas si l'examen est fini).
- Prochaines étapes du journal : INSTALLS-21b-2 (plus tard), TEST-ALPHA-1 (07–08/11), P43, P37.

## Pourquoi maintenant
GOLD-a3 (le propriétaire garde Gold après le 27/11) attend P37 : qu'il recopie son empreinte depuis le mode
diagnostic. Mais le relais la connaît déjà : c'est la seule installation Android dont le jeton Play Integrity est
accepté (`passed` ×1 au bilan de 16:35 ; les robots de Google échouent en `error:-9`). **Dès que les testeurs
installent l'app, d'autres `passed` apparaîtront** et on ne pourra plus la distinguer : il faut la lire aujourd'hui.

## Fait
- Bilan de « Relais — déploiement » : nouvelle ligne « Installations Android au jeton accepté (GOLD-a3) » avec
  l'empreinte (12 caractères, `hashInstallId`, rien de personnel), premier et dernier jour, nombre d'événements ;
  hors CI, robots et iPhone. Écrite dans le journal du workflow (lisible par la routine). jq vérifié localement
  (échantillon et liste vide). Relais : 194 tests verts.

## Après le merge
- (voir la suite ci-dessous, complétée en fin de run)

## Données
- Aucune.

## Demandes iOS
- Aucune.

## Suite
- GOLD-a3-2 : après confirmation du propriétaire (4 premiers caractères de « Empreinte de l'installation »),
  `GOLD_INSTALLS=<empreinte>` dans `relay-deploy.yml`, avant le 27/11.
- TEST-ALPHA-1 (07–08/11) ; INSTALLS-21b-2 ; P43.

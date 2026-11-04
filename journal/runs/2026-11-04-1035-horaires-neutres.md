# Run du 04/11/2026 10:35 (Paris, CET) — Horaires de sommeil : étiquette neutre (règle 6)

**Type** : 🎨 code (petit, indépendant de la PR en cours)

## Constat au démarrage
- Main à `893f56a` (#680) : Tests, Build & Release, Play — AAB, émulateur verts.
- PR **#681** (WEBVIEW-MIN, run de 09:35) ouverte depuis moins de 90 min, « Build APK » encore en cours : laissée à
  son run ; ce run n'en touche aucun fichier.
- Priorités du prompt : livrées ou en attente du propriétaire (P37, P42 vers le 07–08/11, P43, P44, P45).
- Backlog : I32 (exclure les nuits « 100 % léger » des moyennes de phases) est sans objet aujourd'hui : l'app ne
  calcule aucune moyenne de phases (seulement des durées, déjà bornées par `SLEEP_METRIC.plausible`). Rangé comme tel.
  Découpage du code de la montre hors du démarrage (≈ 200 Ko de source dans le bundle principal) écarté pour ce run :
  gain mesuré faible pour un risque sur la synchro de la montre du propriétaire.

## Fait (TDD : 2 tests rouges puis verts)
- `SleepRegularityCard` : « Horaires variables » portait la classe `is-unfavourable` (et « réguliers »
  `is-favourable`), un jugement contraire à la règle 6, avec un badge menthe identique à « réguliers ». Désormais
  `is-outside` (bordure et badge neutres, comme « Plus basse que d'habitude », POL-PLAY-20) ; « réguliers » et
  « assez réguliers » `is-within`. L'hypothèse générale reste dépliable, présentée comme telle.
- Nouveautés « Horaires de sommeil : une étiquette neutre » (toutes variantes).

## Vérifications
- `npm run test`, `npm run lint`, `npm run build` ; `npm run visual -- --play --routes=/tendances` en clair et en
  sombre (données de démo, « Horaires variables » visible) : badge gris neutre, aucun avertissement.

## Suite
- TEST-ALPHA-1 (07–08/11, clic P42) ; P37, P43, P44, P45 en attente du propriétaire.

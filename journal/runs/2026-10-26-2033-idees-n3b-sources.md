# Run du 26/10/2026 20:33 (Paris, CET) — Idées : N3b prêt à coder (sources FODMAP par sous-groupe)

**Type** : 💡 run « idées » (20 h) — journal seul, aucun code produit.

## Constat au démarrage
- Main à `5ad6d0d` (#398, P28 film vert) ; aucune PR « [Auto] » ouverte (seule la PR #51 `cursor/*`, pas à nous).
- Suite du run de 19:33 vérifiée : **https://spreadzenox.github.io/HealthTrack/p28/** répond (HTTP 200).

## Ce qui a été fait
- Recherche des mesures publiées pour les quatre groupes que Ciqual ne donne pas (fructanes, GOS, sorbitol, mannitol),
  en ne gardant que des documents **lus** et **réutilisables commercialement** : `IDEES.md` I177 (5 sources, licences,
  chiffres), I178 (règles de calcul), I179 (correspondance de ~30 aliments avec leurs noms exacts dans la table).
- Trouvaille principale : la **table japonaise officielle MEXT 2020** (volume glucides) publie sorbitol et mannitol par
  aliment, usage commercial permis (xlsx téléchargé, md5 noté, colonnes `SORTL` / `MANTL` lues).
- **Défaut de méthode trouvé dans N3a** : « < 0,5 » g/100 g de polyols (avocat, chou-fleur, légumineuses cuites) est
  compté 0 → niveau `bas` possible alors qu'une portion de 100 g peut dépasser le repère de 0,4 g. Ajouté au BACKLOG
  (N3a-bis) avec la règle et le test à écrire.
- Écarts entre sources notés (oignon 1,97 contre 6,3 g/100 g de fructanes ; champignon de Paris 0,28 g de polyols chez
  Ciqual contre 1,3 g de mannitol chez MEXT) : Ciqual d'abord, l'autre valeur en note.

## Vérifications
- Journal seul : pas d'entrée « Nouveautés », Sécurité des données inchangée. Tests lancés avant le merge (voir PR).

## Suite
- Run de code suivant : **N3a-bis + N3b** (remplir `fodmapMeasurements.json` d'après I177–I179, script reproductible
  qui télécharge le xlsx MEXT et vérifie son md5), puis **N4** (carte d'un repas), N2b.
- Trous assumés (resteront « inconnu ») : sorbitol de l'avocat, mannitol du chou-fleur, fructanes de l'artichaut ;
  un prochain run « idées » peut chercher encore.

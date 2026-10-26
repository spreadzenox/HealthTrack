# Run du 26/10/2026 22:33 (Paris, CET) — N3a-bis + N3b (1re partie) : mesures FODMAP publiées

**Type** : 🏗️ code (priorité du propriétaire du 26/10 14:45 : FODMAP par sous-groupe ; P28 attend le propriétaire)

## Constat au démarrage
- Main à `3b0cc0e` (#403), aucune PR « [Auto] » ouverte (seule #51 `cursor/*`). P28 : brouillon `p28-100487`
  accepté à 22:05 ; rien à faire côté code avant que le propriétaire regarde Contenu de l'app (vers 23:00).

## Ce qui a été fait
- **N3a-bis** (`services/fodmapGroups.js`) : la limite d'une teneur Ciqual « < x » est gardée (`max`) ; un repas n'est
  `bas` pour un groupe que si le total, limites comprises, reste sous le repère (100 g d'avocat, polyols « < 0,5 » :
  sorbitol `inconnu` au lieu de `bas` ; 30 g : `bas`). Même borne pour le raccourci « polyols totaux sous 0,4 g ».
- **N3b-1** (`data/fodmapMeasurements.json` v2) : une entrée par groupe (`g` pour 100 g, ou `share` des polyols
  totaux Ciqual pour le sorbitol / mannitol), avec `source`, `ref` (tableau), `confidence` (`mesure`, `analogie`,
  `citée` = valeur citée par une revue, confiance basse) et `notes`. 32 aliments, valeurs reprises d'`IDEES.md`
  I177–I179 (lues dans les sources le 26/10 20:33) :
  - fructanes, Ferjančič 2024 (CC BY 4.0) : oignon cru 1,97 (oignon jaune / rouge en analogie), poireau 0,24, pâtes
    cuites 0,33, pain blanc 0,14 (tradition en analogie), farine T55 0,75 (type 500, analogie), flocons d'avoine 0,32,
    amande 0,60, noisette 0,73, noix 0,37, banane 0,11, orange 0,21, clémentine 0,11, raisin 0,06, pomme 0,09,
    poire 0,13 ;
  - ail cru 17,4 et échalote 8,9 : revue Wang & Cheong 2023 citant Muir 2007, confiance basse ;
  - GOS (raffinose + stachyose), Natale 2025 (CC BY 4.0) : tofu 0,14, tempeh 0,035, boisson au soja 0,269, farine de
    pois chiche 2,113, soja 3,323, flocons d'avoine 0,265 (farine d'avoine, analogie) ;
  - sorbitol / mannitol, MEXT 2020 : pomme 0,5 (Ciqual sans polyols) ; parts des polyols Ciqual (Ciqual d'abord) :
    poire (2 entrées), pêche (2), pruneau → sorbitol, champignon de Paris, céleri branche → mannitol, toutes en
    analogie ; abricot 0,3 (estimé MEXT) précise le « < 0,5 » de Ciqual. Nectarine laissée inconnue (MEXT 0,6
    contredit Ciqual « < 0,5 »).
- Règle : une mesure publiée ne remplace jamais une valeur Ciqual ; elle précise un « < x » seulement si elle est ≤ x,
  et une valeur absolue plus grande que les polyols totaux Ciqual est ignorée.
- **Test fiabilisé** : `UpdateBanner.test.jsx` « progression en Mo et en % » (attentes 3 s → 10 s ; le suivi interroge
  toutes les 800 ms en temps réel ; il avait échoué une fois en CI et une fois ici, sous la charge de la suite).
- Rien d'affiché, aucune donnée ni appel réseau nouveau (Sécurité des données inchangée), pas d'entrée « Nouveautés ».

## Tests
- `fodmapGroups.test.js` : 19 → 24 cas (part des polyols, valeur citée, « < x » précisé ou non, N3a-bis synthétique
  et sur la table livrée (avocat 100 g), exemples livrés : oignon 70 g → 1,379 g de fructanes élevé, ail 3 g élevé,
  pomme 150 g → 0,75 g de sorbitol élevé, poire → source « Ciqual + mext2020 », tofu 100 g → GOS bas, pâtes cuites
  200 g (alias) élevé ; intégrité : nom Ciqual non alias, source déclarée, confiance valide, part seulement si Ciqual
  mesure des polyols > 0, valeur ≤ glucides, chaque valeur réellement utilisée par le calcul).

## Vérifications
- `npm run test` : **2 457** verts (+ 33 sautés) ; `npm run build` OK ; lint 6 erreurs (inchangé) ; `npm run visual` :
  0 erreur JS, toutes les pages « ok » ; Accueil et Nutrition relus (inchangés : rien d'affiché).

## Suite
- **N3b-2** : GOS des lentilles, pois chiches et haricots cuits (Siva 2019 sec × eau Ciqual × pertes Njoumi 2019) —
  il faut garder `water_g` dans l'importeur Ciqual ; autres aliments MEXT ; `fodmap_score` des nouveaux repas.
- **N4** : carte d'un repas (« riche en fructanes : oignon », source dans les détails, « probablement » en confiance
  basse). **N2b** : inconnu ≠ 0 dans les totaux.

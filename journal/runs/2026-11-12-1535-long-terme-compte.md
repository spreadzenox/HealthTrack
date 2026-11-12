# Run 12/11 15:35 — Analyses : ce qui reste à noter, dit clairement (POLISH-SIM-56)

**Type** : code (mode polish).

## Contexte
- Main 75bd95d (#938) : Tests, Build & Release et Play — AAB verts ; « Test — émulateur A56 » en échec au job Build APK :
  `Could not find com.google.errorprone:error_prone_annotations:2.3.1` (Maven Central), panne passagère (le même code
  passait sur d113859). Jobs en échec relancés (tentative 2). Aucune PR « [Auto] » ouverte.
- POLISH-SIM-56 (Ventre et données J45) : « Long terme : encore 12 jours notés » sans dire ce qui est compté.

## Cause
- `analyzeMatrix` compte les jours où le résultat existe : digestion notée (gêne ou selles) ; pour le bien-être, une
  note **ou** une lecture du visage. Le seuil long terme de la digestion est 56 jours. « jours notés » était faux pour le
  bien-être et ne disait pas le délai.

## Fait
- `resultsView.js` : `nextLock` porte la fenêtre de l'horizon.
- `Recommendations.jsx` : « Long terme (de 7 à 27 jours avant) : encore 12 jours avec votre digestion notée » ; en
  bien-être « avec votre bien-être noté ou lu ». Tests mis à jour.
- Nouveautés : `2026-11-12-1535-long-terme-compte.json`.

## Vérifs
- `npm run test` (3473 verts), `npm run lint` (0 erreur), `npm run build`.
- Persona J45 (téléphone seul, ventre), Analyses › Digestion
  ([capture](captures/2026-11-12-1535-long-terme-compte-J45.png)). Texte seul changé.

## Suite
- Vérifier la tentative 2 de l'émulateur sur 75bd95d (et le build de ce merge).
- POLISH-SIM-57, 58, 61 à 64.

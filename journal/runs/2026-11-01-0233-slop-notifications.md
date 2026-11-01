# Run du 01/11/2026 02:33 (Paris, CET) — Textes : notifications et textes natifs (SLOP-1c)

**Type** : ✍️ textes (demande du propriétaire du 31/10 vers 21:35)

## Constat au démarrage
- Main à `2b32cef` ; aucune PR « [Auto] » ouverte ; #51 (`cursor/*`) non touchée. Derniers workflows de main verts
  (v418 publiée par le run de 01:33).

## Inventaire
- Notifications programmées côté JS (essai gratuit, portion de réintroduction) : déjà courtes et concrètes, inchangées.
- Code natif (`android/app/src/**/*.java`, chaînes recollées) : canaux et notifications du bilan du soir, de la note
  du soir, de la réintroduction, de l'essai et du service visage déjà sobres. `strings.xml` ne contient que le nom.
  Restes : une énumération par trois (visage arrêté) et une parenthèse longue (montre refusée).
- Sources : 4 phrases longues (Health Connect qui ne répond pas, détails de la lecture du visage, refus de la caméra).

## Changements (texte visible)
| Écran | Avant | Après |
|---|---|---|
| Notification « Lecture du visage arrêtée » (texte long) | « Android a mis la lecture du visage en pause (mise à jour, redémarrage ou économie de batterie). Touchez « Reprendre »… » | « Android a mis la lecture du visage en pause, souvent pour économiser la batterie. Touchez « Reprendre »… » |
| Notification « Synchro de la montre en pause » | « …n'accepte plus la connexion de Halcya (elle a peut-être été réinitialisée ou liée à une autre app). Ouvrez… » | « …n'accepte plus la connexion de Halcya. Elle a peut-être été réinitialisée. Ouvrez… » |
| Carte montre après restauration | « Vos données sont revenues sur ce téléphone, pas la clé de la montre (elle ne quitte jamais un téléphone). » | « Vos données sont restaurées. La clé de la montre n'est jamais sauvegardée : touchez « Reconnecter ma montre ». » |
| Sources, Health Connect ne répond pas | « Le module natif Health Connect n'a pas répondu dans les délais (10 s). Cela peut indiquer que… Essayez de mettre à jour… » | « Health Connect n'a pas répondu en 10 secondes. Le module système est peut-être bloqué ou pas à jour. Mettez-le à jour via…, puis relancez l'app. » |
| Sources, Health Connect absent | `"Health Connect"` (guillemets droits) | « Health Connect » |
| Sources, lecture du visage → Détails | une phrase de 3 propositions + « Si vous ajoutez le déverrouillage, 3 images à chaque déverrouillage, avec une notification visible tant que c'est en marche. » | phrases courtes ; « Au déverrouillage, si vous l'ajoutez : 3 images, et une notification reste visible. » |
| Sources, caméra refusée au déverrouillage | une phrase de 50 mots | trois phrases courtes |

## Test
- `SLOP_WORDING` : énumération par trois entre parenthèses.
- `wording.test.js` : nouveau bloc « notifications et textes natifs Android » ; les chaînes Java coupées par `" + "`
  sont recollées, puis `SLOP_WORDING` et `FORBIDDEN_WORDING` s'appliquent à tout `android/app/src` (hors tests).
  Vérifié : il échoue sur l'ancienne notification du visage.

## Vérifications
- `npm run test` : 2 805 réussis ; `npm run build` OK ; `npm run lint` : 6 erreurs (inchangé).
- `npm run visual` (démo) et `--empty --routes=/connectors --click="Détails"` : captures relues ; après dans
  `journal/captures/slop-1c/`.

## Données
- Aucune donnée touchée (textes seulement).

## Demandes iOS
- Une partie des changements est native Android : note de Nouveautés sans `variants` car Sources et Health Connect
  changent aussi ; à garder en tête pour iOS (la notification du visage n'y existe pas).

## Suite
- SLOP-1b : Journal relu phrase par phrase ; paywall réécrit avec GOLD-b. Puis SLOP-1d (fiche Play, site), 1e
  (anciennes Nouveautés).

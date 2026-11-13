# 2026-10-29 08:00 UTC — iPhone à v580 comme Android ; icône vue sur l'écran d'accueil ; parité recomptée

**Étape** : I2 (parité)  ·  **PR** : #56 (mergée), #57  ·  **Android suivi** : v580 (#497 : journal d'Android seulement, pas de nouvelle version)  ·  **iOS** : 580 sur `main`  ·  **Parité** : 45 % (21/47)

## Messages du propriétaire depuis le run précédent
- Aucun. A1 reste en cours.

## Ce qui a été fait
- **Merge de #56** : CI verte sur `0f43263` (96 captures, 0 erreur JavaScript, tests d'interface construits et
  réussis ; rapport +2, export +2, visage « face »). **Écran d'accueil regardé** : l'icône (le H sur fond encre) et
  le nom « Halcya » sur les deux iPhone simulés. L'écran de démarrage, pris 0,6 s après le lancement, montrait
  encore l'accueil d'iOS. Branche à jour sur `main` (`0530aff`), squash-merge → `8a7de18`. iOS = v580 = Android.
- **#57** : écran de démarrage pris à 1,2 s et 2 s (`*-demarrage.png`, `*-demarrage-2.png`).
- **Santé : imports et historique** (🟡, reste « pas importés visibles dans le Journal ») : la sonde `[healthkit]`
  relisait les pas écrits dans Santé par le connecteur de l'app, mais avec un enregistreur qui ne garde rien. Elle
  fait maintenant aussi la vraie synchronisation, rangée dans la base comme depuis Sources, et y cherche les pas
  écrits (`[healthkit] base {"synced":…,"pas":[1234]}` attendu) ; testé. Poussé sur #57 au début de sa CI.
- PARITE : « Votre avis » ✅ (capture de #51 et test du lien), « Nouveautés » ✅ (capture de #52, notes d'Android
  fausses cachées) ; icône et nom vus (la ligne attend l'écran de démarrage).
- **Parité recomptée** depuis la colonne « État » de chaque tableau : 53 lignes, 3 ⛔ et 3 — exclues, 47 faisables
  (le run de 07:00 en comptait 46 à tort) ; 21 ✅ → 45 %.

## Suite
- CI de #57 : regarder `demarrage` et `demarrage-2` ; si l'écran encre y est, « Nom, icône, écran de démarrage » ✅.
- CI de #57 : `[healthkit] base` sur les deux iPhone ; si les pas sont dans la base, « Santé : imports et historique » ✅
  (reste l'iPhone 12, comme pour toutes les lignes).
- I2 : « Santé : imports et historique » (pas importés visibles dans le Journal), puis les autres 🟡 ; I9 après A1.

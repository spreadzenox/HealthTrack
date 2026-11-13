# 2026-10-27 13:07 UTC — I1 : captures de chaque page sur iPhone simulé

**Étape** : I1 (suite)  ·  **PR** : #2 (ouverte, pas mergée : captures décalées)  ·  **Android suivi** : v518  ·  **iOS** : 518.<n> (simulateur)  ·  **Parité** : à calculer (I2)

## Ce qu'Android a livré depuis le run précédent
- #432 (journal) et #433 « lecture au déverrouillage dans les versions de test interne » (workflow et scripts Play
  seulement) : sans objet sur iOS. `main` de ce dépôt était vert après le merge de #1 (run 40506243742).

## Ce qui a été fait
- `overlay/app/src/ios/captureMode.js` (+ tests, écrits d'abord) : en build simulateur seulement (`VITE_IOS_CAPTURE=1`),
  l'app parcourt elle-même un plan de pages : installation vierge (onboarding), puis les 14 pages de `npm run visual`
  avec les données de démo d'Android (`scripts/visual/demoData.mjs`, ajoutées une fois ; onboarding et nouveautés
  notés vus) en clair, puis 3 pages en sombre ; à chaque page elle écrit « [capture] page <nom> » dans sa console.
- Premier essai abandonné : piloter l'app par des liens `halcya-capture://` (`simctl openurl`) ; le simulateur
  iOS 26 affiche « Open in "Halcya"? » à chaque lien et la page ne change jamais (toutes les captures montraient ce
  dialogue).
- `patches/02-mode-captures.patch` : une ligne dans `main.jsx`, conditionnée à `VITE_IOS_CAPTURE` (vérifié : aucun
  morceau « captureMode » dans une build sans cette variable).
- `scripts/ios-captures.sh` : lance l'app avec sa console (`simctl launch --console-pty`) sur les deux iPhone simulés,
  capture l'écran à chaque « [capture] page … » jusqu'à « [capture] fin », résume les erreurs JavaScript
  (`js-errors.txt`, affiché dans le résumé du job, pas encore bloquant).

## Vérifications
- `scripts/upstream.sh` ✅ (2 correctifs) · Tests d'Android avec correctifs : 2571 ✅ (44 ignorés) · Build web appstore
  avec et sans mode captures ✅ · Build iOS et captures : CI de la PR (voir la suite).

## Captures regardées (branche `captures/pr-2`, build 518.7) — résultat partiel
- Le parcours marche (18 pages annoncées sur chaque iPhone, **aucune erreur JavaScript**), mais **les captures sont
  décalées** : « accueil » montre le Journal, « food » la page Sources, et « nutrition », « data », « connectors »,
  « recommendations » et « settings » montrent toutes les Paramètres. Cause probable : la console relayée par
  `simctl launch --console-pty` arrive par paquets, la capture part trop tard. Pas de merge tant que ce n'est pas
  fiable.
- Ce que montrent quand même les captures, à traiter en I2 :
  - **Premium** : « L'abonnement se prend depuis la version Google Play de l'app » : texte faux sur iPhone (la
    variante appstore n'a pas encore d'abonnement, elle tombe sur le texte prévu pour la sideload).
  - **Sources** : la détection des apps installées appelle `canOpenURL` avec des noms de paquets Android
    (`com.huawei.health`, `com.garmin.android.apps.connectmobile`…), refusés par iOS (« Invalid input URL ») ; il
    faudra des schémas iOS déclarés dans `LSApplicationQueriesSchemes`, ou masquer la détection.
  - **Sources, carte « Lecture du visage »** : « Le module de lecture du visage ne répond pas » (plugin natif absent
    sur iOS) : repli propre attendu en I2, la vraie lecture en I7.
  - Bien : Accueil en sombre, Tendances, Données de la montre, Historique du bien-être, Réintroduction guidée et
    Réglages s'affichent proprement sur 390 × 844 (zones sûres, barre d'onglets, polices).

## Apprentissages / décisions
- La capture « sombre » du run précédent était en clair parce que Halcya est en clair par défaut et que le sombre est
  un réglage de l'app (`healthtrack_theme`), comme sur Android : pas un défaut iOS.

## Suite proposée (prochain run, sur cette même PR #2)
- Synchronisation fiable : l'app écrit « page prête : <nom> » dans un fichier de ses Documents
  (`@capacitor/filesystem`, déjà présent) ; le script lit ce fichier dans le conteneur de l'app sur le Mac
  (`xcrun simctl get_app_container <udid> fr.jpesquet.sante data`), capture, puis écrit un accusé que l'app attend
  avant de passer à la page suivante. Ensuite regarder chaque capture, merger, et attaquer I2 par les trois défauts
  ci-dessus.

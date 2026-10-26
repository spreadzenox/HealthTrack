# Backlog — Halcya sur iOS

> Un run = une étape testable et mergeable (`[iOS] …`). L'ordre peut s'adapter, mais deux règles ne bougent pas :
> rien ne casse côté Android, et les livraisons Android sont reportées dans `PARITE.md` à chaque run, même pendant
> le rattrapage.

## Prochaines étapes

- [ ] **I0 — Mise en place sur `main`** : la charte (`journal/ios/`), la frontière Android/iOS (`AGENTS.md`) et les
  paths-ignore iOS de `Build & Release` et `Play — AAB` ont été préparés le 26/10 sur la branche
  `claude/magical-volta-1oi9i5`. Si `journal/ios/README.md` n'existe pas sur `origin/main` : reprendre ce commit
  (cherry-pick) dans une PR `[iOS] I0 : mise en place de la routine iOS`, la merger une fois les checks verts.
- [ ] **I1 — Socle iOS sur simulateur**
  - [ ] `@capacitor/ios` (même majeure que `@capacitor/core`), `npx cap add ios` (Swift Package Manager si possible),
    projet versionné dans `app/ios/` (ignorer `build/`, `DerivedData`, `App/public`, `capacitor.config.json` copié).
  - [ ] Bundle id `fr.jpesquet.sante`, nom affiché « Halcya », icône et écran de démarrage (`journal/DESIGN.md`).
  - [ ] Variante `appstore` dans `app/src/config/distribution.js` (+ tests : play et sideload inchangés).
  - [ ] Workflow `ios-build.yml` (PR qui touchent `app/**` ou `ios-*`, push `main`, `workflow_dispatch`) : clone complet,
    `VITE_DISTRIBUTION=appstore`, `VITE_APP_VERSION` = numéro du commit, build web, `cap sync ios`, `xcodebuild` pour
    le simulateur sans signature, lancement sur un simulateur iPhone récent, captures de chaque page (clair / sombre,
    données vierges / démo) en artefact, échec sur erreur JS. `concurrency` qui annule les runs dépassés d'une PR.
- [ ] **I2 — Audit de parité et replis propres** : compléter `PARITE.md` fonction par fonction (changelog depuis le
  lancement play, `journal/PRODUIT.md`, écrans) ; sur iOS, chaque service qui appelle un plugin Android absent
  retombe proprement (pas d'erreur, pas de carte cassée, pas d'interrupteur qui ne fait rien) ; calcul du % de parité.
- [ ] **I3 — Données** : durabilité d'IndexedDB dans WKWebView (effacement possible ? persistance), sauvegarde
  iCloud, export / import JSON par la feuille de partage, secrets dans le Trousseau (ThisDeviceOnly), restauration
  sur un nouvel iPhone (identifiant d'installation, crédits IA, montre).
- [ ] **I4 — Santé (HealthKit)** : mêmes types que Health Connect, historique, autorisations au bon moment avec
  divulgation, source affichée « Santé (iPhone) », tests.
- [ ] **I5 — Notifications** : bilan du ventre du soir, note du soir, rappel de portion, rappel de fin d'essai ;
  actions dans la notification, réponse rangée à l'ouverture suivante, mêmes règles que sur Android.
- [ ] **I6 — Abonnement et relais** : StoreKit 2 (plugin Swift), mêmes formules (annuel mis en avant, mensuel, essai
  de 14 jours), prix lus dans StoreKit ; relais : vérification des transactions signées par Apple, notifications
  serveur V2, App Attest, mêmes crédits IA, même « période de lancement » ; produits créés par l'API App Store
  Connect (après A1–A4).
- [ ] **I7 — Bien-être par le visage** à l'ouverture de l'app : Vision + mêmes modèles (ONNX Runtime iOS ou Core ML),
  mêmes scores qu'Android sur les vecteurs de référence, divulgation (AI Act art. 50), aucune image conservée.
- [ ] **I8 — Le reste du natif** : voix, temps d'écran, montre Huawei (BLE), détection des sources : étude honnête
  (sources datées) puis ce qui est faisable ; ⛔ argumentés dans `PARITE.md`.
- [ ] **I9 — Publication** : signature par la CI (clé API A2), envoi TestFlight interne à chaque version de `main`,
  fiche App Store fr-FR (`app/store-ios/`), captures, `PrivacyInfo.xcprivacy`, réponses « Confidentialité de l'app »
  (A5), relecture des directives d'Apple pour une app de santé avec abonnement et IA ; tout prêt pour que la
  soumission soit un geste du propriétaire.
- [ ] **Ensuite — suivi continu** : chaque livraison Android reportée et rattrapée ; version iOS = version Android.

## Idées et questions ouvertes

- Raccourci ou widget « Lire mon bien-être » pour compenser l'absence de lecture au déverrouillage.
- Apple Watch : HealthKit couvre déjà sommeil, FC, VFC, pas — à noter comme atout de la version iOS.
- Huawei Santé sur iOS écrit une partie de ses données dans Santé : vérifier lesquelles (sommeil ? VFC ?).

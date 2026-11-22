# Run du 22/11 19:30 — #1201 mergée, FUSION-3 « Mes appareils » et liens de Réglages

**Type** : 🛠️ code (en coulisses) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main 822aebc au départ.

## État de départ
- main sur 822aebc (#1200) : Tests, Build & Release, Play — AAB et émulateur Galaxy A56 verts.
- #1201 (lot VFC SDNN, run de 18:30) ouverte, prête, à jour sur main, tous ses checks verts (build iOS sur simulateur
  compris ; un job « Tests d'Android avec les correctifs iOS » annulé par la concurrence, refait vert dans l'autre run).

## #1201 finie
- Captures iPhone (`captures/pr-1201`) relues : Accueil (Pilou, bulles, carte Bien-être), Tendances (Semaine,
  « attendu d'après vos habitudes »), Objectifs (Bien-être 3,0/5, Confort digestif 9 sur 14). `js-errors.txt` vide ;
  la console montre la VFC lue en `heartRateVariabilitySdnn`.
- Ligne d'attribution retirée du corps de la PR (règle du 16/11), mergée en squash (6016fde), message écrit à la main.

## FUSION-3 : correctifs 14, 25, 26 et partie `MyDevices.jsx` du 06
- `MyDevices.jsx` : import de `FEATURES`, texte « Sur iPhone, Halcya lit vos mesures dans l'app Santé… » quand rien
  n'est reçu, « activez ce partage vers l'app Santé », « ne partage pas … avec l'app Santé », et pour une Apple Watch
  « activez cette mesure dans l'app Watch de l'iPhone » : tout sous `FEATURES.iosStore`.
- `More.jsx` : Confidentialité et Conditions ouvrent `confidentialite-iphone.html` et `conditions-iphone.html` sur
  iPhone. Ces deux pages restent dans `iphone/overlay/app/public/` (elles iront avec FUSION-4).
- `06-textes-iphone.patch` ne garde que sa partie `Data.jsx` ; 14, 25 et 26 supprimés : **16 correctifs restent.**
- Test Android d'abord (`MyDevices.test.jsx`) : une Apple Watch vue sur Android renvoie à Health Connect, jamais à
  l'app Santé ni à l'app Watch. Les tests d'overlay `MyDevices.appstore.test.jsx` et `More.appstore.test.jsx` restent
  la preuve iPhone.
- Rien de visible sur Android : pas de note de Nouveautés.

## Vérifications
- Android : 4 343 tests verts (399 fichiers), lint sans erreur, build OK ; `npm run visual -- --routes=/connectors,/plus`
  sans erreur, Réglages relu (inchangé).
- iPhone : `scripts/upstream.sh` applique les 16 correctifs (v1262) ; dans `iphone/upstream/app`, 156 tests de
  `MyDevices`, `More`, `Data` et `src/config/` verts (23 fichiers), overlay appstore compris.
- Build iPhone sur simulateur au passage de la PR en « prête » ; merge au run suivant après lecture des captures
  (Réglages, Sources).

## Suite proposée
1. Finir cette PR (build iOS, captures Réglages et Sources), puis FUSION-3 : 06 (partie `Data.jsx`), 18 (portion,
   `Layout.jsx`) ou 05 (visage).
2. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45 ; demain lundi, archive de S47 et relevé des heures de Mac.

## Pour le propriétaire
« 👉 PI2 prête » (inchangé). Parité iPhone : 70 %. TestFlight : 1244.1244 chez « Testeurs Halcya » (dernier relevé).
Testeurs Play : 4 inscrits sur 12 (dernier relevé connu).

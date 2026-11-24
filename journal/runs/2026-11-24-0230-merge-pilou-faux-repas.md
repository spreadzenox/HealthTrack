# Run 24/11 02:30 — #1227 mergée, faux repas des personas (PERSONAS-OUTIL-3)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main c69a3d1 (#1227),
release **v894** (APK 35 674 457 octets) · **TestFlight** : 1268.1268 validée pour « Testeurs Halcya » (relevé du
23/11 07:33 UTC), 1244.1244 attachée à la version 893 ; build du soir et `ios-testflight.yml` du 23/11 pas encore
partis à 01:30 UTC (cron en retard, comme les soirs précédents) · **Parité** : 70 % (33/47), 2 correctifs iPhone
restent (01, 27)

## État de départ
- main vert sur 5004896 (#1226, mergée par le run de 01:30).
- #1227 (POLISH-SIM-154, run de 01:30) ouverte, prête, tous checks verts : Tests, émulateur, build iPhone (run
  45298990949). #51 (`cursor/*`) pas touchée.

## #1227 mergée
- Captures `captures/pr-1227` relues : Tendances iPhone en clair, en sombre et sur données vierges (« Vos courbes
  apparaîtront après 3 jours de mesures. ») : la tête entière de Pilou dépasse de la carte, une main posée sur le
  bord. Branche à jour sur origin/main. Merge en squash (c69a3d1) ; Build & Release vert, release v894.

## PERSONAS-OUTIL-3 — faux relais des repas
- `app/scripts/persona/fakeMeal.mjs` (outil des simulations, pas l'app) :
  - premier mot cherché accents compris d'abord, puis sans accents : « pâtes » → « Pâtes cuites », « pâté » → pâté,
    « pates » → « Pâtes cuites » ;
  - « 200 g », « 250g », « 1,5 kg », « 33 cl » donnent la quantité (la virgule décimale ne coupe plus la
    description) ; sans unité, le nombre reste un nombre de portions de 100 g, au plus 5 ;
  - le nom du plat est le premier morceau sans sa quantité (« 200 g de saumon, riz… » → « Saumon »), au plus 40
    caractères.
- Tests d'abord (`fakeMeal.test.mjs`) : 3 nouveaux, rouges puis verts ; le test du nom de plat mis à jour.
- `.github/workflows/ios-build.yml` : `!app/scripts/persona/**` ajouté aux chemins exclus, cet outil n'entrant pas
  dans l'app. Cette PR-ci lance encore un build iPhone (elle touche le fichier du workflow), les suivantes plus.

## Vérifications
- Tests complets, lint : voir la PR (résultats notés ci-dessous avant le merge).
- Rien de visible dans l'app : pas de note de Nouveautés, pas de captures à relire.

## iPhone
- Aucun fichier embarqué ne change ; aucun correctif de `iphone/patches/` touché. Soumission bêta et expiration
  attendent la build du soir (cron en retard).

## Suite
1. Run suivant : merger cette PR si les checks sont verts.
2. Build du soir traitée par Apple → `ios-store-beta-submit.yml`, puis `ios-store-beta-expire.yml` ; noter l'Alpha.
3. Proposition « Poids » avec maquette au run « idées » de 08:00 ; POLISH-SIM suivants du BACKLOG.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

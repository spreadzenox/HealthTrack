# Run du 20/11 15:30 — Montre ou bague (POLISH-SIM-127b)

**Type** : 🛠️ code (polish, constat des personas) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main b9e0494.

## État de départ
- main vert sur #1149 (Tests, Build & Release v831, Play — AAB, émulateur) ; aucune PR de la routine ouverte
  (#1149 mergée par le run de 14:30).

## Ce qui a été fait
- **POLISH-SIM-127b** (`services/today.js`, `components/TodayBySource.jsx`) : la persona « Ventre, sans technique »
  (Galaxy Ring) lisait « D'après votre montre ». Le groupe « watch » de `todayBySource` porte maintenant `wear`
  (`watch`, `ring` ou `any`) déduit des appareils d'origine de ses tuiles ; `sourcesSentence` accepte les groupes et
  dit « votre montre » (montre reconnue : Huawei, Garmin, Apple Watch, Amazfit, Polar…), « votre bague » (Oura,
  Ultrahuman, « Ring »), sinon « votre montre ou bague » (Samsung Health, Gadgetbridge, Health Connect sans app
  d'origine). Avec des identifiants seuls, la phrase d'avant (tests existants inchangés).
- Aucune donnée ni schéma changés.

## Vérifications
- Test d'abord : `today.test.js`, 1 rouge (6 cas d'appareil), puis vert.
- `npm run test` : 4 154 verts ; `npm run build` vert ; lint des fichiers touchés propre.
- `npm run visual -- --routes=/ --now=14:00` : capture de l'Accueil relue (« D'après votre montre ou bague. », la démo
  vient de Gadgetbridge).

## iPhone
- Code partagé. Les correctifs 15 (« App Santé »), 30 et 56 touchent ces fichiers : `git apply --check` passe pour
  chacun. Sur iPhone, « App Santé · Apple Watch… » donne « votre montre ». Parité inchangée : 70 %.

## Suite proposée
1. Finir cette PR (checks, build iOS, capture iPhone de l'Accueil), merger.
2. POLISH-SIM-124b.
3. De jour : captures App Store de la refonte (REFONTE-2-ASC), puis PI2 (21 ou 22/11).

# 2026-10-16 08:30 Paris (06:30 UTC) — Run « idées » : l'humeur par le visage et la voix, ce qu'Android permet vraiment

**Type** : 💡 idées (D4, D5, D6, D1)  ·  **PR** : #182 « [Auto] Idées : visage et voix, plan Android vérifié »

## Pourquoi
- 08:30 Paris = run « idées » : pas de code produit.
- Démarrage : main à `8bd07c6` (v142), « Tests », « Build & Release » et émulateur A56 verts. Aucune PR « [Auto] »
  ouverte (`cursor/*` #51 non touchée). Aucun nouveau journal dans `journal/diagnostics/`.
- Le run idées du 15/10 20:30 avait laissé **non instruites** les règles Android d'un service caméra de premier plan
  (« à creuser avant tout code D4 »). Thème du matin : est-ce que la lecture du visage « niveau 2 » demandée le 12/10
  peut marcher sur l'A56 (Android 15/16, One UI), à quel prix, et qu'est-ce qu'elle vaut ?

## Ce qui a été fait
- Doc Android officielle : restrictions de démarrage des services de premier plan et exemptions, verrou « pendant
  l'utilisation » de la caméra et du micro (Android 14+), `BOOT_COMPLETED` (A14 / A15), changements A15 / A16,
  partage du micro entre apps.
- **Code d'AOSP (lecture seule)** : `ForegroundServiceTypePolicy` (un mode app-op `MODE_ALLOWED` passe le contrôle
  sans condition), `PermissionPolicyService` (resynchronise les modes app-op sur la permission, aussi quand un app-op
  change), manifeste du framework (`CAMERA` → `BACKGROUND_CAMERA`, `RECORD_AUDIO` → `RECORD_BACKGROUND_AUDIO`, toutes
  deux `internal|role`). Conclusion : `appops … CAMERA allow` est très probablement effacé par Android en quelques
  instants (à confirmer sur l'A56).
- **Emobot** : préprint medRxiv du 22/12/2025 (EmoDTx, caméra frontale pendant l'usage, score sur 14 jours,
  ρ = 0,65 avec le PHQ-9, 17 patients, financé par Emobot). **FacePsy** (référence citée par Emobot) : rafales de 10 s
  au déverrouillage et à l'ouverture d'apps, modèle personnel AUROC 0,81 contre 0,67 pour un modèle universel.
- Code HealthTrack : `targetSdk 36`, modèle de service natif existant (`WatchPresenceService`, `WatchSyncJob`) ;
  `moodEstimate.js` garde des entrées comportementales avec un sens codé en dur (code mort contraire à D5 / D6).
- `IDEES.md` : nouvelle section, **6 idées I88–I93**.
- `BACKLOG.md` : D4 (étude des limites cochée ; I88, I90, I89, I93 ajoutés ; I91 sur la voix), D5 (I92 en tête),
  prochaines étapes n° 3 et n° 14, « Livré » (+ ligne #180 du run 06:30, oubliée).
- `README.md` : paragraphe du run dans le résumé de la semaine, « Meilleures idées », ligne du tableau.
- Pas d'entrée « Nouveautés » : rien de visible dans l'app.

## Idées retenues (détail dans `IDEES.md`)
| # | Idée | Score |
|---|---|---|
| I88 | Service « Lecture du visage » créé depuis l'app, rafales au déverrouillage / ~3 min, « Reprendre » par notification | 15 |
| I90 | Une dizaine d'indices par rafale, tendance 14 j vs votre plage, calibrée sur vos notes | 15 |
| I92 | `moodEstimate.js` nettoyé + `ESTIMATOR_INPUTS` + test anti-circularité, avant D4 | 15 |
| I89 | Shizuku / ADB testé par l'app (mode app-op brut relu), pas promis | 12 |
| I91 | La voix d'abord par la dictée du soir ; fond en option, jamais pendant un appel | 12 |
| I93 | Question du soir un jour sur deux tiré au hasard + jours incertains, une fois calibré | 12 |

## Vérifications
- Journal seul modifié. `npm run test` : **1290 ✅** (100 fichiers) ; `npm run build` ✅. Pas de `visual` : aucun code
  de l'app touché. PR #182.

## Apprentissages / décisions
- **Décision** : le « niveau 2 » se fera **sans compter sur `appops`**. Le service visage est créé depuis
  l'interrupteur de l'app ; s'il meurt, une notification « Reprendre » le relance d'un geste (exemption officielle).
  Le guide Shizuku / ADB reste (demande du propriétaire) mais l'app vérifie elle-même si le privilège tient.
- **Décision** : l'humeur par le visage s'affiche en **tendance 14 jours**, jamais en émotion à l'instant ; les indices
  qui comptent sont choisis par la calibration personnelle (D6).
- Hypothèse à mesurer : ≈ 0,2 % de batterie par jour pour ≈ 140 rafales (estimation, aucune mesure publiée).

## Suite proposée
1. 🧹 D1 reste en tête des runs de code (« Voyage » déduit, Repas, avertissement Nutrition).
2. 🔁 D5 : **I92** (petit, livrable seul), puis I84.
3. 🙂 D4 : I88 (service + diagnostic exportable, validé sur l'A56 avant tout affichage), puis I90.
4. 💡 Prochain run idées (20:30) : taille APK / inférence MediaPipe en arm64 ; retours Samsung sur la caméra de fond.

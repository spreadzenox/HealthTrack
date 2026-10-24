# 2026-10-24 11:30 Paris (09:30 UTC) — CI : « plantage natif » play du test émulateur, bilan Play Integrity

**Type** : 🔧 CI (priorité : workflow rouge sur main) + 🧭💳 jalon 6, 6b-2c (préparation)

## Constat au démarrage
- Main à `1c98754` (#316). Build & Release, Tests et Play — AAB verts ; **« Test — émulateur Samsung Galaxy A56 »
  rouge sur main** (job API 35) : « Variante play : 0 erreur JS non interceptée, **1 plantage natif** au premier
  lancement ». Le job API 36 du même run est vert ; le run de #315 était vert.
- Aucune PR « [Auto] » ouverte (seule #51 `cursor/*`, non touchée), aucun Build & Release en cours.

## Diagnostic
- La capture `screenshot_play_first.png` montre l'onboarding de la variante play parfaitement affiché (premier
  écran utile en 6,7 s) : le processus de l'app n'est pas mort.
- `play-cold-start.sh` comptait les « FATAL EXCEPTION » de **tout** le tampon `crash` de l'émulateur
  (`adb logcat -b crash`), qui couvre tous les processus de l'appareil ; `adb logcat -c` ne le vidait pas
  forcément avant la mesure, et le fichier `play_crash.txt` n'était ni publié ni résumé : impossible de savoir quel
  processus avait planté. Un plantage d'un autre processus (tests instrumentés, sideload, service système de
  l'émulateur) faisait donc échouer le critère C4.
- Le job API 35 a été relancé une fois (règle : une seule relance) pour voir si l'échec se reproduit : résultat
  ci-dessous.
- **Relance : verte** (job 120838661046, 0 plantage) : l'échec ne se reproduit pas sur le même commit, ce qui confirme
  un plantage intermittent hors de l'app ; main est vert.

## Ce qui a été fait
- `.github/scripts/play-cold-start.sh` : `adb logcat -b all -c` avant le lancement ; ne compte que les plantages dont
  la ligne `Process:` est `fr.jpesquet.sante` (ou un de ses sous-processus) ; les autres sont affichés à part
  (« ignorés ») ; les 40 premières lignes du tampon `crash` sont écrites dans le résumé du job.
- `emulator-samsung-a56.yml` : `play_crash.txt` publié avec les captures (API 35 et 36).
- `relay-deploy.yml` (6b-2c, préparation) : étape non bloquante « Bilan Play Integrity des 7 derniers jours » — table
  statut × mode × raisons × nombre d'installations (identifiants hachés) des événements `event=integrity` du relais.
  Le merge redéploie le relais (même code) et écrit ce bilan : c'est la preuve qu'attend le passage en `enforce`.

## Vérifications
- `npm run test` : 174 fichiers, 2 122 tests verts. `npm run build` OK. `npm run lint` : 6 erreurs, identiques à main.
- `npm run visual` (13 pages, sideload) : 0 erreur JS ; captures relues (rien ne change dans l'app).
- `bash -n` du script, YAML validé, expression `jq` du bilan essayée sur un jeu d'événements synthétique.

## Suite
- Lire le bilan Play Integrity dans le résumé du run « Relais — déploiement » de ce merge : si des `passed` viennent
  du téléphone du propriétaire et aucun `rejected` inexpliqué → `INTEGRITY_MODE=enforce` (6b-2c-2). Sinon M4.

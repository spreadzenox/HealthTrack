# 2026-10-12 14:30 UTC (16:30 Paris) — Directives du 12/10 + nettoyage, étape 1

**Type** : 🧹🎨 (D1)  ·  **PR** : voir tableau du résumé de la semaine

## Pourquoi
- Démarrage : aucune PR [Auto] ouverte, main vert (v105, 9ff9780).
- **Premier run qui lit les directives du propriétaire du 12/10** (« l'app devient un sac à features ») : les reporter
  dans la charte (§00) et le backlog (chantiers D1–D6), réordonner, puis attaquer D1 — la passe de nettoyage.
- 16:30 Paris → pas un run « idées ».

## Ce qui a été fait
- **Charte** : nouvelle section §00 (directives du 12/10, priment sur tout) ; note sur la priorité n° 3 du 11/10
  (l'humeur ne s'estime plus par sommeil / activité / écran). **Backlog** : chantiers D1–D6 en tête, inventaire D1,
  « Prochaines étapes » réordonnées, vision n° 3 corrigée, « Humeur estimée étape 2 » abandonnée.
- **Inventaire** de chaque page (captures de toutes les pages lues) → liste dans `BACKLOG.md` › D1.

### Retiré / fusionné, et pourquoi
| Élément | Avant | Après | Pourquoi |
|---|---|---|---|
| Tag « 📱 Écran tard » du check-in | toujours demandé | masqué quand « Temps d'écran » est actif (une note qui l'a déjà le garde visible pour pouvoir l'ôter) ; une phrase dit qu'il est mesuré | le téléphone le capte (exemple donné par le propriétaire) |
| « Vos habitudes » → Écran tard | tags déclarés seulement | soirée mesurée = ≥ 30 min d'écran entre 22 h et 4 h (entrée `phone_usage` du lendemain) ; la mesure prime sur le tag, le tag compte là où rien n'est mesuré ; analysé même sans aucun tag ; mention « mesuré par le téléphone » | sinon, une fois le tag masqué, chaque nouvelle soirée aurait compté « sans » (biais) |
| Carte « Humeur estimée » (accueil) | 2ᵉ note /5 à côté de « Prédiction du jour » (1,9 vs 1,8 dans la démo) | retirée de l'affichage ; `moodEstimate.js` conservé (calibration Ridge + garde-fou LOO réutilisables en D4), en-tête annoté | doublon + entrées comportementales = raisonnement circulaire interdit par D5 |
| Lien « Nouveautés de l'application → » (Paramètres) | en haut des Paramètres | retiré | déjà dans Plus → Nouveautés |
| Mode debug (Paramètres) | adresse MAC à saisir à la main puis « Vérifier » puis interrupteur | un interrupteur « Mode diagnostic » ; un mode déjà activé le reste | Android ne donne pas la MAC à une app ; rien de sensible affiché ; servira l'écran de diagnostic Huawei (D3) |
| Titre de l'onglet Analyses | « Recommandations », onglets « Recommandations basiques / avancées » | « Analyses », « Analyse simple / avancée » | l'onglet s'appelle « Analyses » ; la page n'est pas qu'une liste de recommandations |

- Corrigé au passage : le libellé de l'interrupteur (« Mode diagnostic désactivé ») était quasi invisible
  (`--color-text` inexistant → repli gris foncé) ; il passe en `var(--text)`.
- Aucune donnée touchée : pas de changement de schéma, les anciens tags `late_screen` restent lus, l'import / export est
  inchangé ; l'ancienne clé `healthtrack_debug_mac` est simplement ignorée.
- Nouveautés : `2026-10-12-1430-nettoyage.json`.

## Vérifications
- Tests : 959 ✅ (65 fichiers ; −13 tests de la carte retirée, −10 tests MAC, +9 nouveaux : écran tard mesuré ×5,
  check-in ×2, mode diagnostic ×3 réécrits) · Lint : 6 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : `npm run visual` complet OK, `--empty`, `--light` (accueil, paramètres, analyses), `--phone --wellbeing-prompt`
  (check-in sans « Écran tard » + phrase « mesuré par le téléphone »). Lus : accueil (Radar puis cœur, plus de carte
  humeur), Analyses (titre, onglets, « Écran tard … 62 jours avec · 12 sans · mesuré par le téléphone »), Paramètres
  (plus de lien Nouveautés, interrupteur lisible), accueil vide.

## Apprentissages / décisions
- Masquer un tag sans changer l'analyse aurait faussé « Vos habitudes » (soirées non cochées comptées « sans ») :
  **toute suppression d'une saisie doit s'accompagner de sa source automatique dans l'analyse.**
- Repéré pour D6 : `leverAction` (analysisEngine.js) **cache** une piste quand le sens observé contredit la norme
  (`direction: 'lower_better'` pour l'écran…) — exactement ce que le propriétaire ne veut plus : à rendre neutre.
- Données de démo : 62 soirées « écran tard » sur 74 → la démo a beaucoup d'écran le soir ; sans conséquence.

## Suite proposée
- D1, étape 2 : bloc « Forme » unique sur l'accueil, corrélations incertaines repliées, doublon « Écran tard » des
  Analyses, Withings regroupé, « + 1 cigarette » conditionnel, tags « Sport le soir » / « Voyage » auto-détectés.
- Puis D2 (mesurer la performance d'abord), D3 (écran de diagnostic + export des logs en premier).

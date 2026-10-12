# 2026-10-12 12:30 UTC (14:30 Paris) — Humeur estimée « plage habituelle »

**Type** : 🏗️  ·  **PR** : voir ci-dessous

## Pourquoi
- Démarrage : aucune PR [Auto] ouverte, main vert (v104, 4a19aab, Build & Release ✅).
- Priorité n° 3 du propriétaire (humeur captée passivement, style Emobot) et « prochaine priorité » du résumé de la
  semaine : I31 / I7. Le temps d'écran et le sommeil estimé (run précédent) la nourrissent déjà.

## Ce qui a été fait
- **Service pur** `app/src/services/moodEstimate.js` (`computeMoodEstimate`) :
  - signaux du jour J : sommeil de la nuit qui finit à J (`nightlySleep`, montre sinon téléphone), VFC (log), FC repos,
    **pas de la veille** (ceux du jour ne sont pas finis), écran tard (`phone_usage`) ; une valeur manquante = inconnue ;
  - norme = 28 jours précédents (≥ 7 par signal), score = écart orienté en ET (+ = favorable), borné ± 3, ≥ 2 signaux ;
  - indice = moyenne des scores, bande « dans votre plage » à ± 0,75 ;
  - **calibration** dès 14 jours de notes : Ridge des notes sur les scores (λ par LOO exact, `ridgeLooPredictions`),
    **gardée seulement si l'erreur LOO bat de ≥ 10 % celle de la moyenne seule** ; note /5 + fourchette ± 1,28 RMSE LOO
    (≈ 80 %), signaux qui comptent (β > 0,05) ; bande alors relative à la moyenne des notes (± 0,5 ET) ;
  - « bas durable » : ≥ 10 jours « en dessous » parmi les 14 derniers → renvoi doux (proche, médecin, 3114).
- **Carte** `MoodEstimateCard` sur l'accueil, sous le Radar : badge de bande, note /5 si calibrée, chaque signal avec
  sa valeur habituelle (pastille verte / jaune / grise), « Ce qui suit le plus vos notes », note de pied « estimation,
  pas un diagnostic » + compteur « n/14 notes de bien-être » ; masquée sans aucune mesure ; « Encore N jours » sinon.
- Bug évité grâce au test : une nuit seule n'apparaît pas dans `buildDailyDataset` si le jour du réveil n'a aucune
  autre entrée (`if (days.has(dk))`) → le service lit `nightlySleep` directement. (Effet mineur dans les Analyses :
  un tel jour n'a de toute façon pas de note de bien-être.)
- Nouveautés : `2026-10-12-1230-humeur-estimee.json`.

## Vérifications
- Tests : 970 ✅ (66 fichiers, +17) · Lint : 6 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : `npm run visual` complet OK (aucune erreur JS) ; lu : accueil (carte « Aujourd'hui · Dans votre plage
  habituelle · 1,9 / 5 entre 0,8 et 3,0 », sommeil 6 h 30 vs 7 h 19, pas 8 585 vs 7 645, calibrée sur 67 notes),
  `--empty` (carte masquée), `--light`. Espacement de la ligne « Ce qui suit… » corrigé après la première capture.

## Apprentissages / décisions
- **Pas de pré-remplissage du check-in** avec l'estimation (proposé par I7) : la note pré-remplie serait souvent
  validée telle quelle et deviendrait la donnée d'apprentissage du modèle (boucle qui s'auto-confirme). À reconsidérer
  seulement avec un affichage *après* la saisie (« l'estimation disait 3,2 »), qui mesure aussi la précision.
- Garde-fou de calibration (LOO ≥ 10 % mieux que la moyenne) : sur des notes sans lien avec les signaux, l'app
  n'affiche pas de note /5 et le dit — l'indice reste une description des écarts, pas une prédiction.
- Doublon possible avec « Prédiction du jour » (modèle complet des Analyses) : les deux restent pour l'instant ; la
  prédiction utilise tout (repas, tags…), l'humeur estimée seulement les signaux passifs. À fusionner dans le futur
  briefing du matin (I24).

## Suite proposée
- Briefing du matin (I24) qui reprend humeur estimée + Radar + météo en une carte et une action.
- Humeur estimée, étape 2 : régularité du sommeil (écart du coucher) et temps dehors / mobilité comme signaux ;
  mini-courbe 14 j de l'indice ; « l'estimation disait… » après chaque check-in (précision mesurée).
- Ajouter le sentiment du journal libre / des conversations (I26, I10) quand ils existeront.

# Run 15/11 21:35 — Refonte « Compagnon », étape 6d : score au 7e jour, pistes au 14e

**Type** : run de code  ·  **Android** : main 0601cd7 (#1025, journal seul)  ·  **TestFlight** : pas de relevé App
Store Connect à ce run (dernière connue : 1096.1096, envoyée le 15/11 à 19:40)  ·  **Parité** : 70 % (33/47),
inchangée

## Contexte
- Empreinte des instructions conforme (69177875…). Lus en entier : les quatre fichiers d'instructions, les comptes
  rendus de 18:35 et 20:35. Lus en partie : le résumé, le bloc REFONTE-6 du `BACKLOG.md`, `ETAPE-6D-BANC.md`.
  Le brief et les documents iPhone n'ont pas été relus à ce run (étape courte, déjà découpée par le banc).
- PR de la routine ouverte : **#1024** (7a, run de 19:35), 14 checks verts sur 2046fd6, build iOS comprise ; #51
  (cursor) pas touchée.

## Fait
1. **#1024** : capture iPhone `demo-clair-tendances` regardée sur `captures/pr-1024` (Tendances › Semaine, rien de
   cassé ; « Vos saisies » n'apparaît qu'au toucher d'un jour, et le plan de captures ne touche pas de jour).
   Branche en retard sur main (#1025) et **en conflit dans `journal/README.md`** : fusion de main, les deux lignes
   gardées (7a et le « Probable » de 20:35 ; lignes 20:35 et 19:35 du tableau), poussée à 21:4x (2f83375). La build
   iOS repart pour environ une heure : pas mergée à ce run.
2. **REFONTE-6d en code** (branche `claude/refonte-6d-horizon-moyen`, partie de main) :
   - `UNLOCK_DAYS.wellbeing.medium` : 21 → 35 (`analysisResults.js`).
   - `bench.test.js` : deux cas, effet fort du sommeil, 21 et 28 jours tous notés, 400 jeux, ≤ 5 % de jeux avec un
     faux lien. **Vus rouges avant** : 7,25 % et 6 % (les chiffres du banc de 20:35) ; verts après.
   - `analysisResults.test.js` : à 30 jours le moyen terme reste fermé ; à 37 jours il s'ouvre.
   - Visite guidée (`tour.js`) : « Un premier score après 7 jours notés, vos pistes après 14. » ; avec la digestion
     « Bien-être : un score après 7 jours notés, des pistes après 14. Digestion : 14 et 28. » ; étape digestion
     « Son score après 14 jours notés, ses pistes après 28, dont 5 avec une gêne. »
   - Paywall de l'accueil (`Premium.jsx`, hors période de lancement) : « Votre premier score arrive au 7e jour noté,
     vos pistes vers le 14e. Le premium débloque les pistes dès qu'elles sont prêtes ; … ».
   - « Voir un exemple » n'écrit aucun délai : rien à changer.
   - Note de Nouveautés `2026-11-15-2135-score-et-pistes.json` (Android et iPhone).
3. `BACKLOG.md` (6d coché, 6d-2 ouvert), `PRODUIT.md`, résumé (ligne « Probable », tableau).

## Vérifs
- `npm run test` : 3708 verts (44 ignorés), lint sans erreur, build OK, `npm run visual` complet sans erreur JS.
  Capture `recommendations-bien-etre-1` regardée (données de démo, 75 jours : familles, pistes et court terme
  inchangés, comme attendu). PR **#1026**.
- iPhone : aucun correctif de `iphone/patches/` ne touche `tour.js`, `Premium.jsx`, `analysisResults.js` ni
  `firstResults.js` (grep). `scripts/upstream.sh` ne tourne pas ici (clone sans historique) : le job « les
  correctifs s'appliquent » et la build simulateur de la PR le vérifient.

## Limites
- La visite guidée et le paywall de l'accueil n'ont pas de capture : le banc visuel ne sait pas les ouvrir. Textes
  vérifiés mot pour mot par les tests seulement (REFONTE-6d-2).
- Sur les données de démo (75 jours), rien ne change à l'écran : l'effet ne se voit qu'entre 21 et 35 jours notés.

## Suite
- **Run de 22:35** : merger #1024 (build iOS verte, à jour sur main), puis remettre à jour la PR de 6d et la merger
  quand ses checks sont verts (ordre : 7a d'abord, la PR de 6d touche aussi le résumé).
- Puis REFONTE-7b (Données sur 2 onglets, redirection de `/journal`, visite guidée sans écran disparu).

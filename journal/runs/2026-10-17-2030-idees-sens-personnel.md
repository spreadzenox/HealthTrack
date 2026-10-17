# 2026-10-17 20:30 Paris (18:30 UTC) — Run « idées » : le sens « chez vous » sans se tromper

**Type** : 💡 idées (D6, D5)  ·  **PR** : « [Auto] Idées : sens personnel sans faux positifs + test App sans réseau »

## Pourquoi
- 20:30 Paris = run « idées » : pas de code produit.
- Démarrage : main à `4ecaa25` (#197, v155). « Build & Release » et émulateur A56 verts, mais **« Tests » rouge sur
  main** : 1337 tests verts et une erreur non gérée (`window is not defined` dans `UpdateBanner.jsx:21`, depuis
  `App.test.jsx`). PR #198 (run 18:30) ouverte, verte (Vitest, Build APK, Protocole montre, émulateur A56), sans
  conflit → **fusionnée en squash en premier** (`219e20a`), au titre de l'autorisation permanente. `cursor/*` #51 non
  touchée. Aucun nouveau journal dans `journal/diagnostics/`.
- Sujet prévu par le run idées de 08:30 : I97 ② — apprendre le sens personnel d'un signal avec peu de jours.

## Ce qui a été fait
- **Test instable corrigé** (pas du code produit) : `App.test.jsx` appelait la vraie API GitHub via `UpdateBanner` ;
  quand la réponse arrivait après la fin du fichier, React écrivait dans un environnement démonté → CI rouge au
  hasard. `fetchLatestRelease` est maintenant simulé (renvoie `null`) dans ce fichier.
- Veille : étude JMIR *multiple n-of-1* (8 porteurs d'Oura, 125–386 jours chacun), proposition bayésienne pour les
  auto-expériences (PMC6398612), aide d'Exist / Bearable / Welltory, n-of-1 Oura + humeur (arXiv 2510.02511), One UI 8,
  licences d'images test.
- **Simulation** `journal/protocoles/sens-personnel-sim.py` (outil de recherche hors app) : 3 règles × 5 durées ×
  3 forces de lien, 2 000 tirages, séries AR(1) à 0,4.
- `IDEES.md` : nouvelle section, **5 idées I102–I106**. `BACKLOG.md` : D6 (I97 ② → I102–I105), I101 (images, I106),
  I96 (chemin One UI 8), prochaines étapes n° 14. `README.md` : paragraphe du résumé, « Meilleures idées », tableau
  (#198 → v156, ce run).
- Pas d'entrée « Nouveautés » : rien de visible dans l'app.

## Idées retenues (détail dans `IDEES.md`)
| # | Idée | Score |
|---|---|---|
| I102 | Estimateur unique « chez vous » : X de la veille, préblanchiment AR(1), a priori centré sur 0, seuil 97,5 % | 20 |
| I103 | Verdict « pas de lien notable chez vous » (zone d'équivalence 0,2) | 16 |
| I104 | Fréquences (« 7 de vos 10 journées comparables ») au lieu de r, après un verdict I102 | 16 |
| I105 | Jours hors norme mis de côté sans saisie (voyage, maladie probable, changement d'heure) | 12 |
| I106 | Images test du visage : portraits officiels fédéraux US (domaine public) | 10 |

## Vérifications
- `npm run test` : **1341 tests verts** (102 fichiers), **plus d'erreur non gérée**. Lint : 6 erreurs (inchangé).
  `npm run build` ✅. Pas de `visual` : aucun
  code de l'app touché (un fichier de test seulement).
- Simulation : erreurs de sens sans lien — brute 90 % : 10 % (30 j) → 26 % (180 j) ; préblanchie 90 % : 6 → 16 % ;
  **retenue (préblanchie + a priori 0,2 + 97,5 %) : 0,2 → 3,6 %** ; lien r = 0,3 trouvé 43 % à 60 j, 88 % à 120 j,
  98 % à 180 j ; sens inversé ≤ 0,05 %.

## Apprentissages / décisions
- Sans correction de l'autocorrélation, le taux de faux sens **augmente** avec le nombre de jours (le test croit avoir
  plus d'information qu'il n'en a) : le préblanchiment n'est pas optionnel.
- L'a priori est centré sur **zéro**, jamais sur la norme générale (D6) ; la norme ne sert qu'à l'ordre d'examen.
- « Pas de lien chez vous » est le résultat le plus fréquent dans la littérature n-of-1 : le dire est une
  simplification (D1), pas un échec.
- Fusion : #198 fusionnée sans erreur, mais le contrôle automatique de la session a ensuite refusé une simple
  lecture de fichier en la classant « Merge Without Review » (comme au run de 16:30). Je ne tente donc pas de fusionner
  la PR de ce run. **Propriétaire : un clic pour la fusionner, ou une règle d'autorisation de fusion dans les réglages
  de l'environnement de la routine pour que les runs fusionnent seuls.**

## Suite proposée
1. 🧹 D1 reste en tête des runs de code (Repas et Nutrition une dernière fois).
2. 🧭 D6 : **I102** (`personalDirection.js` + Radar), puis I103 / I104 / I105.
3. 🙂 D4 : I100 ① (moteur LiteRT), avec I106 pour le test d'équivalence.
4. 💡 Prochain run idées (18/10 08:30) : combien de X tester sans noyer les vrais liens ; ABAB avec I102 ; voix 2026.

# 2026-10-18 20:30 Paris (18:30 UTC) — Run « idées » : l'humeur par le visage, quand y croire et sans quel piège

**Type** : 💡 idées (consigne du 18/10, point B ; D4, D5, D6)  ·  **PR** : « [Auto] Idées : porte du visage, note du soir d'un geste, biais de composition »

## Pourquoi
- 20:30 Paris = run « idées » : pas de code produit.
- Démarrage : main à `1fd5cbf` (#210 fusionnée). « Build & Release » #167 vert → **v167 publiée, APK 15,1 Mo**
  (≈ 15 Mo attendus au run de 18:30 : confirmé). « Tests » et émulateur A56 verts. Aucune PR « [Auto] » ouverte ;
  `cursor/*` #51 non touchée. Aucun nouveau journal dans `journal/diagnostics/`.
- A.1–A.3 fusionnés → point B prioritaire. Le moteur du visage est dans l'APK ; avant d'écrire le service (I88),
  il fallait savoir **quand** l'estimation pourra être crue, **quelle étiquette** demander à l'utilisateur, et
  **quels pièges** de circularité guettent la capture elle-même.

## Ce qui a été fait
- Lecture intégrale de MoodCam (arXiv 2412.12625, PDF converti) : même dispositif que I88 (rafales au déverrouillage
  et à l'ouverture d'apps), 3 questionnaires par jour, AUC 0,64 entre personnes, ouverture des yeux = meilleure
  variable, aucun modèle personnel. Résumés de FacePsy, Ringwald 2025 (sens du lien variable selon les personnes),
  Meegahapola 2023 (personnalisation 0,78–0,98 contre 0,51), Reiter 2025 / van Berkel 2019 (questions après
  déverrouillage). Emobot : rien de neuf en 2026.
- Vérification dans le code : **aucune notification de rappel** pour la note de bien-être (seulement la montre) ;
  `POST_NOTIFICATIONS` déclarée ; récepteur dynamique `ACTION_USER_PRESENT` déjà présent (`WatchPresenceService`).
  Correction de la fiche I109 (qui supposait des rappels existants).
- **Simulation** `journal/protocoles/humeur-etiquettes-sim.py` (outil de recherche hors app) : A) porte I110 selon
  l'étiquette (note du soir / 1 ou 3 micro-notes au déverrouillage / mixte), le seuil et la règle des deux regards ;
  taux de réponse 85 % contre 40 % ; B) biais de composition (rafales prises pendant l'usage des réseaux sociaux).
- `IDEES.md` : nouvelle section, **4 idées I112–I115** + écartées. `BACKLOG.md` : point B détaillé (I114, I112, I113,
  I115) et ordre interne du point 2 des « Prochaines étapes ». `README.md` : résumé, « Meilleures idées », tableau
  (ligne du run 18:30 complétée : v167).
- Pas d'entrée « Nouveautés » : rien de visible dans l'app.

## Idées retenues (détail dans `IDEES.md`)
| # | Idée | Score |
|---|---|---|
| I114 | Rafales au déverrouillage seulement pour l'humeur + test anti-circularité « composition » | 25 |
| I112 | Porte I110 au niveau du jour, un indice combiné, \|z\| ≥ 3,29 à deux regards consécutifs, refermeture | 20 |
| I113 | Note du soir d'un geste depuis la notification (5 boutons, file native) | 15 |
| I115 | Le visage complète les jours sans note, jamais à la place | 12 |

## Vérifications
- Simulation A (1 000 tirages par case, porte |z| ≥ 2,81, note du soir à 85 %) : r_b = 0,2 → 41 / 58 / 72 / 87 % ouverte
  à J28 / J42 / J60 / J90 ; 3 micro-notes au déverrouillage 23 / 36 / 47 / 63 % ; 1 micro-note 12 / 20 / 26 / 33 %.
  Faux départs (r_b = 0) à J120 : 8 % (un regard), **4 % (deux regards)** ; seuil 3,29 + deux regards (600 tirages) :
  **2 %**, r_b = 0,2 ouverte 48 % à J60, 73 % à J90. Réponse 40 % au lieu de 85 % : 24 % à J60, 39 % à J90.
  Qualité une fois ouverte : corrélation indice du jour ↔ vraie humeur du jour ≈ 0,42 (r_b = 0,2).
- Simulation B (1 000 tirages) : sans aucun lien, corrélation fabriquée humeur estimée ↔ part de réseaux sociaux
  0,003 (δ = 0), **0,090 (δ = 0,25), 0,189 (δ = 0,5)**.
- `npm ci` puis `npm run test` : **1 415 tests verts** (108 fichiers). Pas de `build` / `visual` / `lint` : aucun fichier de l'app touché
  (journal seulement).

## Apprentissages / décisions
- **La note du soir est la bonne étiquette** pour calibrer le visage : la moyenne de ≈ 30 rafales du jour bat
  2–3 rafales autour d'une micro-note. Pas de questions au déverrouillage (moins de saisie, et meilleur).
- Le jackknife sur peu de jours est optimiste et regarder chaque semaine multiplie les chances : **deux regards
  consécutifs** et seuil 3,29 sont nécessaires (même leçon que l'erreur type de Cochrane-Orcutt au run de 08:30).
- **D5 s'applique aussi à la capture** : une variable exclue des entrées (réseaux sociaux) peut quand même piloter
  Y si elle change **quelles images** l'estimateur voit. D'où le déclencheur « déverrouillage seulement » et un test
  dédié. À documenter dans `estimatorInputs.js` au moment d'I90.
- Attente réaliste à dire au propriétaire : **2 à 3 mois** avant que le visage serve, peut-être jamais chez lui ;
  la régularité de sa note du soir est le levier qu'il contrôle.

## Suite proposée
1. 🙂 Point B, dans cet ordre : **I113** (note du soir d'un geste, un run, utile tout de suite) → **I88** service
   « Lecture du visage » déclenché au déverrouillage (I114) + diagnostic exportable → **I90** `face_burst` avec
   `trigger` + test « composition » → **I112** `gate.js` → I115.
2. 🧹 D1, ⚡ D2 ensuite (budget de taille d'APK en CI : v167 = 15,1 Mo, référence pour le budget).
3. 🗓️ Le prochain run (lundi 19/10 00:30 Paris) ouvre la semaine S43 : **archiver le résumé S42** dans
   `semaines/2026-S42.md` avant d'en ouvrir un nouveau.
4. 💡 Prochain run idées (19/10 08:30) : π0 adaptatif, effet alcool / café sur la VFC chez une personne, étiquette d'énergie par
   la dictée, déverrouillages par jour sur l'A56.

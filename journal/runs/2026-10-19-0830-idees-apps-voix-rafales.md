# 2026-10-19 08:30 Paris (06:30 UTC) — Run « idées » : temps par app, voix par la dictée, assez de rafales

**Type** : 💡 idées (consigne du 18/10 au soir, priorité unique ; D4, D5, D6)  ·  **PR** : « [Auto] Idées : temps par app, voix par la dictée, rafales par jour »

## Pourquoi
- 08:30 Paris = run « idées » : pas de code produit, toute la veille sur le bien-être automatique.
- Démarrage : main à `a28e1e7` (#216 fusionnée). « Build & Release » #172, « Tests » #541 et émulateur A56 verts sur
  ce commit. Aucune PR « [Auto] » ouverte ; `cursor/*` #51 non touchée. Rien de nouveau dans `journal/diagnostics/`
  (le diagnostic visage de l'A56 n'est pas encore revenu).
- Restent au plan (`BIEN-ETRE-AUTO.md` §3) : temps par app (X), voix (I91), Shizuku / ADB (I89), estimation du jour
  (I115). Avant de les coder, il fallait savoir ce que vaut la voix en 2026, comment compter le temps par app avec ce
  qui existe, et si le propriétaire déverrouille assez souvent pour que le visage serve.

## Ce qui a été fait
- Lecture du code : `PhoneUsagePlugin.queryScreenEvents` lit déjà `queryEvents` (écran, `KEYGUARD_HIDDEN`), accès
  « Données d'utilisation » et guide « paramètres restreints » déjà en place ; manifeste : `<queries>` limité aux
  apps santé (il faudra `MAIN/LAUNCHER` pour lire les catégories d'apps).
- Veille : npj Digit. Med. 2026 (lu en entier via PMC), Sci. Rep. 2026, Frontiers 2026, JMIR 2021 ; documentation ML
  Kit GenAI (appareils, Speech Recognition) et `RecognizerIntent.EXTRA_AUDIO_SOURCE` ; paramètres restreints
  d'Android 15 ; fiabilité de `queryEvents` ; Elmer et al. 2025 ; déverrouillages / jour ; Shizuku ; Emobot (rien
  de neuf).
- Simulation `journal/protocoles/rafales-par-jour-sim.py` (réutilise le modèle de `humeur-etiquettes-sim.py`) : délai
  d'ouverture de la porte selon le nombre de rafales valides par jour.
- `IDEES.md` : nouvelle section, **5 idées I116–I120** + écartées. `BACKLOG.md` : I116–I120 dans la section du
  chantier, I91 précisé, ordre interne des « Prochaines étapes ». `BIEN-ETRE-AUTO.md` : étapes 4 et 5 précisées.
  `RESEARCH.md` : section du 19/10. `README.md` : résumé de la semaine, « Meilleures idées », priorités, tableau.
- Pas d'entrée « Nouveautés » : rien de visible dans l'app.

## Idées retenues (détail dans `IDEES.md`)
| # | Idée | Score |
|---|---|---|
| I116 | Temps par app → facteurs X (catégories `ApplicationInfo.category`, jour + heure, aucun sens présupposé) | 25 |
| I119 | Lexiques disjoints ressenti (Y) / contexte (X) pour la dictée et les notes libres, test d'intersection vide | 20 |
| I118 | ≥ 12 rafales valides / jour : diagnostic, 2e essai après rejet, intervalle 5 → 2 min, toujours au déverrouillage | 16 |
| I117 | Dictée du soir : une prise de son lue deux fois (prosodie + reconnaissance), rien sur disque, propositions | 12 |
| I120 | Intra-journée : rafale ↔ apps de l'heure d'avant, porte ouverte seulement | 9 |

## Vérifications
- Simulation (300 tirages par case, porte |z| ≥ 3,29 à deux regards, note du soir 85 %) : ouverte à J120 pour
  r_b = 0,2 : 30 / 55 / 78 / 87 % avec 4 / 8 / 16 / 32 rafales valides par jour ; r_b = 0,3 : 72 / 93 / 98 / 99 % ;
  faux départs 1–3 % ; qualité une fois ouverte 0,24 → 0,41 (r_b 0,2).
- `npm ci` puis `npm run test` : **1 483 tests verts** (113 fichiers). Pas de `build` / `visual` / `lint` : aucun
  fichier de l'app touché (journal seulement).

## Apprentissages / décisions
- **Voix : le contenu d'abord.** Dans la plus grande étude 2026 sur téléphone, le son de la voix fait presque jeu égal
  avec le hasard et rien ne marche intra-personne ; ce que la personne dit de sa journée porte l'essentiel. La voix
  passe donc par une dictée facultative (auto-déclaration = Y), la prosodie reste candidate derrière la porte, et le
  micro permanent est écarté pour l'instant (à rouvrir si la prosodie passe la porte chez le propriétaire).
- **D5 s'applique au texte** : un même texte ne doit pas nourrir à la fois l'humeur estimée et les facteurs ; d'où
  deux lexiques disjoints et un test (I119).
- **Pas de LLM embarqué** : Gemini Nano n'est pas proposé sur les Galaxy A ; règles locales pour la dictée.
- **Le temps par app est un petit run** : tout le plumbing existe ; c'est le meilleur prochain pas de code tant que le
  diagnostic de l'A56 n'est pas revenu.
- **Seuil à surveiller** : ≈ 12 rafales valides par jour. Ne jamais déclencher à l'allumage d'écran (une notification
  allume l'écran : son contenu biaiserait le visage, même piège que I114).

## Suite proposée
1. 🙂 Prochain run de code (10:30) : **I116** temps par app comme X (natif + `phoneUsage.js` + facteurs + test
   anti-circularité + une ligne dans la carte Temps d'écran) ; vérifier sur l'A56 l'écart avec Bien-être numérique.
2. 🙂 Puis I118 (rafales / jour dans le diagnostic), I89, I119 → I117, I115 quand la porte peut s'ouvrir.
3. 📥 Dès que le diagnostic de l'A56 arrive dans `journal/diagnostics/` : le lire avant tout le reste.
4. 💡 Prochain run idées (19/10 20:30) : lexique du ressenti en français sous licence libre ; Bien-être numérique
   One UI vs `queryEvents` ; reconnaissance vocale fr-FR hors ligne réellement disponible sur un Galaxy A.

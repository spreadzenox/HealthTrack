# Rituel du soir, lanternes du défi et poses du widget : inventaire et découpage (run « idées » du 17/11 20:30)

Restes du sprint (REFONTE-RESTES-SPRINT, BACKLOG) qui viennent après MONDE-4b. Références : `specs/comprendre.SPEC.md`
§ 6.5, § 7, § 9 et § 10 ; `specs/journee.SPEC.md` § 7 à § 9 ; `journal/sprint/LOT-VIE.md` et `LOT-MONDE.md`.

## 1. Ce que dit la SPEC et ce que le propriétaire a tranché depuis

La SPEC décrit un défi « 5 soirs réussis, pas forcément d'affilée, en 10 jours au plus » sur une seule piste (pas
d'écran après 22 h). **Le propriétaire a tranché le 15/11 : « la piste en défi garde le tirage au sort »**. Le défi de
l'app (`services/trials.js`, REFONTE-6c-2) est donc : 10 jours, 5 « avec » et 5 « sans » tirés au sort, sur n'importe
quel facteur mesuré (sommeil, pas, écran) ou demandé. Conséquences pour les lanternes :

- **5 lanternes = les 5 jours « avec »**, pas 5 soirs réussis. Une lanterne s'allume quand un jour « avec » est
  tenu (`held === true`, lu dans les données ou la réponse du matin). Un jour « avec » pas tenu : lanterne éteinte,
  rien ne repart à zéro (SPEC § 7 « Soir manqué », textes adaptés). Les jours « sans » n'ont pas de lanterne : la
  grille `TrialDots` les garde en pastilles à contour.
- **Le rituel du soir** (Pilou range son téléphone dans le tiroir) n'a de sens que pour une piste d'écran le soir,
  un jour « avec ». Pour les autres facteurs : pas de rituel, seulement la lanterne du lendemain.
- **Le bilan** garde les mots déjà codés (`bilanWords`, fourchette au lieu de minutes) ; la SPEC ajoute l'image des
  5 lanternes et Pilou qui « salue l'effort, pas le résultat » (deux signes de tête, pas de confettis).

## 2. Inventaire : écrit, branché, absent

| Élément | Où | État |
|---|---|---|
| Lanterne 3D (cadeau J2), allumée le soir et la nuit, scintillement ±8 % | `companion/scene/gifts.js`, `stage.js` (`setEvening`) | ✅ branchée |
| Défi de 10 jours tiré au sort, tenue lue dans les données, bilan en mots | `services/trials.js`, `pages/Trial.jsx`, `components/TrialDots.jsx` | ✅ (sans Pilou) |
| Pilou sur la page du défi (80 px à côté de « Je teste », saut à l'acceptation) | `pages/Trial.jsx` | ❌ absent |
| 5 lanternes du défi (bandeau « Jour avec 2 sur 5 », allumage le matin) | aucun | ❌ absent |
| Allumage d'une lanterne sur l'îlot de l'Accueil le matin | `scene/` + bus | ❌ absent |
| Rituel du soir (tiroir, téléphone rangé) | aucun | ❌ absent |
| Rappel « Me le rappeler à 21 h 55 ? » | aucun (seul `trialReminder.js` existe, c'est le rappel de paiement) | ❌ absent |
| Digestion du soir dans Ma journée : textes de Pilou | `companion/life/lines.js` (« Merci de me l'avoir dit. Reposez-vous bien. ») | ✅ |
| Pilou et sa bouillotte (journée § 7) | aucun ; LOT-VIE : chorégraphies fines jouées en 3D sur l'Accueil, version CSS simple dans Ma journée | ❌ absent |
| Calme du soir après « Plus rien à faire » (≥ 21 h : lanterne, bâillement, « z ») | `companion/life/` (texte), lanterne de l'îlot (heure) | 🟡 texte et lanterne, pas le bâillement |
| Six poses du widget | `res/drawable-nodpi/pilou_pose_*.webp`, rendues depuis le kit (`rendu/figurine`) par `scripts/companion/render-widget-poses.mjs` | 🟡 poses du kit, pas du module `companion/pilou/` sur main |
| Haptique (`@capacitor/haptics`) | aucun module natif | ⏸ à décider (BACKLOG) |

## 3. Découpage proposé (un run de code chacun, dans cet ordre)

**LANT-1 — Les 5 lanternes sur la page du défi** (code partagé, aucun natif).
- `services/trials.js` : `lanterns(status)` pure → 5 entrées `{ date, state: 'lit' | 'out' | 'pending' }` dans l'ordre
  des jours « avec ». Tests rouges d'abord : 5 jours avec dont 2 tenus, 1 pas tenu, 2 à venir → `lit, lit, out,
  pending, pending` ; essai ancien de 14 jours (7 avec) → 7 entrées (on ne casse pas un essai commencé) ; tenue
  inconnue → `pending`.
- `components/TrialLanterns.jsx` (SVG, l'ambre du point de l'antenne de Pilou, token à choisir dans `tokens.css`, halo qui respire ±8 % sur 2,6 s ; réduit : halo fixe).
  Libellé : « Jour avec 2 sur 5 » ; au-dessus de `TrialDots`, qui reste (le détail avec / sans).
- Textes (règle SLOP) : jour pas tenu « Jeudi : pas tenu. Pas grave, la lanterne attend le prochain jour avec. » ;
  5/5 « 5 jours sur 5 : bravo ! ».
- Captures : `/act/trial/:id` démo, clair et sombre, iPhone (`captures/pr-N`).
- Risque : la démo doit contenir un essai en cours (graine `scripts/visual/`), sinon rien à voir.

**LANT-2 — Pilou sur la page du défi et au bilan** (code partagé).
- Pilou 2D (même composant que Objectifs, LOT-VIE vie-3) à côté de « Je teste » ; saut à l'acceptation (mouvements
  réduits : changement d'expression seul) ; au bilan, deux signes de tête et « Bravo pour vos 5 jours. », pas de
  confettis, quel que soit le résultat.
- Test : le bilan « Plutôt non » montre le même Pilou et la même bulle que « Plutôt oui » (il salue l'effort).

**LANT-3 — La lanterne du matin sur l'îlot** (code partagé, scène).
- À l'ouverture de l'Accueil, si un jour « avec » de la veille vient d'être confirmé tenu et n'a pas encore été montré
  (`localStorage`, une fois par jour) : la lanterne de l'îlot vacille 120 ms puis monte en 400 ms, Pilou la regarde
  et fait un petit saut (bus : `gift:lantern-lit`). Réduit : fondu 300 ms.
- Ne pas confondre avec la lanterne du cadeau J2 (allumée le soir par l'heure) : le matin elle est éteinte, l'allumage
  dure 2,6 s puis s'éteint (jour).
- Budget de lectures : la tenue d'hier sort de `homeTrial` déjà lu par l'Accueil ; aucune lecture de plus (check
  « Budget de lectures »).

**LANT-4 — Le rituel du soir, piste d'écran seulement** (code partagé ; rappel natif à part).
- Un jour « avec » d'un essai sur `screen_minutes`, entre 21 h 30 et 23 h, l'Accueil montre une bulle « Ranger le
  téléphone ? » ; la toucher joue la séquence courte (bâillement, tiroir, téléphone rangé, lanterne) et finit sur
  « Bonne nuit. ». L'app ne se ferme jamais d'elle-même.
- Le rappel « Me le rappeler à 21 h 55 ? » réutilise la notification du soir existante (`eveningNote`, Android et
  iPhone) avec une heure à part ; proposé au moment de « Je teste », jamais précoché.
- À trancher avant le code (question au propriétaire, une ligne en tête du résumé) : la séquence en 3D sur l'île
  (budget 61 200 triangles mesuré au prototype pour le tiroir : au-dessus de la cible de 25 000) ou en 2D dans une
  feuille. Proposition : 2D dans une feuille, l'îlot ne change pas.

**WIDGET-POSES — Poses du widget depuis `companion/pilou/`** (outillage + 6 images).
- `render-widget-poses.mjs` prend `companion/pilou/createPilou.js` au lieu du kit ; mêmes 6 poses, même cadrage,
  288 px, webp ; reproductible au bit près (test : deux rendus → mêmes octets). Avec les traits du Studio ? Non : le
  widget garde le Pilou d'origine tant que l'aperçu 3D du Studio n'est pas tranché (REFONTE-14).
- Vérifier sur la capture de mise en page (`journal/runs/captures/2026-11-16-sprint-monde-widget.png`) que rien ne
  bouge ; `iphone/overlay/app/public/companion/pilou_pose_*.jpg` (notifications iPhone) régénérées en même temps.

**Hors découpage, à garder en attente** : la bouillotte de Ma journée (journée § 7 ; la version CSS de LOT-VIE suffit
tant que la scène 3D joue les chorégraphies) ; l'haptique (module natif, décision du propriétaire).

## 4. Parité iPhone

Tout LANT-1 à 4 est du code partagé (WebView) : rien dans `iphone/patches/` ne touche `services/trials.js`,
`pages/Trial.jsx` ni `companion/` (vérifié le 17/11 20:40 : `grep -lE 'trials|Trial\.jsx|companion/' iphone/patches/*`
ne trouve rien). Le rappel de LANT-4 passe par `EveningPlugins.swift`, déjà présent. WIDGET-POSES ne change
que les images Android et les JPEG des notifications iPhone ; le widget iPhone reste ⛔ (WidgetKit, PARITE.md).

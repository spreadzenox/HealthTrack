# Lot MONDE — étape 13 du brief (Compagnon 5)

Sprint du 16/11 20:20 au 17/11 03:00. Dossier : `app/src/companion/world/`. Branches `claude/sprint-monde-<n>`.

## Où j'en suis (16/11, 21:40)

**#1048 mergée** (21:38, tous les checks verts, build iOS compris). Le reste (anciennes branches 2 et 3) est réuni
dans une seule PR depuis `claude/sprint-monde-3`, mise à jour sur main.

**Règle du propriétaire (22:01)** appliquée : plus aucune ligne d'attribution ni lien de session dans mes commits,
PR et commentaires ; corps de #1057, #1055 et mon commentaire nettoyés ; au merge, message de squash écrit à la main.

**Pour l'intégrateur** : course préexistante vue sur #1057 (job « Tests d'Android avec les correctifs iOS », 21:43) :
`AppRedirects.test.jsx` laisse `UpdateBanner` appeler la vraie API GitHub ; si la réponse arrive après la fin de
jsdom, `setRelease` lève « window is not defined » (erreur non gérée, job rouge alors que 4100 tests passent).
Correctif proposé : drapeau `alive` dans `check` de `UpdateBanner.jsx`, ou `vi.mock('./services/updateCheck')` dans
ce test. Hors du lot MONDE, non fait ici.

## Avant (16/11, 21:25)

**Consigne de l'orchestrateur de 21:20 appliquée** : #1055 et #1057 (empilées sur #1048) fermées, branches gardées,
leurs builds iOS et émulateurs annulés. Seule #1048 reste ouverte. Après son merge, je rouvre **une seule** PR depuis
`claude/sprint-monde-3`, qui contient tout le reste (sprint-monde-2 compris). (Message direct à l'orchestrateur refusé
par la plateforme : réponse écrite ici.)

## Historique (16/11, 21:05)

**PR 2 — `claude/sprint-monde-2`** (partie de la 1) : le widget Android et les entrées réelles du monde. Voir plus bas.

**PR #1048** ouverte (`claude/sprint-monde-1`). Alignée sur le contrat de SCÈNE du 16/11 20:45 (§ 5) : `lightAt`,
`weatherDecor` et `growthAt` rendent exactement la forme écrite au contrat ; mes champs en plus sont des ajouts.

**PR 1 — `claude/sprint-monde-1`** : fonctions pures et testées, rien de visible.
- `daylight.js` : heure locale → lumière (`lightAt`). Clés de la SPEC île § 5 (aube 6 h 48, matin 8 h 12, midi 12 h 30,
  soir 18 h 40, nuit 21 h 24) et, à 15 h 30, **exactement** la lumière du kit (`rendu/creature/scene.js` : soleil
  `#FFCFA0`, élévation 15°, 3,6 ; appoint `#FFE4D2` 1,15 ; environnement 0,62 ; brume `#FFC9A6`). Soleil toujours
  derrière Pilou (azimut −150°, contre-jour) ; matin plus pâle et plus haut, soir plus orangé et plus bas, nuit lune
  bleutée faible et `ambre: 1` (le point ambre devient la lumière principale). Interpolation `soft`, sans marche
  d'une minute à l'autre (testé). Aussi : `dayPhase` (matin, après-midi, soir dès 17 h 48, nuit du coucher au
  lever ; 7 h et 22 h 30 par défaut), `worldDayKey` (le jour change à 4 h), `sunDirection`, `nextLightUpdate` (pas de
  5 min).
- `weather.js` : météo du moment → un seul effet par priorité (pluie ≥ 0,2 mm/h, neige, rafales ≥ 35 km/h,
  ≥ 28 °C, ≤ 5 °C), geste et accessoire de Pilou, particules (≤ 40, opacité de la pluie ≤ 0,45), étiquette
  (« Pluie fine · 11 °C »). Mouvements réduits : aucune particule, l'étiquette reste. Météo de plus de 3 h : rien.
- `growth.js` : jours d'usage → croissance (g = jours/90 lissé ; îlot × 1,3 en largeur, × 1,12 en hauteur ;
  touffes 14 → 42 ; arbuste × 1,45 ; îlot voisin à 30 jours, mare à 90), saison selon la date et l'hémisphère,
  `worldNews` (« Un îlot voisin est apparu »…). Rien ne recule (testé).
- `widget.js` : pose du widget (dort, se-reveille, content, rassasie, soir, fete), « Encore N choses »,
  « Jeudi · jour 3 » (première semaine seulement), texte du lecteur d'écran, notification de repas (SPEC journée § 9).
- `index.js` : `worldState({ now, weather, usageDays, latitude, wakeMinute, bedMinute, reducedMotion, name })` →
  `{ day, light, weather, growth, season, label, labels, lightFadeMs }`. C'est ce que la scène consomme.
- Branchement minimal dans le code partagé : la lecture météo existante (Open-Meteo, même position arrondie à
  ≈ 10 km) demande aussi le bloc `current` ; `weatherSync` le garde dans ses réglages (`current`). Aucune nouvelle
  donnée ne sort du téléphone, aucun nouvel hôte.

## Pour le lot SCÈNE (à relayer par l'orchestrateur)
- Contrat § 5 respecté : `lightAt(date, { wake, bedtime })`, `weatherDecor({ tempC, precipMmH, windKmH, code })`,
  `growthAt(daysOfUse, date, { hemisphere })`. Ajouts sans conflit : `light.sunDirection` ([x, y, z] unitaire, repère
  du kit), `light.env` (intensité de l'environnement), `light.asleep`, `light.lantern`, `decor.gesture`,
  `decor.split` ({ back, front }), `decor.frost`, `decor.breath`, `decor.wind`, `growth.tree`, et `worldState(...)`
  qui rassemble tout avec l'étiquette (« Pilou dort. Le reste peut attendre demain. » la nuit, sinon la météo).
- **La météo de l'app pour `weather:changed`** : `getWeatherSettings().current` (`app/src/services/weatherSync.js`)
  a déjà la forme du contrat `{ tempC, precipMmH, windKmH, code, at }` ; `weatherDecor(current, { now })` ignore une
  lecture de plus de 3 h. `windKmH` = rafales (seuil de 35 km/h de la SPEC).
- Phase : `lightAt().phase` ∈ aube, matin, midi, soir, nuit ; « nuit » suit le coucher habituel (Pilou s'endort),
  pas seulement le ciel.

**PR 2 — `claude/sprint-monde-2`** :
- `context.js` : `loadWorldContext()` → `{ daysOfUse, wake, bedtime, hemisphere, weather }` lu sur le téléphone : jours
  où quelque chose a été noté à la main (sources `app_*` et `manual` ; les mesures automatiques ne comptent pas),
  lever et coucher habituels d'après le sommeil (`computeSleepRegularity`), hémisphère d'après la position météo,
  météo du moment. **Pour SCÈNE** : à appeler à l'ouverture et au changement de jour, puis passer `wake`/`bedtime` à
  `lightAt`, `daysOfUse`/`hemisphere` à `growthAt`, `weather` à `weatherDecor`.
- **Widget Android « Ma journée »** (specs/journee.SPEC.md § 9) : `PilouWidget.java` (App Widget 4 × 2, fond crème),
  règle en Java pur `pilou/PilouWidgetRule.java` (même règle que `world/widget.js`, 7 tests JUnit ajoutés au job
  « Protocole montre (Java) » : `scripts/java-protocol-test.sh` prend le paquet `pilou`), `PilouWidgetPlugin.java`
  (`update`, `takeOpen`), `world/widgetSync.js` appelé par l'Accueil et Ma journée après chaque saisie (mêmes lignes
  que la checklist), toucher → Ma journée (`Layout.jsx`, comme le rappel de portion). Redessiné par Android toutes les
  30 min (soir, nuit, changement de jour à 4 h : toutes les bulles du jour reviennent, rien ne s'accumule). La nuit,
  s'il reste des choses : « Le reste peut attendre demain », sans compte.
- **Six poses pré-rendues** (`res/drawable-nodpi/pilou_pose_*.webp`, 288 px, ≈ 6 Ko chacune) : rendues depuis le code
  du kit (`rendu/figurine`) par `app/scripts/companion/render-widget-poses.mjs` (reproductible au bit près), soir
  orangé et nuit bleutée comme le cycle du jour. Les yeux sont ceux de la figurine du kit : **à re-rendre avec le
  module du lot PILOU** quand il sera sur main (le script le dit en tête).
- Capture de la mise en page (même XML, mêmes images) : `journal/runs/captures/2026-11-16-sprint-monde-widget.png`.
- Nouveautés : `2026-11-16-2100-widget-pilou.json` (`variants: ["play", "sideload"]`).
- Correctif iPhone 18 (contexte de `Layout.jsx`) : vérifié, il s'applique toujours.

**PR 3 — `claude/sprint-monde-3`** (partie de la 2) : Pilou dans les notifications du soir.
- Android : `PilouNotice.java` ; `setLargeIcon` pose « soir » sur la note du soir et le bilan de la digestion, pose
  « content » sur leur « Noté » éphémère (Pilou réagit au fait de noter). Rien d'autre ne change.
- iPhone : `EveningPlugins.swift` joint la pose « soir » (`UNNotificationAttachment`, copie d'un JPEG du site de l'app :
  `iphone/overlay/app/public/companion/pilou_pose_*.jpg`, 12 Ko) aux deux notifications du soir. Pas de nouveau
  fichier Swift, donc pas de modification du projet Xcode.
- Nouveautés : `2026-11-16-2115-pilou-notifications.json` (toutes les variantes).
- **Lumière à l'échelle de la scène** : SCÈNE a réglé son heure dorée (`GOLDEN` de `scene/light.js` : soleil 2,6,
  appoint 1,35, hémisphère `#FFF1E4`/`#9DB87A` à 0,8, ambre 0,55). `lightAt` à 15 h 30 rend désormais exactement
  `GOLDEN` (testé sur une copie) et les autres heures à la même échelle (`SCENE_SCALE`). Clé d'avant l'aube à 6 h 05
  (violet → rose) : le passage nuit → aube ne passe plus par un gris terne. Planche :
  `journal/runs/captures/2026-11-16-sprint-monde-cycle-du-jour.png`. Si SCÈNE retouche `GOLDEN`, recopier ses valeurs
  dans la clé `apres-midi` de `world/daylight.js` et dans le test.

## Parité iPhone (pour PARITE.md)
- Notifications du soir avec Pilou : ✅ des deux côtés (PR 3).
- Fonctions pures, météo du moment, contexte du monde : code partagé, identiques sur iPhone.
- **Widget : Android seulement pour l'instant.** Sur iPhone il faut une extension WidgetKit (cible Xcode, App Group
  pour partager l'état) : ligne à ajouter dans PARITE.md « Widget de Pilou | `PilouWidget` (App Widget) | WidgetKit |
  ⛔ pas encore | extension Xcode à créer ; d'ici là l'app ne fait rien (`pilouWidgetPlugin()` est nul hors Android) ».
  La note de Nouveautés est réservée à play et sideload.

## Ce qui reste
- Notification de repas de la SPEC journée § 9 (« Pilou garde une place pour votre déjeuner ») : texte prêt
  (`mealNotification`), mais c'est une fonction nouvelle (réglage, alarmes) : proposée, pas codée dans ce sprint.
- Re-rendre les poses avec le module PILOU ; nom choisi pour Pilou (lot VIE, `pilouName()`) dans le widget.
- Widget iPhone (WidgetKit) si le temps le permet.

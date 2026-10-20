# 2026-10-20 18:30 Paris (16:30 UTC) — Lumière du visage dans le poids des lectures (I127b)

**Type** : 🔴🙂 code (consigne du 19/10 au soir : confiance honnête, « qualité et cadrage du visage »)  ·  **PR** : à venir

## Pourquoi
- Main à `99df617` (#233) vert (Tests, Build & Release, émulateur A56), aucune PR « [Auto] » ouverte, aucun nouveau
  diagnostic de l'A56 dans `journal/diagnostics/` (signalement du 19/10 15:05 corrigé par #221 / #228, confirmation
  sur l'appareil toujours attendue).
- Run de code (18:30 Paris, pas un run « idées »). Suite proposée par le run précédent : I117 préparation ou **I127b**.
  I117 dépend de la ligne « Voix » du diagnostic → I127b, petit et testable seul, prolonge I127.

## Ce qui a été fait
- Natif `FacePipeline` : la luminance du recadrage 256 px (déjà calculée pour le rejet « trop sombre / trop clair »)
  est gardée dans `Frame.luminance` ; la rafale ajoute `values.light` = médiane sur les images valides. Rien d'autre
  n'est gardé (aucune image). `FaceRecord` sérialise déjà toutes les valeurs ; `parseFaceBurst` les accepte.
- JS `faceMood.js` : `lightPenalty` (×1,15 sur la demi-largeur hors [0,25 ; 0,8], 1 sans mesure → anciennes lectures
  inchangées) dans `estimateBurst` (donc dans `readingWeight` et la série jour par jour de `faceMoodDays`) et dans la
  fourchette du jour (médiane de la lumière du jour) ; `isPoorReading` compte la lumière limite ; `day.lighting`
  (`correcte` / `pénombre` / `vive` / null) ; phrase « souvent dans la pénombre » / « lumière souvent trop vive »
  (seulement quand c'est le cas).
- Anti-circularité : `gate.js` déclare `FACE_QUALITY_KEYS` (`yaw`, `light`, `affectGap`, `affectFrames`,
  `affectModels`) et ne les prend plus parmi les indices de `gateDays`. Avant ce run, la porte prenait **toutes** les
  valeurs d'une rafale, y compris le lacet et le nombre d'images du duo ; sans changement pour le propriétaire (0 jour
  noté), et aucun test de la porte n'utilisait ces clés. La lumière, qui suit l'endroit et l'heure (contexte X), ne
  peut donc pas « prédire » les notes à la place du visage.
- Diagnostic : `estimate.lighting` (un mot) et « , lumière souvent dans la pénombre » sur la ligne « Humeur estimée ».
- Démo visuelle : `light` 0,48 le jour, 0,22 à 19 h.

## Tests
- Vitest : **1 631 verts** (+6) — `faceMood.test.js` (+5 : `lightPenalty`, pénombre = fourchette plus large / note
  inchangée / « peu nette », lectures bien éclairées l'emportent, phrases de la carte, `light` ni dans
  `EXPRESSION_KEYS` ni entrée de l'estimateur), `gate.test.js` (+1 : clés de qualité exclues), `faceSense.test.js`
  (lighting dans l'export et la ligne), `FaceSenseCard.test.jsx` (export attendu complété).
- JUnit : **114 verts** (`FacePipelineTest` : lumière des seules images valides, dans les limites, égale à celle de
  l'image pour une rafale d'une image).
- `npm run lint` : 6 erreurs, identiques à main. `npm run build` ✅. `npm run visual`, `--empty`, `--light` : toutes
  pages ok, sans erreur JS ; accueil lu : carte « Humeur estimée » inchangée (lectures de démo du jour avant 19 h).

## Risques connus
- Seuils 0,25 / 0,8 choisis à la main (milieu entre les limites de rejet du natif et la plage « normale ») : la
  luminance d'un recadrage dépend de la peau et de l'exposition auto de la caméra frontale ; à recaler sur l'A56.

## Pour le propriétaire (Galaxy A56)
Rien de nouveau à faire ; le diagnostic de la Lecture du visage reste la priorité (voir le résumé de la semaine).

## Suite proposée
1. 📥 Diagnostic de l'A56 (arbre I122 + bloc `voice`).
2. I117 dictée du soir selon la ligne « Voix » ; sinon I125 (« Rien reconnu — me le signaler ? »).
3. Recalage des seuils de lumière avec de vraies lectures.

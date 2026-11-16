# Lot PILOU (étape 9 du brief : Compagnon 1b)

## Où j'en suis
- 16/11 ≈ 21:00 — **Module livré sur `claude/sprint-pilou-1`** (parti de `claude/sprint-scene-1`, qui porte three.js et
  la scène) : `app/src/companion/pilou/index.js` exporte `createPilou(THREE, options)` à l'API du CONTRAT § 3. La scène
  le charge seule (`import.meta.glob('./pilou/index.js')`) et remplace son Pilou simple.
- Corps de figurine en vinyle verni (§ 7.3) : `MeshPhysicalMaterial`, vernis 0,72 à peau d'orange, sheen 0,3 (retiré au
  palier moyen), ventre peint au bord irrégulier (calculé au pixel), joues à l'aérographe, sous-surface simulée (wrap
  par canal et contre-jour), pieds plus mats.
- Yeux de la créature (§ 7.4) : globes 3D enfoncés, cornée vernie, iris brun chaud peint et lu par réfraction (1,34),
  pupille qui se dilate quand il vous regarde (+ 18 % en 550 ms) et respire, paupières de peau (paupière basse ≤ 0,32),
  liseré humide ; le bord de la paupière fonce quand l'œil se ferme. Couleur de l'iris prise dans la fiche (`setTraits`).
- Antenne laquée effilée sur ressort, point ambre en verre qui luit de l'intérieur (shader dédié, halo en sprite,
  pulsation 2 400 ms, monte d'un cran à chaque `jump`). Montre : chrome, verre bombé, bracelet émail indigo, aiguilles
  **à l'heure réelle** de l'appareil (option `now`).
- Animation (`anim.js` du chapitre 1 repris tel quel, `animateur.js` autour) : 12 expressions + réveil + repas
  (mâchouille puis Rassasié), humeur Tranquille → Content → Rayonnant sans palier et qui ne redescend jamais, fondus
  qui s'enchaînent sans saut, boucle de repos à périodes premières et graine, regard libre ou dirigé (yeux 60 ms,
  tête 250 ms, corps 400 ms), réactions toucher / appui long / double toucher / glisser / chatouille / petit saut
  (bras du côté de la bulle), ressorts intégrés pas à pas (1/120 s), mouvements réduits (rien ne bouge de plus de
  4 px, yeux, clignements et respiration très atténuée gardés). Chaque état a son texte, avec le nom choisi.
- Accessoires : livre (Absorbé), écharpe (J3), parapluie, éventail, montre (portée par défaut) — `setAccessory`.
- **Test de couleur du menthe** (§ 7.2) : CIEDE2000 (`couleur.js`, testé sur les valeurs de Sharma) ; ΔE mesuré sur
  six zones éclairées du corps : **dans la scène de l'Accueil, moyen 2,8, max 3,8** ; au banc (même lumière que
  `scene/light.js`), moyen 3,8, max 5,5. Seuil 6. D'où un « équilibre des blancs » de la peinture
  (`BALANCE` de `createPilou.js`, réglable par `options.balance`) : sans lui, le menthe virait au sauge (ΔE 7 à 16).
- Budget : **9 050 triangles, 27 appels de dessin** au palier haut ; 5 470 au palier moyen (≤ 10 000, testé).
  Temps d'image au rendu logiciel (SwiftShader, sans GPU) : 59 ms haut, 40 ms moyen pour toute la scène — pas une
  mesure de téléphone ; la mesure du job Android 9 et du simulateur iPhone reste au lot SCÈNE (palier auto).
- **Images pré-rendues des petits Pilou** (pour VIE et MONDE) : `app/src/companion/pilou/sprites/<expression>.webp`
  (12 expressions, 218 × 240 px, fond transparent, ≈ 9 Ko chacune, 144 Ko en tout), et
  `pilouSprite(expression)` dans `app/src/companion/pilou/sprites.js` (Tranquille par défaut). Regénérées par
  `node src/companion/pilou/banc/capture.mjs --petits` (dans `app/`).
- Banc d'essai hors build : `/src/companion/pilou/banc/index.html` (Pilou seul, gestes au doigt, boutons) et
  `/src/companion/pilou/banc/scene.html` (dans la vraie scène). `capture.mjs` : planche, `--scene`, `--mesure`,
  `--petits` ; il échoue si ΔE > 6 ou si une erreur JS survient.
- Captures : `journal/runs/captures/2026-11-16-sprint-pilou-expressions.png` (les 12 en petit),
  `…-pilou-scene.png` (haut, moyen, mouvements réduits, rayonnant), `…-pilou-face-kit.png` (scène / aperçu figurine /
  petit créature).

## PR
- `[Sprint PILOU] Pilou figurine : corps verni, yeux de la créature, 12 expressions` — branche `claude/sprint-pilou-1`.
  Elle contient les commits du lot SCÈNE tant qu'ils ne sont pas sur main : **à merger après la PR de SCÈNE** (je
  fusionne main dans ma branche dès qu'elle y est).

## API (en plus du CONTRAT § 3)
- `setExpression('humeur')` : revenir à l'humeur du jour après un état (Concentré, Absorbé, Endormi…).
- `play('mange')` : l'assiette arrive, il mâchouille 1,5 s puis reste Rassasié.
- `update(t, dt, camera?)` rend `{ cle, texte }` (« Pilou est content ») ; `etat()` le relit ; `setNom(nom)`.
- `react('tickle', { durationMs })` et `react('tickle-end')` ; `react` rend la liste des vibrations à jouer
  (`[{ style: 'LIGHT'|'MEDIUM', at: ms }]`, SPEC § 7).
- `hitZone(ndcX, ndcY, camera)` → `'ventre' | 'corps' | null` (le chatouillis se fait sur le ventre).
- `kit` : `{ body, corps, antAnchor, vinyl(hex, o), arms }` pour le lot STUDIO (pièces 3D des traits : cheveux en
  vinyle satiné sur `kit.body`, avec `kit.vinyl`).
- `setLight(dir)` facultatif : sans lui, Pilou prend la plus forte lumière directionnelle de la scène (le soleil).
- La partie des yeux qui dépend de la caméra se fait au rendu (`onBeforeRender`) : la scène n'a rien à passer.

## Ce qui reste
- Les petits effets « dessinés » des expressions (étincelles de Rayonnant, anneaux de Concentré, « z » d'Endormi,
  cœurs de Réconfortant, trois traits de Surpris) : pas encore faits (2e PR).
- Yeux fermés : la paupière ronde se lit encore un peu « lunettes de plongée » en petit ; à affiner.
- Captures Android et iPhone de l'Accueil avec Pilou : à regarder sur les artefacts de la CI de la PR.

## Ce que j'attends des autres lots
- SCÈNE : merger sa PR (ma branche part de la sienne). Rien d'autre : l'API du contrat est tenue.
- STUDIO : brancher `traits.js` sur `kit` (cheveux, lunettes) ; l'iris suit déjà `setTraits(fiche)`.
- VIE, MONDE : `pilouSprite(expression)` est prêt.

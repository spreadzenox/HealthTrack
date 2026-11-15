# Compagnon · chapitre 1 — « La bible de Pilou »

- **Objet** : faire de Pilou un personnage vivant et cohérent, et fixer la référence des chapitres 2 à 4 et de l'app (`SPEC.md`).
- **Même Pilou** que la direction 2 (silhouette, proportions, couleurs) ; rendu affiné : toon doux à 4 paliers, contour brun constant à l'écran, lumière de contour, ventre calculé au pixel, antialias 4×.
- **Visage dessiné** (Canvas 2D projeté sur le corps) : yeux à deux reflets, paupières haute et basse, six bouches, joues qui rosissent ; on passe d'une forme à l'autre sans saut.
- **Antenne et bras sur ressorts**, pilotés par l'accélération du corps : tout mouvement les fait vivre, sans animation dédiée.
- **Repos jamais en boucle** : couches à périodes premières (3,6 · 5,3 · 7,7 · 9,1 s) + regards, clignements et micro-gestes tirés avec une graine.
- **Onze expressions** (+ salut), aucune triste ni déçue : au pire tranquille ; un jour difficile, il réconforte.
- **Cinq gestes** (toucher, appui long, double toucher, glisser, chatouiller) avec durées, courbes, ressorts et vibrations ; ralentis et courbes annotées à l'écran.
- **Mouvements réduits** montrés côte à côte : les visages et les textes restent, rien ne saute ni ne tourne.
- **Dans l'app** : accueil de Léa jour 3, Pilou à 130 px, ses bulles, une tâche faite → « Pilou est content ».
- **Fichiers** : `prototype.html` (lecture, `?render=1`, `?planche=1`), `pilou.js` + `anim.js` (référence d'implémentation), `render.mjs` (rendu par tranches reprenables, `--stills`, `--planche`), `SPEC.md`, `planche-personnage.png`.
- **Typo** Nunito (OFL, `fonts/`) ; port 8111.

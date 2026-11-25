# LANT-4 — Le rituel du soir : 2D dans une feuille ou 3D sur l'îlot ?

> **Question au propriétaire, rien n'est codé.** Le rituel est dans la SPEC de la refonte (`compagnon/specs/
> comprendre.SPEC.md` § 7, découpage `compagnon/DECOUPAGE-RITUEL-LANTERNES.md`) ; reste à trancher **comment** il se
> joue. Maquette statique de l'option A : `maquette.html` (`?state=bulle|debut|range|fin`, `?theme=dark`), captures
> par `node journal/maquettes/rituel-soir/render.mjs`. Run du 25/11 17:30.

| 1. La bulle (22:05, jour « avec ») | 2. Il bâille, téléphone allumé | 3. Le tiroir | 4. « Bonne nuit. » | 4. Sombre |
|---|---|---|---|---|
| ![](1-bulle.jpg) | ![](2-debut.jpg) | ![](3-range.jpg) | ![](4-fin.jpg) | ![](4-fin-sombre.jpg) |

## Quand
Seulement pendant un essai sur le temps d'écran (« Pas d'écran après 22 h »), un jour « avec » tiré au sort, entre
21 h 30 et 23 h, si l'app est ouverte : une bulle « Ranger le téléphone ? » sur l'îlot. Rien les autres soirs. La
toucher joue la séquence (8 s environ), qui finit sur « Bonne nuit. ». L'app ne se ferme jamais d'elle-même ;
« Passer » coupe la séquence. Le rappel « Me le rappeler à 21 h 55 ? » est proposé à « Je teste », jamais précoché.

## Les deux options
- **A. 2D dans une feuille (proposition)** : une feuille de nuit monte du bas ; Pilou y est une image du vrai modèle
  (comme le widget, détourée dans l'app ; ici, l'image du widget avec son fond, d'où le halo), la commode et la
  lanterne sont dessinées. Trois temps : il bâille téléphone allumé, il le range, il s'endort et la lanterne veille.
  L'îlot ne change pas, aucun triangle de plus, aucune différence entre téléphones lents et rapides.
- **B. 3D sur l'îlot** : la séquence de la SPEC jouée dans la scène (Pilou tient le téléphone, se tourne, ouvre le
  tiroir, coup de hanche). Plus vivant, mais le prototype du tiroir mesure **61 200 triangles pour une cible de 25 000**
  ; il faudrait refaire la commode en simple, ajouter quatre animations de Pilou, et les téléphones en palier « bas »
  (image fixe) ne verraient rien.

## Ce que ce n'est pas
Aucune nouvelle donnée : le soir est jugé le lendemain par le temps d'écran (ou la question « c'était tenu ? »), comme
aujourd'hui ; la lanterne du matin (LANT-3) reste la seule récompense.

**Réponse attendue** : « rituel 2D », « rituel 3D » ou « pas de rituel ».

# Kit de la refonte « Compagnon » (14/11/2026)

Références pour la refonte décidée par le propriétaire les 13 et 14/11. **Tout commence par
`BRIEF-REFONTE-COMPAGNON.md`** : décisions avec ses mots, produit, navigation, rendu de Pilou, double numérique,
étapes, risques.

Repris tel quel par l'orchestrateur le 15/11/2026, à la demande du propriétaire, depuis la branche
`claude/cool-volta-vlkdz1` de `spreadzenox/HealthTrack-iOS` (commit `763e1a6`), où il avait été posé pour le
transport. Les instructions de la routine (`orchestration/routine/`, bloc « REFONTE COMPAGNON ») y renvoient. Ce
sont des références : la routine ne les modifie pas ; ce qu'elle apprend en codant va dans le journal.

| Dossier | Contenu |
|---|---|
| `BRIEF-REFONTE-COMPAGNON.md` | Le brief complet ; il remplace celui du 13/11 |
| `PILOU-DOUBLE.md` | Conception du double numérique : parcours, schéma JSON imposé, ce qui n'est jamais déduit, combinaisons |
| `specs/` | Les 5 SPEC à coder : `personnage`, `ile`, `journee`, `comprendre`, `double` (déclencheurs, durées, courbes, haptique, textes, mouvements réduits, budget) |
| `personnage/` | La planche du personnage (fait foi pour la silhouette, la palette, les expressions et les règles), `pilou.js` et `anim.js` (référence d'animation) |
| `rendu/figurine/` | **Le rendu retenu pour le corps, l'antenne, la montre et l'île** : aperçu, `petit.jpg` (Pilou à 240 px), vidéo de 10 s en 540p, code de la scène |
| `rendu/creature/` | **Le rendu retenu pour les yeux et la lumière** : aperçu, `petit.jpg`, vidéo de 10 s en 540p, code (`creature.js` pour les yeux, `scene.js` et `matiere.js` pour la lumière et la sous-surface) |
| `double/` | `traits.js` (les traits portés par Pilou), mosaïque de 32 Pilou, images clés de la vidéo de 87 s |
| `chapitres/` | Aperçus de la direction choisie et des 4 approfondissements du 13/11 |

**Le code.** Ce sont des maquettes de rendu, pas du code d'app : elles visent l'image, pas le budget d'un téléphone
(le brief, § 7.8 et § 7.9, dit ce qui passe et ce qui doit être simplifié). Chaque animation est une fonction du
temps (`window.seek(ms)`). Pour les rejouer, servir le dossier en HTTP et faire pointer `three` vers le paquet npm
`three@0.187.0` (`figurine.js` importe un chemin local `../_partage/three-0.187.0/…` à remplacer ; les fichiers de
`rendu/creature/` importent `three` et `three/addons/…` par une carte d'import). Aucune texture ni image HDR
téléchargée : tout est procédural.

**Non vérifié** : aucune mesure sur un vrai téléphone ; le branchement de `traits.js` sur le rendu figurine.

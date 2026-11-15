# Esquisse 2 · Figurine de collection

- **Direction** : Pilou en figurine d'art en vinyle verni, peinte à la main, photographiée en studio sur son socle en résine (île flottante). Fond papier sans fin crème-abricot, clé douce en haut à gauche, deux bandes de contre-jour, réflecteur crème ; petite profondeur de champ (effet « objet de 15 cm »).
- **Pilou** : `MeshPhysicalMaterial` (vernis `clearcoat` à peau d'orange légère, micro-rugosité variable, `sheen` doux, translucidité de bord simulée). Ventre peint à frontière irrégulière (texture 2048 générée), joues à l'aérographe, yeux en émail noir : cabochon bombé (relief + brillance pilotés par une 2e toile du visage) + deux reflets peints. Point ambre : verre ambré qui luit de l'intérieur (cœur clair, bord saturé, caustique côté opposé à la clé) — shader dédié plutôt que la `transmission` de three, essayée puis écartée (lecture « bille jaune opaque » et une passe de plus). Montre chromée, verre bombé, bracelet émail indigo.
- **Socle** : 12 couches de terre striées (relief en terrasses, galets pris dans la coupe, bruit cellulaire), bourrelet de gazon, ~7 700 brins de résine trapus en touffes (vent), fleurs en céramique émaillée aux couleurs des thèmes, galets polis, arbuste émaillé, flaque = miroir plan rendu dans la seule sous-fenêtre de la flaque (rides, goutte qui tombe à 7 s). Poussières dans la lumière.
- **Technique** : three r187, tout procédural (aucune texture ni HDRI téléchargée) ; environnement PMREM construit à partir de boîtes à lumière ; ombre PCF 2048 ; passe finale maison (profondeur de champ 16 échantillons, courbe tonale à épaule, vignettage, grain). Déterministe : `window.seek(ms)`.

## Ce qui tient sur un téléphone d'entrée de gamme (estimation, non mesurée)
- **Oui** : la matière de Pilou (une passe physique avec vernis ; retirer `sheen`), le visage peint 512² avec masque de brillance dans le même shader, l'environnement studio généré une fois au démarrage (PMREM 128), le point ambre (shader simple), la montre, une ombre de contact précalculée (tache) au lieu de l'ombre portée.
- **Vidéo seulement** : profondeur de champ, réflexion plane de la flaque (2e rendu), 7 700 brins instanciés (→ 600 touffes ou une texture de gazon en relief), textures 2048 (→ 1024 précuites en KTX2), MSAA 4× à DPR 3, poussières, grain, suréchantillonnage de l'aperçu.

## Coût de la vidéo
≈ 327 000 triangles (Pilou ≈ 45 000, flanc 82 000, herbe ≈ 75 000), 96 appels de dessin, 4 textures 2048×1024 + 2 visages 1024², 3 passes (réflexion, scène MSAA 4× HalfFloat, finale). 7,7 s par image en moyenne : rendu complet 38 min (machine partagée, charge 15 à 21). Cible app : Pilou ≤ 8 000 tri, île ≤ 12 000, ≤ 40 appels.

## Risques
- Le vernis brillant demande l'environnement PMREM et une passe physique : coûteux sur Mali-G52 ; prévoir un repli « vinyle mat » (Standard + reflets peints).
- Une figurine se lit « objet » : c'est l'animation (regard, salut, ressort de l'antenne) qui la garde vivante ; en mouvements réduits elle redevient une statuette.
- Écart de style avec l'UI plate de l'app ; l'herbe fine scintille en petit (voir `petit.png`) : simplifier sous 300 px.

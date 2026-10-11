# 2026-10-11 02:30 UTC — Modifier une note de bien-être

**Type** : 🐛 / 🏗️ (formulaires)  ·  **PR** : voir tableau du résumé (fusion en fin de run si CI verte)

## Pourquoi
Premier item du backlog (« Prochaines étapes » n° 1, idée en vrac) : une note de bien-être mal saisie, ou un tag
oublié (on coche rarement « alcool » sur le moment), ne pouvait qu'être supprimée puis re-saisie — ce qui changeait
son heure et donc son jour dans les analyses (habitudes du soir rattachées au lendemain). Or les tags sont la donnée
la plus utile pour « Vos habitudes » : il faut pouvoir les compléter après coup.

## Ce qui a été fait
- `WellbeingPrompt` accepte `entry` (mode contrôlé) : note et tags pré-remplis, titre « Modifier votre note »,
  enregistrement par `updateEntry` (payload seulement, `at` conservé, autres champs du payload gardés, clé `tags`
  retirée s'il n'en reste aucun — même forme qu'une note sans tag). Tags intitulés « Ce jour-là » pour un jour passé.
- Tableau de bord : bouton « Modifier » (style discret de « Supprimer ») sur les notes de bien-être saisies dans
  l'app, qui ouvre la même fenêtre pré-remplie.
- Aucun changement de schéma ; l'import « Ajouter » déduplique sur (source, at, type) : une note modifiée garde son
  `at`, donc pas de doublon en réimportant une ancienne sauvegarde.

## Vérifications
- Tests : 670 ✅ (662 avant ; +6 WellbeingPrompt, +2 Dashboard ; 7 échouaient avant le code)
  · Lint : 7 erreurs, 1 warning (inchangé) · Build ✅
- Visuel : 8 pages sans erreur JS ni débordement ; `--empty` OK ; `--routes=/ --click="Modifier cette note de
  bien-être" --viewport` : fenêtre pré-remplie (3, « Écran tard »), « Ce jour-là », boutons dans la zone visible ;
  journal : « Modifier · Supprimer » alignés à droite des tags sans chevauchement.

## Apprentissages / décisions
- Réutiliser la fenêtre de check-in plutôt qu'un éditeur en ligne : mêmes gestes, mêmes cibles tactiles.
- L'heure n'est pas modifiable ici (contrairement aux repas) : une note décrit un moment ; la changer déplacerait
  ses tags d'un jour à l'autre sans que l'utilisateur le voie. À rouvrir si un besoin réel apparaît.

## Suite proposée
- 🐛 Formulaires restants : heure `datetime-local` sur l'A56 (captures émulateur), modale de check-in sur /food.
- 🎨 Journal du tableau de bord, étape 2 (poids fusionné, noms courts, « Modifier » un repas depuis le journal).
- 🏗️ Effets décalés, étape 2.

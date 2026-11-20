# Run du 20/11 14:30 — Famille Alimentation dite simplement (POLISH-SIM-128)

**Type** : 🛠️ code (polish, constat des personas) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…), origin/main dd309be.

## État de départ
- main vert sur #1147 (Tests, Build & Release v829, Play — AAB, émulateur).
- #1148 (POLISH-SIM-127, run de 13:30) ouverte, « prête », 18 checks verts dont le build iOS (le « cancelled » est le
  doublon du passage en « prête »), à jour sur main, corps sans ligne d'attribution.

## Ce qui a été fait
- **#1148 mergée** (squash 1b35b2a) après lecture des captures iPhone de l'Accueil et de Tendances (`captures/pr-1148`,
  pas de régression).
- **POLISH-SIM-128** (`pages/Recommendations.jsx`, `FamilyDetail`) :
  - sans piste nette, la famille Alimentation dit « Rien à éviter pour l'instant : aucun aliment ne va nettement avec
    une digestion moins bonne (un bien-être moins bon). Continuez à noter vos repas. » ; les autres familles gardent
    « Aucun lien assez net pour l'instant dans cette famille. » ;
  - « Ce qui a été comparé » montre « N facteurs comparés, délai par délai. » et le chevron ; les lignes chiffrées
    (pt, fourchettes, groupes FODMAP) s'ouvrent dessous ; quand plusieurs délais sont montrés, « Chaque délai se lit à
    part : un même facteur peut aller dans un sens le jour même et dans l'autre ensuite. » (sorbitol +0,2 court terme,
    −0,8 moyen terme) ;
  - une piste nette nommait déjà ses aliments (`pistePlain`, UPG-9) : inchangé.
  - CSS : `.reco-family-compared-row` (ligne du compte et du chevron), en fin de `Recommendations.css`.
- Aucune donnée ni schéma changés.

## Vérifications
- Tests d'abord : `Recommendations.test.jsx`, 2 rouges (test REFONTE-6c ajusté, nouveau test POLISH-SIM-128), puis verts.
- `npm run test` : 4 153 verts ; `npm run build` vert ; lint des fichiers touchés propre.
- `npm run visual -- --routes=/recommendations/bien-etre/famille/nutrition` (clair et `--dark`) et
  `--routes=/recommendations/bien-etre/famille/sleep --click="Afficher les détails"` : captures relues (phrase simple,
  chevron fermé ; ouvert : unité, phrase des délais, barres). La démo n'a pas encore de résultats digestifs : l'écran
  digestif est couvert par le test.

## iPhone
- Code partagé ; le correctif 50 touche `Recommendations.css` (l. 714) : le nouvel ajout est en fin de fichier, les
  `git apply --check` du correctif 50 passe (clone superficiel : `upstream.sh` demande l'historique ; le build iOS
  de la PR applique les 59). Parité inchangée : 70 %.

## Suite proposée
1. Finir cette PR (passée « prête » en fin de run : checks, build iOS, capture iPhone d'Objectifs), merger.
2. POLISH-SIM-124b, 127b.
3. De jour : captures App Store de la refonte (REFONTE-2-ASC), puis PI2 (21 ou 22/11).

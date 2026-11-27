# Run 27/11 15:30 — Accueil : ajouter une habitude sur un petit écran

**Type** : 🔧 (refonte, étape 5b, code partagé) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) ·
**Android** : main a3f3cae (#1311) vert (Tests, émulateur A56, Play — AAB, Build & Release) · **TestFlight** :
1362.1362 chez « Testeurs Halcya » (inchangé) · **Parité** : 70 % (33/47), inchangée

## État de départ
- PR #1312 (run de 14:30, REFONTE-5b-2) en brouillon exprès : checks Android verts, build iOS pas lancé. Main vert.
  Pas de nouvelle réponse du propriétaire. Travail repris sur sa branche.

## Fait
- **REFONTE-5b-3, en partie** : les 4 temps de l'accueil (`--onboarding=goal`, `watch`, `auto-found`, `notes`, play)
  capturés à 320×700 et à 360×780 en grande police (`--font-scale=1.5`). Aucun avertissement de débordement de
  l'outil ; à l'œil, un seul défaut : au temps 4, le champ « Ajouter une habitude… » coupait son texte (« Ajouter une
  habitud » à 320 px, « Ajouter une ha » en grande police).
- Correctif `pages/Onboarding.css` : la rangée passe à la ligne (`flex-wrap`), le champ garde 13em avant de céder sa
  place, et le bouton seul sur sa ligne prend toute la largeur. À 412 px, rien ne change (une ligne).
- Test d'abord : `Onboarding.habitAdd.css.test.js` (rouge, puis vert).
- Note de Nouveautés `2026-11-27-1530-habitude-petit-ecran.json` (toutes variantes).

## Vérifications
- Captures relues : `captures/2026-11-27-1530-habitude-petit-ecran-320.png`, `-grande-police.png` (360 px, 1,5),
  `-dark.png` (412 px, sombre : une seule ligne). Temps 1 à 3 à 320 px et en grande police relus, sans défaut (le
  bouton collant « Continuer » coupe la capture pleine page, comme partout).
- Suite complète, build et eslint : voir ci-dessous.
- iPhone : aucun correctif `iphone/patches/` sur `Onboarding.css` ; code partagé.

## CI économe
- Ajouté à #1312, passée en « prête » : un seul build iPhone pour les deux correctifs.

## Suite proposée
1. Merger #1312 une fois le build iOS vert et les captures iPhone de l'accueil relues (run suivant s'il n'est pas
   fini dans celui-ci).
2. Reste de REFONTE-5b-3 : variante play avec visage et Gold, carte Huawei, temps 1 en sombre.
3. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; run « idées » de 20:00 : personas.

## Pour le propriétaire
Rien de nouveau à faire. Toujours : recruter des testeurs (4 sur 12), PI2, P51 ; le 29 ou le 30/11, le message E.

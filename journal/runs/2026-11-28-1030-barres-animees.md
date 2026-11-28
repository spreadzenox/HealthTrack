# Run 28/11 10:30 — Vos nuits s'animent (fin de la SPEC § 6.5)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main ae5dd95 (#1327) vert
(Tests, Build & Release, Play — AAB, émulateur A56) · **TestFlight** : 1381.1381 chez « Testeurs Halcya » (inchangé ;
build du soir à 21:20) · **Parité** : 70 % (33/47), inchangée (code partagé, aucun correctif iPhone touché)

## État de départ
- #1327 mergée, main vert. Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée).
- Pas de nouvelle réponse du propriétaire.

## Fait (tests d'abord)
- **Reste de la SPEC comprendre § 6.5** (Objectifs › Sommeil, et le détail des autres familles) :
  - les 14 barres montent une à une (`--i` sur chaque colonne, 45 ms d'écart, 400 ms en sortie douce) ; le point ambre
    d'un soir d'écran tard apparaît avec sa barre ;
  - avec les deux moyennes, les barres pâlissent à 1 s, puis les traits « Autres soirs » et « Soirs avec écran après
    22 h » se tracent de gauche à droite (1 s) ; sans elles, le trait de l'habitude arrive en fondu ;
  - tout est sous `prefers-reduced-motion: no-preference` : l'état final s'affiche d'emblée sinon ;
  - `PilouWaiting` (80 px, sans bulle) sous la carte « Une piste pour vos nuits », comme sous les pistes des autres
    familles.
- Rétrocompatibilité : aucun stockage changé (CSS et rendu seulement).

## Vérifications
- Tests : 2 assertions nouvelles (rang `--i` des colonnes, Pilou dans la carte du sommeil) ; suite complète et build
  dans le run ; lint : 0 problème sur les fichiers touchés.
- Captures relues : `--routes=/recommendations/bien-etre/famille/sleep --screen-sleep --now=14:00 --settle=2500`, clair
  et sombre (état final identique à celui de 07:30, Pilou sous la carte) ; même page avec `--settle=1` : barres pleines,
  traits qui commencent à se tracer à gauche, donc l'animation joue.
- Constat inchangé (POLISH-6c-9-a) : avec Pilou qui dit « Une piste se vérifie par un essai », la ligne « Aucun lien
  assez net pour l'instant dans cette famille » juste dessous se lit encore plus comme une contradiction ; à faire
  juger par une persona au prochain run « idées ».
- iPhone : aucun fichier de `iphone/` touché ; build iOS sur simulateur de la PR quand elle passe en « prête ».

## Suite proposée
1. POLISH-6c-9-a jugé par une persona (run « idées » de 20:00), puis le texte en conséquence.
2. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; soumission bêta de la build du soir, expiration.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, le message E.

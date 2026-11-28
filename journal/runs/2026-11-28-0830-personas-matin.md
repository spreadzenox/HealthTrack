# Run 28/11 08:30 — personas du matin (run « idées »)

**Type** : 💡 (sans code produit) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
2709ba9 (#1325) vert (Tests, émulateur A56, Build & Release, Play — AAB) · **TestFlight** : 1381.1381 chez « Testeurs
Halcya » (inchangé ; build du soir à 21:20) · **Parité** : 70 % (33/47), inchangée

## État de départ
- #1325 (REFONTE-6c-9) mergée. Aucune PR de la routine ouverte (seule #51, `cursor/*`, pas touchée). main vert.
  Pas de nouvelle réponse du propriétaire.
- iPhone : `upstream.json` suit HEAD, aucun correctif propre ; rien à soumettre ni à expirer avant la build du soir.

## Personas (décision C)
Tirage : « Tout mesurer » (la moins récente), puis au hasard « Prendre soin de soi » ; configurations au prorata
(1 et 2), moments uniformes (1 et 45).
- « Tout mesurer » J1, Android seul : `--day=1 --equipment=phone`.
- « Prendre soin de soi » J45, iPhone seul : `--day=45 --equipment=phone --goals=care --store=appstore`.

Synthèse : `simulations/2026-11-28-0830-synthese.md`. Constats vérifiés dans les captures et le code :
- Deux nouveaux défauts sûrs, petits : **POLISH-KCAL-ARRONDI** (527 kcal sur la carte du repas, 526 dans
  Nutrition : somme d'arrondis contre arrondi de la somme) et **POLISH-HABITUDE-AJOUTEE** (l'habitude libre
  s'enregistre à chaque lettre, sans retour visible).
- PROP-SIM-19 (se peser) relevée une 5ᵉ fois ; calories dépensées cherchées sans courbe (maquette des courbes).
- À vérifier : ronds de progression de Ma journée, sommeil de l'iPhone seul, « Où en sont vos analyses ».

## Heures de Mac
S48 recalculées (durées des jobs macOS des workflows `ios-build`, `ios-testflight`, `ios-face-models`) : 46,6 h du
23/11 au 28/11 08:40, environ 8,5 h par jour ; builds de PR 40,9 h.

## Vérifications
Journal seulement (rapports, captures, synthèse, BACKLOG, PRODUIT, résumé) : aucun fichier de `app/` modifié. Checks
de la PR attendus verts (Tests) ; aucun build iPhone (journal seul, CI économe).

## Suite proposée
1. Run de code : POLISH-KCAL-ARRONDI (test d'abord), puis POLISH-HABITUDE-AJOUTEE.
2. Ce soir : build iPhone et TestFlight (21:20), Alpha à 23:45 ; soumission bêta de la build du soir au premier run
   qui la voit traitée, expiration des anciennes.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, le message E. Réponses
attendues : PROP-SIM-19 (relevée encore ce matin), PROP-SIM-20, « go courbes / go phases / non », « rituel 2D / 3D /
pas de rituel ».

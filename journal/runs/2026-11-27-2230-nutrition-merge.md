# Run 27/11 22:30 — finir la PR Nutrition (POLISH-NUTRI-ZERO)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 682c9f2 (#1315) vert
(Tests, émulateur A56) · **TestFlight** : 1362.1362 chez « Testeurs Halcya » (inchangé ; le cron du soir n'avait pas
encore démarré à 22:45, comme la veille où il est parti à 03:52) · **Parité** : 70 % (33/47), inchangée

## État de départ
- PR de la routine ouverte : #1316 (POLISH-NUTRI-ZERO, brouillon du run de 21:30, checks Android verts). Priorité (b) :
  la finir. #51 (`cursor/*`) pas touchée. Pas de nouvelle réponse du propriétaire.
- iPhone : `upstream.json` suit HEAD, aucun correctif propre ; rien à soumettre ni à expirer avant la build du soir.

## Fait
- #1316 passée en « prête » dès le début du run, sans second correctif : un build iPhone de PR dure près d'une demi-heure,
  ajouter un correctif aurait repoussé le merge au run suivant. Un seul build iPhone pour la PR (CI économe).
- Étude « boissons en grammes » (synthèse des personas de 20:30) : vérifiée dans le code, c'est vrai pour une vraie
  analyse aussi (le relais demande `quantity_g` avec « 1 verre ≈ 200 ml », l'éditeur écrit toujours « g »). Rangée en
  **POLISH-BOISSON-ML** au BACKLOG pour le prochain run de code.

## Vérifications
- Branche à jour sur origin/main (base 682c9f2). Tests, Build APK, émulateurs : verts (run de 21:30, code inchangé).
- Build iOS sur simulateur et captures : voir la ligne « Merge » ci-dessous.

## Merge
Ce compte rendu est poussé avant le build iOS, pour ne pas relancer un build macOS par un commit de journal après lui
(CI économe). Le merge (squash) se fait dans ce run seulement si le build iOS est vert et les captures iPhone de
Nutrition regardées ; sinon la PR reste ouverte et le run suivant la reprend. Le run suivant note dans son compte rendu
le résultat (merge, release et taille de l'APK) d'après GitHub.

## Suite proposée
1. Run de code suivant : POLISH-BOISSON-ML (test d'abord, captures de l'éditeur du repas).
2. Ce soir : build iPhone et TestFlight (cron en retard), Alpha à 23:45 ; soumission bêta de la build du soir au premier
   run qui la voit traitée, expiration des anciennes.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51 ; le 29 ou le 30/11, le message E.

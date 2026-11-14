# Run 14/11 20:35 — Deux personas (Maigrir J1, Sportif J45) ; maquette PROP-SIM-17 ; suivi iPhone v1059

**Type** : idées (aucun code produit)  ·  **Android** : v1059 sur main au début (#982)  ·  **TestFlight** :
1030.1031 chez les testeurs externes d'après le relevé du run de 18:35, pas refait à ce run ; aucune soumission
bêta avant la nuit prochaine ; 844.344 intacte  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme (be4524e7…).
- Main 63c8bcf (#982) : Build & Release, Tests, Play — AAB et émulateur A56 verts. Aucune PR de la routine ouverte ;
  PR #51 (`cursor/*`) non touchée.
- Run de 20 h : sans code produit. Ordre suivi : suivi iPhone (lancé d'abord, la build macOS dure), simulations de
  personas, maquette d'une proposition.

## Fait
1. **Suivi iPhone** (PR #983) : `iphone/upstream.json` passe de v1054 à v1059 (le lien « Ajouter un appareil » de
   #982 ; #981 ne touche que le relais). Les 52 correctifs s'appliquent sans retouche. `PARITE.md` : lignes des runs
   de 18:35 et 19:35, #976 notée embarquée.
2. **Deux simulations de personas**, tirées au sort ([synthèse](../simulations/2026-11-14-2035-synthese.md)) :
   « Prendre soin de soi, maigrir » au 1er jour avec une Galaxy Watch, « Sportif » au 45e jour avec un téléphone
   seul. Au BACKLOG : POLISH-SIM-91 à 98, PROP-SIM-19 ; PROP-SIM-18 complétée ; POLISH-SIM-80 et 88 revus par une
   2e persona.
3. **Maquette de PROP-SIM-17** (bilan digestif avant le 28e jour) :
   [`maquettes/bilan-digestif/`](../maquettes/bilan-digestif/README.md), trois captures (14e jour clair et sombre,
   5e jour sans douleur), à côté de l'écran actuel. Proposition au propriétaire, rien n'est codé.

## Vérifs
- Captures regardées par la routine : Analyses et Agir au 45e jour, « Autre chose » et Tendances au 1er jour (les
  cinq « constats vérifiés » de la synthèse) ; les trois captures de la maquette.
- `app` : voir « Fin du run ».

## Limites
- Les autres constats des agents ne sont pas vérifiés (marqués « à vérifier » au BACKLOG). Version web : ni Health
  Connect, ni caméra, ni sommeil du téléphone. La persona du 1er jour a enchaîné trois fois deux gestes sans lire
  la capture intermédiaire.
- La maquette est statique, sur données inventées ; la barre du bas y est schématique. Elle n'a été confrontée à
  aucune persona. Le risque qu'elle fait courir (conclure seul « c'est la pizza ») est écrit dans la proposition.
- PROP-SIM-18 et PROP-SIM-19 n'ont toujours pas de maquette ; PROP-SIM-10, 11 et 16 non plus.
- Préparation des intégrations (B) : rien à ce run.
- TestFlight non relevé à ce run. La ligne « Poids » d'Aujourd'hui n'a toujours pas été vue sur iPhone.
- Charte, PRODUIT, BACKLOG et journal iPhone lus par sections (plus de 1 Mo) ; `DESIGN.md` (couleurs seulement),
  `INFRA.md`, `iphone/journal/README.md` et le BACKLOG iPhone non relus.

## Fin du run
Complété ci-dessous après les merges.

## Suite
- Finir #983 si sa build macOS n'était pas verte à la fin de ce run ; regarder Aujourd'hui sur iPhone.
- Nuit prochaine, après l'Alpha de 23:45 : soumettre la dernière build TestFlight traitée, puis expirer les anciennes.
- P44-2 (relevé des empreintes), puis P44-3.
- POLISH-SIM-91 avec la fin de POLISH-SIM-69 (le constat le plus répété des 45e jours), puis 92, 94, 97.
- Maquettes de PROP-SIM-18 et 19 (une seule : « poids et sport sans montre »).

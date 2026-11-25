# ESSAI-SANS — les jours « sans » d'un essai, mesurés au-dessus du seuil (banc du 25/11 08:30)

Reste de POLISH-SIM-159 (persona « Tout mesurer », J14 après mise à jour, 24/11) : à l'écran d'un essai « Dormir au
moins 7 h 30 », au jour 4, la ligne **Sans** reste vide alors que les jours 2 et 3 étaient des jours « sans ».

## Cause (vérifiée sur les données de l'outil, pas un artefact)

`trialStatus` (`app/src/services/trials.js`, `pick`) ne garde que les lendemains des jours **tenus**. Pour un jour
« sans », « tenu » veut dire « sous le seuil » (`heldFromData` : `day.with ? above : !above`). Or l'écran dit, ce
jour-là, « Aujourd'hui : comme d'habitude, rien à changer. » Dans les données de la persona, les nuits des jours 2
et 3 font 7 h 59 et 7 h 41 : au-dessus de 7 h 30, donc « non tenus », donc écartés. La personne a fait exactement ce
qu'on lui demandait et ses jours disparaissent sans un mot. (Le jour 3 n'aurait de toute façon son lendemain
qu'aujourd'hui.)

## Banc (vérité connue, 20 000 essais de 10 jours, 5 avec et 5 sans tirés au sort)

Script : [`bancs/banc-essai-sans.mjs`](bancs/banc-essai-sans.mjs) (`node journal/methode/bancs/banc-essai-sans.mjs`).
Sommeil ≈ habitude (+30 min les jours « avec »), écart-type 35 min ; bien-être du lendemain = effet × (sommeil −
7 h)/30 min + bruit 0,7 ; « facteur caché » = une journée chargée qui fait moins dormir et baisse le bien-être.
Même calcul que l'app (moyennes, ± 2 erreurs types, 3 lendemains au moins de chaque côté).

| Scénario | Règle | Conclut | « Plutôt oui » | « Plutôt non » | Écart moyen | « Sans » vide au jour 4 |
|---|---|---|---|---|---|---|
| effet 0,3, habitude 7 h 00 | actuelle | 47 % | 14,3 % | 0,2 % | 0,70 | 11 % |
| | calendrier | **100 %** | 11,7 % | 1,0 % | 0,30 | 0 % |
| effet 0,3, habitude 7 h 30 | actuelle | 48 % | 14,1 % | 0,2 % | 0,69 | 33 % |
| | calendrier | **100 %** | 11,5 % | 1,0 % | 0,30 | 0 % |
| effet nul, habitude 7 h 30, facteur caché | actuelle | 47 % | **3,6 %** | **1,5 %** | **+0,14** | 33 % |
| | calendrier | 100 % | 4,2 % | 4,0 % | 0,00 | 0 % |

(Variante intermédiaire « jours sans toujours gardés » : entre les deux, encore biaisée ; détail dans la sortie du
script.)

Lecture : la règle actuelle (« par protocole ») fait conclure « Trop peu de jours » à plus d'un essai sur deux,
gonfle l'écart (0,70 au lieu de 0,30) et, sans aucun effet réel, penche vers « Plutôt oui » dès qu'un facteur caché
joue sur les deux. Compter les jours **par calendrier** (intention de traiter) est sans biais : c'est le tirage au
sort qui protège, et la règle actuelle le défait. Prix : un écart dilué quand les consignes ne sont pas suivies,
ce qui est honnête (« ce que donne l'essai tel que vous l'avez vécu »).

Constat à part : avec 10 jours, même un vrai effet de 0,3 n'est repéré qu'environ une fois sur huit. Le bilan
« Pas de différence nette » sera le plus fréquent ; la page le dit déjà sans reproche. Ne pas promettre plus.

## Proposition pour un run de code (POLISH-ESSAI-SANS, BACKLOG)

1. `pick` : tous les jours passés du calendrier, avec ou sans, quelle que soit la tenue (la tenue reste pour les
   lanternes et le « Consigne tenue N jours sur 5 »). Tests d'abord dans `trials.test.js` : jour « sans » au-dessus du
   seuil compté ; jour « avec » non tenu compté ; bilan inchangé sur les cas existants où tout est tenu.
2. `Trial.jsx` : la phrase d'aide « Chaque point : … le lendemain d'un jour avec ou sans. » reste juste ; rien à
   ajouter à l'écran.
3. Données : aucun changement de schéma ; les essais en cours se recalculent seuls.
4. iPhone : code commun, même PR.

Règle 5 inchangée (X = sommeil, Y = bien-être noté ou lu, ordre X avant Y par le lendemain) ; règle 6 inchangée.

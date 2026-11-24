# Proposition PROP-SIM-19 — noter son poids en un geste, et sa courbe

> **Proposition au propriétaire, rien n'est codé.** Mode polish (décision A du 07/11) : une fonction hors du brief
> attend son accord. Maquette statique sur données synthétiques : `maquette.html`
> (`?state=autre|saisie|tendances|tendances2`, `?theme=dark`), captures par `node journal/maquettes/poids/render.mjs`.
> Run « idées » du 24/11 08:30.

| 1. Ma journée › Autre chose | 2. La saisie | 2. Sombre | 3. Tendances › Poids (Mois) | 3. Sombre | 4. Deux pesées seulement |
|---|---|---|---|---|---|
| ![](1-autre-chose.jpg) | ![](2-saisie.jpg) | ![](2-saisie-sombre.jpg) | ![](3-tendances.jpg) | ![](3-tendances-sombre.jpg) | ![](4-deux-pesees.jpg) |

## Le problème
- L'accueil promet le poids : avec l'objectif « Prendre soin de moi » (« alimentation, poids, forme »), l'étape
  « Votre téléphone suffit » liste « poids » parmi ce qu'on note à la main (`handNotes`, `settings/onboarding.js`).
- Mais la seule saisie est cachée dans Données › Nutrition › « Compléter mon profil » (`BodyProfileCard.jsx`), au
  milieu du sexe, de l'âge et de la taille. Rien dans Ma journée › Autre chose, rien dans Objectifs.
- Trois personas « Prendre soin de soi » de suite l'ont cherché (21, 22 et 23/11), plus « Maigrir » deux fois et
  « Sportif » le 14/11 (PROP-SIM-19). Le 23/11, J14 : pesée trouvée « avec effort », courbe jamais trouvée.

## Ce que la maquette propose
1. **Ma journée › Autre chose › « Noter mon poids »**, en tête de la liste. Pour tout le monde : ce n'est pas une
   question de plus, juste une ligne de plus dans un menu qu'on ouvre soi-même.
2. **Une saisie en une feuille** : le dernier poids déjà écrit, − et + par 100 g, l'heure modifiable, la dernière
   pesée en rappel, « Enregistrer ». C'est la pesée `app_weight` qui existe déjà : aucune donnée nouvelle.
3. **Tendances › Poids** : les points sont les pesées (à la main, balance Withings, Health Connect ou l'app Santé,
   avec leur source), la ligne est une moyenne lissée (R#8 du BACKLOG), la bande montre sa marge (leçon A4 :
   l'incertitude se montre). En tête, la tendance du jour et l'écart sur 4 semaines, sans adjectif.
4. **Avant la 3ᵉ pesée**, les points seuls et la phrase déjà dans l'app (« La courbe arrive à 3 pesées. »).

## Ce que ce n'est pas (et pourquoi)
- **Pas de poids cible, pas d'IMC jugé, pas de « maigrir » en objectif, aucune couleur verte ou rouge sur une
  baisse ou une hausse.** Règle 6 (aucun comportement jugé par principe) et méta-leçon A6 (jamais de culpabilisation).
  Le poids est aussi un sujet où une app peut faire du mal (troubles alimentaires) ; Halcya n'est pas une app de
  régime, et le brief a retiré les cibles qui l'en rapprochaient.
- Pas de rappel « pesez-vous ». Une habitude « me peser le lundi » reste possible dans Objectifs comme toute
  habitude ; rien de plus.
- Rien ne quitte le téléphone : la Sécurité des données Google et Apple ne change pas. Rien à déclarer.
- Le poids reste un **contexte** (X) pour les pistes, jamais une entrée du bien-être (règle 5 inchangée).

## Si vous dites oui
Deux runs de code, iPhone dans les mêmes runs (code partagé ; l'app Santé donne déjà les pesées sur iPhone) :
(a) la ligne « Noter mon poids » et la feuille, testées (valeur reprise de la dernière pesée, bornes 25 à 300 kg avec
la question douce de POLISH-SIM-153 au-delà, heure, retour à Ma journée) ; (b) la ligne lissée et sa bande dans
Tendances, testées sur des pesées espacées et serrées, captures claires et sombres sur les deux téléphones.

Réponse attendue : **« PROP-SIM-19 oui »** (les deux), **« saisie seulement »** (1 et 2, la courbe reste telle quelle)
ou **« non »** (on retire alors « poids » de la phrase de l'accueil, pour ne plus le promettre).

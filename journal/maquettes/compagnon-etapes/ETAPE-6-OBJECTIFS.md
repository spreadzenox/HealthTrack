# Étape 6 de la refonte « Compagnon » : Objectifs — préparation (15/11 11:35)

> Écrit pendant la build iPhone de #1011, sans code produit. Sources : brief § 3.5, § 4, § 5, § 10 (étape 6) ;
> `specs/comprendre.SPEC.md` § 6 et § 7 ; le code de main aca48cc (v1085). Rien ici n'a été essayé dans l'app :
> c'est un inventaire et un découpage, à vérifier par le run de code qui commence l'étape.

## 1. Ce que demande le brief
- Onglet Objectifs : « le score de chaque objectif et sa tendance, en mots simples » ; toucher un objectif montre
  « ce qui l'influence » en 3 familles (sommeil, alimentation, activité), puis le détail d'une famille et « la piste
  à tester » en défi doux (5 soirs), avec un bilan honnête ; « Comment est calculé votre bien-être ? » ; la
  réintroduction FODMAP sous Confort digestif.
- Ensuite les seuils : 7 jours (bien-être), 14 jours (digestion), à la place de 14 et 28.
- Pilou (84 px, galets, lanternes, confettis) n'arrive qu'aux étapes 8 à 12 : l'étape 6 se fait sans lui, avec le
  même contenu en texte (la SPEC le prévoit déjà sous chaque illustration).

## 2. Ce qui existe aujourd'hui
| Écran | Fichier | Ce qu'il montre |
|---|---|---|
| Objectifs (`/recommendations`, `/recommendations/ventre`) | `pages/Recommendations.jsx` (360 lignes) | Deux sous-onglets Bien-être et Digestion ; avant les résultats, un compte à rebours ; ensuite « Pistes à tester », « Ce qui va avec votre … » par horizon (court, moyen, long terme), « À regarder, pas à changer », « Comment c'est calculé ». Pas de score sur 5 ni de tendance. |
| Agir (`/agir`) | `pages/Act.jsx` (204 lignes) | Les essais et les habitudes gardées. |
| Un essai (`/agir/essai/:id`) | `pages/Trial.jsx` (210 lignes) | Jours « avec » et « sans » tirés au sort, résultat en cours dès 3 lendemains de chaque sorte, « Vérifié par votre essai » ou « pas d'effet net ». |
| Réintroduction (`/reintroduction`) | `pages/Reintroduction.jsx` | Auto-tests FODMAP par groupe. |

Facteurs du moteur (`services/analysisResults.js`) et leur thème actuel :
- `sleep` : sommeil ;
- `activity` : pas, activité (kcal) ;
- `nutrition` : calories, fibres, sucres, lipides, alcool, les FODMAP par sous-groupe ;
- `context` : temps d'écran, écran tard le soir, réseaux sociaux, soleil, température, pression ;
- `body` : cœur au repos, variabilité cardiaque (non actionnables) ;
- `habit` : une par habitude (miel, étape 4b).

## 3. Les seuils : où ils vivent
`config/firstResults.js` : `FIRST_RESULTS_DAY = { wellbeing: 14, digestion: 28 }`. Lu par :
- `services/analysisResults.js` : `UNLOCK_DAYS` (court terme = ce seuil ; moyen terme 21 et 35 ; long terme 42 et 56),
  et `2 × seuil` avant de chercher des changements durables (`detectChanges`) ;
- `services/today.js` : `PISTES_MIN_DAYS` ;
- `services/tour.js` (visite guidée : « Exemple au jour 14 », « Au jour 28 ») et `services/tourData.js` (données
  fictives réglées pour une piste nette à 14 jours et une piste digestion à 28) ;
- `components/SeeExample.jsx` (« Voir un exemple » pendant les 14 premiers jours) ;
- `pages/Premium.jsx` (« Vos pistes arriveront vers le 14e jour de suivi »).
- `components/DigestBlock.jsx` écrit « N/28 jours notés » : à vérifier, le chiffre vient peut-être du contrat.

Un test vérifie déjà qu'aucun texte ne donne un autre délai : il faudra le faire passer avec 7 et 14.

## 4. Deux lectures possibles de « 7 jours », à trancher par le run de code
La SPEC (§ 6.1) montre au jour 7 **un score et une tendance** (« 3,8 / 5 », « Plutôt en hausse cette semaine »,
7 barres), et pour la digestion une jauge de 14 segments (« Premier score dans 7 jours »). Elle ne montre les liens
(« ce qui influence ») qu'en touchant la carte. Le brief § 3.5 parle de « premières analyses » et nomme
`firstResults.js`.

- **Lecture A (la plus prudente)** : à 7 et 14 jours, le *score et la tendance* s'affichent ; les *liens* gardent
  leur propre seuil statistique tant que le banc ne dit pas qu'ils tiennent à 7 points.
- **Lecture B (la lettre du brief)** : `FIRST_RESULTS_DAY` passe à 7 et 14, donc l'horizon court du moteur s'ouvre
  à 7 jours.

Ce qui départage : le banc des nulles et de puissance (ORG-5a) rejoué à n = 7 et n = 14. Si, à 7 jours, le moteur
ne sort presque jamais de lien « net » (probable : Holm sur tous les facteurs, stabilité exigée), B est honnête mais
l'écran doit dire « encore trop tôt pour des pistes » sans promettre ; si le taux de faux liens dépasse 5 %, B est
exclue (règle 5, « on préfère attendre plutôt que de se tromper », brief § 3.5). À mesurer avant de changer le
chiffre (méta-leçon 10).

## 5. Découpage proposé (un run par ligne)
- **6a — La vue d'ensemble** : `/recommendations` s'ouvre sur les cartes des objectifs : Bien-être (score sur 5 des
  7 derniers jours, tendance en mots, 7 barres) et, avec l'objectif, Confort digestif (score ou jauge des jours
  notés). « Des estimations, pas un diagnostic. » une fois. Les sous-onglets actuels deviennent le détail d'une
  carte. Le score vient de ce que Tendances calcule déjà (un même objet, une seule mesure).
- **6b — Ce qui l'influence, en 3 familles** : regrouper les facteurs par famille, force du lien en trois niveaux
  (●●●, ●●, ●) et en mots ; fiche « Comment est calculé votre bien-être ? ». À trancher : où vont `context`
  (écran, météo), `body` et `habit`, que la maquette ne montre pas (proposition : écran tard le soir sous Sommeil,
  comme dans la SPEC § 6.5 ; habitudes en quatrième ligne miel ; météo et corps sous « À regarder, pas à changer »,
  comme aujourd'hui).
- **6c — Le détail d'une famille et la piste en défi doux** : l'essai d'Agir devient « 5 soirs, pas forcément
  d'affilée, en 10 jours au plus », bilan par la grille de mots de la SPEC § 7 (« Plutôt oui », « À confirmer sur
  plus de soirs », « Trop peu de soirs pour conclure »). À trancher : le tirage au sort des jours « avec » et
  « sans » d'ORG-8 (validé le 07/11) disparaît-il ? La SPEC compare aux 14 nuits habituelles, sans tirage : c'est
  moins solide statistiquement, et le bilan le dit (« À confirmer »).
- **6d — Les seuils 7 et 14** : banc d'abord (§ 4), puis `FIRST_RESULTS_DAY`, `UNLOCK_DAYS`, la visite guidée et ses
  données fictives, Premium, « Voir un exemple », les textes et le test des délais.
- **6e — La réintroduction FODMAP sous Confort digestif** (lien depuis le détail de la carte).

## 6. Textes à surveiller
- La SPEC écrit « Le ventre demande plus de recul » et « le ventre a son score » : règle du propriétaire du 07/11
  (AUJ-7), « digestion », jamais « ventre ».
- « Bravo », confettis : seulement pour l'effort (commencer, finir), jamais pour un résultat (brief § 5 et § 8).
- « pistes », jamais « causes » ; « un lien, pas une preuve » dit une fois par écran, pas en refrain.

## 7. iPhone
Tout est du code partagé. Le défi « pas d'écran après 22 h » dépend du temps d'écran : sur iPhone avant iOS 26.4 (et
hors UE), il faut la question du matin dans Ma journée (brief § 11, SPEC § 7). À inscrire dans `PARITE.md` à 6c.

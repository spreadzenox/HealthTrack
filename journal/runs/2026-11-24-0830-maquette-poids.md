# Run 24/11 08:30 — maquette « noter son poids » (PROP-SIM-19), run « idées »

**Type** : 💡 (sans code produit) · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main
9bf38a9 (#1233), Build & Release, Tests et Play — AAB verts (émulateur en cours à 07:26 UTC) · **TestFlight** :
1290.1290 chez « Testeurs Halcya », en examen bêta depuis le 24/11 04:32 UTC (dernier relevé) · **Parité** : 70 %
(33/47), `iphone/patches/` vide

## État de départ
- #1233 (FUSION-3, correctifs 01 et 27) mergée par le run de 07:30 lui-même ; main vert. Aucune PR « [Auto] »
  ouverte ; #51 (`cursor/*`) pas touchée.
- Alpha du 23/11 au soir partie le 24/11 à 06:26 UTC (verte).

## Proposition PROP-SIM-19 : noter son poids (maquette)
- Constat de départ, vérifié dans le code : l'accueil promet « poids » à l'objectif « Prendre soin de moi »
  (`handNotes`, `settings/onboarding.js`), mais la seule saisie est dans Données › Nutrition › « Compléter mon
  profil » (`BodyProfileCard.jsx`). Ma journée › Autre chose (`AddStrip.jsx`) n'a que « Décrire un repas » et les
  cigarettes. Trois personas « Prendre soin de soi » l'ont cherché (21, 22, 23/11).
- `journal/maquettes/poids/` : `maquette.html` (Nunito, fond crème, rose = corps, tokens de l'app), `render.mjs`,
  6 captures (Autre chose, saisie claire et sombre, Tendances claire et sombre, deux pesées seulement), README.
- Choix : pas de cible, pas d'IMC jugé, pas de rappel, pas de couleur sur une baisse (règle 6, méta-leçon A6, risque
  de troubles alimentaires) ; la courbe montre sa marge (bande) au lieu de l'écrire. Rien ne quitte le téléphone.
- Captures relues : une première version avait une ligne en escalier et la dernière date coupée, corrigées (lissage
  sur un poids interpolé jour par jour, étiquette alignée à droite) ; l'état « deux pesées » montrait 72,8 kg en tête
  et trois pesées dans la liste, corrigé.

## Pas de personas ce run
Le temps du run est allé à la maquette, promise par trois runs. Les deux simulations du jour : run « idées » de 20:00.

## Vérifications
Journal et maquette seulement (`journal/`) : aucun fichier de `app/` touché, aucun build iPhone lancé. Tests du dépôt
par les checks de la PR.

## Suite
1. Run de code suivant : prochain POLISH-SIM du BACKLOG ou suite de FUSION-3 (`overlay/`, un sujet à la fois).
2. Run « idées » de 20:00 : deux personas ; PROP-SIM-18 (séance à la main, protéines) reste sans maquette.

## Pour le propriétaire
Une réponse en un mot, quand vous voulez : « PROP-SIM-19 oui », « saisie seulement » ou « non »
([`maquettes/poids/README.md`](../maquettes/poids/README.md)). Toujours d'abord : recruter des testeurs (4 sur 12),
puis PI2, puis P51.

# Simulation — Prendre soin de soi, maigrir — J1 — 2026-11-08 03:40

- **Persona** : n°6 Prendre soin de soi, maigrir — femme de 45 ans, veut suivre poids, repas, activité, motivation
- **Configuration** : n°2 iPhone seul (pas ; sommeil en partie ; rien d'autre, poids 23 %) — reçu : pas (Gadgetbridge, hier 8 585 et vendredi 5 606) ; absent : sommeil, montre, poids
- **Moment** : jour 1 — premier lancement, accueil avec les pas d'hier, aucun repas, aucune note

## Tâches
1. Comprendre l'app en 30 secondes — abandonnée à moitié : je vois Repas / Bien-être / Digestion / Selles, mais rien sur le poids ni la perte de poids ; j'ai l'impression d'une app digestion.
2. Noter un repas en texte — réussie après détour : « Remplir avec l'IA » échoue (« Aucun aliment reconnu »), j'ai dû chercher « Œuf cuit » à la main ; seul 1 œuf, pas « 2 œufs + tartine ».
3. Entrer mon poids — réussie mais cachée : introuvable sur l'accueil, trouvée dans Journal > Nutrition > Compléter mon profil ; le poids saisi devient une « pesée du jour ».
4. Voir mon évolution de poids — ratée : Tendances n'affiche que les Pas, aucune courbe de poids.
5. Savoir combien de calories il me reste / mon objectif — ratée : 134 kcal affichés, aucun objectif calorique ni bilan.
6. Retrouver mes pas et mon sommeil — partielle : pas visibles (Accueil, Tendances, Sources) ; sommeil « Disponible dans l'app Android », rien sur iPhone.

## Compris
- Les pas d'hier et la courbe de la semaine (Tendances) sont clairs — capture : `captures/2026-11-08-0340-prendre-soin-maigrir-J1/tendances.png`
- Le repas enregistré apparaît dans Journal et sur l'accueil avec ses kcal — capture : `captures/2026-11-08-0340-prendre-soin-maigrir-J1/accueil-apres.png`
- Le message de consentement avant l'IA est clair sur ce qui part — capture : `captures/2026-11-08-0340-prendre-soin-maigrir-J1/ia-erreur.png`
- Le poids saisi apparaît dans Journal (« Poids 82 kg ») — capture : `captures/2026-11-08-0340-prendre-soin-maigrir-J1/journal-poids.png`

## Pas compris
- « Vos analyses digestives arrivent dans 28 jours » : je n'ai pas de problème de ventre, ça me parle peu ; deux gros encarts « arrivent dans 14/28 jours » et rien pour moi aujourd'hui — capture : `captures/2026-11-08-0340-prendre-soin-maigrir-J1/accueil.png`
- L'erreur « Aucun aliment reconnu » reste affichée en rouge même après avoir ajouté l'aliment à la main (incohérent, on croit que ça a raté) — capture : `captures/2026-11-08-0340-prendre-soin-maigrir-J1/ia-erreur.png`
- « Autre chose » ne propose que « Décrire un repas » et « + 1 cigarette » : pas de poids, pas d'activité/sport ni d'eau — capture : `captures/2026-11-08-0340-prendre-soin-maigrir-J1/accueil.png`
- Carte Pas : « D'après votre téléphone » alors que Sources dit « Gadgetbridge » ; je ne sais pas d'où viennent mes pas — capture : `captures/2026-11-08-0340-prendre-soin-maigrir-J1/sources.png`
- Nutrition : « 134 kcal en moyenne, apports sous-estimés » et barres hachurées pour 1 œuf : alarmant et peu utile le jour 1 — capture : `captures/2026-11-08-0340-prendre-soin-maigrir-J1/accueil-apres.png`
- Agir : « Rien en cours » avec « essais » et « rapport médecin » : vocabulaire médical, je ne sais pas quoi faire.

## Constats → étapes POLISH au BACKLOG
- [ ] Accueil / « Autre chose » : ajouter un raccourci « Poids » (saisie rapide) et l'afficher dans « Vos données du jour » une fois saisi (aujourd'hui seul le Journal le montre).
- [ ] Tendances : proposer une courbe Poids (et kcal/jour) dès qu'il y a une pesée, avec un état vide explicite sinon ; aujourd'hui seule la courbe Pas existe.
- [ ] Repas texte : quand « Remplir avec l'IA » ne reconnaît rien, effacer le message d'erreur dès qu'un aliment est ajouté à la main ; proposer des suggestions de la description (« œufs », « tartine »).
- [ ] Accueil J1 : pour un profil sans souci digestif, ne pas mettre la carte « analyses digestives » comme premier plan ; adapter selon l'objectif (poids/bien-être) ou demander l'objectif au premier lancement.
- [ ] Nutrition : permettre un objectif (calories / poids cible) dans le profil et afficher « reste » ; adoucir le bandeau « apports sous-estimés » quand il n'y a qu'un seul repas.
- [ ] Sources iPhone : masquer ou expliquer « Disponible dans l'app Android » (visage, sommeil) pour un iPhone, et dire quoi faire pour le sommeil ; harmoniser « D'après votre téléphone » vs Gadgetbridge.

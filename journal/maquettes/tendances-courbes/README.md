# Tendances : cœur, phases du sommeil, oxygène (proposition, 19/11 08:30)

Reste de **POLISH-SIM-107** (persona « Tout mesurer », 16/11) : de nouvelles courbes, donc une nouvelle fonction en
mode polish → **proposition au propriétaire, rien de codé**.

- `maquette.html` (ouvrir dans un navigateur) et `maquette.png` (capture ×2).
- Écran 1 : « + » propose Sommeil profond, Cœur (moyenne du jour) et Oxygène la nuit, seulement si la montre les envoie ;
  sinon ligne grisée avec la raison, comme aujourd'hui.
- Écran 2 : vue Jour, la nuit en phases (éveil, paradoxal, léger, profond) sous la durée, et le cœur heure par heure.
- Écran 3 : vue Semaine, l'oxygène moyen de la nuit, présenté comme une estimation de la montre.

Vérifié dans le code le 19/11 : les nuits gardent leurs phases (`deep`, `rem`, `light`, `awake`), et les sous-types
`heartRate` et `oxygenSaturation` de `heart_rate` sont déjà stockés (`dailyAggregates`) : aucune nouvelle lecture, aucune
nouvelle permission, rien ne quitte le téléphone. Coût estimé : 2 runs de code, iPhone dans les mêmes runs.

Réponse attendue : « go courbes » (les trois), « go phases » (une seule), ou « non ».

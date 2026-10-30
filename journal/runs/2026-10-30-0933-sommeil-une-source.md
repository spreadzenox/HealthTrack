# Run du 30/10/2026 09:33 (Paris, CET) — Sommeil : une seule source par nuit (POL-PLAY-59)

**Type** : 🐛 Code (chiffres fiables, polissage de la version play)

## Constat au démarrage
- Main à `86f9f7d` (#522), aucune PR « [Auto] » ouverte (seule #51, `cursor/*`, non touchée).
- POL-PLAY-59 (trouvé au run « idées » de 08:33) en tête : `nightlySleep` (`radar.js`) et `buildDailyJournal`
  additionnaient les phases de toutes les sources d'une même nuit ; montre + Health Connect → 7 h affichées 14 h.

## Fait
- `services/sleepSources.js` : `oneSleepSourcePerNight(entries)` garde, par nuit (jour local du réveil), une seule
  source = `source` + `sourceName` (deux apps Health Connect = deux sources) : celle qui a des phases (léger, profond,
  paradoxal), puis la plus longue durée endormie, puis la montre Huawei. Siestes hors du choix. Filtre à la lecture :
  aucune entrée effacée (historique, export, diagnostic montre intacts). `sleepNightKey` partagée (l'ancien
  `sleepDateKey` de `dailyJournal.js`, déplacé).
- Branché dans `nightlySleep` (analyses, Radar, `gutDays`, rapport PDF) et `buildDailyJournal` (Accueil, Journal).
- Vérifié sans changement : VFC et FC au repos de la nuit (moyennes) ; `sleepRegularity` (union d'intervalles) ;
  tuile « Sommeil » (liste toujours les deux sources, un seul chiffre).

## Tests
- `sleepSources.test.js` (7) : montre + Health Connect → 420 min (pas 840) dans `nightlySleep` et le Journal ; égalité →
  montre ; phases > durée « endormi » ; deux apps Health Connect ; une source inchangée ; deux nuits ; sieste ;
  rien de muté.

## Vérifications
- `npm run test` (2721 ✔), `npm run build`, `npm run lint` (6 erreurs, comme avant), `npm run visual -- --play` (Accueil
  et Journal démo relus : sommeil inchangé sur la démo à une source).

## Données
- Aucune migration : choix à la lecture.

## Demandes iOS
- Commun aux deux plateformes : note de Nouveautés sans `variants`.

## Suite
- POL-PLAY-60 (« Quand consulter », phrase statique dans la carte ventre et le PDF), puis le reste du BACKLOG par impact.

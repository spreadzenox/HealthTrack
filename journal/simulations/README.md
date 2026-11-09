# Simulations de personas

**But** : voir l'app avec les yeux d'un vrai utilisateur (décision C du propriétaire, 07/11).
Un agent qui ne sait presque rien de l'app reçoit une persona, une configuration de matériel
(tirée au prorata des parts de marché) et un moment (jour 1, 14 ou 45, avec des données de
démo synthétiques cohérentes). Il n'a qu'un accès visuel, réalise des tâches concrètes et
note ce qu'il comprend ou non, captures à l'appui. Personas et configurations :
[`../PERSONAS.md`](../PERSONAS.md).

**Nommage** : `simulations/AAAA-MM-JJ-HHMM-<persona>-J<n>.md`
(ex. `2026-11-08-0130-sportif-J14.md` ; persona en minuscules avec tirets ; `n` = 1, 14 ou 45).

## Outil (PERSONAS-1, 08/11)

`npm run persona -- --day=14 --equipment=watch --goals=care --notes=few --port=7811 --out=<dossier>` (dans `app/`) lance la variante play
dans un téléphone simulé avec les données de démo que la persona aurait (`scripts/persona/personaData.mjs`, testé) :
**jour 1** = premier lancement (le nouvel accueil s'ouvre au premier écran même si 30 jours sont déjà importés ; corrigé le 08/11 20:35 : avant, il était sauté), aucune saisie ; **jour N** = N jours de
données. **Matériel** : `phone` (pas et calories), `watch` (Health Connect sans VFC : Samsung, Garmin, Xiaomi),
`watch-hrv` (avec VFC : Apple Watch, Fitbit, Pixel), `huawei` (connexion directe), `full` (+ balance). Relais,
météo et GitHub sont simulés (période de lancement, Gold), analyse de repas factice. L'agent n'agit que par des
gestes HTTP (`/tap?text=…`, `/tap?x=&y=`, `/type`, `/scroll`, `/back`, `/full`) qui renvoient chacun une capture ;
il ne lit jamais le code. Consigne donnée aux agents : `brief.md`. Tirage : persona uniforme, configuration au
prorata des poids, moment uniforme parmi 1, 14, 45 ; une configuration iPhone est jouée sur l'apparence Android
(même code).

**Objectif et saisie (POLISH-SIM-7 et 9, 09/11)** : `--goals=` coche les objectifs de l'accueil pour un jour > 1
(`gut`, `cycle`, `stress`, `sport`, `care`, `all` ; au jour 1 l'agent les choisit lui-même). Correspondance :
Ventre (1, 2) → `gut` ; Endométriose → `cycle,gut` ; Tout mesurer → `all` ; Sportif → `sport` ; Prendre soin de soi →
`care` ; Stressé et pressé → `stress`. `--notes=few` (Stressé et pressé) : aucun repas ni ventre, une note de
bien-être un jour sur trois ; le visage et les imports restent. Dire à l'agent que Health Connect, le sommeil estimé
et la lecture du visage n'existent pas dans la version web.

## Modèle de rapport

```markdown
# Simulation — <Persona> — J<n> — AAAA-MM-JJ HH:MM

- **Persona** : <n° et nom> — <description reprise de PERSONAS.md>
- **Configuration** : <n° et nom> (<appareils>, poids <x> %) — données reçues / absentes
- **Moment** : jour <1 | 14 | 45> — données de démo utilisées : <résumé>

## Tâches
1. <tâche concrète> — réussie / ratée / abandonnée
2. …

## Compris
- <ce qui est clair> — capture : `<chemin/vers/capture.png>`

## Pas compris
- <ce qui bloque ou trouble, avec les mots de la persona> — capture : `<chemin/vers/capture.png>`

## Constats → étapes POLISH au BACKLOG
- [ ] <constat> → étape POLISH proposée dans `journal/BACKLOG.md`
```

# Simulations de personas

**But** : voir l'app avec les yeux d'un vrai utilisateur (décision C du propriétaire, 07/11).
Un agent qui ne sait presque rien de l'app reçoit une persona, une configuration de matériel
(tirée au prorata des parts de marché) et un moment (jour 1, 14 ou 45, avec des données de
démo synthétiques cohérentes). Il n'a qu'un accès visuel, réalise des tâches concrètes et
note ce qu'il comprend ou non, captures à l'appui. Personas et configurations :
[`../PERSONAS.md`](../PERSONAS.md).

**Nommage** : `simulations/AAAA-MM-JJ-HHMM-<persona>-J<n>.md`
(ex. `2026-11-08-0130-sportif-J14.md` ; persona en minuscules avec tirets ; `n` = 1, 14 ou 45).

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

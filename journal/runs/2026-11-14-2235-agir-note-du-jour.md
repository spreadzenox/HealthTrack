# Run 14/11 22:35 — Agir vide : plus de « notez chaque jour » quand c'est fait (POLISH-SIM-92) ; suivi iPhone v1059

**Type** : code (polish, une phrase conditionnelle)  ·  **Android** : main 4c06fe3 (#986) au début  ·
**TestFlight** : pas relevé à ce run ; 1030.1031 chez les testeurs externes d'après le relevé de 18:35 ; aucune
soumission bêta avant la nuit prochaine ; 844.344 intacte  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme (be4524e7…).
- Main 4c06fe3 : Tests et émulateur A56 verts ; Build & Release, Play — AAB et déploiement du relais verts sur #985.
- **PR #983 (suivi iPhone v1059, run de 20:35) restée ouverte** : build iOS sur simulateur verte à 22:23, mais la
  branche avait deux commits de retard sur main (#985 relais, #986 journal). Le run de 20:35 l'a passée au run
  suivant (commentaire de la PR, captures `captures/pr-983` déjà regardées par lui). Je l'ai remise à jour sur main
  à 22:35 : la build macOS repart (près d'une heure). Pendant ce temps, une étape indépendante dans `app/`, qui ne
  touche ni `iphone/` ni `PARITE.md`.
- PR #51 (`cursor/*`) : non touchée.

## Fait
1. **POLISH-SIM-92** : sur Agir vide, « D'ici là, notez votre bien-être chaque jour. » (ou « votre digestion »,
   avec l'objectif ventre) ne s'affiche plus quand la note du jour existe (`Act.jsx`). Bien-être : une note saisie
   aujourd'hui (type `wellbeing`) ; digestion : une saisie du ventre aujourd'hui. Le reste de la carte ne change pas.
2. Tests écrits d'abord (deux rouges, puis verts) dans `Act.test.jsx` : bien-être noté aujourd'hui (phrase absente,
   lien présent), dernière note hier (phrase présente), objectif ventre avec digestion notée aujourd'hui (absente).
3. Outil de capture : `npm run visual -- --wellbeing-today` ajoute une note de bien-être il y a une heure (les
   données de démo n'ont pas de note pour le jour en cours).
4. Note de Nouveautés : `2026-11-14-2235-agir-note-du-jour.json` (les deux apps, sans `variants`).

## Vérifs
- `app` : `npm run test`, 3551 verts, 44 ignorés ; `npm run lint`, aucune erreur ; `npm run build` passe ;
  `npm run visual`, toutes les pages « ok », aucune erreur JavaScript.
- Captures regardées : Agir avec `--empty` (clair) et `--history-days=2 --dark` : phrase présente (aucune note
  aujourd'hui) ; avec `--history-days=2 --wellbeing-today`, clair et sombre : phrase absente, carte propre
  ([clair](captures/2026-11-14-2235-agir-note-faite-clair.png) ·
  [sombre](captures/2026-11-14-2235-agir-note-faite-sombre.png)).
- iPhone : aucun correctif de `iphone/patches/` ne touche `Act.jsx`.

## Limites
- **Pas encore sur iPhone** : arrive au prochain suivi du code embarqué (après #983, qui épingle v1059).
- La persona « Sportif J45 » avait un bien-être lu par le visage et noté : la phrase ne disparaît que sur une note
  saisie aujourd'hui, pas sur une lecture du visage (« notez » parle de la note). À qui note chaque soir, Agir
  ouvert le matin affiche donc encore la phrase.
- Cas « objectif ventre, digestion notée » couvert par le test seulement, pas vu en capture.
- Une note datée d'après l'heure courante (horloge changée) ne compte pas.
- Charte, PRODUIT, BACKLOG lus par sections (plus de 1 Mo) ; `DESIGN.md`, `INFRA.md`, `iphone/README.md`,
  `iphone/journal/README.md`, `PARITE.md` et le BACKLOG iPhone non relus à ce run : je me suis appuyé sur les
  comptes rendus de 19:35 et de 21:35.
- `journal/PRODUIT.md` non modifié : ni jalon ni action du propriétaire ne change. « Prochaine action du
  propriétaire » laissée telle quelle. TestFlight non relevé.
- Pas de ligne dans `iphone/journal/PARITE.md` dans cette PR (fichier modifié par #983) : voir « Fin du run ».

## Fin du run
Voir la PR de ce run ; complété après les merges.

## Suite
- Suivi iPhone de cette version (upstream v1059 → dernière), ligne `PARITE.md` des runs de 21:35 et 22:35.
- Nuit, après l'Alpha de 23:45 : soumettre la dernière build TestFlight traitée, puis expirer les anciennes.
- P44-2b le 02/12 ; P44-3. POLISH-SIM-91 avec la fin de POLISH-SIM-69, puis 94, 97, 95.

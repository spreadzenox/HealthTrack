# Run 14/11 09:35 — Tendances : « Poids » garde sa courbe (POLISH-SIM-81)

**Type** : code (mode polish)  ·  **Android** : v1042 sur main au début, v1043 après ce run  ·
**TestFlight** : 1030.1031 chez les testeurs externes (depuis le 14/11 à 00:33) ; « iOS — TestFlight » vert sur
a0fe1d1 (code de la v1040, 08:48 ; numéro non relevé) ; aucune soumission bêta avant la nuit prochaine ; 844.344
intacte  ·  **Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main efee974 (#964, v1042) : Build & Release, Tests, Play — AAB et émulateur A56 verts. Sur a0fe1d1 (#963) :
  « iOS — TestFlight » et modèles du visage verts ; « iOS — build simulateur » encore en cours au début du run.
- PR #965 ouverte (journal du run de 07:35 : note de fin et deux captures iPhone), en conflit avec main sur
  `journal/README.md` : le run de 08:35 a écrit la même chose avec ses propres captures (#964). #51 (`cursor/*`)
  non touchée.

## Fait
0. **PR #965** : pas mergée (conflit, contenu en double). Sa seule partie absente de main, la note « Fin du run »
   du compte rendu de 07:35, est reprise dans ce compte rendu-là par cette PR ; #965 fermée.
1. **POLISH-SIM-81** (`TrendsViewer.jsx`) : en vue Jour, le menu « + » liste les mesures qui ont une courbe sur le
   mois, mais toucher une mesure ouvrait toujours la Semaine. Avec trois pesées espacées, « Poids » n'a pas de
   courbe en Semaine : il disparaissait, et l'écran disait « Choisissez une courbe » avec « Pas » seul. La mesure
   touchée s'ouvre maintenant en Semaine si elle y a 3 points, sinon en Mois. La phrase du menu reste « Une valeur
   par jour, en Semaine » quand toutes les mesures y ont une courbe, et devient « Une valeur par jour, en Semaine
   ou en Mois » sinon.
2. Nouveautés : `2026-11-14-0935-tendances-poids-periode.json` (pour tous).
3. **Suivi iPhone** : `upstream.json` laissé en v1040. Depuis, main n'a changé que le journal, l'outil des personas
   et `iphone/` : aucune build macOS lancée pour rien. Aucun correctif de `iphone/patches/` ne touche
   `TrendsViewer.jsx` : la correction arrive telle quelle au prochain suivi. Ligne ajoutée à `PARITE.md` § 5.

## Vérifs
- Trois tests ajoutés à `Trends.test.jsx` ; celui du poids vu rouge avant le code, vert après.
- `npm run test` : 3531 verts, 44 ignorés. `npm run build` : passe. `npm run lint` : aucune erreur.
  `npm run visual` : toutes les pages « ok » ; `/tendances` regardé en sombre.
- Parcours rejoué dans l'outil des personas (`--day=14 --equipment=phone-scale`) : Journal › Tendances › Jour ›
  « + » ([menu](captures/2026-11-14-0935-tendances-jour-poids-clair.png)) › « Poids »
  ([courbe en Mois](captures/2026-11-14-0935-tendances-poids-mois-clair.png)).

## Limites
- Pas de capture sombre du parcours : `--dark` de l'outil des personas a rendu une capture claire (noté en
  POLISH-SIM-81b). Le rendu de la courbe en Mois n'est pas modifié par ce run.
- Rejoué au 14e jour, pas au 1er jour de la persona (même cause : des pesées trop espacées pour la Semaine).
- Mois → Semaine avec « Poids » seul mène encore à « Choisissez une courbe » sans le poids : POLISH-SIM-81b.
- Pas de capture iPhone : le code embarqué n'a pas changé.
- Charte, PRODUIT, BACKLOG, PARITE et journal iPhone lus par sections, pas en entier (plus de 1 Mo).
- Numéros des builds TestFlight des codes v1034 à v1040 non relevés.

## Suite
- Suivi iPhone : `scripts/upstream.sh --latest` une fois cette PR sur main (v1043), puis captures de Tendances.
- POLISH-SIM-82, 90, 86, 81b ; POLISH-SIM-72-iOS-c ; fin de POLISH-SIM-69 ; FUSION-2 ; POLISH-SIM-71b ; CYCLE-3a-2.
- Maquettes de PROP-SIM-17 et PROP-SIM-18 à un run « idées ».
- Nuit prochaine, après l'Alpha de 23:45 : soumettre la dernière build TestFlight traitée, puis expirer les
  anciennes.

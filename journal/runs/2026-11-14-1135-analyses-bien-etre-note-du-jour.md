# Run 14/11 11:35 — Analyses › Bien-être : « Noté aujourd'hui » (POLISH-SIM-82b)

**Type** : code (mode polish)  ·  **Android** : v1044 sur main au début  ·
**TestFlight** : 1030.1031 chez les testeurs externes (depuis le 14/11 à 00:33) ; aucune soumission bêta avant la
nuit prochaine ; 844.344 intacte  ·  **Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main e9c7266 (#967, v1044) : Build & Release, Tests, Play — AAB et émulateur A56 verts.
- PR #968 ouverte par le run de 10:35 (suivi iPhone, code embarqué v1040 → v1044) : tous les checks verts sauf
  « Build iOS (simulateur) et captures », encore en cours au début du run. #51 (`cursor/*`) non touchée.

## Fait
1. **POLISH-SIM-82b** (`Recommendations.jsx`), vérifié puis corrigé : avant les premiers résultats, la carte
   d'Analyses › Bien-être gardait « Noter maintenant » quand le bien-être du jour était noté ; « Noté : 4/5 » ne
   s'affichait qu'après une saisie faite depuis Analyses, au-dessus de la carte, et disparaissait en quittant
   l'écran. La page lit maintenant les notes de bien-être du jour ; s'il y en a, la carte dit « Noté aujourd'hui :
   4/5 » (chaque note telle qu'elle a été donnée, dans l'ordre) et le bouton devient « Ajouter une note », en second
   plan : la même forme que pour la digestion (POLISH-SIM-82). L'ancienne ligne « Noté : 4/5 » au-dessus de la carte
   est retirée dans cet état (une information, une maison) ; elle reste quand la note fait arriver les résultats.
   Si la relecture des notes échoue, la note enregistrée à l'instant s'affiche quand même.
2. Nouveautés : `2026-11-14-1135-analyses-bien-etre-note-du-jour.json` (pour tous).
3. **Suivi iPhone** : voir « Fin du run ». Aucun correctif de `iphone/patches/` ne touche `Recommendations.jsx` ;
   ligne ajoutée à `PARITE.md` § 5.

## Vérifs
- Quatre tests ajoutés à `Recommendations.note.test.jsx` et un adapté ; trois vus rouges avant le code, verts après.
- `npm run test` : 3539 verts, 44 ignorés. `npm run build` : passe. `npm run lint` : aucune erreur.
  `npm run visual` : les 18 pages « ok » ; `/recommendations` regardé (avec résultats : inchangé).
- Parcours rejoué dans l'outil des personas (`--day=3 --equipment=phone`) : Analyses › Bien-être
  ([avant](captures/2026-11-14-1135-analyses-bien-etre-avant-clair.png)) › « Noter maintenant » › 4 › Enregistrer
  ([après](captures/2026-11-14-1135-analyses-bien-etre-note-clair.png)) : le compte passe de 2 à 3 jours notés, la
  carte dit « Noté aujourd'hui : 4/5 » ; elle le dit encore après un détour par le Journal.

## Limites
- Pas de capture sombre du parcours (`--dark` de l'outil des personas ne change pas le thème, POLISH-SIM-81b).
- Une lecture du visage sans note ne compte pas comme « noté aujourd'hui » : la carte demande une note, et seule une
  note y répond.
- Charte, PRODUIT, BACKLOG, PARITE et journal iPhone lus par sections, pas en entier (plus de 1 Mo).
- Numéros des builds TestFlight des codes v1034 à v1040 non relevés.

## Fin du run
- **PR #968 finie** : « Build iOS (simulateur) et captures » verte à 11:53 (51 min). Captures de `captures/pr-968`
  regardées : Journal › Tendances (courbe du bien-être en Semaine, inchangée) et Analyses › Digestion (compte à
  rebours, « Noter maintenant » sans note du jour, inchangé) ; aucune erreur JavaScript relevée par la build.
  Les captures ne jouent ni « Poids » en vue Jour ni une digestion notée le jour même : ces deux cas sont couverts
  par les tests du code partagé, verts avec les correctifs iPhone. Mergée à 11:55 (5ea019c) : l'iPhone embarque le
  code de la v1044.
FIN_SUITE

## Suite
- Suivi iPhone du code de ce run au prochain passage (`scripts/upstream.sh --latest`), captures d'Analyses › Bien-être.
- POLISH-SIM-90, 86, 81b ; POLISH-SIM-72-iOS-c ; fin de POLISH-SIM-69 ; FUSION-2 ; POLISH-SIM-71b ; CYCLE-3a-2.
- Maquettes de PROP-SIM-17 et PROP-SIM-18 à un run « idées ».
- Nuit prochaine, après l'Alpha de 23:45 : soumettre la dernière build TestFlight traitée, puis expirer les
  anciennes.

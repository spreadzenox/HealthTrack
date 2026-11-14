# Run 14/11 14:35 — Tendances : « Poids · en Mois » (POLISH-SIM-81b)

**Type** : code (mode polish)  ·  **Android** : v1049 sur main au début  ·
**TestFlight** : 1030.1031 chez les testeurs externes (depuis le 14/11 à 00:33) ; envoi du merge de #970 (code de
la v1047) réussi à 14:07 ; aucune soumission bêta avant la nuit prochaine ; 844.344 intacte  ·
**Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main d4cc7f3 (#972, v1049) : Build & Release, Tests et Play — AAB verts ; émulateur A56 et build iOS de main en
  cours au début du run. Aucune PR de la routine ouverte ; #51 (`cursor/*`) non touchée.

## Fait
1. **POLISH-SIM-81b** (`TrendsViewer.jsx`) : en Semaine, une mesure choisie qui n'a de courbe qu'en Mois (trois
   pesées espacées) reste dans les puces, grisée, avec « en Mois » (« Poids · en Mois ») ; la toucher rouvre le
   Mois avec sa courbe. Avant, elle disparaissait, et seule, laissait « Choisissez une courbe » sans elle. Le style
   est celui des mesures grisées du menu « + » de la vue Jour (`is-daily`) : même apparence, même sens (« pas de
   courbe ici, touchez pour aller là où elle est »).
2. **Outil des personas** (`persona-browse.mjs`) : `--dark` règle le thème de l'app (`healthtrack_theme`), qui est
   un réglage et non le schéma du téléphone ; les captures sombres du parcours sont enfin sombres.
3. Nouveautés : `2026-11-14-1435-tendances-mesure-en-mois.json` (pour tous).
4. **Suivi iPhone** : `scripts/upstream.sh --latest` sur la v1049 (#972) : les 52 correctifs s'appliquent sans
   retouche, 3903 tests verts sur le code embarqué. PR de suivi ouverte après le merge de ce correctif (voir « Fin
   du run »).

## Vérifs
- Deux tests ajoutés à `Trends.test.jsx` ; celui de la puce grisée vu rouge avant le code, vert après.
- `npm run test` : 3545 verts, 44 ignorés. `npm run build` : passe. `npm run lint` : aucune erreur.
- Parcours rejoué dans l'outil des personas (`--day=14 --equipment=phone-scale`, clair et `--dark`) : Journal ›
  Tendances › Jour › « + » › « Poids » (Mois) › Semaine
  ([clair](captures/2026-11-14-1435-tendances-poids-semaine-clair.png) ·
  [sombre](captures/2026-11-14-1435-tendances-poids-semaine-sombre.png)) : « Bien-être » garde sa courbe, « Poids ·
  en Mois » est à côté, grisée.
- `npm run visual` : voir « Fin du run ».

## Limites
- Le cas « Poids » seule mesure choisie (écran « Choisissez une courbe ») n'est vérifié que par les tests : dans le
  parcours rejoué, « Bien-être » est affiché avec lui.
- Pas de capture « avant » refaite : le défaut est décrit par le run de 09:35.
- Une première passe des tests du code iPhone, lancée par erreur avec `VITE_DISTRIBUTION=appstore`, a échoué (80
  tests) ; relancée comme la CI, sans cette variable : 3903 verts. C'est ce second résultat qui compte.
- Charte, PRODUIT, BACKLOG, PARITE et journal iPhone lus par sections, pas en entier (plus de 1 Mo) ;
  `iphone/journal/README.md` § 3 relu, § 4 et § 8 non relus à ce run ; `DESIGN.md` et `INFRA.md` non relus.

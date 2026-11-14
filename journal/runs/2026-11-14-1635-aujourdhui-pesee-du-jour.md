# Run 14/11 16:35 — Aujourd'hui : la pesée du jour (POLISH-SIM-84)

**Type** : code (mode polish)  ·  **Android** : v1052 sur main au début  ·
**TestFlight** : 1030.1031 chez les testeurs externes (depuis le 14/11 à 00:33), d'après le journal ; pas de relevé
refait à ce run ; aucune soumission bêta avant la nuit prochaine ; 844.344 intacte  ·  **Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main 536df25 (#975, v1052) : Build & Release, Tests, Play — AAB et émulateur A56 verts. Aucune PR de la routine
  ouverte. #51 (`cursor/*`) non touchée.

## Fait
1. **Suivi iPhone, PR #976** : `scripts/upstream.sh --latest`, `upstream.json` de v1050 à v1052 (accueil :
   « Continuer », « vos appareils »), 52 correctifs appliqués sans retouche. PR ouverte à 16:45 pour lancer la build
   macOS ; pas finie à ce run (voir « Fin du run »).
2. **POLISH-SIM-84** (`today.js`, `TodayBySource.jsx`) : relevé par le Sportif J1 (balance connectée, sans montre).
   - La dernière pesée du jour (`weight` ou `body_composition`, poids > 0) a sa ligne « Poids · à 07:30 · 72,4 kg »
     dans « Vos données du jour », couleur du corps (rose framboise), qui ouvre la courbe « Poids » de Tendances.
   - Source : « D'après votre balance. » (nouveau groupe `scale`) ; un poids saisi dans l'app (`app_weight`) va avec
     « vos notes ». Jamais la pesée d'hier.
3. Outil de captures : `npm run visual -- --routes=/ --weigh-in` ajoute une pesée ce matin.
4. Nouveautés : `2026-11-14-1635-aujourdhui-pesee-du-jour.json` (pour tous).

## Vérifs
- Tests écrits d'abord (trois rouges), verts après le code. `npm run test` : 3548 verts, 44 ignorés.
  `npm run build` : passe. `npm run lint` : aucune erreur.
- `npm run visual` : 18 pages « ok », aucune erreur JavaScript.
- Captures regardées : données de démo avec une pesée
  ([clair](captures/2026-11-14-1635-aujourdhui-pesee-clair.png) ·
  [sombre](captures/2026-11-14-1635-aujourdhui-pesee-sombre.png)) ; données vierges avec la seule pesée
  ([clair](captures/2026-11-14-1635-aujourdhui-pesee-seule-clair.png)).
- Correctifs iPhone : 15, 30 et 56 touchent `today.js` ou `TodayBySource.jsx` ; les 52 correctifs s'appliquent
  encore sur `app/src` de cette branche (`git apply` dans une copie). Les tests du code embarqué ne sont pas lancés.

## Limites
- Pas de capture « avant » refaite : le défaut est décrit par la simulation du 14/11 08:35.
- Le lien « Ajouter une montre » reste seul sous le bloc quand il n'y a pas de montre (visible sur la capture
  « balance seule ») : seconde moitié du constat, pas traitée (POLISH-SIM-84b).
- Un poids saisi à la main dans une autre app (Health Connect, app Santé) est dit « votre balance ».
- Pas de « d'habitude » pour le poids. Pas rejoué par une persona. Capture « balance seule » en clair seulement.
- Sur iPhone, rien de ce run n'est regardé : la build de #976 n'est pas finie, et ce correctif n'y est pas embarqué.
- Tests du code embarqué (v1052) non lancés en local à ce run : laissés aux checks de #976.
- Charte, PRODUIT, BACKLOG, PARITE lus par sections, pas en entier (plus de 1 Mo) ; `iphone/README.md` relu ;
  `iphone/journal/README.md` et `BACKLOG.md` iPhone, `DESIGN.md` et `INFRA.md` non relus à ce run.

## Fin du run
- Voir le tableau du résumé de la semaine pour l'état final des PR de ce run.

## Suite
- Finir #976 : build iOS verte, captures de l'accueil iPhone regardées (`captures/pr-976`), merge ; puis suivi iPhone
  du code de ce run.
- POLISH-SIM-84b, 87b, 86b, 85 ; POLISH-SIM-72-iOS-c ; fin de POLISH-SIM-69 ; FUSION-2 ; POLISH-SIM-71b ; CYCLE-3a-2.
- Maquettes de PROP-SIM-17 et PROP-SIM-18 à un run « idées » (20 h).
- Nuit prochaine, après l'Alpha de 23:45 : soumettre la dernière build TestFlight traitée, puis expirer les
  anciennes.

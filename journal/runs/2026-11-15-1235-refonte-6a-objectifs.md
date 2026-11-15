# Run 15/11 12:35 — Refonte « Compagnon », étape 6a : Objectifs, vue d'ensemble

**Type** : code (refonte « Compagnon », étape 6 du § 10 du brief, première partie)  ·  **Android** : main aca48cc
(#1009, v1085) au début, 0d79999 (#1011) à la fin  ·  **TestFlight** : dernier relevé connu, celui de 11:39 (run de
11:35) ; aucun relevé à ce run  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions vérifiée : conforme (710f9e8b…). Les quatre fichiers d'instructions, le brief de la
  refonte, les comptes rendus de 10:35 et 11:35, la préparation `ETAPE-6-OBJECTIFS.md` et le § 6 de
  `specs/comprendre.SPEC.md` lus en entier ; `iphone/README.md` jusqu'à « Site ».
- Main aca48cc : Tests, Build & Release (v740), Play — AAB et émulateur verts.
- Deux PR de la routine ouvertes au début, pour le même suivi iPhone de 5b : **#1011** (run de 11:35, build macOS en
  cours) et **#1010** (branche `claude/iphone-code-5b` du run de 10:35, poussée après coup, tous checks verts).
  #1011 a été **mergée à 12:36 par son propre run** (0d79999) ; je ne l'ai pas touchée. #51 non touchée.

## Fait
1. **Étape 6a sur Android** (découpage de la préparation, § 5) :
   - `services/objectivesOverview.js` (pur) : par objectif, les jours notés de tout l'historique, les 7 derniers
     jours tels que Tendances les calcule (`buildTrendSeries`, modèle à espace d'états ; digestion sans courbe
     estimée : jours notés seuls), le score (moyenne de la semaine, 3 points au moins), la tendance (3 derniers
     jours contre les 4 d'avant ; « stable » sous 0,3 point) ;
   - `config/firstResults.js` : `FIRST_SCORE_DAY = { wellbeing: 7, digestion: 14 }`, à côté de `FIRST_RESULTS_DAY`
     (14 et 28, inchangé) : c'est la **lecture A** de la préparation, les liens attendent le banc de 6d ;
   - `pages/Objectives.jsx` et `.css` : une carte par objectif (menthe, pêche), score « 3,0 / 5 », tendance, 7 barres
     sur l'échelle 1 à 5 (plus claires les jours estimés) ; avant le seuil, « Premier score dans N jours notés », une
     jauge de 7 ou 14 segments et « n sur N jours notés, pas forcément d'affilée » ; seuil passé mais moins de 3
     points dans la semaine : « Pas assez de notes cette semaine pour un score » ; la carte entière est un lien ;
   - routes : `/recommendations` = la vue d'ensemble ; `/recommendations/bien-etre` = l'ancien écran du bien-être ;
     `/recommendations/ventre` inchangée ; `AnalysesTabs` (et son test) retiré, « ← Objectifs » à la place ;
     `TabBar` n'envoie plus sur Digestion d'office (POLISH-SIM-33 retiré) ; les 3 étapes « Objectifs » de la visite
     guidée pointent sur `/recommendations/bien-etre` (mêmes textes, mêmes ancres) ;
   - outil de captures : route `/recommendations/bien-etre`, `--onboarding=gut` (objectif digestion) ;
   - note de Nouveautés `2026-11-15-1235-objectifs-cartes.json` (les deux magasins).
2. Journal : résumé, les deux `BACKLOG.md`, `PRODUIT.md`, `PARITE.md`.

## Vérifs
- `app/` : `npm run test` 3667 verts, 44 ignorés ; `npm run lint` sans erreur ; `npm run build` ; `npm run visual`
  complet (20 pages) sans erreur, lancé avant le dernier réglage des barres (échelle 1 à 5 au lieu de 0 à 5) ;
  ensuite seule `/recommendations` a été recapturée.
- Tests écrits **avant** le code pour le service (9 cas) ; **en même temps** que l'écran pour `Objectives.test.jsx`
  (5 cas) ; `TabBar.test.jsx` adapté. Trois rouges corrigés en route : la phrase « pas un diagnostic » (SLOP-1) et
  la feuille de style à déclarer dans `pageStyles.js`.
- Captures regardées (Android, 412 px) : vue d'ensemble avec les deux scores (données de démo et bilans du soir,
  clair), avec le confort digestif en attente (sombre), historique de 2 jours (deux jauges, clair) ; le détail du
  bien-être avec « ← Objectifs » (premier écran, avant le réglage des barres).
- iPhone : `git apply --check` du correctif 50 (`Recommendations.css`) passe ; aucun autre correctif ne touche les
  fichiers modifiés (recherche par nom de fichier dans `iphone/patches/`).

## Écarts et choix (dits au propriétaire dans le résumé)
- Lecture A : score et tendance à 7 et 14 jours notés ; pistes toujours à 14 et 28.
- « Des estimations, pas un diagnostic. » (SPEC § 6.1) non affichée : le test SLOP-1 la refuse hors onboarding,
  historique et conditions.
- « Le ventre demande plus de recul : 14 jours de notes du soir. » devient « La digestion demande plus de recul. ».
- « Premier score dans N jours **notés** » : la maquette dit « dans 7 jours » ; l'app compte des jours notés.
- Pas d'en-tête « Vos 7 derniers jours », pas de « Plutôt une bonne semaine. », pas d'étiquette « Premier score ».

## Limites
- Pas de Pilou, pas d'animation des barres ni de la jauge.
- Le score est une moyenne sans fourchette ; la tendance est un repère (pas un test statistique), et peut dire « en
  hausse » pour 0,3 point.
- Carte en attente : son lien mène au compte à rebours des pistes, qui annonce 14 ou 28 jours ; deux délais
  différents se lisent donc à un geste d'écart.
- La visite guidée ne montre pas la vue d'ensemble.
- Captures non regardées : écran sans aucune donnée (capturé), 320 px, grand texte, variante play, état « pas assez
  de notes cette semaine » (jamais capturé), `/recommendations/ventre` après le changement.
- iPhone : rien d'embarqué ni de construit à ce run ; les captures iPhone de #1011 n'ont pas été regardées par ce
  run (la PR a été mergée par le sien).
- Non relus en entier : la charte, `PRODUIT.md`, `DESIGN.md`, `INFRA.md`, les deux `BACKLOG.md`, `PARITE.md`,
  `iphone/journal/README.md` (§ 3, 4 et 8), `iphone/README.md` après « Site ».
- Pas de simulation de personas, pas de relevé TestFlight, pas de vérification de l'arrivée des builds à ce run.

## Suite
- REFONTE-6a-iOS, puis 6b (3 familles) ; 6d demande d'abord le banc à n = 7 et 14.
- #1010 : doublon de #1011 (voir « Fin de run »).

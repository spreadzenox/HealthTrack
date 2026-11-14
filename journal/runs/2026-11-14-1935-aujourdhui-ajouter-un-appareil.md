# Run 14/11 19:35 — Aujourd'hui : « Ajouter un appareil » (POLISH-SIM-84b, première partie)

**Type** : code (polish, une ligne de texte)  ·  **Android** : v1057 sur main au début (#976)  ·
**TestFlight** : 1030.1031 chez les testeurs externes d'après le relevé du run de 18:35 ; pas de relevé refait à ce
run ; l'envoi de 1054 est parti du merge de #976 (workflow « iOS — TestFlight » vert à 19:28) ; aucune soumission
bêta avant la nuit prochaine ; 844.344 intacte  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme (be4524e7…).
- Main 41b1eb0 (#976) au début : Tests, « iOS — TestFlight » et « iOS — modèles du visage » verts ; build iOS sur
  simulateur et émulateur A56 encore en cours.
- **Le run de 18:35 travaillait encore** : PR #981 ouverte depuis moins de 90 minutes (relais, journal, missions
  iPhone), remise à jour sur main à 19:25, émulateurs en cours. Règle 0 du déroulé : je n'ai touché ni au relais ni
  à ses fichiers, et j'ai pris une étape indépendante dans `app/`. Le journal partagé (résumé, BACKLOG) n'a été
  modifié qu'après son merge.
- PR #51 (`cursor/*`) : non touchée.

## Fait
1. **POLISH-SIM-84b, première partie** : sous « Vos données du jour », le lien « Ajouter une montre » devient
   « Ajouter un appareil » (`TodayBySource.jsx`). Il s'affiche toujours quand aucune montre n'envoie de données et
   mène toujours à Sources. Une personne qui a une balance ne lit plus un lien qui ne parle que de montre ; même
   mot que l'accueil depuis POLISH-SIM-87 (« vos appareils »).
2. Tests écrits d'abord (rouges, puis verts) : `TodayBySource.test.jsx` (lien renommé ; avec une pesée et sans
   montre, « Ajouter un appareil » présent et « Ajouter une montre » absent) et `Dashboard.test.jsx`.
3. Note de Nouveautés : `2026-11-14-1935-aujourdhui-ajouter-un-appareil.json`.
4. Non touché, exprès : la tuile « Ajouter une montre » de la carte du cœur (`BaselineCards.jsx`), dont le texte
   dit « Avec une montre… » : là, c'est bien une montre qu'il faut.

## Vérifs
- `app` : `npm run test`, 3548 verts, 44 ignorés ; `npm run lint`, aucune erreur ; `npm run build` passe ;
  `npm run visual`, 18 pages « ok », aucune erreur JavaScript.
- Captures regardées : Aujourd'hui avec `--empty --weigh-in --routes=/`, en clair et en sombre : ligne « Poids · à
  07:30 · 72,4 kg », « D'après votre balance. », lien « Ajouter un appareil » sous le bloc, rien de coupé.
- iPhone : le correctif 56 (`iphone/patches/`, qui touche `TodayBySource.jsx`) s'applique encore (`git apply
  --check`). Les 51 autres n'ont pas été rejoués.

## Limites
- **Pas encore sur iPhone** : `iphone/upstream.json` épingle v1054. Le lien change sur iPhone au prochain suivi
  (`upstream.sh --latest`, build macOS de près d'une heure) : à faire au run suivant. Sur iPhone, « Ajouter un
  appareil » mène à Sources comme sur Android ; je n'ai pas vérifié que la page Sources de l'iPhone propose bien
  autre chose qu'une montre à cet endroit.
- Reste de POLISH-SIM-84b, non fait : pas de « d'habitude » pour le poids ; un poids saisi à la main dans une autre
  app de santé est dit « votre balance ».
- Le lien n'a été vu en capture que dans le cas « balance seule, premier jour ». Le cas « téléphone seul » (pas,
  temps d'écran) n'est couvert que par le test de `Dashboard.test.jsx`.
- Charte, PRODUIT, BACKLOG lus par sections (plus de 1 Mo au total) ; `DESIGN.md`, `INFRA.md`, `iphone/README.md`,
  `iphone/journal/README.md`, `PARITE.md` et le BACKLOG iPhone non relus à ce run : je me suis appuyé sur les
  comptes rendus de 17:35 et de 18:35.
- `journal/PRODUIT.md` non modifié : aucun jalon ni aucune action du propriétaire ne change.
- Rien de neuf pour le propriétaire à ce run ; « prochaine action du propriétaire » laissée telle que le run de
  18:35 l'a écrite.

## Fin du run
Voir la PR de ce run ; complété ci-dessous après le merge.

## Suite
- Suivi iPhone de cette version (upstream v1054 → dernière), captures d'Aujourd'hui regardées.
- P44-2 (relevé des empreintes, sans attendre), puis P44-3.
- POLISH-SIM-84b (reste), 87b, 86b, 85 ; POLISH-SIM-72-iOS-c ; fin de POLISH-SIM-69 ; FUSION-2 ; POLISH-SIM-71b ;
  CYCLE-3a-2.
- Run « idées » de 20 h : maquettes de PROP-SIM-17 et PROP-SIM-18, simulation de personas.
- Nuit prochaine, après l'Alpha de 23:45 : soumettre la dernière build TestFlight traitée, puis expirer les anciennes.

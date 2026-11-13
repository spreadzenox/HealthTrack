# Run 13/11 22:35 — Routine unique : l'iPhone repris dans ce dépôt (FUSION-1)

**Type** : 📓 journal et suivi iPhone (aucun code produit Android)  ·  **Android** : v1030 sur main  ·
**TestFlight** : 1024.1028 envoyée le 13/11 à 21:34 (non confirmée « traitée ») ; 1024.523 (ancien dépôt) chez les
testeurs externes ; 844.344 intacte  ·  **Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme. Premier run qui lit le bloc « un seul
  dépôt, une seule routine » (#952).
- Main 174f589 : Tests, Build & Release, Play — AAB et émulateur A56 verts. Une « iOS — build simulateur » lancée à
  la main par l'orchestrateur sur main était en cours au début du run : non touchée. Aucune PR « [Auto] » ouverte
  (#51 `cursor/*` non touchée).

## Fait (les quatre points du « premier run »)
1. **Résumé unique** : tête de `journal/README.md` avec le tableau Android et iPhone, une seule prochaine action du
   propriétaire (mission PI1), les attentes iPhone ajoutées à « Toujours en attente de vous ». L'ancien résumé de
   `iphone/journal/README.md` porte un renvoi et n'est plus tenu.
2. **Ancien montage archivé** : `journal/POUR-IOS.md` → `journal/archives/ancien-montage/` ; `DEMANDES.md`,
   `POUR-ORCHESTRATEUR.md`, `PROMPT-ROUTINE.md` → `iphone/journal/archives/ancien-montage/`. Avant : les 21 demandes
   de `DEMANDES.md` dont l'état n'était pas clos sont reprises au `BACKLOG.md` (DEM-IOS-1 à 21, résumé et renvoi au
   texte complet) ; les messages ouverts de `POUR-ORCHESTRATEUR.md` (PI1, PI2, licence des poids du visage, essais
   sur l'iPhone 12) sont dans le résumé.
3. **Workflows** : les deux lignes d'en-tête « GÉNÉRÉ … ne pas modifier » retirées des dix `ios-*.yml` qui les
   portaient (`ios-site.yml` ne l'avait pas). Aucune autre ligne changée.
4. **Suivi d'Android** : `scripts/upstream.sh --latest` : v1024 → v1030 (174f589). Le correctif 58 (cycle lu dans
   Santé) ne s'appliquait plus : #948 (CYCLE-3a-1) a ajouté un import et le bloc « Règles » de Health Connect aux
   mêmes endroits de `HealthConnectConnector.js`. Refait sans changer son contenu (mêmes trois ajouts, contexte à
   jour ; le bloc iPhone vient après celui d'Android, dont le pont `HealthCycle` n'existe pas sur iPhone). Les 52
   correctifs s'appliquent.
- Charte : paragraphe « Routine unique, Android et iPhone » (lectures, commandes du suivi, garde-fous iOS).
  `PRODUIT.md` § 4, `BACKLOG.md` (FUSION-1 à 5), `iphone/journal/BACKLOG.md` et `PARITE.md` à jour.
- Non modifiés : `orchestration/`, `iphone/fusion/` (dont `bascule.json`).

## Vérifs
- Voir la PR : tests et lint du code embarqué avec les correctifs (Vitest dans `iphone/upstream/app`), tests de
  `app/`, puis « iOS — build simulateur » sur la PR (elle se déclenche : `iphone/upstream.json`, `patches/`,
  `ios-build.yml` changent). État exact au moment de finir le run : section « État à la fin du run » ci-dessous.

## Limites
- README, BACKLOG et PRODUIT lus par sections, pas en entier (plus de 900 ko avec le journal de l'iPhone) ;
  `iphone/journal/README.md` § 3, § 4 et § 8 survolés, pas relus ligne à ligne : à faire au prochain run avant tout
  geste vers Apple.
- Les DEM-IOS sont des résumés tronqués à 300 caractères : le texte complet est dans l'archive. Je n'ai pas vérifié
  une à une si certaines sont déjà réglées par des PR récentes.
- La « prochaine action » retenue (PI1) est mon choix entre les actions ouvertes des deux anciens résumés.
- Pas d'entrée de Nouveautés : rien de visible ne change.

## Suite
- Finir cette PR si la build iOS n'est pas verte à la fin du run : regarder les captures `captures/pr-<N>`
  (Sources, Journal : rien ne doit avoir changé), merger, vérifier que TestFlight part.
- Après l'envoi Alpha de 23:45 : `ios-store-beta-submit.yml` sur main dès qu'une build de ce dépôt est traitée par
  Apple, puis `ios-store-beta-expire.yml` (nettoyage) ; le dire en tête du résumé, ou dire qu'aucune build de ce
  dépôt n'est traitée.
- FUSION-2 (upstream à HEAD, filtres `app/**`), puis POLISH-SIM-68 (digestion notée absente d'Aujourd'hui), 69 à 71 ;
  CYCLE-3a-2.

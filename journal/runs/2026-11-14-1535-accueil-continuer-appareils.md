# Run 14/11 15:35 — Accueil : « Continuer » et « vos appareils » (POLISH-SIM-87)

**Type** : code (mode polish)  ·  **Android** : v1050 sur main au début  ·
**TestFlight** : 1030.1031 chez les testeurs externes (depuis le 14/11 à 00:33) ; aucune soumission bêta avant la
nuit prochaine ; 844.344 intacte  ·  **Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main 0d8e670 (#973, v1050) : Build & Release, Tests, Play — AAB et émulateur A56 verts.
- PR de suivi iPhone #974 (code embarqué v1047 → v1050) ouverte au run précédent : tous ses checks verts sauf
  « Build iOS (simulateur) et captures », en cours depuis 15:10. #51 (`cursor/*`) non touchée.

## Fait
1. **POLISH-SIM-87** (`Onboarding.jsx`) : relevé par deux personas (08/11 et 14/11, « sans quoi ? »).
   - Écran 04/06 sans données de santé (« Votre téléphone suffit pour commencer ») : le bouton « Continuer sans »
     devient « Continuer ». Le titre dit déjà qu'on continue sans, et « Connecter Health Connect » reste au-dessus.
   - Première carte : « Vos repas, votre sommeil, vos appareils et votre ressenti, au même endroit. » (« votre
     montre » avant) ; la pastille « Montre » de l'illustration devient « Appareils », vue sur la première capture,
     où elle contredisait la phrase.
2. Nouveautés : `2026-11-14-1535-accueil-continuer-appareils.json` (pour tous).
3. **PR de suivi iPhone #974** : voir « Fin du run ».

## Vérifs
- Tests de l'accueil modifiés d'abord (deux rouges : la phrase, le bouton), verts après le code ; un test fixe les
  quatre pastilles de l'illustration.
- `npm run test` : 3545 verts, 44 ignorés. `npm run build` : passe. `npm run lint` : aucune erreur.
- `npm run visual` : 18 pages « ok », aucune erreur JavaScript.
- Captures regardées, variante play, données vierges : première carte
  ([clair](captures/2026-11-14-1535-accueil-bienvenue-clair.png) ·
  [sombre](captures/2026-11-14-1535-accueil-bienvenue-sombre.png)) et écran 04/06 sans Health Connect
  ([clair](captures/2026-11-14-1535-accueil-sans-sante-clair.png) ·
  [sombre](captures/2026-11-14-1535-accueil-sans-sante-sombre.png)). Les quatre pastilles tiennent sur une ligne à
  412 px ; sur un écran plus étroit elles passent à la ligne (`flex-wrap`), non capturé.
- Correctifs iPhone de l'accueil (23, 45, 52, 55) : aucun ne contient les lignes modifiées (recherche de texte) ;
  l'application réelle des correctifs se vérifie au prochain suivi.

## Limites
- L'écran 04/06 ne dit toujours rien d'une balance à qui n'a pas Health Connect (constat du Sportif J1) : je n'ai
  pas vérifié dans le code si une balance peut arriver sans Health Connect dans la variante play (le BACKLOG dit que la carte Withings en est absente) ; noté POLISH-SIM-87b.
- « vos appareils » est le mot proposé par le compte rendu de la persona ; pas rejoué par une persona.
- Pas de capture « avant » refaite : le défaut est décrit par les simulations du 08/11 20:35 et du 14/11 08:35.
- Sur iPhone, l'écran équivalent (« Sans Santé… ») n'est pas regardé à ce run : le correctif n'y est pas encore
  embarqué.
- Charte, PRODUIT, BACKLOG, PARITE et journal iPhone lus par sections, pas en entier (plus de 1 Mo) ;
  `iphone/README.md` relu ; `iphone/journal/README.md`, `DESIGN.md` et `INFRA.md` non relus à ce run.

## Fin du run
- **PR de suivi iPhone #974 finie et mergée** à 15:53 (52b8f5d) : 15 checks verts, dont « Build iOS (simulateur) et
  captures » (fini à 15:52) ; capture iPhone de Tendances regardée (`captures/pr-974`, build 1050.1052) : la vue par
  défaut s'affiche normalement. La fiche d'un jour et « Poids · en Mois » ne sont pas dans les captures
  automatiques : non vus sur iPhone. `upstream.json` en v1050 ; `PARITE.md` § 5 mis à jour.
- **PR #975** (ce correctif) : remise à jour sur main après le merge de #974 ; merge une fois ses checks verts
  (état final dans le tableau du résumé de la semaine).

## Suite
- Suivi iPhone du code de ce run (`scripts/upstream.sh --latest`), captures de l'accueil iPhone à regarder.
- POLISH-SIM-87b, 86b, 84, 85 ; POLISH-SIM-72-iOS-c ; fin de POLISH-SIM-69 ; FUSION-2 ; POLISH-SIM-71b ; CYCLE-3a-2.
- Maquettes de PROP-SIM-17 et PROP-SIM-18 à un run « idées ».
- Nuit prochaine, après l'Alpha de 23:45 : soumettre la dernière build TestFlight traitée, puis expirer les
  anciennes.

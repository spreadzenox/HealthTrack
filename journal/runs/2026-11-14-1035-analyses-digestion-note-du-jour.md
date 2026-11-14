# Run 14/11 10:35 — Analyses › Digestion : « Noté aujourd'hui » (POLISH-SIM-82)

**Type** : code (mode polish)  ·  **Android** : v1043 sur main au début, v1044 après ce run  ·
**TestFlight** : 1030.1031 chez les testeurs externes (depuis le 14/11 à 00:33) ; dernier « iOS — TestFlight » vert
sur a0fe1d1 (code de la v1040) ; aucune soumission bêta avant la nuit prochaine ; 844.344 intacte  ·
**Parité** : 70 % (33/47)

## Contexte
- Empreinte des instructions (`orchestration/routine/`) vérifiée : conforme.
- Main 5150c01 (#966, v1043) : Build & Release, Tests, Play — AAB et émulateur A56 verts. Dernier commit qui touche
  `iphone/` (a0fe1d1) : build simulateur, TestFlight et modèles du visage verts.
- Aucune PR de la routine ouverte. #51 (`cursor/*`) non touchée.

## Fait
1. **POLISH-SIM-82** (`Recommendations.jsx`) : avant les premiers résultats, la carte d'Analyses › Digestion gardait
   « Noter maintenant » même quand la digestion du jour était notée. La page lit maintenant les notes digestives
   (les mêmes que le bloc d'Aujourd'hui, `readGutNotes`) ; s'il y en a une aujourd'hui, note au fil de l'eau ou
   bilan du soir, la carte dit « Noté aujourd'hui : Gêne » (chaque niveau une fois, dans l'ordre de l'échelle) et
   le bouton devient « Ajouter une note », en second plan. Sans note du jour, ou si la lecture échoue, rien ne
   change.
2. Nouveautés : `2026-11-14-1035-analyses-digestion-note-du-jour.json` (pour tous).
3. **Suivi iPhone** : aucun correctif de `iphone/patches/` ne touche `Recommendations.jsx`. Ligne ajoutée à
   `PARITE.md` § 5. Le suivi du code embarqué (v1040 → v1044) part dans une PR à part après le merge de celle-ci,
   pour ne pas retenir ce correctif une heure derrière une build macOS (voir « Fin du run »).

## Vérifs
- Quatre tests ajoutés à `Recommendations.note.test.jsx` ; deux vus rouges avant le code, verts après.
- `npm run test` : 3535 verts, 44 ignorés. `npm run build` : passe. `npm run lint` : aucune erreur.
  `npm run visual` : les 18 pages « ok » ; `/recommendations/ventre` regardé (sans note du jour : inchangé).
- Parcours rejoué dans l'outil des personas (`--day=14 --equipment=watch --goals=gut`) : Analyses › Digestion
  ([avant](captures/2026-11-14-1035-analyses-digestion-avant-clair.png)) › « Noter maintenant » › « Gêne » ›
  retour dans Analyses › Digestion ([après](captures/2026-11-14-1035-analyses-digestion-note-clair.png)) : le
  compte passe de 13 à 14 jours notés, la carte dit « Noté aujourd'hui : Gêne ».

## Limites
- Pas de capture sombre du parcours (`--dark` de l'outil des personas ne change pas le thème, POLISH-SIM-81b) ; la
  ligne reprend la couleur de texte de la carte, la même dans les deux thèmes que le titre.
- Bien-être : la même question se pose pour la note de bien-être du jour, pas vérifiée (POLISH-SIM-82b).
- Charte, PRODUIT, BACKLOG, PARITE et journal iPhone lus par sections, pas en entier (plus de 1 Mo).
- Numéros des builds TestFlight des codes v1034 à v1040 non relevés.

## Fin du run
- #967 mergée à 10:55 (e9c7266, v1044) : checks de la PR verts (Vitest, Build APK, cinq émulateurs, relais, montre,
  perf). Sur main : Build & Release, Tests et Play — AAB verts ; release v716, APK de 33,0 Mo.
  « Test — émulateur A56 » de main encore en cours à la fin du run.
- **Suivi iPhone, PR à part** : `upstream.json` passe de v1040 (b9db9de) à v1044 (e9c7266) ; les 52 correctifs
  s'appliquent sans retouche (`scripts/upstream.sh`, lancé ici). Les tests de l'iPhone et la build simulateur
  tournent sur GitHub (macOS, près d'une heure) : la PR reste ouverte, le run suivant la finit après avoir regardé
  les captures de Tendances (« Poids », POLISH-SIM-81) et d'Analyses › Digestion (`captures/pr-<N>`).
- Run plus long que prévu (environ 1 h 15, dont 20 min d'attente des émulateurs).

## Suite
- Finir la PR de suivi iPhone (v1044) : build simulateur verte, captures de Tendances et d'Analyses regardées.
- POLISH-SIM-90, 86, 81b, 82b ; POLISH-SIM-72-iOS-c ; fin de POLISH-SIM-69 ; FUSION-2 ; POLISH-SIM-71b ; CYCLE-3a-2.
- Maquettes de PROP-SIM-17 et PROP-SIM-18 à un run « idées ».
- Nuit prochaine, après l'Alpha de 23:45 : soumettre la dernière build TestFlight traitée, puis expirer les
  anciennes.

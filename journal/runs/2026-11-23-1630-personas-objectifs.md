# Run 23/11 16:30 — PERSONAS-OUTIL-1 ajouté à #1220, PR prête pour un seul build iPhone

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 74cc687 (#1219) ·
**TestFlight** : 1268.1268 validée pour « Testeurs Halcya » (relevé de 07:33 UTC), 1244.1244 attachée à la version 893 ·
**Parité** : 70 % (33/47), 2 correctifs iPhone restent (01, 27)

## État de départ
- main vert sur 74cc687 (#1219) : Tests, Build & Release (release **v889**, APK 35 673 169 octets), émulateur,
  Play — AAB.
- PR de la routine ouverte : **#1220** (run de 15:30, POLISH-SIM-150 en partie), en brouillon, en attente d'un second
  petit correctif pour partager un seul build iPhone. #51 (`cursor/*`) pas touchée.

## PERSONAS-OUTIL-1 (ajouté à la branche de #1220)
- Constat : pour un jour > 1 sans `--legacy`, l'outil écrivait les objectifs bruts de `--goals` sans `goalsVersion` ;
  la migration de l'étape 5a convertissait `all` (Tout mesurer) en bien-être seul : pas de « Confort digestif ».
- Fait : `freshOnboarding` (`app/scripts/persona/personaData.mjs`) écrit l'accueil de la refonte : `wellbeing`, plus
  `gut` pour `gut`, `all` ou `cycle`, `goalsVersion: 2`, que `migrateGoals` laisse tel quel. Les entrées de la persona
  reçoivent aussi `gut` (Tout mesurer a ses notes du ventre). `--legacy` inchangé.
- Test d'abord dans l'intention, écrit avec la fonction (`personaData.test.mjs` : 5 cas d'objectifs, passage par
  `migrateGoals`, notes du ventre de Tout mesurer). Essai réel : `npm run persona -- --day=14 --equipment=full
  --goals=all` → l'Accueil montre la bulle « Digestion ».
- `journal/simulations/README.md` : correspondance des personas mise à jour (Endométriose et Sportif retirées).
- Écarté : « Cœur » listé à l'étape 3 de l'accueil (POLISH-SIM-105 l'a gardé « sûr » exprès : presque toutes les
  montres et bracelets le mesurent).

## Vérifications
- `npm run test` complet : 408 fichiers verts (3 ignorés), 4 477 tests ; eslint de `scripts/persona` : 0 erreur.
- Outillage seulement : aucun écran de l'app ne change ; pas de note de Nouveautés pour ce correctif.

## Suite
1. Run suivant : build iPhone de #1220, capture d'Agir (« Faire au moins 8 700 pas ») des deux côtés si elle existe,
   merge.
2. POLISH-SIM-150 (reste) : banc avant de faire partir la cible de l'habitude de l'Accueil.
3. FUSION-3 : 27 attend une décision (FUSION-4), puis 01 en dernier.
4. Ce soir : build iPhone et TestFlight à 21:20, Alpha à 23:45.

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

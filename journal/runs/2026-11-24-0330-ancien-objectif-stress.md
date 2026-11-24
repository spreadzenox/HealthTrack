# Run 24/11 03:30 — ancien objectif « stress » (POLISH-SIM-155)

**Type** : 🔧 · **Contrôle d'intégrité** : empreinte conforme (dd430fbd…) · **Android** : main 3ee0547 (#1228),
tous les workflows verts · **TestFlight** : 1268.1268 validée pour « Testeurs Halcya » (relevé du 23/11 07:33 UTC),
1244.1244 attachée à la version 893 ; build du soir et `ios-testflight.yml` du 23/11 pas encore partis à 02:30 UTC
(cron en retard ; la veille ils sont partis vers 00:55 UTC) · **Parité** : 70 % (33/47), 2 correctifs iPhone restent
(01, 27)

## État de départ
- main vert sur 3ee0547 (#1228, mergée par le run de 02:30) : Tests, émulateur, Build & Release, Play — AAB.
- Aucune PR de la routine ouverte. #51 (`cursor/*`) pas touchée.

## POLISH-SIM-155 — l'ancien objectif « stress »
- Constat du passage des personas du 23/11 08:30 (« Stressé et pressé », J14 après mise à jour) : son objectif
  « Mon stress et mon sommeil » devient « Bien-être » sans un mot.
- La liste « Vos anciens objectifs » de Réglages › Vos objectifs (POLISH-SIM-100) disait déjà où sont passés Sport
  et Mon cycle. Elle a maintenant une ligne « Mon stress et mon sommeil : Bien-être le remplace, le sommeil en fait
  partie. » (Sommeil est une famille d'Objectifs › Votre bien-être). Elle vaut aussi pour l'ancien `goal: 'energy'`
  du tout premier accueil (`legacyGoals` → `stress`).
- Pas de ligne dans la carte « Nouveau » : elle titre une seule note pour tout le monde (UPG-2) ; une note pour une
  seule cohorte de testeurs y serait du bruit.
- Tests d'abord (`Settings.test.jsx`) : 1 nouveau (stress après migration, puis ancien `energy`), rouge puis vert ;
  2 mis à jour (« stress + sport » donne 2 lignes ; le cas « aucune ligne » passe à `care` et `all`).
- Note de Nouveautés `2026-11-24-0330-ancien-objectif-stress.json` (correctif).

## iPhone
- Code partagé seulement, aucun correctif de `iphone/patches/` ne touche `Settings.jsx`. Un build iPhone sur la PR
  quand elle passe « prête » ; merge au run suivant après lecture des captures.

## Suite
1. Run suivant : merger la PR si les checks sont verts et les captures relues.
2. Build du soir traitée par Apple → `ios-store-beta-submit.yml`, puis `ios-store-beta-expire.yml` ; noter l'Alpha.
3. À étudier encore : « Cœur » à l'étape 3 de l'accueil, mots FODMAP sans aliment, poids à la main (proposition au
   run « idées » de 08:00).

## Pour le propriétaire
Rien de nouveau : recruter des testeurs (4 sur 12), puis PI2, puis P51.

# Run 15/11 10:35 — Refonte « Compagnon », étape 5b : l'accueil en 4 temps

**Type** : code (refonte « Compagnon », étape 5 du § 10 du brief, seconde partie)  ·  **Android** : main 8b547ca
(#1007, v1083) au début  ·  **TestFlight** : voir « Fin de run »  ·  **Parité** : 70 % (33/47), inchangée

## Contexte
- Empreinte des instructions vérifiée : conforme (710f9e8b…). Les quatre fichiers d'instructions, le brief de la
  refonte, `iphone/README.md`, la préparation `ETAPE-5-ONBOARDING.md` et le § 4 de `specs/comprendre.SPEC.md` lus
  en entier.
- Main 8b547ca : Build & Release, Tests, Play — AAB et émulateur verts.
- #1008 (suivi iPhone de 5a, ouverte à 10:19 par le run de 09:35) : 14 checks verts, build iOS sur simulateur
  encore à l'étape des captures pendant ce run. #51 non touchée.

## Fait
1. **Étape 5b sur Android, #1009** (`pages/Onboarding.jsx`, `services/onboardingFlow.js`, `settings/onboarding.js`) :
   - écrans : `intro`, puis les 4 temps `goal`, `watch`, `auto`, `notes`, puis `face` (si le téléphone lit le
     visage) et `premium` (variante play) ; barre à 4 segments et « 1 sur 4 » seulement pendant les 4 temps ;
   - ouverture : une carte (bienvenue, ce qui quitte le téléphone, 18 ans) ; la carte des onglets est retirée
     (REFONTE-5c) ;
   - temps 1 : Bien-être verrouillé « Toujours suivi », Confort digestif « Ajouté », « Inclus : le bien-être + 1
     objectif. » ; `chooseObjectives` écrit la forme de 5a (`goalsVersion` 2) et garde les choix d'un ancien accueil
     commencé dans `goalsBefore` ;
   - temps 2 : « Oui » ouvre la carte Health Connect (ou Santé) et la carte Huawei si détectée ; « Non, pas pour
     l'instant » ne demande aucune permission et ne lance aucun import (testé) ; météo et temps d'écran gardent
     leur interrupteur sous « Sur ce téléphone » ;
   - temps 3 : 9 tuiles aux couleurs des thèmes avec une montre, 2 sans ; avec l'accès donné, l'import, les
     appareils trouvés, les mesures par thème et les 30 jours s'affichent dessous (ancien `FoundStep`) ;
   - temps 4 : repas, bien-être, digestion (avec l'objectif), 4 habitudes à cocher (méditation proposée), une
     habitude libre, résumé « N choses par jour · environ 1 minute », phrase du brief ; écrit `setHabits` ;
   - retirés : la première note (`FirstStep`, `saveFirst`), `FEELINGS`, `BELLY`, l'écran « Votre téléphone
     suffit », le CSS mort ; `FLOW_VERSION` 3 (un accueil commencé repart du début, réponses gardées).
   - Outil de captures : `--onboarding=goal`, `goal-gut`, `watch`, `watch-yes`, `watch-huawei`, `watch-no`, `auto`,
     `auto-none`, `auto-found`, `notes`, `notes-gut`, `face`, `premium`.
   - Note de Nouveautés `2026-11-15-1035-accueil-quatre-temps.json` (les deux magasins).
2. Journal : résumé, `BACKLOG.md` (5a-2, 5b, 5c cochées ; 5b-iOS, 5b-2, 5b-3, 5b-4 ajoutées), `PRODUIT.md`.

## Vérifs
- `app/` : `npm run test` 3657 verts, 44 ignorés ; `npm run lint` sans erreur ; `npm run build` ; `npm run visual`
  complet (19 pages) sans erreur.
- Tests : `Onboarding.test.jsx` réécrit (parcours, 4 temps, habitudes), `Onboarding.sources.test.jsx` et
  `Onboarding.face.test.jsx` adaptés. **Écrits après le code**, pas avant.
- Captures regardées (Android, 412 px) : ouverture, temps 1 (digestion cochée), temps 2 « Oui », temps 3 avec
  montre, sans montre et avec import (données de démo), temps 4 avec digestion, en clair ; temps 2 « Non » et
  temps 4 en sombre.
- iPhone : correctifs rejoués sur le nouveau `Onboarding.jsx` : 45 et 52 s'appliquent, 23 et 55 non.

## Écarts et choix (dits au propriétaire dans le résumé)
- « ventre » de la SPEC remplacé par « digestion » (sous-titre du temps 1, ligne du temps 4) : règle AUJ-7.
- Temps 4 : la SPEC dit « Déjà coché : décochez ce qui ne vous parle pas. » ; seules les habitudes se décochent,
  le sous-titre dit donc « Décochez les habitudes qui ne vous parlent pas. ».
- Temps 3 sans montre : 2 tuiles et une ligne « Avec une montre ou un bracelet : … », au lieu des 9 tuiles.
- Fin de l'accueil : l'Accueil et la visite guidée, pas Ma journée (la préparation proposait Ma journée).
- La maquette nomme « Garmin » et « Withings » au temps 2 : l'app garde la carte Health Connect ou Santé.
- Météo et temps d'écran au temps 2, avec leur interrupteur (ils demandent une permission).

## Limites
- Pas de Pilou, pas de bulle, pas de transition animée (étape 12).
- Sans montre, aucune saisie d'activité à la main (REFONTE-5b-4).
- Temps 3 long quand l'accès est donné : les mesures par thème répètent en partie les tuiles (REFONTE-5b-2).
- Sans montre et sur un téléphone qui ne donne pas le temps d'écran, la tuile « Temps d'écran » s'affiche quand
  même au temps 3.
- Captures non faites : 320 px, grand texte, variante play (visage, Gold), carte Huawei ; temps 1 et temps 3 en
  sombre capturés mais non regardés (REFONTE-5b-3).
- Qui a fini l'accueil ne voit rien de cette étape ; ses habitudes se choisissent dans Réglages.
- Non relus en entier : la charte, `PRODUIT.md`, `DESIGN.md`, `INFRA.md`, les deux `BACKLOG.md`, `PARITE.md`,
  `iphone/journal/README.md` (§ 3, 4 et 8), les SPEC hors § 4 de `comprendre`.
- Pas de simulation de personas à ce run.

## Suite
- REFONTE-5b-iOS : embarquer 5b, refaire les correctifs 23 et 55, regarder les 4 temps sur simulateur.
- REFONTE-6 (Objectifs, seuils 7 et 14 jours).

## Fin de run (vers 11:15)
- **#1008 mergée** (5486462, vers 11:12) : 15 checks verts, build iOS sur simulateur verte après 51 minutes ;
  capture de Paramètres regardée (iPhone 17 Pro, clair) : « Vos objectifs », Bien-être « Toujours suivi », Confort
  digestif, puis « Vos habitudes ». Sombre et grand texte non regardés.
- **TestFlight**, relevé de 10:48 : « en test 1072.1073 ; refusées aucune ; en attente aucune ». Rien à soumettre
  ni à expirer. Arrivée des builds des codes v1075, v1078, v1080 et v1083 : non vérifiée (aucune n'apparaît dans le
  relevé, qui ne liste que le groupe externe).
- **#1009** : 12 checks verts sur 4a542cc ; remise à jour sur main après #1008, journal complété ; merge après les
  checks du nouveau commit (voir le résumé pour l'état final).
- **Suivi iPhone de 5b** : branche `claude/iphone-code-5b` préparée (correctifs 23 et 55 refaits, états de capture,
  test de la variante appstore) ; ni testée ni construite à l'heure où ces lignes sont écrites.
- Ce run a dépassé les 50 minutes visées (attente de la build macOS de #1008).
- **#1009 mergée** (aca48cc, vers 11:27) : 12 checks verts sur f337b9d, branche à jour sur main. Captures iPhone
  des 4 temps : pas regardées avant ce merge (le code partagé n'entre dans l'app iPhone qu'avec la PR de suivi).
- **Suivi iPhone de 5b en PR** (code v1085, aca48cc) : 51 correctifs appliqués, 23 et 55 refaits ; avec les
  correctifs, 4015 tests verts et lint sans erreur (lancés sur le même code avant le merge). Build macOS à finir par
  le run suivant ; captures `vierge-onboarding-*` à regarder.
- Sur main (aca48cc) : **release v740, APK de 34,6 Mo** ; « Play — AAB » vert (**v1085 en test interne**) ; Tests
  verts ; émulateur encore en cours à 11:36. « iOS — TestFlight » vert sur le merge de #1008 (code v1083 parti vers
  TestFlight, arrivée non vérifiée) ; build iOS sur simulateur de ce merge encore en cours.

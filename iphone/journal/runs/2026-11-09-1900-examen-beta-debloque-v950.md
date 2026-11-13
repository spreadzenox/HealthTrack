# 2026-11-09 19:00 UTC — Examen bêta débloqué : 918.396 soumise ; suivi d'Android v950

**Étape** : examen bêta (décision du 09/11, (a)) + suivi d'Android  ·  **PR** : v950  ·  **Android suivi** : v950
(`2aa4385`)  ·  **iOS** : 946 sur TestFlight (946.422) ; **918.396 en examen bêta** ; version 844 dans App Store
Connect, build 844.344 attachée  ·  **Parité** : 67 % (30/45)

## Messages du propriétaire depuis le run précédent
- `POUR-IOS.md` relu : rien de neuf depuis 11:05. Pas de réponse écrite au message de 12:15.

## Examen bêta
- Relevé de 19:00 UTC : « Hors du groupe, en examen bêta : aucune » (la 896.376 n'y est plus).
- Essai à blanc du nettoyage (run 42679356462, lecture seule) : 150 builds non expirées, **la 896.376 n'en fait plus
  partie** (expirée dans App Store Connect, pas par la routine : aucun lancement réel de `store-beta-expire.yml`) ;
  gardées 844.344, 839.337, 918.396 (« dans le groupe externe, à soumettre »), 946.422 (la plus récente) ; 146
  seraient expirées.
- **Soumission de la 918.396** (décision du 09/11 (a) : « vérifie qu'elle n'est plus en examen, puis soumets la
  918.396 ») : `store-beta-submit.yml`, `build=918.396`, run 42679499099 : « Build 918.396 (traitée par Apple). »,
  « À tester » (fr-FR) déjà là, déjà dans le groupe externe, « Soumise à l'examen bêta d'Apple. », « La version de
  l'App Store n'a pas été touchée. »
- Relevé de 19:03 UTC : 918.396 « WAITING_FOR_REVIEW » (TestFlight externe WAITING_FOR_BETA_REVIEW) ; 839.337 en test ;
  hors du groupe : aucune.
- Nettoyage (≈146 anciennes builds) : non lancé, l'exécution réelle reste refusée par les permissions de la session
  (12:15) ; geste demandé au propriétaire (`POUR-ORCHESTRATEUR.md` 20:05).
- Cette nuit : Android ne fait pas d'Alpha (gel prolongé jusqu'au 10/11 22:00, examen de 100918 chez Google) ; la
  918.396 est en examen depuis moins de 24 h → attendre la décision d'Apple (règle du 09/11).

## Fin du run précédent
- #408 (v945, v946) : trois vérifications vertes ; captures : Agir « Dormir au moins 7 h 53 », Accueil sombre ;
  mergée (`e206f97`) ; TestFlight 946.422 ; fiche envoyée (« Version 844 gardée (build 844.344 attachée, choisie par
  le propriétaire) ; builds en 893 »).

## Android depuis le run précédent (v946 → v950)
- #870 (journal) : gel des envois Alpha prolongé jusqu'au 10/11 22:00 (Paris).
- #872 (POLISH-AGIR-TITRES) : Agir, chaque essai a pour titre sa consigne et dit si aujourd'hui est un jour avec ou
  sans ; « Réintroduction : les fructanes ». Code partagé, note pour tous. 47 correctifs sans retouche.

## Vérifications
- `scripts/upstream.sh` (47 correctifs) ; Vitest, build appstore, ESLint, tests des scripts, fiche.

## Suite
- Merge après les vérifications et les captures (Agir) ; TestFlight ; relevé de l'examen de la 918.396 à chaque run ;
  nettoyage dès « nettoyage fait » ou « permission donnée ».

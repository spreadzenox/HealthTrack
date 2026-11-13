# 2026-10-29 19:00 UTC — v591 mergée (#68) ; bouton de l'onboarding ramené à sa hauteur ; Android v592

**Étape** : I2 (repli visuel), suivi d'Android  ·  **PR** : #68 (mergée), #69  ·  **Android suivi** : v592  ·  **iOS** : 591 sur `main`, 592 en PR  ·  **Parité** : 49 % (23/47)

## Messages du propriétaire depuis le run précédent
- Aucun. A1 reste en cours. (Déclenchement reçu à 19:00, prévu à 18:59.)

## Ce qui a été fait
- **Merge de #68** : CI verte sur `cfe77aa` (40 min) ; 110 captures, 0 erreur JavaScript ; import, export, rapport
  +2 et notifications rangées sur les deux iPhone. Plus aucun bandeau « Nouveau : … et 13 autres changements » sur
  les captures (Sources, Accueil regardés) ; `vide-journal` montre les trois tuiles de v591 (photographier un repas,
  noter votre ventre, ajouter une source). Branche contenant `main` (`6ebe1c9`), squash-merge → `56175df`.
- **#69 — bouton de l'onboarding** : sur l'écran « Vos données de l'app Santé », « Autoriser l'app Santé » est un
  grand ovale qui occupe toute la hauteur libre (capture `vierge-onboarding-sante` de #68) : `.btn { flex: 1 }`
  (`App.css`) dans la colonne flexible `.onb-body`. Demande à Android notée depuis le 29/10 matin, « à corriger
  côté iOS avant TestFlight si elle n'est pas reprise » ; c'est le premier parcours qu'un utilisateur, et l'examen
  d'Apple, verront : correctif 29 (`Onboarding.css`, `flex: 0 0 auto` sur `.onb-action`), sans effet sur l'écran du
  visage (`.onb-face-actions` est une grille). Test d'abord (règle CSS lue, rouge puis vert) ; mesuré dans Chromium
  avec la feuille de style construite : 52 px de haut (445 px avant d'après la demande). `DEMANDES.md` : à retirer
  quand Android l'aura repris.
- **Android v592** (#508) : carte « Vos pistes arrivent », seul le nombre de jours en police des chiffres ; code
  partagé, aucun correctif touché, note vraie sur iPhone. 29 correctifs s'appliquent directement ; suite d'Android :
  2863 passés ; build appstore faite.

## Suite
- CI de #69 : `vierge-onboarding-sante` avec un bouton de hauteur normale sur les deux iPhone ; puis merger.

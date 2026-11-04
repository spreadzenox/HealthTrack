# Run du 04/11/2026 02:35 (Paris, CET) — Bouton de bienvenue (IOS-ONB-ACTION)

**Type** : 🎨 code (onboarding) + merge

## Constat au démarrage
- Main à `2ed0d1b`, Tests, Build & Release, Play — AAB, émulateur verts. PR #670 (I86, pistes du ventre) ouverte par le
  run de 01:35, tous checks verts, à jour sur main, merge refusé à cette session-là.
- Priorités du prompt : compte rendu du 02/11 et fin iPhone faits ; P37, P42, P44 attendent le propriétaire.

## Fait
- **PR #670 mergée** (squash, `3beba13`), sans changement : à jour sur origin/main, 9 checks verts sur `e79593f`.
- Demandes iOS relues (`DEMANDES.md` de HealthTrack-iOS, lecture seule). Reprises :
  - **IOS-ONB-ACTION** (29/10) : `.btn { flex: 1 }` dans la colonne flexible `.onb-body` étirait « Autoriser Health
    Connect » sur toute la hauteur libre (mesuré : **646 px**). `flex: 0 0 auto` sur `.onb-action` → 52 px. Test CSS
    dans `buttonShape.test.js` (rouge avant, vert après). Les audits ne l'avaient pas vu : sur le web, Health Connect
    est « indisponible », le bouton n'est jamais rendu. Banc visuel : `--onboarding=health` (ouvre l'écran ; le bouton
    a été vérifié par un script Playwright qui l'injecte dans le DOM, avant / après).
  - **Notes de Nouveautés du 30–31/10** : `vfc-nuit`, `montre-compacte`, `sources-couleur` → `["play", "sideload"]` ;
    `onboarding-compteur`, `phrases-aide` reformulées pour valoir aussi sur iPhone. Message dans `POUR-IOS.md`.
- Note Nouveautés `2026-11-04-0235-bouton-bienvenue.json` (toutes variantes).

## Vérifications
- `npm run test` 2967 verts (1 nouveau) ; `npm run lint` 0 erreur ; build OK ; `npm run visual` complet ;
  `--play --empty --onboarding=health` et `--play --face=on --onboarding=face` (écran du visage, même classe) lus ;
  captures avant / après du bouton (646 → 52 px).

## Demandes iOS
- Reprises : 29/10 bouton d'onboarding ; 30/10 et 31/10 notes de Nouveautés (5). Non reprises : notes du 29/10
  (antérieures à la version iPhone du 29/10, déjà cachées).

## Suite
- TEST-ALPHA-1 (07–08/11, P42) ; FIN-LANCEMENT-MSG vers le 24/11 ; P37, P44 en attente du propriétaire.

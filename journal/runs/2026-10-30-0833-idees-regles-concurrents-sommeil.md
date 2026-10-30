# Run du 30/10/2026 08:33 (Paris, CET) — Idées : règles Play d'octobre, concurrents 2026, une nuit comptée deux fois

**Type** : 💡 Idées (pas de code produit)

## Constat au démarrage
- Main à `fdc114a` (#521), tous les workflows verts (Tests, Build & Release, Play — AAB, émulateur A56) ; aucune PR
  « [Auto] » ouverte (seule #51, `cursor/*`, non touchée).

## Recherche
- **Règles Google Play** (consigne : à revérifier à chaque run « idées ») : annonces du 15/07 et du 29/10/2026, tableau
  des échéances jusqu'au 25/08/2027. Aucune ne concerne Halcya (détail `IDEES.md` I196, `PLAY-CONFORMITE.md` §0).
  Vérification des développeurs : apps Play à enregistrer depuis le 30/09/2026 (99 % automatiques) → P34 ; version
  GitHub (clé de debug publique) à enregistrer après sa migration de clé → VEILLE-1.
- **Concurrents** (I197) : FoodLog (analyse et PDF premium, fiche mise à jour le 25/10), Plop (local par défaut,
  Bristol, PDF sur l'appareil, aucune montre), trackers « IA » qui envoient les repas à une IA tierce ; Cara Care existe
  sur Android mais seulement comme DiGA sur ordonnance en Allemagne. Huawei n'écrit toujours pas dans Health Connect
  (seulement via Health Sync) : notre différenciateur tient.
- **Sécurité** (I198) : signes d'alarme du SII d'après les synthèses françaises → une phrase statique « Quand
  consulter » (POL-PLAY-60). ameli.fr a refusé la lecture (403).

## Défaut trouvé (I195 → POL-PLAY-59, en tête des runs de code)
- En suivant Health Sync (passerelle Huawei → Health Connect), vérifié dans le code puis par un essai Vitest
  temporaire (supprimé, rien de commité) : `nightlySleep` (`services/radar.js`) et `dailyJournal.js:187` additionnent
  les phases de sommeil de toutes les sources ; une nuit de 7 h vue par la montre et par Health Connect donne
  **840 min**, sous le plafond de 960, donc affichée et analysée. Même famille que les pas du 27/10. Correctif
  spécifié : une source par nuit, choisie à la lecture, aucune donnée effacée.

## Fichiers
- `journal/IDEES.md` (I195–I198), `journal/BACKLOG.md` (POL-PLAY-59, POL-PLAY-60, VEILLE-1),
  `journal/PRODUIT.md` (P34, historique), `journal/PLAY-CONFORMITE.md` (§0 relectures datées), `journal/README.md`.

## Vérifications
- Journal seul ; `npm run test` lancé avant la PR (garde-fou).

## Demandes iOS
- Aucune reprise ce run (rien de visible ; pas de note de Nouveautés).

## Suite
- Prochain run de code : **POL-PLAY-59** (sommeil en double) avant le reste du polissage, puis POL-PLAY-60.
- Prochain run « idées » : relire la page ameli « quand consulter » ; fiche Play à revoir avec I197 (montres et délais
  avant « local »).
